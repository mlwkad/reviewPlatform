<template>
  <div class="recycle-bin">
    <div class="header">
      <h1>回收站</h1>
      <div class="actions">
        <el-button type="primary" @click="handleRestoreAll" :disabled="!hasDeletedTravels">
          全部恢复
        </el-button>
        <el-button type="danger" @click="handleDeleteAll" :disabled="!hasDeletedTravels">
          清空回收站
        </el-button>
      </div>
    </div>

    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 游记列表 -->
    <div v-else-if="hasDeletedTravels" class="travel-list">
      <el-card v-for="travel in deletedTravels" :key="travel.releaseID" class="travel-card">
        <div class="travel-card-content">
          <div class="travel-image">
            <el-image :src="travel.cover || (travel.pictures && travel.pictures[0])" fit="cover"
              :preview-src-list="getPreviewList(travel)" :preview-teleported="true" :initial-index="0"
              :hide-on-click-modal="true" :preview="true" class="cover-image">
              <template #error>
                <div class="image-error">
                  <el-icon>
                    <Picture />
                  </el-icon>
                  <span>加载失败</span>
                </div>
              </template>
              <template #placeholder>
                <div class="image-placeholder">
                  <el-icon class="is-loading">
                    <Loading />
                  </el-icon>
                  <span>加载中...</span>
                </div>
              </template>
            </el-image>
          </div>
          <div class="travel-info">
            <div class="travel-header">
              <h3 class="travel-title">{{ travel.title }}</h3>
              <div class="travel-meta">
                <span class="author">作者：{{ travel.userName }}</span>
                <span class="time">发布时间：{{ formatDate(travel.createdAt) }}</span>
                <el-tag :type="getStatusType(travel.state)">{{
                  getStatusText(travel.state)
                  }}</el-tag>
              </div>
            </div>
            <div class="travel-content">
              {{ travel.content }}
            </div>
            <div class="travel-actions">
              <el-button type="primary" @click="handleRestore(travel.releaseID)"> 恢复 </el-button>
              <el-button type="danger" @click="handleDelete(travel)">
                永久删除
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="回收站为空" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTravelStore } from '@/stores/travel'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Picture, Loading } from '@element-plus/icons-vue'
import { getDeletedReleases, deleteStatus, deleteRelease } from '@/api/api'

const travelStore = useTravelStore()
const userStore = useUserStore()

// 加载状态
const loading = ref(false)

// 获取已删除的游记
const deletedTravels = ref([])

// 判断是否有已删除的游记
const hasDeletedTravels = computed(() => deletedTravels.value.length > 0)

// 加载已删除的游记
const loadDeletedTravels = async () => {
  loading.value = true
  try {
    const res = await getDeletedReleases({ limit: 50, offset: 0 })
    if (res.data && res.data.releases) {
      deletedTravels.value = res.data.releases
    }
  } catch (error) {
    console.error('获取已删除游记失败：', error)
    ElMessage.error('获取已删除游记失败')
  } finally {
    loading.value = false
  }
}

// 获取预览图片列表
const getPreviewList = (travel) => {
  if (!travel.pictures) return []
  return Array.isArray(travel.pictures) ? travel.pictures : [travel.pictures]
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 获取状态对应的标签类型
const getStatusType = (status) => {
  const statusMap = {
    wait: 'warning',
    resolve: 'success',
    reject: 'danger',
  }
  return statusMap[status] || 'info'
}

// 获取状态对应的文本
const getStatusText = (status) => {
  const statusMap = {
    wait: '待审核',
    resolve: '已通过',
    reject: '未通过',
  }
  return statusMap[status] || '未知状态'
}

// 恢复单个游记
const handleRestore = async (releaseID) => {
  try {
    await ElMessageBox.confirm('确定要恢复这篇游记吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })

    const loadingMsg = ElMessage({
      type: 'info',
      message: '正在恢复...',
      duration: 0,
    })

    try {
      // 调用deleteStatus接口恢复游记，1表示恢复
      await deleteStatus(releaseID, { deleteStatus: 1 })

      // 从本地删除列表中移除
      deletedTravels.value = deletedTravels.value.filter((item) => item.releaseID !== releaseID)

      // 同步更新travelStore中的数据
      travelStore.syncRestoreTravel(releaseID)

      loadingMsg.close()
      ElMessage.success('恢复成功')
    } catch (error) {
      loadingMsg.close()
      console.error('恢复失败：', error)
      ElMessage.error('恢复失败，请稍后重试')
    }
  } catch {
    // 取消恢复
  }
}

// 永久删除单个游记
const handleDelete = async (travel) => {
  try {
    await ElMessageBox.confirm('确定要永久删除这篇游记吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error',
    })

    const loadingMsg = ElMessage({
      type: 'info',
      message: '正在删除...',
      duration: 0,
    })

    try {
      // 调用deleteRelease接口永久删除游记
      console.log(travel.releaseID, { userID: travel.userID })
      await deleteRelease(travel.releaseID, { userID: travel.userID })

      // 从本地删除列表中移除
      deletedTravels.value = deletedTravels.value.filter((item) => item.releaseID !== travel.releaseID)

      loadingMsg.close()
      ElMessage.success('永久删除成功')
    } catch (error) {
      loadingMsg.close()
      console.error('删除失败：', error)
      const errorMsg = error.response?.status === 404
        ? '找不到要删除的资源，可能已被删除'
        : '永久删除失败，请稍后重试'
      ElMessage.error(errorMsg)
    }
  } catch {
    // 取消删除
  }
}

// 恢复所有游记
const handleRestoreAll = async () => {
  try {
    await ElMessageBox.confirm('确定要恢复所有游记吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })

    const loadingMsg = ElMessage({
      type: 'info',
      message: '正在恢复所有游记...',
      duration: 0,
    })

    try {
      // 为所有已删除的游记调用恢复API
      const promises = deletedTravels.value.map((travel) =>
        deleteStatus(travel.releaseID, { deleteStatus: 1 }),
      )

      await Promise.all(promises)

      // 强制刷新TravelList的数据
      travelStore.resetDataLoaded()
      travelStore.fetchTravels()

      // 清空本地已删除列表
      deletedTravels.value = []

      loadingMsg.close()
      ElMessage.success('全部恢复成功')
    } catch (error) {
      loadingMsg.close()
      console.error('恢复所有失败：', error)
      ElMessage.error('恢复所有游记失败，请稍后重试')
    }
  } catch {
    // 取消恢复
  }
}

// 清空回收站
const handleDeleteAll = async () => {
  try {
    await ElMessageBox.confirm('确定要清空回收站吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error',
    })

    const loadingMsg = ElMessage({
      type: 'info',
      message: '正在清空回收站...',
      duration: 0,
    })

    try {
      // 为所有已删除的游记调用永久删除API
      const promises = deletedTravels.value.map((travel) =>
        deleteRelease(travel.releaseID, { userID: userStore.user.userID }),
      )

      await Promise.all(promises)

      // 清空本地已删除列表
      deletedTravels.value = []

      loadingMsg.close()
      ElMessage.success('回收站已清空')
    } catch (error) {
      loadingMsg.close()
      console.error('清空回收站失败：', error)
      ElMessage.error('清空回收站失败，请稍后重试')
    }
  } catch {
    // 取消删除
  }
}

// 在组件挂载时加载已删除的游记
onMounted(() => {
  loadDeletedTravels()
})
</script>

<style lang="less" scoped>
.recycle-bin {
  .header {
    position: sticky;
    top: 0;
    background-color: #fff;
    padding: 1rem 0;
    z-index: 100;
    border-bottom: 1px solid #eee;
    padding-left: 10px;
    margin-bottom: 2rem;
    width: 100%;

    h1 {
      margin: 0 0 1rem 0;
    }

    .actions {
      margin-top: 1rem;
    }
  }
}

.loading-container {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 20px;

  .el-skeleton {
    margin-bottom: 30px;
  }
}

.travel-card {
  margin-bottom: 20px;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .travel-card-content {
    display: flex;
    gap: 20px;
    width: 100%;
  }
}

.travel-image {
  width: 200px;
  height: 150px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  .cover-image {
    width: 100%;
    height: 100%;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
}

.image-error,
.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  gap: 8px;

  .el-icon {
    font-size: 24px;
  }

  span {
    font-size: 14px;
  }
}

.travel-info {
  flex: 1;
  display: flex;
  flex-direction: column;

  .travel-header {
    margin-bottom: 10px;
  }

  .travel-title {
    margin: 0 0 10px 0;
    font-size: 18px;
    color: #303133;
  }

  .travel-meta {
    display: flex;
    align-items: center;
    gap: 15px;
    color: #606266;
    font-size: 14px;
    flex-wrap: wrap;
    row-gap: 8px;
  }

  .travel-content {
    flex: 1;
    color: #606266;
    margin: 10px 0;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
  }

  .travel-actions {
    display: flex;
    gap: 10px;
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  width: 100%;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
  width: 100%;
}

// 添加图片预览相关样式
:deep(.el-image-viewer__wrapper) {
  .el-image-viewer__btn {
    opacity: 0.8;

    &:hover {
      opacity: 1;
    }
  }

  .el-image-viewer__canvas {
    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }
}
</style>

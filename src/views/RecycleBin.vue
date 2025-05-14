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

    <div class="travel-list">
      <el-card v-for="travel in deletedTravels" :key="travel.id" class="travel-card">
        <div class="travel-card-content">
          <div class="travel-image">
            <el-image 
              :src="travel.coverImage" 
              fit="cover"
              :preview-src-list="travel.images"
              class="cover-image"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
              <template #placeholder>
                <div class="image-placeholder">
                  <el-icon class="is-loading"><Loading /></el-icon>
                  <span>加载中...</span>
                </div>
              </template>
            </el-image>
          </div>
          <div class="travel-info">
            <div class="travel-header">
              <h3 class="travel-title">{{ travel.title }}</h3>
              <div class="travel-meta">
                <span class="author">作者：{{ travel.author }}</span>
                <span class="time">发布时间：{{ formatDate(travel.createTime) }}</span>
                <el-tag :type="getStatusType(travel.status)">{{ getStatusText(travel.status) }}</el-tag>
              </div>
            </div>
            <div class="travel-content">
              {{ travel.content }}
            </div>
            <div class="travel-actions">
              <el-button type="primary" @click="handleRestore(travel.id)">
                恢复
              </el-button>
              <el-button type="danger" @click="handleDelete(travel.id)">
                永久删除
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="!hasDeletedTravels" class="empty-state">
      <el-empty description="回收站为空" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTravelStore } from '@/stores/travel'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Picture, Loading } from '@element-plus/icons-vue'

const travelStore = useTravelStore()

// 获取已删除的游记
const deletedTravels = computed(() => travelStore.getDeletedTravels())

// 判断是否有已删除的游记
const hasDeletedTravels = computed(() => deletedTravels.value.length > 0)

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取状态对应的标签类型
const getStatusType = (status) => {
  const statusMap = {
    wait: 'warning',
    resolve: 'success',
    reject: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态对应的文本
const getStatusText = (status) => {
  const statusMap = {
    wait: '待审核',
    resolve: '已通过',
    reject: '未通过'
  }
  return statusMap[status] || '未知状态'
}

// 恢复单个游记
const handleRestore = (releaseID) => {
  ElMessageBox.confirm(
    '确定要恢复这篇游记吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    travelStore.restoreTravel(releaseID)
    ElMessage({
      type: 'success',
      message: '恢复成功'
    })
  }).catch(() => {
    // 取消恢复
  })
}

// 永久删除单个游记
const handleDelete = (releaseID) => {
  ElMessageBox.confirm(
    '确定要永久删除这篇游记吗？此操作不可恢复！',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    travelStore.permanentDelete(releaseID)
    ElMessage({
      type: 'success',
      message: '删除成功'
    })
  }).catch(() => {
    // 取消删除
  })
}

// 恢复所有游记
const handleRestoreAll = () => {
  ElMessageBox.confirm(
    '确定要恢复所有游记吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    deletedTravels.value.forEach(travel => {
      travelStore.restoreTravel(travel.releaseID)
    })
    ElMessage({
      type: 'success',
      message: '全部恢复成功'
    })
  }).catch(() => {
    // 取消恢复
  })
}

// 清空回收站
const handleDeleteAll = () => {
  ElMessageBox.confirm(
    '确定要清空回收站吗？此操作不可恢复！',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    deletedTravels.value.forEach(travel => {
      travelStore.permanentDelete(travel.releaseID)
    })
    ElMessage({
      type: 'success',
      message: '回收站已清空'
    })
  }).catch(() => {
    // 取消删除
  })
}
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
</style> 
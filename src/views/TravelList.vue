<script setup>
import { ref, onMounted, onBeforeMount, computed, nextTick } from 'vue'
import { useTravelStore } from '@/stores/travel'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Picture, Loading } from '@element-plus/icons-vue'
import { getAllRealeases, updateState } from '../api/api'
const travelStore = useTravelStore()
const userStore = useUserStore()

const showRejectDialog = ref(false)
const currentTravel = ref(null)
const rejectReason = ref('')

// 分页相关
const allReleases = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const currentStatus = ref('all')

const showDetailDialog = ref(false)
const currentTravelDetail = ref(null)
const currentImageIndex = ref(0)

const releases = ref([])
const pagination = ref({
  limit: 50,
  offset: 0,
  total: 0,
})

onBeforeMount(async () => {
  try {
    const res = await getAllRealeases({ limit: 10, offset: 0 })
    if (res.data) {
      allReleases.value = res.data.releases
      pagination.value = res.data.pagination
    }
  } catch (error) {
    console.error('获取数据失败：', error)
    ElMessage.error('获取游记列表失败')
  }
})

onMounted(async () => {
  console.log('开始请求数据...')
  try {
    const res = await getAllRealeases({ limit: 13, offset: 0 })
    console.log('获取到的数据：', res)
    if (res.data) {
      releases.value = res.data.releases
      pagination.value = res.data.pagination
    }
  } catch (error) {
    console.error('请求错误：', error)
    ElMessage.error('获取游记列表失败')
  }
})

const handleView = (releaseID) => {
  const travel = allReleases.value.find((t) => t.releaseID === releaseID)
  if (travel) {
    currentTravelDetail.value = travel
    showDetailDialog.value = true
  }
}

// 关闭详情对话框
const closeDetailDialog = () => {
  showDetailDialog.value = false
  currentTravelDetail.value = null
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

// 处理通过操作
const handleApprove = async (releaseID) => {
  try {
    await ElMessageBox.confirm('确定要通过这篇游记吗？', '审核确认', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'info',
    })

    // 显示加载中
    const loading = ElMessage({
      message: '正在处理...',
      type: 'info',
      duration: 0,
    })

    try {
      // 调用API更新状态
      await updateState(releaseID, {
        state: 'resolve',
        reason: '',
      })

      // 关闭加载提示
      loading.close()

      // 显示成功消息
      ElMessage({
        type: 'success',
        message: '游记已通过审核',
      })

      // 重新加载数据
      await loadData()
    } catch (error) {
      // 关闭加载提示
      loading.close()

      console.error('更新状态失败：', error)
      ElMessage({
        type: 'error',
        message: '操作失败，请稍后重试',
      })
    }
  } catch {
    // 用户取消操作，不需要做任何处理
  }
}

// 处理拒绝操作
const handleReject = async (releaseID) => {
  try {
    // 弹出输入框，获取拒绝原因
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '审核拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入拒绝原因...',
      inputPattern: /^.{1,200}$/,
      inputErrorMessage: '拒绝原因不能为空，且不能超过200个字符',
      type: 'warning',
    })

    // 显示加载中
    const loading = ElMessage({
      message: '正在处理...',
      type: 'info',
      duration: 0,
    })

    try {
      // 调用API更新状态
      await updateState(releaseID, {
        state: 'reject',
        reason: reason.trim(),
      })

      // 关闭加载提示
      loading.close()

      // 显示成功消息
      ElMessage({
        type: 'success',
        message: '已拒绝该游记',
      })

      // 重新加载数据
      await loadData()
    } catch (error) {
      // 关闭加载提示
      loading.close()

      console.error('更新状态失败：', error)
      ElMessage({
        type: 'error',
        message: '操作失败，请稍后重试',
      })
    }
  } catch {
    // 用户取消操作，不需要做任何处理
  }
}

const handleDelete = (travel) => {
  ElMessageBox.confirm('确定要删除这篇游记吗？删除后可以在回收站中恢复。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      // 调用 store 中的逻辑删除方法
      travelStore.logicDelete(travel.id)
      ElMessage({
        type: 'success',
        message: '删除成功',
      })
    })
    .catch(() => {
      // 取消删除
    })
}

const filteredTravels = computed(() => {
  return travelStore.travels.filter((travel) => {
    // 首先过滤掉已删除的记录
    if (travel.isDeleted) return false

    // 然后根据状态过滤
    if (travelStore.currentStatus === 'all') return true
    return travel.status === travelStore.currentStatus
  })
})

// 计算当前页的数据
const paginatedReleases = computed(() => {
  const filteredData =
    currentStatus.value === 'all'
      ? allReleases.value
      : allReleases.value.filter((item) => item.state === currentStatus.value)

  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.slice(start, end)
})

// 计算总条数
const total = computed(() => {
  return currentStatus.value === 'all'
    ? allReleases.value.length
    : allReleases.value.filter((item) => item.state === currentStatus.value).length
})

// 加载数据的函数
const loadData = async () => {
  try {
    const res = await getAllRealeases()
    console.log('API返回数据：', res)

    if (res.data) {
      allReleases.value = res.data.releases
      console.log('总数据：', allReleases.value.length)
      console.log('当前页码：', currentPage.value)
      console.log('每页条数：', pageSize.value)
    }
  } catch (error) {
    console.error('获取数据失败：', error)
    ElMessage.error('获取游记列表失败')
  }
}

// 滚动到顶部
const scrollToTop = () => {
  const container = document.querySelector('.travel-list')
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  // 同时也设置 body 的滚动
  document.body.scrollTop = 0 // For Safari
  document.documentElement.scrollTop = 0 // For Chrome, Firefox, IE and Opera
}

// 处理页码改变
const handleCurrentChange = (val) => {
  console.log('页码改变：', val)
  currentPage.value = val
  nextTick(() => {
    scrollToTop()
  })
}

// 处理每页条数改变
const handleSizeChange = (val) => {
  console.log('每页条数改变：', val)
  pageSize.value = val
  currentPage.value = 1
  nextTick(() => {
    scrollToTop()
  })
}

// 处理状态筛选改变
const handleStatusChange = (val) => {
  console.log('状态筛选改变：', val)
  currentStatus.value = val
  currentPage.value = 1
  nextTick(() => {
    scrollToTop()
  })
}

// 在组件挂载时加载数据
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="travel-list">
    <div class="header">
      <h1>游记列表</h1>
      <div class="filters">
        <el-radio-group v-model="currentStatus" @change="handleStatusChange">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="wait">待审核</el-radio-button>
          <el-radio-button value="resolve">已通过</el-radio-button>
          <el-radio-button value="reject">未通过</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="travel-list">
      <el-card v-for="travel in paginatedReleases" :key="travel.releaseID" class="travel-card">
        <div class="travel-card-content">
          <div
            class="travel-image"
            v-if="travel.cover || (travel.pictures && travel.pictures.length)"
          >
            <el-image
              :src="
                travel.cover ||
                (Array.isArray(travel.pictures) ? travel.pictures[0] : travel.pictures)
              "
              fit="cover"
              :preview-src-list="
                Array.isArray(travel.pictures) ? travel.pictures : [travel.pictures]
              "
              :preview-teleported="true"
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
                <span class="author">作者：{{ travel.userName }}</span>
                <span class="location" v-if="travel.location">地点：{{ travel.location }}</span>
                <span class="time">发布时间：{{ formatDate(travel.createdAt) }}</span>
                <el-tag :type="getStatusType(travel.state)">{{
                  getStatusText(travel.state)
                }}</el-tag>
                <span v-if="travel.reason" class="reject-reason"
                  >拒绝原因：{{ travel.reason }}</span
                >
              </div>
            </div>
            <div class="travel-content">
              {{ travel.content }}
            </div>
            <div class="travel-actions">
              <el-button
                v-if="travel.state === 'wait'"
                type="primary"
                @click="handleApprove(travel.releaseID)"
              >
                通过
              </el-button>
              <el-button
                v-if="travel.state === 'wait'"
                type="danger"
                @click="handleReject(travel.releaseID)"
              >
                拒绝
              </el-button>
              <el-button type="primary" @click="handleView(travel.releaseID)"> 查看详情 </el-button>
              <el-button
                v-if="userStore.user.role === 'admin'"
                type="danger"
                @click="handleDelete(travel)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 拒绝原因对话框 -->
    <el-dialog v-model="showRejectDialog" title="请输入拒绝原因" width="30%">
      <el-input v-model="rejectReason" type="textarea" :rows="4" placeholder="请输入拒绝原因..." />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showRejectDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmReject" :disabled="!rejectReason">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 游记详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="游记详情"
      width="70%"
      :before-close="closeDetailDialog"
      class="travel-detail-dialog"
    >
      <div v-if="currentTravelDetail" class="travel-detail">
        <div class="detail-header">
          <h2>{{ currentTravelDetail.title }}</h2>
          <div class="detail-meta">
            <el-tag :type="getStatusType(currentTravelDetail.state)">
              {{ getStatusText(currentTravelDetail.state) }}
            </el-tag>
            <span class="author">作者：{{ currentTravelDetail.userName }}</span>
            <span class="time">发布时间：{{ formatDate(currentTravelDetail.createdAt) }}</span>
          </div>
        </div>

        <div class="detail-content">
          <!-- 图片展示 -->
          <div
            v-if="currentTravelDetail.pictures && currentTravelDetail.pictures.length"
            class="detail-images"
          >
            <!-- 主图展示 -->
            <div class="main-image">
              <el-image
                :src="
                  Array.isArray(currentTravelDetail.pictures)
                    ? currentTravelDetail.pictures[currentImageIndex]
                    : currentTravelDetail.pictures
                "
                fit="contain"
                :preview-src-list="
                  Array.isArray(currentTravelDetail.pictures)
                    ? currentTravelDetail.pictures
                    : [currentTravelDetail.pictures]
                "
                :initial-index="currentImageIndex"
                class="featured-image"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                    <span>图片加载失败</span>
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

            <!-- 缩略图列表 -->
            <div
              class="thumbnail-list"
              v-if="
                Array.isArray(currentTravelDetail.pictures) &&
                currentTravelDetail.pictures.length > 1
              "
            >
              <div
                v-for="(image, index) in currentTravelDetail.pictures"
                :key="index"
                class="thumbnail-item"
                :class="{ active: currentImageIndex === index }"
                @click="currentImageIndex = index"
              >
                <el-image :src="image" fit="cover">
                  <template #error>
                    <div class="thumb-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                  <template #placeholder>
                    <div class="thumb-placeholder">
                      <el-icon class="is-loading"><Loading /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
            </div>
          </div>

          <!-- 视频播放 -->
          <div v-if="currentTravelDetail.videos?.length" class="detail-videos">
            <div
              v-for="(video, index) in currentTravelDetail.videos"
              :key="index"
              class="video-container"
            >
              <video controls :src="video" class="travel-video" preload="metadata">
                您的浏览器不支持视频播放
              </video>
            </div>
          </div>

          <div class="detail-text">
            {{ currentTravelDetail.content }}
          </div>

          <div v-if="currentTravelDetail.reason" class="reject-reason-box">
            <el-alert
              title="拒绝原因"
              type="error"
              :description="currentTravelDetail.reason"
              show-icon
            />
          </div>
        </div>

        <div class="detail-footer">
          <el-button @click="closeDetailDialog">关闭</el-button>
          <template v-if="currentTravelDetail.state === 'wait'">
            <el-button type="primary" @click="handleApprove(currentTravelDetail.releaseID)"
              >通过</el-button
            >
            <el-button type="danger" @click="handleReject(currentTravelDetail.releaseID)"
              >拒绝</el-button
            >
          </template>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
.travel-list {
  position: relative;
  min-height: 100vh;
  padding: 10px;
  background-color: #f5f7fa;

  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: #fff;
    padding: 1rem 0;
    border-bottom: 1px solid #eee;
    padding-left: 10px;
    width: 100%;
    h1 {
      margin: 0 0 1rem 0;
    }
    .filters {
      margin-top: 1rem;
    }
  }
}

.travel-card {
  margin-bottom: 10px;
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
    .el-tag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 6px 12px;
      font-size: 14px;
      border-radius: 4px;
      height: 32px;
      svg {
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }
    }
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
  position: sticky;
  bottom: 20px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 100;
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.reject-reason {
  color: #f56c6c;
}

// 详情对话框样式
.travel-detail-dialog {
  .el-dialog {
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    margin-top: 2vh !important; /* 更靠近顶部 */
    top: 20px;

    &__header {
      border-bottom: 1px solid #f0f0f0;
      padding: 16px 24px;

      .el-dialog__title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }

      .el-dialog__headerbtn {
        top: 16px;
      }
    }

    &__body {
      padding: 0;
    }
  }

  .travel-detail {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 0 24px;

    .detail-header {
      padding: 16px 0;
      border-bottom: 1px solid #f5f5f5;

      h2 {
        margin: 0 0 12px 0;
        font-size: 22px;
        color: #333;
        line-height: 1.4;
      }

      .detail-meta {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 13px;
        color: #666;

        .el-tag {
          height: 24px;
          line-height: 22px;
          font-size: 12px;
        }

        .author,
        .time {
          display: flex;
          align-items: center;

          &::before {
            content: '•';
            margin-right: 8px;
            color: #999;
          }
        }
      }
    }

    .detail-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px 0;

      .detail-images {
        margin-bottom: 24px;

        .main-image {
          width: 100%;
          height: 400px;
          margin-bottom: 12px;
          border-radius: 4px;
          overflow: hidden;
          background-color: #f9f9f9;
          display: flex;
          justify-content: center;
          align-items: center;

          .featured-image {
            width: 100%;
            height: 100%;
            object-fit: contain;

            .image-error,
            .image-placeholder {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
              color: #999;

              .el-icon {
                font-size: 48px;
                margin-bottom: 8px;
              }
            }
          }
        }

        .thumbnail-list {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 8px 0;

          .thumbnail-item {
            width: 80px;
            height: 60px;
            border-radius: 4px;
            overflow: hidden;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.3s;
            flex-shrink: 0;

            &.active {
              border-color: #409eff;
            }

            .el-image {
              width: 100%;
              height: 100%;

              .thumb-error,
              .thumb-placeholder {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                background-color: #f5f5f5;

                .el-icon {
                  font-size: 20px;
                  color: #ccc;
                }
              }
            }
          }
        }
      }

      .detail-videos {
        margin-bottom: 24px;

        .video-container {
          width: 100%;
          margin-bottom: 16px;

          .travel-video {
            width: 100%;
            max-height: 400px;
            border-radius: 4px;
            background-color: #000;
          }
        }
      }

      .detail-text {
        white-space: pre-wrap;
        line-height: 1.8;
        color: #333;
        font-size: 14px;
        padding: 16px 0;
        border-top: 1px solid #f5f5f5;
      }

      .reject-reason-box {
        margin-top: 16px;

        .el-alert {
          border-radius: 4px;
        }
      }
    }

    .detail-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 0;
      border-top: 1px solid #f5f5f5;

      .el-button {
        min-width: 80px;
      }
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .travel-detail-dialog {
    .el-dialog {
      width: 90% !important;
      max-height: 80vh;

      &__body {
        padding: 0 16px;
      }
    }

    .travel-detail {
      .detail-header {
        h2 {
          font-size: 18px;
        }
      }

      .detail-content {
        .detail-images {
          .main-image {
            height: 300px;
          }

          .thumbnail-list {
            .thumbnail-item {
              width: 60px;
              height: 45px;
            }
          }
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

:deep(.el-carousel__item) {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-carousel__item--card) {
  &.is-active {
    transform: translateX(0) scale(1.1) !important;
  }
}
</style>

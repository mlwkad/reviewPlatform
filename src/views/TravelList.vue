<script setup>
// 导入所需的 Vue 组件和工具
import { ref, onMounted, onBeforeMount, computed, nextTick } from 'vue'
// 导入状态管理
import { useTravelStore } from '@/stores/travel'
import { useUserStore } from '@/stores/user'
// 导入 Element Plus 组件
import { ElMessageBox, ElMessage } from 'element-plus'
import { Picture, Loading } from '@element-plus/icons-vue'
// 导入 API 方法
import { getAllRealeases, updateState, deleteStatus } from '@/api/api'

// 初始化 store
const travelStore = useTravelStore()
const userStore = useUserStore()

// 拒绝对话框相关状态
const showRejectDialog = ref(false)
const rejectReason = ref('')

// 分页相关状态
const currentPage = ref(1) // 当前页码
const pageSize = ref(10) // 每页显示条数
const currentStatus = ref('all') // 当前筛选状态

// 详情对话框相关状态
const showDetailDialog = ref(false) // 是否显示详情对话框
const currentTravelDetail = ref(null) // 当前查看的游记详情
const currentImageIndex = ref(0) // 当前查看的图片索引

// 数据相关状态
const releases = ref([]) // 游记列表数据
const pagination = ref({
  // 分页信息
  limit: 50,
  offset: 0,
  total: 0,
})

// // 组件挂载时加载数据
// onMounted(async () => {
//   console.log('开始请求数据...')
//   try {
//     const res = await getAllRealeases({ limit: 13, offset: 0 })
//     if (res.data) {
//       releases.value = res.data.releases
//       pagination.value = res.data.pagination
//     }
//   } catch (error) {
//     console.error('请求错误：', error)
//     ElMessage.error('获取游记列表失败')
//   }
// })

// 查看游记详情
const handleView = (releaseID) => {
  const travel = travelStore.travels.find((t) => t.releaseID === releaseID)
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

// 格式化日期显示
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
  return travelStore.getStatusType(status)
}

// 获取状态对应的文本
const getStatusText = (status) => {
  return travelStore.getStatusText(status)
}

// 处理通过操作
const handleApprove = async (releaseID) => {
  try {
    // 显示确认对话框
    await ElMessageBox.confirm('确定要通过这篇游记吗？', '审核确认', {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'info',
    })

    // 显示加载提示
    const loading = ElMessage({
      message: '正在处理...',
      type: 'info',
      duration: 0,
    })

    try {
      // 更新状态为已通过，并清除拒绝原因
      await travelStore.updateTravelStatus(releaseID, 'resolve', '')
      loading.close()
      ElMessage.success('游记已通过审核')
    } catch (error) {
      loading.close()
      console.error('更新状态失败：', error)
      ElMessage.error('操作失败，请稍后重试')
    }
  } catch {
    // 用户取消操作，不做处理
  }
}

// 处理拒绝操作
const handleReject = async (releaseID) => {
  try {
    // 弹出输入框获取拒绝原因
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '审核拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入拒绝原因...',
      inputPattern: /^.{1,200}$/,
      inputErrorMessage: '拒绝原因不能为空,且不能超过200个字符',
      type: 'warning',
    })

    // 显示加载提示
    const loading = ElMessage({
      message: '正在处理...',
      type: 'info',
      duration: 0,
    })

    try {
      // 更新状态为已拒绝
      await travelStore.updateTravelStatus(releaseID, 'reject', reason.trim())
      loading.close()
      ElMessage.success('已拒绝该游记')
    } catch (error) {
      loading.close()
      console.error('更新状态失败：', error)
      ElMessage.error('操作失败，请稍后重试')
    }
  } catch {
    // 用户取消操作，不做处理
  }
}

// 处理删除操作
const handleDelete = async (travel) => {
  try {
    // 显示确认对话框
    await ElMessageBox.confirm('确定要删除这篇游记吗？删除后可以在回收站中恢复。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 显示加载提示
    const loading = ElMessage({
      message: '正在处理...',
      type: 'info',
      duration: 0,
    })

    try {
      // 调用deleteStatus接口实现逻辑删除，0表示删除
      await deleteStatus(travel.releaseID, { deleteStatus: 0 })

      // 本地状态更新
      await travelStore.logicDelete(travel.releaseID)

      loading.close()
      ElMessage.success('删除成功，已移至回收站')
    } catch (error) {
      loading.close()
      console.error('删除失败：', error)
      ElMessage.error('删除失败，请稍后重试')
    }
  } catch {
    // 用户取消操作，不做处理
  }
}

// 计算过滤后的游记列表
const filteredTravels = computed(() => {
  return travelStore.travels.filter((travel) => {
    // 过滤掉已删除的记录
    if (travel.isDeleted) return false
    // 根据状态过滤
    if (travelStore.currentStatus === 'all') return true
    return travel.status === travelStore.currentStatus
  })
})

// 计算当前页的数据
const paginatedReleases = computed(() => {
  const filteredData = travelStore.filteredTravels
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.slice(start, end)
})

// 计算总条数
const total = computed(() => {
  return travelStore.filteredTravels.length
})

// 加载数据函数
const loadData = async () => {
  try {
    // 强制重新获取数据
    travelStore.resetDataLoaded()
    await travelStore.fetchTravels()
  } catch (error) {
    console.error('获取数据失败：', error)
    ElMessage.error('获取游记列表失败')
  }
}

// 监听页面获得焦点事件，刷新数据
const setupVisibilityListener = () => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadData()
    }
  })
}

// 滚动到顶部
const scrollToTop = () => {
  const container = document.querySelector('.travel-list')
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  // 设置 body 的滚动
  document.body.scrollTop = 0 // Safari
  document.documentElement.scrollTop = 0 // Chrome, Firefox, IE and Opera
}

// 处理页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  nextTick(() => {
    scrollToTop()
  })
}

// 处理每页条数改变
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  nextTick(() => {
    scrollToTop()
  })
}

// 处理状态筛选改变
const handleStatusChange = (val) => {
  travelStore.setCurrentStatus(val)
  currentPage.value = 1
  nextTick(() => {
    scrollToTop()
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
  setupVisibilityListener()
})

// 组件卸载时移除事件监听
onBeforeMount(() => {
  document.removeEventListener('visibilitychange', setupVisibilityListener)
})
</script>

<template>
  <!-- 游记列表主容器 -->
  <div class="travel-list">
    <!-- 头部区域：标题和筛选器 -->
    <div class="header">
      <h1>游记列表</h1>
      <div class="filters">
        <!-- 状态筛选按钮组 -->
        <el-radio-group v-model="travelStore.currentStatus" @change="handleStatusChange">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="wait">待审核</el-radio-button>
          <el-radio-button value="resolve">已通过</el-radio-button>
          <el-radio-button value="reject">未通过</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 游记卡片列表 -->
    <div class="travel-list">
      <!-- 遍历显示游记卡片 -->
      <el-card v-for="travel in paginatedReleases" :key="travel.releaseID" class="travel-card">
        <div class="travel-card-content">
          <!-- 游记封面图片 -->
          <div class="travel-image" v-if="travel.cover || (travel.pictures && travel.pictures.length)">
            <el-image :src="travel.cover ||
              (Array.isArray(travel.pictures) ? travel.pictures[0] : travel.pictures)
              " fit="cover" :preview-src-list="Array.isArray(travel.pictures) ? travel.pictures : [travel.pictures]
                " :preview-teleported="true" class="cover-image">
              <!-- 图片加载失败时显示 -->
              <template #error>
                <div class="image-error">
                  <el-icon>
                    <Picture />
                  </el-icon>
                  <span>加载失败</span>
                </div>
              </template>
              <!-- 图片加载中显示 -->
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

          <!-- 游记信息区域 -->
          <div class="travel-info">
            <!-- 游记标题和元信息 -->
            <div class="travel-header">
              <h3 class="travel-title">{{ travel.title }}</h3>
              <div class="travel-meta">
                <span class="author">作者：{{ travel.userName }}</span>
                <span class="location" v-if="travel.location">地点：{{ travel.location }}</span>
                <span class="time">发布时间：{{ formatDate(travel.createdAt) }}</span>
                <!-- 状态标签 -->
                <el-tag :type="getStatusType(travel.state)">{{
                  getStatusText(travel.state)
                  }}</el-tag>
                <!-- 拒绝原因（如果有且状态为reject） -->
                <span v-if="travel.reason && travel.state === 'reject'" class="reject-reason">拒绝原因：{{ travel.reason
                  }}</span>
              </div>
            </div>

            <!-- 游记内容预览 -->
            <div class="travel-content">
              {{ travel.content }}
            </div>

            <!-- 操作按钮组 -->
            <div class="travel-actions">
              <!-- 待审核或被拒绝状态显示通过和拒绝按钮 -->
              <el-button v-if="travel.state === 'wait' || travel.state === 'reject'" type="primary"
                @click="handleApprove(travel.releaseID)">
                通过
              </el-button>
              <el-button v-if="travel.state === 'wait'" type="danger" @click="handleReject(travel.releaseID)">
                拒绝
              </el-button>
              <!-- 查看详情按钮 -->
              <el-button type="primary" @click="handleView(travel.releaseID)">查看详情</el-button>
              <!-- 管理员可见的删除按钮 -->
              <el-button v-if="userStore.user.role === 'admin'" type="danger" @click="handleDelete(travel)">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分页器 -->
    <div class="pagination-container">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 30, 50]"
        :total="total" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
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
    <el-dialog v-model="showDetailDialog" title="游记详情" width="70%" :before-close="closeDetailDialog"
      class="travel-detail-dialog">
      <div v-if="currentTravelDetail" class="travel-detail">
        <!-- 详情头部 -->
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

        <!-- 详情内容区域 -->
        <div class="detail-content">
          <!-- 图片展示区域 -->
          <div v-if="currentTravelDetail.pictures && currentTravelDetail.pictures.length" class="detail-images">
            <!-- 主图展示 -->
            <div class="main-image">
              <el-image :src="Array.isArray(currentTravelDetail.pictures)
                  ? currentTravelDetail.pictures[currentImageIndex]
                  : currentTravelDetail.pictures
                " fit="contain" :preview-src-list="Array.isArray(currentTravelDetail.pictures)
                    ? currentTravelDetail.pictures
                    : [currentTravelDetail.pictures]
                  " :initial-index="currentImageIndex" class="featured-image">
                <!-- 图片加载失败显示 -->
                <template #error>
                  <div class="image-error">
                    <el-icon>
                      <Picture />
                    </el-icon>
                    <span>图片加载失败</span>
                  </div>
                </template>
                <!-- 图片加载中显示 -->
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

            <!-- 缩略图列表 -->
            <div class="thumbnail-list" v-if="
              Array.isArray(currentTravelDetail.pictures) &&
              currentTravelDetail.pictures.length > 1
            ">
              <div v-for="(image, index) in currentTravelDetail.pictures" :key="index" class="thumbnail-item"
                :class="{ active: currentImageIndex === index }" @click="currentImageIndex = index">
                <el-image :src="image" fit="cover">
                  <!-- 缩略图加载失败显示 -->
                  <template #error>
                    <div class="thumb-error">
                      <el-icon>
                        <Picture />
                      </el-icon>
                    </div>
                  </template>
                  <!-- 缩略图加载中显示 -->
                  <template #placeholder>
                    <div class="thumb-placeholder">
                      <el-icon class="is-loading">
                        <Loading />
                      </el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
            </div>
          </div>

          <!-- 视频播放区域 -->
          <div v-if="currentTravelDetail.videos?.length" class="detail-videos">
            <div v-for="(video, index) in currentTravelDetail.videos" :key="index" class="video-container">
              <video controls :src="video" class="travel-video" preload="metadata">
                您的浏览器不支持视频播放
              </video>
            </div>
          </div>

          <!-- 游记文本内容 -->
          <div class="detail-text">
            {{ currentTravelDetail.content }}
          </div>

          <!-- 拒绝原因显示（如果有且状态为reject） -->
          <div v-if="currentTravelDetail.reason && currentTravelDetail.state === 'reject'" class="reject-reason-box">
            <el-alert title="拒绝原因" type="error" :description="currentTravelDetail.reason" show-icon />
          </div>
        </div>

        <!-- 详情对话框底部按钮 -->
        <div class="detail-footer">
          <el-button @click="closeDetailDialog">关闭</el-button>
          <!-- 待审核或被拒绝状态显示操作按钮 -->
          <template v-if="currentTravelDetail.state === 'wait' || currentTravelDetail.state === 'reject'">
            <el-button type="primary" @click="handleApprove(currentTravelDetail.releaseID)">
              通过
            </el-button>
            <el-button v-if="currentTravelDetail.state === 'wait'" type="danger"
              @click="handleReject(currentTravelDetail.releaseID)">
              拒绝
            </el-button>
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
    margin-top: 2vh !important;
    /* 更靠近顶部 */
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

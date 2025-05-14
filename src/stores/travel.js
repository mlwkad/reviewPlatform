import { defineStore } from 'pinia'
import { getAllRealeases, updateState, deleteStatus } from '@/api/api'
import { ElMessage } from 'element-plus'

const DELETED_TRAVELS_KEY = 'travel_diary_deleted_travels'

// 状态映射
const STATE_MAP = {
  wait: { text: '待审核', type: 'warning' },
  resolve: { text: '已通过', type: 'success' },
  reject: { text: '未通过', type: 'danger' },
}

// 拒绝原因列表
const REJECT_REASONS = [
  '内容不符合规范',
  '图片质量不佳',
  '文字描述过于简单',
  '存在不当内容',
  '重复发布',
  '信息不完整',
  '格式不规范',
  '内容与主题不符',
]

// 获取随机状态和拒绝原因
const getRandomState = () => {
  const random = Math.random()
  if (random < 0.4) return { state: 'wait' } // 40% 待审核
  if (random < 0.8) return { state: 'resolve' } // 40% 已通过
  // 20% 未通过，并添加随机拒绝原因
  const randomReason = REJECT_REASONS[Math.floor(Math.random() * REJECT_REASONS.length)]
  return { state: 'reject', reason: randomReason }
}

export const useTravelStore = defineStore('travel', {
  state: () => ({
    travels: [],
    deletedTravels: JSON.parse(localStorage.getItem(DELETED_TRAVELS_KEY) || '[]'),
    currentStatus: 'all',
    loading: false,
    error: null,
    isDataLoaded: false,
  }),

  getters: {
    // 获取状态文本
    getStatusText: () => (state) => STATE_MAP[state]?.text || '未知状态',

    // 获取状态类型
    getStatusType: () => (state) => STATE_MAP[state]?.type || 'info',

    // 获取过滤后的游记列表
    filteredTravels: (state) => {
      return state.travels.filter((travel) => {
        if (travel.isDeleted) return false
        if (state.currentStatus === 'all') return true
        return travel.state === state.currentStatus
      })
    },
  },

  actions: {
    async fetchTravels() {
      if (this.isDataLoaded) {
        return
      }

      this.loading = true
      try {
        const firstRes = await getAllRealeases({ limit: 50, offset: 0 })
        const secondRes = await getAllRealeases({ limit: 50, offset: 50 })
        
        // 组合两次请求的数据
        const combinedReleases = [...(firstRes.data?.releases || []), ...(secondRes.data?.releases || [])]
        console.log('API 返回的原始数据 (combined):', { 
          releases: combinedReleases, 
          pagination: firstRes.data?.pagination 
        })

        if (combinedReleases.length > 0) {
          // 使用原有状态，不再随机分配
          const travelsWithState = combinedReleases.map((travel) => {
            // 标记已删除的游记
            const isDeleted = travel.deleteStatus === 0

            return {
              ...travel,
              // 保留原有状态，如果没有则默认为'wait'
              state: travel.state || 'wait',
              // 保留原有拒绝原因（如果有）
              reason: travel.reason || '',
              isDeleted,
            }
          })

          console.log('处理后的游记数据：', travelsWithState) // 添加处理后的数据日志
          this.travels = travelsWithState
          this.isDataLoaded = true
        }
      } catch (error) {
        console.error('获取游记列表失败：', error)
        this.error = error.message
        ElMessage.error('获取游记列表失败')
      } finally {
        this.loading = false
      }
    },

    resetDataLoaded() {
      this.isDataLoaded = false
      this.travels = []
    },

    setCurrentStatus(status) {
      this.currentStatus = status
    },

    // 更新游记状态
    async updateTravelStatus(releaseID, state, reason = '') {
      try {
        // 验证状态是否有效
        if (!STATE_MAP[state]) {
          throw new Error('无效的状态值')
        }

        console.log('更新游记状态：', { releaseID, state, reason }) // 添加状态更新日志
        await updateState(releaseID, { state, reason })

        const travel = this.travels.find((t) => t.releaseID === releaseID)
        if (travel) {
          travel.state = state
          if (reason) {
            travel.reason = reason
          } else {
            // 如果没有提供原因，清除现有原因
            travel.reason = ''
          }
          console.log('更新后的游记：', travel) // 添加更新后的游记日志
        }
      } catch (error) {
        console.error('更新游记状态失败:', error)
        throw error
      }
    },

    // 逻辑删除游记
    async logicDelete(releaseID) {
      try {
        const travel = this.travels.find((t) => t.releaseID === releaseID)
        if (travel) {
          travel.isDeleted = true
          // 添加到已删除列表
          this.deletedTravels.push(travel)
          // 保存到 localStorage
          localStorage.setItem(DELETED_TRAVELS_KEY, JSON.stringify(this.deletedTravels))
        }
      } catch (error) {
        console.error('删除游记失败:', error)
        throw error
      }
    },

    // 恢复已删除的游记
    restoreTravel(releaseID) {
      const travel = this.deletedTravels.find((t) => t.releaseID === releaseID)
      if (travel) {
        travel.isDeleted = false
        this.deletedTravels = this.deletedTravels.filter((t) => t.releaseID !== releaseID)
        // 更新 localStorage
        localStorage.setItem(DELETED_TRAVELS_KEY, JSON.stringify(this.deletedTravels))
      }
    },

    // 获取已删除的游记
    getDeletedTravels() {
      return this.deletedTravels
    },

    // 永久删除游记
    permanentDelete(releaseID) {
      this.deletedTravels = this.deletedTravels.filter((t) => t.releaseID !== releaseID)
      // 更新 localStorage
      localStorage.setItem(DELETED_TRAVELS_KEY, JSON.stringify(this.deletedTravels))
    },

    // 同步恢复游记（在回收站恢复后调用）
    syncRestoreTravel(releaseID) {
      const travel = this.travels.find((t) => t.releaseID === releaseID)
      if (travel) {
        travel.isDeleted = false
      } else {
        // 如果游记不在列表中，强制刷新数据
        this.resetDataLoaded()
        this.fetchTravels()
      }
    },
  },
})

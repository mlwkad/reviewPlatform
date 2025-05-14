import { defineStore } from 'pinia'
import { getAllRealeases, updateState } from '@/api/api'
import { ElMessage } from 'element-plus'

export const useTravelStore = defineStore('travel', {
  state: () => ({
    travels: [],
    currentStatus: 'all',
    loading: false,
    error: null,
    isDataLoaded: false,
  }),

  actions: {
    async fetchTravels() {
      if (this.isDataLoaded) {
        return
      }

      this.loading = true
      try {
        const res = await getAllRealeases()
        if (res.data) {
          this.travels = res.data.releases.map((travel) => ({
            ...travel,
            isDeleted: false,
          }))
          this.isDataLoaded = true
        }
      } catch (error) {
        this.error = error.message
        ElMessage.error('获取游记列表失败')
      } finally {
        this.loading = false
      }
    },

    resetDataLoaded() {
      this.isDataLoaded = false
    },

    setCurrentStatus(status) {
      this.currentStatus = status
    },

    // 更新游记状态
    async updateTravelStatus(releaseID, state, reason = '') {
      try {
        await updateState(releaseID, { state, reason })
        const travel = this.travels.find((t) => t.releaseID === releaseID)
        if (travel) {
          travel.state = state
          if (reason) {
            travel.reason = reason
          }
        }
      } catch (error) {
        console.error('更新游记状态失败:', error)
        throw error
      }
    },

    // 逻辑删除游记
    async logicDelete(releaseID) {
      try {
        // TODO: 实现真实的删除API
        const travel = this.travels.find((t) => t.releaseID === releaseID)
        if (travel) {
          travel.isDeleted = true
        }
      } catch (error) {
        console.error('删除游记失败:', error)
        throw error
      }
    },

    // 恢复已删除的游记
    restoreTravel(releaseID) {
      const travel = this.travels.find((t) => t.releaseID === releaseID)
      if (travel) {
        travel.isDeleted = false
      }
    },

    // 获取已删除的游记
    getDeletedTravels() {
      return this.travels.filter((travel) => travel.isDeleted)
    },

    // 永久删除游记
    permanentDelete(releaseID) {
      const index = this.travels.findIndex((t) => t.releaseID === releaseID)
      if (index !== -1) {
        this.travels.splice(index, 1)
      }
    },
  },
})

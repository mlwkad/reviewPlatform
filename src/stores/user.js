import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(
    JSON.parse(localStorage.getItem('user') || '{"id":"","username":"","role":""}')
  )

  function setUser(userData) {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function clearUser() {
    user.value = {
      id: '',
      username: '',
      role: ''
    }
    token.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { user, token, setUser, setToken, clearUser }
}) 
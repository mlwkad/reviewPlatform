// 用户数据存储键名
const USERS_STORAGE_KEY = 'travel_diary_users'

// 初始化默认用户数据
const defaultUsers = [
  {
    id: 1,
    userName: 'admin',
    passWord: '123456',
    role: 'admin',
    avatarUrl: '',
  },
  {
    id: 2,
    userName: 'auditor',
    passWord: '123456',
    role: 'auditor',
    avatarUrl: '',
  },
]

// 读取用户数据
export const readUsers = () => {
  try {
    const users = localStorage.getItem(USERS_STORAGE_KEY)
    //console.log('当前存储的用户数据:', users)
    return users ? JSON.parse(users) : defaultUsers
  } catch (error) {
    //console.error('读取用户数据失败:', error)
    return defaultUsers
  }
}

// 写入用户数据
export const writeUsers = (users) => {
  try {
    //console.log('正在保存用户数据:', users)
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    return true
  } catch (error) {
    //console.error('写入用户数据失败:', error)
    return false
  }
}

// 添加新用户
export const addUser = (userData) => {
  const users = readUsers()
  const newUser = {
    id: users.length + 1,
    ...userData,
    role: 'user', // 默认角色为普通用户
    avatarUrl: '',
  }
  console.log('添加新用户:', newUser)
  users.push(newUser)
  return writeUsers(users)
}

// 验证用户
export const validateUser = (userName, passWord) => {
  const users = readUsers()
  return users.find((user) => user.userName === userName && user.passWord === passWord)
}

// 检查用户名是否存在
export const isUserNameExists = (userName) => {
  const users = readUsers()
  return users.some((user) => user.userName === userName)
}

// 重置用户数据（用于测试）
export const resetUsers = () => {
  return writeUsers(defaultUsers)
}

// 导出存储键名，方便调试
export const STORAGE_KEY = USERS_STORAGE_KEY

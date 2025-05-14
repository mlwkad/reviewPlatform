import fs from 'fs'
import path from 'path'

const USERS_FILE_PATH = path.join(process.cwd(), 'src', 'config', 'users.json')

// 读取用户数据
export const readUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE_PATH, 'utf8')
    return JSON.parse(data).users
  } catch (error) {
    console.error('读取用户数据失败:', error)
    return []
  }
}

// 写入用户数据
export const writeUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify({ users }, null, 2), 'utf8')
    return true
  } catch (error) {
    console.error('写入用户数据失败:', error)
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

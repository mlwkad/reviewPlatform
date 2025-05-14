<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <h2>注册账号</h2>
        <p class="subtitle">Travel Diary Management System</p>
      </div>
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-item">
          <label>用户名</label>
          <input
            v-model="username"
            type="text"
            required
            placeholder="请输入用户名"
            :disabled="loading"
          />
        </div>
        <div class="form-item">
          <label>密码</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="请输入密码"
            :disabled="loading"
          />
        </div>
        <div class="form-item">
          <label>确认密码</label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            placeholder="请再次输入密码"
            :disabled="loading"
          />
        </div>
        <div v-if="error" class="error">{{ error }}</div>
        <button type="submit" class="register-button" :disabled="loading">
          {{ loading ? '注册中...' : '注 册' }}
        </button>
        <div class="login-link">已有账号？<router-link to="/login">立即登录</router-link></div>
      </form>
      <div class="register-footer">
        <p>推荐使用 Microsoft Edge 浏览器访问</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { addUser, isUserNameExists } from '@/utils/userManager'

const router = useRouter()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
  // 清除之前的错误
  error.value = ''

  // 验证用户名
  if (!username.value.trim()) {
    error.value = '用户名不能为空'
    return
  }

  // 验证密码
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }

  // 验证密码长度
  if (password.value.length < 6) {
    error.value = '密码长度不能少于6位'
    return
  }

  // 检查用户名是否已存在
  if (isUserNameExists(username.value.trim())) {
    error.value = '用户名已存在'
    return
  }

  loading.value = true
  try {
    // 添加新用户
    const success = addUser({
      userName: username.value.trim(),
      passWord: password.value,
    })

    if (success) {
      ElMessage.success('注册成功')
      router.push('/login')
    } else {
      error.value = '注册失败，请稍后重试'
    }
  } catch (err) {
    console.error('注册失败:', err)
    error.value = '注册失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="less" scoped>
@primary-color: #4caf50;
@primary-hover-color: #45a049;
@error-color: #ff4d4f;
@error-bg-color: #fff2f0;
@error-border-color: #ffccc7;
@text-color: #333;
@text-secondary-color: #666;
@text-light-color: #999;
@border-color: #ddd;
@bg-color: #f8f9fa;
@gradient-start: #f5f7fa;
@gradient-end: #c3cfe2;

@border-radius: 12px;
@border-radius-sm: 6px;
@border-radius-xs: 4px;
@spacing-xs: 8px;
@spacing-sm: 16px;
@spacing-md: 24px;
@spacing-lg: 32px;

.register-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, @gradient-start 0%, @gradient-end 100%);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.register-box {
  width: 420px;
  background: white;
  border-radius: @border-radius;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.register-header {
  padding: @spacing-lg @spacing-lg @spacing-md;
  text-align: center;
  background: @bg-color;
  border-bottom: 1px solid @border-color;

  h2 {
    margin: 0;
    font-size: 24px;
    color: @text-color;
    font-weight: 600;
  }

  .subtitle {
    margin: @spacing-xs 0 0;
    color: @text-secondary-color;
    font-size: 14px;
  }
}

.register-form {
  padding: @spacing-lg;

  .form-item {
    margin-bottom: @spacing-md;

    label {
      display: block;
      margin-bottom: @spacing-xs;
      color: @text-color;
      font-size: 14px;
      font-weight: 500;
    }

    input {
      width: 100%;
      height: 40px;
      padding: 0 @spacing-sm;
      border: 1px solid @border-color;
      border-radius: @border-radius-sm;
      font-size: 14px;
      transition: all 0.3s ease;

      &:focus {
        border-color: @primary-color;
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
        outline: none;
      }
    }
  }

  .error {
    margin-bottom: @spacing-sm;
    padding: @spacing-xs @spacing-sm;
    background: @error-bg-color;
    border: 1px solid @error-border-color;
    border-radius: @border-radius-xs;
    color: @error-color;
    font-size: 14px;
  }

  .register-button {
    width: 100%;
    height: 44px;
    background: @primary-color;
    color: white;
    border: none;
    border-radius: @border-radius-sm;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: @primary-hover-color;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    &:disabled {
      background: #a8d5ab;
      cursor: not-allowed;
      transform: none;
    }
  }

  input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  .login-link {
    margin-top: @spacing-md;
    text-align: center;
    font-size: 14px;
    color: @text-secondary-color;

    a {
      color: @primary-color;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.register-footer {
  padding: @spacing-sm;
  text-align: center;
  background: @bg-color;
  border-top: 1px solid @border-color;

  p {
    margin: 0;
    color: @text-light-color;
    font-size: 12px;
  }
}

@media screen and (max-width: 480px) {
  .register-box {
    width: 100%;
    margin: 0 @spacing-sm;
  }
}
</style>

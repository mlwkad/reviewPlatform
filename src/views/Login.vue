<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>审核管理系统</h2>
        <p class="subtitle">Travel Diary Management System</p>
      </div>
      <form @submit.prevent="handleLogin" class="login-form">
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
        <div v-if="error" class="error">{{ error }}</div>
        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
        <div class="register-link">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </div>
      </form>
      <div class="login-footer">
        <p>推荐使用 Microsoft Edge 浏览器访问</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { validateUser } from '@/utils/userManager'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

onBeforeMount(() => {
  signUp({ userName: 'asa1sxd', passWord: '1qsasxsa', avatarUrl: '' })
    .then((res) => {
      console.log(res)
    })
    .catch((error) => {
      console.log(error.response.data.message)
    })
  Login({ userName: 'asa1sxd', passWord: '1qsasxsa' })
    .then((res) => {
      console.log(res)
    })
    .catch((error) => {
      console.log(error)
    })
})

const handleLogin = async () => {
  // 清除之前的错误
  error.value = ''

  // 验证输入
  if (!username.value.trim()) {
    error.value = '用户名不能为空'
    return
  }

  if (!password.value) {
    error.value = '密码不能为空'
    return
  }

  loading.value = true
  try {
    // 验证用户
    const user = validateUser(username.value.trim(), password.value)

    if (user) {
      // 保存用户信息
      const userData = {
        id: user.id,
        username: user.userName,
        role: user.role,
      }
      console.log('保存的用户信息:', userData)

      userStore.setUser(userData)
      // 生成一个临时token
      const tempToken = `temp_${Date.now()}_${Math.random().toString(36).substr(2)}`
      userStore.setToken(tempToken)

      console.log('当前用户状态:', userStore.user)
      console.log('当前token:', userStore.token)

      ElMessage.success('登录成功')

      // 根据角色跳转到不同页面
      if (user.role === 'admin' || user.role === 'auditor') {
        router.replace({ name: 'travel-list' })
      } else {
        router.replace({ name: 'user-home' })
      }
    } else {
      error.value = '用户名或密码错误'
    }
  } catch (err) {
    console.error('登录失败:', err)
    error.value = '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="less" scoped>
// 颜色变量
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

// 尺寸变量
@border-radius: 12px;
@border-radius-sm: 6px;
@border-radius-xs: 4px;
@spacing-xs: 8px;
@spacing-sm: 16px;
@spacing-md: 24px;
@spacing-lg: 32px;

// 字体变量
@font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
  sans-serif;
@font-size-xs: 12px;
@font-size-sm: 14px;
@font-size-base: 16px;
@font-size-lg: 24px;
@font-weight-normal: 400;
@font-weight-medium: 500;
@font-weight-bold: 600;
@line-height-base: 1.5;

// 阴影变量
@box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
@input-focus-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);

// 媒体查询断点
@screen-xs: 480px;
@screen-sm: 576px;
@screen-md: 768px;
@screen-lg: 992px;
@screen-xl: 1200px;

// 动画变量
@animation-duration: 0.3s;
@animation-timing: ease;

// 混合器
.flex-center() {
  display: flex;
  justify-content: center;
  align-items: center;
}

.transition-base() {
  transition: all @animation-duration @animation-timing;
}

.input-base() {
  width: 100%;
  height: 40px;
  padding: 0 @spacing-sm;
  border: 1px solid @border-color;
  border-radius: @border-radius-sm;
  font-size: @font-size-sm;
  font-family: @font-family;
  .transition-base();
  box-sizing: border-box;

  &:focus {
    border-color: @primary-color;
    box-shadow: @input-focus-shadow;
    outline: none;
  }

  &::placeholder {
    color: @text-light-color;
  }
}

.button-base() {
  width: 100%;
  height: 44px;
  background: @primary-color;
  color: white;
  border: none;
  border-radius: @border-radius-sm;
  font-size: @font-size-base;
  font-weight: @font-weight-medium;
  font-family: @font-family;
  cursor: pointer;
  .transition-base();

  &:hover {
    background: @primary-hover-color;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.text-ellipsis() {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  .flex-center();
  background: linear-gradient(135deg, @gradient-start 0%, @gradient-end 100%);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-family: @font-family;
}

.login-box {
  width: 420px;
  background: white;
  border-radius: @border-radius;
  box-shadow: @box-shadow;
  overflow: hidden;
  position: relative;
  z-index: 1;

  .login-header {
    padding: @spacing-lg @spacing-lg @spacing-md;
    text-align: center;
    background: @bg-color;
    border-bottom: 1px solid @border-color;

    h2 {
      margin: 0;
      font-size: @font-size-lg;
      color: @text-color;
      font-weight: @font-weight-bold;
    }

    .subtitle {
      margin: @spacing-xs 0 0;
      color: @text-secondary-color;
      font-size: @font-size-sm;
    }
  }

  .login-form {
    padding: @spacing-lg;

    .form-item {
      margin-bottom: @spacing-md;

      label {
        display: block;
        margin-bottom: @spacing-xs;
        color: @text-color;
        font-size: @font-size-sm;
        font-weight: @font-weight-medium;
      }

      input {
        .input-base();
      }
    }

    .error {
      margin-bottom: @spacing-sm;
      padding: @spacing-xs @spacing-sm;
      background: @error-bg-color;
      border: 1px solid @error-border-color;
      border-radius: @border-radius-xs;
      color: @error-color;
      font-size: @font-size-sm;
    }

    .login-button {
      .button-base();

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

    .register-link {
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

  .login-footer {
    padding: @spacing-sm;
    text-align: center;
    background: @bg-color;
    border-top: 1px solid @border-color;

    p {
      margin: 0;
      color: @text-light-color;
      font-size: @font-size-xs;
    }
  }
}

/* 响应式调整 */
@media screen and (max-width: @screen-xs) {
  .login-box {
    width: 100%;
    margin: 0 @spacing-sm;

    .login-form {
      padding: @spacing-md;
    }
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-box {
  animation: fadeIn @animation-duration @animation-timing;
}
</style>

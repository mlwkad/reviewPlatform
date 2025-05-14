<template>
  <div class="main-layout">
    <aside class="sidebar">
        <div class="logo">
          <h2>游记管理系统</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          :router="true"
        >
          <el-menu-item index="/travel-list">
            <el-icon><Document /></el-icon>
            <span>游记列表</span>
          </el-menu-item>
          <el-menu-item index="/recycle-bin">
            <el-icon><Delete /></el-icon>
            <span>回收站</span>
          </el-menu-item>
        </el-menu>
    </aside>
    <div class="main-content">
      <header class="header">
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                {{ userStore.user?.username }}
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
      </header>
      <main class="page-content">
          <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Document, Delete, ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 计算当前激活的菜单项
const activeMenu = computed(() => route.path)

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'logout') {
    // 清除所有本地存储
    localStorage.clear()
    // 清除用户状态
    userStore.clearUser()
    // 强制跳转到登录页
    window.location.replace('/login')
  }
}
</script>

<style lang="less" scoped>
.main-layout {
  display: flex;
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  }
.sidebar {
  width: 200px;
    background-color: #304156;
    color: #fff;
  height: 100vh;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;

    .logo {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 1px solid #1f2d3d;

      h2 {
        margin: 0;
        font-size: 18px;
        color: #fff;
      }
    }

    .el-menu {
      border-right: none;
      background-color: transparent;
    flex: 1;
      .el-menu-item {
        color: #bfcbd9;
        &:hover, &.is-active {
          color: #fff;
          background-color: #263445;
        }
        .el-icon {
          margin-right: 8px;
        }
      }
    }
  }
.main-content {
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f0f2f5;
}
.header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  padding: 0 24px;
    .header-right {
      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        color: #606266;
        &:hover {
          color: #409EFF;
        }
      }
    }
  }
.page-content {
  flex: 1;
  overflow-y: auto;
    padding: 0;
  width: 100%;
  min-width: 0;
}
</style> 
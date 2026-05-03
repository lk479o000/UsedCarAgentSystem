<template>
  <div class="flex h-screen font-sans">
    <!-- 侧边栏 -->
    <aside class="w-60 flex-shrink-0 bg-gradient-to-b from-[#0f172a] to-[#1e293b] relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.15)]">
      <div class="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[rgba(56,189,248,0.2)] to-transparent" />
      <!-- Logo -->
      <div class="h-16 flex items-center justify-center gap-3 px-5 border-b border-[rgba(148,163,184,0.15)]">
        <div class="w-9 h-9 rounded-[10px] bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-sm font-bold text-white shadow-[0_0_16px_rgba(14,165,233,0.4)]">
          UC
        </div>
        <span class="text-lg font-semibold bg-gradient-to-r from-[#f8fafc] to-primary-light bg-clip-text text-transparent">
          UCAR管理后台
        </span>
      </div>
      <!-- 菜单 -->
      <nav class="py-3">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center gap-3.5 mx-4 my-1.5 px-4 h-[48px] rounded-xl font-medium transition-all duration-300 no-underline',
            $route.path === item.path
              ? 'bg-gradient-to-br from-primary to-primary-light text-white shadow-[0_4px_16px_rgba(14,165,233,0.35)]'
              : 'text-[#94a3b8] hover:bg-white/[0.06] hover:text-[#e2e8f0]',
          ]"
        >
          <span :class="item.icon" class="flex-shrink-0" />
          <span class="no-underline">{{ item.title }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- 顶部导航 -->
      <header class="h-16 bg-white/90 backdrop-blur-xl border-b border-border/60 flex items-center justify-end px-8 shadow-sm flex-shrink-0 relative z-20">
        <UDropdown :items="dropdownItems" @command="handleCommand">
          <template #trigger>
            <div class="flex items-center gap-2.5 cursor-pointer px-3 py-1.5 rounded-xl hover:bg-primary/8 transition-all">
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-semibold">
                {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() }}
              </div>
              <span class="text-sm font-medium text-text-secondary">{{ userStore.userInfo?.username }}</span>
              <span class="i-lucide-chevron-down text-xs text-text-secondary" />
            </div>
          </template>
        </UDropdown>
      </header>

      <!-- 内容区 -->
      <main class="flex-1 bg-background p-8 overflow-y-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/user'
import { Message } from '@/composables/useMessage'
import UDropdown from '@/components/UDropdown.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const menuItems = [
  { path: '/dashboard', title: '首页', icon: 'i-lucide-home text-lg' },
  { path: '/analytics', title: '数据大屏', icon: 'i-lucide-bar-chart-3 text-lg' },
  { path: '/leads', title: '线索管理', icon: 'i-lucide-file-text text-lg' },
  { path: '/settlements', title: '结算管理', icon: 'i-lucide-coins text-lg' },
  ...(userStore.isAdmin ? [
    { path: '/users', title: '经纪人管理', icon: 'i-lucide-user text-lg' },
    { path: '/regions', title: '区域管理', icon: 'i-lucide-map-pin text-lg' },
  ] : []),
]

const dropdownItems = [
  { label: '修改密码', command: 'password', icon: 'i-lucide-lock text-sm' },
  { label: '退出登录', command: 'logout', icon: 'i-lucide-log-out text-sm', divided: true },
]

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
    Message.success('已退出登录')
  } else if (command === 'password') {
    router.push('/password')
  }
}
</script>

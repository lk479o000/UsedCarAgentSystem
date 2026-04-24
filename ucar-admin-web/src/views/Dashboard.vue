<template>
  <div class="animate-fade-in">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <UCard v-for="stat in statsList" :key="stat.key" hover>
        <div class="flex items-center gap-4 py-2">
          <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0', stat.iconBg]">
            <span :class="stat.icon" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm text-text-secondary font-medium mb-2">{{ stat.title }}</div>
            <div :class="['text-3xl font-bold tracking-tight leading-none', stat.valueClass]">
              {{ stat.value }}
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <UCard title="线索趋势">
        <div class="h-[280px] flex flex-col items-center justify-center gap-3 text-text-secondary text-sm bg-gradient-to-br from-primary/[0.03] to-primary-light/[0.03] rounded-xl border border-dashed border-border">
          <span class="i-lucide-trending-up text-5xl text-gray-300" />
          <span>数据可视化区域</span>
        </div>
      </UCard>
      <UCard title="成交分布">
        <div class="h-[280px] flex flex-col items-center justify-center gap-3 text-text-secondary text-sm bg-gradient-to-br from-primary/[0.03] to-primary-light/[0.03] rounded-xl border border-dashed border-border">
          <span class="i-lucide-pie-chart text-5xl text-gray-300" />
          <span>数据可视化区域</span>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getDashboardStats } from '@/api/dashboard'
import { Message } from '@/composables/useMessage'
import UCard from '@/components/UCard.vue'

const stats = ref({
  totalLeads: 0,
  totalSuccess: 0,
  totalFail: 0,
  pendingAmount: 0,
})

const statsList = computed(() => [
  {
    key: 'totalLeads',
    title: '总线索数',
    value: stats.value.totalLeads,
    icon: 'i-lucide-file-text',
    iconBg: 'bg-gradient-to-br from-primary/15 to-primary-light/15 text-primary',
    valueClass: 'text-text-primary',
  },
  {
    key: 'totalSuccess',
    title: '已成交',
    value: stats.value.totalSuccess,
    icon: 'i-lucide-circle-check',
    iconBg: 'bg-gradient-to-br from-success/15 to-highlight/15 text-success',
    valueClass: 'text-success',
  },
  {
    key: 'totalFail',
    title: '已失败',
    value: stats.value.totalFail,
    icon: 'i-lucide-circle-x',
    iconBg: 'bg-gradient-to-br from-danger/15 to-red-400/15 text-danger',
    valueClass: 'text-danger',
  },
  {
    key: 'pendingAmount',
    title: '待结算金额',
    value: stats.value.pendingAmount,
    icon: 'i-lucide-coins',
    iconBg: 'bg-gradient-to-br from-warning/15 to-amber-300/15 text-warning',
    valueClass: 'text-warning',
  },
])

const loadStats = async () => {
  try {
    const res = await getDashboardStats()
    stats.value = res.data
  } catch (err) {
    Message.error('加载统计数据失败')
  }
}

onMounted(() => {
  loadStats()
})
</script>

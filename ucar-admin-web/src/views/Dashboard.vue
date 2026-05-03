<template>
  <div class="animate-fade-in">
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

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <UCard title="线索趋势">
        <div ref="trendChartRef" class="h-[280px]" />
      </UCard>
      <UCard title="线索状态分布">
        <div ref="statusChartRef" class="h-[280px]" />
      </UCard>
    </div>

    <div class="mt-6">
      <router-link to="/analytics" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-light text-white font-medium shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 no-underline">
        <span class="i-lucide-bar-chart-3 text-lg" />
        <span>进入数据大屏</span>
        <span class="i-lucide-arrow-right text-sm" />
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { getDashboardOverview } from '@/api/dashboard'
import { Message } from '@/composables/useMessage'
import UCard from '@/components/UCard.vue'
import * as echarts from 'echarts'

const trendChartRef = ref(null)
const statusChartRef = ref(null)
let trendChart = null
let statusChart = null

const stats = ref({
  totalLeads: 0,
  totalSuccess: 0,
  totalFail: 0,
  pendingAmount: 0,
  settledAmount: 0,
})

const overview = ref(null)

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
    value: formatMoney(stats.value.pendingAmount),
    icon: 'i-lucide-coins',
    iconBg: 'bg-gradient-to-br from-warning/15 to-amber-300/15 text-warning',
    valueClass: 'text-warning',
  },
  {
    key: 'settledAmount',
    title: '已结算金额',
    value: formatMoney(stats.value.settledAmount),
    icon: 'i-lucide-dollar-sign',
    iconBg: 'bg-gradient-to-br from-success/15 to-highlight/15 text-success',
    valueClass: 'text-success',
  },
])

function formatMoney(val) {
  if (!val) return '¥0'
  if (val >= 10000) return `¥${(val / 10000).toFixed(1)}万`
  return `¥${val.toLocaleString()}`
}

function initTrendChart(data) {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      textStyle: { color: '#0F172A', fontSize: 13 },
    },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#475569', fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
      axisLabel: { color: '#475569', fontSize: 11 },
    },
    series: [{
      type: 'line',
      data: data.counts,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#0EA5E9', width: 2.5 },
      itemStyle: { color: '#0EA5E9', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(14,165,233,0.25)' },
          { offset: 1, color: 'rgba(14,165,233,0.02)' },
        ]),
      },
    }],
  }
  trendChart.setOption(option)
}

function initStatusChart(data) {
  if (!statusChartRef.value) return
  statusChart = echarts.init(statusChartRef.value)
  const colors = ['#94A3B8', '#0EA5E9', '#3B82F6', '#F59E0B', '#14B8A6', '#EF4444']
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      textStyle: { color: '#0F172A', fontSize: 13 },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#475569', fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 12,
    },
    series: [{
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
      },
      data: data.labels.map((label, i) => ({
        name: label,
        value: data.values[i],
        itemStyle: { color: colors[i] },
      })),
    }],
  }
  statusChart.setOption(option)
}

const loadData = async () => {
  try {
    const res = await getDashboardOverview()
    overview.value = res.data
    stats.value = res.data.stats
    initTrendChart(res.data.leadTrend)
    initStatusChart(res.data.statusDistribution)
  } catch (err) {
    Message.error('加载统计数据失败')
  }
}

function handleResize() {
  trendChart?.resize()
  statusChart?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  statusChart?.dispose()
})
</script>

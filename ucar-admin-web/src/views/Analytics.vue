<template>
  <div class="animate-fade-in">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h2 class="text-xl font-bold text-text-primary m-0">{{ isAdmin ? '数据大屏' : '我的数据' }}</h2>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-for="r in rangeOptions"
          :key="r.value"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-none cursor-pointer',
            range === r.value
              ? 'bg-gradient-to-br from-primary to-primary-light text-white shadow-md'
              : 'bg-white text-text-secondary hover:bg-primary/8',
          ]"
          @click="changeRange(r.value)"
        >
          {{ r.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard title="线索趋势">
        <div ref="trendChartRef" class="h-[280px]" />
      </UCard>
      <UCard title="线索状态分布">
        <div ref="statusChartRef" class="h-[280px]" />
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <UCard title="转化漏斗">
        <div ref="funnelChartRef" class="h-[280px]" />
      </UCard>
      <UCard title="成交额趋势">
        <div ref="dealChartRef" class="h-[280px]" />
      </UCard>
    </div>

    <template v-if="isAdmin">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <UCard title="经纪人业绩排行">
          <div ref="agentChartRef" class="h-[280px]" />
        </UCard>
        <UCard title="失败原因TOP5">
          <div ref="failChartRef" class="h-[280px]" />
        </UCard>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <UCard title="地区分布TOP10">
          <div ref="regionChartRef" class="h-[280px]" />
        </UCard>
        <UCard title="结算概览">
          <div ref="settlementChartRef" class="h-[280px]" />
        </UCard>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { getDashboardAnalytics } from '@/api/dashboard'
import { useUserStore } from '@/store/user'
import { Message } from '@/composables/useMessage'
import UCard from '@/components/UCard.vue'
import * as echarts from 'echarts'

const userStore = useUserStore()
const isAdmin = userStore.isAdmin

const range = ref(30)
const rangeOptions = [
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 },
  { label: '近90天', value: 90 },
]

const trendChartRef = ref(null)
const statusChartRef = ref(null)
const funnelChartRef = ref(null)
const dealChartRef = ref(null)
const agentChartRef = ref(null)
const failChartRef = ref(null)
const regionChartRef = ref(null)
const settlementChartRef = ref(null)

const charts = []

function createChart(el) {
  if (!el) return null
  const c = echarts.init(el)
  charts.push(c)
  return c
}

const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.95)',
  borderColor: '#E2E8F0',
  borderWidth: 1,
  textStyle: { color: '#0F172A', fontSize: 13 },
}

function initTrendChart(chart, data) {
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'axis', ...tooltipStyle },
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
  })
}

function initStatusChart(chart, data) {
  if (!chart) return
  const colors = ['#94A3B8', '#0EA5E9', '#3B82F6', '#F59E0B', '#14B8A6', '#EF4444']
  chart.setOption({
    tooltip: { trigger: 'item', ...tooltipStyle, formatter: '{b}: {c} ({d}%)' },
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
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: data.labels.map((label, i) => ({
        name: label,
        value: data.values[i],
        itemStyle: { color: colors[i] },
      })),
    }],
  })
}

function initFunnelChart(chart, data) {
  if (!chart) return
  const colors = ['#94A3B8', '#0EA5E9', '#3B82F6', '#F59E0B', '#14B8A6']
  const maxVal = Math.max(...data.values, 1)
  chart.setOption({
    tooltip: { trigger: 'item', ...tooltipStyle },
    series: [{
      type: 'funnel',
      left: '10%',
      top: 10,
      bottom: 10,
      width: '80%',
      min: 0,
      max: maxVal,
      minSize: '0%',
      maxSize: '100%',
      sort: 'descending',
      gap: 4,
      label: {
        show: true,
        position: 'inside',
        formatter: '{b}\n{c}',
        fontSize: 12,
        color: '#fff',
      },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
      data: data.stages.map((stage, i) => ({
        name: stage,
        value: data.values[i],
        itemStyle: { color: colors[i] },
      })).reverse(),
    }],
  })
}

function initDealChart(chart, data) {
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'axis', ...tooltipStyle, formatter: (params) => `${params[0].axisValue}<br/>¥${(params[0].value || 0).toLocaleString()}` },
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#475569', fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
      axisLabel: { color: '#475569', fontSize: 11, formatter: (v) => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : v },
    },
    series: [{
      type: 'line',
      data: data.amounts,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#14B8A6', width: 2.5 },
      itemStyle: { color: '#14B8A6', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(20,184,166,0.25)' },
          { offset: 1, color: 'rgba(20,184,166,0.02)' },
        ]),
      },
    }],
  })
}

function initAgentChart(chart, data) {
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'axis', ...tooltipStyle },
    grid: { left: 80, right: 20, top: 10, bottom: 20 },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
      axisLabel: { color: '#475569', fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: data.names,
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#475569', fontSize: 12 },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: data.counts,
      barWidth: 20,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#0EA5E9' },
          { offset: 1, color: '#38BDF8' },
        ]),
        borderRadius: [0, 4, 4, 0],
      },
    }],
  })
}

function initFailChart(chart, data) {
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'axis', ...tooltipStyle },
    grid: { left: 100, right: 20, top: 10, bottom: 20 },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
      axisLabel: { color: '#475569', fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: data.reasons,
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#475569', fontSize: 12, width: 80, overflow: 'truncate' },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: data.counts,
      barWidth: 20,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#EF4444' },
          { offset: 1, color: '#F87171' },
        ]),
        borderRadius: [0, 4, 4, 0],
      },
    }],
  })
}

function initRegionChart(chart, data) {
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'axis', ...tooltipStyle },
    grid: { left: 80, right: 20, top: 10, bottom: 20 },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
      axisLabel: { color: '#475569', fontSize: 11 },
    },
    yAxis: {
      type: 'category',
      data: data.names,
      axisLine: { lineStyle: { color: '#E2E8F0' } },
      axisLabel: { color: '#475569', fontSize: 12 },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: data.counts,
      barWidth: 20,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#3B82F6' },
          { offset: 1, color: '#60A5FA' },
        ]),
        borderRadius: [0, 4, 4, 0],
      },
    }],
  })
}

function initSettlementChart(chart, data) {
  if (!chart) return
  chart.setOption({
    tooltip: { trigger: 'item', ...tooltipStyle, formatter: '{b}: ¥{c}' },
    legend: {
      bottom: 0,
      textStyle: { color: '#475569', fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
    },
    series: [
      {
        type: 'pie',
        radius: ['30%', '50%'],
        center: ['50%', '42%'],
        label: { show: false },
        data: [
          { name: '待结算利润', value: data.pending.profit || 0, itemStyle: { color: '#F59E0B' } },
          { name: '已结算利润', value: data.settled.profit || 0, itemStyle: { color: '#14B8A6' } },
        ],
      },
      {
        type: 'pie',
        radius: ['58%', '72%'],
        center: ['50%', '42%'],
        label: { show: false },
        data: [
          { name: '待结算分成', value: data.pending.agentShare || 0, itemStyle: { color: '#FBBF24' } },
          { name: '已结算分成', value: data.settled.agentShare || 0, itemStyle: { color: '#2DD4BF' } },
        ],
      },
    ],
  })
}

const loadData = async () => {
  try {
    const res = await getDashboardAnalytics(range.value)
    const d = res.data

    await nextTick()

    initTrendChart(createChart(trendChartRef.value), d.leadTrend)
    initStatusChart(createChart(statusChartRef.value), d.statusDistribution)
    initFunnelChart(createChart(funnelChartRef.value), d.conversionFunnel)
    initDealChart(createChart(dealChartRef.value), d.dealTrend)

    if (isAdmin && d.agentRanking) {
      initAgentChart(createChart(agentChartRef.value), d.agentRanking)
      initFailChart(createChart(failChartRef.value), d.failReasons)
      initRegionChart(createChart(regionChartRef.value), d.regionDistribution)
      initSettlementChart(createChart(settlementChartRef.value), d.settlementOverview)
    }
  } catch (err) {
    Message.error('加载大屏数据失败')
  }
}

function changeRange(r) {
  range.value = r
  charts.forEach((c) => c?.dispose())
  charts.length = 0
  loadData()
}

function handleResize() {
  charts.forEach((c) => c?.resize())
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach((c) => c?.dispose())
  charts.length = 0
})
</script>

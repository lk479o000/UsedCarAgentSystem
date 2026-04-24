<template>
  <div class="w-full overflow-x-auto">
    <table class="w-full border border-border rounded-md overflow-hidden">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              'bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e1] font-bold text-sm text-text-primary border-b-2 border-border px-4 py-3.5 text-left whitespace-nowrap tracking-wide',
              { 'cursor-pointer hover:from-[#e2e8f0] hover:to-[#cbd5e1] transition-colors': col.sortable },
            ]"
            :style="{ width: col.width || 'auto' }"
            @click="col.sortable && handleSort(col.key)"
          >
            <div class="flex items-center gap-1">
              {{ col.title }}
              <span v-if="col.sortable" class="flex flex-col text-xs text-gray-400">
                <span :class="['i-lucide-chevron-up', { 'text-primary': sortKey === col.key && sortOrder === 'asc' }]" />
                <span :class="['i-lucide-chevron-down -mt-1', { 'text-primary': sortKey === col.key && sortOrder === 'desc' }]" />
              </span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-if="data.length > 0">
          <tr
            v-for="(row, index) in sortedData"
            :key="rowKey ? row[rowKey] : index"
            :class="[
              'transition-colors duration-300',
              index % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white',
              'hover:bg-primary/8 cursor-pointer',
            ]"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-sm text-text-secondary border-b border-border"
            >
              <slot :name="col.key" :row="row" :index="index">
                {{ getValue(row, col.key) }}
              </slot>
            </td>
          </tr>
        </template>
        <tr v-else>
          <td :colspan="columns.length" class="px-4 py-12 text-center text-text-secondary">
            <div class="flex flex-col items-center gap-2">
              <span class="i-lucide-inbox text-4xl text-gray-300" />
              <span>{{ emptyText }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  rowKey: { type: String, default: '' },
  emptyText: { type: String, default: '无数据' },
})

const sortKey = ref('')
const sortOrder = ref('')

const getValue = (row, key) => {
  const keys = key.split('.')
  let value = row
  for (const k of keys) {
    value = value?.[k]
  }
  return value ?? '-'
}

const handleSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : sortOrder.value === 'desc' ? '' : 'asc'
    if (sortOrder.value === '') {
      sortKey.value = ''
    }
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const sortedData = computed(() => {
  if (!sortKey.value || !sortOrder.value) return props.data
  return [...props.data].sort((a, b) => {
    const av = getValue(a, sortKey.value)
    const bv = getValue(b, sortKey.value)
    if (av < bv) return sortOrder.value === 'asc' ? -1 : 1
    if (av > bv) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})
</script>

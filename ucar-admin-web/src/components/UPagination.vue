<template>
  <div class="flex items-center justify-end gap-2 mt-6">
    <span class="text-sm text-text-secondary mr-2">共 {{ total }} 条</span>
    <select
      :value="pageSize"
      class="border border-border rounded-md px-2 py-1 text-sm outline-none focus:border-primary transition-colors"
      @change="$emit('update:pageSize', Number($event.target.value))"
    >
      <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}条/页</option>
    </select>
    <button
      :disabled="currentPage <= 1"
      class="px-3 py-1.5 rounded-md border border-border text-sm text-text-secondary hover:text-primary hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      @click="$emit('update:currentPage', currentPage - 1)"
    >
      &lt;
    </button>
    <button
      v-for="p in visiblePages"
      :key="p"
      :class="[
        'px-3 py-1.5 rounded-md border text-sm transition-all',
        p === currentPage
          ? 'bg-gradient-to-br from-primary to-primary-light text-white border-transparent shadow-md'
          : 'border-border text-text-secondary hover:text-primary hover:border-primary',
      ]"
      @click="$emit('update:currentPage', p)"
    >
      {{ p }}
    </button>
    <button
      :disabled="currentPage >= totalPages"
      class="px-3 py-1.5 rounded-md border border-border text-sm text-text-secondary hover:text-primary hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      @click="$emit('update:currentPage', currentPage + 1)"
    >
      &gt;
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array, default: () => [10, 20, 50] },
})

defineEmits(['update:currentPage', 'update:pageSize'])

const totalPages = computed(() => {
  const pages = Math.ceil(props.total / props.pageSize)
  return pages > 0 ? pages : 1
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 7
  if (totalPages.value <= maxVisible) {
    for (let i = 1; i <= totalPages.value; i++) pages.push(i)
  } else {
    let start = Math.max(1, props.currentPage - 3)
    let end = Math.min(totalPages.value, start + maxVisible - 1)
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)
  }
  return pages
})
</script>

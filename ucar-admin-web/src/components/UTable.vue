<template>
  <div class="u-table-wrapper">
    <div class="u-table-scroll">
      <table class="u-table">
        <thead>
          <tr>
            <th
              v-for="(col, colIndex) in columns"
              :key="col.key"
              :class="[
                'u-table-th',
                col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                { 'cursor-pointer': col.sortable },
              ]"
              :style="getThStyle(col, colIndex)"
              @click="col.sortable && handleSort(col.key)"
            >
              <div class="u-th-content" :class="[
                col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'
              ]">
                {{ col.title }}
                <span v-if="col.sortable" class="u-sort-icons">
                  <span :class="['i-lucide-chevron-up', { 'text-primary': sortKey === col.key && sortOrder === 'asc' }]" />
                  <span :class="['i-lucide-chevron-down', { 'text-primary': sortKey === col.key && sortOrder === 'desc' }]" />
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
              :class="['u-table-row', index % 2 === 1 ? 'u-row-even' : '']"
              @click="handleRowClick(row)"
            >
              <td
                v-for="(col, colIndex) in columns"
                :key="col.key"
                :class="[
                  'u-table-td',
                  col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                ]"
                :style="getTdStyle(col, colIndex, index)"
              >
                <slot :name="col.key" :row="row" :index="index">
                  {{ getValue(row, col.key) }}
                </slot>
              </td>
            </tr>
          </template>
          <tr v-else>
            <td :colspan="columns.length" class="u-empty-cell">
              <div class="u-empty-content">
                <span class="i-lucide-inbox u-empty-icon" />
                <span>{{ emptyText }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  rowKey: { type: String, default: '' },
  emptyText: { type: String, default: '无数据' },
  /** 将第 1 列固定在左侧（横向滚动时不动）；与列定义的 fixed: 'left' 可叠加计算偏移 */
  fixedFirstColumn: { type: Boolean, default: false },
})

const emit = defineEmits(['row-click'])

const sortKey = ref('')
const sortOrder = ref('')

const isLeftFixed = (col, colIndex) =>
  col.fixed === 'left' || (props.fixedFirstColumn && colIndex === 0)

const lastLeftFixedIndex = computed(() => {
  let idx = -1
  for (let i = 0; i < props.columns.length; i++) {
    if (isLeftFixed(props.columns[i], i)) idx = i
  }
  return idx
})

const firstRightFixedIndex = computed(() => {
  for (let i = 0; i < props.columns.length; i++) {
    if (props.columns[i].fixed === 'right') return i
  }
  return -1
})

const parseWidth = (w) => {
  if (!w) return 0
  return parseInt(w, 10) || 0
}

const getThStyle = (col, colIndex) => {
  const style = { width: col.width || undefined, minWidth: col.minWidth || (col.width || undefined) }
  if (isLeftFixed(col, colIndex)) {
    let offset = 0
    for (let i = 0; i < colIndex; i++) {
      if (isLeftFixed(props.columns[i], i)) {
        offset += parseWidth(props.columns[i].width) || 120
      }
    }
    style.position = 'sticky'
    style.left = offset + 'px'
    style.zIndex = 30
    style.background = 'linear-gradient(to bottom, #e2e8f0, #cbd5e1)'
  } else if (col.fixed === 'right') {
    let offset = 0
    for (let i = props.columns.length - 1; i > colIndex; i--) {
      if (props.columns[i].fixed === 'right') {
        offset += parseWidth(props.columns[i].width) || 120
      }
    }
    style.position = 'sticky'
    style.right = offset + 'px'
    style.zIndex = 40
    style.background = 'linear-gradient(to bottom, #e2e8f0, #cbd5e1)'
  } else {
    style.position = 'sticky'
    style.top = 0
    style.zIndex = 20
  }
  return style
}

const getTdStyle = (col, colIndex, rowIndex) => {
  const style = { width: col.width || undefined }
  const isEven = rowIndex % 2 === 1
  const bg = isEven ? '#f8fafc' : '#ffffff'

  if (isLeftFixed(col, colIndex)) {
    let offset = 0
    for (let i = 0; i < colIndex; i++) {
      if (isLeftFixed(props.columns[i], i)) {
        offset += parseWidth(props.columns[i].width) || 120
      }
    }
    style.position = 'sticky'
    style.left = offset + 'px'
    style.zIndex = 10
    style.backgroundColor = bg
  } else if (col.fixed === 'right') {
    let offset = 0
    for (let i = props.columns.length - 1; i > colIndex; i--) {
      if (props.columns[i].fixed === 'right') {
        offset += parseWidth(props.columns[i].width) || 120
      }
    }
    style.position = 'sticky'
    style.right = offset + 'px'
    style.zIndex = 25
    style.backgroundColor = bg
  }

  if (isLeftFixed(col, colIndex) && colIndex === lastLeftFixedIndex.value) {
    style.boxShadow = '2px 0 4px rgba(0,0,0,0.08)'
  }
  if (col.fixed === 'right' && colIndex === firstRightFixedIndex.value) {
    style.boxShadow = '-2px 0 4px rgba(0,0,0,0.08)'
  }

  return style
}

const getValue = (row, key) => {
  if (row.hasOwnProperty(key)) {
    return row[key] ?? '-'
  }
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

const handleRowClick = (row) => {
  emit('row-click', row)
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

<style scoped>
.u-table-wrapper {
  width: 100%;
  position: relative;
}

.u-table-scroll {
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
}

/* 不要用 overflow:hidden：会切断 sticky 与横向滚动容器的关联，首列/右侧固定列会失效 */
.u-table {
  width: 100%;
  min-width: max(100%, max-content);
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: visible;
}

.u-table-th {
  background: linear-gradient(to bottom, #e2e8f0, #cbd5e1);
  font-weight: 700;
  font-size: 14px;
  color: var(--color-text-primary);
  border-bottom: 2px solid var(--color-border);
  padding: 12px 16px;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.u-th-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.u-sort-icons {
  display: flex;
  flex-direction: column;
  font-size: 10px;
  color: #9ca3af;
  line-height: 1;
}

.u-sort-icons .i-lucide-chevron-down {
  margin-top: -2px;
}

.u-table-row {
  transition: background-color 0.15s ease;
  cursor: pointer;
}

/* sky-100：悬停需不透明底，否则 sticky 固定列会透出下层单元格 */
.u-table-row:hover {
  background-color: #e0f2fe;
}

.u-table-row:hover .u-table-td {
  background-color: #e0f2fe !important;
}

.u-row-even .u-table-td:not([style*="position: sticky"]) {
  background-color: #f8fafc;
}

.u-table-td {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.u-empty-cell {
  padding: 48px 16px;
  text-align: center;
  color: var(--color-text-secondary);
}

.u-empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.u-empty-icon {
  font-size: 36px;
  color: #d1d5db;
}
</style>

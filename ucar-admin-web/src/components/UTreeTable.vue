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
              ]"
              :style="getThStyle(col, colIndex)"
            >
              {{ col.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="flattenedRows.length > 0">
            <tr
              v-for="(item, index) in flattenedRows"
              :key="item.id"
              :class="['u-table-row', item._index % 2 === 1 ? 'u-row-even' : '']"
              @click="$emit('row-click', item)"
            >
              <td
                v-for="(col, colIndex) in columns"
                :key="col.key"
                :class="[
                  'u-table-td',
                  col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                ]"
                :style="getTdStyle(col, colIndex, item._index)"
              >
                <slot :name="col.key" :row="item" :index="index">
                  <template v-if="col.key === firstColKey">
                    <span class="inline-flex items-center" :style="{ paddingLeft: `${item._level * 20}px` }">
                      <span
                        v-if="item._hasChildren"
                        class="inline-flex items-center justify-center w-5 h-5 mr-1 cursor-pointer rounded hover:bg-gray-200 transition-colors"
                        @click.stop="toggleExpand(item)"
                      >
                        <span
                          :class="[
                            'i-lucide-chevron-right text-xs transition-transform duration-200',
                            item._expanded ? 'rotate-90' : ''
                          ]"
                        />
                      </span>
                      <span v-else class="inline-block w-5 mr-1" />
                      <span>{{ getValue(item, col.key) }}</span>
                    </span>
                  </template>
                  <template v-else>
                    {{ getValue(item, col.key) }}
                  </template>
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
import { ref, computed, watch } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  emptyText: { type: String, default: '无数据' },
  lazy: { type: Boolean, default: false },
  load: { type: Function, default: null },
  fixedFirstColumn: { type: Boolean, default: false },
})

const emit = defineEmits(['row-click'])

const expandedKeys = ref(new Set())
const loadedChildrenMap = ref(new Map())

const firstColKey = computed(() => props.columns[0]?.key || '')

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

const toggleExpand = async (row) => {
  const key = row[props.rowKey]
  if (expandedKeys.value.has(key)) {
    expandedKeys.value.delete(key)
  } else {
    if (props.lazy && props.load && !loadedChildrenMap.value.has(key)) {
      const children = await props.load(row)
      loadedChildrenMap.value.set(key, children)
      loadedChildrenMap.value = new Map(loadedChildrenMap.value)
    }
    expandedKeys.value.add(key)
  }
  expandedKeys.value = new Set(expandedKeys.value)
}

const getChildren = (node) => {
  const key = node[props.rowKey]
  if (loadedChildrenMap.value.has(key)) {
    return loadedChildrenMap.value.get(key)
  }
  return node.children || null
}

const flattenedRows = computed(() => {
  const result = []
  let index = 0

  const walk = (nodes, level) => {
    if (!nodes) return
    for (const node of nodes) {
      const key = node[props.rowKey]
      const hasChildren = node.hasChildren || (getChildren(node) && getChildren(node).length > 0)
      const isExpanded = expandedKeys.value.has(key)

      result.push({
        ...node,
        _level: level,
        _hasChildren: hasChildren,
        _expanded: isExpanded,
        _index: index++,
      })

      if (isExpanded) {
        const children = getChildren(node)
        if (children && children.length > 0) {
          walk(children, level + 1)
        }
      }
    }
  }

  walk(props.data, 0)
  return result
})

watch(() => props.data, () => {
  expandedKeys.value = new Set()
  loadedChildrenMap.value = new Map()
}, { deep: false })
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

.u-table-row {
  transition: background-color 0.15s ease;
  cursor: pointer;
}

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

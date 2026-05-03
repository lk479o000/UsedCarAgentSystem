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
            ]"
            :style="{ width: col.width || 'auto' }"
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
            :class="[
              'transition-colors duration-300',
              item._index % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white',
              'hover:bg-primary/8 cursor-pointer',
            ]"
            @click="$emit('row-click', item)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-sm text-text-secondary border-b border-border"
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
import { ref, computed, watch } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  emptyText: { type: String, default: '无数据' },
  lazy: { type: Boolean, default: false },
  load: { type: Function, default: null },
})

const emit = defineEmits(['row-click'])

const expandedKeys = ref(new Set())
const loadedChildrenMap = ref(new Map())

const firstColKey = computed(() => props.columns[0]?.key || '')

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

<template>
  <div class="u-action-group" @click.stop>
    <template v-for="(action, i) in visibleActions" :key="action.key ?? i">
      <UButton
        :type="action.type || 'default'"
        size="sm"
        @click="action.handler"
      >
        {{ action.label }}
      </UButton>
    </template>
    <div v-if="overflowActions.length > 0" class="u-more-wrapper" ref="moreRef">
      <UButton type="default" size="sm" @click.stop.prevent="onMoreClick">
        更多
      </UButton>
    </div>
    <Teleport to="body">
      <Transition name="u-dropdown">
        <div
          v-if="menuOpen"
          ref="menuRef"
          class="u-dropdown-menu u-dropdown-menu-portal"
          :style="menuStyle"
        >
          <div
            v-for="(item, idx) in overflowActions"
            :key="item.key ?? idx"
            class="u-dropdown-item"
            @click.stop="handleCommand(item.key)"
          >
            {{ item.label }}
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import UButton from '@/components/UButton.vue'

/** 操作数 > 3 时：前 2 个平铺为按钮，从第 3 个起放入「更多」；≤3 时全部平铺、不出现「更多」 */
const INLINE_COUNT = 2

const props = defineProps({
  actions: { type: Array, default: () => [] },
})

const emit = defineEmits(['command'])

const visibleActions = computed(() => {
  if (props.actions.length <= 3) return props.actions
  return props.actions.slice(0, INLINE_COUNT)
})

const overflowActions = computed(() => {
  if (props.actions.length <= 3) return []
  return props.actions.slice(INLINE_COUNT)
})

const menuOpen = ref(false)
const moreRef = ref(null)
const menuRef = ref(null)
const menuStyle = ref({})

const updateMenuPosition = () => {
  const el = moreRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const menuWidth = 160
  let left = r.right
  let top = r.bottom + 6
  left = Math.min(left, vw - 8)
  left = Math.max(menuWidth + 8, left)
  const spaceBelow = vh - top - 8
  if (spaceBelow < 80) {
    top = Math.max(8, r.top - 6 - Math.min(spaceBelow + 120, 240))
  }
  menuStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    transform: 'translateX(-100%)',
    minWidth: '120px',
    zIndex: 10000,
  }
}

const onMoreClick = () => {
  menuOpen.value = !menuOpen.value
}

watch(menuOpen, async (open) => {
  if (!open) return
  await nextTick()
  requestAnimationFrame(() => requestAnimationFrame(updateMenuPosition))
})

const closeMenu = () => {
  menuOpen.value = false
}

const handleCommand = (key) => {
  const action = props.actions.find(a => a.key === key)
  if (action && action.handler) {
    action.handler()
  }
  emit('command', key)
  closeMenu()
}

/** 用 click 冒泡关闭，避免 capture 阶段 pointerdown 在 Teleport 未挂 ref 时误关菜单导致菜单项 click 丢失 */
const handleOutsideClick = (e) => {
  if (!menuOpen.value) return
  const t = e.target
  if (moreRef.value?.contains(t)) return
  if (menuRef.value?.contains(t)) return
  if (typeof t?.closest === 'function' && t.closest('.u-dropdown-menu-portal')) return
  closeMenu()
}

const handleReposition = () => {
  if (menuOpen.value) updateMenuPosition()
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  window.addEventListener('scroll', handleReposition, true)
  window.addEventListener('resize', handleReposition)
})
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('scroll', handleReposition, true)
  window.removeEventListener('resize', handleReposition)
})
</script>

<style scoped>
.u-action-group {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  flex-wrap: nowrap;
}

.u-more-wrapper {
  position: relative;
  display: inline-flex;
}

.u-dropdown-enter-active,
.u-dropdown-leave-active {
  transition: all 0.2s ease;
}

/* 不与菜单 position:fixed + translateX(-100%) 的 transform 冲突，只做透明度 */
.u-dropdown-enter-from,
.u-dropdown-leave-to {
  opacity: 0;
}
</style>

<style>
/* Teleport 到 body：菜单与项样式均放此处，hover 不依赖 scoped / 主题变量在 body 上是否生效 */
.u-dropdown-menu-portal {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  padding: 4px 0;
}

.u-dropdown-menu-portal .u-dropdown-item {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: background-color 0.12s ease, color 0.12s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
}

.u-dropdown-menu-portal .u-dropdown-item:hover,
.u-dropdown-menu-portal .u-dropdown-item:focus-visible {
  background-color: #e0f2fe;
  color: #0369a1;
  outline: none;
}

.u-dropdown-menu-portal .u-dropdown-item:active {
  background-color: #bae6fd;
  color: #0c4a6e;
}
</style>

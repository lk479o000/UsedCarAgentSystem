<template>
  <div ref="dropdownRef" class="relative inline-block">
    <div @click="toggleOpen">
      <slot name="trigger" />
    </div>
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-border overflow-hidden z-[100]"
      >
        <div
          v-for="(item, index) in items"
          :key="index"
          :class="[
            'px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-200 flex items-center gap-2',
            item.divided ? 'border-t border-border' : '',
            'text-text-secondary hover:bg-primary/8 hover:text-primary',
          ]"
          @click="handleClick(item)"
        >
          <span v-if="item.icon" :class="item.icon" />
          {{ item.label }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
})

const emit = defineEmits(['command'])

const open = ref(false)
const dropdownRef = ref(null)

const toggleOpen = () => {
  open.value = !open.value
}

const handleClick = (item) => {
  emit('command', item.command)
  open.value = false
}

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

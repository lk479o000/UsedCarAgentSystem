<template>
  <div ref="selectRef" :class="['relative', className]">
    <label v-if="label" class="block text-sm font-medium text-text-primary mb-1.5">{{ label }}</label>
    <div
      :class="[
        'w-full border border-border rounded-md px-3 py-2 bg-white cursor-pointer flex items-center justify-between transition-all duration-300',
        'hover:border-gray-400',
        { 'border-primary shadow-[0_0_0_3px_rgba(14,165,233,0.15)]': open },
        { 'opacity-60 cursor-not-allowed': disabled },
      ]"
      @click="toggleOpen"
    >
      <span :class="['text-sm', selectedLabel ? 'text-text-primary' : 'text-gray-400']">
        {{ selectedLabel || placeholder }}
      </span>
      <span :class="['i-lucide-chevron-down text-gray-400 transition-transform duration-300', { 'rotate-180': open }]" />
    </div>
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div
        v-if="open"
        class="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-border overflow-hidden"
      >
        <div
          v-for="opt in options"
          :key="opt.value"
          :class="[
            'px-4 py-2.5 text-sm cursor-pointer transition-colors duration-200 flex items-center justify-between',
            modelValue === opt.value ? 'bg-primary/12 text-primary font-semibold' : 'text-text-secondary hover:bg-primary/8 hover:text-primary',
          ]"
          @click.stop="selectOption(opt)"
        >
          {{ opt.label }}
          <span v-if="modelValue === opt.value" class="i-lucide-check text-primary" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '请选择' },
  disabled: { type: Boolean, default: false },
  className: { type: String, default: 'w-full' },
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const selectRef = ref(null)

const selectedLabel = computed(() => {
  const opt = props.options.find((o) => o.value === props.modelValue)
  return opt?.label || ''
})

const toggleOpen = () => {
  if (!props.disabled) open.value = !open.value
}

const selectOption = (opt) => {
  emit('update:modelValue', opt.value)
  open.value = false
}

const handleClickOutside = (e) => {
  if (selectRef.value && !selectRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

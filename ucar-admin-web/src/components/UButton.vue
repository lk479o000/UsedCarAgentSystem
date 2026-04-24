<template>
  <button
    :class="[
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 cursor-pointer outline-none',
      sizeClasses,
      variantClasses,
      { 'opacity-60 cursor-not-allowed': disabled || loading },
      { 'w-full': block },
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="i-lucide-loader-2 animate-spin" />
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  type: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-sm',
  md: 'px-5 py-2 text-base rounded-md',
  lg: 'px-6 py-2.5 text-lg rounded-lg',
}[props.size]

const variantClasses = {
  primary: 'bg-gradient-to-br from-primary to-primary-light text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-96 border-none',
  success: 'bg-gradient-to-br from-success to-highlight text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-96 border-none',
  danger: 'bg-gradient-to-br from-danger to-red-400 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-96 border-none',
  warning: 'bg-gradient-to-br from-warning to-amber-300 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-96 border-none',
  ghost: 'bg-transparent text-primary hover:bg-primary/10 border-none',
  default: 'bg-white border border-border text-text-primary hover:bg-gray-50 shadow-sm',
}[props.type]

const handleClick = (e) => {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}
</script>

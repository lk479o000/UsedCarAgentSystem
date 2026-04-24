<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium',
      variantClasses,
      { 'cursor-pointer hover:opacity-80': closable },
    ]"
  >
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full" :class="dotClasses" />
    <slot />
    <button v-if="closable" class="ml-0.5 opacity-70 hover:opacity-100 hover:scale-110 transition-all" @click="$emit('close')">
      <span class="i-lucide-x text-xs" />
    </button>
  </span>
</template>

<script setup>
const props = defineProps({
  type: { type: String, default: 'primary' },
  dot: { type: Boolean, default: true },
  closable: { type: Boolean, default: false },
})

defineEmits(['close'])

const variantClasses = {
  primary: 'bg-primary/10 text-primary-dark border border-primary/20',
  success: 'bg-success/10 text-teal-700 border border-success/20',
  warning: 'bg-warning/10 text-amber-700 border border-warning/20',
  danger: 'bg-danger/10 text-red-700 border border-danger/20',
  info: 'bg-info/10 text-blue-700 border border-info/20',
}[props.type]

const dotClasses = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
}[props.type]
</script>

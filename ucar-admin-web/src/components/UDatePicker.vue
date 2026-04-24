<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-text-primary mb-1.5">{{ label }}</label>
    <input
      :value="modelValue ? formatDate(modelValue) : ''"
      type="datetime-local"
      :class="[
        'w-full border border-border rounded-md px-3 py-2 transition-all duration-300 outline-none text-text-primary',
        'focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15),0_0_20px_rgba(14,165,233,0.1)]',
        'hover:border-gray-400',
      ]"
      @input="handleInput"
    >
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [String, Date], default: '' },
  label: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const handleInput = (e) => {
  emit('update:modelValue', e.target.value ? new Date(e.target.value).toISOString() : '')
}
</script>

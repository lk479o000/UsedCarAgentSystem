<template>
  <div class="mb-4">
    <label v-if="label" class="block text-sm font-medium text-text-primary mb-1.5">
      {{ label }}
      <span v-if="required" class="text-danger ml-0.5">*</span>
    </label>
    <slot />
    <p v-if="error" class="mt-1 text-sm text-danger">{{ error }}</p>
  </div>
</template>

<script setup>
import { inject, computed } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  prop: { type: String, default: '' },
})

const form = inject('form', null)

const required = computed(() => {
  if (!form || !props.prop) return false
  return form.rules[props.prop]?.some((r) => r.required)
})

const error = computed(() => {
  if (!form || !props.prop) return ''
  return form.errors[props.prop] || ''
})
</script>

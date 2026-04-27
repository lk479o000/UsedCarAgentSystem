<template>
  <form @submit.prevent="handleSubmit">
    <slot />
  </form>
</template>

<script setup>
import { provide, ref, reactive } from 'vue'

const props = defineProps({
  model: { type: Object, default: () => ({}) },
  rules: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['submit'])

const errors = reactive({})

const validate = async () => {
  let valid = true
  Object.keys(errors).forEach((k) => delete errors[k])

  for (const [key, rules] of Object.entries(props.rules)) {
    const value = props.model[key]
    for (const rule of rules) {
      if (rule.required && (value === undefined || value === null || (typeof value === 'string' && !value.trim()))) {
        errors[key] = rule.message || '必填项'
        valid = false
        break
      }
      if (rule.min && typeof value === 'string' && value.length < rule.min) {
        errors[key] = rule.message || `最少${rule.min}个字符`
        valid = false
        break
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[key] = rule.message || '格式不正确'
        valid = false
        break
      }
      if (rule.validator) {
        try {
          await new Promise((resolve, reject) => {
            rule.validator(rule, value, (err) => {
              if (err) reject(err)
              else resolve()
            })
          })
        } catch (err) {
          errors[key] = err.message || '验证失败'
          valid = false
          break
        }
      }
    }
  }
  return valid
}

const handleSubmit = async () => {
  const valid = await validate()
  if (valid) {
    emit('submit')
  }
}

provide('form', {
  model: props.model,
  rules: props.rules,
  errors,
  validate,
})

defineExpose({ validate })
</script>

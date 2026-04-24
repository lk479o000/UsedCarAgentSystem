<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-text-primary mb-1.5">{{ label }}</label>
    <div class="flex items-center">
      <button
        type="button"
        class="px-3 py-2 border border-border rounded-l-md bg-gray-50 hover:bg-gray-100 text-text-secondary transition-colors"
        @click="decrease"
      >
        -
      </button>
      <input
        :value="modelValue"
        type="number"
        :min="min"
        :class="[
          'flex-1 border-y border-border px-3 py-2 text-center text-text-primary outline-none',
          'focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)]',
        ]"
        @input="handleInput"
      >
      <button
        type="button"
        class="px-3 py-2 border border-border rounded-r-md bg-gray-50 hover:bg-gray-100 text-text-secondary transition-colors"
        @click="increase"
      >
        +
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  label: { type: String, default: '' },
  min: { type: Number, default: 0 },
  step: { type: Number, default: 1 },
})

const emit = defineEmits(['update:modelValue'])

const handleInput = (e) => {
  const val = Number(e.target.value)
  emit('update:modelValue', Math.max(props.min, val))
}

const decrease = () => {
  emit('update:modelValue', Math.max(props.min, props.modelValue - props.step))
}

const increase = () => {
  emit('update:modelValue', props.modelValue + props.step)
}
</script>

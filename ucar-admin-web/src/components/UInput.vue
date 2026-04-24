<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-text-primary mb-1.5">{{ label }}</label>
    <div class="relative">
      <span v-if="prefixIcon" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <span :class="prefixIcon" class="inline-block w-5 h-5 text-gray-600" />
      </span>
      <input
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="[
          'w-full border border-border rounded-md transition-all duration-300 outline-none text-text-primary',
          'focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15),0_0_20px_rgba(14,165,233,0.1)]',
          'hover:border-gray-400',
          sizeClasses,
          { 'pl-10': prefixIcon },
          { 'opacity-60 cursor-not-allowed': disabled },
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      >
      <span v-if="suffixIcon" class="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer z-10" @click="$emit('suffix-click')" :title="suffixTitle">
        <span :class="suffixIcon" class="inline-block w-5 h-5 text-gray-600">
      </span>
</span>
    </div>
    <p v-if="error" class="mt-1 text-sm text-danger">{{ error }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  prefixIcon: { type: String, default: '' },
  suffixIcon: { type: String, default: '' },
  suffixTitle: { type: String, default: '' },
  size: { type: String, default: 'md' },
  error: { type: String, default: '' },
})

defineEmits(['update:modelValue', 'blur', 'focus', 'suffix-click'])

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-2.5 text-lg',
}[props.size || 'md']
</script>

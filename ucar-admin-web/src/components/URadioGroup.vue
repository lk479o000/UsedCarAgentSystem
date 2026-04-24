<template>
  <div class="flex flex-wrap gap-4">
    <label
      v-for="opt in options"
      :key="opt.value"
      class="flex items-center gap-2 cursor-pointer group"
    >
      <div class="relative">
        <input
          type="radio"
          :value="opt.value"
          :checked="modelValue === opt.value"
          class="peer sr-only"
          @change="$emit('update:modelValue', opt.value)"
        >
        <div class="w-4 h-4 rounded-full border-2 border-border peer-checked:border-primary transition-colors" />
        <div class="absolute inset-1 rounded-full bg-primary scale-0 peer-checked:scale-100 transition-transform" />
      </div>
      <span class="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{{ opt.label }}</span>
    </label>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
})

defineEmits(['update:modelValue'])
</script>

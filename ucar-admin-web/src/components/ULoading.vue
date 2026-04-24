<template>
  <div v-if="loading" class="flex items-center justify-center py-12">
    <div class="relative w-10 h-10">
      <div class="absolute inset-0 rounded-full border-3 border-primary/20" />
      <div class="absolute inset-0 rounded-full border-3 border-transparent border-t-primary animate-spin" />
    </div>
    <span v-if="text" class="ml-3 text-sm text-text-secondary">{{ text }}</span>
  </div>
  <slot v-else />
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  text: { type: String, default: '' },
})
</script>

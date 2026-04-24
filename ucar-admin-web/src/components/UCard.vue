<template>
  <div
    :class="[
      'bg-surface rounded-lg shadow-md border border-border overflow-hidden relative transition-all duration-300',
      { 'hover:shadow-lg hover:-translate-y-0.5': hover },
      { 'bg-white/95 backdrop-blur-xl shadow-lg border-white/30': glass },
    ]"
  >
    <div
      v-if="$slots.header || title"
      class="px-6 py-4 border-b border-border flex items-center justify-between min-h-[64px] gap-6"
    >
      <slot name="header">
        <span class="font-semibold text-text-primary">{{ title }}</span>
      </slot>
    </div>
    <div :class="['p-6', bodyClass]">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-border bg-gray-50/50">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  hover: { type: Boolean, default: false },
  glass: { type: Boolean, default: false },
  bodyClass: { type: String, default: '' },
})
</script>

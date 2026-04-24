<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleClose" />
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="modelValue"
            class="relative bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/30 overflow-hidden w-full"
            :style="{ maxWidth: width, maxHeight: '90vh', overflowY: 'auto' }"
          >
            <div class="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/8 to-primary-light/5 flex items-center justify-between">
              <h3 class="text-lg font-bold text-text-primary tracking-tight">{{ title }}</h3>
              <button class="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/10 transition-all" @click="handleClose">
                <span class="i-lucide-x text-lg" />
              </button>
            </div>
            <div class="p-6">
              <slot />
            </div>
            <div v-if="$slots.footer" class="px-6 py-4 border-t border-border bg-gradient-to-b from-gray-50/50 to-white/80">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: String, default: '500px' },
})

const emit = defineEmits(['update:modelValue'])

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>

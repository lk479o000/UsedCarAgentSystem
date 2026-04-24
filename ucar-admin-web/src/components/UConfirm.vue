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
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="handleCancel" />
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            class="relative bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/30 overflow-hidden w-full max-w-md"
          >
            <div class="px-6 py-5">
              <div class="flex items-start gap-4">
                <div :class="['w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', iconBgClass]">
                  <span :class="['text-xl', iconClass]" />
                </div>
                <div>
                  <h3 class="text-lg font-bold text-text-primary">{{ title }}</h3>
                  <p class="mt-1 text-sm text-text-secondary leading-relaxed">{{ message }}</p>
                </div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-border bg-gradient-to-b from-gray-50/50 to-white/80 flex justify-end gap-3">
              <button class="px-5 py-2 rounded-md border border-border text-sm font-medium text-text-secondary hover:bg-gray-50 transition-all" @click="handleCancel">
                {{ cancelText }}
              </button>
              <button :class="['px-5 py-2 rounded-md text-sm font-medium text-white transition-all', confirmBtnClass]" @click="handleConfirm">
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '提示' },
  message: { type: String, default: '' },
  type: { type: String, default: 'warning' },
  confirmText: { type: String, default: '确认' },
  cancelText: { type: String, default: '取消' },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const iconMap = {
  warning: 'i-lucide-triangle-alert text-warning',
  danger: 'i-lucide-circle-x text-danger',
  info: 'i-lucide-info text-primary',
  success: 'i-lucide-circle-check text-success',
}

const iconBgMap = {
  warning: 'bg-warning/10',
  danger: 'bg-danger/10',
  info: 'bg-primary/10',
  success: 'bg-success/10',
}

const confirmBtnMap = {
  warning: 'bg-gradient-to-br from-warning to-amber-400 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
  danger: 'bg-gradient-to-br from-danger to-red-400 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
  info: 'bg-gradient-to-br from-primary to-primary-light hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
  success: 'bg-gradient-to-br from-success to-highlight hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
}

const iconClass = iconMap[props.type]
const iconBgClass = iconBgMap[props.type]
const confirmBtnClass = confirmBtnMap[props.type]

const handleCancel = () => {
  emit('update:modelValue', false)
}

const handleConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

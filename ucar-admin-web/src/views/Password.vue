<template>
  <div class="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-background to-border p-8 animate-fade-in">
    <UCard class="w-[500px] max-w-full" glass>
      <template #header>
        <div class="flex flex-col pt-6 px-6 pb-0">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-2xl text-white mb-5 shadow-[0_8px_24px_rgba(14,165,233,0.35)]">
            <span class="i-lucide-lock" />
          </div>
          <h2 class="text-xl font-bold text-text-primary tracking-tight">修改密码</h2>
          <p class="text-sm text-text-secondary mt-1">请定期更换密码以保障账户安全</p>
        </div>
      </template>

      <UForm ref="formRef" :model="form" :rules="rules" @submit="handleSubmit">
        <UFormItem label="原密码" prop="oldPassword">
          <UInput
            v-model="form.oldPassword"
            :type="oldPasswordVisible ? 'text' : 'password'"
            placeholder="请输入原密码"
            prefix-icon="i-lucide-lock-keyhole"
            :suffix-icon="oldPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            :suffix-title="oldPasswordVisible ? '屏蔽密码' : '将密码显示为纯文本。注意：这会将您的密码暴露在屏幕上。'"
            size="lg"
            @suffix-click="oldPasswordVisible = !oldPasswordVisible"
          />
        </UFormItem>
        <UFormItem label="新密码" prop="newPassword">
          <UInput
            v-model="form.newPassword"
            :type="newPasswordVisible ? 'text' : 'password'"
            placeholder="请输入新密码（至少8位，包含字母和数字）"
            prefix-icon="i-lucide-lock-keyhole"
            :suffix-icon="newPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            :suffix-title="newPasswordVisible ? '屏蔽密码' : '将密码显示为纯文本。注意：这会将您的密码暴露在屏幕上。'"
            size="lg"
            @input="updatePasswordStrength"
            @suffix-click="newPasswordVisible = !newPasswordVisible"
          />
          <div v-if="form.newPassword" class="mt-2">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-text-secondary">密码强度：</span>
              <span class="text-sm" :class="passwordStrengthClass">{{ passwordStrengthText }}</span>
            </div>
            <div class="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-300" 
                :class="passwordStrengthBarClass"
                :style="{ width: passwordStrengthWidth + '%' }"
              ></div>
            </div>
            <div class="mt-2 text-xs text-text-secondary">
              <ul class="list-disc list-inside space-y-0.5">
                <li :class="{ 'text-green-500': hasLength, 'text-text-secondary': !hasLength }">至少8个字符</li>
                <li :class="{ 'text-green-500': hasUppercase, 'text-text-secondary': !hasUppercase }">包含大写字母</li>
                <li :class="{ 'text-green-500': hasLowercase, 'text-text-secondary': !hasLowercase }">包含小写字母</li>
                <li :class="{ 'text-green-500': hasNumber, 'text-text-secondary': !hasNumber }">包含数字</li>
                <li :class="{ 'text-green-500': hasSpecial, 'text-text-secondary': !hasSpecial }">包含特殊字符</li>
              </ul>
            </div>
          </div>
        </UFormItem>
        <UFormItem label="确认密码" prop="confirmPassword">
          <UInput
            v-model="form.confirmPassword"
            :type="confirmPasswordVisible ? 'text' : 'password'"
            placeholder="请确认新密码"
            prefix-icon="i-lucide-lock-keyhole"
            :suffix-icon="confirmPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            :suffix-title="confirmPasswordVisible ? '屏蔽密码' : '将密码显示为纯文本。注意：这会将您的密码暴露在屏幕上。'"
            size="lg"
            @suffix-click="confirmPasswordVisible = !confirmPasswordVisible"
          />
        </UFormItem>
        <div class="flex gap-3 pt-2">
          <UButton type="primary" size="lg" class="flex-1 h-11" :loading="loading" @click="handleSubmit">
            保存修改
          </UButton>
          <UButton type="default" size="lg" class="flex-1 h-11" @click="handleCancel">
            取消
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@/composables/useMessage'
import { changePassword } from '@/api/auth'
import UCard from '@/components/UCard.vue'
import UForm from '@/components/UForm.vue'
import UFormItem from '@/components/UFormItem.vue'
import UInput from '@/components/UInput.vue'
import UButton from '@/components/UButton.vue'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 密码可见性状态
const oldPasswordVisible = ref(false)
const newPasswordVisible = ref(false)
const confirmPasswordVisible = ref(false)

// 密码强度相关状态
const passwordStrength = ref(0)
const hasLength = ref(false)
const hasUppercase = ref(false)
const hasLowercase = ref(false)
const hasNumber = ref(false)
const hasSpecial = ref(false)

// 密码强度文本
const passwordStrengthText = computed(() => {
  switch (passwordStrength.value) {
    case 0: return '请输入密码'
    case 1: return '弱'
    case 2: return '一般'
    case 3: return '良好'
    case 4: return '强'
    default: return '请输入密码'
  }
})

// 密码强度样式
const passwordStrengthClass = computed(() => {
  switch (passwordStrength.value) {
    case 0: return 'text-text-secondary'
    case 1: return 'text-red-500'
    case 2: return 'text-orange-500'
    case 3: return 'text-yellow-500'
    case 4: return 'text-green-500'
    default: return 'text-text-secondary'
  }
})

// 密码强度条样式
const passwordStrengthBarClass = computed(() => {
  switch (passwordStrength.value) {
    case 0: return 'bg-gray-300'
    case 1: return 'bg-red-500'
    case 2: return 'bg-orange-500'
    case 3: return 'bg-yellow-500'
    case 4: return 'bg-green-500'
    default: return 'bg-gray-300'
  }
})

// 密码强度宽度
const passwordStrengthWidth = computed(() => {
  return (passwordStrength.value / 4) * 100
})

// 密码强度检测
const updatePasswordStrength = () => {
  const password = form.newPassword
  let strength = 0
  
  // 长度检查
  hasLength.value = password.length >= 8
  if (hasLength.value) strength++
  
  // 大写字母检查
  hasUppercase.value = /[A-Z]/.test(password)
  if (hasUppercase.value) strength++
  
  // 小写字母检查
  hasLowercase.value = /[a-z]/.test(password)
  if (hasLowercase.value) strength++
  
  // 数字检查
  hasNumber.value = /[0-9]/.test(password)
  if (hasNumber.value) strength++
  
  // 特殊字符检查
  hasSpecial.value = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  if (hasSpecial.value) strength++
  
  passwordStrength.value = Math.min(strength, 4)
}

// 常见弱密码列表
const commonWeakPasswords = [
  '123456', 'password', '123456789', '12345678', '12345',
  '1234567', '1234567890', 'qwerty', 'abc123', '1234',
  '123456a', '12345678a', 'password1', 'password123', '123456789a'
]

// 检查是否为弱密码
const isWeakPassword = (password) => {
  return commonWeakPasswords.includes(password.toLowerCase())
}

const rules = {
  oldPassword: [{ required: true, message: '请输入原密码' }],
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: 8, message: '新密码长度不能少于8位' },
    {
      validator: (rule, value, callback) => {
        if (value === form.oldPassword) {
          callback(new Error('新密码不能与原密码相同'))
        } else {
          callback()
        }
      },
    },
    {
      validator: (rule, value, callback) => {
        if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
          callback(new Error('新密码必须包含字母和数字'))
        } else {
          callback()
        }
      },
    },
    {
      validator: (rule, value, callback) => {
        if (isWeakPassword(value)) {
          callback(new Error('新密码过于简单，请选择更复杂的密码'))
        } else {
          callback()
        }
      },
    },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
    },
  ],
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  try {
    await changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
      newPasswordConfirm: form.confirmPassword,
    })
    Message.success('密码修改成功')
    router.push('/')
  } catch (error) {
    Message.error('密码修改失败，请检查原密码是否正确')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  router.push('/')
}
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] relative overflow-hidden" tabindex="0" @keyup.enter="handleLogin">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-40 bg-gradient-to-br from-primary to-primary-light -top-[100px] -right-[100px] animate-[float_8s_ease-in-out_infinite]" />
      <div class="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-40 bg-gradient-to-br from-success to-highlight -bottom-[80px] -left-[80px] animate-[float_10s_ease-in-out_infinite_reverse]" />
      <div class="absolute w-[200px] h-[200px] rounded-full blur-[80px] opacity-30 bg-gradient-to-br from-primary-light to-highlight top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[pulse_6s_ease-in-out_infinite]" />
    </div>

    <!-- 登录卡片 -->
    <div class="relative z-10 w-[420px] max-w-[90%] bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.1)] border border-white/20 overflow-hidden">
      <div class="pt-9 px-9 pb-0">
        <div class="flex flex-col items-center">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-xl font-bold text-white mb-5 shadow-[0_8px_24px_rgba(14,165,233,0.35)]">
            UC
          </div>
          <h2 class="text-2xl font-bold text-text-primary tracking-tight">二手车经纪人系统</h2>
          <p class="text-sm text-text-secondary mt-2 tracking-widest">专业 · 高效 · 智能</p>
        </div>
      </div>
      <div class="p-9 pt-8">
        <div class="space-y-4">
          <UInput
            v-model="form.username"
            placeholder="请输入账号"
            prefix-icon="i-lucide-user"
            size="lg"
            @keyup.enter="handleLogin"
          />
          <UInput
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="i-lucide-lock"
            size="lg"
            @keyup.enter="handleLogin"
          />
          <div v-if="!isDev" class="flex gap-3">
            <UInput
              v-model="form.captcha"
              placeholder="请输入验证码"
              prefix-icon="i-lucide-key"
              size="lg"
              class="flex-1"
              @keyup.enter="handleLogin"
            />
            <img
              :src="captchaImage"
              class="h-11 w-[35%] rounded-lg border border-border cursor-pointer hover:border-primary hover:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] transition-all object-cover"
              alt="验证码"
              @click="refreshCaptcha"
            >
          </div>
          <UButton type="primary" size="lg" block :loading="loading" class="mt-2 h-11 text-base font-semibold shadow-[0_4px_16px_rgba(14,165,233,0.35)] hover:shadow-[0_8px_24px_rgba(14,165,233,0.45)]" @click="handleLogin">
            登录
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { Message } from '@/composables/useMessage'
import { getCaptcha, login } from '@/api/auth'
import UInput from '@/components/UInput.vue'
import UButton from '@/components/UButton.vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const captchaImage = ref('')
const captchaId = ref('')
const isDev = ref(import.meta.env.DEV)

const form = reactive({
  username: '',
  password: '',
  captcha: '',
  captchaId: '',
})

const refreshCaptcha = async () => {
  try {
    const res = await getCaptcha()
    captchaImage.value = res.data.captchaImage
    captchaId.value = res.data.captchaId
    form.captchaId = res.data.captchaId
  } catch (error) {
    Message.error('获取验证码失败')
  }
}

const handleLogin = async () => {
  if (isDev.value) {
    loading.value = true
    try {
      const res = await login({
        username: form.username,
        password: form.password,
        captcha: '1234',
        captchaId: 'dev',
      })
      userStore.setToken(res.data.token)
      userStore.setUserInfo(res.data.userInfo)
      Message.success('登录成功')
      router.push('/')
    } catch (error) {
      Message.error('登录失败')
    } finally {
      loading.value = false
    }
  } else {
    if (!form.username || !form.password || !form.captcha) {
      Message.warning('请填写完整信息')
      return
    }
    loading.value = true
    try {
      const res = await login({
        username: form.username,
        password: form.password,
        captcha: form.captcha,
        captchaId: form.captchaId,
      })
      userStore.setToken(res.data.token)
      userStore.setUserInfo(res.data.userInfo)
      Message.success('登录成功')
      router.push('/')
    } catch (error) {
      refreshCaptcha()
    } finally {
      loading.value = false
    }
  }
}

onMounted(() => {
  if (isDev.value) {
    form.username = 'admin'
    form.password = '123456'
  }
  refreshCaptcha()
})
</script>

<style scoped>
@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(30px, -30px); }
  66% { transform: translate(-20px, 20px); }
}
@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
  50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
}
</style>

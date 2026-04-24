<template>
  <div class="animate-fade-in">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <span class="font-semibold text-text-primary text-xl tracking-tight">经纪人管理</span>
          <UButton type="primary" @click="showAddDialog">新增经纪人</UButton>
        </div>
      </template>

      <!-- 搜索表单 -->
      <div class="flex flex-wrap items-end gap-4 mb-5 p-5 bg-surface rounded-xl shadow-sm border border-border">
        <div class="flex items-end gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap mb-2">姓名</label>
          <UInput v-model="searchForm.username" placeholder="请输入" class="w-40" />
        </div>
        <div class="flex items-end gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap mb-2">状态</label>
          <USelect v-model="searchForm.status" :options="statusOptions" placeholder="请选择" className="w-24" />
        </div>
        <div class="flex gap-2">
          <UButton type="primary" @click="handleSearch">查询</UButton>
          <UButton type="default" @click="resetSearch">重置</UButton>
        </div>
      </div>

      <!-- 表格 -->
      <ULoading :loading="loading">
        <UTable :data="tableData" :columns="columns">
          <template #status="{ row }">
            <UTag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </UTag>
          </template>
          <template #action="{ row }">
            <UButton
              :type="row.status === 1 ? 'danger' : 'success'"
              size="sm"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </UButton>
          </template>
        </UTable>
      </ULoading>

      <!-- 分页 -->
      <UPagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        @update:current-page="handlePageChange"
        @update:page-size="handleSizeChange"
      />
    </UCard>

    <!-- 新增经纪人对话框 -->
    <UDialog v-model="dialogVisible" title="新增经纪人" width="500px">
      <UForm ref="formRef" :model="form" :rules="formRules">
        <UFormItem label="姓名" prop="username">
          <UInput v-model="form.username" placeholder="请输入姓名" />
        </UFormItem>
        <UFormItem label="手机号" prop="phone">
          <UInput v-model="form.phone" placeholder="请输入手机号" type="number" @input="handlePhoneChange" />
        </UFormItem>
        <UFormItem label="账号" prop="userid">
          <UInput v-model="form.userid" placeholder="请输入账号" />
        </UFormItem>
        <UFormItem label="初始密码" prop="password">
          <UInput v-model="form.password" type="password" placeholder="请输入初始密码" />
        </UFormItem>
      </UForm>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton type="default" @click="dialogVisible = false">取消</UButton>
          <UButton type="primary" @click="handleSubmit">确定</UButton>
        </div>
      </template>
    </UDialog>

    <!-- 确认对话框 -->
    <UConfirm
      v-model="toggleConfirmVisible"
      :title="`确认${toggleAction}`"
      :message="`确认${toggleAction}该经纪人?`"
      type="warning"
      @confirm="confirmToggle"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@/composables/useMessage'
import { getUserList, createUser, updateUser } from '@/api/user'
import UCard from '@/components/UCard.vue'
import UButton from '@/components/UButton.vue'
import UInput from '@/components/UInput.vue'
import USelect from '@/components/USelect.vue'
import UTable from '@/components/UTable.vue'
import UTag from '@/components/UTag.vue'
import UPagination from '@/components/UPagination.vue'
import UDialog from '@/components/UDialog.vue'
import UForm from '@/components/UForm.vue'
import UFormItem from '@/components/UFormItem.vue'
import ULoading from '@/components/ULoading.vue'
import UConfirm from '@/components/UConfirm.vue'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const toggleConfirmVisible = ref(false)
const toggleAction = ref('')
const currentRow = ref(null)
const formRef = ref()

const searchForm = reactive({ username: '', status: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })

const form = reactive({ userid: '', username: '', phone: '', password: '' })

const formRules = {
  userid: [{ required: true, message: '请输入账号' }],
  username: [{ required: true, message: '请输入姓名' }],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号' },
  ],
  password: [{ required: true, message: '请输入初始密码' }],
}

const statusOptions = [
  { label: '禁用', value: 0 },
  { label: '启用', value: 1 },
]

const columns = [
  { key: 'userid', title: '账号' },
  { key: 'username', title: '姓名' },
  { key: 'phone', title: '手机号' },
  { key: 'status', title: '状态' },
  { key: 'createdAt', title: '创建时间' },
  { key: 'action', title: '操作', width: '200px' },
]

const loadData = async () => {
  loading.value = true
  try {
    const res = await getUserList({ ...searchForm, page: pagination.page, size: pagination.size })
    tableData.value = res.data.list
    pagination.total = res.data.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; loadData() }
const resetSearch = () => { searchForm.username = ''; searchForm.status = ''; handleSearch() }
const handleSizeChange = (size) => { pagination.size = size; loadData() }
const handlePageChange = (page) => { pagination.page = page; loadData() }

const showAddDialog = () => {
  Object.assign(form, { userid: '', username: '', phone: '', password: '123456' })
  dialogVisible.value = true
}

const handlePhoneChange = (value) => {
  form.userid = value
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  await createUser(form)
  Message.success('新增成功')
  dialogVisible.value = false
  loadData()
}

const handleToggleStatus = (row) => {
  currentRow.value = row
  toggleAction.value = row.status === 1 ? '禁用' : '启用'
  toggleConfirmVisible.value = true
}

const confirmToggle = async () => {
  await updateUser(currentRow.value.id, { status: currentRow.value.status === 1 ? 0 : 1 })
  Message.success(`${toggleAction.value}成功`)
  loadData()
}

onMounted(() => { loadData() })
</script>

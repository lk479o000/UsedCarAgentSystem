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
        <UTable :data="tableData" :columns="columns" @row-click="handleRowClick">
          <template #status="{ row }">
            <UTag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </UTag>
          </template>
          <template #action="{ row }">
            <div class="flex gap-2">
              <UButton
                :type="row.status === 1 ? 'danger' : 'success'"
                size="sm"
                @click.stop="handleToggleStatus(row)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </UButton>
              <UButton type="primary" size="sm" @click.stop="showEditDialog(row)">
                编辑
              </UButton>
              <UButton type="default" size="sm" @click.stop="handleResetPassword(row)">
                重置密码
              </UButton>
            </div>
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
          <UInput
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入初始密码"
            :suffix-icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
            :suffix-title="showPassword ? '屏蔽密码' : '将密码显示为纯文本。注意：这会将您的密码暴露在屏幕上。'"
            @suffix-click="showPassword = !showPassword"
          />
        </UFormItem>
        <UFormItem label="备注" prop="remark">
          <UInput
            v-model="form.remark"
            placeholder="请输入备注"
            type="textarea"
            :rows="3"
          />
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

    <!-- 重置密码确认对话框 -->
    <UConfirm
      v-model="resetPasswordVisible"
      title="确认重置密码"
      message="确认重置该经纪人的密码?重置后密码将变为123456"
      type="warning"
      @confirm="confirmResetPassword"
    />

    <!-- 详情对话框 -->
    <UDialog v-model="detailDialogVisible" title="经纪人详情" width="500px">
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">账号</span>
          <span class="text-sm text-text-primary">{{ detailForm.userid }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">姓名</span>
          <span class="text-sm text-text-primary">{{ detailForm.username }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">手机号</span>
          <span class="text-sm text-text-primary">{{ detailForm.phone }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">状态</span>
          <UTag :type="detailForm.status === 1 ? 'success' : 'danger'">
            {{ detailForm.status === 1 ? '启用' : '禁用' }}
          </UTag>
        </div>
        <div class="flex items-start gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">备注</span>
          <span class="text-sm text-text-primary">{{ detailForm.remark || '无' }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">创建时间</span>
          <span class="text-sm text-text-primary">{{ detailForm.createdAt }}</span>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton type="primary" @click="showEditDialog(detailForm)">编辑</UButton>
          <UButton type="default" @click="detailDialogVisible = false">关闭</UButton>
        </div>
      </template>
    </UDialog>

    <!-- 编辑对话框 -->
    <UDialog v-model="editDialogVisible" title="编辑经纪人" width="500px">
      <UForm ref="editFormRef" :model="editForm" :rules="editFormRules">
        <UFormItem label="账号" prop="userid">
          <UInput v-model="editForm.userid" placeholder="请输入账号" disabled />
        </UFormItem>
        <UFormItem label="姓名" prop="username">
          <UInput v-model="editForm.username" placeholder="请输入姓名" />
        </UFormItem>
        <UFormItem label="手机号" prop="phone">
          <UInput v-model="editForm.phone" placeholder="请输入手机号" type="number" />
        </UFormItem>
        <UFormItem label="状态" prop="status">
          <USelect v-model="editForm.status" :options="statusOptions" placeholder="请选择" />
        </UFormItem>
        <UFormItem label="备注" prop="remark">
          <UInput
            v-model="editForm.remark"
            placeholder="请输入备注"
            type="textarea"
            :rows="3"
          />
        </UFormItem>
      </UForm>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton type="default" @click="editDialogVisible = false">取消</UButton>
          <UButton type="primary" @click="handleEditSubmit">确定</UButton>
        </div>
      </template>
    </UDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@/composables/useMessage'
import { getUserList, createUser, updateUser, resetPassword } from '@/api/user'
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
const detailDialogVisible = ref(false)
const editDialogVisible = ref(false)
const toggleConfirmVisible = ref(false)
const resetPasswordVisible = ref(false)
const toggleAction = ref('')
const currentRow = ref(null)
const formRef = ref()
const editFormRef = ref()

const searchForm = reactive({ username: '', status: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })

const form = reactive({ userid: '', username: '', phone: '', password: '', remark: '' })
const detailForm = reactive({ userid: '', username: '', phone: '', status: 1, createdAt: '', remark: '' })
const editForm = reactive({ id: '', userid: '', username: '', phone: '', status: 1, remark: '' })
const showPassword = ref(false)

const formRules = {
  userid: [{ required: true, message: '请输入账号' }],
  username: [{ required: true, message: '请输入姓名' }],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号' },
  ],
  password: [{ required: true, message: '请输入初始密码' }],
}

const editFormRules = {
  username: [{ required: true, message: '请输入姓名' }],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号' },
  ],
  status: [{ required: true, message: '请选择状态' }],
}

const statusOptions = [
  { label: '禁用', value: 0 },
  { label: '启用', value: 1 },
]

const columns = [
  { key: 'userid', title: '账号', width: '120px' },
  { key: 'username', title: '姓名', width: '100px' },
  { key: 'phone', title: '手机号', width: '130px' },
  { key: 'status', title: '状态', width: '80px' },
  { key: 'createdAt', title: '创建时间', width: '180px' },
  { key: 'action', title: '操作', width: '220px' },
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
  Object.assign(form, { userid: '', username: '', phone: '', password: '123456', remark: '' })
  showPassword.value = false
  dialogVisible.value = true
}

const handlePhoneChange = (event) => {
  form.userid = event.target.value
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  try {
    await createUser(form)
    Message.success('新增成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    // 错误已经在request拦截器中处理，这里不需要重复处理
  }
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

const handleRowClick = (row) => {
  Object.assign(detailForm, row)
  detailDialogVisible.value = true
}

const showEditDialog = (row) => {
  Object.assign(editForm, row)
  editDialogVisible.value = true
}

const handleEditSubmit = async () => {
  const valid = await editFormRef.value?.validate()
  if (!valid) return
  try {
    await updateUser(editForm.id, editForm)
    Message.success('编辑成功')
    editDialogVisible.value = false
    loadData()
  } catch (error) {
    // 错误已经在request拦截器中处理，这里不需要重复处理
  }
}

const handleResetPassword = (row) => {
  currentRow.value = row
  resetPasswordVisible.value = true
}

const confirmResetPassword = async () => {
  try {
    await resetPassword(currentRow.value.id)
    Message.success('密码重置成功，默认密码为123456')
  } catch (error) {
    // 错误已经在request拦截器中处理，这里不需要重复处理
  }
}

onMounted(() => { loadData() })
</script>

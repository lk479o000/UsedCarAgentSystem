<template>
  <div class="animate-fade-in">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <span class="font-semibold text-text-primary text-xl tracking-tight">线索管理</span>
          <div v-if="userStore.isAdmin" class="flex gap-3">
            <UButton type="success" @click="handleExport">导出Excel</UButton>
            <UButton type="primary" @click="showAddDialog">新增线索</UButton>
          </div>
        </div>
      </template>

      <!-- 搜索表单 -->
      <div class="flex flex-wrap items-end gap-4 mb-5 p-5 bg-surface rounded-xl shadow-sm border border-border">
        <div class="flex items-end gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap mb-2">客户姓名</label>
          <UInput v-model="searchForm.customerName" placeholder="请输入" class="w-40" />
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
            <UTag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</UTag>
          </template>
          <template #agent="{ row }">
            {{ row.agent?.username || '-' }}
          </template>
          <template #action="{ row }">
            <div class="flex gap-2">
              <UButton v-if="userStore.isAdmin" type="ghost" size="sm" @click="handleUpdateStatus(row)">更新状态</UButton>
              <UButton v-if="userStore.isAdmin" type="ghost" size="sm" @click="handleSettlement(row)">结算</UButton>
              <UButton v-if="userStore.isAdmin" type="ghost" size="sm" class="text-danger hover:text-danger hover:bg-danger/10" @click="handleDelete(row)">删除</UButton>
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

    <!-- 新增线索对话框 -->
    <UDialog v-model="dialogVisible" title="新增线索" width="500px">
      <UForm ref="formRef" :model="form" :rules="formRules">
        <UFormItem label="客户姓名" prop="customerName">
          <UInput v-model="form.customerName" />
        </UFormItem>
        <UFormItem label="客户电话" prop="customerPhone">
          <UInput v-model="form.customerPhone" />
        </UFormItem>
        <UFormItem label="车辆品牌">
          <UInput v-model="form.carBrand" />
        </UFormItem>
        <UFormItem label="车辆型号" prop="carModel">
          <UInput v-model="form.carModel" />
        </UFormItem>
        <UFormItem label="归属经纪人" prop="userId">
          <USelect v-model="form.userId" :options="agentOptions" placeholder="请选择经纪人" className="w-full" />
        </UFormItem>
        <UFormItem label="备注">
          <textarea
            v-model="form.notes"
            rows="3"
            class="w-full border border-border rounded-md px-3 py-2 transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] outline-none text-text-primary resize-none"
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

    <!-- 更新状态对话框 -->
    <UDialog v-model="statusDialogVisible" title="更新线索状态" width="500px">
      <UForm ref="statusFormRef" :model="statusForm">
        <UFormItem label="当前状态">
          <UTag :type="getStatusType(currentRow?.status)">{{ getStatusText(currentRow?.status) }}</UTag>
        </UFormItem>
        <UFormItem label="新状态" prop="status">
          <USelect v-model="statusForm.status" :options="availableStatusOptions" placeholder="请选择" className="w-full" />
        </UFormItem>
        <UFormItem v-if="statusForm.status === 4" label="成交价格">
          <UInputNumber v-model="statusForm.carActualPrice" :min="0" />
        </UFormItem>
        <UFormItem v-if="statusForm.status === 5" label="失败原因">
          <textarea
            v-model="statusForm.failReason"
            rows="3"
            class="w-full border border-border rounded-md px-3 py-2 transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] outline-none text-text-primary resize-none"
          />
        </UFormItem>
      </UForm>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton type="default" @click="statusDialogVisible = false">取消</UButton>
          <UButton type="primary" @click="handleStatusSubmit">确定</UButton>
        </div>
      </template>
    </UDialog>

    <!-- 结算对话框 -->
    <UDialog v-model="settlementDialogVisible" title="线索结算" width="500px">
      <UForm ref="settlementFormRef" :model="settlementForm" :rules="settlementFormRules">
        <UFormItem label="线索" prop="leadId">
          <div class="flex items-center">
            <UInput v-model="settlementForm.leadId" placeholder="请选择线索" readonly class="flex-1 rounded-r-none" />
            <UButton type="primary" class="rounded-l-none px-3" @click="openLeadSelectDialog">
              <span class="i-lucide-search" />
            </UButton>
          </div>
        </UFormItem>
        <UFormItem label="利润金额" prop="profit">
          <UInputNumber v-model="settlementForm.profit" :min="0" />
        </UFormItem>
        <UFormItem label="经纪人分成" prop="agentShare">
          <UInputNumber v-model="settlementForm.agentShare" :min="0" />
        </UFormItem>
        <UFormItem label="备注">
          <textarea
            v-model="settlementForm.remark"
            rows="3"
            class="w-full border border-border rounded-md px-3 py-2 transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] outline-none text-text-primary resize-none"
          />
        </UFormItem>
      </UForm>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton type="default" @click="settlementDialogVisible = false">取消</UButton>
          <UButton type="primary" @click="handleSettlementSubmit">确定</UButton>
        </div>
      </template>
    </UDialog>

    <!-- 线索选择对话框 -->
    <UDialog v-model="leadDialogVisible" title="选择线索" width="800px">
      <div class="flex flex-wrap items-end gap-4 mb-5 p-5 bg-surface rounded-xl shadow-sm border border-border">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap">客户姓名</label>
          <UInput v-model="leadSearchForm.customerName" placeholder="请输入" class="w-40" />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap">状态</label>
          <USelect v-model="leadSearchForm.status" :options="statusOptions" placeholder="请选择" className="w-24" />
        </div>
        <div class="flex gap-2">
          <UButton type="primary" @click="handleLeadSearch">查询</UButton>
          <UButton type="default" @click="leadSearchForm = { customerName: '', status: '' }; handleLeadSearch()">重置</UButton>
        </div>
      </div>
      <ULoading :loading="leadLoading">
        <UTable :data="leadTableData" :columns="leadColumns">
          <template #status="{ row }">
            <UTag :type="row.status === 4 ? 'success' : row.status === 5 ? 'danger' : 'info'">
              {{ row.status === 0 ? '待跟进' : row.status === 1 ? '跟进中' : row.status === 2 ? '已看车' : row.status === 3 ? '已报价' : row.status === 4 ? '已成交' : '已失败' }}
            </UTag>
          </template>
          <template #action="{ row }">
            <UButton type="primary" size="sm" @click="handleLeadSelect(row)">选择</UButton>
          </template>
        </UTable>
      </ULoading>
      <UPagination
        v-model:current-page="leadPagination.page"
        v-model:page-size="leadPagination.size"
        :total="leadPagination.total"
        @update:current-page="handleLeadPageChange"
        @update:page-size="handleLeadSizeChange"
      />
    </UDialog>

    <!-- 确认删除 -->
    <UConfirm
      v-model="deleteConfirmVisible"
      title="确认删除"
      message="确认删除该线索?"
      type="danger"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Message } from '@/composables/useMessage'
import { getLeadList, createLead, updateLead, deleteLead, exportLeads } from '@/api/lead'
import { createSettlement } from '@/api/settlement'
import { getUserList, getAgentLeads } from '@/api/user'
import { useUserStore } from '@/store/user'
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
import UInputNumber from '@/components/UInputNumber.vue'
import ULoading from '@/components/ULoading.vue'
import UConfirm from '@/components/UConfirm.vue'

const userStore = useUserStore()
const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const settlementDialogVisible = ref(false)
const leadDialogVisible = ref(false)
const deleteConfirmVisible = ref(false)
const currentRow = ref(null)
const formRef = ref()
const statusFormRef = ref()
const settlementFormRef = ref()
const agents = ref([])
const leadTableData = ref([])
const leadLoading = ref(false)

const searchForm = reactive({ customerName: '', status: '' })
const leadSearchForm = reactive({ customerName: '', status: '' })
const leadPagination = reactive({ page: 1, size: 20, total: 0 })
const pagination = reactive({ page: 1, size: 20, total: 0 })

const form = reactive({
  customerName: '', customerPhone: '', carBrand: '', carModel: '', userId: '', notes: '',
})

const statusForm = reactive({ status: '', carActualPrice: 0, failReason: '' })

const settlementForm = reactive({ leadId: '', profit: 0, agentShare: 0, remark: '' })

const formRules = {
  customerName: [{ required: true, message: '请输入客户姓名' }],
  customerPhone: [{ required: true, message: '请输入客户电话' }],
  // customerPhone: [
  //   { required: true, message: '请输入客户电话' },
  //   { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号' },
  // ],
  carModel: [{ required: true, message: '请输入车辆型号' }],
  userId: [{ required: true, message: '请选择归属经纪人' }],
}

const settlementFormRules = {
  leadId: [{ required: true, message: '请选择线索' }],
  profit: [{ required: true, message: '请输入利润金额' }],
  agentShare: [
    { required: true, message: '请输入经纪人分成' },
    {
      validator: (rule, value, callback) => {
        if (value > settlementForm.profit) {
          callback(new Error('经纪人分成不能大于利润金额'))
        } else {
          callback()
        }
      },
    },
  ],
}

const statusMap = {
  0: { text: '待跟进', type: 'info' },
  1: { text: '跟进中', type: 'primary' },
  2: { text: '已看车', type: 'warning' },
  3: { text: '已报价', type: 'warning' },
  4: { text: '已成交', type: 'success' },
  5: { text: '已失败', type: 'danger' },
}

const statusOptions = [
  { label: '待跟进', value: 0 },
  { label: '跟进中', value: 1 },
  { label: '已看车', value: 2 },
  { label: '已报价', value: 3 },
  { label: '已成交', value: 4 },
  { label: '已失败', value: 5 },
]

const getStatusText = (status) => statusMap[status]?.text || status
const getStatusType = (status) => statusMap[status]?.type || 'info'

const availableStatusOptions = computed(() => {
  if (!currentRow.value) return []
  const current = currentRow.value.status
  const flow = { 0: [1], 1: [2, 5], 2: [3, 5], 3: [4, 5] }
  const nextStatuses = flow[current] || []
  return nextStatuses.map((s) => ({ value: s, label: statusMap[s].text }))
})

const agentOptions = computed(() => agents.value.map((a) => ({ label: a.username, value: a.userid })))

const columns = [
  { key: 'customerName', title: '客户姓名' },
  { key: 'customerPhone', title: '客户电话' },
  { key: 'carBrand', title: '车辆品牌' },
  { key: 'carModel', title: '车辆型号' },
  { key: 'status', title: '状态' },
  { key: 'agent', title: '归属经纪人' },
  { key: 'createdAt', title: '创建时间' },
  { key: 'action', title: '操作', width: '250px' },
]

const leadColumns = [
  { key: 'customerName', title: '客户姓名' },
  { key: 'customerPhone', title: '客户电话' },
  { key: 'carBrand', title: '车辆品牌' },
  { key: 'carModel', title: '车辆型号' },
  { key: 'status', title: '状态' },
  { key: 'action', title: '操作', width: '100px' },
]

const loadData = async () => {
  loading.value = true
  try {
    let res
    if (userStore.isAdmin) {
      res = await getLeadList({ ...searchForm, page: pagination.page, size: pagination.size })
    } else {
      res = await getAgentLeads({ status: searchForm.status, page: pagination.page, size: pagination.size })
    }
    tableData.value = res.data.list
    pagination.total = res.data.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; loadData() }
const resetSearch = () => { searchForm.customerName = ''; searchForm.status = ''; handleSearch() }
const handleSizeChange = (size) => { pagination.size = size; loadData() }
const handlePageChange = (page) => { pagination.page = page; loadData() }

const showAddDialog = () => {
  Object.assign(form, { customerName: '', customerPhone: '', carBrand: '', carModel: '', userId: '', notes: '' })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  try {
    await createLead(form)
    Message.success('新增成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    // 错误已经在request拦截器中处理，这里不需要重复处理
  }
}

const handleUpdateStatus = (row) => {
  currentRow.value = row
  statusForm.status = ''
  statusForm.carActualPrice = 0
  statusForm.failReason = ''
  statusDialogVisible.value = true
}

const handleStatusSubmit = async () => {
  await updateLead(currentRow.value.id, {
    status: statusForm.status,
    carActualPrice: statusForm.carActualPrice,
    failReason: statusForm.failReason,
  })
  Message.success('状态更新成功')
  statusDialogVisible.value = false
  loadData()
}

const handleDelete = (row) => {
  currentRow.value = row
  deleteConfirmVisible.value = true
}

const confirmDelete = async () => {
  await deleteLead(currentRow.value.id)
  Message.success('删除成功')
  loadData()
}

const handleSettlement = (row) => {
  currentRow.value = row
  Object.assign(settlementForm, { leadId: row.id, profit: 0, agentShare: 0, remark: '' })
  settlementDialogVisible.value = true
}

const handleSettlementSubmit = async () => {
  const valid = await settlementFormRef.value?.validate()
  if (!valid) return
  await createSettlement(settlementForm)
  Message.success('结算成功')
  settlementDialogVisible.value = false
  loadData()
}

const loadLeads = async () => {
  leadLoading.value = true
  try {
    const res = await getLeadList({ ...leadSearchForm, page: leadPagination.page, size: leadPagination.size })
    leadTableData.value = res.data.list
    leadPagination.total = res.data.pagination.total
  } finally {
    leadLoading.value = false
  }
}

const handleLeadSearch = () => { leadPagination.page = 1; loadLeads() }
const handleLeadSizeChange = (size) => { leadPagination.size = size; loadLeads() }
const handleLeadPageChange = (page) => { leadPagination.page = page; loadLeads() }
const handleLeadSelect = (row) => { settlementForm.leadId = row.id; leadDialogVisible.value = false }
const openLeadSelectDialog = () => { leadPagination.page = 1; loadLeads(); leadDialogVisible.value = true }

const handleExport = async () => {
  try {
    const blob = await exportLeads(searchForm)
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `线索列表_${new Date().getTime()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    Message.success('导出成功')
  } catch (err) {
    Message.error('导出失败')
  }
}

const loadAgents = async () => {
  if (userStore.isAdmin) {
    try {
      const res = await getUserList({ page: 1, size: 100 })
      agents.value = res.data.list
    } catch (err) {
      Message.error('加载经纪人列表失败')
    }
  }
}

onMounted(() => { loadData(); loadAgents() })
</script>

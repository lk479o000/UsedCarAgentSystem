<template>
  <div class="animate-fade-in">
    <UCard no-clip>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <span class="font-semibold text-text-primary text-xl tracking-tight">结算管理</span>
          <div v-if="userStore.isAdmin" class="flex gap-3">
            <UButton type="success" @click="handleExport">导出Excel</UButton>
            <UButton type="primary" @click="showAddDialog">新增结算</UButton>
          </div>
        </div>
      </template>

      <!-- 搜索表单 -->
      <div class="flex flex-wrap items-end gap-4 mb-5 p-5 bg-surface rounded-xl shadow-sm border border-border">
        <div class="flex items-end gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap mb-2">客户</label>
          <UInput v-model="searchForm.customerKeyword" placeholder="客户姓名/手机号" class="w-44" />
        </div>
        <div v-if="userStore.isAdmin" class="flex items-end gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap mb-2">经纪人</label>
          <UInput v-model="searchForm.agentKeyword" placeholder="经纪人姓名/手机号" class="w-44" />
        </div>
        <div class="flex items-end gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap mb-2">地区</label>
          <UInput v-model="searchForm.regionKeyword" placeholder="省/市/区关键字" class="w-36" />
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
        <UTable :data="tableData" :columns="columns" fixed-first-column @row-click="handleRowClick">
          <template #profit="{ row }">
            {{ row.profit }} 元
          </template>
          <template #agentShare="{ row }">
            {{ row.agentShare }} 元
          </template>
          <template #status="{ row }">
            <UTag :type="row.status === 1 ? 'success' : 'warning'">
              {{ row.status === 1 ? '已结算' : '待结算' }}
            </UTag>
          </template>
          <template #settledAt="{ row }">
            {{ row.settledAt || '-' }}
          </template>
          <template #action="{ row }">
            <UActionGroup :actions="getSettlementActions(row)" />
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

    <!-- 新增结算对话框 -->
    <UDialog v-model="dialogVisible" title="新增结算" width="500px">
      <UForm ref="formRef" :model="form" :rules="formRules">
        <UFormItem label="线索" prop="leadId">
          <div class="flex items-center">
            <UInput v-model="form.leadId" placeholder="请选择线索" readonly class="flex-1 rounded-r-none" />
            <UButton type="primary" class="rounded-l-none px-3" @click="openLeadSelectDialog">
              <span class="i-lucide-search" />
            </UButton>
          </div>
        </UFormItem>
        <UFormItem label="利润金额" prop="profit">
          <UInputNumber v-model="form.profit" :min="0" />
        </UFormItem>
        <UFormItem label="经纪人分成" prop="agentShare">
          <UInputNumber v-model="form.agentShare" :min="0" />
        </UFormItem>
        <UFormItem label="备注">
          <textarea
            v-model="form.remark"
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
    <UDialog v-model="statusDialogVisible" title="更新结算状态" width="500px">
      <UForm :model="statusForm">
        <UFormItem label="线索" prop="leadId">
          <UInput v-model="statusForm.leadInfo" placeholder="请选择线索" readonly />
        </UFormItem>
        <UFormItem label="利润金额">
          <UInput v-model="statusForm.profit" placeholder="请输入利润金额" readonly />
        </UFormItem>
        <UFormItem label="经纪人分成">
          <UInput v-model="statusForm.agentShare" placeholder="请输入经纪人分成" readonly />
        </UFormItem>
        <UFormItem label="状态">
          <URadioGroup v-model="statusForm.status" :options="[{ label: '待结算', value: 0 }, { label: '已结算', value: 1 }]" />
        </UFormItem>
        <UFormItem v-if="statusForm.status === 1" label="结算时间">
          <UDatePicker v-model="statusForm.settledAt" />
        </UFormItem>
        <UFormItem label="备注">
          <textarea
            v-model="statusForm.remark"
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

    <!-- 线索选择对话框 -->
    <UDialog v-model="leadDialogVisible" title="选择线索" width="800px">
      <div class="flex flex-wrap items-end gap-4 mb-5 p-5 bg-surface rounded-xl shadow-sm border border-border">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap">客户姓名</label>
          <UInput v-model="leadSearchForm.customerName" placeholder="请输入" class="w-40" />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap">状态</label>
          <USelect v-model="leadSearchForm.status" :options="leadStatusOptions" placeholder="请选择" className="w-24" />
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
            <UButton type="primary" size="sm" @click="statusDialogVisible ? handleLeadSelectForStatus(row) : handleLeadSelect(row)">选择</UButton>
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

    <!-- 详情对话框 -->
    <UDialog v-model="detailDialogVisible" title="结算详情" width="500px">
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">客户姓名</span>
          <span class="text-sm text-text-primary">{{ detailForm['lead.customerName'] || detailForm.lead?.customerName || '-' }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">车辆品牌</span>
          <span class="text-sm text-text-primary">{{ detailForm['lead.carBrand'] || detailForm.lead?.carBrand || '-' }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">车辆型号</span>
          <span class="text-sm text-text-primary">{{ detailForm['lead.carModel'] || detailForm.lead?.carModel || '-' }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">利润金额</span>
          <span class="text-sm text-text-primary">{{ detailForm.profit || 0 }} 元</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">经纪人分成</span>
          <span class="text-sm text-text-primary">{{ detailForm.agentShare || 0 }} 元</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">状态</span>
          <UTag :type="detailForm.status === 1 ? 'success' : 'warning'">
            {{ detailForm.status === 1 ? '已结算' : '待结算' }}
          </UTag>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">结算时间</span>
          <span class="text-sm text-text-primary">{{ detailForm.settledAt || '-' }}</span>
        </div>
        <div class="flex items-start gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">备注</span>
          <span class="text-sm text-text-primary">{{ detailForm.remark || '无' }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">创建时间</span>
          <span class="text-sm text-text-primary">{{ detailForm.createdAt || '-' }}</span>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton v-if="userStore.isAdmin" type="primary" @click="showEditDialog(detailForm)">编辑</UButton>
          <UButton type="default" @click="detailDialogVisible = false">关闭</UButton>
        </div>
      </template>
    </UDialog>

    <!-- 编辑对话框 -->
    <UDialog v-model="editDialogVisible" title="编辑结算" width="500px">
      <UForm ref="editFormRef" :model="editForm" :rules="editFormRules">
        <UFormItem label="线索">
          <UInput v-model="editForm.leadInfo" placeholder="请选择线索" readonly />
        </UFormItem>
        <UFormItem label="利润金额" prop="profit">
          <UInputNumber v-model="editForm.profit" :min="0" />
        </UFormItem>
        <UFormItem label="经纪人分成" prop="agentShare">
          <UInputNumber v-model="editForm.agentShare" :min="0" />
        </UFormItem>
        <UFormItem label="状态">
          <div class="text-text-primary">{{ editForm.status === 1 ? '已结算' : '待结算' }}</div>
        </UFormItem>
        <UFormItem v-if="editForm.status === 1" label="结算时间">
          <UInput v-model="editForm.settledAt" readonly />
        </UFormItem>
        <UFormItem label="备注" prop="remark">
          <textarea
            v-model="editForm.remark"
            rows="3"
            class="w-full border border-border rounded-md px-3 py-2 transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] outline-none text-text-primary resize-none"
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
import { ref, reactive, onMounted, computed } from 'vue'
import { Message } from '@/composables/useMessage'
import { getSettlementList, createSettlement, updateSettlement, pushNotify, exportSettlements } from '@/api/settlement'
import { getLeadList } from '@/api/lead'
import { getAgentSettlements } from '@/api/user'
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
import UDatePicker from '@/components/UDatePicker.vue'
import URadioGroup from '@/components/URadioGroup.vue'
import ULoading from '@/components/ULoading.vue'
import UActionGroup from '@/components/UActionGroup.vue'

const userStore = useUserStore()
const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const leadDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const editDialogVisible = ref(false)
const currentRow = ref(null)
const formRef = ref()
const editFormRef = ref()
const leadTableData = ref([])
const leadLoading = ref(false)

const searchForm = reactive({ customerKeyword: '', agentKeyword: '', regionKeyword: '', status: '' })
const leadSearchForm = reactive({ customerName: '', status: '' })
const leadPagination = reactive({ page: 1, size: 20, total: 0 })
const pagination = reactive({ page: 1, size: 20, total: 0 })

const form = reactive({ leadId: '', profit: 0, agentShare: 0, remark: '' })

const formRules = {
  leadId: [{ required: true, message: '请选择线索' }],
  profit: [{ required: true, message: '请输入利润金额' }],
  agentShare: [
    { required: true, message: '请输入经纪人分成' },
    {
      validator: (rule, value, callback) => {
        if (value > form.profit) {
          callback(new Error('经纪人分成不能大于利润金额'))
        } else {
          callback()
        }
      },
    },
  ],
}

const statusForm = reactive({ leadId: '', leadInfo: '', profit: 0, agentShare: 0, status: 0, settledAt: null, remark: '' })

const detailForm = reactive({ id: '', lead: null, profit: 0, agentShare: 0, status: 0, settledAt: null, remark: '', createdAt: '' })

const editForm = reactive({ id: '', leadId: '', leadInfo: '', profit: 0, agentShare: 0, status: 0, settledAt: null, remark: '' })

const editFormRules = {
  profit: [{ required: true, message: '请输入利润金额' }],
  agentShare: [
    { required: true, message: '请输入经纪人分成' },
    {
      validator: (rule, value, callback) => {
        if (value > editForm.profit) {
          callback(new Error('经纪人分成不能大于利润金额'))
        } else {
          callback()
        }
      },
    },
  ],
  remark: [{ required: false }],
}

const statusOptions = [
  { label: '待结算', value: 0 },
  { label: '已结算', value: 1 },
]

const leadStatusOptions = [
  { label: '待跟进', value: 0 },
  { label: '跟进中', value: 1 },
  { label: '已看车', value: 2 },
  { label: '已报价', value: 3 },
  { label: '已成交', value: 4 },
  { label: '已失败', value: 5 },
]

const getSettlementActions = (row) => {
  if (!userStore.isAdmin) return []
  return [
    { key: 'edit', label: '编辑', type: 'primary', handler: () => showEditDialog(row) },
    { key: 'status', label: '更新状态', type: 'default', handler: () => handleUpdate(row) },
    { key: 'notify', label: '推送提醒', type: 'warning', handler: () => handleNotify(row) },
  ]
}

const columns = computed(() => {
  const baseColumns = [
    { key: 'lead.customerName', title: '客户姓名', width: '120px' },
    { key: 'lead.carBrand', title: '车辆品牌', width: '120px' },
    { key: 'lead.carModel', title: '车辆型号', width: '150px' },
    { key: 'profit', title: '利润金额', width: '120px', align: 'right' },
    { key: 'agentShare', title: '经纪人分成', width: '120px', align: 'right' },
    { key: 'status', title: '状态', width: '100px', align: 'center' },
    { key: 'settledAt', title: '结算时间', width: '180px' },
  ]
  
  if (userStore.isAdmin) {
    baseColumns.push({ key: 'action', title: '操作', width: '160px', fixed: 'right' })
  }
  
  return baseColumns
})

const leadColumns = [
  { key: 'customerName', title: '客户姓名' },
  { key: 'customerPhone', title: '客户电话' },
  { key: 'carBrand', title: '车辆品牌' },
  { key: 'carModel', title: '车辆型号' },
  { key: 'status', title: '状态', align: 'center' },
  { key: 'action', title: '操作', width: '100px', align: 'center', fixed: 'right' },
]

const loadData = async () => {
  loading.value = true
  try {
    const customerKeyword = (searchForm.customerKeyword || '').trim()
    const agentKeyword = (searchForm.agentKeyword || '').trim()
    const regionKeyword = (searchForm.regionKeyword || '').trim()
    const keywordParams = {}
    if (customerKeyword) {
      Object.assign(keywordParams, /^\d{3,}$/.test(customerKeyword)
        ? { customer_phone: customerKeyword }
        : { customer_name: customerKeyword })
    }
    if (userStore.isAdmin && agentKeyword) {
      Object.assign(keywordParams, /^\d{3,}$/.test(agentKeyword)
        ? { agent_phone: agentKeyword }
        : { agent_name: agentKeyword })
    }
    if (regionKeyword) {
      keywordParams.region_keyword = regionKeyword
    }
    let res
    if (userStore.isAdmin) {
      res = await getSettlementList({ status: searchForm.status, ...keywordParams, page: pagination.page, size: pagination.size })
    } else {
      res = await getAgentSettlements({ status: searchForm.status, ...keywordParams, page: pagination.page, size: pagination.size })
    }
    tableData.value = res.data.list
    pagination.total = res.data.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pagination.page = 1; loadData() }
const resetSearch = () => {
  searchForm.customerKeyword = ''
  searchForm.agentKeyword = ''
  searchForm.regionKeyword = ''
  searchForm.status = ''
  handleSearch()
}
const handleSizeChange = (size) => { pagination.size = size; loadData() }
const handlePageChange = (page) => { pagination.page = page; loadData() }

const showAddDialog = () => {
  Object.assign(form, { leadId: '', profit: 0, agentShare: 0, remark: '' })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  await createSettlement(form)
  Message.success('新增成功')
  dialogVisible.value = false
  loadData()
}

const handleUpdate = (row) => {
  currentRow.value = row
  const leadInfo = row.lead ? `${row.lead.customerName}-${row.lead.customerPhone}-${row.lead.carModel}` : ''
  statusForm.leadId = row.lead?.id || ''
  statusForm.leadInfo = leadInfo
  statusForm.profit = row.profit || 0
  statusForm.agentShare = row.agentShare || 0
  statusForm.status = row.status
  statusForm.settledAt = row.settledAt
  statusForm.remark = row.remark
  statusDialogVisible.value = true
}

const handleStatusSubmit = async () => {
  await updateSettlement(currentRow.value.id, {
    status: statusForm.status,
    settledAt: statusForm.settledAt,
    remark: statusForm.remark,
  })
  Message.success('更新成功')
  statusDialogVisible.value = false
  loadData()
}

const handleNotify = async (row) => {
  // 暂时禁用推送功能
  // await pushNotify(row.id)
  // Message.success('推送成功')
  Message.info('功能待开启')
}

const handleExport = async () => {
  try {
    const customerKeyword = (searchForm.customerKeyword || '').trim()
    const agentKeyword = (searchForm.agentKeyword || '').trim()
    const keywordParams = {}
    if (customerKeyword) {
      Object.assign(keywordParams, /^\d{3,}$/.test(customerKeyword)
        ? { customer_phone: customerKeyword }
        : { customer_name: customerKeyword })
    }
    if (userStore.isAdmin && agentKeyword) {
      Object.assign(keywordParams, /^\d{3,}$/.test(agentKeyword)
        ? { agent_phone: agentKeyword }
        : { agent_name: agentKeyword })
    }
    const blob = await exportSettlements({ status: searchForm.status, ...keywordParams })
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `结算列表_${new Date().getTime()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    Message.success('导出成功')
  } catch (err) {
    Message.error('导出失败')
  }
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
const handleLeadSelect = (row) => { form.leadId = row.id; leadDialogVisible.value = false }
const openLeadSelectDialog = () => { leadPagination.page = 1; loadLeads(); leadDialogVisible.value = true }
const handleLeadSelectForStatus = (row) => { statusForm.leadId = row.id; statusForm.leadInfo = `${row.customerName}-${row.customerPhone}-${row.carModel}`; leadDialogVisible.value = false }
const openLeadSelectDialogForStatus = () => { leadPagination.page = 1; loadLeads(); leadDialogVisible.value = true }

const handleRowClick = (row) => {
  Object.assign(detailForm, row)
  detailDialogVisible.value = true
}

const showEditDialog = (row) => {
  const leadInfo = row['lead.customerName'] && row['lead.carModel'] 
    ? `${row['lead.customerName']}-${row['lead.customerPhone'] || ''}-${row['lead.carModel']}` 
    : row.lead 
      ? `${row.lead.customerName}-${row.lead.customerPhone}-${row.lead.carModel}` 
      : ''
  Object.assign(editForm, {
    id: row.id,
    leadId: row.lead?.id || '',
    leadInfo: leadInfo,
    profit: row.profit || 0,
    agentShare: row.agentShare || 0,
    status: row.status,
    settledAt: row.settledAt,
    remark: row.remark
  })
  editDialogVisible.value = true
}

const handleEditSubmit = async () => {
  const valid = await editFormRef.value?.validate()
  if (!valid) return
  await updateSettlement(editForm.id, {
    profit: editForm.profit,
    agentShare: editForm.agentShare,
    remark: editForm.remark
  })
  Message.success('编辑成功')
  editDialogVisible.value = false
  loadData()
}

onMounted(() => { loadData() })
</script>

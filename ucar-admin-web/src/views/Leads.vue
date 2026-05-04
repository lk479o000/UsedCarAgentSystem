<template>
  <div class="animate-fade-in">
    <UCard no-clip>
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
          <USelect v-model="searchForm.status" :options="searchStatusOptions" placeholder="请选择" className="w-24" />
        </div>
        <div class="flex gap-2">
          <UButton type="primary" @click="handleSearch">查询</UButton>
          <UButton type="default" @click="resetSearch">重置</UButton>
        </div>
      </div>

      <!-- 表格 -->
      <ULoading :loading="loading">
        <UTable :data="tableData" :columns="columns" fixed-first-column @row-click="handleRowClick">
          <template #status="{ row }">
            <UTag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</UTag>
          </template>
          <template #customerType="{ row }">
            {{ getCustomerTypeText(row.customerType) }}
          </template>
          <template #agent="{ row }">
            {{ row.agent?.username || '-' }}
          </template>
          <template #action="{ row }">
            <UActionGroup :actions="getLeadActions(row)" />
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
        <UFormItem label="客户类型" prop="customerType">
          <USelect v-model="form.customerType" :options="customerTypeOptions" placeholder="请选择类型" className="w-full" />
        </UFormItem>
        <UFormItem label="车辆品牌">
          <UInput v-model="form.carBrand" />
        </UFormItem>
        <UFormItem label="车辆型号" prop="carModel">
          <UInput v-model="form.carModel" />
        </UFormItem>
        <UFormItem label="所属省份">
          <USelect v-model="form.provinceId" :options="provinceOptions" placeholder="请选择省份" className="w-full" @change="handleProvinceChange" />
        </UFormItem>
        <UFormItem label="所属城市">
          <USelect v-model="form.cityId" :options="cityOptions" placeholder="请选择城市" className="w-full" @change="handleCityChange" />
        </UFormItem>
        <UFormItem label="所属区县">
          <USelect v-model="form.districtId" :options="districtOptions" placeholder="请选择区县" className="w-full" />
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
        <UFormItem label="线索">
          <UInput v-model="settlementForm.leadInfo" readonly />
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

    <!-- 跟进记录对话框 -->
    <UDialog v-model="followupDialogVisible" title="跟进记录" width="700px">
      <div class="mb-4">
        <UButton type="primary" @click="showAddFollowupDialog">新增跟进记录</UButton>
      </div>
      <div class="bg-surface rounded-xl p-4 border border-border">
        <h4 class="font-semibold mb-3">跟进记录列表</h4>
        <div v-if="followupList.length === 0" class="text-center py-6 text-text-secondary">
          暂无跟进记录
        </div>
        <div v-else class="space-y-4">
          <div v-for="item in followupList" :key="item.id" class="p-4 bg-white rounded-lg border border-border">
            <div class="flex justify-between items-start mb-2">
              <span class="font-medium text-text-primary">{{ item.operator?.username }}</span>
              <div class="flex gap-2">
                <UButton type="ghost" size="sm" @click="handleEditFollowup(item)">编辑</UButton>
                <UButton type="ghost" size="sm" class="text-danger" @click="handleDeleteFollowup(item)">删除</UButton>
              </div>
            </div>
            <div class="mb-2">
              <span class="text-sm text-text-secondary">跟进时间：</span>
              <p class="mt-1 text-text-primary">{{ formatDate(item.followupTime || item.createdAt) }}</p>
            </div>
            <div class="mb-2">
              <span class="text-sm text-text-secondary">跟进内容：</span>
              <p class="mt-1 text-text-primary">{{ item.followupContent }}</p>
            </div>
            <div v-if="item.followupResult" class="mb-2">
              <span class="text-sm text-text-secondary">跟进结果：</span>
              <p class="mt-1 text-text-primary">{{ item.followupResult }}</p>
            </div>
            <div v-if="item.nextFollowupTime" class="mb-2">
              <span class="text-sm text-text-secondary">下次跟进时间：</span>
              <p class="mt-1 text-text-primary">{{ formatDate(item.nextFollowupTime) }}</p>
            </div>
          </div>
        </div>
      </div>
    </UDialog>

    <!-- 新增/编辑跟进记录对话框 -->
    <UDialog v-model="addFollowupDialogVisible" :title="isEditFollowup ? '编辑跟进记录' : '新增跟进记录'" width="500px">
      <UForm ref="followupFormRef" :model="followupForm" :rules="followupFormRules">
        <UFormItem label="跟进内容" prop="followupContent">
          <textarea
            v-model="followupForm.followupContent"
            rows="4"
            class="w-full border border-border rounded-md px-3 py-2 transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] outline-none text-text-primary resize-none"
          />
        </UFormItem>
        <UFormItem label="跟进结果">
          <textarea
            v-model="followupForm.followupResult"
            rows="2"
            class="w-full border border-border rounded-md px-3 py-2 transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] outline-none text-text-primary resize-none"
          />
        </UFormItem>
        <UFormItem label="这次跟进时间" prop="followupTime">
          <input
            type="datetime-local"
            v-model="followupForm.followupTime"
            class="w-full border border-border rounded-md px-3 py-2 transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] outline-none text-text-primary"
          />
        </UFormItem>
        <UFormItem label="下次跟进时间（可选）">
          <input
            type="datetime-local"
            v-model="followupForm.nextFollowupTime"
            class="w-full border border-border rounded-md px-3 py-2 transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)] outline-none text-text-primary"
          />
        </UFormItem>
      </UForm>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton type="default" @click="addFollowupDialogVisible = false">取消</UButton>
          <UButton type="primary" @click="handleFollowupSubmit">确定</UButton>
        </div>
      </template>
    </UDialog>

    <!-- 确认删除跟进记录 -->
    <UConfirm
      v-model="deleteFollowupConfirmVisible"
      title="确认删除"
      message="确认删除该跟进记录?"
      type="danger"
      @confirm="confirmDeleteFollowup"
    />

    <!-- 详情对话框 -->
    <UDialog v-model="detailDialogVisible" title="线索详情" width="500px">
      <div class="space-y-4">
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">客户姓名</span>
          <span class="text-sm text-text-primary">{{ detailForm.customerName }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">客户电话</span>
          <span class="text-sm text-text-primary">{{ detailForm.customerPhone }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">客户类型</span>
          <span class="text-sm text-text-primary">{{ getCustomerTypeText(detailForm.customerType) }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">车辆品牌</span>
          <span class="text-sm text-text-primary">{{ detailForm.carBrand }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">车辆型号</span>
          <span class="text-sm text-text-primary">{{ detailForm.carModel }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">所属区域</span>
          <span class="text-sm text-text-primary">{{ detailForm.regionText || '-' }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">状态</span>
          <UTag :type="getStatusType(detailForm.status)">{{ getStatusText(detailForm.status) }}</UTag>
        </div>
        <div v-if="userStore.isAdmin" class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">归属经纪人</span>
          <span class="text-sm text-text-primary">{{ detailForm.agent?.username || '-' }}</span>
        </div>
        <div class="flex items-start gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">备注</span>
          <span class="text-sm text-text-primary">{{ detailForm.notes || '无' }}</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-text-secondary w-20">创建时间</span>
          <span class="text-sm text-text-primary">{{ formatDate(detailForm.createdAt) }}</span>
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
    <UDialog v-model="editDialogVisible" title="编辑线索" width="500px">
      <UForm ref="editFormRef" :model="editForm" :rules="editFormRules">
        <UFormItem label="客户姓名" prop="customerName">
          <UInput v-model="editForm.customerName" placeholder="请输入客户姓名" />
        </UFormItem>
        <UFormItem label="客户电话" prop="customerPhone">
          <UInput v-model="editForm.customerPhone" placeholder="请输入客户电话" />
        </UFormItem>
        <UFormItem label="客户类型" prop="customerType">
          <USelect v-model="editForm.customerType" :options="customerTypeOptions" placeholder="请选择类型" className="w-full" />
        </UFormItem>
        <UFormItem label="车辆品牌">
          <UInput v-model="editForm.carBrand" placeholder="请输入车辆品牌" />
        </UFormItem>
        <UFormItem label="车辆型号" prop="carModel">
          <UInput v-model="editForm.carModel" placeholder="请输入车辆型号" />
        </UFormItem>
        <UFormItem label="所属省份">
          <USelect v-model="editForm.provinceId" :options="editProvinceOptions" placeholder="请选择省份" className="w-full" @change="handleEditProvinceChange" />
        </UFormItem>
        <UFormItem label="所属城市">
          <USelect v-model="editForm.cityId" :options="editCityOptions" placeholder="请选择城市" className="w-full" @change="handleEditCityChange" />
        </UFormItem>
        <UFormItem label="所属区县">
          <USelect v-model="editForm.districtId" :options="editDistrictOptions" placeholder="请选择区县" className="w-full" />
        </UFormItem>
        <UFormItem label="归属经纪人" prop="userId">
          <USelect v-model="editForm.userId" :options="agentOptions" placeholder="请选择经纪人" className="w-full" />
        </UFormItem>
        <UFormItem label="备注">
          <textarea
            v-model="editForm.notes"
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
import { getLeadList, createLead, updateLead, deleteLead, exportLeads, createFollowup, getFollowupList, updateFollowup, deleteFollowup } from '@/api/lead'
import { createSettlement, updateSettlement, getSettlementByLeadId } from '@/api/settlement'
import { getUserList, getAgentLeads } from '@/api/user'
import { getProvinces, getCities, getDistricts } from '@/api/region'
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
import UActionGroup from '@/components/UActionGroup.vue'

const userStore = useUserStore()
const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const settlementDialogVisible = ref(false)
const leadDialogVisible = ref(false)
const deleteConfirmVisible = ref(false)
const followupDialogVisible = ref(false)
const addFollowupDialogVisible = ref(false)
const deleteFollowupConfirmVisible = ref(false)
const detailDialogVisible = ref(false)
const editDialogVisible = ref(false)
const currentRow = ref(null)
const currentFollowup = ref(null)
const formRef = ref()
const statusFormRef = ref()
const settlementFormRef = ref()
const followupFormRef = ref()
const editFormRef = ref()
const agents = ref([])
const leadTableData = ref([])
const followupList = ref([])
const leadLoading = ref(false)
const followupLoading = ref(false)
const isEditFollowup = ref(false)

const searchForm = reactive({ customerKeyword: '', agentKeyword: '', regionKeyword: '', status: '' })
const leadSearchForm = reactive({ customerName: '', status: '' })
const leadPagination = reactive({ page: 1, size: 20, total: 0 })
const pagination = reactive({ page: 1, size: 20, total: 0 })

const form = reactive({
  customerName: '', customerPhone: '', customerType: 0, carBrand: '', carModel: '', provinceId: '', cityId: '', districtId: '', userId: '', notes: '',
})

const provinceList = ref([])
const cityList = ref([])
const districtList = ref([])
const editProvinceList = ref([])
const editCityList = ref([])
const editDistrictList = ref([])

const provinceOptions = computed(() => provinceList.value.map((p) => ({ label: p.regionName, value: p.id })))
const cityOptions = computed(() => cityList.value.map((c) => ({ label: c.regionName, value: c.id })))
const districtOptions = computed(() => districtList.value.map((d) => ({ label: d.regionName, value: d.id })))
const editProvinceOptions = computed(() => editProvinceList.value.map((p) => ({ label: p.regionName, value: p.id })))
const editCityOptions = computed(() => editCityList.value.map((c) => ({ label: c.regionName, value: c.id })))
const editDistrictOptions = computed(() => editDistrictList.value.map((d) => ({ label: d.regionName, value: d.id })))

const statusForm = reactive({ status: '', carActualPrice: 0, failReason: '' })

const settlementForm = reactive({ settlementId: '', leadId: '', leadInfo: '', profit: 0, agentShare: 0, remark: '' })

const followupForm = reactive({ followupContent: '', followupResult: '', followupTime: '', nextFollowupTime: '' })

const followupFormRules = {
  followupContent: [{ required: true, message: '请输入跟进内容' }],
  followupTime: [{ required: true, message: '请选择这次跟进时间' }],
}

const detailForm = reactive({ customerName: '', customerPhone: '', customerType: 0, carBrand: '', carModel: '', provinceId: '', cityId: '', districtId: '', regionText: '', status: 0, agent: null, notes: '', createdAt: '' })

const editForm = reactive({ id: '', customerName: '', customerPhone: '', customerType: 0, carBrand: '', carModel: '', provinceId: '', cityId: '', districtId: '', userId: '', notes: '' })

const formRules = {
  customerName: [{ required: true, message: '请输入客户姓名' }],
  customerPhone: [{ required: true, message: '请输入客户电话' }],
  customerType: [{ required: true, message: '请选择客户类型' }],
  // customerPhone: [
  //   { required: true, message: '请输入客户电话' },
  //   { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号' },
  // ],
  carModel: [{ required: true, message: '请输入车辆型号' }],
  userId: [{ required: true, message: '请选择归属经纪人' }],
}

const settlementFormRules = {
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

const editFormRules = {
  customerName: [{ required: true, message: '请输入客户姓名' }],
  customerPhone: [{ required: true, message: '请输入客户电话' }],
  customerType: [{ required: true, message: '请选择客户类型' }],
  carModel: [{ required: true, message: '请输入车辆型号' }],
  userId: [{ required: true, message: '请选择归属经纪人' }],
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
const searchStatusOptions = [{ label: '全部', value: '' }, ...statusOptions]

const customerTypeOptions = [
  { label: '买家', value: 0 },
  { label: '卖家', value: 1 },
]

const getStatusText = (status) => statusMap[status]?.text || status
const getStatusType = (status) => statusMap[status]?.type || 'info'
const getCustomerTypeText = (type) => type === 0 ? '买家' : type === 1 ? '卖家' : '-'

const availableStatusOptions = computed(() => {
  if (!currentRow.value) return []
  const current = currentRow.value.status
  const flow = { 0: [1], 1: [2, 5], 2: [3, 5], 3: [4, 5] }
  const nextStatuses = flow[current] || []
  return nextStatuses.map((s) => ({ value: s, label: statusMap[s].text }))
})

const agentOptions = computed(() => agents.value.map((a) => ({ label: a.username, value: a.userid })))

const getLeadActions = (row) => {
  if (!userStore.isAdmin) return []
  const actions = [
    { key: 'edit', label: '编辑', type: 'primary', handler: () => showEditDialog(row) },
    { key: 'status', label: '更新状态', type: 'default', handler: () => handleUpdateStatus(row), visible: row.status !== 4 },
    { key: 'followup', label: '跟进记录', type: 'default', handler: () => handleFollowup(row) },
    { key: 'settlement', label: '结算', type: 'success', handler: () => handleSettlement(row), visible: row.status !== 4 },
    { key: 'reSettlement', label: '重新结算', type: 'primary', handler: () => handleReSettlement(row), visible: row.status === 4 },
    { key: 'delete', label: '删除', type: 'danger', handler: () => handleDelete(row) },
  ]
  return actions.filter(a => a.visible !== false)
}

const columns = computed(() => {
  const baseColumns = [
    { key: 'customerName', title: '客户姓名', width: '120px' },
    { key: 'customerPhone', title: '客户电话', width: '130px' },
    { key: 'customerType', title: '客户类型', width: '100px' },
    { key: 'carBrand', title: '车辆品牌', width: '120px' },
    { key: 'carModel', title: '车辆型号', width: '150px' },
    { key: 'regionText', title: '所属区域', width: '120px' },
    { key: 'status', title: '状态', width: '100px', align: 'center' },
    { key: 'createdAt', title: '创建时间', width: '180px' },
  ]
  
  if (userStore.isAdmin) {
    baseColumns.splice(6, 0, { key: 'agent', title: '归属经纪人', width: '120px' })
    baseColumns.push({ key: 'action', title: '操作', width: '180px', fixed: 'right' })
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
      res = await getLeadList({ status: searchForm.status, ...keywordParams, page: pagination.page, size: pagination.size })
    } else {
      res = await getAgentLeads({ status: searchForm.status, ...keywordParams, page: pagination.page, size: pagination.size })
    }
    tableData.value = await enrichRegionText(res.data.list)
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

const showAddDialog = async () => {
  Object.assign(form, { customerName: '', customerPhone: '', carBrand: '', carModel: '', provinceId: '', cityId: '', districtId: '', userId: '', notes: '' })
  cityList.value = []
  districtList.value = []
  await loadProvinces()
  const defaultProvinceId = 22
  const defaultCityId = 1930
  form.provinceId = defaultProvinceId
  await loadCities(defaultProvinceId, false)
  form.cityId = defaultCityId
  await loadDistricts(defaultCityId, false)
  dialogVisible.value = true
}

const loadProvinces = async () => {
  try {
    const res = await getProvinces()
    provinceList.value = res.data || []
    editProvinceList.value = res.data || []
  } catch (err) {
    console.error('加载省份失败:', err)
  }
}

const loadCities = async (provinceId, isEdit = false) => {
  if (!provinceId) {
    if (isEdit) { editCityList.value = []; editDistrictList.value = [] }
    else { cityList.value = []; districtList.value = [] }
    return
  }
  try {
    const res = await getCities(provinceId)
    if (isEdit) { editCityList.value = res.data || []; editDistrictList.value = [] }
    else { cityList.value = res.data || []; districtList.value = [] }
  } catch (err) {
    console.error('加载城市失败:', err)
  }
}

const loadDistricts = async (cityId, isEdit = false) => {
  if (!cityId) {
    if (isEdit) editDistrictList.value = []
    else districtList.value = []
    return
  }
  try {
    const res = await getDistricts(cityId)
    if (isEdit) editDistrictList.value = res.data || []
    else districtList.value = res.data || []
  } catch (err) {
    console.error('加载区县失败:', err)
  }
}

const handleProvinceChange = async () => {
  form.cityId = ''
  form.districtId = ''
  await loadCities(form.provinceId, false)
}

const handleCityChange = async () => {
  form.districtId = ''
  await loadDistricts(form.cityId, false)
}

const handleEditProvinceChange = async () => {
  editForm.cityId = ''
  editForm.districtId = ''
  await loadCities(editForm.provinceId, true)
}

const handleEditCityChange = async () => {
  editForm.districtId = ''
  await loadDistricts(editForm.cityId, true)
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
  // 验证状态流转是否合法
  const currentStatus = currentRow.value.status
  const newStatus = statusForm.status
  const flow = { 0: [1], 1: [2, 5], 2: [3, 5], 3: [4, 5] }
  const allowedStatuses = flow[currentStatus] || []
  
  if (!allowedStatuses.includes(newStatus)) {
    Message.error('状态流转非法')
    return
  }
  
  try {
    await updateLead(currentRow.value.id, {
      status: newStatus,
      carActualPrice: statusForm.carActualPrice,
      failReason: statusForm.failReason,
    })
    Message.success('状态更新成功')
    statusDialogVisible.value = false
    loadData()
  } catch (error) {
    // 错误已经在request拦截器中处理
  }
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
  const leadInfo = `${row.customerName}-${row.customerPhone}-${row.carModel}`
  Object.assign(settlementForm, { leadId: row.id, leadInfo, profit: 0, agentShare: 0, remark: '' })
  settlementDialogVisible.value = true
}

const handleReSettlement = async (row) => {
  currentRow.value = row
  const leadInfo = `${row.customerName}-${row.customerPhone}-${row.carModel}`
  
  try {
    // 获取已有的结算记录
    const res = await getSettlementByLeadId(row.id)
    if (res.data) {
      const settlement = res.data
      console.log('获取到的结算记录:', settlement)
      Object.assign(settlementForm, {
        settlementId: settlement.id,
        leadId: row.id,
        leadInfo,
        profit: settlement.profit || 0,
        agentShare: settlement.agentShare || 0,
        remark: settlement.remark || ''
      })
      console.log('填充后的settlementForm:', settlementForm)
    }
  } catch (error) {
    console.error('获取结算记录失败:', error)
  }
  
  settlementDialogVisible.value = true
}

const handleSettlementSubmit = async () => {
  const valid = await settlementFormRef.value?.validate()
  if (!valid) return
  
  if (settlementForm.settlementId) {
    // 更新已有的结算记录
    await updateSettlement(settlementForm.settlementId, settlementForm)
    Message.success('重新结算成功')
  } else {
    // 创建新的结算记录
    await createSettlement(settlementForm)
    Message.success('结算成功')
  }
  
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

const handleRowClick = async (row) => {
  Object.assign(detailForm, row)
  detailForm.regionText = await buildRegionText(row.provinceId, row.cityId, row.districtId)
  detailDialogVisible.value = true
}

const buildRegionText = async (provinceId, cityId, districtId) => {
  const parts = []
  try {
    if (provinceId) {
      const allProvinces = provinceList.value.length > 0 ? provinceList.value : (await getProvinces()).data || []
      const province = allProvinces.find((p) => p.id === provinceId)
      if (province) parts.push(province.regionName)
    }
    if (cityId) {
      const res = await getCities(provinceId)
      const city = (res.data || []).find((c) => c.id === cityId)
      if (city) parts.push(city.regionName)
    }
    if (districtId) {
      const res = await getDistricts(cityId)
      const district = (res.data || []).find((d) => d.id === districtId)
      if (district) parts.push(district.regionName)
    }
  } catch (err) {
    console.error('构建区域文本失败:', err)
  }
  return parts.join(' / ') || '-'
}

const enrichRegionText = async (list) => {
  if (!list || list.length === 0) return list
  let allProvinces = provinceList.value
  if (allProvinces.length === 0) {
    try {
      const res = await getProvinces()
      allProvinces = res.data || []
      provinceList.value = allProvinces
    } catch (err) {
      return list.map((item) => ({ ...item, regionText: '-' }))
    }
  }
  const cityCache = {}
  const districtCache = {}
  return list.map((item) => {
    const parts = []
    if (item.provinceId) {
      const province = allProvinces.find((p) => p.id === item.provinceId)
      if (province) parts.push(province.regionName)
    }
    if (item.cityId && cityCache[item.provinceId]) {
      const city = cityCache[item.provinceId].find((c) => c.id === item.cityId)
      if (city) parts.push(city.regionName)
    }
    if (item.districtId && districtCache[item.cityId]) {
      const district = districtCache[item.cityId].find((d) => d.id === item.districtId)
      if (district) parts.push(district.regionName)
    }
    return { ...item, regionText: parts.length > 0 ? parts.join(' / ') : '-' }
  })
}

const showEditDialog = async (row) => {
  Object.assign(editForm, row)
  editCityList.value = []
  editDistrictList.value = []
  await loadProvinces()
  if (editForm.provinceId) {
    await loadCities(editForm.provinceId, true)
  }
  if (editForm.cityId) {
    await loadDistricts(editForm.cityId, true)
  }
  editDialogVisible.value = true
}

const handleEditSubmit = async () => {
  const valid = await editFormRef.value?.validate()
  if (!valid) return
  try {
    // 只传递需要更新的字段，避免传递不必要的字段和重复的id
    const updateData = {
      customerName: editForm.customerName,
      customerPhone: editForm.customerPhone,
      customerType: editForm.customerType,
      carBrand: editForm.carBrand,
      carModel: editForm.carModel,
      provinceId: editForm.provinceId || null,
      cityId: editForm.cityId || null,
      districtId: editForm.districtId || null,
      userId: editForm.userId,
      notes: editForm.notes
    }
    await updateLead(editForm.id, updateData)
    Message.success('编辑成功')
    editDialogVisible.value = false
    loadData()
  } catch (error) {
    // 错误已经在request拦截器中处理，这里不需要重复处理
  }
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
    const blob = await exportLeads({ status: searchForm.status, ...keywordParams })
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

// 跟进记录相关方法
const handleFollowup = async (row) => {
  currentRow.value = row
  followupDialogVisible.value = true
  await loadFollowupList(row.id)
}

const loadFollowupList = async (leadId) => {
  followupLoading.value = true
  try {
    const res = await getFollowupList(leadId)
    followupList.value = res.data.list
  } catch (err) {
    Message.error('加载跟进记录失败')
  } finally {
    followupLoading.value = false
  }
}

const showAddFollowupDialog = () => {
  isEditFollowup.value = false
  currentFollowup.value = null
  const now = new Date().toISOString().slice(0, 16)
  Object.assign(followupForm, { followupContent: '', followupResult: '', followupTime: now, nextFollowupTime: '' })
  addFollowupDialogVisible.value = true
}

const handleEditFollowup = (followup) => {
  isEditFollowup.value = true
  currentFollowup.value = followup
  Object.assign(followupForm, {
    followupContent: followup.followupContent,
    followupResult: followup.followupResult,
    followupTime: followup.followupTime ? new Date(followup.followupTime).toISOString().slice(0, 16) : '',
    nextFollowupTime: followup.nextFollowupTime ? new Date(followup.nextFollowupTime).toISOString().slice(0, 16) : ''
  })
  addFollowupDialogVisible.value = true
}

const handleFollowupSubmit = async () => {
  const valid = await followupFormRef.value.validate()
  if (!valid) return
  
  try {
    if (isEditFollowup.value) {
      await updateFollowup(currentFollowup.value.id, followupForm)
      Message.success('更新成功')
    } else {
      await createFollowup(currentRow.value.id, followupForm)
      Message.success('新增成功')
    }
    addFollowupDialogVisible.value = false
    await loadFollowupList(currentRow.value.id)
  } catch (err) {
    // 错误已经在request拦截器中处理
  }
}

const handleDeleteFollowup = (followup) => {
  currentFollowup.value = followup
  deleteFollowupConfirmVisible.value = true
}

const confirmDeleteFollowup = async () => {
  try {
    await deleteFollowup(currentFollowup.value.id)
    Message.success('删除成功')
    await loadFollowupList(currentRow.value.id)
  } catch (err) {
    // 错误已经在request拦截器中处理
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '' // 检查日期是否有效
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => { loadData(); loadAgents() })
</script>

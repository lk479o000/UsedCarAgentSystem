<template>
  <div class="region-management">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <span class="font-semibold text-text-primary text-xl tracking-tight">区域管理</span>
          <div class="flex gap-3">
            <UButton type="warning" @click="handleRebuildClosure" :loading="rebuildLoading">
              重构闭包表
            </UButton>
            <UButton type="primary" @click="showAddDialog">新增区域</UButton>
          </div>
        </div>
      </template>

      <div class="flex flex-wrap items-end gap-4 mb-5 p-5 bg-surface rounded-xl shadow-sm border border-border">
        <div class="flex items-end gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap mb-2">区域名称</label>
          <UInput v-model="searchQuery" placeholder="请输入区域名称" class="w-40" @keyup.enter="handleSearch" />
        </div>
        <div class="flex items-end gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap mb-2">区域级别</label>
          <USelect v-model="levelFilter" :options="regionLevelOptions" placeholder="区域级别" className="w-28" />
        </div>
        <div class="flex items-end gap-2">
          <label class="text-sm font-medium text-text-primary whitespace-nowrap mb-2">状态</label>
          <USelect v-model="statusFilter" :options="statusOptions" placeholder="状态筛选" className="w-28" />
        </div>
        <div class="flex gap-2">
          <UButton type="primary" @click="handleSearch" :loading="loading">查询</UButton>
          <UButton type="default" @click="handleReset">重置</UButton>
        </div>
      </div>

      <ULoading :loading="loading">
        <UTreeTable
          v-if="!hasSearchCondition"
          :key="tableKey"
          :data="tableData"
          :columns="columns"
          :lazy="true"
          :load="loadChildrenNodes"
        >
          <template #regionLevel="{ row }">
            <UTag :type="getRegionLevelType(row.regionLevel)">{{ getRegionLevelText(row.regionLevel) }}</UTag>
          </template>
          <template #status="{ row }">
            <button
              @click.stop="handleStatusChange(row)"
              :class="[
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none',
                row.status === 1 ? 'bg-primary' : 'bg-gray-300'
              ]"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                  row.status === 1 ? 'translate-x-4' : 'translate-x-0.5'
                ]"
              />
            </button>
          </template>
          <template #createdAt="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
          <template #action="{ row }">
            <div class="flex gap-2">
              <UButton type="primary" size="sm" @click.stop="handleView(row)">详情</UButton>
              <UButton type="default" size="sm" @click.stop="handleEdit(row)">编辑</UButton>
              <UButton type="danger" size="sm" @click.stop="handleDelete(row)">删除</UButton>
            </div>
          </template>
        </UTreeTable>
        <UTable
          v-else
          :key="'search-' + tableKey"
          :data="searchResults"
          :columns="columns"
        >
          <template #regionLevel="{ row }">
            <UTag :type="getRegionLevelType(row.regionLevel)">{{ getRegionLevelText(row.regionLevel) }}</UTag>
          </template>
          <template #status="{ row }">
            <button
              @click.stop="handleStatusChange(row)"
              :class="[
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none',
                row.status === 1 ? 'bg-primary' : 'bg-gray-300'
              ]"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
                  row.status === 1 ? 'translate-x-4' : 'translate-x-0.5'
                ]"
              />
            </button>
          </template>
          <template #createdAt="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
          <template #action="{ row }">
            <div class="flex gap-2">
              <UButton type="primary" size="sm" @click.stop="handleView(row)">详情</UButton>
              <UButton type="default" size="sm" @click.stop="handleEdit(row)">编辑</UButton>
              <UButton type="danger" size="sm" @click.stop="handleDelete(row)">删除</UButton>
            </div>
          </template>
        </UTable>
      </ULoading>
    </UCard>

    <UDialog v-model="dialogVisible" :title="getDialogTitle()" width="500px">
      <UForm ref="formRef" :model="form" :rules="formRules" :disabled="dialogType === 'view'">
        <UFormItem label="区域名称" prop="regionName">
          <UInput v-model="form.regionName" placeholder="请输入区域名称" />
        </UFormItem>
        <UFormItem label="区域编码" prop="regionCode">
          <UInput v-model="form.regionCode" placeholder="请输入区域编码（6位数字）" />
        </UFormItem>
        <UFormItem label="区域级别" prop="regionLevel">
          <USelect v-model="form.regionLevel" :options="regionLevelSelectOptions" placeholder="请选择区域级别" className="w-full" @change="handleLevelChange" />
        </UFormItem>
        <UFormItem v-if="form.regionLevel > 1" label="父级区域" prop="parentId">
          <USelect
            v-model="form.parentId"
            :options="parentRegionOptions"
            placeholder="请选择父级区域"
            className="w-full"
            @change="handleParentChange"
          />
        </UFormItem>
        <UFormItem label="完整名称" prop="fullName">
          <UInput v-model="form.fullName" placeholder="例如：广东省-广州市-天河区" />
        </UFormItem>
        <UFormItem label="排序" prop="sortOrder">
          <div class="flex items-center gap-2">
            <UInputNumber v-model="form.sortOrder" :min="0" className="flex-1" :disabled="dialogType === 'add'" />
            <UButton v-if="dialogType === 'add'" type="primary" size="sm" @click="generateSortOrder">自动生成</UButton>
          </div>
        </UFormItem>
        <UFormItem label="状态" prop="status">
          <div class="flex gap-4">
            <label class="flex items-center gap-2">
              <input type="radio" v-model="form.status" :value="1" />
              <span>启用</span>
            </label>
            <label class="flex items-center gap-2">
              <input type="radio" v-model="form.status" :value="0" />
              <span>禁用</span>
            </label>
          </div>
        </UFormItem>
      </UForm>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton type="default" @click="handleClose" :disabled="loading || rebuildLoading">关闭</UButton>
          <UButton
            type="primary"
            @click="handleSubmit"
            :loading="loading || rebuildLoading"
            :disabled="loading || rebuildLoading"
            v-if="dialogType !== 'view'"
          >
            确定
          </UButton>
        </div>
      </template>
    </UDialog>

    <UConfirm
      v-model="deleteConfirmVisible"
      title="确认删除"
      :message="`确定要删除「${currentRow?.regionName}」吗？`"
      type="danger"
      @confirm="confirmDelete"
    />

    <UConfirm
      v-model="rebuildConfirmVisible"
      title="重构闭包表"
      message="将清空并重新计算所有区域的闭包关系，过程可能耗时。是否继续？"
      type="warning"
      @confirm="confirmRebuildClosure"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { Message } from '@/composables/useMessage'
import {
  getAllProvincesForManagement,
  getAllCitiesByProvinceId,
  getAllDistrictsByCityId,
  searchAllRegions,
  getRegionById,
  getNextSortOrder,
  createRegion,
  updateRegion,
  deleteRegion,
  batchUpdateRegionStatus,
  rebuildRegionClosure,
} from '@/api/region'
import UCard from '@/components/UCard.vue'
import UButton from '@/components/UButton.vue'
import UInput from '@/components/UInput.vue'
import USelect from '@/components/USelect.vue'
import UTable from '@/components/UTable.vue'
import UTreeTable from '@/components/UTreeTable.vue'
import UTag from '@/components/UTag.vue'
import UDialog from '@/components/UDialog.vue'
import UForm from '@/components/UForm.vue'
import UFormItem from '@/components/UFormItem.vue'
import UInputNumber from '@/components/UInputNumber.vue'
import ULoading from '@/components/ULoading.vue'
import UConfirm from '@/components/UConfirm.vue'

const searchQuery = ref('')
const levelFilter = ref('')
const statusFilter = ref('')
const loading = ref(false)
const rebuildLoading = ref(false)
const tableData = ref([])
const searchResults = ref([])
const tableKey = ref(0)
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref()
const deleteConfirmVisible = ref(false)
const rebuildConfirmVisible = ref(false)
const currentRow = ref(null)
const allProvinces = ref([])

const form = reactive({
  id: undefined,
  regionName: '',
  regionCode: '',
  regionLevel: 1,
  parentId: 0,
  fullName: '',
  sortOrder: 0,
  status: 1,
})

const formRules = {
  regionName: [{ required: true, message: '请输入区域名称' }],
  regionCode: [
    { required: true, message: '请输入区域编码' },
    { pattern: /^\d{6}$/, message: '区域编码应为6位数字' },
  ],
  regionLevel: [{ required: true, message: '请选择区域级别' }],
}

const regionLevelMap = {
  1: { text: '省/直辖市', type: 'primary' },
  2: { text: '市', type: 'success' },
  3: { text: '区县', type: 'warning' },
}

const regionLevelOptions = [
  { label: '全部级别', value: '' },
  { label: '省/直辖市', value: '1' },
  { label: '市', value: '2' },
  { label: '区县', value: '3' },
]

const regionLevelSelectOptions = [
  { label: '省/直辖市', value: 1 },
  { label: '市', value: 2 },
  { label: '区县', value: 3 },
]

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '启用', value: '1' },
  { label: '禁用', value: '0' },
]

const getRegionLevelText = (level) => regionLevelMap[level]?.text || level
const getRegionLevelType = (level) => regionLevelMap[level]?.type || 'info'

const hasSearchCondition = computed(() => {
  return searchQuery.value.trim() !== '' || levelFilter.value !== ''
})

const columns = [
  { key: 'regionName', title: '区域名称', minWidth: '200px' },
  { key: 'regionCode', title: '区域编码', width: '120px' },
  { key: 'regionLevel', title: '区域级别', width: '120px' },
  { key: 'sortOrder', title: '排序', width: '80px' },
  { key: 'status', title: '状态', width: '80px' },
  { key: 'createdAt', title: '创建时间', width: '180px' },
  { key: 'action', title: '操作', width: '200px' },
]

const parentRegionOptions = computed(() => {
  const options = []
  if (form.regionLevel === 2) {
    allProvinces.value.forEach((p) => {
      if (p.status === 1) {
        options.push({ label: p.regionName, value: p.id })
      }
    })
  } else if (form.regionLevel === 3) {
    allProvinces.value.forEach((p) => {
      if (p.children) {
        p.children.forEach((c) => {
          if (c.status === 1) {
            options.push({ label: `${p.regionName} - ${c.regionName}`, value: c.id })
          }
        })
      }
    })
  }
  return options
})

const loadProvinces = async () => {
  loading.value = true
  try {
    const res = await getAllProvincesForManagement()
    tableData.value = res.data.map((item) => ({
      ...item,
      hasChildren: true,
    }))
    if (statusFilter.value !== '') {
      tableData.value = tableData.value.filter((item) => String(item.status) === statusFilter.value)
    }
  } catch (error) {
    Message.error('获取省份数据失败')
  } finally {
    loading.value = false
  }
}

const loadChildrenNodes = async (row) => {
  try {
    let children = []
    if (row.regionLevel === 1) {
      const res = await getAllCitiesByProvinceId(row.id)
      children = res.data.map((item) => ({
        ...item,
        hasChildren: true,
      }))
    } else if (row.regionLevel === 2) {
      const res = await getAllDistrictsByCityId(row.id)
      children = res.data.map((item) => ({
        ...item,
        hasChildren: false,
      }))
    }
    if (levelFilter.value !== '') {
      children = children.filter((item) => String(item.regionLevel) === levelFilter.value)
    }
    if (statusFilter.value !== '') {
      children = children.filter((item) => String(item.status) === statusFilter.value)
    }
    return children
  } catch (error) {
    return []
  }
}

const handleSearch = async () => {
  if (!searchQuery.value.trim() && levelFilter.value === '') {
    searchResults.value = []
    tableKey.value++
    await nextTick()
    await loadProvinces()
    return
  }

  loading.value = true
  try {
    const res = await searchAllRegions(
      searchQuery.value.trim() || undefined,
      levelFilter.value ? parseInt(levelFilter.value) : undefined
    )
    let results = res.data || []

    if (statusFilter.value !== '') {
      results = results.filter((item) => String(item.status) === statusFilter.value)
    }

    searchResults.value = results

    const filters = []
    if (searchQuery.value.trim()) {
      filters.push(`区域名称: ${searchQuery.value.trim()}`)
    }
    if (levelFilter.value !== '') {
      const levelNames = { '1': '省/直辖市', '2': '市', '3': '区县' }
      filters.push(`区域级别: ${levelNames[levelFilter.value] || levelFilter.value}`)
    }
    if (statusFilter.value !== '') {
      filters.push(`状态: ${statusFilter.value === '1' ? '启用' : '禁用'}`)
    }

    const msg = filters.length > 0 ? `已筛选: ${filters.join(', ')}` : '搜索完成'
    if (searchResults.value.length > 0) {
      Message.success(`${msg}，共找到 ${searchResults.value.length} 条记录`)
    } else {
      Message.info('未找到匹配的数据，请尝试其他筛选条件')
    }
  } catch (error) {
    Message.error('搜索失败')
  } finally {
    loading.value = false
  }
}

const handleReset = async () => {
  searchQuery.value = ''
  levelFilter.value = ''
  statusFilter.value = ''
  searchResults.value = []
  tableKey.value++
  await nextTick()
  await loadProvinces()
}

const handleRebuildClosure = () => {
  rebuildConfirmVisible.value = true
}

const confirmRebuildClosure = async () => {
  rebuildLoading.value = true
  try {
    await rebuildRegionClosure()
    Message.success('闭包表重构成功')
  } catch (error) {
    Message.error('闭包表重构失败')
  } finally {
    rebuildLoading.value = false
  }
}

const handleLevelChange = async () => {
  form.parentId = 0
  await loadParentOptions()
  await generateSortOrder()
}

const handleParentChange = async () => {
  await generateSortOrder()
}

const loadParentOptions = async () => {
  if (form.regionLevel === 1) {
    allProvinces.value = []
    return
  }
  try {
    const res = await getAllProvincesForManagement()
    const provinces = res.data || []
    if (form.regionLevel === 3) {
      const provincesWithCities = await Promise.all(
        provinces.map(async (province) => {
          const cityRes = await getAllCitiesByProvinceId(province.id)
          const cities = cityRes.data || []
          return { ...province, children: cities.filter((c) => c.regionLevel === 2) }
        })
      )
      allProvinces.value = provincesWithCities
    } else {
      allProvinces.value = provinces
    }
  } catch (error) {
    console.error('加载父级区域失败:', error)
  }
}

const generateSortOrder = async () => {
  try {
    const parentId = form.regionLevel === 1 ? 0 : form.parentId
    const res = await getNextSortOrder(parentId)
    if (res.data !== undefined) {
      form.sortOrder = res.data
    }
  } catch (error) {
    console.error('生成sort_order失败:', error)
  }
}

const showAddDialog = async () => {
  dialogType.value = 'add'
  resetForm()
  await loadParentOptions()
  await generateSortOrder()
  dialogVisible.value = true
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    id: undefined,
    regionName: '',
    regionCode: '',
    regionLevel: 1,
    parentId: 0,
    fullName: '',
    sortOrder: 0,
    status: 1,
  })
  allProvinces.value = []
}

const handleView = async (row) => {
  try {
    dialogType.value = 'view'
    const res = await getRegionById(row.id)
    Object.assign(form, res.data)
    await loadParentOptions()
    dialogVisible.value = true
  } catch (error) {
    Message.error('获取详情失败')
  }
}

const handleEdit = async (row) => {
  try {
    dialogType.value = 'edit'
    const res = await getRegionById(row.id)
    Object.assign(form, res.data)
    await loadParentOptions()
    dialogVisible.value = true
  } catch (error) {
    Message.error('获取详情失败')
  }
}

const handleDelete = (row) => {
  currentRow.value = row
  deleteConfirmVisible.value = true
}

const confirmDelete = async () => {
  loading.value = true
  try {
    await deleteRegion(currentRow.value.id)
    Message.success('删除成功')
    await handleSearch()
  } catch (error) {
    Message.error('删除失败')
  } finally {
    loading.value = false
  }
}

const handleStatusChange = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await batchUpdateRegionStatus([row.id], newStatus)
    row.status = newStatus
    Message.success('状态更新成功')
  } catch (error) {
    Message.error('状态更新失败')
    row.status = row.status === 1 ? 0 : 1
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  if (loading.value || rebuildLoading.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    const submitData = {
      regionName: form.regionName,
      regionCode: form.regionCode,
      regionLevel: form.regionLevel,
      parentId: form.regionLevel === 1 ? 0 : form.parentId,
      fullName: form.fullName,
      sortOrder: form.sortOrder,
      status: form.status,
    }

    if (dialogType.value === 'add') {
      rebuildLoading.value = true
    } else {
      loading.value = true
    }

    try {
      if (dialogType.value === 'add') {
        await createRegion(submitData)
        Message.success('新增成功')
      } else {
        await updateRegion(form.id, submitData)
        Message.success('编辑成功')
      }
      dialogVisible.value = false
      await handleSearch()
    } finally {
      if (dialogType.value === 'add') {
        rebuildLoading.value = false
      } else {
        loading.value = false
      }
    }
  } catch (error) {
    Message.error(dialogType.value === 'add' ? '新增失败' : '编辑失败')
    loading.value = false
    rebuildLoading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getDialogTitle = () => {
  if (dialogType.value === 'add') return '新增区域'
  if (dialogType.value === 'view') return '查看区域'
  return '编辑区域'
}

onMounted(() => {
  loadProvinces()
})
</script>

<style scoped>
.region-management {
  padding: 0;
}
</style>
const express = require('express');
const router = express.Router();
const leadService = require('../services/leadService');
const { success, error, paginate } = require('../utils/response');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validate, createLeadSchema, updateLeadSchema } = require('../middleware/validation');
const XLSX = require('xlsx');
const dayjs = require('dayjs');

/**
 * 新增线索
 * POST /api/v1/lead
 */
router.post('/', authMiddleware, adminMiddleware, validate(createLeadSchema), async (req, res) => {
  try {
    const result = await leadService.createLead(req.body, req.user.userid);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 查询线索列表
 * GET /api/v1/lead
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      agentId: req.query.agent_id,
      customerName: req.query.customer_name,
      customerPhone: req.query.customer_phone,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
    };
    const pagination = {
      page: parseInt(req.query.page) || 1,
      size: Math.min(parseInt(req.query.size) || 20, 100),
    };
    const result = await leadService.getLeadList(filters, pagination);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    paginate(res, result.data.list, result.data.pagination);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 查看线索详情
 * GET /api/v1/lead/:id
 */
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await leadService.getLeadDetail(req.params.id);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 修改线索状态
 * PUT /api/v1/lead/:id
 */
router.put('/:id', authMiddleware, adminMiddleware, validate(updateLeadSchema), async (req, res) => {
  try {
    const result = await leadService.updateLeadStatus(req.params.id, req.body, req.user.userid);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, null, result.message);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 删除线索
 * DELETE /api/v1/lead/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await leadService.deleteLead(req.params.id, req.user.userid);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, null, result.message);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 导出线索列表
 * GET /api/v1/lead/export
 */
router.get('/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      agentId: req.query.agent_id,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
    };
    
    const result = await leadService.getLeadList(filters, { page: 1, size: 1000 });
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    
    const leads = result.data.list;
    
    // 转换数据为Excel格式
    let exportData = [];
    
    if (leads.length > 0) {
      exportData = leads.map(lead => ({
        '客户姓名': lead.customerName,
        '客户电话': lead.customerPhone,
        '车辆品牌': lead.carBrand,
        '车辆型号': lead.carModel,
        '预估金额': lead.carEstimatedPrice || '-',
        '实际成交金额': lead.carActualPrice || '-',
        '状态': lead.status === 0 ? '待跟进' : 
               lead.status === 1 ? '跟进中' : 
               lead.status === 2 ? '已看车' : 
               lead.status === 3 ? '已报价' : 
               lead.status === 4 ? '已成交' : '已失败',
        '归属经纪人': lead.agent?.username || '-',
        '创建时间': dayjs(lead.createdAt).format('YYYY-MM-DD HH:mm:ss')
      }));
    } else {
      // 无数据时，创建一个空对象，只包含表头
      exportData = [{
        '客户姓名': '',
        '客户电话': '',
        '车辆品牌': '',
        '车辆型号': '',
        '预估金额': '',
        '实际成交金额': '',
        '状态': '',
        '归属经纪人': '',
        '创建时间': ''
      }];
    }
    
    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '线索列表');
    
    // 生成Excel文件并设置响应头
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=leads_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`);
    res.send(excelBuffer);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

module.exports = router;

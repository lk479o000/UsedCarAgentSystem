const express = require('express');
const router = express.Router();
const settlementService = require('../services/settlementService');
const { success, error, paginate } = require('../utils/response');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validate, createSettlementSchema, updateSettlementSchema } = require('../middleware/validation');
const XLSX = require('xlsx');
const dayjs = require('dayjs');

/**
 * 新增结算
 * POST /api/v1/settlement
 */
router.post('/', authMiddleware, adminMiddleware, validate(createSettlementSchema), async (req, res) => {
  try {
    const result = await settlementService.createSettlement(req.body, req.user.userid);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 查询结算列表
 * GET /api/v1/settlement
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      agentId: req.query.agent_id,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
    };
    const pagination = {
      page: parseInt(req.query.page) || 1,
      size: Math.min(parseInt(req.query.size) || 20, 100),
    };
    const result = await settlementService.getSettlementList(filters, pagination);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    paginate(res, result.data.list, result.data.pagination);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 更新结算状态
 * PUT /api/v1/settlement/:id
 */
router.put('/:id', authMiddleware, adminMiddleware, validate(updateSettlementSchema), async (req, res) => {
  try {
    const result = await settlementService.updateSettlementStatus(req.params.id, req.body, req.user.userid);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, null, result.message);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 推送结算提醒
 * POST /api/v1/settlement/:id/notify
 */
router.post('/:id/notify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await settlementService.pushSettlementNotify(req.params.id);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, null, result.message);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 导出结算列表
 * GET /api/v1/settlement/export
 */
router.get('/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      agentId: req.query.agent_id,
      startDate: req.query.start_date,
      endDate: req.query.end_date,
    };
    
    const result = await settlementService.getSettlementList(filters, { page: 1, size: 1000 });
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    
    const settlements = result.data.list;
    
    // 转换数据为Excel格式
    const exportData = settlements.map(settlement => ({
      '客户姓名': settlement.lead?.customerName || '-',
      '车辆信息': `${settlement.lead?.carBrand || ''} ${settlement.lead?.carModel || ''}`,
      '利润金额': settlement.profit || 0,
      '经纪人分成': settlement.agentShare || 0,
      '结算状态': settlement.status === 0 ? '待结算' : '已结算',
      '结算时间': settlement.settledAt ? dayjs(settlement.settledAt).format('YYYY-MM-DD HH:mm:ss') : '-',
      '经纪人姓名': settlement.agent?.username || '-'
    }));
    
    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '结算列表');
    
    // 生成Excel文件并设置响应头
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=settlements_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`);
    res.send(excelBuffer);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

module.exports = router;

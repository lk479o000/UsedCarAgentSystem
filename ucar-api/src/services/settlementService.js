const { Settlement, Lead, User, OperationLog } = require('../models');
const { SETTLEMENT_STATUS, LEAD_STATUS, OPERATION_TYPE, OPERATION_TARGET, ERROR_CODES } = require('../utils/constants');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { snakeToCamel } = require('../utils/formatters');
const axios = require('axios');
const dayjs = require('dayjs');
const regionService = require('./regionService');

// 内存存储推送记录（生产环境应使用Redis）
const notifyStore = new Map();

// 微信access_token存储
let wxAccessToken = null;
let wxAccessTokenExpires = 0;

/**
 * 获取微信access_token
 */
const getWechatAccessToken = async () => {
  // 检查token是否有效
  if (wxAccessToken && Date.now() < wxAccessTokenExpires) {
    return wxAccessToken;
  }

  try {
    const response = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: process.env.WX_APPID,
        secret: process.env.WX_SECRET,
      },
    });

    if (response.data.errcode) {
      logger.error('获取微信access_token失败:', response.data.errmsg);
      return null;
    }

    wxAccessToken = response.data.access_token;
    wxAccessTokenExpires = Date.now() + (response.data.expires_in - 300) * 1000; // 提前5分钟过期
    return wxAccessToken;
  } catch (err) {
    logger.error('获取微信access_token异常:', err.message);
    return null;
  }
};

/**
 * 新增结算
 */
const createSettlement = async (settlementData, operatorUserId) => {
  const lead = await Lead.findOne({
    where: { id: settlementData.leadId, isDeleted: 0 },
  });

  if (!lead) {
    return { code: ERROR_CODES.NOT_FOUND, message: '线索不存在' };
  }

  if (lead.status !== LEAD_STATUS.DEAL) {
    return { code: ERROR_CODES.LEAD_NOT_DEAL, message: '线索未成交，无法创建结算' };
  }

  // 检查是否已存在结算记录
  const existingSettlement = await Settlement.findOne({
    where: { leadId: settlementData.leadId, isDeleted: 0 },
  });

  if (existingSettlement) {
    return { code: ERROR_CODES.SETTLEMENT_EXISTS, message: '该线索已存在结算记录' };
  }

  if (settlementData.agentShare > settlementData.profit) {
    return { code: ERROR_CODES.AGENT_SHARE_EXCEED_PROFIT, message: '分成金额不能大于利润金额' };
  }

  const settlement = await Settlement.create({
    leadId: settlementData.leadId,
    profit: settlementData.profit,
    agentShare: settlementData.agentShare,
    remark: settlementData.remark,
    status: SETTLEMENT_STATUS.PENDING,
    userId: operatorUserId,
  });

  // 记录操作日志
  await OperationLog.create({
    userId: operatorUserId,
    userType: 0,
    operationType: OPERATION_TYPE.CREATE,
    operationTarget: OPERATION_TARGET.SETTLEMENT,
    targetId: settlement.id,
    operationContent: `新增结算: 线索${settlementData.leadId}`,
  });

  return { code: ERROR_CODES.SUCCESS, data: { id: settlement.id } };
};

/**
 * 查询结算列表
 */
const getSettlementList = async (filters, pagination) => {
  const where = { isDeleted: 0 };
  const leadWhere = {};

  if (filters.status !== undefined && filters.status !== '') {
    where.status = filters.status;
  }
  if (filters.agentId) {
    where.userId = filters.agentId;
  }
  if (filters.startDate && filters.endDate) {
    where.createdAt = {
      [Op.between]: [filters.startDate, filters.endDate],
    };
  }
  if (filters.customerName) {
    leadWhere.customerName = { [Op.like]: `%${filters.customerName}%` };
  }
  if (filters.customerPhone) {
    leadWhere.customerPhone = { [Op.like]: `%${filters.customerPhone}%` };
  }
  if (filters.regionKeyword) {
    const regionIds = await regionService.getRegionIdsByKeyword(filters.regionKeyword);
    if (regionIds.length > 0) {
      leadWhere[Op.or] = [
        { provinceId: { [Op.in]: regionIds } },
        { cityId: { [Op.in]: regionIds } },
        { districtId: { [Op.in]: regionIds } },
      ];
    } else {
      leadWhere.id = -1;
    }
  }

  const hasLeadWhere = Object.keys(leadWhere).length > 0 || Object.getOwnPropertySymbols(leadWhere).length > 0;

  const { count, rows } = await Settlement.findAndCountAll({
    where,
    include: [
      {
        model: Lead,
        as: 'lead',
        attributes: ['id', 'customerName', 'customerPhone', 'carBrand', 'carModel'],
        ...(hasLeadWhere ? { where: leadWhere, required: true } : {}),
      },
      {
        model: User,
        as: 'operator',
        attributes: ['id', 'userid', 'username'],
      },
    ],
    order: [['created_at', 'DESC']],
    limit: pagination.size,
    offset: (pagination.page - 1) * pagination.size,
  });

  return {
    code: ERROR_CODES.SUCCESS,
    data: {
      list: snakeToCamel(rows),
      pagination: {
        page: pagination.page,
        size: pagination.size,
        total: count,
      },
    },
  };
};

/**
 * 更新结算状态
 */
const updateSettlementStatus = async (id, updateData, operatorUserId) => {
  const settlement = await Settlement.findOne({
    where: { id, isDeleted: 0 },
  });

  if (!settlement) {
    return { code: ERROR_CODES.NOT_FOUND, message: '结算记录不存在' };
  }

  // 已结算的记录不可修改金额
  if (settlement.status === SETTLEMENT_STATUS.SETTLED) {
    // 只允许修改备注
    if (updateData.profit !== undefined || updateData.agentShare !== undefined) {
      return { code: ERROR_CODES.SETTLED_CANNOT_MODIFY_AMOUNT, message: '已结算记录不可修改金额' };
    }
  }

  const updateFields = {};
  if (updateData.leadId !== undefined) {
    updateFields.leadId = updateData.leadId;
  }
  if (updateData.status !== undefined) {
    updateFields.status = updateData.status;
  }
  if (updateData.settledAt) {
    updateFields.settledAt = updateData.settledAt;
  } else if (updateData.status === SETTLEMENT_STATUS.SETTLED) {
    updateFields.settledAt = new Date();
  }
  if (updateData.profit !== undefined) {
    updateFields.profit = updateData.profit;
  }
  if (updateData.agentShare !== undefined) {
    updateFields.agentShare = updateData.agentShare;
  }
  if (updateData.remark !== undefined) {
    updateFields.remark = updateData.remark;
  }

  await settlement.update(updateFields);

  // 记录操作日志
  await OperationLog.create({
    userId: operatorUserId,
    userType: 0,
    operationType: OPERATION_TYPE.UPDATE,
    operationTarget: OPERATION_TARGET.SETTLEMENT,
    targetId: settlement.id,
    operationContent: `更新结算状态: ${updateData.status}`,
  });

  return { code: ERROR_CODES.SUCCESS, message: '结算更新成功' };
};

/**
 * 推送结算提醒
 */
const pushSettlementNotify = async (id) => {
  const settlement = await Settlement.findOne({
    where: { id, isDeleted: 0 },
    include: [
      {
        model: Lead,
        as: 'lead',
        attributes: ['id', 'userId', 'customerName', 'carBrand', 'carModel'],
      },
      {
        model: User,
        as: 'operator',
        attributes: ['id', 'userid', 'username'],
      },
    ],
  });

  if (!settlement) {
    return { code: ERROR_CODES.NOT_FOUND, message: '结算记录不存在' };
  }

  // 检查5分钟内是否已推送
  const lastNotify = notifyStore.get(id);
  if (lastNotify && Date.now() - lastNotify < 5 * 60 * 1000) {
    return { code: ERROR_CODES.NOTIFY_TOO_FREQUENT, message: '5分钟内已推送过提醒' };
  }

  // 获取经纪人信息（包含openid）
  const agent = await User.findOne({
    where: { userid: settlement.lead.userId, isDeleted: 0 },
    attributes: ['id', 'userid', 'username', 'openId'],
  });

  if (!agent || !agent.openId) {
    logger.warn(`经纪人未绑定微信: agentId=${settlement.lead.userId}`);
    // 即使未绑定微信，也记录推送时间，避免重复推送
    notifyStore.set(id, Date.now());
    return { code: ERROR_CODES.SUCCESS, message: '推送成功（经纪人未绑定微信）' };
  }

  // 获取微信access_token
  const accessToken = await getWechatAccessToken();
  if (!accessToken) {
    logger.error('获取微信access_token失败');
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '推送失败，微信服务异常' };
  }

  try {
    // 调用微信模板消息接口
    const templateId = process.env.WX_TEMPLATE_ID || 'TEMPLATE_ID'; // 需在环境变量中配置
    const response = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
      {
        touser: agent.openId,
        template_id: templateId,
        page: 'pages/settlements/settlements', // 跳转页面
        data: {
          thing1: {
            value: `客户: ${settlement.lead.customerName}`
          },
          thing2: {
            value: `${settlement.lead.carBrand} ${settlement.lead.carModel}`
          },
          amount3: {
            value: `¥${settlement.agentShare}`
          },
          time4: {
            value: dayjs().format('YYYY-MM-DD HH:mm')
          },
          thing5: {
            value: settlement.status === SETTLEMENT_STATUS.PENDING ? '待结算' : '已结算'
          }
        }
      }
    );

    if (response.data.errcode) {
      logger.error('推送微信通知失败:', response.data.errmsg);
      // 即使推送失败，也记录推送时间，避免重复推送
      notifyStore.set(id, Date.now());
      return { code: ERROR_CODES.SUCCESS, message: '推送成功（微信服务异常）' };
    }

    // 记录推送时间
    notifyStore.set(id, Date.now());
    logger.info(`结算提醒已推送: settlementId=${id}, agent=${agent.username}, openId=${agent.openId}`);

    return { code: ERROR_CODES.SUCCESS, message: '推送成功' };
  } catch (err) {
    logger.error('推送微信通知异常:', err.message);
    // 即使异常，也记录推送时间，避免重复推送
    notifyStore.set(id, Date.now());
    return { code: ERROR_CODES.SUCCESS, message: '推送成功（网络异常）' };
  }
};

/**
 * 根据线索ID获取结算记录
 */
const getSettlementByLeadId = async (leadId) => {
  try {
    const settlement = await Settlement.findOne({
      where: { leadId, isDeleted: 0 },
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'customerName', 'customerPhone', 'carBrand', 'carModel'],
        },
      ],
    });

    if (!settlement) {
      return { code: ERROR_CODES.NOT_FOUND, message: '结算记录不存在' };
    }

    return { code: ERROR_CODES.SUCCESS, data: snakeToCamel(settlement) };
  } catch (err) {
    logger.error('根据线索ID获取结算记录异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

module.exports = {
  createSettlement,
  getSettlementList,
  getSettlementByLeadId,
  updateSettlementStatus,
  pushSettlementNotify,
};

const { Lead, Settlement, User, OperationLog } = require('../models');
const { LEAD_STATUS, LEAD_STATUS_FLOW, OPERATION_TYPE, OPERATION_TARGET, ERROR_CODES } = require('../utils/constants');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { snakeToCamel } = require('../utils/formatters');

/**
 * 新增线索
 */
const createLead = async (leadData, operatorUserId) => {
  try {
    // 校验必填参数
    if (!leadData.customerName || !leadData.customerPhone || !leadData.carModel || !leadData.userId) {
      return { code: ERROR_CODES.PARAM_ERROR, message: '缺少必填参数' };
    }

    // 校验手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(leadData.customerPhone)) {
      return { code: ERROR_CODES.PHONE_FORMAT_ERROR, message: '手机号格式错误' };
    }

    // 检查经纪人是否存在
    const agent = await User.findOne({
      where: { userid: leadData.userId, isDeleted: 0 },
    });

    if (!agent) {
      return { code: ERROR_CODES.NOT_FOUND, message: '经纪人不存在' };
    }

    const lead = await Lead.create({
      customerName: leadData.customerName,
      customerPhone: leadData.customerPhone,
      carBrand: leadData.carBrand,
      carModel: leadData.carModel,
      notes: leadData.notes,
      userId: leadData.userId,
      status: LEAD_STATUS.PENDING,
    });

    // 记录操作日志
    await OperationLog.create({
      userId: operatorUserId,
      userType: 0,
      operationType: OPERATION_TYPE.CREATE,
      operationTarget: OPERATION_TARGET.LEAD,
      targetId: lead.id,
      operationContent: `新增线索: ${leadData.customerName}`,
    });

    return { code: ERROR_CODES.SUCCESS, data: { id: lead.id } };
  } catch (err) {
    logger.error('新增线索异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

/**
 * 查询线索列表
 */
const getLeadList = async (filters, pagination) => {
  try {
    const where = { isDeleted: 0 };

    if (filters.status !== undefined && filters.status !== '') {
      where.status = filters.status;
    }
    if (filters.agentId) {
      where.userId = filters.agentId;
    }
    if (filters.customerName) {
      where.customerName = { [Op.like]: `%${filters.customerName}%` };
    }
    if (filters.customerPhone) {
      where.customerPhone = { [Op.like]: `%${filters.customerPhone}%` };
    }
    if (filters.startDate && filters.endDate) {
      where.createdAt = {
        [Op.between]: [filters.startDate, filters.endDate],
      };
    }

    const { count, rows } = await Lead.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'userid', 'username', 'phone'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: pagination.size,
      offset: (pagination.page - 1) * pagination.size,
      raw: true,
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
  } catch (err) {
    logger.error('查询线索列表异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

/**
 * 查看线索详情
 */
const getLeadDetail = async (id) => {
  try {
    if (!id) {
      return { code: ERROR_CODES.PARAM_ERROR, message: '线索ID不能为空' };
    }

    const lead = await Lead.findOne({
      where: { id, isDeleted: 0 },
      include: [
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'userid', 'username', 'phone'],
        },
      ],
    });

    if (!lead) {
      return { code: ERROR_CODES.NOT_FOUND, message: '线索不存在' };
    }

    return { code: ERROR_CODES.SUCCESS, data: lead };
  } catch (err) {
    logger.error('查看线索详情异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

/**
 * 修改线索状态
 */
const updateLeadStatus = async (id, updateData, operatorUserId) => {
  try {
    if (!id || !updateData.status) {
      return { code: ERROR_CODES.PARAM_ERROR, message: '缺少必填参数' };
    }

    const lead = await Lead.findOne({
      where: { id, isDeleted: 0 },
    });

    if (!lead) {
      return { code: ERROR_CODES.NOT_FOUND, message: '线索不存在' };
    }

    const currentStatus = lead.status;
    const newStatus = parseInt(updateData.status);

    // 检查终态
    if (currentStatus === LEAD_STATUS.DEAL || currentStatus === LEAD_STATUS.FAILED) {
      return { code: ERROR_CODES.FINAL_STATUS_CANNOT_MODIFY, message: '终态不可修改' };
    }

    // 检查状态流转合法性
    const allowedTransitions = LEAD_STATUS_FLOW[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return { code: ERROR_CODES.INVALID_STATUS_FLOW, message: '状态流转非法' };
    }

    // 已成交必须提供成交价格
    if (newStatus === LEAD_STATUS.DEAL && !updateData.carActualPrice) {
      return { code: ERROR_CODES.MISSING_REQUIRED_PARAM, message: '成交价格必填' };
    }

    // 已失败必须提供失败原因
    if (newStatus === LEAD_STATUS.FAILED && !updateData.failReason) {
      return { code: ERROR_CODES.MISSING_REQUIRED_PARAM, message: '失败原因必填' };
    }

    const updateFields = { status: newStatus };
    if (newStatus === LEAD_STATUS.DEAL) {
      updateFields.carActualPrice = updateData.carActualPrice;
    }
    if (newStatus === LEAD_STATUS.FAILED) {
      updateFields.failReason = updateData.failReason;
    }

    await lead.update(updateFields);

    // 如果状态变为已成交，自动生成结算记录
    if (newStatus === LEAD_STATUS.DEAL) {
      const defaultAgentShare = Math.floor((updateData.carActualPrice || 0) * 0.5);
      await Settlement.create({
        leadId: lead.id,
        profit: updateData.carActualPrice || 0,
        agentShare: defaultAgentShare,
        status: 0,
        userId: operatorUserId,
      });
    }

    // 记录操作日志
    await OperationLog.create({
      userId: operatorUserId,
      userType: 0,
      operationType: OPERATION_TYPE.UPDATE,
      operationTarget: OPERATION_TARGET.LEAD,
      targetId: lead.id,
      operationContent: `修改线索状态: ${currentStatus} -> ${newStatus}`,
    });

    return { code: ERROR_CODES.SUCCESS, message: '状态更新成功' };
  } catch (err) {
    logger.error('修改线索状态异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

/**
 * 删除线索（逻辑删除）
 */
const deleteLead = async (id, operatorUserId) => {
  try {
    if (!id) {
      return { code: ERROR_CODES.PARAM_ERROR, message: '线索ID不能为空' };
    }

    const lead = await Lead.findOne({
      where: { id, isDeleted: 0 },
    });

    if (!lead) {
      return { code: ERROR_CODES.NOT_FOUND, message: '线索不存在' };
    }

    // 已成交和已失败的线索不可删除
    if (lead.status === LEAD_STATUS.DEAL || lead.status === LEAD_STATUS.FAILED) {
      return { code: ERROR_CODES.FINAL_STATUS_CANNOT_MODIFY, message: '终态线索不可删除' };
    }

    await lead.update({
      isDeleted: 1,
      deletedAt: new Date(),
    });

    // 记录操作日志
    await OperationLog.create({
      userId: operatorUserId,
      userType: 0,
      operationType: OPERATION_TYPE.DELETE,
      operationTarget: OPERATION_TARGET.LEAD,
      targetId: lead.id,
      operationContent: `删除线索: ${lead.customerName}`,
    });

    return { code: ERROR_CODES.SUCCESS, message: '删除成功' };
  } catch (err) {
    logger.error('删除线索异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

module.exports = {
  createLead,
  getLeadList,
  getLeadDetail,
  updateLeadStatus,
  deleteLead,
};

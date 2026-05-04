const { Lead, Settlement, User, OperationLog, LeadFollowup } = require('../models');
const { LEAD_STATUS, LEAD_STATUS_FLOW, OPERATION_TYPE, OPERATION_TARGET, ERROR_CODES } = require('../utils/constants');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { snakeToCamel } = require('../utils/formatters');
const regionService = require('./regionService');

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
      customerType: leadData.customerType || 0,
      carBrand: leadData.carBrand,
      carModel: leadData.carModel,
      provinceId: leadData.provinceId || null,
      cityId: leadData.cityId || null,
      districtId: leadData.districtId || null,
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
    if (filters.regionKeyword) {
      const regionIds = await regionService.getRegionIdsByKeyword(filters.regionKeyword);
      if (regionIds.length > 0) {
        where[Op.or] = [
          { provinceId: { [Op.in]: regionIds } },
          { cityId: { [Op.in]: regionIds } },
          { districtId: { [Op.in]: regionIds } },
        ];
      } else {
        where.id = -1;
      }
    }
    if (filters.provinceId) {
      where.provinceId = filters.provinceId;
    }
    if (filters.cityId) {
      where.cityId = filters.cityId;
    }
    if (filters.districtId) {
      where.districtId = filters.districtId;
    }
    if (filters.regionIds && filters.regionIds.length > 0) {
      where[Op.or] = [
        { provinceId: { [Op.in]: filters.regionIds } },
        { cityId: { [Op.in]: filters.regionIds } },
        { districtId: { [Op.in]: filters.regionIds } },
      ];
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

    const formattedLead = snakeToCamel(lead);
    return { code: ERROR_CODES.SUCCESS, data: formattedLead };
  } catch (err) {
    logger.error('查看线索详情异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

/**
 * 修改线索信息或状态
 */
const updateLeadStatus = async (id, updateData, operatorUserId) => {
  try {
    if (!id) {
      return { code: ERROR_CODES.PARAM_ERROR, message: '缺少必填参数' };
    }

    const lead = await Lead.findOne({
      where: { id, isDeleted: 0 },
    });

    if (!lead) {
      return { code: ERROR_CODES.NOT_FOUND, message: '线索不存在' };
    }

    const updateFields = {};
    
    // 处理基本信息更新
    if (updateData.customerName !== undefined) {
      updateFields.customerName = updateData.customerName;
    }
    if (updateData.customerPhone !== undefined) {
      updateFields.customerPhone = updateData.customerPhone;
    }
    if (updateData.customerType !== undefined) {
      updateFields.customerType = updateData.customerType;
    }
    if (updateData.carBrand !== undefined) {
      updateFields.carBrand = updateData.carBrand;
    }
    if (updateData.carModel !== undefined) {
      updateFields.carModel = updateData.carModel;
    }
    if (updateData.notes !== undefined) {
      updateFields.notes = updateData.notes;
    }
    if (updateData.userId !== undefined) {
      updateFields.userId = updateData.userId;
    }
    if (updateData.provinceId !== undefined) {
      updateFields.provinceId = updateData.provinceId || null;
    }
    if (updateData.cityId !== undefined) {
      updateFields.cityId = updateData.cityId || null;
    }
    if (updateData.districtId !== undefined) {
      updateFields.districtId = updateData.districtId || null;
    }

    // 处理状态更新
    if (updateData.status !== undefined) {
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

      updateFields.status = newStatus;
      if (newStatus === LEAD_STATUS.DEAL) {
        updateFields.carActualPrice = updateData.carActualPrice;
      }
      if (newStatus === LEAD_STATUS.FAILED) {
        updateFields.failReason = updateData.failReason;
      }

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
    }

    if (Object.keys(updateFields).length > 0) {
      await lead.update(updateFields);
    }

    // 记录操作日志
    await OperationLog.create({
      userId: operatorUserId,
      userType: 0,
      operationType: OPERATION_TYPE.UPDATE,
      operationTarget: OPERATION_TARGET.LEAD,
      targetId: lead.id,
      operationContent: `修改线索信息: ${lead.customerName}`,
    });

    return { code: ERROR_CODES.SUCCESS, message: '更新成功' };
  } catch (err) {
    logger.error('修改线索信息异常:', err.message);
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

/**
 * 新增跟进记录
 */
const createFollowup = async (followupData, operatorUserId) => {
  try {
    // 校验必填参数
    if (!followupData.leadId || !followupData.followupContent) {
      return { code: ERROR_CODES.PARAM_ERROR, message: '缺少必填参数' };
    }

    // 检查线索是否存在
    const lead = await Lead.findOne({
      where: { id: followupData.leadId, isDeleted: 0 },
    });

    if (!lead) {
      return { code: ERROR_CODES.NOT_FOUND, message: '线索不存在' };
    }

    const followup = await LeadFollowup.create({
      leadId: followupData.leadId,
      followupContent: followupData.followupContent,
      followupResult: followupData.followupResult,
      followupTime: followupData.followupTime || new Date(),
      nextFollowupTime: followupData.nextFollowupTime || null,
      operatorUserId: operatorUserId,
    });

    // 更新线索的最后跟进时间
    await lead.update({
      lastFollowupAt: new Date(),
    });

    // 记录操作日志
    await OperationLog.create({
      userId: operatorUserId,
      userType: 0,
      operationType: OPERATION_TYPE.CREATE,
      operationTarget: OPERATION_TARGET.LEAD,
      targetId: followupData.leadId,
      operationContent: `新增跟进记录: ${followupData.leadId}`,
    });

    return { code: ERROR_CODES.SUCCESS, data: { id: followup.id } };
  } catch (err) {
    logger.error('新增跟进记录异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

/**
 * 获取跟进记录列表
 */
const getFollowupList = async (leadId) => {
  try {
    if (!leadId) {
      return { code: ERROR_CODES.PARAM_ERROR, message: '线索ID不能为空' };
    }

    const followups = await LeadFollowup.findAll({
      where: { leadId, isDeleted: 0 },
      include: [
        {
          model: User,
          as: 'operator',
          attributes: ['id', 'userid', 'username', 'phone'],
        },
      ],
      order: [['created_at', 'DESC']],
      raw: true,
    });

    logger.info('原始跟进记录数据:', followups);
    const formattedFollowups = snakeToCamel(followups);
    logger.info('转换后的跟进记录数据:', formattedFollowups);

    return {
      code: ERROR_CODES.SUCCESS,
      data: formattedFollowups,
    };
  } catch (err) {
    logger.error('查询跟进记录列表异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

/**
 * 查看跟进记录详情
 */
const getFollowupDetail = async (id) => {
  try {
    if (!id) {
      return { code: ERROR_CODES.PARAM_ERROR, message: '跟进记录ID不能为空' };
    }

    const followup = await LeadFollowup.findOne({
      where: { id, isDeleted: 0 },
      include: [
        {
          model: User,
          as: 'operator',
          attributes: ['id', 'userid', 'username', 'phone'],
        },
      ],
    });

    if (!followup) {
      return { code: ERROR_CODES.NOT_FOUND, message: '跟进记录不存在' };
    }

    return { code: ERROR_CODES.SUCCESS, data: followup };
  } catch (err) {
    logger.error('查看跟进记录详情异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

/**
 * 更新跟进记录
 */
const updateFollowup = async (id, updateData, operatorUserId) => {
  try {
    if (!id) {
      return { code: ERROR_CODES.PARAM_ERROR, message: '跟进记录ID不能为空' };
    }

    const followup = await LeadFollowup.findOne({
      where: { id, isDeleted: 0 },
    });

    if (!followup) {
      return { code: ERROR_CODES.NOT_FOUND, message: '跟进记录不存在' };
    }

    await followup.update({
      followupContent: updateData.followupContent,
      followupResult: updateData.followupResult,
      followupTime: updateData.followupTime,
      nextFollowupTime: updateData.nextFollowupTime || null,
    });

    // 记录操作日志
    await OperationLog.create({
      userId: operatorUserId,
      userType: 0,
      operationType: OPERATION_TYPE.UPDATE,
      operationTarget: OPERATION_TARGET.LEAD,
      targetId: followup.leadId,
      operationContent: `更新跟进记录: ${id}`,
    });

    return { code: ERROR_CODES.SUCCESS, message: '更新成功' };
  } catch (err) {
    logger.error('更新跟进记录异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

/**
 * 删除跟进记录（逻辑删除）
 */
const deleteFollowup = async (id, operatorUserId) => {
  try {
    if (!id) {
      return { code: ERROR_CODES.PARAM_ERROR, message: '跟进记录ID不能为空' };
    }

    const followup = await LeadFollowup.findOne({
      where: { id, isDeleted: 0 },
    });

    if (!followup) {
      return { code: ERROR_CODES.NOT_FOUND, message: '跟进记录不存在' };
    }

    await followup.update({
      isDeleted: 1,
      deletedAt: new Date(),
    });

    // 记录操作日志
    await OperationLog.create({
      userId: operatorUserId,
      userType: 0,
      operationType: OPERATION_TYPE.DELETE,
      operationTarget: OPERATION_TARGET.LEAD,
      targetId: followup.leadId,
      operationContent: `删除跟进记录: ${id}`,
    });

    return { code: ERROR_CODES.SUCCESS, message: '删除成功' };
  } catch (err) {
    logger.error('删除跟进记录异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

module.exports = {
  createLead,
  getLeadList,
  getLeadDetail,
  updateLeadStatus,
  deleteLead,
  createFollowup,
  getFollowupList,
  getFollowupDetail,
  updateFollowup,
  deleteFollowup,
};

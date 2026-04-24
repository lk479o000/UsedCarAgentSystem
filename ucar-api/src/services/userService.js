const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { User, OperationLog } = require('../models');
const { USER_ROLE, USER_STATUS, OPERATION_TYPE, OPERATION_TARGET, ERROR_CODES } = require('../utils/constants');
const { Op } = require('sequelize');
const { snakeToCamel } = require('../utils/formatters');

// 读取RSA公钥
const publicKey = fs.readFileSync(path.join(__dirname, '../../public.pem'), 'utf8');

/**
 * RSA加密
 */
const rsaEncrypt = (text) => {
  const crypto = require('crypto');
  const buffer = Buffer.from(text, 'utf8');
  const encrypted = crypto.publicEncrypt({
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  }, buffer);
  return encrypted.toString('base64');
};

/**
 * 新增经纪人
 */
const createUser = async (userData, operatorUserId) => {
  // 检查userid是否已存在
  const existingUser = await User.findOne({
    where: { userid: userData.userid },
  });

  if (existingUser) {
    return { code: ERROR_CODES.USERID_EXISTS, message: 'userid已存在' };
  }

  // 检查手机号是否已存在
  const existingPhone = await User.findOne({
    where: { phone: userData.phone },
  });

  if (existingPhone) {
    return { code: ERROR_CODES.PHONE_EXISTS, message: '手机号已存在' };
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const rsaEncryptedPassword = rsaEncrypt(userData.password);

  const user = await User.create({
    userid: userData.userid,
    username: userData.username,
    phone: userData.phone,
    password: hashedPassword,
    passwordSecure: rsaEncryptedPassword,
    role: USER_ROLE.AGENT,
    status: USER_STATUS.ENABLED,
  });

  // 记录操作日志
  await OperationLog.create({
    userId: operatorUserId,
    userType: 0,
    operationType: OPERATION_TYPE.CREATE,
    operationTarget: OPERATION_TARGET.USER,
    targetId: user.id,
    operationContent: `新增经纪人: ${userData.username}`,
  });

  return { code: ERROR_CODES.SUCCESS, data: { id: user.id } };
};

/**
 * 查询经纪人列表
 */
const getUserList = async (filters, pagination) => {
  const where = { isDeleted: 0, role: USER_ROLE.AGENT };

  if (filters.status !== undefined && filters.status !== '') {
    where.status = filters.status;
  }
  if (filters.username) {
    where.username = { [Op.like]: `%${filters.username}%` };
  }
  if (filters.phone) {
    where.phone = { [Op.like]: `%${filters.phone}%` };
  }

  const { count, rows } = await User.findAndCountAll({
    where,
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
};

/**
 * 修改经纪人信息
 */
const updateUser = async (id, updateData, operatorUserId) => {
  const user = await User.findOne({
    where: { id, isDeleted: 0, role: USER_ROLE.AGENT },
  });

  if (!user) {
    return { code: ERROR_CODES.NOT_FOUND, message: '经纪人不存在' };
  }

  const updateFields = {};
  if (updateData.status !== undefined) {
    updateFields.status = updateData.status;
  }
  if (updateData.username !== undefined) {
    updateFields.username = updateData.username;
  }
  if (updateData.remark !== undefined) {
    updateFields.remark = updateData.remark;
  }

  await user.update(updateFields);

  // 记录操作日志
  await OperationLog.create({
    userId: operatorUserId,
    userType: 0,
    operationType: OPERATION_TYPE.UPDATE,
    operationTarget: OPERATION_TARGET.USER,
    targetId: user.id,
    operationContent: `修改经纪人信息: ${user.username}`,
  });

  return { code: ERROR_CODES.SUCCESS, message: '更新成功' };
};

/**
 * 获取经纪人概览数据
 */
const getUserOverview = async (userId) => {
  const { Lead, Settlement } = require('../models');
  const { LEAD_STATUS, SETTLEMENT_STATUS } = require('../utils/constants');

  const totalLeads = await Lead.count({
    where: { userId, isDeleted: 0 },
  });

  const totalSuccess = await Lead.count({
    where: { userId, status: LEAD_STATUS.DEAL, isDeleted: 0 },
  });

  const totalFail = await Lead.count({
    where: { userId, status: LEAD_STATUS.FAILED, isDeleted: 0 },
  });

  const pendingAmount = await Settlement.sum('agentShare', {
    where: {
      status: SETTLEMENT_STATUS.PENDING,
      isDeleted: 0,
    },
    include: [
      {
        model: Lead,
        as: 'lead',
        where: { userId, isDeleted: 0 },
        required: true,
        attributes: [],
      },
    ],
  });

  const settledAmount = await Settlement.sum('agentShare', {
    where: {
      status: SETTLEMENT_STATUS.SETTLED,
      isDeleted: 0,
    },
    include: [
      {
        model: Lead,
        as: 'lead',
        where: { userId, isDeleted: 0 },
        required: true,
        attributes: [],
      },
    ],
  });

  return {
    code: ERROR_CODES.SUCCESS,
    data: {
      totalLeads: totalLeads || 0,
      totalSuccess: totalSuccess || 0,
      totalFail: totalFail || 0,
      pendingAmount: pendingAmount || 0,
      settledAmount: settledAmount || 0,
    },
  };
};

/**
 * 获取经纪人的线索列表
 */
const getAgentLeads = async (userId, filters, pagination) => {
  const { Lead } = require('../models');

  const where = { user_id: userId, isDeleted: 0 };

  if (filters.status !== undefined && filters.status !== '') {
    where.status = filters.status;
  }

  const { count, rows } = await Lead.findAndCountAll({
    where,
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
};

/**
 * 获取经纪人的结算列表
 */
const getAgentSettlements = async (userId, filters, pagination) => {
  const { Settlement, Lead } = require('../models');

  const where = { isDeleted: 0 };

  if (filters.status !== undefined && filters.status !== '') {
    where.status = filters.status;
  }

  const { count, rows } = await Settlement.findAndCountAll({
    where,
    include: [
      {
        model: Lead,
        as: 'lead',
        where: { user_id: userId, isDeleted: 0 },
        required: true,
        attributes: ['id', 'customerName', 'carBrand', 'carModel'],
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
};

module.exports = {
  createUser,
  getUserList,
  updateUser,
  getUserOverview,
  getAgentLeads,
  getAgentSettlements,
};

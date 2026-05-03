const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const authService = require('../services/authService');
const { success, error, paginate } = require('../utils/response');
const { authMiddleware, adminMiddleware, agentMiddleware } = require('../middleware/auth');
const { validate, createUserSchema, passwordSchema, bindPhoneSchema, updateMeSchema } = require('../middleware/validation');

// ========== 管理员接口 ==========

/**
 * 新增经纪人
 * POST /api/v1/user
 */
router.post('/', authMiddleware, adminMiddleware, validate(createUserSchema), async (req, res) => {
  try {
    const result = await userService.createUser(req.body, req.user.userid);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 查询经纪人列表
 * GET /api/v1/user
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      username: req.query.username,
      phone: req.query.phone,
    };
    const pagination = {
      page: parseInt(req.query.page) || 1,
      size: Math.min(parseInt(req.query.size) || 20, 100),
    };
    const result = await userService.getUserList(filters, pagination);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    paginate(res, result.data.list, result.data.pagination);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 查询经纪人下拉列表（给小程序用）
 * GET /api/v1/user/agents
 *
 * 返回：[{ id, userid, username, phone, role, status, ... }]
 */
router.get('/agents', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const filters = {
      // 小程序下拉通常只需要启用的经纪人；如需全部可通过 ?status= 传空值覆盖
      status: req.query.status !== undefined ? req.query.status : 1,
      username: req.query.username,
      phone: req.query.phone,
    };
    const pagination = {
      page: 1,
      size: Math.min(parseInt(req.query.size) || 500, 1000),
    };
    const result = await userService.getUserList(filters, pagination);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data.list);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

// ========== 经纪人端接口（兼容小程序历史路径） ==========

/**
 * 修改密码（兼容：PUT /api/v1/user/password）
 */
router.put('/password', authMiddleware, validate(passwordSchema), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.userid, oldPassword, newPassword);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, null, result.message);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 绑定手机号（兼容：POST /api/v1/user/bind-phone）
 */
router.post('/bind-phone', authMiddleware, validate(bindPhoneSchema), async (req, res) => {
  try {
    const { phone, nickname, avatarUrl } = req.body;
    const result = await authService.bindPhone(req.user.openid || req.user.id, phone, nickname, avatarUrl);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 获取我的资料
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await userService.getMe(req.user.userid);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 更新我的资料（头像URL/昵称/姓名）
 */
router.put('/me', authMiddleware, validate(updateMeSchema), async (req, res) => {
  try {
    const result = await userService.updateMe(req.user.userid, req.body);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data, '更新成功');
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 修改经纪人信息
 * PUT /api/v1/user/:id
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await userService.updateUser(req.params.id, req.body, req.user.userid);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, null, result.message);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 重置经纪人密码
 * POST /api/v1/user/:id/reset-password
 */
router.post('/:id/reset-password', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await userService.resetPassword(req.params.id, req.user.userid);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, null, result.message);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

// ========== 经纪人端接口 ==========

/**
 * 数据概览
 * GET /api/v1/user/overview
 */
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const result = await userService.getUserOverview(req.user.userid);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 我的线索
 * GET /api/v1/user/lead
 */
router.get('/lead', authMiddleware, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      customerName: req.query.customer_name,
      customerPhone: req.query.customer_phone,
      regionKeyword: req.query.region_keyword,
    };
    const pagination = {
      page: parseInt(req.query.page) || 1,
      size: Math.min(parseInt(req.query.size) || 20, 100),
    };
    const result = await userService.getAgentLeads(req.user.userid, filters, pagination);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    paginate(res, result.data.list, result.data.pagination);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 我的结算
 * GET /api/v1/user/settlement
 */
router.get('/settlement', authMiddleware, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      customerName: req.query.customer_name,
      customerPhone: req.query.customer_phone,
      regionKeyword: req.query.region_keyword,
    };
    const pagination = {
      page: parseInt(req.query.page) || 1,
      size: Math.min(parseInt(req.query.size) || 20, 100),
    };
    const result = await userService.getAgentSettlements(req.user.userid, filters, pagination);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    paginate(res, result.data.list, result.data.pagination);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

module.exports = router;

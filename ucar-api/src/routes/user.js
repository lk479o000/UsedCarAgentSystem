const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { success, error, paginate } = require('../utils/response');
const { authMiddleware, adminMiddleware, agentMiddleware } = require('../middleware/auth');
const { validate, createUserSchema } = require('../middleware/validation');

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

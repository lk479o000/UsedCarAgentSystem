const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');
const { ERROR_CODES } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * JWT鉴权中间件
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, '未提供token', ERROR_CODES.AUTH_FAILED, 401);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn('JWT验证失败:', err.message);
    return error(res, 'token无效或已过期', ERROR_CODES.AUTH_FAILED, 401);
  }
};

/**
 * 管理员权限中间件
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 0) {
    return error(res, '无权限访问', ERROR_CODES.AUTH_FAILED, 403);
  }
  next();
};

/**
 * 经纪人权限中间件
 */
const agentMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 1) {
    return error(res, '无权限访问', ERROR_CODES.AUTH_FAILED, 403);
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  agentMiddleware,
};

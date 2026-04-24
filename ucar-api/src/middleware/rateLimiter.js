const rateLimit = require('express-rate-limit');
const { error } = require('../utils/response');
const { ERROR_CODES } = require('../utils/constants');

/**
 * 登录接口频率限制：同一IP每分钟最多10次
 */
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    error(res, ERROR_CODES.TOO_MANY_REQUESTS, ERROR_CODES.TOO_MANY_REQUESTS, 429);
  },
});

/**
 * 通用接口频率限制：同一用户每分钟最多600次
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user.userid : req.ip;
  },
  handler: (req, res) => {
    error(res, ERROR_CODES.TOO_MANY_REQUESTS, ERROR_CODES.TOO_MANY_REQUESTS, 429);
  },
});

module.exports = {
  loginLimiter,
  apiLimiter,
};

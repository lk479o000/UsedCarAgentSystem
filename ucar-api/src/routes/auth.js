const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validate, loginSchema, passwordSchema, wechatLoginSchema, bindPhoneSchema, decryptPhoneSchema } = require('../middleware/validation');

/**
 * 获取验证码
 * GET /api/v1/auth/captcha
 */
router.get('/captcha', (req, res) => {
  const captcha = authService.generateCaptcha();
  success(res, captcha);
});

/**
 * 管理员登录
 * POST /api/v1/auth/login
 */
router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { username, password, captcha, captchaId } = req.body;
    const ipAddress = req.ip;
    const result = await authService.login(username, password, captcha, captchaId, ipAddress);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 微信登录
 * POST /api/v1/auth/login/wechat
 */
router.post('/login/wechat', validate(wechatLoginSchema), async (req, res) => {
  try {
    const { code } = req.body;
    const ipAddress = req.ip;
    const result = await authService.wechatLogin(code, ipAddress);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 绑定手机号
 * POST /api/v1/auth/bind-phone
 */
router.post('/bind-phone', authMiddleware, validate(bindPhoneSchema), async (req, res) => {
  try {
    const { phone, nickname, avatarUrl } = req.body;
    // 从token中获取openid，或者需要临时存储openid
    // 这里简化处理，实际应该使用临时token或session
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
 * 修改密码
 * PUT /api/v1/auth/password
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
 * 解密微信手机号
 * POST /api/v1/auth/decrypt-phone
 */
router.post('/decrypt-phone', validate(decryptPhoneSchema), async (req, res) => {
  try {
    const { code, encryptedData, iv } = req.body;
    const result = await authService.decryptPhone(code, encryptedData, iv);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

module.exports = router;

const Joi = require('joi');
const { error } = require('../utils/response');

/**
 * 请求参数校验中间件
 * @param {Object} schema - Joi校验schema
 * @param {String} property - 校验的属性 (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property];
    const { error: validationError } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (validationError) {
      const message = validationError.details.map((d) => d.message).join(', ');
      return error(res, message, 1);
    }

    next();
  };
};

// 登录校验schema
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  captcha: Joi.string().length(4).required(),
  captchaId: Joi.string().required(),
});

// 修改密码校验schema
const passwordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(20).required(),
  newPasswordConfirm: Joi.string().valid(Joi.ref('newPassword')).required(),
});

// 新增线索校验schema
const createLeadSchema = Joi.object({
  customerName: Joi.string().max(50).required(),
  customerPhone: Joi.string().max(20).required(),
  customerType: Joi.number().integer().valid(0, 1).required(),
  carBrand: Joi.string().max(50).allow(null, ''),
  carModel: Joi.string().max(50).required(),
  notes: Joi.string().max(500).allow(null, ''),
  userId: Joi.string().max(15).required(),
});

// 修改线索校验schema
const updateLeadSchema = Joi.object({
  customerName: Joi.string().max(50).allow(null, ''),
  customerPhone: Joi.string().max(20).allow(null, ''),
  customerType: Joi.number().integer().valid(0, 1).allow(null),
  carBrand: Joi.string().max(50).allow(null, ''),
  carModel: Joi.string().max(50).allow(null, ''),
  notes: Joi.string().max(500).allow(null, ''),
  userId: Joi.string().max(15).allow(null, ''),
  status: Joi.number().integer().min(0).max(5).allow(null),
  failReason: Joi.string().max(500).allow(null, ''),
  carActualPrice: Joi.number().integer().min(0).allow(null),
});

// 新增结算校验schema
const createSettlementSchema = Joi.object({
  leadId: Joi.number().integer().required(),
  profit: Joi.number().integer().min(0).required(),
  agentShare: Joi.number().integer().min(0).required(),
  remark: Joi.string().max(500).allow(null, ''),
});

// 更新结算状态校验schema
const updateSettlementSchema = Joi.object({
  status: Joi.number().integer().valid(0, 1).allow(null),
  settledAt: Joi.date().allow(null),
  remark: Joi.string().max(500).allow(null, ''),
  profit: Joi.number().integer().min(0).allow(null),
  agentShare: Joi.number().integer().min(0).allow(null),
});

// 新增经纪人校验schema
const createUserSchema = Joi.object({
  userid: Joi.string().max(15).required(),
  username: Joi.string().max(50).required(),
  phone: Joi.string().max(20).required(),
  password: Joi.string().min(6).max(20).required(),
});

// 微信登录校验schema
const wechatLoginSchema = Joi.object({
  code: Joi.string().required(),
});

// 绑定手机号校验schema
const bindPhoneSchema = Joi.object({
  phone: Joi.string().max(20).required(),
  nickname: Joi.string().max(50).allow(null, ''),
  avatarUrl: Joi.string().max(255).allow(null, ''),
});

// 解密手机号校验schema
const decryptPhoneSchema = Joi.object({
  code: Joi.string().required(),
  encryptedData: Joi.string().required(),
  iv: Joi.string().required(),
});

module.exports = {
  validate,
  loginSchema,
  passwordSchema,
  createLeadSchema,
  updateLeadSchema,
  createSettlementSchema,
  updateSettlementSchema,
  createUserSchema,
  wechatLoginSchema,
  bindPhoneSchema,
  decryptPhoneSchema,
};

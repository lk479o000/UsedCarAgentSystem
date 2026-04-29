const Joi = require('joi');
const { error } = require('../utils/response');

/**
 * 将Joi错误消息转换为中文
 */
const translateErrorMessage = (message) => {
  if (message.includes('"captcha" length must be 4 characters long')) {
    return '验证码必须为4位';
  }
  if (message.includes('must be a string')) {
    return '必须是字符串类型';
  }
  if (message.includes('is required')) {
    return '是必填项';
  }
  if (message.includes('length must be')) {
    const field = message.match(/"([^"]+)"/)?.[1];
    const length = message.match(/(\d+)/)?.[0];
    return `${field || '此字段'}长度必须为${length}位`;
  }
  if (message.includes('must be less than or equal to')) {
    const field = message.match(/"([^"]+)"/)?.[1];
    const max = message.match(/less than or equal to (\d+)/)?.[1];
    return `${field || '此字段'}长度不能超过${max}位`;
  }
  if (message.includes('must be at least')) {
    const field = message.match(/"([^"]+)"/)?.[1];
    const min = message.match(/at least (\d+)/)?.[1];
    return `${field || '此字段'}长度至少为${min}位`;
  }
  if (message.includes('must be a number')) {
    const field = message.match(/"([^"]+)"/)?.[1];
    return `${field || '此字段'}必须是数字`;
  }
  if (message.includes('must be one of')) {
    const field = message.match(/"([^"]+)"/)?.[1];
    return `${field || '此字段'}值不正确`;
  }
  if (message.includes('must be a valid date')) {
    const field = message.match(/"([^"]+)"/)?.[1];
    return `${field || '此字段'}必须是有效日期`;
  }
  if (message.includes('must be greater than or equal to')) {
    const field = message.match(/"([^"]+)"/)?.[1];
    const min = message.match(/equal to (\d+)/)?.[1];
    return `${field || '此字段'}值不能小于${min}`;
  }
  if (message.includes('must be less than or equal to')) {
    const field = message.match(/"([^"]+)"/)?.[1];
    const max = message.match(/equal to (\d+)/)?.[1];
    return `${field || '此字段'}值不能大于${max}`;
  }
  if (message.includes('with value')) {
    const field = message.match(/"([^"]+)"/)?.[1];
    return `${field || '此字段'}值不匹配`;
  }
  return message;
};

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
      const message = validationError.details.map((d) => translateErrorMessage(d.message)).join(', ');
      return error(res, message, 1);
    }

    next();
  };
};

// 登录校验schema
const loginSchema = Joi.object({
  username: Joi.string().max(50).required(),
  password: Joi.string().max(50).required(),
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

// 更新个人资料校验schema（经纪人端）
const updateMeSchema = Joi.object({
  username: Joi.string().max(50).allow(null, ''),
  nickname: Joi.string().max(50).allow(null, ''),
  avatarUrl: Joi.string().max(255).allow(null, ''),
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
  updateMeSchema,
};

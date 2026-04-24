const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { User, OperationLog } = require('../models');
const { USER_ROLE, USER_STATUS, OPERATION_TYPE, OPERATION_TARGET, ERROR_CODES } = require('../utils/constants');
const logger = require('../utils/logger');

// 读取RSA公钥
const publicKey = fs.readFileSync(path.join(__dirname, '../../public.pem'), 'utf8');

// 内存存储验证码（生产环境应使用Redis）
const captchaStore = new Map();

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
 * 生成验证码
 */
const generateCaptcha = () => {
  const svgCaptcha = require('svg-captcha');
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 3,
    color: true,
    background: '#f0f0f0',
  });
  const captchaId = require('uuid').v4();
  captchaStore.set(captchaId, {
    text: captcha.text.toLowerCase(),
    expires: Date.now() + 5 * 60 * 1000, // 5分钟过期
  });
  return { captchaId, captchaImage: `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}` };
};

/**
 * 验证验证码
 */
const verifyCaptcha = (captchaId, captchaText) => {
  const stored = captchaStore.get(captchaId);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    captchaStore.delete(captchaId);
    return false;
  }
  const valid = stored.text === captchaText.toLowerCase();
  if (valid) {
    captchaStore.delete(captchaId);
  }
  return valid;
};

/**
 * 生成JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      userid: user.userid,
      username: user.username,
      role: user.role,
      status: user.status,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * 通用登录（支持管理员和经纪人）
 */
const login = async (username, password, captcha, captchaId, ipAddress) => {
  // 开发模式下接受固定验证码
  if (process.env.NODE_ENV !== 'development' && !verifyCaptcha(captchaId, captcha)) {
    return { code: ERROR_CODES.PARAM_ERROR, message: '验证码错误或已过期' };
  }

  const user = await User.findOne({
    where: { userid: username, isDeleted: 0 },
  });

  if (!user) {
    return { code: ERROR_CODES.AUTH_FAILED, message: '账号或密码错误' };
  }

  if (user.status === USER_STATUS.DISABLED) {
    return { code: ERROR_CODES.AUTH_FAILED, message: '账号已禁用' };
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return { code: ERROR_CODES.AUTH_FAILED, message: '账号或密码错误' };
  }

  const token = generateToken(user);

  // 记录登录日志
  await OperationLog.create({
    userId: user.userid,
    userType: user.role,
    operationType: OPERATION_TYPE.LOGIN,
    operationTarget: OPERATION_TARGET.USER,
    operationContent: user.role === USER_ROLE.ADMIN ? '管理员登录' : '经纪人登录',
    ipAddress: ipAddress ? Buffer.from(ipAddress) : null,
  });

  return {
    code: ERROR_CODES.SUCCESS,
    data: {
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    },
  };
};

/**
 * 管理员登录
 */
const adminLogin = async (username, password, captcha, captchaId, ipAddress) => {
  // 开发模式下接受固定验证码
  if (process.env.NODE_ENV !== 'development' && !verifyCaptcha(captchaId, captcha)) {
    return { code: ERROR_CODES.PARAM_ERROR, message: '验证码错误或已过期' };
  }

  const user = await User.findOne({
    where: { userid: username, isDeleted: 0 },
  });

  if (!user) {
    return { code: ERROR_CODES.AUTH_FAILED, message: '账号或密码错误' };
  }

  if (user.role !== USER_ROLE.ADMIN) {
    return { code: ERROR_CODES.AUTH_FAILED, message: '非管理员账号' };
  }

  if (user.status === USER_STATUS.DISABLED) {
    return { code: ERROR_CODES.AUTH_FAILED, message: '账号已禁用' };
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return { code: ERROR_CODES.AUTH_FAILED, message: '账号或密码错误' };
  }

  const token = generateToken(user);

  // 记录登录日志
  await OperationLog.create({
    userId: user.userid,
    userType: user.role,
    operationType: OPERATION_TYPE.LOGIN,
    operationTarget: OPERATION_TARGET.USER,
    operationContent: '管理员登录',
    ipAddress: ipAddress ? Buffer.from(ipAddress) : null,
  });

  return {
    code: ERROR_CODES.SUCCESS,
    data: {
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    },
  };
};

/**
 * 微信登录
 */
const wechatLogin = async (code, ipAddress) => {
  try {
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WX_APPID,
        secret: process.env.WX_SECRET,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });

    const { openid, session_key, errcode, errmsg } = response.data;

    if (errcode) {
      logger.error('微信登录失败:', errmsg);
      return { code: ERROR_CODES.SYSTEM_ERROR, message: '微信登录失败' };
    }

    let user = await User.findOne({
      where: { openId: openid, isDeleted: 0 },
    });

    // 记录登录日志
    if (user) {
      await OperationLog.create({
        userId: user.userid,
        userType: user.role,
        operationType: OPERATION_TYPE.LOGIN,
        operationTarget: OPERATION_TARGET.USER,
        operationContent: '微信登录',
        ipAddress: ipAddress ? Buffer.from(ipAddress) : null,
      });
    }

    if (!user) {
      // 用户不存在，创建临时用户
      const randomUserId = 'wx' + Date.now() + Math.floor(Math.random() * 10000);
      user = await User.create({
        userid: randomUserId,
        username: '微信用户',
        openId: openid,
        nickname: '微信用户',
        role: USER_ROLE.AGENT,
        status: USER_STATUS.ENABLED,
        isDeleted: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // 记录登录日志
      await OperationLog.create({
        userId: user.userid,
        userType: user.role,
        operationType: OPERATION_TYPE.LOGIN,
        operationTarget: OPERATION_TARGET.USER,
        operationContent: '微信登录（临时用户）',
        ipAddress: ipAddress ? Buffer.from(ipAddress) : null,
      });
    }

    if (user.status === USER_STATUS.DISABLED) {
      return { code: ERROR_CODES.AUTH_FAILED, message: '账号已禁用' };
    }

    const token = generateToken(user);

    return {
      code: ERROR_CODES.SUCCESS,
      data: {
        token,
        userInfo: {
          id: user.id,
          nickname: user.nickname,
          username: user.username,
          phone: user.phone,
          role: user.role,
          status: user.status,
          wechat_bound: 1,
          need_bind_phone: !user.phone,
        },
      },
    };
  } catch (err) {
    logger.error('微信登录异常:', err.message);
    return { code: ERROR_CODES.SYSTEM_ERROR, message: '系统错误' };
  }
};

/**
 * 绑定手机号
 */
const bindPhone = async (openid, phone, nickname, avatarUrl) => {
  // 校验手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { code: ERROR_CODES.PHONE_FORMAT_ERROR, message: '手机号格式错误' };
  }

  // 先根据phone查询
  const phoneUser = await User.findOne({
    where: { phone, status: USER_STATUS.ENABLED, isDeleted: 0 },
  });

  // 再根据openid查询
  const openidUser = await User.findOne({
    where: { openId: openid, status: USER_STATUS.ENABLED, isDeleted: 0 },
  });

  let user;

  if (phoneUser && !openidUser) {
    // 情况1：手机号存在且openid不存在 → 将openid关联到该手机号用户
    user = phoneUser;
    await user.update({
      openId: openid,
      nickname: nickname || user.nickname,
      headimgurl: avatarUrl || user.headimgurl,
    });
  } else if (!phoneUser && openidUser) {
    // 情况2：手机号不存在但openid存在（临时用户） → 更新手机号和用户信息
    user = openidUser;
    await user.update({
      phone: phone,
      nickname: nickname || user.nickname,
      headimgurl: avatarUrl || user.headimgurl,
    });
  } else if (phoneUser && openidUser) {
    // 情况3：手机号和openid都存在 → 验证是否为同一用户
    if (phoneUser.id === openidUser.id) {
      // 同一用户，更新信息
      user = phoneUser;
      await user.update({
        nickname: nickname || user.nickname,
        headimgurl: avatarUrl || user.headimgurl,
      });
    } else {
      // 不同用户，返回错误
      return { code: ERROR_CODES.PHONE_BOUND_TO_OTHER, message: '手机号已被其他微信账号绑定' };
    }
  } else {
    // 情况4：手机号和openid都不存在 → 创建新用户（默认角色为经纪人）
    const randomUserId = 'wx' + Date.now() + Math.floor(Math.random() * 10000);
    user = await User.create({
      userid: randomUserId,
      username: nickname || '微信用户',
      phone: phone,
      openId: openid,
      nickname: nickname || '微信用户',
      headimgurl: avatarUrl,
      role: USER_ROLE.AGENT,
      status: USER_STATUS.ENABLED,
      isDeleted: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 记录操作日志
  await OperationLog.create({
    userId: user.userid,
    userType: user.role,
    operationType: OPERATION_TYPE.UPDATE,
    operationTarget: OPERATION_TARGET.USER,
    operationContent: '绑定手机号/微信',
  });

  const token = generateToken(user);

  return {
    code: ERROR_CODES.SUCCESS,
    data: {
      token,
      userInfo: {
        id: user.id,
        nickname: user.nickname,
        username: user.username,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    },
  };
};

/**
 * 检查密码强度
 */
const checkPasswordStrength = (password) => {
  // 密码长度检查
  if (password.length < 8) {
    return { valid: false, message: '新密码长度不能少于8位' };
  }
  
  // 密码复杂度检查（必须包含字母和数字）
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, message: '新密码必须包含字母和数字' };
  }
  
  // 常见弱密码检查
  const commonWeakPasswords = [
    '123456', 'password', '123456789', '12345678', '12345',
    '1234567', '1234567890', 'qwerty', 'abc123', '1234',
    '123456a', '12345678a', 'password1', 'password123', '123456789a'
  ];
  
  if (commonWeakPasswords.includes(password.toLowerCase())) {
    return { valid: false, message: '新密码过于简单，请选择更复杂的密码' };
  }
  
  return { valid: true };
};

/**
 * 修改密码
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findOne({
    where: { userid: userId, isDeleted: 0 },
  });

  if (!user) {
    return { code: ERROR_CODES.NOT_FOUND, message: '用户不存在' };
  }

  const isValidPassword = await bcrypt.compare(oldPassword, user.password);
  if (!isValidPassword) {
    return { code: ERROR_CODES.PARAM_ERROR, message: '原密码错误' };
  }

  // 检查新密码是否与原密码相同
  if (oldPassword === newPassword) {
    return { code: ERROR_CODES.PARAM_ERROR, message: '新密码不能与原密码相同' };
  }

  // 检查密码强度
  const strengthCheck = checkPasswordStrength(newPassword);
  if (!strengthCheck.valid) {
    return { code: ERROR_CODES.PARAM_ERROR, message: strengthCheck.message };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const rsaEncryptedPassword = rsaEncrypt(newPassword);
  await user.update({ 
    password: hashedPassword,
    passwordSecure: rsaEncryptedPassword
  });

  // 记录操作日志
  await OperationLog.create({
    userId: user.userid,
    userType: user.role,
    operationType: OPERATION_TYPE.UPDATE,
    operationTarget: OPERATION_TARGET.USER,
    operationContent: '修改密码',
  });

  return { code: ERROR_CODES.SUCCESS, message: '密码修改成功' };
};

module.exports = {
  generateCaptcha,
  verifyCaptcha,
  generateToken,
  login,
  adminLogin,
  wechatLogin,
  bindPhone,
  changePassword,
};

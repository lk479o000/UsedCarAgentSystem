// 错误码映射配置
export const errorCodeMap = {
  0: '操作成功',
  1: '参数错误',
  2: '登录已过期，请重新登录',
  3: '数据不存在',
  4: '系统错误',
  10: '状态流转非法',
  11: '缺少必填参数',
  12: '终态不可修改',
  13: '线索未成交，无法创建结算',
  14: '分成金额不能大于利润金额',
  15: '该线索已存在结算记录',
  16: '已结算记录不可修改金额',
  17: '5分钟内已推送过提醒',
  18: '手机号已被其他微信账号绑定',
  19: '用户ID已存在',
  20: '手机号已存在',
  21: '手机号格式错误',
  22: '请先绑定手机号',
  429: '请求过于频繁，请稍后再试'
}

// 根据错误码获取错误消息
export function getErrorMessage(code, defaultMessage = '操作失败') {
  return defaultMessage || errorCodeMap[code] || '操作失败'
}

// 根据错误码获取消息类型
export function getMessageType(code) {
  switch (code) {
    case 0:
      return 'success'
    case 1:
    case 2:
    case 3:
    case 4:
    case 10:
    case 11:
    case 12:
    case 13:
    case 14:
    case 15:
    case 16:
    case 17:
    case 18:
    case 19:
    case 20:
    case 21:
    case 22:
    case 429:
      return 'error'
    default:
      return 'error'
  }
}

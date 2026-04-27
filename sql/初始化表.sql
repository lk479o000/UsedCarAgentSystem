-- 创建数据库
CREATE DATABASE IF NOT EXISTS ucar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ucar_db;

-- 创建c_user表
CREATE TABLE IF NOT EXISTS c_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  open_id VARCHAR(100) NULL UNIQUE,
  userid VARCHAR(15) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(100) NOT NULL,
  password_secure VARCHAR(500) NOT NULL,
  nickname VARCHAR(50) NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  headimgurl VARCHAR(255) NULL,
  role TINYINT NOT NULL DEFAULT 1 COMMENT '0=管理员, 1=经纪人',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '0=禁用, 1=启用',
  remark TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  INDEX idx_userid (userid),
  INDEX idx_phone (phone),
  INDEX idx_open_id (open_id),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 创建c_lead表
CREATE TABLE IF NOT EXISTS c_lead (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_type TINYINT NOT NULL DEFAULT 0 COMMENT '0=买家, 1=卖家',
  customer_name VARCHAR(50) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  car_brand VARCHAR(50) NULL,
  car_model VARCHAR(50) NOT NULL,
  car_price BIGINT NULL DEFAULT 0 COMMENT '预估金额',
  car_actual_price BIGINT NULL DEFAULT 0 COMMENT '实际成交金额',
  notes VARCHAR(500) NULL,
  user_id VARCHAR(15) NOT NULL COMMENT '关联经纪人userid',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '0=待跟进,1=跟进中,2=已看车,3=已报价,4=已成交,5=已失败',
  fail_reason VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_followup_at DATETIME NULL,
  is_deleted TINYINT NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_customer_phone (customer_phone),
  INDEX idx_created_at (created_at),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线索表';

-- 创建c_settlement表
CREATE TABLE IF NOT EXISTS c_settlement (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  lead_id BIGINT NOT NULL,
  profit BIGINT NOT NULL DEFAULT 0 COMMENT '利润金额(元)',
  agent_share BIGINT NOT NULL DEFAULT 0 COMMENT '经纪人分成(元)',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '0=待结算, 1=已结算',
  remark VARCHAR(500) NULL,
  settled_at DATETIME NULL,
  user_id VARCHAR(15) NOT NULL COMMENT '结算操作人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  INDEX idx_lead_id (lead_id),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='结算表';

-- 创建c_operation_log表
CREATE TABLE IF NOT EXISTS c_operation_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(15) NOT NULL,
  user_type TINYINT NOT NULL COMMENT '0=管理员, 1=经纪人',
  operation_type TINYINT NOT NULL COMMENT '0=登录,1=新增,2=修改,3=删除,4=其他',
  operation_target TINYINT NOT NULL COMMENT '0=线索,1=结算,2=用户,3=其他',
  target_id BIGINT NULL,
  operation_content TEXT NULL,
  ip_address VARBINARY(16) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted TINYINT NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 创建c_dict表
CREATE TABLE IF NOT EXISTS c_dict (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  dict_type VARCHAR(50) NOT NULL,
  dict_code TINYINT NOT NULL,
  dict_name VARCHAR(50) NOT NULL,
  dict_desc VARCHAR(100) NULL,
  sort_order TINYINT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  UNIQUE KEY uk_dict_type_code (dict_type, dict_code),
  INDEX idx_status (status),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典表';

-- 创建c_lead_import表
CREATE TABLE IF NOT EXISTS c_lead_import (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_name VARCHAR(50) NULL,
  customer_phone VARCHAR(20) NULL,
  referrer VARCHAR(50) NULL COMMENT '介绍人',
  expected_price VARCHAR(20) NULL COMMENT '心里价位(万)',
  wechat_added TINYINT NULL COMMENT '0=未添加,1=个人微信,2=企业微信',
  car_brand VARCHAR(50) NULL,
  vin VARCHAR(50) NULL COMMENT '车架号',
  mileage VARCHAR(20) NULL COMMENT '公里数(万)',
  is_dealt TINYINT NULL COMMENT '0=否,1=是',
  estimated_amount VARCHAR(20) NULL,
  deal_amount VARCHAR(20) NULL COMMENT '成交金额(万)',
  is_sold TINYINT NULL COMMENT '0=否,1=是',
  buyer_name VARCHAR(50) NULL COMMENT '回购人员',
  car_address VARCHAR(200) NULL,
  import_date DATE NULL,
  import_batch VARCHAR(50) NOT NULL COMMENT '导入批次号',
  import_status TINYINT NOT NULL DEFAULT 0 COMMENT '0=未处理,1=已转为线索,2=已忽略',
  lead_id BIGINT NULL,
  remark VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_import_batch (import_batch),
  INDEX idx_customer_phone (customer_phone),
  INDEX idx_import_status (import_status),
  INDEX idx_name_phone (customer_name, customer_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线索导入记录表';

-- 创建c_lead_followup表
CREATE TABLE IF NOT EXISTS c_lead_followup (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  lead_id BIGINT NOT NULL COMMENT '关联线索ID',
  followup_content TEXT NOT NULL COMMENT '跟进内容',
  followup_result VARCHAR(200) NULL COMMENT '跟进结果',
  followup_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '这次跟进时间',
  next_followup_time DATETIME NULL COMMENT '下次跟进时间',
  operator_user_id VARCHAR(15) NOT NULL COMMENT '操作人ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  INDEX idx_lead_id (lead_id),
  INDEX idx_operator_user_id (operator_user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线索跟进记录表';

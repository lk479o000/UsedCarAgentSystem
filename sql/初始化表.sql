-- 创建数据库
CREATE DATABASE IF NOT EXISTS ucar_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ucar_db;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `c_user` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  `open_id` VARCHAR(100) NULL UNIQUE COMMENT '开放ID',
  `userid` VARCHAR(15) NOT NULL UNIQUE COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(100) NOT NULL COMMENT '密码',
  `password_secure` VARCHAR(500) NOT NULL COMMENT '密码安全存储',
  `nickname` VARCHAR(50) NULL COMMENT '昵称',
  `phone` VARCHAR(20) NOT NULL UNIQUE COMMENT '手机号',
  `headimgurl` VARCHAR(255) NULL COMMENT '头像URL',
  `role` TINYINT NOT NULL DEFAULT 1 COMMENT '0=管理员, 1=经纪人',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '0=禁用, 1=启用',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除',
  `deleted_at` DATETIME NULL COMMENT '删除时间',
  INDEX `idx_userid` (`userid`) COMMENT '用户ID索引',
  INDEX `idx_phone` (`phone`) COMMENT '手机号索引',
  INDEX `idx_open_id` (`open_id`) COMMENT '开放ID索引',
  INDEX `idx_role` (`role`) COMMENT '角色索引',
  INDEX `idx_status` (`status`) COMMENT '状态索引',
  INDEX `idx_is_deleted` (`is_deleted`) COMMENT '是否删除索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 创建线索表
CREATE TABLE IF NOT EXISTS `c_lead` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '线索ID',
  `customer_type` TINYINT NOT NULL DEFAULT 0 COMMENT '0=买家, 1=卖家',
  `customer_name` VARCHAR(50) NOT NULL COMMENT '客户姓名',
  `customer_phone` VARCHAR(20) NOT NULL COMMENT '客户手机号',
  `car_brand` VARCHAR(50) NULL COMMENT '车品牌',
  `car_model` VARCHAR(50) NOT NULL COMMENT '车型号',
  `province_id` BIGINT DEFAULT NULL COMMENT '所属省份ID',
  `city_id` BIGINT DEFAULT NULL COMMENT '所属城市ID',
  `district_id` BIGINT DEFAULT NULL COMMENT '所属区县ID',
  `car_price` BIGINT NULL DEFAULT 0 COMMENT '预估金额',
  `car_actual_price` BIGINT NULL DEFAULT 0 COMMENT '实际成交金额',
  `notes` VARCHAR(500) NULL COMMENT '备注',
  `user_id` VARCHAR(15) NOT NULL COMMENT '关联经纪人userid',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=待跟进,1=跟进中,2=已看车,3=已报价,4=已成交,5=已失败',
  `fail_reason` VARCHAR(500) NULL COMMENT '失败原因',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_followup_at` DATETIME NULL COMMENT '最后跟进时间',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除',
  `deleted_at` DATETIME NULL COMMENT '删除时间',
  INDEX `idx_user_id` (`user_id`) COMMENT '经纪人userid索引',
  INDEX `idx_province_id` (`province_id`) COMMENT '省份ID索引',
  INDEX `idx_city_id` (`city_id`) COMMENT '城市ID索引',
  INDEX `idx_district_id` (`district_id`) COMMENT '区县ID索引',
  INDEX `idx_status` (`status`) COMMENT '状态索引',
  INDEX `idx_customer_phone` (`customer_phone`) COMMENT '客户手机号索引',
  INDEX `idx_created_at` (`created_at`) COMMENT '创建时间索引',
  INDEX `idx_is_deleted` (`is_deleted`) COMMENT '是否删除索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线索表';

-- 创建结算表
CREATE TABLE IF NOT EXISTS `c_settlement` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '结算ID',
  `lead_id` BIGINT NOT NULL COMMENT '线索ID',
  `profit` BIGINT NOT NULL DEFAULT 0 COMMENT '利润金额(元)',
  `agent_share` BIGINT NOT NULL DEFAULT 0 COMMENT '经纪人分成(元)',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=待结算, 1=已结算',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  `settled_at` DATETIME NULL COMMENT '结算时间',
  `user_id` VARCHAR(15) NOT NULL COMMENT '结算操作人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除',
  `deleted_at` DATETIME NULL COMMENT '删除时间',
  INDEX `idx_lead_id` (`lead_id`) COMMENT '线索ID索引',
  INDEX `idx_status` (`status`) COMMENT '状态索引',
  INDEX `idx_user_id` (`user_id`) COMMENT '经纪人userid索引',
  INDEX `idx_is_deleted` (`is_deleted`) COMMENT '是否删除索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='结算表';

-- 创建操作日志表
CREATE TABLE IF NOT EXISTS `c_operation_log` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '操作日志ID',
  `user_id` VARCHAR(15) NOT NULL COMMENT '操作人',
  `user_type` TINYINT NOT NULL COMMENT '0=管理员, 1=经纪人',
  `operation_type` TINYINT NOT NULL COMMENT '0=登录,1=新增,2=修改,3=删除,4=其他',
  `operation_target` TINYINT NOT NULL COMMENT '0=线索,1=结算,2=用户,3=其他',
  `target_id` BIGINT NULL COMMENT '操作目标ID',
  `operation_content` TEXT NULL COMMENT '操作内容',
  `ip_address` VARBINARY(16) NULL COMMENT '操作IP地址',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除',
  `deleted_at` DATETIME NULL COMMENT '删除时间',
  INDEX `idx_user_id` (`user_id`) COMMENT '操作人索引',
  INDEX `idx_created_at` (`created_at`) COMMENT '创建时间索引',
  INDEX `idx_user_created` (`user_id`, `created_at`) COMMENT '操作人-创建时间索引',
  INDEX `idx_is_deleted` (`is_deleted`) COMMENT '是否删除索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 创建字典表
CREATE TABLE IF NOT EXISTS `c_dict` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '字典ID',
  `dict_type` VARCHAR(50) NOT NULL COMMENT '字典类型',
  `dict_code` TINYINT NOT NULL COMMENT '字典编码',
  `dict_name` VARCHAR(50) NOT NULL COMMENT '字典名称',
  `dict_desc` VARCHAR(100) NULL COMMENT '字典描述',
  `sort_order` TINYINT NOT NULL DEFAULT 0 COMMENT '排序顺序',
  `dict_type` VARCHAR(50) NOT NULL COMMENT '字典类型',
  `dict_code` TINYINT NOT NULL COMMENT '字典编码',
  `dict_name` VARCHAR(50) NOT NULL COMMENT '字典名称',
  `dict_desc` VARCHAR(100) NULL COMMENT '字典描述',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除',
  `deleted_at` DATETIME NULL COMMENT '删除时间',
  UNIQUE KEY `uk_dict_type_code` (`dict_type`, `dict_code`) COMMENT '字典类型-编码唯一索引',
  INDEX `idx_status` (`status`) COMMENT '状态索引',
  INDEX `idx_is_deleted` (`is_deleted`) COMMENT '是否删除索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='字典表';

-- 创建线索导入记录表
CREATE TABLE IF NOT EXISTS `c_lead_import` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '线索导入记录ID',
  `customer_name` VARCHAR(50) NULL COMMENT '客户姓名',
  `customer_phone` VARCHAR(20) NULL COMMENT '客户手机号',
  `referrer` VARCHAR(50) NULL COMMENT '介绍人',
  `expected_price` VARCHAR(20) NULL COMMENT '心里价位(万)',
  `wechat_added` TINYINT NULL COMMENT '0=未添加,1=个人微信,2=企业微信',
  `car_brand` VARCHAR(50) NULL COMMENT '品牌',
  `vin` VARCHAR(50) NULL COMMENT '车架号',
  `mileage` VARCHAR(20) NULL COMMENT '公里数(万)',
  `is_dealt` TINYINT NULL COMMENT '0=否,1=是',
  `estimated_amount` VARCHAR(20) NULL COMMENT '预计成交金额(万)',
  `deal_amount` VARCHAR(20) NULL COMMENT '成交金额(万)',
  `is_sold` TINYINT NULL COMMENT '0=否,1=是',
  `buyer_name` VARCHAR(50) NULL COMMENT '回购人员',
  `car_address` VARCHAR(200) NULL COMMENT '车辆地址',
  `import_date` DATE NULL COMMENT '导入日期',
  `import_batch` VARCHAR(50) NOT NULL COMMENT '导入批次号',
  `import_status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=未处理,1=已转为线索,2=已忽略',
  `lead_id` BIGINT NULL COMMENT '关联线索ID',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除',
  `deleted_at` DATETIME NULL COMMENT '删除时间',
  INDEX `idx_import_batch` (`import_batch`) COMMENT '导入批次号索引',
  INDEX `idx_customer_phone` (`customer_phone`) COMMENT '客户手机号索引',
  INDEX `idx_import_status` (`import_status`) COMMENT '导入状态索引',
  INDEX `idx_name_phone` (`customer_name`, `customer_phone`) COMMENT '客户姓名-手机号索引',
  INDEX `idx_is_deleted` (`is_deleted`) COMMENT '是否删除索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线索导入记录表';

-- 创建线索跟进记录表
CREATE TABLE IF NOT EXISTS `c_lead_followup` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '线索跟进记录ID',
  `lead_id` BIGINT NOT NULL COMMENT '关联线索ID',
  `followup_content` TEXT NOT NULL COMMENT '跟进内容',
  `followup_result` VARCHAR(200) NULL COMMENT '跟进结果',
  `followup_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '这次跟进时间',
  `next_followup_time` DATETIME NULL COMMENT '下次跟进时间',
  `operator_user_id` VARCHAR(15) NOT NULL COMMENT '操作人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除',
  `deleted_at` DATETIME NULL COMMENT '删除时间',
  INDEX `idx_lead_id` (`lead_id`) COMMENT '线索ID索引',
  INDEX `idx_operator_user_id` (`operator_user_id`) COMMENT '操作人ID索引',
  INDEX `idx_created_at` (`created_at`) COMMENT '创建时间索引',
  INDEX `idx_is_deleted` (`is_deleted`) COMMENT '是否删除索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='线索跟进记录表';

-- 创建区域表（省市区县三级）
CREATE TABLE `c_region` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '区域ID',
  `parent_id` BIGINT DEFAULT '0' COMMENT '父级ID（0表示顶级省份）',
  `region_code` VARCHAR(20) NOT NULL COMMENT '区域编码（行政区划代码）',
  `region_name` VARCHAR(100) NOT NULL COMMENT '区域名称',
  `region_level` TINYINT NOT NULL COMMENT '区域级别（1-省/直辖市，2-市，3-区县）',
  `full_name` VARCHAR(200) DEFAULT NULL COMMENT '完整名称（省-市-区）',
  `sort_order` INT DEFAULT '0' COMMENT '排序',
  `status` TINYINT DEFAULT '1' COMMENT '状态（1-启用，0-禁用）',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` TINYINT DEFAULT '0' COMMENT '是否删除 默认0 0否1是',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE COMMENT '主键索引',
  KEY `idx_parent_id` (`parent_id`) USING BTREE COMMENT '父级ID索引',
  KEY `idx_region_code` (`region_code`) USING BTREE COMMENT '区域编码索引',
  KEY `idx_region_level` (`region_level`) USING BTREE COMMENT '区域级别索引',
  INDEX `idx_is_deleted` (`is_deleted`) USING BTREE COMMENT '是否删除索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='区域表（省市区县三级）';

-- 创建区域层级关系闭包表（省市区县三级）
CREATE TABLE `c_region_cl` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID，自增长唯一标识',
  `region_id` BIGINT NOT NULL COMMENT '当前节点ID，指向c_region.id',
  `ancestor_id` BIGINT NOT NULL COMMENT '祖先节点ID，指向c_region.id',
  `ancestor_level` TINYINT NOT NULL COMMENT '祖先节点区域级别',
  `descendant_level` TINYINT NOT NULL COMMENT '当前节点区域级别',
  `path_length` INT NOT NULL COMMENT '路径长度，0表示自身，1表示父节点，依次类推',
  `is_direct` TINYINT DEFAULT '0' COMMENT '是否直接父子关系',
  `is_root_node` TINYINT DEFAULT '0' COMMENT '祖先是否为根节点（省/直辖市）',
  `full_path` VARCHAR(500) DEFAULT NULL COMMENT '完整路径（名称链），示例：广东省 > 深圳市 > 南山区',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
  PRIMARY KEY (`id`) USING BTREE COMMENT '主键索引',
  KEY `idx_region_ancestor` (`region_id`, `ancestor_id`) USING BTREE COMMENT '区域ID-祖先ID索引',
  KEY `idx_ancestor_level` (`ancestor_level`, `region_id`) USING BTREE COMMENT '祖先级别-区域ID索引',
  KEY `idx_ancestor_path` (`ancestor_id`, `path_length`, `region_id`) USING BTREE COMMENT '祖先ID-路径长度-区域ID索引',
  KEY `idx_region_root` (`region_id`, `is_root_node`) USING BTREE COMMENT '区域ID-是否根节点索引',
  KEY `idx_path_length` (`region_id`, `path_length`) USING BTREE COMMENT '区域ID-路径长度索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='区域层级关系闭包表（省市区县三级）';

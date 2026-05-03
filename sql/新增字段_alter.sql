-- =============================================
-- 数据库新增字段 ALTER 语句
-- 版本: v1.1
-- 日期: 2026-05-01
-- =============================================

USE ucar_db;

-- =============================================
-- 1. c_lead 表（线索表）新增字段
-- =============================================
ALTER TABLE `c_lead` 
ADD COLUMN `province_id` BIGINT DEFAULT NULL COMMENT '所属省份ID' AFTER `car_model`,
ADD COLUMN `city_id` BIGINT DEFAULT NULL COMMENT '所属城市ID' AFTER `province_id`,
ADD COLUMN `district_id` BIGINT DEFAULT NULL COMMENT '所属区县ID' AFTER `city_id`;

-- 添加索引
ALTER TABLE `c_lead` 
ADD INDEX `idx_province_id` (`province_id`) COMMENT '省份ID索引',
ADD INDEX `idx_city_id` (`city_id`) COMMENT '城市ID索引',
ADD INDEX `idx_district_id` (`district_id`) COMMENT '区县ID索引';

-- =============================================
-- 2. c_operation_log 表（操作日志表）新增字段
-- =============================================
ALTER TABLE `c_operation_log` 
ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER `created_at`;

-- =============================================
-- 3. c_lead_import 表（线索导入记录表）新增字段
-- =============================================
ALTER TABLE `c_lead_import` 
ADD COLUMN `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除' AFTER `remark`,
ADD COLUMN `deleted_at` DATETIME NULL COMMENT '删除时间' AFTER `is_deleted`;

-- 添加索引
ALTER TABLE `c_lead_import` 
ADD INDEX `idx_is_deleted` (`is_deleted`) COMMENT '是否删除索引';

-- =============================================
-- 4. c_lead_followup 表（线索跟进记录表）新增字段
-- =============================================
-- updated_at 字段已存在，无需新增

-- =============================================
-- 5. c_region 表（区域表）新增字段
-- =============================================
ALTER TABLE `c_region` 
ADD COLUMN `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间' AFTER `is_deleted`;

-- =============================================
-- 说明:
-- =============================================
-- 1. 以上ALTER语句适用于从旧版本数据库升级到新版本
-- 2. 执行前请确保数据库备份
-- =============================================

-- 常用SQL语句

-- 1. 查询所有用户（管理员和经纪人）
SELECT id AS 用户账号, username AS 用户名, nickname AS 昵称, phone AS 手机号, role AS 角色, status AS 状态 FROM c_user WHERE is_deleted = 0 ORDER BY role, id;

-- 2. 查询所有经纪人
SELECT id AS 用户账号, username AS 真实姓名, nickname AS 昵称, phone AS 手机号, status AS 状态 FROM c_user WHERE role = 1 AND is_deleted = 0 ORDER BY id;

-- 3. 查询所有管理员
SELECT id AS 用户账号, username AS 用户名, status AS 状态 FROM c_user WHERE role = 0 AND is_deleted = 0 ORDER BY id;

-- 4. 查询线索列表（带用户信息）
SELECT l.id AS 线索ID, l.customer_type AS 类型, l.customer_name AS 客户姓名, l.customer_phone AS 客户电话, l.car_brand AS 汽车品牌, l.car_model AS 汽车型号, l.status AS 状态,
       u.username AS 经纪人姓名, l.created_at AS 创建时间, l.updated_at AS 更新时间
FROM c_lead l
LEFT JOIN c_user u ON l.user_id = u.userid
WHERE l.is_deleted = 0
ORDER BY l.created_at DESC;

-- 5. 查询待跟进的线索
SELECT l.id AS 线索ID, l.customer_type AS 类型, l.customer_name AS 客户姓名, l.customer_phone AS 客户电话, l.car_brand AS 汽车品牌, l.car_model AS 汽车型号,
       u.username AS 经纪人姓名, l.created_at AS 创建时间
FROM c_lead l
LEFT JOIN c_user u ON l.user_id = u.userid
WHERE l.status = 0 AND l.is_deleted = 0
ORDER BY l.created_at DESC;

-- 6. 查询已成交的线索
SELECT l.id AS 线索ID, l.customer_type AS 类型, l.customer_name AS 客户姓名, l.customer_phone AS 客户电话, l.car_brand AS 汽车品牌, l.car_model AS 汽车型号,
       u.username AS 经纪人姓名, l.created_at AS 创建时间
FROM c_lead l
LEFT JOIN c_user u ON l.user_id = u.userid
WHERE l.status = 4 AND l.is_deleted = 0
ORDER BY l.created_at DESC;

-- 7. 查询结算列表（带线索和用户信息）
SELECT s.id AS 结算ID, l.customer_type AS 类型, l.customer_name AS 客户姓名, l.car_brand AS 汽车品牌, l.car_model AS 汽车型号, s.profit AS 利润, s.agent_share AS 经纪人分成,
       s.status AS 状态, s.settled_at AS 结算时间, u.username AS 经纪人姓名,
       admin.username AS 操作人姓名
FROM c_settlement s
LEFT JOIN c_lead l ON s.lead_id = l.id
LEFT JOIN c_user u ON l.user_id = u.userid
LEFT JOIN c_user admin ON s.user_id = admin.userid
WHERE s.is_deleted = 0
ORDER BY s.created_at DESC;

-- 8. 查询待结算的结算记录
SELECT s.id AS 结算ID, l.customer_type AS 类型, l.customer_name AS 客户姓名, l.car_brand AS 汽车品牌, l.car_model AS 汽车型号, s.profit AS 利润, s.agent_share AS 经纪人分成,
       u.username AS 经纪人姓名
FROM c_settlement s
LEFT JOIN c_lead l ON s.lead_id = l.id
LEFT JOIN c_user u ON l.user_id = u.userid
WHERE s.status = 0 AND s.is_deleted = 0
ORDER BY s.created_at DESC;

-- 9. 查询已结算的结算记录
SELECT s.id AS 结算ID, l.customer_type AS 类型, l.customer_name AS 客户姓名, l.car_brand AS 汽车品牌, l.car_model AS 汽车型号, s.profit AS 利润, s.agent_share AS 经纪人分成,
       s.settled_at AS 结算时间, u.username AS 经纪人姓名, admin.username AS 操作人姓名
FROM c_settlement s
LEFT JOIN c_lead l ON s.lead_id = l.id
LEFT JOIN c_user u ON l.user_id = u.userid
LEFT JOIN c_user admin ON s.user_id = admin.userid
WHERE s.status = 1 AND s.is_deleted = 0
ORDER BY s.settled_at DESC;

-- 10. 统计每个经纪人的线索数量
SELECT u.userid AS 用户账号, u.username AS 经纪人姓名, COUNT(l.id) AS 线索数量
FROM c_user u
LEFT JOIN c_lead l ON u.userid = l.user_id AND l.is_deleted = 0
WHERE u.role = 1 AND u.is_deleted = 0
GROUP BY u.userid, u.username
ORDER BY 线索数量 DESC;

-- 11. 统计每个经纪人的成交数量和总收益
SELECT u.userid AS 用户账号, u.username AS 经纪人姓名,
       COUNT(CASE WHEN l.status = 4 THEN 1 END) AS 成交数量,
       SUM(CASE WHEN s.status = 1 THEN s.agent_share ELSE 0 END) AS 已结算收益,
       SUM(CASE WHEN s.status = 0 THEN s.agent_share ELSE 0 END) AS 待结算收益
FROM c_user u
LEFT JOIN c_lead l ON u.userid = l.user_id AND l.is_deleted = 0
LEFT JOIN c_settlement s ON l.id = s.lead_id AND s.is_deleted = 0
WHERE u.role = 1 AND u.is_deleted = 0
GROUP BY u.userid, u.username
ORDER BY 已结算收益 DESC;

-- 12. 查询操作日志（带用户信息）
SELECT ol.id AS 日志ID, u.username AS 操作用户, ol.operation_type AS 操作类型, ol.operation_target AS 操作目标,
       ol.target_id AS 目标ID, ol.operation_content AS 操作内容, ol.ip_address AS IP地址, ol.created_at AS 操作时间
FROM c_operation_log ol
LEFT JOIN c_user u ON ol.user_id = u.userid
WHERE ol.is_deleted = 0
ORDER BY ol.created_at DESC
LIMIT 100;

-- 13. 根据用户ID查询其线索
SELECT id AS 线索ID, customer_type AS 类型, customer_name AS 客户姓名, customer_phone AS 客户电话, car_brand AS 汽车品牌, car_model AS 汽车型号, status AS 状态, created_at AS 创建时间
FROM c_lead
WHERE user_id = ? AND is_deleted = 0
ORDER BY created_at DESC;

-- 14. 根据用户ID查询其结算记录
SELECT s.id AS 结算ID, l.customer_type AS 类型, l.customer_name AS 客户姓名, l.car_brand AS 汽车品牌, l.car_model AS 汽车型号, s.profit AS 利润, s.agent_share AS 经纪人分成,
       s.status AS 状态, s.settled_at AS 结算时间
FROM c_settlement s
LEFT JOIN c_lead l ON s.lead_id = l.id
WHERE l.user_id = ? AND s.is_deleted = 0
ORDER BY s.created_at DESC;

-- 15. 查询系统总统计数据
SELECT
  (SELECT COUNT(*) FROM c_user WHERE role = 0 AND is_deleted = 0) AS 管理员数量,
  (SELECT COUNT(*) FROM c_user WHERE role = 1 AND is_deleted = 0) AS 经纪人数量,
  (SELECT COUNT(*) FROM c_lead WHERE is_deleted = 0) AS 线索总数,
  (SELECT COUNT(*) FROM c_lead WHERE status = 4 AND is_deleted = 0) AS 成交数量,
  (SELECT COUNT(*) FROM c_lead WHERE status = 5 AND is_deleted = 0) AS 失败数量,
  (SELECT COUNT(*) FROM c_settlement WHERE is_deleted = 0) AS 结算总数,
  (SELECT COUNT(*) FROM c_settlement WHERE status = 1 AND is_deleted = 0) AS 已结算数量,
  (SELECT SUM(agent_share) FROM c_settlement WHERE status = 1 AND is_deleted = 0) AS 已结算总金额
;
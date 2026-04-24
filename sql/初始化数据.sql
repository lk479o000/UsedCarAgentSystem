-- --------------- 初始用户表 -----------------

-- 插入管理员账号
INSERT INTO c_user (userid, username, password, password_secure, phone, role, status, nickname) VALUES
('admin', 'admin', '$2a$10$9klY3I4PXOt6BrFNyq94BO/2tV2zoql3EzWJD7tnvECJ0XTkpQjzi', 'cS+RP79J0t00upQQCSTqLQ8onqlABY6UeMR7C+W7Z8ppWnPLTG/zelMMrvBLEDF1pG5znRPm1V/PMEbCJjMj2kzjeWcd93888w2b0eFWqNia2h2xVsdWRY6RpUdHDWryisyVS3YDmZOlz/09sPtaD7fqjbh5wOSlBrDKuK7P7vnlGEhVv/aWUqHawwMaPq94TbZSs4TQgaUtvzhUfwHF1Nl2blFQpY4D51L413e3by3BVgS72OEO3jQR5RrbVihZLLPQByzPc0LTUAPJuiKwZ2KwoAt33bbRS1j6axeNBl4ujPvtO6h7BU4G+6vKruQzxuxEAOm9D5PrU72/n4XMQA==', '18140099917', 0, 1, '系统管理员');

-- --------------- 初始用户表 -----------------


-- --------------- 初始化码表/字典表 -----------------

-- 插入用户角色数据
INSERT INTO c_dict (dict_type, dict_code, dict_name, dict_desc, sort_order) VALUES
('user_role', 0, '管理员', '系统管理员', 0),
('user_role', 1, '经纪人', '普通用户（经纪人）', 1);

-- 插入用户状态数据
INSERT INTO c_dict (dict_type, dict_code, dict_name, dict_desc, sort_order) VALUES
('user_status', 0, '禁用', '用户账号已禁用', 0),
('user_status', 1, '启用', '用户账号已启用', 1);

-- 插入线索状态数据
INSERT INTO c_dict (dict_type, dict_code, dict_name, dict_desc, sort_order) VALUES
('lead_status', 0, '待跟进', '线索待跟进', 0),
('lead_status', 1, '跟进中', '线索跟进中', 1),
('lead_status', 2, '已看车', '已看车', 2),
('lead_status', 3, '已报价', '已报价', 3),
('lead_status', 4, '已成交', '已成交', 4),
('lead_status', 5, '已失败', '已失败', 5);

-- 插入结算状态数据
INSERT INTO c_dict (dict_type, dict_code, dict_name, dict_desc, sort_order) VALUES
('settlement_status', 0, '待结算', '结算待处理', 0),
('settlement_status', 1, '已结算', '结算已完成', 1);

-- 插入操作类型数据
INSERT INTO c_dict (dict_type, dict_code, dict_name, dict_desc, sort_order) VALUES
('operation_type', 0, '登录', '用户登录', 0),
('operation_type', 1, '新增', '新增数据', 1),
('operation_type', 2, '修改', '修改数据', 2),
('operation_type', 3, '删除', '删除数据', 3),
('operation_type', 4, '其他', '其他操作', 4);

-- 插入操作目标数据
INSERT INTO c_dict (dict_type, dict_code, dict_name, dict_desc, sort_order) VALUES
('operation_target', 0, '线索', '线索相关操作', 0),
('operation_target', 1, '结算', '结算相关操作', 1),
('operation_target', 2, '用户', '用户相关操作', 2),
('operation_target', 3, '其他', '其他操作目标', 3);

-- 插入用户类型数据
INSERT INTO c_dict (dict_type, dict_code, dict_name, dict_desc, sort_order) VALUES
('user_type', 0, '管理员', '系统管理员', 0),
('user_type', 1, '经纪人', '普通用户（经纪人）', 1);

-- 常用SQL语句
-- 1. 查询所有用户角色
SELECT dict_code, dict_name FROM c_dict WHERE dict_type = 'user_role' AND status = 1 ORDER BY sort_order;

-- 2. 查询所有线索状态
SELECT dict_code, dict_name FROM c_dict WHERE dict_type = 'lead_status' AND status = 1 ORDER BY sort_order;

-- 3. 查询所有结算状态
SELECT dict_code, dict_name FROM c_dict WHERE dict_type = 'settlement_status' AND status = 1 ORDER BY sort_order;

-- 4. 根据字典类型和编码查询字典名称
SELECT dict_name FROM c_dict WHERE dict_type = ? AND dict_code = ? AND status = 1;

-- 5. 查询所有字典类型
SELECT DISTINCT dict_type FROM c_dict WHERE status = 1;

-- 6. 根据字典类型查询所有字典数据
SELECT dict_code, dict_name, dict_desc FROM c_dict WHERE dict_type = ? AND status = 1 ORDER BY sort_order;

-- --------------- 初始化码表/字典表 -----------------
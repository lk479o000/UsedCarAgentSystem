const sequelize = require('../../config/database');
const { DataTypes } = require('sequelize');

// 用户表
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    openId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      field: 'open_id',
    },
    userid: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    passwordSecure: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'password_secure',
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    headimgurl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'is_deleted',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    tableName: 'c_user',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['userid'], unique: true },
      { fields: ['phone'], unique: true },
      { fields: ['open_id'], unique: true },
      { fields: ['role'] },
      { fields: ['status'] },
      { fields: ['is_deleted'] },
    ],
  }
);

// 线索表
const Lead = sequelize.define(
  'Lead',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    customerType: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'customer_type',
    },
    customerName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'customer_name',
    },
    customerPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'customer_phone',
    },
    carBrand: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'car_brand',
    },
    carModel: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'car_model',
    },
    provinceId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'province_id',
    },
    cityId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'city_id',
    },
    districtId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'district_id',
    },
    carPrice: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0,
      field: 'car_price',
    },
    carActualPrice: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0,
      field: 'car_actual_price',
    },
    notes: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    userId: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: 'user_id',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    failReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'fail_reason',
    },
    lastFollowupAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_followup_at',
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'is_deleted',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    tableName: 'c_lead',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['province_id'] },
      { fields: ['city_id'] },
      { fields: ['district_id'] },
      { fields: ['status'] },
      { fields: ['customer_phone'] },
      { fields: ['created_at'] },
      { fields: ['is_deleted'] },
    ],
  }
);

// 结算表
const Settlement = sequelize.define(
  'Settlement',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    leadId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'lead_id',
    },
    profit: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    agentShare: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: 'agent_share',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    settledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'settled_at',
    },
    userId: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: 'user_id',
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'is_deleted',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    tableName: 'c_settlement',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['lead_id'] },
      { fields: ['status'] },
      { fields: ['user_id'] },
      { fields: ['is_deleted'] },
    ],
  }
);

// 操作日志表
const OperationLog = sequelize.define(
  'OperationLog',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: 'user_id',
    },
    userType: {
      type: DataTypes.TINYINT,
      allowNull: false,
      field: 'user_type',
    },
    operationType: {
      type: DataTypes.TINYINT,
      allowNull: false,
      field: 'operation_type',
    },
    operationTarget: {
      type: DataTypes.TINYINT,
      allowNull: false,
      field: 'operation_target',
    },
    targetId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'target_id',
    },
    operationContent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'operation_content',
    },
    ipAddress: {
      type: DataTypes.BLOB('tiny'),
      allowNull: true,
      field: 'ip_address',
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'is_deleted',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    tableName: 'c_operation_log',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['created_at'] },
      { fields: ['user_id', 'created_at'] },
      { fields: ['is_deleted'] },
    ],
  }
);

// 字典表
const Dict = sequelize.define(
  'Dict',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    dictType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'dict_type',
    },
    dictCode: {
      type: DataTypes.TINYINT,
      allowNull: false,
      field: 'dict_code',
    },
    dictName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'dict_name',
    },
    dictDesc: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'dict_desc',
    },
    sortOrder: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'is_deleted',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    tableName: 'c_dict',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['dict_type', 'dict_code'], unique: true },
      { fields: ['status'] },
      { fields: ['is_deleted'] },
    ],
  }
);

// 线索导入记录表
const LeadImport = sequelize.define(
  'LeadImport',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    customerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'customer_name',
    },
    customerPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'customer_phone',
    },
    referrer: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    expectedPrice: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'expected_price',
    },
    wechatAdded: {
      type: DataTypes.TINYINT,
      allowNull: true,
      field: 'wechat_added',
    },
    carBrand: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'car_brand',
    },
    vin: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    mileage: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    isDealt: {
      type: DataTypes.TINYINT,
      allowNull: true,
      field: 'is_dealt',
    },
    estimatedAmount: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'estimated_amount',
    },
    dealAmount: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'deal_amount',
    },
    isSold: {
      type: DataTypes.TINYINT,
      allowNull: true,
      field: 'is_sold',
    },
    buyerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'buyer_name',
    },
    carAddress: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'car_address',
    },
    importDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'import_date',
    },
    importBatch: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'import_batch',
    },
    importStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'import_status',
    },
    leadId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'lead_id',
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'is_deleted',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    tableName: 'c_lead_import',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['import_batch'] },
      { fields: ['customer_phone'] },
      { fields: ['import_status'] },
      { fields: ['customer_name', 'customer_phone'] },
      { fields: ['is_deleted'] },
    ],
  }
);

// 跟进记录表
const LeadFollowup = sequelize.define(
  'LeadFollowup',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    leadId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'lead_id',
    },
    followupContent: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'followup_content',
    },
    followupResult: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'followup_result',
    },
    followupTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'followup_time',
    },
    nextFollowupTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_followup_time',
    },
    operatorUserId: {
      type: DataTypes.STRING(15),
      allowNull: false,
      field: 'operator_user_id',
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'is_deleted',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    tableName: 'c_lead_followup',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['lead_id'] },
      { fields: ['operator_user_id'] },
      { fields: ['created_at'] },
      { fields: ['is_deleted'] },
    ],
  }
);

// 建立关联关系
Lead.belongsTo(User, { foreignKey: 'user_id', targetKey: 'userid', as: 'agent' });
Settlement.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Settlement.belongsTo(User, { foreignKey: 'user_id', targetKey: 'userid', as: 'operator' });
LeadFollowup.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
LeadFollowup.belongsTo(User, { foreignKey: 'operator_user_id', targetKey: 'userid', as: 'operator' });
Lead.hasMany(LeadFollowup, { foreignKey: 'lead_id', as: 'followups' });

// 区域表（省市区县三级）
const Region = sequelize.define(
  'Region',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    parentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
      field: 'parent_id',
    },
    regionCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'region_code',
    },
    regionName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'region_name',
    },
    regionLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      field: 'region_level',
    },
    fullName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'full_name',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    isDeleted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'is_deleted',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    tableName: 'c_region',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['parent_id'] },
      { fields: ['region_code'] },
      { fields: ['region_level'] },
      { fields: ['status'] },
      { fields: ['is_deleted'] },
    ],
  }
);

// 区域层级关系闭包表
const RegionClosure = sequelize.define(
  'RegionClosure',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    regionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'region_id',
    },
    ancestorId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'ancestor_id',
    },
    ancestorLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      field: 'ancestor_level',
    },
    descendantLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      field: 'descendant_level',
    },
    pathLength: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'path_length',
    },
    isDirect: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'is_direct',
    },
    isRootNode: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      field: 'is_root_node',
    },
    fullPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'full_path',
    },
  },
  {
    tableName: 'c_region_cl',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['region_id', 'ancestor_id'] },
      { fields: ['ancestor_level', 'region_id'] },
      { fields: ['ancestor_id', 'path_length', 'region_id'] },
      { fields: ['region_id', 'is_root_node'] },
      { fields: ['region_id', 'path_length'] },
    ],
  }
);

module.exports = {
  sequelize,
  User,
  Lead,
  Settlement,
  OperationLog,
  Dict,
  LeadImport,
  LeadFollowup,
  Region,
  RegionClosure,
};

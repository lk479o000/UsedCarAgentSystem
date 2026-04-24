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
    updatedAt: false,
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
    ],
  }
);

// 建立关联关系
Lead.belongsTo(User, { foreignKey: 'user_id', targetKey: 'userid', as: 'agent' });
Settlement.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Settlement.belongsTo(User, { foreignKey: 'user_id', targetKey: 'userid', as: 'operator' });

module.exports = {
  sequelize,
  User,
  Lead,
  Settlement,
  OperationLog,
  Dict,
  LeadImport,
};

# 二手车经纪人系统 - 后端API

## 环境要求
- Node.js v24.12.0+
- MySQL 8+

## 安装依赖
```bash
npm install
```

## 配置
1. 复制 `.env.example` 文件为 `.env`
2. 配置数据库连接信息
3. 配置微信小程序相关信息

## 密钥管理
密钥管理相关功能已移至项目根目录的 `keys` 目录，包括：
- 生成RSA密钥对
- 生成加密密码
- 解密用户密码

详细使用方法请查看 `keys/README.md` 文件。

## 数据库初始化
1. 执行 `sql/初始化表.sql` 创建数据库和表结构
2. 执行 `sql/初始化数据.sql` 插入初始数据

## 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API接口
- 基础路径: `/api/v1`
- 登录接口: `/api/v1/auth/login`
- 验证码接口: `/api/v1/auth/captcha`
- 线索管理: `/api/v1/lead/*`
- 结算管理: `/api/v1/settlement/*`
- 用户管理: `/api/v1/user/*`

## 注意事项
- 私钥文件 `private.pem` 必须妥善保管，避免泄露
- 公钥文件 `public.pem` 必须存在于项目根目录
- 不要将私钥文件提交到版本控制系统

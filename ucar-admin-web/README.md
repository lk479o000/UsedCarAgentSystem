# ucar-admin-web

二手车经纪人系统管理后台，基于Vue3 + UnoCSS开发，为管理员提供线索管理、结算管理和经纪人管理等功能。

## 技术栈

- Vue 3.4+
- Vue Router 4.2+
- Pinia 2.1+
- UnoCSS 0.25+
- Vite 5.0+
- Axios 1.6+

## 目录结构

```
ucar-admin-web/
├── public/            # 静态资源
├── src/
│   ├── api/           # API接口
│   ├── components/    # 组件
│   ├── router/        # 路由
│   ├── store/         # 状态管理
│   ├── utils/         # 工具函数
│   ├── views/         # 页面
│   ├── App.vue        # 根组件
│   └── main.js        # 入口文件
├── index.html         # HTML模板
├── package.json       # 依赖管理
├── vite.config.js     # Vite配置
└── README.md          # 本文件
```

## 安装

1. 安装依赖

```bash
npm install
```

1. 配置API地址
   修改 `src/utils/request.js` 中的 `baseURL`（如果需要）：

```javascript
const request = axios.create({
  baseURL: '/api/v1', // 开发环境通过Vite代理转发
  timeout: 10000,
})
```

## 运行

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 功能模块

### 登录页面

- 账号密码登录
- 验证码验证
- 错误提示

### 首页概览

- 总线索数
- 已成交数
- 已失败数
- 待结算金额
- 收益统计

### 线索管理

- 线索列表查询
- 新增线索
- 线索状态更新
- 线索删除
- 状态流转管理

### 结算管理

- 结算列表查询
- 新增结算
- 结算状态更新
- 推送结算提醒

### 经纪人管理

- 经纪人列表查询
- 新增经纪人
- 经纪人启用/禁用

## 路由配置

- `/login` - 登录页面
- `/` - 首页
- `/leads` - 线索管理
- `/settlements` - 结算管理
- `/users` - 经纪人管理

## 注意事项

1. 开发环境通过 Vite 代理转发 API 请求到 `http://localhost:8902`
2. 生产环境需要将构建后的文件部署到静态文件服务器
3. 确保后端服务已启动且 API 接口可访问
4. 浏览器兼容性：支持主流现代浏览器

## 开发规范

- 组件命名使用 PascalCase
- 路由命名使用 kebab-case
- 变量命名使用 camelCase
- 常量命名使用 UPPER\_SNAKE\_CASE
- 代码风格遵循 ESLint 规范


# 微信小程序 UI 开发规范

## 1. 技术栈

- **框架**: 微信原生小程序 (WXML + WXSS + JS)
- **样式体系**: `unocss-preset-weapp` (原子化样式预编译)
- **图标系统**: `@unocss/preset-icons` (Lucide 图标集)
- **动画库**: 内置 CSS 动效 + 微信原生 `animation` API

## 2. 项目结构

```
ucar-miniapp/
├── pages/              # 页面
│   ├── index/          # 首页
│   ├── leads/          # 线索页
│   ├── settlements/    # 结算页
│   ├── profile/        # 个人中心
│   └── bind-phone/     # 绑定手机号
├── utils/              # 工具函数
├── app.js              # 应用入口
├── app.json            # 全局配置
├── app.wxss            # 全局样式
├── uno.config.js       # UnoCSS 配置
├── unocss.wxss         # 生成的原子化样式 (由 npm run unocss 生成)
└── package.json        # 依赖配置
```

## 3. 核心依赖

```json
{
  "devDependencies": {
    "@iconify-json/lucide": "^1.2.103",
    "@unocss/preset-icons": "^66.6.8",
    "unocss": "^66.6.8",
    "unocss-preset-weapp": "^66.0.2"
  }
}
```

## 4. 样式开发规范

### 4.1 原子化样式使用

在 WXML 中直接使用 Tailwind 风格的原子类：

```xml
<view class="page p-4">
  <view class="grid grid-cols-2 gap-4">
    <view class="card-glass">...</view>
  </view>
</view>
```

**常用原子类**:
- 布局: `flex`, `grid`, `grid-cols-2`, `gap-4`, `justify-between`, `items-center`
- 间距: `p-4` (padding), `m-4` (margin), `mt-6` (margin-top)
- 文字: `text-lg`, `font-bold`, `text-primary`

### 4.2 自定义组件样式

在 `app.wxss` 中定义项目级自定义样式：

```css
/* 玻璃拟态卡片 */
.card-glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #0EA5E9, #38BDF8);
  color: #fff;
  border-radius: 12rpx;
  padding: 16rpx 32rpx;
  box-shadow: 0 4rpx 8rpx rgba(14, 165, 233, 0.3);
}

/* 标签样式 */
.tag-primary {
  background: rgba(14, 165, 233, 0.1);
  color: #0369A1;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 16rpx;
}
```

### 4.3 视觉规范

| 类型 | 颜色值 | 用途 |
|------|---------|------|
| 主色 | #0EA5E9 | 按钮、图标、高亮文字 |
| 辅色 | #22D3EE | 霓虹点缀、边框发光 |
| 成功 | #14B8A6 | 成交状态 |
| 警告 | #F59E0B | 待结算状态 |
| 错误 | #EF4444 | 失败状态 |
| 背景 | #F1F5F9 | 页面背景 |
| 卡片 | rgba(255,255,255,0.85) | 玻璃拟态背景 |

## 5. 图标使用规范

### 5.1 Lucide 图标

使用 `@unocss/preset-icons` 提供的 Lucide 图标：

```xml
<!-- 基础用法 -->
<view class="i-lucide-list"></view>

<!-- 带颜色 -->
<view class="i-lucide-user text-primary"></view>

<!-- 调整大小 -->
<view class="i-lucide-wallet text-2xl"></view>
```

### 5.2 可用图标列表

| 图标类名 | 用途 |
|-----------|------|
| `i-lucide-list` | 列表/线索 |
| `i-lucide-wallet` | 钱包/结算 |
| `i-lucide-user` | 用户/个人中心 |
| `i-lucide-log-out` | 退出登录 |
| `i-lucide-refresh-cw` | 刷新 |
| `i-lucide-shield` | 角色/权限 |
| `i-lucide-activity` | 状态 |
| `i-lucide-smartphone` | 手机/绑定 |
| `i-lucide-check` | 确认/勾选 |
| `i-lucide-bell` | 通知/提醒 |
| `i-lucide-lock` | 密码/安全 |

## 6. 构建流程

### 6.1 安装依赖

```bash
cd ucar-miniapp
npm install
```

### 6.2 编译样式

```bash
npm run unocss
```

此命令会：
1. 扫描所有 `.wxml` 文件中的类名
2. 生成 `unocss.wxss` 文件
3. 包含原子化样式和图标样式

### 6.3 开发工作流

1. 在 WXML 中添加/修改原子类或图标类
2. 运行 `npm run unocss` 重新生成样式
3. 在微信开发者工具中预览效果

## 7. 新增页面/功能开发步骤

### 7.1 创建页面文件

```
pages/new-page/
├── new-page.js
├── new-page.json
├── new-page.wxml
└── new-page.wxss
```

### 7.2 WXML 模板规范

```xml
<view class="page p-4">
  <!-- 使用 card-glass 玻璃拟态卡片 -->
  <view class="card-glass p-4 mb-4">
    <view class="flex justify-between items-center">
      <text class="font-semibold text-text-primary">标题</text>
      <text class="tag-primary">状态</text>
    </view>
    <text class="text-text-secondary mt-2">描述内容</text>
  </view>

  <!-- 使用 Lucide 图标 -->
  <button class="btn-primary i-lucide-check">确认</button>
</view>
```

### 7.3 WXSS 页面样式

```css
page {
  background: #F1F5F9;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.page {
  padding: 24rpx;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 7.4 注册页面

在 `app.json` 中添加页面路径：

```json
{
  "pages": [
    "pages/index/index",
    "pages/leads/leads",
    "pages/settlements/settlements",
    "pages/profile/profile",
    "pages/new-page/new-page"
  ]
}
```

### 7.5 重新编译样式

```bash
npm run unocss
```

## 8. 交互与动效规范

- **按钮点击**: 缩放至 0.96x + 阴影增强
- **页面切换**: 淡入淡出 + 滑动过渡
- **卡片悬停**: 阴影增强 + 光晕扩散
- **加载状态**: 骨架屏 + 渐变进度条

## 9. 注意事项

1. **必须运行 `npm run unocss`**: 新增或修改原子类后，必须重新编译才能生效
2. **图标颜色**: Lucide 图标通过 `color` 属性控制颜色，支持继承父元素颜色
3. **单位使用**: 小程序中使用 `rpx` 作为响应式单位
4. **样式隔离**: 页面级样式写在 `.wxss` 中，全局样式写在 `app.wxss` 中
5. **玻璃拟态兼容性**: `backdrop-filter` 在部分旧版本基础库中不支持，需做好降级处理

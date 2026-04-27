#!/bin/bash

# 启动隧道模式服务脚本
echo "=== 启动隧道模式服务 ==="

# 1. 启动docker服务（包含nginx）
echo "1. 启动Docker服务（nginx）..."
docker compose up -d

# 2. 检查服务状态
echo "2. 检查服务状态..."
docker compose ps

# 3. 提示用户启动前端开发服务器
echo "\n3. 请在另一个终端中启动前端开发服务器："
echo "   cd ../ucar-admin-web && npm run dev"

# 4. 提示用户启动后端API服务
echo "\n4. 请在另一个终端中启动后端API服务："
echo "   cd ../ucar-api && npm run dev"

# 5. 提示用户使用ngrok创建隧道
echo "\n5. 使用ngrok创建隧道（替换YOUR_NGROK_AUTH_TOKEN为你的认证令牌）："
echo "   ngrok http 8903"

# 6. 显示访问信息
echo "\n=== 服务启动完成 ==="
echo "本地访问地址: http://localhost:8900"
echo "Nginx代理地址: http://localhost:8903"
echo "使用ngrok创建隧道后，通过ngrok提供的URL访问外网"

# 隧道模式运行指南

## 功能说明
- 使用nginx反向代理，将根路径代理到PC前端开发服务器（8900端口）
- 将/api/路径代理到后端API服务（8902端口）
- 支持通过ngrok创建隧道，实现外网访问

## 环境要求
- Docker
- Docker Compose
- Node.js (用于运行前端和后端服务)
- ngrok (用于创建外网隧道)

## 运行步骤

### 隧道模式（外网访问）
1. **进入docker目录**
   ```bash
   cd docker
   ```

2. **启动隧道服务**
   ```bash
   ./start-tunnel.sh
   ```

3. **启动前端开发服务器**（在另一个终端）
   ```bash
   cd ../ucar-admin-web && npm run dev
   ```

4. **启动后端API服务**（在另一个终端）
   ```bash
   cd ../ucar-api && npm run dev
   ```

5. **创建ngrok隧道**
   ```bash
   ngrok http 8903
   ```

6. **访问方式**
   - 本地访问：http://localhost:8900
   - Nginx代理访问：http://localhost:8903
   - 外网访问：通过ngrok提供的URL

### 本地开发模式（不需要隧道）
1. **启动后端服务**
   ```bash
   cd ucar-api && npm run dev
   ```

2. **启动前端开发服务器**
   ```bash
   cd ucar-admin-web && npm run dev
   ```

3. **访问本地地址**
   ```
   http://localhost:8900
   ```

## 停止服务
```bash
# 停止nginx容器
docker compose down

# 停止前端和后端服务
# 在各自的终端中按 Ctrl+C
```

## 查看服务状态
```bash
# 查看nginx容器状态
docker compose ps

# 查看前端和后端服务状态
# 在各自的终端中查看
```

## 注意事项
- 确保前端开发服务器和后端API服务都已启动
- 确保端口8900、8902和8903没有被占用
- 使用ngrok创建隧道时，需要先安装ngrok并获取认证令牌
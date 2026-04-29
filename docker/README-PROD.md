# 生产最简部署（阿里云 ECS / 单机 / Docker Compose）

目标：

- **单域名**：`https://你的域名/`（PC 管理端）
- **单域名 API**：`https://你的域名/api/` → 反代到 `ucar-api`
- **单机 MySQL**：容器内运行，数据持久化到 `docker/data/mysql`
- **MySQL 本地连接**：通过 SSH 隧道连 `127.0.0.1:13306`（不暴露公网，避免你本地 3306 冲突）

---

## 1. 服务器准备

- 系统：建议 Ubuntu 22.04 / 24.04
- 安装 Docker + Compose 插件（按阿里云官方文档）
- ECS 安全组入方向放行：
  - 80（HTTP）
  - 443（HTTPS）
  - 22（SSH，建议限制你自己的公网 IP）

> 不要放行 3306/8902 到公网。

---

## 2. 准备目录（在仓库 `docker/` 下操作）

```bash
cd docker
cp .env.prod.example .env.prod
sudo mkdir -p /data/ucar/{www,certs,backup,logs/nginx,logs/api,mysql,mysql-init,mysql-conf}
sudo chown -R $USER:$USER /data/ucar
```

- `/data/ucar/www/`：放 PC 管理端构建产物（`ucar-admin-web/dist` 的内容）
- `/data/ucar/certs/`：放 HTTPS 证书文件：
  - `/data/ucar/certs/www.sjmcpitt.com.pem`
  - `/data/ucar/certs/www.sjmcpitt.com.key`
- `/data/ucar/mysql/`：MySQL 数据持久化目录
- `/data/ucar/mysql-init/`：初始化 SQL（可选，首次启动时自动执行）
- `/data/ucar/mysql-conf/`：MySQL 配置目录（2G 生存版会用到）
- `/data/ucar/backup/`：备份文件输出目录

---

## 3. 构建 PC 管理端并上传到服务器

在本地或服务器构建均可（推荐本地构建后上传）：

```bash
cd ucar-admin-web
npm install
npm run build
```

把 `ucar-admin-web/dist/` 里的所有文件同步到服务器仓库的 `docker/www/` 下。

> 注意：生产 compose 使用的是 `/data/ucar/www/`。你可以把 dist 同步到 `/data/ucar/www/`。

### 环境变量加载说明

前端使用 Vite 构建工具，会根据命令自动选择环境配置：

| 命令 | 默认模式 | 加载的环境文件 |
|------|----------|---------------|
| `npm run dev` | development | `.env.development` |
| `npm run local` | development | `.env.development`（显式指定） |
| `npm run build` | **production** | **`.env.production`** |

**原理**：`vite build` 命令默认使用 `production` 模式，会自动加载 `.env.production` 文件中的配置。项目已预设：
- `.env.development`：`VITE_SHOW_CAPTCHA=true`（开发环境启用验证码）
- `.env.production`：`VITE_SHOW_CAPTCHA=true`（生产环境启用验证码）

如需自定义环境变量，请编辑对应模式的 `.env.*` 文件，变量名需以 `VITE_` 前缀开头才能在代码中通过 `import.meta.env.VITE_*` 访问。

---

## 4. 配置环境变量（后端 + 数据库）

编辑 `docker/.env.prod`，至少改这些：

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `JWT_SECRET`

微信相关可先留空，后续再补：

- `WX_APPID`
- `WX_SECRET`

---

## 5. 启动生产服务

```bash
cd docker
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

### 99/年 2C2G “生存版”（推荐用于低配机）

2G 单机（MySQL+API+Nginx 同机）更建议用带限额/限流的配置：

```bash
cd docker
docker compose -f docker-compose.prod.2g.yml --env-file .env.prod up -d
docker compose -f docker-compose.prod.2g.yml --env-file .env.prod ps
```

说明：

- MySQL 会读取 `/data/ucar/mysql-conf/ucar.cnf`（小内存配置）
- Nginx 使用 `docker/nginx.prod.2g.conf`（API 限流 + 连接数限制）
- 该配置默认域名：`sjmcpitt.com`、`www.sjmcpitt.com`（见 `nginx.prod.2g.conf` 的 `server_name`）

### 还没域名/证书，先用 IP 跑通（HTTP-only）

如果你暂时没有证书（`/data/ucar/certs/www.sjmcpitt.com.pem`、`www.sjmcpitt.com.key`），请先用 HTTP-only 版本：

```bash
cd docker
docker compose -f docker-compose.prod.2g.http.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.2g.http.yml --env-file .env.prod ps
```

访问：

- PC：`http://你的服务器IP/`
- API：`http://你的服务器IP/api/v1/...`

等你后面有域名+证书，再切回 `docker-compose.prod.2g.yml`（HTTPS 版本）。

访问：

- PC：`https://你的域名/`
- API：`https://你的域名/api/v1/...`

---

## 5.1 HTTPS 上线（sjmcpitt.com / [www.sjmcpitt.com）](http://www.sjmcpitt.com）)

### A. 先把域名解析到服务器

在 DNS 里添加 A 记录（示例）：

- `sjmcpitt.com` → `8.137.89.78`
- `www.sjmcpitt.com` → `8.137.89.78`

### B. 准备证书文件（Nginx 读取固定路径）

把你购买/申请到的证书文件放到服务器：

- `/data/ucar/certs/www.sjmcpitt.com.pem`
- `/data/ucar/certs/www.sjmcpitt.com.key`

> 如果你的证书下载下来是 `*.crt` + `*.key`，通常：
>
> - `www.sjmcpitt.com.pem` 用 “证书链（含中间证书）” 对应内容
> - `www.sjmcpitt.com.key` 用私钥内容

校验（可选）：

```bash
sudo ls -l /data/ucar/certs
sudo openssl x509 -in /data/ucar/certs/www.sjmcpitt.com.pem -noout -subject -issuer -dates
```

### C. 从 HTTP 版本切到 HTTPS 版本（2G 生存版）

如果你当前跑的是 HTTP-only：

```bash
cd docker
docker compose -f docker-compose.prod.2g.http.yml --env-file .env.prod down
docker compose -f docker-compose.prod.2g.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.2g.yml --env-file .env.prod ps
```

验证：

- `http://sjmcpitt.com` 应该 301 到 `https://sjmcpitt.com`
- `https://sjmcpitt.com/`
- `https://sjmcpitt.com/api/health`（如果你有 health 接口的话；否则随便访问一个实际存在的 API）

---

## 6. 小程序端配置

按你的文档 `doc/7. deploy.md`：

- 微信公众平台配置 request 合法域名：`https://你的域名`
- 小程序 `baseUrl`：`https://你的域名`

---

## 7. MySQL 如何“方便连接”（推荐方式：SSH 隧道）

在你电脑上执行：

```bash
cd docker/scripts
SSH_KEY=/path/to/your.pem ./ssh-tunnel-mysql.sh root@你的服务器公网IP 13306
```

```bash
cd docker/scripts
SSH_KEY=/Users/cole/Downloads/二手车经纪人管理系统/key/ucar.pem ./ssh-tunnel-mysql.sh root@8.137.89.78 13306
```

然后用 Navicat / DataGrip 连接：

- Host：`127.0.0.1`
- Port：`13306`
- User：`MYSQL_USER`（见 `.env.prod`）
- Password：`MYSQL_PASSWORD`
- Database：`MYSQL_DATABASE`

说明：

- `SSH_KEY` 指向你从云厂商下载的 `.pem` 私钥文件（macOS/Linux 记得先 `chmod 600 your.pem`）
- 这个命令会在当前终端保持连接；如果你断网/重启电脑/重启服务器，需要重新执行一次

---

## 8. 备份与恢复

### 备份

```bash
cd docker/scripts
./backup-mysql.sh
```

备份输出：`/data/ucar/backup/*.sql.gz`（默认保留 14 天）

> 现在默认输出到 `/data/ucar/backup/*.sql.gz`（可通过环境变量 `DATA_DIR` 修改）。

### 恢复

```bash
cd docker/scripts
./restore-mysql.sh ../data/backup/<你的备份文件>.sql.gz
```

---

## 10. 发布备份与还原（前后端服务）

你说的“服务备份”建议用**发布快照**来做：备份后端代码+部署文件，以及 PC 前端构建产物（`/data/ucar/www`）。

### 发布前备份（推荐每次部署前执行一次）

```bash
cd docker/scripts
./backup-release.sh
```

输出目录：`/data/ucar/releases/`（默认保留最近 10 份）

### 出问题还原

```bash
cd docker/scripts
ls -lt /data/ucar/releases | head
./restore-release.sh /data/ucar/releases/ucar-app-YYYYmmdd-HHMMSS.tar.gz /data/ucar/releases/ucar-www-YYYYmmdd-HHMMSS.tar.gz
cd /root/ucar/docker
docker compose -f docker-compose.prod.2g.yml --env-file .env.prod up -d --build
```

---

## 11. 本地打包并上传部署（推荐流程）

你反馈得对：如果打包目录层级不对，服务器解压后就得再 `mv`。下面这套命令的目标是：

- `ucar-api.tar.gz` 解压后直接得到 `/root/ucar/ucar-api`
- `ucar-www.tar.gz` 解压后直接得到 `/data/ucar/www`
- 不需要额外移动目录

### A. 在本地仓库根目录打包

```bash
cd /path/to/UsedCarAgentSystem

# 1) 后端包（包含 ucar-api + sql + README.md）
tar -czf ucar-api.tar.gz \
  --exclude='.git' \
  --exclude='**/node_modules' \
  ucar-api sql README.md

# 2) 前端构建并打包为 www 目录（注意这里必须是两行命令，不要写成 ucar-admin-webnpm），
cd ucar-admin-web
npm run build
cd ..
tar -czf ucar-www.tar.gz -C ucar-admin-web dist
```

> 说明：打包后文件就在你当前目录，阿里云控制台“上传文件”时直接选这两个文件即可。

### B. 上传到服务器（示例 [root@8.137.89.78](mailto:root@8.137.89.78)）

```bash
scp ucar-api.tar.gz ucar-www.tar.gz root@8.137.89.78:/root/
```

### C. 在服务器解压到目标目录（不需要额外 mv）

```bash
ssh root@8.137.89.78

# 确保目标目录存在
mkdir -p /root/ucar /data/ucar/www

# 1) 解后端包：得到 /root/ucar/ucar-api、/root/ucar/sql、/root/ucar/README.md
tar -xzf /root/ucar-api.tar.gz -C /root/ucar

# 2) 解前端包：直接把 dist 内容发布到 /data/ucar/www（不需要临时目录）
rm -rf /data/ucar/www/*
tar -xzf /root/ucar-www.tar.gz -C /data/ucar/www --strip-components=1 dist
```

### D. 重启服务（在服务器）

```bash
cd /root/ucar/docker
docker compose -f docker-compose.prod.2g.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.2g.yml --env-file .env.prod ps
```

### E. 快速校验（在服务器）

```bash
ls -la /root/ucar/ucar-api
ls -la /data/ucar/www
```

如需进一步简化为“一键脚本（本地打包+上传+远端发布）”，可以把上面 A~D 做成 `docker/scripts/deploy-release.sh`，后续每次发布只执行一条命令。

---

## 9. 定时备份（cron 示例）

在服务器上（示例：每天凌晨 2 点）：

```bash
crontab -e
```

加入：

```cron
0 2 * * * cd /path/to/UsedCarAgentSystem/docker && ./scripts/backup-mysql.sh >> ./logs/backup.log 2>&1
```


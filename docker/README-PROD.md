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
  - `/data/ucar/certs/fullchain.pem`
  - `/data/ucar/certs/privkey.pem`
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

访问：
- PC：`https://你的域名/`
- API：`https://你的域名/api/v1/...`

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
./ssh-tunnel-mysql.sh root@你的服务器公网IP 13306
```

然后用 Navicat / DataGrip 连接：
- Host：`127.0.0.1`
- Port：`13306`
- User：`MYSQL_USER`（见 `.env.prod`）
- Password：`MYSQL_PASSWORD`
- Database：`MYSQL_DATABASE`

---

## 8. 备份与恢复

### 备份
```bash
cd docker/scripts
./backup-mysql.sh
```

备份输出：`docker/data/backup/*.sql.gz`（默认保留 14 天）

> 现在默认输出到 `/data/ucar/backup/*.sql.gz`（可通过环境变量 `DATA_DIR` 修改）。

### 恢复
```bash
cd docker/scripts
./restore-mysql.sh ../data/backup/<你的备份文件>.sql.gz
```

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


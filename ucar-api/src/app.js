const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { sequelize } = require('./models');

const app = express();

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(apiLimiter);

// 路由
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/lead', require('./routes/lead'));
app.use('/api/v1/settlement', require('./routes/settlement'));
app.use('/api/v1/user', require('./routes/user'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ code: 3, message: '接口不存在', data: null });
});

// 错误处理
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ code: 4, message: '系统错误', data: null });
});

const PORT = process.env.PORT || 8902;

// 数据库连接并启动服务
sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connected successfully.');
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('Unable to connect to database:', err);
  });

module.exports = app;

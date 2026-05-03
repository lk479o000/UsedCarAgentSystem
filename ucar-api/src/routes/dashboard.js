const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboardService');
const { success, error } = require('../utils/response');
const { authMiddleware } = require('../middleware/auth');

router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const result = await dashboardService.getOverview(req.user.userid);
    success(res, result);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const range = req.query.range || 30;
    const result = await dashboardService.getAnalytics(req.user.userid, range);
    success(res, result);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

module.exports = router;

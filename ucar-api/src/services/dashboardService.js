const NodeCache = require('node-cache');
const { sequelize } = require('../models');
const { LEAD_STATUS, SETTLEMENT_STATUS, USER_ROLE } = require('../utils/constants');
const { QueryTypes } = require('sequelize');
const logger = require('../utils/logger');

const statsCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const STATUS_LABELS = {
  [LEAD_STATUS.PENDING]: '待跟进',
  [LEAD_STATUS.FOLLOWING]: '跟进中',
  [LEAD_STATUS.VIEWED]: '已看车',
  [LEAD_STATUS.QUOTED]: '已报价',
  [LEAD_STATUS.DEAL]: '已成交',
  [LEAD_STATUS.FAILED]: '已失败',
};

const FUNNEL_STAGES = [
  LEAD_STATUS.PENDING,
  LEAD_STATUS.FOLLOWING,
  LEAD_STATUS.VIEWED,
  LEAD_STATUS.QUOTED,
  LEAD_STATUS.DEAL,
];

async function getCached(key, queryFn) {
  const cached = statsCache.get(key);
  if (cached) return cached;
  const data = await queryFn();
  statsCache.set(key, data);
  return data;
}

function getDateRange(range) {
  const days = Math.min(Math.max(parseInt(range) || 30, 7), 90);
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  return { startDate, endDate, days };
}

function leadWhereSql(isAdmin, userId, alias = 'l') {
  const conds = [`${alias}.is_deleted = 0`];
  if (!isAdmin) {
    conds.push(`${alias}.user_id = :userId`);
  }
  return conds.join(' AND ');
}

const getOverview = async (userId) => {
  return getCached(`overview:${userId}`, async () => {
    const [users] = await sequelize.query(
      'SELECT role FROM c_user WHERE userid = :userId AND is_deleted = 0',
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const isAdmin = users && users.role === USER_ROLE.ADMIN;

    const leadCond = leadWhereSql(isAdmin, userId);
    const params = { userId };

    const [statsRows] = await sequelize.query(
      `SELECT
        (SELECT COUNT(*) FROM c_lead l WHERE ${leadCond}) AS totalLeads,
        (SELECT COUNT(*) FROM c_lead l WHERE ${leadCond} AND l.status = ${LEAD_STATUS.DEAL}) AS totalSuccess,
        (SELECT COUNT(*) FROM c_lead l WHERE ${leadCond} AND l.status = ${LEAD_STATUS.FAILED}) AS totalFail,
        (SELECT COALESCE(SUM(s.agent_share), 0) FROM c_settlement s
          INNER JOIN c_lead l ON l.id = s.lead_id AND ${leadWhereSql(isAdmin, userId, 'l')}
          WHERE s.status = ${SETTLEMENT_STATUS.PENDING} AND s.is_deleted = 0) AS pendingAmount,
        (SELECT COALESCE(SUM(s.agent_share), 0) FROM c_settlement s
          INNER JOIN c_lead l ON l.id = s.lead_id AND ${leadWhereSql(isAdmin, userId, 'l')}
          WHERE s.status = ${SETTLEMENT_STATUS.SETTLED} AND s.is_deleted = 0) AS settledAmount`,
      { replacements: params, type: QueryTypes.SELECT }
    );

    const { startDate } = getDateRange(30);
    const trendRows = await sequelize.query(
      `SELECT DATE(l.created_at) AS date, COUNT(*) AS count
       FROM c_lead l
       WHERE ${leadCond} AND l.created_at >= :startDate
       GROUP BY DATE(l.created_at)
       ORDER BY date ASC`,
      { replacements: { ...params, startDate }, type: QueryTypes.SELECT }
    );

    const statusRows = await sequelize.query(
      `SELECT l.status, COUNT(*) AS count
       FROM c_lead l
       WHERE ${leadCond}
       GROUP BY l.status`,
      { replacements: params, type: QueryTypes.SELECT }
    );

    const statusMap = {};
    statusRows.forEach((r) => {
      statusMap[r.status] = parseInt(r.count);
    });

    return {
      stats: {
        totalLeads: parseInt(statsRows.totalLeads) || 0,
        totalSuccess: parseInt(statsRows.totalSuccess) || 0,
        totalFail: parseInt(statsRows.totalFail) || 0,
        pendingAmount: parseInt(statsRows.pendingAmount) || 0,
        settledAmount: parseInt(statsRows.settledAmount) || 0,
      },
      leadTrend: {
        dates: trendRows.map((r) => r.date),
        counts: trendRows.map((r) => parseInt(r.count)),
      },
      statusDistribution: {
        labels: FUNNEL_STAGES.map((s) => STATUS_LABELS[s]).concat([STATUS_LABELS[LEAD_STATUS.FAILED]]),
        values: FUNNEL_STAGES.map((s) => statusMap[s] || 0).concat([statusMap[LEAD_STATUS.FAILED] || 0]),
      },
      isAdmin,
    };
  });
};

const getAnalytics = async (userId, range) => {
  const cacheKey = `analytics:${userId}:${range}`;
  return getCached(cacheKey, async () => {
    const [users] = await sequelize.query(
      'SELECT role FROM c_user WHERE userid = :userId AND is_deleted = 0',
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    const isAdmin = users && users.role === USER_ROLE.ADMIN;

    const { startDate } = getDateRange(range);
    const leadCond = leadWhereSql(isAdmin, userId);
    const rangeCond = `${leadCond} AND l.created_at >= :startDate`;
    const params = { userId, startDate };

    const [trendRows, statusRows, dealTrendRows, funnelRows] = await Promise.all([
      sequelize.query(
        `SELECT DATE(l.created_at) AS date, COUNT(*) AS count
         FROM c_lead l WHERE ${rangeCond}
         GROUP BY DATE(l.created_at) ORDER BY date ASC`,
        { replacements: params, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT l.status, COUNT(*) AS count FROM c_lead l WHERE ${leadCond} GROUP BY l.status`,
        { replacements: params, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT DATE(l.updated_at) AS date, COALESCE(SUM(l.car_actual_price), 0) AS amount
         FROM c_lead l WHERE ${rangeCond} AND l.status = ${LEAD_STATUS.DEAL}
         GROUP BY DATE(l.updated_at) ORDER BY date ASC`,
        { replacements: params, type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT l.status, COUNT(*) AS count FROM c_lead l WHERE ${rangeCond} GROUP BY l.status`,
        { replacements: params, type: QueryTypes.SELECT }
      ),
    ]);

    const statusMap = {};
    statusRows.forEach((r) => {
      statusMap[r.status] = parseInt(r.count);
    });

    const funnelMap = {};
    funnelRows.forEach((r) => {
      funnelMap[r.status] = parseInt(r.count);
    });

    const result = {
      leadTrend: {
        dates: trendRows.map((r) => r.date),
        counts: trendRows.map((r) => parseInt(r.count)),
      },
      statusDistribution: {
        labels: FUNNEL_STAGES.map((s) => STATUS_LABELS[s]).concat([STATUS_LABELS[LEAD_STATUS.FAILED]]),
        values: FUNNEL_STAGES.map((s) => statusMap[s] || 0).concat([statusMap[LEAD_STATUS.FAILED] || 0]),
      },
      dealTrend: {
        dates: dealTrendRows.map((r) => r.date),
        amounts: dealTrendRows.map((r) => parseInt(r.amount) || 0),
      },
      conversionFunnel: {
        stages: FUNNEL_STAGES.map((s) => STATUS_LABELS[s]),
        values: FUNNEL_STAGES.map((s) => funnelMap[s] || 0),
      },
      isAdmin,
    };

    if (isAdmin) {
      const [agentRankingRows, failReasonRows, regionRows, settlementRows] = await Promise.all([
        sequelize.query(
          `SELECT l.user_id, u.username, COUNT(*) AS count, COALESCE(SUM(l.car_actual_price), 0) AS amount
           FROM c_lead l
           INNER JOIN c_user u ON u.userid = l.user_id AND u.is_deleted = 0
           WHERE ${rangeCond} AND l.status = ${LEAD_STATUS.DEAL}
           GROUP BY l.user_id, u.username
           ORDER BY count DESC LIMIT 10`,
          { replacements: params, type: QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT l.fail_reason, COUNT(*) AS count
           FROM c_lead l
           WHERE ${rangeCond} AND l.status = ${LEAD_STATUS.FAILED} AND l.fail_reason IS NOT NULL
           GROUP BY l.fail_reason
           ORDER BY count DESC LIMIT 5`,
          { replacements: params, type: QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT l.city_id, COUNT(*) AS count
           FROM c_lead l
           WHERE ${rangeCond} AND l.city_id IS NOT NULL
           GROUP BY l.city_id
           ORDER BY count DESC LIMIT 10`,
          { replacements: params, type: QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT
            SUM(CASE WHEN s.status = 0 THEN 1 ELSE 0 END) AS pendingCount,
            COALESCE(SUM(CASE WHEN s.status = 0 THEN s.profit ELSE 0 END), 0) AS pendingProfit,
            COALESCE(SUM(CASE WHEN s.status = 0 THEN s.agent_share ELSE 0 END), 0) AS pendingAgentShare,
            SUM(CASE WHEN s.status = 1 THEN 1 ELSE 0 END) AS settledCount,
            COALESCE(SUM(CASE WHEN s.status = 1 THEN s.profit ELSE 0 END), 0) AS settledProfit,
            COALESCE(SUM(CASE WHEN s.status = 1 THEN s.agent_share ELSE 0 END), 0) AS settledAgentShare
           FROM c_settlement s WHERE s.is_deleted = 0`,
          { replacements: params, type: QueryTypes.SELECT }
        ),
      ]);

      const cityIds = regionRows.map((r) => r.city_id).filter(Boolean);
      let regionMap = {};
      if (cityIds.length > 0) {
        const regionData = await sequelize.query(
          'SELECT id, region_name FROM c_region WHERE id IN (:cityIds)',
          { replacements: { cityIds }, type: QueryTypes.SELECT }
        );
        regionData.forEach((r) => {
          regionMap[r.id] = r.region_name;
        });
      }

      result.agentRanking = {
        names: agentRankingRows.map((r) => r.username || r.user_id),
        counts: agentRankingRows.map((r) => parseInt(r.count)),
        amounts: agentRankingRows.map((r) => parseInt(r.amount) || 0),
      };
      result.failReasons = {
        reasons: failReasonRows.map((r) => r.fail_reason || '未填写'),
        counts: failReasonRows.map((r) => parseInt(r.count)),
      };
      result.regionDistribution = {
        names: regionRows.map((r) => regionMap[r.city_id] || '未知'),
        counts: regionRows.map((r) => parseInt(r.count)),
      };
      result.settlementOverview = {
        pending: {
          count: parseInt(settlementRows[0]?.pendingCount) || 0,
          profit: parseInt(settlementRows[0]?.pendingProfit) || 0,
          agentShare: parseInt(settlementRows[0]?.pendingAgentShare) || 0,
        },
        settled: {
          count: parseInt(settlementRows[0]?.settledCount) || 0,
          profit: parseInt(settlementRows[0]?.settledProfit) || 0,
          agentShare: parseInt(settlementRows[0]?.settledAgentShare) || 0,
        },
      };
    }

    return result;
  });
};

module.exports = {
  getOverview,
  getAnalytics,
};

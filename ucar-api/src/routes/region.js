const express = require('express');
const router = express.Router();
const regionService = require('../services/regionService');
const { success, error } = require('../utils/response');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

/**
 * 查询所有省份（仅启用，用于下拉选择）
 * GET /api/v1/region/provinces
 */
router.get('/provinces', authMiddleware, async (req, res) => {
  try {
    const result = await regionService.getAllProvinces();
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 查询所有省份（所有状态，用于管理页面）
 * GET /api/v1/region/provinces/all
 */
router.get('/provinces/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await regionService.getAllProvincesForManagement();
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 根据省份ID查询城市列表（仅启用，用于下拉选择）
 * GET /api/v1/region/cities/:provinceId
 */
router.get('/cities/:provinceId', authMiddleware, async (req, res) => {
  try {
    const result = await regionService.getCitiesByProvinceId(req.params.provinceId);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 根据省份ID查询城市列表（所有状态，用于管理页面）
 * GET /api/v1/region/cities/:provinceId/all
 */
router.get('/cities/:provinceId/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await regionService.getAllCitiesByProvinceId(req.params.provinceId);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 根据城市ID查询区县列表（仅启用，用于下拉选择）
 * GET /api/v1/region/districts/:cityId
 */
router.get('/districts/:cityId', authMiddleware, async (req, res) => {
  try {
    const result = await regionService.getDistrictsByCityId(req.params.cityId);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 根据城市ID查询区县列表（所有状态，用于管理页面）
 * GET /api/v1/region/districts/:cityId/all
 */
router.get('/districts/:cityId/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await regionService.getAllDistrictsByCityId(req.params.cityId);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 获取区域树形结构
 * GET /api/v1/region/tree
 */
router.get('/tree', authMiddleware, async (req, res) => {
  try {
    const result = await regionService.getRegionTree();
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 根据区域名称模糊搜索（仅启用，用于下拉选择）
 * GET /api/v1/region/search
 */
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { regionName } = req.query;
    if (!regionName) {
      return error(res, '区域名称不能为空', 1);
    }
    const result = await regionService.searchRegionsByName(regionName);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 根据区域名称模糊搜索（所有状态，用于管理页面）
 * GET /api/v1/region/search/all
 */
router.get('/search/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { regionName, regionLevel } = req.query;
    const result = await regionService.searchRegionsByClosureTable(regionName, regionLevel ? parseInt(regionLevel) : null);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 根据ID查询区域
 * GET /api/v1/region/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await regionService.getRegionById(req.params.id);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 获取下一个sort_order值
 * GET /api/v1/region/next-sort-order
 */
router.get('/next-sort-order', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const parentId = req.query.parentId ? parseInt(req.query.parentId) : 0;
    const result = await regionService.getNextSortOrder(parentId);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 创建区域
 * POST /api/v1/region
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await regionService.createRegion(req.body);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data, result.message);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 更新区域
 * PUT /api/v1/region/:id
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await regionService.updateRegion(req.params.id, req.body);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, null, result.message);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 删除区域
 * DELETE /api/v1/region/:id
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await regionService.deleteRegion(req.params.id);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, null, result.message);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 批量更新区域状态
 * PUT /api/v1/region/batch/status
 */
router.put('/batch/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return error(res, 'ID列表不能为空', 1);
    }
    if (status === undefined || status === null) {
      return error(res, '状态不能为空', 1);
    }
    const result = await regionService.batchUpdateStatus(ids, status);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, null, result.message);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 重构区域闭包表
 * POST /api/v1/region/closure/rebuild
 */
router.post('/closure/rebuild', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await regionService.rebuildRegionClosureTable();
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, null, result.message);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 查询区域根节点
 * GET /api/v1/region/:regionId/closure/root
 */
router.get('/:regionId/closure/root', authMiddleware, async (req, res) => {
  try {
    const result = await regionService.getRegionRootId(req.params.regionId);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 查询区域直接子节点（闭包表）
 * GET /api/v1/region/:ancestorId/closure/direct-children
 */
router.get('/:ancestorId/closure/direct-children', authMiddleware, async (req, res) => {
  try {
    const result = await regionService.getRegionDirectChildren(req.params.ancestorId);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 查询区域全部后代（闭包表）
 * GET /api/v1/region/:ancestorId/closure/descendants
 */
router.get('/:ancestorId/closure/descendants', authMiddleware, async (req, res) => {
  try {
    const result = await regionService.getRegionAllDescendants(req.params.ancestorId);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 查询区域直接父节点（闭包表）
 * GET /api/v1/region/:regionId/closure/direct-parent
 */
router.get('/:regionId/closure/direct-parent', authMiddleware, async (req, res) => {
  try {
    const result = await regionService.getRegionDirectParent(req.params.regionId);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

/**
 * 查询区域全部祖先（闭包表）
 * GET /api/v1/region/:regionId/closure/ancestors
 */
router.get('/:regionId/closure/ancestors', authMiddleware, async (req, res) => {
  try {
    const result = await regionService.getRegionAllAncestors(req.params.regionId);
    if (result.code !== 0) {
      return error(res, result.message, result.code);
    }
    success(res, result.data);
  } catch (err) {
    error(res, err.message, 4, 500);
  }
});

module.exports = router;
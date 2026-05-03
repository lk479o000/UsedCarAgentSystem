const { Region, RegionClosure, sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const { snakeToCamel } = require('../utils/formatters');

const regionService = {
  async getAllProvinces() {
    const provinces = await Region.findAll({
      where: {
        parentId: 0,
        status: 1,
        isDeleted: 0,
      },
      order: [
        ['sortOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return { code: 0, data: snakeToCamel(provinces) };
  },

  async getAllProvincesForManagement() {
    const provinces = await Region.findAll({
      where: {
        parentId: 0,
        isDeleted: 0,
      },
      order: [
        ['sortOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return { code: 0, data: snakeToCamel(provinces) };
  },

  async getCitiesByProvinceId(provinceId) {
    const cities = await Region.findAll({
      where: {
        parentId: provinceId,
        status: 1,
        isDeleted: 0,
      },
      order: [
        ['sortOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return { code: 0, data: snakeToCamel(cities) };
  },

  async getAllCitiesByProvinceId(provinceId) {
    const cities = await Region.findAll({
      where: {
        parentId: provinceId,
        isDeleted: 0,
      },
      order: [
        ['sortOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return { code: 0, data: snakeToCamel(cities) };
  },

  async getDistrictsByCityId(cityId) {
    const districts = await Region.findAll({
      where: {
        parentId: cityId,
        status: 1,
        isDeleted: 0,
      },
      order: [
        ['sortOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return { code: 0, data: snakeToCamel(districts) };
  },

  async getAllDistrictsByCityId(cityId) {
    const districts = await Region.findAll({
      where: {
        parentId: cityId,
        isDeleted: 0,
      },
      order: [
        ['sortOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return { code: 0, data: snakeToCamel(districts) };
  },

  async getRegionById(id) {
    const region = await Region.findOne({
      where: {
        id,
        isDeleted: 0,
      },
    });
    if (!region) {
      return { code: 1, message: '区域不存在' };
    }
    return { code: 0, data: snakeToCamel(region) };
  },

  async getRegionsByParentId(parentId) {
    const regions = await Region.findAll({
      where: {
        parentId,
        status: 1,
        isDeleted: 0,
      },
      order: [
        ['sortOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return { code: 0, data: snakeToCamel(regions) };
  },

  async getRegionsByLevel(regionLevel) {
    const regions = await Region.findAll({
      where: {
        regionLevel,
        status: 1,
        isDeleted: 0,
      },
      order: [
        ['sortOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return { code: 0, data: snakeToCamel(regions) };
  },

  async searchRegionsByName(regionName) {
    const regions = await Region.findAll({
      where: {
        regionName: {
          $like: `%${regionName}%`,
        },
        status: 1,
        isDeleted: 0,
      },
      order: [
        ['regionLevel', 'ASC'],
        ['sortOrder', 'ASC'],
      ],
    });
    return { code: 0, data: snakeToCamel(regions) };
  },

  async searchRegionsByClosureTable(regionName, regionLevel) {
    let sql = `
      SELECT DISTINCT r.*
      FROM c_region r
      WHERE r.is_deleted = 0
    `;

    if (regionName) {
      sql += `
        AND (
          EXISTS (
            SELECT 1 FROM c_region_cl cl
            WHERE cl.region_id = r.id
            AND cl.full_path LIKE '%${regionName}%'
          )
          OR r.region_name LIKE '%${regionName}%'
        )
      `;
    }

    if (regionLevel) {
      sql += ` AND r.region_level = ${regionLevel}`;
    }

    sql += ` ORDER BY r.region_level ASC, r.sort_order ASC, r.id ASC`;

    const regions = await sequelize.query(sql, {
      type: QueryTypes.SELECT,
    });

    return { code: 0, data: snakeToCamel(regions) };
  },

  async getAllRegionsForManagement() {
    const regions = await Region.findAll({
      where: {
        isDeleted: 0,
      },
      order: [
        ['regionLevel', 'ASC'],
        ['sortOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    return { code: 0, data: snakeToCamel(regions) };
  },

  async getRegionTree() {
    const regions = await Region.findAll({
      where: {
        status: 1,
        isDeleted: 0,
      },
      order: [
        ['regionLevel', 'ASC'],
        ['sortOrder', 'ASC'],
        ['id', 'ASC'],
      ],
    });

    const buildTree = (parentId) => {
      return regions
        .filter((r) => r.parentId === parentId)
        .map((r) => ({
          id: r.id,
          parentId: r.parentId,
          regionCode: r.regionCode,
          regionName: r.regionName,
          regionLevel: r.regionLevel,
          fullName: r.fullName,
          sortOrder: r.sortOrder,
          status: r.status,
          children: buildTree(r.id),
        }));
    };

    const tree = buildTree(0);
    return { code: 0, data: snakeToCamel(tree) };
  },

  async getNextSortOrder(parentId) {
    const result = await sequelize.query(
      `SELECT COALESCE(MAX(sort_order), 0) as maxSort FROM c_region WHERE parent_id = ? AND is_deleted = 0`,
      {
        replacements: [parentId || 0],
        type: QueryTypes.SELECT,
      }
    );
    const maxSort = result[0]?.maxSort || 0;
    return { code: 0, data: maxSort + 1 };
  },

  async createRegion(regionData) {
    const transaction = await sequelize.transaction();
    try {
      if (!regionData.sortOrder) {
        const result = await sequelize.query(
          `SELECT COALESCE(MAX(sort_order), 0) as maxSort FROM c_region WHERE parent_id = ? AND is_deleted = 0`,
          {
            replacements: [regionData.parentId || 0],
            type: QueryTypes.SELECT,
            transaction,
          }
        );
        regionData.sortOrder = (result[0]?.maxSort || 0) + 1;
      }

      if (!regionData.fullName && regionData.parentId) {
        const parent = await Region.findByPk(regionData.parentId, { transaction });
        if (parent) {
          regionData.fullName = parent.fullName
            ? `${parent.fullName} > ${regionData.regionName}`
            : regionData.regionName;
        }
      } else if (!regionData.fullName) {
        regionData.fullName = regionData.regionName;
      }

      const region = await Region.create(regionData, { transaction });

      await this.rebuildClosureForRegion(region.id, transaction);

      await transaction.commit();
      return { code: 0, message: '创建成功', data: region };
    } catch (error) {
      await transaction.rollback();
      return { code: 1, message: `创建失败: ${error.message}` };
    }
  },

  async updateRegion(id, regionData) {
    const transaction = await sequelize.transaction();
    try {
      const region = await Region.findByPk(id, { transaction });
      if (!region) {
        await transaction.rollback();
        return { code: 1, message: '区域不存在' };
      }

      if (regionData.parentId !== undefined && regionData.parentId !== region.parentId) {
        await this.rebuildClosureForRegion(id, transaction);
      } else if (regionData.regionName) {
        if (region.parentId) {
          const parent = await Region.findByPk(region.parentId, { transaction });
          regionData.fullName = parent.fullName
            ? `${parent.fullName} > ${regionData.regionName}`
            : regionData.regionName;
        } else {
          regionData.fullName = regionData.regionName;
        }
        await region.update(regionData, { transaction });
      } else {
        await region.update(regionData, { transaction });
      }

      await transaction.commit();
      return { code: 0, message: '更新成功' };
    } catch (error) {
      await transaction.rollback();
      return { code: 1, message: `更新失败: ${error.message}` };
    }
  },

  async deleteRegion(id) {
    const transaction = await sequelize.transaction();
    try {
      const region = await Region.findByPk(id, { transaction });
      if (!region) {
        await transaction.rollback();
        return { code: 1, message: '区域不存在' };
      }

      const children = await Region.findAll({
        where: {
          parentId: id,
          isDeleted: 0,
        },
        transaction,
      });

      if (children.length > 0) {
        await transaction.rollback();
        return { code: 1, message: '存在子区域，无法删除' };
      }

      await region.update({ isDeleted: 1, deletedAt: new Date() }, { transaction });
      await RegionClosure.destroy({
        where: { regionId: id },
        transaction,
      });

      await transaction.commit();
      return { code: 0, message: '删除成功' };
    } catch (error) {
      await transaction.rollback();
      return { code: 1, message: `删除失败: ${error.message}` };
    }
  },

  async batchUpdateStatus(ids, status) {
    try {
      await Region.update(
        { status },
        {
          where: {
            id: ids,
            isDeleted: 0,
          },
        }
      );
      return { code: 0, message: '批量更新成功' };
    } catch (error) {
      return { code: 1, message: `批量更新失败: ${error.message}` };
    }
  },

  async rebuildClosureForRegion(regionId, transaction) {
    try {
      await RegionClosure.destroy({
        where: { regionId },
        transaction,
      });

      const region = await Region.findByPk(regionId, { transaction });
      if (!region) return;

      const closureRecords = [];
      let current = region;
      let pathLength = 0;
      let fullPath = region.regionName;

      while (current && current.parentId !== 0) {
        const parent = await Region.findByPk(current.parentId, { transaction });
        if (!parent) break;

        fullPath = `${parent.regionName} > ${fullPath}`;
        pathLength++;

        closureRecords.push({
          regionId: region.id,
          ancestorId: parent.id,
          ancestorLevel: parent.regionLevel,
          descendantLevel: region.regionLevel,
          pathLength,
          isDirect: pathLength === 1 ? 1 : 0,
          isRootNode: parent.parentId === 0 ? 1 : 0,
          fullPath,
        });

        current = parent;
      }

      if (current && current.parentId === 0) {
        closureRecords.push({
          regionId: region.id,
          ancestorId: current.id,
          ancestorLevel: current.regionLevel,
          descendantLevel: region.regionLevel,
          pathLength: 0,
          isDirect: 0,
          isRootNode: 1,
          fullPath: region.regionName,
        });
      }

      if (closureRecords.length > 0) {
        await RegionClosure.bulkCreate(closureRecords, { transaction });
      }
    } catch (error) {
      console.error('rebuildClosureForRegion error:', error);
    }
  },

  async rebuildRegionClosureTable() {
    const transaction = await sequelize.transaction();
    try {
      await RegionClosure.destroy({ where: {}, transaction });

      const regions = await Region.findAll({
        where: { isDeleted: 0 },
        order: [
          ['regionLevel', 'ASC'],
          ['sortOrder', 'ASC'],
        ],
        transaction,
      });

      for (const region of regions) {
        const closureRecords = [];
        let current = region;
        let pathLength = 0;
        let fullPath = region.regionName;

        while (current && current.parentId !== 0) {
          const parent = await Region.findByPk(current.parentId, { transaction });
          if (!parent) break;

          fullPath = `${parent.regionName} > ${fullPath}`;
          pathLength++;

          closureRecords.push({
            regionId: region.id,
            ancestorId: parent.id,
            ancestorLevel: parent.regionLevel,
            descendantLevel: region.regionLevel,
            pathLength,
            isDirect: pathLength === 1 ? 1 : 0,
            isRootNode: parent.parentId === 0 ? 1 : 0,
            fullPath,
          });

          current = parent;
        }

        if (current && current.parentId === 0) {
          closureRecords.push({
            regionId: region.id,
            ancestorId: current.id,
            ancestorLevel: current.regionLevel,
            descendantLevel: region.regionLevel,
            pathLength: 0,
            isDirect: 0,
            isRootNode: 1,
            fullPath: region.regionName,
          });
        }

        if (closureRecords.length > 0) {
          await RegionClosure.bulkCreate(closureRecords, { transaction });
        }
      }

      await transaction.commit();
      return { code: 0, message: '重构成功' };
    } catch (error) {
      await transaction.rollback();
      return { code: 1, message: `重构失败: ${error.message}` };
    }
  },

  async getRegionRootId(regionId) {
    const result = await sequelize.query(
      `SELECT ancestor_id FROM c_region_cl WHERE region_id = ? AND is_root_node = 1 LIMIT 1`,
      {
        replacements: [regionId],
        type: QueryTypes.SELECT,
      }
    );
    return { code: 0, data: result[0]?.ancestor_id || null };
  },

  async getRegionDirectChildren(ancestorId) {
    const children = await RegionClosure.findAll({
      where: {
        ancestorId,
        pathLength: 1,
      },
    });
    return { code: 0, data: snakeToCamel(children) };
  },

  async getRegionAllDescendants(ancestorId) {
    const descendants = await RegionClosure.findAll({
      where: {
        ancestorId,
        pathLength: { $gt: 0 },
      },
    });
    return { code: 0, data: snakeToCamel(descendants) };
  },

  async getRegionDirectParent(regionId) {
    const parent = await RegionClosure.findOne({
      where: {
        regionId,
        pathLength: 1,
      },
    });
    return { code: 0, data: snakeToCamel(parent) };
  },

  async getRegionIdsByKeyword(keyword) {
    if (!keyword || !keyword.trim()) return [];
    const trimmed = keyword.trim();
    const result = await sequelize.query(
      `SELECT DISTINCT cl.region_id FROM c_region_cl cl
       INNER JOIN c_region r ON r.id = cl.region_id AND r.is_deleted = 0
       WHERE cl.full_path LIKE ?`,
      {
        replacements: [`%${trimmed}%`],
        type: QueryTypes.SELECT,
      }
    );
    return result.map((r) => r.region_id);
  },

  async getRegionAllAncestors(regionId) {
    const ancestors = await RegionClosure.findAll({
      where: {
        regionId,
        pathLength: { $gt: 0 },
      },
      order: [['pathLength', 'ASC']],
    });
    return { code: 0, data: snakeToCamel(ancestors) };
  },
};

module.exports = regionService;
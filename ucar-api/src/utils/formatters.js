/**
 * Format date to YYYY-MM-DD HH:MM:SS
 */
const formatDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } else if (typeof date === 'string') {
    return date.slice(0, 19).replace('T', ' ');
  }
  return date;
};

/**
 * Convert snake_case keys to camelCase and extract dataValues from Sequelize instances
 */
const snakeToCamel = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  } else if (obj && typeof obj === 'object') {
    // Extract dataValues from Sequelize instances
    if (obj.dataValues) {
      return snakeToCamel(obj.dataValues);
    }
    const result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        let value = obj[key];
        // Format date fields
        if (key === 'created_at' || key === 'updated_at' || key === 'deleted_at') {
          value = formatDate(value);
        }
        result[camelKey] = snakeToCamel(value);
      }
    }
    return result;
  }
  return obj;
};

module.exports = {
  formatDate,
  snakeToCamel,
};
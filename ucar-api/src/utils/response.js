/**
 * 统一响应格式封装
 */

const success = (res, data = null, message = 'success') => {
  res.json({
    code: 0,
    message,
    data,
  });
};

const error = (res, message = 'error', code = 1, statusCode = 200) => {
  res.status(statusCode).json({
    code,
    message,
    data: null,
  });
};

const paginate = (res, list, pagination) => {
  res.json({
    code: 0,
    message: 'success',
    data: {
      list,
      pagination: {
        page: pagination.page,
        size: pagination.size,
        total: pagination.total,
        total_pages: Math.ceil(pagination.total / pagination.size),
      },
    },
  });
};

module.exports = {
  success,
  error,
  paginate,
};

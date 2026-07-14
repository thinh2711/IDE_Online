// Middleware xử lý lỗi tập trung cho toàn bộ API.
const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === '23505') {
    return res.status(400).json({
      error: {
        code: 'USER_EXISTS',
        message: 'Username already taken',
      },
    });
  }

  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';

  return res.status(statusCode).json({
    error: {
      code,
      message: error.message || 'Internal server error',
    },
  });
};

module.exports = { errorHandler };

const express = require('express');
const path = require('path');
const { errorHandler } = require('./middlewares/errorHandler');
const { logger } = require('./middlewares/logger');
const { authRouter } = require('./modules/auth/auth.routes');
const { questionsRouter } = require('./modules/questions/questions.routes');
const { sessionsRouter } = require('./modules/sessions/sessions.routes');
const { submissionsRouter } = require('./modules/submissions/submissions.routes');
const { testCasesRouter } = require('./modules/test-cases/test-cases.routes');
const { usersRouter } = require('./modules/users/users.routes');
const { healthRouter } = require('./routes/health.routes');

// Tạo Express app nhưng chưa mở cổng lắng nghe.
// Tách riêng phần này giúp dễ test hơn và giữ entrypoint gọn hơn.
const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use(logger);

  // Trong Docker/production, Vite build frontend vào thư mục public ở root.
  app.use(express.static(path.join(__dirname, '..', '..', 'public')));

  // Đăng ký health endpoint và các API route tại cùng một chỗ.
  app.use(healthRouter);
  app.use('/api', authRouter);
  app.use('/api', questionsRouter);
  app.use('/api', sessionsRouter);
  app.use('/api', submissionsRouter);
  app.use('/api', testCasesRouter);
  app.use('/api', usersRouter);
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };

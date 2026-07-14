const { env } = require('./config/env');
const { initDB } = require('./config/db');
const { createApp } = require('./app');

// Điểm khởi động server: khởi tạo database trước khi nhận request HTTP.
const app = createApp();

initDB().then(() => {
  app.listen(env.port, () => console.log(`[Server] Running on port ${env.port}`));
});

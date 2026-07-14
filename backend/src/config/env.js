// Nơi tập trung cấu hình runtime.
// Giá trị mặc định giúp chạy local/Docker đơn giản, env vars có thể ghi đè.
const env = {
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key',
  port: process.env.PORT || 3000,
  publicDir: process.env.PUBLIC_DIR,
};

module.exports = { env };

// Nơi tập trung cấu hình runtime.
// Giá trị mặc định giúp chạy local/Docker đơn giản, env vars có thể ghi đè.
const env = {
  judge0BaseUrl: process.env.JUDGE0_BASE_URL || 'http://judge0-server:2358',
  judge0CpuTimeLimit: Number(process.env.JUDGE0_CPU_TIME_LIMIT || 10),
  judge0MemoryLimitKb: Number(process.env.JUDGE0_MEMORY_LIMIT_KB || 262144),
  judge0WallTimeLimit: Number(process.env.JUDGE0_WALL_TIME_LIMIT || 15),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key',
  port: process.env.PORT || 3000,
  publicDir: process.env.PUBLIC_DIR,
};

module.exports = { env };

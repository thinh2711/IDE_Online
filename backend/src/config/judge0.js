const { env } = require('./env');

const languageMap = {
  cpp: 54,
  python: 71,
};

const judge0Config = {
  baseUrl: env.judge0BaseUrl,
  cpuTimeLimit: env.judge0CpuTimeLimit,
  languageMap,
  memoryLimitKb: env.judge0MemoryLimitKb,
  wallTimeLimit: env.judge0WallTimeLimit,
};

module.exports = { judge0Config };

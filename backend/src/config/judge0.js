const { env } = require('./env');

const languageMap = {
  c: 50,
  cpp: 54,
  java: 62,
  javascript: 63,
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

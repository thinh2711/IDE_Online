const { judge0Config } = require('../../config/judge0');

const getLanguageId = (language) => {
  return judge0Config.languageMap[language];
};

const createJudge0Payload = ({ language, sourceCode, stdin = '' }) => {
  const languageId = getLanguageId(language);

  if (!languageId) {
    const error = new Error('This language is not enabled');
    error.statusCode = 400;
    error.code = 'UNSUPPORTED_LANGUAGE';
    throw error;
  }

  return {
    cpu_time_limit: judge0Config.cpuTimeLimit,
    language_id: languageId,
    memory_limit: judge0Config.memoryLimitKb,
    source_code: sourceCode,
    stdin,
    wall_time_limit: judge0Config.wallTimeLimit,
  };
};

const runCode = async ({ language, sourceCode, stdin = '' }) => {
  const payload = createJudge0Payload({ language, sourceCode, stdin });

  return {
    payload,
    status: 'queued',
  };
};

module.exports = {
  createJudge0Payload,
  getLanguageId,
  runCode,
};

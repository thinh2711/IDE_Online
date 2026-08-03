const { judge0Config } = require('../../config/judge0');

const MAX_POLL_ATTEMPTS = 12;
const POLL_INTERVAL_MS = 1000;

const getLanguageId = (language) => {
  return judge0Config.languageMap[language];
};

const normalizeJudge0Status = (status = {}) => {
  const statusId = Number(status.id || 0);
  const description = String(status.description || '').toLowerCase();

  if (statusId === 1) return 'queued';
  if (statusId === 2) return 'processing';
  if (statusId === 3 || description === 'accepted') return 'accepted';
  if (statusId === 4 || description === 'wrong answer') return 'wrong_answer';
  if (statusId === 5 || description === 'time limit exceeded') return 'time_limit_exceeded';
  if (statusId === 6 || description === 'compilation error') return 'compilation_error';
  if (statusId >= 7 && statusId <= 12) return 'runtime_error';
  if (statusId === 13 || description === 'internal error') return 'judge_error';
  if (statusId === 14 || description === 'exec format error') return 'runtime_error';

  return 'unknown';
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestJudge0 = async (path, options = {}) => {
  const response = await fetch(`${judge0Config.baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Judge0 request failed');
    error.statusCode = response.status;
    error.code = 'JUDGE0_ERROR';
    throw error;
  }

  return data;
};

const isFinished = (submission) => {
  return Number(submission.status?.id || 0) >= 3;
};

const pollSubmission = async (token) => {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const submission = await requestJudge0(
      `/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status,time,memory,token`
    );

    if (isFinished(submission)) {
      return submission;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  const error = new Error('Judge0 execution timed out');
  error.statusCode = 504;
  error.code = 'JUDGE0_TIMEOUT';
  throw error;
};

const runCode = async ({ language, sourceCode, stdin = '' }) => {
  const payload = createJudge0Payload({ language, sourceCode, stdin });

  try {
    const submission = await requestJudge0('/submissions?base64_encoded=false&wait=true', {
      body: JSON.stringify(payload),
      method: 'POST',
    });

    return {
      payload,
      result: submission,
      status: normalizeJudge0Status(submission.status),
    };
  } catch (error) {
    if (!String(error.message).toLowerCase().includes('wait')) {
      throw error;
    }
  }

  const queuedSubmission = await requestJudge0('/submissions?base64_encoded=false&wait=false', {
    body: JSON.stringify(payload),
    method: 'POST',
  });
  const result = await pollSubmission(queuedSubmission.token);

  return {
    payload,
    result,
    status: normalizeJudge0Status(result.status),
  };
};

module.exports = {
  createJudge0Payload,
  getLanguageId,
  normalizeJudge0Status,
  runCode,
};

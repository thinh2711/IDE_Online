const questionsRepository = require('../questions/questions.repository');
const judge0Client = require('./judge0.client');
const submissionsRepository = require('./submissions.repository');

const MAX_SOURCE_CODE_LENGTH = 100_000;
const MAX_STDIN_LENGTH = 20_000;

const parseOptionalPositiveId = (id, name) => {
  if (id === undefined || id === null || id === '') {
    return null;
  }

  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    const error = new Error(`Invalid ${name}`);
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return parsedId;
};

const parsePositiveId = (id, name) => {
  const parsedId = parseOptionalPositiveId(id, name);

  if (!parsedId) {
    const error = new Error(`Invalid ${name}`);
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return parsedId;
};

const normalizeRunPayload = ({ questionId = null, sessionId = null, language, sourceCode, stdin = '' }) => {
  const normalizedLanguage = language?.trim().toLowerCase();
  const normalizedSourceCode = sourceCode === undefined || sourceCode === null ? '' : String(sourceCode);
  const normalizedStdin = stdin === undefined || stdin === null ? '' : String(stdin);

  if (!normalizedLanguage || !normalizedSourceCode.trim()) {
    const error = new Error('Language and sourceCode are required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (normalizedSourceCode.length > MAX_SOURCE_CODE_LENGTH || normalizedStdin.length > MAX_STDIN_LENGTH) {
    const error = new Error('Source code or input is too large');
    error.statusCode = 413;
    error.code = 'PAYLOAD_TOO_LARGE';
    throw error;
  }

  judge0Client.createJudge0Payload({
    language: normalizedLanguage,
    sourceCode: normalizedSourceCode,
    stdin: normalizedStdin,
  });

  return {
    language: normalizedLanguage,
    questionId: parseOptionalPositiveId(questionId, 'question id'),
    sessionId: parseOptionalPositiveId(sessionId, 'session id'),
    sourceCode: normalizedSourceCode,
    stdin: normalizedStdin,
  };
};

const ensureQuestionExists = async (questionId) => {
  if (!questionId) return;

  const question = await questionsRepository.findQuestionById(questionId);

  if (!question) {
    const error = new Error('Question not found');
    error.statusCode = 404;
    error.code = 'QUESTION_NOT_FOUND';
    throw error;
  }
};

const runSubmission = async ({ body, user }) => {
  const payload = normalizeRunPayload(body);
  await ensureQuestionExists(payload.questionId);

  const judge0Draft = await judge0Client.runCode(payload);

  return submissionsRepository.createSubmission({
    userId: user.id,
    questionId: payload.questionId,
    sessionId: payload.sessionId,
    language: payload.language,
    sourceCode: payload.sourceCode,
    stdin: payload.stdin,
    stdout: judge0Draft.result?.stdout || null,
    stderr: judge0Draft.result?.stderr || judge0Draft.result?.compile_output || judge0Draft.result?.message || null,
    status: judge0Draft.status,
    executionTime: judge0Draft.result?.time || null,
    memoryKb: judge0Draft.result?.memory || null,
    judge0Payload: judge0Draft.payload,
  });
};

const listSubmissions = async ({ user }) => {
  return submissionsRepository.findSubmissionsForUser({
    role: user.role,
    userId: user.id,
  });
};

const getSubmission = async ({ id, user }) => {
  const submission = await submissionsRepository.findSubmissionById(parsePositiveId(id, 'submission id'));

  if (!submission) {
    const error = new Error('Submission not found');
    error.statusCode = 404;
    error.code = 'SUBMISSION_NOT_FOUND';
    throw error;
  }

  if (user.role !== 'admin' && submission.user_id !== user.id) {
    const error = new Error('You do not have permission to access this resource');
    error.statusCode = 403;
    error.code = 'FORBIDDEN';
    throw error;
  }

  return submission;
};

module.exports = {
  getSubmission,
  listSubmissions,
  runSubmission,
};

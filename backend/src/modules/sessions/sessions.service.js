const crypto = require('crypto');
const questionsRepository = require('../questions/questions.repository');
const sessionsRepository = require('./sessions.repository');
const {
  parsePositiveId,
  validateCreateSessionBody,
  validateJoinSessionBody,
} = require('./sessions.schema');

const createError = ({ code, message, statusCode }) => {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
};

const ensureQuestionExists = async (questionId) => {
  if (!questionId) return;

  const question = await questionsRepository.findQuestionById(questionId);

  if (!question) {
    throw createError({
      code: 'QUESTION_NOT_FOUND',
      message: 'Question not found',
      statusCode: 404,
    });
  }
};

const generateJoinCode = () => crypto.randomBytes(5).toString('hex').toUpperCase();

const createUniqueJoinCode = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const joinCode = generateJoinCode();
    const existingSession = await sessionsRepository.findSessionByJoinCode(joinCode);

    if (!existingSession) {
      return joinCode;
    }
  }

  throw createError({
    code: 'JOIN_CODE_GENERATION_FAILED',
    message: 'Could not create a unique session code',
    statusCode: 500,
  });
};

const ensureCanAccessSession = ({ session, user }) => {
  if (user.role === 'admin') return;
  if (user.role === 'viewer') return;

  throw createError({
    code: 'FORBIDDEN',
    message: 'You do not have permission to access this session',
    statusCode: 403,
  });
};

const createSession = async ({ body, user }) => {
  if (!['admin', 'viewer'].includes(user.role)) {
    throw createError({
      code: 'FORBIDDEN',
      message: 'Only admin or reviewer can create a session',
      statusCode: 403,
    });
  }

  const payload = validateCreateSessionBody(body);
  await ensureQuestionExists(payload.questionId);

  const joinCode = await createUniqueJoinCode();
  const session = await sessionsRepository.createSession({
    joinCode,
    questionId: payload.questionId,
  });

  return sessionsRepository.findSessionById(session.id);
};

const listSessions = async ({ user }) => {
  if (!['admin', 'viewer'].includes(user.role)) {
    return [];
  }

  return sessionsRepository.findSessionsForUser({
    role: user.role,
  });
};

const getSession = async ({ id, user }) => {
  const session = await sessionsRepository.findSessionById(parsePositiveId(id, 'session id'));

  if (!session) {
    throw createError({
      code: 'SESSION_NOT_FOUND',
      message: 'Session not found',
      statusCode: 404,
    });
  }

  ensureCanAccessSession({ session, user });

  const submissions = await sessionsRepository.findSubmissionsForSession(session.id);

  return { session, submissions };
};

const joinSession = async ({ body, user }) => {
  const payload = validateJoinSessionBody(body);
  const session = await sessionsRepository.findSessionByJoinCode(payload.joinCode);

  if (!session || session.status !== 'active') {
    throw createError({
      code: 'SESSION_NOT_FOUND',
      message: 'Active session not found for this join code',
      statusCode: 404,
    });
  }

  const submissions = ['admin', 'viewer'].includes(user.role)
    ? await sessionsRepository.findSubmissionsForSession(session.id)
    : [];

  return { session, submissions };
};

const endSession = async ({ id, user }) => {
  const session = await sessionsRepository.findSessionById(parsePositiveId(id, 'session id'));

  if (!session) {
    throw createError({
      code: 'SESSION_NOT_FOUND',
      message: 'Session not found',
      statusCode: 404,
    });
  }

  ensureCanAccessSession({ session, user });

  const endedSession = await sessionsRepository.endSession(session.id);
  return sessionsRepository.findSessionById(endedSession.id);
};

module.exports = {
  createSession,
  endSession,
  getSession,
  joinSession,
  listSessions,
};

const normalizeJoinCode = (joinCode = '') => String(joinCode).trim().toUpperCase().replace(/\s+/g, '');

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

const validateCreateSessionBody = (body = {}) => ({
  questionId: parseOptionalPositiveId(body.questionId, 'question id'),
});

const validateJoinSessionBody = (body = {}) => {
  const joinCode = normalizeJoinCode(body.joinCode);

  if (!/^[A-Z0-9]{8,32}$/.test(joinCode)) {
    const error = new Error('A valid joinCode is required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return { joinCode };
};

module.exports = {
  normalizeJoinCode,
  parsePositiveId,
  validateCreateSessionBody,
  validateJoinSessionBody,
};

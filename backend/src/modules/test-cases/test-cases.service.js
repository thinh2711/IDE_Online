const questionsRepository = require('../questions/questions.repository');
const testCasesRepository = require('./test-cases.repository');

const parsePositiveId = (id, name) => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    const error = new Error(`Invalid ${name}`);
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return parsedId;
};

const normalizeTestCasePayload = ({ input = '', expectedOutput, isHidden = true, sortOrder = 0 }) => {
  if (expectedOutput === undefined || expectedOutput === null) {
    const error = new Error('Expected output is required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const parsedSortOrder = Number(sortOrder);

  if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
    const error = new Error('Sort order must be a non-negative integer');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return {
    input,
    expectedOutput: String(expectedOutput),
    isHidden: Boolean(isHidden),
    sortOrder: parsedSortOrder,
  };
};

const ensureQuestionExists = async (questionId) => {
  const question = await questionsRepository.findQuestionById(questionId);

  if (!question) {
    const error = new Error('Question not found');
    error.statusCode = 404;
    error.code = 'QUESTION_NOT_FOUND';
    throw error;
  }
};

const listTestCasesByQuestion = async (questionId) => {
  const parsedQuestionId = parsePositiveId(questionId, 'question id');
  await ensureQuestionExists(parsedQuestionId);

  return testCasesRepository.findTestCasesByQuestionId(parsedQuestionId);
};

const createTestCase = async ({ questionId, body }) => {
  const parsedQuestionId = parsePositiveId(questionId, 'question id');
  await ensureQuestionExists(parsedQuestionId);

  return testCasesRepository.createTestCase({
    questionId: parsedQuestionId,
    ...normalizeTestCasePayload(body),
  });
};

const updateTestCase = async ({ id, body }) => {
  const testCase = await testCasesRepository.updateTestCase({
    id: parsePositiveId(id, 'test case id'),
    ...normalizeTestCasePayload(body),
  });

  if (!testCase) {
    const error = new Error('Test case not found');
    error.statusCode = 404;
    error.code = 'TEST_CASE_NOT_FOUND';
    throw error;
  }

  return testCase;
};

const deleteTestCase = async (id) => {
  const testCase = await testCasesRepository.deleteTestCase(parsePositiveId(id, 'test case id'));

  if (!testCase) {
    const error = new Error('Test case not found');
    error.statusCode = 404;
    error.code = 'TEST_CASE_NOT_FOUND';
    throw error;
  }

  return testCase;
};

module.exports = {
  createTestCase,
  deleteTestCase,
  listTestCasesByQuestion,
  updateTestCase,
};

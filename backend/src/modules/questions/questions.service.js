const questionsRepository = require('./questions.repository');

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

const parsePositiveId = (id) => {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    const error = new Error('Invalid question id');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return parsedId;
};

const normalizeQuestionPayload = ({ title, description, difficulty = 'easy', sampleInput = '', sampleOutput = '' }) => {
  const normalizedTitle = title?.trim();
  const normalizedDescription = description?.trim();
  const normalizedDifficulty = difficulty?.trim().toLowerCase();

  if (!normalizedTitle || !normalizedDescription) {
    const error = new Error('Title and description are required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (!VALID_DIFFICULTIES.has(normalizedDifficulty)) {
    const error = new Error('Difficulty must be easy, medium or hard');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return {
    title: normalizedTitle,
    description: normalizedDescription,
    difficulty: normalizedDifficulty,
    sampleInput,
    sampleOutput,
  };
};

const listQuestions = async () => {
  return questionsRepository.findAllQuestions();
};

const getQuestion = async (id) => {
  const question = await questionsRepository.findQuestionById(parsePositiveId(id));

  if (!question) {
    const error = new Error('Question not found');
    error.statusCode = 404;
    error.code = 'QUESTION_NOT_FOUND';
    throw error;
  }

  return question;
};

const createQuestion = async ({ body, userId }) => {
  const payload = normalizeQuestionPayload(body);
  return questionsRepository.createQuestion({ ...payload, createdBy: userId });
};

const updateQuestion = async ({ id, body }) => {
  const payload = normalizeQuestionPayload(body);
  const question = await questionsRepository.updateQuestion({
    id: parsePositiveId(id),
    ...payload,
  });

  if (!question) {
    const error = new Error('Question not found');
    error.statusCode = 404;
    error.code = 'QUESTION_NOT_FOUND';
    throw error;
  }

  return question;
};

const deleteQuestion = async (id) => {
  const question = await questionsRepository.deleteQuestion(parsePositiveId(id));

  if (!question) {
    const error = new Error('Question not found');
    error.statusCode = 404;
    error.code = 'QUESTION_NOT_FOUND';
    throw error;
  }

  return question;
};

module.exports = {
  createQuestion,
  deleteQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
};

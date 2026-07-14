const assert = require('node:assert/strict');
const { beforeEach, describe, it, mock } = require('node:test');

const questionsControllerPath = require.resolve('../src/modules/questions/questions.controller');
const questionsRepositoryPath = require.resolve('../src/modules/questions/questions.repository');
const questionsServicePath = require.resolve('../src/modules/questions/questions.service');

let questionsController;
let questionsRepository;
let questionsService;

const createResponse = () => {
  const res = {
    body: undefined,
    statusCode: 200,
    json: mock.fn((body) => {
      res.body = body;
      return res;
    }),
    status: mock.fn((statusCode) => {
      res.statusCode = statusCode;
      return res;
    }),
  };

  return res;
};

const createNext = () => mock.fn();

beforeEach(() => {
  questionsRepository = {
    createQuestion: mock.fn(),
    deleteQuestion: mock.fn(),
    findAllQuestions: mock.fn(),
    findQuestionById: mock.fn(),
    updateQuestion: mock.fn(),
  };

  delete require.cache[questionsControllerPath];
  delete require.cache[questionsRepositoryPath];
  delete require.cache[questionsServicePath];

  require.cache[questionsRepositoryPath] = {
    id: questionsRepositoryPath,
    filename: questionsRepositoryPath,
    loaded: true,
    exports: questionsRepository,
  };

  questionsService = require('../src/modules/questions/questions.service');
  questionsController = require('../src/modules/questions/questions.controller');
});

describe('Group 1: questions service', () => {
  it('Test 1: creates a normalized question', async () => {
    const question = {
      id: 1,
      title: 'Two Sum',
      description: 'Return indices',
      difficulty: 'easy',
      sample_input: '2 7 11 15',
      sample_output: '0 1',
      created_by: 1,
    };
    questionsRepository.createQuestion.mock.mockImplementationOnce(async () => question);

    const result = await questionsService.createQuestion({
      userId: 1,
      body: {
        title: ' Two Sum ',
        description: ' Return indices ',
        difficulty: ' EASY ',
        sampleInput: '2 7 11 15',
        sampleOutput: '0 1',
      },
    });

    assert.deepEqual(result, question);
    assert.deepEqual(questionsRepository.createQuestion.mock.calls[0].arguments[0], {
      title: 'Two Sum',
      description: 'Return indices',
      difficulty: 'easy',
      sampleInput: '2 7 11 15',
      sampleOutput: '0 1',
      createdBy: 1,
    });
  });

  it('Test 2: rejects invalid difficulty', async () => {
    await assert.rejects(
      questionsService.createQuestion({
        userId: 1,
        body: {
          title: 'Two Sum',
          description: 'Return indices',
          difficulty: 'extreme',
        },
      }),
      {
        code: 'VALIDATION_ERROR',
        message: 'Difficulty must be easy, medium or hard',
        statusCode: 400,
      }
    );
    assert.equal(questionsRepository.createQuestion.mock.calls.length, 0);
  });

  it('Test 3: returns question not found for missing question', async () => {
    questionsRepository.findQuestionById.mock.mockImplementationOnce(async () => null);

    await assert.rejects(questionsService.getQuestion('99'), {
      code: 'QUESTION_NOT_FOUND',
      message: 'Question not found',
      statusCode: 404,
    });
  });
});

describe('Group 2: questions controller', () => {
  it('Test 4: listQuestions returns questions', async () => {
    const questions = [
      {
        id: 1,
        title: 'Two Sum',
        difficulty: 'easy',
      },
    ];
    questionsRepository.findAllQuestions.mock.mockImplementationOnce(async () => questions);
    const res = createResponse();
    const next = createNext();

    await questionsController.listQuestions({}, res, next);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { questions });
    assert.equal(next.mock.calls.length, 0);
  });

  it('Test 5: createQuestion returns 201', async () => {
    const question = {
      id: 1,
      title: 'Two Sum',
      description: 'Return indices',
      difficulty: 'easy',
    };
    questionsRepository.createQuestion.mock.mockImplementationOnce(async () => question);
    const req = {
      body: {
        title: 'Two Sum',
        description: 'Return indices',
      },
      user: {
        id: 1,
      },
    };
    const res = createResponse();
    const next = createNext();

    await questionsController.createQuestion(req, res, next);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      message: 'Question created successfully',
      question,
    });
    assert.equal(next.mock.calls.length, 0);
  });
});

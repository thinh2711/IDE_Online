const assert = require('node:assert/strict');
const { beforeEach, describe, it, mock } = require('node:test');

const questionsRepositoryPath = require.resolve('../src/modules/questions/questions.repository');
const testCasesControllerPath = require.resolve('../src/modules/test-cases/test-cases.controller');
const testCasesRepositoryPath = require.resolve('../src/modules/test-cases/test-cases.repository');
const testCasesServicePath = require.resolve('../src/modules/test-cases/test-cases.service');

let questionsRepository;
let testCasesController;
let testCasesRepository;
let testCasesService;

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
    findQuestionById: mock.fn(),
  };
  testCasesRepository = {
    createTestCase: mock.fn(),
    deleteTestCase: mock.fn(),
    findTestCasesByQuestionId: mock.fn(),
    updateTestCase: mock.fn(),
  };

  delete require.cache[questionsRepositoryPath];
  delete require.cache[testCasesControllerPath];
  delete require.cache[testCasesRepositoryPath];
  delete require.cache[testCasesServicePath];

  require.cache[questionsRepositoryPath] = {
    id: questionsRepositoryPath,
    filename: questionsRepositoryPath,
    loaded: true,
    exports: questionsRepository,
  };
  require.cache[testCasesRepositoryPath] = {
    id: testCasesRepositoryPath,
    filename: testCasesRepositoryPath,
    loaded: true,
    exports: testCasesRepository,
  };

  testCasesService = require('../src/modules/test-cases/test-cases.service');
  testCasesController = require('../src/modules/test-cases/test-cases.controller');
});

describe('Group 1: test cases service', () => {
  it('Test 1: creates a test case for an existing question', async () => {
    const testCase = {
      id: 1,
      question_id: 1,
      input: '1 2',
      expected_output: '3',
      is_hidden: true,
      sort_order: 0,
    };
    questionsRepository.findQuestionById.mock.mockImplementationOnce(async () => ({ id: 1 }));
    testCasesRepository.createTestCase.mock.mockImplementationOnce(async () => testCase);

    const result = await testCasesService.createTestCase({
      questionId: '1',
      body: {
        input: '1 2',
        expectedOutput: 3,
        isHidden: true,
        sortOrder: '0',
      },
    });

    assert.deepEqual(result, testCase);
    assert.deepEqual(testCasesRepository.createTestCase.mock.calls[0].arguments[0], {
      questionId: 1,
      input: '1 2',
      expectedOutput: '3',
      isHidden: true,
      sortOrder: 0,
    });
  });

  it('Test 2: rejects creating test case for a missing question', async () => {
    questionsRepository.findQuestionById.mock.mockImplementationOnce(async () => null);

    await assert.rejects(
      testCasesService.createTestCase({
        questionId: '99',
        body: {
          expectedOutput: 'ok',
        },
      }),
      {
        code: 'QUESTION_NOT_FOUND',
        message: 'Question not found',
        statusCode: 404,
      }
    );
    assert.equal(testCasesRepository.createTestCase.mock.calls.length, 0);
  });

  it('Test 3: rejects missing expected output', async () => {
    questionsRepository.findQuestionById.mock.mockImplementationOnce(async () => ({ id: 1 }));

    await assert.rejects(
      testCasesService.createTestCase({
        questionId: '1',
        body: {
          input: 'abc',
        },
      }),
      {
        code: 'VALIDATION_ERROR',
        message: 'Expected output is required',
        statusCode: 400,
      }
    );
  });
});

describe('Group 2: test cases controller', () => {
  it('Test 4: listTestCasesByQuestion returns test cases', async () => {
    const testCases = [
      {
        id: 1,
        question_id: 1,
        input: '1 2',
        expected_output: '3',
        is_hidden: false,
        sort_order: 0,
      },
    ];
    questionsRepository.findQuestionById.mock.mockImplementationOnce(async () => ({ id: 1 }));
    testCasesRepository.findTestCasesByQuestionId.mock.mockImplementationOnce(async () => testCases);
    const res = createResponse();
    const next = createNext();

    await testCasesController.listTestCasesByQuestion({ params: { id: '1' } }, res, next);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { testCases });
    assert.equal(next.mock.calls.length, 0);
  });

  it('Test 5: updateTestCase returns updated test case', async () => {
    const testCase = {
      id: 1,
      question_id: 1,
      input: '2 3',
      expected_output: '5',
      is_hidden: true,
      sort_order: 1,
    };
    testCasesRepository.updateTestCase.mock.mockImplementationOnce(async () => testCase);
    const res = createResponse();
    const next = createNext();

    await testCasesController.updateTestCase(
      {
        body: {
          input: '2 3',
          expectedOutput: '5',
          isHidden: true,
          sortOrder: 1,
        },
        params: {
          id: '1',
        },
      },
      res,
      next
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      message: 'Test case updated successfully',
      testCase,
    });
    assert.equal(next.mock.calls.length, 0);
  });
});

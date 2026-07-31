const assert = require('node:assert/strict');
const { beforeEach, describe, it, mock } = require('node:test');

const judge0ClientPath = require.resolve('../src/modules/submissions/judge0.client');
const questionsRepositoryPath = require.resolve('../src/modules/questions/questions.repository');
const submissionsControllerPath = require.resolve('../src/modules/submissions/submissions.controller');
const submissionsRepositoryPath = require.resolve('../src/modules/submissions/submissions.repository');
const submissionsServicePath = require.resolve('../src/modules/submissions/submissions.service');

let judge0Client;
let questionsRepository;
let submissionsController;
let submissionsRepository;
let submissionsService;

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
  judge0Client = {
    createJudge0Payload: mock.fn(({ language, sourceCode, stdin = '' }) => {
      if (language === 'ruby') {
        const error = new Error('This language is not enabled');
        error.statusCode = 400;
        error.code = 'UNSUPPORTED_LANGUAGE';
        throw error;
      }

      return {
        language_id: 63,
        source_code: sourceCode,
        stdin,
      };
    }),
    runCode: mock.fn(async ({ language, sourceCode, stdin = '' }) => ({
      payload: {
        language,
        source_code: sourceCode,
        stdin,
      },
      result: {
        memory: 912,
        status: {
          description: 'Accepted',
          id: 3,
        },
        stderr: null,
        stdout: 'hello\n',
        time: '0.012',
      },
      status: 'Accepted',
    })),
  };

  questionsRepository = {
    findQuestionById: mock.fn(async () => ({ id: 1, title: 'Two Sum' })),
  };

  submissionsRepository = {
    createSubmission: mock.fn(async (payload) => ({
      id: 1,
      user_id: payload.userId,
      question_id: payload.questionId,
      language: payload.language,
      source_code: payload.sourceCode,
      stdin: payload.stdin,
      status: payload.status,
      stdout: payload.stdout,
      stderr: payload.stderr,
      execution_time: payload.executionTime,
      memory_kb: payload.memoryKb,
      judge0_payload: payload.judge0Payload,
    })),
    findSubmissionById: mock.fn(),
    findSubmissionsForUser: mock.fn(),
  };

  delete require.cache[judge0ClientPath];
  delete require.cache[questionsRepositoryPath];
  delete require.cache[submissionsControllerPath];
  delete require.cache[submissionsRepositoryPath];
  delete require.cache[submissionsServicePath];

  require.cache[judge0ClientPath] = {
    id: judge0ClientPath,
    filename: judge0ClientPath,
    loaded: true,
    exports: judge0Client,
  };
  require.cache[questionsRepositoryPath] = {
    id: questionsRepositoryPath,
    filename: questionsRepositoryPath,
    loaded: true,
    exports: questionsRepository,
  };
  require.cache[submissionsRepositoryPath] = {
    id: submissionsRepositoryPath,
    filename: submissionsRepositoryPath,
    loaded: true,
    exports: submissionsRepository,
  };

  submissionsService = require('../src/modules/submissions/submissions.service');
  submissionsController = require('../src/modules/submissions/submissions.controller');
});

describe('Group 1: submissions service', () => {
  it('Test 1: creates a submission with Judge0 result', async () => {
    const result = await submissionsService.runSubmission({
      user: {
        id: 1,
        role: 'coder',
      },
      body: {
        questionId: 1,
        language: ' JavaScript ',
        sourceCode: "console.log('hello')",
        stdin: '',
      },
    });

    assert.equal(result.status, 'Accepted');
    assert.equal(result.stdout, 'hello\n');
    assert.equal(result.execution_time, '0.012');
    assert.equal(result.memory_kb, 912);
    assert.equal(result.language, 'javascript');
    assert.equal(result.user_id, 1);
    assert.equal(result.question_id, 1);
    assert.equal(judge0Client.runCode.mock.calls.length, 1);
    assert.deepEqual(submissionsRepository.createSubmission.mock.calls[0].arguments[0], {
      userId: 1,
      questionId: 1,
      sessionId: null,
      language: 'javascript',
      sourceCode: "console.log('hello')",
      stdin: '',
      stdout: 'hello\n',
      stderr: null,
      status: 'Accepted',
      executionTime: '0.012',
      memoryKb: 912,
      judge0Payload: {
        language: 'javascript',
        source_code: "console.log('hello')",
        stdin: '',
      },
    });
  });

  it('Test 2: rejects missing language or sourceCode', async () => {
    await assert.rejects(
      submissionsService.runSubmission({
        user: {
          id: 1,
          role: 'coder',
        },
        body: {
          language: '',
          sourceCode: '',
        },
      }),
      {
        code: 'VALIDATION_ERROR',
        message: 'Language and sourceCode are required',
        statusCode: 400,
      }
    );
    assert.equal(submissionsRepository.createSubmission.mock.calls.length, 0);
  });

  it('Test 3: rejects unsupported language before storing submission', async () => {
    await assert.rejects(
      submissionsService.runSubmission({
        user: {
          id: 1,
          role: 'coder',
        },
        body: {
          language: 'ruby',
          sourceCode: 'puts "hello"',
        },
      }),
      {
        code: 'UNSUPPORTED_LANGUAGE',
        message: 'This language is not enabled',
        statusCode: 400,
      }
    );
    assert.equal(submissionsRepository.createSubmission.mock.calls.length, 0);
  });
});

describe('Group 2: submissions controller', () => {
  it('Test 4: runSubmission returns 201', async () => {
    const req = {
      body: {
        language: 'javascript',
        sourceCode: "console.log('hello')",
      },
      user: {
        id: 1,
        role: 'coder',
      },
    };
    const res = createResponse();
    const next = createNext();

    await submissionsController.runSubmission(req, res, next);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.message, 'Submission executed');
    assert.equal(res.body.submission.status, 'Accepted');
    assert.equal(next.mock.calls.length, 0);
  });
});

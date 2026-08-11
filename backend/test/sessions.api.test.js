const assert = require('node:assert/strict');
const { beforeEach, describe, it, mock } = require('node:test');

const questionsRepositoryPath = require.resolve('../src/modules/questions/questions.repository');
const sessionsControllerPath = require.resolve('../src/modules/sessions/sessions.controller');
const sessionsRepositoryPath = require.resolve('../src/modules/sessions/sessions.repository');
const sessionsServicePath = require.resolve('../src/modules/sessions/sessions.service');

let questionsRepository;
let sessionsController;
let sessionsRepository;
let sessionsService;

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
    findQuestionById: mock.fn(async () => ({ id: 1, title: 'Two Sum' })),
  };

  sessionsRepository = {
    createSession: mock.fn(async (payload) => ({
      id: 10,
      coder_id: null,
      join_code: payload.joinCode,
      question_id: payload.questionId,
      status: 'active',
    })),
    endSession: mock.fn(async (id) => ({
      id,
      coder_id: null,
      join_code: 'ABC12345',
      question_id: 1,
      status: 'ended',
    })),
    findSessionById: mock.fn(async (id) => ({
      id,
      coder_id: null,
      coder_username: null,
      join_code: 'ABC12345',
      question_id: 1,
      question_title: 'Two Sum',
      status: 'active',
    })),
    findSessionByJoinCode: mock.fn(async (joinCode) => {
      if (joinCode === 'TAKEN0001') {
        return { id: 99, join_code: joinCode, status: 'active' };
      }

      if (joinCode === 'ABC12345') {
        return {
          id: 10,
          coder_id: null,
          coder_username: null,
          join_code: joinCode,
          question_id: 1,
          question_title: 'Two Sum',
          status: 'active',
        };
      }

      return null;
    }),
    findSessionsForUser: mock.fn(),
    findSubmissionsForSession: mock.fn(async () => []),
  };

  delete require.cache[questionsRepositoryPath];
  delete require.cache[sessionsControllerPath];
  delete require.cache[sessionsRepositoryPath];
  delete require.cache[sessionsServicePath];

  require.cache[questionsRepositoryPath] = {
    id: questionsRepositoryPath,
    filename: questionsRepositoryPath,
    loaded: true,
    exports: questionsRepository,
  };
  require.cache[sessionsRepositoryPath] = {
    id: sessionsRepositoryPath,
    filename: sessionsRepositoryPath,
    loaded: true,
    exports: sessionsRepository,
  };

  sessionsService = require('../src/modules/sessions/sessions.service');
  sessionsController = require('../src/modules/sessions/sessions.controller');
});

describe('Group 1: sessions service', () => {
  it('Test 1: lets a reviewer create a session room with a join code', async () => {
    const session = await sessionsService.createSession({
      body: { questionId: 1 },
      user: { id: 3, role: 'viewer' },
    });

    assert.equal(session.id, 10);
    assert.equal(session.coder_id, null);
    assert.equal(session.question_id, 1);
    assert.match(sessionsRepository.createSession.mock.calls[0].arguments[0].joinCode, /^[A-F0-9]{10}$/);
    assert.equal(sessionsRepository.createSession.mock.calls[0].arguments[0].coderId, undefined);
  });

  it('Test 2: joins an active session by normalized code', async () => {
    const data = await sessionsService.joinSession({
      body: { joinCode: ' abc12345 ' },
      user: { id: 2, role: 'viewer' },
    });

    assert.equal(data.session.id, 10);
    assert.equal(data.submissions.length, 0);
    assert.equal(sessionsRepository.findSessionByJoinCode.mock.calls[0].arguments[0], 'ABC12345');
  });

  it('Test 3: rejects coder session creation', async () => {
    await assert.rejects(
      sessionsService.createSession({
        body: {
          questionId: 1,
        },
        user: {
          id: 2,
          role: 'coder',
        },
      }),
      {
        code: 'FORBIDDEN',
        message: 'Only admin or reviewer can create a session',
        statusCode: 403,
      }
    );
  });

  it('Test 4: admin can create a session without selecting a coder', async () => {
    const session = await sessionsService.createSession({
      body: {
        questionId: 1,
      },
      user: {
        id: 1,
        role: 'admin',
      },
    });

    assert.equal(session.id, 10);
    assert.equal(sessionsRepository.createSession.mock.calls[0].arguments[0].coderId, undefined);
  });

  it('Test 5: rejects invalid join codes', async () => {
    await assert.rejects(
      sessionsService.joinSession({
        body: { joinCode: 'bad' },
        user: { id: 2, role: 'viewer' },
      }),
      {
        code: 'VALIDATION_ERROR',
        message: 'A valid joinCode is required',
        statusCode: 400,
      }
    );
  });

  it('Test 6: prevents coder from ending a session', async () => {
    await assert.rejects(
      sessionsService.endSession({
        id: 10,
        user: { id: 2, role: 'coder' },
      }),
      {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this session',
        statusCode: 403,
      }
    );
  });
});

describe('Group 2: sessions controller', () => {
  it('Test 7: createSession returns 201', async () => {
    const res = createResponse();
    const next = createNext();

    await sessionsController.createSession({
      body: { questionId: 1 },
      user: { id: 1, role: 'admin' },
    }, res, next);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.message, 'Session created');
    assert.equal(res.body.session.id, 10);
    assert.equal(next.mock.calls.length, 0);
  });
});

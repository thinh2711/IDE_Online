const assert = require('node:assert/strict');
const { beforeEach, describe, it, mock } = require('node:test');
const jwt = require('jsonwebtoken');

const { env } = require('../src/config/env');
const { authenticateToken } = require('../src/middlewares/authenticateToken');
const { authorizeRoles } = require('../src/middlewares/authorizeRoles');
const { errorHandler } = require('../src/middlewares/errorHandler');

const authControllerPath = require.resolve('../src/modules/auth/auth.controller');
const authServicePath = require.resolve('../src/modules/auth/auth.service');

let authController;
let authService;

const createResponse = () => {
  const res = {
    body: undefined,
    statusCode: 200,
    headersSent: false,
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
  authService = {
    getProfile: mock.fn(),
    login: mock.fn(),
    register: mock.fn(),
  };

  delete require.cache[authControllerPath];
  delete require.cache[authServicePath];

  require.cache[authServicePath] = {
    id: authServicePath,
    filename: authServicePath,
    loaded: true,
    exports: authService,
  };

  authController = require('../src/modules/auth/auth.controller');
});

describe('Group 1: auth API controller', () => {
  it('Test 1: register returns 201 and the created user', async () => {
    const user = {
      id: 1,
      full_name: 'Nguyen Van A',
      username: 'vana',
      role: 'coder',
      created_at: '2026-07-09T00:00:00.000Z',
    };
    authService.register.mock.mockImplementationOnce(async () => user);
    const req = {
      body: {
        fullName: 'Nguyen Van A',
        username: 'vana',
        password: 'secret',
      },
    };
    const res = createResponse();
    const next = createNext();

    await authController.register(req, res, next);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      message: 'User registered successfully',
      user,
    });
    assert.deepEqual(authService.register.mock.calls[0].arguments[0], req.body);
    assert.equal(next.mock.calls.length, 0);
  });

  it('Test 2: register forwards service errors to the error handler', async () => {
    const error = new Error('Full name, username and password required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    authService.register.mock.mockImplementationOnce(async () => {
      throw error;
    });
    const res = createResponse();
    const next = createNext();

    await authController.register({ body: { username: 'vana' } }, res, next);

    assert.equal(next.mock.calls[0].arguments[0], error);
  });

  it('Test 3: login returns 200 and an access token', async () => {
    authService.login.mock.mockImplementationOnce(async () => 'signed.jwt.token');
    const req = {
      body: {
        username: 'vana',
        password: 'secret',
      },
    };
    const res = createResponse();
    const next = createNext();

    await authController.login(req, res, next);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      message: 'Login successful',
      accessToken: 'signed.jwt.token',
    });
    assert.deepEqual(authService.login.mock.calls[0].arguments[0], req.body);
    assert.equal(next.mock.calls.length, 0);
  });

  it('Test 4: me returns the profile for the authenticated user', async () => {
    const user = {
      id: 1,
      full_name: 'Nguyen Van A',
      username: 'vana',
      role: 'coder',
      created_at: '2026-07-09T00:00:00.000Z',
    };
    authService.getProfile.mock.mockImplementationOnce(async () => user);
    const res = createResponse();
    const next = createNext();

    await authController.me({ traceId: 'abc123xy', user: { id: 1 } }, res, next);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      message: 'You have accessed a protected route!',
      user,
      traceId: 'abc123xy',
    });
    assert.equal(authService.getProfile.mock.calls[0].arguments[0], 1);
    assert.equal(next.mock.calls.length, 0);
  });
});

describe('Group 2: auth API middleware', () => {
  it('Test 5: rejects requests without a bearer token', () => {
    const res = createResponse();
    const next = createNext();

    authenticateToken({ headers: {} }, res, next);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing access token',
      },
    });
    assert.equal(next.mock.calls.length, 0);
  });

  it('Test 6: rejects invalid bearer tokens', () => {
    const res = createResponse();
    const next = createNext();

    authenticateToken({ headers: { authorization: 'Bearer invalid-token' } }, res, next);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid or expired token',
      },
    });
    assert.equal(next.mock.calls.length, 0);
  });

  it('Test 7: sets req.user and continues for valid bearer tokens', () => {
    const token = jwt.sign({ id: 1, username: 'vana', role: 'coder' }, env.jwtSecret);
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const res = createResponse();
    const next = createNext();

    authenticateToken(req, res, next);

    assert.equal(req.user.id, 1);
    assert.equal(req.user.username, 'vana');
    assert.equal(req.user.role, 'coder');
    assert.equal(next.mock.calls.length, 1);
  });

  it('Test 8: allows requests when user role is authorized', () => {
    const req = {
      user: {
        id: 1,
        role: 'admin',
      },
    };
    const res = createResponse();
    const next = createNext();

    authorizeRoles('admin')(req, res, next);

    assert.equal(res.statusCode, 200);
    assert.equal(next.mock.calls.length, 1);
  });

  it('Test 9: rejects requests when user role is not authorized', () => {
    const req = {
      user: {
        id: 1,
        role: 'viewer',
      },
    };
    const res = createResponse();
    const next = createNext();

    authorizeRoles('admin', 'coder')(req, res, next);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.body, {
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
      },
    });
    assert.equal(next.mock.calls.length, 0);
  });
});

describe('Group 3: API error handler', () => {
  it('Test 10: formats validation errors', () => {
    const error = new Error('Username and password required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    const res = createResponse();

    errorHandler(error, {}, res, createNext());

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Username and password required',
      },
    });
  });

  it('Test 11: formats duplicate username database errors', () => {
    const error = new Error('duplicate key value violates unique constraint');
    error.code = '23505';
    const res = createResponse();

    errorHandler(error, {}, res, createNext());

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, {
      error: {
        code: 'USER_EXISTS',
        message: 'Username already taken',
      },
    });
  });
});

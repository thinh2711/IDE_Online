const assert = require('node:assert/strict');
const { beforeEach, describe, it, mock } = require('node:test');

const usersControllerPath = require.resolve('../src/modules/users/users.controller');
const usersRepositoryPath = require.resolve('../src/modules/users/users.repository');
const usersServicePath = require.resolve('../src/modules/users/users.service');

let usersController;
let usersRepository;
let usersService;

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
  usersRepository = {
    findAllUsers: mock.fn(),
    findUserById: mock.fn(),
    updateUserRole: mock.fn(),
  };

  delete require.cache[usersControllerPath];
  delete require.cache[usersRepositoryPath];
  delete require.cache[usersServicePath];

  require.cache[usersRepositoryPath] = {
    id: usersRepositoryPath,
    filename: usersRepositoryPath,
    loaded: true,
    exports: usersRepository,
  };

  usersService = require('../src/modules/users/users.service');
  usersController = require('../src/modules/users/users.controller');
});

describe('Group 1: users service', () => {
  it('Test 1: lists users without password hashes', async () => {
    const users = [
      {
        id: 1,
        full_name: 'Admin User',
        username: 'admin',
        role: 'admin',
        created_at: '2026-07-14T00:00:00.000Z',
      },
    ];
    usersRepository.findAllUsers.mock.mockImplementationOnce(async () => users);

    const result = await usersService.listUsers();

    assert.deepEqual(result, users);
    assert.equal(usersRepository.findAllUsers.mock.calls.length, 1);
  });

  it('Test 2: updates a user role', async () => {
    const updatedUser = {
      id: 2,
      full_name: 'Viewer User',
      username: 'viewer',
      role: 'viewer',
      created_at: '2026-07-14T00:00:00.000Z',
    };
    usersRepository.updateUserRole.mock.mockImplementationOnce(async () => updatedUser);

    const result = await usersService.changeUserRole({
      requesterId: 1,
      targetUserId: '2',
      role: ' Viewer ',
    });

    assert.deepEqual(result, updatedUser);
    assert.deepEqual(usersRepository.updateUserRole.mock.calls[0].arguments[0], {
      id: 2,
      role: 'viewer',
    });
  });

  it('Test 3: rejects invalid roles', async () => {
    await assert.rejects(
      usersService.changeUserRole({
        requesterId: 1,
        targetUserId: '2',
        role: 'owner',
      }),
      {
        code: 'VALIDATION_ERROR',
        message: 'Role must be admin, coder or viewer',
        statusCode: 400,
      }
    );
    assert.equal(usersRepository.updateUserRole.mock.calls.length, 0);
  });

  it('Test 4: rejects changing the requester own role', async () => {
    await assert.rejects(
      usersService.changeUserRole({
        requesterId: 1,
        targetUserId: '1',
        role: 'viewer',
      }),
      {
        code: 'SELF_ROLE_CHANGE_NOT_ALLOWED',
        message: 'You cannot change your own role',
        statusCode: 400,
      }
    );
    assert.equal(usersRepository.updateUserRole.mock.calls.length, 0);
  });
});

describe('Group 2: users controller', () => {
  it('Test 5: listUsers returns users', async () => {
    const users = [
      {
        id: 1,
        full_name: 'Admin User',
        username: 'admin',
        role: 'admin',
        created_at: '2026-07-14T00:00:00.000Z',
      },
    ];
    usersRepository.findAllUsers.mock.mockImplementationOnce(async () => users);
    const res = createResponse();
    const next = createNext();

    await usersController.listUsers({}, res, next);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { users });
    assert.equal(next.mock.calls.length, 0);
  });

  it('Test 6: changeUserRole returns the updated user', async () => {
    const user = {
      id: 2,
      full_name: 'Coder User',
      username: 'coder',
      role: 'admin',
      created_at: '2026-07-14T00:00:00.000Z',
    };
    usersRepository.updateUserRole.mock.mockImplementationOnce(async () => user);
    const req = {
      body: {
        role: 'admin',
      },
      params: {
        id: '2',
      },
      user: {
        id: 1,
      },
    };
    const res = createResponse();
    const next = createNext();

    await usersController.changeUserRole(req, res, next);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      message: 'User role updated successfully',
      user,
    });
    assert.equal(next.mock.calls.length, 0);
  });
});

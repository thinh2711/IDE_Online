const usersRepository = require('./users.repository');

const VALID_ROLES = new Set(['admin', 'coder', 'viewer']);

const listUsers = async () => {
  return usersRepository.findAllUsers();
};

const changeUserRole = async ({ requesterId, targetUserId, role }) => {
  const parsedTargetUserId = Number(targetUserId);
  const normalizedRole = role?.trim().toLowerCase();

  if (!Number.isInteger(parsedTargetUserId) || parsedTargetUserId <= 0) {
    const error = new Error('Invalid user id');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (!VALID_ROLES.has(normalizedRole)) {
    const error = new Error('Role must be admin, coder or viewer');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (Number(requesterId) === parsedTargetUserId) {
    const error = new Error('You cannot change your own role');
    error.statusCode = 400;
    error.code = 'SELF_ROLE_CHANGE_NOT_ALLOWED';
    throw error;
  }

  const user = await usersRepository.updateUserRole({
    id: parsedTargetUserId,
    role: normalizedRole,
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  return user;
};

module.exports = {
  changeUserRole,
  listUsers,
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');
const authRepository = require('./auth.repository');

// Lớp service chịu trách nhiệm validation, hash password và tạo token.
const register = async ({ fullName, username, password }) => {
  const normalizedFullName = fullName?.trim();
  const normalizedUsername = username?.trim();

  if (!normalizedFullName || !normalizedUsername || !password) {
    const error = new Error('Full name, username and password required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // Chỉ lưu password hash, tuyệt đối không lưu password gốc.
  const passwordHash = await bcrypt.hash(password, 10);

  return authRepository.createUser({
    fullName: normalizedFullName,
    username: normalizedUsername,
    passwordHash,
  });
};

const login = async ({ username, password }) => {
  const normalizedUsername = username?.trim();

  if (!normalizedUsername || !password) {
    const error = new Error('Username and password required');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const user = await authRepository.findUserByUsername(normalizedUsername);
  const isValidPassword = user && (await bcrypt.compare(password, user.password));

  if (!isValidPassword) {
    const error = new Error('Wrong username or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  // Payload có role để các middleware RBAC kiểm tra nhanh trên route protected.
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, env.jwtSecret, { expiresIn: '1h' });
};

const getProfile = async (userId) => {
  const user = await authRepository.findProfileById(userId);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  return user;
};

module.exports = {
  getProfile,
  login,
  register,
};

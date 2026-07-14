const express = require('express');
const authController = require('./auth.controller');
const { authenticateToken } = require('../../middlewares/authenticateToken');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.me);

module.exports = { authRouter: router };

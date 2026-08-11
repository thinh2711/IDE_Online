const express = require('express');
const { authenticateToken } = require('../../middlewares/authenticateToken');
const { authorizeRoles } = require('../../middlewares/authorizeRoles');
const usersController = require('./users.controller');

const router = express.Router();

router.get('/users/coders', authenticateToken, authorizeRoles('admin', 'viewer'), usersController.listCoders);
router.get('/users', authenticateToken, authorizeRoles('admin'), usersController.listUsers);
router.patch('/users/:id/role', authenticateToken, authorizeRoles('admin'), usersController.changeUserRole);

module.exports = { usersRouter: router };

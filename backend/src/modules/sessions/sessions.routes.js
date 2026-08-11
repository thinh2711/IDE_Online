const express = require('express');
const { authenticateToken } = require('../../middlewares/authenticateToken');
const { authorizeRoles } = require('../../middlewares/authorizeRoles');
const sessionsController = require('./sessions.controller');

const router = express.Router();

router.get('/sessions', authenticateToken, authorizeRoles('admin', 'coder'), sessionsController.listSessions);
router.post('/sessions', authenticateToken, authorizeRoles('admin', 'coder', 'viewer'), sessionsController.createSession);
router.post('/sessions/join', authenticateToken, authorizeRoles('admin', 'coder', 'viewer'), sessionsController.joinSession);
router.get('/sessions/:id', authenticateToken, authorizeRoles('admin', 'coder'), sessionsController.getSession);
router.patch('/sessions/:id/end', authenticateToken, authorizeRoles('admin', 'coder'), sessionsController.endSession);

module.exports = { sessionsRouter: router };

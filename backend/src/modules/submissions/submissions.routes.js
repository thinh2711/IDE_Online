const express = require('express');
const { authenticateToken } = require('../../middlewares/authenticateToken');
const { authorizeRoles } = require('../../middlewares/authorizeRoles');
const submissionsController = require('./submissions.controller');

const router = express.Router();

router.post('/submissions/run', authenticateToken, authorizeRoles('admin', 'coder'), submissionsController.runSubmission);
router.get('/submissions', authenticateToken, authorizeRoles('admin', 'coder'), submissionsController.listSubmissions);
router.get('/submissions/:id', authenticateToken, authorizeRoles('admin', 'coder'), submissionsController.getSubmission);

module.exports = { submissionsRouter: router };

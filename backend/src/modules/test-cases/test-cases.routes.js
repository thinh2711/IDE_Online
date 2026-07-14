const express = require('express');
const { authenticateToken } = require('../../middlewares/authenticateToken');
const { authorizeRoles } = require('../../middlewares/authorizeRoles');
const testCasesController = require('./test-cases.controller');

const router = express.Router();

router.get('/questions/:id/test-cases', authenticateToken, authorizeRoles('admin'), testCasesController.listTestCasesByQuestion);
router.post('/questions/:id/test-cases', authenticateToken, authorizeRoles('admin'), testCasesController.createTestCase);
router.patch('/test-cases/:id', authenticateToken, authorizeRoles('admin'), testCasesController.updateTestCase);
router.delete('/test-cases/:id', authenticateToken, authorizeRoles('admin'), testCasesController.deleteTestCase);

module.exports = { testCasesRouter: router };

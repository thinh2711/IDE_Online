const express = require('express');
const { authenticateToken } = require('../../middlewares/authenticateToken');
const { authorizeRoles } = require('../../middlewares/authorizeRoles');
const questionsController = require('./questions.controller');

const router = express.Router();

router.get('/questions', authenticateToken, questionsController.listQuestions);
router.get('/questions/:id', authenticateToken, questionsController.getQuestion);
router.post('/questions', authenticateToken, authorizeRoles('admin'), questionsController.createQuestion);
router.patch('/questions/:id', authenticateToken, authorizeRoles('admin'), questionsController.updateQuestion);
router.delete('/questions/:id', authenticateToken, authorizeRoles('admin'), questionsController.deleteQuestion);

module.exports = { questionsRouter: router };

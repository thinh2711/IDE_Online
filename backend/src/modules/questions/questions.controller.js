const questionsService = require('./questions.service');

const listQuestions = async (req, res, next) => {
  try {
    const questions = await questionsService.listQuestions();
    res.status(200).json({ questions });
  } catch (error) {
    next(error);
  }
};

const getQuestion = async (req, res, next) => {
  try {
    const question = await questionsService.getQuestion(req.params.id);
    res.status(200).json({ question });
  } catch (error) {
    next(error);
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const question = await questionsService.createQuestion({
      body: req.body,
      userId: req.user.id,
    });

    res.status(201).json({
      message: 'Question created successfully',
      question,
    });
  } catch (error) {
    next(error);
  }
};

const updateQuestion = async (req, res, next) => {
  try {
    const question = await questionsService.updateQuestion({
      id: req.params.id,
      body: req.body,
    });

    res.status(200).json({
      message: 'Question updated successfully',
      question,
    });
  } catch (error) {
    next(error);
  }
};

const deleteQuestion = async (req, res, next) => {
  try {
    const question = await questionsService.deleteQuestion(req.params.id);

    res.status(200).json({
      message: 'Question deleted successfully',
      question,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuestion,
  deleteQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
};

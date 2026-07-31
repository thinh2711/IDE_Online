const testCasesService = require('./test-cases.service');

const listTestCasesByQuestion = async (req, res, next) => {
  try {
    const testCases = await testCasesService.listTestCasesByQuestion({
      questionId: req.params.id,
      role: req.user?.role,
    });
    res.status(200).json({ testCases });
  } catch (error) {
    next(error);
  }
};

const createTestCase = async (req, res, next) => {
  try {
    const testCase = await testCasesService.createTestCase({
      questionId: req.params.id,
      body: req.body,
    });

    res.status(201).json({
      message: 'Test case created successfully',
      testCase,
    });
  } catch (error) {
    next(error);
  }
};

const updateTestCase = async (req, res, next) => {
  try {
    const testCase = await testCasesService.updateTestCase({
      id: req.params.id,
      body: req.body,
    });

    res.status(200).json({
      message: 'Test case updated successfully',
      testCase,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTestCase = async (req, res, next) => {
  try {
    const testCase = await testCasesService.deleteTestCase(req.params.id);

    res.status(200).json({
      message: 'Test case deleted successfully',
      testCase,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTestCase,
  deleteTestCase,
  listTestCasesByQuestion,
  updateTestCase,
};

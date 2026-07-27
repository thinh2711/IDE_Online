const submissionsService = require('./submissions.service');

const runSubmission = async (req, res, next) => {
  try {
    const submission = await submissionsService.runSubmission({
      body: req.body,
      user: req.user,
    });

    res.status(201).json({
      message: 'Submission skeleton created',
      submission,
    });
  } catch (error) {
    next(error);
  }
};

const listSubmissions = async (req, res, next) => {
  try {
    const submissions = await submissionsService.listSubmissions({
      user: req.user,
    });

    res.status(200).json({ submissions });
  } catch (error) {
    next(error);
  }
};

const getSubmission = async (req, res, next) => {
  try {
    const submission = await submissionsService.getSubmission({
      id: req.params.id,
      user: req.user,
    });

    res.status(200).json({ submission });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubmission,
  listSubmissions,
  runSubmission,
};

const sessionsService = require('./sessions.service');

const createSession = async (req, res, next) => {
  try {
    const session = await sessionsService.createSession({
      body: req.body,
      user: req.user,
    });

    res.status(201).json({
      message: 'Session created',
      session,
    });
  } catch (error) {
    next(error);
  }
};

const listSessions = async (req, res, next) => {
  try {
    const sessions = await sessionsService.listSessions({
      user: req.user,
    });

    res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
};

const getSession = async (req, res, next) => {
  try {
    const data = await sessionsService.getSession({
      id: req.params.id,
      user: req.user,
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const joinSession = async (req, res, next) => {
  try {
    const data = await sessionsService.joinSession({
      body: req.body,
      user: req.user,
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

const endSession = async (req, res, next) => {
  try {
    const session = await sessionsService.endSession({
      id: req.params.id,
      user: req.user,
    });

    res.status(200).json({
      message: 'Session ended',
      session,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  endSession,
  getSession,
  joinSession,
  listSessions,
};

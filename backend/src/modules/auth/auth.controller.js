const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const accessToken = await authService.login(req.body);
    res.status(200).json({ message: 'Login successful', accessToken });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);

    res.status(200).json({
      message: 'You have accessed a protected route!',
      user,
      traceId: req.traceId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  me,
  register,
};

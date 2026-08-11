const usersService = require('./users.service');

const listUsers = async (req, res, next) => {
  try {
    const users = await usersService.listUsers();
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

const listCoders = async (req, res, next) => {
  try {
    const users = await usersService.listCoders();
    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

const changeUserRole = async (req, res, next) => {
  try {
    const user = await usersService.changeUserRole({
      requesterId: req.user.id,
      targetUserId: req.params.id,
      role: req.body.role,
    });

    res.status(200).json({
      message: 'User role updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  changeUserRole,
  listCoders,
  listUsers,
};

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

// Bảo vệ các route yêu cầu Bearer access token.
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing access token' } });
  }

  jwt.verify(token, env.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Invalid or expired token' } });
    }

    // Controller phía sau đọc user id đã xác thực từ req.user.
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };

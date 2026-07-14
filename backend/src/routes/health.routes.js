const express = require('express');

const router = express.Router();

// Docker và smoke test local có thể dùng endpoint này để kiểm tra API còn sống.
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

module.exports = { healthRouter: router };

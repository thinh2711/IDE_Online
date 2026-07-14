// Thêm trace id nhẹ để đối chiếu log với response API.
const logger = (req, res, next) => {
  req.traceId = Math.random().toString(36).substring(2, 10);
  console.log(`[${new Date().toISOString()}] [Trace: ${req.traceId}] ${req.method} ${req.url}`);
  next();
};

module.exports = { logger };

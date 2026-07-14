const { pool } = require('../../config/db');

const findAllUsers = async () => {
  const result = await pool.query(
    'SELECT id, full_name, username, role, created_at FROM users ORDER BY created_at DESC, id DESC'
  );

  return result.rows;
};

const findUserById = async (id) => {
  const result = await pool.query(
    'SELECT id, full_name, username, role, created_at FROM users WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
};

const updateUserRole = async ({ id, role }) => {
  const result = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, username, role, created_at',
    [role, id]
  );

  return result.rows[0] || null;
};

module.exports = {
  findAllUsers,
  findUserById,
  updateUserRole,
};

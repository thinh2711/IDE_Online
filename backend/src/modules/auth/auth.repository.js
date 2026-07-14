const { pool } = require('../../config/db');

// Lớp repository chịu trách nhiệm SQL và trả về record user thuần.
const createUser = async ({ fullName, username, passwordHash }) => {
  const result = await pool.query(
    "INSERT INTO users (full_name, username, password, role) VALUES ($1, $2, $3, 'coder') RETURNING id, full_name, username, role, created_at",
    [fullName, username, passwordHash]
  );

  return result.rows[0];
};

const findUserByUsername = async (username) => {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
};

// Query profile cố ý không trả password hash.
const findProfileById = async (id) => {
  const result = await pool.query(
    'SELECT id, full_name, username, role, created_at FROM users WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
};

module.exports = {
  createUser,
  findProfileById,
  findUserByUsername,
};

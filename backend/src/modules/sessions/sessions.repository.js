const { pool } = require('../../config/db');

const mapSessionSelect = `
  s.id, s.coder_id, s.question_id, s.join_code, s.status, s.created_at, s.ended_at,
  q.title AS question_title, q.description AS question_description,
  q.difficulty AS question_difficulty, q.sample_input AS question_sample_input,
  q.sample_output AS question_sample_output,
  u.username AS coder_username
`;

const createSession = async ({ coderId, questionId, joinCode }) => {
  const result = await pool.query(
    `INSERT INTO sessions (coder_id, question_id, join_code)
     VALUES ($1, $2, $3)
     RETURNING id, coder_id, question_id, join_code, status, created_at, ended_at`,
    [coderId, questionId, joinCode]
  );

  return result.rows[0];
};

const findSessionById = async (id) => {
  const result = await pool.query(
    `SELECT ${mapSessionSelect}
     FROM sessions s
     LEFT JOIN questions q ON q.id = s.question_id
     LEFT JOIN users u ON u.id = s.coder_id
     WHERE s.id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

const findSessionByJoinCode = async (joinCode) => {
  const result = await pool.query(
    `SELECT ${mapSessionSelect}
     FROM sessions s
     LEFT JOIN questions q ON q.id = s.question_id
     LEFT JOIN users u ON u.id = s.coder_id
     WHERE s.join_code = $1`,
    [joinCode]
  );

  return result.rows[0] || null;
};

const findSessionsForUser = async ({ role, userId }) => {
  const isAdmin = role === 'admin';
  const result = await pool.query(
    `SELECT ${mapSessionSelect}
     FROM sessions s
     LEFT JOIN questions q ON q.id = s.question_id
     LEFT JOIN users u ON u.id = s.coder_id
     WHERE ($1::boolean = true OR s.coder_id = $2)
     ORDER BY s.created_at DESC, s.id DESC
     LIMIT 30`,
    [isAdmin, userId]
  );

  return result.rows;
};

const findSubmissionsForSession = async (sessionId) => {
  const result = await pool.query(
    `SELECT s.id, s.user_id, s.question_id, s.session_id, s.language, s.source_code,
       s.stdin, s.stdout, s.stderr, s.status, s.execution_time, s.memory_kb,
       s.created_at, q.title AS question_title, u.username AS submitted_by
     FROM submissions s
     LEFT JOIN questions q ON q.id = s.question_id
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.session_id = $1
     ORDER BY s.created_at DESC, s.id DESC
     LIMIT 30`,
    [sessionId]
  );

  return result.rows;
};

const endSession = async (id) => {
  const result = await pool.query(
    `UPDATE sessions
     SET status = 'ended',
         ended_at = COALESCE(ended_at, CURRENT_TIMESTAMP)
     WHERE id = $1
     RETURNING id, coder_id, question_id, join_code, status, created_at, ended_at`,
    [id]
  );

  return result.rows[0] || null;
};

module.exports = {
  createSession,
  endSession,
  findSessionById,
  findSessionByJoinCode,
  findSessionsForUser,
  findSubmissionsForSession,
};

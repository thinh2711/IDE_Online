const { pool } = require('../../config/db');

const createSubmission = async ({
  userId,
  questionId = null,
  sessionId = null,
  language,
  sourceCode,
  stdin = '',
  stdout = null,
  stderr = null,
  status,
  executionTime = null,
  memoryKb = null,
  judge0Payload = null,
}) => {
  const result = await pool.query(
    `INSERT INTO submissions (
       user_id, question_id, session_id, language, source_code, stdin,
       stdout, stderr, status, execution_time, memory_kb, judge0_payload
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, user_id, question_id, session_id, language, source_code, stdin,
       stdout, stderr, status, execution_time, memory_kb, judge0_payload, created_at`,
    [
      userId,
      questionId,
      sessionId,
      language,
      sourceCode,
      stdin,
      stdout,
      stderr,
      status,
      executionTime,
      memoryKb,
      judge0Payload,
    ]
  );

  return result.rows[0];
};

const findSubmissionById = async (id) => {
  const result = await pool.query(
    `SELECT id, user_id, question_id, session_id, language, source_code, stdin,
       stdout, stderr, status, execution_time, memory_kb, judge0_payload, created_at
     FROM submissions
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

const findSubmissionsForUser = async ({ userId, role }) => {
  const isAdmin = role === 'admin';
  const result = await pool.query(
    `SELECT id, user_id, question_id, session_id, language, status,
       execution_time, memory_kb, created_at
     FROM submissions
     WHERE ($1::boolean = true OR user_id = $2)
     ORDER BY created_at DESC, id DESC
     LIMIT 50`,
    [isAdmin, userId]
  );

  return result.rows;
};

module.exports = {
  createSubmission,
  findSubmissionById,
  findSubmissionsForUser,
};

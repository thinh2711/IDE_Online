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
    `SELECT s.id, s.user_id, s.question_id, s.session_id, s.language, s.source_code, s.stdin,
       s.stdout, s.stderr, s.status, s.execution_time, s.memory_kb, s.judge0_payload, s.created_at,
       q.title AS question_title, q.sample_output AS expected_output, u.username AS submitted_by
     FROM submissions s
     LEFT JOIN questions q ON q.id = s.question_id
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

const findSubmissionsForUser = async ({ userId, role }) => {
  const isAdmin = role === 'admin';
  const result = await pool.query(
    `SELECT s.id, s.user_id, s.question_id, s.session_id, s.language, s.status,
       s.execution_time, s.memory_kb, s.created_at, q.title AS question_title,
       u.username AS submitted_by
     FROM submissions s
     LEFT JOIN questions q ON q.id = s.question_id
     LEFT JOIN users u ON u.id = s.user_id
     WHERE ($1::boolean = true OR s.user_id = $2)
     ORDER BY s.created_at DESC, s.id DESC
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

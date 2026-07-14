const { pool } = require('../../config/db');

const createQuestion = async ({ title, description, difficulty, sampleInput, sampleOutput, createdBy }) => {
  const result = await pool.query(
    `INSERT INTO questions (title, description, difficulty, sample_input, sample_output, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, description, difficulty, sample_input, sample_output, created_by, created_at, updated_at`,
    [title, description, difficulty, sampleInput, sampleOutput, createdBy]
  );

  return result.rows[0];
};

const findAllQuestions = async () => {
  const result = await pool.query(
    `SELECT id, title, difficulty, sample_input, sample_output, created_by, created_at, updated_at
     FROM questions
     ORDER BY created_at DESC, id DESC`
  );

  return result.rows;
};

const findQuestionById = async (id) => {
  const result = await pool.query(
    `SELECT id, title, description, difficulty, sample_input, sample_output, created_by, created_at, updated_at
     FROM questions
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

const updateQuestion = async ({ id, title, description, difficulty, sampleInput, sampleOutput }) => {
  const result = await pool.query(
    `UPDATE questions
     SET title = $1,
         description = $2,
         difficulty = $3,
         sample_input = $4,
         sample_output = $5,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING id, title, description, difficulty, sample_input, sample_output, created_by, created_at, updated_at`,
    [title, description, difficulty, sampleInput, sampleOutput, id]
  );

  return result.rows[0] || null;
};

const deleteQuestion = async (id) => {
  const result = await pool.query(
    'DELETE FROM questions WHERE id = $1 RETURNING id, title, description, difficulty, sample_input, sample_output, created_by, created_at, updated_at',
    [id]
  );

  return result.rows[0] || null;
};

module.exports = {
  createQuestion,
  deleteQuestion,
  findAllQuestions,
  findQuestionById,
  updateQuestion,
};

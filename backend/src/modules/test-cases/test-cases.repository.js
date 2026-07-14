const { pool } = require('../../config/db');

const createTestCase = async ({ questionId, input, expectedOutput, isHidden, sortOrder }) => {
  const result = await pool.query(
    `INSERT INTO test_cases (question_id, input, expected_output, is_hidden, sort_order)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, question_id, input, expected_output, is_hidden, sort_order, created_at`,
    [questionId, input, expectedOutput, isHidden, sortOrder]
  );

  return result.rows[0];
};

const findTestCasesByQuestionId = async (questionId) => {
  const result = await pool.query(
    `SELECT id, question_id, input, expected_output, is_hidden, sort_order, created_at
     FROM test_cases
     WHERE question_id = $1
     ORDER BY sort_order ASC, id ASC`,
    [questionId]
  );

  return result.rows;
};

const findTestCaseById = async (id) => {
  const result = await pool.query(
    `SELECT id, question_id, input, expected_output, is_hidden, sort_order, created_at
     FROM test_cases
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

const updateTestCase = async ({ id, input, expectedOutput, isHidden, sortOrder }) => {
  const result = await pool.query(
    `UPDATE test_cases
     SET input = $1,
         expected_output = $2,
         is_hidden = $3,
         sort_order = $4
     WHERE id = $5
     RETURNING id, question_id, input, expected_output, is_hidden, sort_order, created_at`,
    [input, expectedOutput, isHidden, sortOrder, id]
  );

  return result.rows[0] || null;
};

const deleteTestCase = async (id) => {
  const result = await pool.query(
    `DELETE FROM test_cases
     WHERE id = $1
     RETURNING id, question_id, input, expected_output, is_hidden, sort_order, created_at`,
    [id]
  );

  return result.rows[0] || null;
};

module.exports = {
  createTestCase,
  deleteTestCase,
  findTestCaseById,
  findTestCasesByQuestionId,
  updateTestCase,
};

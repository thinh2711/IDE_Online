const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:secretpassword@db:5432/auth_db',
});

const problems = [
  {
    title: 'Sum of Two Numbers',
    difficulty: 'easy',
    description: 'Given two integers a and b, print their sum.',
    sampleInput: '2 3',
    sampleOutput: '5',
  },
  {
    title: 'Maximum of Three Numbers',
    difficulty: 'easy',
    description: 'Given three integers, print the largest value.',
    sampleInput: '3 8 1',
    sampleOutput: '8',
  },
  {
    title: 'Reverse String',
    difficulty: 'easy',
    description: 'Given a string without spaces, print the reversed string.',
    sampleInput: 'hello',
    sampleOutput: 'olleh',
  },
  {
    title: 'Count Vowels',
    difficulty: 'easy',
    description: 'Count the vowels (a, e, i, o, u) in an English string. Ignore case.',
    sampleInput: 'Education',
    sampleOutput: '5',
  },
  {
    title: 'Palindrome Number',
    difficulty: 'easy',
    description: 'Determine whether a non-negative integer is a palindrome. Print YES or NO.',
    sampleInput: '121',
    sampleOutput: 'YES',
  },
  {
    title: 'Count Even Numbers',
    difficulty: 'easy',
    description: 'Given an array of integers, count how many elements are even.',
    sampleInput: '5\n1 2 3 4 6',
    sampleOutput: '3',
  },
  {
    title: 'Greatest Common Divisor',
    difficulty: 'easy',
    description: 'Given two positive integers, print their greatest common divisor.',
    sampleInput: '24 36',
    sampleOutput: '12',
  },
  {
    title: 'Linear Search',
    difficulty: 'easy',
    description: 'Given an array and a target value, print the index of the first occurrence or -1 if not found.',
    sampleInput: '5\n1 4 7 9 10\n7',
    sampleOutput: '2',
  },
  {
    title: 'Binary Search',
    difficulty: 'medium',
    description: 'Given a sorted array and a target value, return its index or -1 if it does not exist.',
    sampleInput: '5\n1 3 5 7 9\n7',
    sampleOutput: '3',
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'medium',
    description: 'Determine whether a string containing only (), {}, and [] is valid.',
    sampleInput: '([]{})',
    sampleOutput: 'YES',
  },
  {
    title: 'Rotate Array',
    difficulty: 'medium',
    description: 'Rotate an array to the right by k positions.',
    sampleInput: '5 2\n1 2 3 4 5',
    sampleOutput: '4 5 1 2 3',
  },
  {
    title: 'Merge Sorted Arrays',
    difficulty: 'medium',
    description: 'Merge two sorted arrays into one sorted array.',
    sampleInput: '3 3\n1 4 7\n2 5 8',
    sampleOutput: '1 2 4 5 7 8',
  },
  {
    title: 'Two Sum',
    difficulty: 'medium',
    description: 'Find the indices of two numbers whose sum equals the target.',
    sampleInput: '4\n2 7 11 15\n9',
    sampleOutput: '0 1',
  },
  {
    title: 'Number of Islands',
    difficulty: 'hard',
    description: 'Given a binary grid, count the number of connected islands.',
    sampleInput: '3 3\n111\n010\n111',
    sampleOutput: '1',
  },
  {
    title: 'Shortest Path in Grid',
    difficulty: 'hard',
    description: 'Find the shortest path from the top-left corner to the bottom-right corner in a grid with obstacles.',
    sampleInput: '3 3\n000\n010\n000',
    sampleOutput: '4',
  },
];

const upsertProblem = async (client, problem) => {
  const existing = await client.query(
    'SELECT id FROM questions WHERE title = $1 ORDER BY id ASC LIMIT 1',
    [problem.title]
  );

  let questionId;
  let action;

  if (existing.rows[0]) {
    questionId = existing.rows[0].id;
    action = 'updated';
    await client.query(
      `UPDATE questions
       SET description = $1,
           difficulty = $2,
           sample_input = $3,
           sample_output = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [problem.description, problem.difficulty, problem.sampleInput, problem.sampleOutput, questionId]
    );
  } else {
    action = 'inserted';
    const inserted = await client.query(
      `INSERT INTO questions (title, description, difficulty, sample_input, sample_output, created_by)
       VALUES ($1, $2, $3, $4, $5, NULL)
       RETURNING id`,
      [problem.title, problem.description, problem.difficulty, problem.sampleInput, problem.sampleOutput]
    );
    questionId = inserted.rows[0].id;
  }

  const testCase = await client.query(
    `SELECT id
     FROM test_cases
     WHERE question_id = $1 AND input = $2 AND expected_output = $3
     LIMIT 1`,
    [questionId, problem.sampleInput, problem.sampleOutput]
  );

  if (!testCase.rows[0]) {
    await client.query(
      `INSERT INTO test_cases (question_id, input, expected_output, is_hidden, sort_order)
       VALUES ($1, $2, $3, false, 0)`,
      [questionId, problem.sampleInput, problem.sampleOutput]
    );
  } else {
    await client.query(
      `UPDATE test_cases
       SET is_hidden = false,
           sort_order = 0
       WHERE id = $1`,
      [testCase.rows[0].id]
    );
  }

  return { action, id: questionId, title: problem.title };
};

const main = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const results = [];
    for (const problem of problems) {
      results.push(await upsertProblem(client, problem));
    }

    await client.query('COMMIT');

    for (const result of results) {
      console.log(`${result.action}: #${result.id} ${result.title}`);
    }
    console.log(`Done. Seeded ${results.length} problems.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

main();

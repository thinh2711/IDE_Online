const { Pool } = require('pg');

// Mặc định kết nối qua service name `db` trong Docker Compose.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:secretpassword@db:5432/auth_db'
});

const initDB = async () => {
  try {
    // Tạo bảng cho database mới.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(120),
        username VARCHAR(50),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'coder',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration nhẹ cho các volume local đã tồn tại.
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(120);');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);');
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'coder';");

    // Backfill dữ liệu từ schema cũ từng dùng cột email/name.
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'email'
        ) THEN
          EXECUTE 'UPDATE users SET username = email WHERE username IS NULL';
          EXECUTE 'ALTER TABLE users ALTER COLUMN email DROP NOT NULL';
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'name'
        ) THEN
          EXECUTE 'UPDATE users SET full_name = name WHERE full_name IS NULL';
          EXECUTE 'ALTER TABLE users ALTER COLUMN name DROP NOT NULL';
        END IF;
      END $$;
    `);

    // Đảm bảo các dòng cũ vẫn thỏa điều kiện username NOT NULL/unique hiện tại.
    await pool.query("UPDATE users SET full_name = username WHERE full_name IS NULL;");
    await pool.query("UPDATE users SET username = 'user_' || id WHERE username IS NULL;");
    await pool.query("UPDATE users SET role = 'coder' WHERE role IS NULL;");
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username);');
    await pool.query('ALTER TABLE users ALTER COLUMN username SET NOT NULL;');
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
        ) THEN
          ALTER TABLE users
          ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'coder', 'viewer'));
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        difficulty VARCHAR(20) NOT NULL DEFAULT 'easy',
        sample_input TEXT,
        sample_output TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT questions_difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard'))
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        input TEXT,
        expected_output TEXT NOT NULL,
        is_hidden BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        coder_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
        join_code VARCHAR(32) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        CONSTRAINT sessions_status_check CHECK (status IN ('active', 'ended'))
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
        session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
        language VARCHAR(50) NOT NULL,
        source_code TEXT NOT NULL,
        stdin TEXT,
        stdout TEXT,
        expected_output TEXT,
        stderr TEXT,
        status VARCHAR(50) NOT NULL,
        execution_time NUMERIC(10, 3),
        memory_kb INTEGER,
        judge0_payload JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query('CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);');
    await pool.query('ALTER TABLE sessions ALTER COLUMN coder_id DROP NOT NULL;');
    await pool.query('ALTER TABLE submissions ADD COLUMN IF NOT EXISTS expected_output TEXT;');
    await pool.query('CREATE INDEX IF NOT EXISTS questions_created_by_idx ON questions(created_by);');
    await pool.query('CREATE INDEX IF NOT EXISTS questions_difficulty_idx ON questions(difficulty);');
    await pool.query('CREATE INDEX IF NOT EXISTS test_cases_question_id_idx ON test_cases(question_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS sessions_coder_status_idx ON sessions(coder_id, status);');
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS sessions_join_code_unique ON sessions(join_code);');
    await pool.query('CREATE INDEX IF NOT EXISTS submissions_user_created_idx ON submissions(user_id, created_at DESC);');
    await pool.query('CREATE INDEX IF NOT EXISTS submissions_question_created_idx ON submissions(question_id, created_at DESC);');
    await pool.query('CREATE INDEX IF NOT EXISTS submissions_session_created_idx ON submissions(session_id, created_at DESC);');
    await pool.query('CREATE INDEX IF NOT EXISTS submissions_status_idx ON submissions(status);');
    console.log('[DB] Database schema initialized successfully.');
  } catch (err) {
    console.error('[DB] Error initializing database:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, initDB };

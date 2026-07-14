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
    console.log('[DB] Table "users" initialized successfully.');
  } catch (err) {
    console.error('[DB] Error initializing database:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, initDB };

const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  try {
    const sql = `
      -- 1. USERS
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- 2. HABITS
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'General',
        color VARCHAR(30) DEFAULT '#5b4ef5',
        type VARCHAR(20) DEFAULT 'boolean',
        target_value INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- 3. HABIT LOGS
      CREATE TABLE IF NOT EXISTS habit_logs (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
        log_date DATE DEFAULT CURRENT_DATE,
        current_value INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        UNIQUE(habit_id, log_date)
      );

      -- 4. SESSIONS
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);

      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey') THEN
          ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
        END IF;
      END $$;

      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `;

    await pool.query(sql);
    console.log('✅ Database architecture initialized');
  } catch (err) {
    console.error('❌ DB Init Failed:', err.message);
  }
}

initDb();

module.exports = { pool };
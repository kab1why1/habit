const { Pool } = require('pg');

// Check if we are in production (for Heroku/Render deployment later)
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
      -- 1. USERS TABLE (Added XP and Level)
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- 2. HABITS TABLE (The "Blueprint")
      -- We removed 'completed' because completion depends on the specific date now.
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'General',
        color VARCHAR(30) DEFAULT '#5b4ef5',
        type VARCHAR(20) DEFAULT 'boolean', -- 'boolean' (yes/no) or 'numeric' (counter)
        target_value INTEGER DEFAULT 1,     -- e.g. 1 for boolean, 10 for "10 pages"
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- 3. HABIT LOGS TABLE (The "History")
      -- Records progress for a specific habit on a specific date.
      CREATE TABLE IF NOT EXISTS habit_logs (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
        log_date DATE DEFAULT CURRENT_DATE,
        current_value INTEGER DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        UNIQUE(habit_id, log_date) -- Prevents duplicate entries for the same day
      );
    `;

    await pool.query(sql);
    console.log('✅ Database architecture initialized successfully');

  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
  }
}

async function testConnection() {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('Database connected:', new Date().toISOString());
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Unable to connect to the database:', err.message || err);
    throw err;
  }

}

// Run initialization immediately
initDb();

module.exports = { pool };
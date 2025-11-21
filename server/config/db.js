// server/config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Optional helper to run queries with automatic error handling
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // console.log('executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('DB Query Error', err);
    throw err;
  }
}

// function to test DB connectivity (call before starting the app)
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

module.exports = {
  pool,
  query,
  testConnection,
};

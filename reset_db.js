// reset_db.js
require('dotenv').config();
const { pool } = require('./server/config/db');

async function reset() {
  try {
    console.log('🗑️ Dropping old tables...');
    // Order matters: Drop logs first (depends on habits), then habits (depends on users), then users.
    await pool.query('DROP TABLE IF EXISTS habit_logs CASCADE');
    await pool.query('DROP TABLE IF EXISTS habits CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('✅ Tables dropped. Restart your server to rebuild them.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

reset();
const { query } = require('../config/db');

// Create users table if it doesn't exist
async function createUsersTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  return query(sql);
}

// Insert a new user
async function createUser({ username, password, is_admin = false }) {
  const sql = `
    INSERT INTO users (username, password, is_admin)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const params = [username, password, is_admin];
  const result = await query(sql, params);
  return result.rows[0];
}

// Find a user by username
async function findByUsername(username) {
  const sql = `SELECT * FROM users WHERE username = $1`;
  const result = await query(sql, [username]);
  return result.rows[0];
}

module.exports = {
  createUsersTable,
  createUser,
  findByUsername,
};

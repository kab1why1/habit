// server/models/user.js
const { query } = require('../config/db');
const bcrypt = require('bcrypt');

// Ensure table creation function (if you already had it keep it)
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

async function createUser({ username, password, is_admin = false }) {
  // assume password may already be hashed in some callers; caller can pass hashed or plain
  // here we check: if password looks short (<=60) we still will hash — safe approach:
  const hashed = await bcrypt.hash(password, 10);
  const sql = `
    INSERT INTO users (username, password, is_admin)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const result = await query(sql, [username, hashed, is_admin]);
  return result.rows[0];
}

async function findByUsername(username) {
  const sql = `SELECT * FROM users WHERE username = $1`;
  const result = await query(sql, [username]);
  return result.rows[0];
}

async function getUserById(id) {
  const sql = `SELECT id, username, is_admin, created_at FROM users WHERE id = $1`;
  const result = await query(sql, [id]);
  return result.rows[0];
}

async function updateUser(id, { username, password }) {
  // If password provided, hash it
  if (password && password.length > 0) {
    const hashed = await bcrypt.hash(password, 10);
    const sql = `UPDATE users SET username=$1, password=$2 WHERE id=$3 RETURNING id, username, is_admin`;
    const result = await query(sql, [username, hashed, id]);
    return result.rows[0];
  } else {
    const sql = `UPDATE users SET username=$1 WHERE id=$2 RETURNING id, username, is_admin`;
    const result = await query(sql, [username, id]);
    return result.rows[0];
  }
}

module.exports = {
  createUsersTable,
  createUser,
  findByUsername,
  getUserById,
  updateUser,
};

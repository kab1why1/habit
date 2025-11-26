// server/models/user.js
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

// ----------------------------------------
// Create users table
// ----------------------------------------
async function createUsersTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await pool.query(sql);
}

// ----------------------------------------
// Create new user
// ----------------------------------------
async function createUser({ username, password, role = 'user' }) {
  if (!username) throw new Error('Username is required');
  if (!password) throw new Error('Password is required');

  const hashed = await bcrypt.hash(password, 10);
  const sql = `
    INSERT INTO users (username, password, role)
    VALUES ($1, $2, $3)
    RETURNING id, username, role, created_at;
  `;
  const { rows } = await pool.query(sql, [username, hashed, role]);
  return rows[0];
}


// ----------------------------------------
// Get user by ID
// ----------------------------------------
async function getUserById(id) {
  const { rows } = await pool.query(
    'SELECT id, username, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
}

// ----------------------------------------
// Get full user (including password) by username
// ----------------------------------------
async function getUserByUsername(username) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  return rows[0];
}

// ----------------------------------------
// Get all users (admin panel)
// ----------------------------------------
async function getAllUsers() {
  const { rows } = await pool.query(
    'SELECT id, username, role, created_at FROM users ORDER BY id ASC'
  );
  return rows;
}

// ----------------------------------------
// Update user — SIMPLE version
// Router handles hashing, we only update DB
// ----------------------------------------
async function updateUser(id, { username, password, role }) {
  const sql = `
    UPDATE users
    SET username = $1,
        password = $2,
        role = $3
    WHERE id = $4
    RETURNING id, username, role, created_at;
  `;

  const { rows } = await pool.query(sql, [username, password, role, id]);
  return rows[0];
}

// ----------------------------------------
// Delete user + their habits
// ----------------------------------------
async function deleteUser(userId) {
  try {
    await pool.query('DELETE FROM habits WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  } catch (err) {
    console.error('deleteUser error', err);
    throw err;
  }
}

module.exports = {
  createUsersTable,
  createUser,
  getUserById,
  getUserByUsername,
  getAllUsers,
  updateUser,
  deleteUser,
};

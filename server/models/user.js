const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

// Create a new user
async function createUser(username, password, role = 'user') {
  const hashed = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *',
    [username, hashed, role]
  );
  return result.rows[0];
}

// Get user by username
async function getUserByUsername(username) {
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0];
}

// Get user by ID
async function getUserById(id) {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

// Update user info
async function updateUser(id, username, password) {
  if (password && password.length > 0) {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET username = $1, password = $2 WHERE id = $3',
      [username, hashed, id]
    );
  } else {
    await pool.query(
      'UPDATE users SET username = $1 WHERE id = $2',
      [username, id]
    );
  }
}

module.exports = {
  createUser,
  getUserByUsername,
  getUserById,
  updateUser
};

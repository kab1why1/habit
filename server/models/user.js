const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

async function createUsersTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(query);
}

async function createUser({ username, password, role = 'user' }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *';
  const values = [username, hashedPassword, role];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getUserById(id) {
  const query = 'SELECT * FROM users WHERE id = $1';
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}

async function getUserByUsername(username) {
  const query = 'SELECT * FROM users WHERE username = $1';
  const { rows } = await pool.query(query, [username]);
  return rows[0];
}

module.exports = {
  createUsersTable,
  createUser,
  getUserById,
  getUserByUsername,
};

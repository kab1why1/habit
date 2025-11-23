const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

async function createUsersTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'user'
    );
  `;
  await pool.query(query);
}

async function createUser(username, password, role = 'user') {
  const hash = await bcrypt.hash(password, 10);
  const query = `
    INSERT INTO users (username, password, role)
    VALUES ($1, $2, $3) RETURNING *
  `;
  const result = await pool.query(query, [username, hash, role]);
  return result.rows[0];
}

async function getUserById(id) {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

async function getUserByUsername(username) {
  const query = 'SELECT * FROM users WHERE username = $1';
  const result = await pool.query(query, [username]);
  return result.rows[0];
}

module.exports = {
  createUsersTable,
  createUser,
  getUserById,
  getUserByUsername,
};

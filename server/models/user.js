// server/models/user.js
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

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

// createUser accepts object { username, password, role } and returns created user
async function createUser({ username, password, role = 'user' }) {
  const hashed = await bcrypt.hash(password, 10);
  const sql = `
    INSERT INTO users (username, password, role)
    VALUES ($1, $2, $3)
    RETURNING id, username, role, created_at;
  `;
  const { rows } = await pool.query(sql, [username, hashed, role]);
  return rows[0];
}

async function getUserById(id) {
  const { rows } = await pool.query('SELECT id, username, role, created_at FROM users WHERE id = $1', [id]);
  return rows[0];
}

async function getUserByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0];
}

async function getAllUsers() {
  const { rows } = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id ASC');
  return rows;
}

// updateUser accepts id and fields object { username?, password?, role? }
async function updateUser(id, { username, password, role }) {
  // build dynamic query for only provided fields
  const set = [];
  const vals = [];
  let idx = 1;

  if (username !== undefined) {
    set.push(`username = $${idx++}`);
    vals.push(username);
  }
  if (password !== undefined && password !== null) {
    const hashed = await bcrypt.hash(password, 10);
    set.push(`password = $${idx++}`);
    vals.push(hashed);
  }
  if (role !== undefined) {
    set.push(`role = $${idx++}`);
    vals.push(role);
  }

  if (set.length === 0) {
    // nothing to update
    return getUserById(id);
  }

  const sql = `UPDATE users SET ${set.join(', ')} WHERE id = $${idx} RETURNING id, username, role, created_at`;
  vals.push(id);
  const { rows } = await pool.query(sql, vals);
  return rows[0];
}

async function deleteUser(userId) {
  try {
    // delete all habits of this user first
    await pool.query('DELETE FROM habits WHERE user_id = $1', [userId]);

    // then delete the user
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

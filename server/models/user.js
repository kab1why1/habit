const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

async function createUser({ username, password, role = 'user' }) {
  const hashed = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role`,
    [username, hashed, role]
  );
  return rows[0];
}

async function getUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}

async function getUserByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0];
}

// Update User (Hashes password only if changed)
async function updateUser(id, { username, password, role }) {
  let sql, params;
  if (password && password.trim() !== '') {
    const hashed = await bcrypt.hash(password, 10);
    sql = `UPDATE users SET username = $1, password = $2, role = $3 WHERE id = $4`;
    params = [username, hashed, role, id];
  } else {
    sql = `UPDATE users SET username = $1, role = $2 WHERE id = $3`;
    params = [username, role, id];
  }
  await pool.query(sql, params);
}

async function getAllUsers() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY id ASC');
  return rows;
}

async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

async function addXp(userId, amount) {
  const user = await getUserById(userId);
  if (!user) return;
  let newXp = user.xp + amount;
  let newLevel = user.level;
  if (newXp >= newLevel * 100) newLevel++;
  await pool.query('UPDATE users SET xp = $1, level = $2 WHERE id = $3', [newXp, newLevel, userId]);
}

async function getLeaderboard() {
  const { rows } = await pool.query('SELECT username, xp, level, created_at FROM users ORDER BY level DESC, xp DESC LIMIT 10');
  return rows;
}

module.exports = { createUser, getUserById, getUserByUsername, updateUser, getAllUsers, deleteUser, addXp, getLeaderboard };
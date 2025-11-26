const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

// --- CREATE ---
async function createUser({ username, password, role = 'user' }) {
  const hashed = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (username, password, role) 
     VALUES ($1, $2, $3) 
     RETURNING id, username, role, xp, level, created_at`,
    [username, hashed, role]
  );
  return rows[0];
}

// --- READ ---
async function getUserById(id) {
  const { rows } = await pool.query(
    'SELECT id, username, role, xp, level, created_at FROM users WHERE id = $1', 
    [id]
  );
  return rows[0];
}

async function getUserByUsername(username) {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE username = $1', 
    [username]
  );
  return rows[0];
}

// --- ADMIN ---
async function getAllUsers() {
  const { rows } = await pool.query(
    'SELECT id, username, role, xp, level, created_at FROM users ORDER BY id ASC'
  );
  return rows;
}

async function deleteUser(id) {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

// --- GAMIFICATION ---
async function addXp(userId, amount) {
  const user = await getUserById(userId);
  if (!user) return null;

  let newXp = user.xp + amount;
  let newLevel = user.level;
  const xpThreshold = newLevel * 100;

  if (newXp >= xpThreshold) {
    newLevel++;
  }

  const { rows } = await pool.query(
    'UPDATE users SET xp = $1, level = $2 WHERE id = $3 RETURNING xp, level',
    [newXp, newLevel, userId]
  );
  return rows[0];
}

// --- LEADERBOARD ---
async function getLeaderboard() {
  const { rows } = await pool.query(
    `SELECT username, xp, level, created_at 
     FROM users 
     ORDER BY level DESC, xp DESC 
     LIMIT 10`
  );
  return rows;
}

// Export all functions
module.exports = { 
  createUser, 
  getUserById, 
  getUserByUsername, 
  getAllUsers, 
  deleteUser, 
  addXp,
  getLeaderboard // <--- Added
};
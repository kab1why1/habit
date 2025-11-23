// server/models/habit.js
const { pool } = require('../config/db');

async function createHabitsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      color VARCHAR(30),
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await pool.query(sql);
}

async function createHabit({ user_id, title, description = null, category = null, color = null }) {
  const sql = `
    INSERT INTO habits (user_id, title, description, category, color)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [user_id, title, description, category, color]);
  return rows[0];
}

async function getAllHabits(userId = null) {
  if (userId) {
    const { rows } = await pool.query('SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return rows;
  }
  const { rows } = await pool.query('SELECT * FROM habits ORDER BY created_at DESC');
  return rows;
}

async function getHabitById(id) {
  const { rows } = await pool.query('SELECT * FROM habits WHERE id = $1', [id]);
  return rows[0];
}

async function updateHabit(id, { title, description, category, color }) {
  const sql = `
    UPDATE habits SET title=$1, description=$2, category=$3, color=$4
    WHERE id = $5 RETURNING *;
  `;
  const { rows } = await pool.query(sql, [title, description, category, color, id]);
  return rows[0];
}

async function toggleHabitCompleted(id) {
  const habit = await getHabitById(id);
  if (!habit) return null;
  const { rows } = await pool.query('UPDATE habits SET completed = $1 WHERE id = $2 RETURNING *', [!habit.completed, id]);
  return rows[0];
}

async function deleteHabit(id) {
  await pool.query('DELETE FROM habits WHERE id = $1', [id]);
}

module.exports = {
  createHabitsTable,
  createHabit,
  getAllHabits,
  getHabitById,
  updateHabit,
  toggleHabitCompleted,
  deleteHabit,
};

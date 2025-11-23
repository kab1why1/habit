// server/models/habit.js
const pool = require('../config/db').pool;

// Ensure table exists
async function createHabitsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      color VARCHAR(20),
      completed BOOLEAN DEFAULT false,
      user_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function createHabit({ title, description, category, color, user_id }) {
  const { rows } = await pool.query(
    `INSERT INTO habits (title, description, category, color, user_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, description, category, color, user_id]
  );
  return rows[0];
}

async function getAllHabits(user_id) {
  const { rows } = await pool.query(
    'SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC',
    [user_id]
  );
  return rows;
}

async function getHabitById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM habits WHERE id = $1',
    [id]
  );
  return rows[0];
}

async function updateHabit(id, { title, description, category, color }) {
  const { rows } = await pool.query(
    `UPDATE habits
     SET title=$1, description=$2, category=$3, color=$4
     WHERE id=$5 RETURNING *`,
    [title, description, category, color, id]
  );
  return rows[0];
}

async function deleteHabit(id) {
  await pool.query('DELETE FROM habits WHERE id=$1', [id]);
}

async function toggleHabitCompleted(id) {
  await pool.query(
    'UPDATE habits SET completed = NOT completed WHERE id = $1',
    [id]
  );
}

module.exports = {
  createHabitsTable,
  createHabit,
  getAllHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  toggleHabitCompleted,
};

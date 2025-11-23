const { pool } = require('../config/db');

// Create habits table if not exists
async function createHabitsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      color VARCHAR(20),
      completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Get all habits for a user
async function getAllHabits(userId) {
  const result = await pool.query(
    'SELECT * FROM habits WHERE user_id = $1 ORDER BY id DESC',
    [userId]
  );
  return result.rows;
}

// Get habit by ID
async function getHabitById(id) {
  const result = await pool.query(
    'SELECT * FROM habits WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

// Create a new habit
async function createHabit({ user_id, title, description, category, color }) {
  const result = await pool.query(
    `INSERT INTO habits (user_id, title, description, category, color)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [user_id, title, description, category, color]
  );
  return result.rows[0];
}

// Update habit
async function updateHabit(id, { title, description, category, color }) {
  const result = await pool.query(
    `UPDATE habits SET title=$1, description=$2, category=$3, color=$4
     WHERE id=$5 RETURNING *`,
    [title, description, category, color, id]
  );
  return result.rows[0];
}

// Toggle completed status
async function toggleHabitCompleted(id) {
  const habit = await getHabitById(id);
  if (!habit) return null;
  const result = await pool.query(
    'UPDATE habits SET completed = NOT completed WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0];
}

module.exports = {
  createHabitsTable,
  getAllHabits,
  getHabitById,
  createHabit,
  updateHabit,
  toggleHabitCompleted
};

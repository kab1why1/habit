const { pool } = require('../config/db');

async function createHabitsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(255),
      color VARCHAR(20),
      completed BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(query);
}

async function getAllHabits(userId) {
  const query = 'SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC';
  const { rows } = await pool.query(query, [userId]);
  return rows;
}

async function getHabitById(id) {
  const query = 'SELECT * FROM habits WHERE id = $1';
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}

async function createHabit({ user_id, title, description, category, color }) {
  const query = `
    INSERT INTO habits (user_id, title, description, category, color)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `;
  const values = [user_id, title, description, category, color];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function updateHabit(id, { title, description, category, color }) {
  const query = `
    UPDATE habits
    SET title = $1, description = $2, category = $3, color = $4
    WHERE id = $5
  `;
  await pool.query(query, [title, description, category, color, id]);
}

async function toggleHabitCompleted(id) {
  const habit = await getHabitById(id);
  if (!habit) return null;
  const query = 'UPDATE habits SET completed = $1 WHERE id = $2';
  await pool.query(query, [!habit.completed, id]);
}

module.exports = {
  createHabitsTable,
  getAllHabits,
  getHabitById,
  createHabit,
  updateHabit,
  toggleHabitCompleted,
};

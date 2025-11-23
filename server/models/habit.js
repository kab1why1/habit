const { pool } = require('../config/db');

async function createHabitsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      color VARCHAR(20),
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await pool.query(query);
}

async function getAllHabits(userId) {
  const query = 'SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC';
  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function getHabitById(id) {
  const query = 'SELECT * FROM habits WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0];
}

async function createHabit(habit) {
  const query = `
    INSERT INTO habits (user_id, title, description, category, color)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `;
  const result = await pool.query(query, [
    habit.user_id,
    habit.title,
    habit.description,
    habit.category,
    habit.color,
  ]);
  return result.rows[0];
}

async function updateHabit(id, habit) {
  const query = `
    UPDATE habits SET title=$1, description=$2, category=$3, color=$4
    WHERE id=$5 RETURNING *
  `;
  const result = await pool.query(query, [
    habit.title,
    habit.description,
    habit.category,
    habit.color,
    id,
  ]);
  return result.rows[0];
}

async function toggleHabitCompleted(id) {
  const habit = await getHabitById(id);
  if (!habit) return null;
  const query = 'UPDATE habits SET completed = $1 WHERE id=$2 RETURNING *';
  const result = await pool.query(query, [!habit.completed, id]);
  return result.rows[0];
}

async function deleteHabit(id) {
  const query = 'DELETE FROM habits WHERE id = $1';
  await pool.query(query, [id]);
}

module.exports = {
  createHabitsTable,
  getAllHabits,
  getHabitById,
  createHabit,
  updateHabit,
  toggleHabitCompleted,
  deleteHabit,
};

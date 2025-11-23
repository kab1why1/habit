// server/models/habit.js
const { query } = require('../config/db');

// Create table
async function createHabitsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      color VARCHAR(20),
      completed BOOLEAN DEFAULT FALSE,
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  return query(sql);
}

// Insert Habit
async function createHabit({ title, description, category = null, color = null, user_id = null }) {
  const sql = `
    INSERT INTO habits (title, description, category, color, user_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const params = [title, description, category, color, user_id];
  const result = await query(sql, params);
  return result.rows[0];
}

// Update a habit
async function updateHabit(id, { title, description, category, color }) {
  const sql = `
    UPDATE habits
    SET title = $1,
        description = $2,
        category = $3,
        color = $4
    WHERE id = $5
    RETURNING *;
  `;
  const params = [title, description, category, color, id];
  const result = await query(sql, params);
  return result.rows[0];
}

// Toggle completed state
async function toggleHabitCompleted(id) {
  const sql = `
    UPDATE habits
    SET completed = NOT completed
    WHERE id = $1
    RETURNING *;
  `;
  const result = await query(sql, [id]);
  return result.rows[0];
}

// Get all habits (optionally by user)
async function getAllHabits(user_id = null) {
  if (user_id) {
    const sql = `SELECT * FROM habits WHERE user_id = $1 ORDER BY id DESC`;
    const result = await query(sql, [user_id]);
    return result.rows;
  } else {
    const sql = `SELECT * FROM habits ORDER BY id DESC`;
    const result = await query(sql);
    return result.rows;
  }
}

// Get one habit
async function getHabitById(id) {
  const sql = `SELECT * FROM habits WHERE id = $1 LIMIT 1`;
  const result = await query(sql, [id]);
  return result.rows[0];
}

module.exports = {
  createHabitsTable,
  createHabit,
  updateHabit,
  toggleHabitCompleted,
  getAllHabits,
  getHabitById,
};

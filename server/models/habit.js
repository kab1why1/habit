// server/models/habit.js
const { query } = require('../config/db');

// Create table (includes user_id FK)
async function createHabitsTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  return query(sql);
}

// Insert Habit (stores owner)
async function createHabit({ title, description, user_id }) {
  const sql = `
    INSERT INTO habits (title, description, user_id)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const params = [title, description, user_id];
  const result = await query(sql, params);
  return result.rows[0];
}

// Get all habits (admin/general — not filtered)
async function getAllHabits() {
  const sql = "SELECT * FROM habits ORDER BY id DESC";
  const result = await query(sql);
  return result.rows;
}

// Get habits only for one user
async function getHabitsByUser(user_id) {
  const sql = `SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC`;
  const result = await query(sql, [user_id]);
  return result.rows;
}

// Get single habit by id
async function getHabitById(id) {
  const sql = "SELECT * FROM habits WHERE id = $1 LIMIT 1";
  const result = await query(sql, [id]);
  return result.rows[0];
}

// Delete habit (by id and owner check should be done in route)
async function deleteHabit(id) {
  const sql = "DELETE FROM habits WHERE id = $1";
  await query(sql, [id]);
}

// Update habit
async function updateHabit(id, { title, description }) {
  const sql = `
    UPDATE habits 
    SET title = $1, description = $2
    WHERE id = $3
    RETURNING *;
  `;
  const result = await query(sql, [title, description, id]);
  return result.rows[0];
}

module.exports = {
  createHabitsTable,
  createHabit,
  getAllHabits,
  getHabitsByUser,
  getHabitById,
  deleteHabit,
  updateHabit,
};

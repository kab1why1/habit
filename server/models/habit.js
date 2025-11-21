const { query } = require('../config/db');

// Create table
async function createHabitTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  return query(sql);
}

// Insert habit
async function createHabit({ title, description }) {
  const sql = `
    INSERT INTO habits (title, description)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const params = [title, description];
  const result = await query(sql, params);
  return result.rows[0];
}

// Get all habits
async function getAllHabits() {
  const sql = `SELECT * FROM habits ORDER BY id DESC`;
  const result = await query(sql);
  return result.rows;
}

module.exports = {
  createHabitTable,
  createHabit,
  getAllHabits
};

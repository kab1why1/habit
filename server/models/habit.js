// server/models/habit.js
const db = require('../config/db');

// Create table
async function createHabitsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS habits (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      color VARCHAR(20),
      completed BOOLEAN DEFAULT false,
      user_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await db.query(query);
}

// Create
async function createHabit({ title, description, category, color, user_id }) {
  const query = `
    INSERT INTO habits (title, description, category, color, user_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const values = [title, description, category, color, user_id];
  const { rows } = await db.query(query, values);
  return rows[0];
}

// Read all habits for user (or all if userId null)
async function getAllHabits(userId = null) {
  let query = 'SELECT * FROM habits';
  let values = [];
  if (userId) {
    query += ' WHERE user_id=$1 ORDER BY created_at DESC';
    values = [userId];
  } else {
    query += ' ORDER BY created_at DESC';
  }
  const { rows } = await db.query(query, values);
  return rows;
}

// Get by id
async function getHabitById(id) {
  const { rows } = await db.query('SELECT * FROM habits WHERE id=$1', [id]);
  return rows[0];
}

// Update
async function updateHabit(id, { title, description, category, color }) {
  const query = `
    UPDATE habits
    SET title=$1, description=$2, category=$3, color=$4
    WHERE id=$5
    RETURNING *
  `;
  const values = [title, description, category, color, id];
  const { rows } = await db.query(query, values);
  return rows[0];
}

// Delete
async function deleteHabit(id) {
  await db.query('DELETE FROM habits WHERE id=$1', [id]);
}

// Toggle completed
async function toggleHabitCompleted(id) {
  const habit = await getHabitById(id);
  if (!habit) return null;
  const query = 'UPDATE habits SET completed=$1 WHERE id=$2 RETURNING *';
  const { rows } = await db.query(query, [!habit.completed, id]);
  return rows[0];
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

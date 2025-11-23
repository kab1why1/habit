const { pool } = require('../config/db');

// Create a new habit
async function createHabit({ title, description, category, color, user_id }) {
  const result = await pool.query(
    `INSERT INTO habits (title, description, category, color, user_id, completed, created_at)
     VALUES ($1, $2, $3, $4, $5, false, NOW()) RETURNING *`,
    [title, description, category, color, user_id]
  );
  return result.rows[0];
}

// Get all habits of a user
async function getAllHabits(user_id) {
  const result = await pool.query(
    `SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC`,
    [user_id]
  );
  return result.rows;
}

// Get a single habit by ID
async function getHabitById(id) {
  const result = await pool.query(`SELECT * FROM habits WHERE id = $1`, [id]);
  return result.rows[0];
}

// Update a habit
async function updateHabit(id, { title, description, category, color }) {
  const result = await pool.query(
    `UPDATE habits SET title = $1, description = $2, category = $3, color = $4 WHERE id = $5 RETURNING *`,
    [title, description, category, color, id]
  );
  return result.rows[0];
}

// Toggle habit completed
async function toggleHabitCompleted(id) {
  const habit = await getHabitById(id);
  if (!habit) throw new Error('Habit not found');

  const result = await pool.query(
    `UPDATE habits SET completed = $1 WHERE id = $2 RETURNING *`,
    [!habit.completed, id]
  );
  return result.rows[0];
}

module.exports = {
  createHabit,
  getAllHabits,
  getHabitById,
  updateHabit,
  toggleHabitCompleted, // <-- make sure this is exported!
};

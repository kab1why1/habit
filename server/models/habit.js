const { pool } = require('../config/db');

// Get all habits for a user
async function getAllHabits(userId) {
  try {
    const res = await pool.query('SELECT * FROM habits WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
    return res.rows;
  } catch (err) {
    console.error('DB Query Error', err);
    throw err;
  }
}

// Get habit by id for a user
async function getHabitById(id, userId) {
  try {
    const res = await pool.query('SELECT * FROM habits WHERE id=$1 AND user_id=$2', [id, userId]);
    return res.rows[0];
  } catch (err) {
    console.error('Get habit error', err);
    throw err;
  }
}

// Toggle habit completed
async function toggleHabit(id, userId) {
  try {
    await pool.query(
      'UPDATE habits SET completed = NOT completed WHERE id=$1 AND user_id=$2',
      [id, userId]
    );
  } catch (err) {
    console.error('Toggle habit error', err);
    throw err;
  }
}

module.exports = { getAllHabits, getHabitById, toggleHabit };
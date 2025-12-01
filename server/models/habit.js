const { pool } = require('../config/db');
const { addXp } = require('./user'); 

// --- CREATE ---
async function createHabit({ user_id, title, description, category, color, type = 'boolean', target_value = 1 }) {
  await pool.query(
    `INSERT INTO habits (user_id, title, description, category, color, type, target_value)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [user_id, title, description, category, color, type, target_value]
  );
}

// --- READ ALL ---
async function getAllHabits(userId, targetDate = null) {
  const dateFilter = targetDate ? `'${targetDate}'` : 'CURRENT_DATE';
  const sql = `
    SELECT h.*, COALESCE(l.completed, false) as completed, COALESCE(l.current_value, 0) as current_value
    FROM habits h
    LEFT JOIN habit_logs l ON h.id = l.habit_id AND l.log_date = ${dateFilter}
    WHERE h.user_id = $1 ORDER BY h.created_at DESC
  `;
  const { rows: habits } = await pool.query(sql, [userId]);
  
  for (let habit of habits) {
    habit.streak = await calculateStreak(habit.id);
  }
  return habits;
}

// --- STREAK HELPER ---
async function calculateStreak(habitId) {
  let streak = 0;
  let dateOffset = 1;
  while (true) {
    const d = new Date(); d.setDate(d.getDate() - dateOffset);
    const dateStr = d.toISOString().split('T')[0];
    const res = await pool.query('SELECT completed FROM habit_logs WHERE habit_id = $1 AND log_date = $2', [habitId, dateStr]);
    if (res.rows.length > 0 && res.rows[0].completed) { streak++; dateOffset++; } else { break; }
  }
  const today = await pool.query('SELECT completed FROM habit_logs WHERE habit_id = $1 AND log_date = CURRENT_DATE', [habitId]);
  if (today.rows.length > 0 && today.rows[0].completed) streak++;
  return streak;
}

// --- READ ONE ---
async function getHabitById(id, userId) {
  let sql = `SELECT h.*, COALESCE(l.completed, false) as completed, COALESCE(l.current_value, 0) as current_value FROM habits h LEFT JOIN habit_logs l ON h.id = l.habit_id AND l.log_date = CURRENT_DATE WHERE h.id = $1`;
  const params = [id];
  if (userId) { sql += ' AND h.user_id = $2'; params.push(userId); }
  const { rows } = await pool.query(sql, params);
  return rows[0];
}

// --- UPDATE ---
async function updateHabit(id, userId, data) {
  const { title, description, category, color, type, target_value } = data;
  await pool.query(
    `UPDATE habits SET title=$1, description=$2, category=$3, color=$4, type=$5, target_value=$6 WHERE id=$7 AND user_id=$8`,
    [title, description, category, color, type, target_value, id, userId]
  );
}

// --- TOGGLE ---
async function toggleHabitCompleted(id, userId, targetDate = null) {
  const habit = (await pool.query('SELECT * FROM habits WHERE id = $1', [id])).rows[0];
  const dateExpr = targetDate ? `'${targetDate}'` : 'CURRENT_DATE';
  const logCheck = await pool.query(`SELECT * FROM habit_logs WHERE habit_id = $1 AND log_date = ${dateExpr}`, [id]);

  if (logCheck.rows.length === 0) {
    await pool.query(`INSERT INTO habit_logs (habit_id, log_date, completed, current_value) VALUES ($1, ${dateExpr}, TRUE, $2)`, [id, habit.target_value]);
    if (!targetDate) await addXp(userId, 10);
  } else {
    const log = logCheck.rows[0];
    const newCompleted = !log.completed;
    await pool.query(`UPDATE habit_logs SET completed = $1, current_value = $2 WHERE id = $3`, [newCompleted, newCompleted ? habit.target_value : 0, log.id]);
    if (!targetDate) await addXp(userId, newCompleted ? 10 : -10);
  }
}

// --- INCREMENT ---
async function incrementHabit(id, userId, amount, targetDate = null) {
  const habit = (await pool.query('SELECT * FROM habits WHERE id = $1', [id])).rows[0];
  const dateExpr = targetDate ? `'${targetDate}'` : 'CURRENT_DATE';
  
  const sql = `
    INSERT INTO habit_logs (habit_id, log_date, current_value, completed)
    VALUES ($1, ${dateExpr}, GREATEST(0, $2), (GREATEST(0, $2) >= $3))
    ON CONFLICT (habit_id, log_date) 
    DO UPDATE SET current_value = GREATEST(0, habit_logs.current_value + $2), completed = (GREATEST(0, habit_logs.current_value + $2) >= $3)
    RETURNING completed;
  `;
  const { rows } = await pool.query(sql, [id, amount, habit.target_value]);
  if (!targetDate && rows[0].completed && amount > 0) await addXp(userId, 10);
}

// --- DELETE ---
async function deleteHabit(id, userId) {
  await pool.query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [id, userId]);
}

// --- ADMIN ---
async function getAdminHabits() {
  const { rows } = await pool.query(`SELECT h.*, u.username FROM habits h JOIN users u ON h.user_id = u.id ORDER BY h.created_at DESC`);
  return rows;
}

// --- HISTORY (FIXED) ---
async function getHabitHistory(userId) {
  const { rows } = await pool.query(
    `SELECT to_char(l.log_date, 'YYYY-MM-DD') as date, COUNT(*) as count 
     FROM habit_logs l 
     JOIN habits h ON l.habit_id = h.id 
     WHERE h.user_id = $1 AND l.completed = TRUE 
     GROUP BY l.log_date`,
    [userId] // <--- THIS WAS MISSING
  );
  
  const map = {}; 
  rows.forEach(r => map[r.date] = parseInt(r.count));
  return map;
}

// --- STATS ---
async function getHabitStats(habitId, userId) {
  const { rows } = await pool.query(
    `SELECT to_char(log_date, 'YYYY-MM-DD') as date, current_value 
     FROM habit_logs 
     WHERE habit_id = $1 AND log_date > CURRENT_DATE - INTERVAL '30 days' 
     ORDER BY log_date ASC`, 
    [habitId]
  );
  return rows;
}

module.exports = { createHabit, getAllHabits, getHabitById, updateHabit, toggleHabitCompleted, incrementHabit, deleteHabit, getAdminHabits, getHabitHistory, getHabitStats };
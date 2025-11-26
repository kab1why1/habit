const { pool } = require('../config/db');
const { addXp } = require('./user'); 

// --- CREATE ---
async function createHabit({ user_id, title, description, category, color, type = 'boolean', target_value = 1 }) {
  const { rows } = await pool.query(
    `INSERT INTO habits (user_id, title, description, category, color, type, target_value)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [user_id, title, description, category, color, type, target_value]
  );
  return rows[0];
}

// --- READ ALL (Supports Time Travel) ---
async function getAllHabits(userId, targetDate = null) {
  // If targetDate is provided, wrap in quotes, otherwise use SQL keyword CURRENT_DATE
  const dateFilter = targetDate ? `'${targetDate}'` : 'CURRENT_DATE';

  const sql = `
    SELECT 
      h.*, 
      COALESCE(l.completed, false) as completed, 
      COALESCE(l.current_value, 0) as current_value
    FROM habits h
    LEFT JOIN habit_logs l 
      ON h.id = l.habit_id 
      AND l.log_date = ${dateFilter} 
    WHERE h.user_id = $1
    ORDER BY h.created_at DESC
  `;
  const { rows: habits } = await pool.query(sql, [userId]);

  // Calculate Streak (Always based on "Today" backwards)
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
    const d = new Date();
    d.setDate(d.getDate() - dateOffset);
    const dateStr = d.toISOString().split('T')[0];

    const res = await pool.query(
      'SELECT completed FROM habit_logs WHERE habit_id = $1 AND log_date = $2',
      [habitId, dateStr]
    );

    if (res.rows.length > 0 && res.rows[0].completed) {
      streak++;
      dateOffset++;
    } else {
      break; 
    }
  }

  const todayCheck = await pool.query(
    'SELECT completed FROM habit_logs WHERE habit_id = $1 AND log_date = CURRENT_DATE', 
    [habitId]
  );
  if (todayCheck.rows.length > 0 && todayCheck.rows[0].completed) {
    streak++;
  }

  return streak;
}

// --- READ ONE ---
async function getHabitById(id, userId) {
  let sql = `
    SELECT h.*, COALESCE(l.completed, false) as completed, COALESCE(l.current_value, 0) as current_value
    FROM habits h
    LEFT JOIN habit_logs l ON h.id = l.habit_id AND l.log_date = CURRENT_DATE
    WHERE h.id = $1
  `;
  const params = [id];
  if (userId) { sql += ' AND h.user_id = $2'; params.push(userId); }
  const { rows } = await pool.query(sql, params);
  return rows[0];
}

// --- UPDATE ---
async function updateHabit(id, userId, { title, description, category, color, type, target_value }) {
  const { rows } = await pool.query(
    `UPDATE habits SET title=$1, description=$2, category=$3, color=$4, type=$5, target_value=$6
     WHERE id = $7 AND user_id = $8 RETURNING *`,
    [title, description, category, color, type, target_value, id, userId]
  );
  return rows[0];
}

// --- TOGGLE (Supports Time Travel) ---
async function toggleHabitCompleted(id, userId, targetDate = null) {
  const habitCheck = await pool.query('SELECT * FROM habits WHERE id = $1 AND user_id = $2', [id, userId]);
  if (habitCheck.rows.length === 0) return null;
  const habit = habitCheck.rows[0];

  const dateExpr = targetDate ? `'${targetDate}'` : 'CURRENT_DATE';

  const logCheck = await pool.query(
    `SELECT * FROM habit_logs WHERE habit_id = $1 AND log_date = ${dateExpr}`, 
    [id]
  );

  if (logCheck.rows.length === 0) {
    await pool.query(
      `INSERT INTO habit_logs (habit_id, log_date, completed, current_value) 
       VALUES ($1, ${dateExpr}, TRUE, $2)`,
      [id, habit.target_value]
    );
    // Only award XP if modifying TODAY (prevents farming history)
    if (!targetDate) await addXp(userId, 10); 
  } else {
    const log = logCheck.rows[0];
    const newCompleted = !log.completed;
    const newValue = newCompleted ? habit.target_value : 0;

    await pool.query(
      `UPDATE habit_logs SET completed = $1, current_value = $2 WHERE id = $3`,
      [newCompleted, newValue, log.id]
    );

    if (!targetDate) {
      if (newCompleted) await addXp(userId, 10);
      else await addXp(userId, -10);
    }
  }
}

// --- INCREMENT (Supports Time Travel) ---
async function incrementHabit(id, userId, amount = 1, targetDate = null) {
  const habitCheck = await pool.query('SELECT * FROM habits WHERE id = $1 AND user_id = $2', [id, userId]);
  if (habitCheck.rows.length === 0) return;
  const habit = habitCheck.rows[0];

  const dateExpr = targetDate ? `'${targetDate}'` : 'CURRENT_DATE';

  const sql = `
    INSERT INTO habit_logs (habit_id, log_date, current_value, completed)
    VALUES ($1, ${dateExpr}, GREATEST(0, $2), (GREATEST(0, $2) >= $3))
    ON CONFLICT (habit_id, log_date) 
    DO UPDATE SET 
      current_value = GREATEST(0, habit_logs.current_value + $2),
      completed = (GREATEST(0, habit_logs.current_value + $2) >= $3)
    RETURNING current_value, completed;
  `;

  const { rows } = await pool.query(sql, [id, amount, habit.target_value]);
  
  // Only XP on Today
  if (!targetDate && rows[0].completed && amount > 0) {
     await addXp(userId, 10);
  }
}

// --- DELETE ---
async function deleteHabit(id, userId) {
  await pool.query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [id, userId]);
}

// --- ADMIN ---
async function getAdminHabits() {
  const sql = `SELECT h.*, u.username FROM habits h JOIN users u ON h.user_id = u.id ORDER BY h.created_at DESC`;
  const { rows } = await pool.query(sql);
  return rows;
}

// --- HISTORY ---
async function getHabitHistory(userId) {
  const sql = `
    SELECT to_char(l.log_date, 'YYYY-MM-DD') as date, COUNT(*) as count
    FROM habit_logs l
    JOIN habits h ON l.habit_id = h.id
    WHERE h.user_id = $1 AND l.completed = TRUE
    GROUP BY l.log_date
  `;
  const { rows } = await pool.query(sql, [userId]);
  
  const historyMap = {};
  rows.forEach(row => {
    historyMap[row.date] = parseInt(row.count);
  });
  return historyMap;
}

// --- STATS ---
async function getHabitStats(habitId, userId) {
  const check = await pool.query('SELECT id FROM habits WHERE id = $1 AND user_id = $2', [habitId, userId]);
  if (check.rows.length === 0) return null;

  const sql = `
    SELECT to_char(log_date, 'YYYY-MM-DD') as date, current_value
    FROM habit_logs 
    WHERE habit_id = $1 AND log_date > CURRENT_DATE - INTERVAL '30 days'
    ORDER BY log_date ASC
  `;
  const { rows } = await pool.query(sql, [habitId]);
  return rows; 
}

module.exports = { 
  createHabit, getAllHabits, getHabitById, updateHabit, 
  toggleHabitCompleted, incrementHabit, deleteHabit, 
  getAdminHabits, getHabitHistory, getHabitStats 
};
const express = require('express');
const router = express.Router();
const ensureAdmin = require('../middleware/ensureAdmin');
const { pool } = require('../config/db');
const { getAllUsers, createUser, getUserById, updateUser, deleteUser } = require('../models/user');
const { getAdminHabits, getHabitById, createHabit, updateHabit, deleteHabit, toggleHabitCompleted } = require('../models/habit');

// Dashboard
router.get('/dashboard', ensureAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    const habits = await getAdminHabits();
    let statusColor = 'green';
    try { await pool.query('SELECT 1'); } catch { statusColor = 'red'; }
    res.render('admin/dashboard', { layout: 'layouts/admin', usersCount: users.length, habitsCount: habits.length, users, habits, user: res.locals.user, statusColor });
  } catch (err) { res.redirect('/'); }
});

// Users
router.get('/users', ensureAdmin, async (req, res) => {
  const users = await getAllUsers();
  res.render('admin/users/index', { layout: 'layouts/admin', users, user: res.locals.user });
});
router.get('/users/new', ensureAdmin, (req, res) => res.render('admin/users/new', { layout: 'layouts/admin', error: null, user: res.locals.user }));
router.post('/users', ensureAdmin, async (req, res) => {
  try { await createUser(req.body); res.redirect('/admin/users'); }
  catch (err) { res.render('admin/users/new', { layout: 'layouts/admin', error: err.message, user: res.locals.user }); }
});
router.get('/users/:id/edit', ensureAdmin, async (req, res) => {
  const u = await getUserById(req.params.id);
  res.render('admin/users/edit', { layout: 'layouts/admin', userToEdit: u, error: null, user: res.locals.user });
});
router.post('/users/:id/edit', ensureAdmin, async (req, res) => {
  await updateUser(req.params.id, req.body);
  res.redirect('/admin/users');
});
router.post('/users/:id/delete', ensureAdmin, async (req, res) => {
  await deleteUser(req.params.id);
  res.redirect('/admin/users');
});

// Habits
router.get('/habits', ensureAdmin, async (req, res) => {
  const habits = await getAdminHabits();
  res.render('admin/habits/index', { layout: 'layouts/admin', habits, user: res.locals.user });
});
// Create Habit (Admin)
router.get('/habits/new', ensureAdmin, async (req, res) => {
  const users = await getAllUsers();
  res.render('admin/habits/new', { layout: 'layouts/admin', users, error: null, user: res.locals.user });
});
router.post('/habits', ensureAdmin, async (req, res) => {
  await createHabit(req.body); // req.body contains user_id
  res.redirect('/admin/habits');
});
// Edit/Delete Habit (Admin)
router.get('/habits/:id/edit', ensureAdmin, async (req, res) => {
  const habit = await getHabitById(req.params.id, null);
  res.render('admin/habits/edit', { layout: 'layouts/admin', habit, error: null, user: res.locals.user });
});
router.post('/habits/:id/edit', ensureAdmin, async (req, res) => {
  const existing = await getHabitById(req.params.id, null);
  await updateHabit(req.params.id, existing.user_id, req.body);
  if (req.body.completed !== undefined) {
     if (!!existing.completed !== (req.body.completed === 'on')) await toggleHabitCompleted(req.params.id, existing.user_id);
  }
  res.redirect('/admin/habits');
});
router.post('/habits/:id/delete', ensureAdmin, async (req, res) => {
  const existing = await getHabitById(req.params.id, null);
  await deleteHabit(req.params.id, existing.user_id);
  res.redirect('/admin/habits');
});

module.exports = router;
// server/routes/admin.js
const express = require('express');
const router = express.Router();

const ensureAdmin = require('../middleware/ensureAdmin');
const { createUsersTable, getAllUsers, createUser, getUserById, updateUser, deleteUser } = require('../models/user');
const { createHabitsTable, getAllHabits, getHabitById, updateHabit, deleteHabit, toggleHabitCompleted } = require('../models/habit');

// Ensure tables exist (safe to call; CREATE TABLE IF NOT EXISTS)
(async () => {
  try {
    await createUsersTable();
    await createHabitsTable();
  } catch (err) {
    console.error('Error ensuring admin-related tables', err);
  }
})();

// Admin root (login page is app-level /admin handled earlier) — requireAdmin for dashboard
router.get('/dashboard', ensureAdmin, async (req, res) => {
  try {
    // basic stats: counts
    const users = await getAllUsers();
    const habits = await getAllHabits(); // all habits
    res.render('admin/dashboard', { layout: 'layouts/admin', usersCount: users.length, habitsCount: habits.length, users, habits, user: res.locals.user });
  } catch (err) {
    console.error('Admin dashboard error', err);
    res.render('admin/dashboard', { layout: 'layouts/admin', usersCount: 0, habitsCount: 0, users: [], habits: [], user: res.locals.user });
  }
});

/* ---------------- USERS (Admin CRUD) ---------------- */

// List all users
router.get('/users', ensureAdmin, async (req, res) => {
  const users = await getAllUsers();
  res.render('admin/users/index', { layout: 'layouts/admin', users, user: res.locals.user });
});

// New user form
router.get('/users/new', ensureAdmin, (req, res) => {
  res.render('admin/users/new', { layout: 'layouts/admin', error: null, user: res.locals.user });
});

// Create user (admin creates a user)
router.post('/users', ensureAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    await createUser({ username, password, role: role || 'user' });
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Admin create user error', err);
    res.render('admin/users/new', { layout: 'layouts/admin', error: err.message, user: res.locals.user });
  }
});

// Edit user form
router.get('/users/:id/edit', ensureAdmin, async (req, res) => {
  const u = await getUserById(req.params.id);
  if (!u) return res.redirect('/admin/users');
  res.render('admin/users/edit', { layout: 'layouts/admin', userToEdit: u, error: null, user: res.locals.user });
});

// Update user
router.post('/users/:id/edit', ensureAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    await updateUser(req.params.id, { username, password: password || null, role });
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Admin update user error', err);
    res.redirect('/admin/users');
  }
});

// Delete user
router.post('/users/:id/delete', ensureAdmin, async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Admin delete user error', err);
    res.redirect('/admin/users');
  }
});

/* ---------------- HABITS (Admin CRUD across users) ---------------- */

// List all habits (admin)
router.get('/habits', ensureAdmin, async (req, res) => {
  const habits = await getAllHabits();
  res.render('admin/habits/index', { layout: 'layouts/admin', habits, user: res.locals.user });
});

// Edit habit form (admin)
router.get('/habits/:id/edit', ensureAdmin, async (req, res) => {
  const habit = await getHabitById(req.params.id);
  if (!habit) return res.redirect('/admin/habits');
  res.render('admin/habits/edit', { layout: 'layouts/admin', habit, error: null, user: res.locals.user });
});

// Update habit (admin)
router.post('/habits/:id/edit', ensureAdmin, async (req, res) => {
  try {
    const { title, description, category, color, completed } = req.body;
    await updateHabit(req.params.id, { title, description, category, color });
    // if completed checkbox present toggle to that value
    if (typeof completed !== 'undefined') {
      const h = await getHabitById(req.params.id);
      if (h && !!h.completed !== !!(completed === 'on')) {
        await toggleHabitCompleted(req.params.id);
      }
    }
    res.redirect('/admin/habits');
  } catch (err) {
    console.error('Admin update habit error', err);
    res.redirect('/admin/habits');
  }
});

// Delete habit (admin)
router.post('/habits/:id/delete', ensureAdmin, async (req, res) => {
  try {
    await deleteHabit(req.params.id);
    res.redirect('/admin/habits');
  } catch (err) {
    console.error('Admin delete habit error', err);
    res.redirect('/admin/habits');
  }
});

module.exports = router;

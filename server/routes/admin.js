const express = require('express');
const router = express.Router();
const ensureAdmin = require('../middleware/ensureAdmin');
const { getAllUsers, createUser, getUserById, deleteUser } = require('../models/user');
const { getAdminHabits, getHabitById, updateHabit, deleteHabit, toggleHabitCompleted } = require('../models/habit');

router.get('/dashboard', ensureAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    const habits = await getAdminHabits(); 
    res.render('admin/dashboard', { layout: 'layouts/admin', usersCount: users.length, habitsCount: habits.length, users, habits, user: res.locals.user });
  } catch (err) { res.render('admin/dashboard', { layout: 'layouts/admin', usersCount: 0, habitsCount: 0, users: [], habits: [], user: res.locals.user }); }
});

router.get('/users', ensureAdmin, async (req, res) => {
  const users = await getAllUsers();
  res.render('admin/users/index', { layout: 'layouts/admin', users, user: res.locals.user });
});

router.get('/users/new', ensureAdmin, (req, res) => {
  res.render('admin/users/new', { layout: 'layouts/admin', error: null, user: res.locals.user });
});

router.post('/users', ensureAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    await createUser({ username, password, role: role || 'user' });
    res.redirect('/admin/users');
  } catch (err) { res.render('admin/users/new', { layout: 'layouts/admin', error: err.message, user: res.locals.user }); }
});

router.get('/users/:id/edit', ensureAdmin, async (req, res) => {
  const u = await getUserById(req.params.id);
  if (!u) return res.redirect('/admin/users');
  res.render('admin/users/edit', { layout: 'layouts/admin', userToEdit: u, error: null, user: res.locals.user });
});

router.post('/users/:id/edit', ensureAdmin, async (req, res) => { res.redirect('/admin/users'); });
router.post('/users/:id/delete', ensureAdmin, async (req, res) => { await deleteUser(req.params.id); res.redirect('/admin/users'); });

router.get('/habits', ensureAdmin, async (req, res) => {
  const habits = await getAdminHabits();
  res.render('admin/habits/index', { layout: 'layouts/admin', habits, user: res.locals.user });
});

router.get('/habits/:id/edit', ensureAdmin, async (req, res) => {
  const habit = await getHabitById(req.params.id, null); 
  if (!habit) return res.redirect('/admin/habits');
  res.render('admin/habits/edit', { layout: 'layouts/admin', habit, error: null, user: res.locals.user });
});

router.post('/habits/:id/edit', ensureAdmin, async (req, res) => {
  try {
    const existing = await getHabitById(req.params.id, null);
    if (!existing) return res.redirect('/admin/habits');
    const { title, description, category, color, completed } = req.body;
    await updateHabit(req.params.id, existing.user_id, { title, description, category, color });
    if (typeof completed !== 'undefined' && !!existing.completed !== !!(completed === 'on')) {
      await toggleHabitCompleted(req.params.id, existing.user_id);
    }
    res.redirect('/admin/habits');
  } catch (err) { res.redirect('/admin/habits'); }
});

router.post('/habits/:id/delete', ensureAdmin, async (req, res) => {
  try {
    const existing = await getHabitById(req.params.id, null);
    if (existing) await deleteHabit(req.params.id, existing.user_id);
    res.redirect('/admin/habits');
  } catch (err) { res.redirect('/admin/habits'); }
});

module.exports = router;
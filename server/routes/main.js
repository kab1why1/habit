const express = require('express');
const router = express.Router();

const { createHabitsTable, getAllHabits, getHabitById, createHabit, updateHabit, toggleHabitCompleted } = require('../models/habit');
const { createUser, getUserByUsername, getUserById, updateUser } = require('../models/user');
const bcrypt = require('bcrypt');

// Ensure habits table exists
createHabitsTable().catch(err => console.error('createHabitsTable error', err));

// Home
router.get('/', async (req, res) => {
  try {
    const userId = req.session.userId;
    const habits = userId ? await getAllHabits(userId) : [];
    res.render('index', { habits, user: req.user });
  } catch (err) {
    console.error('Get all habits error', err);
    res.send('Error fetching habits');
  }
});

// Manage Habits
router.get('/habits/manage', async (req, res) => {
  try {
    if (!req.user) return res.redirect('/login');
    const habits = await getAllHabits(req.user.id);
    res.render('habits/manage', { habits, user: req.user });
  } catch (err) {
    console.error('Manage habits error', err);
    res.send('Error fetching habits');
  }
});

// Create habit
router.post('/habits/new', async (req, res) => {
  try {
    if (!req.user) return res.redirect('/login');
    await createHabit({ user_id: req.user.id, ...req.body });
    res.redirect('/habits/manage');
  } catch (err) {
    console.error('Create habit error', err);
    res.render('habits/new', { errors: [err.message] });
  }
});

// Edit habit
router.post('/habits/:id/edit', async (req, res) => {
  try {
    await updateHabit(req.params.id, req.body);
    res.redirect(`/habits/${req.params.id}`);
  } catch (err) {
    console.error('Edit habit error', err);
    res.render('habits/edit', { habit: { id: req.params.id, ...req.body }, errors: [err.message] });
  }
});

// Toggle habit
router.post('/habits/:id/toggle', async (req, res) => {
  try {
    await toggleHabitCompleted(req.params.id);
    res.redirect(req.get('Referrer') || '/');
  } catch (err) {
    console.error('Toggle habit error', err);
    res.send('Error toggling habit');
  }
});

// Show habit
router.get('/habits/:id', async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    if (!habit) return res.send('Habit not found');
    res.render('habit', { habit, user: req.user });
  } catch (err) {
    console.error('Get habit error', err);
    res.send('Error fetching habit');
  }
});

// Registration
router.get('/register', (req, res) => res.render('registration'));
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const existing = await getUserByUsername(username);
    if (existing) return res.render('registration', { errors: ['Username exists'] });
    const user = await createUser(username, password, role);
    req.session.userId = user.id;
    res.redirect('/');
  } catch (err) {
    console.error('Registration error', err);
    res.render('registration', { errors: [err.message] });
  }
});

// Login
router.get('/login', (req, res) => res.render('login'));
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await getUserByUsername(username);
    if (!user) return res.render('login', { errors: ['Invalid username or password'] });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.render('login', { errors: ['Invalid username or password'] });
    req.session.userId = user.id;
    res.redirect('/');
  } catch (err) {
    console.error('Login error', err);
    res.render('login', { errors: [err.message] });
  }
});

// Profile
router.get('/profile', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('profile', { user: req.user });
});
router.post('/profile', async (req, res) => {
  if (!req.user) return res.redirect('/login');
  try {
    const { username, password } = req.body;
    await updateUser(req.user.id, username, password);
    res.redirect('/profile');
  } catch (err) {
    console.error('Profile update error', err);
    res.render('profile', { user: req.user, error: err.message });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { createUser, findByUsername, getUserById } = require('../models/user');
const {
  createHabit,
  getAllHabits,
  getHabitById,
  toggleHabitCompleted,
} = require('../models/habit');

// Home page
router.get('/', async (req, res) => {
  const habits = req.session.user ? await getAllHabits(req.session.user.id) : [];
  res.render('index', { habits, user: req.session.user });
});

// Register
router.get('/register', (req, res) => res.render('registration'));
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const errors = [];

  if (!username || !password) errors.push('Username and password are required');

  const existingUser = await findByUsername(username);
  if (existingUser) errors.push('Username already exists');

  if (errors.length > 0) return res.render('registration', { errors });

  await createUser(username, password, role || 'user');
  res.redirect('/login');
});

// Login
router.get('/login', (req, res) => res.render('login'));
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const errors = [];

  const user = await findByUsername(username);
  if (!user) errors.push('Invalid username or password');

  if (user && !(await bcrypt.compare(password, user.password)))
    errors.push('Invalid username or password');

  if (errors.length > 0) return res.render('login', { errors });

  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.redirect('/');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Profile
router.get('/profile', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('profile', { user: req.session.user });
});
router.post('/profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const { username, password } = req.body;
  const user = await getUserById(req.session.user.id);
  const errors = [];

  if (!username) errors.push('Username cannot be empty');

  if (errors.length > 0) return res.render('profile', { user, error: errors[0] });

  let hashedPassword = user.password;
  if (password) hashedPassword = await bcrypt.hash(password, 10);

  await user.update({ username, password: hashedPassword });
  req.session.user.username = username;

  res.redirect('/profile');
});

// Manage habits
router.get('/habits/manage', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const habits = await getAllHabits(req.session.user.id);
  res.render('habits/manage', { habits });
});

// Create habit
router.get('/habits/new', (req, res) => res.render('habits/new'));
router.post('/habits/new', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, description, category, color } = req.body;
  const errors = [];
  if (!title) errors.push('Title is required');
  if (errors.length > 0) return res.render('habits/new', { errors });
  await createHabit({ title, description, category, color, user_id: req.session.user.id });
  res.redirect('/habits/manage');
});

// Edit habit
router.get('/habits/:id/edit', async (req, res) => {
  const habit = await getHabitById(req.params.id);
  res.render('habits/edit', { habit });
});
router.post('/habits/:id/edit', async (req, res) => {
  const habit = await getHabitById(req.params.id);
  const { title, description, category, color } = req.body;
  await habit.update({ title, description, category, color });
  res.redirect(`/habits/${habit.id}`);
});

// Toggle habit completed
router.post('/habits/:id/toggle', async (req, res) => {
  await toggleHabitCompleted(req.params.id);
  res.redirect('back');
});

// Show single habit
router.get('/habits/:id', async (req, res) => {
  const habit = await getHabitById(req.params.id);
  res.render('habit', { habit });
});

module.exports = router;

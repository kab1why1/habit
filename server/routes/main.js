// server/routes/main.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { createUser, findByUsername } = require('../models/user');
const {
  createHabit,
  getAllHabits,
  getHabitById,
  toggleHabitCompleted,
  updateHabit,
  createHabitsTable,
} = require('../models/habit');

// Ensure table exists (safe to call multiple times)
(async () => {
  try {
    await createHabitsTable();
  } catch (err) {
    console.error('Error creating habits table', err);
  }
})();

// Middleware: ensure logged in
function ensureLoggedIn(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Home page — show only current user's habits (if logged in)
router.get('/', async (req, res) => {
  try {
    const user = req.session?.user || null;
    const habits = await getAllHabits(user ? user.id : null);
    res.render('index', {
      locals: {
        title: 'HabitFlow',
        description: 'Track your habits and build your future',
        habits,
        user,
      },
    });
  } catch (err) {
    console.error('Homepage error', err);
    res.render('index', {
      locals: { title: 'HabitFlow', description: '', habits: [], user: req.session?.user || null },
    });
  }
});

// Register (GET)
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('registration', { locals: { title: 'Register', errors: [], user: null } });
});

// Register (POST)
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const errors = [];
  if (!username || !password) {
    errors.push('All fields are required');
    return res.render('registration', { locals: { title: 'Register', errors, user: null } });
  }
  try {
    const existing = await findByUsername(username);
    if (existing) {
      errors.push('Username already exists');
      return res.render('registration', { locals: { title: 'Register', errors, user: null } });
    }
    const hashed = await bcrypt.hash(password, 10);
    const is_admin = role === 'admin';
    await createUser({ username, password: hashed, is_admin });
    return res.redirect('/login');
  } catch (err) {
    console.error('Register error', err);
    errors.push('Something went wrong');
    return res.render('registration', { locals: { title: 'Register', errors, user: null } });
  }
});

// Login (GET)
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { locals: { title: 'Login', errors: [], user: null } });
});

// Login (POST)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const errors = [];
  if (!username || !password) {
    errors.push('All fields are required');
    return res.render('login', { locals: { title: 'Login', errors, user: null } });
  }
  try {
    const user = await findByUsername(username);
    if (!user) {
      errors.push('Invalid username or password');
      return res.render('login', { locals: { title: 'Login', errors, user: null } });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      errors.push('Invalid username or password');
      return res.render('login', { locals: { title: 'Login', errors, user: null } });
    }
    // Save user in session
    req.session.user = { id: user.id, username: user.username, is_admin: user.is_admin };
    return res.redirect('/');
  } catch (err) {
    console.error('Login error', err);
    errors.push('Something went wrong');
    return res.render('login', { locals: { title: 'Login', errors, user: null } });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Show create habit form (works for any logged-in user)
router.get('/habits/new', ensureLoggedIn, (req, res) => {
  res.render('admin/new', { locals: { user: req.session.user } });
});

// Handle create habit
router.post('/habits/new', ensureLoggedIn, async (req, res) => {
  try {
    const { title, description, category, color } = req.body;
    const user_id = req.session.user.id;
    if (!title) return res.redirect('/habits/new');
    await createHabit({ title, description, category: category || null, color: color || null, user_id });
    return res.redirect('/');
  } catch (err) {
    console.error('Create habit error', err);
    return res.redirect('/habits/new');
  }
});

// View single habit
router.get('/habits/:id', ensureLoggedIn, async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    if (!habit) return res.redirect('/');
    // Ensure the habit belongs to current user (simple auth)
    if (habit.user_id && req.session.user && habit.user_id !== req.session.user.id && !req.session.user.is_admin) {
      return res.redirect('/');
    }
    res.render('habit', { locals: { habit, user: req.session.user } });
  } catch (err) {
    console.error('Get habit error', err);
    res.redirect('/');
  }
});

// Toggle completed
router.post('/habits/:id/toggle', ensureLoggedIn, async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    if (!habit) return res.redirect('/');
    if (habit.user_id && habit.user_id !== req.session.user.id && !req.session.user.is_admin) return res.redirect('/');
    await toggleHabitCompleted(req.params.id);
    res.redirect('back');
  } catch (err) {
    console.error('Toggle error', err);
    res.redirect('/');
  }
});

// Edit habit form
router.get('/habits/:id/edit', ensureLoggedIn, async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    if (!habit) return res.redirect('/');
    if (habit.user_id && habit.user_id !== req.session.user.id && !req.session.user.is_admin) return res.redirect('/');
    res.render('habits/edit', { locals: { habit, user: req.session.user } });
  } catch (err) {
    console.error('Edit page error', err);
    res.redirect('/');
  }
});

// Handle edit
router.post('/habits/:id/edit', ensureLoggedIn, async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    if (!habit) return res.redirect('/');
    if (habit.user_id && habit.user_id !== req.session.user.id && !req.session.user.is_admin) return res.redirect('/');
    const { title, description, category, color } = req.body;
    await updateHabit(req.params.id, { title, description, category, color });
    res.redirect(`/habits/${req.params.id}`);
  } catch (err) {
    console.error('Update error', err);
    res.redirect('/');
  }
});

module.exports = router;

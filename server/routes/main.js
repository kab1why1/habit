// server/routes/main.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { createUser, findByUsername } = require('../models/user');
const { createHabit, getAllHabits, getHabitById, toggleHabitCompleted, createHabitsTable } = require('../models/habit');

// Ensure habits table exists on module load (safe to call)
createHabitsTable().catch(err => console.error('createHabitsTable error', err));

// Middleware to protect routes
function ensureLoggedIn(req, res, next) {
  if (!req.session || !req.session.user) return res.redirect('/login');
  next();
}

// Home page — show habits only for logged-in user (if any)
router.get('/', async (req, res) => {
  try {
    const user = req.session?.user || null;
    const userId = user?.id || null;
    const habits = await getAllHabits(userId);

    res.render('index', { locals: {
      title: "HabitFlow",
      description: "Track your habits and build your future",
      habits,
      user
    }});
  } catch (err) {
    console.error('Error loading home', err);
    res.render('index', { locals: { title: "HabitFlow", description: "", habits: [], user: req.session?.user || null }});
  }
});

// Registration page
router.get('/register', (req, res) => {
  if (req.session?.user) return res.redirect('/');
  res.render('registration', { locals: { title: "Register", errors: [], user: null } });
});

// Handle registration
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const errors = [];

  if (!username || !password) {
    errors.push("All fields are required");
    return res.render('registration', { locals: { title: "Register", errors, user: null } });
  }

  try {
    const existing = await findByUsername(username);
    if (existing) {
      errors.push("Username already exists");
      return res.render('registration', { locals: { title: "Register", errors, user: null } });
    }

    const hashed = await bcrypt.hash(password, 10);
    const is_admin = role === 'admin';

    const newUser = await createUser({ username, password: hashed, is_admin });

    // Log the user in after registration
    req.session.user = { id: newUser.id, username: newUser.username, is_admin: newUser.is_admin };
    return res.redirect('/');
  } catch (err) {
    console.error("Register error", err);
    errors.push("Something went wrong");
    return res.render('registration', { locals: { title: "Register", errors, user: null } });
  }
});

// Login page
router.get('/login', (req, res) => {
  if (req.session?.user) return res.redirect('/');
  res.render('login', { locals: { title: "Login", errors: [], user: null } });
});

// Handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username || !password) {
    errors.push("All fields are required");
    return res.render('login', { locals: { title: "Login", errors, user: null } });
  }

  try {
    const user = await findByUsername(username);
    if (!user) {
      errors.push("Invalid username or password");
      return res.render('login', { locals: { title: "Login", errors, user: null } });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      errors.push("Invalid username or password");
      return res.render('login', { locals: { title: "Login", errors, user: null } });
    }

    // Save user in session and redirect
    req.session.user = { id: user.id, username: user.username, is_admin: user.is_admin };
    return res.redirect('/');
  } catch (err) {
    console.error("Login error", err);
    errors.push("Something went wrong");
    return res.render('login', { locals: { title: "Login", errors, user: null } });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// --- Habits ---
// Show create habit page (use admin/new view — you can move it to views/habits/new if you prefer)
router.get('/habits/new', ensureLoggedIn, (req, res) => {
  res.render('admin/new', { locals: { user: req.session.user, errors: [] } });
});

// Handle new habit creation
router.post('/habits/new', ensureLoggedIn, async (req, res) => {
  try {
    const { title, description, category, color } = req.body;
    if (!title) {
      return res.render('admin/new', { locals: { user: req.session.user, errors: ['Title is required'] } });
    }

    const userId = req.session.user.id;
    await createHabit({ title, description, category, color, user_id: userId });
    return res.redirect('/');
  } catch (err) {
    console.error('Create habit error', err);
    return res.render('admin/new', { locals: { user: req.session.user, errors: ['Failed to create habit'] } });
  }
});

// View single habit (allow owner or anyone if you want)
router.get('/habits/:id', ensureLoggedIn, async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    if (!habit) return res.redirect('/');
    // optional: check ownership
    if (habit.user_id && req.session.user.id !== habit.user_id && !req.session.user.is_admin) {
      return res.send('Access denied');
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

    // owner or admin only
    if (habit.user_id && req.session.user.id !== habit.user_id && !req.session.user.is_admin) {
      return res.send('Access denied');
    }

    await toggleHabitCompleted(req.params.id);
    res.redirect(req.get('Referer') || '/');
  } catch (err) {
    console.error('Toggle completed error', err);
    res.redirect('/');
  }
});

// Edit page + Update could be added similarly (omitted here for brevity)

module.exports = router;

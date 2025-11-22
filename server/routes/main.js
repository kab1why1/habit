// server/routes/main.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { createUser, findByUsername } = require('../models/user');
const {
  createHabit,
  getHabitsByUser,
  getHabitById,
  createHabitsTable
} = require('../models/habit');

// ensure habits table exists (safe to call)
createHabitsTable().catch(err => console.error('createHabitsTable error', err));

// Middleware: require login
function ensureLoggedIn(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// Home page: show current user's habits (if logged in)
router.get('/', async (req, res) => {
  try {
    let habits = [];
    if (req.session?.user?.id) {
      habits = await getHabitsByUser(req.session.user.id);
    }
    res.render('index', {
      locals: {
        title: "HabitFlow",
        description: "Just an app to track your habits",
        habits,
        user: req.session?.user || null
      }
    });
  } catch (err) {
    console.error('Home route error', err);
    res.render('index', { locals: { title: "HabitFlow", habits: [], user: req.session?.user || null } });
  }
});

// Registration (GET)
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('registration', { locals: { title: "Register", errors: [], user: null } });
});

// Registration (POST) — supports role select
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
    await createUser({ username, password: hashed, is_admin });

    // Redirect to login (or auto-login if desired)
    return res.redirect('/login');
  } catch (err) {
    console.error('Registration error', err);
    errors.push("Something went wrong");
    return res.render('registration', { locals: { title: "Register", errors, user: null } });
  }
});

// Login (GET)
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', { locals: { title: "Login", errors: [], user: null } });
});

// Login (POST)
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

    // Save user in session
    req.session.user = { id: user.id, username: user.username, is_admin: user.is_admin };
    return res.redirect('/');
  } catch (err) {
    console.error('Login error', err);
    errors.push("Something went wrong");
    return res.render('login', { locals: { title: "Login", errors, user: null } });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ---------- Habit routes ----------

// Show create-habit page
router.get('/habits/new', ensureLoggedIn, (req, res) => {
  res.render('habits/new', { locals: { title: 'Create Habit', user: req.session.user } });
});

// Handle new habit creation
router.post('/habits/new', ensureLoggedIn, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.redirect('/habits/new');

    await createHabit({ title, description, user_id: req.session.user.id });
    res.redirect('/habits/manage');
  } catch (err) {
    console.error('Create habit error', err);
    res.redirect('/habits/new');
  }
});

// Manage habits (list owned habits, edit/delete links)
router.get('/habits/manage', ensureLoggedIn, async (req, res) => {
  try {
    const habits = await getHabitsByUser(req.session.user.id);
    res.render('habits/manage', { locals: { title: 'Manage Habits', habits, user: req.session.user } });
  } catch (err) {
    console.error('Manage habits error', err);
    res.redirect('/');
  }
});

// View single habit by id (owner or public)
router.get('/habits/:id', ensureLoggedIn, async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    if (!habit) return res.redirect('/');
    // optional: verify ownership before showing edit controls in view
    res.render('habit', { locals: { habit, user: req.session.user } });
  } catch (err) {
    console.error('Get habit error', err);
    res.redirect('/');
  }
});

// Delete habit (POST)
router.post('/habits/:id/delete', ensureLoggedIn, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const habit = await getHabitById(id);
    if (!habit) return res.redirect('/habits/manage');
    if (habit.user_id !== req.session.user.id && !req.session.user.is_admin) {
      return res.status(403).send('Forbidden');
    }
    const { deleteHabit } = require('../models/habit');
    await deleteHabit(id);
    res.redirect('/habits/manage');
  } catch (err) {
    console.error('Delete habit error', err);
    res.redirect('/habits/manage');
  }
});

// Edit habit (show form)
router.get('/habits/:id/edit', ensureLoggedIn, async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    if (!habit) return res.redirect('/habits/manage');
    if (habit.user_id !== req.session.user.id && !req.session.user.is_admin) return res.redirect('/habits/manage');
    res.render('habits/edit', { locals: { habit, user: req.session.user } });
  } catch (err) {
    console.error('Edit habit (GET) error', err);
    res.redirect('/habits/manage');
  }
});

// Edit habit (POST)
router.post('/habits/:id/edit', ensureLoggedIn, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const habit = await getHabitById(id);
    if (!habit) return res.redirect('/habits/manage');
    if (habit.user_id !== req.session.user.id && !req.session.user.is_admin) return res.redirect('/habits/manage');

    const { title, description } = req.body;
    const { updateHabit } = require('../models/habit');
    await updateHabit(id, { title, description });
    res.redirect('/habits/manage');
  } catch (err) {
    console.error('Edit habit (POST) error', err);
    res.redirect('/habits/manage');
  }
});

module.exports = router;

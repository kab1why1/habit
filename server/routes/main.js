// server/routes/main.js
const express = require('express');
const router = express.Router();
const { createUser, findByUsername } = require('../models/user');
const bcrypt = require('bcrypt');

// TEMP: posts (habits)
const { createPost, getAllPosts } = require('../models/post');

// Home page
router.get('/', async (req, res) => {
  const posts = await getAllPosts();
  // pass posts as habits (your views use locals.habits)
  res.render('index', { locals: {
    title: "HabitFlow",
    description: "Just an app to track your habits",
    habits: posts,
    user: req.session?.user || null
  }});
});

// Register page (GET)
router.get('/register', (req, res) => {
  res.render('registration', { locals: { title: "Register", errors: [], user: req.session?.user || null } });
});

// Handle registration (POST)
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const errors = [];

  if (!username || !password) {
    errors.push("All fields are required");
    return res.render('registration', { locals: { title: "Register", errors, user: req.session?.user || null } });
  }

  try {
    const existing = await findByUsername(username);
    if (existing) {
      errors.push("Username already exists");
      return res.render('registration', { locals: { title: "Register", errors, user: req.session?.user || null } });
    }

    const hashed = await bcrypt.hash(password, 10);
    const is_admin = role === 'admin'; // role comes from form select

    await createUser({ username, password: hashed, is_admin });

    // Optionally log them in automatically (commented out) or redirect to login
    // req.session.user = { id: newUser.id, username: newUser.username, is_admin: newUser.is_admin };
    res.redirect('/login');
  } catch (err) {
    console.error("Register error", err);
    errors.push("Something went wrong");
    res.render('registration', { locals: { title: "Register", errors, user: req.session?.user || null } });
  }
});

// Login page (GET)
router.get('/login', (req, res) => {
  res.render('login', { locals: { title: "Login", errors: [], user: req.session?.user || null } });
});

// Handle login (POST) — **this route matches form action="/login"**
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const errors = [];

  if (!username || !password) {
    errors.push("All fields are required");
    return res.render('login', { locals: { title: "Login", errors, user: req.session?.user || null } });
  }

  try {
    const user = await findByUsername(username);
    if (!user) {
      errors.push("Invalid username or password");
      return res.render('login', { locals: { title: "Login", errors, user: req.session?.user || null } });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      errors.push("Invalid username or password");
      return res.render('login', { locals: { title: "Login", errors, user: req.session?.user || null } });
    }

    // Save user in session and redirect
    req.session.user = { id: user.id, username: user.username, is_admin: user.is_admin };
    return res.redirect('/');
  } catch (err) {
    console.error("Login error", err);
    errors.push("Something went wrong");
    return res.render('login', { locals: { title: "Login", errors, user: req.session?.user || null } });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;

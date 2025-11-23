const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getUserByUsername, createUser } = require('../models/user');

// Middleware to protect admin routes
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.redirect('/admin/login');
  next();
}

// Admin login page
router.get('/', (req, res) => {
  res.render('admin/index', { error: null });
});

// Admin login POST
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await getUserByUsername(username);
    if (!user || user.role !== 'admin') {
      return res.render('admin/index', { error: 'Invalid username or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.render('admin/index', { error: 'Invalid username or password' });

    req.session.userId = user.id;
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Admin login error', err);
    res.render('admin/index', { error: err.message });
  }
});

// Admin dashboard
router.get('/dashboard', isAdmin, (req, res) => {
  res.render('admin/dashboard', { user: req.user });
});

// Admin logout
router.get('/logout', isAdmin, (req, res) => {
  req.session.destroy(() => res.redirect('/admin'));
});

module.exports = router;

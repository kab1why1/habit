const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { createUser, findByUsername, createUsersTable } = require('../models/user');
const { createPostTable } = require('../models/post');

// Create tables on server start
(async () => {
  await createUsersTable();
  await createPostTable();
})();

// Admin login page
router.get('/', (req, res) => {
  res.render('admin/index', { layout: '../layouts/admin', error: null });
});

// Admin register (optional)
router.get('/register', (req, res) => {
  res.render('admin/register', { layout: '../layouts/admin', error: null });
});

// POST login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await findByUsername(username);
    if (!user) return res.render('admin/index', { layout: '../layouts/admin', error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('admin/index', { layout: '../layouts/admin', error: 'Invalid credentials' });

    if (!user.is_admin) return res.render('admin/index', { layout: '../layouts/admin', error: 'Not an admin' });

    req.session.user = user;
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.render('admin/index', { layout: '../layouts/admin', error: 'Something went wrong' });
  }
});

// POST register (normal users)
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await findByUsername(username);
    if (existing) return res.render('admin/register', { layout: '../layouts/admin', error: 'Username already exists' });

    const user = await createUser({ username, email, password, is_admin: false });
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('admin/register', { layout: '../layouts/admin', error: 'Something went wrong' });
  }
});

// Admin dashboard
router.get('/dashboard', (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/admin');

  res.render('admin/dashboard', { layout: '../layouts/admin', user: req.session.user });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin');
  });
});

module.exports = router;

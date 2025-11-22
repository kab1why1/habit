// server/routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { createUser, findByUsername, createUsersTable } = require('../models/user');
const { createPostTable } = require('../models/post');

// Ensure tables exist at module load
(async () => {
  try {
    await createUsersTable();
    await createPostTable();
  } catch (err) {
    console.error('Error creating admin-related tables', err);
  }
})();

// Admin login page (GET)
router.get('/', (req, res) => {
  res.render('admin/index', { layout: 'layouts/admin', error: null, user: req.session?.user || null });
});

// Admin register page (GET) — optional; will create regular user
router.get('/register', (req, res) => {
  res.render('admin/register', { layout: 'layouts/admin', error: null, user: req.session?.user || null });
});

// POST /admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await findByUsername(username);
    if (!user) return res.render('admin/index', { layout: 'layouts/admin', error: 'Invalid credentials', user: null });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('admin/index', { layout: 'layouts/admin', error: 'Invalid credentials', user: null });

    if (!user.is_admin) return res.render('admin/index', { layout: 'layouts/admin', error: 'Not an admin', user: null });

    req.session.user = user;
    return res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    return res.render('admin/index', { layout: 'layouts/admin', error: 'Something went wrong', user: null });
  }
});

// POST /admin/register (creates normal user)
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await findByUsername(username);
    if (existing) return res.render('admin/register', { layout: 'layouts/admin', error: 'Username already exists', user: null });

    // by default admin route register makes normal user
    await createUser({ username, password, is_admin: false });
    return res.redirect('/admin'); // to admin login or wherever appropriate
  } catch (err) {
    console.error(err);
    return res.render('admin/register', { layout: 'layouts/admin', error: 'Something went wrong', user: null });
  }
});

// Dashboard
router.get('/dashboard', (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/admin');

  res.render('admin/dashboard', { layout: 'layouts/admin', user: req.session.user });
});

// Logout from admin
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin'));
});

module.exports = router;

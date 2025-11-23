// server/routes/profile.js
const express = require('express');
const router = express.Router();
const { getUserById, updateUser } = require('../models/user');

// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// GET /profile — show profile
router.get('/', requireLogin, async (req, res) => {
  try {
    const user = await getUserById(req.session.user.id);
    res.render('profile', { locals: { user, error: null } });
  } catch (err) {
    console.error('Error loading profile', err);
    res.render('profile', { locals: { user: null, error: 'Could not load profile' } });
  }
});

// POST /profile — update profile
router.post('/', requireLogin, async (req, res) => {
  const { username, password } = req.body;
  try {
    const updated = await updateUser(req.session.user.id, { username, password });
    req.session.user.username = updated.username; // update session
    res.redirect('/profile');
  } catch (err) {
    console.error('Error updating profile', err);
    const user = await getUserById(req.session.user.id);
    res.render('profile', { locals: { user, error: 'Could not update profile' } });
  }
});

module.exports = router;

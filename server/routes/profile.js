// server/routes/profile.js
const express = require('express');
const router = express.Router();
const { getUserById, updateUser } = require('../models/user');

// require login
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
}

router.get('/', requireLogin, async (req, res) => {
  const user = await getUserById(req.session.user.id);
  res.render('profile', { locals: { user } });
});

router.post('/', requireLogin, async (req, res) => {
  const { username, password } = req.body;
  try {
    const updated = await updateUser(req.session.user.id, { username, password });
    // update session username
    req.session.user.username = updated.username;
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.render('profile', { locals: { user: await getUserById(req.session.user.id), error: 'Could not update' } });
  }
});

module.exports = router;

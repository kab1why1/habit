const express = require('express');
const router = express.Router();
const { getAllHabits, getHabitById, createHabit, updateHabit, toggleHabitCompleted } = require('../models/habit');
const { getUserByUsername, createUser } = require('../models/user');

// Home page
router.get('/', async (req, res) => {
  const habits = req.user ? await getAllHabits(req.user.id) : [];
  res.render('index', { habits, user: req.user });
});

// Habits routes
router.get('/habits/manage', async (req, res) => {
  const habits = req.user ? await getAllHabits(req.user.id) : [];
  res.render('habits/manage', { habits, user: req.user });
});

router.get('/habits/new', (req, res) => {
  res.render('habits/new', { errors: [], user: req.user });
});

router.post('/habits/new', async (req, res) => {
  const { title, description, category, color } = req.body;
  try {
    await createHabit({ user_id: req.user.id, title, description, category, color });
    res.redirect('/habits/manage');
  } catch (err) {
    console.error(err);
    res.render('habits/new', { errors: [err.message], user: req.user });
  }
});

router.get('/habits/:id', async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    res.render('habit', { habit, user: req.user });
  } catch (err) {
    console.error(err);
    res.render('habit', { habit: null, user: req.user });
  }
});

router.get('/habits/:id/edit', async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    res.render('habits/edit', { habit, user: req.user });
  } catch (err) {
    console.error(err);
    res.redirect('/habits/manage');
  }
});

router.post('/habits/:id/edit', async (req, res) => {
  try {
    const { title, description, category, color } = req.body;
    await updateHabit(req.params.id, { title, description, category, color });
    res.redirect(`/habits/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.redirect('/habits/manage');
  }
});

router.post('/habits/:id/toggle', async (req, res) => {
  try {
    await toggleHabitCompleted(req.params.id);
    res.redirect('back');
  } catch (err) {
    console.error('Toggle habit error', err);
    res.redirect('/habits/manage');
  }
});

// Login & registration
router.get('/login', (req, res) => res.render('login', { errors: [], user: req.user }));
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await getUserByUsername(username);
    if (!user) return res.render('login', { errors: ['User not found'], user: req.user });

    const bcrypt = require('bcrypt');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { errors: ['Invalid password'], user: req.user });

    req.session.userId = user.id;
    res.redirect('/');
  } catch (err) {
    console.error('Login error', err);
    res.render('login', { errors: [err.message], user: req.user });
  }
});

router.get('/register', (req, res) => res.render('registration', { errors: [], user: req.user }));
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    await createUser({ username, password, role });
    res.redirect('/login');
  } catch (err) {
    console.error('Registration error', err);
    res.render('registration', { errors: [err.message], user: req.user });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/profile', async (req, res) => {
  res.render('profile', { user: req.user, error: null });
});

router.post('/profile', async (req, res) => {
  try {
    const { username, password } = req.body;
    const bcrypt = require('bcrypt');

    let hashedPassword = undefined;
    if (password) hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      UPDATE users
      SET username = $1 ${hashedPassword ? ', password = $2' : ''}
      WHERE id = $3
    `;

    const values = hashedPassword ? [username, hashedPassword, req.user.id] : [username, req.user.id];
    await require('../config/db').pool.query(query, values);
    res.redirect('/');
  } catch (err) {
    console.error('Profile update error', err);
    res.render('profile', { user: req.user, error: err.message });
  }
});

module.exports = router;

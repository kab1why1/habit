const express = require('express');
const router = express.Router();
const { getAllHabits, getHabitById, toggleHabit } = require('../models/habit');
const { ensureLoggedIn } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Home
router.get('/', async (req, res) => {
  const userId = req.session.user?.id || null;
  let habits = [];
  if (userId) {
    habits = await getAllHabits(userId);
  }
  res.render('index', { locals: { habits, user: req.session.user, title: 'Home' } });
});

// Profile
router.get('/profile', ensureLoggedIn, (req, res) => {
  res.render('profile', { locals: { user: req.session.user, title: 'Your Profile', error: null } });
});

router.post('/profile', ensureLoggedIn, async (req, res) => {
  try {
    const { username, password } = req.body;
    const userId = req.session.user.id;
    const pool = require('../models/user').pool;

    const updates = [];
    const values = [];
    let i = 1;

    if (username) {
      updates.push(`username=$${i++}`);
      values.push(username);
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push(`password=$${i++}`);
      values.push(hashed);
    }
    values.push(userId);

    if (updates.length > 0) {
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id=$${i}`, values);
      req.session.user.username = username || req.session.user.username;
    }

    res.render('profile', { locals: { user: req.session.user, title: 'Your Profile', error: null } });
  } catch (err) {
    console.error('Profile update error', err);
    res.render('profile', { locals: { user: req.session.user, title: 'Your Profile', error: 'Failed to update profile' } });
  }
});

// Manage Habits
router.get('/habits/manage', ensureLoggedIn, async (req, res) => {
  try {
    const habits = await getAllHabits(req.session.user.id);
    res.render('habits/manage', { locals: { habits, user: req.session.user, title: 'Manage Habits' } });
  } catch (err) {
    console.error('Get habits error', err);
    res.render('habits/manage', { locals: { habits: [], user: req.session.user, title: 'Manage Habits' } });
  }
});

// Habit details
router.get('/habits/:id', ensureLoggedIn, async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    if (isNaN(habitId)) return res.status(404).send('Habit not found');

    const habit = await getHabitById(habitId, req.session.user.id);
    if (!habit) return res.status(404).send('Habit not found');

    res.render('habit', { locals: { habit, user: req.session.user, title: habit.title } });
  } catch (err) {
    console.error('Get habit error', err);
    res.status(500).send('Error fetching habit');
  }
});

// Toggle habit
router.post('/habits/:id/toggle', ensureLoggedIn, async (req, res) => {
  try {
    const habitId = parseInt(req.params.id);
    if (!isNaN(habitId)) {
      await toggleHabit(habitId, req.session.user.id);
    }
    res.redirect('back');
  } catch (err) {
    console.error('Toggle habit error', err);
    res.redirect('back');
  }
});

module.exports = router;

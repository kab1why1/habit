// server/routes/habits.js
const express = require('express');
const router = express.Router();

const {
  createHabit,
  getAllHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
} = require('../models/habit');

// Middleware to require login
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// List - could be redirected to main index, but provide /habits for user's habits
router.get('/', requireLogin, async (req, res) => {
  const user = req.session.user;
  const habits = await getAllHabits({ user_id: user.id });
  res.render('index', { locals: { title: 'Your Habits', habits, user } });
});

// New form
router.get('/new', requireLogin, (req, res) => {
  res.render('habits/new', { locals: { title: 'Create Habit', user: req.session.user } });
});

// Create
router.post('/', requireLogin, async (req, res) => {
  try {
    const { title, description } = req.body;
    const user_id = req.session.user.id;
    await createHabit({ title, description, user_id });
    res.redirect('/habits');
  } catch (err) {
    console.error(err);
    res.render('habits/new', { locals: { title: 'Create Habit', error: 'Could not create', user: req.session.user } });
  }
});

// Show
router.get('/:id', requireLogin, async (req, res) => {
  const habit = await getHabitById(req.params.id);
  if (!habit) return res.status(404).send('Not found');
  // ensure ownership (admin can also view? here only owner allowed)
  if (habit.user_id && habit.user_id !== req.session.user.id && !req.session.user.is_admin) {
    return res.status(403).send('Forbidden');
  }
  res.render('habits/show', { locals: { habit, user: req.session.user } });
});

// Edit form
router.get('/:id/edit', requireLogin, async (req, res) => {
  const habit = await getHabitById(req.params.id);
  if (!habit) return res.status(404).send('Not found');
  if (habit.user_id && habit.user_id !== req.session.user.id && !req.session.user.is_admin) {
    return res.status(403).send('Forbidden');
  }
  res.render('habits/edit', { locals: { habit, user: req.session.user } });
});

// Update
router.post('/:id/edit', requireLogin, async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    if (!habit) return res.status(404).send('Not found');
    if (habit.user_id && habit.user_id !== req.session.user.id && !req.session.user.is_admin) {
      return res.status(403).send('Forbidden');
    }

    const { title, description } = req.body;
    await updateHabit(req.params.id, { title, description });
    res.redirect(`/habits/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.render('habits/edit', { locals: { habit: await getHabitById(req.params.id), error: 'Could not update', user: req.session.user } });
  }
});

// Delete
router.post('/:id/delete', requireLogin, async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    if (!habit) return res.status(404).send('Not found');
    if (habit.user_id && habit.user_id !== req.session.user.id && !req.session.user.is_admin) {
      return res.status(403).send('Forbidden');
    }
    await deleteHabit(req.params.id);
    res.redirect('/habits');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting');
  }
});

module.exports = router;

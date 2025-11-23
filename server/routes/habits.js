const express = require('express');
const router = express.Router();
const {
  createHabit,
  getAllHabits,
  getHabitById,
  updateHabit,
  deleteHabit,
  toggleHabitCompleted,
} = require('../models/habit');

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

// List user's habits
router.get('/', requireLogin, async (req, res) => {
  const user = req.session.user;
  const habits = await getAllHabits(user.id); // FIXED: pass user.id directly
  res.render('habits/manage', { locals: { title: 'My Habits', habits, user } });
});

// New form
router.get('/new', requireLogin, (req, res) => {
  res.render('habits/new', { locals: { title: 'Create Habit', errors: [], user: req.session.user } });
});

// Create
router.post('/', requireLogin, async (req, res) => {
  try {
    const { title, description, category, color } = req.body;
    if (!title) return res.render('habits/new', { locals: { errors: ['Title is required'], user: req.session.user } });

    await createHabit({ title, description, category, color, user_id: req.session.user.id });
    res.redirect('/habits');
  } catch (err) {
    console.error(err);
    res.render('habits/new', { locals: { errors: ['Could not create habit'], user: req.session.user } });
  }
});

// Show habit
router.get('/:id', requireLogin, async (req, res) => {
  const habit = await getHabitById(req.params.id);
  if (!habit) return res.status(404).send('Not found');
  if (habit.user_id !== req.session.user.id && !req.session.user.is_admin) return res.status(403).send('Forbidden');
  res.render('habits/show', { locals: { habit, user: req.session.user } });
});

// Edit form
router.get('/:id/edit', requireLogin, async (req, res) => {
  const habit = await getHabitById(req.params.id);
  if (!habit) return res.status(404).send('Not found');
  if (habit.user_id !== req.session.user.id && !req.session.user.is_admin) return res.status(403).send('Forbidden');
  res.render('habits/edit', { locals: { habit, user: req.session.user } });
});

// Update
router.post('/:id/edit', requireLogin, async (req, res) => {
  const habit = await getHabitById(req.params.id);
  if (!habit) return res.status(404).send('Not found');
  if (habit.user_id !== req.session.user.id && !req.session.user.is_admin) return res.status(403).send('Forbidden');

  try {
    const { title, description, category, color } = req.body;
    await updateHabit(req.params.id, { title, description, category, color });
    res.redirect(`/habits/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.render('habits/edit', { locals: { habit: await getHabitById(req.params.id), errors: ['Could not update'], user: req.session.user } });
  }
});

// Delete
router.post('/:id/delete', requireLogin, async (req, res) => {
  const habit = await getHabitById(req.params.id);
  if (!habit) return res.status(404).send('Not found');
  if (habit.user_id !== req.session.user.id && !req.session.user.is_admin) return res.status(403).send('Forbidden');

  try {
    await deleteHabit(req.params.id);
    res.redirect('/habits');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting');
  }
});

// Toggle
router.post('/:id/toggle', requireLogin, async (req, res) => {
  const habit = await getHabitById(req.params.id);
  if (!habit) return res.status(404).send('Not found');
  if (habit.user_id !== req.session.user.id && !req.session.user.is_admin) return res.status(403).send('Forbidden');

  await toggleHabitCompleted(req.params.id);
  res.redirect(req.get('Referer') || '/habits');
});

module.exports = router;

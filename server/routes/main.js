const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { ensureLoggedIn } = require('../middleware/auth'); 

const { 
  getAllHabits, getHabitById, createHabit, updateHabit, 
  toggleHabitCompleted, incrementHabit, deleteHabit, 
  getHabitHistory, getHabitStats 
} = require('../models/habit');

const { createUser, getUserByUsername, getLeaderboard } = require('../models/user');

// --- HOME (DASHBOARD) ---
router.get('/', async (req, res) => {
  let habits = [];
  let stats = { totalHabits: 0, completedHabits: 0 };
  let history = {};
  let last60Days = [];

  if (res.locals.user) {
    try {
        habits = await getAllHabits(res.locals.user.id);
        history = await getHabitHistory(res.locals.user.id);
        stats.totalHabits = habits.length;
        stats.completedHabits = habits.filter(h => h.completed).length;

        // Generate dates for heatmap
        for (let i = 59; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last60Days.push(d.toISOString().split('T')[0]);
        }
    } catch (err) { console.error(err); }
  }
  res.render('index', { habits, stats, user: res.locals.user, history, last60Days, viewDate: null });
});

// --- HISTORY ---
router.get('/history', ensureLoggedIn, async (req, res) => {
  const selectedDate = req.query.date; 
  if (!selectedDate || new Date(selectedDate) > new Date()) return res.redirect('/');

  let habits = [];
  let stats = { totalHabits: 0, completedHabits: 0 };
  
  try {
      habits = await getAllHabits(res.locals.user.id, selectedDate);
      stats.totalHabits = habits.length;
      stats.completedHabits = habits.filter(h => h.completed).length;
  } catch (err) { console.error(err); }

  res.render('index', { 
      habits, stats, user: res.locals.user, 
      history: {}, last60Days: [], 
      viewDate: selectedDate 
  });
});

// --- LEADERBOARD ---
router.get('/leaderboard', ensureLoggedIn, async (req, res) => {
  try {
    const leaders = await getLeaderboard();
    res.render('leaderboard', { leaders, user: res.locals.user });
  } catch (err) {
    res.redirect('/');
  }
});

// --- HABIT MANAGEMENT ---

// 1. Specific Routes FIRST
router.get('/habits/manage', ensureLoggedIn, async (req, res) => {
  const habits = await getAllHabits(res.locals.user.id);
  res.render('habits/manage', { habits, user: res.locals.user });
});

router.get('/habits/new', ensureLoggedIn, (req, res) => {
  res.render('habits/new', { errors: [], user: res.locals.user });
});

router.post('/habits/new', ensureLoggedIn, async (req, res) => {
  try {
    await createHabit({
      user_id: res.locals.user.id,
      title: req.body.title, description: req.body.description,
      category: req.body.category, color: req.body.color,
      type: req.body.type || 'boolean', target_value: req.body.target_value || 1 
    });
    res.redirect('/habits/manage');
  } catch (err) { res.render('habits/new', { errors: [err.message], user: res.locals.user }); }
});

// 2. ID-Based Routes SECOND
router.get('/habits/:id/stats', ensureLoggedIn, async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id, res.locals.user.id);
    if (!habit) return res.redirect('/');
    const statsData = await getHabitStats(req.params.id, res.locals.user.id);
    const labels = statsData.map(row => row.date);
    const values = statsData.map(row => row.current_value);
    res.render('habits/stats', { habit, labels, values, user: res.locals.user });
  } catch (err) { res.redirect('/'); }
});

router.get('/habits/:id/edit', ensureLoggedIn, async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id, res.locals.user.id);
    if (!habit) return res.redirect('/habits/manage');
    res.render('habits/edit', { habit, user: res.locals.user });
  } catch (err) { res.redirect('/habits/manage'); }
});

router.post('/habits/:id/edit', ensureLoggedIn, async (req, res) => {
  try {
    await updateHabit(req.params.id, res.locals.user.id, {
      title: req.body.title, description: req.body.description,
      category: req.body.category, color: req.body.color,
      type: req.body.type, target_value: req.body.target_value
    });
    res.redirect(`/habits/${req.params.id}`);
  } catch (err) { res.redirect('/habits/manage'); }
});

// THIS WAS THE MISSING ROUTE causing the error
router.get('/habits/:id', ensureLoggedIn, async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id, res.locals.user.id);
    if (!habit) return res.redirect('/habits/manage');
    res.render('habit', { habit, user: res.locals.user });
  } catch (err) {
    console.error(err);
    res.redirect('/habits/manage');
  }
});

// --- ACTIONS (Toggle/Increment/Delete) ---
router.post('/habits/:id/toggle', ensureLoggedIn, async (req, res) => {
  const date = req.query.date || null;
  try {
    await toggleHabitCompleted(req.params.id, res.locals.user.id, date);
    const redirectUrl = date ? `/history?date=${date}` : '/';
    res.redirect(redirectUrl);
  } catch (err) { res.redirect('/'); }
});

router.post('/habits/:id/increment', ensureLoggedIn, async (req, res) => {
  const date = req.query.date || null;
  try {
    await incrementHabit(req.params.id, res.locals.user.id, 1, date);
    const redirectUrl = date ? `/history?date=${date}` : '/';
    res.redirect(redirectUrl);
  } catch (err) { res.redirect('/'); }
});

router.post('/habits/:id/decrement', ensureLoggedIn, async (req, res) => {
  const date = req.query.date || null;
  try {
    await incrementHabit(req.params.id, res.locals.user.id, -1, date);
    const redirectUrl = date ? `/history?date=${date}` : '/';
    res.redirect(redirectUrl);
  } catch (err) { res.redirect('/'); }
});

router.post('/habits/:id/delete', ensureLoggedIn, async (req, res) => {
  try {
    await deleteHabit(req.params.id, res.locals.user.id);
    res.redirect('/habits/manage');
  } catch (err) { res.redirect('/habits/manage'); }
});

// --- AUTH ---
router.get('/register', (req, res) => { res.render('registration', { errors: [], user: null }); });
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = await createUser({ username, password, role: role || 'user' });
    req.session.userId = user.id;
    res.redirect('/');
  } catch (err) { res.render('registration', { errors: [err.message], user: null }); }
});

router.get('/login', (req, res) => { res.render('login', { errors: [], user: null }); });
router.post('/login', async (req, res) => {
  try {
    const user = await getUserByUsername(req.body.username);
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      throw new Error('Invalid credentials');
    }
    req.session.userId = user.id;
    res.redirect('/');
  } catch (err) { res.render('login', { errors: [err.message], user: null }); }
});

router.get('/logout', (req, res) => { req.session.destroy(() => { res.redirect('/'); }); });

module.exports = router;
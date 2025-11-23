const express = require('express');
const router = express.Router();

const {
  createHabitsTable,
  getAllHabits,
  getHabitById,
  createHabit,
  updateHabit,
  toggleHabitCompleted,
  deleteHabit,
} = require('../models/habit');

const {
  createUsersTable,
  createUser,
  getUserByUsername,
} = require('../models/user');

createHabitsTable().catch(err => console.error('createHabitsTable error', err));
createUsersTable().catch(err => console.error('createUsersTable error', err));

// Home page
router.get('/', async (req, res) => {
  let habits = [];
  if (res.locals.user) {
    habits = await getAllHabits(res.locals.user.id);
  }
  res.render('index', { habits });
});

// Habits manage page
router.get('/habits/manage', async (req, res) => {
  const habits = res.locals.user ? await getAllHabits(res.locals.user.id) : [];
  res.render('habits/manage', { habits });
});

// Habit create
router.get('/habits/new', (req, res) => {
  res.render('habits/new', { errors: [] });
});

router.post('/habits/new', async (req, res) => {
  try {
    const habit = {
      user_id: res.locals.user.id,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      color: req.body.color,
    };
    await createHabit(habit);
    res.redirect('/habits/manage');
  } catch (err) {
    console.error('Create habit error', err);
    res.render('habits/new', { errors: [err.message] });
  }
});

// Habit show
router.get('/habits/:id', async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    res.render('habit', { habit });
  } catch (err) {
    console.error('Get habit error', err);
    res.redirect('/habits/manage');
  }
});

// Habit edit
router.get('/habits/:id/edit', async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    res.render('habits/edit', { habit });
  } catch (err) {
    console.error('Edit habit error', err);
    res.redirect('/habits/manage');
  }
});

router.post('/habits/:id/edit', async (req, res) => {
  try {
    await updateHabit(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      color: req.body.color,
    });
    res.redirect(`/habits/${req.params.id}`);
  } catch (err) {
    console.error('Update habit error', err);
    res.redirect('/habits/manage');
  }
});

// Habit toggle
router.post('/habits/:id/toggle', async (req, res) => {
  try {
    await toggleHabitCompleted(req.params.id);
    res.redirect(req.get('Referrer') || '/');
  } catch (err) {
    console.error('Toggle habit error', err);
    res.redirect('/');
  }
});

// Habit delete
router.post('/habits/:id/delete', async (req, res) => {
  try {
    await deleteHabit(req.params.id);
    res.redirect('/habits/manage');
  } catch (err) {
    console.error('Delete habit error', err);
    res.redirect('/habits/manage');
  }
});

// Registration
router.get('/register', (req, res) => {
  res.render('registration', { errors: [] });
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = await createUser(username, password, role || 'user');
    req.session.userId = user.id;
    res.redirect('/');
  } catch (err) {
    console.error('Registration error', err);
    res.render('registration', { errors: [err.message] });
  }
});

// Login
router.get('/login', (req, res) => {
  res.render('login', { errors: [] });
});

router.post('/login', async (req, res) => {
  try {
    const user = await getUserByUsername(req.body.username);
    if (!user) return res.render('login', { errors: ['User not found'] });

    const bcrypt = require('bcrypt');
    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.render('login', { errors: ['Invalid password'] });

    req.session.userId = user.id;
    res.redirect('/');
  } catch (err) {
    console.error('Login error', err);
    res.render('login', { errors: [err.message] });
  }
});

// Profile
router.get('/profile', (req, res) => {
  if (!res.locals.user) return res.redirect('/login');
  res.render('profile', { user: res.locals.user, error: null });
});

router.post('/profile', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = res.locals.user;
    const bcrypt = require('bcrypt');
    let newPassword = user.password;

    if (password) {
      newPassword = await bcrypt.hash(password, 10);
    }

    const query = `
      UPDATE users SET username=$1, password=$2 WHERE id=$3
    `;
    await require('../config/db').pool.query(query, [username, newPassword, user.id]);
    res.redirect('/profile');
  } catch (err) {
    console.error('Profile update error', err);
    res.render('profile', { user: res.locals.user, error: err.message });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    res.redirect('/');
  });
});

module.exports = router;

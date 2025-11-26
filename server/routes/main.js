const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

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

// Ensure tables exist
createHabitsTable().catch(err => console.error('createHabitsTable error', err));
createUsersTable().catch(err => console.error('createUsersTable error', err));

// Home page
router.get('/', async (req, res) => {
  let habits = [];
  let stats = {
    totalHabits: 0,
    completedHabits: 0,
    currentStreak: 0,
    longestStreak: 0
  };

  if (res.locals.user) {
    habits = await getAllHabits(res.locals.user.id);

    stats.totalHabits = habits.length;
    stats.completedHabits = habits.filter(h => h.completed).length;

    let currentStreak = 0;
    let longestStreak = 0;

    habits.forEach(h => {
      if (h.streak) {
        if (h.streak > longestStreak) longestStreak = h.streak;
        currentStreak = Math.max(currentStreak, h.streak);
      }
    });

    stats.currentStreak = currentStreak;
    stats.longestStreak = longestStreak;
  }

  res.render('index', { habits, stats, user: res.locals.user });
});

// Habits manage page
router.get('/habits/manage', async (req, res) => {
  const habits = res.locals.user ? await getAllHabits(res.locals.user.id) : [];
  res.render('habits/manage', { habits, user: res.locals.user });
});

// Habit create
router.get('/habits/new', (req, res) => {
  res.render('habits/new', { errors: [], user: res.locals.user });
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
    res.render('habits/new', { errors: [err.message], user: res.locals.user });
  }
});

// Habit show
router.get('/habits/:id', async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    res.render('habit', { habit, user: res.locals.user });
  } catch (err) {
    console.error('Get habit error', err);
    res.redirect('/habits/manage');
  }
});

// Habit edit
router.get('/habits/:id/edit', async (req, res) => {
  try {
    const habit = await getHabitById(req.params.id);
    res.render('habits/edit', { habit, user: res.locals.user });
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
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Make sure username and password exist
    if (!username || !password) {
      return res.render('registration', {
        errors: ['Username and password are required'],
        user: res.locals.user
      });
    }

    // Pass as single object
    const user = await createUser({ username, password, role: role || 'user' });

    req.session.userId = user.id;
    res.redirect('/');
  } catch (err) {
    console.error('Registration error', err);
    res.render('registration', { errors: [err.message], user: res.locals.user });
  }
});


// Login
router.get('/login', (req, res) => {
  res.render('login', { errors: [], user: res.locals.user });
});

router.post('/login', async (req, res) => {
  try {
    const user = await getUserByUsername(req.body.username);
    if (!user) return res.render('login', { errors: ['User not found'], user: res.locals.user });

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.render('login', { errors: ['Invalid password'], user: res.locals.user });

    req.session.userId = user.id;
    res.redirect('/');
  } catch (err) {
    console.error('Login error', err);
    res.render('login', { errors: [err.message], user: res.locals.user });
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
    let newPassword = user.password;

    if (password) {
      newPassword = await bcrypt.hash(password, 10);
    }

    const query = `UPDATE users SET username=$1, password=$2 WHERE id=$3`;
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

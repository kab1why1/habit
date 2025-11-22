require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const { testConnection, pool } = require('./server/config/db');

const mainRoutes = require('./server/routes/main');
const adminRoutes = require('./server/routes/admin');
const habitsRoutes = require('./server/routes/habits');
const profileRoutes = require('./server/routes/profile');
const setUser = require('./server/middleware/setUser');

const { createHabitsTable } = require('./server/models/habit');
const { createUsersTable } = require('./server/models/user');

const app = express();
const PORT = process.env.PORT || 5000;

// Static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// Middleware to pass user to templates
app.use(setUser);

// EJS
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Routes
app.use('/', mainRoutes);
app.use('/admin', adminRoutes);
app.use('/habits', habitsRoutes);
app.use('/profile', profileRoutes);

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await testConnection();

  // Ensure essential tables exist (safe)
  try {
    await createUsersTable(); // safe if already exists
    await createHabitsTable();
    console.log('Essential tables ready');
  } catch (err) {
    console.error('Error creating tables', err);
  }
});

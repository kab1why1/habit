require('dotenv').config();
const express = require('express');
const expressLayout = require('express-ejs-layouts');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool, testConnection } = require('./server/config/db');

const mainRoutes = require('./server/routes/main');
const adminRoutes = require('./server/routes/admin');
const setUser = require('./server/middleware/setUser');

const app = express();
const PORT = process.env.PORT || 5000;

// Static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(
  session({
    store: new pgSession({ pool }),
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
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

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await testConnection();
});

require('dotenv').config();
const express = require('express');
const expressLayout = require('express-ejs-layouts');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./server/config/db');

// --- ROUTES ---
const mainRoutes = require('./server/routes/main');
const adminRoutes = require('./server/routes/admin');
const profileRoutes = require('./server/routes/profile'); // <--- MAKE SURE THIS IS HERE (Line 11)
const setUser = require('./server/middleware/setUser');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('view engine', 'ejs');
app.set('layout', './layouts/main');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  store: new pgSession({ pool }),
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.use(expressLayout);
app.use(setUser);

// --- MOUNT ROUTES ---
app.use('/admin', adminRoutes);
app.use('/profile', profileRoutes); // <--- CRITICAL: This connects the URL to the file (Line 35)
app.use('/', mainRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
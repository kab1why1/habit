require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const { testConnection } = require('./server/config/db');
const { createHabitsTable } = require('./server/models/habit');

const app = express();
const PORT = process.env.PORT || 5000;

// Public
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Views
app.use(expressLayout);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Routes
app.use('/', require('./server/routes/main'));

// Server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await testConnection();
  await createHabitsTable();
  console.log("Habits table ready");
});

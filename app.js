require('dotenv').config();

const express = require('express');
const expressLayout = require('express-ejs-layouts');
const db = require('./server/config/db'); // <- our DB utils

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static('public'));
app.use(expressLayout);
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');

app.use('/', require('./server/routes/main'));

// Start app only after DB connection is tested
(async () => {
  try {
    await db.testConnection();
    app.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server not started due to DB connection error.');
    process.exit(1); // optional: stop the process so you notice the problem
  }
})();

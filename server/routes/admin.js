const express = require('express');
const router = express.Router();
const { createUsersTable } = require('../models/user');

createUsersTable().catch(err => console.error('Error creating admin-related tables', err));

// Admin login
router.get('/', (req, res) => res.render('admin/index'));
router.post('/login', async (req, res) => {
  // Admin login logic
  res.send('Admin login not implemented yet');
});

router.get('/dashboard', (req, res) => res.render('admin/dashboard'));

module.exports = router;

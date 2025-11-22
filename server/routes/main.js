const express = require('express');
const router = express.Router();
const { createUser, findByUsername } = require('../models/user');
const bcrypt = require('bcrypt');

// TEMP: create a sample post function
const { createPost, getAllPosts } = require('../models/post');

async function insertPostData() {
    try {
        await createPost({
            title: "My first habit post",
            description: "This is a test post to check if PostgreSQL works."
        });
        console.log("Sample post inserted!");
    } catch (err) {
        console.error("Error inserting post:", err);
    }
}

// insertPostData(); // run once

// Home page
router.get('/', async (req, res) => {
    const posts = await getAllPosts();
    const locals = {
        title: "HabitFlow",
        description: "Just an app to track your habits",
        posts,
        user: req.session?.user || null
    };
    res.render('index', { locals });
});

// Register page
router.get('/register', (req, res) => {
    res.render('register', { locals: { title: "Register", user: null, errors: [] } });
});

// Handle registration
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const errors = [];

    if (!username || !password) {
        errors.push("All fields are required");
        return res.render('register', { locals: { title: "Register", errors, user: null } });
    }

    try {
        const existingUser = await findByUsername(username);
        if (existingUser) {
            errors.push("Username already exists");
            return res.render('register', { locals: { title: "Register", errors, user: null } });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser({ username, password: hashedPassword });

        res.redirect('/login');
    } catch (err) {
        console.error("Register error", err);
        errors.push("Something went wrong");
        res.render('register', { locals: { title: "Register", errors, user: null } });
    }
});

// Login page
router.get('/login', (req, res) => {
    res.render('login', { locals: { title: "Login", user: null, errors: [] } });
});

// Handle login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const errors = [];

    if (!username || !password) {
        errors.push("All fields are required");
        return res.render('login', { locals: { title: "Login", errors, user: null } });
    }

    try {
        const user = await findByUsername(username);
        if (!user) {
            errors.push("Invalid username or password");
            return res.render('login', { locals: { title: "Login", errors, user: null } });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            errors.push("Invalid username or password");
            return res.render('login', { locals: { title: "Login", errors, user: null } });
        }

        // Save user in session
        req.session.user = { id: user.id, username: user.username, is_admin: user.is_admin };
        res.redirect('/');
    } catch (err) {
        console.error("Login error", err);
        errors.push("Something went wrong");
        res.render('login', { locals: { title: "Login", errors, user: null } });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;

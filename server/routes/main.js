const express = require('express');
const router = express.Router();


// Routes
router.get('/', (req, res) => {
    const locals = {
        title: "HabitFlow",
        description: "Just an app to track your habits"
    };

    res.render('index', { locals });
});

router.get('/about', (req, res) => {
    res.render('index'); 
});

module.exports = router;
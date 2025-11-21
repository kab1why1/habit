const express = require('express');
const router = express.Router();

const { createHabit, getAllHabits } = require('../models/habit');

// TEMPORARY DEBUG FUNCTION
async function insertHabitData() {
    try {
        await createHabit({
            title: "Drink Water",
            description: "Drink 8 cups daily"
        });

        await createHabit({
            title: "Study Programming",
            description: "At least 2 hours"
        });

        console.log("Sample habits inserted!");
    } catch (err) {
        console.error("Error inserting habit:", err);
    }
}

// Run ONCE manually if needed
// insertHabitData();

// Main route
router.get('/', async (req, res) => {
    const habits = await getAllHabits();

    const locals = {
        title: "HabitFlow",
        description: "Just an app to track your habits",
        habits
    };

    res.render('index', { locals });
});

router.get('/about', (req, res) => {
    res.render('about');
});

module.exports = router;

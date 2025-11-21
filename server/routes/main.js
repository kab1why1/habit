const express = require('express');
const router = express.Router();

const {
  createHabit,
  getAllHabits,
  getHabitById
} = require('../models/habit');

// TEMP insert test habit once
// createHabit({ title: "Drink Water", description: "8 cups a day" });

// Home — show all habits
router.get('/', async (req, res) => {
    const habits = await getAllHabits();

    const locals = {
        title: "HabitFlow",
        description: "Track your habits",
        habits
    };

    res.render('index', { locals });
});

// Single habit page
router.get('/habit/:id', async (req, res) => {
    const id = req.params.id;
    const habit = await getHabitById(id);

    if (!habit) {
        return res.status(404).send("Habit not found");
    }

    res.render('habit', { habit });
});

// About page
router.get('/about', (req, res) => {
    res.render('about');
});

module.exports = router;

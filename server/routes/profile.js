const express = require('express');
const router = express.Router();
const { getUserById, updateUser } = require('../models/user');
// Import habit model to calculate stats/badges
const { getAllHabits } = require('../models/habit');

function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) return res.redirect('/login');
  next();
}

router.get('/', requireLogin, async (req, res) => {
  try {
    const user = await getUserById(req.session.userId);
    const habits = await getAllHabits(req.session.userId);

    // --- BADGE LOGIC ---
    const badges = [];

    // 1. Level Badges
    if (user.level >= 1) badges.push({ icon: '🌱', name: 'Novice', desc: 'Started the journey' });
    if (user.level >= 5) badges.push({ icon: '⚔️', name: 'Apprentice', desc: 'Reached Level 5' });
    if (user.level >= 10) badges.push({ icon: '👑', name: 'Master', desc: 'Reached Level 10' });

    // 2. Streak Badges (Calculate max streak across all habits)
    const maxStreak = Math.max(...habits.map(h => h.streak || 0), 0);
    
    if (maxStreak >= 3) badges.push({ icon: '🔥', name: 'Heating Up', desc: '3 Day Streak' });
    if (maxStreak >= 7) badges.push({ icon: '🚀', name: 'Unstoppable', desc: '7 Day Streak' });
    if (maxStreak >= 30) badges.push({ icon: '💎', name: 'Discipline', desc: '30 Day Streak' });

    // --- XP PROGRESS CALCULATION ---
    // Logic: Level 1 is 0-99 XP. Level 2 starts at 100 XP.
    // XP needed for current level = (Level - 1) * 100
    const currentLevelXpStart = (user.level - 1) * 100;
    
    // How much XP do we have *within* this level?
    const xpInCurrentLevel = user.xp - currentLevelXpStart;
    
    // Every level is 100 XP wide in our simple math
    const xpNeeded = 100; 
    
    const progressPercent = Math.min((xpInCurrentLevel / xpNeeded) * 100, 100);

    res.render('profile', { 
        user, 
        badges, 
        progressPercent,
        joinDate: new Date(user.created_at).toLocaleDateString(),
        error: null 
    });

  } catch (err) {
    console.error(err);
    res.render('profile', { user: null, badges: [], progressPercent: 0, joinDate: '', error: 'Could not load profile' });
  }
});

router.post('/', requireLogin, async (req, res) => {
  const { username, password } = req.body;
  try {
    await updateUser(req.session.userId, { username, password });
    res.redirect('/profile');
  } catch (err) {
    // If update fails, re-fetch user to show page again with error
    const user = await getUserById(req.session.userId);
    res.render('profile', { user, badges: [], progressPercent: 0, joinDate: '', error: 'Update failed' });
  }
});

module.exports = router;
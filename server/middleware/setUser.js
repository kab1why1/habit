const { getUserById } = require('../models/user');

module.exports = async function (req, res, next) {
  try {
    // 1. Check if session exists and has a userId
    if (req.session && req.session.userId) {
      
      // 2. Check if the model function is actually loaded
      if (typeof getUserById !== 'function') {
        console.error("CRITICAL ERROR: getUserById is not a function. Check models/user.js exports.");
        res.locals.user = null;
        return next();
      }

      // 3. Fetch the user
      const user = await getUserById(req.session.userId);
      res.locals.user = user || null;
    } else {
      res.locals.user = null;
    }
    next();
  } catch (err) {
    console.error('setUser middleware error', err);
    res.locals.user = null;
    next();
  }
};
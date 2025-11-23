// server/middleware/setUser.js
const { getUserById } = require('../models/user');

module.exports = async function (req, res, next) {
  try {
    if (req.session.userId) {
      const user = await getUserById(req.session.userId);
      res.locals.user = user || null; // pass user to all EJS templates
    } else {
      res.locals.user = null;
    }
    next();
  } catch (err) {
    console.error('setUser error', err);
    res.locals.user = null;
    next();
  }
};

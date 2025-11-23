const { getUserById } = require('../models/user');

module.exports = async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await getUserById(req.session.userId);
      res.locals.user = user;
    } catch (err) {
      console.error('setUser error', err);
    }
  }
  next();
};

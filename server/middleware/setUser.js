const { getUserById } = require('../models/user');

module.exports = async function (req, res, next) {
  if (req.session.userId) {
    const user = await getUserById(req.session.userId);
    res.locals.user = req.user = user;
  } else {
    res.locals.user = req.user = null;
  }
  next();
};

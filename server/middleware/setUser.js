const { getUserById } = require('../models/user');

module.exports = async function (req, res, next) {
  if (req.session && req.session.userId) {
    const user = await getUserById(req.session.userId);
    res.locals.user = user || null;
    req.user = user || null;
  } else {
    res.locals.user = null;
    req.user = null;
  }
  next();
};

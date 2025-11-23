// server/middleware/ensureAdmin.js
module.exports = function ensureAdmin(req, res, next) {
  const user = res.locals.user || null;
  if (!user || user.role !== 'admin') {
    // not allowed -> send to admin login (or show 403)
    return res.redirect('/admin');
  }
  next();
};

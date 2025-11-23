// server/middleware/auth.js
function ensureLoggedIn(req, res, next) {
  if (!req.session.user) return res.redirect('/login');
  next();
}

function ensureAdmin(req, res, next) {
  // FIXED: use is_admin instead of role
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/admin');
  next();
}

module.exports = { ensureLoggedIn, ensureAdmin };

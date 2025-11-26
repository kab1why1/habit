function ensureLoggedIn(req, res, next) {
  // Check for userId (which we set in login/register)
  if (req.session.userId) {
    next();
  } else {
    // If no ID in session, they aren't logged in
    req.session.destroy(() => {
        res.redirect('/login');
    });
  }
}

module.exports = { ensureLoggedIn };
function ensureAdmin(req, res, next) {
if (!req.session.user || req.session.user.role !== 'admin') {
return res.redirect('/admin');
}
next();
}


module.exports = { ensureAdmin };
export function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const adminToken = process.env.ADMIN_TOKEN || 'admin123';

  if (!token || token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized: invalid admin token' });
  }

  next();
}

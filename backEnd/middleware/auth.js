import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'resumely-dev-secret-key-change-in-production';

export function createAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, getJwtSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

export function requireAuth(req, res, next) {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    req.auth = jwt.verify(token, getJwtSecret());
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

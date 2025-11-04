import jwt from 'jsonwebtoken';

export const auth = (req, _res, next) => {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return next(Object.assign(new Error('Unauthorized'), { status: 401 }));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    next(Object.assign(new Error('Unauthorized'), { status: 401 }));
  }
};

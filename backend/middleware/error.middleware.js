export const notFound = (_req, _res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
};

export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const payload = {
    message: err.message || 'Server error',
    ...(err.details ? { details: err.details } : {})
  };
  res.status(status).json(payload);
};

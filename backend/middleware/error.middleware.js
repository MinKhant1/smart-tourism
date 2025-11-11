export const notFound = (_req, _res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
};

export const errorHandler = (err, _req, res, _next) => {
  try {
    const method = _req?.method;
    const url = _req?.originalUrl || _req?.url;
    const status = err.status || 500;
    const stack = err.stack || '';
    // Log rich error context to server console for debugging
    console.error(`[Error ${status}] ${method} ${url} -> ${err.message}`);
    if (stack) console.error(stack);
  } catch {}
  const status = err.status || 500;
  const payload = {
    message: err.message || 'Server error',
    ...(err.details ? { details: err.details } : {})
  };
  res.status(status).json(payload);
};

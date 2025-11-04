export const validate = (schema) => (req, _res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (e) {
    const issues = e?.issues?.map(i => ({ path: i.path, message: i.message })) ?? [];
    next(Object.assign(new Error('Validation error'), { status: 400, details: issues }));
  }
};

import { ApiError } from '../utils/ApiError.js';

/**
 * Validate incoming requests using Zod schemas
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
export const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = await schema.parseAsync(dataToValidate);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.name === 'ZodError' || Array.isArray(err.issues)) {
        const issues = err.issues || [];
        const formattedErrors = issues.map((e) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : '',
          message: e.message,
        }));
        const message = formattedErrors.map((e) => e.message).join('; ') || err.message;
        return next(new ApiError(400, `Validation error: ${message}`, formattedErrors));
      }
      next(err);
    }
  };
};

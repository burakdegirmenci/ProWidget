/**
 * Auth Validators
 * Zod schemas for authentication endpoints
 *
 * @module validators/auth
 */

const { z } = require('zod');

/**
 * Login request validation schema
 */
const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required'
      })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z
      .string({
        required_error: 'Password is required'
      })
      .min(1, 'Password is required')
  })
});

/**
 * Register request validation schema
 */
const registerSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required'
      })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z
      .string({
        required_error: 'Password is required'
      })
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number, and special character'
      ),
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(50, 'First name must not exceed 50 characters')
      .optional(),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters')
      .max(50, 'Last name must not exceed 50 characters')
      .optional(),
    role: z
      .enum(['admin', 'editor', 'viewer'], {
        errorMap: () => ({ message: 'Invalid role' })
      })
      .optional()
      .default('viewer')
  })
});

/**
 * Refresh token validation schema
 */
const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({
        required_error: 'Refresh token is required'
      })
      .min(1, 'Refresh token is required')
  })
});

/**
 * Change password validation schema
 */
const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({
        required_error: 'Current password is required'
      })
      .min(1, 'Current password is required'),
    newPassword: z
      .string({
        required_error: 'New password is required'
      })
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number, and special character'
      )
  }).refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message: 'New password must be different from current password',
      path: ['newPassword']
    }
  )
});

module.exports = {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema
};

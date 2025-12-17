/**
 * Theme Validators
 * Zod schemas for theme endpoints
 *
 * @module validators/theme
 */

const { z } = require('zod');
const { HEX_COLOR_PATTERN } = require('../config/constants');

/**
 * Hex color validation helper
 */
const hexColor = z
  .string()
  .regex(HEX_COLOR_PATTERN, 'Invalid hex color format (e.g., #FF5733 or #F53)');

/**
 * Theme ID parameter validation
 */
const themeIdParam = z.object({
  params: z.object({
    id: z.string().uuid('Invalid theme ID format')
  })
});

/**
 * CSS variables schema
 */
const cssVariablesSchema = z.record(
  z.string().regex(/^--[\w-]+$/, 'CSS variable must start with --'),
  z.string()
).optional();

/**
 * Create theme validation schema
 */
const createThemeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format')
  }),
  body: z.object({
    name: z
      .string({
        required_error: 'Theme name is required'
      })
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters')
      .trim(),
    primaryColor: hexColor.optional().default('#000000'),
    secondaryColor: hexColor.optional().default('#ffffff'),
    backgroundColor: hexColor.optional().default('#ffffff'),
    textColor: hexColor.optional().default('#333333'),
    fontFamily: z
      .string()
      .max(255, 'Font family too long')
      .optional()
      .default('inherit'),
    borderRadius: z
      .string()
      .regex(/^\d+(px|rem|em|%)$/, 'Invalid border radius format (e.g., 8px, 0.5rem)')
      .optional()
      .default('8px'),
    cssVariables: cssVariablesSchema.optional().default({}),
    customCss: z
      .string()
      .max(10000, 'Custom CSS too long')
      .optional()
      .nullable(),
    isActive: z
      .boolean()
      .optional()
      .default(false)
  })
});

/**
 * Update theme validation schema
 */
const updateThemeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid theme ID format')
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters')
      .trim()
      .optional(),
    primaryColor: hexColor.optional(),
    secondaryColor: hexColor.optional(),
    backgroundColor: hexColor.optional(),
    textColor: hexColor.optional(),
    fontFamily: z
      .string()
      .max(255, 'Font family too long')
      .optional(),
    borderRadius: z
      .string()
      .regex(/^\d+(px|rem|em|%)$/, 'Invalid border radius format')
      .optional(),
    cssVariables: cssVariablesSchema.optional(),
    customCss: z
      .string()
      .max(10000, 'Custom CSS too long')
      .optional()
      .nullable(),
    isActive: z
      .boolean()
      .optional()
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  )
});

/**
 * List themes query validation
 */
const listThemesSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format')
  }),
  query: z.object({
    isActive: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional()
  })
});

module.exports = {
  themeIdParam,
  createThemeSchema,
  updateThemeSchema,
  listThemesSchema
};

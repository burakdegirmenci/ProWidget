/**
 * Customer Validators
 * Zod schemas for customer endpoints
 *
 * @module validators/customer
 */

const { z } = require('zod');
const { SLUG_PATTERN } = require('../config/constants');

/**
 * Customer ID parameter validation
 */
const customerIdParam = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format')
  })
});

/**
 * Customer slug parameter validation
 */
const customerSlugParam = z.object({
  params: z.object({
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .max(100, 'Slug must not exceed 100 characters')
      .regex(SLUG_PATTERN, 'Invalid slug format. Use lowercase letters, numbers, and hyphens only')
  })
});

/**
 * Create customer validation schema
 */
const createCustomerSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Customer name is required'
      })
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters')
      .trim(),
    slug: z
      .string({
        required_error: 'Slug is required'
      })
      .min(2, 'Slug must be at least 2 characters')
      .max(100, 'Slug must not exceed 100 characters')
      .toLowerCase()
      .trim()
      .regex(SLUG_PATTERN, 'Invalid slug format. Use lowercase letters, numbers, and hyphens only'),
    domain: z
      .string()
      .url('Invalid domain URL')
      .optional()
      .nullable(),
    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters')
      .optional()
      .nullable(),
    logoUrl: z
      .string()
      .url('Invalid logo URL')
      .optional()
      .nullable(),
    isActive: z
      .boolean()
      .optional()
      .default(true)
  })
});

/**
 * Update customer validation schema
 */
const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format')
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters')
      .trim()
      .optional(),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .max(100, 'Slug must not exceed 100 characters')
      .toLowerCase()
      .trim()
      .regex(SLUG_PATTERN, 'Invalid slug format')
      .optional(),
    domain: z
      .string()
      .url('Invalid domain URL')
      .optional()
      .nullable(),
    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters')
      .optional()
      .nullable(),
    logoUrl: z
      .string()
      .url('Invalid logo URL')
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
 * List customers query validation
 */
const listCustomersSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform(Number)
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(Number)
      .optional(),
    search: z
      .string()
      .max(100, 'Search query too long')
      .optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    sortBy: z
      .enum(['name', 'slug', 'createdAt', 'updatedAt'])
      .optional()
      .default('createdAt'),
    sortOrder: z
      .enum(['asc', 'desc'])
      .optional()
      .default('desc')
  })
});

module.exports = {
  customerIdParam,
  customerSlugParam,
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersSchema
};

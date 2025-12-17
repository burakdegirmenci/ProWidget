/**
 * Feed Validators
 * Zod schemas for XML feed endpoints
 *
 * @module validators/feed
 */

const { z } = require('zod');

/**
 * Feed ID parameter validation
 */
const feedIdParam = z.object({
  params: z.object({
    id: z.string().uuid('Invalid feed ID format')
  })
});

/**
 * Create feed validation schema
 */
const createFeedSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format')
  }),
  body: z.object({
    name: z
      .string({
        required_error: 'Feed name is required'
      })
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters')
      .trim(),
    url: z
      .string({
        required_error: 'Feed URL is required'
      })
      .url('Invalid URL format')
      .refine(
        (url) => url.startsWith('http://') || url.startsWith('https://'),
        'URL must start with http:// or https://'
      ),
    format: z
      .enum(['google', 'facebook', 'custom'], {
        errorMap: () => ({ message: 'Invalid feed format. Use google, facebook, or custom' })
      })
      .optional()
      .default('google'),
    syncInterval: z
      .number()
      .int('Sync interval must be an integer')
      .min(15, 'Minimum sync interval is 15 minutes')
      .max(1440, 'Maximum sync interval is 1440 minutes (24 hours)')
      .optional()
      .default(60),
    isActive: z
      .boolean()
      .optional()
      .default(true)
  })
});

/**
 * Update feed validation schema
 */
const updateFeedSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid feed ID format')
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters')
      .trim()
      .optional(),
    url: z
      .string()
      .url('Invalid URL format')
      .refine(
        (url) => url.startsWith('http://') || url.startsWith('https://'),
        'URL must start with http:// or https://'
      )
      .optional(),
    format: z
      .enum(['google', 'facebook', 'custom'])
      .optional(),
    syncInterval: z
      .number()
      .int('Sync interval must be an integer')
      .min(15, 'Minimum sync interval is 15 minutes')
      .max(1440, 'Maximum sync interval is 1440 minutes')
      .optional(),
    isActive: z
      .boolean()
      .optional()
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  )
});

/**
 * List feeds query validation
 */
const listFeedsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format')
  }),
  query: z.object({
    status: z
      .enum(['active', 'error', 'pending', 'syncing'])
      .optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional()
  })
});

/**
 * Product query validation
 */
const productQuerySchema = z.object({
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
    category: z
      .string()
      .max(255)
      .optional(),
    brand: z
      .string()
      .max(255)
      .optional(),
    stockStatus: z
      .enum(['in_stock', 'out_of_stock', 'preorder'])
      .optional(),
    minPrice: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
      .transform(Number)
      .optional(),
    maxPrice: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
      .transform(Number)
      .optional(),
    sortBy: z
      .enum(['title', 'price', 'salePrice', 'createdAt', 'updatedAt'])
      .optional()
      .default('createdAt'),
    sortOrder: z
      .enum(['asc', 'desc'])
      .optional()
      .default('desc')
  })
});

module.exports = {
  feedIdParam,
  createFeedSchema,
  updateFeedSchema,
  listFeedsSchema,
  productQuerySchema
};

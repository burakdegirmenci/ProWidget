/**
 * Template Validators
 * Zod schemas for custom template endpoints
 *
 * @module validators/template
 */

const { z } = require('zod');

/**
 * Template ID parameter validation
 */
const templateIdParam = z.object({
  params: z.object({
    id: z.string().uuid('Invalid template ID format')
  })
});

/**
 * Customer ID parameter validation (for listing templates)
 */
const customerIdParam = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format')
  })
});

/**
 * Data schema validation (JSON Schema format)
 * Allows flexible JSON Schema definitions
 */
const dataSchemaValidator = z.object({
  type: z.enum(['object', 'array']).optional().default('object'),
  properties: z.record(z.any()).optional(),
  items: z.any().optional(),
  required: z.array(z.string()).optional()
}).passthrough().optional().default({});

/**
 * Create template validation schema
 */
const createTemplateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format')
  }),
  body: z.object({
    name: z
      .string({
        required_error: 'Template name is required'
      })
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters')
      .trim(),

    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters')
      .trim()
      .optional()
      .nullable(),

    htmlTemplate: z
      .string({
        required_error: 'HTML template is required'
      })
      .min(10, 'HTML template must be at least 10 characters')
      .max(102400, 'HTML template must not exceed 100KB'),

    cssStyles: z
      .string()
      .max(51200, 'CSS styles must not exceed 50KB')
      .optional()
      .nullable()
      .default(''),

    dataSchema: dataSchemaValidator,

    defaultData: z
      .record(z.unknown())
      .optional()
      .default({}),

    isGlobal: z
      .boolean()
      .optional()
      .default(false),

    isActive: z
      .boolean()
      .optional()
      .default(true)
  })
});

/**
 * Update template validation schema
 */
const updateTemplateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid template ID format')
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters')
      .trim()
      .optional(),

    description: z
      .string()
      .max(1000, 'Description must not exceed 1000 characters')
      .trim()
      .optional()
      .nullable(),

    htmlTemplate: z
      .string()
      .min(10, 'HTML template must be at least 10 characters')
      .max(102400, 'HTML template must not exceed 100KB')
      .optional(),

    cssStyles: z
      .string()
      .max(51200, 'CSS styles must not exceed 50KB')
      .optional()
      .nullable(),

    dataSchema: dataSchemaValidator,

    defaultData: z
      .record(z.unknown())
      .optional(),

    isGlobal: z
      .boolean()
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
 * List templates query validation
 */
const listTemplatesSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format')
  }),
  query: z.object({
    isActive: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    includeGlobal: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional()
      .default('true')
  })
});

/**
 * Validate template content (for preview)
 */
const validateTemplateSchema = z.object({
  body: z.object({
    htmlTemplate: z
      .string({
        required_error: 'HTML template is required for validation'
      })
      .max(102400, 'HTML template must not exceed 100KB'),

    cssStyles: z
      .string()
      .max(51200, 'CSS styles must not exceed 50KB')
      .optional()
      .default('')
  })
});

/**
 * Duplicate template validation
 */
const duplicateTemplateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid template ID format')
  }),
  body: z.object({
    targetCustomerId: z
      .string()
      .uuid('Invalid target customer ID format')
      .optional()
      .nullable()
  }).optional().default({})
});

module.exports = {
  templateIdParam,
  customerIdParam,
  createTemplateSchema,
  updateTemplateSchema,
  listTemplatesSchema,
  validateTemplateSchema,
  duplicateTemplateSchema
};

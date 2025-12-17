/**
 * Widget Validators
 * Zod schemas for widget configuration endpoints
 *
 * @module validators/widget
 */

const { z } = require('zod');
const { WIDGET_TYPES } = require('../config/constants');

/**
 * Widget ID parameter validation
 */
const widgetIdParam = z.object({
  params: z.object({
    id: z.string().uuid('Invalid widget ID format')
  })
});

/**
 * Carousel settings schema
 */
const carouselSettingsSchema = z.object({
  autoplay: z.boolean().optional().default(true),
  autoplaySpeed: z.number().min(1000).max(10000).optional().default(3000),
  slidesToShow: z.number().min(1).max(10).optional().default(4),
  slidesToScroll: z.number().min(1).max(10).optional().default(1),
  arrows: z.boolean().optional().default(true),
  dots: z.boolean().optional().default(true),
  infinite: z.boolean().optional().default(true),
  pauseOnHover: z.boolean().optional().default(true),
  responsive: z.array(
    z.object({
      breakpoint: z.number(),
      settings: z.object({
        slidesToShow: z.number().min(1).max(10),
        slidesToScroll: z.number().min(1).max(10).optional()
      })
    })
  ).optional()
});

/**
 * Banner settings schema
 */
const bannerSettingsSchema = z.object({
  position: z.enum(['top', 'bottom', 'inline']).optional().default('top'),
  closable: z.boolean().optional().default(true),
  animation: z.enum(['slideDown', 'slideUp', 'fadeIn', 'none']).optional().default('slideDown'),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  showOnce: z.boolean().optional().default(false),
  delay: z.number().min(0).max(30000).optional().default(0)
});

/**
 * Popup settings schema
 */
const popupSettingsSchema = z.object({
  trigger: z.enum(['exit-intent', 'scroll', 'time', 'click']).optional().default('exit-intent'),
  delay: z.number().min(0).max(60000).optional().default(0),
  scrollPercentage: z.number().min(0).max(100).optional(),
  frequency: z.enum(['always', 'once-per-session', 'once-per-day', 'once']).optional().default('once-per-session'),
  overlay: z.boolean().optional().default(true),
  overlayColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional(),
  overlayOpacity: z.number().min(0).max(1).optional().default(0.5),
  closeOnOverlayClick: z.boolean().optional().default(true),
  closeOnEscape: z.boolean().optional().default(true),
  animation: z.enum(['fadeIn', 'slideUp', 'zoomIn', 'none']).optional().default('fadeIn'),
  position: z.enum(['center', 'top', 'bottom']).optional().default('center')
});

/**
 * Get settings schema based on widget type
 */
const getSettingsSchema = (type) => {
  switch (type) {
    case WIDGET_TYPES.CAROUSEL:
      return carouselSettingsSchema;
    case WIDGET_TYPES.BANNER:
      return bannerSettingsSchema;
    case WIDGET_TYPES.POPUP:
      return popupSettingsSchema;
    default:
      return z.object({}).passthrough();
  }
};

/**
 * Create widget validation schema
 */
const createWidgetSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format')
  }),
  body: z.object({
    type: z.enum(['carousel', 'banner', 'popup', 'grid', 'slider', 'custom', 'CAROUSEL', 'BANNER', 'POPUP', 'GRID', 'SLIDER', 'CUSTOM'], {
      required_error: 'Widget type is required',
      invalid_type_error: 'Invalid widget type'
    }).transform(val => val.toLowerCase()),
    name: z
      .string({
        required_error: 'Widget name is required'
      })
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters')
      .trim(),
    settings: z.record(z.unknown()).optional().default({}),
    placement: z
      .string()
      .max(255, 'Placement selector too long')
      .optional()
      .nullable(),
    isActive: z
      .boolean()
      .optional()
      .default(true),
    priority: z
      .number()
      .int()
      .min(0)
      .max(1000)
      .optional()
      .default(0),
    templateId: z
      .string()
      .uuid('Invalid template ID format')
      .optional()
      .nullable(),
    customData: z
      .record(z.unknown())
      .optional()
      .nullable()
  })
}).refine(
  (data) => {
    // Validate settings based on widget type
    const settingsSchema = getSettingsSchema(data.body.type);
    const result = settingsSchema.safeParse(data.body.settings);
    return result.success;
  },
  {
    message: 'Invalid widget settings for the specified type',
    path: ['body', 'settings']
  }
);

/**
 * Update widget validation schema
 */
const updateWidgetSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid widget ID format')
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters')
      .trim()
      .optional(),
    settings: z.record(z.unknown()).optional(),
    placement: z
      .string()
      .max(255, 'Placement selector too long')
      .optional()
      .nullable(),
    isActive: z
      .boolean()
      .optional(),
    priority: z
      .number()
      .int()
      .min(0)
      .max(1000)
      .optional(),
    templateId: z
      .string()
      .uuid('Invalid template ID format')
      .optional()
      .nullable(),
    customData: z
      .record(z.unknown())
      .optional()
      .nullable()
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  )
});

/**
 * List widgets query validation
 */
const listWidgetsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID format')
  }),
  query: z.object({
    type: z
      .enum(['carousel', 'banner', 'popup', 'grid', 'slider', 'custom', 'CAROUSEL', 'BANNER', 'POPUP', 'GRID', 'SLIDER', 'CUSTOM'])
      .transform(val => val.toLowerCase())
      .optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional()
  })
});

module.exports = {
  widgetIdParam,
  createWidgetSchema,
  updateWidgetSchema,
  listWidgetsSchema,
  carouselSettingsSchema,
  bannerSettingsSchema,
  popupSettingsSchema
};

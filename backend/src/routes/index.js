/**
 * Routes Index
 * Central route configuration and mounting
 *
 * @module routes
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const customerRoutes = require('./customer.routes');
const widgetRoutes = require('./widget.routes');
const themeRoutes = require('./theme.routes');
const feedRoutes = require('./feed.routes');
const productRoutes = require('./product.routes');
const publicRoutes = require('./public.routes');
const templateRoutes = require('./template.routes');

/**
 * Admin API Routes
 * Base path: /api/admin
 */
const adminRouter = express.Router();

// Auth routes - /api/admin/auth/*
adminRouter.use('/auth', authRoutes);

// Customer routes - /api/admin/customers/*
adminRouter.use('/customers', customerRoutes);

// Widget routes - /api/admin/customers/:id/widgets/* and /api/admin/widgets/*
adminRouter.use('/', widgetRoutes);

// Theme routes - /api/admin/customers/:id/themes/* and /api/admin/themes/*
adminRouter.use('/', themeRoutes);

// Feed routes - /api/admin/customers/:id/feeds/* and /api/admin/feeds/*
adminRouter.use('/', feedRoutes);

// Product routes - /api/admin/customers/:id/products/* and /api/admin/products/*
adminRouter.use('/', productRoutes);

// Template routes - /api/admin/customers/:id/templates/* and /api/admin/templates/*
adminRouter.use('/', templateRoutes);

/**
 * Mount routes
 */

// Admin routes
router.use('/admin', adminRouter);

// Public routes (widget API)
router.use('/', publicRoutes);

module.exports = router;

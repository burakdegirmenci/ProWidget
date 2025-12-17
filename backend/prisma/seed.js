/**
 * Database Seed Script
 * Creates initial data for development and testing
 *
 * Usage: npm run db:seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

/**
 * Generate a random API key
 * @param {number} length - Key length
 * @returns {string} Generated API key
 */
const generateApiKey = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Main seed function
 */
async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@prowidget.com' },
    update: {},
    create: {
      email: 'admin@prowidget.com',
      passwordHash: adminPassword,
      role: 'admin',
      firstName: 'System',
      lastName: 'Admin',
      isActive: true
    }
  });
  console.log('Created admin user:', adminUser.email);

  // Create demo customer
  const demoCustomer = await prisma.customer.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo-store',
      domain: 'demo.prowidget.com',
      apiKey: generateApiKey(),
      isActive: true,
      description: 'Demo e-commerce store for testing'
    }
  });
  console.log('Created demo customer:', demoCustomer.name);

  // Create default theme for demo customer
  const defaultTheme = await prisma.theme.upsert({
    where: {
      id: demoCustomer.id + '-default-theme'
    },
    update: {},
    create: {
      id: demoCustomer.id + '-default-theme',
      customerId: demoCustomer.id,
      name: 'Default Theme',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '8px',
      isActive: true,
      cssVariables: {
        '--widget-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        '--widget-transition': 'all 0.3s ease'
      }
    }
  });
  console.log('Created default theme:', defaultTheme.name);

  // Create sample widget configs
  const carouselWidget = await prisma.widgetConfig.create({
    data: {
      customerId: demoCustomer.id,
      type: 'carousel',
      name: 'Homepage Product Carousel',
      isActive: true,
      priority: 1,
      placement: '[data-widget="carousel"]',
      settings: {
        autoplay: true,
        autoplaySpeed: 3000,
        slidesToShow: 4,
        slidesToScroll: 1,
        arrows: true,
        dots: true,
        infinite: true,
        responsive: [
          { breakpoint: 1024, settings: { slidesToShow: 3 } },
          { breakpoint: 768, settings: { slidesToShow: 2 } },
          { breakpoint: 480, settings: { slidesToShow: 1 } }
        ]
      }
    }
  });
  console.log('Created carousel widget:', carouselWidget.name);

  const bannerWidget = await prisma.widgetConfig.create({
    data: {
      customerId: demoCustomer.id,
      type: 'banner',
      name: 'Promotional Banner',
      isActive: true,
      priority: 2,
      placement: '[data-widget="banner"]',
      settings: {
        position: 'top',
        closable: true,
        animation: 'slideDown',
        backgroundColor: '#3B82F6',
        textColor: '#FFFFFF'
      }
    }
  });
  console.log('Created banner widget:', bannerWidget.name);

  const popupWidget = await prisma.widgetConfig.create({
    data: {
      customerId: demoCustomer.id,
      type: 'popup',
      name: 'Exit Intent Popup',
      isActive: false,
      priority: 3,
      placement: 'body',
      settings: {
        trigger: 'exit-intent',
        delay: 0,
        frequency: 'once-per-session',
        overlay: true,
        closeOnOverlayClick: true,
        animation: 'fadeIn'
      }
    }
  });
  console.log('Created popup widget:', popupWidget.name);

  // Create sample XML feed
  const xmlFeed = await prisma.xmlFeed.create({
    data: {
      customerId: demoCustomer.id,
      name: 'Google Merchant Feed',
      url: 'https://example.com/feed.xml',
      format: 'google',
      syncInterval: 60,
      status: 'pending',
      isActive: true
    }
  });
  console.log('Created XML feed:', xmlFeed.name);

  // Create sample products
  const sampleProducts = [
    {
      customerId: demoCustomer.id,
      feedId: xmlFeed.id,
      externalId: 'PROD-001',
      title: 'Premium Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 299.99,
      salePrice: 249.99,
      currency: 'TRY',
      imageUrl: 'https://example.com/images/headphones.jpg',
      productUrl: 'https://example.com/products/headphones',
      category: 'Electronics > Audio',
      brand: 'TechBrand',
      stockStatus: 'in_stock',
      attributes: { color: 'Black', warranty: '2 years' }
    },
    {
      customerId: demoCustomer.id,
      feedId: xmlFeed.id,
      externalId: 'PROD-002',
      title: 'Smart Watch Pro',
      description: 'Feature-rich smartwatch with health monitoring',
      price: 499.99,
      salePrice: null,
      currency: 'TRY',
      imageUrl: 'https://example.com/images/smartwatch.jpg',
      productUrl: 'https://example.com/products/smartwatch',
      category: 'Electronics > Wearables',
      brand: 'TechBrand',
      stockStatus: 'in_stock',
      attributes: { color: 'Silver', waterResistant: true }
    },
    {
      customerId: demoCustomer.id,
      feedId: xmlFeed.id,
      externalId: 'PROD-003',
      title: 'Ergonomic Office Chair',
      description: 'Comfortable ergonomic chair for long work hours',
      price: 799.99,
      salePrice: 699.99,
      currency: 'TRY',
      imageUrl: 'https://example.com/images/chair.jpg',
      productUrl: 'https://example.com/products/chair',
      category: 'Furniture > Office',
      brand: 'ComfortPlus',
      stockStatus: 'in_stock',
      attributes: { material: 'Mesh', adjustableHeight: true }
    }
  ];

  for (const product of sampleProducts) {
    await prisma.product.create({ data: product });
  }
  console.log('Created sample products:', sampleProducts.length);

  // Create feed cache
  await prisma.feedCache.create({
    data: {
      customerId: demoCustomer.id,
      payload: sampleProducts.map(p => ({
        id: p.externalId,
        title: p.title,
        price: p.price,
        salePrice: p.salePrice,
        image: p.imageUrl,
        url: p.productUrl
      }))
    }
  });
  console.log('Created feed cache');

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

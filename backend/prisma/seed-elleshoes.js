/**
 * Elle Shoes Customer Seed Script
 * Creates Elle Shoes customer with appropriate widgets
 *
 * Usage: node prisma/seed-elleshoes.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate a random API key
 */
const generateApiKey = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'elle_';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

async function main() {
  console.log('Creating Elle Shoes customer and widgets...\n');

  // Create Elle Shoes customer
  const elleShoes = await prisma.customer.upsert({
    where: { slug: 'elle-shoes' },
    update: {
      domain: 'elleshoes.ticimaxtest.com',
      isActive: true
    },
    create: {
      name: 'Elle Shoes',
      slug: 'elle-shoes',
      domain: 'elleshoes.ticimaxtest.com',
      apiKey: generateApiKey(),
      isActive: true,
      description: 'Elle Shoes - Ayakkabı ve Terlik E-Ticaret Mağazası'
    }
  });
  console.log('✓ Created customer:', elleShoes.name);
  console.log('  Slug:', elleShoes.slug);
  console.log('  API Key:', elleShoes.apiKey);
  console.log('');

  // Create Elle Shoes theme (pink/fuchsia color scheme based on typical shoe stores)
  const elleTheme = await prisma.theme.upsert({
    where: {
      id: elleShoes.id + '-theme'
    },
    update: {
      primaryColor: '#D4145A',
      secondaryColor: '#FF6B9D',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      isActive: true
    },
    create: {
      id: elleShoes.id + '-theme',
      customerId: elleShoes.id,
      name: 'Elle Shoes Theme',
      primaryColor: '#D4145A',       // Fuşya/Pembe (kadın ayakkabı markası için)
      secondaryColor: '#FF6B9D',     // Açık pembe
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      fontFamily: "'Poppins', sans-serif",
      borderRadius: '12px',
      isActive: true,
      cssVariables: {
        '--widget-shadow': '0 8px 24px rgba(212, 20, 90, 0.15)',
        '--widget-transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '--widget-hover-scale': '1.02'
      },
      customCss: `
        .pwx-widget { font-family: 'Poppins', sans-serif; }
        .pwx-product-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .pwx-product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.12); }
        .pwx-price { color: #D4145A; font-weight: 600; }
        .pwx-sale-price { color: #D4145A; }
        .pwx-original-price { text-decoration: line-through; color: #999; }
      `
    }
  });
  console.log('✓ Created theme:', elleTheme.name);
  console.log('');

  // Delete existing widgets for fresh setup
  await prisma.widgetConfig.deleteMany({
    where: { customerId: elleShoes.id }
  });
  console.log('✓ Cleared existing widgets\n');

  // Widget 1: Ana Sayfa Ürün Carousel
  const homepageCarousel = await prisma.widgetConfig.create({
    data: {
      customerId: elleShoes.id,
      type: 'carousel',
      name: 'Ana Sayfa - Öne Çıkan Ürünler',
      isActive: true,
      priority: 1,
      placement: '#divIcerik .container:first-child',
      settings: {
        autoplay: true,
        autoplaySpeed: 4000,
        slidesToShow: 4,
        slidesToScroll: 1,
        arrows: true,
        dots: true,
        infinite: true,
        pauseOnHover: true,
        responsive: [
          { breakpoint: 1200, settings: { slidesToShow: 3, slidesToScroll: 1 } },
          { breakpoint: 992, settings: { slidesToShow: 2, slidesToScroll: 1 } },
          { breakpoint: 576, settings: { slidesToShow: 1, slidesToScroll: 1 } }
        ]
      },
      customData: {
        title: 'Öne Çıkan Ürünler',
        showTitle: true,
        productSource: 'featured',
        maxProducts: 12
      }
    }
  });
  console.log('✓ Created widget:', homepageCarousel.name);

  // Widget 2: Son Görüntülenen Ürünler Carousel
  const recentlyViewedCarousel = await prisma.widgetConfig.create({
    data: {
      customerId: elleShoes.id,
      type: 'carousel',
      name: 'Son Görüntülenen Ürünler',
      isActive: true,
      priority: 2,
      placement: '#divIcerik .container:last-child',
      settings: {
        autoplay: false,
        slidesToShow: 4,
        slidesToScroll: 1,
        arrows: true,
        dots: false,
        infinite: false,
        pauseOnHover: true,
        responsive: [
          { breakpoint: 1200, settings: { slidesToShow: 3, slidesToScroll: 1 } },
          { breakpoint: 992, settings: { slidesToShow: 2, slidesToScroll: 1 } },
          { breakpoint: 576, settings: { slidesToShow: 1, slidesToScroll: 1 } }
        ]
      },
      customData: {
        title: 'Son Görüntülediğiniz Ürünler',
        showTitle: true,
        productSource: 'recently_viewed',
        maxProducts: 8,
        showWhenEmpty: false
      }
    }
  });
  console.log('✓ Created widget:', recentlyViewedCarousel.name);

  // Widget 3: Üst Banner - Kampanya Duyurusu
  const topBanner = await prisma.widgetConfig.create({
    data: {
      customerId: elleShoes.id,
      type: 'banner',
      name: 'Üst Kampanya Banner',
      isActive: true,
      priority: 3,
      placement: '#headerNew',
      settings: {
        position: 'top',
        closable: true,
        animation: 'slideDown',
        backgroundColor: '#D4145A',
        textColor: '#FFFFFF',
        showOnce: false,
        delay: 0
      },
      customData: {
        text: '🎉 Kış İndirimi! Seçili ürünlerde %50\'ye varan indirim',
        linkText: 'Hemen Alışverişe Başla',
        linkUrl: '/kampanyalar',
        icon: '🎁'
      }
    }
  });
  console.log('✓ Created widget:', topBanner.name);

  // Widget 4: Exit Intent Popup - Newsletter
  const exitPopup = await prisma.widgetConfig.create({
    data: {
      customerId: elleShoes.id,
      type: 'popup',
      name: 'Exit Intent - İndirim Kuponu',
      isActive: true,
      priority: 4,
      placement: 'body',
      settings: {
        trigger: 'exit-intent',
        delay: 0,
        frequency: 'once-per-session',
        overlay: true,
        overlayColor: '#000000',
        overlayOpacity: 0.6,
        closeOnOverlayClick: true,
        closeOnEscape: true,
        animation: 'zoomIn',
        position: 'center'
      },
      customData: {
        title: 'Ayrılmayın!',
        subtitle: 'İlk siparişinize özel %15 indirim kuponu kazanın',
        buttonText: 'Kuponu Al',
        image: '/images/popup-shoes.jpg',
        couponCode: 'HOSGELDIN15',
        collectEmail: true,
        emailPlaceholder: 'E-posta adresiniz'
      }
    }
  });
  console.log('✓ Created widget:', exitPopup.name);

  // Widget 5: Ürün Detay - Benzer Ürünler Grid
  const similarProductsGrid = await prisma.widgetConfig.create({
    data: {
      customerId: elleShoes.id,
      type: 'grid',
      name: 'Benzer Ürünler - Ürün Detay',
      isActive: true,
      priority: 5,
      placement: '.product-detail-container',
      settings: {},
      customData: {
        title: 'Benzer Ürünler',
        showTitle: true,
        productSource: 'similar',
        columns: 4,
        maxProducts: 8,
        showOnPages: ['product-detail']
      }
    }
  });
  console.log('✓ Created widget:', similarProductsGrid.name);

  // Widget 6: Sepet Sayfası - Bununla Birlikte Alınan Ürünler
  const cartRecommendations = await prisma.widgetConfig.create({
    data: {
      customerId: elleShoes.id,
      type: 'carousel',
      name: 'Sepet - Birlikte Alınan Ürünler',
      isActive: true,
      priority: 6,
      placement: '.cart-page-container',
      settings: {
        autoplay: false,
        slidesToShow: 3,
        slidesToScroll: 1,
        arrows: true,
        dots: false,
        infinite: false,
        responsive: [
          { breakpoint: 992, settings: { slidesToShow: 2, slidesToScroll: 1 } },
          { breakpoint: 576, settings: { slidesToShow: 1, slidesToScroll: 1 } }
        ]
      },
      customData: {
        title: 'Bu Ürünlerle Birlikte Alınan',
        showTitle: true,
        productSource: 'frequently_bought_together',
        maxProducts: 6,
        showOnPages: ['cart']
      }
    }
  });
  console.log('✓ Created widget:', cartRecommendations.name);

  console.log('\n========================================');
  console.log('Elle Shoes setup completed!');
  console.log('========================================');
  console.log('\nCustomer Details:');
  console.log('  ID:', elleShoes.id);
  console.log('  Name:', elleShoes.name);
  console.log('  Slug:', elleShoes.slug);
  console.log('  Domain:', elleShoes.domain);
  console.log('  API Key:', elleShoes.apiKey);
  console.log('\nWidgets Created: 6');
  console.log('Theme: Elle Shoes Theme (Fuşya/Pembe)');
  console.log('\nEmbed Code:');
  console.log('----------------------------------------');
  console.log(`<script
  src="https://widget.burakdegirmenci.me/cdn/pwx.min.js"
  data-pwx-customer="${elleShoes.slug}"
  data-pwx-api-url="https://widget.burakdegirmenci.me"
></script>`);
  console.log('----------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

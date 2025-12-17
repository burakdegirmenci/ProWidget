# ProWidget Developer Guide

Bu rehber ProWidget'i lokal ortamda calistirmayi, gelistirmeyi ve yeni ozellikler eklemeyi kapsar.

## Icindekiler

- [Gereksinimler](#gereksinimler)
- [Lokal Kurulum](#lokal-kurulum)
- [Proje Yapisi](#proje-yapisi)
- [XML Feed Entegrasyonu](#xml-feed-entegrasyonu)
- [Yeni Widget Ekleme](#yeni-widget-ekleme)
- [Test Yazma](#test-yazma)
- [Deployment](#deployment)

---

## Gereksinimler

### Zorunlu

- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **Node.js**: 20.x LTS
- **npm**: 10.x

### Onerilen

- **Git**: 2.40+
- **VS Code** veya tercih ettiginiz IDE
- **Postman** veya **Insomnia** (API test icin)

### IDE Eklentileri (VS Code)

- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- Docker

---

## Lokal Kurulum

### 1. Repository'yi Klonlama

```bash
git clone https://github.com/prowidget/prowidget.git
cd prowidget
```

### 2. Environment Dosyasi

```bash
cp .env.example .env
```

`.env` dosyasini duzenleyin:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/prowidget
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=prowidget

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# API
API_PORT=3000
NODE_ENV=development

# Admin Panel
NEXT_PUBLIC_API_URL=http://localhost:3000

# CDN
CDN_URL=http://localhost:8080
```

### 3. Docker ile Baslat (Onerilen)

```bash
# Development modu - hot reload ile
docker-compose -f docker-compose.dev.yml up -d

# Servislerin durumunu kontrol et
docker-compose ps

# Loglari izle
docker-compose logs -f backend
```

### 4. Database Setup

```bash
# Migration calistir
docker-compose exec backend npx prisma migrate deploy

# Seed data yukle
docker-compose exec backend npx prisma db seed

# Prisma Studio (veritabani goruntuleyici)
docker-compose exec backend npx prisma studio
```

### 5. Servislere Erisim

| Servis | URL | Aciklama |
|--------|-----|----------|
| Backend API | http://localhost:3000 | REST API |
| Admin Panel | http://localhost:3001 | Next.js Admin UI |
| pgAdmin | http://localhost:5050 | Database yonetimi |
| Redis Commander | http://localhost:8081 | Redis yonetimi |

### Lokal Gelistirme (Docker'siz)

Eger Docker kullanmak istemiyorsaniz:

```bash
# PostgreSQL ve Redis'i manuel kurun

# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev

# Admin Panel (yeni terminal)
cd admin-panel
npm install
npm run dev

# CDN (yeni terminal)
cd cdn
npm install
npm run build:watch
```

---

## Proje Yapisi

```
ProWidget/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── config/          # Konfigurasyonlar
│   │   │   ├── index.js     # Ana config
│   │   │   └── constants.js # Sabit degerler
│   │   ├── middleware/      # Express middleware'leri
│   │   │   ├── auth.js      # JWT authentication
│   │   │   ├── rateLimiter.js
│   │   │   └── validator.js # Request validation
│   │   ├── routes/          # API route'lari
│   │   │   ├── admin/       # Admin endpoint'leri
│   │   │   └── public/      # Public endpoint'leri
│   │   ├── services/        # Business logic
│   │   │   ├── customer.service.js
│   │   │   ├── widget.service.js
│   │   │   └── feed.service.js
│   │   └── utils/           # Yardimci fonksiyonlar
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Migration dosyalari
│   │   └── seed.js          # Seed data
│   └── tests/               # Test dosyalari
│
├── admin-panel/             # Next.js Admin UI
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── (auth)/      # Auth sayfasi (login)
│   │   │   └── (dashboard)/ # Dashboard sayfalari
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Temel UI bilesenler
│   │   │   └── layout/      # Layout bilesenler
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API servisleri
│   │   └── lib/             # Utility fonksiyonlar
│   └── __tests__/           # Test dosyalari
│
├── cdn/                     # Widget Framework
│   ├── src/
│   │   ├── core/            # Cekirdek moduller
│   │   │   ├── init.js      # Entry point
│   │   │   ├── loader.js    # Widget loader
│   │   │   ├── config.js    # Runtime config
│   │   │   ├── api.js       # API client
│   │   │   └── utils.js     # DOM utilities
│   │   └── widgets/         # Widget implementasyonlari
│   │       ├── BaseWidget.js
│   │       ├── carousel.js
│   │       ├── banner.js
│   │       ├── popup.js
│   │       ├── grid.js
│   │       └── slider.js
│   ├── dist/                # Build output
│   └── tests/               # Test dosyalari
│
├── xml-parser/              # XML Parser Service
│   ├── src/
│   │   ├── parsers/         # Format-specific parsers
│   │   ├── scheduler.js     # Cron scheduler
│   │   └── worker.js        # Feed processing
│
├── docs/                    # Dokumantasyon
│
├── docker-compose.yml       # Production compose
├── docker-compose.dev.yml   # Development compose
└── Makefile                 # Yardimci komutlar
```

---

## XML Feed Entegrasyonu

### Desteklenen Formatlar

1. **Google Merchant Center XML**
2. **Facebook Product Catalog**
3. **Ozel XML Format**

### Google Merchant Center Ornegi

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:g="http://base.google.com/ns/1.0">
  <title>Elle Shoes Product Feed</title>
  <entry>
    <g:id>SKU-001</g:id>
    <g:title>Siyah Deri Bot</g:title>
    <g:description>Hakiki deri, su gecirmez kisa bot</g:description>
    <g:link>https://elleshoes.com/urun/siyah-deri-bot</g:link>
    <g:image_link>https://elleshoes.com/images/bot-001.jpg</g:image_link>
    <g:price>1299.99 TRY</g:price>
    <g:sale_price>999.99 TRY</g:sale_price>
    <g:availability>in_stock</g:availability>
    <g:brand>Elle</g:brand>
    <g:product_type>Ayakkabi > Bot</g:product_type>
    <g:custom_label_0>kis-indirimi</g:custom_label_0>
  </entry>
</feed>
```

### Feed Ekleme Adimlari

1. **Admin Panel > Customers > Musteri Sec > Feed**
2. Feed URL'ini girin
3. Format secin (Google Merchant / Facebook / Custom)
4. Sync interval belirleyin (dakika)
5. "Sync Now" ile test edin

### Feed Mapping (Ozel Format)

Ozel XML formatlari icin mapping tanimlayin:

```json
{
  "rootElement": "products/product",
  "mapping": {
    "id": "sku",
    "title": "name",
    "description": "desc",
    "price": "price",
    "salePrice": "discountedPrice",
    "imageLink": "images/main",
    "link": "url",
    "category": "category/name",
    "brand": "manufacturer",
    "availability": "stock",
    "campaign": "labels/label[0]"
  }
}
```

---

## Yeni Widget Ekleme

### Adim 1: Widget Class Olusturma

`cdn/src/widgets/` klasorunde yeni dosya olusturun:

```javascript
// cdn/src/widgets/countdown.js

import BaseWidget from './BaseWidget.js';
import { createElement, formatPrice } from '../core/utils.js';

/**
 * Countdown Widget
 * Kampanya geri sayim widget'i
 */
class CountdownWidget extends BaseWidget {
  constructor(container, config) {
    super(container, config);
    this.intervalId = null;
  }

  /**
   * Default konfigurasyonlar
   */
  static get defaultConfig() {
    return {
      ...BaseWidget.defaultConfig,
      endDate: null,
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      expiredMessage: 'Kampanya sona erdi!',
      template: 'default'
    };
  }

  /**
   * Widget renderla
   */
  async render() {
    if (!this.config.endDate) {
      this.showError('End date is required');
      return;
    }

    this.container.innerHTML = '';
    this.container.classList.add('pwx-countdown');

    const wrapper = createElement('div', {
      className: 'pwx-countdown-wrapper'
    });

    // Time boxes
    if (this.config.showDays) {
      wrapper.appendChild(this.createTimeBox('days', 'Gun'));
    }
    if (this.config.showHours) {
      wrapper.appendChild(this.createTimeBox('hours', 'Saat'));
    }
    if (this.config.showMinutes) {
      wrapper.appendChild(this.createTimeBox('minutes', 'Dakika'));
    }
    if (this.config.showSeconds) {
      wrapper.appendChild(this.createTimeBox('seconds', 'Saniye'));
    }

    this.container.appendChild(wrapper);

    // Countdown basla
    this.startCountdown();

    this.emit('rendered');
  }

  /**
   * Time box elementi olustur
   */
  createTimeBox(id, label) {
    return createElement('div', {
      className: 'pwx-countdown-box',
      dataset: { unit: id }
    }, [
      createElement('span', {
        className: 'pwx-countdown-value',
        id: `pwx-${id}`
      }, '00'),
      createElement('span', {
        className: 'pwx-countdown-label'
      }, label)
    ]);
  }

  /**
   * Countdown basla
   */
  startCountdown() {
    this.updateCountdown();
    this.intervalId = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  /**
   * Countdown guncelle
   */
  updateCountdown() {
    const endDate = new Date(this.config.endDate).getTime();
    const now = Date.now();
    const diff = endDate - now;

    if (diff <= 0) {
      this.handleExpired();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.updateValue('days', days);
    this.updateValue('hours', hours);
    this.updateValue('minutes', minutes);
    this.updateValue('seconds', seconds);
  }

  /**
   * Deger guncelle
   */
  updateValue(id, value) {
    const el = this.container.querySelector(`#pwx-${id}`);
    if (el) {
      el.textContent = String(value).padStart(2, '0');
    }
  }

  /**
   * Suresi doldu
   */
  handleExpired() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.container.innerHTML = `
      <div class="pwx-countdown-expired">
        ${this.config.expiredMessage}
      </div>
    `;
    this.emit('expired');
  }

  /**
   * Widget temizle
   */
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    super.destroy();
  }
}

export default CountdownWidget;
```

### Adim 2: Widget'i Register Etme

`cdn/src/widgets/index.js` dosyasini guncelleyin:

```javascript
import CarouselWidget from './carousel.js';
import BannerWidget from './banner.js';
import PopupWidget from './popup.js';
import GridWidget from './grid.js';
import SliderWidget from './slider.js';
import CountdownWidget from './countdown.js'; // Yeni eklenen

export const widgetRegistry = {
  carousel: CarouselWidget,
  banner: BannerWidget,
  popup: PopupWidget,
  grid: GridWidget,
  slider: SliderWidget,
  countdown: CountdownWidget  // Yeni eklenen
};

export {
  CarouselWidget,
  BannerWidget,
  PopupWidget,
  GridWidget,
  SliderWidget,
  CountdownWidget  // Export et
};
```

### Adim 3: Widget Stilleri

`cdn/src/styles/widgets/_countdown.css`:

```css
.pwx-countdown {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.pwx-countdown-wrapper {
  display: flex;
  gap: 16px;
}

.pwx-countdown-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 24px;
  background: var(--pwx-primary-color, #e91e63);
  border-radius: var(--pwx-border-radius, 8px);
  color: white;
}

.pwx-countdown-value {
  font-size: 2.5rem;
  font-weight: bold;
  line-height: 1;
}

.pwx-countdown-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  margin-top: 4px;
  opacity: 0.8;
}

.pwx-countdown-expired {
  padding: 20px;
  text-align: center;
  color: var(--pwx-text-color, #333);
}
```

### Adim 4: Backend Widget Type Ekleme

`backend/prisma/schema.prisma`:

```prisma
enum WidgetType {
  CAROUSEL
  BANNER
  POPUP
  GRID
  SLIDER
  FLOATING
  COUNTDOWN  // Yeni eklenen
}
```

Migration calistir:
```bash
npx prisma migrate dev --name add_countdown_widget
```

### Adim 5: Widget Kullanimi

```html
<div
  data-pwx-widget="countdown"
  data-pwx-end-date="2024-12-31T23:59:59"
  data-pwx-show-seconds="true"
  data-pwx-expired-message="Kampanya bitti!"
></div>
```

---

## Test Yazma

### Backend Testleri

```bash
cd backend
npm test                    # Tum testleri calistir
npm test -- --watch         # Watch modu
npm test -- --coverage      # Coverage raporu
```

Test ornegi:
```javascript
// backend/tests/__tests__/services/widget.service.test.js

describe('Widget Service', () => {
  it('should create countdown widget', async () => {
    const widget = await widgetService.create({
      customerId: 'cust-123',
      type: 'COUNTDOWN',
      name: 'Yilbasi Geri Sayim',
      config: {
        endDate: '2024-12-31T23:59:59'
      }
    });

    expect(widget.type).toBe('COUNTDOWN');
    expect(widget.config.endDate).toBeDefined();
  });
});
```

### CDN Testleri

```bash
cd cdn
npm test
```

### Admin Panel Testleri

```bash
cd admin-panel
npm test
```

---

## Deployment

### Production Build

```bash
# Tum servisleri build et
make build

# Veya manuel
docker-compose build
```

### Environment Variables (Production)

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db-host:5432/prowidget
REDIS_URL=redis://:password@redis-host:6379
JWT_SECRET=<strong-random-secret>
```

### Health Check

```bash
curl http://your-domain/api/health
```

### Monitoring

- **Logs**: `docker-compose logs -f`
- **Metrics**: Prometheus endpoint `/metrics`
- **Alerts**: Grafana dashboards

---

## Troubleshooting

### Database baglanti hatasi

```bash
# PostgreSQL durumunu kontrol et
docker-compose ps db

# Baglanti test et
docker-compose exec backend npx prisma db push
```

### Redis baglanti hatasi

```bash
# Redis durumunu kontrol et
docker-compose exec redis redis-cli ping
```

### Port cakismasi

```bash
# Kullanilan portlari kontrol et
netstat -tulpn | grep -E '3000|3001|5432'

# Port degistir (.env)
API_PORT=3002
```

### Prisma client hatasi

```bash
# Client'i yeniden generate et
cd backend
npx prisma generate
```

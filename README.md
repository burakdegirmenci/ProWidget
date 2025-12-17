# ProWidget

> Tek satir script ile calisan, XML/JSON ile beslenen, e-ticaret widget SaaS platformu.

ProWidget, e-ticaret sitelerinin urun tanitim widget'larini kolayca entegre etmelerini saglayan bir SaaS platformudur. Musteriler sadece tek satir JavaScript kodu ekleyerek carousel, banner, popup ve grid widget'larini sitelerine ekleyebilir.

## Ozellikler

- **Tek Satir Entegrasyon**: Sadece bir `<script>` etiketi ile tum widget'lari kullanin
- **XML/JSON Feed Destegi**: Google Merchant Center, Facebook Catalog ve ozel XML formatlarini destekler
- **6 Farkli Widget Tipi**: Carousel, Banner, Popup, Grid, Slider, Floating Button
- **Tema Ozellestirme**: Her musteri icin ozel renk ve stil ayarlari
- **Admin Panel**: Musteri, widget ve tema yonetimi icin kapsamli yonetim paneli
- **Otomatik Feed Senkronizasyonu**: XML feed'leri periyodik olarak guncellenir
- **Performans Odakli**: Lazy loading, minified assets, CDN dagilimi
- **Guvenlik**: JWT authentication, rate limiting, CORS korumalari

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Cache**: Redis
- **Authentication**: JWT (Access + Refresh Token)

### Frontend (Admin Panel)
- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS
- **Form**: React Hook Form + Zod
- **HTTP Client**: Axios

### CDN / Widget Framework
- **Build**: Rollup
- **Language**: Vanilla JavaScript (ES6+)
- **Styling**: PostCSS + cssnano

### DevOps
- **Container**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Process Manager**: PM2

## Proje Yapisi

```
ProWidget/
├── backend/           # Express.js API
│   ├── src/
│   │   ├── config/    # Konfigurasyonlar
│   │   ├── middleware/# Auth, rate-limit, validation
│   │   ├── routes/    # API route'lari
│   │   ├── services/  # Business logic
│   │   └── utils/     # Yardimci fonksiyonlar
│   └── prisma/        # Database schema
│
├── admin-panel/       # Next.js Admin UI
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/# UI components
│   │   ├── contexts/  # React contexts
│   │   └── services/  # API services
│
├── cdn/               # Widget Framework
│   ├── src/
│   │   ├── core/      # Loader, config, utils
│   │   └── widgets/   # Carousel, Banner, Popup...
│
├── xml-parser/        # XML Feed Parser Service
│
├── docs/              # Dokumantasyon
│
└── docker-compose.yml # Container orchestration
```

## Quick Start

### Gereksinimler

- Docker & Docker Compose
- Node.js 20+ (lokal gelistirme icin)
- Git

### Kurulum

1. **Repository'yi klonlayin**
```bash
git clone https://github.com/prowidget/prowidget.git
cd prowidget
```

2. **Environment dosyasini olusturun**
```bash
cp .env.example .env
# .env dosyasini duzenleyin
```

3. **Docker ile baslatin**
```bash
# Development
docker-compose -f docker-compose.dev.yml up -d

# Production
docker-compose up -d
```

4. **Database migration**
```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

5. **Servislere erisin**
- Admin Panel: http://localhost:3001
- Backend API: http://localhost:3000
- pgAdmin: http://localhost:5050 (development)

### Varsayilan Giris Bilgileri

```
Email: admin@prowidget.com
Sifre: admin123
```

## Widget Kullanimi

### 1. Script Ekleme

Musteri sitesine asagidaki scripti ekleyin:

```html
<script defer src="https://cdn.prowidget.com/{slug}/init.js"></script>
```

### 2. Widget Container Ekleme

```html
<!-- Carousel Widget -->
<div
  data-pwx-widget="carousel"
  data-pwx-category="ayakkabi"
  data-pwx-limit="8"
></div>

<!-- Banner Widget -->
<div
  data-pwx-widget="banner"
  data-pwx-campaign="kis-indirimi"
></div>

<!-- Popup Widget -->
<div
  data-pwx-widget="popup"
  data-pwx-trigger="exit"
  data-pwx-delay="5000"
></div>

<!-- Grid Widget -->
<div
  data-pwx-widget="grid"
  data-pwx-columns="4"
  data-pwx-limit="12"
></div>
```

## API Dokumantasyonu

Detayli API dokumantasyonu icin: [docs/api-reference.md](docs/api-reference.md)

## Gelistirici Rehberi

Projeyi lokal ortamda calistirmak ve gelistirmek icin: [docs/developer-guide.md](docs/developer-guide.md)

## Ornek Kullanim

Elle Shoes entegrasyon ornegi icin: [docs/examples/elleshoes-usage.md](docs/examples/elleshoes-usage.md)

## Lisans

Bu proje ozel lisans altindadir. Izinsiz kullanim ve dagitim yasaktir.

## Iletisim

- Web: https://prowidget.com
- Email: support@prowidget.com

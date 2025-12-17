# ProWidget - Mimari Tasarım Dokümantasyonu

> **Versiyon:** 1.0.0
> **Tarih:** 2025-12-15
> **Durum:** Production-Ready Design

---

## 1. Proje Özeti

**ProWidget**, e-ticaret sitelerine tek satırlık JavaScript snippet ile entegre edilebilen, XML feed ile beslenen modüler widget platformudur.

### Temel Özellikler

- Tek satır script entegrasyonu
- XML feed otomatik senkronizasyonu
- Modüler widget sistemi (carousel, banner, popup)
- Müşteri bazlı tema özelleştirme
- Real-time data güncelleme

### Entegrasyon Örneği

```html
<script defer src="https://cdn.prowidget.com/{customer}/init.js"></script>
```

---

## 2. High-Level Mimari

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ProWidget Architecture                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Customer   │     │    Admin     │     │  XML Feed    │     │    CDN       │
│   Website    │     │    Panel     │     │  Sources     │     │  (Static)    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │ Load init.js       │ CRUD Operations    │ Fetch XML          │ Serve JS/CSS
       ▼                    ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API Gateway / Load Balancer                        │
└─────────────────────────────────────────────────────────────────────────────────┘
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Backend    │     │    Auth      │     │  XML Parser  │     │    Cache     │
│   API        │◄───►│   Service    │     │   Service    │     │   (Redis)    │
│  (Node.js)   │     │   (JWT)      │     │  (Scheduler) │     │              │
└──────┬───────┘     └──────────────┘     └──────┬───────┘     └──────────────┘
       │                                         │
       ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PostgreSQL Database                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │customers│ │ widgets │ │ configs │ │ themes  │ │xml_feeds│ │products │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Veri Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

1. XML FEED SYNC FLOW:
   ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
   │ XML Source │───►│ XML Parser │───►│ Normalizer │───►│  Database  │
   │   (URL)    │    │  Service   │    │  Service   │    │ (products) │
   └────────────┘    └────────────┘    └────────────┘    └────────────┘
         │                                                      │
         │              Scheduled Job (cron)                    │
         └──────────────────────────────────────────────────────┘

2. WIDGET RENDER FLOW:
   ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
   │  Customer  │───►│  init.js   │───►│ Backend    │───►│   Cache    │
   │  Website   │    │  (CDN)     │    │   API      │    │  (Redis)   │
   └────────────┘    └────────────┘    └────────────┘    └────────────┘
                           │                                    │
                           ▼                                    │
                     ┌────────────┐                             │
                     │  loader.js │◄────────────────────────────┘
                     │  (mount)   │     config + data + theme
                     └────────────┘
                           │
                           ▼
                     ┌────────────┐
                     │  Widget    │
                     │ Components │
                     └────────────┘

3. ADMIN PANEL FLOW:
   ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
   │   Admin    │───►│  Next.js   │───►│  Backend   │───►│  Database  │
   │   User     │    │   Panel    │    │    API     │    │ PostgreSQL │
   └────────────┘    └────────────┘    └────────────┘    └────────────┘
```

---

## 4. Teknoloji Stack

### Backend Services

| Katman | Teknoloji | Versiyon | Gerekçe |
|--------|-----------|----------|---------|
| Runtime | Node.js | 20 LTS | Async I/O, JSON native desteği |
| Framework | Express.js | 4.x | Minimalist, esnek, geniş middleware ekosistemi |
| Database | PostgreSQL | 16 | ACID compliance, JSON desteği, güvenilirlik |
| ORM | Prisma | 5.x | Type-safe queries, migration desteği, modern DX |
| Cache | Redis | 7.x | In-memory cache, session store, pub/sub |
| Auth | JWT + bcrypt | - | Stateless authentication, güvenli hashing |
| Validation | Zod | 3.x | Runtime type validation, schema-first design |
| Logging | Winston + Morgan | - | Structured logging, request logging |

### Frontend (Admin Panel)

| Katman | Teknoloji | Versiyon | Gerekçe |
|--------|-----------|----------|---------|
| Framework | Next.js | 14.x | App Router, SSR/SSG, React Server Components |
| Language | TypeScript | 5.x | Type safety, better DX |
| Styling | Tailwind CSS | 3.x | Utility-first, rapid development |
| State | Zustand | 4.x | Lightweight, simple API |
| HTTP Client | Axios | 1.x | Interceptors, request/response transformation |

### CDN & Widget System

| Katman | Teknoloji | Versiyon | Gerekçe |
|--------|-----------|----------|---------|
| Language | Vanilla JS (ES6+) | - | Zero dependency, minimum bundle size |
| Bundler | Rollup | 4.x | Tree-shaking, ES modules, optimal output |
| Styling | CSS Custom Properties | - | Runtime theme değişikliği |

### XML Parser Service

| Katman | Teknoloji | Versiyon | Gerekçe |
|--------|-----------|----------|---------|
| Parser | fast-xml-parser | 4.x | Hızlı, memory-efficient XML parsing |
| Scheduler | node-cron | 3.x | Cron-based job scheduling |
| Queue | Bull | 4.x | Redis-based job queue, retry mekanizması |

### DevOps & Infrastructure

| Katman | Teknoloji | Versiyon | Gerekçe |
|--------|-----------|----------|---------|
| Container | Docker | 24.x | Consistent environments |
| Orchestration | docker-compose | 2.x | Multi-container management |
| Testing | Jest + Supertest | - | Unit + Integration testing |
| CI/CD | GitHub Actions | - | Automated testing, deployment |

---

## 5. Klasör Yapısı

```
ProWidget/
│
├── backend/                          # Backend API Service
│   ├── src/
│   │   ├── config/                   # Configuration files
│   │   │   ├── index.js              # Environment config aggregator
│   │   │   ├── database.js           # Database connection config
│   │   │   ├── redis.js              # Redis connection config
│   │   │   └── constants.js          # Application constants
│   │   │
│   │   ├── controllers/              # HTTP Request Handlers
│   │   │   ├── auth.controller.js    # Authentication endpoints
│   │   │   ├── customer.controller.js # Customer management
│   │   │   ├── widget.controller.js  # Widget operations
│   │   │   ├── theme.controller.js   # Theme customization
│   │   │   ├── feed.controller.js    # XML feed management
│   │   │   └── product.controller.js # Product data endpoints
│   │   │
│   │   ├── services/                 # Business Logic Layer
│   │   │   ├── auth.service.js       # Auth business logic
│   │   │   ├── customer.service.js   # Customer operations
│   │   │   ├── widget.service.js     # Widget logic
│   │   │   ├── theme.service.js      # Theme operations
│   │   │   ├── feed.service.js       # Feed operations
│   │   │   ├── product.service.js    # Product operations
│   │   │   └── cache.service.js      # Redis cache abstraction
│   │   │
│   │   ├── models/                   # Data Models
│   │   │   └── index.js              # Prisma client export
│   │   │
│   │   ├── routes/                   # API Routes
│   │   │   ├── index.js              # Route aggregator
│   │   │   ├── auth.routes.js        # /api/auth/*
│   │   │   ├── customer.routes.js    # /api/customers/*
│   │   │   ├── widget.routes.js      # /api/widgets/*
│   │   │   ├── theme.routes.js       # /api/themes/*
│   │   │   ├── feed.routes.js        # /api/feeds/*
│   │   │   ├── product.routes.js     # /api/products/*
│   │   │   └── public.routes.js      # /api/public/* (widget runtime)
│   │   │
│   │   ├── middlewares/              # Express Middlewares
│   │   │   ├── auth.middleware.js    # JWT verification
│   │   │   ├── validation.middleware.js # Request validation
│   │   │   ├── rateLimiter.middleware.js # Rate limiting
│   │   │   ├── cors.middleware.js    # CORS configuration
│   │   │   ├── error.middleware.js   # Global error handler
│   │   │   └── logger.middleware.js  # Request logging
│   │   │
│   │   ├── validators/               # Input Validation Schemas
│   │   │   ├── auth.validator.js     # Auth schemas
│   │   │   ├── customer.validator.js # Customer schemas
│   │   │   ├── widget.validator.js   # Widget schemas
│   │   │   ├── theme.validator.js    # Theme schemas
│   │   │   └── feed.validator.js     # Feed schemas
│   │   │
│   │   ├── utils/                    # Utility Functions
│   │   │   ├── logger.js             # Winston logger setup
│   │   │   ├── helpers.js            # General helpers
│   │   │   ├── crypto.js             # Encryption utilities
│   │   │   └── response.js           # Standardized responses
│   │   │
│   │   ├── exceptions/               # Custom Error Classes
│   │   │   ├── AppError.js           # Base error class
│   │   │   ├── ValidationError.js    # Validation errors
│   │   │   ├── AuthenticationError.js # Auth errors
│   │   │   └── NotFoundError.js      # 404 errors
│   │   │
│   │   └── app.js                    # Express app setup
│   │
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   ├── migrations/               # Database migrations
│   │   └── seed.js                   # Initial data seeding
│   │
│   ├── tests/
│   │   ├── unit/                     # Unit tests
│   │   ├── integration/              # Integration tests
│   │   └── fixtures/                 # Test data
│   │
│   ├── server.js                     # Application entry point
│   ├── package.json
│   ├── .env.example
│   └── jest.config.js
│
├── xml-parser/                       # XML Parser Service
│   ├── src/
│   │   ├── config/
│   │   │   └── index.js              # Parser configuration
│   │   │
│   │   ├── parsers/                  # XML Parsers (Strategy Pattern)
│   │   │   ├── base.parser.js        # Abstract base parser
│   │   │   ├── generic.parser.js     # Generic XML parser
│   │   │   └── google.parser.js      # Google Merchant format
│   │   │
│   │   ├── normalizers/              # Data Normalizers
│   │   │   ├── product.normalizer.js # Product normalization
│   │   │   └── schema.normalizer.js  # Schema mapping
│   │   │
│   │   ├── services/                 # Parser Services
│   │   │   ├── fetcher.service.js    # URL fetching
│   │   │   ├── parser.service.js     # Parsing orchestration
│   │   │   └── storage.service.js    # Data storage
│   │   │
│   │   ├── jobs/                     # Scheduled Jobs
│   │   │   ├── scheduler.js          # Job scheduler
│   │   │   └── feedSync.job.js       # Feed sync job
│   │   │
│   │   └── utils/
│   │       ├── validator.js          # XML validation
│   │       └── transformer.js        # Data transformations
│   │
│   ├── index.js                      # Entry point
│   ├── package.json
│   └── .env.example
│
├── cdn/                              # CDN Widget Scripts
│   ├── src/
│   │   ├── core/                     # Widget Framework Core
│   │   │   ├── init.js               # Customer entry point
│   │   │   ├── loader.js             # Widget loader
│   │   │   ├── config.js             # Runtime configuration
│   │   │   ├── api.js                # Backend API client
│   │   │   └── utils.js              # Helper utilities
│   │   │
│   │   ├── widgets/                  # Widget Implementations
│   │   │   ├── base/
│   │   │   │   └── BaseWidget.js     # Abstract base widget
│   │   │   │
│   │   │   ├── carousel/
│   │   │   │   ├── Carousel.js       # Carousel widget
│   │   │   │   └── carousel.css      # Carousel styles
│   │   │   │
│   │   │   ├── banner/
│   │   │   │   ├── Banner.js         # Banner widget
│   │   │   │   └── banner.css        # Banner styles
│   │   │   │
│   │   │   └── popup/
│   │   │       ├── Popup.js          # Popup widget
│   │   │       └── popup.css         # Popup styles
│   │   │
│   │   └── styles/
│   │       ├── reset.css             # CSS reset
│   │       └── variables.css         # CSS variables
│   │
│   ├── dist/                         # Built files
│   ├── rollup.config.js              # Bundler config
│   ├── package.json
│   └── .env.example
│
├── admin-panel/                      # Admin Dashboard (Next.js)
│   ├── src/
│   │   ├── app/                      # Next.js App Router
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── page.tsx              # Home page
│   │   │   ├── (auth)/               # Auth pages
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   └── dashboard/            # Dashboard pages
│   │   │       ├── page.tsx
│   │   │       ├── customers/
│   │   │       ├── widgets/
│   │   │       ├── themes/
│   │   │       ├── feeds/
│   │   │       └── settings/
│   │   │
│   │   ├── components/               # React Components
│   │   │   ├── ui/                   # Base UI components
│   │   │   ├── forms/                # Form components
│   │   │   ├── tables/               # Table components
│   │   │   └── layout/               # Layout components
│   │   │
│   │   ├── hooks/                    # Custom Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useCustomers.ts
│   │   │   └── useWidgets.ts
│   │   │
│   │   ├── services/                 # API Services
│   │   │   ├── api.ts                # API client
│   │   │   └── auth.ts               # Auth service
│   │   │
│   │   ├── stores/                   # State Management
│   │   │   └── authStore.ts          # Auth store
│   │   │
│   │   ├── types/                    # TypeScript Types
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                    # Utilities
│   │   │   └── helpers.ts
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── docs/                             # Documentation
│   ├── architecture.md               # This file
│   ├── api-reference.md              # API documentation
│   ├── developer-guide.md            # Integration guide
│   └── deployment.md                 # Deployment guide
│
├── docker/                           # Docker Configurations
│   ├── backend.Dockerfile
│   ├── xml-parser.Dockerfile
│   ├── admin-panel.Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml                # Development setup
├── docker-compose.prod.yml           # Production setup
├── .gitignore
├── .env.example
└── README.md
```

---

## 6. Veritabanı Şeması

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA (ERD)                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      users       │       │    customers     │       │     themes       │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ email            │       │ name             │       │ customer_id (FK) │
│ password_hash    │       │ slug (unique)    │       │ name             │
│ role             │       │ domain           │       │ primary_color    │
│ created_at       │       │ api_key          │       │ secondary_color  │
│ updated_at       │       │ is_active        │       │ font_family      │
└──────────────────┘       │ created_at       │       │ custom_css       │
                           │ updated_at       │       │ is_active        │
                           └────────┬─────────┘       │ created_at       │
                                    │                 └──────────────────┘
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
        │   widget_configs │ │    xml_feeds     │ │     products     │
        ├──────────────────┤ ├──────────────────┤ ├──────────────────┤
        │ id (PK)          │ │ id (PK)          │ │ id (PK)          │
        │ customer_id (FK) │ │ customer_id (FK) │ │ customer_id (FK) │
        │ widget_type      │ │ url              │ │ feed_id (FK)     │
        │ name             │ │ format           │ │ external_id      │
        │ settings (JSON)  │ │ sync_interval    │ │ title            │
        │ placement        │ │ last_sync        │ │ description      │
        │ is_active        │ │ status           │ │ price            │
        │ priority         │ │ error_message    │ │ sale_price       │
        │ created_at       │ │ created_at       │ │ image_url        │
        │ updated_at       │ │ updated_at       │ │ product_url      │
        └──────────────────┘ └──────────────────┘ │ category         │
                                                  │ brand            │
                                                  │ stock_status     │
                                                  │ attributes (JSON)│
                                                  │ created_at       │
                                                  │ updated_at       │
                                                  └──────────────────┘
```

### Tablo Detayları

#### users
Admin panel kullanıcıları

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique, indexed |
| password_hash | VARCHAR(255) | bcrypt hash |
| role | ENUM | 'admin', 'editor', 'viewer' |
| created_at | TIMESTAMP | Oluşturulma tarihi |
| updated_at | TIMESTAMP | Güncellenme tarihi |

#### customers
Widget kullanan müşteri siteleri

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Müşteri adı |
| slug | VARCHAR(100) | URL-safe unique identifier |
| domain | VARCHAR(255) | İzin verilen domain |
| api_key | VARCHAR(64) | API erişim anahtarı |
| is_active | BOOLEAN | Aktiflik durumu |

#### widget_configs
Müşteri bazlı widget konfigürasyonları

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary key |
| customer_id | UUID | Foreign key |
| widget_type | ENUM | 'carousel', 'banner', 'popup' |
| name | VARCHAR(255) | Widget adı |
| settings | JSONB | Widget-specific ayarlar |
| placement | VARCHAR(100) | CSS selector veya position |
| is_active | BOOLEAN | Aktiflik durumu |
| priority | INTEGER | Render sırası |

#### xml_feeds
XML feed kaynakları

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary key |
| customer_id | UUID | Foreign key |
| url | TEXT | XML feed URL |
| format | ENUM | 'google', 'facebook', 'custom' |
| sync_interval | INTEGER | Dakika cinsinden |
| last_sync | TIMESTAMP | Son sync zamanı |
| status | ENUM | 'active', 'error', 'pending' |
| error_message | TEXT | Hata mesajı |

#### products
Parse edilmiş ürün verileri

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary key |
| customer_id | UUID | Foreign key |
| feed_id | UUID | Foreign key |
| external_id | VARCHAR(255) | Feed'deki orijinal ID |
| title | VARCHAR(500) | Ürün başlığı |
| description | TEXT | Ürün açıklaması |
| price | DECIMAL(10,2) | Normal fiyat |
| sale_price | DECIMAL(10,2) | İndirimli fiyat |
| image_url | TEXT | Ürün görseli URL |
| product_url | TEXT | Ürün sayfası URL |
| category | VARCHAR(255) | Kategori |
| brand | VARCHAR(255) | Marka |
| stock_status | ENUM | 'in_stock', 'out_of_stock' |
| attributes | JSONB | Ek özellikler |

#### themes
Müşteri tema ayarları

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | UUID | Primary key |
| customer_id | UUID | Foreign key |
| name | VARCHAR(255) | Tema adı |
| primary_color | VARCHAR(7) | Ana renk (hex) |
| secondary_color | VARCHAR(7) | İkincil renk (hex) |
| font_family | VARCHAR(255) | Font ailesi |
| custom_css | TEXT | Özel CSS |
| is_active | BOOLEAN | Aktif tema |

---

## 7. API Endpoint Tasarımı

### Authentication

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /api/auth/register | Kullanıcı kaydı |
| POST | /api/auth/login | Giriş (JWT döner) |
| POST | /api/auth/refresh | Token yenileme |
| POST | /api/auth/logout | Çıkış |
| GET | /api/auth/me | Mevcut kullanıcı |

### Customers

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /api/customers | Liste (paginated) |
| POST | /api/customers | Yeni müşteri |
| GET | /api/customers/:id | Detay |
| PUT | /api/customers/:id | Güncelle |
| DELETE | /api/customers/:id | Sil |
| POST | /api/customers/:id/regenerate-key | API key yenile |

### Widgets

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /api/widgets | Liste |
| POST | /api/widgets | Yeni widget |
| GET | /api/widgets/:id | Detay |
| PUT | /api/widgets/:id | Güncelle |
| DELETE | /api/widgets/:id | Sil |
| POST | /api/widgets/:id/duplicate | Kopyala |

### Feeds

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /api/feeds | Liste |
| POST | /api/feeds | Yeni feed |
| GET | /api/feeds/:id | Detay |
| PUT | /api/feeds/:id | Güncelle |
| DELETE | /api/feeds/:id | Sil |
| POST | /api/feeds/:id/sync | Manuel sync |
| GET | /api/feeds/:id/logs | Sync logları |

### Products

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /api/products | Liste (paginated, filtered) |
| GET | /api/products/:id | Detay |
| GET | /api/products/search | Arama |

### Themes

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /api/themes | Liste |
| POST | /api/themes | Yeni tema |
| GET | /api/themes/:id | Detay |
| PUT | /api/themes/:id | Güncelle |
| DELETE | /api/themes/:id | Sil |
| POST | /api/themes/:id/activate | Aktif yap |

### Public (Widget Runtime)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /api/public/:slug/config | Widget konfigürasyonu |
| GET | /api/public/:slug/products | Ürün verisi |
| GET | /api/public/:slug/theme | Tema ayarları |

---

## 8. Güvenlik Mimarisi

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Request    │────►│    Rate      │────►│    CORS      │────►│    Auth      │
│   Incoming   │     │   Limiter    │     │   Check      │     │  Middleware  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                      │
                     ┌────────────────────────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
              │    Input     │────►│   Business   │────►│   Response   │
              │  Validation  │     │    Logic     │     │  Sanitization│
              └──────────────┘     └──────────────┘     └──────────────┘
```

### Güvenlik Önlemleri

#### 1. Authentication
- JWT (JSON Web Token) based authentication
- Access token (15 dakika) + Refresh token (7 gün)
- bcrypt ile password hashing (12 rounds)
- Secure, HttpOnly cookies for token storage

#### 2. Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- API key validation for public endpoints

#### 3. Input Validation
- Zod schema validation for all inputs
- SQL injection protection (Prisma parameterized queries)
- XSS prevention (output encoding)

#### 4. Rate Limiting
- Global: 100 requests/minute per IP
- Auth endpoints: 5 requests/minute per IP
- Public API: 1000 requests/minute per customer

#### 5. Security Headers (Helmet.js)
```javascript
{
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true
}
```

#### 6. CORS Policy
```javascript
{
  origin: ['https://admin.prowidget.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}
```

#### 7. Environment Security
- Secrets stored in environment variables
- No secrets in codebase
- Different configs for dev/staging/prod

---

## 9. SOLID Prensipleri Uygulaması

### Single Responsibility Principle (SRP)
Her sınıf/modül tek bir sorumluluğa sahip:
- Controller: Sadece HTTP handling
- Service: Sadece business logic
- Validator: Sadece input validation
- Repository: Sadece data access

### Open/Closed Principle (OCP)
```javascript
// BaseWidget - Genişlemeye açık, değişikliğe kapalı
class BaseWidget {
  constructor(container, config) { }
  render() { throw new Error('Must implement'); }
  destroy() { }
}

// Yeni widget eklemek için sadece extend et
class CarouselWidget extends BaseWidget {
  render() { /* Carousel implementation */ }
}
```

### Liskov Substitution Principle (LSP)
Tüm widget'lar BaseWidget'ı tam olarak replace edebilir:
```javascript
function mountWidget(WidgetClass, container, config) {
  const widget = new WidgetClass(container, config);
  widget.render();
  return widget;
}
```

### Interface Segregation Principle (ISP)
Küçük, focused interface'ler:
```javascript
// Büyük bir interface yerine küçük parçalar
const Renderable = { render(), destroy() };
const Configurable = { setConfig(), getConfig() };
const Themeable = { applyTheme() };
```

### Dependency Inversion Principle (DIP)
High-level modüller low-level detaylara bağımlı değil:
```javascript
// Service'ler abstract repository'ye bağımlı
class CustomerService {
  constructor(repository, cacheService) {
    this.repository = repository;
    this.cache = cacheService;
  }
}
```

---

## 10. Scalability Considerations

### Horizontal Scaling
- Stateless backend design
- Redis for session/cache (shared state)
- Load balancer ready

### Caching Strategy
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CACHING LAYERS                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

Layer 1: CDN Cache (CloudFlare/Fastly)
├── Static assets: 1 year
├── init.js: 5 minutes
└── Customer config: 1 minute

Layer 2: Redis Cache
├── Product data: 5 minutes
├── Theme config: 10 minutes
└── Widget config: 5 minutes

Layer 3: Database Query Cache
└── Prisma query caching
```

### Database Optimization
- Indexed columns (customer_id, slug, external_id)
- Connection pooling
- Read replicas for heavy read operations

---

## 11. Monitoring & Logging

### Log Levels
- **ERROR**: System failures, unhandled exceptions
- **WARN**: Deprecated usage, potential issues
- **INFO**: Business events, API calls
- **DEBUG**: Development details

### Metrics to Track
- Request latency (p50, p95, p99)
- Error rates
- Cache hit/miss ratio
- Feed sync success rate
- Widget load time

---

## 12. Sonraki Adımlar

1. **Prompt 2**: Backend API, Database, Models, Auth implementation
2. **Prompt 3**: XML Parser & Scheduler Service
3. **Prompt 4**: CDN Script & Widget Framework
4. **Prompt 5**: Widget implementations (Carousel, Banner, Popup)
5. **Prompt 6**: Admin Panel (Next.js)
6. **Prompt 7**: Docker & Environment configuration
7. **Prompt 8**: Testing (Unit + Integration)
8. **Prompt 9**: Documentation & Usage examples

---

*Bu doküman, ProWidget projesinin temel mimari referansıdır ve geliştirme sürecinde güncellenecektir.*

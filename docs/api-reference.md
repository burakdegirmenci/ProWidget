# ProWidget API Reference

Bu dokuman ProWidget API endpoint'lerini detayli olarak aciklar.

**Base URL**: `https://api.prowidget.com`

## Icindekiler

- [Public Endpoints](#public-endpoints)
- [Admin Authentication](#admin-authentication)
- [Admin - Customers](#admin---customers)
- [Admin - Widgets](#admin---widgets)
- [Admin - Themes](#admin---themes)
- [Admin - XML Feeds](#admin---xml-feeds)
- [Error Handling](#error-handling)

---

## Public Endpoints

Public endpoint'ler authentication gerektirmez. Widget'larin calisabilmesi icin kullanilir.

### GET /api/public/widget/:slug

Musteri widget konfigurasyonunu getirir.

**URL**: `/api/public/widget/:slug`

**Method**: `GET`

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| slug | string | Musteri slug'i (ornek: elle-shoes) |

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "customer": "Elle Shoes",
    "widgets": [
      {
        "id": "widget-123",
        "type": "CAROUSEL",
        "name": "Ana Sayfa Carousel",
        "isActive": true,
        "config": {
          "slidesToShow": 4,
          "autoplay": true,
          "autoplaySpeed": 3000
        }
      }
    ],
    "theme": {
      "primaryColor": "#e91e63",
      "secondaryColor": "#9c27b0",
      "fontFamily": "Inter, sans-serif",
      "borderRadius": "8px"
    }
  }
}
```

**Response (404)**:
```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer not found"
  }
}
```

---

### GET /api/public/products/:slug

Musteri urunlerini getirir.

**URL**: `/api/public/products/:slug`

**Method**: `GET`

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| slug | string | Musteri slug'i |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 20 | Maksimum urun sayisi |
| campaign | string | - | Kampanya filtresi |
| category | string | - | Kategori filtresi |

**Example Request**:
```
GET /api/public/products/elle-shoes?category=bot&limit=8
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "customer": "Elle Shoes",
    "products": [
      {
        "id": "prod-001",
        "title": "Siyah Deri Bot",
        "description": "Hakiki deri, su gecirmez",
        "price": 1299.99,
        "salePrice": 999.99,
        "currency": "TRY",
        "imageLink": "https://elleshoes.com/images/bot-001.jpg",
        "link": "https://elleshoes.com/urun/siyah-deri-bot",
        "category": "bot",
        "brand": "Elle",
        "availability": "in_stock",
        "campaign": "kis-indirimi"
      }
    ],
    "total": 24
  }
}
```

---

### GET /api/public/theme/:slug

Musteri tema ayarlarini getirir.

**URL**: `/api/public/theme/:slug`

**Method**: `GET`

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "primaryColor": "#e91e63",
    "secondaryColor": "#9c27b0",
    "backgroundColor": "#ffffff",
    "textColor": "#333333",
    "fontFamily": "Inter, sans-serif",
    "borderRadius": "8px",
    "boxShadow": "0 2px 8px rgba(0,0,0,0.1)"
  }
}
```

---

### GET /api/health

Sistem saglik kontrolu.

**URL**: `/api/health`

**Method**: `GET`

**Response (200)**:
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Admin Authentication

Admin endpoint'leri JWT authentication gerektirir.

### POST /api/admin/auth/login

Admin girisi yapar.

**URL**: `/api/admin/auth/login`

**Method**: `POST`

**Request Body**:
```json
{
  "email": "admin@prowidget.com",
  "password": "admin123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-001",
      "email": "admin@prowidget.com",
      "name": "Admin User",
      "role": "ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (401)**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

### POST /api/admin/auth/refresh

Access token yeniler.

**URL**: `/api/admin/auth/refresh`

**Method**: `POST`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### GET /api/admin/auth/me

Mevcut kullanici bilgisini getirir.

**URL**: `/api/admin/auth/me`

**Method**: `GET`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "user-001",
    "email": "admin@prowidget.com",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

---

## Admin - Customers

Musteri yonetimi endpoint'leri.

### GET /api/admin/customers

Tum musterileri listeler.

**URL**: `/api/admin/customers`

**Method**: `GET`

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Sayfa numarasi |
| limit | number | 20 | Sayfa basina kayit |
| search | string | - | Arama terimi |
| isActive | boolean | - | Aktiflik filtresi |

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "cust-001",
      "name": "Elle Shoes",
      "slug": "elle-shoes",
      "domain": "https://elleshoes.com",
      "apiKey": "pwx_abc123...",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "_count": {
        "widgets": 3,
        "products": 156
      }
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### POST /api/admin/customers

Yeni musteri olusturur.

**URL**: `/api/admin/customers`

**Method**: `POST`

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Elle Shoes",
  "domain": "https://elleshoes.com",
  "slug": "elle-shoes",
  "contactEmail": "info@elleshoes.com",
  "contactPhone": "+90 212 555 0000"
}
```

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "cust-001",
    "name": "Elle Shoes",
    "slug": "elle-shoes",
    "domain": "https://elleshoes.com",
    "apiKey": "pwx_k8j2m9x4n7p3q6r1s5t8u2v0w3y6z9",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/admin/customers/:id

Musteri detayini getirir.

**URL**: `/api/admin/customers/:id`

**Method**: `GET`

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "cust-001",
    "name": "Elle Shoes",
    "slug": "elle-shoes",
    "domain": "https://elleshoes.com",
    "apiKey": "pwx_abc123...",
    "contactEmail": "info@elleshoes.com",
    "contactPhone": "+90 212 555 0000",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "widgets": [...],
    "theme": {...},
    "xmlFeed": {...}
  }
}
```

---

### PUT /api/admin/customers/:id

Musteri gunceller.

**URL**: `/api/admin/customers/:id`

**Method**: `PUT`

**Request Body**:
```json
{
  "name": "Elle Shoes Turkey",
  "domain": "https://elleshoes.com.tr",
  "isActive": true
}
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "cust-001",
    "name": "Elle Shoes Turkey",
    "slug": "elle-shoes",
    "domain": "https://elleshoes.com.tr",
    "isActive": true,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### DELETE /api/admin/customers/:id

Musteri siler (soft delete).

**URL**: `/api/admin/customers/:id`

**Method**: `DELETE`

**Response (200)**:
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

---

## Admin - Widgets

Widget konfigurasyonu endpoint'leri.

### GET /api/admin/customers/:customerId/widgets

Musteri widget'larini listeler.

**URL**: `/api/admin/customers/:customerId/widgets`

**Method**: `GET`

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "widget-001",
      "type": "CAROUSEL",
      "name": "Ana Sayfa Carousel",
      "placement": "homepage",
      "isActive": true,
      "config": {
        "slidesToShow": 4,
        "slidesToScroll": 1,
        "autoplay": true,
        "autoplaySpeed": 3000,
        "dots": true,
        "arrows": true
      },
      "filters": {
        "category": null,
        "campaign": null,
        "limit": 12
      }
    }
  ]
}
```

---

### POST /api/admin/customers/:customerId/widgets

Yeni widget olusturur.

**URL**: `/api/admin/customers/:customerId/widgets`

**Method**: `POST`

**Request Body**:
```json
{
  "type": "CAROUSEL",
  "name": "Kampanya Carousel",
  "placement": "homepage",
  "config": {
    "slidesToShow": 4,
    "autoplay": true,
    "autoplaySpeed": 3000
  },
  "filters": {
    "campaign": "kis-indirimi",
    "limit": 8
  }
}
```

**Widget Types**:
- `CAROUSEL` - Kayan urun slider'i
- `BANNER` - Tek urun/kampanya banner'i
- `POPUP` - Modal popup
- `GRID` - Izgara gorunum
- `SLIDER` - Tam ekran slider
- `FLOATING` - Kayan buton

**Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "widget-002",
    "type": "CAROUSEL",
    "name": "Kampanya Carousel",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### PUT /api/admin/customers/:customerId/widgets/:id

Widget gunceller.

**URL**: `/api/admin/customers/:customerId/widgets/:id`

**Method**: `PUT`

**Request Body**:
```json
{
  "name": "Kis Kampanyasi Carousel",
  "config": {
    "slidesToShow": 5,
    "autoplaySpeed": 5000
  },
  "isActive": true
}
```

---

### DELETE /api/admin/customers/:customerId/widgets/:id

Widget siler.

**URL**: `/api/admin/customers/:customerId/widgets/:id`

**Method**: `DELETE`

---

## Admin - Themes

Tema yonetimi endpoint'leri.

### GET /api/admin/customers/:customerId/theme

Musteri temasini getirir.

**URL**: `/api/admin/customers/:customerId/theme`

**Method**: `GET`

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "theme-001",
    "customerId": "cust-001",
    "primaryColor": "#e91e63",
    "secondaryColor": "#9c27b0",
    "backgroundColor": "#ffffff",
    "textColor": "#333333",
    "fontFamily": "Inter, sans-serif",
    "borderRadius": "8px",
    "boxShadow": "0 2px 8px rgba(0,0,0,0.1)",
    "customCss": ""
  }
}
```

---

### PUT /api/admin/customers/:customerId/theme

Tema gunceller veya olusturur.

**URL**: `/api/admin/customers/:customerId/theme`

**Method**: `PUT`

**Request Body**:
```json
{
  "primaryColor": "#e91e63",
  "secondaryColor": "#9c27b0",
  "backgroundColor": "#ffffff",
  "textColor": "#333333",
  "fontFamily": "Inter, sans-serif",
  "borderRadius": "12px",
  "boxShadow": "0 4px 12px rgba(0,0,0,0.15)",
  "customCss": ".pwx-product-card { border: 1px solid #eee; }"
}
```

---

## Admin - XML Feeds

XML feed yonetimi endpoint'leri.

### GET /api/admin/customers/:customerId/feed

Musteri XML feed bilgisini getirir.

**URL**: `/api/admin/customers/:customerId/feed`

**Method**: `GET`

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "feed-001",
    "customerId": "cust-001",
    "url": "https://elleshoes.com/feed/products.xml",
    "format": "GOOGLE_MERCHANT",
    "status": "ACTIVE",
    "lastSync": "2024-01-15T10:00:00.000Z",
    "lastSyncStatus": "SUCCESS",
    "productCount": 156,
    "syncInterval": 60
  }
}
```

---

### PUT /api/admin/customers/:customerId/feed

XML feed gunceller.

**URL**: `/api/admin/customers/:customerId/feed`

**Method**: `PUT`

**Request Body**:
```json
{
  "url": "https://elleshoes.com/feed/products.xml",
  "format": "GOOGLE_MERCHANT",
  "syncInterval": 60
}
```

**Feed Formats**:
- `GOOGLE_MERCHANT` - Google Merchant Center XML
- `FACEBOOK_CATALOG` - Facebook Product Catalog
- `CUSTOM` - Ozel XML formati

---

### POST /api/admin/customers/:customerId/feed/sync

Manuel feed senkronizasyonu baslatir.

**URL**: `/api/admin/customers/:customerId/feed/sync`

**Method**: `POST`

**Response (200)**:
```json
{
  "success": true,
  "message": "Feed sync started",
  "data": {
    "jobId": "job-12345"
  }
}
```

---

## Error Handling

API tum hatalari tutarli bir formatta dondurur.

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Gecersiz istek verisi |
| UNAUTHORIZED | 401 | Authentication gerekli |
| INVALID_CREDENTIALS | 401 | Hatali giris bilgileri |
| INVALID_TOKEN | 401 | Gecersiz veya suresi dolmus token |
| FORBIDDEN | 403 | Yetkisiz erisim |
| NOT_FOUND | 404 | Kaynak bulunamadi |
| CUSTOMER_NOT_FOUND | 404 | Musteri bulunamadi |
| CONFLICT | 409 | Kaynak zaten mevcut |
| RATE_LIMIT_EXCEEDED | 429 | Istek limiti asildi |
| SERVER_ERROR | 500 | Sunucu hatasi |

### Rate Limiting

API rate limiting uygulamaktadir:

- **Public endpoints**: 100 istek/dakika (IP basina)
- **Admin endpoints**: 1000 istek/dakika (kullanici basina)

Rate limit bilgisi response header'larinda yer alir:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312800
```

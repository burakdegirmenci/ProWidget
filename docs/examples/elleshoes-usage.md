# Elle Shoes - ProWidget Entegrasyon Ornegi

Bu dokuman, Elle Shoes e-ticaret sitesinin ProWidget widget'larini nasil entegre ettigini adim adim aciklar.

## Icindekiler

- [Senaryo](#senaryo)
- [XML Feed Hazirlanmasi](#xml-feed-hazirlanmasi)
- [Admin Panel Konfigurasyonu](#admin-panel-konfigurasyonu)
- [Site Entegrasyonu](#site-entegrasyonu)
- [Widget Ornekleri](#widget-ornekleri)
- [Ozel Tema](#ozel-tema)

---

## Senaryo

**Elle Shoes**, Turkiye'nin onde gelen ayakkabi markalarindan biridir. Web sitelerinde su widget'lari kullanmak istiyorlar:

1. **Ana Sayfa Carousel**: En cok satan urunler
2. **Kategori Sayfasi Grid**: Kategori urunleri
3. **Kampanya Banner**: Aktif kampanya gosterimi
4. **Exit Popup**: Sepet terk etme popup'i

---

## XML Feed Hazirlanmasi

Elle Shoes, Google Merchant Center formatinda bir XML feed sunmaktadir.

### Feed URL
```
https://elleshoes.com/feed/products.xml
```

### XML Feed Ornegi

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:g="http://base.google.com/ns/1.0">
  <title>Elle Shoes Product Feed</title>
  <link href="https://elleshoes.com"/>
  <updated>2024-01-15T10:00:00+03:00</updated>

  <!-- Urun 1: Bot -->
  <entry>
    <g:id>ELLE-BOT-001</g:id>
    <g:title>Siyah Hakiki Deri Bot</g:title>
    <g:description>
      Su gecirmez, hakiki dana derisi.
      Kaymaz taban, 5cm topuk.
    </g:description>
    <g:link>https://elleshoes.com/urun/siyah-hakiki-deri-bot</g:link>
    <g:image_link>https://elleshoes.com/images/products/bot-001-main.jpg</g:image_link>
    <g:additional_image_link>https://elleshoes.com/images/products/bot-001-side.jpg</g:additional_image_link>
    <g:additional_image_link>https://elleshoes.com/images/products/bot-001-back.jpg</g:additional_image_link>
    <g:price>1899.00 TRY</g:price>
    <g:sale_price>1299.00 TRY</g:sale_price>
    <g:availability>in_stock</g:availability>
    <g:brand>Elle</g:brand>
    <g:condition>new</g:condition>
    <g:product_type>Ayakkabi > Kadin > Bot</g:product_type>
    <g:google_product_category>187</g:google_product_category>
    <g:custom_label_0>kis-koleksiyonu</g:custom_label_0>
    <g:custom_label_1>cok-satan</g:custom_label_1>
    <g:custom_label_2>indirimli</g:custom_label_2>
  </entry>

  <!-- Urun 2: Topuklu Ayakkabi -->
  <entry>
    <g:id>ELLE-TOPUK-002</g:id>
    <g:title>Kirmizi Stiletto</g:title>
    <g:description>
      Patent deri, 10cm ince topuk.
      Ozel tasarim toka detayi.
    </g:description>
    <g:link>https://elleshoes.com/urun/kirmizi-stiletto</g:link>
    <g:image_link>https://elleshoes.com/images/products/stiletto-002-main.jpg</g:image_link>
    <g:price>2499.00 TRY</g:price>
    <g:availability>in_stock</g:availability>
    <g:brand>Elle</g:brand>
    <g:condition>new</g:condition>
    <g:product_type>Ayakkabi > Kadin > Topuklu</g:product_type>
    <g:custom_label_0>yeni-sezon</g:custom_label_0>
  </entry>

  <!-- Urun 3: Sneaker -->
  <entry>
    <g:id>ELLE-SNK-003</g:id>
    <g:title>Beyaz Deri Sneaker</g:title>
    <g:description>
      Gunluk kullanim icin rahat sneaker.
      Memory foam tabani.
    </g:description>
    <g:link>https://elleshoes.com/urun/beyaz-deri-sneaker</g:link>
    <g:image_link>https://elleshoes.com/images/products/sneaker-003-main.jpg</g:image_link>
    <g:price>1199.00 TRY</g:price>
    <g:sale_price>899.00 TRY</g:sale_price>
    <g:availability>in_stock</g:availability>
    <g:brand>Elle</g:brand>
    <g:condition>new</g:condition>
    <g:product_type>Ayakkabi > Unisex > Sneaker</g:product_type>
    <g:custom_label_0>kis-koleksiyonu</g:custom_label_0>
    <g:custom_label_1>indirimli</g:custom_label_1>
  </entry>

  <!-- Urun 4: Sandalet -->
  <entry>
    <g:id>ELLE-SND-004</g:id>
    <g:title>Altin Rengi Sandalet</g:title>
    <g:description>
      Yaz partileri icin ideal.
      5cm blok topuk, ayarlanabilir bileklik.
    </g:description>
    <g:link>https://elleshoes.com/urun/altin-sandalet</g:link>
    <g:image_link>https://elleshoes.com/images/products/sandalet-004-main.jpg</g:image_link>
    <g:price>1599.00 TRY</g:price>
    <g:availability>limited_availability</g:availability>
    <g:brand>Elle</g:brand>
    <g:condition>new</g:condition>
    <g:product_type>Ayakkabi > Kadin > Sandalet</g:product_type>
    <g:custom_label_0>yaz-koleksiyonu</g:custom_label_0>
  </entry>

</feed>
```

---

## Admin Panel Konfigurasyonu

### Adim 1: Musteri Olusturma

1. Admin Panel'e giris yapin: `https://admin.prowidget.com`
2. Sol menudan **Customers** > **New Customer**
3. Asagidaki bilgileri girin:

| Alan | Deger |
|------|-------|
| Name | Elle Shoes |
| Slug | elle-shoes |
| Domain | https://elleshoes.com |
| Contact Email | marketing@elleshoes.com |
| Contact Phone | +90 212 555 0000 |

4. **Create Customer** butonuna basin

### Adim 2: XML Feed Tanimlama

1. Olusturulan Elle Shoes musterisine tiklayin
2. **Feed** sekmesine gecin
3. Asagidaki bilgileri girin:

| Alan | Deger |
|------|-------|
| Feed URL | https://elleshoes.com/feed/products.xml |
| Format | Google Merchant Center |
| Sync Interval | 60 dakika |

4. **Save Feed** butonuna basin
5. **Sync Now** ile test edin

### Adim 3: Tema Ayarlari

1. **Theme** sekmesine gecin
2. Elle Shoes marka renklerini girin:

```json
{
  "primaryColor": "#e91e63",
  "secondaryColor": "#9c27b0",
  "backgroundColor": "#ffffff",
  "textColor": "#333333",
  "fontFamily": "'Poppins', sans-serif",
  "borderRadius": "8px",
  "boxShadow": "0 2px 12px rgba(0,0,0,0.08)"
}
```

### Adim 4: Widget Konfigurasyonu

**Widget 1: Ana Sayfa Carousel**

1. **Widgets** sekmesine gecin
2. **Add Widget** tiklayin
3. Konfigurasyonu girin:

```json
{
  "type": "CAROUSEL",
  "name": "Ana Sayfa - Cok Satanlar",
  "placement": "homepage-hero",
  "config": {
    "slidesToShow": 4,
    "slidesToScroll": 1,
    "autoplay": true,
    "autoplaySpeed": 4000,
    "dots": true,
    "arrows": true,
    "infinite": true,
    "responsive": [
      { "breakpoint": 1024, "settings": { "slidesToShow": 3 } },
      { "breakpoint": 768, "settings": { "slidesToShow": 2 } },
      { "breakpoint": 480, "settings": { "slidesToShow": 1 } }
    ]
  },
  "filters": {
    "campaign": "cok-satan",
    "limit": 12
  }
}
```

**Widget 2: Kategori Grid**

```json
{
  "type": "GRID",
  "name": "Kategori Sayfasi Grid",
  "placement": "category-page",
  "config": {
    "columns": 4,
    "gap": 24,
    "showPagination": true,
    "itemsPerPage": 12
  },
  "filters": {
    "limit": 24
  }
}
```

**Widget 3: Kampanya Banner**

```json
{
  "type": "BANNER",
  "name": "Kis Indirimi Banner",
  "placement": "homepage-banner",
  "config": {
    "layout": "horizontal",
    "showPrice": true,
    "showDiscount": true,
    "ctaText": "Hemen Al"
  },
  "filters": {
    "campaign": "kis-koleksiyonu",
    "limit": 1
  }
}
```

**Widget 4: Exit Intent Popup**

```json
{
  "type": "POPUP",
  "name": "Sepet Terk Popup",
  "placement": "exit-intent",
  "config": {
    "trigger": "exit",
    "delay": 0,
    "showOnce": true,
    "cookieExpiry": 7,
    "title": "Ayrilmadan Once!",
    "subtitle": "Size ozel %10 indirim kacirmayin",
    "showProducts": true,
    "productCount": 3
  },
  "filters": {
    "campaign": "indirimli",
    "limit": 3
  }
}
```

---

## Site Entegrasyonu

### Adim 1: Script Ekleme

Elle Shoes sitesinin `<head>` bolumune asagidaki scripti ekleyin:

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elle Shoes - Ayakkabi Dunyasi</title>

  <!-- ProWidget Script -->
  <script
    defer
    src="https://cdn.prowidget.com/elle-shoes/init.js"
  ></script>
</head>
<body>
  <!-- Sayfa icerigi -->
</body>
</html>
```

### Adim 2: Widget Container Ekleme

#### Ana Sayfa (index.html)

```html
<!-- Hero Section - Carousel -->
<section class="hero-section">
  <h2>Cok Satan Urunler</h2>
  <div
    data-pwx-widget="carousel"
    data-pwx-campaign="cok-satan"
    data-pwx-limit="12"
    data-pwx-autoplay="true"
    data-pwx-slides-to-show="4"
  ></div>
</section>

<!-- Banner Section -->
<section class="promo-section">
  <div
    data-pwx-widget="banner"
    data-pwx-campaign="kis-koleksiyonu"
  ></div>
</section>

<!-- Exit Intent Popup (gorunmez, otomatik tetiklenir) -->
<div
  data-pwx-widget="popup"
  data-pwx-trigger="exit"
  data-pwx-campaign="indirimli"
  data-pwx-limit="3"
></div>
```

#### Kategori Sayfasi (kategori.html)

```html
<!-- Kategori Grid -->
<section class="category-products">
  <h1>Bot Koleksiyonu</h1>
  <div
    data-pwx-widget="grid"
    data-pwx-category="bot"
    data-pwx-limit="24"
    data-pwx-columns="4"
  ></div>
</section>
```

#### Urun Detay Sayfasi (urun.html)

```html
<!-- Benzer Urunler -->
<section class="related-products">
  <h3>Bunlari da Begenebilirsiniz</h3>
  <div
    data-pwx-widget="carousel"
    data-pwx-category="bot"
    data-pwx-limit="8"
    data-pwx-slides-to-show="4"
    data-pwx-autoplay="false"
  ></div>
</section>
```

---

## Widget Ornekleri

### Carousel Widget

```html
<div
  data-pwx-widget="carousel"
  data-pwx-campaign="kis-koleksiyonu"
  data-pwx-limit="8"
  data-pwx-slides-to-show="4"
  data-pwx-autoplay="true"
  data-pwx-autoplay-speed="3000"
  data-pwx-dots="true"
  data-pwx-arrows="true"
></div>
```

**Data Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| data-pwx-widget | string | - | Widget tipi (zorunlu) |
| data-pwx-campaign | string | - | Kampanya filtresi |
| data-pwx-category | string | - | Kategori filtresi |
| data-pwx-limit | number | 12 | Urun limiti |
| data-pwx-slides-to-show | number | 4 | Gorunen slide sayisi |
| data-pwx-autoplay | boolean | false | Otomatik oynatma |
| data-pwx-autoplay-speed | number | 3000 | Oynatma hizi (ms) |
| data-pwx-dots | boolean | true | Nokta navigasyonu |
| data-pwx-arrows | boolean | true | Ok navigasyonu |

### Grid Widget

```html
<div
  data-pwx-widget="grid"
  data-pwx-category="sneaker"
  data-pwx-limit="12"
  data-pwx-columns="3"
  data-pwx-gap="20"
></div>
```

### Banner Widget

```html
<div
  data-pwx-widget="banner"
  data-pwx-campaign="yaz-koleksiyonu"
  data-pwx-layout="horizontal"
  data-pwx-show-price="true"
  data-pwx-show-discount="true"
></div>
```

### Popup Widget

```html
<div
  data-pwx-widget="popup"
  data-pwx-trigger="exit"
  data-pwx-delay="5000"
  data-pwx-campaign="indirimli"
  data-pwx-limit="3"
  data-pwx-title="Ozel Firsat!"
  data-pwx-show-once="true"
></div>
```

**Trigger Options:**
- `exit` - Sayfa terk etme niyetinde
- `scroll` - Belirli scroll yuzdesi
- `time` - Belirli sure sonra
- `click` - Elemente tiklamada

---

## Ozel Tema

Elle Shoes icin ozel CSS eklemek isterseniz:

### Admin Panel'den

Theme sekmesindeki "Custom CSS" alanina:

```css
/* Elle Shoes Ozel Stiller */

/* Urun karti hover efekti */
.pwx-product-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.pwx-product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(233, 30, 99, 0.15);
}

/* Indirim badge */
.pwx-discount-badge {
  background: linear-gradient(135deg, #e91e63, #9c27b0);
  font-weight: 600;
}

/* Sepete ekle butonu */
.pwx-add-to-cart {
  background: #e91e63;
  border: none;
  border-radius: 25px;
  padding: 12px 24px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.pwx-add-to-cart:hover {
  background: #c2185b;
  transform: scale(1.05);
}

/* Popup ozel stil */
.pwx-popup-overlay {
  backdrop-filter: blur(4px);
}

.pwx-popup-content {
  border-radius: 16px;
  max-width: 500px;
}
```

### Site CSS'inden

Elle Shoes sitesinin kendi CSS dosyasinda:

```css
/* ProWidget widget'larini site tasarimina uyumlu hale getirme */

[data-pwx-widget] {
  font-family: 'Poppins', sans-serif;
}

/* Carousel container */
.hero-section [data-pwx-widget="carousel"] {
  margin: 40px 0;
  padding: 0 20px;
}

/* Grid container */
.category-products [data-pwx-widget="grid"] {
  padding: 20px;
}
```

---

## JavaScript Events

Elle Shoes, widget eventlerini dinleyerek analytics entegrasyonu yapabilir:

```javascript
// ProWidget event listener
window.addEventListener('pwx:ready', () => {
  console.log('ProWidget yuklendi');

  // Urun goruntulendiginde
  window.PWX.on('product:view', (product) => {
    // Google Analytics
    gtag('event', 'view_item', {
      currency: 'TRY',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.title,
        price: product.price
      }]
    });
  });

  // Urune tiklandiginda
  window.PWX.on('product:click', (product) => {
    gtag('event', 'select_item', {
      items: [{
        item_id: product.id,
        item_name: product.title
      }]
    });
  });

  // Sepete eklendiginde
  window.PWX.on('product:addToCart', (product) => {
    gtag('event', 'add_to_cart', {
      currency: 'TRY',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.title,
        quantity: 1,
        price: product.price
      }]
    });
  });

  // Popup gosterildiginde
  window.PWX.on('popup:show', (popup) => {
    gtag('event', 'popup_shown', {
      popup_name: popup.name
    });
  });
});
```

---

## Sonuc

Elle Shoes, ProWidget entegrasyonu ile:

- **4 farkli widget** kullanarak site deneyimini zenginlestirdi
- **XML feed** ile urun verilerini otomatik guncelledi
- **Ozel tema** ile marka kimligi korundu
- **Analytics** entegrasyonu ile kullanici davranislarini olcumledi

Entegrasyon suresi: **~2 saat**

---

## Destek

Sorulariniz icin:
- Email: support@prowidget.com
- Dokumantasyon: https://docs.prowidget.com

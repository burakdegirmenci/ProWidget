/**
 * PWX Selector Agent
 *
 * Bu script müşteri sitesinde çalışır ve admin panel'den
 * element seçimi yapılmasını sağlar.
 *
 * Aktivasyon: URL'de ?pwx_select=1 parametresi olmalı
 * İletişim: window.opener.postMessage ile Admin Panel'e gönderir
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'pwx_selector_session';
  const HIGHLIGHT_COLOR = '#3b82f6'; // Blue-500
  const SELECTED_COLOR = '#22c55e'; // Green-500

  // URL parametresi kontrolü - Admin Panel'den mi açıldı?
  const urlParams = new URLSearchParams(window.location.search);
  const isSelectMode = urlParams.get('pwx_select') === '1';

  // Ayrıca localStorage'dan da kontrol et (aynı origin için)
  const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  const hasLocalSession = session && session.status === 'selecting';

  // İkisinden biri yoksa çık
  if (!isSelectMode && !hasLocalSession) {
    return;
  }

  console.log('[PWX Selector] Agent aktif - Element seçimi bekleniyor...');
  console.log('[PWX Selector] Aktivasyon:', isSelectMode ? 'URL param' : 'localStorage');

  // ========================================
  // State
  // ========================================

  let hoveredElement = null;
  let selectedElement = null;
  let highlightOverlay = null;
  let uiContainer = null;

  // ========================================
  // UI Oluşturma
  // ========================================

  function createUI() {
    // Ana container
    uiContainer = document.createElement('div');
    uiContainer.className = 'pwx-selector-ui';
    uiContainer.innerHTML = `
      <div class="pwx-selector-toolbar">
        <div class="pwx-selector-logo">PWX Selector</div>
        <div class="pwx-selector-info">Widget yerleştirmek istediğiniz elementi tıklayın</div>
        <button class="pwx-selector-cancel">İptal</button>
      </div>
      <div class="pwx-selector-status"></div>
    `;

    // Styles
    const styles = document.createElement('style');
    styles.textContent = `
      .pwx-selector-ui {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .pwx-selector-toolbar {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 20px;
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .pwx-selector-logo {
        font-weight: 700;
        font-size: 14px;
        padding: 6px 12px;
        background: rgba(255,255,255,0.2);
        border-radius: 6px;
      }

      .pwx-selector-info {
        flex: 1;
        font-size: 14px;
        opacity: 0.9;
      }

      .pwx-selector-cancel {
        padding: 8px 16px;
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 6px;
        color: white;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .pwx-selector-cancel:hover {
        background: rgba(255,255,255,0.3);
      }

      .pwx-selector-status {
        padding: 8px 20px;
        background: #fef3c7;
        color: #92400e;
        font-size: 13px;
        display: none;
      }

      .pwx-selector-status.visible {
        display: block;
      }

      .pwx-selector-highlight {
        position: fixed;
        pointer-events: none;
        border: 2px solid ${HIGHLIGHT_COLOR};
        background: rgba(59, 130, 246, 0.1);
        z-index: 2147483646;
        transition: all 0.1s ease-out;
      }

      .pwx-selector-highlight.selected {
        border-color: ${SELECTED_COLOR};
        background: rgba(34, 197, 94, 0.1);
      }

      .pwx-selector-label {
        position: absolute;
        bottom: 100%;
        left: 0;
        padding: 4px 8px;
        background: ${HIGHLIGHT_COLOR};
        color: white;
        font-size: 11px;
        font-family: monospace;
        white-space: nowrap;
        border-radius: 4px 4px 0 0;
      }

      .pwx-selector-highlight.selected .pwx-selector-label {
        background: ${SELECTED_COLOR};
      }

      .pwx-selector-confirm {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        display: none;
        gap: 12px;
        padding: 16px 24px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      }

      .pwx-selector-confirm.visible {
        display: flex;
      }

      .pwx-selector-confirm-text {
        font-size: 14px;
        color: #374151;
      }

      .pwx-selector-confirm-text code {
        display: block;
        margin-top: 8px;
        padding: 8px 12px;
        background: #f3f4f6;
        border-radius: 6px;
        font-family: monospace;
        font-size: 12px;
        color: #1f2937;
        max-width: 400px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .pwx-selector-confirm-buttons {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }

      .pwx-selector-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .pwx-selector-btn-primary {
        background: ${SELECTED_COLOR};
        color: white;
      }

      .pwx-selector-btn-primary:hover {
        background: #16a34a;
      }

      .pwx-selector-btn-secondary {
        background: #e5e7eb;
        color: #374151;
      }

      .pwx-selector-btn-secondary:hover {
        background: #d1d5db;
      }
    `;

    document.head.appendChild(styles);
    document.body.appendChild(uiContainer);

    // Highlight overlay
    highlightOverlay = document.createElement('div');
    highlightOverlay.className = 'pwx-selector-highlight';
    highlightOverlay.innerHTML = '<div class="pwx-selector-label"></div>';
    document.body.appendChild(highlightOverlay);

    // Confirm dialog
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'pwx-selector-confirm';
    confirmDialog.innerHTML = `
      <div class="pwx-selector-confirm-text">
        <strong>Seçilen Element:</strong>
        <code id="pwx-selected-selector"></code>
        <div class="pwx-selector-confirm-buttons">
          <button class="pwx-selector-btn pwx-selector-btn-primary" id="pwx-confirm-btn">Bu Alanı Kullan</button>
          <button class="pwx-selector-btn pwx-selector-btn-secondary" id="pwx-reselect-btn">Tekrar Seç</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmDialog);

    // Event listeners
    uiContainer.querySelector('.pwx-selector-cancel').addEventListener('click', cancel);
    confirmDialog.querySelector('#pwx-confirm-btn').addEventListener('click', confirmSelection);
    confirmDialog.querySelector('#pwx-reselect-btn').addEventListener('click', resetSelection);
  }

  // ========================================
  // Highlight Logic
  // ========================================

  function highlightElement(element) {
    if (!element || element === highlightOverlay || element.closest('.pwx-selector-ui') || element.closest('.pwx-selector-confirm')) {
      highlightOverlay.style.display = 'none';
      return;
    }

    const rect = element.getBoundingClientRect();
    highlightOverlay.style.display = 'block';
    highlightOverlay.style.top = rect.top + window.scrollY + 'px';
    highlightOverlay.style.left = rect.left + window.scrollX + 'px';
    highlightOverlay.style.width = rect.width + 'px';
    highlightOverlay.style.height = rect.height + 'px';

    // Label güncelle
    const label = highlightOverlay.querySelector('.pwx-selector-label');
    label.textContent = getElementDescription(element);
  }

  function getElementDescription(element) {
    let desc = element.tagName.toLowerCase();
    if (element.id) desc += `#${element.id}`;
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c && !c.startsWith('pwx-')).slice(0, 2);
      if (classes.length) desc += `.${classes.join('.')}`;
    }
    return desc;
  }

  // ========================================
  // Selector Generation
  // ========================================

  function generateUniqueSelector(element) {
    // 1. ID varsa kullan (en güvenilir)
    if (element.id && !element.id.startsWith('pwx-')) {
      return `#${element.id}`;
    }

    // 2. data-* attribute kontrolü
    const dataAttr = findDataAttribute(element);
    if (dataAttr) {
      return `[${dataAttr}]`;
    }

    // 3. Unique class kontrolü
    const uniqueClass = findUniqueClass(element);
    if (uniqueClass) {
      return `.${uniqueClass}`;
    }

    // 4. nth-child path oluştur
    return buildPath(element);
  }

  function findDataAttribute(element) {
    for (const attr of element.attributes) {
      if (attr.name.startsWith('data-') && !attr.name.startsWith('data-pwx')) {
        const selector = `[${attr.name}="${attr.value}"]`;
        if (document.querySelectorAll(selector).length === 1) {
          return `${attr.name}="${attr.value}"`;
        }
      }
    }
    return null;
  }

  function findUniqueClass(element) {
    if (!element.className || typeof element.className !== 'string') return null;

    const classes = element.className.split(' ').filter(c => c && !c.startsWith('pwx-'));

    for (const cls of classes) {
      if (document.querySelectorAll(`.${cls}`).length === 1) {
        return cls;
      }
    }

    // İki class kombinasyonu dene
    for (let i = 0; i < classes.length; i++) {
      for (let j = i + 1; j < classes.length; j++) {
        const combo = `.${classes[i]}.${classes[j]}`;
        if (document.querySelectorAll(combo).length === 1) {
          return `${classes[i]}.${classes[j]}`;
        }
      }
    }

    return null;
  }

  function buildPath(element, maxDepth = 5) {
    const path = [];
    let current = element;
    let depth = 0;

    while (current && current !== document.body && depth < maxDepth) {
      let segment = current.tagName.toLowerCase();

      // ID varsa kullan ve dur
      if (current.id && !current.id.startsWith('pwx-')) {
        segment = `#${current.id}`;
        path.unshift(segment);
        break;
      }

      // Unique class varsa ekle
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ')
          .filter(c => c && !c.startsWith('pwx-'))
          .slice(0, 2);
        if (classes.length) {
          segment += `.${classes.join('.')}`;
        }
      }

      // nth-child ekle (ebeveyn içindeki pozisyon)
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children);
        const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
        if (sameTagSiblings.length > 1) {
          const index = sameTagSiblings.indexOf(current) + 1;
          segment += `:nth-of-type(${index})`;
        }
      }

      path.unshift(segment);
      current = parent;
      depth++;
    }

    // Path'i test et ve kısalt
    let selector = path.join(' > ');

    // Selector unique mi kontrol et
    try {
      const matches = document.querySelectorAll(selector);
      if (matches.length !== 1) {
        // Daha spesifik path oluştur
        selector = buildSpecificPath(element);
      }
    } catch (e) {
      console.warn('[PWX Selector] Invalid selector:', selector);
    }

    return selector;
  }

  function buildSpecificPath(element) {
    // Daha spesifik bir path oluştur
    const path = [];
    let current = element;

    while (current && current !== document.body && path.length < 6) {
      const parent = current.parentElement;
      if (!parent) break;

      const index = Array.from(parent.children).indexOf(current) + 1;
      const tag = current.tagName.toLowerCase();
      path.unshift(`${tag}:nth-child(${index})`);

      current = parent;
    }

    return path.join(' > ');
  }

  // ========================================
  // Selection Logic
  // ========================================

  function handleClick(e) {
    const target = e.target;

    // UI elementlerine tıklamayı yoksay
    if (target.closest('.pwx-selector-ui') || target.closest('.pwx-selector-confirm')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    selectedElement = target;
    const selector = generateUniqueSelector(target);

    // Highlight'ı güncelle
    highlightOverlay.classList.add('selected');

    // Confirm dialog'u göster
    document.getElementById('pwx-selected-selector').textContent = selector;
    document.querySelector('.pwx-selector-confirm').classList.add('visible');

    // Info güncelle
    const info = uiContainer.querySelector('.pwx-selector-info');
    info.textContent = 'Element seçildi! Onaylayın veya tekrar seçin.';

    console.log('[PWX Selector] Element seçildi:', selector);
  }

  function confirmSelection() {
    if (!selectedElement) return;

    const selector = document.getElementById('pwx-selected-selector').textContent;

    const selectionData = {
      type: 'PWX_SELECTOR_RESULT',
      status: 'selected',
      selector: selector,
      tagName: selectedElement.tagName.toLowerCase(),
      timestamp: Date.now()
    };

    // 1. localStorage'a kaydet (aynı origin için)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      status: 'selected',
      selector: selector,
      tagName: selectedElement.tagName.toLowerCase(),
      timestamp: Date.now()
    }));

    // 2. window.opener'a postMessage gönder (cross-origin için)
    if (window.opener) {
      try {
        window.opener.postMessage(selectionData, '*');
        console.log('[PWX Selector] postMessage gönderildi:', selector);
      } catch (e) {
        console.warn('[PWX Selector] postMessage gönderilemedi:', e);
      }
    }

    console.log('[PWX Selector] Seçim kaydedildi:', selector);

    // Temizle ve bilgi göster
    cleanup();
    showSuccessMessage(selector);
  }

  function resetSelection() {
    selectedElement = null;
    highlightOverlay.classList.remove('selected');
    document.querySelector('.pwx-selector-confirm').classList.remove('visible');

    const info = uiContainer.querySelector('.pwx-selector-info');
    info.textContent = 'Widget yerleştirmek istediğiniz elementi tıklayın';
  }

  function cancel() {
    const cancelData = {
      type: 'PWX_SELECTOR_RESULT',
      status: 'cancelled',
      timestamp: Date.now()
    };

    // 1. localStorage'a kaydet
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      status: 'cancelled',
      timestamp: Date.now()
    }));

    // 2. window.opener'a postMessage gönder
    if (window.opener) {
      try {
        window.opener.postMessage(cancelData, '*');
      } catch (e) {
        console.warn('[PWX Selector] postMessage gönderilemedi:', e);
      }
    }

    cleanup();
    console.log('[PWX Selector] İptal edildi');
  }

  function showSuccessMessage(selector) {
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 32px 48px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 16px 64px rgba(0,0,0,0.2);
      z-index: 2147483647;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    msg.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
      <div style="font-size: 18px; font-weight: 600; color: #059669; margin-bottom: 8px;">
        Seçim Tamamlandı!
      </div>
      <div style="font-size: 14px; color: #6b7280; margin-bottom: 16px;">
        Admin Panel'e dönebilirsiniz.
      </div>
      <code style="display: block; padding: 12px; background: #f3f4f6; border-radius: 8px; font-size: 12px;">
        ${selector}
      </code>
    `;
    document.body.appendChild(msg);

    // 3 saniye sonra kapat
    setTimeout(() => msg.remove(), 3000);
  }

  // ========================================
  // Event Handlers
  // ========================================

  function handleMouseOver(e) {
    if (selectedElement) return; // Seçim yapıldıysa hover'ı durdur
    hoveredElement = e.target;
    highlightElement(e.target);
  }

  function handleMouseOut() {
    if (selectedElement) return;
    highlightOverlay.style.display = 'none';
  }

  // ========================================
  // Cleanup
  // ========================================

  function cleanup() {
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('mouseout', handleMouseOut);
    document.removeEventListener('click', handleClick, true);

    if (uiContainer) uiContainer.remove();
    if (highlightOverlay) highlightOverlay.remove();
    document.querySelector('.pwx-selector-confirm')?.remove();
  }

  // ========================================
  // Initialize
  // ========================================

  function init() {
    createUI();

    // Event listeners
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleClick, true);

    // ESC ile iptal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cancel();
    });
  }

  // DOM hazır olduğunda başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

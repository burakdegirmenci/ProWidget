'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { MousePointer2, ExternalLink, Check, RefreshCw, X } from 'lucide-react';

// ========================================
// Types
// ========================================

interface SelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selector: string) => void;
  customerDomain?: string;
  initialUrl?: string;
}

interface SelectorSession {
  status: 'selecting' | 'selected' | 'cancelled';
  selector?: string;
  tagName?: string;
  timestamp: number;
}

// ========================================
// Constants
// ========================================

const STORAGE_KEY = 'pwx_selector_session';
const POLL_INTERVAL = 500; // ms
const POLL_TIMEOUT = 300000; // 5 dakika

// ========================================
// Component
// ========================================

export function SelectorModal({
  isOpen,
  onClose,
  onSelect,
  customerDomain,
  initialUrl = '',
}: SelectorModalProps) {
  const [targetUrl, setTargetUrl] = useState(initialUrl);
  const [selectedSelector, setSelectedSelector] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal açıldığında state'i resetle
  useEffect(() => {
    if (isOpen) {
      setSelectedSelector(null);
      setIsSelecting(false);
      setError(null);
      // Eski session'ı temizle
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isOpen]);

  // Varsayılan URL'i ayarla
  useEffect(() => {
    if (customerDomain && !targetUrl) {
      setTargetUrl(`https://${customerDomain}`);
    }
  }, [customerDomain, targetUrl]);

  // postMessage dinleyici - cross-origin iletişim için
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // PWX Selector sonucu mu kontrol et
      if (event.data?.type !== 'PWX_SELECTOR_RESULT') return;

      console.log('[SelectorModal] postMessage alındı:', event.data);

      if (event.data.status === 'selected' && event.data.selector) {
        setSelectedSelector(event.data.selector);
        setIsSelecting(false);
      } else if (event.data.status === 'cancelled') {
        setIsSelecting(false);
        setError('Seçim iptal edildi');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // localStorage'ı poll et (aynı origin fallback için)
  const pollForSelection = useCallback(() => {
    let pollCount = 0;
    const maxPolls = POLL_TIMEOUT / POLL_INTERVAL;

    const interval = setInterval(() => {
      pollCount++;

      try {
        const sessionData = localStorage.getItem(STORAGE_KEY);
        if (!sessionData) return;

        const session: SelectorSession = JSON.parse(sessionData);

        if (session.status === 'selected' && session.selector) {
          setSelectedSelector(session.selector);
          setIsSelecting(false);
          clearInterval(interval);
        } else if (session.status === 'cancelled') {
          setIsSelecting(false);
          setError('Seçim iptal edildi');
          clearInterval(interval);
        }
      } catch (e) {
        console.error('[SelectorModal] Poll error:', e);
      }

      // Timeout
      if (pollCount >= maxPolls) {
        setIsSelecting(false);
        setError('Zaman aşımı - Lütfen tekrar deneyin');
        clearInterval(interval);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Seçimi başlat
  const startSelection = useCallback(() => {
    if (!targetUrl) {
      setError('Lütfen bir URL girin');
      return;
    }

    // URL'i validate et
    let url: URL;
    try {
      url = new URL(targetUrl);
    } catch {
      setError('Geçerli bir URL girin (https://...)');
      return;
    }

    setError(null);
    setSelectedSelector(null);

    // localStorage'a session yaz (aynı origin fallback için)
    const session: SelectorSession = {
      status: 'selecting',
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    // URL'e pwx_select parametresi ekle
    url.searchParams.set('pwx_select', '1');

    // Yeni tab'da aç
    window.open(url.toString(), '_blank');

    setIsSelecting(true);

    // Poll başlat (aynı origin fallback)
    pollForSelection();
  }, [targetUrl, pollForSelection]);

  // Seçimi onayla
  const confirmSelection = useCallback(() => {
    if (selectedSelector) {
      onSelect(selectedSelector);
      onClose();
    }
  }, [selectedSelector, onSelect, onClose]);

  // Tekrar seç
  const resetSelection = useCallback(() => {
    setSelectedSelector(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Modal kapanırken temizle
  const handleClose = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Widget Yerleşimi Seç"
      description="Müşteri sitesinde widget'ın yerleşeceği elementi seçin"
      size="lg"
    >
      <div className="space-y-6">
        {/* URL Input */}
        <div>
          <Input
            label="Hedef Sayfa URL"
            value={targetUrl}
            onChange={(e) => {
              setTargetUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://example.com/sepet"
            error={error || undefined}
            disabled={isSelecting}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Widget eklemek istediğiniz sayfanın tam URL&apos;ini girin
          </p>
        </div>

        {/* Selection Status */}
        {isSelecting && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <Spinner size="sm" />
              <div>
                <p className="font-medium text-blue-900">Seçim Bekleniyor...</p>
                <p className="text-sm text-blue-700">
                  Açılan sayfada widget&apos;ın yerleşeceği elementi tıklayın.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selected Selector */}
        {selectedSelector && !isSelecting && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                <Check className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-900">Element Seçildi!</p>
                <code className="mt-2 block rounded bg-white px-3 py-2 font-mono text-sm text-green-800">
                  {selectedSelector}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isSelecting && !selectedSelector && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 font-medium text-gray-900">Nasıl Çalışır?</h4>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                  1
                </span>
                <span>Yukarıya müşteri sitesinin URL&apos;ini girin</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                  2
                </span>
                <span>&quot;Sayfayı Aç&quot; butonuna tıklayın</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                  3
                </span>
                <span>Açılan sayfada widget&apos;ın yerleşeceği alana tıklayın</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                  4
                </span>
                <span>Seçimi onaylayın ve bu modala dönün</span>
              </li>
            </ol>
            <div className="mt-4 flex items-center gap-2 rounded bg-amber-100 px-3 py-2 text-xs text-amber-800">
              <MousePointer2 className="h-4 w-4" />
              <span>
                <strong>Not:</strong> Müşteri sitesinde PWX embed kodu yüklü olmalıdır.
              </span>
            </div>
          </div>
        )}
      </div>

      <ModalFooter>
        {selectedSelector ? (
          <>
            <Button variant="ghost" onClick={resetSelection}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tekrar Seç
            </Button>
            <Button onClick={confirmSelection}>
              <Check className="mr-2 h-4 w-4" />
              Bu Selector&apos;ı Kullan
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose}>
              <X className="mr-2 h-4 w-4" />
              İptal
            </Button>
            <Button onClick={startSelection} disabled={isSelecting || !targetUrl}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {isSelecting ? 'Bekleniyor...' : 'Sayfayı Aç ve Seç'}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}

export default SelectorModal;

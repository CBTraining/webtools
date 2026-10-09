import { useEffect, useCallback } from 'react';
import { isImageFile } from '../utils/fileTypes';
import { isGifBlob, processHtmlPaste } from '../utils/clipboardExtract';

/**
 * Custom hook for managing global clipboard paste events (images, animated GIFs, Google Docs/Slides assets, data URIs).
 * 
 * @param {Object} options
 * @param {Function} options.onImageExtracted Callback when an image/gif blob is successfully extracted: (blob, filename, isGif) => void
 * @param {Function} options.onToast Callback to show a user-facing toast message: (msg, type) => void
 */
export function useGlobalClipboard({ onImageExtracted, onToast }) {
  const processImageBlob = useCallback(async (blob, defaultName = 'clipboard_image') => {
    if (!blob) return;

    let isGif = false;
    try {
      isGif = await isGifBlob(blob);
    } catch (e) {
      console.warn("GIF check failed:", e);
    }

    const cleanName = defaultName ? defaultName.replace(/\.(png|gif|jpe?g|webp|bmp|svg)$/i, '') : 'clipboard_image';
    const targetType = isGif ? 'gif' : 'png';
    const filename = `${cleanName}.${targetType}`;

    if (onImageExtracted) {
      onImageExtracted(blob, filename, targetType);
    }
  }, [onImageExtracted]);

  // Global paste event listener
  useEffect(() => {
    const handlePaste = async (e) => {
      // Don't intercept paste when typing in inputs/textareas/contenteditable
      if (
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.isContentEditable ||
        e.target.closest('input') ||
        e.target.closest('textarea') ||
        e.target.closest('[contenteditable="true"]')
      ) {
        return;
      }

      const clipboardData = e.clipboardData || e.originalEvent?.clipboardData;
      if (!clipboardData) return;

      // 1. Direct files check (handles files copied from Windows Explorer / Desktop or dropped)
      if (clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (isImageFile(file) || file.type.startsWith('image/')) {
            e.preventDefault();
            processImageBlob(file, file.name);
            return;
          }
        }
      }

      // 2. Synchronously extract direct image item & html/text items
      const items = clipboardData.items;
      let directImageFile = null;
      let htmlItem = null;
      let textItem = null;

      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            directImageFile = item.getAsFile();
          } else if (item.type === 'text/html') {
            htmlItem = item;
          } else if (item.type === 'text/plain') {
            textItem = item;
          }
        }
      }

      // 3. If direct image is present
      if (directImageFile) {
        e.preventDefault();

        // If Google Slides HTML is also present, try to extract original GIF/asset from Google CDN
        if (htmlItem) {
          htmlItem.getAsString(async (html) => {
            if (html && (html.includes('googleusercontent.com') || html.includes('docs.google.com'))) {
              const res = await processHtmlPaste(html, processImageBlob);
              if (res?.success) return;
            }
            processImageBlob(directImageFile);
          });
          return;
        }

        processImageBlob(directImageFile);
        return;
      }

      // 4. No direct image blob, but HTML item exists (e.g. copied from web without binary image)
      if (htmlItem) {
        e.preventDefault();
        htmlItem.getAsString(async (html) => {
          const res = await processHtmlPaste(html, processImageBlob);
          if (!res?.success) {
            onToast?.("No image could be extracted from copied content.");
            window.dispatchEvent(new Event('paste-error'));
          }
        });
        return;
      }

      // 5. Plain text fallback: data URI or direct image URL
      if (textItem) {
        textItem.getAsString(async (text) => {
          if (text) {
            const trimmed = text.trim();
            if (trimmed.startsWith('data:image/')) {
              e.preventDefault();
              try {
                const resp = await fetch(trimmed);
                const b = await resp.blob();
                processImageBlob(b, 'pasted_data_uri');
                return;
              } catch (err) {
                console.warn("Failed to parse data URI:", err);
              }
            } else if (/^https?:\/\/.*\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(trimmed)) {
              e.preventDefault();
              const res = await processHtmlPaste(`<img src="${trimmed}" />`, processImageBlob);
              if (res?.success) return;
            }
          }
          window.dispatchEvent(new Event('paste-error'));
        });
        return;
      }

      window.dispatchEvent(new Event('paste-error'));
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processImageBlob, onToast]);

  // Explicit manual paste trigger (e.g. from Sidebar button)
  const handleManualPaste = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();

        for (const clipboardItem of clipboardItems) {
          const imageType = clipboardItem.types.find(t => t.startsWith('image/'));
          const hasHtml = clipboardItem.types.includes('text/html');

          if (hasHtml) {
            try {
              const htmlBlob = await clipboardItem.getType('text/html');
              const html = await htmlBlob.text();
              if (html && (html.includes('googleusercontent.com') || html.includes('docs.google.com'))) {
                const res = await processHtmlPaste(html, processImageBlob);
                if (res?.success) return;
              }
            } catch (e) {
              console.warn("HTML read failed:", e);
            }
          }

          if (imageType) {
            const blob = await clipboardItem.getType(imageType);
            if (blob) {
              processImageBlob(blob);
              return;
            }
          }

          if (hasHtml) {
            try {
              const htmlBlob = await clipboardItem.getType('text/html');
              const html = await htmlBlob.text();
              const res = await processHtmlPaste(html, processImageBlob);
              if (res?.success) return;
            } catch (e) {
              console.warn("HTML fallback failed:", e);
            }
          }
        }
      }

      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const trimmed = text.trim();
          if (trimmed.startsWith('data:image/')) {
            const resp = await fetch(trimmed);
            const b = await resp.blob();
            processImageBlob(b, 'pasted_data_uri');
            return;
          }
          if (/^https?:\/\/.*\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(trimmed)) {
            const res = await processHtmlPaste(`<img src="${trimmed}" />`, processImageBlob);
            if (res?.success) return;
          }
        }
      }

      onToast?.("No image found on clipboard. Copy an image or screenshot first!");
      window.dispatchEvent(new Event('paste-error'));
    } catch (err) {
      console.warn("Clipboard API failed:", err);
      onToast?.("Clipboard access blocked by browser. Please use Ctrl+V instead!");
      window.dispatchEvent(new Event('paste-error'));
    }
  }, [processImageBlob, onToast]);

  return {
    processImageBlob,
    handleManualPaste
  };
}

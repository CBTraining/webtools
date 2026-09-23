// Check magic bytes for GIF (GIF87a or GIF89a)
export async function isGifBlob(blob) {
  if (!blob) return false;
  if (blob.type === 'image/gif') return true;
  if (blob.size >= 6) {
    try {
      const buffer = await blob.slice(0, 6).arrayBuffer();
      const header = new TextDecoder().decode(buffer);
      if (header.startsWith('GIF8')) return true;
    } catch (e) {
      // ignore
    }
  }
  return false;
}

export function loadImageFallback(url, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => {
      img.src = '';
      reject(new Error('Image fallback timeout'));
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 800;
        canvas.height = img.height || 600;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Image failed to load crossOrigin'));
    };
    img.src = url;
  });
}

export async function fetchDirectBlob(url, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) throw new Error(`Fetch status: ${resp.status}`);
    const b = await resp.blob();
    if (!b || b.size < 10) throw new Error('Empty blob');
    return b;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export async function processHtmlPaste(html, onImageBlob) {
  try {
    let src = null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Try standard img tag
    const imgs = doc.querySelectorAll('img');
    for (let i = 0; i < imgs.length; i++) {
      if (imgs[i].src && imgs[i].src.startsWith('http')) {
        src = imgs[i].src;
        break;
      }
      if (imgs[i].src && imgs[i].src.startsWith('data:image')) {
        src = imgs[i].src;
        break;
      }
    }

    // 2. Try SVG image tag
    if (!src) {
      const svgImgs = doc.querySelectorAll('image');
      for (let i = 0; i < svgImgs.length; i++) {
        const href = svgImgs[i].getAttribute('href') || svgImgs[i].getAttribute('xlink:href');
        if (href) {
          src = href;
          break;
        }
      }
    }

    // 3. Clean Regex fallback for strictly valid base64 characters
    if (!src) {
      const dataUriRegex = /(data:image\/[^;"'\s]+;base64,[a-zA-Z0-9+/=]+)/i;
      const match = html.match(dataUriRegex);
      if (match) src = match[1];
    }

    // 4. Look for raw google content URLs
    if (!src) {
      const urlRegex = /(https:\/\/[a-zA-Z0-9-]+\.googleusercontent\.com\/[^"'\s]+)/i;
      const match = html.match(urlRegex);
      if (match) src = match[1];
    }

    if (!src) {
      return { success: false, error: 'No image source found in HTML.' };
    }

    // Handle Data URIs directly
    if (src.startsWith('data:image/')) {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error('Fetch response not ok');
        const blob = await response.blob();
        onImageBlob(blob, src.startsWith('data:image/gif') ? 'pasted_animation' : 'clipboard_image');
        return { success: true };
      } catch (err) {
        // Fallback manual base64 parsing if fetch fails
        try {
          const arr = src.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          let b64Data = arr[1].replace(/[\s\r\n]+/g, '').replace(/&quot;/g, '').replace(/&amp;/g, '&');
          if (b64Data.endsWith('"') || b64Data.endsWith("'")) b64Data = b64Data.slice(0, -1);

          const bstr = atob(b64Data);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          onImageBlob(blob, mime === 'image/gif' ? 'pasted_animation' : 'clipboard_image');
          return { success: true };
        } catch (manualErr) {
          return { success: false, error: `atob failed: ${manualErr.message}. Src len: ${src.length}` };
        }
      }
    }

    // Handle URLs (like lh3.googleusercontent.com from Google Slides)
    // Normalize Google User Content URLs to =s0 so Google returns raw original uploaded asset
    let targetUrl = src;
    if (/googleusercontent\.com/i.test(src)) {
      if (/=[swh]\d+/i.test(src)) {
        targetUrl = src.replace(/=[swh]\d+.*$/i, '=s0');
      } else if (!src.includes('=')) {
        targetUrl = `${src}=s0`;
      }
    }

    // 1. Try Direct Raw Fetch on normalized URL (Preserves GIFs)
    try {
      const rawBlob = await fetchDirectBlob(targetUrl);
      onImageBlob(rawBlob, 'google_slides_image');
      return { success: true };
    } catch (eDirect) {
      // 2. Try Codetabs CORS Proxy Raw Fetch (Fastest CORS proxy for images)
      try {
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
        const rawBlob = await fetchDirectBlob(proxyUrl);
        onImageBlob(rawBlob, 'google_slides_image');
        return { success: true };
      } catch (eProxy0) {
        // 3. Try AllOrigins CORS Proxy Raw Fetch
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
          const rawBlob = await fetchDirectBlob(proxyUrl);
          onImageBlob(rawBlob, 'google_slides_image');
          return { success: true };
        } catch (eProxy1) {
          // 4. Try CorsProxy.io Raw Fetch
          try {
            const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
            const rawBlob = await fetchDirectBlob(proxyUrl2);
            onImageBlob(rawBlob, 'google_slides_image');
            return { success: true };
          } catch (eProxy2) {
            // 5. Final Fallback: Canvas DOM image load
            try {
              const fallbackBlob = await loadImageFallback(targetUrl);
              onImageBlob(fallbackBlob, 'google_slides_image');
              return { success: true };
            } catch (eFinal) {
              return { success: false, error: 'Network fetch blocked by CORS on all proxies.' };
            }
          }
        }
      }
    }
  } catch (err) {
    return { success: false, error: 'Fatal extractor error: ' + err.message };
  }
}

export const PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

const DANGEROUS_SVG_TAGS = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'applet',
  'meta',
  'link',
  'base',
  'form',
  'input',
  'button',
  'textarea',
  'set',
  'animate',
  'animatetransform',
  'animatemotion'
]);

/**
 * Validates that a target URL uses HTTP(S) and does not point to loopback, link-local, or private network hosts (SSRF mitigation).
 */
export function validateExternalUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Please provide a valid URL.');
  }
  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Invalid URL format.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are allowed.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs with embedded credentials are not allowed.');
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '0:0:0:0:0:0:0:1' ||
    /^fe[89ab][0-9a-f]:/i.test(host) ||
    /^f[cd][0-9a-f]{2}:/i.test(host) ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    throw new Error('Requests to local, private, or internal network addresses are blocked.');
  }
  return parsed.href;
}

/**
 * Sanitizes an SVG DOM element in place by stripping executable elements, event handlers, and unsafe URI schemes.
 */
export function sanitizeSvgElement(svgRoot) {
  if (!svgRoot) return;
  const allNodes = [svgRoot, ...svgRoot.querySelectorAll('*')];
  for (const el of allNodes) {
    const tag = (el.tagName || el.nodeName || '').toLowerCase();
    if (DANGEROUS_SVG_TAGS.has(tag)) {
      el.remove();
      continue;
    }
    if (!el.attributes) continue;
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      // eslint-disable-next-line no-control-regex
      const normalizedVal = (attr.value || '').replace(/[\x00-\x20]+/g, '').toLowerCase();
      if (
        name.startsWith('on') ||
        ((name === 'href' || name === 'xlink:href' || name === 'src' || name === 'action' || name === 'formaction') &&
          (normalizedVal.startsWith('javascript:') || normalizedVal.startsWith('vbscript:') || normalizedVal.startsWith('data:'))) ||
        (name === 'style' && (/expression\s*\(|javascript\s*:|vbscript\s*:|-moz-binding/i.test(normalizedVal)))
      ) {
        el.removeAttribute(attr.name);
      }
    }
  }
}

/**
 * Sanitizes a raw SVG markup string into safe SVG markup.
 */
export function sanitizeSvgMarkup(svgString) {
  if (!svgString || typeof svgString !== 'string') return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg || doc.querySelector('parsererror')) {
      return '';
    }
    sanitizeSvgElement(svg);
    return svg.outerHTML;
  } catch {
    return '';
  }
}

function sanitizeAssetFilename(name, fallback) {
  if (!name || typeof name !== 'string') return fallback;
  // eslint-disable-next-line no-control-regex
  const cleaned = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\.+/g, '.').replace(/^\.+|\.+$/g, '').trim();
  return cleaned.slice(0, 120) || fallback;
}

// Helper to resolve relative URLs against base URL safely
export function resolveUrl(relativeUrl, baseUrl) {
  if (!relativeUrl || typeof relativeUrl !== 'string') return '';
  const trimmed = relativeUrl.trim();
  // eslint-disable-next-line no-control-regex
  const compact = trimmed.replace(/[\x00-\x20]+/g, '').toLowerCase();
  if (compact.startsWith('javascript:') || compact.startsWith('vbscript:') || compact.startsWith('file:')) {
    return '';
  }
  if (compact.startsWith('data:')) {
    return /^data:image\/(png|jpe?g|gif|webp|bmp|x-icon|vnd\.microsoft\.icon);/i.test(trimmed) ? trimmed : '';
  }
  try {
    const resolved = new URL(trimmed, baseUrl);
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return '';
    }
    return resolved.href;
  } catch {
    return '';
  }
}

// Sample websites for quick testing
export const SAMPLE_SITES = [
  { name: 'Gemini', url: 'https://gemini.google/about/' },
  { name: 'Googlebook', url: 'https://googlebook.com' },
  { name: 'Android', url: 'https://www.android.com/' }
];

/**
 * Fetches HTML from a target URL, trying direct fetch and falling back to CORS proxies.
 */
export async function fetchHtmlWithProxies(formattedUrl, onStatus) {
  const safeTargetUrl = validateExternalUrl(formattedUrl);
  let htmlText = '';
  let fetchSuccess = false;

  // Try direct fetch first
  try {
    if (onStatus) onStatus('Working...');
    const res = await fetch(safeTargetUrl, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (res.ok) {
      htmlText = await res.text();
      fetchSuccess = true;
    }
  } catch {
    console.warn("Direct fetch CORS blocked, attempting proxy fallbacks...");
  }

  // Try CORS proxy fallbacks if direct fetch failed
  if (!fetchSuccess) {
    for (let i = 0; i < PROXIES.length; i++) {
      try {
        if (onStatus) onStatus('Working...');
        const proxyUrl = PROXIES[i](safeTargetUrl);
        const res = await fetch(proxyUrl, { credentials: 'omit', referrerPolicy: 'no-referrer' });
        if (res.ok) {
          htmlText = await res.text();
          fetchSuccess = true;
          break;
        }
      } catch (err) {
        console.warn(`Proxy ${i + 1} failed:`, err);
      }
    }
  }

  if (!fetchSuccess || !htmlText) {
    throw new Error('Failed to load website. The website may be blocking automated requests or offline.');
  }

  return htmlText;
}

/**
 * Parses raw HTML string and extracts all inline SVGs, images, CSS backgrounds, videos, favicons, and Lottie animations.
 */
export function extractAssetsFromHtml(htmlText, baseUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const extractedList = [];
  const seenUrls = new Set();

  // 1. Extract Inline <svg> Elements
  const svgElements = doc.querySelectorAll('svg');
  svgElements.forEach((svg, index) => {
    const clone = svg.cloneNode(true);
    sanitizeSvgElement(clone);
    if (!clone.getAttribute('xmlns')) {
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    
    // Ensure SVG has proper dimensions / viewBox so it renders sharply
    if (!clone.getAttribute('viewBox')) {
      const w = parseInt(clone.getAttribute('width')) || 100;
      const h = parseInt(clone.getAttribute('height')) || 100;
      clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }

    clone.style.width = '100%';
    clone.style.height = '100%';
    clone.style.maxHeight = '120px';

    const svgString = clone.outerHTML;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const blobUrl = URL.createObjectURL(blob);

    extractedList.push({
      id: `svg-inline-${index}`,
      type: 'svg',
      name: `vector_icon_${index + 1}.svg`,
      url: blobUrl,
      rawSvg: svgString,
      source: 'Inline SVG Vector'
    });
  });

  // 2. Extract <img> Tags (src, srcset, data-src)
  const imgElements = doc.querySelectorAll('img, picture source');
  imgElements.forEach((img, index) => {
    let src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('srcset');
    if (src) {
      if (src.includes(' ')) src = src.split(' ')[0];
      const fullUrl = resolveUrl(src, baseUrl);
      if (fullUrl && !seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        const ext = fullUrl.split('.').pop().split('?')[0].toLowerCase();
        const isSvg = ext === 'svg' || fullUrl.includes('.svg');
        const isLottie = ext === 'json' || fullUrl.includes('lottie');

        extractedList.push({
          id: `img-${index}`,
          type: isSvg ? 'svg' : isLottie ? 'lottie' : 'image',
          name: sanitizeAssetFilename(fullUrl.split('/').pop().split('?')[0], `image_${index + 1}.${ext || 'png'}`),
          url: fullUrl,
          source: `<img> tag (${ext.toUpperCase() || 'Image'})`,
          extension: ext
        });
      }
    }
  });

  // 3. Extract CSS Background Images
  const allElements = doc.querySelectorAll('*[style*="background"]');
  allElements.forEach((el, index) => {
    const style = el.getAttribute('style') || '';
    const match = style.match(/url\(['"]?(.*?)['"]?\)/i);
    if (match && match[1]) {
      const fullUrl = resolveUrl(match[1], baseUrl);
      if (fullUrl && !seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        const ext = fullUrl.split('.').pop().split('?')[0].toLowerCase();
        extractedList.push({
          id: `bg-${index}`,
          type: ext === 'svg' ? 'svg' : 'image',
          name: sanitizeAssetFilename(fullUrl.split('/').pop().split('?')[0], `bg_image_${index + 1}.${ext || 'png'}`),
          url: fullUrl,
          source: 'CSS Background Image'
        });
      }
    }
  });

  // 4. Extract <video> & <source> Media
  const videoElements = doc.querySelectorAll('video, video source');
  videoElements.forEach((vid, index) => {
    const src = vid.getAttribute('src');
    if (src) {
      const fullUrl = resolveUrl(src, baseUrl);
      if (fullUrl && !seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        extractedList.push({
          id: `video-${index}`,
          type: 'video',
          name: sanitizeAssetFilename(fullUrl.split('/').pop().split('?')[0], `video_clip_${index + 1}.mp4`),
          url: fullUrl,
          source: '<video> Stream'
        });
      }
    }
  });

  // 5. Extract Favicons & App Icons
  const iconLinks = doc.querySelectorAll('link[rel*="icon"], link[rel*="apple-touch-icon"]');
  iconLinks.forEach((link, index) => {
    const href = link.getAttribute('href');
    if (href) {
      const fullUrl = resolveUrl(href, baseUrl);
      if (fullUrl && !seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        extractedList.push({
          id: `icon-${index}`,
          type: 'icon',
          name: sanitizeAssetFilename(fullUrl.split('/').pop().split('?')[0], `favicon_${index + 1}.ico`),
          url: fullUrl,
          source: 'Favicon / Website Icon'
        });
      }
    }
  });

  // 6. Extract Lottie Animation Scripts / URLs
  const scripts = doc.querySelectorAll('script, lottie-player');
  scripts.forEach((scr, index) => {
    const src = scr.getAttribute('src') || scr.getAttribute('path') || scr.getAttribute('data-animation-path');
    if (src && (src.endsWith('.json') || src.includes('lottie'))) {
      const fullUrl = resolveUrl(src, baseUrl);
      if (fullUrl && !seenUrls.has(fullUrl)) {
        seenUrls.add(fullUrl);
        extractedList.push({
          id: `lottie-${index}`,
          type: 'lottie',
          name: sanitizeAssetFilename(fullUrl.split('/').pop().split('?')[0], `lottie_animation_${index + 1}.json`),
          url: fullUrl,
          source: 'Lottie JSON Animation'
        });
      }
    }
  });

  return extractedList;
}

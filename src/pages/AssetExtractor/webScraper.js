export const PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

// Helper to resolve relative URLs against base URL
export function resolveUrl(relativeUrl, baseUrl) {
  if (!relativeUrl) return '';
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch {
    return relativeUrl;
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
  let htmlText = '';
  let fetchSuccess = false;

  // Try direct fetch first
  try {
    if (onStatus) onStatus('Working...');
    const res = await fetch(formattedUrl);
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
        const proxyUrl = PROXIES[i](formattedUrl);
        const res = await fetch(proxyUrl);
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
          name: fullUrl.split('/').pop().split('?')[0] || `image_${index + 1}.${ext || 'png'}`,
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
          name: fullUrl.split('/').pop().split('?')[0] || `bg_image_${index + 1}.${ext || 'png'}`,
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
          name: fullUrl.split('/').pop().split('?')[0] || `video_clip_${index + 1}.mp4`,
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
          name: fullUrl.split('/').pop().split('?')[0] || `favicon_${index + 1}.ico`,
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
          name: fullUrl.split('/').pop().split('?')[0] || `lottie_animation_${index + 1}.json`,
          url: fullUrl,
          source: 'Lottie JSON Animation'
        });
      }
    }
  });

  return extractedList;
}

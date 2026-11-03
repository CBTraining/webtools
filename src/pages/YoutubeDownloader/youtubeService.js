// Reliable YouTube metadata and adaptive stream resolver using CORS-enabled Invidious & Companion endpoints

export const COMPANION_HOSTS = [
  'https://yt-comp1.chocolatemoo53.com',
  'https://yt-comp2.chocolatemoo53.com',
  'https://yt-comp3.chocolatemoo53.com',
  'https://yt-comp4.chocolatemoo53.com',
  'https://yt-comp5.chocolatemoo53.com',
  'https://yt-comp6.chocolatemoo53.com'
];

export const INVIDIOUS_API_BASES = [
  'https://yt.chocolatemoo53.com'
];

export const SAMPLE_YOUTUBE_VIDEOS = [
  {
    name: 'Blender Open Movie (Spring)',
    url: 'https://www.youtube.com/watch?v=WhWc3b3KhnY'
  },
  {
    name: 'NASA Perseverance Rover',
    url: 'https://www.youtube.com/watch?v=4czjS9h4Fpg'
  },
  {
    name: 'Rick Astley (1080p Remaster)',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  }
];

/**
 * Extracts the 11-character YouTube video ID from any valid YouTube link or raw ID.
 * @param {string} input
 * @returns {string|null}
 */
export function extractYouTubeVideoId(input) {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|live\/|watch\?v=|&v=)([a-zA-Z0-9_-]{11}).*/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

/**
 * Formats seconds into M:SS or H:MM:SS.
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatDuration(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Parses a timestamp string ("MM:SS", "HH:MM:SS", or seconds) into seconds.
 * @param {string|number} str
 * @returns {number|null}
 */
export function parseTimestampToSeconds(str) {
  if (str === null || str === undefined || str === '') return null;
  const clean = String(str).trim();
  if (!clean) return null;
  if (/^\d+(\.\d+)?$/.test(clean)) {
    return parseFloat(clean);
  }
  const parts = clean.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return null;
}

/**
 * Sanitizes a video title into a clean filename base.
 * @param {string} title
 * @returns {string}
 */
export function sanitizeFilename(title) {
  if (!title) return 'youtube_video';
  return (
    title
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 90) || 'youtube_video'
  );
}

/**
 * Builds the companion stream proxy URL for a given videoId and itag.
 * Strictly validates videoId, itag, and allowed HTTPS host origin.
 * @param {string} companionHost
 * @param {string} videoId
 * @param {string|number} itag
 * @returns {string}
 */
export function buildCompanionStreamUrl(companionHost, videoId, itag) {
  if (!/^[a-zA-Z0-9_-]{11}$/.test(String(videoId || ''))) {
    throw new Error('Invalid YouTube video ID.');
  }
  if (!/^\d{1,4}$/.test(String(itag || ''))) {
    throw new Error('Invalid stream format tag.');
  }
  const host = String(companionHost || '').replace(/\/$/, '');
  if (!COMPANION_HOSTS.includes(host)) {
    throw new Error('Untrusted stream companion host.');
  }
  return `${host}/companion/latest_version?id=${encodeURIComponent(videoId)}&itag=${encodeURIComponent(itag)}&local=true`;
}

/**
 * Normalizes Invidious adaptiveFormats into structured video and audio options,
 * prioritizing H.264 MP4 streams so FFmpeg can losslessly mux (-c copy) at 1080p in ~1s.
 */
function parseAdaptiveFormats(adaptiveFormats = [], companionHosts = COMPANION_HOSTS) {
  const videoFormats = [];
  const audioFormats = [];

  for (const fmt of adaptiveFormats) {
    const itag = String(fmt.itag || '');
    const type = (fmt.type || '').toLowerCase();
    const container = (fmt.container || '').toLowerCase();
    const clen = Number(fmt.clen) || 0;
    const bitrate = Number(fmt.bitrate) || 0;

    if (type.startsWith('audio/') || fmt.audioQuality) {
      const isM4a = container === 'm4a' || type.includes('audio/mp4');
      audioFormats.push({
        itag,
        container: isM4a ? 'm4a' : container || 'webm',
        codec: fmt.encoding || (isM4a ? 'aac' : 'opus'),
        bitrate,
        clen,
        audioQuality: fmt.audioQuality || 'AUDIO_QUALITY_MEDIUM',
        audioSampleRate: Number(fmt.audioSampleRate) || 44100,
        isM4a
      });
    } else if (type.startsWith('video/') || fmt.qualityLabel || fmt.resolution) {
      const isMp4 = container === 'mp4' || type.includes('video/mp4');
      const isH264 = (fmt.encoding || '').toLowerCase().includes('h264') || type.includes('avc1');
      const resMatch = (fmt.qualityLabel || fmt.resolution || '').match(/(\d{3,4})p/);
      const height = resMatch ? parseInt(resMatch[1], 10) : 0;
      const fps = Number(fmt.fps) || 30;

      if (height > 0) {
        videoFormats.push({
          itag,
          height,
          qualityLabel: fmt.qualityLabel || `${height}p`,
          resolution: fmt.resolution || `${height}p`,
          size: fmt.size || '',
          fps,
          container: isMp4 ? 'mp4' : container || 'webm',
          codec: isH264 ? 'H.264' : (fmt.encoding || '').includes('av01') || type.includes('av01') ? 'AV1' : 'VP9',
          isH264,
          isMp4,
          bitrate,
          clen
        });
      }
    }
  }

  // Pick best M4A AAC audio stream (itag 140 preferred for lossless MP4 muxing)
  audioFormats.sort((a, b) => {
    if (a.itag === '140') return -1;
    if (b.itag === '140') return 1;
    if (a.isM4a !== b.isM4a) return a.isM4a ? -1 : 1;
    return b.bitrate - a.bitrate;
  });

  const bestAudio = audioFormats[0] || {
    itag: '140',
    container: 'm4a',
    codec: 'aac',
    bitrate: 130000,
    clen: 0,
    isM4a: true
  };

  // Deduplicate video formats by height, strongly preferring H.264 MP4 for universal playback & instant stream copy
  const byHeight = new Map();
  for (const vf of videoFormats) {
    const existing = byHeight.get(vf.height);
    if (!existing) {
      byHeight.set(vf.height, vf);
      continue;
    }
    // Score candidate: H.264 MP4 > MP4 > higher FPS > higher bitrate
    const score = (item) =>
      (item.isH264 && item.isMp4 ? 1000 : 0) +
      (item.isMp4 ? 200 : 0) +
      (item.fps >= 50 ? 50 : 0) +
      item.bitrate / 1e6;

    if (score(vf) > score(existing)) {
      byHeight.set(vf.height, vf);
    }
  }

  // Sort resolutions descending (e.g., 2160p, 1440p, 1080p, 720p, 480p, 360p, 240p, 144p)
  const uniqueVideoOptions = Array.from(byHeight.values())
    .sort((a, b) => b.height - a.height)
    .map((vf) => ({
      ...vf,
      id: `video-${vf.height}p`,
      totalEstimatedBytes: vf.clen && bestAudio.clen ? vf.clen + bestAudio.clen : vf.clen || 0
    }));

  // Ensure standard H.264 fallback options exist if adaptiveFormats was sparse
  if (uniqueVideoOptions.length === 0) {
    const fallbackPresets = [
      { itag: '137', height: 1080, qualityLabel: '1080p', codec: 'H.264', isH264: true, isMp4: true, container: 'mp4', fps: 30 },
      { itag: '136', height: 720, qualityLabel: '720p', codec: 'H.264', isH264: true, isMp4: true, container: 'mp4', fps: 30 },
      { itag: '135', height: 480, qualityLabel: '480p', codec: 'H.264', isH264: true, isMp4: true, container: 'mp4', fps: 30 },
      { itag: '134', height: 360, qualityLabel: '360p', codec: 'H.264', isH264: true, isMp4: true, container: 'mp4', fps: 30 }
    ];
    for (const preset of fallbackPresets) {
      uniqueVideoOptions.push({
        ...preset,
        id: `video-${preset.height}p`,
        totalEstimatedBytes: 0
      });
    }
  }

  return {
    videoOptions: uniqueVideoOptions,
    bestAudio,
    audioOptions: audioFormats,
    companionHosts
  };
}

/**
 * Fetches full metadata and available 1080p/HD stream formats for a YouTube video.
 * @param {string} urlOrId
 * @returns {Promise<object>}
 */
export async function fetchYouTubeVideoInfo(urlOrId) {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) {
    throw new Error('Invalid YouTube URL. Please paste a valid youtube.com/watch?v=... or youtu.be/... link.');
  }

  // Try Invidious JSON API endpoints
  const bases = [...INVIDIOUS_API_BASES];

  for (const base of bases) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(`${base}/api/v1/videos/${videoId}`, {
        signal: ctrl.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data && (data.title || data.adaptiveFormats)) {
          const { videoOptions, bestAudio, companionHosts } = parseAdaptiveFormats(
            data.adaptiveFormats || [],
            COMPANION_HOSTS
          );

          return {
            videoId,
            title: data.title || `YouTube Video (${videoId})`,
            author: data.author || 'YouTube Creator',
            lengthSeconds: Number(data.lengthSeconds) || 0,
            viewCount: Number(data.viewCount) || 0,
            publishedText: data.publishedText || '',
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            fallbackThumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            videoOptions,
            bestAudio,
            companionHosts
          };
        }
      }
    } catch (err) {
      console.warn(`Invidious API ${base} failed:`, err);
    }
  }

  // Fallback: fetch basic metadata from noembed.com + use standard companion itags (137=1080p, 136=720p, 135=480p, 134=360p, 140=m4a)
  let title = `YouTube Video (${videoId})`;
  let author = 'YouTube';
  try {
    const oembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`, {
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    });
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      if (oembed.title) title = oembed.title;
      if (oembed.author_name) author = oembed.author_name;
    }
  } catch {
    // ignore noembed fallback error
  }

  const { videoOptions, bestAudio, companionHosts } = parseAdaptiveFormats([], COMPANION_HOSTS);

  return {
    videoId,
    title,
    author,
    lengthSeconds: 0,
    viewCount: 0,
    publishedText: '',
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    fallbackThumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    videoOptions,
    bestAudio,
    companionHosts
  };
}

/**
 * Downloads a specific YouTube stream (by videoId and itag) into a Uint8Array with live progress,
 * automatically failing over across companion hosts if one is busy.
 *
 * @param {object} params
 * @param {string} params.videoId
 * @param {string|number} params.itag
 * @param {number} [params.expectedBytes]
 * @param {string[]} [params.companionHosts]
 * @param {AbortSignal} [params.signal]
 * @param {(info: { loadedBytes: number, totalBytes: number, percent: number }) => void} [params.onProgress]
 * @returns {Promise<Uint8Array>}
 */
export async function downloadItagStream({
  videoId,
  itag,
  expectedBytes = 0,
  companionHosts = COMPANION_HOSTS,
  signal,
  onProgress
}) {
  let lastError = null;

  for (let i = 0; i < companionHosts.length; i++) {
    if (signal?.aborted) {
      throw new DOMException('Download cancelled by user', 'AbortError');
    }

    const host = companionHosts[i];
    const url = buildCompanionStreamUrl(host, videoId, itag);

    try {
      const res = await fetch(url, {
        signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      });
      if (!res.ok) {
        throw new Error(`Stream server ${host} returned HTTP ${res.status}`);
      }

      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html') || contentType.includes('javascript')) {
        throw new Error(`Unexpected non-media content-type (${contentType}) from ${host}`);
      }

      const contentLength = Number(res.headers.get('content-length')) || expectedBytes || 0;

      if (!res.body) {
        const buf = await res.arrayBuffer();
        const arr = new Uint8Array(buf);
        if (onProgress) {
          onProgress({ loadedBytes: arr.byteLength, totalBytes: arr.byteLength, percent: 100 });
        }
        return arr;
      }

      const reader = res.body.getReader();
      const chunks = [];
      let loadedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loadedBytes += value.byteLength;
          if (onProgress) {
            const percent = contentLength > 0 ? Math.min(99, Math.round((loadedBytes / contentLength) * 100)) : 50;
            onProgress({ loadedBytes, totalBytes: contentLength, percent });
          }
        }
      }

      const combined = new Uint8Array(loadedBytes);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
      }

      if (combined.byteLength < 1024) {
        throw new Error('Received empty or truncated stream from companion server');
      }

      if (onProgress) {
        onProgress({ loadedBytes: combined.byteLength, totalBytes: combined.byteLength, percent: 100 });
      }

      return combined;
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      console.warn(`Companion stream attempt ${i + 1} (${host}, itag=${itag}) failed:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error(`Unable to fetch stream (itag=${itag}) from any available server.`);
}

import {
  PhotoIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  PaintBrushIcon,
  RectangleGroupIcon,
  CommandLineIcon,
  FilmIcon,
  GifIcon,
  ScissorsIcon,
  GlobeAltIcon,
  QrCodeIcon,
  CodeBracketSquareIcon,
  ClockIcon,
  WindowIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/solid';

export const FEATURE_CATEGORIES = [
  {
    title: 'Image & Graphic Tools',
    items: [
      {
        to: '/image-tools',
        icon: PhotoIcon,
        title: 'Image Editor',
        desc: 'Gaussian and Radial Zoom blur, lighting, contrast, saturation, hue tint, rotation, and corner rounding.',
        keywords: ['blur', 'filter', 'crop', 'contrast', 'saturation', 'brightness', 'tilt shift', 'photo', 'picture', 'round corners']
      },
      {
        to: '/content-extractor',
        icon: DocumentArrowDownIcon,
        title: 'Content Extractor',
        desc: 'Extract all embedded GIFs, images, videos, and audio from PPTX, PDF, DOCX, XLSX, and ZIP archives.',
        keywords: ['pdf', 'pptx', 'docx', 'zip', 'unzip', 'extract', 'unpack', 'presentation', 'archive', 'word', 'powerpoint', 'media']
      },
      {
        to: '/bg-remover',
        icon: SparklesIcon,
        title: 'Background Remover',
        desc: 'On-device AI cutout with sub-pixel edge refinement, anti-halo de-fringe, and studio backdrops.',
        keywords: ['background', 'remove', 'cutout', 'transparent', 'ai', 'png', 'chromakey', 'green screen', 'mask']
      },
      {
        to: '/image-upscaler',
        icon: SparklesIcon,
        title: 'AI Image Upscaler',
        desc: 'Enhance and upscale photos by 2x or 4x locally using neural super-resolution networks.',
        keywords: ['upscale', 'super resolution', 'enlarge', 'enhance', '2x', '4x', 'hd', 'neural', 'quality']
      },
      {
        to: '/collage-maker',
        icon: Square3Stack3DIcon,
        title: 'Photo Collage Maker',
        desc: 'Combine multiple images into customizable grid and masonry photo layouts.',
        keywords: ['collage', 'grid', 'combine', 'montage', 'photos', 'masonry', 'layout', 'album']
      },
      {
        to: '/svg-converter',
        icon: CommandLineIcon,
        title: 'SVG Converter',
        desc: 'Scale vectors to any resolution without loss, apply color overrides, and export PNGs.',
        keywords: ['svg', 'vector', 'rasterize', 'png', 'resolution', 'tint', 'icon', 'convert']
      },
      {
        to: '/color-picker',
        icon: PaintBrushIcon,
        title: 'Color Picker',
        desc: 'Extract color palettes and sample hex, rgb, hsl, and cmyk values.',
        keywords: ['color', 'palette', 'picker', 'hex', 'rgb', 'hsl', 'cmyk', 'dropper', 'swatch', 'eyedropper']
      },
      {
        to: '/shape-generator',
        icon: RectangleGroupIcon,
        title: 'Shape Generator',
        desc: 'Generate custom CSS and SVG geometric shapes, organic blobs, and decorative waves.',
        keywords: ['shape', 'blob', 'wave', 'css', 'svg', 'geometric', 'border radius', 'gradient', 'divider']
      }
    ]
  },
  {
    title: 'Video & Animation',
    items: [
      {
        to: '/video-compressor',
        icon: FilmIcon,
        title: 'Video Compressor',
        desc: 'Client-side FFmpeg compression to shrink video file size while maintaining visual clarity.',
        keywords: ['video', 'compress', 'shrink', 'mp4', 'ffmpeg', 'reduce size', 'resolution', 'bitrate', 'crf']
      },
      {
        to: '/video-to-gif',
        icon: GifIcon,
        title: 'Video to GIF & Cropper',
        desc: 'Convert video clips or compress/crop existing GIFs with spatial crop overlay, custom FPS, and target size presets (e.g. Under 50MB for Discord/Slack).',
        keywords: ['gif', 'video to gif', 'crop gif', 'compress gif', 'discord', 'slack', '50mb', '25mb', 'spatial crop', 'animation', 'fps']
      },
      {
        to: '/video-frame-extractor',
        icon: FilmIcon,
        title: 'Video Frame Extractor',
        desc: 'Capture full-resolution still frames from uploaded video files or direct video URLs.',
        keywords: ['frame', 'snapshot', 'still', 'screenshot', 'youtube', 'capture', 'video frame', 'timestamp']
      },
      {
        to: '/lottie-to-gif',
        icon: ScissorsIcon,
        title: 'Lottie to GIF & Inspector',
        desc: 'Inspect Lottie JSON animation code, test live preview playback, and convert into looping GIFs.',
        keywords: ['lottie', 'json', 'bodymovin', 'animation', 'gif', 'inspect', 'after effects', 'render']
      }
    ]
  },
  {
    title: 'Web & Developer Utilities',
    items: [
      {
        to: '/asset-extractor',
        icon: GlobeAltIcon,
        title: 'Website Asset Extractor',
        desc: 'Scrape and extract SVGs, images, logos, and media from any live web page URL.',
        keywords: ['scrape', 'website', 'url', 'web', 'download images', 'extract', 'favicon', 'logo']
      },
      {
        to: '/qr-generator',
        icon: QrCodeIcon,
        title: 'QR Code Generator',
        desc: 'Create custom branded QR codes with center logos, custom dot styles, and color gradients.',
        keywords: ['qr', 'qrcode', 'barcode', 'logo', 'scanner', 'generator', 'branding', 'link']
      },
      {
        to: '/json-saver',
        icon: CodeBracketSquareIcon,
        title: 'JSON Formatter & Saver',
        desc: 'Format, validate, and inspect JSON documents with syntax highlighting.',
        keywords: ['json', 'format', 'prettify', 'beautify', 'validate', 'syntax', 'lottie preview']
      },
      {
        to: '/timezone-converter',
        icon: ClockIcon,
        title: 'Timezone Converter',
        desc: 'Compare and convert multiple time zones across global locations in real time.',
        keywords: ['timezone', 'time', 'clock', 'world', 'convert', 'gmt', 'utc', 'est', 'pst', 'hours']
      },
      {
        to: '/html-preview',
        icon: WindowIcon,
        title: 'HTML Live Preview',
        desc: 'Sandboxed code playground for HTML, CSS, and JS with instant split-pane preview.',
        keywords: ['html', 'css', 'javascript', 'playground', 'sandbox', 'live preview', 'code', 'iframe']
      },
      {
        to: '/component-generator',
        icon: CodeBracketSquareIcon,
        title: 'Component Generator',
        desc: 'Interactive UI builder generating clean React and Tailwind component code.',
        keywords: ['component', 'react', 'tailwind', 'card', 'glow', 'ui', 'button', 'builder']
      }
    ]
  }
];

/**
 * Returns a flat array of all tools with category information attached.
 */
export function getAllTools() {
  return FEATURE_CATEGORIES.flatMap(cat => 
    cat.items.map(item => ({
      ...item,
      category: cat.title
    }))
  );
}

/**
 * Searches tools by query matching title, description, category, and keywords.
 * @param {string} query 
 */
export function searchTools(query) {
  if (!query || !query.trim()) return getAllTools();
  const q = query.toLowerCase().trim();
  
  return getAllTools().filter(tool => {
    const titleMatch = tool.title.toLowerCase().includes(q);
    const descMatch = tool.desc.toLowerCase().includes(q);
    const catMatch = tool.category.toLowerCase().includes(q);
    const keywordMatch = tool.keywords && tool.keywords.some(k => k.toLowerCase().includes(q));
    return titleMatch || descMatch || catMatch || keywordMatch;
  });
}

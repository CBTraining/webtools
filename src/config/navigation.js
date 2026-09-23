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
} from '@heroicons/react/24/outline';

export const FEATURE_CATEGORIES = [
  {
    title: 'Image & Graphic Tools',
    items: [
      {
        to: '/image-tools',
        icon: PhotoIcon,
        title: 'Image Editor',
        desc: 'Gaussian and Radial Zoom blur, lighting, contrast, saturation, hue tint, rotation, and corner rounding.'
      },
      {
        to: '/content-extractor',
        icon: DocumentArrowDownIcon,
        title: 'Content Extractor',
        desc: 'Extract all embedded GIFs, images, videos, and audio from PPTX, PDF, DOCX, XLSX, and ZIP archives.'
      },
      {
        to: '/bg-remover',
        icon: SparklesIcon,
        title: 'Background Remover',
        desc: 'On-device AI cutout with sub-pixel edge refinement, anti-halo de-fringe, and studio backdrops.'
      },
      {
        to: '/image-upscaler',
        icon: SparklesIcon,
        title: 'AI Image Upscaler',
        desc: 'Enhance and upscale photos by 2x or 4x locally using neural super-resolution networks.'
      },
      {
        to: '/collage-maker',
        icon: Square3Stack3DIcon,
        title: 'Photo Collage Maker',
        desc: 'Combine multiple images into customizable grid and masonry photo layouts.'
      },
      {
        to: '/svg-converter',
        icon: CommandLineIcon,
        title: 'SVG Converter',
        desc: 'Scale vectors to any resolution without loss, apply color overrides, and export PNGs.'
      },
      {
        to: '/color-picker',
        icon: PaintBrushIcon,
        title: 'Color Picker',
        desc: 'Extract color palettes and sample hex, rgb, hsl, and cmyk values.'
      },
      {
        to: '/shape-generator',
        icon: RectangleGroupIcon,
        title: 'Shape Generator',
        desc: 'Generate custom CSS and SVG geometric shapes, organic blobs, and decorative waves.'
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
        desc: 'Client-side FFmpeg compression to shrink video file size while maintaining visual clarity.'
      },
      {
        to: '/video-to-gif',
        icon: GifIcon,
        title: 'Video to GIF',
        desc: 'Convert video clips into smooth, optimized animated GIFs with custom FPS and sizing.'
      },
      {
        to: '/video-frame-extractor',
        icon: FilmIcon,
        title: 'Video Frame Extractor',
        desc: 'Capture full-resolution still frames from uploaded video files or direct video URLs.'
      },
      {
        to: '/lottie-to-gif',
        icon: ScissorsIcon,
        title: 'Lottie to GIF',
        desc: 'Render Lottie JSON animation files into lightweight, looping animated GIFs.'
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
        desc: 'Scrape and extract SVGs, images, logos, and media from any live web page URL.'
      },
      {
        to: '/qr-generator',
        icon: QrCodeIcon,
        title: 'QR Code Generator',
        desc: 'Create custom branded QR codes with center logos, custom dot styles, and color gradients.'
      },
      {
        to: '/json-saver',
        icon: CodeBracketSquareIcon,
        title: 'JSON Formatter & Saver',
        desc: 'Format, validate, and inspect JSON documents with syntax highlighting.'
      },
      {
        to: '/timezone-converter',
        icon: ClockIcon,
        title: 'Timezone Converter',
        desc: 'Compare and convert multiple time zones across global locations in real time.'
      },
      {
        to: '/html-preview',
        icon: WindowIcon,
        title: 'HTML Live Preview',
        desc: 'Sandboxed code playground for HTML, CSS, and JS with instant split-pane preview.'
      },
      {
        to: '/component-generator',
        icon: CodeBracketSquareIcon,
        title: 'Component Generator',
        desc: 'Interactive UI builder generating clean React and Tailwind component code.'
      }
    ]
  }
];

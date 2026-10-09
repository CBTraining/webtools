import lottie from 'lottie-web';
import GIF from 'gif.js';

/**
 * Converts a parsed Lottie JSON animation into a high-quality GIF Blob.
 * 
 * @param {Object} params
 * @param {Object} params.lottieData - Parsed Lottie JSON object
 * @param {number} [params.scale=1] - Resolution multiplier
 * @param {string|number} [params.fps='auto'] - Target framerate ('auto' or numeric)
 * @param {string} [params.background='transparent'] - Background color or 'transparent'
 * @param {number} [params.quality=10] - GIF quality factor (1-10)
 * @param {Function} [params.onProgress] - Callback (progress 0-100, message)
 * @returns {Promise<Blob>} Resulting GIF Blob
 */
export async function renderLottieToGif({
  lottieData,
  scale = 1,
  fps = 'auto',
  background = 'transparent',
  quality = 10,
  onProgress
}) {
  if (!lottieData) throw new Error("No Lottie animation data provided.");

  const origW = lottieData.w || 300;
  const origH = lottieData.h || 300;
  const canvasW = Math.round(origW * scale);
  const canvasH = Math.round(origH * scale);

  const tempContainer = document.createElement('div');
  tempContainer.style.width = `${canvasW}px`;
  tempContainer.style.height = `${canvasH}px`;
  tempContainer.style.position = 'absolute';
  tempContainer.style.top = '-9999px';
  document.body.appendChild(tempContainer);

  let animItem = null;

  try {
    animItem = lottie.loadAnimation({
      container: tempContainer,
      renderer: 'canvas',
      loop: false,
      autoplay: false,
      animationData: lottieData,
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Lottie initialization timed out.')), 10000);
      animItem.addEventListener('DOMLoaded', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    const totalFrames = animItem.totalFrames;
    const lottieFps = animItem.frameRate || 30;
    const effectiveFps = fps === 'auto' ? lottieFps : Number(fps);
    const delay = 1000 / effectiveFps;
    const step = Math.max(1, lottieFps / effectiveFps);

    const canvas = tempContainer.querySelector('canvas');
    if (!canvas) throw new Error("Could not find canvas element in lottie renderer.");

    let blendCanvas = null;
    let blendCtx = null;
    if (background !== 'transparent') {
      blendCanvas = document.createElement('canvas');
      blendCanvas.width = canvas.width;
      blendCanvas.height = canvas.height;
      blendCtx = blendCanvas.getContext('2d');
    }

    const gifOptions = {
      workers: 2,
      quality,
      width: canvas.width,
      height: canvas.height,
      workerScript: `${import.meta.env.BASE_URL}gif.worker.js`
    };

    if (background === 'transparent') {
      gifOptions.transparent = 0x000000;
    }

    const gif = new GIF(gifOptions);

    if (onProgress) {
      gif.on('progress', p => {
        onProgress(Math.round(p * 100), `Rendering GIF: ${Math.round(p * 100)}%`);
      });
    }

    const renderPromise = new Promise((resolve, reject) => {
      gif.on('finished', (blob) => resolve(blob));
      gif.on('error', (err) => reject(new Error(err?.message || 'Failed to render GIF.')));
      gif.on('abort', () => reject(new Error('GIF rendering aborted.')));
    });

    for (let i = 0; i < totalFrames; i += step) {
      animItem.goToAndStop(i, true);
      if (background !== 'transparent' && blendCtx && blendCanvas) {
        blendCtx.fillStyle = background;
        blendCtx.fillRect(0, 0, blendCanvas.width, blendCanvas.height);
        blendCtx.drawImage(canvas, 0, 0);
        gif.addFrame(blendCanvas, { copy: true, delay });
      } else {
        gif.addFrame(canvas, { copy: true, delay });
      }
    }

    gif.render();
    const resultBlob = await renderPromise;
    return resultBlob;
  } finally {
    if (animItem) animItem.destroy();
    if (tempContainer.parentNode) document.body.removeChild(tempContainer);
  }
}

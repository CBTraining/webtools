import { pipeline, env, RawImage } from '@huggingface/transformers';

// Configure environment
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = navigator.hardwareConcurrency
    ? Math.max(1, Math.min(4, navigator.hardwareConcurrency - 1))
    : 1;

export const UPSCALER_MODELS = {
    'realworld': {
        id: 'Xenova/swin2SR-realworld-sr-x4-64-bsrgan-psnr',
        nativeScale: 4,
        label: 'Real-World HD (BSRGAN)'
    },
    'lightweight': {
        id: 'Xenova/swin2SR-lightweight-x2-64',
        nativeScale: 2,
        label: 'Fast Lightweight'
    },
    'compressed': {
        id: 'Xenova/swin2SR-compressed-sr-x4-48',
        nativeScale: 4,
        label: 'Compressed JPEG Restore'
    },
    'classical': {
        id: 'Xenova/swin2SR-classical-sr-x2-64',
        nativeScale: 2,
        label: 'Classical Clean'
    }
};

// Tile size & overlap must be multiples of 8 (Swin2SR window size) so no internal padding artifacts occur
const TILE_SIZE = 192;
const TILE_OVERLAP = 16;

class PipelineSingleton {
    static task = 'image-to-image';
    static currentModelId = null;
    static currentDevice = null;
    static instance = null;

    static async getInstance(modelId, progress_callback = null, forceWasm = false) {
        if (this.instance !== null && (this.currentModelId !== modelId || (forceWasm && this.currentDevice !== 'wasm'))) {
            try {
                if (typeof this.instance.dispose === 'function') {
                    await this.instance.dispose();
                }
            } catch {
                // Ignore disposal errors
            }
            this.instance = null;
        }

        if (this.instance === null) {
            if (forceWasm) {
                this.instance = await pipeline(this.task, modelId, {
                    progress_callback,
                    device: 'wasm',
                });
                this.currentDevice = 'wasm';
            } else {
                try {
                    this.instance = await pipeline(this.task, modelId, {
                        progress_callback,
                        device: 'webgpu',
                    });
                    this.currentDevice = 'webgpu';
                } catch (err) {
                    console.warn('WebGPU initialization failed in upscalerWorker, falling back to WASM:', err);
                    this.instance = await pipeline(this.task, modelId, {
                        progress_callback,
                        device: 'wasm',
                    });
                    this.currentDevice = 'wasm';
                }
            }
            this.currentModelId = modelId;
        }
        return this.instance;
    }
}

function getTileStarts(length, tileSize, overlap) {
    if (length <= tileSize) return [0];
    const starts = [];
    const stride = tileSize - overlap;
    for (let pos = 0; pos < length; pos += stride) {
        if (pos + tileSize >= length) {
            const lastStart = Math.max(0, length - tileSize);
            if (starts.length === 0 || starts[starts.length - 1] !== lastStart) {
                starts.push(lastStart);
            }
            break;
        }
        starts.push(pos);
    }
    return starts;
}

function buildFeatherWeights(length, overlapScaled, rampStart, rampEnd) {
    const weights = new Float32Array(length);
    weights.fill(1.0);
    if (rampStart && overlapScaled > 0) {
        const limit = Math.min(length, overlapScaled);
        for (let i = 0; i < limit; i++) {
            weights[i] = Math.min(weights[i], (i + 0.5) / overlapScaled);
        }
    }
    if (rampEnd && overlapScaled > 0) {
        const limit = Math.min(length, overlapScaled);
        for (let i = 0; i < limit; i++) {
            const idx = length - 1 - i;
            weights[idx] = Math.min(weights[idx], (i + 0.5) / overlapScaled);
        }
    }
    return weights;
}

self.addEventListener('message', async (event) => {
    const {
        jobId,
        imageBlobUrl,
        useWasm = false,
        modelKey = 'realworld',
        targetScale = 2
    } = event.data;

    const modelConfig = UPSCALER_MODELS[modelKey] || UPSCALER_MODELS.realworld;

    try {
        self.postMessage({
            jobId,
            status: 'init',
            progress: 2,
            log: `Loading ${modelConfig.label} AI model...`
        });

        const upscaler = await PipelineSingleton.getInstance(
            modelConfig.id,
            (x) => {
                self.postMessage({ jobId, status: 'progress', progressData: x });
            },
            useWasm
        );

        // Fetch and decode source image into ImageData
        const imageResponse = await fetch(imageBlobUrl);
        const imageBlob = await imageResponse.blob();
        const bitmap = await createImageBitmap(imageBlob);
        const srcWidth = bitmap.width;
        const srcHeight = bitmap.height;

        const srcCanvas = new OffscreenCanvas(srcWidth, srcHeight);
        const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
        srcCtx.drawImage(bitmap, 0, 0);
        const srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
        const srcPixels = srcImageData.data;

        // Check if source image has any transparency
        let hasAlpha = false;
        for (let i = 3; i < srcPixels.length; i += 4) {
            if (srcPixels[i] < 255) {
                hasAlpha = true;
                break;
            }
        }

        // Compute overlapping tile grid
        const xStarts = getTileStarts(srcWidth, TILE_SIZE, TILE_OVERLAP);
        const yStarts = getTileStarts(srcHeight, TILE_SIZE, TILE_OVERLAP);
        const totalTiles = xStarts.length * yStarts.length;

        let modelScale = modelConfig.nativeScale;
        let nativeOutW = srcWidth * modelScale;
        let nativeOutH = srcHeight * modelScale;
        let accRGB = null;
        let accW = null;

        let tileIndex = 0;
        const startTime = performance.now();

        for (let yi = 0; yi < yStarts.length; yi++) {
            const ty = yStarts[yi];
            const th = Math.min(TILE_SIZE, srcHeight - ty);

            for (let xi = 0; xi < xStarts.length; xi++) {
                const tx = xStarts[xi];
                const tw = Math.min(TILE_SIZE, srcWidth - tx);
                tileIndex++;

                const pct = Math.round(((tileIndex - 1) / totalTiles) * 90) + 5;
                let etaText = '';
                if (tileIndex > 1) {
                    const elapsedSec = (performance.now() - startTime) / 1000;
                    const avgPerTile = elapsedSec / (tileIndex - 1);
                    const remainingSec = Math.max(1, Math.round(avgPerTile * (totalTiles - tileIndex + 1)));
                    etaText = remainingSec >= 60
                        ? ` (~${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s left)`
                        : ` (~${remainingSec}s left)`;
                }

                self.postMessage({
                    jobId,
                    status: 'processing',
                    progress: pct,
                    log: totalTiles > 1
                        ? `Upscaling tile ${tileIndex} of ${totalTiles}${etaText}...`
                        : `Enhancing image with ${modelConfig.label}...`
                });

                // Extract RGB tile buffer
                const tileRgb = new Uint8Array(tw * th * 3);
                for (let row = 0; row < th; row++) {
                    const srcRowOffset = ((ty + row) * srcWidth + tx) * 4;
                    const dstRowOffset = row * tw * 3;
                    for (let col = 0; col < tw; col++) {
                        const sIdx = srcRowOffset + col * 4;
                        const dIdx = dstRowOffset + col * 3;
                        const a = srcPixels[sIdx + 3];
                        if (a === 0) {
                            tileRgb[dIdx] = 128;
                            tileRgb[dIdx + 1] = 128;
                            tileRgb[dIdx + 2] = 128;
                        } else {
                            tileRgb[dIdx] = srcPixels[sIdx];
                            tileRgb[dIdx + 1] = srcPixels[sIdx + 1];
                            tileRgb[dIdx + 2] = srcPixels[sIdx + 2];
                        }
                    }
                }

                const rawTile = new RawImage(tileRgb, tw, th, 3);
                const output = await upscaler(rawTile);
                const resultTile = Array.isArray(output) ? output[0] : (output.image || output);

                // Swin2SR pads inputs not divisible by 8; calculate actual model scale from padded width
                const paddedTw = tw + ((8 - (tw % 8)) % 8);
                const detectedScale = Math.max(1, Math.round(resultTile.width / paddedTw));

                if (accRGB === null) {
                    modelScale = detectedScale;
                    nativeOutW = srcWidth * modelScale;
                    nativeOutH = srcHeight * modelScale;
                    accRGB = new Float32Array(nativeOutW * nativeOutH * 3);
                    accW = new Float32Array(nativeOutW * nativeOutH);
                }

                const validOutW = tw * modelScale;
                const validOutH = th * modelScale;
                const outX0 = tx * modelScale;
                const outY0 = ty * modelScale;
                const overlapScaled = TILE_OVERLAP * modelScale;

                const wx = buildFeatherWeights(validOutW, overlapScaled, tx > 0, tx + tw < srcWidth);
                const wy = buildFeatherWeights(validOutH, overlapScaled, ty > 0, ty + th < srcHeight);

                const tileData = resultTile.data;
                const tileStride = resultTile.width;
                const channels = resultTile.channels || 3;

                for (let oy = 0; oy < validOutH; oy++) {
                    const weightY = wy[oy];
                    const dstY = outY0 + oy;
                    const dstRowBase = dstY * nativeOutW;
                    const srcRowBase = oy * tileStride;

                    for (let ox = 0; ox < validOutW; ox++) {
                        const w = weightY * wx[ox];
                        const dstIdx = dstRowBase + outX0 + ox;
                        const dstRgbIdx = dstIdx * 3;
                        const srcIdx = (srcRowBase + ox) * channels;

                        const r = tileData[srcIdx];
                        const g = channels > 1 ? tileData[srcIdx + 1] : r;
                        const b = channels > 2 ? tileData[srcIdx + 2] : r;

                        accRGB[dstRgbIdx] += r * w;
                        accRGB[dstRgbIdx + 1] += g * w;
                        accRGB[dstRgbIdx + 2] += b * w;
                        accW[dstIdx] += w;
                    }
                }
            }
        }

        self.postMessage({
            jobId,
            status: 'processing',
            progress: 96,
            log: 'Blending tiles and encoding HD PNG...'
        });

        // Normalize accumulated weighted pixels into native output canvas
        const nativeCanvas = new OffscreenCanvas(nativeOutW, nativeOutH);
        const nativeCtx = nativeCanvas.getContext('2d');
        const outImageData = nativeCtx.createImageData(nativeOutW, nativeOutH);
        const outPixels = outImageData.data;

        // If original image had transparency, upscale original alpha channel smoothly
        let alphaPixels = null;
        if (hasAlpha) {
            const alphaCanvas = new OffscreenCanvas(nativeOutW, nativeOutH);
            const alphaCtx = alphaCanvas.getContext('2d');
            alphaCtx.imageSmoothingEnabled = true;
            alphaCtx.imageSmoothingQuality = 'high';
            alphaCtx.drawImage(bitmap, 0, 0, nativeOutW, nativeOutH);
            alphaPixels = alphaCtx.getImageData(0, 0, nativeOutW, nativeOutH).data;
        }

        bitmap.close();

        const totalOutPixels = nativeOutW * nativeOutH;
        for (let i = 0; i < totalOutPixels; i++) {
            const w = accW[i] || 1;
            const rgbIdx = i * 3;
            const rgbaIdx = i * 4;
            outPixels[rgbaIdx] = Math.min(255, Math.max(0, Math.round(accRGB[rgbIdx] / w)));
            outPixels[rgbaIdx + 1] = Math.min(255, Math.max(0, Math.round(accRGB[rgbIdx + 1] / w)));
            outPixels[rgbaIdx + 2] = Math.min(255, Math.max(0, Math.round(accRGB[rgbIdx + 2] / w)));
            outPixels[rgbaIdx + 3] = alphaPixels ? alphaPixels[rgbaIdx + 3] : 255;
        }

        nativeCtx.putImageData(outImageData, 0, 0);

        // Release accumulator memory before final encode
        accRGB = null;
        accW = null;

        // Resample if targetScale differs from model's nativeScale (e.g. 4x BSRGAN supersampled to 2x)
        const finalWidth = Math.round(srcWidth * targetScale);
        const finalHeight = Math.round(srcHeight * targetScale);
        let outputCanvas = nativeCanvas;

        if (finalWidth !== nativeOutW || finalHeight !== nativeOutH) {
            outputCanvas = new OffscreenCanvas(finalWidth, finalHeight);
            const outCtx = outputCanvas.getContext('2d');
            outCtx.imageSmoothingEnabled = true;
            outCtx.imageSmoothingQuality = 'high';
            outCtx.drawImage(nativeCanvas, 0, 0, finalWidth, finalHeight);
        }

        const upscaledBlob = await outputCanvas.convertToBlob({ type: 'image/png' });

        self.postMessage({
            jobId,
            status: 'success',
            progress: 100,
            resultBlob: upscaledBlob,
            outputResolution: { width: finalWidth, height: finalHeight }
        });

    } catch (error) {
        console.error('Upscaler Error:', error);

        const errorMsg = error.message || error.toString();
        const lowerMsg = errorMsg.toLowerCase();

        if (!useWasm && (lowerMsg.includes('webgpu') || lowerMsg.includes('backend') || lowerMsg.includes('jsep') || lowerMsg.includes('ortrun') || lowerMsg.includes('buffer') || lowerMsg.includes('device'))) {
            self.postMessage({
                jobId,
                status: 'webgpu_error',
                error: errorMsg
            });
            return;
        }

        self.postMessage({
            jobId,
            status: 'error',
            error: errorMsg
        });
    }
});


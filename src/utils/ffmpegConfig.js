import { FFmpeg } from '@ffmpeg/ffmpeg';

/**
 * Returns the standardized core and wasm URLs for FFmpeg in WebTools.
 */
export function getFfmpegLoadConfig() {
  const baseURL = `${import.meta.env.BASE_URL}ffmpeg`;
  return {
    coreURL: `${baseURL}/ffmpeg-core.js?v=2`,
    wasmURL: `${baseURL}/ffmpeg-core.wasm?v=2`,
  };
}

/**
 * Spawns and initializes an FFmpeg instance with the project standard configuration.
 * @param {FFmpeg} [instance]
 * @returns {Promise<FFmpeg>}
 */
export async function initializeFfmpeg(instance = new FFmpeg()) {
  await instance.load(getFfmpegLoadConfig());
  return instance;
}

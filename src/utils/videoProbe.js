import { fetchFile } from '@ffmpeg/util';
import { isAviFile } from './fileTypes';

export { isAviFile };

/**
 * Probe a video file using a dedicated ffmpeg instance to detect frame rate, duration, dimensions,
 * and optionally generate a lightweight browser-playable MP4 preview (essential for formats like .avi).
 * 
 * @param {Function} createFfmpegInstance 
 * @param {string|number} slotId 
 * @param {File} videoFile 
 * @param {Object} [options]
 * @param {boolean} [options.generatePreview] Force generation of preview MP4
 * @returns {Promise<{ fps: number|null, duration: number|null, width: number|null, height: number|null, previewUrl: string|null }|null>}
 */
export async function probeVideoMetadata(createFfmpegInstance, slotId, videoFile, options = {}) {
  if (!videoFile || !createFfmpegInstance) return null;
  let localFfmpeg = null;
  try {
    localFfmpeg = await createFfmpegInstance();
    const cleanExt = (videoFile.name || '').split('.').pop().toLowerCase() || 'mp4';
    const inputName = `probe_${slotId}_input.${cleanExt}`;
    await localFfmpeg.writeFile(inputName, await fetchFile(videoFile));

    let detectedFps = null;
    let detectedDuration = null;
    let detectedWidth = null;
    let detectedHeight = null;

    const logHandler = ({ message }) => {
      // FPS Detection
      if (!detectedFps) {
        const fpsMatch = message.match(/, ([\d.]+) fps,/) || message.match(/, ([\d.]+) tbr,/);
        if (fpsMatch) detectedFps = parseFloat(fpsMatch[1]);
      }

      // Duration Detection (e.g. Duration: 00:01:23.45, start: ...)
      if (!detectedDuration) {
        const durMatch = message.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
        if (durMatch) {
          const hours = parseFloat(durMatch[1]);
          const mins = parseFloat(durMatch[2]);
          const secs = parseFloat(durMatch[3]);
          detectedDuration = hours * 3600 + mins * 60 + secs;
        }
      }

      // Resolution / Dimensions Detection (e.g. Video: ..., 1280x720, ...)
      if (!detectedWidth || !detectedHeight) {
        const dimMatch = message.match(/Video:.*?,\s*(\d{2,5})x(\d{2,5})/) || message.match(/, (\d{2,5})x(\d{2,5})[ ,]/);
        if (dimMatch) {
          detectedWidth = parseInt(dimMatch[1], 10);
          detectedHeight = parseInt(dimMatch[2], 10);
        }
      }
    };

    localFfmpeg.on('log', logHandler);
    await localFfmpeg.exec(['-i', inputName]);
    localFfmpeg.off('log', logHandler);

    let previewUrl = null;
    const shouldGeneratePreview = options.generatePreview || isAviFile(videoFile);

    if (shouldGeneratePreview) {
      const previewName = `preview_${slotId}.mp4`;
      // Transcode lightweight MP4 preview with H.264 + AAC for native browser playback
      // Scale down to max 720p with ultrafast preset to keep it very fast and responsive
      const transcodeArgs = [
        '-y',
        '-i', inputName,
        '-vf', "scale='min(720,iw)':-2",
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-c:a', 'aac',
        '-b:a', '96k',
        '-movflags', '+faststart',
        previewName
      ];

      const res = await localFfmpeg.exec(transcodeArgs);
      if (res === 0) {
        const previewData = await localFfmpeg.readFile(previewName);
        if (previewData && previewData.length > 0) {
          const blob = new Blob([previewData], { type: 'video/mp4' });
          previewUrl = URL.createObjectURL(blob);
        }
        try {
          await localFfmpeg.deleteFile(previewName);
        } catch (e) {
          void e;
        }
      }
    }

    try {
      await localFfmpeg.deleteFile(inputName);
    } catch (e) {
      void e;
    }

    return {
      fps: detectedFps,
      duration: detectedDuration,
      width: detectedWidth,
      height: detectedHeight,
      previewUrl
    };
  } catch (err) {
    console.error("Probe error", err);
    return null;
  } finally {
    if (localFfmpeg) {
      try {
        localFfmpeg.terminate();
      } catch (e) {
        console.warn("Could not terminate probe ffmpeg", e);
      }
    }
  }
}

/**
 * Probe a video file using a dedicated ffmpeg instance to detect frame rate.
 * @param {Function} createFfmpegInstance 
 * @param {string|number} slotId 
 * @param {File} videoFile 
 * @returns {Promise<number|null>} Detected FPS or null
 */
export async function probeVideoFps(createFfmpegInstance, slotId, videoFile) {
  const metadata = await probeVideoMetadata(createFfmpegInstance, slotId, videoFile);
  return metadata?.fps || null;
}

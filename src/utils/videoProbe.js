import { fetchFile } from '@ffmpeg/util';

/**
 * Probe a video file using a dedicated ffmpeg instance to detect frame rate.
 * @param {Function} createFfmpegInstance 
 * @param {string|number} slotId 
 * @param {File} videoFile 
 * @returns {Promise<number|null>} Detected FPS or null
 */
export async function probeVideoFps(createFfmpegInstance, slotId, videoFile) {
  if (!videoFile || !createFfmpegInstance) return null;
  let localFfmpeg = null;
  try {
    localFfmpeg = await createFfmpegInstance();
    const inputName = 'probe_' + slotId + '_' + videoFile.name.replace(/\s+/g, '_');
    await localFfmpeg.writeFile(inputName, await fetchFile(videoFile));
    let detectedFps = null;
    const logHandler = ({ message }) => {
      const match = message.match(/, ([\d.]+) fps,/);
      if (match) detectedFps = parseFloat(match[1]);
    };
    localFfmpeg.on('log', logHandler);
    await localFfmpeg.exec(['-i', inputName]);
    localFfmpeg.off('log', logHandler);
    return detectedFps;
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

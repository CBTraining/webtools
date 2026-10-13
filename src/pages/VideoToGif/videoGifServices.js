import { fetchFile } from '@ffmpeg/util';
import { buildFfmpegGifArgs } from './gifCompressionUtils';

/**
 * Runs FFmpeg to transcode and compress video to GIF with auto-budgeting.
 */
export async function executeGifConversion({
  createFfmpegInstance,
  slotId,
  videoFile,
  budgetParams,
  startTime,
  endTime,
  enableCrop,
  cropBounds,
  effectiveTargetMb,
  onLog,
  onProgress
}) {
  let localFfmpeg = null;
  let fullLog = '';

  const logHandler = ({ message }) => {
    fullLog += message + '\n';
    if (onLog) onLog(message);
  };

  const progressHandler = ({ progress }) => {
    if (onProgress) onProgress(Math.min(99, progress * 100));
  };

  try {
    localFfmpeg = await createFfmpegInstance();
    localFfmpeg.on('log', logHandler);
    localFfmpeg.on('progress', progressHandler);

    const inputName = `input_${slotId}_` + videoFile.name.replace(/\s+/g, '_');
    const outputName = `output_${slotId}.gif`;

    await localFfmpeg.writeFile(inputName, await fetchFile(videoFile));

    const args = buildFfmpegGifArgs({
      inputName,
      outputName,
      startTime,
      endTime,
      enableDurationTrim: enableCrop,
      cropBounds,
      finalFps: budgetParams.fps,
      targetScale: budgetParams.targetScale,
      maxColors: budgetParams.maxColors,
      statsMode: budgetParams.statsMode,
      dither: budgetParams.dither
    });

    const execResult = await localFfmpeg.exec(args);
    if (execResult !== 0) {
      throw new Error(`FFmpeg exited with code ${execResult}. Last logs:\n${fullLog.substring(fullLog.length - 400)}`);
    }

    let data = await localFfmpeg.readFile(outputName);
    if (data.length === 0) throw new Error("Generated GIF is 0 bytes");

    // Verify target size compliance: If output exceeds target MB, execute secondary precision pass
    if (effectiveTargetMb && data.length > effectiveTargetMb * 1024 * 1024) {
      if (onLog) onLog(`Optimizing palette to ensure output is under ${effectiveTargetMb} MB...`);
      if (onProgress) onProgress(92);

      const precisionOutputName = `output_${slotId}_compressed.gif`;
      const minPrecisionScale = Math.min(budgetParams.targetScale, 64);
      const precisionScale = Math.max(minPrecisionScale, Math.floor((budgetParams.targetScale * 0.78) / 2) * 2);
      const precisionArgs = buildFfmpegGifArgs({
        inputName,
        outputName: precisionOutputName,
        startTime,
        endTime,
        enableDurationTrim: enableCrop,
        cropBounds,
        finalFps: Math.min(12, budgetParams.fps),
        targetScale: precisionScale,
        maxColors: 128,
        statsMode: 'diff',
        dither: 'bayer:bayer_scale=3'
      });

      const exec2 = await localFfmpeg.exec(precisionArgs);
      if (exec2 === 0) {
        const refinedData = await localFfmpeg.readFile(precisionOutputName);
        if (refinedData && refinedData.length > 0) {
          data = refinedData;
        }
      }
    }

    return {
      blob: new Blob([data], { type: 'image/gif' }),
      bytes: data.length
    };
  } finally {
    if (localFfmpeg) {
      localFfmpeg.off('log', logHandler);
      localFfmpeg.off('progress', progressHandler);
      localFfmpeg.terminate();
    }
  }
}

/**
 * Runs FFmpeg to trim and export MP4 video.
 */
export async function executeMp4Trim({
  createFfmpegInstance,
  slotId,
  videoFile,
  startTime,
  endTime,
  enableCrop,
  cropBounds,
  onLog,
  onProgress
}) {
  let localFfmpeg = null;
  let fullLog = '';

  const logHandler = ({ message }) => {
    fullLog += message + '\n';
    if (onLog) onLog(message);
  };

  const progressHandler = ({ progress }) => {
    if (onProgress) onProgress(progress * 100);
  };

  try {
    localFfmpeg = await createFfmpegInstance();
    localFfmpeg.on('log', logHandler);
    localFfmpeg.on('progress', progressHandler);

    const inputName = `input_${slotId}_` + videoFile.name.replace(/\s+/g, '_');
    const outputName = `trimmed_${slotId}.mp4`;

    await localFfmpeg.writeFile(inputName, await fetchFile(videoFile));

    let args = ['-y'];
    if (enableCrop) {
      args.push('-ss', startTime.toString(), '-to', endTime.toString());
    }
    args.push('-i', inputName);

    if (cropBounds) {
      args.push('-vf', `crop=${cropBounds.w}:${cropBounds.h}:${cropBounds.x}:${cropBounds.y}`);
    }

    args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-c:a', 'aac', outputName);

    const execResult = await localFfmpeg.exec(args);
    if (execResult !== 0) {
      throw new Error(`FFmpeg exited with code ${execResult}. Last logs:\n${fullLog.substring(fullLog.length - 400)}`);
    }

    const data = await localFfmpeg.readFile(outputName);
    if (data.length === 0) throw new Error("Trimmed video is 0 bytes");

    return {
      blob: new Blob([data], { type: 'video/mp4' }),
      bytes: data.length
    };
  } finally {
    if (localFfmpeg) {
      localFfmpeg.off('log', logHandler);
      localFfmpeg.off('progress', progressHandler);
      localFfmpeg.terminate();
    }
  }
}

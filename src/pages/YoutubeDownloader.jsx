import { useState, useRef, useEffect } from 'react';
import {
  ArrowDownTrayIcon,
  PlayCircleIcon,
  ClipboardIcon,
  XMarkIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  FilmIcon,
  MusicalNoteIcon,
  PhotoIcon,
  ScissorsIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';
import { useProcessing } from '../contexts/ProcessingContext';
import { downloadBlob } from '../utils/downloadUtils';
import { formatBytes, formatDuration } from '../utils/formatters';
import { playDing } from '../utils/audio';
import SendToDropdown from '../components/SendToDropdown';
import {
  SAMPLE_YOUTUBE_VIDEOS,
  extractYouTubeVideoId,
  fetchYouTubeVideoInfo,
  downloadItagStream,
  parseTimestampToSeconds,
  sanitizeFilename
} from './YoutubeDownloader/youtubeService';

export default function YoutubeDownloader() {
  const { createFfmpegInstance, addJob, updateJob } = useProcessing();

  const [urlInput, setUrlInput] = useState('');
  const [resolving, setResolving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);

  // 'video' | 'audio'
  const [downloadMode, setDownloadMode] = useState('video');
  const [selectedVideoId, setSelectedVideoId] = useState('video-1080p');
  const [audioFormat, setAudioFormat] = useState('m4a'); // 'm4a' | 'mp3'

  // Optional clip trimming
  const [enableTrim, setEnableTrim] = useState(false);
  const [trimStart, setTrimStart] = useState('0:00');
  const [trimEnd, setTrimEnd] = useState('');

  // Active download state
  const [downloading, setDownloading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressPhase, setProgressPhase] = useState('');
  const [progressDetail, setProgressDetail] = useState('');
  const abortControllerRef = useRef(null);

  // Completed output state for preview & SendToDropdown
  const [completedFile, setCompletedFile] = useState(null);
  const [completedUrl, setCompletedUrl] = useState('');
  const [completedFilename, setCompletedFilename] = useState('');
  const [completedMediaType, setCompletedMediaType] = useState('video');

  useEffect(() => {
    return () => {
      if (completedUrl) {
        URL.revokeObjectURL(completedUrl);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [completedUrl]);

  const clearCompletedResult = () => {
    if (completedUrl) {
      URL.revokeObjectURL(completedUrl);
    }
    setCompletedFile(null);
    setCompletedUrl('');
    setCompletedFilename('');
  };

  const handleResolveVideo = async (overrideUrl) => {
    const target = (overrideUrl !== undefined ? overrideUrl : urlInput).trim();
    if (!target) return;
    if (overrideUrl !== undefined) {
      setUrlInput(overrideUrl);
    }

    const vidId = extractYouTubeVideoId(target);
    if (!vidId) {
      setErrorMsg('Please enter a valid YouTube link (e.g. youtube.com/watch?v=... or youtu.be/...).');
      return;
    }

    setResolving(true);
    setErrorMsg('');
    clearCompletedResult();

    try {
      const info = await fetchYouTubeVideoInfo(target);
      setVideoInfo(info);

      // Default to 1080p if available, otherwise highest MP4 resolution
      const has1080 = info.videoOptions.find((v) => v.height === 1080);
      const bestFallback = info.videoOptions.find((v) => v.isMp4) || info.videoOptions[0];
      if (has1080) {
        setSelectedVideoId(has1080.id);
      } else if (bestFallback) {
        setSelectedVideoId(bestFallback.id);
      }

      if (info.lengthSeconds > 0) {
        setTrimEnd(formatDuration(info.lengthSeconds));
      } else {
        setTrimEnd('');
      }
    } catch (err) {
      console.error('Failed to resolve YouTube video:', err);
      setErrorMsg(err.message || 'Unable to fetch video metadata.');
    } finally {
      setResolving(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrlInput(text.trim());
        if (extractYouTubeVideoId(text.trim())) {
          handleResolveVideo(text.trim());
        }
      }
    } catch {
      setErrorMsg('Clipboard access denied. Press Ctrl+V inside the input box.');
    }
  };

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setDownloading(false);
    setProgressPhase('');
    setProgressDetail('');
  };

  const handleDownloadThumbnail = async () => {
    if (!videoInfo) return;
    const filename = `${sanitizeFilename(videoInfo.title)}_thumbnail.jpg`;
    try {
      const res = await fetch(videoInfo.thumbnailUrl, {
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      });
      const blob = res.ok
        ? await res.blob()
        : await (
            await fetch(videoInfo.fallbackThumbnailUrl, {
              credentials: 'omit',
              referrerPolicy: 'no-referrer'
            })
          ).blob();
      downloadBlob(blob, filename, { categoryLabel: 'YouTube Video Thumbnail' });
      playDing();
    } catch {
      window.open(videoInfo.thumbnailUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStartDownload = async () => {
    if (!videoInfo || downloading) return;

    const selectedVideo =
      videoInfo.videoOptions.find((v) => v.id === selectedVideoId) ||
      videoInfo.videoOptions.find((v) => v.height === 1080) ||
      videoInfo.videoOptions[0];

    const bestAudio = videoInfo.bestAudio || { itag: '140', clen: 0 };

    // Validate trim timestamps if enabled
    let startSec = null;
    let endSec = null;
    if (enableTrim) {
      startSec = parseTimestampToSeconds(trimStart) ?? 0;
      endSec = parseTimestampToSeconds(trimEnd);
      if (endSec !== null && endSec <= startSec) {
        setErrorMsg('Trim end time must be greater than start time.');
        return;
      }
    }

    setErrorMsg('');
    clearCompletedResult();
    setDownloading(true);
    setProgressPercent(2);
    setProgressPhase('Initializing stream connection...');
    setProgressDetail('');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const jobId = `yt-dl-${Date.now()}`;
    const safeTitle = sanitizeFilename(videoInfo.title);
    const labelSuffix =
      downloadMode === 'audio'
        ? `Audio (.${audioFormat.toUpperCase()})`
        : `${selectedVideo?.qualityLabel || '1080p'} (.MP4)`;

    addJob({
      id: jobId,
      title: `YouTube: ${videoInfo.title.slice(0, 36)} (${labelSuffix})`,
      type: 'video'
    });

    let ffmpeg = null;
    const ts = Date.now();
    const videoInputName = `yt_v_${ts}.${selectedVideo?.container || 'mp4'}`;
    const audioInputName = `yt_a_${ts}.m4a`;
    const outputExt =
      downloadMode === 'audio'
        ? audioFormat
        : selectedVideo?.isMp4
        ? 'mp4'
        : 'mkv';
    const outputFileName = `yt_out_${ts}.${outputExt}`;

    try {
      if (downloadMode === 'audio') {
        setProgressPhase('Downloading high-bitrate audio stream...');
        const audioBytes = await downloadItagStream({
          videoId: videoInfo.videoId,
          itag: bestAudio.itag || '140',
          expectedBytes: bestAudio.clen,
          companionHosts: videoInfo.companionHosts,
          signal: abortController.signal,
          onProgress: ({ loadedBytes, totalBytes, percent }) => {
            const p = Math.round(percent * 0.8);
            setProgressPercent(p);
            const detail =
              totalBytes > 0
                ? `${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)}`
                : formatBytes(loadedBytes);
            setProgressDetail(detail);
            updateJob(jobId, { progress: p, log: `Downloading audio (${detail})...` });
          }
        });

        let finalBlob;
        const finalDownloadName = `${safeTitle}_audio.${audioFormat}`;

        if (audioFormat === 'm4a' && !enableTrim) {
          finalBlob = new Blob([audioBytes], { type: 'audio/mp4' });
        } else {
          setProgressPhase(`Processing ${audioFormat.toUpperCase()} audio in FFmpeg...`);
          setProgressPercent(85);
          ffmpeg = await createFfmpegInstance();
          await ffmpeg.writeFile(audioInputName, audioBytes);

          const args = ['-y'];
          if (enableTrim && startSec > 0) args.push('-ss', String(startSec));
          if (enableTrim && endSec !== null) args.push('-to', String(endSec));
          args.push('-i', audioInputName);
          if (audioFormat === 'mp3') {
            args.push('-vn', '-c:a', 'libmp3lame', '-q:a', '2', outputFileName);
          } else {
            args.push('-vn', '-c:a', 'copy', outputFileName);
          }

          const code = await ffmpeg.exec(args);
          if (code !== 0) {
            throw new Error('FFmpeg audio conversion failed.');
          }
          const outData = await ffmpeg.readFile(outputFileName);
          finalBlob = new Blob([outData], {
            type: audioFormat === 'mp3' ? 'audio/mpeg' : 'audio/mp4'
          });
        }

        setProgressPercent(100);
        const objUrl = URL.createObjectURL(finalBlob);
        const fileObj = new File([finalBlob], finalDownloadName, { type: finalBlob.type });

        setCompletedFile(fileObj);
        setCompletedUrl(objUrl);
        setCompletedFilename(finalDownloadName);
        setCompletedMediaType('audio');

        updateJob(jobId, {
          status: 'success',
          progress: 100,
          log: 'Audio ready!',
          resultUrl: objUrl,
          resultBlob: finalBlob,
          downloadName: finalDownloadName
        });

        downloadBlob(finalBlob, finalDownloadName, {
          categoryLabel: `YouTube Audio (.${audioFormat.toUpperCase()})`,
          skipHistory: true
        });
        playDing();
        return;
      }

      // VIDEO + AUDIO 1080p DOWNLOAD & LOSSLESS MUX
      const vItag = selectedVideo?.itag || '137';
      const vExpected = selectedVideo?.clen || 0;
      const aItag = bestAudio?.itag || '140';
      const aExpected = bestAudio?.clen || 0;

      setProgressPhase(`Step 1/3: Downloading ${selectedVideo?.qualityLabel || '1080p'} video stream...`);
      const videoBytes = await downloadItagStream({
        videoId: videoInfo.videoId,
        itag: vItag,
        expectedBytes: vExpected,
        companionHosts: videoInfo.companionHosts,
        signal: abortController.signal,
        onProgress: ({ loadedBytes, totalBytes, percent }) => {
          const scaled = Math.max(2, Math.round(percent * 0.72));
          setProgressPercent(scaled);
          const detail =
            totalBytes > 0
              ? `${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)} (${percent}%)`
              : `${formatBytes(loadedBytes)} downloaded`;
          setProgressDetail(detail);
          updateJob(jobId, {
            progress: scaled,
            log: `Downloading ${selectedVideo?.qualityLabel || '1080p'} stream: ${detail}`
          });
        }
      });

      if (abortController.signal.aborted) {
        throw new DOMException('Cancelled', 'AbortError');
      }

      setProgressPhase('Step 2/3: Downloading AAC audio track...');
      const audioBytes = await downloadItagStream({
        videoId: videoInfo.videoId,
        itag: aItag,
        expectedBytes: aExpected,
        companionHosts: videoInfo.companionHosts,
        signal: abortController.signal,
        onProgress: ({ loadedBytes, totalBytes, percent }) => {
          const scaled = 72 + Math.round(percent * 0.16);
          setProgressPercent(scaled);
          const detail =
            totalBytes > 0
              ? `${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)} (${percent}%)`
              : `${formatBytes(loadedBytes)} downloaded`;
          setProgressDetail(detail);
          updateJob(jobId, {
            progress: scaled,
            log: `Downloading audio track: ${detail}`
          });
        }
      });

      if (abortController.signal.aborted) {
        throw new DOMException('Cancelled', 'AbortError');
      }

      setProgressPhase(`Step 3/3: Losslessly muxing ${selectedVideo?.qualityLabel || '1080p'} video + audio via FFmpeg...`);
      setProgressDetail('Stream copy (-c:v copy -c:a copy) — zero quality loss');
      setProgressPercent(90);
      updateJob(jobId, { progress: 90, log: 'Muxing 1080p video + audio in FFmpeg...' });

      ffmpeg = await createFfmpegInstance();
      await ffmpeg.writeFile(videoInputName, videoBytes);
      await ffmpeg.writeFile(audioInputName, audioBytes);

      const finalOutputFormat = selectedVideo?.isMp4 ? 'mp4' : 'webm';
      const muxOutputName = `yt_mux_${ts}.${finalOutputFormat}`;

      const ffmpegArgs = ['-y'];
      if (enableTrim && startSec > 0) {
        ffmpegArgs.push('-ss', String(startSec));
      }
      if (enableTrim && endSec !== null) {
        ffmpegArgs.push('-to', String(endSec));
      }
      ffmpegArgs.push(
        '-i',
        videoInputName,
        '-i',
        audioInputName,
        '-c:v',
        'copy',
        '-c:a',
        finalOutputFormat === 'mp4' ? 'copy' : 'libopus',
        '-map',
        '0:v:0',
        '-map',
        '1:a:0',
        '-shortest'
      );
      if (finalOutputFormat === 'mp4') {
        ffmpegArgs.push('-movflags', '+faststart');
      }
      ffmpegArgs.push(muxOutputName);

      setProgressPercent(95);
      const execCode = await ffmpeg.exec(ffmpegArgs);
      if (execCode !== 0) {
        throw new Error('FFmpeg failed to merge video and audio streams.');
      }

      const muxedData = await ffmpeg.readFile(muxOutputName);
      try {
        await ffmpeg.deleteFile(muxOutputName);
      } catch {
        // ignore
      }

      const mimeType = finalOutputFormat === 'mp4' ? 'video/mp4' : 'video/webm';
      const finalBlob = new Blob([muxedData], { type: mimeType });
      const resLabel = selectedVideo?.qualityLabel || '1080p';
      const trimSuffix = enableTrim ? '_clip' : '';
      const finalDownloadName = `${safeTitle}_${resLabel}${trimSuffix}.${finalOutputFormat}`;

      const objUrl = URL.createObjectURL(finalBlob);
      const fileObj = new File([finalBlob], finalDownloadName, { type: mimeType });

      setProgressPercent(100);
      setCompletedFile(fileObj);
      setCompletedUrl(objUrl);
      setCompletedFilename(finalDownloadName);
      setCompletedMediaType('video');

      updateJob(jobId, {
        status: 'success',
        progress: 100,
        log: `Downloaded ${resLabel} (${formatBytes(finalBlob.size)})`,
        resultUrl: objUrl,
        resultBlob: finalBlob,
        downloadName: finalDownloadName
      });

      downloadBlob(finalBlob, finalDownloadName, {
        categoryLabel: `YouTube Video (${resLabel})`,
        skipHistory: true
      });
      playDing();
    } catch (err) {
      if (err?.name === 'AbortError') {
        updateJob(jobId, { status: 'error', error: 'Download cancelled by user' });
      } else {
        console.error('YouTube download error:', err);
        const message = err?.message || 'Failed to download YouTube stream.';
        setErrorMsg(message);
        updateJob(jobId, { status: 'error', error: message });
      }
    } finally {
      if (ffmpeg) {
        try {
          await ffmpeg.deleteFile(videoInputName);
        } catch {
          // ignore
        }
        try {
          await ffmpeg.deleteFile(audioInputName);
        } catch {
          // ignore
        }
        try {
          await ffmpeg.deleteFile(outputFileName);
        } catch {
          // ignore
        }
        try {
          ffmpeg.terminate();
        } catch {
          // ignore
        }
      }
      setDownloading(false);
      abortControllerRef.current = null;
    }
  };

  const selectedVideoOption =
    videoInfo?.videoOptions?.find((v) => v.id === selectedVideoId) ||
    videoInfo?.videoOptions?.[0];

  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}
    >
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <PlayCircleIcon style={{ width: 34, height: 34, color: 'var(--accent-color)' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem' }}>YouTube Downloader</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Paste any YouTube link to download full 1080p HD MP4 videos or audio tracks safely in your browser — no popups, redirects, or re-encoding loss.
            </p>
          </div>
        </div>
      </div>

      {/* Safe Client-Side Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '0.75rem 1.1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(64, 224, 208, 0.06)',
          border: '1px solid rgba(64, 224, 208, 0.25)',
          fontSize: '0.84rem',
          color: 'var(--text-secondary)'
        }}
      >
        <ShieldCheckIcon style={{ width: 20, height: 20, color: 'var(--accent-color)', flexShrink: 0 }} />
        <span>
          <strong style={{ color: 'var(--text-primary)' }}>100% Safe & Ad-Free:</strong> YouTube serves 1080p video and audio as separate streams. WebTools fetches both streams directly and losslessly merges them (<code style={{ fontSize: '0.78rem' }}>-c:v copy -c:a copy</code>) right on your device using WebAssembly FFmpeg.
        </span>
      </div>

      {/* URL Input Card */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleResolveVideo();
          }}
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: '260px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <PlayCircleIcon
              style={{
                width: 20,
                height: 20,
                position: 'absolute',
                left: '12px',
                color: 'var(--text-secondary)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Paste YouTube URL (e.g. https://www.youtube.com/watch?v=... or youtu.be/...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={resolving || downloading}
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: urlInput ? '2.2rem' : '0.75rem',
                fontSize: '0.95rem'
              }}
            />
            {urlInput && !resolving && !downloading && (
              <button
                type="button"
                onClick={() => {
                  setUrlInput('');
                  setErrorMsg('');
                }}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex'
                }}
                title="Clear link"
              >
                <XMarkIcon style={{ width: 18, height: 18 }} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn"
            onClick={handlePasteFromClipboard}
            disabled={resolving || downloading}
            style={{
              padding: '0.6rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)'
            }}
            title="Paste YouTube URL from clipboard"
          >
            <ClipboardIcon style={{ width: 17, height: 17, color: 'var(--accent-color)' }} />
            Paste Link
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={resolving || downloading || !urlInput.trim()}
            style={{
              padding: '0.6rem 1.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: '145px',
              justifyContent: 'center'
            }}
          >
            {resolving ? (
              <>
                <ArrowPathIcon className="spin" style={{ width: 18, height: 18 }} />
                Fetching...
              </>
            ) : (
              <>
                <FilmIcon style={{ width: 18, height: 18 }} />
                Load Video
              </>
            )}
          </button>
        </form>

        {/* Sample Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}
        >
          <span>Try sample video:</span>
          {SAMPLE_YOUTUBE_VIDEOS.map((sample) => (
            <button
              key={sample.url}
              type="button"
              className="btn"
              disabled={resolving || downloading}
              onClick={() => handleResolveVideo(sample.url)}
              style={{
                padding: '0.2rem 0.65rem',
                fontSize: '0.75rem',
                background: 'var(--bg-tertiary)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}
            >
              {sample.name}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid var(--danger-color, #ef4444)',
              borderRadius: 'var(--border-radius-sm)',
              color: '#f87171',
              fontSize: '0.85rem'
            }}
          >
            {errorMsg}
          </div>
        )}
      </div>

      {/* Loaded Video Metadata & Quality Controls */}
      {videoInfo && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Video Overview */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '1.5rem',
              alignItems: 'start'
            }}
          >
            {/* Thumbnail Preview */}
            <div
              style={{
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                backgroundColor: '#000',
                aspectRatio: '16 / 9'
              }}
            >
              <img
                src={videoInfo.thumbnailUrl}
                onError={(e) => {
                  if (e.currentTarget.src !== videoInfo.fallbackThumbnailUrl) {
                    e.currentTarget.src = videoInfo.fallbackThumbnailUrl;
                  }
                }}
                alt={videoInfo.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {videoInfo.lengthSeconds > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.82)',
                    color: '#fff',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                >
                  {formatDuration(videoInfo.lengthSeconds)}
                </span>
              )}
            </div>

            {/* Video Metadata & Mode Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.25rem', lineHeight: 1.35 }}>
                  {videoInfo.title}
                </h2>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <span>
                    Channel: <strong style={{ color: 'var(--text-primary)' }}>{videoInfo.author}</strong>
                  </span>
                  {videoInfo.viewCount > 0 && (
                    <span>• {videoInfo.viewCount.toLocaleString()} views</span>
                  )}
                  {videoInfo.publishedText && <span>• {videoInfo.publishedText}</span>}
                </div>
              </div>

              {/* Download Type Toggle (Video MP4 vs Audio Only vs Thumbnail) */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn ${downloadMode === 'video' ? 'btn-primary' : ''}`}
                  disabled={downloading}
                  onClick={() => setDownloadMode('video')}
                  style={{
                    fontSize: '0.83rem',
                    padding: '0.45rem 0.9rem',
                    background: downloadMode === 'video' ? undefined : 'var(--bg-tertiary)',
                    border: downloadMode === 'video' ? undefined : '1px solid var(--border-color)'
                  }}
                >
                  <FilmIcon style={{ width: 16, height: 16 }} />
                  Video + Audio (.MP4)
                </button>

                <button
                  type="button"
                  className={`btn ${downloadMode === 'audio' ? 'btn-primary' : ''}`}
                  disabled={downloading}
                  onClick={() => setDownloadMode('audio')}
                  style={{
                    fontSize: '0.83rem',
                    padding: '0.45rem 0.9rem',
                    background: downloadMode === 'audio' ? undefined : 'var(--bg-tertiary)',
                    border: downloadMode === 'audio' ? undefined : '1px solid var(--border-color)'
                  }}
                >
                  <MusicalNoteIcon style={{ width: 16, height: 16 }} />
                  Audio Only (.M4A / .MP3)
                </button>

                <button
                  type="button"
                  className="btn"
                  disabled={downloading}
                  onClick={handleDownloadThumbnail}
                  style={{
                    fontSize: '0.83rem',
                    padding: '0.45rem 0.9rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)'
                  }}
                  title="Download Max-Resolution Video Thumbnail"
                >
                  <PhotoIcon style={{ width: 16, height: 16, color: 'var(--accent-color)' }} />
                  Save Thumbnail
                </button>
              </div>

              {/* Quality Selection Grid */}
              {downloadMode === 'video' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Select Resolution & Quality (1080p Recommended):
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
                      gap: '0.6rem'
                    }}
                  >
                    {videoInfo.videoOptions.map((opt) => {
                      const isSelected = selectedVideoOption?.id === opt.id;
                      const is1080 = opt.height === 1080;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={downloading}
                          onClick={() => setSelectedVideoId(opt.id)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '0.2rem',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            cursor: downloading ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            background: isSelected
                              ? 'rgba(64, 224, 208, 0.14)'
                              : 'var(--bg-tertiary)',
                            border: isSelected
                              ? '1.5px solid var(--accent-color)'
                              : '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                              {opt.qualityLabel}
                            </span>
                            {is1080 && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '4px',
                                  background: 'var(--accent-color)',
                                  color: '#000',
                                  fontWeight: 700
                                }}
                              >
                                FULL HD
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                            {opt.container.toUpperCase()} • {opt.codec} • {opt.fps}fps
                          </span>
                          {opt.totalEstimatedBytes > 0 && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--accent-color)' }}>
                              ~{formatBytes(opt.totalEstimatedBytes, 1)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Select Audio Format:
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {[
                      { id: 'm4a', title: 'M4A (Original AAC)', desc: 'Instant direct stream • Zero quality loss' },
                      { id: 'mp3', title: 'MP3 (Universal)', desc: 'High-bitrate LAME MP3 transcode via FFmpeg' }
                    ].map((fmt) => {
                      const active = audioFormat === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          disabled={downloading}
                          onClick={() => setAudioFormat(fmt.id)}
                          style={{
                            flex: 1,
                            minWidth: '180px',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px',
                            textAlign: 'left',
                            cursor: downloading ? 'not-allowed' : 'pointer',
                            background: active ? 'rgba(64, 224, 208, 0.14)' : 'var(--bg-tertiary)',
                            border: active ? '1.5px solid var(--accent-color)' : '1px solid var(--border-color)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{fmt.title}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{fmt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Optional Clip Trimmer */}
              <div
                style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.83rem',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={enableTrim}
                    disabled={downloading}
                    onChange={(e) => setEnableTrim(e.target.checked)}
                  />
                  <ScissorsIcon style={{ width: 15, height: 15, color: 'var(--accent-color)' }} />
                  <span>Trim specific clip range before saving (optional)</span>
                </label>

                {enableTrim && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Start:</span>
                      <input
                        type="text"
                        className="input-field"
                        value={trimStart}
                        onChange={(e) => setTrimStart(e.target.value)}
                        placeholder="0:00"
                        style={{ width: '90px', padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>End:</span>
                      <input
                        type="text"
                        className="input-field"
                        value={trimEnd}
                        onChange={(e) => setTrimEnd(e.target.value)}
                        placeholder={videoInfo.lengthSeconds ? formatDuration(videoInfo.lengthSeconds) : '1:30'}
                        style={{ width: '90px', padding: '0.3rem 0.5rem', fontSize: '0.82rem' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      Format: <code style={{ fontSize: '0.72rem' }}>MM:SS</code> or <code style={{ fontSize: '0.72rem' }}>HH:MM:SS</code>
                    </span>
                  </div>
                )}
              </div>

              {/* Primary Download Button / Active Progress Bar */}
              {!downloading ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStartDownload}
                  style={{
                    padding: '0.85rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem'
                  }}
                >
                  <ArrowDownTrayIcon style={{ width: 20, height: 20 }} />
                  {downloadMode === 'audio'
                    ? `Download Audio (.${audioFormat.toUpperCase()})`
                    : `Download ${selectedVideoOption?.qualityLabel || '1080p'} Video (.${
                        selectedVideoOption?.isMp4 ? 'MP4' : 'WEBM'
                      })`}
                </button>
              ) : (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--accent-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {progressPhase}
                    </span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-color)' }}>
                      {progressPercent}%
                    </span>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      height: '10px',
                      background: 'var(--bg-primary)',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progressPercent}%`,
                        background: 'var(--accent-color)',
                        transition: 'width 0.2s ease'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {progressDetail}
                    </span>
                    <button
                      type="button"
                      className="btn"
                      onClick={handleCancelDownload}
                      style={{
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.76rem',
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.35)'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completed Video Player & Pipeline Card */}
      {completedUrl && completedFile && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            padding: '1.5rem',
            border: '1px solid var(--accent-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircleIcon style={{ width: 24, height: 24, color: 'var(--accent-color)' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Download Complete!</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {completedFilename} • {formatBytes(completedFile.size)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {completedMediaType === 'video' && (
                <SendToDropdown videoFile={completedFile} mediaType="video" />
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  downloadBlob(completedFile, completedFilename, {
                    skipHistory: true
                  })
                }
                style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
              >
                <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
                Save File Again
              </button>
            </div>
          </div>

          {completedMediaType === 'video' ? (
            <div
              style={{
                width: '100%',
                maxWidth: '780px',
                margin: '0 auto',
                borderRadius: '8px',
                overflow: 'hidden',
                background: '#000',
                border: '1px solid var(--border-color)'
              }}
            >
              <video
                src={completedUrl}
                controls
                style={{ width: '100%', maxHeight: '460px', display: 'block' }}
              />
            </div>
          ) : (
            <audio src={completedUrl} controls style={{ width: '100%' }} />
          )}
        </div>
      )}
    </div>
  );
}

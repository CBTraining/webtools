import {
  extractYouTubeVideoId as extractId,
  fetchYouTubeVideoInfo,
  buildCompanionStreamUrl,
  COMPANION_HOSTS
} from '../YoutubeDownloader/youtubeService';

export function extractYouTubeVideoId(url) {
  return extractId(url);
}

export async function fetchYouTubeVideoStream(youtubeUrl, videoId) {
  const resolvedId = videoId || extractId(youtubeUrl);
  if (!resolvedId) {
    throw new Error('Invalid YouTube URL.');
  }

  try {
    const info = await fetchYouTubeVideoInfo(resolvedId);
    const hosts = info.companionHosts?.length ? info.companionHosts : COMPANION_HOSTS;
    const preferred =
      info.videoOptions.find((v) => v.height === 1080 && v.isMp4) ||
      info.videoOptions.find((v) => v.isMp4) ||
      info.videoOptions[0];
    const itag = preferred?.itag || '137';
    return buildCompanionStreamUrl(hosts[0], resolvedId, itag);
  } catch (e) {
    console.warn('Video info lookup fallback to direct companion stream:', e);
    return buildCompanionStreamUrl(COMPANION_HOSTS[0], resolvedId, '137');
  }
}

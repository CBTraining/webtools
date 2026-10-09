export function extractYouTubeVideoId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export async function fetchYouTubeVideoStream(youtubeUrl, videoId) {
  // Strategy 1: Try Cobalt API
  try {
    const res = await fetch('https://api.cobalt.tools/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: youtubeUrl,
        videoQuality: '1080'
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch (e) {
    console.warn("Cobalt API failed", e);
  }

  // Strategy 2: Try Piped API
  try {
    const res = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.videoStreams && data.videoStreams.length > 0) {
        const mp4Streams = data.videoStreams.filter(s => s.mimeType?.includes('mp4') || s.format === 'v1080p' || s.format === 'v720p');
        const bestStream = mp4Streams[0] || data.videoStreams[0];
        if (bestStream?.url) return bestStream.url;
      }
    }
  } catch (e) {
    console.warn("Piped API failed", e);
  }

  // Strategy 3: Try Invidious API instances
  const invidiousInstances = ['https://invidious.drgns.space', 'https://inv.privacydev.net'];
  for (const instance of invidiousInstances) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.formatStreams && data.formatStreams.length > 0) {
          const mp4 = data.formatStreams.find(s => s.container === 'mp4') || data.formatStreams[0];
          if (mp4?.url) return mp4.url;
        }
      }
    } catch (e) {
      console.warn(`Invidious instance ${instance} failed`, e);
    }
  }

  throw new Error("Unable to resolve direct video stream for this YouTube link. Please ensure the video is public.");
}

// 📁 LOCATION: app/api/youtube/route.js
export const revalidate = 300;

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Token error: ' + JSON.stringify(data));
  return data.access_token;
}

export async function GET() {
  const apiKey    = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey)    return Response.json({ error: 'YOUTUBE_API_KEY not set' },    { status: 500 });
  if (!channelId) return Response.json({ error: 'YOUTUBE_CHANNEL_ID not set' }, { status: 500 });

  // OAuth token lo — fail hone pe sirf API key se chalo
  let authHeader = {};
  try {
    const token = await getAccessToken();
    authHeader = { Authorization: `Bearer ${token}` };
  } catch (e) {
    console.warn('OAuth skip:', e.message);
  }

  try {
    // ── Channel ──────────────────────────────────────────
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet,statistics&id=${channelId}&key=${apiKey}`,
      { headers: authHeader }
    );
    const channelData = await channelRes.json();

    if (!channelData.items?.length) {
      return Response.json({ error: 'Channel not found.' }, { status: 404 });
    }

    const channel           = channelData.items[0];
    const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
    const channelName       = channel.snippet?.title || '';
    const channelThumb      = channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url || '';
    const channelId_out     = channel.id || channelId;
    const subscriberCount   = channel.statistics?.subscriberCount || '0';
    const videoCount        = channel.statistics?.videoCount || '0';

    // ── Playlist items ────────────────────────────────────
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`,
      { headers: authHeader }
    );
    const playlistData = await playlistRes.json();
    const videoIds = playlistData.items?.map(item => item.contentDetails.videoId).join(',') || '';

    if (!videoIds) {
      return Response.json({ channelId: channelId_out, channelName, channelThumb, subscriberCount, videoCount, videos: [] });
    }

    // ── Video stats ───────────────────────────────────────
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails,status&id=${videoIds}&key=${apiKey}`,
      { headers: authHeader }
    );
    const statsData = await statsRes.json();

    function parseDuration(iso) {
      if (!iso) return 0;
      const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!m) return 0;
      return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
    }

    const videos = statsData.items?.map(v => {
      const durationSec   = parseDuration(v.contentDetails?.duration);
      const isShort       = durationSec > 0 && durationSec <= 60;
      const privacyStatus = v.status?.privacyStatus || 'public';
      const publishAt     = v.status?.publishAt || null;
      const isScheduled   = privacyStatus === 'private' && !!publishAt;
      return {
        videoId:       v.id,
        title:         v.snippet.title,
        description:   v.snippet.description,
        thumbnail:     v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || '',
        publishedAt:   v.snippet.publishedAt,
        viewCount:     parseInt(v.statistics?.viewCount  || '0'),
        likeCount:     parseInt(v.statistics?.likeCount  || '0'),
        durationSec,
        isShort,
        privacyStatus,
        isScheduled,
        scheduledAt: publishAt,
      };
    }) || [];

    return Response.json({
      channelId: channelId_out,
      channelName,
      channelThumb,
      subscriberCount,
      videoCount,
      videos,
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

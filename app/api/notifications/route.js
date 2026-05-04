// 📁 LOCATION: app/api/notifications/route.js
export const revalidate = 0;

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
  if (!data.access_token) throw new Error('Token refresh failed');
  return data.access_token;
}

export async function GET() {
  const apiKey    = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) return Response.json({ error: 'Missing env vars' }, { status: 500 });

  try {
    // OAuth token for like count
    let accessToken = null;
    try { accessToken = await getAccessToken(); } catch {}

    // Channel stats
    const channelRes  = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&id=${channelId}&key=${apiKey}`);
    const channelData = await channelRes.json();
    const stats       = channelData.items?.[0]?.statistics || {};
    const uploadsId   = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    // Latest 10 videos
    const playlistRes  = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=10&key=${apiKey}`);
    const playlistData = await playlistRes.json();
    const videoIds     = playlistData.items?.map(i => i.contentDetails.videoId).join(',') || '';

    // Public stats
    const statsRes  = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`);
    const statsData = await statsRes.json();

    // OAuth stats — like count
    let likeMap = {};
    if (accessToken && videoIds) {
      try {
        const authRes  = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const authData = await authRes.json();
        for (const v of authData.items || []) {
          likeMap[v.id] = parseInt(v.statistics?.likeCount || 0);
        }
      } catch {}
    }

    const notifications = [];

    for (const video of statsData.items || []) {
      const title        = video.snippet?.title?.substring(0, 45) || '';
      const commentCount = parseInt(video.statistics?.commentCount || 0);
      const likeCount    = likeMap[video.id] ?? parseInt(video.statistics?.likeCount || 0);
      const publishedAt  = video.snippet?.publishedAt;

      // ── Like notification — har video ke liye ──────
      if (likeCount > 0) {
        notifications.push({
          id:      `like_${video.id}`,
          type:    'like',
          icon:    '❤️',
          title:   `${likeCount} Like${likeCount > 1 ? 's' : ''}!`,
          body:    `"${title}..." ko ${likeCount} like${likeCount > 1 ? 's' : ''} mile 🔥`,
          videoId: video.id,
          time:    publishedAt,
          read:    false,
        });
      }

      // ── Comment notification — har video ke liye ───
      if (commentCount > 0) {
        notifications.push({
          id:      `comment_${video.id}`,
          type:    'comment',
          icon:    '💬',
          title:   `${commentCount} Comment${commentCount > 1 ? 's' : ''}!`,
          body:    `"${title}..." pe ${commentCount} comment${commentCount > 1 ? 's' : ''} aaye`,
          videoId: video.id,
          time:    publishedAt,
          read:    false,
        });
      }

      // Views notification removed
    }

    // ── Subscriber count ───────────────────────────
    const subs = parseInt(stats.subscriberCount || 0);
    if (subs > 0) {
      notifications.push({
        id:    `subscribers`,
        type:  'subscriber',
        icon:  '👥',
        title: `${subs >= 1000 ? (subs/1000).toFixed(1)+'K' : subs} Subscribers`,
        body:  `Channel pe abhi ${subs >= 1000 ? (subs/1000).toFixed(1)+'K' : subs} subscribers hain! 🎊`,
        time:  Date.now(),
        read:  false,
      });
    }

    return Response.json({ notifications: notifications.slice(0, 25) });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

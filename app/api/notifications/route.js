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
    // OAuth token — like count ke liye
    let accessToken = null;
    try { accessToken = await getAccessToken(); } catch {}

    // Channel stats
    const channelRes  = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&id=${channelId}&key=${apiKey}`);
    const channelData = await channelRes.json();
    const stats       = channelData.items?.[0]?.statistics || {};
    const uploadsId   = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    // Latest videos
    const playlistRes  = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=10&key=${apiKey}`);
    const playlistData = await playlistRes.json();
    const videoIds     = playlistData.items?.map(i => i.contentDetails.videoId).join(',') || '';

    // Public stats (views, comments)
    const statsRes  = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`);
    const statsData = await statsRes.json();

    // OAuth stats (like count) — authenticated request
    let likeMap = {}; // videoId → likeCount
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
    const now = Date.now();

    for (const video of statsData.items || []) {
      const title        = video.snippet?.title?.substring(0, 40) || '';
      const commentCount = parseInt(video.statistics?.commentCount || 0);
      const views        = parseInt(video.statistics?.viewCount    || 0);
      const likeCount    = likeMap[video.id] ?? parseInt(video.statistics?.likeCount || 0);

      // ── Comments ───────────────────────────────────
      if (commentCount > 0) {
        notifications.push({
          id:      `comment_${video.id}`,
          type:    'comment',
          icon:    '💬',
          title:   'Naya Comment!',
          body:    `"${title}..." pe ${commentCount} comment${commentCount > 1 ? 's' : ''}`,
          videoId: video.id,
          time:    video.snippet?.publishedAt,
          read:    false,
        });
      }

      // ── Likes (OAuth se milega) ────────────────────
      if (likeCount > 0) {
        const likeMilestones = [10, 50, 100, 500, 1000, 5000, 10000];
        for (const m of likeMilestones) {
          if (likeCount >= m && likeCount < m * 2) {
            notifications.push({
              id:      `like_${video.id}_${m}`,
              type:    'like',
              icon:    '❤️',
              title:   `${m >= 1000 ? (m/1000)+'K' : m} Likes!`,
              body:    `"${title}..." ko ${m >= 1000 ? (m/1000)+'K' : m} likes mil gaye! 🔥`,
              videoId: video.id,
              time:    now,
              read:    false,
            });
            break;
          }
        }
      }

      // ── View milestones ────────────────────────────
      const viewMilestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
      for (const m of viewMilestones) {
        if (views >= m && views < m * 2) {
          notifications.push({
            id:      `milestone_${video.id}_${m}`,
            type:    'milestone',
            icon:    '🎉',
            title:   `${m >= 1000 ? (m/1000)+'K' : m} Views!`,
            body:    `"${title}..." ne ${m >= 1000 ? (m/1000)+'K' : m} views cross kiye!`,
            videoId: video.id,
            time:    now,
            read:    false,
          });
          break;
        }
      }
    }

    // ── Subscriber milestones ──────────────────────
    const subs          = parseInt(stats.subscriberCount || 0);
    const subMilestones = [100, 500, 1000, 5000, 10000];
    for (const m of subMilestones) {
      if (subs >= m && subs < m + 50) {
        notifications.push({
          id:    `sub_milestone_${m}`,
          type:  'subscriber',
          icon:  '👥',
          title: `${m >= 1000 ? (m/1000)+'K' : m} Subscribers!`,
          body:  `Channel ne ${m >= 1000 ? (m/1000)+'K' : m} subscribers cross kiye! 🎊`,
          time:  now,
          read:  false,
        });
        break;
      }
    }

    return Response.json({ notifications: notifications.slice(0, 20) });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

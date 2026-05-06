// 📁 LOCATION: app/api/audit/route.js
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
  if (!data.access_token) throw new Error('Token error: ' + JSON.stringify(data));
  return data.access_token;
}

export async function GET() {
  const apiKey    = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey)    return Response.json({ error: 'YOUTUBE_API_KEY not set' },    { status: 500 });
  if (!channelId) return Response.json({ error: 'YOUTUBE_CHANNEL_ID not set' }, { status: 500 });

  let accessToken = null;
  try { accessToken = await getAccessToken(); }
  catch (e) { console.warn('OAuth fail, API key fallback:', e.message); }

  function buildUrl(base) {
    return accessToken ? base : `${base}${base.includes('?') ? '&' : '?'}key=${apiKey}`;
  }
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  try {
    // ── Channel info ──────────────────────────────────────
    const channelRes  = await fetch(
      buildUrl(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet,statistics&id=${channelId}`),
      { headers }
    );
    const channelData = await channelRes.json();
    if (!channelData.items?.length) return Response.json({ error: 'Channel not found.' }, { status: 404 });

    const channel           = channelData.items[0];
    const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
    const channelName       = channel.snippet?.title || '';
    const channelThumb      = channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url || '';
    const subscriberCount   = channel.statistics?.subscriberCount || '0';
    const videoCount        = channel.statistics?.videoCount || '0';

    // ── Playlist items ────────────────────────────────────
    const playlistRes  = await fetch(
      buildUrl(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50`),
      { headers }
    );
    const playlistData = await playlistRes.json();
    const videoIds     = playlistData.items?.map(i => i.contentDetails.videoId).join(',') || '';
    if (!videoIds) return Response.json({ channelId, channelName, channelThumb, subscriberCount, videoCount, videos: [] });

    // ── Video details — tags bhi lenge ────────────────────
    const statsRes  = await fetch(
      buildUrl(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails,status&id=${videoIds}`),
      { headers }
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
      const tags          = v.snippet?.tags || [];
      const title         = v.snippet?.title || '';
      const description   = v.snippet?.description || '';
      const thumbnail     = v.snippet?.thumbnails?.maxres?.url || v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || '';

      // ── Audit scoring ─────────────────────────────────
      const issues = [];

      // Tags check
      if (tags.length === 0)       issues.push({ type: 'tags',        severity: 'high',   msg: 'Koi tags nahi hain' });
      else if (tags.length < 5)    issues.push({ type: 'tags',        severity: 'medium', msg: `Sirf ${tags.length} tags — kam se kam 10 hone chahiye` });

      // Title check
      if (title.length < 30)       issues.push({ type: 'title',       severity: 'medium', msg: 'Title bahut chhota hai (30+ chars better)' });
      if (title.length > 100)      issues.push({ type: 'title',       severity: 'low',    msg: 'Title bahut lamba hai' });
      if (!/[|•\-–:]/.test(title)) issues.push({ type: 'title',       severity: 'low',    msg: 'Title mein separator nahi (| ya - se CTR badhta hai)' });

      // Description check
      if (description.length === 0)      issues.push({ type: 'description', severity: 'high',   msg: 'Description bilkul khaali hai' });
      else if (description.length < 150) issues.push({ type: 'description', severity: 'medium', msg: 'Description bahut chhoti hai (150+ chars recommended)' });

      // Thumbnail check
      if (!thumbnail) issues.push({ type: 'thumbnail', severity: 'high', msg: 'Thumbnail nahi mili' });

      // Score: 100 se issues ka penalty
      const penalty = issues.reduce((acc, i) => acc + (i.severity === 'high' ? 30 : i.severity === 'medium' ? 15 : 7), 0);
      const score   = Math.max(0, 100 - penalty);

      return {
        videoId:      v.id,
        title,
        description,
        thumbnail,
        publishedAt:  v.snippet?.publishedAt,
        viewCount:    parseInt(v.statistics?.viewCount  || '0'),
        likeCount:    parseInt(v.statistics?.likeCount  || '0'),
        durationSec,
        isShort,
        tags,
        issues,
        score,
        privacyStatus: v.status?.privacyStatus || 'public',
        // ── categoryId preserve karne ke liye ──
        categoryId: v.snippet?.categoryId || '22',
        defaultLanguage: v.snippet?.defaultLanguage || '',
      };
    }) || [];

    // Sort by worst score first
    videos.sort((a, b) => a.score - b.score);

    return Response.json({
      channelId,
      channelName,
      channelThumb,
      subscriberCount,
      videoCount,
      videos,
      oauthActive: !!accessToken,
      fetchedAt: new Date().toISOString(),
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ── PATCH: YouTube video title/description/tags directly update ──
export async function PATCH(request) {
  try {
    const { videoId, title, description, tags, categoryId } = await request.json();

    if (!videoId) return Response.json({ error: 'videoId required' }, { status: 400 });
    if (!title?.trim()) return Response.json({ error: 'Title khaali nahi ho sakta' }, { status: 400 });

    // OAuth token REQUIRED for updates
    let accessToken;
    try {
      accessToken = await getAccessToken();
    } catch (e) {
      return Response.json({ error: 'OAuth token nahi mila — update ke liye OAuth zaroori hai' }, { status: 401 });
    }

    // Tags string → array clean karo
    const tagsArray = tags
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const body = {
      id: videoId,
      snippet: {
        title:       title.trim(),
        description: description?.trim() || '',
        tags:        tagsArray,
        categoryId:  categoryId || '22', // 22 = People & Blogs (YouTube default)
      },
    };

    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/videos?part=snippet',
      {
        method:  'PUT',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message || data?.error?.errors?.[0]?.message || 'YouTube update fail';
      return Response.json({ error: errMsg }, { status: res.status });
    }

    return Response.json({
      success:     true,
      message:     '✅ YouTube pe update ho gaya!',
      updatedTitle: data.snippet?.title,
      tagsCount:   data.snippet?.tags?.length || 0,
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// 📁 LOCATION: app/api/comments/route.js
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
  if (!data.access_token) throw new Error('Token refresh failed: ' + JSON.stringify(data));
  return data.access_token;
}

export async function GET() {
  const apiKey    = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) return Response.json({ error: 'Missing env vars' }, { status: 500 });

  try {
    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`);
    const channelData = await channelRes.json();
    const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return Response.json({ error: 'Uploads not found' }, { status: 404 });

    const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsId}&maxResults=20&key=${apiKey}`);
    const playlistData = await playlistRes.json();
    const videoItems = playlistData.items || [];

    const allComments = [];
    for (const videoItem of videoItems.slice(0, 10)) {
      const videoId    = videoItem.contentDetails.videoId;
      const videoTitle = videoItem.snippet?.title || '';
      try {
        const commRes = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=time&key=${apiKey}`);
        const commData = await commRes.json();
        for (const item of commData.items || []) {
          const top        = item.snippet?.topLevelComment?.snippet;
          const replyCount = item.snippet?.totalReplyCount || 0;
          if (replyCount === 0) {
            allComments.push({
              commentId:   item.id,
              videoId,
              videoTitle,
              author:      top?.authorDisplayName || '',
              authorPhoto: top?.authorProfileImageUrl || '',
              text:        top?.textDisplay || '',
              likeCount:   top?.likeCount || 0,
              publishedAt: top?.publishedAt || '',
            });
          }
        }
      } catch {}
    }

    allComments.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return Response.json({ comments: allComments });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { commentId, text } = await request.json();
    if (!commentId || !text) return Response.json({ error: 'commentId and text required' }, { status: 400 });

    const accessToken = await getAccessToken();

    const res = await fetch('https://www.googleapis.com/youtube/v3/comments?part=snippet', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        snippet: {
          parentId:     commentId,
          textOriginal: text,
        }
      }),
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: data?.error?.message || 'Reply failed' }, { status: res.status });
    return Response.json({ success: true });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

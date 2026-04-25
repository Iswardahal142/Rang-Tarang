// 📁 LOCATION: app/api/comments/route.js
export const revalidate = 0;

export async function GET() {
  const apiKey    = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) return Response.json({ error: 'Missing env vars' }, { status: 500 });

  try {
    // Get latest 20 videos
    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`);
    const channelData = await channelRes.json();
    const uploadsId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return Response.json({ error: 'Uploads not found' }, { status: 404 });

    const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsId}&maxResults=20&key=${apiKey}`);
    const playlistData = await playlistRes.json();
    const videoIds = playlistData.items?.map(i => i.contentDetails.videoId) || [];

    // Fetch comments for each video (unreplied only)
    const allComments = [];
    for (const videoId of videoIds.slice(0, 10)) {
      try {
        const commRes = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=time&key=${apiKey}`);
        const commData = await commRes.json();
        const items = commData.items || [];
        for (const item of items) {
          const topComment = item.snippet?.topLevelComment?.snippet;
          const replyCount = item.snippet?.totalReplyCount || 0;
          if (replyCount === 0) {
            allComments.push({
              commentId:   item.id,
              videoId,
              videoTitle:  playlistData.items?.find(p => p.contentDetails.videoId === videoId)?.snippet?.title || '',
              author:      topComment?.authorDisplayName || '',
              authorPhoto: topComment?.authorProfileImageUrl || '',
              text:        topComment?.textDisplay || '',
              likeCount:   topComment?.likeCount || 0,
              publishedAt: topComment?.publishedAt || '',
            });
          }
        }
      } catch {}
    }

    // Sort by newest first
    allComments.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return Response.json({ comments: allComments });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return Response.json({ error: 'Missing API key' }, { status: 500 });

  try {
    const { commentId, text } = await request.json();
    if (!commentId || !text) return Response.json({ error: 'commentId and text required' }, { status: 400 });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/comments?part=snippet&key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.YOUTUBE_OAUTH_TOKEN}` },
      body: JSON.stringify({
        snippet: {
          parentId: commentId,
          textOriginal: text,
        }
      })
    });
    const data = await res.json();
    if (!res.ok) return Response.json({ error: data?.error?.message || 'Reply failed' }, { status: res.status });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

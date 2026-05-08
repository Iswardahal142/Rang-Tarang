export async function PUT(req) {
  try {
    const { videoId, title, description, tags } = await req.json();
    if (!videoId) return Response.json({ error: 'videoId required' }, { status: 400 });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
        grant_type:    'refresh_token',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Token error');

    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: videoId,
        snippet: {
          title,
          description,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          categoryId: '27',
        },
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return Response.json({ success: true, message: '✅ YouTube update ho gaya!' });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

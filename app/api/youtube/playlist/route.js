// 📁 LOCATION: app/api/youtube/playlist/route.js

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

async function findOrCreatePlaylist(token, title) {
  // Existing playlists fetch karo
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();

  // Same title wali playlist hai kya?
  const existing = data.items?.find(p =>
    p.snippet.title.toLowerCase() === title.toLowerCase()
  );
  if (existing) return { id: existing.id, created: false };

  // Nahi hai toh banao
  const createRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet,status`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snippet: {
          title,
          description: `Rang Tarang — ${title}`,
        },
        status: { privacyStatus: 'public' },
      }),
    }
  );
  const created = await createRes.json();
  if (created.error) throw new Error(created.error.message);
  return { id: created.id, created: true };
}

// ── GET: Saari playlists fetch karo ──
export async function GET() {
  try {
    const token = await getAccessToken();
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    const playlists = data.items?.map(p => ({
      id: p.id,
      title: p.snippet.title,
      thumbnail: p.snippet.thumbnails?.medium?.url || '',
    })) || [];
    return Response.json({ playlists });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// ── POST: Video ko playlist mein add karo (auto create if needed) ──
export async function POST(req) {
  try {
    const { videoId, playlistTitle } = await req.json();
    if (!videoId || !playlistTitle) {
      return Response.json({ error: 'videoId & playlistTitle required' }, { status: 400 });
    }

    const token = await getAccessToken();

    // Playlist dhundo ya banao
    const { id: playlistId, created } = await findOrCreatePlaylist(token, playlistTitle);

    // Video add karo
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snippet: {
            playlistId,
            resourceId: { kind: 'youtube#video', videoId },
          },
        }),
      }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    return Response.json({
      success: true,
      playlistId,
      playlistCreated: created,
      message: created
        ? `✅ Playlist "${playlistTitle}" banayi aur video add kiya!`
        : `✅ Video "${playlistTitle}" playlist mein add ho gaya!`,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

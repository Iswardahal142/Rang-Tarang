// 📁 LOCATION: app/api/audit/update/route.js
// firebase-admin nahi — Firestore REST API use kar rahe hain (no extra dependency)

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
  if (!data.access_token) throw new Error('OAuth token error: ' + JSON.stringify(data));
  return data.access_token;
}

// Firestore REST API se document add karo (firebase-admin ki zaroorat nahi)
async function saveToFirestore({ projectId, uid, videoId, title, tags }) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/audit_updates`;
  const body = {
    fields: {
      videoId:   { stringValue: videoId },
      title:     { stringValue: title },
      tags:      { arrayValue: { values: tags.map(t => ({ stringValue: t })) } },
      updatedAt: { stringValue: new Date().toISOString() },
    },
  };
  // Firestore REST ke liye koi auth nahi chahiye agar rules allow karti hain
  // Agar rules strict hain toh ye silently fail hoga — YouTube update fir bhi hoga
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.warn('Firestore save skipped:', e.message);
  }
}

// POST /api/audit/update
// Body: { videoId, title, tags: string[], uid }
export async function POST(req) {
  try {
    const { videoId, title, tags, uid } = await req.json();

    if (!videoId) return Response.json({ error: 'videoId required' }, { status: 400 });
    if (!title)   return Response.json({ error: 'title required' },   { status: 400 });
    if (!uid)     return Response.json({ error: 'uid required' },     { status: 400 });

    const cleanTags = Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [];

    // ── 1. YouTube OAuth token ──────────────────────────────
    const accessToken = await getAccessToken();

    // ── 2. Current snippet fetch (categoryId + language preserve) ──
    const fetchRes  = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const fetchData = await fetchRes.json();
    if (!fetchData.items?.length) {
      return Response.json({ error: 'Video not found on YouTube' }, { status: 404 });
    }
    const currentSnippet = fetchData.items[0].snippet;

    // ── 3. YouTube update ───────────────────────────────────
    const updateRes = await fetch(
      'https://www.googleapis.com/youtube/v3/videos?part=snippet',
      {
        method: 'PUT',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: videoId,
          snippet: {
            ...currentSnippet,
            title:       title.trim(),
            tags:        cleanTags,
            description: currentSnippet.description,
          },
        }),
      }
    );
    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      return Response.json({ error: updateData.error?.message || 'YouTube update failed' }, { status: 400 });
    }

    // ── 4. Firestore mein save (REST API, no firebase-admin) ──
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
                   || process.env.FIREBASE_PROJECT_ID
                   || 'fir-c929f'; // fallback from firebase.js
    await saveToFirestore({ projectId, uid, videoId, title: title.trim(), tags: cleanTags });

    return Response.json({
      success: true,
      videoId,
      title:  updateData.snippet?.title,
      tags:   updateData.snippet?.tags || [],
    });

  } catch (err) {
    console.error('audit/update error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

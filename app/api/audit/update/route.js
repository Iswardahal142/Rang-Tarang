// 📁 LOCATION: app/api/audit/update/route.js
// Audit page se YouTube title + tags update karo aur Firestore mein bhi save karo

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore }                  from 'firebase-admin/firestore';

function getAdminDB() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

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

// POST /api/audit/update
// Body: { videoId, title, tags: string[], uid }
export async function POST(req) {
  try {
    const { videoId, title, tags, uid } = await req.json();

    if (!videoId) return Response.json({ error: 'videoId required' }, { status: 400 });
    if (!title)   return Response.json({ error: 'title required' },   { status: 400 });
    if (!uid)     return Response.json({ error: 'uid required' },     { status: 400 });

    // ── 1. YouTube OAuth token ──────────────────────────────
    const accessToken = await getAccessToken();

    // ── 2. Pehle current snippet fetch karo (categoryId + language preserve karne ke liye) ──
    const fetchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const fetchData = await fetchRes.json();
    if (!fetchData.items?.length) {
      return Response.json({ error: 'Video not found on YouTube' }, { status: 404 });
    }
    const currentSnippet = fetchData.items[0].snippet;

    // ── 3. YouTube update karo ──────────────────────────────
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
            ...currentSnippet,          // categoryId, defaultLanguage etc preserve
            title:       title.trim(),
            tags:        Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [],
            description: currentSnippet.description, // description unchanged rakhte hain
          },
        }),
      }
    );
    const updateData = await updateRes.json();
    if (!updateRes.ok) {
      return Response.json({ error: updateData.error?.message || 'YouTube update failed' }, { status: 400 });
    }

    // ── 4. Firestore mein bhi save karo — audit_updates collection ──
    // Ye create-series ke rt_series episodes ke saath match karne mein help karega
    const db = getAdminDB();
    await db.collection('users').doc(uid).collection('audit_updates').add({
      videoId,
      title:     title.trim(),
      tags:      Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [],
      updatedAt: new Date().toISOString(),
    });

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

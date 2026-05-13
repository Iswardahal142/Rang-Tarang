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

    const playlistRes  = await fetch(
      buildUrl(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50`),
      { headers }
    );
    const playlistData = await playlistRes.json();
    const videoIds     = playlistData.items?.map(i => i.contentDetails.videoId).join(',') || '';
    if (!videoIds) return Response.json({ channelId, channelName, channelThumb, subscriberCount, videoCount, videos: [] });

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

    // Published kitne din pehle
    function daysSince(isoDate) {
      if (!isoDate) return 999;
      return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
    }

    const allVideos = statsData.items?.map(v => ({
      id:          v.id,
      title:       v.snippet?.title || '',
      tags:        v.snippet?.tags || [],
      description: v.snippet?.description || '',
      publishedAt: v.snippet?.publishedAt,
      durationSec: parseDuration(v.contentDetails?.duration),
      viewCount:   parseInt(v.statistics?.viewCount  || '0'),
      likeCount:   parseInt(v.statistics?.likeCount  || '0'),
      thumbnail:   v.snippet?.thumbnails?.maxres?.url || v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || '',
      privacyStatus: v.status?.privacyStatus || 'public',
      categoryId:  v.snippet?.categoryId || '22',
    })) || [];

    const videos = allVideos.map(v => {
      const issues = [];
      const age    = daysSince(v.publishedAt);
      // YouTube Shorts: 60 seconds tak (inclusive)
      const isShort = v.durationSec > 0 && v.durationSec <= 180;

      // ── 1. TAGS ──
      if (v.tags.length === 0) {
        issues.push({ type: 'tags', severity: 'high', msg: 'Tags bilkul nahi hain — SEO zero hai' });
      } else if (v.tags.length < 8) {
        issues.push({ type: 'tags', severity: 'high', msg: `Sirf ${v.tags.length} tags — kam se kam 12 hone chahiye` });
      } else if (v.tags.length < 12) {
        issues.push({ type: 'tags', severity: 'medium', msg: `${v.tags.length} tags — 12-15 ideal hai` });
      }

      // ── 2. TITLE ──
      if (v.title.length < 25) {
        issues.push({ type: 'title', severity: 'high', msg: 'Title bahut chhota hai — 40-70 chars ideal' });
      } else if (v.title.length < 40) {
        issues.push({ type: 'title', severity: 'medium', msg: 'Title thoda chhota hai — 40-70 chars ideal' });
      }
      if (v.title.length > 100) {
        issues.push({ type: 'title', severity: 'medium', msg: 'Title 100 chars se zyada — trim karo' });
      }
      // Hindi hook missing
      const hasHindiHook = /[^\x00-\x7F]/.test(v.title.split('|')[0]);
      if (!hasHindiHook) {
        issues.push({ type: 'title', severity: 'medium', msg: 'Title mein Hindi hook nahi — CTR kam hoga' });
      }
      // Separator check
      if (!/[|•\-–:]/.test(v.title)) {
        issues.push({ type: 'title', severity: 'low', msg: 'Title mein | ya - separator nahi' });
      }
      // "Rang Tarang" branding check
      if (!v.title.toLowerCase().includes('rang tarang')) {
        issues.push({ type: 'title', severity: 'low', msg: 'Title mein "Rang Tarang" brand name nahi' });
      }

      // ── 3. DESCRIPTION ──
      if (v.description.length === 0) {
        issues.push({ type: 'description', severity: 'high', msg: 'Description bilkul khaali hai' });
      } else if (v.description.length < 100) {
        issues.push({ type: 'description', severity: 'high', msg: 'Description bahut chhoti hai (100+ chars zaroori)' });
      } else if (v.description.length < 250) {
        issues.push({ type: 'description', severity: 'medium', msg: 'Description aur lambi ho sakti hai (250+ better)' });
      }
      // Subscribe link check
      if (!v.description.includes('youtube.com/@') && !v.description.includes('Subscribe')) {
        issues.push({ type: 'description', severity: 'medium', msg: 'Description mein Subscribe link nahi' });
      }
      // Hashtags in description
      if (!v.description.includes('#')) {
        issues.push({ type: 'description', severity: 'low', msg: 'Description mein hashtags nahi (#Shorts #HindiKids etc)' });
      }

      // ── 4. THUMBNAIL ──
      if (!v.thumbnail) {
        issues.push({ type: 'thumbnail', severity: 'high', msg: 'Custom thumbnail nahi mili' });
      }

      // ── 5. VIEWS (age-based) ──
      if (age >= 14 && v.viewCount === 0) {
        issues.push({ type: 'views', severity: 'high', msg: `${age} din mein 0 views — title/thumbnail weak ho sakta hai` });
      } else if (age >= 30 && v.viewCount < 50) {
        issues.push({ type: 'views', severity: 'medium', msg: `1 mahine mein sirf ${v.viewCount} views — re-optimize karo` });
      } else if (age >= 7 && v.viewCount < 10) {
        issues.push({ type: 'views', severity: 'medium', msg: `${age} din mein sirf ${v.viewCount} views — promotion zaroori` });
      }

      // ── 6. LIKES ratio ──
      if (v.viewCount > 20 && v.likeCount === 0) {
        issues.push({ type: 'engagement', severity: 'medium', msg: `${v.viewCount} views pe 0 likes — engagement call-to-action add karo` });
      }

      // ── 7. DURATION ──
      if (v.durationSec === 0) {
        issues.push({ type: 'duration', severity: 'low', msg: 'Duration detect nahi hua' });
      }
      // Long video — very short
      if (!isShort && v.durationSec > 0 && v.durationSec < 60) {
        issues.push({ type: 'duration', severity: 'medium', msg: 'Video 1 min se kam — Short ke roop mein upload karo' });
      }

      // ── 8. SERIES CONSISTENCY ──
      const partMatch = v.title.match(/part\s*(\d+)/i);
      if (partMatch) {
        const partNum = parseInt(partMatch[1]);
        if (partNum > 1) {
          // Core topic words extract karo (|  ke pehle ka part, Part N hatao, short words hatao)
          const coreRaw = v.title
            .split(/[|•\-–:]/)[0]
            .replace(/part\s*\d+/i, '')
            .replace(/[^\w\s\u0900-\u097F]/g, '') // keep Hindi + English + spaces
            .trim()
            .toLowerCase();
          const coreWords = coreRaw.split(/\s+/).filter(w => w.length >= 4);

          if (coreWords.length > 0) {
            const part1 = allVideos.find(other => {
              if (other.id === v.id) return false;
              if (other.title.match(/part\s*[2-9]/i)) return false;
              const otherLower = other.title.toLowerCase();
              // At least 2 core words match karne chahiye
              const matchCount = coreWords.filter(w => otherLower.includes(w)).length;
              return matchCount >= Math.min(2, coreWords.length);
            });

            if (part1) {
              // Dono titles se "Part N" hata ke compare karo — agar significantly alag ho toh issue
              const strip = t => t.replace(/part\s*\d+/i, '').replace(/[|•\-–:]/g, '').toLowerCase().trim();
              const base1 = strip(part1.title);
              const base2 = strip(v.title);
              // Check: base2 ke significant words base1 mein hain ya nahi
              const words2 = base2.split(/\s+/).filter(w => w.length >= 4);
              const overlap = words2.filter(w => base1.includes(w)).length;
              const overlapPct = words2.length > 0 ? overlap / words2.length : 1;

              if (overlapPct < 0.4) {
                issues.push({ type: 'series', severity: 'medium', msg: `Part ${partNum} ka title Part 1 se match nahi karta — series link nahi banegi` });
              }
            }
          }
        }
      }

      // ── Score calculate ──
      const penalty = issues.reduce((acc, i) =>
        acc + (i.severity === 'high' ? 25 : i.severity === 'medium' ? 12 : 5), 0
      );
      const score = Math.max(0, 100 - penalty);

      return {
        videoId: v.id,
        title:   v.title,
        description: v.description,
        thumbnail:   v.thumbnail,
        publishedAt: v.publishedAt,
        viewCount:   v.viewCount,
        likeCount:   v.likeCount,
        durationSec: v.durationSec,
        isShort,
        tags:        v.tags,
        issues,
        score,
        privacyStatus: v.privacyStatus,
        categoryId:    v.categoryId,
      };
    });

    // Worst score pehle
    videos.sort((a, b) => a.score - b.score);

    return Response.json({
      channelId, channelName, channelThumb,
      subscriberCount, videoCount,
      videos,
      oauthActive: !!accessToken,
      fetchedAt: new Date().toISOString(),
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { videoId, title, description, tags, categoryId, uid } = await request.json();

    if (!videoId)       return Response.json({ error: 'videoId required' },            { status: 400 });
    if (!title?.trim()) return Response.json({ error: 'Title khaali nahi ho sakta' }, { status: 400 });

    let accessToken;
    try { accessToken = await getAccessToken(); }
    catch (e) { return Response.json({ error: 'OAuth token nahi mila' }, { status: 401 }); }

    const tagsArray = tags
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const body = {
      id: videoId,
      snippet: {
        title:       title.trim(),
        description: description?.trim() || '',
        tags:        tagsArray,
        categoryId:  categoryId || '22',
      },
    };

    const res = await fetch('https://www.googleapis.com/youtube/v3/videos?part=snippet', {
      method:  'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data?.error?.message || data?.error?.errors?.[0]?.message || 'YouTube update fail';
      return Response.json({ error: errMsg }, { status: res.status });
    }

    // ── Firestore sync: saare rt_* collections mein matching doc update karo ──
    if (uid) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fir-c929f';
      const baseUrl   = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

      // Jis collection mein bhi ytTitle ya name se ye video match kare, update karo
      const COLLECTIONS = ['rt_hindi_series', 'rt_gk_series', 'rt_varnamala', 'rt_series', 'rt_shorts', 'rt_long_video'];

      const titleLower = title.trim().toLowerCase();

      for (const col of COLLECTIONS) {
        try {
          const listRes  = await fetch(`${baseUrl}/users/${uid}/${col}`);
          if (!listRes.ok) continue;
          const listData = await listRes.json();
          const docs     = listData.documents || [];

          for (const docSnap of docs) {
            const fields      = docSnap.fields || {};
            const docYtTitle  = fields.ytTitle?.stringValue  || '';
            const docName     = fields.name?.stringValue     || '';
            const docYtTitleL = docYtTitle.toLowerCase();
            const docNameL    = docName.toLowerCase();

            // Match: agar audit ka updated title aur Firestore ka ytTitle/name overlap kare
            const isMatch =
              (docYtTitleL && (titleLower.includes(docYtTitleL.slice(0, 20)) || docYtTitleL.includes(titleLower.slice(0, 20)))) ||
              (docNameL    && (titleLower.includes(docNameL.slice(0, 15))    || docNameL.includes(titleLower.slice(0, 15))));

            if (!isMatch) continue;

            // Document ID extract karo path se
            const docId      = docSnap.name.split('/').pop();
            const patchUrl   = `${baseUrl}/users/${uid}/${col}/${docId}?updateMask.fieldPaths=ytTitle&updateMask.fieldPaths=ytDescription&updateMask.fieldPaths=ytTags`;
            const tagsString = tagsArray.join(', ');

            await fetch(patchUrl, {
              method:  'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fields: {
                  ytTitle:       { stringValue: title.trim() },
                  ytDescription: { stringValue: description?.trim() || '' },
                  ytTags:        { stringValue: tagsString },
                },
              }),
            });
            // Ek match mil gaya is collection mein — next collection pe jao
            break;
          }
        } catch (e) {
          console.warn(`[audit PATCH] Firestore sync skip (${col}):`, e.message);
        }
      }
    }

    return Response.json({
      success:      true,
      message:      '✅ YouTube pe update ho gaya!',
      updatedTitle: data.snippet?.title,
      tagsCount:    data.snippet?.tags?.length || 0,
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

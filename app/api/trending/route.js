// 📁 LOCATION: app/api/trending/route.js
export const revalidate = 1800; // 30 min cache

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('cat') || '26'; // default: Howto & Style
  const apiKey = process.env.YOUTUBE_TRENDING_API_KEY;

  if (!apiKey) return Response.json({ error: 'YOUTUBE_TRENDING_API_KEY not set' }, { status: 500 });

  const base = (path) => `https://www.googleapis.com/youtube/v3/${path}&key=${apiKey}`;

  try {
    // ── Trending Videos ───────────────────────────────
    const res = await fetch(
      base(`videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=IN&videoCategoryId=${categoryId}&maxResults=50`)
    );
    const data = await res.json();

    if (data.error) return Response.json({ error: data.error.message }, { status: 400 });

    function parseDuration(iso) {
      if (!iso) return 0;
      const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!m) return 0;
      return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
    }

    const videos = (data.items || []).map((v, i) => ({
      rank:        i + 1,
      videoId:     v.id,
      title:       v.snippet.title,
      channelName: v.snippet.channelTitle,
      thumbnail:   v.snippet.thumbnails?.medium?.url || '',
      publishedAt: v.snippet.publishedAt,
      viewCount:   parseInt(v.statistics?.viewCount   || '0'),
      likeCount:   parseInt(v.statistics?.likeCount   || '0'),
      commentCount:parseInt(v.statistics?.commentCount || '0'),
      durationSec: parseDuration(v.contentDetails?.duration),
      isShort:     parseDuration(v.contentDetails?.duration) <= 60,
      tags:        v.snippet?.tags || [],
    }));

    return Response.json({ videos, fetchedAt: new Date().toISOString() });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

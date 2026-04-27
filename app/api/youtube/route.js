// 📁 LOCATION: app/api/youtube/route.js
export const revalidate = 300;

export async function GET() {
  const apiKey    = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey)    return Response.json({ error: 'YOUTUBE_API_KEY not set' }, { status: 500 });
  if (!channelId) return Response.json({ error: 'YOUTUBE_CHANNEL_ID not set' }, { status: 500 });

  try {
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet,statistics&id=${channelId}&key=${apiKey}`
    );
    const channelData = await channelRes.json();

    if (!channelData.items?.length) {
      return Response.json({ error: 'Channel not found.' }, { status: 404 });
    }

    const channel             = channelData.items[0];
    const uploadsPlaylistId   = channel.contentDetails.relatedPlaylists.uploads;
    const channelName         = channel.snippet?.title || '';
    const channelThumb        = channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url || '';
    const channelId_out       = channel.id || channelId;
    const subscriberCount     = channel.statistics?.subscriberCount || '0';
    const videoCount          = channel.statistics?.videoCount || '0';

    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=20&key=${apiKey}`
    );
    const playlistData = await playlistRes.json();
    const videoIds = playlistData.items?.map(item => item.contentDetails.videoId).join(',') || '';

    // Fetch stats + contentDetails for duration
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${apiKey}`
    );
    const statsData = await statsRes.json();

    function parseDuration(iso) {
      if (!iso) return 0;
      const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!m) return 0;
      return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
    }

    const videos = statsData.items?.map(v => {
      const durationSec = parseDuration(v.contentDetails?.duration);
      const isShort = durationSec > 0 && durationSec <= 60;
      return {
        videoId:     v.id,
        title:       v.snippet.title,
        description: v.snippet.description,
        thumbnail:   v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || '',
        publishedAt: v.snippet.publishedAt,
        viewCount:   parseInt(v.statistics.viewCount || '0'),
        likeCount:   parseInt(v.statistics.likeCount || '0'),
        durationSec,
        isShort,
      };
    }) || [];

    return Response.json({
      channelId: channelId_out,
      channelName,
      channelThumb,
      subscriberCount,
      videoCount,
      videos,
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

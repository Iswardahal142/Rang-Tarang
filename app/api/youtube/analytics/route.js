// 📁 LOCATION: app/api/youtube/analytics/route.js
export const revalidate = 300;

const CORS = { 'Access-Control-Allow-Origin': '*' };

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
  try {
    const accessToken = await getAccessToken();
    const channelId   = process.env.YOUTUBE_CHANNEL_ID;

    // Last 90 days analytics — per video breakdown
    const today     = new Date();
    const endDate   = today.toISOString().split('T')[0];
    const startDate = new Date(today - 90 * 86400000).toISOString().split('T')[0];

    const res = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?` +
      `ids=channel==${channelId}` +
      `&startDate=${startDate}` +
      `&endDate=${endDate}` +
      `&metrics=views,estimatedMinutesWatched,averageViewDuration,impressions,impressionClickThroughRate` +
      `&dimensions=video` +
      `&sort=-views` +
      `&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const data = await res.json();

    if (data.error) throw new Error(data.error.message);

    // Transform into { videoId -> analytics }
    const rows = data.rows || [];
    const headers = (data.columnHeaders || []).map(h => h.name);

    const analytics = {};
    rows.forEach(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      analytics[obj.video] = {
        views:              obj.views || 0,
        watchTimeMinutes:   Math.round(obj.estimatedMinutesWatched || 0),
        avgViewDurationSec: Math.round(obj.averageViewDuration || 0),
        impressions:        obj.impressions || 0,
        ctr:                obj.impressionClickThroughRate
          ? parseFloat((obj.impressionClickThroughRate * 100).toFixed(1))
          : 0,
      };
    });

    return Response.json({ analytics }, { headers: CORS });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: CORS });
  }
}

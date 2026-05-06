import { db_loadState } from '../../../lib/firebase-admin'; // agar admin hai
// Ya seedha env info bhej

export async function GET() {
  return Response.json({
    env: {
      hasYoutubeKey:     !!process.env.YOUTUBE_API_KEY,
      hasYoutubeChannel: !!process.env.YOUTUBE_CHANNEL_ID,
      hasOAuth:          !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET && process.env.YOUTUBE_REFRESH_TOKEN),
      hasOpenRouter:     !!process.env.OPENROUTER_API_KEY,
      openRouterKeys:    [1,2,3,4,5].filter(i => !!process.env[`OPENROUTER_API_KEY${i===1?'':'_'+i}`]).length,
    },
    timestamp: new Date().toISOString(),
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}

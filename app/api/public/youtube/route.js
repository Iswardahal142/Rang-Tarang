// 📁 LOCATION: app/api/public/youtube/route.js
export const revalidate = 300;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://rang-tarang.vercel.app';
    const res = await fetch(`${base}/api/youtube`, {
      headers: { 'x-internal': '1' },
      cache: 'no-store',
    });
    const data = await res.json();
    return Response.json(data, { headers: CORS });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: CORS });
  }
}

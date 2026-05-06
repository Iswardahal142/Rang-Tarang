export async function GET() {
  // Sirf route check — actual data client se aayega
  return Response.json({
    status: 'ok',
    message: 'Episodes route live',
    timestamp: new Date().toISOString(),
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' }
  });
}

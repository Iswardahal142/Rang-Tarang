export async function POST(request) {
  try {
    const body = await request.json();
    return handleOpenRouter(body);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

async function handleOpenRouter(body) {
  const keys = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_2,
    process.env.OPENROUTER_API_KEY_3,
    process.env.OPENROUTER_API_KEY_4,
    process.env.OPENROUTER_API_KEY_5,
  ].filter(Boolean);

  if (!keys.length) {
    return Response.json({ error: 'No API keys configured' }, { status: 500 });
  }

  const bodyToSend = { ...body, stream: false };
  delete bodyToSend.provider;

  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer':  'https://rang-tarang.vercel.app',
          'X-Title':       'Rang Tarang Studio',
        },
        body: JSON.stringify(bodyToSend),
      });

      if (upstream.status === 429 || upstream.status >= 500) {
        console.log(`Key ${i + 1} failed (${upstream.status}), trying next...`);
        continue;
      }

      const data = await upstream.json();

      if (!upstream.ok) {
        return Response.json(data, { status: upstream.status });
      }

      return Response.json(data);

    } catch (err) {
      console.log(`Key ${i + 1} threw error: ${err.message}, trying next...`);
      continue;
    }
  }

  return Response.json({ error: 'All API keys exhausted or rate limited' }, { status: 429 });
}

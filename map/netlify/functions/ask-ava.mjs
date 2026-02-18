const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.2';

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(payload),
});

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  if (!OPENAI_API_KEY) {
    return json(503, { error: 'OPENAI_API_KEY is not configured.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const question = String(payload.question || '').trim();
  const context = Array.isArray(payload.context) ? payload.context : [];

  if (!question) {
    return json(400, { error: 'Missing question.' });
  }

  const clippedContext = context.slice(0, 8).map((item, index) => ({
    rank: index + 1,
    name: item.name || '',
    city: item.city || '',
    state: item.state || '',
    country: item.country || '',
    type2: item.type2 || '',
    creators_rec: item.creators_rec || '',
    notes: item.notes || '',
    address: item.address || '',
    google_maps_link: item.google_maps_link || '',
    rating: item.rating || '',
  }));

  const systemPrompt =
    "You are Ava, assistant for The Map of Tiny Perfect Things. " +
    'Only answer from provided context. If context is insufficient, say so clearly. ' +
    'Return concise practical recommendations in plain markdown.';

  const userPrompt = [
    `Question: ${question}`,
    '',
    'Context (JSON):',
    JSON.stringify(clippedContext, null, 2),
    '',
    'Instructions:',
    '- Recommend 2 to 5 places when possible.',
    '- Mention city and one reason for each place.',
    '- Keep response concise.',
  ].join('\n');

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        max_completion_tokens: 550,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.text();
      return json(502, {
        error: 'OpenAI request failed.',
        detail: errorBody,
      });
    }

    const completion = await openaiResponse.json();
    const answer = completion?.choices?.[0]?.message?.content;

    if (!answer) {
      return json(502, { error: 'OpenAI returned an empty response.' });
    }

    return json(200, {
      answer,
      model: OPENAI_MODEL,
      sources: clippedContext.length,
    });
  } catch (error) {
    return json(500, {
      error: 'Unexpected error calling OpenAI.',
      detail: String(error),
    });
  }
}

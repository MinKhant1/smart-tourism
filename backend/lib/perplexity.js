const baseUrl = 'https://api.perplexity.ai/chat/completions';

export async function askPerplexity({
  apiKey,
  messages,
  model = 'sonar',
  temperature = 0.2,
  responseFormat // { type: 'json_schema', json_schema: {...} } | { type: 'text' } | { type: 'regex', regex: '...' }
}) {
  const body = { model, temperature, messages };
  if (responseFormat) body.response_format = responseFormat;

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Perplexity API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

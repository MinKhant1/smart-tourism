import https from 'https';

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

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  // Use global fetch if available; otherwise fall back to https
  if (typeof fetch === 'function') {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Perplexity API error: ${res.status} ${text}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
  }

  // https fallback for environments without fetch
  const url = new URL(baseUrl);
  const payload = JSON.stringify(body);
  return await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers
      },
      (res) => {
        let buf = '';
        res.on('data', (chunk) => (buf += chunk));
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`Perplexity API error: ${res.statusCode} ${buf}`));
          }
          try {
            const data = JSON.parse(buf);
            resolve(data?.choices?.[0]?.message?.content ?? '');
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

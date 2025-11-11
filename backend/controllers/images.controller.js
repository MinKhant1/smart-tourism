import { URL } from 'url';

async function fetchJson(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function svgPlaceholder(width, height, label = 'City') {
  const w = Number(width) || 900;
  const h = Number(height) || 600;
  const safe = String(label || 'City').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fontSize = Math.max(16, Math.floor(w / 14));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#a1c4fd"/>
      <stop offset="100%" stop-color="#c2e9fb"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="${fontSize}" fill="#ffffff" opacity="0.92">${safe}</text>
</svg>`;
}

async function resolveWikipediaImage(cityName) {
  const name = (cityName || '').trim();
  if (!name) return null;

  // Try page summary first
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
  let summary = await fetchJson(summaryUrl);

  // If not found, search
  if (!summary || summary?.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json`; 
    const search = await fetchJson(searchUrl);
    const title = search?.query?.search?.[0]?.title;
    if (title) {
      summary = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    }
  }

  const img = summary?.originalimage?.source || summary?.thumbnail?.source;
  return img || null;
}

export const cityImage = async (req, res) => {
  const name = String(req.query?.name || '').trim();
  const width = Number(req.query?.w) || 900;
  const height = Number(req.query?.h) || 600;

  // Resolve a Wikipedia image URL
  const url = await resolveWikipediaImage(name);

  if (url) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error('image fetch failed');
      const ct = r.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const buf = Buffer.from(await r.arrayBuffer());
      return res.end(buf);
    } catch {
      // fall through to placeholder
    }
  }

  // Local SVG placeholder so we always have an image
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.end(svgPlaceholder(width, height, name || 'City'));
};

export default { cityImage };
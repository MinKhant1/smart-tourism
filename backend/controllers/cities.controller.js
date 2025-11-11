import 'dotenv/config';

const TELEPORT_URL = 'https://api.teleport.org/api/cities/';

// Basic timeout helper using AbortController
async function fetchWithTimeout(url, opts = {}, timeoutMs = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function mapTeleport(json) {
  const items = json?._embedded?.['city:search-results'] || [];
  return items.map((item) => {
    const label = item?.matching_full_name || '';
    const city = label.split(',')[0];
    return { city, label };
  });
}

const fallbackCities = [
  'Bangkok, Thailand',
  'Chiang Mai, Thailand',
  'Phuket, Thailand',
  'Pattaya, Thailand',
  'Ayutthaya, Thailand',
  'Tokyo, Japan',
  'Seoul, South Korea',
  'Singapore, Singapore',
  'Kuala Lumpur, Malaysia',
  'Hong Kong, China',
];

export const searchCities = async (req, res, _next) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '7', 10) || 7, 15);
    if (!q || q.length < 2) return res.json({ items: [] });

    // Try Teleport first
    try {
      const url = `${TELEPORT_URL}?search=${encodeURIComponent(q)}&limit=${limit}`;
      const resp = await fetchWithTimeout(url, { method: 'GET' }, 3000);
      if (resp.ok) {
        const data = await resp.json();
        const mapped = mapTeleport(data).slice(0, limit);
        return res.json({ items: mapped });
      }
    } catch (e) {
      // Fall through to local fallback
    }

    // Fallback: simple local list filtered by query
    const lc = q.toLowerCase();
    const filtered = fallbackCities
      .filter((c) => c.toLowerCase().includes(lc))
      .slice(0, limit)
      .map((label) => ({ city: label.split(',')[0], label }));
    return res.json({ items: filtered });
  } catch (err) {
    res.json({ items: [] });
  }
};

export default { searchCities };
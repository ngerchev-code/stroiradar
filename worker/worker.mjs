// СтройРадар — търсачка на живо (Cloudflare Worker, безплатен план).
// GET /search?q=hidromek+102b&scope=bg|foreign|all  → { items, status }
import { searchAll } from '../scraper/core.mjs';
import config from '../scraper/config.json';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json; charset=utf-8' };

export default {
  async fetch(req) {
    const u = new URL(req.url);
    if (u.pathname !== '/search') return new Response(JSON.stringify({ ok: true, app: 'StroiRadar' }), { headers: CORS });
    const q = (u.searchParams.get('q') || '').trim().slice(0, 80);
    if (!q) return new Response(JSON.stringify({ items: [], status: {} }), { headers: CORS });
    const scope = u.searchParams.get('scope') || 'all';
    const only = Object.keys(config.sources).filter(k =>
      scope === 'all' || (scope === 'foreign' ? config.sources[k].foreign : !config.sources[k].foreign));
    const res = await searchAll(config, q, { only, enrichDetails: false });
    return new Response(JSON.stringify(res), { headers: { ...CORS, 'Cache-Control': 'max-age=300' } });
  }
};

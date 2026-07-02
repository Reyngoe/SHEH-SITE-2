/**
 * SHEH LIBRARY — the librarian Worker for shehthrive.org
 * =======================================================
 * Holds the content library (photos, writings, videos) that the site's
 * sections render. Public READS. PIN-gated WRITES (Reyngoe + Patrick).
 *
 * DEPLOY (Cloudflare dashboard):
 *   1. Create a KV namespace (e.g. SHEH_LIBRARY).
 *   2. Workers & Pages -> Create -> Worker -> name: sheh-library -> paste this file.
 *   3. Bindings tab -> add:
 *        KV namespace  | variable name: LIBRARY_KV  | (required)
 *        R2 bucket     | variable name: LIBRARY_R2  | (OPTIONAL — see storage note)
 *   4. Settings -> Variables & Secrets -> add SECRETS:
 *        PIN_REYNGOE  = Reyngoe's studio PIN
 *        PIN_PATRICK  = Patrick's studio PIN
 *   5. Redeploy. Verify: GET / returns {"ok":true,...}
 *
 * STORAGE: files (photos/PDFs) go to R2 if the LIBRARY_R2 binding exists,
 * otherwise they're stored in KV (works fine; ~1 GB total on the free plan).
 * Adding R2 later is safe — old KV-stored files keep serving.
 *
 * ENDPOINTS
 *   GET  /                  status + item counts (safe, public)
 *   GET  /manifest          the whole library index (public)
 *   GET  /essay/<id>        an essay body (public)
 *   GET  /asset/<key>       a stored file — photo/PDF (public, cached)
 *   POST /add               multipart form; header X-Studio-Pin required
 *   POST /remove            JSON {id};             X-Studio-Pin required
 *   POST /update            JSON {id, ...patch};   X-Studio-Pin required
 *   POST /reorder           JSON {section, ids[]}; X-Studio-Pin required
 *
 * SECTIONS & KINDS
 *   illuminations : photo (jpeg/png/webp file + caption)
 *   manuscripts   : essay (title + body text) | pdf (file + title) | link (url + title)
 *   longtake      : video (YouTube link or ID + title)
 */

const SECTIONS = {
  illuminations: ['photo'],
  manuscripts: ['essay', 'pdf', 'link'],
  longtake: ['video', 'clip'],
};
const PHOTO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const VIDEO_TYPES = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' };
const MAX_CLIP = 20 * 1024 * 1024; // KV value ceiling is 25 MB; keep margin
const MAX_FILE = 15 * 1024 * 1024; // 15 MB cap (Studio resizes photos well below this)
const RL_MAX = 8;                  // bad-PIN attempts allowed...
const RL_TTL = 900;                // ...per 15 minutes per IP

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,x-studio-pin',
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json;charset=utf-8', ...CORS, ...extra },
  });
}

const newId = () =>
  Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
const today = () => new Date().toISOString().slice(0, 10);
const excerpt = (s) => s.replace(/\s+/g, ' ').trim().slice(0, 160);

function ytId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/* ---------- manifest ---------- */
async function loadManifest(env) {
  return (
    (await env.LIBRARY_KV.get('manifest', 'json')) || {
      updated: 0,
      sections: { manuscripts: [], illuminations: [], longtake: [] },
    }
  );
}
async function saveManifest(env, m) {
  m.updated = Date.now();
  await env.LIBRARY_KV.put('manifest', JSON.stringify(m));
}
function findItem(m, id) {
  for (const s of Object.keys(m.sections)) {
    const i = m.sections[s].findIndex((x) => x.id === id);
    if (i > -1) return { section: s, index: i, item: m.sections[s][i] };
  }
  return null;
}

/* ---------- file storage: R2 if bound, else KV; reads check both ---------- */
async function putFile(env, key, buf, ct) {
  if (env.LIBRARY_R2)
    return env.LIBRARY_R2.put(key, buf, { httpMetadata: { contentType: ct } });
  return env.LIBRARY_KV.put('file:' + key, buf, { metadata: { ct } });
}
async function getFile(env, key, range) {
  if (env.LIBRARY_R2) {
    const head = await env.LIBRARY_R2.head(key);
    if (head) {
      const size = head.size;
      const opt = range ? { range: { offset: range.start, length: range.end - range.start + 1 } } : undefined;
      const o = await env.LIBRARY_R2.get(key, opt);
      if (o) return { body: o.body, ct: o.httpMetadata && o.httpMetadata.contentType, size };
    }
  }
  const r = await env.LIBRARY_KV.getWithMetadata('file:' + key, 'arrayBuffer');
  if (!r || r.value === null) return null;
  const size = r.value.byteLength;
  const body = range ? r.value.slice(range.start, range.end + 1) : r.value;
  return { body, ct: r.metadata && r.metadata.ct, size };
}
function parseRange(h, size) {
  if (!h || !size) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(h.trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let s = m[1] === '' ? null : parseInt(m[1], 10);
  let e = m[2] === '' ? null : parseInt(m[2], 10);
  if (s === null) { s = Math.max(0, size - e); e = size - 1; }
  else if (e === null || e > size - 1) e = size - 1;
  if (s > e || s >= size) return { bad: true };
  return { start: s, end: e };
}
async function delFile(env, key) {
  if (env.LIBRARY_R2) {
    try { await env.LIBRARY_R2.delete(key); } catch (e) {}
  }
  try { await env.LIBRARY_KV.delete('file:' + key); } catch (e) {}
}

/* ---------- auth: two PINs, rate-limited ---------- */
async function checkPin(req, env) {
  const pin = req.headers.get('x-studio-pin') || '';
  if (!pin) return json({ error: 'PIN required' }, 401);
  const ip = req.headers.get('cf-connecting-ip') || '0';
  const rlKey = 'rl:' + ip;
  const fails = parseInt(await env.LIBRARY_KV.get(rlKey)) || 0;
  if (fails >= RL_MAX)
    return json({ error: 'Too many attempts. Try again in a few minutes.' }, 429);
  if (env.PIN_REYNGOE && pin === env.PIN_REYNGOE) return 'Reyngoe';
  if (env.PIN_PATRICK && pin === env.PIN_PATRICK) return 'Patrick';
  await env.LIBRARY_KV.put(rlKey, String(fails + 1), { expirationTtl: RL_TTL });
  return json({ error: 'Bad PIN' }, 401);
}

/* ---------- handlers ---------- */
async function status(env) {
  const m = await loadManifest(env);
  const items = Object.fromEntries(
    Object.entries(m.sections).map(([k, v]) => [k, v.length])
  );
  return json({
    ok: true,
    service: 'sheh-library',
    storage: env.LIBRARY_R2 ? 'R2' : 'KV',
    items,
    updated: m.updated,
  });
}

async function add(req, env, who) {
  const fd = await req.formData().catch(() => null);
  if (!fd) return json({ error: 'Expected multipart form data' }, 400);
  const section = String(fd.get('section') || '');
  const kind = String(fd.get('kind') || '');
  if (!SECTIONS[section]) return json({ error: 'Unknown section' }, 400);
  if (!SECTIONS[section].includes(kind))
    return json({ error: section + ' accepts: ' + SECTIONS[section].join(', ') }, 400);

  const id = newId();
  const title = String(fd.get('title') || '').trim();
  const caption = String(fd.get('caption') || '').trim();
  const date = String(fd.get('date') || '').trim() || today();
  const item = { id, kind, date, by: who };

  if (kind === 'photo' || kind === 'pdf' || kind === 'clip') {
    const f = fd.get('file');
    if (!(f && typeof f === 'object' && f.size)) return json({ error: 'file required' }, 400);
    const cap = kind === 'clip' ? MAX_CLIP : MAX_FILE;
    if (f.size > cap) return json({ error: 'File too large (' + Math.round(cap / 1048576) + ' MB max)' }, 413);
    let ext;
    if (kind === 'photo') {
      ext = PHOTO_TYPES[f.type];
      if (!ext) return json({ error: 'Photo must be JPEG, PNG, or WebP' }, 415);
    } else if (kind === 'clip') {
      ext = VIDEO_TYPES[f.type];
      if (!ext) return json({ error: 'Video must be MP4, MOV, or WebM' }, 415);
    } else {
      if (f.type !== 'application/pdf') return json({ error: 'PDF file required' }, 415);
      ext = 'pdf';
    }
    const key = id + '.' + ext;
    await putFile(env, key, await f.arrayBuffer(), f.type);
    item.src = '/asset/' + key;
    if (kind === 'photo') item.caption = caption;
    else item.title = title || 'Untitled';
  } else if (kind === 'essay') {
    const body = String(fd.get('body') || '');
    if (!body.trim()) return json({ error: 'body (the writing) required' }, 400);
    if (!title) return json({ error: 'title required' }, 400);
    await env.LIBRARY_KV.put('essay:' + id, body);
    item.title = title;
    item.excerpt = excerpt(body);
  } else if (kind === 'link') {
    const u = String(fd.get('url') || '').trim();
    if (!/^https?:\/\//.test(u)) return json({ error: 'valid url required' }, 400);
    item.url = u;
    item.title = title || u;
  } else if (kind === 'video') {
    const y = ytId(fd.get('youtube'));
    if (!y) return json({ error: 'YouTube link or 11-char ID required' }, 400);
    item.youtubeId = y;
    item.title = title;
  }

  if (section === 'manuscripts') {
    const b = String(fd.get('bucket') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
    if (b) item.bucket = b;
  }
  const m = await loadManifest(env);
  m.sections[section].unshift(item); // newest first
  await saveManifest(env, m);
  return json({ ok: true, section, item });
}

async function removeItem(req, env) {
  const b = await req.json().catch(() => null);
  if (!b || !b.id) return json({ error: 'id required' }, 400);
  const m = await loadManifest(env);
  const hit = findItem(m, b.id);
  if (!hit) return json({ error: 'not found' }, 404);
  m.sections[hit.section].splice(hit.index, 1);
  await saveManifest(env, m);
  const it = hit.item;
  if (it.src) {
    const key = it.src.split('/asset/')[1];
    if (key) await delFile(env, key);
  }
  if (it.kind === 'essay') await env.LIBRARY_KV.delete('essay:' + it.id);
  return json({ ok: true, removed: it.id });
}

async function update(req, env) {
  const b = await req.json().catch(() => null);
  if (!b || !b.id) return json({ error: 'id required' }, 400);
  const m = await loadManifest(env);
  const hit = findItem(m, b.id);
  if (!hit) return json({ error: 'not found' }, 404);
  const it = hit.item;
  for (const k of ['title', 'caption', 'date'])
    if (typeof b[k] === 'string') it[k] = b[k].trim();
  if (typeof b.bucket === 'string' && hit.section === 'manuscripts') {
    const bs = b.bucket.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
    if (bs) it.bucket = bs;
  }
  if (typeof b.youtube === 'string' && it.kind === 'video') {
    const y = ytId(b.youtube);
    if (y) it.youtubeId = y;
  }
  if (typeof b.url === 'string' && it.kind === 'link' && /^https?:\/\//.test(b.url))
    it.url = b.url.trim();
  if (typeof b.body === 'string' && it.kind === 'essay') {
    await env.LIBRARY_KV.put('essay:' + it.id, b.body);
    it.excerpt = excerpt(b.body);
  }
  await saveManifest(env, m);
  return json({ ok: true, item: it });
}

async function reorder(req, env) {
  const b = await req.json().catch(() => null);
  if (!b || !SECTIONS[b.section] || !Array.isArray(b.ids))
    return json({ error: 'section and ids[] required' }, 400);
  const m = await loadManifest(env);
  const cur = m.sections[b.section];
  const byId = new Map(cur.map((x) => [x.id, x]));
  const next = [];
  for (const id of b.ids) {
    const it = byId.get(id);
    if (it) { next.push(it); byId.delete(id); }
  }
  for (const it of cur) if (byId.has(it.id)) next.push(it);
  m.sections[b.section] = next;
  await saveManifest(env, m);
  return json({ ok: true, order: next.map((x) => x.id) });
}

async function getEssay(env, id) {
  const body = await env.LIBRARY_KV.get('essay:' + id);
  if (body === null) return json({ error: 'not found' }, 404);
  return json({ id, body }, 200, { 'cache-control': 'no-store' });
}

async function getAsset(req, env, ctx, origin, key) {
  if (!/^[\w.-]+$/.test(key)) return json({ error: 'bad key' }, 400);
  const rangeHeader = req.headers.get('range');
  const cache = caches.default;
  const ck = new Request(origin + '/asset/' + key);
  if (!rangeHeader) {
    const hit = await cache.match(ck);
    if (hit) return hit;
  }
  // probe for size first when a range is requested
  let range = null;
  if (rangeHeader) {
    const probe = await getFile(env, key, null);
    if (!probe) return json({ error: 'not found' }, 404);
    range = parseRange(rangeHeader, probe.size);
    if (range && range.bad) {
      return new Response(null, { status: 416, headers: { ...CORS, 'content-range': 'bytes */' + probe.size } });
    }
  }
  const f = await getFile(env, key, range);
  if (!f) return json({ error: 'not found' }, 404);
  const h = new Headers(CORS);
  h.set('content-type', f.ct || 'application/octet-stream');
  h.set('accept-ranges', 'bytes');
  h.set('cache-control', 'public, max-age=31536000, immutable');
  if (range) {
    h.set('content-range', 'bytes ' + range.start + '-' + range.end + '/' + f.size);
    h.set('content-length', String(range.end - range.start + 1));
    return new Response(f.body, { status: 206, headers: h });
  }
  const res = new Response(f.body, { headers: h });
  ctx.waitUntil(cache.put(ck, res.clone()));
  return res;
}

/* ---------- router ---------- */
export default {
  async fetch(req, env, ctx) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (!env.LIBRARY_KV)
      return json(
        { ok: false, error: 'Missing binding: add a KV namespace binding named LIBRARY_KV (Bindings tab), then redeploy.' },
        500
      );
    const url = new URL(req.url);
    const p = url.pathname;
    try {
      if (req.method === 'GET') {
        if (p === '/' || p === '') return status(env);
        if (p === '/manifest')
          return json(await loadManifest(env), 200, { 'cache-control': 'no-store' });
        if (p.startsWith('/essay/')) return getEssay(env, p.slice(7));
        if (p.startsWith('/asset/')) return getAsset(req, env, ctx, url.origin, p.slice(7));
        return json({ error: 'not found' }, 404);
      }
      if (req.method === 'POST') {
        const who = await checkPin(req, env);
        if (who instanceof Response) return who; // 401 / 429
        if (p === '/add') return add(req, env, who);
        if (p === '/remove') return removeItem(req, env);
        if (p === '/update') return update(req, env);
        if (p === '/reorder') return reorder(req, env);
        return json({ error: 'not found' }, 404);
      }
      return json({ error: 'method not allowed' }, 405);
    } catch (e) {
      return json({ error: e.message || 'server error' }, 500);
    }
  },
};

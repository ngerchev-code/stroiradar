// Входяща кутия на шоурума: прибира изпратеното от формата в приложението (през ntfy)
// в inbox/submissions.json, за да го прегледа Claude.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

export async function collectInbox(topic) {
  if (!topic) return 0;
  const dir = new URL('../inbox/', import.meta.url);
  const file = new URL('submissions.json', dir);
  let box = { items: [] };
  try { box = JSON.parse(await readFile(file, 'utf8')); } catch {}
  const known = new Set(box.items.map(i => i.id));
  const r = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=all`);
  const lines = (await r.text()).split('\n').filter(Boolean);
  let added = 0;
  for (const l of lines) {
    let m; try { m = JSON.parse(l); } catch { continue; }
    if (m.event !== 'message' || known.has(m.id)) continue;
    let data; try { data = JSON.parse(m.message); } catch { data = { text: m.message }; }
    box.items.push({ id: m.id, received: new Date(m.time * 1000).toISOString(), status: 'pending', data });
    added++;
  }
  const cutoff = Date.now() - 90 * 864e5;
  box.items = box.items.filter(i => new Date(i.received).getTime() > cutoff);
  await mkdir(dir, { recursive: true });
  await writeFile(file, JSON.stringify(box, null, 1));
  return added;
}

// Заявки за становище от „Виртуален продавач“: данни + прикачени файлове (снимки, протоколи).
// Файловете се свалят в inbox/eval/<rid>/ — Claude ги преглежда и после ги изтрива.
export async function collectEval(topic) {
  if (!topic) return 0;
  const { existsSync } = await import('node:fs');
  const base = new URL('../inbox/eval/', import.meta.url);
  const r = await fetch(`https://ntfy.sh/${topic}/json?poll=1&since=all`);
  const lines = (await r.text()).split('\n').filter(Boolean);
  let n = 0;
  for (const l of lines) {
    let m; try { m = JSON.parse(l); } catch { continue; }
    if (m.event !== 'message') continue;
    let meta; try { meta = JSON.parse(m.message); } catch { continue; }
    const rid = String(meta.rid || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40);
    if (!rid) continue;
    const dir = new URL(rid + '/', base);
    if (existsSync(new URL('done', dir))) continue;           // вече обработена
    await mkdir(dir, { recursive: true });
    if (meta.kind === 'request') {
      const f = new URL('request.json', dir);
      if (!existsSync(f)) { await writeFile(f, JSON.stringify({ ...meta, received: new Date(m.time * 1000).toISOString() }, null, 1)); n++; }
    } else if (meta.kind === 'file' && m.attachment?.url) {
      const name = String(meta.i ?? 0).padStart(2, '0') + '-' + String(m.attachment.name || 'file').replace(/[^\w.\-]+/g, '_').slice(-60);
      const f = new URL(name, dir);
      if (existsSync(f)) continue;
      try { const a = await fetch(m.attachment.url); if (a.ok) { await writeFile(f, Buffer.from(await a.arrayBuffer())); n++; } } catch {}
    }
  }
  return n;
}

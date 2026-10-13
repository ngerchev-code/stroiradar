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

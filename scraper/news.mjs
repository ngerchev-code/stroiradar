// Новини от бранша по рубрики — Google News RSS (стабилен формат), България + Европа.
import { decode, hash } from './core.mjs';

// cat: infra | economy | energy | industry | machines | knowhow
const FEEDS = [
  { cat: 'infra',    lang: 'bg', q: 'инфраструктурен проект OR магистрала OR "обществена поръчка" строителство' },
  { cat: 'infra',    lang: 'bg', q: 'ВиК проект OR пътен ремонт OR тунел OR мост строителство' },
  { cat: 'infra',    lang: 'en', q: 'Europe infrastructure project contract awarded construction' },
  { cat: 'economy',  lang: 'bg', q: 'строителство икономика OR строителна продукция НСИ OR цени строителни материали' },
  { cat: 'economy',  lang: 'en', q: 'Eurostat construction output OR European construction market outlook' },
  { cat: 'energy',   lang: 'bg', q: 'енергиен проект OR фотоволтаичен парк OR газопровод OR ВЕЦ строителство' },
  { cat: 'energy',   lang: 'en', q: 'Europe energy infrastructure construction grid OR pipeline OR solar park' },
  { cat: 'industry', lang: 'bg', q: 'строителен бранш OR Камара на строителите OR КСБ' },
  { cat: 'industry', lang: 'en', q: 'construction equipment industry Europe CECE OR rental market' },
  { cat: 'machines', lang: 'bg', q: 'строителна техника OR багер OR валяк OR Hidromek OR Ammann' },
  { cat: 'machines', lang: 'en', q: 'Hidromek OR Ammann OR Komatsu OR "Volvo CE" OR Liebherr new machine' },
  { cat: 'knowhow',  lang: 'en', q: 'construction equipment maintenance tips OR compaction best practice OR excavator productivity' },
  { cat: 'knowhow',  lang: 'bg', q: 'поддръжка на строителна техника OR съвети багер OR безопасност строителна площадка' }
];

const url = f => f.lang === 'bg'
  ? `https://news.google.com/rss/search?q=${encodeURIComponent(f.q)}+when:21d&hl=bg&gl=BG&ceid=BG:bg`
  : `https://news.google.com/rss/search?q=${encodeURIComponent(f.q)}+when:21d&hl=en-GB&gl=GB&ceid=GB:en`;

const tag = (x, t) => { const m = new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`, 'i').exec(x); return m ? decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')) : ''; };

export async function collectNews() {
  const all = new Map();
  for (const f of FEEDS) {
    try {
      const r = await fetch(url(f), { headers: { 'User-Agent': 'Mozilla/5.0 BuildBench' } });
      const xml = await r.text();
      for (const it of xml.split(/<item>/i).slice(1).slice(0, 25)) {
        let title = tag(it, 'title');
        const source = tag(it, 'source');
        if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
        const link = tag(it, 'link');
        const date = tag(it, 'pubDate');
        if (!title || !link) continue;
        const id = hash(title.toLowerCase());
        if (!all.has(id)) all.set(id, { id, cat: f.cat, lang: f.lang, title, url: link, source, date: date ? new Date(date).toISOString() : new Date().toISOString() });
      }
    } catch (e) { console.log('Новини грешка:', f.cat, e.message); }
  }
  return [...all.values()].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 260);
}

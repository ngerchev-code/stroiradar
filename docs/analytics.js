// ECOBenchmark — „Пазарен анализ“: тенденции на цените, предлагане, разпределение, марки, дни на пазара, седмичен отчет.
(function () {
  const $ = s => document.querySelector(s);
  const MC = [
    ['backhoe', 'Комбинирани багери', /мини комбиниран|комбиниран багер|багер[ -]?товарач|backhoe|baggerlader|koparko[- ]?ładowark|buldoexcavator|beko ?loder|kaz[ıi]c[ıi] y[üu]kleyici|terna|tractopelle|retrocargadora|kombinirk|hmk ?\d{2,3} ?(b|s|ss|t)\b|\b[1345] ?cx\b|\bwb ?9\d/i],
    ['minicl', 'Мини челни товарачи', /мини челен|бобкат|skid ?steer|kompaktlader|minilader|компактен товарач|bobcat s\d|bobcat t\d|minicargadora|minipala|miniładowarka|miniincarcator/i],
    ['telehandler', 'Телехендъри', /телескоп|telehandler|teleskoplader|manitou mt|manitou mrt|ładowarka teleskop|sollevatore telescopico/i],
    ['dumper', 'Дъмпери', /дъмпер|dumper|raddumper|kettendumper|motocarriola|wozidło|mini dumper/i],
    ['mini', 'Мини багери', /мини багер|minibagger|mini ?excavator|kompaktbagger|minikoparka|miniescavatore|minipelle|miniexcavadora|mini ekskavat|\bpc ?[1-5]\d\b|\bkx ?0\d\d|\b[1-5]\d?c ?-?1\b|30[0-5]\.\d/i],
    ['crawler', 'Верижни багери', /верижен багер|верижни багер|kettenbagger|crawler excavator|koparka gąsienicowa|escavatore cingolato|pelle sur chenilles|excavadora de cadenas|paletli ekskavat|midibagger|миди багер|\bhmk ?\d{3} ?(lc|nlc)|\bpc ?\d{3}\b|\bec ?\d{3}/i],
    ['excavator', 'Колесни багери', /колесен багер|mobilbagger|wheeled excavator|koparka kołowa|escavatore gommato|pelle sur pneus|lastikli ekskavat|\bhmk ?\d{3} ?w|\bpw ?\d{3}|\bew ?\d{3}/i],
    ['loader', 'Челни товарачи', /челен товарач|колесен товарач|wheel loader|radlader|ładowarka kołowa|pala gommata|chargeuse|pala cargadora|lastikli y[üu]kleyici|loder y[üu]kleyici|\bwa ?\d{3}|\bl ?\d{3} ?h/i],
    ['roller', 'Валяци', /валяк|walze|road roller|compactor roller|rullo|walec|silindir|cilindru|rouleau|rodillo|\bars ?\d|\barx ?\d|\bbw ?\d{2,3}|\bsd ?\d{3}/i],
    ['truck', 'Камиони', /самосвал|камион|сметосъбира|kipper|dreiseiten|tipper|dump truck|wywrotka|müllwagen|lkw|truck|damperli kamyon|basculant|ribaltabile|volquete/i]
  ];
  const GEN = /багер|bagger|excavator|koparka|ekskavat|escavatore|excavadora|pelle/i;
  const groupOf = it => { const t = txt(it); const m = MC.find(c => c[2].test(t)); return m ? m[0] : GEN.test(t) ? 'crawler' : null; };
  window.marketGroup = groupOf;
  const LBL = Object.fromEntries(MC.map(c => [c[0], c[1]]));
  const A = { cat: 'backhoe', trends: null, weeks: [], week: null, rep: null };
  const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
  const k = n => n == null ? '—' : n >= 1000 ? Math.round(n / 1000) + 'k' : String(Math.round(n));
  const fmtD = d => new Date(d).toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit' });

  // ---------- SVG графики ----------
  const W = 340, H = 170, PL = 40, PB = 22, PT = 10, PR = 10;
  function frame(yMax, yMin = 0, ticks = 4) {
    let g = '';
    for (let i = 0; i <= ticks; i++) {
      const v = yMin + (yMax - yMin) * i / ticks, y = PT + (H - PT - PB) * (1 - i / ticks);
      g += `<line x1="${PL}" x2="${W - PR}" y1="${y}" y2="${y}" class="ch-grid"/><text x="${PL - 5}" y="${y + 3}" class="ch-ax" text-anchor="end">${k(v)}</text>`;
    }
    return g;
  }
  function lineChart(points, opts = {}) {      // points: [{x:label, y, lo, hi}]
    const ps = points.filter(p => p.y != null);
    if (ps.length < 2) return `<div class="ch-empty">${opts.empty || 'Данните се трупат — графиката се появява след няколко дни.'}</div>`;
    const ys = ps.flatMap(p => [p.y, p.lo ?? p.y, p.hi ?? p.y]);
    const yMax = Math.max(...ys) * 1.08, yMin = Math.max(0, Math.min(...ys) * 0.85);
    const sx = i => PL + (W - PL - PR) * (ps.length === 1 ? 0.5 : i / (ps.length - 1)), sy = v => PT + (H - PT - PB) * (1 - (v - yMin) / (yMax - yMin));
    const band = ps[0].lo != null ? `<path class="ch-band" d="M${ps.map((p, i) => `${sx(i)},${sy(p.hi)}`).join('L')}L${ps.map((p, i) => `${sx(i)},${sy(p.lo)}`).reverse().join('L')}Z"/>` : '';
    const step = Math.max(1, Math.ceil(ps.length / 6));
    return `<svg viewBox="0 0 ${W} ${H}" class="ch">${frame(yMax, yMin)}${band}
      <path class="ch-line ${opts.cls || ''}" d="M${ps.map((p, i) => `${sx(i)},${sy(p.y)}`).join('L')}"/>
      ${ps.map((p, i) => `<circle cx="${sx(i)}" cy="${sy(p.y)}" r="2.6" class="ch-dot ${opts.cls || ''}"><title>${esc(p.x)}: ${opts.money ? fmtEur(p.y) : p.y}</title></circle>`).join('')}
      ${ps.map((p, i) => i % step === 0 || i === ps.length - 1 ? `<text x="${sx(i)}" y="${H - 6}" class="ch-ax" text-anchor="middle">${esc(p.x)}</text>` : '').join('')}</svg>`;
  }
  function bars(rows, opts = {}) {             // rows: [{l, v, n, cls}] хоризонтални
    if (!rows.length) return `<div class="ch-empty">${opts.empty || 'Няма достатъчно данни.'}</div>`;
    const mx = Math.max(...rows.map(r => r.v)) || 1;
    return `<div class="hb">${rows.map(r => `<div class="hb-r"><span class="hb-l">${esc(r.l)}</span><div class="hb-b"><i class="${r.cls || ''}" style="width:${Math.max(2, r.v / mx * 100)}%"></i></div><span class="hb-v">${opts.money ? fmtEur(r.v) : r.v}${r.n != null ? `<small>${r.n}</small>` : ''}</span></div>`).join('')}</div>`;
  }
  function histogram(prices) {
    if (prices.length < 5) return '<div class="ch-empty">Под 5 обяви с цена — разпределението не е показателно.</div>';
    const s = [...prices].sort((a, b) => a - b), lo = s[Math.floor(s.length * 0.03)], hi = s[Math.ceil(s.length * 0.97) - 1];
    const nb = 10, step = Math.max(500, Math.ceil((hi - lo) / nb / 500) * 500), start = Math.floor(lo / step) * step;
    const bins = Array.from({ length: nb }, (_, i) => ({ a: start + i * step, n: 0 }));
    for (const p of s) { const i = Math.min(nb - 1, Math.max(0, Math.floor((p - start) / step))); bins[i].n++; }
    const mx = Math.max(...bins.map(b => b.n)), m = med(s), bw = (W - PL - PR) / nb;
    const sy = v => PT + (H - PT - PB) * (1 - v / mx);
    const mxX = PL + (m - start) / (step * nb) * (W - PL - PR);
    return `<svg viewBox="0 0 ${W} ${H}" class="ch">${frame(mx, 0, 3).replace(/>(\d+)k?</g, '>$1<')}
      ${bins.map((b, i) => `<rect x="${PL + i * bw + 1.5}" y="${sy(b.n)}" width="${bw - 3}" height="${H - PB - sy(b.n)}" rx="2" class="ch-bar ${b.a + step <= m * 0.92 ? 'g' : b.a >= m * 1.08 ? 'r' : 'y'}"><title>${fmtEur(b.a)}–${fmtEur(b.a + step)}: ${b.n}</title></rect>`).join('')}
      <line x1="${mxX}" x2="${mxX}" y1="${PT}" y2="${H - PB}" class="ch-med"/><text x="${mxX + 3}" y="${PT + 9}" class="ch-ax strong">медиана ${k(m)}</text>
      ${bins.map((b, i) => i % 2 === 0 ? `<text x="${PL + i * bw + bw / 2}" y="${H - 6}" class="ch-ax" text-anchor="middle">${k(b.a)}</text>` : '').join('')}</svg>`;
  }

  // ---------- Данни ----------
  async function loadData() {
    const get = async u => { try { const r = await fetch(u + '?t=' + Date.now(), { cache: 'no-store' }); return r.ok ? r.json() : null; } catch { return null; } };
    const [tr, idx] = await Promise.all([get('data/trends.json'), get('data/weekly/index.json')]);
    A.trends = tr; A.weeks = idx?.weeks || [];
    if (!A.week && A.weeks.length) A.week = A.weeks[0];
    A.rep = A.week ? await get(`data/weekly/${A.week}.json`) : null;
  }

  // ---------- Изглед ----------
  function render() {
    const c = A.cat, label = LBL[c];
    const pool = live().filter(i => i.type === 'sale' && groupOf(i) === c);
    const priced = pool.filter(i => i._eur);
    const prices = priced.map(i => i._eur);
    const days = Object.entries(A.trends?.days || {}).sort(([a], [b]) => a.localeCompare(b)).slice(-60);
    const pts = days.map(([d, x]) => ({ x: fmtD(d), y: x[c]?.med ?? null, lo: x[c]?.p25 ?? null, hi: x[c]?.p75 ?? null }));
    const sup = days.map(([d, x]) => ({ x: fmtD(d), y: x[c]?.n ?? null }));
    const weeks = Object.entries(A.trends?.weeks || {}).sort(([a], [b]) => a.localeCompare(b));
    const wNow = weeks.length ? weeks[weeks.length - 1][1][c] : null, wPrev = weeks.length > 1 ? weeks[weeks.length - 2][1][c] : null;
    const chg = wNow?.med && wPrev?.med ? Math.round((wNow.med / wPrev.med - 1) * 100) : null;
    // по година
    const byY = {}; priced.forEach(i => { if (i._year) (byY[i._year] ||= []).push(i._eur); });
    const yRows = Object.entries(byY).filter(([, a]) => a.length >= 2).sort(([a], [b]) => b - a).slice(0, 12).map(([y, a]) => ({ l: y, v: Math.round(med(a)), n: a.length }));
    // марки
    const byB = {}; priced.forEach(i => { if (i._brand) (byB[i._brand] ||= []).push(i._eur); });
    const bRows = Object.entries(byB).filter(([, a]) => a.length >= 2).sort((a, b) => b[1].length - a[1].length).slice(0, 8).map(([b, a]) => ({ l: b, v: Math.round(med(a)), n: a.length }));
    // държави
    const byC = {}; priced.forEach(i => (byC[i._cc] ||= []).push(i._eur));
    const cRows = Object.entries(byC).filter(([, a]) => a.length >= 2).sort((a, b) => b[1].length - a[1].length).slice(0, 8).map(([cc, a]) => ({ l: (COUNTRIES[cc] ? COUNTRIES[cc][0] + ' ' + COUNTRIES[cc][1] : cc), v: Math.round(med(a)), n: a.length, cls: cc === 'BG' ? 'y' : '' }));
    // потенциал
    const zc = { p: 0, g: 0, y: 0, r: 0 }; pool.forEach(i => { const z = S.pot?.[i.id]?.[0]; if (z) zc[z]++; });
    // дни на пазара по категории (от последния отчет или текущата седмица)
    const src = A.rep?.cats || (weeks.length ? weeks[weeks.length - 1][1] : {});
    const domRows = MC.map(([cc, l]) => ({ l, v: src[cc]?.domMed, n: src[cc]?.gone })).filter(r => r.v != null).sort((a, b) => a.v - b.v).map(r => ({ ...r, cls: r.l === label ? 'y' : '' }));

    $('#anCats').innerHTML = MC.map(([k2, l]) => `<button class="dd ${k2 === c ? 'set' : ''}" data-ancat="${k2}">${esc(l)}</button>`).join('');
    $('#anBody').innerHTML = `
      <div class="mkgrid">
        <div class="mk"><div class="lbl">Медианна цена</div><div class="val">${fmtEur(med(prices))}</div>${chg != null ? `<small class="${chg > 0 ? 'up' : 'down'}">${chg > 0 ? '▲' : '▼'} ${Math.abs(chg)}% за седмица</small>` : ''}</div>
        <div class="mk"><div class="lbl">Диапазон (25–75%)</div><div class="val" style="font-size:17px">${prices.length >= 4 ? `${k(prices.sort((a, b) => a - b)[Math.floor(prices.length * .25)])} – ${k(prices[Math.floor(prices.length * .75)])}` : '—'}</div></div>
        <div class="mk"><div class="lbl">Активни обяви</div><div class="val">${pool.length}</div><small>${priced.length} с цена</small></div>
        <div class="mk"><div class="lbl">Дни на пазара</div><div class="val">${src[c]?.domMed != null ? src[c].domMed : '—'}</div><small>${src[c]?.gone ? src[c].gone + ' продадени' : 'трупа се'}</small></div>
      </div>
      <div class="pot-legend"><span class="pz p">Ловец ${zc.p}</span><span class="pz g">Изгодни ${zc.g}</span><span class="pz y">Пазарни ${zc.y}</span><span class="pz r">Скъпи ${zc.r}</span></div>
      <div class="panel ch-card"><h3>Цена във времето</h3><p class="st">Медиана на обявите с цена (линия) и средните 50% от пазара (лента).</p>${lineChart(pts, { money: true })}</div>
      <div class="panel ch-card"><h3>Предлагане</h3><p class="st">Брой активни обяви в категорията по дни.</p>${lineChart(sup, { cls: 'b' })}</div>
      <div class="panel ch-card"><h3>Разпределение на цените</h3><p class="st">Колко обяви има във всеки ценови диапазон. Зелено — под медианата, червено — над нея.</p>${histogram(prices)}</div>
      <div class="panel ch-card"><h3>Цена по година на производство</h3><p class="st">Медиана · брой обяви.</p>${bars(yRows, { money: true })}</div>
      <div class="panel ch-card"><h3>Марки</h3><p class="st">Медианна цена по марка · брой обяви.</p>${bars(bRows, { money: true })}</div>
      <div class="panel ch-card"><h3>Държави</h3><p class="st">Медианна цена по пазар · брой обяви. България е в жълто.</p>${bars(cRows, { money: true })}</div>
      <div class="panel ch-card"><h3>Колко бързо се продава</h3><p class="st">Медиана дни на пазара по категории — от появата до изтриването на обявата.</p>${bars(domRows, { empty: 'Скенерът проверява кои обяви са изтрити. Първите данни идват до няколко дни.' })}</div>`;
    renderReport();
  }

  function renderReport() {
    const r = A.rep;
    if (!r) { $('#anReport').innerHTML = '<div class="panel"><h3>Седмичен отчет</h3><p class="st">Първият отчет се появява в понеделник сутрин.</p></div>'; return; }
    const rows = MC.map(([c]) => r.cats[c]).filter(x => x && (x.active || x.entered || x.gone));
    const ZN = { p: 'Ловец', g: 'Изгодна', y: 'Пазарна', r: 'Скъпа' };
    $('#anReport').innerHTML = `<div class="panel rep">
      <div class="rep-h"><h3>Седмичен отчет ${esc(r.week)}</h3>${A.weeks.length > 1 ? `<select id="anWeek">${A.weeks.map(w => `<option ${w === A.week ? 'selected' : ''}>${w}</option>`).join('')}</select>` : ''}</div>
      <p class="st">${fmtD(r.from)} – ${fmtD(new Date(new Date(r.to) - 864e5))}${r.partial ? ' · първа седмица, историята още се трупа' : ''}</p>
      ${r.commentary ? `<div class="rep-c">${mdLite(r.commentary)}</div>` : ''}
      <div class="tbl"><table><thead><tr><th>Категория</th><th>Нови</th><th>Прод.</th><th>Дни</th><th>Медиана</th></tr></thead><tbody>
      ${rows.map(x => `<tr><td>${esc(x.label)}</td><td>${x.entered}</td><td>${x.gone}</td><td>${x.domMed ?? '—'}</td><td>${fmtEur(x.med)}${x.medChange ? ` <small class="${x.medChange > 0 ? 'up' : 'down'}">${x.medChange > 0 ? '+' : ''}${x.medChange}%</small>` : ''}</td></tr>`).join('')}
      </tbody></table></div>
      <h4 style="margin:14px 0 6px">Топ обяви, влезли през седмицата</h4>
      ${r.top?.length ? r.top.map(t => `<a class="rep-top" href="${esc(t.url)}" target="_blank" rel="noopener">${t.photo ? `<img src="${esc(t.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<span><b>${esc(t.title)}</b><small><i class="pz ${t.zone}">${ZN[t.zone]} ${t.pct > 0 ? '+' : ''}${t.pct}%</i> ${fmtEur(t.price)} · пазар ${fmtEur(t.market)}</small><small>${t.gone ? `✅ продадена за ${t.days} дни` : `⏳ в продажба ${t.days} дни`}</small></span></a>`).join('') : '<p class="st">Няма изгодни нови обяви за седмицата.</p>'}
      <p class="note2">${esc(r.note || '')}</p>
      <div class="alarm-act" style="padding:10px 0 0"><button class="btn" id="anShare" style="flex:1">📤 Изпрати отчета</button></div></div>`;
    const sel = $('#anWeek'); if (sel) sel.onchange = async () => { A.week = sel.value; await loadData(); render(); };
    $('#anShare').onclick = async () => {
      const t = `ECOBenchmark — пазарен отчет ${r.week}\n\n` + rows.map(x => `${x.label}: +${x.entered} нови, ${x.gone} продадени${x.domMed != null ? ` (~${x.domMed} дни)` : ''}, медиана ${fmtEur(x.med)}`).join('\n') + (r.top?.length ? '\n\nТоп: ' + r.top.slice(0, 5).map(t => `${t.title} — ${fmtEur(t.price)}`).join('; ') : '');
      try { if (navigator.share) await navigator.share({ title: 'Пазарен отчет ' + r.week, text: t }); else { await navigator.clipboard.writeText(t); toast('Отчетът е копиран'); } } catch {}
    };
  }

  document.addEventListener('click', e => { const b = e.target.closest('[data-ancat]'); if (b) { A.cat = b.dataset.ancat; render(); } });
  window.renderAnalytics = async () => { render(); await loadData(); render(); };
})();

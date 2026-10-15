// ECOBenchmark — PDF доклад „Виртуален продавач“ (pdfmake, шрифт Roboto с кирилица)
(function () {
  const C = { navy: '#0b1f38', green: '#1e9e57', yellow: '#e0a800', red: '#d64545', ink: '#1b2430', muted: '#6b7685', rule: '#e3e7ec', soft: '#f4f6f8', eco: '#3fbf6a', bench: '#f5c518' };
  const ZC = { z1: C.green, z2: C.yellow, z3: C.red };
  const W = 523; // ширина на съдържанието (A4 − полета)
  const eur = n => n == null ? '—' : '€ ' + Math.round(n).toLocaleString('bg-BG').replace(/[, ]/g, ' ');
  const x = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const noEmoji = s => String(s ?? '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F000}-\u{1F2FF}]/gu, '').replace(/\s{2,}/g, ' ').trim();

  // ---- Графики (SVG) ----
  function scaleSvg(r, ask) {
    const min = r.lo * 0.8, max = r.hi * 1.2, px = v => 10 + Math.max(0, Math.min(1, (v - min) / (max - min))) * (W - 20);
    const mk = (v, lbl, col, up) => `<polygon points="${px(v) - 6},${up ? 22 : 58} ${px(v) + 6},${up ? 22 : 58} ${px(v)},${up ? 32 : 48}" fill="${col}"/>
      <text x="${px(v)}" y="${up ? 16 : 72}" font-size="9" font-weight="bold" text-anchor="middle" fill="${col}">${x(lbl)}</text>`;
    return `<svg width="${W}" height="96" viewBox="0 0 ${W} 96" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${C.green}"/><stop offset="0.5" stop-color="${C.yellow}"/><stop offset="1" stop-color="${C.red}"/></linearGradient></defs>
      <rect x="10" y="34" width="${W - 20}" height="12" rx="6" fill="url(#g)"/>
      <line x1="${px(r.lo)}" y1="30" x2="${px(r.lo)}" y2="50" stroke="#fff" stroke-width="2"/><line x1="${px(r.hi)}" y1="30" x2="${px(r.hi)}" y2="50" stroke="#fff" stroke-width="2"/>
      ${mk(r.fair, 'Пазар ' + eur(r.fair), C.navy, true)}
      ${ask ? mk(ask, 'Искана ' + eur(ask), '#c2410c', false) : ''}
      <text x="${px(r.lo)}" y="88" font-size="8" text-anchor="middle" fill="${C.muted}">${eur(r.lo)}</text>
      <text x="${px(r.hi)}" y="88" font-size="8" text-anchor="middle" fill="${C.muted}">${eur(r.hi)}</text>
      <text x="10" y="88" font-size="8" fill="${C.green}">Изгодно</text>
      <text x="${W - 10}" y="88" font-size="8" text-anchor="end" fill="${C.red}">Високо</text>
    </svg>`;
  }
  function waterfallSvg(steps, fair) {
    const rows = steps.map(([l, v, b]) => ({ l, v, b })).filter(s => s.b || Math.abs(s.v) >= 50);
    let run = 0; const bars = rows.map(s => { const a = s.b ? 0 : run; run = s.b ? s.v : run + s.v; return { ...s, a, z: run }; });
    bars.push({ l: 'Справедлива стойност', v: fair, b: true, a: 0, z: fair, total: true });
    const mx = Math.max(...bars.map(b => Math.max(b.a, b.z))) * 1.05, LW = 200, BW = W - LW - 70, h = 18;
    const sx = v => LW + v / mx * BW;
    return `<svg width="${W}" height="${bars.length * h + 8}" viewBox="0 0 ${W} ${bars.length * h + 8}" xmlns="http://www.w3.org/2000/svg">
      ${bars.map((b, i) => { const y = 4 + i * h, x0 = sx(Math.min(b.a, b.z)), x1 = sx(Math.max(b.a, b.z)); const col = b.total ? C.navy : b.b ? '#8aa0b8' : b.v >= 0 ? C.green : C.red;
        return `<text x="${LW - 8}" y="${y + 11}" font-size="8" text-anchor="end" fill="${C.ink}">${x(b.l.length > 44 ? b.l.slice(0, 43) + '…' : b.l)}</text>
        <rect x="${x0}" y="${y + 2}" width="${Math.max(1.5, x1 - x0)}" height="${h - 6}" rx="2" fill="${col}"/>
        <text x="${x1 + 4}" y="${y + 11}" font-size="8" font-weight="bold" fill="${col}">${b.b ? eur(b.v) : (b.v >= 0 ? '+' : '−') + eur(Math.abs(b.v))}</text>`; }).join('')}
    </svg>`;
  }
  function compsSvg(comps, f, r) {
    const pts = comps.map(c => ({ y: c.y, p: c.eur }));
    const years = [...pts.map(p => p.y), +f.year], prices = [...pts.map(p => p.p), r.lo, r.hi];
    const y0 = Math.min(...years) - 1, y1 = Math.max(...years) + 1, p0 = Math.min(...prices) * 0.85, p1 = Math.max(...prices) * 1.1;
    const H = 170, L = 52, B = 22, sx = v => L + (v - y0) / (y1 - y0) * (W - L - 10), sy = v => 8 + (1 - (v - p0) / (p1 - p0)) * (H - B - 8);
    const ticks = []; for (let i = 0; i <= 4; i++) ticks.push(p0 + (p1 - p0) * i / 4);
    const yt = []; for (let y = Math.ceil(y0); y <= y1; y++) yt.push(y);
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${ticks.map(t => `<line x1="${L}" x2="${W - 10}" y1="${sy(t)}" y2="${sy(t)}" stroke="${C.rule}" stroke-width="0.7"/><text x="${L - 5}" y="${sy(t) + 3}" font-size="7" text-anchor="end" fill="${C.muted}">${Math.round(t / 1000)}k €</text>`).join('')}
      ${yt.map(y => `<text x="${sx(y)}" y="${H - 6}" font-size="7" text-anchor="middle" fill="${C.muted}">${y}</text>`).join('')}
      <rect x="${L}" y="${sy(r.hi)}" width="${W - L - 10}" height="${sy(r.lo) - sy(r.hi)}" fill="${C.yellow}" fill-opacity="0.16"/>
      <line x1="${L}" x2="${W - 10}" y1="${sy(r.fair)}" y2="${sy(r.fair)}" stroke="${C.navy}" stroke-width="1" stroke-dasharray="4 3"/>
      <text x="${W - 12}" y="${sy(r.fair) - 4}" font-size="7.5" text-anchor="end" fill="${C.navy}">Справедлива стойност ${eur(r.fair)}</text>
      ${pts.map(p => `<circle cx="${sx(p.y)}" cy="${sy(p.p)}" r="4" fill="#5b7fa6" fill-opacity="0.85" stroke="#fff" stroke-width="1"/>`).join('')}
      <polygon points="${sx(+f.year)},${sy(r.fair) - 7} ${sx(+f.year) + 7},${sy(r.fair)} ${sx(+f.year)},${sy(r.fair) + 7} ${sx(+f.year) - 7},${sy(r.fair)}" fill="${C.green}" stroke="#fff" stroke-width="1.2"/>
    </svg>`;
  }
  const bar = (p, col) => ({ canvas: [{ type: 'rect', x: 0, y: 3, w: 90, h: 7, r: 3.5, color: '#e6e9ee' }, { type: 'rect', x: 0, y: 3, w: Math.max(2, 90 * p / 100), h: 7, r: 3.5, color: col }] });
  const dot = col => ({ canvas: [{ type: 'ellipse', x: 5, y: 7, r1: 4.5, r2: 4.5, color: col }], width: 12 });

  // Markdown (## заглавия, - точки, **удебелено**) → pdfmake
  function md(t) {
    const ne = s => s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F000}-\u{1F2FF}]/gu, '');
    const runs = s => s.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map(p => p.startsWith('**') ? { text: ne(p.slice(2, -2)), bold: true } : { text: ne(p) });
    const out = []; let ul = null;
    for (const ln of String(t || '').split('\n')) {
      const l = ln.trim(); if (!l) { ul = null; continue; }
      if (/^#{1,4} /.test(l)) { ul = null; out.push({ text: noEmoji(l.replace(/^#+ /, '')), style: 'h3' }); }
      else if (/^[-*•] /.test(l)) { if (!ul) { ul = { ul: [], margin: [0, 0, 0, 6], fontSize: 9.5 }; out.push(ul); } ul.ul.push({ text: runs(l.slice(2)) }); }
      else { ul = null; out.push({ text: runs(l), margin: [0, 0, 0, 6], fontSize: 9.5 }); }
    }
    return out;
  }
  const sectionTitle = t => ({ text: t, style: 'h2' });
  const card = (body, fill) => ({ table: { widths: ['*'], body: [[{ stack: body, margin: [12, 10, 12, 10] }]] }, layout: { hLineWidth: () => 0, vLineWidth: () => 0, fillColor: () => fill || C.soft }, margin: [0, 0, 0, 12] });
  const kv = rows => ({ table: { widths: [150, '*'], body: rows.map(([k, v]) => [{ text: k, color: C.muted, fontSize: 9 }, { text: v, fontSize: 9.5, bold: true }]) },
    layout: { hLineWidth: (i, n) => (i === 0 || i === n.table.body.length) ? 0 : 0.6, vLineWidth: () => 0, hLineColor: () => C.rule, paddingTop: () => 4, paddingBottom: () => 4 }, margin: [0, 0, 0, 12] });

  function build(D) {
    const { f, r, sc, sens, op, label, levelName, cond, extras, attach, ref, date } = D;
    const ask = +f.ask || 0;
    const title = `${f.brand} ${f.model || ''}`.trim();
    const content = [];
    // Заглавен блок
    content.push({ columns: [
      { stack: [{ text: label.toUpperCase(), fontSize: 9, color: C.muted, characterSpacing: 1 }, { text: title, fontSize: 22, bold: true, color: C.ink }, { text: `${f.year} г. · ${(+f.hours).toLocaleString('bg-BG')} моточаса`, fontSize: 11, color: C.muted }] },
      { width: 140, stack: [{ text: 'Доклад №', fontSize: 8, color: C.muted, alignment: 'right' }, { text: ref, fontSize: 10, bold: true, alignment: 'right' }, { text: date, fontSize: 9, color: C.muted, alignment: 'right', margin: [0, 2, 0, 0] }] }
    ], margin: [0, 0, 0, 14] });
    // Резултат
    content.push(card([
      { text: 'ПАЗАРНА СТОЙНОСТ, € БЕЗ ДДС', fontSize: 8.5, color: '#b9c6d6', characterSpacing: 1 },
      { text: `${eur(r.lo)} – ${eur(r.hi)}`, fontSize: 26, bold: true, color: '#ffffff', margin: [0, 2, 0, 2] },
      { text: [{ text: 'Справедлива стойност ≈ ', color: '#b9c6d6' }, { text: eur(r.fair), color: C.bench, bold: true }, { text: `   ·   точност ±${Math.round(r.spread * 100)}% (${r.conf})`, color: '#b9c6d6' }], fontSize: 10.5 }
    ], C.navy));
    content.push({ svg: scaleSvg(r, ask), width: W, margin: [0, 0, 0, 6] });
    if (D.verdict) content.push(card([{ columns: [dot(ZC[D.verdict.z]), { text: noEmoji(D.verdict.t), fontSize: 10, margin: [6, 0, 0, 0] }] }], D.verdict.z === 'z1' ? '#e8f6ee' : D.verdict.z === 'z3' ? '#fbeaea' : '#fdf5dc'));
    // Зони
    content.push({ columns: [['z1', 'Препоръчителна', `до ${eur(r.lo)}`], ['z2', 'Пазарна', `${eur(r.lo)} – ${eur(r.hi)}`], ['z3', 'Рискова', `над ${eur(r.hi)}`]].map(([z, a, b]) => ({
      table: { widths: ['*'], body: [[{ stack: [{ text: a.toUpperCase(), fontSize: 7.5, color: '#ffffff', characterSpacing: 0.8 }, { text: b, fontSize: 10.5, bold: true, color: '#ffffff' }], margin: [8, 6, 8, 6] }]] },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0, fillColor: () => ZC[z] } })), columnGap: 8, margin: [0, 0, 0, 16] });

    // Сценарии
    content.push(sectionTitle('Сценарии за продажба'));
    content.push({ table: { widths: [14, '*', 120, 130, 70], headerRows: 1, body: [
      ['', { text: 'Сценарий', style: 'th' }, { text: 'Цена, € без ДДС', style: 'th' }, { text: 'Вероятност', style: 'th' }, { text: 'Срок', style: 'th' }],
      ...sc.rows.map(s => [dot(ZC[s.z] || C.yellow), { stack: [{ text: s.name, bold: true, fontSize: 10 }, { text: noEmoji(s.tip || ''), fontSize: 8, color: C.muted }] },
        { text: `${eur(s.from)} – ${eur(s.to)}`, fontSize: 10, bold: true }, { columns: [bar(s.p, ZC[s.z] || C.yellow), { text: s.p + '%', bold: true, fontSize: 10, width: 34, alignment: 'right' }] }, { text: s.t, fontSize: 9.5 }])
    ] }, layout: { hLineWidth: (i) => i === 0 ? 0 : 0.6, vLineWidth: () => 0, hLineColor: () => C.rule, paddingTop: () => 6, paddingBottom: () => 6 }, margin: [0, 0, 0, 4] });
    content.push({ text: `Вероятност за продажба в посочения срок. Ликвидност на машината: ${sc.L < 0.85 ? 'висока' : sc.L < 1.05 ? 'нормална' : 'ниска'}${sc.wanted ? ` · в момента ${sc.wanted} обяви търсят такава техника` : ''}. Вероятностите и сроковете са експертна оценка по ликвидност, не статистика от сделки.`, style: 'note', margin: [0, 0, 0, 16] });

    // Машина
    content.push({ stack: [sectionTitle('Данни за машината'), kv([
      ['Вид / клас', `${label} · ${D.clsName}`], ['Марка и модел', title], ['Година на производство', String(f.year)], ['Моточасове', (+f.hours).toLocaleString('bg-BG') + ' мч'],
      ['Ходова част / шаси', cond.chassis], ['Двигател', cond.engine], ['Хидравлика', cond.hydr], ['Ниво на оборудване', levelName],
      ['Екстри', extras.length ? extras.join(', ') : '—'], ['Прикачен инвентар', attach.length ? attach.join(', ') : '—'], ...(ask ? [['Искана цена', eur(ask) + ' без ДДС']] : [])
    ])], unbreakable: true });

    // Разбивка
    content.push({ stack: [sectionTitle('Как се формира стойността'), { svg: waterfallSvg(r.steps, r.fair), width: W }, { text: 'Изходна точка е средна цена на нова машина в Европа за класа и марката; всяка лента показва корекцията в евро.', style: 'note', margin: [0, 4, 0, 16] }], unbreakable: true });

    // Чувствителност
    if (sens.length) {
      content.push({ stack: [sectionTitle('Какво движи цената'),
        { table: { widths: ['*', 90], body: sens.map(([l, v]) => [{ text: l, fontSize: 9.5 }, { text: (v >= 0 ? '+' : '−') + eur(Math.abs(v)), fontSize: 9.5, bold: true, color: v >= 0 ? C.green : C.red, alignment: 'right' }]) },
          layout: { hLineWidth: (i, n) => (i === 0 || i === n.table.body.length) ? 0 : 0.6, vLineWidth: () => 0, hLineColor: () => C.rule, paddingTop: () => 4, paddingBottom: () => 4 } },
        { text: 'Промяна на стойността при промяна само на този параметър — полезно за договаряне.', style: 'note', margin: [0, 4, 0, 16] }], unbreakable: true });
    }

    // Пазар
    if (D.comps.length >= 2) {
      content.push({ stack: [sectionTitle('Сравнение с пазара'), { svg: compsSvg(D.comps, f, r), width: W }], unbreakable: true });
      content.push({ text: [{ text: '● ', color: '#5b7fa6' }, 'Обяви (искани цени)   ', { text: '◆ ', color: C.green }, 'Оценяваната машина   ', { text: '▬ ', color: C.yellow }, 'Пазарен диапазон'], fontSize: 8, color: C.muted, margin: [0, 2, 0, 8] });
      content.push({ table: { widths: ['*', 40, 50, 70], headerRows: 1, body: [
        [{ text: 'Обява', style: 'th' }, { text: 'Год.', style: 'th' }, { text: 'Държава', style: 'th' }, { text: 'Цена', style: 'th', alignment: 'right' }],
        ...D.comps.map(c => [{ text: c.title, link: c.url, color: '#1d4f91', fontSize: 8.5 }, { text: String(c.y), fontSize: 8.5 }, { text: c.cc, fontSize: 8.5 }, { text: eur(c.eur), fontSize: 8.5, bold: true, alignment: 'right' }])
      ] }, layout: { hLineWidth: (i) => i === 0 ? 0 : 0.5, vLineWidth: () => 0, hLineColor: () => C.rule, paddingTop: () => 3, paddingBottom: () => 3 } });
      content.push({ text: `${D.comps.length} обяви от същата категория и марка, ±3 години${r.sameModel ? ', само същия модел' : ''}. Медиана, приравнена към годината на машината и към реална цена (−8% от исканата): ${eur(r.med)}. Всяка обява е с връзка — може да се провери.`, style: 'note', margin: [0, 4, 0, 16] });
    } else content.push(sectionTitle('Сравнение с пазара'), { text: 'В момента няма достатъчно сравними обяви с известна година в базата. Оценката е изчислена само по модела, затова точността е по-ниска.', fontSize: 9.5, margin: [0, 0, 0, 16] });

    // Реални сделки
    if (r.check.length) {
      content.push({ stack: [sectionTitle('Проверка с реални сделки'),
        { table: { widths: ['*', 75, 75, 50], headerRows: 1, body: [
          [{ text: 'Сделка', style: 'th' }, { text: 'Реална цена', style: 'th', alignment: 'right' }, { text: 'Модел', style: 'th', alignment: 'right' }, { text: 'Разлика', style: 'th', alignment: 'right' }],
          ...r.check.map(c => [{ stack: [{ text: `${c.model_name} · ${c.year}${c.hours ? ' · ' + c.hours.toLocaleString('bg-BG') + ' мч' : ''}`, fontSize: 9, bold: true }, { text: `${c.kind} · ${c.date}`, fontSize: 7.5, color: C.muted }] },
            { text: eur(c.eur), fontSize: 9, alignment: 'right' }, { text: eur(c.model), fontSize: 9, alignment: 'right' }, { text: (c.err >= 0 ? '+' : '−') + Math.abs(Math.round(c.err * 100)) + '%', fontSize: 9, bold: true, alignment: 'right', color: Math.abs(c.err) <= 0.105 ? C.green : Math.abs(c.err) <= 0.2 ? C.yellow : C.red }])
        ] }, layout: { hLineWidth: (i) => i === 0 ? 0 : 0.5, vLineWidth: () => 0, hLineColor: () => C.rule, paddingTop: () => 4, paddingBottom: () => 4 } },
        { text: 'Моделът е пуснат със същите година и моточасове и добро състояние. Обратното изкупуване е цена, на която купува търговец — обикновено 5–10% под пазара.', style: 'note', margin: [0, 4, 0, 16] }], unbreakable: true });
    }

    // Становище на Claude
    if (op) {
      content.push({ text: '', pageBreak: 'before' });
      content.push(sectionTitle('Становище на експерта (Claude)'));
      if (op.verdict) content.push(card([{ columns: [dot(op.zone === 'green' ? C.green : op.zone === 'red' ? C.red : C.yellow), { text: noEmoji(op.verdict), fontSize: 10.5, bold: true, margin: [6, 0, 0, 0] }] }], op.zone === 'green' ? '#e8f6ee' : op.zone === 'red' ? '#fbeaea' : '#fdf5dc'));
      if (op.sources?.length) content.push({ text: [{ text: 'Прегледани материали: ', color: C.muted }, op.sources.map(noEmoji).join(' · ')], fontSize: 9, margin: [0, 0, 0, 6] });
      if (op.range) content.push({ text: [{ text: 'Оценка след преглед на материалите: ', color: C.muted }, { text: noEmoji(op.range), bold: true }, ...(op.confidence ? [{ text: `   ·   увереност: ${op.confidence}`, color: C.muted }] : [])], fontSize: 10.5, margin: [0, 0, 0, 10] });
      content.push(...md(op.opinion));
      if (Array.isArray(op.scenarios) && op.scenarios.length) {
        content.push({ text: 'Сценарии след прегледа', style: 'h3' });
        content.push({ table: { widths: [14, '*', 120, 130, 70], body: op.scenarios.map((s, i) => [dot([C.green, C.yellow, C.red][i] || C.yellow), { stack: [{ text: s.name, bold: true, fontSize: 10 }, { text: noEmoji(s.note || ''), fontSize: 8, color: C.muted }] }, { text: `${eur(s.from)} – ${eur(s.to)}`, fontSize: 10, bold: true }, { columns: [bar(+s.probability || 0, [C.green, C.yellow, C.red][i] || C.yellow), { text: (s.probability ?? '—') + '%', bold: true, fontSize: 10, width: 34, alignment: 'right' }] }, { text: s.time || '', fontSize: 9.5 }]) },
          layout: { hLineWidth: (i) => i === 0 ? 0 : 0.6, vLineWidth: () => 0, hLineColor: () => C.rule, paddingTop: () => 6, paddingBottom: () => 6 }, margin: [0, 0, 0, 12] });
      }
    }

    // Методика
    content.push({ stack: [sectionTitle('Методика и ограничения'),
      { ul: [
        'Стойността = цена на нова машина за класа и марката × амортизация по възраст, коригирана за моточасове спрямо нормата за категорията, състояние на шаси, двигател и хидравлика, ниво на оборудване, екстри и инвентар.',
        'Резултатът се сверява с актуалните обяви от България и Европа (същата категория и марка, ±3 години). Обявите са искани цени — приравняват се към реални (−8%), а крайните стойности се изключват.',
        `Точност: ±${Math.round(r.spread * 100)}% (${r.conf}) — определя се от броя сравними обяви: 6 и повече = висока (±8%), 3–5 = средна (±11%), под 3 = ниска (±15%).`,
        'Коефициентите (амортизация, моточасове, състояние) са калибрирани по реални сделки — виж „Проверка с реални сделки“, когато има такива за марката и категорията.',
        'Не са отчетени скрити дефекти, документи, произход и регистрация. Оценката е ориентировъчна и не замества технически оглед.',
        'Сценариите за продажба са експертна оценка по ликвидност на категорията и марката, не гаранция за продажба.'
      ], fontSize: 8.5, color: C.ink }], unbreakable: true, margin: [0, 0, 0, 0] });

    return {
      pageSize: 'A4', pageMargins: [36, 74, 36, 46],
      info: { title: `Оценка — ${title} ${f.year}`, author: 'ECOBenchmark', subject: 'Виртуален продавач' },
      defaultStyle: { font: 'Roboto', fontSize: 10, color: C.ink, lineHeight: 1.15 },
      styles: { h2: { fontSize: 13.5, bold: true, color: C.navy, margin: [0, 2, 0, 8] }, h3: { fontSize: 11, bold: true, color: C.navy, margin: [0, 6, 0, 4] }, th: { fontSize: 8, color: C.muted, bold: true }, note: { fontSize: 8, color: C.muted, italics: true } },
      header: () => ({ stack: [
        { canvas: [{ type: 'rect', x: 0, y: 0, w: 595.28, h: 54, color: C.navy }, { type: 'rect', x: 0, y: 54, w: 595.28, h: 3, color: C.eco }] },
        { text: [{ text: 'ECO', color: C.eco }, { text: 'Benchmark', color: C.bench }], fontSize: 19, bold: true, absolutePosition: { x: 36, y: 15 } },
        { text: 'Виртуален продавач · Оценка на техника', fontSize: 9, color: '#b9c6d6', absolutePosition: { x: 36, y: 36 } },
        { text: 'Euro Construction Benchmark', fontSize: 8.5, color: '#b9c6d6', absolutePosition: { x: 445, y: 22 } }
      ] }),
      footer: (p, n) => ({ columns: [{ text: 'Не продаваме техника. Намираме решения за вас.', italics: true, color: C.green, fontSize: 8 }, { text: `стр. ${p} / ${n}`, alignment: 'right', color: C.muted, fontSize: 8 }], margin: [36, 16, 36, 0] }),
      content
    };
  }
  window.ECOReport = { build };
})();

// ECOBenchmark — „Разпознай машина“: снимка на табелка (рама/двигател), QR/баркод или ръчно въведен номер →
// марка, модел, PIN/сериен номер, година, двигател → пазарна цена от натрупаната история и подобни обяви.
// Няма връзка с базите на производителите: всичко се чете от табелката и се сверява с нашите данни.
(function () {
  const $ = s => document.querySelector(s);
  const TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

  // Марки (име на табелката, вкл. кирилица)
  const MAKERS = [
    ['Hidromek', /hidromek|хидромек/i], ['JCB', /\bjcb\b/i], ['Komatsu', /komatsu|коматсу/i],
    ['Caterpillar', /caterpillar|\bcat\b/i], ['Volvo', /volvo/i], ['Case', /\bcase\b/i], ['New Holland', /new ?holland/i],
    ['Bobcat', /bobcat/i], ['Takeuchi', /takeuchi/i], ['Kubota', /kubota/i], ['Hitachi', /hitachi/i], ['Liebherr', /liebherr/i],
    ['Doosan', /doosan/i], ['Develon', /develon/i], ['Hyundai', /hyundai/i], ['Terex', /terex/i], ['Manitou', /manitou/i],
    ['Ammann', /ammann/i], ['Bomag', /bomag/i], ['Dynapac', /dynapac/i], ['Hamm', /\bhamm\b/i], ['Wacker Neuson', /wacker/i],
    ['Yanmar', /yanmar/i], ['Kobelco', /kobelco/i], ['Mecalac', /mecalac/i], ['Sany', /\bsany\b/i], ['Kramer', /kramer/i],
    ['Schäffer', /sch(ä|ae)ffer/i], ['Weidemann', /weidemann/i]
  ];
  // Код на производителя в началото на PIN (ISO 10261) — само кодовете, в които сме сигурни
  const WMI = { CAT: 'Caterpillar', KMT: 'Komatsu', JCB: 'JCB', VCE: 'Volvo', HCM: 'Hitachi' };
  // Производители на двигатели
  const ENGINES = [['Perkins', /perkins/i], ['Cummins', /cummins/i], ['Isuzu', /isuzu/i], ['Deutz', /deutz/i], ['Yanmar', /yanmar/i],
    ['Kubota', /kubota/i], ['Mitsubishi', /mitsubishi/i], ['JCB Dieselmax / EcoMAX', /dieselmax|ecomax/i], ['Hino', /\bhino\b/i],
    ['FPT / Iveco', /\bfpt\b|iveco/i], ['Volvo', /volvo penta|\bvolvo d\d/i]];
  // Типични означения на двигатели (Perkins 1104D-44T, Isuzu 4JJ1, Cummins QSB6.7, Yanmar 4TNV98, Komatsu SAA6D107E, CAT C4.4, Kubota V3307, Deutz TCD3.6)
  const ENGINE_MODEL = /\b(1[01]0[346][A-Z]?-?\d{2}[A-Z]{0,3}|\d{3}[A-F]-E?\d{2}[A-Z]{0,3}|[46][HJBL][KJGF]\d|QS[BCLX]\d(?:\.\d)?|[BL]\d\.\d|[234]TNV\d{2}[A-Z]?|S?A?A?[46]D\d{2,3}[A-Z]?(?:-\d)?|C\d{1,2}\.\d|TCD ?\d\.\d|BF\d?M ?\d{4}|[VD]\d{4}(?:-[A-Z]+)?|S[46][SK]\d?|D[46]\.\d|DL0\d)\b/;

  const LABEL = {
    pin: /\b(?:PIN|P\.?I\.?N\.?|PRODUCT IDENTIFICATION(?: NUMBER)?|VIN|SERIAL(?: NO\.?| NUMBER)?|S\/N|SER\.? ?NO\.?|FAHRGESTELL(?:-?NR\.?|NUMMER)?|SERIEN(?:-?NR\.?|NUMMER)|MASCHINEN-?NR\.?|ШАСИ|РАМА|СЕРИЕН(?: НОМЕР| №)?)\b[\s:.#№-]*((?=[A-Z-]*\d)[A-Z0-9-]{5,20})/i,
    engine: /\b(?:ENGINE(?: SERIAL)?(?: NO\.?| NUMBER| S\/N)?|ENG\.? ?(?:S\/N|NO\.?)|E\/N|MOTOR(?:-?NR\.?|NUMMER)|ДВИГАТЕЛ(?: №| НОМЕР)?)\b[\s:.#№-]*((?=[A-Z-]*\d)[A-Z0-9-]{5,20})/i,
    year: /(?:YEAR OF (?:MANUFACTURE|CONSTRUCTION)|MODEL YEAR|YEAR|MFG\.? ?(?:DATE|YEAR)|BAUJAHR|ГОДИНА(?: НА ПРОИЗВОДСТВО)?|YIL|ANNO|ANNÉE|AÑO|ROK PRODUKCJI)[\s:.\-]*(?:\d{1,2}[./-])?((?:19[89]|20[0-3])\d)\b/i,
    weight: /(?:OPERATING (?:MASS|WEIGHT)|MASS|WEIGHT|BETRIEBSGEWICHT|GEWICHT|ТЕГЛО|МАСА)[^0-9]{0,20}(\d{1,3}(?:[ .,]?\d{3})|\d{3,5})\s*KG/i,
    power: /(\d{2,3}(?:[.,]\d)?)\s*KW\b/i
  };
  const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
  const robust = ps => { if (!ps.length) return null; const m0 = med(ps); const k = ps.filter(p => p >= m0 / 3 && p <= m0 * 3); return med(k.length ? k : ps); };
  const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };

  let market = null;
  async function loadMarket() {
    if (market) return market;
    try { const r = await fetch('data/market.json?t=' + Date.now(), { cache: 'no-store' }); market = (await r.json()).byKey || {}; } catch { market = {}; }
    return market;
  }
  const modelsOf = brand => Object.keys(market || {}).filter(k => k.startsWith(brand + '|')).map(k => k.slice(brand.length + 1));

  // Най-дългият известен модел (от историята на цените), който се среща в текста или в PIN
  function matchModel(brand, text, pinRest) {
    const list = modelsOf(brand).filter(m => m.length >= 2 && /\d/.test(m)).sort((a, b) => b.length - a.length);
    if (pinRest) for (const m of list) if (pinRest.startsWith(m)) return { model: m, from: 'PIN' };
    // кандидати от текста: всяка дума и съседни думи слепени („PC 210 LC“ → PC210, PC210LC)
    const t = String(text).toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean), C = [];
    for (let i = 0; i < t.length; i++) C.push(t[i], t[i] + (t[i + 1] || ''), t[i] + (t[i + 1] || '') + (t[i + 2] || ''));
    const fits = (c, m) => c === m || (c.endsWith(m) && /^[A-Z]{1,4}$/.test(c.slice(0, -m.length))) || (c.startsWith(m) && /^[A-Z]{1,3}$/.test(c.slice(m.length)) && /[A-Z]$/.test(m) === false);
    const hits = list.filter(m => C.some(c => fits(c, m)));
    if (!hits.length) return null;
    // „HMK102B“ и „102B“ са един и същ модел — взимаме записа с най-много обяви
    const top = hits[0], same = hits.filter(m => top.includes(m));
    const n = m => (market[brand + '|' + m] || []).length;
    return { model: same.sort((a, b) => n(b) - n(a) || b.length - a.length)[0], from: 'табелката' };
  }

  function parse(raw) {
    const text = String(raw || '').replace(/[|]/g, 'I').replace(/\s+/g, ' ').trim();
    const U = text.toUpperCase();
    const r = { text, brand: '', brandFrom: '', model: '', modelFrom: '', pin: '', engineNo: '', year: null, weight: null, power: null, engine: '', engineModel: '', notes: [] };
    // PIN: етикет или 17-знаков код
    const pl = LABEL.pin.exec(U);
    const p17 = /\b([A-Z0-9]{17})\b/.exec(U.replace(/(?<=[A-Z0-9])-(?=[A-Z0-9])/g, ''));
    r.pin = (p17 && /\d/.test(p17[1]) && /[A-Z]/.test(p17[1]) ? p17[1] : pl ? pl[1].replace(/-/g, '') : '');
    const el = LABEL.engine.exec(U); if (el) r.engineNo = el[1];
    if (r.engineNo && r.engineNo === r.pin) r.engineNo = '';
    const y = LABEL.year.exec(text); if (y && +y[1] <= new Date().getFullYear()) r.year = +y[1];
    const w = LABEL.weight.exec(U); if (w) { const v = parseInt(w[1].replace(/[ .,]/g, ''), 10); if (v >= 500 && v <= 120000) r.weight = v; }
    const pw = LABEL.power.exec(U); if (pw) { const v = parseFloat(pw[1].replace(',', '.')); if (v >= 5 && v <= 600) r.power = v; }
    // Марка: първо от името на табелката, после от кода в PIN
    const mk = MAKERS.find(([, rx]) => rx.test(text));
    if (mk) { r.brand = mk[0]; r.brandFrom = 'табелката'; }
    else if (r.pin && WMI[r.pin.slice(0, 3)]) { r.brand = WMI[r.pin.slice(0, 3)]; r.brandFrom = 'кода в PIN'; }
    else if (r.pin.length === 17) r.notes.push(`Кодът на производителя „${r.pin.slice(0, 3)}“ не е в нашия списък — въведете марката ръчно.`);
    if (r.brand && r.pin && WMI[r.pin.slice(0, 3)] && WMI[r.pin.slice(0, 3)] !== r.brand) r.notes.push(`PIN започва с „${r.pin.slice(0, 3)}“ (${WMI[r.pin.slice(0, 3)]}), а на табелката пише ${r.brand} — проверете.`);
    // Двигател
    const en = ENGINES.find(([, rx]) => rx.test(text)); if (en) r.engine = en[0];
    const at = Math.max(en ? U.search(en[1]) : -1, U.search(/ENGINE|MOTOR|ДВИГАТЕЛ/));
    const em = (at >= 0 && ENGINE_MODEL.exec(U.slice(at))) || ENGINE_MODEL.exec(U.replace(norm(r.model) || '@@', ' ')); if (em) r.engineModel = em[1];
    return r;
  }

  async function enrich(r) {
    await loadMarket();
    if (r.brand && !r.model) {
      const rest = r.pin && WMI[r.pin.slice(0, 3)] ? r.pin.slice(3).replace(/^0+/, '') : '';
      const m = matchModel(r.brand, r.text, rest);
      if (m) { r.model = m.model; r.modelFrom = m.from; }
    }
    if (r.brand && r.model) {
      const arr = (market[r.brand + '|' + r.model] || []);
      const all = arr.map(x => x.p);
      const near = r.year ? arr.filter(x => x.y && Math.abs(x.y - r.year) <= 2) : [];
      const bg = arr.filter(x => !x.f).map(x => x.p);
      r.mk = {
        n: all.length, med: all.length ? Math.round(robust(all)) : null, lo: all.length >= 4 ? q(all, 0.25) : null, hi: all.length >= 4 ? q(all, 0.75) : null,
        nearN: near.length, nearMed: near.length >= 3 ? Math.round(robust(near.map(x => x.p))) : null,
        bgN: bg.length, bgMed: bg.length >= 3 ? Math.round(robust(bg)) : null,
        years: arr.filter(x => x.y).map(x => x.y)
      };
    }
    // Обяви в момента
    const L = typeof live === 'function' ? live() : [];
    const M = norm(r.model), E = norm(r.engineModel);
    r.listings = r.brand ? L.filter(it => {
      const t = norm(it.title + ' ' + (it.desc || ''));
      return it.type !== 'wanted' && t.includes(norm(r.brand === 'Caterpillar' ? 'CAT' : r.brand)) && (!M || t.includes(M));
    }) : [];
    r.engineListings = E && E.length >= 4 ? L.filter(it => it.type !== 'wanted' && norm(it.title + ' ' + (it.desc || '')).includes(E)) : [];
    return r;
  }

  const fe = n => typeof fmtEur === 'function' ? fmtEur(n) : '€ ' + n;
  const e = s => typeof esc === 'function' ? esc(s) : String(s ?? '');
  function row(k, v, src) { return v ? `<tr><td>${k}</td><td><b>${e(v)}</b>${src ? ` <small class="st">от ${e(src)}</small>` : ''}</td></tr>` : ''; }

  function render(r) {
    const box = $('#idResult');
    if (!r.brand && !r.pin && !r.engine) {
      box.innerHTML = `<div class="panel"><h3>Нищо не е разпознато</h3><p>Не намерих марка, PIN или двигател в текста. Поправете разчетения текст или въведете марката и модела ръчно.</p></div>`;
      return;
    }
    const k = r.mk;
    const mkHtml = k && k.n ? `<div class="dsum" style="padding:0;margin:10px 0">
        <div><b>${fe(r.year && k.nearMed ? k.nearMed : k.med)}</b><small>${r.year && k.nearMed ? `пазар ${r.year - 2}–${r.year + 2} г. (${k.nearN})` : `пазар, всички години (${k.n})`}</small></div>
        <div><b>${k.bgMed ? fe(k.bgMed) : '—'}</b><small>в България (${k.bgN})</small></div>
        <div><b>${k.lo ? fe(k.lo).replace('€ ', '€') + '–' + fe(k.hi).replace('€ ', '') : '—'}</b><small>среден диапазон</small></div></div>
        <p class="note" style="margin:0">По ${k.n} обяви за ${e(r.brand)} ${e(r.model)} от последните 120 дни${k.years.length ? `, години ${Math.min(...k.years)}–${Math.max(...k.years)}` : ''}. Това са искани цени, не платени.${k.n < 6 ? ' Обявите са малко — оценката е ориентировъчна.' : ''}</p>`
      : r.brand && r.model ? `<p class="note">За ${e(r.brand)} ${e(r.model)} още няма натрупана история на цените.</p>`
      : r.brand ? `<p class="note">Моделът не е разпознат. Въведете го в полето горе и натиснете „Разчети“ пак.</p>` : '';
    const cards = r.listings.slice(0, 8);
    box.innerHTML = `<div class="panel"><h3>${e([r.brand, r.model].filter(Boolean).join(' ') || 'Разпознати данни')}</h3>
      <div class="tbl"><table>${row('Марка', r.brand, r.brandFrom)}${row('Модел', r.model, r.modelFrom)}${row('PIN / сериен №', r.pin)}${row('Година', r.year, 'табелката')}
      ${row('Работно тегло', r.weight && r.weight.toLocaleString('bg-BG') + ' кг')}${row('Мощност', r.power && r.power + ' kW')}
      ${row('Двигател', [r.engine, r.engineModel].filter(Boolean).join(' '))}${row('№ на двигателя', r.engineNo)}</table></div>
      ${r.notes.map(n => `<p class="note" style="color:var(--pr)">${e(n)}</p>`).join('')}
      ${r.year ? '' : '<p class="note">Годината не е на табелката (или не е разчетена). PIN не винаги я съдържа надеждно — въведете я ръчно, ако я знаете.</p>'}
      ${mkHtml}
      ${r.brand ? `<div class="pdfrow"><button class="btn primary" id="idToSeller">Оцени във Виртуален продавач</button></div>` : ''}</div>
      ${cards.length ? `<div class="sec"><h2>В продажба сега (${r.listings.length})</h2></div><div class="list">${cards.map(it => typeof card === 'function' ? card(it) : '').join('')}</div>` : r.brand ? '<p class="note">В момента няма активни обяви за този модел.</p>' : ''}
      ${r.engineListings.length ? `<p class="note">Обяви, в които се споменава двигател ${e(r.engineModel)}: ${r.engineListings.length}.</p>` : ''}`;
    const b = $('#idToSeller');
    if (b) b.onclick = () => {
      show('seller');
      const f = $('#vsForm'); if (!f) return;
      const opt = [...$('#vsBrand').options].find(o => o.value === r.brand); if (opt) $('#vsBrand').value = r.brand;
      if (r.model) f.model.value = r.model; if (r.year) f.year.value = r.year;
      toast('Попълних марката, модела и годината — допълнете моточасовете и състоянието');
    };
  }

  async function run() {
    const btn = $('#idGo'); btn.disabled = true;
    try {
      const extra = [$('#idBrand').value, $('#idModel').value].filter(Boolean).join(' ');
      const r = parse(extra + ' ' + $('#idText').value);
      if ($('#idBrand').value) { r.brand = $('#idBrand').value; r.brandFrom = 'въведено'; }
      if ($('#idModel').value.trim()) { r.model = norm($('#idModel').value); r.modelFrom = 'въведено'; }
      if (+$('#idYear').value) r.year = +$('#idYear').value;
      render(await enrich(r));
      $('#idResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } finally { btn.disabled = false; }
  }

  function loadScript(src) { return new Promise((ok, no) => { if (window.Tesseract) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('OCR')); document.head.appendChild(s); }); }

  async function readPhoto(file) {
    const st = $('#idStatus');
    st.innerHTML = '<span class="spin2"></span>Търся QR/баркод…';
    // 1) QR / баркод (Chrome на Android)
    try {
      if ('BarcodeDetector' in window) {
        const bmp = await createImageBitmap(file);
        const codes = await new BarcodeDetector().detect(bmp);
        if (codes.length) { $('#idText').value = codes.map(c => c.rawValue).join('\n') + '\n' + $('#idText').value; st.textContent = `Прочетен код: ${codes.length}. Чета и текста…`; }
      }
    } catch {}
    // 2) Текст от табелката (OCR на телефона)
    try {
      st.innerHTML = '<span class="spin2"></span>Чета табелката… (първия път сваля ~10 MB)';
      await loadScript(TESS);
      const w = await Tesseract.createWorker('eng');
      const { data } = await w.recognize(file);
      await w.terminate();
      const t = (data.text || '').trim();
      $('#idText').value = ($('#idText').value + '\n' + t).trim();
      st.textContent = t ? 'Готово. Проверете и поправете разчетения текст, после „Разчети“.' : 'Не успях да прочета текст — снимайте по-отблизо, без отблясъци.';
      if (t) run();
    } catch { st.textContent = 'Четенето на снимката не успя (няма интернет?). Препишете номера ръчно.'; }
  }

  window.renderIdent = function () {
    if ($('#idBrand').options.length) return;
    $('#idBrand').innerHTML = '<option value="">— от табелката —</option>' + MAKERS.map(([b]) => `<option>${e(b)}</option>`).join('');
    $('#idPhoto').onchange = ev => { const f = ev.target.files[0]; ev.target.value = ''; if (f) { $('#idPrev').innerHTML = `<img src="${URL.createObjectURL(f)}" alt="">`; readPhoto(f); } };
    $('#idGo').onclick = run;
    $('#idClear').onclick = () => { ['#idText', '#idModel', '#idYear'].forEach(s => $(s).value = ''); $('#idBrand').value = ''; $('#idResult').innerHTML = ''; $('#idPrev').innerHTML = ''; $('#idStatus').textContent = ''; };
  };
  window.identParse = parse;     // за проверка
  window.identEnrich = enrich;
})();

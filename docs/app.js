'use strict';
// ===== BuildBench EU =====
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BGN = 1.95583;

// ---------- Справочници ----------
const SOURCES = {
  olx:           { name: 'OLX.bg',        flag: '🇧🇬', cc: 'BG', link: q => `https://www.olx.bg/ads/q-${encodeURIComponent(q.trim().replace(/\s+/g, '-'))}/` },
  mobilebg:      { name: 'Mobile.bg',     flag: '🇧🇬', cc: 'BG', link: q => `https://www.google.com/search?q=${encodeURIComponent('site:mobile.bg ' + q)}` },
  bazar:         { name: 'Bazar.bg',      flag: '🇧🇬', cc: 'BG', link: q => `https://bazar.bg/obiavi?q=${encodeURIComponent(q)}` },
  mascus:        { name: 'Mascus',        flag: '🇪🇺', foreign: true, link: q => `https://www.mascus.bg/+/${encodeURIComponent(q)},1,relevance,search.html` },
  machineryline: { name: 'Machineryline', flag: '🇪🇺', foreign: true, link: q => `https://machineryline.bg/-/search?q=${encodeURIComponent(q)}` },
  autoline:      { name: 'Autoline',      flag: '🇪🇺', foreign: true, link: q => `https://autoline.bg/-/search?q=${encodeURIComponent(q)}` },
  truck1:        { name: 'Truck1',        flag: '🇪🇺', foreign: true, link: q => `https://www.truck1.eu/construction-machinery?q=${encodeURIComponent(q)}` },
  mobilede:      { name: 'Mobile.de',     flag: '🇩🇪', cc: 'DE', foreign: true, link: q => `https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&vc=ConstructionMachine&s=Construction&q=${encodeURIComponent(q)}` },
  truckscout24:  { name: 'TruckScout24',  flag: '🇩🇪', cc: 'DE', foreign: true, link: q => `https://www.truckscout24.de/baumaschinen?query=${encodeURIComponent(q)}` },
  machinio:      { name: 'Machinio',      flag: '🇪🇺', foreign: true, link: q => `https://www.machinio.com/search?q=${encodeURIComponent(q)}` },
  olxro:         { name: 'OLX.ro',        flag: '🇷🇴', cc: 'RO', foreign: true, link: q => `https://www.olx.ro/oferte/q-${encodeURIComponent(q.trim().replace(/\s+/g, '-'))}/` },
  olxpl:         { name: 'OLX.pl',        flag: '🇵🇱', cc: 'PL', foreign: true, link: q => `https://www.olx.pl/oferty/q-${encodeURIComponent(q.trim().replace(/\s+/g, '-'))}/` },
  machineseeker: { name: 'Machineseeker', flag: '🇪🇺', foreign: true, link: q => `https://www.machineseeker.com/mss/${encodeURIComponent(slug(q))}` },
  machinerytrader:{ name: 'MachineryTrader.eu', flag: '🇪🇺', foreign: true, link: q => `https://www.machinerytrader.eu/listings/for-sale/${encodeURIComponent(slug(q))}/machines` },
  kleinanzeigen: { name: 'Kleinanzeigen', flag: '🇩🇪', cc: 'DE', foreign: true, link: q => `https://www.kleinanzeigen.de/s-${encodeURIComponent(slug(q))}/k0` }
};
const AUTO = ["mobilebg", "bazar", "machineseeker", "kleinanzeigen"];
function slug(q) { return q.toLowerCase().trim().replace(/\s+/g, '-'); }
const gsite = (site, extra = '') => q => `https://www.google.com/search?q=${encodeURIComponent(`site:${site} ${q} ${extra}`.trim())}`;
// Каталог на източниците (само за ръчно отваряне)
const DIRECTORY = [
  { g: 'Производители — употребявана, демо и сертифицирана техника', items: [
    { name: 'Cat Used', note: 'Официална платформа на Caterpillar', home: 'https://catused.cat.com', link: gsite('catused.cat.com') },
    { name: 'Komatsu Used', note: 'Сертифицирана употребявана техника Komatsu', home: 'https://used.komatsu.eu', link: gsite('used.komatsu.eu') },
    { name: 'Volvo CE Used', note: 'Употребявани машини от дилърите на Volvo', home: 'https://www.volvoce.com', link: gsite('volvoce.com', 'used') },
    { name: 'Liebherr Used Equipment', note: 'Пазарът на Liebherr за употребявани машини', home: 'https://www.liebherr.com', link: gsite('liebherr.com', 'used equipment') },
    { name: 'JCB Used', note: 'Употребявани и демо машини JCB', home: 'https://www.jcb.com', link: gsite('jcb.com', 'used') },
    { name: 'Hidromek', note: 'Демо и употребявани машини', home: 'https://www.hidromek.com', link: gsite('hidromek.com', 'used OR demo') },
    { name: 'Ammann', note: 'Демо и употребявани машини', home: 'https://www.ammann.com', link: gsite('ammann.com', 'used OR demo') },
    { name: 'Bobcat', note: 'Употребявана техника Bobcat', home: 'https://www.bobcat.com/eu', link: gsite('bobcat.com', 'used') },
    { name: 'Wacker Neuson', note: 'Употребявани и демо машини', home: 'https://www.wackerneuson.com', link: gsite('wackerneuson.com', 'used') }
  ] },
  { g: 'Търгове', items: [
    { name: 'Ritchie Bros.', note: 'Международни търгове за техника', home: 'https://www.rbauction.com', link: gsite('rbauction.com') },
    { name: 'Euro Auctions', note: 'Търгове в Европа', home: 'https://www.euroauctions.com', link: gsite('euroauctions.com') },
    { name: 'Troostwijk', note: 'Онлайн търгове на активи', home: 'https://www.troostwijkauctions.com', link: gsite('troostwijkauctions.com') },
    { name: 'Surplex', note: 'Индустриални търгове', home: 'https://www.surplex.com', link: gsite('surplex.com') }
  ] },
  { g: 'Лизинг — върнати и изкупени машини', items: [
    { name: 'УниКредит Лизинг', note: 'Продажба на активи', home: 'https://www.unicreditleasing.bg', link: gsite('unicreditleasing.bg', 'продажба') },
    { name: 'ДСК Лизинг', note: 'Продажба на активи', home: 'https://www.dskleasing.bg', link: gsite('dskleasing.bg', 'продажба') },
    { name: 'Интерлийз', note: 'Продажба на активи', home: 'https://www.interlease.bg', link: gsite('interlease.bg', 'продажба') },
    { name: 'Всички лизингови дружества', note: 'Търсене за върнати лизингови активи', home: '', link: q => `https://www.google.com/search?q=${encodeURIComponent('върнати лизингови активи продажба ' + q)}` }
  ] },
  { g: 'Още пазари', items: [
    { name: 'MachineryZone', note: 'Европейски пазар за техника', home: 'https://www.machineryzone.eu', link: gsite('machineryzone.eu') },
    { name: 'Trademachines', note: 'Търсачка в много сайтове', home: 'https://www.trademachines.com', link: gsite('trademachines.com') },
    { name: 'Agriaffaires', note: 'Земеделска и строителна техника', home: 'https://www.agriaffaires.com', link: gsite('agriaffaires.com') }
  ] }
];
const FB = [
  { name: 'Marketplace', link: q => `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(q)}` },
  { name: 'Публикации', link: q => `https://www.facebook.com/search/posts/?q=${encodeURIComponent(q)}` },
  { name: 'Групи', link: q => `https://www.facebook.com/search/groups/?q=${encodeURIComponent(q)}` }
];
const COUNTRIES = {
  BG: ['🇧🇬', 'България', /българия|bulgaria|bulgarien/], DE: ['🇩🇪', 'Германия', /germany|deutschland|германия/],
  IT: ['🇮🇹', 'Италия', /italy|italia|италия/], FR: ['🇫🇷', 'Франция', /france|франция/], NL: ['🇳🇱', 'Нидерландия', /netherlands|nederland|холандия|нидерландия/],
  BE: ['🇧🇪', 'Белгия', /belgium|belgique|belgië|белгия/], AT: ['🇦🇹', 'Австрия', /austria|österreich|австрия/], PL: ['🇵🇱', 'Полша', /poland|polska|полша/],
  RO: ['🇷🇴', 'Румъния', /romania|românia|румъния/], CZ: ['🇨🇿', 'Чехия', /czech|česk|чехия/], ES: ['🇪🇸', 'Испания', /spain|españa|испания/],
  DK: ['🇩🇰', 'Дания', /denmark|danmark|дания/], SE: ['🇸🇪', 'Швеция', /sweden|sverige|швеция/], FI: ['🇫🇮', 'Финландия', /finland|suomi|финландия/],
  GR: ['🇬🇷', 'Гърция', /greece|ελλάδα|гърция/], HU: ['🇭🇺', 'Унгария', /hungary|magyar|унгария/], SK: ['🇸🇰', 'Словакия', /slovakia|slovensk|словакия/],
  HR: ['🇭🇷', 'Хърватия', /croatia|hrvatska|хърватия/], SI: ['🇸🇮', 'Словения', /slovenia|slovenija|словения/], PT: ['🇵🇹', 'Португалия', /portugal|португалия/],
  LT: ['🇱🇹', 'Литва', /lithuania|lietuva|литва/], CH: ['🇨🇭', 'Швейцария', /switzerland|schweiz|швейцария/]
};
const CATS = [
  ['minibackhoe','Мини комбинирани багери',  /мини комбиниран|мини багер[ -]?товарач|hmk ?62|\b1 ?cx\b|mini backhoe|minibaggerlader/],
  ['backhoe',    'Комбинирани багери',       /багер[ -]?товарач|комбиниран багер|backhoe|baggerlader|buldoexcavator|koparko[- ]?ładowark|hmk ?\d{2,3} ?b|\b[34] ?cx\b/],
  ['telehandler','Телескопични товарачи',    /телескоп|telehandler|teleskoplader|manitou|merlo|ładowarka teleskop/],
  ['minicl',     'Мини челни товарачи',      /мини челен|бобкат|skid ?steer|kompaktlader|minilader|компактен товарач|\bbobcat\b|bobcat s\d/],
  ['midi',       'Миди багери',              /миди багер|midibagger|midi excavator|midi-bagger/],
  ['mini',       'Мини багери',              /мини багер|minibagger|mini excavator|kompaktbagger|minikoparka|mini ?excavator/],
  ['crawler',    'Верижни багери',           /верижен багер|верижни багер|kettenbagger|crawler excavator|koparka gąsienicowa/],
  ['dozer',      'Булдозери',                /булдозер|bulldozer|\bdozer|planierraupe|spycharka/],
  ['excavator',  'Колесни и други багери',   /багер|excavator|bagger|koparka|escavatore/],
  ['loader',     'Челни товарачи',           /челен товарач|колесен товарач|товарач|wheel loader|radlader|ładowarka|incarcator|chargeuse/],
  ['tipper',     'Самосвали (с кран, тристранни)', /самосвал|тристран|кран[- ]?манипулатор|kipper|dreiseiten|tipper|dump truck|wywrotka/],
  ['garbage',    'Сметосъбиращи камиони',    /сметосъбира|боклукчийск|müllwagen|garbage truck|refuse (truck|collector)|śmieciarka/],
  ['aerial',     'Вишки',                    /вишка|автовишка|arbeitsbühne|hubarbeitsbühne|aerial|boom lift|scissor lift|podnośnik/],
  ['asphaltrec', 'Рециклатори за асфалт',    /рециклатор|рециклиране на асфалт|термоконтейнер|asphalt recycler|asphaltrecycler|hot box/],
  ['parts',      'Части и ремонт',           /части|резервн|ремонт|сервиз|ersatzteil|spare part|repair/],
  ['attach',     'Прикачен инвентар',        /кофа|бързосменник|инвентар|свредел|bucket|quick ?coupler|attachment|tiltrotator|грайфер|schnellwechsler|löffel/],
  ['breaker',    'Хидравлични чукове',       /хидравличен чук|къртач|\bчук\b|breaker|hydraulikhammer|imeks|hycon/],
  ['mulcher',    'Мулчери',                  /мулчер|mulcher|forstmulcher|\bfae\b/],
  ['roller',     'Валяци',                   /валяк|roller|walze|rullo|compactor|walec/],
  ['compaction', 'Виброплочи и трамбовки',   /виброплоча|трамбовк|пачекрак|plate compactor|rüttelplatte|rammer|stampfer/],
  ['paver',      'Асфалтова техника',        /асфалт|paver|fertiger|фреза|milling/],
  ['crusher',    'Трошачки и сита',          /трошачк|сито|crusher|screen|brecher|siebanlage|komplet/],
  ['drilling',   'Безизкопни технологии',    /къртица|сондаж|grundomat|grundodrill|хоризонтал|directional drill|hdd/],
  ['generator',  'Генератори',               /генератор|generator|stromerzeuger|aksa|sdmo/],
  ['compressor', 'Компресори',               /компресор|compressor|kompressor|atmos/]
];
const PRIORITY = ['minibackhoe', 'backhoe', 'mini', 'midi', 'crawler', 'excavator', 'minicl', 'loader', 'telehandler', 'dozer'];
const BOATS = /лодк|катер|яхт|джет|jet ?ski|извънбордов|плавателн|понтон|\bboot\b|boat|yacht|schlauchboot|außenborder/;
const BRANDS = ['Hidromek', 'JCB', 'Develon', 'Merlo', 'Sany', 'Mecalac', 'Wacker Neuson', 'Caterpillar', 'Komatsu', 'Volvo', 'Case', 'New Holland', 'Bobcat', 'Takeuchi', 'Kubota', 'Hitachi', 'Liebherr', 'Doosan', 'Hyundai', 'Terex', 'Manitou', 'Ammann', 'Bomag', 'Dynapac', 'Hamm', 'Wacker', 'FAE', 'Atlas Copco', 'Yanmar', 'Kobelco'];
const TYPES = { all: 'Всички обяви', wanted: 'Търсят', sale: 'Продават', service: 'Сервиз и части', rent: 'Под наем' };
const TBADGE = { wanted: 'ТЪРСИ', sale: 'ПРОДАВА', service: 'СЕРВИЗ', rent: 'НАЕМ' };
const SORTS = { new: 'Най-нови', pasc: 'Цена — възходящо', pdesc: 'Цена — низходящо' };
const NCATS = { all: 'Всички', infra: 'Инфраструктурни проекти', economy: 'Икономика', energy: 'Енергетика', industry: 'Развитие на бранша', machines: 'Техника', knowhow: 'Ноу-хау' };
const NSHORT = { infra: 'Проекти', economy: 'Икономика', energy: 'Енергетика', industry: 'Бранш', machines: 'Техника', knowhow: 'Ноу-хау' };
const NTFY_TOPIC = 'stroiradar-ng-c2e7b1bf';

const ICON_MACHINE = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M8 46h32a6 6 0 0 1 0 12H8a6 6 0 0 1 0-12z"/><path d="M10 46V34h28v12M16 34V22h12l5 12M36 38l14-14 4 3-14 15M50 24l8 5-3 4"/><circle cx="10" cy="52" r="2"/><circle cx="24" cy="52" r="2"/><circle cx="38" cy="52" r="2"/></svg>';
const ICON_STAR = '<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="m12 3 2.8 5.6 6.2.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.2-.9z"/></svg>';
const ICON_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>';

// ---------- Ноу-хау (собствено съдържание) ----------
const KNOW = [
  { t: 'Проверка на употребяван багер-товарач', s: 'Какво да огледаш преди да платиш', i: 'M4 20h16M6 16l4-8 4 5 3-3 3 6',
    p: ['Сравни моточасовете с износването: луфт в щифтовете и втулките на стрелата и кофата издава реално натоварване.',
        'Запали двигателя студен — тежко палене, син или бял дим и шум от горивната система са червен флаг.',
        'Провери за течове по хидравличните цилиндри, маркучите и разпределителя; изтегли всеки цилиндър докрай.',
        'Огледай гумите, моста и скоростната кутия при движение с товар напред и назад.',
        'Поискай сервизна книжка и фактури за масла и филтри; провери серийния номер срещу документите.',
        'Техниката в България се регистрира в Областна дирекция „Земеделие“ — провери за тежести и собственост.'] },
  { t: 'Избор на виброплоча или трамбовка', s: 'Почва, дебелина на слоя, тегло', i: 'M4 18h16M7 18v-5h10v5M12 13V6',
    p: ['Несвързани почви (пясък, чакъл, трошен камък): виброплоча — едностранна за тънки слоеве, реверсивна за по-дебели.',
        'Свързани почви (глина) и тесни изкопи: трамбовка (пачекрак) — ударът уплътнява по-добре от вибрацията.',
        'По-тежката машина уплътнява по-дълбок слой; съобрази дебелината на насипа с данните на производителя.',
        'Около тръби и шахти работи с по-лека машина и на тънки слоеве, за да не повредиш съоръжението.',
        'За плочки и павета използвай гумена подложка под плочата.'] },
  { t: 'Хидравличен чук — правилна работа', s: 'Удължава живота на чука и багера', i: 'M12 3v10M8 13h8l-2 8h-4z',
    p: ['Подбери чука по теглото на багера и по дебит и налягане на хидравликата — това е основата за ресурс.',
        'Не удряй на празен ход (без опора върху материала) — бие се самият чук и креплението.',
        'Не използвай чука като лост и не мести материал с него.',
        'Натискът е умерен: не повдигай веригите или колелата на машината от земята.',
        'Смазвай длетото редовно по указанието на производителя — обикновено на всеки 2 работни часа.'] },
  { t: 'Мулчер за багер или мини челен товарач', s: 'Съвместимост и избор на ротор', i: 'M4 16h16M6 16a6 6 0 0 1 12 0M12 10V4',
    p: ['Ключовото е дебитът (л/мин) и налягането на допълнителната хидравлика на машината — те определят модела.',
        'Много мулчери изискват свободна дренажна линия към резервоара; провери дали машината я има.',
        'При мини челни товарачи провери за high-flow хидравлика — тя определя производителността.',
        'Ротор с чукове е по-устойчив на камъни и по-дебела дървесина; ножовете дават по-фин резултат на трева.',
        'Работи с пълни обороти на двигателя и оглеждай терена за камъни и метал преди работа.'] },
  { t: 'Валяк — амплитуда и честота', s: 'Земни работи и асфалт', i: 'M3 16a4 4 0 1 0 8 0 4 4 0 1 0-8 0M11 16h7a3 3 0 0 0 0-6h-4',
    p: ['Висока амплитуда и ниска честота — за дебели слоеве и земни основи.',
        'Ниска амплитуда и висока честота — за асфалт и тънки горни слоеве.',
        'Не вибрирай на едно място и изключвай вибрацията преди спиране, за да не остават вдлъбнатини.',
        'При асфалт поддържай барабаните оросени, за да не залепва сместа.',
        'Минавай с припокриване между ивиците и спазвай температурния прозорец на асфалта.'] },
  { t: 'Подготовка на техниката за зимата', s: 'Преди първите студове', i: 'M12 3v18M4 7l16 10M20 7 4 17',
    p: ['Провери антифриза с рефрактометър — защитата трябва да покрива местните минимални температури.',
        'Премини на зимно дизелово гориво или добави подходяща добавка; дръж резервоара пълен срещу кондензат.',
        'Тествай акумулаторите и почисти клемите — студът намалява капацитета им.',
        'Провери вискозитета на хидравличното масло и подгрявай машината преди натоварване.',
        'Изпускай водата от горивните филтри и сепараторите.'] }
];

// ---------- Състояние ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('bb.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('bb.' + k, JSON.stringify(v)); } catch {} }
};
const S = {
  keywords: store.get('keywords', ['Hidromek', 'Ammann', 'FAE', 'IMEKS', 'Atmos', 'Grundomat', 'мулчер', 'валяк', 'багер товарач', 'хидравличен чук', 'генератор']),
  favs: store.get('favs', {}), disabled: store.get('disabled', []),
  type: 'all', cat: 'priority', region: 'all', sort: 'new', onlyKw: store.get('onlyKw', false),
  ack: store.get('ack', Date.now() - 864e5),
  notifKw: store.get('notifKw', true), notifWanted: store.get('notifWanted', false), notified: store.get('notified', []),
  liveUrl: store.get('liveUrl', ''), scope: 'all', theme: store.get('theme', ''),
  custom: store.get('custom', []),
  items: [], news: [], ncat: 'all', mkCountry: 'all', updated: null, newOnly: false, view: 'feed'
};
function save() {
  ['keywords', 'favs', 'disabled', 'onlyKw', 'ack', 'notifKw', 'notifWanted', 'liveUrl', 'theme', 'custom'].forEach(k => store.set(k, S[k]));
  store.set('notified', S.notified.slice(-800));
  syncPrefsToSW();
}

// ---------- Обработка на обява ----------
const norm = s => (s || '').toLowerCase();
const txt = it => norm(it.title + ' ' + (it.desc || '') + ' ' + (it.location || ''));
function prep(it) {
  const t = txt(it);
  it._cat = (CATS.find(c => c[2].test(t)) || ['other'])[0];
  it._boat = BOATS.test(t);
  let cc = SOURCES[it.source]?.cc;
  if (!cc || SOURCES[it.source]?.foreign) { const m = Object.entries(COUNTRIES).find(([, v]) => v[2].test(t)); if (m) cc = m[0]; }
  it._cc = cc || (SOURCES[it.source]?.foreign ? 'EU' : 'BG');
  it._eur = priceEur(it.price);
  it._brand = BRANDS.find(b => t.includes(b.toLowerCase())) || '';
  return it;
}
function priceEur(p) {
  if (!p) return null;
  const s = String(p).toLowerCase();
  if (/ден|day|tag|час|месец|month/.test(s)) return null;
  const m = /(\d[\d\s.,']*)/.exec(s); if (!m) return null;
  let n = m[1].replace(/[\s']/g, '');
  if (/^\d{1,3}([.,]\d{3})+([.,]\d{1,2})?$/.test(n)) n = n.replace(/[.,](\d{3})/g, '$1');
  n = parseFloat(n.replace(',', '.'));
  if (!isFinite(n) || n <= 0) return null;
  if (/лв|bgn/.test(s)) n /= BGN;
  else if (/\$|usd/.test(s)) n *= 0.92;
  else if (!/€|eur|евро/.test(s)) return null;
  return Math.round(n);
}
const fmtEur = n => n == null ? '—' : '€ ' + Math.round(n).toLocaleString('bg-BG').replace(/,/g, ' ');
const kwMatch = it => { const t = txt(it); return S.keywords.some(k => t.includes(norm(k))); };
const when = it => new Date(it.firstSeen || it.date).getTime();
const isNew = it => when(it) > S.ack;
const wantsNotify = it => (!S.notifKw || kwMatch(it)) && (!S.notifWanted || it.type === 'wanted');
const live = () => S.items.filter(i => !S.disabled.includes(i.source) && !i._boat);
function ago(d) {
  const m = Math.round((Date.now() - new Date(d)) / 6e4);
  if (m < 1) return 'току-що'; if (m < 60) return `преди ${m} мин`;
  const h = Math.round(m / 60); if (h < 24) return `преди ${h} ч`;
  const dd = Math.round(h / 24); return dd === 1 ? 'вчера' : `преди ${dd} дни`;
}
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2400); }
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// ---------- Карта на обява ----------
function card(it) {
  const src = SOURCES[it.source] || { name: it.source, flag: '🌐' };
  const fav = !!S.favs[it.id];
  const c = COUNTRIES[it._cc];
  const eur = it._eur != null && !/€|eur/i.test(it.price || '') ? `<small>≈ ${fmtEur(it._eur)}</small>` : '';
  return `<article class="card ${isNew(it) ? 'fresh' : ''}">
    <a class="thumb ${it.photo ? '' : 'none'}" href="${esc(it.url)}" target="_blank" rel="noopener" ${it.photo ? `style="background-image:url('${esc(it.photo)}')"` : ''}>${it.photo ? '' : ICON_MACHINE}<span class="flag t-${esc(it.type || 'sale')}">${TBADGE[it.type] || 'ПРОДАВА'}</span></a>
    <div class="cbody">
      <a class="ctitle" href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.title)}</a>
      ${it.price ? `<div class="cprice">${esc(it.price)}${eur}</div>` : ''}
      <div class="cmeta">${isNew(it) ? '<span class="new">НОВО</span>' : ''}<span>${c ? c[0] : src.flag} ${esc(it.location || (c ? c[1] : 'Европа'))}</span><span>${ago(it.firstSeen || it.date)}</span></div>
      <div class="cfoot"><a class="open" href="${esc(it.url)}" target="_blank" rel="noopener">${esc(src.name)} ›</a><button class="star ${fav ? 'on' : ''}" data-fav="${esc(it.id)}" aria-label="Запази">${ICON_STAR}</button></div>
    </div></article>`;
}

// ---------- Падащи филтри ----------
function ddLabel(k) {
  if (k === 'type') return S.type === 'all' ? 'Всички обяви' : TYPES[S.type];
  if (k === 'cat') return S.cat === 'all' ? 'Всички категории' : S.cat === 'priority' ? '★ Багери и товарачи' : CATS.find(c => c[0] === S.cat)?.[1] || 'Друго';
  if (k === 'region') return S.region === 'all' ? 'България и Европа' : S.region === 'bg' ? 'България' : S.region === 'eu' ? 'Европа' : (COUNTRIES[S.region]?.[0] + ' ' + COUNTRIES[S.region]?.[1]);
  if (k === 'sort') return SORTS[S.sort];
}
function renderToolbar() {
  $$('#toolbar .dd').forEach(b => {
    const k = b.dataset.dd;
    const set = (k === 'type' && S.type !== 'all') || (k === 'cat' && S.cat !== 'all' && S.cat !== 'priority') || (k === 'region' && S.region !== 'all');
    b.classList.toggle('set', set);
    b.innerHTML = esc(ddLabel(k)) + ICON_DOWN;
  });
}
function openSheet(title, opts, onPick) {
  $('#sheetTitle').textContent = title;
  $('#sheetBody').innerHTML = opts.map((o, i) => `<button class="opt ${o.on ? 'on' : ''}" data-i="${i}"><span class="ck"></span>${esc(o.label)}${o.n != null ? `<span class="n">${o.n}</span>` : ''}</button>`).join('');
  $('#sheetBody').onclick = e => { const b = e.target.closest('.opt'); if (!b) return; closeOverlays(); onPick(opts[+b.dataset.i].v); };
  $('#sheet').classList.add('on'); $('#scrim').classList.add('on');
}
function closeOverlays() { $('#sheet').classList.remove('on'); $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); }
function openDD(k) {
  const base = live();
  if (k === 'type') openSheet('Вид обява', Object.entries(TYPES).map(([v, label]) => ({ v, label, on: S.type === v, n: v === 'all' ? base.length : base.filter(i => i.type === v).length })), v => { S.type = v; renderFeed(); });
  if (k === 'cat') openSheet('Категория техника', [{ v: 'priority', label: '★ Багери и товарачи (приоритет)', n: base.filter(i => PRIORITY.includes(i._cat)).length }, { v: 'all', label: 'Всички категории', n: base.length }, ...CATS.map(c => ({ v: c[0], label: c[1], n: base.filter(i => i._cat === c[0]).length })).filter(o => o.n), { v: 'other', label: 'Друго', n: base.filter(i => i._cat === 'other').length }].map(o => ({ ...o, on: S.cat === o.v })), v => { S.cat = v; renderFeed(); });
  if (k === 'region') {
    const ccs = Object.keys(COUNTRIES).map(cc => ({ v: cc, label: COUNTRIES[cc][0] + ' ' + COUNTRIES[cc][1], n: base.filter(i => i._cc === cc).length })).filter(o => o.n).sort((a, b) => b.n - a.n);
    openSheet('Пазар', [{ v: 'all', label: 'България и Европа', n: base.length }, { v: 'bg', label: '🇧🇬 Само България', n: base.filter(i => !SOURCES[i.source]?.foreign).length }, { v: 'eu', label: '🇪🇺 Само Европа', n: base.filter(i => SOURCES[i.source]?.foreign).length }, ...ccs].map(o => ({ ...o, on: S.region === o.v })), v => { S.region = v; renderFeed(); });
  }
  if (k === 'sort') openSheet('Подреждане', Object.entries(SORTS).map(([v, label]) => ({ v, label, on: S.sort === v })), v => { S.sort = v; renderFeed(); });
}

// ---------- Обяви ----------
function visible() {
  let v = live().filter(it =>
    (S.type === 'all' || it.type === S.type) && (S.cat === 'all' || (S.cat === 'priority' ? PRIORITY.includes(it._cat) : it._cat === S.cat)) &&
    (S.region === 'all' || (S.region === 'bg' ? !SOURCES[it.source]?.foreign : S.region === 'eu' ? SOURCES[it.source]?.foreign : it._cc === S.region)) &&
    (!S.onlyKw || kwMatch(it)) && (!S.newOnly || isNew(it)));
  if (S.sort === 'pasc') v = v.filter(i => i._eur).sort((a, b) => a._eur - b._eur);
  else if (S.sort === 'pdesc') v = v.filter(i => i._eur).sort((a, b) => b._eur - a._eur);
  return v;
}
function renderFeed() {
  renderToolbar();
  const v = visible();
  $('#count').textContent = S.newOnly ? `${v.length} нови · покажи всички ✕` : `${v.length} обяви`;
  $('#count').style.cursor = S.newOnly ? 'pointer' : '';
  $('#feed').innerHTML = v.length ? v.slice(0, 300).map(card).join('')
    : `<div class="empty">${ICON_MACHINE}<b>${S.items.length ? 'Няма обяви по тези филтри' : 'Събираме първите обяви'}</b>${S.items.length ? 'Промени категорията или пазара от филтрите горе.' : 'Първото събиране от сайтовете приключва до 20 минути. Ще те известим за новите.'}</div>`;
  renderStats();
}
function renderStats() {
  const base = live();
  const day = Date.now() - 864e5;
  $('#stNew').textContent = base.filter(i => when(i) > day).length;
  $('#stWanted').textContent = base.filter(i => i.type === 'wanted').length;
  $('#stAll').textContent = base.length;
  const nNew = base.filter(i => isNew(i) && wantsNotify(i)).length;
  $('#bell').classList.toggle('on', nNew > 0);
  $('#bellCnt').textContent = nNew > 99 ? '99+' : nNew;
  $('#dNew').textContent = nNew ? nNew + ' нови' : ''; $('#dNew').style.display = nNew ? '' : 'none';
  if ('setAppBadge' in navigator) { try { nNew ? navigator.setAppBadge(nNew) : navigator.clearAppBadge(); } catch {} }
  document.title = nNew ? `(${nNew}) BuildBench EU` : 'BuildBench EU';
}

// ---------- Банери ----------
function renderBanners() {
  const base = live();
  const w = base.filter(i => i.type === 'wanted').length;
  const infra = S.news.filter(n => n.cat === 'infra').length;
  const bn = [
    { c: 'bn-1', h: w ? `${w} души търсят техника` : 'Кой търси техника днес', p: 'Купувачи и наематели от обявите — готови клиенти.', go: 'Виж търсещите', act: () => { S.type = 'wanted'; S.cat = 'all'; renderFeed(); scrollToList(); } },
    { c: 'bn-2', h: 'Сравни цените в Европа', p: 'Медианни цени по категории — България срещу ЕС.', go: 'Към пазарите', act: () => show('market') },
    { c: 'bn-3', h: 'Инфраструктурни проекти', p: infra ? `${infra} нови материала за пътища, ВиК и енергетика.` : 'Пътища, ВиК, енергетика и обществени поръчки.', go: 'Прочети', act: () => { S.ncat = 'infra'; show('news'); } },
    { c: 'bn-4', h: 'Ноу-хау от бранша', p: 'Как да провериш употребявана машина преди покупка.', go: 'Отвори', act: () => show('know') }
  ];
  renderBanners.acts = bn.map(b => b.act);
  const deco = '<svg class="deco" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="32" r="12"/><circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="30"/><path d="M32 32 52 12"/></svg>';
  $('#banners').innerHTML = bn.map((b, i) => `<button class="banner ${b.c}" data-bn="${i}">${deco}<div><h3>${esc(b.h)}</h3><p>${esc(b.p)}</p></div><span class="go">${esc(b.go)} ›</span></button>`).join('');
  $('#bdots').innerHTML = bn.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('');
}
$('#banners').addEventListener('scroll', () => {
  const el = $('#banners'); const i = Math.round(el.scrollLeft / (el.scrollWidth / el.children.length));
  $$('#bdots i').forEach((d, j) => d.classList.toggle('on', j === i));
}, { passive: true });
function scrollToList() { $('#toolbar').scrollIntoView({ behavior: 'smooth' }); }

// ---------- Пазари ----------
function renderMarket() {
  const all = live().filter(i => i.type === 'sale' && i._eur && i._eur > 400 && i._eur < 3e6);
  const listings = live();
  const byCc = {};
  listings.forEach(i => { (byCc[i._cc] ||= []).push(i); });
  const ccList = Object.entries(byCc).filter(([cc]) => COUNTRIES[cc]).sort((a, b) => b[1].length - a[1].length);
  $('#countries').innerHTML = `<button class="ctry ${S.mkCountry === 'all' ? 'on' : ''}" data-mk="all"><b>🇪🇺</b><span>Цяла Европа</span><small>${listings.length} обяви</small></button>` +
    ccList.map(([cc, arr]) => `<button class="ctry ${S.mkCountry === cc ? 'on' : ''}" data-mk="${cc}"><b>${COUNTRIES[cc][0]}</b><span>${COUNTRIES[cc][1]}</span><small>${arr.length} обяви</small></button>`).join('');
  const pool = S.mkCountry === 'all' ? listings : (byCc[S.mkCountry] || []);
  const priced = pool.filter(i => i.type === 'sale' && i._eur && i._eur > 400 && i._eur < 3e6);
  const day = Date.now() - 864e5;
  $('#mkTiles').innerHTML = [
    ['Активни обяви', pool.length, ''],
    ['Медианна цена', fmtEur(median(priced.map(i => i._eur))), ''],
    ['Търсят техника', pool.filter(i => i.type === 'wanted').length, ''],
    ['Нови за 24 ч', pool.filter(i => when(i) > day).length, '']
  ].map(([l, v]) => `<div class="mk"><div class="lbl">${l}</div><div class="val">${v}</div></div>`).join('');

  // Сравнение България срещу Европа по категории
  const rows = CATS.map(([k, label]) => {
    const inCat = all.filter(i => i._cat === k);
    const bg = median(inCat.filter(i => i._cc === 'BG').map(i => i._eur));
    const eu = median(inCat.filter(i => i._cc !== 'BG').map(i => i._eur));
    const sel = S.mkCountry === 'all' ? median(inCat.map(i => i._eur)) : median(inCat.filter(i => i._cc === S.mkCountry).map(i => i._eur));
    return { k, label, n: inCat.length, bg, eu, sel };
  }).filter(r => r.n >= 2);
  const max = Math.max(1, ...rows.map(r => Math.max(r.bg || 0, r.eu || 0, r.sel || 0)));
  $('#benchSub').textContent = 'Жълто — България, синьо — останалата Европа. Медиана в евро.';
  $('#bench').innerHTML = rows.length ? rows.map(r => {
    const diff = r.bg && r.eu ? Math.round((r.bg / r.eu - 1) * 100) : null;
    return `<div class="brow"><span class="nm">${esc(r.label)}</span><span class="px">${fmtEur(r.sel)}</span>
      <div class="bar"><i class="y" style="width:${(r.bg || 0) / max * 100}%"></i></div>
      <div class="bar"><i style="width:${(r.eu || 0) / max * 100}%"></i></div>
      <span class="ds">${r.n} обяви с цена · БГ ${fmtEur(r.bg)} · ЕС ${fmtEur(r.eu)}</span><span class="ds">${diff == null ? '' : (diff > 0 ? `БГ +${diff}%` : `БГ ${diff}%`)}</span></div>`;
  }).join('') : `<div class="empty" style="padding:26px">Цените ще се появят след първите събрани обяви с цена.</div>`;

  const bc = {};
  pool.forEach(i => { if (i._brand) bc[i._brand] = (bc[i._brand] || 0) + 1; });
  const top = Object.entries(bc).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const bmax = top[0]?.[1] || 1;
  $('#brands').innerHTML = top.length ? top.map(([b, n]) => `<div class="brow"><span class="nm">${esc(b)}</span><span class="px">${n}</span><div class="bar"><i style="width:${n / bmax * 100}%"></i></div></div>`).join('')
    : `<div class="empty" style="padding:26px">Още няма достатъчно данни.</div>`;
}

// ---------- Новини ----------
function newsItem(n) {
  return `<a class="nitem" href="${esc(n.url)}" target="_blank" rel="noopener"><div class="nt">${esc(n.title)}</div><div class="nm"><span class="cat c-${n.cat}">${NSHORT[n.cat]}</span>${esc(n.source || '')} · ${ago(n.date)}${n.lang === 'en' ? ' · EN' : ''}</div></a>`;
}
function renderNews() {
  $('#newsBar').innerHTML = Object.entries(NCATS).map(([k, l]) => `<button class="dd ${S.ncat === k ? 'set' : ''}" data-ncat2="${k}">${esc(k === 'all' ? 'Всички' : NSHORT[k])}</button>`).join('');
  const list = S.news.filter(n => S.ncat === 'all' || n.cat === S.ncat);
  if (!list.length) { $('#newsList').innerHTML = `<div class="empty"><b>Новините се събират</b>Първите материали идват със следващото обновяване.</div>`; return; }
  const [lead, ...rest] = list;
  $('#newsList').innerHTML = `<a class="lead" href="${esc(lead.url)}" target="_blank" rel="noopener"><span class="cat c-${lead.cat}">${NSHORT[lead.cat]}</span><div class="nt">${esc(lead.title)}</div><div class="nm">${esc(lead.source || '')} · ${ago(lead.date)}</div></a>
    <div class="news">${rest.slice(0, 80).map(newsItem).join('')}</div>`;
}
function renderKnow() {
  $('#knowList').innerHTML = KNOW.map(k => `<details class="kh"><summary><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${k.i}"/></svg></span><span><b>${esc(k.t)}</b><small>${esc(k.s)}</small></span></summary><ul>${k.p.map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`).join('');
  const kn = S.news.filter(n => n.cat === 'knowhow').slice(0, 20);
  $('#knowNews').innerHTML = kn.length ? `<div class="news">${kn.map(newsItem).join('')}</div>` : `<p class="note">Статиите се събират автоматично и ще се появят тук.</p>`;
}

// ---------- Търсачка ----------
const inScope = k => S.scope === 'all' || (S.scope === 'foreign' ? !!SOURCES[k]?.foreign : !SOURCES[k]?.foreign);
async function doSearch(q) {
  q = q.trim(); if (!q) return;
  const words = norm(q).split(/\s+/);
  const local = live().filter(it => inScope(it.source) && words.every(w => txt(it).includes(w)));
  const siteBtns = Object.entries(SOURCES).filter(([k]) => inScope(k)).map(([, s]) => `<a class="site" href="${esc(s.link(q))}" target="_blank" rel="noopener"><i>${s.flag}</i>${esc(s.name)}</a>`).join('');
  const fbBtns = FB.map(f => `<a class="site fb" href="${esc(f.link(q))}" target="_blank" rel="noopener"><i>f</i>${f.name}</a>`).join('');
  $('#sResults').innerHTML = `
    <div class="sec"><h2>В събраните обяви</h2><p class="sub">${local.length ? local.length + ' съвпадения' : 'Няма съвпадения засега'}</p></div>
    <div class="list">${local.slice(0, 100).map(card).join('')}</div>
    <div id="liveBox"></div>
    <div class="sec"><h2>Търси директно в сайтовете</h2><p class="sub">Отваря търсенето за „${esc(q)}“ във всеки сайт.</p></div><div class="sites">${siteBtns}</div>
    <div class="sec"><h2>Facebook</h2><p class="sub">Изисква вход във Facebook.</p></div><div class="sites">${fbBtns}</div>
    ${DIRECTORY.map(d => `<div class="sec"><h2>${esc(d.g)}</h2></div><div class="sites">${d.items.map(x => `<a class="site" href="${esc(x.link(q))}" target="_blank" rel="noopener">${esc(x.name)}</a>`).join('')}</div>`).join('')}
    ${S.custom.length ? `<div class="sec"><h2>Моите източници</h2></div><div class="sites">${S.custom.map(c => `<a class="site" href="${esc(gsite(c.url.replace(/^https?:\/\//, '').replace(/\/.*$/, ''))(q))}" target="_blank" rel="noopener">${esc(c.name)}</a>`).join('')}</div>` : ''}<div style="height:18px"></div>`;
  if (S.liveUrl) {
    $('#liveBox').innerHTML = `<div class="sec"><h2>На живо от сайтовете</h2><p class="sub">Търся…</p></div>`;
    try {
      const r = await fetch(`${S.liveUrl.replace(/\/$/, '')}/search?q=${encodeURIComponent(q)}&scope=${S.scope}`);
      const j = await r.json();
      const its = (j.items || []).filter(i => !S.disabled.includes(i.source)).map(prep);
      S.liveCache = Object.fromEntries(its.map(i => [i.id, i]));
      $('#liveBox').innerHTML = `<div class="sec"><h2>На живо от сайтовете</h2><p class="sub">${its.length} резултата</p></div><div class="list">${its.map(card).join('')}</div>`;
    } catch { $('#liveBox').innerHTML = `<div class="sec"><h2>На живо от сайтовете</h2><p class="sub">Услугата не отговаря. Провери адреса в Настройки.</p></div>`; }
  }
}

// ---------- Всички източници ----------
function dirRow(x, q) {
  const href = q && x.link ? x.link(q) : (x.home || (x.link ? x.link('') : '#'));
  return `<a class="nitem" href="${esc(href)}" target="_blank" rel="noopener"><div class="nt">${esc(x.name)}</div><div class="nm">${esc(x.note || '')}</div></a>`;
}
function renderSources() {
  const q = ($('#dirQ').value || '').trim();
  const auto = Object.entries(SOURCES).filter(([k]) => AUTO.includes(k)).map(([k, s]) => ({ name: `${s.flag} ${s.name}`, note: `Следи се автоматично · ${S.items.filter(i => i.source === k).length} обяви`, home: s.link(''), link: s.link }));
  const manual = Object.entries(SOURCES).filter(([k]) => !AUTO.includes(k)).map(([k, s]) => ({ name: `${s.flag} ${s.name}`, note: 'Търсене с едно докосване', home: s.link(''), link: s.link }));
  const mine = S.custom.map((c, i) => ({ name: c.name, note: c.url, home: c.url, link: gsite(c.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')), i }));
  $('#dirList').innerHTML =
    `<div class="sec"><h2>Следени автоматично</h2><p class="sub">Обявите от тези сайтове идват в приложението на всеки 20 минути.</p></div><div class="news">${auto.map(x => dirRow(x, q)).join('')}</div>` +
    `<div class="sec"><h2>Големи пазари</h2><p class="sub">Тези сайтове не позволяват автоматично събиране — отварят търсенето ти директно.</p></div><div class="news">${manual.map(x => dirRow(x, q)).join('')}</div>` +
    DIRECTORY.map(d => `<div class="sec"><h2>${esc(d.g)}</h2></div><div class="news">${d.items.map(x => dirRow(x, q)).join('')}</div>`).join('') +
    `<div class="sec"><h2>Моите източници</h2><p class="sub">Дилъри и сайтове, които следиш ти.</p></div>` +
    (mine.length ? `<div class="news">${mine.map(x => `<div class="nitem" style="display:flex;align-items:center;gap:8px"><a href="${esc(q ? x.link(q) : x.home)}" target="_blank" rel="noopener" style="flex:1;min-width:0"><div class="nt">${esc(x.name)}</div><div class="nm" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.note)}</div></a><button class="star" data-cdel="${x.i}" aria-label="Премахни">✕</button></div>`).join('')}</div>` : '') +
    `<form class="panel row" id="cForm" style="flex-wrap:wrap"><input id="cName" placeholder="Име, напр. дилър Volvo" required><input id="cUrl" placeholder="https://…" type="url" required><button class="btn primary">Добави източник</button></form>`;
  $('#cForm').onsubmit = e => { e.preventDefault(); S.custom.push({ name: $('#cName').value.trim(), url: $('#cUrl').value.trim() }); save(); renderSources(); toast('Източникът е добавен'); };
}

// ---------- Любими и настройки ----------
function renderFavs() {
  const f = Object.values(S.favs).map(prep).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  $('#favList').innerHTML = f.length ? f.map(card).join('') : `<div class="empty">${ICON_STAR}<b>Още нямаш любими</b>Натисни звездата на обява, за да я запазиш тук.</div>`;
}
function renderSettings() {
  $('#kwList').innerHTML = S.keywords.map((k, i) => `<span class="kwc">${esc(k)}<button data-kwdel="${i}" aria-label="Премахни">✕</button></span>`).join('') || '<span class="st">Няма добавени думи.</span>';
  $('#notifKw').checked = S.notifKw; $('#notifWanted').checked = S.notifWanted; $('#onlyKw').checked = S.onlyKw; $('#liveUrl').value = S.liveUrl;
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  $('#notifBtn').textContent = perm === 'granted' ? 'Включени' : perm === 'denied' ? 'Блокирани' : 'Разреши';
  $('#ntfyBtn').href = `https://ntfy.sh/${NTFY_TOPIC}`;
  $('#ntfyNote').textContent = `За известия при затворено приложение: инсталирай „ntfy“ от Google Play и се абонирай за „${NTFY_TOPIC}“.`;
  $('#srcSet').innerHTML = Object.entries(SOURCES).filter(([k]) => AUTO.includes(k)).map(([k, s]) => `<label class="sw"><span>${s.flag} ${esc(s.name)} <span class="st">${S.items.filter(i => i.source === k).length} обяви</span></span><input type="checkbox" data-srcset="${k}" ${S.disabled.includes(k) ? '' : 'checked'}></label>`).join('');
}

// ---------- Навигация ----------
const HERO = {
  feed:   ['Пазарът на техника в Европа', 'Обяви, цени и проекти от България и Европа — обновява се на всеки 20 минути.'],
  market: ['Европейски пазари', 'Сравни цените на техниката в България и Европа.'],
  search: ['Търсачка', 'Намери конкретна машина във всички сайтове наведнъж.'],
  news:   ['Новини от бранша', 'Инфраструктура, икономика, енергетика и техника.'],
  know:   ['Ноу-хау', 'Практични насоки за избор, проверка и поддръжка.'],
  fav:    ['Любими', 'Обявите, които следиш.'],
  set:    ['Настройки', 'Ключови думи, известия и сайтове.'],
  src:    ['Всички източници', 'Пазари, производители, търгове и лизинг на едно място.']
};
function show(v) {
  S.view = v;
  $$('.view').forEach(x => x.classList.toggle('on', x.id === 'v-' + v));
  $$('nav.bottom button').forEach(b => b.classList.toggle('on', b.dataset.go === v));
  $$('.ditem').forEach(b => b.classList.toggle('on', b.dataset.go === v && !b.dataset.type && !b.dataset.ncat));
  $('#heroTitle').textContent = HERO[v][0]; $('#heroSub').textContent = HERO[v][1];
  $('.stats').style.display = v === 'feed' ? '' : 'none';
  if (v === 'market') renderMarket();
  if (v === 'news') renderNews();
  if (v === 'know') renderKnow();
  if (v === 'fav') renderFavs();
  if (v === 'set') renderSettings();
  if (v === 'src') renderSources();
  if (v === 'search') setTimeout(() => $('#sQ').focus(), 60);
  closeOverlays();
  window.scrollTo(0, 0);
}

document.addEventListener('click', e => {
  const b = e.target.closest('button, a'); if (!b) return;
  const d = b.dataset;
  if (d.go) {
    if (d.type) { S.type = d.type; S.cat = 'all'; }
    if (d.ncat) S.ncat = d.ncat;
    show(d.go); if (d.go === 'feed') renderFeed();
  }
  else if (d.dd) openDD(d.dd);
  else if (d.bn != null) renderBanners.acts[+d.bn]();
  else if (d.mk) { S.mkCountry = d.mk; renderMarket(); }
  else if (d.ncat2) { S.ncat = d.ncat2; renderNews(); }
  else if (d.scope) { S.scope = d.scope; $$('#scopeSeg button').forEach(x => x.classList.toggle('on', x === b)); if ($('#sQ').value) doSearch($('#sQ').value); }
  else if (d.cdel != null) { S.custom.splice(+d.cdel, 1); save(); renderSources(); }
  else if (d.kwdel != null) { S.keywords.splice(+d.kwdel, 1); save(); renderSettings(); renderStats(); }
  else if (d.th != null) { S.theme = d.th; applyTheme(); save(); }
  else if (d.fav) {
    e.preventDefault();
    const it = S.items.find(i => i.id === d.fav) || S.liveCache?.[d.fav] || S.favs[d.fav];
    if (S.favs[d.fav]) { delete S.favs[d.fav]; toast('Премахната от любими'); }
    else if (it) { const { _cat, _cc, _eur, _brand, ...raw } = it; S.favs[d.fav] = { ...raw, savedAt: Date.now() }; toast('Запазена в любими'); }
    save(); $$(`[data-fav="${CSS.escape(d.fav)}"]`).forEach(x => x.classList.toggle('on', !!S.favs[d.fav]));
    if (S.view === 'fav') renderFavs();
  }
});
$('#menuBtn').onclick = () => { $('#drawer').classList.add('on'); $('#scrim').classList.add('on'); };
$('#scrim').onclick = closeOverlays;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlays(); });
$('#bell').onclick = () => {
  show('feed');
  if ($('#bell').classList.contains('on')) { S.newOnly = true; S.type = 'all'; S.cat = 'all'; renderFeed(); scrollToList(); toast('Показвам новите обяви'); }
  else { renderFeed(); toast('Няма нови обяви'); }
};
$('#count').onclick = () => { if (S.newOnly) { S.newOnly = false; S.ack = Date.now(); save(); renderFeed(); } };
$('#onlyKw').onchange = e => { S.onlyKw = e.target.checked; save(); renderFeed(); };
$('#notifKw').onchange = e => { S.notifKw = e.target.checked; save(); renderStats(); };
$('#notifWanted').onchange = e => { S.notifWanted = e.target.checked; save(); renderStats(); };
$('#srcSet').onchange = e => { const k = e.target.dataset.srcset; if (!k) return; S.disabled = e.target.checked ? S.disabled.filter(x => x !== k) : [...S.disabled, k]; save(); renderFeed(); };
$('#kwForm').onsubmit = e => { e.preventDefault(); const v = $('#kwIn').value.trim(); if (v && !S.keywords.some(k => norm(k) === norm(v))) { S.keywords.push(v); save(); renderSettings(); renderStats(); toast(`„${v}“ е добавена`); } $('#kwIn').value = ''; };
$('#sForm').onsubmit = e => { e.preventDefault(); $('#sQ').blur(); doSearch($('#sQ').value); };
$('#liveSave').onclick = () => { S.liveUrl = $('#liveUrl').value.trim(); save(); toast('Запазено'); };
$('#notifBtn').onclick = async () => {
  if (!('Notification' in window)) return toast('Устройството не поддържа известия тук');
  const p = await Notification.requestPermission();
  if (p === 'granted') { await registerSW(); (await navigator.serviceWorker.ready).showNotification('BuildBench EU', { body: 'Известията са включени. Ще те алармираме при нова обява.', icon: 'icons/icon-192.png' }); }
  renderSettings();
};
new IntersectionObserver(([en]) => $('#toolbar').classList.toggle('stuck', !en.isIntersecting), { threshold: 0 }).observe($('#bdots'));

// ---------- Данни ----------
async function load(silent) {
  try {
    const [r1, r2] = await Promise.allSettled([fetch('data/listings.json?t=' + Date.now(), { cache: 'no-store' }), fetch('data/news.json?t=' + Date.now(), { cache: 'no-store' })]);
    if (r1.status === 'fulfilled' && r1.value.ok) { const j = await r1.value.json(); S.items = (j.items || []).map(prep); S.updated = j.updated; }
    if (r2.status === 'fulfilled' && r2.value.ok) { const j = await r2.value.json(); S.news = j.items || []; }
  } catch {}
  renderBanners(); renderFeed();
  if (S.view !== 'feed' && !silent) show(S.view);
  else if (S.view === 'market') renderMarket();
  notifyNew();
}
async function notifyNew() {
  const fresh = live().filter(i => isNew(i) && wantsNotify(i) && !S.notified.includes(i.id));
  if (!fresh.length) return;
  S.notified.push(...fresh.map(i => i.id)); save();
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker?.ready;
  for (const it of fresh.slice(0, 5)) {
    const src = SOURCES[it.source] || {};
    reg?.showNotification(`${it.type === 'wanted' ? 'Търсят техника' : 'Нова обява'} · ${src.name || ''}`, {
      body: `${it.title}${it.price ? '\n' + it.price : ''}`, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png',
      image: it.photo || undefined, tag: it.id, data: { url: it.url }, vibrate: [200, 100, 200]
    });
  }
  if (fresh.length > 5) reg?.showNotification(`Още ${fresh.length - 5} нови обяви`, { icon: 'icons/icon-192.png', tag: 'more', data: { url: './' } });
}
async function syncPrefsToSW() {
  try { const c = await caches.open('sr-prefs'); await c.put('prefs', new Response(JSON.stringify({ keywords: S.keywords, notifKw: S.notifKw, notifWanted: S.notifWanted, disabled: S.disabled, ack: S.ack, notified: S.notified.slice(-800) }))); } catch {}
}
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('sw.js');
    if ('periodicSync' in reg) { try { const st = await navigator.permissions.query({ name: 'periodic-background-sync' }); if (st.state === 'granted') await reg.periodicSync.register('check-listings', { minInterval: 30 * 60 * 1000 }); } catch {} }
    navigator.serviceWorker.addEventListener('message', e => { if (e.data?.notified) { S.notified = [...new Set([...S.notified, ...e.data.notified])]; store.set('notified', S.notified.slice(-800)); } });
  } catch {}
}
function applyTheme() { if (S.theme) document.documentElement.dataset.theme = S.theme; else delete document.documentElement.dataset.theme; }
document.addEventListener('visibilitychange', () => { if (document.hidden && !S.newOnly) { S.ack = Date.now(); save(); } else if (!document.hidden) load(true); });

applyTheme();
registerSW();
const v0 = new URLSearchParams(location.search).get('v');
load().then(() => { if (v0 && HERO[v0]) show(v0); setTimeout(() => $('#splash').classList.add('out'), 500); });
setInterval(() => load(true), 5 * 60 * 1000);

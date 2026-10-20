'use strict';
// ===== ECOBenchmark =====
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BGN = 1.95583;
const KEY_MARKETS = ['BG', 'TR', 'RO', 'RS', 'PL', 'IT', 'FR', 'ES', 'DE'];

// ---------- Справочници ----------
const SOURCES = {
  olx:           { name: 'OLX.bg',        flag: '🇧🇬', cc: 'BG', link: q => `https://www.olx.bg/ads/q-${encodeURIComponent(q.trim().replace(/\s+/g, '-'))}/` },
  mobilebg:      { name: 'Mobile.bg',     flag: '🇧🇬', cc: 'BG', link: q => `https://www.google.com/search?q=${encodeURIComponent('site:mobile.bg ' + q)}` },
  bazar:         { name: 'Bazar.bg',      flag: '🇧🇬', cc: 'BG', link: q => `https://bazar.bg/obiavi?q=${encodeURIComponent(q)}` },
  mascus:        { name: 'Mascus',        flag: '🇪🇺', foreign: true, link: q => `https://www.mascus.bg/+/${encodeURIComponent(q)},1,relevance,search.html` },
  machineryline: { name: 'Machineryline', flag: '🇪🇺', foreign: true, link: q => `https://machineryline.bg/-/search?q=${encodeURIComponent(q)}` },
  autoline:      { name: 'Autoline',      flag: '🇪🇺', foreign: true, link: q => `https://autoline.bg/-/search?q=${encodeURIComponent(q)}` },
  truck1:        { name: 'Truck1',        flag: '🇪🇺', foreign: true, link: q => `https://www.truck1.eu/construction-machinery?q=${encodeURIComponent(loc(q, 'de'))}` },
  mobilede:      { name: 'Mobile.de',     flag: '🇩🇪', cc: 'DE', foreign: true, link: q => `https://suchen.mobile.de/fahrzeuge/search.html?isSearchRequest=true&vc=ConstructionMachine&s=Construction&q=${encodeURIComponent(loc(q, 'de'))}` },
  truckscout24:  { name: 'TruckScout24',  flag: '🇩🇪', cc: 'DE', foreign: true, link: q => `https://www.truckscout24.de/baumaschinen?query=${encodeURIComponent(q)}` },
  machinio:      { name: 'Machinio',      flag: '🇪🇺', foreign: true, link: q => `https://www.machinio.com/search?q=${encodeURIComponent(q)}` },
  olxro:         { name: 'OLX.ro',        flag: '🇷🇴', cc: 'RO', foreign: true, link: q => `https://www.olx.ro/oferte/q-${encodeURIComponent(loc(q, 'ro').trim().replace(/\s+/g, '-'))}/` },
  olxpl:         { name: 'OLX.pl',        flag: '🇵🇱', cc: 'PL', foreign: true, link: q => `https://www.olx.pl/oferty/q-${encodeURIComponent(loc(q, 'pl').trim().replace(/\s+/g, '-'))}/` },
  otomoto:       { name: 'Otomoto',       flag: '🇵🇱', cc: 'PL', foreign: true, link: q => `https://www.otomoto.pl/maszyny-budowlane/q-${encodeURIComponent(loc(q, 'pl').trim().replace(/\s+/g, '-'))}` },
  allegro:       { name: 'Allegro',       flag: '🇵🇱', cc: 'PL', foreign: true, link: q => `https://allegro.pl/listing?string=${encodeURIComponent(loc(q, 'pl'))}` },
  machineseeker: { name: 'Machineseeker', flag: '🇪🇺', foreign: true, link: q => `https://www.machineseeker.com/mss/${encodeURIComponent(slug(q))}` },
  machinerytrader:{ name: 'MachineryTrader.eu', flag: '🇪🇺', foreign: true, link: q => `https://www.machinerytrader.eu/listings/for-sale/${encodeURIComponent(slug(q))}/machines` },
  kleinanzeigen: { name: 'Kleinanzeigen', flag: '🇩🇪', cc: 'DE', foreign: true, link: q => `https://www.kleinanzeigen.de/s-${encodeURIComponent(slug(loc(q, 'de')))}/k0` },
  arabam:        { name: 'arabam.com',    flag: '🇹🇷', cc: 'TR', foreign: true, link: q => `https://www.arabam.com/ikinci-el/tarim-is-makineleri/is-makineleri?searchText=${encodeURIComponent(loc(q, 'tr'))}` },
  sahibinden:    { name: 'Sahibinden',    flag: '🇹🇷', cc: 'TR', foreign: true, link: q => `https://www.sahibinden.com/is-makineleri?query_text=${encodeURIComponent(loc(q, 'tr'))}` },
  autovit:       { name: 'Autovit.ro',    flag: '🇷🇴', cc: 'RO', foreign: true, link: q => `https://www.google.com/search?q=${encodeURIComponent('site:autovit.ro ' + loc(q, 'ro'))}` },
  kupujemprodajem:{ name: 'KupujemProdajem', flag: '🇷🇸', cc: 'RS', foreign: true, link: q => `https://www.kupujemprodajem.com/pretraga?keywords=${encodeURIComponent(loc(q, 'sr'))}` },
  polovnemasine: { name: 'Polovne mašine', flag: '🇷🇸', cc: 'RS', foreign: true, link: q => `https://www.google.com/search?q=${encodeURIComponent('site:polovnemasine.com ' + loc(q, 'sr'))}` },
  subito:        { name: 'Subito.it',     flag: '🇮🇹', cc: 'IT', foreign: true, link: q => `https://www.subito.it/annunci-italia/vendita/usato/?q=${encodeURIComponent(loc(q, 'it'))}` },
  leboncoin:     { name: 'Leboncoin',     flag: '🇫🇷', cc: 'FR', foreign: true, link: q => `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(loc(q, 'fr'))}` },
  milanuncios:   { name: 'Milanuncios',   flag: '🇪🇸', cc: 'ES', foreign: true, link: q => `https://www.milanuncios.com/anuncios/?s=${encodeURIComponent(loc(q, 'es'))}` }
};
const AUTO = ['arabam', "mobilebg", "bazar", "machineseeker", "kleinanzeigen"];
const LOCAL = [
  ['мини комбиниран багер', { tr: 'mini beko loder', ro: 'mini buldoexcavator', sr: 'mini kombinirka', it: 'mini terna', fr: 'mini tractopelle', es: 'mini retrocargadora', pl: 'mini koparko-ładowarka', de: 'Minibaggerlader' }],
  ['комбиниран багер',      { tr: 'beko loder', ro: 'buldoexcavator', sr: 'kombinirka', it: 'terna', fr: 'tractopelle', es: 'retrocargadora', pl: 'koparko-ładowarka', de: 'Baggerlader' }],
  ['багер товарач',         { tr: 'beko loder', ro: 'buldoexcavator', sr: 'kombinirka', it: 'terna', fr: 'tractopelle', es: 'retrocargadora', pl: 'koparko-ładowarka', de: 'Baggerlader' }],
  ['мини челен товарач',    { tr: 'mini yükleyici', ro: 'miniincarcator', sr: 'mini utovarivač', it: 'minipala', fr: 'mini chargeuse', es: 'minicargadora', pl: 'miniładowarka', de: 'Kompaktlader' }],
  ['челен товарач',         { tr: 'lastikli yükleyici', ro: 'incarcator frontal', sr: 'utovarivač', it: 'pala gommata', fr: 'chargeuse sur pneus', es: 'pala cargadora', pl: 'ładowarka kołowa', de: 'Radlader' }],
  ['телескопичен товарач',  { tr: 'manitou', ro: 'manitou', sr: 'manitou', it: 'manitou', fr: 'manitou', es: 'manitou', pl: 'manitou', de: 'Manitou' }],
  ['мини багер',            { tr: 'mini ekskavatör', ro: 'miniexcavator', sr: 'mini bager', it: 'miniescavatore', fr: 'mini pelle', es: 'miniexcavadora', pl: 'minikoparka', de: 'Minibagger' }],
  ['миди багер',            { tr: 'midi ekskavatör', ro: 'midiexcavator', sr: 'midi bager', it: 'midiescavatore', fr: 'pelle midi', es: 'midiexcavadora', pl: 'midikoparka', de: 'Midibagger' }],
  ['верижен багер',         { tr: 'paletli ekskavatör', ro: 'excavator senile', sr: 'bager guseničar', it: 'escavatore cingolato', fr: 'pelle sur chenilles', es: 'excavadora de cadenas', pl: 'koparka gąsienicowa', de: 'Kettenbagger' }],
  ['колесен багер',         { tr: 'lastikli ekskavatör', ro: 'excavator pe roti', sr: 'bager točkaš', it: 'escavatore gommato', fr: 'pelle sur pneus', es: 'excavadora de ruedas', pl: 'koparka kołowa', de: 'Mobilbagger' }],
  ['булдозер',              { tr: 'dozer', ro: 'buldozer', sr: 'buldožer', it: 'apripista', fr: 'bouteur', es: 'bulldozer', pl: 'spycharka', de: 'Planierraupe' }],
  ['валяк',                 { tr: 'silindir', ro: 'cilindru compactor', sr: 'valjak', it: 'rullo compattatore', fr: 'rouleau compacteur', es: 'rodillo compactador', pl: 'walec drogowy', de: 'Walze' }],
  ['самосвал',              { tr: 'damperli kamyon', ro: 'basculanta', sr: 'kiper', it: 'ribaltabile', fr: 'benne', es: 'volquete', pl: 'wywrotka', de: 'Kipper' }],
  ['вишка',                 { tr: 'sepetli platform', ro: 'nacela', sr: 'korpa platforma', it: 'piattaforma aerea', fr: 'nacelle', es: 'plataforma elevadora', pl: 'podnośnik koszowy', de: 'Arbeitsbühne' }],
  ['багер',                 { tr: 'ekskavatör', ro: 'excavator', sr: 'bager', it: 'escavatore', fr: 'pelle', es: 'excavadora', pl: 'koparka', de: 'Bagger' }]
];
function loc(q, lang) {
  if (!lang) return q;
  const low = q.toLowerCase();
  for (const [bg, tr] of LOCAL) if (low.includes(bg)) return (low.replace(bg, tr[lang] || bg)).trim();
  return q;
}
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
  BG: ['🇧🇬', 'България', /българия|bulgaria|bulgarien/], TR: ['🇹🇷', 'Турция', /turkey|türkiye|turkiye|турция|türkei/],
  RS: ['🇷🇸', 'Сърбия', /serbia|srbija|сърбия|србија|serbien/], DE: ['🇩🇪', 'Германия', /germany|deutschland|германия/],
  IT: ['🇮🇹', 'Италия', /italy|italia|италия/], FR: ['🇫🇷', 'Франция', /france|франция/], NL: ['🇳🇱', 'Нидерландия', /netherlands|nederland|холандия|нидерландия/],
  BE: ['🇧🇪', 'Белгия', /belgium|belgique|belgië|белгия/], AT: ['🇦🇹', 'Австрия', /austria|österreich|австрия/], PL: ['🇵🇱', 'Полша', /poland|polska|polen|полша|\.pl\b/],
  RO: ['🇷🇴', 'Румъния', /romania|românia|румъния/], CZ: ['🇨🇿', 'Чехия', /czech|česk|чехия/], ES: ['🇪🇸', 'Испания', /spain|españa|испания/],
  DK: ['🇩🇰', 'Дания', /denmark|danmark|дания/], SE: ['🇸🇪', 'Швеция', /sweden|sverige|швеция/], FI: ['🇫🇮', 'Финландия', /finland|suomi|финландия/],
  GR: ['🇬🇷', 'Гърция', /greece|ελλάδα|гърция/], HU: ['🇭🇺', 'Унгария', /hungary|magyar|унгария/], SK: ['🇸🇰', 'Словакия', /slovakia|slovensk|словакия/],
  HR: ['🇭🇷', 'Хърватия', /croatia|hrvatska|хърватия/], SI: ['🇸🇮', 'Словения', /slovenia|slovenija|словения/], PT: ['🇵🇹', 'Португалия', /portugal|португалия/],
  LT: ['🇱🇹', 'Литва', /lithuania|lietuva|литва/], CH: ['🇨🇭', 'Швейцария', /switzerland|schweiz|швейцария/]
};
const CATS = [
  ['minibackhoe','Мини комбинирани багери',  /мини комбиниран|мини багер[ -]?товарач|hmk ?62|\b1 ?cx\b|mini backhoe|minibaggerlader/],
  ['backhoe',    'Комбинирани багери',       /багер[ -]?товарач|комбиниран багер|backhoe|baggerlader|buldoexcavator|koparko[- ]?ładowark|beko ?loder|kaz[ıi]c[ıi] y[üu]kleyici|hmk ?\d{2,3} ?b|\b[34] ?cx\b/],
  ['telehandler','Телескопични товарачи Manitou', /manitou/],
  ['minicl',     'Мини челни товарачи',      /мини челен|бобкат|skid ?steer|kompaktlader|minilader|компактен товарач|\bbobcat\b|bobcat s\d/],
  ['midi',       'Миди багери',              /миди багер|midibagger|midi excavator|midi-bagger/],
  ['mini',       'Мини багери',              /мини багер|minibagger|mini excavator|kompaktbagger|minikoparka|mini ?excavator/],
  ['crawler',    'Верижни багери',           /верижен багер|верижни багер|kettenbagger|crawler excavator|koparka gąsienicowa/],
  ['dozer',      'Булдозери',                /булдозер|bulldozer|\bdozer|planierraupe|spycharka/],
  ['excavator',  'Колесни и други багери',   /багер|excavator|bagger|koparka|escavatore|ekskavat[öo]r/],
  ['loader',     'Челни товарачи',           /челен товарач|колесен товарач|товарач|wheel loader|radlader|ładowarka|incarcator|chargeuse|loder y[üu]kleyici|loder/],
  ['tipper',     'Самосвали (с кран, тристранни)', /самосвал|тристран|кран[- ]?манипулатор|kipper|dreiseiten|tipper|dump truck|wywrotka/],
  ['garbage',    'Сметосъбиращи камиони',    /сметосъбира|боклукчийск|müllwagen|garbage truck|refuse (truck|collector)|śmieciarka/],
  ['aerial',     'Вишки',                    /вишка|автовишка|arbeitsbühne|hubarbeitsbühne|aerial|boom lift|scissor lift|podnośnik/],
  ['asphaltrec', 'Рециклатори за асфалт',    /рециклатор|рециклиране на асфалт|термоконтейнер|asphalt recycler|asphaltrecycler|hot box/],
  ['parts',      'Сервиз и ремонт',          /ремонт|сервиз|repair|werkstatt/],
  ['attach',     'Прикачен инвентар',        /кофа|бързосменник|инвентар|свредел|bucket|quick ?coupler|attachment|tiltrotator|грайфер|schnellwechsler|löffel/],
  ['breaker',    'Хидравлични чукове',       /хидравличен чук|къртач|\bчук\b|breaker|hydraulikhammer|imeks|hycon/],
  ['mulcher',    'Мулчери',                  /мулчер|mulcher|forstmulcher|\bfae\b/],
  ['roller',     'Валяци',                   /валяк|roller|walze|rullo|compactor|walec|silindir/],
  ['compaction', 'Виброплочи и трамбовки',   /виброплоча|трамбовк|пачекрак|plate compactor|rüttelplatte|rammer|stampfer/],
  ['paver',      'Асфалтова техника',        /асфалт|paver|fertiger|фреза|milling/],
  ['crusher',    'Трошачки и сита',          /трошачк|сито|crusher|screen|brecher|siebanlage|komplet/],
  ['drilling',   'Безизкопни технологии',    /къртица|сондаж|grundomat|grundodrill|хоризонтал|directional drill|hdd/],
  ['generator',  'Генератори',               /генератор|generator|stromerzeuger|aksa|sdmo/],
  ['compressor', 'Компресори',               /компресор|compressor|kompressor|atmos/]
];

// Разрешени марки по категория (останалите категории — всички марки)
const BR = {
  hidromek: 'hidromek|хидромек|hmk ?\\d', komatsu: 'komatsu|коматсу|комацу|камацу', jcb: '\\bjcb\\b|джисиби|джей си би', case: '\\bcase\\b|кейс', nh: 'new ?holland|ню ?холанд',
  cat: 'caterpillar|катерпилар|катерпилър|\\bcat\\b', yanmar: 'yanmar|янмар', gehl: '\\bgehl\\b|гел', manitou: 'manitou|маниту', takeuchi: 'takeuchi|такеучи',
  volvo: 'volvo|волво', hyundai: 'hyundai|хюндай|хюндаи', ammann: 'ammann|аман', bomag: 'bomag|бомаг'
};
const brandRx = keys => new RegExp(keys.map(k => BR[k]).join('|'), 'i');
const ALLOWED = {
  backhoe:     brandRx(['hidromek', 'komatsu', 'jcb', 'case', 'nh']),
  minibackhoe: brandRx(['hidromek', 'komatsu', 'jcb', 'case', 'nh']),
  mini:        brandRx(['jcb', 'komatsu', 'cat', 'yanmar']),
  minicl:      brandRx(['gehl', 'komatsu', 'manitou', 'case', 'cat', 'takeuchi']),
  midi:        brandRx(['hidromek', 'cat', 'jcb', 'komatsu', 'volvo', 'hyundai']),
  crawler:     brandRx(['hidromek', 'cat', 'jcb', 'komatsu', 'volvo', 'hyundai']),
  excavator:   brandRx(['hidromek', 'cat', 'jcb', 'komatsu', 'volvo', 'hyundai']),
  roller:      brandRx(['ammann', 'bomag', 'volvo', 'hidromek'])
};
// Търсещите (купувачи) се показват винаги — те са клиенти
const brandOk = it => it.type === 'wanted' || !ALLOWED[it._cat] || ALLOWED[it._cat].test(txt(it));


// ---------- Критерии за качество ----------
// Показват се само обяви с истинска снимка; повторенията между сайтовете се махат.
const BAD_PHOTO = /noimage|no-image|no_photo|nophoto|placeholder|default[-_]?(img|image)|logo|blank\.(gif|png)|spacer|data:image|1x1/i;
const hasPhoto = it => !!it.photo && /^https?:\/\//.test(it.photo) && !BAD_PHOTO.test(it.photo);
function dedupe(list) {
  const seen = new Set();
  return list.filter(it => {
    const k = norm(it.title).replace(/[^a-zа-я0-9]+/gi, ' ').trim().slice(0, 60) + '|' + (it._eur || it.price || '');
    if (seen.has(k)) return false; seen.add(k); return true;
  });
}

// Подреждане: 0 — комбинирани Hidromek/Komatsu/JCB, 1 — друга земекопна и товарачна техника, 2 — валяци, 3 — останалото
const TOP_BRANDS = /hidromek|хидромек|komatsu|коматсу|камацу|\bjcb\b|джисиби/i;
function rank(it) {
  if ((it._cat === 'backhoe' || it._cat === 'minibackhoe') && TOP_BRANDS.test(txt(it))) return 0;
  if (PRIORITY.includes(it._cat)) return 1;
  if (it._cat === 'roller') return 2;
  return 3;
}
const PRIORITY = ['minibackhoe', 'backhoe', 'mini', 'midi', 'crawler', 'excavator', 'minicl', 'loader', 'telehandler', 'dozer'];
const PARTS_X = new RegExp('пиньон|корона за|зъбн\\w* колел|лагер|уплътнен|семеринг|стъкло за|седалка за|помпа за|хидравлична помпа|двигател за|радиатор|ремъ[кц]|втулк|щифтове|джойстик за|ключ за|стартер|алтернатор|турбо(компресор)? за|верига за|вериги за|ролк[аи] за|зъб(и)? за кофа|резервн|част(и)? за|(^|\\s)части(\\s|$)|консуматив|филтр|филтър|филтри|(^|\\s)масл[оа](\\s|$)|гуми за|акумулатор|ersatzteil|spare ?part|zubehör|verschleißteil|\\bfilter\\b|części|piese');
const TELE_X = new RegExp('(телескоп|telehandler|teleskoplader|ładowarka teleskop|loadall|merlo|\\bjcb 5\\d\\d)');
const BOATS = /детски|играчк|lego|bruder|spielzeug|modell|siku|1:\d{2}|(^|\s)гуми(\s|$)|джанти|услуги с|изкопни услуги|лодк|катер|яхт|джет|jet ?ski|извънбордов|плавателн|понтон|\bboot\b|boat|yacht|schlauchboot|außenborder/;
const BRANDS = ['Hidromek', 'JCB', 'Develon', 'Sany', 'Mecalac', 'Wacker Neuson', 'Caterpillar', 'Komatsu', 'Volvo', 'Case', 'New Holland', 'Bobcat', 'Takeuchi', 'Kubota', 'Hitachi', 'Liebherr', 'Doosan', 'Hyundai', 'Terex', 'Manitou', 'Ammann', 'Bomag', 'Dynapac', 'Hamm', 'Wacker', 'FAE', 'Atlas Copco', 'Yanmar', 'Kobelco'];
const TYPES = { all: 'Всички обяви', wanted: 'Търсят', sale: 'Продават', service: 'Сервиз и ремонт', rent: 'Под наем' };
const TBADGE = { wanted: 'ТЪРСИ', sale: 'ПРОДАВА', service: 'СЕРВИЗ', rent: 'НАЕМ' };
const SORTS = { rank: 'Приоритет: комбинирани Hidromek, Komatsu, JCB', new: 'Най-нови', pasc: 'Цена — възходящо', pdesc: 'Цена — низходящо' };
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
  type: 'all', cat: 'all', region: 'all', sort: 'rank', onlyKw: store.get('onlyKw', false),
  ack: store.get('ack', Date.now() - 864e5),
  notifKw: store.get('notifKw', true), notifWanted: store.get('notifWanted', false), notified: store.get('notified', []),
  liveUrl: store.get('liveUrl', ''), scope: 'all', theme: store.get('theme', ''),
  custom: store.get('custom', []), ops: store.get('ops', []), voiceOn: store.get('voiceOn', true), alarmOn: store.get('alarmOn', true), alarmed: store.get('alarmed', []), show: [], showUpdated: null, sk: 'all',
  items: [], deals: [], dk: 'good', news: [], ncat: 'all', mkCountry: 'all', updated: null, newOnly: false, view: 'feed'
};
function save() {
  ['keywords', 'favs', 'disabled', 'onlyKw', 'ack', 'notifKw', 'notifWanted', 'liveUrl', 'theme', 'custom', 'alarmOn', 'voiceOn'].forEach(k => store.set(k, S[k]));
  store.set('notified', S.notified.slice(-800));
  syncPrefsToSW();
}

// ---------- Обработка на обява ----------
const norm = s => (s || '').toLowerCase();
const txt = it => norm(it.title + ' ' + (it.desc || '') + ' ' + (it.location || '') + ' ' + (it.hint || '') + ' ' + (it.source === 'arabam' ? decodeURIComponent(it.url || '').replace(/[-/]/g, ' ') : ''));
function cleanTitle(it) {
  if (it._clean) return;
  let t = it.title || '';
  const m = /\s+в\s+[^|]*?\s+в\s+(гр\.|с\.)\s*([^-|]+?)\s*(-\s*ID\d+)?\s*(\|\s*Bazar\.bg)?\s*$/i.exec(t);
  if (m) { t = t.slice(0, m.index); if (!it.location) it.location = (m[1] + ' ' + m[2]).trim(); }
  it.title = t.replace(/\s*\|\s*(Bazar\.bg|kleinanzeigen(\.de)?|Mobile\.bg)\s*$/i, '').trim();
  it._clean = true;
}
// Не е цяла машина (инвентар, кофи, чукове, мулчери, части) — същото правило като в scraper-а
const ATT_W = /кофа|кофи|бързосменник|хидравличен|чук|къртач|мулчер|свредел|грайфер|вилици|рипер|оборудване|инвентар|bucket|löffel|schaufel|schnellwechsler|tiltrotator|powertilt|tilt|hammer|gabel|grapple|auger|coupler|breaker|mulcher|łyżka|młot|chwytak|widły|kova|kırıcı|ataşman|benna|godet|cazo|anbau/i;
const MACH_W = /багер|товарач|булдозер|валяк|самосвал|вишка|сметосъбира|генератор|компресор|трошачк|асфалтополагач|рециклатор|виброплоч|трамбовк|грейдер|excavator|bagger|lader|loader|dozer|raupe|walze|roller|kipper|tipper|bühne|platform|koparka|ładowarka|spycharka|walec|ekskavat|loder|yükleyici|silindir|escavatore|terna|pala|pelle|chargeuse|excavadora|retro|cargadora|bager|utovarivač|stromerzeuger|kompressor|compressor|crusher|brecher|fertiger|paver|^hmk|^\d ?cx$/i;
function nonMachine(title) {
  const w = String(title || '').toLowerCase().split(/[\s|,;:()\/*+–—-]+/).filter(Boolean);
  let a = -1, m = -1;
  w.forEach((x, i) => { const isM = MACH_W.test(x); if (isM && m < 0) m = i; if (!isM && ATT_W.test(x) && a < 0) a = i; });
  // „… вилици за всички комбинирани багери“, „Löffel für Minibagger“ → инвентар, дори марката да е отпред
  if (a >= 0 && /^(за|для|für|fur|for|do|pentru|per|pour|para|için|icin|na)$/.test(w[a + 1] || '') ) return true;
  return a >= 0 && (m < 0 || a < m);
}
const NON_MACHINE_CATS = ['attach', 'breaker', 'mulcher'];
const HOME_X = /kühlschrank|gefrier|küche|kueche|einbauküche|хладилник|фризер|велосипед|колело|fahrrad|mtb|e-bike|waschmaschine|geschirrspüler|пералня|кафемашина|kaffeemaschine|weinkühl|backofen|фурна/i;
const MIN_YEAR = 2008;
const textYear = it => { const m = ((it.title || '') + ' ' + (it.desc || '')).match(/\b(19[89]\d|20[0-2]\d)\b/); return m ? +m[1] : 0; };
const WANT_X = /(^|[\s\/,.;:(!-])(търся|търсим|търси се|купувам|изкупувам|купуваме|wanted|suche|kaufe|ankauf|kupię|kupie|cumpăr|cumpar|compro|cerco|achète|busco)([\s\/,.;:)!-]|$)/i;
function prep(it) {
  if (it.photo && it.photo.startsWith('//')) it.photo = 'https:' + it.photo;
  // Bazar.bg/Mobile.bg: цената от описанието („Цена ✅ 29 500 €“) е най-надеждна
  const pd = /Цена[^0-9]{0,6}(\d{1,3}(?:[ .\u00a0]\d{3})*(?:[.,]\d{1,2})?)\s*(€|EUR|лв\.?|BGN)/i.exec(it.desc || '');
  if (pd) it.price = pd[1] + ' ' + pd[2];
  else if (/^\d\s\d{2}\s\d{3}\b/.test(it.price || '')) it.price = it.price.replace(/^\d\s/, '');
  cleanTitle(it);
  if (WANT_X.test(it.title)) it.type = 'wanted';
  const t = txt(it);
  it._cat = (CATS.find(c => c[2].test(t)) || ['other'])[0];
  it._boat = BOATS.test(t) || PARTS_X.test(t) || (TELE_X.test(t) && !/manitou/.test(t)) || nonMachine(it.title) || NON_MACHINE_CATS.includes(it._cat) || HOME_X.test(it.title);
  // Само машини от 2008 г. нататък; без година след проверка на страницата → не се показва
  it._year = +it.year > 0 ? +it.year : textYear(it);
  it._old = it.type !== 'wanted' && (it._year ? it._year < MIN_YEAR : it.year === 0);
  let cc = SOURCES[it.source]?.cc;
  if (!cc || SOURCES[it.source]?.foreign) { const m = Object.entries(COUNTRIES).find(([, v]) => v[2].test(t)); if (m) cc = m[0]; }
  it._cc = cc || (SOURCES[it.source]?.foreign ? 'EU' : 'BG');
  it._eur = priceEur(it.price);
  it._brand = BRANDS.find(b => t.includes(b.toLowerCase())) || '';
  it._rank = rank(it);
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
  else if (/(^|\s|\d)(tl|try|₺)/.test(s)) { if (!S.rates?.TRY) return null; n /= S.rates.TRY; }
  else if (!/€|eur|евро/.test(s)) return null;
  n = Math.round(n);
  return n >= 300 && n <= 1500000 ? n : null;   // нереалистични цени (телефони, номера на модели) се игнорират
}
const fmtEur = n => n == null ? '—' : '€ ' + Math.round(n).toLocaleString('bg-BG').replace(/,/g, ' ');
const kwMatch = it => { const t = txt(it); return S.keywords.some(k => t.includes(norm(k))); };
const when = it => new Date(it.firstSeen || it.date).getTime();
const isNew = it => when(it) > S.ack;
const wantsNotify = it => (!S.notifKw || kwMatch(it)) && (!S.notifWanted || it.type === 'wanted');
let _live = null, _liveKey = '';
const live = () => { const k = S.items.length + '|' + S.disabled.join(','); if (_live && k === _liveKey) return _live; _liveKey = k; return (_live = dedupe(S.items.filter(i => !S.disabled.includes(i.source) && !i._boat && !i._old && brandOk(i) && hasPhoto(i)))); };
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
  const dl = S.dealMap?.[it.id];
  const hunt = dl ? (dl.conf === 'ниска' ? 'hunt maybe' : 'hunt') : '';
  return `<article class="card ${isNew(it) ? 'fresh' : ''} ${hunt}">
    <a class="thumb" href="${esc(it.url)}" target="_blank" rel="noopener"><img src="${esc(it.photo)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.card').remove()"><span class="flag t-${esc(it.type || 'sale')}">${TBADGE[it.type] || 'ПРОДАВА'}</span>${dl ? `<span class="hflag">💰 −${dl.discount}%</span>` : ''}</a>
    <div class="cbody">
      <a class="ctitle" href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.title)}</a>
      ${it._eur ? `<div class="cprice">${esc(it.price)}${eur}</div>` : (it.type === 'sale' ? '<div class="cprice" style="font-size:14px;color:var(--muted)">Цена при запитване</div>' : '')}
      ${dl ? `<button class="hline" data-go="deals">Ловец: пазар ${fmtEur(dl.market)} · потенциал ${fmtEur(dl.profit)}${dl.conf === 'ниска' ? ' · за проверка' : ''} ›</button>` : ''}
      <div class="cmeta">${isNew(it) ? '<span class="new">НОВО</span>' : ''}<span>${c ? c[0] : src.flag} ${esc(it.location || (c ? c[1] : 'Европа'))}</span><span>${ago(it.firstSeen || it.date)}</span></div>
      <div class="cfoot"><a class="open" href="${esc(it.url)}" target="_blank" rel="noopener">${esc(src.name)} ›</a><button class="star ${fav ? 'on' : ''}" data-fav="${esc(it.id)}" aria-label="Запази">${ICON_STAR}</button></div>
    </div></article>`;
}

// ---------- Падащи филтри ----------
function ddLabel(k) {
  if (k === 'type') return S.type === 'all' ? 'Всички обяви' : TYPES[S.type];
  if (k === 'cat') return S.cat === 'all' ? 'Всички категории' : S.cat === 'priority' ? '★ Багери и товарачи' : CATS.find(c => c[0] === S.cat)?.[1] || 'Друго';
  if (k === 'region') return S.region === 'all' ? 'България и Европа' : S.region === 'bg' ? 'България' : S.region === 'eu' ? 'Европа' : (COUNTRIES[S.region]?.[0] + ' ' + COUNTRIES[S.region]?.[1]);
  if (k === 'sort') return S.sort === 'rank' ? 'Приоритет' : SORTS[S.sort];
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
    const ccs = Object.keys(COUNTRIES).map(cc => ({ v: cc, label: COUNTRIES[cc][0] + ' ' + COUNTRIES[cc][1], n: base.filter(i => i._cc === cc).length })).filter(o => o.n || KEY_MARKETS.includes(o.v)).sort((a, b) => (KEY_MARKETS.includes(b.v) - KEY_MARKETS.includes(a.v)) || b.n - a.n);
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
  if (S.sort === 'rank') v = v.sort((a, b) => (a._rank - b._rank) || (when(b) - when(a)));
  else if (S.sort === 'pasc') v = v.filter(i => i._eur).sort((a, b) => a._eur - b._eur);
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
  const nf = Object.keys(S.favs).length; if ($('#dFav')) { $('#dFav').textContent = nf || ''; $('#dFav').style.display = nf ? '' : 'none'; }
  if ('setAppBadge' in navigator) { try { nNew ? navigator.setAppBadge(nNew) : navigator.clearAppBadge(); } catch {} }
  document.title = nNew ? `(${nNew}) ECOBenchmark` : 'ECOBenchmark';
}

// ---------- Банери ----------
function renderBanners() {
  const base = live();
  const w = base.filter(i => i.type === 'wanted').length;
  const infra = S.news.filter(n => n.cat === 'infra').length;
  const bn = [
    { c: 'bn-1', h: w ? `${w} души търсят техника` : 'Кой търси техника днес', p: 'Купувачи и наематели от обявите — готови клиенти.', go: 'Виж търсещите', act: () => { S.type = 'wanted'; S.cat = 'all'; renderFeed(); scrollToList(); } },
    { c: 'bn-3', h: 'Колко струва машината?', p: 'Виртуален продавач — оценка по марка, година, часове и състояние.', go: 'Оцени', act: () => show('seller') },
    { c: 'bn-2', h: 'Виртуален шоурум', p: 'Машини, подбрани и проверени от Claude.', go: 'Разгледай', act: () => show('show') },
    { c: 'bn-4', h: 'Сравни цените в Европа', p: 'Медианни цени по категории — България срещу ЕС.', go: 'Към пазарите', act: () => show('market') },
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
  const ccList = [...KEY_MARKETS.map(cc => [cc, byCc[cc] || []]), ...Object.entries(byCc).filter(([cc]) => COUNTRIES[cc] && !KEY_MARKETS.includes(cc)).sort((a, b) => b[1].length - a[1].length)];
  $('#countries').innerHTML = `<button class="ctry ${S.mkCountry === 'all' ? 'on' : ''}" data-mk="all"><b>🇪🇺</b><span>Цяла Европа</span><small>${listings.length} обяви</small></button>` +
    ccList.map(([cc, arr]) => `<button class="ctry ${S.mkCountry === cc ? 'on' : ''}" data-mk="${cc}"><b>${COUNTRIES[cc][0]}</b><span>${COUNTRIES[cc][1]}</span><small>${arr.length ? arr.length + ' обяви' : 'търси ръчно'}</small></button>`).join('');
  const pool = S.mkCountry === 'all' ? listings : (byCc[S.mkCountry] || []);
  const ccSites = Object.values(SOURCES).filter(x => x.cc === S.mkCountry);
  $('#mkSites').innerHTML = S.mkCountry !== 'all' && ccSites.length ? `<div class="sec"><h2>Сайтове в ${COUNTRIES[S.mkCountry][1]}</h2><p class="sub">Търсене на приоритетната техника на местния език.</p></div>
    <div class="sites">${ccSites.flatMap(x => ['мини багер', 'комбиниран багер', 'верижен багер', 'челен товарач'].map(q => `<a class="site" href="${esc(x.link(q))}" target="_blank" rel="noopener"><i>${x.flag}</i>${esc(x.name)} · ${esc(q)}</a>`)).join('')}</div>` : '';
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
// Разбор на заявката: „hidromek до 40 000“, „jcb 3cx 30-50k“, „мини багер над 20000 след 2015“
const numQ = (n, k) => { const v = parseFloat(String(n).replace(/[\s.](?=\d{3}\b)/g, '').replace(',', '.')); return k ? v * 1000 : v; };
function parseQuery(q) {
  const f = { min: null, max: null, ymin: null };
  const N = '(\\d[\\d\\s.,]*?\\d|\\d)\\s*(k|к|хил\\.?|хиляди)?\\s*(?:€|евро|eur)?';
  q = q.replace(new RegExp(`(?:от|from|ab)?\\s*${N}\\s*(?:-|–|до|to|bis)\\s*${N}(?=\\s|$)`, 'i'), (m, a, ka, b, kb) => { const x = numQ(a, ka || kb), y = numQ(b, kb); if (y >= 1000 && !(x >= 1980 && x <= 2035 && y >= 1980 && y <= 2035)) { f.min = x; f.max = y; return ' '; } return m; });
  q = q.replace(new RegExp(`(?:^|\\s)(?:до|под|max|bis|unter|<)\\s*${N}(?=\\s|$)`, 'i'), (m, a, k) => { const v = numQ(a, k); if (v >= 1000 && !(v >= 1980 && v <= 2035 && !k)) { f.max = v; return ' '; } return m; });
  q = q.replace(new RegExp(`(?:^|\\s)(?:над|от|min|ab|über|>)\\s*${N}(?=\\s|$)`, 'i'), (m, a, k) => { const v = numQ(a, k); if (v >= 1000 && !(v >= 1980 && v <= 2035 && !k)) { f.min = v; return ' '; } return m; });
  q = q.replace(/(?:^|\s)(?:след|от|after|ab)\s*((?:19|20)\d{2})\s*(?:г\.?|година)?(?=\s|$)|(?:^|\s)((?:19|20)\d{2})\s*(?:г\.?\s*)?\+(?=\s|$)/i, (m, a, b) => { f.ymin = +(a || b) + (a && /след|after/i.test(m) ? 1 : 0); return ' '; });
  return { words: norm(q).split(/\s+/).filter(w => w.length > 0), ...f };
}
// Дума → синоними на марката („хидромек“ = „hidromek“ = „hmk 102“)
const wordTest = w => { const r = Object.values(BR).find(x => w.length >= 3 && new RegExp('^(?:' + x + ')', 'i').test(w)); return r ? (t => new RegExp(r, 'i').test(t)) : (t => t.includes(w)); };
async function doSearch(q) {
  q = (q || '').trim();
  const pq = parseQuery(q);
  const min = +$('#sPmin').value || pq.min, max = +$('#sPmax').value || pq.max, ymin = +$('#sYmin').value || pq.ymin, sort = $('#sSort').value;
  if (!pq.words.length && !min && !max && !ymin) return;
  // „мини багер“, „валяк“, „челен товарач“ → търси по категория (хваща и Minibagger, Walze, Radlader…)
  const qs = pq.words.join(' '), cm = CATS.filter(c => !NON_MACHINE_CATS.includes(c[0]) && c[0] !== 'parts').map(c => [c, c[2].exec(qs)]).find(([, m]) => m);
  const catQ = cm ? cm[0][0] : null;
  const rest = cm && !/\d/.test(cm[1][0]) ? qs.replace(cm[1][0], ' ').split(/\s+/).filter(Boolean) : pq.words;
  const tests = rest.map(wordTest);
  let local = live().filter(it => inScope(it.source) && (!catQ || it._cat === catQ) && tests.every(t => t(txt(it))) &&
    (!(min || max) || it.type === 'sale') &&
    (!min || (it._eur && it._eur >= min)) && (!max || (it._eur && it._eur <= max)) && (!ymin || (it._year && it._year >= ymin)));
  local = sort === 'pasc' ? local.sort((a, b) => (a._eur ?? 9e9) - (b._eur ?? 9e9)) : sort === 'pdesc' ? local.sort((a, b) => (b._eur ?? -1) - (a._eur ?? -1))
    : sort === 'new' ? local.sort((a, b) => when(b) - when(a)) : sort === 'year' ? local.sort((a, b) => (b._year || 0) - (a._year || 0)) : local.sort((a, b) => (a._rank - b._rank) || (when(b) - when(a)));
  const pr = local.map(i => i._eur).filter(Boolean);
  const chips = [catQ && CATS.find(c => c[0] === catQ)[1], rest.length && `„${rest.join(' ')}“`, min && `от ${fmtEur(min)}`, max && `до ${fmtEur(max)}`, ymin && `от ${ymin} г.`].filter(Boolean).join(' · ');
  q = pq.words.join(' ') || q;
  const siteBtns = Object.entries(SOURCES).filter(([k]) => inScope(k)).map(([, s]) => `<a class="site" href="${esc(s.link(q))}" target="_blank" rel="noopener"><i>${s.flag}</i>${esc(s.name)}</a>`).join('');
  const fbBtns = FB.map(f => `<a class="site fb" href="${esc(f.link(q))}" target="_blank" rel="noopener"><i>f</i>${f.name}</a>`).join('');
  $('#sResults').innerHTML = `
    <div class="sec"><h2>В събраните обяви</h2><p class="sub">${chips}<br>${local.length ? `${local.length} съвпадения${pr.length ? ` · медиана ${fmtEur(median(pr))} · ${fmtEur(Math.min(...pr))} – ${fmtEur(Math.max(...pr))}` : ''}` : 'Няма съвпадения засега'}</p></div>
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

// ---------- Демопарк и настройки ----------
function renderFavs() {
  let f = Object.values(S.favs).map(prep).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  if (!f.length) { $('#favTop').innerHTML = ''; $('#favList').innerHTML = `<div class="empty">${ICON_STAR}<b>Демопаркът е празен</b>Натисни звездата на обява, която харесваш — машината идва тук и остава, дори обявата да изчезне от сайта.</div>`; return; }
  const cats = {}; f.forEach(i => { cats[i._cat] = (cats[i._cat] || 0) + 1; });
  if (S.favCat && !cats[S.favCat]) S.favCat = '';
  const pr = f.map(i => i._eur).filter(Boolean);
  $('#favTop').innerHTML = `<div class="mkgrid" style="margin-bottom:10px"><div class="mk"><div class="lbl">Машини</div><div class="val">${f.length}</div></div><div class="mk"><div class="lbl">Обща стойност</div><div class="val">${fmtEur(pr.reduce((a, b) => a + b, 0))}</div></div><div class="mk"><div class="lbl">Средна цена</div><div class="val">${fmtEur(pr.length ? pr.reduce((a, b) => a + b, 0) / pr.length : null)}</div></div><div class="mk"><div class="lbl">Търсят</div><div class="val">${f.filter(i => i.type === 'wanted').length}</div></div></div>
    <div class="toolbar"><button class="dd ${!S.favCat ? 'set' : ''}" data-favcat="">Всички</button>${Object.entries(cats).map(([k, n]) => `<button class="dd ${S.favCat === k ? 'set' : ''}" data-favcat="${k}">${esc(CATS.find(c => c[0] === k)?.[1] || 'Друго')} · ${n}</button>`).join('')}</div>
    <div class="alarm-act" style="padding:0 16px 10px"><button class="btn" id="favShare" style="flex:1">📤 Изпрати списъка</button></div>`;
  if (S.favCat) f = f.filter(i => i._cat === S.favCat);
  $('#favList').innerHTML = f.map(card).join('');
  $('#favShare').onclick = async () => {
    const t = 'ECOBenchmark — Демопарк\n\n' + f.map(i => `• ${i.title}${i._eur ? ' — ' + fmtEur(i._eur) : ''}\n  ${i.url}`).join('\n');
    try { if (navigator.share) await navigator.share({ title: 'Демопарк', text: t }); else { await navigator.clipboard.writeText(t); toast('Списъкът е копиран'); } } catch {}
  };
}
document.addEventListener('click', e => { const b = e.target.closest('[data-favcat]'); if (b) { S.favCat = b.dataset.favcat; renderFavs(); } });
function renderSettings() {
  $('#kwList').innerHTML = S.keywords.map((k, i) => `<span class="kwc">${esc(k)}<button data-kwdel="${i}" aria-label="Премахни">✕</button></span>`).join('') || '<span class="st">Няма добавени думи.</span>';
  $('#alarmOn').checked = S.alarmOn;
  $('#voiceOn').checked = S.voiceOn;
  $('#notifKw').checked = S.notifKw; $('#notifWanted').checked = S.notifWanted; $('#onlyKw').checked = S.onlyKw; $('#liveUrl').value = S.liveUrl;
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  $('#notifBtn').textContent = perm === 'granted' ? 'Включени' : perm === 'denied' ? 'Блокирани' : 'Разреши';
  $('#ntfyBtn').href = `https://ntfy.sh/${NTFY_TOPIC}`;
  $('#ntfyNote').textContent = `За известия при затворено приложение: инсталирай „ntfy“ от Google Play и се абонирай за „${NTFY_TOPIC}“.`;
  $('#srcSet').innerHTML = Object.entries(SOURCES).filter(([k]) => AUTO.includes(k)).map(([k, s]) => `<label class="sw"><span>${s.flag} ${esc(s.name)} <span class="st">${S.items.filter(i => i.source === k).length} обяви</span></span><input type="checkbox" data-srcset="${k}" ${S.disabled.includes(k) ? '' : 'checked'}></label>`).join('');
}


// ---------- Виртуален шоурум ----------
const INBOX_TOPIC = 'bb-showroom-in-319983c2f7';
const KIND = { member: 'ОТ ЧЛЕН', deal: 'ПОД ПАЗАРА', pick: 'ИЗБРАНО', insight: 'АНАЛИЗ', wanted: 'ТЪРСИ' };
function showCard(x) {
  if (x.kind === 'insight') return `<article class="scard insight"><div class="sbody"><span class="cat c-economy">Анализ на пазара</span>
    ${x.figure ? `<div class="big" style="margin-top:10px">${esc(x.figure)}</div>` : ''}<h3 style="margin-top:6px">${esc(x.title)}</h3>
    <div class="verdict"><small>Claude</small>${esc(x.summary)}</div>${x.basis ? `<div class="smeta">${esc(x.basis)}</div>` : ''}</div></article>`;
  const under = x.eur && x.marketMedian ? Math.round((1 - x.eur / x.marketMedian) * 100) : null;
  const flag = COUNTRIES[x.cc]?.[0] || '';
  const contact = x.contact ? (/^[+\d\s()-]{7,}$/.test(x.contact) ? `tel:${x.contact.replace(/[^\d+]/g, '')}` : /@/.test(x.contact) ? `mailto:${x.contact}` : '') : '';
  return `<article class="scard">
    <a class="hero-img ${x.photo ? '' : 'none'}" ${x.url ? `href="${esc(x.url)}" target="_blank" rel="noopener"` : ''} ${x.photo ? `style="background-image:url('${esc(x.photo)}')"` : ''}>${x.photo ? '' : ICON_MACHINE}<span class="kind k-${esc(x.kind)}">${KIND[x.kind] || ''}</span></a>
    <div class="sbody">
      <h3>${esc(x.title)}</h3>
      <div class="pxrow">${x.price ? `<b>${esc(x.price)}</b>` : ''}${x.marketMedian ? `<span>Пазарна медиана ${fmtEur(x.marketMedian)}</span>` : ''}${under > 0 ? `<span class="under">−${under}%</span>` : ''}</div>
      <div class="smeta">${flag} ${esc(x.location || '')}${x.source ? ' · ' + esc(x.source) : ''}${x.date ? ' · ' + ago(x.date) : ''}</div>
      <div class="verdict"><small>Оценка на Claude</small>${esc(x.summary)}</div>
      ${x.checks?.length ? `<details><summary>Какво да провериш (${x.checks.length})</summary><ul>${x.checks.map(c => `<li>${esc(c)}</li>`).join('')}</ul></details>` : ''}
      <div class="sfoot">${x.url ? `<a class="btn primary" href="${esc(x.url)}" target="_blank" rel="noopener">Отвори обявата</a>` : ''}${contact ? `<a class="btn ${x.url ? '' : 'primary'}" href="${esc(contact)}">Свържи се</a>` : (x.contact ? `<span class="btn">${esc(x.contact)}</span>` : '')}</div>
    </div></article>`;
}
function renderShow() {
  const srank = x => x.kind === 'insight' ? 9 : (['backhoe', 'minibackhoe'].includes(x.category) && TOP_BRANDS.test(x.title) ? 0 : PRIORITY.includes(x.category) ? 1 : x.category === 'roller' ? 2 : 3);
  const list = (S.show || []).filter(x => x.kind === 'insight' || x.kind === 'member' || x.kind === 'wanted' || hasPhoto(x)).filter(x => S.sk === 'all' || x.kind === S.sk || (S.sk === 'member' && x.kind === 'wanted')).sort((a, b) => srank(a) - srank(b));
  $('#showUpd').textContent = S.showUpdated ? `Последен преглед: ${ago(S.showUpdated)}.` : '';
  $('#showList').innerHTML = list.length ? list.map(showCard).join('')
    : `<div class="empty">${ICON_MACHINE}<b>${S.sk === 'member' ? 'Още няма машини от членове' : 'Шоурумът се подготвя'}</b>${S.sk === 'member' ? 'Добави първата — Claude ще я прегледа и публикува.' : 'Claude преглежда новите обяви на няколко часа.'}</div>`;
}
function openShowForm() {
  $('#sheetTitle').textContent = 'Добави в шоурума';
  $('#sheetBody').onclick = null;
  $('#sheetBody').innerHTML = `<form class="form" id="shForm" style="padding:0 20px 10px">
    <label>Какво предлагаш</label><select name="offer"><option>Продавам</option><option>Отдавам под наем</option><option>Демо машина</option><option>Търся машина</option></select>
    <label>Марка и модел</label><input name="model" required placeholder="напр. Hidromek HMK 102B Alpha">
    <div class="two"><div><label>Година</label><input name="year" inputmode="numeric" placeholder="2019"></div><div><label>Моточасове</label><input name="hours" inputmode="numeric" placeholder="4200"></div></div>
    <div class="two"><div><label>Цена, € без ДДС</label><input name="price" inputmode="numeric" placeholder="45000"></div><div><label>Държава / град</label><input name="location" placeholder="България, Русе"></div></div>
    <label>Описание</label><textarea name="desc" placeholder="Състояние, оборудване, сервизна история…"></textarea>
    <label>Линк към обява или снимка</label><input name="link" type="url" placeholder="https://…">
    <div class="two"><div><label>Име / фирма</label><input name="name" required></div><div><label>Телефон или имейл</label><input name="contact" required></div></div>
    <label class="consent"><input type="checkbox" name="ok" required>Съгласен съм данните да бъдат прегледани и публикувани в шоурума на ECOBenchmark.</label>
    <button class="btn primary" style="width:100%;margin-top:14px">Изпрати за преглед</button></form>`;
  $('#sheet').classList.add('on'); $('#scrim').classList.add('on');
  $('#shForm').onsubmit = async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target)); delete data.ok; data.sentAt = new Date().toISOString();
    try {
      const r = await fetch(`https://ntfy.sh/${INBOX_TOPIC}`, { method: 'POST', body: JSON.stringify(data) });
      if (!r.ok) throw 0;
      closeOverlays(); toast('Изпратено. Claude ще го прегледа и публикува до няколко часа.');
    } catch { toast('Изпращането не успя. Провери връзката и опитай пак.'); }
  };
}


// ---------- Аларма: Hidromek ----------
const ALARM_RX = /hidromek|хидромек|\bhmk ?\d{2,3}/i;
let audioCtx = null;
function unlockAudio() { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch {} }
['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true }));
function siren() {
  try {
    unlockAudio(); if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'square'; o.connect(g); g.connect(audioCtx.destination);
      const t = t0 + i * 0.55;
      o.frequency.setValueAtTime(880, t); o.frequency.linearRampToValueAtTime(1320, t + 0.22); o.frequency.linearRampToValueAtTime(880, t + 0.44);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
      o.start(t); o.stop(t + 0.5);
    }
  } catch {}
  try { navigator.vibrate?.([300, 120, 300, 120, 500]); } catch {}
}
let alarmQueue = [];
// Кратко заглавие „Марка Модел“ — четимо с един поглед
const FILLER = /\b(продавам|продава|спешно|нов внос|внос|като нов|sahibinden|galeriden|satılık|satilik|acil|temiz|makine|model|verkaufe|zu verkaufen|top zustand|in \S+ - .*$)\b/gi;
function shortTitle(it) {
  let t = (it.title || '').replace(/İ/g, 'I').replace(/ı/g, 'i').replace(/\s*[·|].*$/, '').replace(FILLER, ' ').replace(/\b4x4\b/gi, ' ').replace(/[!*/]+/g, ' ').replace(/\s+/g, ' ').trim();
  const isH = /hidromek|хидромек|\bhmk\b/i.test(t);
  const brand = isH ? 'Hidromek' : (it._brand || '');
  const rest = brand ? t.replace(new RegExp(brand + '|хидромек', 'ig'), ' ') : t;
  let model = ((rest.match(/\b(hmk ?\d{2,3}\s?[a-z]{0,3}|[a-z]{1,3} ?\d{1,3}[a-z]{0,3}|[1-4] ?cx|\d{2,3}\s?[a-z]{0,3})\b/i) || [])[0] || '').toUpperCase().replace(/\s+/g, ' ');
  if (/^(19|20)\d\d$/.test(model)) model = '';
  if (isH && /^\d/.test(model)) model = 'HMK ' + model;
  let out = brand ? (brand + ' ' + model).trim() : t.split(' ').slice(0, 5).join(' ');
  return out.length > 34 ? out.slice(0, 33) + '…' : out;
}
const CAT_SHORT = { backhoe: 'Комбиниран багер', minibackhoe: 'Мини комбиниран', mini: 'Мини багер', midi: 'Миди багер', crawler: 'Верижен багер', excavator: 'Багер', loader: 'Челен товарач', minicl: 'Мини челен товарач', roller: 'Валяк', telehandler: 'Телескопичен товарач', dozer: 'Булдозер' };
function speak(text) {
  if (!S.voiceOn || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = speechSynthesis.getVoices().find(v => /^bg/i.test(v.lang));
    if (v) u.voice = v; u.lang = 'bg-BG'; u.rate = 1.0;
    speechSynthesis.speak(u);
  } catch {}
}
const eurWords = n => n >= 1000 ? `${Math.round(n / 1000)} хиляди евро` : `${n} евро`;
let alarmTimer = null;
function showAlarm() {
  clearTimeout(alarmTimer);
  const it = alarmQueue.shift();
  if (!it) { $('#alarmBg').classList.remove('on'); return; }
  const src = SOURCES[it.source] || { name: it.source, flag: '' };
  const c = COUNTRIES[it._cc];
  const left = alarmQueue.length;
  const city = (it.location || (c ? c[1] : '')).replace(/^(гр\.|с\.)\s*/i, '').split(',')[0];
  const title = shortTitle(it);
  const price = it._eur ? fmtEur(it._eur) : (it.price || 'Цена при запитване');
  const kind = it.type === 'wanted' ? 'ТЪРСИ' : it.type === 'rent' ? 'ПОД НАЕМ' : 'ПРОДАВА';
  $('#alarmBox').innerHTML = `
    <div class="al-head"><span class="al-dot"></span><b>НОВА ОБЯВА</b><span class="al-kind">${kind}</span>${left ? `<span class="al-more">+${left}</span>` : ''}<button class="al-x" id="alarmClose" aria-label="Затвори">✕</button></div>
    ${it.photo ? `<div class="al-img"><img src="${esc(it.photo)}" alt="" referrerpolicy="no-referrer" onerror="this.parentNode.remove()"></div>` : ''}
    <div class="al-body">
      <div class="al-cat">${esc(CAT_SHORT[it._cat] || 'Техника')}</div>
      <h3 id="alarmTitle">${esc(title)}</h3>
      <div class="al-price">${esc(price)}</div>
      <div class="al-meta"><span>${c ? c[0] : src.flag} ${esc(city)}</span><span>${esc(src.name)}</span><span>${ago(it.firstSeen || it.date)}</span></div>
    </div>
    <div class="al-act">
      <a class="al-btn go" href="${esc(it.url)}" target="_blank" rel="noopener" id="alarmOpen">Отвори</a>
      <button class="al-btn save" id="alarmSave" aria-label="Запази">★</button>
      ${left ? `<button class="al-btn next" id="alarmNext">Следваща</button>` : ''}
    </div>
    <div class="al-timer"><i></i></div>`;
  $('#alarmBg').classList.add('on');
  const close = () => { alarmQueue = []; showAlarm(); };
  $('#alarmClose').onclick = close;
  if ($('#alarmNext')) $('#alarmNext').onclick = showAlarm;
  $('#alarmOpen').onclick = () => setTimeout(showAlarm, 300);
  $('#alarmSave').onclick = () => { const { _cat, _cc, _eur, _brand, _rank, ...raw } = it; S.favs[it.id] = { ...raw, savedAt: Date.now() }; save(); toast('★ Добавена в Демопарк'); showAlarm(); };
  alarmTimer = setTimeout(showAlarm, 40000);
  siren();
  setTimeout(() => speak(`Нова обява. ${title}. ${it._eur ? eurWords(it._eur) : ''}. ${city}.`), 1700);
}
function checkAlarm() {
  if (!S.alarmOn || !S.items.length) return;
  if (!store.get('alarmInit', false)) {   // първо пускане: старите обяви не алармират
    S.alarmed = S.items.filter(i => ALARM_RX.test(i.title + ' ' + (i.desc || ''))).map(i => i.id);
    store.set('alarmed', S.alarmed); store.set('alarmInit', true); return;
  }
  const seen = new Set(S.alarmed);
  const fresh = live().filter(i => ALARM_RX.test(i.title + ' ' + (i.desc || '')) && !seen.has(i.id) && isNew(i));
  if (!fresh.length) return;
  S.alarmed = [...S.alarmed, ...fresh.map(i => i.id)].slice(-1000); store.set('alarmed', S.alarmed);
  const wasOpen = $('#alarmBg').classList.contains('on');
  alarmQueue.push(...fresh);
  if (!wasOpen) showAlarm();
  if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
    navigator.serviceWorker?.ready.then(reg => fresh.slice(0, 3).forEach(it => reg.showNotification(`🟢 ${shortTitle(it)}${it._eur ? ' · ' + fmtEur(it._eur) : ''}`, {
      body: `${(it.location || '').split(',')[0]} · ${(SOURCES[it.source] || {}).name || ''}`, icon: 'icons/icon-192-eb3.png', badge: 'icons/badge-96-eb3.png', image: it.photo || undefined,
      tag: 'alarm-' + it.id, requireInteraction: true, renotify: true, vibrate: [300, 120, 300, 120, 500], data: { url: it.url } })));
  }
}


// ---------- Виртуален продавач (оценка) ----------
// Ориентировъчни цени на НОВА машина в Европа, € без ДДС (стандартна конфигурация), по клас.
const VS = {
  backhoe:     { label: 'Комбиниран багер', cls: [['Стандартен (8–9 т)', 88000], ['Голям / 4CX (9–11 т)', 105000]],
                 brands: ['Hidromek', 'JCB', 'Komatsu', 'Case', 'New Holland', 'Caterpillar', 'Volvo', 'Друга'], levels: ['Базово', 'Стандарт (A3)', 'Средно (A5)', 'Пълно (A8)'] },
  minibackhoe: { label: 'Мини комбиниран багер', cls: [['5–6 т (HMK 62, 1CX)', 62000]], brands: ['Hidromek', 'JCB', 'Case', 'Komatsu', 'Друга'], levels: ['Базово', 'Стандарт', 'Средно', 'Пълно'] },
  mini:        { label: 'Мини багер', cls: [['До 2 т', 26000], ['2–3,5 т', 38000], ['3,5–6 т', 56000]], brands: ['Komatsu', 'JCB', 'Caterpillar', 'Yanmar', 'Kubota', 'Takeuchi', 'Hidromek', 'Друга'], levels: ['Базово', 'Стандарт', 'Средно', 'Пълно'] },
  midi:        { label: 'Миди багер', cls: [['6–10 т', 85000]], brands: ['Hidromek', 'Komatsu', 'JCB', 'Caterpillar', 'Volvo', 'Hyundai', 'Друга'], levels: ['Базово', 'Стандарт', 'Средно', 'Пълно'] },
  crawler:     { label: 'Верижен багер', cls: [['12–16 т', 125000], ['18–25 т', 165000], ['30–40 т', 260000]], brands: ['Hidromek', 'Komatsu', 'Caterpillar', 'JCB', 'Volvo', 'Hyundai', 'Друга'], levels: ['Базово', 'Стандарт', 'Средно', 'Пълно'] },
  excavator:   { label: 'Колесен багер', cls: [['14–17 т', 150000], ['18–22 т', 180000]], brands: ['Hidromek', 'Komatsu', 'Caterpillar', 'JCB', 'Volvo', 'Hyundai', 'Друга'], levels: ['Базово', 'Стандарт', 'Средно', 'Пълно'] },
  minicl:      { label: 'Мини челен товарач', cls: [['Малък (до 2,5 т)', 42000], ['Голям / верижен', 62000]], brands: ['Gehl', 'Komatsu', 'Manitou', 'Case', 'Caterpillar', 'Takeuchi', 'Bobcat', 'Друга'], levels: ['Базово', 'Стандарт', 'Средно', 'Пълно'] },
  loader:      { label: 'Челен товарач', cls: [['Компактен (до 7 т)', 75000], ['Среден (10–15 т)', 140000], ['Голям (над 18 т)', 210000]], brands: ['Komatsu', 'Caterpillar', 'Volvo', 'JCB', 'Hidromek', 'Liebherr', 'Друга'], levels: ['Базово', 'Стандарт', 'Средно', 'Пълно'] },
  telehandler: { label: 'Телескопичен товарач', cls: [['До 10 м', 85000], ['13–18 м', 125000], ['Въртящ (MRT)', 230000]], brands: ['Manitou', 'Друга'], levels: ['Базово', 'Стандарт', 'Средно', 'Пълно (Privilege)'] },
  dozer:       { label: 'Булдозер', cls: [['Малък (до 12 т)', 140000], ['Среден (15–25 т)', 240000]], brands: ['Komatsu', 'Caterpillar', 'Liebherr', 'Друга'], levels: ['Базово', 'Стандарт', 'Средно', 'Пълно'] },
  roller:      { label: 'Валяк', cls: [['Тандем 1,5–4 т', 38000], ['Тандем 7–10 т', 95000], ['Почвен 10–13 т', 115000]], brands: ['Ammann', 'Bomag', 'Volvo', 'Hidromek', 'Hamm', 'Dynapac', 'Друга'], levels: ['Базово', 'Стандарт', 'Средно', 'Пълно'] }
};
// Марка спрямо средното ниво (задържане на стойност)
const BRAND_K = { JCB: 1.06, Caterpillar: 1.08, Komatsu: 1.06, Volvo: 1.05, Hidromek: 1.0, Case: 0.97, 'New Holland': 0.95, Hyundai: 0.92, Liebherr: 1.07, Manitou: 1.03, Yanmar: 1.0, Kubota: 1.02, Takeuchi: 1.0, Gehl: 0.95, Bobcat: 1.0, Ammann: 1.02, Bomag: 1.03, Hamm: 1.02, Dynapac: 0.98, 'Друга': 0.85 };
const COND = [['Отлично', 0.05], ['Добро', 0], ['Средно', -0.07], ['Лошо', -0.18]];
const COND_W = { chassis: 1, engine: 1.2, hydr: 1.1 };
const LEVEL_K = [-0.06, 0, 0.04, 0.09];
const EXTRAS = [['Климатик', 0.02], ['Бързосменник (хидр.)', 0.025], ['Линия за чук', 0.02], ['4x4 / 4 управляеми колела', 0.02], ['Телескопична стрела', 0.03], ['Нови гуми/вериги', 0.025], ['Отваряща кофа (4в1)', 0.02], ['GPS / телематика', 0.01], ['Пълна сервизна история', 0.04], ['Една собственост', 0.02], ['Документи / CE / регистрация', 0.02]];
const ATTACH = [['Доп. кофа', 600], ['Профилна/планир. кофа', 900], ['Хидравличен чук', 3500], ['Свредел', 2500], ['Вилици', 900], ['Мулчер', 6000], ['Метла/четка', 1800], ['Ripper / зъб', 700], ['Грайфер', 2200]];

function vsBuild() {
  const cat = $('#vsCat');
  if (!cat.options.length) cat.innerHTML = Object.entries(VS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('');
  const d = VS[cat.value];
  $('#vsCls').innerHTML = d.cls.map((c, i) => `<option value="${i}">${esc(c[0])}</option>`).join('');
  $('#vsBrand').innerHTML = d.brands.map(b => `<option>${esc(b)}</option>`).join('');
  document.querySelectorAll('#vsForm .cond').forEach(el => {
    const k = el.dataset.c, opts = k === 'level' ? d.levels.map((l, i) => [l, i]) : COND.map((c, i) => [c[0], i]);
    const def = k === 'level' ? 1 : 1;
    el.innerHTML = opts.map(([l, i]) => `<label><input type="radio" name="${k}" value="${i}" ${i === def ? 'checked' : ''}><span class="c${k === 'level' ? 2 : i + 1}">${esc(l)}</span></label>`).join('');
  });
  if (!$('#vsExtras').innerHTML) $('#vsExtras').innerHTML = EXTRAS.map((e, i) => `<label><input type="checkbox" name="ex" value="${i}">${esc(e[0])}</label>`).join('');
  if (!$('#vsAtt').innerHTML) $('#vsAtt').innerHTML = ATTACH.map((a, i) => `<label><input type="checkbox" name="at" value="${i}">${esc(a[0])}</label>`).join('');
}
const yearOf = it => { const m = (it.year || '') + ' ' + it.title + ' ' + (it.desc || ''); const y = m.match(/\b(19[89]\d|20[0-2]\d)\b/); return y ? +y[1] : null; };

// Цена на нова машина според марката (спрямо средната за класа) — където разликата е значима
const NEWP = { backhoe: { Hidromek: 0.9, JCB: 1.03, Komatsu: 0.98, Case: 0.95, 'New Holland': 0.93, Caterpillar: 1.05, Volvo: 1.02 }, minibackhoe: { Hidromek: 0.93, JCB: 1.04 } };
// Нормални моточасове годишно по категория (реално натоварване в България/Балканите)
const HRS_YR = { backhoe: 600, minibackhoe: 550, mini: 550, minicl: 600, midi: 750, telehandler: 650, roller: 450 };
// Обявите са ИСКАНИ цени — реално платените са средно ~8% по-ниски
const ASK_DISC = 0.92;
// Реални сделки (без имена на клиенти) — за калибриране и проверка на модела
const DEALS = [
  { cat: 'backhoe', brand: 'Hidromek', model: 'HMK 102B', year: 2015, hours: 3737, eur: 25000, kind: 'Продажба на купувач', date: '2026-09' },
  { cat: 'backhoe', brand: 'Hidromek', model: 'HMK 102B A5', year: 2022, hours: 977, eur: 62000, kind: 'Обратно изкупуване (купува търговец)', date: '2026-10', dealer: true },
  { cat: 'backhoe', brand: 'Hidromek', model: 'HMK 102B A5 (нова)', year: 2026, hours: 0, eur: 80000, kind: 'Нова машина — договорена цена', date: '2026-10', isNew: true },
  { cat: 'minibackhoe', brand: 'Hidromek', model: 'HMK 62 SS K4 (нова)', year: 2026, hours: 0, eur: 60000, kind: 'Нова машина — договорена цена', date: '2026-09', isNew: true }
];
// Амортизация (калибрирана по реални сделки): −15% първата година, −5%/год. до 5-та, −12%/год. до 10-та, −10%/год. след това; минимум 10%
function ageFactor(age) {
  if (age <= 0) return 0.92;
  let k = 0.85;
  for (let y = 2; y <= age; y++) k *= y <= 5 ? 0.95 : y <= 10 ? 0.88 : 0.9;
  return Math.max(0.1, k);
}
function vsModel(f) {
  const d = VS[f.cat], [clsName, base] = d.cls[+f.cls];
  const newPrice = Math.round(base * ((NEWP[f.cat] || {})[f.brand] || 1));
  const now = new Date().getFullYear(), age = Math.max(0, now - +f.year);
  const steps = [];
  // 1) възраст
  let v = newPrice * ageFactor(age);
  steps.push([`Нова машина ${f.brand} (${clsName})`, newPrice, 'base'], [`Възраст ${age} г.`, v - newPrice]);
  // 2) задържане на стойността според марката
  const bk = BRAND_K[f.brand] ?? 0.9; const v2 = v * bk; if (Math.abs(v2 - v) > 1) steps.push([`Задържане на стойност (${f.brand})`, v2 - v]); v = v2;
  // 3) моточасове спрямо нормата; бонусът за малко часове намалява при стари машини
  const perYr = HRS_YR[f.cat] || 850;
  const norm = Math.max(300, age * perYr), diff = (+f.hours - norm) / 1000;
  const cap = age <= 6 ? 0.08 : age <= 12 ? 0.02 : 0;
  const hk = Math.max(-0.25, Math.min(cap, -diff * 0.035)); const v3 = v * (1 + hk);
  steps.push([`${(+f.hours).toLocaleString('bg-BG')} мч (норма ~${norm.toLocaleString('bg-BG')})`, v3 - v]); v = v3;
  // 4) състояние
  for (const [k, lbl] of [['chassis', 'Шаси / ходова част'], ['engine', 'Двигател'], ['hydr', 'Хидравлика']]) {
    const c = COND[+f[k]]; const nv = v * (1 + c[1] * COND_W[k]); steps.push([`${lbl}: ${c[0].toLowerCase()}`, nv - v]); v = nv;
  }
  // 5) ниво на оборудване и екстри
  const lv = v * (1 + LEVEL_K[+f.level]); steps.push([`Оборудване: ${d.levels[+f.level]}`, lv - v]); v = lv;
  const exK = Math.min(0.18, (f.ex || []).reduce((a, i) => a + EXTRAS[i][1], 0));
  if (exK) { const nv = v * (1 + exK); steps.push([`Екстри (${f.ex.length})`, nv - v]); v = nv; }
  // 6) прикачен инвентар (по-тежка техника — по-скъп инвентар)
  const attK = newPrice > 120000 ? 1.6 : newPrice < 45000 ? 0.6 : 1;
  const att = (f.at || []).reduce((a, i) => a + ATTACH[i][1] * attK, 0);
  if (att) { steps.push([`Инвентар (${f.at.length})`, att]); v += att; }
  return { v, steps, newPrice, age };
}
// Ключ на модела („HMK 102B Alpha“ → „102b“), за да сравняваме само същия модел, когато има достатъчно обяви
const modelKey = m => ((m || '').toLowerCase().match(/\b(\d{1,3}[a-z]{0,2}|[a-z]{1,3}\s?\d{2,4}[a-z]{0,2}|\dcx)\b/g) || []).map(x => x.replace(/\s/g, '')).filter(x => x.length >= 2)[0] || '';
function vsValue(f) {
  const m = vsModel(f), steps = m.steps, model = m.v;
  // Сверка с реални обяви: същата категория и марка, ±3 години, САМО с известна година
  const brandRx = new RegExp(f.brand.replace(/\s+/g, '\\s*'), 'i');
  let pool = S.items.filter(i => i._cat === f.cat && i._eur && i.type === 'sale' && (f.brand === 'Друга' || brandRx.test(txt(i))))
    .map(i => ({ i, y: yearOf(i) })).filter(c => c.y && Math.abs(c.y - +f.year) <= 3)
    .filter(c => c.i._eur > model * 0.4 && c.i._eur < model * 2.2);
  const mk = modelKey(f.model);
  let sameModel = false;
  if (mk) { const same = pool.filter(c => txt(c.i).replace(/\s/g, '').includes(mk)); if (same.length >= 3) { pool = same; sameModel = true; } }
  // отстраняване на крайни стойности (извън 0,6–1,6 × медианата)
  if (pool.length >= 4) { const md = median(pool.map(c => c.i._eur)); pool = pool.filter(c => c.i._eur > md * 0.6 && c.i._eur < md * 1.6); }
  const comps = pool.sort((a, b) => Math.abs(a.y - +f.year) - Math.abs(b.y - +f.year)).slice(0, 12);
  let fair = model, conf = 'ниска', med = null;
  if (comps.length >= 3) {
    // корекция на всяка обява към годината на оценяваната машина, после към реална (не искана) цена
    const adj = comps.map(c => c.i._eur * ageFactor(m.age) / ageFactor(Math.max(0, new Date().getFullYear() - c.y)) * ASK_DISC);
    med = median(adj);
    const w = Math.min(0.5, comps.length * 0.06 + (sameModel ? 0.1 : 0));
    fair = model * (1 - w) + med * w; steps.push([`Сверка с ${comps.length} обяви${sameModel ? ' за същия модел' : ''} (медиана ${fmtEur(med)}, приравнена)`, fair - model]);
    conf = comps.length >= 6 ? 'висока' : 'средна';
  }
  // Реални сделки за същата категория и марка → проверка на модела
  const check = DEALS.filter(x => x.cat === f.cat && x.brand === f.brand).map(x => {
    const ff = { ...f, year: x.year, hours: x.hours, chassis: 1, engine: 1, hydr: 1, ex: [], at: [] };
    const mm = vsModel(ff);
    const p = Math.round((x.isNew ? mm.newPrice * (1 + LEVEL_K[+f.level]) : mm.v) / 100) * 100;
    return { ...x, est: p, err: (p - x.eur) / x.eur };
  });
  fair = Math.round(fair / 100) * 100;
  const spread = conf === 'висока' ? 0.08 : conf === 'средна' ? 0.11 : 0.15;
  return { fair, lo: Math.round(fair * (1 - spread) / 100) * 100, hi: Math.round(fair * (1 + spread) / 100) * 100, spread, steps, comps, conf, med, sameModel, check, model: Math.round(model), newPrice: m.newPrice };
}
// Чувствителност: колко се мести стойността при промяна на един параметър (само модела, без обявите)
function vsSens(f) {
  const base = vsModel(f).v, out = [];
  const t = (label, ch) => { const v = vsModel({ ...f, ...ch }).v; out.push([label, Math.round((v - base) / 100) * 100]); };
  t('+1 000 моточаса', { hours: +f.hours + 1000 });
  if (+f.hours >= 1000) t('−1 000 моточаса', { hours: +f.hours - 1000 });
  if (+f.year < new Date().getFullYear()) t('1 година по-нова', { year: +f.year + 1 });
  t('1 година по-стара', { year: +f.year - 1 });
  if (+f.engine > 0) t('Двигател с една степен по-добре', { engine: +f.engine - 1 });
  if (+f.engine < 3) t('Двигател с една степен по-зле', { engine: +f.engine + 1 });
  if (+f.hydr < 3) t('Хидравлика с една степен по-зле', { hydr: +f.hydr + 1 });
  if (+f.level < 3) t('Едно ниво по-пълно оборудване', { level: +f.level + 1 });
  if (!(f.ex || []).includes(8)) t('С пълна сервизна история', { ex: [...(f.ex || []), 8] });
  return out;
}


// Сценарии за продажба: цена ↔ вероятност ↔ срок, според ликвидността на машината
const LIQ_CAT = { backhoe: 0.8, minibackhoe: 0.9, mini: 0.8, minicl: 0.9, midi: 0.95, crawler: 1.0, excavator: 1.1, loader: 1.0, telehandler: 1.0, roller: 1.15, dozer: 1.3 };
const LIQ_BRAND = { Hidromek: 0.88, JCB: 0.88, Caterpillar: 0.9, Komatsu: 0.9, Volvo: 0.95, Manitou: 0.92, Bomag: 0.95, Ammann: 0.95, 'Друга': 1.25 };
function saleScenarios(f, r) {
  const age = new Date().getFullYear() - +f.year;
  let L = (LIQ_CAT[f.cat] || 1) * (LIQ_BRAND[f.brand] || 1);
  if (age > 15) L *= 1.15; else if (age <= 5) L *= 0.95;
  if ([f.chassis, f.engine, f.hydr].some(x => +x === 3)) L *= 1.25; else if ([f.chassis, f.engine, f.hydr].some(x => +x === 2)) L *= 1.08;
  const wanted = S.items.filter(i => i.type === 'wanted' && i._cat === f.cat).length;
  if (wanted >= 3) L *= 0.9;
  const prob = (b) => Math.max(5, Math.min(92, Math.round(b / Math.sqrt(L))));
  const span = (a, b) => { const x = Math.round(a * L), y = Math.round(b * L); const fmt = d => d < 14 ? `${d} дни` : d < 60 ? `${Math.round(d / 7)} седм.` : `${Math.round(d / 30)} мес.`; return `${fmt(x)} – ${fmt(y)}`; };
  const R = n => Math.round(n / 500) * 500;
  return { L, wanted, rows: [
    { z: 'z1', icon: '🟢', name: 'Бърза продажба', from: R(r.lo * 0.95), to: R(r.lo), p: prob(88), t: span(7, 25), tip: 'Цена под пазара — привлича купувачи веднага. Добре при нужда от ликвидност.' },
    { z: 'z2', icon: '🟡', name: 'Пазарна продажба', from: R(r.lo), to: R(r.hi), p: prob(62), t: span(30, 80), tip: `Около справедливата стойност ${fmtEur(r.fair)}. Нормален срок и място за договаряне.` },
    { z: 'z3', icon: '🔴', name: 'Максимална цена', from: R(r.hi), to: R(r.hi * 1.12), p: prob(28), t: span(90, 200), tip: 'Изисква отлично състояние, история и търпение — или конкретен купувач.' }
  ] };
}
function scenariosHtml(sc) {
  return `<div class="scen"><div class="scen-h">Сценарии за продажба</div>
    ${sc.rows.map(x => `<div class="scen-row ${x.z}">
      <div class="scen-top"><b>${x.icon} ${esc(x.name)}</b><span>${fmtEur(x.from)} – ${fmtEur(x.to)}</span></div>
      <div class="scen-mid"><div class="pbar"><i style="width:${x.p}%"></i></div><b>${x.p}%</b></div>
      <div class="scen-bot"><span>⏱ ${esc(x.t)}</span><small>${esc(x.tip)}</small></div>
    </div>`).join('')}
    <div class="note2" style="margin-top:8px">Вероятност за продажба в посочения срок. Ликвидност: ${sc.L < 0.85 ? 'висока' : sc.L < 1.05 ? 'нормална' : 'ниска'}${sc.wanted ? ` · ${sc.wanted} души търсят такава техника в момента` : ''}.</div></div>`;
}

function sensHtml(f) {
  const rows = vsSens(f); if (!rows.length) return '';
  return `<details style="margin-top:12px" open><summary style="cursor:pointer;font-weight:700">Какво движи цената</summary><table class="brk">${rows.map(([l, v]) => `<tr><td>${esc(l)}</td><td class="${v >= 0 ? 'pos' : 'neg'}">${v >= 0 ? '+' : '−'}${fmtEur(Math.abs(v))}</td></tr>`).join('')}</table></details>`;
}
function checkHtml(r) {
  if (!r.check.length) return '<div class="note2">За тази марка и категория моделът още не е проверен с реални сделки — приемай резултата с повече резерва.</div>';
  return `<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">Проверка с реални сделки (${r.check.length})</summary><table class="brk">${r.check.map(x => `<tr><td>${esc(x.model)} · ${x.year}${x.hours ? ' · ' + x.hours.toLocaleString('bg-BG') + ' мч' : ''}<br><small style="color:var(--muted)">${esc(x.kind)}: ${fmtEur(x.eur)} · модел ${fmtEur(x.est)}</small></td><td class="${Math.abs(x.err) <= 0.105 ? 'pos' : 'neg'}">${x.err >= 0 ? '+' : '−'}${Math.abs(Math.round(x.err * 100))}%</td></tr>`).join('')}</table></details>`;
}
function verdictOf(ask, r) {
  if (!ask) return null;
  if (ask <= r.lo) return [`🟢 Изгодна цена — ${fmtEur(ask)} е под пазарния диапазон. Провери защо: документи, скрити дефекти, спешна продажба.`, 'z1'];
  if (ask <= r.hi) return [`🟡 Пазарна цена — ${fmtEur(ask)} е в нормалния диапазон за тази машина. Има място за договаряне към ${fmtEur(r.fair)}.`, 'z2'];
  if (ask <= r.hi * 1.06) return [`🟠 Горна граница — ${fmtEur(ask)} е малко над пазарния диапазон. Оправдано е при добро състояние и пълна история; иначе договаряй към ${fmtEur(r.hi)}.`, 'z2'];
  return [`🔴 Висока цена — ${fmtEur(ask)} е над пазара с ${Math.round((ask / r.hi - 1) * 100)}%. Може да си заслужава при отлично състояние, пълна сервизна история, малко часове или рядка конфигурация — иначе договаряй.`, 'z3'];
}
function vsRender(f, r) {
  const ask = +f.ask || 0;
  const min = r.lo * 0.82, max = r.hi * 1.18, pos = x => Math.max(2, Math.min(98, (x - min) / (max - min) * 100));
  const [verdict, vc] = verdictOf(ask, r) || ['', ''];
  const d = VS[f.cat];
  const sc = saleScenarios(f, r);
  $('#vsResult').innerHTML = `<div class="res">
    <div class="rt">${esc(d.label)} · ${esc(f.brand)} ${esc(f.model || '')} · ${esc(f.year)} · ${(+f.hours).toLocaleString('bg-BG')} мч</div>
    <div class="rv">${fmtEur(r.lo)} – ${fmtEur(r.hi)}</div>
    <div class="rt">Справедлива стойност ≈ ${fmtEur(r.fair)} без ДДС · точност: ${r.conf}</div>
    <div class="scale"><div class="bar"></div>
      <div class="smk" style="left:${pos(r.fair)}%">Пазар</div>
      ${ask ? `<div class="smk" style="left:${pos(ask)}%;color:var(--signal)">Искана</div>` : ''}
      <div class="ticks"><span>Изгодно</span><span>Пазарно</span><span>Високо</span></div></div>
    <div class="zones">
      <div class="zone z1"><small>Препоръчителна</small><b>до ${fmtEur(r.lo)}</b></div>
      <div class="zone z2"><small>Пазарна</small><b>${fmtEur(r.lo)}–${fmtEur(r.hi)}</b></div>
      <div class="zone z3"><small>Рискова</small><b>над ${fmtEur(r.hi)}</b></div>
    </div>
    ${verdict ? `<div class="verdict2 zone ${vc}" style="text-align:left">${esc(verdict)}</div>` : ''}
    ${scenariosHtml(sc)}
    ${sensHtml(f)}
    ${checkHtml(r)}
    <details style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">Как е изчислено</summary>
      <table class="brk">${r.steps.map(([l, v, b]) => `<tr><td>${esc(l)}</td><td class="${b ? '' : v >= 0 ? 'pos' : 'neg'}">${b ? fmtEur(v) : (v >= 0 ? '+' : '−') + fmtEur(Math.abs(v))}</td></tr>`).join('')}</table></details>
    ${r.comps.length ? `<details style="margin-top:10px"><summary style="cursor:pointer;font-weight:700">Сравними обяви (${r.comps.length})</summary><div class="comps">${r.comps.map(c => `<a href="${esc(c.i.url)}" target="_blank" rel="noopener"><span>${esc(shortTitle(c.i))} · ${c.y} · ${COUNTRIES[c.i._cc]?.[0] || ''}</span><b>${fmtEur(c.i._eur)}</b></a>`).join('')}</div></details>` : '<div class="note2">Няма достатъчно сравними обяви с известна година — оценката е само по модела.</div>'}
    <div class="note2">Ориентировъчна оценка — не замества оглед. Точност ±${Math.round(r.spread * 100)}% (${r.conf}). Обявите са искани цени и са приравнени към реални (−8%).</div>
    <div class="pdfrow"><button class="btn primary" id="vsPdf">📄 PDF доклад</button><button class="btn" id="vsPdfShare">📤 Изпрати PDF</button></div>
    <button class="al-btn go" id="vsAsk" style="width:100%;margin-top:12px">🤖 Поискай становище от Claude</button><div style="font-size:12px;color:var(--muted);margin-top:6px;text-align:center">${vsFiles.length ? vsFiles.length + ' прикачени файла · ' : ''}Claude чете протокола и снимките и отговаря до около час</div>
    <div class="alarm-act" style="padding:12px 0 0"><button class="btn" id="vsShare" style="flex:1">Сподели като текст</button><button class="btn" id="vsAgain" style="flex:1">Нова оценка</button></div>
    <button class="btn primary" id="vsPost" style="width:100%;margin-top:10px;justify-content:center">📢 Публикувай тази машина навсякъде</button>
  </div>`;
  $('#vsResult').scrollIntoView({ behavior: 'smooth' });
  const text = `ECOBenchmark — оценка\n${d.label} ${f.brand} ${f.model || ''}, ${f.year} г., ${f.hours} мч\nПазарен диапазон: ${fmtEur(r.lo)} – ${fmtEur(r.hi)} без ДДС\nСправедлива стойност: ≈ ${fmtEur(r.fair)}${ask ? `\nИскана цена: ${fmtEur(ask)}` : ''}\n\nСценарии за продажба:\n${sc.rows.map(x => `${x.icon} ${x.name}: ${fmtEur(x.from)}–${fmtEur(x.to)} · ${x.p}% · ${x.t}`).join('\n')}`;
  $('#vsShare').onclick = async () => { try { if (navigator.share) await navigator.share({ title: 'Оценка на техника', text }); else { await navigator.clipboard.writeText(text); toast('Оценката е копирана'); } } catch {} };
  $('#vsPdf').onclick = () => vsPdf(f, null, 'download');
  $('#vsPdfShare').onclick = () => vsPdf(f, null, 'share');
  $('#vsAsk').onclick = () => requestOpinion(f, r);
  $('#vsPost').onclick = () => window.pbPrefill && pbPrefill(f);
  $('#vsAgain').onclick = () => { $('#vsResult').innerHTML = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); };
}
$('#vsCat').onchange = vsBuild;
$('#vsForm').onsubmit = e => {
  e.preventDefault();
  const fd = new FormData(e.target), f = Object.fromEntries(fd);
  f.ex = fd.getAll('ex').map(Number); f.at = fd.getAll('at').map(Number);
  vsRender(f, vsValue(f));
};


// ---------- PDF доклад ----------
const loadScript = src => new Promise((ok, no) => { if (document.querySelector(`script[src="${src}"]`)) return ok(); const el = document.createElement('script'); el.src = src; el.onload = ok; el.onerror = () => no(new Error(src)); document.head.appendChild(el); });
async function vsPdf(f, op, mode) {
  toast('Подготвям PDF…');
  try {
    if (!window.pdfMake) { await loadScript('vendor/pdfmake.min.js'); await loadScript('vendor/vfs_fonts.js'); }
    await loadScript('report.js');
    const r = vsValue(f), sc = saleScenarios(f, r), d = VS[f.cat], ask = +f.ask || 0;
    const vv = verdictOf(ask, r), verdict = vv ? { z: vv[1], t: vv[0] } : null;
    const now = new Date();
    const D = { f, r: { ...r, check: r.check.map(c => ({ ...c, model_name: c.model, model: c.est })) }, sc, sens: vsSens(f), op, verdict,
      label: d.label, clsName: d.cls[+f.cls][0], levelName: d.levels[+f.level],
      cond: { chassis: COND[+f.chassis][0], engine: COND[+f.engine][0], hydr: COND[+f.hydr][0] },
      extras: (f.ex || []).map(i => EXTRAS[i][0]), attach: (f.at || []).map(i => ATTACH[i][0]),
      comps: r.comps.slice(0, 12).map(c => ({ title: shortTitle(c.i).slice(0, 70), url: c.i.url, y: c.y, eur: c.i._eur, cc: COUNTRIES[c.i._cc]?.[1] || c.i._cc || '' })),
      ref: 'EB-' + now.toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
      date: now.toLocaleDateString('bg-BG', { day: '2-digit', month: 'long', year: 'numeric' }) };
    const doc = pdfMake.createPdf(window.ECOReport.build(D));
    const name = `ECOBenchmark_${f.brand}_${(f.model || d.label).replace(/[^\wА-я]+/g, '_')}_${f.year}.pdf`.replace(/_+/g, '_');
    const blob = await new Promise(ok => doc.getBlob(ok));
    const file = new File([blob], name, { type: 'application/pdf' });
    if (mode === 'share' && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Оценка на техника' }); return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    toast(mode === 'share' ? 'Споделянето не се поддържа тук — PDF-ът е изтеглен' : 'PDF-ът е изтеглен');
  } catch (e) { if (e?.name !== 'AbortError') toast('PDF не успя: ' + (e.message || e)); }
}

// ---------- Становище от Claude (снимки, протоколи, текст) ----------
const EVAL_TOPIC = 'bb-eval-562f6663a9e8';
let vsFiles = [];
async function shrinkImage(file) {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch { return file; }
}
function renderFiles() {
  $('#vsFileList').innerHTML = vsFiles.map((f, i) => f.type.startsWith('image/')
    ? `<div class="fi" style="background-image:url('${URL.createObjectURL(f)}')"><button type="button" data-rmf="${i}">✕</button></div>`
    : `<div class="fi">📄 ${esc(f.name.slice(-18))}<button type="button" data-rmf="${i}">✕</button></div>`).join('');
}
$('#vsFiles').onchange = async e => {
  for (const f of [...e.target.files]) { if (vsFiles.length >= 10) break; if (f.size > 14e6) { toast(`${f.name} е над 14 MB`); continue; } vsFiles.push(await shrinkImage(f)); }
  e.target.value = ''; renderFiles();
};
$('#vsFileList').onclick = e => { const b = e.target.closest('[data-rmf]'); if (b) { vsFiles.splice(+b.dataset.rmf, 1); renderFiles(); } };

async function requestOpinion(f, r) {
  const rid = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const d = VS[f.cat];
  const btn = $('#vsAsk'); if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin2"></span>Изпращане…'; }
  try {
    for (let i = 0; i < vsFiles.length; i++) {
      const file = vsFiles[i];
      const msg = JSON.stringify({ kind: 'file', rid, i });
      const res = await fetch(`https://ntfy.sh/${EVAL_TOPIC}?filename=${encodeURIComponent(file.name)}&message=${encodeURIComponent(msg)}`, { method: 'PUT', body: file });
      if (!res.ok) throw new Error('файл ' + file.name);
    }
    const req = { kind: 'request', rid, sentAt: new Date().toISOString(), files: vsFiles.length,
      machine: { category: d.label, cls: d.cls[+f.cls][0], brand: f.brand, model: f.model || '', year: +f.year, hours: +f.hours,
        chassis: COND[+f.chassis][0], engine: COND[+f.engine][0], hydraulics: COND[+f.hydr][0], level: d.levels[+f.level],
        extras: (f.ex || []).map(i => EXTRAS[i][0]), attachments: (f.at || []).map(i => ATTACH[i][0]), askPrice: +f.ask || null },
      estimate: { lo: r.lo, fair: r.fair, hi: r.hi, confidence: r.conf, scenarios: saleScenarios(f, r).rows.map(x => ({ name: x.name, from: x.from, to: x.to, probability: x.p, time: x.t })), comparables: r.comps.slice(0, 8).map(c => ({ title: c.i.title, eur: c.i._eur, url: c.i.url, year: c.y })) },
      notes: (f.notes || '').slice(0, 6000) };
    const res = await fetch(`https://ntfy.sh/${EVAL_TOPIC}?filename=request.json&message=${encodeURIComponent(JSON.stringify({ kind: 'request', rid }))}`, { method: 'PUT', body: new Blob([JSON.stringify(req)], { type: 'application/json' }) });
    if (!res.ok) throw new Error('заявка');
    S.ops = [{ rid, f, title: `${f.brand} ${f.model || d.label}, ${f.year}`, sentAt: req.sentAt, files: vsFiles.length }, ...S.ops].slice(0, 30); store.set('ops', S.ops);
    vsFiles = []; renderFiles();
    toast('Изпратено. Claude ще даде становище до около час.');
    renderOps(); $('#vsOps').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    toast('Изпращането не успя (' + err.message + '). Провери интернета и опитай пак.');
  } finally { if (btn) { btn.disabled = false; btn.textContent = '🤖 Поискай становище от Claude'; } }
}
function mdLite(t) {
  t = String(t).replace(/\n{2,}(?=- )/g, '\n').replace(/(- [^\n]+)\n{2,}/g, '$1\n');
  return esc(t).replace(/^### (.+)$/gm, '<h5>$1</h5>').replace(/^## (.+)$/gm, '<h5>$1</h5>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|\n)- (.+)/g, '$1<li>$2</li>').replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>').replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>');
}
async function renderOps() {
  if (!S.ops.length) { $('#vsOps').innerHTML = '<p class="note">Още няма заявки. Попълни машината, прикачи снимки или протокол и натисни „Поискай становище от Claude“.</p>'; return; }
  $('#vsOps').innerHTML = S.ops.map(o => `<div class="op ${o.done ? '' : 'wait'}" id="op-${o.rid}"><h4>${esc(o.title)}</h4>
    <p class="st">${o.done ? '✅ Становище от Claude · ' + ago(o.doneAt) : `<span class="spin2"></span>Очаква преглед · изпратено ${ago(o.sentAt)}${o.files ? ' · ' + o.files + ' файла' : ''}`}</p>
    ${o.html ? `<div class="body">${o.html}</div>` : ''}${o.done && o.f && o.j ? `<div class="pdfrow"><button class="btn primary" data-oppdf="${o.rid}">📄 PDF със становището</button><button class="btn" data-opshare="${o.rid}">📤 Изпрати</button></div>` : ''}</div>`).join('');
}
async function pollOps(notify) {
  let changed = false;
  for (const o of S.ops.filter(o => !o.done)) {
    try {
      const r = await fetch(`data/opinions/${o.rid}.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) continue;
      const j = await r.json();
      o.done = true; o.doneAt = j.updated || new Date().toISOString(); o.j = j;
      o.html = `${j.verdict ? `<div class="verdict2 zone ${j.zone === 'green' ? 'z1' : j.zone === 'red' ? 'z3' : 'z2'}" style="text-align:left;margin-top:0">${esc(j.verdict)}</div>` : ''}${j.range ? `<p><b>Оценка на Claude:</b> ${esc(j.range)}</p>` : ''}${mdLite(j.opinion || '')}${Array.isArray(j.scenarios) && j.scenarios.length ? scenariosHtml({ L: 1, wanted: 0, rows: j.scenarios.map((x, i) => ({ z: ['z1', 'z2', 'z3'][i] || 'z2', icon: ['🟢', '🟡', '🔴'][i] || '🟡', name: x.name, from: x.from, to: x.to, p: x.probability, t: x.time, tip: x.note || '' })) }).replace(/<div class="note2"[\s\S]*?<\/div><\/div>$/, '</div>') : ''}`;
      changed = true;
      if (notify && 'Notification' in window && Notification.permission === 'granted') navigator.serviceWorker?.ready.then(reg => reg.showNotification('🟢 Становище от Claude', { body: o.title + (j.verdict ? '\n' + j.verdict.slice(0, 90) : ''), icon: 'icons/icon-192-eb3.png', badge: 'icons/badge-96-eb3.png', tag: 'op-' + o.rid, data: { url: './?v=seller' } }));
      else if (notify) toast('🟢 Становище от Claude: ' + o.title);
    } catch {}
  }
  if (changed) { store.set('ops', S.ops); if (S.view === 'seller') renderOps(); }
}
setInterval(() => pollOps(true), 5 * 60 * 1000);
$('#vsOps').addEventListener('click', e => {
  const b = e.target.closest('[data-oppdf],[data-opshare]'); if (!b) return;
  const o = S.ops.find(x => x.rid === (b.dataset.oppdf || b.dataset.opshare)); if (o) vsPdf(o.f, o.j, b.dataset.oppdf ? 'download' : 'share');
});


// ---------- Ловец на сделки ----------
const CONF = { 'висока': 'Висока увереност', 'средна': 'Средна увереност', 'ниска': 'Ниска увереност' };
function dealsVisible() {
  return S.deals.filter(x => !S.disabled.includes(x.source) && (
    S.dk === 'all' ? true : S.dk === 'good' ? !x.suspicious && x.conf !== 'ниска' : S.dk === 'bg' ? !x.foreign && !x.suspicious : x.foreign && !x.suspicious));
}
function dealCard(x) {
  const src = SOURCES[x.source] || { name: x.source, flag: '🌐' };
  const facts = [x.brand + ' ' + x.model, x.year ? x.year + ' г.' : 'година неизвестна', x.hours ? x.hours.toLocaleString('bg-BG') + ' мч' : '', (x.location || (x.foreign ? 'Европа' : 'България'))].filter(Boolean).join(' · ');
  const pct = Math.max(4, Math.min(100, Math.round(x.price / x.market * 100)));
  return `<article class="deal">
    <a class="dimg" href="${esc(x.url)}" target="_blank" rel="noopener"><img src="${esc(x.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">
      <span class="off ${x.suspicious ? 'warn' : ''}">${x.suspicious ? 'ПРОВЕРИ' : '−' + x.discount + '%'}</span><span class="cf">${CONF[x.conf] || ''}</span></a>
    <div class="db">
      <a class="dt" href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>
      <div class="facts">${esc(facts)}</div>
      <div class="prices"><b>${fmtEur(x.price)}</b><s>пазар ${fmtEur(x.market)}</s></div>
      <div class="gauge"><i style="width:${pct}%"></i></div>
      <div class="gl"><span>Цена = ${pct}% от пазара</span><span>${x.n} обяви · ${esc(x.basis)}</span></div>
      <div class="money"><div><small>Потенциал при препродажба</small><b class="${x.profit > 0 ? 'pos' : ''}">${fmtEur(x.profit)}</b></div><div><small>Комисионна при посредничество</small><b>~${fmtEur(x.commission)}</b></div></div>
      ${x.suspicious ? '<div class="warnline">Цената е над 60% под пазара — може да е част, капаро или грешка в обявата.</div>' : ''}
      <div class="acts"><a class="btn dark" href="${esc(x.url)}" target="_blank" rel="noopener">Обявата в ${esc(src.name)}</a><button class="btn primary" data-dshare="${esc(x.id)}">Изпрати на клиент</button></div>
    </div></article>`;
}
function renderDeals() {
  const list = dealsVisible();
  const good = S.deals.filter(x => !x.suspicious && x.conf !== 'ниска');
  const best = S.deals.filter(x => !x.suspicious).reduce((m, x) => Math.max(m, x.discount), 0);
  const pot = good.reduce((a, x) => a + Math.max(0, x.profit), 0);
  $('#dealsSum').innerHTML = `<div><b>${S.deals.filter(x => !x.suspicious).length}</b><small>под пазара</small></div><div class="g"><b>${best ? '−' + best + '%' : '—'}</b><small>най-голяма отстъпка</small></div><div><b>${pot ? fmtEur(pot).replace('€ ', '€') : '—'}</b><small>потенциал (сигурни)</small></div>`;
  $('#dealsSub').textContent = S.dealsUpdated ? `Обновено ${ago(S.dealsUpdated)}. Обяви, по-евтини от средната цена за същия модел и година.` : 'Обяви, по-евтини от средната цена за същия модел и година.';
  $('#dealList').innerHTML = list.length ? list.map(dealCard).join('')
    : `<div class="empty">${ICON_MACHINE}<b>${S.dk === 'good' ? 'Още няма сигурни сделки' : 'Няма сделки по този филтър'}</b>${S.dk === 'good' ? 'Скенерът трупа история на цените и чете годините от обявите. Сигурните сделки се появяват, когато за модела има поне 4 обяви с близка година. Виж и „Всички“.' : 'Пробвай друг филтър.'}</div>`;
}
async function shareDeal(id) {
  const x = S.deals.find(d => d.id === id); if (!x) return;
  const text = `Здравейте! Попаднах на машина, която може да Ви заинтересува:\n${x.brand} ${x.model}${x.year ? ', ' + x.year + ' г.' : ''}${x.hours ? ', ' + x.hours.toLocaleString('bg-BG') + ' мч' : ''}\nЦена: ${fmtEur(x.price)} (пазарна около ${fmtEur(x.market)})\nМога да организирам оглед и сделката. Николай Герчев`;
  try { if (navigator.share) { await navigator.share({ title: x.brand + ' ' + x.model, text, url: x.url }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text + '\n' + x.url); toast('Текстът е копиран — постави го във Viber или WhatsApp'); } catch { toast('Споделянето не е налично'); }
}

// ---------- Навигация ----------
const HERO = {
  feed:   ['Пазарът на техника в Европа', 'Не продаваме техника.\nНамираме решения за вас.'],
  market: ['Европейски пазари', 'Сравни цените на техниката в България и Европа.'],
  search: ['Търсачка', 'Намери конкретна машина във всички сайтове наведнъж.'],
  news:   ['Новини от бранша', 'Инфраструктура, икономика, енергетика и техника.'],
  know:   ['Ноу-хау', 'Практични насоки за избор, проверка и поддръжка.'],
  fav:    ['Демопарк', 'Машините, които харесваш — на едно място.'],
  set:    ['Настройки', 'Ключови думи, известия и сайтове.'],
  deals:  ['Ловец на сделки', 'Машини под пазарната цена — купи, препродай или свържи с клиент.'],
  post:   ['Публикувай обява', 'Една обява — всички сайтове, на езика на всеки.'],
  seller: ['Виртуален продавач', 'Колко струва машината? Ориентировъчна оценка за минута.'],
  show:   ['Виртуален шоурум', 'Подбрано и проверено от Claude — от потребители и от пазара.'],
  src:    ['Всички източници', 'Пазари, производители, търгове и лизинг на едно място.']
};
function show(v) {
  S.view = v;
  $$('.view').forEach(x => x.classList.toggle('on', x.id === 'v-' + v));
  $$('nav.bottom button').forEach(b => b.classList.toggle('on', b.dataset.go === v));
  $$('.ditem').forEach(b => b.classList.toggle('on', b.dataset.go === v && !b.dataset.type && !b.dataset.ncat));
  $('#heroTitle').textContent = HERO[v][0]; $('#heroSub').innerHTML = esc(HERO[v][1]).replace(/\n/g, '<br>');
  $('.stats').style.display = v === 'feed' ? '' : 'none';
  if (v === 'market') renderMarket();
  if (v === 'news') renderNews();
  if (v === 'know') renderKnow();
  if (v === 'fav') renderFavs();
  if (v === 'set') renderSettings();
  if (v === 'src') renderSources();
  if (v === 'show') renderShow();
  if (v === 'deals') renderDeals();
  if (v === 'seller') { vsBuild(); renderOps(); pollOps(false).then(renderOps); }
  if (v === 'post' && window.renderPost) renderPost();
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
  else if (d.dk) { S.dk = d.dk; $$('#dealSeg button').forEach(x => x.classList.toggle('on', x === b)); renderDeals(); }
  else if (d.dshare) shareDeal(d.dshare);
  else if (d.sk) { S.sk = d.sk; $$('#showSeg button').forEach(x => x.classList.toggle('on', x === b)); renderShow(); }
  else if (d.cdel != null) { S.custom.splice(+d.cdel, 1); save(); renderSources(); }
  else if (d.kwdel != null) { S.keywords.splice(+d.kwdel, 1); save(); renderSettings(); renderStats(); }
  else if (d.th != null) { S.theme = d.th; applyTheme(); save(); }
  else if (d.fav) {
    e.preventDefault();
    const it = S.items.find(i => i.id === d.fav) || S.liveCache?.[d.fav] || S.favs[d.fav];
    if (S.favs[d.fav]) { delete S.favs[d.fav]; toast('Махната от Демопарк'); }
    else if (it) { const { _cat, _cc, _eur, _brand, ...raw } = it; S.favs[d.fav] = { ...raw, savedAt: Date.now() }; toast('★ Добавена в Демопарк'); }
    save(); $$(`[data-fav="${CSS.escape(d.fav)}"]`).forEach(x => x.classList.toggle('on', !!S.favs[d.fav]));
    if (S.view === 'fav') renderFavs();
  }
});
$('#addShow').onclick = openShowForm;
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
$('#alarmOn').onchange = e => { S.alarmOn = e.target.checked; save(); };
$('#voiceOn').onchange = e => { S.voiceOn = e.target.checked; save(); };
$('#alarmTest').onclick = () => { const it = live().find(i => ALARM_RX.test(i.title)) || { id: 'test', title: 'Hidromek HMK 102B Alpha — пробна аларма', price: '€45 000', source: 'bazar', type: 'sale', url: '#', date: new Date().toISOString() }; alarmQueue.push(it); showAlarm(); };
$('#notifKw').onchange = e => { S.notifKw = e.target.checked; save(); renderStats(); };
$('#notifWanted').onchange = e => { S.notifWanted = e.target.checked; save(); renderStats(); };
$('#srcSet').onchange = e => { const k = e.target.dataset.srcset; if (!k) return; S.disabled = e.target.checked ? S.disabled.filter(x => x !== k) : [...S.disabled, k]; save(); renderFeed(); };
$('#kwForm').onsubmit = e => { e.preventDefault(); const v = $('#kwIn').value.trim(); if (v && !S.keywords.some(k => norm(k) === norm(v))) { S.keywords.push(v); save(); renderSettings(); renderStats(); toast(`„${v}“ е добавена`); } $('#kwIn').value = ''; };
$('#sForm').onsubmit = e => { e.preventDefault(); $('#sQ').blur(); doSearch($('#sQ').value); };
['#sPmin', '#sPmax', '#sYmin', '#sSort'].forEach(id => $(id).addEventListener('change', () => doSearch($('#sQ').value)));
$('#liveSave').onclick = () => { S.liveUrl = $('#liveUrl').value.trim(); save(); toast('Запазено'); };
$('#notifBtn').onclick = async () => {
  if (!('Notification' in window)) return toast('Устройството не поддържа известия тук');
  const p = await Notification.requestPermission();
  if (p === 'granted') { await registerSW(); (await navigator.serviceWorker.ready).showNotification('ECOBenchmark', { body: 'Известията са включени. Ще те алармираме при нова обява.', icon: 'icons/icon-192-eb3.png' }); }
  renderSettings();
};
new IntersectionObserver(([en]) => $('#toolbar').classList.toggle('stuck', !en.isIntersecting), { threshold: 0 }).observe($('#bdots'));

// ---------- Данни ----------
async function load(silent) {
  try {
    const [r1, r2, r3, r4, r5] = await Promise.allSettled([fetch('data/listings.json?t=' + Date.now(), { cache: 'no-store' }), fetch('data/news.json?t=' + Date.now(), { cache: 'no-store' }), fetch('data/showroom.json?t=' + Date.now(), { cache: 'no-store' }), fetch('data/turkey.json?t=' + Date.now(), { cache: 'no-store' }), fetch('data/deals.json?t=' + Date.now(), { cache: 'no-store' })]);
    if (r3.status === 'fulfilled' && r3.value.ok) { const j = await r3.value.json(); S.show = j.items || []; S.showUpdated = j.updated; }
    if (r1.status === 'fulfilled' && r1.value.ok) { const j = await r1.value.json(); S.rates = j.rates || {}; S.items = (j.items || []).map(prep); S.updated = j.updated; }
    if (r2.status === 'fulfilled' && r2.value.ok) { const j = await r2.value.json(); S.news = j.items || []; }
    if (r5.status === 'fulfilled' && r5.value.ok) { try { const j = await r5.value.json(); S.deals = (j.items || []).map(x => { cleanTitle(x); return x; }); S.dealMap = Object.fromEntries(S.deals.filter(x => !x.suspicious).map(x => [x.id, x])); S.dealsUpdated = j.updated; } catch {} }
    if (r4.status === 'fulfilled' && r4.value.ok) { try { const j = await r4.value.json(); const have = new Set(S.items.map(i => i.id)); S.items.push(...(j.items || []).filter(i => !have.has(i.id)).map(prep)); } catch {} }
  } catch {}
  renderBanners(); renderFeed();
  if (S.view !== 'feed' && !silent) show(S.view);
  else if (S.view === 'market') renderMarket();
  else if (S.view === 'show') renderShow();
  else if (S.view === 'deals') renderDeals();
  const dd = $('#dDeals'); if (dd) dd.textContent = S.deals.filter(x => !x.suspicious && x.conf !== 'ниска').length || '€';
  notifyNew();
  checkAlarm();
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
      body: `${it.title}${it.price ? '\n' + it.price : ''}`, icon: 'icons/icon-192-eb3.png', badge: 'icons/badge-96-eb3.png',
      image: it.photo || undefined, tag: it.id, data: { url: it.url }, vibrate: [200, 100, 200]
    });
  }
  if (fresh.length > 5) reg?.showNotification(`Още ${fresh.length - 5} нови обяви`, { icon: 'icons/icon-192-eb3.png', tag: 'more', data: { url: './' } });
}
async function syncPrefsToSW() {
  try { const c = await caches.open('sr-prefs'); await c.put('prefs', new Response(JSON.stringify({ keywords: S.keywords, notifKw: S.notifKw, notifWanted: S.notifWanted, disabled: S.disabled, ack: S.ack, notified: S.notified.slice(-800) }))); } catch {}
}
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
    reg.update().catch(() => {});
    // нова версия → презареди веднъж
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
    if ('periodicSync' in reg) { try { const st = await navigator.permissions.query({ name: 'periodic-background-sync' }); if (st.state === 'granted') await reg.periodicSync.register('check-listings', { minInterval: 30 * 60 * 1000 }); } catch {} }
    navigator.serviceWorker.addEventListener('message', e => { if (e.data?.notified) { S.notified = [...new Set([...S.notified, ...e.data.notified])]; store.set('notified', S.notified.slice(-800)); } });
  } catch {}
}
function applyTheme() { if (S.theme) document.documentElement.dataset.theme = S.theme; else delete document.documentElement.dataset.theme; }
document.addEventListener('visibilitychange', () => { if (document.hidden && !S.newOnly) { S.ack = Date.now(); save(); } else if (!document.hidden) load(true); });

applyTheme();
registerSW();

const v0 = new URLSearchParams(location.search).get('v');
load().then(() => { pollOps(true); if (v0 && HERO[v0]) show(v0); setTimeout(() => $('#splash').classList.add('out'), 500); });
setInterval(() => load(true), 5 * 60 * 1000);

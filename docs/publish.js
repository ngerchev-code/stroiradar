// ECOBenchmark — „Публикувай обява“: една форма → готов пакет за всеки сайт
// (текст на езика на сайта, цена във валутата на страната, обработени снимки) + публикуване с Claude.
(function () {
  const PUB_TOPIC = 'bb-pub-7d41c9e2a5';
  const LANGS = { bg: 'Български', en: 'English', de: 'Deutsch', tr: 'Türkçe', ro: 'Română', pl: 'Polski', it: 'Italiano', fr: 'Français', es: 'Español', sr: 'Srpski' };
  const CUR = { EUR: ['€', 1, 100], TRY: ['TL', 0, 5000], RON: ['RON', 0, 100], PLN: ['zł', 0, 100], RSD: ['RSD', 0, 1000] };
  // Сайтове, от които събираме данни → език, валута, начална страница
  const PUB_SITES = {
    mobilebg:        { lang: 'bg', cur: 'EUR', home: 'https://www.mobile.bg/' },
    bazar:           { lang: 'bg', cur: 'EUR', home: 'https://bazar.bg/' },
    olx:             { lang: 'bg', cur: 'EUR', home: 'https://www.olx.bg/' },
    machineseeker:   { lang: 'en', cur: 'EUR', home: 'https://www.machineseeker.com/', note: 'Обикновено изисква търговски (дилърски) профил.' },
    mascus:          { lang: 'en', cur: 'EUR', home: 'https://www.mascus.bg/', note: 'Обикновено изисква търговски (дилърски) профил.' },
    machineryline:   { lang: 'en', cur: 'EUR', home: 'https://machineryline.bg/', note: 'Обикновено изисква търговски (дилърски) профил.' },
    autoline:        { lang: 'en', cur: 'EUR', home: 'https://autoline.bg/', note: 'Обикновено изисква търговски (дилърски) профил.' },
    truck1:          { lang: 'en', cur: 'EUR', home: 'https://www.truck1.eu/', note: 'Обикновено изисква търговски (дилърски) профил.' },
    machinio:        { lang: 'en', cur: 'EUR', home: 'https://www.machinio.com/', note: 'Обикновено изисква търговски (дилърски) профил.' },
    machinerytrader: { lang: 'en', cur: 'EUR', home: 'https://www.machinerytrader.eu/', note: 'Обикновено изисква търговски (дилърски) профил.' },
    kleinanzeigen:   { lang: 'de', cur: 'EUR', home: 'https://www.kleinanzeigen.de/', note: 'Германски сайт — купувачите очакват ясно посочен транспорт до Германия.' },
    mobilede:        { lang: 'de', cur: 'EUR', home: 'https://www.mobile.de/', note: 'Обикновено изисква търговски профил.' },
    truckscout24:    { lang: 'de', cur: 'EUR', home: 'https://www.truckscout24.de/', note: 'Обикновено изисква търговски профил.' },
    arabam:          { lang: 'tr', cur: 'TRY', home: 'https://www.arabam.com/', note: 'Обикновено изисква турски мобилен номер за потвърждение.' },
    sahibinden:      { lang: 'tr', cur: 'TRY', home: 'https://www.sahibinden.com/', note: 'Обикновено изисква турски мобилен номер за потвърждение.' },
    olxro:           { lang: 'ro', cur: 'RON', home: 'https://www.olx.ro/' },
    autovit:         { lang: 'ro', cur: 'RON', home: 'https://www.autovit.ro/' },
    olxpl:           { lang: 'pl', cur: 'PLN', home: 'https://www.olx.pl/' },
    otomoto:         { lang: 'pl', cur: 'PLN', home: 'https://www.otomoto.pl/' },
    allegro:         { lang: 'pl', cur: 'PLN', home: 'https://allegro.pl/', note: 'Обявите обикновено са платени.' },
    kupujemprodajem: { lang: 'sr', cur: 'RSD', home: 'https://www.kupujemprodajem.com/' },
    polovnemasine:   { lang: 'sr', cur: 'RSD', home: 'https://www.polovnemasine.com/' },
    subito:          { lang: 'it', cur: 'EUR', home: 'https://www.subito.it/' },
    leboncoin:       { lang: 'fr', cur: 'EUR', home: 'https://www.leboncoin.fr/deposer-une-annonce' },
    milanuncios:     { lang: 'es', cur: 'EUR', home: 'https://www.milanuncios.com/' }
  };

  // ---- Речник (фиксирани преводи — без машинен превод, без измислици) ----
  const CAT_T = {
    minibackhoe: { bg: 'Мини комбиниран багер', en: 'Mini backhoe loader', de: 'Minibaggerlader', tr: 'Mini beko loder', ro: 'Mini buldoexcavator', pl: 'Mini koparko-ładowarka', it: 'Mini terna', fr: 'Mini tractopelle', es: 'Mini retrocargadora', sr: 'Mini kombinirka' },
    backhoe:     { bg: 'Комбиниран багер', en: 'Backhoe loader', de: 'Baggerlader', tr: 'Beko loder', ro: 'Buldoexcavator', pl: 'Koparko-ładowarka', it: 'Terna', fr: 'Tractopelle', es: 'Retrocargadora', sr: 'Kombinirka (rovokopač-utovarivač)' },
    telehandler: { bg: 'Телескопичен товарач', en: 'Telehandler', de: 'Teleskoplader', tr: 'Teleskopik yükleyici', ro: 'Încărcător telescopic', pl: 'Ładowarka teleskopowa', it: 'Sollevatore telescopico', fr: 'Chariot télescopique', es: 'Manipulador telescópico', sr: 'Teleskopski utovarivač' },
    minicl:      { bg: 'Мини челен товарач', en: 'Skid steer loader', de: 'Kompaktlader', tr: 'Mini yükleyici', ro: 'Miniîncărcător', pl: 'Miniładowarka', it: 'Minipala', fr: 'Chargeuse compacte', es: 'Minicargadora', sr: 'Mini utovarivač' },
    midi:        { bg: 'Миди багер', en: 'Midi excavator', de: 'Midibagger', tr: 'Midi ekskavatör', ro: 'Midi excavator', pl: 'Midikoparka', it: 'Midiescavatore', fr: 'Midipelle', es: 'Midiexcavadora', sr: 'Midi bager' },
    mini:        { bg: 'Мини багер', en: 'Mini excavator', de: 'Minibagger', tr: 'Mini ekskavatör', ro: 'Miniexcavator', pl: 'Minikoparka', it: 'Miniescavatore', fr: 'Minipelle', es: 'Miniexcavadora', sr: 'Mini bager' },
    crawler:     { bg: 'Верижен багер', en: 'Crawler excavator', de: 'Kettenbagger', tr: 'Paletli ekskavatör', ro: 'Excavator pe șenile', pl: 'Koparka gąsienicowa', it: 'Escavatore cingolato', fr: 'Pelle sur chenilles', es: 'Excavadora de cadenas', sr: 'Bager guseničar' },
    dozer:       { bg: 'Булдозер', en: 'Bulldozer', de: 'Planierraupe', tr: 'Dozer', ro: 'Buldozer', pl: 'Spycharka', it: 'Apripista', fr: 'Bulldozer', es: 'Bulldozer', sr: 'Buldožer' },
    excavator:   { bg: 'Колесен багер', en: 'Wheeled excavator', de: 'Mobilbagger', tr: 'Lastikli ekskavatör', ro: 'Excavator pe roți', pl: 'Koparka kołowa', it: 'Escavatore gommato', fr: 'Pelle sur pneus', es: 'Excavadora de ruedas', sr: 'Bager točkaš' },
    loader:      { bg: 'Челен товарач', en: 'Wheel loader', de: 'Radlader', tr: 'Lastikli yükleyici', ro: 'Încărcător frontal', pl: 'Ładowarka kołowa', it: 'Pala gommata', fr: 'Chargeuse sur pneus', es: 'Pala cargadora', sr: 'Utovarivač točkaš' },
    tipper:      { bg: 'Самосвал', en: 'Tipper truck', de: 'Kipper', tr: 'Damperli kamyon', ro: 'Basculantă', pl: 'Wywrotka', it: 'Autocarro ribaltabile', fr: 'Camion benne', es: 'Camión volquete', sr: 'Kiper' },
    garbage:     { bg: 'Сметосъбиращ камион', en: 'Refuse collection truck', de: 'Müllfahrzeug', tr: 'Çöp kamyonu', ro: 'Autogunoieră', pl: 'Śmieciarka', it: 'Autocompattatore rifiuti', fr: 'Benne à ordures', es: 'Camión recolector de basura', sr: 'Kamion za odvoz smeća' },
    aerial:      { bg: 'Вишка', en: 'Aerial work platform', de: 'Hubarbeitsbühne', tr: 'Personel yükseltici platform', ro: 'Platformă de lucru la înălțime', pl: 'Podest ruchomy', it: 'Piattaforma aerea', fr: 'Nacelle élévatrice', es: 'Plataforma elevadora', sr: 'Radna platforma' },
    asphaltrec:  { bg: 'Рециклатор за асфалт', en: 'Asphalt recycler', de: 'Asphaltrecycler', tr: 'Asfalt geri dönüşüm makinesi', ro: 'Reciclator de asfalt', pl: 'Recykler asfaltu', it: "Riciclatore d'asfalto", fr: "Recycleur d'enrobés", es: 'Recicladora de asfalto', sr: 'Reciklator asfalta' },
    attach:      { bg: 'Прикачен инвентар', en: 'Attachment', de: 'Anbaugerät', tr: 'Ataşman', ro: 'Accesoriu', pl: 'Osprzęt', it: 'Attrezzatura', fr: 'Accessoire', es: 'Implemento', sr: 'Priključak' },
    breaker:     { bg: 'Хидравличен чук', en: 'Hydraulic breaker', de: 'Hydraulikhammer', tr: 'Hidrolik kırıcı', ro: 'Ciocan hidraulic', pl: 'Młot hydrauliczny', it: 'Martello demolitore idraulico', fr: 'Brise-roche hydraulique', es: 'Martillo hidráulico', sr: 'Hidraulični čekić' },
    mulcher:     { bg: 'Мулчер', en: 'Mulcher', de: 'Mulcher', tr: 'Mulçer', ro: 'Mulcher', pl: 'Mulczer', it: 'Trinciatrice', fr: 'Broyeur forestier', es: 'Trituradora forestal', sr: 'Malčer' },
    roller:      { bg: 'Валяк', en: 'Road roller', de: 'Walze', tr: 'Silindir', ro: 'Cilindru compactor', pl: 'Walec drogowy', it: 'Rullo compattatore', fr: 'Rouleau compacteur', es: 'Rodillo compactador', sr: 'Valjak' },
    compaction:  { bg: 'Виброплоча', en: 'Plate compactor', de: 'Rüttelplatte', tr: 'Vibrasyonlu kompaktör', ro: 'Placă compactoare', pl: 'Zagęszczarka płytowa', it: 'Piastra vibrante', fr: 'Plaque vibrante', es: 'Placa vibratoria', sr: 'Vibro ploča' },
    paver:       { bg: 'Асфалтополагач', en: 'Asphalt paver', de: 'Asphaltfertiger', tr: 'Asfalt finişeri', ro: 'Repartizor de asfalt', pl: 'Rozściełacz asfaltu', it: 'Vibrofinitrice', fr: 'Finisseur', es: 'Extendedora de asfalto', sr: 'Finišer za asfalt' },
    crusher:     { bg: 'Трошачка / сито', en: 'Crusher / screener', de: 'Brecher / Siebanlage', tr: 'Kırıcı / elek', ro: 'Concasor / ciur', pl: 'Kruszarka / przesiewacz', it: 'Frantoio / vaglio', fr: 'Concasseur / crible', es: 'Trituradora / criba', sr: 'Drobilica / sito' },
    drilling:    { bg: 'Безизкопна техника', en: 'Trenchless equipment', de: 'Grabenlose Technik', tr: 'Kazısız teknoloji ekipmanı', ro: 'Echipament de foraj fără săpătură', pl: 'Sprzęt do przewiertów bezwykopowych', it: 'Attrezzatura no-dig', fr: 'Matériel de forage sans tranchée', es: 'Equipo de perforación sin zanja', sr: 'Oprema za bušenje bez kopanja' },
    generator:   { bg: 'Генератор', en: 'Generator', de: 'Stromerzeuger', tr: 'Jeneratör', ro: 'Generator', pl: 'Agregat prądotwórczy', it: 'Generatore', fr: 'Groupe électrogène', es: 'Generador', sr: 'Agregat' },
    compressor:  { bg: 'Компресор', en: 'Compressor', de: 'Kompressor', tr: 'Kompresör', ro: 'Compresor', pl: 'Sprężarka', it: 'Compressore', fr: 'Compresseur', es: 'Compresor', sr: 'Kompresor' }
  };
  const L = {
    year:   { bg: 'Година', en: 'Year', de: 'Baujahr', tr: 'Model yılı', ro: 'An fabricație', pl: 'Rok produkcji', it: 'Anno', fr: 'Année', es: 'Año', sr: 'Godište' },
    hours:  { bg: 'Моточасове', en: 'Operating hours', de: 'Betriebsstunden', tr: 'Çalışma saati', ro: 'Ore de funcționare', pl: 'Motogodziny', it: 'Ore di lavoro', fr: 'Heures', es: 'Horas de trabajo', sr: 'Radni sati' },
    h:      { bg: 'мч', en: 'h', de: 'Bh', tr: 'saat', ro: 'ore', pl: 'mth', it: 'ore', fr: 'h', es: 'h', sr: 'h' },
    cond:   { bg: 'Състояние', en: 'Condition', de: 'Zustand', tr: 'Durum', ro: 'Stare', pl: 'Stan', it: 'Condizioni', fr: 'État', es: 'Estado', sr: 'Stanje' },
    conds:  { bg: ['Отлично', 'Добро', 'Средно', 'За ремонт'], en: ['Excellent', 'Good', 'Fair', 'Needs repair'], de: ['Sehr gut', 'Gut', 'Befriedigend', 'Reparaturbedürftig'], tr: ['Çok iyi', 'İyi', 'Orta', 'Tamir gerektirir'], ro: ['Excelentă', 'Bună', 'Medie', 'Necesită reparații'], pl: ['Bardzo dobry', 'Dobry', 'Średni', 'Do naprawy'], it: ['Ottime', 'Buone', 'Discrete', 'Da riparare'], fr: ['Excellent', 'Bon', 'Moyen', 'À réparer'], es: ['Excelente', 'Bueno', 'Regular', 'Para reparar'], sr: ['Odlično', 'Dobro', 'Srednje', 'Za popravku'] },
    equip:  { bg: 'Оборудване', en: 'Equipment', de: 'Ausstattung', tr: 'Donanım', ro: 'Dotări', pl: 'Wyposażenie', it: 'Dotazioni', fr: 'Équipements', es: 'Equipamiento', sr: 'Oprema' },
    att:    { bg: 'Инвентар', en: 'Attachments', de: 'Anbaugeräte', tr: 'Ataşmanlar', ro: 'Accesorii', pl: 'Osprzęt', it: 'Attrezzature', fr: 'Accessoires', es: 'Implementos', sr: 'Priključci' },
    price:  { bg: 'Цена', en: 'Price', de: 'Preis', tr: 'Fiyat', ro: 'Preț', pl: 'Cena', it: 'Prezzo', fr: 'Prix', es: 'Precio', sr: 'Cena' },
    vat:    { bg: 'без ДДС', en: 'excl. VAT', de: 'zzgl. MwSt.', tr: '+ KDV', ro: '+ TVA', pl: 'netto', it: '+ IVA', fr: 'HT', es: '+ IVA', sr: '+ PDV' },
    neg:    { bg: 'по договаряне', en: 'negotiable', de: 'VB', tr: 'pazarlık payı var', ro: 'negociabil', pl: 'do negocjacji', it: 'trattabile', fr: 'négociable', es: 'negociable', sr: 'po dogovoru' },
    loc:    { bg: 'Местоположение', en: 'Location', de: 'Standort', tr: 'Konum', ro: 'Locație', pl: 'Lokalizacja', it: 'Ubicazione', fr: 'Localisation', es: 'Ubicación', sr: 'Lokacija' },
    country:{ bg: 'България', en: 'Bulgaria', de: 'Bulgarien', tr: 'Bulgaristan', ro: 'Bulgaria', pl: 'Bułgaria', it: 'Bulgaria', fr: 'Bulgarie', es: 'Bulgaria', sr: 'Bugarska' },
    contact:{ bg: 'Контакт', en: 'Contact', de: 'Kontakt', tr: 'İletişim', ro: 'Contact', pl: 'Kontakt', it: 'Contatti', fr: 'Contact', es: 'Contacto', sr: 'Kontakt' },
    insp:   { bg: 'Огледът е възможен след уговорка.', en: 'Inspection possible by appointment.', de: 'Besichtigung nach Absprache möglich.', tr: 'Randevu ile yerinde görülebilir.', ro: 'Vizionare posibilă cu programare.', pl: 'Oględziny po wcześniejszym umówieniu.', it: 'Visionabile su appuntamento.', fr: 'Visite possible sur rendez-vous.', es: 'Se puede ver con cita previa.', sr: 'Pregled moguć uz dogovor.' },
    trans:  { bg: 'Възможна организация на транспорт.', en: 'Transport can be arranged.', de: 'Transport kann organisiert werden.', tr: 'Nakliye organize edilebilir.', ro: 'Transportul poate fi organizat.', pl: 'Możliwa organizacja transportu.', it: 'Possibilità di organizzare il trasporto.', fr: 'Transport possible sur demande.', es: 'Se puede organizar el transporte.', sr: 'Moguća organizacija transporta.' },
    speak:  { en: 'We speak English and Bulgarian.', de: 'Wir sprechen Englisch und Bulgarisch.', tr: 'İngilizce ve Bulgarca iletişim kurabiliriz.', ro: 'Comunicare în engleză și bulgară.', pl: 'Kontakt po angielsku i bułgarsku.', it: 'Parliamo inglese e bulgaro.', fr: 'Nous parlons anglais et bulgare.', es: 'Hablamos inglés y búlgaro.', sr: 'Govorimo engleski i bugarski.' }
  };
  const EX_T = {
    en: ['Air conditioning', 'Hydraulic quick coupler', 'Hammer line', '4x4 / 4-wheel steering', 'Extendable dipper', 'New tyres / tracks', '4-in-1 front bucket', 'GPS / telematics', 'Full service history', 'One owner', 'Documents / CE / registration'],
    de: ['Klimaanlage', 'Hydraulischer Schnellwechsler', 'Hammerleitung', 'Allrad / Allradlenkung', 'Teleskopstiel', 'Neue Reifen / Ketten', '4-in-1 Klappschaufel', 'GPS / Telematik', 'Lückenlose Wartungshistorie', 'Aus erster Hand', 'Papiere / CE / Zulassung'],
    tr: ['Klima', 'Hidrolik hızlı bağlantı', 'Kırıcı hattı', '4x4 / 4 tekerden yönlendirme', 'Teleskopik kol', 'Yeni lastikler / paletler', '4x1 açılır kova', 'GPS / telematik', 'Tam servis geçmişi', 'Tek sahip', 'Belgeler / CE / ruhsat'],
    ro: ['Aer condiționat', 'Cuplă rapidă hidraulică', 'Instalație ciocan', '4x4 / 4 roți directoare', 'Braț telescopic', 'Anvelope / șenile noi', 'Cupă 4 în 1', 'GPS / telematică', 'Istoric complet de service', 'Un singur proprietar', 'Acte / CE / înmatriculare'],
    pl: ['Klimatyzacja', 'Hydrauliczne szybkozłącze', 'Instalacja pod młot', '4x4 / 4 koła skrętne', 'Teleskopowe ramię', 'Nowe opony / gąsienice', 'Łyżka 4w1', 'GPS / telematyka', 'Pełna historia serwisowa', 'Jeden właściciel', 'Dokumenty / CE / rejestracja'],
    it: ['Aria condizionata', 'Attacco rapido idraulico', 'Linea martello', '4x4 / 4 ruote sterzanti', 'Braccio telescopico', 'Pneumatici / cingoli nuovi', 'Benna 4 in 1', 'GPS / telematica', 'Storico manutenzione completo', 'Unico proprietario', 'Documenti / CE / immatricolazione'],
    fr: ['Climatisation', 'Attache rapide hydraulique', 'Circuit BRH', '4x4 / 4 roues directrices', 'Balancier télescopique', 'Pneus / chenilles neufs', 'Godet 4 en 1', 'GPS / télématique', "Historique d'entretien complet", 'Première main', 'Papiers / CE / immatriculation'],
    es: ['Aire acondicionado', 'Enganche rápido hidráulico', 'Circuito para martillo', '4x4 / 4 ruedas directrices', 'Brazo telescópico', 'Neumáticos / cadenas nuevos', 'Cazo 4 en 1', 'GPS / telemática', 'Historial de mantenimiento completo', 'Único propietario', 'Documentación / CE / matriculación'],
    sr: ['Klima', 'Hidraulična brza spojnica', 'Instalacija za čekić', '4x4 / upravljanje na 4 točka', 'Teleskopska ruka', 'Nove gume / gusenice', 'Kašika 4 u 1', 'GPS / telematika', 'Kompletna servisna istorija', 'Jedan vlasnik', 'Dokumenta / CE / registracija']
  };
  const AT_T = {
    en: ['Extra bucket', 'Ditch cleaning bucket', 'Hydraulic breaker', 'Auger', 'Pallet forks', 'Mulcher', 'Sweeper', 'Ripper', 'Grapple'],
    de: ['Zusätzlicher Löffel', 'Grabenräumlöffel', 'Hydraulikhammer', 'Erdbohrer', 'Palettengabel', 'Mulcher', 'Kehrbesen', 'Reißzahn', 'Greifer'],
    tr: ['Ek kova', 'Kanal temizleme kovası', 'Hidrolik kırıcı', 'Burgu', 'Palet çatalı', 'Mulçer', 'Süpürge ataşmanı', 'Riper', 'Kıskaç'],
    ro: ['Cupă suplimentară', 'Cupă de taluz', 'Ciocan hidraulic', 'Burghiu pentru pământ', 'Furci paleți', 'Mulcher', 'Mătură', 'Ripper', 'Graifer'],
    pl: ['Dodatkowa łyżka', 'Łyżka skarpowa', 'Młot hydrauliczny', 'Świder', 'Widły do palet', 'Mulczer', 'Zamiatarka', 'Zrywak', 'Chwytak'],
    it: ['Benna aggiuntiva', 'Benna pulizia fossi', 'Martello demolitore', 'Trivella', 'Forche pallet', 'Trinciatrice', 'Spazzatrice', 'Ripper', 'Pinza'],
    fr: ['Godet supplémentaire', 'Godet de curage', 'Brise-roche hydraulique', 'Tarière', 'Fourches à palettes', 'Broyeur forestier', 'Balayeuse', 'Dent de déroctage', 'Grappin'],
    es: ['Cazo adicional', 'Cazo de limpieza de cunetas', 'Martillo hidráulico', 'Barrena', 'Horquillas porta-palés', 'Trituradora forestal', 'Barredora', 'Ripper', 'Pinza'],
    sr: ['Dodatna kašika', 'Kašika za kanale', 'Hidraulični čekić', 'Burgija', 'Viljuške za palete', 'Malčer', 'Četka (čistilica)', 'Riper', 'Grajfer']
  };
  const exName = (i, lang) => lang === 'bg' ? EXTRAS[i][0] : EX_T[lang][i];
  const atName = (i, lang) => lang === 'bg' ? ATTACH[i][0] : AT_T[lang][i];

  // ---- Цена във валутата на страната ----
  function localPrice(eur, cur, lang) {
    const [sym, , step] = CUR[cur];
    const rate = cur === 'EUR' ? 1 : S.rates?.[cur];
    if (!rate) return { text: `${fmtN(eur, lang)} €`, approx: false, eurOnly: cur !== 'EUR' };
    const v = Math.round(eur * rate / step) * step;
    return { text: cur === 'EUR' ? `${fmtN(v, lang)} €` : `${fmtN(v, lang)} ${sym}`, value: v, approx: cur !== 'EUR', eur };
  }
  const NUMLOC = { bg: 'bg-BG', en: 'en-GB', de: 'de-DE', tr: 'tr-TR', ro: 'ro-RO', pl: 'pl-PL', it: 'it-IT', fr: 'fr-FR', es: 'es-ES', sr: 'sr-Latn-RS' };
  const fmtN = (n, lang) => Math.round(n).toLocaleString(NUMLOC[lang] || 'en-GB');

  // Официална транслитерация (Закон за транслитерацията) — за чуждите сайтове: „Русе“ → „Ruse“
  const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya' };
  const latin = t => String(t || '').replace(/[а-яА-Я]/g, c => { const l = TR[c.toLowerCase()] ?? c; return c === c.toLowerCase() ? l : l.charAt(0).toUpperCase() + l.slice(1); });

  // ---- Пакет за конкретен сайт ----
  function build(p, key) {
    const s = PUB_SITES[key], lang = s.lang, cat = (CAT_T[p.cat] || {})[lang] || '';
    if (lang !== 'bg') p = { ...p, brand: latin(p.brand), model: latin(p.model), city: latin(p.city), name: latin(p.name) };
    const name = `${p.brand} ${p.model}`.trim(), catS = cat.replace(/\s*\(.*\)/, '');
    let title = `${catS} ${name}, ${p.year}, ${fmtN(p.hours, lang)} ${L.h[lang]}`;
    if (title.length > 70) title = `${name}, ${p.year}, ${fmtN(p.hours, lang)} ${L.h[lang]}`;
    if (title.length > 70) title = `${name} ${p.year}`.slice(0, 70);
    const pr = localPrice(p.price, s.cur, lang);
    const lines = [`${name} — ${cat}`, '',
      `${L.year[lang]}: ${p.year}`, `${L.hours[lang]}: ${fmtN(p.hours, lang)}`, `${L.cond[lang]}: ${L.conds[lang][p.cond]}`];
    if (p.ex.length) lines.push(`${L.equip[lang]}: ${p.ex.map(i => exName(i, lang)).join(', ')}`);
    if (p.at.length) lines.push(`${L.att[lang]}: ${p.at.map(i => atName(i, lang)).join(', ')}`);
    lines.push(`${L.price[lang]}: ${pr.text} ${L.vat[lang]}${pr.approx ? ` (${fmtN(p.price, lang)} €)` : ''}${p.neg ? ', ' + L.neg[lang] : ''}`);
    lines.push(`${L.loc[lang]}: ${p.city ? p.city + ', ' : ''}${L.country[lang]}`, '');
    if (p.notes && lang === 'bg') lines.push(p.notes, '');
    lines.push(L.insp[lang], L.trans[lang]);
    if (lang !== 'bg') lines.push(L.speak[lang]);
    const c = [p.name, p.phone, p.email].filter(Boolean).join(' · ');
    if (c) lines.push('', `${L.contact[lang]}: ${c}`);
    return { key, lang, cur: s.cur, title, desc: lines.join('\n'), price: pr, notesPending: !!(p.notes && lang !== 'bg') };
  }

  // ---- Снимки: до 1600 px, JPEG 85%, без EXIF (махат се GPS координатите), именувани за сайта ----
  let photos = [];   // { file, url }
  async function prep(file) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
      return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    } catch { return null; }
  }
  const slugify = s => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\wА-я]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  const photoName = (p, key, i) => `${slugify(p.brand + '-' + p.model + '-' + p.year)}-${key}-${String(i + 1).padStart(2, '0')}.jpg`;

  // ---- Форма ----
  const $ = s => document.querySelector(s);
  const POST_CATS = Object.keys(CAT_T);
  function form() {
    const fd = new FormData($('#pbForm'));
    return { cat: fd.get('cat'), brand: (fd.get('brand') || '').trim(), model: (fd.get('model') || '').trim(), year: +fd.get('year'), hours: +fd.get('hours') || 0,
      cond: +fd.get('cond') || 0, ex: fd.getAll('ex').map(Number), at: fd.getAll('at').map(Number), price: +fd.get('price') || 0, neg: !!fd.get('neg'),
      city: (fd.get('city') || '').trim(), name: (fd.get('name') || '').trim(), phone: (fd.get('phone') || '').trim(), email: (fd.get('email') || '').trim(),
      notes: (fd.get('notes') || '').trim().slice(0, 3000), sites: fd.getAll('site') };
  }
  function renderForm() {
    if ($('#pbCat').options.length) return;
    $('#pbCat').innerHTML = POST_CATS.map(k => `<option value="${k}">${esc(CAT_T[k].bg)}</option>`).join('');
    $('#pbCond').innerHTML = L.conds.bg.map((c, i) => `<label><input type="radio" name="cond" value="${i}" ${i === 1 ? 'checked' : ''}><span class="c${i + 1}">${esc(c)}</span></label>`).join('');
    $('#pbEx').innerHTML = EXTRAS.map((e, i) => `<label><input type="checkbox" name="ex" value="${i}">${esc(e[0])}</label>`).join('');
    $('#pbAt').innerHTML = ATTACH.map((a, i) => `<label><input type="checkbox" name="at" value="${i}">${esc(a[0])}</label>`).join('');
    const groups = {};
    for (const [k, s] of Object.entries(PUB_SITES)) { const src = SOURCES[k]; if (!src) continue; (groups[s.lang] ||= []).push(`<label><input type="checkbox" name="site" value="${k}" checked>${src.flag} ${esc(src.name)}</label>`); }
    $('#pbSites').innerHTML = Object.entries(groups).map(([l, h]) => `<div class="pb-lang"><small>${esc(LANGS[l])}</small><div class="chips2">${h.join('')}</div></div>`).join('');
    const me = store.get('pbContact', {}); for (const k of ['name', 'phone', 'email', 'city']) if (me[k]) $('#pbForm').elements[k].value = me[k];
  }
  function renderPhotos() {
    $('#pbPhotos').innerHTML = photos.map((ph, i) => `<div class="fi" style="background-image:url('${ph.url}')">${i === 0 ? '<em>Основна</em>' : ''}<button type="button" data-rmp="${i}">✕</button>${i ? `<button type="button" class="mv" data-first="${i}">★</button>` : ''}</div>`).join('');
  }
  $('#pbFiles').onchange = async e => {
    for (const f of [...e.target.files]) { if (photos.length >= 20) { toast('До 20 снимки'); break; } if (!f.type.startsWith('image/')) continue; const x = await prep(f); if (x) photos.push({ file: x, url: URL.createObjectURL(x) }); }
    e.target.value = ''; renderPhotos();
  };
  $('#pbPhotos').onclick = e => {
    const r = e.target.closest('[data-rmp]'), m = e.target.closest('[data-first]');
    if (r) photos.splice(+r.dataset.rmp, 1);
    if (m) photos.unshift(...photos.splice(+m.dataset.first, 1));
    renderPhotos();
  };

  let last = null;
  $('#pbForm').onsubmit = e => {
    e.preventDefault();
    const p = form();
    if (!p.brand || !p.year || !p.price) return toast('Попълни марка, година и цена');
    if (!p.sites.length) return toast('Избери поне един сайт');
    if (!photos.length) return toast('Добави поне една снимка — обяви без снимки не продават');
    store.set('pbContact', { name: p.name, phone: p.phone, email: p.email, city: p.city });
    const packs = p.sites.map(k => build(p, k));
    last = { p, packs };
    renderPacks();
  };
  function renderPacks() {
    const { p, packs } = last;
    $('#pbOut').innerHTML = `<div class="sec"><h2>Готови обяви (${packs.length})</h2><p class="sub">Всяка е на езика на сайта, с цената във валутата на страната. Копирай, изтегли снимките и отвори сайта — или натисни „Публикувай с Claude“.</p></div>
      <div class="panel pb-claude"><b>🤖 Публикувай с Claude</b><p class="st">Claude публикува обявите от твоя Chrome, с твоите профили в сайтовете, и превежда бележките. Стъпки, които изискват SMS код, капча или плащане, ще ти покаже да ги потвърдиш.</p><button class="al-btn go" id="pbSend" style="width:100%">Изпрати към Claude · ${packs.length} сайта</button></div>
      ${packs.map(x => { const src = SOURCES[x.key], s = PUB_SITES[x.key]; return `<div class="pb-card" data-k="${x.key}">
        <div class="pb-h"><b>${src.flag} ${esc(src.name)}</b><span>${esc(LANGS[x.lang])} · ${esc(x.price.text)}</span></div>
        ${s.note ? `<div class="note2">⚠️ ${esc(s.note)}</div>` : ''}
        ${x.price.eurOnly ? '<div class="note2">Няма актуален курс — цената е в евро.</div>' : ''}
        ${x.notesPending ? '<div class="note2">Бележките ти са на български — Claude ще ги преведе при публикуване (или ги добави сам).</div>' : ''}
        <div class="pb-t">${esc(x.title)}</div>
        <pre class="pb-d">${esc(x.desc)}</pre>
        <div class="pb-act"><button class="btn" data-cp="title">Копирай заглавие</button><button class="btn" data-cp="desc">Копирай текста</button><button class="btn" data-dl="1">⬇ Снимки (${Math.min(photos.length, 20)})</button><a class="btn primary" href="${s.home}" target="_blank" rel="noopener">Отвори сайта ↗</a></div>
        <div class="pb-st" id="pbst-${x.key}"></div>
      </div>`; }).join('')}`;
    $('#pbOut').scrollIntoView({ behavior: 'smooth' });
    $('#pbSend').onclick = sendToClaude;
  }
  $('#pbOut').addEventListener('click', async e => {
    const card = e.target.closest('.pb-card'); if (!card || !last) return;
    const x = last.packs.find(q => q.key === card.dataset.k);
    const cp = e.target.closest('[data-cp]');
    if (cp) { try { await navigator.clipboard.writeText(cp.dataset.cp === 'title' ? x.title : x.desc); toast('Копирано'); } catch { toast('Копирането не е разрешено'); } }
    if (e.target.closest('[data-dl]')) {
      for (let i = 0; i < photos.length; i++) {
        const a = document.createElement('a'); a.href = photos[i].url; a.download = photoName(last.p, x.key, i); document.body.appendChild(a); a.click(); a.remove();
        await new Promise(r => setTimeout(r, 350));
      }
      toast(`Изтеглени ${photos.length} снимки`);
    }
  });

  // ---- Изпращане към Claude (през ntfy → inbox/publish/<rid>/) ----
  async function sendToClaude() {
    const { p, packs } = last, rid = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const btn = $('#pbSend'); btn.disabled = true; btn.innerHTML = '<span class="spin2"></span>Изпращане…';
    try {
      for (let i = 0; i < photos.length; i++) {
        const res = await fetch(`https://ntfy.sh/${PUB_TOPIC}?filename=${encodeURIComponent(String(i + 1).padStart(2, '0') + '.jpg')}&message=${encodeURIComponent(JSON.stringify({ kind: 'file', rid, i }))}`, { method: 'PUT', body: photos[i].file });
        if (!res.ok) throw new Error('снимка ' + (i + 1));
      }
      const req = { rid, sentAt: new Date().toISOString(), photos: photos.length, listing: p,
        packages: packs.map(x => ({ site: x.key, name: SOURCES[x.key].name, home: PUB_SITES[x.key].home, lang: x.lang, currency: x.cur, title: x.title, description: x.desc, price: x.price, notesToTranslate: x.notesPending ? p.notes : '' })) };
      const blob = new Blob([JSON.stringify(req, null, 1)], { type: 'application/json' });
      const res = await fetch(`https://ntfy.sh/${PUB_TOPIC}?filename=request.json&message=${encodeURIComponent(JSON.stringify({ kind: 'request', rid }))}`, { method: 'PUT', body: blob });
      if (!res.ok) throw new Error('заявка');
      const list = store.get('pubs', []); list.unshift({ rid, title: `${p.brand} ${p.model} ${p.year}`.trim(), sentAt: req.sentAt, sites: packs.map(x => x.key) }); store.set('pubs', list.slice(0, 30));
      toast('Изпратено към Claude');
      renderPubs();
    } catch (err) { toast('Изпращането не успя (' + err.message + ')'); }
    finally { btn.disabled = false; btn.textContent = 'Изпрати отново'; }
  }
  async function renderPubs() {
    const list = store.get('pubs', []);
    if (!list.length) { $('#pbList').innerHTML = '<p class="note">Още няма изпратени обяви.</p>'; return; }
    for (const o of list.filter(o => !o.final)) {
      try { const r = await fetch(`data/published/${o.rid}.json?t=${Date.now()}`, { cache: 'no-store' }); if (r.ok) { o.res = await r.json(); o.final = Object.values(o.res.sites || {}).every(s => s.status !== 'pending'); } } catch {}
    }
    store.set('pubs', list);
    const ST = { published: ['✅', 'публикувана'], pending: ['⏳', 'в процес'], action: ['✋', 'чака твое действие'], failed: ['⚠️', 'неуспешно'], skipped: ['—', 'пропусната'] };
    $('#pbList').innerHTML = list.map(o => `<div class="op ${o.res ? '' : 'wait'}"><h4>${esc(o.title)}</h4>
      <p class="st">${o.res ? 'Обновено ' + ago(o.res.updated) : `<span class="spin2"></span>Чака Claude · изпратено ${ago(o.sentAt)}`}</p>
      <div class="pb-sites">${o.sites.map(k => { const s = o.res?.sites?.[k] || { status: 'pending' }, t = ST[s.status] || ST.pending; return `<div>${t[0]} ${SOURCES[k]?.flag || ''} ${esc(SOURCES[k]?.name || k)} — ${t[1]}${s.url ? ` · <a href="${esc(s.url)}" target="_blank" rel="noopener">виж обявата</a>` : ''}${s.note ? `<br><small>${esc(s.note)}</small>` : ''}</div>`; }).join('')}</div></div>`).join('');
  }

  // Попълване от „Виртуален продавач“
  window.pbPrefill = f => {
    show('post'); renderForm();
    const el = $('#pbForm').elements;
    if (CAT_T[f.cat]) el.cat.value = f.cat;
    el.brand.value = f.brand === 'Друга' ? '' : f.brand; el.model.value = f.model || ''; el.year.value = f.year; el.hours.value = f.hours;
    const worst = Math.max(+f.chassis, +f.engine, +f.hydr); el.cond.value = String(worst);
    $$('#pbEx input').forEach(i => i.checked = (f.ex || []).includes(+i.value));
    $$('#pbAt input').forEach(i => i.checked = (f.at || []).includes(+i.value));
    const r = vsValue(f); el.price.value = +f.ask || r.fair;
    if (f.notes) el.notes.value = f.notes;
    toast('Данните са попълнени — добави снимки');
  };
  window.renderPost = () => { renderForm(); renderPubs(); };
})();

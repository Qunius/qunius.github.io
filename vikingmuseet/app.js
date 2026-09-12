const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const personFigureAssets = {
  woman: {
    src: "assets/folded-paper-viking-cutout.png",
    alt: "Färdigvikt pappersfigur av en kvinna i vikingatida kläder"
  },
  man: {
    src: "assets/folded-paper-viking-man.png",
    alt: "Färdigvikt pappersfigur av en man i vikingatida kläder"
  },
  child: {
    src: "assets/folded-paper-viking-child.png",
    alt: "Färdigvikt pappersfigur av ett barn i vikingatida kläder"
  }
};

const roomStories = {
  helmet: {
    index: "01 / 04",
    title: "En hjälm utan horn",
    short: "Horn hör hemma i vår bild av vikingen. De bevarade stridshjälmarna från tiden visar något annat.",
    long: "Inga bevarade vikingatida stridshjälmar har horn. Samtidigt finns hornförsedda gestalter i dåtidens bilder, kanske kopplade till ritualer eller föreställningsvärld. Bilden är alltså större än ett enkelt ja eller nej."
  },
  clothes: {
    index: "02 / 04",
    title: "Kläder som berättar",
    short: "Ull, lin, färg och skickligt hantverk. Det förflutna var inte så grått som det ofta ser ut på film.",
    long: "Få hela plagg finns kvar. Med textilfragment, gravfynd och spännen kan arkeologer ändå ana material, färger och snitt. Kläder kunde visa arbete, rikedom, kontakter och lokala ideal."
  },
  people: {
    index: "03 / 04",
    title: "Fler än krigaren",
    short: "Barn, kvinnor och män fyllde gårdar, verkstäder, marknader och resor. Vikingatiden var större än krigaren.",
    long: "De flesta levde framför allt i jordbrukssamhällen. Livsvillkoren skilde sig åt genom status, frihet, ålder, kön och plats. Ett enda ansikte kan därför aldrig representera hela tiden."
  },
  faith: {
    index: "04 / 04",
    title: "Symboler sida vid sida",
    short: "Torshammare och kors hör till samma föränderliga tid. Gamla och nya föreställningar kunde leva nära varandra.",
    long: "Kristnandet var en lång förändring, inte ett ögonblick. En vikingatida gjutform har plats för både kors och torshammare. Människors tro och tillhörighet kunde skifta gradvis och se olika ut på olika platser."
  }
};

const questions = [
  {
    kicker: "Del 1 · Personen",
    title: "Vem börjar berättelsen med?",
    prompt: "Välj vem du vill följa.",
    moreTitle: "Vikingatiden hade många huvudpersoner",
    more: "Samhällena bestod av kvinnor, män och barn med olika villkor, status och roller. Ordet viking verkar dessutom ofta ha beskrivit en resa eller aktivitet — inte alla människor som levde i Norden.",
    options: [
      { label: "En kvinna", icon: "woman", asset: "assets/builder-option-woman-paper.png", fact: "Ett liv kunde rymma gårdsansvar, hantverk, handel, resor och religiösa roller — ibland flera samtidigt.", effect: "woman" },
      { label: "En man", icon: "man", asset: "assets/builder-option-man-paper.png", fact: "De flesta män var inte krigare till vardags. Arbete, familj och lokala nätverk bar livet.", effect: "man" },
      { label: "Ett barn", icon: "child", asset: "assets/builder-option-child-paper.png", fact: "Barn var en del av arbetet och gemenskapen långt innan de blev vuxna.", effect: "child" }
    ]
  },
  {
    kicker: "Del 1 · Bilden",
    title: "Vad har din viking på huvudet?",
    prompt: "Välj det som passar bilden du bär på.",
    moreTitle: "Hornen berättar också en historia",
    more: "Inga bevarade vikingatida stridshjälmar har horn. Det finns däremot samtida bilder av hornförsedda gestalter, möjligen kopplade till ritual eller föreställningsvärld. Den välkända krigaren med horn formades långt senare.",
    options: [
      { label: "Hjälm med horn", icon: "horns", asset: "assets/builder-option-horned-paper.png", fact: "En stark symbol. Behåll den om du vill — och bär samtidigt med dig att de bevarade stridshjälmarna saknar horn.", effect: "horns" },
      { label: "Hjälm utan horn", icon: "helmet", asset: "assets/builder-option-plain-helmet-paper.png", fact: "Det ligger närmare de bevarade fynden. Hjälmar verkar samtidigt ha varit ovanliga och värdefulla.", effect: "helmet" },
      { label: "Ingen hjälm", icon: "none", asset: "assets/builder-option-no-helmet-paper.png", fact: "För många människor är det troligare än någon hjälm alls.", effect: "no-helmet" }
    ]
  },
  {
    kicker: "Del 1 · Bilden",
    title: "Vad bär din viking?",
    prompt: "Välj en situation, inte en historisk uniform.",
    moreTitle: "Kläder var mer än skydd",
    more: "Kläder syddes bland annat av ull och lin och kunde färgas och dekoreras. Eftersom få hela plagg finns kvar bygger dagens dräkter på fragment, gravfynd och tolkningar.",
    options: [
      { label: "Arbetsdräkt", icon: "tunic", asset: "assets/builder-option-workwear-paper.png", fact: "Ull och lin bar mycket av vardagen. Plaggen vävdes, lagades och kunde färgas.", effect: "work" },
      { label: "Utsmyckad", icon: "jewelry", asset: "assets/builder-option-ornate-paper.png", fact: "Smycken, färg och importerade material kunde visa status, kontakter och lokala ideal.", effect: "ornate" },
      { label: "Reskläder", icon: "cloak", asset: "assets/builder-option-travel-cloak-paper.png", fact: "Flera lager och en mantel kunde möta väder och långa färder — ovanpå vävda plagg.", effect: "traveler" }
    ]
  },
  {
    kicker: "Del 1 · Utrustningen",
    title: "Hur skyddar sig din viking?",
    prompt: "Utrustning berättade också om resurser.",
    moreTitle: "Den fullt rustade var inte normen",
    more: "Sköldar, hjälmar och ringbrynjor användes som skydd, men hjälmar och ringbrynjor är mycket sällsynta fynd. En välutrustad krigare representerade inte alla som deltog i strid — och ännu mindre alla som levde under tiden.",
    options: [
      { label: "Rund sköld", icon: "shield", asset: "assets/builder-option-round-shield-paper.png", fact: "Skölden var både skydd och ett aktivt redskap. Den syns betydligt oftare än den kompletta rustningen.", effect: "shield" },
      { label: "Ringbrynja", icon: "mail", asset: "assets/builder-option-chainmail-paper.png", fact: "Starkt skydd — men kostsamt, arbetskrävande och långt ifrån självklart.", effect: "mail" },
      { label: "Inget särskilt", icon: "none", asset: "assets/builder-option-no-armor-paper.png", fact: "Många kan ha mött våld med mindre skydd än bilden av den fullt rustade krigaren.", effect: "no-armor" }
    ]
  },
  {
    kicker: "Del 1 · Tron",
    title: "Vad bär din viking nära kroppen?",
    prompt: "En symbol behöver inte låsa en människa till ett enda svar.",
    moreTitle: "En förändring utan skarp kant",
    more: "Kristnandet såg olika ut på olika platser och i olika generationer. Gamla och nya föreställningar kunde finnas sida vid sida. En vikingatida gjutform har till och med plats för både kors och torshammare.",
    options: [
      { label: "Torshammare", icon: "hammer", asset: "assets/builder-option-thor-hammer-paper.png", fact: "Torshammaren kunde markera tillhörighet och skydd i en fornnordisk föreställningsvärld.", effect: "hammer" },
      { label: "Ett kors", icon: "cross", asset: "assets/builder-option-cross-paper.png", fact: "Kristendomen spreds gradvis genom bland annat resor, handel, makt och mission.", effect: "cross" },
      { label: "Torshammare och kors", icon: "both", asset: "assets/builder-option-both-faith-paper.png", fact: "Övergången hade ingen skarp gräns. Gamla och nya symboler kunde leva sida vid sida.", effect: "both" }
    ]
  },
  {
    kicker: "Del 1 · Vardagen",
    title: "Vad gör din viking till vardags?",
    prompt: "Välj det som tar mest plats just nu.",
    moreTitle: "Resan började ofta på gården",
    more: "De flesta levde i jordbrukssamhällen. Gårdsarbete, hantverk och handel bar vardagen. En del reste, handlade, bosatte sig eller deltog i våldsamma räder — ibland under olika delar av samma liv.",
    options: [
      { label: "Sköter gården", icon: "farm", asset: "assets/builder-option-farm-paper.png", fact: "Mat, djur, byggnader och textilarbete fick samhället att fungera.", effect: "farm" },
      { label: "Hantverk och handel", icon: "trade", asset: "assets/builder-option-craft-trade-paper.png", fact: "Metall, trä, textil och varor band samman människor över stora avstånd.", effect: "trade" },
      { label: "Reser till sjöss", icon: "ship", asset: "assets/builder-option-ship-raid-paper.png", fact: "Resor kunde rymma handel, arbete, bosättning och våldsamma räder — men inte för alla.", effect: "travel" }
    ]
  },
  {
    kicker: "Del 2 · Ditt perspektiv",
    title: "Någon stjäl en ko. Vad gör du?",
    prompt: "Nu kliver du in i berättelsen. Vad skulle du göra?",
    moreTitle: "Rätt var också relationer",
    more: "Tvister kunde hanteras genom förhandling, släktnätverk, ting och ekonomisk ersättning. Lagen behandlade människor olika beroende på frihet, status och tillhörighet.",
    options: [
      { label: "Tar tillbaka den", icon: "cow", fact: "Det kan rädda egendomen snabbt — men också göra konflikten större.", effect: "direct" },
      { label: "Samlar släkten", icon: "family", fact: "Släkten kunde ge skydd och tyngd, men också dra fler människor in i konflikten.", effect: "kin" },
      { label: "Går till tinget", icon: "thing", fact: "Tinget gav en offentlig plats för vittnen, lag och uppgörelser. Det liknade inte en modern domstol i allt.", effect: "thing" }
    ]
  },
  {
    kicker: "Del 2 · Skyddet",
    title: "En främling söker skydd. Vad gör du?",
    prompt: "Utanför den egna bygden kunde tillhörighet vara avgörande.",
    moreTitle: "En främling stod ofta ensam",
    more: "Utanför den egna bygden och släkten kunde en människa vara utsatt. En allierad eller skyddsherre kunde bli avgörande. Gästfrihet var därför både en mänsklig handling och en relation med följder.",
    options: [
      { label: "Ger skydd", icon: "door", fact: "Du skapar ett band. Med skyddet kan också följa ansvar för vad främlingen gör.", effect: "shelter" },
      { label: "Begär ett utbyte", icon: "exchange", fact: "Arbete, nyheter eller gåvor kan göra mötet till en ömsesidig relation.", effect: "exchange" },
      { label: "Avvisar", icon: "closed", fact: "Du skyddar hushållets resurser, men lämnar främlingen utan tillhörighet.", effect: "refuse" }
    ]
  },
  {
    kicker: "Del 2 · Konflikten",
    title: "Din släkting har skadat någon. Hur svarar du?",
    prompt: "Lojalitet kunde både skydda och binda.",
    moreTitle: "En privat konflikt var sällan helt privat",
    more: "Beslut kunde påverka ett helt hushåll eller släktnätverk. Förhandling och ersättning kunde avsluta en konflikt, medan hämnd riskerade att låta den fortsätta mellan fler människor.",
    options: [
      { label: "Kräver hämnd", icon: "sword", fact: "Det kan försvara släktens heder — och samtidigt hålla våldet i rörelse.", effect: "revenge" },
      { label: "Söker ersättning", icon: "silver", fact: "Ekonomisk ersättning kunde göra en uppgörelse möjlig utan att konflikten behövde glömmas.", effect: "compensation" },
      { label: "Försöker medla", icon: "hands", fact: "Att föra människor samman kunde kräva både förtroende och stöd från nätverket omkring dem.", effect: "mediate" }
    ]
  },
  {
    kicker: "Del 2 · Eftermälet",
    title: "Vad vill du bli ihågkommen för?",
    prompt: "Det som bevaras är större än en enda sorts hjälte.",
    moreTitle: "Fler sätt att lämna spår",
    more: "Runstenar minns människor för resor och strider, men också för släktskap, brobyggen, gåvor och tro. Det som överlever är alltid ett urval — inte ett helt liv.",
    options: [
      { label: "Mod", icon: "courage", fact: "Mod kunde synas i strid — men också i att resa, tala och ta ansvar.", effect: "courage" },
      { label: "Rikedom", icon: "wealth", fact: "Rikedom var mer än silver. Jord, djur, gåvor och kontakter kunde skapa makt.", effect: "wealth" },
      { label: "Omsorg", icon: "care", fact: "Ett hushåll överlevde genom relationer, arbete och förtroende.", effect: "care" }
    ]
  }
];

function icon(name) {
  const common = 'viewBox="0 0 120 120" aria-hidden="true"';
  const icons = {
    woman: '<circle cx="60" cy="34" r="17"/><path d="M32 104c3-33 12-53 28-53s25 20 28 53M44 25c2-17 30-19 35 1M42 67l-15 24M78 67l15 24"/>',
    man: '<circle cx="60" cy="34" r="17"/><path d="M32 104c3-33 12-53 28-53s25 20 28 53M45 44c4 18 25 22 31 0M42 67l-15 24M78 67l15 24"/>',
    child: '<circle cx="60" cy="40" r="14"/><path d="M40 103c2-27 8-45 20-45s18 18 20 45M44 70L29 88M76 70l15 18"/>',
    horns: '<path d="M33 52C4 50 8 16 28 13c-4 15 6 23 16 25M87 52c29-2 25-36 5-39 4 15-6 23-16 25M30 82V57c0-21 13-33 30-33s30 12 30 33v25M30 63h60M60 24v58"/>',
    helmet: '<path d="M24 83V55c0-27 15-40 36-40s36 13 36 40v28M24 62h72M60 16v68M24 83h24l12 20 12-20h24"/>',
    none: '<circle cx="60" cy="60" r="40"/><path d="M32 88l56-56"/>',
    tunic: '<path d="M42 23l18 9 18-9 22 19-14 17-8-8v54H42V51l-8 8-14-17zM49 31c2 13 20 13 22 0M42 79h36"/>',
    jewelry: '<path d="M42 23l18 9 18-9 22 19-14 17-8-8v54H42V51l-8 8-14-17zM48 42c4 28 20 28 24 0M52 52h16M50 70h20M47 88h26"/>',
    cloak: '<path d="M55 22c-15 7-30 29-33 81h76c-3-52-18-74-33-81M55 22h10M60 22v81M47 36l13 10 13-10"/>',
    shield: '<circle cx="60" cy="60" r="43"/><circle cx="60" cy="60" r="12"/><path d="M60 17v31M60 72v31M17 60h31M72 60h31"/>',
    mail: '<path d="M39 20l21 10 21-10 20 23-15 17-8-9v54H42V51l-8 9-15-17z"/><circle cx="49" cy="52" r="6"/><circle cx="64" cy="52" r="6"/><circle cx="78" cy="52" r="6"/><circle cx="56" cy="66" r="6"/><circle cx="71" cy="66" r="6"/><circle cx="49" cy="80" r="6"/><circle cx="64" cy="80" r="6"/><circle cx="78" cy="80" r="6"/>',
    hammer: '<path d="M41 22h38l8 20-27 11-27-11zM56 51h8v48l-4 8-4-8zM45 93h30"/>',
    cross: '<path d="M54 18h12v29h24v12H66v44H54V59H30V47h24z"/>',
    both: '<path d="M22 25h27l6 14-19 8-19-8zM33 47h6v42M72 21h9v23h18v9H81v37h-9V53H54v-9h18z"/>',
    farm: '<path d="M16 52l44-32 44 32M26 46v57h68V46M48 103V68h24v35M17 83h18M85 75h19"/>',
    trade: '<path d="M22 42h76M33 42l8 47h38l8-47M47 42c0-17 26-17 26 0M23 94h74M17 30l17-10M103 30L86 20"/>',
    ship: '<path d="M12 76h96c-8 20-25 29-48 29S20 96 12 76zM60 19v57M60 25l35 27H60M60 35L29 61h31M30 70c9-5 16-5 25 0s16 5 25 0 16-5 25 0"/>',
    cow: '<path d="M26 48c10-9 58-9 68 3v33H31zM31 58L16 46M94 58l12-12M39 84v20M83 84v20M42 44L31 28M78 44l11-16M50 62h1M79 62h1"/>',
    family: '<circle cx="60" cy="27" r="12"/><circle cx="29" cy="44" r="10"/><circle cx="91" cy="44" r="10"/><path d="M39 105c1-37 8-59 21-59s20 22 21 59M12 105c1-26 6-43 17-43s16 17 17 43M74 105c1-26 6-43 17-43s16 17 17 43"/>',
    thing: '<path d="M19 94h82M28 85V45h64v40M20 45l40-27 40 27M42 85V59h36v26M12 104h96"/>',
    door: '<path d="M29 106V20h62v86M43 106V35h35v71M68 70h2"/>',
    exchange: '<path d="M19 42h71M78 29l13 13-13 13M101 78H30M42 65L29 78l13 13"/>',
    closed: '<path d="M29 106V20h62v86M43 106V35h35v71M68 70h2M22 99l76-71"/>',
    sword: '<path d="M64 16l14 14-39 53-12 3 3-12zM26 75l19 19M19 101l13-13"/>',
    silver: '<ellipse cx="43" cy="43" rx="25" ry="10"/><path d="M18 43v16c0 6 11 10 25 10s25-4 25-10V43M52 73c3-5 13-8 25-8 14 0 25 5 25 11v15c0 6-11 11-25 11S52 97 52 91z"/>',
    hands: '<path d="M13 73l18-26 28 19-18 26zM107 73L89 47 61 66l18 26zM39 57l15-17c5-5 9 1 7 5l-6 12M81 57L66 40c-5-5-9 1-7 5l6 12M47 91c8 8 18 8 26 0"/>',
    courage: '<path d="M60 105S21 82 21 49c0-18 22-26 39-7 17-19 39-11 39 7 0 33-39 56-39 56zM59 74l20-31M55 52l20 14"/>',
    wealth: '<circle cx="60" cy="60" r="42"/><circle cx="60" cy="60" r="29"/><path d="M60 37v46M45 48c8-13 32-9 30 4-2 11-28 6-28 18 0 14 24 17 31 3"/>',
    care: '<path d="M60 103S19 80 19 48c0-19 23-28 41-7 18-21 41-12 41 7 0 32-41 55-41 55zM35 65c12-18 38-18 50 0"/>'
  };
  return `<svg ${common}>${icons[name] || icons.none}</svg>`;
}

const state = { step: 0, answers: Array(questions.length).fill(null), transitioning: false };

function setupHeader() {
  const header = qs('[data-header]');
  if (!header) return;
  const hero = qs('.portal-hero');
  const menuButton = qs('.menu-toggle');
  const nav = qs('.primary-nav');
  const langButton = qs('.language-button');
  const langMenu = qs('.language-menu');

  const updateHeader = () => header.classList.toggle('is-solid', window.scrollY > hero.offsetTop + hero.offsetHeight - window.innerHeight * .15);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
  });
  qsa('a', nav).forEach(link => link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }));
  langButton.addEventListener('click', () => {
    const open = langButton.getAttribute('aria-expanded') === 'true';
    langButton.setAttribute('aria-expanded', String(!open));
    langMenu.hidden = open;
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.language-picker')) {
      langButton.setAttribute('aria-expanded', 'false');
      langMenu.hidden = true;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!langMenu.hidden) {
      langMenu.hidden = true;
      langButton.setAttribute('aria-expanded', 'false');
      langButton.focus();
    }
    if (nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.focus();
    }
  });
}

function setupPortal() {
  const hero = qs('.portal-hero');
  if (!hero) return;
  const room = qs('[data-room]', hero);
  const hotspots = room ? qsa('[data-hotspot]', room) : [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.min(1, Math.max(0, value));
  const range = (value, start, end) => clamp((value - start) / (end - start));
  const smooth = value => value * value * (3 - 2 * value);
  let roomWasInteractive = false;
  const update = () => {
    const distance = hero.offsetHeight - window.innerHeight;
    const progress = clamp(-hero.getBoundingClientRect().top / Math.max(distance, 1));
    const camera = reduceMotion.matches ? 0 : smooth(range(progress, .02, .7));
    // Begin the room handoff before the outer image reaches its close-up.
    // The two sources have different crops, so a shorter overlap avoids a ghosted midpoint.
    const dissolve = smooth(range(progress, .28, .54));
    const copyOut = smooth(range(progress, .06, .33));
    const frameOut = smooth(range(progress, .18, .58));
    const roomReady = smooth(range(progress, .67, .76));
    hero.style.setProperty('--portal-progress', progress.toFixed(3));
    hero.style.setProperty('--outer-scale', String(1 + camera * 1.24));
    hero.style.setProperty('--outer-opacity', String(1 - dissolve));
    hero.style.setProperty('--outer-saturation', String(.8 + camera * .22));
    hero.style.setProperty('--outer-brightness', String(1 - camera * .12));
    hero.style.setProperty('--hero-opacity', String(1 - copyOut));
    hero.style.setProperty('--hero-shift', `${-copyOut * 46}px`);
    hero.style.setProperty('--hero-scale', String(1 + copyOut * .035));
    hero.style.setProperty('--room-opacity', String(dissolve));
    hero.style.setProperty('--room-scale', reduceMotion.matches ? '1' : String(1.08 - dissolve * .08));
    hero.style.setProperty('--room-inset', reduceMotion.matches ? '0%' : `${(1 - dissolve) * 2}%`);
    hero.style.setProperty('--room-radius', `${(1 - dissolve) * 3}px`);
    hero.style.setProperty('--frame-scale', String(1 + camera * 1.5));
    hero.style.setProperty('--frame-opacity', String(1 - frameOut));
    hero.style.setProperty('--hotspot-opacity', String(roomReady));
    const roomIsInteractive = roomReady > .72;
    hero.style.setProperty('--room-events', roomIsInteractive ? 'auto' : 'none');
    if (room) {
      room.inert = !roomIsInteractive;
      room.setAttribute('aria-hidden', String(!roomIsInteractive));
      hotspots.forEach(button => { button.tabIndex = roomIsInteractive ? 0 : -1; });
      if (roomWasInteractive && !roomIsInteractive) room.dispatchEvent(new CustomEvent('roominactive'));
    }
    roomWasInteractive = roomIsInteractive;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  reduceMotion.addEventListener?.('change', update);
}

function setupReveals() {
  if (!('IntersectionObserver' in window)) {
    qsa('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }), { threshold: .12 });
  qsa('.reveal').forEach(el => observer.observe(el));
}

function setupRoom() {
  const explorer = qs('[data-room]');
  if (!explorer) return;
  const story = qs('.room-story', explorer);
  const more = qs('[data-story-more]', story);
  let current = 'helmet';
  let expanded = false;
  let pinned = false;
  let suppressFocusOpen = false;
  let hideTimer;

  const cancelHide = () => window.clearTimeout(hideTimer);
  const hide = () => {
    pinned = false;
    story.hidden = true;
    qsa('[data-hotspot]', explorer).forEach(button => {
      button.classList.remove('is-active');
      button.setAttribute('aria-expanded', 'false');
    });
  };
  const scheduleHide = () => {
    if (pinned) return;
    cancelHide();
    hideTimer = window.setTimeout(hide, 280);
  };

  const show = key => {
    cancelHide();
    current = key;
    expanded = false;
    const data = roomStories[key];
    qsa('[data-hotspot]', explorer).forEach(button => {
      const active = button.dataset.hotspot === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-expanded', String(active));
    });
    qs('.story-index', story).textContent = data.index;
    qs('h3', story).textContent = data.title;
    qs('p', story).textContent = data.short;
    more.innerHTML = 'Se spåret bakom bilden <span>↗</span>';
    story.hidden = false;
  };

  qsa('[data-hotspot]', explorer).forEach(button => {
    button.addEventListener('mouseenter', () => { if (!pinned) show(button.dataset.hotspot); });
    button.addEventListener('mouseleave', scheduleHide);
    button.addEventListener('focus', () => {
      if (suppressFocusOpen) return;
      if (current !== button.dataset.hotspot || story.hidden) pinned = false;
      show(button.dataset.hotspot);
    });
    button.addEventListener('blur', scheduleHide);
    button.addEventListener('click', () => {
      const samePinnedStory = pinned && current === button.dataset.hotspot && !story.hidden;
      if (samePinnedStory) hide();
      else {
        pinned = true;
        show(button.dataset.hotspot);
      }
    });
  });
  story.addEventListener('mouseenter', cancelHide);
  story.addEventListener('mouseleave', scheduleHide);
  story.addEventListener('focusin', cancelHide);
  story.addEventListener('focusout', event => {
    if (!story.contains(event.relatedTarget)) scheduleHide();
  });
  explorer.addEventListener('pointerdown', event => {
    if (!event.target.closest('[data-hotspot], .room-story')) hide();
  });
  explorer.addEventListener('roominactive', hide);
  more.addEventListener('click', () => {
    expanded = !expanded;
    qs('p', story).textContent = expanded ? roomStories[current].long : roomStories[current].short;
    more.innerHTML = expanded ? 'Visa mindre <span>↙</span>' : 'Se spåret bakom bilden <span>↗</span>';
  });
  explorer.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !story.hidden) {
      const active = qs('.hotspot.is-active', explorer);
      suppressFocusOpen = true;
      hide();
      active?.focus({ preventScroll: true });
      queueMicrotask(() => { suppressFocusOpen = false; });
    }
  });
}

function applyFigureEffects() {
  const figure = qs('#live-figure');
  figure.className = 'paper-viking asset-paper-viking';
  const image = qs('img', figure);
  const symbol = qs('.figure-symbol', figure);
  const trace = qs('[data-figure-trace]', figure);
  const personAnswer = state.answers[0];
  const personEffect = personAnswer === null
    ? 'woman'
    : questions[0].options[personAnswer].effect;
  const personAsset = personFigureAssets[personEffect] || personFigureAssets.woman;

  if (image.getAttribute('src') !== personAsset.src) {
    image.src = personAsset.src;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      image.animate(
        [
          { opacity: .35, transform: 'scale(.97)' },
          { opacity: 1, transform: 'scale(1)' }
        ],
        { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    }
  }
  image.alt = personAsset.alt;
  figure.setAttribute('aria-label', personAsset.alt);
  symbol.textContent = '⌁';
  symbol.dataset.label = state.answers[4] === null ? 'Symbol' : 'Tro';
  symbol.title = state.answers[4] === null ? 'Vald symbol visas här' : 'Din vikings trosymbol';
  state.answers.forEach((answer, index) => {
    if (answer === null) return;
    const effect = questions[index].options[answer].effect;
    if (effect === 'child') figure.classList.add('is-child');
    if (effect === 'horns') figure.classList.add('has-helmet', 'has-horns');
    if (effect === 'helmet') figure.classList.add('has-helmet');
    if (effect === 'ornate') figure.classList.add('is-ornate');
    if (effect === 'traveler') figure.classList.add('is-traveler');
    if (effect === 'shield') figure.classList.add('has-shield');
    if (effect === 'mail') figure.classList.add('has-mail');
    if (effect === 'hammer') symbol.textContent = 'ᚦ';
    if (effect === 'cross') symbol.textContent = '✝';
    if (effect === 'both') symbol.textContent = 'ᚦ ✝';
  });
  const selectedLabels = state.answers
    .map((answer, index) => answer === null ? null : questions[index].options[answer].label)
    .filter(Boolean);
  trace.textContent = selectedLabels.length ? selectedLabels.slice(-3).join(' · ') : 'Din berättelse börjar här';
}

function renderQuestion(focus = false, resetScroll = false) {
  const question = questions[state.step];
  const chosen = state.answers[state.step];
  qs('[data-current-step]').textContent = state.step + 1;
  qs('[data-progress]').style.width = `${(state.step + 1) * 10}%`;
  qs('.builder-progress')?.setAttribute('aria-valuenow', String(state.step + 1));
  qs('[data-question-kicker]').textContent = question.kicker;
  qs('[data-question-title]').textContent = question.title;
  qs('[data-question-prompt]').textContent = question.prompt;
  const options = qs('[data-options]');
  options.innerHTML = question.options.map((option, index) => `
    <button class="option-card${chosen === index ? ' is-selected' : ''}" type="button" data-option="${index}" aria-pressed="${chosen === index}">
      <span class="option-visual">${option.asset ? `<img src="${option.asset}" alt="">` : icon(option.icon)}</span>
      <span class="option-label"><span>0${index + 1}</span><strong>${option.label}</strong></span>
    </button>`).join('');
  qsa('[data-option]', options).forEach(button => button.addEventListener('click', () => selectOption(Number(button.dataset.option))));

  const fact = qs('[data-fact]');
  fact.classList.toggle('is-visible', chosen !== null);
  fact.setAttribute('aria-hidden', String(chosen === null));
  if (chosen !== null) qs('[data-fact-copy]').textContent = question.options[chosen].fact;
  const next = qs('[data-builder-next]');
  next.disabled = chosen === null;
  next.innerHTML = state.step === questions.length - 1 ? 'Se din viking <span>→</span>' : 'Nästa <span>→</span>';
  qs('[data-builder-back]').disabled = state.step === 0;
  qs('[data-builder-hint]').textContent = chosen === null ? 'Välj ett alternativ för att fortsätta' : 'Ditt val är sparat';
  closeInsight();
  applyFigureEffects();
  if (resetScroll) qs('.question-panel').scrollTop = 0;
  if (focus) qs('[data-question-title]').focus?.({ preventScroll: true });
}

function selectOption(index) {
  if (state.transitioning) return;
  const panel = qs('.question-panel');
  const journey = qs('.builder-journey.is-in-builder');
  const builderScreen = qs('[data-builder-screen]');
  const stableScrollTop = panel.scrollTop;
  const stableJourneyTop = builderScreen?.offsetTop || 0;
  state.answers[state.step] = index;
  const question = questions[state.step];
  qsa('[data-option]').forEach((button, buttonIndex) => {
    const selected = buttonIndex === index;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  const fact = qs('[data-fact]');
  qs('[data-fact-copy]').textContent = question.options[index].fact;
  fact.classList.add('is-visible');
  fact.setAttribute('aria-hidden', 'false');
  const next = qs('[data-builder-next]');
  next.disabled = false;
  qs('[data-builder-hint]').textContent = 'Ditt val är sparat';
  closeInsight();
  applyFigureEffects();
  const keepPanelStill = () => {
    panel.scrollTop = stableScrollTop;
    if (journey) journey.scrollTop = stableJourneyTop;
  };
  requestAnimationFrame(() => {
    keepPanelStill();
    requestAnimationFrame(keepPanelStill);
  });
  setTimeout(keepPanelStill, 90);
  setTimeout(keepPanelStill, 320);
  const responseAnimation = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? null
    : fact.animate?.([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'ease-out' });
  responseAnimation?.finished.then(keepPanelStill).catch(() => {});
}

async function changeQuestion(direction) {
  if (state.transitioning) return;
  const nextStep = state.step + direction;
  if (nextStep < 0 || nextStep >= questions.length) return;
  state.transitioning = true;
  const panel = qs('.question-panel');
  const nextButton = qs('[data-builder-next]');
  const backButton = qs('[data-builder-back]');
  nextButton.disabled = true;
  backButton.disabled = true;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const outgoing = reduceMotion ? null : panel.animate?.(
    [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${direction > 0 ? '-18px' : '18px'})` }],
    { duration: 145, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }
  );
  if (outgoing) await outgoing.finished.catch(() => {});
  state.step = nextStep;
  renderQuestion(false, true);
  nextButton.disabled = true;
  backButton.disabled = true;
  const incoming = reduceMotion ? null : panel.animate?.(
    [{ opacity: 0, transform: `translateX(${direction > 0 ? '18px' : '-18px'})` }, { opacity: 1, transform: 'translateX(0)' }],
    { duration: 220, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }
  );
  if (incoming) await incoming.finished.catch(() => {});
  state.transitioning = false;
  const chosen = state.answers[state.step];
  nextButton.disabled = chosen === null;
  backButton.disabled = state.step === 0;
  qs('[data-question-title]').focus?.({ preventScroll: true });
}

let insightReturnFocus = null;
let insightHideTimer = null;

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function keepFocusInside(event, container) {
  if (event.key !== 'Tab' || !container) return;
  const focusable = qsa(focusableSelector, container).filter(node => !node.hidden && node.getClientRects().length);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!focusable.includes(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function setBuilderBackgroundInert(value) {
  ['.builder-topbar', '.figure-panel', '.question-panel', '.builder-footer'].forEach(selector => {
    const node = qs(selector);
    if (node) node.inert = value;
  });
}

function openInsight() {
  const question = questions[state.step];
  const insight = qs('[data-insight]');
  window.clearTimeout(insightHideTimer);
  qs('[data-insight-title]').textContent = question.moreTitle;
  qs('[data-insight-copy]').textContent = question.more;
  insightReturnFocus = document.activeElement;
  setBuilderBackgroundInert(true);
  insight.hidden = false;
  insight.inert = false;
  insight.classList.add('is-open');
  insight.setAttribute('aria-hidden', 'false');
  qs('[data-insight-close]').focus();
}

function closeInsight(restoreFocus = false) {
  const insight = qs('[data-insight]');
  insight.classList.remove('is-open');
  insight.setAttribute('aria-hidden', 'true');
  insight.inert = true;
  setBuilderBackgroundInert(false);
  window.clearTimeout(insightHideTimer);
  insightHideTimer = window.setTimeout(() => { insight.hidden = true; }, 380);
  if (restoreFocus) insightReturnFocus?.focus?.({ preventScroll: true });
}

function showResult() {
  const app = qs('[data-builder-app]');
  const result = qs('[data-builder-result]');
  const journey = qs('.builder-journey');
  app.hidden = true;
  if (journey) journey.inert = true;
  document.body.classList.add('builder-open');
  result.hidden = false;

  const figureCopy = qs('#live-figure').cloneNode(true);
  figureCopy.removeAttribute('id');
  qs('[data-result-figure]').replaceChildren(figureCopy);
  qs('[data-result-summary]').innerHTML = state.answers.map((answer, i) => `<li>${questions[i].options[answer].label}</li>`).join('');
  updatePrintSheet();
  requestAnimationFrame(() => qs('#result-title')?.focus({ preventScroll: true }));
}

function updatePrintSheet() {
  const labels = state.answers.map((answer, i) => questions[i].options[answer].label);
  const symbolEffect = questions[4].options[state.answers[4]].effect;
  qs('[data-print-symbol]').textContent = symbolEffect === 'cross' ? '✝' : symbolEffect === 'both' ? 'ᚦ ✝' : 'ᚦ';
  qs('[data-print-clothes]').textContent = labels[2];
  qs('[data-print-choices]').innerHTML = labels.map((label, i) => `<span>0${i + 1}<b>${label}</b></span>`).join('');
}

function setupBuilder() {
  const intro = qs('[data-builder-intro]');
  const app = qs('[data-builder-app]');
  const result = qs('[data-builder-result]');
  if (!app || !intro || !result) return;
  const standalone = document.body.classList.contains('builder-page');
  const journey = qs('.builder-journey');
  const builderScreen = qs('[data-builder-screen]');
  let scrollLockTimer;
  let enteringBuilder = false;

  const lockOnBuilder = () => {
    if (!standalone) return;
    journey.scrollTop = builderScreen.offsetTop;
    journey.classList.add('is-in-builder');
    enteringBuilder = false;
    qs('[data-question-title]').focus?.({ preventScroll: true });
  };

  const enterBuilder = () => {
    if (enteringBuilder || journey.classList.contains('is-in-builder')) return;
    enteringBuilder = true;
    const from = journey.scrollTop;
    const to = builderScreen.offsetTop;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return lockOnBuilder();
    const started = performance.now();
    const duration = 980;
    const ease = t => 1 - Math.pow(1 - t, 4);
    const tick = now => {
      if (!enteringBuilder || journey.classList.contains('is-in-builder')) return;
      const progress = Math.min(1, (now - started) / duration);
      journey.scrollTop = from + (to - from) * ease(progress);
      if (progress < 1) requestAnimationFrame(tick);
      else lockOnBuilder();
    };
    requestAnimationFrame(tick);
  };

  if (standalone) {
    journey.addEventListener('scroll', () => {
      if (journey.classList.contains('is-in-builder')) return;
      clearTimeout(scrollLockTimer);
      scrollLockTimer = setTimeout(() => {
        if (journey.scrollTop >= builderScreen.offsetTop * .94) lockOnBuilder();
      }, 130);
    }, { passive: true });
  }

  const start = () => {
    if (standalone) {
      renderQuestion();
      enterBuilder();
    } else {
      app.hidden = false;
      document.body.classList.add('builder-open');
      renderQuestion();
      setTimeout(() => qs('[data-question-title]').focus?.({ preventScroll: true }), 50);
    }
  };
  qs('[data-builder-start]').addEventListener('click', start);
  qs('[data-builder-close]').addEventListener('click', () => {
    if (standalone) {
      window.location.href = 'index.html';
    } else {
      app.hidden = true;
      document.body.classList.remove('builder-open');
      qs('#bygg')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  qs('[data-builder-next]').addEventListener('click', () => {
    if (state.answers[state.step] === null) return;
    if (state.step === questions.length - 1) return showResult();
    changeQuestion(1);
  });
  qs('[data-builder-back]').addEventListener('click', () => {
    if (state.step === 0) return;
    changeQuestion(-1);
  });
  qs('[data-read-more]').addEventListener('click', openInsight);
  qs('[data-insight-close]').addEventListener('click', () => closeInsight(true));
  qs('[data-edit]').addEventListener('click', () => {
    result.hidden = true;
    journey.inert = false;
    app.hidden = false;
    document.body.classList.add('builder-open');
    renderQuestion(true, true);
  });
  qs('[data-result-continue]').addEventListener('click', () => {
    result.hidden = true;
    journey.inert = false;
    document.body.classList.remove('builder-open');
    if (standalone) window.location.href = 'index.html#besok';
    else qs('#besok')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  qs('[data-print]').addEventListener('click', () => {
    updatePrintSheet();
    window.print();
  });
  document.addEventListener('keydown', event => {
    const insight = qs('[data-insight]');
    if (event.key === 'Tab' && insight.classList.contains('is-open')) keepFocusInside(event, insight);
    else if (event.key === 'Tab' && !result.hidden) keepFocusInside(event, result);
    else if (event.key === 'Escape' && insight.classList.contains('is-open')) closeInsight(true);
    else if (event.key === 'Escape' && !result.hidden) {
      result.hidden = true;
      journey.inert = false;
      app.hidden = false;
      renderQuestion(true, true);
    }
  });
  if (standalone) renderQuestion();
}

function replaceSupportingImages() {
  const replacements = [
    ['.card-image-object img', 'assets/museum-helmet-display.png'],
    ['.card-image-ride img', 'assets/ragnfrids-saga-journey.png'],
    ['.card-image-guide img', 'assets/guided-family-visit.png']
  ];
  replacements.forEach(([selector, src]) => {
    const img = qs(selector);
    if (!img) return;
    const probe = new Image();
    probe.onload = () => { img.src = src; };
    probe.src = src;
  });
}

setupHeader();
setupPortal();
setupReveals();
setupRoom();
setupBuilder();
replaceSupportingImages();

// The image fallback uses an external listener to keep inline scripts disabled.
const roomImage = document.querySelector('[data-room-image-fallback]');
if (roomImage) {
  const useRoomFallback = () => { roomImage.src = 'assets/longhouse-zoom-continuation.png'; };
  roomImage.addEventListener('error', useRoomFallback, { once: true });
  if (roomImage.complete && !roomImage.naturalWidth) useRoomFallback();
}

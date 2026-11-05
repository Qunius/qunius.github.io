/* Wingspan case. Compiled by build.mjs and spliced into the published bundle.
   `c` (jsx runtime), `Ne` (image with lightbox) and `ke` (arrow) come from the
   surrounding bundle. Design source: Figma frame "Wingspan, ny version, 5 nov". */

const wxh = (t, p, ...k) => {
  const o = { ...(p || {}) };
  const key = o.key;
  delete o.key;
  if (k.length === 1) o.children = k[0];
  else if (k.length > 1) o.children = k;
  return c.jsx(t, o, key);
};

const WX = '/assets/cases/wingspan/';

function WxMarker({ children }) {
  return <p className="wx-marker">{children}</p>;
}

function WxHead({ label, right }) {
  return (
    <div className="wx-head">
      <WxMarker>{label}</WxMarker>
      {right && <p className="wx-mono">{right}</p>}
    </div>
  );
}

function WxFact({ label, children }) {
  return <div className="wx-fact"><dt>{label}</dt><dd>{children}</dd></div>;
}

function WxQuote({ source, children, large }) {
  return (
    <figure className={`wx-quote${large ? ' wx-quote--large' : ''}`}>
      <figcaption><span className="wx-marker">{source}</span></figcaption>
      <blockquote>{children}</blockquote>
    </figure>
  );
}

function WxBody({ children }) {
  return <div className="wx-body">{children}</div>;
}

function WxFig({ title, meta, note, kind, src, w, h, alt, children }) {
  return (
    <figure className="wx-fig">
      <figcaption><strong>{title}</strong>{meta && <span>{meta}</span>}</figcaption>
      <div className={`wx-mat${kind ? ` wx-mat--${kind}` : ''}`}>
        {children || <Ne src={WX + src} width={w} height={h} alt={alt} />}
      </div>
      {note && <p>{note}</p>}
    </figure>
  );
}

function WxCap({ left, right }) {
  return <p className="wx-cap"><span>{left}</span><span>{right}</span></p>;
}

function WxBleed({ src, alt }) {
  return <div className="wx-bleed"><Ne src={WX + src} width={1536} height={1024} alt={alt} /></div>;
}

function WxCards({ label, cards }) {
  return (
    <div className="wx-cards" role="img" aria-label={label}>
      {cards.map(card => (
        <div className="wx-card" key={card.name}>
          {card.kicker && <small>{card.kicker}</small>}
          <b>{card.name}</b>
          <span className="wx-card-actions">
            {card.buttons.map(b => <i key={b.text} data-filled={b.filled ? 'true' : undefined}>{b.text}</i>)}
            {card.link && <em>{card.link}</em>}
          </span>
        </div>
      ))}
    </div>
  );
}

const wxBefore = ['Basic', 'Premium', 'Pro'].map(name => ({
  name,
  buttons: [{ text: 'Boka möte', filled: true }, { text: 'Kontakta oss' }, { text: 'Få offert' }],
}));

const wxAfter = [
  ['Kartlägg nuläget', 'Basic', false],
  ['Följ utvecklingen', 'Premium', true],
  ['Anpassa efter er', 'Pro', false],
].map(([kicker, name, filled]) => ({
  kicker,
  name,
  buttons: [{ text: `Prata om ${name}`, filled }],
  link: 'Se vad som ingår →',
}));

function Cg() {
  return (
    <article className="portfolio-case wx" id="wingspan" aria-labelledby="wingspan-title">
      <header className="wx-wrap wx-cover">
        <WxMarker>Arbeten / 01 Wingspan</WxMarker>
        <div className="case-heading wx-word">
          <h3 className="editorial-title" id="wingspan-title" tabIndex={-1}>Wingspan</h3>
        </div>
        <div className="wx-meta">
          <p className="wx-mono">UX-research och webbdesign</p>
          <p className="wx-mono">Grupprojekt med verklig kund</p>
          <p className="wx-mono">2026</p>
        </div>
        <div className="wx-row wx-intro">
          <div />
          <div className="wx-main">
            <h4>Ett seriöst intryck räckte inte.</h4>
            <WxBody>
              <p>Wingspan hjälper organisationer att mäta och utveckla arbetsmiljön. Flera deltagare i vår studie fick ett seriöst intryck av webbplatsen, men hade svårt att förklara vad tjänsten gjorde.</p>
              <p>Jag projektledde gruppens arbete och skrev forskningsplanen. Tillsammans tog vi fram ett webbkoncept som förklarar erbjudandet, visar produkten och gör paketen lättare att jämföra.</p>
            </WxBody>
          </div>
        </div>
      </header>

      <WxBleed src="mockup.webp" alt="Vårt designförslag på en bärbar dator och en surfplatta på ett bord i varmt ljus. Startsidan med rubriken Förstå människorna. Stärk organisationen. och produktvyn Organisationsöversikt." />
      <div className="wx-wrap"><WxCap left="Vårt designförslag" right="Skärmarna är från prototypen." /></div>

      <section className="wx-wrap wx-section" aria-labelledby="wingspan-summary">
        <div className="wx-row">
          <h4 className="wx-marker" id="wingspan-summary">Caset på 30 sekunder</h4>
          <dl className="wx-summary">
            <div><dt>Frågan</dt><dd>Förstår användaren vad Wingspan erbjuder inom 30 sekunder?</dd></div>
            <div><dt>Svaret</dt><dd>Flera hade svårt att förklara tjänsten. Språket, produkten och paketen återkom som problem.</dd></div>
            <div><dt>Förslaget</dt><dd>Ett webbkoncept som säger vad tjänsten gör, visar produkten och gör paketen lättare att jämföra.</dd></div>
            <div><dt>Efteråt</dt><dd>Wingspan byggde vidare på vårt förslag i Lovable. Det blev inte exakt som vi hade tänkt oss, men mycket av vår input finns nu på wingspan.se.</dd></div>
          </dl>
        </div>
        <dl className="wx-facts">
          <WxFact label="Min roll">Jag projektledde hela arbetet och arbetade med research, layout och metodpresentation tillsammans med teamet.</WxFact>
          <WxFact label="Uppdraget">Göra tjänsten lättare att förstå innan besökaren tar kontakt.</WxFact>
          <WxFact label="Det blev">Ett gemensamt designförslag och en webbprototyp med 14 sidor, byggd med AI-stöd.</WxFact>
        </dl>
      </section>

      <section className="wx-wrap wx-section wx-section--large" id="wingspan-process" aria-labelledby="wingspan-question">
        <div className="wx-row">
          <div className="wx-rail">
            <WxMarker>Forskningsfrågan</WxMarker>
            <figure className="wx-sticky">
              <Ne src={`${WX}forskningsplan.webp`} width={260} height={284} alt="Lapp ur forskningsplanen: Användarforskning. Usability test med fokus på: förstår användaren vad Wingspan erbjuder inom 30 sekunder? Hittar de formuläret? Känns det tryggt att lämna sina uppgifter?" />
              <figcaption>Ur min forskningsplan.</figcaption>
            </figure>
          </div>
          <div className="wx-main">
            <h4 id="wingspan-question">Förstår användaren vad Wingspan erbjuder inom 30 sekunder?</h4>
            <WxBody>
              <p>Vi undersökte webbplatsen genom expertanalys, benchmarking och användningstester. Med card sorting undersökte vi också hur besökarna skulle gruppera innehållet och vad som kändes logiskt för dem.</p>
            </WxBody>
            <dl className="wx-stats">
              <div><dt>5</dt><dd>personer i användningstesterna</dd></div>
              <div><dt>3</dt><dd>av dem tillhörde målgruppen</dd></div>
              <div><dt>2</dt><dd>tester höll jag i själv</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="wx-wrap wx-section" aria-label="Citat från användningstest">
        <WxQuote source="Deltagare 2" large>”Det såg ut att vara seriöst. Men det var lite otydligt snarare. Jag tyckte att det var svårt att veta vad de egentligen hade för tjänst.”</WxQuote>
      </section>

      <section className="wx-wrap wx-section" aria-labelledby="wingspan-problems">
        <div className="wx-row">
          <WxMarker>Research</WxMarker>
          <div className="wx-main">
            <h4 id="wingspan-problems">Tre problem återkom.</h4>
            <WxBody>
              <p>Språket, produkten och paketen kom tillbaka i den tematiska analysen. En deltagare uppfattade till och med Wingspan som ett gym vid första anblicken.</p>
            </WxBody>
          </div>
        </div>
        <ol className="wx-problems">
          <li><small>Kapitel 01</small><h5>Språket</h5><p>Språket var svårt att förstå.</p></li>
          <li><small>Kapitel 02</small><h5>Produkten</h5><p>Produkten var svår att föreställa sig i användning.</p></li>
          <li><small>Kapitel 03</small><h5>Paketen</h5><p>Skillnaderna mellan paketen var otydliga.</p></li>
        </ol>
      </section>

      <section className="wx-wrap wx-section wx-section--large" aria-labelledby="wingspan-priority">
        <div className="wx-row">
          <WxMarker>Prioritering</WxMarker>
          <div className="wx-main">
            <h4 id="wingspan-priority">Vad behövde bli tydligt först?</h4>
            <WxBody>
              <p>Jag föreslog att första skärmen skulle svara på tre frågor. Det blev en central prioritering för gruppen.</p>
            </WxBody>
            <ul className="wx-three">
              <li>Vad gör ni?</li>
              <li>För vem?</li>
              <li>Vilket resultat får de?</li>
            </ul>
          </div>
        </div>
        <div className="wx-row wx-matrix">
          <figure>
            <Ne src={`${WX}prioritering.webp`} width={1116} height={1092} alt="Gruppens matris för effekt och arbetsinsats. Tydligare paket och en CTA i menyn ligger på sidan med lägre arbetsinsats. Konkretisering av erbjudandet, enklare språk och visuellt stöd ligger på sidan med högre arbetsinsats." />
          </figure>
          <div className="wx-main">
            <p className="wx-mono">Vår prioriteringsmatris</p>
            <WxBody>
              <p>Vi vägde förslagens förväntade effekt mot arbetsinsatsen och fokuserade designförslaget på erbjudandet, produktens användning och paketen.</p>
              <p>I mötet med Wingspan blev det också tydligt att målgrupperna överlappade. Vi behövde tala till HR och ledningsgrupper utan att tappa finansgrupperna. Det påverkade hur vi formulerade första skärmen.</p>
            </WxBody>
          </div>
        </div>
      </section>

      <section className="wx-wrap wx-chapter" aria-labelledby="wingspan-ch1">
        <WxHead label="01 Erbjudandet" right="Prioritet: Förklara erbjudandet" />
        <div className="wx-row">
          <h4 id="wingspan-ch1">Säg vad<br />tjänsten gör</h4>
          <div className="wx-main">
            <WxQuote source="Deltagare 3">”Alltså, bra mängd text, men mer konkret liksom varför jag behöver, eller varför mitt företag behöver tjänsten.”</WxQuote>
            <WxBody>
              <p>Startsidan inleds med ”Förstå människorna. Stärk organisationen.” Under rubriken står vad tjänsten gör och för vem: den hjälper HR och ledningsgrupper att förstå medarbetarnas svar, prioritera insatser och följa utvecklingen.</p>
              <p>Två vägar leder vidare. ”Boka demo” för den som vill ta kontakt och ”Se hur det fungerar” för den som vill förstå mer. Kundreferenserna får också plats tidigt.</p>
            </WxBody>
            <dl className="wx-tradeoff"><WxFact label="Avvägningen">Vi lät arbetsmiljön ta plats före affärsresultaten. Risken är att finansgrupperna inte känner igen sig direkt.</WxFact></dl>
          </div>
        </div>
        <div className="wx-pair">
          <WxFig title="Wingspans webbplats" meta="24 september 2026" note="Webbplatsen lyfter affärsresultat och organisationens kapacitet. Förklaringen vänder sig till ledning, styrelse och ägare." src="sept-hero.webp" w={1249} h={712} alt="Wingspans startsida den 24 september 2026 med rubriken Mät det som faktiskt driver affärsresultaten, en längre introduktion och företagets logotyp." />
          <WxFig title="Vårt designförslag" meta="Webbprototyp" note="Startsidan säger direkt vad tjänsten gör och för vem, med två vägar vidare." src="forslag-hero.webp" w={1424} h={970} alt="Vårt designförslag med rubriken Förstå människorna. Stärk organisationen., en kort förklaring för HR och ledningsgrupper och två tydliga vägar vidare." />
        </div>
      </section>

      <div className="wx-spacer" />
      <WxBleed src="produkt.webp" alt="En person använder prototypen på en bärbar dator. Skärmen visar flikarna Mät, Förstå och Förbättra bredvid produktvyn Organisationsöversikt." />
      <div className="wx-wrap"><WxCap left="Vårt designförslag" right="Skärmen är från prototypen." /></div>

      <section className="wx-wrap wx-chapter wx-chapter--tight" aria-labelledby="wingspan-ch2">
        <WxHead label="02 Produkten / Min del" right="Prioritet: Visa produkten i användning" />
        <div className="wx-row">
          <h4 id="wingspan-ch2">Text och produktvy tillsammans</h4>
          <div className="wx-main">
            <WxQuote source="Deltagare 1">”Jag har svårt att visualisera mig i produkten, om jag ska vara helt ärlig utifrån min användning.”</WxQuote>
            <WxBody>
              <p>En deltagare uppskattade trestegsmodellen. Metoden fanns redan hos Wingspan, och mitt bidrag var hur den presenteras. Vi kopplade Mät, Förstå och Förbättra till varsin produktvy.</p>
              <p>När besökaren väljer ett steg byts texten och vyn tillsammans. Det ger något konkret att titta på medan man läser om hur tjänsten fungerar. En separat metodsida ger plats för fördjupning.</p>
            </WxBody>
            <dl className="wx-tradeoff"><WxFact label="Avvägningen">Flikar gömmer innehåll. Den som aldrig klickar ser bara ett av tre steg.</WxFact></dl>
          </div>
        </div>
        <div className="wx-wide">
          <div className="wx-mat wx-mat--wide"><Ne src={`${WX}forslag-method.webp`} width={2400} height={1090} alt="Steget Förstå kopplar en kort förklaring till en visuell jämförelse av tre områden i kortet Organisationsöversikt." /></div>
          <WxCap left="Vårt designförslag" right="Förklaringen och produktvyn ligger bredvid varandra i prototypen. Vyn är ett koncept med exempeldata." />
        </div>
      </section>

      <section className="wx-wrap wx-chapter" aria-labelledby="wingspan-ch3">
        <WxHead label="03 Paketen" right="Prioritet: Gör paketen jämförbara" />
        <div className="wx-row">
          <h4 id="wingspan-ch3">Nio knappar<br />blev tre</h4>
          <div className="wx-main">
            <WxQuote source="Deltagare 1">”Så det blir svårt att gå in här och se vad som är extra i varje plan.”</WxQuote>
            <WxBody>
              <p>Vi behöll paketkorten sida vid sida, men lät behovet komma före paketnamnet: kartlägga nuläget, följa utvecklingen eller anpassa upplägget.</p>
              <p>Varje kort ger en första överblick, ett kontaktval och länken ”Se vad som ingår”. Besökaren kan orientera sig innan den går in på detaljerna.</p>
            </WxBody>
            <dl className="wx-tradeoff"><WxFact label="Avvägningen">Färre kontaktval kan tappa den som redan vet att den vill ha en offert. Vi valde tydlighet för den som fortfarande jämför.</WxFact></dl>
          </div>
        </div>
        <div className="wx-pair">
          <WxFig title="Nio knappar" meta="Wingspans webbplats, 24 september 2026" note="Tre kontaktval på varje kort: Boka möte, Kontakta oss och Få offert." kind="cards">
            <WxCards label="Tre paketkort med tre knappar var: Boka möte, Kontakta oss och Få offert." cards={wxBefore} />
          </WxFig>
          <WxFig title="Tre knappar" meta="Vårt designförslag" note="Behovet kommer före paketnamnet. Ett kontaktval och en separat länk." kind="cards">
            <WxCards label="Tre paketkort med en knapp var och länken Se vad som ingår." cards={wxAfter} />
          </WxFig>
        </div>
        <div className="wx-wide">
          <div className="wx-mat wx-mat--wide"><Ne src={`${WX}forslag-plans.webp`} width={2400} height={1017} alt="Vårt förslag med Kartlägg nuläget, Följ utvecklingen och Anpassa efter er ovanför paketnamnen, ett kontaktval och en länk till detaljer per kort." /></div>
          <WxCap left="Vårt designförslag" right="Paketöversikten i prototypen." />
        </div>
      </section>

      <section className="wx-wrap wx-chapter" aria-labelledby="wingspan-after">
        <WxHead label="04 Efteråt" right="Observerat 5 november 2026" />
        <div className="wx-row">
          <h4 id="wingspan-after">Wingspan tog vårt förslag vidare</h4>
          <div className="wx-main">
            <WxBody>
              <p>Wingspan tog med sig mycket av vår input när de byggde vidare på webbplatsen i Lovable. Det syns på startsidan, i produktmodulen och i paketkorten.</p>
              <p>Det blev inte exakt som vi hade tänkt oss. Wingspan behöll sin rubrik och sin målgrupp, men sättet att förklara tjänsten kommer från vårt arbete.</p>
            </WxBody>
          </div>
        </div>
        <div className="wx-group">
          <p className="wx-mono">Startsidan</p>
          <div className="wx-tri">
            <WxFig kind="tri" title="Wingspans webbplats" meta="24 september 2026" src="sept-hero.webp" w={1249} h={712} alt="Wingspans startsida den 24 september 2026." />
            <WxFig kind="tri" title="Vårt designförslag" meta="Webbprototyp" src="forslag-hero.webp" w={1424} h={970} alt="Startsidan i vårt designförslag." />
            <WxFig kind="tri" title="wingspan.se" meta="5 november 2026" src="live-hero.webp" w={2000} h={1126} alt="Wingspans startsida den 5 november 2026 med en kort introduktion och knappen Boka möte i menyn." />
          </div>
        </div>
        <div className="wx-group">
          <p className="wx-mono">Paketen</p>
          <div className="wx-tri">
            <WxFig kind="tri" title="Wingspans webbplats" meta="24 september 2026" src="sept-plans.webp" w={1249} h={960} alt="Paketkorten den 24 september 2026 med knapparna Boka möte, Kontakta oss och Få offert." />
            <WxFig kind="tri" title="Vårt designförslag" meta="Webbprototyp" src="forslag-plans.webp" w={2400} h={1017} alt="Paketkorten i vårt förslag med en knapp och länken Se vad som ingår." />
            <WxFig kind="tri" title="wingspan.se" meta="5 november 2026" src="live-plans.webp" w={2000} h={1225} alt="Wingspans paketkort den 5 november 2026 med knappen Boka möte och länken Se vad som ingår." />
          </div>
        </div>
        <div className="wx-group">
          <p className="wx-mono">Produkten</p>
          <div className="wx-pair">
            <WxFig title="Vårt designförslag" meta="Webbprototyp" src="forslag-method.webp" w={2400} h={1090} alt="Vårt förslag med flikarna Mät, Förstå och Förbättra bredvid kortet Organisationsöversikt." />
            <WxFig title="wingspan.se" meta="5 november 2026" src="live-tabs.webp" w={2000} h={787} alt="Wingspans plattformssektion den 5 november 2026 med flikarna Översikt, Faktorer och Utveckling bredvid kortet Organisationsöversikt." />
          </div>
        </div>
        <dl className="wx-facts wx-facts--two">
          <WxFact label="Från vårt förslag">Flikar bredvid en produktvy. Rubriken Organisationsöversikt. Ett kontaktval per paket, länken Se vad som ingår och en bokningsknapp i menyn.</WxFact>
          <WxFact label="Behöll Wingspan">Rubriken Mät det som faktiskt driver affärsresultaten. Ledningsgrupper som målgrupp. Egna flikar: Översikt, Faktorer och Utveckling.</WxFact>
        </dl>
      </section>

      <section className="wx-wrap wx-chapter" aria-labelledby="wingspan-end">
        <WxHead label="Resultat och nästa steg" />
        <div className="wx-row">
          <div />
          <div className="wx-main">
            <h4 id="wingspan-end">Tillbaka till frågan vi började med.</h4>
            <WxBody>
              <p>Arbetet resulterade i ett gemensamt designförslag och en webbprototyp byggd med AI-stöd. Förslaget är ännu inte användartestat.</p>
              <p>Nästa steg är att återvända till vårt 30-sekunderskriterium. Vi vill också undersöka om besökarna kan jämföra paketen och hitta rätt väg vidare.</p>
            </WxBody>
            <div className="wx-criterion">
              <p>Kan personer ur målgruppen beskriva vad Wingspan erbjuder, vem tjänsten är till för och hur den kan hjälpa dem?</p>
              <p>Klarar de inte det har vi inte löst problemet.</p>
            </div>
            <a className="text-link" href="https://wingspan.se/" target="_blank" rel="noreferrer">Besök Wingspans webbplats <ke /></a>
          </div>
        </div>
        <div className="wx-evidence">
          <WxMarker>Bevisläge</WxMarker>
          <dl className="wx-facts">
            <WxFact label="Visat">Fem personer testade den ursprungliga webbplatsen, tre ur målgruppen. Språket, produkten och paketen återkom som problem. Wingspan tog sedan med sig mycket av vår input.</WxFact>
            <WxFact label="Antaget">Att en produktvy bredvid texten gör tjänsten lättare att förklara, och att färre kontaktval gör det lättare att välja paket.</WxFact>
            <WxFact label="Inte testat">Vårt förslag har inte testats med användare. Jag vet inte hur Wingspans ändringar har påverkat bokade möten.</WxFact>
          </dl>
        </div>
      </section>

      <div className="wx-wrap">
        <a className="wx-next" href="#bums">
          <span>
            <small className="wx-mono">Nästa arbete</small>
            <strong>Bums</strong>
            <em>Kan en matkasse börja med en känsla?</em>
          </span>
          <b aria-hidden="true">→</b>
        </a>
      </div>
    </article>
  );
}

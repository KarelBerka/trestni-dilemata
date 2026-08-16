/**
 * Databáze trestných činů podle Trestního zákoníku ČR (zákon č. 40/2009 Sb.)
 * a statistik Ministerstva spravedlnosti ČR / JakTrestame.cz / ČSÚ.
 */

const CRIMES_DATA = [
  {
    id: "vrazda-prostá",
    name: "Vražda (v základní sazbě)",
    paragraph: "§ 140 odst. 1 TZ",
    category: "ZivotZdravi",
    categoryLabel: "Trestné činy proti životu a zdraví",
    scenario: "Pachatel po prudké hádce a potyčce v baru vytáhl nůž a v úmyslu usmrtit zasadil poškozenému několik bodných ran do hrudníku, kterým napadený na místě podlehl.",
    legalText: "Kdo jiného úmyslně usmrtí, bude potrestán odnětím svobody na deset až osmnáct let.",
    statutoryMinYears: 10,
    statutoryMaxYears: 18,
    statutoryText: "10 až 18 let odnětí svobody",
    courtStats: {
      unconditionalPrisonPct: 96,
      probationPct: 4,
      finePct: 0,
      otherPct: 0,
      avgPrisonSentenceMonths: 146, // cca 12,2 roku
      avgSentenceDescription: "Soudy ukládají nepodmíněný trest téměř stoprocentně; průměrná délka trestu se pohybuje okolo 12 let vězení."
    },
    harmAnalysis: {
      victimHarm: "Nevratné ukončení lidského života, zmaření veškerých budoucích možností a prožitků oběti, hluboké trauma a doživotní ztráta pro rodinu a pozůstalé.",
      societalImpact: "Nejzávažnější narušení základního předpokladu bezpečné společnosti; vyvolává silný strach a zásadně otřásá důvěrou v nedotknutelnost lidského života.",
      harmScore: 98
    }
  },
  {
    id: "vrazda-planovana",
    name: "Vražda s rozmyslem nebo obzvlášť surovým způsobem",
    paragraph: "§ 140 odst. 2, 3 TZ",
    category: "ZivotZdravi",
    categoryLabel: "Trestné činy proti životu a zdraví",
    scenario: "Pachatel týdny plánoval usmrcení svého obchodního partnera za účelem získání dědictví, zakoupil zbraň, vylákal jej na opuštěné místo a tam ho popravil.",
    legalText: "Kdo jiného úmyslně usmrtí s rozmyslem nebo po předchozím uvážení, bude potrestán na dvanáct až dvacet let, případně výjimečným trestem (20–30 let nebo doživotí).",
    statutoryMinYears: 12,
    statutoryMaxYears: 30, // výjimečný trest až doživotí
    statutoryText: "12 až 20 let, popř. výjimečný trest (20–30 let / doživotí)",
    courtStats: {
      unconditionalPrisonPct: 99,
      probationPct: 1,
      finePct: 0,
      otherPct: 0,
      avgPrisonSentenceMonths: 198, // cca 16,5 roku
      avgSentenceDescription: "Nepodmíněný trest je prakticky jistotou, průměrná délka trestu dosahuje 16–18 let, často se ukládá výjimečný trest."
    },
    harmAnalysis: {
      victimHarm: "Absolutní a nevratná újma spojená s bezbranností, strachem ze smrti a chladnokrevným vypočítavým jednáním pachatele.",
      societalImpact: "Extrémní nebezpečnost pachatele, který racionálně a chladnokrevně kalkuluje s likvidací lidského života pro osobní prospěch.",
      harmScore: 100
    }
  },
  {
    id: "zabiti",
    name: "Zabití (v silném rozrušení z omluvitelného hnutí mysli)",
    paragraph: "§ 141 odst. 1 TZ",
    category: "ZivotZdravi",
    categoryLabel: "Trestné činy proti životu a zdraví",
    scenario: "Oběť dlouhodobě surově týrala svou partnerku. Po dalším brutálním nočním napadení žena v afektu, panice a silném rozrušení popadla kuchyňský nůž a tyrana usmrtila.",
    legalText: "Kdo v silném rozrušení ze strachu, úleku, zmatku nebo jiného omluvitelného hnutí mysli úmyslně usmrtí jiného, bude potrestán na tři až osm let.",
    statutoryMinYears: 3,
    statutoryMaxYears: 8,
    statutoryText: "3 až 8 let odnětí svobody",
    courtStats: {
      unconditionalPrisonPct: 62,
      probationPct: 38,
      finePct: 0,
      otherPct: 0,
      avgPrisonSentenceMonths: 46, // cca 3,8 roku
      avgSentenceDescription: "Soudy zohledňují omluvitelné hnutí mysli a předchozí zavrženíhodné jednání oběti; často ukládají tresty při spodní hranici či podmíněné tresty."
    },
    harmAnalysis: {
      victimHarm: "Ztráta lidského života, avšak vyvolaná předchozím agresivním a nezákonným útokem samotného usmrceného.",
      societalImpact: "Společenská nebezpečnost pachatele je podstatně nižší, čin nebyl motivován zlou vůlí či ziskem, ale mezní krizovou reakcí na útlak.",
      harmScore: 68
    }
  },
  {
    id: "tezke-ublizeni-zdravi",
    name: "Těžké ublížení na zdraví",
    paragraph: "§ 145 odst. 1 TZ",
    category: "ZivotZdravi",
    categoryLabel: "Trestné činy proti životu a zdraví",
    scenario: "Pachatel při pouliční rvačce brutálně zmlátil procházejícího muže, způsobil mu fraktury lebky a trvalé poškození mozku s doživotními následky a ztrátou hybnosti.",
    legalText: "Kdo jinému úmyslně způsobí těžkou újmu na zdraví, bude potrestán odnětím svobody na tři až deset let.",
    statutoryMinYears: 3,
    statutoryMaxYears: 10,
    statutoryText: "3 až 10 let odnětí svobody",
    courtStats: {
      unconditionalPrisonPct: 55,
      probationPct: 45,
      finePct: 0,
      otherPct: 0,
      avgPrisonSentenceMonths: 54, // cca 4,5 roku
      avgSentenceDescription: "Zhruba polovina pachatelů odchází s nepodmíněným trestem okolo 4–5 let, u prvotrestaných se zvažuje podmínka s dohledem."
    },
    harmAnalysis: {
      victimHarm: "Doživotní invalidita, chronické bolesti, ztráta pracovní schopnosti a samostatnosti, enormní pokles kvality života.",
      societalImpact: "Vysoké náklady zdravotního a sociálního systému, atmosféra ohrožení na veřejných prostranstvích a bezdůvodná agrese.",
      harmScore: 84
    }
  },
  {
    id: "ublizeni-nedbalost-doprava",
    name: "Ublížení na zdraví z nedbalosti (dopravní nehoda)",
    paragraph: "§ 148 odst. 1 TZ",
    category: "DopravaZivotniProstredi",
    categoryLabel: "Doprava a životní prostředí",
    scenario: "Řidič se při jízdě věnoval mobilnímu telefonu, přehlédl na přechodu pro chodce chodce a srazil jej, čímž mu způsobil komplikované zlomeniny s tříměsíčním léčením.",
    legalText: "Kdo jinému z nedbalosti ublíží na zdraví tím, že poruší důležitou povinnost vyplývající z jeho zaměstnání, povolání, postavení nebo funkce nebo uloženou mu podle zákona, bude potrestán odnětím svobody až na jeden rok nebo zákazem činnosti.",
    statutoryMinYears: 0,
    statutoryMaxYears: 1,
    statutoryText: "až 1 rok odnětí svobody nebo zákaz činnosti",
    courtStats: {
      unconditionalPrisonPct: 4,
      probationPct: 62,
      finePct: 28,
      otherPct: 6,
      avgPrisonSentenceMonths: 8,
      avgSentenceDescription: "Drtivá většina případů končí podmínkou, peněžitým trestem a několikaletým zákazem řízení motorových vozidel."
    },
    harmAnalysis: {
      victimHarm: "Bolestivé zranění, dlouhodobá pracovní neschopnost, výpadek příjmů a nutnost rehabilitace.",
      societalImpact: "Porušení pravidel silničního provozu bez úmyslu škodit, motivováno lehkomyslností a nepozorností.",
      harmScore: 40
    }
  },
  {
    id: "neposkytnuti-pomoci",
    name: "Neposkytnutí pomoci řidičem dopravního prostředku",
    paragraph: "§ 151 TZ",
    category: "DopravaZivotniProstredi",
    categoryLabel: "Doprava a životní prostředí",
    scenario: "Řidič srazil v noci chodce na neosvětlené silnici, zpanikařil a z místa nehody ujel, aniž by zavolal záchrannou službu. Zraněného našel až další projíždějící řidič.",
    legalText: "Řidič dopravního prostředku, který po dopravní nehodě, na níž měl účast, neposkytne osobě, která při nehodě utrpěla újmu na zdraví, potřebnou pomoc, bude potrestán až na pět let nebo zákazem činnosti.",
    statutoryMinYears: 0,
    statutoryMaxYears: 5,
    statutoryText: "až 5 let odnětí svobody nebo zákaz činnosti",
    courtStats: {
      unconditionalPrisonPct: 24,
      probationPct: 70,
      finePct: 4,
      otherPct: 2,
      avgPrisonSentenceMonths: 18,
      avgSentenceDescription: "Soudy pohlížejí na útěk od nehody velmi přísně; téměř vždy je uložen dlouhý zákaz řízení a cca čtvrtina pachatelů jde nepodmíněně do vězení."
    },
    harmAnalysis: {
      victimHarm: "Zvýšení rizika úmrtí zraněného v důsledku prodlení záchranných prací, pocity naprostého opuštění a bezmoci.",
      societalImpact: "Hrubé porušení elementární solidarity a etické povinnosti zachránit lidský život, zbabělý pokus vyhnout se odpovědnosti.",
      harmScore: 65
    }
  },
  {
    id: "znasilneni-zavazne",
    name: "Znásilnění se zbraní nebo se způsobením těžké újmy",
    paragraph: "§ 185 odst. 2, 3 TZ",
    category: "SvobodaDostojnost",
    categoryLabel: "Trestné činy proti lidské důstojnosti",
    scenario: "Pachatel pod hrozbou nože zatáhl ženu do opuštěného parku a násilím ji donutil k pohlavnímu styku, přičemž jí způsobil fyzická zranění a těžké posttraumatické zhroucení.",
    legalText: "Kdo jiného násilím donutí k pohlavnímu styku a spáchá takový čin se zbraní nebo způsobí těžkou újmu na zdraví, bude potrestán odnětím svobody na pět až dvanáct let.",
    statutoryMinYears: 5,
    statutoryMaxYears: 12,
    statutoryText: "5 až 12 let odnětí svobody",
    courtStats: {
      unconditionalPrisonPct: 78,
      probationPct: 22,
      finePct: 0,
      otherPct: 0,
      avgPrisonSentenceMonths: 68, // cca 5,7 roku
      avgSentenceDescription: "U kvalifikovaného znásilnění (se zbraní) převládají nepodmíněné tresty v délce 5–7 let."
    },
    harmAnalysis: {
      victimHarm: "Devastující zásah do tělesné a psychické integrity, celoživotní psychické trauma (PTSD), úzkosti, ztráta pocitu bezpečí a intimní důvěry.",
      societalImpact: "Hluboké porušení základní svobody jednotlivce, vyvolává strach ve veřejném prostoru zejména u žen a zranitelných osob.",
      harmScore: 92
    }
  },
  {
    id: "znasilneni-bezbrannost",
    name: "Znásilnění zneužitím bezbrannosti",
    paragraph: "§ 185 odst. 1 TZ",
    category: "SvobodaDostojnost",
    categoryLabel: "Trestné činy proti lidské důstojnosti",
    scenario: "Pachatel na večírku využil stavu silné opilosti své známé, která nebyla schopna klást odpor ani vnímat realitu, a vykonal s ní soulož přes její dřívější odmítnutí.",
    legalText: "Kdo jiného donutí k pohlavnímu styku nebo kdo k takovému činu zneužije jeho bezbrannosti, bude potrestán odnětím svobody na šest měsíců až pět let.",
    statutoryMinYears: 0.5,
    statutoryMaxYears: 5,
    statutoryText: "6 měsíců až 5 let odnětí svobody",
    courtStats: {
      unconditionalPrisonPct: 35,
      probationPct: 65,
      finePct: 0,
      otherPct: 0,
      avgPrisonSentenceMonths: 32,
      avgSentenceDescription: "V základní sazbě soudy často ukládají podmíněné tresty s dohledem a náhradou nemajetkové újmy, což je předmětem časté společenské debaty."
    },
    harmAnalysis: {
      victimHarm: "Hrubé zneužití zranitelnosti, těžká psychická újma, pocity zrady od známé osoby a narušená sebedůvěra.",
      societalImpact: "Podkopává normy vzájemného respektu a sexuálního souhlasu ve společnosti.",
      harmScore: 78
    }
  },
  {
    id: "loupez-zbran",
    name: "Loupež se zbraní (přepadení)",
    paragraph: "§ 173 odst. 1, 2 TZ",
    category: "SvobodaDostojnost",
    categoryLabel: "Trestné činy proti svobodě a majetku",
    scenario: "Maskovaný pachatel vstoupil s pistolí v ruce do večerky, namířil na prodavačku, vyhrožoval zastřelením a vynutil si vydání tržby ve výši 25 000 Kč.",
    legalText: "Kdo proti jinému užije násilí nebo pohrůžky bezprostředního násilí v úmyslu zmocnit se cizí věci, bude potrestán na dvě až deset let; spáchá-li čin se zbraní, na pět až dvanáct let.",
    statutoryMinYears: 5,
    statutoryMaxYears: 12,
    statutoryText: "5 až 12 let odnětí svobody (se zbraní)",
    courtStats: {
      unconditionalPrisonPct: 82,
      probationPct: 18,
      finePct: 0,
      otherPct: 0,
      avgPrisonSentenceMonths: 62, // cca 5,2 roku
      avgSentenceDescription: "Loupež se zbraní je posuzována jako velmi nebezpečný čin; většina pachatelů končí ve vězení s trestem přes 5 let."
    },
    harmAnalysis: {
      victimHarm: "Akutní strach o holý život, posttraumatická stresová porucha, neschopnost dále vykonávat zaměstnání u pokladny.",
      societalImpact: "Narušení veřejného pořádku a bezpečí podnikání, vysoké riziko eskalace ve smrtící násilí při použití zbraně.",
      harmScore: 82
    }
  },
  {
    id: "vydirani",
    name: "Vydírání",
    paragraph: "§ 175 odst. 1 TZ",
    category: "SvobodaDostojnost",
    categoryLabel: "Trestné činy proti svobodě",
    scenario: "Pachatel hrozil podnikateli, že pokud mu nezaplatí výpalné 100 000 Kč, zapálí jeho provozovnu a zmlátí jeho rodinné příslušníky.",
    legalText: "Kdo jiného násilím, pohrůžkou násilí nebo pohrůžkou jiné těžké újmy nutí, aby něco konal, opominul nebo trpěl, bude potrestán na šest měsíců až čtyři léta nebo peněžitým trestem.",
    statutoryMinYears: 0.5,
    statutoryMaxYears: 4,
    statutoryText: "6 měsíců až 4 roky odnětí svobody nebo peněžitý trest",
    courtStats: {
      unconditionalPrisonPct: 38,
      probationPct: 56,
      finePct: 6,
      otherPct: 0,
      avgPrisonSentenceMonths: 24,
      avgSentenceDescription: "Záleží na intenzitě pohrůžky; cca 40 % pachatelů dostává nepodmíněný trest v délce okolo 2 let."
    },
    harmAnalysis: {
      victimHarm: "Permanentní strach o bezpečí své i své rodiny, psychické vyčerpání a ztráta svobody rozhodování.",
      societalImpact: "Destrukce právního státu a snaha zavést zákon džungle namísto oficiálních institucí a ochrany občanů.",
      harmScore: 70
    }
  },
  {
    id: "stalking",
    name: "Nebezpečné pronásledování (Stalking)",
    paragraph: "§ 354 odst. 1 TZ",
    category: "SvobodaDostojnost",
    categoryLabel: "Trestné činy proti svobodě",
    scenario: "Bývalý partner po dobu půl roku denně posílal ženě desítky výhružných zpráv, sledoval ji cestou do práce, čekal před jejím domem a monitoroval její pohyb.",
    legalText: "Kdo jiného dlouhodobě pronásleduje tím, že mu vyhrožuje ublížením na zdraví, vyhledává jeho osobní blízkost nebo ho vytrvale kontaktuje, bude potrestán až na jeden rok.",
    statutoryMinYears: 0,
    statutoryMaxYears: 1,
    statutoryText: "až 1 rok odnětí svobody nebo zákaz činnosti",
    courtStats: {
      unconditionalPrisonPct: 15,
      probationPct: 78,
      finePct: 5,
      otherPct: 2,
      avgPrisonSentenceMonths: 10,
      avgSentenceDescription: "Soudy většinou volí podmíněný trest v kombinaci se zákazem přiblížení a kontaktování oběti."
    },
    harmAnalysis: {
      victimHarm: "Dlouhodobý teror, chronický stres, nutnost změnit bydliště či zaměstnání, paranoia a ztráta sociálních kontaktů.",
      societalImpact: "Závažné narušení soukromí a osobní svobody občanů, které může v čase eskalovat ve fyzické násilí.",
      harmScore: 60
    }
  },
  {
    id: "kradez-prosta",
    name: "Krádež jízdního kola (škoda nikoli nepatrná)",
    paragraph: "§ 205 odst. 1 TZ",
    category: "Majetek",
    categoryLabel: "Trestné činy proti majetku",
    scenario: "Pachatel přestříhal zámek u stojanu před nádražím a odcizil uzamčené elektrokolo v hodnotě 45 000 Kč, které obratem prodal v zastavárně.",
    legalText: "Kdo si přisvojí cizí věc tím, že se jí zmocní, a způsobí tak na cizím majetku škodu nikoli nepatrnou (nad 10 000 Kč), bude potrestán odnětím svobody až na dvě léta nebo peněžitým trestem.",
    statutoryMinYears: 0,
    statutoryMaxYears: 2,
    statutoryText: "až 2 roky odnětí svobody, zákaz činnosti nebo peněžitý trest",
    courtStats: {
      unconditionalPrisonPct: 28, // zvýšeno recidivisty
      probationPct: 50,
      finePct: 12,
      otherPct: 10,
      avgPrisonSentenceMonths: 12,
      avgSentenceDescription: "U prvotrestaných se ukládá podmínka či prospěšné práce; vysoký podíl nepodmíněných trestů tvoří mnohočetní recidivisté."
    },
    harmAnalysis: {
      victimHarm: "Čistě materiální ztráta dopravního prostředku a finanční újma, dočasná komplikace v dojíždění do zaměstnání.",
      societalImpact: "Každodenní obtěžující kriminalita snižující komfort života ve městech, nízká míra objasněnosti.",
      harmScore: 28
    }
  },
  {
    id: "kradez-vloupani-dum",
    name: "Krádež vloupáním do rodinného domu",
    paragraph: "§ 205 odst. 1 písm. b), odst. 2 TZ",
    category: "Majetek",
    categoryLabel: "Trestné činy proti majetku a soukromí",
    scenario: "Pachatel v noci vypáčil okno rodinného domu, zatímco rodina spala v patře, a z přízemí odcizil šperky, notebooky a hotovost v celkové hodnotě 180 000 Kč.",
    legalText: "Kdo si přisvojí cizí věc tím, že se jí zmocní vloupáním, bude potrestán odnětím svobody na šest měsíců až tři léta.",
    statutoryMinYears: 0.5,
    statutoryMaxYears: 3,
    statutoryText: "6 měsíců až 3 roky odnětí svobody",
    courtStats: {
      unconditionalPrisonPct: 42,
      probationPct: 52,
      finePct: 4,
      otherPct: 2,
      avgPrisonSentenceMonths: 18,
      avgSentenceDescription: "Vloupání do obydlí je soudy posuzováno citelně přísněji než běžná krádež kvůli narušení domovní svobody."
    },
    harmAnalysis: {
      victimHarm: "Materiální škoda + hluboký pocit ztráty bezpečí ve vlastním domově, nespavost a strach o děti.",
      societalImpact: "Narušení nedotknutelnosti obydlí, psychologický dopad na celou komunitu v dané lokalitě.",
      harmScore: 56
    }
  },
  {
    id: "podvod-velky",
    name: "Podvod velkého rozsahu (vylákání celoživotních úspor seniorů)",
    paragraph: "§ 209 odst. 1, 5 TZ",
    category: "Majetek",
    categoryLabel: "Trestné činy proti majetku",
    scenario: "Organizovaná skupina telefonicky manipulovala desítky seniorů falešnou historkou o ohrožených bankovních účtech a připravila je celkem o 15 milionů Kč (škoda velkého rozsahu).",
    legalText: "Kdo sebe nebo jiného obohatí tím, že uvede někoho v omyl, a způsobí tak škodu velkého rozsahu (nad 10 mil. Kč), bude potrestán na pět až deset let.",
    statutoryMinYears: 5,
    statutoryMaxYears: 10,
    statutoryText: "5 až 10 let odnětí svobody",
    courtStats: {
      unconditionalPrisonPct: 75,
      probationPct: 25,
      finePct: 0,
      otherPct: 0,
      avgPrisonSentenceMonths: 64, // cca 5,3 roku
      avgSentenceDescription: "U škod velkého rozsahu a zneužití seniorů soudy nekompromisně ukládají nepodmíněné tresty v horní polovině sazby."
    },
    harmAnalysis: {
      victimHarm: "Totální zničení finančního zabezpečení ve stáří, pocity studu, selhání a zhoršení zdravotního stavu podvedených seniorů.",
      societalImpact: "Ztráta důvěry v digitální služby a bankovní systém, bezohledné parazitování na nejzranitelnější vrstvě obyvatel.",
      harmScore: 80
    }
  },
  {
    id: "zpronevera-firma",
    name: "Zpronevěra firemních financí (značná škoda)",
    paragraph: "§ 206 odst. 1, 4 TZ",
    category: "Majetek",
    categoryLabel: "Trestné činy proti majetku",
    scenario: "Hlavní účetní středně velké výrobní firmy po dobu tří let systematicky přeposílala firemní prostředky na svůj soukromý účet a zpronevěřila 3,5 milionu Kč.",
    legalText: "Kdo si přisvojí cizí věc, která mu byla svěřena, a způsobí tím značnou škodu (nad 1 mil. Kč), bude potrestán odnětím svobody na dvě léta až osm let.",
    statutoryMinYears: 2,
    statutoryMaxYears: 8,
    statutoryText: "2 až 8 let odnětí svobody nebo peněžitý trest",
    courtStats: {
      unconditionalPrisonPct: 35,
      probationPct: 60,
      finePct: 5,
      otherPct: 0,
      avgPrisonSentenceMonths: 36,
      avgSentenceDescription: "Pokud pachatel spolupracuje a začne škodu splácet, často dostane podmíněný trest; při absenci nápravy jde o 3–4 roky nepodmíněně."
    },
    harmAnalysis: {
      victimHarm: "Ohrožení solventnosti firmy, možné propouštění zaměstnanců, zneužití dlouholeté osobní důvěry zaměstnavatele.",
      societalImpact: "Narušení podnikatelské etiky, zvýšení transakčních nákladů na kontrolní mechanismy ve firmách.",
      harmScore: 58
    }
  },
  {
    id: "zkraceni-dane-velke",
    name: "Zkrácení daně velkého rozsahu (karuselový podvod DPH)",
    paragraph: "§ 240 odst. 1, 3 TZ",
    category: "Hospodarske",
    categoryLabel: "Hospodářské trestné činy",
    scenario: "Podnikatel přes řetězec fiktivních firem a bílých koní fingoval obchody se stavebním materiálem a neoprávněně vyčerpal vratky DPH ve výši 45 milionů Kč ze státního rozpočtu.",
    legalText: "Kdo ve velkém rozsahu (nad 10 mil. Kč) zkrátí daň, poplatek nebo podobné povinné platby, bude potrestán odnětím svobody na pět až deset let.",
    statutoryMinYears: 5,
    statutoryMaxYears: 10,
    statutoryText: "5 až 10 let odnětí svobody",
    courtStats: {
      unconditionalPrisonPct: 65,
      probationPct: 35,
      finePct: 0,
      otherPct: 0,
      avgPrisonSentenceMonths: 66, // cca 5,5 roku
      avgSentenceDescription: "U organizovaných daňových podvodů v desítkách milionů ukládají soudy nepodmíněné tresty v kombinaci s vysokými peněžitými tresty a propadnutím majetku."
    },
    harmAnalysis: {
      victimHarm: "Přímá újma na veřejných rozpočtech, z nichž jsou financovány školy, nemocnice, infrastruktura a sociální služby pro všechny občany.",
      societalImpact: "Nekalá konkurence poškozující poctivé podnikatele, eroze ochoty občanů platit daně a oslabení veřejných služeb.",
      harmScore: 75
    }
  },
  {
    id: "uplatkarstvi-urednik",
    name: "Přijetí úplatku veřejným činitelem",
    paragraph: "§ 366 odst. 1, 2 TZ",
    category: "Hospodarske",
    categoryLabel: "Trestné činy proti pořádku ve věcech veřejných",
    scenario: "Vedoucí odboru městského úřadu přijal od stavební firmy úplatek 500 000 Kč za to, že firmě přihrál předraženou veřejnou zakázku na opravu místní komunikace.",
    legalText: "Kdo v souvislosti s obstaráváním věci obecného zájmu přijme úplatek jako úřední osoba, bude potrestán odnětím svobody na tři léta až deset let nebo zákazem činnosti.",
    statutoryMinYears: 3,
    statutoryMaxYears: 10,
    statutoryText: "3 až 10 let odnětí svobody, zákaz činnosti nebo peněžitý trest",
    courtStats: {
      unconditionalPrisonPct: 40,
      probationPct: 52,
      finePct: 8,
      otherPct: 0,
      avgPrisonSentenceMonths: 42,
      avgSentenceDescription: "Soudy často kombinují citelné peněžité tresty (statisíce až miliony Kč), zákaz výkonu funkce a nepodmíněné či podmíněné tresty."
    },
    harmAnalysis: {
      victimHarm: "Město a daňoví poplatníci přeplatili zakázku o miliony korun, poctivé konkurenční firmy přišly o férovou příležitost.",
      societalImpact: "Destrukce důvěry občanů v nestrannost státní správy a férovost veřejných institucí; korupce brzdí rozvoj celé společnosti.",
      harmScore: 76
    }
  },
  {
    id: "sireni-poplasne-zpravy",
    name: "Šíření poplašné zprávy (bomba na letišti)",
    paragraph: "§ 357 odst. 1, 2 TZ",
    category: "VerejnyPoradek",
    categoryLabel: "Trestné činy proti veřejnému pořádku",
    scenario: "Opilý muž anonymně zavolal na tísňovou linku, že na mezinárodním letišti je uložena bomba. Způsobil evakuaci 4 000 cestujících, zpoždění 30 letů a zásah stovek policistů a pyrotechniků.",
    legalText: "Kdo úmyslně způsobí nebezpečí vážného znepokojení části obyvatelstva tím, že rozšiřuje poplašnou zprávu, která je nepravdivá, a způsobí tím vážnou poruchu v činnosti orgánu státní správy, bude potrestán na šest měsíců až tři léta.",
    statutoryMinYears: 0.5,
    statutoryMaxYears: 3,
    statutoryText: "6 měsíců až 3 roky odnětí svobody nebo peněžitý trest",
    courtStats: {
      unconditionalPrisonPct: 30,
      probationPct: 65,
      finePct: 5,
      otherPct: 0,
      avgPrisonSentenceMonths: 14,
      avgSentenceDescription: "Soudy vedle podmíněného trestu ukládají povinnost uhradit astronomické náklady záchranných složek a letiště (v řádu statisíců až milionů Kč)."
    },
    harmAnalysis: {
      victimHarm: "Zmeškané lety, panika tisíců rodin, enormní stres a zmatek nevinných cestujících.",
      societalImpact: "Zbytečné vyčerpání a odčerpání kapacit integrovaného záchranného systému z reálně ohrožených míst.",
      harmScore: 52
    }
  },
  {
    id: "rizeni-pod-vlivem",
    name: "Ohrožení pod vlivem návykové látky (alkohol za volantem 1,8 ‰)",
    paragraph: "§ 274 odst. 1 TZ",
    category: "DopravaZivotniProstredi",
    categoryLabel: "Trestné činy obecně ohrožující",
    scenario: "Řidič usedl za volant s 1,8 promile alkoholu v krvi, kličkoval po frekventované silnici v obci, přejížděl do protisměru a zastavila jej až policejní hlídka, aniž by stihl někoho zranit.",
    legalText: "Kdo vykonává ve stavu vylučujícím způsobilost, který si přivodil vlivem návykové látky, činnost, při které by mohl ohrozit život nebo zdraví lidí nebo způsobit značnou škodu, bude potrestán odnětím svobody až na jeden rok, peněžitým trestem nebo zákazem činnosti.",
    statutoryMinYears: 0,
    statutoryMaxYears: 1,
    statutoryText: "až 1 rok odnětí svobody, peněžitý trest nebo zákaz činnosti",
    courtStats: {
      unconditionalPrisonPct: 12, // u opakovaných
      probationPct: 48,
      finePct: 36,
      otherPct: 4,
      avgPrisonSentenceMonths: 8,
      avgSentenceDescription: "Nejčastěji se ukládá citelný peněžitý trest (20–60 tis. Kč) v kombinaci s dlouhým zákazem řízení (1–3 roky). Vězení hrozí recidivistům."
    },
    harmAnalysis: {
      victimHarm: "Štěstím nedošlo k přímé újmě, avšak vzniklo akutní a bezprostřední riziko usmrcení náhodných účastníků provozu.",
      societalImpact: "Hazardování se životy nevinných lidí, zbytečné ohrožení veřejného prostoru a ignorování pravidel bezpečnosti.",
      harmScore: 48
    }
  },
  {
    id: "tyrani-zvirat",
    name: "Týrání zvířat (zvlášť surový způsob)",
    paragraph: "§ 302 odst. 1, 2 TZ",
    category: "DopravaZivotniProstredi",
    categoryLabel: "Trestné činy proti životnímu prostředí",
    scenario: "Chovatel nechal v uzavřeném temném sklepě bez vody a krmiva několik měsíců 8 psů, z nichž polovina uhynula hlady a zbylí přežili v zuboženém stavu se závažnými trvalými následky.",
    legalText: "Kdo týrá zvíře zvlášť surovým nebo trýznivým způsobem a způsobí tím smrt nebo trvalé následky u většího počtu zvířat, bude potrestán na dvě léta až šest let.",
    statutoryMinYears: 2,
    statutoryMaxYears: 6,
    statutoryText: "2 až 6 let odnětí svobody nebo zákaz chovu zvířat",
    courtStats: {
      unconditionalPrisonPct: 22,
      probationPct: 70,
      finePct: 6,
      otherPct: 2,
      avgPrisonSentenceMonths: 28,
      avgSentenceDescription: "Po zpřísnění trestních sazeb v roce 2020 narostl počet nepodmíněných trestů; soudy standardně ukládají mnohaletý zákaz chovu zvířat."
    },
    harmAnalysis: {
      victimHarm: "Dlouhé týdny nepředstavitelného fyzického a psychického utrpení živých tvorů neschopných se bránit.",
      societalImpact: "Hrubý morální úpadek a selhání péče o zvířata; brutalita vůči zvířatům má silnou korelaci s násilným chováním vůči lidem.",
      harmScore: 66
    }
  },
  {
    id: "vytrzrnictvi",
    name: "Výtržnictví (napadení na veřejnosti)",
    paragraph: "§ 358 odst. 1 TZ",
    category: "VerejnyPoradek",
    categoryLabel: "Trestné činy proti veřejnému pořádku",
    scenario: "Agresivní fanoušek po fotbalovém zápase na tramvajové zastávce před desítkami lidí vulgárně nadával a fyzicky napadl náhodného cestujícího, kterému rozbil nos a brýle.",
    legalText: "Kdo se dopustí veřejně nebo na místě veřejnosti přístupném hrubé neslušnosti nebo výtržnosti zejména tím, že napadne jiného, bude potrestán až na dvě léta.",
    statutoryMinYears: 0,
    statutoryMaxYears: 2,
    statutoryText: "až 2 roky odnětí svobody nebo peněžitý trest",
    courtStats: {
      unconditionalPrisonPct: 20,
      probationPct: 65,
      finePct: 10,
      otherPct: 5,
      avgPrisonSentenceMonths: 10,
      avgSentenceDescription: "Běžně se ukládá podmínka, peněžitý trest či zákaz vstupu na sportovní akce; vězení dostávají opakovaně trestaní chuligáni."
    },
    harmAnalysis: {
      victimHarm: "Lehčí fyzické zranění, ponížení před veřejností, poškození osobních věcí.",
      societalImpact: "Narušení veřejného klidu, pocitu bezpečí občanů v městském prostoru a normalizace agresivního chování.",
      harmScore: 38
    }
  },
  {
    id: "neopravnene-osobni-udaje",
    name: "Neoprávněné nakládání s osobními údaji (únik citlivých dat)",
    paragraph: "§ 180 odst. 1, 2 TZ",
    category: "SvobodaDostojnost",
    categoryLabel: "Trestné činy proti právům na ochranu osobnosti",
    scenario: "Zaměstnanec nemocniční IT podpory stáhl a na internetu prodal databázi lékařských zpráv a diagnóz 5 000 pacientů včetně údajů o psychiatrické léčbě.",
    legalText: "Kdo neoprávněně sdělí, zpřístupní nebo jinak zpracovává osobní údaje a způsobí tím vážnou újmu na právech nebo oprávněných zájmech osoby, bude potrestán až na tři léta nebo zákazem činnosti.",
    statutoryMinYears: 0,
    statutoryMaxYears: 3,
    statutoryText: "až 3 roky odnětí svobody, zákaz činnosti nebo peněžitý trest",
    courtStats: {
      unconditionalPrisonPct: 8,
      probationPct: 76,
      finePct: 16,
      otherPct: 0,
      avgPrisonSentenceMonths: 14,
      avgSentenceDescription: "Soudy ukládají primárně podmíněné a peněžité tresty spolu s doživotním zákazem práce s citlivými databázemi."
    },
    harmAnalysis: {
      victimHarm: "Nevratná ztráta soukromí u tisíců lidí, riziko vydírání, diskriminace v práci a hluboká stigmatizace.",
      societalImpact: "Oslabení důvěry pacientů v digitalizaci zdravotnictví a bezpečnost státních a soukromých registrů.",
      harmScore: 62
    }
  },
  {
    id: "vyroba-drog-organizovana",
    name: "Nedovolená výroba a distribuce drog (ve velkém rozsahu)",
    paragraph: "§ 283 odst. 1, 3 TZ",
    category: "VerejnyPoradek",
    categoryLabel: "Trestné činy obecně ohrožující",
    scenario: "Člen mezinárodního gangu provozoval průmyslovou velkopěstírnu konopí a varnu metamfetaminu (pervitinu) a distribuoval desítky kilogramů drog do pouličního prodeje.",
    legalText: "Kdo neoprávněně vyrobí, doveze, vyveze nebo prodá omamnou látku ve velkém rozsahu nebo jako člen organizované skupiny, bude potrestán na osm až dvanáct let.",
    statutoryMinYears: 8,
    statutoryMaxYears: 12,
    statutoryText: "8 až 12 let odnětí svobody",
    courtStats: {
      unconditionalPrisonPct: 88,
      probationPct: 12,
      finePct: 0,
      otherPct: 0,
      avgPrisonSentenceMonths: 84, // cca 7 let
      avgSentenceDescription: "Výroba a distribuce drog ve velkém je v ČR trestána velice tvrdě; nepodmíněný trest se pohybuje typicky v rozmezí 6–9 let."
    },
    harmAnalysis: {
      victimHarm: "Tisíce zničených životů závislých, rozpad jejich rodin, nevratná destrukce fyzického i duševního zdraví konzumentů.",
      societalImpact: "Generování masivní návazné kriminality (krádeže, prostituce, násilí), financování organizovaného zločinu a vysoké náklady na léčbu závislostí.",
      harmScore: 88
    }
  },
  {
    id: "legalizace-vynosu",
    name: "Legalizace výnosů z trestné činnosti (Praní špinavých peněz)",
    paragraph: "§ 216 odst. 1, 3 TZ",
    category: "Hospodarske",
    categoryLabel: "Hospodářské trestné činy",
    scenario: "Finanční poradce pral peníze pocházející z prodeje nelegálních zbraní přes složité offshore účty a fiktivní nákupy nemovitostí v hodnotě 80 milionů Kč.",
    legalText: "Kdo zastírá původ nebo usnadňuje zjištění původu věci, která byla získána trestnou činností, a získá tím pro sebe nebo jiného značný prospěch, bude potrestán na tři až osm let.",
    statutoryMinYears: 3,
    statutoryMaxYears: 8,
    statutoryText: "3 až 8 let odnětí svobody nebo peněžitý trest",
    courtStats: {
      unconditionalPrisonPct: 45,
      probationPct: 50,
      finePct: 5,
      otherPct: 0,
      avgPrisonSentenceMonths: 48,
      avgSentenceDescription: "Soudy ukládají nepodmíněné tresty a zabavení veškerého nelegálně legalizovaného majetku."
    },
    harmAnalysis: {
      victimHarm: "Umožňuje zločincům bezpečně užívat plody krádeží, vražd a obchodu s drogami, čímž dává zločinu ekonomický smysl.",
      societalImpact: "Destabilizace legálního finančního trhu, narušení hospodářské soutěže a prorůstání mafiánských struktur do legitimního byznysu.",
      harmScore: 72
    }
  },
  {
    id: "poskozeni-cizi-veci",
    name: "Poškození cizí věci (vandalismus na historické památce)",
    paragraph: "§ 228 odst. 1, 2 TZ",
    category: "Majetek",
    categoryLabel: "Trestné činy proti majetku",
    scenario: "Pachatel posprejoval velkými nápisy fasádu historického barokního kostela zapsaného na seznamu kulturních památek a způsobil škodu na restaurování ve výši 120 000 Kč.",
    legalText: "Kdo poškodí cizí věc tím, že ji postříká, pomaluje nebo popíše barvou, nebo způsobí škodu na věci požívající zvláštní ochrany podle jiného právního předpisu, bude potrestán odnětím svobody na šest měsíců až tři léta.",
    statutoryMinYears: 0.5,
    statutoryMaxYears: 3,
    statutoryText: "6 měsíců až 3 roky odnětí svobody nebo peněžitý trest",
    courtStats: {
      unconditionalPrisonPct: 10,
      probationPct: 70,
      finePct: 15,
      otherPct: 5,
      avgPrisonSentenceMonths: 12,
      avgSentenceDescription: "Soudy téměř výhradně ukládají podmíněné tresty a povinnost uhradit náklady na odborné zrestaurování."
    },
    harmAnalysis: {
      victimHarm: "Nevratné či nákladné poškození kulturního dědictví patřícího celé společnosti.",
      societalImpact: "Znehodnocení veřejného prostoru, degradace estetické a historické hodnoty měst.",
      harmScore: 35
    }
  },
  {
    id: "hanobeni-naroda",
    name: "Podněcování k nenávisti a hanobení národa, rasy a přesvědčení",
    paragraph: "§ 355 odst. 1, § 356 odst. 1 TZ",
    category: "VerejnyPoradek",
    categoryLabel: "Trestné činy proti lidskosti a lidské důstojnosti",
    scenario: "Vlivný internetový tvůrce s 80 000 sledujícími veřejně vyzýval k násilnému vyhnání a fyzické likvidaci národnostní menšiny v ČR a označoval její příslušníky za podlidi.",
    legalText: "Kdo veřejně hanobí některý národ, jeho jazyk, rasu nebo etnickou skupinu, nebo podněcuje k nenávisti vůči skupině osob, bude potrestán až na dvě léta; prostřednictvím internetu až na tři léta.",
    statutoryMinYears: 0,
    statutoryMaxYears: 3,
    statutoryText: "až 3 roky odnětí svobody nebo peněžitý trest",
    courtStats: {
      unconditionalPrisonPct: 14,
      probationPct: 68,
      finePct: 18,
      otherPct: 0,
      avgPrisonSentenceMonths: 12,
      avgSentenceDescription: "U online projevů nenávisti soudy často ukládají podmíněné tresty s delší zkušební dobou a citelné peněžité tresty."
    },
    harmAnalysis: {
      victimHarm: "Zastrašování nevinných občanů na základě jejich původu, strach vycházet na ulici, dehumanizace.",
      societalImpact: "Radikalizace společnosti, příprava půdy pro skutečné násilné etnické útoky a rozklad sociálního smíru.",
      harmScore: 64
    }
  },
  {
    id: "zanedbani-vyzivy",
    name: "Zanedbání povinné výživy (dluh na alimentech přes rok)",
    paragraph: "§ 196 odst. 1, 2 TZ",
    category: "SvobodaDostojnost",
    categoryLabel: "Trestné činy proti rodině a dětem",
    scenario: "Otec se úmyslně vyhýbal práci 'na černo', po dobu 18 měsíců nezaplatil ani korunu na své dvě nezletilé děti a dluží na výživném přes 120 000 Kč, čímž uvrhl matku samoživitelku do nouze.",
    legalText: "Kdo neplní svou zákonnou povinnost vyživovat nebo zaopatřovat jiného po dobu delší než čtyři měsíce, bude potrestán odnětím svobody až na jeden rok; vydá-li oprávněnou osobu v nebezpečí nouze, až na dvě léta.",
    statutoryMinYears: 0,
    statutoryMaxYears: 2,
    statutoryText: "až 2 roky odnětí svobody nebo podmíněné odsouzení",
    courtStats: {
      unconditionalPrisonPct: 22,
      probationPct: 72,
      finePct: 2,
      otherPct: 4,
      avgPrisonSentenceMonths: 10,
      avgSentenceDescription: "Soudy využívají podmínku k tlaku na splácení dluhu; nepodmíněný trest dostávají chroničtí neplatiči (často po přeměně podmínky)."
    },
    harmAnalysis: {
      victimHarm: "Přímé ohrožení základních životních potřeb dítěte (strava, kroužky, bydlení), enormní psychický tlak na pečujícího rodiče.",
      societalImpact: "Přenos břemene na státní sociální dávky, prohlubování dětské chudoby.",
      harmScore: 45
    }
  },
  {
    id: "prestupek-drobna-kradez",
    name: "Krádež zboží v obchodě (škoda do 10 000 Kč)",
    paragraph: "§ 8 odst. 1 písm. a) zák. č. 251/2016 Sb.",
    delictType: "prestupek",
    category: "Prestupky",
    categoryLabel: "Přestupky proti majetku",
    scenario: "Zákazník v supermarketu schoval do kapsy lahev alkoholu a drahé parfémy v celkové hodnotě 4 500 Kč a prošel pokladní zónou bez zaplacení, kde jej zadržela ostraha.",
    legalText: "Fyzická osoba se dopustí přestupku tím, že si přisvojí cizí věc krádeží, pokud způsobená škoda nepřesahuje 10 000 Kč. Za přestupek lze uložit pokutu do 50 000 Kč (při opakování do 70 000 Kč).",
    statutoryMinYears: 0,
    statutoryMaxYears: 0,
    statutoryFineMaxKc: 50000,
    statutoryText: "Přestupek: Pokuta až 50 000 Kč (při recidivě 70 000 Kč)",
    courtStats: {
      unconditionalPrisonPct: 0,
      probationPct: 0,
      finePct: 92,
      otherPct: 8,
      avgPrisonSentenceMonths: 0,
      avgSentenceDescription: "Projednáváno přestupkovou komisí obce či Policií ČR; sankcí je finanční pokuta a povinnost nahradit škodu."
    },
    harmAnalysis: {
      victimHarm: "Drobná majetková újma obchodu, zboží bylo zpravidla vráceno nepoškozené.",
      societalImpact: "Drobné parazitování na maloobchodě; při masovém výskytu zvyšuje náklady obchodníků na bezpečnostní systémy.",
      harmScore: 18
    }
  },
  {
    id: "prestupek-alkohol-pod-1-promile",
    name: "Řízení pod vlivem alkoholu do 1,0 ‰ (přestupek)",
    paragraph: "§ 125c odst. 1 písm. b) zák. č. 361/2000 Sb.",
    delictType: "prestupek",
    category: "Prestupky",
    categoryLabel: "Dopravní přestupky",
    scenario: "Řidič byl při namátkové silniční kontrole podroben dechové zkoušce s naměřenou hodnotou 0,7 promile alkoholu v dechu po dvou pivech vypitých k obědu.",
    legalText: "Fyzická osoba se dopustí přestupku tím, že řídí vozidlo ve stavu vylučujícím způsobilost, avšak nedosahujícím stavu těžké opilosti (do 1,0 ‰). Sankce: pokuta 7 000 až 25 000 Kč, zákaz řízení na 6 až 18 měsíců a 6 trestných bodů.",
    statutoryMinYears: 0,
    statutoryMaxYears: 0,
    statutoryFineMaxKc: 25000,
    statutoryText: "Přestupek: Pokuta 7 000 až 25 000 Kč + zákaz řízení 6–18 měsíců + 6 bodů",
    courtStats: {
      unconditionalPrisonPct: 0,
      probationPct: 0,
      finePct: 98,
      otherPct: 2,
      avgPrisonSentenceMonths: 0,
      avgSentenceDescription: "Řešeno obecním úřadem obce s rozšířenou působností; obligatorně se ukládá citelná pokuta a zákaz řízení."
    },
    harmAnalysis: {
      victimHarm: "Ke škodě ani nehodě nedošlo, šlo o preventivní zadržení podnapilého řidiče.",
      societalImpact: "Snížení reakční doby řidiče a zvýšení statistického rizika kolize na pozemních komunikacích.",
      harmScore: 32
    }
  },
  {
    id: "prestupek-rychlost-obec-40",
    name: "Překročení rychlosti v obci o více než 40 km/h",
    paragraph: "§ 125c odst. 1 písm. f) bod 1 zák. č. 361/2000 Sb.",
    delictType: "prestupek",
    category: "Prestupky",
    categoryLabel: "Dopravní přestupky",
    scenario: "Mladý řidič jel v obci v zástavbě rodinných domů rychlostí 98 km/h namísto povolených 50 km/h, což zaznamenal stacionární radar městské policie.",
    legalText: "Překročení nejvyšší dovolené rychlosti v obci o 40 km/h a více. Sankce: pokuta ve správním řízení 7 000 až 25 000 Kč, zákaz řízení na 6 až 18 měsíců a 6 bodů.",
    statutoryMinYears: 0,
    statutoryMaxYears: 0,
    statutoryFineMaxKc: 25000,
    statutoryText: "Přestupek: Pokuta 7 000 až 25 000 Kč + zákaz řízení 6–18 měsíců + 6 bodů",
    courtStats: {
      unconditionalPrisonPct: 0,
      probationPct: 0,
      finePct: 96,
      otherPct: 4,
      avgPrisonSentenceMonths: 0,
      avgSentenceDescription: "Nelze řešit na místě příkazovým blokem; ve správním řízení se standardně ukládá zákaz řízení."
    },
    harmAnalysis: {
      victimHarm: "Bez přímého zranění, avšak vznik extrémně nebezpečné brzdné dráhy v obytné zóně.",
      societalImpact: "Hrubá bezohlednost vůči chodcům a cyklistům, výrazné navýšení rizika fatálních nehod.",
      harmScore: 36
    }
  },
  {
    id: "prestupek-jizda-cervena",
    name: "Jízda na červenou (nezastavení na signál STŮJ)",
    paragraph: "§ 125c odst. 1 písm. f) bod 5 zák. č. 361/2000 Sb.",
    delictType: "prestupek",
    category: "Prestupky",
    categoryLabel: "Dopravní přestupky",
    scenario: "Řidič ve snaze stihnout křižovatku projel frekventovanou křižovatku 3 sekundy po naskočení červeného světla a donutil odbočující vozidlo prudce zabrzdit.",
    legalText: "Nezastavení vozidla na signál, který přikazuje řidiči zastavit (červené světlo). Sankce: pokuta 4 500 až 9 000 Kč ve správním řízení (nebo 2 500 až 3 500 Kč na místě) a 6 trestných bodů.",
    statutoryMinYears: 0,
    statutoryMaxYears: 0,
    statutoryFineMaxKc: 9000,
    statutoryText: "Přestupek: Pokuta 4 500 až 9 000 Kč (na místě 3 500 Kč) + 6 bodů",
    courtStats: {
      unconditionalPrisonPct: 0,
      probationPct: 0,
      finePct: 99,
      otherPct: 1,
      avgPrisonSentenceMonths: 0,
      avgSentenceDescription: "Běžně řešeno na místě Policií ČR blokovou pokutou a připsáním 6 bodů do karty řidiče."
    },
    harmAnalysis: {
      victimHarm: "Vylekání a ohrožení druhého řidiče, naštěstí bez fyzického střetu.",
      societalImpact: "Narušení plynulosti a elementární předvídatelnosti provozu na křižovatkách.",
      harmScore: 26
    }
  },
  {
    id: "prestupek-mobil-za-volantem",
    name: "Používání mobilního telefonu za jízdy",
    paragraph: "§ 125c odst. 1 písm. f) bod 10 zák. č. 361/2000 Sb.",
    delictType: "prestupek",
    category: "Prestupky",
    categoryLabel: "Dopravní přestupky",
    scenario: "Řidič na dálnici při rychlosti 130 km/h držel v ruce mobilní telefon a psal textovou zprávu, přičemž nedodržoval jízdní pruh.",
    legalText: "Držení telefonního přístroje nebo jiného hovorového zařízení v ruce nebo jiným způsobem při řízení. Sankce: pokuta 2 500 až 3 500 Kč na místě (4 000 až 10 000 Kč ve správním) a 4 body.",
    statutoryMinYears: 0,
    statutoryMaxYears: 0,
    statutoryFineMaxKc: 10000,
    statutoryText: "Přestupek: Pokuta 2 500 až 3 500 Kč na místě (až 10 000 Kč ve správním) + 4 body",
    courtStats: {
      unconditionalPrisonPct: 0,
      probationPct: 0,
      finePct: 99,
      otherPct: 1,
      avgPrisonSentenceMonths: 0,
      avgSentenceDescription: "Masový přestupek, řešený nejčastěji na místě blokovou pokutou a 4 trestnými body."
    },
    harmAnalysis: {
      victimHarm: "Bezprostřední újma nevznikla, vzniká tzv. tunelové vidění a ztráta pozornosti.",
      societalImpact: "Jedna z nejčastějších příčin tragických dopravních nehod v důsledku nevěnování se řízení.",
      harmScore: 24
    }
  },
  {
    id: "prestupek-ruseni-nocniho-klidu",
    name: "Rušení nočního klidu (hlasitá hudba a párty)",
    paragraph: "§ 5 odst. 1 písm. d) zák. č. 251/2016 Sb.",
    delictType: "prestupek",
    category: "Prestupky",
    categoryLabel: "Přestupky proti veřejnému pořádku",
    scenario: "Nájemník v panelovém domě ve dvě hodiny ráno pouštěl hlasitou hudbu s basy přes výkonnou reprosoustavu, čímž opakovaně vzbudil a vyrušil desítky sousedů v domě.",
    legalText: "Porušení nočního klidu v době od 22:00 do 06:00 hodin. Sankce: pokuta až do výše 10 000 Kč (při opakování až 15 000 Kč).",
    statutoryMinYears: 0,
    statutoryMaxYears: 0,
    statutoryFineMaxKc: 10000,
    statutoryText: "Přestupek: Pokuta až 10 000 Kč (opakovaně až 15 000 Kč)",
    courtStats: {
      unconditionalPrisonPct: 0,
      probationPct: 0,
      finePct: 88,
      otherPct: 12,
      avgPrisonSentenceMonths: 0,
      avgSentenceDescription: "Řešeno městskou policií výjezdem na místo, domluvou či blokovou pokutou na místě (do 2 000 Kč)."
    },
    harmAnalysis: {
      victimHarm: "Spánková deprivace, vyčerpání, podrážděnost sousedů a narušení odpočinku před prací.",
      societalImpact: "Eroze dobrých sousedských vztahů a bezohlednost v komunitním bydlení.",
      harmScore: 12
    }
  },
  {
    id: "prestupek-urazka-na-cti",
    name: "Ublížení na cti (vulgární urážka souseda)",
    paragraph: "§ 7 odst. 1 písm. a) zák. č. 251/2016 Sb.",
    delictType: "prestupek",
    category: "Prestupky",
    categoryLabel: "Přestupky proti občanskému soužití",
    scenario: "Pachatel při sousedském sporu o parkovací místo před ostatními obyvateli domu vulgárně nadával sousedce, označil ji za zlodějku a psychopatku a plivl před ni.",
    legalText: "Fyzická osoba se dopustí přestupku tím, že jinému ublíží na cti tím, že ho urazí nebo vydá v posměch. Sankce: pokuta až do výše 10 000 Kč.",
    statutoryMinYears: 0,
    statutoryMaxYears: 0,
    statutoryFineMaxKc: 10000,
    statutoryText: "Přestupek: Pokuta až 10 000 Kč",
    courtStats: {
      unconditionalPrisonPct: 0,
      probationPct: 0,
      finePct: 70,
      otherPct: 30,
      avgPrisonSentenceMonths: 0,
      avgSentenceDescription: "Projednáváno přestupkovou komisí obce; často končí smírem nebo uložením mírné pokuty."
    },
    harmAnalysis: {
      victimHarm: "Ponížení, rozrušení, poškození osobní důstojnosti před komunitou.",
      societalImpact: "Úpadek společenské slušnosti a kultivovaného řešení sporů mezi občany.",
      harmScore: 10
    }
  },
  {
    id: "prestupek-drobne-napadeni",
    name: "Fyzické napadení beze škody na zdraví (facka / strčení)",
    paragraph: "§ 7 odst. 1 písm. b) zák. č. 251/2016 Sb.",
    delictType: "prestupek",
    category: "Prestupky",
    categoryLabel: "Přestupky proti občanskému soužití",
    scenario: "Opilý muž v restauraci po slovní potyčce vrazil do druhého hosta a dal mu facku, která způsobila zrudnutí tváře bez potřeby lékařského ošetření či pracovní neschopnosti.",
    legalText: "Fyzická osoba se dopustí přestupku tím, že jinému ublíží na zdraví (drobné ublížení bez trvalých následků). Sankce: pokuta až do výše 20 000 Kč.",
    statutoryMinYears: 0,
    statutoryMaxYears: 0,
    statutoryFineMaxKc: 20000,
    statutoryText: "Přestupek: Pokuta až 20 000 Kč",
    courtStats: {
      unconditionalPrisonPct: 0,
      probationPct: 0,
      finePct: 85,
      otherPct: 15,
      avgPrisonSentenceMonths: 0,
      avgSentenceDescription: "Projednáváno městským úřadem po postoupení Policií ČR, která vyloučila trestní charakter činu."
    },
    harmAnalysis: {
      victimHarm: "Krátkodobá bolest, ponížení a strach, bez trvalé poruchy zdraví.",
      societalImpact: "Fyzická agrese na veřejnosti narušující pocit bezpečí návštěvníků podniku.",
      harmScore: 20
    }
  },
  {
    id: "prestupek-drzeni-maleho-mnozstvi-drog",
    name: "Držení malého množství drog pro vlastní potřebu",
    paragraph: "§ 39 odst. 2 písm. a) zák. č. 167/1998 Sb.",
    delictType: "prestupek",
    category: "Prestupky",
    categoryLabel: "Přestupky na úseku návykových látek",
    scenario: "Mladík byl na hudebním festivalu zkontrolován policií a měl u sebe v kapse 2 gramy sušiny konopí (marihuany) určené výhradně pro jeho vlastní osobní spotřebu.",
    legalText: "Neoprávněné přechovávání omamné nebo psychotropní látky v množství nikoli větším než malém (do 10 g konopí / 1,5 g pervitinu). Sankce: pokuta až do výše 15 000 Kč a propadnutí látky.",
    statutoryMinYears: 0,
    statutoryMaxYears: 0,
    statutoryFineMaxKc: 15000,
    statutoryText: "Přestupek: Pokuta až 15 000 Kč + propadnutí látky",
    courtStats: {
      unconditionalPrisonPct: 0,
      probationPct: 0,
      finePct: 90,
      otherPct: 10,
      avgPrisonSentenceMonths: 0,
      avgSentenceDescription: "Řešeno Policií ČR na místě nebo obecním úřadem ve správním řízení uložením pokuty."
    },
    harmAnalysis: {
      victimHarm: "Pachatel škodí pouze svému vlastnímu zdraví, nevzniká přímá oběť.",
      societalImpact: "Podpora nelegálního trhu s drogami nákupem látky, zdravotní rizika spojená s konzumací.",
      harmScore: 14
    }
  },
  {
    id: "prestupek-cerny-vylep-odpad",
    name: "Znečištění veřejného prostranství / nepovolený výlep plakátů",
    paragraph: "§ 5 odst. 1 písm. f) zák. č. 251/2016 Sb.",
    delictType: "prestupek",
    category: "Prestupky",
    categoryLabel: "Přestupky proti veřejnému pořádku",
    scenario: "Pořadatel koncertu neoprávněně polepil lepidlem sloupy veřejného osvětlení a zastávku MHD desítkami reklamních letáků na komerční akci.",
    legalText: "Znečištění veřejného prostranství nebo neoprávněné užívání veřejného prostranství pro reklamu. Sankce: pokuta až do výše 20 000 Kč.",
    statutoryMinYears: 0,
    statutoryMaxYears: 0,
    statutoryFineMaxKc: 20000,
    statutoryText: "Přestupek: Pokuta až 20 000 Kč",
    courtStats: {
      unconditionalPrisonPct: 0,
      probationPct: 0,
      finePct: 94,
      otherPct: 6,
      avgPrisonSentenceMonths: 0,
      avgSentenceDescription: "Ukládá městská policie nebo odbor životního prostředí obce."
    },
    harmAnalysis: {
      victimHarm: "Náklady města na čištění a odstranění lepidla a plakátů.",
      societalImpact: "Vizuální smog, neoprávněné komerční využívání společného prostoru občanů.",
      harmScore: 8
    }
  }
];

// Export do globálního prostoru pro browser
if (typeof window !== "undefined") {
  window.CRIMES_DATA = CRIMES_DATA;
}


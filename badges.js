window.BadgesRegistry = {
  imageBase: "images/Odznaki/",
  labels: {
    title: {
      pl: "Odznaki",
      en: "Badges"
    },
    empty: {
      pl: "Nie zdobyto jeszcze zadnej odznaki.",
      en: "No badges earned yet."
    }
  },
  items: {
    // ===== METAPOZIOM =====
    philosophical: {
      id: "philosophical",
      questionId: 0,
      answerValue: 1.0,
      name: {
        pl: "Wykonywany filozoficznie",
        en: "Taken philosophically"
      },
      description: {
        pl: "Pierwsza odpowiedz wskazuje, ze traktujesz test przede wszystkim jako namysl nad pojeciami i zalozeniami.",
        en: "Your first answer suggests you are taking the test mainly as a reflection on concepts and assumptions."
      }
    },
    political: {
      id: "political",
      questionId: 0,
      answerValue: -1.0,
      name: {
        pl: "Wykonywany politycznie",
        en: "Taken politically"
      },
      description: {
        pl: "Pierwsza odpowiedz wskazuje, ze traktujesz test przede wszystkim jako praktyczne stanowisko polityczne.",
        en: "Your first answer suggests you are taking the test mainly as a practical political position."
      }
    },

    // ===== GRUPA I: FUNDAMENTALNE ŹRÓDŁO WŁADZY I LEGITYMIZACJA =====
    divineRight: {
      id: "divineRight",
      name: { pl: "Boskie prawo", en: "Divine right" },
      description: {
        pl: "Legitymizacja władzy politycznej przez wolę Bożą; monarcha lub władca odpowiada przed Bogiem, nie przed ludem; sprzeciw wobec monarchy jest grzechem.",
        en: "Legitimisation of political power through divine will; the monarch or ruler answers to God, not to the people; opposition to the monarch is a sin."
      },
      requiredYes: [39, 280, 281, 37],
      requiredNo: [38]
    },
    socialContract: {
      id: "socialContract",
      name: { pl: "Umowa społeczna", en: "Social contract" },
      description: {
        pl: "Legitymizacja państwa przez zgodę rządzonych; państwo ma moralny status, ale władza pochodzi od ludu; odrzucenie boskiego prawa i anarchii.",
        en: "Legitimisation of the state through the consent of the governed; the state has moral status, but power comes from the people; rejection of divine right and anarchy."
      },
      requiredYes: [38, 52],
      requiredNo: [37, 39, 48]
    },
    stateLegitimacy: {
      id: "stateLegitimacy",
      name: { pl: "Legitymacja państwa", en: "State legitimacy" },
      description: {
        pl: "Uznanie państwa za posiadające moralny autorytet do sprawowania władzy i stosowania przymusu; obywatele mają obowiązek posłuszeństwa; odrzucenie anarchii.",
        en: "Recognition of the state as having moral authority to exercise power and apply coercion; citizens have a duty of obedience; rejection of anarchy."
      },
      requiredYes: [52],
      requiredNo: [48, 314, 339]
    },
    naturalLaw: {
      id: "naturalLaw",
      name: { pl: "Prawo naturalne", en: "Natural law" },
      description: {
        pl: "Przekonanie o istnieniu przyrodzonych praw jednostki, niezależnych od państwa; wszystkie istoty ludzkie są równe moralnie; odrzucenie pozytywizmu prawnego.",
        en: "Belief in the existence of inherent individual rights, independent of the state; all human beings are morally equal; rejection of legal positivism."
      },
      requiredYes: [18, 273],
      requiredNo: [21, 339]
    },
    constitutionalism: {
      id: "constitutionalism",
      name: { pl: "Konstytucjonalizm", en: "Constitutionalism" },
      description: {
        pl: "Ograniczanie władzy przez konstytucję i podział władzy; ochrona praw mniejszości; władza wykonawcza ograniczona przez instytucje; przeciwność koncentracji władzy.",
        en: "Limiting power through a constitution and separation of powers; protection of minority rights; executive power limited by institutions; opposition to concentration of power."
      },
      requiredYes: [63, 64, 289, 337, 56],
      requiredNo: [71, 37, 340]
    },
    directDemocracy: {
      id: "directDemocracy",
      name: { pl: "Demokracja bezpośrednia", en: "Direct democracy" },
      description: {
        pl: "Decyzje polityczne podejmowane bezpośrednio przez obywateli w głosowaniach; aktywny udział w zarządzaniu; odrzucenie rządów elit.",
        en: "Political decisions taken directly by citizens in votes; active participation in governance; rejection of elite rule."
      },
      requiredYes: [59, 287],
      requiredNo: [42, 62, 74]
    },
    deliberativeDemocracy: {
      id: "deliberativeDemocracy",
      name: { pl: "Demokracja deliberatywna", en: "Deliberative democracy" },
      description: {
        pl: "Demokracja oparta na debacie i refleksji; obywatele aktywnie uczestniczą w dyskusji; tolerancja i wolność słowa; odrzucenie głosowania bezpośredniego i cenzury.",
        en: "Democracy based on debate and reflection; citizens actively participate in discussion; tolerance and freedom of speech; rejection of direct voting and censorship."
      },
      requiredYes: [287, 17, 154, 157],
      requiredNo: [42, 59, 160]
    },
    liberalDemocracy: {
      id: "liberalDemocracy",
      name: { pl: "Demokracja liberalna", en: "Liberal democracy" },
      description: {
        pl: "Demokracja przedstawicielska z ochroną praw jednostki, podziałem władzy, prawami mniejszości i konkurencją polityczną; odrzucenie autorytaryzmu.",
        en: "Representative democracy with protection of individual rights, separation of powers, minority rights and political competition; rejection of authoritarianism."
      },
      requiredYes: [38, 18, 63, 289, 302],
      requiredNo: [37, 71, 86, 91]
    },
    representativeDemocracy: {
      id: "representativeDemocracy",
      name: { pl: "Demokracja reprezentacyjna", en: "Representative democracy" },
      description: {
        pl: "System, w którym obywatele wybierają przedstawicieli do podejmowania decyzji; równość głosów; konkurencja polityczna; odrzucenie demokracji bezpośredniej i rządów elit.",
        en: "A system in which citizens elect representatives to make decisions; equality of votes; political competition; rejection of direct democracy and elite rule."
      },
      requiredYes: [38, 61, 302],
      requiredNo: [59, 62, 42, 74]
    },
    radicalDemocracy: {
      id: "radicalDemocracy",
      name: { pl: "Demokracja radykalna", en: "Radical democracy" },
      description: {
        pl: "Demokracja partycypacyjna z szerokim rozproszeniem władzy i autonomią lokalną; odrzucenie elit i centralizacji.",
        en: "Participatory democracy with broad dispersion of power and local autonomy; rejection of elites and centralisation."
      },
      requiredYes: [65, 287, 69],
      requiredNo: [74, 67, 42]
    },
    majoritarianism: {
      id: "majoritarianism",
      name: { pl: "Majoryzacja", en: "Majoritarianism" },
      description: {
        pl: "Uznanie, że decyzje większości są legitymizowane demokratycznie; prawo powinno odzwierciedlać wartości większości; ograniczenia praw mniejszości są niepożądane.",
        en: "Recognition that majority decisions are democratically legitimate; law should reflect the values of the majority; restrictions on minority rights are undesirable."
      },
      requiredYes: [38, 357],
      requiredNo: [289, 337, 64]
    },
    centrism: {
      id: "centrism",
      name: {
        pl: "Centryzm",
        en: "Centrism"
      },
      description: {
        pl: "Dążenie do równowagi między różnymi opcjami politycznymi, poparcie dla stopniowych reform, gospodarki mieszanej i pokojowych zmian.",
        en: "Striving for balance between different political options, support for gradual reforms, mixed economy and peaceful change."
      },
      requiredYes: [82, 83, 148, 302],
      requiredNo: [80, 86, 96, 101, 103, 115, 152, 309]
    },

    // ===== GRUPA II: KSZTAŁT I STRUKTURA PAŃSTWA =====
    monarchism: {
      id: "monarchism",
      name: { pl: "Monarchizm", en: "Monarchism" },
      description: {
        pl: "Doktryna polityczna uznająca monarchę (króla, cesarza, księcia itp.) za prawowitą głowę państwa. Może występować w różnych formach - od monarchii ceremonialnej po absolutną.",
        en: "A political doctrine that recognises a monarch (king, emperor, prince, etc.) as the legitimate head of state. It can take various forms – ranging from a ceremonial monarchy to an absolute monarchy."
      },
      requiredYes: [41, 296, 37],
      requiredNo: []
    },
    absoluteMonarchy: {
      id: "absoluteMonarchy",
      name: { pl: "Monarchia absolutna", en: "Absolute monarchy" },
      description: {
        pl: "Forma monarchii, w której władca skupia w swoich rękach władzę ustawodawczą, wykonawczą i sądowniczą, bez ograniczeń instytucjonalnych ani odpowiedzialności prawnej.",
        en: "A form of monarchy in which the ruler concentrates legislative, executive, and judicial power, without institutional limits or legal accountability."
      },
      requiredYes: [41, 72, 295, 297, 71],
      requiredNo: [63, 64, 38]
    },
    constitutionalMonarchy: {
      id: "constitutionalMonarchy",
      name: { pl: "Monarchia konstytucyjna", en: "Constitutional monarchy" },
      description: {
        pl: "Monarchia, w której władza monarchy jest ograniczona konstytucją i parlamentem; dziedziczny monarcha pełni funkcję głowy państwa, ale rządzi parlament.",
        en: "Monarchy in which the monarch's power is limited by a constitution and parliament; hereditary monarch serves as head of state, but parliament governs."
      },
      requiredYes: [41, 38, 63, 296, 289],
      requiredNo: [37, 72, 71, 295]
    },
    federalism: {
      id: "federalism",
      name: { pl: "Federalizm", en: "Federalism" },
      description: {
        pl: "System organizacji państwa, w którym kompetencje są podzielone pomiędzy ośrodek centralny a jednostki składowe (stany, kantony), posiadające własne budżety i systemy prawne.",
        en: "A system of state organisation in which powers are divided between the central government and constituent units (states, cantons), each of which has its own budget and legal system."
      },
      requiredYes: [65, 70, 69, 292],
      requiredNo: [67, 73]
    },
    confederalism: {
      id: "confederalism",
      name: { pl: "Konfederalizm", en: "Confederalism" },
      description: {
        pl: "Model organizacji politycznej, w którym suwerenne jednostki polityczne współpracują w ramach luźnego związku zachowując szeroką niezależność.",
        en: "A constitutional model in which central authority is limited to coordinating functions, while real power remains with regional units."
      },
      requiredYes: [67, 65, 293, 292],
      requiredNo: [73, 74]
    },
    europeanFederalism: {
      id: "europeanFederalism",
      name: { pl: "Federalizm europejski", en: "European federalism" },
      description: {
        pl: "Dążenie do zjednoczenia Europy w federację, zniesienie granic, swobodny przepływ; władza zdecentralizowana; odrzucenie suwerenności narodowej i nacjonalizmu.",
        en: "Aim to unite Europe into a federation, abolish borders, free movement; decentralised power; rejection of national sovereignty and nationalism."
      },
      requiredYes: [234, 135, 65, 368, 67],
      requiredNo: [364, 206, 228, 363]
    },
    nationState: {
      id: "nationState",
      name: { pl: "Państwo narodowe", en: "Nation state" },
      description: {
        pl: "Zasada, że państwo powinno odpowiadać narodowi; suwerenność narodowa jako nadrzędna; granice państwa powinny pokrywać się z granicami narodowości.",
        en: "The principle that the state should correspond to the nation; national sovereignty as supreme; state borders should coincide with national boundaries."
      },
      requiredYes: [205, 206, 363, 364, 210],
      requiredNo: [234, 372]
    },
    cityState: {
      id: "cityState",
      name: {
        pl: "Państwo-miasto",
        en: "City state"
      },
      description: {
        pl: "Model polityczny, w którym suwerenność spoczywa na poziomie miasta lub gminy, z silną autonomią lokalną i decentralizacją.",
        en: "A political model in which sovereignty lies at the city or municipal level, with strong local autonomy and decentralisation."
      },
      requiredYes: [65, 69, 70, 292, 293, 301],
      requiredNo: [88, 206]
    },
    regionalism: {
      id: "regionalism",
      name: {
        pl: "Regionalizm",
        en: "Regionalism"
      },
      description: {
        pl: "Dążenie do przyznania regionom szerokiej autonomii, ochrony różnorodności kulturowej i decentralizacji władzy.",
        en: "Striving for broad autonomy for regions, protection of cultural diversity and decentralisation of power."
      },
      requiredYes: [65, 69, 70, 232, 292, 294],
      requiredNo: [57, 233]
    },
    secessionism: {
      id: "secessionism",
      name: { pl: "Secesjonizm", en: "Secessionism" },
      description: {
        pl: "Dążenie konkretnej grupy lub regionu do formalnego odłączenia się od istniejącej formacji politycznej (państwa) w celu utworzenia własnego, niepodległego podmiotu.",
        en: "The aspiration of a specific group or region to formally secede from an existing political entity (a state) in order to establish its own independent entity."
      },
      requiredYes: [301],
      requiredNo: [88, 364]
    },
    ethnicSeparatism: {
      id: "ethnicSeparatism",
      name: { pl: "Separatyzm etniczny", en: "Ethnic separatism" },
      description: {
        pl: "Przekonanie, że przynależność narodowa powinna być oparta na pochodzeniu etnicznym, a granice państw powinny odpowiadać granicom narodowości.",
        en: "The belief that national identity should be based on ethnic origin, and that state borders should correspond to the boundaries of nationalities."
      },
      requiredYes: [216, 215, 363, 233],
      requiredNo: [232, 234, 227]
    },

    // ===== GRUPA III: ZAKRES WŁADZY I ROLA PAŃSTWA =====
    totalitarianism: {
      id: "totalitarianism",
      name: { pl: "Totalitaryzm", en: "Totalitarianism" },
      description: {
        pl: "Wszechogarniający system władzy, który dąży do całkowitej kontroli nad każdym aspektem życia społecznego i prywatnego. Likwiduje społeczeństwo obywatelskie i sferę prywatną, narzucając obywatelom jednolitą ideologię i wymagając bezwzględnego posłuszeństwa.",
        en: "An all-encompassing system of power that seeks total control over every aspect of public and private life. It dismantles civil society and the private sphere, imposing a single ideology on citizens and demanding absolute obedience."
      },
      requiredYes: [75, 76, 91, 89, 160],
      requiredNo: [153, 302, 157]
    },
    statolatry: {
      id: "statolatry",
      name: { pl: "Statolatria", en: "Statolatry" },
      description: {
        pl: "Uznanie państwa za najwyższą wartość, której interesy są nadrzędne wobec interesów jednostki, wymagające pełnego posłuszeństwa obywateli.",
        en: "Recognition of the state as the highest value, whose interests take precedence over individual interests, demanding full obedience from citizens."
      },
      requiredYes: [9, 10, 57, 263, 52],
      requiredNo: [48, 56, 4]
    },
    authoritarianism: {
      id: "authoritarianism",
      name: { pl: "Autorytaryzm", en: "Authoritarianism" },
      description: {
        pl: "System władzy oparty na silnym przywództwie, koncentracji władzy i ograniczonej odpowiedzialności wobec obywateli; jedność i dyscyplina są nadrzędne.",
        en: "A power system based on strong leadership, concentration of power and limited accountability to citizens; unity and discipline are paramount."
      },
      requiredYes: [37, 71, 73, 76, 77],
      requiredNo: [38, 63, 64]
    },
    oligarchy: {
      id: "oligarchy",
      name: { pl: "Oligarchia", en: "Oligarchy" },
      description: {
        pl: "System rządów, w którym władza polityczna jest skoncentrowana w rękach niewielkiej grupy ludzi, organizacji lub elit.",
        en: "A system of governance where political power is concentrated in the control of a small group of people, an organisation or an elite."
      },
      requiredYes: [74, 169, 171, 37],
      requiredNo: [38, 61, 65]
    },
    technocracy: {
      id: "technocracy",
      name: { pl: "Technokracja", en: "Technocracy" },
      description: {
        pl: "Koncepcja, według której decyzje publiczne powinny być podejmowane głównie przez ekspertów i specjalistów posiadających specjalistyczną wiedzę techniczną lub naukową.",
        en: "The concept that public decisions should be taken primarily by experts and specialists with specialist technical or scientific knowledge."
      },
      requiredYes: [42, 283, 284],
      requiredNo: [59]
    },
    corporatism: {
      id: "corporatism",
      name: { pl: "Korporacjonizm", en: "Corporatism" },
      description: {
        pl: "Model organizacji społeczeństwa i gospodarki oparty na współpracy zinstytucjonalizowanych grup zawodowych, gospodarczych lub społecznych uczestniczących w procesie decyzyjnym.",
        en: "A model of social and economic organisation based on cooperation between institutionalised professional, economic or social groups involved in the decision-making process."
      },
      requiredYes: [298, 299, 78, 212],
      requiredNo: [261, 112]
    },
    welfareState: {
      id: "welfareState",
      name: { pl: "Państwo opiekuńcze", en: "Welfare state" },
      description: {
        pl: "Model państwa, które przyjmuje na siebie odpowiedzialność za zapewnienie dobrobytu socjalnego swoim obywatelom. Działa jako mechanizm redystrybucji, oferując wsparcie w zakresie ochrony zdrowia, edukacji, mieszkalnictwa i zasiłków, dążąc do realizacji zasady równości szans.",
        en: "A model of the state that takes responsibility for ensuring the social welfare of its citizens. It acts as a mechanism for redistribution, providing support in the areas of healthcare, education, housing and benefits, with the aim of realising the principle of equal opportunities."
      },
      requiredYes: [55, 137],
      requiredNo: [139, 140, 320]
    },
    minimalState: {
      id: "minimalState",
      name: { pl: "Państwo minimalne", en: "Minimal state" },
      description: {
        pl: "Model państwa ograniczający swoje funkcje głównie do ochrony podstawowych praw jednostki, takich jak życie, wolność i własność, realizująca jedynie funkcje wojskowe, policyjne i sądownicze. Jego celem jest zapewnienie maksymalnej dostępnej wolności w ramach jasno określonej praworządności.",
        en: "A model of the state that limits its functions primarily to the protection of fundamental individual rights, such as life, liberty and property, and which performs only military, police and judicial functions. Its aim is to ensure the maximum possible freedom within the framework of a clearly defined rule of law."
      },
      requiredYes: [53, 286, 116, 52],
      requiredNo: [55, 57, 58, 102, 50]
    },
    civilSociety: {
      id: "civilSociety",
      name: { pl: "Społeczeństwo obywatelskie", en: "Civil society" },
      description: {
        pl: "Przekonanie, że problemy społeczne powinny być rozwiązywane przez inicjatywy obywatelskie, a nie państwo; władza rozproszona; przeciwność etatyzmowi.",
        en: "The belief that social problems should be solved through civic initiatives rather than the state; power distributed; opposition to statism."
      },
      requiredYes: [54, 65],
      requiredNo: [57, 75, 89]
    },
    anarchism: {
      id: "anarchism",
      name: { pl: "Anarchizm", en: "Anarchism" },
      description: {
        pl: "Nurt polityczny postulujący zniesienie państwa oraz innych hierarchicznych struktur władzy opartych na przymusie i zastąpienie ich dobrowolnymi formami organizacji społecznej.",
        en: "A political ideology that advocates the abolition of the state and other hierarchical power structures based on coercion, and their replacement with voluntary forms of social organisation."
      },
      requiredYes: [48, 49, 50],
      requiredNo: [52, 57, 338]
    },

    // ===== GRUPA IV: EKONOMIA I GOSPODARKA =====
    capitalism: {
      id: "capitalism",
      name: { pl: "Kapitalizm", en: "Capitalism" },
      description: {
        pl: "System gospodarczy oparty na prywatnej własności, wolnej konkurencji i zysku; innowacje i wzrost; odrzucenie socjalizacji środków produkcji i planowania.",
        en: "Economic system based on private property, free competition and profit; innovation and growth; rejection of socialisation of means of production and planning."
      },
      requiredYes: [94, 149, 114],
      requiredNo: [101, 152, 309]
    },
    freeMarket: {
      id: "freeMarket",
      name: { pl: "Wolny rynek", en: "Free market" },
      description: {
        pl: "Gospodarka oparta na prywatnej własności, konkurencji i mechanizmach rynkowych; minimalna interwencja państwa; przeciwność planowaniu i kontroli cen.",
        en: "An economy based on private property, competition and market mechanisms; minimal state intervention; opposition to planning and price controls."
      },
      requiredYes: [112, 114, 123, 121],
      requiredNo: [103, 127, 120]
    },
    laissezFaire: {
      id: "laissezFaire",
      name: { pl: "Leseferyzm", en: "Laissez‑faire" },
      description: {
        pl: "Zasada nieingerencji państwa w gospodarkę; mechanizmy rynkowe są efektywniejsze; odrzucenie interwencji państwa, redystrybucji i planowania.",
        en: "The principle of non‑intervention by the state in the economy; market mechanisms are more efficient; rejection of state intervention, redistribution and planning."
      },
      requiredYes: [112, 116, 132],
      requiredNo: [57, 58, 120, 137, 309]
    },
    freeTrade: {
      id: "freeTrade",
      name: { pl: "Wolny handel", en: "Free trade" },
      description: {
        pl: "Zniesienie ceł i barier handlowych; swobodny przepływ towarów i kapitału; równe traktowanie zagranicznych firm; przeciwność protekcjonizmowi.",
        en: "Abolition of tariffs and trade barriers; free movement of goods and capital; equal treatment of foreign companies; opposition to protectionism."
      },
      requiredYes: [135, 225, 136],
      requiredNo: [222, 224, 226, 315]
    },
    freeBanking: {
      id: "freeBanking",
      name: { pl: "Wolna bankowość", en: "Free banking" },
      description: {
        pl: "System finansowy pozbawiony centralnego nadzoru banku państwowego, w którym produkcja pieniądza i polityka kredytowa podlegają wyłącznie mechanizmom rynkowym.",
        en: "A financial system without central supervision by a state-owned bank, in which money creation and credit policy are governed solely by market mechanisms."
      },
      requiredYes: [133, 132],
      requiredNo: [58]
    },
    mercantilism: {
      id: "mercantilism",
      name: { pl: "Merkantylizm", en: "Mercantilism" },
      description: {
        pl: "Polityka gospodarcza nastawiona na kontrolę handlu zagranicznego, ochronę rodzimej produkcji i akumulację bogactwa narodowego; ograniczenie importu i kapitału zagranicznego.",
        en: "Economic policy oriented towards controlling foreign trade, protecting domestic production and accumulating national wealth; restricting imports and foreign capital."
      },
      requiredYes: [222, 223, 224, 226, 316, 317],
      requiredNo: [135, 225, 136]
    },
    autarky: {
      id: "autarky",
      name: { pl: "Autarkia", en: "Autarky" },
      description: {
        pl: "Model gospodarczy zorientowany na dążenie do całkowitej samowystarczalności gospodarczej. . Oznacza to poleganie wyłącznie na własnych zasobach i energii oraz uniezależnienie się od handlu międzynarodowego i rynków światowych.",
        en: "An economic model geared towards achieving complete economic self-sufficiency. This means relying solely on one’s own resources and energy, and becoming independent of international trade and global markets."
      },
      requiredYes: [316, 317, 222, 224],
      requiredNo: [135, 225]
    },
    socializedProduction: {
      id: "socializedProduction",
      name: { pl: "Uspołecznienie środków produkcji", en: "Socialization of the means of production" },
      description: {
        pl: "Pogląd, że środki produkcji powinny być własnością społeczną lub wspólnotową, a nie prywatną, a kolektywne formy organizacji produkcji powinny być preferowane.",
        en: "The view that the means of production should be socially or collectively owned rather than private, with cooperative forms of production organization being preferred."
      },
      requiredYes: [101, 109, 259],
      requiredNo: [94, 96, 149]
    },
    economicDemocracy: {
      id: "economicDemocracy",
      name: {
        pl: "Demokracja ekonomiczna",
        en: "Economic democracy"
      },
      description: {
        pl: "Koncepcja, w której decyzje gospodarcze są podejmowane demokratycznie przez pracowników i obywateli, z preferencją dla spółdzielni.",
        en: "A concept in which economic decisions are taken democratically by workers and citizens, with a preference for cooperatives."
      },
      requiredYes: [124, 259, 287],
      requiredNo: [103]
    },
    syndicalism: {
      id: "syndicalism",
      name: { pl: "Syndykalizm", en: "Syndicalism" },
      description: {
        pl: "Ruch robotniczy dążący do przejęcia kontroli nad środkami produkcji przez pracowników za pomocą związków zawodowych i strajków; odrzucenie partii politycznej i państwowej własności.",
        en: "A labour movement aiming to take control of the means of production by workers through trade unions and strikes; rejection of political party and state ownership."
      },
      requiredYes: [85, 108, 330, 145, 146],
      requiredNo: [86, 103]
    },
    communism: {
      id: "communism",
      name: { pl: "Komunizm", en: "Communism" },
      description: {
        pl: "Dążenie do wspólnej własności środków produkcji, społeczeństwa bezklasowego i odrzucenia rynku; zasada „od każdego według zdolności, każdemu według potrzeb”.",
        en: "Striving for common ownership of the means of production, a classless society and rejection of the market; principle 'from each according to ability, to each according to needs'."
      },
      requiredYes: [101, 110, 150, 152, 309, 307],
      requiredNo: [94, 149]
    },
    degrowth: {
      id: "degrowth",
      name: { pl: "Degrowth", en: "Degrowth" },
      description: {
        pl: "Przekonanie o konieczności ograniczenia konsumpcji i wzrostu gospodarczego, postrzegane jako warunek ochrony klimatu i zasobów planety",
        en: "The belief that consumption and economic growth must be curbed, seen as a prerequisite for protecting the climate and the planet’s resources."
      },
      requiredYes: [376, 243, 237],
      requiredNo: [114, 244]
    },
    landValueTax: {
      id: "landValueTax",
      name: {
        pl: "Podatek od wartości gruntu",
        en: "Land value tax"
      },
      description: {
        pl: "System opodatkowania oparty wyłącznie na wartości gruntu, bez podatków od pracy czy kapitału.",
        en: "A tax system based solely on land value, without taxes on labour or capital."
      },
      requiredYes: [97, 98, 99],
      requiredNo: [101]
    },
    noTaxes: {
      id: "noTaxes",
      name: { pl: "Brak podatków", en: "No taxes" },
      description: {
        pl: "Koncepcja postrzegająca opodatkowanie jako formę kradzieży lub wyzysku dokonywanego przez państwo, której nie można uzasadnić.",
        en: "The view that taxation is a form of theft or exploitation by the state that cannot be justified."
      },
      requiredYes: [314],
      requiredNo: [130, 55, 137]
    },

    // ===== GRUPA V: PRAWA, WOLNOŚCI I ICH GRANICE =====
    nonAggressionPrinciple: {
      id: "nonAggressionPrinciple",
      name: { pl: "Non‑aggression principle (NAP)", en: "Non‑aggression principle (NAP)" },
      description: {
        pl: "Zasada, że żadna jednostka ani grupa nie ma prawa inicjować użycia siły; jedynym dopuszczalnym użyciem siły jest samoobrona; prawa własności są nienaruszalne.",
        en: "The principle that no individual or group has the right to initiate the use of force; the only permissible use of force is self‑defence; property rights are inviolable."
      },
      requiredYes: [6, 14, 93, 167, 285],
      requiredNo: [13, 27]
    },
    freedomOfSpeechAbsolutism: {
      id: "freedomOfSpeechAbsolutism",
      name: {
        pl: "Absolutyzm wolności słowa",
        en: "Freedom of speech absolutism"
      },
      description: {
        pl: "Absolutna ochrona wolności słowa, bez żadnych ograniczeń prawnych, nawet dla treści obraźliwych.",
        en: "Absolute protection of freedom of speech, without any legal restrictions, even for offensive content."
      },
      requiredYes: [153, 154, 156, 157, 158],
      requiredNo: [155, 159, 160, 161, 336]
    },
    hateSpeechRestrictions: {
      id: "hateSpeechRestrictions",
      name: {
        pl: "Ograniczenia mowy nienawiści",
        en: "Hate speech restrictions"
      },
      description: {
        pl: "Postulat zakazu publicznego nawoływania do nienawiści wobec grup chronionych.",
        en: "Demand for a ban on public incitement to hatred against protected groups."
      },
      requiredYes: [155],
      requiredNo: [154, 156]
    },
    blasphemyRestrictions: {
      id: "blasphemyRestrictions",
      name: {
        pl: "Ograniczenie bluźnierstwa",
        en: "Blasphemy restrictions"
      },
      description: {
        pl: "Postulat ograniczenia wypowiedzi uznawanych za bluźniercze wobec religii.",
        en: "Demand for restrictions on speech considered blasphemous towards religion."
      },
      requiredYes: [161, 162, 191],
      requiredNo: [154, 270]
    },
    rightToBearArms: {
      id: "rightToBearArms",
      name: { pl: "Prawo do posiadania broni", en: "Right to bear arms" },
      description: {
        pl: "Poparcie dla powszechnej dostępności broni palnej dla obywateli.",
        en: "Support for the widespread availability of firearms to citizens."
      },
      requiredYes: [165],
      requiredNo: []
    },
    animalRights: {
      id: "animalRights",
      name: { pl: "Prawa zwierząt", en: "Animal rights" },
      description: {
        pl: "Poparcie dla prawnych ograniczeń nakładanych przez państwo na sposób traktowania zwierząt przez ludzi.",
        en: "Support for legal restrictions imposed by the state on how humans may treat animals."
      },
      requiredYes: [242],
      requiredNo: []
    },
    peacetimeConscription: {
      id: "peacetimeConscription",
      name: { pl: "Pobór w czasie pokoju", en: "Peacetime conscription" },
      description: {
        pl: "Poparcie dla obowiązkowej służby wojskowej obejmującej wszystkich lub prawie wszystkich obywateli, nawet w czasie pokoju.",
        en: "Support for mandatory military service covering all or nearly all citizens, even during peacetime."
      },
      requiredYes: [254, 253],
      requiredNo: [252]
    },
    genderEgalitarianism: {
      id: "genderEgalitarianism",
      name: {
        pl: "Równość płci",
        en: "Gender egalitarianism"
      },
      description: {
        pl: "Postulat pełnej równości płci we wszystkich sferach życia, bez narzucania tradycyjnych ról.",
        en: "Demand for full gender equality in all spheres of life, without imposing traditional roles."
      },
      requiredYes: [183, 184, 186, 187],
      requiredNo: [352]
    },
    patriarchalism: {
      id: "patriarchalism",
      name: { pl: "Patriarchalizm", en: "Patriarchalism" },
      description: {
        pl: "System społeczny, w którym mężczyźni sprawują dominującą pozycję w rodzinie i społeczeństwie; promowanie tradycyjnych ról płciowych i rodziny opartej na małżeństwie heteroseksualnym.",
        en: "A social system in which men hold a dominant position in the family and society; promotion of traditional gender roles and family based on heterosexual marriage."
      },
      requiredYes: [178, 179, 352],
      requiredNo: [183, 184, 186, 187, 188]
    },
    differenceFeminism: {
      id: "differenceFeminism",
      name: { pl: "Feminizm różnicy", en: "Difference feminism" },
      description: {
        pl: "Nurt feministyczny podkreślający odrębność kobiet, wartość kobiecych cech i potrzebę zwalczania patriarchatu; sprzeciw wobec tradycyjnych ról płciowych i homofobii.",
        en: "Feminist strand emphasising the distinctiveness of women, the value of feminine traits and the need to combat patriarchy; opposition to traditional gender roles and homophobia."
      },
      requiredYes: [183, 185],
      requiredNo: [186, 189, 179, 190]
    },

    // ===== GRUPA VI: RELIGIA I ŚWIATOPOGLĄD W PAŃSTWIE =====
    theocracy: {
      id: "theocracy",
      name: {
        pl: "Teokracja",
        en: "Theocracy"
      },
      description: {
        pl: "Ustrój, w którym władza polityczna jest uzasadniana i sprawowana w imię Boga, a prawo opiera się na religii.",
        en: "A system in which political power is justified and exercised in the name of God, and law is based on religion."
      },
      requiredYes: [39, 191, 193, 196, 197, 198, 199, 200],
      requiredNo: [201, 270]
    },
    religiousState: {
      id: "religiousState",
      name: { pl: "Państwo wyznaniowe", en: "Confessional state" },
      description: {
        pl: "System organizacji państwowej, w którym religia dyktuje zasady życia społecznego, gospodarczego i politycznego. W takim modelu prawo państwowe jest często zastępowane lub w pełni oparte na prawie objawionym, a religia nie jest ograniczona do sfery prywatnej.",
        en: "A system of state organisation in which religion dictates the rules governing social, economic and political life. In such a model, state law is often superseded by, or based entirely on, revealed law, and religion is not confined to the private sphere."
      },
      requiredYes: [196, 197, 193, 194],
      requiredNo: [270, 201, 355]
    },
    integralism: {
      id: "integralism",
      name: {
        pl: "Integryzm religijny",
        en: "Integralism"
      },
      description: {
        pl: "Doktryna, że religia powinna przenikać wszystkie aspekty życia społecznego i politycznego, a państwo powinno być podporządkowane prawu Bożemu.",
        en: "Doctrine that religion should permeate all aspects of social and political life, and the state should be subordinate to divine law."
      },
      requiredYes: [20, 32, 39, 191, 194, 196, 197, 198, 199, 251],
      requiredNo: [38, 201, 270, 344]
    },
    secularism: {
      id: "secularism",
      name: {
        pl: "Sekularyzm",
        en: "Secularism"
      },
      description: {
        pl: "Oddzielenie religii od państwa, neutralność światopoglądowa władz publicznych.",
        en: "Separation of religion from the state, worldview neutrality of public authorities."
      },
      requiredYes: [201, 270],
      requiredNo: [39, 191, 193, 196, 197, 198, 251]
    },
    stateAtheism: {
      id: "stateAtheism",
      name: { pl: "Ateizm państwowy", en: "State atheism" },
      description: {
        pl: "Polityka państwa polegająca na odrzuceniu i zwalczaniu instytucji religijnych, postrzegając religię jako źródło ucisku lub fałszywej świadomości",
        en: "A state policy of rejecting and combating religious institutions, viewing religion as a source of oppression or false consciousness"
      },
      requiredYes: [356],
      requiredNo: [191, 196, 281, 192]
    },

    // ===== GRUPA VII: SPOŁECZEŃSTWO, WSPÓLNOTA I TOŻSAMOŚĆ =====
    socialAtomism: {
      id: "socialAtomism",
      name: { pl: "Atomizm społeczny", en: "Social atomism" },
      description: {
        pl: "Pogląd, że społeczeństwo jest agregatem autonomicznych jednostek, a dobro wspólne jest sumą indywidualnych dóbr; jednostka ma pierwszeństwo przed grupą.",
        en: "The view that society is an aggregate of autonomous individuals, and the common good is the sum of individual goods; the individual takes precedence over the group."
      },
      requiredYes: [1, 3, 25],
      requiredNo: [2, 30, 205, 276]
    },
    egoism: {
      id: "egoism",
      name: { pl: "Egoizm", en: "Egoism" },
      description: {
        pl: "Przekonanie, że jednostka powinna dążyć do własnego szczęścia i interesu, a nie poświęcać się dla innych; indywidualna wolność jest najwyższą wartością.",
        en: "The belief that the individual should pursue their own happiness and interest, rather than sacrificing themselves for others; individual freedom is the highest value."
      },
      requiredYes: [274, 4],
      requiredNo: [277, 276, 360, 359]
    },
    communitarianism: {
      id: "communitarianism",
      name: { pl: "Komunitaryzm", en: "Communitarianism" },
      description: {
        pl: "Przekonanie, że jednostka nie jest bytem autonomicznym, lecz jest kształtowana przez wspólnotę, do której należy. W związku z tym jednostki są winne wspólnocie szacunek, a ich tożsamość jest nierozerwalnie związana z kontekstem społecznym i kulturowym.",
        en: "The belief that the individual is not an autonomous being, but is shaped by the community to which they belong. Consequently, individuals owe respect to the community, and their identity is inextricably linked to their social and cultural context."
      },
      requiredYes: [2, 277, 360],
      requiredNo: [1, 4]
    },
    holism: {
      id: "holism",
      name: { pl: "Holizm", en: "Holism" },
      description: {
        pl: "Postrzeganie społeczeństwa jako organicznej całości, w której części służą całości; pierwszeństwo grup przed jednostkami; natura ma wartość samą w sobie.",
        en: "Viewing society as an organic whole in which parts serve the whole; priority of groups over individuals; nature has intrinsic value."
      },
      requiredYes: [2, 30, 241],
      requiredNo: [1, 3, 374]
    },
    organicism: {
      id: "organicism",
      name: { pl: "Organicyzm", en: "Organicism" },
      description: {
        pl: "Postrzeganie społeczeństwa jako organizmu, w którym hierarchia i tradycja są naturalne; jednostka służy całości; odrzucenie atomizmu i egalitaryzmu.",
        en: "Viewing society as an organism in which hierarchy and tradition are natural; the individual serves the whole; rejection of atomism and egalitarianism."
      },
      requiredYes: [2, 169, 170, 172, 205],
      requiredNo: [1, 3, 174]
    },
    nationalism: {
      id: "nationalism",
      name: {
        pl: "Nacjonalizm",
        en: "Nationalism"
      },
      description: {
        pl: "Doktryna, w której naród jest podstawową jednostką polityczną, a suwerenność narodowa jest nadrzędna.",
        en: "A doctrine in which the nation is the basic political unit and national sovereignty is supreme."
      },
      requiredYes: [205, 206, 210, 364],
      requiredNo: [234, 371, 372]
    },
    patriotism: {
      id: "patriotism",
      name: { pl: "Patriotyzm", en: "Patriotism" },
      description: {
        pl: "Przywiązanie do narodu i państwa narodowego; tożsamość narodowa jako kluczowa dla jedności; przeciwność globalizacji i znoszenia granic.",
        en: "Attachment to the nation and the nation‑state; national identity as key to unity; opposition to globalisation and the abolition of borders."
      },
      requiredYes: [205, 206, 210],
      requiredNo: [371, 372, 234]
    },
    internationalism: {
      id: "internationalism",
      name: { pl: "Internacjonalizm", en: "Internationalism" },
      description: {
        pl: "Dążenie do zniesienia granic i narodów; równość wszystkich ludzi; przynależność narodowa nie tworzy szczególnych obowiązków; przeciwność nacjonalizmowi.",
        en: "Striving to abolish borders and nations; equality of all people; national belonging does not create special obligations; opposition to nationalism."
      },
      requiredYes: [234, 372, 273, 368, 371],
      requiredNo: [206, 364, 207]
    },
    cosmopolitanism: {
      id: "cosmopolitanism",
      name: {
        pl: "Kosmopolityzm",
        en: "Cosmopolitanism"
      },
      description: {
        pl: "Pogląd, że wszyscy ludzie są obywatelami świata, a granice narodowe są sztuczne; poparcie dla globalnej integracji.",
        en: "The view that all people are citizens of the world and national borders are artificial; support for global integration."
      },
      requiredYes: [234, 273, 368, 371, 372],
      requiredNo: [206, 228, 364]
    },
    multiculturalism: {
      id: "multiculturalism",
      name: { pl: "Wielokulturowość", en: "Multiculturalism" },
      description: {
        pl: "Akceptacja i tolerancja dla różnorodności kulturowej, religijnej i światopoglądowej; sprzeciw wobec asymilacji i jednolitości kulturowej.",
        en: "Acceptance and tolerance of cultural, religious and worldview diversity; opposition to assimilation and cultural uniformity."
      },
      requiredYes: [17, 16],
      requiredNo: [228, 233, 370, 215]
    },
    racism: {
      id: "racism",
      name: { pl: "Rasizm", en: "Racism" },
      description: {
        pl: "Przekonanie o wyższości niektórych grup rasowych/etnicznych; sprzeciw wobec równości rasowej; ograniczenie imigracji i mieszania się grup.",
        en: "Belief in the superiority of certain racial/ethnic groups; opposition to racial equality; restriction of immigration and mixing of groups."
      },
      requiredYes: [216, 218, 220, 221],
      requiredNo: [273, 227]
    },
    multiPartySystem: {
      id: "multiPartySystem",
      name: { pl: "Wielopartyjność", en: "Multi-party system" },
      description: {
        pl: "Pluralizm polityczny umożliwiający swobodne tworzenie i funkcjonowanie wielu ugrupowań konkurujących o wpływ na państwo w procesie wyborczym.",
        en: "Political pluralism, which enables the free formation and operation of multiple groups competing for influence over the state through the electoral process."
      },
      requiredYes: [302, 38, 64],
      requiredNo: [89, 91, 86]
    },
    hunterGatherer: {
      id: "hunterGatherer",
      name: {
        pl: "Społeczeństwo zbieracko-łowieckie",
        en: "Hunter-gatherer society"
      },
      description: {
        pl: "Postuluje powrót do trybu życia opartego na zbieractwie i łowiectwie, odrzucając rolnictwo i przemysł na rzecz małych, samowystarczalnych wspólnot.",
        en: "Advocates a return to a hunter-gatherer lifestyle, rejecting agriculture and industry in favour of small, self-sufficient communities."
      },
      requiredYes: [66, 99, 248, 249, 322, 376],
      requiredNo: [94, 246, 331]
    },
    pastoralism: {
      id: "pastoralism",
      name: { pl: "Pastoralizm", en: "Pastoralism" },
      description: {
        pl: "Ideał życia wiejskiego, powrót do prostoty i tradycyjnego rolnictwa; krytyka urbanizacji i industrializacji; samowystarczalność.",
        en: "The ideal of rural life, a return to simplicity and traditional agriculture; criticism of urbanisation and industrialisation; self‑sufficiency."
      },
      requiredYes: [346, 264, 332],
      requiredNo: [244]
    },
    agrarianism: {
      id: "agrarianism",
      name: { pl: "Agraryzm", en: "Agrarianism" },
      description: {
        pl: "Nurt podkreślający znaczenie rolnictwa, społeczności wiejskich i własności rolnej jako fundamentów życia społecznego i gospodarczego.",
        en: "A movement emphasising the importance of agriculture, rural communities and agricultural ownership as the foundations of social and economic life."
      },
      requiredYes: [331, 332, 334, 335],
      requiredNo: []
    },
    feudalism: {
      id: "feudalism",
      name: { pl: "Feudalizm", en: "Feudalism" },
      description: {
        pl: "System społeczno-polityczny oparty na hierarchii, dziedzicznych tytułach, autorytecie tradycji i lokalnej władzy; odrzucenie demokracji, kapitalizmu i industrializacji.",
        en: "A socio-political system based on hierarchy, hereditary titles, traditional authority and local power; rejection of democracy, capitalism and industrialisation."
      },
      requiredYes: [169, 172, 176, 342, 341],
      requiredNo: [114, 38, 246]
    },
    ancienRegime: {
      id: "ancienRegime",
      name: { pl: "Ancien régime", en: "Ancien régime" },
      description: {
        pl: "Powrót do ustroju sprzed rewolucji; hierarchia społeczna, dziedziczne przywileje, autorytet tradycji; odrzucenie demokracji i indywidualizmu.",
        en: "Return to the pre‑revolutionary order; social hierarchy, hereditary privileges, traditional authority; rejection of democracy and individualism."
      },
      requiredYes: [176, 341, 342, 41, 172, 79],
      requiredNo: [38, 175]
    },
    guildSystem: {
      id: "guildSystem",
      name: {
        pl: "System cechowy",
        en: "Guild system"
      },
      description: {
        pl: "System organizacji społeczno-gospodarczej oparty na cechach rzemieślniczych, hierarchii i tradycji, z regulacją rynku przez korporacje zawodowe.",
        en: "A socio-economic system based on craft guilds, hierarchy and tradition, with market regulation by professional corporations."
      },
      requiredYes: [26, 106, 169, 172, 176, 298],
      requiredNo: [101, 112, 115]
    },

    // ===== GRUPA VIII: FILOZOFIA I EPISTEMOLOGIA POLITYCZNA =====
    rationalism: {
      id: "rationalism",
      name: { pl: "Racjonalizm", en: "Rationalism" },
      description: {
        pl: "Uznanie rozumu za główne źródło wiedzy i podstawę porządku społecznego; odrzucenie objawienia, tradycji i emocji jako wystarczających uzasadnień.",
        en: "Recognition of reason as the main source of knowledge and basis of social order; rejection of revelation, tradition and emotions as sufficient justifications."
      },
      requiredYes: [270, 175],
      requiredNo: [32, 33, 36, 34]
    },
    antiRationalism: {
      id: "antiRationalism",
      name: { pl: "Antyracjonalizm", en: "Anti‑rationalism" },
      description: {
        pl: "Odrzucenie racjonalizmu, podkreślenie roli emocji, instynktów i tradycji w życiu społecznym i politycznym; sceptycyzm wobec abstrakcyjnych idei.",
        en: "Rejection of rationalism, emphasis on emotions, instincts and tradition in social and political life; scepticism towards abstract ideas."
      },
      requiredYes: [33, 36],
      requiredNo: [278]
    },
    dialecticalMaterialism: {
      id: "dialecticalMaterialism",
      name: { pl: "Materializm dialektyczny", en: "Dialectical materialism" },
      description: {
        pl: "Marksistowska koncepcja, że rozwój historyczny napędzany jest walką klas i zmianami materialnymi; odrzucenie praw naturalnych i religii.",
        en: "Marxist concept that historical development is driven by class struggle and material changes; rejection of natural rights and religion."
      },
      requiredYes: [35, 260, 261, 150],
      requiredNo: [32, 18]
    },
    historicalMaterialism: {
      id: "historicalMaterialism",
      name: { pl: "Materializm historyczny", en: "Historical materialism" },
      description: {
        pl: "Pogląd, że warunki materialne i struktury ekonomiczne są podstawą zmiany społecznej; historia jest procesem walki klas; odrzucenie idealizmu.",
        en: "The view that material conditions and economic structures are the foundation of social change; history is a process of class struggle; rejection of idealism."
      },
      requiredYes: [35, 260, 261, 150],
      requiredNo: [32, 33]
    },
    utilitarianism: {
      id: "utilitarianism",
      name: { pl: "Utylitaryzm", en: "Utilitarianism" },
      description: {
        pl: "Ocena działań na podstawie ich skutków; dążenie do maksymalizacji ogólnego dobrostanu; odrzucenie norm opartych na religii czy tradycji.",
        en: "Evaluation of actions based on their consequences; striving to maximise overall welfare; rejection of norms based on religion or tradition."
      },
      requiredYes: [278],
      requiredNo: [32, 20, 19]
    },
    socialDarwinism: {
      id: "socialDarwinism",
      name: { pl: "Darwinizm społeczny", en: "Social Darwinism" },
      description: {
        pl: "Zastosowanie teorii ewolucji do społeczeństwa; naturalna selekcja, walka o byt, nierówności jako naturalne i korzystne; przeciwność redystrybucji.",
        en: "Application of evolutionary theory to society; natural selection, struggle for existence, inequalities as natural and beneficial; opposition to redistribution."
      },
      requiredYes: [22, 230, 169, 279],
      requiredNo: [137, 273, 267]
    },
    traditionalism: {
      id: "traditionalism",
      name: { pl: "Tradycjonalizm", en: "Traditionalism" },
      description: {
        pl: "Przywiązanie do tradycji, zwyczajów i instytucji przekazanych przez pokolenia; sceptycyzm wobec nowych idei; zmiany tylko zgodne z tradycją.",
        en: "Attachment to traditions, customs and institutions handed down through generations; scepticism towards new ideas; changes only if compatible with tradition."
      },
      requiredYes: [33, 34, 177, 300, 343, 345],
      requiredNo: [175, 344, 82]
    },
    reactionism: {
      id: "reactionism",
      name: { pl: "Reakcjonizm", en: "Reactionism" },
      description: {
        pl: "Postawa polityczna polegająca na gwałtownym oporze wobec zmian i pragnieniu powrotu do poprzedniego systemu (ancien régime)Opiera się na pesymistycznym przekonaniu, że historia ludzkości jest procesem upadku i degeneracji dawnego „złotego wieku”.",
        en: "A political stance characterised by fierce resistance to change and a desire to return to the previous system (ancien régime). It is based on the pessimistic belief that the history of humanity is a process of decline and degeneration from a bygone ‘golden age’."
      },
      requiredYes: [176, 300, 177],
      requiredNo: [344]
    },

    // ===== GRUPA IX: TECHNOLOGIA, ŚRODOWISKO I PRZYSZŁOŚĆ =====
    technoOptimism: {
      id: "technoOptimism",
      name: {
        pl: "Technooptymizm",
        en: "Techno-optimism"
      },
      description: {
        pl: "Przekonanie, że postęp technologiczny przynosi głównie korzyści, i że należy go wspierać.",
        en: "Belief that technological progress brings mainly benefits and should be supported."
      },
      requiredYes: [244, 246],
      requiredNo: [245, 247, 248, 250]
    },
    transhumanism: {
      id: "transhumanism",
      name: { pl: "Transhumanizm", en: "Transhumanism" },
      description: {
        pl: "Przekonanie, że jednostka ma prawo do modyfikowania własnego ciała i umysłu za pomocą technologii w celu przekraczania naturalnych ograniczeń człowieka.",
        en: "The belief that individuals have the right to modify their own body and mind through technology in order to transcend natural human limitations."
      },
      requiredYes: [377, 378],
      requiredNo: [245, 373, 247, 250]
    },
    industrialism: {
      id: "industrialism",
      name: { pl: "Industrializm", en: "Industrialism" },
      description: {
        pl: "Poparcie dla rewolucji przemysłowej, automatyzacji, innowacji i wzrostu materialnego; odrzucenie sceptycyzmu wobec technologii i dezurbanizacji.",
        en: "Support for the Industrial Revolution, automation, innovation and material growth; rejection of scepticism towards technology and de-urbanisation."
      },
      requiredYes: [246, 114, 244],
      requiredNo: [245, 247, 248, 346, 376]
    },
    technoSkepticism: {
      id: "technoSkepticism",
      name: {
        pl: "Technosceptycyzm",
        en: "Techno-skepticism"
      },
      description: {
        pl: "Sceptyczne podejście do nowych technologii, obawa przed ich negatywnymi skutkami.",
        en: "Sceptical approach to new technologies, concern about their negative effects."
      },
      requiredYes: [245],
      requiredNo: []
    },
    sustainableDevelopment: {
      id: "sustainableDevelopment",
      name: { pl: "Zrównoważony rozwój", en: "Sustainable development" },
      description: {
        pl: "Rozwój gospodarczy zgodny z ochroną środowiska dla przyszłych pokoleń; priorytet stabilności ekologicznej; natura ma wartość instrumentalną.",
        en: "Economic development consistent with environmental protection for future generations; priority to ecological stability; nature has instrumental value."
      },
      requiredYes: [235, 243, 237],
      requiredNo: [374]
    },
    deepEcology: {
      id: "deepEcology",
      name: { pl: "Ekologia głęboka", en: "Deep ecology" },
      description: {
        pl: "Biocentryzm, uznanie równej wartości wszystkich istot żywych; odrzucenie antropocentryzmu; priorytet stabilności ekologicznej nad rozwojem gospodarczym.",
        en: "Biocentrism, recognition of equal value of all living beings; rejection of anthropocentrism; priority of ecological stability over economic development."
      },
      requiredYes: [236, 238, 239, 375, 243],
      requiredNo: [374, 246]
    },
    socialEcology: {
      id: "socialEcology",
      name: { pl: "Ekologia społeczna", en: "Social ecology" },
      description: {
        pl: "Połączenie ekologii z krytyką hierarchii społecznej; postuluje decentralizację, samorządność i wspólne zarządzanie zasobami; odrzucenie państwa i hierarchii.",
        en: "Combination of ecology with critique of social hierarchy; advocates decentralisation, self‑governance and common resource management; rejection of state and hierarchy."
      },
      requiredYes: [235, 65, 108, 243],
      requiredNo: [374, 169, 75]
    },
    shallowEcology: {
      id: "shallowEcology",
      name: { pl: "Ekologia płytka", en: "Shallow ecology" },
      description: {
        pl: "Antropocentryczna ochrona środowiska; ochrona natury dla dobra ludzi; odrzucenie biocentryzmu i uznania wartości przyrody samej w sobie.",
        en: "Anthropocentric environmental protection; protection of nature for human benefit; rejection of biocentrism and intrinsic value of nature."
      },
      requiredYes: [235, 243, 237],
      requiredNo: [238, 240, 374]
    },

    // ===== GRUPA X: POSTAWA WOBEC ZMIANY I PORZĄDKU =====
    vanguardParty: {
      id: "vanguardParty",
      name: { pl: "Partia awangardowa", en: "Vanguard party" },
      description: {
        pl: "Koncepcja, według której zorganizowana, ideologiczna partia powinna kierować społeczeństwem i prowadzić je w stronę rewolucyjnych zmian.",
        en: "The concept that an organized, ideological party should lead society and guide it toward revolutionary change."
      },
      requiredYes: [86, 87, 42],
      requiredNo: [59]
    },
    dictatorshipOfProletariat: {
      id: "dictatorshipOfProletariat",
      name: { pl: "Dyktatura proletariatu", en: "Dictatorship of the proletariat" },
      description: {
        pl: "Marksistowska koncepcja, w której proletariat sprawuje władzę polityczną poprzez partię rewolucyjną, aby zbudować społeczeństwo bezklasowe; odrzucenie reformizmu.",
        en: "Marxist concept in which the proletariat exercises political power through a revolutionary party to build a classless society; rejection of reformism."
      },
      requiredYes: [260, 261, 87, 44, 152],
      requiredNo: [84, 83]
    },
    militarism: {
      id: "militarism",
      name: { pl: "Militaryzm", en: "Militarism" },
      description: {
        pl: "Dążenie do osiągania celów politycznych za pomocą środków zbrojnych oraz przenoszenie wzorców wojskowych (dyscypliny, hierarchii, lojalności) do życia cywilnego. Wojsko jest tu postrzegane jako wzorzec organizacji społecznej.",
        en: "The pursuit of political objectives through military means and the transfer of military models (discipline, hierarchy, loyalty) to civilian life. The military is seen here as a model for social organisation."
      },
      requiredYes: [381, 382, 255, 257, 383],
      requiredNo: [252]
    },
    pacifism: {
      id: "pacifism",
      name: { pl: "Pacyfizm", en: "Pacifism" },
      description: {
        pl: "Sprzeciw wobec wojny i przemocy; zmiany społeczne wyłącznie pokojowe; odrzucenie militaryzmu i obowiązkowej służby wojskowej.",
        en: "Opposition to war and violence; social change only through peaceful means; rejection of militarism and compulsory military service."
      },
      requiredYes: [258, 252, 83],
      requiredNo: [257, 80, 195, 253]
    },
    imperialism: {
      id: "imperialism",
      name: { pl: "Imperializm", en: "Imperialism" },
      description: {
        pl: "Dążenie do ekspansji terytorialnej i dominacji militarnej; użycie siły jako instrumentu polityki; chwała zbrojna i podbój jako dowód wielkości.",
        en: "Pursuit of territorial expansion and military dominance; use of force as an instrument of policy; military glory and conquest as proof of greatness."
      },
      requiredYes: [208, 257, 262, 209],
      requiredNo: [258, 234]
    },
    statusQuo: {
      id: "statusQuo",
      name: {
        pl: "Obrońca status quo",
        en: "Status quo defender"
      },
      description: {
        pl: "Pogląd, że istniejący porządek społeczny i instytucje są na ogół słuszne i należy je chronić przed radykalnymi zmianami.",
        en: "View that the existing social order and institutions are generally right and should be protected from radical change."
      },
      requiredYes: [33, 82, 337, 343],
      requiredNo: [80, 152]
    },

    // ===== GRUPA XI: GEOGRAFIA I GRANICE =====
    openBorders: {
      id: "openBorders",
      name: {
        pl: "Otwarte granice",
        en: "Open borders"
      },
      description: {
        pl: "Postulat zniesienia barier w przepływie ludzi między państwami, umożliwiający swobodną migrację.",
        en: "Demand for the abolition of barriers to the movement of people between states, enabling free migration."
      },
      requiredYes: [227, 368, 369],
      requiredNo: [228, 229, 231]
    },
    globalization: {
      id: "globalization",
      name: { pl: "Globalizacja", en: "Globalization" },
      description: {
        pl: "Poparcie dla swobodnego przepływu ludzi, kapitału i towarów przez granice; znoszenie granic narodowych; równe traktowanie zagranicznych przedsiębiorstw.",
        en: "Support for the free movement of people, capital and goods across borders; abolition of national borders; equal treatment of foreign enterprises."
      },
      requiredYes: [135, 136, 234, 368],
      requiredNo: [222, 223, 228, 316]
    },
    closedBorders: {
      id: "closedBorders",
      name: {
        pl: "Zamknięte granice",
        en: "Closed borders"
      },
      description: {
        pl: "Postulat całkowitego zamknięcia granic państwa dla imigracji, z naciskiem na izolacjonizm.",
        en: "Demand for complete closure of state borders to immigration, with emphasis on isolationism."
      },
      requiredYes: [],
      requiredNo: [135, 227, 368, 369]
    }
  }
};

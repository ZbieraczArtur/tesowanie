// script.js – z dodanymi logotypami partii i ideologii (ranking, popup, symulacja) + obsługa języka
let config = null;
let configBase = null;      // oryginalne dane z data.json (wartości, mapowania)
let politicalProfiles = null;
let translations = null;    // aktualne tłumaczenia (teksty)
let currentLanguage = 'pl';
let userAnswers = [];
let currentScoringMode = 'full';   // 'full' lub 'affirmative'
let currentMatchingMode = 'modern'; // 'modern' lub 'legacy'
let simulatedEntity = null;         // { type: 'party'|'ideology', name: string }

const questionsContainer = document.getElementById('questions-container');
const submitBtn = document.getElementById('submitBtn');
const resultsDiv = document.getElementById('results-container');
const valuesResults = document.getElementById('values-results');
const ideologiesResults = document.getElementById('ideologies-results');
const partiesResults = document.getElementById('parties-results');
const usersResults = document.getElementById('users-results');
const popup = document.getElementById('popup');
const popupText = document.getElementById('popup-text');
const closePopupBtn = document.getElementById('closePopup');

const DEFAULT_UI_TEXTS = {
  pl: {
    importLabel: 'Import odpowiedzi',
    importPlaceholder: 'Wklej tutaj kod wyeksportowany z testu...',
    importBtn: 'Importuj i odtworz',
    importInfo: 'Wklej kod wygenerowany po poprzednim ukonczeniu testu. Wszystkie odpowiedzi zostana przywrocone, a wyniki przeliczone.',
    simulateLabel: 'Symuluj odpowiedzi:',
    simulateBtn: 'Symuluj',
    restoreBtn: 'Przywroc moje odpowiedzi',
    simulateInfo: 'Symulacja tymczasowo zastapi Twoje odpowiedzi.',
    submitBtn: 'Pokaz wyniki',
    modeLabel: 'Tryb liczenia:',
    modeFullLabel: 'Tryb pelnego profilowania',
    modeAffirmativeLabel: 'Tryb afirmacyjny',
    resultsTitle: 'Twoje wyniki',
    valuesHeader: 'Pary wartosci',
    rankingIdeologies: 'Ranking ideologii',
    rankingParties: 'Ranking partii',
    rankingUsers: 'Ranking uzytkownikow',
    rankingInfo: 'Im wyzszy procent, tym bardziej Twoj profil jest zgodny z dana pozycja.',
    closePopup: 'Zamknij',
    expandBtn: 'Rozwin teze',
    collapseBtn: 'Zwin teze',
    skipIfBadge: 'Pomin jesli',
    noDescription: 'Brak dodatkowego opisu.'
  }
};

function getLocalizedValue(value, fallback = '') {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value[currentLanguage] || value.pl || value.en || fallback;
}

function normalizeProfileText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getProfileCollection(type) {
  const key = type === 'party' ? 'parties' : type === 'ideology' ? 'ideologies' : 'users';
  return Array.isArray(politicalProfiles?.[key]) ? politicalProfiles[key] : [];
}

function getProfileByName(name, type) {
  const normalized = normalizeProfileText(name);
  return getProfileCollection(type).find(profile =>
    normalizeProfileText(profile.name) === normalized ||
    normalizeProfileText(profile.key) === normalized ||
    normalizeProfileText(profile.id) === normalized
  ) || null;
}

function getProfileLogoUrl(name, type) {
  return getProfileByName(name, type)?.logo || '';
}

function getSkipAnswer(question) {
  return question?.answers?.find(a => Number(a.value) === 0 && /pomi|skip/i.test(normalizeProfileText(a.label))) ||
         question?.answers?.find(a => Number(a.value) === 0) ||
         question?.answers?.[0] || null;
}

function splitReferenceAnswerLabels(rawText) {
  const value = String(rawText || '').trim();
  if (!value || /^brak odpowiedzi$/i.test(value)) return [];
  return value.split(',').map(part => part.trim()).filter(Boolean);
}

function findAnswerByLabel(question, label) {
  const normalized = normalizeProfileText(label);
  if (!question || !normalized) return null;
  if (normalized === 'pomin pytanie' || normalized === 'pomin' || normalized === 'skip') return getSkipAnswer(question);
  return question.answers.find(answer => normalizeProfileText(answer.label) === normalized) || null;
}

function parseReferenceExportCode(rawCode) {
  const answersByQuestion = new Map();
  if (!config) return answersByQuestion;
  const lines = String(rawCode || '').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*\d+\.\s*.*?\[id:(\d+)\]:\s*\((.*?)\);?\s*$/);
    if (!match) continue;
    const questionId = Number(match[1]);
    const question = config.questions.find(q => Number(q.id) === questionId);
    if (!question) continue;
    const allowed = splitReferenceAnswerLabels(match[2]).map(label => {
      const normalized = normalizeProfileText(label);
      if (normalized === 'neither') return { label, neither: true, value: null, answerData: null };
      const answerData = findAnswerByLabel(question, label);
      return answerData ? { label: answerData.label, value: Number(answerData.value), answerData } : null;
    }).filter(Boolean);
    answersByQuestion.set(questionId, allowed.length ? allowed : [{ value: 0, answerData: getSkipAnswer(question) }]);
  }
  return answersByQuestion;
}

function getScaleIndex(answerValue) {
  const scale = [1.5, 0.5, -0.5, -1.5];
  const val = Number(answerValue);
  for (let i = 0; i < scale.length; i++) {
    if (Math.abs(scale[i] - val) < 0.01) return i;
  }
  return null;
}

function profilePairScore(userValue, referenceAnswer) {
  const myValue = Number(userValue);
  if (!referenceAnswer || myValue === 0 || Number.isNaN(myValue)) return 0;
  if (referenceAnswer.neither) return myValue === 0 ? 0 : -1.0;
  const myIdx = getScaleIndex(myValue);
  const refIdx = getScaleIndex(referenceAnswer.value);
  if (myIdx === null || refIdx === null) return 0;
  return [1.5, 0.5, -1.0, -1.5][Math.abs(myIdx - refIdx)] || 0;
}

function compareAnswersToReferenceProfile(answers, referenceProfile) {
  const reference = parseReferenceExportCode(referenceProfile?.exportCode || '');
  if (!reference.size || !Array.isArray(config?.questions)) return { percent: 0, score: 0, maxPossible: 0, compared: 0 };
  const answersByQuestion = new Map((answers || []).filter(row => !row.noteOnly).map(row => [Number(row.questionId), row]));
  let score = 0;
  let maxPossible = 0;
  let compared = 0;
  for (const question of config.questions) {
    const userAnswer = answersByQuestion.get(Number(question.id));
    const allowed = reference.get(Number(question.id)) || [{ value: 0, answerData: getSkipAnswer(question) }];
    const userValue = userAnswer ? Number(userAnswer.answerValue) : 0;
    const best = Math.max(...allowed.map(ref => profilePairScore(userValue, ref)), 0);
    score += best;
    maxPossible += 1.5;
    compared++;
  }
  const percent = maxPossible ? Math.round(((score + maxPossible) / (2 * maxPossible)) * 100) : 0;
  return { percent: Math.min(100, Math.max(0, percent)), score, maxPossible, compared };
}

function getModernRanking(type) {
  return getProfileCollection(type).map(profile => {
    const match = compareAnswersToReferenceProfile(userAnswers, profile);
    return {
      key: profile.key || profile.id || profile.name,
      name: profile.name,
      percent: match.percent,
      agreements: 0,
      disagreements: 0,
      involved: match.compared,
      description: profile.description || '',
      logo: profile.logo || '',
      profile
    };
  }).sort((a, b) => b.percent - a.percent);
}

function buildMigratedProfilesFromConfig() {
  const buildExportCode = (entityName, type) => {
    const lines = [`Data wykonania testu: migracja legacy ${new Date().toISOString().slice(0, 10)}`, ''];
    config.questions.forEach((question, index) => {
      let best = null;
      for (const answer of question.answers) {
        const value = Number(answer.value);
        if (value === 0) continue;
        const forList = type === 'party' ? (answer.parties_for || []) : (answer.ideologies_for || []);
        const againstList = type === 'party' ? (answer.parties_against || []) : (answer.ideologies_against || []);
        if (forList.includes(entityName)) best = !best || Math.abs(value) > Math.abs(best) ? value : best;
        if (againstList.includes(entityName)) best = !best || Math.abs(value) > Math.abs(best) ? -value : best;
      }
      const selected = best === null ? getSkipAnswer(question) : (question.answers.find(a => Math.abs(Number(a.value) - best) < 0.01) || getSkipAnswer(question));
      lines.push(`${index + 1}. ${question.text} [id:${question.id}]: (${selected?.label || 'Pomiń pytanie'});`);
    });
    return `${lines.join('\n')}\n`;
  };
  return {
    version: 2,
    defaultMatchingMode: 'modern',
    users: (config.users || []).map(user => ({ type: 'user', ...user, logo: user.logo || (user.avatar ? `images/IUsers/${user.avatar}` : ''), exportCode: user.exportCode || '' })),
    parties: (config.parties || []).map(party => ({ type: 'party', ...party, logo: getPartyLogoUrl(party.name) || '', exportCode: buildExportCode(party.name, 'party') })),
    ideologies: (config.ideologies || []).map(ideology => ({ type: 'ideology', ...ideology, logo: getIdeologyLogoUrl(ideology.name) || '', exportCode: buildExportCode(ideology.name, 'ideology') }))
  };
}

window.getProfileCollection = getProfileCollection;
window.getProfileByName = getProfileByName;
window.compareAnswersToReferenceProfile = compareAnswersToReferenceProfile;
window.parseReferenceExportCode = parseReferenceExportCode;
// ======================= FUNKCJA OBLICZAJĄCA ODZNAKI (DO ROZBUDOWY) =======================
// Na razie zwraca pustą tablicę – możesz dodać własne warunki w oparciu o wyniki par wartości.
function computeBadges() {
  const registry = window.BadgesRegistry;
  if (!registry?.items) return [];
  const badges = [];

  const getAnswerValue = (questionId) => {
    const answer = userAnswers.find(a => Number(a.questionId) === Number(questionId) && !a.noteOnly);
    return answer ? Number(answer.answerValue) : null;
  };

  for (const badge of Object.values(registry.items)) {
    // Stary format odznak: jeden warunek (questionId + answerValue)
    if (badge.questionId !== undefined && badge.answerValue !== undefined) {
      const answer = userAnswers.find(a => Number(a.questionId) === Number(badge.questionId) && !a.noteOnly);
      if (answer && Number(answer.answerValue) === Number(badge.answerValue)) {
        badges.push(badge);
      }
      continue;
    }

    // Nowy format odznak: wiele warunkow TAK/NIE - wszystkie musza byc spelnione
    if (Array.isArray(badge.requiredYes) || Array.isArray(badge.requiredNo)) {
      let allMatch = true;

      for (const qid of (badge.requiredYes || [])) {
        const val = getAnswerValue(qid);
        if (val === null || val < 1.0) { allMatch = false; break; }
      }

      if (allMatch) {
        for (const qid of (badge.requiredNo || [])) {
          const val = getAnswerValue(qid);
          if (val === null || val > -1.0) { allMatch = false; break; }
        }
      }

      if (allMatch) {
        badges.push(badge);
      }
    }
  }
  return badges;
}

// ======================= MAPOWANIE PARTII -> LOGO =======================
const LOGO_BASE_PATH = 'images/Partie/';
const partyLogoMap = new Map([
  ['Zieloni', 'Partia_Zieloni.jpg'],
  ['Partia Zieloni', 'Partia_Zieloni.jpg'],
  ['Koalicja Obywatelska', 'Koalicja_Obywatelska.png'],
  ['Konfederacja', 'Konfederacja_Korony_Polskiej.webp'],
  ['Konfederacja Korony Polskiej', 'Konfederacja_Korony_Polskiej.webp'],
  ['Nowa Lewica', 'Nowa_Lewica.jpg'],
  ['Nowa Nadzieja', 'Nowa_Nadzieja.jpg'],
  ['Polska 2050', 'Polska_2050_Rzeczypospolitej_Polskiej.png'],
  ['Polska 2050 Rzeczypospolitej Polskiej', 'Polska_2050_Rzeczypospolitej_Polskiej.png'],
  ['Polska Partia Socjalistyczna', 'Polska_Partia_Socjalistyczna.png'],
  ['Polskie Stronnictwo Ludowe', 'Polskie_Stronnictwo_Ludowe.jpg'],
  ['Prawo i Sprawiedliwość', 'Prawo_i_Sprawiedliwosc.svg'],
  ['Partia Razem', 'Partia_Razem.png'],
  ['Ruch Narodowy', 'Ruch_Narodowy.svg']
]);

function getPartyLogoUrl(partyName) {
  const profileLogo = getProfileLogoUrl(partyName, 'party');
  if (profileLogo) return profileLogo;
  const logoKey = config?.parties?.find(p => p.name === partyName || p.key === partyName)?.key || partyName;
  const fileName = partyLogoMap.get(logoKey);
  if (fileName) return LOGO_BASE_PATH + fileName;
  console.warn(`Brak logo dla partii: ${partyName}`);
  return null;
}

// ======================= MAPOWANIE IDEOLOGII -> LOGO =======================
const IDEOLOGY_LOGO_BASE_PATH = 'images/Ideologie/';
const ideologyLogoMap = new Map([
  ['Absolutyzm klasyczny', 'Absolutyzm_klasyczny.png'],
  ['Absolutyzm oświecony', 'Absolutyzm_oswiecony.png'],
  ['Agoryzm', 'Agoryzm.png'],
  ['Agraryzm', 'Agraryzm.png'],
  ['Anarchofeminizm', 'Anarchofeminizm.png'],
  ['Anarchoindywidualizm', 'Anarchoindywidualizm.png'],
  ['Anarchokapitalizm', 'Anarchokapitalizm.svg'],
  ['Anarchokolektywizm', 'Anarchokolektywizm.webp'],
  ['Anarchokomunizm', 'Anarchokomunizm.svg'],
  ['Anarchoprymitywizm', 'Anarchoprymitywizm.png'],
  ['Anarchosyndykalizm', 'Anarchosyndykalizm.png'],
  ['Chrześcijańska demokracja', 'Chrzescijanska_demokracja.png'],
  ['De Leonizm', 'De_Leonizm.png'],
  ['Demokratyczny konfederalizm', 'Demokratyczny_konfederalizm.png'],
  ['Dystrybucjonizm', 'Dystrybucjonizm.png'],
  ['Egoizm', 'Egoizm.png'],
  ['Egokomunizm', 'Egokomunizm.png'],
  ['Ekoanarchizm', 'Ekoanarchizm.png'],
  ['Ekologizm prawicowy', 'Ekologizm_prawicowy.jpg'],
  ['Ekosocjalizm', 'Ekosocjalizm.png'],
  ['Eurokomunizm', 'Eurokomunizm.png'],
  ['Faszyzm', 'Faszyzm.png'],
  ['Feminizm liberalny', 'Feminizm_liberalny.png'],
  ['Feminizm radykalny', 'Feminizm_radykalny.svg'],
  ['Feminizm socjalistyczny', 'Feminizm_socjalistyczny.png'],
  ['Fundamentalizm religijny', 'Fundamentalizm_religijny.png'],
  ['Georgizm', 'Georgizm.svg'],
  ['Głęboka ekologia', 'Gleboka_ekologia.svg'],
  ['Zielony liberalizm', 'Zielony_liberalizm.png'],
  ['Hoppeanism', 'Hoppeanism.png'],
  ['Komunizm rad', 'Komunizm_rad.png'],
  ['Konserwatywny liberalizm', 'Konserwatywny_liberalizm.png'],
  ['Konserwatyzm autorytarny', 'Konserwatyzm_autorytarny.png'],
  ['Konserwatyzm ewolucyjny', 'Konserwatyzm_ewolucyjny.png'],
  ['Konserwatyzm jednego narodu', 'Konserwatyzm_jednego_narodu.jpg'],
  ['Konserwatyzm paternalistyczny', 'Konserwatyzm_paternalistyczny.png'],
  ['Korwinizm', 'Korwinizm.png'],
  ['Leninizm', 'Leninizm.png'],
  ['Lewicowy anarchizm rynkowy', 'Lewicowy_anarchizm_rynkowy.png'],
  ['Liberalizm klasyczny', 'Liberalizm_klasyczny.png'],
  ['Liberalizm perfekcjonistyczny', 'Liberalizm_perfekcjonistyczny.png'],
  ['Liberalny konserwatyzm', 'Liberalny_konserwatyzm.png'],
  ['Libertarianizm konsekwencjalistyczny', 'Libertarianizm_konsekwencjalistyczny.png'],
  ['Libertariański municypalizm', 'Libertarianski_municypalizm.png'],
  ['Liechtensteinizm', 'Liechtensteinizm.png'],
  ['Luksemburgizm', 'Luksemburgizm.png'],
  ['Marksizm klasyczny', 'Marksizm_klasyczny.png'],
  ['Minarchizm', 'Minarchizm.png'],
  ['Mutualizm', 'Mutualizm.png'],
  ['Nacjonalizm ekspansjonistyczny', 'Nacjonalizm_ekspansjonistyczny.svg'],
  ['Nacjonalizm konserwatywny', 'Nacjonalizm_konserwatywny.svg'],
  ['Nacjonalizm lewicowy', 'Nacjonalizm_lewicowy.svg'],
  ['Nacjonalizm liberalny', 'Nacjonalizm_liberalny.png'],
  ['Narodowa demokracja', 'Narodowa_demokracja.png'],
  ['Narodowy anarchizm', 'Narodowy_anarchizm.png'],
  ['Narodowy bolszewizm', 'Narodowy_bolszewizm.png'],
  ['Narodowy komunizm', 'Narodowy_komunizm.png'],
  ['Narodowy liberalizm', 'Narodowy_liberalizm.svg'],
  ['Nazizm', 'Nazizm.png'],
  ['Neokonserwatyzm', 'Neokonserwatyzm.png'],
  ['Neolibertarianizm', 'Neolibertarianizm.svg'],
  ['Neoluddyzm', 'Neoluddyzm.png'],
  ['Neorepublikanizm', 'Neorepublikanizm.svg'],
  ['Ordoliberalizm', 'Ordoliberalizm.png'],
  ['Paleokonserwatyzm', 'Paleokonserwatyzm.png'],
  ['Paleolibertarianizm', 'Paleolibertarianizm.png'],
  ['Randyzm', 'Randyzm.png'],
  ['Socjaldemokracja', 'Socjaldemokracja.png'],
  ['Socjalizm chrześcijański', 'Socjalizm_chrzescijanski.png'],
  ['Socjalizm demokratyczny', 'Socjalizm_demokratyczny.png'],
  ['Socjalizm fabiański', 'Socjalizm_fabianski.png'],
  ['Socjalizm liberalny', 'Socjalizm_liberalny.png'],
  ['Socjalizm rynkowy', 'Socjalizm_rynkowy.png'],
  ['Socjalliberalizm', 'Socjalliberalizm.png'],
  ['Sośnierzyzm', 'Sosnierzyzm.png'],
  ['Stalinizm', 'Stalinizm.svg'],
  ['Strasseryzm', 'Strasseryzm.png'],
  ['Tradycjonalizm integralny', 'Tradycjonalizm_integralny.png'],
  ['Trockizm', 'Trockizm.svg'],
  ['Liberalizm utylitarny', 'Liberalizm_utylitarny.png'],
  ['Trzecia droga', 'Trzecia_droga.svg'],
  ['Nacjonalizm obywatelski', 'Nacjonalizm_obywatelski.svg'],
  ['Hoppeanizm', 'Hoppeanizm.png']
]);

function getIdeologyLogoUrl(ideologyName) {
  const profileLogo = getProfileLogoUrl(ideologyName, 'ideology');
  if (profileLogo) return profileLogo;
  const logoKey = config?.ideologies?.find(i => i.name === ideologyName || i.key === ideologyName)?.key || ideologyName;
  const fileName = ideologyLogoMap.get(logoKey);
  if (fileName) return IDEOLOGY_LOGO_BASE_PATH + fileName;
  console.warn(`Brak logo dla ideologii: ${ideologyName}`);
  return null;
}
// ========================================================================

// Mapowanie par wartości na kategorie (na podstawie lewej wartości)
const categoryMapping = {
  "Autonomia": 1, "Antypaternalizm": 1, "Indywidualizm": 1, "Kontraktualizm": 1, "Dobrowolność wspólnoty": 1,
  "Egalitaryzm": 1, "Wolność ekspresji": 1,
  "Samoorganizacja": 2, "Decentralizacja": 2, "Ograniczenie władzy": 2, "Sakralizacja autorytetu": 2,
  "Różnorodność norm": 2, "Demokracja": 2, "Autokracja": 2,
  "Własność kolektywna": 3, "Planowanie": 3, "Regulacja instytucjonalna": 3, "Ograniczanie wymiany": 3,
  "Minimalizacja granic": 4, "Uniwersalizm humanistyczny": 4, "Interwencjonizm zagraniczny": 4,
  "Preferencja użycia siły": 5, "Rewolucja": 5, "Progresywizm": 5, "Pluralizm kulturowy": 5,
  "Neutralność religijna": 5, "Włączanie": 5, "Egalitaryzm biologiczny": 5,
  "Antropocentryzm": 6, "Postęp technologiczny": 6
};

const categoryNames = {
  1: "⚖️ Społeczeństwo i jednostka",
  2: "🏛️ Władza i ustrój",
  3: "💰 Ekonomia",
  4: "🌍 Globalizacja i granice",
  5: "🌱 Kultura i zmiana społeczna",
  6: "🌿 Środowisko i technologia"
};

const valueColors = {
  "Autonomia": "#FECB1D", "Heteronomia": "#613B28", "Kolektywizm": "#613B28", "Indywidualizm": "#FECB1D",
  "Egalitaryzm": "#FECB1D", "Hierarchiczność": "#613B28", "Samoorganizacja": "#2F3944", "Etatyzm": "#73B0BE",
  "Decentralizacja": "#2F3944", "Centralizacja": "#73B0BE", "Ograniczenie władzy": "#2F3944", "Absolutyzm władzy": "#73B0BE",
  "Demokracja": "#2F3944", "Anty-demokracja": "#73B0BE", "Autokracja": "#2F3944", "Anty-autokracja": "#73B0BE",
  "Własność kolektywna": "#E44341", "Własność prywatna": "#448A3A", "Planowanie": "#E44341", "Rynek": "#448A3A",
  "Regulacja instytucjonalna": "#E44341", "Samoregulacja": "#448A3A", "Ograniczanie wymiany": "#E44341", "Swobodna wymiana": "#448A3A",
  "Minimalizacja granic": "#4C59CB", "Kontrola granic": "#FFA219", "Uniwersalizm humanistyczny": "#4C59CB", "Partykularyzm narodowy": "#FFA219",
  "Interwencjonizm zagraniczny": "#4C59CB", "Izolacjonizm": "#FFA219", "Preferencja użycia siły": "#DD59C7", "Unikanie przemocy": "#86D040",
  "Rewolucja": "#DD59C7", "Gradualizm": "#86D040", "Progresywizm": "#DD59C7", "Konserwatyzm": "#86D040",
  "Pluralizm kulturowy": "#DD59C7", "Homogenizacja": "#86D040", "Neutralność religijna": "#DD59C7", "Instytucjonalna religia": "#86D040",
  "Włączanie": "#DD59C7", "Wykluczenie": "#86D040", "Egalitaryzm biologiczny": "#DD59C7", "Suprematyzm biologiczny": "#86D040",
  "Wolność ekspresji": "#FECB1D", "Cenzura": "#613B28", "Antropocentryzm": "#E57160", "Ekocentryzm": "#14832A",
  "Postęp technologiczny": "#E57160", "Prymitywizm": "#14832A", "Desakralizacja autorytetu": "#73B0BE", "Sakralizacja autorytetu": "#2F3944",
  "Różnorodność norm": "#2F3944", "Uniformizacja norm": "#73B0BE", "Kontraktualizm": "#FECB1D", "Organicyzm": "#613B28",
  "Dobrowolność wspólnoty": "#FECB1D", "Obowiązkowość wspólnoty": "#613B28", "Paternalizm": "#613B28", "Antypaternalizm": "#FECB1D"
};

function showPopup(message) {
  const existingLogo = popup.querySelector('.popup-logo-img');
  if (existingLogo) existingLogo.remove();
  popupText.innerText = message;
  popup.classList.remove('hidden');
}

function showPartyPopup(partyName, description) {
  const existingLogo = popup.querySelector('.popup-logo-img');
  if (existingLogo) existingLogo.remove();

  const logoUrl = getPartyLogoUrl(partyName);
  if (logoUrl) {
    const logoImg = document.createElement('img');
    logoImg.src = logoUrl;
    logoImg.alt = `Logo ${partyName}`;
    logoImg.className = 'popup-logo-img';
    logoImg.style.cssText = 'display: block; max-width: 120px; max-height: 120px; margin: 0 auto 16px auto; object-fit: contain;';
    const popupContent = popup.querySelector('.popup-content');
    popupContent.insertBefore(logoImg, popupText);
  }
  popupText.innerText = `${partyName}\n\n${description || 'Brak opisu.'}`;
  popup.classList.remove('hidden');
}

function showIdeologyPopup(ideologyName, description) {
  const existingLogo = popup.querySelector('.popup-logo-img');
  if (existingLogo) existingLogo.remove();

  const logoUrl = getIdeologyLogoUrl(ideologyName);
  if (logoUrl) {
    const logoImg = document.createElement('img');
    logoImg.src = logoUrl;
    logoImg.alt = `Logo ${ideologyName}`;
    logoImg.className = 'popup-logo-img';
    logoImg.style.cssText = 'display: block; max-width: 120px; max-height: 120px; margin: 0 auto 16px auto; object-fit: contain;';
    const popupContent = popup.querySelector('.popup-content');
    popupContent.insertBefore(logoImg, popupText);
  }
  popupText.innerText = `${ideologyName}\n\n${description || 'Brak opisu.'}`;
  popup.classList.remove('hidden');
}

closePopupBtn.addEventListener('click', () => popup.classList.add('hidden'));
popup.addEventListener('click', (e) => { if (e.target === popup) popup.classList.add('hidden'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !popup.classList.contains('hidden')) popup.classList.add('hidden'); });

function getContrastColor(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  return brightness > 0.5 ? '#000000' : '#ffffff';
}

// ======================= OBSŁUGA JĘZYKA =======================
async function loadTranslations(lang) {
  if (lang === 'pl') {
    // Dla polskiego nie ładujemy zewnętrznego pliku – używamy danych z configBase
    translations = null;
    return;
  }
  try {
    const response = await fetch(`translations_${lang}.json`);
    if (!response.ok) throw new Error(`Nie udało się wczytać tłumaczeń dla ${lang}`);
    translations = await response.json();
  } catch (err) {
    console.error(err);
    translations = null;
    showPopup(`Błąd ładowania tłumaczeń dla języka ${lang}. Pozostaję przy polskim.`);
    return false;
  }
  return true;
}

function applyTranslationsToConfig() {
  if (!configBase) return;
  config = JSON.parse(JSON.stringify(configBase));

  config.pairsOfValues?.forEach(pair => {
    pair.leftKey = pair.left;
    pair.rightKey = pair.right;
  });
  config.ideologies?.forEach(ideo => { ideo.key = ideo.name; });
  config.parties?.forEach(party => { party.key = party.name; });

  if (!translations) return;

  const byIdOrIndex = (items, source, index, keyName = 'id') => {
    if (!Array.isArray(items)) return null;
    const sourceId = source?.[keyName] ?? source?.id;
    return items.find(item => sourceId !== undefined && (item[keyName] === sourceId || item.id === sourceId)) || items[index] || null;
  };

  if (Array.isArray(translations.pairsOfValues)) {
    config.pairsOfValues.forEach((pair, i) => {
      const transPair = byIdOrIndex(translations.pairsOfValues, pair, i) ||
        translations.pairsOfValues.find(p => p.leftKey === pair.leftKey || p.left === pair.leftKey || p.originalLeft === pair.leftKey);
      if (!transPair) return;
      pair.left = transPair.left || pair.left;
      pair.right = transPair.right || pair.right;
      pair.leftDef = transPair.leftDef || pair.leftDef;
      pair.rightDef = transPair.rightDef || pair.rightDef;
    });
  }

  if (Array.isArray(translations.ideologies)) {
    config.ideologies.forEach((ideo, i) => {
      const transIdeo = byIdOrIndex(translations.ideologies, ideo, i) ||
        translations.ideologies.find(t => t.key === ideo.key || t.originalName === ideo.key || t.name === ideo.key);
      if (!transIdeo) return;
      ideo.name = transIdeo.displayName || transIdeo.name || ideo.name;
      ideo.description = transIdeo.description || ideo.description;
    });
  }

  if (Array.isArray(translations.parties)) {
    config.parties.forEach((party, i) => {
      const transParty = byIdOrIndex(translations.parties, party, i) ||
        translations.parties.find(t => t.key === party.key || t.originalName === party.key || t.name === party.key);
      if (!transParty) return;
      party.name = transParty.displayName || transParty.name || party.name;
      party.description = transParty.description || party.description;
    });
  }

  if (Array.isArray(translations.questions)) {
    config.questions.forEach((q, i) => {
      const transQ = byIdOrIndex(translations.questions, q, i);
      if (!transQ) return;
      q.text = transQ.text || q.text;
      q.description = transQ.description || q.description;
      q.comment = transQ.comment || q.comment;
      if (transQ.answers) {
        q.answers.forEach((answer, j) => {
          const transAnswer = Array.isArray(transQ.answers)
            ? transQ.answers[j]
            : transQ.answers[answer.id] || transQ.answers[String(j)];
          if (transAnswer?.label) answer.label = transAnswer.label;
        });
      }
    });
  }
}

function updateUITexts() {
  const ui = translations?.ui || DEFAULT_UI_TEXTS.pl;
  // Aktualizacja tekstów w elementach (jeśli istnieją)
  if (ui.disclaimerTitle) {
    const disclaimer = document.getElementById('disclaimer');
    if (disclaimer) {
      const strong = disclaimer.querySelector('strong');
      if (strong) strong.textContent = ui.disclaimerTitle;
    }
  }
  if (ui.disclaimerText) {
    const disclaimer = document.getElementById('disclaimer');
    if (disclaimer) {
      const paragraphs = disclaimer.querySelectorAll('p');
      if (paragraphs.length > 1) paragraphs[1].innerHTML = ui.disclaimerText;
      if (paragraphs.length > 2) paragraphs[2].innerHTML = ui.disclaimerText2;
      if (paragraphs.length > 3) paragraphs[3].innerHTML = ui.disclaimerText3;
    }
  }
  const importLabel = document.getElementById('importLabel');
  if (importLabel && ui.importLabel) importLabel.textContent = ui.importLabel;
  const importCodeArea = document.getElementById('importCodeArea');
  if (importCodeArea && ui.importPlaceholder) importCodeArea.placeholder = ui.importPlaceholder;
  const importBtn = document.getElementById('importBtn');
  if (importBtn && ui.importBtn) importBtn.textContent = ui.importBtn;
  const importInfo = document.getElementById('importInfo');
  if (importInfo && ui.importInfo) importInfo.textContent = ui.importInfo;
  const simulateLabel = document.getElementById('simulateLabel');
  if (simulateLabel && ui.simulateLabel) simulateLabel.textContent = ui.simulateLabel;
  const simulateBtn = document.getElementById('simulateBtn');
  if (simulateBtn && ui.simulateBtn) simulateBtn.textContent = ui.simulateBtn;
  const restoreBtn = document.getElementById('restoreBtn');
  if (restoreBtn && ui.restoreBtn) restoreBtn.textContent = ui.restoreBtn;
  const simulateInfo = document.getElementById('simulateInfo');
  if (simulateInfo && ui.simulateInfo) simulateInfo.textContent = ui.simulateInfo;
  const submitBtnElem = document.getElementById('submitBtn');
  if (submitBtnElem && ui.submitBtn) submitBtnElem.textContent = ui.submitBtn;
  const modeLabel = document.getElementById('modeLabel');
  if (modeLabel && ui.modeLabel) modeLabel.textContent = ui.modeLabel;
  const modeFullLabel = document.getElementById('modeFullLabel');
  if (modeFullLabel && ui.modeFullLabel) modeFullLabel.textContent = ui.modeFullLabel;
  const modeAffirmativeLabel = document.getElementById('modeAffirmativeLabel');
  if (modeAffirmativeLabel && ui.modeAffirmativeLabel) modeAffirmativeLabel.textContent = ui.modeAffirmativeLabel;
  const resultsTitle = document.getElementById('resultsTitle');
  if (resultsTitle && ui.resultsTitle) resultsTitle.textContent = ui.resultsTitle;
  const closePopupBtnElem = document.getElementById('closePopup');
  if (closePopupBtnElem && ui.closePopup) closePopupBtnElem.textContent = ui.closePopup;
}

async function setLanguage(lang) {
  if (lang === currentLanguage) return;
  const success = await loadTranslations(lang);
  if (success === false && lang !== 'pl') return;
  currentLanguage = lang;
  applyTranslationsToConfig();
  updateUITexts();
  // Ponowne renderowanie pytań (jeśli istnieją)
  if (questionsContainer.children.length > 0) {
    renderQuestions();
    attachQuestionEvents();
    // Przywróć zaznaczenia odpowiedzi
    updateDOMSelections();
  }
  // Jeśli wyniki są widoczne – przelicz i wyświetl od nowa
  if (resultsDiv.style.display !== 'none') {
    computeAndDisplayResults();
  }
}

// ======================= KONFIGURACJA =======================
async function loadConfig() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Nie udało się wczytać data.json');
    configBase = await response.json();
    // Domyślnie ładujemy język polski (nie ładujemy pliku tłumaczeń, bo dane są po polsku)
    config = JSON.parse(JSON.stringify(configBase));
    try {
      const profilesResponse = await fetch('political_profiles.json');
      if (profilesResponse.ok) politicalProfiles = await profilesResponse.json();
    } catch (profilesErr) {
      console.warn('Nie udało się wczytać political_profiles.json, używam migracji runtime.', profilesErr);
    }
    if (!politicalProfiles) politicalProfiles = buildMigratedProfilesFromConfig();
    currentMatchingMode = localStorage.getItem('matchingMode') || politicalProfiles.defaultMatchingMode || 'modern';
    if (!['modern', 'legacy'].includes(currentMatchingMode)) currentMatchingMode = 'modern';
    translations = null; // dla polskiego brak zewnętrznych tłumaczeń
    currentLanguage = 'pl';
    updateUITexts(); // ustawi polskie teksty z domyślnych (ale możemy też załadować plik translations_pl.json – opcjonalnie)
    initApp();
    setupSimulation();
    setupMatchingModeSelector();
    setupModeSelector();
    setupImportExport();
    setupLanguageSelector();
  } catch (err) {
    console.error(err);
    questionsContainer.innerHTML = '<p style="color:red;">Błąd ładowania konfiguracji. Sprawdź czy plik data.json istnieje i jest poprawny.</p>';
  }
}

function setupLanguageSelector() {
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.value = currentLanguage;
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }
}

function initApp() {
  renderQuestions();
  attachQuestionEvents();
  submitBtn.addEventListener('click', computeAndDisplayResults);
  initThemeToggle();
}

function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const root = document.body;
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    root.classList.add('dark');
    toggleBtn.textContent = '☀️';
  } else {
    root.classList.remove('dark');
    toggleBtn.textContent = '🌙';
  }
  toggleBtn.addEventListener('click', () => {
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      toggleBtn.textContent = '🌙';
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      toggleBtn.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    }
  });
}

function renderQuestions() {
  questionsContainer.innerHTML = '';
  config.questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.dataset.id = q.id;
    const questionText = document.createElement('div');
    questionText.className = 'question-text';
    questionText.innerText = `${idx+1}. ${q.text}`;
    card.appendChild(questionText);
    const btnRow = document.createElement('div');
    const expandBtn = document.createElement('button');
    expandBtn.innerText = translations?.ui?.expandBtn || '📖 Rozwiń tezę';
    expandBtn.className = 'expand-btn';
    const descriptionDiv = document.createElement('div');
    descriptionDiv.className = 'description';
    descriptionDiv.innerText = q.description || (translations?.ui?.noDescription || 'Brak dodatkowego opisu.');
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      descriptionDiv.classList.toggle('visible');
      expandBtn.innerText = descriptionDiv.classList.contains('visible') ? (translations?.ui?.collapseBtn || '📘 Zwiń tezę') : (translations?.ui?.expandBtn || '📖 Rozwiń tezę');
    });
    btnRow.appendChild(expandBtn);
    if (q.comment) {
      const commentBtn = document.createElement('span');
      commentBtn.innerText = translations?.ui?.skipIfBadge || '⚠️ Pomiń jeśli';
      commentBtn.className = 'comment-badge';
      commentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPopup(q.comment);
      });
      btnRow.appendChild(commentBtn);
    }
    card.appendChild(btnRow);
    card.appendChild(descriptionDiv);
    const answersDiv = document.createElement('div');
    answersDiv.className = 'answers';
    q.answers.forEach((ans, ansIdx) => {
      const ansEl = document.createElement('div');
      ansEl.className = 'answer-option';
      ansEl.innerText = ans.label;
      ansEl.dataset.answerIndex = ansIdx;
      ansEl.dataset.value = ans.value;
      const label = ans.label;
      if (label.includes('Zdecydowanie zgadzam się') || label.includes('Strongly agree')) ansEl.classList.add('answer-strong-agree');
      else if (label.includes('Częściowo zgadzam się') || label.includes('Somewhat agree')) ansEl.classList.add('answer-mild-agree');
      else if (label.includes('Częściowo nie zgadzam się') || label.includes('Somewhat disagree')) ansEl.classList.add('answer-mild-disagree');
      else if (label.includes('Zdecydowanie nie zgadzam się') || label.includes('Strongly disagree')) ansEl.classList.add('answer-strong-disagree');
      else if (label.includes('Pomiń') || label.includes('Skip')) ansEl.classList.add('answer-skip');
      ansEl.addEventListener('click', () => {
        const siblings = answersDiv.querySelectorAll('.answer-option');
        siblings.forEach(sib => sib.classList.remove('selected'));
        ansEl.classList.add('selected');
        const existing = userAnswers.findIndex(a => a.questionId === q.id);
        const answerObj = {
          questionId: q.id,
          answerIndex: ansIdx,
          answerValue: ans.value,
          answerData: ans
        };
        if (existing !== -1) userAnswers[existing] = answerObj;
        else userAnswers.push(answerObj);
      });
      answersDiv.appendChild(ansEl);
    });
    card.appendChild(answersDiv);
    questionsContainer.appendChild(card);
  });
  updateDOMSelections();
}

function attachQuestionEvents() {}

function updateDOMSelections() {
  if (!config) return;
  document.querySelectorAll('.answer-option').forEach(opt => opt.classList.remove('selected'));
  for (const ans of userAnswers) {
    const card = document.querySelector(`.question-card[data-id='${ans.questionId}']`);
    if (!card) continue;
    const targetOption = card.querySelector(`.answer-option[data-answer-index='${ans.answerIndex}']`);
    if (targetOption) targetOption.classList.add('selected');
  }
}

function getCurrentDateTime() {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const MMmin = String(now.getMinutes()).padStart(2, '0');
  return `${YYYY}-${MM}-${DD} ${HH}:${MMmin}`;
}

function generateExportCode() {
  if (!config) return '';
  const dateStr = getCurrentDateTime();
  let output = `Data wykonania testu: ${dateStr}\n\n`;
  for (let i = 0; i < config.questions.length; i++) {
    const q = config.questions[i];
    const userAns = userAnswers.find(a => a.questionId === q.id);
    let answerText = 'Brak odpowiedzi';
    if (userAns && userAns.answerData) {
      answerText = userAns.answerData.label;
    } else if (userAns && userAns.answerValue === 0) {
      answerText = 'Pomiń';
    }
    output += `[id:${q.id}]: (${answerText});\n`;
  }
  return output;
}

function createExportSection() {
  const exportDiv = document.createElement('div');
  exportDiv.id = 'export-answers-section';
  exportDiv.className = 'export-answers-section';
  const exportTitle = translations?.ui?.exportTitle || '📋 Eksport Twoich odpowiedzi';
  const exportDesc = translations?.ui?.exportDesc || 'Skopiuj poniższy kod, aby zapisać lub przenieść swoje odpowiedzi do innego urządzenia.';
  const copyBtnText = translations?.ui?.copyExportBtn || '📋 Kopiuj kod eksportu';
  exportDiv.innerHTML = `
    <h3>${exportTitle}</h3>
    <p>${exportDesc}</p>
    <textarea id="exportCodeArea" class="export-code" rows="5" readonly></textarea>
    <button id="copyExportBtn" class="copy-export-btn">${copyBtnText}</button>
  `;
  const textarea = exportDiv.querySelector('#exportCodeArea');
  textarea.value = generateExportCode();
  const copyBtn = exportDiv.querySelector('#copyExportBtn');
  copyBtn.addEventListener('click', () => {
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
      copyBtn.textContent = '✅ ' + (translations?.ui?.copied || 'Skopiowano!');
      setTimeout(() => { copyBtn.textContent = copyBtnText; }, 2000);
    }).catch(() => showPopup(translations?.ui?.copyError || 'Nie udało się skopiować. Zaznacz kod ręcznie.'));
  });
  return exportDiv;
}

function refreshExportSection() {
  const existingExport = document.getElementById('export-answers-section');
  if (existingExport) existingExport.remove();
  const newExport = createExportSection();
  const shareSection = resultsDiv.querySelector('.share-section');
  if (shareSection) shareSection.insertAdjacentElement('afterend', newExport);
  else resultsDiv.appendChild(newExport);
}

function importAnswersFromExportCode(rawCode) {
  if (!config) return false;
  const lines = rawCode.split(/\r?\n/);
  const newAnswers = [];
  let matchedCount = 0;
  for (const line of lines) {
    // Nowy format: [id:123]: (odpowiedź);
    let match = line.match(/^\[id:(\d+)\]:\s*\((.*?)\);?$/);
    let questionId, answerText;
    if (match) {
      questionId = parseInt(match[1], 10);
      answerText = match[2].trim();
    } else {
      // Stary format: 1. treść [id:123]: (odpowiedź);
      match = line.match(/^\d+\.\s*(.+?)\s*\[id:(\d+)\]:\s*\((.*?)\);?$/);
      if (!match) continue;
      questionId = parseInt(match[2], 10);
      answerText = match[3].trim();
    }
    if (answerText === 'Brak odpowiedzi') continue;
    const question = config.questions.find(q => q.id === questionId);
    if (!question) continue;
    let matchedAnswer = null;
    let matchedIndex = -1;
    for (let idx = 0; idx < question.answers.length; idx++) {
      const ans = question.answers[idx];
      if (ans.label === answerText) {
        matchedAnswer = ans;
        matchedIndex = idx;
        break;
      }
    }
    if (!matchedAnswer && (answerText === 'Pomiń' || answerText === 'Skip')) {
      for (let idx = 0; idx < question.answers.length; idx++) {
        const ans = question.answers[idx];
        if (ans.value === 0 && (ans.label.includes('Pomiń') || ans.label.includes('Skip'))) {
          matchedAnswer = ans;
          matchedIndex = idx;
          break;
        }
      }
    }
    if (matchedAnswer) {
      newAnswers.push({
        questionId: question.id,
        answerIndex: matchedIndex,
        answerValue: matchedAnswer.value,
        answerData: matchedAnswer
      });
      matchedCount++;
    }
  }
  if (matchedCount === 0) {
    showPopup(translations?.ui?.importNoAnswers || 'Nie znaleziono żadnych prawidłowych odpowiedzi w kodzie. Upewnij się, że wklejasz poprawny kod eksportu.');
    return false;
  }
  userAnswers = newAnswers;
  updateDOMSelections();
  if (resultsDiv.style.display !== 'none') {
    computeAndDisplayResults();
  } else {
    showPopup(`${translations?.ui?.importSuccess || `Zaimportowano ${matchedCount} odpowiedzi.`} ${translations?.ui?.clickShowResults || 'Kliknij "Pokaż wyniki", aby zobaczyć zaktualizowany profil.'}`);
  }
  return true;
}

function setupImportExport() {
  const importBtn = document.getElementById('importBtn');
  const importTextarea = document.getElementById('importCodeArea');
  if (importBtn && importTextarea) {
    importBtn.addEventListener('click', () => {
      const code = importTextarea.value.trim();
      if (!code) {
        showPopup(translations?.ui?.pasteCode || 'Wklej kod eksportu w pole powyżej.');
        return;
      }
      const success = importAnswersFromExportCode(code);
      if (success) {
        importTextarea.value = '';
        questionsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
}

function computeScores(mode = currentScoringMode) {
  const ideologyScores = new Map();
  const partyScores = new Map();
  const valueScores = new Map();

  config.ideologies.forEach(ideo => ideologyScores.set(ideo.key || ideo.name, { sum: 0, maxPossible: 0, agreements: 0, disagreements: 0 }));
  config.parties.forEach(party => partyScores.set(party.key || party.name, { sum: 0, maxPossible: 0, agreements: 0, disagreements: 0 }));

  const allValueNames = new Set();
  config.pairsOfValues.forEach(pair => { allValueNames.add(pair.leftKey || pair.left); allValueNames.add(pair.rightKey || pair.right); });
  config.hiddenValues.forEach(v => allValueNames.add(v));
  allValueNames.forEach(v => valueScores.set(v, { sum: 0, maxPossible: 0, questionsInvolved: 0 }));

  for (const ans of userAnswers) {
    const weight = ans.answerValue;
    if (weight === 0) continue;
    const answer = ans.answerData;
    const absWeight = Math.abs(weight);

    if (currentMatchingMode === 'legacy' && mode === 'full') {
      for (const ideo of (answer.ideologies_for || [])) {
        const rec = ideologyScores.get(ideo);
        if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; if (weight > 0) rec.agreements++; else rec.disagreements++; }
      }
      for (const ideo of (answer.ideologies_against || [])) {
        const rec = ideologyScores.get(ideo);
        if (rec) { rec.sum -= absWeight; rec.maxPossible += 1.5; if (weight < 0) rec.agreements++; else rec.disagreements++; }
      }
    } else if (currentMatchingMode === 'legacy') {
      if (weight > 0) {
        for (const ideo of (answer.ideologies_for || [])) {
          const rec = ideologyScores.get(ideo);
          if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; rec.agreements++; }
        }
      }
    }

    if (currentMatchingMode === 'legacy' && mode === 'full') {
      for (const party of (answer.parties_for || [])) {
        const rec = partyScores.get(party);
        if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; if (weight > 0) rec.agreements++; else rec.disagreements++; }
      }
      for (const party of (answer.parties_against || [])) {
        const rec = partyScores.get(party);
        if (rec) { rec.sum -= absWeight; rec.maxPossible += 1.5; if (weight < 0) rec.agreements++; else rec.disagreements++; }
      }
    } else if (currentMatchingMode === 'legacy') {
      if (weight > 0) {
        for (const party of (answer.parties_for || [])) {
          const rec = partyScores.get(party);
          if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; rec.agreements++; }
        }
      }
    }

    if (mode === 'full') {
      for (const val of (answer.values_for || [])) {
        const rec = valueScores.get(val);
        if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; }
      }
      for (const val of (answer.values_against || [])) {
        const rec = valueScores.get(val);
        if (rec) { rec.sum -= absWeight; rec.maxPossible += 1.5; }
      }
    } else {
      if (weight > 0) {
        for (const val of (answer.values_for || [])) {
          const rec = valueScores.get(val);
          if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; }
        }
      }
    }
  }

  const normalizeScore = (rec) => {
    if (!rec || rec.maxPossible === 0) return 50;
    const raw = rec.sum;
    return Math.min(100, Math.max(0, (raw + rec.maxPossible) / (2 * rec.maxPossible) * 100));
  };

  const ideologyResults = [];
  for (let [key, rec] of ideologyScores.entries()) {
    const item = config.ideologies.find(i => (i.key || i.name) === key);
    ideologyResults.push({ key, name: item?.name || key, percent: normalizeScore(rec), agreements: rec.agreements, disagreements: rec.disagreements, involved: rec.maxPossible / 1.5, description: item?.description || '' });
  }
  ideologyResults.sort((a,b) => b.percent - a.percent);

  const partyResults = [];
  for (let [key, rec] of partyScores.entries()) {
    const item = config.parties.find(p => (p.key || p.name) === key);
    partyResults.push({ key, name: item?.name || key, percent: normalizeScore(rec), agreements: rec.agreements, disagreements: rec.disagreements, involved: rec.maxPossible / 1.5, description: item?.description || '' });
  }
  partyResults.sort((a,b) => b.percent - a.percent);

  const pairResults = [];
  for (let pair of config.pairsOfValues) {
    const recLeft = valueScores.get(pair.leftKey || pair.left);
    const recRight = valueScores.get(pair.rightKey || pair.right);
    const sumL = recLeft ? recLeft.sum : 0;
    const maxL = recLeft ? recLeft.maxPossible : 0;
    const sumR = recRight ? recRight.sum : 0;
    const maxR = recRight ? recRight.maxPossible : 0;
    const totalMax = maxL + maxR;
    let leftPercent, rightPercent;
    if (totalMax === 0) {
      leftPercent = 50;
      rightPercent = 50;
    } else {
      const net = sumL - sumR;
      leftPercent = (net + totalMax) / (2 * totalMax) * 100;
      leftPercent = Math.min(100, Math.max(0, leftPercent));
      rightPercent = 100 - leftPercent;
    }
    pairResults.push({
      left: pair.left,
      right: pair.right,
      leftKey: pair.leftKey || pair.left,
      rightKey: pair.rightKey || pair.right,
      leftPercent: leftPercent,
      rightPercent: rightPercent,
      leftDef: pair.leftDef,
      rightDef: pair.rightDef
    });
  }

  if (currentMatchingMode === 'modern') {
    return {
      pairResults,
      ideologyResults: getModernRanking('ideology'),
      partyResults: getModernRanking('party')
    };
  }

  return { pairResults, ideologyResults, partyResults };
}

// ========== ODZNAKI: DEFINICJE I ICH OPISY ==========
const badgesDescriptions = {
  "Monarchizm": "Poparcie dla dziedzicznej władzy, często legitymizowanej boskim prawem lub tradycją. Kładzie nacisk na stabilność, ciągłość i hierarchię.",
  "Anarchizm": "Odrzucenie państwa i wszelkiej przymusowej władzy na rzecz dobrowolnych, zdecentralizowanych wspólnot i bezpośredniej demokracji.",
  "Technokracja": "Przekonanie, że rządzić powinni eksperci i specjaliści, a decyzje polityczne powinny być oparte na danych naukowych i efektywności.",
  "Oligarchia": "Akceptacja koncentracji władzy i bogactwa w rękach nielicznych, często usprawiedliwiana naturalnymi nierównościami lub efektywnością.",
  "Państwo minimalne": "Postulat ograniczenia roli państwa wyłącznie do funkcji ochronnych (sądy, policja, wojsko), bez ingerencji w gospodarkę i życie prywatne.",
  "Państwo opiekuńcze": "Model, w którym państwo zapewnia obywatelom bezpieczeństwo socjalne, dostęp do edukacji, ochrony zdrowia i redystrybucję dochodów.",
  "Secesjonizm": "Prawo regionów lub grup etnicznych do pokojowego odłączenia się od istniejącego państwa i utworzenia własnej administracji.",
  "Agraryzm": "Uznanie rolnictwa i wsi za fundament społeczeństwa, promowanie rodzinnych gospodarstw oraz tradycyjnego stylu życia."
};

// Ścieżka do obrazków odznak (użytkownik może umieścić pliki w tym katalogu)
const BADGES_IMG_BASE_PATH = window.BadgesRegistry?.imageBase || 'images/Odznaki/';

function createBadgesSection(badges) {
  const section = document.createElement('div');
  section.className = 'badges-section';
  const registryLabels = window.BadgesRegistry?.labels || {};
  const header = document.createElement('h3');
  header.textContent = getLocalizedValue(registryLabels.title, translations?.ui?.badgesTitle || 'Odznaki');
  section.appendChild(header);

  if (!badges.length) {
    const none = document.createElement('p');
    none.textContent = getLocalizedValue(registryLabels.empty, translations?.ui?.noBadges || 'Nie zdobyto jeszcze zadnej odznaki.');
    none.className = 'no-badges';
    section.appendChild(none);
    return section;
  }

  const badgesContainer = document.createElement('div');
  badgesContainer.className = 'badges-list';
  badges.forEach(badge => {
    const badgeName = getLocalizedValue(badge.name, badge.id || 'Odznaka');
    const badgeDescription = getLocalizedValue(badge.description, translations?.ui?.noDescription || 'Brak opisu.');
    const badgeEl = document.createElement('button');
    badgeEl.type = 'button';
    badgeEl.className = 'badge-item';
    const iconUrl = badge.icon || badge.image || `${BADGES_IMG_BASE_PATH}${badge.id}.png`;
    badgeEl.innerHTML = `<img class="badge-icon" src="${iconUrl}" alt=""><span class="badge-mark">*</span><span>${badgeName}</span>`;
    const icon = badgeEl.querySelector('.badge-icon');
    icon.addEventListener('load', () => {
      icon.classList.add('loaded');
      badgeEl.querySelector('.badge-mark')?.remove();
    });
    icon.addEventListener('error', () => icon.remove());
    badgeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      showPopup(`${badgeName}\n\n${badgeDescription}`);
    });
    badgesContainer.appendChild(badgeEl);
  });
  section.appendChild(badgesContainer);
  return section;
}

// ========== ZMODYFIKOWANA FUNKCJA createRankingSection ==========
function createRankingSection(title, items, type) {
  const section = document.createElement('div');
  section.className = 'ranking-section';
  const header = document.createElement('h3');
  header.textContent = title;
  section.appendChild(header);

  // pulsująca ikona tylko dla rankingu użytkowników
  if (title === (translations?.ui?.rankingUsers || 'Ranking użytkowników')) {
    const pulseIcon = document.createElement('span');
    pulseIcon.textContent = '❗';
    pulseIcon.className = 'pulse-icon';
    pulseIcon.style.marginLeft = '8px';
    pulseIcon.style.cursor = 'pointer';
    pulseIcon.style.fontSize = '1.2rem';
    pulseIcon.style.display = 'inline-block';
    pulseIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      showPopup('Jeśli chcesz zostać dodanym do publicznego rankingu to wyślij pod maila autystykx@gmail.com obowiązkowo swój nick i avatar i ewentualnie krótki opis, reklamę, linki do sociali czy cokolwiek zapragniesz.');
    });
    header.appendChild(pulseIcon);
  }

  if (title.includes('Ideologii') || title.includes('Ideologies')) {
    const info = document.createElement('div');
    info.style.marginBottom = '1rem';
    info.textContent = translations?.ui?.rankingInfo || 'Im wyższy procent, tym bardziej Twój profil jest zgodny z daną ideologią.';
    section.appendChild(info);
  }
  const listContainer = document.createElement('div');
  listContainer.className = 'ranking-list';
  
  items.forEach((item, idx) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = `ranking-item ${type === 'ideology' ? 'ideology-entry' : type === 'party' ? 'party-entry' : 'user-entry'}`;

    if (type === 'party') {
      const logoUrl = getPartyLogoUrl(item.name);
      if (logoUrl) {
        const img = document.createElement('img');
        img.src = logoUrl;
        img.alt = `Logo ${item.name}`;
        img.className = 'party-logo-small';
        img.style.width = '28px';
        img.style.height = '28px';
        img.style.objectFit = 'contain';
        img.style.marginRight = '10px';
        img.style.verticalAlign = 'middle';
        itemDiv.appendChild(img);
      }
      const nameSpan = document.createElement('span');
      nameSpan.className = 'rank-name';
      nameSpan.textContent = item.name;
      itemDiv.appendChild(nameSpan);
    } else if (type === 'ideology') {
      const logoUrl = getIdeologyLogoUrl(item.name);
      if (logoUrl) {
        const img = document.createElement('img');
        img.src = logoUrl;
        img.alt = `Logo ${item.name}`;
        img.className = 'ideology-logo-small';
        img.style.width = '28px';
        img.style.height = '28px';
        img.style.objectFit = 'contain';
        img.style.marginRight = '10px';
        img.style.verticalAlign = 'middle';
        itemDiv.appendChild(img);
      }
      const nameSpan = document.createElement('span');
      nameSpan.className = 'rank-name';
      nameSpan.textContent = item.name;
      itemDiv.appendChild(nameSpan);
    } else if (type === 'user') {
      const logoUrl = item.logo || (item.avatar ? `images/IUsers/${item.avatar}` : '');
      if (logoUrl && item.isDataUser) {
        const img = document.createElement('img');
        img.src = logoUrl;
        img.alt = `Avatar ${item.name}`;
        img.className = 'user-logo-small';
        itemDiv.appendChild(img);
      } else {
        const dot = document.createElement('span');
        dot.className = 'friend-dot ranking-friend-dot';
        itemDiv.appendChild(dot);
      }
      const nameSpan = document.createElement('span');
      nameSpan.className = 'rank-name';
      nameSpan.textContent = item.name;
      itemDiv.appendChild(nameSpan);
    } else {
      const nameSpan = document.createElement('span');
      nameSpan.className = 'rank-name';
      nameSpan.textContent = item.name;
      itemDiv.appendChild(nameSpan);
    }

    const percentSpan = document.createElement('span');
    percentSpan.className = 'rank-percent';
    percentSpan.textContent = `${Math.round(item.percent)}%`;
    itemDiv.appendChild(percentSpan);

    // Zmodyfikowana obsługa kliknięcia
    if (type === 'party') {
      itemDiv.addEventListener('click', () => showPartyPopup(item.name, item.description || ''));
    } else if (type === 'ideology') {
      itemDiv.addEventListener('click', () => showIdeologyPopup(item.name, item.description || ''));
} else if (type === 'user') {
      itemDiv.addEventListener('click', () => {
        const existingLogo = popup.querySelector('.popup-logo-img');
        if (existingLogo) existingLogo.remove();

        if (item.isDataUser) {
          // Użytkownik z data.json – pełny popup z avatarem i opisem
          if (item.avatar) {
            const img = document.createElement('img');
            img.src = `images/IUsers/${item.avatar}`;
            img.alt = `Avatar ${item.name}`;
            img.className = 'popup-logo-img';
            img.style.cssText = 'display: block; max-width: 120px; max-height: 120px; margin: 0 auto 16px auto; object-fit: cover; border-radius: 50%;';
            const popupContent = popup.querySelector('.popup-content');
            popupContent.insertBefore(img, popupText);
          }
          // Obsługa linków w opisie
          const description = item.description || 'Brak opisu.';
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          if (urlRegex.test(description)) {
            popupText.innerHTML = '';
            const nameEl = document.createElement('strong');
            nameEl.textContent = item.name;
            popupText.appendChild(nameEl);
            popupText.appendChild(document.createElement('br'));
            popupText.appendChild(document.createElement('br'));
            description.split(urlRegex).forEach(part => {
              if (part.match(/^https?:\/\//)) {
                const a = document.createElement('a');
                a.href = part;
                a.textContent = part;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                popupText.appendChild(a);
              } else if (part) {
                popupText.appendChild(document.createTextNode(part));
              }
            });
          } else {
            popupText.innerText = `${item.name}\n\n${description}`;
          }
          popup.classList.remove('hidden');
        } else {
          // Użytkownik zaimportowany ręcznie – stary tekst
          showPopup(`${item.name}\n\nZgodnosc obliczona na podstawie wspolnych odpowiedzi.`);
        }
      });
    } else {
      itemDiv.addEventListener('click', () => showPopup(`${item.name}\n${item.description || ''}`));
    }

    listContainer.appendChild(itemDiv);
  });
  
  section.appendChild(listContainer);
  return section;
}

function generateShareCode(pairResults) {
  const resultsString = pairResults.map(pair => `${pair.left}(${Math.round(pair.leftPercent)}) - ${pair.right}(${Math.round(pair.rightPercent)})`).join('; ');
  let base64 = '';
  try { base64 = btoa(unescape(encodeURIComponent(resultsString))); } catch(e) { console.error(e); base64 = ''; }
  const container = document.createElement('div');
  container.className = 'share-section';
  const shareTitle = translations?.ui?.shareTitle || '🔗 Sprawdź położenie na kompasie';
  const shareDesc = translations?.ui?.shareDesc || 'Skopiuj poniższy kod i wklej go na stronie z kompasem, by poznać swoje położenie:';
  const copyBtnText = translations?.ui?.copyShareBtn || '📋 Kopiuj kod';
  const compassLinkText = translations?.ui?.compassLink || '🧭 NeoAutystyk Kompas';
  container.innerHTML = `<h3>${shareTitle}</h3>
    <p>${shareDesc}</p>
    <textarea readonly class="share-code" rows="3">${base64}</textarea>
    <button class="copy-btn">${copyBtnText}</button>
    <p class="share-link">
      <a href="https://zbieraczartur.github.io/NeoAutystyk-Kompas/" target="_blank" rel="noopener noreferrer" class="compass-link">${compassLinkText}</a>
    </p>`;
  const copyBtn = container.querySelector('.copy-btn');
  const textarea = container.querySelector('.share-code');
  copyBtn.addEventListener('click', () => {
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
      copyBtn.textContent = '✅ ' + (translations?.ui?.copied || 'Skopiowano!');
      setTimeout(() => { copyBtn.textContent = copyBtnText; }, 2000);
    }).catch(() => alert('Nie udało się skopiować. Możesz zaznaczyć kod ręcznie.'));
  });
  return container;
}

function computeAndDisplayResults() {
  const { pairResults, ideologyResults, partyResults } = computeScores(currentScoringMode);

  // Grupowanie par wartości
  const groups = new Map();
  for (const pair of pairResults) {
    const catId = categoryMapping[pair.leftKey || pair.left];
    if (!catId) continue;
    if (!groups.has(catId)) groups.set(catId, { name: categoryNames[catId], pairs: [] });
    groups.get(catId).pairs.push(pair);
  }
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);

  const valuesHeader = translations?.ui?.valuesHeader || '⚖️ Pary wartości';
  valuesResults.innerHTML = `<h3>${valuesHeader}</h3>`;
  const gridContainer = document.createElement('div');
  gridContainer.className = 'values-categories-grid';
  for (const [catId, group] of sortedGroups) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'value-category-block';
    const catHeader = document.createElement('h4');
    catHeader.className = 'category-header';
    catHeader.textContent = group.name;
    categoryDiv.appendChild(catHeader);
    for (const pair of group.pairs) {
      const leftColor = valueColors[pair.leftKey || pair.left] || '#3b82f6';
      const rightColor = valueColors[pair.rightKey || pair.right] || '#ef4444';
      const leftTextColor = getContrastColor(leftColor);
      const rightTextColor = getContrastColor(rightColor);
      const pairDiv = document.createElement('div');
      pairDiv.className = 'value-pair';
      pairDiv.innerHTML = `
        <div class="value-bar-container-new">
          <span class="value-left-new" data-def="${pair.leftDef}">${pair.left}</span>
          <div class="value-bar-new">
            <div class="bar-left-new" style="width: ${pair.leftPercent}%; background-color: ${leftColor}; color: ${leftTextColor};">${Math.round(pair.leftPercent)}%</div>
            <div class="bar-right-new" style="width: ${pair.rightPercent}%; background-color: ${rightColor}; color: ${rightTextColor};">${Math.round(pair.rightPercent)}%</div>
          </div>
          <span class="value-right-new" data-def="${pair.rightDef}">${pair.right}</span>
        </div>
      `;
      const leftSpan = pairDiv.querySelector('.value-left-new');
      const rightSpan = pairDiv.querySelector('.value-right-new');
      
      leftSpan.style.setProperty('--hover-color', leftColor);
      rightSpan.style.setProperty('--hover-color', rightColor);
      
      leftSpan.addEventListener('click', () => showPopup(pair.leftDef));
      rightSpan.addEventListener('click', () => showPopup(pair.rightDef));
      categoryDiv.appendChild(pairDiv);
    }
    gridContainer.appendChild(categoryDiv);
  }
  valuesResults.appendChild(gridContainer);

  ideologiesResults.innerHTML = '';
  partiesResults.innerHTML = '';
  if (usersResults) usersResults.innerHTML = '';

  // ---- DODANIE SEKCJI ODZNAK (pod osiami, nad rankingami) ----
  const badges = computeBadges();
  const existingBadgesSection = resultsDiv.querySelector('.badges-section');
  if (existingBadgesSection) existingBadgesSection.remove();
  const badgesSection = createBadgesSection(badges);
  // Wstawiamy przed kontenerem rankingów
  const ideologiesPartiesContainer = document.querySelector('.ideologies-parties-container');
  if (ideologiesPartiesContainer) {
    ideologiesPartiesContainer.parentNode.insertBefore(badgesSection, ideologiesPartiesContainer);
  } else {
    // jeżeli kontener nie istnieje (np. przy pierwszym uruchomieniu), wstawiamy po wartości
    valuesResults.parentNode.insertBefore(badgesSection, valuesResults.nextSibling);
  }
  // ------------------------------------------------

  // BANNER SYMULACJI (dla partii lub ideologii)
  const existingBanner = resultsDiv.querySelector('.simulation-banner');
  if (existingBanner) existingBanner.remove();
  if (simulatedEntity) {
    const banner = document.createElement('div');
    banner.className = 'simulation-banner';
    let logoUrl = null;
    let entityTypeLabel = '';
    if (simulatedEntity.type === 'party') {
      logoUrl = getPartyLogoUrl(simulatedEntity.name);
      entityTypeLabel = translations?.ui?.simulatingParty || 'partię';
    } else if (simulatedEntity.type === 'ideology') {
      logoUrl = getIdeologyLogoUrl(simulatedEntity.name);
      entityTypeLabel = translations?.ui?.simulatingIdeology || 'ideologię';
    }
    let logoHtml = '';
    if (logoUrl) {
      logoHtml = `<img src="${logoUrl}" alt="Logo ${simulatedEntity.name}" class="simulation-banner-logo">`;
    }
    banner.innerHTML = `
      ${logoHtml}
      <div class="simulation-banner-text">
        🎭 ${translations?.ui?.simulating || 'Symulujesz'} ${entityTypeLabel}: <strong>${simulatedEntity.name}</strong><br>
        <small>${translations?.ui?.simulationNote || 'Wyniki poniżej są tymczasowe. Kliknij „Przywróć moje odpowiedzi”, aby wrócić do własnych.'}</small>
      </div>
    `;
    if (ideologiesPartiesContainer) {
      ideologiesPartiesContainer.parentNode.insertBefore(banner, ideologiesPartiesContainer);
    } else {
      partiesResults.parentNode.insertBefore(banner, partiesResults);
    }
  }

  const ideologiesTitle = translations?.ui?.rankingIdeologies || '📊 Ranking ideologii';
  const partiesTitle = translations?.ui?.rankingParties || '🗳️ Ranking partii';
  ideologiesResults.appendChild(createRankingSection(ideologiesTitle, ideologyResults, 'ideology'));
  partiesResults.appendChild(createRankingSection(partiesTitle, partyResults, 'party'));
  if (usersResults && typeof window.getUserRankingItems === 'function') {
    const usersTitle = translations?.ui?.rankingUsers || '🐻 Ranking użytkowników';
    usersResults.appendChild(createRankingSection(usersTitle, window.getUserRankingItems(), 'user'));
  }

  // ==================== ZMODYFIKOWANY FRAGMENT ====================
  // USUNIĘTO sekcję "Sprawdź położenie na kompasie" (kod base64) – zgodnie z życzeniem
  resultsDiv.style.display = 'block';
  refreshExportSection();

  // DODANIE informacji przy rankingu użytkowników
  const usersResultsDiv = document.getElementById('users-results');
  if (usersResultsDiv && !usersResultsDiv.querySelector('.ranking-info-note')) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'ranking-info-note';
    infoDiv.style.marginTop = '0.8rem';
    infoDiv.style.fontSize = '0.85rem';
    infoDiv.style.fontStyle = 'italic';
    infoDiv.style.color = 'var(--footer-color)';
    infoDiv.innerHTML = '💡 Jeśli chcesz zostać dodany do rankingu użytkowników, wyślij swój kod eksportu (znajdziesz go poniżej) na adres: <a href="mailto:autystykx@gmail.com">autystykx@gmail.com</a>';
    usersResultsDiv.appendChild(infoDiv);
  }
  // ================================================================

  window.scrollTo({ top: resultsDiv.offsetTop - 20, behavior: 'smooth' });
}

let simulationSelect = null;
let simulateBtn = null;
let restoreBtn = null;

function syncUserAnswersFromDOM() {
  const newAnswers = [];
  const questionCards = document.querySelectorAll('.question-card');
  questionCards.forEach(card => {
    const qid = parseInt(card.dataset.id);
    const questionConfig = config.questions.find(q => q.id === qid);
    if (!questionConfig) return;
    const selectedAnswer = card.querySelector('.answer-option.selected');
    if (selectedAnswer) {
      const ansIdx = parseInt(selectedAnswer.dataset.answerIndex);
      const answerData = questionConfig.answers[ansIdx];
      newAnswers.push({
        questionId: qid,
        answerIndex: ansIdx,
        answerValue: answerData.value,
        answerData: answerData
      });
    } else {
      const skipAnswer = questionConfig.answers.find(a => a.value === 0 && (a.label.includes('Pomiń') || a.label.includes('Skip')));
      if (skipAnswer) {
        const ansIdx = questionConfig.answers.indexOf(skipAnswer);
        newAnswers.push({
          questionId: qid,
          answerIndex: ansIdx,
          answerValue: 0,
          answerData: skipAnswer
        });
      }
    }
  });
  userAnswers = newAnswers;
}

function restoreUserAnswers() {
  syncUserAnswersFromDOM();
  simulatedEntity = null;
  computeAndDisplayResults();
  showPopup(translations?.ui?.restored || 'Przywrócono Twoje odpowiedzi i odświeżono wyniki.');
}

function simulateAnswers(selectedName) {
  const isParty = config.parties.some(p => p.name === selectedName);
  const isIdeology = config.ideologies.some(i => i.name === selectedName);
  if (isParty) {
    simulatedEntity = { type: 'party', name: selectedName };
  } else if (isIdeology) {
    simulatedEntity = { type: 'ideology', name: selectedName };
  } else {
    // symulacja użytkownika
    const isUser = config.users && config.users.some(u => u.name === selectedName);
    if (isUser) {
      const user = config.users.find(u => u.name === selectedName);
      if (user && user.exportCode) {
        const parsed = parseExportCode(user.exportCode);
        const userAnswerRows = parsed.filter(row => !row.noteOnly && row.answerData);
        if (userAnswerRows.length) {
          simulatedEntity = { type: 'user', name: selectedName };
          userAnswers = userAnswerRows;
          updateDOMSelections();
          computeAndDisplayResults();
          return;
        }
      }
    }
    simulatedEntity = null;
  }

  if (currentMatchingMode === 'modern' && (isParty || isIdeology)) {
    const profileType = isParty ? 'party' : 'ideology';
    const profile = getProfileByName(selectedName, profileType);
    if (profile?.exportCode && typeof parseExportCode === 'function') {
      const parsed = parseExportCode(profile.exportCode).filter(row => !row.noteOnly && row.answerData);
      if (parsed.length) {
        userAnswers = parsed;
        updateDOMSelections();
        computeAndDisplayResults();
        return;
      }
    }
  }

  const simulatedAnswers = [];
  for (const question of config.questions) {
    let bestAnswer = null;
    let bestAbsValue = -1;
    for (const answer of question.answers) {
      const partiesFor = answer.parties_for || [];
      const ideologiesFor = answer.ideologies_for || [];
      if (partiesFor.includes(selectedName) || ideologiesFor.includes(selectedName)) {
        const absVal = Math.abs(answer.value);
        if (absVal > bestAbsValue) {
          bestAbsValue = absVal;
          bestAnswer = answer;
        }
      }
    }
    if (!bestAnswer) {
      bestAnswer = question.answers.find(a => a.value === 0 && (a.label.includes('Pomiń') || a.label.includes('Skip')));
      if (!bestAnswer) bestAnswer = question.answers[0];
    }
    const answerIndex = question.answers.findIndex(a => a === bestAnswer);
    simulatedAnswers.push({
      questionId: question.id,
      answerIndex: answerIndex,
      answerValue: bestAnswer.value,
      answerData: bestAnswer
    });
  }
  userAnswers = simulatedAnswers;
  updateDOMSelections();
  computeAndDisplayResults();
}

function setupSimulation() {
  simulationSelect = document.getElementById('simulateSelect');
  simulateBtn = document.getElementById('simulateBtn');
  restoreBtn = document.getElementById('restoreBtn');
  if (!simulationSelect || !simulateBtn || !restoreBtn) return;
  if (!config || !config.parties || !config.ideologies) return;
  simulationSelect.innerHTML = '';
  if (config.parties.length) {
    const partiesGroup = document.createElement('optgroup');
    partiesGroup.label = translations?.ui?.partiesGroup || '🇵🇱 Partie polityczne';
    config.parties.forEach(party => {
      const option = document.createElement('option');
      option.value = party.name;
      option.textContent = party.name;
      partiesGroup.appendChild(option);
    });
    simulationSelect.appendChild(partiesGroup);
  }
  if (config.ideologies.length) {
    const ideologiesGroup = document.createElement('optgroup');
    ideologiesGroup.label = translations?.ui?.ideologiesGroup || '💡 Ideologie';
    config.ideologies.forEach(ideo => {
      const option = document.createElement('option');
      option.value = ideo.name;
      option.textContent = ideo.name;
      ideologiesGroup.appendChild(option);
    });
    simulationSelect.appendChild(ideologiesGroup);
  }

  // DODANIE UŻYTKOWNIKÓW DO SYMULACJI
  const usersGroup = document.createElement('optgroup');
  usersGroup.label = translations?.ui?.usersGroup || '🐻 Użytkownicy';
  // Pobierz listę użytkowników z config.users lub domyślną
  let userList = [];
  if (config.users && Array.isArray(config.users)) {
    userList = config.users;
  } else {
    // Domyślny użytkownik, jeśli brak w config
    userList = [{ name: 'CusterKnuckle', description: 'Opis użytkownika – możesz go zmienić później.' }];
  }
  userList.forEach(user => {
    const option = document.createElement('option');
    option.value = user.name;
    option.textContent = user.name;
    usersGroup.appendChild(option);
  });
  simulationSelect.appendChild(usersGroup);

  if (config.parties.length) simulationSelect.value = config.parties[0].name;
  else if (config.ideologies.length) simulationSelect.value = config.ideologies[0].name;
  simulateBtn.addEventListener('click', () => {
    const selected = simulationSelect.value;
    if (selected) simulateAnswers(selected);
    else alert(translations?.ui?.selectEntity || 'Wybierz partię lub ideologię.');
  });
  restoreBtn.addEventListener('click', restoreUserAnswers);
}

function setupModeSelector() {
  const radios = document.querySelectorAll('input[name="scoringMode"]');
  const helpBtn = document.getElementById('modeHelpBtn');
  const savedMode = localStorage.getItem('scoringMode');
  if (savedMode === 'affirmative') {
    currentScoringMode = 'affirmative';
    document.querySelector('input[value="affirmative"]').checked = true;
  } else {
    currentScoringMode = 'full';
    document.querySelector('input[value="full"]').checked = true;
  }
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        currentScoringMode = e.target.value;
        localStorage.setItem('scoringMode', currentScoringMode);
        if (resultsDiv.style.display !== 'none') {
          computeAndDisplayResults();
        }
      }
    });
  });
  helpBtn.addEventListener('click', () => {
    const helpText = translations?.ui?.modeHelpText || '🧠 Tryb pełnego profilowania\nUwzględnia zarówno poglądy popierane, jak i odrzucane.\n\n✅ Tryb afirmacyjny\nUwzględnia wyłącznie poglądy aktywnie popierane.';
    showPopup(helpText);
  });
}

// ======================= INTEGRACJA Z KOMPASEM =======================
let currentCompassMode = 'weighted';
let currentCreativeConfig = {
  activePairs: [],
  labels: { top: "Heteronomia", bottom: "Autonomia", left: "Socjalizm", right: "Kapitalizm" }
};
let compassUserValues = null; // mapa wartości dla użytkownika

// Funkcja do budowania mapy wartości dla użytkownika na podstawie pairResults
function buildUserValuesMap(pairResults) {
  const valuesMap = {};
  // Używamy tych samych identyfikatorów par co w compass-core
  const allCompassPairs = [...corePairs, ...extraPairs];
  for (const pair of allCompassPairs) {
    // Znajdź w pairResults parę pasującą (left/right)
    const found = pairResults.find(p =>
      (p.leftKey || p.left) === pair.negativeLabel && (p.rightKey || p.right) === pair.positiveLabel
    );
    if (found) {
      valuesMap[pair.id] = {
        negative: found.leftPercent,
        positive: found.rightPercent
      };
    } else {
      // Szukaj odwrotnej kolejności
      const foundReverse = pairResults.find(p =>
        (p.leftKey || p.left) === pair.positiveLabel && (p.rightKey || p.right) === pair.negativeLabel
      );
      if (foundReverse) {
        valuesMap[pair.id] = {
          negative: foundReverse.rightPercent,
          positive: foundReverse.leftPercent
        };
      } else {
        valuesMap[pair.id] = { negative: null, positive: null };
      }
    }
  }
  return valuesMap;
}

// Funkcja aktualizująca kompas w kontenerze głównym i w modalu
function updateCompassDisplay() {
  const valuesMap = compassUserValues;
  if (!valuesMap) return;
  const coords = computeCoordinatesFromValues(valuesMap, currentCompassMode, currentCreativeConfig);
  if (window.compassInstance && window.compassInstance.updateMarker) {
    window.compassInstance.updateMarker(coords.x, coords.y);
    window.compassInstance.updateActivePairs(coords.activePairsCount);
    window.compassInstance.updateModeLabel(currentCompassMode);
  }
  if (window.modalCompassInstance && window.modalCompassInstance.updateMarker) {
    window.modalCompassInstance.updateMarker(coords.x, coords.y);
    window.modalCompassInstance.updateActivePairs(coords.activePairsCount);
    window.modalCompassInstance.updateModeLabel(currentCompassMode);
  }
  // Zapamiętaj współrzędne do ewentualnego użycia przy nakładkach
  window.currentUserCoords = { x: coords.x, y: coords.y };
}

// Ładowanie nakładek (partie, ideologie, użytkownicy)
async function loadOverlays(showParties, showIdeologies, compassInstance) {
  const showUsers = document.getElementById('toggle-users')?.checked || false;
  if (!compassInstance || !compassInstance.clearOverlays) return;
  compassInstance.clearOverlays();
  if (!config) return;
  if (showParties && config.parties) {
    for (const party of config.parties) {
      const coords = await getEntityCoordinates(party.key || party.name, 'party');
      if (coords) {
        const logoUrl = getPartyLogoUrl(party.name);
        compassInstance.addOverlay(logoUrl, coords.x, coords.y, 'party', party.name, party.description);
      }
    }
  }
  if (showIdeologies && config.ideologies) {
    for (const ideology of config.ideologies) {
      const coords = await getEntityCoordinates(ideology.key || ideology.name, 'ideology');
      if (coords) {
        const logoUrl = getIdeologyLogoUrl(ideology.name);
        compassInstance.addOverlay(logoUrl, coords.x, coords.y, 'ideology', ideology.name, ideology.description);
      }
    }
  }
  if (showUsers && config.users) {
    for (const user of config.users) {
      const coords = await getEntityCoordinates(user.name, 'user');
      if (coords) {
        const avatarUrl = user.avatar ? `images/IUsers/${user.avatar}` : null;
        const logoUrl = avatarUrl || 'images/default-user.png'; // możesz zastąpić domyślną ikoną
        compassInstance.addOverlay(logoUrl, coords.x, coords.y, 'user', user.name, user.description || '');
      }
    }
  }
}

function setupMatchingModeSelector() {
  const radios = document.querySelectorAll('input[name="matchingMode"]');
  if (!radios.length) return;
  radios.forEach(radio => {
    radio.checked = radio.value === currentMatchingMode;
    radio.addEventListener('change', (event) => {
      currentMatchingMode = event.target.value === 'legacy' ? 'legacy' : 'modern';
      localStorage.setItem('matchingMode', currentMatchingMode);
      window.currentMatchingMode = currentMatchingMode;
      if (resultsDiv.style.display !== 'none') computeAndDisplayResults();
      if (typeof updateCompassDisplay === 'function') updateCompassDisplay();
      const showParties = document.getElementById('toggle-parties')?.checked || false;
      const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
      if (typeof loadOverlays === 'function') {
        loadOverlays(showParties, showIdeologies, window.compassInstance);
        if (window.modalCompassInstance) {
          const modalShowParties = document.getElementById('modal-toggle-parties')?.checked || false;
          const modalShowIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
          loadOverlays(modalShowParties, modalShowIdeologies, window.modalCompassInstance);
        }
      }
    });
  });
  window.currentMatchingMode = currentMatchingMode;
}

// Obliczanie współrzędnych dla partii/ideologii/użytkownika
async function getEntityCoordinates(name, type) {
  if (type === 'user') {
    const user = getProfileByName(name, 'user') || config.users.find(u => u.name === name);
    if (!user || !user.exportCode) return { x: 0, y: 0 };
    const parsed = parseExportCode(user.exportCode).filter(row => !row.noteOnly && row.answerData);
    if (!parsed.length) return { x: 0, y: 0 };
    const scores = computeScoresForAnswers(parsed, 'full');
    const valuesMap = buildUserValuesMap(scores.pairResults);
    const coords = computeCoordinatesFromValues(valuesMap, currentCompassMode, currentCreativeConfig);
    return { x: coords.x, y: coords.y };
  } else {
    if (currentMatchingMode === 'modern') {
      const profile = getProfileByName(name, type);
      if (profile?.exportCode && typeof parseExportCode === 'function') {
        const parsed = parseExportCode(profile.exportCode).filter(row => !row.noteOnly && row.answerData);
        if (parsed.length) {
          const scores = computeScoresForAnswers(parsed, currentScoringMode);
          const valuesMap = buildUserValuesMap(scores.pairResults);
          const coords = computeCoordinatesFromValues(valuesMap, currentCompassMode, currentCreativeConfig);
          return { x: coords.x, y: coords.y };
        }
      }
    }
    // Symulacja odpowiedzi dla danej entitiy (partia/ideologia)
    const simulatedAnswers = [];
    for (const question of config.questions) {
      let bestAnswer = null;
      let bestAbsValue = -1;
      for (const answer of question.answers) {
        const partiesFor = answer.parties_for || [];
        const ideologiesFor = answer.ideologies_for || [];
        if ((type === 'party' && partiesFor.includes(name)) || (type === 'ideology' && ideologiesFor.includes(name))) {
          const absVal = Math.abs(answer.value);
          if (absVal > bestAbsValue) {
            bestAbsValue = absVal;
            bestAnswer = answer;
          }
        }
      }
      if (!bestAnswer) {
        bestAnswer = question.answers.find(a => a.value === 0 && (a.label.includes('Pomiń') || a.label.includes('Skip')));
        if (!bestAnswer) bestAnswer = question.answers[0];
      }
      simulatedAnswers.push({
        questionId: question.id,
        answerIndex: question.answers.indexOf(bestAnswer),
        answerValue: bestAnswer.value,
        answerData: bestAnswer
      });
    }
    // Oblicz pairResults dla tych odpowiedzi (tryb full)
    const tmpScores = computeScoresForAnswers(simulatedAnswers, 'full');
    const valuesMap = buildUserValuesMap(tmpScores.pairResults);
    const coords = computeCoordinatesFromValues(valuesMap, currentCompassMode, currentCreativeConfig);
    return { x: coords.x, y: coords.y };
  }
}

// Pomocnicza funkcja do obliczania wyników dla podanych odpowiedzi i trybu
function computeScoresForAnswers(answers, mode) {
  const ideologyScores = new Map();
  const partyScores = new Map();
  const valueScores = new Map();

  config.ideologies.forEach(ideo => ideologyScores.set(ideo.key || ideo.name, { sum: 0, maxPossible: 0 }));
  config.parties.forEach(party => partyScores.set(party.key || party.name, { sum: 0, maxPossible: 0 }));

  const allValueNames = new Set();
  config.pairsOfValues.forEach(pair => { allValueNames.add(pair.leftKey || pair.left); allValueNames.add(pair.rightKey || pair.right); });
  config.hiddenValues.forEach(v => allValueNames.add(v));
  allValueNames.forEach(v => valueScores.set(v, { sum: 0, maxPossible: 0 }));

  for (const ans of answers) {
    const weight = ans.answerValue;
    if (weight === 0) continue;
    const answer = ans.answerData;
    const absWeight = Math.abs(weight);

    if (mode === 'full') {
      for (const ideo of (answer.ideologies_for || [])) {
        const rec = ideologyScores.get(ideo);
        if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; }
      }
      for (const ideo of (answer.ideologies_against || [])) {
        const rec = ideologyScores.get(ideo);
        if (rec) { rec.sum -= absWeight; rec.maxPossible += 1.5; }
      }
    } else {
      if (weight > 0) {
        for (const ideo of (answer.ideologies_for || [])) {
          const rec = ideologyScores.get(ideo);
          if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; }
        }
      }
    }
    // analogicznie dla partii i wartości – uproszczone, bo potrzebujemy tylko pairResults
    // Do pairResults potrzebujemy tylko wartości valueScores
    if (mode === 'full') {
      for (const val of (answer.values_for || [])) {
        const rec = valueScores.get(val);
        if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; }
      }
      for (const val of (answer.values_against || [])) {
        const rec = valueScores.get(val);
        if (rec) { rec.sum -= absWeight; rec.maxPossible += 1.5; }
      }
    } else {
      if (weight > 0) {
        for (const val of (answer.values_for || [])) {
          const rec = valueScores.get(val);
          if (rec) { rec.sum += absWeight; rec.maxPossible += 1.5; }
        }
      }
    }
  }

  // Oblicz pairResults podobnie jak w computeScores
  const pairResults = [];
  for (let pair of config.pairsOfValues) {
    const recLeft = valueScores.get(pair.leftKey || pair.left);
    const recRight = valueScores.get(pair.rightKey || pair.right);
    const sumL = recLeft ? recLeft.sum : 0;
    const maxL = recLeft ? recLeft.maxPossible : 0;
    const sumR = recRight ? recRight.sum : 0;
    const maxR = recRight ? recRight.maxPossible : 0;
    const totalMax = maxL + maxR;
    let leftPercent, rightPercent;
    if (totalMax === 0) {
      leftPercent = 50;
      rightPercent = 50;
    } else {
      const net = sumL - sumR;
      leftPercent = (net + totalMax) / (2 * totalMax) * 100;
      leftPercent = Math.min(100, Math.max(0, leftPercent));
      rightPercent = 100 - leftPercent;
    }
    pairResults.push({
      left: pair.left,
      right: pair.right,
      leftPercent: leftPercent,
      rightPercent: rightPercent,
    });
  }
  return { pairResults };
}

// Inicjalizacja kompasu po pokazaniu wyników
function initCompassAfterResults() {
  const container = document.getElementById('compass-container');
  if (!container) return;
  if (window.compassInstance && window.compassInstance.destroy) window.compassInstance.destroy();
  window.compassInstance = new CompassUI(container, {
    mode: currentCompassMode,
    onModeChange: (mode) => {
      currentCompassMode = mode;
      if (mode === 'creative') {
        // Wczytaj zapisaną konfigurację kreatywną
        if (window.compassInstance.getCreativeConfig) {
          currentCreativeConfig = window.compassInstance.getCreativeConfig();
        }
      }
      updateCompassDisplay();
      // Odśwież nakładki
      const showParties = document.getElementById('toggle-parties')?.checked || false;
      const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
      loadOverlays(showParties, showIdeologies, window.compassInstance);
    },
    onCreativeConfigChange: (config) => {
      currentCreativeConfig = config;
      updateCompassDisplay();
      const showParties = document.getElementById('toggle-parties')?.checked || false;
      const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
      loadOverlays(showParties, showIdeologies, window.compassInstance);
    }
  });
  // Ustaw wartości użytkownika
  if (compassUserValues) {
    const coords = computeCoordinatesFromValues(compassUserValues, currentCompassMode, currentCreativeConfig);
    window.compassInstance.updateMarker(coords.x, coords.y);
    window.compassInstance.updateActivePairs(coords.activePairsCount);
    window.compassInstance.updateModeLabel(currentCompassMode);
  }
  // Obsługa przełączników nakładek
  const toggleParties = document.getElementById('toggle-parties');
  const toggleIdeologies = document.getElementById('toggle-ideologies');
  if (toggleParties) {
    toggleParties.addEventListener('change', () => {
      loadOverlays(toggleParties.checked, toggleIdeologies.checked, window.compassInstance);
    });
  }
  if (toggleIdeologies) {
    toggleIdeologies.addEventListener('change', () => {
      loadOverlays(toggleParties.checked, toggleIdeologies.checked, window.compassInstance);
    });
  }
  // Inicjalne załadowanie nakładek
  loadOverlays(false, false, window.compassInstance);
}

// Modyfikacja funkcji computeAndDisplayResults – dodanie budowania wartości kompasu i inicjalizacji
const originalComputeAndDisplay = computeAndDisplayResults;
computeAndDisplayResults = function() {
  originalComputeAndDisplay();
  const { pairResults } = computeScores(currentScoringMode);
  compassUserValues = buildUserValuesMap(pairResults);
  if (!window.compassInstance) {
    initCompassAfterResults();
  } else {
    updateCompassDisplay();
    const showParties = document.getElementById('toggle-parties')?.checked || false;
    const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
    loadOverlays(showParties, showIdeologies, window.compassInstance);
  }
};

// Obsługa pełnoekranowego modala kompasu
function initCompassModal() {
  const modal = document.getElementById('compass-modal');
  const openBtn = document.getElementById('open-compass-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  if (!modal || !openBtn) return;
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    if (!window.modalCompassInstance) {
      const modalContainer = document.getElementById('modal-compass-container');
      if (modalContainer) {
        window.modalCompassInstance = new CompassUI(modalContainer, {
          mode: currentCompassMode,
          onModeChange: (mode) => {
            currentCompassMode = mode;
            if (mode === 'creative') {
              if (window.modalCompassInstance.getCreativeConfig) {
                currentCreativeConfig = window.modalCompassInstance.getCreativeConfig();
              }
            }
            updateCompassDisplay();
            const showParties = document.getElementById('modal-toggle-parties')?.checked || false;
            const showIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
            loadOverlays(showParties, showIdeologies, window.modalCompassInstance);
            // Synchronizacja z głównym kompasem
            if (window.compassInstance && window.compassInstance.setMode) window.compassInstance.setMode(mode);
          },
          onCreativeConfigChange: (config) => {
            currentCreativeConfig = config;
            updateCompassDisplay();
            const showParties = document.getElementById('modal-toggle-parties')?.checked || false;
            const showIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
            loadOverlays(showParties, showIdeologies, window.modalCompassInstance);
            if (window.compassInstance && window.compassInstance.setCreativeConfig) window.compassInstance.setCreativeConfig(config);
          }
        });
        // Przekaż wartości użytkownika
        if (compassUserValues) {
          const coords = computeCoordinatesFromValues(compassUserValues, currentCompassMode, currentCreativeConfig);
          window.modalCompassInstance.updateMarker(coords.x, coords.y);
          window.modalCompassInstance.updateActivePairs(coords.activePairsCount);
          window.modalCompassInstance.updateModeLabel(currentCompassMode);
        }
        // Obsługa przełączników nakładek w modalu
        const modalToggleParties = document.getElementById('modal-toggle-parties');
        const modalToggleIdeologies = document.getElementById('modal-toggle-ideologies');
        if (modalToggleParties && modalToggleIdeologies) {
          const updateModalOverlays = () => {
            loadOverlays(modalToggleParties.checked, modalToggleIdeologies.checked, window.modalCompassInstance);
          };
          modalToggleParties.addEventListener('change', updateModalOverlays);
          modalToggleIdeologies.addEventListener('change', updateModalOverlays);
          updateModalOverlays();
        }
        // Konfiguracja kreatywna – przekażemy przez interfejs CompassUI
        if (window.modalCompassInstance.setCreativeConfigPanel) {
          window.modalCompassInstance.setCreativeConfigPanel(document.getElementById('creative-config-area'), document.getElementById('modal-creative-pairs-list'), document.getElementById('modal-label-top'), document.getElementById('modal-label-bottom'), document.getElementById('modal-label-left'), document.getElementById('modal-label-right'), document.getElementById('modal-apply-labels'), document.getElementById('modal-apply-creative'));
        }
      }
    } else {
      // odświeżenie
      const coords = computeCoordinatesFromValues(compassUserValues, currentCompassMode, currentCreativeConfig);
      window.modalCompassInstance.updateMarker(coords.x, coords.y);
      window.modalCompassInstance.updateActivePairs(coords.activePairsCount);
      window.modalCompassInstance.updateModeLabel(currentCompassMode);
      const showParties = document.getElementById('modal-toggle-parties')?.checked || false;
      const showIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
      loadOverlays(showParties, showIdeologies, window.modalCompassInstance);
    }
  });
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
}

// Po załadowaniu configu, dodajemy dodatkowe inicjalizacje
const originalLoadConfig = loadConfig;
loadConfig = async function() {
  await originalLoadConfig();
  // Po załadowaniu configu, ustawiamy nasłuchiwanie na zmianę trybu kompasu
  const compassModeSelect = document.getElementById('compass-mode-select');
  if (compassModeSelect) {
    compassModeSelect.addEventListener('change', (e) => {
      currentCompassMode = e.target.value;
      if (window.compassInstance && window.compassInstance.setMode) window.compassInstance.setMode(currentCompassMode);
      if (window.modalCompassInstance && window.modalCompassInstance.setMode) window.modalCompassInstance.setMode(currentCompassMode);
      updateCompassDisplay();
      const showParties = document.getElementById('toggle-parties')?.checked || false;
      const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
      loadOverlays(showParties, showIdeologies, window.compassInstance);
      if (window.modalCompassInstance) {
        const modalShowParties = document.getElementById('modal-toggle-parties')?.checked || false;
        const modalShowIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
        loadOverlays(modalShowParties, modalShowIdeologies, window.modalCompassInstance);
      }
    });
    // ustawienie opisu trybu
    const modeDesc = document.getElementById('compass-mode-desc');
    if (modeDesc) {
      const descriptions = {
        weighted: 'Wagowy – uwzględnia domyślne wagi poszczególnych par.',
        equal: 'Jednakowe wagi – każda para ma wagę 1.',
        institutional: 'Instytucjonalny – tylko pary związane z instytucjami państwowymi.',
        creative: 'Kreatywny – ręczny wybór par i wag.'
      };
      compassModeSelect.addEventListener('change', () => {
        modeDesc.textContent = descriptions[compassModeSelect.value] || '';
      });
      modeDesc.textContent = descriptions[compassModeSelect.value];
    }
  }
  initCompassModal();
};

// Przeładowanie funkcji symulacji, aby po symulacji odświeżyć kompas
const originalSimulateAnswers = simulateAnswers;
simulateAnswers = function(selectedName) {
  originalSimulateAnswers(selectedName);
  // Po symulacji odpowiedzi, przelicz wartości dla kompasu
  const { pairResults } = computeScores(currentScoringMode);
  compassUserValues = buildUserValuesMap(pairResults);
  updateCompassDisplay();
  const showParties = document.getElementById('toggle-parties')?.checked || false;
  const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
  loadOverlays(showParties, showIdeologies, window.compassInstance);
  if (window.modalCompassInstance) {
    const modalShowParties = document.getElementById('modal-toggle-parties')?.checked || false;
    const modalShowIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
    loadOverlays(modalShowParties, modalShowIdeologies, window.modalCompassInstance);
  }
};

const originalRestoreUserAnswers = restoreUserAnswers;
restoreUserAnswers = function() {
  originalRestoreUserAnswers();
  const { pairResults } = computeScores(currentScoringMode);
  compassUserValues = buildUserValuesMap(pairResults);
  updateCompassDisplay();
  const showParties = document.getElementById('toggle-parties')?.checked || false;
  const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
  loadOverlays(showParties, showIdeologies, window.compassInstance);
  if (window.modalCompassInstance) {
    const modalShowParties = document.getElementById('modal-toggle-parties')?.checked || false;
    const modalShowIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
    loadOverlays(modalShowParties, modalShowIdeologies, window.modalCompassInstance);
  }
};

// Dodatkowo, po imporcie odpowiedzi, też odświeżamy kompas
const originalImportAnswers = importAnswersFromExportCode;
importAnswersFromExportCode = function(rawCode) {
  const success = originalImportAnswers(rawCode);
  if (success) {
    const { pairResults } = computeScores(currentScoringMode);
    compassUserValues = buildUserValuesMap(pairResults);
    updateCompassDisplay();
    const showParties = document.getElementById('toggle-parties')?.checked || false;
    const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
    loadOverlays(showParties, showIdeologies, window.compassInstance);
    if (window.modalCompassInstance) {
      const modalShowParties = document.getElementById('modal-toggle-parties')?.checked || false;
      const modalShowIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
      loadOverlays(modalShowParties, modalShowIdeologies, window.modalCompassInstance);
    }
  }
  return success;
};

window.__neoAutystykBoot = loadConfig;

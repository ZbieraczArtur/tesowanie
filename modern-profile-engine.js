(function () {
  const NOTE_LIMIT = 3000;
  const ANSWER_VALUES = {
    STRONGLY_AGREE: 1.5,
    PARTLY_AGREE: 0.5,
    PARTLY_DISAGREE: -0.5,
    STRONGLY_DISAGREE: -1.5
  };

  function normalizeProfileText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u0142\u0141]/g, 'l')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function profileKey(type) {
    if (type === 'party') return 'parties';
    if (type === 'ideology') return 'ideologies';
    return 'users';
  }

  function isModernMatching() {
    return currentMatchingMode === 'modern';
  }

  function getProfileCollection(type) {
    const key = profileKey(type);
    return Array.isArray(politicalProfiles?.[key]) ? politicalProfiles[key] : [];
  }

  function getLegacyCollection(type) {
    if (type === 'party') return Array.isArray(config?.parties) ? config.parties : [];
    if (type === 'ideology') return Array.isArray(config?.ideologies) ? config.ideologies : [];
    return getProfileCollection('user');
  }

  function getProfile(name, type) {
    const needle = normalizeProfileText(name);
    return getProfileCollection(type).find(profile =>
      normalizeProfileText(profile.name) === needle ||
      normalizeProfileText(profile.key) === needle ||
      normalizeProfileText(profile.id) === needle
    ) || null;
  }

  function getLegacyEntity(name, type) {
    const needle = normalizeProfileText(name);
    return getLegacyCollection(type).find(item =>
      normalizeProfileText(item.name) === needle ||
      normalizeProfileText(item.key) === needle ||
      normalizeProfileText(item.id) === needle
    ) || null;
  }

  function getSkipAnswer(question) {
    if (!question?.answers?.length) return null;
    return question.answers.find(answer => Number(answer.value) === 0 && /pomin|skip/i.test(normalizeProfileText(answer.label))) ||
      question.answers.find(answer => Number(answer.value) === 0) ||
      question.answers[0];
  }

  function answerByLabel(question, label) {
    const normalized = normalizeProfileText(label);
    if (!question || !normalized) return null;
    if (['pomin', 'pomin pytanie', 'skip', 'brak odpowiedzi'].includes(normalized)) return getSkipAnswer(question);
    return question.answers.find(answer => normalizeProfileText(answer.label) === normalized) || null;
  }

  function parseExportLine(line) {
    const value = String(line || '').trim();
    if (!value || /^data wykonania testu/i.test(normalizeProfileText(value))) return null;

    let match = value.match(/^\[id:(\d+)\]\s*:\s*\((.*?)\)\s*(?:;)?$/i);
    if (match) return { questionId: Number(match[1]), answerText: match[2].trim() };

    match = value.match(/^(\d+)\s*:\s*\((.*?)\)\s*(?:;)?$/);
    if (match) return { questionId: Number(match[1]), answerText: match[2].trim() };

    match = value.match(/^(\d+)\s*=\s*(.*?)\s*(?:;)?$/);
    if (match) return { questionId: Number(match[1]), answerText: match[2].trim().replace(/^\((.*)\)$/, '$1') };

    match = value.match(/^\d+\.\s*.*?\[id:(\d+)\]\s*:\s*\((.*?)\)\s*(?:;)?$/);
    if (match) return { questionId: Number(match[1]), answerText: match[2].trim() };

    return null;
  }

  function decodeNote(value) {
    const text = String(value || '');
    try { return decodeURIComponent(text).slice(0, NOTE_LIMIT); }
    catch { return text.slice(0, NOTE_LIMIT); }
  }

  function parseNoteLine(line) {
    const value = String(line || '').trim();
    let match = value.match(/^(\d+)#(?:opis|note)\s*:\s*(.*)$/i);
    if (match) return { questionId: Number(match[1]), note: decodeNote(match[2]) };

    match = value.match(/^\s*(?:Uzasadnienie|Opis|Note)\s*\[id:(\d+)\]\s*:\s*(.*)$/i);
    if (match) return { questionId: Number(match[1]), note: decodeNote(match[2]) };

    return null;
  }

  function splitExportEntries(rawCode) {
    const entries = [];
    let buffer = '';
    let depth = 0;

    for (const char of String(rawCode || '')) {
      if (char === '(') depth++;
      if (char === ')' && depth > 0) depth--;

      if ((char === ';' && depth === 0) || char === '\n' || char === '\r') {
        const value = buffer.trim();
        if (value) entries.push(value);
        buffer = '';
      } else {
        buffer += char;
      }
    }

    const last = buffer.trim();
    if (last) entries.push(last);
    return entries;
  }

  function splitAllowedAnswers(answerText) {
    const raw = String(answerText || '').trim();
    if (!raw || /^brak odpowiedzi$/i.test(raw)) return [];
    const grouped = raw.match(/^\((.*)\)$/);
    const source = grouped ? grouped[1] : raw;
    return source.split(',').map(item => item.trim()).filter(Boolean);
  }

  function parseExportCodeModern(rawCode) {
    if (!config?.questions) return [];

    const notes = new Map();
    for (const line of splitExportEntries(rawCode)) {
      const note = parseNoteLine(line);
      if (note) notes.set(note.questionId, note.note);
    }

    const rows = [];
    for (const line of splitExportEntries(rawCode)) {
      const parsed = parseExportLine(line);
      if (!parsed) continue;

      const question = config.questions.find(q => Number(q.id) === Number(parsed.questionId));
      if (!question) continue;

      const firstLabel = splitAllowedAnswers(parsed.answerText)[0] || parsed.answerText;
      if (/^brak odpowiedzi$/i.test(firstLabel)) {
        if (notes.has(question.id)) rows.push({ questionId: question.id, answerIndex: -1, answerValue: 0, answerData: null, note: notes.get(question.id), noteOnly: true });
        continue;
      }

      const answer = answerByLabel(question, firstLabel);
      if (!answer) {
        if (notes.has(question.id)) rows.push({ questionId: question.id, answerIndex: -1, answerValue: 0, answerData: null, note: notes.get(question.id), noteOnly: true });
        continue;
      }

      rows.push({
        questionId: question.id,
        answerIndex: question.answers.indexOf(answer),
        answerValue: Number(answer.value),
        answerData: answer,
        note: notes.get(question.id) || ''
      });
    }

    for (const [questionId, note] of notes.entries()) {
      if (!rows.some(row => Number(row.questionId) === Number(questionId))) {
        rows.push({ questionId, answerIndex: -1, answerValue: 0, answerData: null, note, noteOnly: true });
      }
    }

    return rows;
  }

  function parseReferenceExportCodeModern(rawCode) {
    const reference = new Map();
    if (!config?.questions) return reference;

    for (const line of splitExportEntries(rawCode)) {
      const parsed = parseExportLine(line);
      if (!parsed) continue;

      const question = config.questions.find(q => Number(q.id) === Number(parsed.questionId));
      if (!question) continue;

      const allowed = splitAllowedAnswers(parsed.answerText).map(label => {
        const normalized = normalizeProfileText(label);
        if (normalized === 'neither') return { label: 'Neither', neither: true, value: null, answerData: null };
        if (normalized === 'brak odpowiedzi') return null;
        const answer = answerByLabel(question, label);
        return answer ? { label: answer.label, value: Number(answer.value), answerData: answer } : null;
      }).filter(Boolean);

      if (allowed.length) reference.set(Number(question.id), allowed);
    }

    return reference;
  }

  function answerKind(answerValue) {
    const value = Number(answerValue);
    if (Math.abs(value - ANSWER_VALUES.STRONGLY_AGREE) < 0.01) return 'stronglyAgree';
    if (Math.abs(value - ANSWER_VALUES.PARTLY_AGREE) < 0.01) return 'partlyAgree';
    if (Math.abs(value - ANSWER_VALUES.PARTLY_DISAGREE) < 0.01) return 'partlyDisagree';
    if (Math.abs(value - ANSWER_VALUES.STRONGLY_DISAGREE) < 0.01) return 'stronglyDisagree';
    return null;
  }

  function profilePairScoreModern(userValue, referenceAnswer) {
    const current = Number(userValue);
    if (!referenceAnswer || Number.isNaN(current) || current === 0) return 0;
    if (referenceAnswer.neither) return -1.0;

    const userKind = answerKind(current);
    const refKind = answerKind(referenceAnswer.value);
    if (!userKind || !refKind) return 0;

    const scoreTable = {
      stronglyAgree: { stronglyAgree: 1.5, partlyAgree: 0.5, partlyDisagree: -1.0, stronglyDisagree: -1.5 },
      partlyAgree: { stronglyAgree: 0.5, partlyAgree: 1.5, partlyDisagree: -1.0, stronglyDisagree: -1.5 },
      partlyDisagree: { stronglyAgree: -1.0, partlyAgree: -1.0, partlyDisagree: 1.5, stronglyDisagree: 0.5 },
      stronglyDisagree: { stronglyAgree: -1.5, partlyAgree: -1.0, partlyDisagree: 0.5, stronglyDisagree: 1.5 }
    };

    return scoreTable[refKind][userKind];
  }

  function compareAnswersToReferenceProfileModern(answers, referenceProfile) {
    if (!referenceProfile?.exportCode || !String(referenceProfile.exportCode).trim()) {
      return { percent: 0, score: 0, maxPossible: 0, compared: 0 };
    }

    const reference = parseReferenceExportCodeModern(referenceProfile.exportCode);
    if (!reference.size || !Array.isArray(config?.questions)) {
      return { percent: 0, score: 0, maxPossible: 0, compared: 0 };
    }

    const answersByQuestion = new Map((answers || []).filter(row => !row.noteOnly).map(row => [Number(row.questionId), row]));
    let score = 0;
    let maxPossible = 0;
    let compared = 0;

    for (const question of config.questions) {
      const userAnswer = answersByQuestion.get(Number(question.id));
      const allowed = reference.get(Number(question.id));
      const userValue = userAnswer ? Number(userAnswer.answerValue) : 0;
      const best = allowed?.length ? Math.max(...allowed.map(answer => profilePairScoreModern(userValue, answer))) : 0;
      score += best;
      maxPossible += 1.5;
      compared++;
    }

    const percent = maxPossible ? Math.round(((score + maxPossible) / (2 * maxPossible)) * 100) : 0;
    return { percent: Math.min(100, Math.max(0, percent)), score, maxPossible, compared };
  }

  function getModernRanking(type) {
    return getProfileCollection(type).map(profile => {
      const match = compareAnswersToReferenceProfileModern(userAnswers, profile);
      return {
        key: profile.key || profile.id || profile.name,
        name: profile.name,
        percent: match.percent,
        agreements: 0,
        disagreements: 0,
        involved: match.compared,
        description: profile.description || '',
        logo: profile.logo || '',
        avatar: profile.avatar || '',
        profile
      };
    }).sort((a, b) => b.percent - a.percent || String(a.name || '').localeCompare(String(b.name || ''), 'pl'));
  }

  function firstAnswersFromReference(profile) {
    const reference = parseReferenceExportCodeModern(profile?.exportCode || '');
    if (!reference.size || !config?.questions) return [];

    return config.questions.map(question => {
      const allowed = reference.get(Number(question.id)) || [];
      const selected = allowed
        .filter(answer => !answer.neither && answer.answerData && Number(answer.value) !== 0)
        .sort((a, b) => Math.abs(Number(b.value)) - Math.abs(Number(a.value)))[0]?.answerData || getSkipAnswer(question);

      return {
        questionId: question.id,
        answerIndex: question.answers.indexOf(selected),
        answerValue: Number(selected?.value || 0),
        answerData: selected
      };
    });
  }

  function getProfileLogo(profile, type) {
    if (profile?.logo) return profile.logo;
    if (type === 'party' && profile?.name) return getPartyLogoUrl(profile.name);
    if (type === 'ideology' && profile?.name) return getIdeologyLogoUrl(profile.name);
    if (type === 'user' && profile?.avatar) return `images/IUsers/${profile.avatar}`;
    return 'images/ALogo.svg';
  }

  function syncProfilesIntoConfig() {
    if (!config || !politicalProfiles) return;
    if (Array.isArray(politicalProfiles.users)) config.users = politicalProfiles.users;

    for (const type of ['party', 'ideology']) {
      const legacyList = getLegacyCollection(type);
      for (const item of legacyList) {
        const profile = getProfile(item.key || item.name, type);
        if (!profile) continue;
        item.key = item.key || profile.key || profile.id || item.name;
        item.description = profile.description || item.description || '';
        item.logo = profile.logo || item.logo || '';
      }
    }
  }

  function refreshAllOverlays() {
    const showParties = document.getElementById('toggle-parties')?.checked || false;
    const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
    if (window.compassInstance && typeof loadOverlays === 'function') loadOverlays(showParties, showIdeologies, window.compassInstance);

    const modalShowParties = document.getElementById('modal-toggle-parties')?.checked || false;
    const modalShowIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
    if (window.modalCompassInstance && typeof loadOverlays === 'function') loadOverlays(modalShowParties, modalShowIdeologies, window.modalCompassInstance);
  }

  function entityAnswersForCompass(profile) {
    const parsed = firstAnswersFromReference(profile);
    return parsed.length ? parsed : [];
  }

  const originalComputeScores = window.computeScores || computeScores;
  computeScores = function (mode = currentScoringMode) {
    const base = originalComputeScores(mode);
    if (!isModernMatching()) return base;
    return {
      ...base,
      ideologyResults: getModernRanking('ideology'),
      partyResults: getModernRanking('party')
    };
  };
  window.computeScores = computeScores;

  const originalGetUserRankingItems = window.getUserRankingItems;
  window.getUserRankingItems = function () {
    return getModernRanking('user');
  };

  const originalSimulateAnswers = window.simulateAnswers || simulateAnswers;
  simulateAnswers = function (selectedName) {
    if (isModernMatching()) {
      const type = getProfile(selectedName, 'party') ? 'party' :
        getProfile(selectedName, 'ideology') ? 'ideology' :
        getProfile(selectedName, 'user') ? 'user' : null;

      if (type) {
        const profile = getProfile(selectedName, type);
        simulatedEntity = { type, name: profile.name };
        userAnswers = type === 'user'
          ? parseExportCodeModern(profile.exportCode).filter(row => !row.noteOnly && row.answerData)
          : entityAnswersForCompass(profile);
        updateDOMSelections();
        computeAndDisplayResults();
        return;
      }
    } else {
      const user = getProfile(selectedName, 'user');
      if (user) {
        simulatedEntity = { type: 'user', name: user.name };
        userAnswers = parseExportCodeModern(user.exportCode).filter(row => !row.noteOnly && row.answerData);
        updateDOMSelections();
        computeAndDisplayResults();
        return;
      }
    }

    originalSimulateAnswers(selectedName);
  };
  window.simulateAnswers = simulateAnswers;

  const originalGetEntityCoordinates = window.getEntityCoordinates || getEntityCoordinates;
  getEntityCoordinates = async function (name, type) {
    if (isModernMatching() || type === 'user') {
      const profile = getProfile(name, type);
      if (!profile?.exportCode || !String(profile.exportCode).trim()) return { x: 0, y: 0 };

      const parsed = type === 'user'
        ? parseExportCodeModern(profile.exportCode).filter(row => !row.noteOnly && row.answerData)
        : entityAnswersForCompass(profile);

      if (!parsed.length) return { x: 0, y: 0 };
      const scores = computeScoresForAnswers(parsed, currentScoringMode);
      const valuesMap = buildUserValuesMap(scores.pairResults);
      const coords = computeCoordinatesFromValues(valuesMap, currentCompassMode, currentCreativeConfig);
      return { x: coords.x, y: coords.y };
    }

    return originalGetEntityCoordinates(name, type);
  };
  window.getEntityCoordinates = getEntityCoordinates;

  loadOverlays = async function (showParties, showIdeologies, compassInstance) {
    const showUsers = document.getElementById('toggle-users')?.checked ||
      document.getElementById('modal-toggle-users')?.checked || false;
    if (!compassInstance?.clearOverlays || !config) return;

    compassInstance.clearOverlays();

    const addProfiles = async (type, enabled) => {
      if (!enabled) return;
      const list = isModernMatching() || type === 'user' ? getProfileCollection(type) : getLegacyCollection(type);
      for (const entity of list) {
        const coords = await getEntityCoordinates(entity.key || entity.name, type);
        if (!coords) continue;
        compassInstance.addOverlay(
          getProfileLogo(entity, type),
          coords.x,
          coords.y,
          type,
          entity.name,
          entity.description || ''
        );
      }
    };

    await addProfiles('party', showParties);
    await addProfiles('ideology', showIdeologies);
    await addProfiles('user', showUsers);
  };
  window.loadOverlays = loadOverlays;

  const originalSetupSimulation = window.setupSimulation || setupSimulation;
  setupSimulation = function () {
    originalSetupSimulation();
    const select = document.getElementById('simulateSelect');
    if (!select || !config) return;

    select.innerHTML = '';
    const groups = isModernMatching()
      ? [
          ['party', translations?.ui?.partiesGroup || 'Partie polityczne', getProfileCollection('party')],
          ['ideology', translations?.ui?.ideologiesGroup || 'Ideologie', getProfileCollection('ideology')],
          ['user', translations?.ui?.usersGroup || 'Użytkownicy', getProfileCollection('user')]
        ]
      : [
          ['party', translations?.ui?.partiesGroup || 'Partie polityczne', getLegacyCollection('party')],
          ['ideology', translations?.ui?.ideologiesGroup || 'Ideologie', getLegacyCollection('ideology')],
          ['user', translations?.ui?.usersGroup || 'Użytkownicy', getProfileCollection('user')]
        ];

    for (const [, label, list] of groups) {
      if (!list.length) continue;
      const group = document.createElement('optgroup');
      group.label = label;
      for (const profile of list) {
        const option = document.createElement('option');
        option.value = profile.name;
        option.textContent = profile.name;
        group.appendChild(option);
      }
      select.appendChild(group);
    }

    const first = select.querySelector('option');
    if (first) select.value = first.value;
  };
  window.setupSimulation = setupSimulation;

  const originalSetupMatchingModeSelector = window.setupMatchingModeSelector || setupMatchingModeSelector;
  setupMatchingModeSelector = function () {
    originalSetupMatchingModeSelector();
    document.querySelectorAll('input[name="matchingMode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        setupSimulation();
        refreshAllOverlays();
      });
    });
  };
  window.setupMatchingModeSelector = setupMatchingModeSelector;

  generateExportCode = function () {
    if (!config?.questions) return '';
    const dateStr = typeof getCurrentDateTime === 'function' ? getCurrentDateTime() : new Date().toISOString();
    const lines = [`Data wykonania testu: ${dateStr}`, ''];
    for (const question of config.questions) {
      const answer = userAnswers.find(row => Number(row.questionId) === Number(question.id) && !row.noteOnly);
      const note = answer?.note || '';
      const label = answer?.answerData?.label || (answer ? 'Pomiń pytanie' : 'Brak odpowiedzi');
      lines.push(`${question.id}:(${label});`);
      if (note.trim()) lines.push(`${question.id}#opis:${encodeURIComponent(note.trim())}`);
    }
    return lines.join('\n');
  };
  window.generateExportCode = generateExportCode;

  importAnswersFromExportCode = function (rawCode) {
    if (!config) return false;
    const parsed = parseExportCodeModern(rawCode);
    const answerRows = parsed.filter(row => !row.noteOnly && row.answerData);
    const noteRows = parsed.filter(row => row.note);

    if (!answerRows.length && !noteRows.length) {
      showPopup(translations?.ui?.importNoAnswers || 'Nie znaleziono prawidłowych odpowiedzi w kodzie.');
      return false;
    }

    userAnswers = answerRows;
    updateDOMSelections();
    if (resultsDiv.style.display !== 'none') computeAndDisplayResults();
    else showPopup((translations?.ui?.importSuccess || `Zaimportowano ${answerRows.length} odpowiedzi.`) + ' ' + (translations?.ui?.clickShowResults || 'Kliknij "Pokaż wyniki", aby zobaczyć zaktualizowany profil.'));
    return true;
  };
  window.importAnswersFromExportCode = importAnswersFromExportCode;

  parseExportCode = parseExportCodeModern;
  window.parseExportCode = parseExportCodeModern;
  parseReferenceExportCode = parseReferenceExportCodeModern;
  window.parseReferenceExportCode = parseReferenceExportCodeModern;
  compareAnswersToReferenceProfile = compareAnswersToReferenceProfileModern;
  window.compareAnswersToReferenceProfile = compareAnswersToReferenceProfileModern;
  getModernRanking = getModernRanking;
  window.getModernRanking = getModernRanking;
  getProfileByName = getProfile;
  window.getProfileByName = getProfile;
  window.getProfileCollection = getProfileCollection;
  window.getLegacyProfileCollection = getLegacyCollection;

  const originalBoot = window.__neoAutystykBoot || loadConfig;
  loadConfig = async function () {
    await originalBoot();
    syncProfilesIntoConfig();
    setupSimulation();
    window.currentMatchingMode = currentMatchingMode;
  };
  window.loadConfig = loadConfig;

  loadConfig();
})();

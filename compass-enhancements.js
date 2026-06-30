(function () {
  'use strict';

  const NOTE_LIMIT = 3000;
  const answerNotes = {};
  const friendProfiles = [];
  let manualCompassValues = null;

  function getRandomFriendColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue} 72% 44%)`;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[ch]));
  }

  function normalizeAnswerLabel(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // ======================= ZADANIE 4: NOWY ALGORYTM ZGODNOŚCI =======================
  // Skala odpowiedzi (od najsilniejszej zgody do pominięcia)
  // Wartości: 1.5, 0.5, -0.5, -1.5, 0
  // Indeksy na skali: zdecydowanie zgadzam=0, częściowo zgadzam=1,
  //                   częściowo nie zgadzam=2, zdecydowanie nie zgadzam=3, pomiń=null
  const ANSWER_SCALE = [1.5, 0.5, -0.5, -1.5]; // pomiń (0) traktowany oddzielnie

  function getScaleIndex(answerValue) {
    const val = Number(answerValue);
    for (let i = 0; i < ANSWER_SCALE.length; i++) {
      if (Math.abs(ANSWER_SCALE[i] - val) < 0.01) return i;
    }
    return null; // pomiń lub nieznana wartość
  }

  // Punktacja za parę odpowiedzi na podstawie odległości na skali
  // Zwraca wartość od -1.5 do +1.5
  function pairScore(myValue, refValue) {
    const myIdx = getScaleIndex(myValue);
    const refIdx = getScaleIndex(refValue);
    if (myIdx === null || refIdx === null) return 0; // pomiń = 0 pkt
    const distance = Math.abs(myIdx - refIdx);
    // distance 0 = +1.5, 1 = +0.5, 2 = -1.0, 3 = -1.5
    const scoreMap = [1.5, 0.5, -1.0, -1.5];
    return scoreMap[distance];
  }

  function compareAnswersWithUser(answers) {
    let compared = 0;
    let score = 0;
    const maxPerAnswer = 1.5; // maksymalna możliwa punktacja za jedno pytanie

    answers.forEach(friendAnswer => {
      if (!friendAnswer || friendAnswer.noteOnly) return;
      const myAnswer = userAnswers.find(ans => ans.questionId === friendAnswer.questionId && !ans.noteOnly);
      if (!myAnswer || !myAnswer.answerData || !friendAnswer.answerData) return;

      const myVal = Number(myAnswer.answerValue);
      const refVal = Number(friendAnswer.answerValue);

      // Pomiń (0) po którejkolwiek stronie = nie licz tego pytania
      if (myVal === 0 || refVal === 0) return;

      compared++;
      score += pairScore(myVal, refVal);
    });

    if (compared === 0) return 0;
    // Normalizacja: od -compared*1.5 do +compared*1.5 => 0%–100%
    const minScore = compared * (-1.5);
    const maxScore = compared * 1.5;
    return Math.round(((score - minScore) / (maxScore - minScore)) * 100);
  }
  // ==================================================================================

  function getConfiguredUserProfiles() {
    const source = config?.users || config?.userRanking || config?.friends || [];
    if (!Array.isArray(source)) return [];
    return source.map((entry, index) => {
      const rawCode = entry.code || entry.exportCode || entry.answersCode || entry.rawCode || '';
      const name = entry.name || entry.label || `Uzytkownik ${index + 1}`;
      const parsed = rawCode ? parseExportCode(rawCode).filter(row => !row.noteOnly && row.answerData) : [];
      return parsed.length ? {
        name,
        answers: parsed,
        color: entry.color || getRandomFriendColor(),
        source: 'data',
        avatar: entry.avatar || null,
        description: entry.description || ''
      } : null;
    }).filter(Boolean);
  }

  // ======================= ZADANIE 1: POPUP UŻYTKOWNIKA =======================
  // Zwraca dane użytkownika z data.json (avatar, description) po nazwie
  function getUserDataByName(name) {
    const source = config?.users || [];
    return source.find(u => u.name === name) || null;
  }

  window.getUserRankingItems = function () {
    const profiles = [...getConfiguredUserProfiles(), ...friendProfiles];
    return profiles.map(profile => {
      const userData = profile.source === 'data' ? getUserDataByName(profile.name) : null;
      return {
        name: profile.name,
        percent: compareAnswersWithUser(profile.answers),
        // Dla użytkowników z data.json – opis i avatar z danych; dla importowanych – stara wiadomość
        description: userData ? (userData.description || '') : 'Zgodnosc obliczona na podstawie wspolnych odpowiedzi.',
        avatar: userData ? (userData.avatar || null) : null,
        isDataUser: !!userData
      };
    }).sort((a, b) => b.percent - a.percent);
  };
  // ============================================================================

  function refreshUsersRanking() {
    const container = document.getElementById('users-results');
    if (!container || typeof createRankingSection !== 'function') return;
    container.innerHTML = '';
    const title = translations?.ui?.rankingUsers || 'Ranking użytkowników';
    container.appendChild(createRankingSection(title, window.getUserRankingItems(), 'user'));
  }

  function getNote(questionId) {
    const key = String(questionId);
    if (Object.prototype.hasOwnProperty.call(answerNotes, key)) return answerNotes[key] || '';
    const existing = userAnswers.find(a => a.questionId === Number(questionId));
    return existing?.note || '';
  }

  function setNote(questionId, value) {
    const key = String(questionId);
    answerNotes[key] = String(value || '').slice(0, NOTE_LIMIT);
    const existing = userAnswers.find(a => a.questionId === Number(questionId));
    if (existing) existing.note = answerNotes[key];
  }

  function mergeNoteIntoAnswer(answerObj) {
    answerObj.note = getNote(answerObj.questionId);
    return answerObj;
  }

  // ======================= ZADANIE 3: parseExportCode – eksponowana globalnie =======================
  function parseExportCode(rawCode) {
    if (!config) return [];
    const lines = String(rawCode || '').split(/\r?\n/);
    const parsed = [];
    const parsedNotes = new Map();

    for (const line of lines) {
      const noteMatch = line.match(/^\s*Uzasadnienie\s*\[id:(\d+)\]:\s*(.*)$/i);
      if (noteMatch) {
        const questionId = parseInt(noteMatch[1], 10);
        let noteText = noteMatch[2] || '';
        try { noteText = decodeURIComponent(noteText); } catch (err) {}
        parsedNotes.set(questionId, noteText.slice(0, NOTE_LIMIT));
      }
    }

    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+?)\s*\[id:(\d+)\]:\s*\((.*?)\);?$/);
      if (!match) continue;
      const questionId = parseInt(match[2], 10);
      const answerText = match[3].trim();
      const question = config.questions.find(q => q.id === questionId);
      if (!question) continue;

      let matchedAnswer = null;
      let matchedIndex = -1;
      if (answerText !== 'Brak odpowiedzi') {
        for (let idx = 0; idx < question.answers.length; idx++) {
          const ans = question.answers[idx];
          if (ans.label === answerText || normalizeAnswerLabel(ans.label) === normalizeAnswerLabel(answerText)) {
            matchedAnswer = ans;
            matchedIndex = idx;
            break;
          }
        }
        if (!matchedAnswer && (answerText === 'Pomiń' || answerText === 'Skip')) {
          for (let idx = 0; idx < question.answers.length; idx++) {
            const ans = question.answers[idx];
            if (ans.value === 0 && (ans.label.includes('Pomi') || ans.label.includes('Skip'))) {
              matchedAnswer = ans;
              matchedIndex = idx;
              break;
            }
          }
        }
      }

      if (matchedAnswer) {
        parsed.push({
          questionId: question.id,
          answerIndex: matchedIndex,
          answerValue: matchedAnswer.value,
          answerData: matchedAnswer,
          note: parsedNotes.get(question.id) || ''
        });
      } else if (parsedNotes.has(question.id)) {
        parsed.push({
          questionId: question.id,
          answerIndex: -1,
          answerValue: 0,
          answerData: null,
          note: parsedNotes.get(question.id) || '',
          noteOnly: true
        });
      }
    }
    return parsed;
  }

  // Eksponuj globalnie – naprawia błąd w script.js (simulateAnswers, getEntityCoordinates dla użytkowników)
  window.parseExportCode = parseExportCode;
  // ====================================================================================================

  function getAnswerText(answerObj) {
    if (!answerObj || !answerObj.answerData) return 'Brak odpowiedzi';
    return answerObj.answerData.label || 'Brak odpowiedzi';
  }

  function renderQuestionsEnhanced() {
    questionsContainer.innerHTML = '';
    config.questions.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.dataset.id = q.id;

      const questionText = document.createElement('div');
      questionText.className = 'question-text';
      questionText.innerText = `${idx + 1}. ${q.text}`;
      card.appendChild(questionText);

      const btnRow = document.createElement('div');
      btnRow.className = 'question-tools-row';
      const expandBtn = document.createElement('button');
      expandBtn.innerText = translations?.ui?.expandBtn || 'Rozwiń tezę';
      expandBtn.className = 'expand-btn';
      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'description';
      descriptionDiv.innerText = q.description || (translations?.ui?.noDescription || 'Brak dodatkowego opisu.');
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        descriptionDiv.classList.toggle('visible');
        expandBtn.innerText = descriptionDiv.classList.contains('visible') ? (translations?.ui?.collapseBtn || 'Zwiń tezę') : (translations?.ui?.expandBtn || 'Rozwiń tezę');
      });
      btnRow.appendChild(expandBtn);

      if (q.comment) {
        const commentBtn = document.createElement('span');
        commentBtn.innerText = translations?.ui?.skipIfBadge || 'Pomiń jeśli';
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
        if (label.includes('Zdecydowanie zgadzam') || label.includes('Strongly agree')) ansEl.classList.add('answer-strong-agree');
        else if (label.includes('Częściowo zgadzam') || label.includes('Somewhat agree')) ansEl.classList.add('answer-mild-agree');
        else if (label.includes('Częściowo nie zgadzam') || label.includes('Somewhat disagree')) ansEl.classList.add('answer-mild-disagree');
        else if (label.includes('Zdecydowanie nie zgadzam') || label.includes('Strongly disagree')) ansEl.classList.add('answer-strong-disagree');
        else if (label.includes('Pomiń') || label.includes('Skip')) ansEl.classList.add('answer-skip');
        ansEl.addEventListener('click', () => {
          answersDiv.querySelectorAll('.answer-option').forEach(sib => sib.classList.remove('selected'));
          ansEl.classList.add('selected');
          const existing = userAnswers.findIndex(a => a.questionId === q.id);
          const answerObj = mergeNoteIntoAnswer({
            questionId: q.id,
            answerIndex: ansIdx,
            answerValue: ans.value,
            answerData: ans
          });
          if (existing !== -1) userAnswers[existing] = answerObj;
          else userAnswers.push(answerObj);
        });
        answersDiv.appendChild(ansEl);
      });
      card.appendChild(answersDiv);

      const noteWrap = document.createElement('div');
      noteWrap.className = 'answer-note-wrap';
      noteWrap.innerHTML = `
        <label for="answer-note-${q.id}">Uzasadnienie odpowiedzi <span class="note-counter">0/${NOTE_LIMIT}</span></label>
        <textarea id="answer-note-${q.id}" class="answer-note" maxlength="${NOTE_LIMIT}" rows="3" placeholder="Opcjonalnie doprecyzuj, jak rozumiesz tę odpowiedź."></textarea>
      `;
      const noteInput = noteWrap.querySelector('textarea');
      const counter = noteWrap.querySelector('.note-counter');
      noteInput.value = getNote(q.id);
      counter.textContent = `${noteInput.value.length}/${NOTE_LIMIT}`;
      noteInput.addEventListener('input', () => {
        setNote(q.id, noteInput.value);
        counter.textContent = `${noteInput.value.length}/${NOTE_LIMIT}`;
        renderFriendAnswerComparison();
        refreshExportSection?.();
      });
      card.appendChild(noteWrap);
      questionsContainer.appendChild(card);
    });
    updateDOMSelections();
  }

  window.renderQuestions = renderQuestionsEnhanced;
  renderQuestions = renderQuestionsEnhanced;

  const baseUpdateDOMSelections = window.updateDOMSelections || updateDOMSelections;
  window.updateDOMSelections = function () {
    baseUpdateDOMSelections();
    document.querySelectorAll('.answer-note').forEach(input => {
      const card = input.closest('.question-card');
      if (!card) return;
      const note = getNote(card.dataset.id);
      input.value = note;
      const counter = card.querySelector('.note-counter');
      if (counter) counter.textContent = `${note.length}/${NOTE_LIMIT}`;
    });
  };
  updateDOMSelections = window.updateDOMSelections;

  window.generateExportCode = function () {
    if (!config) return '';
    const dateStr = getCurrentDateTime();
    let output = `Data wykonania testu: ${dateStr}\n\n`;
    for (let i = 0; i < config.questions.length; i++) {
      const q = config.questions[i];
      const userAns = userAnswers.find(a => a.questionId === q.id && !a.noteOnly);
      const note = getNote(q.id);
      let answerText = 'Brak odpowiedzi';
      if (userAns && userAns.answerData) answerText = userAns.answerData.label;
      else if (userAns && userAns.answerValue === 0) answerText = 'Pomiń';
      output += `${i + 1}. ${q.text} [id:${q.id}]: (${answerText});\n`;
      if (note.trim()) output += `Uzasadnienie [id:${q.id}]: ${encodeURIComponent(note.trim())}\n`;
    }
    return output;
  };
  generateExportCode = window.generateExportCode;

  window.importAnswersFromExportCode = function (rawCode) {
    if (!config) return false;
    const parsed = parseExportCode(rawCode);
    const answerRows = parsed.filter(row => !row.noteOnly && row.answerData);
    const noteRows = parsed.filter(row => row.note);
    if (answerRows.length === 0 && noteRows.length === 0) {
      showPopup(translations?.ui?.importNoAnswers || 'Nie znaleziono prawidłowych odpowiedzi w kodzie.');
      return false;
    }
    for (const row of noteRows) setNote(row.questionId, row.note);
    userAnswers = answerRows.map(row => mergeNoteIntoAnswer(row));
    updateDOMSelections();
    if (resultsDiv.style.display !== 'none') computeAndDisplayResults();
    else showPopup(`${translations?.ui?.importSuccess || `Zaimportowano ${answerRows.length} odpowiedzi.`} ${translations?.ui?.clickShowResults || 'Kliknij "Pokaż wyniki", aby zobaczyć zaktualizowany profil.'}`);
    renderFriendAnswerComparison();
    return true;
  };
  importAnswersFromExportCode = window.importAnswersFromExportCode;

  const baseSyncUserAnswersFromDOM = window.syncUserAnswersFromDOM || syncUserAnswersFromDOM;
  window.syncUserAnswersFromDOM = function () {
    baseSyncUserAnswersFromDOM();
    userAnswers = userAnswers.map(row => mergeNoteIntoAnswer(row));
  };
  syncUserAnswersFromDOM = window.syncUserAnswersFromDOM;

  function getValuesForActiveMarker() {
    return manualCompassValues || compassUserValues;
  }

  const baseUpdateCompassDisplay = window.updateCompassDisplay || updateCompassDisplay;
  window.updateCompassDisplay = function () {
    if (manualCompassValues) {
      const saved = compassUserValues;
      compassUserValues = manualCompassValues;
      baseUpdateCompassDisplay();
      compassUserValues = saved;
    } else {
      baseUpdateCompassDisplay();
    }
    renderFriendMarkers();
  };
  updateCompassDisplay = window.updateCompassDisplay;

  // ======================= ZADANIE 2: NAKŁADKI UŻYTKOWNIKÓW NA KOMPAS =======================
  window.getEntityCoordinates = async function (name, type) {
    if (type === 'user') {
      const user = config?.users?.find(u => u.name === name);
      if (!user || !user.exportCode) return { x: 0, y: 0 };
      const parsed = parseExportCode(user.exportCode).filter(row => !row.noteOnly && row.answerData);
      if (!parsed.length) return { x: 0, y: 0 };
      const scores = computeScoresForAnswers(parsed, currentScoringMode);
      const valuesMap = buildUserValuesMap(scores.pairResults);
      const coords = computeCoordinatesFromValues(valuesMap, currentCompassMode, currentCreativeConfig);
      return { x: coords.x, y: coords.y };
    }
    // partie i ideologie
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
      if (!bestAnswer) bestAnswer = question.answers.find(a => a.value === 0 && (a.label.includes('Pomi') || a.label.includes('Skip'))) || question.answers[0];
      simulatedAnswers.push({
        questionId: question.id,
        answerIndex: question.answers.indexOf(bestAnswer),
        answerValue: bestAnswer.value,
        answerData: bestAnswer
      });
    }
    const tmpScores = computeScoresForAnswers(simulatedAnswers, currentScoringMode);
    const valuesMap = buildUserValuesMap(tmpScores.pairResults);
    const coords = computeCoordinatesFromValues(valuesMap, currentCompassMode, currentCreativeConfig);
    return { x: coords.x, y: coords.y };
  };
  getEntityCoordinates = window.getEntityCoordinates;

  // Rozszerz loadOverlays o obsługę użytkowników
  const baseLoadOverlays = window.loadOverlays || loadOverlays;
  window.loadOverlays = async function (showParties, showIdeologies, compassInstance) {
    const showUsers = document.getElementById('toggle-users')?.checked ||
                      document.getElementById('modal-toggle-users')?.checked || false;
    if (!compassInstance || !compassInstance.clearOverlays) return;
    compassInstance.clearOverlays();
    if (!config) return;
    if (showParties && config.parties) {
      for (const party of config.parties) {
        const coords = await window.getEntityCoordinates(party.key || party.name, 'party');
        if (coords) {
          const logoUrl = getPartyLogoUrl(party.name);
          compassInstance.addOverlay(logoUrl, coords.x, coords.y, 'party', party.name, party.description);
        }
      }
    }
    if (showIdeologies && config.ideologies) {
      for (const ideology of config.ideologies) {
        const coords = await window.getEntityCoordinates(ideology.key || ideology.name, 'ideology');
        if (coords) {
          const logoUrl = getIdeologyLogoUrl(ideology.name);
          compassInstance.addOverlay(logoUrl, coords.x, coords.y, 'ideology', ideology.name, ideology.description);
        }
      }
    }
    if (showUsers && config.users) {
      for (const user of config.users) {
        const coords = await window.getEntityCoordinates(user.name, 'user');
        if (coords) {
          const avatarUrl = user.avatar ? `images/IUsers/${user.avatar}` : null;
          const logoUrl = avatarUrl || 'images/ALogo.svg';
          compassInstance.addOverlay(logoUrl, coords.x, coords.y, 'user', user.name, user.description || '');
        }
      }
    }
  };
  loadOverlays = window.loadOverlays;
  // ========================================================================================

  if (typeof CompassUI !== 'undefined') {
    CompassUI.prototype.clearFriendMarkers = function () {
      this.friendMarkers?.forEach(marker => marker.remove());
      this.friendMarkers = [];
    };
    CompassUI.prototype.addFriendMarker = function (x, y, name, color) {
      if (!this.compass) return;
      if (!this.friendMarkers) this.friendMarkers = [];
      const leftPercent = ((x + 10) / 20) * 100;
      const topPercent = ((10 - y) / 20) * 100;
      const marker = document.createElement('div');
      marker.className = 'friend-compass-marker';
      marker.style.left = `${leftPercent}%`;
      marker.style.top = `${topPercent}%`;
      marker.style.setProperty('--friend-color', color || '#2563eb');
      marker.innerHTML = `<span class="friend-dot"></span><span class="friend-label">${escapeHtml(name)}</span>`;
      this.compass.appendChild(marker);
      this.friendMarkers.push(marker);
    };
  }

  function computeFriendProfile(name, rawCode) {
    const parsed = parseExportCode(rawCode).filter(row => !row.noteOnly && row.answerData);
    if (!parsed.length) return null;
    const scores = computeScoresForAnswers(parsed, currentScoringMode);
    const valuesMap = buildUserValuesMap(scores.pairResults);
    const coords = computeCoordinatesFromValues(valuesMap, currentCompassMode, currentCreativeConfig);
    return { name, answers: parsed, valuesMap, coords, color: getRandomFriendColor(), source: 'import' };
  }

  function refreshFriendCoordinates() {
    friendProfiles.forEach(friend => {
      const scores = computeScoresForAnswers(friend.answers, currentScoringMode);
      friend.valuesMap = buildUserValuesMap(scores.pairResults);
      friend.coords = computeCoordinatesFromValues(friend.valuesMap, currentCompassMode, currentCreativeConfig);
    });
  }

  function renderFriendMarkers() {
    if (!window.modalCompassInstance) return;
    if (window.modalCompassInstance.clearFriendMarkers) window.modalCompassInstance.clearFriendMarkers();
    refreshFriendCoordinates();
    friendProfiles.forEach(friend => {
      window.modalCompassInstance.addFriendMarker?.(friend.coords.x, friend.coords.y, friend.name, friend.color);
    });
    renderFriendsList();
  }

  function findFriendAnswer(friend, questionId) {
    return friend.answers.find(ans => ans.questionId === questionId);
  }

  function renderFriendAnswerComparison() {
    const container = document.getElementById('friend-answer-comparison');
    if (!container || !config) return;
    if (!friendProfiles.length) {
      container.innerHTML = '<p class="muted-small">Zaimportowane odpowiedzi znajomych pojawia sie tutaj.</p>';
      return;
    }
    const overallHtml = friendProfiles.map(friend => `
      <div class="friend-overall-match" style="--friend-color:${friend.color}">
        <span class="friend-answer-name">${escapeHtml(friend.name)}</span>
        <strong>${compareAnswersWithUser(friend.answers)}%</strong> zgodnosci z Toba
      </div>
    `).join('');
    const html = config.questions.map((question, index) => {
      const myAnswer = userAnswers.find(ans => ans.questionId === question.id && !ans.noteOnly);
      const myNote = getNote(question.id);
      const friendsHtml = friendProfiles.map(friend => {
        const fAnswer = findFriendAnswer(friend, question.id);
        const note = fAnswer?.note || '';
        const myVal = myAnswer ? Number(myAnswer.answerValue) : null;
        const fVal = fAnswer ? Number(fAnswer.answerValue) : null;
        const singlePercent = (myVal !== null && fVal !== null && myVal !== 0 && fVal !== 0)
          ? Math.round(((pairScore(myVal, fVal) + 1.5) / 3) * 100)
          : null;
        return `
          <div class="friend-answer-row" style="--friend-color:${friend.color}">
            <span class="friend-answer-name">${escapeHtml(friend.name)}</span>
            ${singlePercent === null ? '' : `<span class="friend-answer-match">${singlePercent}% zgodnosci</span>`}
            <span class="friend-answer-text">${escapeHtml(getAnswerText(fAnswer))}</span>
            ${note || myNote ? `<details class="friend-note"><summary>Uzasadnienia</summary>${myNote ? `<p><strong>Ty:</strong> ${escapeHtml(myNote)}</p>` : ''}${note ? `<p><strong>${escapeHtml(friend.name)}:</strong> ${escapeHtml(note)}</p>` : ''}</details>` : ''}
          </div>
        `;
      }).join('');
      return `
        <details class="comparison-question">
          <summary>${index + 1}. ${escapeHtml(question.text)}</summary>
          <div class="my-answer-row"><strong>Ty:</strong> ${escapeHtml(getAnswerText(myAnswer))}${myNote ? `<p>${escapeHtml(myNote)}</p>` : ''}</div>
          ${friendsHtml}
        </details>
      `;
    }).join('');
    container.innerHTML = overallHtml + html;
  }

  function renderFriendsList() {
    const list = document.getElementById('friends-list');
    if (!list) return;
    if (!friendProfiles.length) {
      list.innerHTML = '<p class="muted-small">Brak zaimportowanych znajomych.</p>';
      renderFriendAnswerComparison();
      return;
    }
    list.innerHTML = friendProfiles.map((friend, index) => `
      <div class="friend-list-item" style="--friend-color:${friend.color}">
        <span><strong>${escapeHtml(friend.name)}</strong> X: ${friend.coords.x.toFixed(2)}, Y: ${friend.coords.y.toFixed(2)}</span>
        <button type="button" data-remove-friend="${index}">Usuń</button>
      </div>
    `).join('');
    list.querySelectorAll('[data-remove-friend]').forEach(btn => {
      btn.addEventListener('click', () => {
        friendProfiles.splice(Number(btn.dataset.removeFriend), 1);
        renderFriendMarkers();
        renderFriendAnswerComparison();
        refreshUsersRanking();
      });
    });
    renderFriendAnswerComparison();
  }

  function buildManualEditorRows() {
    const container = document.getElementById('manual-score-pairs');
    if (!container || !window.allCompassPairs) return;
    container.innerHTML = '';
    window.allCompassPairs.forEach(pair => {
      const row = document.createElement('div');
      row.className = 'manual-pair-row';
      row.dataset.pairId = pair.id;
      row.innerHTML = `
        <label><span>${escapeHtml(pair.negativeLabel)}</span><input type="number" min="0" max="100" step="1" inputmode="numeric" data-side="negative"></label>
        <span class="manual-pair-separator">⇄</span>
        <label><span>${escapeHtml(pair.positiveLabel)}</span><input type="number" min="0" max="100" step="1" inputmode="numeric" data-side="positive"></label>
      `;
      container.appendChild(row);
    });
  }

  function collectManualValues() {
    const rows = document.querySelectorAll('.manual-pair-row');
    const values = {};
    let completed = 0;
    rows.forEach(row => {
      const pairId = row.dataset.pairId;
      const negativeRaw = row.querySelector('[data-side="negative"]')?.value.trim() || '';
      const positiveRaw = row.querySelector('[data-side="positive"]')?.value.trim() || '';
      if (negativeRaw === '' || positiveRaw === '') {
        values[pairId] = { negative: null, positive: null };
        return;
      }
      const negative = Number(negativeRaw);
      const positive = Number(positiveRaw);
      if (!Number.isFinite(negative) || !Number.isFinite(positive)) {
        values[pairId] = { negative: null, positive: null };
        return;
      }
      values[pairId] = {
        negative: Math.min(100, Math.max(0, negative)),
        positive: Math.min(100, Math.max(0, positive))
      };
      completed++;
    });
    return completed ? values : null;
  }

  function updateManualStatus() {
    const status = document.getElementById('manual-score-status');
    if (!status) return;
    const values = collectManualValues();
    if (!values) {
      manualCompassValues = null;
      status.textContent = 'Ręczna edycja jest nieaktywna.';
    } else {
      manualCompassValues = values;
      const coords = computeCoordinatesFromValues(values, currentCompassMode, currentCreativeConfig);
      status.textContent = `Ręczny wynik: X ${coords.x.toFixed(2)}, Y ${coords.y.toFixed(2)} (${coords.activePairsCount} par).`;
    }
    updateCompassDisplay();
  }

  function setupManualEditor() {
    buildManualEditorRows();
    const container = document.getElementById('manual-score-pairs');
    if (!container || container.dataset.bound === 'true') return;
    container.dataset.bound = 'true';
    container.addEventListener('input', (event) => {
      const input = event.target;
      if (!input.matches('input[data-side]')) return;
      const row = input.closest('.manual-pair-row');
      const oppositeSide = input.dataset.side === 'positive' ? 'negative' : 'positive';
      const oppositeInput = row.querySelector(`input[data-side="${oppositeSide}"]`);
      const raw = input.value.trim();
      if (raw === '') {
        if (oppositeInput) oppositeInput.value = '';
        updateManualStatus();
        return;
      }
      let value = Number(raw);
      if (!Number.isFinite(value)) {
        input.value = '';
        if (oppositeInput) oppositeInput.value = '';
        updateManualStatus();
        return;
      }
      value = Math.min(100, Math.max(0, Math.round(value)));
      input.value = value;
      if (oppositeInput) oppositeInput.value = 100 - value;
      updateManualStatus();
    });
    document.getElementById('manual-score-reset')?.addEventListener('click', () => {
      container.querySelectorAll('input').forEach(input => { input.value = ''; });
      manualCompassValues = null;
      updateManualStatus();
    });
  }

  function ensureModalEnhancementPanels() {
    const controls = document.querySelector('.modal-controls');
    if (!controls || document.getElementById('friend-compare-panel')) return;

    const friendPanel = document.createElement('details');
    friendPanel.id = 'friend-compare-panel';
    friendPanel.className = 'modal-extra-panel';
    friendPanel.open = true;
    friendPanel.innerHTML = `
      <summary>Porównanie ze znajomymi</summary>
      <div class="friend-import-grid">
        <input id="friend-name-input" type="text" maxlength="40" placeholder="Nazwa znajomego">
        <textarea id="friend-code-input" rows="4" placeholder="Kod eksportu znajomego"></textarea>
        <button id="friend-import-btn" type="button" class="primary-btn">Importuj znajomego</button>
      </div>
      <div id="friends-list" class="friends-list"></div>
      <div id="friend-answer-comparison" class="friend-answer-comparison"></div>
    `;

    const manualPanel = document.createElement('details');
    manualPanel.id = 'manual-score-editor';
    manualPanel.className = 'modal-extra-panel';
    manualPanel.innerHTML = `
      <summary>Edytuj wynik ręcznie</summary>
      <p class="muted-small">Puste pary są pomijane. Wpisanie jednej strony automatycznie uzupełnia drugą.</p>
      <div id="manual-score-pairs" class="manual-score-pairs"></div>
      <div class="manual-score-actions">
        <button id="manual-score-reset" type="button" class="secondary-btn">Wyczyść ręczny wynik</button>
        <span id="manual-score-status" class="muted-small">Ręczna edycja jest nieaktywna.</span>
      </div>
    `;

    controls.appendChild(friendPanel);
    controls.appendChild(manualPanel);

    document.getElementById('friend-import-btn')?.addEventListener('click', () => {
      const nameInput = document.getElementById('friend-name-input');
      const codeInput = document.getElementById('friend-code-input');
      const rawCode = codeInput.value.trim();
      if (!rawCode) {
        showPopup('Wklej kod eksportu znajomego.');
        return;
      }
      const fallbackName = `Znajomy ${friendProfiles.length + 1}`;
      const friend = computeFriendProfile((nameInput.value.trim() || fallbackName), rawCode);
      if (!friend) {
        showPopup('Nie udało się odczytać kodu znajomego.');
        return;
      }
      friendProfiles.push(friend);
      nameInput.value = '';
      codeInput.value = '';
      renderFriendMarkers();
      renderFriendAnswerComparison();
      refreshUsersRanking();
    });

    setupManualEditor();
    renderFriendsList();
    renderFriendAnswerComparison();
  }

  function refreshVisibleOverlays() {
    const showParties = document.getElementById('toggle-parties')?.checked || false;
    const showIdeologies = document.getElementById('toggle-ideologies')?.checked || false;
    if (window.compassInstance) loadOverlays(showParties, showIdeologies, window.compassInstance);
    const modalShowParties = document.getElementById('modal-toggle-parties')?.checked || false;
    const modalShowIdeologies = document.getElementById('modal-toggle-ideologies')?.checked || false;
    if (window.modalCompassInstance) loadOverlays(modalShowParties, modalShowIdeologies, window.modalCompassInstance);
  }

  function applyCompassModeEverywhere(mode) {
    currentCompassMode = mode || 'weighted';
    const mainSelect = document.getElementById('compass-mode-select');
    const modalSelect = document.getElementById('modal-compass-mode-select');
    if (mainSelect && mainSelect.value !== currentCompassMode) mainSelect.value = currentCompassMode;
    if (modalSelect && modalSelect.value !== currentCompassMode) modalSelect.value = currentCompassMode;
    window.compassInstance?.updateModeLabel?.(currentCompassMode);
    window.modalCompassInstance?.updateModeLabel?.(currentCompassMode);
    const creativeArea = document.getElementById('creative-config-area');
    if (creativeArea) creativeArea.style.display = currentCompassMode === 'creative' ? 'block' : 'none';
    updateManualStatus();
    updateCompassDisplay();
    refreshVisibleOverlays();
    renderFriendMarkers();
  }

  function bindCompassModeSelectors() {
    ['compass-mode-select', 'modal-compass-mode-select'].forEach(id => {
      const select = document.getElementById(id);
      if (!select || select.dataset.enhancedModeBound === 'true') return;
      select.dataset.enhancedModeBound = 'true';
      select.value = currentCompassMode || 'weighted';
      select.addEventListener('change', () => applyCompassModeEverywhere(select.value));
    });
  }

  // Podpięcie toggle-users do odświeżania nakładek
  function bindUserOverlayToggle() {
    ['toggle-users', 'modal-toggle-users'].forEach(id => {
      const toggle = document.getElementById(id);
      if (!toggle || toggle.dataset.userOverlayBound === 'true') return;
      toggle.dataset.userOverlayBound = 'true';
      toggle.addEventListener('change', () => refreshVisibleOverlays());
    });
  }

  function bindModalEnhancementOpenHandler() {
    bindCompassModeSelectors();
    const openBtn = document.getElementById('open-compass-modal');
    if (!openBtn || openBtn.dataset.enhancedBound === 'true') return;
    openBtn.dataset.enhancedBound = 'true';
    openBtn.addEventListener('click', () => {
      setTimeout(() => {
        ensureModalEnhancementPanels();
        bindCompassModeSelectors();
        bindUserOverlayToggle();
        applyCompassModeEverywhere(currentCompassMode || 'weighted');
      }, 0);
    });
  }

  const baseInitCompassModal = window.initCompassModal || initCompassModal;
  window.initCompassModal = function () {
    baseInitCompassModal();
    bindCompassModeSelectors();
    bindUserOverlayToggle();
    const openBtn = document.getElementById('open-compass-modal');
    if (openBtn && openBtn.dataset.enhancedBound !== 'true') {
      openBtn.dataset.enhancedBound = 'true';
      openBtn.addEventListener('click', () => {
        setTimeout(() => {
          ensureModalEnhancementPanels();
          bindCompassModeSelectors();
          bindUserOverlayToggle();
          applyCompassModeEverywhere(currentCompassMode || 'weighted');
        }, 0);
      });
    }
  };
  initCompassModal = window.initCompassModal;

  const baseComputeAndDisplayResults = window.computeAndDisplayResults || computeAndDisplayResults;
  window.computeAndDisplayResults = function () {
    baseComputeAndDisplayResults();
    renderFriendMarkers();
    renderFriendAnswerComparison();
    refreshUsersRanking();
    bindUserOverlayToggle();
  };
  computeAndDisplayResults = window.computeAndDisplayResults;

  setTimeout(() => {
    bindCompassModeSelectors();
    bindModalEnhancementOpenHandler();
    bindUserOverlayToggle();
  }, 0);

  document.addEventListener('change', (event) => {
    if (event.target && (event.target.id === 'modal-compass-mode-select' || event.target.id === 'compass-mode-select' || event.target.name === 'scoringMode')) {
      setTimeout(() => {
        updateManualStatus();
        renderFriendMarkers();
        renderFriendAnswerComparison();
      }, 0);
    }
  });
})();

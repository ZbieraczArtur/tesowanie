// kompas.js – inicjalizacja kompasu na podstronie

(function () {
  'use strict';

  // Wczytaj dane z localStorage
  let compassData = null;
  try {
    const raw = localStorage.getItem('neoAutystyk_compassData');
    if (raw) compassData = JSON.parse(raw);
  } catch (e) {
    console.warn('Nie udało się odczytać danych kompasu z localStorage:', e);
  }

  if (!compassData || !compassData.values) {
    // Jeśli brak danych, pokaż komunikat i przycisk do powrotu
    const container = document.getElementById('modal-compass-container');
    if (container) {
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center; background: var(--card-bg); border-radius: 32px; border: 1px solid var(--card-border);">
          <p style="font-size: 1.2rem; font-weight: 600;">Brak danych do wyświetlenia kompasu.</p>
          <p style="color: var(--text-secondary);">Najpierw wykonaj test na głównej stronie i kliknij "Pokaż wyniki".</p>
          <a href="index.html" style="display: inline-block; margin-top: 1rem; padding: 0.6rem 1.5rem; background: var(--submit-bg); color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">← Powrót do testu</a>
        </div>
      `;
    }
    return;
  }

  // Przygotuj zmienne globalne dla kompasu
  window.currentCompassMode = compassData.mode || 'weighted';
  window.currentCreativeConfig = compassData.creativeConfig || { activePairs: [], labels: { top: "Heteronomia", bottom: "Autonomia", left: "Socjalizm", right: "Kapitalizm" } };
  window.currentScoringMode = compassData.scoringMode || 'full';
  window.compassUserValues = compassData.values;

  // Funkcja pomocnicza do aktualizacji opisu trybu
  function updateModeDescription(select) {
    const desc = document.getElementById('compass-mode-desc');
    if (!desc) return;
    const descriptions = {
      weighted: 'Wagowy – uwzględnia domyślne wagi poszczególnych par.',
      equal: 'Jednakowe wagi – każda para ma wagę 1.',
      institutional: 'Instytucjonalny – tylko pary związane z instytucjami państwowymi.',
      creative: 'Kreatywny – ręczny wybór par i wag.'
    };
    desc.textContent = descriptions[select.value] || '';
  }

  // Inicjalizacja kompasu
  const container = document.getElementById('modal-compass-container');
  if (!container) return;

  // Stwórz instancję CompassUI
  const compassInstance = new CompassUI(container, {
    mode: window.currentCompassMode,
    creativeConfig: window.currentCreativeConfig,
    onModeChange: function (mode) {
      window.currentCompassMode = mode;
      // Aktualizuj opis
      const select = document.getElementById('compass-mode-select');
      if (select) updateModeDescription(select);
      // Odśwież nakładki
      refreshOverlays();
      // Zapisz stan w localStorage
      saveCompassState();
    },
    onCreativeConfigChange: function (config) {
      window.currentCreativeConfig = config;
      // Zapisz stan
      saveCompassState();
      // Odśwież nakładki
      refreshOverlays();
    }
  });

  // Zapisz instancję globalnie (przyda się do odświeżania nakładek)
  window.modalCompassInstance = compassInstance;

  // Ustaw wartości użytkownika
  const coords = computeCoordinatesFromValues(window.compassUserValues, window.currentCompassMode, window.currentCreativeConfig);
  compassInstance.updateMarker(coords.x, coords.y);
  compassInstance.updateActivePairs(coords.activePairsCount);
  compassInstance.updateModeLabel(window.currentCompassMode);

  // Ustaw selektor trybu
  const modeSelect = document.getElementById('compass-mode-select');
  if (modeSelect) {
    modeSelect.value = window.currentCompassMode;
    updateModeDescription(modeSelect);
    modeSelect.addEventListener('change', function () {
      const newMode = this.value;
      compassInstance.setMode(newMode);
      window.currentCompassMode = newMode;
      // Przelicz współrzędne
      const newCoords = computeCoordinatesFromValues(window.compassUserValues, newMode, window.currentCreativeConfig);
      compassInstance.updateMarker(newCoords.x, newCoords.y);
      compassInstance.updateActivePairs(newCoords.activePairsCount);
      updateModeDescription(this);
      refreshOverlays();
      saveCompassState();
    });
  }

  // Przełączniki nakładek
  const toggleParties = document.getElementById('toggle-parties');
  const toggleIdeologies = document.getElementById('toggle-ideologies');
  const toggleUsers = document.getElementById('toggle-users');

  function refreshOverlays() {
    const showParties = toggleParties ? toggleParties.checked : false;
    const showIdeologies = toggleIdeologies ? toggleIdeologies.checked : false;
    const showUsers = toggleUsers ? toggleUsers.checked : false;
    if (typeof loadOverlays === 'function') {
      // Używamy tej samej funkcji co w głównej stronie, ale z odpowiednimi checkboxami
      // Musimy tymczasowo ustawić stany checkboxów z głównej strony na false, bo loadOverlays czyta je po ID
      // Ale na podstronie mamy własne checkboxy, więc nadpisujemy wartości w obiekcie document
      // Najprościej: wywołać loadOverlays z przekazanymi wartościami
      loadOverlays(showParties, showIdeologies, compassInstance);
    }
  }

  // Nasłuchiwanie na checkboxy
  if (toggleParties) toggleParties.addEventListener('change', refreshOverlays);
  if (toggleIdeologies) toggleIdeologies.addEventListener('change', refreshOverlays);
  if (toggleUsers) toggleUsers.addEventListener('change', refreshOverlays);

  // Załaduj nakładki przy starcie
  refreshOverlays();

  // Konfiguracja kreatywna
  const creativeArea = document.getElementById('creative-config-area');
  const creativeModeSelect = document.getElementById('compass-mode-select');
  if (creativeArea && creativeModeSelect) {
    function toggleCreativeArea() {
      creativeArea.classList.toggle('visible', creativeModeSelect.value === 'creative');
    }
    creativeModeSelect.addEventListener('change', toggleCreativeArea);
    toggleCreativeArea(); // ustaw początkowy stan
  }

  // Podepnij panel kreatywny (jeśli istnieje w CompassUI)
  if (compassInstance.setCreativeConfigPanel) {
    const listContainer = document.getElementById('modal-creative-pairs-list');
    const topInput = document.getElementById('modal-label-top');
    const bottomInput = document.getElementById('modal-label-bottom');
    const leftInput = document.getElementById('modal-label-left');
    const rightInput = document.getElementById('modal-label-right');
    const applyLabelsBtn = document.getElementById('modal-apply-labels');
    const applyCreativeBtn = document.getElementById('modal-apply-creative');

    if (listContainer && topInput && bottomInput && leftInput && rightInput && applyLabelsBtn && applyCreativeBtn) {
      compassInstance.setCreativeConfigPanel(
        creativeArea,
        listContainer,
        topInput,
        bottomInput,
        leftInput,
        rightInput,
        applyLabelsBtn,
        applyCreativeBtn
      );
      // Po ustawieniu panelu, odśwież nakładki (bo mogły się zmienić aktywne pary)
      applyCreativeBtn.addEventListener('click', function () {
        setTimeout(refreshOverlays, 50);
      });
    }
  }

  // Funkcja zapisująca stan do localStorage
  function saveCompassState() {
    try {
      const data = {
        values: window.compassUserValues,
        mode: window.currentCompassMode,
        creativeConfig: window.currentCreativeConfig,
        scoringMode: window.currentScoringMode
      };
      localStorage.setItem('neoAutystyk_compassData', JSON.stringify(data));
    } catch (e) {
      console.warn('Nie udało się zapisać stanu kompasu:', e);
    }
  }

  // Obsługa popupa (jeśli funkcja showPopup istnieje – z script.js)
  // Jeśli nie, definiujemy prostą wersję
  if (typeof showPopup !== 'function') {
    window.showPopup = function (message) {
      const popup = document.getElementById('popup');
      const popupText = document.getElementById('popup-text');
      if (popup && popupText) {
        popupText.innerText = message;
        popup.classList.remove('hidden');
      }
    };
    const closePopupBtn = document.getElementById('closePopup');
    if (closePopupBtn) {
      closePopupBtn.addEventListener('click', function () {
        document.getElementById('popup').classList.add('hidden');
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const popup = document.getElementById('popup');
        if (popup && !popup.classList.contains('hidden')) popup.classList.add('hidden');
      }
    });
  }

  // Upewnij się, że funkcja getPartyLogoUrl i getIdeologyLogoUrl są dostępne (z script.js)
  // Jeśli nie, możemy je zdefiniować tymczasowo – ale one są w script.js, który jest załadowany przed kompas.js

  console.log('Kompas zainicjalizowany z danymi z localStorage.');
})();

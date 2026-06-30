// compass-ui.js – klasa do renderowania i sterowania kompasem
class CompassUI {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.mode = options.mode || 'weighted';
    this.creativeConfig = options.creativeConfig || { activePairs: [], labels: { top: "Heteronomia", bottom: "Autonomia", left: "Socjalizm", right: "Kapitalizm" } };
    this.marker = null;
    this.overlays = [];
    this.onModeChange = options.onModeChange || (() => {});
    this.onCreativeConfigChange = options.onCreativeConfigChange || (() => {});
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="compass-frame">
        <div></div>
        <div class="compass-outer-label top" id="compassLabelTop">${this.creativeConfig.labels.top}</div>
        <div></div>
        <div class="compass-outer-label left" id="compassLabelLeft">${this.creativeConfig.labels.left}</div>
        <div class="compass" id="compass">
          <div class="quadrant quadrant-tl"></div>
          <div class="quadrant quadrant-tr"></div>
          <div class="quadrant quadrant-bl"></div>
          <div class="quadrant quadrant-br"></div>
          <div class="marker" id="marker"></div>
        </div>
        <div class="compass-outer-label right" id="compassLabelRight">${this.creativeConfig.labels.right}</div>
        <div></div>
        <div class="compass-outer-label bottom" id="compassLabelBottom">${this.creativeConfig.labels.bottom}</div>
        <div></div>
      </div>
      <div class="compass-stats" style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.8rem;">
        <span>📍 X: <span id="compass-x">0.00</span></span>
        <span>📍 Y: <span id="compass-y">0.00</span></span>
        <span>🔗 Aktywne pary: <span id="compass-active">0</span></span>
        <span>⚙️ Tryb: <span id="compass-mode-label">${this.getModeLabel()}</span></span>
      </div>
    `;
    this.compass = this.container.querySelector('#compass');
    this.marker = this.container.querySelector('#marker');
    this.xSpan = this.container.querySelector('#compass-x');
    this.ySpan = this.container.querySelector('#compass-y');
    this.activeSpan = this.container.querySelector('#compass-active');
    this.modeLabelSpan = this.container.querySelector('#compass-mode-label');
    this.updateLabels();
  }

  getModeLabel() {
    const labels = { weighted: 'Wagowy', equal: 'Jednakowe wagi', institutional: 'Instytucjonalny', creative: 'Kreatywny' };
    return labels[this.mode] || 'Wagowy';
  }

  updateLabels() {
    const top = this.container.querySelector('#compassLabelTop');
    const bottom = this.container.querySelector('#compassLabelBottom');
    const left = this.container.querySelector('#compassLabelLeft');
    const right = this.container.querySelector('#compassLabelRight');
    if (top) top.innerText = this.creativeConfig.labels.top;
    if (bottom) bottom.innerText = this.creativeConfig.labels.bottom;
    if (left) left.innerText = this.creativeConfig.labels.left;
    if (right) right.innerText = this.creativeConfig.labels.right;
  }

  updateMarker(x, y) {
    if (!this.marker) return;
    const leftPercent = ((x + 10) / 20) * 100;
    const topPercent = ((10 - y) / 20) * 100;
    this.marker.style.left = `${leftPercent}%`;
    this.marker.style.top = `${topPercent}%`;
    if (this.xSpan) this.xSpan.innerText = x.toFixed(2);
    if (this.ySpan) this.ySpan.innerText = y.toFixed(2);
  }

  updateActivePairs(count) {
    if (this.activeSpan) this.activeSpan.innerText = count;
  }

  updateModeLabel(mode) {
    this.mode = mode;
    if (this.modeLabelSpan) this.modeLabelSpan.innerText = this.getModeLabel();
  }

  setMode(mode) {
    this.mode = mode;
    this.updateModeLabel(mode);
    if (this.onModeChange) this.onModeChange(mode);
  }

  setCreativeConfig(config) {
    this.creativeConfig = config;
    this.updateLabels();
    if (this.onCreativeConfigChange) this.onCreativeConfigChange(config);
  }

  addOverlay(logoUrl, x, y, type, name, description) {
    if (!this.compass) return;
    const leftPercent = ((x + 10) / 20) * 100;
    const topPercent = ((10 - y) / 20) * 100;
    const overlay = document.createElement('img');
    overlay.src = logoUrl;
    overlay.alt = name;
    overlay.title = `${name}\n${description || ''}`;
    overlay.className = `compass-overlay ${type}`;
    overlay.style.position = 'absolute';
    overlay.style.left = `${leftPercent}%`;
    overlay.style.top = `${topPercent}%`;
    overlay.style.width = '24px';
    overlay.style.height = '24px';
    overlay.style.objectFit = 'contain';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.transition = 'opacity 0.2s';
    overlay.style.zIndex = '5';
    overlay.style.pointerEvents = 'auto';
    overlay.style.cursor = 'pointer';
    overlay.addEventListener('mouseenter', () => overlay.style.opacity = '1');
    overlay.addEventListener('mouseleave', () => overlay.style.opacity = '0.7');
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.showPopup) window.showPopup(`${name}\n\n${description || 'Brak opisu.'}`);
    });
    this.compass.appendChild(overlay);
    this.overlays.push(overlay);
  }

  clearOverlays() {
    for (let ov of this.overlays) ov.remove();
    this.overlays = [];
  }

  destroy() {
    this.clearOverlays();
    this.container.innerHTML = '';
  }

  // Metoda do podpinania panelu kreatywnego (dla modala)
  setCreativeConfigPanel(areaElement, listContainer, topInput, bottomInput, leftInput, rightInput, applyLabelsBtn, applyCreativeBtn) {
    this.creativeArea = areaElement;
    this.creativeListContainer = listContainer;
    this.creativeTopInput = topInput;
    this.creativeBottomInput = bottomInput;
    this.creativeLeftInput = leftInput;
    this.creativeRightInput = rightInput;
    this.applyLabelsBtn = applyLabelsBtn;
    this.applyCreativeBtn = applyCreativeBtn;
    if (this.applyLabelsBtn) {
      this.applyLabelsBtn.onclick = () => {
        this.creativeConfig.labels = {
          top: this.creativeTopInput.value,
          bottom: this.creativeBottomInput.value,
          left: this.creativeLeftInput.value,
          right: this.creativeRightInput.value
        };
        this.updateLabels();
        if (this.onCreativeConfigChange) this.onCreativeConfigChange(this.creativeConfig);
      };
    }
    if (this.applyCreativeBtn) {
      this.applyCreativeBtn.onclick = () => {
        // Zbierz aktywne pary z listy
        const active = [];
        const rows = this.creativeListContainer.querySelectorAll('.creative-pair-row');
        rows.forEach(row => {
          const cb = row.querySelector('.creative-active-cb');
          if (cb && cb.checked) {
            const id = cb.dataset.id;
            const axis = row.querySelector('.creative-axis-select').value;
            const weight = parseFloat(row.querySelector('.creative-weight-input').value);
            const direction = parseInt(row.querySelector('.creative-direction-select').value, 10) || 1;
            if (!isNaN(weight)) active.push({ pairId: id, axis, weight, direction });
          }
        });
        this.creativeConfig.activePairs = active;
        if (this.onCreativeConfigChange) this.onCreativeConfigChange(this.creativeConfig);
      };
    }
    this.renderCreativePairsList();
  }

  renderCreativePairsList() {
    if (!this.creativeListContainer) return;
    this.creativeListContainer.innerHTML = '';
    const allPairs = [...corePairs, ...extraPairs];
    for (const pair of allPairs) {
      const existing = this.creativeConfig.activePairs.find(c => c.pairId === pair.id);
      const isActive = !!existing;
      const axisVal = existing ? existing.axis : (pair.axis || 'x');
      const weightVal = existing ? existing.weight : pair.weight;
      const directionVal = existing ? (existing.direction || 1) : 1;
      const row = document.createElement('div');
      row.className = 'creative-pair-row';
      row.innerHTML = `
        <label style="display: flex; align-items: center; gap: 6px;">
          <input type="checkbox" class="creative-active-cb" data-id="${pair.id}" ${isActive ? 'checked' : ''}>
          <span>${pair.negativeLabel} ⇄ ${pair.positiveLabel}</span>
        </label>
        <select class="creative-axis-select" data-id="${pair.id}" ${!isActive ? 'disabled' : ''}>
          <option value="x" ${axisVal === 'x' ? 'selected' : ''}>Oś X</option>
          <option value="y" ${axisVal === 'y' ? 'selected' : ''}>Oś Y</option>
        </select>
        <select class="creative-direction-select" data-id="${pair.id}" ${!isActive ? 'disabled' : ''}>
          <option value="1" ${directionVal === 1 ? 'selected' : ''}>${pair.positiveLabel} -> +</option>
          <option value="-1" ${directionVal === -1 ? 'selected' : ''}>${pair.negativeLabel} -> +</option>
        </select>
        <input type="number" step="0.1" class="creative-weight-input" data-id="${pair.id}" value="${weightVal}" ${!isActive ? 'disabled' : ''} style="width: 70px;">
      `;
      const cb = row.querySelector('.creative-active-cb');
      const axisSel = row.querySelector('.creative-axis-select');
      const directionSel = row.querySelector('.creative-direction-select');
      const weightInp = row.querySelector('.creative-weight-input');
      cb.addEventListener('change', (e) => {
        const checked = e.target.checked;
        axisSel.disabled = !checked;
        directionSel.disabled = !checked;
        weightInp.disabled = !checked;
      });
      this.creativeListContainer.appendChild(row);
    }
  }
}

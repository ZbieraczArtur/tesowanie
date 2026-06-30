// compass-core.js – logika obliczeń współrzędnych
const corePairs = [
  { id: "p1", axis: "x", negativeLabel: "Własność kolektywna", positiveLabel: "Własność prywatna", weight: 1.5, institutional: true },
  { id: "p2", axis: "x", negativeLabel: "Planowanie", positiveLabel: "Rynek", weight: 1, institutional: true },
  { id: "p3", axis: "y", negativeLabel: "Samoregulacja", positiveLabel: "Regulacja instytucjonalna", weight: 1, institutional: true },
  { id: "p4", axis: "y", negativeLabel: "Samoorganizacja", positiveLabel: "Etatyzm", weight: 1.75, institutional: true },
  { id: "p5", axis: "y", negativeLabel: "Decentralizacja", positiveLabel: "Centralizacja", weight: 1, institutional: true },
  { id: "p6", axis: "y", negativeLabel: "Ograniczenie władzy", positiveLabel: "Absolutyzm władzy", weight: 1.75, institutional: true },
  { id: "p7", axis: "y", negativeLabel: "Różnorodność norm", positiveLabel: "Uniformizacja norm", weight: 1, institutional: true },
  { id: "p8", axis: "y", negativeLabel: "Minimalizacja granic", positiveLabel: "Kontrola granic", weight: 0.5, institutional: true },
  { id: "p9", axis: "y", negativeLabel: "Wolność ekspresji", positiveLabel: "Cenzura", weight: 1, institutional: true },
  { id: "p10", axis: "y", negativeLabel: "Autonomia", positiveLabel: "Heteronomia", weight: 2, institutional: false },
  { id: "p14", axis: "y", negativeLabel: "Antypaternalizm", positiveLabel: "Paternalizm", weight: 1.5, institutional: false },
  { id: "p11", axis: "y", negativeLabel: "Kontraktualizm", positiveLabel: "Organicyzm", weight: 1.5, institutional: false },
  { id: "p12", axis: "y", negativeLabel: "Dobrowolność wspólnoty", positiveLabel: "Obowiązkowość wspólnoty", weight: 1.5, institutional: false },
  { id: "p13", axis: "y", negativeLabel: "Desakralizacja autorytetu", positiveLabel: "Sakralizacja autorytetu", weight: 1.75, institutional: false }
];

const extraPairs = [
  { id: "ex1", axis: null, negativeLabel: "Kolektywizm", positiveLabel: "Indywidualizm", weight: 1, institutional: false, extra: true },
  { id: "ex2", axis: null, negativeLabel: "Hierarchiczność", positiveLabel: "Egalitaryzm", weight: 1, institutional: false, extra: true },
  { id: "ex3", axis: null, negativeLabel: "Anty-demokracja", positiveLabel: "Demokracja", weight: 1, institutional: false, extra: true },
  { id: "ex4", axis: null, negativeLabel: "Anty-autokracja", positiveLabel: "Autokracja", weight: 1, institutional: false, extra: true },
  { id: "ex5", axis: null, negativeLabel: "Swobodna wymiana", positiveLabel: "Ograniczanie wymiany", weight: 1, institutional: false, extra: true },
  { id: "ex6", axis: null, negativeLabel: "Partykularyzm narodowy", positiveLabel: "Kosmopolityzm", weight: 1, institutional: false, extra: true },
  { id: "ex7", axis: null, negativeLabel: "Izolacjonizm", positiveLabel: "Interwencjonizm zagraniczny", weight: 1, institutional: false, extra: true },
  { id: "ex8", axis: null, negativeLabel: "Unikanie przemocy", positiveLabel: "Preferencja użycia siły", weight: 1, institutional: false, extra: true },
  { id: "ex9", axis: null, negativeLabel: "Gradualizm", positiveLabel: "Rewolucja", weight: 1, institutional: false, extra: true },
  { id: "ex10", axis: null, negativeLabel: "Konserwatyzm", positiveLabel: "Progresywizm", weight: 1, institutional: false, extra: true },
  { id: "ex11", axis: null, negativeLabel: "Homogenizacja", positiveLabel: "Pluralizm kulturowy", weight: 1, institutional: false, extra: true },
  { id: "ex12", axis: null, negativeLabel: "Instytucjonalna religia", positiveLabel: "Neutralność religijna", weight: 1, institutional: false, extra: true },
  { id: "ex13", axis: null, negativeLabel: "Wykluczenie", positiveLabel: "Włączanie", weight: 1, institutional: false, extra: true },
  { id: "ex14", axis: null, negativeLabel: "Suprematyzm biologiczny", positiveLabel: "Egalitaryzm biologiczny", weight: 1, institutional: false, extra: true },
  { id: "ex15", axis: null, negativeLabel: "Ekocentryzm", positiveLabel: "Antropocentryzm", weight: 1, institutional: false, extra: true },
  { id: "ex16", axis: null, negativeLabel: "Prymitywizm", positiveLabel: "Postęp technologiczny", weight: 1, institutional: false, extra: true }
];

const allCompassPairs = [...corePairs, ...extraPairs];

function computeCoordinatesFromValues(valuesMap, mode, creativeConfig = { activePairs: [], labels: {} }) {
  let pairsToUse = [];
  if (mode === 'weighted') pairsToUse = corePairs.filter(p => !p.extra);
  else if (mode === 'equal') pairsToUse = corePairs.filter(p => !p.extra).map(p => ({ ...p, weight: 1 }));
  else if (mode === 'institutional') pairsToUse = corePairs.filter(p => p.institutional === true);
  else if (mode === 'creative') {
    pairsToUse = creativeConfig.activePairs.map(cfg => {
      const original = allCompassPairs.find(p => p.id === cfg.pairId);
      if (!original) return null;
      return { ...original, axis: cfg.axis, weight: cfg.weight, direction: cfg.direction || 1 };
    }).filter(p => p !== null);
  }
  let sumX = 0, maxSumX = 0, activeX = 0;
  let sumY = 0, maxSumY = 0, activeY = 0;
  for (const pair of pairsToUse) {
    const vals = valuesMap[pair.id];
    if (!vals || vals.negative === null || vals.positive === null) continue;
    const diff = (vals.positive - vals.negative) * (pair.direction || 1);
    const weightVal = pair.weight;
    if (pair.axis === 'x') {
      sumX += diff * weightVal;
      maxSumX += 100 * weightVal;
      activeX++;
    } else if (pair.axis === 'y') {
      sumY += diff * weightVal;
      maxSumY += 100 * weightVal;
      activeY++;
    }
  }
  const scoreX = maxSumX > 0 ? (sumX / maxSumX) * 10 : 0;
  const scoreY = maxSumY > 0 ? (sumY / maxSumY) * 10 : 0;
  return {
    x: Math.min(10, Math.max(-10, scoreX)),
    y: Math.min(10, Math.max(-10, scoreY)),
    activePairsCount: activeX + activeY
  };
}

// Udostępnienie globalne dla innych skryptów (script.js)
window.corePairs = corePairs;
window.extraPairs = extraPairs;
window.allCompassPairs = [...corePairs, ...extraPairs];


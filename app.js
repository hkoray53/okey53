const STORAGE_KEY = "okey101_team_state_v2";

// Spalten-Reihenfolge (6 Zellen pro Runde):
// 0: Team 1 Einzelstrafpunkte
// 1: Spieler 1
// 2: Spieler 2
// 3: Team 2 Einzelstrafpunkte
// 4: Spieler 3
// 5: Spieler 4
const COLUMN_COUNT = 6;

const KUMAR_QUOTES = [
  "„Kumarda kaybeden, aşkta kazanır.“",
  "„Kartlar yalan söylemez, insanlar söyler.“",
  "„Şans masada biter, aşk kalpte başlar.“",
  "„Kumar masasında paramızı, hayatta zamanımızı kaybettik.“",
  "„Destemiz kötü olabilir ama yüreğimiz sağlam.“",
  "„Aşkta kaybettik, kumarda da teselli bulamadık.“",
  "„Her kaybeden şanssız değildir, bazıları sadece fazla inanmıştır.“",
  "„Masada blöf yaptık, hayatta gerçekleri saklayamadık.“",
  "„Kader bize gülmedi, biz yine de güldük.“",
  "„Son el dedik, hayatımızın en uzun gecesi oldu.“",
  "„Kumarda şansımız yok, aşkta zaten hiç olmadı.“",
  "„Her açılan kart, kapanmayan bir yaradır.“",
  "„Masaya umutla oturduk, pişmanlıkla kalktık.“",
  "„Kader bize rest çekti, biz yine de görmek istedik.“",
  "„Elimizde koz vardı, ama gönlümüzde hep sızı.“",
  "„Kumar masasında dost belli olur, son elde herkes kaybolur.“",
  "„Aşkımız platonik, şansımız matematiksel olarak sıfır.“",
  "„Papazı beklerken hayatımızdan krallar geçti.“",
  "„Para pul oldu, gençlik kül oldu.“",
  "„Son paramızı bastık, son umudumuzu da kaybettik.“",
  "„Çifte gittik, hayatta tek kaldık.“",
  "\"Papazı beklerken hayatımızdan krallar geçti\""
];

let lastQuoteIndex = -1;

let state = loadState() || {
  teams: ["TEAM 1", "TEAM 2"],
  players: ["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"],
  rounds: Array.from({ length: 5 }, () => Array(COLUMN_COUNT).fill(null))
};

if (!Array.isArray(state.teams)) state.teams = ["TEAM 1", "TEAM 2"];
if (!Array.isArray(state.players)) state.players = ["Spieler 1", "Spieler 2", "Spieler 3", "Spieler 4"];
if (!Array.isArray(state.rounds)) {
  state.rounds = Array.from({ length: 5 }, () => Array(COLUMN_COUNT).fill(null));
} else {
  state.rounds = state.rounds.map((r) => {
    const row = Array.isArray(r) ? r.slice(0, COLUMN_COUNT) : [];
    while (row.length < COLUMN_COUNT) row.push(null);
    return row;
  });
}

let activeCell = { round: 0, col: 0 };
let currentInput = "0";

const roundsBody = document.getElementById("roundsBody");
const keypadOverlay = document.getElementById("keypadOverlay");
const keypadLabel = document.getElementById("keypadLabel");
const keypadDisplay = document.getElementById("keypadDisplay");
const resultModal = document.getElementById("resultModal");
const quoteText = document.getElementById("quoteText");

function showRandomQuote() {
  if (KUMAR_QUOTES.length === 0) return;
  let nextIdx = Math.floor(Math.random() * KUMAR_QUOTES.length);
  if (KUMAR_QUOTES.length > 1 && nextIdx === lastQuoteIndex) {
    nextIdx = (nextIdx + 1) % KUMAR_QUOTES.length;
  }
  lastQuoteIndex = nextIdx;
  quoteText.textContent = KUMAR_QUOTES[nextIdx];
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function getColumnLabel(colIdx) {
  const t1Name = state.teams[0] || "TEAM 1";
  const t2Name = state.teams[1] || "TEAM 2";
  switch (colIdx) {
    case 0: return `${t1Name} Extra`;
    case 1: return state.players[0] || "Spieler 1";
    case 2: return state.players[1] || "Spieler 2";
    case 3: return `${t2Name} Extra`;
    case 4: return state.players[2] || "Spieler 3";
    case 5: return state.players[3] || "Spieler 4";
    default: return "";
  }
}

function initTeams() {
  document.querySelectorAll(".team-name").forEach((input) => {
    const idx = Number(input.dataset.team);
    input.value = state.teams[idx] || `TEAM ${idx + 1}`;
    input.addEventListener("input", () => {
      state.teams[idx] = input.value.trim() || `TEAM ${idx + 1}`;
      saveState();
    });
  });
}

function initPlayers() {
  document.querySelectorAll(".player-name").forEach((input) => {
    const idx = Number(input.dataset.player);
    input.value = state.players[idx] || `Spieler ${idx + 1}`;
    input.addEventListener("input", () => {
      state.players[idx] = input.value.trim() || `Spieler ${idx + 1}`;
      saveState();
    });
  });
}

function renderTable() {
  roundsBody.innerHTML = "";
  state.rounds.forEach((roundScores, rIdx) => {
    const tr = document.createElement("tr");

    const tdNum = document.createElement("td");
    tdNum.className = "round-num";
    tdNum.textContent = rIdx + 1;
    tr.appendChild(tdNum);

    roundScores.forEach((val, cIdx) => {
      const td = document.createElement("td");
      td.className = "score-cell";
      if (cIdx === 0 || cIdx === 3) {
        td.classList.add("team-penalty");
      }
      if (val === null) {
        td.classList.add("empty");
        td.textContent = "–";
      } else {
        td.textContent = val;
        td.classList.add(val < 0 ? "neg-val" : "pos-val");
      }
      if (!keypadOverlay.classList.contains("hidden") &&
          activeCell.round === rIdx && activeCell.col === cIdx) {
        td.classList.add("active");
      }
      td.addEventListener("click", () => openKeypad(rIdx, cIdx));
      tr.appendChild(td);
    });

    roundsBody.appendChild(tr);
  });
}

function openKeypad(roundIdx, colIdx) {
  activeCell = { round: roundIdx, col: colIdx };
  const existing = state.rounds[roundIdx][colIdx];
  currentInput = existing !== null ? String(existing) : "0";
  updateKeypadUI();
  keypadOverlay.classList.remove("hidden");
  renderTable();
}

function updateKeypadUI() {
  const label = getColumnLabel(activeCell.col);
  keypadLabel.textContent = `Runde ${activeCell.round + 1} – ${label}`;
  keypadDisplay.textContent = currentInput;
}

function commitCurrentValue(moveNext = true) {
  const num = parseInt(currentInput, 10);
  state.rounds[activeCell.round][activeCell.col] = isNaN(num) ? 0 : num;
  saveState();

  if (moveNext) {
    if (activeCell.col < COLUMN_COUNT - 1) {
      openKeypad(activeCell.round, activeCell.col + 1);
      return;
    } else {
      if (activeCell.round === state.rounds.length - 1) {
        state.rounds.push(Array(COLUMN_COUNT).fill(null));
        saveState();
      }
      closeKeypad();
    }
  } else {
    closeKeypad();
  }
}

function closeKeypad() {
  keypadOverlay.classList.add("hidden");
  renderTable();
}

// Ziffernblock-Events
document.querySelectorAll(".num-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.key;
    if (key === "del") {
      currentInput = currentInput.slice(0, -1);
      if (currentInput === "" || currentInput === "-") currentInput = "0";
    } else if (key === "sign") {
      if (currentInput === "0") return;
      currentInput = currentInput.startsWith("-")
        ? currentInput.slice(1)
        : "-" + currentInput;
    } else {
      if (currentInput === "0") currentInput = key;
      else if (currentInput === "-0") currentInput = "-" + key;
      else if (currentInput.length < 5) currentInput += key;
    }
    updateKeypadUI();
  });
});

// Schnellbuttons (-101, -202, +101, +202)
document.querySelectorAll(".quick-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentInput = btn.dataset.quick;
    commitCurrentValue(true);
  });
});

// Çift: verdoppelt die aktuell eingegebenen Punkte
document.getElementById("ciftKeyBtn").addEventListener("click", () => {
  const parsed = parseInt(currentInput, 10);
  const currentNum = isNaN(parsed) ? 0 : parsed;
  const doubled = currentNum * 2;
  currentInput = String(doubled).slice(0, 6);
  updateKeypadUI();
});

document.getElementById("confirmKeyBtn").addEventListener("click", () => {
  commitCurrentValue(true);
});

document.getElementById("closeKeypadBtn").addEventListener("click", closeKeypad);

document.getElementById("addRoundBtn").addEventListener("click", () => {
  state.rounds.push(Array(COLUMN_COUNT).fill(null));
  saveState();
  renderTable();
  const container = document.getElementById("tableContainer");
  container.scrollTop = container.scrollHeight;
});

document.getElementById("calcResultBtn").addEventListener("click", () => {
  const colTotals = Array(COLUMN_COUNT).fill(0);
  state.rounds.forEach((r) => {
    r.forEach((val, idx) => {
      if (typeof val === "number") colTotals[idx] += val;
    });
  });

  // colTotals: [0]=T1 Extra, [1]=P1, [2]=P2, [3]=T2 Extra, [4]=P3, [5]=P4
  const t1 = colTotals[0] + colTotals[1] + colTotals[2];
  const t2 = colTotals[3] + colTotals[4] + colTotals[5];

  const team1Name = state.teams[0] || "TEAM 1";
  const team2Name = state.teams[1] || "TEAM 2";

  document.getElementById("team1Title").textContent = team1Name;
  document.getElementById("team2Title").textContent = team2Name;
  document.getElementById("team1Names").textContent = `${state.players[0]} & ${state.players[1]}`;
  document.getElementById("team2Names").textContent = `${state.players[2]} & ${state.players[3]}`;
  document.getElementById("team1Total").textContent = t1;
  document.getElementById("team2Total").textContent = t2;
  document.getElementById("team1Breakdown").textContent = `${colTotals[0]} + ${colTotals[1]} + ${colTotals[2]}`;
  document.getElementById("team2Breakdown").textContent = `${colTotals[3]} + ${colTotals[4]} + ${colTotals[5]}`;

  const box1 = document.getElementById("team1Box");
  const box2 = document.getElementById("team2Box");
  const banner = document.getElementById("winnerBanner");
  box1.classList.remove("winner");
  box2.classList.remove("winner");

  // Bei Okey 101 gewinnt das Team mit den WENIGER Punkten
  if (t1 < t2) {
    box1.classList.add("winner");
    banner.textContent = `🏆 ${team1Name} führt mit ${t2 - t1} Punkten Vorsprung!`;
  } else if (t2 < t1) {
    box2.classList.add("winner");
    banner.textContent = `🏆 ${team2Name} führt mit ${t1 - t2} Punkten Vorsprung!`;
  } else {
    banner.textContent = "🤝 Gleichstand!";
  }

  showRandomQuote();
  resultModal.classList.remove("hidden");
});

document.getElementById("nextQuoteBtn").addEventListener("click", showRandomQuote);

document.getElementById("closeModalBtn").addEventListener("click", () => {
  resultModal.classList.add("hidden");
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("Alle eingetragenen Punkte löschen und neues Spiel starten?")) {
    state.rounds = Array.from({ length: 5 }, () => Array(COLUMN_COUNT).fill(null));
    saveState();
    renderTable();
  }
});

initTeams();
initPlayers();
renderTable();

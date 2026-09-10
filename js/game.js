/* game.js — игровая логика: генератор судоку, состояние партии, ходы, новая игра */

/* ================= генератор ================= */
function shuffleArr(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}
function placeOk(g, i, v) {
  const r = (i / N) | 0,
    c = i % N;
  for (let k = 0; k < N; k++) {
    if (g[r * N + k] === v || g[k * N + c] === v) return false;
  }
  const br = ((r / BH) | 0) * BH,
    bc = ((c / BW) | 0) * BW;
  for (let x = br; x < br + BH; x++)
    for (let y = bc; y < bc + BW; y++) {
      if (g[x * N + y] === v) return false;
    }
  return true;
}
function fillGrid(g) {
  for (let i = 0; i < TOTAL; i++) {
    if (g[i] === 0) {
      const nums = shuffleArr(Array.from({ length: N }, (_, k) => k + 1));
      for (let q = 0; q < N; q++) {
        const v = nums[q];
        if (placeOk(g, i, v)) {
          g[i] = v;
          if (fillGrid(g)) return true;
          g[i] = 0;
        }
      }
      return false;
    }
  }
  return true;
}
function countSols(g, limit) {
  /* берём пустую клетку с минимумом кандидатов — иначе 12×12 считается минутами */
  let best = -1,
    bestCnt = N + 1;
  for (let i = 0; i < TOTAL; i++) {
    if (g[i] === 0) {
      let cnt = 0;
      for (let v = 1; v <= N; v++) {
        if (placeOk(g, i, v)) cnt++;
      }
      if (cnt < bestCnt) {
        best = i;
        bestCnt = cnt;
        if (cnt <= 1) break;
      }
    }
  }
  if (best < 0) return 1;
  if (bestCnt === 0) return 0;
  let cnt = 0;
  for (let v = 1; v <= N; v++) {
    if (placeOk(g, best, v)) {
      g[best] = v;
      cnt += countSols(g, limit);
      g[best] = 0;
      if (cnt >= limit) break;
    }
  }
  return cnt;
}
function makePuzzle(holes) {
  const sol = new Array(TOTAL).fill(0);
  fillGrid(sol);
  const puz = sol.slice();
  const order = shuffleArr(Array.from({ length: TOTAL }, (_, k) => k));
  let removed = 0;
  for (let q = 0; q < TOTAL && removed < holes; q++) {
    const idx = order[q],
      v = puz[idx];
    puz[idx] = 0;
    const test = puz.slice();
    if (countSols(test, 2) === 1) {
      removed++;
    } else {
      puz[idx] = v;
    }
  }
  return { sol: sol, puz: puz };
}

/* ================= состояние ================= */
const MODES = {
  easy: { N: 9, BW: 3, BH: 3, holes: 38, lives: 3, hints: 3 },
  medium: { N: 9, BW: 3, BH: 3, holes: 46, lives: 3, hints: 3 },
  hard: { N: 12, BW: 3, BH: 4, holes: 85, lives: 7, hints: 5 },
};
const DIFF_NAMES = { easy: "Лёгкая", medium: "Средняя", hard: "Сложная" };
const FAIL_TEXTS = {
  3: "Три промаха — дождь смывает партию. Начнём заново?",
  7: "Семь промахов — ливень смывает партию. Начнём заново?",
};
let N = 9,
  BW = 3,
  BH = 3,
  TOTAL = 81,
  lives = 3;
let cellEls = [],
  solution = [],
  givenArr = [],
  boardVals = [],
  notesArr = [];
let selected = -1,
  noteMode = false,
  mistakes = 0,
  hintsLeft = 3;
let undoStack = [],
  seconds = 0,
  timerId = null,
  playing = false,
  diff = "medium";

/* ================= ходы ================= */
function pushUndo() {
  undoStack.push({ b: boardVals.slice(), n: notesArr.map((s) => new Set(s)) });
  if (undoStack.length > 300) undoStack.shift();
}
function peersOf(idx) {
  const r = (idx / N) | 0,
    c = idx % N,
    br = ((r / BH) | 0) * BH,
    bc = ((c / BW) | 0) * BW,
    out = [];
  for (let k = 0; k < N; k++) {
    out.push(r * N + k);
    out.push(k * N + c);
  }
  for (let x = br; x < br + BH; x++)
    for (let y = bc; y < bc + BW; y++) {
      out.push(x * N + y);
    }
  return out;
}
function clearPeerNotes(idx, n) {
  peersOf(idx).forEach((p) => notesArr[p].delete(n));
}

function inputNumber(n){
  if(!playing||selected<0) return;
  const idx=selected;
  if(givenArr[idx]) return;
  if(noteMode){
    if(boardVals[idx]!==0) return;
    if(!notesArr[idx].has(n) && notesArr[idx].size>=4){ buzz(20); return; }
    pushUndo(); buzz(8);
    if(notesArr[idx].has(n)) notesArr[idx].delete(n); else notesArr[idx].add(n);
    render(); saveGame(); return;
  }
  pushUndo();
  boardVals[idx]=n; notesArr[idx].clear();
  cellEls[idx].dataset.pop='1';
  if(n===solution[idx]){ clearPeerNotes(idx,n); buzz(12); }
  else{
    mistakes++; updateMistakes(); buzz([30,40,30]);
    if(mistakes>=lives){ render(); updateNumpad(); endGame(false); return; }
  }
  render(); updateNumpad(); saveGame(); checkWin();
}

function eraseCell(){
  if(!playing||selected<0||givenArr[selected]) return;
  if(boardVals[selected]===0 && notesArr[selected].size===0) return;
  pushUndo(); buzz(8);
  boardVals[selected]=0; notesArr[selected].clear();
  render(); updateNumpad(); saveGame();
}

function undoMove(){
  if(!playing||undoStack.length===0) return;
  const st=undoStack.pop();
  boardVals=st.b; notesArr=st.n;
  buzz(8); render(); updateNumpad(); saveGame();
}

function useHint(){
  if(!playing||hintsLeft<=0) return;
  let idx=-1;
  if(selected>=0 && !givenArr[selected] && boardVals[selected]!==solution[selected]) idx=selected;
  else idx=boardVals.findIndex((v,i)=>v!==solution[i]);
  if(idx<0) return;
  pushUndo(); buzz(15);
  hintsLeft--; hintBadge.textContent=hintsLeft;
  if(hintsLeft===0) document.getElementById('btnHint').style.opacity=.45;
  boardVals[idx]=solution[idx]; notesArr[idx].clear();
  clearPeerNotes(idx, solution[idx]);
  selected=idx; cellEls[idx].dataset.pop='1';
  render(); updateNumpad(); saveGame(); checkWin();
}

function checkWin() {
  for (let i = 0; i < TOTAL; i++) {
    if (boardVals[i] !== solution[i]) return;
  }
  endGame(true);
}

function endGame(win) {
  playing = false;
  clearSave();
  if (timerId) clearInterval(timerId);
  if (win) buzz([20, 60, 20, 60, 40]);
  else buzz([80, 60, 80]);
  document.getElementById("modalSeal").textContent = win ? "完" : "雨";
  document.getElementById("modalTitle").textContent = win
    ? "Гармония достигнута"
    : "Камни рассыпались";
  document.getElementById("modalSub").textContent = win
    ? "Сад камней сложился целиком. Тишина."
    : FAIL_TEXTS[lives];
  document.getElementById("mTime").textContent = fmtTime(seconds);
  document.getElementById("mMist").textContent = mistakes;
  document.getElementById("mDiff").textContent = DIFF_NAMES[diff];
  setTimeout(() => modalEl.classList.remove("hidden"), win ? 350 : 550);
}

/* ================= новая игра ================= */
function newGame(d){
  diff=d;
  const m=MODES[d];
  N=m.N; BW=m.BW; BH=m.BH; TOTAL=N*N; lives=m.lives;
  document.querySelectorAll('.diff').forEach(b=>b.classList.toggle('active', b.dataset.diff===d));
  boardWrap.classList.add('loading');
  modalEl.classList.add('hidden');
  buildBoard(); buildNumpad();
  setTimeout(()=>{
    const res=makePuzzle(m.holes);
    solution=res.sol;
    givenArr=res.puz.map(v=>v!==0);
    boardVals=res.puz.slice();
    notesArr=Array.from({length:TOTAL},()=>new Set());
    selected=-1; noteMode=false; mistakes=0; hintsLeft=m.hints; undoStack=[];
    document.getElementById('btnNotes').classList.remove('active');
    document.getElementById('btnHint').style.opacity=1;
    hintBadge.textContent=m.hints;
    updateMistakes(); updateNumpad(); render();
    startTimer(); playing=true; saveGame();
    boardWrap.classList.remove('loading');
  },60);
}

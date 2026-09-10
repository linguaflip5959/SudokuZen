/* interface.js — интерфейс: DOM-ссылки, построение поля и панели, рендер, управление */

/* DOM-ссылки */
const boardEl = document.getElementById("board");
const boardWrap = document.getElementById("boardWrap");
const numpadEl = document.getElementById("numpad");
const timerEl = document.getElementById("timer");
const mistEl = document.getElementById("mistakes");
const hintBadge = document.getElementById("hintBadge");
const quoteEl = document.getElementById("quote");
const modalEl = document.getElementById("modal");

/* ячейки поля */
function buildBoard() {
  boardEl.innerHTML = "";
  cellEls = [];
  boardEl.classList.toggle("board12", N === 12);
  for (let i = 0; i < TOTAL; i++) {
    const d = document.createElement("div");
    d.className = "cell";
    d.dataset.idx = i;
    d.dataset.r = (i / N) | 0;
    d.dataset.c = i % N;
    d.addEventListener("click", () => {
      selected = i;
      buzz(8);
      render();
    });
    boardEl.appendChild(d);
    cellEls.push(d);
  }
}
buildBoard();
/* цифровая панель */
const numBtns = [];
function buildNumpad() {
  numpadEl.innerHTML = "";
  numBtns.length = 0;
  numpadEl.classList.toggle("p12", N === 12);
  for (let n = 1; n <= N; n++) {
    const b = document.createElement("button");
    b.className = "num";
    b.dataset.n = n;
    b.innerHTML = n + '<span class="left">' + N + "</span>";
    b.addEventListener("click", () => inputNumber(n));
    numpadEl.appendChild(b);
    numBtns.push(b);
  }
}
buildNumpad();

/* ================= рендер ================= */
function render() {
  const selVal = selected >= 0 ? boardVals[selected] : 0;
  const sr = selected >= 0 ? (selected / N) | 0 : -1,
    sc = selected >= 0 ? selected % N : -1;
  const sb = selected >= 0 ? ((sr / BH) | 0) * (N / BW) + ((sc / BW) | 0) : -1;
  for (let i = 0; i < TOTAL; i++) {
    const el = cellEls[i],
      r = (i / N) | 0,
      c = i % N,
      b = ((r / BH) | 0) * (N / BW) + ((c / BW) | 0);
    let cls = "cell";
    if (givenArr[i]) cls += " given";
    if (boardVals[i] !== 0 && !givenArr[i] && boardVals[i] !== solution[i])
      cls += " error";
    if (selected >= 0) {
      if (i === selected) cls += " sel";
      else if (r === sr || c === sc || b === sb) cls += " peer";
      if (selVal !== 0 && boardVals[i] === selVal && i !== selected)
        cls += " same";
    }
    el.className = cls + (el.dataset.pop ? " pop" : "");
    el.dataset.pop = "";
    if (boardVals[i] !== 0) {
      el.innerHTML = '<span class="val">' + boardVals[i] + "</span>";
    } else if (notesArr[i].size > 0) {
      const ns = Array.from(notesArr[i])
        .sort((a, b) => a - b)
        .slice(0, 4);
      let h = '<div class="notes">';
      for (let k = 0; k < 4; k++) {
        h += "<i>" + (ns[k] !== undefined ? ns[k] : "") + "</i>";
      }
      el.innerHTML = h + "</div>";
    } else {
      el.innerHTML = "";
    }
  }
}

function updateNumpad() {
  for (let n = 1; n <= N; n++) {
    let cnt = 0;
    for (let i = 0; i < TOTAL; i++) {
      if (boardVals[i] === n) cnt++;
    }
    numBtns[n - 1].querySelector(".left").textContent = N - cnt;
    numBtns[n - 1].classList.toggle("done", cnt >= N);
  }
}
function updateMistakes() {
  mistEl.classList.toggle("long", lives > 5);
  let s = "";
  for (let k = 0; k < lives; k++) {
    s += k < lives - mistakes ? "○" : "●";
  }
  mistEl.textContent = s;
}
function fmtTime(s) {
  const m = ("0" + Math.floor(s / 60)).slice(-2),
    ss = ("0" + (s % 60)).slice(-2);
  return m + ":" + ss;
}

function startTimer(s){
  if(timerId) clearInterval(timerId);
  seconds=s||0; timerEl.textContent=fmtTime(seconds);
  timerId=setInterval(()=>{
    seconds++; timerEl.textContent=fmtTime(seconds);
    if(seconds%15===0) saveGame();
  },1000);
}

/* ================= управление ================= */
document.querySelectorAll('.diff').forEach(b=>b.addEventListener('click',function(){
  buzz(10);
  const d=this.dataset.diff;
  if(d==='hard'&&!isHardUnlockedToday()){
    rewardAd(function(){ unlockHard(); newGame('hard'); });
    return;
  }
  newGame(d);
}));
document.getElementById("btnNotes").addEventListener("click", function () {
  noteMode = !noteMode;
  this.classList.toggle("active", noteMode);
  buzz(10);
});
document.getElementById("btnErase").addEventListener("click", eraseCell);
document.getElementById("btnUndo").addEventListener("click", undoMove);
document.getElementById("btnHint").addEventListener("click", useHint);
document.getElementById("btnAgain").addEventListener("click", () => {
  buzz(10);
  newGame(diff);
});
document
  .getElementById("btnClose")
  .addEventListener("click", () => modalEl.classList.add("hidden"));

/* свайпы по полю — перемещение выделения */
let touchStartX = 0,
  touchStartY = 0,
  touchCell = -1;
boardEl.addEventListener(
  "touchstart",
  (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    const el = document.elementFromPoint(t.clientX, t.clientY);
    touchCell = el && el.classList.contains("cell") ? +el.dataset.idx : -1;
  },
  { passive: true },
);
boardEl.addEventListener(
  "touchend",
  (e) => {
    if (touchCell < 0) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX,
      dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 28 || Math.abs(dy) > 28) {
      e.preventDefault();
      let r = (touchCell / N) | 0,
        c = touchCell % N;
      if (Math.abs(dx) > Math.abs(dy)) c += dx > 0 ? 1 : -1;
      else r += dy > 0 ? 1 : -1;
      r = Math.max(0, Math.min(N - 1, r));
      c = Math.max(0, Math.min(N - 1, c));
      selected = r * N + c;
      buzz(8);
      render();
    }
  },
  { passive: false },
);

/* замок на Сложной */
function updateHardLock(){
  const btn=document.querySelector('.diff[data-diff="hard"]');
  if(!btn) return;
  const locked=!isHardUnlockedToday();
  btn.classList.toggle('locked', locked);
  btn.innerHTML = locked ? 'Сложная <span class="vk-ico">▶</span>' : 'Сложная · 12×12';
}

/* Одиночки и Продолжить — за просмотр */
document.getElementById('btnSolo').addEventListener('click',function(){
  if(!playing||usedSolo) return;
  /* сухой прогон: не показываем рекламу, если вписывать нечего */
  let cnt=0;
  for(let i=0;i<TOTAL;i++){
    if(givenArr[i]||boardVals[i]!==0) continue;
    const ps=peersOf(i);
    let c=0,last=0;
    for(let v=1;v<=N;v++){
      let ok=true;
      for(let q=0;q<ps.length;q++){ if(boardVals[ps[q]]===v){ ok=false; break; } }
      if(ok){ c++; last=v; }
    }
    if(c===1&&last===solution[i]) cnt++;
  }
  if(cnt===0){ flashInfo('Сад безмолвствует — одиночек нет'); return; }
  rewardAd(solitude);
});
document.getElementById('btnContinue').addEventListener('click',function(){
  rewardAd(continueGame);
});
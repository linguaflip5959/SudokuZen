/* game.js — состояние партии, ходы, новая игра (генератор живёт в generator.js) */

/* ================= состояние ================= */
const MODES={
  easy:  {N:9,  BW:3, BH:3, holes:38, lives:3, hints:3},
  medium:{N:9,  BW:3, BH:3, holes:46, lives:3, hints:3},
  hard:  {N:12, BW:3, BH:4, holes:85, lives:7, hints:5}
};
const DIFF_NAMES={easy:'Лёгкая', medium:'Средняя', hard:'Сложная'};
const FAIL_TEXTS={
  3:'Три промаха — дождь смывает партию. Начнём заново?',
  7:'Семь промахов — ливень смывает партию. Начнём заново?'
};
let N=9, BW=3, BH=3, TOTAL=81, lives=3;
let cellEls=[], solution=[], givenArr=[], boardVals=[], notesArr=[];
let selected=-1, noteMode=false, mistakes=0, hintsLeft=3;
let undoStack=[], seconds=0, timerId=null, playing=false, diff='medium';
let usedContinue=false, usedSolo=false;

/* ================= ходы ================= */
function pushUndo(){
  undoStack.push({b:boardVals.slice(), n:notesArr.map(s=>new Set(s))});
  if(undoStack.length>300) undoStack.shift();
}
function peersOf(idx){
  const r=(idx/N)|0, c=idx%N, br=((r/BH)|0)*BH, bc=((c/BW)|0)*BW, out=[];
  for(let k=0;k<N;k++){ out.push(r*N+k); out.push(k*N+c); }
  for(let x=br;x<br+BH;x++)for(let y=bc;y<bc+BW;y++){ out.push(x*N+y); }
  return out;
}
function clearPeerNotes(idx,n){ peersOf(idx).forEach(p=>notesArr[p].delete(n)); }

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
  if(!playing) return;
  if(hintsLeft<=0){ askHints(); return; }
  let idx=-1;
  if(selected>=0 && !givenArr[selected] && boardVals[selected]!==solution[selected]) idx=selected;
  else idx=boardVals.findIndex((v,i)=>v!==solution[i]);
  if(idx<0) return;
  pushUndo(); buzz(15);
  hintsLeft--; hintBadge.textContent=hintsLeft;
  if(hintsLeft===0) hintBadge.textContent='+3';
  boardVals[idx]=solution[idx]; notesArr[idx].clear();
  clearPeerNotes(idx, solution[idx]);
  selected=idx; cellEls[idx].dataset.pop='1';
  render(); updateNumpad(); saveGame(); checkWin();
}
function askHints(){
  rewardAd(function(){
    hintsLeft+=3;
    hintBadge.textContent=hintsLeft;
    buzz(12); saveGame();
  });
}
function solitude(){
  if(!playing||usedSolo) return;
  pushUndo();
  let found=0;
  for(let i=0;i<TOTAL;i++){
    if(givenArr[i]||boardVals[i]!==0) continue;
    const ps=peersOf(i);
    let cnt=0, last=0;
    for(let v=1;v<=N;v++){
      let ok=true;
      for(let q=0;q<ps.length;q++){ if(boardVals[ps[q]]===v){ ok=false; break; } }
      if(ok){ cnt++; last=v; }
    }
    if(cnt===1 && last===solution[i]){
      boardVals[i]=last; notesArr[i].clear(); clearPeerNotes(i,last);
      cellEls[i].dataset.pop='1'; found++;
    }
  }
  if(found===0){
    undoStack.pop();
    flashInfo('Сад безмолвствует — одиночек нет');
    return;
  }
  usedSolo=true;
  document.getElementById('btnSolo').style.opacity=.45;
  buzz([15,40,15]);
  render(); updateNumpad(); saveGame(); checkWin();
  flashInfo('Вписано одиночек: '+found);
}
function continueGame(){
  if(playing) return;
  usedContinue=true;
  mistakes=Math.max(0, mistakes-2);
  updateMistakes();
  modalEl.classList.add('hidden');
  playing=true;
  startTimer(seconds);
  saveGame();
  buzz(12);
}
function checkWin(){
  for(let i=0;i<TOTAL;i++){ if(boardVals[i]!==solution[i]) return; }
  endGame(true);
}
function endGame(win){
  playing=false;
  clearSave();
  if(timerId) clearInterval(timerId);
  if(win) buzz([20,60,20,60,40]); else buzz([80,60,80]);
  document.getElementById('modalSeal').textContent = win ? '完' : '雨';
  document.getElementById('modalTitle').textContent = win ? 'Гармония достигнута' : 'Камни рассыпались';
  document.getElementById('modalSub').textContent = win
    ? 'Сад камней сложился целиком. Тишина.'
    : FAIL_TEXTS[lives];
  document.getElementById('mTime').textContent=fmtTime(seconds);
  document.getElementById('mMist').textContent=mistakes;
  document.getElementById('mDiff').textContent=DIFF_NAMES[diff];
  document.getElementById('btnContinue').classList.toggle('gone', win||usedContinue);
  setTimeout(()=>modalEl.classList.remove('hidden'), win?350:550);
}

/* ================= новая игра ================= */
function newGame(d){
  diff=d;
  const m=MODES[d];
  N=m.N; BW=m.BW; BH=m.BH; TOTAL=N*N; lives=m.lives;
  document.querySelectorAll('.diff').forEach(b=>b.classList.toggle('active', b.dataset.diff===d));
  modalEl.classList.add('hidden');
  buildBoard(); buildNumpad();
  const cfg={diff:d, N:m.N, BW:m.BW, BH:m.BH, holes:m.holes};
  const apply=function(res){
    solution=res.sol;
    givenArr=res.puz.map(v=>v!==0);
    boardVals=res.puz.slice();
    notesArr=Array.from({length:TOTAL},()=>new Set());
    selected=-1; noteMode=false; mistakes=0; hintsLeft=m.hints; undoStack=[];
    usedContinue=false; usedSolo=false;
    document.getElementById('btnNotes').classList.remove('active');
    hintBadge.textContent=m.hints;
    document.getElementById('btnSolo').style.opacity=1;
    updateMistakes(); updateNumpad(); render();
    startTimer(); playing=true; saveGame();
    boardWrap.classList.remove('loading');
    precache(cfg); /* следующая сетка — прозапас, пока играется эта */
  };
  const cached=popCache(cfg);
  if(cached){ apply(cached); return; } /* преген готов — старт мгновенно, без лоадера */
  boardWrap.classList.add('loading');
  genPuzzle(cfg, apply);
}
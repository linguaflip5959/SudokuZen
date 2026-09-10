/* save.js — сейвы: автосейв после хода, каждые 15 секунд и при сворачивании; кнопка «Сберечь»; восстановление при старте */

const SAVE_KEY='zen-sudoku-v1';

function saveGame(){
  if(!playing) return;
  try{
    const data={
      v:1, diff:diff, sec:seconds, mistakes:mistakes, hints:hintsLeft,
      board:boardVals, given:givenArr.map(v=>v?1:0), sol:solution,
      notes:notesArr.map(s=>Array.from(s)),
      undo:undoStack.slice(-50).map(st=>({b:st.b, n:st.n.map(x=>Array.from(x))}))
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }catch(err){}
}

function loadSave(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw) return null;
    const d=JSON.parse(raw);
    if(!d || d.v!==1 || !MODES[d.diff]) return null;
    const T=MODES[d.diff].N*MODES[d.diff].N;
    if(!Array.isArray(d.board)||d.board.length!==T) return null;
    if(!Array.isArray(d.sol)||d.sol.length!==T) return null;
    if(!Array.isArray(d.notes)||d.notes.length!==T) return null;
    if(!Array.isArray(d.given)||d.given.length!==T) return null;
    if(!Array.isArray(d.undo)) return null;
    return d;
  }catch(err){ return null; }
}

function clearSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(err){} }

function resumeGame(){
  const d=loadSave();
  if(!d) return false;
  const m=MODES[d.diff];
  diff=d.diff;
  N=m.N; BW=m.BW; BH=m.BH; TOTAL=N*N; lives=m.lives;
  buildBoard(); buildNumpad();
  document.querySelectorAll('.diff').forEach(b=>b.classList.toggle('active', b.dataset.diff===diff));
  solution=d.sol.slice();
  givenArr=d.given.map(v=>!!v);
  boardVals=d.board.slice();
  notesArr=d.notes.map(a=>new Set(a));
  undoStack=d.undo.map(st=>({b:st.b.slice(), n:st.n.map(x=>new Set(x))}));
  mistakes=d.mistakes||0;
  hintsLeft=(typeof d.hints==='number')?d.hints:m.hints;
  selected=-1; noteMode=false;
  document.getElementById('btnNotes').classList.remove('active');
  document.getElementById('btnHint').style.opacity = hintsLeft>0?1:.45;
  hintBadge.textContent=hintsLeft;
  updateMistakes(); updateNumpad(); render();
  startTimer(d.sec||0);
  playing=true;
  return true;
}

/* подтверждение кнопки — мигаем сообщением в строке цитаты */
function flashSaved(){
  quoteEl.classList.add('fade');
  setTimeout(()=>{ quoteEl.textContent='Партия бережно записана'; quoteEl.classList.remove('fade'); },600);
  setTimeout(()=>{
    quoteEl.classList.add('fade');
    setTimeout(()=>{ quoteEl.textContent=QUOTES[quoteIdx]; quoteEl.classList.remove('fade'); },600);
  },3400);
}

/* кнопка «Сберечь» */
document.getElementById('btnSave').addEventListener('click',()=>{
  if(!playing) return;
  buzz(10); saveGame(); flashSaved();
});

/* сворачивание и закрытие — ВК убивает вебвью без предупреждения */
document.addEventListener('visibilitychange',()=>{ if(document.hidden) saveGame(); });
window.addEventListener('pagehide',()=>saveGame());
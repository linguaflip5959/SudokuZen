/* platform.js — VK Bridge, rewarded-реклама, дневной анлок Сложной, Worker с прегеном */

const DEBUG_REWARD=true; /* ⚠️ true = реклама «успешна» мгновенно. ТОЛЬКО для локальной проверки, перед публикацией вернуть false! */

/* ---------- VK Bridge ---------- */
function initPlatform(){
  if(typeof vkBridge!=='undefined'){
    try{ vkBridge.send('VKWebAppInit', {}); }catch(err){}
  }
}

/* ---------- rewarded-реклама ---------- */
function rewardAd(onSuccess){
  if(DEBUG_REWARD){ onSuccess(); return; }
  if(typeof vkBridge==='undefined'){ flashInfo('Сад спит — попробуйте позже'); return; }
  vkBridge.send('VKWebAppShowNativeAds', {ad_format:'reward'})
    .then(function(){ onSuccess(); })
    .catch(function(){ flashInfo('Сад спит — попробуйте позже'); });
}

/* ---------- дневной анлок Сложной ---------- */
const HARD_KEY='zen-sudoku-hard-day';
function todayStr(){
  const d=new Date();
  return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
}
function isHardUnlockedToday(){
  try{ return localStorage.getItem(HARD_KEY)===todayStr(); }catch(err){ return false; }
}
function unlockHard(){
  try{ localStorage.setItem(HARD_KEY, todayStr()); }catch(err){}
  updateHardLock();
}

/* ---------- генерация: Worker + преген ---------- */
let genWorker=null, genBusy=false;
let genCache=null; /* {diff, sol, puz} — сетка, сгенерированная прозапас */
try{
  genWorker=new Worker('js/worker.js');
}catch(err){ genWorker=null; } /* file:// — живём синхронно, как раньше */

function genPuzzle(cfg, cb){
  if(!genWorker||genBusy){
    setTimeout(function(){ cb(makePuzzleTask(cfg)); }, 60); /* лоадер успевает отрисоваться */
    return;
  }
  genBusy=true;
  genWorker.onmessage=function(e){ genBusy=false; cb(e.data); };
  genWorker.postMessage(cfg);
}
function precache(cfg){
  if(!genWorker||genBusy) return;
  genBusy=true;
  genWorker.onmessage=function(e){ genBusy=false; genCache=e.data; };
  genWorker.postMessage(cfg);
}
function popCache(cfg){
  if(genCache&&genCache.diff===cfg.diff){
    const c=genCache; genCache=null; return c;
  }
  return null;
}

/* ---------- всплывающая строка (дзэн-тост) ---------- */
function flashInfo(text){
  quoteEl.classList.add('fade');
  setTimeout(function(){ quoteEl.textContent=text; quoteEl.classList.remove('fade'); },600);
  setTimeout(function(){
    quoteEl.classList.add('fade');
    setTimeout(function(){ quoteEl.textContent=QUOTES[quoteIdx]; quoteEl.classList.remove('fade'); },600);
  },3400);
}
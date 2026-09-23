/* platform.js — VK Bridge, rewarded-реклама, дневной анлок Сложной, Worker с прегеном */

const DEBUG_REWARD=false; /* ⚠️ true = реклама «успешна» мгновенно. ТОЛЬКО для локальной проверки, перед публикацией вернуть false! */

/* резерв под нативный слой ВК: константа + различитель среды */
const TOP_SAFE=32;   /* высота нативной полосы ВК — проверено вашим же Nonograms */
function isVKClient(){
  try{
    /* клиент ВК дописывает в URL параметры запуска — старые api_id/viewer_id или новые vk_* */
    return /(^|[?&])(api_id|viewer_id|vk_app_id|vk_user_id|vk_platform)=/.test(location.search);
  }catch(err){ return true; }
}

/* ---------- VK Bridge ---------- */
/* служебные кнопки ВК (⋯ и ✕): применяем их отступы к CSS-переменным */
function applyInsets(insets){
  if(!insets) return;
  const st=document.documentElement.style;
  if(typeof insets.top==='number'&&insets.top>0) st.setProperty('--safe-top', insets.top+'px');
  if(typeof insets.bottom==='number'&&insets.bottom>0) st.setProperty('--safe-bot', insets.bottom+'px');
}
function initPlatform(){
  if(typeof vkBridge==='undefined') return;
  try{
    const vk=isVKClient();
    if(vk){ document.documentElement.style.setProperty('--safe-top', TOP_SAFE+'px'); }
    flashInfo(vk ? 'VK: отступ '+TOP_SAFE : 'браузер: без отступа'); /* ВРЕМЕННО — после победы удалить */
    vkBridge.subscribe(function(e){
      if(e.detail.type==='VKWebAppUpdateConfig'){
        const d=e.detail.data;
        applyInsets(d && d.insets);
      }
    });
    vkBridge.send('VKWebAppInit', {});
  }catch(err){}
}

/* ---------- rewarded-реклама ---------- */
function rewardAd(onSuccess){
  if(DEBUG_REWARD){ onSuccess(); return; }
  if(typeof vkBridge==='undefined'){ flashInfo('Сад спит — попробуйте позже'); return; }
  duckMusic(true);
  vkBridge.send('VKWebAppShowNativeAds', {ad_format:'reward'})
    .then(function(){ duckMusic(false); onSuccess(); })
    .catch(function(){ duckMusic(false); flashInfo('Сад спит — попробуйте позже'); });
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

/* ландшафт-замок: активен только когда есть живая партия */
function updateRotateLock(){
  const el=document.getElementById('rotate-lock');
  if(!el) return;
  el.classList.toggle('active', playing);
}
setInterval(updateRotateLock, 1000);
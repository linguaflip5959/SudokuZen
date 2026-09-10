'use strict';
/* ============ утилиты / состояние ============ */
const $=s=>document.querySelector(s);
const fmt=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
const mulberry32=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const shuf=(a,r=Math.random)=>{for(let i=a.length-1;i>0;i--){const j=(r()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const DIFFS={easy:{name:'Легко',clues:41,mult:1,xp:50},medium:{name:'Средне',clues:34,mult:1.5,xp:100},
 hard:{name:'Сложно',clues:29,mult:2,xp:200},expert:{name:'Эксперт',clues:25,mult:2.5,xp:350}};
const state={diff:'hard',daily:false,puzzle:Array(81).fill(0),solution:Array(81).fill(0),current:Array(81).fill(0),notes:Array(81).fill(0),
 mistakes:0,hints:3,time:0,score:0,combo:0,selected:-1,notesMode:false,started:false,paused:false,over:false};
let history=[],redoStack=[];
let lvl=+(localStorage.getItem('sud_lvl')||42),xp=+(localStorage.getItem('sud_xp')||0);
const rank=l=>l>=60?'Гроссмейстер':l>=40?'Мастер':l>=25?'Эксперт':l>=10?'Адепт':'Новичок';
let playerName='Ты';
let adAvailable=false,adLoading=false;
/* ссылка на сцену и флаг эффектов (общие для всех модулей) */
let S=null,fxOn=localStorage.getItem('sud_fx')!=='0';

/* VK Bridge инициализация */
if(window.VKBridge){try{
  VKBridge.send('VKWebAppInit').catch(()=>{});
  VKBridge.send('VKWebAppGetUserInfo').then(u=>{if(u&&u.first_name)playerName=(u.first_name+' '+(u.last_name||'')).trim();}).catch(()=>{});
  // Проверяем доступность рекламы
  VKBridge.send('VKWebAppCheckNativeAds').then(r=>{adAvailable=!!r.result;}).catch(()=>{adAvailable=false;});
}catch(e){}}

const vkScore=s=>{if(window.VKBridge){try{VKBridge.send('VKWebAppLeaderboardSetScore',{score:s}).catch(()=>{});}catch(e){}}};

/* Функция показа рекламы */
function showRewardedAd(){
  if(!window.VKBridge||!adAvailable||adLoading)return Promise.resolve(false);
  adLoading=true;
  $('#adWatch').disabled=true;
  $('#adWatch span').innerHTML='<span class="ad-loading"></span> Загрузка...';
  
  return new Promise((resolve)=>{
    VKBridge.send('VKWebAppShowNativeAds',{ad_format:'reward'})
      .then(result=>{
        adLoading=false;
        $('#adWatch').disabled=false;
        $('#adWatch span').textContent='Посмотреть рекламу';
        if(result&&result.result){
          resolve(true);
        }else{
          resolve(false);
        }
      })
      .catch(err=>{
        adLoading=false;
        $('#adWatch').disabled=false;
        $('#adWatch span').textContent='Посмотреть рекламу';
        console.warn('Ad error:',err);
        resolve(false);
      });
  });
}

function showToast(msg,err=false){
  const t=$('#toast');
  t.textContent=msg;
  t.classList.toggle('err',err);
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

/* ============ лидеры ============ */
const BOTS=[['Кэндзи',47],['Хироши',39],['Сакура-сан',33],['Старец Ли',52],['Юки',28],['Тануки',21],['Мэйко',44],['Дзен-бот',61],['Акира',35]];
function mkBots(t){const base={easy:6000,medium:8200,hard:10400,expert:12600,day:9600}[t];
 return BOTS.map((b,i)=>({n:b[0],l:b[1],s:base+((i*977)%3400),t:280+((i*137)%560)}));}
function loadLB(t){try{const st=JSON.parse(localStorage.getItem('sud_lb3')||'{}');
 if(!st[t]){st[t]=mkBots(t);localStorage.setItem('sud_lb3',JSON.stringify(st));}return st[t];}catch(e){return mkBots(t);}}
function pushLB(t,e){try{const st=JSON.parse(localStorage.getItem('sud_lb3')||'{}');
 const a=(st[t]||mkBots(t));a.push(e);a.sort((x,y)=>y.s-x.s);st[t]=a.slice(0,10);
 localStorage.setItem('sud_lb3',JSON.stringify(st));}catch(err){}}
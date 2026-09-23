/* audio.js — звук и музыка: чистый синтез Web Audio, ноль файлов */

const SKEY='zen-sudoku-sound', MKEY='zen-sudoku-music';
function soundOn(){ try{ return localStorage.getItem(SKEY)!=='0'; }catch(err){ return true; } }
function musicOn(){ try{ return localStorage.getItem(MKEY)!=='0'; }catch(err){ return true; } }

let AC=null, master=null, musicGain=null, musicTimer=null, audioReady=false;
let musicAudio=null, trackIdx=0, kotoTimer=null;

function initAudio(){
  if(AC) return;
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    master=AC.createGain(); master.gain.value=.9; master.connect(AC.destination);
    musicGain=AC.createGain(); musicGain.gain.value=.22; musicGain.connect(master);
    audioReady=true;
    if(musicOn()) startMusic();
  }catch(err){}
}
/* первый жест игрока — разблокировка автоплея */
document.addEventListener('pointerdown',function once(){
  initAudio();
  if(AC&&AC.state==='suspended') AC.resume();
  if(musicOn()&&musicAudio&&musicAudio.paused) musicAudio.play().catch(function(){});
  document.removeEventListener('pointerdown',once);
},{passive:true});

/* нота: щипок струны */
function pluck(freq,when,dur,vol,type){
  if(!audioReady||!soundOn()) return;
  const t=AC.currentTime+when;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type=type||'sine'; o.frequency.value=freq;
  g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(vol||.3,t+.012);
  g.gain.exponentialRampToValueAtTime(.001,t+(dur||.5));
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t+(dur||.5)+.05);
}

/* пентатоника ля-минор, три регистра — «капли по камню» */
const SCALE=[220,246.9,293.7,329.6,392,440,493.9,587.3,659.3,784];

function sfxTap(){ pluck(SCALE[(Math.random()*5)|0],0,.28,.16,'triangle'); }
function sfxPlace(){ pluck(SCALE[5+((Math.random()*3)|0)],0,.35,.22,'triangle'); }
function sfxError(){
  pluck(110,0,.5,.3,'sine'); pluck(104,0,.5,.2,'sine');
}
function sfxWin(){
  const seq=[0,2,4,5,7];
  for(let k=0;k<5;k++){ pluck(SCALE[seq[k]]*2,k*.13,.5,.24,'triangle'); }
}

/* генеративное кото: редкие ноты, никогда не повторяется */
/* музыка: mp3-плейлист с фолбэком на синтез-кото */
const TRACKS=['music/1.mp3','music/2.mp3','music/3.mp3'];

function startMusic(){
  if(!musicOn()||musicTimer) return;
  try{
    if(!musicAudio){
      musicAudio=new Audio();
      musicAudio.loop=true;
      musicAudio.volume=.22;
      musicAudio.addEventListener('ended',function(){
        /* смена трека — вечная ротация трёх мелодий */
        trackIdx=(trackIdx+1)%TRACKS.length;
        musicAudio.src=TRACKS[trackIdx];
        if(musicOn()) musicAudio.play().catch(function(){ startKoto(); });
      });
    }
    trackIdx=(Math.random()*TRACKS.length)|0;
    musicAudio.src=TRACKS[trackIdx];
    musicAudio.play().catch(function(){
      /* mp3 не смог (нет файла/автоплей запрещён) — кото подхватывает */
      startKoto();
    });
    /* если через секунду mp3 так и не заиграл (тихий отказ) — кото подхватывает */
    setTimeout(function(){
      if(musicOn()&&musicAudio.paused) startKoto();
    },1200);
  }catch(err){
    startKoto();
  }
}

function startKoto(){
  if(!audioReady||kotoTimer) return;
  const note=function(){
    if(!musicOn()) return;
    if(musicAudio&&!musicAudio.paused&&musicAudio.currentTime>0.05) return; /* mp3 заиграл — кото молчит */
    if(!AC) return;
    const t=AC.currentTime;
    const o=AC.createOscillator(), g=AC.createGain();
    o.type='sine'; o.frequency.value=SCALE[2+((Math.random()*(SCALE.length-2))|0)];
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(.5,t+2.2);
    g.gain.exponentialRampToValueAtTime(.001,t+4.5);
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t+4.7);
    kotoTimer=setTimeout(note,(4000+Math.random()*5000));
  };
  note();
}

function stopMusic(){
  if(kotoTimer) clearTimeout(kotoTimer);
  kotoTimer=null;
  if(musicTimer) clearTimeout(musicTimer);
  musicTimer=null;
  if(musicAudio){ musicAudio.pause(); }
}

function toggleSound(){ try{ localStorage.setItem(SKEY,soundOn()?'0':'1'); }catch(err){} updateSettingsUI(); }
function toggleMusic(){
  try{ localStorage.setItem(MKEY,musicOn()?'0':'1'); }catch(err){}
  if(musicOn()){ initAudio(); startMusic(); } else { stopMusic(); }
  updateSettingsUI();
}
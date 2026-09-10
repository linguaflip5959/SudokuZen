'use strict';
/* ============ метрики (компактно, VK) ============ */
function metrics(W,H){
 const hud=50,st=24,pad=56,act=42;
 if(W>H*1.15&&W>680){const S=Math.min(H-hud-st-26,W*.54);return{mode:'L',hud,S,bx:12,by:hud+st+10,px:12+S+14,pw:W-(12+S+14)-12};}
 const S=Math.max(220,Math.min(W-14,H-(hud+st+pad+act+46)));
 return{mode:'P',hud,S,bx:(W-S)/2,by:hud+st+12,pw:W-20,px:10,pad,act};
}

/* ============ СЦЕНА PHASER: интерфейс и рендер ============ */
/* эффекты (tex, bg, setFx, fireBeams, pop, shake) вынесены в effects.js */
class Scene extends Phaser.Scene{
 create(){S=this;const W=this.scale.width,H=this.scale.height,M=this.M=metrics(W,H);
  this.tex();this.bg(W,H);this.ui(W,H,M);this.render();
  if(state.paused)this.setPaused(true);
  this.scale.on('resize',()=>{clearTimeout(this._rz);this._rz=setTimeout(()=>this.scene.restart(),220);});
 }
 ui(W,H,M){
  const T=(x,y,s,st)=>this.add.text(x,y,s,st).setOrigin(.5);
  const gold={fontFamily:'Cormorant, serif',color:'#f5d77a'};
  /* HUD */
  const av=this.add.circle(26,M.hud/2,15,0x241a2c).setStrokeStyle(2,0xd9b45b,.9).setDepth(10);
  const face=this.add.graphics().setDepth(11);
  face.fillStyle(0xe7c6a4,1).fillCircle(26,M.hud/2-2,6);face.fillStyle(0xe5e7eb,1).fillEllipse(26,M.hud/2+5,10,8);
  face.fillStyle(0x9ca3af,1).fillCircle(26,M.hud/2-9,3);
  this.tLvl=T(48,M.hud/2-6,'Ур. '+lvl,{fontSize:'11px',fontWeight:'800',color:'#f2ead8'}).setOrigin(0,.5);
  this.tRank=T(48,M.hud/2+7,rank(lvl),{fontSize:'9px',fontWeight:'800',color:'#2a1c05'}).setOrigin(0,.5);
  this.rankBg=this.add.rectangle(0,0,10,10,0xd9b45b,1).setOrigin(0,.5).setDepth(9);
  this.tTitle=T(W/2,M.hud/2,'Судоку: Путь Мастера',{...gold,fontSize:W<430?'13px':'17px',fontWeight:'700'}).setDepth(10).setAlpha(W<380?0:1);
  const btn=(x,draw,cb)=>{const c=this.add.circle(x,M.hud/2,14,0xffffff,.07).setStrokeStyle(1,0xffffff,.16).setDepth(10).setInteractive();
   const g=this.add.graphics().setDepth(11);draw(g,x,M.hud/2);c.on('pointerdown',()=>{audio();cb();});
   c.on('pointerover',()=>c.setFillStyle(0xd9b45b,.2));c.on('pointerout',()=>c.setFillStyle(0xffffff,.07));return{c,g};};
  this.pauseBtn=btn(W-118,g=>{},()=>{if(!anyModal())setPaused(!state.paused);});
  this.pauseIco=this.add.graphics().setDepth(11);
  btn(W-86,g=>{g.lineStyle(2,0xe8e2d2,1);g.strokeCircle(0,0,5);for(let i=0;i<4;i++){const a=i*Math.PI/2;g.lineBetween(Math.cos(a)*5,Math.sin(a)*5,Math.cos(a)*8,Math.sin(a)*8);}},openMenu);
  btn(W-54,g=>{g.fillStyle(0xe8e2d2,1);g.fillRect(-6,-1,3,8);g.fillRect(-1,-5,3,12);g.fillRect(4,-3,3,10);},openLB);
  this.dayBtn=btn(W-22,g=>{g.fillStyle(0xfdba74,1);g.fillTriangle(0,-7,5,2,-5,2);g.fillCircle(0,3,5);g.fillStyle(0xfef3c7,1).fillCircle(0,3,2);},openDaily);
  this.dayDot=this.add.circle(W-14,M.hud/2-8,3,0xf472b6,1).setDepth(12);
  /* статистика */
  const sy=M.hud+st2(M)/2;function st2(M){return 24;}
  this.tTime=T(16,sy,'',{fontSize:'13px',fontWeight:'800',color:'#fff'}).setOrigin(0,.5).setDepth(10);
  this.hearts=[0,1,2].map(i=>T(96+i*16,sy,'♥',{fontSize:'14px',color:'#ef4444'}).setDepth(10));
  this.tScore=T(160,sy,'',{fontSize:'13px',fontWeight:'800',color:'#f5d77a'}).setOrigin(0,.5).setDepth(10);
  this.tDiff=T(W-70,sy,'',{fontSize:'10px',fontWeight:'800'}).setOrigin(1,.5).setDepth(10);
  this.progBg=this.add.rectangle(W-38,sy,56,6,0xffffff,.12).setDepth(10);
  this.progFill=this.add.rectangle(W-66,sy,0,6,0x67e8f9,1).setOrigin(0,.5).setDepth(11);
  /* доска: единый источник координат — сетка рисуется ПО клеткам */
  const cell=M.S/9,bx=M.bx,by=M.by;this.cell=cell;
  const fr=this.add.graphics().setDepth(5);
  fr.fillStyle(0x170f08,1).fillRect(bx-10,by-10,M.S+20,M.S+20);
  fr.lineStyle(3,0x8a6a25,1).strokeRect(bx-13,by-13,M.S+26,M.S+26);
  fr.lineStyle(1,0xf5d77a,.7).strokeRect(bx-16,by-16,M.S+32,M.S+32);
  const rr2=mulberry32(99);
  fr.lineStyle(1,0x67e8f9,.7);
  for(let i=0;i<34;i++){const t=i/34,p=t*(M.S+26);
   fr.lineBetween(bx-13+p,by-19,bx-13+p+(rr2()-.5)*4,by-19-(2+rr2()*4));
   fr.lineBetween(bx-13+p,by+M.S+19,bx-13+p+(rr2()-.5)*4,by+M.S+19+(2+rr2()*4));}
  fr.lineStyle(1,0xe8c56a,.7);
  for(let i=0;i<34;i++){const p=i/34*(M.S+26);
   fr.lineBetween(bx-19,by-13+p,bx-19-(2+rr2()*4),by-13+p+(rr2()-.5)*4);
   fr.lineBetween(bx+M.S+19,by-13+p,bx+M.S+19+(2+rr2()*4),by-13+p+(rr2()-.5)*4);}
  this.cellBg=[];this.vals=[];this.nots=[];
  for(let i=0;i<81;i++){
   const r=(i/9)|0,c=i%9,x=bx+c*cell,y=by+r*cell;
   const bg=this.add.rectangle(x+cell/2,y+cell/2,cell,cell,0x67e8f9,0).setDepth(6).setInteractive();
   bg.on('pointerdown',()=>{if(!state.started||state.paused||state.over)return;audio();state.selected=i;this.render();sTick();});
   this.cellBg.push(bg);
   this.vals.push(T(x+cell/2,y+cell/2,'',{...gold,fontSize:cell*.62+'px',fontWeight:'600',color:'#f6f8fb'}).setDepth(8));
   this.nots.push(T(x+cell/2,y+cell/2,'',{fontFamily:'"Courier New", monospace',fontSize:cell*.21+'px',fontWeight:'700',color:'#8fb7c4',lineSpacing:cell*.06}).setDepth(8));
  }
  this.grid=this.add.graphics().setDepth(7);
  for(let k=1;k<9;k++){const th=k%3===0;
   this.grid.lineStyle(th?5:3,th?0xd9b45b:0x67e8f9,th?.22:.16);
   this.grid.lineBetween(bx+k*cell,by,bx+k*cell,by+M.S);this.grid.lineBetween(bx,by+k*cell,bx+M.S,by+k*cell);
   this.grid.lineStyle(th?2:1,th?0xd9b45b:0x67e8f9,th?.95:.75);
   this.grid.lineBetween(bx+k*cell,by,bx+k*cell,by+M.S);this.grid.lineBetween(bx,by+k*cell,bx+M.S,by+k*cell);}
  this.ring=this.add.rectangle(0,0,cell,cell).setStrokeStyle(2,0xf5d77a,1).setDepth(9).setVisible(false);
  /* панель цифр + действия */
  this.padG=[];this.padDots=[];this.padSel=[];
  const py=M.mode==='P'?by+M.S+10+M.pad/2:M.by+150,pR=M.mode==='P'?Math.min((W-20)/9*.44,M.pad/2-2):24;
  for(let d=1;d<=9;d++){
   let x,y;
   if(M.mode==='P'){x=M.px+10+(d-1)*((M.pw-20)/8)+ ( (M.pw-20)/8 -0)/2 - ((M.pw-20)/8)/2 + ((M.pw-20)/8)*(0);x=M.px+(d-.5)*(M.pw/9);y=py;}
   else{const cc=(d-1)%3,rr3=((d-1)/3)|0;x=M.px+M.pw/2+(cc-1)*56;y=M.by+150+rr3*54;}
   const c=this.add.circle(x,y,pR,0x140c18,1).setStrokeStyle(1,0xd9b45b,.45).setDepth(10).setInteractive();
   const t=T(x,y-4,d+'',{...gold,fontSize:pR*1.05+'px',fontWeight:'700'}).setDepth(11);
   const dg=this.add.graphics().setDepth(11);
   const sel=this.add.circle(x,y,pR+2).setStrokeStyle(2,0xf5d77a,1).setDepth(9).setVisible(false);
   c.on('pointerdown',()=>{audio();inputDigit(d);});
   c.on('pointerover',()=>c.setFillStyle(0x2a1c2c,1));c.on('pointerout',()=>c.setFillStyle(0x140c18,1));
   this.padG.push({c,t,dg,sel,x,y,r:pR});
  }
  this.acts=[];
  const acts=[['↶','Отмена',()=>undo()],['↷','Повтор',()=>redo()],['⌫','Стереть',()=>eraseCell()],['✎','Заметки',()=>toggleNotes()],['💡','Подсказка',()=>useHint()]];
  const ay=M.mode==='P'?py+M.pad/2+6+M.act/2:H-27,aW=(M.mode==='P'?M.pw:M.pw)/5;
  acts.forEach((a,i)=>{
   const x=(M.mode==='P'?M.px:M.px)+aW*(i+.5),y=ay;
   const hit=this.add.rectangle(x,y,aW-5,M.act-4,0xffffff,.05).setStrokeStyle(1,0xffffff,.1).setDepth(10).setInteractive();
   const ic=T(x,y-7,a[0],{fontSize:'15px',color:'#efe9da'}).setDepth(11);
   const lb=T(x,y+10,a[1],{fontSize:'8.5px',fontWeight:'800',color:'#b9c0d9'}).setDepth(11);
   hit.on('pointerdown',()=>{audio();a[2]();});
   hit.on('pointerover',()=>hit.setFillStyle(0xd9b45b,.15));hit.on('pointerout',()=>hit.setFillStyle(0xffffff,.05));
   this.acts.push({hit,ic,lb,i});
  });
  /* Кнопка "Получить подсказку за рекламу" */
  this.adBtnG=this.add.graphics().setDepth(12);
  const adX=(M.mode==='P'?M.px:M.px)+aW*5.5,adY=ay;
  this.adBtnHit=this.add.rectangle(adX,adY,aW-5,M.act-4,0x34d399,.12).setStrokeStyle(1,0x34d399,.5).setDepth(12).setInteractive().setVisible(adAvailable);
  this.adBtnIco=T(adX,adY-7,'🎬',{fontSize:'15px'}).setDepth(13);
  this.adBtnLb=T(adX,adY+10,'+1 Подсказка',{fontSize:'8px',fontWeight:'800',color:'#6ee7b7'}).setDepth(13);
  this.adBtnHit.on('pointerdown',()=>{audio();openAdModal();});
  this.adBtnHit.on('pointerover',()=>this.adBtnHit.setFillStyle(0x34d399,.25));
  this.adBtnHit.on('pointerout',()=>this.adBtnHit.setFillStyle(0x34d399,.12));
  
  this.hintBadge=T(0,0,'',{fontSize:'9px',fontWeight:'800',color:'#2a1c05'}).setDepth(12);
  this.hintBg=this.add.circle(0,0,8,0xf5d77a,1).setDepth(11);
  /* пауза */
  this.pauseC=this.add.container(0,0).setDepth(30).setVisible(false);
  const pr=this.add.rectangle(W/2,H/2,W,H,0x08050c,.72).setInteractive();
  const pt=T(W/2,H/2-10,'ПАУЗА',{...gold,fontSize:'30px',fontWeight:'700'});
  const ps=T(W/2,H/2+22,'нажми, чтобы продолжить',{fontSize:'11px',fontWeight:'700',color:'#a89f8d'});
  this.pauseC.add([pr,pt,ps]);pr.on('pointerdown',()=>{audio();setPaused(false);});
 }
 render(){
  if(!this.cellBg)return;
  const cur=state.current,sel=state.selected,selVal=sel>=0?cur[sel]:0,M=this.M,cell=this.cell;
  const pm=sel>=0?PMASK[sel]:null,conf=new Uint8Array(81);
  for(let i=0;i<81;i++){const v=cur[i];if(!v)continue;for(const j of PEERS[i])if(j>i&&cur[j]===v){conf[i]=1;conf[j]=1;}}
  for(let i=0;i<81;i++){
   const bg=this.cellBg[i],v=cur[i],given=state.puzzle[i]!==0;
   let col=0x67e8f9,al=0;
   if(conf[i]){col=0xef4444;al=.15;}else if(i===sel){col=0xf5d77a;al=.17;}
   else if(selVal&&v===selVal){col=0xf5d77a;al=.13;}else if(pm&&pm[i]){col=0x67e8f9;al=.06;}
   bg.setFillStyle(col,al);
   const vt=this.vals[i];vt.setText(v?String(v):'');
   vt.setColor(conf[i]||(v&&!given&&v!==state.solution[i])?'#ff8296':given?'#f6f8fb':'#f5d77a');
   const m=state.notes[i];let ns='';
   if(!v&&m){for(let r=0;r<3;r++){let line='';for(let c=0;c<3;c++){const on=m&(1<<(r*3+c));line+=(on?String(r*3+c+1):' ')+(c<2?' ':'');}ns+=line+(r<2?'\n':'');}}
   this.nots[i].setText(ns);
  }
  if(sel>=0){const r=(sel/9)|0,c=sel%9;this.ring.setPosition(M.bx+c*cell+cell/2,M.by+r*cell+cell/2).setVisible(true);}
  else this.ring.setVisible(false);
  const cnt=Array(10).fill(0);cur.forEach(v=>v&&cnt[v]++);
  for(let d=1;d<=9;d++){const p=this.padG[d-1],rem=9-cnt[d];
   p.c.setAlpha(rem<=0?.3:1);p.t.setAlpha(rem<=0?.3:1);p.dg.setAlpha(rem<=0?.3:1);
   p.sel.setVisible(selVal===d);
   p.dg.clear();p.dg.fillStyle(0x67e8f9,1);
   for(let k=0;k<rem;k++)p.dg.fillCircle(p.x-(rem-1)*3+k*6,p.y+p.r*.52,1.6);}
  this.acts.forEach(a=>{
   if(a.i===3){a.hit.setStrokeStyle(1,state.notesMode?0x67e8f9:0xffffff,state.notesMode?.9:.1);a.ic.setColor(state.notesMode?'#67e8f9':'#efe9da');}
   if(a.i===4){a.hit.setAlpha(state.hints>0?1:.35);
    this.hintBg.setPosition(a.hit.x+a.hit.width/2-6,a.hit.y-a.hit.height/2+4).setVisible(state.hints>0);
    this.hintBadge.setPosition(a.hit.x+a.hit.width/2-6,a.hit.y-a.hit.height/2+4).setText(String(state.hints)).setVisible(state.hints>0);}
   if(a.i<2)a.hit.setAlpha((a.i===0?history.length:redoStack.length)?1:.35);
  });
  /* Показываем кнопку рекламы если подсказки кончились и реклама доступна */
  const showAd=adAvailable&&state.hints<=0&&state.started&&!state.over;
  this.adBtnHit.setVisible(showAd);this.adBtnIco.setVisible(showAd);this.adBtnLb.setVisible(showAd);
  
  this.tTime.setText('⏱ '+fmt(state.time));
  this.hearts.forEach((h,i)=>h.setColor(i<state.mistakes?'#57534e':'#ef4444'));
  this.tScore.setText('✦ '+state.score.toLocaleString('ru-RU'));
  const D=DIFFS[state.daily?'hard':state.diff];
  this.tDiff.setText((state.daily?'☀ ':'')+D.name).setColor(state.daily?'#fdba74':{easy:'#6ee7b7',medium:'#7dd3fc',hard:'#fdba74',expert:'#fca5a5'}[state.daily?'hard':state.diff]);
  let ok=0;for(let i=0;i<81;i++)if(cur[i]&&cur[i]===state.solution[i])ok++;
  const w=Math.round(ok/81*56);this.progFill.width=w;this.progFill.x=this.progBg.x-28;
  this.tLvl.setText('Ур. '+lvl);this.tRank.setText(rank(lvl));
  const rw=this.tRank.width+12;this.rankBg.setPosition(this.tRank.x-1,this.tRank.y).setSize(rw,13);
  this.dayDot.setVisible(todayKey()!== (JSON.parse(localStorage.getItem('sud_dayst')||'null')||{}).last);
  this.pauseIco.clear();const px=this.pauseBtn.c.x,pyy=this.pauseBtn.c.y;
  this.pauseIco.fillStyle(0xe8e2d2,1);
  if(state.paused)this.pauseIco.fillTriangle(px-4,pyy-6,px-4,pyy+6,px+6,pyy);
  else{this.pauseIco.fillRect(px-5,pyy-6,3,12);this.pauseIco.fillRect(px+1,pyy-6,3,12);}
 }
 setPaused(p){this.pauseC&&this.pauseC.setVisible(p);this.render();}
}
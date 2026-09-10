/* generator.js — генератор судоку; без DOM: работает и на странице, и в Web Worker */
function makePuzzleTask(cfg){
  const N=cfg.N, BW=cfg.BW, BH=cfg.BH, TOTAL=N*N, HOLES=cfg.holes;
  function shuffleArr(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function placeOk(g,i,v){
    const r=(i/N)|0, c=i%N;
    for(let k=0;k<N;k++){ if(g[r*N+k]===v||g[k*N+c]===v) return false; }
    const br=((r/BH)|0)*BH, bc=((c/BW)|0)*BW;
    for(let x=br;x<br+BH;x++)for(let y=bc;y<bc+BW;y++){ if(g[x*N+y]===v) return false; }
    return true;
  }
  function fillGrid(g){
    for(let i=0;i<TOTAL;i++){
      if(g[i]===0){
        const nums=shuffleArr(Array.from({length:N},(_,k)=>k+1));
        for(let q=0;q<N;q++){
          const v=nums[q];
          if(placeOk(g,i,v)){ g[i]=v; if(fillGrid(g)) return true; g[i]=0; }
        }
        return false;
      }
    }
    return true;
  }
  function countSols(g,limit){
    let best=-1, bestCnt=N+1;
    for(let i=0;i<TOTAL;i++){
      if(g[i]===0){
        let cnt=0;
        for(let v=1;v<=N;v++){ if(placeOk(g,i,v)) cnt++; }
        if(cnt<bestCnt){ best=i; bestCnt=cnt; if(cnt<=1) break; }
      }
    }
    if(best<0) return 1;
    if(bestCnt===0) return 0;
    let cnt=0;
    for(let v=1;v<=N;v++){
      if(placeOk(g,best,v)){ g[best]=v; cnt+=countSols(g,limit); g[best]=0; if(cnt>=limit) break; }
    }
    return cnt;
  }
  const sol=new Array(TOTAL).fill(0);
  fillGrid(sol);
  const puz=sol.slice();
  const order=shuffleArr(Array.from({length:TOTAL},(_,k)=>k));
  let removed=0;
  for(let q=0;q<TOTAL&&removed<HOLES;q++){
    const idx=order[q], v=puz[idx];
    puz[idx]=0;
    const test=puz.slice();
    if(countSols(test,2)===1){ removed++; } else { puz[idx]=v; }
  }
  return {diff:cfg.diff, sol:sol, puz:puz};
}
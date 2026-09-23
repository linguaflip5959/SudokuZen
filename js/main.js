/* main.js */
(function(){
  try{ if(localStorage.getItem('zen-sudoku-theme')==='dark') document.documentElement.setAttribute('data-theme','dark'); }catch(err){}
})();
initPlatform();
if(!resumeGame()) newGame('easy');
updateHardLock();

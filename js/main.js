/* main.js — точка входа: платформа → согласие (первый вход) → партия или новая игра */
initPlatform();
const startApp=function(){
  if(!resumeGame()) newGame('easy');
  updateHardLock();
};
if(hasConsent()) startApp(); else showConsent(startApp);
/* main.js — точка входа: платформа, замок Сложной, продолжение прерванной партии */
initPlatform();
updateHardLock();
if(!resumeGame()) newGame('medium');
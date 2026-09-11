/* main.js — точка входа: платформа, замок Сложной (учитывает сейв), продолжение партии или новая на Лёгкой */
initPlatform();
if(!resumeGame()) newGame('easy');
updateHardLock();
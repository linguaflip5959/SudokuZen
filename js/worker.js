/* worker.js — генерация сетки в фоне */
importScripts('generator.js');
onmessage=function(e){ postMessage(makePuzzleTask(e.data)); };
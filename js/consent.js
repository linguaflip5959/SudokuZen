/* consent.js — согласие с условиями при первом запуске (требование модерации ВК) */

const CONSENT_KEY='zen-sudoku-consent-v1';

function hasConsent(){
  try{ return localStorage.getItem(CONSENT_KEY)==='1'; }catch(err){ return false; }
}

function showConsent(onAccept){
  const el=document.getElementById('consent');
  const note=document.getElementById('consentNote');
  el.classList.remove('hidden');

  /* открытие документа: window.open с фолбэком-заметкой */
  const openDoc=function(url){
    let w=null;
    try{ w=window.open(url, '_blank'); }catch(err){}
    if(!w){ note.textContent='Не удалось открыть — ссылки есть в описании приложения'; }
  };
  el.querySelectorAll('.consent-link').forEach(function(a){
    a.addEventListener('click',function(e){
      e.preventDefault(); buzz(8); openDoc(a.href);
    });
  });

  document.getElementById('btnConsentOk').addEventListener('click',function(){
    try{ localStorage.setItem(CONSENT_KEY,'1'); }catch(err){}
    el.classList.add('hidden');
    buzz(12);
    onAccept();
  });
  document.getElementById('btnConsentNo').addEventListener('click',function(){
    note.textContent='Без принятия условий сад закрыт';
    buzz([30,40,30]);
  });
}
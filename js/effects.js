/* effects.js — эффекты: вибрация, цитаты, лепестки */

function buzz(ms) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch (err) {}
  }
}

/* ================= атмосфера ================= */
const QUOTES = [
  "«Тишина пустой клетки — тоже ответ.»",
  "«Цифра приходит сама, когда ум спокоен.»",
  "«Девять квадратов, один путь.»",
  "«Не спеши: сад не растёт быстрее от тревоги.»",
  "«Дождь за окном и чай на столе — партия уже выиграна.»",
];
let quoteIdx = 0;
quoteEl.textContent = QUOTES[0];
setInterval(() => {
  quoteEl.classList.add("fade");
  setTimeout(() => {
    quoteIdx = (quoteIdx + 1) % QUOTES.length;
    quoteEl.textContent = QUOTES[quoteIdx];
    quoteEl.classList.remove("fade");
  }, 600);
}, 14000);

const petalsBox = document.getElementById("petals");
for (let p = 0; p < 12; p++) {
  const sp = document.createElement("span");
  sp.className = "petal";
  const dur = 9 + Math.random() * 10;
  sp.style.left = Math.random() * 100 + "%";
  sp.style.animationDuration = dur + "s";
  sp.style.animationDelay = -Math.random() * dur + "s";
  sp.style.setProperty("--dx", ((Math.random() * 180 - 90) | 0) + "px");
  const sc = 0.55 + Math.random() * 0.8;
  sp.style.width = 12 * sc + "px";
  sp.style.height = 10 * sc + "px";
  petalsBox.appendChild(sp);
}

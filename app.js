// Фейковые данные для теста, потом заменим на API ESP32
let pumps = [0, 0, 0, 0, 0];
let autoMode = false;
let moistureLevels = [42, 35, 61, 28, 55];
let battery = 78;
let water = 73; // в процентах

function updateUI() {
  document.getElementById('battery').innerText = battery;
  document.getElementById('water').innerText = water;
  moistureLevels.forEach((val, i) => {
    document.querySelector(`#plant${i+1} .moisture`).innerText = val;
  });
}

function togglePump(id) {
  // Вручную включаем насос, максимум 30 секунд (таймер на ESP32)
  pumps[id-1] = pumps[id-1] ? 0 : 1;
  alert("Насос " + id + " → " + (pumps[id-1] ? "ВКЛ" : "ВЫКЛ"));
  // В будущем: fetch(`/api/pump/${id}/toggle`)
}

function toggleAutoMode() {
  autoMode = document.getElementById('autoMode').checked;
  alert("Автоматический режим → " + (autoMode ? "ВКЛ" : "ВЫКЛ"));
  // В будущем: fetch(`/api/mode/${autoMode ? 'auto' : 'manual'}`)
}

// Инициализация
updateUI();

// Регистрация service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

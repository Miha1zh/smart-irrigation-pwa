// Фейковые данные для теста, потом заменим на API ESP32
let pumps = [0, 0, 0, 0, 0];
let autoMode = false;
let moistureLevels = [42, 35, 61, 28, 55];
let battery = 99;
let water = 73; // в процентах

// ---- Модальное окно ----
const modal = document.getElementById('appModal');
const modalText = document.getElementById('modalText');
const modalOk = document.getElementById('modalOk');
const modalCancel = document.getElementById('modalCancel');

function showModal(message, onOk, onCancel) {
  modalText.textContent = message;
  modal.style.display = 'flex';

  modalOk.onclick = () => {
    modal.style.display = 'none';
    if (onOk) onOk();
  };

  modalCancel.onclick = () => {
    modal.style.display = 'none';
    if (onCancel) onCancel();
  };
}

// ---- UI обновление ----
function updateUI() {
  document.getElementById('battery').innerText = battery;
  document.getElementById('water').innerText = water;
  moistureLevels.forEach((val, i) => {
    document.querySelector(`#plant${i+1} .moistureLevels`).innerText = val;
  });
}

// ---- Управление насосами через модалку ----
function togglePumpModal(id) {
  const currentState = pumps[id-1];
  const action = currentState ? "Выключить" : "Включить";

  showModal(`${action} насос №${id}?`, () => {
    pumps[id-1] = currentState ? 0 : 1;
    console.log(`Насос ${id} → ${pumps[id-1] ? "ВКЛ" : "ВЫКЛ"}`);
    updateUI();
    // TODO: fetch(`/api/pump/${id}/toggle`)
  });
}

// ---- Управление авто/ручной режим ----
function toggleAutoModeModal() {
  const newMode = !autoMode;
  showModal(`Переключить автоматический режим → ${newMode ? "ВКЛ" : "ВЫКЛ"}?`, () => {
    autoMode = newMode;
    document.getElementById('autoMode').checked = autoMode;
    console.log("Автоматический режим → " + (autoMode ? "ВКЛ" : "ВЫКЛ"));
    // TODO: fetch(`/api/mode/${autoMode ? 'auto' : 'manual'}`)
  });
}

// ---- Регистрация обработчиков кнопок насосов ----
document.getElementById('pump1Btn').onclick = () => togglePumpModal(1);
document.getElementById('pump2Btn').onclick = () => togglePumpModal(2);
document.getElementById('pump3Btn').onclick = () => togglePumpModal(3);
document.getElementById('pump4Btn').onclick = () => togglePumpModal(4);
document.getElementById('pump5Btn').onclick = () => togglePumpModal(5);

// ---- Переключатель авто/ручной режим ----
document.getElementById('autoMode').onclick = toggleAutoModeModal;

// ---- Инициализация ----
updateUI();

// ---- Регистрация service worker ----
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}





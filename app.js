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
// Модальное окно
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

function togglePump(id) {
  // Вручную включаем насос, максимум 30 секунд (таймер на ESP32)
  pumps[id-1] = pumps[id-1] ? 0 : 1;
  alert("Насос " + id + " → " + (pumps[id-1] ? "ВКЛ" : "ВЫКЛ"));
  // В будущем: fetch(`/api/pump/${id}/toggle`)
  modalCancel.onclick = () => {
    modal.style.display = 'none';
    if (onCancel) onCancel();
  };
}

function toggleAutoMode() {
  autoMode = document.getElementById('autoMode').checked;
  alert("Автоматический режим → " + (autoMode ? "ВКЛ" : "ВЫКЛ"));
  // В будущем: fetch(`/api/mode/${autoMode ? 'auto' : 'manual'}`)
// Управление насосами
function togglePump(pumpNumber, state) {
  const action = state ? 'Включить' : 'Выключить';
  showModal(`${action} насос №${pumpNumber}?`, () => {
    console.log(`Насос №${pumpNumber} ${state ? 'включён' : 'выключен'}`);
    // Здесь будет отправка команды на ESP32
  });
}

// Инициализация
updateUI();
// Назначаем кнопки
document.getElementById('pump1Btn').onclick = () => togglePump(1, true);
document.getElementById('pump2Btn').onclick = () => togglePump(2, true);
document.getElementById('pump3Btn').onclick = () => togglePump(3, true);
document.getElementById('pump4Btn').onclick = () => togglePump(4, true);
document.getElementById('pump5Btn').onclick = () => togglePump(5, true);

// Переключение режимов
let autoMode = false;
document.getElementById('autoModeBtn').onclick = () => {
  autoMode = true;
  console.log('Автоматический режим включён');
};
document.getElementById('manualModeBtn').onclick = () => {
  autoMode = false;
  console.log('Ручной режим включён');
};

// Регистрация service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
// Обновление датчиков (пример)
function updateSensor(id, value) {
  document.getElementById(`sensor${id}`).textContent = value + '%';
}

// Пример обновления
updateSensor(1, 45);
updateSensor(2, 60);
updateSensor(3, 30);
updateSensor(4, 75);
updateSensor(5, 50);



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

  modalCancel.onclick = () => {
    modal.style.display = 'none';
    if (onCancel) onCancel();
  };
}

// Управление насосами
function togglePump(pumpNumber, state) {
  const action = state ? 'Включить' : 'Выключить';
  showModal(`${action} насос №${pumpNumber}?`, () => {
    console.log(`Насос №${pumpNumber} ${state ? 'включён' : 'выключен'}`);
    // Здесь будет отправка команды на ESP32
  });
}

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

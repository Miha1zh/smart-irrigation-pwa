// Фейковые данные для теста, потом заменим на API ESP32
let pumps = [0, 0, 0, 0, 0];
let autoMode = false;
let moistureLevels = [42, 35, 61, 28, 55];
let battery = 100;
let water = 0; // в процентах

// ---- Таймеры насосов ----
const PUMP_MAX_TIME = 30 * 1000; // 30 секунд
let pumpTimers = [null, null, null, null, null];

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

  const moistureSpans = document.querySelectorAll('.moisture');
  moistureLevels.forEach((val, i) => {
    if (moistureSpans[i]) moistureSpans[i].innerText = val;
  });

  // Кнопки насосов
  pumps.forEach((state, i) => {
    const btn = document.getElementById(`pump${i+1}Btn`);
    if (!btn) return;

    if (state) {
      btn.classList.add('pump-active');
      btn.innerText = `Выключить насос ${i+1}`;
    } else {
      btn.classList.remove('pump-active');
      btn.innerText = `Включить насос ${i+1}`;
    }
  });
}

// ---- Управление насосами  ---- можно вызвать вручную, автоматически, из будущего API
function togglePump(id, forceState = null) {
  const index = id - 1;

  // если forceState передан — используем его
  if (forceState !== null) {
    pumps[index] = forceState ? 1 : 0;
  } else {
    pumps[index] = pumps[index] ? 0 : 1;
  }

  const btn = document.getElementById(`pump${id}Btn`);

  if (pumps[index]) {
    // ---- НАСОС ВКЛ ----
    if (btn) {
      btn.innerText = `Выключить насос ${id}`;
      btn.classList.add('active');
    }

    // таймер безопасности
    clearTimeout(pumpTimers[index]);
    pumpTimers[index] = setTimeout(() => {
      console.warn(`Насос ${id} выключен по таймеру безопасности`);
      togglePump(id, false);
    }, PUMP_MAX_TIME);

  } else {
    // ---- НАСОС ВЫКЛ ----
    if (btn) {
      btn.innerText = `Включить насос ${id}`;
      btn.classList.remove('active');
    }

    clearTimeout(pumpTimers[index]);
    pumpTimers[index] = null;
  }

  console.log(`Насос ${id} → ${pumps[index] ? "ВКЛ" : "ВЫКЛ"}`);

  // TODO: fetch(`/api/pump/${id}/${pumps[index] ? 'on' : 'off'}`)
}


// ---- Управление авто/ручной режим ----
function toggleAutoModeModal() {
  const checkbox = document.getElementById('autoMode');

  if (!checkbox.checked) {
    // ПЫТАЕМСЯ ВЫКЛЮЧИТЬ → подтверждение
    showModal(
      'Выключить автоматический режим?',
      () => {
        autoMode = false;
        checkbox.checked = false;
        console.log('Автоматический режим → ВЫКЛ');
      },
      () => {
        checkbox.checked = true;
      }
    );
  } else {
    // ВКЛЮЧЕНИЕ — БЕЗ ПОДТВЕРЖДЕНИЯ
    autoMode = true;
    console.log('Автоматический режим → ВКЛ');
  }

  // TODO: fetch(`/api/mode/${autoMode ? 'auto' : 'manual'}`)
}

// ---- Регистрация обработчиков кнопок насосов ----
document.getElementById('pump1Btn').onclick = () => togglePump(1);
document.getElementById('pump2Btn').onclick = () => togglePump(2);
document.getElementById('pump3Btn').onclick = () => togglePump(3);
document.getElementById('pump4Btn').onclick = () => togglePump(4);
document.getElementById('pump5Btn').onclick = () => togglePump(5);

// ---- Переключатель авто/ручной режим ----
document.getElementById('autoMode').onclick = toggleAutoModeModal;

// ---- Инициализация ----
updateUI();

// ---- Регистрация service worker ----
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}



















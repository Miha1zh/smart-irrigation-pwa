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
  moistureLevels.forEach((val, i) => {    if (moistureSpans[i]) {      moistureSpans[i].innerText = val;    }  
                                     });
  pumps.forEach((state, i) => {
  const btn = document.getElementById(`pump${i + 1}Btn`);
  if (!btn) return;
// пример авто-полива ---- if (autoMode && moistureLevels[2] < 30) {  togglePump(3, true); // ВКЛ автоматически}
  btn.innerText = state
    ? `Выключить насос ${i + 1}`
    : `Включить насос ${i + 1}`;

  btn.classList.toggle('active', !!state);
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

// --- Верхние окна ---
const settingsModal = document.getElementById('settingsModal');
const scheduleModal = document.getElementById('scheduleModal');

document.getElementById('settingsBtn').onclick = () => {
  settingsModal.style.display = 'flex';
};

/*document.getElementById('scheduleBtn').onclick = () => {
  scheduleModal.style.display = 'flex';
};*/ //это тоже сдвоено 

function closeSettings() {
  settingsModal.style.display = 'none';
}

function closeSchedule() {
  scheduleModal.style.display = 'none';
}

let schedule = {
  mode: "time",
  times: ["08:00", "18:00"],
  intervalHours: 6,
  startTime: "06:00",
  sleep: {
    from: "22:00",
    to: "06:00"
  }
};
//const scheduleModal = document.getElementById("scheduleModal");
// там выше есть этоже объявление

document.getElementById("scheduleBtn").onclick = () => {
  scheduleModal.style.display = "flex";
  renderSchedule();
};

document.getElementById("closeScheduleBtn").onclick = () => {
  scheduleModal.style.display = "none";
};
function renderSchedule() {
  document.getElementById("wateringCount").innerText = schedule.times.length;

  const list = document.getElementById("timeList");
  list.innerHTML = "";

  schedule.times.forEach((time, i) => {
    const row = document.createElement("div");
    row.className = "time-row";

    row.innerHTML = `
      <input type="time" value="${time}">
      <button>✕</button>
    `;

    row.querySelector("input").onchange = e => {
      schedule.times[i] = e.target.value;
      schedule.times.sort();
    };

    row.querySelector("button").onclick = () => {
      schedule.times.splice(i, 1);
      renderSchedule();
    };

    list.appendChild(row);
  });

  document.getElementById("intervalHours").value = schedule.intervalHours;
  document.getElementById("intervalStart").value = schedule.startTime;
  document.getElementById("sleepFrom").value = schedule.sleep.from;
  document.getElementById("sleepTo").value = schedule.sleep.to;

  updateModeUI();
}
document.querySelectorAll("input[name='scheduleMode']").forEach(radio => {
  radio.onchange = e => {
    schedule.mode = e.target.value;
    updateModeUI();
  };
});

function updateModeUI() {
  document.getElementById("timeMode").classList.toggle(
    "disabled",
    schedule.mode !== "time"
  );

  document.getElementById("intervalMode").classList.toggle(
    "disabled",
    schedule.mode !== "interval"
  );
}
document.getElementById("addTimeBtn").onclick = () => {
  schedule.times.push("12:00");
  schedule.times.sort();
  renderSchedule();
};
document.getElementById("sleepFrom").onchange = e => {
  schedule.sleep.from = e.target.value;
};

document.getElementById("sleepTo").onchange = e => {
  schedule.sleep.to = e.target.value;

  if (schedule.startTime < schedule.sleep.to) {
    schedule.startTime = schedule.sleep.to;
  }

  renderSchedule();
};

document.getElementById("intervalStart").onchange = e => {
  if (e.target.value < schedule.sleep.to) {
    schedule.startTime = schedule.sleep.to;
  } else {
    schedule.startTime = e.target.value;
  }

  renderSchedule();
};
document.getElementById("saveScheduleBtn").onclick = () => {
  console.log("Сохранено:", schedule);
  scheduleModal.style.display = "none";
};


// ===============================
// SERVICE WORKER — ВСЕГДА В КОНЦЕ
// ===============================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('SW зарегистрирован', reg.scope))
      .catch(err => console.error('SW ошибка', err));
  });
}



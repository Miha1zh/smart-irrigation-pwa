// Фейковые данные для теста, потом заменим на API ESP32
//let pumps = [0, 0, 0, 0, 0, 0];
//let autoMode = false;
//let moistureLevels = [10, 35, 61, 28, 55, 111];
//let battery = 100;
//let water = 0; // в процентах

// ===========================
// Основные переменные
// ===========================
let pumps = [];
let autoMode = false;
let moistureLevels = [];
let battery = 0;
let water = 0;

// ===========================
// Источник данных (dataSource)
// ===========================
const STORAGE_KEY = "irrigation.status";

const dataSource = {
  async getStatus() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      return JSON.parse(saved);
    }

    // начальные данные (один раз)
    const initialStatus = {
      pumps: [0, 0, 0, 0, 0],
      autoMode: false,
      moistureLevels: [42, 35, 61, 28, 55],
      battery: 100,
      water: 0
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialStatus));
    return initialStatus;
  },

  async saveStatus(status) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
  }
};
/*const dataSource = {
  async getStatus() {
    return fetch('/api/status').then(r => r.json());
  },

  async saveStatus(status) {
    return fetch('/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status)
    });
  }
};
*/ // на это поменять блок который сверху до (// Источник данных (dataSource) ), когда появится контроллер

// ---- Таймеры насосов ----
const PUMP_MAX_TIME = 30 * 1000; // 30 секунд
let pumpTimers = [null, null, null, null, null];

// ---- Модальное окно ----==========================================
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
//============================================================================

// ---- Универсальное Модальное окно ----
const Modal = (() => {
  const root = document.getElementById("modalRoot");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");
  const okBtn = document.getElementById("modalOk");
  const cancelBtn = document.getElementById("modalCancel");

  let resolveFn = null;

  function close(result) {
    root.style.display = "none";
    okBtn.onclick = null;
    cancelBtn.onclick = null;
    resolveFn?.(result);
  }

  function open({
    title = "",
    content = "",
    okText = "OK",
    cancelText = "Отмена",
    showCancel = true
  }) {
    titleEl.textContent = title;
    bodyEl.innerHTML = content;

    okBtn.textContent = okText;
    cancelBtn.textContent = cancelText;
    cancelBtn.style.display = showCancel ? "inline-flex" : "none";

    root.style.display = "flex";

    return new Promise(resolve => {
      resolveFn = resolve;
      okBtn.onclick = () => close(true);
      cancelBtn.onclick = () => close(false);
    });
  }

  return {
    alert(message, title = "Сообщение") {
      return open({
        title,
        content: `<p>${message}</p>`,
        showCancel: false,
        okText: "Понятно"
      });
    },

    confirm(message, title = "Подтверждение") {
      return open({
        title,
        content: `<p>${message}</p>`
      });
    },

    open
  };
})();


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
//  const checkbox = document.getElementById('autoMode'); //обновление галочки автополив
//  checkbox.checked = autoMode;   // добавить это когда данные будут обновлятся из контроллера 
                                   //в противном случае при каждом запуске этой функции будет переходить в начальное значение т.е. пусто
                                   // нужно будет еще при установке галочки сразу передавть значение на контроллер
}

// ===========================
// Инициализация данных
// ===========================
async function refreshData() {
  const status = await dataSource.getStatus();

  pumps = status.pumps;
  autoMode = status.autoMode;
  moistureLevels = status.moistureLevels;
  battery = status.battery;
  water = status.water;
        console.log('refreshData → autoMode:', autoMode); 
  updateUI();
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
  
 //******* сохранение данных **********
  dataSource.saveStatus({
  pumps,
  autoMode,
  moistureLevels,
  battery,
  water
});
  // тут позже можно добавить: fetch(`/api/pump/${id}/${pumps[index] ? 'on' : 'off'}`)

  //**********************************************!!!
  updateUI(); // вот не знаю в начальной версии не было. Думаю что будет возвращатся в начальное положение пока данные не будут браться из контроллера
}

// ---- Модальное окно Настройки ----
document.getElementById('settingsBtn').onclick = () => {
  Modal.open({
    title: "Настройки",
    content: `
      <p>Здесь будут настройки системы</p>

      <label style="display:block; margin-top:10px;">
        Порог влажности:
        <input type="number" value="30" style="width:100%; margin-top:5px;">
      </label>
    `,
    okText: "Сохранить"
  });
};

// ---- закрытие приложения через модальное окно ----
document.getElementById('exitBtn').onclick = async () => {
  const ok = await Modal.open({
    title: 'Выход',
    content: '<p>Закрыть приложение?</p>',
    okText: 'Выйти',
    cancelText: 'Отмена'
  });

  if (!ok) return;

  // PWA (установленное приложение)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    window.close();
  } else {
    // обычный браузер
    window.location.href = 'about:blank';
  }
};

// ---- Управление авто/ручной режим ----
async function toggleAutoModeModal() {
  const checkbox = document.getElementById('autoMode');

  if (!checkbox.checked) {
    const ok = await Modal.confirm(
      "Выключить автоматический режим?",
      "Автополив"
    );

    if (ok) {
      autoMode = false;
      checkbox.checked = false;
    } else {
      checkbox.checked = true;
    }
  } else {
    autoMode = true;
  }
    console.log('Авто режим →', autoMode ? 'ВКЛ' : 'ВЫКЛ');

   //******* сохранение данных **********
  dataSource.saveStatus({
  pumps,
  autoMode,
  moistureLevels,
  battery,
  water
});
  // TODO: fetch(`/api/mode/${autoMode ? 'auto' : 'manual'}`)
  
  //**********************************************!!!
  updateUI(); // вот не знаю в начальной версии не было. Думаю что будет возвращатся в начальное положение пока данные не будут браться из контроллера
  console.log(autoMode);
}

// ===========================
// Автообновление каждые 5 секунд
// ===========================
     console.log('До',autoMode);
refreshData().then(() => {     // стартовое обновление с паузой пока не закончится обновление
     console.log('После загрузки данных:', autoMode);
setInterval(refreshData, 5000); // регулярное обновление
  });
     console.log('После :',autoMode);
// ---- Регистрация обработчиков кнопок насосов ----
document.getElementById('pump1Btn').onclick = () => togglePump(1);
document.getElementById('pump2Btn').onclick = () => togglePump(2);
document.getElementById('pump3Btn').onclick = () => togglePump(3);
document.getElementById('pump4Btn').onclick = () => togglePump(4);
document.getElementById('pump5Btn').onclick = () => togglePump(5);
document.getElementById('pump6Btn').onclick = () => togglePump(6); // пробую добавить шестую кнопку, еще исправления в хтмл и тут во 2 и 4 строках
// ===========================
// Регистрация кнопок насосов. Можно вот так коротко
// ===========================
/*for (let i = 1; i <= 5; i++) {
  document.getElementById(`pump${i}Btn`).onclick = () => togglePump(i);
}*/


// ---- Переключатель авто/ручной режим ----
document.getElementById('autoMode').onclick = toggleAutoModeModal;

// ---- Инициализация ----
//updateUI(); // думаю это не нужно, поскольку эта функция вызывается из следующей дальше - refreshData()


// --- Верхние окна ---
//const settingsModal = document.getElementById('settingsModal');
const scheduleModal = document.getElementById('scheduleModal');

/*document.getElementById('settingsBtn').onclick = () => {
  settingsModal.style.display = 'flex';
};

function closeSettings() {
  settingsModal.style.display = 'none';
}*/

function closeSchedule() {
  scheduleModal.style.display = 'none';
} 

let schedule = {
  mode: "time",
  times: ["08:00", "18:00"],
  intervalHours: 3,
  startTime: "06:00",
  sleep: {
    from: "22:00",
    to: "06:00"
  }
};

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
  document.getElementById("intervalStart").value =
    schedule.startTime || schedule.sleep.to;

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
    navigator.serviceWorker.register('servise-worker.js')
      .then(reg => console.log('SW зарегистрирован', reg.scope))
      .catch(err => console.error('SW ошибка', err));
  });
}


setTimeout(() => {
  Modal.alert("Модалка работает", "Тест");
}, 500);
































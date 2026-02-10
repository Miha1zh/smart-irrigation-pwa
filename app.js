// ===========================
// Основные переменные
// ===========================
let pumps = [];
let autoMode = false;
let moistureLevels = [];
let battery = 0;
let water = 0;

// ===========================
// Переменные расписания
// ===========================
let schedule = {
  mode: "time",
  times: ["08:00", "18:00"],
  intervalHours: 0,
  startTime: "07:00",
  sleep: {
    from: "22:00",
    to: "06:00"
  }
}; // не знаю, может здесь нужна запятая
//let scheduleDraft = null; // черновик расписани

// ===========================
// Источник данных (dataSource)
// ===========================
const STORAGE_KEY = "irrigation.status";
const COMMANDS_KEY = "irrigation.commands";

const dataSource = {
   // ---- получить состояние (как будто от ESP32)
  async getStatus() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      return JSON.parse(saved);
    }

    // начальные данные (один раз)
    const initialStatus = {
      pumps: [0, 0, 0, 0, 0],
      autoMode: false,
      moistureLevels: [33, 33, 61, 28, 55],
      battery: 100,
      water: 0,
      
      schedule : {
      mode: "time",
      times: ["06:01", "13:33" ,"18:33"],
      intervalHours: 3,
      startTime: "06:01",
      sleep: {
      from: "21:59",
      to: "05:59"
            }
                }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialStatus));
    return initialStatus;
  },
 // ---- сохранить состояние (делает "контроллер") потом заменить : getStatus   → fetch('/api/status')
  async saveStatus(status) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
  },
  // ---- отправить команду (делает UI)   потом заменить :  sendCommand → fetch('/api/cmd')
  async sendCommand(command) {
    const list = JSON.parse(localStorage.getItem(COMMANDS_KEY) || "[]");
    list.push(command);
    localStorage.setItem(COMMANDS_KEY, JSON.stringify(list));
  },

  // --------------- обработка команд (ЭМУЛЯЦИЯ ESP32) --------------------
  //  processCommands() — это имитация прошивки ESP32. Потом ты её просто удалишь и заменишь fetch().
  async processCommands() {
    const commands = JSON.parse(localStorage.getItem(COMMANDS_KEY) || "[]");
    if (!commands.length) return;

    const status = await this.getStatus();

    for (const cmd of commands) {
      if (cmd.type === "pump") {
        const i = cmd.id - 1;
        status.pumps[i] = status.pumps[i] ? 0 : 1;
      }
    }

    await this.saveStatus(status);
    localStorage.removeItem(COMMANDS_KEY);
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

// ---- Таймеры насосов ---- не нужен будет реализован на контроллере
//const PUMP_MAX_TIME = 30 * 1000; // 30 секунд
//let pumpTimers = [null, null, null, null, null];

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
  // "контроллер" обрабатывает команды. Потом ты её просто удалишь и заменишь fetch().
  await dataSource.processCommands();
  // получаем фактическое состояние. Потом ты её просто удалишь и заменишь  getStatus   → fetch('/api/status')
  const status = await dataSource.getStatus();

  pumps = status.pumps;
  autoMode = status.autoMode;
  moistureLevels = status.moistureLevels;
  battery = status.battery;
  water = status.water;

  schedule = status.schedule;
  
        console.log('refreshData → autoMode:', autoMode); 
        console.log('schedule:', schedule); 
  // синхронизация DOM
  const checkbox = document.getElementById('autoMode');
  if (checkbox) checkbox.checked = autoMode; // <--- вот что нужно
  updateUI();
  //renderSchedule(); // обновление модалки расписание  Думаю не нежно ее обновлять каздые пять секунд
}

// ---- Управление насосами  ---- можно вызвать вручную, автоматически, из будущего API
function togglePump(id) {
  const index = id - 1;

  // 1. ОПТИМИСТИЧНО меняем локальное состояние
  pumps[index] = pumps[index] ? 0 : 1;

  // 2. Обновляем кнопку (как у тебя было)
  const btn = document.getElementById(`pump${id}Btn`);

  if (pumps[index]) {
    btn.innerText = `Выключить насос ${id}`;
    btn.classList.add('active');
  } else {
    btn.innerText = `Включить насос ${id}`;
    btn.classList.remove('active');
  }
  console.log(`UI: насос ${id} → ${pumps[index] ? "ВКЛ" : "ВЫКЛ"}`);

  // 3. Отправляем КОМАНДУ (не состояние!) . Потом заменишь : sendCommand → fetch('/api/cmd')
  dataSource.sendCommand({
    type: "pump",
    id,
    action: pumps[index] ? "on" : "off",
    ts: Date.now()
  });

  // 4. UI обновили — всё
  updateUI();
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
  // просто замени блок сверху до //** на строчку ниже
  // TODO: fetch(`/api/mode/${autoMode ? 'auto' : 'manual'}`)
  
  //**********************************************!!!
  updateUI(); // вот не знаю в начальной версии не было. Думаю что будет возвращатся в начальное положение пока данные не будут браться из контроллера
}
// ===========================
// ---- Инициализация ----
// ===========================
refreshData().then(() => {     // стартовое обновление с паузой пока не закончится обновление
// Автообновление каждые 5 секунд
setInterval(refreshData, 5000); // регулярное обновление
  });

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

// --- Верхние окна ---
//const settingsModal = document.getElementById('settingsModal');
const scheduleModal = document.getElementById('scheduleModal');

/*document.getElementById('settingsBtn').onclick = () => {
  settingsModal.style.display = 'flex';
};

function closeSettings() {
  settingsModal.style.display = 'none';
}*/
//-----------функция закрытия модалки расписание----------
function closeSchedule() {
  scheduleModal.style.display = 'none';
} 
// потом эту конструкцию проверь на правильность------------------------????
document.getElementById("scheduleBtn").onclick = () => {
  //scheduleDraft = JSON.parse(JSON.stringify(schedule));  // создаём черновик
  scheduleModal.style.display = "flex";
  renderSchedule();
};

document.getElementById("closeScheduleBtn").onclick = closeSchedule; // вызов функции закрытия модалки расписание

//----------обновление модалки расписание---------------------
function renderSchedule() {
  //document.getElementById("wateringCount").innerText = schedule.times.length;
  const innerText = document.getElementById("wateringCount");
  if (innerText) innerText.innerText = schedule.times.length;
  console.log("ввввввввввввввввввв:", schedule.times);

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
      //saveSchedule();
    };

    row.querySelector("button").onclick = () => {
      schedule.times.splice(i, 1);
     // saveSchedule();
      renderSchedule();
    };

    list.appendChild(row);
  });

  document.getElementById("intervalHours").value = schedule.intervalHours;
  document.getElementById("intervalStart").value =
                                  schedule.startTime || schedule.sleep.to;

  document.getElementById("sleepFrom").value = schedule.sleep.from;
  document.getElementById("sleepTo").value = schedule.sleep.to;
  //saveSchedule(); //--------------?????????  не уверен
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
// ***** сохраняю данные  по клику на кнопку сохранить ******
document.getElementById("saveScheduleBtn").onclick = () => {
  console.log("Сохранено:", schedule);
  dataSource.saveStatus({  //  так понимаю, этот блок потом тоже заменить
    pumps,
    autoMode,
    moistureLevels,
    battery,
    water,
    schedule
  });
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



























































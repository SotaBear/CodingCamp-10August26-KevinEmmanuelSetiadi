// ── Storage helpers ────────────────────────────────────
const Storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback; // Req 11.4: silent fallback on parse error
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Safari private mode throws QuotaExceededError; silently ignore
    }
  }
};

// ── ID generator ───────────────────────────────────────
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older Safari
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Theme module ────────────────────────────────────────
const Theme = {
  apply(t) {
    document.documentElement.dataset.theme = t;
  },
  toggle() {
    const current = document.documentElement.dataset.theme;
    const newTheme = current === "light" ? "dark" : "light";
    Storage.set("tld_theme", newTheme);
    Theme.apply(newTheme);
  },
  init() {
    const saved = Storage.get("tld_theme", "light");
    Theme.apply(saved);
    const checkbox = document.getElementById("theme-toggle-input");
    if (checkbox) {
      checkbox.checked = saved === "dark";
      checkbox.addEventListener("change", () => Theme.toggle());
    }
  }
};

// ── Greeting module ─────────────────────────────────────
const Greeting = {
  getGreeting(hour) {
    if (hour >= 5  && hour <= 11) return "Good Morning";
    if (hour >= 12 && hour <= 17) return "Good Afternoon";
    if (hour >= 18 && hour <= 20) return "Good Evening";
    return "Good Night"; // 21–23 and 0–4
  },
  formatTime(date) {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  },
  formatDate(date) {
    const days   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const months = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];
    const weekday = days[date.getDay()];
    const month   = months[date.getMonth()];
    const day     = date.getDate();
    const year    = date.getFullYear();
    return `${weekday}, ${month} ${day}, ${year}`;
  },
  tick() {
    const now = new Date();
    document.getElementById("clock-display").textContent  = Greeting.formatTime(now);
    document.getElementById("date-display").textContent   = Greeting.formatDate(now);
    document.getElementById("greeting-text").textContent  = Greeting.getGreeting(now.getHours());
  },
  init() {
    Greeting.tick();
    setInterval(Greeting.tick, 1000);
  }
};

// ── In-memory state ─────────────────────────────────────
const state = {
  theme: "light",
  pomodoroDuration: 25,
  pomodoroRemaining: 1500,
  pomodoroRunning: false,
  tasks: [],
  links: []
};

// ── Timer helpers ───────────────────────────────────────
function formatTimer(s) {
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// ── Property test: formatTimer ─────────────────────────────────────────────
// Validates: Requirements 3.1
// Property 4: Timer display always produces MM:SS format
// For any integer s in [0, 5999], formatTimer(s) matches /^\d{2}:\d{2}$/
// and MM * 60 + SS === s
(function testFormatTimerProperty() {
  const sampleValues = [0, 1, 9, 10, 59, 60, 61, 99, 100, 599, 600, 601,
                        999, 1000, 1500, 2000, 3599, 3600, 3661, 5000, 5999];
  const formatRegex = /^\d{2}:\d{2}$/;

  sampleValues.forEach(function(s) {
    const result = formatTimer(s);

    // Property 4a: result matches MM:SS format
    console.assert(
      formatRegex.test(result),
      "Property 4 FAIL: formatTimer(" + s + ") = \"" + result + "\" does not match /^\\d{2}:\\d{2}$/"
    );

    // Property 4b: MM * 60 + SS === s (round-trip correctness)
    const parts = result.split(":");
    const mm = parseInt(parts[0], 10);
    const ss = parseInt(parts[1], 10);
    console.assert(
      mm * 60 + ss === s,
      "Property 4 FAIL: formatTimer(" + s + ") = \"" + result + "\": " + mm + " * 60 + " + ss + " = " + (mm * 60 + ss) + " !== " + s
    );
  });

  console.log("[Property 4] formatTimer: all " + sampleValues.length + " sample values passed MM:SS format and round-trip checks.");
}());
// ── End property test: formatTimer ────────────────────────────────────────

// ── Timer module ─────────────────────────────────────────
let timerIntervalId = null;

const Timer = {
  render() {
    document.getElementById("timer-display").textContent = formatTimer(state.pomodoroRemaining);
  },
  init() {
    const saved = Storage.get("tld_pomodoro_duration", 25);
    state.pomodoroDuration  = saved;
    state.pomodoroRemaining = saved * 60;
    Timer.render();
    const input    = document.getElementById("timer-duration-input");
    const setBtn   = document.getElementById("timer-duration-set");
    const startBtn = document.getElementById("timer-start");
    const stopBtn  = document.getElementById("timer-stop");
    const resetBtn = document.getElementById("timer-reset");
    if (input) {
      input.value = saved;
      input.addEventListener("keydown", e => {
        if (e.key === "Enter") Timer.setDuration(parseInt(input.value, 10));
      });
    }
    if (setBtn)   setBtn.addEventListener("click",  () => Timer.setDuration(parseInt(input ? input.value : "0", 10)));
    if (startBtn) startBtn.addEventListener("click", () => Timer.start());
    if (stopBtn)  stopBtn.addEventListener("click",  () => Timer.stop());
    if (resetBtn) resetBtn.addEventListener("click", () => Timer.reset());
  },
  start() {
    if (state.pomodoroRunning) return;
    state.pomodoroRunning = true;
    timerIntervalId = setInterval(Timer.tick, 1000);
    const startBtn = document.getElementById("timer-start");
    const stopBtn  = document.getElementById("timer-stop");
    if (startBtn) startBtn.disabled = true;
    if (stopBtn)  stopBtn.disabled  = false;
  },
  tick() {
    state.pomodoroRemaining--;
    Timer.render();
    if (state.pomodoroRemaining === 0) {
      Timer.stop();
      alert("Focus session complete!");
    }
  },
  stop() {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    state.pomodoroRunning = false;
    const startBtn = document.getElementById("timer-start");
    const stopBtn  = document.getElementById("timer-stop");
    if (startBtn) startBtn.disabled = false;
    if (stopBtn)  stopBtn.disabled  = true;
  },
  reset() {
    Timer.stop();
    state.pomodoroRemaining = state.pomodoroDuration * 60;
    Timer.render();
  },
  setDuration(v) {
    const errEl = document.getElementById("timer-error");
    if (!Number.isInteger(v) || v < 1) {
      if (errEl) {
        errEl.textContent = "Please enter a valid duration (minimum 1 minute)";
        errEl.classList.remove("hidden");
      }
      return;
    }
    if (errEl) errEl.classList.add("hidden");
    Storage.set("tld_pomodoro_duration", v);
    state.pomodoroDuration = v;
    Timer.reset();
  },
};

// ── Todo module ─────────────────────────────────────────
const Todo = {
  isDuplicate(desc, excludeId = null) {
    return state.tasks.some(t =>
      t.id !== excludeId &&
      t.description.toLowerCase() === desc.toLowerCase()
    );
  },
  addTask(description) {
    const trimmed = description.trim();
    if (!trimmed) {
      alert("Task cannot be empty.");
      return;
    }
    if (Todo.isDuplicate(trimmed)) {
      alert("This task already exists.");
      return;
    }
    const task = { id: generateId(), description: trimmed, completed: false };
    state.tasks.push(task);
    Storage.set("tld_tasks", state.tasks);
    Todo.renderList();
    const input = document.getElementById("todo-input");
    if (input) input.value = "";
  },
  renderItem(task) {
    const li = document.createElement("li");
    li.className = "todo-item" + (task.completed ? " completed" : "");
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-toggle";
    checkbox.checked = task.completed;

    const span = document.createElement("span");
    span.className = "todo-text";
    span.textContent = task.description;

    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "todo-edit-input hidden";
    editInput.value = task.description;

    const editBtn = document.createElement("button");
    editBtn.className = "todo-edit-btn";
    editBtn.textContent = "Edit";

    const saveBtn = document.createElement("button");
    saveBtn.className = "todo-save-btn hidden";
    saveBtn.textContent = "Save";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "todo-cancel-btn hidden";
    cancelBtn.textContent = "Cancel";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "todo-delete-btn";
    deleteBtn.textContent = "Delete";

    li.append(checkbox, span, editInput, editBtn, saveBtn, cancelBtn, deleteBtn);
    return li;
  },
  renderList() {
    const ul = document.getElementById("todo-list");
    if (!ul) return;
    ul.innerHTML = "";
    state.tasks.forEach(task => ul.appendChild(Todo.renderItem(task)));
  },
  editTask(id, newDesc) {
    const trimmed = newDesc.trim();
    if (!trimmed) {
      alert("Task cannot be empty.");
      return;
    }
    if (Todo.isDuplicate(trimmed, id)) {
      alert("This task already exists.");
      return;
    }
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    task.description = trimmed;
    Storage.set("tld_tasks", state.tasks);
    Todo.renderList();
  },
  toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    Storage.set("tld_tasks", state.tasks);
    Todo.renderList();
  },
  deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    Storage.set("tld_tasks", state.tasks);
    Todo.renderList();
  },
  init() {
    // 1. Load tasks from LocalStorage
    state.tasks = Storage.get("tld_tasks", []);

    // 2. Render all tasks
    Todo.renderList();

    // 3. Wire Add button (click) and input field (Enter key)
    const input  = document.getElementById("todo-input");
    const addBtn = document.getElementById("todo-add");

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        Todo.addTask(input ? input.value : "");
      });
    }

    if (input) {
      input.addEventListener("keydown", e => {
        if (e.key === "Enter") Todo.addTask(input.value);
      });
    }

    // 4. Event delegation on #todo-list for all item interactions
    const list = document.getElementById("todo-list");
    if (!list) return;

    list.addEventListener("click", e => {
      const item = e.target.closest(".todo-item");
      if (!item) return;
      const id = item.dataset.id;

      // Toggle completion
      if (e.target.matches(".todo-toggle")) {
        Todo.toggleTask(id);
        return;
      }

      // Open edit mode
      if (e.target.matches(".todo-edit-btn")) {
        const span      = item.querySelector(".todo-text");
        const editInput = item.querySelector(".todo-edit-input");
        const editBtn   = item.querySelector(".todo-edit-btn");
        const saveBtn   = item.querySelector(".todo-save-btn");
        const cancelBtn = item.querySelector(".todo-cancel-btn");

        // Pre-populate edit input with current description
        if (editInput) editInput.value = span ? span.textContent : "";

        // Show edit controls, hide display controls
        if (span)      span.classList.add("hidden");
        if (editInput) editInput.classList.remove("hidden");
        if (editBtn)   editBtn.classList.add("hidden");
        if (saveBtn)   saveBtn.classList.remove("hidden");
        if (cancelBtn) cancelBtn.classList.remove("hidden");
        if (editInput) editInput.focus();
        return;
      }

      // Save edit
      if (e.target.matches(".todo-save-btn")) {
        const editInput = item.querySelector(".todo-edit-input");
        Todo.editTask(id, editInput ? editInput.value : "");
        return;
      }

      // Cancel edit — restore display without saving
      if (e.target.matches(".todo-cancel-btn")) {
        const span      = item.querySelector(".todo-text");
        const editInput = item.querySelector(".todo-edit-input");
        const editBtn   = item.querySelector(".todo-edit-btn");
        const saveBtn   = item.querySelector(".todo-save-btn");
        const cancelBtn = item.querySelector(".todo-cancel-btn");

        if (span)      span.classList.remove("hidden");
        if (editInput) editInput.classList.add("hidden");
        if (editBtn)   editBtn.classList.remove("hidden");
        if (saveBtn)   saveBtn.classList.add("hidden");
        if (cancelBtn) cancelBtn.classList.add("hidden");
        return;
      }

      // Delete task
      if (e.target.matches(".todo-delete-btn")) {
        Todo.deleteTask(id);
        return;
      }
    });
  },
};

// ── Quick Links module ──────────────────────────────────
const QuickLinks = {
  addLink(label, url) {
    const trimLabel = label.trim();
    const trimUrl   = url.trim();
    if (!trimLabel || !trimUrl) {
      alert("Both a label and a URL are required.");
      return;
    }
    const link = { id: generateId(), label: trimLabel, url: trimUrl };
    state.links.push(link);
    Storage.set("tld_links", state.links);
    QuickLinks.renderList();
    // Clear inputs after successful add
    const labelInput = document.getElementById("link-label-input");
    const urlInput   = document.getElementById("link-url-input");
    if (labelInput) labelInput.value = "";
    if (urlInput)   urlInput.value   = "";
  },
  deleteLink(id) {
    state.links = state.links.filter(l => l.id !== id);
    Storage.set("tld_links", state.links);
    QuickLinks.renderList();
  },
  renderList() {
    const container = document.getElementById("quicklinks-list");
    if (!container) return;
    container.innerHTML = "";
    state.links.forEach(link => {
      const div = document.createElement("div");
      div.className = "link-item";
      div.dataset.id = link.id;

      const a = document.createElement("a");
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "link-btn";
      a.textContent = link.label;

      const delBtn = document.createElement("button");
      delBtn.className = "link-delete-btn";
      delBtn.textContent = "×";

      div.append(a, delBtn);
      container.appendChild(div);
    });
  },
  init() {
    state.links = Storage.get("tld_links", []);
    QuickLinks.renderList();
    const labelInput = document.getElementById("link-label-input");
    const urlInput   = document.getElementById("link-url-input");
    const addBtn     = document.getElementById("link-add");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        QuickLinks.addLink(labelInput ? labelInput.value : "", urlInput ? urlInput.value : "");
      });
    }
    if (labelInput) {
      labelInput.addEventListener("keydown", e => {
        if (e.key === "Enter") QuickLinks.addLink(labelInput.value, urlInput ? urlInput.value : "");
      });
    }
    if (urlInput) {
      urlInput.addEventListener("keydown", e => {
        if (e.key === "Enter") QuickLinks.addLink(labelInput ? labelInput.value : "", urlInput.value);
      });
    }
    const list = document.getElementById("quicklinks-list");
    if (list) {
      list.addEventListener("click", e => {
        const item = e.target.closest(".link-item");
        if (!item) return;
        if (e.target.matches(".link-delete-btn")) {
          QuickLinks.deleteLink(item.dataset.id);
        }
      });
    }
  }
};

// ── Bootstrap ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  Greeting.init();
  Timer.init();
  Todo.init();
  QuickLinks.init();
});

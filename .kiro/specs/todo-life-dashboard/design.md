# Design Document — To-Do Life Dashboard

## Overview

The To-Do Life Dashboard is a fully client-side single-page application (SPA) written in plain HTML, CSS, and Vanilla JavaScript. It delivers four widgets on one screen:

- **Greeting Widget** — live clock, full date, and time-of-day greeting
- **Pomodoro Timer** — configurable countdown with start / stop / reset controls
- **To-Do List** — persistent task management with add, edit, complete, and delete
- **Quick Links** — user-defined shortcut buttons that open URLs in a new tab

All data is persisted exclusively through the Browser Local Storage API. The application targets modern browsers (Chrome, Firefox, Edge, Safari) and must remain fully usable at viewport widths as narrow as 360 px.

### Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| No build step | Single `index.html` + one `css/style.css` + one `js/app.js` | Constraint from requirements; also works as a browser extension |
| Module pattern | IIFE-namespaced plain functions grouped by widget | Avoids global leaks without requiring ES modules (no server needed) |
| State management | Single in-memory `state` object, written to LocalStorage on every mutation | Simple, predictable, no framework needed |
| Theming | CSS custom properties on `:root`, toggled via a `data-theme` attribute | Native, zero-JS cascade; dark mode is a one-attribute swap |
| Timer engine | `setInterval` at 1 s precision inside a timer module | Sufficient for Pomodoro use; cleared on stop/reset |

---

## Architecture

The application follows a **widget-centric MVC-lite** pattern:

```
┌─────────────────────────────────────────────────────┐
│                      index.html                     │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  Greeting    │  │    Timer     │                 │
│  │  Widget      │  │    Widget    │                 │
│  └──────────────┘  └──────────────┘                 │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  Todo List   │  │ Quick Links  │                 │
│  │  Widget      │  │   Widget     │                 │
│  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
   js/app.js           css/style.css
   (all logic)         (all styling)
         │
         ▼
   LocalStorage API
```

### Data Flow (per interaction)

```
User interaction
      │
      ▼
Event listener (app.js)
      │
      ▼
Validate input
      │
      ├── invalid ──► Show feedback (alert / inline message)
      │
      ▼ valid
Mutate in-memory state object
      │
      ▼
Persist to LocalStorage (JSON.stringify)
      │
      ▼
Re-render affected widget (DOM update)
```

### File / Folder Structure

```
project-root/
├── index.html          # Markup skeleton for all widgets
├── css/
│   └── style.css       # All visual styles, variables, themes
└── js/
    └── app.js          # All application logic
```

---

## Components and Interfaces

### HTML Layout

`index.html` uses a semantic layout with landmark regions:

```html
<body data-theme="light">
  <header class="dashboard-header">
    <!-- Theme toggle -->
  </header>

  <main class="dashboard-grid">
    <section id="greeting-widget"  class="widget">…</section>
    <section id="timer-widget"     class="widget">…</section>
    <section id="todo-widget"      class="widget">…</section>
    <section id="quicklinks-widget" class="widget">…</section>
  </main>
</body>
```

The `.dashboard-grid` uses CSS Grid with auto-fit columns so widgets reflow on small viewports.

---

### Widget: Greeting

```html
<section id="greeting-widget" class="widget">
  <p  id="greeting-text">Good Morning</p>
  <p  id="clock-display">00:00:00</p>
  <p  id="date-display">Thursday, August 14, 2026</p>
</section>
```

**JS interface**

```js
// Greeting module
Greeting.init()          // called once on DOMContentLoaded
Greeting.tick()          // called every second by setInterval
Greeting.getGreeting(hour) // pure: returns greeting string for given hour
Greeting.formatTime(date)  // pure: returns "HH:MM:SS" string
Greeting.formatDate(date)  // pure: returns "Weekday, Month DD, YYYY" string
```

---

### Widget: Pomodoro Timer

```html
<section id="timer-widget" class="widget">
  <div id="timer-display">25:00</div>
  <div id="timer-error" class="error-msg hidden"></div>
  <div class="timer-controls">
    <button id="timer-start">Start</button>
    <button id="timer-stop">Stop</button>
    <button id="timer-reset">Reset</button>
  </div>
  <div class="timer-config">
    <input id="timer-duration-input" type="number" min="1" />
    <button id="timer-duration-set">Set Duration</button>
  </div>
</section>
```

**JS interface**

```js
Timer.init()           // reads saved duration, renders initial state
Timer.start()          // starts setInterval, disables Start button
Timer.stop()           // clears interval, retains remaining time
Timer.reset()          // clears interval, restores duration
Timer.setDuration(min) // validates, saves to LS, resets countdown
Timer.tick()           // decrements remaining seconds; fires alert at 0
Timer.render()         // updates #timer-display DOM node
```

---

### Widget: To-Do List

```html
<section id="todo-widget" class="widget">
  <div class="todo-input-row">
    <input id="todo-input" type="text" placeholder="Add a task…" />
    <button id="todo-add">Add</button>
  </div>
  <ul id="todo-list">
    <!-- <li> items injected by JS -->
  </ul>
</section>
```

Each rendered `<li>`:

```html
<li data-id="uuid" class="todo-item [completed]">
  <input type="checkbox" class="todo-toggle" />
  <span class="todo-text">Buy groceries</span>
  <input type="text" class="todo-edit-input hidden" />
  <button class="todo-edit-btn">Edit</button>
  <button class="todo-save-btn hidden">Save</button>
  <button class="todo-cancel-btn hidden">Cancel</button>
  <button class="todo-delete-btn">Delete</button>
</li>
```

**JS interface**

```js
Todo.init()                    // loads from LS, renders all tasks
Todo.addTask(description)      // validates, appends, saves, re-renders
Todo.editTask(id, newDesc)     // validates, updates, saves, re-renders
Todo.toggleTask(id)            // flips completed, saves, re-renders
Todo.deleteTask(id)            // removes, saves, re-renders
Todo.renderList()              // full re-render of #todo-list
Todo.renderItem(task)          // returns <li> Element for one task
Todo.isDuplicate(desc, excludeId) // pure: checks for case-insensitive dup
```

---

### Widget: Quick Links

```html
<section id="quicklinks-widget" class="widget">
  <div class="quicklinks-input-row">
    <input id="link-label-input" type="text" placeholder="Label" />
    <input id="link-url-input"   type="text" placeholder="https://…" />
    <button id="link-add">Add Link</button>
  </div>
  <div id="quicklinks-list">
    <!-- buttons injected by JS -->
  </div>
</section>
```

Each rendered link:

```html
<div class="link-item" data-id="uuid">
  <a href="https://…" target="_blank" rel="noopener noreferrer"
     class="link-btn">Label</a>
  <button class="link-delete-btn">×</button>
</div>
```

**JS interface**

```js
QuickLinks.init()              // loads from LS, renders all links
QuickLinks.addLink(label, url) // validates, appends, saves, re-renders
QuickLinks.deleteLink(id)      // removes, saves, re-renders
QuickLinks.renderList()        // full re-render of #quicklinks-list
```

---

### Theme Toggle

```html
<header class="dashboard-header">
  <label class="theme-toggle" aria-label="Toggle dark mode">
    <input type="checkbox" id="theme-toggle-input" />
    <span class="toggle-track"><span class="toggle-thumb"></span></span>
  </label>
</header>
```

**JS interface**

```js
Theme.init()     // reads LS value, applies data-theme, syncs checkbox
Theme.toggle()   // flips theme, saves to LS, applies to document
Theme.apply(t)   // sets document.documentElement.dataset.theme = t
```

---

## Data Models

### Local Storage Keys

| Key | Type | Default |
|---|---|---|
| `tld_theme` | `"light" \| "dark"` | `"light"` |
| `tld_pomodoro_duration` | `number` (minutes, ≥ 1) | `25` |
| `tld_tasks` | `Task[]` (JSON) | `[]` |
| `tld_links` | `Link[]` (JSON) | `[]` |

All keys are prefixed with `tld_` to avoid collisions with other apps sharing the same origin.

---

### Task Object

```ts
{
  id: string,          // nanoid-style UUID (crypto.randomUUID or fallback)
  description: string, // trimmed, non-empty task text
  completed: boolean   // false = incomplete, true = complete
}
```

**Example**

```json
{
  "id": "a1b2c3d4",
  "description": "Buy groceries",
  "completed": false
}
```

---

### Link Object

```ts
{
  id: string,   // UUID
  label: string, // trimmed, non-empty display label
  url: string    // trimmed, non-empty URL string
}
```

**Example**

```json
{
  "id": "e5f6g7h8",
  "label": "GitHub",
  "url": "https://github.com"
}
```

---

### In-Memory State Object

The single global `state` object mirrors what is in LocalStorage and is the authoritative runtime source of truth:

```js
const state = {
  theme: "light",            // string
  pomodoroDuration: 25,      // minutes
  pomodoroRemaining: 1500,   // seconds (computed: duration * 60)
  pomodoroRunning: false,     // bool
  tasks: [],                 // Task[]
  links: []                  // Link[]
};
```

`pomodoroRemaining` and `pomodoroRunning` are **not** persisted — they reset on page load by design (a half-finished Pomodoro is intentionally not resumed).

---

## CSS Architecture

### CSS Custom Properties (variables)

All color and spacing values are defined as CSS variables on `:root` (light theme defaults) and overridden under `[data-theme="dark"]`:

```css
:root {
  /* Colors */
  --color-bg:        #f5f5f5;
  --color-surface:   #ffffff;
  --color-primary:   #4f46e5;
  --color-text:      #1a1a1a;
  --color-text-muted:#666666;
  --color-border:    #e0e0e0;
  --color-error:     #dc2626;
  --color-success:   #16a34a;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typography */
  --font-size-sm:  0.875rem;
  --font-size-md:  1rem;
  --font-size-lg:  1.25rem;
  --font-size-xl:  2rem;
  --font-size-xxl: 3rem;

  /* Radius & Shadow */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  16px;
  --shadow-sm:  0 1px 3px rgba(0,0,0,.1);
  --shadow-md:  0 4px 12px rgba(0,0,0,.12);
}

[data-theme="dark"] {
  --color-bg:        #0f0f0f;
  --color-surface:   #1a1a1a;
  --color-primary:   #818cf8;
  --color-text:      #f5f5f5;
  --color-text-muted:#a0a0a0;
  --color-border:    #2e2e2e;
}
```

### Layout

- `.dashboard-grid` uses `display: grid` with `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))` so widgets stack on narrow viewports.
- On viewports ≥ 768 px: 2-column grid.
- On viewports < 768 px (down to 360 px): 1-column stack.

```css
@media (max-width: 767px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
```

### Utility Classes

| Class | Purpose |
|---|---|
| `.hidden` | `display: none` |
| `.error-msg` | Red inline error text |
| `.completed` | Strikethrough + muted color on task text |
| `.widget` | Card surface, padding, border-radius, shadow |

---

## JavaScript Module Design

`app.js` is structured as a collection of plain-object modules (namespace pattern) wrapped in a single `DOMContentLoaded` listener. No ES module syntax is used to keep the file loadable without a server.

```js
// app.js — high-level structure

// ── Storage helpers ────────────────────────────────────
const Storage = { get, set, remove };

// ── ID generator ───────────────────────────────────────
function generateId() { … }

// ── Theme module ───────────────────────────────────────
const Theme = { init, toggle, apply };

// ── Greeting module ────────────────────────────────────
const Greeting = { init, tick, getGreeting, formatTime, formatDate };

// ── Timer module ───────────────────────────────────────
const Timer = { init, start, stop, reset, setDuration, tick, render };

// ── Todo module ────────────────────────────────────────
const Todo = { init, addTask, editTask, toggleTask, deleteTask,
               renderList, renderItem, isDuplicate };

// ── QuickLinks module ──────────────────────────────────
const QuickLinks = { init, addLink, deleteLink, renderList };

// ── Bootstrap ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  Greeting.init();
  Timer.init();
  Todo.init();
  QuickLinks.init();
});
```

### Storage Helpers

```js
const Storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;  // Req 11.4: silent fallback on parse error
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};
```

### ID Generator

```js
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older Safari
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
```

---

## State Management Approach

State is managed through a single module-level `state` object. Every mutation follows this pattern:

1. **Validate** — return early with user feedback if invalid
2. **Mutate** — modify the in-memory `state` property
3. **Persist** — call `Storage.set(key, state.xxx)` immediately
4. **Render** — call the widget's render function to sync the DOM

This avoids stale UI and ensures LocalStorage always reflects the current state.

```
validate → mutate state → Storage.set → re-render DOM
```

There is no virtual DOM or diffing. Full re-renders of widget lists (tasks, links) are used because the lists are small and performance is not a concern. For the clock and timer, only the text content of the display element is updated each second.

---

## Event Handling Strategy

All event listeners are registered in each module's `init()` function. Event delegation is used for dynamic list items (tasks, links) to avoid attaching/detaching listeners on every re-render:

```js
// Event delegation on the list container
document.getElementById("todo-list").addEventListener("click", (e) => {
  const item = e.target.closest(".todo-item");
  if (!item) return;
  const id = item.dataset.id;

  if (e.target.matches(".todo-toggle"))     Todo.toggleTask(id);
  if (e.target.matches(".todo-edit-btn"))   Todo.openEdit(id);
  if (e.target.matches(".todo-save-btn"))   Todo.saveEdit(id);
  if (e.target.matches(".todo-cancel-btn")) Todo.cancelEdit(id);
  if (e.target.matches(".todo-delete-btn")) Todo.deleteTask(id);
});
```

The same delegation pattern applies to `#quicklinks-list`.

Form submissions (timer duration, new task, new link) listen for both `click` on the submit button and `keydown Enter` on the input field.

---

## Timer Implementation

```
Timer state (not persisted):
  intervalId  — reference returned by setInterval; null when stopped
  remaining   — integer seconds remaining

Timer state (persisted):
  pomodoroDuration — integer minutes

Timer lifecycle:
  init()   → load duration from LS → set remaining = duration * 60 → render
  start()  → intervalId = setInterval(tick, 1000) → disable Start btn
  tick()   → remaining-- → render → if remaining === 0: stop + alert
  stop()   → clearInterval(intervalId) → intervalId = null → enable Start btn
  reset()  → stop() → remaining = duration * 60 → render
  setDuration(min) → validate → save → reset()
```

`setInterval` fires approximately every 1000 ms. Drift of a few seconds per hour is acceptable for a Pomodoro use case. The timer does not compensate for tab throttling (browsers throttle timers in background tabs); this is by design and noted in the testing strategy.

---

## Data Flow per Widget

### Greeting Widget

```
DOMContentLoaded
  └─ Greeting.init()
       └─ setInterval(Greeting.tick, 1000)

Every second:
  Greeting.tick()
    ├─ now = new Date()
    ├─ Update #clock-display  ← formatTime(now)
    ├─ Update #date-display   ← formatDate(now)
    └─ Update #greeting-text  ← getGreeting(now.getHours())
```

### Timer Widget

```
DOMContentLoaded
  └─ Timer.init()
       ├─ duration = Storage.get("tld_pomodoro_duration", 25)
       ├─ remaining = duration * 60
       └─ Timer.render()

[Start click] → Timer.start() → setInterval(Timer.tick, 1000)
[Stop click]  → Timer.stop()  → clearInterval
[Reset click] → Timer.reset() → remaining = duration*60 → render

[Set Duration submit]
  └─ Timer.setDuration(value)
       ├─ validate (integer ≥ 1)
       │    └─ invalid: show #timer-error message
       └─ valid:
            ├─ Storage.set("tld_pomodoro_duration", value)
            ├─ state.pomodoroDuration = value
            └─ Timer.reset()
```

### To-Do List Widget

```
DOMContentLoaded
  └─ Todo.init()
       ├─ state.tasks = Storage.get("tld_tasks", [])
       └─ Todo.renderList()

[Add submit]
  └─ Todo.addTask(inputValue)
       ├─ trim → empty? alert "Task cannot be empty."
       ├─ isDuplicate? alert "This task already exists."
       └─ valid:
            ├─ task = { id: generateId(), description, completed: false }
            ├─ state.tasks.push(task)
            ├─ Storage.set("tld_tasks", state.tasks)
            └─ Todo.renderList()

[Toggle click via delegation]
  └─ Todo.toggleTask(id)
       ├─ task.completed = !task.completed
       ├─ Storage.set("tld_tasks", state.tasks)
       └─ Todo.renderList()

[Edit flow via delegation]
  openEdit(id)  → show edit input, hide span
  saveEdit(id)  → validate new desc → update → save → renderList()
  cancelEdit(id)→ hide edit input, show span

[Delete click via delegation]
  └─ Todo.deleteTask(id)
       ├─ state.tasks = state.tasks.filter(t => t.id !== id)
       ├─ Storage.set("tld_tasks", state.tasks)
       └─ Todo.renderList()
```

### Quick Links Widget

```
DOMContentLoaded
  └─ QuickLinks.init()
       ├─ state.links = Storage.get("tld_links", [])
       └─ QuickLinks.renderList()

[Add Link submit]
  └─ QuickLinks.addLink(label, url)
       ├─ trim both → either empty? alert "Both a label and a URL are required."
       └─ valid:
            ├─ link = { id: generateId(), label, url }
            ├─ state.links.push(link)
            ├─ Storage.set("tld_links", state.links)
            └─ QuickLinks.renderList()

[Delete click via delegation]
  └─ QuickLinks.deleteLink(id)
       ├─ state.links = state.links.filter(l => l.id !== id)
       ├─ Storage.set("tld_links", state.links)
       └─ QuickLinks.renderList()
```

### Theme Toggle

```
DOMContentLoaded
  └─ Theme.init()
       ├─ theme = Storage.get("tld_theme", "light")
       ├─ Theme.apply(theme)
       └─ sync checkbox checked state

[Toggle change]
  └─ Theme.toggle()
       ├─ theme = current === "light" ? "dark" : "light"
       ├─ Storage.set("tld_theme", theme)
       └─ Theme.apply(theme)
            └─ document.documentElement.dataset.theme = theme
```

---

## Error Handling

| Scenario | Handling |
|---|---|
| Empty task description | `alert("Task cannot be empty.")` — no state mutation |
| Duplicate task description | `alert("This task already exists.")` — no state mutation |
| Empty task on edit | `alert("Task cannot be empty.")` — revert edit view |
| Duplicate task on edit | `alert("This task already exists.")` — revert edit view |
| Empty label or URL for link | `alert("Both a label and a URL are required.")` — no state mutation |
| Invalid timer duration | Inline `#timer-error` message shown; no state mutation |
| LocalStorage read / parse error | `Storage.get` catches, returns fallback value; no uncaught exception |
| LocalStorage write failure (quota exceeded) | Not handled explicitly — acceptable for personal dashboard scope |
| `crypto.randomUUID` unavailable | Fallback to `Math.random` + `Date.now` string |

All browser `alert()` calls are intentional per the requirements specification. Inline error messaging is used only for the timer duration field (Req 4.3), where immediate feedback inline is a better UX than an alert.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Time formatting always produces HH:MM:SS

*For any* Date object, `formatTime(date)` SHALL return a string that matches the pattern `HH:MM:SS` where HH is zero-padded hours (00–23), MM is zero-padded minutes (00–59), and SS is zero-padded seconds (00–59).

**Validates: Requirements 1.1**

---

### Property 2: Date formatting always includes all required components

*For any* Date object, `formatDate(date)` SHALL return a string that contains the correct weekday name, full month name, numeric day of month, and four-digit year matching the Date's calendar values.

**Validates: Requirements 1.3**

---

### Property 3: Greeting is always correctly assigned for every hour of the day

*For any* integer hour in [0, 23], `getGreeting(hour)` SHALL return exactly one of: `"Good Morning"` (hours 5–11), `"Good Afternoon"` (hours 12–17), `"Good Evening"` (hours 18–20), or `"Good Night"` (hours 21–23 and 0–4). No hour shall fall into more than one range, and no valid hour shall return any other string.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

### Property 4: Timer display always produces MM:SS format

*For any* non-negative integer number of seconds `s` in [0, 5999], `formatTimer(s)` SHALL return a string matching `MM:SS` where MM is the zero-padded minute count and SS is the zero-padded seconds remainder, and `MM * 60 + SS_value === s`.

**Validates: Requirements 3.1**

---

### Property 5: Timer reset always restores exactly the configured duration

*For any* valid Pomodoro duration `D` (integer ≥ 1), after calling `Timer.reset()` with `D` as the current duration, the timer's remaining seconds SHALL equal `D * 60` and the display SHALL equal `formatTimer(D * 60)`.

**Validates: Requirements 3.5**

---

### Property 6: Timer duration validation correctly accepts and rejects all inputs

*For any* value `v`, `Timer.setDuration(v)` SHALL accept it (update state and LocalStorage) if and only if `v` is an integer ≥ 1. For any other value (non-integer, less than 1, NaN, empty string, negative), the duration and timer display SHALL remain unchanged and an error message SHALL be shown.

**Validates: Requirements 4.2, 4.3**

---

### Property 7: Pomodoro duration persists across init (round-trip)

*For any* valid duration `D` (integer ≥ 1) saved to LocalStorage under `tld_pomodoro_duration`, calling `Timer.init()` SHALL result in the timer displaying `formatTimer(D * 60)` and `state.pomodoroDuration === D`.

**Validates: Requirements 4.4, 4.5**

---

### Property 8: Task description is always trimmed before storage

*For any* non-empty string `s` (non-empty after trimming), when `addTask(s)` succeeds, the stored `task.description` SHALL equal `s.trim()`.

**Validates: Requirements 5.2, 6.2**

---

### Property 9: Whitespace-only task descriptions are always rejected

*For any* string composed entirely of whitespace characters (including empty string), calling `addTask(s)` or `editTask(id, s)` SHALL leave `state.tasks` unchanged and SHALL NOT persist any modification to LocalStorage.

**Validates: Requirements 5.3, 6.3**

---

### Property 10: Duplicate task descriptions are always rejected (case-insensitive)

*For any* existing task with description `T` and any new string `s` where `s.trim().toLowerCase() === T.toLowerCase()`, calling `addTask(s)` SHALL leave `state.tasks` unchanged. Similarly, calling `editTask(id, s)` on a different task SHALL leave that task's description unchanged.

**Validates: Requirements 5.4, 6.4**

---

### Property 11: Task addition is a faithful round-trip through LocalStorage

*For any* valid (non-empty, non-duplicate) task description `d`, after `addTask(d)` succeeds, `Storage.get("tld_tasks", [])` SHALL contain an entry where `description === d.trim()` and `completed === false`. Calling `Todo.init()` with that LocalStorage state SHALL result in `state.tasks` containing the same entry.

**Validates: Requirements 5.5, 5.7**

---

### Property 12: renderItem always produces all required controls for any task

*For any* Task object `t` (any id, any description, any `completed` value), `Todo.renderItem(t)` SHALL return a DOM element containing a completion toggle, an edit control, and a delete control, and the description text SHALL be visible in the element.

**Validates: Requirements 5.6**

---

### Property 13: Task edit round-trip preserves validity constraints

*For any* task `t` and any valid (non-empty, non-duplicate) new description `d`, after `editTask(t.id, d)` succeeds, `state.tasks` SHALL contain exactly one task with `id === t.id` and `description === d.trim()`, and LocalStorage SHALL reflect the same.

**Validates: Requirements 6.5**

---

### Property 14: Completion toggle is an involution (double-toggle = identity)

*For any* task `t` with any initial `completed` value, calling `toggleTask(t.id)` twice SHALL return the task to its original `completed` value. Calling it once SHALL flip `completed` to the opposite boolean. After each toggle, LocalStorage SHALL reflect the updated state.

**Validates: Requirements 7.1, 7.2, 7.3**

---

### Property 15: Task deletion removes exactly the targeted task

*For any* non-empty tasks array and *for any* task id `id` present in it, after `deleteTask(id)` completes, `state.tasks` SHALL contain no entry with `id === id`, the count of remaining tasks SHALL be one less than before, and LocalStorage SHALL reflect the same array.

**Validates: Requirements 7.4**

---

### Property 16: Link input values are always trimmed before storage

*For any* label `L` and URL `U` that are both non-empty after trimming, when `addLink(L, U)` succeeds, the stored link SHALL have `label === L.trim()` and `url === U.trim()`.

**Validates: Requirements 8.2**

---

### Property 17: Incomplete link submissions (empty label or URL) are always rejected

*For any* pair `(L, U)` where at least one of `L.trim()` or `U.trim()` is the empty string, calling `addLink(L, U)` SHALL leave `state.links` unchanged and SHALL NOT persist any modification to LocalStorage.

**Validates: Requirements 8.3**

---

### Property 18: Link addition is a faithful round-trip through LocalStorage

*For any* valid label `L` and URL `U` (both non-empty after trim), after `addLink(L, U)` succeeds, `Storage.get("tld_links", [])` SHALL contain an entry where `label === L.trim()` and `url === U.trim()`. Calling `QuickLinks.init()` with that LocalStorage state SHALL result in `state.links` containing the same entry.

**Validates: Requirements 8.4, 8.6**

---

### Property 19: Link deletion removes exactly the targeted link

*For any* non-empty links array and *for any* link id `id` present in it, after `deleteLink(id)` completes, `state.links` SHALL contain no entry with `id === id`, the count of remaining links SHALL be one less than before, and LocalStorage SHALL reflect the same array.

**Validates: Requirements 9.2**

---

### Property 20: Theme toggle always flips between exactly two states

*For any* current theme value (`"light"` or `"dark"`), calling `Theme.toggle()` SHALL change `document.documentElement.dataset.theme` to the opposite value, and `Storage.get("tld_theme", "light")` SHALL return the new value. Calling `Theme.toggle()` twice SHALL restore the original state.

**Validates: Requirements 10.2, 10.3**

---

### Property 21: Theme persists across init (round-trip)

*For any* theme value `T` (`"light"` or `"dark"`) saved to LocalStorage under `tld_theme`, calling `Theme.init()` SHALL set `document.documentElement.dataset.theme === T`.

**Validates: Requirements 10.4**

---

### Property 22: LocalStorage JSON serialization is a lossless round-trip

*For any* valid JavaScript value that the app writes to LocalStorage (tasks array, links array, theme string, duration number), `JSON.parse(JSON.stringify(value))` SHALL deeply equal the original value, and `Storage.get(key, fallback)` after `Storage.set(key, value)` SHALL return a deeply equal value.

**Validates: Requirements 11.2, 11.3**

---

## Testing Strategy

### Assessment of PBT Applicability

This feature consists of pure validation logic, data transformation functions (date/time formatting, greeting selection, serialization round-trips), and DOM-manipulation routines. Several acceptance criteria describe universal properties that hold for all valid inputs — making this feature suitable for property-based testing.

### Dual Testing Approach

**Unit / example-based tests** cover:
- Specific greeting boundary hours (e.g., exactly hour 5, 12, 18, 21, 0)
- Timer display format for known remaining values
- UI state transitions (edit mode open / cancel)
- Integration of Storage helpers with LocalStorage mock

**Property-based tests** cover:
- Universally quantified behaviors: serialization round-trips, greeting assignment, task validation, and timer display format
- Run minimum **100 iterations** per property
- Library recommendation: **fast-check** (JavaScript; works in browser via CDN or in Node.js via npm for testing)

### Test Tags

Each property-based test is tagged with a comment:

```js
// Feature: todo-life-dashboard, Property N: <property text>
```

### What Cannot Be Fully Automated

- Visual appearance (contrast, layout at 360 px) — requires manual/visual regression testing
- Timer drift under tab throttling — requires manual observation
- Cross-browser behavior — requires multi-browser smoke tests


# Implementation Plan: To-Do Life Dashboard

## Overview

Build a fully client-side, single-file-per-type personal productivity dashboard using plain HTML, CSS, and Vanilla JavaScript. The implementation proceeds in layers: project scaffold → CSS variables and layout → HTML widget markup → JS utility/storage layer → JS modules (Theme, Greeting, Timer, Todo, QuickLinks) → bootstrap wiring → cross-browser and responsive verification. No build tools, frameworks, or test setup infrastructure is required.

---

## Tasks

- [x] 1. Project scaffold — create file and folder structure
  - Create `index.html` at project root with an HTML5 boilerplate (`<!DOCTYPE html>`, `<meta charset>`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, link to `css/style.css`, script tag for `js/app.js` at end of `<body>`)
  - Create empty `css/style.css`
  - Create empty `js/app.js`
  - Verify the three files exist at `index.html`, `css/style.css`, `js/app.js`
  - _Requirements: 12.1, 12.2_

- [x] 2. CSS custom properties, theming, and layout grid
  - [x] 2.1 Define CSS custom properties and dark-theme overrides
    - Write `:root` block with all `--color-*`, `--space-*`, `--font-size-*`, `--radius-*`, `--shadow-*` variables as specified in the design
    - Write `[data-theme="dark"]` override block with dark-mode color values
    - _Requirements: 10.1, 10.2, 12.4_

  - [x] 2.2 Write base reset, body styles, and `.dashboard-header`
    - Apply `box-sizing: border-box` reset, set `background-color: var(--color-bg)`, `color: var(--color-text)`, base font family and size
    - Style `.dashboard-header` for the theme toggle row (flex, space-between or right-aligned)
    - _Requirements: 12.1, 12.3_

  - [x] 2.3 Write `.dashboard-grid` responsive CSS Grid layout
    - Implement `display: grid` with `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))` and `gap: var(--space-md)`
    - Add `@media (max-width: 767px)` override setting `grid-template-columns: 1fr`
    - Ensure no horizontal overflow at 360 px (set `min-width: 0` on grid children if needed)
    - _Requirements: 12.3_

  - [x] 2.4 Write `.widget` card styles and utility classes
    - Style `.widget` with `background: var(--color-surface)`, padding, `border-radius: var(--radius-md)`, `box-shadow: var(--shadow-sm)`
    - Add `.hidden` → `display: none`, `.error-msg` → `color: var(--color-error); font-size: var(--font-size-sm)`, `.completed .todo-text` → `text-decoration: line-through; color: var(--color-text-muted)`
    - _Requirements: 12.1, 12.4_

  - [x] 2.5 Write theme-toggle switch styles
    - Style `.theme-toggle`, `.toggle-track`, `.toggle-thumb` as a pill-shaped CSS toggle switch
    - Reflect checked state via `input:checked ~ .toggle-track .toggle-thumb` transform
    - _Requirements: 10.1_

  - [x] 2.6 Write widget-specific scoped styles for all four widgets
    - Greeting: centered text, large clock (`font-size: var(--font-size-xxl)`), muted date
    - Timer: large display, button row flex layout, config row flex layout
    - Todo: input row flex, `ul` reset (no bullets), `li` flex row with gap
    - Quick Links: input row flex, links container flex wrap, `.link-btn` button style, `.link-delete-btn` small × style
    - _Requirements: 12.1, 12.4_

- [x] 3. HTML markup for all widgets
  - [x] 3.1 Write `<header>` and `<main>` skeleton in `index.html`
    - Add `<body data-theme="light">`, `<header class="dashboard-header">` with theme toggle markup (label, checkbox `id="theme-toggle-input"`, toggle track/thumb spans)
    - Add `<main class="dashboard-grid">`
    - _Requirements: 10.1, 12.1_

  - [x] 3.2 Write Greeting widget markup
    - Inside `<section id="greeting-widget" class="widget">`: `<p id="greeting-text">`, `<p id="clock-display">`, `<p id="date-display">`
    - _Requirements: 1.1, 1.3, 2.1_

  - [x] 3.3 Write Timer widget markup
    - Inside `<section id="timer-widget" class="widget">`: `<div id="timer-display">25:00</div>`, `<div id="timer-error" class="error-msg hidden"></div>`, Start / Stop / Reset buttons, duration input (`id="timer-duration-input"`, `type="number"`, `min="1"`), Set Duration button
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 4.1_

  - [x] 3.4 Write Todo widget markup
    - Inside `<section id="todo-widget" class="widget">`: `<div class="todo-input-row">` with `<input id="todo-input">` and `<button id="todo-add">Add</button>`, `<ul id="todo-list"></ul>`
    - _Requirements: 5.1, 5.6_

  - [x] 3.5 Write Quick Links widget markup
    - Inside `<section id="quicklinks-widget" class="widget">`: `<div class="quicklinks-input-row">` with label input (`id="link-label-input"`), URL input (`id="link-url-input"`), Add Link button (`id="link-add"`), `<div id="quicklinks-list"></div>`
    - _Requirements: 8.1_

- [x] 4. Storage helpers and ID generator (`js/app.js`)
  - [x] 4.1 Implement `Storage.get` and `Storage.set`
    - `Storage.get(key, fallback)`: call `localStorage.getItem(key)`, return `fallback` if null, `JSON.parse(raw)` inside try/catch returning `fallback` on error
    - `Storage.set(key, value)`: call `localStorage.setItem(key, JSON.stringify(value))`
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 4.2 Write property test for Storage round-trip (Property 22)
    - **Property 22: LocalStorage JSON serialization is a lossless round-trip**
    - For any valid app value (task array, links array, theme string, duration number): `Storage.get(key)` after `Storage.set(key, value)` returns a deeply equal value; `Storage.get` on a missing key returns the fallback; `Storage.get` on a corrupt value returns the fallback without throwing
    - **Validates: Requirements 11.2, 11.3, 11.4**

  - [x] 4.3 Implement `generateId()`
    - Use `crypto.randomUUID()` if available; fallback to `Math.random().toString(36).slice(2) + Date.now().toString(36)`
    - _Requirements: 11.1_

- [x] 5. Theme module
  - [x] 5.1 Implement `Theme.apply`, `Theme.toggle`, `Theme.init`
    - `Theme.apply(t)`: set `document.documentElement.dataset.theme = t`
    - `Theme.toggle()`: read current theme from `document.documentElement.dataset.theme`, flip to opposite, call `Storage.set("tld_theme", newTheme)`, call `Theme.apply(newTheme)`
    - `Theme.init()`: read `Storage.get("tld_theme", "light")`, call `Theme.apply`, sync `#theme-toggle-input` checkbox checked state, attach `change` listener to checkbox calling `Theme.toggle()`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 5.2 Write property test for Theme toggle (Properties 20, 21)
    - **Property 20: Theme toggle always flips between exactly two states** — Toggle once: value changes. Toggle twice: original value restored. `Storage.get("tld_theme")` reflects new value after each toggle
    - **Property 21: Theme persists across init (round-trip)** — For any theme `T` saved to LocalStorage, `Theme.init()` sets `document.documentElement.dataset.theme === T`
    - **Validates: Requirements 10.2, 10.3, 10.4**

- [x] 6. Greeting module
  - [x] 6.1 Implement `Greeting.getGreeting(hour)`, `Greeting.formatTime(date)`, `Greeting.formatDate(date)`
    - `getGreeting(hour)`: return `"Good Morning"` for 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–20, `"Good Night"` for 21–23 and 0–4
    - `formatTime(date)`: zero-pad hours, minutes, seconds → `"HH:MM:SS"`
    - `formatDate(date)`: use arrays of weekday/month names → `"Weekday, Month DD, YYYY"`
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 6.2 Write property tests for Greeting pure functions (Properties 1, 2, 3)
    - **Property 1: Time formatting always produces HH:MM:SS** — For any Date, `formatTime(date)` matches `/^\d{2}:\d{2}:\d{2}$/` with each part in valid range
    - **Property 2: Date formatting always includes all required components** — For any Date, `formatDate(date)` includes correct weekday name, month name, numeric day, and four-digit year
    - **Property 3: Greeting is correctly assigned for every hour 0–23** — No hour returns a wrong greeting; no hour returns more than one; no valid hour returns an unexpected string
    - **Validates: Requirements 1.1, 1.3, 2.1, 2.2, 2.3, 2.4**

  - [x] 6.3 Implement `Greeting.init` and `Greeting.tick`
    - `Greeting.tick()`: create `new Date()`, update `#clock-display`, `#date-display`, `#greeting-text` via the pure helpers
    - `Greeting.init()`: call `Greeting.tick()` once immediately, then `setInterval(Greeting.tick, 1000)`
    - _Requirements: 1.1, 1.2, 1.3, 2.5_

- [x] 7. Timer module
  - [x] 7.1 Implement `Timer.render` and `formatTimer(seconds)` helper
    - `formatTimer(s)`: zero-pad `Math.floor(s/60)` and `s%60` → `"MM:SS"`
    - `Timer.render()`: set `document.getElementById("timer-display").textContent = formatTimer(state.pomodoroRemaining)`
    - _Requirements: 3.1_

  - [x] 7.2 Write property test for timer display format (Property 4)
    - **Property 4: Timer display always produces MM:SS format**
    - For any integer `s` in [0, 5999], `formatTimer(s)` matches `/^\d{2}:\d{2}$/` and `MM * 60 + SS === s`
    - **Validates: Requirements 3.1**

  - [x] 7.3 Implement `Timer.init`
    - Read `Storage.get("tld_pomodoro_duration", 25)`, set `state.pomodoroDuration` and `state.pomodoroRemaining = state.pomodoroDuration * 60`, call `Timer.render()`
    - Pre-populate `#timer-duration-input` with saved duration
    - _Requirements: 3.2, 4.5_

  - [ ]* 7.4 Write property test for Timer init round-trip (Property 7)
    - **Property 7: Pomodoro duration persists across init (round-trip)**
    - For any valid `D` (integer ≥ 1) in LocalStorage under `tld_pomodoro_duration`, `Timer.init()` results in `state.pomodoroDuration === D` and `#timer-display` shows `formatTimer(D * 60)`
    - **Validates: Requirements 4.4, 4.5**

  - [x] 7.5 Implement `Timer.start`, `Timer.stop`, `Timer.reset`, `Timer.tick`
    - `Timer.start()`: guard if already running; set `state.pomodoroRunning = true`, `intervalId = setInterval(Timer.tick, 1000)`, disable Start button, enable Stop button
    - `Timer.tick()`: decrement `state.pomodoroRemaining`; call `Timer.render()`; if `remaining === 0`: call `Timer.stop()`, then `alert("Focus session complete!")`
    - `Timer.stop()`: `clearInterval(intervalId)`, `intervalId = null`, `state.pomodoroRunning = false`, re-enable Start button
    - `Timer.reset()`: call `Timer.stop()`, set `state.pomodoroRemaining = state.pomodoroDuration * 60`, call `Timer.render()`
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

  - [ ]* 7.6 Write property test for Timer reset (Property 5)
    - **Property 5: Timer reset always restores exactly the configured duration**
    - For any valid duration `D`, after `Timer.reset()`, `state.pomodoroRemaining === D * 60` and `#timer-display` equals `formatTimer(D * 60)`
    - **Validates: Requirements 3.5**

  - [x] 7.7 Implement `Timer.setDuration` and wire Set Duration button
    - `Timer.setDuration(v)`: parse as integer; if `!Number.isInteger(v) || v < 1`: show `#timer-error` message, return early; else: hide `#timer-error`, `Storage.set("tld_pomodoro_duration", v)`, `state.pomodoroDuration = v`, call `Timer.reset()`
    - In `Timer.init()`: attach `click` listener to `#timer-duration-set` and `keydown Enter` listener to `#timer-duration-input` both calling `Timer.setDuration(parseInt(input.value))`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 7.8 Write property test for Timer duration validation (Property 6)
    - **Property 6: Timer duration validation correctly accepts and rejects all inputs**
    - For any value `v`: accepted iff `Number.isInteger(v) && v >= 1`; for any other value, duration and display remain unchanged and `#timer-error` is visible
    - **Validates: Requirements 4.2, 4.3**

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Todo module
  - [x] 9.1 Implement `Todo.isDuplicate(desc, excludeId)`
    - Return `true` if any task in `state.tasks` (excluding `excludeId`) has `description.toLowerCase() === desc.toLowerCase()`
    - _Requirements: 5.4, 6.4_

  - [ ]* 9.2 Write property test for duplicate detection (Property 10)
    - **Property 10: Duplicate task descriptions are always rejected (case-insensitive)**
    - For any existing task with description `T` and any string `s` where `s.trim().toLowerCase() === T.toLowerCase()`, `addTask(s)` leaves `state.tasks` unchanged; `editTask(id, s)` on a different task leaves that task unchanged
    - **Validates: Requirements 5.4, 6.4**

  - [x] 9.3 Implement `Todo.addTask(description)`
    - Trim; if empty → `alert("Task cannot be empty.")`; if duplicate → `alert("This task already exists.")`; else create task `{ id: generateId(), description: trimmed, completed: false }`, push to `state.tasks`, `Storage.set("tld_tasks", state.tasks)`, call `Todo.renderList()`, clear input field
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ]* 9.4 Write property tests for task add validation (Properties 8, 9, 11)
    - **Property 8: Task description is always trimmed before storage** — `addTask(s)` stores `s.trim()`
    - **Property 9: Whitespace-only task descriptions are always rejected** — Any whitespace-only or empty string leaves `state.tasks` unchanged
    - **Property 11: Task addition is a faithful round-trip through LocalStorage** — After `addTask(d)`, `Storage.get("tld_tasks", [])` contains entry with `description === d.trim()` and `completed === false`
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.7**

  - [x] 9.5 Implement `Todo.renderItem(task)` and `Todo.renderList()`
    - `renderItem(task)`: create `<li data-id="..." class="todo-item [completed]">` with checkbox (`.todo-toggle`, set `checked` from `task.completed`), `<span class="todo-text">`, hidden edit input (`.todo-edit-input`), Edit / Save / Cancel / Delete buttons per design spec
    - `renderList()`: clear `#todo-list`, for each task in `state.tasks` append `renderItem(task)`
    - _Requirements: 5.6, 5.7_

  - [ ]* 9.6 Write property test for renderItem output (Property 12)
    - **Property 12: renderItem always produces all required controls for any task**
    - For any Task object (any id, description, completed value), `renderItem(t)` returns a DOM element containing a `.todo-toggle`, `.todo-edit-btn`, `.todo-delete-btn`, and visible description text
    - **Validates: Requirements 5.6**

  - [x] 9.7 Implement `Todo.editTask`, `Todo.toggleTask`, `Todo.deleteTask`
    - `editTask(id, newDesc)`: trim; if empty → alert; if duplicate (excluding id) → alert; else update task in `state.tasks`, `Storage.set`, `renderList()`
    - `toggleTask(id)`: flip `task.completed`, `Storage.set`, `renderList()`
    - `deleteTask(id)`: filter out task, `Storage.set`, `renderList()`
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_

  - [ ]* 9.8 Write property tests for editTask, toggleTask, deleteTask (Properties 13, 14, 15)
    - **Property 13: Task edit round-trip preserves validity constraints** — After `editTask(t.id, d)`, exactly one task has `id === t.id` and `description === d.trim()`; LocalStorage reflects same
    - **Property 14: Completion toggle is an involution** — `toggleTask` twice restores original `completed`; once flips it; LocalStorage reflects each state
    - **Property 15: Task deletion removes exactly the targeted task** — After `deleteTask(id)`, no task has that id; count is one less; LocalStorage reflects same
    - **Validates: Requirements 6.5, 7.1, 7.2, 7.3, 7.4**

  - [x] 9.9 Implement `Todo.init` and wire event listeners
    - `Todo.init()`: load `state.tasks = Storage.get("tld_tasks", [])`, call `renderList()`, attach `click` on `#todo-add` and `keydown Enter` on `#todo-input` calling `Todo.addTask(input.value)`, attach event delegation on `#todo-list` for `.todo-toggle` → `toggleTask`, `.todo-edit-btn` → open edit mode (show edit input, hide span, show Save/Cancel, hide Edit), `.todo-save-btn` → `editTask`, `.todo-cancel-btn` → restore display, `.todo-delete-btn` → `deleteTask`
    - _Requirements: 5.1, 5.7, 6.1, 6.6_

- [x] 10. Quick Links module
  - [x] 10.1 Implement `QuickLinks.addLink`, `QuickLinks.deleteLink`
    - `addLink(label, url)`: trim both; if either empty → `alert("Both a label and a URL are required.")`; else create link `{ id: generateId(), label: trimmed, url: trimmed }`, push to `state.links`, `Storage.set("tld_links", state.links)`, call `renderList()`
    - `deleteLink(id)`: filter out link, `Storage.set`, `renderList()`
    - _Requirements: 8.2, 8.3, 8.4, 9.2_

  - [ ]* 10.2 Write property tests for Quick Links (Properties 16, 17, 18, 19)
    - **Property 16: Link input values are always trimmed before storage** — `addLink(L, U)` stores `L.trim()` and `U.trim()`
    - **Property 17: Incomplete link submissions (empty label or URL) are always rejected** — Any pair where either trim is empty leaves `state.links` unchanged
    - **Property 18: Link addition is a faithful round-trip through LocalStorage** — After `addLink(L, U)`, `Storage.get("tld_links", [])` contains entry with trimmed label and url; `QuickLinks.init()` restores same
    - **Property 19: Link deletion removes exactly the targeted link** — After `deleteLink(id)`, no link has that id; count is one less; LocalStorage reflects same
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.6, 9.2**

  - [x] 10.3 Implement `QuickLinks.renderList` and `QuickLinks.init`
    - `renderList()`: clear `#quicklinks-list`; for each link in `state.links` create `<div class="link-item" data-id="...">` containing `<a href="..." target="_blank" rel="noopener noreferrer" class="link-btn">label</a>` and `<button class="link-delete-btn">×</button>`, append to container
    - `QuickLinks.init()`: load `state.links = Storage.get("tld_links", [])`, call `renderList()`, attach `click` on `#link-add` and `keydown Enter` on both inputs, attach event delegation on `#quicklinks-list` for `.link-delete-btn` → `deleteLink`
    - _Requirements: 8.1, 8.4, 8.5, 8.6, 9.1_

- [x] 11. Bootstrap — wire DOMContentLoaded
  - Add `document.addEventListener("DOMContentLoaded", () => { Theme.init(); Greeting.init(); Timer.init(); Todo.init(); QuickLinks.init(); })` at the bottom of `js/app.js`
  - Verify the script tag in `index.html` is placed at end of `<body>` (or has `defer`)
  - Open `index.html` in a browser and confirm all four widgets render, the clock ticks, the theme toggle works, and no console errors appear
  - _Requirements: 12.5_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Cross-browser and responsive verification
  - [x] 13.1 Verify 360 px viewport rendering
    - Resize browser to 360 px wide and confirm no horizontal scrollbar appears, all widgets stack in a single column, and all controls are usable
    - _Requirements: 12.3_

  - [x] 13.2 Verify theme contrast and visual styles
    - Toggle between light and dark modes and confirm text remains readable against its background in both themes; check Greeting, Timer, Todo, and Quick Links widgets
    - _Requirements: 12.4_

  - [x] 13.3 Verify cross-browser smoke test
    - Open `index.html` in at least two of: Chrome, Firefox, Edge, Safari; confirm all widgets display correctly and no JavaScript errors appear in DevTools console
    - _Requirements: 12.5_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery
- Each task references specific requirements for full traceability
- Checkpoints (tasks 8 and 12) ensure incremental validation at natural breaks
- The design's Correctness Properties section is extensive — property tests cover all 22 defined properties
- All modules are plain objects in a single `app.js` file; no ES module syntax, no bundler
- `state.pomodoroRemaining` and `state.pomodoroRunning` are intentionally not persisted — a partial Pomodoro resets on page load
- `alert()` is used per requirements for task/link validation feedback; inline error is used only for timer duration (Req 4.3)

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "3.2", "3.3", "3.4", "3.5", "4.1", "4.3"] },
    { "id": 3, "tasks": ["2.6", "4.2", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3"] },
    { "id": 7, "tasks": ["7.4", "7.5"] },
    { "id": 8, "tasks": ["7.6", "7.7"] },
    { "id": 9, "tasks": ["7.8", "9.1"] },
    { "id": 10, "tasks": ["9.2", "9.3"] },
    { "id": 11, "tasks": ["9.4", "9.5"] },
    { "id": 12, "tasks": ["9.6", "9.7", "10.1"] },
    { "id": 13, "tasks": ["9.8", "9.9", "10.2"] },
    { "id": 14, "tasks": ["10.3"] },
    { "id": 15, "tasks": ["11"] },
    { "id": 16, "tasks": ["13.1", "13.2", "13.3"] }
  ]
}
```

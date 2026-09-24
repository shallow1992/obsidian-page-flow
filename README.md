# Page Flow for Obsidian

Effortless note reading and triage in Obsidian. Scroll page-by-page and seamlessly transition to the next file with single hotkeys.

## ✨ Key Features

- **Hybrid Navigation (Scroll or Next/Prev File)**:
  - Scroll down by a configurable page percentage (default 85%).
  - When the bottom of the current note is reached, pressing the hotkey again seamlessly opens the next file in the folder.
  - Reverse navigation works symmetrically: scrolling up jumps to the bottom of the previous file when the top is reached.
- **Dedicated Independent Commands**:
  - `Scroll page down` / `Scroll page up`: Pure in-note scrolling without switching files.
  - `Go to next file` / `Go to previous file`: Direct file transitions regardless of scroll position.
- **Configurable Rules & Behavior**:
  - Customizable scroll percentage (50% to 100%).
  - Smooth or instant scrolling animations.
  - Flexible file sorting: by filename, creation time, or modification time (ascending/descending).
  - Configurable loop behavior (wrap around vs notice) and boundary threshold.

## ⌨️ Recommended Hotkey Setup

Configure hotkeys in **Settings > Hotkeys**:
- `Forward: Scroll Down or Next File` -> `Alt + Space` (or `Page Down`, `Alt + J`)
- `Backward: Scroll Up or Previous File` -> `Alt + Shift + Space` (or `Page Up`, `Alt + K`)
- `Go to Next File` -> `Alt + Down`
- `Go to Previous File` -> `Alt + Up`

## 🛠️ Development (Docker Isolation)

All builds and tests must run inside Docker:

```bash
# Build production bundle (main.js)
docker compose run --rm page-flow npm run build

# Run unit tests
docker compose run --rm page-flow npm test

# Watch mode for development
docker compose run --rm page-flow npm run dev
```

## 📄 License

MIT

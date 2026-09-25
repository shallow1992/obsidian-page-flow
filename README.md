# Page Flow for Obsidian

Effortless note reading, inspection, and triage in Obsidian. Scroll page-by-page and seamlessly transition to the next file with single hotkeys.

Inspired by RSS readers and e-book pagers, **Page Flow** lets you glide through entire folders of notes without ever touching your mouse or trackpad.

---

## ✨ Key Features

### 1. 🔄 Hybrid Single-Key Navigation (`Scroll or Next / Previous File`)
* **Forward Navigation**:
  * Press your hotkey to scroll down note content by a configurable percentage (default: **85%**).
  * When the bottom of the current note is reached, pressing the hotkey again seamlessly opens the next file in the folder, positioning you right at the top.
* **Symmetrical Backward Navigation**:
  * Scrolling up reaches the top of the current note, then seamlessly opens the previous file—positioned right at the bottom so you can read backwards naturally.
* **Fly-by Protection**:
  * During rapid scrolling, target reaches the bottom safely while the view smoothly catches up, preventing premature or accidental file switches.

### 2. 📂 Visual File Explorer Order Tracking
* Naturally follows the visual top-to-bottom file order seen in Obsidian's left sidebar File Explorer.
* Supports manual folder file arrangements and custom sorting modes.
* Strictly scoped to the current folder—never accidentally jumps out into unrelated directories.
* Six additional sorting rules are also available (alphabetical ascending/descending, creation time, modification time).

### 3. 🚀 Continuous Momentum Physics & Tuning
* **Rapid Consecutive Tap Acceleration**:
  * Rapidly tapping the hotkey seamlessly ramps up cruising speed without resetting velocity or stuttering.
  * Dynamically scales both velocity and single-tap distance in sync to maintain smooth flight.
* **Configurable Queue Cap**:
  * Set the maximum queued screens (default: **5.0 screens**, range: 1.0 to 15.0). Keeps deceleration crisp and predictable.
* **Configurable Acceleration Multiplier**:
  * Tune maximum speed from **1.0x** (steady, no acceleration) up to **5.0x** (ultra-fast cruising). Default is a mild, controllable **2.2x**.
* **CodeMirror 6 Layout-Shift Resistance**:
  * Reliably delivers the intended scroll distance even when CodeMirror dynamically recalculates virtual line heights in long documents.

### 4. ⌨️ Dedicated Independent Commands
In addition to hybrid navigation, dedicated commands are available for focused workflows:
* `Scroll page down` / `Scroll page up`: Pure in-note scrolling without switching files.
* `Go to next file in folder` / `Go to previous file in folder`: Instant file navigation regardless of scroll position.

---

## ⌨️ Recommended Hotkey Setup

Configure your preferred hotkeys in **Settings > Hotkeys** (search for `Page Flow`):

| Command | Recommended Hotkey | Description |
| :--- | :--- | :--- |
| **Forward: Scroll down or go to next file** | `Alt + Space` (or `PageDown`, `Alt + J`) | Primary forward reading step |
| **Backward: Scroll up or go to previous file** | `Alt + Shift + Space` (or `PageUp`, `Alt + K`) | Primary backward review step |
| **Scroll page down** | `Space` / `PageDown` | In-note scroll only |
| **Scroll page up** | `Shift + Space` / `PageUp` | In-note scroll only |
| **Go to next file in folder** | `Alt + Down` | Jump to next note |
| **Go to previous file in folder** | `Alt + Up` | Jump to previous note |

---

## ⚙️ Settings & Defaults

| Setting | Default | Range / Options | Description |
| :--- | :--- | :--- | :--- |
| **Scroll amount (%)** | `85%` | 50% – 100% (step: 5%) | Percentage of viewport height to scroll on each step. Retains 15% context for smooth reading. |
| **Smooth scrolling** | `ON` | Toggle | Animates scrolling smoothly between page steps. |
| **Scroll animation duration (ms)** | `280 ms` | 100 – 1,000 ms (step: 20 ms) | Base duration of smooth scroll animation. Accelerates on rapid taps. |
| **Maximum queued scroll (screens)** | `5.0` | 1.0 – 15.0 (step: 0.5) | Maximum screens to queue ahead during rapid presses. At 85% scroll, 5 screens allows ~6 rapid taps. |
| **Maximum acceleration multiplier** | `2.2` | 1.0x – 5.0x (step: 0.1x) | Maximum cruising velocity multiplier under rapid consecutive key presses. |
| **File sort order** | `File explorer order` | 7 choices | Order for navigating folder files. Follows sidebar layout by default. |
| **Loop folder navigation** | `OFF` | Toggle | When reaching the last file, cycles back to the first file. |
| **Boundary threshold (px)** | `10 px` | 0 – 50 px (step: 5 px) | Buffer in pixels to detect note top/bottom boundaries. |
| **Reset to default settings** | — | Button | Resets all settings back to recommended initial values with one click. |

---

## 📦 Installation

### From Obsidian Community Plugins (Recommended once approved)
1. Open **Settings > Community plugins**.
2. Turn on Community plugins.
3. Click **Browse** and search for `Page Flow`.
4. Click **Install**, then **Enable**.

### Beta Testing via BRAT
1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat) from Community plugins.
2. In BRAT settings, click **Add Beta plugin**.
3. Enter `shallow1992/obsidian-page-flow`.
4. Enable **Page Flow** in Community plugins.

---

## 🛠️ Development & Testing

All builds, tests, and verifications run isolated inside Docker:

```bash
# Run unit tests (Vitest)
docker compose run --rm page-flow npm test

# Build production bundle (main.js)
docker compose run --rm page-flow npm run build

# Watch mode for local development
docker compose run --rm page-flow npm run dev
```

---

## 🔒 Privacy & Security

* **100% Local & Offline**: Page Flow performs zero network requests, contains zero telemetry or tracking code, and never accesses external services.
* **Zero Plaintext Secrets**: No credentials or tokens are ever stored.
* **Safe Read-Only Navigation**: Page Flow only navigates active leaves and reads folder contents—it never modifies, deletes, or overwrites your notes.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

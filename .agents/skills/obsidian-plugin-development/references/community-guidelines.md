# Community Plugin Submission & Review Guidelines

Based on [Obsidian Developer Docs: Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).

---

## 1. Plugin Manifest Requirements (`manifest.json`)

The `manifest.json` file must reside in the root of the repository and adhere to the strict schema:

```json
{
  "id": "obsidian-sample-plugin",
  "name": "Sample Plugin",
  "version": "1.0.0",
  "minAppVersion": "1.5.0",
  "description": "A clean description of the plugin functionality.",
  "author": "Your Name",
  "authorUrl": "https://github.com/your-username",
  "fundingUrl": "https://buymeacoffee.com/your-username",
  "isDesktopOnly": false
}
```

### Critical Rules
- **`id`**: Lowercase alphanumeric and hyphens only (`^[a-z0-9-]+$`). No spaces.
- **`isDesktopOnly`**: Set to `true` ONLY if the plugin genuinely relies on desktop-only native features (e.g., local process spawning).
- **`minAppVersion`**: Must match the minimum Obsidian version required by the APIs used.

---

## 2. CSS Scoping & Global Style Pollution Prevention

Never apply styles directly to global tags (e.g., `body`, `button`, `.workspace-leaf`). Always scope styles under your plugin's custom class:

```css
/* ❌ BAD: Pollutes global UI */
button {
    background-color: blue;
}

/* ✅ GOOD: Scoped to plugin container */
.my-plugin-container button {
    background-color: var(--interactive-accent);
}
```

---

## 3. Security, Privacy & User Consent

1. **Explicit Consent for Telemetry**: Do NOT collect analytics or telemetry without explicit opt-in from the user.
2. **Data Integrity**: Never silently delete or overwrite user data without confirmation or backup.
3. **No Dynamic Code Evaluation**: `eval()` and `new Function()` with remote code are strictly prohibited during community review.

---

## 4. Release Workflow & Artifacts

A GitHub Release must contain exactly three assets attached:
1. `main.js` (Compiled JavaScript bundle)
2. `manifest.json` (Release manifest matching git tag)
3. `styles.css` (Styles, if any)

### Example GitHub Actions Release Workflow (`.github/workflows/release.yml`)

```yaml
name: Release Plugin

on:
  push:
    tags:
      - "*"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            main.js
            manifest.json
            styles.css
```

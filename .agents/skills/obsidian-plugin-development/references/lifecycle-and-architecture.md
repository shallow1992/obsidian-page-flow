# Plugin Lifecycle & Architecture Guidelines

Based on [Obsidian Developer Docs: Plugin Lifecycle](https://docs.obsidian.md/Plugins/Getting+started/Plugin+anatomy).

---

## 1. Plugin Lifecycle Overview

An Obsidian plugin extends the `Plugin` class from the `obsidian` package.

```typescript
import { Plugin } from "obsidian";

export default class MyPlugin extends Plugin {
    async onload(): Promise<void> {
        console.log("Loading plugin...");
        await this.loadSettings();
        this.addSettingTab(new MySettingTab(this.app, this));
        this.registerCommands();
    }

    onunload(): void {
        console.log("Unloading plugin...");
        // Obsidian automatically cleans up registered events, intervals, and DOM events.
    }
}
```

---

## 2. Safe Resource Registration (Preventing Memory Leaks)

Obsidian provides managed registration methods that **automatically clean up resources** when the plugin is disabled or reloaded.

### ✅ DO: Use Managed Registration

```typescript
// 1. Register Vault / Workspace Events
this.registerEvent(
    this.app.vault.on("modify", (file) => {
        console.log("Modified:", file.path);
    })
);

// 2. Register DOM Events
this.registerDomEvent(window, "visibilitychange", () => {
    if (document.visibilityState === "visible") {
        this.sync();
    }
});

// 3. Register Interval Timers
this.registerInterval(
    window.setInterval(() => {
        this.periodicTask();
    }, 5 * 60 * 1000)
);
```

### ❌ DON'T: Unmanaged Listeners (Memory Leak Antipattern)

```typescript
// BAD: Will remain active after plugin is disabled!
window.setInterval(() => { ... }, 1000);
document.addEventListener("click", () => { ... });
```

---

## 3. Settings Management (Deep Merge & Migration)

Settings should be persisted using `this.loadData()` and `this.saveData()`.

### Deep Merge Pattern

When new settings fields are introduced in plugin updates, shallow merge (`Object.assign`) will overwrite nested objects. Always use a deep merge or explicit fallback:

```typescript
interface MyPluginSettings {
    syncMasterEnabled: boolean;
    filters: {
        maxFileSizeMB: number;
        modeMarkdown: string;
    };
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    syncMasterEnabled: true,
    filters: {
        maxFileSizeMB: 25,
        modeMarkdown: "regular",
    },
};

async loadSettings(): Promise<void> {
    const loadedData = await this.loadData();
    this.settings = {
        ...DEFAULT_SETTINGS,
        ...loadedData,
        filters: {
            ...DEFAULT_SETTINGS.filters,
            ...(loadedData?.filters || {}),
        },
    };
}

async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
}
```

---

## 4. Commands, Ribbon Icons & Status Bar

```typescript
// 1. Add Command with Keyboard Shortcut
this.addCommand({
    id: "trigger-sync",
    name: "Sync Now",
    callback: () => this.sync(),
    hotkeys: [{ modifiers: ["Mod", "Shift"], key: "s" }],
});

// 2. Add Ribbon Icon
const ribbonIconEl = this.addRibbonIcon("refresh-cw", "Sync with Google Drive", (evt: MouseEvent) => {
    this.sync();
});

// 3. Add Status Bar Item (Desktop primary, compact on mobile)
const statusBarEl = this.addStatusBarItem();
statusBarEl.setText("✓ Synced");
```

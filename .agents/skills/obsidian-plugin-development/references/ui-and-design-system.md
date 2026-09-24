# Obsidian Design System & UI Components Guide

Based on [Obsidian Developer Docs: User Interface](https://docs.obsidian.md/Plugins/User+interface/Settings).

---

## 1. Plugin Settings Tab (`PluginSettingTab` & `Setting`)

Use `Setting` components to build native, responsive settings interfaces.

### Example: Setting Tab with Sections & Password Masking

```typescript
import { App, PluginSettingTab, Setting, setIcon } from "obsidian";
import MyPlugin from "../main";

export class MySettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: MyPlugin) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // 1. Section Header
        new Setting(containerEl)
            .setName("Authentication Settings")
            .setHeading();

        // 2. Text Input with Password Mask
        new Setting(containerEl)
            .setName("Client Secret")
            .setDesc("Stored securely in OS Keychain.")
            .addText((text) => {
                text.inputEl.type = "password"; // Mask password
                text.setValue(this.plugin.settings.clientSecret || "")
                    .onChange(async (value) => {
                        this.plugin.settings.clientSecret = value;
                        await this.plugin.saveSettings();
                    });
            });

        // 3. Toggle Setting
        new Setting(containerEl)
            .setName("Auto-Sync on Startup")
            .setDesc("Automatically sync when Obsidian launches.")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.autoSyncOnStartup)
                    .onChange(async (value) => {
                        this.plugin.settings.autoSyncOnStartup = value;
                        await this.plugin.saveSettings();
                    });
            });

        // 4. Dropdown Setting
        new Setting(containerEl)
            .setName("Conflict Resolution Policy")
            .setDesc("Choose how simultaneous edits are resolved.")
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("newer_priority", "Newer Modification Priority")
                    .addOption("remote_priority", "Cloud Priority")
                    .addOption("local_priority", "Local Priority")
                    .addOption("create_conflict_file", "Create Conflict Copy")
                    .setValue(this.plugin.settings.conflictPolicy)
                    .onChange(async (value) => {
                        this.plugin.settings.conflictPolicy = value;
                        await this.plugin.saveSettings();
                    });
            });

        // 5. Button with Call-To-Action (CTA) or Warning
        new Setting(containerEl)
            .setName("Manual Action")
            .addButton((btn) => {
                btn.setButtonText("Sync Now")
                   .setCta() // Highlight button with accent color
                   .onClick(() => this.plugin.sync());
            })
            .addButton((btn) => {
                btn.setButtonText("Disconnect")
                   .setWarning() // Red danger color
                   .onClick(() => this.plugin.disconnect());
            });
    }
}
```

---

## 2. Native Modals (`Modal`)

```typescript
import { App, Modal, Setting } from "obsidian";

export class ConfirmModal extends Modal {
    constructor(app: App, private onConfirm: () => void) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h2", { text: "Confirm Action" });
        contentEl.createEl("p", { text: "Are you sure you want to proceed?" });

        new Setting(contentEl)
            .addButton((btn) => {
                btn.setButtonText("Cancel")
                   .onClick(() => this.close());
            })
            .addButton((btn) => {
                btn.setButtonText("Confirm")
                   .setCta()
                   .onClick(() => {
                       this.onConfirm();
                       this.close();
                   });
            });
    }

    onClose(): void {
        this.contentEl.empty();
    }
}
```

---

## 3. Autocomplete Suggest (`AbstractInputSuggest`)

```typescript
import { App, AbstractInputSuggest, TFolder } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<TFolder> {
    constructor(app: App, textInputEl: HTMLInputElement) {
        super(app, textInputEl);
    }

    protected getSuggestions(query: string): TFolder[] {
        const lowerQuery = query.toLowerCase();
        const allFiles = this.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];

        for (const file of allFiles) {
            if (file instanceof TFolder && file.path && file.path !== "/") {
                if (file.path.toLowerCase().includes(lowerQuery)) {
                    folders.push(file);
                }
            }
        }
        return folders;
    }

    renderSuggestion(folder: TFolder, el: HTMLElement): void {
        el.setText(folder.path);
    }

    selectSuggestion(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
        this.setValue(folder.path);
        this.close();
    }
}
```

---

## 4. CSS Variables & Theme Compatibility

Always use Obsidian's CSS custom properties to ensure full compatibility with Light, Dark, and custom themes:

```css
/* Container styling */
.my-plugin-card {
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-m);
    padding: var(--size-4-3);
    color: var(--text-normal);
}

/* Badge colors */
.my-badge-success {
    background-color: var(--color-green);
    color: var(--text-on-accent);
}

.my-badge-warning {
    background-color: var(--color-orange);
    color: var(--text-on-accent);
}

/* Spin animation for icons */
.gdrive-spin {
    animation: gdrive-rotate 1.5s linear infinite;
}

@keyframes gdrive-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
```

import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

export interface ExamplePluginSettings {
    clientSecret: string;
    enableSync: boolean;
    syncInterval: number;
    syncPolicy: string;
}

export const DEFAULT_SETTINGS: ExamplePluginSettings = {
    clientSecret: "",
    enableSync: true,
    syncInterval: 5,
    syncPolicy: "newer_priority",
};

export class ExampleSettingTab extends PluginSettingTab {
    constructor(app: App, private plugin: Plugin & { settings: ExamplePluginSettings; saveSettings: () => Promise<void> }) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // 1. Heading
        new Setting(containerEl)
            .setName("General Settings")
            .setHeading();

        // 2. Text Input with Password Mask
        new Setting(containerEl)
            .setName("Client Secret")
            .setDesc("Stored securely in OS Keychain.")
            .addText((text) => {
                text.inputEl.type = "password";
                text.setPlaceholder("Enter secret")
                    .setValue(this.plugin.settings.clientSecret)
                    .onChange(async (val) => {
                        this.plugin.settings.clientSecret = val;
                        await this.plugin.saveSettings();
                    });
            });

        // 3. Toggle
        new Setting(containerEl)
            .setName("Enable Auto-Sync")
            .setDesc("Automatically sync in the background.")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.enableSync)
                    .onChange(async (val) => {
                        this.plugin.settings.enableSync = val;
                        await this.plugin.saveSettings();
                    });
            });

        // 4. Slider
        new Setting(containerEl)
            .setName("Sync Interval (Minutes)")
            .setDesc("Polling interval in minutes.")
            .addSlider((slider) => {
                slider.setLimits(1, 60, 1)
                    .setValue(this.plugin.settings.syncInterval)
                    .setDynamicTooltip()
                    .onChange(async (val) => {
                        this.plugin.settings.syncInterval = val;
                        await this.plugin.saveSettings();
                    });
            });

        // 5. Dropdown
        new Setting(containerEl)
            .setName("Conflict Resolution Policy")
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("newer_priority", "Newer Priority")
                    .addOption("remote_priority", "Remote Priority")
                    .addOption("local_priority", "Local Priority")
                    .setValue(this.plugin.settings.syncPolicy)
                    .onChange(async (val) => {
                        this.plugin.settings.syncPolicy = val;
                        await this.plugin.saveSettings();
                    });
            });
    }
}

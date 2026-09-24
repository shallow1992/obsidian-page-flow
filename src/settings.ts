import { App, PluginSettingTab, Setting } from "obsidian";
import type PageFlowPlugin from "./main";
import { PageFlowSettings, SortOrder } from "./types";

export const DEFAULT_SETTINGS: PageFlowSettings = {
  scrollPercentage: 85,
  smoothScroll: true,
  sortOrder: "name-asc",
  loopFolder: false,
  thresholdPx: 10,
};

export class PageFlowSettingTab extends PluginSettingTab {
  plugin: PageFlowPlugin;

  constructor(app: App, plugin: PageFlowPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Page Flow Settings" });

    // Quick jump to Hotkeys settings filtered by "Page Flow"
    new Setting(containerEl)
      .setName("Configure hotkeys")
      .setDesc("Open Obsidian's hotkey settings filtered for Page Flow commands.")
      .addButton((button) =>
        button
          .setButtonText("Configure hotkeys")
          .setCta()
          .onClick(() => {
            try {
              const setting = (this.app as any).setting;
              if (setting) {
                const hotkeysTab = setting.openTabById("hotkeys");
                const applyFilter = () => {
                  try {
                    const searchComp = hotkeysTab?.searchComponent;
                    if (searchComp) {
                      if (searchComp.inputEl) {
                        searchComp.inputEl.value = "Page Flow";
                        searchComp.inputEl.dispatchEvent(new Event("input"));
                      } else if (typeof searchComp.setValue === "function") {
                        searchComp.setValue("Page Flow");
                      }
                      if (typeof hotkeysTab.updateHotkeyVisibility === "function") {
                        hotkeysTab.updateHotkeyVisibility();
                      }
                    }
                  } catch (err) {
                    console.error("Failed to filter hotkey list", err);
                  }
                };

                applyFilter();
                window.setTimeout(applyFilter, 50);
              }
            } catch (e) {
              console.error("Failed to open hotkey settings", e);
            }
          })
      );

    new Setting(containerEl)
      .setName("Scroll amount (%)")
      .setDesc("Percentage of the screen height to scroll on each step (recommended: 80-90%).")
      .addSlider((slider) =>
        slider
          .setLimits(50, 100, 5)
          .setValue(this.plugin.settings.scrollPercentage)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.scrollPercentage = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Smooth scrolling")
      .setDesc("Animate scrolling smoothly between page steps.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.smoothScroll)
          .onChange(async (value) => {
            this.plugin.settings.smoothScroll = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("File sort order")
      .setDesc("The ordering rule used when navigating to the next or previous file in a folder.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("name-asc", "File name (A to Z)")
          .addOption("name-desc", "File name (Z to A)")
          .addOption("ctime-desc", "Created date (Newest first)")
          .addOption("ctime-asc", "Created date (Oldest first)")
          .addOption("mtime-desc", "Modified date (Newest first)")
          .addOption("mtime-asc", "Modified date (Oldest first)")
          .setValue(this.plugin.settings.sortOrder)
          .onChange(async (value) => {
            this.plugin.settings.sortOrder = value as SortOrder;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Loop folder navigation")
      .setDesc("When reaching the last file in a folder, cycle back to the first file.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.loopFolder)
          .onChange(async (value) => {
            this.plugin.settings.loopFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Boundary threshold (px)")
      .setDesc("Buffer in pixels to detect when the top or bottom of a note has been reached.")
      .addSlider((slider) =>
        slider
          .setLimits(0, 50, 5)
          .setValue(this.plugin.settings.thresholdPx)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.thresholdPx = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

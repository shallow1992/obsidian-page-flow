import { App, Platform, PluginSettingTab, Setting } from "obsidian";
import type PageFlowPlugin from "./main";
import { PageFlowSettings, SortOrder } from "./types";
import { t } from "./i18n";

export const DEFAULT_SETTINGS: PageFlowSettings = {
  scrollPercentage: 85,
  smoothScroll: true,
  scrollDuration: 280,
  maxQueuedScreens: 5.0,
  maxVelocityMultiplier: 2.2,
  sortOrder: "file-explorer",
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
    const strings = t().settings;

    containerEl.createEl("h2", { text: strings.title });

    // Quick jump to Hotkeys settings (Desktop only, as mobile does not have a hotkeys settings tab)
    if (!Platform.isMobile) {
      new Setting(containerEl)
        .setName(strings.configureHotkeys.name)
        .setDesc(strings.configureHotkeys.desc)
        .addButton((button) =>
          button
            .setButtonText(strings.configureHotkeys.buttonText)
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
    }

    new Setting(containerEl)
      .setName(strings.scrollAmount.name)
      .setDesc(strings.scrollAmount.desc)
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
      .setName(strings.smoothScroll.name)
      .setDesc(strings.smoothScroll.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.smoothScroll)
          .onChange(async (value) => {
            this.plugin.settings.smoothScroll = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(strings.scrollDuration.name)
      .setDesc(strings.scrollDuration.desc)
      .addSlider((slider) =>
        slider
          .setLimits(100, 1000, 20)
          .setValue(this.plugin.settings.scrollDuration)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.scrollDuration = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(strings.maxQueuedScreens.name)
      .setDesc(strings.maxQueuedScreens.desc)
      .addSlider((slider) =>
        slider
          .setLimits(1.0, 15.0, 0.5)
          .setValue(this.plugin.settings.maxQueuedScreens ?? 5.0)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxQueuedScreens = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(strings.maxVelocityMultiplier.name)
      .setDesc(strings.maxVelocityMultiplier.desc)
      .addSlider((slider) =>
        slider
          .setLimits(1.0, 4.0, 0.1)
          .setValue(this.plugin.settings.maxVelocityMultiplier ?? 2.2)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxVelocityMultiplier = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(strings.sortOrder.name)
      .setDesc(strings.sortOrder.desc)
      .addDropdown((dropdown) =>
        dropdown
          .addOption("file-explorer", strings.sortOrder.options.fileExplorer)
          .addOption("name-asc", strings.sortOrder.options.nameAsc)
          .addOption("name-desc", strings.sortOrder.options.nameDesc)
          .addOption("ctime-desc", strings.sortOrder.options.ctimeDesc)
          .addOption("ctime-asc", strings.sortOrder.options.ctimeAsc)
          .addOption("mtime-desc", strings.sortOrder.options.mtimeDesc)
          .addOption("mtime-asc", strings.sortOrder.options.mtimeAsc)
          .setValue(this.plugin.settings.sortOrder)
          .onChange(async (value) => {
            this.plugin.settings.sortOrder = value as SortOrder;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(strings.loopFolder.name)
      .setDesc(strings.loopFolder.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.loopFolder)
          .onChange(async (value) => {
            this.plugin.settings.loopFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(strings.boundaryThreshold.name)
      .setDesc(strings.boundaryThreshold.desc)
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

import { App, Notice, Platform, PluginSettingTab, Setting } from "obsidian";
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

    this.addNumericSlider(
      containerEl,
      strings.scrollAmount.name,
      strings.scrollAmount.desc,
      { min: 50, max: 100, step: 5 },
      this.plugin.settings.scrollPercentage,
      async (val) => {
        this.plugin.settings.scrollPercentage = val;
        await this.plugin.saveSettings();
      }
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

    this.addNumericSlider(
      containerEl,
      strings.scrollDuration.name,
      strings.scrollDuration.desc,
      { min: 100, max: 1000, step: 20 },
      this.plugin.settings.scrollDuration,
      async (val) => {
        this.plugin.settings.scrollDuration = val;
        await this.plugin.saveSettings();
      }
    );

    this.addNumericSlider(
      containerEl,
      strings.maxQueuedScreens.name,
      strings.maxQueuedScreens.desc,
      { min: 1.0, max: 15.0, step: 0.5 },
      this.plugin.settings.maxQueuedScreens ?? 5.0,
      async (val) => {
        this.plugin.settings.maxQueuedScreens = val;
        await this.plugin.saveSettings();
      },
      1
    );

    this.addNumericSlider(
      containerEl,
      strings.maxVelocityMultiplier.name,
      strings.maxVelocityMultiplier.desc,
      { min: 1.0, max: 5.0, step: 0.1 },
      this.plugin.settings.maxVelocityMultiplier ?? 2.2,
      async (val) => {
        this.plugin.settings.maxVelocityMultiplier = val;
        await this.plugin.saveSettings();
      },
      1
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

    this.addNumericSlider(
      containerEl,
      strings.boundaryThreshold.name,
      strings.boundaryThreshold.desc,
      { min: 0, max: 50, step: 5 },
      this.plugin.settings.thresholdPx,
      async (val) => {
        this.plugin.settings.thresholdPx = val;
        await this.plugin.saveSettings();
      }
    );

    // Reset settings to defaults
    new Setting(containerEl)
      .setName(strings.resetToDefaults.name)
      .setDesc(strings.resetToDefaults.desc)
      .addButton((button) =>
        button
          .setButtonText(strings.resetToDefaults.buttonText)
          .setWarning()
          .onClick(async () => {
            this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
            await this.plugin.saveSettings();
            this.display();
            new Notice(t().notices.settingsReset);
          })
      );
  }

  /**
   * Helper: creates a numeric slider setting with optional decimal place formatting.
   */
  private addNumericSlider(
    containerEl: HTMLElement,
    name: string,
    desc: string,
    limits: { min: number; max: number; step: number },
    value: number,
    onChange: (value: number) => Promise<void>,
    decimalPlaces?: number
  ): Setting {
    return new Setting(containerEl)
      .setName(name)
      .setDesc(desc)
      .addSlider((slider) => {
        slider
          .setLimits(limits.min, limits.max, limits.step)
          .setValue(value)
          .setDynamicTooltip();

        if (decimalPlaces !== undefined && typeof slider.setDisplayFormat === "function") {
          slider.setDisplayFormat((val) => val.toFixed(decimalPlaces));
        }

        slider.onChange(async (val) => {
          await onChange(val);
        });
      });
  }
}

import { App, Notice, Platform, PluginSettingTab, Setting, type SettingDefinitionItem } from "obsidian";
import type PageFlowPlugin from "./main";
import { PageFlowSettings, SortOrder } from "./types";
import { t } from "./i18n";

type SettingKey = Extract<keyof PageFlowSettings, string>;

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

interface ObsidianSettingTabSearch {
  inputEl?: HTMLInputElement;
  setValue?: (val: string) => void;
}

interface ObsidianHotkeysTab {
  searchComponent?: ObsidianSettingTabSearch;
  updateHotkeyVisibility?: () => void;
}

interface ObsidianSettingManager {
  openTabById?: (id: string) => ObsidianHotkeysTab | undefined;
}

interface ObsidianSettingApp {
  setting?: ObsidianSettingManager;
}

export class PageFlowSettingTab extends PluginSettingTab {
  plugin: PageFlowPlugin;

  constructor(app: App, plugin: PageFlowPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  override getControlValue(key: SettingKey): unknown {
    return this.plugin.settings[key];
  }

  override async setControlValue(key: SettingKey, value: unknown): Promise<void> {
    if (key === "sortOrder") {
      this.plugin.settings.sortOrder = value as SortOrder;
    } else if (key === "smoothScroll" || key === "loopFolder") {
      this.plugin.settings[key] = Boolean(value);
    } else {
      (this.plugin.settings as unknown as Record<string, unknown>)[key] = Number(value);
    }
    await this.plugin.saveSettings();
  }

  override getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
    const strings = t().settings;
    return [
      {
        type: "group",
        heading: strings.title,
        items: [
          {
            name: strings.scrollAmount.name,
            desc: strings.scrollAmount.desc,
            control: {
              type: "slider",
              key: "scrollPercentage",
              min: 10,
              max: 100,
              step: 5,
            },
          },
          {
            name: strings.smoothScroll.name,
            desc: strings.smoothScroll.desc,
            control: { type: "toggle", key: "smoothScroll" },
          },
          {
            name: strings.scrollDuration.name,
            desc: strings.scrollDuration.desc,
            control: {
              type: "slider",
              key: "scrollDuration",
              min: 100,
              max: 1000,
              step: 20,
            },
          },
          {
            name: strings.maxQueuedScreens.name,
            desc: strings.maxQueuedScreens.desc,
            control: {
              type: "slider",
              key: "maxQueuedScreens",
              min: 1.0,
              max: 15.0,
              step: 0.5,
            },
          },
          {
            name: strings.maxVelocityMultiplier.name,
            desc: strings.maxVelocityMultiplier.desc,
            control: {
              type: "slider",
              key: "maxVelocityMultiplier",
              min: 1.0,
              max: 5.0,
              step: 0.1,
            },
          },
          {
            name: strings.sortOrder.name,
            desc: strings.sortOrder.desc,
            control: {
              type: "dropdown",
              key: "sortOrder",
              options: {
                "file-explorer": strings.sortOrder.options.fileExplorer,
                "name-asc": strings.sortOrder.options.nameAsc,
                "name-desc": strings.sortOrder.options.nameDesc,
                "ctime-desc": strings.sortOrder.options.ctimeDesc,
                "ctime-asc": strings.sortOrder.options.ctimeAsc,
                "mtime-desc": strings.sortOrder.options.mtimeDesc,
                "mtime-asc": strings.sortOrder.options.mtimeAsc,
              },
            },
          },
          {
            name: strings.loopFolder.name,
            desc: strings.loopFolder.desc,
            control: { type: "toggle", key: "loopFolder" },
          },
          {
            name: strings.boundaryThreshold.name,
            desc: strings.boundaryThreshold.desc,
            control: {
              type: "slider",
              key: "thresholdPx",
              min: 0,
              max: 50,
              step: 5,
            },
          },
        ],
      },
    ];
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const strings = t().settings;

    new Setting(containerEl).setName(strings.title).setHeading();

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
                const settingApp = this.app as unknown as ObsidianSettingApp;
                const hotkeysTab = settingApp.setting?.openTabById?.("hotkeys");
                if (hotkeysTab) {
                  const applyFilter = (): void => {
                    try {
                      const searchComp = hotkeysTab.searchComponent;
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
                    } catch {
                      // Silently ignore if search component unavailable
                    }
                  };

                  applyFilter();
                  window.setTimeout(applyFilter, 50);
                }
              } catch {
                // Silently ignore if internal setting structure changes
              }
            })
        );
    }

    this.addNumericSlider(
      containerEl,
      strings.scrollAmount.name,
      strings.scrollAmount.desc,
      { min: 10, max: 100, step: 5 },
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
      .addButton((button) => {
        button.setButtonText(strings.resetToDefaults.buttonText);

        const safeBtn = button as unknown as {
          setDestructive?: () => void;
          setWarning?: () => void;
        };
        if (typeof safeBtn.setDestructive === "function") {
          safeBtn.setDestructive();
        } else if (typeof safeBtn.setWarning === "function") {
          safeBtn.setWarning();
        }

        button.onClick(async () => {
          this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
          await this.plugin.saveSettings();
          if (typeof (this as any).update === "function") {
            (this as any).update();
          } else {
            this.display();
          }
          new Notice(t().notices.settingsReset);
        });
      });
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
          .setValue(value);

        if (decimalPlaces !== undefined) {
          const sliderWithFormat = slider as unknown as {
            setDisplayFormat?: (format: (val: number) => string) => void;
          };
          if (typeof sliderWithFormat.setDisplayFormat === "function") {
            sliderWithFormat.setDisplayFormat((val) => val.toFixed(decimalPlaces));
          }
        }

        slider.onChange(async (val) => {
          await onChange(val);
        });
      });
  }
}

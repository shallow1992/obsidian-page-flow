import { App, Notice, Platform, PluginSettingTab, type SettingDefinitionItem } from "obsidian";
import type PageFlowPlugin from "./main";
import { PageFlowSettings } from "./types";
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

  override getSettingDefinitions(): SettingDefinitionItem[] {
    const strings = t().settings;
    return [
      // Quick jump to Hotkeys settings (Desktop only)
      {
        name: strings.configureHotkeys.name,
        desc: strings.configureHotkeys.desc,
        visible: !Platform.isMobile,
        render: (setting) => {
          setting.addButton((button) =>
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
        },
      },

      // Scroll settings
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

      // Navigation settings
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

      // Reset to defaults
      {
        name: strings.resetToDefaults.name,
        desc: strings.resetToDefaults.desc,
        render: (setting) => {
          setting.addButton((button) => {
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
              this.update();
              new Notice(t().notices.settingsReset);
            });
          });
        },
      },
    ];
  }
}

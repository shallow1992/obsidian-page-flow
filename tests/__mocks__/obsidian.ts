import { vi } from "vitest";

export const Platform = {
  isMobile: false,
  isDesktop: true,
  isMacOS: true,
  isWin: false,
  isLinux: false,
  isIosApp: false,
  isAndroidApp: false,
};

export class App {
  workspace = {
    getActiveViewOfType: vi.fn(),
    getActiveFile: vi.fn(),
    getLeaf: vi.fn().mockReturnValue({
      openFile: vi.fn().mockResolvedValue(undefined),
    }),
    getLeavesOfType: vi.fn().mockReturnValue([]),
    revealLeaf: vi.fn(),
    setActiveLeaf: vi.fn(),
    leftSplit: {
      collapsed: false,
      expand: vi.fn(),
      collapse: vi.fn(),
    },
    activeLeaf: null as any,
    on: vi.fn(),
  };
  vault = {
    cachedRead: vi.fn().mockResolvedValue("test content"),
    getAbstractFileByPath: vi.fn(),
    on: vi.fn(),
  };
}

export class Plugin {
  app: any;
  manifest: any;
  constructor(app?: any, manifest?: any) {
    this.app = app || new App();
    this.manifest = manifest;
  }
  addCommand() {}
  addSettingTab() {}
  registerEvent() {}
  loadData() {
    return Promise.resolve({});
  }
  saveData() {
    return Promise.resolve();
  }
}

export class PluginSettingTab {
  app: any;
  plugin: any;
  containerEl: any;
  constructor(app: any, plugin: any) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = {
      empty: vi.fn(),
      createEl: vi.fn(),
      createDiv: vi.fn(),
    };
  }
}

export class Setting {
  containerEl: any;
  constructor(containerEl: any) {
    this.containerEl = containerEl;
  }
  setName() { return this; }
  setDesc() { return this; }
  addSlider() { return this; }
  addToggle() { return this; }
  addDropdown() { return this; }
  addText() { return this; }
  addButton(cb?: (button: any) => any) {
    if (cb) {
      const button = {
        setButtonText: () => button,
        setCta: () => button,
        onClick: () => button,
      };
      cb(button);
    }
    return this;
  }
}

export class Notice {
  message: string;
  constructor(message: string) {
    this.message = message;
  }
}

export class TAbstractFile {
  path: string = "";
  name: string = "";
  parent: any = null;
}

export class TFile extends TAbstractFile {
  stat = { ctime: 0, mtime: 0, size: 0 };
  extension: string = "md";
  basename: string = "";
}

export class TFolder extends TAbstractFile {
  children: TAbstractFile[] = [];
}

export class MarkdownView {
  getMode() {
    return "source";
  }
}

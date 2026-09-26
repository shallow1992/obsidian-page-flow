import { MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { DEFAULT_SETTINGS, PageFlowSettingTab } from "./settings";
import { PageFlowSettings } from "./types";
import {
  cancelAllActiveAnimations,
  getScrollContainer,
  scrollDown,
  scrollToBottom,
  scrollToTop,
  scrollUp,
} from "./scroller";
import { resolveNextFile, resolvePrevFile } from "./navigator";
import { t } from "./i18n";
import { debugLog } from "./logger";

export default class PageFlowPlugin extends Plugin {
  settings: PageFlowSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addSettingTab(new PageFlowSettingTab(this.app, this));

    const strings = t();

    // 1. Hybrid: Scroll down or next file
    this.addCommand({
      id: "scroll-or-next",
      name: strings.commands.scrollOrNext,
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return false;
        if (!checking) {
          this.handleForward(view);
        }
        return true;
      },
    });

    // 2. Hybrid: Scroll up or previous file
    this.addCommand({
      id: "scroll-or-prev",
      name: strings.commands.scrollOrPrev,
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return false;
        if (!checking) {
          this.handleBackward(view);
        }
        return true;
      },
    });

    // 3. Scroll only: Page down
    this.addCommand({
      id: "scroll-page-down",
      name: strings.commands.scrollPageDown,
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return false;
        if (!checking) {
          const container = getScrollContainer(view);
          if (container) {
            scrollDown(container, this.settings);
          }
        }
        return true;
      },
    });

    // 4. Scroll only: Page up
    this.addCommand({
      id: "scroll-page-up",
      name: strings.commands.scrollPageUp,
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return false;
        if (!checking) {
          const container = getScrollContainer(view);
          if (container) {
            scrollUp(container, this.settings);
          }
        }
        return true;
      },
    });

    // 5. File only: Next file
    this.addCommand({
      id: "go-to-next-file",
      name: strings.commands.goToNextFile,
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return false;
        if (!checking) {
          void this.openNextFile(activeFile);
        }
        return true;
      },
    });

    // 6. File only: Previous file
    this.addCommand({
      id: "go-to-prev-file",
      name: strings.commands.goToPrevFile,
      checkCallback: (checking: boolean) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return false;
        if (!checking) {
          void this.openPrevFile(activeFile);
        }
        return true;
      },
    });
  }

  onunload(): void {
    cancelAllActiveAnimations();
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<PageFlowSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private handleForward(view: MarkdownView): void {
    const container = getScrollContainer(view);
    if (!container) return;

    const scrolled = scrollDown(container, this.settings);

    if (!scrolled) {
      debugLog("handleForward: scrollDown returned false -> triggering openNextFile");
      const currentFile = view.file;
      if (currentFile) {
        void this.openNextFile(currentFile);
      }
    }
  }

  private handleBackward(view: MarkdownView): void {
    const container = getScrollContainer(view);
    if (!container) return;

    const scrolled = scrollUp(container, this.settings);

    if (!scrolled) {
      debugLog("handleBackward: scrollUp returned false -> triggering openPrevFile");
      const currentFile = view.file;
      if (currentFile) {
        void this.openPrevFile(currentFile, true);
      }
    }
  }

  private async openNextFile(currentFile: TFile): Promise<void> {
    const nextFile = resolveNextFile(currentFile, this.settings, this.app);
    if (!nextFile) {
      new Notice(t().notices.noNextFile);
      return;
    }
    await this.switchToFile(nextFile, false);
  }

  private async openPrevFile(currentFile: TFile, startAtBottom = false): Promise<void> {
    const prevFile = resolvePrevFile(currentFile, this.settings, this.app);
    if (!prevFile) {
      new Notice(t().notices.noPrevFile);
      return;
    }
    await this.switchToFile(prevFile, startAtBottom);
  }

  /**
   * Helper: opens the target file and ensures proper scroll positioning (top or bottom).
   */
  private async switchToFile(targetFile: TFile, startAtBottom: boolean): Promise<void> {
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(targetFile);

    window.requestAnimationFrame(() => {
      const newView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (newView) {
        const newContainer = getScrollContainer(newView);
        if (newContainer) {
          if (startAtBottom) {
            scrollToBottom(newContainer, false);
          } else {
            scrollToTop(newContainer, false);
          }
        }
      }
    });
  }
}

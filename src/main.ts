import { MarkdownView, Notice, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, PageFlowSettingTab } from "./settings";
import { PageFlowSettings } from "./types";
import {
  getScrollContainer,
  scrollDown,
  scrollToBottom,
  scrollToTop,
  scrollUp,
} from "./scroller";
import { resolveNextFile, resolvePrevFile } from "./navigator";
import { t } from "./i18n";

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
            scrollDown(
              container,
              this.settings.scrollPercentage,
              this.settings.smoothScroll,
              this.settings.thresholdPx,
              this.settings.scrollDuration
            );
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
            scrollUp(
              container,
              this.settings.scrollPercentage,
              this.settings.smoothScroll,
              this.settings.thresholdPx,
              this.settings.scrollDuration
            );
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
          this.openNextFile(activeFile);
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
          this.openPrevFile(activeFile);
        }
        return true;
      },
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private handleForward(view: MarkdownView): void {
    const container = getScrollContainer(view);
    if (!container) return;

    const scrolled = scrollDown(
      container,
      this.settings.scrollPercentage,
      this.settings.smoothScroll,
      this.settings.thresholdPx,
      this.settings.scrollDuration
    );

    if (!scrolled) {
      console.log("[Page Flow] handleForward: scrollDown returned false -> triggering openNextFile");
      const currentFile = view.file;
      if (currentFile) {
        this.openNextFile(currentFile);
      }
    }
  }

  private handleBackward(view: MarkdownView): void {
    const container = getScrollContainer(view);
    if (!container) return;

    const scrolled = scrollUp(
      container,
      this.settings.scrollPercentage,
      this.settings.smoothScroll,
      this.settings.thresholdPx,
      this.settings.scrollDuration
    );

    if (!scrolled) {
      console.log("[Page Flow] handleBackward: scrollUp returned false -> triggering openPrevFile");
      const currentFile = view.file;
      if (currentFile) {
        this.openPrevFile(currentFile, true);
      }
    }
  }

  private async openNextFile(currentFile: any): Promise<void> {
    const nextFile = resolveNextFile(currentFile, this.settings);
    if (!nextFile) {
      new Notice(t().notices.noNextFile);
      return;
    }

    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(nextFile);

    // Ensure the new note starts from the top
    window.requestAnimationFrame(() => {
      const newView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (newView) {
        const newContainer = getScrollContainer(newView);
        if (newContainer) {
          scrollToTop(newContainer, false);
        }
      }
    });
  }

  private async openPrevFile(currentFile: any, startAtBottom = false): Promise<void> {
    const prevFile = resolvePrevFile(currentFile, this.settings);
    if (!prevFile) {
      new Notice(t().notices.noPrevFile);
      return;
    }

    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(prevFile);

    // If navigating backward, position at the bottom of the previous file
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

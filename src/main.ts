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

export default class PageFlowPlugin extends Plugin {
  settings: PageFlowSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addSettingTab(new PageFlowSettingTab(this.app, this));

    // 1. Hybrid: Scroll down or next file
    this.addCommand({
      id: "scroll-or-next",
      name: "Forward: Scroll down or go to next file",
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
      name: "Backward: Scroll up or go to previous file",
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
      name: "Scroll page down",
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
              this.settings.thresholdPx
            );
          }
        }
        return true;
      },
    });

    // 4. Scroll only: Page up
    this.addCommand({
      id: "scroll-page-up",
      name: "Scroll page up",
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
              this.settings.thresholdPx
            );
          }
        }
        return true;
      },
    });

    // 5. File only: Next file
    this.addCommand({
      id: "go-to-next-file",
      name: "Go to next file in folder",
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
      name: "Go to previous file in folder",
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
      this.settings.thresholdPx
    );

    if (!scrolled) {
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
      this.settings.thresholdPx
    );

    if (!scrolled) {
      const currentFile = view.file;
      if (currentFile) {
        this.openPrevFile(currentFile, true);
      }
    }
  }

  private async openNextFile(currentFile: any): Promise<void> {
    const nextFile = resolveNextFile(currentFile, this.settings);
    if (!nextFile) {
      new Notice("No next file in folder");
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
      new Notice("No previous file in folder");
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

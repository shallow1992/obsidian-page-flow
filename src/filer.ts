import { App, TFile, WorkspaceLeaf } from "obsidian";
import { debugLog } from "./logger";

/**
 * Helper: finds the currently focused or active file/folder title in the explorer container.
 */
export function getFocusedOrSelectedExplorerItem(containerEl: HTMLElement): HTMLElement | null {
  // 1. Current focused element inside container
  const activeEl = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
  if (activeEl && containerEl.contains(activeEl)) {
    const item = activeEl.closest<HTMLElement>(".nav-file-title, .nav-folder-title");
    if (item) return item;
  }

  // 2. Focused selector
  const focused = containerEl.querySelector<HTMLElement>(
    ".nav-file-title:focus, .nav-folder-title:focus"
  );
  if (focused) return focused;

  // 3. Fallback: currently active file title
  return containerEl.querySelector<HTMLElement>(".nav-file-title.is-active");
}

/**
 * Minimal Keyboard Filer:
 * Leverages Obsidian's native file explorer navigation and styles,
 * while intercepting Enter (to prevent rename and open file) and Escape (to restore editor focus).
 */
export class KeyboardFiler {
  private app: App;
  private isActive = false;
  private keyListener: ((e: KeyboardEvent) => void) | null = null;
  private previousActiveLeaf: WorkspaceLeaf | null = null;

  constructor(app: App) {
    this.app = app;
  }

  public isFilerActive(): boolean {
    return this.isActive;
  }

  /**
   * Focuses Obsidian's native file explorer and attaches Enter/Escape interceptors.
   */
  public start(): boolean {
    const explorerLeaf = this.getExplorerLeaf();
    if (!explorerLeaf) {
      debugLog("KeyboardFiler: File explorer leaf not found.");
      return false;
    }

    // Remember editor leaf to restore focus on exit
    this.previousActiveLeaf = this.app.workspace.activeLeaf;

    // Expand left sidebar if collapsed
    const leftSplit = this.app.workspace.leftSplit as { collapsed?: boolean; expand?: () => void } | undefined;
    if (leftSplit?.collapsed && typeof leftSplit.expand === "function") {
      leftSplit.expand();
    }

    // Activate and focus file explorer leaf
    this.app.workspace.revealLeaf(explorerLeaf);
    this.app.workspace.setActiveLeaf(explorerLeaf, { focus: true });

    const containerEl = explorerLeaf.view?.containerEl;
    if (!containerEl) {
      debugLog("KeyboardFiler: Explorer containerEl not found.");
      return false;
    }

    // Reveal active file in explorer tree
    try {
      const customApp = this.app as unknown as {
        commands?: { executeCommandById?: (id: string) => void };
      };
      customApp.commands?.executeCommandById?.("file-explorer:reveal-active-file");
    } catch {
      // Ignore
    }

    // Set browser focus to the active or initial item
    const activeItem =
      containerEl.querySelector<HTMLElement>(".nav-file-title.is-active") ||
      containerEl.querySelector<HTMLElement>(".nav-file-title, .nav-folder-title");
    if (activeItem && typeof activeItem.focus === "function") {
      activeItem.focus();
    }

    this.isActive = true;
    this.registerKeyListener(containerEl);
    debugLog("KeyboardFiler: Started native overlap mode.");
    return true;
  }

  /**
   * Exits filer mode and restores editor focus.
   */
  public stop(restoreFocus = true): void {
    if (!this.isActive) return;

    this.unregisterKeyListener();
    this.isActive = false;

    if (restoreFocus && this.previousActiveLeaf) {
      try {
        this.app.workspace.setActiveLeaf(this.previousActiveLeaf, { focus: true });
      } catch {
        // Ignore
      }
    }

    this.previousActiveLeaf = null;
    debugLog("KeyboardFiler: Stopped filer mode.");
  }

  /**
   * Handles keyboard interception for Enter and Escape.
   */
  public handleKey(e: KeyboardEvent, containerEl: HTMLElement): boolean {
    if (!this.isActive) return false;

    if (e.key === "Enter") {
      // Intercept Enter: prevent rename trigger completely
      e.preventDefault();
      e.stopImmediatePropagation();

      const item = getFocusedOrSelectedExplorerItem(containerEl);
      if (!item) {
        this.stop(true);
        return true;
      }

      // If it's a file, open it and restore focus to editor
      if (item.classList.contains("nav-file-title")) {
        const path = item.getAttribute("data-path");
        if (path) {
          const file = this.app.vault.getAbstractFileByPath(path);
          if (file instanceof TFile) {
            void this.app.workspace.getLeaf(false).openFile(file).then(() => {
              this.stop(true);
            });
            return true;
          }
        }
        this.stop(true);
        return true;
      }

      // If it's a folder, toggle collapse safely without renaming
      if (item.classList.contains("nav-folder-title")) {
        const indicator = item.querySelector<HTMLElement>(".nav-folder-collapse-indicator");
        if (indicator && typeof indicator.click === "function") {
          indicator.click();
        } else {
          item.click();
        }
        return true;
      }

      return true;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.stop(true);
      return true;
    }

    return false;
  }

  private registerKeyListener(containerEl: HTMLElement): void {
    this.unregisterKeyListener();

    this.keyListener = (e: KeyboardEvent) => {
      // Intercept only when inside file explorer
      this.handleKey(e, containerEl);
    };

    window.addEventListener("keydown", this.keyListener, true);
  }

  private unregisterKeyListener(): void {
    if (this.keyListener) {
      window.removeEventListener("keydown", this.keyListener, true);
      this.keyListener = null;
    }
  }

  private getExplorerLeaf(): WorkspaceLeaf | null {
    const leaves = this.app.workspace.getLeavesOfType("file-explorer");
    return leaves.length > 0 ? leaves[0] : null;
  }
}

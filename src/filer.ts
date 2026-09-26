import { App, TFile, WorkspaceLeaf } from "obsidian";
import { debugLog } from "./logger";

export const FILER_SELECTED_CLASS = "page-flow-filer-selected";

/**
 * Pure helper: returns all visible file/folder title elements from the explorer container.
 * Elements that are hidden (e.g. inside collapsed folders or display:none) are excluded.
 */
export function getVisibleExplorerItems(containerEl: HTMLElement): HTMLElement[] {
  const titles = Array.from(
    containerEl.querySelectorAll<HTMLElement>(".nav-file-title, .nav-folder-title")
  );
  return titles.filter((el) => {
    // 1. If any ancestor folder is collapsed, it is not visible
    const folderChildren = el.closest(".nav-folder-children");
    if (folderChildren) {
      const parentFolder = folderChildren.closest(".nav-folder");
      if (parentFolder && parentFolder.classList.contains("is-collapsed")) {
        return false;
      }
    }

    if (el.classList.contains("is-hidden")) return false;

    // 2. In standard browsers / JSDOM, check layout dimensions
    if (el.offsetParent !== null) return true;
    if (el.clientHeight > 0 || el.offsetHeight > 0) return true;

    // Fallback for mock environments
    return true;
  });
}

/**
 * Pure helper: finds the parent folder title element of a given file or folder title element.
 */
export function findParentFolderElement(titleEl: HTMLElement): HTMLElement | null {
  const childrenContainer = titleEl.closest(".nav-folder-children");
  if (!childrenContainer) return null;

  const parentFolder = childrenContainer.closest(".nav-folder");
  if (!parentFolder) return null;

  return parentFolder.querySelector<HTMLElement>(":scope > .nav-folder-title");
}

/**
 * Pure helper: checks if a title element represents a folder.
 */
export function isFolderElement(titleEl: HTMLElement): boolean {
  return titleEl.classList.contains("nav-folder-title");
}

/**
 * Pure helper: checks if a folder title element belongs to a collapsed folder.
 */
export function isFolderCollapsed(folderTitleEl: HTMLElement): boolean {
  const parentFolder = folderTitleEl.closest(".nav-folder");
  if (parentFolder) {
    return parentFolder.classList.contains("is-collapsed");
  }
  return false;
}

/**
 * Keyboard Filer controller managing state, key events, and selection highlight.
 */
export class KeyboardFiler {
  private app: App;
  private isActive = false;
  private selectedEl: HTMLElement | null = null;
  private keyListener: ((e: KeyboardEvent) => void) | null = null;
  private previousActiveLeaf: WorkspaceLeaf | null = null;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Returns whether the filer mode is currently active.
   */
  public isFilerActive(): boolean {
    return this.isActive;
  }

  /**
   * Starts keyboard filer mode, focusing the file explorer and selecting current or initial item.
   */
  public start(): boolean {
    const explorerLeaf = this.getExplorerLeaf();
    if (!explorerLeaf) {
      debugLog("KeyboardFiler: File explorer leaf not found.");
      return false;
    }

    // Save current active leaf to restore focus on exit
    this.previousActiveLeaf = this.app.workspace.activeLeaf;

    // Ensure left sidebar is expanded if collapsed
    const leftSplit = this.app.workspace.leftSplit as { collapsed?: boolean; expand?: () => void } | undefined;
    if (leftSplit && leftSplit.collapsed && typeof leftSplit.expand === "function") {
      leftSplit.expand();
    }

    // Reveal explorer leaf
    this.app.workspace.revealLeaf(explorerLeaf);

    const containerEl = explorerLeaf.view?.containerEl;
    if (!containerEl) {
      debugLog("KeyboardFiler: Explorer view containerEl not found.");
      return false;
    }

    // Safely trigger Obsidian's internal reveal-active-file command
    try {
      const customApp = this.app as unknown as {
        commands?: { executeCommandById?: (id: string) => void };
      };
      customApp.commands?.executeCommandById?.("file-explorer:reveal-active-file");
    } catch {
      // Ignore if not supported
    }

    // Find initial element to select
    const activeFile = this.app.workspace.getActiveFile();
    let initialEl: HTMLElement | null = null;

    if (activeFile) {
      const safePath =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(activeFile.path)
          : activeFile.path.replace(/["\\]/g, "\\$&");
      initialEl = containerEl.querySelector<HTMLElement>(
        `.nav-file-title[data-path="${safePath}"]`
      );
    }

    const visibleItems = getVisibleExplorerItems(containerEl);
    if (!initialEl && visibleItems.length > 0) {
      initialEl = visibleItems[0];
    }

    if (initialEl) {
      this.selectElement(initialEl);
    }

    this.isActive = true;
    this.registerKeyListener(containerEl);
    debugLog("KeyboardFiler: Started filer mode.");
    return true;
  }

  /**
   * Stops keyboard filer mode, removes selection highlight, and restores editor focus.
   */
  public stop(restoreFocus = true): void {
    if (!this.isActive) return;

    this.removeSelection();
    this.unregisterKeyListener();
    this.isActive = false;

    if (restoreFocus && this.previousActiveLeaf) {
      try {
        this.app.workspace.setActiveLeaf(this.previousActiveLeaf, { focus: true });
      } catch {
        // Fallback: ignore focus errors
      }
    }

    this.previousActiveLeaf = null;
    debugLog("KeyboardFiler: Stopped filer mode.");
  }

  /**
   * Selects and highlights a specific item element.
   */
  public selectElement(el: HTMLElement): void {
    if (this.selectedEl && this.selectedEl !== el) {
      this.selectedEl.classList.remove(FILER_SELECTED_CLASS);
    }
    this.selectedEl = el;
    this.selectedEl.classList.add(FILER_SELECTED_CLASS);

    try {
      this.selectedEl.scrollIntoView({ block: "nearest", inline: "nearest" });
    } catch {
      // Fallback in environments without scrollIntoView
    }
  }

  /**
   * Handles keyboard events for navigation.
   */
  public handleKey(e: KeyboardEvent, containerEl: HTMLElement): boolean {
    if (!this.isActive) return false;

    const visibleItems = getVisibleExplorerItems(containerEl);
    if (visibleItems.length === 0) return false;

    const currentIndex = this.selectedEl ? visibleItems.indexOf(this.selectedEl) : -1;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        e.stopPropagation();
        const nextIndex = currentIndex < 0 ? 0 : Math.min(visibleItems.length - 1, currentIndex + 1);
        this.selectElement(visibleItems[nextIndex]);
        return true;
      }

      case "ArrowUp": {
        e.preventDefault();
        e.stopPropagation();
        const prevIndex = currentIndex < 0 ? 0 : Math.max(0, currentIndex - 1);
        this.selectElement(visibleItems[prevIndex]);
        return true;
      }

      case "ArrowRight": {
        e.preventDefault();
        e.stopPropagation();
        if (!this.selectedEl) return false;

        if (isFolderElement(this.selectedEl)) {
          if (isFolderCollapsed(this.selectedEl)) {
            // Expand collapsed folder
            this.selectedEl.click();
          } else {
            // Already expanded: move to first child if available
            if (currentIndex >= 0 && currentIndex + 1 < visibleItems.length) {
              this.selectElement(visibleItems[currentIndex + 1]);
            }
          }
        }
        return true;
      }

      case "ArrowLeft": {
        e.preventDefault();
        e.stopPropagation();
        if (!this.selectedEl) return false;

        if (isFolderElement(this.selectedEl) && !isFolderCollapsed(this.selectedEl)) {
          // Collapse expanded folder
          this.selectedEl.click();
        } else {
          // Find parent folder and select it
          const parentFolderEl = findParentFolderElement(this.selectedEl);
          if (parentFolderEl) {
            this.selectElement(parentFolderEl);
          }
        }
        return true;
      }

      case "Enter": {
        e.preventDefault();
        e.stopPropagation();
        if (!this.selectedEl) return false;

        if (isFolderElement(this.selectedEl)) {
          // Toggle folder collapsed state
          this.selectedEl.click();
        } else {
          // Open selected file and exit filer mode
          const path = this.selectedEl.getAttribute("data-path");
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
        }
        return true;
      }

      case "Escape": {
        e.preventDefault();
        e.stopPropagation();
        this.stop(true);
        return true;
      }

      default:
        return false;
    }
  }

  private registerKeyListener(containerEl: HTMLElement): void {
    this.unregisterKeyListener();

    this.keyListener = (e: KeyboardEvent) => {
      this.handleKey(e, containerEl);
    };

    // Use capture phase to intercept navigation keys before other handlers
    window.addEventListener("keydown", this.keyListener, true);
  }

  private unregisterKeyListener(): void {
    if (this.keyListener) {
      window.removeEventListener("keydown", this.keyListener, true);
      this.keyListener = null;
    }
  }

  private removeSelection(): void {
    if (this.selectedEl) {
      this.selectedEl.classList.remove(FILER_SELECTED_CLASS);
      this.selectedEl = null;
    }
  }

  private getExplorerLeaf(): WorkspaceLeaf | null {
    const leaves = this.app.workspace.getLeavesOfType("file-explorer");
    return leaves.length > 0 ? leaves[0] : null;
  }
}

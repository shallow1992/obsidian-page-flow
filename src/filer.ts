import { App, TFile, TFolder, WorkspaceLeaf } from "obsidian";
import { debugLog } from "./logger";

/**
 * Helper: finds the currently focused, selected, or active file/folder element in the explorer container.
 * Prioritizes Obsidian's visual selection classes (.is-selected, .is-focused) over browser activeElement,
 * because arrow-key navigation in Obsidian updates CSS classes rather than browser focus.
 */
export function getFocusedOrSelectedExplorerItem(containerEl: HTMLElement): HTMLElement | null {
  // 1. FIRST: Check Obsidian's keyboard selection classes (.is-selected, .is-focused)
  const selectedByClass = containerEl.querySelector<HTMLElement>(
    ".nav-folder-title.is-selected, .nav-file-title.is-selected, " +
      ".nav-folder-title.is-focused, .nav-file-title.is-focused, " +
      ".tree-item-self.is-selected, .tree-item-self.is-focused"
  );
  if (selectedByClass) {
    return selectedByClass;
  }

  // 2. SECOND: Browser activeElement inside container
  const activeEl = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
  if (activeEl && containerEl.contains(activeEl)) {
    const item = activeEl.closest<HTMLElement>(
      ".nav-folder-title, .nav-file-title, .tree-item-self"
    );
    if (item && item !== containerEl) {
      return item;
    }
  }

  // 3. THIRD: Browser :focus pseudo-class
  const focusedPseudo = containerEl.querySelector<HTMLElement>(
    ".nav-folder-title:focus, .nav-file-title:focus, .tree-item-self:focus"
  );
  if (focusedPseudo) {
    return focusedPseudo;
  }

  // 4. Fallback: currently active file title
  return containerEl.querySelector<HTMLElement>(
    ".nav-file-title.is-active, .tree-item-self.is-active, .nav-file-title"
  );
}

/**
 * Helper: checks whether an item element represents a folder/directory.
 */
export function isFolderElement(item: HTMLElement, app?: App): boolean {
  if (item.classList.contains("nav-folder-title")) return true;
  if (item.classList.contains("nav-folder")) return true;

  const path =
    item.getAttribute("data-path") ||
    item.closest("[data-path]")?.getAttribute("data-path");
  if (path && app) {
    const abstractFile = app.vault.getAbstractFileByPath(path);
    if (abstractFile instanceof TFolder) return true;
  }

  const parentFolder = item.closest(".nav-folder");
  const parentFile = item.closest(".nav-file");
  return Boolean(parentFolder && !parentFile);
}

/**
 * Minimal Keyboard Filer:
 * Overlaps Obsidian's native file explorer keyboard navigation,
 * completely intercepting Enter (to prevent rename and toggle/open) and Escape (to restore editor focus).
 */
export class KeyboardFiler {
  private app: App;
  private isActive = false;
  private keyListener: ((e: KeyboardEvent) => void) | null = null;
  private previousActiveLeaf: WorkspaceLeaf | null = null;
  private isCancellingRename = false;

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
      containerEl.querySelector<HTMLElement>(".nav-file-title.is-active, .tree-item-self.is-active") ||
      containerEl.querySelector<HTMLElement>(".nav-file-title, .nav-folder-title, .tree-item-self");
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
    if (this.isCancellingRename || (e as unknown as { isCancelRename?: boolean }).isCancelRename) {
      return false;
    }

    if (e.key === "Enter") {
      // Completely block Enter from triggering Obsidian's rename
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const item = getFocusedOrSelectedExplorerItem(containerEl);
      const itemPath =
        item?.getAttribute("data-path") ||
        item?.closest("[data-path]")?.getAttribute("data-path") ||
        "";

      debugLog(
        `KeyboardFiler: Enter key intercepted! itemFound=${Boolean(item)}, ` +
          `tagName=${item?.tagName}, classList=${Array.from(item?.classList || []).join(" ")}, ` +
          `path=${itemPath}`
      );

      if (!item) {
        debugLog("KeyboardFiler: No item found in explorer, ignoring Enter.");
        return true;
      }

      // Check if item is a folder
      if (isFolderElement(item, this.app)) {
        debugLog(`KeyboardFiler: Folder detected (${itemPath}). Toggling collapse without renaming.`);

        // Abort any in-flight rename triggered by native Obsidian
        this.cancelRename(containerEl, item);

        // Toggle folder collapse state safely
        this.toggleFolder(item);

        // Double check on next frame to eradicate any delayed rename input
        if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(() => {
            this.cancelRename(containerEl, item);
          });
        } else {
          setTimeout(() => {
            this.cancelRename(containerEl, item);
          }, 0);
        }

        // Keep filer mode active so user can continue navigating
        return true;
      }

      // Otherwise, it's a file: open it and restore focus to editor
      debugLog(`KeyboardFiler: File detected (${itemPath}). Opening file.`);
      if (itemPath) {
        const file = this.app.vault.getAbstractFileByPath(itemPath);
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

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      debugLog("KeyboardFiler: Escape intercepted, stopping filer mode.");
      this.stop(true);
      return true;
    }

    return false;
  }

  /**
   * Immediately aborts and cleans up any rename mode started by native Obsidian.
   */
  public cancelRename(containerEl: HTMLElement, item: HTMLElement): void {
    // 1. Dispatch Escape on rename input if present
    const renameInput =
      item.querySelector<HTMLInputElement>("input, [contenteditable='true']") ||
      containerEl.querySelector<HTMLInputElement>(
        ".is-being-renamed input, input.nav-folder-title-content, input"
      );

    if (renameInput) {
      debugLog("KeyboardFiler: Aborting native rename input element.");
      this.isCancellingRename = true;
      try {
        let escEvent: Event;
        if (typeof KeyboardEvent === "function") {
          escEvent = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true,
          });
        } else {
          escEvent = {
            type: "keydown",
            key: "Escape",
            bubbles: true,
            cancelable: true,
          } as unknown as Event;
        }
        (escEvent as unknown as { isCancelRename?: boolean }).isCancelRename = true;
        renameInput.dispatchEvent(escEvent);
        renameInput.blur();
      } catch {
        // Ignore
      } finally {
        this.isCancellingRename = false;
      }
    }

    // 2. Remove is-being-renamed class
    item.classList.remove("is-being-renamed");
    const parentFolder = item.closest(".nav-folder");
    parentFolder?.classList.remove("is-being-renamed");

    // 3. Ensure focus stays on item
    if (typeof item.focus === "function") {
      item.focus();
    }
  }

  /**
   * Safely toggles folder collapse state without triggering rename.
   */
  public toggleFolder(folderItem: HTMLElement): void {
    const folderEl = folderItem.closest<HTMLElement>(".nav-folder") || folderItem;
    const path =
      folderItem.getAttribute("data-path") ||
      folderEl.getAttribute("data-path") ||
      folderEl.querySelector("[data-path]")?.getAttribute("data-path");

    // 1. Try Obsidian internal fileItem API (safest: no DOM click events, zero rename risk)
    const explorerLeaf = this.getExplorerLeaf();
    interface ExplorerFileItem {
      setCollapsed?: (val: boolean) => void;
      collapsed?: boolean;
    }
    const fileItems = (explorerLeaf?.view as unknown as { fileItems?: Record<string, ExplorerFileItem> })?.fileItems;
    if (path && fileItems && fileItems[path] && typeof fileItems[path].setCollapsed === "function") {
      const currentCollapsed = Boolean(fileItems[path].collapsed);
      debugLog(`KeyboardFiler: Using fileItems API for '${path}', setCollapsed(${!currentCollapsed})`);
      fileItems[path].setCollapsed?.(!currentCollapsed);
      return;
    }

    // 2. DOM fallback: click only the collapse arrow indicator icon, NEVER the title itself!
    const indicator = folderEl.querySelector<HTMLElement>(
      ".nav-folder-collapse-indicator, .collapse-icon, .tree-item-icon"
    );
    if (indicator && typeof indicator.click === "function") {
      debugLog(`KeyboardFiler: Clicking collapse indicator for '${path}'`);
      indicator.click();
      return;
    }

    // 3. Fallback: toggle is-collapsed class
    debugLog(`KeyboardFiler: Toggling is-collapsed class for '${path}'`);
    folderEl.classList.toggle("is-collapsed");
  }

  private registerKeyListener(containerEl: HTMLElement): void {
    this.unregisterKeyListener();

    this.keyListener = (e: KeyboardEvent) => {
      if (this.isActive && (e.key === "Enter" || e.key === "Escape")) {
        if (e.type === "keydown") {
          this.handleKey(e, containerEl);
        } else if (e.type === "keyup") {
          // Block keyup as well so rename is never triggered on key release
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    };

    // Intercept both keydown and keyup in capture phase
    window.addEventListener("keydown", this.keyListener, true);
    window.addEventListener("keyup", this.keyListener, true);
  }

  private unregisterKeyListener(): void {
    if (this.keyListener) {
      window.removeEventListener("keydown", this.keyListener, true);
      window.removeEventListener("keyup", this.keyListener, true);
      this.keyListener = null;
    }
  }

  private getExplorerLeaf(): WorkspaceLeaf | null {
    const leaves = this.app.workspace.getLeavesOfType("file-explorer");
    return leaves.length > 0 ? leaves[0] : null;
  }
}

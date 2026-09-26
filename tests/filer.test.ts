import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFocusedOrSelectedExplorerItem, isFolderElement, KeyboardFiler } from "../src/filer";
import { App, TFile } from "obsidian";

class MockClassList {
  private set: Set<string>;
  constructor(init: string[] = []) {
    this.set = new Set(init);
  }
  contains(cls: string): boolean {
    return this.set.has(cls);
  }
  add(cls: string): void {
    this.set.add(cls);
  }
  remove(cls: string): void {
    this.set.delete(cls);
  }
  has(cls: string): boolean {
    return this.set.has(cls);
  }
  toggle(cls: string): boolean {
    if (this.set.has(cls)) {
      this.set.delete(cls);
      return false;
    }
    this.set.add(cls);
    return true;
  }
}

class MockDomNode {
  classList: MockClassList;
  attributes: Map<string, string>;
  parentElement: MockDomNode | null = null;
  children: MockDomNode[] = [];
  clicked = false;
  focused = false;
  tagName: string;

  constructor(classNames: string[] = [], attrs: Record<string, string> = {}, tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.classList = new MockClassList(classNames);
    this.attributes = new Map(Object.entries(attrs));
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  appendChild<T extends MockDomNode>(child: T): T {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  click(): void {
    this.clicked = true;
  }

  focus(): void {
    this.focused = true;
  }

  blur(): void {
    this.focused = false;
  }

  dispatchedEvents: unknown[] = [];
  dispatchEvent(event: unknown): boolean {
    this.dispatchedEvents.push(event);
    return true;
  }

  contains(child: MockDomNode): boolean {
    let curr: MockDomNode | null = child;
    while (curr) {
      if (curr === this) return true;
      curr = curr.parentElement;
    }
    return false;
  }

  closest(selector: string): MockDomNode | null {
    let curr: MockDomNode | null = this;
    const subSelectors = selector.split(",").map((s) => s.trim());
    while (curr) {
      for (const sub of subSelectors) {
        const classes = sub.split(".").filter(Boolean);
        if (classes.length > 0 && classes.every((c) => curr!.classList.contains(c))) {
          return curr;
        }
      }
      curr = curr.parentElement;
    }
    return null;
  }

  querySelector<T extends MockDomNode>(selector: string): T | null {
    const subSelectors = selector.split(",").map((s) => s.trim());
    const matchesNode = (node: MockDomNode): boolean => {
      for (const sub of subSelectors) {
        const cleanSub = sub.replace(/:focus/g, "").trim();
        if (cleanSub.toLowerCase() === node.tagName.toLowerCase()) {
          return true;
        }
        const classes = cleanSub.split(".").filter(Boolean);
        if (classes.length > 0 && classes.every((c) => node.classList.contains(c))) {
          return true;
        }
      }
      return false;
    };

    const traverse = (node: MockDomNode): MockDomNode | null => {
      if (matchesNode(node)) return node;
      for (const c of node.children) {
        const found = traverse(c);
        if (found) return found;
      }
      return null;
    };

    for (const c of this.children) {
      const found = traverse(c);
      if (found) return found as unknown as T;
    }
    return null;
  }
}

describe("Minimal KeyboardFiler (Native Overlap)", () => {
  let app: App;
  let originalWindow: typeof global.window;
  let originalDocument: typeof global.document;
  let windowListeners: Record<string, ((e: any) => void)[]> = {};

  beforeEach(() => {
    app = new App();
    windowListeners = {};
    originalWindow = global.window;
    originalDocument = global.document;

    (global as unknown as { window: unknown }).window = {
      addEventListener: (event: string, handler: (e: any) => void) => {
        if (!windowListeners[event]) windowListeners[event] = [];
        windowListeners[event].push(handler);
      },
      removeEventListener: (event: string, handler: (e: any) => void) => {
        if (windowListeners[event]) {
          windowListeners[event] = windowListeners[event].filter((h) => h !== handler);
        }
      },
    };
  });

  afterEach(() => {
    (global as unknown as { window: unknown }).window = originalWindow;
    (global as unknown as { document: unknown }).document = originalDocument;
  });

  describe("isFolderElement", () => {
    it("identifies folder elements correctly", () => {
      const folder = new MockDomNode(["nav-folder"]);
      const folderTitle = new MockDomNode(["nav-folder-title"]);
      folder.appendChild(folderTitle);

      const file = new MockDomNode(["nav-file"]);
      const fileTitle = new MockDomNode(["nav-file-title"]);
      file.appendChild(fileTitle);

      expect(isFolderElement(folderTitle as unknown as HTMLElement)).toBe(true);
      expect(isFolderElement(folder as unknown as HTMLElement)).toBe(true);
      expect(isFolderElement(fileTitle as unknown as HTMLElement)).toBe(false);
    });
  });

  describe("getFocusedOrSelectedExplorerItem", () => {
    it("returns focused element inside container if present", () => {
      const container = new MockDomNode(["nav-files-container"]);
      const fileTitle = new MockDomNode(["nav-file-title"]);
      container.appendChild(fileTitle);

      (global as unknown as { document: unknown }).document = {
        activeElement: fileTitle,
      };

      const result = getFocusedOrSelectedExplorerItem(container as unknown as HTMLElement);
      expect(result).toBe(fileTitle);
    });

    it("finds item with Obsidian's .is-focused class", () => {
      const container = new MockDomNode(["nav-files-container"]);
      const folderTitle = new MockDomNode(["nav-folder-title", "is-focused"]);
      container.appendChild(folderTitle);

      (global as unknown as { document: unknown }).document = {
        activeElement: null,
      };

      const result = getFocusedOrSelectedExplorerItem(container as unknown as HTMLElement);
      expect(result).toBe(folderTitle);
    });

    it("falls back to .is-active file title when no element is focused", () => {
      const container = new MockDomNode(["nav-files-container"]);
      const activeTitle = new MockDomNode(["nav-file-title", "is-active"]);
      container.appendChild(activeTitle);

      (global as unknown as { document: unknown }).document = {
        activeElement: null,
      };

      const result = getFocusedOrSelectedExplorerItem(container as unknown as HTMLElement);
      expect(result).toBe(activeTitle);
    });
  });

  describe("KeyboardFiler lifecycle and key interception", () => {
    it("activates leaf and focuses item on start", () => {
      const filer = new KeyboardFiler(app);
      const container = new MockDomNode(["nav-files-container"]);
      const activeTitle = new MockDomNode(["nav-file-title", "is-active"]);
      container.appendChild(activeTitle);

      const mockLeaf = {
        view: { containerEl: container as unknown as HTMLElement },
      };
      app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);

      const started = filer.start();
      expect(started).toBe(true);
      expect(filer.isFilerActive()).toBe(true);
      expect(app.workspace.setActiveLeaf).toHaveBeenCalledWith(mockLeaf, { focus: true });
      expect(activeTitle.focused).toBe(true);

      filer.stop(false);
      expect(filer.isFilerActive()).toBe(false);
    });

    it("intercepts Enter on file to open it and stop filer, blocking default rename", async () => {
      const filer = new KeyboardFiler(app);
      const container = new MockDomNode(["nav-files-container"]);
      const fileTitle = new MockDomNode(["nav-file-title"], { "data-path": "Notes/Test.md" });
      container.appendChild(fileTitle);

      (global as unknown as { document: unknown }).document = {
        activeElement: fileTitle,
      };

      const mockLeaf = { view: { containerEl: container as unknown as HTMLElement } };
      app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);

      const testFile = new TFile();
      testFile.path = "Notes/Test.md";
      app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(testFile);

      const openFileMock = vi.fn().mockResolvedValue(undefined);
      app.workspace.getLeaf = vi.fn().mockReturnValue({ openFile: openFileMock });

      filer.start();

      const enterEvent = {
        key: "Enter",
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        stopImmediatePropagation: vi.fn(),
      } as unknown as KeyboardEvent;

      const handled = filer.handleKey(enterEvent, container as unknown as HTMLElement);
      expect(handled).toBe(true);
      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(enterEvent.stopImmediatePropagation).toHaveBeenCalled();
      expect(openFileMock).toHaveBeenCalledWith(testFile);

      await Promise.resolve();
      expect(filer.isFilerActive()).toBe(false);
    });

    it("intercepts Enter on folder to toggle collapse safely without renaming", () => {
      const filer = new KeyboardFiler(app);
      const container = new MockDomNode(["nav-files-container"]);
      const folder = new MockDomNode(["nav-folder"]);
      const folderTitle = new MockDomNode(["nav-folder-title"]);
      const indicator = new MockDomNode(["nav-folder-collapse-indicator"]);
      folderTitle.appendChild(indicator);
      folder.appendChild(folderTitle);
      container.appendChild(folder);

      (global as unknown as { document: unknown }).document = {
        activeElement: folderTitle,
      };

      const mockLeaf = { view: { containerEl: container as unknown as HTMLElement } };
      app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);

      filer.start();

      const enterEvent = {
        key: "Enter",
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        stopImmediatePropagation: vi.fn(),
      } as unknown as KeyboardEvent;

      const handled = filer.handleKey(enterEvent, container as unknown as HTMLElement);
      expect(handled).toBe(true);
      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(enterEvent.stopImmediatePropagation).toHaveBeenCalled();
      expect(indicator.clicked).toBe(true);
    });

    it("intercepts Escape to exit filer mode and restore editor focus", () => {
      const filer = new KeyboardFiler(app);
      const container = new MockDomNode(["nav-files-container"]);
      const mockLeaf = { view: { containerEl: container as unknown as HTMLElement } };
      app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);

      filer.start();
      expect(filer.isFilerActive()).toBe(true);

      const escEvent = {
        key: "Escape",
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        stopImmediatePropagation: vi.fn(),
      } as unknown as KeyboardEvent;

      const handled = filer.handleKey(escEvent, container as unknown as HTMLElement);
      expect(handled).toBe(true);
      expect(escEvent.preventDefault).toHaveBeenCalled();
      expect(escEvent.stopImmediatePropagation).toHaveBeenCalled();
      expect(filer.isFilerActive()).toBe(false);
    });

    it("passes through Arrow keys to let native Obsidian navigation handle them", () => {
      const filer = new KeyboardFiler(app);
      const container = new MockDomNode(["nav-files-container"]);
      const mockLeaf = { view: { containerEl: container as unknown as HTMLElement } };
      app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);

      filer.start();

      const arrowDownEvent = {
        key: "ArrowDown",
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        stopImmediatePropagation: vi.fn(),
      } as unknown as KeyboardEvent;

      // Must return false so native Obsidian key navigation processes it!
      const handled = filer.handleKey(arrowDownEvent, container as unknown as HTMLElement);
      expect(handled).toBe(false);
      expect(arrowDownEvent.preventDefault).not.toHaveBeenCalled();
    });

    it("cancels native rename and removes is-being-renamed class", () => {
      const filer = new KeyboardFiler(app);
      const container = new MockDomNode(["nav-files-container"]);
      const folder = new MockDomNode(["nav-folder", "is-being-renamed"]);
      const folderTitle = new MockDomNode(["tree-item-self", "nav-folder-title", "is-being-renamed"]);
      const input = new MockDomNode(["nav-folder-title-content"], {}, "input");
      folderTitle.appendChild(input);
      folder.appendChild(folderTitle);
      container.appendChild(folder);

      filer.cancelRename(container as unknown as HTMLElement, folderTitle as unknown as HTMLElement);

      expect(folderTitle.classList.contains("is-being-renamed")).toBe(false);
      expect(folder.classList.contains("is-being-renamed")).toBe(false);
      expect(folderTitle.focused).toBe(true);
      expect(input.dispatchedEvents.length).toBe(1);
    });
  });
});

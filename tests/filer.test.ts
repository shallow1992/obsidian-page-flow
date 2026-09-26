import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FILER_SELECTED_CLASS,
  findParentFolderElement,
  getVisibleExplorerItems,
  isFolderCollapsed,
  isFolderElement,
  KeyboardFiler,
} from "../src/filer";
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
}

class MockDomNode {
  tagName: string;
  classList: MockClassList;
  attributes: Map<string, string>;
  parentElement: MockDomNode | null = null;
  children: MockDomNode[] = [];
  offsetParent: MockDomNode | null = null;
  clientHeight = 20;
  offsetHeight = 20;
  clicked = false;
  clickHandlers: (() => void)[] = [];

  constructor(tagName: string, classNames: string[] = [], attrs: Record<string, string> = {}) {
    this.tagName = tagName.toUpperCase();
    this.classList = new MockClassList(classNames);
    this.attributes = new Map(Object.entries(attrs));
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  appendChild<T extends MockDomNode>(child: T): T {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  click(): void {
    this.clicked = true;
    for (const h of this.clickHandlers) {
      h();
    }
  }

  scrollIntoView = vi.fn();

  closest(selector: string): MockDomNode | null {
    let curr: MockDomNode | null = this;
    const cleanSel = selector.replace(/^\./, "");
    while (curr) {
      if (curr.classList.contains(cleanSel)) {
        return curr;
      }
      curr = curr.parentElement;
    }
    return null;
  }

  querySelector<T extends MockDomNode>(selector: string): T | null {
    const all = this.querySelectorAll<T>(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll<T extends MockDomNode>(selector: string): T[] {
    const results: T[] = [];
    const selectors = selector.split(",").map((s) => s.trim());

    if (selectors.length === 1 && selectors[0] === ":scope > .nav-folder-title") {
      for (const child of this.children) {
        if (child.classList.contains("nav-folder-title")) {
          results.push(child as unknown as T);
        }
      }
      return results;
    }

    const matches = (node: MockDomNode, sel: string): boolean => {
      // Attribute selector like .nav-file-title[data-path="Folder1/File2.md"]
      const attrMatch = sel.match(/^(\.[a-zA-Z0-9_-]+)?\[([a-zA-Z0-9_-]+)="([^"]+)"\]$/);
      if (attrMatch) {
        const [, className, attrName, attrVal] = attrMatch;
        if (className && !node.classList.contains(className.replace(/^\./, ""))) {
          return false;
        }
        return node.getAttribute(attrName) === attrVal;
      }

      const className = sel.replace(/^\./, "");
      return node.classList.contains(className);
    };

    const traverse = (node: MockDomNode) => {
      for (const sel of selectors) {
        if (matches(node, sel)) {
          results.push(node as unknown as T);
        }
      }

      for (const child of node.children) {
        traverse(child);
      }
    };

    for (const child of this.children) {
      traverse(child);
    }

    return results;
  }
}

function createExplorerTree(): {
  root: MockDomNode;
  folder1: MockDomNode;
  folder1Title: MockDomNode;
  folder1Children: MockDomNode;
  file1: MockDomNode;
  file1Title: MockDomNode;
  file2: MockDomNode;
  file2Title: MockDomNode;
  folder2: MockDomNode;
  folder2Title: MockDomNode;
  folder2Children: MockDomNode;
  file3: MockDomNode;
  file3Title: MockDomNode;
} {
  const root = new MockDomNode("div", ["nav-files-container"]);

  // Folder 1 (expanded)
  const folder1 = new MockDomNode("div", ["nav-folder"]);
  const folder1Title = new MockDomNode("div", ["nav-folder-title"], { "data-path": "Folder1" });
  folder1.appendChild(folder1Title);

  const folder1Children = new MockDomNode("div", ["nav-folder-children"]);
  const file1 = new MockDomNode("div", ["nav-file"]);
  const file1Title = new MockDomNode("div", ["nav-file-title"], { "data-path": "Folder1/File1.md" });
  file1.appendChild(file1Title);
  folder1Children.appendChild(file1);

  const file2 = new MockDomNode("div", ["nav-file"]);
  const file2Title = new MockDomNode("div", ["nav-file-title"], { "data-path": "Folder1/File2.md" });
  file2.appendChild(file2Title);
  folder1Children.appendChild(file2);

  folder1.appendChild(folder1Children);
  root.appendChild(folder1);

  // Folder 2 (collapsed)
  const folder2 = new MockDomNode("div", ["nav-folder", "is-collapsed"]);
  const folder2Title = new MockDomNode("div", ["nav-folder-title"], { "data-path": "Folder2" });
  folder2.appendChild(folder2Title);

  const folder2Children = new MockDomNode("div", ["nav-folder-children"]);
  const file3 = new MockDomNode("div", ["nav-file"]);
  const file3Title = new MockDomNode("div", ["nav-file-title"], { "data-path": "Folder2/File3.md" });
  file3.appendChild(file3Title);
  folder2Children.appendChild(file3);

  folder2.appendChild(folder2Children);
  root.appendChild(folder2);

  return {
    root,
    folder1,
    folder1Title,
    folder1Children,
    file1,
    file1Title,
    file2,
    file2Title,
    folder2,
    folder2Title,
    folder2Children,
    file3,
    file3Title,
  };
}

describe("Keyboard Filer logic", () => {
  describe("DOM Tree helpers", () => {
    it("getVisibleExplorerItems excludes items inside collapsed folders", () => {
      const tree = createExplorerTree();
      const visible = getVisibleExplorerItems(tree.root as unknown as HTMLElement);

      expect(visible).toHaveLength(4);
      expect(visible[0]).toBe(tree.folder1Title);
      expect(visible[1]).toBe(tree.file1Title);
      expect(visible[2]).toBe(tree.file2Title);
      expect(visible[3]).toBe(tree.folder2Title);
      // File3 inside collapsed Folder2 must be excluded
      expect(visible).not.toContain(tree.file3Title);
    });

    it("findParentFolderElement correctly resolves parent folder title", () => {
      const tree = createExplorerTree();

      // Child file inside Folder1
      const parent = findParentFolderElement(tree.file1Title as unknown as HTMLElement);
      expect(parent).toBe(tree.folder1Title);

      // Root level folder title has no parent folder
      const rootFolderParent = findParentFolderElement(tree.folder1Title as unknown as HTMLElement);
      expect(rootFolderParent).toBeNull();
    });

    it("isFolderElement identifies folders vs files", () => {
      const tree = createExplorerTree();
      expect(isFolderElement(tree.folder1Title as unknown as HTMLElement)).toBe(true);
      expect(isFolderElement(tree.file1Title as unknown as HTMLElement)).toBe(false);
    });

    it("isFolderCollapsed identifies collapsed status", () => {
      const tree = createExplorerTree();
      expect(isFolderCollapsed(tree.folder1Title as unknown as HTMLElement)).toBe(false);
      expect(isFolderCollapsed(tree.folder2Title as unknown as HTMLElement)).toBe(true);
    });
  });

  describe("KeyboardFiler controller", () => {
    let app: App;
    let originalWindow: typeof global.window;
    let windowListeners: Record<string, ((e: any) => void)[]> = {};

    beforeEach(() => {
      app = new App();
      windowListeners = {};
      originalWindow = global.window;

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
    });

    it("starts filer mode and selects active file if present", () => {
      const tree = createExplorerTree();
      const filer = new KeyboardFiler(app);

      const mockLeaf = {
        view: {
          containerEl: tree.root as unknown as HTMLElement,
        },
      };

      app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);
      const mockFile = new TFile();
      mockFile.path = "Folder1/File2.md";
      app.workspace.getActiveFile = vi.fn().mockReturnValue(mockFile);

      const started = filer.start();
      expect(started).toBe(true);
      expect(filer.isFilerActive()).toBe(true);

      // File2 must be selected
      expect(tree.file2Title.classList.has(FILER_SELECTED_CLASS)).toBe(true);
      expect(tree.file2Title.scrollIntoView).toHaveBeenCalled();

      filer.stop(false);
      expect(filer.isFilerActive()).toBe(false);
      expect(tree.file2Title.classList.has(FILER_SELECTED_CLASS)).toBe(false);
    });

    it("handles ArrowDown and ArrowUp navigation", () => {
      const tree = createExplorerTree();
      const filer = new KeyboardFiler(app);

      const mockLeaf = {
        view: {
          containerEl: tree.root as unknown as HTMLElement,
        },
      };
      app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);
      app.workspace.getActiveFile = vi.fn().mockReturnValue(null);

      filer.start();

      // Initially selected is Folder1Title (index 0)
      expect(tree.folder1Title.classList.has(FILER_SELECTED_CLASS)).toBe(true);

      const createKeyEvent = (key: string) =>
        ({
          key,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        } as unknown as KeyboardEvent);

      // Move Down -> File1
      filer.handleKey(createKeyEvent("ArrowDown"), tree.root as unknown as HTMLElement);
      expect(tree.file1Title.classList.has(FILER_SELECTED_CLASS)).toBe(true);
      expect(tree.folder1Title.classList.has(FILER_SELECTED_CLASS)).toBe(false);

      // Move Down -> File2
      filer.handleKey(createKeyEvent("ArrowDown"), tree.root as unknown as HTMLElement);
      expect(tree.file2Title.classList.has(FILER_SELECTED_CLASS)).toBe(true);

      // Move Up -> File1
      filer.handleKey(createKeyEvent("ArrowUp"), tree.root as unknown as HTMLElement);
      expect(tree.file1Title.classList.has(FILER_SELECTED_CLASS)).toBe(true);

      filer.stop(false);
    });

    it("handles ArrowRight to expand folder or move into children", () => {
      const tree = createExplorerTree();
      const filer = new KeyboardFiler(app);

      const mockLeaf = {
        view: {
          containerEl: tree.root as unknown as HTMLElement,
        },
      };
      app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);

      filer.start();
      // Currently on Folder1 (expanded). ArrowRight moves to first child (File1).
      filer.handleKey(
        { key: "ArrowRight", preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent,
        tree.root as unknown as HTMLElement
      );
      expect(tree.file1Title.classList.has(FILER_SELECTED_CLASS)).toBe(true);

      // Now select Folder2 (collapsed). ArrowRight should trigger click to expand.
      filer.selectElement(tree.folder2Title as unknown as HTMLElement);
      expect(tree.folder2Title.clicked).toBe(false);

      filer.handleKey(
        { key: "ArrowRight", preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent,
        tree.root as unknown as HTMLElement
      );
      expect(tree.folder2Title.clicked).toBe(true);

      filer.stop(false);
    });

    it("handles ArrowLeft to collapse folder or jump to parent folder", () => {
      const tree = createExplorerTree();
      const filer = new KeyboardFiler(app);

      const mockLeaf = {
        view: {
          containerEl: tree.root as unknown as HTMLElement,
        },
      };
      app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);

      filer.start();

      // Select child File1. ArrowLeft should jump to parent Folder1.
      filer.selectElement(tree.file1Title as unknown as HTMLElement);
      filer.handleKey(
        { key: "ArrowLeft", preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent,
        tree.root as unknown as HTMLElement
      );
      expect(tree.folder1Title.classList.has(FILER_SELECTED_CLASS)).toBe(true);

      // Now on Folder1 (expanded). ArrowLeft should click to collapse.
      expect(tree.folder1Title.clicked).toBe(false);
      filer.handleKey(
        { key: "ArrowLeft", preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent,
        tree.root as unknown as HTMLElement
      );
      expect(tree.folder1Title.clicked).toBe(true);

      filer.stop(false);
    });

    it("handles Enter on file to open it and stop filer", async () => {
      const tree = createExplorerTree();
      const filer = new KeyboardFiler(app);

      const mockLeaf = {
        view: {
          containerEl: tree.root as unknown as HTMLElement,
        },
      };
      app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);

      const testFile = new TFile();
      testFile.path = "Folder1/File1.md";
      app.vault.getAbstractFileByPath = vi.fn().mockReturnValue(testFile);

      const openFileMock = vi.fn().mockResolvedValue(undefined);
      app.workspace.getLeaf = vi.fn().mockReturnValue({ openFile: openFileMock });

      filer.start();
      filer.selectElement(tree.file1Title as unknown as HTMLElement);

      filer.handleKey(
        { key: "Enter", preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent,
        tree.root as unknown as HTMLElement
      );

      expect(openFileMock).toHaveBeenCalledWith(testFile);
      // Filer should stop after opening
      await Promise.resolve();
      expect(filer.isFilerActive()).toBe(false);
    });

    it("handles Escape to exit filer mode and restore focus", () => {
      const tree = createExplorerTree();
      const filer = new KeyboardFiler(app);

      const mockLeaf = {
        view: {
          containerEl: tree.root as unknown as HTMLElement,
        },
      };
      app.workspace.getLeavesOfType = vi.fn().mockReturnValue([mockLeaf]);

      filer.start();
      expect(filer.isFilerActive()).toBe(true);

      filer.handleKey(
        { key: "Escape", preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent,
        tree.root as unknown as HTMLElement
      );

      expect(filer.isFilerActive()).toBe(false);
      expect(tree.folder1Title.classList.has(FILER_SELECTED_CLASS)).toBe(false);
    });
  });
});

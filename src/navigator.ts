import { App, TFile, TFolder } from "obsidian";
import { PageFlowSettings, SortOrder } from "./types";

/**
 * Maps Obsidian's internal file explorer sortOrder setting strings to our SortOrder.
 */
export function mapObsidianSortOrder(sortSetting: string): SortOrder {
  switch (sortSetting) {
    case "alphabetical":
      return "name-asc";
    case "alphabeticalReverse":
      return "name-desc";
    case "byModifiedTime":
      return "mtime-desc";
    case "byModifiedTimeReverse":
      return "mtime-asc";
    case "byCreatedTime":
      return "ctime-desc";
    case "byCreatedTimeReverse":
      return "ctime-asc";
    default:
      return "name-asc";
  }
}

/**
 * Sorts files according to the visual DOM order in Obsidian's File Explorer.
 * Falls back to Obsidian's file explorer sortOrder setting, or name-asc if unavailable.
 */
export function sortFilesByExplorer(files: TFile[], app?: App): TFile[] {
  if (!app || files.length <= 1) {
    return sortFiles(files, "name-asc");
  }

  // 1. Try to read visual DOM order from File Explorer view
  try {
    const leaves = app.workspace.getLeavesOfType("file-explorer");
    if (leaves.length > 0) {
      const explorerView = leaves[0].view;
      if (explorerView && explorerView.containerEl) {
        const pathElements = explorerView.containerEl.querySelectorAll("[data-path]");
        if (pathElements.length > 0) {
          const domPaths: string[] = [];
          pathElements.forEach((el) => {
            const p = el.getAttribute("data-path");
            if (p) domPaths.push(p);
          });

          const fileMap = new Map<string, TFile>();
          for (const f of files) {
            fileMap.set(f.path, f);
          }

          const ordered: TFile[] = [];
          for (const p of domPaths) {
            const f = fileMap.get(p);
            if (f) {
              ordered.push(f);
              fileMap.delete(p);
            }
          }

          if (ordered.length > 0) {
            if (fileMap.size > 0) {
              const remaining = sortFiles(Array.from(fileMap.values()), "name-asc");
              ordered.push(...remaining);
            }
            return ordered;
          }
        }
      }
    }
  } catch {
    // Fall back to setting or name-asc
  }

  // 2. Fallback: check Obsidian's internal file explorer sortOrder setting
  try {
    interface FileExplorerPluginInstance {
      sortOrder?: string;
    }
    interface FileExplorerPlugin {
      instance?: FileExplorerPluginInstance;
    }
    interface InternalPluginsApp {
      internalPlugins?: {
        getPluginById?: (id: string) => FileExplorerPlugin | undefined;
      };
    }

    const customApp = app as unknown as InternalPluginsApp;
    const sortSetting = customApp.internalPlugins?.getPluginById?.("file-explorer")?.instance?.sortOrder;
    if (typeof sortSetting === "string") {
      const mappedOrder = mapObsidianSortOrder(sortSetting);
      return sortFiles(files, mappedOrder);
    }
  } catch {
    // Fallback to name-asc
  }

  // 3. Fallback to name-asc
  return sortFiles(files, "name-asc");
}

/**
 * Pure helper: sorts an array of TFiles based on the specified sort order.
 */
export function sortFiles(files: TFile[], sortOrder: SortOrder, app?: App): TFile[] {
  if (sortOrder === "file-explorer") {
    return sortFilesByExplorer(files, app);
  }

  const sorted = [...files];

  sorted.sort((a, b) => {
    switch (sortOrder) {
      case "name-asc":
        return a.basename.localeCompare(b.basename, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      case "name-desc":
        return b.basename.localeCompare(a.basename, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      case "ctime-desc":
        return (b.stat?.ctime ?? 0) - (a.stat?.ctime ?? 0);
      case "ctime-asc":
        return (a.stat?.ctime ?? 0) - (b.stat?.ctime ?? 0);
      case "mtime-desc":
        return (b.stat?.mtime ?? 0) - (a.stat?.mtime ?? 0);
      case "mtime-asc":
        return (a.stat?.mtime ?? 0) - (b.stat?.mtime ?? 0);
      default:
        return 0;
    }
  });

  return sorted;
}

/**
 * Pure helper: finds the next file in the list.
 */
export function findNextFile(files: TFile[], currentFile: TFile, loop = false): TFile | null {
  if (files.length <= 1) {
    return null;
  }

  const currentIndex = files.findIndex((f) => f.path === currentFile.path);
  if (currentIndex === -1) {
    return null;
  }

  if (currentIndex < files.length - 1) {
    return files[currentIndex + 1];
  }

  return loop ? files[0] : null;
}

/**
 * Pure helper: finds the previous file in the list.
 */
export function findPrevFile(files: TFile[], currentFile: TFile, loop = false): TFile | null {
  if (files.length <= 1) {
    return null;
  }

  const currentIndex = files.findIndex((f) => f.path === currentFile.path);
  if (currentIndex === -1) {
    return null;
  }

  if (currentIndex > 0) {
    return files[currentIndex - 1];
  }

  return loop ? files[files.length - 1] : null;
}

/**
 * Retrieves all Markdown files located in the parent folder of the given file.
 */
export function getFolderMarkdownFiles(file: TFile): TFile[] {
  const parent = file.parent;
  if (!parent || !(parent instanceof TFolder)) {
    return [file];
  }

  return parent.children.filter((child): child is TFile => {
    return child instanceof TFile && child.extension === "md";
  });
}

/**
 * Resolves the next markdown file to navigate to from the active file.
 */
export function resolveNextFile(
  currentFile: TFile,
  settings: PageFlowSettings,
  app?: App
): TFile | null {
  const folderFiles = getFolderMarkdownFiles(currentFile);
  const sorted = sortFiles(folderFiles, settings.sortOrder, app);
  return findNextFile(sorted, currentFile, settings.loopFolder);
}

/**
 * Resolves the previous markdown file to navigate to from the active file.
 */
export function resolvePrevFile(
  currentFile: TFile,
  settings: PageFlowSettings,
  app?: App
): TFile | null {
  const folderFiles = getFolderMarkdownFiles(currentFile);
  const sorted = sortFiles(folderFiles, settings.sortOrder, app);
  return findPrevFile(sorted, currentFile, settings.loopFolder);
}

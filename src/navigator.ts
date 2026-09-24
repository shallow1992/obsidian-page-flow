import { App, TFile, TFolder } from "obsidian";
import { PageFlowSettings, SortOrder } from "./types";

/**
 * Pure helper: sorts an array of TFiles based on the specified sort order.
 */
export function sortFiles(files: TFile[], sortOrder: SortOrder): TFile[] {
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
  settings: PageFlowSettings
): TFile | null {
  const folderFiles = getFolderMarkdownFiles(currentFile);
  const sorted = sortFiles(folderFiles, settings.sortOrder);
  return findNextFile(sorted, currentFile, settings.loopFolder);
}

/**
 * Resolves the previous markdown file to navigate to from the active file.
 */
export function resolvePrevFile(
  currentFile: TFile,
  settings: PageFlowSettings
): TFile | null {
  const folderFiles = getFolderMarkdownFiles(currentFile);
  const sorted = sortFiles(folderFiles, settings.sortOrder);
  return findPrevFile(sorted, currentFile, settings.loopFolder);
}

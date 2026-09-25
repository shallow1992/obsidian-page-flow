import { describe, expect, it } from "vitest";
import { findNextFile, findPrevFile, sortFiles } from "../src/navigator";
import { TFile } from "obsidian";

function createMockFile(basename: string, ctime: number, mtime: number): TFile {
  const file = new TFile();
  file.basename = basename;
  file.path = `${basename}.md`;
  file.extension = "md";
  file.stat = { ctime, mtime, size: 100 };
  return file;
}

describe("Navigator file sorting and resolution", () => {
  const fileA = createMockFile("A_Note", 1000, 3000);
  const fileB = createMockFile("B_Note", 2000, 2000);
  const fileC = createMockFile("C_Note", 3000, 1000);

  const files = [fileB, fileC, fileA];

  describe("sortFiles", () => {
    it("sorts by name ascending", () => {
      const sorted = sortFiles(files, "name-asc");
      expect(sorted.map((f) => f.basename)).toEqual(["A_Note", "B_Note", "C_Note"]);
    });

    it("sorts by name descending", () => {
      const sorted = sortFiles(files, "name-desc");
      expect(sorted.map((f) => f.basename)).toEqual(["C_Note", "B_Note", "A_Note"]);
    });

    it("sorts by ctime descending (newest first)", () => {
      const sorted = sortFiles(files, "ctime-desc");
      expect(sorted.map((f) => f.basename)).toEqual(["C_Note", "B_Note", "A_Note"]);
    });

    it("sorts by ctime ascending (oldest first)", () => {
      const sorted = sortFiles(files, "ctime-asc");
      expect(sorted.map((f) => f.basename)).toEqual(["A_Note", "B_Note", "C_Note"]);
    });

    it("sorts by mtime descending (recently modified first)", () => {
      const sorted = sortFiles(files, "mtime-desc");
      expect(sorted.map((f) => f.basename)).toEqual(["A_Note", "B_Note", "C_Note"]);
    });

    describe("file-explorer sort order", () => {
      it("falls back to name-asc when app is undefined", () => {
        const sorted = sortFiles(files, "file-explorer");
        expect(sorted.map((f) => f.basename)).toEqual(["A_Note", "B_Note", "C_Note"]);
      });

      it("sorts according to visual DOM order when file-explorer view is present", () => {
        const mockDomElements = [
          { getAttribute: (attr: string) => (attr === "data-path" ? "C_Note.md" : null) },
          { getAttribute: (attr: string) => (attr === "data-path" ? "A_Note.md" : null) },
          { getAttribute: (attr: string) => (attr === "data-path" ? "B_Note.md" : null) },
        ];

        const mockApp = {
          workspace: {
            getLeavesOfType: (type: string) => {
              if (type === "file-explorer") {
                return [
                  {
                    view: {
                      containerEl: {
                        querySelectorAll: (selector: string) =>
                          selector === "[data-path]" ? mockDomElements : [],
                      },
                    },
                  },
                ];
              }
              return [];
            },
          },
        } as any;

        const sorted = sortFiles(files, "file-explorer", mockApp);
        expect(sorted.map((f) => f.basename)).toEqual(["C_Note", "A_Note", "B_Note"]);
      });

      it("places files not in DOM at the end sorted by name-asc", () => {
        // Only B_Note is in the DOM
        const mockDomElements = [
          { getAttribute: (attr: string) => (attr === "data-path" ? "B_Note.md" : null) },
        ];

        const mockApp = {
          workspace: {
            getLeavesOfType: (type: string) => [
              {
                view: {
                  containerEl: {
                    querySelectorAll: () => mockDomElements,
                  },
                },
              },
            ],
          },
        } as any;

        const sorted = sortFiles(files, "file-explorer", mockApp);
        // B_Note first, then A_Note and C_Note sorted by name-asc
        expect(sorted.map((f) => f.basename)).toEqual(["B_Note", "A_Note", "C_Note"]);
      });

      it("falls back to internal file-explorer sortOrder setting if DOM elements are missing", () => {
        const mockApp = {
          workspace: {
            getLeavesOfType: () => [],
          },
          internalPlugins: {
            getPluginById: (id: string) => {
              if (id === "file-explorer") {
                return {
                  instance: {
                    sortOrder: "alphabeticalReverse",
                  },
                };
              }
              return null;
            },
          },
        } as any;

        const sorted = sortFiles(files, "file-explorer", mockApp);
        expect(sorted.map((f) => f.basename)).toEqual(["C_Note", "B_Note", "A_Note"]);
      });
    });
  });

  describe("findNextFile", () => {
    const list = [fileA, fileB, fileC];

    it("returns next file in middle", () => {
      expect(findNextFile(list, fileA, false)).toBe(fileB);
      expect(findNextFile(list, fileB, false)).toBe(fileC);
    });

    it("returns null at the end when loop is false", () => {
      expect(findNextFile(list, fileC, false)).toBeNull();
    });

    it("returns first file at the end when loop is true", () => {
      expect(findNextFile(list, fileC, true)).toBe(fileA);
    });

    it("returns null if only 1 file exists", () => {
      expect(findNextFile([fileA], fileA, true)).toBeNull();
    });
  });

  describe("findPrevFile", () => {
    const list = [fileA, fileB, fileC];

    it("returns previous file in middle", () => {
      expect(findPrevFile(list, fileC, false)).toBe(fileB);
      expect(findPrevFile(list, fileB, false)).toBe(fileA);
    });

    it("returns null at the beginning when loop is false", () => {
      expect(findPrevFile(list, fileA, false)).toBeNull();
    });

    it("returns last file at the beginning when loop is true", () => {
      expect(findPrevFile(list, fileA, true)).toBe(fileC);
    });
  });
});

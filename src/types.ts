export type SortOrder =
  | "name-asc"
  | "name-desc"
  | "ctime-desc"
  | "ctime-asc"
  | "mtime-desc"
  | "mtime-asc";

export interface PageFlowSettings {
  scrollPercentage: number;
  smoothScroll: boolean;
  scrollDuration: number;
  sortOrder: SortOrder;
  loopFolder: boolean;
  thresholdPx: number;
}

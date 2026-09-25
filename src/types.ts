export type SortOrder =
  | "file-explorer"
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
  maxQueuedScreens: number;
  maxVelocityMultiplier: number;
  sortOrder: SortOrder;
  loopFolder: boolean;
  thresholdPx: number;
}

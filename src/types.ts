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

export interface ScrollPhysicsOptions {
  percentage?: number;
  scrollPercentage?: number;
  smooth?: boolean;
  smoothScroll?: boolean;
  duration?: number;
  scrollDuration?: number;
  threshold?: number;
  thresholdPx?: number;
  maxQueuedScreens?: number;
  maxVelocityMultiplier?: number;
}

export type SortOrder =
  | "name-asc"
  | "name-desc"
  | "ctime-desc"
  | "ctime-asc"
  | "mtime-desc"
  | "mtime-asc";

export type EasingStyle =
  | "ease-in-out"
  | "ease-out"
  | "ease-out-gentle"
  | "linear";

export interface PageFlowSettings {
  scrollPercentage: number;
  smoothScroll: boolean;
  scrollDuration: number;
  easingStyle: EasingStyle;
  sortOrder: SortOrder;
  loopFolder: boolean;
  thresholdPx: number;
}

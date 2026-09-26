export const en = {
  commands: {
    scrollOrNext: "Forward: Scroll down or go to next file",
    scrollOrPrev: "Backward: Scroll up or go to previous file",
    scrollPageDown: "Scroll page down",
    scrollPageUp: "Scroll page up",
    goToNextFile: "Go to next file in folder",
    goToPrevFile: "Go to previous file in folder",
  },
  settings: {
    title: "Page Flow Settings",
    configureHotkeys: {
      name: "Configure hotkeys",
      desc: "Open Obsidian's hotkey settings filtered for Page Flow commands, or manually search 'Page Flow' in Settings > Hotkeys.",
      buttonText: "Configure hotkeys",
    },
    scrollAmount: {
      name: "Scroll amount (%)",
      desc: "Percentage of the screen height to scroll on each step (recommended: 80-90% for page reading, 15-30% for fine adjustment with rapid chaining).",
    },
    smoothScroll: {
      name: "Smooth scrolling",
      desc: "Animate scrolling smoothly between page steps.",
    },
    scrollDuration: {
      name: "Scroll animation duration (ms)",
      desc: "Base duration of the smooth scroll animation in milliseconds (default: 280ms). Rapid key presses automatically accelerate for swift navigation.",
    },
    maxQueuedScreens: {
      name: "Maximum queued scroll (screens)",
      desc: "Maximum screens to queue ahead during rapid presses. At 85% scroll, 5 screens equals about 6 key presses.",
    },
    maxVelocityMultiplier: {
      name: "Maximum acceleration multiplier",
      desc: "Maximum speed multiplier for rapid presses. Higher values accelerate faster.",
    },
    sortOrder: {
      name: "File sort order",
      desc: "Order for navigating folder files. 'File explorer order' follows the sidebar layout.",
      options: {
        fileExplorer: "File explorer order (Recommended)",
        nameAsc: "File name (A to Z)",
        nameDesc: "File name (Z to A)",
        ctimeDesc: "Created date (Newest first)",
        ctimeAsc: "Created date (Oldest first)",
        mtimeDesc: "Modified date (Newest first)",
        mtimeAsc: "Modified date (Oldest first)",
      },
    },
    loopFolder: {
      name: "Loop folder navigation",
      desc: "When reaching the last file in a folder, cycle back to the first file.",
    },
    boundaryThreshold: {
      name: "Boundary threshold (px)",
      desc: "Buffer in pixels to detect when the top or bottom of a note has been reached.",
    },
    resetToDefaults: {
      name: "Reset to default settings",
      desc: "Reset all settings back to their default values.",
      buttonText: "Reset to defaults",
    },
  },
  notices: {
    noNextFile: "No next file in folder",
    noPrevFile: "No previous file in folder",
    settingsReset: "Page Flow settings reset to defaults",
  },
};

export type TranslationStrings = typeof en;

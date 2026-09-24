import { App, Modal, Setting } from "obsidian";

export interface DiffEntry {
    localText: string;
    remoteText: string;
    remoteAuthor?: string;
    remoteDate?: string;
}

/**
 * Native Modal displaying side-by-side or stacked diff for conflict resolution
 */
export class DiffResolveModal extends Modal {
    constructor(
        app: App,
        private filename: string,
        private diff: DiffEntry,
        private onResolve: (chosenContent: string) => void
    ) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("gdrive-diff-modal");

        contentEl.createEl("h2", { text: `Resolve Conflict: ${this.filename}` });
        contentEl.createEl("p", {
            text: "Choose which version to keep, or merge both versions.",
            cls: "setting-item-description",
        });

        // 1. Two-column diff preview container
        const diffContainer = contentEl.createDiv({ cls: "gdrive-diff-container" });
        diffContainer.style.display = "grid";
        diffContainer.style.gridTemplateColumns = "1fr 1fr";
        diffContainer.style.gap = "var(--size-4-3)";
        diffContainer.style.marginBottom = "var(--size-4-4)";

        // Local Box
        const localBox = diffContainer.createDiv({ cls: "gdrive-diff-box" });
        localBox.style.border = "1px solid var(--background-modifier-border)";
        localBox.style.borderRadius = "var(--radius-m)";
        localBox.style.padding = "var(--size-4-2)";
        localBox.createEl("h4", { text: "💻 Local Version" });
        const localPre = localBox.createEl("pre");
        localPre.style.maxHeight = "250px";
        localPre.style.overflowY = "auto";
        localPre.createEl("code", { text: this.diff.localText });

        // Remote Box
        const remoteBox = diffContainer.createDiv({ cls: "gdrive-diff-box" });
        remoteBox.style.border = "1px solid var(--background-modifier-border)";
        remoteBox.style.borderRadius = "var(--radius-m)";
        remoteBox.style.padding = "var(--size-4-2)";
        remoteBox.createEl("h4", { text: `☁️ Cloud Version (${this.diff.remoteDate || "Recent"})` });
        const remotePre = remoteBox.createEl("pre");
        remotePre.style.maxHeight = "250px";
        remotePre.style.overflowY = "auto";
        remotePre.createEl("code", { text: this.diff.remoteText });

        // 2. Action Buttons
        new Setting(contentEl)
            .addButton((btn) => {
                btn.setButtonText("Keep Local Version")
                   .onClick(() => {
                       this.onResolve(this.diff.localText);
                       this.close();
                   });
            })
            .addButton((btn) => {
                btn.setButtonText("Keep Cloud Version")
                   .onClick(() => {
                       this.onResolve(this.diff.remoteText);
                       this.close();
                   });
            })
            .addButton((btn) => {
                btn.setButtonText("Merge Both (Append)")
                   .setCta()
                   .onClick(() => {
                       const merged = `${this.diff.localText}\n\n---\n### Cloud Version (${this.diff.remoteDate || "Remote"})\n\n${this.diff.remoteText}`;
                       this.onResolve(merged);
                       this.close();
                   });
            });
    }

    onClose(): void {
        this.contentEl.empty();
    }
}

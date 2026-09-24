import { App, Modal, Setting, AbstractInputSuggest, TFolder } from "obsidian";

/**
 * Autocomplete Input Suggest for Vault Folders
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
    constructor(app: App, textInputEl: HTMLInputElement) {
        super(app, textInputEl);
    }

    protected getSuggestions(query: string): TFolder[] {
        const lower = query.toLowerCase();
        const all = this.app.vault.getAllLoadedFiles();
        return all.filter((f): f is TFolder => f instanceof TFolder && f.path !== "/" && f.path.toLowerCase().includes(lower));
    }

    renderSuggestion(folder: TFolder, el: HTMLElement): void {
        el.setText(folder.path);
    }

    selectSuggestion(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
        this.setValue(folder.path);
        this.close();
    }
}

/**
 * Native Modal Dialog for Folder Exclusion Management
 */
export class ExcludeFolderModal extends Modal {
    private selectedFolder: string = "";

    constructor(app: App, private onAddFolder: (folder: string) => void) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h2", { text: "Add Excluded Folder" });
        contentEl.createEl("p", {
            text: "Select a folder to exclude from automatic synchronization.",
            cls: "setting-item-description",
        });

        new Setting(contentEl)
            .setName("Folder Path")
            .addText((text) => {
                text.setPlaceholder("e.g. Archive/Private");
                new FolderSuggest(this.app, text.inputEl);
                text.onChange((val) => {
                    this.selectedFolder = val.trim();
                });
            });

        new Setting(contentEl)
            .addButton((btn) => {
                btn.setButtonText("Cancel")
                   .onClick(() => this.close());
            })
            .addButton((btn) => {
                btn.setButtonText("Add Folder")
                   .setCta()
                   .onClick(() => {
                       if (this.selectedFolder) {
                           this.onAddFolder(this.selectedFolder);
                       }
                       this.close();
                   });
            });
    }

    onClose(): void {
        this.contentEl.empty();
    }
}

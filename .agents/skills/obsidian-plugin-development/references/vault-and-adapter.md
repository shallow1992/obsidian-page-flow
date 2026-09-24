# Vault & Adapter I/O Specifications

Based on [Obsidian Developer Docs: Vault API](https://docs.obsidian.md/Plugins/Vault).

---

## 1. `app.vault` vs `app.vault.adapter`

Obsidian provides two distinct layers for file system access:

| Feature / Aspect | `app.vault` (High-Level) | `app.vault.adapter` (Low-Level FileSystem) |
| :--- | :--- | :--- |
| **Target Files** | Markdown notes, user attachments (`TFile`, `TFolder`) | **ALL files**, including hidden `.obsidian/` configuration files |
| **Metadata Cache** | Automatically updates Obsidian metadata & backlinks | Direct disk access, bypasses metadata cache |
| **Events** | Triggers `create`, `modify`, `delete`, `rename` events | Does NOT trigger Obsidian vault events |
| **Binary Support** | `readBinary(file)`, `modifyBinary(file, buffer)` | `readBinary(path)`, `writeBinary(path, buffer)` |
| **Best Used For** | Normal note operations, reading user content | **Sync engines, config files (`.obsidian/`), raw binary I/O** |

---

## 2. Low-Level Adapter Usage Patterns

```typescript
const adapter = this.app.vault.adapter;

// 1. Check existence
const exists = await adapter.exists(".obsidian/appearance.json");

// 2. Read / Write Text
const text = await adapter.read(".obsidian/hotkeys.json");
await adapter.write(".obsidian/hotkeys.json", JSON.stringify(hotkeys, null, 2));

// 3. Read / Write Binary
const buffer: ArrayBuffer = await adapter.readBinary("attachments/photo.png");
await adapter.writeBinary("attachments/photo.png", buffer);

// 4. List Directory Contents (Recursive)
const listing = await adapter.list(".obsidian/plugins");
for (const folder of listing.folders) {
    console.log("Plugin folder:", folder);
}
for (const file of listing.files) {
    console.log("Config file:", file);
}

// 5. Stat (mtime & size)
const stat = await adapter.stat("note.md");
console.log("mtime:", stat?.mtime, "size:", stat?.size);

// 6. Safe Trash vs Direct Removal
await adapter.trashLocal("deleted-note.md"); // Move to .trash
// await adapter.remove("deleted-note.md");  // Permanent delete
```

---

## 3. POSIX Path Normalization & Path Traversal Security

Obsidian uses POSIX paths (forward slashes `/`) across all platforms (Windows, macOS, iOS, Android).

### 🛡️ Path Traversal Defense Rule

When accepting paths from external APIs (like Google Drive) or user inputs, always normalize paths and prevent directory traversal (`..`):

```typescript
export class PathUtil {
    static normalize(path: string): string {
        if (!path) return "";
        let clean = path.replace(/\\+/g, "/").replace(/\/+/g, "/").trim();
        clean = clean.replace(/^\/+/, "").replace(/\/+$/, "");

        const parts = clean.split("/");
        const safeParts: string[] = [];

        for (const part of parts) {
            if (!part || part === ".") continue;
            if (part === "..") {
                // Reject or resolve safely within vault boundary
                safeParts.pop();
            } else {
                safeParts.push(part);
            }
        }
        return safeParts.join("/");
    }

    static dirname(path: string): string {
        const norm = this.normalize(path);
        const lastSlash = norm.lastIndexOf("/");
        return lastSlash === -1 ? "" : norm.substring(0, lastSlash);
    }

    static basename(path: string): string {
        const norm = this.normalize(path);
        const lastSlash = norm.lastIndexOf("/");
        return lastSlash === -1 ? norm : norm.substring(lastSlash + 1);
    }
}
```

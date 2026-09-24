# Mobile Compatibility (iOS / Android) Guide

Based on [Obsidian Developer Docs: Mobile Plugins](https://docs.obsidian.md/Plugins/Getting+started/Mobile+development).

---

## 1. Golden Rule: No Node.js Built-ins

Mobile Obsidian runs inside a Capacitor / WebView sandbox:
- ❌ **Forbidden**: `require("fs")`, `require("path")`, `require("crypto")`, `require("os")`, `require("child_process")`
- ❌ **Forbidden**: Dynamic `eval()` or unbundled `require()`

### Replacements Table

| Node.js Module / API | Web / Obsidian Standard Replacement |
| :--- | :--- |
| `fs.readFile` / `fs.writeFile` | `app.vault.adapter.readBinary` / `writeBinary` |
| `path.join` / `path.resolve` | Custom POSIX `PathUtil` with forward slashes `/` |
| `crypto.createHash("sha256")` | `window.crypto.subtle.digest("SHA-256", buffer)` |
| `os.platform()` / `process.platform` | `Platform.isMobile`, `Platform.isDesktop`, `Platform.isIosApp`, `Platform.isAndroidApp` |
| `http.request` / `https.request` | `requestUrl` from `obsidian` |

---

## 2. Using the `Platform` API

Obsidian exports a `Platform` helper object for conditional feature branching:

```typescript
import { Platform } from "obsidian";

if (Platform.isMobile) {
    console.log("Running on mobile device (iOS or Android)");
}

if (Platform.isDesktop) {
    console.log("Running on desktop (macOS, Windows, or Linux)");
}

if (Platform.isIosApp) {
    console.log("Running on iOS iPhone/iPad");
}

if (Platform.isAndroidApp) {
    console.log("Running on Android");
}
```

---

## 3. Web Crypto API Pattern (Hashing & PKCE)

Use the standard Web Crypto API for SHA-256 hashing and PKCE S256 code challenge generation:

```typescript
export class CryptoUtil {
    static async sha256(data: string | ArrayBuffer): Promise<ArrayBuffer> {
        const buffer = typeof data === "string" ? new TextEncoder().encode(data) : data;
        return await window.crypto.subtle.digest("SHA-256", buffer);
    }

    static async generatePkceChallenge(verifier: string): Promise<string> {
        const hash = await this.sha256(verifier);
        const bytes = new Uint8Array(hash);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        // Base64-URL encode
        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }
}
```

---

## 4. Mobile Stability: Desktop-Only Plugin Guards

If your plugin synchronizes or manages community plugins across devices, guard against running desktop-only plugins on mobile:

```typescript
async isPluginDesktopOnly(pluginId: string): Promise<boolean> {
    const adapter = this.app.vault.adapter;
    const manifestPath = `.obsidian/plugins/${pluginId}/manifest.json`;
    if (await adapter.exists(manifestPath)) {
        try {
            const content = await adapter.read(manifestPath);
            const manifest = JSON.parse(content);
            return manifest.isDesktopOnly === true;
        } catch {}
    }
    return false;
}
```

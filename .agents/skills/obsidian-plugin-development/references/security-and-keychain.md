# Security & OS Keychain Storage Guide

Based on [Obsidian Developer Docs: Secret Storage API](https://docs.obsidian.md/Reference/TypeScript+API/SecretStorage).

---

## 1. Zero Plaintext Secrets Principle

Obsidian plugins must **NEVER store secrets in plaintext**:
- ❌ **`data.json`**: Plaintext file in user's vault, often synced across public cloud storages or committed to Git.
- ❌ **`localStorage`**: Unencrypted browser storage, shared across plugins and vulnerable to inspection.

---

## 2. Official `app.secretStorage` API

Obsidian provides native access to the **OS Keychain**:
- **Windows**: Windows Credential Manager
- **macOS**: Apple Keychain
- **iOS**: iOS Keychain
- **Android**: Android Keystore

### Secret Storage Usage Pattern

```typescript
export class SecretManager {
    constructor(private app: App) {}

    // Key naming: Use kebab-case with plugin prefix
    private readonly CLIENT_SECRET_KEY = "my-plugin-client-secret";
    private readonly REFRESH_TOKEN_KEY = "my-plugin-refresh-token";

    async saveClientSecret(secret: string): Promise<void> {
        if (!secret) {
            await this.app.secretStorage.setSecret(this.CLIENT_SECRET_KEY, null);
        } else {
            await this.app.secretStorage.setSecret(this.CLIENT_SECRET_KEY, secret);
        }
    }

    async getClientSecret(): Promise<string | null> {
        return (await this.app.secretStorage.getSecret(this.CLIENT_SECRET_KEY)) || null;
    }

    async clearAllSecrets(): Promise<void> {
        await this.app.secretStorage.setSecret(this.CLIENT_SECRET_KEY, null);
        await this.app.secretStorage.setSecret(this.REFRESH_TOKEN_KEY, null);
    }
}
```

---

## 3. Secure HTTP Communication (`requestUrl`)

Always use Obsidian's built-in `requestUrl` function instead of standard `fetch` or Node.js `http`/`https`:

```typescript
import { requestUrl, RequestUrlParam, RequestUrlResponse } from "obsidian";

const response: RequestUrlResponse = await requestUrl({
    url: "https://www.googleapis.com/drive/v3/files",
    method: "GET",
    headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
    },
});

if (response.status !== 200) {
    throw new Error(`API Error: ${response.status} - ${response.text}`);
}

const data = response.json;
```

### Why `requestUrl`?
1. **CORS Bypass**: Native desktop/mobile network stack bypasses browser CORS restrictions.
2. **Mobile Compatibility**: Works seamlessly on iOS and Android without extra polyfills.
3. **Cookie & Proxy Handling**: Integrates with system proxy configurations.

---

## 4. Dangerous Extension & Sensitive File Blocking

When developing sync or file-handling plugins, always block dangerous executables and private credentials:

```typescript
export class SecurityFilter {
    private static readonly DANGEROUS_EXTENSIONS = new Set([
        "exe", "bat", "cmd", "sh", "bash", "bin", "app", "dll", "so", "dylib",
        "msi", "dmg", "pkg", "deb", "rpm", "apk", "ipa"
    ]);

    static isFileBlocked(filename: string): boolean {
        const ext = filename.split(".").pop()?.toLowerCase() || "";
        
        // 1. Executables
        if (this.DANGEROUS_EXTENSIONS.has(ext)) return true;

        // 2. Environment files
        if (filename === ".env" || filename.startsWith(".env.")) return true;

        // 3. Private keys & certificates
        if (filename.startsWith("id_") || /\.(pem|key|p12|pfx|pkcs12|kdbx)$/i.test(filename)) {
            return true;
        }

        return false;
    }
}
```

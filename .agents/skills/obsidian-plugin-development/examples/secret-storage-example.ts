import { App } from "obsidian";

/**
 * Robust Secret Manager using Obsidian's native OS Keychain API (app.secretStorage)
 * with graceful fallback for testing/mock environments.
 */
export class SecretManager {
    private readonly CLIENT_SECRET_KEY = "gdrive-sync-client-secret";
    private readonly REFRESH_TOKEN_KEY = "gdrive-sync-refresh-token";

    constructor(private app: App) {}

    /**
     * Store secret in OS Keychain (Windows Credential Manager / macOS Keychain / iOS Keychain / Android Keystore)
     */
    async setSecret(key: string, secret: string | null): Promise<void> {
        try {
            if (this.app.secretStorage && typeof this.app.secretStorage.setSecret === "function") {
                await this.app.secretStorage.setSecret(key, secret);
            }
        } catch (e) {
            console.error(`[SecretManager] Failed to save secret for key: ${key}`, e);
            throw new Error(`Failed to access OS Keychain: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    /**
     * Retrieve secret from OS Keychain
     */
    async getSecret(key: string): Promise<string | null> {
        try {
            if (this.app.secretStorage && typeof this.app.secretStorage.getSecret === "function") {
                return (await this.app.secretStorage.getSecret(key)) || null;
            }
            return null;
        } catch (e) {
            console.error(`[SecretManager] Failed to read secret for key: ${key}`, e);
            return null;
        }
    }

    async saveClientSecret(secret: string): Promise<void> {
        await this.setSecret(this.CLIENT_SECRET_KEY, secret ? secret.trim() : null);
    }

    async getClientSecret(): Promise<string | null> {
        return await this.getSecret(this.CLIENT_SECRET_KEY);
    }

    async saveRefreshToken(token: string): Promise<void> {
        await this.setSecret(this.REFRESH_TOKEN_KEY, token ? token.trim() : null);
    }

    async getRefreshToken(): Promise<string | null> {
        return await this.getSecret(this.REFRESH_TOKEN_KEY);
    }

    /**
     * Completely wipe all credentials from OS Keychain
     */
    async clearAll(): Promise<void> {
        await this.setSecret(this.CLIENT_SECRET_KEY, null);
        await this.setSecret(this.REFRESH_TOKEN_KEY, null);
    }

    async isConnected(): Promise<boolean> {
        const token = await this.getRefreshToken();
        return Boolean(token && token.length > 0);
    }
}

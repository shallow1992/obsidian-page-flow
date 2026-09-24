---
name: obsidian-plugin-development
description: >-
  Comprehensive knowledge base, design system, and procedural guidelines for developing high-quality,
  mobile-compatible, and secure Obsidian plugins based on official Obsidian developer documentation (docs.obsidian.md).
  Use whenever designing, developing, refactoring, or reviewing Obsidian plugins, including UI creation (Settings, Modals, Views),
  Vault I/O, OS Keychain storage (SecretStorage), mobile compatibility (iOS/Android), and community submission standards.
---

# Obsidian Plugin Development Skill

This skill guides AI agents and developers in building robust, secure, and officially compliant Obsidian plugins based on the [Obsidian Developer Documentation](https://docs.obsidian.md/Home).

---

## ⚡ Core Rules & Guiding Principles

When developing or modifying Obsidian plugins, strictly adhere to these fundamental principles:

1. **Mobile-First Compatibility (Strict)**:
   - **NEVER** use Node.js built-in modules (`fs`, `path`, `crypto`, `os`, `http`, `child_process`). They will crash on mobile (iOS/Android).
   - Use standard Web APIs (`crypto.subtle`, `TextEncoder`, `TextDecoder`, `fetch`) and Obsidian APIs (`app.vault.adapter`, custom POSIX `PathUtil`).
   - Use `requestUrl` for HTTP/HTTPS requests to avoid CORS and ensure mobile networking compatibility.
2. **Keychain Security (Zero Plaintext Secrets)**:
   - **NEVER** store API keys, passwords, client secrets, or OAuth refresh tokens in `data.json` or `localStorage`.
   - Store sensitive credentials using Obsidian's official `app.secretStorage` (OS Keychain).
3. **Strict Resource Lifecycle & Memory Management**:
   - Register all UI listeners and intervals using `this.registerEvent()`, `this.registerDomEvent()`, and `this.registerInterval()`.
   - Ensure clean resource disposal in `onunload()`.
4. **Obsidian Design System Alignment**:
   - Use Obsidian's native `PluginSettingTab`, `Setting`, `Modal`, `AbstractInputSuggest`, and Lucide icons.
   - Use Obsidian CSS variables (e.g., `var(--background-primary)`, `var(--interactive-accent)`) for styling.
5. **Vault Boundary Defense**:
   - Guard against path traversal (`..`) when writing to files using `app.vault.adapter`.

---

## 📚 Detailed References Guide

Consult these specialized reference documents for in-depth specifications and patterns:

| Reference Area | Document Link | Topics Covered |
| :--- | :--- | :--- |
| **Lifecycle & Architecture** | [references/lifecycle-and-architecture.md](./references/lifecycle-and-architecture.md) | `onload`/`onunload`, settings deep merge, commands, ribbon icons, event registry. |
| **Vault & File I/O** | [references/vault-and-adapter.md](./references/vault-and-adapter.md) | `app.vault` vs `app.vault.adapter`, binary I/O, `.obsidian/` access, path normalization. |
| **UI & Design System** | [references/ui-and-design-system.md](./references/ui-and-design-system.md) | `Setting`, `PluginSettingTab`, `Modal`, `AbstractInputSuggest`, Lucide icons, CSS variables. |
| **Security & Keychain** | [references/security-and-keychain.md](./references/security-and-keychain.md) | `app.secretStorage` API, password masking, `requestUrl`, dangerous extension filtering. |
| **Mobile Compatibility** | [references/mobile-compatibility.md](./references/mobile-compatibility.md) | iOS/Android guidelines, Web Crypto, `Platform` API, desktop-only plugin guards. |
| **Community Guidelines** | [references/community-guidelines.md](./references/community-guidelines.md) | Official review standards, `manifest.json`, CSS scoping, release workflow. |

---

## 🛠️ Code Examples & Snippets

Pre-built, copy-ready TypeScript templates:

- [examples/setting-tab-example.ts](./examples/setting-tab-example.ts): Modular settings tab with password masking, locks, and sections.
- [examples/modal-dialog-example.ts](./examples/modal-dialog-example.ts): Custom native modal dialog with autocomplete suggestion.
- [examples/diff-merge-view-example.ts](./examples/diff-merge-view-example.ts): Side-by-side diff preview and conflict resolution UI.
- [examples/secret-storage-example.ts](./examples/secret-storage-example.ts): Secure secret manager integrating `app.secretStorage`.

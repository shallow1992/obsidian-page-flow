# AI Agent Guidelines (AGENTS.md)

Guidelines and operational principles for AI coding agents and human contributors working on **Page Flow** (`obsidian-page-flow`).

---

## 1. Development Environment & Docker Isolation (Mandatory)

To keep the host environment clean, isolated, and fully reproducible:
- **Execute all project commands inside Docker containers**:
  - `docker compose run --rm page-flow npm run build` (Type check & bundle)
  - `docker compose run --rm page-flow npm test` (Run unit tests with Vitest)
  - `docker compose run --rm page-flow npm install <package>` (Dependency management)
- **Zero Host Execution**: Never install dependencies or run uncontained build/test scripts directly on the host machine.
- **Single-Command Execution**: When running shell commands, execute each command individually (avoid chaining with `&&`, `;`, or `||`) to preserve command auto-approval allowlists.

---

## 2. Cross-Platform & Mobile-First Compatibility

Page Flow is designed to provide smooth page reading across Desktop and Mobile:
- **Zero Node.js Built-ins in Core**: Do NOT import `fs`, `child_process`, `crypto`, `path` directly. Use Obsidian's Vault API and standard Web APIs.
- **Clean Scroller & View Abstraction**:
  - Abstract DOM scrolling differences between Reading View (`.markdown-preview-view`) and Live Preview / Source Mode (`.cm-scroller`).
  - Use `window.requestAnimationFrame` or CSS smooth scroll where appropriate.

---

## 3. Core Architecture & Design Principles

- **Modular Separation of Concerns**:
  - `scroller.ts`: Handles viewport height calculations, percentage-based scroll amounts, and boundary detection (top/bottom).
  - `navigator.ts`: Resolves adjacent files (next/previous) within folders or specified scopes based on configurable sort orders (name, ctime, mtime).
  - `settings.ts`: Typed settings store and Obsidian settings tab UI.
  - `main.ts`: Plugin lifecycle, command registration, and high-level command orchestration.
- **Defensive Boundary Handling**:
  - Gracefully handle end-of-folder boundaries (loop around vs toast notification).
  - Respect non-markdown files and hidden/system folders.

---

## 4. Git Workflow, Conventional Commits & Releases

- **Conventional Commits**:
  - Commit messages and PR titles must use standard prefixes:
    - `feat:` (New features)
    - `fix:` (Bug fixes)
    - `refactor:` (Code refactoring with no functional change)
    - `docs:` (Documentation changes)
    - `test:` (Adding or updating tests)
    - `ci:` (CI/CD workflows and configuration)
    - `chore:` (Dependencies, release chores, maintenance)
    - `sec:` (Security vulnerability fixes)
- **PR Merge Strategy (Squash and Merge)**:
  - All feature branches must be squash-merged into `master` to maintain a clean, linear git history.
- **Remote CI Verification Obligation (Mandatory)**:
  - Check GitHub Actions CI status using `gh pr checks` or `gh run view`. Ensure all checks pass before merging.

---

## 5. Security & Privacy (Zero Leak Policy)

- **Zero Plaintext Secrets**: Never commit tokens, credentials, or personal API keys.
- **Path Sanitization**: Normalize paths and avoid directory traversal.
- **Zero Host Environment Leaks**: Never hardcode host machine names, OS usernames, absolute `/Users/...` paths, or personal email addresses in source code, commits, or documentation.

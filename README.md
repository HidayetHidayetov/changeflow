# ChangeFlow

Desktop app for creating formal **Change Request** documents in seconds — instead of filling Word templates by hand.

Fill in a form, pull data from GitLab merge requests, and export a print-ready document (Word / PDF) with one click.

![platform](https://img.shields.io/badge/platform-Windows-blue) ![license](https://img.shields.io/badge/license-MIT-green)

## Download

No build needed — grab the installer from **[Releases](https://github.com/HidayetHidayetov/changeflow/releases)** (`ChangeFlow_*_x64-setup.exe`), install, and open the app. Updates arrive automatically inside the app.

## Features

- 📝 Guided form for the full change record: title, risk, impact, test plan, rollback plan, decision block
- 🦊 **GitLab integration** — paste an MR IID and auto-fill title, branches, commits, diff stats, dates and status (works with self-hosted GitLab)
- 📄 One-click export to **Word (.docx)** and **PDF / print** — same official layout everywhere
- 🎨 Bilingual UI (**AZ / EN**), dark and light themes
- 🔐 Tokens stored encrypted on-device (Stronghold vault), never leave your machine except for GitLab API calls
- 🔄 Built-in auto-update, offline-first (no account, no server)

## Usage

1. Open **⚙ Settings** and add your GitLab Base URL, private token and default project.
2. Fill the form (or press **Fetch** on the Git tab with an MR IID to auto-fill).
3. Press **Word yüklə / Download Word** or **PDF / Çap**.
4. New document numbering is automatic.

Document IDs linked to a merge request use the `PROJECT-MRIID` format (e.g. `EMIOS-142`), so IDs stay unique across the whole team without a central server.

## Development

Requirements: **Node.js 20+**, **Rust stable** (with MSVC Build Tools on Windows).

```bash
cd changeflow
npm install
npm test        # Vitest unit tests
npm run dev     # web preview (fast iteration)
npm run tauri dev   # desktop window
```

Production build:

```bash
npm run tauri build -- --bundles nsis
```

> **Note (Windows, corporate networks):** the Stronghold dependency downloads a prebuilt `libsodium` binary over plain HTTP, which some networks block. If the Rust build fails on `libsodium-sys-stable`, download these two files over HTTPS into a folder and point `SODIUM_DIST_DIR` at it before building:
>
> - `https://download.libsodium.org/libsodium/releases/LATEST.tar.gz`
> - `https://download.libsodium.org/libsodium/releases/LATEST.tar.gz.minisig`
> - `https://download.libsodium.org/libsodium/releases/libsodium-1.0.22-stable-msvc.zip`
> - `https://download.libsodium.org/libsodium/releases/libsodium-1.0.22-stable-msvc.zip.minisig`
>
> ```powershell
> $env:SODIUM_DIST_DIR = "$env:USERPROFILE\.tauri\sodium-dist"
> ```

Releases are automated: pushing a `v*` tag runs tests and builds the signed installer via GitHub Actions (`.github/workflows/release.yml`). Signing keys live in repo secrets (`TAURI_SIGNING_PRIVATE_KEY*`).

## Tech

Tauri 2.0 + React + TypeScript + Vite + Tailwind CSS. State and history are stored locally on-device; there is no backend.

## Contributing

Issues and pull requests are welcome. Please keep commits in the [Conventional Commits](https://www.conventionalcommits.org/) format (`feat:`, `fix:`, `chore:` …).

## License

MIT — see [LICENSE](LICENSE).

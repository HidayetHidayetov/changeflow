# ChangeFlow

ITIL əsaslı Dəyişiklik Sorğusu / Change Request generatoru — desktop app (hazırda web MVP).

AZ + EN bilingual sənəd: `CR-YYYY-NNNN` nömrələmə, Git info, təsir/test, rollback, Word (.docx) + PDF/Print.

## Quickstart

```bash
cd changeflow
npm install
npm run dev
npm run build
```

- `Word ixrac` → `CR-*.docx` yükləyir
- `PDF / Çap et` → print dialoqu (Save as PDF və ya printer)
- Tarixçə localStorage-də saxlanır, tam offline işləyir.

## Roadmap

- [x] Faza 0: SPEC (`../SPEC.md`)
- [x] Faza 1 MVP: form + A4 preview + docx/pdf/print + dark/light
- [ ] Faza 1b: Tauri 2.0 shell (Rust lazımdır — `cargo` quraşdırılandan sonra)
- [ ] Faza 2: GitLab self-hosted + GitHub inteqrasiyası
- [ ] Faza 3: AI təklif (BYOK/Ollama) + Release (.msi/.dmg)

## Stack

Vite + React + TypeScript + Tailwind v4 + `docx` + `file-saver`. Tauri wrapper gələcək.

## License

MIT

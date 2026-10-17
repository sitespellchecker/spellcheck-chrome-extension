# AGENTS.md - Site Spell Checker Chrome extension

# Standing rules

Each rule names its check. `npm run check` runs `node --check` on every script and `tests/*.test.js`; run it locally before every PR. **CI is pending:** the proposed `.github/workflows/guardrails.yml` (runs `npm run check` and checks the zip contents on PRs) and the `release.yml` change (runs the check, then builds the zip with `scripts/package.sh`) are in the PR that added this file and aren't in the repo yet. Until they land, PRs aren't checked and `release.yml` still builds the old pattern-based zip.

| Rule | Check |
| --- | --- |
| Open PRs as drafts. Andy reviews and merges; never mark ready, merge, tag a release (`v*` tags publish to the Chrome Web Store) or run the release workflow yourself. | Review |
| No `[DO NOT MERGE]` or similar in PR titles. Use a draft instead. | Review |
| Say what actually ran. This repo used to have `"test": "echo 'No tests configured'"`, and this file described TypeScript, Jest and ESLint that never existed. | `npm run check` (local until `guardrails.yml` lands) |
| Privacy is a product claim (PRIVACY.md: "We collect nothing", no automatic network requests). The extension may only fetch its own dictionary files; the only outbound link is the user-clicked upsell to sitespellchecker.com. No analytics or telemetry. | `tests/guardrails.test.js` |
| Keep permissions minimal (1.1.1 was a Web Store rejection fix): `activeTab`, `scripting`, `storage` only, no host permissions, no `content_scripts`, no background worker. Every permission is explained in PRIVACY.md. | `tests/guardrails.test.js` |
| Bump the version in `manifest.json`, `package.json` and a new `CHANGELOG.md` entry together. | `tests/guardrails.test.js` |
| The store zip is the allowlist in `scripts/package.sh`. Add new runtime files there; dev files (`.agents/`, `.cursor/`, `tests/`, `package.json`, docs) never ship. | `tests/guardrails.test.js`; `guardrails.yml` once added |
| Never invent numbers, ratings or claims in the store listing, popup or docs. Every claim needs a source and Andy's OK. | `tests/guardrails.test.js` |
| It checks spelling only. Popup, manifest and docs say "spelling", never "grammar" or "and more". | `tests/guardrails.test.js` |
| Page text is untrusted: render it with `textContent` or `escapeHtml()`, never raw `innerHTML`. | Review |
| Bring a branch up to date by merging `main`. Never force-push or rewrite pushed history. | Review |

## Project overview

Manifest V3 extension in plain JavaScript (no build step, no TypeScript, no bundler). `popup.js` injects `lib/typo.js` + `content.js` and `content.css` into the active tab on demand. `content.js` loads the bundled Hunspell dictionary (`lib/en_US.aff`/`.dic`) with Typo.js, highlights misspellings, and caches results in `chrome.storage.session` for 5 minutes.

## Commands

```bash
npm run check   # node --check on every script + node --test tests/*.test.js
npm test        # tests only
npm run build   # bash scripts/package.sh -> dist/site-spellchecker-<version>.zip
```

Load unpacked from the repo root in `chrome://extensions` for manual testing.

## Chrome Extension Best Practices

### Manifest V3

- Follow strict CSP (Content Security Policy)
- Background work needs a service worker; this extension deliberately has none (see Standing rules)
- Declare minimal required permissions in manifest
- Use `chrome.action` API for browser actions

### Security

- Never use `innerHTML` - use `textContent` or proper DOM methods
- Sanitize all user input before display
- Validate message origins in runtime message handlers
- Use `chrome.storage` instead of localStorage

### Performance

- Debounce spell checking on scroll/resize events
- Use Intersection Observer for lazy checking
- Throttle storage writes
- Clean up event listeners in content scripts

## Git Workflow

```bash
# Feature branch naming: feature/description
# Bug fix naming: fix/description
# Format commit messages: type(scope): description

feat(spell-checker): add real-time checking
fix(popup): resolve settings save issue
docs(readme): update installation instructions
```

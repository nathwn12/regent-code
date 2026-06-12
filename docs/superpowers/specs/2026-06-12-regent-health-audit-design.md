# Regent Health Audit Design

**Date:** 2026-06-12
**Goal:** Verify Regent is fully working and 100% healthy. No new features. Fix any bugs found, add ESLint + Prettier quality gates.

## Architecture

No structural changes. Audit adds tooling config files. May touch `regent.js` + `regent.test.js` for bugfixes only.

## Files created

| File               | Purpose                                                           |
| ------------------ | ----------------------------------------------------------------- |
| `.prettierrc`      | Prettier config (single quotes, trailing commas, 100 print width) |
| `.prettierignore`  | Skip `node_modules/`, `package-lock.json`                         |
| `eslint.config.js` | Flat config: `eslint:recommended` + `prettier`                    |

## Files that may be modified

| File                               | Why                                              |
| ---------------------------------- | ------------------------------------------------ |
| `.opencode/plugins/regent.js`      | Bugfixes from audit                              |
| `.opencode/plugins/regent.test.js` | New tests for uncovered paths + regression tests |

## Audit checklist (Phase B)

For each function/branch in `regent.js`:

1. `parseFrontmatter` -- regex edge cases, booleans, quoted strings
2. `extractContent` -- empty file, no/malformed frontmatter
3. `readMarkdownAssets` -- missing dir, empty dir, non-.md files
4. `discoverBundledCommands` -- empty body, missing description, optional fields
5. `discoverBundledAgents` -- mode/hidden fields
6. `getBootstrap` -- missing skill file, cache behavior
7. `dispatchSubagent` -- 4 status paths, error handling, files_changed regex, session cleanup
8. `delegate` -- normal path, missing args
9. `delegate_many` -- empty tasks, summary accuracy
10. `research` -- empty questions, scope passing
11. `explore` -- no worktree context, focus path not found
12. `verify` -- partial match, extras detection
13. `config` hook -- duplicate paths, overwrite guards
14. `experimental.chat.messages.transform` -- multiple users, no users, existing bootstrap guard

## Success criteria

- `node --test .opencode/plugins/regent.test.js` -- all tests pass, 0 failures
- `npx eslint .` -- 0 errors, 0 warnings
- `npx prettier --check .` -- clean
- Git tree clean

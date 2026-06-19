# Contributing to Regent

## Architecture overview

```
regent/
├── .opencode/                # Plugin code
│   ├── plugins/
│   │   ├── regent.js         # Plugin entry — 6 custom tools, config, bootstrap
│   │   └── regent.test.js    # 23+ tests
│   ├── commands/             # 7 slash command templates (.md with frontmatter)
│   ├── agents/               # 2 custom subagent definitions (.md with frontmatter)
│   ├── package.json          # Plugin dependency: @opencode-ai/plugin
│   └── INSTALL.md
├── .opencode/skills/         # 7 skills loaded by OpenCode's skill system
│   ├── orchestrator/         # 5-phase pipeline (clarify → plan → execute → verify → report)
│   ├── tdd/                  # Red-green-refactor with iron law enforcement
│   ├── diagnose/             # Systematic debugging: loop → reproduce → hypothesise → fix
│   ├── verification-before-completion/
│   ├── prototype/            # Disposable by design
│   ├── zoom-out/             # Codebase orientation
│   └── using-regent/         # Bootstrap: constitution ref + tool/command catalog
├── CONSTITUTION.md           # Single source of truth for court roles, principles, iron laws
├── AGENTS.md                 # Agent development guide
├── tsconfig.json             # JSDoc typecheck on regent.js
├── eslint.config.js          # ESLint config
├── package.json              # Dev tooling (eslint, prettier, typescript)
└── docs/
    └── superpowers/specs/    # Design documents output by clarify phase
```

## How the plugin works

1. **`RegentPlugin`** is the default export. OpenCode calls it with `{ client }` (SDK client).
2. **`config()`** registers the skills path, slash commands (from `commands/`), and custom subagents (from `agents/`).
3. **`experimental.chat.messages.transform`** injects the `using-regent` skill body into every first user message as bootstrap context.
4. **6 custom tools** (`delegate`, `delegate_many`, `research`, `explore`, `changed-files`, `verify`) are registered via `tool: { ... }`.

## Adding a new skill

1. Create `.opencode/skills/<name>/SKILL.md` with frontmatter (`name:` and `description:`).
2. Add to `README.md` skill table.
3. If it needs a slash command, create `.opencode/commands/<name>.md`.

## Running checks

```bash
npm install                       # root devDependencies (lockfile not committed)
cd .opencode && npm ci && cd ..   # plugin dependency (lockfile committed for CI)
npm run verify                    # format:check → lint → typecheck → test
```

You can also run individual checks:

```bash
npm test                       # node --test .opencode/plugins/regent.test.js
npm run lint                   # eslint
npm run typecheck              # tsc --noEmit (JSDoc types)
npm run format:check           # prettier --check
```

## Code style

- ESM only (`import`/`export`, no `require`)
- No comments — let code speak
- Error paths produce structured JSON, never throw
- Prefer `context.directory` over `process.cwd()` for path resolution

## Verdict gates

Before committing: `npm run verify` must pass (format → lint → typecheck → test).

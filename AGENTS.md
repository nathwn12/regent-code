# Regent — Agent Guide

Before any work: read [`CONSTITUTION.md`](CONSTITUTION.md) — it defines Regent identity, court roles, principles, and iron laws.

## Quick start

```bash
cd .opencode
npm install
node --test plugins/regent.test.js
```

All 22+ tests must pass before committing.

## Development

- **Plugin entry:** `.opencode/plugins/regent.js` — registers 5 custom tools, 6 slash commands, 2 subagents, and bootstrap injection
- **Skills:** `.opencode/skills/<name>/SKILL.md` with frontmatter (`name:`, `description:`)
- **Commands:** `.opencode/commands/<name>.md` with frontmatter (`description:`, `subtask:`, `agent:`)
- **Agents:** `.opencode/agents/<name>.md` with frontmatter (`description:`, `mode:`, `color:`)
- **Tests:** `.opencode/plugins/regent.test.js` — run with `node --test`

## Code style

- ESM only (`import`/`export`, no `require`)
- No comments — let code speak
- Error paths produce structured JSON, never throw
- `context.directory` over `process.cwd()` for path resolution

## Verdict gates

Before committing:
1. Run `cd .opencode && node --test plugins/regent.test.js` — all tests pass
2. Read `CONSTITUTION.md` — ensure changes align with identity and iron laws
3. Add new skill? Update `README.md` skill table. Add new command? Update command table.
4. No phase skip. No gate bypass.

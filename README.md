# Regent

**Agent orchestration for OpenCode. From idea to shipped — zero ceremony.**

Regent governs your code domain when you, sovereign, are absent. A court of six specialists (官), each with persona, values, and iron laws. Every session bootstrapped with [CONSTITUTION.md](CONSTITUTION.md) — identity, roles, principles, chain of command.

## How it works

```
Sovereign (you)
  → 谋官 Strategist — clarify, design validation
    → 构官 Architect — plan, task decomposition
      → 舰官 Fleet Commander — execute via subagents
      → 监官 Inspector — verify, evidence gates
    → 布官 Publisher — report, ship
  → 教官 Mentor — orientation, zoom-out (any time)
```

Every phase gated. No phase skip. Every claim has evidence.

## What you get

**5 custom tools** for agent orchestration:

| Tool | What It Does |
| --- | --- |
| `delegate({ task, context, expected_output })` | Single focused subagent |
| `delegate_many({ tasks: [{ id, task, context, expected_output }] })` | Parallel subagents via Promise.all() |
| `research({ questions: [{ id, question, scope? }] })` | Parallel research across multiple questions |
| `explore({ query, focus? })` | Codebase structure analysis |
| `verify({ requirements, implementation_context })` | Requirements compliance checking |

**7 skills** + **6 roles** governed by constitution:

| Skill | Court Role | Iron Law |
| --- | --- | --- |
| `orchestrator` | Concierge | No gate bypass |
| `tdd` | 舰官 Fleet Commander | NO CODE WITHOUT FAILING TEST |
| `diagnose` | 监官 Inspector | NO FIX WITHOUT ROOT CAUSE |
| `verification-before-completion` | 监官 Inspector | NO COMPLETION WITHOUT EVIDENCE |
| `prototype` | 舰官 Fleet Commander | Disposable by design |
| `zoom-out` | 教官 Mentor | Start broad, then narrow |
| `using-regent` | All | Bootstrap identity |

**2 custom subagents:**

| Agent | Role | Purpose |
| --- | --- | --- |
| `regent-explore` | Mentor's reconnaissance arm | Focused codebase exploration, file discovery, structural analysis |
| `regent-general` | Fleet Commander subagent | Focused implementation, verification, research, review tasks |

**6 slash commands:**

| Command | Routes To | Purpose |
| --- | --- | --- |
| `/orchestrate` | orchestrator skill | Full pipeline from goal to shipped |
| `/delegate` | delegate tool | Single subagent task |
| `/research` | research tool | Parallel research |
| `/tdd` | tdd skill | Red-green-refactor cycle |
| `/diagnose` | diagnose skill | Systematic debugging |
| `/verify` | verification-before-completion skill | Evidence gate |

## Installation

Add to your project's `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["regent@git+https://github.com/nathwn12/regent.git#v2.2.3"],
}
```

Use the unpinned branch only when you intentionally want the latest changes:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["regent@git+https://github.com/nathwn12/regent.git"],
}
```

Requires an OpenCode version that supports git plugin specs. If plugin loading fails, use the troubleshooting checks in `.opencode/INSTALL.md` and report your OpenCode version.

One plugin entry. No manual npm install. Regent bootstraps on the first user message of every session.

## Principles

- **Throughput first.** Parallel by default. `delegate_many()` and `research()` run subagents concurrently.
- **Goal-locked.** Do not drift. Every action traces back to a stated goal.
- **Evidence before claims.** Fresh verification or it did not happen.
- **Human at decision points.** Design approval, plan approval, blockers — gates where the user decides.
- **Zero ceremony.** One command to start. One plugin entry. No manual setup.

## Project structure

```
regent/
├── .opencode/                # Plugin code
│   ├── plugins/
│   │   ├── regent.js         # Plugin entry — 5 custom tools, config, bootstrap
│   │   └── regent.test.js    # 23+ tests
│   ├── commands/             # 6 slash command templates (.md with frontmatter)
│   ├── agent/                # 2 custom subagent definitions (.md with frontmatter)
│   ├── package.json          # Plugin dependency: @opencode-ai/plugin
│   └── INSTALL.md            # Troubleshooting guide
├── skills/                   # 7 skills loaded by OpenCode's skill system
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
├── eslint.config.js          # ESLint config (devDependencies)
├── package.json              # Development tooling (eslint, prettier, typescript)
└── docs/
    ├── contributing.md       # Architecture, test, and code style guide
    └── superpowers/specs/    # Design documents output by clarify phase
```

## Example walkthrough

1. Install: add `"regent@git+https://github.com/nathwn12/regent.git#v2.2.3"` to your `opencode.jsonc` plugins array.
2. Start a new OpenCode session. Regent's bootstrap auto-injects the tool & command catalog.
3. Type a goal: `Add dark mode toggle to settings panel`.
4. Regent loads the orchestrator skill and runs:
   - **Clarify** — asks what dark mode means (system preference? manual toggle?), where the settings panel lives, success criteria.
   - **Plan** — explores the codebase, generates task tree (types → toggle component → persistence → tests).
   - **Execute** — dispatches subagents in parallel via `delegate_many()` for independent tasks.
   - **Verify** — runs `verify()` checking each requirement against implementation.
   - **Report** — presents achievements with evidence, pending items, and next steps.
5. Approve, adjust, or loop back. Three options: new goal, fix issues, or commit/PR.

## Development

See [`docs/contributing.md`](docs/contributing.md) for architecture, testing, and code style guidelines.

```bash
npm install          # root devDependencies (eslint, prettier, typescript)
cd .opencode && npm install && cd ..   # plugin dependency (@opencode-ai/plugin)
npm run verify       # format → lint → typecheck → test
```

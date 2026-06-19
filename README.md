# Regent

Agent orchestration for OpenCode. From idea to shipped — zero ceremony.

---

## Highlights

- **Court governance** — Six AI specialists (Strategist, Architect, Fleet Commander, Inspector, Publisher, Mentor), each with defined persona, values, and iron laws. Every session starts with a Constitution — the single source of truth for how the court operates.
- **Structured pipeline** — Clarify, plan, execute, verify, report. Every phase gated. No phase skip. No gate bypass. Every claim backed by fresh evidence.
- **6 custom tools** — `delegate`, `delegate_many`, `research`, `explore`, `verify`, `changed-files` for subagent orchestration, codebase analysis, and file change tracking.
- **7 skills** — TDD, systematic debugging, evidence-gated verification, disposable prototyping, codebase orientation, bootstrap, and more.
- **7 slash commands** — `/orchestrate`, `/delegate`, `/research`, `/tdd`, `/diagnose`, `/verify`, `/review`.
- **Parallel visibility** — Subagent sessions persist as navigable TUI child sessions with toast notifications for start/complete/error.
- **Zero ceremony** — One entry in your OpenCode config. No manual install. Bootstraps on first message.

---

## Overview

Regent governs your OpenCode sessions with a court of six specialists. It does not replace your judgement — it extends it. Your will, executed by specialists who each own one domain.

The court follows a chain of command:

```
Sovereign (you)
  → 谋官 Strategist — clarify, design validation
    → 构官 Architect — plan, task decomposition
      → 舰官 Fleet Commander — execute via subagents
      → 监官 Inspector — verify, evidence gates
    → 布官 Publisher — report, ship
  → 教官 Mentor — orientation, zoom-out (any time)
```

Every phase is sequential and gated. The Strategist clarifies before the Architect plans. The Inspector verifies before the Publisher reports. The Mentor is available at any point for orientation.

Five iron laws enforce discipline:

1. Skill before action — even a 1% chance a skill applies? Load it.
2. No code without a failing test first.
3. No fix without root cause.
4. No completion without fresh evidence.
5. No phase skip. Cost of rework exceeds cost of gate.

---

## Quick start

Add Regent to your OpenCode configuration:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["regent-code@git+https://github.com/nathwn12/regent-code.git#v2.4.0"],
}
```

Start a new OpenCode session. Regent bootstraps automatically on the first user message. No npm install. No manual setup.

For the latest (unpinned) version, omit the version tag from the plugin URL.

### Walkthrough

1. **State a goal.** "Add dark mode toggle to settings panel."
2. **Clarify.** The Strategist asks: what does dark mode mean (system preference or manual toggle)? Where does the settings panel live? What are the success criteria?
3. **Plan.** The Architect explores the codebase and generates a task tree: types, toggle component, persistence, tests.
4. **Execute.** The Fleet Commander dispatches subagents in parallel via `delegate_many` for independent tasks.
5. **Verify.** The Inspector runs `verify` against every requirement.
6. **Report.** The Publisher presents achievements with evidence, pending items, and next steps.

From here: approve, adjust, or loop back to a new goal.

---

## Reference

### Custom tools

| Tool            | Purpose                                                       |
| --------------- | ------------------------------------------------------------- |
| `delegate`      | Single focused subagent task                                 |
| `delegate_many` | Parallel subagents with work-stealing (max 10 workers)        |
| `research`      | Parallel research with cross-question theme synthesis         |
| `explore`       | Codebase structure analysis (falls back to `process.cwd()`)  |
| `verify`        | Requirements compliance + evidence gate check                 |
| `changed-files` | View files changed by subagent dispatches in current session |

### Skills

| Skill                            | Court role      | Iron law                                            |
| -------------------------------- | --------------- | --------------------------------------------------- |
| `orchestrator`                   | Concierge       | No gate bypass + stagnation detection               |
| `tdd`                            | Fleet Commander | No code without failing test                        |
| `diagnose`                       | Inspector       | No fix without root cause                           |
| `verification-before-completion` | Inspector       | No completion without evidence                      |
| `prototype`                      | Fleet Commander | Disposable by design                                |
| `zoom-out`                       | Mentor          | Start broad, then narrow                            |
| `using-regent`                   | All             | Bootstrap identity                                  |

### Subagents

| Agent            | Role                     | Purpose                                   |
| ---------------- | ------------------------ | ----------------------------------------- |
| `regent-explore` | Mentor reconnaissance    | Codebase exploration, structural analysis |
| `regent-general` | Fleet Commander subagent | Implementation, verification, research    |

### Slash commands

| Command        | Routes to                            | Purpose                                  |
| -------------- | ------------------------------------ | ---------------------------------------- |
| `/orchestrate` | orchestrator skill                   | Full pipeline from goal to shipped       |
| `/delegate`    | delegate tool                        | Single subagent task                     |
| `/research`    | research tool                        | Parallel research with cross-synthesis   |
| `/tdd`         | tdd skill                            | Red-green-refactor cycle                 |
| `/diagnose`    | diagnose skill                       | Systematic debugging                     |
| `/verify`      | verification-before-completion skill | Evidence gate with change tracking       |
| `/review`      | Inspector role                       | Code quality, security, correctness review |

---

## Project structure

```
regent/
├── .opencode/                   # Plugin
│   ├── plugins/regent.js        # Entry — 6 tools, config, bootstrap
│   ├── plugins/regent.test.js   # 23 tests
│   ├── plugins/regent.live-test.js
│   ├── commands/                # 7 slash commands
│   ├── agents/                  # 2 subagents
│   └── package.json
├── .opencode/skills/            # 7 skills
│   ├── orchestrator/            # 5-phase pipeline + stagnation detection
│   ├── tdd/                     # Red-green-refactor
│   ├── diagnose/                # Systematic debugging
│   ├── verification-before-completion/
│   ├── prototype/               # Disposable by design
│   ├── zoom-out/                # Codebase orientation
│   └── using-regent/            # Bootstrap
├── CONSTITUTION.md              # Roles, principles, iron laws
├── AGENTS.md                    # Agent development guide
├── docs/
│   ├── contributing.md
│   └── superpowers/specs/
├── package.json                 # Dev tooling
├── tsconfig.json                # JSDoc typecheck
└── eslint.config.js             # Lint rules
```

---

## Development

```bash
npm install                          # root dev dependencies
cd .opencode && npm install && cd .. # plugin dependency
npm run verify                       # format → lint → typecheck → test
```

See [`docs/contributing.md`](docs/contributing.md) for architecture, testing, and code style guidelines.

---

## Author

Built by [@nathwn12](https://github.com/nathwn12). Regent is an OpenCode plugin for structured, governed AI development. Start a [discussion](https://github.com/nathwn12/regent-code/discussions) or open an issue.

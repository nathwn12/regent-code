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

- `delegate()` — single focused subagent
- `delegate_many()` — parallel subagents via Promise.all()
- `research()` — parallel research across multiple questions
- `explore()` — codebase structure analysis
- `verify()` — requirements compliance checking

**8 skills** + **6 roles** governed by constitution:

| Skill                            | Court Role           | Iron Law                       |
| -------------------------------- | -------------------- | ------------------------------ |
| `orchestrator`                   | Concierge            | No gate bypass                 |
| `tdd`                            | 舰官 Fleet Commander | NO CODE WITHOUT FAILING TEST   |
| `diagnose`                       | 监官 Inspector       | NO FIX WITHOUT ROOT CAUSE      |
| `verification-before-completion` | 监官 Inspector       | NO COMPLETION WITHOUT EVIDENCE |
| `subagent-driven-development`    | 舰官 Fleet Commander | Fresh subagent per task        |
| `prototype`                      | 舰官 Fleet Commander | Disposable by design           |
| `zoom-out`                       | 教官 Mentor          | Start broad, then narrow       |
| `using-regent`                   | All                  | Bootstrap identity             |

**6 slash commands:**

- `/orchestrate` — full pipeline
- `/delegate` — single subagent task
- `/research` — parallel research
- `/tdd` — red-green-refactor cycle
- `/diagnose` — systematic debugging
- `/verify` — evidence gate

## Installation

Add to your project's `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["regent@git+https://github.com/nathwn12/regent.git#v2.2.0"],
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

One plugin entry. No manual npm install. AutoPowers injects after OpenCode loads the plugin.

## Principles

- **Throughput first.** Parallel by default. `delegate_many()` and `research()` run subagents concurrently.
- **Goal-locked.** Do not drift. Every action traces back to a stated goal.
- **Evidence before claims.** Fresh verification or it did not happen.
- **Human at decision points.** Design approval, plan approval, blockers — gates where the user decides.
- **Zero ceremony.** One command to start. One plugin entry. No manual setup.

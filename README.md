# Regent AutoPowers

**Agent orchestration for OpenCode. From idea to shipped — zero ceremony.**

AutoPowers transforms OpenCode into a disciplined development platform. Every session is bootstrapped with instructions, tools, skills, and commands so the agent routes goals through disciplined workflows.

## How it works

```
You state a goal
  → Orchestrator loads
  → Clarify (what/why/constraints)
  → Plan (task tree + parallelization)
  → Execute (delegate_many() for independent tasks)
  → Verify (evidence gate)
  → Report (achievements + next steps)
```

Every phase has a gate. No phase skips. Every claim has evidence.

## What you get

**5 custom tools** for agent orchestration:
- `delegate()` — single focused subagent
- `delegate_many()` — parallel subagents via Promise.all()
- `research()` — parallel research across multiple questions
- `explore()` — codebase structure analysis
- `verify()` — requirements compliance checking

**8 skills** with Iron Laws:
- `orchestrator` — 5-phase pipeline: clarify → plan → execute → verify → report
- `tdd` — NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
- `diagnose` — NO FIXES WITHOUT ROOT CAUSE INVESTIGATION
- `verification-before-completion` — NO CLAIMS WITHOUT FRESH EVIDENCE
- `subagent-driven-development` — fresh subagent per task + two-stage review
- `prototype` — throwaway code that answers a question
- `zoom-out` — broader context for unfamiliar code
- `using-regent` — bootstrap, auto-injected every session

**6 slash commands:**
- `/orchestrate` — full pipeline from goal to shipped
- `/delegate` — single subagent task
- `/research` — parallel information gathering
- `/tdd` — red-green-refactor cycle
- `/diagnose` — systematic debugging (6 phases)
- `/verify` — evidence gate for completion claims

## Installation

Add to your project's `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["regent@git+https://github.com/nathwn12/regent.git#v2.1.0"]
}
```

Use the unpinned branch only when you intentionally want the latest changes:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["regent@git+https://github.com/nathwn12/regent.git"]
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

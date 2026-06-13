---
name: orchestrator
description: Use when the user states a goal and Regent should run clarify, plan, execute, verify, and report.
---

# Orchestrator — Court Concierge

Convenes the right minister for each phase. constitution at `CONSTITUTION.md` defines who serves when. Chain of command:

```
Sovereign → Strategist → Architect → Fleet Commander + Inspector → Publisher
                                                                      ↘ Mentor (any time)
```

Each phase gated. No gate bypass.

## Domain awareness

Before any phase, check domain documentation:

- `CONSTITUTION.md` at repo root? Read it. Defines Regent identity, court roles, iron laws.
- `CONTEXT.md` at repo root? Read it. Defines project vocabulary.
- `docs/adr/` exists? Read relevant ADRs. Records decisions not to relitigate.
- `UBIQUITOUS_LANGUAGE.md` exists? Read it. Use its terms precisely.
- **Use project domain language** in every plan, file name, variable.

Create files lazily: CONTEXT.md when you resolve a term, `docs/adr/` when you make a decision.

## The 5 Phases

### Phase 1 — Clarify (Strategist 谋官)

Load `clarifier.md`. Role: Strategist. Outcome: validated design, saved to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.

**Gate:** No Phase 2 without user confirmation.

### Phase 2 — Plan (Architect 构官)

Load `planner.md`. Role: Architect. Outcome: task plan with dependency levels for parallel execution.

**Gate:** No Phase 3 without user approval.

### Phase 3 — Execute (Fleet Commander 舰官)

Walk dependency graph:

- **Level 1** (no deps) → `delegate_many()` parallel
- **Level N** (deps on prior) → `delegate()` sequential

Result handling:

| Status               | Action                                  |
| -------------------- | --------------------------------------- |
| `done`               | Continue. Mark complete.                |
| `done_with_concerns` | Note concern. Continue unless critical. |
| `needs_context`      | Provide context, re-delegate.           |
| `blocked`            | PAUSE. Assess. Escalate to user.        |

Partial failure:

- **Non-critical:** Note, continue.
- **Critical:** Retry once. Fail again → PAUSE, escalate.

**Gate:** All tasks resolve before Phase 4.

### Phase 4 — Verify (Inspector 监官)

Call `verify()` with:

- `requirements` = captured during Clarify
- `implementation_context` = summary from Phase 3

Decision:

- **Compliant** → Phase 5
- **Minor issues** → fix, re-verify
- **Major issues** → PAUSE, escalate

Delegate verifiers per requirement if scope large. Fresh command output or repro evidence required before Phase 5.

**Gate:** Fresh verification evidence required.

### Phase 5 — Report & Loop (Publisher 布官)

Load `reporter.md`. Role: Publisher. Outcome: structured report to user.

Loop:

- **New goal** → Phase 1
- **Fix issues** → Phase 3
- **Done** → ask: commit or PR?

## Rationalization Prevention

| "Reason" to skip                       | Reality                                                             |
| -------------------------------------- | ------------------------------------------------------------------- |
| "This is too simple for a plan"        | Simple plans catch assumptions. Two minutes saves two hours.        |
| "I already know the design"            | Write it down. The exercise reveals gaps.                           |
| "The user just wants it done"          | They want it done RIGHT. Discipline is speed.                       |
| "Phase skipping saves time"            | Gates exist because the cost of rework > cost of gate.              |
| "Let me just start coding"             | Coding without design produces waste. Stop.                         |
| "I can verify at the end"              | Verify at every gate. End-of-pipeline surprises are expensive.      |
| "The user is AFK, I'll proceed anyway" | Blocked phases exist for a reason. Wait or document the assumption. |

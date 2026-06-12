---
name: orchestrator
description: Use when the user states a goal and Regent should run clarify, plan, execute, verify, and report.
---

# Orchestrator

The AutoPowers orchestration engine. Runs a 5-phase pipeline that takes a stated goal and produces shipped, verified work. Each phase has a gate: do not proceed without passing it.

## Domain awareness

Before any phase, check for domain documentation:

- `CONTEXT.md` at repo root? Read it. It defines the project's vocabulary.
- `docs/adr/` exists? Read relevant ADRs. They record decisions you should not relitigate.
- `UBIQUITOUS_LANGUAGE.md` exists? Read it. Use its terms precisely.
- **Use the project's domain language** in every plan, every file name, every variable. If the project calls it "Order" not "Purchase", you say "Order".

Create these files lazily: CONTEXT.md when you resolve a term, `docs/adr/` when you make a decision.

## The 5 Phases

### Phase 1 — Clarify

Load `clarifier.md` and run its process. Outcome: a validated design with user approval, saved to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.

**Gate:** Do not proceed to Phase 2 without user confirmation on the design.

### Phase 2 — Plan

Load `planner.md` and run its process. Outcome: a task plan with dependency levels for parallel execution.

**Gate:** Do not proceed to Phase 3 without user approval of the plan.

### Phase 3 — Execute

Walk the dependency graph:

- **Level 1 tasks** (no dependencies) → `delegate_many()` for parallel execution
- **Level N tasks** (depend on Level 1) → `delegate()` sequentially after prior level completes

Per-task result handling:

| Status               | Action                                        |
| -------------------- | --------------------------------------------- |
| `done`               | Continue. Mark complete.                      |
| `done_with_concerns` | Note the concern. Continue unless critical.   |
| `needs_context`      | Provide context, re-delegate.                 |
| `blocked`            | PAUSE. Assess. Escalate to user if uncertain. |

Partial failure handling:

- **Non-critical task fails:** Note it, continue. Don't block the whole pipeline.
- **Critical task fails:** Retry once. If it fails again, PAUSE and escalate.

**Gate:** All tasks must resolve before Phase 4.

### Phase 4 — Verify

Call `verify()` with:

- `requirements` = captured during Clarify phase
- `implementation_context` = summary of what was built from Phase 3

Decision tree:

- **Compliant** → proceed to Phase 5
- **Minor issues** → fix and re-verify
- **Major issues** → PAUSE, escalate to user

Use `delegate()` to dispatch verifiers for each requirement if the scope is large.

`verify()` checks spec compliance; fresh command output, repro evidence, or inspection evidence is still required before Phase 5.

**Gate:** Fresh verification evidence required before Phase 5.

### Phase 5 — Report & Loop

Load `reporter.md` and run its process. Outcome: structured report presented to user.

Loop back based on user response:

- **New goal** → return to Phase 1
- **Fix issues** → return to Phase 3
- **Done** → present completion summary, ask user if they want to commit/PR

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

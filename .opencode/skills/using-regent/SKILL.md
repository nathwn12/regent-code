---
name: using-regent
description: Regent bootstrap instructions for AutoPowers; use when explaining or debugging Regent orchestration behavior.
---

# Regent Bootstrap

Read `CONSTITUTION.md` at repo root. It defines:

- Court identity and 6 roles (Strategist, Architect, Fleet Commander, Inspector, Publisher, Mentor)
- 4 Karpathy principles (Think Before Decree, Simplicity is Sovereign, Surgical Precision, Goal-Driven Execution)
- Chain of command with sequential gated phases
- 5 Iron Laws with enforcement rules

## Tool Catalog

| Tool                                                                 | What It Does             | When                                    |
| -------------------------------------------------------------------- | ------------------------ | --------------------------------------- |
| `delegate({ task, context, expected_output })`                       | Single focused subagent  | Well-defined independent task           |
| `delegate_many({ tasks: [{ id, task, context, expected_output }] })` | Parallel subagents       | Multiple independent tasks              |
| `research({ questions: [{ id, question, scope? }] })`                | Parallel research agents | Need information from multiple angles   |
| `explore({ query, focus? })`                                         | Codebase analysis        | Need to understand project structure    |
| `verify({ requirements, implementation_context })`                   | Compliance check         | Need to confirm work meets requirements |

## Command Catalog

| Command        | Routes To                            | Purpose                            |
| -------------- | ------------------------------------ | ---------------------------------- |
| `/orchestrate` | orchestrator skill                   | Full pipeline from goal to shipped |
| `/delegate`    | delegate tool                        | Single subagent task               |
| `/research`    | research tool                        | Parallel research                  |
| `/tdd`         | tdd skill                            | Red-green-refactor cycle           |
| `/diagnose`    | diagnose skill                       | Systematic debugging               |
| `/verify`      | verification-before-completion skill | Evidence gate                      |
| `/review`      | verification-before-completion skill | Code quality and spec review       |

## Red Flags

| Thought                             | Reality                                             |
| ----------------------------------- | --------------------------------------------------- |
| "This is just a simple question"    | Questions are tasks. Check for skills.              |
| "I need context before deciding"    | Skills tell you how to gather context. Check first. |
| "Let me explore the codebase first" | Skill check comes before exploration.               |
| "This doesn't need a formal skill"  | If a skill exists, use it.                          |
| "The skill is overkill for this"    | The skills exist because the alternative is worse.  |
| "I'll just do this one thing first" | No. Check first.                                    |
| "I remember what the skill says"    | Skills evolve. Read the current version.            |
| "This feels productive"             | Undisciplined action is waste. Skills prevent this. |

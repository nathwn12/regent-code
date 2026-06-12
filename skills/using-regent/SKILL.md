---
name: using-regent
description: Regent bootstrap instructions for AutoPowers; use when explaining or debugging Regent orchestration behavior.
---

# AutoPowers

AutoPowers is the orchestrator layer for OpenCode. It gives you tools, skills, commands, and disciplined workflows that turn intent into shipped code with zero ceremony.

## The Iron Law

**LOAD THE SKILL BEFORE THE ACTION.** If there is even a 1% chance a skill applies, invoke it. Do not pass go. Do not collect context. Do not explore the codebase first. Skill check comes before everything — including clarifying questions.

## How AutoPowers works

Every session starts with this bootstrap injected into your context. It tells you what's available and when to use it. From there:

- **User states a goal?** Load the orchestrator skill. It runs a 5-phase pipeline: clarify → plan → execute → verify → report.
- **User asks a specific operation?** Use the tools directly. `delegate()` for single tasks, `delegate_many()` for parallel work, `research()` for parallel research, `explore()` for codebase analysis, `verify()` for compliance checks.
- **Bug or unexpected behavior?** Load the diagnose skill. No fixes without root cause.
- **Feature or bugfix involving code?** Load the tdd skill. No production code without a failing test first.
- **Work claimed complete?** Load the verification-before-completion skill. No claims without fresh evidence.
- **Complex multi-step task outlined in a plan?** Load the subagent-driven-development skill. Fresh subagent per task, two-stage review.
- **Unfamiliar code area?** Load the zoom-out skill for broader context.
- **Design unknown?** Load the prototype skill to answer questions before committing.

## Priority

1. **User's explicit instructions** (CLAUDE.md, AGENTS.md, direct requests) — always highest
2. **AutoPowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

When loading multiple skills: **process skills first** (orchestrator, diagnose, zoom-out), **implementation skills second** (tdd, prototype).

## Skill Catalog

| Skill | Load When | What It Does |
|-------|-----------|--------------|
| `orchestrator` | User states a goal | 5-phase pipeline: clarify → plan → execute → verify → report |
| `tdd` | Writing any production code | Red-green-refactor with iron law: failing test before code |
| `diagnose` | Bug, failure, unexpected behavior | 6-phase investigation: loop → reproduce → hypothesise → instrument → fix → cleanup |
| `verification-before-completion` | About to claim "done" | Evidence gate: fresh verification before any completion claim |
| `subagent-driven-development` | Complex multi-step task | Fresh subagent per task + spec review + quality review |
| `prototype` | Design unknown, need to explore | Throwaway code that answers a question (logic or UI branch) |
| `zoom-out` | Unfamiliar code section | Broader context: file structure, dependencies, data flow |

## Tool Catalog

| Tool | What It Does | When |
|------|-------------|------|
| `delegate(task, context, expected_output)` | Single focused subagent | Well-defined independent task |
| `delegate_many([{id, task, context, expected_output}])` | Parallel subagents | Multiple independent tasks |
| `research([{id, question, scope?}])` | Parallel research agents | Need information from multiple angles |
| `explore(query, focus?)` | Codebase analysis | Need to understand project structure |
| `verify(requirements, implementation_context)` | Compliance check | Need to confirm work meets requirements |

## Command Catalog

| Command | Routes To | Purpose |
|---------|-----------|---------|
| `/orchestrate` | orchestrator skill | Full pipeline from goal to shipped |
| `/delegate` | delegate tool | Single subagent task |
| `/research` | research tool | Parallel research |
| `/tdd` | tdd skill | Red-green-refactor cycle |
| `/diagnose` | diagnose skill | Systematic debugging |
| `/verify` | verification-before-completion skill | Evidence gate |

## Red Flags

These are rationalizations that mean STOP. You are about to skip the skill check:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need context before deciding" | Skills tell you how to gather context. Check first. |
| "Let me explore the codebase first" | Skill check comes before exploration. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "The skill is overkill for this" | The skills exist because the alternative is worse. |
| "I'll just do this one thing first" | No. Check first. |
| "I remember what the skill says" | Skills evolve. Read the current version. |
| "This feels productive" | Undisciplined action is waste. Skills prevent this. |

## OpenCode Tool Mapping

| Claude Code Tool | OpenCode Equivalent |
|-----------------|-------------------|
| `TodoWrite` | `todowrite` |
| `Task` with subagents | `delegate` / `delegate_many` |
| `Skill` | `skill` |
| `Read`, `Write`, `Edit`, `Bash` | Native tools (same names) |

---
description: Run the regent-code pipeline — clarify, plan, execute, verify, report
subtask: true
agent: regent-general
---

The user's goal:
$ARGUMENTS

Load the `orchestrator` skill. Follow its 5-phase workflow:

1. CLARIFY — explore context, ask one question at a time, capture what/why/constraints/success criteria, propose 2-3 approaches, present design. Gate: user approval.

2. PLAN — scan available skills, explore codebase, build task tree with dependency levels. Level 1 = `delegate_many()` for parallel, Level N = sequential `delegate()`. No placeholders. Gate: user approval.

3. EXECUTE — walk the dependency graph. Handle statuses: done (continue), done_with_concerns (note it), needs_context (re-delegate), blocked (PAUSE).

4. VERIFY — call `verify()` with requirements from Clarify and implementation summary from Execute. Compliant → proceed. Minor issues → fix + re-verify. Major → PAUSE.

5. REPORT — evidence gate first (fresh verification required). Achievements with evidence, pending items, 2-3 options with recommendation.

Do not skip any phase. Do not proceed without gates passing.

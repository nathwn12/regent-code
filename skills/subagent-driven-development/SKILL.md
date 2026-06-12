---
name: subagent-driven-development
description: Use for complex multi-step implementation plans that should be executed through fresh subagents and independent reviews.
---

# Subagent-Driven Development

Execution pattern for complex multi-step tasks. One fresh subagent per task, followed by two-stage review. Preferred over inline execution for any plan with 3+ tasks.

## Core pattern

```
For each task in the plan:
  1. Dispatch an implementer subagent (via delegate())
     - Include task description, context, and expected output
     - The implementer implements, tests, verifies, and self-reviews
  2. Review for spec compliance
     - Independent check: does the implementation match the spec?
  3. Review for code quality
     - Independent check: does the code meet quality standards?
  4. Mark task complete
```

The implementer and reviewers must be separate subagents. Do not let the implementer self-review as a substitute for real review.

## Implementer prompt structure

Each implementer receives:

- **Task description** — exact text from the plan, including file paths
- **Context** — scene-setting, dependencies, architecture decisions that affect this task
- **Expected output** — what "done" looks like for this task

The implementer must implement, test, verify, and self-review before reporting.

Possible implementer statuses:

| Status               | Meaning                                | Action                           |
| -------------------- | -------------------------------------- | -------------------------------- |
| `done`               | Implemented, tested, verified          | Proceed to review                |
| `done_with_concerns` | Implemented but has reservations       | Note concerns, proceed to review |
| `needs_context`      | Missing information to proceed         | Provide context, re-dispatch     |
| `blocked`            | Cannot proceed due to external blocker | PAUSE, escalate to user          |

## Review stages

### Stage 1: Spec compliance review

Independent check that the implementation matches the spec. Do not trust the implementer's self-assessment — read the actual code.

Check:

- Are all requirements from the spec implemented?
- Is anything implemented that was not in the spec? (YAGNI)
- Are there misunderstandings that affect correctness?

### Stage 2: Code quality review

Check:

- Does each file have one clear responsibility?
- Are units properly decomposed? (not too large, not too small)
- Does the code follow the project's conventions? (imports, naming, error handling)
- Are there any file sizes that signal a module doing too much?

## After all tasks

When all tasks complete their review loops:

1. Dispatch a final code review (standards + spec alignment)
2. Ask the user whether they want to commit or open a PR

## Red flags

- Dispatching multiple implementation subagents in parallel (they may conflict on shared state)
- Letting an implementer count their own self-review as sufficient
- Skipping review because "the task was simple"
- Modifying the same file from two subagents without coordination

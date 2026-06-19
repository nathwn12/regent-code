---
description: Code review — quality, correctness, security, and spec compliance review
subtask: true
agent: regent-general
---

The user wants a review of:
$ARGUMENTS

Load the `verification-before-completion` skill. Act as Inspector (监官).

Review along two axes:

1. **Standards** — Does the code follow the project's coding standards, conventions, and patterns? Check CONSTITUTION.md, AGENTS.md, and any `.eslintrc` or `tsconfig.json` for explicit standards.

2. **Spec** — Does the code match the requirements, the plan, or the issue/PRD it was written for?

For each axis, report:
- What passes
- What needs improvement
- Any blockers or security concerns

Keep the review actionable. Flag YAGNI (unrequested features) separately. Run lint/typecheck/test commands if relevant and report the output.

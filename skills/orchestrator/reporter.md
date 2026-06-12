# Report & Loop Phase

Detailed process for Phase 5 of the orchestrator pipeline.

## Evidence gate

Do not write a report without fresh verification evidence. Run the verification commands yourself, or collect `verify()` output, and include the evidence in the report. Evidence comes first; interpretation follows.

## Report format

Keep under 12 lines. Structure:

```
### Achievements (with evidence)
- [requirement] — evidence (test output, verify result, reproduction scenario passes)
- [requirement] — evidence

### Pending / Issues
- [unresolved item] — what it needs
- [issue found] — severity

### Next
1. [option] — brief rationale
2. [option] — brief rationale
```

Lead with evidence, not interpretation. The user needs to see proof, not hear conclusions.

## Options

Present 2-3 options for what to do next. Include your recommendation and why. Examples:

- **New goal** → loop to Phase 1
- **Fix issues** → loop to Phase 3 (execute)
- **Done** → ask whether the user wants to commit or open a PR

## Wait for input

After presenting the report, wait for the user's response. Do not assume the next step. Loop back based on their direction.

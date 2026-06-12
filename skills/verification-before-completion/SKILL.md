---
name: verification-before-completion
description: Use before claiming work is done, fixed, ready, passing, complete, or successful; requires fresh verification evidence.
---

# Verification Before Completion

Evidence gate for AutoPowers. Apply before any claim of completion, success, or readiness to proceed.

## The Iron Law

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

Fresh means run right now, not "it was working earlier." Verification means you have the output in front of you, not "I remember it passing." Evidence means test output showing 0 failures, not "seems fine."

## The Gate Function

### 1. IDENTIFY

What command proves the claim?
- "Tests pass" → requires test output showing 0 failures
- "Linter clean" → requires linter output showing 0 errors
- "Build succeeds" → requires build command with exit code 0
- "Bug is fixed" → requires the original reproducing scenario to pass
- "Feature is complete" → requires the acceptance criteria to be met

### 2. RUN

Execute the full command. Not a subset. Not "the relevant tests." Not a dry run. The actual command that proves the claim.

### 3. READ

Read the full output. Check the exit code. Count failures, errors, warnings, and any unexpected output.

### 4. VERIFY

Does the output confirm the claim?
- Tests: "Tests: 12 passed, 0 failed" → verified
- Linter: "No errors found" → verified
- Build: exit code 0 → verified

### 5. CLAIM

Only now may you say it works, it's done, or proceed to the next step.

## Common Failures

| Claim | Required Evidence | Not Sufficient |
|-------|-------------------|----------------|
| Tests pass | Full test output: "X passed, 0 failed" | "All tests should pass now" |
| Linter clean | Linter output: "0 errors, 0 warnings" | "I fixed the lint issues" |
| Build succeeds | Build command exit code 0 | "Build was working earlier" |
| Bug fixed | Original repro scenario passes | "I changed the relevant code" |
| Feature complete | Acceptance criteria met, one by one | "I implemented the main parts" |
| Coverage sufficient | Coverage report above threshold | "I added tests for the new code" |

## Red Flags

| Says | Actually Means |
|------|---------------|
| "should pass now" | Not verified |
| "probably works" | Not verified |
| "seems correct" | Not verified |
| "I think it's fixed" | Not verified |
| "it was working before" | Not fresh evidence |
| "the tests look right" | Not run |
| "the change is trivial" | Most likely to break something |
| "just this once" | The exception that proves the rule |

## When to apply

- Before saying "it works"
- Before saying "it's done" 
- Before committing
- Before creating a PR
- Before marking a task complete
- Before moving to the next task
- Before expressing satisfaction with results

Every time. No exceptions. No shortcuts. Fresh evidence or it did not happen.

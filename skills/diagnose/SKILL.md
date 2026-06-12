---
name: diagnose
description: Use when the user reports a bug, failure, unexpected behavior, flaky behavior, or performance regression.
---

# Diagnose

Systematic debugging for AutoPowers. For hard bugs, performance regressions, and any unexpected behavior.

## The Iron Law

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

Symptom fixes are not fixes. They are deferred failures. Every phase must complete before the next. The only exception: production is on fire and a quick rollback/containment is the responsible call. Even then, you return for root cause when the fire is out.

## Phase 1 — Build a feedback loop

**This is the real skill.** Everything else is mechanical. If you have a fast, deterministic, agent-runnable pass/fail signal for the bug, you will find the cause. If you don't, staring at code will not help. Spend disproportionate effort here.

Construction methods, in order of preference:

1. **Failing test** at the seam that reaches the bug — unit, integration, e2e
2. **CLI invocation** with a fixture input, diff stdout against known-good snapshot
3. **Curl / HTTP script** against a running dev server
4. **Headless browser script** (Playwright) — drive the UI, assert on DOM/console/network
5. **Throwaway harness** — minimal system subset that exercises the bug path
6. **Replay a captured trace** — save real payload/event log, replay through the code path
7. **Property / fuzz loop** — 1000 random inputs when the bug is "sometimes wrong"
8. **Bisection harness** — automate "boot at state X, check, repeat" for git bisect run
9. **Differential loop** — old-version vs new-version, same input, diff outputs
10. **HITL script** — last resort. Script drives a human through structured steps

When the bug is non-deterministic, your goal is not a clean repro but a **higher reproduction rate**. Loop the trigger 100x, add stress, narrow timing windows. A 50% flake is debuggable. 1% is not.

**If you cannot build a feedback loop, stop.** Say so explicitly. List what you tried. Ask the user for: access to the reproducing environment, a captured artifact, or permission to add production instrumentation. Do not proceed to Phase 2.

### Iterate on the loop itself

Once you have *a* loop, improve it:
- Faster? Cache setup, narrow scope, skip unrelated init.
- Sharper signal? Assert on the specific symptom, not "didn't crash."
- More deterministic? Pin time, seed RNG, isolate filesystem.

A 2-second deterministic loop is a debugging superpower. A 30-second flaky loop is barely better than nothing.

## Phase 2 — Reproduce

Run the loop. Watch the bug appear.

Confirm:
- [ ] The failure matches what the **user** described — not a different failure nearby
- [ ] Reproducible across multiple runs (or high enough rate for non-deterministic bugs)
- [ ] Exact symptom captured (error message, wrong output, timing) so the fix can be verified against it

## Phase 3 — Hypothesise

Generate **3–5 ranked hypotheses** before testing any single one. Single-hypothesis generation anchors on the first plausible idea.

Each hypothesis must be **falsifiable**: state the prediction it makes.

> Format: "If <X> is the cause, then <changing Y> will make the bug disappear / <changing Z> will make it worse."

If you cannot state the prediction, the hypothesis is a vibe. Discard or sharpen it.

**Show the ranked list to the user before testing.** They often have domain knowledge that re-ranks instantly. Don't block on it if they're AFK — proceed with your ranking.

## Phase 4 — Instrument

Each probe maps to a specific prediction from Phase 3. Change one variable at a time.

Tool preference:
1. **Debugger / REPL inspection** — one breakpoint beats ten logs
2. **Targeted logs** at the boundaries that distinguish hypotheses
3. Never "log everything and grep"

**Tag every debug log** with a unique prefix: `[DEBUG-a4f2]`. Cleanup becomes a single grep. Untagged logs survive; tagged logs die.

For performance regressions, logs are usually misleading. Establish a baseline measurement first, then bisect. Measure first, fix second.

## Phase 5 — Fix + regression test

Write the regression test **before the fix** — but only at a **correct seam**. A correct seam is one where the test exercises the real bug pattern as it occurs at the call site.

If no correct seam exists, that is itself the finding. Note it. The architecture prevents locking down the bug.

If a correct seam exists:
1. Turn the minimised repro into a failing test at that seam
2. Watch it fail
3. Apply the fix
4. Watch it pass
5. Re-run the Phase 1 feedback loop against the original scenario

## Phase 6 — Cleanup + post-mortem

Required before declaring done:
- [ ] Original repro no longer reproduces (re-run Phase 1 loop)
- [ ] Regression test passes (or absence of a seam is documented)
- [ ] All `[DEBUG-...]` instrumentation removed
- [ ] Throwaway prototypes deleted or moved to a clearly-marked debug location
- [ ] The correct hypothesis is stated in the commit/PR message

**Then ask: what would have prevented this bug?** If the answer involves architectural change (no good test seam, tangled callers, hidden coupling), flag it for the improve-codebase-architecture skill. Make this recommendation after the fix is in — you have more information now than when you started.

## Red Flags

| Behavior | Problem |
|----------|---------|
| Searching for "similar bugs" online | You don't have root cause. You're guessing. |
| Changing code before running the loop | You don't know what you're fixing. |
| "This might be the issue, let me try something" | That's not a hypothesis. That's a guess. |
| Fixing the symptom, not the cause | The bug will reappear in a different form. |
| 3+ failed fix attempts | Question your understanding. Escalate. |
| Adding code instead of tests | Coverage without a red-green cycle proves nothing. |

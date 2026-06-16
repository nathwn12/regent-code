---
name: subagent-driven-development
description: DEPRECATED — merged into orchestrator Phase 3. Use /orchestrate instead.
hidden: true
---

# Subagent-Driven Development — DEPRECATED

This skill has been merged into the **Orchestrator's Execute phase (Phase 3)**.

Use `/orchestrate` instead, which now includes:
- Subagent dispatch with `delegate()` / `delegate_many()`
- Two-stage review (spec compliance + code quality) for non-trivial tasks
- Status-based result handling (done, blocked, needs_context, done_with_concerns)

The two-stage review pattern from this skill is now part of orchestrator Phase 3.

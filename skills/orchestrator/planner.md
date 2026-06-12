# Plan Phase

Detailed process for Phase 2 of the orchestrator pipeline. Turns a validated design into an executable task plan.

## 1. Scan available skills

Check which loaded skills match the task. Load any additional skills that apply:

- TDD for code implementation
- Diagnose for bug investigation
- Prototype for design exploration

## 2. Gather intelligence

Use the available tools before constructing the plan:

- `explore()` to understand the files and modules that will be touched
- `research()` for technology choices, library APIs, or patterns
- `delegate()` for deep dives into specific subsystems

## 3. Build the task plan

Each task must have:

- **File scope** — 1-3 files maximum. If more are needed, split the task.
- **Time estimate** — 2-15 minutes per task. If it's longer, split it.
- **Clear "done" definition** — what the task produces and how to verify it.
- **Dependency level** — which tasks can run in parallel (Level 1) vs sequentially (Level N).

### Dependency mapping

```
Level 1 (no deps, parallel):          Level 2 (deps on L1, sequential):
  A. Define types                        C. Implement service
  B. Write test stubs                    D. Wire up endpoints
```

- Level 1 tasks → `delegate_many()` for parallel execution
- Level N tasks → `delegate()` sequentially after dependencies resolve

### No placeholders

Every step must be concrete: exact file paths, exact function names, exact commands to run. No:

- "Add appropriate error handling" (which errors? where?)
- "Write tests for the above" (which tests? what scenarios?)
- "Implement later" (when later never comes)

If a step is not specific enough to delegate to a subagent, it is not a step.

## 4. Gate

Present the plan to the user. Include:

- The task tree with dependency levels
- Parallelization strategy
- Files that will be created/modified

Ask: "Does this plan look right?" Do not proceed without approval.

# Clarify Phase

Detailed process for Phase 1 of the orchestrator pipeline.

## 1. Explore project context

Before asking any questions, understand what exists:
- Read `CONTEXT.md`, `docs/adr/`, `UBIQUITOUS_LANGUAGE.md` for domain vocabulary
- Read `README.md`, `package.json`, recent commits for project state
- Run `explore(query="project structure")` for codebase layout
- Run `research({ questions: [{ id: "patterns", question: "existing patterns for similar features" }] })` if relevant

## 2. Assess scope

If the request describes multiple independent subsystems, flag it immediately. Do not spend questions refining details of a project that needs decomposition first.

**Single subsystem:** proceed with clarify flow below.
**Multiple subsystems:** help decompose. Each subsystem gets its own clarify → plan → execute cycle.

## 3. Clarify one question at a time

Ask questions one at a time. Prefer multiple choice when possible. Cover:

- **What** — what exactly needs to be built or changed
- **Why** — what purpose does this serve
- **Constraints** — technical, organizational, temporal
- **Success criteria** — how will we know it's right
- **Non-goals** — what is explicitly out of scope
- **Existing patterns** — are there existing examples in the codebase

One question per message. Break multi-topic clarifications into sequential questions.

## 4. Propose approaches

Present 2-3 approaches with trade-offs. Lead with your recommendation and explain why.

## 5. Present design

Present the design in sections. Scale each section to its complexity:
- Straightforward: a few sentences
- Nuanced: up to 200-300 words

After each section, ask whether it looks right. Cover: architecture, components, data flow, error handling, testing. Break the system into smaller units with clear boundaries and defined interfaces.

## 6. Self-review

After writing the design document, check:
- **Placeholders:** Any "TBD", "TODO", incomplete sections? Fix them.
- **Consistency:** Do any sections contradict each other?
- **Scope:** Focused enough for a single implementation plan?
- **Ambiguity:** Could any requirement be interpreted two different ways? Pick one and make it explicit.

## 7. Gate

Ask: "Is this design correct?" Do not proceed without user confirmation.

Output: `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`

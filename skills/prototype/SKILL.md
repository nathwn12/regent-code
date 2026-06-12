---
name: prototype
description: Use when design is unknown, the user wants a prototype, or a throwaway experiment should answer a logic or UI question.
---

# Prototype

Throwaway code that answers a question before you commit to building the real thing.

## The principle

A prototype is **disposable by design**. The question it answers is the only output worth keeping. If you are not answering a question, do not prototype. If you are not willing to throw it away, you are not prototyping — you are building production code badly.

## Pick a branch

Identify which question the prototype answers:

- **"Does this logic / state model feel right?"** → Build a tiny interactive terminal app that pushes the state machine through edge cases hard to reason about on paper. Use the project's language. No persistence. State lives in memory.

- **"What should this look like?"** → Generate several radically different UI variations, switchable via a single route. Use the project's routing conventions. No persistence. No test setup.

If the question is genuinely ambiguous and the user is not reachable, default to logic if the surrounding code is backend, UI if the surrounding code is frontend. State the assumption at the top of the prototype.

## Rules

1. **Throwaway from day one.** Name it so a casual reader knows it is a prototype, not production. Locate it near the module it prototypes for.

2. **One command to run.** Whatever the project's existing task runner supports. `pnpm <name>`, `python <path>`, `bun <path>` — one command, no ceremony.

3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is checking, not a dependency of the prototype.

4. **Skip polish.** No tests, no error handling beyond what makes it runnable, no abstractions. The goal is learning, not quality.

5. **Surface the state.** After every action, print or render the full relevant state. The user needs to see what changed.

6. **Delete or absorb when done.** When the question is answered, either delete the prototype or fold the validated decision into real code. Do not leave it rotting.

## When done

Capture the answer in something durable: commit message, ADR, issue, or a `NOTES.md` next to the prototype. Include the question and the verdict. Then delete the prototype.

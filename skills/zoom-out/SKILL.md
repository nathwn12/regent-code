---
name: zoom-out
description: Use when entering an unfamiliar code area or when broader structure, dependencies, and data flow need explanation.
---

# Zoom Out

Broader context for unfamiliar code. Use when you have been dropped into a section of the codebase you do not understand, or when a task requires understanding how pieces fit together.

## What to look for

Answer these questions, in order:

1. **What does this directory contain?** Read the top-level files and subdirectories. Look for README, package.json, index files.

2. **What is the entry point?** How is the code in this area invoked? Find the callers, the exports, the route registrations.

3. **What are the key modules and their responsibilities?** For each module in the area, summarize its purpose in one sentence. If you cannot do that in one sentence, the module may need splitting.

4. **How do they communicate?** Direct calls? Events? Shared state? A database? Network?

5. **What are the data flows?** Trace a complete request/operation through the modules. Where does data enter, transform, persist, and exit?

6. **What tests exist?** Check `*.test.*`, `*.spec.*`, `__tests__/`, `test/`. The test files tell you what the authors considered important.

## Techniques

- **Start broad, then narrow.** Read the top-level directory first. Then the relevant subdirectory. Then the relevant file. Do not dive into a single file until you know where it sits.

- **Follow the imports.** Start at the entry point (route handler, main function, exported API). Follow the imports to understand the dependency graph.

- **Run the tests.** If tests exist, run them. They confirm your understanding of expected behavior.

- **Check the docs.** Read CONTEXT.md for domain vocabulary, `docs/adr/` for architectural decisions, any README files in the area.

## Output

Provide a structural summary: the directory layout, the key modules, the data flow, and where tests live. Use the project's domain language from CONTEXT.md. Cover only what the immediate task needs — do not write a full architectural document for a small change.

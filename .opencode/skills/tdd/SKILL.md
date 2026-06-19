---
name: tdd
description: Use when writing production code, fixing bugs, refactoring, or when the user requests TDD or red-green-refactor.
---

# TDD — Fleet Commander (舰官)

Iron Law of the Fleet Commander: NO CODE WITHOUT FAILING TEST FIRST. Governed by CONSTITUTION.md Principles II (Simplicity) and IV (Goal-Driven).

## The Iron Law

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

If you wrote production code before a test, delete it. Start over. No exceptions. Not "keep it as reference." Not "well, the test would be awkward." Not "this is different because it's simple." Delete it.

## Red-Green-Refactor

Each cycle tackles exactly one behavior. Do not batch behaviors into one cycle.

### RED — Write one failing test

- One behavior per test. Clear test name that describes the behavior.
- Use real code where possible. Mock only at system boundaries: external APIs, databases, time, randomness.
- Do NOT mock your own code, your own modules, or internal collaborators.
- The test should demonstrate the API you wish you had.

### VERIFY RED — Mandatory

Run the test. Watch it fail. Confirm:

- The failure message matches what you expect ("expected X but got undefined", not "cannot read property of undefined")
- It fails because the feature is missing, not because of a typo in the test itself

**If you did not watch the test fail, you do not know whether it tests the right thing.**

### GREEN — Write minimal code to pass

- Write the simplest, most direct code that makes the test pass.
- No extra features. No YAGNI. No "while I'm here."
- Duplication is acceptable at this stage. Refactor comes next.

### VERIFY GREEN — Mandatory

Run the test. Watch it pass. Confirm:

- The new test passes
- All existing tests still pass

### REFACTOR — Clean up

- Remove duplication. Extract helpers. Improve names.
- Keep tests green throughout.
- If refactoring breaks a test, you changed behavior, not structure.

## Anti-pattern: Horizontal slices

Do NOT write all tests first and then implement. That is not TDD — it's test-after with extra steps. You lose the feedback loop that makes TDD valuable. Each test validates the specific code you just wrote. Write one test. Make it pass. Write the next test. One behavior at a time.

## Good tests

| Property         | What it means                                                                   |
| ---------------- | ------------------------------------------------------------------------------- |
| **Minimal**      | Tests exactly one thing. If it fails, you know what broke.                      |
| **Clear**        | Test name = behavior description. Reader knows intent without reading the body. |
| **Shows intent** | Demonstrates the desired API. Callers read tests as documentation.              |

## When to mock

Only at **system boundaries**: the seam where your code meets something you don't control.

```
YOUR CODE → [ Mock Here ] → External API
YOUR CODE → [ Mock Here ] → Database
YOUR CODE → [ Mock Here ] → Time / Randomness
```

Do NOT mock:

- Your own functions, classes, or modules
- Internal collaborators within the same module
- Code you own and control

## Red Flags

| Behavior                           | Problem                                                     |
| ---------------------------------- | ----------------------------------------------------------- |
| Writing implementation before test | Violates Iron Law. Delete it.                               |
| Writing all tests then all code    | Horizontal slices. Not TDD.                                 |
| Test passes immediately            | You wrote a test for existing code. That's test-after.      |
| Can't think of how to test         | Write the API you wish you had. The test shapes the design. |
| Mocking everything                 | Your code is too coupled. Simplify.                         |
| "Let me skip verification"         | Skipping verification voids the guarantee.                  |

## Rationalization Prevention

| Excuse                                             | Reality                                                        |
| -------------------------------------------------- | -------------------------------------------------------------- |
| "I'll just write the code first as a reference"    | The reference becomes the implementation. Delete it.           |
| "This is too simple to need TDD"                   | Simple things have hidden edge cases. TDD finds them.          |
| "I'm being pragmatic"                              | "Pragmatic" = rationalization for skipping discipline.         |
| "Deleting the code is wasteful"                    | Keeping untested code is more wasteful. You'll debug it later. |
| "The test is obvious, I don't need to see it fail" | You do. Always.                                                |

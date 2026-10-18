---
name: design-spec
description: Use when writing or updating a rules spec or feature spec that a gameplay programmer must implement and QA must test, or when settling an open design question in writing.
---

# Design spec

A spec is a **reference** document: it describes what the game does, flatly and
completely, so it can be built and checked without asking you. The reasons
behind choices go in a separate explanation page (ADR style), linked from the
spec. Short beats long: Librande's one-page designs work because nobody reads a
bible. Write the smallest document that leaves nothing to guess.

## When to write which document

| Need | Document | Diataxis kind |
|---|---|---|
| Whole-game rules, by system | Rules spec (one page per system if large) | reference |
| One feature or change | Feature spec (one page) | reference |
| Tunable numbers | Data table or data file, linked from the spec | reference |
| Why we chose X over Y | Decision record, "About <topic>" | explanation |
| Steps a content author repeats | "How to add a <content type>" | how-to |

## Structure: organise by system, not by genre

Split the game into **systems** (a system owns a set of state and the rules
that change it). Find them by asking "what state exists, and what changes it?".
Examples across genres: movement, combat, health and damage, inventory,
crafting, economy and currencies, progression and unlocks, scoring, win and
loss conditions, turn or time structure, AI behaviour, save and checkpoint,
session structure (run, match, level, chapter). Use the game's own systems;
do not force this list onto it.

Each system section, in this order:

1. **Purpose** — one line: which experience goal it serves (link the explanation page).
2. **State** — every variable it owns, with type, range, start value and unit.
3. **Rules** — numbered, one behaviour per rule, in "When <trigger>, if
   <condition>, then <effect>" form. Rules are numbered so tickets and tests
   can cite them (`COMBAT-07`).
4. **Numbers** — a table (name, value, unit, source or reason) or a link to
   the data file that holds them. Never bury a number in prose.
5. **Edge cases** — simultaneous events and their order, zero/max/overflow,
   interrupted actions, invalid input, pause/save/reload mid-action, ties.
6. **Interactions** — which other systems read or change this one's state.
7. **Feedback** — what the player sees, hears and feels for each rule
   (hand to UI, audio, feel; see `game-feel`).
8. **Acceptance checks** — for every rule, a check QA or an automated test
   can run: setup, action, expected result. Given/When/Then is fine.
9. **Open questions** — each marked and owned (see below).

Template: [spec-template.md](spec-template.md).

## Marking certainty

- **[verify]** — believed but not yet confirmed (from evidence, a test, a
  playtest). Says what would confirm it.
- **[chosen]** — a deliberate decision where evidence was missing or split;
  one line of reason, link to the decision record if it matters.
- **[open]** — undecided; names who decides and by when.

A spec with unmarked guesses is wrong even when the guesses are right.

## Writing rules

- One term per concept, defined once in a glossary at the top; never
  synonyms ("life", "HP", "health" for the same thing).
- Numbers carry units and time bases (per second, per turn, per frame at a
  stated tick rate). Randomness states its distribution and seed handling.
- Order of resolution is explicit whenever two things can happen in the same
  step.
- Describe behaviour, not implementation. "Damage is applied before the death
  check" is design; "call `applyDamage()` first" is the programmer's call.
- Diagrams beat paragraphs for states and flows: a state machine for modes,
  a flow for loops, a table for matrices (who counters whom).
- Version it with the project: the spec changes in the same PR as the data
  or behaviour it describes.

## Steps

1. List the systems touched and the experience goal each serves.
2. Draft state, rules and numbers; mark certainty on every uncertain line.
3. Walk the edge-case list above for each rule.
4. Write acceptance checks; if you cannot write a check, the rule is vague.
5. Ask a gameplay-programmer (or an agent acting as one) to read it and list
   every question they would need answered. Each question is a gap; fix it.
6. Ask QA (or an agent in that role) to derive test cases; missing cases are gaps.
7. File the rationale for any non-obvious choice as an explanation page.
8. Tell the gameplay programmer which rule IDs and numbers changed.

## Quality bar

- Zero questions from the implementer read-through.
- Every rule has a number where one is needed, an edge-case pass and an
  acceptance check.
- The spec reads as reference: no persuasion, no history, no "we think".

## Failure modes

- Genre template forced on a different game (sections that do not exist,
  real systems missing).
- Rationale mixed into rules, so readers cannot find the rule and arguments
  get re-litigated in tickets.
- "Feels fast", "about 3 seconds", "sometimes": not testable.
- Spec drifts from the build; nobody trusts either.
- A 60-page bible nobody reads; split by system and link.

## Documentation owed

- New or changed system → its reference page (this spec) updated in the same PR.
- A choice between alternatives → an explanation page (ADR: context, options,
  decision, consequences).
- New content-authoring procedure → a how-to.

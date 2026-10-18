# Design your first feature spec

*Tutorial for someone new to the game-designer plugin: one small system, from goal to reviewed spec.*

In this tutorial we will design a small stamina system for a game and end with
a reference spec that a programmer could implement and a tester could check,
plus a short page explaining why it is designed that way. It takes about
twenty minutes.

## Before we start

We need Claude Code with the `engineering-practices` and `game-designer`
plugins installed, and a project folder with a `CLAUDE.md`. Any project
works; an empty practice repository is fine. If the project has no `docs/`
folder yet, that is fine too.

## 1. Ask the designer to frame the problem

In the project folder, start Claude Code and type:

```
Use the game-designer agent. Following the systems-design skill, frame a
stamina system for sprinting: experience goal, problem statement, the
resources involved and their sources and sinks. Don't write files yet.
```

The agent first runs project onboarding (it reads `CLAUDE.md` and the
profile). Then it should answer with an experience goal (for example "sprint
is a choice, not a default"), a one-sentence problem statement, and a short
resource map: stamina, its source (regeneration) and its sink (sprinting).

Notice that it talks about what the player should feel before any numbers.
That order is the point of the skill.

## 2. Write the spec

Now type:

```
Following the design-spec skill, write the stamina spec as a reference page
in docs/reference/, organised by system, with state, numbered rules, a
numbers table, edge cases and acceptance checks.
```

The agent writes a page such as `docs/reference/stamina.md`. Open it. It
should look like the skill's template: a first line saying it is reference,
a state table, rules with IDs like `STAM-01`, a numbers table with units, an
edge-case list and a table of Given/When/Then checks.

Notice the tags: any number the agent could not justify is marked
**[chosen]** with a reason or **[verify]**. Nothing is a silent guess.

## 3. Review it like an implementer

Type:

```
Act as the gameplay-programmer and list every question you would need
answered to implement docs/reference/stamina.md. Then fix the spec so none
remain.
```

The output should be a short list of questions (for example "does stamina
drain while airborne?", "what happens if sprint is pressed on the exact tick
stamina hits zero?"), followed by edits to the spec. Each question becomes a
rule, an edge case or an **[open]** item with an owner.

Let's check: ask the same question again. This time the list should be empty
or contain only **[open]** items.

## 4. Record why

Type:

```
Write the rationale for the stamina design as an explanation page in
docs/explanation/, ADR style.
```

The agent writes `docs/explanation/about-stamina.md` with context, the
options considered, the decision and its consequences, and links it to the
reference page. The reference page links back.

## What we did

We framed a system from an experience goal, wrote it as a reference spec with
numbers and checks, closed every implementer question, and recorded the
reasoning separately as explanation. That is the core loop of the role. Next,
[How to design a feature](../how-to/how-to-design-a-feature.md) shows the
`design-feature` workflow that runs these steps, plus a tester and an
exploit-hunter review, in one go.

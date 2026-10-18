---
name: systems-design
description: Use when designing or reworking a game's core loop, mechanics or interlocking systems from an intended player experience, or when diagnosing why a system produces the wrong behaviour.
---

# Systems design

Design from the experience inward. MDA (Hunicke, LeBlanc, Zubek): designers
build **mechanics** (rules and data), which produce **dynamics** (behaviour at
run time when players act), which produce **aesthetics** (what players feel).
Players meet the game in the opposite order. You only control mechanics, so you
must predict and then test the dynamics they produce.

## Steps

1. **Experience goals.** Write 1-3 sentences on what the player should feel
   and do. Name the dominant aesthetics: sensation, fantasy, narrative,
   challenge, fellowship, discovery, expression, submission (pastime). If the
   project has pillars, quote them.
2. **Problem statement.** One sentence: what this system must achieve, what is
   in the way, constraints (platform, session length, audience, scope).
   (Schell, lens of the problem statement.)
3. **Verbs and loop.** List what the player does (verbs). Draw the core loop:
   the action repeated most often, its feedback, and the reward that feeds the
   next action. Then the loops around it (session, meta). Ask Cook's question:
   what repeats (loop, builds mastery) and what does not (arc, delivers content
   once)? Arcs cost content; loops cost design.
4. **State and resources.** List every resource and state variable (health,
   currency, time, position, cards, reputation). For each: sources (create it),
   drains or sinks (destroy it), converters (turn it into another), traders
   (exchange it between players or with the game), pools (where it waits).
   Machinations-style diagrams make this visible.
5. **Feedback loops.** Find every loop where a resource affects its own rate.
   - Positive (reinforcing): the leader gets stronger. Ends games, rewards
     skill, can make losers give up (MDA's board-game example).
   - Negative (balancing): the trailing player catches up. Prolongs tension,
     can feel like punishing success.
   Decide which you want, where, and how strong; add timers, caps or
   catch-up deliberately, never by accident.
6. **Choices.** For each decision a player makes, check it is meaningful
   (Salen and Zimmerman): its outcome is **discernible** (the player can see
   what happened) and **integrated** (it affects later play). Remove choices
   with one right answer or no visible consequence.
7. **Predict dynamics.** For each loop, write what you expect players to do,
   including the degenerate strategy (the cheapest way to win, stall or farm).
   Players optimise the fun out of games; find the exploit before they do.
8. **Prototype the cheapest test.** Paper, spreadsheet or a short simulation
   script (see `economy-balance`) before a build. Only ask for code when the
   question is about feel or real-time behaviour.
9. **Write it down** with `design-spec`; record why with an explanation page.

## Decision rules

- A mechanic that serves no experience goal is cut or parked.
- Prefer one system used in many ways over many single-use systems
  (depth from interaction, not from feature count).
- Every resource needs at least one source and one sink, or it inflates or
  vanishes.
- If two options are always picked together or one is never picked, the
  choice is fake; merge, differentiate or cut.
- Complexity budget: a new player should be able to state the core loop in
  one sentence after one session.

## Checklist

- [ ] Experience goals and dominant aesthetics written.
- [ ] Core loop and outer loops drawn; loops vs arcs identified.
- [ ] Resource map: sources, sinks, converters, traders for each resource.
- [ ] Each feedback loop named, its direction and strength intended.
- [ ] Degenerate strategies listed with a counter or accepted on purpose.
- [ ] Each player choice is discernible and integrated.
- [ ] Cheapest prototype chosen and run; results recorded.

## Failure modes

- Feature-driven design: a list of mechanics in search of an experience.
- Hidden runaway loop discovered at launch.
- Resource with no sink (inflation) or no source (dead currency).
- Emergence hoped for but not tested; or emergent exploits not looked for.
- Systems designed in isolation that contradict each other.

## Documentation owed

- System rules and numbers → reference (`design-spec`).
- Experience goals, loop diagram and the reasoning behind feedback-loop
  choices → explanation page, "About <system> design".

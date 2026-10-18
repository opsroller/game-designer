---
name: level-design
description: Use when designing levels, maps, encounters, worlds or a progression of content, and when ordering when mechanics are introduced and how difficulty and intensity rise.
---

# Level design and progression

A level is where mechanics meet a player at a specific moment of their
learning. Design levels from the mechanic and the intended feeling, not from
the layout (Dan Taylor's principles: mechanics drive design, start from the
emotion, clear goals with open methods, keep teaching, risk and reward).

## Progression: the order ideas arrive

1. **Inventory the ideas.** List every mechanic, enemy, obstacle, tool and
   rule variant the player must learn. Each is a skill to acquire.
2. **Order by dependency.** An idea that needs another comes after it.
3. **One new idea per beat.** Each level (or section) introduces at most one
   new idea, using this four-step arc:
   - **Introduce** in a safe space: the player meets it with no way to fail
     badly, ideally discovering it by doing.
   - **Develop**: use it in a slightly harder, still isolated situation.
   - **Twist**: change a condition so the player must apply it differently.
   - **Combine / test**: mix it with earlier ideas under pressure.
4. **Space the spikes.** Plot intended difficulty across the sequence. It
   rises overall with a sawtooth shape: a spike (a test or boss) followed by
   a rest (a new, easy idea or a reward). Never two maximum spikes in a row.
5. **Choose the difficulty levers** and use them in order: first goal size
   and variety (more to do), then complexity (more ideas at once), then
   resource scarcity, then time pressure and precision last. Precision and
   time spikes punish the most players.
6. **Gate deliberately.** Decide which progress is mandatory and which is
   optional; optional risk-for-reward paths let players pick their difficulty.

## Designing one level

1. Write the level brief (3-5 lines): the idea it teaches or tests, the
   intended feeling, target duration, target success rate, what the player
   should know afterwards.
2. Sketch the critical path first, then the alternatives, secrets and
   return routes. Mark where the player first sees the goal.
3. Readability: the player can see the goal (or a lead toward it), the
   threat and the safe space before committing. Teach with the space
   (landmarks, light, framing, sightlines) before text.
4. Pace intensity: alternate tension and release; plot an intensity graph
   for longer levels.
5. Build it as **data** in the project's level format, one file per level,
   with a fixed seed if any randomness exists, so tests and simulations repeat.
6. Greybox or simulate first; decorate only after play proves the layout.
7. Test: simulate for balance (`economy-balance`), playtest for
   understanding and feeling (`playtesting`).

For a set of units with no briefs yet, the `level-briefs` workflow runs
the progression steps and step 1 for the whole set: it writes one brief
per unit in the shape `author-level` checks for, and has a reviewer who
did not write them check the set.

Once the brief is finished, steps 5-7 are the `author-level` workflow:
it writes the data, validates it with the project's schema or loader,
checks it with a reviewer who did not write it and the simulator, and
updates the progression docs.

## Decision rules

- If testers fail at a new idea's introduction, the introduction is wrong,
  not the testers. Make the first contact safer or clearer.
- If a level is hard for the wrong reason (unclear goal, camera, unseen
  threat), fix readability before tuning numbers.
- Raise difficulty by adding thinking before adding speed.
- Every level must justify itself: what does it teach, test or let the
  player express that no other level does?

## Checklist per level

- [ ] Brief written: idea, feeling, duration, target success rate.
- [ ] At most one new idea; dependencies already taught.
- [ ] Goal or a lead toward it visible early.
- [ ] Safe first contact with any new threat or mechanic.
- [ ] Data file valid; seed fixed; loads in the build.
- [ ] Simulated against targets; playtested at least once.
- [ ] Place in the difficulty curve confirmed (not two spikes in a row).

## Failure modes

- Several new ideas at once; the player cannot tell what killed them.
- Designer blindness: levels tuned by their author, who knows the solution.
- Difficulty from obscurity (hidden rules, unreadable space) mistaken for challenge.
- A flat curve (boredom) or a cliff (drop-off) found only in telemetry.
- Levels hand-placed in code instead of data, so nobody can tune them.

## Documentation owed

- The progression table (level, idea, levers, target success rate) and the
  level data format → reference.
- Why the progression is ordered this way → explanation.
- "How to add a level" for content authors → how-to (update when the
  format or pipeline changes).

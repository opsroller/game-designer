# How to author a level from a brief

*How-to guide for designers building a level or other content unit whose design is already settled, with the game-designer plugin.*

This guide shows you how to turn a finished brief into a validated,
checked and documented data file using the `author-level` workflow. To
decide what a level should teach in the first place, use the
`level-design` skill; for a new mechanic, run `design-feature` first.

## Before you start

- The brief is finished: the idea the level teaches or tests, the intended
  feeling, target duration, target success rate, and what the player knows
  afterwards. The workflow stops if any is missing.
- The project profile names the level or content data path and gives it to
  the game designer, and a data format exists. Defining the format and its
  loader is a gameplay programmer's job.
- Ideally the project has a command that validates a data file, one that
  loads it, and a headless simulator. Without them the workflow still runs
  but reports the file as `incomplete`.

## Steps

1. Run the workflow on the brief:

   ```
   /game-designer:author-level {"brief": "docs/reference/levels/area-1-03-brief.md"}
   ```

   Pass `output` to choose the file, and `sequence` if the progression
   table is not where the design docs usually keep it.
2. If it returns `blocked`, read the reason. A missing brief point or an
   unowned path is fixed before running again; validation errors and
   findings name the place in the data.
3. Read `sequence_issues`. A unit that introduces a second new idea, or
   follows another maximum spike, is a progression problem; change the
   brief or the order, not the data.
4. Read `unverified`. Anything there was not machine-checked; ask the
   gameplay programmer for the missing validator, loader or simulator.
5. Playtest the unit with players who have not seen it (see
   [How to run a playtest](how-to-run-a-playtest.md)). The checks catch
   broken and off-target data, not whether it feels right.
6. Commit the data file with the updated progression table in one pull
   request, and put the simulation table in the description.

## If the checks disagree

- If the fresh reviewer says the level is off brief but the simulator says
  on target, trust the reviewer first: readability problems hide from bots.
- If several units in a row come back too hard, run
  [a balance pass](how-to-run-a-balance-pass.md) over the sequence
  instead of tuning them one at a time.

## See also

- [author-level workflow reference](../reference/workflow-author-level.md)
- [level-design skill reference](../reference/skill-level-design.md)

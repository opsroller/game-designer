# How to write the briefs for a set of levels

*How-to guide for designers who have a progression and design docs but no level briefs yet, with the game-designer plugin.*

This guide shows you how to turn a progression into one finished brief
per level or content unit using the `level-briefs` workflow, so each unit
can then be built with `author-level`.

## Before you start

- The design docs define every idea the set uses (mechanics, rule
  variants, obstacles). If one is still open, settle it with
  `design-feature` first; the workflow stops on undefined ideas.
- A progression page lists the units in play order, or you know which
  units to brief.
- A balance targets page exists, so success rates are numbers rather than
  guesses. Without one, briefs carry relative difficulty only.

## Steps

1. Run the workflow on the units, in play order:

   ```
   /game-designer:level-briefs {"units": ["area-1/02", "area-1/03", "area-1/04"]}
   ```

   Leave out `units` to brief every unit in the progression that lacks a
   finished brief. Pass `progression`, `design` or `output` if the
   project keeps them somewhere unusual.
2. If it returns `blocked`, read the reason. `gaps` means the design docs
   are not settled; `problems` means the set itself breaks the
   progression rules (too many new ideas for the units, an idea before
   the one it needs). Fix the design docs or the unit list, not the briefs.
3. Read the `sequence` table: one idea per unit, its arc role and the
   difficulty curve. Rests should follow spikes.
4. Ship it: pass the whole result as `prior` to
   `/engineering-practices:deliver-package { wp: "<the package>", prior: <the result> }`
   for a work package, or land the branch with
   `/engineering-practices:land-pr { branch: "<handoff.branch>" }` otherwise.
   The workflow has already committed and pushed the briefs and the
   progression table on `handoff.branch`;
   do not rebuild it.
5. Build each unit with `author-level`, in play order, passing its brief
   path from `briefs`. Then run a balance pass over the set.

## If you run it inline

The `check` steps review briefs you just drafted. Send those briefs to a
reviewer who did not write them (the project's code-reviewer role, or a
fresh session) and name them in `run.reviewers`. If you answer them
yourself, the run lists them as self-reviewed; say so in the pull request.

## See also

- [level-briefs workflow reference](../reference/workflow-level-briefs.md)
- [How to author a level from a brief](how-to-author-a-level.md)
- [How to run a balance pass](how-to-run-a-balance-pass.md)
- [level-design skill reference](../reference/skill-level-design.md)

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
   Open choices the design docs leave to you (a unit count, a provisional
   number) come back as `notes`, with the default the run took; they do
   not stop it.
   Blocking findings from the independent check do not stop the run at
   once: a revision step closes them and a fresh read-only check reads
   the set again, up to four checks. When only minor wording findings
   are left, they are fixed in place, with the matching sequence rows,
   and the run goes on. If blocking findings remain after the fourth
   check, the run still writes, documents and hands off the set, with
   `status: "open findings"` and the findings in `open_items`. Close them
   before the PR merges: settle what each needs (a planning note, a
   design-doc change), then follow `resume`, which re-runs the last
   revision and check on the drafted set without redoing Plan, Sequence
   and Draft.
3. Read `design_gaps` and `pace`. A design gap is a problem in the
   design docs themselves, such as two pages that disagree or a clock too
   short for the goals it is meant to hold; the briefs follow the docs as
   written, so send each gap to the owner of the docs it names. `pace`
   lists briefs whose duration at human pace still does not fit the
   clock; mark their success rates provisional until a playtest.
4. Read the `sequence` table: one idea per unit, its arc role and the
   difficulty curve. Rests should follow spikes. The progression table
   rows follow the columns, order and link style of the project's
   existing table; a new table with default columns is made only when the
   project has none.
5. Ship it: pass the whole result as `prior` to
   `/engineering-practices:deliver-package { wp: "<the package>", prior: <the result> }`
   for a work package, or land the branch with
   `/engineering-practices:land-pr { branch: "<handoff.branch>" }` otherwise.
   The workflow has already committed and pushed the briefs and the
   progression table on `handoff.branch`;
   do not rebuild it.
6. Build the units with `author-level`, passing the brief paths from
   `briefs` in play order: one per run with `brief`, or the whole set in
   one run with `briefs: [...]` (add `set_design: true` to design them as
   one set). Then run a balance pass over the set.

## If you run it inline

The `check:<round>` steps review briefs you just drafted; the
`revise:<round>` steps between them are yours to do. Send those briefs to a
reviewer who did not write them (the project's code-reviewer role, or a
fresh session) and name them in `run.reviewers`. If you answer them
yourself, the run lists them as self-reviewed; say so in the pull request.

## See also

- [level-briefs workflow reference](../reference/workflow-level-briefs.md)
- [How to author a level from a brief](how-to-author-a-level.md)
- [How to run a balance pass](how-to-run-a-balance-pass.md)
- [level-design skill reference](../reference/skill-level-design.md)

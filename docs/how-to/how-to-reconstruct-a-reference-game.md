# How to reconstruct a reference game

*How-to guide for teams remaking or matching an existing game with the game-designer plugin.*

This guide shows you how to turn public observation of an existing game into
a sourced, original rules spec, using the `reconstruct-design` workflow.

## Before you start

- Decide the exact reference: title, version and platform. Versions differ.
- Confirm the project's provenance rules (engineering-practices `provenance`).
  The workflow records behaviour in its own words and never copies text, art,
  audio, code or data.

## Steps

1. Run the workflow:

   ```
   /game-designer:reconstruct-design {"reference": "<title>, <version>, <platform>"}
   ```

   Add `"systems": ["movement", "scoring", "session structure"]` if you
   already know the system map.
2. Check the scope line in the log names the version you meant.
3. When it finishes, open the spec. Rules are tagged confirmed (with
   evidence IDs), **[verify]** or **[chosen]**. Systems listed as
   unverified or failed at the top need another pass.
4. Rerun for just those systems with the `systems` argument.
5. Read the deviations explanation page and agree each **[chosen]** deviation.
   Then ship it: pass the whole result as `prior` to
   `/engineering-practices:deliver-package { wp: "<the package>", prior: <the result> }`
   for a work package, or land the branch with
   `/engineering-practices:land-pr { branch: "<handoff.branch>" }` otherwise.
   The workflow has already committed and pushed the spec, evidence log
   and docs on `handoff.branch`;
   do not rebuild it.
6. After implementation, compare the build with the reference footage side
   by side and file deltas with numbers (the `design-reconstruction` skill,
   step 8).

## If evidence is thin

Accept **[chosen]** values with reasons rather than waiting; reconstruction
must not block on one unknown. Record what evidence would change the choice.

## See also

- [reconstruct-design workflow reference](../reference/workflow-reconstruct-design.md)
- [design-reconstruction skill reference](../reference/skill-design-reconstruction.md)

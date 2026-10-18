# How to run a balance pass

*How-to guide for designers tuning levels, encounters or an economy with the game-designer plugin.*

This guide shows you how to check a set of content units against difficulty
targets with simulated play, and apply the smallest fixes, using the
`balance-pass` workflow.

## Before you start

- A balance targets reference page exists (success rate, margin, duration
  per unit and difficulty). If not, write it first with the
  `economy-balance` skill; the workflow stops without targets.
- The project has a headless simulator, or a gameplay programmer can provide
  one. The skill's simulation reference lists what it needs.

## Steps

1. Propose first, without editing data:

   ```
   /game-designer:balance-pass {"units": ["levels/area-1/01", "levels/area-1/02", "levels/area-1/03"], "targets": "docs/reference/balance-targets.md"}
   ```

   List units in play order; the curve check depends on it.
2. Read the returned table: unit, current value, proposed change, reason.
   Units marked `unverified` did not simulate; investigate before trusting
   the curve around them.
3. If the proposals look right, run again with `"apply": true`. One agent
   edits only data files the project profile says the designer owns,
   re-simulates, and lists files that belong to someone else.
4. Playtest the changed units (see [How to run a playtest](how-to-run-a-playtest.md)).
   Simulation confirms numbers, not feeling.
5. Ship it: pass the whole result as `prior` to
   `/engineering-practices:deliver-package { wp: "<the package>", prior: <the result> }`
   for a work package, or land the branch with
   `/engineering-practices:land-pr { branch: "<handoff.branch>" }` otherwise.
   The workflow has already committed and pushed the data changes
   and the updated balance reference on `handoff.branch`;
   do not rebuild it. Put the simulation summary table in
   the PR description. A run with `"apply": false` changes nothing and
   returns no handoff.

## If a target cannot be reached

When no data value can meet a target or curve rule (a rate already at its
ceiling that a rule needs to move, two targets that contradict each other),
the pass does not force the data. It returns `status: "needs decision"`.

1. Read `target_changes`: each has the current and proposed target, the
   evidence and the effect on other units. Read `target_check` for what
   the independent check doubted; fix or drop a proposal it rejects.
2. Send each proposal to the `decider` it names. Do not edit the targets
   page until the change is accepted.
3. Send each item in `handoffs` to its owner role (engineering-practices
   peer-coordination): a simulator, bot or checker fault is theirs to fix,
   not yours.
4. When the decision and fixes land, run the pass again on `held_units`.

## If results look implausible

- If the random bot wins often, check the simulator loads the same data the
  game does.
- If the goal-aware bot fails everywhere, watch a replay for a rule bug
  before tuning. The pass lists suspected tool faults under `handoffs`.
- If one strategy wins every unit or a metric is pinned at the same value
  everywhere, that is a fault in the tool, not in your data. The pass
  marks it tool-wide: it holds no unit, tunes from the other metrics,
  lists the spoiled metric under `unverified_metrics` and sends the fault
  to the tool's owner under `handoffs`. Re-run the pass once it is fixed.

## See also

- [balance-pass workflow reference](../reference/workflow-balance-pass.md)
- [economy-balance skill reference](../reference/skill-economy-balance.md)

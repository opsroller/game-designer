---
name: economy-balance
description: 'Use when setting or tuning numbers: difficulty curves, costs and rewards, currencies and sinks, unit or ability strength, drop rates, progression pacing; and when checking balance with spreadsheets or simulated play.'
---

# Economy and balance

Balance is not "everything equal". It is the game meeting its targets on
purpose. Schreiber's four kinds of balance: (1) players' chance to win is fair
(or deliberately not), (2) challenge suits the audience, (3) strategies are
viable (or deliberately not), (4) resources have consistent cost to benefit.
Use three tools together: **math** (fast to explore, wrong if the model is),
**simulation** (shows dynamics the math hides), **playtesting** (the only
judge of experience). Valve's framing applies: a balance change is a hypothesis.

## Steps

1. **Set targets before tuning.** Per difficulty and content unit: success
   rate, time or moves to complete, resources earned and spent, margin at the
   end (time or health left). Write them as a reference table. No targets, no
   tuning.
2. **Model it.** Spreadsheet or script with every tunable in one place, named
   as in the spec. Build:
   - a **cost curve**: benefit as a function of cost for every buyable or
     choosable option; outliers above the curve are overpowered, below are
     dead. Costs may rise faster than linearly on purpose.
   - an **economy flow**: per session, income by source and spend by sink;
     net should match the intended accumulation (save up, spend down).
   - **counters**: for intransitive relations (A beats B beats C beats A),
     a payoff matrix; check no option dominates.
3. **Simulate.** Run the project's simulator (or write one; see
   [simulation.md](simulation.md)) with several **bot strategies** from naive
   to goal-aware, many runs per content unit and difficulty, fixed seeds per
   run so results reproduce.
4. **Compare to targets.** Per unit: success rate, margin and variance.
   Across a sequence: does the curve rise as intended with rests after spikes?
5. **Tune the smallest change.** Change one variable at a time; prefer data
   over rules. For large unknowns, halve or double first to find the range
   (Schreiber's rule of two), then narrow.
6. **Re-simulate and playtest.** Simulation confirms numbers; only players
   confirm feeling and understanding.
7. **Record**: before and after values, results, reason, in the PR and in
   the balance reference.

## Decision rules

- Players should never be put in an unwinnable situation through no fault of
  their own.
- Every option should be worth choosing in some situation; cost proportional
  to payoff.
- If the naive bot wins easily, the content is too easy for anyone; if the
  best bot rarely wins, it is too hard or broken.
- High variance with the same seed policy means luck dominates; decide if
  that is intended for this content.
- Fix a dominant strategy by raising its cost or adding a counter, not by
  nerfing it into uselessness.
- If no data value can meet a target (a rate at its ceiling, targets that
  contradict each other), the target is the problem: propose the smallest
  change that keeps its intent, with the simulation evidence, to whoever
  owns the targets. Never bend the data past the design, or the simulator,
  to make a number pass.
- If a result comes from the simulator or a bot rather than the data,
  hand the fault to the tool's owner with the evidence; do not tune around it.
- Positive feedback loops need a cap, decay or end condition; check runaway
  in long simulations.
- Faucets and sinks: every currency's income must be matched by sinks the
  player wants, or prices inflate and rewards stop meaning anything.

## Checklist

- [ ] Targets table written and agreed before tuning.
- [ ] All tunables named as in the spec, in one place.
- [ ] Cost curve plotted; outliers explained or fixed.
- [ ] Economy flow per session; every currency has sources and sinks.
- [ ] Simulation: ≥3 strategies, fixed seeds, enough runs for stable rates.
- [ ] Curve across the sequence checked for spikes and rests.
- [ ] One change at a time; before/after recorded.
- [ ] Playtest confirms the simulated result feels right.

## Failure modes

- Tuning to the designer's skill (too hard for everyone else).
- Averages hide extremes: always look at distribution and worst cases.
- Bots that play nothing like players, trusted blindly.
- Fixing a symptom in one level instead of the curve or the rule behind it.
- Simultaneous changes; no one knows which one worked.
- Monetisation or retention numbers driving rewards against the experience goals.

## Documentation owed

- Targets, tunables and current values → reference (balance page).
- Why a curve or economy is shaped this way, and rejected alternatives →
  explanation.
- How to run the balance simulation → how-to (if the project lacks one).

# economy-balance skill

*Reference for users of the game-designer plugin: what the `economy-balance` skill covers and produces.*

| Field | Value |
|---|---|
| Name | `economy-balance` |
| File | `skills/economy-balance/SKILL.md` |
| Trigger | Use when setting or tuning numbers: difficulty curves, costs and rewards, currencies and sinks, unit or ability strength, drop rates, progression pacing; and when checking balance with spreadsheets or simulated play. |
| Covers | Targets, cost curves, economy flows, payoff matrices, bot simulation and one-change-at-a-time tuning. |

## Inputs

- Targets table
- Tunables named as in the spec
- Headless simulator

## Outputs

- Cost curve and economy flow
- Simulation summary table per unit
- Before/after values with reasons

## Supporting files

- [`simulation.md`](../../skills/economy-balance/simulation.md): simulator requirements, run counts, reading results, PR summary table

## Terms and values

- Verdicts: too easy, on target, too hard

## Documentation owed

Reference (targets and values); explanation (curve rationale); how-to (running the simulator).

Related: [reference index](index.md).

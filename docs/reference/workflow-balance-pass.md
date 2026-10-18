# balance-pass workflow

*Reference for users of the game-designer plugin: arguments, phases and outputs of `balance-pass`.*

| Field | Value |
|---|---|
| Name | `balance-pass` |
| File | `workflows/balance-pass.js` |
| Invocation | `/game-designer:balance-pass` |
| Purpose | Simulate content units in parallel against written targets, fit the difficulty curve, optionally apply the smallest data changes, and document them. |

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `units` | yes | string[] | Content files or IDs, in play order. |
| `targets` | no | string | Targets reference page. Default: the balance targets page in the project design docs. |
| `apply` | no | boolean | `true` edits designer-owned data files and re-simulates. Default `false`: proposals only. |

Empty `units` returns a usage string.

## Phases

| Phase | Agents | Writes files | Does |
|---|---|---|---|
| Plan | 1 | no | Finds targets, simulator command, strategies, runs; doc plan by kind (docs Plan step). |
| Simulate | 1 per unit, parallel | no | Runs the simulator; returns summary table, verdict, proposal. |
| Curve | 1 | no | Fits proposals to the whole sequence; returns a change table. |
| Apply | 1 (only if `apply`) | yes | Single edit per data file the designer owns; re-simulates. |
| Docs | 1 | yes | Balance reference values and tables; explanation if the curve changed (docs Do step). |
| Docs check | 1 | fixes only | One kind per page, titles, links (docs Check step). |

## Outputs

Object: `status` (`done` or `docs missing`), `unverified_units`, `proposals`, `applied`, `docs`, `doc_issues`.

## Stop conditions

| Condition | Result |
|---|---|
| No targets found | `blocked`; write targets first |
| A unit's simulation returns nothing | Unit marked `unverified`, kept unchanged and listed |
| Curve step returns nothing | `{ status: 'blocked' }` with raw results |

Related: [How to run a balance pass](../how-to/how-to-run-a-balance-pass.md), [reference index](index.md).

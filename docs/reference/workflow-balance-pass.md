# balance-pass workflow

*Reference for users of the game-designer plugin: arguments, phases and outputs of `balance-pass`.*

| Field | Value |
|---|---|
| Name | `balance-pass` |
| File | `workflows/balance-pass.js` |
| Invocation | `/game-designer:balance-pass` |
| Purpose | Simulate content units in parallel against written targets, fit the difficulty curve, optionally apply the smallest data changes, and document them. When no data change can meet a target, propose the target change with evidence and hand tool faults to their owners. |

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
| Curve | 1 | no | Fits proposals to the whole sequence; returns a change table, plus `unreachable` targets or curve rules no data value meets and `tool_faults` in the simulator, bots or checkers. Each fault has a `scope`: `units` when only some units' results are spoiled, `tool` when the fault is in the tool whatever the data (a strategy that wins every unit, a metric pinned everywhere), and the `metric` it spoils. A tool-wide fault, or any fault that names every unit, holds no unit: proposals come from the metrics it does not spoil, and its metric is listed as unverified. |
| Targets | 2 (only if a target is unreachable) | no | One agent proposes the smallest target change that keeps its intent, with evidence, effect on other units, the decider and any tool change that must follow; an independent agent checks the evidence. |
| Apply | 1 (only if `apply`) | yes | Single edit per data file the designer owns; re-simulates. Leaves held units unchanged; never edits the simulator, a bot, a checker or the targets page. |
| Docs | 1 | yes | Balance reference values and tables; explanation if the curve changed (docs Do step). Proposed target changes stay out of the reference until accepted. |
| Docs check | 1 to 3 checks, up to 2 fixes | fixes only | One kind per page, titles, links (docs Check step). Each issue is `blocking` or `minor`. A fix step returns the pages it edited or added, and the next check reads every page touched so far, added pages included. Up to three checks and two fixes; blocking issues left at the end give `docs missing` and skip the handoff, minor ones go to the handoff `notes`. |
| Handoff | 1, only with `apply` | commits only | Commits the changed data and docs on a feature branch, pushes, re-runs the simulator, any validator, the test suite and docs checks on the pushed head. Skipped with `apply: false` (nothing changed) and when `status` is `incomplete` or `docs missing`. Never opens or merges a PR. |

## Outputs

Object: `status` (`done`; `incomplete` when any unit is unverified; `docs missing`, also when the docs check left blocking issues; `needs decision` when target changes are open or units are held), `unverified_units`, `proposals`, `target_changes` (`target`, `current`, `proposed`, `evidence`, `effect`, `decider`, `needs_tool_change`), `target_check` (the independent check's findings), `handoffs` (`owner`, `tool`, `change`, `evidence`, `units`, `scope`), `held_units` (units left unchanged until a decision or a per-unit tool fix), `unverified_metrics` (metrics spoiled by a tool-wide fault), `applied`, `docs` (`pages`, `undocumented`), `doc_issues`, `next`, and, with `apply`, `handoff` (see below). `handoffs` are tool fixes for other roles; `handoff` is the pushed branch for deliver-package.

## Stop conditions

| Condition | Result |
|---|---|
| No targets found | `blocked`; write targets first |
| A unit's simulation returns nothing | Unit marked `unverified`, kept unchanged and listed |
| Curve step returns nothing | `{ status: 'blocked' }` with raw results |
| Apply step returns nothing (with `apply`) | `{ status: 'blocked' }`; docs not written; inspect the working tree |
| Target proposal step returns nothing | `{ status: 'blocked' }` with `unreachable`, `tool_faults` and proposals |
| A target cannot be met by data, or a tool is at fault for some units | Runs on; affected units held, `status: 'needs decision'`, `next` says who gets what |
| A tool is at fault for every unit (tool-wide) | Runs on; no unit held, the fault goes to `handoffs` and its metric to `unverified_metrics`; `status` is `done` unless something else is open, and `next` says to re-run once the tool is fixed |
| Handoff returns nothing or no branch, or the checks fail on the pushed head (with `apply`) | `{ status: 'blocked', reason, unverified_units, proposals }` naming the problem |

## Handoff

`handoff` is the object engineering-practices
[deliver-package](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-deliver-package.md)
takes as `prior`, so pass the whole result and the applied pass ships without
being simulated again: `from` (`game-designer:balance-pass`), `branch`, `pr`,
`head_sha`, `tests_pass`, `docs` (page paths), `undocumented`, `notes`. `notes` lists held units, metrics a tool-wide fault leaves unverified, unaccepted target changes and docs-check issues. With no
work package, land the branch with land-pr instead; `next` names both.
The handoff step never opens, marks ready or merges a PR.

Related: [How to run a balance pass](../how-to/how-to-run-a-balance-pass.md), [reference index](index.md).

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `sim:<unit>` (one per unit), `curve`, `targets`, `check:targets`, `apply`, `docs`, `docs-check`, then while issues remain `docs-fix`, `docs-recheck`, `docs-fix:2`, `docs-recheck:2` (the checks are read-only, the fixes are not independent), `handoff`.

Independent steps: `check:targets`, `docs-check`, `docs-recheck`, `docs-recheck:2`. In inline mode these briefs come back marked `independent: true`; send them to a reviewer who did not do the work (the project's code-reviewer role, a fresh session or subagent) and name them in `run.reviewers`, or the run lists them under `self_reviewed` and you report them as self-reviewed.

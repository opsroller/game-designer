# author-level workflow

*Reference for users of the game-designer plugin: arguments, phases and outputs of `author-level`.*

| Field | Value |
|---|---|
| Name | `author-level` |
| File | `workflows/author-level.js` |
| Invocation | `/game-designer:author-level` |
| Purpose | Build one level or content unit, or a set of them, as data from finished briefs, validate each with the project's schema or loader, check each against its brief and the set with the simulator, revise, and document it. |

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `brief` | yes, unless `briefs` is given | string or object | Path of the brief page, or the brief text. A brief given as an object or list is laid out as labelled lines and bullets in every prompt. |
| `briefs` | no | (string or object)[] | A set of briefs (paths, text or objects) in play order, authored in one run. When given and not empty, `brief` is ignored. |
| `output` | no | string | Data file to write; with `briefs`, the data directory or naming hint (one file per unit). Default: the level or content data path in the project profile, one file per unit. |
| `sequence` | no | string | Progression table page. Default: the progression table in the project design docs, if any. |
| `set_design` | no | boolean | With `briefs`: design, author and revise the set as a whole in one step that sees every brief (set design), instead of one step per unit. Default `false`. |

Missing both `brief` and `briefs` returns a usage string.

## Set mode

With `briefs`, each unit is planned, authored, validated and brief-checked
on its own (labels end in the unit's 1-based number), the simulation
runs once over the whole set in play order, and the docs, docs check and
handoff run once for the set. With `brief`, the run, its labels and its
result are as for a single unit.

With `briefs` and `set_design: true`, one step (`author:set`) designs the
set first (what each unit does that the others do not, how layouts, goals
and obstacles vary, where each idea first appears and how later units
reuse it, the curve) and then writes every file. It returns the
`set_plan`, which the revisions keep and the docs record. Revisions run as
one step for the set (`revise:set:<round>`). Planning, validation, the
brief checks and the simulation are as in set mode.

A finished brief states the idea the unit teaches or tests, the intended
feeling, target duration, target success rate, and what the player knows
afterwards (`level-design`, "Designing one level", step 1).

## Phases

| Phase | Agents | Writes files | Does |
|---|---|---|---|
| Plan | 1 per unit | no | Checks the brief is finished; finds the output path and whether the designer owns it, the data format and closest example, validator, loader, simulator and targets, and `derived` values (a value a checker prints that the data must record, with the command that prints it and the field that records it); checks the unit's place in the progression; doc plan by Diataxis kind (docs Plan step). |
| Author | 1 per unit, or 1 for the set with `set_design` | yes | Writes the data file: critical path first, goal visible early, safe first contact, fixed seed, data only. With `set_design`, designs the set and writes every file. |
| Validate | 1 per unit, or 0 if neither command exists; plus 1 converge step per unit with `derived` values | data only | Runs whichever of the validator and loader exist; fixes the data (never the validator) up to three times. Then converges each derived value (`converge:<round>`): sets the field to what the checker prints, re-runs the checker and the validator, and repeats until a re-run prints what the data records, up to five rounds per value. Runs again after each revision. A value still moving is listed under `unverified` as `not converged`. |
| Check | 1 per unit plus 1 simulation, in parallel | no | A reviewer who did not write the unit reads it against the brief; the simulator runs random, greedy and goal-aware bots against targets. In set mode the simulation runs once over all files and returns a verdict per file. |
| Revise | 1 per unit with findings per round (1 for the set with `set_design`), plus re-checks | data only | Smallest data change per finding, re-validates the revised units, re-runs only the checks that failed (`recheck:` labels); up to two rounds. |
| Docs | 1 | yes | Progression table row per unit with file and seed; format reference, how-to or explanation only if they changed (docs Do step). In set mode each planned page is listed once, with the units' reasons merged; with `set_design`, the set plan goes to the explanation. |
| Docs check | 1 to 3 checks, up to 2 fixes | fixes only | One kind per page, titles, links (docs Check step). Each issue is `blocking` or `minor`. A check that finds only minor issues ends the loop: no fix step and no re-check run, and the issues go to the handoff `notes`. While a blocking issue remains, a fix step returns the pages it edited or added, and the next check reads every page touched so far, added pages included, and is given the last check's issues to confirm closed. An issue the fix step leaves for a content decision (its `left` list, each `{ page, problem, severity }`) keeps the severity of the issue it came from (a plain string counts as blocking) and is carried into the next check's list whatever the re-check says: a blocking one blocks, a minor one goes to the handoff notes. Every item left so far is also given to later re-checks to confirm. Up to three checks and two fixes; blocking issues left at the end give `docs missing` and skip the handoff, minor ones go to the handoff `notes`. |
| Handoff | 1 | commits only | Commits the data file (every file of a set) and docs on a feature branch, pushes, runs the validator, load test, test suite and docs checks on the pushed head. Skipped when `status` is `docs missing`. Never opens or merges a PR. |

## Outputs

Object: `status` (`done`; `incomplete` when the project lacks a validator or a loader, the simulation or brief check did not run, or a derived value did not converge; `docs missing` when the docs step failed or the docs check left blocking issues; `blocked`), `file`, `validation` (`ok`, `ran`, `errors`), `derived` (each converged value: `value`, `recorded`, `rounds`, `stable`), `brief_check`, `simulation`, `sequence_issues`, `unverified`, `next`, `docs` (`pages`, `undocumented`), `doc_issues`, `handoff` (see below). `next` names the playtest and how to ship the handoff.

In set mode: `files` in place of `file`, and `units` (`file`, `validation`, `derived`, `brief_check`, `sequence_issues` per unit) in place of the per-unit fields; `simulation` is the table over the whole set; `unverified` entries name their file; `set_plan` is the set design (empty without `set_design`). One `handoff` covers the set.

## Stop conditions

| Condition | Result |
|---|---|
| Brief missing any of its five points | Usage-style `blocked` string listing what is missing; nothing written |
| Set mode: any unit not ready (brief unfinished, path not owned, no format, plan failed) | `{ status: 'blocked', units: [{ unit, brief, problem }] }`; nothing written |
| Output path not owned by the designer in the profile | `blocked` string; nothing written |
| No data format exists | `blocked` string; a gameplay programmer defines the format first |
| Data fails validation after three fixes | `{ status: 'blocked' }` with errors; in set mode `units: [{ file, problem, errors }]` |
| Still off brief or off target after two revisions | `{ status: 'blocked' }` with open findings and the simulation table; in set mode `files` and findings prefixed with their file |
| No validator, no loader, or no simulator | Runs on with what exists; each missing one listed under `unverified`, `status: 'incomplete'` |
| A derived value still changes after five rounds | Runs on; listed under `unverified` as `not converged`, `status: 'incomplete'`, carried to the handoff `notes` |
| Handoff returns nothing or no branch, or the checks fail on the pushed head | `{ status: 'blocked', reason, file }` (`files` in set mode) naming the problem |

## Handoff

`handoff` is the object engineering-practices
[deliver-package](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-deliver-package.md)
takes as `prior`, so pass the whole result and the unit ships without
being authored again: `from` (`game-designer:author-level`), `branch`, `pr`,
`head_sha`, `tests_pass`, `docs` (every page touched), `undocumented`, `notes` (unverified checks and minor docs-check issues). With no
work package, land the branch with land-pr instead; `next` names both.
The handoff step never opens, marks ready or merges a PR.

Related: [How to author a level from a brief](../how-to/how-to-author-a-level.md), [level-design skill](skill-level-design.md), [reference index](index.md).

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `author`, `validate:<round>`, `converge:<round>` (only with derived values; after each validation), `check:brief`, `check:sim`, `revise:<round>`, `recheck:brief:<round>` and `recheck:sim:<round>` (re-checks after a revision), `docs`, `docs-check`, then while issues remain `docs-fix`, `docs-recheck`, `docs-fix:2`, `docs-recheck:2` (the checks are read-only, the fixes are not independent), `handoff`. In set mode, with `<n>` the unit's 1-based number: `plan:<n>`, `author:<n>`, `validate:<n>:<round>`, `converge:<n>:<round>`, `check:brief:<n>`, `check:sim` (once), `revise:<n>:<round>`, `recheck:brief:<n>:<round>`, `recheck:sim:<round>`, then the docs steps and `handoff` once. With `set_design`, `author:set` replaces `author:<n>` and `revise:set:<round>` replaces `revise:<n>:<round>`.

Independent steps: `check:brief`, `check:sim`, every `recheck:` step, `docs-check`, `docs-recheck`, `docs-recheck:2` (and their set-mode forms). In inline mode these briefs come back marked `independent: true`; send them to a reviewer who did not do the work (the project's code-reviewer role, a fresh session or subagent) and name them in `run.reviewers`, or the run lists them under `self_reviewed` and you report them as self-reviewed.

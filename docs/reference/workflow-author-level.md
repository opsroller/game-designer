# author-level workflow

*Reference for users of the game-designer plugin: arguments, phases and outputs of `author-level`.*

| Field | Value |
|---|---|
| Name | `author-level` |
| File | `workflows/author-level.js` |
| Invocation | `/game-designer:author-level` |
| Purpose | Build one level or content unit as data from a finished brief, validate it with the project's schema or loader, check it against the brief and the simulator, revise, and document it. |

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `brief` | yes | string | Path of the brief page, or the brief text. |
| `output` | no | string | Data file to write. Default: the level or content data path in the project profile, one file per unit. |
| `sequence` | no | string | Progression table page. Default: the progression table in the project design docs, if any. |

Missing `brief` returns a usage string.

A finished brief states the idea the unit teaches or tests, the intended
feeling, target duration, target success rate, and what the player knows
afterwards (`level-design`, "Designing one level", step 1).

## Phases

| Phase | Agents | Writes files | Does |
|---|---|---|---|
| Plan | 1 | no | Checks the brief is finished; finds the output path and whether the designer owns it, the data format and closest example, validator, loader, simulator and targets; checks the unit's place in the progression; doc plan by Diataxis kind (docs Plan step). |
| Author | 1 | yes | Writes the data file: critical path first, goal visible early, safe first contact, fixed seed, data only. |
| Validate | 1, or 0 if neither command exists | data only | Runs whichever of the validator and loader exist; fixes the data (never the validator) up to three times. |
| Check | 2 in parallel | no | A reviewer who did not write the unit reads it against the brief; the simulator runs random, greedy and goal-aware bots against targets. |
| Revise | 1 per round, plus re-checks | data only | Smallest data change per finding, re-validates, re-runs only the checks that failed; up to two rounds. |
| Docs | 1 | yes | Progression table row with file and seed; format reference, how-to or explanation only if they changed (docs Do step). |
| Docs check | 1 | fixes only | One kind per page, titles, links (docs Check step). |

## Outputs

Object: `status` (`done`; `incomplete` when the project lacks a validator or a loader, or the simulation or brief check did not run; `docs missing` when the docs step failed or the docs check left issues; `blocked`), `file`, `validation` (`ok`, `ran`, `errors`), `brief_check`, `simulation`, `sequence_issues`, `unverified`, `next`, `docs`, `doc_issues`.

## Stop conditions

| Condition | Result |
|---|---|
| Brief missing any of its five points | Usage-style `blocked` string listing what is missing; nothing written |
| Output path not owned by the designer in the profile | `blocked` string; nothing written |
| No data format exists | `blocked` string; a gameplay programmer defines the format first |
| Data fails validation after three fixes | `{ status: 'blocked' }` with errors |
| Still off brief or off target after two revisions | `{ status: 'blocked' }` with open findings and the simulation table |
| No validator, no loader, or no simulator | Runs on with what exists; each missing one listed under `unverified`, `status: 'incomplete'` |

Related: [How to author a level from a brief](../how-to/how-to-author-a-level.md), [level-design skill](skill-level-design.md), [reference index](index.md).

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `author`, `validate:<round>`, `check:brief`, `check:sim`, `revise:<round>`, `docs`, `docs-check`.

Independent steps: `check:brief`. In inline mode these briefs come back marked `independent: true`; send them to a reviewer who did not do the work (the project's code-reviewer role, a fresh session or subagent) and name them in `run.reviewers`, or the run lists them under `self_reviewed` and you report them as self-reviewed.

# level-briefs workflow

*Reference for users of the game-designer plugin: arguments, phases and outputs of `level-briefs`.*

| Field | Value |
|---|---|
| Name | `level-briefs` |
| File | `workflows/level-briefs.js` |
| Invocation | `/game-designer:level-briefs` |
| Purpose | Write one brief per level or content unit for a set, from the progression and design docs, in the shape `author-level` checks for; check each duration against the clock at human pace, check the set independently, revise and re-check it, and document it in the shape of the project's own progression table. |

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `units` | no | string[] | Units to brief, in play order. Default: every unit in the progression whose brief is missing any of the five points. |
| `progression` | no | string | Progression page. Default: the progression table in the project design docs. |
| `design` | no | string | Design docs or spec pages that define the ideas. Default: the project's design docs and rules spec. |
| `output` | no | string | Where briefs go. Default: where the project keeps level briefs (the progression page's brief sections or the path its profile gives), one per unit. |

## The brief

Each brief carries the five points `author-level` checks for, labelled so
it finds them:

| Label | Content |
|---|---|
| Idea | The one idea the unit teaches or tests |
| Feeling | The intended feeling, one or two words a playtester can confirm |
| Duration | Target duration as a time or move range |
| Target success rate | A number, per difficulty if the targets page has difficulties |
| Takeaway | What the player knows afterwards, starting "The player knows" |

Below them: role in the idea's arc (`introduce`, `develop`, `twist`,
`test`, `rest`), difficulty levers, first contact, the pace check (when the
project has a clock or a human pace) and notes for the author.

The pace check (`pace_check`) compares the time a first-time player needs
with the clock the unit gets: the moves or actions the unit takes times
the human pace (for example seconds per move) against the time limit.
It returns `human_duration`, `clock`, `fits` and a `note`. A draft that
does not fit changes its own goal size or duration within the design; when
the design's own numbers make it impossible, the check routes it as a
design gap.

## Phases

| Phase | Agents | Writes files | Does |
|---|---|---|---|
| Plan | 1 | no | Units in range and those already briefed; idea inventory with dependencies; brief location, ownership and format; targets; `pace` (the clock and human pace, if any); `gaps` (only what makes briefs impossible: these stop the run) and `notes` (open choices, assumptions and provisional numbers that do not: these go to every later step and the result); doc plan by Diataxis kind (docs Plan step). |
| Sequence | 1 | no | Gives each unit one idea, an arc role, a 1-10 difficulty and levers; checks one new idea per unit, dependency order and the sawtooth curve. Sorts what the set cannot meet into `problems` (blocking rule breaks no choice within the design fixes), `notes` (deviations a planning note already covers or accepted with a named default; carried to the drafts and the result) and `design_gaps` (rule breaks the design docs force; added to the run's design gaps). Only `problems` block. |
| Draft | 1 per unit, parallel | no | Returns each unit's brief, with its `pace_check` when Plan found a clock or a pace. |
| Check | 1 | no | Independent and read-only (`check:1`): a reviewer who did not write the briefs checks completeness, idea order, curve, targets, duration against the clock at human pace, that no two units do the same job, and that each brief agrees with its sequence row (idea, role, levers, and a success rate that fits the row's difficulty). Returns unit findings and set findings, each `blocking` or `minor` (wording or clarity a revision fixes in place), and `design_gaps`: problems in the design docs themselves (they contradict each other, leave the point open, or give numbers no brief can meet). A finding flagged `design_gap: true` counts as one. |
| Revise | 1 revision, then 1 re-check, per round; 1 polish | no (the revision changes the briefs in the run; Write writes them) | On any blocking finding, unit or set: a revision step (`revise:<round>`, not independent) changes the briefs, and for set findings the roles, difficulties and levers in the sequence, keeping the unit list and order; findings that need the design docs changed come back as `design_gaps`. A fresh independent, read-only check (`check:<round>`) then reads the whole set again, told which design gaps are already known so it does not report them again. Design gaps never enter the loop. Up to four checks and three revisions. When a check leaves only minor findings, a `polish` step fixes their wording in place, updates the matching sequence rows and table when a fix changes anything they record, and the run goes on to Write without another check; a brief and row that still disagree on role or levers go to `notes`. When blocking findings remain after the fourth check, the run goes on to Write, Docs and Handoff with them as open items (see Outputs). |
| Write | 1 | briefs only | Writes the briefs in the project's format; no level data or targets. |
| Docs | 1 | yes | Reads the project's existing progression or plan table first and adds each unit's row in its shape (its columns and their order, row order, link style, file), leaving columns `author-level` fills empty. Only when no table exists does it create one with the default columns: unit, idea, role, levers, target success rate, brief link, data file. Explanation if the order is new or changed (docs Do step). |
| Docs check | 1 to 3 checks, up to 2 fixes | fixes only | One kind per page, titles, links (docs Check step). Each issue is `blocking` or `minor`. A check that finds only minor issues ends the loop: no fix step and no re-check run, and the issues go to the handoff `notes`. While a blocking issue remains, a fix step returns the pages it edited or added, and the next check reads every page touched so far, added pages included, and is given the last check's issues to confirm closed. An issue the fix step leaves for a content decision (its `left` list, each `{ page, problem, severity }`) keeps the severity of the issue it came from (a plain string counts as blocking) and is carried into the next check's list whatever the re-check says: a blocking one blocks, a minor one goes to the handoff notes. Every item left so far is also given to later re-checks to confirm. Up to three checks and two fixes; blocking issues left at the end give `docs missing` and skip the handoff, minor ones go to the handoff `notes`. |
| Handoff | 1 | commits only | Commits the briefs and docs on a feature branch, pushes, runs the docs checks the profile names on the pushed head. Runs when `status` is `done` or `open findings`; skipped when it is `docs missing`. Never opens or merges a PR. |

## Outputs

Object: `status` (`done`; `open findings` when blocking findings remain after the fourth check; `docs missing`; `blocked`), `briefs` (`unit`, `path`), `sequence` (markdown table), `open_items` (blocking findings still open after the last check, as `<unit>: <problem>` or the set finding), `minor_findings` (minor findings left unpolished because blocking ones are open), `resume` (how to close the open items: drop the keys of the last revision and check, `revise:3` and `check:4`, and every key after them from the run's `results`, and run again with the same args, so the last revision and check run again on the drafted set without redoing Plan, Sequence and Draft; `results` come back from a run started with `run: {}`), `notes` (Plan's non-blocking notes and Sequence's, the latter prefixed `sequence:`), `design_gaps` (`unit`, `problem`, `doc`: for the owner of the design docs), `pace` (briefs whose duration still does not fit the clock; each is also a design gap, since the clock, the pace or the goal sizes need a decision), `polished` (minor findings fixed in place), `docs` (`pages`, every page touched, `undocumented`), `doc_issues`, `next`, `handoff` (see below). Design gaps do not stop the run: the briefs follow the design docs as written, and `next` says to send the gaps to their owner. With `open findings` the briefs and docs are pushed and handed off too, and `next` says to close `open_items` with `resume` before the PR merges. When `done`, the briefs and docs are pushed on a branch; `next` says to ship them with engineering-practices `deliver-package` (or `land-pr` with no work package), then `author-level` per unit and `balance-pass` over the set. With `docs missing` they are left uncommitted.

## Stop conditions

| Condition | Result |
|---|---|
| Brief location not owned by the designer in the profile | `blocked` string; nothing written |
| Every unit in range already briefed | `nothing to do` string |
| Design docs leave an idea or the unit count open so no brief can be written | `{ status: 'blocked', gaps, notes }`; settle them with `design-feature` or `design-spec` first. Anything Plan can settle with a stated default is a note and does not block. |
| The set breaks the progression rules (Sequence `problems` not empty) | `{ status: 'blocked', problems, notes, design_gaps, sequence }`; Sequence notes and design gaps alone never block |
| The sequence leaves units out, or a draft returns nothing | `{ status: 'blocked' }` naming the units |
| A revision step returns nothing | `{ status: 'blocked', reason, findings, set_findings, sequence, briefs }` |
| Blocking findings remain after the fourth check (three revisions) | Runs on: writes, documents and hands off the set with `status: 'open findings'`, `open_items`, `minor_findings` and `resume`; `handoff.open_items` and `handoff.notes` carry them. Minor findings alone never make the status unclean. |
| The brief check returns nothing | `{ status: 'blocked', reason, findings, design_gaps, sequence, briefs, next }`; the set is unverified |
| Write step returns nothing | `{ status: 'blocked' }`; inspect the working tree |
| Handoff returns nothing or no branch, or the checks fail on the pushed head | `{ status: 'blocked', reason, briefs, sequence }` naming the problem |

## Handoff

`handoff` is the object engineering-practices
[deliver-package](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-deliver-package.md)
takes as `prior`, so pass the whole result and the set of briefs ships without
being written again: `from` (`game-designer:level-briefs`), `branch`, `pr`,
`head_sha`, `tests_pass`, `docs` (page paths), `undocumented`, `open_items` and `resume` (empty unless the status is `open findings`), `notes` (open findings, unpolished minor findings, planning notes, design gaps, pace misses, minor docs-check issues). `docs` includes the brief pages. With no
work package, land the branch with land-pr instead; `next` names both.
The handoff step never opens, marks ready or merges a PR.

Related: [How to write the briefs for a set of levels](../how-to/how-to-write-level-briefs.md), [author-level workflow](workflow-author-level.md), [level-design skill](skill-level-design.md), [reference index](index.md).

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `sequence`, `draft:<unit>`, `check:1`, then per round while blocking findings remain `revise:1`, `check:2`, `revise:2`, `check:3`, `revise:3`, `check:4`, then `polish` (only when minor findings are all that is left), `write`, `docs`, `docs-check`, then while issues remain `docs-fix`, `docs-recheck`, `docs-fix:2`, `docs-recheck:2` (the checks are read-only, the fixes are not independent), `handoff`.

Independent steps: every `check:<round>` step (read-only; each prompt says it changes no files), and `docs-check`, `docs-recheck`, `docs-recheck:2`. The `revise:<round>` and `polish` steps are not independent: they change the briefs. In inline mode these briefs come back marked `independent: true`; send them to a reviewer who did not write the briefs (the project's code-reviewer role, a fresh session or subagent) and name them in `run.reviewers`, or the run lists them under `self_reviewed` and you report them as self-reviewed.

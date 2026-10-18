# level-briefs workflow

*Reference for users of the game-designer plugin: arguments, phases and outputs of `level-briefs`.*

| Field | Value |
|---|---|
| Name | `level-briefs` |
| File | `workflows/level-briefs.js` |
| Invocation | `/game-designer:level-briefs` |
| Purpose | Write one brief per level or content unit for a set, from the progression and design docs, in the shape `author-level` checks for; check the set independently, revise and document it. |

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
`test`, `rest`), difficulty levers, first contact, and notes for the author.

## Phases

| Phase | Agents | Writes files | Does |
|---|---|---|---|
| Plan | 1 | no | Units in range and those already briefed; idea inventory with dependencies; brief location, ownership and format; targets; gaps; doc plan by Diataxis kind (docs Plan step). |
| Sequence | 1 | no | Gives each unit one idea, an arc role, a 1-10 difficulty and levers; checks one new idea per unit, dependency order and the sawtooth curve. |
| Draft | 1 per unit, parallel | no | Returns each unit's brief. |
| Check | 1 per round | no | Independent: a reviewer who did not write the briefs checks completeness, idea order, curve, targets and that no two units do the same job. |
| Revise | 1 per flagged unit per round | no | Redrafts only flagged units; up to two rounds, re-checking the whole set each time. |
| Write | 1 | briefs only | Writes the briefs in the project's format; no level data or targets. |
| Docs | 1 | yes | Progression table rows with brief links; explanation if the order is new or changed (docs Do step). |
| Docs check | 1 | fixes only | One kind per page, titles, links (docs Check step). |
| Handoff | 1 | commits only | Commits the briefs and docs on a feature branch, pushes, runs the docs checks the profile names on the pushed head. Skipped when `status` is `docs missing`. Never opens or merges a PR. |

## Outputs

Object: `status` (`done`, `docs missing`, `blocked`), `briefs` (`unit`, `path`), `sequence` (markdown table), `docs` (`pages`, `undocumented`), `doc_issues`, `next`, `handoff` (see below). When `done`, the briefs and docs are pushed on a branch; `next` says to ship them with engineering-practices `deliver-package` (or `land-pr` with no work package), then `author-level` per unit and `balance-pass` over the set. With `docs missing` they are left uncommitted.

## Stop conditions

| Condition | Result |
|---|---|
| Brief location not owned by the designer in the profile | `blocked` string; nothing written |
| Every unit in range already briefed | `nothing to do` string |
| Design docs leave an idea or the unit count open | `{ status: 'blocked', gaps }`; settle them with `design-feature` or `design-spec` first |
| The set breaks the progression rules | `{ status: 'blocked', problems, sequence }` |
| The sequence leaves units out, or a draft returns nothing | `{ status: 'blocked' }` naming the units |
| The check finds a problem no single brief can fix | `{ status: 'blocked', findings }` with the briefs |
| Briefs still flagged after two revisions | `{ status: 'blocked', findings }` with the briefs |
| Write step returns nothing | `{ status: 'blocked' }`; inspect the working tree |
| Handoff returns nothing or no branch, or the checks fail on the pushed head | `{ status: 'blocked', reason, briefs, sequence }` naming the problem |

## Handoff

`handoff` is the object engineering-practices
[deliver-package](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-deliver-package.md)
takes as `prior`, so pass the whole result and the set of briefs ships without
being written again: `from` (`game-designer:level-briefs`), `branch`, `pr`,
`head_sha`, `tests_pass`, `docs` (page paths), `undocumented`. `docs` includes the brief pages. With no
work package, land the branch with land-pr instead; `next` names both.
The handoff step never opens, marks ready or merges a PR.

Related: [How to write the briefs for a set of levels](../how-to/how-to-write-level-briefs.md), [author-level workflow](workflow-author-level.md), [level-design skill](skill-level-design.md), [reference index](index.md).

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `sequence`, `draft:<unit>`, `check:<round>`, `redraft:<unit>:<round>`, `write`, `docs`, `docs-check`, `docs-fix` and `docs-recheck` (only when the docs check finds problems; the check is read-only, the fix is not independent), `handoff`.

Independent steps: every `check:<round>` step, and `docs-check`, `docs-recheck`. In inline mode these briefs come back marked `independent: true`; send them to a reviewer who did not write the briefs (the project's code-reviewer role, a fresh session or subagent) and name them in `run.reviewers`, or the run lists them under `self_reviewed` and you report them as self-reviewed.

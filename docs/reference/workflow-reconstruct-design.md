# reconstruct-design workflow

*Reference for users of the game-designer plugin: arguments, phases and outputs of `reconstruct-design`.*

| Field | Value |
|---|---|
| Name | `reconstruct-design` |
| File | `workflows/reconstruct-design.js` |
| Invocation | `/game-designer:reconstruct-design` |
| Purpose | Reconstruct an existing game's design from public observation into a sourced, original rules spec and its docs. |

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `reference` | yes | string | Game title, version and platform. |
| `systems` | no | string[] | Systems to research. Default: mapped from full-session footage. |

Missing `reference` returns a usage string.

## Phases

| Phase | Agents | Writes files | Does |
|---|---|---|---|
| Plan | 1 | no | Scope, system map, spec and evidence paths, doc plan by kind (docs Plan step). |
| Observe | 1 per system, parallel | no | Evidence, measured values, inferred rules with tags, observation log. |
| Verify | 1 per system, parallel | no | Independent check of confirmed rules against cited evidence; flags copied passages. |
| Spec | 1 | yes | Writes spec and evidence log, applies downgrades and rewrites. |
| Docs | 1 | yes | Deviations explanation, sources/credits reference (docs Do step). |
| Docs check | 1 | fixes only | One kind per page, titles, links, no copied text (docs Check step). |
| Handoff | 1 | commits only | Commits the spec, evidence log and docs on a feature branch, pushes, runs the docs and provenance checks the profile names on the pushed head. Skipped when the docs step failed. Never opens or merges a PR. |

## Outputs

Object: `status` (`done`, `incomplete` when any system's research failed, or `docs missing`), `scope`, `spec`, `evidence`, `rule_counts`, `unverified_systems`, `failed_systems`, `docs` (`pages`, `undocumented`), `doc_issues`, `handoff` (see below), `next`.

## Stop conditions

| Condition | Result |
|---|---|
| Planning returns nothing | `reconstruct-design: planning failed.` |
| A system's research returns nothing | System listed as failed and open in the spec |
| A system's verifier returns nothing | System listed as unverified at the top of the spec |
| Spec writing returns nothing | `{ status: 'blocked' }` |
| Handoff returns nothing or no branch, or the checks fail on the pushed head | `{ status: 'blocked', reason, systems }` naming the problem |

## Handoff

`handoff` is the object engineering-practices
[deliver-package](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-deliver-package.md)
takes as `prior`, so pass the whole result and the reconstruction ships without
being researched again: `from` (`game-designer:reconstruct-design`), `branch`, `pr`,
`head_sha`, `tests_pass`, `docs` (page paths), `undocumented`, `notes`. `docs` includes the spec and evidence log; `notes` lists unverified and failed systems and docs-check issues. With no
work package, land the branch with land-pr instead; `next` names both.
The handoff step never opens, marks ready or merges a PR.

Related: [How to reconstruct a reference game](../how-to/how-to-reconstruct-a-reference-game.md), [reference index](index.md).

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `observe:<source>`, `verify:<system>`, `spec`, `docs`, `docs-check`, `docs-fix` and `docs-recheck` (only when the docs check finds problems; the check is read-only, the fix is not independent), `handoff`.

Independent steps: every `verify:<system>` step, and `docs-check`, `docs-recheck`. In inline mode these briefs come back marked `independent: true`; send them to a reviewer who did not do the work (the project's code-reviewer role, a fresh session or subagent) and name them in `run.reviewers`, or the run lists them under `self_reviewed` and you report them as self-reviewed.

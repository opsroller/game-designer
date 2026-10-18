# design-feature workflow

*Reference for users of the game-designer plugin: arguments, phases and outputs of `design-feature`.*

| Field | Value |
|---|---|
| Name | `design-feature` |
| File | `workflows/design-feature.js` |
| Invocation | `/game-designer:design-feature` |
| Purpose | Take a feature or system from experience goal to a reviewed, implementable and testable spec with its playtest plan and docs. |

## Arguments

| Arg | Required | Type | Meaning |
|---|---|---|---|
| `feature` | yes | string | What to design. |
| `goal` | no | string | Intended player experience. Default: the project's experience goals and pillars. |

Missing `feature` returns a usage string.

## Phases

| Phase | Agents | Writes files | Does |
|---|---|---|---|
| Frame | 1 | no | Problem statement, goals, systems, spec and decision paths, doc plan by Diataxis kind (docs Plan step). |
| Spec | 1 | yes | Reference spec (`design-spec`) and decision record (explanation). |
| Review | 3 in parallel | no | Implementer, tester and exploit-hunter list gaps. |
| Revise | 1 per round | yes | Closes gaps; up to 3 review rounds. |
| Playtest plan | 1 | yes | Plan per `playtesting`, filed as reference. |
| Docs | 1 | yes | Updates every planned page in the same change (docs Do step). |
| Docs check | 1 | fixes only | One kind per page, titles, opening line, links (docs Check step). |
| Handoff | 1 | commits only | Commits the spec, decision record, playtest plan and docs on a feature branch, pushes, runs the docs checks the profile names on the pushed head. Never opens or merges a PR. |

## Outputs

Object: `status` (`done`), `feature`, `spec`, `decision`, `playtest_plan`, `docs` (`pages`, `undocumented`), `doc_issues`, `handoff` (see below), `next`.

## Stop conditions

| Condition | Result |
|---|---|
| Framing returns nothing | `design-feature: framing failed` |
| Spec writing returns nothing | `design-feature: spec writing failed.` |
| Gaps remain after 3 rounds, or revision fails | `blocked` with the open gaps |
| A reviewer returns nothing | Recorded as an open gap: spec unverified from that angle |
| Docs step returns nothing | Failure message; the change is not done |
| Handoff returns nothing or no branch, or the checks fail on the pushed head | `design-feature: blocked; ...` string naming the problem |

## Handoff

`handoff` is the object engineering-practices
[deliver-package](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-deliver-package.md)
takes as `prior`, so pass the whole result and the spec ships without
being designed again: `from` (`game-designer:design-feature`), `branch`, `pr`,
`head_sha`, `tests_pass`, `docs` (page paths), `undocumented`, `notes`. `docs` includes the spec and decision record; `notes` lists a missing playtest plan and docs-check issues. With no
work package, land the branch with land-pr instead; `next` names both.
The handoff step never opens, marks ready or merges a PR.

Related: [How to design a feature](../how-to/how-to-design-a-feature.md), [reference index](index.md).

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `frame`, `spec`, `<reviewer>:<round>` (`implementer`, `tester`, `exploit`), `revise:<round>`, `playtest-plan`, `docs`, `docs-check`, `docs-fix` and `docs-recheck` (only when the docs check finds problems; the check is read-only, the fix is not independent), `handoff`.

Independent steps: every `<reviewer>:<round>` step, and `docs-check`, `docs-recheck`. In inline mode these briefs come back marked `independent: true`; send them to a reviewer who did not do the work (the project's code-reviewer role, a fresh session or subagent) and name them in `run.reviewers`, or the run lists them under `self_reviewed` and you report them as self-reviewed.

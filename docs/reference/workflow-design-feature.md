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

## Outputs

Object: `feature`, `spec`, `decision`, `playtest_plan`, `docs`, `doc_issues`.

## Stop conditions

| Condition | Result |
|---|---|
| Framing returns nothing | `design-feature: framing failed` |
| Spec writing returns nothing | `design-feature: spec writing failed.` |
| Gaps remain after 3 rounds, or revision fails | `blocked` with the open gaps |
| A reviewer returns nothing | Recorded as an open gap: spec unverified from that angle |
| Docs step returns nothing | Failure message; the change is not done |

Related: [How to design a feature](../how-to/how-to-design-a-feature.md), [reference index](index.md).

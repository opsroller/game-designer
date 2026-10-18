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

## Outputs

Object: `status`, `scope`, `spec`, `evidence`, `rule_counts`, `unverified_systems`, `failed_systems`, `docs`, `doc_issues`.

## Stop conditions

| Condition | Result |
|---|---|
| Planning returns nothing | `reconstruct-design: planning failed.` |
| A system's research returns nothing | System listed as failed and open in the spec |
| A system's verifier returns nothing | System listed as unverified at the top of the spec |
| Spec writing returns nothing | `{ status: 'blocked' }` |

Related: [How to reconstruct a reference game](../how-to/how-to-reconstruct-a-reference-game.md), [reference index](index.md).

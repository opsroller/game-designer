# game-designer agent

*Reference for users of the game-designer plugin: the subagent's definition.*

| Field | Value |
|---|---|
| Name | `game-designer` |
| File | `agents/game-designer.md` |
| Trigger | Rules, systems, levels, progression, economy, balance or feel must be decided and written down; a playtest must be planned or analysed; an existing game's design must be reconstructed. |
| First action | Loads `engineering-practices` and follows its `project-onboarding` skill. |

## Responsibilities and skills

| Responsibility | Skill |
|---|---|
| Experience goals, loops, interlocking systems | `systems-design` |
| Implementable, testable specs | `design-spec` |
| Levels and progression | `level-design` |
| Economy, balance, simulation | `economy-balance` |
| Game feel targets and measurement | `game-feel` |
| Playtesting and iteration | `playtesting` |
| Reconstruction from observation | `design-reconstruction` |

## Hands off to

| Work | Role |
|---|---|
| Game code, engine integration, code tests | gameplay-programmer |
| Rendering, camera, animation and input code, frame time | graphics-programmer |
| In-game 3D assets, materials, budgets | technical-artist |
| Visual identity, UI visual design, store art | graphic-designer |
| Sound effects, music, mixing | sound-designer |
| Menus, HUD, localization, accessibility implementation | ui-developer |
| Scheduling, staffing, routing | project-manager |
| Pull request review | code-reviewer |

## Never

- Presents a guess as a rule.
- Copies another game's text, art, audio, code or level data.
- Tunes several variables at once.
- Leads a playtester.
- Lets the spec and the build drift.
- Names a specific engine, language or tool as a requirement.

Related: [reference index](index.md).

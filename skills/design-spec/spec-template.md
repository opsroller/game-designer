# <System name> — rules reference

Reference for implementers and testers of <system>. Rationale: see
[About <topic>](../explanation/about-<topic>.md).

## Glossary

| Term | Meaning |
|---|---|
| <term> | <one definition> |

## Purpose

Serves experience goal: <goal>.

## State

| Variable | Type | Range | Start | Unit |
|---|---|---|---|---|
| stamina | integer | 0..100 | 100 | points |

## Rules

- **STAM-01** When the player sprints, stamina decreases by `sprint_cost` per second.
- **STAM-02** When stamina reaches 0, sprint ends and cannot restart until stamina ≥ `sprint_min`.
- **STAM-03** When not sprinting for `regen_delay`, stamina increases by `regen_rate` per second, up to max.

## Numbers

| Name | Value | Unit | Source / reason |
|---|---|---|---|
| sprint_cost | 20 | /s | 5 s of sprint from full [chosen] |
| sprint_min | 25 | points | prevents stutter-sprinting [verify] |
| regen_delay | 1.0 | s | |
| regen_rate | 25 | /s | full in 4 s |

## Edge cases

- Sprint pressed on the same tick stamina hits 0: STAM-02 applies first.
- Save and reload mid-regen: regen_delay restarts. [chosen]

## Interactions

- Reads: movement state. Changes: movement speed multiplier.

## Feedback

- Bar visible while < max; flashes at < `sprint_min`; breath audio at 0.

## Acceptance checks

| Rule | Given | When | Then |
|---|---|---|---|
| STAM-01 | stamina 100 | sprint 2.0 s | stamina 60 ±1 |
| STAM-02 | stamina 0 | press sprint | no sprint until stamina ≥ 25 |

## Open questions

- [open] Does stamina drain while airborne? Decides: game designer, before greybox.

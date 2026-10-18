# design-spec skill

*Reference for users of the game-designer plugin: what the `design-spec` skill covers and produces.*

| Field | Value |
|---|---|
| Name | `design-spec` |
| File | `skills/design-spec/SKILL.md` |
| Trigger | Use when writing or updating a rules spec or feature spec that a gameplay programmer must implement and QA must test, or when settling an open design question in writing. |
| Covers | Rules spec and feature spec template, organised by system. |

## Inputs

- Systems touched
- Experience goals
- Existing design docs

## Outputs

- Reference spec page per system: glossary, purpose, state, numbered rules, numbers, edge cases, interactions, feedback, acceptance checks, open questions
- Decision record (explanation) for non-obvious choices

## Supporting files

- [`spec-template.md`](../../skills/design-spec/spec-template.md): a filled example page

## Terms and values

- [verify]: believed, not yet confirmed; names what would confirm it
- [chosen]: deliberate decision without decisive evidence; one-line reason
- [open]: undecided; names owner and deadline

## Documentation owed

Reference (the spec); explanation (decision record); how-to (new authoring procedures).

Related: [reference index](index.md).

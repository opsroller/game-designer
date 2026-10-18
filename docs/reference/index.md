# Reference

*Reference landing page for users of the game-designer plugin.*

These pages describe the plugin's parts: what each is called, what it takes
and what it produces. They do not teach or argue; for that see the
[tutorial](../tutorials/first-task.md) and the
[explanation](../explanation/about-the-role.md).

## The agent

- [game-designer agent](agent.md): responsibilities, skill map, hand-offs, never-list.

## Skills

Designing:
- [systems-design](skill-systems-design.md): experience goals, loops, resources, feedback loops.
- [level-design](skill-level-design.md): progression, level briefs, levels as data.
- [game-feel](skill-game-feel.md): measurable feel targets.

Specifying and proving:
- [design-spec](skill-design-spec.md): rules and feature specs by system.
- [economy-balance](skill-economy-balance.md): targets, cost curves, simulation.
- [playtesting](skill-playtesting.md): question-led tests and iteration.

Matching an existing game:
- [design-reconstruction](skill-design-reconstruction.md): rules from observation, with evidence.

## Workflows

- [design-feature](workflow-design-feature.md): goal to reviewed spec, playtest plan and docs.
- [balance-pass](workflow-balance-pass.md): parallel simulation, curve fitting, data changes.
- [reconstruct-design](workflow-reconstruct-design.md): sourced reconstruction of a reference game.

## Plugin manifest

`.claude-plugin/plugin.json`:

| Field | Value |
|---|---|
| `name` | `game-designer` |
| `version` | `0.1.0` |
| `author.name` | `opsroller` |
| `repository` | `https://github.com/opsroller/game-designer` |
| `license` | `GPL-2.0-or-later` |
| `keywords` | `role`, `job-function`, `game-design`, `systems-design`, `level-design`, `balance`, `game-feel`, `playtesting` |

## Sources

The research behind the role: [SOURCES.md](../../SOURCES.md).

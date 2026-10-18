# Game Designer

Game designer: documents how a game plays, designs levels and progression, balances difficulty with simulation, and sets feel targets.

This plugin is a **job function**, not a project. It says how the job is done; the project it works on says with which tools, in its `CLAUDE.md` and project profile.

## Skills

| Skill | Use when |
|---|---|
| `rules-spec` | Use when writing or settling a game's rules spec, including researching how a reference game behaved. |
| `level-design` | Use when authoring levels, episodes or progression data. |
| `balance-simulation` | Use after writing or tuning content to check difficulty with automated play. |
| `game-feel` | Use when defining or reviewing how responsive, punchy and readable the game feels. |

## Workflows

Multi-agent workflows (Claude Code Workflow scripts in `workflows/`).

| Workflow | Does |
|---|---|
| `/game-designer:balance-levels` | Simulate a set of levels in parallel, compare to difficulty targets, and propose tuned values |

## Agent

`agents/game-designer.md` defines the role as a subagent.

## Install

```
/plugin marketplace add opsroller/claude-plugins
/plugin install game-designer@opsroller
```

Versioned on its own with semver tags (`v0.1.0`). Changes follow Conventional Commits.

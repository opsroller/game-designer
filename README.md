# Game designer

*Landing page for anyone installing or evaluating this role plugin.*

The game designer decides what a game should be, from the player's intended
experience inward, and writes it down so precisely that programmers can build
it and testers can check it. This plugin gives Claude that job: rules and
systems design, implementable and testable specs, level design and
progression, economy and balance with simulation, game feel, playtesting and
iteration, and faithful reconstruction of an existing game's design from
observation. It is a job function, not a project: the project you work on
names the engine, tools, paths and commands in its own `CLAUDE.md` and profile.

## Install

```
/plugin marketplace add opsroller/claude-plugins
/plugin install game-designer@opsroller
```

The role builds on `engineering-practices` (onboarding, git, provenance);
install that too.

## Where to go next

- **New to the plugin?** Start with the tutorial,
  [Design your first feature spec](docs/tutorials/first-task.md): one small
  system taken from goal to reviewed spec.
- **Getting a job done?** The how-to guides cover the role's real tasks:
  [design a feature](docs/how-to/how-to-design-a-feature.md),
  [author a level from a brief](docs/how-to/how-to-author-a-level.md),
  [run a balance pass](docs/how-to/how-to-run-a-balance-pass.md),
  [reconstruct a reference game](docs/how-to/how-to-reconstruct-a-reference-game.md),
  [run a playtest](docs/how-to/how-to-run-a-playtest.md) and
  [set feel targets](docs/how-to/how-to-set-feel-targets.md).
- **Looking something up?** The [reference index](docs/reference/index.md)
  describes the agent, each of the seven skills and the four workflows with
  their arguments, outputs and phases. Research sources are in
  [SOURCES.md](SOURCES.md).
- **Want to understand the job?** [About the game designer role](docs/explanation/about-the-role.md)
  covers what the job is, where it ends and neighbouring roles begin, its
  quality bars, and how it grows from junior to senior.

Versioned with semver tags; changes follow Conventional Commits.

## License

Copyright (C) 2026 Charles (opsroller) and contributors. Licensed under the GNU General Public License v2.0 or later (`GPL-2.0-or-later`); see `LICENSE`.

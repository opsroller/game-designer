# How to run a playtest

*How-to guide for designers testing a build with players, using the game-designer plugin.*

This guide shows you how to plan, run and analyse a playtest with the
`playtesting` skill.

## Steps

1. Ask the agent for a plan:

   ```
   Use the game-designer agent. Following the playtesting skill, plan a
   playtest of <build or feature>: questions tied to our experience goals,
   method per question, players, success criteria, and a neutral script.
   ```

2. Check every question has a success criterion written before the test.
3. Recruit players matching the audience. Use fresh players for anything
   about first-time understanding; teammates only for feel and bugs.
4. Run sessions with the script. Do not hint or explain; note timestamps.
   Switch telemetry on if the project has it.
5. Give the agent your notes, survey answers and telemetry, and ask it to
   synthesise them: issues rated by severity, frequency and goal impact, and
   a prediction for each proposed change.
6. Make the changes (spec first, then data), and schedule the next round.
   If you fixed issues between sessions, finish with several sessions without
   changes to verify.
7. File the one-page report in the project's playtest log and update the
   spec in the same pull request as the changes.

## See also

- [playtesting skill reference](../reference/skill-playtesting.md)

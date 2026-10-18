# How to set feel targets

*How-to guide for designers and programmers specifying or reviewing game feel with the game-designer plugin.*

This guide shows you how to turn "it should feel tight" into measurable
targets and check a build against them, with the `game-feel` skill.

## Steps

1. Ask for the feel table:

   ```
   Use the game-designer agent. Following the game-feel skill, write the
   feel table for <actions>: response times, durations, easing, buffers and
   grace windows, and feedback per event with tiers.
   ```

2. Check each motion is specified by what the player perceives (height,
   distance, time) and that every action has an input-to-response target.
3. Add the table to the project's reference docs and hand it to the
   graphics programmer and gameplay programmer.
4. To check a build, record play at a known frame rate and ask the agent to
   measure it by frame count against the table (the skill's feel-table
   reference has the method).
5. File each miss as a numeric delta ("landing recovery 0.30 s, target
   0.12 s") on the owning role's work item.
6. If you are matching a reference game, measure its footage the same way
   first and use those values as the targets.

## See also

- [game-feel skill reference](../reference/skill-game-feel.md)

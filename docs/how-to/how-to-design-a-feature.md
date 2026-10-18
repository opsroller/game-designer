# How to design a feature

*How-to guide for project leads and designers using the game-designer plugin.*

This guide shows you how to take a new mechanic, system or content type to a
reviewed, implementable spec with a playtest plan and its docs, using the
`design-feature` workflow.

## Before you start

- The project's `CLAUDE.md` or profile says where design docs live.
- Ideally the project has experience goals or pillars. If not, the workflow
  proposes some; agree them before implementation starts.

## Steps

1. Run the workflow with the feature and, if you have one, the intended
   experience:

   ```
   /game-designer:design-feature {"feature": "stamina for sprinting", "goal": "sprint is a tactical choice"}
   ```

2. Read the framing in the log. If the systems touched or the doc plan look
   wrong, stop and rerun with a sharper `feature` description.
3. Wait for the review rounds. Three reviewers (implementer, tester,
   exploit-hunter) read the spec in parallel; the designer closes their gaps,
   up to three rounds.
4. If the result says **blocked**, read the open gaps. Settle the design
   questions yourself or mark them **[open]** with an owner, then rerun.
5. On success, review the returned spec, decision record and playtest plan
   paths, then ship it: pass the whole result as `prior` to
   `/engineering-practices:deliver-package { wp: "<the package>", prior: <the result> }`
   for a work package, or land the branch with
   `/engineering-practices:land-pr { branch: "<handoff.branch>" }` otherwise.
   The workflow has already committed and pushed them on `handoff.branch`;
   do not rebuild it.
6. Hand the rule IDs listed in the hand-off note to the gameplay programmer.

## If you only want a spec quickly

Skip the workflow and ask the agent directly to follow the `design-spec`
skill. Run an implementer read-through before handing it off.

## See also

- [design-feature workflow reference](../reference/workflow-design-feature.md)
- [design-spec skill reference](../reference/skill-design-spec.md)
- [About the game designer role](../explanation/about-the-role.md)

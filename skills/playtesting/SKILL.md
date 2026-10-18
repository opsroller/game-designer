---
name: playtesting
description: Use when planning, running or analysing a playtest, turning player observations and telemetry into design changes, or deciding whether a change worked.
---

# Playtesting and iteration

A design is a hypothesis; a playtest is the experiment (Valve). The goal is
the intended experience, not bug hunting (that is QA) and not asking players
what to build (that is focus testing). Players know what they feel; they
often cannot say why. Watch what they do.

## Steps

1. **Questions first.** Write 1-5 questions this test must answer, each tied
   to an experience goal or a risk: "Do players find the second route without
   help?", "Is level 4 harder than level 5?". Write what result would mean
   success, before testing.
2. **Choose the method** for each question:

   | Question type | Method |
   |---|---|
   | Do they understand / where do they get stuck? | direct observation, optional think-aloud |
   | Why did they do that? | short post-session interview, neutral questions |
   | How hard/clear/fun did it feel, compared across levels? | survey with fixed rating scales |
   | How often / how long / where do they fail? | telemetry: deaths, time, retries, heatmaps |
   | Is variant A better than B? | design experiment: same task, two groups or orders |
   | Will it frustrate experts or newcomers? | recruit both; analyse separately |

3. **Recruit** the target audience, fresh players for first-time experience
   (each tester sees it fresh only once). Teammates are fine for feel and
   bugs, useless for learnability. 5-8 players per round find most large
   problems; more for surveys and numbers.
4. **Prepare**: a build that runs, a script (welcome, consent, "we are testing
   the game, not you", the tasks, the questions), an observation sheet with
   timestamps, telemetry switched on, recording if consented.
5. **Run without leading.** Do not help, hint, explain or defend. If asked,
   answer "What would you do if I weren't here?". Probe neutrally: "What are
   you thinking now?", "What did you expect to happen?". Minimise observers in
   the room; they bias play.
6. **Synthesise the same day.** For each observation: what happened, how
   many players, where (timestamp, level). Group into issues. Rate each issue:
   - severity: blocks progress / causes frustration or wrong understanding /
     minor friction;
   - frequency: how many of the players;
   - goal impact: which experience goal it damages.
7. **Decide changes.** Fix the cause, not the symptom (players stuck at a
   door may not understand the key, not the door). Prefer the smallest change.
   For each change write the prediction it should meet next round.
8. **Iterate.** RITE style when the build changes fast: fix a clear issue
   after the session that showed it, keep testing, then run several sessions
   with no changes to verify (about six change-free sessions is a reasonable
   stopping point; one is not). Otherwise rounds of ~5 with changes between.
9. **Report** in one page: questions, method, players, top issues by
   severity with evidence, decisions, predictions for next round.

## Neutral question bank

- "Tell me what's going on here." / "What is your goal right now?"
- "What did you expect to happen when you did that?"
- "How would you describe this game to a friend?"
- Rating: "How difficult was this level?" 1 (very easy) to 7 (very hard),
  asked the same way for every level.
Avoid: "Did you like the new jump?", "Was that too hard?", "Would you buy it?"

## Decision rules

- Behaviour beats opinion; numbers beat anecdotes; but one severe blocker
  seen once is still worth fixing if the cause is clear.
- Averages hide extremes: read the slowest and fastest players' sessions.
- A suggested fix from a player is a symptom report; the design fix is yours.
- Do not test what you are not ready to change.

## Checklist

- [ ] Questions and success criteria written before the session.
- [ ] Method per question; right players recruited.
- [ ] Script and observation sheet ready; telemetry on.
- [ ] No leading during sessions.
- [ ] Issues rated by severity, frequency, goal impact.
- [ ] Changes have predictions; next round scheduled.
- [ ] One-page report filed.

## Failure modes

- Testing with the team only; designer blindness confirmed, not challenged.
- Leading questions and helpful hints that invalidate the session.
- Collecting opinions about features instead of observing behaviour.
- Fixing everything at once so no change can be judged.
- Skipping verification after RITE changes (false confidence).

## Documentation owed

- The playtest report → reference (a dated record in the project's playtest log).
- Design changes it causes → updated spec (reference) and, for significant
  decisions, an explanation page.
- A repeatable test protocol → how-to ("How to run a playtest" in the project).

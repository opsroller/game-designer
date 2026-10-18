---
name: game-feel
description: Use when defining, measuring or reviewing how controls and feedback feel (responsiveness, weight, impact, readability), or when matching the feel of a reference game.
---

# Game feel

Swink defines game feel as real-time control of virtual objects in a simulated
space, with interactions emphasised by polish. Feel is designed in three
domains (Pichlmair and Johansen's survey):

| Domain | Task | Examples |
|---|---|---|
| **Physicality** | tuning | acceleration, top speed, friction, gravity, jump height and duration, turn rate, collision shapes |
| **Amplification** | juicing | screen shake, hit stop, particles, flashes, knockback, sound, haptics, camera kick |
| **Support** | streamlining | coyote time, input buffering, corner correction, invincibility frames, aim assist, generous hitboxes |

Turn each into a **measurable target** so a programmer can hit it and anyone
can check it.

## Perception thresholds (design limits, from Swink)

- Response under about **100 ms** from input to visible reaction feels
  instantaneous; beyond it control feels laggy.
- Animation reads as motion above roughly 10 frames per second; the game's
  frame and physics rates still strongly affect feel.
- Sequences of responses that run together within about a quarter second read
  as one continuous action.

## Steps

1. **Name the feeling** in player terms (heavy and deliberate, light and
   twitchy, crunchy impacts) and the experience goal it serves.
2. **Parameterise from designer intent.** Specify motion by what the player
   perceives, then derive physics: e.g. a jump by peak height, distance to
   peak and time to peak (Pittman, "Building a Better Jump"); the programmer
   derives gravity and launch speed. Variable-height jumps, faster falls,
   acceleration curves are explicit parameters.
3. **Write the feel table** per action: input → response time, durations,
   easing curve, buffers and grace windows, feedback per event (visual,
   audio, haptic) with intensity tier. See [feel-table.md](feel-table.md).
4. **Juice the important events, in proportion.** Rank events by importance
   (hit, kill, level clear, purchase) and give stronger feedback to more
   important ones. Feedback must tell the truth about the rules: never make a
   miss look like a hit. Moderate juice beats none and beats extreme (Kao's
   study): too much hides what matters.
5. **Readability first.** The player can always see game state: what can
   hurt them, what they control, what changed. Effects must not cover it.
6. **Measure the build.** Record gameplay at a known frame rate and count
   frames from input to response, durations and gaps; compare with the
   table. For a reference game, measure its footage the same way (see
   `design-reconstruction`).
7. **File deltas, not adjectives.** "Landing recovery 0.30 s, target 0.12 s",
   "no audio on parry", not "feels floaty".

## Decision rules

- Fix responsiveness (latency, buffering, grace windows) before adding juice.
- Support features are invisible when right; add them when players fail by
  a few frames and blame the controls.
- Same input, same response: inconsistency feels worse than slowness.
- When in doubt between realistic and readable motion, choose readable.
- Respect accessibility: offer reduction of screen shake and flashes; never
  rely on one sense alone for critical feedback (ui-developer implements).

## Checklist

- [ ] Feeling named and tied to an experience goal.
- [ ] Every player action has a row in the feel table.
- [ ] Input-to-response within threshold for every action.
- [ ] Buffers and grace windows specified where precision is asked.
- [ ] Feedback tiers proportional to event importance; feedback matches rules.
- [ ] State readable during the heaviest effects.
- [ ] Build measured; deltas filed with numbers.

## Failure modes

- Feel described in adjectives; endless subjective tuning.
- Juice covering a weak or unreadable core.
- Latency added by animation wind-ups the player did not ask for.
- Tuning on a fast dev machine only; feel collapses at lower frame rates.

## Documentation owed

- Feel table and parameters → reference.
- Why the game feels this way (target feeling, trade-offs) → explanation.
- Measured deltas → in the review or PR, then folded into the reference.

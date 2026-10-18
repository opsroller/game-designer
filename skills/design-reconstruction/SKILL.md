---
name: design-reconstruction
description: Use when remaking, porting or matching an existing game and its rules, numbers, levels and feel must be reconstructed faithfully from public observation (footage, manuals, guides, play), with every claim sourced.
---

# Design reconstruction

Reconstructing a design is reverse engineering by observation: you infer the
rules that produce what you see, then write them as an original spec. The
result must match the reference's behaviour, cite evidence for every claim,
and copy none of its protected expression.

## Boundaries (legal and provenance)

- Record **behaviour** (rules, timings, quantities, structure) in your own
  words. Rules and mechanics are ideas; text, art, audio, code, level files
  and trade dress are expression. Never copy those; never extract assets or
  data from the reference's files; never decompile.
- Name sources, not copied passages. Short factual quotes with citation only
  when wording itself is evidence.
- Follow the engineering-practices `provenance` skill for anything that
  enters the repo.

## Evidence ladder (strongest first)

1. Your own controlled observation of the original running (if you have
   legitimate access): repeatable, measurable.
2. Unedited gameplay footage at a known frame rate, with timestamps.
3. The official manual, in-game help, publisher descriptions.
4. Detailed walkthroughs, guides, wikis that show their evidence.
5. Reviews, forum posts, recollection: leads, not proof.

A rule is **confirmed** with two independent sources at levels 1-3, or one
level-1 observation repeated. Otherwise it stays **[verify]**.

## Steps

1. **Scope.** Which version, platform and mode are the reference? Versions
   differ; pick one and say so.
2. **System map.** Watch whole sessions first. List the systems you see (by
   state and what changes it; see `design-spec`) and the session structure.
3. **Observation log.** For each system, log observations: source, timestamp
   or page, what was seen, measured values. Use the log format in
   [observation-log.md](observation-log.md). Watch for edge cases: what
   happens at zero, at maximum, on simultaneous events, on failure.
4. **Measure.** Count frames for timings (see `game-feel` feel-table.md),
   count items and steps, note score deltas per event, tabulate per-level
   parameters (size, goals, limits, enemy sets). Repeat measurements; report
   median and range.
5. **Infer rules.** Write the simplest rule that explains all observations.
   Look for counter-examples; one counter-example breaks the rule.
   Predict a case you have not seen, then find footage of it.
6. **Reconcile.** Where sources disagree, prefer the stronger level; same
   level, prefer the measurable one. If still split or no evidence exists,
   choose the more playable option and mark **[chosen]** with a one-line
   reason. Never block on one unknown.
7. **Write the spec** (`design-spec`), every rule tagged confirmed (with
   source IDs), [verify] or [chosen]. Keep the observation log as the
   evidence appendix.
8. **Validate against the build.** Once implemented, compare side by side
   with the reference footage: same inputs, same situations; file deltas.

## Decision rules

- Faithful means same behaviour and feel, not same assets.
- Deliberate improvements (bug fixes, accessibility, modern controls) are
  allowed but recorded as **[chosen]** deviations with reason, so no one
  mistakes them for the original.
- When the reference has a bug that players rely on, decide explicitly and
  record it.

## Checklist

- [ ] Reference version and platform named.
- [ ] System map covers everything seen in full sessions.
- [ ] Every rule has evidence IDs or a [verify]/[chosen] tag.
- [ ] Timings measured with frame counts, repeated.
- [ ] No copied text, art, audio, code or data.
- [ ] Deviations listed with reasons.
- [ ] Side-by-side validation done after implementation.

## Failure modes

- Building from memory or a single video and calling it faithful.
- Copying wiki text into the spec (provenance problem and often wrong).
- Missing hidden rules (pity timers, rubber-banding, randomness with
  guarantees) because only typical play was watched.
- Mixing versions or platforms.

## Documentation owed

- The reconstructed rules spec → reference; the observation log → reference
  (evidence appendix); sources → the project's sources/credits page (reference).
- Deviations from the original and why → explanation.

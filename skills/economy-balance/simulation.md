# Balance simulation reference

Reference for the simulation part of `economy-balance`.

## What a balance simulator needs

| Part | Requirement |
|---|---|
| Rules | The same rules as the game, ideally the game's own logic run headless (ask the gameplay-programmer); a separate model must be checked against the build. |
| Content input | Loads the same level/content data files the game loads. |
| Seeds | One seed per run, recorded; same seed + same data = same result. |
| Strategies | At least three bots: **random** (legal moves only), **greedy** (best immediate gain), **goal-aware** (plans toward the win condition). Add a **cautious** or **exploit-seeking** bot when relevant. |
| Output | Per run: outcome, duration, margin, resources earned/spent, key events. Machine-readable (CSV or JSON). |
| Speed | Fast enough for hundreds of runs per content unit. |

## Run counts

Estimated success rate p from n runs has a standard error of about
sqrt(p(1-p)/n). For ±5% at 95% confidence near p = 0.5 you need about 400
runs; 100 runs gives about ±10%. Use more runs when comparing close variants.

## Reading results

| Signal | Meaning |
|---|---|
| Random bot succeeds often | Content barely asks anything of the player. |
| Goal-aware bot fails often | Too hard, or a rule bug; check a replay. |
| Big gap greedy vs goal-aware | Content rewards planning (good if intended). |
| Wide spread of margin | Outcome depends on luck. |
| One strategy wins everywhere | Dominant strategy; look at the cost curve. |
| Long-run resource totals grow without bound | Missing sink or runaway positive loop. |

## Summary table for a PR

| Unit | Difficulty | Strategy | Runs | Success | Margin (median, p10) | Target | Verdict |
|---|---|---|---|---|---|---|---|

Verdict is one of: too easy, on target, too hard.

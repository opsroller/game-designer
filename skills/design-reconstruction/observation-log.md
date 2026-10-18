# Observation log reference

One log per system. Each observation gets an ID that the spec cites.

## Sources table

| ID | Source | Level (1-5) | Version / platform | Notes |
|---|---|---|---|---|
| S1 | <video title, channel, URL> | 2 | <version> | 60 fps, unedited |
| S2 | <manual, page> | 3 | <version> | |

## Observations

| Obs | Source @ position | What was seen (own words) | Measured | Supports rule |
|---|---|---|---|---|
| O1 | S1 @ 12:04 | Player loses one life when the timer reaches zero | — | TIME-03 |
| O2 | S1 @ 12:30-12:41 | Respawn delay after losing a life | 94, 95, 94 frames @ 60 fps = 1.57 s | LIFE-02 |
| O3 | S2 p. 7 | Manual states three lives at start | — | LIFE-01 |

## Status per rule

| Rule | Status | Evidence | Note |
|---|---|---|---|
| LIFE-01 | confirmed | O3, O7 | |
| LIFE-02 | confirmed | O2 (repeated) | |
| TIME-04 | [verify] | O9 | one source only |
| SCORE-02 | [chosen] | — | no evidence; chose the value that keeps the curve smooth |

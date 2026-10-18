# Feel table reference

One row per player action or game event. Times in seconds (or frames at a
stated rate). Examples are neutral placeholders.

| Action / event | Input → response | Duration | Easing | Buffer / grace | Visual | Audio | Haptic | Tier |
|---|---|---|---|---|---|---|---|---|
| Jump | ≤ 0.05 s | rise 0.35 s, fall 0.25 s | ease-out up, ease-in down | buffer 0.10 s, coyote 0.08 s | squash on take-off | jump cue | — | 2 |
| Light hit landed | ≤ 0.05 s | hit stop 0.04 s | — | — | flash 1 frame, small particles | hit cue | short pulse | 2 |
| Menu confirm | ≤ 0.05 s | 0.15 s | ease-out | — | button press state | confirm cue | — | 1 |
| Goal completed | — | 1.2 s | ease-in-out | — | celebration effect | fanfare | long pulse | 4 |

## Tiers

| Tier | Use for | Strength |
|---|---|---|
| 1 | UI and routine actions | subtle, never interrupts |
| 2 | Core loop actions | clear, short |
| 3 | Significant outcomes (defeat an enemy, large reward) | strong, may briefly pause |
| 4 | Milestones (level or run end) | full, may take control briefly |

## Measuring footage

1. Record at a known, constant frame rate (60 fps or higher).
2. Find the input frame (input display, button sound, or first frame of the
   avatar's reaction minus the known latency of the setup).
3. Count frames to the event; time = frames / fps. Repeat ≥ 5 times; report
   median and range.
4. Note the capture setup's own latency; compare like with like.

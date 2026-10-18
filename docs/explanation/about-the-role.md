# About the game designer role

*Explanation for anyone deciding how to use, staff or extend the game-designer role: what the job is and why the plugin works the way it does.*

## What the job is

O*NET's task list for video game designers runs from creating core
features (mechanics, story, characters) and designing missions, challenges
and puzzles, through maintaining design documentation and holding design
reviews, to overseeing playtests and giving test specifications to QA. In practice the job splits into two halves that never
separate. One half decides: what the player should experience, which rules
and systems produce it, which numbers make it work. The other half proves
and communicates: writing it down so others can build it, then testing with
simulations and players until the game does what the design intended.

Job postings from studios of very different sizes agree on the core:
systems and progression design, balance (usually in spreadsheets, often
with simulation), documentation that engineers and artists can implement
from, prototyping, and turning playtest results into changes. They differ
on specialisation (systems, level, combat, economy, narrative, UX
designer) and on how much the designer implements directly in the
project's tools.

This plugin covers the generalist core with an emphasis on systems, levels,
balance and feel. Narrative design and UX design are related specialisms
it touches but does not try to replace.

## Why design starts from experience

The MDA framework explains the central difficulty: designers only control
mechanics, players only feel aesthetics, and between them sit dynamics,
the behaviour that emerges when people play. A feature list cannot predict
what players will do with it. That is why the plugin's skills start from
experience goals (Schell's "think about the player's experience, not the
game"), predict dynamics explicitly, and treat every design as a hypothesis
for a simulation or playtest to confirm, as Valve describes its process.

## Why specs are reference, and rationale is explanation

A spec has two readers with different needs. The gameplay programmer and
the tester consult it mid-work and need facts: state, rules, numbers, edge
cases, checks. People revisiting a decision need context: what was
considered and why one option won. Mixing the two is the usual reason
design documents are unread or re-argued. Following Diataxis, the plugin
keeps the spec as austere reference organised by the game's own systems,
and puts the reasoning in explanation pages written like architecture
decision records. Stone Librande's argument for one-page designs points
the same way: a design document's job is to communicate efficiently, not
to be complete in one place.

Organising by system rather than by a template has a practical reason too:
games differ. A fixed outline drawn from one genre leaves the real systems
of another game undocumented.

## Why numbers, simulation and playtests all appear

Schreiber names three ways to balance: mathematics, instinct and
playtesting. Each fails alone. Math is fast but only as good as its model;
instinct is unreliable and biased toward the designer's own skill;
playtests are slow and noisy. The plugin pairs them: targets and cost
curves first, simulated play with several bot strategies to find the shape
of the difficulty curve cheaply, then players to judge whether it feels
right. Changing one variable at a time is slower per step but the only way
to learn which change worked.

Playtesting follows games user research practice: questions before
sessions, observation over opinion (players know what they feel, rarely
why), neutral facilitation, and RITE-style iteration with a verification
step, because fixing between sessions without verifying gives false
confidence.

## Why feel is a table of numbers

"Tight", "floaty" and "punchy" cannot be implemented or checked. Swink
showed that feel can be described by measurable properties of response,
motion and polish, and later work split it into tuning, juicing and
streamlining. Writing feel as targets (response times, curves, buffers,
feedback tiers) lets the graphics and gameplay programmers hit them and
lets anyone measure a build or a reference game by counting frames.

## Why reconstruction has its own discipline

Remaking or matching an existing game is common: ports, remasters,
remakes and spiritual successors. Doing it
faithfully means inferring hidden rules from behaviour, which invites two
failures: confident guesses and copied expression. The evidence ladder and
certainty tags make guesses visible; recording behaviour in one's own words,
never extracting assets or data, keeps the work original. Rules and
mechanics are ideas; the text, art, audio, code and level files that
express them are not free to take.

## Boundaries with neighbouring roles

The designer decides what the game does and how it should feel; others
decide how it is built. The gameplay programmer owns game code and its
tests, implementing from the designer's spec. The graphics programmer owns
rendering, camera, animation and input code and hits the designer's feel
targets. The technical artist and graphic designer own the visual work; the
designer specifies what the player must be able to read. The sound designer
creates the audio the designer's feedback tiers call for. The ui-developer
implements menus and HUD from the designer's information requirements. The
project manager decides when work happens and who does it. Data files the
project profile assigns to the designer (levels, tuning tables) are the one
place the designer edits the build directly.

## Quality bars, and their trade-offs

The plugin's bar is that a spec draws zero questions from its implementer,
that every number has a reason, and that no content ships unsimulated or
unplayed. This costs time up front. The alternative costs more later:
programmers guessing, testers unable to say whether something is a bug,
and balance fixed level by level instead of at the curve or rule behind it.

## How the role grows

Career ladders across studios share a shape. A junior designer executes
within an existing direction: building levels or content, contributing to
specs, running tests. A mid-level designer owns a system or content area
end to end and has a specialisation. A senior designer owns major systems
(the core loop, the progression economy), sets quality standards for their
area and mentors. Leads add people management and represent design to other
disciplines; principal designers raise the bar across teams without direct
authority; design and creative directors hold the coherence of a whole
game or franchise. The plugin's skills are the same at every level; what
grows is the scope a designer can hold in their head and the judgement to
know which question the next prototype should answer.

// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'author-level',
  description: 'Turn an already-designed level or content brief into a data file in the project\'s format, validate it with the project\'s schema or loader, check it against the brief with a fresh reviewer and the simulator, revise, and document it. Use when the design is settled and the content must be built. args: { brief: "<brief page or the brief text>", output: "<data file path, optional>", sequence: "<progression page, optional>" }',
  phases: [
    { title: 'Plan', detail: 'brief complete, format, validator, simulator, owned path, doc kinds via the compass' },
    { title: 'Author', detail: 'critical path first, data only, fixed seed' },
    { title: 'Validate', detail: 'schema or parser, then load; fix until clean' },
    { title: 'Check', detail: 'fresh read against the brief and simulation, in parallel' },
    { title: 'Revise', detail: 'smallest data change per finding, re-validate, up to two rounds' },
    { title: 'Docs', detail: 'progression entry and any format or procedure change' },
    { title: 'Docs check', detail: 'one kind per page, titles, links' },
  ],
}

const brief = args && args.brief
if (!brief) return 'Usage: author-level with args { brief: "<brief page or the brief text>", output: "<data file path, optional>", sequence: "<progression page, optional>" }'
const output = (args && args.output) || 'the path the project profile gives for level or content data, one file per unit'
const sequence = (args && args.sequence) || 'the progression table in the project design docs, if one exists'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs/<kind>/ (per its profile), keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = { type: 'object', properties: {
  brief_complete: { type: 'boolean' }, brief_missing: { type: 'array', items: { type: 'string' } },
  brief_summary: { type: 'string' },
  output_path: { type: 'string' }, owned: { type: 'boolean' },
  format: { type: 'string' }, example: { type: 'string' },
  validate_cmd: { type: 'string' }, load_cmd: { type: 'string' },
  simulator: { type: 'string' }, targets: { type: 'string' },
  sequence_issues: { type: 'array', items: { type: 'string' } },
  doc_plan: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] }, page: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'page'] } },
}, required: ['brief_complete', 'output_path', 'owned', 'format', 'validate_cmd', 'simulator', 'doc_plan'] }
const VALID = { type: 'object', properties: {
  ok: { type: 'boolean' }, ran: { type: 'array', items: { type: 'string' } },
  errors: { type: 'array', items: { type: 'string' } },
}, required: ['ok', 'ran', 'errors'] }
const FINDINGS = { type: 'object', properties: {
  verdict: { type: 'string', enum: ['matches brief', 'off brief', 'too easy', 'on target', 'too hard', 'not run'] },
  findings: { type: 'array', items: { type: 'string' } }, table: { type: 'string' },
}, required: ['verdict', 'findings'] }

phase('Plan')
const p = await agent(`You are the game designer. Following the game-designer level-design skill, read this brief and the project profile, design docs and existing level or content data. Brief: ${brief}
Do not design anything new and do not edit files. Report:
- brief_complete: the brief states the idea it teaches or tests, the intended feeling, target duration, target success rate and what the player knows afterwards; list anything missing in brief_missing. A layout sketch or critical path is welcome but not required.
- brief_summary: those five points in one line each.
- output_path: where the data file goes (${output}); owned: whether the project profile gives the game designer that path.
- format: the data format and its schema, parser or loader (file and symbol), and example: the path of the closest existing data file to copy the shape from.
- validate_cmd: the command that checks a data file against its schema or parser without the full game (empty if none exists); load_cmd: the command or test that loads it in the build or a headless run (empty if none).
- simulator: the command that plays the content headless with bots (empty if none); targets: the balance targets page for this unit (empty if none).
- sequence_issues: read ${sequence}; list breaks of the progression rules if this unit goes where the brief says (more than one new idea, an idea used before it is taught, two maximum spikes in a row). Empty if fine or no table exists.
- doc_plan: Diataxis kind and page for each doc this change touches (the progression table and data format are reference; why the order is so is explanation; how to add a level is how-to, only if the procedure changes).`, { schema: PLAN, phase: 'Plan', label: 'plan' })
if (!p) return 'author-level: planning failed; nothing written.'
if (!p.brief_complete) return `author-level: blocked; the brief is not finished. Missing:\n- ${(p.brief_missing || []).join('\n- ')}\nFinish it with the level-design skill (or the design-feature workflow for a new mechanic) first.`
if (!p.owned) return `author-level: blocked; ${p.output_path} is not a path the project profile gives the game designer. Hand the brief to its owner or get the profile changed.`
if (!p.format) return 'author-level: blocked; no level or content data format found. A gameplay programmer must define the format and its loader first (data, not code).'

phase('Author')
const written = await agent(`Following the game-designer level-design skill ("Designing one level"), build this unit as data at ${p.output_path} in the project's format (${p.format}), shaped like ${p.example || 'the format reference'}. Brief:\n${p.brief_summary}\nFull brief: ${brief}
Rules: lay the critical path first, then alternatives, secrets and rests; put the goal, or a lead toward it, where the player sees it early; make first contact with the new idea safe; give any randomness a fixed, recorded seed; write data only (no code, no new fields the format does not define: if the brief needs one, stop and list it for the format's owner); use only the project's own content, never another game's level data. Return the path written and, in one line each, where the critical path, the first sight of the goal and the safe first contact are in the data.`, { phase: 'Author', label: 'author' })
if (!written) return 'author-level: authoring failed; inspect the working tree.'

const validate = (round) => agent(`Validate ${p.output_path}. Run ${p.validate_cmd || 'the project\'s schema or parser check (none was found: say so)'}${p.load_cmd ? `, then ${p.load_cmd}` : ''}. If a command fails on this file, fix the data (never the validator, loader or tests: those belong to their owners) and run it again, up to three times. Return ok only if every command ran and passed, the commands run, and errors still open.`, { schema: VALID, phase: 'Validate', label: `validate:${round}` })

phase('Validate')
let v = await validate(0)
if (!v) return { status: 'blocked', reason: 'validation step did not return', file: p.output_path }
if (!p.validate_cmd && !p.load_cmd) log('no validator or loader found; the file is unvalidated and listed for the gameplay programmer')
if (!v.ok && (p.validate_cmd || p.load_cmd)) return { status: 'blocked', reason: 'data does not validate', file: p.output_path, errors: v.errors }

const checks = [
  ['brief', () => agent(`You did not write this level and must not assume its intent beyond the brief. Following the game-designer level-design skill, read ${p.output_path} and this brief:\n${p.brief_summary}
Walk the critical path in the data as a first-time player would. Report off brief if any of these fail, with the location in the data: it teaches or tests only the brief's idea; that idea's first contact is safe; the goal or a lead toward it is visible early; the player can tell what killed them; it is solvable as written; difficulty comes from the brief's levers, not from obscurity (hidden rules, unreadable space). Do not edit files.`, { schema: FINDINGS, phase: 'Check', label: 'check:brief' })],
  ['sim', () => p.simulator
    ? agent(`Following the game-designer economy-balance skill and its simulation.md reference, run ${p.simulator} on ${p.output_path} for every difficulty with random, greedy and goal-aware strategies, fixed recorded seeds. Compare with ${p.targets || 'the brief\'s target success rate and duration'}. Do not edit files. Return the summary table as markdown, a verdict (too easy, on target, too hard) and, if off target, the smallest data change that fixes it.`, { schema: FINDINGS, phase: 'Check', label: 'check:sim' })
    : Promise.resolve({ verdict: 'not run', findings: ['no simulator: solvability and difficulty rest on the fresh read and a playtest'] })],
]

let brief_check = null
let sim = null
for (let round = 0; round <= 2; round++) {
  phase(round === 0 ? 'Check' : 'Revise')
  const r = await parallel(checks.map(([, run]) => run))
  brief_check = r[0] || { verdict: 'not run', findings: ['brief check did not return; unverified'] }
  sim = r[1] || { verdict: 'not run', findings: ['simulation did not return; unverified'] }
  const open = [
    ...(brief_check.verdict === 'off brief' ? brief_check.findings : []),
    ...(['too easy', 'too hard'].includes(sim.verdict) ? sim.findings : []),
  ]
  if (!open.length) break
  log(`round ${round}: ${open.length} findings`)
  if (round === 2) return { status: 'blocked', reason: 'still off brief or off target after two revisions', file: p.output_path, findings: open, simulation: sim.table || '' }
  const fixed = await agent(`Following the game-designer level-design skill's decision rules (fix readability before numbers; add thinking before speed; one variable per change where possible), make the smallest data change to ${p.output_path} that closes these findings. Data only; the brief stays as it is. If a finding needs the brief itself to change, do not edit: say so.\n- ${open.join('\n- ')}\nReturn what changed.`, { phase: 'Revise', label: `revise:${round + 1}` })
  if (!fixed) return { status: 'blocked', reason: 'revision failed', file: p.output_path, findings: open }
  v = await validate(round + 1)
  if (!v) return { status: 'blocked', reason: 'validation step did not return after revision', file: p.output_path }
  if ((p.validate_cmd || p.load_cmd) && !v.ok) return { status: 'blocked', reason: 'revision broke validation', file: p.output_path, errors: v.errors }
}

phase('Docs')
const docs = await agent(`${DOCS_FRAGMENT}\nPlanned pages: ${JSON.stringify(p.doc_plan)}. Add or update this unit's row in the progression table (unit, idea, levers, target success rate, file), recording ${p.output_path} and its seed. Update the data format reference only if the format changed, the how-to for adding a level only if the procedure changed, and the explanation only if the order or curve changed.${sim && sim.table ? `\nLatest simulation table:\n${sim.table}` : ''}\nProgression issues found at planning: ${JSON.stringify(p.sequence_issues || [])}`, { phase: 'Docs', label: 'docs' })
if (!docs) return { status: 'docs missing', file: p.output_path, reason: 'the change is not done until its docs are written' }

phase('Docs check')
const check = await agent(`Review the documentation pages touched for ${p.output_path} (${docs}). Each page holds one Diataxis kind (reference describes, explanation holds the why, how-to titles name a goal), opens with a line naming its kind and audience, and links the related pages. Fix what you can; return remaining issues as findings with verdict "not run".`, { schema: FINDINGS, phase: 'Docs check', label: 'docs-check' })

const unverified = []
if (!v.ok) unverified.push('no validator or loader: file not machine-checked')
if (sim.verdict === 'not run') unverified.push(...sim.findings)
if (brief_check.verdict === 'not run') unverified.push(...brief_check.findings)

return {
  status: unverified.length ? 'incomplete' : 'done',
  file: p.output_path,
  validation: v,
  brief_check: brief_check.findings,
  simulation: sim.table || sim.verdict,
  sequence_issues: p.sequence_issues || [],
  unverified,
  next: 'playtest the unit with players who have not seen it (game-designer playtesting skill); simulation confirms numbers, not feeling',
  docs,
  doc_issues: check ? check.findings : ['docs check did not run; docs unverified'],
}

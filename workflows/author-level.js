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

// --- run-modes v1 begin ---
const RUN = ((a, realAgent, realPhase, realLog) => {
  const opted = !!(a && typeof a === 'object' && a.run && typeof a.run === 'object')
  const c = opted ? a.run : {}
  const mode = c.mode === 'inline' ? 'inline' : 'agents'
  const results = c.results && typeof c.results === 'object' ? c.results : {}
  const only = Array.isArray(c.only) && c.only.length ? c.only.map(String) : null
  const from = c.from ? String(c.from) : null
  const titles = typeof meta !== 'undefined' && meta && Array.isArray(meta.phases) ? meta.phases.map((p) => p.title) : []
  const unknown = titles.length ? (from ? [from] : []).filter((t) => !titles.includes(t)) : []
  const error = c.mode && !['agents', 'inline'].includes(c.mode)
    ? `run.mode must be "agents" or "inline", got "${c.mode}"`
    : unknown.length ? `run.from names no phase: ${unknown.join(', ')}. Phases: ${titles.join(', ')}` : null
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
  // An answer must carry every required key of its schema, as the runtime
  // enforces for agents; returns the missing keys, or null when it fits.
  const missing = (v, schema) => {
    if (v === null || v === undefined) return 'an answer'
    if (!schema || schema.type !== 'object') return null
    if (typeof v !== 'object' || Array.isArray(v)) return 'a JSON object'
    const gap = (schema.required || []).filter((k) => !has(v, k) || v[k] === undefined)
    return gap.length ? gap.join(', ') : null
  }
  const seen = {}
  const out = {}
  const skipped = []
  const next = []
  const logs = []
  let current = ''
  let reached = !from
  let halting = false
  let release = () => {}
  const halted = new Promise((r) => { release = r })
  const picked = (ph, label) => reached && (!only || only.some((s) => s === ph || s === label || label.startsWith(s + ':')))
  const agent = (prompt, opts) => {
    const op = opts || {}
    const ph = op.phase || current
    const base = op.label || ph || 'agent'
    seen[base] = (seen[base] || 0) + 1
    const key = seen[base] > 1 ? `${base}#${seen[base]}` : base
    let note = null
    if (has(results, key)) {
      const gap = missing(results[key], op.schema)
      if (!gap) { out[key] = results[key]; return Promise.resolve(results[key]) }
      note = `answer missing ${gap}; answer this brief again`
    }
    if (!picked(ph, base)) { skipped.push(key); return Promise.resolve(null) }
    if (mode === 'agents') {
      return realAgent(prompt, opts).then((r) => { if (r !== null && r !== undefined) out[key] = r; return r })
    }
    next.push(note ? { key, phase: ph, prompt, schema: op.schema || null, note } : { key, phase: ph, prompt, schema: op.schema || null })
    if (!halting) {
      halting = true
      // Wait 200 microtask turns before pausing, so every sibling in a
      // parallel() or pipeline() fan-out queues its brief into this pause.
      ;(async () => { for (let i = 0; i < 200; i++) await null; release('__run_halted__') })()
    }
    return new Promise(() => {})
  }
  const phase = (t) => { current = t; if (from && t === from) reached = true; return realPhase(t) }
  const log = (m) => { logs.push(String(m)); return realLog(m) }
  const finish = (value) => {
    if (!opted) return value
    if (value === '__run_halted__') {
      return {
        run: 'inline', status: 'next', next, results: out, skipped, logs,
        how: 'Do each brief in next yourself, in order: follow its prompt in this session (it may tell you to edit files, commit or push), and shape your answer to its schema when one is given, with every required field. A brief with a note was answered before without the fields it names. Add each answer to results under its key, then run this workflow again with the same args and run.results set to the merged results. Repeat until status is "done".',
      }
    }
    return { run: mode, status: 'done', result: value, results: out, skipped, logs }
  }
  return { agent, phase, log, finish, halted, error }
})(typeof args === 'undefined' ? undefined : args, agent, phase, log)
if (RUN.error) return RUN.error
const RUN_OUT = await Promise.race([RUN.halted, (async (agent, phase, log) => {
// --- run-modes v1 end (workflow body follows; close it with the tail line) ---

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

const cmds = [p.validate_cmd, p.load_cmd].filter(Boolean)
const missing = [!p.validate_cmd && 'no schema or parser validator', !p.load_cmd && 'no loader or load test'].filter(Boolean)
const validate = (round) => cmds.length
  ? agent(`Validate ${p.output_path}. Run, in order: ${cmds.join(', then ')}. If a command fails on this file, fix the data (never the validator, loader or tests: those belong to their owners) and run it again, up to three times. Return ok only if every listed command ran and passed, the commands run, and errors still open.`, { schema: VALID, phase: 'Validate', label: `validate:${round}` })
  : Promise.resolve({ ok: true, ran: [], errors: [] })

phase('Validate')
if (missing.length) log(`${missing.join(' and ')}; listed as unverified for the gameplay programmer`)
let v = await validate(0)
if (!v) return { status: 'blocked', reason: 'validation step did not return', file: p.output_path }
if (!v.ok) return { status: 'blocked', reason: 'data does not validate', file: p.output_path, errors: v.errors }

const checks = [
  ['brief', () => agent(`You did not write this level and must not assume its intent beyond the brief. Following the game-designer level-design skill, read ${p.output_path} and this brief:\n${p.brief_summary}
Walk the critical path in the data as a first-time player would. Report off brief if any of these fail, with the location in the data: it teaches or tests only the brief's idea; that idea's first contact is safe; the goal or a lead toward it is visible early; the player can tell what killed them; it is solvable as written; difficulty comes from the brief's levers, not from obscurity (hidden rules, unreadable space). Do not edit files.`, { schema: FINDINGS, phase: 'Check', label: 'check:brief' })],
  ['sim', () => p.simulator
    ? agent(`Following the game-designer economy-balance skill and its simulation.md reference, run ${p.simulator} on ${p.output_path} for every difficulty with random, greedy and goal-aware strategies, fixed recorded seeds. Compare with ${p.targets || 'the brief\'s target success rate and duration'}. Do not edit files. Return the summary table as markdown, a verdict (too easy, on target, too hard) and, if off target, the smallest data change that fixes it.`, { schema: FINDINGS, phase: 'Check', label: 'check:sim' })
    : Promise.resolve({ verdict: 'not run', findings: ['no simulator: solvability and difficulty rest on the fresh read and a playtest'] })],
]

const failing = { brief: c => c.verdict === 'off brief', sim: c => ['too easy', 'too hard'].includes(c.verdict) }
const results = {}
let pending = checks
for (let round = 0; round <= 2; round++) {
  if (round === 0) phase('Check')
  const r = await parallel(pending.map(([, run]) => run))
  pending.forEach(([name], i) => { results[name] = r[i] || { verdict: 'not run', findings: [`${name} check did not return; unverified`] } })
  pending = checks.filter(([name]) => failing[name](results[name]))
  const open = pending.flatMap(([name]) => results[name].findings)
  if (!open.length) break
  log(`round ${round}: ${open.length} findings`)
  if (round === 2) return { status: 'blocked', reason: 'still off brief or off target after two revisions', file: p.output_path, findings: open, simulation: results.sim.table || '' }
  phase('Revise')
  const fixed = await agent(`Following the game-designer level-design skill's decision rules (fix readability before numbers; add thinking before speed; one variable per change where possible), make the smallest data change to ${p.output_path} that closes these findings. Data only; the brief stays as it is. If a finding needs the brief itself to change, do not edit: say so.\n- ${open.join('\n- ')}\nReturn what changed.`, { phase: 'Revise', label: `revise:${round + 1}` })
  if (!fixed) return { status: 'blocked', reason: 'revision failed', file: p.output_path, findings: open }
  v = await validate(round + 1)
  if (!v) return { status: 'blocked', reason: 'validation step did not return after revision', file: p.output_path }
  if (!v.ok) return { status: 'blocked', reason: 'revision broke validation', file: p.output_path, errors: v.errors }
}
const brief_check = results.brief
const sim = results.sim

phase('Docs')
const docs = await agent(`${DOCS_FRAGMENT}\nPlanned pages: ${JSON.stringify(p.doc_plan)}. Add or update this unit's row in the progression table (unit, idea, levers, target success rate, file), recording ${p.output_path} and its seed. Update the data format reference only if the format changed, the how-to for adding a level only if the procedure changed, and the explanation only if the order or curve changed.${sim && sim.table ? `\nLatest simulation table:\n${sim.table}` : ''}\nProgression issues found at planning: ${JSON.stringify(p.sequence_issues || [])}`, { phase: 'Docs', label: 'docs' })
if (!docs) return { status: 'docs missing', file: p.output_path, reason: 'the change is not done until its docs are written' }

phase('Docs check')
const check = await agent(`Review the documentation pages touched for ${p.output_path} (${docs}). Each page holds one Diataxis kind (reference describes, explanation holds the why, how-to titles name a goal), opens with a line naming its kind and audience, and links the related pages. Fix what you can; return remaining issues as findings with verdict "not run".`, { schema: FINDINGS, phase: 'Docs check', label: 'docs-check' })

const unverified = missing.map(m => `${m}: file not fully machine-checked`)
if (sim.verdict === 'not run') unverified.push(...sim.findings)
if (brief_check.verdict === 'not run') unverified.push(...brief_check.findings)

const docIssues = check ? check.findings : ['docs check did not run; docs unverified']

return {
  status: docIssues.length ? 'docs missing' : unverified.length ? 'incomplete' : 'done',
  file: p.output_path,
  validation: v,
  brief_check: brief_check.findings,
  simulation: sim.table || sim.verdict,
  sequence_issues: p.sequence_issues || [],
  unverified,
  next: 'playtest the unit with players who have not seen it (game-designer playtesting skill); simulation confirms numbers, not feeling',
  docs,
  doc_issues: docIssues,
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)

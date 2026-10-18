// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'author-level',
  description: 'Turn an already-designed level or content brief into a data file in the project\'s format, validate it with the project\'s schema or loader, converge any data value a checker prints (set it, re-run, repeat until stable, bounded rounds), check it against the brief with a fresh reviewer and the simulator, revise, and document it. Takes one brief, or a set of briefs authored together (each unit planned, authored and validated on its own, one reviewer brief-checking every unit, the simulation run once over the set, one docs pass and one handoff); with set_design: true the set is designed, authored and revised as a whole by one step. Use when the design is settled and the content must be built. args: { brief: "<brief page or the brief text>", output: "<data file path, optional>", sequence: "<progression page, optional>" } or { briefs: ["<brief page or text>", ...] (in play order; replaces brief), output: "<data directory, optional>", sequence: "<progression page, optional>", set_design: true|false (default false) }',
  phases: [
    { title: 'Plan', detail: 'brief complete, format, validator, simulator, owned path, doc kinds via the compass; per unit in a set' },
    { title: 'Author', detail: 'critical path first, data only, fixed seed; per unit in a set, or the whole set at once with set_design' },
    { title: 'Validate', detail: 'schema or parser, then load; fix until clean; then converge each value a checker prints and the data records (set, re-run, repeat until stable, up to five rounds); per unit in a set' },
    { title: 'Check', detail: 'fresh read against the brief (one reviewer for every unit of a set) and simulation (once over a set), in parallel' },
    { title: 'Revise', detail: 'smallest data change per finding, re-validate, up to two rounds; one step for the set with set_design' },
    { title: 'Docs', detail: 'progression entries and any format or procedure change, once for a set, each planned page once' },
    { title: 'Docs check', detail: 'one kind per page, titles, links; up to three checks and two fixes over every page touched while blocking issues remain; minor-only results and issues in lines this work did not change go straight to the handoff notes; an issue a fix already left ends the loop still blocking' },
    { title: 'Handoff', detail: 'commit and push the data file (or the set\'s files) and docs, run the validator, load test and docs checks, return a handoff for engineering-practices deliver-package or land-pr' },
  ],
}

// --- run-modes v2 begin ---
const RUN = ((a, realAgent, realPhase, realLog) => {
  const opted = !!(a && typeof a === 'object' && a.run && typeof a.run === 'object')
  const c = opted ? a.run : {}
  const mode = c.mode === 'inline' ? 'inline' : 'agents'
  const results = c.results && typeof c.results === 'object' ? c.results : {}
  const reviewers = c.reviewers && typeof c.reviewers === 'object' ? c.reviewers : {}
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
  // Who answered each step marked independent: "subagent" when this run
  // spawned it, else the reviewer named in run.reviewers, else "self".
  const by = {}
  const who = (k) => (typeof reviewers[k] === 'string' && reviewers[k].trim() ? reviewers[k].trim() : 'self')
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
    const independent = op.independent === true
    const ph = op.phase || current
    const base = op.label || ph || 'agent'
    seen[base] = (seen[base] || 0) + 1
    const key = seen[base] > 1 ? `${base}#${seen[base]}` : base
    let note = null
    if (has(results, key)) {
      const gap = missing(results[key], op.schema)
      if (!gap) { out[key] = results[key]; if (independent) by[key] = who(key); return Promise.resolve(results[key]) }
      note = `answer missing ${gap}; answer this brief again`
    }
    if (!picked(ph, base)) { skipped.push(key); return Promise.resolve(null) }
    if (mode === 'agents') {
      const pass = Object.assign({}, op)
      delete pass.independent
      return realAgent(prompt, opts ? pass : opts).then((r) => {
        if (r !== null && r !== undefined) { out[key] = r; if (independent) by[key] = 'subagent' }
        return r
      })
    }
    const brief = { key, phase: ph, prompt, schema: op.schema || null }
    if (independent) brief.independent = true
    if (note) brief.note = note
    next.push(brief)
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
    const self_reviewed = Object.keys(by).filter((k) => by[k] === 'self')
    if (value === '__run_halted__') {
      return {
        run: 'inline', status: 'next', next, results: out, reviewers: by, self_reviewed, skipped, logs,
        how: 'Do each brief in next, in order: follow its prompt in this session (it may tell you to edit files, commit or push), and shape your answer to its schema when one is given, with every required field. A brief marked independent reviews work this run produced, so do not answer it yourself: send its prompt to a reviewer with no part in the work (the project\'s code-reviewer role, a fresh session or a fresh subagent), use their answer, and name them in run.reviewers under its key; if you must answer it yourself, it is listed in self_reviewed and must be reported as self-reviewed. A brief with a note was answered before without the fields it names. Add each answer to results under its key, then run this workflow again with the same args, run.results set to the merged results and run.reviewers to the merged reviewers. Repeat until status is "done". To avoid pasting results back on every call, drive the run with engineering-practices tools/run-inline.mjs and a state file instead: it stores each answer and prints only the next briefs.',
      }
    }
    return { run: mode, status: 'done', result: value, results: out, reviewers: by, self_reviewed, skipped, logs }
  }
  return { agent, phase, log, finish, halted, error }
})(typeof args === 'undefined' ? undefined : args, agent, phase, log)
if (RUN.error) return RUN.error
const RUN_OUT = await Promise.race([RUN.halted, (async (agent, phase, log) => {
// --- run-modes v2 end (workflow body follows; close it with the tail line) ---

// One brief, or a set of briefs (briefs: [...]) authored together. A set
// runs plan, author and validate per unit (labels end in the unit's
// 1-based number), one brief check and the simulation once over the
// whole set, and docs and the handoff once. With set_design: true the set
// is designed and authored (and revised) by one step that sees every brief,
// instead of one step per unit.

// A brief or a brief point may arrive as text, a list or an object; give
// the prompt readable lines, never a comma-joined list or [object Object].
const fmt = (v, pad = '') => v === null || v === undefined ? ''
  : typeof v === 'string' ? v
  : Array.isArray(v) ? v.map(x => `${pad}- ${fmt(x, pad + '  ').replace(/^\s*- /, '')}`).join('\n')
  : typeof v === 'object' ? Object.entries(v).map(([k, x]) => typeof x === 'object' && x !== null ? `${pad}${k}:\n${fmt(x, pad + '  ')}` : `${pad}${k}: ${x}`).join('\n')
  : String(v)
const set = args && Array.isArray(args.briefs) && args.briefs.length ? args.briefs.map(b => fmt(b)) : null
const brief = args && args.brief ? fmt(args.brief) : ''
if (!brief && !set) return 'Usage: author-level with args { brief: "<brief page or the brief text>", output: "<data file path, optional>", sequence: "<progression page, optional>" }, or { briefs: ["<brief page or text>", ...], output: "<data directory, optional>", sequence: "<progression page, optional>", set_design: true|false } to author a set in play order'
const batch = !!set
const together = batch && !!(args && args.set_design)
const list = batch ? set : [brief]
const all = list.map((_, i) => i)
const tag = (base, i) => batch ? `${base}:${i + 1}` : base
const output = (args && args.output) || 'the path the project profile gives for level or content data, one file per unit'
const outputOf = (i) => batch ? `${output}; one file per unit, this is unit ${i + 1} of ${list.length} in a set authored together in play order` : output
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
  derived: { type: 'array', items: { type: 'object', properties: {
    value: { type: 'string' }, command: { type: 'string' }, field: { type: 'string' },
  }, required: ['value', 'command'] } },
  doc_plan: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] }, page: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'page'] } },
}, required: ['brief_complete', 'output_path', 'owned', 'format', 'validate_cmd', 'simulator', 'doc_plan'] }
const DOCS_OUT = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages'] }
const DOC_CHECK = { type: 'object', properties: { issues: { type: 'array', items: { type: 'object', properties: {
  page: { type: 'string' }, problem: { type: 'string' }, severity: { type: 'string', enum: ['blocking', 'minor'] }, pre_existing: { type: 'boolean' },
}, required: ['problem', 'severity'] } } }, required: ['issues'] }
const DOC_FIX = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, left: { type: 'array', items: { type: 'object', properties: { page: { type: 'string' }, problem: { type: 'string' }, why: { type: 'string' }, severity: { type: 'string', enum: ['blocking', 'minor'] } }, required: ['problem', 'severity'] } } }, required: ['pages'] }
// The set designed and authored together: the set plan and each file written.
const SET_WROTE = { type: 'object', properties: {
  set_plan: { type: 'string' },
  written: { type: 'array', items: { type: 'object', properties: {
    path: { type: 'string' }, critical_path: { type: 'string' }, goal_sight: { type: 'string' }, first_contact: { type: 'string' },
  }, required: ['path'] } },
}, required: ['set_plan', 'written'] }
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, tests_pass: { type: 'boolean' }, problem: { type: 'string' } }, required: ['branch', 'tests_pass'] }
const VALID = { type: 'object', properties: {
  ok: { type: 'boolean' }, ran: { type: 'array', items: { type: 'string' } },
  errors: { type: 'array', items: { type: 'string' } },
}, required: ['ok', 'ran', 'errors'] }
// A value a checker prints that the data must record, driven to a fixed point.
const CONVERGED = { type: 'object', properties: {
  converged: { type: 'boolean' },
  values: { type: 'array', items: { type: 'object', properties: {
    value: { type: 'string' }, recorded: { type: 'string' }, rounds: { type: 'number' }, stable: { type: 'boolean' },
  }, required: ['value', 'stable'] } },
  open: { type: 'array', items: { type: 'string' } },
}, required: ['converged', 'values'] }
const ROUNDS = 5
const VERDICT = { type: 'string', enum: ['matches brief', 'off brief', 'too easy', 'on target', 'too hard', 'not run'] }
const FINDINGS = { type: 'object', properties: {
  verdict: VERDICT,
  findings: { type: 'array', items: { type: 'string' } }, table: { type: 'string' },
}, required: ['verdict', 'findings'] }
// The brief check over a set: one reviewer reads every unit it is given and
// returns one entry per file, in the order given.
const BRIEF_SET = { type: 'object', properties: {
  per_file: { type: 'array', items: { type: 'object', properties: {
    file: { type: 'string' }, verdict: { type: 'string', enum: ['matches brief', 'off brief'] }, findings: { type: 'array', items: { type: 'string' } },
  }, required: ['file', 'verdict', 'findings'] } },
}, required: ['per_file'] }
// The simulation over a set: one entry per file, in the order given.
const SIM_SET = { type: 'object', properties: {
  verdict: VERDICT,
  findings: { type: 'array', items: { type: 'string' } }, table: { type: 'string' },
  per_file: { type: 'array', items: { type: 'object', properties: {
    file: { type: 'string' }, verdict: VERDICT, findings: { type: 'array', items: { type: 'string' } },
  }, required: ['file', 'verdict', 'findings'] } },
}, required: ['verdict', 'findings', 'per_file'] }

const planPrompt = (b, i) => `You are the game designer. Following the game-designer level-design skill, read this brief and the project profile, design docs and existing level or content data. Brief: ${b}
Do not design anything new and do not edit files. Report:
- brief_complete: the brief states the idea it teaches or tests, the intended feeling, target duration, target success rate and what the player knows afterwards; list anything missing in brief_missing. A layout sketch or critical path is welcome but not required.
- brief_summary: those five points in one line each.
- output_path: where the data file goes (${outputOf(i)}); owned: whether the project profile gives the game designer that path.
- format: the data format and its schema, parser or loader (file and symbol), and example: the path of the closest existing data file to copy the shape from.
- validate_cmd: the command that checks a data file against its schema or parser without the full game (empty if none exists); load_cmd: the command or test that loads it in the build or a headless run (empty if none).
- simulator: the command that plays the content headless with bots (empty if none); targets: the balance targets page for this unit (empty if none).
- derived: values a checker, validator or simulator computes and prints that the data file must also record (a computed par or move count, a threshold, a total that depends on the rest of the data), each with the value's name, the command that prints it and the data field that records it. Empty if none.
- sequence_issues: read ${sequence}; list breaks of the progression rules if this unit goes where the brief says (more than one new idea, an idea used before it is taught, two maximum spikes in a row). Empty if fine or no table exists.
- doc_plan: Diataxis kind and page for each doc this change touches (the progression table and data format are reference; why the order is so is explanation; how to add a level is how-to, only if the procedure changes).`

phase('Plan')
const plans = await parallel(list.map((b, i) => () => agent(planPrompt(b, i), { schema: PLAN, phase: 'Plan', label: tag('plan', i) })))
if (!batch) {
  const p = plans[0]
  if (!p) return 'author-level: planning failed; nothing written.'
  if (!p.brief_complete) return `author-level: blocked; the brief is not finished. Missing:\n- ${(p.brief_missing || []).join('\n- ')}\nFinish it with the level-design skill (or the design-feature workflow for a new mechanic) first.`
  if (!p.owned) return `author-level: blocked; ${p.output_path} is not a path the project profile gives the game designer. Hand the brief to its owner or get the profile changed.`
  if (!p.format) return 'author-level: blocked; no level or content data format found. A gameplay programmer must define the format and its loader first (data, not code).'
} else {
  const notReady = (p) => !p ? 'planning failed'
    : !p.brief_complete ? `the brief is not finished; missing: ${(p.brief_missing || []).join('; ') || 'unstated'}`
    : !p.owned ? `${p.output_path} is not a path the project profile gives the game designer`
    : !p.format ? 'no level or content data format found; a gameplay programmer defines the format and its loader first'
    : null
  const bad = all.map(i => ({ unit: i + 1, brief: list[i], problem: notReady(plans[i]) })).filter(u => u.problem)
  if (bad.length) return { status: 'blocked', reason: 'some units in the set are not ready to author; nothing written', units: bad, next: 'finish those briefs (level-briefs or the level-design skill), get the paths owned or the format defined, then run again' }
}
const files = plans.map(p => p.output_path)
const shared = files.filter((f, i) => files.indexOf(f) !== i)
if (shared.length) log(`more than one unit planned for ${[...new Set(shared)].join(', ')}; check the units do not overwrite each other`)
const fileList = files.join(', ')
// Match a planned path to one a step returned, however it was spelled
// (./, absolute, backslashes).
const norm = (x) => String(x || '').replace(/\\/g, '/').replace(/^(\.\/)+/, '').replace(/\/+$/, '')
const same = (a, b) => { const x = norm(a); const y = norm(b); return !!x && !!y && (x === y || x.endsWith('/' + y) || y.endsWith('/' + x)) }

phase('Author')
const authorRules = `Rules: lay the critical path first, then alternatives, secrets and rests; put the goal, or a lead toward it, where the player sees it early; make first contact with the new idea safe; give any randomness a fixed, recorded seed; write data only (no code, no new fields the format does not define: if the brief needs one, stop and list it for the format's owner); use only the project's own content, never another game's level data.`
let setPlan = ''
let wrote
if (together) {
  const units = plans.map((p, i) => `Unit ${i + 1} of ${list.length}, at ${p.output_path} (format ${p.format}, shaped like ${p.example || 'the format reference'}):\n${fmt(p.brief_summary)}\nFull brief:\n${list[i]}`).join('\n\n')
  const w = await agent(`Following the game-designer level-design skill ("Progression: the order ideas arrive" and "Designing one level"), design these ${list.length} units together as one set, in play order, then build each as data. Design the set first: what each unit does that the others do not (no two doing the same job), how layouts, goals and obstacles vary across it, where each new idea first appears and how later units reuse it, and how the difficulty rises with a rest after each spike, as the briefs and ${sequence} ask. Then write every file, each in its own path. ${authorRules}
${units}
Return set_plan: the set design in a few lines (what each unit is for, how they differ, the curve), and written: one entry per unit in the order given, each with the path written exactly as given above and, in one line each, where the critical path, the first sight of the goal and the safe first contact are in the data.`, { schema: SET_WROTE, phase: 'Author', label: 'author:set' })
  if (!w) return { status: 'blocked', reason: 'authoring the set failed; inspect the working tree', files: plans.map(p => p.output_path) }
  setPlan = w.set_plan || ''
  const back = w.written || []
  wrote = plans.map((p, i) => back.find(x => x && same(x.path, p.output_path)) || (back.length === plans.length && back[i] && back[i].path ? back[i] : null))
} else {
  wrote = await parallel(plans.map((p, i) => () => agent(`Following the game-designer level-design skill ("Designing one level"), build this unit as data at ${p.output_path} in the project's format (${p.format}), shaped like ${p.example || 'the format reference'}. Brief:\n${fmt(p.brief_summary)}\nFull brief:\n${list[i]}
${authorRules}${batch ? ` Write only ${p.output_path}; the other units of the set are authored by their own steps.` : ''} Return the path written and, in one line each, where the critical path, the first sight of the goal and the safe first contact are in the data.`, { phase: 'Author', label: tag('author', i) })))
}
if (!batch && !wrote[0]) return 'author-level: authoring failed; inspect the working tree.'
const unwritten = all.filter(i => !wrote[i])
if (unwritten.length) return { status: 'blocked', reason: 'authoring failed for some units; inspect the working tree', files: unwritten.map(i => files[i]) }

const cmdsOf = (p) => [p.validate_cmd, p.load_cmd].filter(Boolean)
const missingOf = (p) => [!p.validate_cmd && 'no schema or parser validator', !p.load_cmd && 'no loader or load test'].filter(Boolean)
const validate = (i, round) => {
  const p = plans[i]
  const cmds = cmdsOf(p)
  return cmds.length
    ? agent(`Validate ${p.output_path}. Run, in order: ${cmds.join(', then ')}. If a command fails on this file, fix the data (never the validator, loader or tests: those belong to their owners) and run it again, up to three times. Return ok only if every listed command ran and passed, the commands run, and errors still open.`, { schema: VALID, phase: 'Validate', label: batch ? `validate:${i + 1}:${round}` : `validate:${round}` })
    : Promise.resolve({ ok: true, ran: [], errors: [] })
}
// Converge each derived value: set the field to what the checker prints,
// re-run, repeat until a re-run prints what the data records, bounded.
const conv = []
const converge = (i, round) => {
  const p = plans[i]
  const d = p.derived || []
  if (!d.length) return Promise.resolve({ converged: true, values: [] })
  return agent(`Converge these values in ${p.output_path}; a checker prints each and the data must record it:\n${d.map(x => `- ${x.value}: printed by ${x.command}${x.field ? `, recorded in ${x.field}` : ''}`).join('\n')}\nFor each: run its command, set the data field to the value it prints (data only; never the checker, validator or simulator), then run the command again${cmdsOf(p).length ? ` and ${cmdsOf(p).join(', ')}` : ''}. Repeat until a re-run prints the value the data records and the data still validates, up to ${ROUNDS} rounds per value. Return converged (every value stable), values (each with the value, what the data now records, the rounds it took, stable), and open: any value not stable after ${ROUNDS} rounds, with the last values seen.`, { schema: CONVERGED, phase: 'Validate', label: batch ? `converge:${i + 1}:${round}` : `converge:${round}` })
    .then(r => { conv[i] = r || { converged: false, values: [], open: ['converge step did not return; derived values unverified'] }; return conv[i] })
}

// Returns the blocked result when any of these units failed validation.
const invalid = (units, after) => {
  const bad = units.filter(i => !vs[i] || !vs[i].ok)
  if (!bad.length) return null
  if (!batch) return !vs[0]
    ? { status: 'blocked', reason: after ? 'validation step did not return after revision' : 'validation step did not return', file: files[0] }
    : { status: 'blocked', reason: after ? 'revision broke validation' : 'data does not validate', file: files[0], errors: vs[0].errors }
  return { status: 'blocked', reason: after ? 'revision broke validation' : 'data does not validate', units: bad.map(i => ({ file: files[i], problem: vs[i] ? 'does not validate' : 'validation step did not return', errors: vs[i] ? vs[i].errors : [] })) }
}

phase('Validate')
const missingAll = [...new Set(plans.flatMap(missingOf))]
if (missingAll.length) log(`${missingAll.join(' and ')}; listed as unverified for the gameplay programmer`)
const vs = await parallel(all.map(i => () => validate(i, 0)))
const notValid = invalid(all, false)
if (notValid) return notValid
await parallel(all.map(i => () => converge(i, 0)))

const simulator = (plans.find(p => p.simulator) || {}).simulator || ''
// A re-check after a revision gets its own label: recheck:brief:<round>
// and recheck:sim:<round>, for one brief or a set.
const BRIEF_RULES = 'it teaches or tests only the brief\'s idea; that idea\'s first contact is safe; the goal or a lead toward it is visible early; the player can tell what killed them; it is solvable as written; difficulty comes from the brief\'s levers, not from obscurity (hidden rules, unreadable space)'
const briefCheck = (round) => agent(`You did not write this level and must not assume its intent beyond the brief. Following the game-designer level-design skill, read ${files[0]} and this brief:\n${fmt(plans[0].brief_summary)}
Walk the critical path in the data as a first-time player would. Report off brief if any of these fail, with the location in the data: ${BRIEF_RULES}. Do not edit files.`, { schema: FINDINGS, phase: 'Check', label: round ? `recheck:brief:${round}` : 'check:brief', independent: true })
// A set gets one reviewer for every unit still to check, not one per unit.
const briefSetCheck = (units, round) => agent(`You did not write these levels and must not assume their intent beyond their briefs. Following the game-designer level-design skill, check each of these ${units.length} files against its brief, one at a time:\n${units.map(i => `${files[i]}:\n${fmt(plans[i].brief_summary)}`).join('\n\n')}
For each file, walk the critical path in the data as a first-time player would, and report off brief if any of these fail, with the location in the data: ${BRIEF_RULES}. Do not edit files. Return per_file: one entry per file above, in the order given, with the path exactly as given, its verdict (matches brief or off brief) and its findings.`, { schema: BRIEF_SET, phase: 'Check', label: round ? `recheck:brief:${round}` : 'check:brief', independent: true })
// That file's entry in a set check, matched by path, else by its place.
const briefOf = (r, units, i) => {
  const back = (r && r.per_file) || []
  const k = units.indexOf(i)
  const e = back.find(x => x && same(x.file, files[i])) || (back.length === units.length ? back[k] : null)
  return e || { verdict: 'not run', findings: [`brief check returned no result for ${files[i]}; unverified`] }
}
const simCheck = (round) => !simulator
  ? Promise.resolve({ verdict: 'not run', findings: ['no simulator: solvability and difficulty rest on the fresh read and a playtest'] })
  : !batch
    ? agent(`Following the game-designer economy-balance skill and its simulation.md reference, run ${simulator} on ${files[0]} for every difficulty with random, greedy and goal-aware strategies, fixed recorded seeds. Compare with ${plans[0].targets || 'the brief\'s target success rate and duration'}. Do not edit files. Return the summary table as markdown, a verdict (too easy, on target, too hard) and, if off target, the smallest data change that fixes it.`, { schema: FINDINGS, phase: 'Check', label: round ? `recheck:sim:${round}` : 'check:sim', independent: true })
    : agent(`Following the game-designer economy-balance skill and its simulation.md reference, run ${simulator} once over this whole set, in play order: ${fileList}. Play every file for every difficulty with random, greedy and goal-aware strategies, fixed recorded seeds, and compare each with its targets (${plans.map(p => `${p.output_path}: ${p.targets || 'its brief\'s target success rate and duration'}`).join('; ')}), and the set with the curve the progression expects. Do not edit files. Return the summary table as markdown (one row per file and difficulty), a verdict and findings for the set as a whole, and per_file: one entry per file in the order given, each with its verdict (too easy, on target, too hard) and, if off target, the smallest data change that fixes it.`, { schema: SIM_SET, phase: 'Check', label: round ? `recheck:sim:${round}` : 'check:sim', independent: true })

const failing = { brief: c => c.verdict === 'off brief', sim: c => ['too easy', 'too hard'].includes(c.verdict) }
const briefRes = []
let sim
// The simulation's answer for one unit: the whole answer for one brief,
// that file's entry for a set.
const simOf = (i) => !batch ? sim
  : !simulator ? { verdict: 'not run', findings: [] }
  : (sim.per_file || [])[i] || { verdict: 'not run', findings: [`simulation returned no result for ${files[i]}; unverified`] }
let pendingBrief = all
let simPending = true
for (let round = 0; round <= 2; round++) {
  if (round === 0) phase('Check')
  const briefSteps = !pendingBrief.length ? [] : batch ? [() => briefSetCheck(pendingBrief, round)] : [() => briefCheck(round)]
  const r = await parallel([...briefSteps, ...(simPending ? [() => simCheck(round)] : [])])
  const notRun = { verdict: 'not run', findings: ['brief check did not return; unverified'] }
  if (briefSteps.length) pendingBrief.forEach(i => { briefRes[i] = !r[0] ? notRun : batch ? briefOf(r[0], pendingBrief, i) : r[0] })
  if (simPending) sim = r[briefSteps.length] || { verdict: 'not run', findings: ['sim check did not return; unverified'] }
  pendingBrief = all.filter(i => failing.brief(briefRes[i]))
  const simFail = all.filter(i => failing.sim(simOf(i)))
  simPending = simFail.length > 0
  const openOf = (i) => [...(pendingBrief.includes(i) ? briefRes[i].findings : []), ...(simFail.includes(i) ? simOf(i).findings : [])]
  const todo = all.filter(i => openOf(i).length)
  const open = batch ? todo.flatMap(i => openOf(i).map(f => `${files[i]}: ${f}`)) : openOf(0)
  if (!open.length) break
  log(`round ${round}: ${open.length} findings`)
  if (round === 2) return batch
    ? { status: 'blocked', reason: 'still off brief or off target after two revisions', files: todo.map(i => files[i]), findings: open, simulation: sim.table || '' }
    : { status: 'blocked', reason: 'still off brief or off target after two revisions', file: files[0], findings: open, simulation: sim.table || '' }
  phase('Revise')
  const reviseOne = (i) => agent(`Following the game-designer level-design skill's decision rules (fix readability before numbers; add thinking before speed; one variable per change where possible), make the smallest data change to ${files[i]} that closes these findings. Data only; the brief stays as it is. If a finding needs the brief itself to change, do not edit: say so.\n- ${openOf(i).join('\n- ')}\nReturn what changed.`, { phase: 'Revise', label: batch ? `revise:${i + 1}:${round + 1}` : `revise:${round + 1}` })
  // A set designed together is revised together, so a fix to one unit keeps
  // the set plan (what each unit is for, the curve) whole.
  const fixed = together
    ? await agent(`Following the game-designer level-design skill's decision rules (fix readability before numbers; add thinking before speed; one variable per change where possible), make the smallest data changes to this set that close these findings, keeping the set plan:\n${setPlan}\n${todo.map(i => `${files[i]}:\n- ${openOf(i).join('\n- ')}`).join('\n')}\nData only; the briefs stay as they are, and files without findings change only if a fix needs it to keep the set plan. If a finding needs a brief itself to change, do not edit: say so. Return what changed, per file.`, { phase: 'Revise', label: `revise:set:${round + 1}` }).then(r => todo.map(() => r))
    : await parallel(todo.map(i => () => reviseOne(i)))
  const unfixed = todo.filter((i, k) => !fixed[k])
  if (unfixed.length) return batch
    ? { status: 'blocked', reason: 'revision failed', files: unfixed.map(i => files[i]), findings: open }
    : { status: 'blocked', reason: 'revision failed', file: files[0], findings: open }
  const rv = await parallel(todo.map(i => () => validate(i, round + 1)))
  todo.forEach((i, k) => { vs[i] = rv[k] })
  const broke = invalid(todo, true)
  if (broke) return broke
  await parallel(todo.map(i => () => converge(i, round + 1)))
}

phase('Docs')
// A set plans the same pages once per unit; keep one entry per kind and
// page, with the reasons merged.
const docPlan = []
plans.flatMap(p => p.doc_plan || []).forEach(d => {
  const k = docPlan.find(x => x.kind === d.kind && x.page === d.page)
  if (!k) docPlan.push(Object.assign({}, d))
  else if (d.why && !(k.why || '').includes(d.why)) k.why = k.why ? `${k.why}; ${d.why}` : d.why
})
const seqIssues = batch ? plans.flatMap((p, i) => (p.sequence_issues || []).map(s => `${files[i]}: ${s}`)) : plans[0].sequence_issues || []
const docs = await agent(`${DOCS_FRAGMENT}\nPlanned pages: ${JSON.stringify(docPlan)}. ${batch ? `Add or update each unit's row in the progression table (unit, idea, levers, target success rate, file), recording each file (${fileList}) and its seed.` : `Add or update this unit's row in the progression table (unit, idea, levers, target success rate, file), recording ${files[0]} and its seed.`}${setPlan ? ` The set was designed together; record its plan where the explanation page says why the order is so:\n${setPlan}\n` : ''} Update the data format reference only if the format changed, the how-to for adding a level only if the procedure changed, and the explanation only if the order or curve changed.${sim && sim.table ? `\nLatest simulation table:\n${sim.table}` : ''}\nProgression issues found at planning: ${JSON.stringify(seqIssues)}\nReturn pages: the paths of every page touched, and undocumented: any change left undocumented, with why.`, { schema: DOCS_OUT, phase: 'Docs', label: 'docs' })
if (!docs) return batch
  ? { status: 'docs missing', files, reason: 'the change is not done until its docs are written' }
  : { status: 'docs missing', file: files[0], reason: 'the change is not done until its docs are written' }

phase('Docs check')
// The check only reads, so it stays independent of the docs it judges;
// fixes are their own step, followed by a fresh check of every page touched
// so far (pages a fix added included). Up to three checks and two fixes,
// only while a blocking issue remains; minor issues go to the handoff notes,
// blocking ones left at the end stop it.
const docCheckPrompt = (pages) => `Review the documentation pages touched for ${fileList}: ${JSON.stringify(pages)}. Each page holds one Diataxis kind (reference describes, explanation holds the why, how-to titles name a goal), opens with a line naming its kind and audience, and links the related pages. Give each issue the page, the problem and a severity: blocking when a page mixes kinds, is missing, has a broken link or says something wrong; minor for wording, a title that could follow the pattern more closely, or a cross-link a reader can do without. ${DOC_SCOPE} Read-only: do not edit anything; return every issue.`
// Judge only what this work changed: an issue in a line it did not add or
// change is pre-existing, reported as minor so it goes to the notes and
// never holds the run or starts a fix.
const DOC_SCOPE = 'Judge only what this work changed: compare each page with the default branch (the diff from its merge base). An issue in a line this work did not add or change is pre_existing: true; report it, but it never counts as blocking.'
const PRE = 'pre-existing (not changed by this work): '
const docIssue = i => typeof i === 'string' ? { problem: i, severity: 'blocking' }
  : i.pre_existing ? Object.assign({}, i, { severity: 'minor', problem: String(i.problem || '').startsWith(PRE) ? i.problem : PRE + (i.problem || '') })
  : Object.assign({ severity: 'blocking' }, i)
const docText = i => i.page ? `${i.page}: ${i.problem}` : i.problem
let docPages = [...(docs.pages || [])]
let docIssueList = []
// Each re-check is told what the last check found, so it confirms those
// fixes instead of judging the pages afresh; an issue the fix left for a
// content decision stays blocking whatever the re-check says.
let docPrior = []
let docLeft = []
let docLeftAll = []
// The issues a fix left, in the words they were given, so a re-check that
// reports one again does not start another fix of the same item.
let docLeftKeys = []
// Pre-existing issues from every round, kept for the notes and never fixed.
let docPreAll = []
const isPre = i => String(i.problem || '').startsWith(PRE)
const LEFT = 'left by the docs fix (needs a content decision): '
// A left item keeps the severity of the issue it came from (a plain string
// counts as blocking), and is prefixed once however often it is left.
const leftIssue = (l) => { const i = typeof l === 'string' ? { problem: l, severity: 'blocking' } : Object.assign({}, l, { severity: l.severity === 'minor' ? 'minor' : 'blocking' }); return Object.assign(i, { problem: String(i.problem || '').startsWith(LEFT) ? i.problem : LEFT + (i.problem || '') }) }
const docUnique = (list) => list.filter((i, n) => list.findIndex(j => docText(j) === docText(i)) === n)
const docPriorLine = (prior) => prior.length ? `\nThe last check found these issues and a fix step has tried to close them; confirm each against the pages now and report any still present, with its severity, alongside anything new:\n- ${prior.map(docText).join('\n- ')}` : ''
for (let round = 1; round <= 3; round++) {
  const c = await agent(docCheckPrompt(docPages) + docPriorLine(docPrior), { schema: DOC_CHECK, phase: 'Docs check', label: round === 1 ? 'docs-check' : round === 2 ? 'docs-recheck' : `docs-recheck:${round - 1}`, independent: true })
  if (!c) { docIssueList = [{ problem: 'docs check did not return; docs unverified', severity: 'blocking' }]; break }
  docIssueList = docUnique([...(c.issues || []).map(docIssue), ...docLeft])
  docPreAll = docUnique([...docPreAll, ...docIssueList.filter(isPre)])
  docIssueList = docIssueList.filter(i => !isPre(i))
  // Minor-only results need no fix and no re-check: they go to the notes.
  // Nor do blocking issues a fix has already left for a content decision:
  // they stay blocking, but another fix and re-check cannot close them.
  const fixable = docIssueList.filter(i => i.severity !== 'minor' && !String(i.problem || '').startsWith(LEFT) && !docLeftKeys.includes(docText(i)))
  if (!fixable.length || round === 3) break
  const fix = await agent(`Fix these documentation problems with the smallest edits, touching only the pages they name (add a page only when an issue says one is missing); leave anything that needs a content decision:\n- ${docIssueList.map(i => `${docText(i)} [${i.severity}]`).join('\n- ')}\nReturn pages: every page you edited or added, and left: any issue you did not fix, with its page and problem exactly as given here, why you left it, and the severity it was given here.`, { schema: DOC_FIX, phase: 'Docs check', label: round === 1 ? 'docs-fix' : `docs-fix:${round}` })
  if (!fix) break
  docPages = [...new Set([...docPages, ...(fix.pages || [])])]
  docLeftKeys = [...new Set([...docLeftKeys, ...(fix.left || []).filter(l => l && typeof l === 'object').map(l => docText({ page: l.page, problem: String(l.problem || '').replace(LEFT, '') }))])]
  docLeft = docUnique((fix.left || []).map(l => l && typeof l === 'object' && l.why ? Object.assign({}, l, { problem: `${l.problem} (${l.why})` }) : l).map(leftIssue))
  docLeftAll = docUnique([...docLeftAll, ...docLeft])
  docPrior = docUnique([...docIssueList, ...docLeftAll])
}
docIssueList = [...docIssueList, ...docPreAll]
const docBlocking = docIssueList.filter(i => i.severity !== 'minor').map(docText)
const docMinor = docIssueList.filter(i => i.severity === 'minor').map(docText)

const prefix = (i, m) => batch ? `${files[i]}: ${m}` : m
const unverified = all.flatMap(i => missingOf(plans[i]).map(m => prefix(i, `${m}: file not fully machine-checked`)))
if (sim.verdict === 'not run') unverified.push(...sim.findings)
if (batch && simulator) all.forEach(i => { if (simOf(i).verdict === 'not run') unverified.push(...simOf(i).findings.map(f => prefix(i, f))) })
all.forEach(i => { if (briefRes[i].verdict === 'not run') unverified.push(...briefRes[i].findings.map(f => prefix(i, f))) })
all.forEach(i => { if (conv[i] && !conv[i].converged) unverified.push(...((conv[i].open || []).length ? conv[i].open : [`derived values not stable after ${ROUNDS} rounds`]).map(f => prefix(i, `not converged: ${f}`))) })

const docIssues = docIssueList.map(docText)
const status = docBlocking.length ? 'docs missing' : unverified.length ? 'incomplete' : 'done'
const docsOut = Object.assign({}, docs, { pages: docPages })

const result = batch ? {
  status,
  files,
  units: all.map(i => ({ file: files[i], validation: vs[i], derived: (conv[i] || {}).values || [], brief_check: briefRes[i].findings, sequence_issues: plans[i].sequence_issues || [] })),
  simulation: sim.table || sim.verdict,
  set_plan: setPlan,
  unverified,
  next: 'playtest the units with players who have not seen them (game-designer playtesting skill); simulation confirms numbers, not feeling',
  docs: docsOut,
  doc_issues: docIssues,
} : {
  status,
  file: files[0],
  validation: vs[0],
  derived: (conv[0] || {}).values || [],
  brief_check: briefRes[0].findings,
  simulation: sim.table || sim.verdict,
  sequence_issues: plans[0].sequence_issues || [],
  unverified,
  next: 'playtest the unit with players who have not seen it (game-designer playtesting skill); simulation confirms numbers, not feeling',
  docs: docsOut,
  doc_issues: docIssues,
}
if (docBlocking.length) return result

// The handoff is what engineering-practices deliver-package takes as
// prior, so the unit (or the set) ships without being authored again.
phase('Handoff')
const cmdsAll = [...new Set(plans.flatMap(cmdsOf))]
const hand = await agent(`Hand off ${batch ? `the set of ${files.length} units at ${fileList}` : `the unit at ${files[0]}`}. If you are on the default branch, cut a Conventional branch (feat/<slug>) from the latest remote default branch; otherwise stay on the current feature branch. Commit the data file${batch ? 's' : ''} ${fileList} and the docs pages (${docPages.join(', ') || 'as written'}) as Conventional Commits, and push. On the pushed head run the checks that apply: ${cmdsAll.length ? cmdsAll.join(', ') + ', ' : ''}the project's test suite and any docs or link check its profile names. Do not open, mark ready or merge a PR: the engineering-practices workflow named in the result does that. Follow the engineering-practices git-workflow skill. Return the branch, any open PR, the head commit SHA, whether those checks pass on that head, and the problem if not.`, { schema: HANDOFF, phase: 'Handoff', label: 'handoff' })
const where = batch ? { files } : { file: files[0] }
if (!hand || !hand.branch) return Object.assign({ status: 'blocked', reason: hand && hand.problem ? hand.problem : `handoff step returned nothing; the ${batch ? 'units' : 'unit'} and docs may be uncommitted` }, where)
if (!hand.tests_pass) return Object.assign({ status: 'blocked', reason: `checks fail on ${hand.branch}${hand.head_sha ? ' at ' + hand.head_sha : ''}: ${hand.problem || 'no details'}` }, where)
result.handoff = {
  from: 'game-designer:author-level',
  branch: hand.branch,
  pr: hand.pr || '',
  head_sha: hand.head_sha || '',
  tests_pass: true,
  docs: docPages,
  undocumented: docs.undocumented || [],
  notes: [...unverified, ...docMinor.map(d => 'docs check (minor): ' + d)],
}
result.next = `${result.next}; ship it without rebuilding: /engineering-practices:deliver-package { wp: "<the package>", prior: <this result> }; with no work package, /engineering-practices:land-pr { branch: "<handoff.branch>" }`
return result
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)

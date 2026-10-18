// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'level-briefs',
  description: 'Write the briefs for a set of levels or content units from the progression and design docs: order the ideas, give each unit its idea, feeling, duration, target success rate and takeaway in the shape author-level checks for, check the duration against the clock at human pace, check the set with a reviewer who did not write it, revise and re-check up to three rounds (minor wording findings are fixed in place; conflicts with the design docs go to design_gaps instead of the loop), write the briefs and document them in the shape of the project\'s own progression table. Use before author-level when a sequence of units has no finished briefs. args: { units: ["<unit id>", ...] (optional: default every unit in the progression without a finished brief), progression: "<progression page, optional>", design: "<design docs or spec pages, optional>", output: "<where briefs go, optional>" }',
  phases: [
    { title: 'Plan', detail: 'units, idea inventory and dependencies, brief format and location, targets, clock and human pace, blocking gaps and non-blocking notes, doc kinds via the compass' },
    { title: 'Sequence', detail: 'one new idea per unit, arc role, difficulty and levers across the set' },
    { title: 'Draft', detail: 'one agent per unit, brief returned, not written; duration checked against the clock at human pace' },
    { title: 'Check', detail: 'independent read of the whole set against the sequence rules and brief completeness; findings blocking or minor, design-doc conflicts split out as design gaps' },
    { title: 'Revise', detail: 'revise the briefs (and the sequence, for set findings) against the findings, then a fresh read-only re-check; up to three checks and two revisions; only minor findings left: polish them in place and go on' },
    { title: 'Write', detail: 'briefs into the project\'s brief location and format' },
    { title: 'Docs', detail: 'progression table rows in the shape of the project\'s existing table, and the order\'s rationale' },
    { title: 'Docs check', detail: 'one kind per page, titles, links; up to three checks and two fixes over every page touched, minor issues go to the handoff notes' },
    { title: 'Handoff', detail: 'commit and push the briefs and docs, run the docs checks, return a handoff for engineering-practices deliver-package or land-pr' },
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

const wanted = args && Array.isArray(args.units) ? args.units : []
const progression = (args && args.progression) || 'the progression table in the project design docs'
const design = (args && args.design) || 'the project\'s design docs and rules spec'
const output = (args && args.output) || 'where the project keeps level briefs (the progression page\'s brief sections, or the path its profile gives); one brief per unit'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs/<kind>/ (per its profile), keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

// The five points author-level's Plan step checks a brief for.
const FIVE = 'idea (the one idea it teaches or tests), feeling (the intended feeling), duration (target duration), success_rate (target success rate, per difficulty if the targets page has difficulties) and takeaway (what the player knows afterwards)'

const PLAN = { type: 'object', properties: {
  units: { type: 'array', items: { type: 'string' } },
  already_briefed: { type: 'array', items: { type: 'string' } },
  ideas: { type: 'array', items: { type: 'object', properties: {
    idea: { type: 'string' }, needs: { type: 'array', items: { type: 'string' } }, source: { type: 'string' },
  }, required: ['idea', 'needs'] } },
  output_path: { type: 'string' }, owned: { type: 'boolean' },
  brief_format: { type: 'string' }, example: { type: 'string' },
  targets: { type: 'string' },
  pace: { type: 'string' },
  gaps: { type: 'array', items: { type: 'string' } },
  notes: { type: 'array', items: { type: 'string' } },
  doc_plan: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] }, page: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'page'] } },
}, required: ['units', 'ideas', 'output_path', 'owned', 'brief_format', 'targets', 'doc_plan'] }
const SEQ = { type: 'object', properties: {
  rows: { type: 'array', items: { type: 'object', properties: {
    unit: { type: 'string' }, idea: { type: 'string' },
    role: { type: 'string', enum: ['introduce', 'develop', 'twist', 'test', 'rest'] },
    difficulty: { type: 'number' }, levers: { type: 'array', items: { type: 'string' } },
  }, required: ['unit', 'idea', 'role', 'difficulty', 'levers'] } },
  table: { type: 'string' },
  problems: { type: 'array', items: { type: 'string' } },
}, required: ['rows', 'table', 'problems'] }
const BRIEF = { type: 'object', properties: {
  unit: { type: 'string' }, idea: { type: 'string' }, feeling: { type: 'string' },
  duration: { type: 'string' }, success_rate: { type: 'string' }, takeaway: { type: 'string' },
  role: { type: 'string' }, levers: { type: 'array', items: { type: 'string' } },
  first_contact: { type: 'string' }, notes: { type: 'string' },
  pace_check: { type: 'object', properties: {
    human_duration: { type: 'string' }, clock: { type: 'string' }, fits: { type: 'boolean' }, note: { type: 'string' },
  }, required: ['human_duration', 'clock', 'fits'] },
}, required: ['unit', 'idea', 'feeling', 'duration', 'success_rate', 'takeaway'] }
// severity: minor is wording or clarity a revision can fix in place with no
// change to what a brief asks for; design_gap marks a problem in the design
// docs themselves, which no brief can fix.
const FINDING = { type: 'object', properties: {
  unit: { type: 'string' }, problem: { type: 'string' },
  severity: { type: 'string', enum: ['blocking', 'minor'] }, design_gap: { type: 'boolean' },
}, required: ['unit', 'problem', 'severity'] }
const CHECK = { type: 'object', properties: {
  findings: { type: 'array', items: FINDING },
  set_findings: { type: 'array', items: { type: 'object', properties: {
    problem: { type: 'string' }, severity: { type: 'string', enum: ['blocking', 'minor'] }, design_gap: { type: 'boolean' },
  }, required: ['problem', 'severity'] } },
  design_gaps: { type: 'array', items: { type: 'object', properties: {
    unit: { type: 'string' }, problem: { type: 'string' }, doc: { type: 'string' },
  }, required: ['problem'] } },
}, required: ['findings', 'set_findings', 'design_gaps'] }
const POLISHED = { type: 'object', properties: {
  briefs: { type: 'array', items: BRIEF },
}, required: ['briefs'] }
const REVISED = { type: 'object', properties: {
  briefs: { type: 'array', items: BRIEF },
  table: { type: 'string' },
  rows: SEQ.properties.rows,
  design_gaps: { type: 'array', items: { type: 'string' } },
}, required: ['briefs', 'design_gaps'] }
const WRITE = { type: 'object', properties: {
  written: { type: 'array', items: { type: 'object', properties: { unit: { type: 'string' }, path: { type: 'string' } }, required: ['unit', 'path'] } },
}, required: ['written'] }
const DOCS_OUT = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages'] }
const DOC_CHECK = { type: 'object', properties: { issues: { type: 'array', items: { type: 'object', properties: {
  page: { type: 'string' }, problem: { type: 'string' }, severity: { type: 'string', enum: ['blocking', 'minor'] },
}, required: ['problem', 'severity'] } } }, required: ['issues'] }
const DOC_FIX = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, left: { type: 'array', items: { type: 'string' } } }, required: ['pages'] }
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, tests_pass: { type: 'boolean' }, problem: { type: 'string' } }, required: ['branch', 'tests_pass'] }

phase('Plan')
const p = await agent(`You are the game designer. Following the game-designer level-design skill ("Progression: the order ideas arrive"), read the project profile, ${progression} and ${design}, the balance targets and any existing level briefs and level data. Do not edit files. Report:
- units: the units to brief, in play order: ${wanted.length ? wanted.join(', ') : 'every unit in the progression whose brief is missing any of the five points'}. already_briefed: units in that range whose brief is already finished (they stay as they are but count in the sequence).
- ideas: the idea inventory for this range (every mechanic, rule variant, obstacle or tool the player must learn here), each with the ideas it needs first and where the design docs define it.
- output_path: ${output}; owned: whether the project profile gives the game designer that path.
- brief_format: the shape existing briefs use (headings or fields), so the new ones match it and author-level reads them; example: the path of the closest existing brief, empty if none.
- targets: the balance targets page and the target success rate and duration range it sets for these units, empty if none.
- pace: if the targets or design docs give a clock (a time limit per unit) or a human pace (seconds per move or action), both, and how one turns into the other for these units; empty if the project has neither.
- gaps: only what makes the briefs impossible to write: an idea with no definition, more new ideas than units, a unit count the design docs leave open. Empty if none. These stop the run.
- notes: everything else worth knowing that does not stop the briefs: a choice the design docs leave to the designer (say which default you take), a provisional number, a doc that disagrees with another in a way the briefs can work around. Empty if none. These do not stop the run; they go to the briefs and into the result.
- doc_plan: Diataxis kind and page for each doc this touches (the progression table and briefs are reference; why the order is so is explanation).`, { schema: PLAN, phase: 'Plan', label: 'plan' })
if (!p) return 'level-briefs: planning failed; nothing written.'
if (!p.owned) return `level-briefs: blocked; ${p.output_path} is not a path the project profile gives the game designer. Hand the set to its owner or get the profile changed.`
if (!p.units.length) return 'level-briefs: nothing to do; every unit in range already has a finished brief.'
if ((p.gaps || []).length) return { status: 'blocked', reason: 'the design docs do not settle this set yet', gaps: p.gaps, notes: p.notes || [], next: 'settle the open ideas with design-feature or the design-spec skill, then run level-briefs again' }
const notes = p.notes || []
const notesLine = notes.length ? `\nPlanning notes (open choices and assumptions, not blockers; follow the defaults they name): ${JSON.stringify(notes)}` : ''

phase('Sequence')
const sq = await agent(`Following the game-designer level-design skill (progression steps 2-5), lay out the sequence for these units in play order: ${p.units.join(', ')}${(p.already_briefed || []).length ? ` (already briefed and fixed: ${p.already_briefed.join(', ')})` : ''}.
Ideas and dependencies: ${JSON.stringify(p.ideas)}. Targets: ${p.targets || 'none written; give relative difficulty only'}.${notesLine}
For each unit give: the one idea it is about, its role in that idea's arc (introduce, develop, twist, test, or rest), intended difficulty on a 1-10 scale relative to the set, and the difficulty levers it uses (goal size and variety first, then complexity, then scarcity, then time pressure and precision last). Rules: at most one new idea per unit; no idea before the ideas it needs; introductions are safe; the curve rises with a sawtooth, a rest after each spike, never two maximum spikes in a row. Return rows, the same as a markdown table, and problems: any rule the set cannot meet as given (empty if none). Do not edit files.`, { schema: SEQ, phase: 'Sequence', label: 'sequence' })
if (!sq) return 'level-briefs: sequencing failed; nothing written.'
if ((sq.problems || []).length) return { status: 'blocked', reason: 'the set breaks the progression rules', problems: sq.problems, sequence: sq.table, next: 'change the unit count or the idea order in the design docs, then run again' }

const draftPrompt = (row) => `Following the game-designer level-design skill ("Designing one level", step 1), write the brief for unit ${row.unit}. Its place in the set: ${JSON.stringify(row)}. Whole sequence:\n${sq.table}
Give the five points author-level checks for: ${FIVE}. Make them concrete and checkable: the duration as a time or move range, the success rate as a number matching ${p.targets || 'the set\'s relative difficulty'} for this unit's place, the feeling as one or two words a playtester could confirm, the takeaway as a sentence starting "The player knows". Also give its role, levers, first_contact (where the player first meets the idea and why it is safe; for a test or rest unit, which earlier ideas it mixes) and notes for the author (anything the data must do, never a layout). ${p.pace ? `\nPace: ${p.pace}. Check the duration against the clock at human pace: estimate the moves or actions a first-time player needs (from the goal size, the targets or the simulator's move counts), multiply by the human pace, and compare with the clock this unit gets. Return pace_check: human_duration (the estimate and how you got it), clock, fits (whether a first-time player finishes inside the clock with the margin the targets imply), and note. If it does not fit, change this brief (goal size, duration, target success rate) within the design; if the design's own numbers make it impossible for this unit, keep the brief as the design asks and say so in note.` : ''}${notesLine}
Use only the project's own design, never another game's level data. Do not edit files.`

phase('Draft')
const rows = sq.rows.filter(r => p.units.includes(r.unit))
const lost = p.units.filter(u => !rows.some(r => r.unit === u))
if (lost.length) return { status: 'blocked', reason: 'the sequence left units out', units: lost, sequence: sq.table }
const drafted = await pipeline(rows, r => agent(draftPrompt(r), { schema: BRIEF, phase: 'Draft', label: `draft:${r.unit}` }))
const briefs = {}
rows.forEach((r, i) => { if (drafted[i]) briefs[r.unit] = drafted[i] })
const failed = rows.filter(r => !briefs[r.unit]).map(r => r.unit)
if (failed.length) return { status: 'blocked', reason: 'some briefs did not draft', units: failed, sequence: sq.table }

// Check, revise, re-check: the check only reads, so it stays independent of
// the briefs it judges; the revision is its own step, followed by a fresh check.
// Findings that are only minor (wording, clarity) are fixed in place by a
// polish step, without another check; design gaps (problems in the design
// docs, not the briefs) leave the loop and go to the result.
const label = f => typeof f === 'string' ? f : f.unit ? `${f.unit}: ${f.problem}` : f.problem
const norm = f => typeof f === 'string' ? { problem: f, severity: 'blocking' } : Object.assign({ severity: 'blocking' }, f)
const gapKey = g => `${g.unit || '*'}|${g.problem}`
let table = sq.table
let open = []
let setOpen = []
let minor = []
let polished = []
const designGaps = []
const addGaps = (list) => (list || []).map(g => typeof g === 'string' ? { problem: g } : g).forEach(g => { if (g && g.problem && !designGaps.some(d => gapKey(d) === gapKey(g))) designGaps.push(g) })
for (let round = 1; round <= 3; round++) {
  if (round === 1) phase('Check')
  const c = await agent(`You did not write these briefs and must not assume their intent beyond them and the design docs (${design}). Following the game-designer level-design skill, check the set as author-level and a first-time player would:
- each brief states all five points (${FIVE}) concretely enough to check: a duration range, a success-rate number, a feeling a playtester can confirm, a takeaway the player could say;
- each unit has one new idea at most, and no idea appears before the ideas it needs (${JSON.stringify(p.ideas)});
- introductions are safe, the curve has rests after spikes and never two maximum spikes in a row, and success rates fall where ${p.targets || 'the relative difficulty'} says they should;${p.pace ? `
- each duration fits the clock at human pace (${p.pace}): read each brief's pace_check and redo the arithmetic;` : ''}
- no two units do the same job (each teaches, tests or lets the player express something the others do not).
Sequence:\n${table}\nBriefs: ${JSON.stringify(briefs)}${notesLine}${designGaps.length ? `\nKnown design gaps, already routed to the design docs' owner (do not report them again): ${JSON.stringify(designGaps)}` : ''}
Sort what you find. A problem the briefs or the sequence can fix is a finding: per unit in findings (unit, problem), or in set_findings when no single brief can fix it. Give each a severity: minor when it is wording or clarity that a revision can fix in place without changing what the brief asks for (a loosely stated point, a vague feeling word, a takeaway not phrased as one), blocking otherwise. A problem that comes from the design docs themselves (they contradict each other, leave the point open, or give numbers no brief can meet, so a brief that follows them faithfully still has it) is not a finding: list it in design_gaps with the unit (or "*"), the problem and the doc. Read-only: this check must change no files; do not edit files.`, { schema: CHECK, phase: round === 1 ? 'Check' : 'Revise', label: `check:${round}`, independent: true })
  if (!c) { open = [{ unit: '*', problem: 'brief check did not return; the set is unverified' }]; setOpen = []; minor = []; break }
  addGaps(c.design_gaps)
  const fs = (c.findings || []).map(norm)
  const ss = (c.set_findings || []).map(norm)
  addGaps([...fs, ...ss].filter(f => f.design_gap))
  open = fs.filter(f => !f.design_gap && f.severity !== 'minor')
  setOpen = ss.filter(f => !f.design_gap && f.severity !== 'minor')
  minor = [...fs, ...ss].filter(f => !f.design_gap && f.severity === 'minor')
  if (!open.length && !setOpen.length) break
  log(`round ${round}: ${open.length + setOpen.length} blocking findings, ${minor.length} minor`)
  if (round === 3) break
  phase('Revise')
  const rv = await agent(`Following the game-designer level-design skill (progression steps 2-5 and "Designing one level", step 1), revise this set of briefs so it closes every finding below. Keep the unit list and play order (${rows.map(r => r.unit).join(', ')}); you may change any brief's five points, role, levers, first contact, pace_check and notes, and, for set findings, the roles, difficulties and levers in the sequence. Keep the rules: at most one new idea per unit, no idea before the ideas it needs, safe introductions, a rest after each spike. Use only the project's own design (${design}), never another game's level data. If a finding can only be closed by changing the design docs or the unit count, leave it and list it in design_gaps.
Unit findings:\n- ${[...open, ...minor.filter(f => f.unit)].map(label).join('\n- ') || 'none'}
Set findings:\n- ${[...setOpen, ...minor.filter(f => !f.unit)].map(label).join('\n- ') || 'none'}
Sequence:\n${table}\nBriefs: ${JSON.stringify(briefs)}${notesLine}
Return briefs: the full revised brief of every unit you changed, with all five points; table: the revised sequence as a markdown table (the current one if unchanged); rows: the revised sequence rows, only if they changed; design_gaps. The Write step writes the briefs to files, so do not edit files here.`, { schema: REVISED, phase: 'Revise', label: `revise:${round}` })
  if (!rv) return { status: 'blocked', reason: `revision ${round} returned nothing`, findings: open.map(label), set_findings: setOpen.map(label), design_gaps: designGaps, sequence: table, briefs }
  ;(rv.briefs || []).forEach(b => { if (b && briefs[b.unit]) briefs[b.unit] = b })
  if (rv.table) table = rv.table
  if (Array.isArray(rv.rows) && rv.rows.length && rows.every(r => rv.rows.some(x => x.unit === r.unit))) rows.splice(0, rows.length, ...rows.map(r => rv.rows.find(x => x.unit === r.unit)))
  addGaps(rv.design_gaps)
}
if (open.length || setOpen.length) return { status: 'blocked', reason: open.some(f => f.unit === '*') ? 'the brief check did not return' : 'blocking findings remain after the last check (three checks, two revisions)', findings: open.map(label), set_findings: setOpen.map(label), minor_findings: minor.map(label), design_gaps: designGaps, sequence: table, briefs, next: setOpen.length ? 'change the unit count or the idea order in the design docs, then run again' : 'revise the named briefs by hand or run again' }
if (minor.length) {
  const pol = await agent(`Fix these minor findings in place: wording and clarity only. Change only the words of the briefs they name; keep each brief's idea, numbers, role and levers as they are.\n- ${minor.map(label).join('\n- ')}\nBriefs: ${JSON.stringify(briefs)}\nReturn briefs: the full brief of every unit you changed, with all five points. The Write step writes them to files, so do not edit files here.`, { schema: POLISHED, phase: 'Revise', label: 'polish' })
  if (pol) { (pol.briefs || []).forEach(b => { if (b && briefs[b.unit]) briefs[b.unit] = b }); polished = minor.map(label) }
  else log('polish step returned nothing; minor findings left as they are')
}
const paceMisses = rows.map(r => briefs[r.unit]).filter(b => b && b.pace_check && b.pace_check.fits === false).map(b => `${b.unit}: ${b.pace_check.human_duration} against a clock of ${b.pace_check.clock}${b.pace_check.note ? ` (${b.pace_check.note})` : ''}`)

phase('Write')
const w = await agent(`Write these briefs to ${p.output_path}, one per unit, in the project's brief format (${p.brief_format}${p.example ? `, shaped like ${p.example}` : ''}). Label the five points so author-level finds them: Idea, Feeling, Duration, Target success rate, Takeaway (what the player knows afterwards); add role, levers, first contact, the pace check (if any) and notes below them. Edit briefs only: no level data, no targets, no other unit's finished brief. Keep any license header the project requires on new files.\nBriefs: ${JSON.stringify(rows.map(r => briefs[r.unit]))}\nReturn each unit and the path (and heading, if several share a page) of its brief.`, { schema: WRITE, phase: 'Write', label: 'write' })
if (!w) return { status: 'blocked', reason: 'writing briefs failed; inspect the working tree', briefs }

phase('Docs')
const docs = await agent(`${DOCS_FRAGMENT}\nPlanned pages: ${JSON.stringify(p.doc_plan)}. First read the project's existing progression or plan table (${progression}) and follow its shape: its columns and their order, its row order, its link style and its file. Add or update each unit's row in that shape, filling the columns it has from the briefs and leaving columns that author-level fills later (a data file, a seed) empty; do not add, drop or reorder its columns. Only when the project has no such table, create one with these columns: unit, idea, role, levers, target success rate, brief link, data file (empty until author-level fills it). Record why the ideas arrive in this order in the explanation page if the order is new or changed.\nSequence:\n${table}\nBriefs written: ${JSON.stringify(w.written)}\nReturn pages: the paths of every page touched, and undocumented: any change left undocumented, with why.`, { schema: DOCS_OUT, phase: 'Docs', label: 'docs' })

phase('Docs check')
// The check only reads, so it stays independent of the docs it judges;
// fixes are their own step, followed by a fresh check of every page touched
// so far (pages a fix added included). Up to three checks and two fixes;
// minor issues left at the end go to the handoff notes, blocking ones stop it.
const docCheckPrompt = (pages) => `Review the documentation pages touched for these briefs: ${JSON.stringify(pages)}. Each page holds one Diataxis kind (reference describes, explanation holds the why), opens with a line naming its kind and audience, titles follow the pattern, and pages link each other. Give each issue the page, the problem and a severity: blocking when a page mixes kinds, is missing, has a broken link or says something wrong; minor for wording, a title that could follow the pattern more closely, or a cross-link a reader can do without. Read-only: do not edit anything; return remaining issues.`
const docIssue = i => typeof i === 'string' ? { problem: i, severity: 'blocking' } : Object.assign({ severity: 'blocking' }, i)
const docText = i => i.page ? `${i.page}: ${i.problem}` : i.problem
let docPages = docs ? [...(docs.pages || [])] : []
let docIssues = docs ? [] : [{ problem: 'docs step failed', severity: 'blocking' }]
for (let round = 1; docs && round <= 3; round++) {
  const c = await agent(docCheckPrompt(docPages), { schema: DOC_CHECK, phase: 'Docs check', label: round === 1 ? 'docs-check' : round === 2 ? 'docs-recheck' : `docs-recheck:${round - 1}`, independent: true })
  if (!c) { docIssues = [{ problem: 'docs check did not return; docs unverified', severity: 'blocking' }]; break }
  docIssues = (c.issues || []).map(docIssue)
  if (!docIssues.length || round === 3) break
  const fix = await agent(`Fix these documentation problems with the smallest edits, touching only the pages they name (add a page only when an issue says one is missing); leave anything that needs a content decision:\n- ${docIssues.map(docText).join('\n- ')}\nReturn pages: every page you edited or added, and left: any issue you did not fix, with why.`, { schema: DOC_FIX, phase: 'Docs check', label: round === 1 ? 'docs-fix' : `docs-fix:${round}` })
  if (!fix) break
  docPages = [...new Set([...docPages, ...(fix.pages || [])])]
}
const docBlocking = docIssues.filter(i => i.severity !== 'minor')

const result = {
  status: docBlocking.length ? 'docs missing' : 'done',
  briefs: w.written,
  sequence: table,
  notes,
  design_gaps: designGaps,
  pace: paceMisses,
  polished,
  docs: docs ? Object.assign({}, docs, { pages: docPages }) : 'docs step failed',
  doc_issues: docIssues.map(docText),
  next: `The briefs and docs are written but not committed: land them with engineering-practices deliver-package or small-change. Then build each unit with /game-designer:author-level { brief: "<its brief path>" } in play order, and run balance-pass over the set.${designGaps.length ? ' Send design_gaps to the owner of the design docs (engineering-practices peer-coordination); the briefs follow the docs as written until they change.' : ''}`,
}
if (result.status !== 'done') return result

// The handoff is what engineering-practices deliver-package takes as
// prior, so the briefs ship without being written again.
phase('Handoff')
const briefPaths = [...new Set(w.written.map(b => b.path))]
const hand = await agent(`Hand off the level briefs for ${rows.map(r => r.unit).join(', ')}. If you are on the default branch, cut a Conventional branch (docs/<slug>) from the latest remote default branch; otherwise stay on the current feature branch. Commit the briefs (${briefPaths.join(', ')}) and the docs pages (${docPages.join(', ') || 'as written'}) as Conventional Commits, and push. On the pushed head run the checks that apply: any docs, link or brief check the project profile names, and its test suite if this change touches anything it covers. Do not open, mark ready or merge a PR: the engineering-practices workflow named in the result does that. Follow the engineering-practices git-workflow skill. Return the branch, any open PR, the head commit SHA, whether those checks pass on that head, and the problem if not.`, { schema: HANDOFF, phase: 'Handoff', label: 'handoff' })
if (!hand || !hand.branch) return { status: 'blocked', reason: hand && hand.problem ? hand.problem : 'handoff step returned nothing; the briefs and docs may be uncommitted', briefs: w.written, sequence: table }
if (!hand.tests_pass) return { status: 'blocked', reason: `checks fail on ${hand.branch}${hand.head_sha ? ' at ' + hand.head_sha : ''}: ${hand.problem || 'no details'}`, briefs: w.written, sequence: table }
result.handoff = {
  from: 'game-designer:level-briefs',
  branch: hand.branch,
  pr: hand.pr || '',
  head_sha: hand.head_sha || '',
  tests_pass: true,
  docs: [...new Set([...briefPaths, ...docPages])],
  undocumented: docs.undocumented || [],
  notes: [
    ...notes.map(n => 'planning note: ' + n),
    ...designGaps.map(g => `design gap${g.doc ? ` in ${g.doc}` : ''}: ${label(g)}`),
    ...paceMisses.map(m => 'pace: ' + m),
    ...docIssues.map(i => 'docs check (minor): ' + docText(i)),
  ],
}
result.next = `ship it without rebuilding: /engineering-practices:deliver-package { wp: "<the package>", prior: <this result> }; with no work package, /engineering-practices:land-pr { branch: "<handoff.branch>" }. Then build each unit with /game-designer:author-level { brief: "<its brief path>" } in play order, and run balance-pass over the set.${designGaps.length ? ' Send design_gaps to the owner of the design docs (engineering-practices peer-coordination).' : ''}`
return result
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)

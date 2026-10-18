// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'level-briefs',
  description: 'Write the briefs for a set of levels or content units from the progression and design docs: order the ideas, give each unit its idea, feeling, duration, target success rate and takeaway in the shape author-level checks for, check the set with a reviewer who did not write it, revise, write the briefs and document them. Use before author-level when a sequence of units has no finished briefs. args: { units: ["<unit id>", ...] (optional: default every unit in the progression without a finished brief), progression: "<progression page, optional>", design: "<design docs or spec pages, optional>", output: "<where briefs go, optional>" }',
  phases: [
    { title: 'Plan', detail: 'units, idea inventory and dependencies, brief format and location, targets, doc kinds via the compass' },
    { title: 'Sequence', detail: 'one new idea per unit, arc role, difficulty and levers across the set' },
    { title: 'Draft', detail: 'one agent per unit, brief returned, not written' },
    { title: 'Check', detail: 'independent read of the whole set against the sequence rules and brief completeness' },
    { title: 'Revise', detail: 'redraft only flagged units, up to two rounds' },
    { title: 'Write', detail: 'briefs into the project\'s brief location and format' },
    { title: 'Docs', detail: 'progression table rows and the order\'s rationale' },
    { title: 'Docs check', detail: 'one kind per page, titles, links' },
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
  gaps: { type: 'array', items: { type: 'string' } },
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
}, required: ['unit', 'idea', 'feeling', 'duration', 'success_rate', 'takeaway'] }
const CHECK = { type: 'object', properties: {
  findings: { type: 'array', items: { type: 'object', properties: {
    unit: { type: 'string' }, problem: { type: 'string' },
  }, required: ['unit', 'problem'] } },
  set_findings: { type: 'array', items: { type: 'string' } },
}, required: ['findings', 'set_findings'] }
const WRITE = { type: 'object', properties: {
  written: { type: 'array', items: { type: 'object', properties: { unit: { type: 'string' }, path: { type: 'string' } }, required: ['unit', 'path'] } },
}, required: ['written'] }
const ISSUES = { type: 'object', properties: { issues: { type: 'array', items: { type: 'string' } } }, required: ['issues'] }

phase('Plan')
const p = await agent(`You are the game designer. Following the game-designer level-design skill ("Progression: the order ideas arrive"), read the project profile, ${progression} and ${design}, the balance targets and any existing level briefs and level data. Do not edit files. Report:
- units: the units to brief, in play order: ${wanted.length ? wanted.join(', ') : 'every unit in the progression whose brief is missing any of the five points'}. already_briefed: units in that range whose brief is already finished (they stay as they are but count in the sequence).
- ideas: the idea inventory for this range (every mechanic, rule variant, obstacle or tool the player must learn here), each with the ideas it needs first and where the design docs define it.
- output_path: ${output}; owned: whether the project profile gives the game designer that path.
- brief_format: the shape existing briefs use (headings or fields), so the new ones match it and author-level reads them; example: the path of the closest existing brief, empty if none.
- targets: the balance targets page and the target success rate and duration range it sets for these units, empty if none.
- gaps: anything that stops briefs being written (an idea with no definition, more new ideas than units, a unit count the design docs leave open). Empty if none.
- doc_plan: Diataxis kind and page for each doc this touches (the progression table and briefs are reference; why the order is so is explanation).`, { schema: PLAN, phase: 'Plan', label: 'plan' })
if (!p) return 'level-briefs: planning failed; nothing written.'
if (!p.owned) return `level-briefs: blocked; ${p.output_path} is not a path the project profile gives the game designer. Hand the set to its owner or get the profile changed.`
if (!p.units.length) return 'level-briefs: nothing to do; every unit in range already has a finished brief.'
if ((p.gaps || []).length) return { status: 'blocked', reason: 'the design docs do not settle this set yet', gaps: p.gaps, next: 'settle the open ideas with design-feature or the design-spec skill, then run level-briefs again' }

phase('Sequence')
const sq = await agent(`Following the game-designer level-design skill (progression steps 2-5), lay out the sequence for these units in play order: ${p.units.join(', ')}${(p.already_briefed || []).length ? ` (already briefed and fixed: ${p.already_briefed.join(', ')})` : ''}.
Ideas and dependencies: ${JSON.stringify(p.ideas)}. Targets: ${p.targets || 'none written; give relative difficulty only'}.
For each unit give: the one idea it is about, its role in that idea's arc (introduce, develop, twist, test, or rest), intended difficulty on a 1-10 scale relative to the set, and the difficulty levers it uses (goal size and variety first, then complexity, then scarcity, then time pressure and precision last). Rules: at most one new idea per unit; no idea before the ideas it needs; introductions are safe; the curve rises with a sawtooth, a rest after each spike, never two maximum spikes in a row. Return rows, the same as a markdown table, and problems: any rule the set cannot meet as given (empty if none). Do not edit files.`, { schema: SEQ, phase: 'Sequence', label: 'sequence' })
if (!sq) return 'level-briefs: sequencing failed; nothing written.'
if ((sq.problems || []).length) return { status: 'blocked', reason: 'the set breaks the progression rules', problems: sq.problems, sequence: sq.table, next: 'change the unit count or the idea order in the design docs, then run again' }

const draftPrompt = (row, fix) => `Following the game-designer level-design skill ("Designing one level", step 1), write the brief for unit ${row.unit}. Its place in the set: ${JSON.stringify(row)}. Whole sequence:\n${sq.table}
Give the five points author-level checks for: ${FIVE}. Make them concrete and checkable: the duration as a time or move range, the success rate as a number matching ${p.targets || 'the set\'s relative difficulty'} for this unit's place, the feeling as one or two words a playtester could confirm, the takeaway as a sentence starting "The player knows". Also give its role, levers, first_contact (where the player first meets the idea and why it is safe; for a test or rest unit, which earlier ideas it mixes) and notes for the author (anything the data must do, never a layout). Use only the project's own design, never another game's level data.${fix ? `\nThis is a redraft. Fix: ${fix}` : ''} Do not edit files.`

phase('Draft')
const rows = sq.rows.filter(r => p.units.includes(r.unit))
const lost = p.units.filter(u => !rows.some(r => r.unit === u))
if (lost.length) return { status: 'blocked', reason: 'the sequence left units out', units: lost, sequence: sq.table }
const drafted = await pipeline(rows, r => agent(draftPrompt(r), { schema: BRIEF, phase: 'Draft', label: `draft:${r.unit}` }))
const briefs = {}
rows.forEach((r, i) => { if (drafted[i]) briefs[r.unit] = drafted[i] })
const failed = rows.filter(r => !briefs[r.unit]).map(r => r.unit)
if (failed.length) return { status: 'blocked', reason: 'some briefs did not draft', units: failed, sequence: sq.table }

let open = []
let setOpen = []
for (let round = 1; round <= 3; round++) {
  if (round === 1) phase('Check')
  const c = await agent(`You did not write these briefs and must not assume their intent beyond them and the design docs (${design}). Following the game-designer level-design skill, check the set as author-level and a first-time player would:
- each brief states all five points (${FIVE}) concretely enough to check: a duration range, a success-rate number, a feeling a playtester can confirm, a takeaway the player could say;
- each unit has one new idea at most, and no idea appears before the ideas it needs (${JSON.stringify(p.ideas)});
- introductions are safe, the curve has rests after spikes and never two maximum spikes in a row, and success rates fall where ${p.targets || 'the relative difficulty'} says they should;
- no two units do the same job (each teaches, tests or lets the player express something the others do not).
Sequence:\n${sq.table}\nBriefs: ${JSON.stringify(briefs)}
Return findings per unit (unit, problem) and set_findings for problems that no single brief can fix. Do not edit files.`, { schema: CHECK, phase: round === 1 ? 'Check' : 'Revise', label: `check:${round}`, independent: true })
  if (!c) { open = [{ unit: '*', problem: 'brief check did not return; the set is unverified' }]; break }
  open = c.findings || []
  setOpen = c.set_findings || []
  if (setOpen.length) break
  if (!open.length) break
  log(`round ${round}: ${open.length} findings`)
  if (round === 3) break
  phase('Revise')
  const flagged = rows.filter(r => open.some(f => f.unit === r.unit))
  const redone = await pipeline(flagged, r => agent(draftPrompt(r, open.filter(f => f.unit === r.unit).map(f => f.problem).join('; ')), { schema: BRIEF, phase: 'Revise', label: `redraft:${r.unit}:${round}` }))
  flagged.forEach((r, i) => { if (redone[i]) briefs[r.unit] = redone[i] })
}
if (setOpen.length) return { status: 'blocked', reason: 'the set needs a sequence or design change', findings: setOpen, sequence: sq.table, briefs }
if (open.length) return { status: 'blocked', reason: 'briefs still open after two revisions', findings: open, sequence: sq.table, briefs }

phase('Write')
const w = await agent(`Write these briefs to ${p.output_path}, one per unit, in the project's brief format (${p.brief_format}${p.example ? `, shaped like ${p.example}` : ''}). Label the five points so author-level finds them: Idea, Feeling, Duration, Target success rate, Takeaway (what the player knows afterwards); add role, levers, first contact and notes below them. Edit briefs only: no level data, no targets, no other unit's finished brief. Keep any license header the project requires on new files.\nBriefs: ${JSON.stringify(rows.map(r => briefs[r.unit]))}\nReturn each unit and the path (and heading, if several share a page) of its brief.`, { schema: WRITE, phase: 'Write', label: 'write' })
if (!w) return { status: 'blocked', reason: 'writing briefs failed; inspect the working tree', briefs }

phase('Docs')
const docs = await agent(`${DOCS_FRAGMENT}\nPlanned pages: ${JSON.stringify(p.doc_plan)}. Add or update each unit's row in the progression table (unit, idea, role, levers, target success rate, brief link), leaving the data file column empty until author-level fills it. Record why the ideas arrive in this order in the explanation page if the order is new or changed.\nSequence:\n${sq.table}\nBriefs written: ${JSON.stringify(w.written)}`, { phase: 'Docs', label: 'docs' })

phase('Docs check')
// The check only reads, so it stays independent of the docs it judges;
// fixes are their own step, followed by a fresh check.
const docCheckPrompt = `Review the documentation pages touched for these briefs (${docs}). Each page holds one Diataxis kind (reference describes, explanation holds the why), opens with a line naming its kind and audience, titles follow the pattern, and pages link each other. Read-only: do not edit anything; return remaining issues.`
let check = docs ? await agent(docCheckPrompt, { schema: ISSUES, phase: 'Docs check', label: 'docs-check', independent: true }) : null
if (check && (check.issues || []).length) {
  const docFix = await agent(`Fix these documentation problems with the smallest edits, touching only the pages they name; leave anything that needs a content decision:\n- ${check.issues.join('\n- ')}`, { phase: 'Docs check', label: 'docs-fix' })
  if (docFix) check = await agent(docCheckPrompt, { schema: ISSUES, phase: 'Docs check', label: 'docs-recheck', independent: true })
}
const docIssues = check ? check.issues : ['docs check did not run; docs unverified']

return {
  status: !docs ? 'docs missing' : docIssues.length ? 'docs missing' : 'done',
  briefs: w.written,
  sequence: sq.table,
  docs: docs || 'docs step failed',
  doc_issues: docIssues,
  next: `The briefs and docs are written but not committed: land them with engineering-practices deliver-package or small-change. Then build each unit with /game-designer:author-level { brief: "<its brief path>" } in play order, and run balance-pass over the set.`,
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)

// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'design-feature',
  description: 'Take a feature or system from experience goal to a reviewed, implementable and testable spec with its playtest plan and Diataxis docs. Use when a new mechanic, system or content type needs designing. args: { feature: "<what to design>", goal: "<intended player experience, optional>" }',
  phases: [
    { title: 'Frame', detail: 'experience goal, systems touched, doc kinds via the compass' },
    { title: 'Spec', detail: 'write the spec and decision record' },
    { title: 'Review', detail: 'implementer, tester and exploit-hunter read-throughs in parallel' },
    { title: 'Revise', detail: 'close gaps, up to three rounds' },
    { title: 'Playtest plan', detail: 'questions, method, success criteria' },
    { title: 'Docs', detail: 'update every planned doc page in the same change' },
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

const feature = args && args.feature
if (!feature) return 'Usage: design-feature with args { feature: "<what to design>", goal: "<intended player experience, optional>" }'
const goal = (args && args.goal) || 'the experience goals and pillars in the project design docs (propose some if none exist)'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs/<kind>/ (per its profile), keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const FRAME = { type: 'object', properties: {
  problem: { type: 'string' }, goals: { type: 'array', items: { type: 'string' } },
  systems: { type: 'array', items: { type: 'string' } },
  spec_path: { type: 'string' }, decision_path: { type: 'string' },
  doc_plan: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] }, page: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'page'] } },
}, required: ['problem', 'systems', 'spec_path', 'doc_plan'] }
const GAPS = { type: 'object', properties: { gaps: { type: 'array', items: { type: 'string' } } }, required: ['gaps'] }

phase('Frame')
const f = await agent(`You are the game designer. Follow the game-designer systems-design skill for: ${feature}. Experience goal: ${goal}. Read the project's design docs and profile first. Return the one-sentence problem statement, experience goals, the systems touched, where the spec page should live (spec_path) and the decision record (decision_path) per the project's docs layout, and a doc plan: for each affected page, its Diataxis kind chosen with the compass (spec and numbers are reference, rationale is explanation, new authoring procedures are how-to, onboarding changes are tutorial). Do not write files yet.`, { schema: FRAME, phase: 'Frame', label: 'frame' })
if (!f) return 'design-feature: framing failed; no spec written.'

phase('Spec')
const written = await agent(`Follow the game-designer design-spec skill. Write the reference spec for "${feature}" at ${f.spec_path}, organised by system (${f.systems.join(', ')}), with state, numbered rules, numbers tables, edge cases, interactions, feedback, acceptance checks and certainty tags. Problem: ${f.problem}. Goals: ${(f.goals || []).join('; ')}. Write the rationale as an explanation page (ADR style: context, options, decision, consequences) at ${f.decision_path || 'the project\'s explanation folder'}. Return the paths written.`, { phase: 'Spec', label: 'spec' })
if (!written) return 'design-feature: spec writing failed.'

const reviewers = [
  ['implementer', 'Act as the gameplay-programmer. List every question you would need answered to implement this spec, every ambiguous term, missing number, unordered simultaneous event or undefined state.'],
  ['tester', 'Act as QA. Derive test cases from the acceptance checks; list rules with no check, checks that cannot be run, and edge cases with no expected result.'],
  ['exploit', 'Act as an expert player trying to break it. Following the systems-design and economy-balance skills, list degenerate strategies, runaway feedback loops, resources without sinks, and choices with one right answer.'],
]
let open = []
for (let round = 1; round <= 3; round++) {
  phase(round === 1 ? 'Review' : 'Revise')
  const results = await parallel(reviewers.map(([who, task]) => () => agent(`${task} Spec: ${f.spec_path}. Do not edit files. Return gaps as short, specific items citing rule IDs.`, { schema: GAPS, phase: round === 1 ? 'Review' : 'Revise', label: `${who}:${round}` })))
  const crashed = reviewers.filter((r, i) => !results[i]).map(r => r[0])
  open = results.filter(Boolean).flatMap(r => r.gaps)
  if (crashed.length) open.push(`reviewer(s) did not return, spec unverified from their angle: ${crashed.join(', ')}`)
  if (!open.length) break
  log(`round ${round}: ${open.length} gaps`)
  if (round === 3) break
  const fixed = await agent(`Following the game-designer design-spec skill, close these gaps in ${f.spec_path} (and the decision record if a choice changed). Mark anything you cannot settle [open] with an owner.\n- ${open.join('\n- ')}\nReturn what changed.`, { phase: 'Revise', label: `revise:${round}` })
  if (!fixed) return `design-feature: blocked; revision failed with open gaps:\n- ${open.join('\n- ')}`
}
if (open.length) return `design-feature: blocked after 3 review rounds. Open gaps in ${f.spec_path}:\n- ${open.join('\n- ')}`

phase('Playtest plan')
const plan = await agent(`Following the game-designer playtesting skill, write a playtest plan for "${feature}" (questions tied to the goals, method per question, players, success criteria, neutral script). Put it where the project keeps playtest records (reference). Return the path.`, { phase: 'Playtest plan', label: 'playtest-plan' })
if (!plan) log('playtest plan not written; listed as open in the result')

phase('Docs')
const docs = await agent(`${DOCS_FRAGMENT}\nPlanned pages: ${JSON.stringify(f.doc_plan)}. Already written: ${f.spec_path} (reference) and the decision record (explanation). Update any index or landing page that should link them, and tell the gameplay-programmer's next work item which rule IDs and numbers are new (write it in the hand-off note the project uses).`, { phase: 'Docs', label: 'docs' })
if (!docs) return 'design-feature: docs step failed; the change is not done until its docs are written.'

phase('Docs check')
const check = await agent(`Review every documentation page touched for "${feature}" (${f.spec_path}, the decision record, and: ${docs}). Check: each page holds one Diataxis kind only (no instructions or opinion in reference, no reference tables or steps in explanation), how-to titles name a goal, explanation titles read "About ...", each page opens with a line saying its kind and audience, and the pages link to each other. Fix what you can; return remaining problems.`, { schema: GAPS, phase: 'Docs check', label: 'docs-check' })
const docIssues = check ? check.gaps : ['docs check did not run; docs unverified']

return { status: 'done', feature, spec: f.spec_path, decision: f.decision_path, playtest_plan: plan || 'not written', docs, doc_issues: docIssues }
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)

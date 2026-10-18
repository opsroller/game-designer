// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'balance-pass',
  description: 'Simulate a set of content units (levels, encounters, items) in parallel against written targets, fit the difficulty curve, apply the smallest data changes and document them. Use when tuning a level set or economy. args: { units: ["<content file or id>", ...], targets: "<targets page, optional>", apply: true|false (default false: propose only) }',
  phases: [
    { title: 'Plan', detail: 'targets, simulator, doc kinds via the compass' },
    { title: 'Simulate', detail: 'one agent per unit, results only' },
    { title: 'Curve', detail: 'fit proposals to the whole sequence' },
    { title: 'Apply', detail: 'one agent edits data files and re-simulates' },
    { title: 'Docs', detail: 'balance reference and rationale in the same change' },
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

const units = args && Array.isArray(args.units) ? args.units : []
if (!units.length) return 'Usage: balance-pass with args { units: ["<content file or id>", ...], targets: "<targets page, optional>", apply: false }'
const targets = (args && args.targets) || 'the balance targets reference page in the project design docs'
const apply = !!(args && args.apply)

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs/<kind>/ (per its profile), keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = { type: 'object', properties: {
  targets_found: { type: 'boolean' }, simulator: { type: 'string' }, strategies: { type: 'array', items: { type: 'string' } },
  runs: { type: 'number' }, doc_plan: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string' }, page: { type: 'string' } }, required: ['kind', 'page'] } },
}, required: ['targets_found', 'simulator', 'strategies', 'doc_plan'] }
const SIM = { type: 'object', properties: {
  unit: { type: 'string' }, table: { type: 'string' },
  verdict: { type: 'string', enum: ['too easy', 'on target', 'too hard'] },
  proposal: { type: 'string' },
}, required: ['unit', 'verdict', 'table'] }
const ISSUES = { type: 'object', properties: { issues: { type: 'array', items: { type: 'string' } } }, required: ['issues'] }

phase('Plan')
const p = await agent(`You are the game designer. Following the game-designer economy-balance skill, read ${targets} and the project profile. Report whether targets exist, the command that runs the balance simulator headless, the bot strategies available (at least three: random, greedy, goal-aware), runs per unit, and a doc plan: Diataxis kind and page for each doc this pass will touch (targets and current values are reference; why a curve is shaped so is explanation). Do not edit files.`, { schema: PLAN, phase: 'Plan', label: 'plan' })
if (!p) return 'balance-pass: planning failed.'
if (!p.targets_found) return `balance-pass: blocked; no balance targets found at ${targets}. Write the targets reference first (economy-balance step 1).`

const sims = await pipeline(units, u => agent(`Following the game-designer economy-balance skill and its simulation.md reference, run ${p.simulator} on ${u} for every difficulty with strategies ${p.strategies.join(', ')}, ${p.runs || 'enough'} runs each, fixed recorded seeds. Compare to ${targets}. Do not edit any file. Return the PR summary table as markdown, a verdict, and if off target the smallest data change that fixes it.`, { schema: SIM, phase: 'Simulate', label: `sim:${u}` }))
const results = units.map((u, i) => sims[i] || { unit: u, verdict: 'unverified', table: 'simulation did not return' })
const unverified = results.filter(r => r.verdict === 'unverified').map(r => r.unit)

phase('Curve')
const curve = await agent(`Simulation results for a content sequence, in play order:\n${JSON.stringify(results)}\nFollowing the game-designer economy-balance and level-design skills, check the curve rises as intended with rests after spikes, adjust per-unit proposals to fit the whole curve (one variable per unit where possible), and return a markdown table: unit, current value, proposed change, reason. Units marked unverified stay unchanged and listed. Do not edit files.`, { phase: 'Curve', label: 'curve' })
if (!curve) return { status: 'blocked', reason: 'curve fitting failed', results }

let applied = 'not applied (apply: false); proposals only'
if (apply) {
  phase('Apply')
  const a = await agent(`Apply these balance changes to the content data files your project profile says the game designer owns, in a single edit per file, then re-run ${p.simulator} on each changed unit and confirm it is now on target. If a file is not yours to edit, do not edit it; list it for its owner.\n${curve}\nReturn before/after values, re-simulation results, and any unit still off target.`, { phase: 'Apply', label: 'apply' })
  if (!a) return { status: 'blocked', reason: 'apply step failed; data unchanged or partially changed: inspect the working tree', unverified_units: unverified, proposals: curve }
  applied = a
}

phase('Docs')
const docs = await agent(`${DOCS_FRAGMENT}\nPlanned pages: ${JSON.stringify(p.doc_plan)}. Update the balance reference with current values and the latest simulation tables; record why the curve changed in the explanation page if the shape or targets changed. Changes: ${typeof applied === 'string' ? applied : JSON.stringify(applied)}\nProposals:\n${curve}`, { phase: 'Docs', label: 'docs' })

phase('Docs check')
const check = docs ? await agent(`Review the documentation pages touched in this balance pass (${docs}). Each page one Diataxis kind (reference describes values only; explanation holds the why), opens with a line naming its kind and audience, titles follow the pattern, pages link each other. Fix what you can; return remaining issues.`, { schema: ISSUES, phase: 'Docs check', label: 'docs-check' }) : null

return {
  status: unverified.length ? 'incomplete' : docs ? 'done' : 'docs missing',
  unverified_units: unverified,
  proposals: curve,
  applied,
  docs: docs || 'docs step failed',
  doc_issues: check ? check.issues : ['docs check did not run; docs unverified'],
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)

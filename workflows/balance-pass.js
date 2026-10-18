// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'balance-pass',
  description: 'Simulate a set of content units (levels, encounters, items) in parallel against written targets, fit the difficulty curve, apply the smallest data changes, converge any data value a checker prints (set it, re-run, repeat until stable, bounded rounds) and document them. When no data change can meet a target or curve rule, propose the target change with evidence, checked independently, and hand any simulator or tool fault to its owner instead of editing it (a fault in the tool itself, such as a saturated strategy, leaves its metric unverified and holds no unit). A target change the project\'s decision-maker has already approved is passed in approved_target_changes: it is in force for the pass, and Docs applies exactly those changes to the targets page and records the approval. Use when tuning a level set or economy. args: { units: ["<content file or id>", ...], targets: "<targets page, optional>", apply: true|false (default false: propose only), approved_target_changes: [{ target: "<target as written>", proposed: "<approved text>", approved_by: "<who decided>", recorded: "<where the approval is recorded>" }, ...] (optional) }',
  phases: [
    { title: 'Plan', detail: 'targets, simulator, doc kinds via the compass' },
    { title: 'Simulate', detail: 'one agent per unit, results only' },
    { title: 'Curve', detail: 'fit proposals to the whole sequence; split out unreachable targets and tool faults, per unit or tool-wide' },
    { title: 'Targets', detail: 'only if a target cannot be met by data: evidence-backed target change proposals, independent check' },
    { title: 'Apply', detail: 'one agent edits data files and re-simulates; then each value a checker prints and the data records is converged (set, re-run, repeat until stable, up to five rounds)' },
    { title: 'Docs', detail: 'balance reference and rationale in the same change; approved target changes applied exactly, with their approval recorded' },
    { title: 'Docs check', detail: 'one kind per page, titles, links; up to three checks and two fixes over every page touched while blocking issues remain; minor-only results and issues already on the default branch go straight to the handoff notes; an issue a fix already left ends the loop still blocking' },
    { title: 'Handoff', detail: 'only with apply or approved target changes: commit and push the changed data and docs, re-run the simulator and checks, return a handoff for engineering-practices deliver-package or land-pr' },
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

const units = args && Array.isArray(args.units) ? args.units : []
if (!units.length) return 'Usage: balance-pass with args { units: ["<content file or id>", ...], targets: "<targets page, optional>", apply: false }'
const targets = (args && args.targets) || 'the balance targets reference page in the project design docs'
const apply = !!(args && args.apply)
// Target changes already approved by whoever decides for the targets page:
// in force for this pass, applied by Docs exactly as given, approval recorded.
const approved = args && Array.isArray(args.approved_target_changes) ? args.approved_target_changes : []
const badApproved = approved.filter(c => !c || typeof c !== 'object' || !c.target || !c.proposed || !c.approved_by || !c.recorded)
if (badApproved.length) return 'balance-pass: each approved_target_changes entry needs target, proposed, approved_by and recorded (where the approval is written down); fix the args and run again.'
const approvedLine = approved.length ? ` These target changes are approved and in force for this pass (each replaces the target it names): ${JSON.stringify(approved)}.` : ''

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs/<kind>/ (per its profile), keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = { type: 'object', properties: {
  targets_found: { type: 'boolean' }, simulator: { type: 'string' }, strategies: { type: 'array', items: { type: 'string' } },
  runs: { type: 'number' },
  derived: { type: 'array', items: { type: 'object', properties: {
    value: { type: 'string' }, command: { type: 'string' }, field: { type: 'string' },
  }, required: ['value', 'command'] } },
  doc_plan: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string' }, page: { type: 'string' } }, required: ['kind', 'page'] } },
}, required: ['targets_found', 'simulator', 'strategies', 'doc_plan'] }
const SIM = { type: 'object', properties: {
  unit: { type: 'string' }, table: { type: 'string' },
  verdict: { type: 'string', enum: ['too easy', 'on target', 'too hard'] },
  proposal: { type: 'string' },
}, required: ['unit', 'verdict', 'table'] }
const DOCS_OUT = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages'] }
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, tests_pass: { type: 'boolean' }, problem: { type: 'string' } }, required: ['branch', 'tests_pass'] }
const DOC_CHECK = { type: 'object', properties: { issues: { type: 'array', items: { type: 'object', properties: {
  page: { type: 'string' }, problem: { type: 'string' }, severity: { type: 'string', enum: ['blocking', 'minor'] }, pre_existing: { type: 'boolean' },
}, required: ['problem', 'severity'] } } }, required: ['issues'] }
const DOC_FIX = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, left: { type: 'array', items: { type: 'object', properties: { page: { type: 'string' }, problem: { type: 'string' }, why: { type: 'string' }, severity: { type: 'string', enum: ['blocking', 'minor'] } }, required: ['problem', 'severity'] } } }, required: ['pages'] }
const CURVE = { type: 'object', properties: {
  table: { type: 'string' },
  unreachable: { type: 'array', items: { type: 'object', properties: {
    target: { type: 'string' }, units: { type: 'array', items: { type: 'string' } },
    evidence: { type: 'string' }, why_data_cannot: { type: 'string' },
  }, required: ['target', 'units', 'evidence', 'why_data_cannot'] } },
  tool_faults: { type: 'array', items: { type: 'object', properties: {
    tool: { type: 'string' }, owner: { type: 'string' }, fault: { type: 'string' },
    evidence: { type: 'string' }, units: { type: 'array', items: { type: 'string' } },
    scope: { type: 'string', enum: ['units', 'tool'] }, metric: { type: 'string' },
  }, required: ['tool', 'owner', 'fault', 'evidence', 'scope'] } },
}, required: ['table', 'unreachable', 'tool_faults'] }
const TARGETS = { type: 'object', properties: {
  changes: { type: 'array', items: { type: 'object', properties: {
    target: { type: 'string' }, current: { type: 'string' }, proposed: { type: 'string' },
    evidence: { type: 'string' }, effect: { type: 'string' }, decider: { type: 'string' },
    needs_tool_change: { type: 'string' },
  }, required: ['target', 'current', 'proposed', 'evidence', 'decider'] } },
}, required: ['changes'] }
// A value a checker prints that the data must record, driven to a fixed point.
const CONVERGED = { type: 'object', properties: {
  converged: { type: 'boolean' },
  values: { type: 'array', items: { type: 'object', properties: {
    unit: { type: 'string' }, value: { type: 'string' }, recorded: { type: 'string' }, rounds: { type: 'number' }, stable: { type: 'boolean' },
  }, required: ['value', 'stable'] } },
  open: { type: 'array', items: { type: 'string' } },
}, required: ['converged', 'values'] }
const ROUNDS = 5
const TCHECK = { type: 'object', properties: {
  findings: { type: 'array', items: { type: 'string' } },
}, required: ['findings'] }

phase('Plan')
const p = await agent(`You are the game designer. Following the game-designer economy-balance skill, read ${targets} and the project profile. Report whether targets exist, the command that runs the balance simulator headless, the bot strategies available (at least three: random, greedy, goal-aware), runs per unit, derived values (values a checker, validator or the simulator computes and prints that a content data file must also record, such as a computed par, threshold or total; each with its name, the command that prints it and the data field that records it; empty if none), and a doc plan: Diataxis kind and page for each doc this pass will touch (targets and current values are reference; why a curve is shaped so is explanation). Do not edit files.`, { schema: PLAN, phase: 'Plan', label: 'plan' })
if (!p) return 'balance-pass: planning failed.'
if (!p.targets_found) return `balance-pass: blocked; no balance targets found at ${targets}. Write the targets reference first (economy-balance step 1).`

const sims = await pipeline(units, u => agent(`Following the game-designer economy-balance skill and its simulation.md reference, run ${p.simulator} on ${u} for every difficulty with strategies ${p.strategies.join(', ')}, ${p.runs || 'enough'} runs each, fixed recorded seeds. Compare to ${targets}.${approvedLine} Do not edit any file. Return the PR summary table as markdown, a verdict, and if off target the smallest data change that fixes it.`, { schema: SIM, phase: 'Simulate', label: `sim:${u}` }))
const results = units.map((u, i) => sims[i] || { unit: u, verdict: 'unverified', table: 'simulation did not return' })
const unverified = results.filter(r => r.verdict === 'unverified').map(r => r.unit)

phase('Curve')
const cv = await agent(`Simulation results for a content sequence, in play order:\n${JSON.stringify(results)}\nTargets: ${targets}.${approvedLine}
Following the game-designer economy-balance and level-design skills, check the curve rises as intended with rests after spikes, adjust per-unit proposals to fit the whole curve (one variable per unit where possible), and return as table a markdown table: unit, current value, proposed change, reason. Units marked unverified stay unchanged and listed. Do not edit files.
Then separate what data cannot fix:
- unreachable: a per-unit target or a curve rule (one that compares units) that no value of the data the designer owns can meet, for example a rate already at its ceiling that a rule needs to rise or fall, two targets that contradict each other, or a rule the sequence's own structure breaks on every unit. For each, the target as written, the units, the evidence (the simulation rows, the bounds or arithmetic that show no data value meets it) and why a data change cannot. Do not list a target that a larger data change would meet; propose that change in the table instead. Leave those units' rows unchanged in the table.
- tool_faults: results that come from the simulator, a bot or another tool rather than the data (a rule implemented differently from the spec, a metric that saturates or ties, a strategy that plays nothing like a player, a crash). For each, the tool, its owner role from the project profile's path ownership, the fault, the evidence, the units affected, the metric it spoils, and its scope: "tool" when the fault is in the tool itself whatever the data (a strategy that wins every unit, a metric pinned at its ceiling or floor everywhere, a crash on any input), so no unit's data is at fault and retuning cannot help; "units" when only some units' results are spoiled (a rule the tool gets wrong that only those units use). A tool-wide fault does not hold units: judge each unit on the metrics the fault does not spoil, propose data changes from those, and say in the table which metric is unverified. Never edit a tool.
Both lists are empty when everything can be fixed in data.`, { schema: CURVE, phase: 'Curve', label: 'curve' })
if (!cv) return { status: 'blocked', reason: 'curve fitting failed', results }
const curve = cv.table
const unreachable = cv.unreachable || []
const faults = cv.tool_faults || []
// A fault that names every unit is the tool's, not the units', whatever
// scope it was given: it holds no unit, it leaves its metric unverified.
const toolWide = f => f.scope === 'tool' || (units.length > 1 && units.every(u => (f.units || []).includes(u)))
const unitFaults = faults.filter(f => !toolWide(f))
const wideFaults = faults.filter(toolWide)
const unmeasured = wideFaults.map(f => `${f.metric || 'results'} (${f.tool}: ${f.fault})`)

let targetChanges = []
let targetFindings = []
if (unreachable.length) {
  phase('Targets')
  const t = await agent(`Following the game-designer economy-balance skill (targets come before tuning, a balance change is a hypothesis), these targets in ${targets}${approved.length ? ' (with the approved changes in force)' : ''} cannot be met by any data change:\n${JSON.stringify(unreachable)}\nFor each, propose the smallest change to the target itself that keeps its intent (what experience the target protects): the current text, the proposed text, the evidence from the simulation, its effect on the other units and targets (which units then pass or fail, from the results above: ${JSON.stringify(results)}), who decides (the owner of the targets page in the project profile, or whoever the project names for design decisions), and, if the simulator or checker hard-codes the rule, the tool change that must follow, for its owner. Do not edit any file: a target changes only when its owner accepts it.`, { schema: TARGETS, phase: 'Targets', label: 'targets' })
  if (!t) return { status: 'blocked', reason: 'target proposal step failed', unreachable, tool_faults: faults, proposals: curve }
  targetChanges = t.changes || []
  const tc = await agent(`You did not write these proposals. Check each proposed target change for ${targets} against the simulation results and the targets' intent. Report a finding when: the evidence does not show that data cannot meet the current target (a data change would), the proposal drops what the target protects, it makes another unit or target fail without saying so, or a needed tool change is missing. Do not edit files.\nProposals: ${JSON.stringify(targetChanges)}\nResults: ${JSON.stringify(results)}`, { schema: TCHECK, phase: 'Targets', label: 'check:targets', independent: true })
  targetFindings = tc ? tc.findings || [] : ['target proposal check did not return; proposals unverified']
}
const held = [...new Set([...unreachable.flatMap(u => u.units || []), ...unitFaults.flatMap(f => f.units || [])])]
const handoffs = [
  ...faults.map(f => ({ owner: f.owner, tool: f.tool, change: f.fault, evidence: f.evidence, units: f.units || [], scope: toolWide(f) ? 'tool' : 'units' })),
  ...targetChanges.filter(c => c.needs_tool_change).map(c => ({ owner: 'owner of the tool that encodes this target (see project profile)', tool: c.needs_tool_change, change: `follow the target change "${c.proposed}" once accepted`, evidence: c.evidence, units: [] })),
]

let applied = 'not applied (apply: false); proposals only'
let converged = null
let unconverged = []
if (apply) {
  phase('Apply')
  const a = await agent(`Apply these balance changes to the content data files your project profile says the game designer owns, in a single edit per file, then re-run ${p.simulator} on each changed unit and confirm it is now on target. If a file is not yours to edit, do not edit it; list it for its owner. Never edit the simulator, a bot, a checker or the targets page.${held.length ? ` Leave these units unchanged: their results wait on a target decision or a tool fix (${held.join(', ')}).` : ''}${unmeasured.length ? ` These metrics are spoiled by a tool fault for every unit, so do not tune toward them or read them as confirmation: ${unmeasured.join('; ')}.` : ''}\n${curve}\nReturn before/after values, re-simulation results, and any unit still off target.`, { phase: 'Apply', label: 'apply' })
  if (!a) return { status: 'blocked', reason: 'apply step failed; data unchanged or partially changed: inspect the working tree', unverified_units: unverified, proposals: curve }
  applied = a
  // Converge each derived value on the changed units: set the field to what
  // the checker prints, re-run, repeat until a re-run prints what the data
  // records, bounded; a value still moving holds the handoff.
  if ((p.derived || []).length) {
    const cg = await agent(`Converge these values in every content data file the Apply step changed; a checker prints each and the data must record it:\n${p.derived.map(x => `- ${x.value}: printed by ${x.command}${x.field ? `, recorded in ${x.field}` : ''}`).join('\n')}\nChanges applied: ${JSON.stringify(a)}\nFor each value in each changed file: run its command, set the data field to the value it prints (data only, only files the project profile gives the game designer; never the checker, the simulator or the targets page), then run the command again and ${p.simulator} on that unit. Repeat until a re-run prints the value the data records, up to ${ROUNDS} rounds per value. Return converged (every value stable), values (each with the unit, the value, what the data now records, the rounds it took, stable), and open: any value not stable after ${ROUNDS} rounds, with the unit and the last values seen.`, { schema: CONVERGED, phase: 'Apply', label: 'converge' })
    converged = cg || { converged: false, values: [], open: ['converge step did not return; derived values unverified'] }
    if (!converged.converged) unconverged = (converged.open || []).length ? converged.open : [`derived values not stable after ${ROUNDS} rounds`]
  }
}

phase('Docs')
const docs = await agent(`${DOCS_FRAGMENT}\nPlanned pages: ${JSON.stringify(p.doc_plan)}. Update the balance reference with current values and the latest simulation tables${unmeasured.length ? `, marking these metrics unverified until their tool is fixed: ${unmeasured.join('; ')}` : ''}; record why the curve changed in the explanation page if the shape changed.${converged && (converged.values || []).length ? ` Record the converged values: ${JSON.stringify(converged.values)}.` : ''} ${approved.length ? `Apply exactly these approved target changes to the targets page, each replacing the target it names and nothing else, and record with each who approved it and where that approval is recorded: ${JSON.stringify(approved)}. Change no other target: any other proposed target change is not accepted yet and goes in the pull request, not the reference.` : 'Do not change the targets themselves: proposed target changes are not accepted yet and go in the pull request, not the reference.'} Changes: ${typeof applied === 'string' ? applied : JSON.stringify(applied)}\nProposals:\n${curve}\nReturn pages: the paths of every page touched, and undocumented: any change left undocumented, with why.`, { schema: DOCS_OUT, phase: 'Docs', label: 'docs' })

phase('Docs check')
// The check only reads, so it stays independent of the docs it judges;
// fixes are their own step, followed by a fresh check of every page touched
// so far (pages a fix added included). Up to three checks and two fixes,
// only while a blocking issue remains; minor issues go to the handoff notes,
// blocking ones left at the end stop it.
const docCheckPrompt = (pages) => `Review the documentation pages touched in this balance pass: ${JSON.stringify(pages)}. Each page one Diataxis kind (reference describes values only; explanation holds the why), opens with a line naming its kind and audience, titles follow the pattern, pages link each other. Give each issue the page, the problem and a severity: blocking when a page mixes kinds, is missing, has a broken link or says something wrong; minor for wording, a title that could follow the pattern more closely, or a cross-link a reader can do without. ${approved.length ? ` The targets page must carry exactly these approved changes, each with who approved it and where the approval is recorded, and no other target change; anything else is blocking: ${JSON.stringify(approved)}.` : ''} ${DOC_SCOPE} Read-only: do not edit anything; return remaining issues.`
// Judge what this work caused: an issue already true on the default branch,
// independent of this work, is pre-existing, reported as minor so it goes to
// the notes and never holds the run or starts a fix. Anything this work made
// wrong stays blocking, even in a line it did not touch.
const DOC_SCOPE = 'Judge what this work caused, not the pages\' whole history: an issue is pre_existing: true only when the same issue is already true on the default branch at its merge base, independent of this work (check the page there to confirm); report it, but it never counts as blocking. Anything this work made wrong is not pre-existing, in whatever line it sits: a value or table its data change made stale, a link to a page it moved or renamed, a count now off.'
const PRE = 'pre-existing (already on the default branch): '
const docIssue = i => typeof i === 'string' ? { problem: i, severity: 'blocking' }
  : i.pre_existing ? Object.assign({}, i, { severity: 'minor', problem: String(i.problem || '').startsWith(PRE) ? i.problem : PRE + (i.problem || '') })
  : Object.assign({ severity: 'blocking' }, i)
const docText = i => i.page ? `${i.page}: ${i.problem}` : i.problem
let docPages = docs ? [...(docs.pages || [])] : []
let docIssueList = docs ? [] : [{ problem: 'docs check did not run; docs unverified', severity: 'blocking' }]
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
for (let round = 1; docs && round <= 3; round++) {
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
const docBlocking = docIssueList.filter(i => i.severity !== 'minor')

const decisions = targetChanges.length > 0
const result = {
  status: unverified.length || unconverged.length ? 'incomplete' : !docs || docBlocking.length ? 'docs missing' : decisions || held.length ? 'needs decision' : 'done',
  unverified_units: unverified,
  proposals: curve,
  target_changes: targetChanges,
  target_check: targetFindings,
  handoffs,
  held_units: held,
  unverified_metrics: unmeasured,
  applied,
  converged: converged ? converged.values || [] : [],
  unconverged,
  approved_target_changes: approved,
  docs: docs ? Object.assign({}, docs, { pages: docPages }) : 'docs step failed',
  doc_issues: docIssueList.map(docText),
  next: decisions || handoffs.length
    ? `${decisions ? 'Send target_changes, with their evidence and target_check, to the decider each names; once accepted, update the targets reference. ' : ''}${handoffs.length ? 'Send each handoff to its owner role (engineering-practices peer-coordination); do not edit their tools. ' : ''}${held.length ? 'Then re-run balance-pass on held_units.' : 'Once the tool is fixed, re-run balance-pass to confirm unverified_metrics.'}`
    : 'playtest the changed units; commit data and docs in one pull request (engineering-practices deliver-package or small-change)',
}
if (unconverged.length) result.next = `Derived values did not settle within ${ROUNDS} rounds (unconverged): find what makes the checker's value move with the data (a value that feeds back into its own computation, a non-fixed seed), settle it, then re-run balance-pass with apply on the same units. ${result.next}`
// With apply false and no approved target change nothing changed, so there
// is nothing to hand off.
if ((!apply && !approved.length) || ['incomplete', 'docs missing'].includes(result.status)) return result

// The handoff is what engineering-practices deliver-package takes as
// prior, so the applied pass ships without being simulated again.
phase('Handoff')
const hand = await agent(`Hand off this balance pass. If you are on the default branch, cut a Conventional branch (fix/<slug>) from the latest remote default branch; otherwise stay on the current feature branch. Commit ${apply ? 'the content data files the Apply step changed and ' : ''}the docs pages (${docPages.join(', ') || 'as written'})${approved.length ? ', including the targets page with the approved target changes and their approval record' : ''} as Conventional Commits, and push; leave held units (${held.join(', ') || 'none'}), tools and ${approved.length ? 'every other target' : 'the targets page'} as they are. On the pushed head run the checks that apply: ${p.simulator} on each ${apply ? 'changed unit' : 'unit'}, any data validator or load test, the project's test suite and any docs or link check its profile names. Do not open, mark ready or merge a PR: the engineering-practices workflow named in the result does that. Follow the engineering-practices git-workflow skill. Return the branch, any open PR, the head commit SHA, whether those checks pass on that head, and the problem if not.`, { schema: HANDOFF, phase: 'Handoff', label: 'handoff' })
if (!hand || !hand.branch) return { status: 'blocked', reason: hand && hand.problem ? hand.problem : 'handoff step returned nothing; the changed data and docs may be uncommitted', unverified_units: unverified, proposals: curve }
if (!hand.tests_pass) return { status: 'blocked', reason: `checks fail on ${hand.branch}${hand.head_sha ? ' at ' + hand.head_sha : ''}: ${hand.problem || 'no details'}`, unverified_units: unverified, proposals: curve }
result.handoff = {
  from: 'game-designer:balance-pass',
  branch: hand.branch,
  pr: hand.pr || '',
  head_sha: hand.head_sha || '',
  tests_pass: true,
  docs: docPages,
  undocumented: docs.undocumented || [],
  notes: [
    ...(held.length ? [`held unchanged, waiting on a target decision or a tool fix: ${held.join(', ')}`] : []),
    ...(unmeasured.length ? [`unverified until a tool fix (tool-wide fault, no unit held): ${unmeasured.join('; ')}`] : []),
    ...(decisions ? ['proposed target changes are not applied; they go in the PR body for their decider'] : []),
    ...approved.map(c => `approved target change applied: ${c.target} -> ${c.proposed} (approved by ${c.approved_by}; recorded in ${c.recorded})`),
    ...result.doc_issues.map(d => 'docs check: ' + d),
  ],
}
result.next = decisions || handoffs.length
  ? `${result.next} Meanwhile, for the changes already applied: ship it without rebuilding: /engineering-practices:deliver-package { wp: "<the package>", prior: <this result> }; with no work package, /engineering-practices:land-pr { branch: "<handoff.branch>" }`
  : 'playtest the changed units; ship it without rebuilding: /engineering-practices:deliver-package { wp: "<the package>", prior: <this result> }; with no work package, /engineering-practices:land-pr { branch: "<handoff.branch>" }'
return result
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)

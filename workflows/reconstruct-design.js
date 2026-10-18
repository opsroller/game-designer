// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'reconstruct-design',
  description: 'Reconstruct an existing game\'s design from public observation into a sourced, original rules spec: map systems, research each in parallel, verify claims independently, write the spec and its docs. Use when remaking or matching a reference game. args: { reference: "<game, version and platform>", systems: ["<system>", ...] (optional: mapped if omitted) }',
  phases: [
    { title: 'Plan', detail: 'scope, system map, doc kinds via the compass' },
    { title: 'Observe', detail: 'one agent per system, evidence only' },
    { title: 'Verify', detail: 'independent check of each system\'s claims' },
    { title: 'Spec', detail: 'one agent writes spec and evidence log' },
    { title: 'Docs', detail: 'reference, deviations explanation, sources' },
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

const reference = args && args.reference
if (!reference) return 'Usage: reconstruct-design with args { reference: "<game, version and platform>", systems: ["<system>", ...] }'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project\'s docs/<kind>/ (per its profile), keep each page to one kind, title it by the project pattern, and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = { type: 'object', properties: {
  scope: { type: 'string' }, systems: { type: 'array', items: { type: 'string' } },
  spec_path: { type: 'string' }, evidence_path: { type: 'string' },
  doc_plan: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string' }, page: { type: 'string' } }, required: ['kind', 'page'] } },
}, required: ['scope', 'systems', 'spec_path', 'evidence_path', 'doc_plan'] }
const OBS = { type: 'object', properties: {
  system: { type: 'string' },
  sources: { type: 'array', items: { type: 'string' } },
  rules: { type: 'array', items: { type: 'object', properties: {
    id: { type: 'string' }, rule: { type: 'string' }, evidence: { type: 'string' },
    status: { type: 'string', enum: ['confirmed', 'verify', 'chosen'] } }, required: ['id', 'rule', 'status'] } },
  observation_log: { type: 'string' },
}, required: ['system', 'rules', 'observation_log'] }
const CHECK = { type: 'object', properties: {
  downgrade: { type: 'array', items: { type: 'string' } }, copied: { type: 'array', items: { type: 'string' } },
}, required: ['downgrade', 'copied'] }

phase('Plan')
const p = await agent(`You are the game designer. Following the game-designer design-reconstruction skill (steps 1-2), scope the reference "${reference}": name the exact version and platform, and ${args.systems ? `use these systems: ${args.systems.join(', ')}` : 'map its systems from full-session footage'}. Choose spec_path and evidence_path per the project's docs layout (both reference), and a doc plan with Diataxis kinds (spec and evidence are reference; deviations from the original and why are explanation; sources go to the project's sources/credits reference page). Do not write files.`, { schema: PLAN, phase: 'Plan', label: 'plan' })
if (!p) return 'reconstruct-design: planning failed.'

const observed = await pipeline(p.systems, s => agent(`Following the game-designer design-reconstruction skill and its observation-log.md reference, research the "${s}" system of ${p.scope} from public sources (footage with timestamps, manual, guides). Measure timings by frame count. Write observations in your own words; copy no text, art, audio, code or data. Infer the simplest rules that explain all observations, tag each confirmed (two independent level 1-3 sources, or a repeated level-1 observation), verify or chosen. Do not write files; return the rules and the observation log as markdown.`, { schema: OBS, phase: 'Observe', label: `observe:${s}` }))
const systems = p.systems.map((s, i) => observed[i] || { system: s, rules: [], observation_log: 'research did not return', failed: true })

const checks = await pipeline(systems.filter(s => !s.failed), s => agent(`Independently check these reconstructed rules for "${s.system}" of ${p.scope}. For each rule tagged confirmed, open its cited evidence and confirm it supports the rule; list rule IDs to downgrade to verify, with reason. List any passage that looks copied from a source rather than written in own words. Do not edit files.\n${JSON.stringify(s.rules)}`, { schema: CHECK, phase: 'Verify', label: `verify:${s.system}`, independent: true }))
const checked = systems.filter(s => !s.failed)
const verdicts = checked.map((s, i) => ({ system: s.system, check: checks[i] || null }))
const unverifiedSystems = verdicts.filter(v => !v.check).map(v => v.system)

phase('Spec')
const spec = await agent(`Following the game-designer design-spec and design-reconstruction skills, write the reconstructed rules spec for ${p.scope} at ${p.spec_path} (reference, organised by system) and the evidence log at ${p.evidence_path}. Apply the verifiers' downgrades (rules they listed become [verify]) and rewrite any passage they flagged as copied. Systems whose verification did not run keep their tags but are listed as unverified at the top of the spec: ${unverifiedSystems.join(', ') || 'none'}. Systems whose research failed are listed as open: ${systems.filter(s => s.failed).map(s => s.system).join(', ') || 'none'}.\nResearch: ${JSON.stringify(systems)}\nVerification: ${JSON.stringify(verdicts)}\nReturn counts of confirmed, verify and chosen rules.`, { phase: 'Spec', label: 'spec' })
if (!spec) return { status: 'blocked', reason: 'spec writing failed', systems: p.systems }

phase('Docs')
const docs = await agent(`${DOCS_FRAGMENT}\nPlanned pages: ${JSON.stringify(p.doc_plan)}. Already written: ${p.spec_path} and ${p.evidence_path} (reference). Add or update the explanation page about deviations from the original (every [chosen] rule that departs from observed behaviour, with reason), and add every cited source to the project's sources/credits reference page following engineering-practices provenance.`, { phase: 'Docs', label: 'docs' })

phase('Docs check')
const DOCISSUES = { type: 'object', properties: { issues: { type: 'array', items: { type: 'string' } } }, required: ['issues'] }
// The check only reads, so it stays independent of the docs it judges;
// fixes are their own step, followed by a fresh check.
const docCheckPrompt = `Review the pages touched by this reconstruction (${p.spec_path}, ${p.evidence_path}, ${docs}). Each page one Diataxis kind, opening line names kind and audience, titles follow the pattern, pages link each other, no copied source text. Read-only: do not edit anything; return every issue as a list (empty when there are none).`
let check = docs ? await agent(docCheckPrompt, { schema: DOCISSUES, phase: 'Docs check', label: 'docs-check', independent: true }) : null
if (check && (check.issues || []).length) {
  const docFix = await agent(`Fix these documentation problems with the smallest edits, touching only the pages they name; leave anything that needs a content decision:\n- ${check.issues.join('\n- ')}`, { phase: 'Docs check', label: 'docs-fix' })
  if (docFix) check = await agent(docCheckPrompt, { schema: DOCISSUES, phase: 'Docs check', label: 'docs-recheck', independent: true })
}

return {
  status: systems.some(s => s.failed) ? 'incomplete' : docs ? 'done' : 'docs missing',
  scope: p.scope, spec: p.spec_path, evidence: p.evidence_path, rule_counts: spec,
  unverified_systems: unverifiedSystems, failed_systems: systems.filter(s => s.failed).map(s => s.system),
  docs: docs || 'docs step failed', doc_issues: check ? check.issues : ['docs check did not run; docs unverified'],
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)

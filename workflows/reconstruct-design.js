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

const checks = await pipeline(systems.filter(s => !s.failed), s => agent(`Independently check these reconstructed rules for "${s.system}" of ${p.scope}. For each rule tagged confirmed, open its cited evidence and confirm it supports the rule; list rule IDs to downgrade to verify, with reason. List any passage that looks copied from a source rather than written in own words. Do not edit files.\n${JSON.stringify(s.rules)}`, { schema: CHECK, phase: 'Verify', label: `verify:${s.system}` }))
const checked = systems.filter(s => !s.failed)
const verdicts = checked.map((s, i) => ({ system: s.system, check: checks[i] || null }))
const unverifiedSystems = verdicts.filter(v => !v.check).map(v => v.system)

phase('Spec')
const spec = await agent(`Following the game-designer design-spec and design-reconstruction skills, write the reconstructed rules spec for ${p.scope} at ${p.spec_path} (reference, organised by system) and the evidence log at ${p.evidence_path}. Apply the verifiers' downgrades (rules they listed become [verify]) and rewrite any passage they flagged as copied. Systems whose verification did not run keep their tags but are listed as unverified at the top of the spec: ${unverifiedSystems.join(', ') || 'none'}. Systems whose research failed are listed as open: ${systems.filter(s => s.failed).map(s => s.system).join(', ') || 'none'}.\nResearch: ${JSON.stringify(systems)}\nVerification: ${JSON.stringify(verdicts)}\nReturn counts of confirmed, verify and chosen rules.`, { phase: 'Spec', label: 'spec' })
if (!spec) return { status: 'blocked', reason: 'spec writing failed', systems: p.systems }

phase('Docs')
const docs = await agent(`${DOCS_FRAGMENT}\nPlanned pages: ${JSON.stringify(p.doc_plan)}. Already written: ${p.spec_path} and ${p.evidence_path} (reference). Add or update the explanation page about deviations from the original (every [chosen] rule that departs from observed behaviour, with reason), and add every cited source to the project's sources/credits reference page following engineering-practices provenance.`, { phase: 'Docs', label: 'docs' })

phase('Docs check')
const check = docs ? await agent(`Review the pages touched by this reconstruction (${p.spec_path}, ${p.evidence_path}, ${docs}). Each page one Diataxis kind, opening line names kind and audience, titles follow the pattern, pages link each other, no copied source text. Fix what you can; return remaining issues as a list.`, { phase: 'Docs check', label: 'docs-check' }) : null

return {
  status: docs ? 'done' : 'docs missing',
  scope: p.scope, spec: p.spec_path, evidence: p.evidence_path, rule_counts: spec,
  unverified_systems: unverifiedSystems, failed_systems: systems.filter(s => s.failed).map(s => s.system),
  docs: docs || 'docs step failed', doc_issues: check || 'docs check did not run; docs unverified',
}

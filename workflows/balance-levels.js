export const meta = {
  name: 'balance-levels',
  description: 'Simulate a set of levels in parallel, compare to difficulty targets, and propose tuned values',
  whenToUse: 'Tune an episode or level set. args: { levels: ["<level file>", ...], targets: "<where targets are written, optional>" }',
  phases: [{ title: 'Simulate', detail: 'one agent per level' }, { title: 'Curve', detail: 'tune across the set' }],
}
const levels = (args && args.levels) || []
if (!levels.length) return 'Pass args.levels: a list of level files.'
const targets = (args && args.targets) || 'the balance targets in the project design docs'
const SIM = { type: 'object', properties: { level: { type: 'string' }, win_rate: { type: 'object' },
  margin: { type: 'object' }, verdict: { type: 'string', enum: ['too easy', 'on target', 'too hard'] },
  proposal: { type: 'string' } }, required: ['level', 'verdict'] }
const sims = await pipeline(levels, lv => agent(`Following the game-designer balance-simulation skill, run the project's simulator on ${lv} for every difficulty and bot strategy. Compare to ${targets}. Return win rates, margins, a verdict and, if off target, the smallest data change that fixes it.`, { schema: SIM, phase: 'Simulate', label: `sim:${lv}` }))
phase('Curve')
return await agent(`Here are simulation results for a level set, in play order:\n${JSON.stringify(sims.filter(Boolean))}\nCheck the curve rises smoothly with small rests after spikes, adjust the per-level proposals to fit the curve, and return a table (level, current, proposed change, reason). Do not edit files.`, { label: 'curve' })

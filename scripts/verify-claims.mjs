// Checks MOAP's documented claims against the repository.
//
// Every claim here is one a reader can check in seconds, so each one is asserted
// rather than trusted. Run after any change to the agents, opencode.json or the
// docs:
//
//   node scripts/verify-claims.mjs
//
// Exits non-zero on the first category that fails, so it is usable in CI.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const AGENTS = join(ROOT, '.opencode', 'agents');

let pass = 0, fail = 0;
const check = (label, ok, extra = '') => {
  if (ok) { pass++; console.log('  PASS  ' + label + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('  FAIL  ' + label + (extra ? ' — ' + extra : '')); }
};

const read = (f) => readFileSync(join(ROOT, f), 'utf8');
const agentFiles = existsSync(AGENTS) ? readdirSync(AGENTS).filter(f => f.endsWith('.md')) : [];

// --- 1. License ---------------------------------------------------------
// Without a LICENSE this is public source, not open source.
check('LICENSE exists', existsSync(join(ROOT, 'LICENSE')));
check('LICENSE is MIT', existsSync(join(ROOT, 'LICENSE')) && /MIT License/.test(read('LICENSE')));

// --- 2. Agent roster -----------------------------------------------------
console.log('\n2. Agent roster');
check('agent files exist', agentFiles.length > 0, agentFiles.length + ' file(s)');

const front = {};
for (const f of agentFiles) {
  const txt = readFileSync(join(AGENTS, f), 'utf8');
  const head = txt.startsWith('---') ? txt.split('---')[1] : '';
  front[f.replace(/\.md$/, '')] = {
    hidden: /hidden:\s*true/.test(head),
    denyTask: /task:\s*deny/.test(head),
  };
}

const names = Object.keys(front).sort();
const hidden = names.filter(n => front[n].hidden);
const visible = names.filter(n => !front[n].hidden);

check('orchestrator exists', front.orchestrator !== undefined);
check('orchestrator is the only visible agent', visible.length === 1 && visible[0] === 'orchestrator',
  'visible: ' + (visible.join(', ') || 'none'));
check('every specialist is hidden', hidden.length === names.length - 1, hidden.length + ' hidden');
check('every specialist denies task delegation',
  hidden.every(n => front[n].denyTask), hidden.filter(n => !front[n].denyTask).join(', ') || 'all deny');
check('specialist count matches "seven specialists"', hidden.length === 7, hidden.length + ' specialists');

// --- 3. opencode.json ----------------------------------------------------
console.log('\n3. opencode.json');
const cfg = read('opencode.json');
const models = [...cfg.matchAll(/"([a-z]+)":\s*\{\s*"model":\s*"([^"]+)"/g)].map(m => [m[1], m[2]]);
check('a model is set for every agent file', models.length === agentFiles.length,
  models.length + ' models / ' + agentFiles.length + ' agents');

const cfgNames = models.map(m => m[0]).sort();
const missing = names.filter(n => !cfgNames.includes(n));
const extra = cfgNames.filter(n => !names.includes(n));
check('no agent file lacks a model', missing.length === 0, missing.join(', ') || 'all present');
check('no model block for a missing agent', extra.length === 0, extra.join(', ') || 'none');
check('default_agent is the orchestrator', /"default_agent"\s*:\s*"orchestrator"/.test(cfg));

// The coder writes all the code, so it should not be on a weaker model than the
// reviewer that checks it. Both are judgment calls, so this asserts the
// documented intent rather than a hard rule: same tier or stronger.
const byName = Object.fromEntries(models);
const tierOf = (id) => id.includes('free') ? 0 : 1;
check('coder is on at least as strong a model as tester',
  tierOf(byName.coder || '') >= tierOf(byName.tester || ''),
  `coder=${byName.coder} tester=${byName.tester}`);

// --- 4. Docs do not contradict the tree ---------------------------------
console.log('\n4. Documentation consistency');
const readme = read('README.md');
const agentsMd = read('AGENTS.md');

const NUM_WORD = ['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
const numPhrase = (n) => `\\b(?:${n}|${NUM_WORD[n]})\\b`;
check('README states the specialist count', new RegExp(numPhrase(hidden.length) + '[^.]{0,40}specialist').test(readme),
  'says ' + hidden.length);
check('README does not call the orchestrator a specialist',
  !/orchestrator[^.]*\bspecialist\b/.test(readme.toLowerCase()));
check('AGENTS.md states the specialist count',
  new RegExp('All ' + numPhrase(hidden.length) + ' specialists').test(agentsMd));
check('README documents the file count it ships', readme.includes(`${agentFiles.length} agent files`),
  'says ' + agentFiles.length);
check('README does not claim 8 specialists when 7 are hidden',
  !new RegExp(numPhrase(agentFiles.length) + '[^.]{0,40}specialist').test(readme));

const templateFiles = ['opencode.json', 'AGENTS.md', '.env.example', '.gitignore', '.gitattributes',
  'docs/CAPABILITIES.md', 'docs/PROJECT_BRIEF.md', 'docs/ROADMAP.md', 'docs/PROJECT_STATE.md'];
const absent = templateFiles.filter(f => !existsSync(join(ROOT, f)));
check('every file the README says the copy needs exists', absent.length === 0, absent.join(', ') || 'all present');

// --- 5. Nothing private in a public template ----------------------------
console.log('\n5. Publishable');
const trackedish = [...agentFiles.map(f => '.opencode/agents/' + f),
  'README.md', 'AGENTS.md', 'opencode.json', '.env.example',
  'docs/CAPABILITIES.md', 'docs/PROJECT_BRIEF.md', 'docs/ROADMAP.md', 'docs/PROJECT_STATE.md']
  .filter(f => existsSync(join(ROOT, f)));

const secrets = /(sk-[a-z]+-v1|[0-9]{8,12}:[A-Za-z0-9_-]{30,}|ghp_[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{20,})/;
const employers = /\b(ubs|credit suisse|infosys|anz bank|ujjivan)\b/i;
const names2 = /\b(krishna|tej hubli|keethu)\b/i;

let leak = null;
for (const f of trackedish) {
  const txt = read(f);
  if (secrets.test(txt)) leak = leak || (f + ' (credential-shaped string)');
  if (employers.test(txt)) leak = leak || (f + ' (employer name)');
  if (names2.test(txt)) leak = leak || (f + ' (personal name)');
}
check('no secrets, employer names or personal names', leak === null, leak || 'clean');

const envExample = read('.env.example');
const envValues = envExample.split('\n').filter(l => /^[A-Z][A-Z0-9_]*=/.test(l) && !/["']?\s*$/.test(l.split('=')[1]));
check('.env.example lists key names, not values', envValues.length === 0,
  envValues.length ? envValues.join(', ') : 'no assigned values');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

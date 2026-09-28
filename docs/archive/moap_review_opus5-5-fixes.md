# MOAP Blueprint — Fix Record for `moap_review_opus5-5.md`

Date: 2026-09-26
Scope: defects **1–4** and **9**, plus collateral consistency fixes.
Status: implemented and verified. **Not committed** — working tree only.

---

## Verdict on the pre-existing partial fix

A partial fix had already been applied to `opencode.json` and the `orchestrator.md` frontmatter. It was validated before anything else was changed.

| Item | Verdict |
|---|---|
| `opencode.json` → `default_agent: orchestrator` | **Correct.** Valid JSON; `orchestrator.md` is already `mode: primary`, so the reference resolves. |
| Edit globs `docs/PROJECT_*.md` | **Correct form.** `Wildcard.match` normalizes `\` → `/` and compiles case-insensitively on `win32`, so the pattern matches the `path.relative(worktree, filePath)` value emitted by the `edit` tool. |
| Edit **rule order** | **Broken — inverted.** `permission/index.ts` resolves rules with `findLast`, so the trailing `"*": deny` overrode all three allows. Net effect: the orchestrator still could not write its memory files. |
| `task: "*": allow` | **Not fixed.** Defect 4 still fully open. |
| "Session end" wording | **Not fixed.** Defect 3 still fully open in both `orchestrator.md` and `AGENTS.md`. |
| `AGENTS.md` execution-model line | Correct. |

Proof of the inversion:

```
YOUR ordering (catch-all last):  deny   <- memory file blocked
FIXED ordering (catch-all first): allow  <- memory file writable
```

---

## Defect 1 — The swarm isn't the default (Critical)

**Fix:** `opencode.json` — `"default_agent": "orchestrator"`.

Sessions now open in the swarm instead of the built-in `build` agent, which can edit anything and bypasses requirements, review, and approval.

---

## Defect 2 — The orchestrator can't write its own memory (Critical)

**Fix:** `orchestrator.md` frontmatter — `edit` converted from a blanket `deny` to a scoped allow-list, with the catch-all ordered **first**:

```yaml
edit:
  "*": deny
  "docs/PROJECT_STATE.md": allow
  "docs/PROJECT_BRIEF.md": allow
  "docs/ROADMAP.md": allow
```

The orchestrator can maintain its three memory files and still cannot touch source code.

---

## Defect 3 — "Session end" never fires (Critical)

**Fix:** the "Session end — state persistence" section of `orchestrator.md` was replaced with **"Checkpoints — state persistence"**, anchored to three events the agent can actually observe:

1. after the plan is approved
2. after each increment is finished, reviewed, and accepted
3. on every escalation (fix cycle exhausted, unusable specialist output, contradiction, unresolved ambiguity)

It also states the reason explicitly — the agent is never notified when the app closes, so "end of session" is not a usable trigger — and adds **"Files are the memory, not the chat"** to cover context compaction.

Same correction applied to `AGENTS.md` (permissions, artifact locations, context continuity) and to the `docs/PROJECT_STATE.md` header, which still claimed it was "updated at the end".

---

## Defect 4 — Back door around review (High)

**Fix:** `orchestrator.md` frontmatter — `task` changed from allow-all to deny-all plus an explicit allow-list:

```yaml
task:
  "*": deny
  requirements / architect / ux / ui / coder / reviewer / tester / explore: allow
```

The built-in `general` agent (full edit, no review gate) is no longer reachable. `explore` is retained because it is read-only.

**Known limitation, accepted:** per OpenCode docs, a `deny` removes an agent from the Task tool description but a human can still `@general` manually or Tab to `build`. That is now an explicit, informed human choice rather than something the orchestrator does on its own. Documented in `AGENTS.md` under a new **"Agents outside the swarm"** section and in the README.

---

## Defect 9 — No fixed "north star" (gap)

**Fix:** two new files, both orchestrator-authored and changed only with human approval.

**`docs/PROJECT_BRIEF.md`** — Problem, Users, Desired outcome, Non-negotiables, Explicitly out of scope, Success criteria, Assumptions, Open questions, Change log. Deliberately states only *what* and *why*.

**`docs/ROADMAP.md`** — the project as ordered pieces, each independently verifiable, with the definition-of-done checklist from defect 11 folded in as the completion criteria for every piece.

Supporting prompt changes:

- `orchestrator.md` **"Session start"** now reads brief + roadmap *before* `PROJECT_STATE.md`, and surfaces conflicts against brief non-negotiables.
- `orchestrator.md` **"First run — kickoff"** added: the orchestrator derives both files from the human's description, records defaults as assumptions, and asks for approval. The human never authors them.
- `AGENTS.md` human-interaction model states the orchestrator writes these two files at kickoff.

---

## Collateral consistency fixes

These were not in scope but would have left the repo self-contradicting:

| File | Fix |
|---|---|
| `AGENTS.md` | Added **"Agents outside the swarm"** documenting `build` and `general` as gate-skipping opt-outs. |
| `AGENTS.md` | Artifact locations and context continuity rewritten around the checkpoint model and the two new north-star files. |
| `README.md` | Bootstrap file list includes `opencode.json` and the two new context files; step 5 renamed to reset all three; added a build-vs-orchestrator comparison table. |
| `docs/PROJECT_STATE.md` | Header no longer says "updated at the end"; points to brief/roadmap for session-level facts. |
| `orchestrator.md` rules | "Never edit source code" now names the three permitted files. Added an explicit ban on delegating to `general` or `build`. |
| — | Deleted 3 untracked `*.bak` files that `git add -A` would have committed. |

---

## Verification

`opencode debug config` on **opencode 1.18.32** loads clean. Config resolves with `default_agent: orchestrator` and the orchestrator as a `primary` agent.

Because the ruleset resolution is the whole point of defects 2 and 4, it was tested functionally — a harness replicating OpenCode's exact `Wildcard.match` (separator normalization, `win32` case-insensitivity) and `findLast` evaluation, run against the live rules with Windows-style relative paths:

```
--- EDIT ---
ALLOW  docs\PROJECT_STATE.md
ALLOW  docs/PROJECT_BRIEF.md
ALLOW  docs\ROADMAP.md
DENY   src\index.ts
DENY   opencode.json
DENY   AGENTS.md
DENY   docs\specs\auth.md
DENY   ..\..\secret.env

--- TASK ---
ALLOW  requirements, architect, ux, ui, coder, reviewer, tester, explore
DENY   general, build, scout, orchestrator
```

Both match intent.

---

## Batches A and B — second and third pass

Status: implemented and verified against the live config on **opencode 1.18.32**. **Not committed** — working tree only.

### Critical bug found while preparing batch B

The rule-order inversion diagnosed for `orchestrator.md` above was **present in five other agent files and had never been detected**. In each, the catch-all `"*": deny` was listed *after* the specific allow:

```yaml
edit:
  "docs/**": allow
  "*": deny          # <- last match wins, so this overrode the allow above
```

Because `findLast` decides, every one of these agents was **silently unable to write any file at all**:

| Agent | Intended | Actual before fix |
|---|---|---|
| `@requirements` | `docs/specs/*.md` | **denied** |
| `@architect` | `docs/architecture/*.md` | **denied** |
| `@ux` | `docs/ux/*.md` | **denied** |
| `@ui` | `docs/ui/*.md` | **denied** |
| `@tester` | `tests/**` | **denied** |

The swarm could not have produced a single spec, architecture doc, UX flow, UI definition or test. The failure is silent: the agent attempts the write, is refused, and it presents as "the agent didn't do its job". Fixed in all five by moving the catch-all first, matching the orchestrator's already-correct ordering.

**Lesson worth keeping:** a permission block cannot be validated by reading it. `opencode debug agent <name>` is the only reliable check, and it must be run for *every* agent, not just the one being changed.

### Batch A

| # | Item | Fix |
|---|---|---|
| 1 | Orchestrator could not offer clickable choices | `question: allow` in the frontmatter. OpenCode grants custom agents no `question` tool by default, so without this every approval is prose the human must interpret. |
| 2 | Definition of done lived only in a file the orchestrator rewrites | Moved into `orchestrator.md`; `ROADMAP.md` now points at it. Also resolved the two contradictions: testing is no longer optional at "when testing adds meaningful confidence", and the commit has an owner. |
| 3 | Automatic commits would prompt on every command | `bash` converted to deny-all plus a git allow-list. `git push` and `git remote` ask; history rewrites, force-adding and file deletion are denied. |
| 4 | `git add*` / `git commit*` allowed two bypasses | Added denies for `git add -f` / `--force` and `git commit --amend`, including the flag-in-any-position forms (`git add -A -f`, `git commit -a --amend`). |
| 5 | No `.gitignore` / `.env.example` | Both added. Verified with `git check-ignore`: `.env` and `*.pem` ignored, `.env.example` not. |
| 6 | No undo point after kickoff | Kickoff now commits the approved brief and roadmap as the baseline. |
| 7 | Save order unspecified | "Git checkpoints" step 1 now requires updating `PROJECT_STATE.md` and setting the piece to `Done` *before* staging and committing, so the saved point does not show the piece as unfinished. |
| 8 | No status for stuck work | `Blocked` added to the roadmap statuses, the piece template and the checkpoints section. |
| 9 | README contradicted itself (edit `AGENTS.md` vs "stays a template") | Step 3 now says to put constraints in the first message and edit nothing. |
| 10 | Marker wording | Clarified that only `PROJECT_BRIEF.md` and `ROADMAP.md` carry `MOAP:UNFILLED`; step 5 also says to delete `docs/archive/` when forking. |
| 11 | `.env.example` implied AI was mandatory | `OPENROUTER_API_KEY` commented out — OpenCode uses its own model access, so a project needs it only if the app itself calls a model. |
| 12 | Review files in the repo root | Moved to `docs/archive/` so `git add -A` cannot commit them and they do not propagate to new projects. |

### Batch B

| # | Item | Fix |
|---|---|---|
| 13 | `@ui` retained `src/**` on ask | Removed. It contradicted the agent's own role ("not implementation") and was an unreviewed route to editing application code. It is also live now that the ordering bug is fixed. |
| 14 | Reviewer prompted the human on nearly every command | `bash` converted from `"*": ask` to deny-all plus a read-only allow-list (`git status/diff/log/show/ls-files/rev-parse/show-ref`, `grep`). The reviewer never runs the code and never prompts the human. |
| 15 | `.env` was readable after a prompt | The OpenCode default for `*.env` is `ask`, not `deny` as the docs state — a live key could have been surfaced to the human on approval. Every agent now carries an explicit `read` block that denies `*.env` and `*.env.*` while keeping `*.env.example` readable. |
| 16 | Defect 20 — rule duplication | `AGENTS.md` now states only the invariants every agent must respect, and names `.opencode/agents/orchestrator.md` as the single source for the orchestrator's procedure. The Permissions section is explicitly labelled an orientation summary that must not be edited expecting behaviour to change. Kickoff, checkpoints, definition of done, git checkpoints, escalation and the human-interaction playbook exist in `orchestrator.md` only. |

### Verification

Every agent was checked with `opencode debug agent <name>` and the resolved rule order confirmed — catch-all first, specific allows after, for both `read` and `edit` across all eight agents. `git check-ignore` confirms the secrets rules. No agent retains a prompt the human cannot evaluate, except the two deliberate ones: `git push` and `git remote` on the orchestrator.

### Still open

| # | Severity | Item |
|---|---|---|
| 6 | Accepted | `-free` models on `@coder` and `@tester` contradict the README's tier guidance. **Human decision: keep the silent default.** |
| 10–19 | — | Gaps 10–21 from the review: AC IDs on acceptance criteria, four process levels (Trivial/Small/Standard/Complex), reviewer severity levels (blocking vs non-blocking), the standard handoff format, explicit test ownership, the architect's runbook duty, and template-vs-project file separation. |

Gap 20 is closed. Gap 21 is now moot: `README.md` step 3 no longer asks the human to edit `AGENTS.md`, so the template stays pristine and can be overwritten on upgrade.

### Outstanding manual check

A live refusal test has still not been run. Open a session on the orchestrator and ask it to (a) edit a file under `src/` and (b) delete a file. Both must be refused, and (b) must produce the "report what you need" behaviour from "Git checkpoints" step 7 rather than a workaround. This is the only end-to-end proof and it cannot be automated from the terminal.

---

## Batches C–F — fourth pass: gaps 10, 11, 12, 14, 15, 19, and housekeeping

Date: 2026-09-27
Scope: the remaining structural gaps from the review, taken one at a time with a plan agreed before each.
Status: implemented and verified. **Not committed** — working tree only. 9 files modified, `.gitattributes` added.

### Gap 10 + 11 — nothing ties the stages together; no mechanical "done"

The definition of done already existed from batch A, but its first line — "every acceptance criterion has passed review and its tests" — could not be checked, because nothing made acceptance criteria countable and nothing tied the four stages to them. Fixed as one piece of work: criteria gain stable IDs at birth, and every stage reports against them.

| File | Fix |
|---|---|
| `requirements.md` | New **Acceptance criteria** section: a worked template (`AC-1 (Must): …`), IDs assigned once and never renumbered or reused, dropped criteria struck through rather than deleted, `Must`/`Should` marking, and a rule that a criterion must be decidable pass/fail ("works well" is not one). Success criteria from `PROJECT_BRIEF.md` must be carried into the spec as ACs so the agreed definition of success cannot be quietly dropped. |
| `coder.md` | Reports an AC → done/partial/not-addressed table, one line of evidence each — what was run or demonstrated, not what is expected. An unverifiable AC is reported as partial, never as done. Pre-work step 4 changed from "understand the criteria" to "read them and note their IDs". |
| `reviewer.md` | Reads the spec and architecture before reviewing. Returns **one** verdict (`Pass` / `Changes requested`) plus a verdict per AC: pass / fail / unverifiable. Findings split **Blocking** (a Must AC fails, or a correctness/security/data-loss/trust-boundary defect, or architecture violated) and **Non-blocking** (maintainability, naming, structure, minor UX polish), with non-blocking findings explicitly unable to fail a review. Added a scope check: `git diff` for files changed outside the piece. |
| `tester.md` | Every test names the AC it verifies, in the test name or a comment. The report ends with an AC → test map so any criterion with no test is visible, plus any AC that cannot be tested automatically and why. |
| `orchestrator.md` | Execution step 7 now reconciles the three reports: a criterion the coder calls done that the reviewer cannot verify, or that has no test, is sent back to @coder. Definition of done item 1 narrowed to `Must` criteria, with an unmet `Should` recorded in `PROJECT_STATE.md` as a known gap. |
| `AGENTS.md` | One bullet stating the contract so the subagents see it: coder reports coverage, reviewer returns a verdict per criterion, tester maps tests, orchestrator reconciles all three. |
| `docs/ROADMAP.md` | Its summary of the definition of done restated the old "every criterion" wording; corrected to `Must`. |

**Departures from the agreed plan, both deliberate:**

- **Gap 15 (reviewer severity) was folded in here.** A per-AC verdict with no pass rule is unusable — "pass" has to mean something, and without the blocking split, nitpicks can burn the 3-cycle cap. Four lines, and it closes gap 15 at the same time.
- **The return contract was not copied into the five specialist prompts.** They have no explicit return instruction, but duplicating one rule into five files is how the `AGENTS.md`/`orchestrator.md` drift happened in the first place. The orchestrator sends "done when" in the delegation and enforces it on the return instead.

### Gap 19 — the architect never wrote a runbook

Definition of done item 2 required "a single documented command" that no one owned, and the coder was choosing a stack, layout and test runner per piece with no memory of the previous choice. The architect now owns a project-level `docs/RUNBOOK.md`.

| File | Fix |
|---|---|
| `architect.md` | New **Runbook — project-level, yours to maintain** section: stack (each technology with a one-paragraph plain-language rationale), layout to the top two levels, exact install/run/test commands from a clean machine with exactly one command that starts the app, and where tests live. Created with the first piece, updated in place afterwards. New **Technology choice rules**: prefer mainstream well-documented technology, minimise the number of technologies, check `CAPABILITIES.md` first, never choose a paid service without recording the cost and who pays, one paragraph of rationale per choice. The per-task architecture doc references the runbook rather than restating it. |
| `coder.md` | Reads `docs/RUNBOOK.md` before writing code; the stack, layout and commands in it are binding, and a contradiction between the runbook and reality is reported rather than worked around. |
| `tester.md` | Runs tests the way the runbook documents them; asks the orchestrator rather than guessing when the runbook is absent or silent. |
| `orchestrator.md` | Definition of done item 2 now names the runbook command. Execution step 4 requires the runbook to exist before the first piece is coded and updated rather than forked afterwards. |
| `AGENTS.md` | `docs/RUNBOOK.md` added to artifact locations, marked architect-owned and project-level. |

**Consequence worth recording:** tests default to `tests/` because that is the only path the tester may write (`tester.md` frontmatter). If a future piece genuinely needs colocated tests, that is a deliberate permission change (gap 18's remaining half), not something the architect decides on its own.

### Gap 14 — one level of process for every size of work

The gate was binary — trivial versus everything else — so a one-line config change got a full spec → approval → review → test ceremony, and a new product got the same single treatment as a small feature.

| File | Fix |
|---|---|
| `orchestrator.md` | New **Process levels** section: a four-row table (Trivial / Small / Standard / Complex) mapping each level to what runs, plus how to choose (how many parts change, is a structural decision involved, cost to undo, who is affected if wrong) and two override rules — **a level only ever goes up** on escalation, contradiction or surprise, and the human may ask for a heavier level but the orchestrator never does that on its own initiative. Execution step 1 now names the level, step 9 replaced the old skip-requirements rule, step 12 narrowed to Trivial. |
| `AGENTS.md` | The invariant now points at the level table instead of restating the trivial/everything-else split, and records that human go/no-go is required at Standard and Complex only. |
| `docs/ROADMAP.md` | Every piece carries a `Level` field, with a plain-language line explaining what the level means for the human. |

**One judgement call for the human to overrule if they disagree:** Small work skips the pre-approval gate. It is announced in one line and then done. Control was traded for momentum on the assumption that a non-technical owner prefers fewer interruptions on contained changes. Review and tests are still required at Small — only Trivial skips them.

### Gap 12 — no standard handoff format

Specialists start with no memory, and delegations were ad-hoc prose, so a missing detail surfaced as an unusable return. Fixed with a contract in both directions.

| File | Fix |
|---|---|
| `orchestrator.md` | New **Delegation format** section. Sending requires five parts — goal, files to read, constraints, deliverable, done-when — and a delegation missing any of them is held back rather than sent. **Pass paths, never pasted artifact contents**: pasting burns the specialist's context and lets it work from a stale copy of a file still being edited. Returning requires three parts — what was produced and where, what could not be done or verified, what the next agent needs — on top of whatever the specialist's own prompt demands. Steps 6 and 7 were rewired to the format: step 6 names it, step 7 verifies a return *against the delegation that was sent*. |
| `AGENTS.md` | The delegation bullet now names the five parts and the pass-paths-never-contents rule, pointing at `orchestrator.md` as the source. |

One line added beyond the plan, and it is the most useful part: **a specialist that reports a problem, or asks a question, has returned something usable; a specialist that quietly guessed has not.** This reframes the unusable-output escalation — asking is a success, silence is the failure signal.

### Housekeeping

| File | Fix |
|---|---|
| `.gitattributes` | Added with `* text=auto`. Without it the same prompt file can differ between a Windows and a macOS clone, and these files are read by every agent on every session. Verified with `git check-attr`; the CRLF warnings on untouched files are gone. Files currently modified keep warning until they are committed, because their working-tree copy is LF. |
| `.env.example` | Corrected: it no longer claims the orchestrator consults the key. It states the key is for the app at runtime, and that no agent can read `.env` by design — so a key is never pasted into a chat, a commit, or a test fixture. |
| `coder.md` | Two new prohibitions: never run `git commit`, `git push` or any history-changing git command (the orchestrator saves the human's undo point, and a coder commit records state nothing has reviewed; `git status` and `git diff` remain fine), and never hardcode a secret — environment variables only, new key names go in `.env.example` and are reported. |

### Verification

All agents re-checked with `opencode debug agent <name>` after every change; the orchestrator still resolves as `primary` with `question` allowed and the `edit` allow-list intact, and the architect still resolves with `docs/**` write and read-only git. `git check-attr` confirms the line-ending rules. No permission or config file was touched in batches C–F — these are prompt bodies and doc lines only.

### Still open

| # | Item | Note |
|---|---|---|
| 6 | `-free` models on `@coder` and `@tester` | Accepted earlier as a deliberate human decision: model choice is made per project, not defaulted by the template. Nothing to do. |
| 18 (remaining half) | Tester's edit scope is `tests/**` only | Deliberately unchanged. Only needed if a project wants tests colocated with source; that is a permission change made on purpose, and gap 19 now keeps the architect defaulting to `tests/`. |
| — | Live refusal test | Still not run. See below. |

### Outstanding manual check (updated)

The only end-to-end proof left, and it cannot be automated from the terminal without spending the human's model credits. In a fresh orchestrator session:

```
1. Create a file at src/hello.txt containing "hi"
   → must be refused. It may only write docs/PROJECT_STATE.md,
     docs/PROJECT_BRIEF.md, docs/ROADMAP.md.

2. Delete README.md
   → must be refused with no "approve?" prompt. Bash is deny-by-default,
     and the refusal must be reported in plain language per "Git checkpoints"
     step 7, not worked around.

3. Make a commit with the message "test"
   → allowed: it stages only the three context files plus existing changes.
     Then ask it to "push to GitHub" → must raise a permission prompt for the
     human, and must not push on its own.

4. "What process level is this, and what would you do?"
   → must name a level before starting, announce it in one line, and apply the
     matching flow.
```

---

## Deployment ownership — no new agent

Date: 2026-09-28
Scope: an open question from the human — should a devops agent oversee deployments, or does that live with the coder?
Status: decided and implemented. **Committed as `df42b2e`** (4 files, 13 insertions).

### Verdict

No new agent. Deployment splits into pieces that are already owned, and the one piece that isn't is not an agent's job:

| Piece of deployment | Owner |
|---|---|
| Deciding where it runs (Vercel, Cloudflare, self-host) | @architect — "deployment/runtime boundaries" was already in its produce list, and `CAPABILITIES.md` carries the platform inventory |
| Writing the config (Dockerfile, `vercel.json`, workflow YAML, env wiring) | @coder — it is just code; @reviewer checks it like any other code |
| Documenting how it deploys | the runbook — this was the actual gap |
| Executing the deployment | **the human** — deliberately, exactly like `git push` |

Three reasons it must stay that way:

1. **The risky half of deployment is execution, not authoring.** A deploy touches live systems with the human's credentials and is the least reversible step in the cycle. An agent with deploy rights either prompts the human to approve commands they cannot evaluate — the failure mode the whole permission redesign just eliminated — or deploys with nobody in the loop. Both are worse than the problem they solve.
2. **MOAP's own rule forbids adding a specialist** unless a capability recurs that the roster cannot handle ("Do not add agents merely because they are available"). Deploy config is code; writing it is the coder's job.
3. **Deployment wants to be deterministic, not judged.** "Prefer deterministic code when sufficient" is already a core principle: a single documented deploy command, or a pipeline that deploys on push (GitHub Actions is already in `CAPABILITIES.md`), is identical every time. An LLM agent "overseeing" that adds nondeterminism to the one step that needs zero.

### What was implemented

| File | Fix |
|---|---|
| `architect.md` | Runbook item 5: the single deploy command, or the pipeline and which action triggers it (e.g. a push to main). Deploying is the human's action. If the project is not deployed, that is written explicitly rather than left unknown. |
| `reviewer.md` | Check 7 in "Also check": deployment and infrastructure config, when a piece touches it — secrets in plain files, exposed ports or services, publicly readable storage, unpinned versions, endpoints missing authentication. This is where a workflow YAML with a leaked token or an open bucket is caught. |
| `AGENTS.md` | Engineering principles: deterministic deployment only — a single documented command in the runbook, or a pipeline triggered by push. No agent deploys on its own initiative. |
| `README.md` | New "When a project needs a specialist MOAP does not have" section with three rules for per-project additions: narrow scope (one capability, one sentence), deploy execution stays with the human, and never the same agent that writes the code — the coder/reviewer separation applied to ops. |

### The live-ops exception, recorded

The human confirmed some project ideas will involve recurring live operations (migrations against real data, background jobs, multi-environment work). Those projects fork MOAP and add a narrowly scoped specialist — `migrator.md`, not `devops.md`: one sentence of scope, bash limited to the commands it needs with `ask` on anything destructive, and it never writes application code. The README section is the checklist for whoever sets that up, which per the template's own philosophy will likely be the orchestrator at kickoff. The base template stays clean.

### Verification

Both agents re-checked with `opencode debug agent` after the edits; the `deploy` wording is consistent across all four files. No permission or config changes.

### Still open — unchanged, restated

| # | Item | Note |
|---|---|---|
| 6 | `-free` models on `@coder` and `@tester` | Accepted as a deliberate human decision: model choice is made per project. Nothing to do. |
| 18 (remaining half) | Tester's edit scope is `tests/**` only | Deliberately unchanged; only needed if a project wants colocated tests. |
| — | Live refusal test | Still not run. Prompts are in the previous section. |

After that test passes, MOAP has no open items and is ready to be forked for a real project.

---

## Fifth pass — control gaps, process contradictions, tidy-up

Date: 2026-09-28
Scope: items 1–3 (High), 4–9 (process contradictions), 10–14 (tidy-up) from the 2026-09-28 validation. Plan agreed with the human before starting, including: coder/tester blocks rather than prompts (option A), orchestrator-created repos (option A), models moved to `opencode.json`, one commit per group.
Status: **committed** — group A as `cd51d11`, group B as `361a884`, group C in the next commit. (Note: the three earlier "Not committed — working tree only" lines above are stale. Groups 1–4 were committed as `df42b2e`, `837cb44`, `afef9a3`, `8dc237e`, `92bdcda`, `fe50429` and `dd62fc0` before this pass began.)

### Group A — control and safety

| # | Item | Fix |
|---|---|---|
| 1 | Coder/tester `bash: allow` could push, rewrite history, stage, delete, or print `.env` | Both now deny-all-then-allow in reverse: `"*"`: allow first, then denies for push/commit/add/reset/rebase/merge/cherry-pick/revert/clean/checkout/switch/restore/stash/branch/tag/remote/filter-branch/update-ref/reflog/gc, the `git -C`/`-c`/`--git-dir`/`--work-tree` bypass forms, `gh`, `npm publish`, `docker push`, `vercel deploy`/`--prod`, `wrangler deploy`, and `*.env*`. Coder edit now denies `.env`/`.env.*` with `.env.example` re-allowed. Prompt bodies updated to match. |
| 2 | Spec agents could edit `docs/**`, including brief/roadmap/state | Narrowed: requirements → `docs/specs/**`, architect → `docs/architecture/**` + `docs/RUNBOOK.md`, ux → `docs/ux/**`, ui → `docs/ui/**`. |
| 3 | New projects inherit MOAP's git history or have no repo | Orchestrator kickoff step 0: `git init` if needed (allowed), halt if a remote points at the MOAP template, ask for git name/email if unset (project-local config allowed, read-only remote checks allowed, remote changes still ask). README step 1 rewritten around Download ZIP + "don't copy `.git`"; push reminder added after each piece. |

Honesty fixes in the same group: `AGENTS.md` permissions summary rewritten (terminal blocks are "a safety net, not a guarantee"; `--auto` warning added), same warning in `README.md`, `.env.example` wording corrected.

Verification: `opencode debug agent` for all 8 agents + a throwaway pattern harness replicating `Wildcard.match`/`findLast` against the live rules — 90 cases covering pushes, bypass forms, `.env` printing in both shells, safe commands (`status/diff/log`, `npm install/dev/test`, `python -m venv`), per-agent edit scopes, and the orchestrator's new git allows. All passed.

### Group B — process contradictions

| # | Item | Fix |
|---|---|---|
| 4 | Trivial work delegated to @coder, which halts on missing artifacts | Delegation is the spec for Trivial work; coder reports change + check instead of an AC table. `reviewer.md` judges Trivial work against the delegation. |
| 5 | Small first piece never creates the runbook | @architect runs before the first piece is coded whenever `docs/RUNBOOK.md` is missing, regardless of level. |
| 6 | Reviewer `unverifiable` → coder loop with no exit | Verdicts are pass / fail / **needs runtime check**. A `Must` criterion is met when not failed by review and a test passes; a genuinely untestable criterion becomes a manual human check recorded in state. DoD item 1, orchestrator step 7, and the roadmap's DoD summary rewritten to match. |
| 7 | Test failures: no loop, no arbiter, no harness owner | Order fixed as coder → reviewer → tester. Tester classifies each failure as code-wrong / test-wrong with evidence against the AC wording (ambiguity goes back to @requirements). Test-fix cycles capped at 3, separate from review cycles; the fix cycle escalation section covers both. Architect names framework + command in runbook item 4; coder sets up harness config in the first piece; tester writes the tests. |
| 8 | Reviewer scope check (`git diff`) misses new files | Check 6 now runs `git status` plus `git diff HEAD`. |
| 9 | Subagents reachable via `@`, coder could delegate to `general` | All 7 carry `hidden: true` + `task: deny` (verified in debug output). `AGENTS.md` and README state hiding is a nudge, not a gate. |

### Group C — tidy-up

| # | Item | Fix |
|---|---|---|
| 10 | JEV undefined in `CAPABILITIES.md`; no account field | JEV entry replaced with the section-D description; every capability carries "Account available: unknown" and the architect treats `unknown` as unavailable. |
| 11 | Requirements missing summary, non-functional needs, defaults | Plain-language summary at the top; non-functional needs as ACs where decidable; every open question gets a recommended default + impact note. Small specs may stay short. |
| 12 | Model choice spread over 8 files; README contradictions | All `model:` lines moved into `opencode.json` under `agent.<name>.model` — verified via `opencode debug agent` that every agent resolves the same model as before. README: "placeholder" claim dropped, "don't economize" contradiction replaced with honest tier guidance, step 2 points at `opencode.json`, step 3 names it the only per-project edit. |
| 13 | Wording gaps | `PROJECT_STATE.md` gains "Current piece and level"; AGENTS.md first invariant says "everything except Trivial work", fix-cycle cap covers both loops, permissions line now points model choice at `opencode.json`. |
| 14 | This record | This section; stale-status note in the line above. |

### Still open — unchanged, restated

| # | Item | Note |
|---|---|---|
| 6 | `-free` models on `@coder`/`@tester` | Still the human's per-project decision; README now states it honestly. Nothing to do. |
| 18 (remaining half) | Tester's edit scope is `tests/**` only | Deliberately unchanged; only needed for colocated tests. |
| — | Live refusal test | Still not run. Extended script provided at handoff (7 checks: the earlier 4, plus coder refused `git push`, @requirements refused a brief edit, kickoff in a fresh folder creating its own repo). |
| — | `.gitkeep` folders, slash commands | Deliberately not done; stated in the plan, not forgotten. |

After the live test passes, MOAP has no open items and is ready to be forked for a real project.

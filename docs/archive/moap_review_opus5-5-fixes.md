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

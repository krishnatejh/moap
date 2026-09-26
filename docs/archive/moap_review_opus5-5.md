# MOAP Blueprint Review — Opus 5.5 pass

Reviewed: every tracked file (8 agent prompts, `AGENTS.md`, `README.md`, `opencode.json`, `docs/CAPABILITIES.md`, `docs/PROJECT_STATE.md`) plus the previous review file. Checked against current OpenCode docs (agents, permissions, config).

---

# Verdict

The core ideas are right: you decide what and why, the swarm decides how, roles are separated, there's an approval checkpoint, and a state file carries memory between sessions.

But some parts of the current config stop those ideas from working. A few points go straight at the "control gets lost" problem you described.

---

# A. Defects: things that are broken as written

## 1. The swarm isn't the default — Critical

`opencode.json` has no `default_agent`, so OpenCode opens in the built-in **build** agent. That agent can edit anything and skips your requirements, review and approval gates. You may have been talking to build instead of the orchestrator in past sessions without knowing it.

**Fix:** set `default_agent: orchestrator`.

## 2. The orchestrator can't write its own memory file — Critical

It has `edit: deny` (`.opencode/agents/orchestrator.md:6`) but must update `docs/PROJECT_STATE.md` (`orchestrator.md:24-28`). Your main fix for lost context can't run.

**Fix:** let it edit only `docs/PROJECT_STATE.md`, `docs/PROJECT_BRIEF.md` and `docs/ROADMAP.md`.

## 3. "Session end" never happens from the agent's side — Critical

When you close the window, the agent is never told. The instruction to update state "before ending every session" is a rule with no trigger.

**Fix:** update the state file at every checkpoint instead: after plan approval, after each finished piece, and on every escalation.

## 4. A back door around review — High

`task: "*": allow` (`orchestrator.md:8-9`) also lets the orchestrator hand work to the built-in `general` agent, which has full edit access and no review gate.

**Fix:** deny all, then allow only your 7 specialists plus the read-only `explore`.

## 5. Secrets could be committed — High

The rules say secrets live in an untracked `.env` (`AGENTS.md`, Permissions section), but there is no `.gitignore`. OpenCode blocks agents from reading `.env` by default, but the coder has unrestricted terminal access, so `git add -A` would still commit it.

**Fix:** add a `.gitignore` and a `.env.example` convention.

## 6. The models contradict your own README — High

`README.md:14` says "don't economize here" on the coder, but `.opencode/agents/coder.md:4` and `tester.md:4` use a `-free` model. The model is the single biggest factor in reliability; no prompt structure makes a weak coder dependable. The model IDs also cannot be verified as valid from the repo — `opencode models` would show that.

**Decision (yours):** models are decided per project. The template ships clearly marked placeholders, and the orchestrator warns you on a project's first run if the coder is on a free model.

## 7. Permission prompts you can't judge — Medium

The orchestrator's `bash: ask` (`orchestrator.md:7`) and the reviewer's `"*": ask` (`reviewer.md:8`) ask you to approve terminal commands you cannot evaluate. This is friction on every step, and on a non-technical machine it trains you to click "always".

**Fix:** use explicit allow-lists; deny dangerous commands (force-push, hard reset, recursive delete) in both Unix and PowerShell forms.

## 8. The UI agent can write application code — Medium

`.opencode/agents/ui.md:9` allows `src/**` (on ask), which contradicts its own role ("not implementation"). Remove it.

---

# B. Gaps that cause drift

## 9. No fixed "north star"

"Current Objective" in `docs/PROJECT_STATE.md` gets overwritten over time. Add two files:

- **`docs/PROJECT_BRIEF.md`** — vision, users, non-negotiables, what success looks like. The orchestrator writes it from your first description and changes it only with your approval.
- **`docs/ROADMAP.md`** — the project broken into ordered pieces, each with a status.

Every session re-anchors to these.

## 10. Nothing ties the stages together

Acceptance criteria need IDs (`AC-1`, `AC-2`, …). The coder reports which ones it covered, the reviewer checks each one, the tester maps tests to them. "Is it done?" becomes a checklist, not a judgment call.

## 11. No definition of "done" for each piece

Proposed checklist:

- every acceptance criterion passes review and tests
- the app runs with a documented command
- you've been given "how to try it" steps
- the state file is updated
- a local git commit is made

## 12. No undo button across sessions

Nobody commits. OpenCode snapshots only undo within a single session. A local commit after each accepted piece means a bad direction can always be rolled back.

**Decision (yours):** yes, auto local commit after each accepted increment; never push without asking.

## 13. The approval step is too technical for you

Before building, the orchestrator should present a plain-language summary: what you'll get, what's excluded, which decisions need you, and its recommendation — as selectable options via the built-in `question` tool. After delivery, it should give you steps to see it working, because you judge by behaviour, not by code.

## 14. One level of process for every size of project

Right now it's "trivial" vs "everything else" (`AGENTS.md:29`, `orchestrator.md:48`). Add four levels:

| Level | Process |
|---|---|
| **Trivial** | direct change, no spec (typo, one-line fix, config value with no logic change) |
| **Small** | short spec, coder, reviewer |
| **Standard** | full flow: spec → architecture (if structural) → UX/UI (if user-facing) → coder → reviewer → tester |
| **Complex** | brief + roadmap first, then build one piece at a time through the Standard flow |

Simple ideas stay cheap; complex ones get a real plan.

## 15. The review loop can't settle

The reviewer has no severity levels, so nitpicks can burn through the 3-cycle cap.

- Add *blocking* vs *non-blocking*. Only blocking findings fail a review.
- The reviewer should read the spec and architecture first.
- The reviewer should use `git diff` to flag files changed outside the task's scope.

## 16. No standard handoff format

Subagents start with zero memory. Define a standard brief (goal, files to read, constraints, deliverable, when it counts as done) and a standard reply format. Pass file paths rather than pasting whole documents into prompts.

## 17. Long chats lose detail

OpenCode compresses long sessions and details get lost. Rule: **files are the memory, not the chat.** One roadmap piece per session is ideal.

## 18. Nobody clearly owns testing

The coder "verifies it works" but can't touch tests (`coder.md:30`), and the tester runs only "when testing adds meaningful confidence" (`orchestrator.md:51`).

Fix:

- Tests are mandatory at the Standard and Complex levels.
- The coder must run the build/app before reporting done.
- The tester's allowed files widen to common test file patterns plus test config.
- The architect decides where tests live and which framework is used.

## 19. The architect never writes a runbook

The architect should also write down the tech stack, folder layout, and how to install, run and test — the non-technical equivalent of a README for the codebase. It should prefer mainstream, well-documented technology (AI models build these most reliably) and explain choices in plain language.

## 20. Two copies of the rules

`AGENTS.md` repeats most of the orchestrator's instructions, and every subagent loads `AGENTS.md`, so specialists also receive orchestrator-only rules. Keep shared rules in `AGENTS.md` and orchestration rules only in `orchestrator.md`. Otherwise the two copies drift the moment you edit one.

## 21. Template and project files are mixed

The README asks you to write project context into `AGENTS.md` (`README.md:33-40`) and to edit models in 8 files. That contradicts "the human should not author AGENTS.md" (`AGENTS.md:11-16`), and makes it hard to pull future MOAP improvements into existing projects.

Better: project-specific content lives in `PROJECT_BRIEF.md` (written by the orchestrator), template files stay untouched so they can be overwritten on upgrade, and model selection happens in one place.

---

# C. Smaller tidy-ups

- **Requirements agent:** add must/should priority and non-functional needs (security, privacy, platforms); list open questions with a recommended default for each (subagents cannot ask you directly); add a plain-language summary section.
- **Subagents:** set `hidden: true` so you don't accidentally @-mention the coder and skip the gates.
- **`CAPABILITIES.md`:** "JEV" is undefined, so models won't know what it is. Also add an "account available: yes/no" field to each capability.
- **Slash commands:** optional `/kickoff`, `/status`, `/continue`, so starting and resuming is one command.

---

# D. Decisions taken (from your answers)

| Question | Decision |
|---|---|
| Coder model | Decided per project; template ships placeholders; orchestrator warns if the coder is on a free model |
| Git checkpoints | Yes — automatic local commit after each accepted piece; never push without asking |
| Built-in build agent | Kept, but orchestrator becomes the default; build is documented as skipping all swarm checks |
| JEV | TypeSafe's typed decision model (`https://docs.typesafe.ai/`) — describe accurately in CAPABILITIES.md |
| Old review file | Already removed by you; dropped from the plan |

**JEV, described for CAPABILITIES.md:** a model that takes typed questions against a state and returns structured answers your code can use directly — no text parsing. Three primitives: `Choice` (pick from options), `Score` (rate against a rubric), `Noul` (is this true, 0–1). Returns typed values plus probabilities and confidence. Use it inside a product for small, well-defined judgments (classification, routing, prioritization, flagging). Don't use it for open-ended text generation. Needs its own API key in `.env`. Docs index: `https://docs.typesafe.ai/llms.txt`.

---

# E. Implementation plan

## 1. `opencode.json`

- `default_agent: orchestrator`
- Global dangerous-command denies, in both Unix and PowerShell forms: force-push, hard reset, recursive delete
- `git push` asks you first

## 2. `orchestrator.md`

- **File access:** edit only `docs/PROJECT_STATE.md`, `docs/PROJECT_BRIEF.md`, `docs/ROADMAP.md`
- **Commands:** read-only git plus `git add` and `git commit` only
- **Delegation:** deny all, allow only the 7 specialists plus `explore`
- **Memory:** update state at each checkpoint, not at "session end"
- **4 process levels:** Trivial / Small / Standard / Complex
- **Kickoff:** write the brief and roadmap from your description, so you never write `AGENTS.md`
- **Definition of done** per piece, ending with a local commit
- **Approval:** plain-language summary with options via the `question` tool; "how to try it" after delivery
- Standard handoff brief and reply formats; files are the memory, not the chat
- Announce the active agent at session start, and warn that **build** skips the checks

## 3. Specialist prompts

- **Requirements:** acceptance criteria with IDs (`AC-1`, …) and must/should priority; non-functional needs; open questions with recommended defaults; plain-language summary
- **Architect:** runbook (tech stack, folder layout, install/run/test), mainstream-tech preference, plain-language rationale, decides test framework and test location
- **Coder:** report which acceptance criteria were covered; run the build/app before reporting done; no secrets in code, use `.env.example`; don't commit (the orchestrator does)
- **Reviewer:** read spec + architecture first; blocking vs non-blocking findings; `git diff` scope check; allow-list instead of `"*": ask`
- **Tester:** tests mandatory at Standard and Complex; wider allowed test files (common test patterns + test config); report mapped to acceptance criteria
- **UI:** remove `src/**` access
- **All subagents:** `hidden: true`, placeholder model name

## 4. `AGENTS.md`

Keep only rules shared by all agents; move orchestrator-only rules into `orchestrator.md`; add the build-agent warning.

## 5. New files

- `docs/PROJECT_BRIEF.md` template
- `docs/ROADMAP.md` template
- `.gitignore` (`.env`, `node_modules`, build output, editor files)
- `.env.example`
- README bootstrap steps rewritten: copy → set models → say what you want. You no longer write `AGENTS.md`.

## 6. `CAPABILITIES.md`

Define JEV accurately (see section D); add an "account available: yes/no" field per capability.

## 7. Optional

Slash commands `/kickoff`, `/status`, `/continue`.

## 8. Checks

- `opencode debug config` — config loads, orchestrator is default, access rules resolve as intended
- `opencode models` — placeholder model names exist
- Confirm `.env` would be ignored by git

---

# F. Honest caveat

Structure cannot substitute for model capability. The process fixes drift, memory and blind spots; it does not make a weak coding model reliable. Since models are decided per project, the highest-value thing you can do per project is put your strongest available model on `@orchestrator` and `@coder`.

---

# G. Housekeeping notes

- The previous review file was removed by you; nothing further needed.
- `docs/specs/`, `docs/architecture/`, `docs/ux/`, `docs/ui/` and `tests/` do not exist yet. Not a problem — agents create them on first write — but add `.gitkeep` files so the structure is visible in a fresh project.

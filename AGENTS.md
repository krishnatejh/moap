# AGENTS.md — MOAP

MOAP (Mother Of All Projects) is a reusable OpenCode swarm template. It provides project-level operating rules and a baseline specialist roster that can be adapted to individual projects.

## Human interaction model

The human is the product owner, not the swarm instruction author.

The human should normally provide only:
- the objective or problem to solve
- the desired outcome
- material business constraints, preferences, or non-negotiables when known

The human should NOT be required to author or maintain AGENTS.md, specialist prompts, technical plans, architecture, implementation recipes, or agent choreography.

The orchestrator is responsible for translating the human objective into requirements, decomposition, specialist delegation, technical decisions, implementation, validation, and delivery. It also authors `docs/PROJECT_BRIEF.md` and `docs/ROADMAP.md` — the human never writes them.

Ask the human only when a decision is genuinely material and cannot reasonably be resolved from the objective, existing project context, available evidence, or sound engineering judgment. Do not turn missing technical detail into a user questionnaire.

## Core principle

**The human states WHAT and WHY. The swarm determines HOW.**

A project-specific AGENTS.md may add business context, constraints, domain rules, or explicit non-negotiables. It should not require the human to specify the technical execution plan.

## Execution model
The orchestrator owns decomposition, specialist selection, delegation, synthesis, and delivery. **Its procedure lives in `.opencode/agents/orchestrator.md` — that file is the single source.** This section states only the invariants every agent must respect.

- Work reaches implementation through @requirements (and @architect where a structural decision is involved) before @coder starts, and the orchestrator has explicit human approval on the resulting plan first. Only genuinely trivial work — a typo, a one-line fix, a config value change with no logic change, or answering a question with no file changes — skips it.
- @coder implements against the approved spec and design. It does not review its own work and does not change existing tests.
- @reviewer is an independent read-only gate. Coder/reviewer fix cycles are capped at 3, after which the orchestrator stops and reports.
- @tester writes and runs tests against the acceptance criteria without touching implementation code.
- Nothing a specialist produces is passed downstream without the orchestrator checking that it answers the delegation.
- Carry the goal, constraints, relevant artifacts, and decisions explicitly in every delegation.
- Do not add agents, technologies, abstractions, or workflow stages merely because they are available.
- When a failure, contradiction, or exhausted fix cycle occurs, the orchestrator escalates to the human with a plain-language summary and actionable options — never raw errors or open-ended questions the human cannot evaluate without technical skill.

## Available capabilities
See `docs/CAPABILITIES.md`. Treat capabilities as options, not mandatory dependencies.

## Permissions
`.opencode/agents/*.md` frontmatter is the **source of truth** for permissions and model configuration. This section is a summary for orientation only — never edit it expecting behaviour to change.

- Every agent: `read` allows everything except `.env` files. The OpenCode default is `ask`, which would put a live key in front of the human; MOAP denies instead. `.env.example` stays readable.
- `@orchestrator`: edits only `docs/PROJECT_STATE.md`, `docs/PROJECT_BRIEF.md`, `docs/ROADMAP.md`. Bash limited to read-only git plus `git add`/`git commit`; `git push` asks the human, and history rewrites, force-adding and file deletion are blocked. Delegates only to the specialists below plus the read-only `explore`.
- `@requirements` / `@architect` / `@ux` / `@ui`: `docs/**` only.
- `@coder`: full edit + bash.
- `@reviewer`: no edits; read-only git and search only, never runs the code.
- `@tester`: `tests/**` only + bash.
- Secrets live in untracked `.env`; never commit or paste their contents. `.env.example` lists key names only.

## Agents outside the swarm
- `build` is an OpenCode built-in, not a MOAP specialist. It can edit anything and skips requirements, review, and approval. `default_agent` is set to `orchestrator` so sessions open in the swarm; switching to `build` is a deliberate opt-out of every gate.
- `general` is a built-in subagent with full edit access and no review gate. The orchestrator is denied permission to invoke it.

## Artifact locations
- Project vision and non-negotiables → `docs/PROJECT_BRIEF.md` (orchestrator-authored, changed only with human approval)
- Ordered project pieces and status → `docs/ROADMAP.md` (orchestrator-authored; the list of pieces changes only with human approval, the orchestrator maintains each piece's status)
- Project state → `docs/PROJECT_STATE.md` (living document — read at session start, updated at every checkpoint)
- Specs → `docs/specs/<task>.md`
- Architecture → `docs/architecture/<task>.md`
- UX flows → `docs/ux/<task>.md`
- UI definitions → `docs/ui/<task>.md`
- Tests → `tests/**`

## Context continuity
`docs/PROJECT_BRIEF.md` and `docs/ROADMAP.md` are the fixed north star — they stop the objective from drifting as `PROJECT_STATE.md` is rewritten over time. The brief and the list of pieces change only with human approval; the orchestrator maintains each piece's status.

`docs/PROJECT_STATE.md` records what happened and what is pending. The orchestrator reads all three at session start and updates the state file at every checkpoint — after plan approval, after each accepted piece, and on every escalation. It is never told when a session ends, so "before ending the session" is not a usable trigger. No session should require the human to re-explain previously established context.

**Files are the memory, not the chat.** Long sessions get compressed and detail is lost.

## UI / UX quality
For projects with a user-facing interface, UX quality is a first-class product requirement. Aim for a polished, professional, intuitive, accessible, responsive, cohesive, production-quality experience with clear hierarchy, efficient repeated workflows, sensible information density, and explicit relevant states.

These are quality goals, not implementation instructions. Do not prescribe a framework, component library, visual style, navigation pattern, color palette, or page structure unless the project requirements/design establish a reason for one. UX/UI specialists determine the appropriate design from the actual product requirements, and review should evaluate the resulting UX against the agreed goals.

## Engineering principles
- Prefer simple, maintainable solutions appropriate to the project scale.
- Prefer reliable/official integrations where available.
- Mock external services in automated tests unless a live integration is explicitly required.
- Cover important failure modes relevant to the actual workload.
- Review acceptance criteria, architecture adherence, security/secrets handling, and relevant trust-boundary/injection risks.
- Keep provider-specific integrations replaceable where practical.

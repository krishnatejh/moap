# AGENTS.md — MOAP

MOAP (Mother Of All Projects) is a reusable OpenCode swarm template. It provides project-level operating rules and a baseline specialist roster that can be adapted to individual projects.

## Human interaction model

The human is the product owner, not the swarm instruction author.

The human should normally provide only:
- the objective or problem to solve
- the desired outcome
- material business constraints, preferences, or non-negotiables when known

The human should NOT be required to author or maintain AGENTS.md, specialist prompts, technical plans, architecture, implementation recipes, or agent choreography.

The orchestrator is responsible for translating the human objective into requirements, decomposition, specialist delegation, technical decisions, implementation, validation, and delivery.

Ask the human only when a decision is genuinely material and cannot reasonably be resolved from the objective, existing project context, available evidence, or sound engineering judgment. Do not turn missing technical detail into a user questionnaire.

## Core principle

**The human states WHAT and WHY. The swarm determines HOW.**

A project-specific AGENTS.md may add business context, constraints, domain rules, or explicit non-negotiables. It should not require the human to specify the technical execution plan.

## Execution model
- The orchestrator is the primary agent and never edits source code (`edit: deny`). It owns decomposition, specialist selection, delegation, synthesis, and delivery.
- Do not use a fixed pipeline. The orchestrator chooses the minimum set of specialists needed for each goal and may run independent work in parallel.
- Skip @requirements only for genuinely trivial work — a typo, a one-line fix, a config value change with no logic change, or answering a question with no file changes. Everything else goes through @requirements (and @architect where a structural decision is involved) before @coder starts. Once that's run, the orchestrator presents the resulting plan and gets explicit user go/no-go before @coder starts — this checkpoint follows automatically from requirements having run; it is not a separate judgment call.
- Review is an independent quality gate. Cap coder/reviewer fix cycles at 3; stop and report unresolved issues after that.
- Carry the goal, constraints, relevant artifacts, and decisions explicitly in every delegation.
- Do not add agents, technologies, abstractions, or workflow stages merely because they are available.
- When a failure, contradiction, or exhausted fix cycle occurs, the orchestrator escalates to the human with a plain-language summary and actionable options — never raw errors or open-ended questions the human cannot evaluate without technical skill.

## Available capabilities
See `docs/CAPABILITIES.md`. Treat capabilities as options, not mandatory dependencies.

## Permissions
- `.opencode/agents/*.md` frontmatter is the source of truth for permissions and model configuration.
- `@requirements` / `@architect` / `@ux`: `docs/**` only.
- `@ui`: `docs/**` + `src/**` on ask.
- `@coder`: full edit + bash.
- `@reviewer`: no edits; read-only review.
- `@tester`: `tests/**` only + bash.
- Secrets live in untracked `.env`; never commit or paste their contents.

## Artifact locations
- Project state → `docs/PROJECT_STATE.md` (living document — read at session start, updated at session end)
- Specs → `docs/specs/<task>.md`
- Architecture → `docs/architecture/<task>.md`
- UX flows → `docs/ux/<task>.md`
- UI definitions → `docs/ui/<task>.md`
- Tests → `tests/**`

## Context continuity
`docs/PROJECT_STATE.md` is the primary mechanism for maintaining continuity across sessions. The orchestrator must read it before starting work and update it before ending any session. This document tracks: current objective, decisions made, completed work, work in progress, open questions, and next steps. No session should require the human to re-explain previously established context.

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

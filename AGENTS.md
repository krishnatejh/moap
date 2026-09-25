# AGENTS.md — MOAP

MOAP (Mother Of All Projects) is a reusable OpenCode swarm template. It provides project-level operating rules and a baseline specialist roster that can be adapted to individual projects.

## Execution model
- The orchestrator is the primary agent and never edits source code (`edit: deny`). It owns decomposition, specialist selection, delegation, synthesis, and delivery.
- Do not use a fixed pipeline. The orchestrator chooses the minimum set of specialists needed for each goal and may run independent work in parallel.
- Requirements/design should be sufficiently settled before implementation. For larger or consequential implementation work, the orchestrator presents the resulting plan and gets explicit user go/no-go before @coder starts.
- Review is an independent quality gate. Cap coder/reviewer fix cycles at 3; stop and report unresolved issues after that.
- Carry the goal, constraints, relevant artifacts, and decisions explicitly in every delegation.
- Do not add agents, technologies, abstractions, or workflow stages merely because they are available.

## Available capabilities
See `docs/CAPABILITIES.md`. Treat capabilities as options, not mandatory dependencies.

## Permissions
- `opencode.json` is the source of truth for permissions and model configuration.
- `@requirements` / `@architect` / `@ux`: `docs/**` only.
- `@ui`: `docs/**` + `src/**` on ask.
- `@coder`: full edit + bash.
- `@reviewer`: no edits; read-only review.
- `@tester`: `tests/**` only + bash.
- Secrets live in untracked `.env`; never commit or paste their contents.

## Artifact locations
- Specs → `docs/specs/<task>.md`
- Architecture → `docs/architecture/<task>.md`
- UX flows → `docs/ux/<task>.md`
- UI definitions → `docs/ui/<task>.md`
- Tests → `tests/**`

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

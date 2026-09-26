# MOAP — Mother Of All Projects

Reusable OpenCode swarm template for starting and evolving project-specific agent systems.

MOAP contains the generic operating model. Individual projects (for example Axia, 100X, or Artha) should keep their own business requirements, architecture, data, code, and project-specific instructions.

## Model strategy

Each agent's model is set in its frontmatter (`.opencode/agents/*.md`). When forking MOAP for a new project, pick one model per tier:

| Tier | Roles | What matters | Budget guidance |
|------|-------|-------------|-----------------|
| **Tier 1 — Reasoning** | `@orchestrator`, `@architect`, `@reviewer` | Judgment, instruction-following, catching errors | Use your strongest model. These agents make decisions that shape everything downstream. |
| **Tier 2 — Execution** | `@coder`, `@tester` | Code quality, tool use, large context | Use a strong coding model. The coder writes all the code — don't economize here. |
| **Tier 3 — Structured** | `@requirements`, `@ux`, `@ui` | Filling well-defined templates | Can use a lighter/cheaper model. Outputs are reviewed before anyone acts on them. |

The template ships with placeholder models. Replace them per-project based on your OpenRouter budget and available models.

## Starting a new project

### 1. Copy the structure
Copy the MOAP directory into your new project. You need:
```
.opencode/agents/       ← all 8 agent files
AGENTS.md               ← operating rules
docs/CAPABILITIES.md    ← capability inventory
docs/PROJECT_STATE.md   ← state tracking (reset it — see step 5)
```

### 2. Set models
Open each file in `.opencode/agents/` and set the `model:` field in the frontmatter. Use the tier table above to decide which roles get your strongest model vs. a lighter one.

### 3. Add project context to AGENTS.md
Append a section to `AGENTS.md` with anything the swarm needs to know about *this* project specifically:
- What the product is and who it's for
- Hard constraints (budget, platform, timeline, must-use technologies)
- Non-negotiables (e.g., "must work offline", "no paid APIs")
- Domain rules the swarm wouldn't know (e.g., regulatory requirements, business logic)

Keep it to facts and constraints. Don't write implementation plans — that's the swarm's job.

### 4. Customize CAPABILITIES.md (optional)
If this project has capabilities beyond the defaults (specific APIs, databases, services), add them. Remove any that definitely don't apply to reduce noise.

### 5. Reset PROJECT_STATE.md
Clear all the placeholder content so the orchestrator starts with a blank state. Leave the section headings intact.

### 6. Replace this README
Replace this file with your project's own README. This bootstrap guide is a MOAP reference — it doesn't belong in the new project.

### 7. First session
Tell the orchestrator what you want to build and what outcome you expect. Example:

> *"I want to build a personal finance tracker that pulls transactions from my bank API, categorizes them, and shows a monthly dashboard. It should be a web app I can self-host."*

The swarm handles the rest — requirements, architecture, implementation, review, testing.

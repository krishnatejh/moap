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
opencode.json           ← sets the swarm as the default agent
AGENTS.md               ← operating rules
.env.example            ← the keys this project needs, without the secrets
.gitignore              ← keeps .env and build output out of git
docs/CAPABILITIES.md    ← capability inventory
docs/PROJECT_BRIEF.md   ← vision and non-negotiables
docs/ROADMAP.md         ← ordered pieces and status
docs/PROJECT_STATE.md   ← state tracking
```

### 2. Set models
Open each file in `.opencode/agents/` and set the `model:` field in the frontmatter. Use the tier table above to decide which roles get your strongest model vs. a lighter one.

### 3. Note your constraints in the first session (do not edit template files)

Do not edit `AGENTS.md` or any other template file. Everything the swarm needs before it plans goes in your first message:
- Hard constraints it cannot infer (budget cap, a platform that must be supported, a deadline)
- Non-negotiables (e.g. "must work offline", "no paid APIs")
- Domain rules it wouldn't know (e.g. regulatory requirements, business logic)

The orchestrator records them in `docs/PROJECT_BRIEF.md` and asks you to approve. Same for the vision, the users, and what success looks like — you describe it, the orchestrator drafts it. Keeping template files untouched means you can pull future MOAP improvements into this project without merging your content by hand.

### 4. Customize CAPABILITIES.md (optional)
If this project has capabilities beyond the defaults (specific APIs, databases, services), add them. Remove any that definitely don't apply to reduce noise.

### 5. Copying from a project that has already been used
Skip this if you copied the clean template — the three context files already ship blank, and only `PROJECT_BRIEF.md` and `ROADMAP.md` carry the `MOAP:UNFILLED` marker that tells the orchestrator to run kickoff.

If you copied from a project that has already been worked on, clear `PROJECT_BRIEF.md`, `ROADMAP.md`, and `PROJECT_STATE.md` first, and make sure the `MOAP:UNFILLED` marker is present in the brief and the roadmap. Otherwise the orchestrator will read the old project's state as if it were this one. Leave the section headings intact — the orchestrator fills them in and needs the structure.

Also delete `docs/archive/` and any leftover review or working notes from the old project so they don't get copied forward.

### 6. Replace this README
Replace this file with your project's own README. This bootstrap guide is a MOAP reference — it doesn't belong in the new project.

### 7. First session
Tell the orchestrator what you want to build and what outcome you expect. Example:

> *"I want to build a personal finance tracker that pulls transactions from my bank API, categorizes them, and shows a monthly dashboard. It should be a web app I can self-host."*

The orchestrator reads the three context files, writes `PROJECT_BRIEF.md` and `ROADMAP.md` from your description, and asks you to approve them. It then handles the rest — requirements, architecture, implementation, review, testing. You never author the plan.

## Two agents, two very different things
| Agent | What it is |
|---|---|
| `orchestrator` | The swarm. Default on session start (`opencode.json` → `default_agent`). Routes everything through requirements → coder → reviewer. |
| `build` | An OpenCode built-in, not part of MOAP. Full edit access, no requirements, no review, no approval checkpoint. |

If you ever switch to `build`, you have opted out of every gate MOAP provides. `general` is a built-in subagent with the same problem — the orchestrator is explicitly denied permission to hand work to it.

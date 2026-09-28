# MOAP — Mother Of All Projects

Reusable OpenCode swarm template for starting and evolving project-specific agent systems.

MOAP contains the generic operating model. Individual projects (for example Axia, 100X, or Artha) should keep their own business requirements, architecture, data, code, and project-specific instructions.

## Model strategy

Each agent's model is set in one place: the `agent` block in `opencode.json`. When forking MOAP for a new project, you edit only that block — the agent files under `.opencode/agents/` set behavior and never need touching for model choice. Pick one model per tier:

| Tier | Roles | What matters | Budget guidance |
|------|-------|-------------|-----------------|
| **Tier 1 — Reasoning** | `@orchestrator`, `@architect`, `@reviewer` | Judgment, instruction-following, catching errors | Use your strongest model. These agents make decisions that shape everything downstream. |
| **Tier 2 — Execution** | `@coder`, `@tester` | Code quality, tool use, large context | Use a strong coding model. The coder writes all the code — don't economize here. |
| **Tier 3 — Structured** | `@requirements`, `@ux`, `@ui` | Filling well-defined templates | Can use a lighter/cheaper model. Outputs are reviewed before anyone acts on them. |

The template ships with working defaults in `opencode.json` — free models where they suffice (`@coder`, `@tester`, `@requirements`, `@ux`, `@ui`) and stronger models where judgment matters (`@orchestrator`, `@architect`, `@reviewer`). For real work, put your strongest available coding model on `@coder` first and your strongest reasoning model on `@orchestrator`: the coder writes all the code, and no prompt structure makes a weak one dependable. Check `opencode models` for the IDs your setup can use.

## Starting a new project

### 1. Copy the structure
Start every project from a **clean copy** of MOAP, without MOAP's own git history:

- **Recommended:** on MOAP's GitHub page, choose **Code → Download ZIP**, and unzip it into a new, empty folder for your project. A ZIP never contains git history, so the new project cannot be accidentally connected to the MOAP repository.
- **If you copy a folder on your own machine instead:** do not copy the hidden `.git` folder. If you do, the project inherits MOAP's history and its connection to the MOAP repository, and the first push would send your project there. The orchestrator checks for this at kickoff and stops if it finds it.

You do not need to set up git yourself. On the first session the orchestrator creates the project's own repository and saves the approved plan as its first version.

The copy needs:
```
.opencode/agents/       ← all 8 agent files
opencode.json           ← sets the swarm as the default agent
AGENTS.md               ← operating rules
.env.example            ← the keys this project needs, without the secrets
.gitignore              ← keeps .env and build output out of git
.gitattributes          ← keeps line endings consistent across machines
docs/CAPABILITIES.md    ← capability inventory
docs/PROJECT_BRIEF.md   ← vision and non-negotiables
docs/ROADMAP.md         ← ordered pieces and status
docs/PROJECT_STATE.md   ← state tracking
```

### 2. Set models
Open `opencode.json` and set the `model:` for each agent under `agent`. Use the tier table above to decide which roles get your strongest model vs. a lighter one. That block is the only template file you edit per project — everything else the swarm needs goes in your first message (step 3).

### 3. Note your constraints in the first session (do not edit template files)

Do not edit `AGENTS.md`, the agent prompts, or any other template file — `opencode.json`'s model block (step 2) is the only per-project edit. Everything the swarm needs before it plans goes in your first message:
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

## When a project needs a specialist MOAP does not have

The base roster covers the full delivery cycle for most projects. Add a specialist **per project** only when a capability recurs that the roster cannot handle — the likely case is live operations: database migrations against real data, background jobs, multi-environment work. Do not add one for deployment alone; deployment is owned by the architect (the runbook's deploy entry), the coder (config files), and you (executing it).

Three rules for any specialist you add:

1. **Narrow scope** — one capability, described in one sentence. "Devops" is not a capability; "runs database migrations after the human approves" is.
2. **Deploy execution stays with the human.** The new agent may prepare, verify, and document, but a deployment runs only when you act — same model as `git push`.
3. **Never the same agent that writes the code.** Keep prepare and write on separate agents, for the same reason coder and reviewer are separate.

## Two agents, two very different things
| Agent | What it is |
|---|---|
| `orchestrator` | The swarm. Default on session start (`opencode.json` → `default_agent`). Routes everything through requirements → coder → reviewer. |
| `build` | An OpenCode built-in, not part of MOAP. Full edit access, no requirements, no review, no approval checkpoint. |

If you ever switch to `build`, you have opted out of every gate MOAP provides. `general` is a built-in subagent with the same problem — the orchestrator is explicitly denied permission to hand work to it.

The seven MOAP specialists are hidden from the `@` menu so you do not reach one by accident. Typing `@coder` by hand still works, and it skips the orchestrator and every check — talk to the orchestrator instead.

## Never start OpenCode with `--auto`

`opencode --auto` (or "Enable auto-approve permissions" in the command palette) approves every permission prompt automatically. MOAP uses a prompt in exactly one place — the orchestrator asks you before it pushes to GitHub — and auto mode would silently answer "yes" to it. Hard blocks still hold in auto mode; prompts do not.

# Roadmap

<!-- MOAP:UNFILLED -->

> The project decomposed into ordered pieces. Written by the orchestrator on the first run. The orchestrator maintains each piece's status; the decomposition itself changes only with human approval.
>
> Re-anchor here every session. If a piece no longer serves `docs/PROJECT_BRIEF.md`, it does not belong on this list.
>
> The marker above means this project has not been through kickoff yet. The orchestrator removes that line once the human approves this roadmap.

## How to read this

Each piece must produce something working and verifiable on its own. A piece counts as **Done** only when every item in the orchestrator's "Definition of done" is satisfied: acceptance criteria passed review and tests, a single documented run command, "how to try it" steps for the human, the context files updated, and a local git commit.

Statuses: `Todo` → `In progress` → `In review` → `Done`. If work cannot proceed, use `Blocked` and record what it is waiting for in `docs/PROJECT_STATE.md`. One piece is `In progress` at a time unless the work is genuinely independent and parallel.

---

## Piece 1 — _name_

- **Status:** Todo
- **Outcome:** _What the human can do once this is done, in one sentence._
- **Spec:** `docs/specs/<task>.md` _(filled in by @requirements when work starts)_
- **Depends on:** _none_

## Piece 2 — _name_

- **Status:** Todo
- **Outcome:** _..._
- **Spec:** `docs/specs/<task>.md`
- **Depends on:** Piece 1

<!--
Piece template — copy per piece:

## Piece N — short descriptive name

- **Status:** Todo | In progress | In review | Blocked | Done
- **Outcome:** What the human can do once this is done.
- **Spec:** docs/specs/N-<slug>.md
- **Architecture:** docs/architecture/N-<slug>.md
- **Depends on:** Piece <n>, or none

Scope: one or two sentences on what is in and what is deliberately not.
Notes: anything the next session needs to know to pick this up cold.

Keep pieces small. If a piece needs its own roadmap, it was too big.
-->

---

## Change log

<!-- Example:
- **2026-09-26** — Initial roadmap written from kickoff description. 5 pieces. Approved by human.
-->

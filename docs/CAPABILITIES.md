# Available Capabilities

This is a capability inventory for the orchestrator. It describes what may be available to a project, not what must be used.

## AI / model capabilities

Each capability carries an **Account available** line: `yes`, `no`, or `unknown`. The template default is `unknown`. The architect must treat `unknown` as not available: flag it at kickoff and confirm it with the human before choosing anything that depends on it. The orchestrator fills in the real values on the first session — it is the one file it fills in rather than authors, because only the human knows what they pay for.

### OpenRouter
- Account available: unknown
- API access and keys may be available.
- Multiple models can be selected.
- Use when model diversity or model capability materially improves the task.
- Consider cost, latency, rate limits, reliability, and provider lock-in.

### JEV
- Account available: unknown
- JEV is TypeSafe's typed decision model (`https://docs.typesafe.ai/`): it takes typed questions against a state and returns structured answers code can use directly — no text parsing. Three primitives: `Choice` (pick from options), `Score` (rate against a rubric), `Noul` (is this true, 0–1). It returns typed values plus probabilities and confidence. Use it inside a product for small, well-defined judgments — classification, routing, prioritization, flagging. Do not use it for open-ended text generation. Needs its own API key in `.env` (`JEV_API_KEY`).
- Docs index: `https://docs.typesafe.ai/llms.txt`.

## Engineering / platform capabilities

### GitHub
- Account available: unknown
- Repository, version control, persistent artifacts, and collaboration.

### Web / external APIs
- Account available: unknown
- External web access and APIs may be available.
- Prefer official and reliable APIs where possible.

### Vercel
- Account available: unknown
- May be available for user-facing applications and suitable server-side/serverless workloads.
- Verify current limits and workload suitability before choosing it.

### Cloudflare
- Account available: unknown
- May be available for APIs, scheduled/background jobs, lightweight processing, and suitable workloads.
- Verify current Workers/runtime limits, scheduling needs, persistence requirements, and operational simplicity before choosing it.

### Scheduling / deployment
- Account available: unknown
- Select based on actual workload and maintenance requirements. Possible options include Vercel, Cloudflare Workers, GitHub Actions, or other suitable mechanisms.

### UI
- Account available: unknown
- User-facing UI may be part of the project's requirements.
- Implementation technology is intentionally not prescribed.

## Capability selection principles
- Prefer deterministic code when sufficient; use AI only where it adds meaningful value.
- Prefer structured/type-safe interfaces when they reduce ambiguity or failure modes.
- Prefer reliable/official APIs over scraping or browser automation where available.
- Prefer infrastructure already available to the user when technically suitable.
- Do not assume a free tier is sufficient; verify relevant limits before committing.
- Consider cost, latency, rate limits, reliability, maintainability, security, and provider lock-in.
- Prefer the simplest deployment architecture that reliably satisfies the workload.
- Keep provider-specific integrations replaceable where practical.

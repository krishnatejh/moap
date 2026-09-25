# Available Capabilities

This is a capability inventory for the orchestrator. It describes what may be available to a project, not what must be used.

## AI / model capabilities

### OpenRouter
- API access and keys may be available.
- Multiple models can be selected.
- Use when model diversity or model capability materially improves the task.
- Consider cost, latency, rate limits, reliability, and provider lock-in.

### JEV
- A type-safe AI capability may be available.
- Consider it for structured AI workflows where typed inputs/outputs and predictable interfaces are valuable.
- Do not assume it is appropriate until the task is evaluated.

## Engineering / platform capabilities

### GitHub
- Repository, version control, persistent artifacts, and collaboration.

### Web / external APIs
- External web access and APIs may be available.
- Prefer official and reliable APIs where possible.

### Vercel
- May be available for user-facing applications and suitable server-side/serverless workloads.
- Verify current limits and workload suitability before choosing it.

### Cloudflare
- May be available for APIs, scheduled/background jobs, lightweight processing, and suitable workloads.
- Verify current Workers/runtime limits, scheduling needs, persistence requirements, and operational simplicity before choosing it.

### Scheduling / deployment
- Select based on actual workload and maintenance requirements. Possible options include Vercel, Cloudflare Workers, GitHub Actions, or other suitable mechanisms.

### UI
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

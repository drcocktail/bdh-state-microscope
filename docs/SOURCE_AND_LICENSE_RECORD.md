# Source and License Record

## Repository-produced materials

| Material | Provenance | License / status | Notes |
|---|---|---|---|
| TypeScript microscope engine | Original for this submission, AI-assisted as disclosed | MIT | No copied model implementation |
| Deterministic scenario fixtures | Original for this submission | MIT | Synthetic vectors; no external dataset |
| React interface and CSS | Original for this submission, AI-assisted as disclosed | MIT | No template, fork, external font, or UI asset |
| State Microscope mark and favicon | Original inline SVG/CSS | MIT | No external graphic asset |
| Documentation and technical writing | Original for this submission, AI-assisted as disclosed | MIT | Primary work cited rather than reproduced |
| Test fixtures and results | Produced by the local engine | MIT | Deterministic mechanism checks, not external benchmarks |

## External software dependencies

React, React DOM, Vite, TypeScript, Vitest, jsdom, Testing Library, and the Vercel AI SDK are used under their upstream licenses. Exact resolved packages are recorded in `pnpm-lock.yaml`. No dependency source is copied into application code.

## External research

The application links to but does not redistribute:

- the BDH paper and official Pathway BDH repository;
- DeltaNet, Parallel DeltaNet, and Gated DeltaNet papers; and
- Zoology / MQAR; and
- the BDH-CQ, Coconut, and recurrent-depth papers cited in the separate blog.

Equations are used as short attributed mathematical facts. Copyright remains with the respective authors and publishers.

## Original problem statement

The attached `Pathway PS.pdf` was used as requirements input. It is not copied into this repository or distributed with the artifact.

## Runtime data and services

- External datasets: none.
- Personal or user data: none.
- Model weights: none.
- API calls: the optional essay companion calls a repository-authored server endpoint. It returns a trace-aware deterministic co-review and attempts a Grok 4.1 Fast co-review through Vercel AI Gateway when that route is available. Inputs are limited to a declared analysis lens, 5-point overlap increment, integer load, and three rounded scores whose stated margin is checked for internal consistency.
- Browser accounts or shipped secrets: none. The optional server endpoint authenticates to Vercel AI Gateway with deployment-bound OIDC.
- Precomputed external scientific results: none.
- Runtime inputs: deterministic synthetic vectors produced in local JavaScript. API commentary—deterministic fallback or stochastic model output—is interpretation, not evidence, and is neither required nor used by the engine.

## AI assistance disclosure

OpenAI Codex assisted with requirements analysis, research, concept selection, implementation, tests, documentation, and browser QA. The runtime endpoint returns a deterministic co-review and can optionally call Grok 4.1 Fast for one selected trace; the interface names the actual responder and labels the whole layer “not evidence.” All resulting code and claims remain the submitting team’s responsibility to inspect, run, and defend.

## Submission license

Repository-authored code and prose are released under the root MIT license unless a file explicitly states otherwise.

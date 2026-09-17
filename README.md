# BDH State Microscope

A deterministic, sign-in-free teaching instrument for the Pathway PS. Independent work, no Pathway endorsement.

## One claim and its scope

A fixed N × D additive state reproduces strictly causal dot-product attention exactly. Exact execution does not guarantee correct recall. In the guided one-hot-value fixture with U=I, margin = 1 - m c, where m is the largest multiplicity of a wrong value. RoPE's correction is computed beside that formula. Ties are not strict recall. This is not a universal recall condition or a trained-model result.

The original eight-page PS was checked independently against the attached final-push proposal. See [scope audit](docs/FINAL_PUSH_SCOPE_AUDIT.md). The PS allows APIs; their removal is an adopted brief constraint and repairs an interpretation endpoint that accepted arithmetic-consistent but fabricated scores.

## Audience and objectives

For ML engineers and students who know dot products, matrix products and causal masking. Prior BDH, RoPE and fast-weight knowledge is not required.

Learn to derive a masked row from a recurrent sum, inspect read-before-write state, predict the fixture's boundary, explain why BDH uses a large sparse neuron space, and distinguish write revision from missing information. The separate essay teaches the distinction between output, intervention and mechanism evidence.

## Three static entries

| Entry | Components | Evidence and computation |
|---|---|---|
| `/` | Independent matrix, recurrent and chunk routes; state inspector; boundary; beta/key controls; prediction and teach-back | Live synthetic engine computation; exact identities; keyword concept feedback, not semantic grading |
| `/lab/` | Dimension/Welch, random sparse lift, time, write rules, landscape/accounting | Seeded live worker sweeps; independent expansions; cited architecture descriptions; tensor shapes only |
| `/blog/` | 600 to 800 word canonical essay; sealed specimen; fault round; ambiguity test; scoped claims | Paper-reported counts; synthetic integrate-and-fire system; independent BFS oracles; exhaustive finite action traces |
| New v2 PDF | Printed from the same Markdown-importing webpage | Static tagged document, separate from frozen submitted v1 |
| Conformance replay | Pinned official rotation and float64 attention products | Precomputed CPU numerical check; excludes LayerNorm/full block/training |
| Brief, plans and v1 docs | Historical provenance | Not current runtime results |

No LLM, server interpretation API, account, credential, weights or external dataset is required. Once static assets have loaded, experiments work offline. External research links require a network. The original prototype engine is retained for history and is not imported by the current app.

## Architecture

```text
src/engine/microscope.ts    Independent additive matrix/recurrent/chunk evaluators
src/engine/scenarios.ts     Guided fixtures and closed-form scope
src/engine/lab.ts           Seeded memory, time, write and shape experiments
src/engine/lab.worker.ts    Cancellable capped capacity sweeps
src/latent/system.ts       Toy neuron system, BFS and finite identifiability
src/content/sources.ts     Primary source URLs and locators
content/blog/*.md           Canonical v2 essay imported by webpage
src/{App,Lab,Blog}.tsx       Control state and semantic views, separate entries
scripts/                   Generated results, content/link gates, PDF
research/                  Official attention conformance and replay output
e2e/                       Real browser correctness, accessibility and latency
```

[S and engine semantics](docs/ENGINE_API.md), [defense derivations](docs/DEFENSE_NOTES.md), [generated results](docs/GENERATED_RESULTS.md), [source/license record](docs/SOURCE_AND_LICENSE_RECORD.md), [AI disclosure](docs/AI_DISCLOSURE.md).

## Reproduce

Node 24 and pnpm 11.19.0 are the CI environment. Dependencies are exact-pinned.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm dev
pnpm check
pnpm results
pnpm links:check
```

The release gate typechecks, runs unit/property tests, builds all entries, checks content/hash/bundle rules and runs Playwright. External link failures warn. The 40 unit tests include 240 seeded sequences across two bases, 128 time combinations, fixture boundaries, beta forms, affine expansions and independent fault enumeration. Browser tests cover two sizes, offline behavior, keyboard/accessibility, routes, hashes, permalinks and two-frame input-to-paint. Exact latest counts and measured conditions are in the final report.

To generate the separate PDF:

```bash
pnpm build
pnpm preview --host 127.0.0.1 --port 4173
# In another terminal:
pnpm pdf:v2
pnpm build
```

The old Python PDF generator remains for v1 provenance only. The new script prints the same canonical essay and references as the webpage. It never overwrites v1.

For official conformance follow [research/README.md](research/README.md). No training was run or authorized.

## Research and limits

Inline numbered citations expose exact source locators on hover/focus. At least three recent primary papers support the artifact: BDH (2025), Parallel DeltaNet (2024), Gated DeltaNet (2024), Kimi Linear (2025), test-time regression (2025) and Zoology (2023). The distinct PS topic-9 essay uses Coconut (2024), recurrent depth (2025), superposition (2025), BDH-CQ (2026) and BDH (2025). Paper counts are not repository benchmark results. The complete claim ledger is [public/blog/claims.json](public/blog/claims.json).

Key limits: random lift thresholds are calibrated on their own corpus; capacity depends on seed/classes/grid and is censored by the cap; Welch does not force a class error; gates are synthetic fixed controls; optimized WY/DPLR kernels are cited, not implemented; accounting is not measured memory; proprietary dimensions and circuits remain unknown; fault identifiability is only relative to three candidate programs and the displayed action menu.

## Freeze and deployment

`main` and production are preserved at the submitted revision `e9691314cf3525e4e579a15c59ecf5267706567b`, with annotated tag `v1-submission`. All new work is on `final-push`, preview-only and unmerged. Do not interpret the production host's current v1 pages as v2. See [final report](docs/FINAL_PUSH_REPORT.md) for the verified preview and PR.

Submitted v1 PDF SHA-256:

`2ef8a487f652f4145d463877de5e0f54993301ae8665541bbec2071e668a32b9`

Production: https://bdh-state-microscope.vercel.app/
Public source: https://github.com/drcocktail/bdh-state-microscope
Frozen v1 PDF: https://bdh-state-microscope.vercel.app/dataforge-latent-reasoning-blog.pdf

## Disclosure and license

OpenAI Codex implemented code/docs/checks. Anthropic Claude supplied the audit/research brief. Automated independent evaluations do not establish human verification: the team must inspect and defend this work. No runtime model is shipped. Original code/prose/graphics are MIT; bundled Manrope is SIL OFL 1.1, with its notice. Dependencies retain upstream licenses. Papers are linked, not redistributed. See the full disclosure and license record above.

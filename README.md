# BDH State Microscope

An executable mechanism exhibit for DataForge 2026’s Pathway problem statement.

The microscope makes one exact architectural fact visible:

> BDH-style causal linear attention can be evaluated from the complete strictly causal attention matrix or from one fixed-shape recurrent state, producing the same outputs. That equivalence removes growing state, but it does not guarantee that the state preserves every distinction required for recall.

The page first proves that equivalence through independent parallel, recurrent, and chunked evaluators. It then drives the same state into a controlled key-collision failure, compares an additive write with a normalized prediction-error write, and retains an identical-key impossibility as a negative control.

This repository does not run a trained BDH language model and does not claim to improve BDH benchmark performance.

## Intended learner and prerequisites

The primary learner is an ML engineer, researcher, or technically curious judge who knows vectors, dot products, causal masking, and the high-level idea of attention. Prior knowledge of BDH, fast-weight memories, RoPE, delta rules, or chunkwise linear attention is not required. Every specialized term needed for the experiment is introduced next to the live state it affects.

## Learning objectives

After using the microscope, a learner should be able to:

1. Explain why a strictly causal attention computation can be regrouped into a fixed-shape recurrent state.
2. Distinguish an execution-schedule equivalence from a claim about recall quality.
3. Read one recurrent transition as a pre-write query followed by a state update.
4. Predict how key overlap and association load change interference in the controlled fixture.
5. Explain what a normalized prediction-error write repairs in the isolated correction probe—and what it cannot repair.
6. Map the exhibit's state orientation and update to the published BDH recurrent-state equation without claiming that this toy mechanism is a trained BDH model.

## What the microscope actually executes

Given a rotated key/query `r_t ∈ R^N`, a value `v_t ∈ R^D`, and a state `S_t ∈ R^(N×D)`, the recurrent route computes:

```text
o_t = r_t S_(t-1)
S_t = S_(t-1) + r_t^T v_t
```

The independent full-sequence route computes:

```text
O = tril(Q K^T, -1) V
S_final = K^T V
```

The independent chunk route computes:

```text
O_chunk = Q_chunk S_in + tril(Q_chunk K_chunk^T, -1) V_chunk
S_out = S_in + K_chunk^T V_chunk
```

The strict lower triangle is essential: every token reads the state before its own write. Conventional pairwise RoPE is enabled in the equivalence and overlap probes. The plasticity comparison explicitly pins positional rotation to `U = I` so the write-rule intervention is isolated.

## The learning and judge journey

1. See the complete causal score matrix beside the fixed 8 × 3 recurrent state.
2. Move through any causal step and inspect the rotated key, value, pre-write state, and output.
3. Read a live maximum-error certificate for full versus recurrent, full versus chunked, and final-state parity.
4. Switch between separated, collision, and high-load scenarios.
5. Sweep key overlap and see the target margin cross zero while both implementations continue to agree.
6. Compare additive accumulation with a normalized delta update on the same-key correction `A → amber`, then `A → violet`.
7. Confront the negative control: one identical address cannot simultaneously answer two incompatible values without more context.
8. Map the state orientation and write term to the published BDH equation.
9. Predict whether chunk scheduling changes outputs, then reveal the computed result.
10. Teach back the difference between exact computational equivalence and lossy representation.

## Locally reproduced results

All results below come from `src/engine/microscope.ts` and `src/engine/scenarios.ts`; the interface and tests call those same functions.

| Probe | Reproduced result | Interpretation |
|---|---:|---|
| Full vs recurrent, default collision | maximum output difference `2.2e-16` | Floating-point parity; below the `1e-10` release tolerance |
| Full vs chunked, default collision | maximum output difference `0.0` | Carrying the incoming state makes chunk scheduling exact in this fixture |
| Final parallel vs recurrent state | maximum difference `0.0` | Both routes accumulate the same state |
| Collision preset, 82% overlap, 6 writes | query output approximately `[1.00, 2.46, 1.64]` | Violet wins; target margin is approximately `-1.46` |
| Separated preset, 8% overlap, 6 writes | target margin approximately `+0.76` | Amber remains strongest |
| Overlap sweep, 6 writes, 39 sampled points | first sampled failure at `35%` overlap | Controlled synthetic boundary, not a language benchmark |
| Additive same-key correction | `[1, 1, 0]`, correction MSE `0.333` | Old and new traces tie |
| Normalized delta same-key correction | approximately `[0, 1, 0]` | Latest correction replaces the old trace in the isolated fixture |
| Identical-key incompatible requests | not simultaneously satisfiable | Missing information is not repaired by a different write rule |

The verification suite also checks full↔recurrent parity over a deterministic 35-scenario overlap-by-load grid, irregular/whole/token chunk schedules, strict causal exclusion, fixed state shape, collision monotonicity, and invalid schedules.

## Architecture

```text
src/engine/microscope.ts        Matrix, recurrent, and chunk evaluators
src/engine/scenarios.ts         Deterministic fixtures and research probes
src/engine/microscope.test.ts   Equivalence, failure, and negative-control gates
src/App.tsx                     Guided microscope bound to engine results
src/styles.css                  Editorial laboratory visual system
docs/                           Plan, results, evidence, defense, traceability
```

The math is framework-independent. React holds controls and maps returned evidence to semantic HTML; it does not reimplement the mechanism.

The older `src/engine/memory.ts` fixture remains only as preserved prototype history. It is not imported by the current application and makes no current product claim.

## Component and evidence status

| Component | Role in the learner journey | What it is |
|---|---|---|
| Parallel, recurrent, and chunked evaluators | Establish the exact execution equivalence | Live deterministic computation in the browser; independently implemented routes |
| Separated, collision, and high-load presets | Give the learner an immediate working example | Declared synthetic vectors and fixed starting parameters; outcomes are recomputed, not recorded |
| Step inspector and matrices | Expose `r_t`, `v_t`, `S_(t-1)`, scores, and outputs | Direct views of the live evaluator trace |
| Overlap/load controls and boundary sweep | Turn associative interference into a falsifiable experiment | Live deterministic parameter sweep over synthetic fixtures |
| Additive versus normalized-delta probe | Test one bounded architectural intervention | Live controlled mechanism experiment with positional rotation pinned to `U = I` |
| Identical-key negative control | Show the addressing information the intervention cannot invent | Live synthetic impossibility test |
| Judge challenge and teach-back | Require a prediction and explanation, not passive scrolling | User input checked against newly computed results and explicit concepts |
| CSS transitions and inline graphics | Provide orientation and presentation | Presentation only; no animation is used as scientific evidence |
| Reported numeric results in this README | Make the expected release behavior auditable | Reproduced locally from the same engine and guarded by tests |
| Paper context and BDH bridge | Connect the exhibit to current research | Paper-supported interpretation, explicitly separated from reproduced results |
| Blog PDF | Satisfy the distinct latent-reasoning essay deliverable | Pre-authored document; not part of the live microscope computation |
| API research interlocutor | Challenge or teach one selected deterministic trace | Bounded server response from Groq-hosted GPT-OSS 120B, with a trace-aware deterministic fallback; never an oracle or evidence source |

## Run and verify

Requirements: Node.js 20+ and pnpm 10+.

```bash
pnpm install
pnpm dev
```

No environment variables, API keys, accounts, model weights, remote services, or network calls are required for the complete deterministic microscope. The optional essay companion calls a bounded repository-authored API endpoint. That endpoint sends only a validated, engine-derived numeric trace to Groq-hosted GPT-OSS 120B using a server-only `GROQ_API_KEY`, with a trace-aware deterministic fallback if the model route is unavailable. No browser secret is shipped. If the endpoint itself is unavailable, every experiment, verdict, test, and source remains usable.

Run the complete gate:

```bash
pnpm check
```

Or run the parts separately:

```bash
pnpm test
pnpm build
```

## Evidence boundary

### Formal identity and locally executed mechanism

- Strictly causal full attention and recurrent additive state produce matching outputs.
- Carrying `S_in` across chunks preserves those outputs.
- State shape remains `N × D` as sequence length grows.
- Synthetic overlapping keys can make the exact shared computation recall the wrong value.
- A normalized delta write replaces a same-key association in the isolated `U = I` correction fixture.

### Paper-supported context, not reproduced as a trained model

- The BDH recurrent-state equation and the official public attention implementation.
- The relationship between delta-rule fast weights, associative memory, and parallelizable linear-attention variants.
- Multi-query associative recall as a useful pressure test for efficient sequence models.

### Explicitly not claimed

- A trained BDH checkpoint, reproduced BDH perplexity, or external benchmark result.
- That the delta intervention improves a trained BDH model.
- Lossless unbounded memory.
- End-to-end latency, energy, dollar, or hardware-memory savings.
- Biological equivalence to a brain.
- A universally superior architecture.

## Primary sources

1. Adrian Kosowski et al., [The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain](https://arxiv.org/abs/2509.26507), 2025.
2. Pathway, [official BDH implementation](https://github.com/pathwaycom/bdh).
3. Iman Schlag et al., [Linear Transformers Are Secretly Fast Weight Programmers](https://arxiv.org/abs/2102.11174), 2021.
4. Songlin Yang et al., [Parallelizing Linear Transformers with the Delta Rule over Sequence Length](https://arxiv.org/abs/2406.06484), 2024.
5. Songlin Yang et al., [Gated Delta Networks: Improving Mamba2 with Delta Rule](https://arxiv.org/abs/2412.06464), 2024.
6. Simran Arora et al., [Zoology: Measuring and Improving Recall in Efficient Language Models](https://arxiv.org/abs/2312.04927), 2023.

See [docs/EXPERIMENT_RESULTS_AND_ARCHITECTURE.md](docs/EXPERIMENT_RESULTS_AND_ARCHITECTURE.md), [docs/EVIDENCE_LEDGER.md](docs/EVIDENCE_LEDGER.md), [docs/MICROSCOPE_IMPLEMENTATION_PLAN.md](docs/MICROSCOPE_IMPLEMENTATION_PLAN.md), and [docs/JUDGE_DEFENSE.md](docs/JUDGE_DEFENSE.md).

## AI assistance disclosure

OpenAI Codex assisted with problem-statement analysis, literature research, concept selection, mathematics, implementation, testing, interface work, documentation, and QA. The submitting team must run and defend the mechanism and independently verify the cited primary work. At runtime, a repository-authored API asks Groq-hosted GPT-OSS 120B for bounded commentary on a declared numeric trace and serves a deterministic trace-aware fallback if that model route is unavailable. The interface names the actual responder; neither response class is used as experiment evidence. No external generated media or proprietary code is shipped.

## Source and license record

- Application code and writing: original for this submission, AI-assisted as disclosed.
- Runtime data: deterministic synthetic vectors generated locally.
- Model weights and external datasets: none.
- Runtime interpretation service: Groq-hosted GPT-OSS 120B with a repository-authored deterministic fallback; server-only credential, bounded structured inputs, capped output, cached responses.
- Graphics: CSS and inline SVG authored in this repository.
- Fonts: operating-system stacks only.
- Research papers: linked, not redistributed.
- License: MIT; see [LICENSE](LICENSE).

## Public deliverables

- Sign-in-free interactive artifact: [bdh-state-microscope.vercel.app](https://bdh-state-microscope.vercel.app)
- Public source repository: [github.com/drcocktail/bdh-state-microscope](https://github.com/drcocktail/bdh-state-microscope)
- Direct blog PDF: [Reasoning Without a Transcript Is Not Reasoning Without Evidence](https://bdh-state-microscope.vercel.app/dataforge-latent-reasoning-blog.pdf)
- Versioned blog PDF: [`output/pdf/dataforge-latent-reasoning-blog.pdf`](output/pdf/dataforge-latent-reasoning-blog.pdf)
- Form-ready submission copy and demo route: [`SUBMISSION.md`](SUBMISSION.md)

On 8 September 2026, the artifact and PDF returned anonymous HTTP 200 responses with Vercel SSO protection disabled. The downloaded PDF matched the repository file at SHA-256 `2ef8a487f652f4145d463877de5e0f54993301ae8665541bbec2071e668a32b9`.

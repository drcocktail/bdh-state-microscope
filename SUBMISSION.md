# DataForge 2026 — Pathway Track Submission

## Deliverables

- **Project:** BDH State Microscope
- **Interactive artifact:** https://bdh-state-microscope.vercel.app
- **Public source:** https://github.com/drcocktail/bdh-state-microscope
- **Blog PDF:** https://bdh-state-microscope.vercel.app/dataforge-latent-reasoning-blog.pdf
- **License:** MIT

All three public endpoints were anonymously checked on 8 September 2026. The artifact and PDF returned HTTP 200 without a Vercel or application sign-in. The downloaded blog matched the versioned PDF at SHA-256 `2ef8a487f652f4145d463877de5e0f54993301ae8665541bbec2071e668a32b9`.

## One-sentence claim

BDH-style strictly causal linear attention can be evaluated exactly as a full attention matrix, a fixed-shape recurrent state, or state-carrying chunks—yet all three can return the same wrong recall when overlapping associations interfere inside that state.

## Copy-ready short description

BDH State Microscope is an executable mechanism exhibit, not a model dashboard. It independently computes the same strictly causal attention sequence through a full matrix, token-by-token recurrence, and arbitrary state-carrying chunks, then certifies their numerical parity live. Learners inspect every pre-write state, change key overlap and association load, watch a recall margin cross zero, compare additive accumulation with a normalized prediction-error write, and confront an identical-key negative control that the intervention cannot solve. A separate interactive essay companion submits the chosen numeric trace to a bounded server endpoint for an evidence-labelled co-review from Groq-hosted GPT-OSS 120B, with a deterministic trace-aware response otherwise. The required 600–800-word PDF covers observability constraints in latent reasoning and cites BDH-CQ, Coconut, and recurrent-depth primary work.

## What is genuinely executed

- Independent parallel, recurrent, and chunked evaluators.
- Strict causal read-before-write semantics.
- RoPE-enabled synthetic association scenarios.
- A 39-point overlap sweep at the selected load.
- Additive and normalized-delta write rules on the same controlled correction.
- A formal identical-address impossibility check.
- Bounded server-side co-review of a three-score trace; the actual responder is named in the interface.

No prerecorded result table, trained checkpoint, judge model, external dataset, or hidden API is used to compute any experimental verdict.

## Reproduced headline results

- Full versus recurrent maximum output error: `2.2e-16` in the default collision fixture.
- Full versus chunked maximum output error: `0.0` in the same fixture.
- Deterministic parity grid: `35/35` overlap-by-load scenarios below `1e-10` tolerance.
- Six-write collision preset: output approximately `[1.00, 2.46, 1.64]`; violet defeats target amber.
- Six-write separated preset: target margin approximately `+0.76`; amber remains strongest.
- First sampled six-write failure: `35%` shared key direction in the declared 39-point sweep.
- Same-key correction: additive output `[1, 1, 0]`; normalized-delta output approximately `[0, 1, 0]` in the isolated fixture.

## BDH connection and boundary

The exhibit maps its state orientation and outer-product write to the recurrent-state update published in the 2025 BDH paper and links the official Pathway implementation. It reproduces a mechanism-level identity, not a trained BDH language result. The delta-style write remains a bounded architectural candidate that requires matched training and held-out language/recall evaluation before any model-level improvement claim.

## Sixty-second judging route

1. Open the default **Collision** preset and read `PARITY PASS` beside the failed amber recall.
2. Click **Separated** to recover recall without changing the state shape or evaluator.
3. Return to **Collision**, move the causal-step selector, and inspect `r_t`, `v_t`, and `S_(t-1)`.
4. Read the **35% overlap** boundary, then compare additive and normalized-delta correction.
5. Use the identical-key negative control to state what the intervention cannot fix.
6. Commit to a chunking prediction and reveal the computed parity result.
7. Optionally use **Essay lab** to receive a bounded, clearly non-evidentiary co-review of the selected trace.

## AI, data, asset, and license disclosure

OpenAI Codex assisted with PS analysis, literature research, concept selection, mathematics, code, tests, interface work, documentation, and QA. The optional runtime endpoint asks Groq-hosted GPT-OSS 120B for a bounded co-review and otherwise serves a repository-authored deterministic response; the interface names the actual responder, and neither response is experiment evidence. Runtime vectors are deterministic and synthetic. No external datasets, model weights, generated media, copied template, external font, or proprietary code are shipped. Repository-authored code and prose are MIT-licensed; cited papers are linked rather than redistributed.

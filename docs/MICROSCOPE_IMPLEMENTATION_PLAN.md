# BDH State Microscope — Implementation Plan

## The product claim

The microscope demonstrates one exact fact and one bounded research question:

1. BDH-style causal linear attention can be evaluated from the complete causal score matrix or from a fixed-shape recurrent state, with the same outputs and final state.
2. Once the exact equivalence is visible, controlled synthetic probes reveal what that fixed state preserves, where overlapping keys cause interference, and how a delta-style write changes the failure boundary without changing the state shape.

This is an executable mechanism exhibit, not a trained BDH language model and not a claim that BDH has been “fixed.”

## Technological spine

```text
deterministic scenario
        │
        ├── parallel causal oracle ── attention scores ── outputs
        │
        ├── recurrent evaluator ───── state snapshots ─── outputs
        │
        ├── arbitrary chunk evaluator ─────────────────── outputs
        │
        └── controlled write-rule lab ─ additive / delta results
                                      │
                                      ▼
                         one shared experiment record
                                      │
                         tests + interface + evidence
```

There is no separate “demo math.” Every number shown in the browser is produced by the same typed engine tested by the verification suite.

## Core mathematical contract

For rotated key/query `r_t ∈ R^N`, value `v_t ∈ R^D`, and state `S_t ∈ R^(N×D)`:

```text
o_t = r_t S_(t-1)
S_t = S_(t-1) + r_t^T v_t
```

For a complete sequence:

```text
O = tril(Q K^T, -1) V
S_final = K^T V
```

For a chunk with incoming state `S_in`:

```text
O_chunk = Q_chunk S_in + tril(Q_chunk K_chunk^T, -1) V_chunk
S_out = S_in + K_chunk^T V_chunk
```

The strict lower triangle is load-bearing: a token reads the state before its own write. Pairwise RoPE is applied to keys and queries in the exact-equivalence path. The plasticity isolation uses `U = I` intentionally so write-rule effects are not mixed with positional rotation.

## Engine boundaries

### Immutable inputs

- `AttentionToken`: id, label, key, value, optional expected value, and role.
- `MicroscopeScenario`: dimensions, tokens, interpretation, and controlled variable metadata.
- `EvaluationOptions`: rotation mode and write rule.

### Returned evidence

- Parallel result: rotated keys, strictly causal score matrix, per-token outputs, final state.
- Recurrent result: output before every write, write outer product, state after every write, final state.
- Chunk result: chunk boundaries, carried incoming/outgoing state, outputs.
- Experiment result: prediction, expected class, margin, maximum parity error, and evidence label.

Inputs and returned matrices are never mutated after construction.

## Invariants and release gates

The interface is not considered correct unless all of these are executable tests:

1. Parallel and recurrent outputs agree within `1e-10` for every token.
2. Their final states agree within `1e-10`.
3. Whole-sequence, token-at-a-time, and irregular chunk schedules agree.
4. The diagonal is excluded: a token cannot read its own current write.
5. State shape is `N×D` regardless of sequence length.
6. The clean association probe recalls the requested value.
7. Increasing controlled key overlap reduces recall margin and eventually produces a visible collision.
8. In the isolated rewrite probe, a normalized delta update replaces the old association more cleanly than an additive write.
9. Two incompatible values attached to the identical key remain an explicit impossibility case, not a manufactured win.

## Interface architecture

The page follows the reasoning order rather than a calendar or feature tour:

1. **Exact equivalence microscope** — one sequence, two computations, a live numerical equality certificate.
2. **State write inspector** — selected token, key/value outer product, and the exact cells changed.
3. **Compression consequence** — growing causal history beside the fixed `N×D` state, with tensor-scalar counts clearly labelled.
4. **Failure-boundary sweep** — overlap/load on the x-axis and recall margin on the y-axis, calculated locally.
5. **Bounded plasticity lab** — additive Hebbian write versus normalized prediction-error write under `U = I`.
6. **Negative control** — identical-address conflict that neither rule can solve without more information.
7. **BDH bridge and evidence ledger** — exact mapping, supported claims, limitations, sources, and a sixty-second judge path.

The existing editorial laboratory visual language remains intact. New visual elements are matrices, equality/error badges, a compact SVG sweep, and side-by-side write-rule results—not a new dashboard aesthetic.

## Iteration loop

Each iteration must close this loop before the next begins:

```text
hypothesis → deterministic fixture → engine result → falsifying test
           → browser explanation → claim/evidence update
```

The intended build sequence is dependency-based:

- First establish the exact oracle/recurrent/chunk engine and its tests.
- Then create controlled scenarios and record actual results.
- Then bind those results to the microscope UI.
- Then audit responsive behavior, keyboard/semantic access, and numerical explanations.
- Finally regenerate the evidence, judge defense, and technical blog from the verified mechanism boundary.

## Evidence vocabulary

- **Formal identity** — follows from the displayed algebra and is checked numerically.
- **Reproduced locally** — emitted by this repository’s deterministic engine and test fixtures.
- **Controlled synthetic result** — informative about this mechanism, not a language-model benchmark.
- **Paper-supported context** — attributed to the BDH paper or official implementation.
- **Hypothesis** — an architectural direction requiring trained-model validation.

## Stop conditions

Do not ship a visual claim if it is not derived from the shared engine. Do not call a synthetic probe a benchmark. Do not imply that a fixed state is lossless merely because its two implementations are equivalent. Do not imply that the delta write improves a trained BDH model. If exact parity fails, the microscope stops and reports the discrepancy instead of hiding it.

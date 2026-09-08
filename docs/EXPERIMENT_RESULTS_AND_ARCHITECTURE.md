# Experiment Results and Architectural Handoff

## Executive result

The local experiments establish three things:

1. The full strict-causal attention calculation, a token-by-token recurrent state, and an incoming-state chunk calculation are numerically equivalent for the additive mechanism exercised here.
2. That equivalence does not protect recall: overlapping key directions mix value traces in the shared state, and the controlled target margin crosses zero.
3. A normalized prediction-error write can revise a same-key association in an isolated identity-rotation fixture where a purely additive write retains both old and new traces. It does not solve incompatible requests that contain identical addressing information.

The first is an implementation/formal result. The second and third are controlled synthetic mechanism results. None is a trained-BDH result.

## Protocol

### Numerical substrate

- JavaScript `number` arithmetic (IEEE-754 double precision).
- Key dimension `N=8`; value dimension `D=3`.
- Query reads the state before its own zero-value write.
- Equivalence and overlap probes use conventional pairwise RoPE.
- Plasticity probe pins rotation to identity (`U=I`).
- All fixtures are deterministic; there is no random seed or external data.
- Parity release threshold: maximum absolute difference `<1e-10`.

### Address construction

The target key is a unit vector in the slowest displayed rotary pair. A distractor with requested overlap `c` is:

```text
k_distractor = c k_target + sqrt(1-c^2) e_private
```

where `e_private` is orthogonal to the target and private to that distractor. Before RoPE, the target–distractor dot product is exactly `c`. Values alternate between violet and mint while target A is amber.

### Evaluators

- **Parallel oracle:** explicitly materializes the strict lower triangle of `QK^T`, then multiplies by `V`.
- **Recurrent:** reads `r_t S_(t-1)` and then writes `r_t^T v_t`.
- **Chunked:** combines `Q_chunk S_in` with the chunk-local strict lower triangle, then carries `S_out`.

These are separate code paths. A parity check therefore has diagnostic value rather than comparing one function to itself.

## R0 — Exactness and scheduling

### Result

- Default collision full↔recurrent maximum output error: `2.2e-16` in the current rendered fixture.
- Default collision full↔chunk maximum output error: `0.0`.
- Default collision final parallel↔recurrent state error: `0.0`.
- Deterministic grid: 7 loads × 5 overlaps = 35 scenarios, all below `1e-10` for output and final state.
- Whole-sequence, token-at-a-time, and irregular chunk schedules all pass.
- The causal diagonal is zero and the first token output is zero.

### Interpretation

The recurrent state is not an approximation of the additive linear-attention calculation in this setting. It is an alternative evaluation schedule. Chunk boundaries are also scheduling choices if the incoming state is carried without truncation.

### What this does not establish

It does not establish end-to-end memory allocation, kernel speed, training stability, or parity with every detail of the trained BDH architecture. The browser’s `T²` versus `N×D` counts are labelled tensor-scalar counts.

## R1 — Controlled interference boundary

### Result

At six writes:

| Fixture | Pre-RoPE overlap | Query output | Target margin | Verdict |
|---|---:|---:|---:|---|
| Separated | 0.08 | approximately `[1.00, 0.24, 0.16]` | approximately `+0.76` | amber recalled |
| Collision | 0.82 | approximately `[1.00, 2.46, 1.64]` | approximately `-1.46` | violet wins |

A 39-point sweep over overlap `[0,0.95]` first produces a non-positive target margin at `0.35` for load six. The page recomputes the curve at loads 3, 5, 6, and 7.

### Interpretation

The fixed state preserves a sum of key–value outer products. Similar query/key directions retrieve a weighted sum of their values. As overlapping distractors accumulate, the strongest competitor can exceed the target even though the implementation parity remains exact.

### Falsifier

If increased constructed overlap does not reduce the target margin, or if the collision preset still returns amber, either the fixture or mechanism explanation is wrong.

## R2 — Bounded state revision

### Fixture

```text
write A → amber
write A → violet
query A, expected violet
```

All key vectors are identical and unit-norm. Rotation is identity. State shape remains 8 × 3.

### Additive result

```text
S ← S + k^T v
query output = [1, 1, 0]
MSE to [0,1,0] = 1/3
```

The correction is accumulated alongside the old trace.

### Normalized delta result

```text
e = v - kS
S ← S + beta k^T e / (||k||^2 + epsilon)
```

With `beta=1`, the query is numerically approximately `[0,1,0]`. The write targets the current prediction error, so the trace along that unit-key direction is revised rather than merely incremented.

### Negative control

If amber and violet are simultaneously required for the same exact key with no distinguishing context, both queries yield the same deterministic `kS`. At least one ground truth must be missed. The delta result is a correction behavior, not an escape from insufficient addressing information.

## Minimal BDH architectural candidate

The paper writes its state in the transposed orientation used below. Let:

```text
v_t = LN(E y_(t,l-1))
k_t = x_(t,l)
```

The published additive update is of the form:

```text
rho_t = (rho_(t-1) + v_t k_t^T) U
```

A minimal normalized prediction-error candidate is:

```text
e_t = v_t - rho_(t-1) k_t
rho_t = (rho_(t-1) + beta_t e_t k_t^T / (||k_t||^2 + epsilon)) U
```

Candidate progression:

1. **Fixed delta:** `beta_t=1`, no new learned parameters. It is the cleanest mechanism ablation but may overwrite too aggressively.
2. **Scalar learned rate:** one constrained `beta_l` per layer.
3. **Token-conditioned gate:** `beta_t=sigmoid(g_l(y_t))`, allowing the model to learn when to revise.
4. **Additive/delta mixture:** preserve a controlled additive path only if the previous stages show delta erases useful superposition.

The location of the error read relative to BDH’s positional transition must be audited against the actual layer convention. The displayed `U=I` result does not determine that engineering choice.

## Graduation ladder: mechanism result → model result

### Gate A — Kernel parity

- Implement recurrent and parallel/chunk formulations for the chosen delta rule.
- Test full/token/chunk parity across sequence lengths and dtypes.
- Retain a slow reference kernel and adversarial dimension checks.

### Gate B — Synthetic associative memory

- Multi-query associative recall with controlled key overlap, load, delay, and repeated correction.
- Separate “append new association,” “revise old association,” and “incompatible identical-key” cases.
- Report exact-match, target margin, old-trace leakage, and failure curves—not one aggregate score.

### Gate C — Matched BDH training

Compare at least:

- published additive baseline;
- fixed normalized delta;
- learned scalar beta;
- token-conditioned beta, if earlier gates justify it.

Hold tokenizer, data order, parameter budget, optimizer, tokens seen, precision, and evaluation harness fixed. Report divergence/NaNs, tokens/sec, peak memory, and multiple seeds before selecting a winner.

### Gate D — Language and long-context evaluation

- Baseline language loss/perplexity to detect destructive forgetting.
- Associative recall/MQAR-style pressure tests.
- Long-context retrieval with controlled distractor similarity and delay.
- Correction/update tasks that actually exercise revision, because a delta rule should not be judged only on append-only memory.

### Gate E — Ablations and falsification

- Remove normalization.
- Sweep beta and gate saturation.
- Move the error read around the positional transition.
- Match compute and parameter count.
- Inspect whether gains come from correction cases while append-only performance regresses.
- Preserve negative results and declare “no justified change” if the trained evidence does not beat the additive baseline.

## Decision boundary

The current evidence justifies building and evaluating the minimal fixed-delta BDH variant. It does not justify replacing the additive update in the main architecture, claiming a benchmark gain, or calling the architecture repaired.

The winning contribution is the microscope plus the experiment contract: it turns a difficult architectural statement into an inspectable equality, locates a concrete failure mode, proposes the smallest causal intervention, and states exactly what experiment can kill the idea.

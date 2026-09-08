# BDH State Microscope — Evidence Ledger

This ledger separates algebra, locally executed results, paper-supported context, and hypotheses. “The interface displays it” is not treated as evidence unless the value is returned by the shared engine and covered by a verification gate.

## Claim-to-evidence map

| Claim | Evidence class | Repository evidence | Boundary / falsifier |
|---|---|---|---|
| `tril(QK^T,-1)V` and the additive recurrent state produce the same causal outputs | Formal identity + reproduced locally | `runParallel`, `runRecurrent`, parity tests | Any maximum absolute difference `>= 1e-10` fails release |
| The final additive state is the same under both routes | Formal identity + reproduced locally | Final-state comparison tests | Any difference `>= 1e-10` fails release |
| Exact incoming-state carry makes whole, token, and irregular chunks agree | Formal identity + reproduced locally | `runChunked` and three schedule tests | A schedule-dependent output falsifies the implementation |
| Parity holds across the controlled scenario surface | Reproduced locally | 35-scenario grid: 7 loads × 5 overlaps | This is deterministic fixture coverage, not a proof over all inputs |
| The recurrent state remains 8 × 3 as the sequence grows | Reproduced locally | Fixed-shape unit test and browser scalar ledger | Tensor state only; not end-to-end runtime memory |
| 82% shared key direction with six writes flips query A to violet | Controlled synthetic result | Collision fixture; output approximately `[1.00,2.46,1.64]` | Constructed association task, not language behavior |
| At six writes the sampled margin first crosses zero at 35% overlap | Controlled synthetic result | 39-point local sweep from 0% to 95% | Grid-dependent sampled boundary; not a universal threshold |
| A normalized delta write replaces a same-key correction in the isolated probe | Controlled synthetic result | Delta fixture returns approximately `[0,1,0]`; additive returns `[1,1,0]` | `U=I`, `beta=1`, unit-norm key, one correction; no trained-model claim |
| Identical key plus incompatible simultaneous values is not solvable without more information | Formal negative control | Same deterministic read `kS` evaluated against two ground truths | A context bit or distinct key would change the problem |
| BDH publishes an outer-product recurrent state update | Paper-supported context | Kosowski et al. 2025, Equation 8 | Microscope uses a transposed orientation and does not reproduce the full layer |
| The public BDH attention computes a strict causal score matrix | Official-code context | `pathwaycom/bdh`, public `bdh.py` | Public forward recomputes within a prefix; persistent deployment state is not claimed |
| Delta-rule fast weights have established linear-attention precedents | Paper-supported context | DeltaNet, Parallel DeltaNet, Gated DeltaNet | These works are architectural priors, not evidence for a BDH improvement here |
| Associative recall is a meaningful efficient-model stress test | Paper-supported context | Zoology / MQAR | Does not establish performance on the current synthetic fixture or rank BDH |
| A delta-style BDH write would improve a trained model | Hypothesis | No supporting trained-model result in this repository | Requires matched training, language evaluation, compute, and ablations |
| API/Groq commentary validates or measures the mechanism | Explicitly excluded | Runtime interpretation is labelled “not evidence” and receives only an engine-derived summary | The deterministic engine, tests, and cited primary sources remain the only evidence layers |

## Reproduced result record

### Exactness

- Default collision, full versus recurrent maximum output error: `2.2e-16` in the current browser result.
- Default collision, full versus chunked maximum output error: `0.0`.
- Default collision, final-state maximum error: `0.0`.
- Release tolerance: `< 1e-10`.
- Grid coverage: 35 deterministic overlap-by-load scenarios.

Small nonzero full-versus-recurrent error is ordinary floating-point accumulation-order variance, not semantic disagreement.

### Controlled recall

- Collision preset: overlap `0.82`, six association writes, RoPE on, query output about `[1.00, 2.46, 1.64]`, violet prediction, target margin about `-1.46`.
- Separated preset: overlap `0.08`, six writes, RoPE on, target margin about `+0.76`.
- Six-write sweep: 39 samples between 0 and 0.95 overlap; first sampled non-positive target margin at `0.35`.

### Controlled plasticity

- Fixture: `A → amber`, then `A → violet`, then query A.
- Isolation: positional rotation off (`U=I`), state size unchanged, unit key, `beta=1`.
- Additive output: `[1,1,0]`; MSE to latest correction `[0,1,0]` is `1/3`.
- Normalized delta output: numerically approximately `[0,1,0]`; old trace is removed in this fixture.
- Negative control: if amber and violet remain simultaneous required answers for the exact same key with no context, neither deterministic rule can satisfy both.

## Primary references

1. Kosowski, A., et al. “The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain.” 2025. https://arxiv.org/abs/2509.26507
2. Pathway. “BDH.” Official public repository. https://github.com/pathwaycom/bdh
3. Schlag, I., et al. “Linear Transformers Are Secretly Fast Weight Programmers.” 2021. https://arxiv.org/abs/2102.11174
4. Yang, S., et al. “Parallelizing Linear Transformers with the Delta Rule over Sequence Length.” 2024. https://arxiv.org/abs/2406.06484
5. Yang, S., et al. “Gated Delta Networks: Improving Mamba2 with Delta Rule.” 2024. https://arxiv.org/abs/2412.06464
6. Arora, S., et al. “Zoology: Measuring and Improving Recall in Efficient Language Models.” 2023. https://arxiv.org/abs/2312.04927

## Claims deliberately excluded

- Reproduced BDH perplexity, training behavior, or downstream benchmark performance.
- A claim that the public BDH implementation already exposes persistent cross-request recurrent state.
- A claim that the normalized delta probe improves a trained BDH.
- Lossless arbitrary-history preservation.
- Full-system speed, memory, energy, hardware, or economic savings.
- Biological equivalence or universal architecture superiority.

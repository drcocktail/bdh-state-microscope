# BDH State Microscope — Judge Defense

## The 20-second explanation

The left panel explicitly computes every strictly causal attention score. The right panel carries only one fixed 8 × 3 state. They are independent implementations of the same additive linear-attention computation, and the live maximum-error certificate shows they agree. Then we increase address overlap: both implementations still agree, but both recall the wrong value. That separates exact computational compression from memory quality. Finally, we isolate one possible architectural intervention—a normalized delta write—and keep an impossible identical-key conflict as the negative control.

## The 60-second demonstration

1. Point to `PARITY PASS` and the three error values: full↔recurrent, full↔chunks, final state.
2. Select token A and then the final query to show read-before-write causality.
3. Click **Separated**: A recalls amber with a positive target margin.
4. Click **Collision**: the state remains 8 × 3, parity remains, but violet wins.
5. Scroll to the boundary plot: at load six, the current 39-point sweep first fails at 35% pre-RoPE overlap.
6. Show additive `[1,1,0]` versus normalized delta `[0,1,0]` for the same-key correction.
7. End on the negative control and say: “Changing the write rule does not manufacture information that is absent from the key.”

## Whiteboard derivation

Let `k_t` be an `N`-dimensional rotated key/query and `v_t` a `D`-dimensional value. Define:

```text
S_t = S_(t-1) + k_t^T v_t
o_t = k_t S_(t-1)
```

Expanding the state before token `t`:

```text
o_t = k_t Σ_(j<t) k_j^T v_j
    = Σ_(j<t) (k_t · k_j) v_j
```

That is exactly the `t`th row of:

```text
tril(Q K^T, -1) V
```

The strict lower triangle and `S_(t-1)` express the same causal rule: read before the current write.

For a chunk with incoming state:

```text
O_chunk = Q_chunk S_in + tril(Q_chunk K_chunk^T, -1) V_chunk
```

The first term covers prior chunks; the second covers earlier tokens inside the current chunk.

## Why collision occurs

Target A has a declared amber value. Every distractor key contains a controlled component in A’s direction and an orthogonal private component. At the final A query, the target contributes amber while the shared components of multiple distractors accumulate violet or mint. Once a competitor channel exceeds amber, the target margin becomes negative.

There is no implementation disagreement: the full matrix and recurrent state compute the same mixed read. The failure is representational interference.

## Why the delta probe is bounded

The intervention uses:

```text
error = v_t - k_t S_(t-1)
S_t = S_(t-1) + beta * k_t^T error / (||k_t||^2 + epsilon)
```

In the isolated unit-key fixture, `A → amber` followed by `A → violet` yields:

- additive write: `[1,1,0]`, so old and new traces tie;
- normalized delta write: approximately `[0,1,0]`, so the old trace is corrected.

We set positional rotation to `U=I` in this comparison and keep `beta=1`. This is not evidence about a trained BDH. It is evidence that a prediction-error write has a qualitatively different revision behavior under a controlled fixture.

## The negative control

If two requests have the exact same key and simultaneously demand incompatible values, a deterministic read `kS` is identical for both. No single output can equal both one-hot targets. A richer key, context signal, gating mechanism, larger nonlinear memory, or query-conditioned operation changes the problem; a write-rule rename does not.

## Likely judge questions

### Is this actually BDH?

It is an executable microscope for BDH’s causal linear-attention state mechanism, not a trained BDH language model. The BDH paper’s recurrent update contains the same outer-product state write plus a positional operator. The public implementation exposes the strict-causal matrix form. We transpose the paper’s matrix orientation for display and declare that mapping.

### Why call the equality “exact” if the badge says `2.2e-16`?

The algebraic identity is exact. Independent floating-point accumulation orders can differ at machine precision. The release tolerance is `1e-10`; the observed error is roughly six orders of magnitude smaller. A displayed nonzero value is more honest than rounding it to zero.

### Are you proving recurrent state always saves memory?

We show tensor-level state shape: the recurrent state is `N × D`, while the displayed causal score map is `T²`. We do not claim end-to-end allocated bytes, training memory, latency, or hardware savings.

### Is the 35% threshold a BDH fact?

No. It is the first failing point in this declared synthetic six-write, 39-sample, RoPE-on sweep. Changing the value schedule, dimensions, load, rotation, or learned representations changes the boundary.

### Did you solve BDH forgetting?

No. We built a sharper diagnosis and a falsifiable intervention. A full claim requires inserting the rule into BDH, training matched baselines, sweeping beta/gating, evaluating associative recall and language metrics, and reporting compute-matched ablations.

### Why not just use softmax attention?

The problem asks us to understand BDH’s recurrent state and architecture. Softmax with an explicit history changes the mechanism and its state-growth profile. The microscope instead explains the current mechanism, shows its boundary, and makes one minimal within-state-shape intervention.

### Why use one-hot values and constructed keys?

They make ground truth and interference observable. This is an isolation experiment: the controlled vectors let us attribute the outcome to overlap and write rule. They are not presented as natural hidden activations or a benchmark dataset.

### What would falsify the implementation?

- Full, recurrent, or chunk outputs differ by `>=1e-10`.
- The diagonal affects a token’s own output.
- State shape grows with sequence length.
- Collision parameters do not flip the declared verdict.
- Delta no longer produces the expected isolated correction.
- The identical-key conflict is incorrectly labelled solvable.

These are executable tests, not promises.

## Language to use

- “The two forms compute the same additive causal result.”
- “The synthetic collision isolates interference in shared key directions.”
- “The state shape is fixed at the tensor level.”
- “The delta write is a controlled architectural probe.”
- “Full-model benefit is a hypothesis requiring training and ablation.”

## Language to avoid

- “We reproduced BDH.”
- “We fixed BDH.”
- “The state stores arbitrary history losslessly.”
- “This proves real language-model recall improves.”
- “The app is a benchmark.”
- “The memory is biologically equivalent to a brain.”

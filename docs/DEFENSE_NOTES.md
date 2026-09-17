# Defense notes

## The claim

Exact regrouping of causal additive attention into a fixed state does not guarantee correct recall. Our declared one-hot fixture exposes a predictable interference boundary; it is not a general theorem about language-model quality.

## Derive the identity

S(t-1) = sum over s<t of r_s^T v_s. Thus r_t S(t-1) = sum over s<t of (r_t dot r_s) v_s, exactly the t-th row of tril(QK^T,-1)V. Query-only tokens have zero effective value. Chunking partitions this same sum into prior-chunk state and within-chunk masked products.

## Derive the boundary

With U=I, the target key is e7 and contributes 1 to amber. Each distractor has target component c and a private orthogonal component. If m is the largest multiplicity of one wrong value, its score is m c. Margin = 1 - m c. A tie is not strict recall. m=2 at loads 4/5, m=3 at loads 6/7. No in-slider crossing exists at loads 1 to 3. RoPE changes dot products, so show the measured correction rather than calling 1/m universally exact.

## Derive the plasticity result

Unit key, U=I, zero prior, same beta for both writes: first delta write stores beta amber. The second read's error is violet - beta amber. The final read is beta(1-beta) amber + beta violet. With an orthogonal second key the prior prediction is zero, so correction becomes a beta-scaled additive write. One common address cannot return two incompatible targets. The best equal-weight common read is [0.5,0.5,0], with MSE 1/6 per target.

## Explain the frame relation

The paper's rho has D × N orientation and evolves rho <- (rho + v x^T)U. The microscope rotates each key absolutely and stores an N × D state. After T writes the relation is S_T^T = rho_T U^(-T), using the conformance script's zero-based keys and write count. The CPU check verifies attention products only, excluding LayerNorm and the full BDH block. Do not claim a trained-model reproduction.

## Explain the large neuron space

Public defaults imply 8192 neurons/head, 256 value channels, 4 heads, 6 layers. Positivity is before RoPE. Claim 7's asymptotic capacity requires suitably prepared keys and assumptions; Claim 8 supplies formal conditions. Our random lift is corpus-calibrated, not a learned encoder. Welch forces pairwise overlap beyond dimension, not a wrong class when keys can share values.

## Explain the blog

Output, intervention and mechanism evidence differ. Table 3 holds query inputs fixed while changing context. It does not identify a circuit. The specimen's true-world and visible-context BFS are independent oracles. Exhaustive fault identification considers only three known programs, a menu and a budget. The restricted round is intentionally ambiguous. Correct guesses there are not identification.

## Demonstration order

1. Derive one row; inspect pre-write A then the query.
2. Compare separated and collision presets while state stays 24 scalars and parity stays below tolerance.
3. Predict 1/m; compare analytic boundary with the sampled sweep.
4. Change beta and key relation; show midpoint negative control.
5. Open one seeded lab assay, noting its corpus and capacity definition.
6. Compare paper counts with caveats; intervene on the sealed specimen and reveal ambiguity.

Do not say we fixed BDH, proved unbounded memory, measured hardware savings, reproduced BDH-CQ, inferred its proprietary capacity or won a benchmark. The real deliverable is a defensible computational teaching instrument.

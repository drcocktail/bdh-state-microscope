# Engine contract

All engines are pure TypeScript and independent of React. Arrays use row vectors; S has key/neuron rows and value-channel columns. Engine results use JavaScript double precision.

## Guided attention

- `rotatePairwise(vector, position, base=65536)`: conventional two-coordinate rotations; an odd trailing coordinate is unchanged. Base must exceed one.
- `runParallel(tokens, options)`: independent strict-lower-triangle additive product. It rejects delta writes. Query-only tokens have effective zero values and do not contribute state.
- `runRecurrent(tokens, options)`: pre-write read followed by an additive or normalized delta write; returns each prior, output, error, write and posterior.
- `runChunked(tokens, schedule, options)`: independent prior-state plus within-chunk product. Positive integer chunk sizes must cover the sequence exactly.
- `maxAbsDifference`, `targetMargin`, `meanSquaredError`: comparison helpers. Strict class recall uses positive target margin; argmax alone does not reject ties.
- `predictedBoundary(load)`, `fixtureMargin(c,load)`: fixture-specific identity-frame closed forms, not universal recall conditions.

## Lab

`runCapacityExperiment` is capped at 128 pairs, 4096 neurons and 16 classes. Gaussian keys use the shared seeded Mulberry32 PRNG and Box-Muller transform. Lift thresholds calibrate per projection row on the same generated corpus; keys are L2 normalized afterward. Zero codes are explicitly counted. Capacity is the last prefix before the first accuracy below 90%; a cap-sized capacity is right-censored. Accuracy recalls all pairs stored at that prefix with their self association included, without causal positional decay. This is a memory assay, not the guided token sequence.

`timeExperiment` uses absolute-position keys and a fixed diagonal decay before each read/write. Its independent expansion weights coordinate i of write s by gamma_i^(t-s). Gates are constant within each RoPE pair. `writeExperiment` gates the prior before computing a delta error, then checks the state against a direct sum of affine transition products. It does not implement optimized compact WY, UT or DPLR kernels.

## Latent specimen

`latentSystem` sums lifted implication matrices, advances a monotone binary frontier at threshold 0.6, and decodes fact codes at 80% activity. The world and visible-context BFS use fact edges, not the neuron simulation. `identifiability` enumerates all sequences up to the budget for three known fault constructions. Its signature contains initial and subsequent output observations, with a restricted mode that exposes only an unreachable control. The exhaustive assertion is relative to those finite programs, observations and action menu.

## Performance and provenance

Capacity sweeps use cancellable workers. Guided computation is synchronous and small. Input-to-paint tests measure two animation frames after a real input event, not inference throughput or hardware performance. Test and source provenance is in the final report. No external trained-model accuracy follows from any engine check.

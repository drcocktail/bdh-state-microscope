# BDH State Microscope — Product Specification

## Product decision

**Concept:** exact causal linear-attention equivalence, followed by a controlled state-quality investigation.

**Working title:** BDH State Microscope.

**Audience:** a technically literate hackathon judge or learner who knows vectors and matrix multiplication but does not need prior fast-weight or BDH expertise.

**One-sentence falsifiable claim:** BDH-style causal linear attention can be computed from a complete strict-causal score matrix or a fixed-shape recurrent state with matching outputs; key overlap can still make both forms return the same wrong recall.

**Bounded architecture hypothesis:** a normalized prediction-error write can revise a same-key association more cleanly than additive accumulation in an isolated `U=I` fixture; full-model benefit remains untested.

## Product journey

1. Open on a collision, not a blank canvas.
2. Show the full causal score matrix and the recurrent state side by side.
3. Display a live numerical equality certificate.
4. Let the learner select any token and inspect the read-before-write state, rotated key, value, and output.
5. Switch to separated keys and see recall recover without changing the algorithm or state shape.
6. Vary overlap and load, then see the live target margin.
7. Inspect a sweep that locates the sampled collision boundary.
8. Compare additive versus normalized delta writes with every other controlled factor fixed.
9. Confront the identical-key negative control.
10. Map the mechanism to BDH, then explicitly state what is not reproduced.
11. Predict chunk behavior before revealing the engine result.
12. Teach back the difference between implementation equivalence and representational capacity.

## Controls

| Control | Range | Directly changed quantity | Held fixed |
|---|---:|---|---|
| Shared key direction | 0 to 0.95 | Pre-RoPE cosine overlap with target A | Values, key dimension, rotation mode, write rule |
| Associations written | 1 to 7 | Number of non-query outer-product writes | 8 × 3 recurrent state shape |
| Inspected causal step | first token through query | Visible pre-write snapshot and selected causal row | Scenario data and computed results |
| Sweep load | 3, 5, 6, or 7 | Number of writes in the overlap sweep | 39 sampled overlap points and RoPE |

The plasticity comparison exposes no free UI tuning knobs: `U=I`, unit key, `beta=1`, and one correction are fixed to keep the intervention interpretable.

## Truth, estimate, and pass condition

- Declared query: A.
- Declared target: amber for the overlap study; violet for the correction study.
- Estimate: `argmax(output)` from the engine.
- Recall margin: target channel minus the strongest competitor channel.
- Parity pass: maximum absolute error below `1e-10`.
- The interface must never convert a failed parity result into a green certificate.

## Evidence classes shown in-product

- **Formal identity** — displayed algebra plus executable numerical check.
- **Reproduced locally** — returned by the repository’s deterministic engine.
- **Controlled synthetic result** — mechanism evidence only.
- **Paper-supported context** — attributed to primary work or official code.
- **Hypothesis / limitation** — unvalidated at trained-model scale.

## Accessibility and robustness

- Semantic landmarks, ordered heading hierarchy, explicit labels, native ranges, real buttons, and a labelled textarea.
- All dynamic verdicts have textual state; color is redundant.
- Matrix and vector graphics expose full accessible numeric labels.
- Every control is keyboard-operable; no required hover, drag-only input, sign-in, API, external font, or model download.
- Layout reflows at 1100, 820, and 560 CSS pixels; document-level horizontal overflow is a release failure.
- Reduced-motion preference collapses presentation transitions.
- Desktop and 390px browser QA must show no runtime warnings or errors.

## Success criterion

A judge succeeds within sixty seconds if they can say:

> The full attention map and the recurrent matrix are two schedules for the same additive causal computation. The state is fixed-size, but overlapping addresses mix values, so exact equivalence does not mean perfect memory. The delta write is a bounded correction experiment, not a trained-BDH result.

## Release gates

1. `pnpm test` passes all engine and interaction tests.
2. `pnpm build` passes strict TypeScript and production bundling.
3. Full, recurrent, and chunk paths stay below the parity tolerance.
4. Collision and separated presets produce opposite declared verdicts.
5. The delta probe and identical-key negative control both remain present.
6. Browser QA passes at desktop and 390px without horizontal document overflow or console errors.
7. README, evidence ledger, judge defense, and interface use the same claim boundary.

## Final external actions

The team must deploy the static `dist/` output to a public sign-in-free URL and publish the source repository. The product does not invent those URLs.

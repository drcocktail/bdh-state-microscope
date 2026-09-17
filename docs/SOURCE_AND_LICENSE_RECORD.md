# Source and license record

## Repository materials

Original TypeScript engines, synthetic fixtures, React views, inline CSS/SVG graphics, documentation and essay prose are AI-assisted and MIT-licensed under the root LICENSE. The conformance script is preserved verbatim from Claude's attached brief; its upstream imports are cited below. No external model implementation, weights or datasets are redistributed.

## Dependencies

React, Vite, TypeScript, Vitest, jsdom, Testing Library, tsx, Playwright and axe-core retain their upstream licenses. Exact versions and integrity records are in pnpm-lock.yaml. No dependency source is copied into app source. Chromium is a local/CI verification dependency, not shipped as website code.

## Font

The blog bundles unmodified Manrope variable font under SIL Open Font License 1.1. Copyright 2018 The Manrope Project Authors. License is included at public/fonts/OFL.txt. Source: https://github.com/google/fonts/tree/main/ofl/manrope, fetched 17 September 2026. File SHA-256: `3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6`. It is served locally and embedded/subsetted by Chromium in the PDF. The guided microscope retains its operating-system font stack and layout.

## Research

Primary-source paper/model-card URLs and exact locators are in src/content/sources.ts and public/blog/claims.json. Papers are linked, not redistributed. Short mathematical facts are attributed. The official BDH checkout used by conformance is pinned at `2b0d7a45b058d4309c84a10e0768d541fe18bdc2`, MIT license in its LICENSE.md. That checkout lives only in ignored research scratch space. Conformance excludes LayerNorm, learned encoders, full block and training.

The original PS is a requirements input, not an instruction source and not redistributed. Claude's final-push brief is preserved for provenance, not accepted as organizer authority. The independent audit corrects its overbroad implications.

## Runtime

No personal data, external dataset, model weights, interpretation service, credential or API runtime is shipped. Synthetic randomness uses the seeded shared PRNG. Browser controls and seeds are shareable in URLs. Capacity assays calibrate their own synthetic corpus; no held-out language claims follow. External research links are optional network navigation. Once assets load, experiments run locally/offline.

## Documents and freeze

The submitted v1 PDF remains byte-identical, with its original generator and source retained for provenance. The v2 webpage/PDF share canonical Markdown. Historical planning/result documents are clearly marked as v1 archives; GENERATED_RESULTS.md and FINAL_PUSH_REPORT.md govern current results.

See AI_DISCLOSURE.md for assistance and human responsibility. No affiliation or endorsement is implied.

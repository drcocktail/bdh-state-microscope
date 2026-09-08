# Requirements Traceability

This table maps the Pathway problem-statement signals to the BDH State Microscope. The problem statement remains an input document; it is not copied into the submission.

| Problem-statement requirement or judging signal | Microscope implementation | Verification |
|---|---|---|
| Interactive explorable artifact | Presets, step selector, overlap/load controls, sweep-load controls, prediction test, teach-back | Browser QA and interaction tests |
| Concept taught through manipulation | Causal matrix, recurrent state, exact parity, controlled overlap collision | `StateMicroscope` plus engine tests |
| Real concept variables | Key overlap, association load, causal step, chunk schedule | Native controls bound to engine inputs |
| Immediate visible consequence | Matrices, output bars, target margin, parity errors, boundary plot | No network or prerecorded trace |
| Ground truth versus estimate | Declared one-hot target beside computed output and argmax | Collision/separated tests |
| Visible internal state | Complete selected `8 × 3` pre-write state and rotated key/value | Accessible matrix/vector labels |
| Sequential state change | Token selector walks every `S_(t-1)` and output before write | Recurrent trace records |
| Explain the BDH mechanism | Equation 8 mapping and official strict-causal implementation link | BDH bridge and evidence ledger |
| Go beyond surface description | Independent parallel, recurrent, and chunk evaluators prove equivalence | `microscope.ts` and parity suite |
| Investigate architecture | Additive versus normalized delta write with `U=I` | Plasticity lab and unit test |
| Preserve limitations | Identical-key negative control and trained-model disclaimer | UI, ledger, defense |
| Fast feedback | Small deterministic matrix operations in-browser | Interaction is immediate |
| No login/API dependency | Static React artifact, local synthetic fixtures | Clean run without environment variables |
| Source transparency | Primary links, source/license record, AI disclosure | README and docs |
| Separate 600–800 word technical blog | Topic 9 essay on observability constraints in latent reasoning | `docs/BLOG.md` and generated PDF |
| Optional deeper interaction without confusing evidence | API co-review of a bounded, engine-derived trace, with optional Grok route | Server-only endpoint; layer labelled “model commentary, not evidence,” actual responder named |

## Judging-dimension coverage

| Dimension | Evidence in this repository |
|---|---|
| Technical accuracy | Algebra, independent evaluators, 35-scenario parity grid, strict-causal and chunk tests |
| Technical depth | Visible state transition, chunk carry, RoPE path, bounded delta intervention |
| Interactivity | Four control families, step inspection, challenge, teach-back |
| Pedagogy | One reasoning order: equivalence → compression → collision → intervention → negative control |
| Originality | A state microscope that proves the schedule equivalence before investigating failure |
| Evidence discipline | Five explicit evidence classes and claim-by-claim falsifiers |
| Usability | Desktop/mobile reflow, semantic controls, accessible numeric alternatives |
| BDH relevance | Direct equation and official-code bridge; no generic AI detour |

## Current mechanical verification

- `pnpm test`: 19 tests across engine, legacy prototype, and interface at the time of this record.
- `pnpm build`: strict TypeScript and Vite production build pass.
- Browser: desktop and 390px checked; no console warnings/errors and no document horizontal overflow.
- Default collision: live parity pass while recall fails.
- Separated preset: live recall recovery.

The exact test count is descriptive, not load-bearing; `pnpm check` is the source of truth.

## External submission requirements

| Requirement | Repository status | Team action |
|---|---|---|
| Public working artifact URL | Complete and anonymously HTTP-checked | `https://bdh-state-microscope.vercel.app` |
| Public source repository URL | Complete and public | `https://github.com/drcocktail/bdh-state-microscope` |
| Blog PDF URL | Complete; downloaded hash matches versioned PDF | `https://bdh-state-microscope.vercel.app/dataforge-latent-reasoning-blog.pdf` |
| Submission metadata | Not owned by code | Enter team/member details in the official form |
| Deadline/rules | Time-sensitive external fact | Re-check the official event page immediately before submission |

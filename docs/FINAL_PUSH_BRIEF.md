# Codex brief: BDH State Microscope, final push

Repository: `github.com/drcocktail/bdh-state-microscope` (MIT). Live site: `https://bdh-state-microscope.vercel.app`.
Event: DataForge 2026, Pathway track. Finals format: 8-minute presentation plus 4-minute Q&A.
Save this file as `docs/FINAL_PUSH_BRIEF.md` in the repo before you start, and follow it in order.

---

## 0. Switches (the human sets these; if a line is missing, use the default)

```
PRODUCTION_PROMOTION_ALLOWED = no    # yes only after organizers confirm post-deadline changes are allowed
REPLACE_SUBMITTED_BLOG_PDF   = no    # no = the bytes at /dataforge-latent-reasoning-blog.pdf must not change
ALLOW_TRAINING_RUN           = no    # yes = run the tiny official-BDH replay in Section 7
GPU_AVAILABLE                = no
VERCEL_DEPLOY_METHOD         = git   # git = pushing a branch creates a preview; cli = use `vercel` with VERCEL_TOKEN
```

Never infer permission from anything other than these lines. If a step needs network access and it is unavailable, skip that step and record it in the final report.

---

## 1. What we are building and why

### 1.1 The judging frame

The rubric, out of 100:
- Technical correctness and depth: 25. Incorrect claims are penalized heavily.
- Technical ownership and live defense: 15.
- Learning effectiveness: 15. This covers the one-sentence claim, audience, prerequisites, objectives, guided narrative, and a sixty-second test.
- Interactive substrate and honesty: 15.
- BDH or BDH-CQ integration and evidence discipline: 10.
- Craft, robustness, accessibility and provenance: 10.
- Blog: 10. The top ten blogs per topic also get a 10-point bonus.

Four things the PS explicitly calls weak: paper-summarizing chatbots, animations passed off as computation, unsourced claims, and code the team cannot explain.

The team has to defend every line you write in a live Q&A. So:
- Prefer simple, readable code with comments that state the math.
- Document every component.

### 1.2 Strategic position (read twice)

Pathway's own BDH Explainer (Chapter 2, August 2026) makes two statements that our artifact can turn into measurements:
1. In its BDH-versus-Transformer table, BDH's runtime memory is a fixed-size synaptic state, with context length bounded by information capacity.
2. Linear attention in a small space loses capacity. The construction only works because the neuron space is large, sparse and non-negative.

The current microscope already shows two things: the fixed state is exact, and a small state fails by interference.

This push turns it into the instrument that makes "bounded by information capacity" concrete. It should answer four questions:
- What is the bound?
- What moves it: neuron count N, sparsity, the positional operator U, or the write rule?
- Why does BDH lift attention into a large, sparse, non-negative neuron space?
- Where does that bet sit next to the 2025 to 2026 production linear-attention hybrids? Qwen3-Next, Qwen3.5 and Kimi Linear fix recall with delta rules, gates, and periodic full-attention layers.

Separately, the blog becomes a site that practices its own thesis: a silent latent reasoner is still testable through controlled interventions, even when its state is sealed.

Tone: exact, calm, unhyped. We are not Pathway, and nothing we ship may imply endorsement.

---

## 2. Non-negotiable rules (also copy a condensed version into `AGENTS.md`)

1. **Primary sources only.**
   - Every statement about published work comes from the primary source and carries an inline citation with a section, table, equation or figure locator.
   - Use the fact sheet in Section 11.
   - If you need a fact that is not there, read the primary source (arXiv PDF or official repo). If you cannot access it, do not state it.
2. **Three kinds of number only.** Every number on screen is one of:
   - (a) computed live in the browser from the engine;
   - (b) a replay of a committed artifact produced by a committed script, showing seed and script path;
   - (c) a primary-source number with citation.
   
   Never invent a number, and never type a number that code could generate.
3. **Evidence labels on every panel.** Exactly one of:
   - Live computation
   - Formal identity
   - Precomputed replay
   - Paper-reported
   - Teaching simplification
   - Hypothesis
   
   Render them as sentence-case badges, not all-caps chrome.
4. **Claims you must never make or imply:**
   - that BDH or BDH-CQ uses a delta rule or data-dependent gates (the BDH paper and public code use additive writes with a fixed U; BDH-CQ's rule is proprietary);
   - that we trained or reproduced BDH or BDH-CQ (unless Section 7 ran and its artifacts ship);
   - any latency, memory or cost savings beyond tensor-shape accounting;
   - that the blog's toy reasoner is how BDH-CQ works;
   - that Pathway endorses this work.
5. **No LLM at runtime.** No chatbot, no LLM call, no server route. Delete `api/explain.ts` and everything that depends on it.
6. **Public copy style:**
   - No em dashes and no en dashes used as punctuation.
   - No emojis, no exclamation marks.
   - No filler vocabulary ("delve", "unlock", "seamless", "revolutionary", "game-changer", "it is important to note", "in today's fast-paced world").
   - Never use "judge" as an audience word.
   - Sentence-case headings.
   - Paraphrase sources. Quotes are rare and under 15 words.
7. **Stable submitted URLs.**
   - `/` must keep returning 200.
   - `/dataforge-latent-reasoning-blog.pdf` must keep returning 200.
   - With `REPLACE_SUBMITTED_BLOG_PDF = no`, that PDF's SHA-256 must stay `2ef8a487f652f4145d463877de5e0f54993301ae8665541bbec2071e668a32b9`.
8. **Determinism.** All randomness goes through one seeded PRNG (for example mulberry32). Seeds are visible in the UI and encoded in permalinks.
9. **Speed.**
   - Guided-path controls update within 100 ms.
   - Lab sweeps finish within 1 s: run them in a Web Worker, show progress, and display caps openly.
10. **Accessibility.**
    - Keyboard-reachable controls with visible focus.
    - Numeric aria labels on heatmaps and plots.
    - `prefers-reduced-motion` respected.
    - WCAG AA contrast.
    - No horizontal scroll at 390 px.
11. **Release hygiene.** Tests and build pass before every push. No secrets in the repo.
12. **When unsure, be conservative.** Write the smaller claim and put the uncertainty on the page.

---

## 3. Preflight (report each result)

1. **Tag and branch.**
   - Confirm a clean tree.
   - Tag the submitted state if it is not tagged already: `git tag -a v1-submission e969131 -m "State submitted on 8 Sept 2026"`, then push the tag.
   - Create branch `final-push`.
2. **Baseline.** Run `pnpm install --frozen-lockfile && pnpm test && pnpm build`. Expect 22 passing tests; record the count.
3. **Repo docs.** Save this brief as `docs/FINAL_PUSH_BRIEF.md`, and write `AGENTS.md` from Section 2.
4. **Tooling check.**
   - Node 20 or later, pnpm.
   - Playwright with Chromium.
   - Python 3 with numpy (plus torch if `ALLOW_TRAINING_RUN = yes`).
   - `gh` auth; Vercel auth or token.
5. **Pin dependencies.** `package.json` uses `latest` for every dependency. Replace each with the exact version resolved in `pnpm-lock.yaml`, reinstall with the frozen lockfile, and rerun the tests.

---

## 4. P0: correctness and honesty fixes (must ship)

### 4.1 Remove the Essay lab and the API

**Delete:**
- `ResearchInterlocutor`, `CommentaryPoints`, `ESSAY_LENSES` and the nav link in `src/App.tsx`;
- `api/explain.ts`, `dev-api.ts`, `dev-api.test.ts`;
- the dev plugin in `vite.config.ts`.

Move the blog link into the evidence section and the footer. Remove every Groq mention from `README.md`, `SUBMISSION.md` and `docs/SOURCE_AND_LICENSE_RECORD.md`.

Why this matters (for the report): the route accepted client-supplied scores without recomputing them. A request with `overlap=10&load=2&scores=0.000,9.000,0.000&margin=-9.000` returned 200, and the model narrated the fabricated trace. That contradicts the "internally checked" copy.

In the final report, tell the human to delete `GROQ_API_KEY` from the Vercel project settings. Do not do it yourself.

### 4.2 One claim on the page

Replace the hero line "Built to prove equivalence, compression, interference, and one bounded architectural intervention" and the "invariant" card with the claim and its scope.
- **Claim:** "A fixed N × D linear-attention state reproduces strictly causal attention exactly, and its recall fails exactly when the keys that carry one wrong value, taken together, overlap the query more than the target key does."
- **Scope line:** "In the fixture below, that happens above shared-key overlap 1/m, where m is the number of distractors that share one wrong value."

Keep the identity `tril(QKᵀ, -1)V = rows of r_t S_(t-1)` as a formula inside the microscope panel.

### 4.3 Audience strip under the hero

- **For:** ML engineers and students who know dot products, matrix products and causal masking.
- **Not required:** BDH, RoPE, fast weights.
- **You will be able to:**
  - (1) derive the recurrent form from the masked matrix;
  - (2) predict where recall breaks for any slider setting;
  - (3) explain why BDH keeps its keys in a large sparse neuron space;
  - (4) say what a different write rule can and cannot repair.

Remove "technically curious judge" everywhere, README included.

### 4.4 The analytic boundary, everywhere

**The math.** In the collision fixture, target A has key e7 and value amber. Each distractor has a shared component c along e7 plus a private orthogonal unit component. Distractor values alternate violet and mint. At the final query, the scores are:
- amber ≈ 1;
- violet ≈ c × (number of violet distractors);
- mint ≈ c × (number of mint distractors).

So the margin is 1 - m·c, where m is the larger of the two distractor counts, and recall breaks at c* = 1/m. RoPE shifts this by about 1e-6.

**Engine.**
- Add `predictedBoundary(itemCount)` to `src/engine/scenarios.ts`. It returns 1/m, or `null` when m < 2, because then c* ≥ 1 is outside the slider.
- Expected values:

  | Load | m | Predicted boundary c* |
  |---|---|---|
  | 1 to 3 | 0 or 1 | none within the slider |
  | 4 or 5 | 2 | 0.5 |
  | 6 or 7 | 3 | 1/3 |

**Sweep plot.**
- Draw the prediction as a labeled vertical line.
- Readout text: "Predicted 33.3%, first sampled failure 35%." Use a comma, not a middle dot, and fill in live values.

**Microscope.** Show `margin = 1 - m·c` as a live formula next to the output bars, with the current numbers substituted. Also show the computed-minus-formula difference, which is the RoPE correction and should stay below 1e-4.

**Tests.**
- For loads 4 to 7, the computed margin changes sign within ±1e-3 of 1/m.
- For loads 1 to 3, recall holds for every c ≤ 0.95.

### 4.5 One-minute check

Rename "60-SECOND JUDGE TEST" to "One-minute check". Make the primary task a prediction:
1. Question: "Load 5. At what shared-key overlap does recall of A first break?"
2. Options: 30%, 40%, 50%, 60%.
3. The learner commits.
4. The page then animates the real slider across the range and shows the computed crossing.

Keep the chunking question as a second, optional check. Its explanation should say that chunking is a scheduling choice when state is carried exactly.

### 4.6 RoPE base

- Set the default base to `2 ** 16` to match `pathwaycom/bdh` (`get_freqs(N, theta=2**16, ...)`), and keep the base as a parameter.
- Page note: "RoPE base 2^16, as in the official code. The target key sits in the slowest-rotating pair, so position barely affects this probe. Parity does not depend on the base."
- Recompute every number shown in the README and on the page.

### 4.7 Rewrite the BDH bridge (four cards, facts from Section 11)

**Card a: the equation.**
- Paper Eq. 8: ρ_{t,l} = (ρ_{t-1,l} + LN(E y_{t,l-1}) x_{t,l}ᵀ) U.
- Explainer Chapter 2 uses the row-vector convention with ρ = σE ∈ R^{N×D}.
- State plainly:
  - our S uses that row-vector orientation (rows are neurons, columns are value channels);
  - our recurrence rotates each key by its absolute position;
  - this is algebraically identical to the paper's co-rotating recurrence, with S_Tᵀ = ρ_T U^(-T);
  - this is verified numerically by `research/conformance_official_bdh.py` (Section 12).

**Card b: why N is large.**
- Keys and queries are the same sparse non-negative neuron vector x.
- The public default config gives N = 8,192 neurons per head, D = 256, and 4 heads. One layer's state therefore holds 4 × 8,192 × 256 = 8,388,608 numbers whatever the sequence length, versus 8 × 3 here.
- Paper §6.1, Claim 7: on the order of n facts are distinguishable under weak-correlation assumptions, and on the order of √n without them. The formal statement is Claim 8 in Appendix C.2.
- Explainer Chapter 2, Step 2 warns that small spaces lose capacity.
- Link to the Lab chapter "Lift into neurons".

**Card c: U is rotation or damping.**
- Paper Definition 4, and Explainer Chapter 2 Step 6: a diagonal U damps like ALiBi, and 2×2 rotation blocks act like RoPE.
- Paper §6.1, "natural support for long context":
  - damping of stale context was needed;
  - RoPE with ALiBi sufficed for the vanilla model;
  - selective forgetting and state compression are named as possible additions.
- The public code implements RoPE only.
- Link to the Lab chapters "Time" and "Write rules".

**Card d: BDH-CQ.**
- The report writes its memory as S_t = U_θ(S_{t-1}, D_t) and says this avoids a growing explicit KV cache.
- It names linear attention as the simplest special case, S_t = S_{t-1} + U_θ(D_t), within what it calls linear correction rules on S. The actual rule, and the dimensions, are proprietary.
- Its §6.3 binding probe: a demonstration-defined color permutation is applied correctly on 24/24 held-out outputs at every level from 2 to 8 simultaneous bindings (96 outputs).
- Our toy cannot infer BDH-CQ's capacity, because its state size is undisclosed.

Keep the evidence card "This is not a trained checkpoint."

### 4.8 Honesty nits

- **Negative control.** `identicalKeyConflict()` hard-codes `simultaneouslySatisfiable: false`. Compute it instead:
  - for one-hot targets a and b, the best any single read can do is their midpoint, with MSE 1/6 to each;
  - show that value, and the delta read's errors (0 to violet, 0.667 to amber).
- **Dead label logic.** Delete the unused 0.72 title and description switch in `buildAssociationScenario`. It labels 0.58 with seven items as "Separated", yet recall fails there.
- **"High load" preset.**
  - Rename it to "Seven writes, 58% overlap".
  - Note: "Fails because m·c > 1, not because the state is full. At 0% overlap all seven are recalled."
- **Scope note** in the plasticity section: "The exact masked-matrix form shown above covers additive writes. Delta writes have a different exact parallel form (see Lab, Write rules)."

### 4.9 Controls for the plasticity section

- **β slider.** Range 0 to 1, step 0.05. Beside the computed read, show the closed form for the same-key correction: `read = β(1-β)·amber + β·violet`.
- **Key toggle.** "Same key / orthogonal key". Show that, for orthogonal unit keys, the delta write reduces to a β-scaled additive write, so revision only matters when keys overlap.
- **Tests.**
  - The closed form matches the computed read to 1e-12.
  - The orthogonal-key reduction holds to 1e-12.

### 4.10 Citations beside claims, and "why now"

**Inline citations.**
- Numbered markers next to technical claims.
- Focus or hover opens a small popover with the source, locator and link.
- A reference list at the bottom.

**A short "why this matters now" paragraph** (facts in Section 11):
- **Qwen3-Next.** Its team reports that linear attention is fast but weak at recall. They mix Gated DeltaNet with gated attention at 3:1.
- **Kimi Linear.** It extends Gated DeltaNet with channel-wise gating, in a 3:1 hybrid with MLA.
- **Scale.** Qwen3.5 carries the hybrid to 397B total parameters; verify from Qwen's model card before citing.
- **The link.** Our boundary is the mechanism behind that recall weakness.

### 4.11 Footer

Links to:
- repo
- README
- license
- source-and-license record
- AI disclosure
- blog v1 PDF
- blog site
- changelog

### 4.12 Tests to add

- **Randomized parity:** 200+ seeded sequences with random N, D and T, random chunk schedules, and both RoPE bases. Tolerance 1e-10 for outputs and final state.
- **Unit tests:** the boundary tests (4.4), the computed negative control, and the β closed form.
- **Guard test:** the built bundle contains no `api/` fetches and no "groq" string.

### 4.13 Conformance script

Add `research/conformance_official_bdh.py` exactly as given in Section 12, plus `research/README.md` explaining how to run it (it expects a `pathwaycom/bdh` checkout at `./bdh` or at `BDH_PATH`). Record its output in the README and cite it on card a.

### 4.14 README and SUBMISSION

Rewrite both with:
- the claim;
- audience, prerequisites and objectives;
- architecture;
- a component table saying which parts are live, precomputed, synthetic or animated;
- reproduction steps;
- sources and licenses;
- disclosure.

**Generated numbers.** Results tables must be generated. Add `scripts/report_results.ts`, which prints the table from the engine, and paste its output. Nothing is typed by hand.

**Disclosure text.**
- OpenAI Codex implemented code and documentation.
- Anthropic's Claude audited the live site and repo, synthesized the primary sources, and wrote this brief.
- The team verified the math independently. List the verification scripts.

Update `docs/JUDGE_DEFENSE.md`, renamed to `docs/DEFENSE_NOTES.md`, with the closed-form boundary and the frame relation.

### 4.15 Optional polish (only if time remains)

Reduce template tells without redesigning:
- sentence-case labels instead of all-caps eyebrows;
- no middle-dot separators;
- no arrow glyphs appended to links.

Keep the palette and layout.

---

## 5. P1: the concept, explored (the Lab)

### 5.0 Structure

**Routing.**
- The guided path on `/` stays tight, with the P0 changes, and ends with "Open the lab".
- The Lab lives at `/lab/`, as a separate Vite entry.

**Every chapter has:**
1. the question;
2. a one-sentence answer that the learner can falsify with the controls;
3. controls named after the real variable they change;
4. truth beside estimate;
5. an evidence label;
6. citations;
7. a "what this does not show" line;
8. a permalink that encodes all control state and the seed.

**Implementation.** Sweeps run in a Web Worker and reuse `src/engine`. Keep the engine free of React.

**Expected results.** The numbers in the chapters below are expectations from an exploratory numpy run, with 8 value classes, a 90% recall threshold and 3 seeds. Reproduce them with your own code and print your own numbers. Do not paste these.

### 5.1 Chapter "Past the dimension"

- **Setup.**
  - Random unit keys in R^N, with N ∈ {4, 8, 16, 32}.
  - Stored-pair count t from 1 to 4N.
  - One-hot values over C classes (C slider 2 to 16), and a seed.
- **Show:**
  - recall accuracy against t, with a vertical line at t = N;
  - the maximum |cos| among stored keys, next to the Welch lower bound sqrt((t - N) / (N (t - 1))) for t > N;
  - an "orthogonal keys" mode for t ≤ N, where recall is exactly 100%.
- **Answer:** "With more stored keys than dimensions, some pair must overlap by at least the Welch bound, so additive recall can no longer be exact."
- **Expectation:** capacity at 90% recall is about N for dense random keys.
- **Label:** Formal identity for the bound; Live computation for the curve.

### 5.2 Chapter "Lift into neurons" (why BDH works in a large sparse non-negative space)

- **Raw keys:** dense unit vectors in R^d, with d = 16.
- **Lifted keys:**
  - b(v) = ReLU(Λv - θ_row), with Λ an N × d Gaussian matrix;
  - the threshold is set per row to keep a chosen active fraction;
  - rows are normalized.
- **Controls:**
  - N from 64 to 4,096;
  - active fraction from 1% to 50%;
  - t;
  - seed.
- **Reference curve:** dense random keys in R^N, the regime of Claim 7.
- **Show:**
  - recall against t for raw, lifted and dense-in-N keys;
  - capacity at 90% recall;
  - mean off-diagonal cosine of the lifted keys, next to the active fraction;
  - state size N × C.
- **Expectations to reproduce:**
  - Raw d = 16 holds about 15 pairs.
  - Lifted keys at 5% activity hold about 39, 61 and 122 for N = 128, 512 and 2,048.
  - Lifted keys at 20% activity hold only about 24 to 31.
  - Dense keys in R^N hold roughly 0.9N.
  - The lifted mean cosine is close to the active fraction (about 0.05 at 5%). This common overlap is why growth is sublinear.
- **Answer:** "Lifting keys into a large sparse non-negative space multiplies how many associations a fixed state can separate, and sparser codes separate more, but non-negative codes share a common overlap that grows with the number of writes."
- **Cite:**
  - paper §6.1: Claim 7, Observation 7 (the LSH affinity expressible with positive keys) and Observation 8;
  - Explainer Chapter 2, Step 2, and its table row calling BDH retrieval an LSH-like lookup.
- **Label:** Teaching simplification (BDH learns its encoder; random hyperplanes are our stand-in).

### 5.3 Chapter "Time" (the U operator)

- **Controls:**
  - U mode: identity, RoPE, damping, or RoPE plus damping;
  - RoPE base: 10^4 or 2^16;
  - the target's RoPE pair: slowest or fastest;
  - damping γ per step, from 0.80 to 1.00, either scalar or per-neuron;
  - write order: target first or target last.
- **Show:**
  - target and competitor scores against distance;
  - live parity between the parallel form (scores `k_s·k_t` times U-powers or γ^(t-s)) and the recurrent form, which stays at about 1e-15 in every mode;
  - the recency trade-off: damping suppresses old distractors and the old target alike.
- **Answer:** "A fixed U changes which past writes count and by how much, but it cannot tell a relevant old fact from an irrelevant one."
- **Cite:** paper Definition 4 and §6.1 (long context); Explainer Chapter 2, Step 6; the official code, which has RoPE only.
- **Labels:** Paper-described variant for damping; Live computation for results.

### 5.4 Chapter "Write rules" (memory as online regression)

**Rules to implement.** Use L2-normalized keys for every delta variant. Before rendering any update equation, verify it verbatim against the paper.
- additive (Hebbian);
- delta (β);
- gated delta (scalar α_t and β);
- channel-wise gated delta (a diagonal α over key channels, as in Kimi Delta Attention).

**Scenarios:**
- (1) **Revision:** A → amber, then A → violet, with a distractor B present.
- (2) **Trip update**, from Pathway's BDH-CQ launch post, which describes a cancelled flight in a multi-country trip:
  - store several facts about a trip;
  - change one of them;
  - query every fact;
  - show which facts stay valid under each rule.
- (3) **Over capacity:** t > N, where delta acts as online least squares.

**For each rule, show:**
- the update formula;
- the per-step loss it takes one gradient step on. Derive and verify the orientation and sign:
  - additive is a step on a linear objective;
  - delta is a step on ½‖v - kS‖², with step size β/‖k‖².
- the recall table;
- its exact parallel form:
  - additive: the masked matrix;
  - delta and gated delta: chunkwise compact WY / UT (Yang et al. 2024; Gated DeltaNet);
  - channel-wise: the chunkwise DPLR form (Kimi Linear).

**Stretch (P2).** Implement the chunkwise WY form for delta, and show live parity against the recurrent form within 1e-10. This answers "does exactness hold for delta?" with computation rather than words.

**Answer:** "Additive writes accumulate, error-driven writes revise, and gates forget; the rule decides whether a changed fact replaces the old one."

**Mandatory framing (on the page):**
- The BDH paper and public code use additive writes with a fixed U.
- BDH-CQ's rule is proprietary; the report places plain linear attention within linear correction rules.
- The other rules here are comparison mechanisms, labeled Hypothesis where they are proposed for BDH.

**Cite:**
- Test-time regression (2501.12352);
- Parallel DeltaNet (2406.06484);
- Gated DeltaNet (2412.06464);
- Kimi Linear (2510.26692);
- BDH-CQ §3.2;
- the Pathway BDH-CQ launch post (trip example).

### 5.5 Chapter "Where BDH sits"

**Landscape table.**
- **Rows:**
  - linear attention (Katharopoulos et al. 2020, marked as historical);
  - DeltaNet (Schlag et al. 2021; Yang et al. 2024);
  - Gated DeltaNet;
  - Kimi Delta Attention;
  - the Qwen3-Next and Qwen3.5 layer mix;
  - BDH-GPU;
  - BDH-CQ memory.
- **Columns:**
  - key space and sign;
  - write rule;
  - transition operator;
  - state shape per head;
  - exact parallel form;
  - whether it is hybridized with full attention;
  - source.
- **Rule:** leave a cell blank rather than guess.

**Thesis line, labeled "Our judgment":** "Two answers to one capacity problem: correct the writes inside a modest key space and keep some full-attention layers (DeltaNet-family hybrids), or make the key space very large, sparse and non-negative and keep writes additive (BDH)."

**Accounting calculator.**
- Formulas:
  - softmax KV cache = 2 × L × n_kv_heads × d_head × T × bytes;
  - BDH-GPU state = L × n_head × N × D × bytes. In the public code, each head keeps its own N × D state, and the D-dim values are shared across heads.
- Defaults:
  - BDH public config: L = 6, n_head = 4, N = 8,192, D = 256;
  - a GPT-2-small-like config: L = 12, 12 heads, d_head = 64.
- Output: the crossover T.
- Labels:
  - "Tensor-shape accounting only."
  - "The public BDH code computes the T × T score matrix in parallel, so these savings need a recurrent kernel."

### 5.6 P2 chapter "Tokens versus information"

- **Stream:** a sequence with repeats, with a repeat-rate slider.
- **Compare three write styles:**
  - additive: repeats amplify their own trace and their cross-talk;
  - error-driven: once learned, repeats write almost nothing;
  - activity-scaled: write strength is scaled by a novelty signal, as a teaching simplification of Pathway's observation that neuron activity drops for predictable input.
- **Show:** "information written" against "tokens seen".
- **Cite:**
  - Explainer Chapter 3, §3.3;
  - the corresponding BDH paper figure. Find its exact number before citing.

### 5.7 P2 chapter "Synapses"

- **Setup:**
  - value space = neuron space (D_v = N);
  - values are sparse positive neuron patterns;
  - the state becomes σ ∈ R^{N×N}.
- **Render:**
  - top-k edges as a graph, and the matrix;
  - one named synapse (i, j) potentiating as its two neurons co-fire;
  - spurious synapses created by overlapping codes;
  - compression with a random E (N × D) into ρ = σE, with recall shown before and after.
- **Cite:** paper §1.2, §6.2 and §6.3; Explainer Chapter 2, Steps 4 and 5; Explainer Chapter 3, §3.2.

### 5.8 Reuse

- **Permalinks:** every Lab state goes into the URL hash, with a "Copy link to this experiment" button.
- **Engine docs:** document the engine API in `docs/ENGINE.md`.
- **Embed (P2):** a standalone embed build exposing `<bdh-state-microscope preset="collision">` as a custom element, with an MIT notice.

---

## 6. P1: the blog site (`/blog/`)

### 6.1 First principles (build from these, and state them briefly in `docs/BLOG_SITE.md`)

1. **The job.** A post moves one idea from author to reader with minimal loss and earned trust. Length, polish and enthusiasm earn nothing (the PS says so).
2. **The readers.**
   - Researchers who will check claims.
   - Practitioners who skim.
   - AI assistants that will summarize or cite the page.
   
   So claims need to be machine-readable and hard to flatten.
3. **Trust is scarce.** Every number links to its exact table or section. Failures are shown as prominently as successes. Our own judgment is marked and kept apart from evidence.
4. **Instruments over adjectives.** For a claim about interventions, the strongest format lets the reader perform the intervention.
5. **Practice the thesis.** The post argues that silent computation is testable through designed interventions. The site should let the reader test a sealed system and discover where that stops working.
6. **The PS still governs.** The canonical essay is 600 to 800 words, built around one falsifiable idea, with at least two primary papers from 2022 to 2026, at least one limitation, and a BDH mention only where it bears on the topic. The PDF is generated from the same source, so the two cannot drift.

### 6.2 Canonical essay and PDF

**Source file.** Move the text into `content/blog/reasoning-without-a-transcript.md`, with frontmatter for:
- title;
- topic (9: Observability Constraints in Latent Reasoning Systems);
- claim;
- version;
- date;
- references (id, authors, year, title, arXiv id, locators).

**Revision rules:**
- **Claim.** Sharpen it to: "Silent latent computation stays testable: byte-identical interventions on context and compute can localize a failure without decoding any intermediate state, but they cannot by themselves identify the internal mechanism."
- **Keep the verified BDH-CQ numbers** (Section 11): Table 3, and the proprietary-internals statement.
- **Add "What did not work"** using report facts:
  - color swap composed with relocation, 0/72;
  - ordering at length 8, where only 3/24 outputs even had the correct dimensions;
  - across the two ConceptARC executions, 442/480 first candidates agreed while aggregate scores matched.
- **Add one BDH sentence that bears on the topic.** BDH is designed so that its state is interpretable (monosemantic synapses), which makes mechanism-level observability possible in principle. BDH-CQ's internals are proprietary, so outside readers only get interface-level observability.
- **Coconut and recurrent depth.** Add specific numbers only after reading those papers. Otherwise keep the current qualitative statements.
- **Mark judgment.** Put every judgment sentence under an explicit "Our judgment" marker.

**Automated checks (in CI):**
- The body word count is between 600 and 800. It excludes title, topic line, references and captions, and the script prints the count.
- Every `[n]` resolves to a reference.
- At least two references are from 2022 to 2026.
- BDH is mentioned.
- A limitation section exists.
- No banned characters or phrases appear (Section 2.6).

**PDF.**
- Generate it with Playwright from a print stylesheet: A4, fonts embedded, tagged if the Chromium version supports it.
- Print only the essay and static renders of the figures, with the line "Interactive version: <URL>".
- **Output paths:**
  - always write `public/blog/reasoning-without-a-transcript-v2.pdf`;
  - overwrite `/dataforge-latent-reasoning-blog.pdf` only if `REPLACE_SUBMITTED_BLOG_PDF = yes`.
- Keep `scripts/build_blog_pdf.py` for v1 provenance, or document why it was retired.

### 6.3 The sealed box: a toy latent reasoner (the one bold element of the site)

**Framing.** The toy reasoner is a teaching simplification built from BDH's own conceptual model:
- **Paper §1.2.** Two rules:
  - modus ponens: X(i) and σ(i, j) contribute X(i)σ(i, j) to belief A(j);
  - Hebbian update: co-activity Y(i), X(j) strengthens σ(i, j).
- **Explainer Chapter 2, Step 5.** Multiplying x by σ redistributes activation mass to neighbors, described as a fuzzy beam search.
- **BDH-CQ interface (Eqs. 1 to 4).** Demonstrations update memory; a workspace iterates; only the answer is decoded.

Label it "Teaching simplification, not BDH or BDH-CQ."

**Specification (`src/latent/`, pure TypeScript, seeded):**
- **Facts.** n facts, n from 12 to 32. Each fact has a binary code over m neurons with k active:
  - one-hot mode: m = n, k = 1;
  - distributed mode: m from 16 to 128, k from 2 to 8, with a controllable shared-neuron overlap between chosen facts.
- **Background rules.** A fixed implication set G over facts, lifted into neuron space as Σ c_iᵀ c_j / k.
- **Demonstrations.** Each demonstration is an implication (i → j) that writes σ += c_iᵀ c_j / k. This is the Hebbian write.
- **Latent step.**
  - A = X(G_neuron + σ);
  - X_{r+1} = min(1, X_r + 1[A ≥ θ]), with default θ = 0.6.
  - This is integrate-and-fire, so the frontier grows monotonically.
- **Decode.** A fact is active when at least 80% of its code neurons are on. The answer to "is q derivable from s?" is read only at step R.
- **Oracles.** BFS over:
  - the true world graph, which gives the correct answer;
  - the model-visible graph (G plus the demonstrated links), which gives what a perfect reasoner could derive from this context.
  
  Together these separate three failure types:
  - coverage gap: the visible graph lacks the path;
  - compute shortfall: the path length exceeds R;
  - binding collision: code overlap creates a spurious edge whose activation exceeds θ.

**Three instruments, which are the essay's three levels:**
1. **Output.** The exact answer next to the oracle.
2. **Intervention.** Ladders over:
   - R (latent steps);
   - coverage (add one demonstration at the needed depth);
   - code separation (increase m or remove the shared neurons);
   - a control query (a fact that must stay unreachable).
3. **Mechanism.** X_r per step as a heatmap; σ as a matrix; the decoded frontier per step. Several facts active at once is the superposition picture that Zhu et al. (2025) prove for continuous thought, where D steps suffice for graph diameter D.

**Sealed mode.** Hides instrument 3 entirely. The page opens with a preset already running, sealed, together with an "Unseal" control.

**Parallel to BDH-CQ Table 3.** Show the Table 3 counts next to the toy's analog: adding a demonstration at the target depth fixes a coverage fault but not a compute fault. Include the report's own reading:
- the nesting cliff is mainly an extrapolation failure;
- ordering keeps an execution bottleneck.

Also show "what this cannot tell you": which internal circuit changed, and anything about proprietary internals.

### 6.4 Find the fault (the one-minute test for the blog)

**Rounds.**
- Seeded rounds each plant one fault: a coverage gap, a compute shortfall, or a binding collision.
- The reader sees only outputs.
- The reader has a budget of 3 to 5 interventions, then declares a diagnosis.
- The page then unseals and scores the diagnosis locally.

**Identifiability.**
- Before a round starts, enumerate all intervention sequences within the budget.
- If two fault types give identical outputs under every sequence, label the round "Not identifiable with this budget" and explain why.
- Include at least one such round in the preset rotation. This is the essay's limitation made tangible.

**Tests.** Fixed seeds produce the documented outcomes, and the identifiability check agrees with brute force.

### 6.5 Map of how results connect

A hand-authored directed graph, rendered as SVG, labeled "Our synthesis". Every edge carries a relation and a citation.
- **Latent reasoning line.** Coconut (continuous thought) → Reasoning by Superposition (a formal account of frontiers held in superposition) → BDH-CQ (in-context learning through recurrent memory plus a latent workspace) → BDH-CQ Table 3 (coverage interventions).
- **Compute line.** Recurrent depth (the compute axis) → BDH-CQ §7. Reasoning-effort levels there raise pass@2: LOW 21%, MEDIUM 27%, HIGH 29.5%.
- **Observability line.**
  - BDH (interpretable synaptic state) → mechanism-level observability in principle.
  - BDH-CQ §3.3 (proprietary internals) → interface-level observability only, for outsiders.

### 6.6 Machine-readable layer

- **`/blog/claims.json`.** One record per claim, with fields: `id`, `text`, `scope`, `evidence_type`, `sources` (`id`, `locator`), `status`.
- **JSON-LD.** A `ScholarlyArticle` with `citation`, `about`, `dateModified`, `version`.
- **`/llms.txt`.** Following the llms.txt proposal: a short markdown file naming both artifacts, their canonical URLs, the two claim sentences, and the evidence policy.
- **`CITATION.cff`** in the repo.
- **`/blog/changelog.json`.**
- **Page footer:** the SHA-256 of the canonical markdown, and the build commit.
- **Anchors:** stable fragment IDs for every claim, figure and reference.

### 6.7 Design direction (distinct from the microscope, and not a generated-page default)

**Concept.** "A sealed specimen under measurement." The only bold element is the sealed box. Everything around it is quiet, long-form and legible, with a measure of 75 characters or fewer.

**Before coding, write a token plan in `docs/BLOG_SITE.md`:**
- 4 to 6 named hex colors;
- typefaces with their roles;
- a layout wireframe in ASCII;
- principles.

Then review the plan against the defaults below, and revise anything that matches them.

**Avoid:**
- a cream background with a high-contrast serif and a terracotta accent;
- a near-black background with an acid-green or vermilion accent;
- broadsheet hairline layouts;
- identical rounded cards with soft shadows and gradient washes;
- all-caps eyebrow labels;
- middle-dot meta strings;
- monospace for small data labels;
- arrows appended to link text;
- one accented word inside a headline.

**One suggestion, not a requirement:** a cool mineral base, activity drawn as ink density, and a single saturated color reserved for anything the reader changed. This makes interventions visually distinct from observations.

**Fonts.** One family, or two clearly distinct ones, from Google Fonts under the OFL. Record them in the license file.

**Motion.** One orchestrated moment, when the box unseals. Nothing else animates on its own, and `prefers-reduced-motion` is respected.

**Self-review.** Take Playwright screenshots at 390 and 1440 px and review them before finalizing.

---

## 7. P2: replay of a real BDH run (only if `ALLOW_TRAINING_RUN = yes`)

1. **Licensing.** Check the license of `pathwaycom/bdh`. Do not vendor its code unless the license allows it. Otherwise clone it at run time.
2. **Training script.** `research/train_tiny_bdh.py`:
   - uses the official `BDH` class;
   - trains on a synthetic multi-query associative recall task (Zoology, 2312.04927) with a small vocabulary;
   - uses a tiny config: 2 to 4 layers, n_embd 64 to 128, 2 to 4 heads, a multiplier chosen so that N per head is 256 to 1,024;
   - uses a fixed seed and a fixed number of steps, on CPU or GPU.
3. **Log:**
   - recall accuracy against the number of stored pairs;
   - per-layer active fraction of `x_sparse`;
   - active fraction on first occurrence versus repeat.
4. **Export** one short held-out sequence as float32: per layer and head, the full `x_sparse` and `x`. Keep the JSON under 5 MB, and record the exact config, commit and seed.
5. **"Real run" panel in the Lab** (label: Precomputed replay):
   - recomputes parity live in the browser from the exported vectors (masked matrix versus recurrent state);
   - shows the key-overlap histogram, active fraction and recall curve;
   - compares the measured mean key cosine with the "Lift into neurons" chapter.
6. **Provenance.** Commit the script, config, logs, exported data and a README with exact reproduction steps. Publish the checkpoint hash. Attach the checkpoint as a release asset only if it is small.
7. **If training fails or is slow,** stop. Ship nothing for this section. Never add a placeholder.

---

## 8. P2: presentation mode (`/present/`)

**Content.** Full screen, large type, arrow-key steps, driving the real components (never screenshots):
1. claim;
2. the collision preset, with parity passing and recall failing;
3. stepping to the query;
4. the separated preset;
5. the load-5 prediction and sweep;
6. the BDH bridge (N, Claim 7, U, BDH-CQ);
7. plasticity with β;
8. limitations and the blog.

**Behavior.** A visible 8-minute timer, a reset key, and a preview build that works offline.

**Backup recording.** Add `scripts/record_demo.ts`, a Playwright script that records the route at 1920 × 1080. Write its output outside the repo.

---

## 9. Engineering, CI and deployment

### 9.1 Build and routing

- **Vite multi-page inputs:**
  - `index.html` (microscope);
  - `lab/index.html`;
  - `blog/index.html`;
  - `present/index.html` (if built).
- **`vercel.json`:**
  - `cleanUrls: true`;
  - correct content types for `.json`, `.pdf` and `llms.txt`;
  - cache headers for hashed assets.
- **Routes to verify.** `/lab`, `/lab/`, `/blog` and `/blog/` resolve, and `/api/explain` returns 404.

### 9.2 CI (GitHub Actions)

On every push:
- frozen install;
- typecheck;
- unit and property tests;
- build;
- Playwright end-to-end tests against `vite preview`;
- the content lint (banned characters and phrases, essay word count, citations);
- a link check (external failures warn but do not fail);
- a bundle-size report.

### 9.3 End-to-end tests

- **Console and layout.** No console errors on any page at 390 px and 1440 px.
- **Guided path.** Presets give the expected verdicts, and the one-minute check flow works.
- **Lab.** With fixed seeds, the qualitative results hold:
  - raw capacity is at most d + 2;
  - lifted capacity at N = 1,024 and 5% activity is greater than raw;
  - parity stays below 1e-10 in every U mode.
- **Blog.**
  - A fixed-seed sealed-box round reproduces the documented outcome.
  - The v2 PDF exists and passes the word-count check.
  - The v1 PDF hash is unchanged when the switch is `no`.
- **Latency.** Measure input-to-paint for sliders and assert the budgets.

### 9.4 Deployment

1. **Commit** in logical units: fixes, lab, blog, research, docs, CI.
2. **Push `final-push`.**
   - With `VERCEL_DEPLOY_METHOD = git`, capture the preview URL from the deployment.
   - With `cli`, run `vercel deploy` using the token and capture the URL.
3. **Smoke-test the preview.** Run the Playwright suite with `BASE_URL` set to the preview URL.
4. **If `PRODUCTION_PROMOTION_ALLOWED = yes`:**
   - open a PR and merge it, or run `vercel deploy --prod`;
   - rerun the smoke tests against `https://bdh-state-microscope.vercel.app`;
   - verify the v1 PDF hash and the 404 on `/api/explain`;
   - tag `v2-final-push`.
5. **If `no`:** open the PR, do not merge, and report the preview URL.

---

## 10. Definition of done and final report

**Done means:**
- All P0 items ship with tests.
- P1 ships as far as time allows, with each chapter complete. Never ship half a chapter.
- CI is green.
- The preview (or production, if allowed) passes the smoke tests.

**The final report (`docs/FINAL_PUSH_REPORT.md`) lists:**
- the changes made in each workstream;
- test counts;
- regenerated results tables;
- the conformance output;
- screenshot paths;
- URLs;
- what was skipped and why;
- open risks;
- manual actions for the human (delete `GROQ_API_KEY`, confirm the freeze rules, update any submission form if allowed);
- a list of every factual claim now on the site with its source, exported from the claims data.

---

## 11. Verified fact sheet (use these; cite as shown)

### BDH paper

Kosowski, Uznański, Chorowski, Stamirowska, Bartoszkiewicz. "The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain." arXiv 2509.26507, v1, 30 September 2025.

- **Abstract.**
  - A scale-free network of n locally interacting neuron particles, with a GPU-friendly formulation.
  - Rivals GPT-2-architecture Transformers on language and translation at equal parameter count (10M to 1B) and equal data.
  - Working memory relies on synaptic plasticity with Hebbian learning.
  - Activations are sparse and positive, with monosemanticity shown even below 100M parameters.
- **§1.2.**
  - Modus ponens: X(i), σ(i, j) → A(j).
  - Hebbian: Y(i), X(j) → σ(i, j).
  - The fixed ruleset G plays the role of weights; the evolving σ plays the role of fast weights, i.e. the state.
- **Definition 4, Eqs. 4 and 5.**
  - ρ_{t-1,l} = Σ_{τ<t} v*_{τ,l-1} x_{τ,l}ᵀ U^{t-τ}.
  - U is diagonal or block-diagonal and represents rotation or damping (RoPE or ALiBi).
- **Fig. 3, Eq. 8 (BDH-GPU).**
  - ρ_{t,l} = (ρ_{t-1,l} + LN(E y_{t,l-1}) x_{t,l}ᵀ) U, together with the x and y updates.
  - Parameters: E, D_x, D_y.
- **§4.1.** x_{t,l} ≥ 0. In a typical run about 5% of x's entries are nonzero, which is the fraction of state read and updated per token.
- **§6.1: keys, values and state.**
  - Keys and queries are the same positive vector x in R^n: x_t is the query, and x_τ for τ ≤ t-1 are the keys. Values live in R^d.
  - State capacity versus distinction capacity: ρ ∈ R^{n×d} can store O(n) values as a lookup table, and its ability to distinguish facts is asymptotically close to n.
- **§6.1: Claim 7 and key preparation.**
  - Claim 7 (informal): up to t = Õ(n) key-value pairs under weak-correlation assumptions; at least Ω̃(√n) without them, except for a negligible fraction of inputs. Keys must be suitably prepared.
  - Aside from RoPE's effect, BDH-GPU's keys are non-negative.
  - Observation 7: LSH bucket affinity is expressible with positive keys.
  - Observation 8: linear attention separates positive keys that are close in L1.
- **§6.1: long context.**
  - Damping of historical signals was needed to avoid noise from stale context.
  - RoPE with ALiBi sufficed for the vanilla model.
  - Selective forgetting, state compression and other state optimization could be added.
- **Appendix C.2, Claim 8.** For C-non-adversarial keys and t < δn/((C+1) log n), the simplified linear attention a*_t = Σ v_τ x_τᵀ x_t approximates the target attention with O(√δ) L2 error, using a random (Johnson-Lindenstrauss-based) key preparation.
- **§6.2 to §6.3.** σ is recovered from Eq. 16. It shows a scale-free degree distribution and monosemantic synapses (currency and country concepts). §7.1 covers model merging by concatenation.

### Official code

`pathwaycom/bdh`, `bdh.py`.

- **Defaults.**
  - n_layer 6, n_embd 256, n_head 4, mlp_internal_dim_multiplier 128.
  - This gives N = 8,192 per head.
- **Attention.**
  - RoPE with `theta=2**16` and pairwise-quantized frequencies.
  - `Q = K = x_sparse` (the ReLU of `x @ encoder`).
  - `V = x` (D-dim, after LayerNorm).
  - `scores = (QR @ KR.mT).tril(diagonal=-1)`, then `scores @ V`, then LayerNorm.
- **Absent from the public file:** ALiBi, damping, and any recurrent kernel.
- **README.** The Sudoku Extreme result (97.4%) comes from Pathway's internal implementation and is not reproduced by the open-source repo.

### Pathway BDH Explainer

pathway.com/research/bdh-explainer. Chapters dated 7 August 2026; overview dated 10 August 2026.

- **Chapter 2.**
  - Row-vector convention: σ = Σ xᵀv; ρ = σE ∈ R^{N×D}; k = q = x.
  - Caution: swapping in linear attention in a small space loses capacity. The construction is meaningful only because the space is large, sparse and non-negative.
  - A diagonal U gives ALiBi-like damping; 2×2 rotation blocks give RoPE-like position.
  - The propagation is described as a fuzzy beam search.
  - The comparison table:
    - Retrieval interpretation: BDH is LSH-like lookup; Transformers are approximate nearest-neighbor search.
    - Runtime memory: BDH has a fixed-size synaptic state, with context length bounded by information capacity; Transformers have a KV cache that grows with sequence length.
- **Chapter 3.**
  - A connectivity example with N = 8,192 and 46,820 edges above threshold.
  - The monosemantic "currency synapse".
  - Neuron activity drops for predictable input ("neurons get bored").
  - Scaling mainly through the number of neurons.
  - Sharding along N.
- **Conclusion.** Neurons carry fast transient activity and synapses carry slower contextual state. It cites Sudoku and BABILong, and locality easing memory-to-core bandwidth.

### Pathway BDH-CQ launch post

pathway.com/research/introducing-bdh-cq, 11 August 2026.

- 29.5% pass@2 at $0.00070 per task.
- An independent black-box evaluation reproduced the result.
- The trip-planning example: when a flight is cancelled, a capable system keeps what remains valid and rebuilds the rest.
- Pathway is seeking design partners.

Known discrepancy: a Pathway blog card summarizing an AWS post says 29.2%. Use 29.5%, citing the report.

### BDH-CQ report

Engdahl, Kosowski, Chorowski, Stamirowska, Uznański, Jiang, Phadke, Kinas, Zhong. "BDH-CQ: In-Context Learning with Recurrent Latent Reasoning." arXiv 2608.09888, 10 August 2026.

- **§3.2 (memory).**
  - Eq. 1: S_t = U_θ(S_{t-1}, D_t), with θ fixed.
  - No parameters are updated at inference.
  - The memory avoids a growing explicit KV cache.
  - Linear attention is the simplest standalone realization of linear correction rules on S, the special case S_t = S_{t-1} + U_θ(D_t).
- **§3.3 (workspace).**
  - Eqs. 2 to 4: H_0 = E_θ(x*, S_K); H_{r+1} = F_θ(H_r, S_K); ŷ = G_θ(H_R).
  - Dimensions, exact update rules and implementation details are proprietary.
- **§5 and Table 1: ARC-AGI-1 public evaluation.**
  - 150M parameters.
  - 118/400 tasks (29.50%) at pass@2; 97/400 (24.25%) at pass@1.
  - 130/419 test pairs at pass@2.
  - About 0.85 H200 GPU-seconds per task. At $3 per H200-hour, that is $0.00070 per task.
  - An independent black-box audit reproduced 29.5%.
- **ConceptARC.** 95/160 tasks at pass@2 with semantic IDs, and 96/160 with opaque IDs; 374/480 pairs in both.
- **§6.2 and Table 3** (exact outputs out of 24):

  | Family | Context | pass@1 | pass@2 |
  |---|---|---|---|
  | Ordering, length 8 | short | 0 | 0 |
  | Ordering, length 8 | supported | 12 | 13 |
  | Nesting, depth 5 | short | 15 | 19 |
  | Nesting, depth 5 | supported | 16 | 24 |

  - At ordering length 8, only 3/24 outputs had the correct dimensions.
  - At nesting depth 5, all 36 outputs had the correct dimensions, with mean best-candidate cell accuracy above 99.9%.
- **§6.3: binding.**
  - Color-permutation binding: 24/24 at every level from 2 to 8 simultaneous bindings (96 outputs).
  - Table 4 (72 outputs per condition):

    | Operation | Alone | Composed with relocation |
    |---|---|---|
    | Relocation | 72/72 | not applicable |
    | Reflection | 72/72 | 47/72 |
    | Rotation | 72/72 | 72/72 |
    | Color swap | 26/72 | 0/72 |
- **§6.4.** Pass@2 solved 0 pairs on 13 tasks, 1 pair on 15, 2 pairs on 37, and all 3 on 95. So 52/160 tasks were partially solved.
- **§6.5.** Across the two ConceptARC executions, 442/480 first candidates agreed, and 276/480 complete ordered candidate lists agreed.
- **§6.6.** Repeated identical requests were byte-identical (419/419) at both effort tiers. MIN effort scored 111/400 against STANDARD's 118/400 (exact McNemar p = 0.167).
- **§7, Table 5.** Pass@2 by effort: HIGH 29.5%, MEDIUM 27%, LOW 21%.
- **§9.2.** Asserts early 1B to 600B scaling experiments; no data is shown in the report. Do not repeat this as established.

### Other primary sources

- **Kimi Linear** (arXiv 2510.26692).
  - Kimi Delta Attention extends Gated DeltaNet with finer-grained, channel-wise gating.
  - A 3:1 hybrid with MLA; 48B total and 3B active parameters.
  - Up to 75% less KV cache, and up to 6× decoding throughput at 1M context.
  - Verify the exact KDA update equation in the paper before rendering it.
- **Qwen3-Next** (Qwen blog, September 2025).
  - Gated DeltaNet plus gated attention at 3:1.
  - The team reports that linear attention is fast but weak at recall, and that Gated DeltaNet gave stronger in-context learning than sliding-window attention or Mamba2.
  - For Qwen3.5 (February 2026, 397B-A17B), verify on the official Qwen model card before citing.
- **Verify before citing:** the update equations and gating granularity of Gated DeltaNet (arXiv 2412.06464) and Parallel DeltaNet (arXiv 2406.06484), including the compact WY / UT chunkwise form.
- **Test-time regression** (Wang, Shi, Fox; arXiv 2501.12352). Linear attention, SSMs, fast-weight programmers, online learners and softmax attention arise from three choices: regression weights, regressor class, and test-time optimizer.
- **Reasoning by Superposition** (Zhu et al.; arXiv 2505.12514; NeurIPS 2025).
  - D continuous-thought steps solve directed graph reachability for diameter D.
  - Each continuous thought can encode multiple search frontiers.
- **Zoology** (Arora et al.; arXiv 2312.04927): multi-query associative recall.
- **Coconut** (arXiv 2412.06769) and **recurrent depth** (arXiv 2502.05171): read these before adding any number.
- **Candidates, unverified** (read before using): Mamba-2 / SSD (arXiv 2405.21060), RWKV-7 (arXiv 2503.14456), Titans (arXiv 2501.00663), Repeat After Me (arXiv 2402.01032), "The Illusion of Superposition?" (arXiv 2604.06374), and a systematic analysis of hybrid linear attention (arXiv 2507.06457).
- **Welch bound (classical).** For t unit vectors in R^N with t > N: max over i ≠ j of |⟨x_i, x_j⟩| ≥ sqrt((t - N) / (N (t - 1))).

### Our own verified checks (reproduce; do not paste as final numbers)

- **Randomized parity** (numpy; 300 random dense sequences; both bases): worst relative error 1.1e-15.
- **Official-code conformance** (Section 12 script):
  - microscope RoPE formula at base 2^16 against official rope: 8.9e-16;
  - official masked product against the per-head N × D recurrent state: 8.9e-16;
  - official masked product against the paper's co-rotating ρ: 2.7e-15;
  - frame relation: 2.4e-14 (maximum over heads, as printed by the embedded script).
- **Live site** (17 September 2026):
  - loads in under 1 s, with no console errors and no overflow at 390 px;
  - at load 6, overlap 0.30 gives margin +0.100 and overlap 0.34 gives -0.020.

---

## 12. Conformance script (add verbatim as `research/conformance_official_bdh.py`)

```python
"""
Conformance check against the official BDH attention (pathwaycom/bdh, bdh.py).
Run next to a checkout of https://github.com/pathwaycom/bdh (./bdh) or set BDH_PATH.
Everything runs in float64:
  (a) official masked product == per-head fixed N x D recurrent state (read before write)
  (b) official masked product == paper Eq. 8 co-rotating state rho <- (rho + v x^T) U
  (c) fixed-frame state S_T^T == rho_T U^(-T)
  (d) microscope RoPE formula at base 2**16 == official rope
Attention.forward asserts float32 frequencies, so its two-line body is replicated in float64.
"""
import math
import os
import sys

import torch

sys.path.insert(0, os.environ.get("BDH_PATH", "bdh"))
from bdh import Attention, get_freqs  # noqa: E402  (official code)

torch.set_default_dtype(torch.float64)
torch.manual_seed(0)
N, D, NH, T, DENSITY = 64, 8, 2, 24, 0.05
BASE = 2 ** 16

freqs = get_freqs(N, theta=BASE, dtype=torch.float64).view(1, 1, 1, N)
Q = torch.relu(torch.randn(1, NH, T, N)) * (torch.rand(1, NH, T, N) < DENSITY)
V = torch.randn(1, 1, T, D)
phases = torch.arange(T, dtype=torch.float64).view(1, 1, -1, 1) * freqs
QR = Attention.rope(phases, Q)
official = (QR @ QR.mT).tril(diagonal=-1) @ V


def microscope_rope(vec, pos):
    out = vec.clone()
    for i in range(0, N - 1, 2):
        a = pos * BASE ** (-i / N)
        c, s = math.cos(a), math.sin(a)
        out[i], out[i + 1] = vec[i] * c - vec[i + 1] * s, vec[i] * s + vec[i + 1] * c
    return out


err_rope = max(
    float((microscope_rope(Q[0, h, t], t) - QR[0, h, t]).abs().max())
    for h in range(NH)
    for t in range(T)
)

rec = torch.zeros_like(official)
for h in range(NH):
    S = torch.zeros(N, D)
    for t in range(T):
        rec[0, h, t] = QR[0, h, t] @ S
        S = S + torch.outer(QR[0, h, t], V[0, 0, t])

U = torch.eye(N)  # one-step RoPE rotation acting on column vectors: U @ x == rope(x, 1)
for i in range(0, N, 2):
    a = BASE ** (-i / N)
    c, s = math.cos(a), math.sin(a)
    U[i, i], U[i, i + 1], U[i + 1, i], U[i + 1, i + 1] = c, -s, s, c

paper = torch.zeros_like(official)
frame_err = 0.0
for h in range(NH):
    rho = torch.zeros(D, N)
    S = torch.zeros(N, D)
    for t in range(T):
        paper[0, h, t] = rho @ Q[0, h, t]  # a*_t = rho_{t-1} x_t with the unrotated key
        rho = (rho + torch.outer(V[0, 0, t], Q[0, h, t])) @ U
        S = S + torch.outer(QR[0, h, t], V[0, 0, t])
    frame_err = max(frame_err, float((S.T - rho @ torch.linalg.matrix_power(U, -T)).abs().max()))

err_a = float((official - rec).abs().max())
err_b = float((official - paper).abs().max())
print(f"(d) microscope RoPE (base 2^16) vs official rope : {err_rope:.2e}")
print(f"(a) official vs fixed N x D recurrent state      : {err_a:.2e}")
print(f"(b) official vs paper co-rotating rho (Eq. 8)    : {err_b:.2e}")
print(f"(c) frame relation S_T^T = rho_T U^(-T)          : {frame_err:.2e}")
assert max(err_rope, err_a, err_b, frame_err) < 1e-10, "conformance failed"
```

---

## 13. Quick list: do not

1. **Protected URLs and assets.**
   - Do not change the v1 PDF bytes while the switch says `no`.
   - Do not break `/`.
   - Do not merge to `main` without `PRODUCTION_PROMOTION_ALLOWED = yes`.
2. **Runtime.**
   - Do not add any LLM call, chatbot or server route.
3. **Claims.**
   - Do not state that BDH or BDH-CQ uses delta rules, gates, or any specific memory rule beyond the published additive form.
   - Do not present exploratory numbers from this brief as results. Regenerate them.
4. **Placeholders.**
   - Do not add placeholder UI for sections that did not run.
5. **Branding.**
   - Do not use Pathway's logo or any wording that implies partnership.
6. **Sources and copy.**
   - Do not quote more than a short phrase from any source.
   - Do not use em dashes, emojis or filler vocabulary in public copy.

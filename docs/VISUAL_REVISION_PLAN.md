# Final site plan: microscope design, approved language

Publication destination: **https://bdh-state-microscope.vercel.app/** (the submitted URL). Every public link, `llms.txt` entry, README command and the v2 PDF's "interactive version" line points there. Preview/review deployment URLs are testing details and are never presented to readers.

Fixed inputs:

- **Language.** The copy approved on the review deployment (homepage, lab, and the 675-word canonical essay in `content/blog/reasoning-without-a-transcript.md`) stays as it is. This is a visual revision only.
- **Design.** The submitted microscope design: cream paper, Georgia display serif, navy instrument panels, acid-lime accents, amber/violet/mint value colours, mono numeric readouts, uppercase tracked kickers and lime bands for interactive checks.
- **Guardrails.** Engine update rules, thresholds, seeds and results stay unchanged. The v1 PDF stays byte-identical, no training runs, no API commentary, and no evidence-category badges in the reading flow.

## One site, three routes, one shell

| Route | Role | Reader question |
|---|---|---|
| `/` Microscope | Exact parallel ⇄ recurrent equivalence, interference boundary, delta correction, BDH bridge | What does attention remember, and when does recall fail? |
| `/blog/` Essay | Canonical essay plus a sealed state instrument and a fault-diagnosis round | How do you test reasoning you cannot read? |
| `/lab/` Lab | Five seeded sandboxes (dimension, lift, time, writes, landscape) | What would you change in memory? |

All routes share the `site-header` (asterisk brand mark, route nav, right-aligned note) and the navy footer.

**Footer.** The footer has a serif statement line, then three labelled groups: *Explore* (microscope, essay, lab), *Read* (essay PDF, v1 archive, project guide, changelog) and *Source* (repository, license, source record, AI disclosure). A bottom rule carries the canonical domain, the independence statement and back-to-top.

## Essay page, top to bottom

1. **Hero.** A serif H1, the question as the claim, a meta rule (date, word count, "Open the experiment") and the lime rule-chain card 0→1→2→3.
2. **Essay.** A narrow 70ch column with serif H2s and numbered citations with hover locators. The text is unchanged.
3. **Specimen (navy instrument panel).** It is titled "Follow a rule through memory".
   - Fault tabs across the top, styled like the microscope's Separated / Collision / High load tabs: *Missing rule*, *Too few steps* and *Overlapping codes*.
   - A four-cell readout: world path, machine answer, supplied-rule path and unreachable control.
   - A dark control bar: steps R, demonstration 1→2 and shared neurons. The substrate controls (facts, neurons, k, coding, seed) sit in a secondary cell.
   - Methods note, then a full-width lime **Unseal the mechanism** button.
4. **Unsealed workspace.** This is the microscope inside the state. Every view is linked to one step selector.
   - **Step selector** with the decoded frontier on each step button.
   - **Rule graph.** Stored rules are solid and the missing rule is dashed coral. Reached facts are lime, and fact 6 is the control.
   - **Activity raster.** Rows are steps; columns are neurons *regrouped by fact code* (facts 0, 1, 2, 3, 6). Activity spreading along the chain becomes a visible staircase, a stalled step shows as a flat run, and an overlap makes control columns light up. The selected step is highlighted.
   - **Neuron field.** The full 16-column field with the selected fact's code outlined.
   - **Synaptic block matrix.** Demonstration memory σ restricted to the chain codes, grouped into k×k fact blocks with labelled axes. Written blocks are lime with exact weights on hover. A missing demonstration is a dashed, labelled zero block. The magnifier table shows exact weights for the chosen rule.
   - Numeric records in a closed `details`.
5. **Fault round (lime band + navy instrument).** The copy sits on the left. On the right are the setup (seed, budget, menu), a large observation readout for target and control, intervention buttons, a numbered action log, diagnosis tabs, and reveal. The identifiability verdict appears as a mono readout.
6. **Related papers.** A collapsible panel holding the synthesis map and the Table 3 comparison.
7. **References.** Essay references 1–5 as a serif numbered list. The instrument references I1–I14 follow in a compact two-column list. Provenance goes in a closed `details`.

## Lab page

The markup and engine stay the same, with a CSS pass so the lab reads as part of the same instrument:

- Shared header.
- Serif H1/H2 with uppercase kickers and numbered chapters.
- Controls in a navy bar with lime values.
- Charts on a cream panel with a grid.
- Numeric tables in mono.
- Formula blocks in violet panels.

## Release gates

1. `pnpm check`: types, unit tests, build, content/result/PDF checks, Playwright layout/a11y at 390 and 1440 px.
2. Regenerate the v2 PDF with `BLOG_PUBLIC_URL=https://bdh-state-microscope.vercel.app`. The v1 hash stays unchanged.
3. Screenshot all three routes at 1440 and 390 px and inspect them.
4. `vercel deploy --prod` to the existing project, then verify `https://bdh-state-microscope.vercel.app/`, `/blog/` and `/lab/` anonymously.

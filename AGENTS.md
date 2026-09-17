# Final-push guardrails

- Preserve the submitted `main` revision and v1 PDF. Work on `final-push`; do not merge or promote production without an explicit switch change.
- `PRODUCTION_PROMOTION_ALLOWED = no`; `REPLACE_SUBMITTED_BLOG_PDF = no`; `ALLOW_TRAINING_RUN = no`.
- Primary sources only for published-work claims. Put a section, equation, table, or code locator beside each claim. Verify the attached brief rather than trusting its fact sheet.
- Every result is live engine computation, a committed-script replay with seed/provenance, or a cited paper-reported number. Never substitute expected numbers for measured results.
- The user approved rewriting the blog and reader-facing copy on 2026-09-17. Do not put evidence-category badges or an audit ledger in the main reading flow. Preserve source records and verification behind optional methods notes.
- For explanatory copy, use `skills/pathway-research-copywriting/SKILL.md`. Explain a concrete operation before naming its abstraction; introduce notation where it is used. Do not copy Pathway prose or adopt promotional architecture claims as established results.
- No runtime LLM, chatbot, or server API. The application must work offline after the static assets load.
- BDH public attention uses additive writes and RoPE; do not attribute delta rules or gates to BDH or proprietary BDH-CQ internals.
- Do not claim model training, endorsement, universal capacity, latency savings, or cost savings. Tensor-shape accounting is not measured runtime memory.
- All randomness uses the seeded PRNG. Seeds and control state belong in permalinks. Engine code stays free of React.
- Public copy: sentence-case headings, no em/en dash punctuation, emojis, exclamation marks, appended link arrows, or filler language. Do not call the learner a judge.
- Guided controls must remain responsive; worker sweeps have explicit caps and progress. Never ship incomplete chapters or placeholder results.
- Keyboard access, numeric plot/heatmap descriptions, visible focus, reduced-motion support, readable contrast, and no horizontal overflow at 390 px are release gates.
- Run frozen install, unit/property tests, build, content checks, and browser smoke tests before pushing.
- The submitted PDF must remain SHA-256 `2ef8a487f652f4145d463877de5e0f54993301ae8665541bbec2071e668a32b9`.
- Disclose AI assistance accurately. Automated verification does not mean the human team independently verified or can defend the work.

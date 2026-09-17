# Pathway architecture writing: research notes

Reviewed 17 September 2026. Sources were discovered through Pathway's [blog index](https://pathway.com/blog/) and [research index](https://pathway.com/research/), then followed through the explainer's chapter and further-reading links. The blog index mixes company writing with third-party articles, videos and newsletters. This is a review of the discovered official written architecture corpus, not every historical Pathway post or every external interview.

## Core reading

| Page | What to study |
| --- | --- |
| [Series overview](https://pathway.com/research/bdh-explainer/) | A roadmap from motivation to derivation to trained-model observations. It gives readers multiple entry points. |
| [Why search for a brain-inspired network?](https://pathway.com/research/bdh-explainer/brain-inspired-ai-architecture) | Architectural requirements arise from an account of memory, computation and locality. Familiar network examples explain otherwise abstract properties. |
| [From attention to synapses](https://pathway.com/research/bdh-explainer/bdh-architecture-derivation) | Each algebraic change has a purpose. The symbol table precedes the derivation; the graph construction is distinguished from its practical GPU factorization. |
| [What emerges in trained BDH models](https://pathway.com/research/bdh-explainer/bdh-interpretability-scaling) | The exposition changes from constructing a model to examining trained models. A particular synapse and repeated-input activity provide objects the reader can inspect. |
| [Series conclusion](https://pathway.com/research/bdh-explainer/conclusion) | Returns to the consequences of the construction and separates established work from future directions, although the framing is strongly promotional in places. |
| [The Equations of Reasoning](https://pathway.com/research/the-equations-of-reasoning) | Connects elementary reads, writes and local communication to the larger research question. Its analogy motivates the program; it is not itself a proof of universal laws of intelligence. |
| [Sudoku research post](https://pathway.com/research/beyond-transformers-sudoku-bench) | A puzzle gives the reader a concrete constraint problem. Benchmark reporting and ambitious broader commentary coexist; broader statements need their own support. |
| [Reasoning at a fraction of the compute](https://pathway.com/research/introducing-bdh-cq) | Opens with a result, defines the task, explains latent workspace computation, then connects changing constraints to a practical example. |

## Genre contrasts

[The ARC announcement](https://pathway.com/blog/pathway-150m-model-breaks-arc-agi-1-cost-efficiency-frontier) is a press release with quotes and leaderboard comparisons. [The funding announcement](https://pathway.com/blog/pathway-strikes-a-500m-valuation) is founder-led positioning. Neither is the appropriate default voice for a teaching artifact. The research pages themselves vary: the derivation is more sequential and concrete than the future-facing conclusion or Sudoku commentary. Avoid claiming that all Pathway writing is uniformly restrained.

Also inspected for coverage: the [April 2024 LLM meetup summary](https://pathway.com/blog/pathway-meetup-2024), [October 2025 launch newsletter](https://pathway.com/blog/newsletter-2025-10-15), [January 2026 newsletter](https://pathway.com/blog/newsletter-2026-01-15), and [paper-popularity note](https://pathway.com/blog/second-most-popular-ai-paper-of-the-year-in-2025). These are event/news summaries or community updates rather than additional architecture derivations. Their enthusiasm is another reason to choose the relevant genre instead of calling every company page one house voice. Video interviews and external media articles listed by Pathway were not treated as Pathway-authored architecture blogs.

## Explanatory practices worth adopting

The strongest recurring practice is to earn the terminology. A familiar operation establishes the problem; a design requirement explains the change; the equation spells out that change; a concrete example shows its consequences. Transitions have a reason: a large graph raises a storage problem, which motivates factorization. Later pages ask whether the intended properties occur after training.

The architecture distinction matters to the prose. The idealized graph uses neuron-to-neuron connections; the GPU form uses low-rank factors and a rectangular state. Sparse, non-negative key/query activity is described before positional rotation. Fast activation, changing contextual memory and trained parameters should not be flattened into one vague “state.” Public BDH and proprietary BDH-CQ also need separate treatment.

The voice is an editorial observation, not a finding about author identity. Several pages are credited to Pathway Team; a founder-authored announcement has a different purpose. We cannot recover private thought processes or determine human-only authorship by reading them.

## Original editing examples

These examples are ours, not quotations from Pathway.

- Instead of opening with an evidence classification: “Store A as amber. Add keys that partly match A but store violet. When we ask for A, those violet values contribute too.”
- Instead of displaying the whole boundary in the hero: “Without rotation, amber gets a score of 1. If m other keys store violet and each overlaps with A by c, violet gets m × c. The scores tie when c = 1/m.” Any positive overlap already introduces cross-talk; 1/m is a tie threshold in this fixture, not the point where overlap first exists.
- Instead of “Start with the invariant”: “Both calculations include the same writes. What changes when the keys become similar?”
- Instead of a disclaimer headline about the toy: “The model below spreads activity along stored rules. Open its history to see which fact it reached at each step.” Explain once nearby that it uses hand-built codes rather than a trained checkpoint.
- Instead of an audit taxonomy in the reading flow: “How to check the experiment,” followed by an optional note linking source code, replay and assumptions.

These are decision examples, not phrases to repeat across projects. A successful rewrite explains the current system more clearly; it does not just replace one set of stock phrases with another.

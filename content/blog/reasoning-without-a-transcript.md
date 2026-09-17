---
title: Reasoning without a transcript
topic: "9: Observability Constraints in Latent Reasoning Systems"
claim: "With the query held fixed, controlled context and compute interventions can localize a failure without decoding intermediate state, but cannot uniquely identify the internal mechanism."
version: 2
date: 2026-09-17
references: [cq, coconut, depth, superposition, bdh]
---

## The missing transcript

A language model can compute without writing every intermediate thought as a token. Coconut feeds a hidden state back as the next input embedding, replacing parts of a textual reasoning chain with continuous computation [1]. Recurrent-depth models repeatedly apply a shared block, making inference depth an adjustable compute axis [2]. Neither design makes a fluent explanation a faithful trace of the computation that produced an answer.

The falsifiable idea here is narrower: with the query held fixed, controlled changes to context and compute can localize a failure without exposing intermediate state. They cannot, by themselves, uniquely identify the internal mechanism. A transcript is one instrument, not the definition of observability. The distinction matters whenever a deployed system exposes only inputs, a compute setting and a final answer.

## Three levels of evidence

Output evidence asks whether the answer matches an independent oracle. Intervention evidence asks which controlled change alters that answer. Mechanism evidence asks which internal state or operation caused the alteration. These are different questions. Correct outputs do not establish a circuit; a helpful intervention does not automatically establish why it helped.

BDH-CQ makes the boundary concrete. Its report separates recurrent context memory from an iterated latent workspace. Demonstrations update memory; the workspace computes an answer. The exact memory update, dimensions and workspace implementation are proprietary [3]. Outside readers can evaluate the interface, but cannot inspect those internals from the equations alone.

## A useful intervention, with failures beside it

Table 3 changes demonstration coverage while retaining byte-identical held-out query inputs. At ordering length eight, short-context runs score 0/24 in both tiers; a target-depth demonstration raises them to 12/24 and 13/24. At nesting depth five, scores move from 15/24 and 19/24 to 16/24 and 24/24 [3]. Context support therefore changes behavior. It does not reveal the state representation that changed.

What did not work deserves equal space. Only 3/24 length-eight ordering outputs had the correct dimensions in a separate ordering diagnostic. Demonstration-defined color swap composed with relocation scored 0/72. Color swap alone scored 26/72, so the composition result cannot isolate a composition-specific defect from weak operator acquisition [3]. In two ConceptARC executions, aggregate scores matched at 374/480, while 442/480 first candidates agreed. Matching totals can conceal different individual decisions; jointly changed formats and execution settings are not a clean causal experiment [3].

## Testing a sealed specimen

The accompanying instrument is deliberately not BDH-CQ. It stores implication edges with Hebbian outer products, advances a monotone neuron frontier and decodes only the final reachability answer. A true-world BFS oracle and a visible-context BFS oracle distinguish a missing path from a path the context actually supplies. Shared fact codes can also produce false positives.

Increase latent steps, add a missing demonstration or separate overlapping codes. A compute intervention can repair a short frontier without adding a fact. A context intervention can supply a missing path without repairing insufficient compute. A separation intervention can remove a false positive. Unsealing exposes the neuron history so each interface diagnosis can be checked against this toy's known construction.

The superposition paper proves a graph-reachability construction that can represent multiple search frontiers and solve diameter-D graphs in D continuous steps [4]. Our thresholded toy illustrates simultaneous frontiers; it is not that theorem's construction. The original BDH paper studies interpretable synaptic structure, offering mechanism-level inspection in principle [5]. That property should not be transferred to proprietary BDH-CQ by association.

## Limitations

Finite observations underdetermine mechanisms. In the restricted round, coverage and compute faults give identical output traces for every allowed intervention within the displayed budget. Our exhaustive check establishes equivalence only among three enumerated hypotheses, not among all possible programs. Even a uniquely distinguished toy fault says nothing about the circuit inside a production model. Context, compute, binding and decoding can interact, violating a simple one-fault diagnosis.

## Our judgment

Start with an independent oracle and a negative control, then change one axis at a time. Publish repaired and unrepaired cases together. Use intervention results to narrow the next experiment, not to name an invisible mechanism. Silent reasoning remains testable, but its evidence must stay at the level the instrument can support.

## References

[1] Hao et al. (2024). Training Large Language Models to Reason in a Continuous Latent Space. Section 2. https://arxiv.org/html/2412.06769v1

[2] Geiping et al. (2025). Scaling by Thinking in Continuous Space. Recurrent-depth architecture and inference. https://arxiv.org/html/2502.05171v1

[3] Engdahl et al. (2026). BDH-CQ. Sections 3.2, 3.3, 6.2, 6.4, 6.5; Table 3. https://arxiv.org/html/2608.09888v1

[4] Zhu et al. (2025). Reasoning by Superposition. Graph reachability and diameter-D result. https://arxiv.org/html/2505.12514v1

[5] Kosowski et al. (2025). The Dragon Hatchling. Sections 5 and 6, synaptic interpretation. https://arxiv.org/html/2509.26507v1

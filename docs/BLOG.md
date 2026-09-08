# Reasoning Without a Transcript Is Not Reasoning Without Evidence

**Blog topic 9: Observability Constraints in Latent Reasoning Systems**

**Central claim:** A latent-reasoning system is observable enough to test when controlled interventions cause preregistered, exact changes in behavior, even if its intermediate states are never decoded.

Chain-of-thought made machine reasoning feel inspectable. A model prints a sequence of sentences, so we can read something that resembles a derivation. Latent-reasoning systems break that convenience. They repeatedly transform continuous hidden states and decode only an answer. The immediate fear is sensible: if the intermediate computation is silent, how can anyone tell whether the model learned a rule, guessed from a shortcut, or merely got lucky?

The wrong response is to treat a verbal transcript as the only form of evidence. A transcript can itself be incomplete, post-hoc, or persuasive without being causal. The stronger standard is experimental: change one hypothesized cause, hold the query fixed, and predict how exact behavior should change. If the prediction fails, the explanation loses support. That makes observability a property of the test design, not just a property of the model interface.

## Three levels of observability

First, **output observability** asks whether success is exactly checkable. Grid reasoning is useful because each output cell can be compared with a deterministic oracle; there is no judge-model deciding whether an answer sounds right.

Second, **intervention observability** asks whether controlled changes produce a predicted response. The BDH-CQ technical report provides a sharp example. On identical length-eight ordering queries, short demonstrations yielded 0 of 24 exact outputs at pass@2, while adding support at the target complexity raised the result to 13 of 24. For depth-five nesting, matched support changed 19 of 24 to 24 of 24 exact outputs [Engdahl et al., 2026]. The internal trajectory is not visible, but the intervention localizes part of the failure: demonstration coverage matters. It does not prove which internal circuit changed.

Third, **mechanism observability** asks whether internal variables can be measured or causally manipulated. This is the strongest level, but it is not always available. BDH-CQ publishes a system-level distinction between contextual memory and recurrent latent workspace while withholding exact dimensions and update rules. Therefore its behavioral interventions support claims about the deployed system, not a complete mechanistic account.

## Why latent computation is worth testing

Latent reasoning is not one method. Coconut feeds a model's continuous hidden state back as the next reasoning input instead of decoding every step; its authors report advantages on some planning tasks and evidence that a continuous state can retain multiple candidate directions [Hao et al., 2024]. Recurrent-depth models instead reuse a block for additional test-time computation. A 3.5-billion-parameter proof-of-concept improved on several reasoning benchmarks as recurrent depth increased, up to the tested compute range [Geiping et al., 2025]. These are primary experimental results, not proof that silent reasoning is inherently better.

The key test is not "does more latent compute help on average?" It is "what controlled variable should matter if the proposed mechanism is real?" For a recurrent-depth model, sweep iterations while holding input and decoding fixed. For an in-context learner, vary demonstration coverage while holding test inputs byte-identical. For a compositional claim, compare each atomic operator with the matched composition and report failures as carefully as successes.

## What the test cannot say

Behavioral observability has a hard limit: distinct internal mechanisms can produce the same input-output curve. A matched demonstration may repair memory, representation, search, or output construction. Exact outputs and controlled interventions narrow the explanation; they do not identify a unique circuit. Proprietary internals narrow it further.

So the defensible conclusion is modest but useful. Silent intermediate states do not make a system scientifically untouchable. They raise the burden of experimental design. Publish deterministic oracles, byte-identical counterfactuals, preregistered sweeps, full denominators, and negative results. Then a latent reasoner can be challenged without pretending its hidden computation is a readable proof.

## References

1. Bjorn Engdahl et al. "BDH-CQ: In-Context Learning with Recurrent Latent Reasoning." 2026. https://arxiv.org/abs/2608.09888

2. Shibo Hao et al. "Training Large Language Models to Reason in a Continuous Latent Space." 2024. https://arxiv.org/abs/2412.06769

3. Jonas Geiping et al. "Scaling up Test-Time Compute with Latent Reasoning: A Recurrent Depth Approach." 2025. https://arxiv.org/abs/2502.05171

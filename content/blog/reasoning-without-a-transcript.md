---
title: Reasoning without a transcript
topic: "9: Observability Constraints in Latent Reasoning Systems"
claim: "With the query held fixed, controlled context and compute interventions can localize a failure without decoding intermediate state, but cannot uniquely identify the internal mechanism."
version: 2
date: 2026-09-17
references: [cq, coconut, depth, superposition, bdh]
---

## How do you test reasoning you cannot read?

Suppose a machine knows that fact 0 implies fact 1, fact 1 implies fact 2, and fact 2 implies fact 3. Ask whether fact 3 follows from fact 0. The answer is yes. Now suppose the machine says no, without showing its working. Did it miss a rule, stop too early, or confuse two facts?

Reading an explanation would be useful, but it is not the only way to investigate. Keep the question fixed. Give the machine the missing rule, or let it compute for longer. The change that repairs the answer gives us a better question to ask next.

This is becoming a practical problem as models do more work without generating intermediate text. Coconut feeds hidden states back into the model as input embeddings [1]. Recurrent-depth models apply the same block repeatedly before producing an answer [2]. We can adjust their computation without asking them to write a longer explanation. To test these systems, we need experiments that still work when there is no transcript to read.

## A memory we can open

The experiment below uses a small machine whose rules we know. Each fact has a pattern of active neurons. Writing an implication strengthens connections from one pattern to the next: the outer-product memory update often called Hebbian writing. Starting from fact 0, activity spreads through those connections over successive steps. We decode the active patterns to decide which facts it reached.

Remove the rule from 1 to 2 and the path breaks. More steps cannot supply the missing connection. Restore that rule but stop the machine early, and the path exists in memory but activity has not reached fact 3. Here, more steps can help. Make two fact patterns overlap, and activity may reach a fact that should be unreachable. Separating their patterns addresses a different problem.

We check each answer against a graph search that does not use the neuron simulation. A second search checks only the rules the machine was given. The first tells us what is true; the second tells us whether the supplied information is enough. You can initially hide the neuron history, try a change, and then open it to see whether your diagnosis fits what happened.

## What this has to do with BDH

The original Dragon Hatchling paper gives attention a synaptic interpretation: activity writes to a changing memory of connections, which later activity can read. Its trained-model experiments inspect meaningful synapses [5]. Our example borrows the outer-product idea, but uses hand-built fact codes rather than a trained language model.

BDH-CQ adds a useful distinction: examples update recurrent memory, while an iterative workspace computes candidate answers. The exact updates and dimensions are proprietary [3]. We cannot open that workspace as we can open our little machine. We can, however, vary the examples or computation and measure the answers.

The report does this with ordering tasks. At length eight, short-context runs solve none of 24 cases in either tier. Adding a demonstration at the target depth raises the scores to 12/24 and 13/24, with held-out query inputs unchanged [3]. The extra example helps, but roughly half the cases still fail. That tells us to investigate both what the examples teach and what computation remains difficult; it does not show which internal circuit changed.

## Limitations

An answer can leave several explanations possible. In the restricted round below, you can observe only an unreachable control fact. All three planted faults then produce indistinguishable traces within the allowed budget. Guessing the right fault does not make the test informative.

With more useful interventions, we can separate these three known programs. Other programs, or several faults acting together, may behave differently. Even the formal graph-search construction in Reasoning by Superposition is a different system from our thresholded neuron example [4]. The comparison suggests experiments; it does not establish that real models use our mechanism.

Our recommendation is to start with a question whose answer you can check independently. Keep that question fixed, change one thing, and record failures as carefully as repairs. A silent model can still be tested. The difficult part is choosing a change that distinguishes the explanations you are considering.

## References

[1] Hao et al. (2024). Training Large Language Models to Reason in a Continuous Latent Space. Section 2. https://arxiv.org/html/2412.06769v1

[2] Geiping et al. (2025). Scaling by Thinking in Continuous Space. Recurrent-depth architecture and inference. https://arxiv.org/html/2502.05171v1

[3] Engdahl et al. (2026). BDH-CQ. Sections 3.2, 3.3, 6.2, 6.4, 6.5; Table 3. https://arxiv.org/html/2608.09888v1

[4] Zhu et al. (2025). Reasoning by Superposition. Graph reachability and diameter-D result. https://arxiv.org/html/2505.12514v1

[5] Kosowski et al. (2025). The Dragon Hatchling. Sections 5 and 6, synaptic interpretation. https://arxiv.org/html/2509.26507v1

export const sources = [
  { id: 'bdh', title: 'The Dragon Hatchling', authors: 'Kosowski et al.', year: 2025, url: 'https://arxiv.org/html/2509.26507v1', locator: 'Eq. 8; Definition 4; section 6.1, Claim 7; Appendix C.2, Claim 8' },
  { id: 'code', title: 'Official BDH attention and configuration', authors: 'Pathway', year: 2025, url: 'https://github.com/pathwaycom/bdh/blob/2b0d7a45b058d4309c84a10e0768d541fe18bdc2/bdh.py', locator: 'BDHConfig; get_freqs; Attention.forward; BDH.forward' },
  { id: 'explainer', title: 'From attention to synapses', authors: 'Pathway', year: 2026, url: 'https://pathway.com/research/bdh-explainer/bdh-architecture-derivation', locator: 'Chapter 2, Steps 2, 5, 6 and comparison table' },
  { id: 'delta', title: 'Parallelizing Linear Transformers with the Delta Rule over Sequence Length', authors: 'Yang et al.', year: 2024, url: 'https://arxiv.org/html/2406.06484v1', locator: 'Sections 2 and 3, delta recurrence and compact WY representation' },
  { id: 'gated', title: 'Gated Delta Networks', authors: 'Yang et al.', year: 2024, url: 'https://arxiv.org/html/2412.06464v1', locator: 'Section 3, gated delta recurrence and chunkwise algorithm' },
  { id: 'kimi', title: 'Kimi Linear', authors: 'Kimi Team', year: 2025, url: 'https://arxiv.org/html/2510.26692v1', locator: 'Section 2, KDA recurrence; section 3.1 and Table 1, hybrid ratio; Appendix A, DPLR formulation' },
  { id: 'qwen-next', title: 'Qwen3-Next model card', authors: 'Qwen Team', year: 2025, url: 'https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Instruct', locator: 'Model architecture and hybrid attention' },
  { id: 'qwen35', title: 'Qwen3.5-397B-A17B model card', authors: 'Qwen Team', year: 2026, url: 'https://huggingface.co/Qwen/Qwen3.5-397B-A17B', locator: 'Model architecture and model configuration' },
  { id: 'cq', title: 'BDH-CQ: In-Context Learning with Recurrent Latent Reasoning', authors: 'Engdahl et al.', year: 2026, url: 'https://arxiv.org/html/2608.09888v1', locator: 'Sections 3.2 and 3.3, Eqs. 1 to 4; Table 3; sections 6.3, 6.5, 6.6; Table 5' },
  { id: 'coconut', title: 'Training Large Language Models to Reason in a Continuous Latent Space', authors: 'Hao et al.', year: 2024, url: 'https://arxiv.org/html/2412.06769v1', locator: 'Section 2, Coconut method' },
  { id: 'depth', title: 'Scaling by Thinking in Continuous Space', authors: 'Geiping et al.', year: 2025, url: 'https://arxiv.org/html/2502.05171v1', locator: 'Sections 2 and 3, recurrent-depth architecture and inference' },
  { id: 'superposition', title: 'Reasoning by Superposition', authors: 'Zhu et al.', year: 2025, url: 'https://arxiv.org/html/2505.12514v1', locator: 'Graph-reachability construction and diameter-D result' },
  { id: 'regression', title: 'Test-time regression', authors: 'Wang, Shi and Fox', year: 2025, url: 'https://arxiv.org/html/2501.12352v1', locator: 'Sections 2 and 3, regression-memory correspondence and online gradient descent' },
  { id: 'zoology', title: 'Zoology: Measuring and Improving Recall in Efficient Language Models', authors: 'Arora et al.', year: 2023, url: 'https://arxiv.org/abs/2312.04927', locator: 'Multi-query associative recall experiments' },
] as const

export type SourceId = typeof sources[number]['id']
export const officialConfig = { layers: 6, heads: 4, valueDimension: 256, multiplier: 128 } as const
export const officialNeuronCount = officialConfig.multiplier * officialConfig.valueDimension / officialConfig.heads

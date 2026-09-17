# Official attention conformance

This is a CPU float64 attention-product check. It is not training, a checkpoint reproduction, a full-block test or a claim about proprietary BDH-CQ.

Upstream: `https://github.com/pathwaycom/bdh`, pinned commit `2b0d7a45b058d4309c84a10e0768d541fe18bdc2`. Upstream code is MIT-licensed, see `LICENSE.md` in that checkout. We import its `Attention.rope` and `get_freqs`. The two-line masked product from `Attention.forward` is reproduced in float64 because the public function asserts float32 frequencies. The script is preserved verbatim from the attached implementation brief.

Replay environment on 17 September 2026: macOS arm64, Python 3.12.14, torch 2.14.0, numpy 2.5.3. Torch seed 0; N=64, D=8, two heads, T=24, density 0.05, RoPE base 65536. The script asserts a maximum absolute error below 1e-10. Numerical last digits may vary by platform.

```bash
git clone https://github.com/pathwaycom/bdh bdh
git -C bdh checkout 2b0d7a45b058d4309c84a10e0768d541fe18bdc2
python3 -m venv .venv-conformance
.venv-conformance/bin/pip install torch==2.14.0 numpy==2.5.3
BDH_PATH=bdh .venv-conformance/bin/python research/conformance_official_bdh.py
```

Actual replay output, also preserved in `conformance-output.txt`:

```text
(d) microscope RoPE (base 2^16) vs official rope : 8.88e-16
(a) official vs fixed N x D recurrent state      : 8.88e-16
(b) official vs paper co-rotating rho (Eq. 8)    : 2.66e-15
(c) frame relation S_T^T = rho_T U^(-T)          : 2.40e-14
```

The script tests a Python copy of the TypeScript rotation formula against the imported official rotation, and two independently accumulated attention states. The TypeScript engine is separately checked by 240 seeded sequences across two bases against matrix and chunk evaluations. This distinction prevents overstating Python conformance as a direct execution of TypeScript inside PyTorch.

Excluded: LayerNorm placement, learned encoders, full model forward pass, training, language metrics, performance kernels and GPU memory. The submitted v1 state is frozen. No training run is authorized.

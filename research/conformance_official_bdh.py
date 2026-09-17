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


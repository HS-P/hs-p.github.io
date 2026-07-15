---
title: "What 40 LunarLander DQN Runs Taught Me"
date: 2026-07-16 02:30:00 +0900
categories: [Reinforcement Learning, DQN, Experiment Automation]
description: "A 40-run LunarLander study on learning rate, target updates, batch size, reliability, and negative results."
---

This study began as a reinforcement-learning assignment and grew into a small experiment-automation project. I first implemented tabular Q-learning for stochastic `FrozenLake-v1`, then built and evaluated a DQN pipeline for `LunarLander-v3`.

## From the required comparison to an autonomous sweep

The required experiment compared two learning rates while keeping the DQN structure fixed. The difference was decisive:

| Learning rate | Wall-clock | Best validation reward | Outcome |
| --- | ---: | ---: | --- |
| `0.001` | 5 min 13 sec | 241.3 | Solved at 110k steps |
| `0.00001` | 3 hr 7 min | 99.2 | Did not converge in 1,500 episodes |

I then built a queued runner with time caps, result aggregation, and automatic plots. Across approximately 25 hours, it completed 40 runs covering learning rate, batch size, target synchronization, discount factor, architecture variants, optimizer choices, and multi-seed checks.

![Required learning-rate comparison for LunarLander DQN]({{ '/assets/img/posts/rl-hw1/pub_assignment_comparison.png' | relative_url }})

## Results that mattered

The best validation result was **270.1** with batch size 128, target synchronization every 100 steps, and learning rate `5e-4`. A simpler batch-128 and `5e-4` configuration offered the best balance, reaching a validation reward of **265.8** in 3 minutes 34 seconds.

Several results were more useful because they were negative:

- Increasing the batch size helped through 128–256, but 512 regressed.
- A discount factor of `0.995` diverged severely in this setup.
- Double DQN, soft target updates, N-step returns, reward shaping, and prioritized replay did not beat the tuned vanilla baseline.
- Multi-seed timing varied by roughly four times, showing how misleading a single fast run can be.
- Combining individually promising settings did not guarantee an additive improvement.

![Key ablation findings from the DQN sweep]({{ '/assets/img/posts/rl-hw1/pub_key_findings.png' | relative_url }})

## What I would carry into a robotics experiment

The main lesson was not that one hyperparameter is universally best. It was that experiment infrastructure—time limits, reproducible configs, aggregation, and honest negative results—often matters as much as the algorithmic idea. These results are specific to LunarLander and a limited seed study, so they should not be generalized directly to continuous-control or robot-learning tasks.

The smaller FrozenLake experiment reinforced the same point. A policy that reached 10/10 during validation achieved 63/100 over a longer stochastic evaluation, making the gap between a successful demonstration and a robust policy immediately visible.

# Aikit Pros Optimizer — v2 Product Line RFC

**Status:** Draft · Apr 25, 2026
**Author:** yujunjie1983
**Goal:** Turn Aikit Pros from a one-shot ad-campaign generator into a recurring optimization workflow that lifts repeat usage and ARPU.

## 1. Problem

v1 generates a full ad campaign in ~60s for ~$0.35. Users get the assets and leave. There is no reason to come back unless they start a new campaign. Repeat usage is the bottleneck for revenue on aikitpros.com / aikitpros.cn.

## 2. Proposal: Optimizer (v2)

A second product line that takes any v1 output (or user-uploaded assets) and runs a closed-loop optimization pass.

### 2.1 A/B Copy Generator
- Input: original headline + body copy + brand voice + target audience
- Output: 3x headline variants + 3x hook variants + 3x CTA variants
- Engine: GPT-class LLM via ADC unified API; temperature staircase (0.3 / 0.7 / 1.0) for diversity
- Guardrail: brand-voice consistency check (LLM critic, reject + retry)

### 2.2 Image Micro-Edit
- Input: hero image + edit instruction (swap background, warm palette, retouch product label)
- Output: 3 regional re-renders that keep composition and product identity
- Engine: ADC image edit endpoint (Nano-Banana / FLUX-edit class) with mask auto-detection
- Guardrail: SSIM threshold vs. original to prevent identity drift

### 2.3 Performance Scoring Loop
- Heuristic scorer (CTR-style features: headline length, sentiment, hook strength, image contrast, face/product saliency)
- LLM critic (score variant 1-10 against goal X, justify in one sentence)
- Auto re-prompt: take the bottom-quartile variant, regenerate with the critic note injected into the prompt
- Stop: max 2 iterations or top-variant score >= threshold

## 3. Cost Target

Per optimization run: < $0.10
- Copy module: 9 LLM calls x ~$0.005 = $0.045
- Image module: 3 edits x ~$0.015 = $0.045
- Scoring loop: 1-2 LLM calls = $0.005

## 4. Pricing Hypothesis

| Tier    | v1 Generator | v2 Optimizer | USD/mo |
|---------|--------------|--------------|--------|
| Free    | 3 runs       | -            | $0     |
| Starter | 30 runs      | 20 runs      | $19    |
| Pro     | 150 runs     | 100 runs     | $49    |
| Studio  | 500 runs     | 400 runs     | $149   |

Bundling Optimizer into Starter/Pro should lift week-2 retention from ~12% baseline to >30%.

## 5. Dify Workflow Topology

```
[Brief or v1 Asset]
      |
      v
[Router] -- copy --> [Copy A/B Node] --+
      |                                 |
      +-- image --> [Image Edit Node] --+--> [Critic & Score Node]
                                        |              |
                                        |       (score < threshold)
                                        |              v
                                        |        [Re-prompt Node]
                                        +<-------------+
      v
[Aggregator] --> [Output: ranked variants + scores + diff view]
```

Keep depth <= 3 nodes per branch (latency lesson from v1).

## 6. UX

- New /optimize route on aikitpros.com and aikitpros.cn
- Side-by-side diff: original vs. top-3 variants, with score badge
- One-click 'Replace in campaign' pushes the winner back into the v1 asset bundle
- Per-platform export pack (X / Instagram / TikTok) using the highest-scoring variant

## 7. Milestones

- M1 (Apr 27) - Dify workflow skeleton + ADC endpoints wired, CLI test
- M2 (Apr 29) - /optimize route shipping copy module only, behind feature flag
- M3 (May 1)  - Image edit module live, full loop end-to-end
- M4 (May 3)  - Public launch + Discord / X / Reddit announcement, before competition deadline

## 8. Success Metrics

- Cost per run <= $0.10 (p95)
- p50 latency <= 25s for copy-only, <= 60s with image edit
- Week-2 retention on Starter+ >= 30%
- >= 1 paid conversion on aikitpros.com AND aikitpros.cn within 7 days of launch

## 9. Open Questions

- Vector store of past winning variants for transfer learning across users? (Probably v3.)
- Expose the heuristic scorer as a public API?
- Brand-voice fingerprint: per-user fine-tune vs. prompt-stuffing only?

---

Refs: Discord campaign-submission update Apr 25 09:19; competition X demo https://x.com/aikitpros/status/2046596943023890780; Medium https://medium.com/@yujunjie1983/i-built-a-full-ai-campaign-generator-for-0-35-heres-how-3886918b9ae3

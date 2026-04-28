<div align="center">

# Aikit Pros

**AI-Powered Marketing Campaign Generator** — Create complete ad campaigns (copy, images, video, music) from a single product brief in 30 seconds.

Built on [Ace Data Cloud](https://console.acedata.cloud) + [Dify](https://dify.ai) | Forked from [Nexior](https://github.com/AceDataCloud/Nexior)

[Live Demo](https://www.aikitpros.com/demo.html) | [Landing Page](https://www.aikitpros.com/landing.html) | [Pricing](https://www.aikitpros.com/pricing.html)

</div>

---

## What is AikitPros?

AikitPros transforms a simple product brief into a full marketing campaign:

- **AI Copywriter** — Instagram captions, Facebook ads, Google search ads, TikTok scripts (4 variants)
- **AI Image Studio** — Product shots, lifestyle photos, tech diagrams via Ace Flux API
- **AI Video Generator** — 15-second product launch spots via Sora-class models
- **AI Music & Voiceover** — Royalty-free soundtracks matched to campaign tone

All powered by Ace Data Cloud’s unified API ecosystem.

## Ace Data Cloud Integration

| Category | APIs Used |
|----------|----------|
| AI Chat | ChatGPT, Claude, Gemini, DeepSeek, Grok |
| AI Image | Flux, Midjourney, Seedream, NanoBanana |
| AI Video | Sora, Kling, Luma, Hailuo, Seedance |
| AI Music | Suno, Fish Audio, Producer |

## Project Structure

```
aikitpros/
├── api/
│   ├── image.ts        # Ace Flux API proxy
│   └── optimize.ts     # Campaign optimization endpoint
├── public/
│   ├── demo.html       # Live demo campaign page
│   ├── landing.html    # Main landing page (EN)
│   ├── landing-zh.html # Landing page (ZH)
│   ├── landing-b.html  # A/B test variant
│   └── pricing.html    # Pricing page
├── src/              # Vue.js application source
└── deploy/           # Deployment configs
```

## Quick Start

```bash
# Clone the repo
git clone https://github.com/yujunjie1983/aikitpros.git
cd aikitpros

# Install dependencies
npm install

# Set environment variables
export ACE_API_TOKEN=your_ace_api_token

# Run development server
npm run dev
```

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://platform.acedata.cloud/documents/5b942c64-5612-4aab-ab3c-9e58b64cb069)

## Links

- [Ace Data Cloud Platform](https://console.acedata.cloud)
- [Ace Data Cloud Docs](https://docs.acedata.cloud)
- [Ace Data Cloud Hub](https://hub.acedata.cloud)
- [@AceDataCloud on X](https://x.com/AceDataCloud)
- [@aikitpros on X](https://x.com/aikitpros)

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**#BuildWithAce #AceDataCloud**

Submitted for the [Ace Data Cloud Creator Competition](https://discord.com/channels/1195665641852633088/1463911916022796288)

</div>

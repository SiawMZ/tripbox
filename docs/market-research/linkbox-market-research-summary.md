# Linkbox market research: summary

**Date:** 2026-10-19 · Desk research only (no user data yet) · Full report: [detailed version](linkbox-market-research-detailed.md)

## Bottom line

The market is real but small, Southeast Asia pays little, and the social-save niche is crowded with small apps
that have little traction. Linkbox's best-evidenced edge is the **combination of Xiaohongshu + web + Android**,
aimed at people who save **food, café and travel posts to act on later**. Most of the market figures rest on one untested
assumption, so the next step is validation, not features.

## Key numbers

| | Figure | Basis | Confidence |
|---|---|---|---|
| Global addressable market (ex-China) | ~451M users, ~US$218M/yr | Estimate: DataReportal × 10% savers × RevenueCat | Low–medium |
| SEA, Android | ~36.8M users, ~US$5.0M/yr | Estimate | Low–medium |
| Malaysia, Android | ~1.7M users, ~US$229k/yr | Estimate | Low–medium |
| Realistic for a solo dev, year 3 | ~20k users, US$0.7k–24k/yr | Estimate | Low |
| India + SEA conversion to paid | 0.7% (global 2.0%); US$18.32/yr median price | RevenueCat 2026 (checked) | High |
| Malaysia phone OS | Android ~55%, iOS ~45% | StatCounter, Aug–Sep 2026 | Medium |
| Xiaohongshu users in Malaysia | ≥2.5M | Xiaohongshu data via Malay Mail, Feb 2023 | Medium |
| AI cost per save | ~US$0.0002–0.0006 | Haiku 5.5 price (checked) × assumed tokens | Medium |

**The biggest unknown:** what share of social users save posts across apps. No published data exists. 10% was
assumed, and every market figure moves in proportion to it.

## Eight insights

1. **The incumbents have left, but no successor stands out.** Pocket (Jul 2025) and Omnivore (Nov 2024) shut down. More than ten small social-save apps launched in 2024–26, and none shows traction: 0–5 Product Hunt upvotes, 50 to 1K+ Android installs.
2. **The closest rival is Sorti.** It is free with no ads, runs on Android and iOS, and transcribes video and extracts places. It has no web app and no Xiaohongshu support.
3. **Xiaohongshu is the one differentiator with evidence behind it.** No direct competitor lists it. It is also the most fragile source: there is no public API, and the platform fights scraping.
4. **Finding saves again is the weak spot, not saving.** Saves are rarely revisited (thin evidence). In 141 competitor reviews, bugs (14), price and ads (16), failed previews (8) and broken share capture (7) dominate the complaints.
5. **No platform has an official API for a user's saved posts.** Everyone relies on the share sheet or data-export import, so reliability and search decide who wins.
6. **Free AI alone doesn't differentiate.** Sorti and Stasht are also free. Raindrop, mymind, Siloe and Recall charge for AI.
7. **Platforms are adding sharing, but only within their own app.** Examples are TikTok Shared Collections (Dec 2025) and Instagram collaborative collections (2023). Cross-app public folders remain a gap.
8. **Constraints before publishing:**
   - Vercel Hobby forbids payments and ads.
   - Supabase Free storage runs out at about 1k users.
   - Instagram's terms forbid automated collection, and its official embed API has returned no thumbnails since Nov 2025.
   - Google Play needs 12 testers for 14 days.
   - Malaysia's data protection law (PDPA) may apply once the app is monetised.

## Target users (hypotheses)

- **Primary: "plan-to-go" savers** (Malaysia, 18–35). They save food, cafés and trips, and share lists with a partner or friends. Food and drink places were the top TikTok search category in Malaysia (2022).
- **Wedge: "RedNote + everything" savers** (Malaysian Chinese). They keep XHS saves alongside IG and TikTok, and want to search them in English or Chinese.
- **Don't target:** recipe savers (specialist apps win) or Pocket refugees (article readers, a different job).

## PM recommendations (evidence-linked, open to revision)

1. **Position on finding saves again:** search, Ask AI, and posts from several apps together. Don't compete on saving.
2. **Make share-sheet saving and opening in the original app rock-solid on Android** before adding features.
3. **Add place or area extraction to the AI labels.** It serves the primary user's job, and Sorti and Stasht already do it.
4. **Test Xiaohongshu reliability (30 links, ≥90% success) before marketing it.**
5. **Stay free and ad-free up to about 1k users.** Then plan capped free AI plus a paid tier, and decide hosting before charging.
6. **Make public folder pages the growth loop:** add a "Make your own list" link.
7. **iOS can wait** until retention on Android and web is proven, even though about 45% of Malaysian phones are iOS.

## Validate next (cheap)

| Test | Answers |
|---|---|
| Survey in English, Bahasa Malaysia and Chinese, n ≥ 150 | The 10% assumption, and segments A and B |
| 6–8 interviews (script in the detailed report's sources) | Personas, and how often the job comes up |
| 30-link XHS reliability test | Whether to market XHS support |
| Public folder page with a sign-up link | Whether sharing works as a growth loop |
| 2-week test with 5 users | Retention and the aha moment |
| Fake "Pro" button on the web app | Willingness to pay |

The survey, interviews and user test can also recruit the 12 Google Play testers.

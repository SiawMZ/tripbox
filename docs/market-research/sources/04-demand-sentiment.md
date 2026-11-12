# 04 · Demand signals and voice of customer (competitors + problem space)

**Date:** 2026-10-19 · **Analyst role:** demand / voice-of-customer · **Product:** Linkbox (working name)
**Method:** public web research, plus App Store review feeds and Google Play pages read directly. Follows the `sentiment-analysis` skill and the `/analyze-feedback` report format, applied to *public* feedback about competitors (Linkbox has no users yet).

> **Read this first: limits of the evidence**
> - **Google Trends could not be fetched.** Both the Trends page and its API returned HTTP 429 (rate-limited). No trend direction is claimed in this report. See section 1.1 for what to check by hand.
> - **Reddit could not be read.** The search tool refuses reddit.com (crawler blocked). I did **not** count or summarise Reddit threads, and I did not use mirrors to get around the block. Reddit evidence below is second-hand only (articles that describe Reddit discussion), and is labelled.
> - **The review sample is small and not statistically representative** (141 reviews, mostly the US App Store's most recent reviews). Treat percentages as directional.
> - Items marked **(inferred)** are my interpretation, not a sourced fact.

---

## Summary

| # | Finding | Confidence |
|---|---|---|
| 1 | Pocket's shutdown is verified: announced 22 May 2025, closed 8 Jul 2025, data deleted after 8 Oct 2025. Its users scattered across Raindrop.io, Instapaper, Readwise Reader, Matter and self-hosted tools (Karakeep, wallabag). No source quantifies the split. | High (dates), Low (split) |
| 2 | The "one place for saved social posts" niche is **crowded with small apps** (ARCHV, Saverything, ReelsHub, InstaSave, Stasht, Sprink, Tote, Picki, Memeory, Stash, Savebase, The Saved, Dewey…). Recent Product Hunt launches got **0–5 upvotes**. Many are iOS-first. | Medium |
| 3 | Evidence that people rarely revisit saves exists but is thin. One study found bookmarks were created but rarely used for retrieval. One Pocket publisher dashboard showed ~10% of saves opened. The popular "82% never read" stat is unsourced. | Medium |
| 4 | Competitor sentiment is **mildly positive overall (+0.38 on −1..+1, n=141)**. Read-later apps and visual collectors score about +0.46 to +0.48. **Social-post saver/downloader apps score negative (−0.12)**: they break when platforms change, and they are full of ads. | Directional |
| 5 | Top complaints: bugs and update regressions; broken share-sheet capture; poor parsing or previews (PDFs, paywalls, Cloudflare walls, images); subscription price versus value; weak support; mobile apps missing web features. | Directional |
| 6 | Top loved features: a generous free tier (Raindrop); calm, beautiful design (mymind, Matter); one place for everything (Reader); easy Pocket import; AI auto-organisation; text-to-speech (TTS). | Directional |
| 7 | **No platform exposes a user's saved posts or collections through a public API** (Instagram, TikTok, YouTube Watch Later, Xiaohongshu). Share-sheet capture plus import from data exports is the only practical route. | High (documented scopes) / Medium (absence) |
| 8 | Instagram oEmbed needs a Meta app with **Meta oEmbed Read, App Review and business verification**. Since 3 Nov 2025 it **no longer returns `thumbnail_url` or `author_name`**. TikTok oEmbed is public and still returns a thumbnail. | High |

---

## 1. Demand signals

### 1.1 Google Trends: not verified

- I tried `trends.google.com/trends/explore` and the `trends/api/explore` endpoint for "bookmark manager", "pocket alternative" and "read later app". **Both returned HTTP 429.** No Trends figures are reported.
- No third-party source I found published Trends data for these terms. A search for Exploding Topics data on Raindrop, Karakeep and "pocket alternative" returned only vendor roundups ([supasidebar](https://supasidebar.com/blog/raindrop-io-alternatives-2026), [Raindrop blog](https://blog.raindrop.io/pocket-alternatives/)).
- **To check by hand (5 minutes):** in Google Trends, compare "pocket alternative", "raindrop.io" and "bookmark manager" worldwide over the last 5 years. Look for a spike in the week of 22 May 2025 and a second one around 8 Jul 2025. Then check "save instagram posts" with region = Malaysia.

**Proxy demand signal that could be verified: GitHub stars of open-source alternatives** (GitHub API, read 2026-10-19):

| Repo | Stars | Created | Last push |
|---|---|---|---|
| [karakeep-app/karakeep](https://github.com/karakeep-app/karakeep) (formerly Hoarder) | 29,814 | 2024-02-06 | 2026-10-18 |
| [linkwarden/linkwarden](https://github.com/linkwarden/linkwarden) | 20,149 | 2022-04-09 | 2026-10-19 |
| [wallabag/wallabag](https://github.com/wallabag/wallabag) | 13,018 | 2013-04-03 | 2026-10-19 |

Karakeep reached about 30k stars in under 3 years. An undated vendor page quoted it at 25.2k ([rapidevelopers](https://rapidevelopers.com/clone/pocket)), which suggests continued growth **(inferred; no time series)**. An Android Authority writer says they went back to it after the Pocket news ([Android Authority](https://www.androidauthority.com/self-hosted-pocket-replacement-3562211)).

### 1.2 The Pocket shutdown: verified

| Item | Fact | Source |
|---|---|---|
| Announced | 22 May 2025, by Mozilla (Fakespot was shut down at the same time) | [9to5Mac](https://9to5mac.com/2025/05/22/mozilla-announces-shutdown-of-pocket/), [AlternativeTo](https://alternativeto.net/news/2025/5/after-17-years-mozilla-is-shutting-down-the-popular-bookmarking-tool-pocket-and-fakespot), [LWN](https://lwn.net/Articles/1022263) |
| Service ended | 8 Jul 2025 (export-only after that) | [CyberInsider](https://cyberinsider.com/mozilla-to-shut-down-pocket-service-in-july-to-allow-exports-until-october/), [TechRadar](https://www.techradar.com/computing/websites-apps/pocket-shuts-down-today-heres-how-to-get-your-data-before-the-app-closes-plus-the-3-best-alternatives) |
| Data deleted | After 8 Oct 2025 | [TechCrunch](https://techcrunch.com/2025/05/27/read-it-later-app-pocket-is-shutting-down-here-are-the-best-alternatives), [Mozilla support (KB)](https://support.mozilla.org/kb/future-of-pocket) (the page failed to render for my fetcher, so its contents were not read) |
| Mozilla's reason | Changing web habits: "the way people use the web has evolved" | Quoted in [gigazine](https://gigazine.net/gsc_news/en/20250523-mozilla-pocket-fakespot) and [webnots](https://www.webnots.com/mozilla-shuts-down-pocket-leaving-users-to-seek-alternatives/). I did not retrieve the original blog.mozilla.org post. |

**Where Pocket users went.** No source gives migration numbers. The evidence is qualitative:
- TechCrunch lists 16 alternatives: Matter, Instapaper, Raindrop.io, Plinky, Paperspan, Readwise Reader, DoubleMemory, Recall, wallabag, Readeck, Obsidian Web Clipper, Karakeep, Dewey, Folio, Burn 451 and Omphalis. It notes Instapaper's Pocket account import came with a 3-month Premium trial, and Readwise Reader's full Pocket import. It says the shutdown "boosted adoption" but gives no numbers ([TechCrunch](https://techcrunch.com/2025/05/27/read-it-later-app-pocket-is-shutting-down-here-are-the-best-alternatives)).
- TechRadar and AlternativeTo point to Raindrop.io, Instapaper, Readwise and wallabag ([TechRadar](https://www.techradar.com/computing/websites-apps/pocket-shuts-down-today-heres-how-to-get-your-data-before-the-app-closes-plus-the-3-best-alternatives), [AlternativeTo Pocket list](https://alternativeto.net/software/pocket/?p=6)).
- **In-sample evidence:** 6 of the 141 reviews in section 2 say outright that the reviewer came from Pocket (Raindrop 4, Matter 1, Instapaper 1). One more came from Omnivore (Karakeep). For example, "Best Pocket replacement" ([Raindrop App Store](https://apps.apple.com/us/app/id1021913807)).
- **Reddit (second-hand only):** a search summary reported users frustrated at having to keep migrating, and calls for self-hosted or open tools. I could not open the threads to verify this, so it is **unverified**.

**Implication (inferred):** The Pocket refugees were mostly **article readers** (read-later, highlights, TTS). That is a different job from "find the Instagram reel I saved". Linkbox's natural audience is the social-saves group. Pocket migrants are a secondary audience at best.

### 1.3 Product Hunt launches in the "saved social posts in one place" niche

| Product | What it does | PH upvotes | Launch date | Source |
|---|---|---|---|---|
| ARCHV | On-device library of saves from TikTok, Instagram, YouTube, X, Reddit and Pinterest via the share sheet; free up to 50 saves | 5 (1 comment) | 2026 ("Launched in 2026") | [Product Hunt](https://www.producthunt.com/products/archv), [hunted.space](https://hunted.space/product/archv) |
| ReelsHub | Save short videos (Reels, TikTok, Shorts, Pinterest) into collections; Android and iOS | 3 | Not stated | [hunted.space](https://hunted.space/product/reelshub) |
| Saverything | Instagram, TikTok, X, LinkedIn and web saves on "shelves" with reminders; iOS only, Android and web "coming soon" | 1 | Not stated | [hunted.space](https://hunted.space/product/saverything) |
| InstaSave | Instagram Reels only, with AI tags and summaries | 0 | Not stated | [hunted.space](https://hunted.space/product/instasave) |
| *Reference:* mymind | Visual "extend your mind" saver | 559 (#2 of the day) | 12 Nov 2021 (**outside the 2024–26 window**) | [hunted.space](https://www.hunted.space/dashboard/my-mind/launches/mymind-82cba725-59f2-4f84-baf3-c1797165c44c) |

Other apps in the same niche found outside Product Hunt (descriptions are the makers' own marketing, so unverified): Stasht ([site](https://stasht.app/app-to-save-and-organize-social-media-posts)), Sprink (iOS only; $2.99/month or $19.99/year; [blog](https://sprink.app/blog/one-app-to-save-everything-social-media.html)), The Saved ([site](https://thesaved.app/)), Savebase ([site](https://savebase.space/)), Willa ([blog](https://withwilla.io/blog/one-app-to-save-everything)), Picki ([App Store](https://apps.apple.com/app/id6758291416)), Memeory (free tier capped at 100 items; [App Store](https://apps.apple.com/us/app/id6740543991)), Stash ([App Store](https://apps.apple.com/us/app/id6761720583), 1 rating), Post Saver ([App Store](https://apps.apple.com/us/app/id6816399878), 8 ratings), SavedIt (0 ratings), and Dewey ([guide](https://getdewey.co/blog/how-to-manage-instagram-saved-posts-a-complete-guide/)).

**Reading (inferred):** many makers see the same need, but no entrant has visible traction (single-digit PH upvotes, tiny App Store rating counts). Several are **iOS-first or iOS-only**, so the Android + web position is less contested. Low PH upvotes also suggest the need is real but **low-urgency**: people don't go looking for a fix.

### 1.4 Reddit "one place for saved posts" threads: not counted

I could not read r/productivity, r/androidapps, r/selfhosted, r/PKMS, r/instagram or r/TikTok (reddit.com is blocked for the research tool). **No thread count is given.** As an indirect signal, one vendor article says that as of September 2026, neither Instagram Saved nor TikTok Favorites lets you search within your own saves ([withwilla.io](https://withwilla.io/blog/one-app-to-save-everything), a vendor source). **Next step:** do a manual Reddit search (see Gaps).

### 1.5 Do people revisit saved content?

| Evidence | What it says | Strength |
|---|---|---|
| Bergman, Whittaker & Schooler, *J. of Librarianship and Information Science* ("Out of sight and out of mind…"), n=50 | Bookmarks are created but rarely used for retrieval. Only about 16% of bookmarked targets were retrieved via bookmarks, and those were mostly ones visible in the toolbar. | Peer-reviewed but small. Figures come via a search summary and [memx.app](https://memx.app/blog/read-it-later-list-graveyard/); [university record](https://cris.biu.ac.il/en/publications/out-of-sight-and-out-of-mind-bookmarks-are-created-but-not-used-b/) (would not load) |
| Pocket for Publishers dashboard (2013) | One publisher saw about 10% "Saved Items Opened" over 30 days. Other examples range from 35% to 44%. | Anecdotal, publisher-specific ([memx.app](https://memx.app/blog/read-it-later-list-graveyard/), [glasp](https://glasp.co/articles/save-now-read-never), [gigazine 2013](https://gigazine.net/gsc_news/en/20130528-pocket-for-publishers)) |
| "82% never read" | Widely repeated, but **unsourced**. Do not use. | [glasp](https://glasp.co/articles/save-now-read-never) |
| Counter-evidence: Abrams et al. (via arXiv) | Reportedly, users revisit about 96% of their bookmarks within a year. This conflicts with the above. | Secondary citation ([arXiv 1401.0629](https://arxiv.org/pdf/1401.0629)) |
| User voice | A Raindrop user on Google Play: "do not actually go back that often to clean up" | 1 review ([Google Play](https://play.google.com/store/apps/details?id=io.raindrop.raindropio)) |

**Implication (inferred):** saving is cheap and retrieval is rare. Features that **bring items back** (search that actually finds things, AI search, resurfacing or reminders, like Saverything's "remind me later" and Stash's daily random save) speak to the real job. More ways to save do not.

---

## 2. Sentiment analysis of competitor reviews

### 2.1 Data inventory

| Source | Products | n used | How collected |
|---|---|---|---|
| Apple App Store (US), most-recent review RSS feed | Raindrop.io (25), mymind (25), Matter (16), Instapaper (16), Readwise Reader (16), Karakeep (13), TicPok (9), InMark (12) | 132 | `itunes.apple.com/us/rss/customerreviews/.../sortby=mostrecent/json`, read 2026-10-19. Reviews dated 2024-06 to 2026-10. |
| Google Play (US), reviews shown on the app page | Raindrop.io (3), Instapaper (3), Karakeep (3) | 9 | Play store page HTML |
| Trustpilot | Not collected | 0 | Not attempted due to time; low review volume expected for these apps **(inferred)** |
| **Total** | 8 products | **141** | 3 TicPok reviews were dropped as unintelligible or blank |

**Scoring rule:** stars map to sentiment as 5→+1, 4→+0.5, 3→0, 2→−0.5, 1→−1, averaged per product. Themes were coded by hand, and one review can carry several themes. **The sample is not statistically representative**: it is the newest reviews only, mostly the iOS US storefront, and reviewers self-select.

**Aggregate store ratings, for context** (read 2026-10-19):

| App | App Store US rating (count) | Google Play rating (count, installs) |
|---|---|---|
| Raindrop.io | 4.48 (420) | 4.36 (5,033; 100K+) |
| mymind | 4.04 (417) | Not located on Play under the package names I tried |
| Matter | 4.61 (1,243) | Not located on Play under the package names I tried |
| Instapaper | 4.60 (3,545) | 4.57 (12,958; 500K+) |
| Readwise Reader | 4.61 (585) | "Readwise" app 4.67 (1,295; 100K+); whether this is Reader is unverified |
| Karakeep | 4.60 (43) | 3.97 (193; 10K+) |
| TicPok (TikTok bookmarker/saver) | 4.74 (38,463) | not checked |
| InMark (IG bookmark/downloader) | 4.68 (3,108) | not checked |

Sources: iTunes Search API (`itunes.apple.com/search`); Play pages [Raindrop](https://play.google.com/store/apps/details?id=io.raindrop.raindropio), [Instapaper](https://play.google.com/store/apps/details?id=com.instapaper.android), [Karakeep](https://play.google.com/store/apps/details?id=app.hoarder.hoardermobile), [Readwise](https://play.google.com/store/apps/details?id=com.readwise).
*Note:* the high aggregate ratings of TicPok and InMark sit against negative recent reviews (below). This is a sign of recent breakage or ad changes **(inferred)**.

### 2.2 Overall sentiment

- **Positive (4–5★):** 92 / 141 (65%) · **Neutral (3★):** 14 (10%) · **Negative (1–2★):** 35 (25%)
- **Average sentiment: +0.38** (about 6.9 / 10)
- **Trend:** not computed; the date range per product is too short to support one.

### 2.3 Sentiment per product

| Product | n | Mean ★ | Sentiment (−1..+1) | Pos / Neu / Neg |
|---|---|---|---|---|
| Readwise Reader (iOS) | 16 | 4.19 | **+0.59** | 12 / 2 / 2 |
| Matter (iOS) | 16 | 4.06 | +0.53 | 11 / 3 / 2 |
| mymind (iOS) | 25 | 3.96 | +0.48 | 18 / 2 / 5 |
| Raindrop.io (iOS 25 + Play 3) | 28 | 3.89 | +0.45 | 19 / 3 / 6 |
| Karakeep (iOS 13 + Play 3) | 16 | 3.81 | +0.41 | 10 / 3 / 3 |
| Instapaper (iOS 16 + Play 3) | 19 | 3.68 | +0.34 | 13 / 1 / 5 |
| InMark (iOS) | 12 | 3.08 | +0.04 | 6 / 0 / 6 |
| TicPok (iOS) | 9 | 2.33 | **−0.33** | 3 / 0 / 6 |

### 2.4 Sentiment per segment

| Segment | Products | n | Sentiment | Core job (JTBD) | Key difference |
|---|---|---|---|---|---|
| **A. Article readers** | Matter, Instapaper, Reader | 51 | **+0.48** | "Read the long things I meant to read, comfortably, later (often by listening)." | Cares about parsing quality, TTS and price. Pocket refugees are here. |
| **B. Collectors / visual savers** | Raindrop, mymind | 53 | **+0.46** | "Keep everything that inspires or matters to me, and find it again." | Loves design and a free tier. Hurt by bugs, regressions and broken share. **Closest to Linkbox.** |
| **C. Self-hosters** | Karakeep | 16 | +0.41 | "Own my data; local AI tagging." | Mobile apps lag behind web; share-sheet bugs. |
| **D. Social-post savers / downloaders** | TicPok, InMark | 21 | **−0.12** | "Keep that TikTok or Reel so I don't lose it." | Apps break when platforms change; heavy ads; paid lifetime plans not honoured. |

Small samples per segment (16–53), so confidence is low for C and D.

### 2.5 Theme frequency (141 reviews, multi-coded)

| # | Theme | Mentions | Sentiment | Products most affected |
|---|---|---|---|---|
| 1 | Bugs, update regressions, performance | 14 | Negative | mymind 4, Instapaper 3, Raindrop 2, Reader 2, Karakeep 1, + downloader breakage (below) |
| 2 | Design / calm / beautiful UI | 12 | Positive | mymind 6, Matter 3, Raindrop 1, Instapaper 1, Reader 1 |
| 3 | Pricing / subscription value (incl. trial, refund, ads) | 12 neg + 4 ads | Negative | Matter 3, mymind 2, Reader 2, Raindrop 2, Instapaper 1, InMark 2 (+4 ads) |
| 4 | Content parsing / preview failures (PDF, paywall, Cloudflare, images, partial articles) | 8 | Negative | Instapaper 3, Raindrop 2, Matter 1, Reader 1, + Raindrop Pinterest paste friction 1 |
| 5 | Share-sheet / capture broken | 7 | Negative | Karakeep 4 (+1 request for a share button), Raindrop 2 (incl. Twitter/Instagram) |
| 6 | Pocket (or Omnivore) migration and import | 7 | Positive | Raindrop 4, Matter 1, Instapaper 1, Karakeep 1 |
| 7 | AI auto-organisation / tagging | 6 | Positive | mymind 2, Karakeep 2, Raindrop 1 (Stella AI), Reader 1. **No AI-quality complaints in sample.** |
| 8 | Downloader breakage (stops working after platform changes) | 6 | Negative | TicPok 5, InMark 1 |
| 9 | Mobile app missing features / no bulk actions | 6 | Negative | Karakeep 5, Raindrop 1 |
| 10 | Generous free tier | 5 | Positive | Raindrop 4, Instapaper 1 |
| 11 | Support quality | 4 neg / 4 pos | Mixed | Neg: Raindrop 2, Matter 2 · Pos: mymind, Matter, Reader, InMark |
| 12 | "All in one place" consolidation | 4 | Positive | Reader 3, Matter 1 |
| 13 | TTS / listening | 4 pos / 2 neg | Mixed | Matter, Reader (pos); Instapaper, Reader (neg) |
| 14 | Self-hosting / data ownership | 3 pos, 1 privacy neg | Mixed | Karakeep (pos); mymind (data-collection claim disputed by a reviewer) |
| 15 | Export / lock-in | 1 | Negative | Instapaper |

Briefs to check that did **not** appear in this sample: "no Android share" (Karakeep and Raindrop Android share exists but is buggy), "AI quality", and "poor social-media previews" as a named complaint. The nearest items were Raindrop's broken Instagram/Twitter share and the Cloudflare walls. Absence from 141 reviews does not mean these problems don't exist.

### 2.6 Theme deep-dives (top 6)

**1. Bugs and regressions: 14, negative.** Users forgive a lot until an update breaks their routine: a forced re-sync of 6,500 items ([mymind](https://apps.apple.com/us/app/id1520332347)), smaller fonts in Instapaper 10 ([Instapaper](https://apps.apple.com/us/app/id288545208)), and a reviewer calling it "disastrous quality control" ([Reader](https://apps.apple.com/us/app/id1567599761)). *Root cause (inferred):* small teams shipping redesigns without regression testing. *For Linkbox:* a solo developer has the same risk, so protect the core loop (share → saved → found) with tests before redesigns.

**2. Design: 12, positive.** mymind is loved for being "algorithm-free and easy on the brain" ([mymind](https://apps.apple.com/us/app/id1520332347)). Matter is "the prettiest and best interface" ([Matter](https://apps.apple.com/us/app/id1501592184)). *For Linkbox:* the planned Swiss design pass is a real differentiator in this category, not just polish.

**3. Pricing and value: 16, negative.** Typical lines: "Not worth $60+ per year" ([Matter](https://apps.apple.com/us/app/id1501592184)); "Not worth having a monthly subscription" ([mymind](https://apps.apple.com/us/app/id1520332347)). Downloader apps add minute-long ads and drop lifetime plans ([InMark](https://apps.apple.com/us/app/id6505021478)). On the other side, Raindrop's free tier draws praise: "the free version is amazing" ([Raindrop](https://apps.apple.com/us/app/id1021913807)). *For Linkbox:* being free is a strong position. Be explicit and honest about what stays free.

**4. Parsing and preview failures: 8, negative.** For example, a Raindrop reviewer's links got "stuck with cloudflare" ([Raindrop](https://apps.apple.com/us/app/id1021913807)), and Reader saved articles with most of the text missing ([Reader](https://apps.apple.com/us/app/id1567599761)). *For Linkbox:* the `enrich` function already keeps the original URL when a redirect leaves the platform. Bot walls are a known, user-visible failure, so show a clear fallback card rather than a broken preview.

**5. Share-sheet capture broken: 7, negative.** "Unable able to use share sheet in Twitter or Instagram" ([Raindrop](https://apps.apple.com/us/app/id1021913807)). Karakeep on Android doesn't add the bookmark if the app isn't already running ([Karakeep Play](https://play.google.com/store/apps/details?id=app.hoarder.hoardermobile)). *For Linkbox:* share capture without opening the app is already a product decision. Reliability here is make-or-break, so test cold-start sharing from each target app.

**6. Pocket migration: 7, positive.** "Very easy transition to get started from imports" ([Raindrop](https://apps.apple.com/us/app/id1021913807)). *For Linkbox:* import from data exports already exists. A Pocket CSV import would be cheap if not already supported **(inferred value; Pocket data was deleted in Oct 2025, so only users who exported in time can use it)**.

### 2.7 Segment profiles (short)

- **B. Collectors (closest to Linkbox).** JTBD: dump anything (links, images, inspiration) and find it later. Love: design, free tier, sync across devices, AI organisation. Pain: regressions, broken share for social apps, bulk actions, support. *Fit for Linkbox:* high. Churn risk for incumbents comes from bugs, not features.
- **D. Social-post savers.** JTBD: keep a TikTok or Reel before it is lost. Many want the **file** ("I just want my video", [TicPok](https://apps.apple.com/us/app/id1517992114)), not a link. Pain: breakage, ads, subscription games. *Fit:* partial. Linkbox stores links, not media; if a creator deletes the post, the link dies **(inferred risk)**. Downloading is outside platform terms (see section 3), so don't chase it.
- **A. Article readers.** JTBD: read or listen to long articles. *Fit:* low. Linkbox is not a reader, and competing on parsing or TTS is costly.
- **C. Self-hosters.** *Fit:* low-medium. They value data ownership; data export from Linkbox would speak to them.

### 2.8 Notable quotes (all under 15 words, linked)

> "Great concept, socials shares are broken" ([Raindrop, App Store, 2★, 2026-02](https://apps.apple.com/us/app/id1021913807)): segment B, negative
> "Shockingly reasonable PRO Subscription pricing" ([Raindrop, App Store, 5★, 2025-11](https://apps.apple.com/us/app/id1021913807)): B, positive
> "Not worth having a monthly subscription." ([mymind, App Store, 2★, 2026-05](https://apps.apple.com/us/app/id1520332347)): B, negative
> "if you have adhd this is what its like to NOT have adhd." ([mymind, App Store, 5★, 2025-10](https://apps.apple.com/us/app/id1520332347)): B, positive
> "Matter comes to fill the gap after Pocket closed down" ([Matter, App Store, 5★, 2026-09](https://apps.apple.com/us/app/id1501592184)): A, positive
> "why is it so difficult to export articles?" ([Instapaper, App Store, 2★, 2026-07](https://apps.apple.com/us/app/id288545208)): A, negative
> "The iOS app is missing a lot of basic functionality of the web app." ([Karakeep, App Store, 2★, 2025-01](https://apps.apple.com/us/app/id6479258022)): C, negative
> "MULTIPLE minute long un-skippable ads" ([InMark, App Store, 1★, 2026-08](https://apps.apple.com/us/app/id6505021478)): D, negative

---

## 3. Platform constraints (feasibility that affects demand)

| Platform | Preview / embed | Can a third-party app read the user's saved posts? | Source |
|---|---|---|---|
| **Instagram / Facebook (Meta)** | `GET graph.facebook.com/instagram_oembed` needs an **App or Client Access Token**, the **Meta oEmbed Read** feature, **App Review** and **business verification**. Allowed only for "providing a front-end view". Limit: 1,000 requests/hour. Since **3 Nov 2025** responses no longer include `thumbnail_url`, `thumbnail_width`, `thumbnail_height` or `author_name`. Meta says to build thumbnails from the post's HTML metadata. Private, age-restricted and embed-disabled accounts, and Stories, are excluded. | **No.** The Instagram Platform APIs serve **professional accounts only** ("your app users must have an Instagram professional account"), and a permission covers only data the user created. No saved-posts or collections endpoint is documented. *Absence in docs = inferred "not available".* The Basic Display API for personal accounts was **discontinued 4 Dec 2024**. | [IG oEmbed](https://developers.facebook.com/docs/instagram/oembed), [Meta oEmbed Read](https://developers.facebook.com/docs/features-reference/meta-oembed-read), [oEmbed updates blog (upd. 8 Oct 2025)](https://developers.facebook.com/blog/post/2025/04/08/oembed-updates/), [Instagram Platform overview](https://developers.facebook.com/docs/instagram-platform/overview), [Basic Display deprecation (Smash Balloon)](https://smashballoon.com/instagram-is-shutting-down-basic-display-api-continue-displaying-instagram-feeds-on-your-site/), [Discourse guide](https://meta.discourse.org/t/configure-an-app-token-for-instagram-oneboxes/223548) |
| **TikTok** | `GET https://www.tiktok.com/oembed?url=…`. No key is shown in the docs example, and the response **includes `thumbnail_url`**, title and author. Private and under-age accounts can't be embedded. | **No.** The documented scopes cover profile info, stats, the user's own public videos (`video.list`) and posting. There is **no liked, favourite or saved-videos scope**. The Data Portability API (`portability.activity.*`) covers **EEA and UK users only**, so Malaysian users are not covered. Whether "activity" includes favourites is unverified. The Research API is for researchers, not products. | [Embed videos](https://developers.tiktok.com/doc/embed-videos), [Scopes](https://developers.tiktok.com/doc/tiktok-api-scopes), [Display API](https://developers.tiktok.com/doc/display-api-overview/), [Data Portability API](https://developers.tiktok.com/products/data-portability-api), [TechCrunch 2024](https://techcrunch.com/2024/03/04/tiktok-rolls-out-data-portability-api-ahead-of-europes-dma-regulatory-deadline) |
| **YouTube** | Standard public oEmbed/thumbnails (not re-verified here) | **Partly.** `relatedPlaylists` exposes `likes` and `uploads` (`favorites` deprecated). **Watch Later and History are not exposed**: they return placeholder IDs `WL`/`HL` and empty lists, per a client-library note. *Not confirmed on an official dated Google page.* | [YouTube Data API: channels](https://developers.google.com/youtube/v3/docs/channels), [community note](https://github.com/jdf76/plugin.video.youtube/issues/199) |
| **Xiaohongshu (RedNote)** | No public oEmbed found. Open-source scrapers have to forge signed headers (`x-s`, `x-t`, `x-s-common`). They report **461 risk-control errors**, IP bans and a need for proxies and login cookies. | **No public API found.** Per third-party articles, the open platform is aimed at brands, advertisers and merchants, and needs real-name or business verification. No "user's collected notes" API was found. *Unverified against official docs* (developers.xiaohongshu.com was not read). | [spider_xhs (via Algolia DocSearch)](https://docsearch.algolia.com/mcp/docs/repo/cv-cat/spider_xhs), [xhshow](https://docsearch.algolia.com/mcp/docs/repo/cloxl/xhshow), [ClawHub audit](https://clawhub.ai/chocomintx/skills/xiaohongshutools/security-audit), [Aliyun article](https://developer.aliyun.com/article/1683375) |

**What this means for demand and feasibility (inferred):**
1. **The "automatically pull my saves" dream that users want is not possible through official APIs** on any of the four big platforms. Every competitor relies on share-sheet capture, pasting, or **importing the user's own data export**, which Linkbox already supports. That puts competitors on equal footing; the edge has to come from capture reliability and retrieval.
2. **Instagram previews:** going the official route means App Review plus **business verification**, which is hard for a solo developer in Malaysia. Even then, oEmbed no longer returns thumbnails. Previews from HTML meta tags (`og:image`) are what Meta itself points to, but expect login walls and rate limits ([Iframely note](https://iframely.com/updates/193071-facebook-and-instagram-oembed-thumbnail-deprecation)).
3. **TikTok previews are the easiest:** public oEmbed with a thumbnail.
4. **Xiaohongshu previews are fragile.** Scraping is fought actively; plan for a title-only or manual fallback card.
5. **Downloading media** (what segment D wants) would mean scraping. It is unreliable (see TicPok and InMark breakage) and risky under platform terms. Stay with links.

---

## 4. Actionable insights

1. **Position on retrieval, not saving.** Saving is a solved, crowded job; finding things again is not (sections 1.5 and 2.6). Lead with AI search, filters, and possibly gentle resurfacing.
2. **Treat share-sheet reliability as the top quality bar.** It is a top-5 complaint against incumbents. Test cold-start shares from Instagram, TikTok, Xiaohongshu, Threads, YouTube and the browser on Android.
3. **Design robust preview fallbacks** for bot walls and missing thumbnails (Instagram after Nov 2025, Xiaohongshu). A clean fallback card beats a broken one.
4. **Free and honest wins goodwill** in a category full of subscription and ad complaints. Never add ads; be clear about limits.
5. **Make the Android + web gap the wedge.** Many social-saver entrants are iOS-only (Saverything, Sprink, Tote, Picki, Memeory).
6. **Offer export** (CSV/JSON) to counter lock-in worries. It is cheap and appeals to self-hosters and Pocket-burned users.
7. **Don't chase Pocket readers or media downloading.** Those are different jobs, and the downloading route breaks platform rules.

## 5. Gaps and suggested follow-up

- **Google Trends** (blocked here): check by hand using the terms in section 1.1, with region = Malaysia for social-save terms.
- **Reddit** (blocked here): search by hand for `"saved posts" instagram tiktok "one place"`, `pocket alternative`, and `app to organize saved reels` in the listed subreddits. Record thread count, date and upvotes, and code the themes with the same table as 2.5.
- **Google Play reviews**: only 9 used. A larger Android sample (the "most relevant" sort, 50+ per app) would test whether Android users complain more about share intake.
- **Malaysian / Chinese-speaking users**: no local-language reviews in the sample (one Chinese Karakeep review was seen and coded positive). Xiaohongshu-heavy users are under-represented.
- **Interview script**: 5–8 people who save across 3+ platforms. Ask how often they search their saves, and what they did the last time they couldn't find one.

---

## Sources

**Pocket shutdown and migration**
- https://9to5mac.com/2025/05/22/mozilla-announces-shutdown-of-pocket/
- https://alternativeto.net/news/2025/5/after-17-years-mozilla-is-shutting-down-the-popular-bookmarking-tool-pocket-and-fakespot
- https://cyberinsider.com/mozilla-to-shut-down-pocket-service-in-july-to-allow-exports-until-october/
- https://www.techradar.com/computing/websites-apps/pocket-shuts-down-today-heres-how-to-get-your-data-before-the-app-closes-plus-the-3-best-alternatives
- https://techcrunch.com/2025/05/27/read-it-later-app-pocket-is-shutting-down-here-are-the-best-alternatives
- https://support.mozilla.org/kb/future-of-pocket (could not render)
- https://lwn.net/Articles/1022263
- https://gigazine.net/gsc_news/en/20250523-mozilla-pocket-fakespot
- https://www.webnots.com/mozilla-shuts-down-pocket-leaving-users-to-seek-alternatives/
- https://alternativeto.net/software/pocket/?p=6
- https://blog.raindrop.io/pocket-alternatives/ (vendor)
- https://supasidebar.com/blog/raindrop-io-alternatives-2026 (vendor)
- https://www.androidauthority.com/self-hosted-pocket-replacement-3562211
- https://rapidevelopers.com/clone/pocket (vendor)

**Demand proxies and Product Hunt**
- https://api.github.com/repos/karakeep-app/karakeep · https://api.github.com/repos/linkwarden/linkwarden · https://api.github.com/repos/wallabag/wallabag
- https://www.producthunt.com/products/archv · https://hunted.space/product/archv · https://hunted.space/product/reelshub · https://hunted.space/product/saverything · https://hunted.space/product/instasave
- https://www.hunted.space/dashboard/my-mind/launches/mymind-82cba725-59f2-4f84-baf3-c1797165c44c
- https://stasht.app/app-to-save-and-organize-social-media-posts · https://sprink.app/blog/one-app-to-save-everything-social-media.html · https://thesaved.app/ · https://savebase.space/ · https://withwilla.io/blog/one-app-to-save-everything · https://getdewey.co/blog/how-to-manage-instagram-saved-posts-a-complete-guide/
- https://apps.apple.com/app/id6758291416 · https://apps.apple.com/us/app/id6740543991 · https://apps.apple.com/us/app/id6761720583 · https://apps.apple.com/us/app/id6816399878

**Revisit behaviour**
- https://cris.biu.ac.il/en/publications/out-of-sight-and-out-of-mind-bookmarks-are-created-but-not-used-b/ (did not load)
- https://memx.app/blog/read-it-later-list-graveyard/
- https://glasp.co/articles/save-now-read-never
- https://gigazine.net/gsc_news/en/20130528-pocket-for-publishers
- https://arxiv.org/pdf/1401.0629

**Reviews (sample)**
- App Store pages: https://apps.apple.com/us/app/id1021913807 (Raindrop) · https://apps.apple.com/us/app/id1520332347 (mymind) · https://apps.apple.com/us/app/id1501592184 (Matter) · https://apps.apple.com/us/app/id288545208 (Instapaper) · https://apps.apple.com/us/app/id1567599761 (Readwise Reader) · https://apps.apple.com/us/app/id6479258022 (Karakeep) · https://apps.apple.com/us/app/id1517992114 (TicPok) · https://apps.apple.com/us/app/id6505021478 (InMark)
- Review feeds used: `https://itunes.apple.com/us/rss/customerreviews/page=1/id=<id>/sortby=mostrecent/json` for each ID above; ratings from `https://itunes.apple.com/search` and `https://itunes.apple.com/lookup`
- Google Play: https://play.google.com/store/apps/details?id=io.raindrop.raindropio · https://play.google.com/store/apps/details?id=com.instapaper.android · https://play.google.com/store/apps/details?id=app.hoarder.hoardermobile · https://play.google.com/store/apps/details?id=com.readwise

**Platform constraints**
- https://developers.facebook.com/docs/instagram/oembed
- https://developers.facebook.com/docs/features-reference/meta-oembed-read
- https://developers.facebook.com/blog/post/2025/04/08/oembed-updates/
- https://developers.facebook.com/docs/instagram-platform/overview
- https://developers.facebook.com/docs/instagram-platform/changelog
- https://iframely.com/updates/193071-facebook-and-instagram-oembed-thumbnail-deprecation
- https://meta.discourse.org/t/configure-an-app-token-for-instagram-oneboxes/223548
- https://smashballoon.com/instagram-is-shutting-down-basic-display-api-continue-displaying-instagram-feeds-on-your-site/
- https://developers.tiktok.com/doc/embed-videos
- https://developers.tiktok.com/doc/tiktok-api-scopes
- https://developers.tiktok.com/doc/display-api-overview/
- https://developers.tiktok.com/products/data-portability-api
- https://techcrunch.com/2024/03/04/tiktok-rolls-out-data-portability-api-ahead-of-europes-dma-regulatory-deadline
- https://developers.google.com/youtube/v3/docs/channels
- https://github.com/jdf76/plugin.video.youtube/issues/199
- https://docsearch.algolia.com/mcp/docs/repo/cv-cat/spider_xhs
- https://docsearch.algolia.com/mcp/docs/repo/cloxl/xhshow
- https://clawhub.ai/chocomintx/skills/xiaohongshutools/security-audit
- https://developer.aliyun.com/article/1683375

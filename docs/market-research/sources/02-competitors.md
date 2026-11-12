# Competitive Analysis: Linkbox (working name)

**Date:** 2026-10-19 (all facts checked on this date unless stated otherwise)
**Analyst lens:** product strategy / roadmap for a free, solo-built, Android + web app
**Analyzed:** 9 direct or near-direct competitors, 2 shut-down incumbents, 4 indirect alternatives, 3 emerging AI players

**Reading rules for this report**
- Every competitor claim carries a source number `[n]`; the list is at the end. Source date = 2026-10-19 unless noted.
- "Vendor claim" = stated by the company itself (or by a competitor's comparison page), not independently verified.
- "Unverified" = I could not confirm it from a primary or reliable source.
- "Not stated" = the source page was checked and says nothing about it. This is not the same as "No".
- Google Play numbers were read directly from the US Play Store listing on 2026-10-19 [35].

---

## 1. Market overview

**Market definition.** Consumer apps whose core job is "save something I found online, find it again later". It has split into three groups:

1. **General bookmark managers** (Raindrop.io, Karakeep, Linkwarden). Web-first, folders + tags, AI tagging added recently, often open-source or self-hostable.
2. **Read-later / knowledge apps** (Instapaper, Readwise Reader, Matter, Recall; formerly Pocket and Omnivore). Article-centric: reading view, highlights, summaries.
3. **Social-save organizers** (Sorti, Siloe, Stasht, Dewey, Sprink, Miora). New wave, mostly launched 2024–2026, focused on Instagram/TikTok/X saves, AI auto-categorization, often iPhone-first.

Linkbox sits in group 3 by job ("collect posts saved across social apps") but borrows group 1 structure (folders, tags, public shared folders, export).

**Market dynamics (evidenced):**
- **Incumbent exits.** Mozilla shut Pocket on **8 July 2025**; exports allowed until **8 October 2025**, then data was deleted and the API went offline. Mozilla said the way people save and consume content had changed [1][2]. Omnivore's hosted service shut in **November 2024** after its team joined ElevenLabs (sources disagree on 15 Nov vs end of Nov) [3][4]. Both left users with short export windows, a trust problem the remaining players now market against.
- **The social-save niche is crowded and very young.** A July 2026 comparison (published by Siloe, a competitor) lists 7 apps in this niche alone: Siloe, Stasht, Sorti, TapFold, Sprink, Dewey, Saven [10]. Android traction of the new ones is still tiny: Sorti 1K+, Stasht 1K+, Siloe 50+ installs [35].
- **AI is now table stakes.** Raindrop (Pro), Karakeep (Pro cloud), Linkwarden, mymind, Recall, Sorti and Siloe (Pro) all advertise AI tagging, categorization or summaries [6][13][15][17][8][11][19].
- **Platforms are adding their own organization.** TikTok launched Shared Collections in December 2025 (public or friends-only) [30]; Instagram has had private collections since 2017 and collaborative collections since 2023 [31][32].

**Market size:** I found no credible market-size figure for "social save organizers". Not estimated here (see the separate market-sizing work if needed).

**Key success factors (inferred from the competitor set):** zero-friction capture (share sheet that does not open the app), reliable previews on login-walled social sites, automatic organization, fast recall/search, data safety (export, survives shutdowns), and cross-device access.

---

## 2. Competitive landscape summary

| Competitor | Group | Status (Oct 2026) | Platforms | Positioning | Main strength | Main weakness |
|---|---|---|---|---|---|---|
| **Raindrop.io** | Bookmark manager | Active; Android updated 15 Sep 2026 [35] | Web, Android, iOS, extensions | "All-in-one bookmark manager" | Mature, generous free tier, free collaboration + public pages [5][7] | AI and full-text search are Pro-only [5]; web-article centric |
| **mymind** | AI visual library | Active; Android last updated 23 Jan 2026 [35] | iOS, Android, macOS, extensions [9] | Private "extension of your mind", no social features [9] | Polished AI auto-tagging, no manual filing | No free AI tier (from $7.99/mo) [8]; rejects sharing/collaboration [9]; Android 3.5 stars [35] |
| **Karakeep** (ex-Hoarder) | Bookmark manager, open source | Active; Android updated 18 Oct 2026 [35] | Web, Android, iOS, extensions, self-host [12] | Self-hostable "bookmark everything" with AI | 28k+ GitHub stars, AI tags, local AI possible [12] | Cloud free tier capped at 50 bookmarks [13]; share-sheet glitch in reviews [36] |
| **Linkwarden** | Bookmark manager, open source | Active; Android updated 12 Oct 2026 [35] | Web, Android, iOS, extensions [14] | Preservation-focused collaborative bookmarks | Page archiving, public/shared collections [14] | No free cloud plan (14-day trial, then $3/mo) [15] |
| **Sorti** | Social-save organizer | Active; Android updated 19 Oct 2026 [35] | iOS, Android [16] | Saved TikToks/Reels/screenshots sorted by AI | Free, no ads, transcribes video, extracts recipes/places [16] | No web; reviews cite lag, wrong auto-sort, lost items [36] |
| **Siloe** | Social-save organizer | Active; Android 50+ installs [35] | iOS, Android, Mac; no web [11] | Import all existing saves from your accounts | Account import (IG, TikTok, X, Reddit, LinkedIn, Bluesky), MCP server [11] | No web/Windows; very early on Android [35] |
| **Stasht** | Social-save organizer | Active, "early-stage", free [18] | iOS, iPad, Android, desktop extension [18] | Saves "that work": places on a map, dates on a calendar | Extracts places/dates/products; map + calendar views [18] | No business model yet; 1K+ Android installs [35] |
| **Dewey** | Social bookmark backup | Active (no 2026 news found) | Web + browser extensions [10][20] | Back up X/Bluesky/Threads/TikTok bookmarks | Bulk backup of existing saves; Markdown export [20] | No native mobile share flow found; paid from $7.50/mo [20] |
| **Recall** | AI knowledge base | Active; About page updated May 2026 [21] | Web, extension, iOS (Android not verified) | Summarize-and-save personal knowledge base | Summaries, AI chat, knowledge graph, quizzes [21] | Free tier: 10 AI summaries/month [21]; article/video-centric |
| *Pocket* | Read-later | **Shut down 8 Jul 2025** [1][2] | — | — | — | — |
| *Omnivore* | Read-later | **Hosted service shut Nov 2024** [3][4] | — | — | — | — |

Leaders by Android installs: Instapaper 500K+, Raindrop 100K+, mymind 100K+, Readwise Reader 100K+; challengers: Karakeep 10K+, Linkwarden 10K+; niche/new: Sorti 1K+, Stasht 1K+, Siloe 50+ [35].

---

## 3. Competitor profiles

### 3.1 Raindrop.io
- **Founding / funding:** Founder Rustem Mussabekov [22]. Founding year and funding are **unverified**: one aggregator lists 2016 and "$33M" raised [23], which looks unreliable and conflicts with the product's earlier history on Habr [22].
- **Platforms:** Web, Android, iOS, browser extensions.
- **Positioning:** All-in-one bookmark manager for "creatives and coders" [23].
- **Key features:** Unlimited bookmarks, collections, highlights and devices on Free; 100 MB uploads/month on Free [5]. Collaboration (invite link, member/read-only roles) and **public read-only pages** are free, with no member limit [7]. Pro adds full-text search (including spoken words in YouTube videos), permanent copies (web archive), **AI Assistant and AI Suggestions**, MCP, reminders, duplicate/broken-link finder, daily backups, 10 GB uploads [5].
- **Share sheet:** A Play review praises sharing a link to Raindrop "without leaving the app you're sharing from" [36].
- **Social-post previews, Xiaohongshu, opening in original app:** Not stated on the pages checked.
- **Pricing:** Free; Pro monthly or yearly (~20% cheaper yearly) [5]. Official page did not render the price. Third-party reports: **$3/mo or $28/yr** (ContextBolt, checked 10 Sep 2026, a competitor) [24]; $3.54/mo or $33.04/yr VAT-inclusive (SaaSworthy) [25]. **Treat the exact Pro price as unverified.**
- **Traction:** Google Play 100K+ installs, 4.4 stars, 5.03K reviews, updated 15 Sep 2026 [35].
- **Weaknesses from reviews:** Visible Play reviews are positive; one asks for widgets, another notes saving too much and never cleaning up [36]. Only 3 review texts were readable, so this is thin evidence.
- **Threat to Linkbox:** High for the "free, works everywhere, share folders" pitch. Raindrop already gives free public pages and collaboration, so "shareable folders" is not a differentiator against it.

### 3.2 mymind
- **Founding / funding:** "mymind, Inc.", team in the Pacific Northwest and New York City [9]. Founding date and funding **not stated / unverified**. Android app launched June 2021 [26].
- **Platforms:** iPhone, Android, macOS, Chrome/Edge/Safari extensions [9]. The Android app was removed from Play in some regions incl. India and China [27].
- **Positioning:** Private library with no filing; the manifesto rules out social features, collaboration and ads [9].
- **Key features:** AI auto-tagging and type recognition (article, product, book, recipe), AI summaries, Smart Spaces, image text recognition [8][9].
- **Pricing (from pricing page):** The Bookmarker $4.99/mo (no AI); Student of Life $7.99/mo or $79/yr; Mastermind $12.99/mo or $129/yr; Newton $299/yr "not yet available" [8].
- **Traction:** Google Play 100K+ installs, **3.5 stars**, 1.12K reviews, last updated 23 Jan 2026 [35].
- **Weaknesses from reviews:** Dislike of an ongoing subscription; a slow browser-extension confirmation window [36].
- **Threat to Linkbox:** Medium. Same "AI organizes it for you" promise, but paid and anti-sharing. Linkbox's free AI and public folders contrast directly.

### 3.3 Karakeep (formerly Hoarder)
- **Founding / funding:** Open-source project; founder and rename date **not stated** on the site [12] (unverified).
- **Platforms:** Native iOS and Android apps, extensions, web, CLI, REST API, webhooks, self-host via Docker [12].
- **Key features:** AI tagging, categorization, summaries [12]. Reviews mention tags made by a **local AI** [36].
- **Pricing (cloud):** Free $0 with 50 bookmarks / 100 MB; Pro **$4/mo or $40/yr** (50,000 bookmarks, 50 GB, AI tagging, full-text search); Team custom [13].
- **Traction:** 28k+ GitHub stars (vendor claim) [12]; Google Play 10K+, 4.0 stars, 193 reviews, updated 18 Oct 2026 [35].
- **Weaknesses from reviews:** Share sheet fails to add the bookmark if the app isn't already running; can't add straight into a list; no OIDC login on mobile [36].
- **Threat:** Low for mainstream users (self-hosting audience), but it shows that a share-to-save flow that does not open the app is hard to get right. Reliability is a differentiator.

### 3.4 Linkwarden
- **Founding / funding:** Open source; details **unverified**.
- **Platforms:** Web, iOS and Android apps, Chrome/Safari/Firefox extensions [14].
- **Key features:** Page preservation in several formats incl. full HTML; AI tagging; collaborative collections and **public collection sharing** [14].
- **Pricing:** Cloud **$3/mo per user, billed yearly**, 30,000 links, 14-day trial; no free cloud plan; self-host free [15].
- **Traction:** 19k+ GitHub stars (vendor claim) [14]; Google Play 10K+, 4.7 stars, 61 reviews, updated 12 Oct 2026 [35].
- **Threat:** Low–medium; developer/archivist audience.

### 3.5 Sorti ("Saved for a Reason")
- **Founding / funding:** Company not named on site; "Proud Member of Google for Startups" (vendor claim) [16]. The Play developer id suggests an individual developer (Linoy Bargal) [35]; **unverified**.
- **Platforms:** iPhone and Android [16]. No web app found.
- **Key features:** Share-sheet capture (pin Sorti in the share sheet); AI transcribes video audio and analyzes frames; auto-categories (recipes, workouts, products, places); extracts ingredients, brands, prices, locations; tags the creator; search by spoken words; stores the original link and keeps extracted content if the video is deleted [16].
- **Xiaohongshu:** Not mentioned [16].
- **Pricing:** Free, no ads, no subscription, no premium tier (vendor claim) [16].
- **Traction:** Google Play 1K+, 4.1 stars, 77 reviews, updated 19 Oct 2026 [35].
- **Weaknesses from reviews:** Lag; auto-sort "not perfect", users want to pick the category manually while saving; one user lost items from the home view after creating sub-categories [36].
- **Threat:** **Highest direct threat.** Same job, same price (free), Android, social-first, deeper AI on video content.

### 3.6 Siloe
- **Platforms:** iPhone, Android, Mac; no web or Windows app [10][11].
- **Key features:** Connects to accounts to **import existing saves** (X, Reddit, TikTok, Instagram, LinkedIn, Bluesky); on-device OCR search inside images/video; collections; duplicate detection; reminders; removing a bookmark can also unsave it on X, Reddit, TikTok, Bluesky; export PDF/JSON/CSV; Notion and Google Sheets sync; remote **MCP server** for Claude/ChatGPT [11]. How the Instagram/TikTok import works (official API vs scraping) is **not stated** [11].
- **Pricing:** Free with unlimited bookmarks; Pro $6.99/mo, $49.99/yr or $199.99 lifetime (semantic search, smart categorization, AI companion) [11].
- **Traction:** Google Play 50+ installs, 4.3 stars, updated 13 Oct 2026 [35].
- **Threat:** Medium. Account import is the feature Linkbox only approximates through data-export files.

### 3.7 Stasht
- **Platforms:** iPhone, iPad, Android, desktop; Chrome and Safari extensions [18].
- **Sources:** Instagram, TikTok, X, YouTube, Pinterest, Reddit, web [18].
- **Key features:** iOS share sheet, bulk import (e.g. connected X account), extraction of places, dates, recipes, products, on-screen text and speech; map, calendar, reminders, weekly roundups; public sample "stashes" [18].
- **Pricing:** Free, described as early-stage [18].
- **Traction:** Google Play 1K+, updated 4 Sep 2026; no rating shown [35].
- **Threat:** Medium; overlaps on travel/food use cases common on Xiaohongshu-style content.

### 3.8 Dewey
- **Founding / funding:** Co-founders Alex Prober and Tom Harari; launched May 2021 for Twitter bookmarks; bootstrapped two years, small investment summer 2024 [20].
- **Key features:** Backs up bookmarks from X, Bluesky, Threads, LinkedIn and others; TikTok Favorites + Collections backup added Jan 2025; Markdown export; folders and tags [20][28].
- **Pricing:** Free for one account; paid from **$7.50/mo** as of Jan 2025 [20]. 2026 price **unverified**.
- **Traction:** 40,000+ users, 1,500 paying customers (Jan 2025, per TechCrunch) [20].
- **Threat:** Low on mobile; relevant as proof that "rescue my saves from a platform" is a paying use case.

### 3.9 Recall
- **Pricing:** Free $0 (10 AI summaries/mo, unlimited saves); Plus **$10/mo billed yearly**; Max **$38/mo billed yearly** [21].
- **Key features:** Summaries of YouTube, PDFs, articles; AI chat, smart tags, knowledge graph, spaced-repetition quizzes, API and MCP [21].
- **Android:** Not verified (the Play app "Recall: Spaced Repetition" found is a different product) [35].
- **Threat:** Low–medium; the closest match to Linkbox's "Ask AI" feature, but for learners and long-form content.

### 3.10 Read-later apps still active (brief)
- **Instapaper:** Google Play 500K+, 4.6 stars, 13K reviews, updated 29 Sep 2026 [35]. Premium $5.99/mo or $59.99/yr on iOS [29]; Android price unverified.
- **Readwise Reader:** Google Play 100K+, 4.3 stars, 580 reviews, updated 8 Oct 2026 [35]. Bundled with Readwise at $9.99/mo yearly or $12.99/mo monthly, 30-day trial [33].
- **Matter:** iPhone, iPad and web only; no Android mentioned; pricing not stated on the homepage [34].
These are article-reading products, not social-post collectors. They compete for "save for later" attention, not for Linkbox's core job.

### 3.11 Candidates checked and excluded
- **Fabric (fabric.so):** AI workspace for files, notes and links; Plus $5/mo per vendor page [37]. Funding sources conflict ($1M pre-seed vs an unreliable $16M Series A claim) [37]. Workspace, not a social-save app → indirect at most.
- **Glasp, Sortd:** Not profiled; neither showed up as a social-post collector in searches. Category fit **unverified**.
- **Miora:** iOS TestFlight beta only; Android and web "planned"; sources IG, TikTok, YouTube, X, WhatsApp, web; AI Q&A over saves with citations; pricing not stated [17]. Emerging.
- **Sprink, TapFold, Saven:** iPhone-only or not listed per a competitor's comparison (Sprink $2.99/mo or $19.99/yr) [10]. Not verified independently.

---

## 4. Indirect competitors

| Alternative | Evidence | Why people use it instead | Gap Linkbox can fill |
|---|---|---|---|
| **Built-in "Saved" in each app** (Instagram collections, TikTok Collections/Favorites, Xiaohongshu 收藏) | IG private collections since 2017 [31]; IG collaborative collections 2023 [32]; TikTok Shared Collections Dec 2025, can be public [30]; RedNote saves into Pinterest-like collections [38] | Zero effort, already where content lives | Saves are siloed per app; no cross-platform search |
| **Pinterest** | Google Play 1B+, 4.2 stars, 11.7M reviews [35] | Visual boards, discovery | Only pins; not a home for IG/TikTok/XHS posts |
| **Notes / chat-to-self** (Google Keep, WhatsApp "Message yourself") | Keep: Play 1B+, 4.7 stars [35]; WhatsApp "Message yourself" rolled out late Nov 2022 [39] | Already installed, very fast | No previews, no organization, links get buried |
| **Browser bookmarks** | Mozilla points Pocket users to Firefox Tab Groups and bookmarks [2] | Free, default | Desktop-centric; poor for in-app social posts |

**Implication:** the strongest "competitor" is doing nothing (leaving posts in each app's Saved tab). Linkbox has to beat that on cross-app recall, not on saving.

---

## 5. Feature comparison matrix

Legend: **Y** = yes (sourced), **P** = paid tier only, **N** = explicitly no, **–** = not stated / not verified. Linkbox column is from the product brief.

| Capability | Linkbox | Raindrop | mymind | Karakeep | Linkwarden | Sorti | Siloe | Stasht | Recall |
|---|---|---|---|---|---|---|---|---|---|
| Android app | Y | Y [35] | Y [35] | Y [35] | Y [35] | Y [35] | Y [35] | Y [35] | – |
| Web app | Y | Y | – (extensions + mac) [9] | Y [12] | Y [14] | – | N [11] | Desktop ext. [18] | Y [21] |
| Share-sheet capture | Y (no app open) | Y [36] | Y (ext.) [9] | Y, flaky [36] | – | Y [16] | – | Y (iOS stated) [18] | – |
| Instagram / TikTok focus | Y | – | – | – | – | Y [16] | Y [11] | Y [18] | – |
| **Xiaohongshu support** | **Y** | – | – | – | – | – (not mentioned) [16] | – (not listed) [11] | – (not listed) [18] | – |
| Thumbnail / content kept if post deleted | Y (thumbnail) | P (permanent copy) [5] | P (article backup) [8] | – | Y (archive) [14] | Y (extracted content) [16] | – | – | – |
| AI tags / categories | Y (free) | P [5] | Y (paid plans) [8] | P on cloud [13] | Y [14] | Y (free) [16] | P (smart cat.) [11] | Y [18] | P (smart tags) [21] |
| AI summary / description | Y | P (AI assistant) [5] | P (Mastermind) [8] | Y [12] | – | Y (extraction) [16] | – | Y (extraction) [18] | Y, 10/mo free [21] |
| Video transcription / spoken-word search | N | P (YouTube) [5] | – | – | – | Y [16] | Y (OCR in images/video) [11] | Y [18] | Y (YouTube) [21] |
| Natural-language "Ask AI" over saves | Y | P (AI assistant) [5] | – | – | – | – | P (AI companion) [11] | – | P (AI chat) [21] |
| Folders / collections | Y (1 per link) | Y [5] | Smart Spaces [8] | Lists [36] | Y [14] | Categories [16] | Y [11] | Y [18] | – |
| Public read-only shared folder | Y | Y (free) [7] | N (no social) [9] | – | Y [14] | – | – | Public stashes [18] | – |
| Import existing platform saves | Y (IG/TikTok data export files) | Y (import) [5] | – | – | – | N (share only) [10] | Y (account connect) [11] | Y (X; extensions) [18] | P (bulk import) [21] |
| Offline save queue | Y | – | – | – | – | – | – | – | – |
| Export (JSON etc.) | Y (JSON) | Y [5] | – | Y [13] | – | – | Y (PDF/JSON/CSV) [11] | – | Y (API) [21] |
| Opens post in the original app | Y | – | – | – | – | Link back to source [16] | – | – | – |
| MCP / AI-assistant access | N | P [5] | – | API [12] | – | – | Y [11] | – | Y [21] |
| Price for AI features | Free | ~$3/mo (unverified) [24] | $7.99/mo+ [8] | $4/mo [13] | $3/mo [15] | Free [16] | $6.99/mo [11] | Free [18] | $10/mo yr [21] |

"Opens in original app" is shown as "–" for competitors because none of the pages checked state it. This does **not** prove they lack it; Android deep-linking from a plain URL often happens automatically. Do not market it as unique without testing the competitors.

---

## 6. Positioning map

**Axes chosen**
- **X: Content focus, web/article-centric (left) to social-post-centric (right).** This is the main way buyers sort these products: a Raindrop user saves articles; a Sorti user saves Reels. Evidence is each vendor's own source list [5][16][11][18].
- **Y: Price for the AI layer, paid (bottom) to free (top).** AI tagging/search is now the headline benefit in every product, and whether it costs money is the clearest strategic split (mymind/Recall/Siloe charge for it; Sorti/Stasht give it away) [8][21][11][16][18].

```
                         FREE AI
                            |
         Karakeep (self-host)|   Linkbox *        Sorti
                            |   Stasht
         Linkwarden(self-h.)|
   WEB / ARTICLE -----------+-------------------- SOCIAL POSTS
                            |
   Raindrop Pro  Karakeep cloud |      Siloe Pro
   Instapaper  Readwise     |      Dewey
   Recall    mymind         |
                            |
                         PAID AI
```

Placement notes: Raindrop's free tier has no AI [5], so it sits on the paid side. Self-hosted Karakeep/Linkwarden are "free" only for technical users. Linkbox sits top-right, but **Sorti and Stasht already occupy that quadrant**. Free + social-first alone is not a unique position.

A third dimension separates Linkbox inside that quadrant: **platform coverage of Asian social apps (Xiaohongshu) + web app + public sharing**. None of Sorti, Siloe, Stasht or Miora lists Xiaohongshu [16][11][18][17], and Sorti/Siloe have no web app [11][16].

---

## 7. Table stakes vs differentiators

**Table stakes (must have to compete; Linkbox has all of them):**
- Share-sheet save without leaving the source app (Raindrop, Sorti, Stasht) [36][16][18]
- Rich preview + thumbnail
- AI auto-tags / categories (every active player) [5][8][12][14][16]
- Folders/collections, search
- Export (trust after the Pocket/Omnivore shutdowns) [1][3]
- Android + iOS apps (Linkbox lacks iOS; every direct competitor except Siloe-on-web has iOS)

**Near table stakes in the social niche (Linkbox is behind):**
- **Content understanding beyond the caption:** video transcription, OCR, entity extraction (places, recipes, products) in Sorti, Siloe and Stasht [16][11][18]. Linkbox's AI works from the preview/caption only.
- **Importing existing saves.** Siloe (account connect) and Dewey (backup) [11][20]. Linkbox's data-export import is a partial answer: Instagram exports can take hours to days and can be requested only every four days [40].

**Potential differentiators for Linkbox (each with evidence):**
1. **Xiaohongshu as a first-class source.** No direct competitor checked lists it [16][11][18][17]. The only XHS-specific tools found are Chinese-language Chrome extensions that sync XHS saves, built on unofficial interfaces [41]. RedNote gained many non-Chinese users in Jan 2025 [42].
2. **Free AI + web app + Android together.** Sorti is free but has no web app; Siloe has no web app; Raindrop has web but charges for AI [16][11][5].
3. **Public shareable folders in a social-save app.** Raindrop and Linkwarden have public pages, but they are web-bookmark tools [7][14]; mymind refuses sharing on principle [9]; among social-save apps only Stasht shows public "stashes" [18].
4. **Offline save queue.** Not found on any competitor page (could exist unstated; low marketing value on its own).
5. **"Ask AI" over your own links, free.** Raindrop, Siloe and Recall charge for it [5][11][21].

---

## 8. Competitive threats

1. **Sorti (and similar free AI apps) out-executing on content understanding.** Free, Android, transcription and entity extraction [16]. *Watch:* Sorti adding a web app or more sources. *Response:* lead with XHS + web + sharing; consider transcript/OCR only if the free-tier cost works.
2. **Platforms improving native saving.** TikTok Shared Collections (Dec 2025) with public visibility [30]; Instagram collaborative collections (2023) [32]. These erode "sharing" as a reason to switch. *Response:* emphasize cross-platform search and one place, which no single platform will build.
3. **API and scraping restrictions.**
   - Meta shut the Instagram Basic Display API on **4 Dec 2024** [43][44]; replacements target professional accounts or Instagram Login [44]. Account-connect import of personal Instagram saves (Siloe's pitch) relies on undisclosed methods [11]; Linkbox's export-file import avoids this dependency.
   - Instagram oEmbed: Meta's doc page did not state token requirements when checked [45] → **unverified**; Linkbox should monitor preview success rates for Instagram.
   - TikTok's public oEmbed returns title, author and `thumbnail_url`; the doc does not mention authentication [46].
   - Xiaohongshu: scraper vendors claim the platform regularly changes request signing and gates search behind login [47] (vendor claims, unverified). **This is the biggest technical risk to the main differentiator.** XHS previews may break without warning.
4. **Sustainability / trust.** Pocket and Omnivore show users get burned by shutdowns [1][3]. A free solo app faces the same question from users ("will this exist next year?"). *Response:* keep JSON export visible; consider publishing a data-portability promise.
5. **Better-funded generalists adding social features.** Raindrop already has free sharing and paid AI [5][7]; a "save from TikTok/IG" improvement there would reach 100K+ Android users [35]. Unverified whether this is planned.

---

## 9. Differentiation opportunities (evidenced)

| # | Opportunity | Evidence it is unmet | Why defensible |
|---|---|---|---|
| 1 | **Best app for Xiaohongshu + Instagram + TikTok together**, bilingual-friendly (EN/BM/中文 users in Malaysia) | No competitor lists XHS [16][11][18][17]; XHS tools are Chinese-only Chrome extensions [41]; no Malaysia/SEA-focused competitor found in searches | Needs ongoing work on XHS link handling that Western-built competitors don't prioritize |
| 2 | **Manual control over AI sorting at save time** | Sorti reviewers ask to choose the category while saving because auto-sort is wrong [36]; Karakeep reviewers want to add straight into a list [36] | Cheap to build; a UX gap in the leaders of the niche |
| 3 | **Reliable share-to-save** | Karakeep share fails when the app isn't running [36]; Sorti lost items [36] | Reliability is a reputation moat for small apps |
| 4 | **Free AI with no paywall** | mymind subscription complaints [36]; AI paid in Raindrop/Siloe/Recall/mymind [5][11][21][8] | Only sustainable while Haiku costs stay low; Sorti matches this |
| 5 | **Shareable public folders for social posts** (travel lists, food spots, gift ideas) | Only Stasht in the social niche shows public collections [18]; TikTok's are TikTok-only [30] | Cross-platform lists can't be made inside any one platform |
| 6 | **Web + Android parity** | Siloe has no web; Sorti has no web [11][16] | Desktop users (planning trips, research) are underserved by phone-only apps |

**Not evidenced (do not claim yet):** "opens in the original app" as unique (competitors not tested); offline queue as a reason to switch; Swiss design as a market advantage.

---

## 10. Recommendations

- **Double down on:** Xiaohongshu-quality previews and links; free AI tags + Ask AI; public folders for cross-platform lists; web + Android.
- **Close the gap on:** (1) letting the user confirm or change folder/labels in the share flow; (2) iOS eventually, since every social-save competitor has it; (3) understanding beyond the caption (on-image text or transcripts), evaluated against free-tier cost first.
- **Ignore for now:** read-later features (highlights, reading view, text-to-speech) where Instapaper/Readwise/Matter lead; self-hosting; MCP access (niche audience).
- **Monitor quarterly:** Sorti (web app, new sources), Siloe (Instagram import method), TikTok/Instagram native collection features, XHS anti-scraping changes, Raindrop social-capture improvements.

**12–18 month risks:** XHS or Meta breaking previews (high impact on the core differentiator); a free competitor adding XHS; AI cost if Linkbox grows on free tiers.
**12–18 month opportunities:** the post-Pocket "where do I move my saves" audience; Malaysian/SEA users who mix XHS with IG/TikTok; shareable trip/food lists as an acquisition loop.

---

## Sources

All accessed 2026-10-19 unless a publication date is given.

1. 9to5Mac, "Mozilla announces shutdown of Pocket", 22 May 2025. https://9to5mac.com/2025/05/22/mozilla-announces-shutdown-of-pocket/
2. Same article (dates and Firefox replacement guidance); also PCWorld: https://www.pcworld.com/article/2793228/mozilla-is-discontinuing-pocket-and-fakespot.html and CyberInsider: https://cyberinsider.com/mozilla-to-shut-down-pocket-service-in-july-to-allow-exports-until-october/
3. wallabag, "Which alternative to Omnivore should I choose?" https://wallabag.it/en/alternatives/omnivore/
4. Weekly Journal 178 (Omnivore shutdown date extension), 2024. https://hulk1385-blog.pgs.sh/blog/2024/weekly-journal-178.html
5. Raindrop.io pricing page. https://raindrop.io/pro/buy
6. (same as 5, AI Suggestions)
7. Raindrop.io Help, Collaboration. https://help.raindrop.io/collaboration
8. mymind pricing page. https://access.mymind.com/pricing
9. mymind homepage. https://mymind.com/
10. Siloe blog, "Best Apps to Organize Saved Instagram and TikTok Posts (2026)", published 30 Jul 2026, updated 4 Sep 2026 (competitor-authored). https://siloe.app/blog/organize-saved-instagram-tiktok-posts/
11. Siloe homepage. https://siloe.app/
12. Karakeep homepage. https://karakeep.app/
13. Karakeep pricing. https://karakeep.app/pricing
14. Linkwarden homepage. https://linkwarden.app/
15. Linkwarden pricing. https://linkwarden.app/pricing
16. Sorti, "Save & Organize TikToks". https://letitsorti.com/save-tiktoks
17. Miora homepage. https://mioraapp.com/en/
18. Stasht homepage. https://stasht.app/
19. (see 11, Siloe Pro features)
20. TechCrunch, "Dewey launches a solution to save your TikTok favorites", 22 Jan 2025. https://techcrunch.com/2025/01/22/dewey-launches-a-solution-to-save-your-tiktok-favorites-just-in-case
21. Recall pricing. https://www.recall.it/pricing ; About (updated May 2026): https://www.recall.it/about
22. CB Insights, Raindrop.io people. https://www.cbinsights.com/company/raindropio/people ; Habr post: https://habr.com/en/articles/211721
23. StartupHub profile (low reliability). https://www.startuphub.ai/startups/raindrop
24. ContextBolt, "Raindrop pricing" (competitor-authored, checked by them 10 Sep 2026). https://contextbolt.com/blog/raindrop-pricing/
25. SaaSworthy, Raindrop.io pricing. https://www.saasworthy.com/product/raindrop-io/pricing
26. mymind, Android app announcement, 5 Jun 2021. https://mymind.com/android-app
27. mymind Help, "Why isn't mymind available in my country?" https://mymind.helpscoutdocs.com/article/110-app-unavailable-country
28. Dewey on Firefox Add-ons. https://addons.mozilla.org/addon/dewey/
29. Instapaper App Store listing (TH). https://apps.apple.com/TH/app/id288545208
30. TechCrunch, "TikTok adds a space for organizing content with others, teases shared feeds", 8 Dec 2025. https://techcrunch.com/2025/12/08/tiktok-adds-a-space-for-organizing-content-with-others-teases-shared-feeds
31. 9to5Mac, Instagram private collections, 17 Apr 2017. https://9to5mac.com/2017/04/17/instagram-save-posts-private-collections-folders/
32. Daily Pioneer, Instagram collaborative collections, 2023. https://www.dailypioneer.com/2023/technology/insta-launches-new-collaborative-collections-feature-to-save-posts-shared-with-friends.html
33. Readwise pricing. https://readwise.io/pricing/reader ; Reader Android install docs: https://docs.readwise.io/get-started/mobile-apps
34. Matter homepage. https://getmatter.com/
35. Google Play Store listings (US, en), read 2026-10-19: Raindrop `io.raindrop.raindropio`; mymind `com.mymind.access`; Karakeep `app.hoarder.hoardermobile`; Linkwarden `app.linkwarden`; Sorti `com.linoybargal.Sorti`; Siloe `com.madebyelio.siloe`; Stasht `app.stasht`; Instapaper `com.instapaper.android`; Readwise Reader `com.readermobile`; Pinterest `com.pinterest`; Google Keep `com.google.android.keep`; "Recall: Spaced Repetition" `app.recall` (unrelated app). URL pattern: https://play.google.com/store/apps/details?id=<package>
36. Google Play review texts shown on the same listings (Raindrop, Sorti, Karakeep, mymind), read 2026-10-19. Only the 3 featured reviews per app were readable; small sample.
37. Fabric comparison page (vendor): https://developers.fabric.so/comparison/fabric-vs-air ; CB Insights: https://www.cbinsights.com/company/fabric-5/ ; VCBacked: https://www.vcbacked.co/company/fabric-london
38. Xataka On, "RedNote: what it is…" https://www.xatakaon.com/basics/rednote-what-it-is-how-it-works-its-security-and-how-to-switch-this-chinese-tiktok-successor-to-english
39. GSMArena, "WhatsApp starts rolling out Message Yourself feature", Nov 2022. https://www.gsmarena.com/whatsapp_starts_rolling_out_message_yourself_feature-news-56677.php
40. Gizmodo AU / Instagram data download guides: https://gizmodo.com.au/?p=1103480 ; https://takeoutday.org/guides/how-to-export-instagram-data
41. ChromeBoard listings: 红薯盒子 小红书收藏同步助手 https://chromeboard.com/extension/红薯盒子-小红书收藏同步助手-ecmcecachmbljdojdnjainblgaepajgn ; Redbook Collect https://chromeboard.com/extension/redbook-collect-afnfkajfjigebjkigbfdloefgkendmoa ; sspai article https://sspai.com/post/103756
42. Malay Mail, "China's Xiaohongshu: what you need to know…", 16 Jan 2025. https://www.malaymail.com/news/tech-gadgets/2025/01/16/chinas-xiaohongshu-what-you-need-to-know-about-the-app-drawing-tiktok-users-amid-us-ban-threats/163317
43. Meta for Developers, Instagram Basic Display API overview. https://developers.secure.facebook.com/docs/instagram-basic-display-api/overview
44. Meta for Developers blog, "Update on Instagram Basic Display API", 4 Sep 2024. https://developers.facebook.com/blog/post/2024/09/04/update-on-instagram-basic-display-api
45. Meta for Developers, Instagram oEmbed. https://developers.facebook.com/docs/instagram-platform/oembed
46. TikTok for Developers, Embed Videos (oEmbed). https://developers.tiktok.com/doc/embed-videos/
47. Apify RedNote scraper listings (vendor claims): https://apify.com/nexgendata/rednote-scraper ; https://apify.com/actorzlab/rednote-scraper

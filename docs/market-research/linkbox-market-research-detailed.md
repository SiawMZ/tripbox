# Linkbox market research: detailed report

**Date:** 2026-10-19 · **Author:** product management (Claude, as Linkbox PM) · **Status:** desk research, no primary user data yet

This report combines five research workstreams. Each followed one of the `pm-market-research` skills
(market-sizing, competitor-analysis, market-segments / user-personas / customer-journey-map,
sentiment-analysis, plus a regional business review). The full workstream reports, with every source URL, are in
[`sources/`](sources/). A one-page version is in [linkbox-market-research-summary.md](linkbox-market-research-summary.md).

## 0. How to read this report

| Label | Meaning |
|---|---|
| **Fact** | Published figure or documented statement, with a source in the workstream report |
| **Estimate** | Our own calculation; the arithmetic is shown in the workstream report |
| **Hypothesis** | An inference from evidence that has not been tested with Linkbox users |
| **Unverified** | Single secondary source, or a source that could not be checked |

**Source grades** (from the market-sizing workstream): **A** primary (filings, DataReportal, RevenueCat, official
docs); **B** reputable secondary or third-party tracker; **C** paywalled "market research" listings or blogs, used only as rough brackets.

**Limits that apply to the whole report**
- **No first-party data.** Linkbox has one user, the developer. Every segment, persona and conversion figure is a hypothesis until it is tested.
- **Google Trends and Reddit could not be read** by the research tools: Trends returned rate-limit errors and Reddit blocks crawlers. Demand evidence therefore leans on reviews, Product Hunt, GitHub and published surveys.
- **The review sample is small:** 141 public reviews, mostly from the US App Store. Its results show direction, not representative figures.
- **The most important assumption has no data behind it.** The share of social-media users who save posts across several apps and want one hub is set at 10%, and every market-size figure moves in proportion to it.

### Facts re-checked at the primary source by the PM (2026-10-19)

| Claim | Result | Source |
|---|---|---|
| Claude Haiku 5.5 API price | $0.10 / MTok input, $0.50 / MTok output (prompts ≤100K) | claude.com/pricing |
| RevenueCat India + SEA download-to-paid (day 35) | **0.7% by user geography** (1.4% is by developer HQ); IN/SEA yearly median price $18.32 | revenuecat.com/state-of-subscription-apps |
| Pocket shutdown | Announced 22 May 2025, closed 8 Jul 2025, data deleted after 8 Oct 2025 | 9to5Mac, CyberInsider |
| Google Play testing for new personal accounts | ≥12 testers opted in for 14 consecutive days (accounts created after 13 Nov 2023) | Play Console Help 14151465 |
| Vercel Hobby | Non-commercial personal use only; payments and ads count as commercial; donations do not | vercel.com/docs/limits/fair-use-guidelines |
| Instagram oEmbed | Needs Meta oEmbed Read, App Review and business verification; `thumbnail_url` and `author_name` no longer returned since 3 Nov 2025 | Meta developer docs and Graph API changelog |
| Sorti exists as an active social-save app | Confirmed on AlternativeTo (Android + iOS) | alternativeto.net/software/sorti |

Where workstreams disagreed, the figure read directly from the source page wins. For example, mymind's prices
come from its own pricing page rather than from aggregator sites.

---

## 1. Executive summary

1. **The niche is real but small.** Global consumer spend on "save and organise links" apps is in the low hundreds of millions of US dollars a year (bottom-up **Estimate ≈ US$218–330M**; grade-C top-down bracket US$0.3–0.7B). For a solo developer, the realistic three-year outcome is about **20k users and US$0.7k–24k a year** (Estimate, low confidence). Treat it as a side project, not a salary.
2. **Southeast Asia is cheap to reach and hard to monetise.** India + SEA users convert to paid at **0.7%** (global median 2.0%) and the yearly median price is **US$18.32** (Fact, RevenueCat 2026). SEA holds about 8% of the addressable users but only about 2.3% of the addressable value (Estimate).
3. **The incumbents have left, and new entrants are crowding in.** Pocket (2025) and Omnivore (2024) shut down (Fact). At least 10 small "save your social posts" apps launched in 2024–2026, but none shows traction: 0–5 Product Hunt upvotes, and 50 to 1K+ Android installs (Fact).
4. **The closest rival is Sorti:** free, no ads, Android + iOS, with video transcription and place/recipe extraction. It has **no web app** and no Xiaohongshu support (Fact, from its own pages).
5. **Xiaohongshu (RedNote) is the one differentiator with evidence behind it.** No direct competitor checked lists it (Fact). Malaysia has **≥2.5M XHS users** (Fact, Xiaohongshu data via Malay Mail, Feb 2023). It is also the most fragile source technically: there is no public API, and the platform fights scraping (Fact, from scraper projects; XHS's own terms were not retrieved).
6. **Users struggle more with finding saves again than with saving.** Saving is easy and rarely revisited: a small peer-reviewed study found bookmarks are "created but not used" (Fact, weak). The most valued features in reviews are recall-related (AI organisation, "all in one place"), and the most common complaints are reliability-related: bugs (14 mentions), price and ads (16), failed previews (8) and broken share-sheet capture (7) (Fact, n=141).
7. **No platform offers an official API for a user's saved posts:** not Instagram, TikTok, YouTube Watch Later or XHS (Fact, from developer docs). Every competitor relies on the share sheet, pasting, or data-export import, the same routes Linkbox already uses. So capture reliability and retrieval decide who wins, not access.
8. **Three platform and business constraints need decisions before publishing:**
   - Vercel Hobby forbids any payment or ads (Fact).
   - Supabase Free storage runs out at about 1k users (Estimate).
   - Instagram's terms forbid automated collection, and its official embed route no longer provides thumbnails (Fact).

---

## 2. Product snapshot (as of 2026-10-19, from `PLAN.md`)

**What it does**
- Saves links to posts from Instagram, Xiaohongshu, TikTok, Facebook, Threads, YouTube and the web.
- Saving works through the Android share sheet without opening the app, or by pasting.
- Each save gets a preview and thumbnail, plus an AI description and 1–4 labels (Claude Haiku 5.5).
- Organising and finding: folders, search, filters, and "Ask AI" search.
- Sharing and data: public read-only folder pages, import from Instagram/TikTok data exports, an offline save queue, JSON export, and account deletion.

**Platforms and infrastructure:** Android + web; iOS later. Free-tier stack (Supabase Free, Vercel Hobby).

**Business status:** not monetised, personal use only, not yet on Google Play.

---

## 3. Market size (workstream 01)

### 3.1 Definition
- **What it is:** cross-platform personal curation of social content, sold to consumers (B2C).
- **Geography:** global excluding mainland China (Google Play and the core platforms are unavailable there), then SEA, then Malaysia.
- **Value basis:** realised first-year revenue per paying user (RevenueCat), not list price.

### 3.2 Top-down (published category sizes; all grade C)

| Category | Size | Publisher | Note |
|---|---|---|---|
| Bookmark manager software | ~US$1.0B (2025), ~9% CAGR | WiseGuy Reports | Internally inconsistent; lists defunct products as key players |
| Personal knowledge management | US$1.8B (2025), 14.2% CAGR; 38.6% individual use | Marketintelo | "Upcoming" report, unclear method |
| Note-taking apps | ~US$11B (2025) | The Business Research Company | Far broader; outer bound only |
| Non-game app in-app spend (context) | US$85.5B (2025), +21% | Sensor Tower (A/B) | No productivity split |

**Bracket (Estimate):** the consumer "save and organise" slice is about US$0.3–0.7B a year. This is an order of magnitude only, not a basis for decisions.

### 3.3 Bottom-up (the figures to use)

| Metric | Users | Value / year | 2029 users | 2029 value | Confidence |
|---|---|---|---|---|---|
| **TAM**: global ex-China cross-platform savers | ≈451M | ≈US$218M (US$330M at list price) | ≈522M | ≈US$252M | Low–medium |
| **SAM**: SEA, Android | ≈36.8M | ≈US$5.0M | ≈41.3M | ≈US$5.6M | Low–medium |
| **Beachhead**: Malaysia, Android | ≈1.70M | ≈US$229k | ≈1.80M | ≈US$243k | Low–medium |
| **SOM**: solo developer | ≈2k (year 1) | ≈US$270 (year 1) | ≈20k (5k–50k) | ≈US$4.2k (0.7k–24k) | Low |

**Formulas**
- TAM = 4.51B social identities ex-China (DataReportal) × 10% savers × 2.1% freemium conversion × US$23 realised revenue per payer (RevenueCat).
- SAM = 468M SEA identities × 10% × 78.5% Android (StatCounter, Asia) × 0.7% × US$19.32.
- Malaysia = 30.7M × 10% × ~55% Android × 0.7% × US$19.32.

### 3.4 Assumptions that move the numbers most

| # | Assumption | Confidence | Effect if wrong | How to validate |
|---|---|---|---|---|
| A3 | 10% of social users save across apps and want a hub | **Low (no data)** | Linear: 5% halves everything | Survey of n ≥ 150 (see §12) |
| A6 | Android share as the reach filter (MY ~55%) | Medium | An iOS app would add ~80% to the MY reach | Play Console data after launch |
| A7 | English (+BM) is enough for SEA | Low | SEA reach could be 30–60% smaller | Installs by language |
| A9 | SOM 2k / 20k users | Low | Dominates real revenue | Re-forecast 90 days after Play launch |

**Break-even constraint (Estimate):** at 0.7% conversion and US$19.32 per payer, each free user brings in about
US$0.135 a year. AI and hosting cost per free user must stay below that, or AI features must sit behind the paid tier.

---

## 4. Demand signals (workstream 04)

| Signal | What it shows | Strength |
|---|---|---|
| Pocket shutdown (2025) and Omnivore (2024) | Users were displaced, mostly **article readers**; no migration numbers published | High (dates), low (size) |
| Karakeep 29.8k GitHub stars (created Feb 2024), Linkwarden 20.1k | Active interest in "save everything" tools among technical users | Medium (proxy) |
| Product Hunt, 2024–26 social-save launches (ARCHV 5, ReelsHub 3, Saverything 1, InstaSave 0 upvotes) | Many makers see the need; **no entrant has traction**; low urgency | Medium |
| Social search behaviour: 65% of Gen Z have used TikTok to search, but only 4% rely on it more than Google (Adobe 2026, down from 8%) | Discovery is spread across apps, so saves are spread too | Medium (US data) |
| SEA TikTok search: places to eat or drink was the top category, including in Malaysia (Milieu, Oct 2022) | Food and places are the leading saving use case in the home market | Medium (old) |
| Revisit behaviour: bookmarks "created but not used" (n=50 study); ~10% of saves opened in one Pocket publisher dashboard; the "82% never read" stat is **unsourced** | Retrieval is the weak point, but the evidence is thin and partly contradicted (one secondary citation claims 96% revisit) | Low |

**Reading (Hypothesis):** the need is real but low-urgency. People do not look for a fix until the moment
they cannot find something. Demand is therefore triggered by need (planning a trip, choosing where to eat), not
by habit. That has consequences for acquisition (see §11).

---

## 5. Competitive landscape (workstream 02)

### 5.1 Three groups
1. **General bookmark managers:** Raindrop.io, Karakeep, Linkwarden. Mature, web-first, AI added recently.
2. **Read-later / knowledge apps:** Instapaper, Readwise Reader, Matter, Recall. Article-centric.
3. **Social-save organisers:** Sorti, Stasht, Siloe, Dewey, Sprink, ARCHV and others. New, mostly iOS-first, small.

Linkbox does group 3's job but borrows group 1's structure (folders, tags, public pages, export).

### 5.2 Key competitors (Google Play figures read 2026-10-19, US listing)

| Competitor | Status | Android installs / rating | Price for AI | Strength | Weakness |
|---|---|---|---|---|---|
| Raindrop.io | Active | 100K+ / 4.4 | Pro ~US$3/mo (unverified) | Generous free tier; free public pages and collaboration | AI and full-text search paid; article-centric; reviews report broken Instagram/Twitter sharing |
| mymind | Active | 100K+ / 3.5 | US$7.99–12.99/mo | Polished AI auto-tagging | No free AI; refuses sharing on principle |
| Karakeep | Active, open source | 10K+ / 4.0 | Cloud Pro US$4/mo | AI tags, self-host | Share sheet fails if the app isn't running; free cloud capped at 50 bookmarks |
| Linkwarden | Active, open source | 10K+ / 4.7 | US$3/mo | Archiving, public collections | No free cloud plan |
| **Sorti** | Active | 1K+ / 4.1 | **Free, no ads** | Video transcription, place/recipe extraction | No web app; lag, wrong auto-sort, lost items in reviews |
| Stasht | Active, early | 1K+ | Free | Places on a map, dates on a calendar | No business model yet |
| Siloe | Active | 50+ | Pro US$6.99/mo | Imports existing saves by connecting accounts; MCP | No web app; method of Instagram import not disclosed |
| Recall | Active | Android not verified | Plus US$10/mo (yearly) | Summaries, AI chat, quizzes | Long-form and learner focus |
| Pocket / Omnivore | **Shut down** (Jul 2025 / Nov 2024) | — | — | — | — |

**Indirect competitors:** each app's built-in Saved tab (the default to beat); Pinterest (1B+ installs);
Google Keep and WhatsApp "Message yourself"; browser bookmarks. Platforms keep adding their own options: **TikTok
Shared Collections (Dec 2025, can be public)** and Instagram collaborative collections (2023) (Fact).

### 5.3 Feature position

| Capability | Linkbox | Status vs market |
|---|---|---|
| Share-sheet capture, preview, AI tags, folders, search, export | Yes | **Table stakes:** everyone has these |
| iOS app | No | **Gap:** every social-save competitor except Siloe-on-web has iOS |
| Understanding beyond the caption (transcripts, on-image text, places) | No | **Gap:** Sorti, Siloe and Stasht have it |
| Importing existing saves | Data-export files only | **Partial:** Siloe connects accounts; Instagram exports take hours to days |
| Xiaohongshu as a source | Yes | **Differentiator:** no direct competitor lists it |
| Free AI + web + Android together | Yes | **Differentiator as a combination:** Sorti has no web; Raindrop charges for AI |
| Public folder pages in a social-save app | Yes | **Partial:** Raindrop and Linkwarden have them for web links; only Stasht among social-save apps |
| Free "Ask AI" over your saves | Yes | **Differentiator:** Raindrop, Siloe and Recall charge for it |
| Opens in the original app | Yes | **Not proven unique:** competitors not tested; Android often deep-links plain URLs |
| Offline save queue | Yes | Not seen elsewhere; little marketing value on its own |

### 5.4 Positioning
On the axes *web/article ↔ social posts* and *paid AI ↔ free AI*, Linkbox sits in the **free-AI, social-posts**
quadrant. **Sorti and Stasht are already there.** Within that quadrant, the factors that set Linkbox apart are
Xiaohongshu support, the web app and public sharing.

---

## 6. Customer segments (workstream 03; all Hypotheses)

| Segment | Size indicator (Fact) | Primary job | Fit | Priority |
|---|---|---|---|---|
| **A. "Plan-to-go" savers** (food, cafés, travel; 18–35, urban MY) | Food/drink was the top TikTok search category in MY (2022); TikTok reaches 30.7M MY adults (18+) and Instagram 16.1M people (ad reach, late 2025) | Find the saved place when actually going out or planning a trip, and share the list | High | **Primary** |
| **B. "RedNote + everything" savers** (Malaysian Chinese, 20–40) | ≥2.5M XHS users in MY (Feb 2023); XHS ranked 7th among social apps on Google Play MY (Sept 2025) | Keep XHS saves with the rest, searchable in English or Chinese | Medium–high, unique | **Most defensible wedge** |
| C. Recipe savers | Recipes are a top-3 TikTok search category in SEA | Find tonight's recipe | Medium (specialist apps win) | Don't target |
| D. Guilty savers / learners | Gen Z social search is broad; overwhelm is reported anecdotally | Use saved advice later | Medium | Tertiary |
| E. Displaced Pocket users / power organisers | Pocket closed 2025 | One searchable, exportable archive | Medium (article job) | Early testers only |

A and B overlap heavily: a Malaysian Chinese couple planning a Penang trip belongs to both.

**Sentiment per segment (workstream 04; competitor reviews, small n):**
- Collectors and visual savers (Raindrop, mymind; the closest to Linkbox): **+0.46**.
- Article readers: +0.48.
- Self-hosters: +0.41.
- **Social-post saver/downloader apps: −0.12**, driven by breakage when platforms change, and by ads.

---

## 7. Personas (Hypotheses: composites, not interview data)

| | Aina, the weekend planner (A, primary) | Wei Ling, the RedNote researcher (B) | Daniel, the guilty saver (D) |
|---|---|---|---|
| Who | 27, Kota Kinabalu, Android, TikTok/IG/WhatsApp, plans outings with a partner | 31, Penang, reads Chinese and English, heavy XHS user, also IG/Threads | 23, student in KL, saves study, career and finance posts |
| Job | "Type 'KK brunch' and find it in seconds, then share the list" | "Keep RedNote saves with everything else, searchable across languages" | "Find that advice again without the pile making me feel behind" |
| Top pains | Saves scattered across apps; can't search by place; IG shared collections are IG-only (Fact) | XHS saves locked in XHS; messy share text; mixed-language search | Hundreds of saves rarely revisited; can't recall the source; folder overwhelm |
| Unexpected insight (with evidence) | TikTok surfaces cafés, Instagram is where people check them (Perlis study), so **one place is often saved from two apps** | XHS is also used for civic and political information in MY (Fulcrum/SCMP), so saves may include news | Saving itself gives a sense of ownership (experts quoted by Decode), so **resurfacing features may annoy** |
| Product gaps | Place/area field; save confirmation; polished mobile public page | Clean XHS handling; bilingual search and summaries; English-only UI | Ask AI is the strongest fit; risk of becoming another graveyard |

---

## 8. Customer journey, primary persona (Hypothesis)

| Stage | Key moment | Pain point | Opportunity |
|---|---|---|---|
| Awareness | Opens a friend's public folder ("KK cafés") from WhatsApp | Doesn't know what Linkbox is | Small "Make your own list" link on public pages |
| Consideration | "Another app I'll forget? Does it work with TikTok and XHS?" | Installing an APK outside the Play Store feels unsafe; platform list unclear | A "works with" row; Play Store listing |
| Acquisition | Google sign-in | Asked to sign in before seeing any value | One-line privacy promise: links only, no social account access |
| Onboarding | First share-sheet save | "Did it save?" | Clear confirmation toast; preview within seconds |
| **Aha** | Search "brunch kk" returns posts saved from TikTok *and* IG | Bad or empty labels kill it | AI extracts area or city into labels |
| Moment of truth | Taps a saved café and it opens in TikTok | Opens in browser or a dead link | Reliable deep links on Android |
| Retention | Comes back when planning | Weeks between needs, so she forgets the app | Test a gentle resurfacing reminder (may annoy persona D) |
| Advocacy | Shares the "Penang trip" folder | Plain-looking page | A fast, good-looking public page as the main growth loop |

**Churn triggers (Hypothesis):** one or two failed or slow share-sheet saves; empty previews or labels on
TikTok/XHS; long gaps between moments of need; a partner on iPhone (only partly offset by the web page).

---

## 9. Voice of the customer: competitor review sentiment (workstream 04)

**Sample:** 141 public reviews of 8 apps (132 App Store US, 9 Google Play), dated Jun 2024 to Oct 2026.
**Overall sentiment:** +0.38 on a −1..+1 scale (65% positive, 10% neutral, 25% negative). Directional only.

| Product | n | Sentiment |
|---|---|---|
| Readwise Reader | 16 | +0.59 |
| Matter | 16 | +0.53 |
| mymind | 25 | +0.48 |
| Raindrop.io | 28 | +0.45 |
| Karakeep | 16 | +0.41 |
| Instapaper | 19 | +0.34 |
| InMark (Instagram saver/downloader) | 12 | +0.04 |
| TicPok (TikTok saver/downloader) | 9 | −0.33 |

| Top complaints (mentions) | Top praise (mentions) |
|---|---|
| Price vs value, incl. ads (16) | Design, calm UI (12) |
| Bugs and update regressions (14) | Pocket/Omnivore import (7) |
| Preview or parsing failures: PDF, paywall, Cloudflare (8) | AI auto-organisation (6) |
| Share-sheet capture broken, incl. Raindrop from IG/Twitter (7) | Generous free tier (5) |
| Downloaders breaking after platform changes (6) | "All in one place" (4) |
| Mobile app missing web features / bulk actions (6) | |

No complaints about AI quality appeared in this sample. That absence does not prove AI quality is fine.

---

## 10. Regional market and business model (workstream 05)

### 10.1 Home market (DataReportal Digital 2026; data from Oct 2025)

| | Malaysia | Singapore | Indonesia | Philippines | Thailand | Vietnam |
|---|---|---|---|---|---|---|
| Social media identities | 30.7M (85%) | 5.33M | 180M | 95.8M | 56.6M | 79.0M |
| Instagram ad reach | 44.6% | 57.0% | 37.6% | 22.9% | 28.7% | 11.4% |
| Threads ad reach | **10.0%** (highest of the six) | 7.9% | 2.8% | 4.1% | n/a | 4.6% |

- **Phone platforms in Malaysia:** StatCounter mobile browsing share for Aug–Sep 2026 is Android ~54–55% and **iOS ~45–46%**. An Android-only app therefore reaches only about half of Malaysian phones.
- **English:** Malaysia ranks 24th worldwide on EF EPI 2025 ("high proficiency"), so an English UI is workable.
- **Instagram fit by country:** Instagram is strongest in Malaysia and Singapore. Facebook dominates the Philippines and Vietnam.
- **Xiaohongshu users** skew female, aged 20–35, and mostly read Chinese.

### 10.2 Willingness to pay
- **RevenueCat 2026, India + SEA (Fact):** 0.7% download-to-paid; US$3.75 median monthly price; US$18.32 median yearly price.
- **AI apps (Fact):** earn 41% more per payer but churn 30% faster.
- **Competitor prices (Fact unless noted):** about US$28–60 a year globally: Raindrop ~US$28 (unverified), Linkwarden US$36, Karakeep US$40, Instapaper US$59.99, Matter US$60, mymind US$79–129.
- **Google Play fee (Fact):** 15% on subscriptions.

### 10.3 Unit costs (Estimates; token counts assumed, not measured)
- **AI per save:** about US$0.0002–0.0006 with Haiku 5.5.
- **Ask AI per query:** about US$0.002.

| | 1k users | 10k users | 100k users |
|---|---|---|---|
| LLM cost / month | ~US$7–12 | ~US$72–117 | ~US$720–1,170 |
| First limit to break | Supabase Free storage (1 GB thumbnails) and 500 MB database | Egress (5 GB); database | Supabase Pro limits |
| Realistic hosting floor | Free | Supabase Pro US$25+/mo | Pro + overages |

**Break-even at 10k downloads (Estimate):**
- Revenue: 70–140 payers × US$18.32 less 15% Play fee ≈ US$1.1–2.2k a year.
- Costs: about US$1.2–1.7k a year.
- Result: roughly break-even. It works only if conversion beats the regional median, or AI sits in the paid tier.

### 10.4 Monetisation options

| Model | Evidence | Constraint |
|---|---|---|
| Freemium, AI features paid | Raindrop, mymind, Siloe and Recall gate AI | Sorti and Stasht give AI away free, which pressures pricing |
| Capped free AI (N labels or asks per month) | Matches the per-use cost | — |
| Subscription | 0.7% conversion in SEA | Needs volume |
| Ads | Most-criticised theme in downloader reviews | **Breaks Vercel Hobby terms** |
| Donations | Explicitly allowed on Vercel Hobby | Small |

---

## 11. Platform, legal and publishing constraints

| Area | Fact | Implication |
|---|---|---|
| **Instagram** | The Help Centre says the terms prohibit automated collection without permission. The official oEmbed needs App Review plus business verification and has not returned thumbnails since 3 Nov 2025. The Basic Display API ended 4 Dec 2024. | Server-side fetching of Instagram pages for previews is fragile and against Instagram's terms. Plan a fallback card; review how `enrich` handles Instagram before publishing. |
| **TikTok** | Public oEmbed returns a title, author and thumbnail. No scope exists for favourites or saved videos. | The lowest-risk preview source. Check the TikTok Developer Terms on storing thumbnail copies. |
| **Xiaohongshu** | No public API. Scraper projects report signed headers, "461" risk-control errors and IP bans. XHS's own terms were not retrieved. | The key differentiator is also the most fragile. Run the 30-link reliability test (§12) before marketing it. |
| **Saved-posts APIs** | None of Instagram, TikTok (outside EEA/UK portability), YouTube Watch Later or XHS expose a user's saved items | Share sheet + data-export import is the only route for everyone, so competitors are on equal footing |
| **Google Play** | New personal accounts need 12+ testers for 14 consecutive days. Android developer verification began 30 Sep 2026 in Indonesia, Singapore and Thailand; global rollout 2027+. | Recruiting testers is a prerequisite. The sideloaded-APK route will need a registered developer once Malaysia is covered. |
| **Malaysia PDPA (amended 2024)** | Fines up to RM1M. Breaches reported to the Commissioner within 72h and to affected users within 7 days. A data protection officer is required above ~20k data subjects (single vendor source). The Act covers "commercial transactions". | Whether it applies to a free app is **uncertain**. Assume it applies once the app is monetised; get advice. Saved links can reveal sensitive interests. |
| **Vercel Hobby** | No commercial use | Any paid tier or ads means Vercel Pro or another host |
| **Supabase Free** | Pauses after 1 week of inactivity; no self-serve backups | Already listed in `PLAN.md` "Fix before publishing" |

---

## 12. What the evidence supports: options and PM recommendation

The evidence supports some claims and leaves others unproven. The recommendations below are the PM's
reading of the data. Each one is tied to the evidence behind it and is open to revision once user data exists.

### 12.1 Supported by evidence
1. **Position on finding saves again, not on saving** (§4, §9). Lead with search, Ask AI and cross-app recall.
2. **Treat share-sheet reliability as the top quality bar.** It is a top-5 complaint against incumbents (§9), and the biggest churn risk in the journey (§8).
3. **Free with no ads is a credible position.** Price and ads are the most-criticised themes (§9), but free AI is already matched by Sorti and Stasht, so it does not differentiate on its own (§5).
4. **Combine Xiaohongshu, web and Android.** It is the only combination no checked competitor offers (§5.3). Before claiming it, test its reliability (§11).
5. **Use public folder pages as the growth loop.** The primary persona's job is shared planning (§6–8). Platform-native sharing only works within one app (Fact: IG collections, TikTok Shared Collections).

### 12.2 Not supported (do not claim or assume)
- "Opens in the original app" as unique: competitors have not been tested.
- The 10% saver share and the SOM user counts.
- That users will pay in SEA at the global median: they convert at about a third of it.
- That Pocket refugees are Linkbox's audience: they are mostly article readers (§4).

### 12.3 Decisions this research informs

| Decision | Evidence for | Evidence against / risk | PM recommendation |
|---|---|---|---|
| Target segment | A has the clearest moment of need; B is unique | B needs Chinese UI or content; XHS fragile | **A as primary, B as the wedge**, validated with interviews |
| Add place/area extraction to AI labels | Persona A's job; Sorti and Stasht do it | Extra tokens per save | Cheap first step: prompt change, then measure |
| iOS | ~46% of MY phones; all social-save rivals have it | Large effort for a solo developer | After Android + web retention is proven |
| Monetise | Costs pass hosting limits at ~1–10k users | 0.7% conversion; Vercel Hobby terms | Stay free to ~1k users; plan capped free AI + paid tier; decide hosting before charging |
| Play Store release | Required for trust (§8 consideration stage) | 12-tester rule; final name and package needed | Recruit testers from the interviews and survey (§13) |

---

## 13. Validation plan (cheap, solo-runnable)

| # | Test | Pass signal (set before running) | Answers |
|---|---|---|---|
| 1 | 3-question survey (EN/BM/中文) via Threads, XHS, WhatsApp groups; n ≥ 150 | Share saving on ≥2 apps; food/places as top category; XHS among Chinese speakers | A3 (10% assumption), segment A/B |
| 2 | 6–8 interviews using the script in [sources/03](sources/03-segments-personas-journey.md) §6a | Repeated "where was that…" stories; sharing behaviour | Personas, job frequency |
| 3 | 30-link XHS reliability test | ≥90% preview + open-in-app success | Whether to market XHS |
| 4 | Public folder page with a "Make your own list" link | Click-through rate set in advance (e.g. 5%) | Growth-loop viability |
| 5 | 2-week concierge test with 5 people (couples planning a trip) | 3 of 5 still saving in week 2 | Retention, aha moment |
| 6 | Fake-door "Pro" button on the web app | Click rate vs the 0.7% benchmark | Willingness to pay |
| 7 | Manual Google Trends + Reddit check (tools were blocked) | — | Fills demand gaps in §4 |
| 8 | Measure real tokens per save and thumbnail size in Supabase | — | Replaces the cost estimates in §10.3 |

Tests 1, 2 and 5 can also recruit the 12 Google Play testers.

---

## 14. Open questions

- How often do people actually revisit saved social posts? No quantitative study exists.
- Do Malaysians save more on TikTok, IG or XHS, and does it differ by language group?
- Is saving itself the value for some users, which would make resurfacing features unwanted?
- Does the Malaysian PDPA apply to a free, non-commercial app?
- What is Raindrop's current Pro price? Its official page did not render it.

## Sources

All source URLs are in the workstream reports:
[01 Market sizing](sources/01-market-sizing.md) ·
[02 Competitors](sources/02-competitors.md) ·
[03 Segments, personas, journey](sources/03-segments-personas-journey.md) ·
[04 Demand and sentiment](sources/04-demand-sentiment.md) ·
[05 Regional market and business](sources/05-regional-business.md)

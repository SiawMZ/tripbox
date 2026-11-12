# Linkbox: Market Sizing (TAM / SAM / SOM)

Prepared 2026-10-19 by the product team's market analyst. Method: `market-sizing` skill (market definition, top-down, bottom-up, SAM, SOM, growth, assumptions).

Labels used throughout:
- **[Data]** means a published figure, with a source number in brackets that maps to the Sources section.
- **[Estimate]** means my own calculation; the arithmetic is shown.
- **Source quality** is rated **A** (primary: filings, official stats, DataReportal/Kepios, RevenueCat dataset), **B** (reputable secondary or third-party tracker), or **C** (paid "market research" listing pages or blogs: weak methodology, use only as a rough bracket).

---

## 1. Market definition

**Problem space.** People save posts inside each social app (Instagram Saved, TikTok Favourites, Xiaohongshu 收藏, Facebook Saved, YouTube Watch Later, browser bookmarks). Those saves are siloed per platform, hard to search, and rarely revisited. Linkbox's job is to "capture once from any app, find it again later, open it in the original app." That is **cross-platform personal content curation**. It sits between three established categories:

| Neighbour category | Examples | Overlap with Linkbox |
|---|---|---|
| Bookmark managers | Raindrop.io, browser bookmarks | High (closest functional match) |
| Read-later apps | Pocket (shut down), Instapaper, Matter, Readwise Reader | Medium. They are article/text-centric; Linkbox is social-post-centric |
| Visual saving / "second brain" | Pinterest, mymind, Notion/Obsidian (PKM) | Medium. Same saving behaviour, different content or depth |

**Customer.** Individual consumers (B2C), mostly 18–35-year-old heavy social media users who save across two or more platforms. Not enterprise.

**Geography (three levels).**
1. **Global, excluding mainland China.** Google Play is unavailable in mainland China, and Instagram, Facebook and YouTube are blocked there. China is excluded from TAM.
2. **Southeast Asia (SEA).** Home region; Android-heavy; Xiaohongshu is used by Chinese-speaking communities.
3. **Malaysia.** Beachhead market, with an English + Bahasa Malaysia audience.

**Scoping decisions.**
- The product is Android + web today and iOS later. The key differentiator (save from the share sheet without opening the app) currently needs Android, so **SAM is filtered to Android share**. iOS users can still use the web app, but with a weaker experience.
- Value sizing uses **realised revenue per payer** (RevenueCat Year-1 realised LTV), not list price, to avoid overstatement.

**Category context.** Mozilla shut down Pocket on 2025-07-08 (announced 2025-05-22) and deleted user data on 2025-10-08. It cited changing web browsing habits as reducing the relevance of standalone save-for-later apps [9][10]. Pocket had 17 million users in 2015 [10]. This is both a warning (monetising pure read-later is hard) and an opening (displaced users, and saving has moved from articles to social posts).

---

## 2. Top-down estimates (published category sizes)

| Category | Size (year) | Forecast / CAGR | Publisher, date | Quality | Notes |
|---|---|---|---|---|---|
| Bookmark manager software | US$935.9M (2024); US$1,023M (2025) | US$2,500M by 2035; ~9.3% CAGR | WiseGuy Reports, listed Aug 2026 [12] | **C** | Internally inconsistent: its FAQ calls US$1,023M the 2024 size. The methodology text mentions OEMs, SKUs and supply chains, which suggests generic boilerplate. Its "key players" include defunct products (Xmarks, Google Bookmarks, Pocket). |
| Bookmark manager for enterprise | US$1.2B (2025) | US$2.7B by 2034; 11.5% | Marketintelo [13] | **C** | Enterprise scope, not relevant to B2C. It conflicts with a sister Marketintelo report ("enterprise bookmarking platform", US$1.8B 2025). |
| Personal knowledge management (PKM) software | US$1.8B (2025) | US$5.2B by 2034; 14.2% | Marketintelo, updated 2026-06-12, status "Upcoming" [14] | **C** | Individual-use share 38.6%; Asia Pacific share 22.3% (fastest growing, 18.1% CAGR). |
| Note-taking apps | ~US$11.0–11.1B (2025) | US$23.8B by 2029 (21.0%); US$28.05B by 2030 (20.5%) in a later edition | The Business Research Company, via GII listings [15] | **C** | Far broader (includes OneNote/Evernote/Notion-type suites). Only an outer bound. One aggregator cites US$576M, which signals definitional chaos. |
| Read-later apps | No credible published figure found | n/a | n/a | n/a | Searches returned only 2011–2012 company news [10]. |
| Total non-game app IAP spend (context) | US$85.5B (2025), +21% YoY; total IAP US$167B | n/a | Sensor Tower State of Mobile 2026, Jan 2026 [16] | **A/B** | No productivity-category breakdown is public. |

**Top-down slice for Linkbox [Estimate].**
- Consumer PKM: US$1.8B × 38.6% individual use = **≈US$695M** (2025). This uses a C-grade source and a broader "PKM" definition.
- Consumer bookmark managers: the WiseGuy total (~US$1.0B) does not split consumer from business. If consumers are 30–50% (**pure assumption**, low confidence), the slice is **≈US$300–500M**.
- Top-down bracket for "consumer save/organise links" globally: **≈US$0.3–0.7B per year** (low confidence).

**Verdict on top-down.** All category reports found are paywalled "market research" listings with unclear methodology (grade C). Use them only to show the order of magnitude: hundreds of millions to about a billion US dollars, growing roughly 9–14% a year. They should not drive decisions.

---

## 3. Bottom-up estimates (users × conversion × revenue per payer)

### 3.1 Inputs

| # | Input | Value | Source / date | Quality |
|---|---|---|---|---|
| I1 | Global social media user identities | 5.79B (69.9% of population), +5.4% YoY | DataReportal/Kepios Digital 2026 Mid-Year, April 2026 [1] | A |
| I2 | China social media user identities | 1.28B | DataReportal Digital 2026 China, Oct 2025 [2] | A |
| I3 | SEA social media identities: Indonesia 180M; Philippines 95.8M; Vietnam 79M; Thailand 56.6M; Malaysia 30.7M; Myanmar ~21M; Singapore 5.33M | Sum of these 7 = **468.4M** | DataReportal Digital 2026 country reports, Oct 2025 [3][4][5]; ID/VN/TH/MM via Seasia.co citing DataReportal [6] | A (MY, PH, SG direct); B (ID, VN, TH, MM secondary) |
| I4 | Malaysia: population 36.1M; internet users 35.4M (98.0%); social identities 30.7M (85.0%). Ad reach: YouTube 23.6M, Facebook 23.0M, Instagram 16.1M, Threads 3.6M; TikTok 30.7M (18+) | Oct/late 2025 | DataReportal Digital 2026 Malaysia [3] | A (ad reach is not active users) |
| I5 | Xiaohongshu users in Malaysia | ~2.5–2.9M | Agency/LinkedIn claims [17] | C |
| I6 | Mobile OS share (web traffic): worldwide Android 69.17%; Asia Android 78.47%; Indonesia Android 79.16%; Malaysia Android 55.23% / iOS 44.75% | Sept 2026 | StatCounter [7] | B (measures traffic, not installed base) |
| I7 | Freemium median download-to-paid (D35) | 2.1% (top quartile >4.5%); hard paywall 10.7%; all apps 2.0% | RevenueCat State of Subscription Apps 2026 (115k apps, 2025 data) [8] | A |
| I8 | IN/SEA download-to-paid (D35) | 0.7% by user geography (1.4% by developer HQ); trial-to-paid 15.2% vs NA 34.2% | RevenueCat 2026 [8] | A |
| I9 | Year-1 realised LTV per payer | Global median US$23; IN/SEA US$19.32 (by user geography) | RevenueCat 2026 [8] | A |
| I10 | Median subscription prices | Yearly US$34.80 (up from US$31.60); IN/SEA monthly US$3.75 and yearly US$18.32 | RevenueCat 2026 [8] | A |
| I11 | Productivity apps | 71.9% of paid conversions happen on Day 0; Year-1 RLTV/payer US$24.95 (median) | RevenueCat 2026 Productivity [8b] | A |
| I12 | Pinterest (visual saving at scale) | 640M MAU, Q2 2026, +11% YoY | Pinterest 10-Q / 8-K, Aug 2026 [11] | A |
| I13 | Share of social users who save across platforms and want one place | **No published data found.** Assumed 10% | Estimate (see A3) | Low |

Searches for a credible statistic on how many users use "save" features, or how often saved posts are revisited, found only an interview-practice site (dataford.io) with unattributed numbers (for example "62% of saved posts never revisited"). **I did not use them.** Meta does not publish save-feature usage.

### 3.2 Calculation

**Global TAM (ex-China), volume [Estimate].**
- Social identities ex-China = 5.79B (Apr 2026) − 1.28B (Oct 2025) = **4.51B**. The dates are mixed and identities are not unique people, so this overstates people.
- Target cross-platform savers = 4.51B × 10% (A3) = **451M users**.
- Sanity check: Pinterest alone has 640M MAU (I12) doing a narrower form of saving. A 451M addressable "savers who'd want a hub" is the same order of magnitude, so plausible as a ceiling.

**Global TAM, value [Estimate].**
- Payers = 451M × 2.1% freemium conversion (I7) = 9.47M.
- × US$23 Year-1 realised revenue per payer (I9) = **≈US$218M per year**.
- At the list-price median (US$34.80) the figure is ≈US$330M. Range: **US$218–330M**.

**SAM: SEA, Android, volume [Estimate].**
- 468.4M SEA identities × 10% savers × 78.47% Android (Asia share, I6) = **≈36.8M users**.
- Value: 36.8M × 0.7% IN/SEA conversion (I8) × US$19.32 (I9) = 257k payers × US$19.32 = **≈US$5.0M per year**.

**Beachhead: Malaysia, Android, volume [Estimate].**
- 30.7M × 10% × 55.23% Android (I6) = **≈1.70M users**.
- Value: 1.70M × 0.7% × US$19.32 = 11.9k payers × US$19.32 = **≈US$229k per year**.

### 3.3 Reconciling top-down and bottom-up
- The bottom-up global consumer figure (US$218–330M) sits at or below the low end of the top-down bracket (US$0.3–0.7B). The top-down figures include desktop bookmarking, note-taking and PKM spend that Linkbox does not target, so a lower bottom-up number is expected.
- Both methods agree on the order of magnitude: **a few hundred million US dollars a year globally**. That is a modest niche, consistent with Pocket being shut down and the market consisting mainly of small, profitable players (Raindrop, Instapaper, Matter, mymind) rather than unicorns.
- **SEA is economically small.** Conversion (0.7%) is a third of the global freemium median, and prices are about half of North American levels [8]. SEA is ~8% of TAM users but only ~2.3% of TAM value (US$5.0M ÷ US$218M).

---

## 4. Competitor price points (willingness-to-pay anchors)

| Product | Status | Paid price | Source / date | Quality |
|---|---|---|---|---|
| Raindrop.io Pro | Active; free tier unlimited | US$3/mo or US$28/yr (US web price, checked 2026-09-10). Other listings: US$3.54/mo or US$33.04/yr incl. VAT. **Conflict**: regional/tax differences | ContextBolt [18]; SaaSworthy [18]; official page says yearly is ~20% cheaper [18] | B |
| Instapaper Premium | Active | US$5.99/mo or US$59.99/yr (as of May 2026; reportedly first rise in nine years) | ReadLess and others [19] | B/C |
| Matter Premium | Active | US$8/mo or US$60/yr | ReadLess, MakerStack [19] | B/C |
| Readwise (incl. Reader) | Active; no permanent free tier | US$9.99/mo billed annually or US$12.99 monthly. **Conflict**: some list US$7.99 | ReadLess, Asian Efficiency (2026-07-06) [19] | B/C |
| mymind | Active | ~US$5.99–6.99/mo entry; US$12.99/mo top tier; US$299 yearly/lifetime option. **Conflict** across aggregators | Capterra, OpenTools (2026-05-29), Spendbase [20] | C |
| Pocket Premium | **Shut down** 2025-07-08 | n/a | 9to5Mac, Wikipedia [9][10] | A/B |
| Pinterest | Free, ad-funded | US$0 | [11] | A |

**Takeaway.** Global willingness to pay clusters at **US$28–60 per year** for save/read-later tools. Linkbox's realistic SEA price point would be about **US$18 per year (~RM 6–8 per month)**, in line with the RevenueCat IN/SEA yearly median (US$18.32). That figure is an estimate and needs testing.

**Install benchmarks.** Raindrop.io has **100K+** Google Play installs (lower bound only, AppBrain listing) [21]. mymind has **210K+** iOS downloads (third-party tracker) [21]. Direct Google Play pages could not be read by the research tools; verify manually.

---

## 5. SAM detail

| Filter | Effect | Basis |
|---|---|---|
| Exclude China | −1.28B identities | Google Play and core platforms unavailable [2] |
| Platform: Android + web only | ×0.785 (Asia), ×0.55 (Malaysia), ×0.69 (worldwide) | StatCounter Sept 2026 [7]. iOS users are reachable only via the weaker web experience |
| Language: English + BM (Chinese UI not planned) | Not quantified | Indonesian, Thai, Vietnamese and Filipino users may need localisation. This further shrinks the realistic SAM (see A7) |
| Geography focus: SEA | SEA is ~10% of ex-China global identities (468M ÷ 4.51B) | [1][2][3]–[6] |

**SAM as % of TAM.** Users: 36.8M ÷ 451M ≈ **8%**. Value: US$5.0M ÷ US$218M ≈ **2.3%** [Estimate].

An alternative SAM, **global Android ex-China**, if launched worldwide on Google Play in English: 451M × 69.17% = **≈312M users; ≈US$151M** (312M × 2.1% × US$23) [Estimate]. That is reachable in principle, but a solo developer with no marketing budget cannot meaningfully address it.

---

## 6. SOM (solo developer, realistic)

**Basis.**
- One developer and free-tier infrastructure.
- No paid acquisition, no current public users (personal use), not yet on Google Play.
- Competitors with years of history show **100K+ installs** (Raindrop, Android) [21].
- Freemium conversion medians: 0.7% (SEA) to 2.1% (global) [8].
- Growth channels available: Google Play organic search, Malaysian personal and community networks, and Xiaohongshu/Threads/TikTok content. No figures for these exist yet, which is why the SOM ranges are wide.

**SOM [Estimate].**
- **Year 1 (to late 2027):** 2,000 installed users (range 500–5,000), mostly Malaysia. 0.7% convert, giving ≈14 payers × US$19.32 ≈ **US$270/yr** (range ≈US$70–680).
- **Year 3 (2029):** 20,000 users (range 5,000–50,000), a mix of SEA and global Play Store traffic. Blended 1.0% conversion gives ≈200 payers × ~US$21 ≈ **US$4.2k/yr**.
  - Low case: 5k × 0.7% × US$19.32 ≈ US$680.
  - High case: 50k × 2.1% × US$23 ≈ US$24k.
- **SOM share:** 20k ÷ 36.8M SEA SAM ≈ **0.05%** of SAM users; ≈0.08% of SAM value. 20k users would be about 20% of Raindrop's lower-bound Android install count after roughly a decade, which is ambitious but possible with a strong niche.

**Implication [Estimate].** Even the high-case SOM (~US$24k/yr) is side-project revenue, not a salary. The per-user AI cost (descriptions, labels, Ask AI) must stay below about US$0.10 per free user per year to break even at 0.7% conversion and US$19 per payer (0.007 × 19.32 ≈ US$0.135 revenue per user per year, before store fees).

---

## 7. Market summary table

| Metric | Current (2026) users | Current (2026) value / yr | 2029 projection users | 2029 projection value / yr | Confidence |
|---|---|---|---|---|---|
| **TAM**: global ex-China cross-platform savers | ≈451M | ≈US$218M (ceiling US$330M at list price) | ≈522M | ≈US$252M | Low–medium (driven by the 10% saver assumption) |
| **SAM (SEA)**: SEA, Android | ≈36.8M | ≈US$5.0M | ≈41.3M | ≈US$5.6M | Low–medium |
| **Beachhead**: Malaysia, Android | ≈1.70M | ≈US$229k | ≈1.80M | ≈US$243k | Low–medium |
| **SOM**: solo developer | 2k users (yr 1) | ≈US$270 (yr 1) | 20k users (range 5k–50k) | ≈US$4.2k (range US$0.7k–24k) | Low |

**Projection method [Estimate].**
- TAM grows +5% a year in identities (DataReportal global YoY was +5.4% [1]; China grew only +0.5% [2]), so 451M × 1.05³ = 522M.
- SEA grows +4% a year (assumption; MY/SG are near saturation): 36.8M × 1.04³ = 41.3M.
- Malaysia grows +2% a year (already 85% penetration [3]): 1.70M × 1.02³ = 1.80M.
- Conversion and price are held flat (conservative). RevenueCat shows the yearly median price rose ~10% in one year [8]; if that continues, values rise ~10–20% more.
- The published category CAGRs (9.3% bookmarks [12], 14.2% PKM [14]) are higher than this projection but come from C-grade sources.

---

## 8. Growth drivers and trends

**Expanding.**
- **Saving behaviour keeps growing.** Social identities are +5.4% a year [1]. Pinterest MAU is +11% YoY to 640M with Gen Z at over half its users [11].
- **AI adoption.** 2.42B generative-AI users (DataReportal mid-2026 [1]). AI apps earn ~41% more per payer [8], which supports paid "Ask AI" search and auto-labelling. They also churn ~30% faster [8].
- **Pocket's exit (2025)** left an established user base looking for alternatives [9][10].
- **Non-game app spending overtook games** for the first time in 2025 (US$85.5B, +21%) [16]. Consumers are increasingly willing to pay for utility apps.
- **Fragmentation across platforms.** Malaysia alone spreads across YouTube, Facebook, TikTok, Instagram, Threads and Xiaohongshu [3][17]. More platforms mean more need for a cross-platform hub.

**Contracting / risks.**
- **Platform features.** Native collections (Instagram Collections, TikTok Favourites folders, Pinterest boards) and browser/OS-level AI recall could reduce the need. Mozilla's Pocket rationale says the standalone save-for-later category is losing relevance [9].
- **Low SEA monetisation.** 0.7% conversion and roughly half-price [8].
- **Platform link fragility.** Login walls and anti-bot measures limit previews/thumbnails (already seen in the product). Changes to data-export formats affect import.
- **Google Play billing failures.** These account for 31% of Play cancellations vs 14% on the App Store [8b], which hurts an Android-first app.

---

## 9. Key assumptions and risks

| # | Assumption | Value used | Confidence | How to validate | Impact if wrong |
|---|---|---|---|---|---|
| A1 | Social identities approximate reachable people | 4.51B ex-China; 468M SEA | Medium (DataReportal warns identities ≠ unique people; Malaysia's 18+ figure is 114.8% of the adult population [3]) | Cross-check with GWI past-month platform use (e.g., Instagram 71.4% of internet users 16+ ex-China/Russia [1]) | ±20–30% on all volume figures |
| A2 | China excluded entirely | — | High | — | Small (Xiaohongshu's mainland users are unreachable via Play) |
| A3 | **10% of social users are cross-platform savers who would want a hub** | 10% | **Low**: no published data | Survey 100–200 people (Compass/Threads/Xiaohongshu MY audience): "Do you save posts on ≥2 apps? Have you failed to find a saved post in the last month?" Also track landing-page sign-up rate | Linear: 5% halves everything; 20% doubles it |
| A4 | Freemium conversion: 2.1% global, 0.7% SEA | RevenueCat medians | Medium–high for benchmarks; low for Linkbox specifically | After launch, measure D35 download-to-paid. Run a fake-door "Pro" button test pre-launch | Top-quartile freemium (>4.5%) would roughly double value |
| A5 | Revenue per payer US$23 global / US$19.32 SEA (Year-1 realised) | RevenueCat | Medium–high | Test RM price points (e.g., RM 6.90/mo vs RM 59/yr) | ±30% |
| A6 | Android share as SAM filter | 78.5% Asia, 55.2% MY, 69.2% world | Medium (StatCounter measures traffic, not devices) | Check Google Play Console country/device data after launch | MY SAM is very sensitive. An iOS app would raise MY SAM by ~80% |
| A7 | English + BM UI is enough for SEA | Not discounted | Low | Look at Play Console installs by language; ask early users | Real SEA SAM could be 30–60% smaller without Bahasa Indonesia/Thai/Vietnamese |
| A8 | Growth rates: +5% / +4% / +2% a year | Derived from DataReportal | Medium | Re-check the Digital 2027 report (expected early 2027) | Small over 3 years |
| A9 | SOM of 2k (yr 1) / 20k (yr 3) users | Judgement, benchmarked to Raindrop 100K+ installs | **Low** | Track Play installs, WAU and save events per user monthly. Re-forecast after 90 days on Play | Dominates real revenue; wide range US$0.7k–24k |
| A10 | Category reports (WiseGuy, Marketintelo, TBRC) reflect reality | Used only as brackets | **Low** (grade C, internally inconsistent) | Do not purchase. Prefer Sensor Tower/Appfigures category revenue if needed | Little effect on the conclusion |
| A11 | Xiaohongshu users in Malaysia | 2.5–2.9M | Low (agency claims) | Search for a Xingyin/Xiaohongshu IPO prospectus (a Hong Kong IPO is reportedly being prepared [17]) | Affects Chinese-speaking niche positioning only |

**What would materially change the estimates.**
1. Primary survey data on cross-platform saving (A3). This is the single biggest lever.
2. Instagram or TikTok shipping a cross-platform or AI-searchable saved-items feature (shrinks TAM).
3. An iOS launch (raises the Malaysia/Singapore SAM substantially).
4. Achieving top-quartile conversion through a strong Pro feature such as Ask AI (lifts value 2×).

**Conflicting sources flagged.**
- **Malaysia social identities:** 25.1M (Jan 2025, Digital 2025) vs 30.7M (Oct 2025, Digital 2026) [3]. These are different reference dates and DataReportal revised its methodology. I used 30.7M.
- **RevenueCat IN/SEA D35 conversion:** 0.7% (user geography) vs 1.4% (developer HQ). I used 0.7%. RevenueCat's monthly median price appears as both US$8 and US$10 in different sections [8].
- **Productivity plan mix:** RevenueCat says both "77% monthly" and "77% yearly" in different sections [8b].
- **WiseGuy bookmark market:** the 2024 value is given as both US$935.9M and US$1,023M [12]. Marketintelo's two enterprise bookmark reports conflict (US$1.2B vs US$1.8B for 2025) [13].
- **Xiaohongshu global MAU:** 300M+ vs 400M+ [17].
- **Competitor prices** (Raindrop, Readwise, mymind) vary by region, tax and aggregator [18][19][20].

---

## 10. Recommended next research
1. **Validate A3** with a 5-question survey to the owner's Malaysian network and Compass followers. Target n ≥ 150; measure the share who save on ≥2 platforms and lose saved posts.
2. **Read competitors' Google Play listings directly** (Raindrop, Instapaper, mymind, Readwise Reader, Matter) for install bands and in-app purchase price ranges. The tools could not render Play pages.
3. **Download the full RevenueCat SOSA 2026 PDF** (free, email-gated) for Productivity-specific D35 and price medians.
4. **Fake-door Pro test** on the web app before building billing.

---

## Sources

1. DataReportal / Kepios, "Digital 2026 Mid-Year Global Update Report," April 2026: https://datareportal.com/reports/digital-2026-mid-year-global-update-report. Also "Digital 2026 Global Overview Report" (Oct 2025; 5.66B identities): https://datareportal.com/reports/digital-2026-global-overview-report. Accessed 2026-10-19.
2. DataReportal, "Digital 2026: China," published 2025-11-05 (data Oct 2025): https://datareportal.com/reports/digital-2026-china
3. DataReportal, "Digital 2026: Malaysia," data Oct/late 2025: https://datareportal.com/reports/digital-2026-malaysia. Previous edition: https://datareportal.com/reports/digital-2025-malaysia
4. DataReportal, "Digital 2026: Philippines," data Oct 2025: https://datareportal.com/reports/digital-2026-philippines
5. DataReportal, "Digital 2026: Singapore," data Oct 2025: https://datareportal.com/reports/digital-2026-singapore
6. Seasia.co, "From chat to checkout: Southeast Asia's social media reality in 2026," 2026-09-13 (cites DataReportal Digital 2026 country reports for Indonesia, Vietnam, Thailand, Myanmar): https://seasia.co/2026/09/13/from-chat-to-checkout-southeast-asias-social-media-reality-in-2026
7. StatCounter Global Stats, Mobile OS market share, Sept 2026. Worldwide: https://gs.statcounter.com/os-market-share/mobile/worldwide; Asia: https://gs.statcounter.com/os-market-share/mobile/asia; Indonesia: https://gs.statcounter.com/os-market-share/mobile/indonesia; Malaysia: https://gs.statcounter.com/os-market-share/mobile/malaysia
8. RevenueCat, "State of Subscription Apps 2026" (115k apps, US$16B+ revenue, 2025 data): https://revenuecat.com/report. Secondary summary: SaaStr, https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth
   8b. RevenueCat, "State of Subscription Apps 2026: Productivity": https://www.revenuecat.com/state-of-subscription-apps-2026-productivity
9. 9to5Mac, "Mozilla announces shutdown of Pocket," 2025-05-22: https://9to5mac.com/2025/05/22/mozilla-announces-shutdown-of-pocket/. Also CyberInsider: https://cyberinsider.com/mozilla-to-shut-down-pocket-service-in-july-to-allow-exports-until-october/
10. Wikipedia, "Pocket (service)" (17M users, Sept 2015; shutdown dates): https://en.wikipedia.org/wiki/Pocket_(service). Historical: TechCrunch 2011-07-26, https://techcrunch.com/2011/07/26/read-it-later-raises-2-5-million-wants-to-become-the-dropbox-of-content
11. Pinterest Inc., Q2 2026 Form 10-Q and 8-K press release (640M MAU, revenue US$1.18B), Aug 2026: https://www.sec.gov/Archives/edgar/data/0001506293/000150629326000104/pins-20260630.htm ; https://www.sec.gov/Archives/edgar/data/0001506293/000150629326000102/q2-26xpressrelease.htm
12. WiseGuy Reports, "Bookmark Manager Software Market," listed Aug 2026: https://www.wiseguyreports.com/reports/bookmark-manager-software-market
13. Marketintelo, "Bookmark Manager for Enterprise Market": https://marketintelo.com/report/bookmark-manager-for-enterprise-market ; "Enterprise Bookmarking Platform Market": https://marketintelo.com/report/enterprise-bookmarking-platform-market/amp
14. Marketintelo, "Personal Knowledge Management Software Market," last updated 2026-06-12: https://marketintelo.com/report/personal-knowledge-management-software-market
15. The Business Research Company, "Note Taking App Global Market Report" (via GII listings): https://gii.tw/report/tbrc1678166-note-taking-app-global-market-report.html ; https://www.gii.tw/report/tbrc1976108-note-taking-app-global-market-report.html
16. Sensor Tower press release, "Boosted by Gen-AI services, consumers spent more money in apps than games for first time," Jan 2026: https://sensortower.com/press/press-release-boosted-by-gen-ai-services-consumers-spent-more-money-in-apps-than-games-for-first-time ; TechCrunch 2026-01-21: https://techcrunch.com/2026/01/21/consumers-spent-more-on-mobile-apps-than-games-in-2025-driven-by-ai-app-adoption
17. Xiaohongshu user claims: Elite Asia (Apr 2026), https://www.eliteasia.co/what-is-xiaohongshu-red-note/ ; MakeInfluence (cites Reuters 2026-06-16, not independently verified), https://www.makeinfluence.com/en/academy/rednote-xiaohongshu-as-an-emerging-channel-for-brand-and-influencer-marketing ; Hashmeta (agency), https://hashmeta.com/my/best-xiaohongshu-agencies-malaysia-2026
18. Raindrop.io pricing: official, https://raindrop.io/pro ; ContextBolt (checked 2026-09-10), https://contextbolt.com/blog/raindrop-pricing/ ; SaaSworthy, https://www.saasworthy.com/product/raindrop-io/pricing
19. Read-later pricing: ReadLess, https://www.readless.app/blog/readwise-reader-pricing-2026 , https://www.readless.app/blog/matter-app-pricing-2026 , https://www.readless.app/compare/best-read-later-apps-2026 ; Asian Efficiency (2026-07-06), https://www.asianefficiency.com/productivity/readwise-reader-review/ ; MakerStack, https://makerstack.co/reviews/matter-review/
20. mymind pricing: Capterra, https://www.capterra.com/p/10015233/mymind/ ; OpenTools (2026-05-29), https://opentools.ai/tools/mymind ; SoftwareSuggest, https://www.softwaresuggest.com/mymind/pricing
21. Install benchmarks: AppBrain developer page (Raindrop.io 100K+ installs), https://www.appbrain.com/dev/Rustem+Mussabekov/ ; Spark by MWM (mymind iOS 210K+ downloads), https://spark.mwm.ai/en/apps/mymind-extend-your-mind/1520332347
22. Rejected as unreliable (not used in calculations): dataford.io interview-practice pages citing "62% of saved posts never revisited" and "18M daily Instagram saves," https://dataford.io/questions/measure-instagram-save-button-success

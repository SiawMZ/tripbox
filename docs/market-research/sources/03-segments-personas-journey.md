# User Research Report: Linkbox (working name)

**Date:** 2026-10-19
**Type:** Exploratory desk research. No primary user data exists yet (the only user is the developer).
**Data sources:** Published surveys, platform statements, news, academic summaries and public forum threads (see Sources, numbered [S1]...).
**Sample size:** 0 interviews. **Everything below about segments and personas is a hypothesis until validated** (see Section 6).

**Confidence key:** **E** = backed by a cited external source. **H** = hypothesis or inference built on that evidence (not a fact).

---

## 1. Executive summary

1. Social apps are now a real discovery and search layer, especially for food, travel and recipes. In a 2022 Milieu Insight survey across six SEA markets, places to eat or drink was the top TikTok search category, and it was the top category for Malaysians [S9][S10]. Google said in 2022 that about 40% of US 18–24s look for lunch spots on TikTok or Instagram rather than Maps or Search [S5]. (E)
2. But the "TikTok replaces Google" story is cooling: Adobe's 2026 survey shows Gen Z who rely more on TikTok than Google fell from 8% to 4%, while 65% of Gen Z have still used TikTok to search [S3]. People search in many places, and that is the core of Linkbox's job: **the things they find end up in many places too** (inference, H).
3. "Save" is a strong, platform-encouraged gesture (Instagram uses saves as a ranking signal, per Mosseri as reported [S6]), but there is little hard data on how often saved posts are revisited. Anecdotes and expert commentary describe heavy saving and rare revisiting, with guilt and overwhelm [S7][S14]. (E for the anecdotes, H for prevalence)
4. Malaysia-specific angle: Xiaohongshu has an unusually large Malaysian base (about 2.5M active users as of early 2023, second-largest market outside mainland China and Taiwan per SCMP) and is used for food, travel and shopping discovery [S11][S12]. No mainstream save-aggregator lists XHS support among its headline platforms (H, based on competitor listings [S15]–[S18]). This is a plausible wedge for a Malaysian developer.
5. Recommended primary segment (H): **"Plan-to-go" savers**, people who save food, café and travel posts in order to act on them later (often with a partner or friends). Their job has a clear moment of truth ("we're in Kota Kinabalu, where was that café?") that Linkbox can win.

---

## 2. Evidence base (what we know vs. what we don't)

| Topic | What the evidence says | Strength |
|---|---|---|
| Social search, Gen Z | 49% of US consumers have used TikTok as a search engine (up from 41% in 2024); 65% of Gen Z have, but only 4% rely on it more than Google [S3]. Older surveys gave higher figures: 51% of Gen Z women prefer TikTok to Google (Her Campus, 2023) [S4]; 67% of US 18–24s use Instagram to search (SOCI) [S2]. | Medium: surveys differ in wording, mostly US |
| Food discovery | ~40% of US 18–24s use TikTok/Instagram to find lunch spots (Google internal survey, 2022) [S5]. 59% of SEA respondents used TikTok to search for places to eat or drink; food was the top category in Malaysia (Milieu Insight, Oct 2022) [S9][S10]. A Perlis café study: TikTok surfaces cafés, Instagram is where people check menus and ambience [S13]. | Medium; Malaysia-specific but older and small |
| Recipes | Adobe's TikTok search survey lists recipes among the top searched categories (secondary reports disagree on the exact %) [S3][S8]. | Low–medium |
| Travel | Expedia: over 60% use social media for travel inspiration (vs 35% in 2023); TUI Musement: TikTok is the top inspiration source for Gen Z travellers (48%) [S19][S20]. | Medium; global |
| Saving as a signal | Mosseri has said likes, saves and send rates are all used; send rates (shares) were framed as most important [S6]. Instagram's Save launched December 2016 [S7]. | Medium (second-hand reports) |
| Revisiting saves | No quantitative study found on how often saved social posts are revisited. Anecdotes: bookmarks that feel like an endless to-do list, rare revisiting, guilt from unwatched saved parenting videos [S7]. HN threads: "bookmarks are where links go to die" style views, pruning rules [S14]. | **Gap:** low; validate |
| Digital hoarding | Pathological digital hoarding reported at 21.5% in a sample of younger Chinese people (reported second-hand) [S7]; validated digital-hoarding scale exists [S21]. | Low for our use (not about social saves) |
| Workarounds | WhatsApp "Message Yourself" (2022) is used for notes and links to read later [S22]; screenshots are a common fallback when platforms block saving (TikTok removed save-to-photos unless the video is shared to your profile, per 9to5Mac) [S23]. | Medium for existence; no prevalence data |
| Sharing collections | Instagram launched collaborative collections in group chats/DMs in March 2023, but only for Instagram posts, and visibility is limited by the author's privacy settings [S24]. | High (feature exists) |
| Malaysian platform reach | Jan 2025: 25.1M social media identities; ad reach TikTok 19.3M (18+), Instagram 15.5M, Facebook 23.1M, YouTube 25.1M [S1]. | High |
| XHS in Malaysia | ~2.5M active users (early 2023) [S11][S12]; ranked 7th among social apps on Google Play in Malaysia (Sept 2025, SimilarWeb via Fulcrum) [S12]; used by Malaysian Chinese for culture, politics, food and travel [S11][S12]. | Medium (old user count) |
| Read-later market | Pocket shut down on 8 July 2025; users moved to Instapaper, Raindrop, Readwise and others [S25]. | High |
| Competitors | Several new "save from any social app" tools exist (Stash, Picki, InstaSave, ARCHV, Feedr, Social Archiver), most iOS-first per their listings; recipe savers such as ReciMe target the recipe slice [S15]–[S18][S26]. | Medium (vendor self-descriptions) |

**Forum voice (Hacker News "Ask HN: How Do You Bookmark?" [S14]), verbatim, short:**
- "I can't keep track of them all" (roland35)
- "something psychologically behind saving links and never reading them" (daf72)
- "it gets overwhelming FAST" (coconuthacker42)

Note: Reddit could not be accessed by the research tools, so Reddit voice is missing. The HN audience is tech-savvy and skews toward browser bookmarks, not social saves. **Gap to fill in interviews.**

---

## 3. Customer segments (behavioral / JTBD-based)

All segments are **hypotheses (H)**, built from the evidence above. Size indicators are proxies, not market sizes.

### Segment A: "Plan-to-go" savers (food, cafés, travel)
- **Who (H):** 18–35, urban Malaysia (KL, Penang, KK), saves food spots, cafés, staycations and trip ideas; often plans with a partner or friends.
- **Size indicator (E):** Food/drink places were the top TikTok search category in SEA and in Malaysia [S9][S10]; Malaysia has 19.3M TikTok and 15.5M Instagram ad-reachable users [S1]; over 60% of travellers use social media for inspiration [S19].
- **JTBD (H):** "When I see a place I'd like to go, I want to keep it with where it is, so that when I'm nearby or planning a weekend I can find it fast and agree with others."
- **Pains (H):** Saves are split across TikTok, IG, XHS and WhatsApp; platform collections aren't searchable by place; posts don't say where they are; can't easily share a mixed-platform list with a partner (Instagram's collaborative collections are IG-only [S24]).
- **Gains (H):** Find by place/area ("KK", "Penang") or vibe; one shareable list for a trip; open back in the original app to see the video.
- **Product fit:** **High.** Share-sheet saving, AI labels, search, "Ask AI" and public folder pages map directly onto this job. Gap: no location field/map yet; AI labels could extract the area or city.
- **Barriers:** Habit of using in-app save; "one more app"; Android-only share intake today; public folder pages need a web URL.
- **Current workarounds (E/H):** In-app saves, collaborative IG collections [S24], WhatsApp to self or group [S22], screenshots [S23], Google Maps saved lists (H).
- **Priority:** **Primary.** Clearest "moment of truth" (when actually going somewhere), viral loop via shared folders.

### Segment B: Cross-platform "RedNote + everything" savers (Malaysian Chinese)
- **Who (H):** Malaysian Chinese, 20–40, reads Chinese, uses XHS heavily alongside IG/TikTok/Threads.
- **Size indicator (E):** ~2.5M XHS users in Malaysia (early 2023) [S11]; XHS ranked 7th among social apps on Google Play Malaysia (Sept 2025) [S12].
- **JTBD (H):** "When I find something useful on XHS (food, beauty, travel, renovation), I want to keep it with my other saves, so I don't have to remember which app it was in."
- **Pains (H):** XHS collections (收藏) live only in XHS; content is often in Chinese while other saves are English/BM; XHS share links are long and messy text blobs.
- **Gains (H):** Clean XHS link handling, bilingual search (query in English, find a Chinese post), AI descriptions that summarise Chinese posts in English.
- **Product fit:** **Medium–high and differentiating.** Competitor listings name IG/TikTok/YouTube/X/Reddit, not XHS [S15]–[S18] (H: needs a full check). Risk: XHS previews may be blocked or login-walled; UI is English only.
- **Barriers:** Language (English UI), trust in a new app, XHS link quality.
- **Priority:** **Secondary, but the most defensible wedge** for a Malaysian developer.

### Segment C: Recipe and home-cook savers
- **Who (H):** 22–45, cooks at home, saves recipe Reels/TikToks.
- **Size indicator (E):** Recipes are among the top TikTok search categories (Adobe; Milieu ranked recipes 3rd in SEA) [S3][S9]; dedicated apps like ReciMe claim large user bases [S26].
- **JTBD (H):** "When I'm deciding what to cook, I want to find that recipe I saved, so I can cook it without rewatching ten videos."
- **Pains (H):** Recipe is spoken in a video, not written; saved posts are not searchable by ingredient.
- **Product fit:** **Medium.** Linkbox stores links and AI descriptions, not structured recipes; recipe-specific apps extract ingredients and steps. Likely to lose head-to-head.
- **Priority:** **Do not target directly**; serve as a side use case through good AI descriptions.

### Segment D: Learners and "saved for later" self-improvers
- **Who (H):** Students and young workers who save study tips, career, finance and productivity posts and threads.
- **Size indicator (E):** Social search use is broad among Gen Z [S2][S3]; digital-hoarding and "never revisit" patterns are described for this group [S7][S14].
- **JTBD (H):** "When I see advice I want to apply, I want to keep it, so I can come back when I need it."
- **Pains (H):** Guilt and overwhelm from a growing backlog [S7]; can't remember who said it.
- **Product fit:** **Medium.** Search and "Ask AI" help; but the real job may be "actually use it", which a library alone doesn't solve. Risk of becoming another graveyard.
- **Priority:** Tertiary; watch for resurfacing/reminder needs.

### Segment E: Displaced read-later / power organisers
- **Who (H):** People who used Pocket/Raindrop/Notion for links, now also saving social posts.
- **Size indicator (E):** Pocket closed in July 2025, pushing users to alternatives [S25].
- **JTBD (H):** "Keep everything I might need in one searchable, exportable place."
- **Product fit:** **Medium.** They want web saving, tags and export; they compare against mature tools (Raindrop).
- **Priority:** Useful as early testers and critics, not as the target.

### Segment summary

| Segment | Size indicator | Primary JTBD | Product fit | Value to Linkbox | Growth |
|---|---|---|---|---|---|
| A. Plan-to-go savers | Food/drink top TikTok search category in MY [S10] | Find saved places when going out or planning a trip | High | Highest (share loop) | High |
| B. RedNote + everything | ~2.5M XHS users in MY [S11] | Keep XHS saves with others | Medium–high, unique | High (differentiation) | High (XHS growth in MY [S12]) |
| C. Recipe savers | Recipes top-3 TikTok search [S9] | Find the recipe to cook tonight | Medium | Low (specialists win) | Medium |
| D. Learners | Broad Gen Z social search [S3] | Apply saved advice later | Medium | Medium | Medium |
| E. Power organisers | Pocket shutdown [S25] | One searchable archive | Medium | Low–medium (feedback) | Low |

**Highest-value segment (H):** A. **Highest-growth and most defensible (H):** B. A and B overlap heavily (a Malaysian Chinese couple planning a Penang trip is both).

---

## 4. Personas (HYPOTHESES until interviews)

> These personas are composites built from published evidence, not from interviews. Names and details are illustrative. Do not quote them as user research.

### Persona 1 (primary): Aina, "the weekend planner" (Segment A)
- **Who:** 27, marketing executive in Kota Kinabalu, Android phone, uses TikTok, Instagram and WhatsApp daily; plans weekend outings and one or two trips a year with her partner and friends.
- **Primary JTBD:** "When I scroll past a café, food spot or trip idea, I want to save it in one place I can search by area, so that when we're deciding where to go, I can pull it up in seconds and share it."
- **Top 3 pains:**
  1. Saves are scattered: TikTok favourites, IG collections, screenshots, links sent to herself on WhatsApp (H, workaround evidence [S22][S23]).
  2. Can't find it at the moment of need: platform saves are not searchable by place (H).
  3. Sharing a mixed list is clumsy: IG collaborative collections only work for IG posts [S24] (E for the limit, H for the pain).
- **Top 3 gains:**
  1. Type "KK brunch" and see the right posts.
  2. One link for "Penang trip" that her partner can open without an account.
  3. Saving takes one tap from the share sheet and never interrupts scrolling.
- **Unexpected insight (E + H):** Discovery and verification happen on different apps. A Perlis study found TikTok surfaces cafés while Instagram is where people check menus and ambience [S13]. **Implication (H):** one place often has saves from two apps, so Linkbox could group "same place, different posts" rather than treating each link alone.
- **Product fit:** High. Gaps: no place/area field, no "near me" or map view; public folder page must look good on a phone.

### Persona 2: Wei Ling, "the RedNote researcher" (Segment B)
- **Who:** 31, Malaysian Chinese, Penang, works in admin; heavy XHS user for food, skincare, home renovation and travel; also IG and Threads. Reads Chinese and English.
- **Primary JTBD:** "When I find a useful RedNote post, I want it saved with everything else, searchable in English or Chinese, so I don't have to remember which app it came from."
- **Top 3 pains:**
  1. XHS saves are locked inside XHS (H).
  2. XHS share text is messy and links can be hard to open outside the app (H; must test).
  3. Mixed-language content makes keyword search unreliable (H).
- **Top 3 gains:**
  1. XHS posts saved cleanly with preview and a short English summary.
  2. Search that works across languages.
  3. Tapping a link opens XHS directly.
- **Unexpected insight (E):** In Malaysia XHS is not only a lifestyle app: young voters used it in GE15 and ministers have opened accounts to reach the Chinese community [S11][S12]. **Implication (H):** XHS is a general information source for this group, so saves may include news and civic content, not only lifestyle.
- **Product fit:** Medium–high and unique if XHS handling is solid. Friction: English-only UI; AI labels are English (fine for search, but check comfort).

### Persona 3: Daniel, "the guilty saver" (Segment D, with some E)
- **Who:** 23, final-year student in Kuala Lumpur, saves study tips, career advice, finance threads and productivity Reels; uses Threads, TikTok, YouTube.
- **Primary JTBD:** "When I see advice I want to use, I want to keep it so I can find it again when I need it, without the pile making me feel behind."
- **Top 3 pains:**
  1. Hundreds of saves, rarely revisited; the pile feels like an unfinished to-do list [S7] (E for the pattern in anecdotes).
  2. Can't remember who said it or which app (H).
  3. Folder systems get overwhelming [S14] (E, forum voice).
- **Top 3 gains:**
  1. Ask a question ("that video about the 50/30/20 budget") and get the right post.
  2. Not having to organise: AI labels do it.
  3. Feeling the saves are "useful" rather than clutter.
- **Unexpected insight (E):** Experts quoted by BOOM/Decode describe saving as giving a sense of ownership and a small reward, not necessarily a plan to return [S7]. **Implication (H):** for some users the save itself is the value; pushing "go back and read it" features may annoy them. Measure whether resurfacing helps or hurts.
- **Product fit:** Medium. "Ask AI" search is the strongest feature; risk that Linkbox becomes another graveyard.

---

## 5. Customer journey map: Aina (primary persona)

| Stage | Touchpoint | User action | Thoughts / questions | Emotion | Pain point | Opportunity |
|---|---|---|---|---|---|---|
| **Awareness** | A friend's shared Linkbox folder page ("KK cafés"); a Threads/TikTok post by the developer | Opens a public folder link from WhatsApp | "Oh, this is neat, all the places in one list" | Curious 🙂 | Doesn't know what Linkbox is from the folder page | Shared folder page shows a small "Make your own list" link (no dark patterns) |
| **Consideration** | Website, Play Store/APK page | Compares with just using IG/TikTok saves, WhatsApp to self | "Is this another app I'll forget? Does it work with TikTok and XHS?" | Skeptical 😐 | APK install (not Play Store) feels unsafe; unclear platform list | Clear "works with" row (TikTok, IG, XHS, FB, Threads, YouTube); Play Store listing when ready |
| **Acquisition** | Sign-up (Google sign-in) | Signs in | "What do they do with my data?" | Cautious 😐 | Sign-in before seeing value | Short privacy line: links only, no social account access |
| **Onboarding** | Share sheet, first save | Shares first TikTok to Linkbox without opening it | "Did it save?" | Unsure → relieved | No confirmation, or slow preview | Clear toast "Saved to Linkbox"; preview and labels appear within seconds |
| **Aha moment** | Search / Ask AI | Types "brunch kk" and sees posts from TikTok and IG together | "That's exactly the one!" | Delighted 😀 | Bad AI labels or missing place names kill it | AI extracts area/city into labels; seed with an import from IG/TikTok data exports |
| **Engagement** | Share sheet daily; folders | Saves 3–10 posts a week; makes a "Penang trip" folder | "This is easier than screenshots" | Satisfied 🙂 | Duplicate saves; posts that fail to preview (login walls) | Duplicate detection (exists); graceful fallback text for blocked previews |
| **Moment of truth** | Opening a link while out | Taps a saved café → opens in TikTok | "Please open the app, not a web page" | Tense → relieved | Opening in browser or a dead link | Reliable deep-link to the original app (core promise) |
| **Retention** | Folders, shared pages | Returns when planning outings | "I keep coming back here" | Content 🙂 | Weeks between needs → forgets app exists | Optional, gentle weekly "you saved 6 places" (test; may annoy, see Persona 3) |
| **Advocacy** | Public folder page | Shares "KK cafés" folder with friends and partner | "You have to see my list" | Proud 😀 | Shared page looks plain or leaks notes (it doesn't; notes are private by design) | Beautiful, fast public page; it is the main growth loop |

**Aha moment (H):** First successful search that returns a post saved from a *different* app than she remembered, at the moment she needs it.

**Moments of truth (H):**
1. First share-sheet save: it must be instant and confirmed.
2. First "where was that place?" search.
3. First tap that opens the original app correctly.
4. First shared folder that a friend opens without signing in.

**Churn triggers (H):**
- Share-sheet save fails or is slow once or twice (trust breaks).
- Previews or AI labels are wrong or empty for TikTok/XHS posts.
- Long gaps between needs, so the habit never forms; she goes back to in-app saves.
- An Android-only app when her partner uses iPhone (sharing still works via web page, which is a mitigation).

**Prioritised improvements (H):**
- **Quick wins:** save confirmation toast; "works with" list; place/area in AI labels; polished mobile public folder page.
- **Biggest impact on retention:** reliability of share-sheet save + open-in-original-app on Android.
- **Deeper investment:** location field / map view; bilingual (EN/中文) search and summaries for XHS; Play Store release.

---

## 6. Validation plan

### 6a. Interview script outline (30 minutes, 6–8 people: 3–4 from Segment A, 2–3 from Segment B, 1–2 from D)

Recruit from friends-of-friends, Compass network, a Threads/XHS post. Ask about past behaviour, not opinions about Linkbox. Show the app only at the end.

1. Walk me through the last time you saved a post on any app. What was it, and why did you save it?
2. Where do you keep things you want to come back to? (Ask them to open their phone and show: IG saved, TikTok favourites, XHS 收藏, screenshots, WhatsApp to self.)
3. Roughly how many saved posts do you think you have? When did you last open one? What for?
4. Tell me about the last time you tried to find something you'd saved. What happened? How long did it take? Did you find it?
5. Which kinds of things do you save most (food, travel, recipes, shopping, advice)? Which ones do you actually go back to?
6. Have you ever shared a set of saved posts with someone (partner, friends, family) to plan something? How did you do it?
7. What have you tried to keep things organised (collections, notes apps, other apps)? Why did you stop?
8. (Segment B) What do you use RedNote for that you don't use other apps for? How do you save or share from it?
9. If saved posts disappeared tomorrow, what would you miss? (Tests real value vs. "sense of ownership" [S7].)
10. (End, show Linkbox) Save one real post with the share sheet and search for it. What did you expect to happen? What would stop you from using this?

**Listen for:** words for the job ("plan", "try", "go"), the moment of need, sharing behaviour, XHS link issues, guilt/overwhelm.

### 6b. Cheap tests a solo developer can run

| Test | How | Cost | Pass signal (set before running) |
|---|---|---|---|
| **1. 3-question survey** (Google Forms, EN + BM + 中文) posted on Threads, XHS, and in 2–3 WhatsApp groups | Q1: Which apps do you save posts on? Q2: When did you last go back to a saved post, and did you find it? Q3: Would you try one place to save from all apps? (+ optional email) | Free, ~1 hour | 100+ responses; check whether "food/places" is the top saved category and whether XHS appears for Chinese-speaking respondents |
| **2. Fake-door folder page** | Make a real public folder, e.g. "KK cafés from TikTok and RedNote", share it; count opens and clicks on "Make your own list" | Free | Click-through rate from page to sign-up; decide threshold upfront (e.g. 5%) |
| **3. Concierge test with 5 users** | Install the APK for 5 people (couples planning a trip are ideal); 2 weeks; check saves per week and searches | Free, time only | 3 of 5 still saving in week 2; at least one "found it" story each |
| **4. XHS link reliability test** | Save 30 real XHS links from different post types; record preview success, AI label quality, open-in-app success | Free, ~2 hours | 90%+ open correctly before targeting Segment B |
| **5. Search-moment diary** | Ask the 5 testers to send a voice note each time they look for a saved post, whether in Linkbox or not | Free | Count of "where was that…" moments per week (tests whether the job is frequent enough) |

**Decisions this informs:** whether to add place/location features (A), invest in XHS + bilingual search (B), add resurfacing/reminders (D), and when a Play Store release is worth it.

### Open questions (not answered by published data)
- How often do people actually revisit saved social posts? (No study found.)
- Do Malaysians save more on TikTok, IG or XHS, and does it vary by language group?
- Is the "save" itself the value for some users (Persona 3), making retention features unwanted?
- How reliable are XHS and TikTok links outside their apps on Android?

---

## Sources

- [S1] DataReportal, Digital 2025: Malaysia. https://datareportal.com/reports/digital-2025-malaysia
- [S2] eMarketer, "Social media overtakes search engines for discovery among Gen Z and millennials" (cites SOCI survey). https://www.emarketer.com/content/search-behavior-being-redefined-thanks-generational-shifts
- [S3] Search Engine Journal, "Gen Z preference for TikTok over Google drops 50%, data shows" (Adobe Express 2026 survey). https://www.searchenginejournal.com/gen-z-preference-for-tiktok-over-google-drops-50-data-shows/568267/
- [S4] Search Engine Land, "Survey: 51% of Gen Z women prefer TikTok, not Google, for search". https://searchengineland.com/gen-z-tiktok-google-search-survey-431345
- [S5] PetaPixel, "Google says young people using Instagram and TikTok to search" (2022); Fortune coverage. https://petapixel.com/2022/07/13/google-says-young-people-using-instagram-and-tiktok-to-search ; https://fortune.com/2022/07/13/google-tiktok-instagram-search-engine-brainstorm-tech/amp
- [S6] t3n and OnlineMarketing.de reporting on Adam Mosseri's statements on likes, saves and send rates. https://t3n.de/news/?p=1671110 ; https://onlinemarketing.de/social-media-marketing/warum-instagram-weiterhin-likes-fokussiert
- [S7] Decode (BOOM), "India's internet generation is overwhelmed by what they save". https://www.decodeinternet.in/amp/decode/indias-internet-generation-is-overwhelmed-by-what-they-save-28974
- [S8] MediaPost, "TikTok: The Gen Z Search Engine" (Adobe 2024 survey coverage). https://www.mediapost.com/publications/article/392663/tiktok-the-gen-z-search-engine.html
- [S9] Statista chart on SEA TikTok search categories (Oct 2022, six countries), as surfaced in search; and Milieu Insight study. https://www.mili.eu/insights/tiktok-the-new-search-engine
- [S10] Marketing-Interactive, "Is TikTok going to be the next king of search in SEA?" (Milieu Insight, Oct 2022). https://www.marketing-interactive.com/is-tiktok-going-to-be-the-next-king-of-search-in-sea
- [S11] South China Morning Post, "Xiaohongshu: Chinese app transforming Malaysia's tourism landscape"; Malay Mail video feature. https://www.scmp.com/week-asia/lifestyle-culture/article/3289725/xiaohongshu-chinese-app-transforming-malaysias-tourism-landscape ; https://www.malaymail.com/news/malaysia/2024/09/24/a-look-at-xiaohongshu-chinas-answer-to-instagram-that-has-chinese-malaysians-glued-to-their-phones-video/151238
- [S12] Fulcrum (ISEAS), "RedNote's success and Beijing's soft power in Southeast Asia". https://fulcrum.sg/rednotes-success-and-beijings-soft-power-in-southeast-asia/
- [S13] USIM Insight Mosaic e-Magazine (Perlis cafés study). https://flip.usim.edu.my/risalahusim/Insight-Mosaic-e-Megazine-First-Edition/25/ ; related: UUM study on TikTok and Gen Z food tourism in Penang https://e-journal.uum.edu.my/index.php/jeth/article/view/29270
- [S14] Hacker News, "Ask HN: How Do You Bookmark?" and related threads. https://news.ycombinator.com/item?id=42648006 ; https://news.ycombinator.com/item?id=11149329
- [S15] Stash: Social Bookmark Manager (listing). https://mwm.ai/apps/stash-save-links-read-later/6761720583
- [S16] Picki – Social Post Saver (App Store). https://apps.apple.com/app/id6758291416
- [S17] InstaSave (Product Hunt). https://www.producthunt.com/p/instasave/instasave-2
- [S18] ARCHV (Product Hunt); Social Archiver; Feedr. https://www.producthunt.com/p/archv ; https://mwm.ai/apps/social-archiver/6758323634 ; https://mwm.ai/apps/feedr-your-feed-usable/6761579793
- [S19] Expedia 2025 Traveler Value Index, via Hotel-Online. https://www.hotel-online.com/index.php/news/from-screen-to-scene-social-media-and-pop-culture-drive-a-new-wave-of-travel-in-2025
- [S20] TUI Group, TUI Musement research on travel and social media. https://www.tuigroup.com/newsroom/news/travel-in-the-age-of-scrolling-tui-musement-research-reveals-4-in-10-travellers-visit-tourist-sites-to-capture-social-media-content
- [S21] Northumbria University, "Digital hoarding behaviours: measurement and evaluation". https://nrl.northumbria.ac.uk/id/eprint/37863
- [S22] TechCrunch, "WhatsApp rolls out a feature that makes it easier to message yourself" (2022). https://techcrunch.com/2022/11/28/whatsapp-rolls-out-a-feature-that-makes-it-easier-to-message-yourself/
- [S23] 9to5Mac, Instagram stories save fix (notes TikTok save-to-library change). https://9to5mac.com/2025/04/18/instagram-stories-save-fix/
- [S24] TechCrunch / PetaPixel, Instagram collaborative collections (March 2023). https://petapixel.com/2023/03/30/you-can-now-save-instagram-posts-into-a-shared-album-with-friends
- [S25] TechCrunch, "Read-it-later app Pocket is shutting down; here are the best alternatives". https://techcrunch.com/2025/05/27/read-it-later-app-pocket-is-shutting-down-here-are-the-best-alternatives
- [S26] ReciMe blog (recipe-saving app). https://www.recime.app/blog/?p=4066

**Caveats on sources:** Several figures come from secondary reports of surveys (Adobe, Milieu, SOCI, Google internal) and differ by wording and year; most social-search data is US-based. No quantitative study on revisiting saved social posts was found. Reddit was not reachable by the research tools. Competitor details are vendor self-descriptions.

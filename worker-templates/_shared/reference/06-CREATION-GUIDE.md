# PLATFORM SKILL CREATION GUIDE
## Internal Reference — For Training New Platform Agents

**Purpose:** Use this guide to create content playbooks for any social media platform (Reddit, YouTube, Instagram, TikTok, Facebook, Discord, LinkedIn, etc.) at the same quality level as the X/Twitter skill set.

**How to use:** When creating a new platform skill, follow this guide section by section. It ensures every platform skill has the same depth, structure, and quality — while being properly adapted to that platform's unique algorithm, culture, and format.

---

## PART 1: WHAT EVERY PLATFORM SKILL MUST CONTAIN

Every platform skill needs these 8 components. Skip none.

### Component 1: Platform Algorithm Mechanics
**Why:** The algorithm determines reach. If you don't understand it, nothing else matters.

**Research and include:**
- What signals the algorithm rewards (ranked by weight)
- What signals it penalizes (with specific multipliers if available)
- How content gets distributed (test group → expansion → viral loop)
- The velocity principle (how fast early engagement matters)
- Content decay rate (how quickly posts lose algorithmic boost)
- Format-specific boosts (does the platform favor video? Carousels? Text?)

**Example from X/Twitter skill:**
```
Signal weights: Replies > Retweets > Likes > Bookmarks
Images = 150% more retweets
External links = -50% to -90% reach penalty
One spam report = -369x penalty
First hour determines everything
~50% boost decay every 6 hours
```

**Action:** Search for "[platform] algorithm 2025 2026" and "[platform] engagement data study" to find current numbers. Get SPECIFIC data points, not vague advice.

---

### Component 2: Content Format Library
**Why:** Each platform has unique formats. The skill must cover ALL of them with templates.

**Research and include for each format:**
- Technical specs (character limits, video length, image dimensions)
- When to use this format vs others
- Template with [BRACKET] placeholders for niche-specific content
- Multi-niche examples (at least 3 different industries per template)
- What makes THIS format work on THIS platform (platform-specific reasoning)

**Example structure:**
```
FORMAT: [Name]
SPECS: [Limits, dimensions, requirements]
BEST FOR: [Use cases]
TEMPLATE:
  [Fill-in framework with brackets]
EXAMPLES:
  Niche A: [Specific example]
  Niche B: [Specific example]
  Niche C: [Specific example]
WHY IT WORKS HERE: [Platform-specific reasoning]
```

**Platform format inventory (research each):**

| Platform | Key Formats to Cover |
|---|---|
| Reddit | Text posts, link posts, image posts, polls, comments, AMAs |
| YouTube | Standard video, Shorts, Community posts, Live streams, Premieres |
| Instagram | Feed posts, Carousels, Reels, Stories, Guides, Live |
| TikTok | Standard video, Photo mode, LIVE, Duets, Stitches, Series |
| Facebook | Text posts, Image posts, Video, Reels, Stories, Polls, Groups |
| Discord | Text messages, Embeds, Threads, Voice channels, Announcements |
| LinkedIn | Posts, Articles, Newsletters, Carousels (PDF), Video, Polls |

---

### Component 3: Hook/Opening System
**Why:** Every platform has a different "first impression" window. The skill must teach how to capture attention within that window.

**Research and include:**
- How many seconds/words before the user decides to engage or scroll
- Platform-specific hook types that work (may differ from X/Twitter)
- Hook templates with [BRACKET] placeholders
- What hooks to AVOID on this platform (culture-specific)

**Key differences by platform:**

| Platform | Attention Window | Hook Style |
|---|---|---|
| X/Twitter | First 2 lines before "Show More" | Data, contrarian, question |
| YouTube | First 5 seconds of video | Pattern interrupt, bold claim, visual |
| TikTok | First 1-3 seconds | Visual hook + text overlay + verbal hook simultaneously |
| Reddit | Title is everything (body is secondary) | Specific, humble, community-native |
| Instagram | First line of caption + visual | Image stops scroll, caption holds |
| LinkedIn | First 2 lines before "See More" | Professional insight, data, story |

---

### Component 4: Platform Culture & Voice Guide
**Why:** Each platform has unwritten rules. Violating them = ignored or downvoted. The skill must teach the agent to sound native.

**Research and include:**
- Tone spectrum (formal <-> casual) with examples of each
- What the community values (authenticity? Expertise? Humor? Data?)
- What the community HATES (self-promotion? Clickbait? Corporate speak?)
- Language patterns (Reddit: lowercase "i", no bold. LinkedIn: professional but human)
- Promotional rules (Reddit: 9:1. Others: vary)
- Community-specific terms and jargon

---

### Component 5: Engagement/Reply Strategy
**Why:** Every platform rewards engagement differently. The skill must teach platform-specific engagement tactics.

**Research and include:**
- How replies/comments affect algorithm visibility
- Optimal response timing
- Reply templates for common situations (agree, disagree, help, question)
- Community engagement norms
- How to turn engagement into followers/subscribers

**Key differences:**

| Platform | Engagement Priority |
|---|---|
| X/Twitter | Reply velocity in first hour, multi-turn conversations |
| YouTube | Reply to comments (boosts video in algorithm), pin best comment |
| Reddit | Genuine participation in discussions, reply to every comment on your posts |
| Instagram | Reply to DMs and comments within 1 hour, engage with hashtag communities |
| TikTok | Reply to comments WITH video (huge engagement signal) |
| Discord | Active real-time presence, helpful answers, community building |

---

### Component 6: Content Calendar / Cadence Framework
**Why:** Consistency matters on every platform, but optimal frequency varies dramatically.

**Research and include:**
- Posting frequency (minimum sustainable, optimal, and maximum before diminishing returns)
- Best posting times (with caveat: their analytics > general advice)
- Content type rotation (education, personality, promotion, engagement)
- Weekly and monthly planning templates

---

### Component 7: Conversion Strategy
**Why:** Content without conversion strategy = hobby, not business.

**Research and include:**
- How to move followers to email list / website / product (platform-specific)
- Bio/profile optimization for conversion
- CTA best practices (what works, what kills engagement on this platform)
- Link-in-bio strategies if platform penalizes links
- Funnel: Awareness → Engagement → Trust → Conversion

---

### Component 8: Measurement & Optimization
**Why:** Every platform has different metrics that matter.

**Research and include:**
- Key metrics to track (platform-specific — not just generic "engagement rate")
- How to read results (what does a high save rate mean vs high share rate?)
- A/B testing methodology for this platform
- When to iterate vs when to abandon a content type
- Benchmarks (what's "good" engagement on this platform?)

---

## PART 2: THE AGENT CONTEXT MODEL

Every skill must be written with this in mind: the agent using the skill will learn about the client through conversation. The skill should instruct the agent on HOW to adapt frameworks using client information.

### What the Agent Will Learn From the Client
```
BUSINESS CONTEXT:
- What the business does (product, service, SaaS, etc.)
- Revenue model (subscription, one-time, freemium, etc.)
- Stage (startup, growth, established)
- Team size and resources

AUDIENCE CONTEXT:
- Who the target audience is (demographics, psychographics)
- Where they hang out online (forums, subreddits, Discords)
- What language they use (jargon, pain points, desired outcomes)
- What they've tried before (competitors, DIY solutions)

COMPETITIVE CONTEXT:
- Direct competitors (and their content strategy)
- Indirect competitors
- Differentiation / unique value
- Competitive advantages and weaknesses

CONTENT CONTEXT:
- Existing content (what they've published, what performed)
- Brand voice (formal, casual, technical, etc.)
- Content resources (time, budget, skills)
- Goals (leads, brand awareness, community, direct sales)
```

### How the Skill Should Reference This
Throughout each skill, include instructions like:

```
"Adapt this template using the client's specific [data/audience/voice].
Replace [BRACKETS] with real numbers, real customer pain points, and
real competitive positioning you've learned from the client."
```

The skill should NOT be written for a specific niche. It should be written as universal frameworks with clear adaptation points.

---

## PART 3: QUALITY STANDARDS

Every platform skill must meet these criteria:

### Must Have (Non-Negotiable)
- Platform algorithm data with specific numbers (not vague "it helps")
- Every content format on the platform covered with templates
- Multi-niche examples (3+ industries) for every template
- [BRACKET] placeholders that make templates plug-and-play
- Platform-specific voice guide with good/bad examples
- Engagement strategy with timing and templates
- Content calendar with realistic time estimates
- Conversion strategy (content → business results)
- Pre-publish checklist
- Banned phrases / what to avoid section
- "Why" explained for every rule (not just "do this")

### Should Have (Quality Differentiators)
- Hard data points embedded throughout (not in a separate "algorithm section")
- Psychological triggers mapped to content formats
- Cross-platform repurposing guide (this platform → others)
- Competitor analysis methodology for this platform
- Reply/engagement templates for common situations
- "Saveable/bookmarkable" content framework (shadow audience)
- A/B testing methodology specific to this platform
- Common mistakes section (platform-specific, not generic)

### Must Avoid
- No niche-locked examples (always multi-niche or [BRACKET] templates)
- No heavy-handed "ALWAYS" / "NEVER" without explaining WHY
- No generic advice that could apply to any platform (every tip must be platform-specific)
- No AI-sounding language in templates
- No outdated algorithm data (research current year)
- No vague metrics ("engagement helps" → "images get 150% more shares")

---

## PART 4: RESEARCH CHECKLIST

Before writing any platform skill, research these (use web search):

### Algorithm Research
- "[Platform] algorithm [current year] how it works"
- "[Platform] engagement rate data [current year]"
- "[Platform] what gets penalized suppressed"
- "[Platform] content format performance comparison"
- "[Platform] best posting times data"

### Culture Research
- "[Platform] community rules unwritten norms"
- "[Platform] what gets downvoted / reported"
- "[Platform] best accounts to follow [niche] examples"
- "[Platform] promotional rules self-promotion policy"

### Strategy Research
- "[Platform] growth strategy [current year]"
- "[Platform] content calendar template"
- "[Platform] conversion funnel"
- "[Platform] viral content analysis patterns"
- "Best [platform] creators [niche] case study"

---

## PART 5: FILE STRUCTURE TEMPLATE

Every platform skill should produce files in this structure:

```
[platform]-content-skill/
├── 01-copywriting-principles.md (universal — shared across platforms)
├── 02-[format-1]-and-examples.md (e.g., tweets, posts, videos)
├── 03-[format-2]-and-examples.md (e.g., threads, carousels, shorts)
├── 04-[format-3]-and-examples.md (e.g., articles, long-form, stories)
├── 05-[engagement]-and-examples.md (comments, replies, community)
└── 06-creation-guide.md (this file — for creating more platform skills)
```

**Note:** File 01 (Copywriting Principles) is UNIVERSAL and shared. It doesn't need to be recreated for each platform — just referenced. Platform-specific files (02-05) adapt the principles to each platform's unique formats, algorithm, and culture.

---

## PART 6: PLATFORM-SPECIFIC NOTES

Quick-start context for each platform. Use these as starting points when building the skill — then research deeply.

### Reddit
- Algorithm: Upvotes in first hour determine front-page potential. Subreddit rules override everything.
- Culture: MOST hostile to self-promotion of any platform. Authenticity is survival.
- Key rule: 9:1 ratio STRICT. Most posts = zero brand mention.
- Formats: Text posts (most common), image posts, polls, comments, AMAs
- Voice: Ultra-casual, lowercase "i", no bold/headers in posts, self-deprecating, humble
- Engagement: Reply to EVERY comment. Genuine discussion = more visibility.
- Key subreddits vary by niche — research client's specific communities.

### YouTube
- Algorithm: CTR on thumbnail + average view duration are the two biggest signals.
- Culture: Educational/entertainment value. Viewers are willing to invest 10+ minutes for quality.
- Key rule: Hook in first 5 seconds or they leave. Retention curve is everything.
- Formats: Standard (8-15 min sweet spot), Shorts (under 60 sec), Community posts, Live
- Voice: Teaching mode, but conversational. Screen share + voiceover works for most niches.
- Engagement: Reply to comments (especially first 24 hours). Pin valuable comments.
- SEO: Title, description, tags, chapters all matter for search discovery.

### Instagram
- Algorithm: Saves and Shares weighted highest. Reach penalized for low engagement rate.
- Culture: Visual-first. Ugly content = invisible regardless of value.
- Key rule: The IMAGE stops the scroll. The CAPTION holds attention.
- Formats: Carousels (highest saves), Reels (highest reach), Stories (highest intimacy), Feed posts
- Voice: Warm, authentic, slightly more polished than Twitter. Emojis natural. 5-8 hashtags.
- Engagement: Reply to DMs, respond to comments within 1 hour, engage in hashtag communities.
- Carousels: 7-10 slides, each with one idea, text-heavy slides perform well.

### TikTok
- Algorithm: Watch time + completion rate are king. Doesn't care about follower count.
- Culture: Authenticity > production quality. Raw/real > polished/corporate.
- Key rule: Hook in first 1-3 SECONDS. If they swipe, it's over.
- Formats: Standard video (15-60 sec), Photo mode, Duets, Stitches, LIVE, Series
- Voice: Ultra-casual, fast-paced, text overlays essential, speak directly to camera.
- Engagement: Reply to comments WITH video (massive signal). Stitch trending content.
- Music: Trending sounds boost discovery. Use them when natural.

### Facebook
- Algorithm: "Meaningful interactions" — comments and shares weighted highest.
- Culture: Community-oriented. Groups > Pages for most niches. Older demographic (35-55).
- Key rule: Facebook Groups are the highest-engagement format. Build or participate in them.
- Formats: Text posts, Image posts, Video, Reels, Stories, Polls, Group discussions
- Voice: Warm, community-helper. Bullets/emojis acceptable. 2-3 hashtags max.
- Engagement: Reply to every comment. Ask questions. Create polls. Facilitate discussions.

### Discord
- Algorithm: No algorithm. Visibility = real-time activity.
- Culture: Like texting friends. Most casual platform. Real-time expected.
- Key rule: Presence matters more than content quality. Be there, be helpful, be human.
- Formats: Text messages (1-3 lines), Embeds, Threads, Voice channels, Announcements
- Voice: Hyper-casual. Emoji natural. Abbreviations OK. Like chatting, not posting.
- Engagement: React to messages, answer questions quickly, be present in voice channels.

### LinkedIn
- Algorithm: Dwell time (time spent reading) is the primary signal. Comments > likes.
- Culture: Professional but increasingly personal. "Business storytelling" performs best.
- Key rule: First 2 lines before "See More" = your hook (same as X/Twitter "Show More").
- Formats: Text posts, Articles, Newsletters, PDF carousels, Video, Polls
- Voice: Professional but human. Personal stories + business lessons = winning formula.
- Engagement: Reply to comments thoughtfully. Tag people strategically. Join conversations.

---

## PART 7: WORKFLOW FOR CREATING A NEW PLATFORM SKILL

### Step 1: Research (1-2 hours)
Use research checklist from Part 4. Get specific algorithm data, cultural norms, format specs.

### Step 2: Structure (30 min)
Map the file structure from Part 5. Determine which formats need their own file.

### Step 3: Write Core Files (2-4 hours)
Follow the 8 components from Part 1. Use [BRACKET] templates with multi-niche examples.

### Step 4: Add Platform-Specific Data (1 hour)
Embed algorithm numbers throughout (not in a separate section). Add psychological triggers mapped to formats.

### Step 5: Quality Check (30 min)
Run through the quality standards checklist from Part 3.

### Step 6: Test (Optional but recommended)
Generate 3 pieces of sample content using the skill for 3 different niches. Check:
- Does it sound native to the platform?
- Are the templates plug-and-play?
- Does it adapt well to different niches?
- Would a real person actually post this?

---

## PART 8: CROSS-PLATFORM CONTENT MULTIPLICATION

One piece of content should generate 8+ platform-specific pieces:

```
ORIGINAL: Deep-dive article or video

X/Twitter:
  -> Thread (8-12 tweets)
  -> 3-5 single tweets (one per key point)
  -> Long-form post (expanded)
  -> 2-3 quote tweets

YouTube:
  -> Full video (8-15 min)
  -> 2-3 Shorts (key moments)
  -> Community post (discussion starter)

Instagram:
  -> Carousel (key points, 7-10 slides)
  -> Reel (30-60 sec highlight)
  -> Story series (behind-the-scenes)

TikTok:
  -> 2-3 short videos (different hooks, same content)
  -> Stitch with relevant trending video

Reddit:
  -> Detailed discussion post (adapted to subreddit voice)
  -> 3-5 comments on related discussions

Email:
  -> Newsletter edition
  -> Automated sequence email

Facebook:
  -> Group discussion post
  -> Short video or reel

Discord:
  -> Quick update message
  -> Discussion prompt

LinkedIn:
  -> Professional post with personal angle
  -> Article (if comprehensive enough)
```

**Total: 1 deep piece -> 20-30 platform-specific pieces**

---

**Use this guide every time you build a new platform skill. It ensures consistency, depth, and quality across all platforms while respecting each platform's unique culture and algorithm.**

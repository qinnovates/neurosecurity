# Blog Post Template for ONI Framework

## Usage Instructions

Use this template for all blog posts in the ONI Framework series. This format is optimized for web readability, engagement, and maximum audience reach. Posts originally published on Medium should include the original Medium URL in the front matter.

---

## Template Structure

```markdown
---
title: "[Compelling Title - Use Questions or Bold Statements]"
subtitle: "[Expand the hook - make readers curious]"
date_posted: [Publication date in RFC 2822 format, e.g., Fri, 16 Jan 2026 23:37:28 GMT]
original_url: [Original Medium URL if applicable]
tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
---

# [Title]

### *[Subtitle - italicized, expand on the hook]*

<!-- IMAGE_PLACEHOLDER
Generate a compelling featured image for this article using the following prompt:

[Style]: Photorealistic / Digital Art / Abstract (choose one)
[Subject]: Primary visual element that represents the article's core theme
[Mood]: Emotional tone (e.g., hopeful, dramatic, contemplative, urgent)
[Colors]: Dominant color palette that evokes the intended feeling
[Composition]: Key visual arrangement (e.g., centered subject, rule of thirds, wide landscape)
[Context]: Any specific elements that tie to the article's narrative

Example prompt: "A photorealistic image of elderly hands gently holding a glowing neural network hologram, warm amber lighting, hopeful and contemplative mood, shallow depth of field, medical-technology aesthetic"
-->
![Alt text describing the image for accessibility](image-url)
*Caption: Brief, evocative description that adds narrative context*

---

[Opening hook - 1-3 sentences that grab attention. Use a bold statement, surprising fact, personal story, or thought-provoking question. This is your ONE chance to stop the scroll.]

• • •

## [Section 1: The Problem or Context]

[Set up the problem. Make it relatable. Use concrete examples.]

[Short paragraphs - 2-3 sentences max for web readability.]

## [Section 2: The Key Insight]

[Introduce your main idea or framework. This is the "aha" moment.]

> [Pull quote or key takeaway - use blockquotes sparingly for emphasis]

## [Section 3: How It Works]

[Explain the mechanics. Use analogies to familiar concepts.]

**Key Point:** [Bold key terms or concepts]

- Bullet points for lists
- Keep them scannable
- 3-5 items ideal

## [Section 4: Implications/Applications]

[What does this mean for the reader? Why should they care?]

## [Section 5: Call to Action or Forward Look]

[End with momentum. What's next? What should the reader do or think about?]

• • •

[Optional: Brief bio or link to more resources]
```

---

## Featured Image Guidelines

**CRITICAL:** Every Medium post MUST have a featured image immediately below the subtitle.

### Image Requirements
- **Placement:** Directly under the italicized subtitle, before the opening hook
- **Purpose:** Stop the scroll, create emotional connection, hint at the story
- **Format:** `![Alt text](URL)` followed by `*Caption*`

### Image Selection Strategy
| Goal | Image Type | Example |
|------|-----------|---------|
| Evoke emotion | Human-centered | Person with technology, expressive faces |
| Establish authority | Technical visualization | Brain scans, data visualizations, diagrams |
| Create intrigue | Abstract/metaphorical | Neural networks, mysterious imagery |
| Build trust | Documentary style | Real-world applications, authentic moments |

### Placeholder Format
When drafting, use this HTML comment block to guide AI image generation:

```markdown
<!-- IMAGE_PLACEHOLDER
Generate a compelling featured image for this article using the following prompt:

[Style]: Photorealistic / Digital Art / Abstract / Cinematic / Editorial
[Subject]: Primary visual element representing the article's core theme
[Mood]: Emotional tone (hopeful, dramatic, contemplative, urgent, mysterious)
[Colors]: Dominant color palette (warm amber, cool blue, high contrast, muted tones)
[Composition]: Visual arrangement (centered, rule of thirds, wide landscape, close-up)
[Context]: Specific narrative elements to include

Full prompt: "[Write a complete, detailed prompt for AI image generation here]"
-->
![Alt text for accessibility](image-url)
*Caption: [Evocative caption that adds narrative value]*
```

**Example:**
```markdown
<!-- IMAGE_PLACEHOLDER
[Style]: Photorealistic with subtle digital elements
[Subject]: Elderly woman in meditation pose with neural visualization
[Mood]: Peaceful yet bittersweet, hopeful
[Colors]: Warm golden hour lighting, soft purple neural accents
[Composition]: Medium shot, subject centered, bokeh background
[Context]: Alzheimer's article about memory and technology

Full prompt: "Photorealistic portrait of an elderly Asian woman with closed eyes in peaceful meditation, soft golden sunset lighting from window, subtle translucent holographic neural network patterns floating around her head in soft purple and blue, warm and hopeful mood, shallow depth of field, cinematic composition, 4K quality"
-->
![Elderly woman meditating with neural visualization overlay](image-url)
*Caption: Some memories live deeper than disease can reach*
```

---

## ASCII Tables for Medium

**IMPORTANT:** Medium does NOT render markdown tables. Convert ALL tables to ASCII code blocks.

### Before (Markdown - DON'T USE)
```
| Parameter | Value | Description |
|-----------|-------|-------------|
| Threshold | 0.7   | Detection sensitivity |
```

### After (ASCII - USE THIS)
```
┌─────────────┬───────┬─────────────────────────┐
│ Parameter   │ Value │ Description             │
├─────────────┼───────┼─────────────────────────┤
│ Threshold   │ 0.7   │ Detection sensitivity   │
│ Latency     │ 50ms  │ Response time           │
│ Accuracy    │ 94.2% │ Validation rate         │
└─────────────┴───────┴─────────────────────────┘
```

### ASCII Table Characters
```
Corners:  ┌ ┐ └ ┘
Edges:    ─ │
T-joints: ┬ ┴ ├ ┤
Cross:    ┼
```

### Simple Alternative (for quick tables)
```
Parameter     | Value  | Description
------------- | ------ | ---------------------
Threshold     | 0.7    | Detection sensitivity
Latency       | 50ms   | Response time
Accuracy      | 94.2%  | Validation rate
```

---

## Storyboarding & Hooks

### The Hook Formula

Your opening must accomplish THREE things in the first 2-3 sentences:
1. **STOP** the scroll (surprise, shock, or intrigue)
2. **CONNECT** to universal human experience
3. **PROMISE** value (what will the reader gain?)

### Hook Patterns That Work

**The Personal Story Hook:**
> "She forgot how to swallow. But she never forgot how to pray. When I watched my grandmother fade into Alzheimer's, I became obsessed with one question..."

**The Shocking Statistic:**
> "Every 65 seconds, someone in America develops Alzheimer's. By the time you finish this article, 15 more people will begin forgetting who they are."

**The Provocative Question:**
> "What if the same technology Elon Musk wants to put in your brain could be hacked like your iPhone?"

**The Counterintuitive Statement:**
> "The most dangerous cyberattack in history won't steal your data. It will steal your thoughts."

**The Future Scenario:**
> "It's 2035. Your neural implant just received an update. But it wasn't from Neuralink."

### Story Arc Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     THE STORY ARC                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  HOOK ──▶ CONTEXT ──▶ INSIGHT ──▶ EVIDENCE ──▶ IMPLICATIONS    │
│   │         │           │           │              │            │
│   │         │           │           │              │            │
│   ▼         ▼           ▼           ▼              ▼            │
│  "Stop    "Here's     "Here's    "Here's       "Here's        │
│   the      why it      what I     proof"        what it        │
│   scroll"  matters"    discovered"              means for YOU" │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Emotional Beats

Map your reader's emotional journey:

```
Section 1: CURIOSITY    → "Wait, what?"
Section 2: CONCERN      → "Oh no, this is real"
Section 3: ENLIGHTENMENT→ "Aha! I understand"
Section 4: EMPOWERMENT  → "I can do something about this"
Section 5: MOMENTUM     → "I need to share this / learn more"
```

---

## Publishing Best Practices

### Pre-Publication Checklist

**Content Quality:**
- [ ] Title is < 60 characters (optimal for SEO and social sharing)
- [ ] Subtitle expands on title without repeating it
- [ ] Featured image is compelling and relevant
- [ ] Opening hook stops the scroll in 2 sentences
- [ ] Every section has a clear purpose and payoff
- [ ] Complex ideas have analogies to familiar concepts
- [ ] At least ONE memorable quote/statistic/insight
- [ ] Call to action is specific and actionable

**Formatting:**
- [ ] Paragraphs are 2-3 sentences maximum
- [ ] Headers break content every 150-250 words
- [ ] ALL tables converted to ASCII code blocks
- [ ] Blockquotes used sparingly (1-2 per article)
- [ ] Bullet lists are scannable (3-5 items)
- [ ] White space (`• • •` or `---`) creates breathing room

**SEO & Discovery:**
- [ ] Title includes primary keyword naturally
- [ ] 5 tags selected (mix of broad + niche)
- [ ] First 150 characters hook readers (this becomes preview)
- [ ] Internal links to related content where relevant

### Optimal Timing

```
Best Publishing Windows:
┌──────────────┬─────────────────────────────────────┐
│ Day          │ Best Time (EST)                     │
├──────────────┼─────────────────────────────────────┤
│ Tuesday      │ 10:00 AM - 11:00 AM                 │
│ Wednesday    │ 10:00 AM - 11:00 AM                 │
│ Thursday     │ 10:00 AM - 11:00 AM                 │
│ Saturday     │ 9:00 AM - 10:00 AM (B2C content)    │
└──────────────┴─────────────────────────────────────┘
```

### Post-Publication Actions

1. **First 4 Hours:** Respond to EVERY comment
2. **Share Strategy:** LinkedIn first, Twitter second, niche communities third
3. **Cross-Post:** Republish to personal blog with canonical link
4. **Engage:** Find related articles and leave thoughtful comments

---

## Writing Guidelines

### Tone
- **Conversational but authoritative**
- Write like you're explaining to a smart friend over coffee
- Use "you" and "we" to create connection
- Avoid jargon without explanation
- Show personality—readers follow writers, not topics

### Structure
- **Short paragraphs:** 2-3 sentences max
- **Frequent headers:** Every 150-250 words
- **White space:** Use `• • •` or `---` for section breaks
- **Scannable:** Readers should get the gist by skimming headers

### Power Words That Drive Engagement

```
Curiosity:   secret, hidden, revealed, truth, discover
Urgency:     now, before, deadline, limited, critical
Emotion:     heartbreaking, stunning, terrifying, inspiring
Authority:   proven, research, study, data, evidence
Exclusivity: insider, first, only, exclusive, breakthrough
```

### Length
- **Target:** 1,500-4,000 words (5-15 minute read)
- **Sweet spot:** 2,000-2,500 words (7-8 minute read)
- **Rule:** Every word must earn its place

### Tags Strategy
Choose 5 tags that balance:
- **2 Broad tags:** High traffic (e.g., `neuroscience`, `technology`)
- **2 Niche tags:** Targeted audience (e.g., `neuralink`, `brain-computer-interface`)
- **1 Angle tag:** Your unique spin (e.g., `cybersecurity`, `future`)

---

## Example Front Matter

```yaml
---
title: "Your Brain Has a Spam Filter. Can We Reverse-Engineer It?"
subtitle: "What neuroscience reveals about biological threat detection—and what hackers might exploit"
date_posted: Fri, 16 Jan 2026 23:37:28 GMT
url: https://medium.com/@qikevinl/your-brain-has-a-spam-filter-799da714238e
tags: ['neuroscience', 'cybersecurity', 'neuralink', 'brain-computer-interface', 'ai']
---
```

---

## Footer Format

At the end of each blog post, include:

```markdown
**Sub-Tags:** #Tag1 #Tag2 #Tag3 #Tag4 #Tag5

---

**Related Articles:**
- [Article Title 1](link-to-article-1)
- [Article Title 2](link-to-article-2)
- [Article Title 3](link-to-article-3)

---

*Follow my work and research. Collaborate and contribute on [GitHub](https://github.com/qinnovates/mindloft/).*

*Originally published on [Medium](URL) on [Month Day, Year] at [HH:MM:SS GMT]*
```

**Notes:**
- Use `Sub-Tags:` (not `Tags:`) for the hashtag line at the bottom of posts.
- **Related Articles** section is REQUIRED - link to 2-5 other ONI Framework publications that connect to this topic.

---

## Final Checklist

Before publishing:

- [ ] Title is compelling (question or bold statement, < 60 chars)
- [ ] Subtitle expands the hook
- [ ] Featured image placed below subtitle with caption
- [ ] Opening hook grabs attention in first 2 sentences
- [ ] Story arc is clear (Hook → Context → Insight → Evidence → Implications)
- [ ] Paragraphs are short (2-3 sentences)
- [ ] Headers break up content every 150-250 words
- [ ] ALL tables converted to ASCII code blocks
- [ ] At least one pull quote or blockquote
- [ ] Analogies make complex ideas accessible
- [ ] Call to action or forward look at the end
- [ ] 5 relevant tags selected (2 broad, 2 niche, 1 angle)
- [ ] Front matter complete (title, subtitle, date_posted, original_url, tags)
- [ ] Footer complete (Sub-Tags, Related Articles, GitHub link, Originally published)
- [ ] **Related Articles section included** (2-5 linked ONI publications)

---

*Template Version: 2.1*
*Last Updated: January 2026*
*Series: ONI Framework Publications*

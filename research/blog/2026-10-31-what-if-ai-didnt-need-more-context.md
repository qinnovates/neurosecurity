---
title: "What If AI Didn't Need More Context?"
subtitle: "A note I wrote late at night, a video, and an open question about memory you can verify."
date_posted: "2026-10-31"
status: "published"
sources:
  - "https://arxiv.org/abs/2510.05381"
  - "https://aclanthology.org/2024.tacl-1.9/"
  - "https://www.rfc-editor.org/rfc/rfc9162.html"
  - "https://arxiv.org/abs/2402.09727"
  - "https://arxiv.org/abs/2401.18059"
  - "https://arxiv.org/abs/2404.16130"
  - "https://arxiv.org/abs/2512.24601"
  - "https://arxiv.org/abs/1603.09320"
  - "https://arxiv.org/abs/2403.12968"
  - "https://arxiv.org/abs/2310.04408"
  - "https://arxiv.org/html/2504.06135v1"
  - "https://arxiv.org/abs/2610.15095"
tags: ["#AI", "#LLM", "#Provenance", "#Research", "#Video"]
author: "Kevin Qi"
fact_checked: true
fact_check_date: "2026-10-31"
---

**TL;DR:** Giving a model more text doesn't guarantee it can use that text. I've been exploring one idea for this, a reverse Merkle tree, and I made a 4:30 video that explains the problem, the approaches researchers are trying, and why mine is still an untested hypothesis. If you can break it, please do.

[![What If AI Didn't Need More Context? Watch on YouTube](/videos/what-if-ai-didnt-need-more-context-poster.jpg)](https://youtu.be/bJLy4woifNc)

**[Watch the video on YouTube](https://youtu.be/bJLy4woifNc)**

## How I got here

It started with a note I wrote while I was thinking:

> Ah here we go. I love researching things that keep me up at night…
>
> What I'm visualizing is called a "Content-Addressed Semantic Directed Acyclic Graph (DAG)."
>
> Reverse Merkle Trees = DAG + Query Aware compression + HNSW + a source pointer? Hmm.

I spend my time on security, so Merkle trees were already in my head. They let you prove a record belongs to a dataset without re-reading the dataset. LLMs have the opposite strength: they work with meaning, and they can't prove anything about where that meaning came from.

So I asked what happens if you keep the shape and change what the nodes hold.

## The problem is stranger than a size limit

The usual story is that context windows are too small. The research points somewhere else. In [Lost in the Middle](https://aclanthology.org/2024.tacl-1.9/), models did best when the answer sat at the start or end of the input, and worse in the middle.

Then [Du et al.](https://arxiv.org/abs/2510.05381) gave models perfect evidence and made the input longer. Across five models, on certain tasks, accuracy fell by 13.9% to 85%. For Llama-3 and Mistral it still fell when the filler was whitespace or masked out entirely. It wasn't universal: Gemini improved on one task at 30K tokens. But distraction alone doesn't explain it.

## My idea is one bet among several

Here are the families the video walks through:

- **Flat search** ranks every chunk.
- **Gists:** [ReadAgent](https://arxiv.org/abs/2402.09727) compresses pages to short memories and looks up the original when needed.
- **Trees:** [RAPTOR](https://arxiv.org/abs/2401.18059) recursively summarizes clusters.
- **Graphs:** [GraphRAG](https://arxiv.org/abs/2404.16130) extracts entities and summarizes communities.
- **Recursion:** [Recursive Language Models](https://arxiv.org/abs/2512.24601) treat the prompt as an environment to explore in code.

My version asks that each summary keep a path back to its source, checked against a Merkle commitment. [SHIMI](https://arxiv.org/html/2504.06135v1) already combines a semantic hierarchy with Merkle-DAG summaries for sync, so the parts aren't new. I haven't found work that combines them this way, but I've only done a limited search.

## Where it might be wrong

Two problems are built into the video on purpose.

**A false summary hashes perfectly.** A hash proves the bytes didn't change. It says nothing about whether the meaning survived. That needs separate checks, and they are the hard part. I made the same point about neural data in [Encrypted Is Not the Same as Verified](/research/papers/2026-10-31-encrypted-is-not-the-same-as-verified/).

**Top-down routing may not help.** RAPTOR compared walking its tree with searching every node at once, and on 20 QASPER stories the flat search consistently did better. My design routes top-down. I don't know yet whether that survives testing.

There are no benchmarks for this architecture, because I haven't run any.

## What changed while I was making this

[Swarm Telepathy](https://arxiv.org/abs/2610.15095) appeared this month. Instead of agents exchanging text, it translates one model's KV-cache for a model from another family. Combined with cache compaction, it reports a mean of 40% higher accuracy and 4× faster wall-clock time than text-to-text on its evaluated setups. The authors note the cache may carry information beyond the text, and leave auditability as future work.

That's where provenance gets interesting to me. If agents share state nobody can read, what can you verify about it? Hashing a cache proves it arrived unchanged. It doesn't prove it's faithful, or safe. My first experiment there would be small: does an instruction hidden in a sender's context survive transfer when it never appears in the visible text? That's a question, not a result.

## Try to break it

1. Hash a sentence, change one letter, and compare. Then rebuild the RFC 9162 seven-leaf tree and verify the proof for `d3` by hand.
2. Hide one fact at the start, middle and end of a long prompt. Repeat it 20 times. Do you get a U?
3. Find a sentence where deleting one word flips its meaning. Run it through a summarizer and see what happens.
4. Build a small summary tree over your notes. Compare walking it with searching every node.
5. Tell me how you'd catch a wrong summary with a valid hash.

If you want the wider picture first, the earlier film [What Does It Actually Take to Build Intelligence?](/research/papers/2026-10-31-what-does-it-take-to-build-intelligence/) maps where this problem sits.

## About the video

Diagrams are Manim and three.js, redrawn from the source papers and RFC 9162. Hashes are real SHA-256. The vector scene uses real sentences embedded with all-MiniLM-L6-v2 and projected by PCA, which keeps 39% of the variance. Token keep-or-discard choices and some chart values are illustrative or approximate, and they're labelled on screen. The narration is an AI voice (Kokoro).


---
*Written with AI assistance (Claude). Script, code and diagrams were also produced with Claude. Claims checked against the cited sources. The architecture described is a proposed, unvalidated research direction.*

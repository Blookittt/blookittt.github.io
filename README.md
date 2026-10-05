# BLOOFORTUNE

A tiny personal blog living at **bloofortune.com**.

## How to post

Create a new file inside `_posts/`.

Name it:

```
YYYY-MM-DD-short-title.md
```

Start it with:

```yaml
---
layout: post
title: "whatever this is"
date: 2026-10-04 20:00:00 -0400
category: scrap
excerpt: "optional tiny description"
---
```

Then write normally underneath in Markdown.

Allowed categories:

- `fortune`
- `log`
- `found`
- `music`
- `project`
- `scrap`

There is no minimum length. One sentence is a post.

## Images

Put images in `assets/images/`, then use:

```md
![description](/assets/images/your-image.jpg)
```

The site automatically turns images grayscale to fit the Xerox look.

## Fortune posts

To make a post appear in the fortune slip on the homepage, use:

```yaml
category: fortune
fortune_no: "002"
fortune_text: "the fortune text goes here"
```

Newest fortune wins.

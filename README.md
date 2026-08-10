# Harbor

> “A harbor exists to be left.”

Harbor is the personal website of **Haga Pradiva**: a quiet place for environmental engineering, visual design, photography, and the work of becoming.

It is not a portfolio template or a résumé in disguise. Harbor is a sequence of scenes—an invitation to pause before setting out.

## Philosophy

Harbor values restraint over spectacle. It should feel quiet, intentional, timeless, warm, peaceful, and cinematic.

Whitespace, darkness, and silence are part of the composition. Motion is used only to communicate a physical feeling: a reveal, a shift in light, a tide. Nothing should move merely to decorate the page.

## Design language

### Typography

| Purpose | Font |
| --- | --- |
| Emotion and display moments | Cormorant Garamond |
| Information and interface | Inter |

Cormorant Garamond carries the emotional voice; Inter keeps information clear and grounded.

### Palette

| Role | Value |
| --- | --- |
| Background | `#0B0D10` |
| Soft background | `#10151A` |
| Primary text | `#F3EFE7` |
| Secondary text | `#CFCBC3` |
| Accent | `#D9A85F` |
| Border | `rgba(255, 255, 255, 0.08)` |

## Current build

This is a deliberately small static site with no build step or framework.

```text
harbor/
├── index.html                 # Content and page structure
├── style.css                  # Layout, visual system, responsive rules, motion
├── main.js                    # Reveal observer, cursor light, current year
├── instagram-posts/           # Local images used by the Studio gallery
└── README.md
```

The Studio gallery uses local images, preserving their original aspect ratios while keeping each card linked to its Instagram post. This avoids relying on temporary Instagram CDN image URLs and prevents portrait images from being cropped into squares.

## Motion and accessibility

- Sections reveal once as they enter the viewport.
- The hero’s light responds gently to pointer movement.
- The footer tide spans the viewport with a low-contrast, slow drift.
- Visitors who enable **Reduce Motion** receive a still version of the experience with visible content and no smooth scrolling.

## Run locally

Because Harbor is static, any local web server will do. For example:

```sh
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Roadmap

- **Oak 0.1 — Departure:** prologue, hero, initial transition
- **Oak 0.2 — North Star:** About and timeline
- **Oak 0.3 — Tide:** photography gallery, fullscreen viewer, EXIF details
- **Oak 0.4 — Lighthouse:** projects and GitHub integration
- **Oak 0.5 — Horizon:** journal
- **Oak 1.0 — First Voyage:** public launch

## Principles for future work

- Build for Future Me: keep every file readable years from now.
- Explain before implementing: architectural choices deserve a reason.
- Separate responsibilities: HTML is structure, CSS is space and appearance, JavaScript is change over time.
- Choose craft over speed.

# Freyja

Freyja is Haga Pradiva's personal field guide: a quiet static website for environmental engineering, visual practice, notes, and the work of becoming.

## Current build

This is a deliberately small static site with no build step or framework.

```text
freyja/
├── index.html       # Page structure and content
├── style.css        # Editorial layout, visual system, responsive rules
├── main.js          # Reveal observer, active navigation, current year
├── assets/          # FIS favicon
└── README.md
```

The `Self`, `Work`, `Eye`, and `Threshold` sections form the site's current information architecture. The Eye section is intentionally an image-free archive scaffold. It uses tactile placeholders until there is a new body of work worth adding.

## Design language

- Aged paper, forest ink, stone lines, muted violet, and restrained bronze
- Fraunces for display moments and DM Sans for navigation and metadata
- FIS as a small recurring seal and visual signature
- Motion used for section reveals and gentle interaction feedback
- Reduced-motion support and visible keyboard focus states

## Run locally

Because Freyja is static, any local web server will do:

```sh
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Principles

- HTML is structure.
- CSS is space and appearance.
- JavaScript is change over time.
- Empty space can be content.
- Future images should be added only when they belong to the archive.

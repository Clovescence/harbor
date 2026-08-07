# Harbor

> "A harbor exists to be left."

Harbor is the personal website of **Haga Pradiva**.

It is not designed as a portfolio template, résumé website, or collection of projects.

Harbor is an experience.

The website is built around a simple idea: every visitor begins at a harbor before setting sail. Rather than presenting information immediately, Harbor invites the visitor into a quiet, intentional journey where every transition has meaning and every animation tells part of the story.

---

## Philosophy

Harbor values restraint over spectacle.

It should feel:

- Quiet
- Intentional
- Timeless
- Warm
- Peaceful
- Cinematic

Whitespace is content.

Darkness is content.

Silence is content.

Nothing moves unless movement communicates something.

Every animation should represent a physical event, not decoration.

---

## Design Language

### Typography

| Purpose | Font |
|---------|------|
| Emotion | Newsreader |
| Information | Inter |

Newsreader is reserved for moments that should be felt.

Inter is reserved for moments that should be understood.

---

### Color Palette

| Role | Value |
|------|-------|
| Background | `#0C1015` |
| Surface | `#171D24` |
| Primary Text | `#F4F5F7` |
| Secondary Text | `#9DA7B5` |
| Accent | `#D9B86C` |
| Border | `rgba(255,255,255,.08)` |

The palette is intentionally low contrast and OLED-friendly.

---

## Architecture

```
harbor/

├── assets/
│   ├── favicon/
│   ├── fonts/
│   ├── icons/
│   ├── images/
│   └── photography/
│
├── css/
│   ├── animations.css
│   ├── base.css
│   ├── components.css
│   ├── layout.css
│   ├── responsive.css
│   └── variables.css
│
├── js/
│   ├── main.js
│   ├── prologue.js
│   ├── transition.js
│   └── utils.js
│
├── index.html
└── README.md
```

Each file has one responsibility.

The project favors clarity over cleverness.

---

## Mental Model

Harbor is designed as a sequence of scenes rather than a long scrolling page.

```
Prologue

↓

Departure

↓

Hero

↓

About

↓

Projects

↓

Photography

↓

Journal

↓

Contact
```

A scene can only exist in one of three states:

- Dormant
- Active
- Destroyed

This keeps the interface predictable and avoids layered interactions.

---

## Development Principles

This project follows a few simple rules.

### Build for Future Me

Every file should still make sense years from now.

Readable code is more valuable than clever code.

---

### Explain Before Implementing

Every architectural decision should have a reason.

Understanding is preferred over memorization.

---

### Separate Responsibilities

- HTML defines what exists.
- CSS defines how space is organized.
- JavaScript defines how the experience changes over time.

---

### Craft Over Speed

Working quickly is never the objective.

Making the next developer smile while reading the code is.

The next developer is usually Future Me.

---

## Roadmap

### Oak 0.1 — Departure

- Prologue
- Hero
- Initial transition

### Oak 0.2 — North Star

- About
- Timeline

### Oak 0.3 — Tide

- Photography gallery
- Fullscreen viewer
- EXIF information

### Oak 0.4 — Lighthouse

- Projects
- GitHub integration

### Oak 0.5 — Horizon

- Journal

### Oak 1.0 — First Voyage

Public launch.

---

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript

No frameworks.

Every feature should first be understood before being abstracted.

---

## A Small Reminder

If there is ever a choice between making something work and designing it elegantly,

choose elegance.

Because software lasts longer than deadlines.

---

<sub>And somewhere, buried deep in the codebase, `class="banana"` remains as a reminder of where Harbor began.</sub>
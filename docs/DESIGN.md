# Remontoir — design notes

Portfolio e-commerce frontend for a fictional independent watchmaker. pt-BR, BRL, no backend.

## Intent

- **Subject:** small-batch mechanical watches, hand-finished in the Vallée de Joux, sold through a São Paulo boutique.
- **Audience:** collectors and first-time buyers of a "serious" watch, 30–60.
- **Primary job:** make one watch feel irresistible (hero), surface the featured pieces, and let people configure and buy.

## Tokens

| Name | Hex | Role |
|---|---|---|
| Rhodium | `#E3E5E8` | page — the colour of a silvered dial |
| Rhodium light | `#F1F2F4` | raised surfaces |
| Hairline | `#CDD1D7` | rules, borders |
| Ink | `#101B3D` | text; the deep blue-black of heat-blued steel in shadow |
| Ink 2 | `#3A4566` | secondary text |
| Blued steel | `#2B45B5` | links, focus, interactive accents |
| Ruby | `#9E1830` | the jewel colour — bag count and scarce signals only |
| Night / Lume | `#0A1128` / `#D5F5E3` | the dark "Nocturne" moments |

Type: **Gloock** (display; dial-printing contrast) + **Hanken Grotesk** (text/UI, tabular numerals for prices and specs).
No all-caps labels, no monospace, no eyebrow labels over every heading.

## The one bold thing

A procedural 3D watch in the hero that tells the visitor's **real time** (8 beats/second like a 28,800 vph movement)
and shows **today's real moon phase**. Leader-line callouts name its parts. Scrolling (or the "Ver o calibre" button)
turns it over to the exhibition caseback where the balance wheel oscillates at 4 Hz. Everything else is quiet:
left-aligned text, generous air, hairlines, restrained motion.

## Structure

- `/` hero (sticky 3D, front → caseback), featured pieces (editorial, varied sizes), the making sequence
  (real sequence, numbered), straps, service promises, waitlist.
- `/colecao` catalog with URL-state filters (tipo, complicação, caixa, preço) and sort; hover shows the caseback render.
- `/colecao/[slug]` product: live 3D viewer (front/back/lume-in-the-dark), strap choice that updates the model,
  caseback engraving rendered live on the 3D caseback, add to bag.
- `/sacola`, `/checkout` (ViaCEP lookup), `/checkout/confirmado`.

## Performance

Static generation everywhere. Product imagery is rendered from the same 3D models by `scripts/render-products.mjs`
(Playwright + GPU → WebP), so cards and posters are light images; live WebGL loads lazily after first paint,
renders on demand, pauses off-screen, and clamps DPR.

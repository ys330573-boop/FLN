# MTG2A04_L03_S01 - कितना पानी है? (Measuring capacity in non-standard units)

**Grade:** G2 · **LO:** MTG2A04_L03 · **Attribute:** A04 (Measurement) · **Type:** CORE

**Build:** SME review_1 rebuild (`MTG2A04_L03_S01_review_1.pptx`). The lesson now follows the SME's 12-slide deck flow; the earlier 15-slide build is kept in `MTG2A04_L03_S01 - Copy/`.

## Flow (10 slides + landing)
| PPT slide | Slide | Phase | Mechanic (type) |
|---|---|---|---|
| 2 | landing | - | "कितना पानी है?" · strip: एक मग = तीन कप |
| 3 | T1 | tutorial | glass or mug - tap the one that holds more; 7 s idle nudge; wrong → glass pulses, only the mug stays tappable (`CAP_COMPARE_PICK`) |
| 4 | T2 | tutorial | which method is right - boxes highlighted in sync with the VO; the 3-identical-cups box is marked ✓, the mixed box is dimmed (`CAP_METHOD`) |
| 5 | T3 | tutorial | 4 glasses of milk poured one by one into an empty bottle, then counted 1-4 (`CAP_POUR_IN_DEMO`) |
| 6 | T4 | tutorial | full jug fills 4 of 6 glasses; the 2 empty ones disappear (`CAP_POUR_OUT_DEMO`) |
| 7 | G1 | guided | hand demo, then the child **drags** the oil jar onto cups → options 1/4/6 (`CAP_JAR_DRAG`) |
| 8 | G2 | guided | hand demo, then the child **taps** 10 milk cups into a saucepan (capacity 8) → 1/2/8 (`CAP_TAP_POUR`) |
| 9 | P1 | practice | tap the water bottle, it fills 3 of 4 glasses → 1/3/4 (`CAP_TAP_SOURCE`) |
| 10 | P2 | practice | tap 6 oil mugs into an empty jug (emptied mugs fade to 20%) → 4/5/6 (`CAP_TAP_POUR`) |
| 11 | P3 | practice | milk shop story: 3 customers (4/2/3 glasses) → measure each vessel on its own screen → pick the 4-glass vessel; it moves to the customer (`CAP_SHOP`) |
| 12 | CEL | - | "शाबाश! आपने सीख लिया है कि बर्तन की मात्रा कितनी है।" |

Question slides use the SME hint ladder: 1st wrong → hint VO; 2nd wrong → counting VO (each vessel pulses and gets its number), the right answer glows with a hand nudge and is the only tappable option. A correct answer → confetti + praise VO → **आगे** button.

## Where things live
- `app.js` - SwiftPAL engine **2026.07.28t** (the same engine/layout as `HIKGH11_L02_S02`) + the additive **CAPACITY KIT** block (SVG vessels with live liquid levels, pour / drag-to-pour, word-timed VO highlight cues, the 8 `CAP_*` modules). The kit keeps the SME flow where the 28t house rules differ: आगे is shown after a solved guided/practice question, the hand nudge is used on guided/practice demos and 2nd-wrong reveals, and each CAP slide runs its own idle prompt instead of the engine's one-shot 7 s replay.
- `style.css` - the 28t engine CSS (reference layout: light-blue stage, ringed Swiftie head, compact tut-card with आगे inside, no hint bulb, text-free celebration) + the CAPACITY KIT block at the end.
- `_tools/build_card.py` - **single source of truth** for every VO line (text shown = text spoken), voices, highlight cues and slide data. It writes `card.json` and the embedded card in `MTG2A04_L03_S01.html`.
- `assets/Audio/cap_*.mp3` - new VO (placeholder neural TTS, hi-IN). `assets/Images/cap_shop_bg.jpg` (SME scene art, counter vessels removed so they can be interactive), `cap_landing_strip.png` (SME landing art).

## Replacing the placeholder VO
Record studio VO with the same file names, then re-time the highlight cues in `CARD.assets.audio_cues` (ms from clip start; used on most teaching slides and in the counting hints). Re-running `python _tools/build_card.py` re-generates any TTS line whose text changed.

## Status
For SME review (round 2). QA: full automated play-through (landing → celebration, including wrong-answer, hint and drag paths) passes with no console errors; validator reports all expected signals.

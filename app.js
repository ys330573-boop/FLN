const CARD = JSON.parse(document.getElementById('cardData').textContent);
  const AUDIO_EXT = (CARD.assets && CARD.assets.audio_ext) || "mp3";  // .mp3 (maths) / .ogg (Hindi FLN)
  const IMG_EXT   = (CARD.assets && CARD.assets.img_ext)   || "png";  // .png (working) / .webp (delivered/FLN) — twin of AUDIO_EXT (fixes A3)
  const ENGINE_VERSION = "2026.07.28t-r4-unified";  // 28t: A TAP DURING FEEDBACK AUDIO COUNTS INSTEAD OF VANISHING. The tap gate ignored a tap while ANY VO sounded — correct for the PROMPT (24a added it to stop spam-tapping), wrong for the hint clip that plays right after a wrong answer: a child who tapped again while hint1 was still speaking had that attempt SILENTLY DISCARDED. They tapped twice, the engine counted once, terminal help never came — the 2-attempt ladder defeated through a side door, on every tap mechanic in the fleet. `_fb` now marks feedback audio specifically: during it a tap is accepted and interrupts the clip (stopAudio first, so never two voices); during the prompt, taps are still ignored. Cleared on every ladder exit so it cannot leak into later prompt audio. Verified: attempts go 1 -> 2 on the second tap and terminal help fires. I could NOT reproduce the exact audio-mid-flight instant headless (clips end in <60ms there), so that specific moment rests on the 3-line gate being reviewable rather than on a measurement — stated plainly rather than claimed. PROCESS NOTE, because Yasir called out the churn and he was right: 28p-28s were four bumps in an hour and TWO of them existed only to fix regressions from the previous one (SORT_SHAPE misplacement, the stranded red state). The cost was never batching, it was shipping before verifying. This bump was made with the engine edited, the monolith regenerated and the game rebuilt at the OLD stamp, behaviour checked, and the version moved only once at the end — which is how the next ones should go.  28s: THE RED NEVER SETTLED TO GREY — my own 28r bug, caught by behavioural verification 20 minutes after writing it. The 700ms flash->lock timer opened with `if(state.helpShown) return;`, inherited from the code it replaced. But at the 2nd wrong, terminal help fires in the SAME beat, so helpShown was already true and the swap was skipped: measured on HI01H01_L02_S05 G1, the card sat RED and untappable at +1.7s and would have stayed that way. That is precisely the stuck-red-ring bug I fixed in 28d and have now reintroduced in a new form. The guard was correct for the OLD behaviour (do not UNBLOCK a card once terminal help owns the board) and wrong for the new one (swap the flash for the lock), and I copied it without re-deriving whether it still applied. Removed from all three paths; only the 'this cell turned out to be the answer' check remains. THE LESSON, written down for the third time: a guard inherited from replaced code must be re-justified against the new behaviour, not carried over.  28r: BOTH WRONG ATTEMPTS FLASH RED FIRST; ONLY THE SECOND ALSO DISABLES. Yasir 2026-07-28: "on second wrong attempt as well we are supposed to give the red glow first and then disable." He is right and 28p was half a fix: it restored red on the 1st wrong but sent the 2nd straight to the grey lock, so the child lost the 'that is not it' signal at the exact moment they most needed it. The red IS the feedback; the grey lock is an EXTRA consequence the 2nd attempt earns. Sequence now, every wrong tap: red buzz for 700ms -> then (2nd only) settle to grey and untappable. SAME FIX IN TWO MORE MECHANICS, where it turned out to be worse: SENTENCE_FIND and TAP_ALL_WITH_SOUND locked their chip PERMANENTLY ON THE FIRST WRONG TAP (.crossed / .nope, both pointer-events:none), so 27a's ruling 'a wrong card must NOT lock on the first miss' had never reached them at all — a child lost a chip for one miss on those slides while every other mechanic gave them a retry. All three paths now share the same flash-then-lock shape. Checked the whole class rather than only the site Yasir named: those were the only three places a wrong tap adds a lock class.  28q: FIXES MY OWN 28p BUG BEFORE IT SHIPPED. The SORT_GENDER terminal rung landed in SORT_SHAPE — I applied it with a first-occurrence string replace, and the `dragWrong(slide); // buzz + Swiftie...` + answer_wrong pair it keyed on is IDENTICAL in both modules, so it went to the wrong one. SORT_SHAPE then referenced `_sgWrong`, which does not exist in its scope: a ReferenceError on any wrong drop, on MTKGA03_L01_S01 P1/P2. Caught by BEHAVIOURAL verification (three real wrong drops on a SORT_GENDER slide showed attempts climbing 1-2-3 with no glow, no dim, no hand) — a syntax check and a rebuild both passed it, and static checks always would have. Nothing shipped: the dists and zips were still on 28o. Moved to SORT_GENDER and addressed via the module BLOCK rather than a global first-match, so the same class of mistake cannot repeat. LESSON, again: when two modules share boilerplate, never target it with an unanchored replace — extract the module's own text first, as the MEET_LETTER edit in 28p did.  28p (batch, 8 items, closes 8 requests): (1) THE HINT BULB IS REMOVED ENTIRELY — Yasir 2026-07-28 "we do not need that idea glow button at all". It appeared WITH A GLOW on the FIRST wrong (the add was above the ladder branch, not inside it) and was never phase-gated — 10 of 10 show-sites ungated — so it also offered help in round 3; on several mechanics TAPPING it flashed the answer ghost, i.e. reveal-on-demand with zero attempts. Hidden via CSS rather than deleting the node, because $("hintBtn") is dereferenced unguarded at all 10 sites and removing it would throw on the first wrong answer in every mechanic. (2) 1st WRONG IS RED AGAIN, ON A LIVE CARD — his ruling, and my own 28e over-correction: 28e said a DISABLED option is never red but implemented it on `.crossed`, the class used for BOTH the momentary buzz and the permanent lock, so it bleached the first-wrong flash too and left a grey disable with no red anywhere. Split into `.wrong-flash` (red, glowing, STILL TAPPABLE, removed after 700ms) and `.crossed` (28e's grey lock, from attempt 2). (3) LANDING HERO CAN GROW — raised THREE times (Yasir + the SME on both games) and also mine: 28i's max-height:180px cap was measured to be exactly the overflow boundary, because .sg-content.has-hero's 206px bottom margin shifted the block up so growth ate the title's headroom instead of the dead space below. Margin 206->120 and cap 180->250. MEASURED at Yasir's own 1919x977: title 7.7px -> 18px below the card edge, hero 166 -> 230px tall, dead space hero->button 92 -> 16px. (4) SORT_GENDER FINALLY HAS A TERMINAL RUNG — it was the sixth terminal-help path with NONE: buzz + try_again forever, no ceiling, no glow, no dim, no hand, so a child could be wrong indefinitely and a guided sort could never earn the hand. Counted PER TILE (a slide-wide streak resets on any correct drop) and routed through the shared terminalHold/travelNudge contract. (5) STORY_SCENE fits OUTSIDE the tutorial too — 27h was scoped to .stage.tut, so on test phases the caption sat behind the आगे pill (measured: 19px under a 136px-wide button on 5 slides of HIKGH07_L01_S02). (6) the tut teach picture may use the room it has (261px of art in a 581px card with 607px of width unused) without reintroducing 27h's overflow. (7) MEET_LETTER: the hardcoded '→' is gone (markup, so no card could remove it) and the auto demo no longer plants a hand on a single-letter slide — "points at the obvious and adds nothing". MEET_SHAPE/NUMBER/GENDER keep their arrows; he named MEET_LETTER. (8) bare .intro-letter glyph tiles are box-free like the pictures beside them.  STILL OPEN, deliberately not rushed into this bump: the other TWO MEET_LETTER asks — a word taught for both sounds (जल = ज + ल) must DISPLAY both letters, and the hand must sync to the glyph being spoken. The existing data.pair mode is not a substitute (it renders 1536px inside 1329px), so it needs real layout work and measurement; item (7) deliberately left no guessed 'is this two-letter' condition behind. Also still open: DEMO_COUNT before->after (a new capability), HIKGH07's baked-in scene backgrounds (art regen), Pehli's 11 dead .webp paths (card fix).  28o: TWO DRAG RULINGS FROM YASIR (2026-07-28). (1) THE HAND SHOWS THE MOVE. "on drag, the hand nudge guides the student precisely... move the hand nudge from the question card to the answer card." A static hand on the tile says 'this one' but never says WHERE it goes — which on a matching slide is the actual thing the child must work out. travelNudge() now slides the hand from the tile to its correct zone on a loop; terminalHold() takes an optional destination, so all three drag modules (MATCH_DRAG_N, MATCH_GENDER_PAIRS, SEQUENCE_DRAG) demonstrate the gesture while every TAP mechanic passes no destination and keeps the static point. Same phase rule as handOnAnswer (tutorial/guided only, never round 3), and the animation is stored on state so stopNudge cancels it — an infinite animation left running would follow the child into the next slide. Falls back to a static point without .animate(). (2) EVERY CARD THE SAME SIZE. "all the cards, both question and answer cards are to be of the same size in matching/dragging." They were three sizes: .dd-zone 150, .dd-tile 104, .dd-tile.pic-tile 134 — the thing you drag was smaller than the thing you drop onto. Unified on 150 (the largest, so nothing shrinks and the drag target gets easier). Deliberately excluded: .dd-tile.snapped (the 62px badge parked inside a filled zone — not a card) and .dd-stage.seq-words (word tiles size to their text; equal squares would clip long words, and sentence-building is not the matching mechanic).  28n: A NO-STIMULUS QUESTION RECLAIMS THE EMPTY SPACE (CSS only). After 28m stripped the 🔊 chip from the four audio-only stimuli, those slides looked half-empty and I flagged it to Yasir as a centring problem; he asked for a centring pass. I MEASURED FIRST and my flag was WRONG — the cells were already centred exactly (142px above, 142px below a 210px row in a 494px grid; .opt-grid already carries align-items:center + align-content:center), so a centring change would have done nothing. The real problem was that the tiles kept their with-a-stimulus size while the stimulus slot stood empty, so the space read as a void. The tiles now grow into it (min-height 210->300, glyph 96->112, pic 134->158), which also gives a KG thumb a bigger target. Scoped with :has() to rows WITHOUT a .stimulus-pic and excluding .stage.tut, so every slide that has a stimulus — and all the 27h tutorial-fit work — is untouched. Also RULED this round: the Swiftie header volume chip is template furniture and STAYS (Yasir 2026-07-28), which closes the flag 28m left open; 'no vol button' means the stimulus chips, not the shell's replay control.  28m: NO VOLUME BUTTON ANYWHERE. Yasir 2026-07-28: "we use vol button nowhere. if nothing then we keep question only." This closes the flag 28c deliberately left open: four stimuli have NO image (TAP_SHAPE_BY_NAME, TAP_LETTER_BY_SOUND, MASTERY_SILENT_PICK sound_to_letter + name_to_shape), so stripping their 🔊 + 'नाम सुनो'/'ध्वनि सुनो' chip looked like it would leave a blank card and I asked rather than guessed. The ruling is that a slide with nothing to show shows the QUESTION only — stimulus is now null on all four. The chip was ALSO the only way to re-hear the sound, so the FUNCTION moved to the header replay (state.replayAudio, set AFTER mount so mountTapOptions cannot overwrite it) rather than being deleted along with the affordance — a KG child must be able to hear the sound again. The 🔊 glyph also came off the three read-aloud BUTTONS (SENTENCE_READ 'पूरा पढ़ो', SENTENCE_SOUND and SENTENCE_PICK_PIC 'फिर सुनो'); those keep the button and their Hindi text, so nothing loses function there either. Touches 4 games: HI01H04_L02_S02 (8 slides), HI01H06_L01_S01 (7), HIKGH02_L01_S03_P2 (8), MTKGA03_L01_S01 (2). NOT TOUCHED, flagged for a ruling: the HEADER replay chip and the LANDING .sg-vo chip are still speaker icons. I left them because they are the only remaining way to re-hear a prompt, and because Yasir and the SME both reviewed screenshots showing the header chip today without flagging it — but if "nowhere" includes those, they need a text affordance first, not deletion.  28l: HARD RULE — NO QUESTION IS EVER SOLVED AUTOMATICALLY IN A TEST PHASE. Yasir 2026-07-28: "regardless of what interaction, as long as we in guided or practice, no question will be solved automatically." Only a tutorial slide may finish a question itself (there it is a demonstration). Two mechanics were still answering FOR the child on the last wrong attempt: PATTERN_BUILD and SEQUENCE_COMPLETE both ran `setTimeout(placeCorrect, 1000)`, so the engine filled the blank in and moved on — the child never answered. Yasir caught SEQUENCE_COMPLETE live on HIKGH04_L02_S02's build slides. Both now glow the correct tray tile, disable the rest, show the hand (phase-gated, so round 3 still gets none) and WAIT. MATCH_GENDER_PAIRS and SEQUENCE_DRAG already held the glow (25d) but never dimmed the distractors or pointed, so they route through the same helper now. The point of this bump is that the rule lives in ONE place — maySolveFor()/terminalHold()/clearHold() — because it has now drifted three times: 25d fixed two mechanics and left two auto-solving and two half-done, and each was re-reported separately (SORT_GENDER 06:32, SEQUENCE_COMPLETE 13:32) after I had already called the class closed. A new mechanic inherits the contract instead of re-deciding it. clearHold() releases the tray when the child does place it, or the disabled tiles would stay dead for the remaining blanks. STILL OPEN and deliberately not in this bump: SORT_GENDER has no terminal rung at all (a 6th path, different structure — bins not tiles); it does not auto-solve, it just gives audio only, so it is queued rather than rushed into this one.  28k: OPTIONAL MIDDLE HINT RUNG (`hint2`). The SME on Pehli Dhwani specified a THREE-rung ladder — rung 1 'फिर से कोशिश कीजिए।', rung 2 'शब्द को बोलकर देखिए, और पहली ध्वनि चुनिए।' (a strategy, NOT the answer), rung 3 the answer. Our ladder had two rungs, so rung 2 spoke `hint`, the level that names the answer; there was nowhere to put a strategy line. Six rung-2 sites (mountTapOptions, dragWrong, wrongClip, SORT, SENTENCE_FIND, TAP_ALL_WITH_SOUND) now call midHint(), which prefers `hint2` and falls back to `hint` — so a card that authors no hint2 behaves EXACTLY as before and the rest of the fleet keeps two rungs. CONFLICT, RAISED AND RULED: a third rung means the answer arrives on the 3rd wrong, so that deck's max_attempts goes to 3 and the card blocks after the 3rd attempt — which contradicts Yasir's standing 'blocks only after the 2nd wrong attempt'. I flagged it; he ruled 2026-07-28 'implement as per written by the SME'. It is therefore DECK-SCOPED to HIKGH02_L02_S01 only. Do not raise max_attempts or author hint2 on another game without the same explicit ask on that game's deck.  28j: THE GUIDING HAND, FIXED AT THE CHOKE POINT INSTEAD OF PER MECHANIC. Yasir found a hand in round 3 again (MTKGA01_L04_S01 P5, a COUNT_TAP practice slide) after I had gated handOnAnswer in 28f and startNudge in 28i. Cause: ~25 sites call pointNudgeAt DIRECTLY and bypassed both gates. Gating call sites one at a time is what produced three rounds of 'fixed'; the rule now lives in pointNudgeAt itself, default TUTORIAL ONLY, so every existing raw site becomes correct by construction and any future mechanic inherits it. handOnAnswer passes earned=true for terminal help, the one case Yasir allows in guided because two failed attempts paid for it. Round 3 gets no hand by ANY route. ALSO FIXED, both regressions from my own 28h placement change: (a) EMPTY SKY — the 'flip above if it would run off the stage' clamp put the hand 100-395px above a tall TAP_IN_SCENE hotspot, pointing at open air on 4 of 6 guided slides of HI01H07_L01_S02. Flipping is simply wrong for a hand that points UP; it now clamps INSIDE the stage instead, worst case overlapping the target's lower edge as it always used to. (b) A LABEL BELOW THE ANCHOR — anchoring to the passed element's bottom only helps if that element contains the text, and GENDER_INTRO passes the cat IMAGE while .cat-word sits below it, so 'below the image' landed on the word (56% covered on T3; 100% before 28h). Rather than teach each mechanic a smarter anchor, placement now MEASURES real text rects in the tile and drops below the lowest one that shares the column. Also: check_system's 'hand on answer, all phases' marker was a FALSE GREEN asserting the opposite of the live rule — renamed and re-keyed to the 28j choke point.  28i: WHY THE ROUND-3 HAND KEPT COMING BACK, plus four fleet-wide gaps. (1) THE ROUND-3 HAND BAN IS NOW ENGINE-ENFORCED. I reported this fixed three times and Yasir kept seeing it, because 28f only closed the answer/tap paths (handOnAnswer + HAND_PHASES) while the drag/count PROGRESS cue reaches the hand through startNudge, whose only round-3 guard was the CARD's scaffold_rules.nudge_timeout_ms — and 22 of 27 cards set `independent: 8000` (two also set practice). So on any drag or count slide in round 3, eight seconds of hesitation still produced a hand, in nearly every game in the fleet. Card data cannot be the guard for a hard rule: startNudge now refuses outside TUTORIAL and ignores a card that arms round 3. Tutorial-only, not {tutorial,guided}: the idle hand is UN-EARNED (a mount timer), and Yasir's rule is that any visual hint waits for 2 failed attempts — guided still gets its hand, but only through handOnAnswer at terminal help, which is where it is earned. Verified with a real 10.6s untouched wait on round-3 drag slides (P1/P3 SORT_GENDER, card arming practice+independent at 8000): no hand. (2) THE SAME FIX, ONE COPY OF IT — startNudge carried its own duplicate of the old positioning formula, so 28h's 'hand sits below the tile, never on its word' never reached a single progress cue; it delegates to pointNudgeAt now, so placement cannot drift between the two paths again. (3) SENTENCE_FIND SPEAKS THE TARGET WORD, NOT ALL FOUR (Yasir): the slide says 'जो शब्द सुनो, उस पर टैप करो।' and the engine read every option aloud, so nothing identified the word to tap — the task was unanswerable by design. Target-only is the default; the word-by-word read is opt-in via data.read_along:true. This REVERSES an SME ask from that same deck (21c flag #5) — flagged for Yasir, not silently dropped. Its trailing startNudge(slide,_tgt) — a pre-attempt hand on the answer, the third form 28f missed — is gone. (4) THE TWO-HINT LADDER REACHES THE PRODUCE MECHANICS. Yasir's 2026-07-25 'two hints everywhere, every game, every interaction type' landed for taps (24a) and drags (25a), but MAKE_SET / MAKE_EQUAL / BUILD_TO_NUMBER / TAP_ALL_WITH_SOUND grade their own wrong answers and inherited neither — and BUILD_TO_NUMBER passed `null`, i.e. its wrong-answer feedback was SILENT, text-only, to a child who cannot read. All four now call wrongClip(), one grader in one place; with no hint1/hint authored it returns the same try_again as before, so no card regresses. MAKE_NUMBER and COMBINE_COUNT reach completeSlide(true) only — no wrong path exists, so demanding a ladder was a checker false positive and they are excluded by name. (5) LANDING IMAGE HERO IS SIZED AT ALL — `.sg-hero img{height:118px}` has never matched anything (the element is .sg-art), so an image hero rendered at natural size: 1244x695 in a 1069x438 card, shoving the landing title to top:-106px, off screen. Same selector mismatch 16e fixed for count hands and left for images. (6) WIDTH-FIT MEASURES INK, NOT ADVANCE — the SME's original 'make the words fit inside the box', still unfixed. Devanagari paints wider than it advances, and the real bug was the BRANCH: a word whose advance fit never entered the shrink path, so its ink overflow was never considered (यह 66 ink vs 59 box, बकरी 138/132, एक 91/85, कहाँ 184/180 — all four had fitting advances). Fits whichever actually paints wider, so Latin/numerals are untouched. Also: engine_guard now WARNS (never blocks) when another session holds the engine lock — the stale-local-copy trap that produced a request against already-fixed 28g code.  28h: TWO FIXES Yasir named directly. (1) THE HAND NO LONGER COVERS THE WORD — pointNudgeAt planted the fingertip 56 design-px INSIDE the tile's bottom edge, which is fine on a bare picture tile (its only caller for years) and fatal the moment 28f started pointing it at an .opt-cell, whose bottom strip IS the label: measured 92x27px of the answer's word hidden under the hand, i.e. we glowed the answer and then covered it. The hand now starts just past the tile's bottom edge, clamped to flip ABOVE the tile if that would run off the stage foot rather than being silently clipped. Verified by measurement AND by looking: G1 hand t646 vs tile b641, label b627, vertical overlap 0, still centred, still tappable. (2) ONE GATE PER ROUND, NOT PER PHASE NAME — 28a made `independent` an alias of practice to fix a MISSING round-3 gate, and thereby created a DUPLICATE one: a card using both names crossed two 'different phases' and showed the identical 'अब आपकी बारी!' gate twice, back to back. 7 of 27 cards use both. Gates now dedupe on a ROUND id (PHASE_ROUND), so that pair collapses to one and any unmapped phase (mastery, or a future name) fails safe to NO gate — which is the ruling: three rounds, no round 4. Also closed as NOT-A-DEFECT: a report that the round-3 hand ban was still broken. Measured on P1 at 28h — terminal help fires, answer glows, stays tappable, handShown FALSE. 28f had already fixed it; the report read a stale source. The raw pointNudgeAt calls left in MEET_ORDER/COMPARE_TWO/the demo step chain are auto-DEMO teaching animations, not hints, and stay.  28g: 'going back from last screen gets swiftie stuck' — clearHost() dropped body.is-end but never removed .show from #endScreen, so the celebration layer (cheering Swiftie + 'बहुत बढ़िया!') stayed overlaid on the slide you navigated back to, covering the middle option. I had hit this myself and mis-triaged it as low severity ('a child cannot go back from celebration') — but REVIEW uses the dev nav, so it hit every review pass, and it also caused 60 phantom overlap findings in my audit sweep. Deliberately scoped to the end screen only: also clearing stage.blurred/gating here would un-blur the gray phase gate mid-flight, since mountSlide runs inside the gate's callback.  28f: ONE RULE FOR THE GUIDING HAND, in one place (handOnAnswer()) — Yasir 2026-07-28, two rulings merged: tutorial may show the hand (teaching); guided ONLY after 2 failed attempts; round 3 (practice / independent / mastery) NEVER, 'regardless of whatever name we save it by'. Also DELETED the idle/mount hand on answerable slides: startNudge fired at nudge_timeout_ms (guided 5000ms) — right after the prompt VO — pointing at the stimulus before the child had tried anything. A visual hint is now earned only by 2 failed attempts. All 5 terminal-help paths route through handOnAnswer, so the phase rule cannot drift per-mechanic again (27d put the hand in 1 of 5 and I reported it as 'every phase'). Demo/progress nudges inside the count and drag mechanics are untouched — teaching animations, not hints.  28e: (1) A DISABLED OPTION IS NEVER RED — .crossed / .sentence-word.crossed / .tap-all-item.nope now match the plain grey .faded lock. Two looks for one meaning was the complaint; this supersedes the red ring 27a introduced. 1st-wrong buzz/shake unaffected (28d unblocks that card after 700ms so it never rests as disabled). (2) TAP_IN_SCENE no longer PULSES the correct hotspot 6s after mount — that handed the answer over before the child tried (measured: identical at t=1s, only .correct-hot pulsing at t=7s). The glow now comes only from terminal help, where distractors also fade. (3) FIXED MY OWN 28a REGRESSION: the new SEQUENCE_COMPLETE picture stimulus pushed .seq-tray under the आगे pill (bottom ~30% of two tiles a dead zone on all 4 build slides). .seq-stage now top-anchors, tightens its gap and reserves the pill's lane.  NOT DONE, needs care: the fleet-default 'remove handnudge on idle' ruling — startNudge is also used by drag/count mechanics for PROGRESS cues, so disarming it globally would remove useful guidance, not just idle hints. Filed.  28d (three REGRESSIONS of my own, re-reported by Yasir): (1) the stuck RED RING — the 700ms unblock was guarded by `if(!state.locked)`, but state.locked is also set TRANSIENTLY while reveal_seq narrates, so a 700ms landing in that window skipped the removal and .crossed stayed FOREVER (permanent red ring, permanently dead card). Now keyed off this cell only (.correct / state.helpShown). I had found that same state.locked trap while fixing the idle-VO ticker, documented it there, and failed to propagate it back. (2) HAND NUDGE only existed on ONE of FIVE terminal-help paths — 27d added it to mountTapOptions.revealAnswer and I reported it as 'every phase', but practice/independent rounds are drags / sentence-finds / scene-taps. Added to MATCH_DRAG_N.terminalHelp, SENTENCE_FIND and TAP_IN_SCENE, each with stopNudge() first so the flow nudge cannot drag the hand off the answer. (3) STORY_SCENE picture drifted via `storyKenBurns` — killed engine-wide; a teaching picture must not move under a KG child. Root cause common to (1) and (2): verified narrowly, reported broadly.  28c: STORY_QUESTION stimulus is the IMAGE ONLY — the 🔊 glyph and the 'प्रश्न सुनो' label were hardcoded in the module (d.stim_hi only reworded the label), so no card could remove them. Tapping the picture still replays the question and the header chip still works: the affordance is gone, not the function. No thumb (mastery / hide_recall) now passes a null stimulus instead of rendering an empty card. The four AUDIO-ONLY chips (TAP_SHAPE_BY_NAME, TAP_LETTER_BY_SOUND, MASTERY_SILENT_PICK x2) are untouched — they have no image, so stripping them leaves a blank card; flagged for a ruling.  28b: PHASE GATE BACKGROUND GOES GRAY (Yasir + Figma ref). Scrim 35% -> rgba(64,64,70,.58) and backdrop-filter gains grayscale(.9) brightness(.92), so a colourful KG scene actually DESATURATES instead of merely dimming; grayscale rides the BACKDROP so the peeking Swiftie and the headline keep full colour. Also kills `body.is-start .phase-gate{background: transparent !important}` — the FIRST gate (landing->tutorial) had NO scrim at all, open as flag S2-a; this closes it. Verified by SCREENSHOTTING the gate (capture_pages cannot — it is a ~2s transient) on both the mid-lesson and is-start paths.  28a [code tags read `[27j]` — written before midnight, engine_bump rolled the date; grep [27j] for these six changes] (batched wave fixes, 6 module changes, all ADDITIVE — a card that does not opt in behaves exactly as before): SEQUENCE_COMPLETE takes an opt-in picture stimulus (d.img/picture/emoji) so build-the-word slides can show the thing being spelled; TAP_IN_SCENE gains the two-rung hint ladder + terminal help that GLOWS the target instead of solving it, and .tis-hot is now VISIBLE on every candidate (it was border:none/transparent, so a child had nothing to aim at); mountTapOptions finally speaks audio.correct after the tapped word (12 STORY_QUESTION slides were silent); MATCH_DRAG_N drop-zones speak on tap, reusing pair.match_audio; SENTENCE_FIND: rung 1 now plays hint1 (it played try_again), `hint` is spoken as the terminal line, and terminal help NO LONGER locks+completes the slide — RULE-9 breach, it was solving the answer for the child; PHASE_GATE_TITLE/VO gain `independent` as an ALIAS of practice — three rounds, not four: round 3 is named practice OR independent and a card using the latter got no round-3 gate. `mastery` is deliberately NOT gated (no round 4), so vo_pt_mastery stays unplayed and that verify_bundle warn is a checker artifact. Also: _tools/check_system.py now verifies the ENGINE READS hint1/hint per mechanic, closing a false green where authored hints could never play.  27h: F1 tutorial-frame fit — tall teach modules (STORY_SCENE .story-frame 900x432, GENDER_INTRO .gender-cat 430px) overflowed the 318px .tut-content and, because it is justify-content:center, split the overflow BOTH ways: heading 78-100% covered above, caption/word-chip behind the आगे pill below. Regression from the 25e/27c change that shortened every tut-card 87px. Now the picture SHRINKS (what the SME asked) instead of pushing the layout apart; scoped to .stage.tut so guided/practice are untouched. Cleared 6 requests across 4 games. · F2 shared baseline — centerInkGlyph ink-centred EACH glyph, so a word with an above-line matra sat up to 23px lower than a plain word inside one row (the SME's 'text alignment is not right', 7 of 17 pages). A row with >1 .ink-glyph now uses constant FONT metrics; a lone showcase glyph keeps ink-centring. Both verified by LOOKING at headless captures, not only by measuring.  ENGINE STAMP — the receipt (verify_bundle.py) asserts a built game carries THIS exact string; a stale/divergent engine → hard FAIL, so the wrong engine can never silently ship. BUMP IN LOCKSTEP with engine_guard.py + swiftpal_build.py + unified_build.py + verify_bundle.py on EVERY engine change (r2: drag/pattern feedback standard + PHASE_TRANSITION; r3c: off-white toybox bg, dual-coded counting options numeral+hand, full-body landing mascot, true-corner square/rect; r3d: Swiftie mouth-stops-when-silent (still frame), Arabic display numerals 1/2/3, landing shows full 1..n hand row, volume-chip aligned in header pill); r4: additive number-sequence path modules MEET_SEQUENCE + SEQUENCE_COMPLETE + SEQUENCE_NEXT (MTKGA01_L02_S04 "completes a number sequence within 20") — purely additive, existing lessons untouched. r4-landing (16c): landing recomposed to match reference — small corner mascot (230px, was 300), content re-centered (dropped padding-left:300 right-shift hack), VO chip moved from top-right to the mascot's shoulder (left:150/bottom:34, 58px). CSS-only; supersedes the 16b right-shift overlap fix.; 16d: TRUNK MERGE — unified the two diverged engine lines at base 12d: the 15e mechanics trunk (CONSERVE_COUNT + COUNT_ACTION + COUNT_DRAG_MATCH + ORDER_BY_WEIGHT + PICK_SET_BY_NUMBER, per_row/dense count-set grouping, bigNumCell numeral-only test options, title_first landing order) + the 16c r4 design trunk (boot loader, peek phase-transition, concept-strip landing, DS header, flat CTAs, sunburst/star-burst celebration, recomposed corner-mascot landing). Nothing dropped from either line. 16e: landing count-hero hand sizing FIXED — the .sg-hero sizing selectors never matched (template uses .sg-art); hands rendered natural-size, overflowing the card (title pushed outside the box, numeral-1 hidden behind the mascot — user-visible on MTKGA01_L02_S01). Retargeted to .sg-art .sg-hand/.sg-hand-cell/.sg-hand-num (112px; image-hero landings untouched). CSS-only. 16f: INTRO strip fit-or-wrap — old sizing assumed 1220px + a -100px breakout and punched wide strips (10 numerals, 7+ letters) through the tut-frame borders; now sized to the frame (960) and wrapping into two balanced rows below the 110px touch floor. Fixes MTKGA01_L02_S01 s00 (user-caught live) AND the HIKGH04_P2 letter-row daylight item. 21a (20a Figma-polish port): production expression heads (setSwMood sw_head_<expr>[_anim].webp + mascot.webp fallback), body-level start/end edge-layers + full-viewport dark blur phase-gate, inline SVG audio/hint/sg-vo chips, nudge_hand_new/nudge_tap_v2, SORT-01 opt-in one-by-one tray reveal + speak-on-match, INTRO picture mode (data.pics) + auto-INTRO instruction VO, transition-audio AUDIO_EXT fix, landing shape-tiles, self-disabling browser-TTS fallback for missing clips (ruled SHIP), F2F7FA ground + red/green-reserved sweep; merged WITH the live in-word-matra colouring + reveal_seq _sayThen strict-VO + MATCH_DRAG_N md-word WIP (nothing reverted). 21c (consolidated wave bump): +COMBINE_COUNT (Put-Together: drag group B onto A, merge to one row, tap-count total ≤10) and +TRACE_SHAPE (finger-trace the outline — a PRODUCE gesture; forgiving corridor, ~80% coverage → success, idle demo, upright/sharp/fixed-colour, no score/timer); MATCH_DRAG_N tap→LETTER (tap_audio) / correct-drop→WORD (match_audio) split (gated+fallback, siblings untouched); SEQUENCE_DRAG word-mode tap-a-tile→speak-word + glow-order + whole-sentence-read-at-end, SENTENCE_READ/SENTENCE_FIND word-by-word read-along hand-nudge (word-mode gated; letter-sequence untouched); landing gate cursor:default (hand-pointer on buttons only). All additive. 24a (HI01H08-fork port + N7-N10 audit bump): AUDIO GEN-TOKEN (_audioGen) — stopAudio/play supersede pattern kills echo/double-voice, orphaned clips, stale fallback-timer resume + cancelled-TTS resume (N7a); replay chips get navUnlock + guards (isPlaying / revealing / demoRunning / ownsAudio-without-replay) so फिर-सुनो mid-VO can no longer brick gated teach slides or gen-kill self-driving demo chains (N7b/N8); state.revealing gates drag + replay during reveal_seq/sortSeqReveal (N8 drag path); capture-phase DRAG VO-GATE on draggable tiles (isPlaying + 4s _voStart cap — speak-on-press tiles NOT over-blocked) (A1); mountTapOptions tap gate: one-tap-at-a-time _busy + 4s _vb + no taps during ANY VO + additive hint1 first-wrong clip (A2); auto walk-through INTRO/GENDER_INTRO ignore card taps until taught, then tap=replay (A3); playbackRate pinned 1.0 (A4); SORT tray ghost-slot .sort-ghost on placement (A5); MATCH_DRAG_N final-drop word no longer truncated by the celebrate VO (C); viewport pinch-zoom lock (N9); star-burst spark fill-mode both (N10). N11 (asset preload) deferred. 25a (drag hint ladder): dragWrong() now grades its spoken feedback like the tap path — 1st wrong plays the slide's hint1, 2nd+ plays hint (the level that GIVES the answer); all 12 drag wrong-drop sites inherit it with no call-site change, and cards without hint1/hint authored still play try_again unchanged (additive, zero sibling regression). Yasir ruling 2026-07-25: two hints everywhere, every game, every interaction type. 27c (autonomous teaching + tutorial fit): mountTapOptions honours slide.data.auto — a TEACHING slide now runs the whole beat itself (prompt on the picture -> teaching line on the right choice -> that choice goes green+pulses, wrong ones fade, its letter sounds -> आगे unlocks), taps dead throughout, no confetti/sfx; opt-in, and SENTENCE_SOUND/INTRO/GENDER_INTRO/MEET_* keep their own pre-existing auto paths (they return before mountTapOptions). CSS: .stage.tut q-rows that carry a picture stimulus lay it BESIDE the options — the 25e card leaves 273 design px and stimulus+gap+opt-cell need 434, so the grid track squashed to 43px and the cells spilled onto the picture (Yasir 2026-07-27, Antim T2/T3). 27g-fix (relabelled — 27d was taken by the terminal-help hand): the auto chain no longer points the hand at the picture stimulus — pointNudgeAt plants the fingertip 56px above an element bottom, i.e. straight over a .stimulus-pic .lbl, so the hand hid the very word being taught for the whole prompt beat.
  try { window.SWIFTPAL_ENGINE = ENGINE_VERSION; } catch(e){}
const $ = id => document.getElementById(id);

/* ---------- 1. SCALE THE 1333x750 STAGE ---------- */
function fit(){
  const vw = (window.visualViewport ? window.visualViewport.width  : document.documentElement.clientWidth)  || window.innerWidth;
  const vh = (window.visualViewport ? window.visualViewport.height : document.documentElement.clientHeight) || window.innerHeight;
  // contain-fit, scaling UP to fill the screen (no 1× cap, no margin) so a 16:9
  // viewport is covered edge-to-edge. Any leftover bars on non-16:9 are blue, not white.
  const s = Math.min(vw/1333, vh/750);
  document.documentElement.style.setProperty("--scale", s);
}
window.addEventListener("resize", fit);
window.addEventListener("load", fit);
if(window.visualViewport) window.visualViewport.addEventListener("resize", fit);
fit();

/* ---------- 2. SIGNAL BUS + OFFLINE TELEMETRY ---------- */
/* TELEMETRY: offline self-capture. Every signal is buffered to localStorage so
   the run survives a reload / works with NO host app. A full results record can
   be pulled via SwiftPAL.downloadResults() (or the ?dev=1 button on the end
   screen). If `endpoint` is set AND the device is online, the final record is
   also POSTed — left null so the lesson is fully offline by default. */
const TELEMETRY = {
  endpoint: null,   // e.g. "https://lrs.example.com/swiftpal" — null = offline only
  storageKey: "swiftpal:run:" + CARD.skill_code + "_" + (CARD.part_label || "P1")
};
/* ---------- 2b. xAPI OUTBOUND — XAPI_EVENTS.md, 7 verbs ----------
   ADDITIVE ONLY. Nothing below changes game logic, content, audio, CSS or timings, and the old
   `swiftpal:signal` firehose and `swiftpal:proceed` message are left exactly as they were.

   Every analytics event is ONE statement { verb, object, result, context }, dispatched through the
   platform bridge — SwiftPAL.sendEvent(statement) — with the standalone
   postMessage({type:"swiftpal:xapi", statement}) fallback when no bridge is loaded.

   WHY IT HANGS OFF emit() AND NOT ~77 CALL SITES: emit() is the single choke point every one of this
   engine's internal signals already passes through, so the whole mapping is one function and no
   existing hook point has to be invented, renamed or moved. completeSlide(success) already emits
   `slide_completed` carrying success + attempts, which IS question_answered's result block; the
   ~15 per-mechanic `*_first_try` / `*_correct` signals stay analytics detail, not answer events.

   NOTE (deliberate): this game's internal bus keeps its existing name `SwiftPAL`, so
   `window.SwiftPAL.sendEvent` will normally not resolve and statements go out on the documented
   swiftpal:xapi fallback. The bridge branch is kept first so a host that does provide a real
   sendEvent is used the moment the name is free. */
function _devMode(){
  try{ return new URLSearchParams(location.search).has("dev"); }catch(e){ return false; }
}
function _urlParam(k){
  try{ return new URLSearchParams(location.search).get(k) || null; }catch(e){ return null; }
}
/* PASSIVE = a screen with nothing to answer (teach / story / celebration): it reports screen_viewed.
   Everything else mounts an answerable screen and reports question_started. Read off this engine's
   own SlideModules: the types below are the ones whose mount() has no isCorrect and no wrong path
   and only ever calls completeSlide(true). A prefix fallback covers any type not named here. */
var _XAPI_PASSIVE = {
  CELEBRATION:1, INTRO:1, STORY_SCENE:1, SENTENCE_READ:1,
  MEET_LETTER:1, MEET_NUMBER:1, MEET_GENDER:1, MEET_SHAPE:1, MEET_ORDER:1,
  MEET_SEQUENCE:1, MEET_PATTERN:1, MEET_COMPARE:1,
  GENDER_INTRO:1, NUMBER_INTRO:1, SHAPE_INTRO:1, GENDER_EXPLAIN:1,
  PHASE_TRANSITION:1, DEMO_COUNT:1
};
function _isPassive(slide){
  if(!slide) return true;
  var t = slide.type || "";
  if(_XAPI_PASSIVE[t]) return true;
  return /^(MEET_|PHASE_TRANSITION|DEMO_)/.test(t) || /_INTRO$|_EXPLAIN$/.test(t);
}
/* question_format buckets from the spec: mcq | timed_mcq | build | drag | tap_count.
   `template` carries the exact module name for finer analysis, so this is deliberately coarse. */
function _xapiFormat(slide){
  var t = (slide && slide.type) || "";
  if(_isPassive(slide))                            return null;   // a passive screen has no format
  if(/DRAG|MATCH/.test(t))                         return "drag";
  if(/BUILD|PATTERN|SEQUENCE|TRACE|SORT/.test(t))  return "build";
  if(/COUNT|TAP_ALL/.test(t))                      return "tap_count";
  return "mcq";
}
/* the 11 context keys, on EVERY statement. skill_code / lo_code are this book's own stable content
   ids, read from its own CARD — never hardcoded. The journey binding is the HOST's: it launches the
   game with ?context_id=...&journey_id=...&medium=... and those values are echoed straight back out. */
function _xapiContext(slide){
  var s = slide || ((typeof state !== "undefined" && CARD.slides[state.idx]) || null);
  return {
    skill_code: CARD.skill_code,
    lo_code: CARD.lo_code,
    medium: _urlParam("medium") || "hi",
    session_ms: Date.now() - SwiftPAL.startedAt,
    question_id: s ? s.id : null,
    question_index: (typeof state !== "undefined") ? state.idx : null,
    template: s ? s.type : null,
    question_format: _xapiFormat(s),
    phase: s ? s.phase : null,
    context_id: _urlParam("context_id"),
    journey_id: _urlParam("journey_id")
  };
}
function _xapiSend(verb, object, result, slide){
  var st = { verb: verb, object: object || null, context: _xapiContext(slide) };
  if(result) st.result = result;
  try{
    if(window.SwiftPAL && typeof window.SwiftPAL.sendEvent === "function"){
      window.SwiftPAL.sendEvent(st);
    } else {
      window.parent?.postMessage({ type: "swiftpal:xapi", statement: st }, "*");
    }
  }catch(e){ /* telemetry must never break the lesson */ }
  if(_devMode()){ try{ console.log("[xapi]", verb, st); }catch(e){} }
  return st;
}
/* first-try accuracy across every ANSWERED question, 0-1 to 2dp — activity_completed.result.score.
   Derived from the signal buffer rather than a second counter, so it cannot drift from what fired.
   `slide_completed.attempts` counts WRONG taps on that slide, so 0 attempts == right first time. */
function _xapiScore(){
  var byId = {};
  CARD.slides.forEach(function(s){ byId[s.id] = s; });
  var done = SwiftPAL.signals.filter(function(e){
    return e.signal === "slide_completed" && !_isPassive(byId[e.slide_id]);
  });
  if(!done.length) return 0;
  var firstTry = done.filter(function(e){ return e.success && !e.attempts; }).length;
  return Math.round((firstTry / done.length) * 100) / 100;
}
/* option detail for question_answered. This engine answers through several mechanics that share no
   option array (drag, sort, trace, tap-count), and the emit() choke point cannot see the tapped
   option, so ui_index / original_index are carried as explicit nulls rather than invented. */
function _xapiOption(payload){
  return {
    type: "question",
    id: (payload && payload.option_id) || null,
    text: (payload && payload.picked) || null,
    mediaUrl: null,
    ui_index: (payload && payload.ui_index != null) ? payload.ui_index : null,
    original_index: (payload && payload.original_index != null) ? payload.original_index : null
  };
}
var _xapiLaunchedAt = null, _xapiCompleted = false;
function _xapi(name, payload){
  var idx   = (typeof state !== "undefined") ? state.idx : null;
  var slide = (idx !== null && CARD.slides[idx]) || null;
  switch(name){
    case "activity_launched":
      /* the child tapping शुरू करें. One-shot, so a mashed start cannot double-report; a game that is
         opened and abandoned reports nothing. It also starts activity_completed's duration clock. */
      if(_xapiLaunchedAt) break;
      _xapiLaunchedAt = Date.now();
      _xapiSend("activity_launched", { type:"activity", id: CARD.skill_code }, null, slide);
      break;
    case "slide_entered":
      /* ONE of the two mount verbs, decided by whether this screen can be answered. */
      _xapiSend(_isPassive(slide) ? "screen_viewed" : "question_started",
                { type: _isPassive(slide) ? "screen" : "question", id: slide ? slide.id : null },
                null, slide);
      break;
    case "answer_wrong":
      /* an intermediate WRONG tap. answer_wrong is emitted AFTER state.attempts++, so its attempts
         is already 1-based: 1 == the first wrong tap. */
      _xapiSend("question_answered", _xapiOption(payload),
                { score: 0, attempt: payload.attempts || 1, is_correct: false }, slide);
      break;
    case "slide_completed":
      /* the CORRECT tap on an answerable slide — completeSlide(true) is the one path every mechanic
         in this engine takes. Here `attempts` counts the WRONG taps that came first, so the attempt
         number is attempts+1 and score is 1 only when there were none. */
      if(!_isPassive(slide)){
        var wrongs = payload.attempts || 0;
        _xapiSend("question_answered", _xapiOption(payload),
                  { score: (payload.success && wrongs === 0) ? 1 : 0,
                    attempt: wrongs + 1, is_correct: !!payload.success }, slide);
      }
      break;
    case "hint_shown":
      /* hint_used is the BULB, per the spec. This engine emits hint_shown from the bulb's own handler
         with manual:true, and also for the automatic terminal help after two wrong tries — that one
         is not a tap and is deliberately not reported as hint_used. */
      if(payload.manual === true) _xapiSend("hint_used", { type:"hint", id:"bulb" }, null, slide);
      break;
    case "audio_replay":
      /* the header replay chip. `idle_vo_replay` (the inactivity timer repeating the prompt by
         itself) is deliberately NOT mapped — nobody tapped a chip. */
      _xapiSend("audio_replayed",
                { type:"audio", id: payload.key || payload.role || "audio_chip" }, null, slide);
      break;
    case "proceed_next":
      /* activity_completed fires ONLY here. proceed_next is emitted from the आगे बढ़ें button's own
         onclick, which is what satisfies "no longer fires when the celebration appears" —
         `lesson_completed` (which DOES fire on celebration mount) is mapped to nothing on purpose.
         One-shot, because the existing button has no mash guard. */
      if(_xapiCompleted) break;
      _xapiCompleted = true;
      _xapiSend("activity_completed", { type:"activity", id: CARD.skill_code },
                { completed: true, progress: 100, score: _xapiScore(),
                  duration_ms: Date.now() - (_xapiLaunchedAt || SwiftPAL.startedAt) }, slide);
      break;
    default: break;   /* every other internal signal stays internal detail, never a verb */
  }
}

const SwiftPAL = window.SwiftPAL = {
  signals: [],
  validatorReport: { missing_signals: [], errors: [], passed: false },
  firedSet: new Set(),
  startedAt: Date.now(),
  emit(name, payload){
    const evt = Object.assign({
      ts: Date.now(),
      skill_code: CARD.skill_code,
      lo_code: CARD.lo_code,
      signal: name
    }, payload || {});
    this.signals.push(evt);
    this.firedSet.add(name);
    try{ console.log("[signal]", name, evt); }catch(e){}
    try{ window.parent?.postMessage({type:"swiftpal:signal", payload: evt}, "*"); }catch(e){}
    /* ADDITIVE: the same internal signal, also mapped to the 7 outbound xAPI verbs
       (XAPI_EVENTS.md). The line above is untouched — hosts on swiftpal:signal keep working. */
    try{ _xapi(name, payload || {}); }catch(e){ /* telemetry must never break the lesson */ }
    this.persist();
  },
  /* full results record (used for download / POST / end-of-lesson dump) */
  exportResults(){
    const ms = (typeof state!=="undefined") ? state.masteryAttempts : 0;
    const mh = (typeof state!=="undefined") ? state.masteryHits : 0;
    return {
      skill_code: CARD.skill_code, lo_code: CARD.lo_code, part: CARD.part_label || null,
      started_at: this.startedAt, exported_at: Date.now(),
      mastery: { hits: mh, attempts: ms, score: ms ? mh/ms : 0 },
      validatorReport: this.validatorReport,
      signals: this.signals
    };
  },
  /* silent: flush the running buffer to localStorage (survives reload / offline) */
  persist(){
    try{ localStorage.setItem(TELEMETRY.storageKey, JSON.stringify(this.exportResults())); }
    catch(e){ /* private mode / quota — non-fatal, postMessage + memory still work */ }
  },
  /* pull the run as a JSON file (teacher/dev; not in the child's flow) */
  downloadResults(){
    try{
      const blob = new Blob([JSON.stringify(this.exportResults(), null, 2)], {type:"application/json"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = CARD.skill_code + "_" + (CARD.part_label||"P1") + "_results.json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=> URL.revokeObjectURL(url), 1000);
    }catch(e){ console.error("[telemetry] download failed", e); }
  }
};

/* ---------- 3. AUDIO ---------- */
let isPlaying=false, currentAudio=null, _audioGen=0, _voStart=0;
let isMuted = false;
function setMuted(m){ isMuted = m; if(m && typeof stopAudio==="function") stopAudio();
  document.querySelectorAll(".audio-chip").forEach(c => c.classList.toggle("muted", m)); }
function setPlaying(on){
  // the dynamic Swiftie sits header-left; the audio chips pulse to signal playback. r4/F1: share the
  // .playing toggle across the header chip AND the tut-card replay chip (the header is hidden in the
  // tut frame, so the in-card .tut-audio is the only visible affordance and must react to VO too).
  isPlaying=on;
  /* [30g] VO LOCK — untappable, zero visual. See style.css. Driven off setPlaying (never a timer) so
     the lock cannot outlive the audio; toggled on `on` alone so it tracks the tap gate under mute. */
  document.body.classList.toggle("vo-lock", !!on);
  if(on) _voStart = Date.now();   // drag VO-gate 4s safety: stamp when a VO began so a stalled clip can't soft-lock the tiles
  document.querySelectorAll(".audio-chip, .tut-audio, .sg-vo").forEach(c => c.classList.toggle("playing", on && !isMuted));
  /* [LOCAL 2026-07-29 — RULING_no_tapping_during_VO] The tap gate already refused taps while a clip
     played (isPlaying), but NOTHING on screen changed, so a child tapped a live-looking card and got
     silence. That silent non-response was the reported defect, not the blocking. This body class is
     the VISIBLE half; the CSS dims + un-points every interactive element.
     Driven off setPlaying — NOT a timer — deliberately: this is the one function every exit passes
     through (stopAudio, and fire() for natural end / supersede / cancelled TTS / missing-file
     fallback), so the lock can never outlive the audio and strand the slide.
     Toggled on `on` alone, NOT `on && !isMuted`: the tap gate keys off isPlaying whatever the mute
     state is, so gating on mute here would recreate the exact invisible-block bug while muted. */
  /* [30f] the page-wide VO dim was REMOVED here — Yasir: "dont block the entire screen fam".
   It also set pointer-events:none, which stopped a tap during FEEDBACK audio from reaching the tap
   gate and so silently undid 28t (feedback taps must count). See the shared engine's note. */
}
/* stopAudio(): hard-stop the current clip AND bump the playback generation so any in-flight
   callback (a chain's onended, a fallback timer, a cancelled TTS onend) becomes a no-op. This is
   what prevents the "voice echo": a stale callback from an earlier tap/slide can no longer fire a
   NEW clip on top of the current one, or resume onto the next screen. */
function stopAudio(){
  _audioGen++;
  if(currentAudio){ try{ currentAudio.onended=null; currentAudio.onerror=null; currentAudio.pause(); }catch(e){} currentAudio=null; }
  try{ if(window.speechSynthesis) speechSynthesis.cancel(); }catch(e){}   // [20a] also stop the TTS placeholder
  setPlaying(false);
}
/* [20a REVIEW PLACEHOLDER] TTS fallback: until real VO is recorded, speak the clip's authored Hindi text
   (CARD.assets.audio_text[id]) via the browser so the game is audible for review. SELF-DISABLING — fires
   only when the MP3 is missing; once real clips ship, play() succeeds and this never runs. Returns true if
   it took over (so play() doesn't ALSO schedule a silent beat). */
function _ttsSay(src, onDone){
  /* [30o] THE TTS FALLBACK IS GONE (Yasir 2026-07-31): "there should be no way to fall back on tts,
     it is fine if we dont have audio, we will know if an audio is missing but having tts is worse."
     A synthetic voice MASKS a missing clip — it made a broken build sound finished. Silence is
     diagnostic. Kept as a stub, not deleted: an unfound call site would ReferenceError and take the
     slide chain down, whereas false routes it into the silent-beat path that already exists. */
  return false;
}

/* play(src, onEnd): real MP3 if path exists; silent 1.5s beat if missing/blocked.
   ECHO GUARD [24a N7]: each call captures a generation token after stopAudio()'s bump; if a newer
   play()/stopAudio() has since run, this call's fire/onFail/fallback-beat bail — a superseded chain
   can never start a clip over the current one, orphan the new clip (stale onFail nulling currentAudio),
   or resume onto the next slide (fallback timers + cancelled-TTS onend die with the token too). */
function play(src, onEnd){
  stopAudio(); setPlaying(true);
  const myGen=_audioGen;
  let done=false; const fire=()=>{ if(done || myGen!==_audioGen)return; done=true; setPlaying(false); if(onEnd) onEnd(); };
  if(src){
    const a=new Audio(src); currentAudio=a;
    a.playbackRate = 1.0;   // natural recorded pace — any pep-up factor makes HUMAN VO too fast (Yasir 2026-07-24)
    let handled=false;
    const onFail=()=>{ if(handled || myGen!==_audioGen)return; handled=true; currentAudio=null; setTimeout(fire, 1200); }; /* [30o] silent beat — never a synthetic voice (Yasir); [30p] brace restored outside the comment */
    a.onended=fire;
    a.onerror=onFail;
    /* [30n] AN AUTOPLAY REFUSAL IS NOT A MISSING FILE. a.play() rejects both for a broken file — where
       _ttsSay is the intended review placeholder — and with NotAllowedError under the browser's autoplay
       policy, which fires on every load before the first gesture. Treating them alike made a game with
       complete human VO speak the OS voice on its landing, with the volume button as the gesture that
       finally let the real clip through. fire() here is NOT optional: setPlaying(true) already ran, so
       bailing without it leaves body.vo-lock on and the whole screen untappable. */
    a.play().catch((err)=>{
      const nm = err && err.name;
      if(nm === "NotAllowedError" || nm === "AbortError"){
        if(handled || myGen!==_audioGen) return;
        handled=true; currentAudio=null; fire(); return;   // silent; the first gesture starts the real clip
      }
      onFail();
    });
  } else { setTimeout(fire, 800); }   // [30o] no src: silent beat, never TTS
}
/* playSfx(id): fire-and-forget sound effect on its OWN Audio element so it can
   overlap the spoken VO (does NOT touch currentAudio / the play() chain).
   Silently no-ops if the file is missing or playback is blocked. */
function playSfx(id){
  if(!id) return;
  try{
    const a = new Audio("assets/Audio/" + id + "." + AUDIO_EXT);
    a.volume = 0.7;
    a.play().catch(()=>{});
  }catch(e){}
}
/* ---------- game-feel: procedural SFX (no audio files) + success particle burst ----------
   WebAudio resumes on the first user tap (autoplay policy), so taps/answers always sound. */
let _juiceAC = null;
function _ac(){ if(!_juiceAC){ try{ _juiceAC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} }
  if(_juiceAC && _juiceAC.state === "suspended"){ try{ _juiceAC.resume(); }catch(e){} } return _juiceAC; }
function _tone(freqs, type, dur, vol){ const c = _ac(); if(!c) return; const t0 = c.currentTime;
  freqs.forEach((f, i)=>{ const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f;
    const t = t0 + i*(dur/freqs.length); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur/freqs.length); o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur/freqs.length); }); }
const sfxTap       = ()=> _tone([520], "sine", 0.09, 0.09);
const sfxCorrect   = ()=> _tone([660, 880, 1180], "sine", 0.42, 0.13);   // rising major arpeggio
const sfxWrongSoft = ()=> _tone([300, 235], "triangle", 0.20, 0.08);      // gentle, never harsh
/* a joyful star/confetti pop, centred on the play stage (upper-middle) */
function burstStars(){ const stage = document.querySelector(".slide-stage") || document.body;
  const cx = stage.offsetWidth/2, cy = stage.offsetHeight*0.38, emo = ["⭐","✨","🌟","💫","🎉"];
  for(let i=0;i<14;i++){ const s = document.createElement("span"); s.className = "spark"; s.textContent = emo[i % emo.length];
    const ang = (Math.PI*2)*(i/14) + Math.random()*0.5, dist = 70 + Math.random()*110;
    s.style.left = cx + "px"; s.style.top = cy + "px";
    s.style.setProperty("--dx", (Math.cos(ang)*dist).toFixed(0) + "px");
    s.style.setProperty("--dy", (Math.sin(ang)*dist).toFixed(0) + "px");
    s.style.animationDelay = (i*10) + "ms"; stage.appendChild(s); setTimeout(()=> s.remove(), 950); } }
/* dynamic Swiftie buddy: swap pose + a little pop on every reaction (correct/wrong/explain/celebrate) */
// [20a mascot-01] moods -> production EXPRESSIONS (head webp), not idle-gif basenames.
const SW_POSE = { talk:"talking", point:"talking", idle:"talking", happy:"celebrate", celebrate:"celebrate",
                  hint:"hint", teach:"hint", idea:"hint", tryagain:"tryagain" };
const SW_STILL = (() => { try { const q=new URLSearchParams(location.search);
  return q.has("still") || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); } catch(e){ return false; } })();
let swMood = "point";
/* Swiftie's mouth animates ONLY while a voice clip is sounding; the instant audio ends we freeze to
   the still closed-mouth frame. Driven off isPlaying (toggled by setPlaying at every clip start/end). */
function swApplyPose(){ /* [20a] retired: heads no longer couple to isPlaying (setSwMood drives them). */ }
function _swApplyPose_dead(){ const img = document.getElementById("swBuddyImg"); if(!img) return;
  img.src = "assets/UI/" + (isPlaying ? (SW_POSE[swMood] || SW_POSE.talk) + ".gif" : SW_REST + ".png");
  img.style.display = ""; }
function setSwMood(m){ swMood = m;
  const img = document.getElementById("swBuddyImg"), w = document.getElementById("swBuddy");
  if(!img) return;
  const expr = SW_POSE[m] || "talking";
  const animated = expr !== "talking" && !SW_STILL;   // resting face is the static talking head
  img.onerror = () => { img.onerror = null; img.src = "assets/UI/mascot.webp"; };   // [mascot-10]
  const bust = (animated && expr === "celebrate") ? ("?r=" + (state.slideStart || 1)) : "";  // [mascot-08] replay play-once
  img.src = "assets/UI/sw_head_" + expr + (animated ? "_anim" : "") + ".webp" + bust;
  if(w) w.dataset.expr = expr; }
function confettiCannon(){
  /* [30j] CONFETTI FALLS FROM THE TOP OF THE ENTIRE PAGE (Yasir, stated twice and final).
     Parented to <body> in VIEWPORT coords with position:fixed — NOT to .slide-stage, which is inset in
     the viewport, so spawning at the stage's top edge visibly begins part-way down the page. z-index
     sits above the end-screen overlay, or the celebration that matters most is the one you cannot see.
     Same .conf-shot element and --tx/--ty contract, so the existing CSS keyframes still drive it. */
  const VW = window.innerWidth || 1200, VH = window.innerHeight || 800;
  const host = document.body;
  const cols = ["#F9695E","#FDC23C","#4EBE6A","#4EA3F0","#9B7BE8","#FF8FB1"];
  for(let i=0;i<48;i++){ const c = document.createElement("i"); c.className = "conf-shot";
    c.style.background = cols[i % cols.length];
    c.style.position = "fixed";
    c.style.left = ((i + 0.5) * (VW / 48) + (Math.random()*16 - 8)).toFixed(0) + "px";
    c.style.top = "-14px";
    c.style.bottom = "auto";
    c.style.zIndex = "100001";
    c.style.setProperty("--tx", ((Math.random()*140 - 70)).toFixed(0) + "px");
    c.style.setProperty("--ty", (VH + 40).toFixed(0) + "px");
    c.style.animationDelay = (Math.random()*420).toFixed(0) + "ms";
    host.appendChild(c); setTimeout(()=> c.remove(), 2600); } }
/* slide audio path: per slide, we look at slide.audio.prompt / .phoneme / etc.
   In this v0.1 the embedded card holds short ids; the compiler would replace
   them with base64 data URIs. We resolve to assets/Audio/{id}.mp3 with fallback. */
function audioFor(slide, key){
  if(!slide.audio || !slide.audio[key]) return null;
  return "assets/Audio/" + slide.audio[key] + "." + AUDIO_EXT;
}
/* audioText(slide,key): the exact Hindi line the VO for this slot speaks, so a
   popup can SHOW what it SAYS (shown == spoken). Looks up the build-injected
   CARD.assets.audio_text map by the slot's audio_id. null if unknown. */
function audioText(slide, key){
  const id = slide.audio && slide.audio[key];
  if(!id) return null;
  return (CARD.assets && CARD.assets.audio_text && CARD.assets.audio_text[id]) || null;
}
/* Play a SEQUENCE of audio sources back-to-back. Each one finishes (or
   falls back to silent beat if missing) before the next starts. */
function playChain(srcs, i, onDone){
  i = i || 0;
  if(i >= srcs.length){ if(onDone) onDone(); return; }
  play(srcs[i], () => playChain(srcs, i+1, onDone));
}
/* On slide mount, play prompt → phoneme/word_name → instruction in order.
   KG learners can't read prompt_hi — the chain gives them both the
   instruction AND the cue (letter sound or picture name) audibly.
   onDone fires after the whole chain finishes (used to gate the नav button). */
function autoPlayChain(slide, onDone){
  const order = ["prompt","phoneme","shape_name","word_name","instruction"];
  const chain = [];
  for(const k of order){
    const src = audioFor(slide, k);
    if(src) chain.push(src);
  }
  if(chain.length) playChain(chain, 0, onDone);
  else if(onDone) onDone();
}

/* nav button: enable/disable the kit-style pill. When it becomes active (the
   activity is done) but the child doesn't tap आगे, the hand-nudge points at it. */
function setNavActive(on){
  const btn = $("navBtn");
  btn.disabled = !on;
  btn.classList.toggle("active", on);
  clearTimeout(state.navNudgeTimer);
  /* [20a nudge-03] no auto-nudge on आगे — buttons are known affordances (ruling); nudge is for learning elements only. */
}
function nudgeNavBtn(){
  const btn = $("navBtn");
  if(!btn.classList.contains("active") || state.hintActive) return;
  const nh = $("nudgeHand");
  const r = btn.getBoundingClientRect();
  const sw = document.querySelector(".slide-stage").getBoundingClientRect();
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  nh.style.left = ((r.left - sw.left)/scale + r.width/scale/2 - 48) + "px";
  nh.style.top  = ((r.top  - sw.top )/scale + r.height/scale/2 - 6) + "px";
  nh.classList.add("show","hint-glow");
}

/* ---------- 4. STATE ---------- */
const state = {
  idx: 0,
  slideStart: Date.now(),
  attempts: 0,
  audioReplays: 0,
  hintUsed: false,
  nudgeUsed: false,
  scaffoldLevel: 0,   // 0 none, 1 nudge, 2 hint, 3 reveal
  selectedKey: null,
  locked: false,
  hintActive: false,
  helpShown: false,   // [25d] terminal-help rung shown for this slide (no auto-answer)
  masteryHits: 0,
  masteryAttempts: 0,
  nudgeTimer: null
};

/* ---------- 5. NUDGE ----------
   target may be a CSS selector OR an element. Used for flow guidance (e.g. the "listen" button /
   prompt). It used to be forbidden to point at the correct answer; as of [27b] there is ONE
   sanctioned exception — a TUTORIAL slide whose answer is already being revealed (the .reveal-hold
   glow after the 2nd wrong attempt) also gets the hand, because at that rung the answer is on
   screen anyway. See revealAnswer() in mountTapOptions. Everywhere else the old rule stands. */
function startNudge(slide, target){
  clearTimeout(state.nudgeTimer);
  if(!target) return;
  /* [28i] THE ROUND-3 HAND BAN IS ENFORCED HERE, NOT LEFT TO CARD DATA.
     This is why Yasir's "no hand nudge in the 3rd round" kept coming back after I kept reporting it
     fixed. 28f closed the answer/tap paths (handOnAnswer + HAND_PHASES), but the drag/count PROGRESS
     cue arrives through here, and the only round-3 guard was the card's own
     scaffold_rules.nudge_timeout_ms[phase] — which 22 of 27 games set to `independent: 8000`
     (two also set practice). So on a drag or count slide in round 3, 8s of hesitation still produced
     a hand. Card data cannot be the guard for a hard rule; the engine refuses now, and a card that
     still arms round 3 is simply ignored rather than silently obeyed. */
  /* IDLE is stricter than TERMINAL HELP. handOnAnswer() allows guided, because there the hand is
     EARNED by two failed attempts. This path is the un-earned one — armed by a timer at mount — and
     Yasir's rule covers it exactly: "any form of visual hint will only be given after 2 failed
     attempts", and separately "in guided, a hand nudge appears right after VO is played but the hand
     nudge should appear only after 2 failed attempts". So the idle/progress hand lives in TUTORIAL
     only, where it is teaching rather than hinting. Round 2 keeps its hand via terminal help; round 3
     has none by either route. */
  if(!IDLE_HAND_PHASES.has(slide.phase)) return;
  const ms = (CARD.scaffold_rules.nudge_timeout_ms || {})[slide.phase];
  if(!ms) return;
  state.nudgeTimer = setTimeout(()=>{
    // [27e] ...and never once TERMINAL HELP owns the hand. The flow nudge is armed at mount, so at
    // guided (5000ms) it fired AFTER a 2-wrong reveal and re-pointed the hand away from the glowing
    // answer to the flow target — the hand was visible but pointing at nothing useful. Caught by
    // measuring the hand's rect against the correct cell's; `handShown:true` alone hid the bug, and
    // it silently affected the 27b tutorial hand too.
    if(state.locked || state.hintActive || state.helpShown) return;
    const el = (typeof target === "string") ? document.querySelector(target) : target;
    if(!el) return;
    /* [28i] ONE POSITIONING RULE, ONE COPY OF IT. This function carried its own duplicate of the old
       formula (top = elementBottom - 30), so the 28h "hand sits BELOW the tile, never on its word" fix
       landed in pointNudgeAt and silently did NOT apply to any progress cue — the same fingertip-over-
       the-label bug, still live on every drag and count tile. Delegated instead of re-implemented, so
       the next placement change cannot miss one of the two call paths again. */
    pointNudgeAt(el);
    state.nudgeUsed = true;
    state.scaffoldLevel = Math.max(state.scaffoldLevel, 1);
    SwiftPAL.emit("nudge_invoked", { slide_id: slide.id, phase: slide.phase });
  }, ms);
}
function stopNudge(){
  clearTimeout(state.nudgeTimer);
  if(state._handTravel){ try { state._handTravel.cancel(); } catch(e){} state._handTravel = null; }
  $("nudgeHand").classList.remove("show");
}
/* [28o] ON A DRAG, THE HAND SHOWS THE MOVE — it does not just sit on the tile.
   Yasir 2026-07-28: "on drag, the hand nudge guides the student precisely... move the hand nudge from
   the question card to the answer card." A static hand on the tile says "this one" but never says WHERE
   it goes, which on a matching slide is the actual thing the child has to work out. The hand now starts
   on the tile and slides to the correct zone, on a loop, so the gesture itself is demonstrated.
   Positions are computed in DESIGN px against .slide-stage, exactly like pointNudgeAt, so it survives
   --scale. Kept as ONE WAAPI animation stored on state so stopNudge can cancel it — an infinite
   animation left running would follow the child into the next slide. Falls back to a static point if
   either element is missing or the browser has no .animate(). */
function travelNudge(fromEl, toEl, slide){
  if(!fromEl) return;
  if(!toEl || typeof $("nudgeHand").animate !== "function"){ handOnAnswer(fromEl, slide); return; }
  if(!slide || !HAND_PHASES.has(slide.phase)) return;      // same phase rule as handOnAnswer
  stopNudge();
  const nh = $("nudgeHand");
  const sw = document.querySelector(".slide-stage").getBoundingClientRect();
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  const at = (el)=>{ const r = el.getBoundingClientRect();
    return { left: (r.left - sw.left)/scale + r.width/scale/2 - 48,
             top:  (r.top  - sw.top )/scale + r.height/scale + 4 }; };
  const a = at(fromEl), b = at(toEl);
  nh.style.left = a.left + "px"; nh.style.top = a.top + "px";
  nh.classList.add("show","hint-glow");
  state._handTravel = nh.animate(
    [ { left: a.left+"px", top: a.top+"px", offset: 0 },
      { left: a.left+"px", top: a.top+"px", offset: .18 },
      { left: b.left+"px", top: b.top+"px", offset: .72 },
      { left: b.left+"px", top: b.top+"px", offset: 1 } ],
    { duration: 1800, iterations: Infinity, easing: "ease-in-out" });
}
/* [28i] THE GRADED WRONG-ANSWER CLIP, for mechanics that grade their own feedback.
   Yasir's 2026-07-25 ruling is "two hints everywhere, every game, every interaction type". The tap path
   got it in 24a (mountTapOptions) and the drag path in 25a (dragWrong), but the PRODUCE mechanics grade
   their own wrong answers and so inherited neither: MAKE_SET played try_again on rung 1, MAKE_EQUAL had
   no ladder at all, TAP_ALL_WITH_SOUND played only try_again, and BUILD_TO_NUMBER passed `null` — its
   wrong-answer feedback was SILENT, text-only, to a pre-reader who cannot read it.
   Callers increment state.attempts BEFORE speaking, so attempts===1 is the first wrong. Additive: with
   no hint1/hint authored this returns exactly the try_again it returned before, so no card regresses —
   but check_system will now stop reporting these six games' authored hints as unreadable. */
/* [28k] OPTIONAL MIDDLE RUNG — the SME's three-hint ladder (Pehli Dhwani, Bindu 2026-07-28):
     rung 1  "फिर से कोशिश कीजिए।"                           (try again)
     rung 2  "शब्द को बोलकर देखिए, और पहली ध्वनि चुनिए।"       (a STRATEGY, not the answer)
     rung 3  the correct answer
   Our ladder had only two rungs, so rung 2 spoke `hint` — the level that NAMES the answer. A middle
   rung lets a card withhold the answer for one more attempt.
   ADDITIVE AND DECK-SCOPED: with no `hint2` authored this returns exactly the `hint` it returned
   before, so every other game keeps two rungs and Yasir's 2-attempt standard. Only a card that
   authors hint2 AND raises max_attempts to 3 gets a third rung — a deliberate deck-specific override,
   ruled by Yasir 2026-07-28 ("implement as per written by the SME") after the conflict with "blocks
   after the 2nd wrong attempt" was raised with him. Do NOT roll this out fleet-wide without the same
   explicit ask on that deck. */
function midHint(slide){
  return audioFor(slide, "hint2") || audioFor(slide, "hint") || audioFor(slide, "try_again") || null;
}
function wrongClip(slide){
  return (state.attempts <= 1)
    ? (audioFor(slide, "hint1") || audioFor(slide, "try_again") || null)
    : (midHint(slide));                                     /* [28k] rung 2 */
}
/* Show the hand-nudge immediately on a specific element (INTRO uses it to guide
   tapping each letter). Finger points up; fingertip sits just inside the tile's
   lower edge. References .slide-stage (the nudge's positioning context). */
/* [28f] THE ONE RULE FOR THE GUIDING HAND (Yasir 2026-07-28, two rulings merged):
     round 1 tutorial  -> hand allowed (it is teaching)
     round 2 guided    -> hand ONLY after 2 failed attempts (terminal help), never on idle
     round 3 practice / independent / mastery -> NO HAND AT ALL, "regardless of whatever name we
                          save it by"
   Every terminal-help path calls THIS, so the rule lives in one place. That matters: 27d put the hand
   in one of five paths and I reported it as "every phase", which is exactly how this drifted. Any new
   mechanic gets the rule for free by calling handOnAnswer() instead of pointNudgeAt().
   Also note the hand was COVERING the option label in Yasir's capture — another reason round 3 is
   better off without it. */
/* [28l] HARD RULE (Yasir 2026-07-28): "regardless of what interaction, as long as we in guided or
   practice, no question will be solved automatically."
   Only a TUTORIAL slide may finish a question by itself — there it is a teaching demonstration. In every
   test phase the terminal rung must GLOW the answer, DISABLE the other candidates, put the hand on it
   (handOnAnswer is itself phase-gated, so round 3 still gets no hand) and WAIT for the child.
   This existed per-mechanic and drifted three times: 25d fixed MATCH_DRAG_N and SENTENCE_FIND, and left
   PATTERN_BUILD and SEQUENCE_COMPLETE still calling placeCorrect() on a 1s timer — the engine filling in
   the answer. MATCH_GENDER_PAIRS and SEQUENCE_DRAG held the glow but never dimmed the distractors or
   showed the hand. One contract in one place so a new mechanic inherits it instead of re-deciding. */
const MAY_AUTOSOLVE = new Set(["tutorial"]);
function maySolveFor(slide){ return !!slide && MAY_AUTOSOLVE.has(slide.phase); }
function terminalHold(target, others, slide, dest){
  if(!target) return;
  target.classList.add("reveal-hold");
  [...(others || [])].forEach(x=>{
    if(x !== target && !x.classList.contains("used") && !x.classList.contains("snapped")
       && !x.classList.contains("matched")){
      x.classList.add("tile-disabled");
      x.style.setProperty("pointer-events","none","important");
      x.style.setProperty("opacity",".4","important");
    }
  });
  /* [28o] on a DRAG the caller passes the destination zone, so the hand demonstrates the move
     (tile -> its correct zone) instead of only naming the tile. Tap mechanics pass no dest and keep
     the static point. */
  if(dest) travelNudge(target, dest, slide); else handOnAnswer(target, slide);
}
function clearHold(container){
  if(!container) return;
  [...container.children].forEach(x=>{
    x.classList.remove("reveal-hold","tile-disabled");
    x.style.removeProperty("pointer-events"); x.style.removeProperty("opacity");
  });
}
const HAND_PHASES = new Set(["tutorial", "guided"]);
/* [28i] the UN-EARNED hand (idle timer / progress cue) is tutorial-only — see startNudge. */
const IDLE_HAND_PHASES = new Set(["tutorial"]);
function handOnAnswer(el, slide){
  if(!el || !slide || !HAND_PHASES.has(slide.phase)) return;
  stopNudge();          // the flow nudge must not drag the hand off the answer
  pointNudgeAt(el, true);   // earned by 2 failed attempts — the one case allowed outside tutorial
}
function pointNudgeAt(el, earned){
  if(!el) return;
  /* [28j] THE PHASE RULE LIVES HERE, because this is the only function that can enforce it.
     I gated startNudge (28i) and handOnAnswer (28f) and Yasir STILL found a hand in round 3 — on
     MTKGA01_L04_S01 P5, a COUNT_TAP practice slide. Reason: ~25 call sites call pointNudgeAt DIRECTLY,
     and every one of them bypassed both gates. COUNT_TAP's nudgeNext is the clearest case: the slide is
     child-driven in round 3, nothing is being demonstrated, and the hand points at the very object the
     child is meant to find. Gating each call site is what produced three rounds of "fixed" that were
     not; the rule has to sit at the single choke point instead.
     Default is TUTORIAL ONLY — so every existing raw call site (demo chains, progress cues, count
     nudges) becomes correct by construction, and any future mechanic inherits the rule for free.
     `earned` is the one opt-in: handOnAnswer passes it for terminal help, which Yasir does allow in
     guided because two failed attempts paid for it. Round 3 gets no hand by ANY route. */
  const _ph = (CARD.slides[state.idx] || {}).phase;
  if(!(earned ? HAND_PHASES : IDLE_HAND_PHASES).has(_ph)) return;
  const nh = $("nudgeHand");
  /* Placement is computed TWICE: now, and once more on the next frame. Measuring text rects only helps
     if the text has stopped moving, and a teach slide places the hand while its card is still animating
     in — GENDER_INTRO T3 measured 0% coverage on the first sample and 17% on the next, as .cat-word
     settled underneath an already-positioned hand. One rAF re-place costs nothing and makes the
     measurement match what the child actually sees. */
  requestAnimationFrame(()=>{ if(nh.classList.contains("show")) _placeNudge(el, nh); });
  _placeNudge(el, nh);
  nh.classList.add("show","hint-glow");
}
function _placeNudge(el, nh){
  if(!el || !el.getBoundingClientRect) return;
  const r = el.getBoundingClientRect();
  const sw = document.querySelector(".slide-stage").getBoundingClientRect();
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  nh.style.left = ((r.left - sw.left)/scale + r.width/scale/2 - 48) + "px";
  /* [28h] THE HAND SITS BELOW THE TILE, NEVER ON ITS WORD.
     Yasir 2026-07-28: "hand nudge is overlapping the word, so the hand nudge is to be placed lower."
     The old line put the fingertip 56 design-px INSIDE the bottom edge — fine for a bare picture tile
     (the original caller), fatal once handOnAnswer() started pointing at .opt-cell, whose bottom strip
     IS the label. Measured on HI01H01_L02_S05 P1: hand 859-951 x 576-668 vs label 852-958 x 587-614,
     i.e. the hand covered 92 of the label's 106px width and ALL of its height — the child was shown
     the answer with the answer hidden under a hand.
     Now the hand's top starts just past the tile's bottom edge, so it can never cover tile content
     whatever the tile is. Clamped: if that would push it off the bottom of the stage, it goes ABOVE
     the tile instead (still adjacent, still unambiguous) rather than being silently clipped away. */
  /* [28j] PLACEMENT, corrected twice over. 28h moved the hand below the tile and introduced two new
     failures, both measured on real builds:
       (a) EMPTY SKY. The "flip above if it would run off the stage" clamp put the hand 100-395px ABOVE
           a tall TAP_IN_SCENE hotspot (a whole standing figure), i.e. in open sky pointing at nothing,
           on 4 of 6 guided slides of HI01H07_L01_S02. Flipping is wrong for this hand: it points UP,
           so above the target it points away from it. Clamp INSIDE the stage instead — at worst it
           overlaps the target's lower edge, which is where it used to live and is still unambiguous.
       (b) A LABEL BELOW THE ANCHOR. Anchoring to the bottom of the element PASSED IN only helps when
           that element contains the text. GENDER_INTRO passes the cat IMAGE while .cat-word sits below
           it inside the card, so "below the image" landed straight on the word — 56% covered on T3
           (better than 28h's 100%, still wrong). Assuming the anchor encloses the label is what made
           this a per-mechanic whack-a-mole, so instead of anchoring smarter we MEASURE: find real text
           rects near the landing spot and drop below the lowest one. That works for any mechanic,
           including ones not written yet. */
  const HAND_H = 96, GAP = 4, stageH = sw.height/scale;
  const top = (r.top - sw.top)/scale, h = r.height/scale;
  let below = top + h + GAP;
  // Push past any TEXT that sits below the anchor but shares its horizontal span (the label case).
  const _tile = el.closest(".opt-cell, .gender-cat, .sentence-word, .tut-card, .q-cell, .ms-item") || el.parentElement;
  if(_tile){
    _tile.querySelectorAll(".lbl, .cat-word, .sw-text, .opt-label, .story-q-opt-label, .pic-label, .count-badge")
      .forEach(t => {
        const tr = t.getBoundingClientRect();
        if(tr.width < 2 || tr.height < 2) return;
        if(tr.right < r.left || tr.left > r.right) return;      // not in this column — ignore
        const tb = (tr.bottom - sw.top)/scale;
        if(tb > below - HAND_H && tb + GAP > below) below = tb + GAP;   // clear it
      });
  }
  // Never off-stage, and never flipped above (see (a)) — clamp into the stage as a last resort.
  if(below + HAND_H > stageH) below = Math.max(0, stageH - HAND_H);
  nh.style.top = below + "px";
}

/* ---------- 6. IDLE VO REPLAY [27b] ----------
   Yasir 2026-07-27: "in guided and practice, when no interaction, make the vo play again at exactly
   after 7 seconds of no interaction." A child who stalls hears the question again instead of sitting
   in silence. Distinct from the hand-nudge above (that POINTS, this SPEAKS) and from the manual
   replay chip — same guards as the chip, but fired by inactivity rather than a tap.

   SCOPE = EVERY test phase (27d, Yasir 2026-07-27: the 7s replay "needs to be all uniform and done
   and perfected" for the 50-game batch). Was guided+practice only, which silently skipped
   `independent` and `mastery` — Antim's I1/I2 + M1-M3 had no idle replay while its G/P slides did.
   Inconsistency across a 50-game fleet is worse than either behaviour, so all four test phases now
   behave identically. `tutorial` stays excluded on purpose: teaching slides either self-play
   (data.auto) or gate on the child tapping through, so an idle timer there would talk over the
   lesson. CELEBRATION is excluded by type: it expects no interaction and self-narrates.

   FIRES EXACTLY ONCE PER SLIDE (27f, Yasir 2026-07-27: "it only needs to be repeated once ... once
   the audio is played after 7 second, no need to be replayed after that"). The first cut re-armed
   after every fire, so a child — or an unattended tab — heard the prompt again every 7s forever;
   he caught it as sound coming from a test tab I had left open. One reminder, then silence.
   A correct answer (state.locked) holds it, and the slide teardown clears it, so a timer can never
   leak across slides. 7000ms is the default, overridable per card via
   scaffold_rules.idle_vo_replay_ms. */
const IDLE_VO_PHASES = new Set(["guided", "independent", "practice", "mastery"]);
// 100ms tick so the fire lands within 0.1s of the target (a 500ms tick measured 7.1-8.0s in-browser,
// and he asked for EXACTLY 7s). Cost is 10 boolean checks/sec on test slides only.
const IDLE_VO_TICK = 100;
let _idleVoTimer = null, _idleSince = 0, _idleVoFired = false;
function stopIdleVo(){ clearInterval(_idleVoTimer); _idleVoTimer = null; _idleSince = 0; }
/* Called by mountSlide so the ONE allowed reminder is per SLIDE, not per lesson. Kept separate from
   stopIdleVo() on purpose: stopIdleVo is also called for transient reasons (wrong phase, teardown)
   and must NOT hand a slide a second reminder. */
function resetIdleVo(){ stopIdleVo(); _idleVoFired = false; }
/* The 7s is 7s of SILENCE AND no touching — the clock only runs while the game is quiet, so the
   replay lands 7s after the prompt stops, never on top of it. (First cut used a plain 7s setTimeout
   that re-armed a FULL 7s whenever it found audio playing, which stretched the real delay to as much
   as 14s — measured in-browser, it never fired. A ticker that resets the silence clock is exact.) */
function armIdleVo(){
  if(_idleVoFired){ stopIdleVo(); return; }      // [27f] one reminder per slide — already spent
  _idleSince = 0;                                // any (re)arm restarts the silence clock
  const slide = CARD.slides[state.idx];
  if(!slide || slide.type === "CELEBRATION" || !IDLE_VO_PHASES.has(slide.phase)){ stopIdleVo(); return; }
  if(_idleVoTimer) return;                       // ticker already running for this slide
  const ms = (CARD.scaffold_rules && CARD.scaffold_rules.idle_vo_replay_ms) || 7000;
  _idleVoTimer = setInterval(()=>{
    const s = CARD.slides[state.idx];
    if(!s || s.type === "CELEBRATION" || !IDLE_VO_PHASES.has(s.phase)){ stopIdleVo(); return; }
    // HOLD (not stop) on every transient busy flag. state.locked MUST be a hold: besides "answered
    // correctly" it is also set TRANSIENTLY while reveal_seq narrates the options one by one (see the
    // _enableAll() that clears it). Treating it as terminal killed the ticker 0.6s into every guided
    // slide — measured in-browser, which is the only way this was visible. Slide teardown is what
    // really ends the watch, and after a correct answer the hold simply means nothing more is spoken.
    if(state.locked || state.hintActive || isPlaying || state.revealing || state.demoRunning){ _idleSince = 0; return; }
    if(!_idleSince){ _idleSince = Date.now(); return; }
    if(Date.now() - _idleSince < ms) return;
    // [27f] ONE reminder, then done for this slide. Mark spent and stop the ticker BEFORE speaking,
    // so a pointerdown arriving during the replay cannot re-arm it.
    _idleVoFired = true;
    stopIdleVo();
    SwiftPAL.emit("idle_vo_replay", { slide_id: s.id, phase: s.phase });
    if(state.replayAudio) state.replayAudio(); else autoPlayChain(s);
  }, IDLE_VO_TICK);
}
// ONE document-level listener for the whole session (a per-slide listener would pile up across the
// drag slides — the same trap the drag mechanics warn about). armIdleVo() itself re-checks phase, so
// a pointerdown on a tutorial slide is a cheap no-op.
document.addEventListener("pointerdown", ()=>{ armIdleVo(); }, true);

/* ---------- 7. HINT / FEEDBACK BOX ----------
   No button: the popup plays its VO, then auto-dismisses. onEnd runs after it
   closes (callers add a short pause there so the revealed answer shows). */
function showBox(emoji, text, theme, audioSrc, onEnd){
  { const hb=document.getElementById("hintBtn"); if(hb) hb.classList.remove("hint-glow"); }
  // CORRECT: no popup (lead review) — confetti cannons from both sides + Swiftie cheer, then onEnd.
  if(theme === "correct"){
    sfxCorrect(); confettiCannon(); setSwMood("celebrate");
    play(audioSrc || null, ()=> setTimeout(()=>{ if(onEnd) onEnd(); }, 300));
    return;
  }
  state.hintActive = true;
  // wrong/hint/reveal keep a light card (mechanics use it for a short cue); Swiftie reacts too.
  // one-Swiftie rule: the popup shows the reacting Swiftie (animated), so HIDE the header buddy
  // while it's open — never two Swifties on screen at once (MoM flag).
  const swMap = { wrong:"sw_lg_hint_anim", hint:"sw_lg_hint_anim", reveal:"sw_lg_hint_anim" };  // [20a mascot-11] overlay mascot: retired non-existent sw_anim_*.gif → production's shipped sw_lg_hint_anim.webp
  const sw = $("hintMascot");
  if(sw){ sw.style.display=""; sw.src = "assets/UI/" + (swMap[theme] || "sw_lg_hint_anim") + ".webp"; }
  const buddy = $("swBuddy"); if(buddy) buddy.style.visibility = "hidden";
  setSwMood(theme === "wrong" ? "tryagain" : "hint");
  $("hintBox").classList.remove("celebrate");
  sfxWrongSoft();
  const ht = $("hintText"); ht.textContent = text; ht.className = "hint-text " + theme;
  $("stage").classList.add("blurred");
  $("hintOverlay").classList.add("show","hint-glow");
  $("hintBtn").disabled = true;
  const hi = $("hintImg"); if(hi) hi.src = "assets/UI/hint_active.png";
  const close = ()=>{
    $("hintOverlay").classList.remove("show");
    $("stage").classList.remove("blurred");
    if(buddy) buddy.style.visibility = "";   // header Swiftie returns when the popup closes
    state.hintActive = false;
    if(hi) hi.src = "assets/UI/hint.png";
    if(!state.locked) $("hintBtn").disabled = false;
    if(onEnd) onEnd();
  };
  // auto-dismiss after the VO finishes (small buffer so it never just flashes); freeze the popup
  // Swiftie's mouth to the still frame the instant its line ends
  play(audioSrc, ()=>{ if(sw) sw.src = "assets/UI/sw_head_talking.webp"; setTimeout(close, 300); });
}

/* ---------- 8. TAP-OPTION HELPER (shared by 5 slide types) ---------- */
function mountTapOptions({slide, host, signalName, stimulus, options, isCorrect, optionRenderer, columnsHint, mastery, hintAction, nudgeTarget, shuffle}){
  state.attempts = 0; state.selectedKey = null; state.locked = false;
  state.audioReplays = 0; state.hintUsed = false; state.nudgeUsed = false; state.scaffoldLevel = 0; state.helpShown = false;
  // idle hand-nudge target: defaults to the stimulus (re-listen), but a slide can pass
  // nudgeTarget:null to suppress it entirely (e.g. "how many?" — nothing to re-tap).
  const _nudge = (nudgeTarget !== undefined) ? nudgeTarget : (stimulus || null);
  // optional custom hint (runs on the live slide instead of a text popup), e.g. a
  // count-demonstration. Wrapped to block option taps while it plays.
  const runHint = hintAction ? (after)=>{ state.hintActive = true; hintAction(()=>{ state.hintActive = false; if(after) after(); }); } : null;

  // Shuffle options once so the correct answer isn't pinned to one position (engine-wide anti
  // positional-bias — otherwise "always tap the same spot" can pass mastery). Opt out with
  // shuffle:false for inherently-ordered options (e.g. a number line).
  const _opts = (shuffle === false) ? options.slice()
    : (function(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; })(options);

  const wrap = document.createElement("div"); wrap.className = "q-row";
  if(stimulus){ wrap.appendChild(stimulus); }
  const grid = document.createElement("div");
  const cols = columnsHint || (_opts.length <= 2 ? 2 : _opts.length <= 3 ? 3 : 4);
  grid.className = "opt-grid cols-" + cols;
  // [24a A2] TAP GATE (fork-proven, gender #53+#56): one tap at a time — the tapped word must END
  // before the next tap counts (_busy, 4s _vb fail-safe so a superseded onEnd can't soft-lock), AND
  // taps are ignored while ANY VO sounds (prompt / feedback / idle-replay) — silent-VO spam-tap fix.
  let _busy = false;
  /* [28t] A TAP DURING FEEDBACK AUDIO MUST COUNT, NOT VANISH. The gate below ignores taps while ANY VO
     sounds — added in 24a to stop spam-tapping during the PROMPT, which is right. But the hint clip after
     a wrong answer is also "VO sounds", so a child who taps again while hint1 is still speaking had that
     attempt SILENTLY DISCARDED: they tapped twice, the engine counted once, and terminal help never
     arrived. That defeats the whole 2-attempt ladder through a side door.
     `_fb` marks feedback audio specifically. During it a tap is accepted and interrupts the clip (one
     voice at a time is preserved by stopAudio); during the prompt, taps are still ignored. */
  let _fb = false;
  _opts.forEach((opt, i) => {
    const cell = optionRenderer(opt, i);
    cell.classList.add("opt-cell");
    cell.dataset.key = String(i);
    cell.onclick = ()=>{
      if(state.locked || state.hintActive || _busy || (isPlaying && !_fb) || cell.classList.contains("crossed") || cell.classList.contains("correct") || cell.classList.contains("faded")) return;   /* [25d] .faded = an option disabled by terminal help; refuse it in JS too */
      stopNudge();
      if(_fb){ stopAudio(); _fb = false; }   /* [28t] a retry interrupts the hint — never two voices */
      // SME rule: SPEAK THE TAPPED WORD on EVERY tap (right or wrong), then the feedback — never two
      // voices at once (buzz/confetti are sfx, they ride alongside the word). opt.audio = word clip id.
      // Fallback wiring for LETTER options (SME: the tapped item's own sound speaks EVERYWHERE): options
      // authored as {letter:"आ"} carry no audio id, but the slide's data.phonemes map has each letter's
      // clip — derive it here centrally so every TAP_LETTER_* / mastery module inherits speak-on-tap
      // without per-module or per-card changes. Explicit opt.audio always wins.
      const _aid = opt.audio ||
                   (opt.letter && slide.data && slide.data.phonemes && slide.data.phonemes[opt.letter]) || null;
      const _word = _aid ? ("assets/Audio/" + _aid + "." + AUDIO_EXT) : null;
      // [24a A2] _busy covers the word-speak beat; the 4s _vb fail-safe clears the gate even if the
      // word's onEnd is superseded (e.g. the volume chip tapped mid-word) — gender #53 soft-lock fix.
      _busy = true;
      const _vb = setTimeout(()=>{ _busy = false; }, 4000);
      const _afterWord = (cb)=>{ const done = ()=>{ clearTimeout(_vb); _busy = false; cb(); };
        if(_word) play(_word, done); else done(); };
      if(isCorrect(opt, i)){
        state.locked = true; cell.classList.add("correct"); sfxCorrect(); confettiCannon(); setSwMood("happy");
        if(mastery){ state.masteryAttempts++; if(state.attempts === 0) state.masteryHits++; }
        SwiftPAL.emit(signalName, { slide_id: slide.id, phase: slide.phase, value: true,
          first_try: state.attempts === 0, attempts: state.attempts + 1,
          scaffold_level: state.scaffoldLevel, latency_ms: Date.now()-state.slideStart });
        /* [27j] SPEAK audio.correct AFTER the tapped word. It was never read here: the correct branch
           only spoke the option's own word and went straight to completeSlide, so an SME's
           per-question correct feedback ("शाबाश! रवि ने सुबह दूध पिया।") was silent on every
           STORY_QUESTION — 12 slides across 2 games. It cannot be folded into the option's own audio
           because those slides use data.reveal_seq. TAP_IN_SCENE already played this id, which is why
           the ids are authored and valid, just unread. A card with no `correct` id behaves exactly as
           before (play(null) is a silent beat), so this is additive. */
        _afterWord(()=> play(audioFor(slide, "correct") || null,
                            ()=> setTimeout(()=> completeSlide(true), 700)));
      } else {
        state.attempts++; sfxWrongSoft(); setSwMood("tryagain");
        /* [28p] 1st WRONG = A RED FLASH ON A STILL-LIVE CARD. 2nd = GREY AND DISABLED.
           Yasir 2026-07-28: "1st wrong must flash a RED GLOW on a still-live card; disabling/greying
           belongs ONLY at 2 wrong attempts. Today it is the opposite." He is right, and it was my own
           28e over-correction: 28e ruled that a DISABLED option is never red, but implemented it on
           `.crossed`, which is the class used for BOTH states — so it also bleached the momentary
           first-wrong feedback and left a ~700ms grey disable with no red anywhere.
           Two classes now, one per meaning: `.wrong-flash` is the transient red buzz and keeps the card
           TAPPABLE (nothing is being taken away on a first miss), `.crossed` stays the grey permanent
           lock from the 2nd attempt. 28e's ruling is preserved exactly — red never rests on a disabled
           card — while red returns to the one place it belongs. */
        /* [28r] BOTH wrong attempts flash RED FIRST. Yasir 2026-07-28: "on second wrong attempt as
           well we are supposed to give the red glow first and then disable." The red IS the "that is
           not it" feedback, so it belongs on every wrong tap; the grey lock is an EXTRA consequence
           that only the 2nd earns. 28p gave the 2nd wrong the grey lock with no red at all, so the
           child lost the feedback exactly when they most needed it. Sequence now: red buzz -> (2nd
           only) settle to the grey disabled state. */
        cell.classList.add("wrong-flash");
        // [27a] RETRYABLE WRONG TAP (Yasir ruling 2026-07-27 — resolves the blocked behavioural
        // ruling (a) in _ENGINE_GAPS_CONFIRMED_2026-07-27.md, and matches the blessed strilling
        // fork): a wrong card must NOT lock on the first miss. It buzzes red, then UNBLOCKS so the
        // child can try that same card again — "they should only be blocked after 2nd wrong
        // attempt ... just disable the button after 2nd wrong attempt". From attempt 2 onward the
        // .crossed lock stays, so a single card cannot burn every attempt. Ships with the CSS half
        // (the ✕ ::after is gone from .opt-cell.crossed) — without it the giant ✕ would flash and
        // vanish, which the gaps doc flags as worse than either end state.
        /* [28d] THE UNBLOCK MUST NOT DEPEND ON state.locked. Yasir calls the stuck red ring "a
           constantly repeated issue", and this guard is why: state.locked is NOT only "answered
           correctly" — it is also set TRANSIENTLY while reveal_seq narrates the options (see the
           _enableAll() that clears it). If the 700ms landed inside that window the removal was
           SKIPPED, so .crossed stayed forever: a permanent red ring on a permanently dead card.
           I found that same state.locked trap later while fixing the idle-VO ticker and wrote it
           down there, but never propagated it back here — and I had SEEN the red persist in testing
           and wrongly explained it away as a frozen-timeline artifact.
           Now it keys off THIS cell only: it is still crossed, was never answered correctly, and
           terminal help has not taken over. Nothing shared, nothing transient. */
        setTimeout(()=>{
          if(cell.classList.contains("correct")) return;   // this cell ended up being the answer
          /* [28s] NO state.helpShown EARLY-RETURN HERE. That guard exists to stop the old code UNBLOCKING
             a card once terminal help owns the board — but this timer no longer unblocks, it swaps the RED
             FLASH for the GREY LOCK. At the 2nd wrong, terminal help fires in the same beat, so helpShown
             was already true and the swap was skipped: the card stayed RED FOREVER. That is the exact
             stuck-red-ring failure I fixed in 28d and reintroduced in a new form 700ms later. Removing the
             flash and applying the lock is correct whether or not terminal help is up — a wrong card should
             read the same as the distractors terminal help fades. */
          cell.classList.remove("wrong-flash");
          if(state.attempts >= 2) cell.classList.add("crossed");
        }, 700);
        // (do NOT count masteryAttempts here — the correct branch counts one attempt PER ITEM.)
        SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
        // LAYERED SCAFFOLD (A1): L1 re-listen → L2 hint → L3 REVEAL at max_attempts (never stuck).
        const _maxA = (CARD.scaffold_rules && CARD.scaffold_rules.max_attempts) || 3;
        $("hintBtn").classList.add("show","hint-glow");
        _afterWord(()=>{   // speak the tapped word FIRST, then the layered feedback VO (no overlap)
          _fb = true;                        /* [28t] from here the audio is FEEDBACK — a retry may interrupt it */
          if(state.attempts >= _maxA){ revealAnswer("wrong"); _fb = false; }
          else if(state.attempts >= 2){ state.scaffoldLevel = Math.max(state.scaffoldLevel, 2);
            if(runHint) runHint(); else play(midHint(slide), ()=>{ _fb = false; }); }   /* [28k] rung 2 */
          // [24a A2] 1st wrong: the slide's OWN hint1 clip when authored ("यह … नहीं है…"), else the
          // generic try_again — additive, cards without hint1 are byte-for-byte unchanged.
          else { state.scaffoldLevel = Math.max(state.scaffoldLevel, 1); play(audioFor(slide, "hint1") || audioFor(slide, "try_again") || null, ()=>{ _fb = false; }); }
        });
      }
    };
    grid.appendChild(cell);
  });
  wrap.appendChild(grid);
  host.appendChild(wrap);

  // ---- layered-hint helpers (A1/B2): reveal-on-max + a wired manual hint button ----
  function _correctCell(){ return [...grid.querySelectorAll(".opt-cell")].find(c => isCorrect(_opts[+c.dataset.key], +c.dataset.key)); }
  /* [25d] TERMINAL HELP — never hand the child the answer (Yasir 2026-07-27: "we are not supposed to
     give the correct answer by ourself anywhere at all, it is always the student who has to finalize
     it"). This used to lock the slide, mark the correct cell .correct, and auto-advance after 800ms —
     i.e. the game solved it for them. Now: the wrong options are hard-disabled, the correct one keeps
     an infinite glow and STAYS TAPPABLE, and nothing advances until the child taps it. Same contract
     as the drag mechanics' terminalHelp(). `state.locked` is deliberately NOT set, or the correct cell
     could not be tapped; `state.helpShown` marks the rung for telemetry + prevents re-entry. */
  function revealAnswer(reason){
    if(state.helpShown || state.locked) return;
    state.helpShown = true; state.scaffoldLevel = 3; setSwMood("hint");
    const el = _correctCell();
    [...grid.querySelectorAll(".opt-cell")].forEach(c => {
      if(c !== el){
        c.classList.add("faded");
        c.style.setProperty("pointer-events","none","important");   // CSS alone is defeatable
        c.style.setProperty("opacity",".35","important");
      }
    });
    if(el){
      el.classList.remove("pop-in");        // .pop-in animation outranks the glow, so strip it first
      el.classList.add("reveal-hold");      // infinite pulse — "keeps breathing until you tap it"
      // [27d] The hand lands on the glowing answer in EVERY phase (Yasir 2026-07-27: "hand nudge in
      // guided ... needs to be all uniform and done and perfected"). 27b gated this to tutorial on
      // his earlier wording; that made guided/practice/independent/mastery reveal the answer with a
      // glow but no hand, which is exactly the inconsistency the 50-game batch must not ship.
      // Safe in every phase because we only reach here via terminal help — the glow has ALREADY
      // revealed the answer, so the hand gives nothing away; it just makes "tap THIS one"
      // unmissable for a 5-year-old. The child still has to tap it (terminal help never
      // auto-completes), and the cell's own onclick calls stopNudge(), so the hand clears on tap.
      // stopNudge() FIRST kills any flow-nudge timer already in flight, so it cannot fire a moment
      // later and drag the hand off the answer (see the [27e] guard in startNudge).
      stopNudge();
      handOnAnswer(el, slide);
    }
    SwiftPAL.emit("answer_revealed", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts, reason });
    // speak hint2 (the rung that NAMES the answer), then wait for the child — no auto-advance.
    play(audioFor(slide, "hint") || audioFor(slide, "reveal") || audioFor(slide, "correct") || audioFor(slide, "try_again") || null, ()=>{});
  }
  $("hintBtn").onclick = ()=>{ if(state.locked || state.hintActive) return;
    state.hintUsed = true; if(state.attempts < 1) state.attempts = 1;
    SwiftPAL.emit("hint_shown", { slide_id: slide.id, manual: true });
    if(runHint) runHint(); else play(audioFor(slide, "hint") || audioFor(slide, "try_again") || null, ()=>{}); };

  // Tap-to-answer standard: a WRONG tap = soft buzz + red ring, and the card UNBLOCKS after 700ms so
  // the child may retry it; from the 2nd wrong attempt the card stays disabled. NO red ✕ anywhere.
  // (Supersedes the earlier lead-review standard "soft buzz + ✕ + that card LOCKS" — reversed by
  // Yasir's ruling 2026-07-27, which also matches the blessed strilling fork. See [27a] above.)
  // a RIGHT tap = confetti cannons + Swiftie cheer, then auto-advance. No select-then-आगे for pick questions.
  $("navBtn").style.display = "none"; setNavActive(false);
  // [27c] AUTONOMOUS TEACHING (data.auto) — a TEACHING slide must run with ZERO child interaction
  // (Yasir 2026-07-27: "in teaching we need to have 0 student interaction ... the tapping part to be
  // done by student is also to be done by us itself"). Same contract as the INTRO / GENDER_INTRO /
  // MEET_WORD demos: we own the audio, every option tap is dead, and the chain answers the question
  // ITSELF — point at the picture and say the prompt → point at the right choice and say the teaching
  // line → mark it correct as its letter sounds → आगे unlocks. No confetti and no sfx: those are the
  // child's reward for answering, and nobody answered. Opt-in, so every non-auto slide is unchanged.
  if(slide.data && slide.data.auto){
    state.locked = true;              // option taps are no-ops for the life of the slide
    state.ownsAudio = true;           // suppress mountSlide's autoPlayChain — the chain plays the prompt
    state.demoRunning = true;         // [24a N8] a replay-chip tap must not gen-kill our own chain
    setSwMood("teach");
    $("navBtn").style.display = ""; setNavActive(false);   // आगे is the only control, and only once taught
    $("navBtn").onclick = ()=> completeSlide(true);
    const _correct = _correctCell();
    const _cOpt = _correct ? _opts[+_correct.dataset.key] : null;
    const _cAid = _cOpt && (_cOpt.audio ||
      (_cOpt.letter && slide.data.phonemes && slide.data.phonemes[_cOpt.letter]) || null);
    // NOTE the stimulus deliberately gets NO hand: pointNudgeAt() plants the fingertip 56px above
    // an element's bottom edge, which on a .stimulus-pic is exactly where its .lbl sits — the hand
    // covered the very word being taught ("घर") for the whole prompt beat. The hand's job here is to
    // carry the eye to the ANSWER, and there is nothing to tap on the picture anyway.
    const steps = [
      [null, audioFor(slide, "prompt")],
      [_correct || null, audioFor(slide, "instruction")],
      [_correct || null, _cAid ? "assets/Audio/" + _cAid + "." + AUDIO_EXT : null]
    ];
    // reveal = the same shape SENTENCE_SOUND's demo already uses: the answer goes green + pulses,
    // the other choices fade back, so a 5-year-old cannot mistake which one is being taught.
    const _reveal = ()=>{ if(!_correct) return;
      _correct.classList.add("correct", "reveal-pulse");
      [...grid.querySelectorAll(".opt-cell")].forEach(c => { if(c !== _correct) c.classList.add("faded"); }); };
    let si = 0, _demoDone = false;
    const finish = ()=>{ if(_demoDone) return; _demoDone = true;
      stopNudge(); state.demoRunning = false;
      _reveal();                                          // idempotent — the last step usually ran it
      setNavActive(true); };
    const step = ()=>{
      if(CARD.slides[state.idx] !== slide) return;        // navigated away → drop the chain
      if(si >= steps.length){ finish(); return; }
      const el = steps[si][0], src = steps[si][1]; si++;
      if(si === steps.length) _reveal();                  // answer lands WITH its sound
      if(el) pointNudgeAt(el);
      play(src || null, ()=> setTimeout(step, 500));
    };
    state.replayAudio = ()=> playChain(steps.map(s => s[1]).filter(Boolean), 0, ()=>{});
    setTimeout(step, 400);
    setTimeout(()=>{ if(CARD.slides[state.idx] === slide) finish(); }, steps.length * 5000 + 3000);   // FAIL-SAFE: never a dead आगे
    return;
  }
  // 16j: OPT-IN staggered option reveal + narrate-each-on-entry (SME wave "options एक-एक करके + सारे
  // बोलना"). Gate on slide.data.reveal_seq — ABSENT ⇒ default behaviour (all options at once), so every
  // existing/non-opted slide is byte-for-byte unchanged. When on: hide the cells, fade them in one by
  // one speaking each option's own clip (opt.audio, or the letter's phoneme), THEN enable taps + nudge.
  if(slide.data && slide.data.reveal_seq){
    // Options reveal one-by-one and each is spoken — but STRICTLY SEQUENCED so no VO ever overlaps
    // another: the prompt plays to COMPLETION, THEN each option word plays only after the previous
    // one ends (fixes "option words spoken before the prompt line finishes"). Every step carries a
    // hard fallback timer, plus a global force-enable, so a missing/blocked/late clip can never
    // soft-lock the game (the failure the old fixed-cadence version was guarding against).
    const _cells = [...grid.querySelectorAll(".opt-cell")];
    _cells.forEach(c => c.classList.add("opt-seq-hidden"));         // class controls hide (opacity+pointer) — reveal = remove class → natural state
    state.locked = true; state.ownsAudio = true;   // we narrate the prompt + options ourselves
    state.revealing = true;   // [24a N8] replay chip ignores taps mid-reveal (no stomping the reveal narration)
    let _done = false;
    const _enableAll = ()=>{ if(_done) return; _done = true; state.locked = false;
      state.revealing = false; state.ownsAudio = false;   // [24a N8] reveal over → the chip may replay the chain again
      _cells.forEach(c => c.classList.remove("opt-seq-hidden")); };   /* [28f] no idle hand */
    // play `src`, then run `next` when it ENDS; a per-clip fallback guarantees the chain always advances
    const _sayThen = (src, next)=>{
      if(_done || CARD.slides[state.idx] !== slide) return;         // [24a bug-hunt F1] _done → the 16s net already force-enabled; STOP the chain so its next play() can't gen-kill a correct tap's advance callback (soft-lock)
      let advanced = false, fb = null;
      const go = ()=>{ if(advanced || _done) return; advanced = true; if(fb) clearTimeout(fb); next(); };
      play(src || null, go);
      fb = setTimeout(go, 4500);                                    // safety net: never stall on one clip
    };
    const _revStep = (i)=>{
      if(_done || CARD.slides[state.idx] !== slide) return;         // [24a bug-hunt F1] navigated away OR net fired → abort the chain
      if(i >= _cells.length){ _enableAll(); return; }
      const c = _cells[i]; c.classList.remove("opt-seq-hidden");
      const opt = _opts[+c.dataset.key];
      const aid = (opt && opt.audio) || (opt && opt.letter && slide.data.phonemes && slide.data.phonemes[opt.letter]) || null;
      _sayThen(aid ? "assets/Audio/" + aid + "." + AUDIO_EXT : null, ()=> setTimeout(()=> _revStep(i + 1), 180));
    };
    _sayThen(audioFor(slide, "prompt") || null, ()=> _revStep(0));  // prompt FULLY, then options one at a time
    setTimeout(()=>{ if(CARD.slides[state.idx] === slide) _enableAll(); }, 16000);   // global safety net — never soft-lock
    return;
  }
  /* [28f] idle hand REMOVED on answerable slides — it fired at nudge_timeout_ms (guided 5000ms),
     i.e. right after the prompt VO, pointing at the stimulus before the child had tried anything.
     A visual hint is earned only by 2 failed attempts. Demo/progress nudges in the count and drag
     mechanics are untouched — those are teaching animations, not hints. */
}

/* ---------- 10. RENDER HELPERS ---------- */
/* Render a picture as the real PNG (assets/Images/<key>.png); if the file is
   missing it falls back to the emoji. Pass the image id (e.g. "pic_anaar"). */
/* [20a SORT-01] opt-in one-by-one tray reveal for SORT_GENDER/SORT_SHAPE (SME g3 pg12/17, asked 4x).
   Gated by slide.data.reveal_seq: hides the draggable tiles, fades them in one at a time speaking each
   item's own clip (tile.dataset.audio), then a SAFETY NET force-shows all so a missing/late clip can
   never soft-lock (mirrors the mountTapOptions reveal_seq). Sort games without reveal_seq are untouched. */
function sortSeqReveal(tray, slide){
  const tiles = [...tray.children];
  tiles.forEach(t => t.classList.add("sort-seq-hidden"));
  state.revealing = true;   // [24a N8] drag + replay chip both blocked while the tray is still revealing
  // [24a bug-hunt F2] narrate prompt→tiles OURSELVES (ownsAudio) so mountSlide's autoPlayChain does NOT
  // fire the prompt concurrently. The old fixed-cadence version let the prompt get CUT at 500ms and
  // TRUNCATED each tile clip at the 760ms tick (live in HI01H04_L03_S04 P1/M2). Now the prompt chain
  // plays to COMPLETION, THEN each tile reveals only after the previous tile's clip ENDS — mirroring the
  // mountTapOptions reveal_seq audio sequencing (not just its safety net).
  state.ownsAudio = true;
  state.replayAudio = ()=> autoPlayChain(slide);
  let i = 0, done = false;
  const enableAll = ()=>{ if(done) return; done = true; state.revealing = false; state.ownsAudio = false;
    tiles.forEach(t => t.classList.remove("sort-seq-hidden")); };
  // play `src`, run `next` when it ENDS; per-clip fallback so a missing/slow clip never stalls the chain
  const sayThen = (src, next)=>{
    if(done || CARD.slides[state.idx] !== slide) return;
    let advanced = false, fb = null;
    const go = ()=>{ if(advanced || done) return; advanced = true; if(fb) clearTimeout(fb); next(); };
    play(src || null, go); fb = setTimeout(go, 4500);
  };
  const step = ()=>{
    if(done || CARD.slides[state.idx] !== slide) return;         // navigated away / net fired -> abort
    if(i >= tiles.length){ enableAll(); return; }
    const t = tiles[i]; t.classList.remove("sort-seq-hidden"); i++;
    sayThen(t.dataset.audio ? "assets/Audio/" + t.dataset.audio + "." + AUDIO_EXT : null, ()=> setTimeout(step, 180));
  };
  autoPlayChain(slide, ()=> setTimeout(step, 250));               // prompt chain FULLY, then tiles one at a time
  setTimeout(()=>{ if(CARD.slides[state.idx] === slide) enableAll(); }, 16000);   // global safety net — never soft-lock
}
function imgOrEmoji(imgKey, emoji, imgClass, emojiClass){
  if(imgKey){
    const fb = String(emoji||"❓").replace(/'/g,"");
    return `<img class="${imgClass}" src="assets/Images/${imgKey}.${IMG_EXT}" alt="" `+
      `onerror="var s=document.createElement('span');s.className='${emojiClass}';s.textContent='${fb}';this.replaceWith(s);">`;
  }
  return `<span class="${emojiClass}">${emoji||"❓"}</span>`;
}
function letterCell(letter){
  const cell = document.createElement("div");
  cell.innerHTML = `<span class="big-glyph ink-glyph">${letter}</span>`;
  return cell;
}
/* ordering/seriation render (MTKGA02_L02_S02): an object at a given magnitude. by="size" scales the
   picture uniformly; by="length" draws a content-true rounded bar of width∝mag; by="weight" shows the
   picture at a uniform size (weight is not visual — the child uses known heaviness / the balance cue). */
function imgOrEmojiSized(img, emoji, px){
  const fb = String(emoji||"❓").replace(/'/g,"");
  if(img) return `<img class="ord-obj-img" style="width:${px}px;height:${px}px" src="assets/Images/${img}.${IMG_EXT}" alt="" `+
    `onerror="var s=document.createElement('span');s.className='ord-obj-emoji';s.style.fontSize='${Math.round(px*0.82)}px';s.textContent='${fb}';this.replaceWith(s);">`;
  return `<span class="ord-obj-emoji" style="font-size:${Math.round(px*0.82)}px">${emoji||"❓"}</span>`;
}
function renderOrdObj(o, by){
  if(by === "length"){ const w = {1:130,2:210,3:300}[o.mag] || 200;
    return `<div class="ord-bar" style="width:${w}px;background:${o.color||"#F5A623"}"></div>`; }
  // size AND weight scale the picture by visual magnitude — so a BIG-but-LIGHT balloon looks big and
  // tempts the child (bigger=heavier misconception), while the small stone is the correct heaviest pick.
  const px = {1:80, 2:116, 3:154}[o.mag] || 116;
  return imgOrEmojiSized(o.img, o.emoji, px);
}
function pictureCell(picture, emoji, imgKey){
  const cell = document.createElement("div");
  cell.innerHTML = imgOrEmoji(imgKey, emoji, "pic-img", "pic-emoji") + `<span class="lbl">${picture||""}</span>`;
  return cell;
}
function stimulusLetter(letter){
  const el = document.createElement("div"); el.className = "stimulus-letter";
  el.innerHTML = `<span class="ink-glyph">${letter}</span>`;
  return el;
}
function stimulusPic(picture, emoji, imgKey){
  const el = document.createElement("div"); el.className = "stimulus-pic";
  el.innerHTML = imgOrEmoji(imgKey, emoji, "img", "emoji") + `<span class="lbl">${picture||""}</span>`;
  return el;
}
/* gender helpers: an option card showing a gender label (पुल्लिंग/स्त्रीलिंग),
   and a stimulus card showing the target gender label. */
function genderLabelCell(label, gender){
  const cell = document.createElement("div");
  cell.innerHTML = `<span class="gender-label${gender==="F"?" fem":""}">${label}</span>`;
  return cell;
}
function stimulusGender(label, gender){
  const el = document.createElement("div");
  el.className = "stimulus-gender" + (gender==="F"?" fem":"");
  el.textContent = label;
  return el;
}

/* shape helpers (maths): render circle/square/triangle/rectangle as inline SVG in
   any colour / size / rotation (LO: recognise regardless of orientation or size).
   No image assets needed — shapes are pure geometry, so the sample renders offline. */
function shapeSVG(shape, opts){
  opts = opts || {};
  const color = opts.color || "#386AF6";
  const size  = opts.size  || 120;
  const rot   = opts.rotate || 0;
  let inner = "";
  if(shape === "circle")         inner = `<circle cx="50" cy="50" r="42" fill="${color}"/>`;
  else if(shape === "square")    inner = `<rect x="12" y="12" width="76" height="76" rx="0" fill="${color}"/>`;   // TRUE corners — teachable geometry is never rounded
  else if(shape === "triangle")  inner = `<polygon points="50,9 91,89 9,89" fill="${color}"/>`;
  else if(shape === "rectangle") inner = `<rect x="6" y="28" width="88" height="44" rx="0" fill="${color}"/>`;    // TRUE corners
  const g = rot ? `<g transform="rotate(${rot} 50 50)">${inner}</g>` : inner;
  return `<svg class="shape-svg" viewBox="0 0 100 100" width="${size}" height="${size}" `+
         `xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${g}</svg>`;
}
function shapeCell(o){
  const cell = document.createElement("div");
  cell.innerHTML = shapeSVG(o.shape, {color:o.color, size:130, rotate:o.rotate});
  return cell;
}
function stimulusShape(o){
  const el = document.createElement("div"); el.className = "stimulus-shape";
  el.innerHTML = shapeSVG(o.shape, {color:o.color, size:150, rotate:o.rotate});
  return el;
}

/* counting helpers (maths): a numeral option card (big numeral + small number word),
   and a stimulus box showing a set of `count` identical objects to be counted. */
function numberCell(numeral, word){
  const cell = document.createElement("div");
  cell.innerHTML = `<span class="num-glyph">${numeral}</span>` + (word ? `<span class="num-word">${word}</span>` : "");
  return cell;
}
/* VISUAL-FIRST quantity: a HAND showing n fingers up (assets/UI/hand_1..5) — pre-reader,
   NO number-word text. Falls back to the numeral only if n is outside 1..5 or the art is missing. */
function fingerCount(n, cls){ cls = cls || "finger-hand";
  if(!(n>=1 && n<=5)) return `<span class="num-glyph">${n}</span>`;
  return `<img class="${cls}" src="assets/UI/hand_${n}.png" alt="" ` +
    `onerror="var s=document.createElement('span');s.className='num-glyph';s.textContent='${n}';this.replaceWith(s);">`;
}
function fingerCell(n){ const c = document.createElement("div"); c.innerHTML = fingerCount(n, "opt-hand"); return c; }
/* DISPLAY numeral: ALWAYS Arabic (1 2 3) on screen — kids learn the universal digit.
   Spoken VO stays Hindi (एक/दो/तीन) via the separate vo_num_/vo_total_ audio files. */
function devNumeral(n){ return String(n); }
/* DUAL-CODED counting option: the Devanagari NUMERAL the child is learning, big and on top,
   with a smaller finger-hand beneath it as a visual anchor. The point of counting is to learn the
   NUMBER SYMBOL, not just read a hand-sign — so the numeral leads and the hand supports. Falls back
   to the numeral alone if the hand art (1..5) is missing. */
function numFingerCell(n){
  // outer div BECOMES the .opt-cell (mountTapOptions adds that class), so the stack lives in an
  // INNER .numfinger wrapper — otherwise ".opt-cell .numfinger x" selectors wouldn't match.
  const c = document.createElement("div");
  // hand art exists only for 1..5; beyond that fingerCount would fall back to a SECOND numeral
  // (numeral shown twice — hit when the counting range grew to 10), so skip the hand entirely.
  c.innerHTML = `<div class="numfinger"><span class="num-glyph">${devNumeral(n)}</span>${(n>=1&&n<=5) ? fingerCount(n, "nf-hand") : ""}</div>`;
  return c;
}
function stimulusCountSet(count, obj, scatter, perRow){
  // counts >10 render DENSE (smaller objects, wrapping); perRow groups the set in rows of exactly
  // N (the curriculum's "rows of 5/10" organisation for sets up to 20 — MTKGA01_L01_S04).
  const dense = count > 10 || !!perRow;
  const el = document.createElement("div"); el.className = "count-set" + (scatter ? " scattered" : "") + (dense ? " dense" : "");
  if(perRow && !scatter){ el.style.display = "grid"; el.style.gridTemplateColumns = `repeat(${perRow}, auto)`; }
  for(let i=0;i<count;i++){
    const c = document.createElement("span"); c.className = "cobj";
    // SCATTERED arrangement (SME/misconception: "total changes when objects are scattered") —
    // deterministic per-index jitter (stable across mounts/captures), never so large items overlap-hide.
    if(scatter) c.style.transform = `translateY(${((i*23)%25)-12}px) rotate(${((i*37)%21)-10}deg)`;
    c.innerHTML = imgOrEmoji(obj.img, obj.emoji, "cobj-img", "cobj-emoji");
    el.appendChild(c);
  }
  return el;
}
/* SME (S01 review deck): outside the tutorial, numeral options show the NUMBER ONLY, larger —
   no finger-hand support (fingers are a TEACHING aid, not a test aid). */
function bigNumCell(n){
  const c = document.createElement("div");
  c.innerHTML = `<span class="bignum-glyph">${devNumeral(n)}</span>`;
  return c;
}
/* COMPARE_SETS helpers (one-to-one matching → ज़्यादा / कम / बराबर).
   Two left-aligned rows (columns line up), a dashed connector drawn top[i]↔bottom[i]
   for each matched pair, and the unmatched leftover item(s) in the longer row glow —
   that glow IS the "which has more" proof. Offsets (not getBoundingClientRect) so it
   works even when the preview tab is throttled. */
function cmpObj(obj){
  const c = document.createElement("span"); c.className = "cobj";
  c.innerHTML = imgOrEmoji(obj.img, obj.emoji, "cobj-img", "cobj-emoji");
  return c;
}
function stimulusCompareSets(data){
  const nA = data.a_count, nB = data.b_count, A = data.a_object, B = data.b_object;
  const NS = "http://www.w3.org/2000/svg";
  const stage = document.createElement("div"); stage.className = "compare-stage";
  const rowA = document.createElement("div"); rowA.className = "cmp-row top";
  const rowB = document.createElement("div"); rowB.className = "cmp-row bot";
  const svg  = document.createElementNS(NS, "svg"); svg.setAttribute("class", "cmp-lines");
  for(let i=0;i<nA;i++) rowA.appendChild(cmpObj(A));
  for(let i=0;i<nB;i++) rowB.appendChild(cmpObj(B));
  stage.appendChild(rowA); stage.appendChild(svg); stage.appendChild(rowB);
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "cmp-match-btn";
  btn.textContent = "🔗 मिलाओ"; stage.appendChild(btn);
  const min = Math.min(nA, nB);
  let drawn = false;
  function draw(){
    while(svg.firstChild) svg.removeChild(svg.firstChild);
    const IA = [...rowA.children], IB = [...rowB.children];
    const y1 = rowA.offsetTop + rowA.offsetHeight - 4;
    const y2 = rowB.offsetTop + 4;
    for(let i=0;i<min;i++){
      const x = IA[i].offsetLeft + IA[i].offsetWidth/2;
      const ln = document.createElementNS(NS, "line");
      ln.setAttribute("x1", x); ln.setAttribute("y1", y1);
      ln.setAttribute("x2", x); ln.setAttribute("y2", y2);
      ln.setAttribute("class", "cmp-line"); svg.appendChild(ln);
      setTimeout(()=> ln.classList.add("show"), 130*i);
    }
    const longer = nA > nB ? IA : nB > nA ? IB : null;   // null when equal (nothing left over)
    if(longer) for(let i=min;i<longer.length;i++)
      setTimeout(()=> longer[i].classList.add("leftover"), 130*min + 160);
  }
  // reveal the matching (child taps मिलाओ, or the hint/tutorial calls this). cb fires after it settles.
  stage._revealMatches = (cb)=>{ if(!drawn){ drawn = true; btn.disabled = true; draw(); }
    if(cb) setTimeout(cb, 130*min + 800); };
  btn.onclick = ()=> stage._revealMatches();
  if(data.show_matches){ btn.style.display = "none"; setTimeout(()=> stage._revealMatches(), 420); }
  return stage;
}
/* HINT for "how many": instead of a text popup, COUNT the set FOR the child —
   highlight each object left→right, say एक/दो/तीन, show the numeral on top of it.
   The child sees + hears the count modelled, then answers from the options. */
function demoCount(items, numerals, onDone){
  numerals = numerals || [];
  const clear = ()=> items.forEach(o=>{ o.classList.remove("counting"); const c=o.querySelector(".count-callout"); if(c) c.remove(); });
  clear();
  let i = 0;
  (function step(){
    if(i >= items.length){                       // last count landed → clear, then continue
      setTimeout(()=>{ clear(); if(onDone) onDone(); }, 1000);
      return;
    }
    const o = items[i];
    o.classList.add("counting");
    let cal = o.querySelector(".count-callout");
    if(!cal){ cal = document.createElement("span"); cal.className = "count-callout"; o.appendChild(cal); }
    cal.textContent = String(i+1);   // Arabic count callout; Hindi number-word is spoken separately
    play("assets/Audio/vo_num_" + (i+1) + "." + AUDIO_EXT, ()=>{ i++; setTimeout(step, 320); });
  })();
}
function demoCountSet(setEl, count, numerals, onDone){   // count the "how many?" stimulus set
  demoCount([...setEl.querySelectorAll(".cobj")].slice(0, count), numerals, onDone);
}

/* ---------- 10b. DEVANAGARI GLYPH INK-CENTERING ----------
   Devanagari glyphs carry matras above (ओ, औ, अं) and below (ऋ) the shirorekha,
   so plain flex `align-items:center` leaves them sitting high with a gap below —
   and the offset differs per glyph. Measure each glyph's real ink box (canvas
   actualBoundingBox) + its baseline in the DOM, then translateY so the INK is
   truly centred in its tile/box. Font-agnostic; recomputed on mount + fonts.ready. */
let _inkCtx = null;
function centerInkGlyph(span){
  if(!span || !span.parentElement) return;
  const glyph = (span.textContent || "").trim();
  if(!glyph) return;
  const box = span.parentElement;
  const cs = getComputedStyle(span);
  const fpx = parseFloat(cs.fontSize);
  if(!fpx) return;
  _inkCtx = _inkCtx || document.createElement("canvas").getContext("2d");
  // --- WIDTH-FIT (16m+): shrink font so the word never spills its box. Applies to EVERY
  // ink-glyph (drag tiles, mastery stimulus, tap tiles), not just MEET_LETTER's _mlFit —
  // that fix only touched the teaching slide, so माला/नाक/पापा still overflowed dd-tile /
  // stimulus-letter on the practice slides (Yasir catch #6). Baseline size captured once in
  // data-ink-base so this is idempotent across re-runs (mount + fonts.ready + resize).
  const _base = span.dataset.inkBase ? parseFloat(span.dataset.inkBase) : fpx;
  if(!span.dataset.inkBase) span.dataset.inkBase = String(_base);
  const _bcs = getComputedStyle(box);
  const _availW = box.clientWidth - (parseFloat(_bcs.paddingLeft)||0) - (parseFloat(_bcs.paddingRight)||0);
  _inkCtx.font = `${cs.fontWeight} ${_base}px ${cs.fontFamily}`;
  /* [28i] FIT THE INK, NOT THE ADVANCE — the SME's original "decrease the size of the words so that
     they all fit perfectly inside the box", which the 16m width-fit did not actually achieve.
     Devanagari PAINTS wider than it advances: the shirorekha and the matras overhang, so ink runs
     ~4-11px past measureText().width. The failure was not a wrong scale factor, it was the BRANCH: a
     word whose advance fits `_availW` never entered the shrink path at all, so its ink overflow was
     never even considered. Measured with this same canvas API at the real computed size on
     HI01H04_L02_S02: P6 यह ink 66 vs box 59, बकरी 138/132, एक 91/85, T4 कहाँ 184/180 — all four had a
     fitting advance and were therefore left alone. Fit whichever of the two actually paints wider, so
     a Latin/numeral glyph (ink <= advance) behaves exactly as before and nothing else in the fleet
     shifts. The 0.94 safety margin is kept; with ink as the base it is now margin rather than the
     only thing standing between the word and the border. */
  const _mB = _inkCtx.measureText(glyph);
  const _inkW = (isFinite(_mB.actualBoundingBoxLeft) && isFinite(_mB.actualBoundingBoxRight))
    ? (_mB.actualBoundingBoxLeft + _mB.actualBoundingBoxRight) : _mB.width;
  /* TWO BUDGETS, because ink and advance are not competing for the same space.
     The ADVANCE must fit the CONTENT box (unchanged from 16m — that is the layout contract).
     The INK must merely not cross the BORDER, and padding is exactly the room provided for overhang:
     .sentence-word carries 30px each side, so a word whose ink runs 5px past the content edge is
     2.5px into a 30px cushion — invisible. My first pass fitted ink to the content box and would have
     shrunk almost every Devanagari word in the fleet to buy nothing; for a KG reader, needlessly
     smaller text is a real cost. So each budget constrains its own measure and the tighter of the two
     wins. A word only shrinks for ink when the ink would actually reach the border. */
  const _availInk = box.clientWidth;                       // padding box = inside the border
  let _sc = 1;
  if(_availW   > 8 && _mB.width > _availW)   _sc = Math.min(_sc, _availW   / _mB.width);
  if(_availInk > 8 && _inkW     > _availInk) _sc = Math.min(_sc, _availInk / _inkW);
  let _fpx = _base;
  if(_sc < 1) _fpx = Math.max(20, _base * _sc * 0.94);
  if(Math.abs(_fpx - fpx) > 0.5) span.style.fontSize = _fpx + "px";
  _inkCtx.font = `${cs.fontWeight} ${_fpx}px ${cs.fontFamily}`;
  const m = _inkCtx.measureText(glyph);
  /* [27h] F2 — SHARED BASELINE FOR A ROW OF WORDS.
     Ink-centring (actualBoundingBox*) is measured from THIS glyph's own ink, so every word lands
     differently: a word with an above-line matra (और/मैं/की/कौन) has a taller ascent, gets pushed
     further DOWN, and one with a below-line matra (तुम/फूल) sits HIGHER. Measured on 27g in one row:
     T1 एक 39 / घर 43 / और 59 · G2 यह 55 / वह 55 / मैं 75 · P5 तुम 45 / फूल 46 / गेंद 68 / आम 61.
     That is a 23px spread inside a single row and it is exactly the SME's "text alignment of the
     words is not right" — written on 7 of 17 pages of one deck alone.
     Words in a row must share a BASELINE, so use FONT metrics (fontBoundingBox*), which are constant
     for a given font+size and therefore give every tile in the row the same dy.
     A LONE showcase glyph (MEET_LETTER's 200px letter) still uses ink metrics: there is no row to
     align with, and at that size font-box centring would sit it visibly low because the font box
     reserves descender room the letter does not use. */
  const _row = box.parentElement;
  const _inRow = !!_row && _row.querySelectorAll(".ink-glyph").length > 1;
  let a = m.actualBoundingBoxAscent, d = m.actualBoundingBoxDescent;
  if(_inRow && isFinite(m.fontBoundingBoxAscent) && isFinite(m.fontBoundingBoxDescent)){
    a = m.fontBoundingBoxAscent; d = m.fontBoundingBoxDescent;
  }
  if(!isFinite(a) || !isFinite(d)) return;
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  span.style.transform = "";   // reset before measuring baseline
  const probe = document.createElement("span");
  probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline;";
  span.appendChild(probe);
  const baseScreen = probe.getBoundingClientRect().top;
  span.removeChild(probe);
  const br = box.getBoundingClientRect();
  if(br.height < 5) return;    // not laid out yet
  const boxCenter = br.top + br.height/2;
  const inkCenter = baseScreen + ((d - a)/2) * scale;   // screen px
  const dy = (boxCenter - inkCenter) / scale;           // css px to move glyph down
  span.style.transform = `translateY(${dy}px)`;
}
function centerAllGlyphs(root){
  (root || document).querySelectorAll(".ink-glyph").forEach(centerInkGlyph);
}

/* ---------- 10c. IN-WORD MATRA COLOURING (AA / right-spacing matras) ----------
   Colour the matra RED *inside the word itself* (e.g. the ा in दादा) with no artifacts.
   Per-character fill CANNOT do this: द+ा shape as ONE cluster the browser colours as a
   unit — a <span>/<tspan> on the ा is ignored (colours by the base consonant), and forcing
   the ा into its own run inserts a dotted circle (◌ा). Verified at the pixel level. The clean
   way is a two-layer overlay: the whole word in the base colour + a RED copy of the SAME word
   clipped to just the matra's x-column(s). Both layers are the identical string at identical
   coords, so shaping is identical and the red lands exactly on the matra strokes (100% ink
   match vs the plain word, no ◌, no shift, no duplicate आ).
   ONLY valid for RIGHT-SPACING matras (matra owns its own right-hand column). Above/below/left
   matras (े ै ि ु ृ …) have no such column, so callers fall back to the old coloured callout.
   Extend the set ONLY after pixel-verifying the new matra's geometry. */
const RIGHT_SPACING_MATRAS = new Set(["ा"]);
const _COMB = /[ऀ-ःऺ-ॏ॑-ॗॢॣ]/;   // Devanagari combining marks
let _matraUid = 0, _mCv = null, _mCx = null;
/* Pixel-accurate RED column(s) for the matra(s) in `word`. The matra's vertical stroke ends at
   its advance, but its shirorekha (top bar) overhangs — a navy end-cap on the last matra, or the
   connector toward the next letter on a medial one. So: left = consonant advance; right = the next
   consonant's BODY left (found by scanning the LOWER band, below the continuous top bar) or the
   word's ink-right for the last cluster. That paints the whole matra + its bar red with no navy
   sliver, and stops before the next letter's body. Canvas raster uses the real Baloo 2 (recomputed
   on fonts.ready by refreshMatraWords, so fallback-metric first paints self-correct). */
function _matraClipCols(word, matra, fontPx){
  _mCx = _mCx || (_mCv = document.createElement("canvas")).getContext("2d");
  const ctx = _mCx, font = `800 ${fontPx}px "Baloo 2","Noto Sans Devanagari",sans-serif`;
  ctx.font = font;
  const ch = [...word], cl = []; let x = 0, i = 0;
  while(i < ch.length){ let j = i + 1, hasM = false;
    while(j < ch.length && _COMB.test(ch[j])){ if(ch[j] === matra) hasM = true; j++; }
    const cw = ctx.measureText(ch.slice(i, j).join("")).width;
    cl.push({ start: x, consW: ctx.measureText(ch[i]).width, cw, hasM }); x += cw; i = j; }
  const W = Math.ceil(x) + 4, H = Math.ceil(fontPx * 1.4);
  _mCv.width = W; _mCv.height = H; ctx.font = font; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#000";
  ctx.clearRect(0, 0, W, H); ctx.fillText(word, 0, Math.round(fontPx));
  const d = ctx.getImageData(0, 0, W, H).data, ink = (X, Y)=> d[(Y * W + X) * 4 + 3] > 40;
  let y0 = H, y1 = 0;
  for(let Y = 0; Y < H; Y++) for(let X = 0; X < W; X++){ if(ink(X, Y)){ if(Y < y0) y0 = Y; if(Y > y1) y1 = Y; break; } }
  const bTop = Math.round(y0 + (y1 - y0) * 0.40), bBot = Math.round(y1 - (y1 - y0) * 0.02);   // below the shirorekha
  const colInk = new Array(W).fill(false);
  for(let X = 0; X < W; X++) for(let Y = bTop; Y <= bBot; Y++){ if(ink(X, Y)){ colInk[X] = true; break; } }
  const runs = []; let s = null;
  for(let X = 0; X < W; X++){ if(colInk[X] && s === null) s = X; else if(!colInk[X] && s !== null){ runs.push([s, X - 1]); s = null; } }
  if(s !== null) runs.push([s, W - 1]);
  let inkRight = 0; for(let X = W - 1; X >= 0; X--){ let a = false; for(let Y = 0; Y < H; Y++){ if(ink(X, Y)){ a = true; break; } } if(a){ inkRight = X; break; } }
  const cols = [];
  cl.forEach((c, idx)=>{ if(!c.hasM) return;
    const advEnd = c.start + c.cw, left = c.start + c.consW;
    let right;
    if(idx === cl.length - 1){ right = inkRight + Math.max(4, fontPx * 0.06); }    // last cluster → generously past the end-cap (nothing to the right, so free)
    else { const before = runs.filter(r => r[0] < advEnd);                         // medial → the next consonant's body-left + ~1px, so the whole
           const matraRight = before.length ? before[before.length - 1][1] : advEnd; //   connector bar is red (only the body's faint AA edge is grazed)
           const next = runs.find(r => r[0] > matraRight);
           right = (next ? next[0] : advEnd) + Math.max(1, fontPx * 0.012); }
    cols.push([left, Math.max(right, advEnd)]);
  });
  return cols;
}
function _matraWordSVG(word, matra, fontPx){
  _mCx = _mCx || (_mCv = document.createElement("canvas")).getContext("2d");
  _mCx.font = `800 ${fontPx}px "Baloo 2","Noto Sans Devanagari",sans-serif`;
  const totalW = _mCx.measureText(word).width;
  const cols = _matraClipCols(word, matra, fontPx);
  const padX = fontPx * 0.12, asc = fontPx * 0.92, desc = fontPx * 0.30;
  const W = totalW + padX * 2, H = asc + desc, uid = "mw" + (++_matraUid);
  const esc = (s)=> String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const tAttr = `x="${padX.toFixed(2)}" y="${asc.toFixed(2)}" text-anchor="start" font-family="'Baloo 2','Noto Sans Devanagari',sans-serif" font-weight="800" font-size="${fontPx}"`;
  const clip = cols.map(([a,b])=>`<rect x="${(a+padX).toFixed(2)}" y="0" width="${Math.max(0,b-a).toFixed(2)}" height="${H.toFixed(2)}"/>`).join("");
  return `<svg class="matra-word" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}" width="${W.toFixed(2)}" height="${H.toFixed(2)}" role="img" aria-label="${esc(word)}">`
    + (cols.length ? `<defs><clipPath id="${uid}">${clip}</clipPath></defs>` : "")
    + `<text class="mw-base" ${tAttr}>${esc(word)}</text>`
    + (cols.length ? `<g class="mw-red" clip-path="url(#${uid})"><text ${tAttr}>${esc(word)}</text></g>` : "")
    + `</svg>`;
}
/* rebuild the matra SVGs (clip columns depend on font metrics — recompute once the web font
   has actually loaded, so a first paint with fallback metrics can't leave the red mis-clipped). */
function refreshMatraWords(root){
  (root || document).querySelectorAll(".meet-letter-box[data-mw-word]").forEach(box=>{
    box.innerHTML = _matraWordSVG(box.dataset.mwWord, box.dataset.mwMatra, parseFloat(box.dataset.mwFs) || 120);
  });
}

/* ---------- 11. DRAG-DROP PRIMITIVE ---------- */
function makeDraggable(tileEl, onDrop, opts){
  let startX=0, startY=0, dx=0, dy=0, dragging=false;
  let scale = 1;
  const refScale = ()=> scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1;
  function onDown(e){
    if(tileEl.classList.contains("snapped") || tileEl.classList.contains("matched")) return;
    if(state.revealing) return;   // [24a N8] tray still revealing one-by-one → no grabs yet (parity with the tap path's lock)
    refScale();
    dragging = true;
    // bind move/up on the document ONLY while dragging (removed in onUp) — otherwise every tile leaves
    // stale document listeners that pile up across the 11 drag slides.
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, {passive:false});
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
    document.addEventListener("touchcancel", onCancel);     // [24a bug-hunt F3] a cancelled touch (call, gesture-nav) must abort, not orphan listeners + leave the tile stuck mid-drag
    document.addEventListener("pointercancel", onCancel);
    const p = e.touches ? e.touches[0] : e;
    startX = p.clientX; startY = p.clientY;
    dx = 0; dy = 0;
    tileEl.classList.add("dragging");
    if(opts && opts.onPick) opts.onPick();   // e.g. show a nudge at the slot this tile belongs in
    e.preventDefault();
  }
  function onMove(e){
    if(!dragging) return;
    const p = e.touches ? e.touches[0] : e;
    dx = (p.clientX - startX) / scale; dy = (p.clientY - startY) / scale;
    tileEl.style.transform = `translate(${dx}px,${dy}px) scale(1.08)`;
    // highlight zone under — hide the tile from hit-testing so the dragged tile
    // (z-index 50, now covering the zone) doesn't mask the zone beneath it.
    const cx = p.clientX, cy = p.clientY;
    document.querySelectorAll(".dd-zone").forEach(z => z.classList.remove("hover"));
    tileEl.style.pointerEvents = "none";
    const under = document.elementFromPoint(cx, cy);
    tileEl.style.pointerEvents = "";
    const zone = under?.closest?.(".dd-zone");
    if(zone && !zone.classList.contains("filled")) zone.classList.add("hover");
    e.preventDefault();
  }
  function _unbind(){
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.removeEventListener("touchend", onUp);
    document.removeEventListener("touchcancel", onCancel);
    document.removeEventListener("pointercancel", onCancel);
  }
  function onCancel(){   // [24a bug-hunt F3] abort an interrupted drag: unbind + spring the tile back, never drop
    if(!dragging) return;
    dragging = false; _unbind();
    tileEl.classList.remove("dragging"); tileEl.style.transform = "";
    document.querySelectorAll(".dd-zone,.sort-bin").forEach(z => z.classList.remove("hover"));
  }
  function onUp(e){
    if(!dragging) return;
    dragging = false;
    _unbind();
    tileEl.classList.remove("dragging");
    const p = e.changedTouches ? e.changedTouches[0] : e;
    // hide the tile from hit-testing so we detect the zone underneath it
    tileEl.style.pointerEvents = "none";
    const under = document.elementFromPoint(p.clientX, p.clientY);
    tileEl.style.pointerEvents = "";
    const zone = under?.closest?.(".dd-zone");
    document.querySelectorAll(".dd-zone").forEach(z => z.classList.remove("hover"));
    if(zone && !zone.classList.contains("filled")){
      // snap
      tileEl.style.transform = "";
      onDrop(zone, tileEl);
    } else {
      tileEl.style.transform = "";
      if(Math.abs(dx) < 6 && Math.abs(dy) < 6 && opts && opts.onTap) opts.onTap();   // a tap (not a drag) → speak the word
    }
  }
  tileEl.addEventListener("mousedown", onDown);
  tileEl.addEventListener("touchstart", onDown, {passive:false});
}
/* [24a A1] DRAG VO-GATE (Yasir 2026-07-24, fork-proven in the HI01H08 gender file): while a VO is
   sounding, a press that would start a NEW drag is IGNORED, so picking up a tile can't cut the
   prompt/feedback voice — the drag equivalent of the tap gate in mountTapOptions. MUST run in the
   CAPTURE phase: MATCH_DRAG_N tiles carry their OWN speak-on-press listener (pointerdown, registered
   before makeDraggable's onDown) — an in-onDown `if(isPlaying)` check would see the tile's OWN audio
   and block every grab (total soft-lock). At capture time isPlaying still reflects the genuinely
   PRIOR VO. Gated on pointerdown + mousedown + touchstart so both the speak listener and onDown are
   swallowed. 4s safety via _voStart: a stalled clip must never freeze the tiles. Scoped to draggable
   game tiles only — replay chips, nav and tap-answer cells take presses as usual. */
(function installDragVoGate(){
  const SEL = ".sort-item, .dd-tile, .cdm-objtile, .cdm-card, .combine-drag";
  // ONE decision PER PRESS, made at pointerdown (the earliest event, BEFORE the tile's own
  // speak-on-press listener can flip isPlaying). The same press's trailing mousedown/touchstart
  // INHERIT that decision — re-evaluating them would see the press's OWN audio and block the very
  // grab that was just allowed (the trap, resurrected through event-type ordering).
  let _decision = 0, _decidedAt = 0;   // 0 = none · 1 = allow · 2 = block
  function decide(e, now){
    const t = e.target && e.target.closest && e.target.closest(SEL);
    if(!t || t.classList.contains("snapped") || t.classList.contains("matched")){ _decision = 0; return 0; }
    _decidedAt = now;
    _decision = (isPlaying && now - _voStart < 4000) ? 2 : 1;  // 4s safety: a stuck VO must not freeze the tiles
    return _decision;
  }
  function gate(e){
    const now = Date.now();
    let d;
    if(e.type === "pointerdown" || !_decision || now - _decidedAt > 400){
      d = decide(e, now);                                      // fresh press (or no pointer events on this browser)
    } else {
      d = _decision;                                           // trailing event of the SAME press → inherit
    }
    if(d === 2){ e.stopImmediatePropagation(); if(e.cancelable) e.preventDefault(); }   // swallow before speak-on-press + onDown
  }
  document.addEventListener("pointerdown", gate, true);
  document.addEventListener("mousedown", gate, true);
  document.addEventListener("touchstart", gate, {capture:true, passive:false});
})();
/* [24a A5] When a sort card is placed in a bin it LEAVES a faint, same-size dashed placeholder in
   the tray at its exact original spot (Yasir 2026-07-24, parity with the production gender game).
   The ghost holds the flex slot so the remaining tray cards don't shift, and marks where the card
   came from. Sized BEFORE the tile moves/shrinks (offsetWidth is read while it still sits in the tray). */
function leaveTrayGhost(tile){
  if(!tile || tile._ghosted) return;
  const tray = tile.parentElement;
  // [25c] The guard used to accept ONLY ".sort-tray", so calling this from MATCH_DRAG_N silently
  // did nothing — match tiles live in a ".dd-row". Accept every drag-SOURCE row so "ghost slots
  // wherever we have dragging" (Yasir 2026-07-25) actually holds. .sort-ghost is plain flex CSS,
  // so it lays out correctly in either container.
  const SOURCE_ROWS = ["sort-tray", "dd-row", "tile-row", "match-row"];
  if(!tray || !SOURCE_ROWS.some(c => tray.classList.contains(c))) return;
  const g = document.createElement("div");
  g.className = "sort-ghost";
  g.style.width = tile.offsetWidth + "px";
  g.style.height = tile.offsetHeight + "px";
  tray.insertBefore(g, tile);
  tile._ghosted = true;
}
/* shared wrong-drop response for drag/sort/sequence modules: soft buzz + Swiftie try-again pose + the
   authored spoken recovery. Pre-readers need the SPOKEN recovery, not just the visual spring-back.
   [24b] TWO-LEVEL DRAG HINTS (Yasir 2026-07-25: "everywhere, regardless of game or type of
   interaction, we are going to have two hints"). The tap path already graded its feedback in
   mountTapOptions; drag had NO hint clip at all (only try_again). Now: 1st wrong -> the slide's
   `hint1`; 2nd and later -> `hint` (the level that GIVES the answer). Every drag mechanic inherits
   this because all 12 wrong-drop sites funnel through here. The count is tracked per-slide inside
   this helper, so NO call site changes. Fully ADDITIVE: a card with no hint1/hint authored still
   plays try_again exactly as before, so sibling games are byte-for-byte unchanged in behaviour. */
let _dwSlide = null, _dwN = 0;
/* [LOCAL 2026-08-03 — HIKGH04_L02_S02] RE-ENTERING A SLIDE MUST RESTART THE LADDER AT RUNG 1.
   The guard below is `sid !== _dwSlide`, so re-entering the SAME slide leaves _dwN where it was and
   the child's FIRST mistake is answered with the rung-2 hint (hint1 skipped entirely). Caught while
   measuring the ladder for QA's "hint vo does not play" report: running G4 twice in a row logged
   [vo_hint2_ghar, ...] the second time instead of [vo_hint1_build, ...]. It matters in practice
   because QA reviews with the debug slide-picker, jumping between slides, and a replayed slide is a
   normal thing for a child too. mountSlide() calls this on every entry so the reset lives with the
   rest of the per-slide state, not in the wrong-answer path. */
function resetWrongLadder(){ _dwSlide = null; _dwN = 0; }
function dragWrong(slide, tile){
  sfxWrongSoft(); setSwMood("tryagain");
  const sid = slide && slide.id;
  if(sid !== _dwSlide){ _dwSlide = sid; _dwN = 0; }   // new slide -> restart the ladder
  _dwN++;
  // [25b] PER-PAIR hint2 on drag (Yasir 2026-07-25): the 2nd hint must name the tile the child is
  // holding AND the picture it belongs to — "यह 'क' है, यह 'कमल' की पहली ध्वनि है।" A single
  // slide-level clip can't do that, so when the caller passes the dragged tile we look up that
  // pair's own `hint2_audio`. Falls through to the slide-level hint when a pair has none authored.
  if(_dwN > 1 && tile && slide && slide.data && Array.isArray(slide.data.pairs)){
    const L = (tile.textContent || "").trim();
    const pr = slide.data.pairs.find(p => String(p.letter || "").trim() === L);
    if(pr && pr.hint2_audio){
      play("assets/Audio/" + pr.hint2_audio + "." + AUDIO_EXT, ()=>{});
      return;
    }
  }
  const clip = (_dwN <= 1)
    ? (audioFor(slide, "hint1") || audioFor(slide, "try_again"))
    : (midHint(slide) || audioFor(slide, "hint1"));          /* [28k] rung 2 (drag) */
  play(clip || null, ()=>{});
}

/* shared SUCCESS response — the engine-wide answer-feedback standard (lead-confirmed): side confetti
   cannons + rising sfx + Swiftie celebrates + the authored "correct" VO, then AUTO-ADVANCE. Never a
   celebration popup, never a "press आगे to continue" gate on a solved activity. `revealed` = the child
   got there via the reveal scaffold → quieter settle (no confetti/cheer) + completeSlide(false) so
   mastery telemetry stays honest. */
/* [LOCAL 2026-08-03 — HIKGH04_L02_S02] ADVANCE ON THE CLIP'S OWN END, NEVER A FIXED 1400ms.
   Yasir: "in g6 the audio gets cut when we placed both the correct answer cards." Measured on G6 with
   real playback: after terminal help, placing the final letter played vo_reveal_word and it was PAUSED
   at 1.30s of 1.96s by the NEXT slide's prompt — the child hears "यह सही शब…" chopped off.
   The cause is HERE, not in the phase gate: completeSlide() fired on a hard 1400ms timer while the clip
   ran 1960ms, so the advance always won. The celebrate path only LOOKED fine because those word clips
   are ~1.0-1.2s and fit inside 1400ms by luck — vo_reveal_word is the one that does not, and G6 is
   where the reveal path is easiest to reach. A duration-blind timer in front of authored VO is the bug.
   The 8s failsafe is NOT optional: play()'s onEnd is generation-guarded, so a replay-chip tap or a
   stalled clip can supersede it and it would never fire — without the cap that is a bricked slide.
   _advance is latched so whichever path wins calls completeSlide exactly once. */
function celebrateThenAdvance(slide, revealed){
  let _done = false;
  const _advance = (ok)=>{ if(_done) return; _done = true; completeSlide(ok); };
  const BREATH = 300, FAILSAFE = 8000;
  if(revealed){
    play(audioFor(slide, "reveal") || null, ()=> setTimeout(()=> _advance(false), BREATH));
    setTimeout(()=> _advance(false), FAILSAFE);
    return;
  }
  sfxCorrect(); confettiCannon(); setSwMood("celebrate");
  play(audioFor(slide, "correct") || null, ()=> setTimeout(()=> _advance(true), BREATH));
  setTimeout(()=> _advance(true), FAILSAFE);
}

/* ---------- 12. SLIDE MODULES ---------- */
const SlideModules = {
  INTRO: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "intro-stage";
      // [20a INTRO-PICS] additive PICTURE mode (g2 deck: demo with pictures, speak each word
      // one-by-one) — gated on data.pics [{img,emoji,audio},...]; letters mode untouched.
      const pics = Array.isArray(slide.data.pics) && slide.data.pics.length ? slide.data.pics : null;
      const items = pics || slide.data.letters;
      const clipOf = i => pics ? (pics[i].audio || null)
                               : ((slide.data.phonemes && slide.data.phonemes[items[i]]) || null);
      const keyOf  = i => pics ? (pics[i].img || String(i)) : items[i];
      const tapped = new Set();
      let _autoDone = false;   // [24a A3] auto mode: flips true once every card has been taught → taps become replays
      const tiles = [];
      // [16f] Size tiles to the REAL container (tut-card frame ~990px inside). Fit one row at
      // MAXW=960; below the 110px touch floor, WRAP into two balanced rows. Pics may run larger.
      const GAP = 20, MAXW = 960, n = items.length;
      let rowsOf;
      const CAP = pics ? 250 : 184;
      let tSize = Math.min(CAP, Math.floor((MAXW - (n-1)*GAP) / n));
      if (tSize >= 110) { rowsOf = [n]; }
      else {
        const top = Math.ceil(n/2), bot = n - top;
        tSize = Math.min(CAP, Math.floor((MAXW - (top-1)*GAP) / top));
        rowsOf = [top, bot];
      }
      const tFont = Math.round(tSize * 0.565);
      const rowEls = rowsOf.map(() => {
        const r = document.createElement("div"); r.className = "intro-letters";
        r.style.gap = GAP + "px"; return r;
      });
      const rowFor = i => (rowsOf.length === 1 || i < rowsOf[0]) ? rowEls[0] : rowEls[1];
      function nudgeNext(){
        for(let i=0;i<items.length;i++){
          if(!tapped.has(keyOf(i))){ pointNudgeAt(tiles[i]); return; }
        }
        stopNudge();
      }
      items.forEach((it, i) => {
        const tile = document.createElement("div");
        tile.className = pics ? "intro-letter intro-pic" : "intro-letter";
        tile.style.width = tile.style.height = tSize + "px";
        if(!pics) tile.style.fontSize = tFont + "px";
        tile.innerHTML = pics ? imgOrEmoji(it.img, it.emoji, "intro-pic-img", "intro-pic-emoji")
                              : `<span class="ink-glyph">${it}</span>`;
        tile.onclick = ()=>{
          // [24a A3] auto walk-through: card taps are IGNORED until every card has been taught
          // (the child can't cut the lesson off / jump ahead mid-teaching); once teaching completes,
          // a tap REPLAYS that card (vachan NUMBER_INTRO parity — tap-to-replay unlocks after teach).
          if(slide.data.auto){
            if(!_autoDone) return;
            tile.classList.add("played");
            const clip = clipOf(i);
            play(clip ? "assets/Audio/" + clip + "." + AUDIO_EXT : null);
            SwiftPAL.emit(pics ? "intro_pic_tap" : "intro_letter_tap", { slide_id: slide.id, letter: keyOf(i), replay: true });
            return;
          }
          tile.classList.add("played");
          const clip = clipOf(i);
          play(clip ? "assets/Audio/" + clip + "." + AUDIO_EXT : null);
          SwiftPAL.emit(pics ? "intro_pic_tap" : "intro_letter_tap", { slide_id: slide.id, letter: keyOf(i) });
          tapped.add(keyOf(i));
          if(tapped.size >= items.length){ stopNudge(); setNavActive(true); }
          else { nudgeNext(); }
        };
        rowFor(i).appendChild(tile); tiles.push(tile);
      });
      rowEls.forEach(r => wrap.appendChild(r));
      host.appendChild(wrap);

      setNavActive(false);
      $("navBtn").onclick = ()=>{ if(tapped.size >= items.length) completeSlide(true); };
      nudgeNext();
      // [16h] Phase-1 autonomous mode: tiles highlight + speak one by one BY THEMSELVES.
      if(slide.data.auto){
        stopNudge(); state.ownsAudio = true;
        let ai = 0;
        const aStep = ()=>{
          if(CARD.slides[state.idx] !== slide) return;
          if(ai >= items.length){ stopNudge();
            // [20a INTRO-AUDIO-FIX] the auto chain DROPPED the instruction VO (Yasir live catch #7,
            // verified on HIKGH02_L02_S01) — play it after the self-play, before आगे unlocks.
            // A missing clip falls back to a silent beat and still unlocks.
            play(audioFor(slide, "instruction") || null, ()=>{
              if(CARD.slides[state.idx] !== slide) return;
              _autoDone = true;   // [24a A3] teaching complete → card taps become per-card replays
              state.replayAudio = ()=> play(audioFor(slide, "prompt") || audioFor(slide, "instruction") || null, ()=>{});   // [24a N8] chip replays post-teach
              $("navBtn").onclick = ()=> completeSlide(true); setNavActive(true);
            });
            return; }
          const tile = tiles[ai];
          tile.classList.add("played"); pointNudgeAt(tile);
          const clip = clipOf(ai);
          ai++;
          play(clip ? "assets/Audio/" + clip + "." + AUDIO_EXT : null, ()=> setTimeout(aStep, 380));
        };
        play(audioFor(slide, "prompt") || null, ()=> setTimeout(aStep, 500));
      }   // start by guiding the first tile
    }
  },

  MEET_LETTER: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "meet-stage";
      // 16L: fit the glyph to the box (MEET here shows whole WORDS like काम, not single letters →
      // 200px overflowed the 300px box). Size by cluster count.
      // data.matra = the matra char (e.g. "ा"). For RIGHT-SPACING matras we now colour it RED
      // INSIDE the word itself (_matraWordSVG two-layer overlay); other matras keep the callout.
      const _mlFit = (s)=>{ const n=[...(s||"")].length; return n<=1?200 : n<=2?152 : n<=3?120 : n<=4?96 : 78; };
      const _box = (txt, matra)=> {
        const iw = matra && RIGHT_SPACING_MATRAS.has(matra);
        return `<div class="meet-letter-box"${iw ? ` data-mw-word="${txt}" data-mw-matra="${matra}" data-mw-fs="${_mlFit(txt)}"` : ""}>`
          + (iw ? _matraWordSVG(txt, matra, _mlFit(txt))
                : `<span class="glyph ink-glyph" style="font-size:${_mlFit(txt)}px">${txt}</span>`)
          + `</div>`;
      };
      if(slide.data.pair){
        const pair = document.createElement("div"); pair.className = "meet-pair";
        slide.data.pair.forEach(p => {
          const item = document.createElement("div"); item.className = "meet-pair-item";
          item.innerHTML = `
            ${_box(p.letter)}
            
            <div class="meet-pic-box">
              ${imgOrEmoji(p.picture_img, p.picture_emoji, "pic-img", "pic-emoji")}
              <span class="pic-label">${p.word_hi}</span>
            </div>`;
          pair.appendChild(item);
        });
        wrap.appendChild(pair);
      } else {
        wrap.innerHTML = `
          ${_box(slide.data.letter, slide.data.matra)}
          
          <div class="meet-pic-box">
            ${imgOrEmoji(slide.data.picture_img, slide.data.picture_emoji, "pic-img", "pic-emoji")}
            <span class="pic-label">${slide.data.word_hi}</span>
          </div>`;
      }
      // Right-spacing matras (ा …) are now coloured RED in-word by _box → no callout needed.
      // Other matras (े ै ि …) can't be recoloured in-word, so keep the coloured ◌<matra> callout.
      if(slide.data.matra && !RIGHT_SPACING_MATRAS.has(slide.data.matra)){
        const col = document.createElement("div"); col.className = "meet-col";
        col.appendChild(wrap);
        const mh = document.createElement("div"); mh.className = "matra-hint";
        mh.innerHTML = `इस शब्द की मात्रा — <span class="matra-hl ink-glyph">◌${slide.data.matra}</span>`;
        col.appendChild(mh);
        host.appendChild(col);
      } else {
        host.appendChild(wrap);
      }
      // 16m: AUTONOMOUS demo (data.auto) — the 3-phase contract kills passive show-and-tell
      // ("यह काम है"). The hand POINTS at the word + speaks it, then POINTS at the matra callout +
      // speaks its sound (the matra being pointed/spoken is the feasible "highlight the matra"),
      // then the picture; आगे is locked till the demo finishes, then explicitly wired (dead-button).
      if(slide.data.auto){
        state.ownsAudio = true; state.demoRunning = true; setNavActive(false); setSwMood("teach");   // [24a N8]
        const boxEl = host.querySelector(".meet-letter-box");
        const pillEl = host.querySelector(".matra-hl");   // exists only in the callout (non-right-spacing) path
        const picEl = host.querySelector(".meet-pic-box");
        const steps = [];
        if(boxEl) steps.push([boxEl, audioFor(slide, "prompt") || audioFor(slide, "word_name")]);
        if(slide.data.matra){
          // point at the matra + speak its sound. In-word (red) matra → point the word box and
          // PULSE the red matra; callout matra → point the ◌<matra> pill (old behaviour).
          const mAudio = slide.data.matra_audio ? "assets/Audio/" + slide.data.matra_audio + "." + AUDIO_EXT : null;
          steps.push([pillEl || boxEl, mAudio, pillEl ? null : "matra"]);
        }
        if(picEl) steps.push([picEl, audioFor(slide, "word_name")]);
        let si = 0, _done = false;
        const finish = ()=>{ if(_done) return; _done = true; stopNudge(); state.demoRunning = false; $("navBtn").onclick = ()=> completeSlide(true); setNavActive(true); };
        const step = ()=>{
          if(CARD.slides[state.idx] !== slide) return;                 // navigated away → abort
          if(si >= steps.length){ finish(); return; }
          /* [28p] TWO OF YASIR'S FOUR MEET_LETTER ASKS (2026-07-28, कप + जल screenshots).
             ARROW: the literal "→" between the letter box and the picture was markup inside this module,
             so no card could ever remove it. Gone from both MEET_LETTER paths. MEET_SHAPE / MEET_NUMBER /
             MEET_GENDER keep theirs — he named MEET_LETTER.
             HAND: the demo planted the hand on the letter box and then the picture; on a slide with one
             letter and one picture that "points at the obvious and adds nothing". Dropped. The one place
             it earns its keep is a word taught for BOTH sounds (जल = ज + ल), synced to whichever glyph is
             being spoken — that depends on displaying both letters, which is STILL OPEN, so no
             "is this two-letter" condition is guessed at here. */
          const stp = steps[si]; si++;
          const mw = stp[2] === "matra" ? stp[0].querySelector(".matra-word") : null;
          if(mw) mw.classList.add("mw-pulse");
          play(stp[1] || null, ()=>{ if(mw) mw.classList.remove("mw-pulse"); setTimeout(step, 450); });
        };
        $("navBtn").onclick = ()=> completeSlide(true);                 // explicit (dead-button lesson)
        state.replayAudio = ()=> play(audioFor(slide, "prompt") || null, ()=>{});
        setTimeout(step, 400);
        setTimeout(()=>{ if(CARD.slides[state.idx] === slide) finish(); }, steps.length * 4000 + 3000);   // FAIL-SAFE: आगे never stays dead if audio blocks/stalls
        return;
      }
      // नav unlocks only after the VO has played once (students can't skip the model)
      state.gateNavUntilAudio = true;
      setNavActive(false);
      $("navBtn").onclick = ()=> completeSlide(true);
    }
  },

  /* ===== SHAPES (maths) — reuse the same scaffold/nudge/feedback as letters ===== */
  SHAPE_INTRO: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "intro-stage";
      const row  = document.createElement("div"); row.className = "intro-shapes";
      const shapes = slide.data.shapes; const tapped = new Set(); const tiles = [];
      const GAP = 28, MAXW = 1220, n = shapes.length;
      const tSize = Math.max(120, Math.min(184, Math.floor((MAXW - (n-1)*GAP) / n)));
      row.style.gap = GAP + "px";
      function nudgeNext(){
        for(let i=0;i<shapes.length;i++){ if(!tapped.has(i)){ pointNudgeAt(tiles[i]); return; } }
        stopNudge();
      }
      shapes.forEach((sh, i) => {
        const tile = document.createElement("div"); tile.className = "intro-shape";
        tile.style.width = tile.style.height = tSize + "px";
        // name label (revealed on tap — child hears the name AND sees it on top of the shape)
        tile.innerHTML = `<span class="shape-name">${sh.name || ""}</span>` +
                         shapeSVG(sh.shape, {color: sh.color, size: Math.round(tSize*0.62), rotate: sh.rotate});
        tile.onclick = ()=>{
          tile.classList.add("played");
          play(sh.name_audio ? "assets/Audio/" + sh.name_audio + "." + AUDIO_EXT : null);
          SwiftPAL.emit("intro_shape_tap", { slide_id: slide.id, shape: sh.shape });
          tapped.add(i);
          if(tapped.size >= shapes.length){ stopNudge(); setNavActive(true); }
          else { nudgeNext(); }
        };
        row.appendChild(tile); tiles.push(tile);
      });
      wrap.appendChild(row); host.appendChild(wrap);
      setNavActive(false);
      $("navBtn").onclick = ()=>{ if(tapped.size >= shapes.length) completeSlide(true); };
      nudgeNext();
    }
  },

  MEET_SHAPE: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "meet-stage";
      wrap.innerHTML = `
        <div class="meet-shape-box">
          ${shapeSVG(slide.data.shape, {color: slide.data.color, size: 190, rotate: slide.data.rotate})}
          <span class="label">${slide.data.name}</span>
        </div>
        <div class="meet-arrow">→</div>
        <div class="meet-pic-box">
          ${imgOrEmoji(slide.data.object_img, slide.data.object_emoji, "pic-img", "pic-emoji")}
          <span class="pic-label">${slide.data.object_hi}</span>
        </div>`;
      host.appendChild(wrap);
      state.gateNavUntilAudio = true; setNavActive(false);
      $("navBtn").onclick = ()=> completeSlide(true);
    }
  },

  TRACE_SHAPE: {
    // [21c flag#2] PRODUCE gesture (re-adds the game's original trace, breaks pick-dominance): the child
    // FINGER-TRACES the named shape's outline — not a pick. Forgiving hit-corridor; ~80% of the outline
    // covered → success + side-confetti. Idle → a marker animates along the stroke to demonstrate. Shape
    // is UPRIGHT with SHARP corners (rotate forced 0, no rx — honours the locked 2D-shapes direction) and
    // a FIXED colour per shape. NO score / timer / number is ever shown. guide:"dotted" = full visible
    // dotted outline (Guided); guide:"faint" = low-opacity outline (Independent, less scaffold).
    // data:{shape, color, name?, name_audio?, guide:"dotted"|"faint"}
    // audio:{prompt, shape_name?, done, try_again?}   signals:{on_complete:["shape_trace_complete"]}
    mount(host, slide){
      const d = slide.data;
      const PATHS = {   // viewBox 0 0 100 100, matches shapeSVG geometry; TRUE corners
        circle:    "M 8,50 a 42,42 0 1 0 84,0 a 42,42 0 1 0 -84,0 Z",
        square:    "M 12,12 H 88 V 88 H 12 Z",
        triangle:  "M 50,9 L 91,89 L 9,89 Z",
        rectangle: "M 6,28 H 94 V 72 H 6 Z"
      };
      const shape = d.shape, color = d.color || "#386AF6";
      const dPath = PATHS[shape] || PATHS.square;
      const faint = d.guide === "faint";
      state.ownsAudio = true; setNavActive(false); setSwMood("point");

      const wrap = document.createElement("div"); wrap.className = "trace-stage";
      const box  = document.createElement("div"); box.className = "trace-box";
      box.innerHTML =
        `<svg class="trace-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
           <path class="trace-guide${faint ? " faint" : ""}" d="${dPath}" stroke="${color}" stroke-width="6"
                 ${faint ? "" : `stroke-dasharray="2 7"`}/>
           <path class="trace-ink" d="${dPath}" stroke="${color}" stroke-width="9"/>
           <g class="trace-dots"></g>
           <circle class="trace-marker" r="6" fill="${color}" style="display:none"/>
         </svg>`;
      wrap.appendChild(box); host.appendChild(wrap);

      const svg   = box.querySelector(".trace-svg");
      const guide = box.querySelector(".trace-guide");
      const inkP  = box.querySelector(".trace-ink");
      const dotsG = box.querySelector(".trace-dots");
      const marker= box.querySelector(".trace-marker");

      const total = inkP.getTotalLength();
      const N = 96, CORRIDOR = 11;   // user-units; a generous corridor for little fingers
      const pts = [], hit = new Array(N).fill(false);
      for(let i=0;i<N;i++) pts.push(inkP.getPointAtLength(total * i / N));
      pts.forEach(p=>{ const c = document.createElementNS("http://www.w3.org/2000/svg","circle");
        c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", faint ? 1.5 : 2.1);
        c.setAttribute("fill", color); c.setAttribute("class","trace-dot"); dotsG.appendChild(c); });
      const dotEls = [...dotsG.children];
      inkP.style.strokeDasharray = String(total); inkP.style.strokeDashoffset = String(total);   // ink hidden until success flourish

      let done = false, active = false;
      const covered = ()=> hit.reduce((a,b)=> a + (b?1:0), 0);
      const toSvg = (cx, cy)=>{ const m = svg.getScreenCTM(); if(!m) return null;
        const p = svg.createSVGPoint(); p.x = cx; p.y = cy; return p.matrixTransform(m.inverse()); };

      // idle → demonstrate: a marker travels the outline ("trace like this")
      let idleTimer = null, demoRAF = null;
      const stopIdle = ()=>{ clearTimeout(idleTimer); if(demoRAF){ cancelAnimationFrame(demoRAF); demoRAF = null; } marker.style.display = "none"; };
      const runDemo = ()=>{ let s = 0; marker.style.display = "";
        const stepD = ()=>{ if(done || active){ marker.style.display = "none"; demoRAF = null; return; }
          s += total / 90; if(s > total) s = 0;
          const p = inkP.getPointAtLength(s); marker.setAttribute("cx", p.x); marker.setAttribute("cy", p.y);
          demoRAF = requestAnimationFrame(stepD); };
        stepD(); };
      const kickIdle = ()=>{ stopIdle(); idleTimer = setTimeout(()=>{ if(!done && !active) runDemo(); }, 2600); };

      function finish(){
        done = true; stopIdle(); stopNudge();
        guide.classList.add("done"); dotEls.forEach(x=> x.classList.add("on"));
        inkP.style.strokeDashoffset = "0";   // draw the full outline as the success flourish
        SwiftPAL.emit("shape_trace_complete", { slide_id: slide.id, phase: slide.phase, shape, value: true,
          latency_ms: Date.now()-state.slideStart });
        sfxCorrect(); confettiCannon(); setSwMood("celebrate");
        play(audioFor(slide, "done") || null, ()=> setNavActive(true));
      }
      const markAt = (sp)=>{ if(!sp) return; let any = false;
        for(let i=0;i<N;i++){ if(hit[i]) continue;
          const dx = pts[i].x - sp.x, dy = pts[i].y - sp.y;
          if(dx*dx + dy*dy <= CORRIDOR*CORRIDOR){ hit[i] = true; dotEls[i].classList.add("on"); any = true; } }
        if(any && !done && covered() / N >= 0.8) finish();
      };

      const onDown = (e)=>{ if(done) return; active = true; stopIdle(); const t = e.touches ? e.touches[0] : e;
        markAt(toSvg(t.clientX, t.clientY)); if(e.cancelable) e.preventDefault(); };
      const onMove = (e)=>{ if(!active || done) return; const t = e.touches ? e.touches[0] : e;
        markAt(toSvg(t.clientX, t.clientY)); if(e.cancelable) e.preventDefault(); };
      const onUp   = ()=>{ if(active){ active = false; if(!done) kickIdle(); } };
      box.addEventListener("mousedown", onDown); box.addEventListener("touchstart", onDown, {passive:false});
      box.addEventListener("mousemove", onMove); box.addEventListener("touchmove", onMove, {passive:false});
      window.addEventListener("mouseup", onUp);   box.addEventListener("touchend", onUp);

      state.replayAudio = ()=> play(audioFor(slide, "prompt") || null, ()=>{});
      $("navBtn").onclick = ()=>{ if(done) completeSlide(true); };
      // prompt → shape name → arm the idle-demo (no auto-play double-fire: state.ownsAudio set above)
      play(audioFor(slide, "prompt") || null, ()=> play(audioFor(slide, "shape_name") || null, ()=> kickIdle()));
    }
  },

  TAP_SHAPE_BY_NAME: {
    mount(host, slide){
      mountTapOptions({
        slide, host, signalName: "shape_name_first_try",
          /* [28m] NO VOLUME BUTTON, ANYWHERE. Yasir 2026-07-28: "we use vol button nowhere. if
             nothing then we keep question only." This stimulus had NO image, so 28c left its 🔊 +
             "सुनो" chip alone and flagged it — stripping it looked like it would leave a blank card.
             The ruling settles it: nothing to show => show the QUESTION only, no chip. The chip was
             also the only way to re-hear the sound, so that function moves to the header replay
             (state.replayAudio, set after mount) instead of dying with the affordance. */
          stimulus: null,
        options: slide.data.options,
        isCorrect: (opt) => opt.shape === slide.data.target,
        optionRenderer: (opt) => shapeCell(opt)
      });
        /* [28m] the removed chip was the only way to re-hear the sound — keep the FUNCTION on the
           header replay. Set AFTER mount so mountTapOptions cannot overwrite it. */
        state.replayAudio = ()=>{ state.audioReplays++; play(audioFor(slide,"shape_name") || null, ()=>{}); };
    }
  },

  TAP_SHAPE_BY_PICTURE: {
    mount(host, slide){
      mountTapOptions({
        slide, host, signalName: "shape_env_first_try",
        stimulus: stimulusPic(slide.data.object_hi, slide.data.object_emoji, slide.data.object_img),
        options: slide.data.options,
        isCorrect: (opt) => opt.shape === slide.data.target,
        optionRenderer: (opt) => shapeCell(opt)
      });
    }
  },

  TAP_PICTURE_BY_SHAPE: {
    mount(host, slide){
      mountTapOptions({
        slide, host, signalName: "shape_object_first_try",
        stimulus: stimulusShape({shape: slide.data.shape, color: slide.data.color, rotate: slide.data.rotate}),
        options: slide.data.options,
        isCorrect: (opt) => opt.correct === true,
        optionRenderer: (opt) => pictureCell(opt.object_hi, opt.object_emoji, opt.object_img)
      });
    }
  },

  SORT_SHAPE: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "sort-stage shape-sort";
      const binsRow = document.createElement("div");
      binsRow.className = "sort-bins" + (slide.data.bins.length >= 4 ? " many" : "");
      slide.data.bins.forEach(b => {
        const bin = document.createElement("div");
        bin.className = "sort-bin dd-zone";            // dd-zone → drop detection
        bin.dataset.shape = b.shape;
        // header (faint reference shape + label) INSIDE the box, then a clear drop area
        bin.innerHTML = `<div class="bin-head-row"><span class="bin-ref">${shapeSVG(b.shape, {color:"#AEB9CC", size:34})}</span><span class="bin-title">${b.label}</span></div>`+
          `<div class="bin-items"></div>`;
        binsRow.appendChild(bin);
      });
      const tray = document.createElement("div"); tray.className = "sort-tray";
      const items = slide.data.items.slice().sort(()=> Math.random() - 0.5);
      items.forEach(it => {
        const t = document.createElement("div"); t.className = "sort-item"; t.dataset.shape = it.shape; if(it.audio) t.dataset.audio = it.audio;   // [20a SORT-01]
        t.innerHTML = shapeSVG(it.shape, {color: it.color, size: 70, rotate: it.rotate});
        tray.appendChild(t);
      });
      wrap.appendChild(binsRow); wrap.appendChild(tray);
      host.appendChild(wrap);

      state.attempts = 0; state.locked = false;
      let placed = 0; const need = slide.data.items.length;
      if(slide.data.reveal_seq) sortSeqReveal(tray, slide);   // [20a SORT-01] opt-in
      [...tray.children].forEach(tile => {
        makeDraggable(tile, (zone, t) => {
          const bin = zone.closest(".sort-bin"); if(!bin) return;
          state.attempts++;
          if(bin.dataset.shape === t.dataset.shape){
            leaveTrayGhost(t);   // [24a A5] capture the tray-slot size before .snapped shrinks/moves it
            t.classList.add("snapped");
            bin.querySelector(".bin-items").appendChild(t);
            placed++;
            if(t.dataset.audio && placed < need) play("assets/Audio/" + t.dataset.audio + "." + AUDIO_EXT, ()=>{});   // [20a SORT-01] speak-on-match
            SwiftPAL.emit("shape_sort_item", { slide_id: slide.id, shape: t.dataset.shape, attempts: state.attempts });
            if(placed === need){
              state.locked = true;
              SwiftPAL.emit("shape_sort_correct", {
                slide_id: slide.id, phase: slide.phase, value: true,
                attempts: state.attempts, latency_ms: Date.now() - state.slideStart
              });
              setTimeout(()=> celebrateThenAdvance(slide, false), 250);   // standard: confetti + VO + auto-advance, no popup
            }
          } else {
            bin.classList.add("hover"); bin.style.borderColor = "var(--wrong)";
            setTimeout(()=>{ bin.classList.remove("hover"); bin.style.borderColor = ""; }, 500);
            dragWrong(slide);   // buzz + Swiftie + spoken try_again (pre-readers need the spoken recovery)
            SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
          }
        });
      });
    }
  },

  /* ===== COUNTING (maths) — OTO tap-count, cardinality, meet-number, make-set ===== */
  COUNT_TAP: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "count-stage";
      const row  = document.createElement("div"); row.className = "count-row";
      const N = slide.data.count, obj = slide.data.object, nums = slide.data.numerals || [];
      // large sets (S04, up to 20): smaller tiles + optional rows-of-N grouping (curriculum: rows of 5/10)
      if(N > 10 || slide.data.per_row) row.classList.add("dense");
      if(slide.data.per_row){ row.style.display = "grid"; row.style.gridTemplateColumns = `repeat(${slide.data.per_row}, auto)`; }
      const items = []; let c = 0;
      for(let i=0;i<N;i++){
        const it = document.createElement("div"); it.className = "count-item";
        it.innerHTML = imgOrEmoji(obj.img, obj.emoji, "cobj-img", "cobj-emoji") + `<span class="count-badge"></span>`;
        row.appendChild(it); items.push(it);
      }
      wrap.appendChild(row); host.appendChild(wrap);

      function nudgeNext(){ const nx = items.find(x=>!x.classList.contains("counted")); if(nx) pointNudgeAt(nx); else stopNudge(); }
      items.forEach(it => {
        it.onclick = ()=>{
          if(it.classList.contains("counted")) return;   // one-to-one: never double-count
          c++; it.classList.add("counted");
          it.querySelector(".count-badge").textContent = String(c);   // Arabic running count; Hindi word spoken separately
          SwiftPAL.emit("count_tap", { slide_id: slide.id, phase: slide.phase, n: c });
          if(c >= N){
            stopNudge();
            SwiftPAL.emit("count_oto_complete", { slide_id: slide.id, phase: slide.phase,
              total: N, value: true, latency_ms: Date.now()-state.slideStart });
            // say the LAST number, then the total; enable आगे ONLY after "कुल N" finishes
            play("assets/Audio/vo_num_" + c + "." + AUDIO_EXT, ()=> setTimeout(()=>
              play("assets/Audio/vo_total_" + N + "." + AUDIO_EXT, ()=> setNavActive(true)), 300));
          } else {
            play("assets/Audio/vo_num_" + c + "." + AUDIO_EXT);    // one number word per touch
            nudgeNext();
          }
        };
      });
      setNavActive(false);
      $("navBtn").onclick = ()=>{ if(c >= N) completeSlide(true); };
      nudgeNext();
    }
  },

  COMBINE_COUNT: {
    // [21c] PUT-TOGETHER (MTKGA01_L03_S01 "Combines two small groups and counts the total, within 10").
    // The child DRAGS group B onto group A; the two sets visibly MERGE into ONE row, then the child
    // tap-counts the combined total one-by-one. The EVIDENCE is the set the child builds + counts, never
    // a numeral pick — the LO's mandated drag-and-combine. Misconception guards baked in:
    //   • one-to-one count: re-tapping a counted item is INERT → no double-counting the overlap where the
    //     two groups meet (the map's #1 error);
    //   • the merged set is a single clean row (never a pile) so the child can't lose track at the seam.
    // data.mode "demo" runs it AUTONOMOUSLY for the Phase-1 tutorial (a hand pushes B onto A, then it
    // counts itself — KG children who can't yet count WATCH the put-together happen).
    // data:{a, b, object, numerals?, mode?}   audio:{prompt, conclude?(demo)}
    mount(host, slide){
      const d = slide.data, A = d.a|0, B = d.b|0, N = A + B, obj = d.object;
      const demo = d.mode === "demo";
      state.ownsAudio = true; setNavActive(false); setSwMood(demo ? "teach" : "point");
      const wrap = document.createElement("div"); wrap.className = "combine-stage" + (demo ? " is-demo" : "");
      const layout = document.createElement("div"); layout.className = "combine-layout";
      const mat = document.createElement("div"); mat.className = "combine-mat dd-zone";   // group A = the fixed drop target
      const grpA = document.createElement("div"); grpA.className = "combine-grp";
      const grpB = document.createElement("div"); grpB.className = "combine-grp combine-drag";   // group B = the draggable cluster
      const mkItem = ()=>{ const it = document.createElement("div"); it.className = "count-item combine-item";
        it.innerHTML = imgOrEmoji(obj.img, obj.emoji, "cobj-img", "cobj-emoji") + `<span class="count-badge"></span>`; return it; };
      for(let i=0;i<A;i++) grpA.appendChild(mkItem());
      for(let i=0;i<B;i++) grpB.appendChild(mkItem());
      mat.appendChild(grpA);
      const plus = document.createElement("div"); plus.className = "combine-plus"; plus.textContent = "और";
      const bWrap = document.createElement("div"); bWrap.className = "combine-bwrap"; bWrap.appendChild(grpB);
      layout.appendChild(mat); layout.appendChild(plus); layout.appendChild(bWrap);
      wrap.appendChild(layout); host.appendChild(wrap);

      let c = 0; const merged = []; let counting = false;
      const stale = ()=> (state.idx !== undefined && CARD.slides[state.idx] !== slide);

      function finish(){   // last number already spoken by the caller → say the cardinal total, then settle
        SwiftPAL.emit("combine_count_correct", { slide_id: slide.id, phase: slide.phase,
          a: A, b: B, total: N, value: true, latency_ms: Date.now()-state.slideStart });
        play("assets/Audio/vo_total_" + N + "." + AUDIO_EXT, ()=>{
          if(demo){ play(audioFor(slide, "conclude") || null, ()=>{ state.demoRunning = false; setNavActive(true); }); }   // [24a N8] demo chain over → chip live
          else { sfxCorrect(); confettiCannon(); setSwMood("celebrate"); setNavActive(true); }   // produce: celebrate in place, then unlock आगे
        });
      }
      function startCount(){
        counting = true;
        // collapse the two groups into ONE clean row (A first, then B), badges cleared — nothing to
        // double-count at the seam because it's a single continuous row the child counts straight through.
        const items = [...grpA.querySelectorAll(".combine-item"), ...grpB.querySelectorAll(".combine-item")];
        const row = document.createElement("div"); row.className = "count-row combine-merged" + (N > 8 ? " dense" : "");
        items.forEach(it=>{ it.classList.remove("counted","demo-hit"); const b = it.querySelector(".count-badge"); if(b) b.textContent = ""; row.appendChild(it); merged.push(it); });
        layout.className = "combine-layout merged"; layout.innerHTML = ""; layout.appendChild(row);
        const nudgeNext = ()=>{ const nx = merged.find(x=>!x.classList.contains("counted")); if(nx) pointNudgeAt(nx); else stopNudge(); };
        if(demo){
          (function stepC(){
            if(stale()) return;
            if(c >= N){ setTimeout(finish, 380); return; }
            const it = merged[c]; c++; it.classList.add("counted","demo-hit");
            it.querySelector(".count-badge").textContent = String(c); pointNudgeAt(it);
            play("assets/Audio/vo_num_" + c + "." + AUDIO_EXT, ()=> setTimeout(stepC, 430));
          })();
        } else {
          merged.forEach(it=>{ it.onclick = ()=>{
            if(it.classList.contains("counted")) return;   // one-to-one; re-tap INERT → never double-count the overlap
            c++; it.classList.add("counted"); it.querySelector(".count-badge").textContent = String(c);
            SwiftPAL.emit("count_tap", { slide_id: slide.id, phase: slide.phase, n: c });
            if(c >= N){ stopNudge(); play("assets/Audio/vo_num_" + N + "." + AUDIO_EXT, finish); }
            else { play("assets/Audio/vo_num_" + c + "." + AUDIO_EXT); nudgeNext(); }
          }; });
          nudgeNext();
        }
      }
      function merge(){ if(counting) return; stopNudge(); grpB.classList.add("merging"); sfxTap();
        setTimeout(startCount, 600); }   // let the slide-in play, then count

      if(demo){
        state.demoRunning = true;   // [24a N8] a replay tap mid-demo would gen-kill the prompt→merge→count chain (soft-lock)
        pointNudgeAt(grpB);
        play(audioFor(slide, "prompt") || null, ()=> setTimeout(()=>{ if(!stale()) merge(); }, 750));
        state.replayAudio = ()=> play(audioFor(slide, (counting && c >= N) ? "conclude" : "prompt") || null, ()=>{});
      } else {
        makeDraggable(grpB, (zone)=>{ if(counting || zone !== mat) return; merge(); });   // drag group B onto group A
        $("navBtn").onclick = ()=>{ if(c >= N) completeSlide(true); };
        play(audioFor(slide, "prompt") || null, ()=>{ if(!counting) pointNudgeAt(grpB); });
        state.replayAudio = ()=> play(audioFor(slide, "prompt") || null, ()=>{});
      }
    }
  },

  CONSERVE_COUNT: {
    // MTKGA01_L01_S03 "the LAST counted number IS the total" + its core misconception ("the total
    // changes when objects move"). One slide, two beats: (A) the child tap-counts the set one-to-one
    // (badges + spoken एक/दो/…, ending "कुल N" — the freeze-the-final-number teach), then (B) the SAME
    // objects visibly MOVE to scattered spots (badges clear), the move line asks "अब कितनी हैं?" and
    // numeral options appear — correct is the SAME N; options include N±1 (the moved-so-changed error).
    // data:{count, object, numerals, options:[{value,audio}]} · audio:{prompt, move, try_again, hint, reveal}.
    // GENERALISED count-then-pick engine (S03 conservation + S02's tap-count items). One slide:
    // tap-count the set one-to-one (badges + spoken एक/दो/… → frozen "कुल N"), then numeral options.
    // data: {count, object, options, arrange?("row"|"scatter"|"circle"|"two_groups"), groups?[a,b],
    //        move?(default true = objects drift after counting; false = count-then-pick, no drift)}.
    // move:false emits cardinality_first_try; move:true emits conserve_count_first_try.
    mount(host, slide){
      const d = slide.data, N = d.count, obj = d.object;
      const arrange = d.arrange || "row";
      const doMove  = d.move !== false;
      state.ownsAudio = true; setNavActive(false);
      const wrap = document.createElement("div"); wrap.className = "count-stage conserve";
      const row  = document.createElement("div"); row.className = "count-row arr-" + arrange + (N > 8 ? " dense" : "");
      const items = []; let c = 0;
      const mkItem = ()=>{ const it = document.createElement("div"); it.className = "count-item";
        it.innerHTML = imgOrEmoji(obj.img, obj.emoji, "cobj-img", "cobj-emoji") + `<span class="count-badge"></span>`;
        items.push(it); return it; };
      if(arrange === "two_groups"){
        const g = d.groups || [Math.ceil(N/2), Math.floor(N/2)];
        g.forEach((gn, gi)=>{ const cl = document.createElement("div"); cl.className = "count-cluster";
          for(let i=0;i<gn;i++) cl.appendChild(mkItem()); row.appendChild(cl);
          if(gi === 0){ const plus = document.createElement("div"); plus.className = "count-plus"; plus.textContent = "और"; row.appendChild(plus); } });
      } else if(arrange === "circle"){
        for(let i=0;i<N;i++){ const it = mkItem(); const a = -Math.PI/2 + i*2*Math.PI/N, R = N > 6 ? 176 : 140;
          it.style.position = "absolute";
          it.style.left = `calc(50% + ${Math.round(Math.cos(a)*R)}px)`;
          it.style.top  = `calc(50% + ${Math.round(Math.sin(a)*R)}px)`;
          it.style.marginLeft = "-48px"; it.style.marginTop = "-48px"; row.appendChild(it); }
      } else {
        for(let i=0;i<N;i++){ const it = mkItem();
          if(arrange === "scatter") it.style.transform = `translateY(${((i*23)%25)-12}px) rotate(${((i*37)%21)-10}deg)`;
          row.appendChild(it); }
      }
      wrap.appendChild(row); host.appendChild(wrap);
      const nudgeNext = ()=>{ const nx = items.find(x=>!x.classList.contains("counted")); if(nx) pointNudgeAt(nx); else stopNudge(); };
      const askOptions = ()=>{
        mountTapOptions({
          slide, host, signalName: doMove ? "conserve_count_first_try" : "cardinality_first_try",
          stimulus: null, nudgeTarget: null,
          options: d.options,
          columnsHint: Math.min(d.options.length, 5),
          isCorrect: (opt) => opt.value === N,
          optionRenderer: (opt) => slide.phase === "tutorial" ? numFingerCell(opt.value) : bigNumCell(opt.value),
          mastery: slide.phase === "mastery"
        });
      };
      const afterCount = ()=>{
        if(doMove){
          items.forEach((it,i)=>{ const keep = slide.phase === "tutorial" &&
              it.querySelector(".count-badge").textContent === String(N);
            if(!keep) it.querySelector(".count-badge").textContent = "";
            it.classList.add("moved");
            it.style.transform = `translate(${((i*53)%81)-40}px, ${((i*37)%61)-30}px) rotate(${((i*29)%25)-12}deg)`; });
          sfxTap();
          setTimeout(()=>{ play(audioFor(slide, "move") || null, ()=>{}); askOptions(); }, 950);
        } else {
          play(audioFor(slide, "ask") || null, ()=>{}); askOptions();
        }
      };
      items.forEach(it => {
        it.onclick = ()=>{
          if(it.classList.contains("counted") || it.classList.contains("moved")) return;   // one-to-one; inert once moved
          c++; it.classList.add("counted");
          it.querySelector(".count-badge").textContent = String(c);
          SwiftPAL.emit("count_tap", { slide_id: slide.id, phase: slide.phase, n: c });
          if(c >= N){
            stopNudge();
            play("assets/Audio/vo_num_" + c + "." + AUDIO_EXT, ()=> setTimeout(()=>
              play("assets/Audio/vo_total_" + N + "." + AUDIO_EXT, ()=> setTimeout(afterCount, 450)), 300));
          } else {
            play("assets/Audio/vo_num_" + c + "." + AUDIO_EXT);
            nudgeNext();
          }
        };
      });
      state.replayAudio = ()=> play(audioFor(slide, c >= N ? (doMove ? "move" : "ask") : "prompt") || null, ()=>{});
      play(audioFor(slide, "prompt") || null, ()=>{});
      nudgeNext();
    }
  },

  COUNT_ACTION: {
    // S02 themed tap-count: tap each object and it ENACTS to a target while counting — pop (balloon
    // vanishes), feed (flies to the monster's mouth), or basket (drops into the basket). After the last
    // one the frozen "कुल N" plays and numeral options appear. data:{count, object, options, theme
    // ("pop"|"feed"|"basket")}. audio:{prompt, ask, try_again, hint, reveal}.
    mount(host, slide){
      const d = slide.data, N = d.count, obj = d.object, theme = d.theme || "pop";
      state.ownsAudio = true; setNavActive(false);
      const wrap = document.createElement("div"); wrap.className = "count-stage act act-" + theme;
      let target = null;
      if(theme === "feed"){ target = document.createElement("div"); target.className = "act-target act-monster"; target.textContent = "👹"; wrap.appendChild(target); }
      if(theme === "basket"){ target = document.createElement("div"); target.className = "act-target act-basket";
        target.innerHTML = imgOrEmoji("obj_basket", "🧺", "act-basket-img", "act-basket-emoji"); wrap.appendChild(target); }
      const row = document.createElement("div"); row.className = "count-row act-row" + (N > 8 ? " dense" : "");
      const items = []; let c = 0;
      for(let i=0;i<N;i++){ const it = document.createElement("div"); it.className = "count-item act-item";
        it.innerHTML = imgOrEmoji(obj.img, obj.emoji, "cobj-img", "cobj-emoji") + `<span class="count-badge"></span>`;
        row.appendChild(it); items.push(it); }
      wrap.appendChild(row); host.appendChild(wrap);
      const nudgeNext = ()=>{ const nx = items.find(x=>!x.classList.contains("done")); if(nx) pointNudgeAt(nx); else stopNudge(); };
      const askOptions = ()=>{ mountTapOptions({
        slide, host, signalName: "cardinality_first_try", stimulus: null, nudgeTarget: null,
        options: d.options, columnsHint: Math.min(d.options.length, 5),
        isCorrect: (opt) => opt.value === N,
        optionRenderer: (opt) => slide.phase === "tutorial" ? numFingerCell(opt.value) : bigNumCell(opt.value),
        mastery: slide.phase === "mastery" }); };
      items.forEach(it => {
        it.onclick = ()=>{
          if(it.classList.contains("done")) return;
          c++; it.classList.add("done", "act-go");   // act-go = fly/pop animation (theme-scoped CSS)
          it.querySelector(".count-badge").textContent = String(c);
          if(theme === "feed" && target) target.classList.add("chomp");
          sfxTap();
          SwiftPAL.emit("count_tap", { slide_id: slide.id, phase: slide.phase, n: c });
          if(c >= N){
            stopNudge();
            play("assets/Audio/vo_num_" + c + "." + AUDIO_EXT, ()=> setTimeout(()=>
              play("assets/Audio/vo_total_" + N + "." + AUDIO_EXT, ()=> setTimeout(()=>{
                play(audioFor(slide, "ask") || null, ()=>{}); askOptions(); }, 450)), 300));
          } else { play("assets/Audio/vo_num_" + c + "." + AUDIO_EXT); nudgeNext(); }
        };
      });
      state.replayAudio = ()=> play(audioFor(slide, c >= N ? "ask" : "prompt") || null, ()=>{});
      play(audioFor(slide, "prompt") || null, ()=>{});
      nudgeNext();
    }
  },

  COUNT_DRAG_MATCH: {
    // S02 drag items. mode "num_to_box": count the set, then DRAG the correct NUMBER CARD into the
    // answer box (#2, #9). mode "obj_to_num": count, then DRAG the object onto the correct NUMBER (#11).
    // data:{count, object, options:[{value}], mode}. audio:{prompt, ask, try_again, reveal}.
    mount(host, slide){
      const d = slide.data, N = d.count, obj = d.object, mode = d.mode || "num_to_box";
      state.ownsAudio = true; setNavActive(false);
      const wrap = document.createElement("div"); wrap.className = "count-stage dragmatch";
      const setRow = document.createElement("div"); setRow.className = "count-row show-set" + (N > 8 ? " dense" : "");
      const items = []; let c = 0;
      for(let i=0;i<N;i++){ const it = document.createElement("div"); it.className = "count-item";
        it.innerHTML = imgOrEmoji(obj.img, obj.emoji, "cobj-img", "cobj-emoji") + `<span class="count-badge"></span>`;
        setRow.appendChild(it); items.push(it); }
      wrap.appendChild(setRow);
      const dz = document.createElement("div"); dz.className = "cdm-zone";   // built after counting
      const tray = document.createElement("div"); tray.className = "cdm-tray";
      wrap.appendChild(dz); wrap.appendChild(tray); host.appendChild(wrap);
      const nudgeNext = ()=>{ const nx = items.find(x=>!x.classList.contains("counted")); if(nx) pointNudgeAt(nx); else stopNudge(); };
      const settleWin = (revealed)=>{ state.locked = true;
        SwiftPAL.emit("cardinality_first_try", { slide_id: slide.id, phase: slide.phase, value: !revealed, latency_ms: Date.now()-state.slideStart });
        celebrateThenAdvance(slide, revealed); };
      const buildDrag = ()=>{
        // shuffle the numeral options
        const opts = d.options.slice(); for(let i=opts.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [opts[i],opts[j]]=[opts[j],opts[i]]; }
        if(mode === "obj_to_num"){
          // number cards are the DROP ZONES; a single draggable object-chip is the tile
          dz.className = "cdm-numrow";
          opts.forEach(o=>{ const z = document.createElement("div"); z.className = "cdm-numzone dd-zone"; z.dataset.val = String(o.value);
            z.innerHTML = `<span class="bignum-glyph">${devNumeral(o.value)}</span>`; dz.appendChild(z); });
          const tile = document.createElement("div"); tile.className = "cdm-objtile";
          tile.innerHTML = imgOrEmoji(obj.img, obj.emoji, "cobj-img", "cobj-emoji"); tray.appendChild(tile);
          makeDraggable(tile, (zone)=>{ if(state.locked || !zone) return;
            if(parseInt(zone.dataset.val,10) === N){ zone.classList.add("filled","correct"); tile.classList.add("snapped"); settleWin(false); }
            else { zone.classList.add("wrong"); setTimeout(()=>zone.classList.remove("wrong"),500); dragWrong(slide);
              state.attempts=(state.attempts||0)+1; if(state.attempts>=(CARD.scaffold_rules.max_attempts||3)){ const zc=[...dz.children].find(z=>parseInt(z.dataset.val,10)===N); if(zc){zc.classList.add("filled","correct","reveal-glow"); tile.classList.add("snapped"); play(audioFor(slide,"reveal")||null,()=>{}); settleWin(true);} } }
          });
        } else {
          // one BOX is the drop zone; number cards are the draggable tiles
          dz.className = "cdm-box dd-zone"; dz.innerHTML = `<span class="cdm-box-q">?</span>`;
          opts.forEach(o=>{ const tile = document.createElement("div"); tile.className = "cdm-card"; tile.dataset.val = String(o.value);
            tile.innerHTML = `<span class="bignum-glyph">${devNumeral(o.value)}</span>`; tray.appendChild(tile);
            makeDraggable(tile, (zone)=>{ if(state.locked || zone !== dz) return;
              if(o.value === N){ dz.classList.add("filled","correct"); dz.innerHTML = `<span class="bignum-glyph">${devNumeral(N)}</span>`; tile.classList.add("snapped"); settleWin(false); }
              else { dz.classList.add("wrong"); setTimeout(()=>dz.classList.remove("wrong"),500); dragWrong(slide);
                state.attempts=(state.attempts||0)+1; if(state.attempts>=(CARD.scaffold_rules.max_attempts||3)){ dz.classList.add("filled","correct","reveal-glow"); dz.innerHTML=`<span class="bignum-glyph">${devNumeral(N)}</span>`; play(audioFor(slide,"reveal")||null,()=>{}); settleWin(true); } }
            });
          });
        }
        play(audioFor(slide, "ask") || null, ()=>{});
      };
      items.forEach(it => { it.onclick = ()=>{ if(it.classList.contains("counted")) return;
        c++; it.classList.add("counted"); it.querySelector(".count-badge").textContent = String(c);
        SwiftPAL.emit("count_tap", { slide_id: slide.id, phase: slide.phase, n: c });
        if(c >= N){ stopNudge(); play("assets/Audio/vo_num_"+c+"."+AUDIO_EXT, ()=> setTimeout(()=>
          play("assets/Audio/vo_total_"+N+"."+AUDIO_EXT, ()=> setTimeout(buildDrag, 450)), 300)); }
        else { play("assets/Audio/vo_num_"+c+"."+AUDIO_EXT); nudgeNext(); }
      }; });
      state.attempts = 0; state.locked = false;
      state.replayAudio = ()=> play(audioFor(slide, c >= N ? "ask" : "prompt") || null, ()=>{});
      play(audioFor(slide, "prompt") || null, ()=>{});
      nudgeNext();
    }
  },

  DEMO_COUNT: {
    // [16h] PHASE-1 AUTONOMOUS TEACH (the lead's 3-phase contract, 2026-07-17): the game counts
    // BY ITSELF — KG children who cannot count yet WATCH the counting happen. All N objects are
    // visible; the demo hand moves to each in turn; a BIG running count above updates 1..N with
    // vo_num_N per touch; then the conclusion line plays ("ये पाँच सेब हैं!") and आगे unlocks.
    // NO required interaction, NO options — never a test. Zero (N=0): empty tray, straight to the
    // conclusion ("यहाँ कुछ नहीं — शून्य!"). data:{count, object} audio:{prompt?, conclude}
    mount(host, slide){
      const d = slide.data, N = d.count, obj = d.object;
      state.ownsAudio = true; setNavActive(false); setSwMood("teach");
      const wrap = document.createElement("div"); wrap.className = "demo-stage";
      const counter = document.createElement("div"); counter.className = "demo-count";
      counter.textContent = N === 0 ? "0" : "";
      const row = document.createElement("div"); row.className = "count-row demo-row" + (N > 8 && !d.per_row ? " dense" : "");
      if(d.per_row){ row.classList.add("perrow"); row.style.gridTemplateColumns = `repeat(${d.per_row}, auto)`; }
      const items = [];
      for(let k = 0; k < N; k++){
        const it = document.createElement("div"); it.className = "count-item demo-item";
        it.innerHTML = imgOrEmoji(obj.img, obj.emoji, "cobj-img", "cobj-emoji") + `<span class="count-badge"></span>`;
        row.appendChild(it); items.push(it);
      }
      if(N === 0){ row.classList.add("demo-empty"); }
      wrap.appendChild(counter); wrap.appendChild(row); host.appendChild(wrap);
      let i = 0;
      const conclude = ()=>{ stopNudge();
        play(audioFor(slide, "conclude") || null, ()=> setNavActive(true)); };
      const step = ()=>{
        if(state.idx !== undefined && CARD.slides[state.idx] !== slide) return;   // slide changed — stop
        if(i >= N){ setTimeout(conclude, 400); return; }
        const it = items[i];
        it.classList.add("counted", "demo-hit");
        it.querySelector(".count-badge").textContent = String(i + 1);
        counter.textContent = String(i + 1);
        counter.classList.remove("demo-pop"); void counter.offsetWidth; counter.classList.add("demo-pop");
        pointNudgeAt(it);
        i++;
        play("assets/Audio/vo_num_" + i + "." + AUDIO_EXT, ()=> setTimeout(step, 420));
      };
      play(audioFor(slide, "prompt") || null, ()=> setTimeout(step, 500));
      state.replayAudio = ()=> play(audioFor(slide, i >= N ? "conclude" : "prompt") || null, ()=>{});
    }
  },

  MEET_NUMBER: {
    mount(host, slide){
      if(slide.data && slide.data.present === "crane"){ return btCraneMeet(host, slide); }   // Block Town teach
      const wrap = document.createElement("div"); wrap.className = "meet-stage number-meet";
      const n = slide.data.count;
      // [16d] dual-code the numeral: hands for 1..5; for bigger numbers (teens) the Hindi number WORD.
      // Never the numeral twice — fingerCount's out-of-range fallback IS the numeral, which rendered
      // the "12 over 12" teach card the SME flagged on MTKGA01_L01_S04.
      const word = (slide.data.numerals || [])[n-1] || "";
      const second = (n>=1 && n<=5) ? fingerCount(n,'meet-hand') : (word ? `<span class="num-word">${word}</span>` : "");
      wrap.innerHTML = `
        <div class="meet-number-box"><span class="num-glyph">${n}</span>${second}</div>
        <div class="meet-arrow">→</div>`;
      // [16d] the teach set honors data.per_row (rows of 10 → a teen visibly reads as ten-and-ones)
      const setEl = stimulusCountSet(n, slide.data.object, false, slide.data.per_row);
      setEl.classList.add("meet-set");
      wrap.appendChild(setEl);
      host.appendChild(wrap);
      state.gateNavUntilAudio = true; setNavActive(false);
      $("navBtn").onclick = ()=> completeSlide(true);
    }
  },

  COUNT_HOW_MANY: {
    mount(host, slide){
      const setEl = stimulusCountSet(slide.data.count, slide.data.object, slide.data.scatter, slide.data.per_row);
      mountTapOptions({
        slide, host, signalName: "cardinality_first_try",
        stimulus: setEl,
        nudgeTarget: null,   // nothing to re-tap here → no idle hand
        options: slide.data.options,
        columnsHint: Math.min(slide.data.options.length, 5),
        isCorrect: (opt) => opt.value === slide.data.count,
        // SME (S01 review deck): finger-hands are a TUTORIAL teaching aid only — in guided/
        // independent/practice/mastery the options are the NUMBER ALONE, larger.
        optionRenderer: (opt) => slide.phase === "tutorial" ? numFingerCell(opt.value) : bigNumCell(opt.value),
        mastery: slide.phase === "mastery",
        // HINT = count the set FOR the child (highlight + say एक/दो/तीन + numeral on top)
        hintAction: (done) => demoCountSet(setEl, slide.data.count, slide.data.numerals, done)
      });
    }
  },

  PICK_SET_BY_NUMBER: {
    // SME-designed REVERSE how-many (S01 review deck, new pages): a big NUMBER is the stimulus;
    // the options are small OBJECT SETS — tap the set with that many. Speak-on-tap = each set's own
    // count line ("इसमें तीन चीज़ें हैं।"), which doubles as the SME's wrong-tap hint; the ladder then
    // runs try_again → hint → reveal-glow as everywhere. data:{target, options:[{count, object:{img,emoji},
    // audio, correct}]}.
    mount(host, slide){
      const d = slide.data;
      const stim = document.createElement("div"); stim.className = "psn-stimulus";
      stim.innerHTML = `<span class="psn-num">${devNumeral(d.target)}</span>`;
      mountTapOptions({
        slide, host, signalName: "pick_set_first_try",
        stimulus: stim,
        nudgeTarget: null,
        options: d.options,
        columnsHint: Math.min(d.options.length, 3),
        isCorrect: (opt) => opt.correct === true,
        optionRenderer: (opt) => {
          const c = document.createElement("div"); c.className = "psn-cell";
          let inner = "";
          for(let i=0;i<opt.count;i++) inner += `<span class="psn-obj">${imgOrEmoji(opt.object.img, opt.object.emoji, "psn-img", "psn-emoji")}</span>`;
          c.innerHTML = `<div class="psn-set">${inner}</div>`;
          return c;
        },
        mastery: slide.phase === "mastery"
      });
    }
  },

  MAKE_SET: {
    mount(host, slide){
      const N = slide.data.target, obj = slide.data.object;
      const wrap = document.createElement("div"); wrap.className = "makeset-stage";
      wrap.innerHTML = `
        <div class="makeset-target"><span class="ms-label">डालो</span><span class="num-glyph">${devNumeral(slide.data.target)}</span>${imgOrEmoji(obj.img, obj.emoji, "ms-goal-obj", "ms-goal-emoji")}</div>
        <div class="makeset-frame" id="msFrame"></div>
        <button class="makeset-add" id="msAdd"><span class="ms-add-plus">＋</span>${imgOrEmoji(obj.img, obj.emoji, "ms-add-obj", "ms-add-emoji")}</button>`;
      host.appendChild(wrap);
      const frame = wrap.querySelector("#msFrame"), addBtn = wrap.querySelector("#msAdd");
      const numerals = slide.data.numerals || [];
      const MAXITEMS = 5;                          // never allow more than 5
      let c = 0; state.attempts = 0; state.locked = false; state.hintActive = false;
      const refreshNav = ()=> setNavActive(!state.locked && !state.hintActive && c === N);  // आगे activates ONLY at exactly N — no premature/wrong submit; child self-corrects by adding more / removing (×). Nudge on the add-button guides an idle child.
      function makeItem(){
        const it = document.createElement("div"); it.className = "ms-item";
        it.innerHTML = imgOrEmoji(obj.img, obj.emoji, "cobj-img", "cobj-emoji") + `<span class="ms-del" aria-label="हटाओ">×</span>`;
        const remove = (e)=>{ if(e) e.stopPropagation(); if(state.locked || state.hintActive) return; it.remove(); c--; refreshNav(); };
        // remove ONLY via the explicit × badge — tapping the object itself must NOT delete it
        // (the count tutorial teaches "tap the object to count it"; a placed apple that vanishes on tap
        //  would silently destroy the child's work)
        it.querySelector(".ms-del").onclick = remove;
        frame.appendChild(it); return it;
      }
      addBtn.onclick = ()=>{
        if(state.locked || state.hintActive) return;
        if(c >= MAXITEMS){ addBtn.classList.add("shake"); setTimeout(()=> addBtn.classList.remove("shake"), 420); return; }  // cap at 5
        c++; makeItem();
        play("assets/Audio/vo_num_" + c + "." + AUDIO_EXT);   // count up as you add
        SwiftPAL.emit("make_set_add", { slide_id: slide.id, count: c });
        refreshNav();
      };
      // HINT = count what the child actually placed (highlight + say the number)
      const runHint = (after)=>{
        state.hintActive = true; refreshNav();
        demoCount([...frame.querySelectorAll(".ms-item")], numerals, ()=>{ state.hintActive = false; refreshNav(); if(after) after(); });
      };
      $("hintBtn").onclick = ()=>{ if(state.locked || state.hintActive) return;
        SwiftPAL.emit("hint_shown", { slide_id: slide.id, manual: true }); runHint(); };
      // आगे = SUBMIT. correct → celebrate & advance. wrong → graduated scaffold, same as
      // everywhere: 1st = try again, 2nd = count-demo hint, 3rd = REVEAL (auto-fix to N,
      // count 1..N automatically, then move to the next slide).
      $("navBtn").onclick = ()=>{
        if(state.locked || state.hintActive || c !== N) return;   // gated to exactly N → only the correct-set path runs (self-correcting design)
        if(c === N){
          state.locked = true; refreshNav();
          SwiftPAL.emit("make_set_correct", { slide_id: slide.id, phase: slide.phase,
            value: true, target: N, attempts: state.attempts + 1, latency_ms: Date.now()-state.slideStart });
          play("assets/Audio/vo_total_" + N + "." + AUDIO_EXT, ()=>
            celebrateThenAdvance(slide, false));   // standard: confetti + VO + auto-advance, no popup
          return;
        }
        state.attempts++;
        SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts, made: c, target: N });
        const maxA = (CARD.scaffold_rules && CARD.scaffold_rules.max_attempts) || 3;
        $("hintBtn").classList.add("show","hint-glow");
        if(state.attempts >= maxA){
          // 3rd wrong → reveal: correct the set to exactly N, count it 1..N, then advance
          state.locked = true; state.scaffoldLevel = 3; refreshNav();
          while(frame.querySelectorAll(".ms-item").length > N) frame.querySelector(".ms-item:last-child").remove();
          while(frame.querySelectorAll(".ms-item").length < N) makeItem();
          c = N;
          SwiftPAL.emit("answer_revealed", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
          state.hintActive = true;
          // count the (now-correct) set 1..N, then say the total "कुल N", then advance
          demoCount([...frame.querySelectorAll(".ms-item")], numerals, ()=>{
            state.hintActive = false;
            play("assets/Audio/vo_total_" + N + "." + AUDIO_EXT, ()=> setTimeout(()=> completeSlide(false), 500));
          });
        } else if(state.attempts === 2){
          runHint();                                                   // 2nd wrong → count what they made
        } else {
          // 1st wrong → try again, WITH the spoken VO (was silent)
          showBox("", audioText(slide,"try_again") || "फिर से कोशिश करो।", "wrong", wrongClip(slide), ()=>{});   /* [28i] graded: hint1 on rung 1 */
        }
      };
      setNavActive(false);
      pointNudgeAt(addBtn);
    }
  },

  COMPARE_SETS: {
    // Two visible groups, TWO picture options — the child taps the object that has MORE (or LESS).
    // No बराबर chip (lead review): equality is taught in MEET_COMPARE + produced on the see-saw, so
    // a judge question always has one clear answer between the two objects. Tap-to-answer: a wrong
    // tap buzzes + crosses + locks that card; the right one confetti-cheers + advances.
    mount(host, slide){
      const d = slide.data;
      const stage = stimulusCompareSets(d);
      // JUDGE (test): hide the "मिलाओ" reveal button — its one-to-one reveal + leftover glow gives the
      // answer away (and on a "less" question it glows the MORE set, pointing at the WRONG option).
      // The two rows stay visible so the child still compares by eye. (Reveal stays only on MEET_COMPARE.)
      const mb = stage.querySelector(".cmp-match-btn"); if(mb) mb.style.display = "none";
      const answer = (d.ask === "less") ? (d.a_count < d.b_count ? "a" : "b")
                                        : (d.a_count > d.b_count ? "a" : "b");
      const options = [ {kind:"a", obj:d.a_object}, {kind:"b", obj:d.b_object} ];
      // (option shuffle is now centralized in mountTapOptions — no per-module reverse needed)
      mountTapOptions({
        slide, host, signalName: "compare_first_try",
        stimulus: stage,
        nudgeTarget: null,
        options,
        columnsHint: 2,
        isCorrect: (opt)=> opt.kind === answer,
        optionRenderer: (opt)=>{
          const cell = document.createElement("div");
          cell.innerHTML = imgOrEmoji(opt.obj.img, opt.obj.emoji, "pic-img", "cmp-chip-emoji")
            + `<span class="cmp-chip-lbl">${opt.obj.word_hi || ""}</span>`;
          return cell;
        },
        mastery: slide.phase === "mastery"
      });
    }
  },

  MEET_COMPARE: {
    // TEACH BY DOING (lead review): the child COUNTS each group by tapping its objects one-by-one
    // (running numeral + spoken एक/दो/तीन), the top group then the bottom. Then the one-to-one
    // match reveals, the leftover glows, and Swiftie EXPLAINS the outcome by name — e.g.
    // "एक सेब बच गया, सेब ज़्यादा हैं, केले कम" / "कुछ नहीं बचा, दोनों बराबर". आगे appears after.
    mount(host, slide){
      const d = slide.data;
      const wrap = document.createElement("div"); wrap.className = "meet-compare";
      const stage = stimulusCompareSets({a_object:d.a_object, a_count:d.a_count,
                                          b_object:d.b_object, b_count:d.b_count, show_matches:false});
      const mb = stage.querySelector(".cmp-match-btn"); if(mb) mb.style.display = "none";
      const verdict = document.createElement("div");
      verdict.className = "cmp-verdict " + (d.outcome || "more");
      verdict.textContent = d.label_hi || "";
      wrap.appendChild(stage); wrap.appendChild(verdict);
      host.appendChild(wrap);

      state.gateNavUntilAudio = false; state.locked = false; state.ownsAudio = true; setNavActive(false);
      $("navBtn").onclick = ()=>{ if(state.locked) completeSlide(true); };

      // 🔊 replay: re-hear the teach line (and, once revealed, the explanation). autoPlayChain skips
      // count_intro/explain, so without this the header chip would be silent on teach slides.
      let revealed = false;
      state.replayAudio = ()=>{ const chain = [audioFor(slide, "count_intro")];
        if(revealed) chain.push(audioFor(slide, "explain"));
        playChain(chain.filter(Boolean), 0); };

      const rowA = [...stage.querySelectorAll(".cmp-row.top .cobj")];
      const rowB = [...stage.querySelectorAll(".cmp-row.bot .cobj")];

      // make one row countable-by-tapping; cb fires once every item in it is counted
      function countRow(items, cb){
        const nudgeNext = ()=>{ const nx = items.find(o=>!o.classList.contains("counted"));
          if(nx) pointNudgeAt(nx); else stopNudge(); };
        let n = 0;
        items.forEach(o=>{
          o.classList.add("tappable");
          o.onclick = ()=>{
            if(state.locked || o.classList.contains("counted")) return;
            o.classList.add("counted", "counting"); n++; sfxTap();
            let cal = o.querySelector(".count-callout");
            if(!cal){ cal = document.createElement("span"); cal.className = "count-callout"; o.appendChild(cal); }
            cal.textContent = n;
            play("assets/Audio/vo_num_" + n + "." + AUDIO_EXT, ()=>{});
            if(items.every(x=>x.classList.contains("counted"))){ stopNudge(); setTimeout(cb, 550); }
            else nudgeNext();
          };
        });
        nudgeNext();
        // [16h] Phase-1 autonomous mode (lead's 3-phase contract): the demo hand counts the row
        // BY ITSELF — drives the same handlers a child would, so behavior is identical.
        if(slide.data.auto){
          items.forEach(o=> o.classList.remove("tappable"));
          let ai = 0;
          (function autoTap(){
            if(CARD.slides[state.idx] !== slide || ai >= items.length) return;
            const o = items[ai++]; pointNudgeAt(o); if(o.onclick) o.onclick();
            setTimeout(autoTap, 950);
          })();
        }
      }

      // intro VO → count group A → count group B → reveal match + explain the outcome.
      // NB: uses non-autochain role names (count_intro / explain) so mountSlide's autoPlayChain
      // does NOT also fire the intro — this module owns its own audio sequence.
      play(audioFor(slide, "count_intro") || null, ()=>{
        countRow(rowA, ()=> countRow(rowB, ()=>{
          stage._revealMatches(()=>{
            verdict.classList.add("show","hint-glow"); setSwMood("point");
            state.locked = true; revealed = true; setNavActive(true);
            play(audioFor(slide, "explain") || null, ()=>{});
          });
        }));
      });
    }
  },

  MAKE_EQUAL: {
    // PRODUCE mechanic (see-saw): the left pan holds a fixed group; the child taps + जोड़ो to
    // add to the right pan (tap an added item to take it back). The beam tilts toward the heavier
    // side in real time; at equal it levels, locks, celebrates. Overshoot is enacted (invite to
    // remove), never a red ✗ — the KG "produce, don't pick" model.
    mount(host, slide){
      const d = slide.data, L = d.a_count, fixedObj = d.a_object, addObj = d.b_object;
      const MAXR = d.max || Math.max(L + 2, 6);
      const wrap = document.createElement("div"); wrap.className = "balance-stage";
      wrap.innerHTML = `
        <div class="balance">
          <div class="beam-wrap" id="beamWrap"><div class="beam"></div>
            <div class="pan pan-left"><div class="pan-grid" id="panL"></div></div>
            <div class="pan pan-right"><div class="pan-grid" id="panR"></div></div></div>
          <div class="fulcrum"></div>
        </div>
        <button class="balance-add" id="balAdd" type="button"></button>`;
      host.appendChild(wrap);
      const panL = wrap.querySelector("#panL"), panR = wrap.querySelector("#panR");
      const beam = wrap.querySelector("#beamWrap"), addBtn = wrap.querySelector("#balAdd");
      const balance = wrap.querySelector(".balance");
      addBtn.innerHTML = imgOrEmoji(addObj.img, addObj.emoji, "cobj-img", "cobj-emoji") + `<span>+ जोड़ो</span>`;
      for(let i=0;i<L;i++){ const c=document.createElement("span"); c.className="cobj";
        c.innerHTML = imgOrEmoji(fixedObj.img, fixedObj.emoji, "cobj-img", "cobj-emoji"); panL.appendChild(c); }
      let right = 0; state.locked = false; state.attempts = 0; let tipT = 0;
      const TILT = 6, TMAX = 15;
      const tilt = ()=>{ const diff = right - L; const deg = Math.max(-TMAX, Math.min(TMAX, diff*TILT));
        beam.style.transform = `translateX(-50%) rotate(${deg}deg)`; balance.classList.toggle("level", diff===0 && right>0); };
      const check = ()=>{ if(state.locked) return; const diff = right - L;
        if(diff===0 && right>0){ state.locked = true; setNavActive(true);
          SwiftPAL.emit("make_equal_correct", { slide_id: slide.id, phase: slide.phase, value: true,
            count: right, target: L, attempts: state.attempts + 1, latency_ms: Date.now()-state.slideStart });
          showBox("⚖️", audioText(slide,"balanced") || "बराबर! दोनों बराबर हैं।", "correct", audioFor(slide,"balanced") || null, ()=>{});
        } else if(diff > 0){ state.attempts++;
          SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, made: right, target: L });
          if(Date.now()-tipT > 1200){ tipT = Date.now();
            showBox("", audioText(slide,"too_many") || "बहुत ज़्यादा! एक हटाओ।", "hint", audioFor(slide,"too_many") || wrongClip(slide), ()=>{}); } }   /* [28i] ladder fallback */
      };
      const addItem = ()=>{ const c=document.createElement("span"); c.className="cobj added";
        c.innerHTML = imgOrEmoji(addObj.img, addObj.emoji, "cobj-img", "cobj-emoji");
        c.onclick = ()=>{ if(state.locked) return; c.remove(); right = Math.max(0, right-1); tilt(); check(); };
        panR.appendChild(c); right++; };
      addBtn.onclick = ()=>{ if(state.locked) return;
        if(right >= MAXR){ addBtn.classList.add("shake"); setTimeout(()=> addBtn.classList.remove("shake"), 400); return; }
        addItem(); tilt(); sfxTap();
        // count EVERY added item aloud INCLUDING the final/target one (एक, दो, तीन) — then, on the
        // last count, the "बराबर" VO follows (check runs in the count's onEnd so the number isn't cut).
        if(right <= L) play("assets/Audio/vo_num_" + right + "." + AUDIO_EXT, right === L ? ()=> check() : ()=>{});
        else check();   // overshoot → "एक हटाओ" hint
      };
      setNavActive(false);
      $("navBtn").onclick = ()=>{ if(state.locked) completeSlide(true); };
      tilt();                 // START tilted toward the heavier (left) group — the see-saw is NOT level yet
      pointNudgeAt(addBtn);
    }
  },

  MEET_PATTERN: {
    // TEACH: show a repeating pattern and pulse the repeating UNIT (first data.unit_len cells) a few
    // times so the child sees "this part comes again". Nav gated on the VO, like MEET_NUMBER.
    mount(host, slide){
      const d = slide.data;
      const wrap = document.createElement("div"); wrap.className = "pattern-stage";
      const lbl = document.createElement("div"); lbl.className = "pat-unit-lbl"; lbl.textContent = "यह हिस्सा दोहराता है 🔁";
      const row = document.createElement("div"); row.className = "pattern-row";
      d.items.forEach(o=>{ const c = document.createElement("div"); c.className = "pat-cell";
        c.innerHTML = imgOrEmoji(o.img, o.emoji, "cobj-img", "cobj-emoji"); row.appendChild(c); });
      wrap.appendChild(lbl); wrap.appendChild(row); host.appendChild(wrap);
      state.gateNavUntilAudio = true; setNavActive(false);
      $("navBtn").onclick = ()=> completeSlide(true);
      const cells = [...row.children]; let rep = 0;
      const glow = ()=>{ cells.forEach((c,i)=> { if(i < d.unit_len) c.classList.add("unit-glow"); });
        setTimeout(()=> cells.forEach(c=> c.classList.remove("unit-glow")), 1100); };
      glow(); const t = setInterval(()=>{ if(rep++ >= 2){ clearInterval(t); return; } glow(); }, 1700);
    }
  },

  PATTERN_BUILD: {
    // PRODUCE: a pattern with empty ghost slot(s) — at the END (extend) or in the MIDDLE (fill the
    // gap). Tap a tray item to drop it into the active slot; the correct item = data.items[slot].
    // Wrong taps bounce (enacted, no ✗). Fill every blank → complete. data:{items[],blanks[],tray[]}.
    mount(host, slide){
      const d = slide.data;
      const wrap = document.createElement("div"); wrap.className = "pattern-stage";
      const row = document.createElement("div"); row.className = "pattern-row";
      const cells = d.items.map((o,i)=>{
        const c = document.createElement("div");
        if(d.blanks.includes(i)){ c.className = "pat-ghost"; c.innerHTML = `<span class="qmark">?</span>`; }
        else { c.className = "pat-cell"; c.innerHTML = imgOrEmoji(o.img, o.emoji, "cobj-img", "cobj-emoji"); }
        row.appendChild(c); return c;
      });
      const tray = document.createElement("div"); tray.className = "pattern-tray";
      d.tray.forEach(o=>{ const t = document.createElement("div"); t.className = "pat-tray-item"; t._obj = o;
        t.innerHTML = imgOrEmoji(o.img, o.emoji, "cobj-img", "cobj-emoji"); tray.appendChild(t); });
      wrap.appendChild(row); wrap.appendChild(tray); host.appendChild(wrap);
      const blanks = d.blanks.slice(); let bi = 0, wrongStreak = 0, revealedAny = false;
      state.locked = false; state.attempts = 0;
      const key = (o)=> o.img || o.emoji;
      const activeGhost = ()=> cells[blanks[bi]];
      const markActive = ()=>{ cells.forEach(c=> c.classList.remove("active"));
        // idle nudge points at the ACTIVE BLANK ('?' slot = "put one here"), re-armed per blank —
        // NEVER at a tray answer; startNudge is phase-aware so it's silent in practice/mastery.
        if(bi < blanks.length){ activeGhost().classList.add("active"); startNudge(slide, activeGhost()); } else stopNudge(); };
      const flashHint = ()=>{ const want = d.items[blanks[bi]], g = activeGhost(); const prev = g.innerHTML;
        g.innerHTML = imgOrEmoji(want.img, want.emoji, "cobj-img", "cobj-emoji"); g.style.opacity = ".4";
        setTimeout(()=>{ if(g.classList.contains("pat-ghost")){ g.innerHTML = prev; g.style.opacity = ""; } }, 950); };
      const placeCorrect = ()=>{                      // one placement path (tap AND reveal)
        clearHold(tray);                                     /* [28l] release the terminal hold */
        const want = d.items[blanks[bi]], g = activeGhost();
        g.className = "pat-cell"; g.innerHTML = imgOrEmoji(want.img, want.emoji, "cobj-img", "cobj-emoji");
        g.classList.add("unit-glow"); setTimeout(()=> g.classList.remove("unit-glow"), 700); bi++;
        if(bi >= blanks.length){
          state.locked = true; stopNudge();
          SwiftPAL.emit("pattern_extend_correct", { slide_id: slide.id, phase: slide.phase, value: !revealedAny,
            attempts: state.attempts + 1, latency_ms: Date.now()-state.slideStart });
          // engine standard: confetti + cheer + correct VO + AUTO-advance — no popup, no आगे gate.
          celebrateThenAdvance(slide, revealedAny);
        } else markActive();
      };
      markActive();
      tray.querySelectorAll(".pat-tray-item").forEach(t=>{
        t.onclick = ()=>{
          if(state.locked || bi >= blanks.length) return;
          stopNudge();
          const want = d.items[blanks[bi]];
          if(key(t._obj) === key(want)){
            wrongStreak = 0;
            placeCorrect();
          } else {
            state.attempts++;
            t.classList.add("shake"); setTimeout(()=> t.classList.remove("shake"), 420);
            activeGhost().classList.add("shake"); setTimeout(()=> activeGhost().classList.remove("shake"), 420);
            SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
            $("hintBtn").classList.add("show","hint-glow");
            // layered ladder, standard-aligned: L1 spoken try-again (buzz + Swiftie, no popup) →
            // L2 flash the answer ghost + spoken hint → L3 reveal ceiling: DEMONSTRATE the placement.
            if(++wrongStreak >= (CARD.scaffold_rules.max_attempts||3)){
              revealedAny = true; wrongStreak = 0;
              activeGhost().classList.add("reveal-glow");
              play(audioFor(slide,"reveal") || audioFor(slide,"hint") || null, ()=>{});
              /* [28l] was: setTimeout(placeCorrect, 1000) — the engine ANSWERED for the child. */
              if(maySolveFor(slide)) setTimeout(()=>{ placeCorrect(); }, 1000);
              else terminalHold([...tray.children].find(x=> key(x._obj) === key(d.items[blanks[bi]])
                                  && !x.classList.contains("used")), tray.children, slide);
            }
            else if(state.attempts >= 2){ flashHint(); play(midHint(slide), ()=>{}); }   /* [28k] rung 2 */
            else dragWrong(slide);
          }
        };
      });
      setNavActive(false);
      $("navBtn").onclick = ()=>{};   // completion is automatic now — आगे never gates a solved pattern
      $("hintBtn").onclick = ()=>{ if(!state.locked && bi < blanks.length) flashHint(); };
      // NB: the idle nudge is armed by markActive() → startNudge(activeGhost) above — it points at the
      // BLANK, phase-aware. (Bug fix: was pointNudgeAt(first tray tile) = an immediate hand on the WRONG
      // answer on most slides, and it showed even in mastery.)
    }
  },

  /* ===== NUMBER-SEQUENCE PATH (MTKGA01_L02_S04 — "completes a number sequence within 20") =====
     Three additive modules that share the .seq-* number-path skin. Numerals are crisp text glyphs
     (Baloo), only the tile chrome is rounded — content-true geometry (never round the number). */

  MEET_SEQUENCE: {
    // TEACH BY DOING: a number path; a token sits on the first cell. The child taps the glowing NEXT
    // cell to hop the token forward, each number spoken (vo_num_N) with an ascending thunk — so the
    // child ENACTS "numbers move forward one step at a time" (curriculum teach spec). Nav gates until
    // the token reaches the end, then Swiftie's explain line plays. data:{path:[n…], token?}.
    mount(host, slide){
      const d = slide.data, nums = d.path;
      state.ownsAudio = true; setNavActive(false); setSwMood("teach");
      const stage = document.createElement("div"); stage.className = "seq-stage";
      const path  = document.createElement("div"); path.className = "seq-path";
      const cw = nums.length > 7 ? 74 : 90;
      const cells = nums.map((n,i)=>{
        if(i){ const con = document.createElement("div"); con.className = "seq-connector"; path.appendChild(con); }
        const cell = document.createElement("div"); cell.className = "seq-cell";
        cell.style.width = cell.style.height = cw+"px"; cell.style.fontSize = Math.round(cw*0.56)+"px";
        cell.textContent = n; path.appendChild(cell); return cell;
      });
      stage.appendChild(path); host.appendChild(stage);
      const token = document.createElement("span"); token.className = "seq-token"; token.textContent = d.token || "🐤";
      let pos = 0;
      const place = ()=>{ cells.forEach((c,i)=> c.classList.toggle("lit", i <= pos));
        if(!cells[pos].contains(token)) cells[pos].appendChild(token); };
      const glowNext = ()=>{ cells.forEach((c,i)=> c.classList.toggle("active", i === pos+1));
        if(pos+1 < cells.length) startNudge(slide, cells[pos+1]); else stopNudge(); };
      place(); btThunk(1); play("assets/Audio/vo_num_" + nums[0] + "." + AUDIO_EXT, ()=>{}); glowNext();
      const advance = ()=>{
        if(pos >= cells.length-1) return;
        pos++; cells[pos].classList.remove("active"); place(); btThunk(pos+1);
        play("assets/Audio/vo_num_" + nums[pos] + "." + AUDIO_EXT, ()=>{});
        if(pos >= cells.length-1){ stopNudge();
          SwiftPAL.emit("meet_sequence_done", { slide_id: slide.id, phase: slide.phase });
          setTimeout(()=> play(audioFor(slide, "explain") || null, ()=> setNavActive(true)), 500);
        } else glowNext();
      };
      cells.forEach((c,i)=>{ c.onclick = ()=>{ if(i === pos+1) advance(); }; });
      // 🔊 replay re-speaks the current number (module owns its audio; autoPlayChain is skipped)
      state.replayAudio = ()=> play("assets/Audio/vo_num_" + nums[pos] + "." + AUDIO_EXT, ()=>{});
      $("navBtn").onclick = ()=> completeSlide(true);
    }
  },

  SEQUENCE_COMPLETE: {
    // PRODUCE test: a number path with blank(s); tap a tray numeral into the active blank. Correct =
    // path[blankIdx]. Wrong = shake + soft buzz + spoken try_again; reveal (demonstrate) after
    // max_attempts. Fills left→right. data:{path:[n… , with the blank positions still holding the true
    // number], blanks:[idx…], tray:[n…] (numerals incl. misconception distractors)}.
    mount(host, slide){
      const d = slide.data;
      const stage = document.createElement("div"); stage.className = "seq-stage";
      const path  = document.createElement("div"); path.className = "seq-path";
      const cw = d.path.length > 7 ? 74 : 90;
      const cells = d.path.map((n,i)=>{
        if(i){ const con = document.createElement("div"); con.className = "seq-connector"; path.appendChild(con); }
        const cell = document.createElement("div");
        cell.style.width = cell.style.height = cw+"px"; cell.style.fontSize = Math.round(cw*0.56)+"px";
        if(d.blanks.includes(i)){ cell.className = "seq-cell seq-ghost"; cell.innerHTML = '<span class="seq-q">?</span>'; }
        else { cell.className = "seq-cell filled"; cell.textContent = n; }
        path.appendChild(cell); return cell;
      });
      const tray = document.createElement("div"); tray.className = "seq-tray";
      d.tray.forEach(n=>{ const t = document.createElement("div"); t.className = "seq-tile"; t._num = n; t.textContent = n; tray.appendChild(t); });
      /* [27j] OPT-IN PICTURE STIMULUS. HIKGH04_L02_S02's deck asks "Give the Picture of house/tap/
         BUS/JUG" on all 4 build-the-word slides, and the module had nowhere to hang one — it read
         only path/blanks/tray and never called mountTapOptions, so authoring d.img was inert.
         Reuses the same stimulusPic() every other module uses, so the picture looks identical to the
         rest of the fleet. Purely additive: a card without img/picture/emoji renders exactly as before,
         and .seq-stage is already a flex column so the picture simply stacks above the path. */
      if(d.img || d.picture || d.emoji){
        stage.appendChild(stimulusPic(d.picture, d.emoji, d.img));
      }
      stage.appendChild(path); stage.appendChild(tray); host.appendChild(stage);

      const blanks = d.blanks.slice(); let bi = 0, wrongStreak = 0, revealedAny = false;
      state.locked = false; state.attempts = 0;
      const activeGhost = ()=> cells[blanks[bi]];
      const markActive = ()=>{ cells.forEach(c=> c.classList.remove("active"));
        if(bi < blanks.length){ activeGhost().classList.add("active"); startNudge(slide, activeGhost()); } else stopNudge(); };
      const placeCorrect = ()=>{
        clearHold(tray);                                     /* [28l] release the terminal hold */
        const want = d.path[blanks[bi]], g = activeGhost();
        g.className = "seq-cell filled unit-glow"; g.textContent = want; setTimeout(()=> g.classList.remove("unit-glow"), 700);
        const tile = [...tray.children].find(x=> x._num === want && !x.classList.contains("used")); if(tile) tile.classList.add("used");
        bi++;
        if(bi >= blanks.length){
          state.locked = true; stopNudge();
          SwiftPAL.emit("sequence_complete_correct", { slide_id: slide.id, phase: slide.phase, value: !revealedAny,
            attempts: state.attempts + 1, latency_ms: Date.now()-state.slideStart });
          celebrateThenAdvance(slide, revealedAny);
        } else markActive();
      };
      markActive();
      tray.querySelectorAll(".seq-tile").forEach(t=>{
        t.onclick = ()=>{
          if(state.locked || bi >= blanks.length || t.classList.contains("used")) return;
          stopNudge();
          if(t._num === d.path[blanks[bi]]){ wrongStreak = 0; placeCorrect(); }
          else {
            state.attempts++;
            /* [LOCAL FIX 2026-08-03] was "shake" — an undefined keyframe anywhere in this engine, so
               a wrong letter tap rendered NOTHING while every other mechanic flashes red. Reuse the
               fleet-standard .wrong-flash + buzzShake (see .opt-cell.wrong-flash in style.css). */
            t.classList.add("wrong-flash"); setTimeout(()=> t.classList.remove("wrong-flash"), 700);
            activeGhost().classList.add("wrong-flash"); setTimeout(()=> activeGhost().classList.remove("wrong-flash"), 700);
            SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
            $("hintBtn").classList.add("show","hint-glow");
            if(++wrongStreak >= (CARD.scaffold_rules.max_attempts || 3)){
              revealedAny = true; wrongStreak = 0;
              activeGhost().classList.add("reveal-glow");
              /* [LOCAL 2026-08-03 — HIKGH04_L02_S02] THE TERMINAL RUNG MUST SPEAK THE HINT THAT
                 NAMES THE ANSWER, not the terse reveal line. QA reported "hint vo does not play at
                 places"; measured on G6/P4/P7 from a fresh slide entry, the ladder ran
                 vo_hint1_build -> vo_reveal_word ("यह सही शब्द है।", 1.96s) and the authored naming
                 hint (vo_hint2_ghar/_nal/_bas/_jag) was UNREACHABLE on all four build slides.
                 Cause: max_attempts is 2, so the `attempts >= 2` mid-rung further down can never be
                 entered — this branch is the ONLY terminal path, and it preferred `reveal`.
                 mountTapOptions.revealAnswer already prefers `hint` here, so the two mechanics
                 disagreed about the same rung on the same card; the tap contract is the blessed one
                 ("speak the rung that NAMES the answer, then wait for the child").
                 Reveal-first is kept for the auto-solve path ONLY (tutorial, where the engine is
                 about to demonstrate and "this is the correct word" is the apt line). */
              const _termClip = maySolveFor(slide)
                ? (audioFor(slide, "reveal") || audioFor(slide, "hint"))
                : (audioFor(slide, "hint")   || audioFor(slide, "reveal"));
              play(_termClip || null, ()=>{});
              /* [28l] was: setTimeout(placeCorrect, 1000) — the engine ANSWERED for the child. */
              if(maySolveFor(slide)) setTimeout(()=> placeCorrect(), 1000);
              else terminalHold([...tray.children].find(x=> x._num === d.path[blanks[bi]]
                                  && !x.classList.contains("used")), tray.children, slide);
            } else dragWrong(slide);
          }
        };
      });
      setNavActive(false); $("navBtn").onclick = ()=>{};   // completion is automatic — never gate a solved path
      $("hintBtn").onclick = ()=>{ if(!state.locked && bi < blanks.length){ const g = activeGhost();
        g.classList.add("reveal-glow"); setTimeout(()=> g.classList.remove("reveal-glow"), 800); } };
    }
  },

  SEQUENCE_NEXT: {
    // PICK test (what comes next / before): a number path with ONE '?' cell (null in data.path) is the
    // stimulus; the child taps the correct numeral option. Reuses mountTapOptions → full tap-to-answer
    // contract (wrong=buzz+✗+lock+try_again, right=confetti+advance) + speak-the-number-on-tap +
    // mastery scoring. data:{path:[n…,null,…], options:[{num, audio:"vo_num_N", correct}]}.
    mount(host, slide){
      const d = slide.data;
      const stim = document.createElement("div"); stim.className = "seq-stage";
      const path = document.createElement("div"); path.className = "seq-path";
      const cw = d.path.length > 7 ? 74 : 90;
      d.path.forEach((n,i)=>{
        if(i){ const con = document.createElement("div"); con.className = "seq-connector"; path.appendChild(con); }
        const cell = document.createElement("div");
        cell.style.width = cell.style.height = cw+"px"; cell.style.fontSize = Math.round(cw*0.56)+"px";
        if(n === null){ cell.className = "seq-cell seq-ghost active"; cell.innerHTML = '<span class="seq-q">?</span>'; }
        else { cell.className = "seq-cell filled"; cell.textContent = n; }
        path.appendChild(cell);
      });
      stim.appendChild(path);
      mountTapOptions({
        slide, host, signalName: "sequence_next_correct", stimulus: stim,
        options: d.options,
        optionRenderer: (o)=>{ const cell = document.createElement("div"); const s = document.createElement("span");
          s.className = "seq-optnum"; s.textContent = o.num; cell.appendChild(s); return cell; },
        isCorrect: (o)=> o.correct === true,
        mastery: slide.phase === "mastery",
        columnsHint: d.options.length,
        nudgeTarget: null
      });
    }
  },

  /* ===== ORDERING / SERIATION (MTKGA02_L02_S02 — "orders three objects by size, length, or weight") =====
     Additive modules sharing the .ord-* skin. Objects render at true magnitude (size scale / bar length);
     weight is assessed by 'pick the heaviest' (weight is not visual) — targeting the bigger=heavier
     misconception with a big-but-light distractor. */

  MEET_ORDER: {
    // TEACH BY DOING: the 3 objects are shown already in order (small→big / short→long / light→heavy);
    // the child taps each left→right to hear its rank name (सबसे छोटा / बीच का / सबसे बड़ा etc.), then an
    // explain line plays and नav unlocks. data:{by, items:[{mag,img/emoji/color}] (ascending), rank_audio:[id…],
    // arrow_lo, arrow_hi, hint_icon?}.
    mount(host, slide){
      const d = slide.data; state.ownsAudio = true; setNavActive(false); setSwMood("teach");
      const stage = document.createElement("div"); stage.className = "ord-stage ord-" + d.by;
      const arrow = document.createElement("div"); arrow.className = "ord-arrow";
      arrow.innerHTML = `<span>${d.arrow_lo||""}</span><span class="ord-arrowline"></span><span>${d.arrow_hi||""}</span>`;
      const row = document.createElement("div"); row.className = "ord-tray";
      const cells = d.items.map((o,i)=>{ const el = document.createElement("div"); el.className = "ord-item";
        el.style.opacity = ".5"; el.innerHTML = renderOrdObj(o, d.by); row.appendChild(el); return el; });
      if(d.hint_icon){ const hi = document.createElement("div"); hi.className = "ord-hint-icon"; hi.textContent = d.hint_icon; stage.appendChild(hi); }
      stage.appendChild(arrow); stage.appendChild(row); host.appendChild(stage);
      let tapped = 0;
      const nudgeNext = ()=>{ cells.forEach((c,i)=> c.classList.toggle("active", i === tapped));
        if(tapped < cells.length) startNudge(slide, cells[tapped]); else stopNudge(); };
      if(d.auto){
        // 16j: Phase-1 AUTONOMOUS mode (3-phase contract) — the demo touches each item L→R by
        // ITSELF, speaks its rank, then explains + unlocks आगे. Child watches. (Mirrors auto-INTRO.)
        stopNudge();
        state.demoRunning = true;   // [24a N8] replay chip must not gen-kill the rank chain
        let ai = 0;
        const aStep = ()=>{
          if(CARD.slides[state.idx] !== slide) return;
          if(ai >= cells.length){ stopNudge();
            SwiftPAL.emit("meet_order_done", { slide_id: slide.id, phase: slide.phase });
            setTimeout(()=> play(audioFor(slide, "explain") || null, ()=>{ state.demoRunning = false; setNavActive(true); }), 300);
            return; }
          const c = cells[ai]; cells.forEach((x,j)=> x.classList.toggle("active", j === ai));
          c.style.opacity = "1"; c.classList.add("reveal-glow"); pointNudgeAt(c);
          setTimeout(()=> c.classList.remove("reveal-glow"), 600);
          const rid = d.rank_audio[ai]; ai++;
          play(rid ? "assets/Audio/" + rid + "." + AUDIO_EXT : null, ()=> setTimeout(aStep, 520));
        };
        setTimeout(aStep, 400);
      } else {
        nudgeNext();
        cells.forEach((c,i)=>{ c.onclick = ()=>{ if(i !== tapped) return; stopNudge();
          c.classList.remove("active"); c.style.opacity = "1"; c.classList.add("reveal-glow");
          setTimeout(()=> c.classList.remove("reveal-glow"), 600);
          play("assets/Audio/" + (d.rank_audio[i]) + "." + AUDIO_EXT, ()=>{}); tapped++;
          if(tapped >= cells.length){ stopNudge();
            SwiftPAL.emit("meet_order_done", { slide_id: slide.id, phase: slide.phase });
            setTimeout(()=> play(audioFor(slide, "explain") || null, ()=> setNavActive(true)), 450);
          } else nudgeNext();
        }; });
      }
      state.replayAudio = ()=> play(audioFor(slide, "explain") || null, ()=>{});
      $("navBtn").onclick = ()=> completeSlide(true);
    }
  },

  /* 16j NEW (g6 ordering tutorial): teach a 2-way attribute (बड़ा/छोटा · लंबा/छोटा · भारी/हल्का)
     BEFORE ordering three. Autonomous — points at each of 2 objects, speaks its label, then concludes
     + unlocks आगे. Reuses ord-stage. data:{by, items:[{img/emoji/color,mag}], label_audio:[id,id]}. */
  COMPARE_TWO: {
    mount(host, slide){
      const d = slide.data; state.ownsAudio = true; state.demoRunning = true; setNavActive(false); setSwMood("teach");   // [24a N8]
      const stage = document.createElement("div"); stage.className = "ord-stage cmp2-stage ord-" + (d.by || "size");
      const row = document.createElement("div"); row.className = "ord-tray";
      const cells = d.items.map((o)=>{ const el = document.createElement("div"); el.className = "ord-item";
        el.style.opacity = ".5"; el.innerHTML = renderOrdObj(o, d.by); row.appendChild(el); return el; });
      stage.appendChild(row); host.appendChild(stage);
      let ai = 0;
      const aStep = ()=>{
        if(CARD.slides[state.idx] !== slide) return;
        if(ai >= cells.length){ stopNudge();
          SwiftPAL.emit("compare_two_done", { slide_id: slide.id, phase: slide.phase });
          setTimeout(()=> play(audioFor(slide, "explain") || audioFor(slide, "conclude") || null, ()=>{ state.demoRunning = false; setNavActive(true); }), 300);
          return; }
        const c = cells[ai]; cells.forEach((x,j)=> x.classList.toggle("active", j === ai));
        c.style.opacity = "1"; c.classList.add("reveal-glow"); pointNudgeAt(c);
        setTimeout(()=> c.classList.remove("reveal-glow"), 600);
        const lid = (d.label_audio || [])[ai]; ai++;
        play(lid ? "assets/Audio/" + lid + "." + AUDIO_EXT : null, ()=> setTimeout(aStep, 520));
      };
      setTimeout(aStep, 400);
      state.replayAudio = ()=> play(audioFor(slide, "explain") || audioFor(slide, "conclude") || null, ()=>{});
      $("navBtn").onclick = ()=> completeSlide(true);
    }
  },

  ORDER_BY_ATTR: {
    // PRODUCE test: 3 scrambled objects + a left→right strip (arrow छोटा→बड़ा). Tap the smallest-remaining
    // → it fills the next slot. Wrong (not the current smallest) = shake + soft buzz + spoken try_again;
    // demonstrate after max_attempts. data:{by, items:[{mag,img/emoji/color}], arrow_lo, arrow_hi}.
    mount(host, slide){
      const d = slide.data;
      const stage = document.createElement("div"); stage.className = "ord-stage ord-" + d.by;
      const arrow = document.createElement("div"); arrow.className = "ord-arrow";
      arrow.innerHTML = `<span>${d.arrow_lo||""}</span><span class="ord-arrowline"></span><span>${d.arrow_hi||""}</span>`;
      const strip = document.createElement("div"); strip.className = "ord-strip";
      const n = d.items.length; const slots = [];
      for(let i=0;i<n;i++){ const sl = document.createElement("div"); sl.className = "ord-slot"; strip.appendChild(sl); slots.push(sl); }
      const tray = document.createElement("div"); tray.className = "ord-tray";
      const disp = d.items.slice(); for(let i=disp.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [disp[i],disp[j]]=[disp[j],disp[i]]; }
      const sortedMags = d.items.map(o=>o.mag).slice().sort((a,b)=>a-b);
      const tiles = disp.map(o=>{ const el = document.createElement("div"); el.className = "ord-item"; el._mag = o.mag;
        el.innerHTML = renderOrdObj(o, d.by); tray.appendChild(el); return el; });
      stage.appendChild(arrow); stage.appendChild(strip); stage.appendChild(tray); host.appendChild(stage);
      let placed = 0, wrongStreak = 0, revealed = false; state.locked = false; state.attempts = 0;
      const wantMag = ()=> sortedMags[placed];
      const nextTile = ()=> tiles.find(x=> !x.classList.contains("used") && x._mag === wantMag());
      const markActive = ()=>{ slots.forEach((s,i)=> s.classList.toggle("active", i === placed));
        if(placed < n) startNudge(slide, nextTile()); else stopNudge(); };
      const placeInto = (tile)=>{ const slot = slots[placed]; slot.classList.remove("active"); slot.classList.add("filled");
        slot.innerHTML = tile.innerHTML; tile.classList.add("used"); placed++;
        if(placed >= n){ state.locked = true; stopNudge();
          SwiftPAL.emit("order_by_attr_correct", { slide_id: slide.id, phase: slide.phase, value: !revealed,
            attempts: state.attempts + 1, latency_ms: Date.now()-state.slideStart });
          celebrateThenAdvance(slide, revealed);
        } else markActive();
      };
      markActive();
      tiles.forEach(t=>{ t.onclick = ()=>{ if(state.locked || t.classList.contains("used")) return; stopNudge();
        if(t._mag === wantMag()){ wrongStreak = 0; placeInto(t); }
        else { state.attempts++; t.classList.add("shake"); setTimeout(()=> t.classList.remove("shake"), 420);
          SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
          $("hintBtn").classList.add("show","hint-glow");
          if(++wrongStreak >= (CARD.scaffold_rules.max_attempts || 3)){ revealed = true; wrongStreak = 0;
            const c = nextTile(); if(c){ c.classList.add("reveal-glow"); play(audioFor(slide,"reveal")||null, ()=>{});
              setTimeout(()=>{ c.classList.remove("reveal-glow"); placeInto(c); }, 1000); }
          } else dragWrong(slide);
        }
      }; });
      setNavActive(false); $("navBtn").onclick = ()=>{};
      $("hintBtn").onclick = ()=>{ if(!state.locked){ const t = nextTile(); if(t){ t.classList.add("reveal-glow"); setTimeout(()=> t.classList.remove("reveal-glow"), 800); } } };
    }
  },

  PICK_EXTREME: {
    // PICK test: tap the object that is the MOST (सबसे बड़ा / सबसे लंबा / सबसे भारी). For weight, options
    // include a big-but-light distractor to break the bigger=heavier misconception. Reuses mountTapOptions
    // → tap-to-answer + speak-the-word-on-tap + mastery. data:{by, options:[{img/emoji/color,mag,label,audio,correct}]}.
    mount(host, slide){
      const d = slide.data;
      mountTapOptions({
        slide, host, signalName: "pick_extreme_correct", stimulus: null,
        options: d.options,
        optionRenderer: (o)=>{ const cell = document.createElement("div"); cell.className = "ord-pick";
          cell.innerHTML = renderOrdObj(o, d.by) + (o.label ? `<span class="lbl">${o.label}</span>` : ""); return cell; },
        isCorrect: (o)=> o.correct === true,
        mastery: slide.phase === "mastery",
        columnsHint: d.options.length,
        nudgeTarget: null
      });
    }
  },

  ORDER_BY_WEIGHT: {
    // PRODUCE test — WEIGHT seriation via A-vs-B COMPARISON (weight is not visual). Two pans: tap a tray
    // object → it loads the next empty pan; with BOTH loaded the beam tilts toward the heavier (it DROPS)
    // + thunk, and the lighter one RISES + pulses. Tap the lighter (risen) object to send it to the next
    // हल्का→भारी slot — accepted only if it is the lightest still unplaced; else it is the lighter of a
    // heavy pair (an even lighter one exists) → soft buzz + try_again, both return. The last object
    // auto-places (it is forced). Objects render at sizes that DON'T match weight (a big balloon can be
    // light) so the SCALE is the only cue. data:{items:[{wmag,dmag,img,emoji}], arrow_lo, arrow_hi}.
    mount(host, slide){
      const d = slide.data;
      const stage = document.createElement("div"); stage.className = "ord-stage ord-weight";
      const arrow = document.createElement("div"); arrow.className = "ord-arrow";
      arrow.innerHTML = `<span>${d.arrow_lo||"हल्का"}</span><span class="ord-arrowline"></span><span>${d.arrow_hi||"भारी"}</span>`;
      const scale = document.createElement("div"); scale.className = "owt-scale";
      scale.innerHTML = `<div class="owt-foot"></div><div class="owt-post"></div>` +
        `<div class="owt-beamwrap"><div class="owt-beam"></div><div class="owt-cap"></div>` +
        `<div class="owt-arm l"></div><div class="owt-arm r"></div>` +
        `<div class="owt-pan l"><div class="owt-load"></div></div><div class="owt-pan r"><div class="owt-load"></div></div></div>`;
      const beamwrap = scale.querySelector(".owt-beamwrap");
      const panEl = { l: scale.querySelector(".owt-pan.l"), r: scale.querySelector(".owt-pan.r") };
      const loadEl = { l: panEl.l.querySelector(".owt-load"), r: panEl.r.querySelector(".owt-load") };
      const strip = document.createElement("div"); strip.className = "ord-strip";
      const n = d.items.length; const slots = [];
      for(let i=0;i<n;i++){ const sl = document.createElement("div"); sl.className = "ord-slot"; strip.appendChild(sl); slots.push(sl); }
      const tray = document.createElement("div"); tray.className = "ord-tray";
      const disp = d.items.slice(); for(let i=disp.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [disp[i],disp[j]]=[disp[j],disp[i]]; }
      const sortedW = d.items.map(o=>o.wmag).slice().sort((a,b)=>a-b);
      const tiles = disp.map(o=>{ const el = document.createElement("div"); el.className = "ord-item"; el._o = o; el._w = o.wmag; el._onpan = false;
        el.innerHTML = renderOrdObj({ mag: o.dmag, img: o.img, emoji: o.emoji }, "size"); tray.appendChild(el); return el; });
      stage.appendChild(arrow); stage.appendChild(scale); stage.appendChild(strip); stage.appendChild(tray);
      host.appendChild(stage);

      let placed = 0, wrongStreak = 0, revealed = false, busy = false; state.locked = false; state.attempts = 0;
      const pans = { l: null, r: null };
      const wantW = ()=> sortedW[placed];
      const nextTile = ()=> tiles.find(x=> !x.classList.contains("used") && x._w === wantW());
      const remaining = ()=> tiles.filter(x=> !x.classList.contains("used"));
      const markActive = ()=>{ slots.forEach((s,i)=> s.classList.toggle("active", i === placed));
        if(placed < n && !pans.l && !pans.r){ const t = nextTile(); if(t && !t._onpan) startNudge(slide, t); } else stopNudge(); };
      const resetPans = ()=>{ ["l","r"].forEach(k=>{ const t = pans[k]; if(t){ t._onpan = false; t.style.visibility = ""; }
        loadEl[k].innerHTML = ""; loadEl[k].classList.remove("lighter"); pans[k] = null; }); beamwrap.style.transform = "rotate(0deg)"; };
      const loadPan = (k, t)=>{ pans[k] = t; t._onpan = true; t.style.visibility = "hidden"; loadEl[k].innerHTML = imgOrEmojiSized(t._o.img, t._o.emoji, 56); };
      const compare = ()=>{ beamwrap.style.transform = `rotate(${(pans.r._w - pans.l._w) * 7}deg)`;   // heavier side drops
        btThunk(Math.max(pans.l._w, pans.r._w)); const lightK = pans.l._w < pans.r._w ? "l" : "r";
        loadEl[lightK].classList.add("lighter"); loadEl[lightK === "l" ? "r" : "l"].classList.remove("lighter"); };
      const placeToSlot = (t, cb)=>{ const slot = slots[placed]; slot.classList.remove("active"); slot.classList.add("filled");
        slot.innerHTML = renderOrdObj({ mag: t._o.dmag, img: t._o.img, emoji: t._o.emoji }, "size"); t.classList.add("used"); t._onpan = false; placed++;
        if(placed >= n){ state.locked = true; stopNudge();
          SwiftPAL.emit("order_by_weight_correct", { slide_id: slide.id, phase: slide.phase, value: !revealed,
            attempts: state.attempts + 1, latency_ms: Date.now()-state.slideStart });
          celebrateThenAdvance(slide, revealed);
        } else markActive();
        if(cb) cb();
      };
      // when only one object remains it is forced — weigh it alone briefly, then place it.
      const autoLast = ()=>{ if(state.locked) return; const rem = remaining(); if(rem.length !== 1){ markActive(); return; }
        busy = true; const t = rem[0]; loadPan("l", t); beamwrap.style.transform = "rotate(-9deg)"; btThunk(t._w);
        setTimeout(()=>{ loadEl.l.innerHTML = ""; beamwrap.style.transform = "rotate(0deg)"; placeToSlot(t, ()=>{ busy = false; }); }, 850); };
      // tray tap → load the next empty pan (compare once both are full)
      tiles.forEach(t=>{ t.onclick = ()=>{ if(state.locked || busy || t.classList.contains("used") || t._onpan) return; stopNudge();
        if(!pans.l){ loadPan("l", t); }
        else if(!pans.r){ loadPan("r", t); compare(); }
      }; });
      // pan tap → try to place that pan's object (must be the LIGHTER of the two AND the lightest unplaced)
      ["l","r"].forEach(k=>{ panEl[k].onclick = ()=>{ if(state.locked || busy || !pans.l || !pans.r) return;
        const t = pans[k], other = pans[k === "l" ? "r" : "l"];
        if(t._w > other._w){ const lk = pans.l._w < pans.r._w ? "l" : "r";   // tapped the heavier one → re-pulse the lighter (hint), no penalty
          loadEl[lk].classList.remove("lighter"); void loadEl[lk].offsetWidth; loadEl[lk].classList.add("lighter"); return; }
        if(t._w === wantW()){ busy = true; wrongStreak = 0;   // correct: lighter AND globally lightest
          other._onpan = false; other.style.visibility = "";
          loadEl.l.innerHTML = ""; loadEl.r.innerHTML = ""; loadEl.l.classList.remove("lighter"); loadEl.r.classList.remove("lighter");
          pans.l = null; pans.r = null; beamwrap.style.transform = "rotate(0deg)";
          placeToSlot(t, ()=> setTimeout(()=>{ busy = false; autoLast(); }, 250));
        } else {   // lighter of the pair, but an even lighter one is still unplaced
          state.attempts++; SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts }); $("hintBtn").classList.add("show","hint-glow");
          if(++wrongStreak >= (CARD.scaffold_rules.max_attempts || 3)){ revealed = true; wrongStreak = 0; resetPans();
            const c = nextTile(); if(c){ c.classList.add("reveal-glow"); play(audioFor(slide, "reveal") || null, ()=>{});
              setTimeout(()=>{ c.classList.remove("reveal-glow"); busy = true; placeToSlot(c, ()=> setTimeout(()=>{ busy = false; autoLast(); }, 250)); }, 900); } }
          else { dragWrong(slide); resetPans(); }
        }
      }; });
      markActive();
      setNavActive(false); $("navBtn").onclick = ()=>{};
      $("hintBtn").onclick = ()=>{ if(!state.locked && !busy){ const t = nextTile(); if(t && !t._onpan){ t.classList.add("reveal-glow"); setTimeout(()=> t.classList.remove("reveal-glow"), 800); } } };
    }
  },

  BUILD_TO_NUMBER: {
    // Signature produce module. data: {target, mode:'guided'|'independent', topper, friend, goal_hi,
    // skyline_done, skyline_total}. Guided = dashed blueprint, auto-completes on fill. Independent =
    // free stack + "बन गया!" serve with world-enacted feedback (short/teeter, never a ✗). Ascending-
    // pitch thunk + spoken एक/दो/… per block. Geometry via offsets (throttle-safe).
    mount(host, slide){
      const d = slide.data, N = d.target, mode = d.mode || "independent";
      const stage = document.createElement("div"); stage.className = "bt-stage";
      const board = document.createElement("div"); board.className = "bt-board";
      board.innerHTML = `<span class="bt-numeral">${N}</span>` +
        (d.topper ? `<img class="bt-goalpic" src="assets/Images/${d.topper}.png" alt="">` : "") +
        (d.goal_hi ? `<span class="bt-goallbl">${d.goal_hi}</span>` : "");
      const track = document.createElement("div"); track.className = "bt-track"; const cells = [];
      for(let i=1;i<=N;i++){ const c = document.createElement("div"); c.className = "bt-nt"; track.appendChild(c); cells.push(c); }
      const yard = document.createElement("div"); yard.className = "bt-yard";
      const crane = document.createElement("div"); crane.className = "bt-crane"; crane.innerHTML = `<img src="assets/Images/obj_crane.png" alt="">`;
      const pile = document.createElement("div"); pile.className = "bt-pile";
      pile.innerHTML = `<div class="bt-pile-blocks"></div><span class="bt-pile-lbl">＋ ब्लॉक</span>`;
      const pb = pile.querySelector(".bt-pile-blocks");
      for(let i=0;i<3;i++){ const b = btBlock(i+1); b.style.left = (i*12) + "px"; b.style.bottom = (i*18) + "px"; pb.appendChild(b); }
      const plotwrap = document.createElement("div"); plotwrap.className = "bt-plotwrap";
      const plot = document.createElement("div"); plot.className = "bt-plot ground " + mode;
      plot.style.setProperty("--bh", Math.max(20, Math.min(46, Math.floor(230/N) - 2)) + "px");   // tall towers auto-shrink to fit
      plotwrap.appendChild(plot);
      const friend = document.createElement("div"); friend.className = "bt-friend";
      if(d.friend) friend.innerHTML = `<img src="assets/Images/${d.friend}.png" alt="">`;
      yard.appendChild(crane); yard.appendChild(pile); yard.appendChild(plotwrap); if(d.friend) yard.appendChild(friend);
      stage.appendChild(board); stage.appendChild(track); stage.appendChild(yard);
      if(d.skyline_total) stage.appendChild(btSkyline(d.skyline_done || 0, d.skyline_total));
      let serveBtn = null;
      if(mode === "independent"){ serveBtn = document.createElement("button"); serveBtn.type = "button"; serveBtn.className = "bt-serve"; serveBtn.textContent = "बन गया!"; stage.appendChild(serveBtn); }
      host.appendChild(stage);

      let count = 0; state.locked = false; state.attempts = 0;
      const lit = ()=> cells.forEach((c,i)=>{ const on = i < count; c.classList.toggle("lit", on); c.textContent = on ? (i+1) : ""; });
      const addSound = ()=>{ btThunk(count); btDust(plot); play("assets/Audio/vo_num_" + count + "." + AUDIO_EXT); };

      function success(){
        state.locked = true; if(serveBtn) serveBtn.disabled = true;
        if(d.topper){ const t = document.createElement("div"); t.className = "bt-topper snap"; t.innerHTML = `<img src="assets/Images/${d.topper}.png" alt="">`; plot.appendChild(t);
          if(d.topper === "top_rocket") setTimeout(()=> t.classList.add("rocket-go"), 750); }
        if(d.friend) friend.classList.add("hop");
        sfxCorrect(); burstStars();
        const lots = [...stage.querySelectorAll(".bt-bldg")]; const nextLot = lots[d.skyline_done || 0];
        if(nextLot) setTimeout(()=> nextLot.classList.add("done"), 380);
        SwiftPAL.emit("build_to_number_correct", { slide_id: slide.id, phase: slide.phase, value: true, target: N, attempts: state.attempts + 1, latency_ms: Date.now()-state.slideStart });
        play("assets/Audio/vo_total_" + N + "." + AUDIO_EXT); setNavActive(true);
      }

      if(mode === "guided"){
        const ghosts = [];
        for(let i=0;i<N;i++){ const g = document.createElement("div"); g.className = "bp-slot"; plot.appendChild(g); ghosts.push(g); }
        ghosts[0].classList.add("next");
        pile.onclick = ()=>{ if(state.locked) return;
          const g = ghosts.find(x=> x.classList.contains("bp-slot"));
          if(!g){ showBox("", "बस इतने ही चाहिए!", "hint", null, ()=>{}); return; }
          g.className = "blk drop"; g.style.background = BT_COLORS[count % 5];
          count++; lit(); addSound();
          const nx = ghosts.find(x=> x.classList.contains("bp-slot")); if(nx) nx.classList.add("next");
          if(count === N) setTimeout(success, 280);
        };
      } else {
        pile.onclick = ()=>{ if(state.locked) return;
          const b = btBlock(count); b.classList.add("drop");
          b.onclick = (e)=>{ e.stopPropagation(); if(state.locked) return; b.remove(); count--; lit(); };
          plot.appendChild(b); count++; lit(); addSound(); };
        serveBtn.onclick = ()=>{ if(state.locked) return;
          if(count === N){ success(); return; }
          state.attempts++;
          SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts, made: count, target: N });
          if(count < N){ if(d.friend) friend.classList.add("peer");
            showBox("", "थोड़े और चाहिए!", "hint", wrongClip(slide),   /* [28i] was SILENT */ ()=>{ if(d.friend) friend.classList.remove("peer"); }); }
          else { const bs = [...plot.querySelectorAll(".blk")]; const top = bs[bs.length-1];
            if(top){ top.classList.add("wobble"); setTimeout(()=> top.classList.remove("wobble"), 520); }
            showBox("", "अरे! एक ब्लॉक हटाओ।", "hint", wrongClip(slide), ()=>{}); } };   /* [28i] was SILENT */
      }
      setNavActive(false);
      $("navBtn").onclick = ()=>{ if(state.locked) completeSlide(true); };
      pointNudgeAt(pile);
    }
  },

  MAKE_NUMBER: {
    // produce-the-numeral dial (grafted from Firefly Valley). A set of N built blocks; ＋/− dials a
    // 1–10 numeral; wrong is inert (build dim), exact match ignites the build + snaps its topper.
    mount(host, slide){
      const d = slide.data, N = d.count;
      const stage = document.createElement("div"); stage.className = "bt-stage";
      if(d.prompt2_hi){ const lbl = document.createElement("div"); lbl.className = "pat-unit-lbl"; lbl.textContent = d.prompt2_hi; stage.appendChild(lbl); }
      const yard = document.createElement("div"); yard.className = "bt-yard";
      const plotwrap = document.createElement("div"); plotwrap.className = "bt-plotwrap";
      const plot = document.createElement("div"); plot.className = "bt-plot ground"; plot.style.filter = "grayscale(.35) brightness(.95)";
      plot.style.setProperty("--bh", Math.max(20, Math.min(46, Math.floor(230/N) - 2)) + "px");
      for(let i=0;i<N;i++){ plot.appendChild(btBlock(i)); }
      plotwrap.appendChild(plot); yard.appendChild(plotwrap);
      const dial = document.createElement("div"); dial.className = "bt-dial";
      dial.innerHTML = `<button class="bt-dial-btn" data-d="-1" type="button">−</button><div class="bt-dial-val">1</div><button class="bt-dial-btn" data-d="1" type="button">＋</button>`;
      stage.appendChild(yard); stage.appendChild(dial); host.appendChild(stage);
      let val = 1; state.locked = false; const valEl = dial.querySelector(".bt-dial-val");
      const check = ()=>{ if(val === N && !state.locked){ state.locked = true; valEl.classList.add("match"); plot.style.filter = "";
        if(d.topper){ const t = document.createElement("div"); t.className = "bt-topper snap"; t.innerHTML = `<img src="assets/Images/${d.topper}.png" alt="">`; plot.appendChild(t); }
        sfxCorrect(); burstStars(); play("assets/Audio/vo_total_" + N + "." + AUDIO_EXT);
        SwiftPAL.emit("make_number_correct", { slide_id: slide.id, phase: slide.phase, value: true, count: N, latency_ms: Date.now()-state.slideStart });
        setNavActive(true); } };
      dial.querySelectorAll(".bt-dial-btn").forEach(btn=> btn.onclick = ()=>{ if(state.locked) return;
        val = Math.max(1, Math.min(10, val + parseInt(btn.dataset.d, 10))); valEl.textContent = val; sfxTap(); check(); });
      setNavActive(false); $("navBtn").onclick = ()=>{ if(state.locked) completeSlide(true); };
    }
  },

  TAP_LETTER_BY_NAME: {
    mount(host, slide){
      mountTapOptions({
        slide, host, signalName: "letter_name_first_try",
        stimulus: null,
        options: slide.data.options,
        isCorrect: (opt) => opt.letter === slide.data.target,
        optionRenderer: (opt) => letterCell(opt.letter)
      });
    }
  },

  TAP_LETTER_BY_SOUND: {
    mount(host, slide){
      mountTapOptions({
        slide, host, signalName: "letter_sound_first_try",
          /* [28m] NO VOLUME BUTTON, ANYWHERE. Yasir 2026-07-28: "we use vol button nowhere. if
             nothing then we keep question only." This stimulus had NO image, so 28c left its 🔊 +
             "सुनो" chip alone and flagged it — stripping it looked like it would leave a blank card.
             The ruling settles it: nothing to show => show the QUESTION only, no chip. The chip was
             also the only way to re-hear the sound, so that function moves to the header replay
             (state.replayAudio, set after mount) instead of dying with the affordance. */
          stimulus: null,
        options: slide.data.options,
        isCorrect: (opt) => opt.letter === slide.data.target,
        optionRenderer: (opt) => letterCell(opt.letter)
      });
        /* [28m] the removed chip was the only way to re-hear the sound — keep the FUNCTION on the
           header replay. Set AFTER mount so mountTapOptions cannot overwrite it. */
        state.replayAudio = ()=>{ state.audioReplays++; play(audioFor(slide,"phoneme") || null, ()=>{}); };
    }
  },

  TAP_PICTURE_BY_LETTER: {
    mount(host, slide){
      mountTapOptions({
        slide, host, signalName: "letter_image_match_first_try",
        stimulus: stimulusLetter(slide.data.target_letter),
        options: slide.data.options,
        isCorrect: (opt) => opt.correct === true,
        optionRenderer: (opt) => pictureCell(opt.picture, opt.emoji, opt.img)
      });
    }
  },

  TAP_LETTER_BY_PICTURE: {
    mount(host, slide){
      mountTapOptions({
        slide, host, signalName: "image_letter_match_first_try",
        stimulus: stimulusPic(slide.data.picture, slide.data.emoji, slide.data.img),
        options: slide.data.options,
        isCorrect: (opt) => opt.letter === slide.data.target,
        optionRenderer: (opt) => letterCell(opt.letter)
      });
    }
  },

  ODD_ONE_OUT: {
    mount(host, slide){
      const sig = (slide.signals && slide.signals.on_complete && slide.signals.on_complete[0]) || "letter_recognise_first_try";
      const useShape = slide.data.options.some(o => o.shape);
      const usePic = slide.data.options.some(o => o.picture || o.word_hi || o.img);
      mountTapOptions({
        slide, host, signalName: sig,
        stimulus: null,
        options: slide.data.options,
        columnsHint: 4,
        isCorrect: (opt) => opt.is_odd === true,
        optionRenderer: (opt) => useShape
          ? shapeCell(opt)
          : usePic
            ? pictureCell(opt.word_hi || opt.picture, opt.emoji, opt.img)
            : letterCell(opt.letter),
        mastery: slide.phase === "mastery"
      });
    }
  },

  TAP_GENDER: {
    mount(host, slide){
      mountTapOptions({
        slide, host, signalName: "gender_match_first_try",
        stimulus: stimulusPic(slide.data.noun.word_hi, slide.data.noun.emoji, slide.data.noun.img),
        options: slide.data.options,
        columnsHint: 2,
        isCorrect: (opt) => opt.gender === slide.data.target_gender,
        optionRenderer: (opt) => genderLabelCell(opt.label, opt.gender),
        mastery: slide.phase === "mastery"
      });
    }
  },

  TAP_PICTURE_BY_GENDER: {
    mount(host, slide){
      mountTapOptions({
        slide, host, signalName: "gender_match_first_try",
        stimulus: stimulusGender(slide.data.label, slide.data.target_gender),
        options: slide.data.options,
        // tap-to-answer needs ONE unambiguous key — author marks the single intended picture
        // with correct:true (matches every other TAP_* module). The old `|| gender===target`
        // fallback silently accepted any same-gender distractor, defeating buzz+✗+lock.
        isCorrect: (opt) => opt.correct === true,
        optionRenderer: (opt) => pictureCell(opt.word_hi, opt.emoji, opt.img),
        mastery: slide.phase === "mastery"
      });
    }
  },

  GENDER_INTRO: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "gender-cats";
      const cats = slide.data.categories;
      const tapped = new Set();
      let _autoDone = false;   // [24a A3] auto walk-through: taps ignored until every category is taught
      const cardEls = [];
      cats.forEach(cat => {
        const card = document.createElement("div");
        card.className = "gender-cat " + (cat.gender === "F" ? "fem" : "masc");
        card.innerHTML =
          `<div class="cat-title">${cat.label}</div>` +
          imgOrEmoji(cat.anchor.img, cat.anchor.emoji, "cat-pic", "cat-emoji") +
          `<div class="cat-word">${cat.anchor.word_hi}</div>`;
        card.onclick = ()=>{
          // [24a A3] during the auto walk-through the cards are NOT tappable — a tap would gen-kill
          // the demo's own chain (echo guard) and stall it. After teaching completes, tap = replay.
          if(slide.data.auto && !_autoDone) return;
          card.classList.add("played");
          playChain(["assets/Audio/" + cat.label_audio + "." + AUDIO_EXT, "assets/Audio/" + cat.name_audio + "." + AUDIO_EXT], 0);
          tapped.add(cat.gender);
          SwiftPAL.emit("gender_intro_tap", { slide_id: slide.id, gender: cat.gender });
          if(tapped.size >= cats.length){ stopNudge(); setNavActive(true); }
        };
        wrap.appendChild(card); cardEls.push(card);
      });
      host.appendChild(wrap);
      // 16m: AUTONOMOUS demo (data.auto) — point at each category, auto-play its label + anchor word,
      // then unlock आगे. Replaces passive touch-to-hear (3-phase contract).
      if(slide.data.auto){
        state.ownsAudio = true; state.demoRunning = true; setNavActive(false); setSwMood("teach");
        let ci = 0, _done = false;
        const finish = ()=>{ if(_done) return; _done = true; stopNudge();
          _autoDone = true; state.demoRunning = false;   // [24a A3/N8] teaching over → taps replay, chip re-enabled
          state.replayAudio = ()=> playChain(cats.reduce((a,c)=> a.concat(["assets/Audio/" + c.label_audio + "." + AUDIO_EXT, "assets/Audio/" + c.name_audio + "." + AUDIO_EXT]), []), 0, ()=>{});
          $("navBtn").onclick = ()=> completeSlide(true); setNavActive(true); };
        const step = ()=>{
          if(CARD.slides[state.idx] !== slide) return;
          if(ci >= cats.length){ finish(); return; }
          const cat = cats[ci], el = cardEls[ci]; el.classList.add("played"); pointNudgeAt(el); ci++;
          playChain(["assets/Audio/" + cat.label_audio + "." + AUDIO_EXT, "assets/Audio/" + cat.name_audio + "." + AUDIO_EXT], 0, ()=> setTimeout(step, 500));
        };
        $("navBtn").onclick = ()=> completeSlide(true);
        setTimeout(step, 400);
        setTimeout(()=>{ if(CARD.slides[state.idx] === slide) finish(); }, cats.length * 4500 + 3000);   // FAIL-SAFE: never dead-button
        return;
      }
      state.gateNavUntilAudio = true;   // nav unlocks after the concept VO
      setNavActive(false);
      $("navBtn").onclick = ()=> completeSlide(true);
    }
  },

  MEET_GENDER: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "meet-gender";
      const n = slide.data.noun;
      wrap.innerHTML =
        `<div class="meet-pic-box">${imgOrEmoji(n.img, n.emoji, "pic-img", "pic-emoji")}<span class="pic-label">${n.word_hi}</span></div>` +
        `<div class="meet-arrow">→</div>` +
        `<div class="gender-badge${slide.data.gender === "F" ? " fem" : ""}">${slide.data.label}</div>`;
      host.appendChild(wrap);
      // 16m: AUTONOMOUS demo (data.auto) — point at the word + speak the model line, then point at the
      // ए/ऐ matra badge + speak it, then unlock आगे. Kills passive show-and-tell (3-phase contract).
      if(slide.data.auto){
        state.ownsAudio = true; state.demoRunning = true; setNavActive(false); setSwMood("teach");   // [24a N8]
        const steps = [];
        const picEl = wrap.querySelector(".meet-pic-box"), badgeEl = wrap.querySelector(".gender-badge");
        if(picEl) steps.push([picEl, audioFor(slide, "prompt")]);
        if(badgeEl) steps.push([badgeEl, slide.data.label_audio ? "assets/Audio/" + slide.data.label_audio + "." + AUDIO_EXT : null]);
        let si = 0, _done = false;
        const finish = ()=>{ if(_done) return; _done = true; stopNudge(); state.demoRunning = false; $("navBtn").onclick = ()=> completeSlide(true); setNavActive(true); };
        const step = ()=>{
          if(CARD.slides[state.idx] !== slide) return;
          if(si >= steps.length){ finish(); return; }
          const p = steps[si]; si++; pointNudgeAt(p[0]); play(p[1] || null, ()=> setTimeout(step, 450));
        };
        $("navBtn").onclick = ()=> completeSlide(true);
        state.replayAudio = ()=> play(audioFor(slide, "prompt") || null, ()=>{});
        setTimeout(step, 400);
        setTimeout(()=>{ if(CARD.slides[state.idx] === slide) finish(); }, steps.length * 4000 + 3000);   // FAIL-SAFE: never dead-button
        return;
      }
      state.gateNavUntilAudio = true;   // nav unlocks after the model VO
      setNavActive(false);
      $("navBtn").onclick = ()=> completeSlide(true);
    }
  },

  SORT_GENDER: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "sort-stage";
      const binsRow = document.createElement("div"); binsRow.className = "sort-bins";
      slide.data.bins.forEach(b => {
        const bin = document.createElement("div");
        bin.className = "sort-bin dd-zone" + (b.gender === "F" ? " fem" : "");   // dd-zone → drop detection
        bin.dataset.gender = b.gender;
        bin.innerHTML = `<div class="bin-title">${b.label}</div><div class="bin-items"></div>`;
        binsRow.appendChild(bin);
      });
      const tray = document.createElement("div"); tray.className = "sort-tray";
      const items = slide.data.items.slice().sort(()=> Math.random() - 0.5);
      items.forEach(it => {
        const t = document.createElement("div"); t.className = "sort-item";
        t.dataset.gender = it.gender; if(it.audio) t.dataset.audio = it.audio;   // [20a SORT-01]
        t.innerHTML = imgOrEmoji(it.img, it.emoji, "img", "emoji") + `<span class="lbl">${it.word_hi}</span>`;
        tray.appendChild(t);
      });
      wrap.appendChild(binsRow); wrap.appendChild(tray);
      host.appendChild(wrap);

      state.attempts = 0; state.locked = false;
      let placed = 0; const need = slide.data.items.length;
      /* [28p] SORT_GENDER WAS THE SIXTH TERMINAL-HELP PATH WITH NO TERMINAL HELP AT ALL.
         Measured: its wrong branch buzzed and spoke try_again and did nothing else — no attempt
         ceiling, no glow, no dimming, no hand — so a child could be wrong indefinitely with no
         escalation, and a GUIDED sort could never earn the hand that Yasir's 2026-07-28 ruling
         grants after 2 failed attempts. Counted PER TILE, like MATCH_DRAG_N (25d): a slide-wide
         streak that any correct drop resets lets one hard item ride on the others' successes. */
      const _sgWrong = new Map();
      if(slide.data.reveal_seq) sortSeqReveal(tray, slide);   // [20a SORT-01] opt-in
      [...tray.children].forEach(tile => {
        makeDraggable(tile, (zone, t) => {
          const bin = zone.closest(".sort-bin"); if(!bin) return;
          state.attempts++;
          if(bin.dataset.gender === t.dataset.gender){
            leaveTrayGhost(t);   // [24a A5] capture the tray-slot size before .snapped shrinks/moves it
            t.classList.add("snapped");
            bin.querySelector(".bin-items").appendChild(t);
            placed++; _sgWrong.delete(t);          /* [28p] this tile is done */
            if(t.dataset.audio && placed < need) play("assets/Audio/" + t.dataset.audio + "." + AUDIO_EXT, ()=>{});   // [20a SORT-01] speak-on-match
            SwiftPAL.emit("gender_sort_item", { slide_id: slide.id, gender: t.dataset.gender, attempts: state.attempts });
            if(placed === need){
              state.locked = true;
              SwiftPAL.emit("gender_sort_correct", {
                slide_id: slide.id, phase: slide.phase, value: true,
                attempts: state.attempts, latency_ms: Date.now() - state.slideStart
              });
              setTimeout(()=> celebrateThenAdvance(slide, false), 250);   // standard: confetti + VO + auto-advance, no popup
            }
          } else {
            bin.classList.add("hover"); bin.style.borderColor = "var(--wrong)";
            setTimeout(()=>{ bin.classList.remove("hover"); bin.style.borderColor = ""; }, 500);
            dragWrong(slide);   // buzz + Swiftie + spoken try_again (pre-readers need the spoken recovery)
            SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
            /* [28p] terminal rung, via the SAME contract every other mechanic uses (28l/28o): glow the
               correct bin, dim the other bins, travel the hand from the tile to that bin, and WAIT — the
               child still makes the drop. maySolveFor() is not consulted because nothing is auto-solved
               here; terminalHold/travelNudge carry the phase rule themselves. */
            const _n = (_sgWrong.get(t) || 0) + 1; _sgWrong.set(t, _n);
            if(_n >= ((CARD.scaffold_rules && CARD.scaffold_rules.max_attempts) || 3)){
              const _goal = [...binsRow.children].find(b => b.dataset.gender === t.dataset.gender);
              if(_goal){
                _goal.classList.add("reveal-hold");
                [...binsRow.children].forEach(b => { if(b !== _goal) b.classList.add("tile-disabled"); });
                terminalHold(t, tray.children, slide, _goal);
                state.helpShown = true; state.scaffoldLevel = 3;
                SwiftPAL.emit("answer_revealed", { slide_id: slide.id, phase: slide.phase,
                                                   attempts: state.attempts, reason: "wrong" });
              }
            }
          }
        });
      });
    }
  },

  MATCH_GENDER_PAIRS: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "dd-stage";
      const zoneRow = document.createElement("div"); zoneRow.className = "dd-row";
      const zones = slide.data.pairs.slice().sort(()=> Math.random() - 0.5);
      zones.forEach(p => {
        const z = document.createElement("div"); z.className = "dd-zone"; z.dataset.accept = p.id;
        z.innerHTML = imgOrEmoji(p.f.img, p.f.emoji, "zone-img", "zone-emoji") + `<span class="zone-lbl">${p.f.word_hi}</span>`;
        zoneRow.appendChild(z);
      });
      const tileRow = document.createElement("div"); tileRow.className = "dd-row"; tileRow.style.marginTop = "34px";
      const tiles = slide.data.pairs.slice().sort(()=> Math.random() - 0.5);
      tiles.forEach(p => {
        const t = document.createElement("div"); t.className = "dd-tile pic-tile"; t.dataset.pairId = p.id;
        t.innerHTML = imgOrEmoji(p.m.img, p.m.emoji, "zone-img", "zone-emoji") + `<span class="zone-lbl">${p.m.word_hi}</span>`;
        tileRow.appendChild(t);
      });
      wrap.appendChild(zoneRow); wrap.appendChild(tileRow);
      host.appendChild(wrap);

      state.attempts = 0; state.locked = false;
      let filled = 0, wrongStreak = 0, revealed = false; const need = slide.data.pairs.length;
      const settle = (zone, t)=>{                       // the one correct-placement path (drop AND reveal)
        zone.classList.add("filled","correct");
        // grey the matched masculine tile in place (pictures don't badge well)
        t.classList.add("matched"); t.style.transform = "";
        filled++;
        if(filled === need){ state.locked = true; setTimeout(()=> celebrateThenAdvance(slide, revealed), 250); }
      };
      // A8 reveal ceiling: after max consecutive misses, DEMONSTRATE one pair (pulse + auto-settle) so
      // the child is guided forward instead of dead-ending; run counts success=false via `revealed`.
      const revealOne = ()=>{
        const zone = [...zoneRow.children].find(z=> !z.classList.contains("filled")); if(!zone) return;
        const t = [...tileRow.children].find(x=> !x.classList.contains("matched") && x.dataset.pairId === zone.dataset.accept); if(!t) return;
        revealed = true; wrongStreak = 0;
        zone.classList.add("reveal-glow"); t.classList.add("reveal-glow");
        play(audioFor(slide,"reveal") || null, ()=>{});
        zone.classList.add("reveal-hold");                 /* [25d] glow and WAIT — never settle() it for the child */
        terminalHold(t, tileRow.children, slide, zone);   /* [28l] dim distractors + [28o] hand travels to the zone */
      };
      [...tileRow.children].forEach(tile => {
        makeDraggable(tile, (zone, t) => {
          if(state.locked || zone.classList.contains("filled")) return;
          state.attempts++;
          if(zone.dataset.accept === t.dataset.pairId){
            wrongStreak = 0;
            SwiftPAL.emit("gender_pair_match", {
              slide_id: slide.id, phase: slide.phase, value: true,
              pair: t.dataset.pairId, attempts: state.attempts
            });
            settle(zone, t);
          } else {
            zone.classList.add("filled","wrong");
            setTimeout(()=> zone.classList.remove("filled","wrong"), 600);
            dragWrong(slide);
            SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
            if(++wrongStreak >= (CARD.scaffold_rules.max_attempts||3)) revealOne();
          }
        });
      });
    }
  },

  MATCH_DRAG_1: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "dd-stage";
      // zone (target picture)
      const zoneRow = document.createElement("div"); zoneRow.className = "dd-row";
      const zone = document.createElement("div"); zone.className = "dd-zone";
      zone.innerHTML = imgOrEmoji(slide.data.target.img, slide.data.target.emoji, "zone-img", "zone-emoji") + `<span class="zone-lbl">${slide.data.target.picture||""}</span>`;
      zone.dataset.accept = slide.data.letter.letter;
      zoneRow.appendChild(zone);
      // tile
      const tileRow = document.createElement("div"); tileRow.className = "dd-row"; tileRow.style.marginTop = "30px";
      const tile = document.createElement("div"); tile.className = "dd-tile"; tile.innerHTML = `<span class="ink-glyph">${slide.data.letter.letter}</span>`;
      tileRow.appendChild(tile);
      wrap.appendChild(zoneRow); wrap.appendChild(tileRow);
      host.appendChild(wrap);

      state.attempts = 0; state.locked = false;
      makeDraggable(tile, (zone, t) => {
        state.attempts++;
        const ok = (zone.dataset.accept === t.textContent.trim());
        if(ok){
          zone.classList.add("filled","correct");
          // snap tile into zone (badge is small — drop the ink-centering transform)
          t.classList.add("snapped");
          t.querySelector(".ink-glyph")?.style.removeProperty("transform");
          zone.appendChild(t);
          state.locked = true;
          SwiftPAL.emit("letter_image_match_first_try", {
            slide_id: slide.id, phase: slide.phase, value: true,
            first_try: state.attempts === 1, attempts: state.attempts,
            latency_ms: Date.now()-state.slideStart
          });
          celebrateThenAdvance(slide, false);
        } else {
          zone.classList.add("filled","wrong");
          setTimeout(()=> zone.classList.remove("filled","wrong"), 600);
          dragWrong(slide);
          SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
          if(state.attempts >= (CARD.scaffold_rules.max_attempts||3)){
            state.locked = true;
            // reveal = DEMONSTRATE, don't just tell: snap the letter into its picture (dimmed pulse)
            // with the spoken reveal line, then move on as success=false.
            showBox("", audioText(slide,"reveal") || "कोई बात नहीं! इसे यहाँ रखो।", "reveal", audioFor(slide,"reveal"), ()=>{});
            setTimeout(()=>{
              zone.classList.add("filled","correct","reveal-glow");
              t.classList.add("snapped");
              t.querySelector(".ink-glyph")?.style.removeProperty("transform");
              zone.appendChild(t);
              setTimeout(()=> completeSlide(false), 1300);
            }, 900);
          }
        }
      });
    }
  },

  MATCH_DRAG_N: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "dd-stage";
      const zoneRow = document.createElement("div"); zoneRow.className = "dd-row";
      // shuffle zones so order ≠ tile order
      const zones = slide.data.pairs.slice().sort(()=> Math.random()-0.5);
      zones.forEach(p => {
        const z = document.createElement("div"); z.className = "dd-zone";
        z.innerHTML = imgOrEmoji(p.img, p.emoji, "zone-img", "zone-emoji") + `<span class="zone-lbl">${p.picture||""}</span>`;
        z.dataset.accept = p.letter;
        /* [27j] SPEAK-ON-TAP for the picture/word DROP-ZONE. Only the letter TILE had a listener, so
           a child could hear the letter but never the word — they had to guess which letter to drag.
           The SME deck asks for it on all 4 match slides: "शब्द पर छूने पर शब्द का नाम बोलना चाहिए".
           Reuses the pair's existing match_audio (the word clip already played on a correct drop), so
           no new VO is needed; p.zone_audio overrides if a card wants a different line. Gated on
           isPlaying so a tap cannot stomp the prompt, and dead once the zone is filled. Additive —
           a pair with neither id behaves exactly as before. */
        const zoneSrc = p.zone_audio || p.match_audio || p.word_audio;
        if(zoneSrc) z.addEventListener("pointerdown", ()=>{
          if(z.classList.contains("filled") || isPlaying) return;
          play("assets/Audio/" + zoneSrc + "." + AUDIO_EXT, ()=>{});
        });
        zoneRow.appendChild(z);
      });
      const tileRow = document.createElement("div"); tileRow.className = "dd-row"; tileRow.style.marginTop = "30px";
      const tiles = slide.data.pairs.slice().sort(()=> Math.random()-0.5);
      tiles.forEach(p => {
        const t = document.createElement("div"); t.className = "dd-tile"; t.innerHTML = `<span class="ink-glyph">${p.letter}</span>`;
        // [21c flag#4] TAP → LETTER sound, correct DROP → WORD (SME split). tap_audio = vo_ltr_<letter>,
        // match_audio = vo_word_<word>. Additive + gated: fall back to legacy letter_audio so sibling
        // MATCH games (no tap_audio/match_audio fields) stay byte-for-byte identical. Fire-and-forget on tap.
        const tapSrc = p.tap_audio || p.letter_audio;
        if(tapSrc) t.addEventListener("pointerdown", ()=>{ if(t.classList.contains("snapped")) return; play("assets/Audio/" + tapSrc + "." + AUDIO_EXT, ()=>{}); });   // [24a bug-hunt F5] a placed tile must not replay-and-cut the current VO (the A1 gate exempts snapped tiles)
        if(p.match_audio) t.dataset.matchAudio = p.match_audio;
        tileRow.appendChild(t);
      });
      wrap.appendChild(zoneRow); wrap.appendChild(tileRow);
      host.appendChild(wrap);

      state.attempts = 0; state.locked = false;
      let filled = 0, wrongStreak = 0, revealed = false; const need = slide.data.pairs.length;
      const settle = (zone, t)=>{                       // one correct-placement path (drop AND reveal)
        /* [31h] THE GUIDE HAND HAS TO DIE WHEN THE CHILD SUCCEEDS. travelNudge loops with
           iterations:Infinity and captures the tile's position ONCE; only stopNudge() cancels it
           (it holds the handle in state._handTravel). The correct-drop path ran leaveTrayGhost ->
           clearHelp -> settle and NONE of them stopped it — clearHelp only strips CSS classes. So
           after terminal help fired, the child placing that tile correctly left the hand looping
           over the ghost slot the tile came from, pointing at nothing, for the rest of the slide —
           and still pointing at a FINISHED pair while they worked on the remaining ones. Yasir
           caught it on HIKGH04_L01_S02 P1 G4. settle() is the single correct-placement path (drop
           AND reveal), so the kill belongs here rather than in one of the two callers. */
        stopNudge();
        zone.classList.add("filled","correct");
        /* [31h] AND THE CHIP MUST NOT SIT ON THE WORD. `md-word` is the caption-chip layout
           (bottom:6px; left:50%) and this line added it UNCONDITIONALLY, though its own comment
           said it was "for WORD tiles (not the letter badge)" — there is no word/letter branch in
           this mechanic at all, every tile is built from p.letter. Bottom-centre is exactly where
           .zone-lbl sits, so the placed letter covered the picture's word 100% (measured: 40x21px
           chip over a 40x21px label) and the child lost the word the moment they got it right. The
           designed alternative, .dd-tile.snapped's top-right corner badge, had therefore never
           shipped — dead CSS.
           The test is NOT "letter vs word" — Devanagari makes length useless (अं is one letter in
           two code points). It is "is there a label to cover": every word-tile card in the fleet
           (HI01H04_L03_S01, HIKGH04_L02_S02) renders no .zone-lbl, so those keep the caption chip
           and lose nothing, while every labelled card gets the corner badge. */
        /* [31j] THE CAPTION CHIP IS FOR TILES THAT CANNOT FIT THE BADGE — nothing else.
           Four attempts converged here, each killed by a measurement:
             * 31h  "no .zone-lbl element"  -> the zone builder ALWAYS emits the span
                    (`<span class="zone-lbl">${p.picture||""}</span>`), empty when unlabelled, so
                    every word-tile zone read as labelled and 15 words would have been clipped into
                    a 62px badge (HIKGH04_L02_S02 घर नल कप बस जग · HI01H04_L03_S01 घास माला दादा
                    पापा नाक कान).
             * 31i  "no label TEXT" (lifted from HI01H02_L01_S01's private fix) -> better, but it
                    only protects the LABEL and forgets the PICTURE: on HIKGH02_L02_S01, whose zones
                    carry no label, that hands single letters the caption chip, which its own
                    engine_local had measured at 47.1% of the tile over the art vs 9.4% for the
                    corner badge.
             * HIKGH02_L02_S01/S02's private `[...text].length > 1` -> counts CODE POINTS, so अं and
                    अः (HIKGH04_L01_S01 P2, on LABELLED zones) read as words and would caption the
                    chip straight onto the label.
           The constraint is two-sided: never bury the word, never smother the picture. A single
           base character always fits the corner badge, so it always gets it; only a genuine
           multi-character word needs the caption, and then only where there is no label to bury.
           Counted over the fleet's 90 MATCH_DRAG_N tiles: 68 letters on labelled zones, 7 letters
           on unlabelled zones, 15 words on unlabelled zones, and ZERO words on a labelled zone —
           so the two clauses never fight. The label clause is kept as a guard for a future card.
           Base characters, not code points: strip the Devanagari combining block (matras, anusvara,
           visarga, virama) before counting, or every matra word miscounts. */
        const _zl = zone.querySelector(".zone-lbl");
        const _labelled = !!(_zl && _zl.textContent.trim());
        const _units = (t.textContent || "").trim().normalize("NFC")
                         .replace(/[ऀ-ःऺ-ॏ॑-ॗॢॣ]/g, "").length;
        t.classList.add("snapped");
        if(_units > 1 && !_labelled) t.classList.add("md-word");
        const ig = t.querySelector(".ink-glyph");
        if(ig){ ig.style.removeProperty("transform"); ig.style.removeProperty("font-size"); delete ig.dataset.inkBase; }
        zone.appendChild(t);
        if(ig) requestAnimationFrame(()=> centerInkGlyph(ig));   // re-fit the word into the small chip
        filled++;
        if(filled === need){ state.locked = true;
          // [24a C-fix] the LAST correct DROP also speaks its WORD (flag#4) — wait for it to end
          // before the celebrate VO (play() would cut it at ~250ms). 4s cap: a stalled clip can
          // never hold the celebration hostage. [bug-hunt F6] Skip the wait on the REVEAL path:
          // revealOne already spoke "reveal" and played no word to protect, so waiting would just let
          // that clip finish and then celebrateThenAdvance(revealed) would speak "reveal" a 2nd time.
          if(revealed){ setTimeout(()=> celebrateThenAdvance(slide, true), 250); }
          else {
            const t0 = Date.now();
            setTimeout(function waitWord(){
              if(CARD.slides[state.idx] !== slide) return;                // navigated away → abort
              if(!isPlaying || Date.now() - t0 > 4000){ celebrateThenAdvance(slide, false); return; }
              setTimeout(waitWord, 150);
            }, 250);
          }
        }
      };
      /* [25d] TERMINAL HELP replaces the old auto-solve (Yasir 2026-07-27, live-caught).
         The old `revealOne()` was three bugs in one: (a) it AUTO-PLACED the answer, which the blessed
         reference forbids — the child must always place it themselves; (b) it picked the FIRST unfilled
         zone, so after failing on म it silently solved क/कमल, a pair the child was not even attempting;
         (c) it spoke `reveal` = "सभी जोड़ियाँ सही हैं।" ("all the pairs are correct") when nothing was
         complete and the child had just been wrong twice. Lowering max_attempts to 2 made it fire sooner
         and this became very visible.
         New behaviour: the count is PER TILE (not a slide-wide streak that any correct drop reset), and
         on the last attempt we glow that tile + its correct zone, dim the other tiles, and wait — the
         child completes it. A drop on any other zone while locked springs back with no extra penalty. */
      const clearHelp = ()=>{
        [...zoneRow.children].forEach(z=> z.classList.remove("reveal-hold"));
        [...tileRow.children].forEach(x=>{
          x.classList.remove("reveal-hold","tile-disabled");
          x.style.removeProperty("pointer-events"); x.style.removeProperty("opacity");
        });
      };
      const terminalHelp = (t)=>{
        t._guideLock = true; revealed = true;   // revealed -> quieter settle + honest telemetry
        const gz = [...zoneRow.children].find(z=> z.dataset.accept === t.textContent.trim());
        if(gz) gz.classList.add("reveal-hold");
        t.classList.add("reveal-hold");
        /* [28d] THE HAND BELONGS ON EVERY TERMINAL-HELP PATH, NOT JUST THE TAP ONE.
           27d put pointNudgeAt in mountTapOptions.revealAnswer and I reported it as "the hand on the
           answer in every phase" — but there are FIVE terminal-help paths and only that one had it.
           Practice and independent rounds in these games are drags / sentence-finds / scene-taps, so
           they glowed with no hand, which is what Yasir is seeing. Point at the TILE the child must
           move (the actionable thing), and stop the flow nudge first so it cannot drag the hand away. */
        travelNudge(t, gz, slide);          /* [28o] tile -> its correct zone, looping */
        [...tileRow.children].forEach(x=>{
          if(x !== t && !x.classList.contains("snapped")){
            x.classList.add("tile-disabled");
            x.style.setProperty("pointer-events","none","important");
            x.style.setProperty("opacity",".4","important");
          }
        });
      };
      [...tileRow.children].forEach(tile => {
        tile._wrong = 0; tile._guideLock = false;
        makeDraggable(tile, (zone, t) => {
          if(state.locked || zone.classList.contains("filled")) return;
          const want = (zone.dataset.accept === t.textContent.trim());
          // guide-locked tile dropped on the WRONG box: penalty-free spring-back, keep guiding
          if(t._guideLock && !want){
            const gz = [...zoneRow.children].find(z=> z.dataset.accept === t.textContent.trim());
            if(gz) gz.classList.add("reveal-hold");
            t.classList.add("reveal-hold");
            return;
          }
          state.attempts++;
          if(want){
            wrongStreak = 0; t._wrong = 0; t._guideLock = false;
            SwiftPAL.emit("letter_image_match_first_try", {
              slide_id: slide.id, phase: slide.phase, value: true,
              letter: t.textContent, attempts: state.attempts
            });
            if(t.dataset.matchAudio) play("assets/Audio/" + t.dataset.matchAudio + "." + AUDIO_EXT, ()=>{});   // [21c flag#4] correct drop → speak the WORD
            leaveTrayGhost(t);   // [25c] ghost slot: placeholder stays where the tile came from
            clearHelp();
            settle(zone, t);
          } else {
            zone.classList.add("filled","wrong");
            dragWrong(slide, t);   // [25b] per-pair hint2 names the tile + its picture
            SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
            setTimeout(()=> zone.classList.remove("filled","wrong"), 600);
            t._wrong++;
            if(t._wrong >= (CARD.scaffold_rules.max_attempts || 3) && !t._guideLock) terminalHelp(t);
          }
        });
      });
    }
  },

  SEQUENCE_DRAG: {
    mount(host, slide){
      const wrap = document.createElement("div"); wrap.className = "dd-stage" + (slide.data.word_mode ? " seq-words" : "");
      // slots row
      const slots = document.createElement("div"); slots.className = "seq-slots";
      slide.data.correct_order.forEach((L,i) => {
        const sl = document.createElement("div"); sl.className = "seq-slot";
        sl.dataset.accept = L; sl.dataset.idx = String(i);
        sl.classList.add("dd-zone");      // reuse drop logic
        sl.innerHTML = `<span class="ordinal">${i+1}</span>`;
        slots.appendChild(sl);
      });
      const tileRow = document.createElement("div"); tileRow.className = "dd-row"; tileRow.style.marginTop = "40px";
      slide.data.tiles.forEach(t => {
        const tl = document.createElement("div"); tl.className = "dd-tile"; tl.innerHTML = `<span class="ink-glyph">${t.letter}</span>`;
        if(t.audio) tl.dataset.audio = t.audio;   // tap-to-hear (SME: "शब्द पर click करने पर आवाज़ आनी चाहिए")
        tileRow.appendChild(tl);
      });
      wrap.appendChild(slots); wrap.appendChild(tileRow);
      host.appendChild(wrap);

      const wordMode = !!slide.data.word_mode;   // [21c flag#5] read-along/glow-order/whole-sentence gated to word mode; letter-sequence siblings untouched
      let placed = 0, wrongStreak = 0, revealed = false; const need = slide.data.correct_order.length;
      state.attempts = 0; state.locked = false;
      const settle = (zone, t)=>{ stopNudge();          // one correct-placement path (drop AND reveal)
        zone.classList.remove("dd-zone");
        zone.classList.add("filled","correct");
        zone.innerHTML = `<span class="ordinal">${parseInt(zone.dataset.idx,10)+1}</span><span class="ink-glyph">${t.textContent.trim()}</span>`;
        centerInkGlyph(zone.querySelector(".ink-glyph"));
        t.remove();
        placed++;
        if(placed === need){
          state.locked = true;
          SwiftPAL.emit("letter_sequence_correct", {
            slide_id: slide.id, phase: slide.phase, value: !revealed,
            attempts: state.attempts, latency_ms: Date.now()-state.slideStart
          });
          if(wordMode){
            // deck (word mode): read the WHOLE sentence aloud at the end, THEN celebrate + advance
            play(audioFor(slide, "reveal") || null, ()=> setTimeout(()=> celebrateThenAdvance(slide, revealed), 300));
          } else {
            setTimeout(()=> celebrateThenAdvance(slide, revealed), 250);
          }
        } else if(wordMode){ glowNext(); }
      };
      // progressive sequence hint, WORD MODE only (SME "पहले आने वाला शब्द पहले glow करेगा फिर दूसरा, तीसरा..."):
      // glow the tile that belongs in the NEXT empty slot, guiding the child one word at a time, in order.
      const glowNext = ()=>{
        [...tileRow.children].forEach(x => x.classList.remove("reveal-glow"));
        const zone = [...slots.children].find(z => !z.classList.contains("filled")); if(!zone) return;
        const t = [...tileRow.children].find(x => x.textContent.trim() === zone.dataset.accept);
        if(t) t.classList.add("reveal-glow");
      };
      // A8 reveal ceiling: after max consecutive misses, demonstrate the NEXT slot in the order.
      const revealOne = ()=>{
        const zone = [...slots.children].find(z=> !z.classList.contains("filled")); if(!zone) return;
        const t = [...tileRow.children].find(x=> x.textContent.trim() === zone.dataset.accept); if(!t) return;
        revealed = true; wrongStreak = 0;
        zone.classList.add("reveal-glow"); t.classList.add("reveal-glow");
        play(audioFor(slide,"reveal") || null, ()=>{});
        zone.classList.add("reveal-hold");                 /* [25d] glow and WAIT — never settle() it for the child */
        terminalHold(t, tileRow.children, slide, zone);   /* [28l] dim distractors + [28o] hand travels to the zone */
      };
      [...tileRow.children].forEach(tile => {
        makeDraggable(tile, (zone, t) => {
          if(state.locked || zone.classList.contains("filled")) return;
          state.attempts++;
          const ok = (zone.dataset.accept === t.textContent.trim());
          if(ok){
            wrongStreak = 0;
            settle(zone, t);
          } else {
            zone.classList.add("wrong");
            setTimeout(()=> zone.classList.remove("wrong"), 600);
            dragWrong(slide);
            SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
            if(++wrongStreak >= (CARD.scaffold_rules.max_attempts||3)) revealOne();
          }
        }, wordMode ? { onTap: ()=>{ if(tile.dataset.audio) play("assets/Audio/" + tile.dataset.audio + "." + AUDIO_EXT, ()=>{}); } } : undefined);   // [21c flag#5] tap a word-tile → speak that word
      });
      if(wordMode) glowNext();   // [21c flag#5] glow the first word immediately; the auto-played prompt speaks over it
    }
  },

  MASTERY_SILENT_PICK: {
    mount(host, slide){
      const mode = slide.data.mode;
      let stimulus = null, options = null, isCorrect = null, optionRenderer = null;
      if(mode === "sound_to_letter"){
          /* [28m] NO VOLUME BUTTON, ANYWHERE. Yasir 2026-07-28: "we use vol button nowhere. if
             nothing then we keep question only." This stimulus had NO image, so 28c left its 🔊 +
             "सुनो" chip alone and flagged it — stripping it looked like it would leave a blank card.
             The ruling settles it: nothing to show => show the QUESTION only, no chip. The chip was
             also the only way to re-hear the sound, so that function moves to the header replay
             (state.replayAudio, set after mount) instead of dying with the affordance. */
          stimulus = null;
        options = slide.data.options;
        isCorrect = (opt) => opt.letter === slide.data.target;
        optionRenderer = (opt) => letterCell(opt.letter);
      } else if(mode === "picture_to_letter"){
        stimulus = stimulusPic(slide.data.picture, slide.data.emoji, slide.data.img);
        options = slide.data.options;
        isCorrect = (opt) => opt.letter === slide.data.target;
        optionRenderer = (opt) => letterCell(opt.letter);
      } else if(mode === "name_to_shape"){
          /* [28m] NO VOLUME BUTTON, ANYWHERE. Yasir 2026-07-28: "we use vol button nowhere. if
             nothing then we keep question only." This stimulus had NO image, so 28c left its 🔊 +
             "सुनो" chip alone and flagged it — stripping it looked like it would leave a blank card.
             The ruling settles it: nothing to show => show the QUESTION only, no chip. The chip was
             also the only way to re-hear the sound, so that function moves to the header replay
             (state.replayAudio, set after mount) instead of dying with the affordance. */
          stimulus = null;
        options = slide.data.options;
        isCorrect = (opt) => opt.shape === slide.data.target;
        optionRenderer = (opt) => shapeCell(opt);
      } else if(mode === "object_to_shape"){
        stimulus = stimulusPic(slide.data.object_hi, slide.data.object_emoji, slide.data.object_img);
        options = slide.data.options;
        isCorrect = (opt) => opt.shape === slide.data.target;
        optionRenderer = (opt) => shapeCell(opt);
      } else if(mode === "shape_to_object"){
        stimulus = stimulusShape({shape: slide.data.shape, color: slide.data.color, rotate: slide.data.rotate});
        options = slide.data.options;
        isCorrect = (opt) => opt.correct === true;
        optionRenderer = (opt) => pictureCell(opt.object_hi, opt.object_emoji, opt.object_img);
      } else { // letter_to_picture
        stimulus = stimulusLetter(slide.data.letter);
        options = slide.data.options;
        isCorrect = (opt) => opt.correct === true;
        optionRenderer = (opt) => pictureCell(opt.picture, opt.emoji, opt.img);
      }
      // SAME scaffold as the rest of the lesson — hint button after 1st wrong,
      // correct/incorrect feedback popups, reveal-on-3rd-wrong. Not silent.
      // `mastery:true` keeps the mastery_score tracking (first-try = hit).
      mountTapOptions({
        slide, host, signalName: "mastery_item",
        stimulus, options, isCorrect, optionRenderer, mastery: true
      });
        /* [28m] the removed chip was the only way to re-hear the sound — keep the FUNCTION on the
           header replay. Set AFTER mount so mountTapOptions cannot overwrite it. */
        state.replayAudio = ()=>{ state.audioReplays++; play(audioFor(slide,"phoneme") || audioFor(slide,"shape_name") || null, ()=>{}); };
    }
  },

  STORY_SCENE: {
    // TEACH: one picture-story beat. Scene image fills the frame; narration VO plays on mount;
    // slow Ken-Burns pan keeps it alive for a pre-reader. Chain several in order for the story.
    mount(host, slide){
      const d = slide.data || {};
      const wrap = document.createElement("div"); wrap.className = "story-scene";
      const fb = String(d.emoji || "📖").replace(/'/g,"");
      wrap.innerHTML =
        '<div class="story-frame">' +
          '<img class="story-img" src="assets/Images/' + d.image_id + '.' + IMG_EXT + '" alt="' + (d.alt_hi||'') + '" ' +
            'onerror="var s=document.createElement(\'span\');s.className=\'story-fallback\';s.textContent=\'' + fb + '\';this.replaceWith(s);"/>' +
        '</div>' +
        (d.caption_hi ? '<div class="story-caption">' + d.caption_hi + '</div>' : '');
      host.appendChild(wrap);
      state.ownsAudio = true; setNavActive(false);
      $("navBtn").onclick = ()=> completeSlide(true);
      state.replayAudio = ()=>{ play(audioFor(slide, "narration") || null, ()=>{}); };
      setSwMood("talk");
      let _armed = false;
      const _armNav = ()=>{ if(_armed) return; _armed = true; setNavActive(true); setSwMood("point"); };
      play(audioFor(slide, "narration") || null, _armNav);
      setTimeout(_armNav, 30000);   // watchdog: nav always eventually opens if VO buffers slowly
    }
  },

  STORY_QUESTION: {
    // TEST: a comprehension question after story beats. A recall thumb (visual anchor) + 🔊 chip
    // form the stimulus; options are 2–3 picture chips. Tap-to-answer feedback is inherited from
    // mountTapOptions. Recall thumb is a CUE, hidden at mastery / when data.hide_recall so the
    // answer isn't leaked by thumb-reading.
    mount(host, slide){
      const d = slide.data || {};
      const stim = document.createElement("div"); stim.className = "story-q-stim"; stim.style.cursor = "pointer";
      const hideRecall = slide.phase === "mastery" || d.hide_recall === true;
      const thumb = (!hideRecall && d.recall_image_id)
        ? '<img class="story-q-thumb" src="assets/Images/' + d.recall_image_id + '.' + IMG_EXT + '" alt="" ' +
          'onerror="this.style.display=\'none\';"/>'
        : '';
      /* [28c] IMAGE ONLY IN THE STIMULUS CARD (Yasir 2026-07-28: "we are not supposed to have both
         the prashn suno and volume icon on the screen anywhere at all. only image in the
         container/card"). The 🔊 glyph and the label were HARDCODED here, so no card could remove
         them — `d.stim_hi` only reworded the label. Now the card holds the recall thumb and nothing
         else.
         The REPLAY still works: stim.onclick is kept, so tapping the picture replays the question,
         and the header volume chip on Swiftie replays it too — the affordance is removed, not the
         function. If the thumb is absent (mastery / d.hide_recall) there is nothing left to show, so
         pass null rather than render an empty card; mountTapOptions already guards `if(stimulus)`.
         NOT applied to the four audio-only chips (TAP_SHAPE_BY_NAME, TAP_LETTER_BY_SOUND,
         MASTERY_SILENT_PICK x2) — those have no image, so stripping the chip would leave a blank card
         and no cue that there is anything to listen to. Flagged for a ruling instead of guessed. */
      stim.innerHTML = thumb;
      stim.onclick = ()=>{ state.audioReplays++; play(audioFor(slide, "prompt") || null); };
      mountTapOptions({
        slide, host,
        signalName: d.signal_name || "story_question_first_try",
        stimulus: thumb ? stim : null,
        options: d.options,
        isCorrect: (opt) => opt.correct === true,
        optionRenderer: (opt) => {
          const cell = document.createElement("div");
          cell.innerHTML =
            imgOrEmoji(opt.img, opt.emoji, "story-q-opt-img", "story-q-opt-emoji") +
            (opt.label_hi ? '<span class="story-q-opt-label">' + opt.label_hi + '</span>' : '');
          return cell;
        },
        mastery: d.mastery === true,
        columnsHint: (d.options && d.options.length) <= 2 ? 2 : 3
      });
    }
  },

  TAP_IN_SCENE: {
    // "Tap the thing in the picture" — a PRODUCE-style comprehension mechanic (NOT an MCQ). A story
    // scene fills the frame; the child taps the target region(s) (e.g. the monkeys who took the caps).
    // A correct hotspot → confetti + advance; a miss → soft buzz + try_again VO; after a few idle
    // seconds the target gently pulses (hint). Data: {image_id, alt_hi, prompt, hotspots:[{x,y,w,h,
    // correct}] (as % of the frame), audio:{prompt,correct,try_again}}. Reusable for any "find X".
    mount(host, slide){
      const d = slide.data || {};
      const wrap = document.createElement("div"); wrap.className = "tis-scene";
      const frame = document.createElement("div"); frame.className = "tis-frame";
      const img = document.createElement("img"); img.className = "tis-img";
      img.src = "assets/Images/" + d.image_id + "." + IMG_EXT; img.alt = d.alt_hi || "";
      frame.appendChild(img);
      let done = false, _tisAttempts = 0;
      /* [27j] TWO-RUNG HINT LADDER + TERMINAL HELP for TAP_IN_SCENE.
         It previously played try_again ONLY, so authored audio.hint1/audio.hint were never spoken —
         and because check_system passes on "ids authored + files exist", a 15/15 TAP_IN_SCENE game
         reported COMPLIANT while no hint could ever play. Same graded shape as mountTapOptions
         (24a A2) and dragWrong (25a): 1st wrong -> hint1, 2nd -> hint, at max_attempts -> terminal
         help. Terminal help GLOWS the correct hotspot and the child STILL TAPS IT — never auto-solve
         (rule 9: "never hand the child the answer"). */
      const miss = ()=>{
        if(done) return;
        _tisAttempts++; sfxWrongSoft(); setSwMood("tryagain");
        const _maxA = (CARD.scaffold_rules && CARD.scaffold_rules.max_attempts) || 3;
        if(_tisAttempts >= _maxA){
          frame.querySelectorAll(".tis-hot.correct-hot").forEach(el => el.classList.add("reveal-hold"));
          frame.querySelectorAll(".tis-hot:not(.correct-hot)").forEach(el => el.classList.add("faded"));
          const _hot = frame.querySelector(".tis-hot.correct-hot");
          if(_hot) handOnAnswer(_hot, slide);   /* [28d] hand on the answer, all paths */
          SwiftPAL.emit("answer_revealed", { slide_id: slide.id, phase: slide.phase, attempts: _tisAttempts, reason: "wrong" });
          play(audioFor(slide,"hint") || audioFor(slide,"reveal") || audioFor(slide,"try_again") || null, ()=>{});
        } else if(_tisAttempts >= 2){
          play(midHint(slide), ()=>{});                        /* [28k] rung 2 */
        } else {
          play(audioFor(slide,"hint1") || audioFor(slide,"try_again") || null, ()=>{});
        }
        SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: _tisAttempts });
      };
      (d.hotspots || []).forEach(h => {
        const hs = document.createElement("button"); hs.className = "tis-hot" + (h.correct ? " correct-hot" : "");
        hs.style.left=h.x+"%"; hs.style.top=h.y+"%"; hs.style.width=h.w+"%"; hs.style.height=h.h+"%";
        hs.onclick = (e)=>{ e.stopPropagation(); if(done) return;
          if(h.correct){ done=true; hs.classList.add("hit"); sfxCorrect(); confettiCannon(); setSwMood("happy");
            SwiftPAL.emit(d.signal_name || "scene_tap_first_try", {slide_id:slide.id, phase:slide.phase, correct:true});
            play(audioFor(slide,"correct")||null, ()=> setTimeout(()=>completeSlide(true), 900)); }
          else { hs.classList.add("shake"); miss(); } };
        frame.appendChild(hs);
      });
      frame.onclick = miss;   // tapping empty scene = gentle try_again
      wrap.appendChild(frame); host.appendChild(wrap);
      $("navBtn").style.display = "none";   // advance on the correct tap — no आगे on a pick
      state.replayAudio = ()=> play(audioFor(slide,"prompt")||null, ()=>{});
      setSwMood("point");
      play(audioFor(slide,"prompt")||null, ()=>{});
      /* [28e] REMOVED: a 6s timer that pulsed the CORRECT hotspot alone, before the child had tried
         anything. Measured on the built game — at t=1s all three hotspots are identical; at t=7s only
         .correct-hot carries `tisPulse`. That hands over the answer for free (rule-9 class breach).
         Yasir 2026-07-28: "this is just like giving hints for the correct answer right from start ...
         only glow after second wrong attempt when all other options get disabled." The glow now comes
         ONLY from terminal help in miss() at max_attempts, where the distractors also fade. */
    }
  },

  PHASE_TRANSITION: {
    // Additive "learning journey" beat between arc phases (the MoM "no sense of progression" fix).
    // Full-screen friendly panel: badge + "अब हम ___ करेंगे" headline + a 5-dot journey map with the
    // current step lit. The header Swiftie presents it (ONE-Swiftie rule — no second mascot). Learner-
    // paced: no auto-advance timer; आगे unlocks when the beat's VO ends (immediately if silent).
    // data:{ headline_hi, icon?, step (1-based), total_steps?, to_phase? }. Build scripts weave one of
    // these before each phase change; older cards without it are untouched (purely additive).
    mount(host, slide){
      const d = slide.data || {};
      const panel = document.createElement("div"); panel.className = "phase-transition";
      const total = d.total_steps || 5, step = Math.min(d.step || 1, total);
      let map = '<div class="pt-map">';
      for(let i = 1; i <= total; i++){
        map += `<span class="pt-step ${i < step ? 'done' : i === step ? 'current' : ''}"></span>`;
        if(i < total) map += '<span class="pt-connector"></span>';
      }
      map += '</div>';
      panel.innerHTML =
        `<div class="pt-badge">${d.icon || '🎯'}</div>` +
        `<div class="pt-headline">${d.headline_hi || slide.prompt_hi || ''}</div>` + map;
      host.appendChild(panel);
      setSwMood("teach");
      SwiftPAL.emit("phase_transition_shown", { slide_id: slide.id, to_phase: d.to_phase || slide.phase, step });
      state.ownsAudio = true; state.locked = false; setNavActive(false);
      $("navBtn").onclick = ()=> completeSlide(true);
      const vo = audioFor(slide, "prompt");
      if(vo) play(vo, ()=> setNavActive(true)); else setNavActive(true);
    }
  },

  CELEBRATION: {
    mount(host, slide){
      // celebration SFX — own Audio element so it overlaps the spoken VO chain
      playSfx(slide.audio && slide.audio.sfx ? slide.audio.sfx : "sfx_celebrate");
      // show end screen overlay + a big Hindi headline (== the VO) so the finale feels like a reward
      /* [30i] NO text on the last page (Yasir): only the button carries writing. Emptied,
         not removed — .end-title:empty / .end-subtitle:empty are already display:none. */
      const et = $("endTitle"); if(et) et.textContent = "";
      const st = $("endSubtitle"); if(st) st.textContent = "";
      const es = $("endScreen"); es.classList.add("show","hint-glow");
      document.body.classList.add("is-end");   // r4: immersive sunburst backdrop (end_screen.webp)
      const c = $("confetti"); c.innerHTML = "";
      starBurst();   // r4: gold star burst from centre (replaces flat falling confetti)
      const masteryScore = state.masteryAttempts ? (state.masteryHits/state.masteryAttempts) : 0;
      SwiftPAL.emit("mastery_score", { value: masteryScore, hits: state.masteryHits, attempts: state.masteryAttempts });
      SwiftPAL.emit("lesson_completed", { skill_code: CARD.skill_code, total_signals: SwiftPAL.signals.length });
      runValidator();
      setNavActive(false);
      // "आगे बढ़ें" appears only AFTER the celebration VO finishes (see autoPlayChain onDone)
      /* [30i] button present the moment the screen is (Yasir). Was hidden until
         autoPlayChain onDone released state.endBtnPending, which left the child on a dead
         end screen for the length of the clip — or forever if the clip was missing. */
      const eb = $("endBtn"); eb.classList.add("show","hint-glow");
      state.endBtnPending = false;
      // dev-only: a small "download results" button (teacher/QA), never in child flow
      if(new URLSearchParams(location.search).has("dev") && !$("dlResults")){
        const dl = document.createElement("button"); dl.id = "dlResults"; dl.textContent = "⬇ results JSON";
        dl.style.cssText = "position:absolute;bottom:20px;left:20px;z-index:5;font-family:var(--font-hi);font-weight:700;font-size:16px;padding:8px 16px;border-radius:12px;border:2px solid #B7DCFB;background:#fff;color:var(--navy);cursor:pointer;";
        dl.onclick = ()=> SwiftPAL.downloadResults();
        es.appendChild(dl);
      }
      eb.onclick = ()=>{
        SwiftPAL.emit("proceed_next", { skill_code: CARD.skill_code, part: CARD.part_label });
        try{ window.parent?.postMessage({type:"swiftpal:proceed", skill_code:CARD.skill_code, part:CARD.part_label}, "*"); }catch(e){}
      };
    }
  },

  /* ===== 16j: FLN sentence + repeated-sound modules — PORTED from the delivered 15b/15d engines.
     Fingerprinted first (two-diverged-engines lesson): same `-unified` lineage, IDENTICAL helper
     contracts (audioFor, setNavActive, completeSlide, mountTapOptions, state fields, sfxCorrect, sfxWrongSoft,
     confettiCannon/setSwMood/imgOrEmoji/letterCell/pictureCell). Verified each call resolves in 16i
     before porting — not a blind paste. Used by HI01H06 (READ/FIND/PICK_PIC) + HIKGH02_L01_S03_P2
     (SOUND/TAP_ALL). ===== */
  SENTENCE_READ: {
    mount(host, slide){
      const d = slide.data;
      const wrap = document.createElement("div"); wrap.className = "sentence-read";
      if(d.image || d.image_emoji){ const im = document.createElement("div"); im.className = "sentence-img";   // 16k: optional illustration above the line
        im.innerHTML = imgOrEmoji(d.image, d.image_emoji, "s-img", "s-emoji"); wrap.appendChild(im); }
      const strip = document.createElement("div"); strip.className = "sentence-strip";
      (d.words || []).forEach(w => {
        const chip = document.createElement("div"); chip.className = "sentence-word";
        chip.innerHTML = `<span class="sw-text ink-glyph">${w.text}</span>`;
        chip.onclick = ()=>{ chip.classList.add("said"); state.audioReplays++;
          if(w.audio) play("assets/Audio/" + w.audio + "." + AUDIO_EXT); };
        strip.appendChild(chip);
      });
      const readBtn = document.createElement("button"); readBtn.className = "read-whole-btn";
      readBtn.innerHTML = `पूरा पढ़ो`;                          /* [28m] no volume glyph */
      const wholeSrc = d.whole_audio ? ("assets/Audio/" + d.whole_audio + "." + AUDIO_EXT) : null;
      readBtn.onclick = ()=>{ state.audioReplays++; readBtn.classList.add("playing");
        strip.querySelectorAll(".sentence-word").forEach(c => c.classList.add("said"));
        play(wholeSrc, ()=>{ readBtn.classList.remove("playing"); readBtn.classList.add("done"); setNavActive(true); }); };
      wrap.appendChild(strip); wrap.appendChild(readBtn);
      host.appendChild(wrap);
      if(d.auto){
        // 16k: AUTONOMOUS tutorial read (3-phase contract) — the sentence reads ITSELF word-by-word,
        // then the whole line, then आगे unlocks. Child watches/listens (no required tap).
        state.ownsAudio = true; state.demoRunning = true; setNavActive(false); readBtn.style.display = "none";   // [24a N8]
        const chips = [...strip.querySelectorAll(".sentence-word")];
        let wi = 0;
        const wStep = ()=>{
          if(CARD.slides[state.idx] !== slide) return;                     // navigated away → abort
          if(wi >= chips.length){ chips.forEach(c => c.classList.add("said")); stopNudge();
            play(wholeSrc, ()=>{ state.demoRunning = false; setNavActive(true); }); return; }
          // read-along: the hand-nudge points at each word AS it is spoken (SME: "hand nudge on words being spoken")
          const c = chips[wi]; c.classList.add("said"); pointNudgeAt(c); const w = (d.words || [])[wi]; wi++;
          play(w && w.audio ? "assets/Audio/" + w.audio + "." + AUDIO_EXT : null, ()=> setTimeout(wStep, 300));
        };
        state.replayAudio = ()=> play(wholeSrc, ()=>{});
        $("navBtn").onclick = ()=> completeSlide(true);                     // explicit — dead-button lesson
        setTimeout(wStep, 450);
        return;
      }
      state.replayAudio = ()=> play(wholeSrc, ()=>{});
      setNavActive(false);
      $("navBtn").onclick = ()=> completeSlide(true);
    }
  },

  SENTENCE_FIND: {
    mount(host, slide){
      const d = slide.data;
      const wrap = document.createElement("div"); wrap.className = "sentence-find";
      if(d.image || d.image_emoji){ const im = document.createElement("div"); im.className = "sentence-img";   // 16k: optional illustration above the line
        im.innerHTML = imgOrEmoji(d.image, d.image_emoji, "s-img", "s-emoji"); wrap.appendChild(im); }
      const strip = document.createElement("div"); strip.className = "sentence-strip";
      state.attempts = 0; state.locked = false; state.scaffoldLevel = 0;
      const maxA = (CARD.scaffold_rules && CARD.scaffold_rules.max_attempts) || 3;
      const chips = [];
      (d.words || []).forEach(w => {
        const chip = document.createElement("div"); chip.className = "sentence-word tappable";
        chip.innerHTML = `<span class="sw-text ink-glyph">${w.text}</span>`;
        chip.__target = (w.target === true);
        const wordSrc = w.audio ? ("assets/Audio/" + w.audio + "." + AUDIO_EXT) : null;
        chip.onclick = ()=>{
          if(state.locked || chip.classList.contains("crossed") || chip.classList.contains("correct")) return;
          const after = (cb)=>{ if(wordSrc) play(wordSrc, cb); else cb(); };
          if(w.target === true){
            state.locked = true; chip.classList.add("correct"); sfxCorrect(); confettiCannon(); setSwMood("happy");
            if(slide.phase === "mastery"){ state.masteryAttempts++; if(state.attempts === 0) state.masteryHits++; }
            SwiftPAL.emit("sentence_word_first_try", { slide_id: slide.id, phase: slide.phase, value: true,
              first_try: state.attempts === 0, attempts: state.attempts + 1, latency_ms: Date.now()-state.slideStart });
            after(()=> setTimeout(()=> completeSlide(true), 700));
          } else {
            /* [28r] same rule as the tap path: RED FIRST, and the lock only from the 2nd wrong.
               This mechanic locked the chip permanently on the FIRST wrong tap, so 27a ("a wrong card
               must not lock on the first miss") and Yasir's "red glow first, then disable" had never
               reached it at all. */
            state.attempts++; chip.classList.add("wrong-flash"); sfxWrongSoft(); setSwMood("tryagain");
            setTimeout(()=>{
              if(chip.classList.contains("correct")) return;   /* [28s] no helpShown guard — see the tap path */
              chip.classList.remove("wrong-flash");
              if(state.attempts >= 2) chip.classList.add("crossed");
            }, 700);
            $("hintBtn").classList.add("show","hint-glow");
            SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
            /* [27j] Three faults fixed here, all reported against HI01H04_L02_S02:
               1. rung 1 played try_again and NEVER looked up hint1, so the authored level-1 hint was
                  dead on every slide;
               2. the `attempts >= 2` rung was unreachable under the house max_attempts:2 because the
                  terminal branch fires first — so `hint` (the rung that NAMES the answer) never played
                  either. It is now spoken AS the terminal line, matching the pick path;
               3. RULE-9 BREACH: terminal help set state.locked, marked the target .correct and called
                  completeSlide(false) — it solved the slide FOR the child. Now it only GLOWS the target
                  and fades the rest; nothing locks and nothing advances until the child taps it,
                  exactly like mountTapOptions' revealAnswer. */
            after(()=>{
              if(state.attempts >= maxA){
                state.scaffoldLevel = 3; state.helpShown = true; setSwMood("hint");
                chips.forEach(c => {
                  if(c.__target){ c.classList.remove("crossed"); c.classList.add("reveal-hold"); }
                  else if(!c.classList.contains("correct")){
                    c.classList.add("faded");
                    c.style.setProperty("pointer-events","none","important");
                  }
                });
                const _tgt = chips.find(c => c.__target);
                if(_tgt) handOnAnswer(_tgt, slide);   /* [28d] hand on the answer, all paths */
                SwiftPAL.emit("answer_revealed", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts, reason: "wrong" });
                play(audioFor(slide, "hint") || audioFor(slide, "reveal") || audioFor(slide, "try_again") || null, ()=>{});
              } else if(state.attempts >= 2){ state.scaffoldLevel = Math.max(state.scaffoldLevel, 2);
                play(midHint(slide), ()=>{}); }               /* [28k] rung 2 */
              else { state.scaffoldLevel = Math.max(state.scaffoldLevel, 1);
                play(audioFor(slide, "hint1") || audioFor(slide, "try_again") || null, ()=>{}); }
            });
          }
        };
        strip.appendChild(chip); chips.push(chip);
      });
      wrap.appendChild(strip); host.appendChild(wrap);
      $("hintBtn").onclick = ()=>{ if(state.locked) return; state.hintUsed = true;
        SwiftPAL.emit("hint_shown", { slide_id: slide.id, manual: true });
        play(audioFor(slide, "hint") || audioFor(slide, "try_again") || null, ()=>{}); };
      $("navBtn").style.display = "none"; setNavActive(false);
      // [21c flag#5] read-along (SME deck P6/P7): speak the sentence word-by-word, glowing each word as it is heard,
      // THEN a hand-nudge points at the TARGET word to guide the tap ("hand nudge की help से बच्चा घर
      // शब्द पहचानेगा"). state.ownsAudio so the entry auto-play chain doesn't ALSO fire the prompt.
      /* [28i] SPEAK THE TARGET WORD, NOT THE WHOLE SENTENCE.
         Yasir 2026-07-28: the slide says "जो शब्द सुनो, उस पर टैप करो।" and the engine then read ALL
         FOUR words aloud — so nothing told the child which one to tap. The task is "tap the word you
         hear"; reading every option destroys it. Target-only is now the DEFAULT and the full
         word-by-word read is opt-in via data.read_along:true.
         NOTE FOR YASIR — this reverses an earlier SME ask: the read-along came from that deck's own
         P6/P7 note (21c flag #5, "hand nudge की help से बच्चा घर शब्द पहचानेगा"). Your ruling wins,
         but the SME will see their request gone, so it is flagged rather than silently dropped. Any
         card that still wants it sets data.read_along:true.
         The target is spoken with NO visual mark: adding .said to it (as the read-along does per word)
         would GLOW the answer before the child has tried, which is the thing we keep removing.
         ALSO REMOVED: the read-along ended in startNudge(slide, _tgt) — a hand planted on the answer
         right after the prompt VO, pre-attempt. 28f deleted the two startNudge(slide,_nudge) forms and
         missed this third one, which is exactly the "hand nudge appears right after VO" complaint. A
         visual hint here is earned only through handOnAnswer() at terminal help. */
      state.ownsAudio = true;
      const _tgt = chips.find(c => c.__target);
      const _clipFor = (i)=>{ const w = (d.words || [])[i];
        return w && w.audio ? "assets/Audio/" + w.audio + "." + AUDIO_EXT : null; };
      const _readAlong = ()=>{                                   // opt-in: data.read_along === true
        let i = 0;
        const step = ()=>{
          if(CARD.slides[state.idx] !== slide || state.locked) return;    // navigated away / already answered
          if(i >= chips.length) return;                                   // NO hand at the end (see above)
          const c = chips[i]; const src = _clipFor(i); i++;
          c.classList.add("said");
          play(src, ()=> setTimeout(step, 220));
        };
        step();
      };
      const _sayTarget = ()=>{
        if(CARD.slides[state.idx] !== slide || state.locked) return;
        play(_clipFor(chips.indexOf(_tgt)), ()=>{});                      // no .said, no nudge
      };
      const _speak = (d.read_along === true) ? _readAlong : _sayTarget;
      state.replayAudio = _speak;                                          // header 🔊 repeats the same thing
      play(audioFor(slide, "prompt") || null, ()=> setTimeout(_speak, 250));   // instruction, then the word to find
    }
  },

  TAP_ALL_WITH_SOUND: {
    mount(host, slide){
      const d = slide.data || {};
      const items = d.items || [];
      const need = items.filter(it => it.has === true).length;
      state.attempts = 0; state.locked = false;
      let found = 0;
      const wrap = document.createElement("div"); wrap.className = "tap-all";
      const head = document.createElement("div"); head.className = "tap-all-head";
      const badge = document.createElement("div"); badge.className = "tap-all-sound"; badge.style.cursor = "pointer";
      badge.innerHTML = `<span class="ink-glyph">${d.target_sound || ""}</span>`;
      badge.onclick = ()=>{ state.audioReplays++; play(audioFor(slide, "target") || null); };
      const counter = document.createElement("div"); counter.className = "tap-all-count";
      const setCount = ()=>{ counter.innerHTML = `<span class="c-found">${found}</span> / ${need}`; };
      head.appendChild(badge); head.appendChild(counter);
      const strip = document.createElement("div"); strip.className = "tap-all-strip";
      const chips = [];
      items.forEach(it => {
        const chip = document.createElement("div"); chip.className = "tap-all-item";
        chip.innerHTML = imgOrEmoji(it.img, it.emoji, "img", "emoji") + `<span class="lbl">${it.word_hi}</span>`;
        const src = it.audio ? ("assets/Audio/" + it.audio + "." + AUDIO_EXT) : null;
        chip.onclick = ()=>{
          if(state.locked || chip.classList.contains("got") || chip.classList.contains("nope")) return;
          const after = (cb)=>{ if(src) play(src, cb); else cb(); };
          if(it.has === true){
            chip.classList.add("got"); sfxCorrect(); found++; setCount();
            SwiftPAL.emit("sound_found", { slide_id: slide.id, phase: slide.phase, word: it.word_hi });
            after(()=>{
              if(found >= need){
                state.locked = true; setSwMood("celebrate"); confettiCannon();
                if(slide.phase === "mastery"){ state.masteryAttempts++; if(state.attempts === 0) state.masteryHits++; }
                SwiftPAL.emit(d.signal_name || "tap_all_correct", { slide_id: slide.id, phase: slide.phase,
                  value: state.attempts === 0, attempts: state.attempts, latency_ms: Date.now()-state.slideStart });
                play(audioFor(slide, "done") || audioFor(slide, "correct") || null,
                  ()=> setTimeout(()=> completeSlide(state.attempts === 0), 700));
              }
            });
          } else {
            /* [28r] same rule as the tap path: RED FIRST, and the lock only from the 2nd wrong.
               This mechanic locked the chip permanently on the FIRST wrong tap, so 27a ("a wrong card
               must not lock on the first miss") and Yasir's "red glow first, then disable" had never
               reached it at all. */
            state.attempts++; chip.classList.add("wrong-flash"); sfxWrongSoft(); setSwMood("tryagain");
            setTimeout(()=>{
              if(chip.classList.contains("correct")) return;   /* [28s] no helpShown guard — see the tap path */
              chip.classList.remove("wrong-flash");
              if(state.attempts >= 2) chip.classList.add("nope");
            }, 700);
            $("hintBtn").classList.add("show","hint-glow");
            SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: state.attempts });
            after(()=> play(wrongClip(slide), ()=>{}));   /* [28i] graded ladder */
          }
        };
        strip.appendChild(chip); chips.push(chip);
      });
      setCount();
      wrap.appendChild(head); wrap.appendChild(strip);
      host.appendChild(wrap);
      $("hintBtn").onclick = ()=>{ if(state.locked) return; state.hintUsed = true;
        SwiftPAL.emit("hint_shown", { slide_id: slide.id, manual: true });
        play(audioFor(slide, "hint") || audioFor(slide, "try_again") || null, ()=>{}); };
      $("navBtn").style.display = "none"; setNavActive(false);
      state.replayAudio = ()=> play(audioFor(slide, "prompt") || null, ()=>{});
    }
  },

  SENTENCE_SOUND: {
    mount(host, slide){
      const d = slide.data || {};
      const stim = document.createElement("div"); stim.className = "sentence-sound-stim";
      const strip = document.createElement("div"); strip.className = "sentence-strip";
      (d.words || []).forEach(w => {
        const chip = document.createElement("div"); chip.className = "sentence-word";
        chip.innerHTML = `<span class="sw-text ink-glyph">${(typeof w === "string") ? w : w.text}</span>`;
        strip.appendChild(chip);
      });
      const whole = d.whole_audio ? ("assets/Audio/" + d.whole_audio + "." + AUDIO_EXT) : null;
      const spk = document.createElement("button"); spk.className = "read-whole-btn"; spk.innerHTML = "फिर सुनो";   /* [28m] no volume glyph */
      spk.onclick = ()=>{ if(state.demoRunning || isPlaying) return;   // [24a N8] a mid-demo/mid-VO replay would gen-kill the reveal chain (आगे brick)
        state.audioReplays++; strip.querySelectorAll(".sentence-word").forEach(c => c.classList.add("said"));
        play(whole, ()=>{}); };
      stim.appendChild(strip); stim.appendChild(spk);
      if(d.auto){
        // 16k: AUTONOMOUS tutorial demo (test-in-tutorial fix) — play the line, then REVEAL the
        // repeating sound (highlight the correct sound chip); no child pick. Then explain + आगे.
        state.ownsAudio = true; state.demoRunning = true; setNavActive(false);   // [24a N8]
        const qrow = document.createElement("div"); qrow.className = "q-row"; qrow.appendChild(stim);
        const grid = document.createElement("div"); grid.className = "opt-grid cols-" + ((d.options || []).length || 3);
        const cells = (d.options || []).map(opt => { const c = letterCell(opt.letter); c.classList.add("opt-cell"); grid.appendChild(c); return { c, opt }; });
        qrow.appendChild(grid); host.appendChild(qrow);
        const chips = [...strip.querySelectorAll(".sentence-word")];
        const reveal = ()=>{
          if(CARD.slides[state.idx] !== slide) return;                      // navigated away → abort
          chips.forEach(c => c.classList.add("said"));
          const t = cells.find(x => x.opt.letter === d.target_sound);
          if(t){ t.c.classList.add("correct", "reveal-pulse"); cells.forEach(x => { if(x !== t) x.c.classList.add("faded"); }); }
          SwiftPAL.emit("sentence_sound_demo", { slide_id: slide.id, phase: slide.phase, sound: d.target_sound });
          setTimeout(()=> play(audioFor(slide, "explain") || audioFor(slide, "conclude") || null, ()=>{ state.demoRunning = false; setNavActive(true); }), 300);
        };
        state.replayAudio = ()=> play(whole, ()=>{});
        $("navBtn").onclick = ()=> completeSlide(true);                     // explicit — dead-button lesson
        play(whole, ()=> setTimeout(reveal, 400));
        return;
      }
      mountTapOptions({
        slide, host, signalName: d.signal_name || "sentence_sound_first_try",
        stimulus: stim, columnsHint: (d.options || []).length,
        options: d.options,
        isCorrect: (opt)=> opt.letter === d.target_sound,
        optionRenderer: (opt)=> letterCell(opt.letter),
        mastery: slide.phase === "mastery",
        nudgeTarget: null
      });
      state.replayAudio = ()=> play(whole, ()=>{});
    }
  },

  /* 16j NEW: sentence -> pick the matching picture (HI01H06 "वाक्य के लिए सही चित्र चुनो"). Sentence
     chips as the stimulus + 2 picture options via the tap-to-answer contract. */
  SENTENCE_PICK_PIC: {
    mount(host, slide){
      const d = slide.data || {};
      const stim = document.createElement("div"); stim.className = "sentence-sound-stim";
      const strip = document.createElement("div"); strip.className = "sentence-strip";
      (d.sentence_words || []).forEach(w => {
        const chip = document.createElement("div"); chip.className = "sentence-word";
        chip.innerHTML = `<span class="sw-text ink-glyph">${(typeof w === "string") ? w : w.text}</span>`;
        strip.appendChild(chip);
      });
      const whole = d.whole_audio ? ("assets/Audio/" + d.whole_audio + "." + AUDIO_EXT) : null;
      stim.appendChild(strip);
      if(whole){ const spk = document.createElement("button"); spk.className = "read-whole-btn"; spk.innerHTML = "फिर सुनो";   /* [28m] no volume glyph */
        spk.onclick = ()=>{ state.audioReplays++; strip.querySelectorAll(".sentence-word").forEach(c => c.classList.add("said")); play(whole, ()=>{}); };
        stim.appendChild(spk); }
      mountTapOptions({
        slide, host, signalName: d.signal_name || "sentence_pick_pic_first_try",
        stimulus: stim, columnsHint: (d.options || []).length,
        options: d.options,
        isCorrect: (opt)=> opt.correct === true,
        optionRenderer: (opt)=> pictureCell(opt.word_hi || "", opt.emoji, opt.img),
        mastery: slide.phase === "mastery",
        nudgeTarget: null
      });
      state.replayAudio = ()=> play(whole, ()=>{});
    }
  }
};

/* VACHAN (एकवचन/बहुवचन) + any 2-category attribute reuse the GENERIC gender modules — identical
   mechanic, just different labels. A vachan game authors these types with the category in the
   "gender" field (e.g. "S"/"P"), the two labels, and (for pairs) f=singular / m=plural; it then
   inherits immediate tap-to-answer feedback, speak-word-on-tap, layered hints, and the engine
   guard for free. Named *_VACHAN (not *_NUMBER) to avoid colliding with MEET_NUMBER = counting. */
SlideModules.VACHAN_INTRO          = SlideModules.GENDER_INTRO;
SlideModules.MEET_VACHAN           = SlideModules.MEET_GENDER;
SlideModules.TAP_VACHAN            = SlideModules.TAP_GENDER;
SlideModules.TAP_PICTURE_BY_VACHAN = SlideModules.TAP_PICTURE_BY_GENDER;
SlideModules.SORT_VACHAN           = SlideModules.SORT_GENDER;
SlideModules.MATCH_VACHAN_PAIRS    = SlideModules.MATCH_GENDER_PAIRS;

/* ======================================================================================
   [MTG2A04_L03_S01 · SME review_1] CAPACITY KIT — measuring मात्रा by pouring
   Game-specific additive block (the SME redesign needs real pour / fill / drag-to-pour
   mechanics that no stock module has). Nothing above is changed; these register new
   slide types only:  CAP_COMPARE_PICK · CAP_METHOD · CAP_POUR_IN_DEMO · CAP_POUR_OUT_DEMO ·
   CAP_JAR_DRAG · CAP_TAP_POUR · CAP_TAP_SOURCE · CAP_SHOP.
   Vessels are inline SVG with a clipped liquid layer, so levels rise / fall live.
   VO highlight sync uses CARD.assets.audio_cues[id] = [{t:ms, k:cueKey}] (word timings).
   ====================================================================================== */
const CAP_LIQ = {
  water:{ body:"#86CDF5", top:"#C2E9FF", stream:"#8FD2F8" },
  milk: { body:"#FFFEFA", top:"#FFFFFF", stream:"#FFFFFF", edge:"#D9D2BF" },
  oil:  { body:"#EDB216", top:"#FFD75A", stream:"#F6C530", edge:"#C28A12" }
};
const CAP_GLASS_FILL = "rgba(236,247,253,.94)", CAP_GLASS_LINE = "#5B8FC0";
const CAP_STEEL = (id)=> `<linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#8A95A1"/><stop offset=".32" stop-color="#F3F6F9"/><stop offset=".62" stop-color="#BBC4CD"/><stop offset="1" stop-color="#7A8591"/></linearGradient>`;
/* Keep vessel geometry and the animated liquid in the same coordinate system.
   The old decorative atlas obscured liquid and did not match the pouring pivots.
   Generated raster animation is now confined to the liquid impact effect. */
/* geometry is in each vessel's own viewBox units. inner = liquid clip; yTop/yBot = full / empty
   liquid surface; lipR/lipL = pour pivot (top-right / top-left lip); mouth = where a stream lands. */
const CAP_VESSELS = {
  glass: { vb:[100,130], inner:"M14 10 L86 10 L78 117 Q50 123 22 117 Z", yTop:22, yBot:121,
    lipR:[90,8], lipL:[10,8], mouth:[50,8],
    back:()=>`<path d="M10 8 L90 8 L81 121 Q50 128 19 121 Z" fill="${CAP_GLASS_FILL}"/>`,
    front:()=>`<path d="M10 8 L90 8 L81 121 Q50 128 19 121 Z" fill="none" stroke="${CAP_GLASS_LINE}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="50" cy="8" rx="40" ry="5" fill="rgba(255,255,255,.35)" stroke="${CAP_GLASS_LINE}" stroke-width="2.5"/>
      <path d="M23 22 L29 108" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".75"/>
      <path d="M21 113 Q50 119 79 113" stroke="#8DB6DA" stroke-width="3" fill="none"/>` },
  mug: { vb:[132,140], inner:"M12 12 L90 12 L90 122 Q51 129 12 122 Z", yTop:26, yBot:127,
    lipR:[94,10], lipL:[8,10], mouth:[51,10],
    back:()=>`<path d="M8 10 L94 10 L94 126 Q51 134 8 126 Z" fill="${CAP_GLASS_FILL}"/>`,
    front:()=>`<path d="M94 32 C128 30 130 104 94 106" fill="none" stroke="${CAP_GLASS_LINE}" stroke-width="13" stroke-linecap="round"/>
      <path d="M94 32 C128 30 130 104 94 106" fill="none" stroke="#E6F4FC" stroke-width="7" stroke-linecap="round"/>
      <path d="M8 10 L94 10 L94 126 Q51 134 8 126 Z" fill="none" stroke="${CAP_GLASS_LINE}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="51" cy="10" rx="43" ry="5.5" fill="rgba(255,255,255,.35)" stroke="${CAP_GLASS_LINE}" stroke-width="2.5"/>
      <path d="M20 24 L20 112" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".75"/>
      <path d="M11 118 Q51 125 91 118" stroke="#8DB6DA" stroke-width="3" fill="none"/>` },
  cup_blue: { vb:[124,100], inner:null, lipR:[90,16], lipL:[8,16], mouth:[49,16],
    back:()=>"",
    front:()=>`<path d="M88 30 C116 28 116 70 82 72" fill="none" stroke="#1B4F86" stroke-width="15" stroke-linecap="round"/>
      <path d="M88 30 C116 28 116 70 82 72" fill="none" stroke="#2F8BE0" stroke-width="9" stroke-linecap="round"/>
      <path d="M8 16 L90 16 Q88 78 72 90 Q49 97 26 90 Q10 78 8 16 Z" fill="#2F8BE0" stroke="#1B4F86" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="49" cy="16" rx="41" ry="9" fill="#F3E9D2" stroke="#1B4F86" stroke-width="3"/>
      <ellipse cx="49" cy="18" rx="33" ry="5.5" fill="#E6D6B4"/>
      <path d="M20 32 Q22 68 34 82" stroke="rgba(255,255,255,.55)" stroke-width="6" fill="none" stroke-linecap="round"/>` },
  milkbottle: { vb:[110,220],
    inner:"M41 18 L41 41 C41 62 13 68 13 97 L13 199 Q13 211 27 211 L83 211 Q97 211 97 199 L97 97 C97 68 69 62 69 41 L69 18 Z",
    yTop:36, yBot:212, lipR:[76,6], lipL:[34,6], mouth:[55,6],
    back:()=>`<path d="M38 16 L38 40 C38 60 10 66 10 96 L10 200 Q10 214 26 214 L84 214 Q100 214 100 200 L100 96 C100 66 72 60 72 40 L72 16 Z" fill="${CAP_GLASS_FILL}"/>`,
    front:()=>`<path d="M38 16 L38 40 C38 60 10 66 10 96 L10 200 Q10 214 26 214 L84 214 Q100 214 100 200 L100 96 C100 66 72 60 72 40 L72 16 Z" fill="none" stroke="${CAP_GLASS_LINE}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="34" y="5" width="42" height="12" rx="5" fill="rgba(220,240,252,.7)" stroke="${CAP_GLASS_LINE}" stroke-width="3"/>
      <path d="M22 100 L22 198" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".75"/>` },
  pitcher: { vb:[170,200],
    inner:"M46 23 L139 23 L148 36 C161 82 161 150 139 182 Q96 193 53 182 C32 150 32 82 46 36 Z",
    yTop:42, yBot:190, lipR:[164,10], lipL:[42,20], mouth:[96,20],
    back:()=>`<path d="M42 20 L140 20 L164 10 L151 36 C165 82 165 150 142 186 Q96 198 50 186 C28 150 28 82 42 34 Z" fill="${CAP_GLASS_FILL}"/>`,
    front:()=>`<path d="M44 50 C4 48 4 138 50 148" fill="none" stroke="${CAP_GLASS_LINE}" stroke-width="13" stroke-linecap="round"/>
      <path d="M44 50 C4 48 4 138 50 148" fill="none" stroke="#E6F4FC" stroke-width="7" stroke-linecap="round"/>
      <path d="M42 20 L140 20 L164 10 L151 36 C165 82 165 150 142 186 Q96 198 50 186 C28 150 28 82 42 34 Z" fill="none" stroke="${CAP_GLASS_LINE}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M58 44 C48 90 48 140 62 172" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>` },
  jar: { vb:[130,190],
    inner:"M27 24 Q15 32 15 51 L15 167 Q15 181 31 181 L99 181 Q115 181 115 167 L115 51 Q115 32 103 24 Z",
    yTop:40, yBot:182, lipR:[108,5], lipL:[22,5], mouth:[65,5],
    back:()=>`<path d="M24 22 Q12 30 12 50 L12 168 Q12 184 30 184 L100 184 Q118 184 118 168 L118 50 Q118 30 106 22 Z" fill="${CAP_GLASS_FILL}"/>`,
    front:()=>`<path d="M24 22 Q12 30 12 50 L12 168 Q12 184 30 184 L100 184 Q118 184 118 168 L118 50 Q118 30 106 22 Z" fill="none" stroke="${CAP_GLASS_LINE}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="22" y="4" width="86" height="19" rx="6" fill="rgba(220,240,252,.65)" stroke="${CAP_GLASS_LINE}" stroke-width="3"/>
      <path d="M24 11 L106 11 M24 16 L106 16" stroke="${CAP_GLASS_LINE}" stroke-width="1.5" opacity=".6"/>
      <path d="M28 52 L28 166" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"/>` },
  teacup: { vb:[124,96], inner:"M12 12 L84 12 Q82 70 66 82 Q48 88 30 82 Q14 70 12 12 Z", yTop:22, yBot:88,
    lipR:[88,10], lipL:[8,10], mouth:[48,10],
    back:()=>`<path d="M8 10 L88 10 Q86 72 68 86 Q48 93 28 86 Q10 72 8 10 Z" fill="${CAP_GLASS_FILL}"/>`,
    front:()=>`<path d="M86 26 C114 24 116 66 78 68" fill="none" stroke="${CAP_GLASS_LINE}" stroke-width="10" stroke-linecap="round"/>
      <path d="M86 26 C114 24 116 66 78 68" fill="none" stroke="#E6F4FC" stroke-width="5" stroke-linecap="round"/>
      <path d="M8 10 L88 10 Q86 72 68 86 Q48 93 28 86 Q10 72 8 10 Z" fill="none" stroke="${CAP_GLASS_LINE}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="48" cy="10" rx="40" ry="5" fill="rgba(255,255,255,.3)" stroke="${CAP_GLASS_LINE}" stroke-width="2.5"/>
      <path d="M20 22 Q22 56 32 74" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>` },
  steelcup: { vb:[112,112], inner:null, opaque:"surface", lipR:[86,14], lipL:[10,14], mouth:[48,14],
    surface:{cx:48, cy:15, rx:34, ry:6},
    back:(u)=>`<defs>${CAP_STEEL(u+"g")}</defs>
      <path d="M86 30 C110 30 110 80 86 82" fill="none" stroke="#5F6A75" stroke-width="12" stroke-linecap="round"/>
      <path d="M86 30 C110 30 110 80 86 82" fill="none" stroke="#B9C2CB" stroke-width="7" stroke-linecap="round"/>
      <path d="M10 14 L86 14 L86 100 Q48 110 10 100 Z" fill="url(#${u}g)" stroke="#66717C" stroke-width="2.5" stroke-linejoin="round"/>
      <ellipse cx="48" cy="14" rx="38" ry="8" fill="#D5DBE1" stroke="#66717C" stroke-width="2.5"/>
      <ellipse cx="48" cy="15" rx="34" ry="6" fill="#5E6873"/>`,
    front:()=>"" },
  saucepan: { vb:[300,150], inner:null, opaque:"pool", lipR:[218,40], lipL:[22,40], mouth:[120,40],
    surface:{cx:120, cy:42, rx:94, ry:19},
    back:(u)=>`<defs>${CAP_STEEL(u+"g")}</defs>
      <path d="M212 48 L292 30" stroke="#2B2F33" stroke-width="15" stroke-linecap="round"/>
      <path d="M208 50 L232 45" stroke="#9AA4AE" stroke-width="12" stroke-linecap="round"/>
      <path d="M22 40 L218 40 L210 124 Q120 142 30 124 Z" fill="url(#${u}g)" stroke="#66717C" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="120" cy="40" rx="98" ry="22" fill="#CDD4DB" stroke="#66717C" stroke-width="3"/>
      <ellipse cx="120" cy="42" rx="92" ry="18" fill="#6E7984"/>
      <path d="M30 42 Q120 20 210 42" stroke="#9AA4AE" stroke-width="3" fill="none" opacity=".7"/>`,
    front:()=>"" },
  pbottle: { vb:[100,232],
    inner:"M39 24 L61 24 L61 36 C61 54 87 58 87 79 L87 207 Q87 221 73 221 L27 221 Q13 221 13 207 L13 79 C13 58 39 54 39 36 Z",
    yTop:46, yBot:222, lipR:[64,22], lipL:[36,22], mouth:[50,22],
    back:()=>`<path d="M36 22 L64 22 L64 36 C64 52 90 56 90 78 L90 208 Q90 224 74 224 L26 224 Q10 224 10 208 L10 78 C10 56 36 52 36 36 Z" fill="rgba(222,240,253,.94)"/>`,
    front:()=>`<path d="M36 22 L64 22 L64 36 C64 52 90 56 90 78 L90 208 Q90 224 74 224 L26 224 Q10 224 10 208 L10 78 C10 56 36 52 36 36 Z" fill="none" stroke="#3E7FC2" stroke-width="3" stroke-linejoin="round"/>
      <path d="M12 104 Q50 112 88 104 M12 134 Q50 142 88 134 M12 164 Q50 172 88 164" stroke="#5B9AD6" stroke-width="2.5" fill="none" opacity=".7"/>
      <path d="M22 84 L22 204" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".75"/>
      <g class="cap-lid"><rect x="32" y="2" width="36" height="22" rx="5" fill="#1D6FD6" stroke="#0F4A96" stroke-width="2.5"/>
      <path d="M38 6 L38 20 M44 6 L44 20 M50 6 L50 20 M56 6 L56 20 M62 6 L62 20" stroke="#5C9CF0" stroke-width="2"/></g>` }
};
/* 28t-engine adapters. (1) the engine hides आगे on guided/practice — the SME flow shows it after a
   solved question, so un-hide it when we enable it. (2) the engine limits the hand nudge to tutorial;
   the SME review asks for it on the guided/practice demos, idle prompts and the 2nd-wrong reveal, so
   these slides place it directly. (3) the engine's one-shot 7s idle VO is switched off for CAP_*
   slides: each module runs the SME-specified idle behaviour itself (never two voices). */
function capNavOn(){ const b = $("navBtn"); b.style.display = ""; setNavActive(true); }
function capPoint(el){ if(!el) return; const nh = $("nudgeHand");
  _placeNudge(el, nh); requestAnimationFrame(()=>{ if(nh.classList.contains("show")) _placeNudge(el, nh); });
  nh.classList.add("show", "hint-glow"); }
let _capUid = 0;
function capScale(){ return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scale")) || 1; }
/* capVessel(kind, {w, liquid, level, flip}) → a positioned vessel object with live liquid. */
function capVessel(kind, o){
  o = o || {};
  const base = CAP_VESSELS[kind], u = "cv" + (++_capUid);
  const [vw, vh] = base.vb, w = o.w || vw, s = w / vw, h = vh * s;
  const flip = !!o.flip;
  const mir = p => p ? [vw - p[0], p[1]] : p;
  const def = flip ? Object.assign({}, base, { lipR: mir(base.lipL), lipL: mir(base.lipR), mouth: mir(base.mouth),
    surface: base.surface ? Object.assign({}, base.surface, { cx: vw - base.surface.cx }) : null }) : base;
  const L = CAP_LIQ[o.liquid || "water"];
  const el = document.createElement("div"); el.className = "cap-v cap-v-" + kind;
  el.style.width = w + "px"; el.style.height = h + "px";
  let liq = "";
  if(base.inner){
    const H = base.yBot - base.yTop;
    liq = `<clipPath id="${u}c"><path d="${base.inner}"/></clipPath>
      <g clip-path="url(#${u}c)"><g class="cap-liq" style="transform:translateY(${(1 - (o.level || 0)) * (H + 6)}px)">
      <rect x="0" y="${base.yTop}" width="${vw}" height="${H + 8}" fill="${L.body}"/>
      <ellipse cx="${vw / 2}" cy="${base.yTop}" rx="${vw / 2}" ry="4" fill="${L.top}" ${L.edge ? `stroke="${L.edge}" stroke-width="1.5"` : ""}/></g></g>`;
  } else if(base.opaque){
    const sf = base.surface;
    liq = `<ellipse class="${base.opaque === "pool" ? "cap-pool" : "cap-opq"}" cx="${sf.cx}" cy="${sf.cy}" rx="${sf.rx}" ry="${sf.ry}" fill="${L.body}" ${L.edge ? `stroke="${L.edge}" stroke-width="1.5"` : ""}/>`;
  }
  const inner = base.back(u) + liq + base.front(u);
  el.innerHTML = `<svg viewBox="0 0 ${vw} ${vh}" xmlns="http://www.w3.org/2000/svg">` +
    (flip ? `<g transform="translate(${vw} 0) scale(-1 1)">${inner}</g>` : inner) + `</svg>`;
  const v = { el, kind, def, w, h, s, x: 0, y: 0, level: o.level || 0, liquid: o.liquid || "water",
    place(x, y){ this.x = x; this.y = y; el.style.left = x + "px"; el.style.top = y + "px"; return this; },
    set(level, ms){
      this.level = Math.max(0, Math.min(1, level)); const t = (ms == null ? 900 : ms) + "ms";
      const g = el.querySelector(".cap-liq");
      if(g){ g.style.transitionDuration = t; g.style.transform = `translateY(${(1 - this.level) * (base.yBot - base.yTop + 6)}px)`; }
      const op = el.querySelector(".cap-opq"); if(op){ op.style.transitionDuration = t; op.style.opacity = this.level > 0.02 ? 1 : 0; }
      const pl = el.querySelector(".cap-pool"); if(pl){ pl.style.transitionDuration = t;
        pl.style.opacity = this.level > 0.01 ? 1 : 0; pl.style.transform = `scale(${0.18 + 0.82 * this.level})`; }
      return this; },
    mouth(){ return [this.x + def.mouth[0] * s, this.y + def.mouth[1] * s]; },
    surfaceY(level){ if(!base.inner) return this.y + (def.surface ? def.surface.cy : def.mouth[1] + 8) * s;
      return this.y + (base.yTop + (1 - level) * (base.yBot - base.yTop)) * s; },
    center(){ return [this.x + w / 2, this.y + h / 2]; }
  };
  v.set(v.level, 0);
  return v;
}
/* per-mount lifecycle guard: every timer / VO continuation checks ctx.alive() so a slide that
   has been left can never keep animating or speaking into the next one. */
function capCtx(slide, root){
  const idx = state.idx;
  const ctx = {
    root, slide, replayFn: null,
    alive(){ return state.idx === idx && document.body.contains(root); },
    after(ms, fn){ setTimeout(()=>{ if(ctx.alive()) fn(); }, ms); },
    say(id, handlers, onEnd){ if(!ctx.alive()) return; capSay(id, handlers, ()=>{ if(ctx.alive() && onEnd) onEnd(); }); }
  };
  state.ownsAudio = true;
  _idleVoFired = true; stopIdleVo();
  state.replayAudio = ()=>{ if(ctx.replayFn && ctx.alive()) ctx.replayFn(); };   // no-op while a demo runs (never breaks a chain)
  return ctx;
}
/* capSay: play a VO clip and fire its word-timed cues (CARD.assets.audio_cues) as the words are spoken. */
function capSay(id, handlers, onEnd){
  const src = id ? "assets/Audio/" + id + "." + AUDIO_EXT : null;
  const cues = (((CARD.assets || {}).audio_cues || {})[id] || []).slice().sort((a, b)=> a.t - b.t);
  let fired = 0, over = false;
  const fireUpTo = (ms)=>{ while(fired < cues.length && cues[fired].t <= ms){ const c = cues[fired++];
    const fn = handlers && handlers[c.k]; if(fn){ try{ fn(c); }catch(e){ console.error("[cap] cue", c.k, e); } } } };
  play(src, ()=>{ if(over) return; over = true; fireUpTo(Infinity); if(onEnd) onEnd(); });
  const a = currentAudio;
  if(!a || !cues.length) return;
  const tick = ()=>{ if(over || currentAudio !== a) return; fireUpTo(a.currentTime * 1000); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
function capStage(host, h){ const st = document.createElement("div"); st.className = "cap-stage"; st.style.height = h + "px"; host.appendChild(st); return st; }
function capAdd(stage, v, x, y){ stage.appendChild(v.el); return v.place(x, y); }
/* a static picture vessel (no liquid) — same place()/el contract as capVessel, for supplied art */
function capImgVessel(key, w, aspect, alt){
  const h = Math.round(w / aspect), el = document.createElement("div");
  el.className = "cap-v cap-v-img cap-v-" + key; el.style.width = w + "px"; el.style.height = h + "px";
  el.innerHTML = `<img src="${((CARD.assets || {}).image || {})[key] || ("assets/Images/" + key + ".png")}" alt="${alt || ""}" draggable="false">`;
  return { el, w, h, x: 0, y: 0, place(x, y){ this.x = x; this.y = y; el.style.left = x + "px"; el.style.top = y + "px"; return this; } };
}
function capFlash(el, cls, ms){ el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(()=> el.classList.remove(cls), ms || 1400); }
function capBadge(v, n){ let b = v.el.querySelector(".cap-badge"); if(!b){ b = document.createElement("span"); b.className = "cap-badge"; v.el.appendChild(b); }
  b.textContent = String(n); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
function capHandEl(){ const hd = document.createElement("img"); hd.className = "cap-hand"; hd.src = "assets/UI/nudge_hand_new.svg"; hd.alt = ""; return hd; }
/* an invisible marker so the engine's capPoint() can point at any stage coordinate */
function capMarker(stage, x, y){ const m = document.createElement("div"); m.className = "cap-marker"; m.style.left = (x - 20) + "px"; m.style.top = (y - 20) + "px"; stage.appendChild(m); return m; }
function capHome(ctx, v, cb){ v.el.style.transition = "transform .6s cubic-bezier(.4,.1,.3,1)"; v.el.style.transform = "";
  ctx.after(620, ()=>{ v.el.classList.remove("pouring"); if(cb) cb(); }); }
/* capPour(ctx, src, dst, o): src flies to dst's mouth, tips about its lip, a stream runs while
   src drains to o.srcTo and dst fills to o.dstTo, then src rights itself and (unless o.stay)
   returns home. o.dir: +1 pours off the right lip (clockwise), -1 off the left lip. */
function capPour(ctx, src, dst, o){
  o = o || {};
  const dir = o.dir || 1, s = src.s, lip = dir > 0 ? src.def.lipR : src.def.lipL;
  const stage = o.stage || src.el.parentNode;
  const [mx, my] = dst.mouth();
  const px = mx - dir * 6, py = my - (o.gap || 28);
  const tx = (px - lip[0] * s) - src.x, ty = (py - lip[1] * s) - src.y;
  const ang = dir * (o.angle || 105), ms = o.ms || 1100;
  // travel half-tipped and lifted just enough that the vessel's lowest corner clears dst's rim,
  // so a tall source never sweeps through the glass it is about to fill
  const half = ang / 2, rad = half * Math.PI / 180, ox = lip[0] * s, oy = lip[1] * s;
  const lowY = Math.max(...[[0, 0], [src.w, 0], [0, src.h], [src.w, src.h]].map(([cx, cy]) =>
    (cx - ox) * Math.sin(rad) + (cy - oy) * Math.cos(rad)));
  const lift = Math.max(0, py + lowY - dst.y + 8);
  const air = `translate(${tx}px,${ty - lift}px) rotate(${half}deg)`;
  src.el.classList.add("pouring");
  src.el.style.transformOrigin = `${ox}px ${oy}px`;
  src.el.style.transition = "transform .62s cubic-bezier(.4,.1,.3,1)";
  src.el.style.transform = air;
  ctx.after(640, ()=>{
    src.el.style.transition = "transform .38s ease-in-out";
    src.el.style.transform = `translate(${tx}px,${ty}px) rotate(${ang}deg)`;
    ctx.after(400, ()=>{
      const liquid = o.liquid || src.liquid;
      const L = CAP_LIQ[liquid] || CAP_LIQ.water;
      const st = document.createElement("div"); st.className = "cap-stream" + (liquid === "milk" ? " milk" : "");
      const splash = document.createElement("span");
      splash.className = "cap-splash cap-splash-" + liquid;
      splash.setAttribute("aria-hidden", "true");
      st.appendChild(splash);
      st.style.background = L.stream; st.style.left = (px - 5) + "px"; st.style.top = py + "px";
      stage.appendChild(st);
      const h0 = Math.max(10, dst.surfaceY(dst.level) - py), h1 = Math.max(10, dst.surfaceY(o.dstTo) - py);
      requestAnimationFrame(()=>{ st.style.transition = "height .14s linear"; st.style.height = h0 + "px"; });
      _tone([420 + Math.random() * 40], "sine", 0.18, 0.05);
      ctx.after(150, ()=>{ st.style.transition = `height ${ms - 150}ms linear, opacity .25s`; st.style.height = h1 + "px";
        src.set(o.srcTo, Math.max(0, ms - 150)); dst.set(o.dstTo, Math.max(0, ms - 150)); });
      ctx.after(ms + 60, ()=>{
        st.style.opacity = "0"; setTimeout(()=> st.remove(), 300);
        src.el.style.transition = "transform .38s ease-in-out";
        src.el.style.transform = air;
        ctx.after(400, ()=>{ if(o.stay){ if(o.onDone) o.onDone(); } else capHome(ctx, src, o.onDone); });
      });
    });
  });
}
/* number cards (right column) + the SME hint ladder: wrong #1 → hint VO; wrong #2 → counting VO
   (each counted vessel pulses + gets its number), the right card glows, hand nudge on it, only it
   stays tappable. A right tap → confetti + praise VO → आगे. */
function capAskNumber(ctx, stage, spec, o){
  const slide = ctx.slide, isMastery = slide.phase === "practice";
  if(slide.ask_prompt_hi) $("promptText").textContent = slide.ask_prompt_hi;
  const col = document.createElement("div"); col.className = "cap-opts" + (o.row ? " row" : "");
  col.style.left = (o.x || 850) + "px"; col.style.top = (o.y || 70) + "px";
  let attempts = 0, done = false, busy = false, onlyRight = false, rightCell = null;
  const countEls = o.countEls || [];
  const h2Handlers = {};
  // counted vessels come back to full strength (a faded mug would fade its number badge too)
  countEls.forEach((v, i)=>{ h2Handlers["n" + (i + 1)] = ()=>{ v.el.classList.remove("cap-faint"); capFlash(v.el, "cap-pulse", 1500); capBadge(v, i + 1); }; });
  // incorrect options are never removed. A wrong tap only flashes red, then the card is tappable again.
  // At the REVEAL moment ("सही संख्या यह है") the incorrect cards stay on screen but are disabled.
  const hideWrong = ()=> [...col.children].forEach(x => { if(x !== rightCell){ x.classList.remove("crossed"); x.classList.add("cap-off-opt"); } });
  h2Handlers.show = ()=>{ hideWrong(); if(rightCell){ rightCell.classList.add("cap-glow"); capPoint(rightCell); } };
  const win = ()=>{
    done = true; stopNudge(); rightCell.classList.remove("cap-glow"); rightCell.classList.add("correct");
    sfxCorrect(); confettiCannon(); setSwMood("happy");
    SwiftPAL.emit("capacity_count_first_try", { slide_id: slide.id, phase: slide.phase, value: attempts === 0, attempts: attempts + 1,
      scaffold_level: state.scaffoldLevel, latency_ms: Date.now() - state.slideStart });
    if(isMastery){ state.masteryAttempts++; if(attempts === 0) state.masteryHits++; }
    $("hintBtn").classList.remove("show");
    const okId = attempts === 0 ? spec.ok : spec.ok + "2";   // "शाबाश!" only on a first-try correct answer
    ctx.replayFn = ()=> ctx.say(okId);
    // o.autoNext: no Next button on this screen — after the praise it moves on by itself
    ctx.say(okId, null, ()=>{ setSwMood("point");
      if(o.autoNext){ ctx.after(900, ()=>{ if(ctx.alive()) completeSlide(true); }); } else capNavOn(); });
  };
  spec.values.forEach(val => {
    const c = document.createElement("div"); c.className = "opt-cell cap-num";
    c.innerHTML = `<span class="bignum-glyph">${devNumeral(val)}</span>`;
    if(val === spec.answer) rightCell = c;
    c.onclick = ()=>{
      if(done || busy || c.classList.contains("crossed")) return;
      if(onlyRight && val !== spec.answer) return;
      stopNudge(); busy = true;
      if(val === spec.answer){ ctx.say("cap_num_" + val, null, ()=>{ busy = false; win(); }); return; }
      attempts++; state.attempts = attempts; c.classList.add("crossed"); sfxWrongSoft(); setSwMood("tryagain");
      setTimeout(()=>{ if(!c.classList.contains("cap-off-opt")) c.classList.remove("crossed"); }, 900);   // red flash only; stays tappable
      SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts });
      $("hintBtn").classList.add("show");
      ctx.say("cap_num_" + val, null, ()=>{
        if(attempts === 1){ state.scaffoldLevel = Math.max(state.scaffoldLevel, 2);
          ctx.say(spec.h1, null, ()=>{ busy = false; }); }
        else { state.scaffoldLevel = 3; onlyRight = true;
          SwiftPAL.emit("answer_revealed", { slide_id: slide.id, phase: slide.phase, attempts });
          ctx.say(spec.h2, h2Handlers, ()=>{ busy = false; hideWrong(); rightCell.classList.add("cap-glow"); capPoint(rightCell); }); }
      });
    };
    col.appendChild(c);
  });
  stage.appendChild(col);
  $("hintBtn").onclick = ()=>{ if(done || busy) return; state.hintUsed = true; SwiftPAL.emit("hint_shown", { slide_id: slide.id, manual: true });
    busy = true; ctx.say(attempts >= 2 ? spec.h2 : spec.h1, attempts >= 2 ? h2Handlers : null, ()=>{ busy = false; }); };
  ctx.replayFn = ()=>{ if(!busy && !done) ctx.say(spec.q); };
  ctx.say(spec.q);
}
/* idle helper: after `ms` with no action, run fn (re-armed by the caller) */
function capIdle(ctx, ms, fn){ let t = null;
  const api = { arm(){ clearTimeout(t); t = setTimeout(()=>{ if(ctx.alive()) fn(); }, ms); }, stop(){ clearTimeout(t); } };
  return api; }

/* [MTG2A04_L03_S01 page 11] Figma shop art (ASSETE MAP "order view.svg" / "puring view.svg"),
   generated by _tools/build_shop.py. fig = the piece's top-left in the 1920x1080 Figma frame. */
const CAP_SHOP_ART = {
  shopb4: { vb:[160.0,320.2], shift:[-100.0,-566.0], fig:[100.0,566.0],
    back:`<path d="M116.909 872.113C116.909 872.113 125.962 884.164 181.341 884.164C236.72 884.164 243.997 871.571 243.997 871.571L116.909 872.113Z" fill="#97AAA3"/><path opacity="0.37" d="M255.89 661.568C252.163 643.29 239.383 635.572 226.603 621.761C213.823 607.95 215.953 589.672 215.953 589.672C215.953 589.672 221.278 589.672 221.81 586.422C222.343 583.172 222.343 578.298 219.681 577.079C217.018 575.861 209.031 575.455 209.031 575.455C209.031 575.455 214.612 580.329 180 580.329C145.388 580.329 150.969 575.455 150.969 575.455C150.969 575.455 142.982 575.861 140.319 577.079C137.657 578.298 137.657 583.172 138.19 586.422C138.722 589.672 144.047 589.672 144.047 589.672C144.047 589.672 146.177 607.95 133.397 621.761C120.618 635.572 107.837 643.289 104.11 661.568C100.383 679.847 102.512 839.888 103.577 850.856C104.643 861.823 110.5 870.353 116.89 873.603C123.279 876.852 172.801 878.477 172.801 878.477H187.199C187.199 878.477 236.72 876.852 243.11 873.603C249.5 870.353 255.358 861.823 256.423 850.856C257.488 839.888 259.617 679.847 255.89 661.568Z" fill="#D7E5FF"/>`, milk:`<path fill="url(#{U}paint1_linear)" d="M255.89 661.568C252.163 643.29 239.383 635.572 226.603 621.761C213.823 607.95 215.953 589.672 215.953 589.672C215.953 589.672 221.278 589.672 221.81 586.422C222.343 583.172 222.343 578.298 219.681 577.079C217.018 575.861 209.031 575.455 209.031 575.455C209.031 575.455 214.612 580.329 180 580.329C145.388 580.329 150.969 575.455 150.969 575.455C150.969 575.455 142.982 575.861 140.319 577.079C137.657 578.298 137.657 583.172 138.19 586.422C138.722 589.672 144.047 589.672 144.047 589.672C144.047 589.672 146.177 607.95 133.397 621.761C120.618 635.572 107.837 643.289 104.11 661.568C100.383 679.847 102.512 839.888 103.577 850.856C104.643 861.823 110.5 870.353 116.89 873.603C123.279 876.852 172.801 878.477 172.801 878.477H187.199C187.199 878.477 236.72 876.852 243.11 873.603C249.5 870.353 255.358 861.823 256.423 850.856C257.488 839.888 259.617 679.847 255.89 661.568Z"/>`, surf:`<ellipse cx="179.84131622314453" cy="661.9543151855469" rx="76.26866912841797" ry="8.197296142578125" fill="#FFFFFF" stroke="#DCD5C4" stroke-width="1"/>`, front:`<path opacity="0.48" d="M188.796 594.546V620.136L202.108 621.355L197.671 594.275L188.796 594.546Z" fill="url(#{U}paint2_linear)"/><path opacity="0.48" d="M162.704 616.887C162.704 616.887 141.405 652.226 141.937 657.1C142.47 661.974 146.197 664.412 146.197 664.412C146.197 664.412 166.432 651.413 184.004 652.225L181.875 621.355C181.873 621.355 168.029 619.324 162.704 616.887Z" fill="url(#{U}paint3_linear)"/><path opacity="0.48" d="M212.758 659.944C212.758 659.944 225.538 672.942 227.668 684.722L237.785 683.909C237.785 683.909 233.525 664.412 224.473 659.131L212.758 659.944Z" fill="url(#{U}paint4_linear)"/><path opacity="0.19" d="M180.809 583.985C147.794 583.985 141.772 580.225 138.684 578.82C137.808 580.653 137.823 583.328 138.035 585.279C138.14 586.244 138.205 586.929 138.658 587.588C139.243 588.439 140.286 588.99 141.494 589.314C142.569 589.606 143.404 589.636 144.046 589.672C144.046 589.672 182.05 596.306 215.952 589.672C216.922 589.482 217.867 589.345 218.745 589.246C220.123 588.834 221.547 588.023 221.809 586.423C222.342 583.173 222.342 578.299 219.679 577.08C219.681 577.079 217.551 583.985 180.809 583.985Z" fill="url(#{U}paint6_linear)"/><path opacity="0.19" d="M211.693 590.484C211.693 590.484 212.226 609.575 220.213 619.73C228.201 629.885 240.98 637.603 246.838 651.414C252.695 665.225 251.63 704.626 251.63 704.626L245.241 702.595C245.241 702.595 247.938 664.34 239.383 650.602C229.266 634.354 213.291 624.605 210.096 615.263C206.902 605.92 206.724 591.162 206.724 591.162L211.693 590.484Z" fill="url(#{U}paint7_linear)"/><path opacity="0.19" d="M146.729 590.078C146.729 590.078 149.391 608.357 136.612 622.167C123.832 635.978 113.182 645.726 109.455 655.881C105.727 666.036 106.792 692.845 106.792 692.845L112.117 701.376C112.117 701.376 111.052 665.63 114.247 656.288C117.442 646.945 137.144 630.697 143.534 621.355C149.924 612.012 149.924 590.484 149.924 590.484L146.729 590.078Z" fill="url(#{U}paint8_linear)"/><path d="M167.674 568.008C166.623 567.874 166.786 569.497 168.029 569.632C169.271 569.768 168.739 568.143 167.674 568.008Z" fill="#967653"/>`, cork:"", defs:`<linearGradient id="{U}paint0_linear" x1="86.8366" y1="751.835" x2="245.219" y2="858.38" gradientUnits="userSpaceOnUse"> <stop offset="0.0054" stop-color="#FFFCFF"/> <stop offset="1" stop-color="#CCCCCC"/> </linearGradient><linearGradient id="{U}paint1_linear" x1="86.7847" y1="717.128" x2="267.028" y2="812.247" gradientUnits="userSpaceOnUse"> <stop offset="0.0054" stop-color="#FFFCFF"/> <stop offset="1" stop-color="#CCCCCC"/> </linearGradient><linearGradient id="{U}paint2_linear" x1="195.452" y1="613.366" x2="195.452" y2="616.887" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1" stop-color="white"/> </linearGradient><linearGradient id="{U}paint3_linear" x1="170.986" y1="643.94" x2="174.89" y2="645.275" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1" stop-color="white"/> </linearGradient><linearGradient id="{U}paint4_linear" x1="212.758" y1="671.926" x2="237.785" y2="671.926" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1" stop-color="white"/> </linearGradient><linearGradient id="{U}paint5_linear" x1="297.396" y1="672.926" x2="142.526" y2="651.93" gradientUnits="userSpaceOnUse"> <stop offset="0.0054" stop-color="#FFFCFF"/> <stop offset="1" stop-color="#CCCCCC"/> </linearGradient><linearGradient id="{U}paint6_linear" x1="123.745" y1="576.272" x2="177.08" y2="587.582" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1"/> </linearGradient><linearGradient id="{U}paint7_linear" x1="262.384" y1="737.18" x2="228.923" y2="560.892" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1"/> </linearGradient><linearGradient id="{U}paint8_linear" x1="150.22" y1="721.805" x2="127.516" y2="578.779" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1"/> </linearGradient>`,
    poly:[[255.9,661.6],[246.8,642.6],[232.1,627.4],[219.4,610.5],[215.9,589.8],[216.1,576.2],[197,579.8],[175.8,580.3],[154.7,578.6],[138.1,580.9],[143.9,598.1],[136.6,617.8],[121.9,633.2],[108.5,649.5],[103.2,669.9],[102.4,691.1],[102.1,712.3],[102,733.6],[102,754.8],[102.2,776],[102.4,797.3],[102.7,818.5],[103.1,839.7],[106,860.6],[120.6,874.7],[141.8,876.9],[163,878.1],[184.2,878.5],[205.4,877.7],[226.6,876.2],[246.8,871.1],[256.2,852.6],[257.1,831.4],[257.5,810.1],[257.7,788.9],[257.9,767.7],[258,746.4],[258,725.2],[257.8,704],[257.3,682.7]],
    surfC:[179.8,662.0], yTop:576.2, yFill:662.0, yBot:878.5, xTop:[138.1,216.1], xBot:[102,258],
    lipR:[216.1,576.2], lipL:[138.1,576.2], mouth:[177.1,576.2] },
  shopb3: { vb:[112.0,320.2], shift:[-305.0,-566.0], fig:[305.0,566.0],
    back:`<path d="M317.322 872.113C317.322 872.113 323.589 884.164 361.928 884.164C400.268 884.164 405.306 871.571 405.306 871.571L317.322 872.113Z" fill="#97AAA3"/><path opacity="0.37" d="M413.539 661.568C410.959 643.29 402.111 635.572 393.264 621.761C384.416 607.95 385.891 589.672 385.891 589.672C385.891 589.672 389.577 589.672 389.946 586.422C390.314 583.172 390.314 578.298 388.471 577.079C386.628 575.861 381.098 575.455 381.098 575.455C381.098 575.455 384.962 580.329 361 580.329C337.038 580.329 340.902 575.455 340.902 575.455C340.902 575.455 335.372 575.861 333.529 577.079C331.686 578.298 331.686 583.172 332.054 586.422C332.423 589.672 336.109 589.672 336.109 589.672C336.109 589.672 337.584 607.95 328.736 621.761C319.889 635.572 311.041 643.289 308.461 661.568C305.88 679.847 307.355 839.888 308.092 850.856C308.829 861.823 312.884 870.353 317.308 873.603C321.732 876.852 356.016 878.477 356.016 878.477H365.984C365.984 878.477 400.268 876.852 404.692 873.603C409.116 870.353 413.171 861.823 413.908 850.856C414.645 839.888 416.12 679.847 413.539 661.568Z" fill="#D7E5FF"/>`, milk:`<path fill="url(#{U}paint10_linear)" d="M413.539 661.568C410.959 643.29 402.111 635.572 393.264 621.761C384.416 607.95 385.891 589.672 385.891 589.672C385.891 589.672 389.577 589.672 389.946 586.422C390.314 583.172 390.314 578.298 388.471 577.079C386.628 575.861 381.098 575.455 381.098 575.455C381.098 575.455 384.962 580.329 361 580.329C337.038 580.329 340.902 575.455 340.902 575.455C340.902 575.455 335.372 575.861 333.529 577.079C331.686 578.298 331.686 583.172 332.054 586.422C332.423 589.672 336.109 589.672 336.109 589.672C336.109 589.672 337.584 607.95 328.736 621.761C319.889 635.572 311.041 643.289 308.461 661.568C305.88 679.847 307.355 839.888 308.092 850.856C308.829 861.823 312.884 870.353 317.308 873.603C321.732 876.852 356.016 878.477 356.016 878.477H365.984C365.984 878.477 400.268 876.852 404.692 873.603C409.116 870.353 413.171 861.823 413.908 850.856C414.645 839.888 416.12 679.847 413.539 661.568Z"/>`, surf:`<ellipse cx="360.8899688720703" cy="661.9543151855469" rx="52.80104064941406" ry="8.197296142578125" fill="#FFFFFF" stroke="#DCD5C4" stroke-width="1"/>`, front:`<path opacity="0.48" d="M367.089 594.546V620.136L376.306 621.355L373.234 594.275L367.089 594.546Z" fill="url(#{U}paint11_linear)"/><path opacity="0.48" d="M349.026 616.887C349.026 616.887 334.28 652.226 334.649 657.1C335.017 661.974 337.598 664.412 337.598 664.412C337.598 664.412 351.607 651.413 363.772 652.225L362.298 621.355C362.297 621.355 352.712 619.324 349.026 616.887Z" fill="url(#{U}paint12_linear)"/><path opacity="0.48" d="M383.679 659.944C383.679 659.944 392.526 672.942 394.001 684.722L401.005 683.909C401.005 683.909 398.056 664.412 391.789 659.131L383.679 659.944Z" fill="url(#{U}paint13_linear)"/><path opacity="0.19" d="M361.56 583.985C338.704 583.985 334.534 580.225 332.397 578.82C331.79 580.653 331.8 583.328 331.947 585.279C332.02 586.244 332.065 586.929 332.379 587.588C332.784 588.439 333.506 588.99 334.342 589.314C335.086 589.606 335.664 589.636 336.109 589.672C336.109 589.672 362.419 596.306 385.89 589.672C386.561 589.482 387.216 589.345 387.824 589.246C388.778 588.834 389.763 588.023 389.945 586.423C390.314 583.173 390.314 578.299 388.47 577.08C388.471 577.079 386.997 583.985 361.56 583.985Z" fill="url(#{U}paint15_linear)"/><path opacity="0.19" d="M382.941 590.484C382.941 590.484 383.31 609.575 388.84 619.73C394.37 629.885 403.217 637.603 407.272 651.414C411.327 665.225 410.59 704.626 410.59 704.626L406.167 702.595C406.167 702.595 408.034 664.34 402.112 650.602C395.107 634.354 384.048 624.605 381.836 615.263C379.624 605.92 379.501 591.162 379.501 591.162L382.941 590.484Z" fill="url(#{U}paint16_linear)"/><path opacity="0.19" d="M337.966 590.078C337.966 590.078 339.809 608.357 330.962 622.167C322.115 635.978 314.741 645.726 312.161 655.881C309.58 666.036 310.318 692.845 310.318 692.845L314.004 701.376C314.004 701.376 313.267 665.63 315.479 656.288C317.691 646.945 331.331 630.697 335.754 621.355C340.178 612.012 340.178 590.484 340.178 590.484L337.966 590.078Z" fill="url(#{U}paint17_linear)"/><path d="M352.467 568.008C351.739 567.874 351.852 569.497 352.712 569.632C353.572 569.768 353.204 568.143 352.467 568.008Z" fill="#967653"/>`, cork:"", defs:`<linearGradient id="{U}paint10_linear" x1="296.466" y1="717.128" x2="437.215" y2="768.551" gradientUnits="userSpaceOnUse"> <stop offset="0.0054" stop-color="#FFFCFF"/> <stop offset="1" stop-color="#CCCCCC"/> </linearGradient><linearGradient id="{U}paint11_linear" x1="371.698" y1="613.366" x2="371.698" y2="616.887" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1" stop-color="white"/> </linearGradient><linearGradient id="{U}paint12_linear" x1="354.76" y1="643.94" x2="357.618" y2="644.616" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1" stop-color="white"/> </linearGradient><linearGradient id="{U}paint13_linear" x1="383.679" y1="671.926" x2="401.005" y2="671.926" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1" stop-color="white"/> </linearGradient><linearGradient id="{U}paint14_linear" x1="442.274" y1="672.926" x2="334.039" y2="662.767" gradientUnits="userSpaceOnUse"> <stop offset="0.0054" stop-color="#FFFCFF"/> <stop offset="1" stop-color="#CCCCCC"/> </linearGradient><linearGradient id="{U}paint15_linear" x1="322.054" y1="576.272" x2="359.825" y2="581.817" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1"/> </linearGradient><linearGradient id="{U}paint16_linear" x1="418.035" y1="737.18" x2="371.462" y2="567.31" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1"/> </linearGradient><linearGradient id="{U}paint17_linear" x1="340.383" y1="721.805" x2="308.442" y2="582.499" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1"/> </linearGradient><linearGradient id="{U}paint9_linear" x1="296.502" y1="751.835" x2="427.384" y2="812.789" gradientUnits="userSpaceOnUse"> <stop offset="0.0054" stop-color="#FFFCFF"/> <stop offset="1" stop-color="#CCCCCC"/> </linearGradient>`,
    poly:[[413.5,661.6],[407.7,643.4],[397.1,627.5],[388.3,610.7],[385.8,591.8],[387,576.5],[370.2,580],[351.1,580],[334.4,576.7],[336.2,592.4],[333.5,611.3],[324.5,628],[314,644],[308.4,662.2],[307.5,681.3],[307.2,700.4],[307,719.6],[307,738.7],[307,757.9],[307.1,777],[307.2,796.1],[307.4,815.3],[307.7,834.4],[308.3,853.5],[314.9,871.3],[332.7,876.7],[351.8,878.2],[370.9,878.2],[389.9,876.6],[407.5,870.8],[413.7,852.9],[414.3,833.8],[414.6,814.6],[414.8,795.5],[414.9,776.4],[415,757.2],[415,738.1],[415,718.9],[414.8,699.8],[414.5,680.7]],
    surfC:[360.9,662.0], yTop:576.5, yFill:662.0, yBot:878.2, xTop:[334.4,387], xBot:[307,415],
    lipR:[387,576.5], lipL:[334.4,576.5], mouth:[360.7,576.5] },
  shopb2: { vb:[89.0,320.2], shift:[-491.0,-566.0], fig:[491.0,566.0],
    back:`<path d="M501.124 872.113C501.124 872.113 506.056 884.164 536.231 884.164C566.405 884.164 570.37 871.571 570.37 871.571L501.124 872.113Z" fill="#97AAA3"/><path opacity="0.37" d="M576.85 661.568C574.819 643.29 567.856 635.572 560.893 621.761C553.929 607.95 555.09 589.672 555.09 589.672C555.09 589.672 557.991 589.672 558.281 586.422C558.571 583.172 558.571 578.298 557.121 577.079C555.67 575.861 551.318 575.455 551.318 575.455C551.318 575.455 554.359 580.329 535.5 580.329C516.641 580.329 519.682 575.455 519.682 575.455C519.682 575.455 515.33 575.861 513.879 577.079C512.429 578.298 512.429 583.172 512.719 586.422C513.009 589.672 515.91 589.672 515.91 589.672C515.91 589.672 517.071 607.95 510.107 621.761C503.144 635.572 496.181 643.289 494.15 661.568C492.119 679.847 493.279 839.888 493.859 850.856C494.44 861.823 497.631 870.353 501.113 873.603C504.595 876.852 531.578 878.477 531.578 878.477H539.422C539.422 878.477 566.405 876.852 569.887 873.603C573.369 870.353 576.56 861.823 577.141 850.856C577.721 839.888 578.881 679.847 576.85 661.568Z" fill="#D7E5FF"/>`, milk:`<path fill="url(#{U}paint19_linear)" d="M576.85 661.568C574.819 643.29 567.856 635.572 560.893 621.761C553.929 607.95 555.09 589.672 555.09 589.672C555.09 589.672 557.991 589.672 558.281 586.422C558.571 583.172 558.571 578.298 557.121 577.079C555.67 575.861 551.318 575.455 551.318 575.455C551.318 575.455 554.359 580.329 535.5 580.329C516.641 580.329 519.682 575.455 519.682 575.455C519.682 575.455 515.33 575.861 513.879 577.079C512.429 578.298 512.429 583.172 512.719 586.422C513.009 589.672 515.91 589.672 515.91 589.672C515.91 589.672 517.071 607.95 510.107 621.761C503.144 635.572 496.181 643.289 494.15 661.568C492.119 679.847 493.279 839.888 493.859 850.856C494.44 861.823 497.631 870.353 501.113 873.603C504.595 876.852 531.578 878.477 531.578 878.477H539.422C539.422 878.477 566.405 876.852 569.887 873.603C573.369 870.353 576.56 861.823 577.141 850.856C577.721 839.888 578.881 679.847 576.85 661.568Z"/>`, surf:`<ellipse cx="535.4132232666016" cy="661.9543151855469" rx="41.55674743652344" ry="8.197296142578125" fill="#FFFFFF" stroke="#DCD5C4" stroke-width="1"/>`, front:`<path opacity="0.48" d="M540.293 594.546V620.136L547.546 621.355L545.128 594.275L540.293 594.546Z" fill="url(#{U}paint20_linear)"/><path opacity="0.48" d="M526.076 616.887C526.076 616.887 514.47 652.226 514.761 657.1C515.051 661.974 517.082 664.412 517.082 664.412C517.082 664.412 528.107 651.413 537.682 652.225L536.521 621.355C536.521 621.355 528.977 619.324 526.076 616.887Z" fill="url(#{U}paint21_linear)"/><path opacity="0.48" d="M553.349 659.944C553.349 659.944 560.312 672.942 561.473 684.722L566.986 683.909C566.986 683.909 564.664 664.412 559.732 659.131L553.349 659.944Z" fill="url(#{U}paint22_linear)"/><path opacity="0.19" d="M535.941 583.985C517.952 583.985 514.671 580.225 512.988 578.82C512.511 580.653 512.519 583.328 512.634 585.279C512.692 586.244 512.727 586.929 512.974 587.588C513.293 588.439 513.861 588.99 514.519 589.314C515.105 589.606 515.56 589.636 515.91 589.672C515.91 589.672 536.617 596.306 555.089 589.672C555.618 589.482 556.133 589.345 556.611 589.246C557.362 588.834 558.138 588.023 558.281 586.423C558.571 583.173 558.571 578.299 557.12 577.08C557.121 577.079 555.96 583.985 535.941 583.985Z" fill="url(#{U}paint24_linear)"/><path opacity="0.19" d="M552.769 590.484C552.769 590.484 553.059 609.575 557.411 619.73C561.763 629.885 568.726 637.603 571.918 651.414C575.109 665.225 574.529 704.626 574.529 704.626L571.048 702.595C571.048 702.595 572.518 664.34 567.856 650.602C562.344 634.354 553.639 624.605 551.899 615.263C550.158 605.92 550.061 591.162 550.061 591.162L552.769 590.484Z" fill="url(#{U}paint25_linear)"/><path opacity="0.19" d="M517.372 590.078C517.372 590.078 518.822 608.357 511.859 622.167C504.896 635.978 499.093 645.726 497.062 655.881C495.031 666.036 495.611 692.845 495.611 692.845L498.513 701.376C498.513 701.376 497.932 665.63 499.673 656.288C501.414 646.945 512.149 630.697 515.631 621.355C519.112 612.012 519.112 590.484 519.112 590.484L517.372 590.078Z" fill="url(#{U}paint26_linear)"/><path d="M528.784 568.008C528.211 567.874 528.3 569.497 528.977 569.632C529.654 569.768 529.364 568.143 528.784 568.008Z" fill="#967653"/>`, cork:"", defs:`<linearGradient id="{U}paint18_linear" x1="484.738" y1="751.835" x2="595.243" y2="792.339" gradientUnits="userSpaceOnUse"> <stop offset="0.0054" stop-color="#FFFCFF"/> <stop offset="1" stop-color="#CCCCCC"/> </linearGradient><linearGradient id="{U}paint19_linear" x1="484.71" y1="717.128" x2="600.681" y2="750.475" gradientUnits="userSpaceOnUse"> <stop offset="0.0054" stop-color="#FFFCFF"/> <stop offset="1" stop-color="#CCCCCC"/> </linearGradient><linearGradient id="{U}paint20_linear" x1="543.919" y1="613.366" x2="543.919" y2="616.887" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1" stop-color="white"/> </linearGradient><linearGradient id="{U}paint21_linear" x1="530.589" y1="643.94" x2="532.885" y2="644.368" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1" stop-color="white"/> </linearGradient><linearGradient id="{U}paint22_linear" x1="553.349" y1="671.926" x2="566.986" y2="671.926" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1" stop-color="white"/> </linearGradient><linearGradient id="{U}paint23_linear" x1="599.466" y1="672.926" x2="513.997" y2="666.613" gradientUnits="userSpaceOnUse"> <stop offset="0.0054" stop-color="#FFFCFF"/> <stop offset="1" stop-color="#CCCCCC"/> </linearGradient><linearGradient id="{U}paint24_linear" x1="504.848" y1="576.272" x2="534.816" y2="579.735" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1"/> </linearGradient><linearGradient id="{U}paint25_linear" x1="580.389" y1="737.18" x2="523.65" y2="574.306" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1"/> </linearGradient><linearGradient id="{U}paint26_linear" x1="519.274" y1="721.805" x2="479.898" y2="586.647" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1"/> </linearGradient>`,
    poly:[[576.8,661.6],[572.5,644],[564.1,627.8],[557.1,611.1],[555,593.1],[557,577],[541.5,580.1],[523.4,579.2],[512.6,582.9],[515.7,599.3],[512.1,617.1],[503.8,633.3],[496.4,649.8],[493.8,667.8],[493.3,685.9],[493.1,704.1],[493,722.3],[493,740.5],[493,758.7],[493.1,776.9],[493.2,795],[493.3,813.2],[493.5,831.4],[493.8,849.6],[497.2,867.4],[511.4,876.4],[529.5,878.3],[547.7,877.8],[565.7,875.3],[575.6,861.5],[577.3,843.4],[577.6,825.2],[577.7,807],[577.9,788.8],[577.9,770.7],[578,752.5],[578,734.3],[578,716.1],[577.8,697.9],[577.6,679.7]],
    surfC:[535.4,662.0], yTop:577, yFill:662.0, yBot:878.3, xTop:[512.6,557], xBot:[493,578],
    lipR:[557,577], lipL:[512.6,577], mouth:[534.8,577] },
  shopglass: { vb:[165,251.0], shift:[-734,-645], fig:[734,645],
    back:`<g> <path d="M896.04 671.788C895.993 671.788 895.946 671.784 895.898 671.775C895.498 671.699 895.227 671.321 895.282 670.915L895.476 669.465C895.53 669.065 895.878 668.774 896.286 668.8C896.688 668.827 897 669.163 897 669.569C897 670.066 896.931 670.585 896.784 671.198C896.699 671.55 896.387 671.788 896.04 671.788Z" fill="#231F20"/> <path d="M736.96 671.788C736.612 671.788 736.3 671.55 736.216 671.198C736.069 670.585 736 670.066 736 669.569C736 669.163 736.312 668.827 736.714 668.8C737.123 668.774 737.47 669.065 737.524 669.465L737.718 670.915C737.773 671.321 737.502 671.699 737.101 671.775C737.054 671.784 737.006 671.788 736.96 671.788Z" fill="#231F20"/> <path d="M816.5 692.137C773.6 692.137 739.086 683.136 736.216 671.2L736.007 669.672C736.002 669.638 736 669.603 736 669.569C736 656.914 771.36 647 816.5 647C861.64 647 897 656.914 897 669.569C897 669.603 896.997 669.638 896.993 669.672L896.798 671.121C893.914 683.136 859.399 692.137 816.5 692.137ZM737.53 669.519L737.718 670.915C740.368 681.917 774.979 690.597 816.5 690.597C858.02 690.597 892.632 681.917 895.296 670.837L895.469 669.52C895.367 658.143 859.246 648.541 816.5 648.541C773.754 648.541 737.637 658.143 737.53 669.519Z" fill="#231F20"/> <path d="M816.5 894.048C787.23 894.048 764.288 887.548 764.188 879.24L736.202 671.122C736.147 670.715 736.418 670.337 736.819 670.261C737.219 670.184 737.608 670.438 737.704 670.837C738.264 673.166 740.361 675.472 743.936 677.69C744.132 677.812 744.263 678.015 744.293 678.245L767.154 852.235C767.165 852.43 768.074 864.849 796.375 868.246C796.489 868.266 803.85 869.529 816.245 869.121C828.701 869.529 836.052 868.265 836.125 868.252C864.624 864.83 865.376 852.435 865.38 852.31L888.208 678.548C888.239 678.314 888.375 678.106 888.576 677.986C892.449 675.678 894.71 673.273 895.296 670.837C895.392 670.439 895.78 670.185 896.182 670.261C896.582 670.337 896.853 670.715 896.798 671.122L868.813 879.24C868.712 887.548 845.77 894.048 816.5 894.048ZM738.269 675.007L765.711 879.082C765.715 879.117 765.718 879.151 765.718 879.185C765.718 885.619 786.124 892.508 816.5 892.508C846.876 892.508 867.283 885.619 867.283 879.185C867.283 879.151 867.285 879.117 867.289 879.082L894.731 675.007C893.525 676.424 891.837 677.798 889.677 679.118L866.904 852.437C866.89 852.926 866.095 866.205 836.347 869.776C836.085 869.823 828.821 871.068 816.246 870.662C803.721 871.07 796.457 869.823 796.153 869.77C766.446 866.205 765.65 852.926 765.631 852.362L742.823 678.808C740.901 677.583 739.381 676.313 738.269 675.007Z" fill="#878375"/> <path d="M821.234 870.744C819.679 870.744 818.015 870.719 816.246 870.662C803.928 871.062 796.7 869.865 796.174 869.773C766.447 866.198 765.65 852.926 765.631 852.362L742.776 678.447C742.737 678.152 742.87 677.861 743.119 677.699C743.366 677.539 743.685 677.534 743.936 677.69C756.567 685.53 785.05 690.597 816.5 690.597C847.427 690.597 875.72 685.647 888.577 677.986C888.829 677.837 889.144 677.845 889.389 678.006C889.633 678.168 889.764 678.457 889.725 678.75L866.904 852.437C866.89 852.926 866.095 866.205 836.347 869.776C836.122 869.816 830.727 870.744 821.234 870.744ZM816.246 869.121C828.701 869.528 836.053 868.265 836.125 868.252C864.466 864.849 865.375 852.429 865.38 852.305L888.007 680.076C874.384 687.431 846.651 692.137 816.5 692.137C785.864 692.137 757.949 687.326 744.498 679.805L767.154 852.235C767.166 852.429 768.074 864.849 796.375 868.246C796.389 868.248 796.403 868.25 796.416 868.252C796.489 868.265 803.845 869.528 816.246 869.121Z" fill="#878375"/> <path d="M816.5 692.137C773.6 692.137 739.086 683.136 736.216 671.2L736.007 669.672C736.002 669.638 736 669.603 736 669.569C736 656.914 771.36 647 816.5 647C861.64 647 897 656.914 897 669.569C897 669.603 896.997 669.638 896.993 669.672L896.798 671.121C893.914 683.136 859.399 692.137 816.5 692.137ZM737.53 669.519L737.718 670.915C740.368 681.917 774.979 690.597 816.5 690.597C858.02 690.597 892.632 681.917 895.296 670.837L895.469 669.52C895.367 658.143 859.246 648.541 816.5 648.541C773.754 648.541 737.637 658.143 737.53 669.519ZM816.5 689.374C774.79 689.374 742.118 680.711 742.118 669.652C742.118 669.58 742.125 669.507 742.135 669.435C742.632 657.22 780.335 649.93 816.5 649.93C855.12 649.93 886.94 657.55 890.515 667.653C890.762 668.351 890.882 669.004 890.882 669.652C890.882 680.711 858.209 689.374 816.5 689.374ZM816.5 651.471C777.416 651.471 744.063 659.719 743.668 669.482C743.667 669.507 743.655 669.624 743.651 669.649C743.648 679.507 777.01 687.833 816.5 687.833C855.989 687.833 889.351 679.507 889.351 669.652C889.351 669.184 889.261 668.698 889.074 668.169C886.168 659.961 858.228 651.471 816.5 651.471Z" fill="#878375"/> <g style="mix-blend-mode:screen" opacity="0.74"> <path d="M768.727 882.439C767.182 873.946 766.228 865.303 765.119 856.743C763.929 847.572 762.945 838.378 761.698 829.215C760.472 820.21 759.252 811.204 758.059 802.195C755.755 784.811 753.132 767.384 751.959 749.877C750.87 733.613 750.643 717.203 747.78 701.118C747.104 697.321 746.274 693.548 745.22 689.838C744.347 686.768 743.129 684.08 741.398 681.406C739.786 678.915 738.026 676.503 736.778 673.796C736.666 673.551 736.564 673.303 736.462 673.056L764.187 879.239C764.216 881.586 766.07 883.789 769.372 885.742C769.146 884.643 768.929 883.541 768.728 882.438L768.727 882.439Z" fill="#F9F8D9"/> </g> <g style="mix-blend-mode:multiply" opacity="0.59"> <g style="mix-blend-mode:multiply" opacity="0.84"> <path d="M776.205 720.296C776.325 720.179 776.484 720.108 776.635 720.081C776.648 719.969 776.477 719.915 776.205 720.296Z" fill="#D6D31D"/> </g> <g style="mix-blend-mode:multiply" opacity="0.84"> <path d="M776.635 720.081C776.626 720.159 776.529 720.262 776.308 720.258C776.258 720.258 776.205 720.311 776.156 720.377C776.172 720.352 776.19 720.318 776.205 720.296C776.152 720.349 776.105 720.409 776.073 720.477C776.046 720.534 776.02 720.591 775.993 720.648C775.663 721.35 776.665 721.23 776.903 720.722C776.933 720.665 776.963 720.609 776.993 720.552C777.199 720.159 776.938 720.026 776.635 720.081Z" fill="#D6D31D"/> </g> </g> <g style="mix-blend-mode:screen" opacity="0.74"> <path d="M875.678 688.538L885.761 684.913L859.113 876.674C859.113 876.674 859.833 882.111 849.39 884.286C838.947 886.461 852.631 883.561 854.431 872.323C856.232 861.086 875.678 688.538 875.678 688.538Z" fill="#F9F8D9"/> </g> </g>`, milk:`<path fill="url(#{U}gm)" d="M745,681 L889,681 L880,760 L868,872 L817,878 L766,872 L754,760 Z"/>`, surf:`<ellipse cx="817.0" cy="693" rx="72.0" ry="9" fill="#FFFFFF" stroke="#DCD5C4" stroke-width="1"/>`, front:"", cork:"", defs:`<filter id="{U}filter0_d" x="731" y="646" width="171" height="257.048" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"> <feFlood flood-opacity="0" result="BackgroundImageFix"/> <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/> <feOffset dy="4"/> <feGaussianBlur stdDeviation="2.5"/> <feComposite in2="hardAlpha" operator="out"/> <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0"/> <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_45_11859"/> <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_45_11859" result="shape"/> </filter><linearGradient id="{U}gm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F4F1EA"/><stop offset=".35" stop-color="#FFFFFF"/><stop offset=".8" stop-color="#F1EDE4"/><stop offset="1" stop-color="#E2DDD1"/></linearGradient>`,
    poly:[[745,681],[889,681],[880,760],[868,872],[817,878],[766,872],[754,760]],
    surfC:[817.0,693], yTop:681, yFill:693, yBot:878, xTop:[745,889], xBot:[753,881],
    lipR:[895,675], lipL:[739,675], mouth:[817.0,675] }
};
const CAP_SHOP_FIG = {"chars": {"man": [683, 266, 339, 765], "woman": [1155, 298, 290, 745], "boy": [1445, 313, 376, 767]}, "glass_slots": [[736, 647, 161, 247.0], [960, 648, 161, 247.0], [1184, 649, 161, 247.0], [1408, 650, 161, 247.0], [1632, 651, 161, 247.0]], "pour_bottle": [235.0, 347.1, 505.0, 894.3]};
/* [page 11] the glass of milk, redrawn on top of the Figma glass: the milk follows the glass's inner wall
   down to a ROUNDED bottom (the generated polygon had corners), is shaded like a liquid (cream edges, bright
   middle, a little shadow at the bottom) and the glass's own walls + shine are laid over it at low opacity,
   so the milk reads as INSIDE the glass. Kept outside the generated block so build_shop.py --patch keeps it. */
/* [page 11] a FULL shop bottle is filled up to the bottom of its neck (was: only to the shoulder) — just a
   small empty space is left near the neck */
["shopb4", "shopb3", "shopb2"].forEach(k => { if(CAP_SHOP_ART[k]) CAP_SHOP_ART[k].yFill = 604; });
/* the man stood a little high (his bubble touched the title banner) — he stands 42px lower */
if(CAP_SHOP_FIG.chars.man) CAP_SHOP_FIG.chars.man[1] += 42;
(function(){
  const G = CAP_SHOP_ART.shopglass; if(!G) return;
  const T = 668, B = 856, L0 = 742.5, R0 = 891, L1 = 767, R1 = 867, BOT = 869.5, FILL = 684;
  const d = `M${L0},${T} L${R0},${T} L${R1},${B} A50,13.5 0 0 1 ${L1},${B} Z`;
  G.milk = `<path fill="url(#{U}gm)" d="${d}"/><path fill="url(#{U}gv)" d="${d}"/>` +
           `<path d="M${L0 + 9},${T + 22} L${L1 + 6},${B - 6}" stroke="rgba(255,255,255,.9)" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  G.defs += `<linearGradient id="{U}gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/>` +
            `<stop offset=".75" stop-color="#E9E1D0" stop-opacity=".18"/><stop offset="1" stop-color="#CFC4AE" stop-opacity=".55"/></linearGradient>` +
            `<radialGradient id="{U}gs" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".75" stop-color="#FBF8F2"/><stop offset="1" stop-color="#E7E0D2"/></radialGradient>`;
  const wL = L0 + (L1 - L0) * (FILL - T) / (B - T), wR = R0 - (R0 - R1) * (FILL - T) / (B - T), cx = (wL + wR) / 2;
  G.surf = `<ellipse cx="${cx}" cy="${FILL}" rx="${((wR - wL) / 2).toFixed(1)}" ry="8" fill="url(#{U}gs)" stroke="#E4DCCB" stroke-width="1.2"/>`;
  G.front = `<g opacity=".5">${G.back}</g>`;              // the glass walls + shine over the milk
  const poly = [[L0, T], [R0, T], [R1, B]];
  for(let k = 1; k < 8; k++){ const a = Math.PI * k / 8; poly.push([+(817 + 50 * Math.cos(a)).toFixed(1), +(B + 13.5 * Math.sin(a)).toFixed(1)]); }
  poly.push([L1, B]);
  Object.assign(G, { poly, surfC: [cx, FILL], yTop: T, yFill: FILL, yBot: BOT, xTop: [L0, R0], xBot: [L1, R1] });
})();
/* [MTG2A04_L03_S01 page 4] supplied art split into animatable layers by _tools/build_art.py.
   glass/glassWater = "glass svg.svg" + a liquid layer; jug = "jug.svg" (mirrored, water); bottle = "svg glass.svg".
   {U} is replaced per instance so gradient ids never collide. Geometry is in the art's own units. */
const CAP_ART = {
  glass: { vb:[103,172], shift:[0,0],
    back:`<path fill="none" d="M51.1532 0.405273C23.1322 0.405273 0.408203 5.41727 0.408203 11.5973C0.408203 11.7023 0.416205 11.8163 0.433205 11.9213L9.80021 153.661L10.3352 161.706C10.3352 161.706 10.8462 166.702 13.2462 168.251C13.4002 168.356 13.5622 168.446 13.7332 168.511C15.2412 169.119 35.5172 171.528 51.1532 171.22C66.7892 171.528 87.0732 169.119 88.5732 168.511C88.9792 168.349 89.3442 168.089 89.6602 167.765C91.5502 165.851 91.9792 161.707 91.9792 161.707L92.4662 154.286L101.874 11.9213C101.89 11.8163 101.898 11.7023 101.898 11.5973C101.898 5.41727 79.1822 0.405273 51.1532 0.405273Z" stroke="#7FA9CC" stroke-width="2.2" stroke-miterlimit="10"/><path fill="none" d="M101.897 11.5973C101.897 11.7023 101.889 11.8163 101.873 11.9213C101.102 17.9553 78.6943 22.7973 51.1523 22.7973C23.6183 22.7973 1.20225 17.9553 0.431252 11.9213C0.415252 11.8163 0.40625 11.7023 0.40625 11.5973C0.40625 5.41727 23.1312 0.405273 51.1512 0.405273C79.1812 0.405273 101.897 5.41727 101.897 11.5973Z" stroke="#7FA9CC" stroke-width="2.2" stroke-miterlimit="10"/><path opacity="0.19" d="M51.1532 0.405273C23.1322 0.405273 0.408203 5.41727 0.408203 11.5973C0.408203 11.7023 0.416205 11.8163 0.433205 11.9213L9.80021 153.661L10.3352 161.706C10.3352 161.706 10.8462 166.702 13.2462 168.251C13.4002 168.356 13.5622 168.446 13.7332 168.511C15.2412 169.119 35.5172 171.528 51.1532 171.22C66.7892 171.528 87.0732 169.119 88.5732 168.511C88.9792 168.349 89.3442 168.089 89.6602 167.765C91.5502 165.851 91.9792 161.707 91.9792 161.707L92.4662 154.286L101.874 11.9213C101.89 11.8163 101.898 11.7023 101.898 11.5973C101.898 5.41727 79.1822 0.405273 51.1532 0.405273Z" fill="#D7FFFF"/><path opacity="0.33" d="M101.808 12.9512L92.5791 152.599L92.4651 154.286L91.9781 161.707C91.9781 161.707 91.9781 161.723 91.9701 161.756C91.9701 161.772 91.9701 161.797 91.9621 161.821C91.9621 161.854 91.9621 161.87 91.9541 161.91C91.9461 161.943 91.9461 161.983 91.9381 162.032C91.9301 162.064 91.9301 162.105 91.9221 162.146C91.9141 162.203 91.9061 162.26 91.8901 162.324C91.8821 162.364 91.8741 162.413 91.8651 162.462C91.8571 162.535 91.8411 162.608 91.8251 162.689C91.8171 162.738 91.8091 162.786 91.8011 162.843C91.7841 162.932 91.7681 163.013 91.7441 163.111C91.7361 163.143 91.7281 163.184 91.7201 163.224C91.6791 163.427 91.6231 163.638 91.5661 163.857C91.5581 163.922 91.5411 163.979 91.5251 164.035C91.5011 164.132 91.4681 164.23 91.4361 164.335C91.4281 164.367 91.4201 164.408 91.4041 164.44C91.3961 164.481 91.3881 164.521 91.3711 164.562C91.3381 164.659 91.3061 164.757 91.2741 164.862C91.2411 164.943 91.2171 165.024 91.1851 165.113C91.1521 165.21 91.1121 165.3 91.0801 165.397C91.0391 165.486 91.0071 165.575 90.9661 165.673C90.9341 165.762 90.8931 165.851 90.8521 165.941L90.7061 166.233C90.6651 166.314 90.6331 166.387 90.5921 166.468C90.5031 166.638 90.4051 166.801 90.3001 166.955C90.2841 166.987 90.2591 167.012 90.2431 167.044C90.1541 167.174 90.0571 167.304 89.9671 167.417C89.9271 167.466 89.8861 167.514 89.8451 167.555C89.7801 167.628 89.7231 167.701 89.6591 167.766V167.75C89.3431 168.075 88.9861 168.35 88.5721 168.512C87.0721 169.12 66.7881 171.529 51.1521 171.221C35.5161 171.529 15.2401 169.12 13.7321 168.512C13.2621 168.317 12.8561 167.993 12.4991 167.595C12.4751 167.571 12.4421 167.538 12.4181 167.514C12.3291 167.409 12.2481 167.287 12.1591 167.173C12.1261 167.124 12.0941 167.084 12.0701 167.043C11.9891 166.929 11.9161 166.808 11.8431 166.686C11.8191 166.629 11.7861 166.581 11.7541 166.532C11.6891 166.41 11.6241 166.281 11.5591 166.159C11.5351 166.102 11.5111 166.046 11.4781 165.989C11.4211 165.859 11.3641 165.73 11.3161 165.6C11.2911 165.543 11.2671 165.487 11.2431 165.43C11.1941 165.3 11.1461 165.171 11.0971 165.041C11.0811 164.976 11.0571 164.919 11.0401 164.863C10.9911 164.733 10.9501 164.603 10.9181 164.482C10.8941 164.417 10.8781 164.36 10.8611 164.304C10.8451 164.239 10.8281 164.182 10.8121 164.126V164.118C10.7881 164.053 10.7721 163.988 10.7631 163.931C10.7471 163.882 10.7311 163.826 10.7141 163.769C10.6901 163.647 10.6571 163.534 10.6331 163.42C10.6251 163.371 10.6081 163.323 10.6001 163.274C10.5751 163.16 10.5511 163.055 10.5351 162.95C10.5191 162.901 10.5101 162.861 10.5021 162.82C10.4861 162.723 10.4701 162.625 10.4531 162.536C10.4451 162.496 10.4371 162.463 10.4371 162.423C10.4211 162.342 10.4051 162.261 10.3971 162.196C10.3891 162.155 10.3891 162.131 10.3811 162.099C10.3731 162.042 10.3651 161.977 10.3571 161.929C10.3571 161.897 10.3571 161.88 10.3491 161.848C10.3491 161.824 10.3411 161.791 10.3411 161.767C10.3331 161.726 10.3331 161.71 10.3331 161.71L9.79808 153.665L9.70108 152.173L0.455078 12.3022C0.601078 12.7722 0.820075 13.2192 1.12807 13.6242C1.16007 13.6562 1.19307 13.6972 1.22507 13.7292C1.23307 13.7372 1.24108 13.7452 1.24908 13.7532C1.50908 14.0292 1.77708 14.2962 2.04408 14.5722C2.04408 14.5802 2.05207 14.5802 2.06007 14.5882C2.06807 14.5962 2.07608 14.5962 2.07608 14.6042C2.09208 14.6122 2.21408 14.6852 2.36808 14.7822L11.8491 148.534C12.1251 152.475 14.7361 155.865 18.4831 157.131C31.3051 161.454 55.9521 166.75 84.2561 157.382C88.0431 156.133 90.7201 152.735 91.0031 148.753L100.557 13.9142C100.93 13.7032 101.287 13.4602 101.587 13.1432C101.662 13.0812 101.735 13.0162 101.808 12.9512Z" fill="#A7FFFF"/><path opacity="0.33" d="M44.9312 166.816C43.5852 167.708 41.8902 167.83 40.2842 167.895C33.8202 168.155 27.3402 167.944 20.9092 167.279C17.9892 166.971 14.9972 166.549 12.4102 165.154C11.8512 164.854 11.3152 164.505 10.8122 164.124V164.116C10.7882 164.051 10.7722 163.986 10.7632 163.929C10.7472 163.88 10.7312 163.824 10.7142 163.767C10.6902 163.645 10.6572 163.532 10.6332 163.418C10.6252 163.369 10.6082 163.321 10.6002 163.272C10.5752 163.158 10.5512 163.053 10.5352 162.948C10.5192 162.899 10.5102 162.859 10.5022 162.818C10.4862 162.721 10.4702 162.623 10.4532 162.534C10.4452 162.494 10.4372 162.461 10.4372 162.421C10.4212 162.34 10.4052 162.259 10.3972 162.194C10.3892 162.153 10.3892 162.129 10.3812 162.097C10.3732 162.04 10.3652 161.975 10.3572 161.927C10.3572 161.895 10.3572 161.878 10.3492 161.846C10.3492 161.822 10.3412 161.789 10.3412 161.765C10.3332 161.724 10.3332 161.708 10.3332 161.708L9.79817 153.663L9.70117 152.171C10.0502 152.577 10.4152 152.974 10.8042 153.355C14.2672 156.794 18.7282 159.121 23.3182 160.686C29.8792 162.924 36.8302 163.784 43.5532 165.495C44.2412 165.673 45.0922 166.127 44.9312 166.816Z" fill="#A7FFFF"/><path opacity="0.33" d="M92.5788 152.6L92.4648 154.287L91.9778 161.708C91.9778 161.708 91.9778 161.724 91.9698 161.757C91.9698 161.773 91.9698 161.798 91.9618 161.822C91.9618 161.855 91.9618 161.871 91.9538 161.911C91.9458 161.944 91.9458 161.984 91.9378 162.033C91.9298 162.065 91.9298 162.106 91.9218 162.147C91.9138 162.204 91.9058 162.261 91.8898 162.325C91.8818 162.365 91.8738 162.414 91.8648 162.463C91.8568 162.536 91.8408 162.609 91.8248 162.69C91.8168 162.739 91.8088 162.787 91.8008 162.844C91.7838 162.933 91.7678 163.014 91.7438 163.112C91.7358 163.144 91.7278 163.185 91.7198 163.225C91.6788 163.428 91.6228 163.639 91.5658 163.858C91.5578 163.923 91.5408 163.98 91.5248 164.036C91.5008 164.133 91.4678 164.231 91.4358 164.336C91.4278 164.368 91.4198 164.409 91.4038 164.441C91.0388 164.701 90.6498 164.944 90.2518 165.155C87.6648 166.55 84.6718 166.972 81.7528 167.28C75.3218 167.945 68.8418 168.156 62.3778 167.896C60.7718 167.831 59.0768 167.71 57.7308 166.817C57.5608 166.128 58.4198 165.673 59.1098 165.495C65.8328 163.784 72.7838 162.924 79.3448 160.686C83.9278 159.121 88.3878 156.793 91.8588 153.355C92.1008 153.111 92.3438 152.86 92.5788 152.6Z" fill="#A7FFFF"/>`, milk:`<g opacity="1"><path fill="url(#{U}lq)" d="M1.4,12.5 L100.9,12.5 L91.1,158 Q51.15,166.5 11.2,158 Z"/><path fill="url(#{U}dp)" d="M1.4,12.5 L100.9,12.5 L91.1,158 Q51.15,166.5 11.2,158 Z"/><path fill="#FFFFFF" opacity=".45" d="M9,20 L19,20 L25,154 L17,153 Z"/></g>`, surf:`<ellipse cx="51.15" cy="24" rx="49.7" ry="10.4" fill="#FFFFFF" stroke="#E4DED0" stroke-width="0.9"/>`, front:`<path opacity="0.19" d="M97.0233 16.3901L89.4153 153.443C88.2153 155.26 86.4143 156.671 84.2573 157.384C80.5023 158.625 76.8043 159.614 73.1953 160.377L79.6433 20.8671C94.2813 20.3961 97.0233 16.3901 97.0233 16.3901Z" fill="#D7FFFF"/><path opacity="0.19" d="M29.012 160.052C26.247 159.436 23.724 158.763 21.47 158.081C20.415 157.765 19.418 157.448 18.485 157.132C18.079 156.994 17.69 156.832 17.317 156.645L7.12305 17.1694L12.411 18.4584L21.6 20.7054L29.012 160.052Z" fill="#D7FFFF"/><path opacity="0.19" d="M21.47 158.082C20.415 157.766 19.418 157.449 18.485 157.133C18.079 156.995 17.69 156.833 17.317 156.646L7.12305 17.1694L12.411 18.4584C12.906 23.7304 19.28 122.933 21.47 158.082Z" fill="#D7FFFF"/><path fill="none" d="M51.1532 0.405273C23.1322 0.405273 0.408203 5.41727 0.408203 11.5973C0.408203 11.7023 0.416205 11.8163 0.433205 11.9213L9.80021 153.661L10.3352 161.706C10.3352 161.706 10.8462 166.702 13.2462 168.251C13.4002 168.356 13.5622 168.446 13.7332 168.511C15.2412 169.119 35.5172 171.528 51.1532 171.22C66.7892 171.528 87.0732 169.119 88.5732 168.511C88.9792 168.349 89.3442 168.089 89.6602 167.765C91.5502 165.851 91.9792 161.707 91.9792 161.707L92.4662 154.286L101.874 11.9213C101.89 11.8163 101.898 11.7023 101.898 11.5973C101.898 5.41727 79.1822 0.405273 51.1532 0.405273Z" stroke="white" stroke-width="0.811" stroke-miterlimit="10"/><path fill="none" d="M101.897 11.5973C101.897 11.7023 101.889 11.8163 101.873 11.9213C101.102 17.9553 78.6943 22.7973 51.1523 22.7973C23.6183 22.7973 1.20225 17.9553 0.431252 11.9213C0.415252 11.8163 0.40625 11.7023 0.40625 11.5973C0.40625 5.41727 23.1312 0.405273 51.1512 0.405273C79.1812 0.405273 101.897 5.41727 101.897 11.5973Z" stroke="white" stroke-width="0.811" stroke-miterlimit="10"/>`, cork:"", defs:`<linearGradient id="{U}lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F4F1EA"/><stop offset=".35" stop-color="#FFFFFF"/><stop offset=".8" stop-color="#F1EDE4"/><stop offset="1" stop-color="#E2DDD1"/></linearGradient><linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B4F8A" stop-opacity="0"/><stop offset=".55" stop-color="#0B4F8A" stop-opacity=".06"/><stop offset="1" stop-color="#0B4F8A" stop-opacity=".2"/></linearGradient>`,
    surfC:[51.15,24], yTop:12.5, yFill:24, yBot:162, xTop:[1.4,100.9], xBot:[11.2,91.1],
    lipR:[101.9,11.6], lipL:[0.4,11.6], mouth:[51.15,11.6] },
  glassWater: { vb:[103,172], shift:[0,0],
    back:`<path fill="none" d="M51.1532 0.405273C23.1322 0.405273 0.408203 5.41727 0.408203 11.5973C0.408203 11.7023 0.416205 11.8163 0.433205 11.9213L9.80021 153.661L10.3352 161.706C10.3352 161.706 10.8462 166.702 13.2462 168.251C13.4002 168.356 13.5622 168.446 13.7332 168.511C15.2412 169.119 35.5172 171.528 51.1532 171.22C66.7892 171.528 87.0732 169.119 88.5732 168.511C88.9792 168.349 89.3442 168.089 89.6602 167.765C91.5502 165.851 91.9792 161.707 91.9792 161.707L92.4662 154.286L101.874 11.9213C101.89 11.8163 101.898 11.7023 101.898 11.5973C101.898 5.41727 79.1822 0.405273 51.1532 0.405273Z" stroke="#7FA9CC" stroke-width="2.2" stroke-miterlimit="10"/><path fill="none" d="M101.897 11.5973C101.897 11.7023 101.889 11.8163 101.873 11.9213C101.102 17.9553 78.6943 22.7973 51.1523 22.7973C23.6183 22.7973 1.20225 17.9553 0.431252 11.9213C0.415252 11.8163 0.40625 11.7023 0.40625 11.5973C0.40625 5.41727 23.1312 0.405273 51.1512 0.405273C79.1812 0.405273 101.897 5.41727 101.897 11.5973Z" stroke="#7FA9CC" stroke-width="2.2" stroke-miterlimit="10"/><path opacity="0.19" d="M51.1532 0.405273C23.1322 0.405273 0.408203 5.41727 0.408203 11.5973C0.408203 11.7023 0.416205 11.8163 0.433205 11.9213L9.80021 153.661L10.3352 161.706C10.3352 161.706 10.8462 166.702 13.2462 168.251C13.4002 168.356 13.5622 168.446 13.7332 168.511C15.2412 169.119 35.5172 171.528 51.1532 171.22C66.7892 171.528 87.0732 169.119 88.5732 168.511C88.9792 168.349 89.3442 168.089 89.6602 167.765C91.5502 165.851 91.9792 161.707 91.9792 161.707L92.4662 154.286L101.874 11.9213C101.89 11.8163 101.898 11.7023 101.898 11.5973C101.898 5.41727 79.1822 0.405273 51.1532 0.405273Z" fill="#D7FFFF"/><path opacity="0.33" d="M101.808 12.9512L92.5791 152.599L92.4651 154.286L91.9781 161.707C91.9781 161.707 91.9781 161.723 91.9701 161.756C91.9701 161.772 91.9701 161.797 91.9621 161.821C91.9621 161.854 91.9621 161.87 91.9541 161.91C91.9461 161.943 91.9461 161.983 91.9381 162.032C91.9301 162.064 91.9301 162.105 91.9221 162.146C91.9141 162.203 91.9061 162.26 91.8901 162.324C91.8821 162.364 91.8741 162.413 91.8651 162.462C91.8571 162.535 91.8411 162.608 91.8251 162.689C91.8171 162.738 91.8091 162.786 91.8011 162.843C91.7841 162.932 91.7681 163.013 91.7441 163.111C91.7361 163.143 91.7281 163.184 91.7201 163.224C91.6791 163.427 91.6231 163.638 91.5661 163.857C91.5581 163.922 91.5411 163.979 91.5251 164.035C91.5011 164.132 91.4681 164.23 91.4361 164.335C91.4281 164.367 91.4201 164.408 91.4041 164.44C91.3961 164.481 91.3881 164.521 91.3711 164.562C91.3381 164.659 91.3061 164.757 91.2741 164.862C91.2411 164.943 91.2171 165.024 91.1851 165.113C91.1521 165.21 91.1121 165.3 91.0801 165.397C91.0391 165.486 91.0071 165.575 90.9661 165.673C90.9341 165.762 90.8931 165.851 90.8521 165.941L90.7061 166.233C90.6651 166.314 90.6331 166.387 90.5921 166.468C90.5031 166.638 90.4051 166.801 90.3001 166.955C90.2841 166.987 90.2591 167.012 90.2431 167.044C90.1541 167.174 90.0571 167.304 89.9671 167.417C89.9271 167.466 89.8861 167.514 89.8451 167.555C89.7801 167.628 89.7231 167.701 89.6591 167.766V167.75C89.3431 168.075 88.9861 168.35 88.5721 168.512C87.0721 169.12 66.7881 171.529 51.1521 171.221C35.5161 171.529 15.2401 169.12 13.7321 168.512C13.2621 168.317 12.8561 167.993 12.4991 167.595C12.4751 167.571 12.4421 167.538 12.4181 167.514C12.3291 167.409 12.2481 167.287 12.1591 167.173C12.1261 167.124 12.0941 167.084 12.0701 167.043C11.9891 166.929 11.9161 166.808 11.8431 166.686C11.8191 166.629 11.7861 166.581 11.7541 166.532C11.6891 166.41 11.6241 166.281 11.5591 166.159C11.5351 166.102 11.5111 166.046 11.4781 165.989C11.4211 165.859 11.3641 165.73 11.3161 165.6C11.2911 165.543 11.2671 165.487 11.2431 165.43C11.1941 165.3 11.1461 165.171 11.0971 165.041C11.0811 164.976 11.0571 164.919 11.0401 164.863C10.9911 164.733 10.9501 164.603 10.9181 164.482C10.8941 164.417 10.8781 164.36 10.8611 164.304C10.8451 164.239 10.8281 164.182 10.8121 164.126V164.118C10.7881 164.053 10.7721 163.988 10.7631 163.931C10.7471 163.882 10.7311 163.826 10.7141 163.769C10.6901 163.647 10.6571 163.534 10.6331 163.42C10.6251 163.371 10.6081 163.323 10.6001 163.274C10.5751 163.16 10.5511 163.055 10.5351 162.95C10.5191 162.901 10.5101 162.861 10.5021 162.82C10.4861 162.723 10.4701 162.625 10.4531 162.536C10.4451 162.496 10.4371 162.463 10.4371 162.423C10.4211 162.342 10.4051 162.261 10.3971 162.196C10.3891 162.155 10.3891 162.131 10.3811 162.099C10.3731 162.042 10.3651 161.977 10.3571 161.929C10.3571 161.897 10.3571 161.88 10.3491 161.848C10.3491 161.824 10.3411 161.791 10.3411 161.767C10.3331 161.726 10.3331 161.71 10.3331 161.71L9.79808 153.665L9.70108 152.173L0.455078 12.3022C0.601078 12.7722 0.820075 13.2192 1.12807 13.6242C1.16007 13.6562 1.19307 13.6972 1.22507 13.7292C1.23307 13.7372 1.24108 13.7452 1.24908 13.7532C1.50908 14.0292 1.77708 14.2962 2.04408 14.5722C2.04408 14.5802 2.05207 14.5802 2.06007 14.5882C2.06807 14.5962 2.07608 14.5962 2.07608 14.6042C2.09208 14.6122 2.21408 14.6852 2.36808 14.7822L11.8491 148.534C12.1251 152.475 14.7361 155.865 18.4831 157.131C31.3051 161.454 55.9521 166.75 84.2561 157.382C88.0431 156.133 90.7201 152.735 91.0031 148.753L100.557 13.9142C100.93 13.7032 101.287 13.4602 101.587 13.1432C101.662 13.0812 101.735 13.0162 101.808 12.9512Z" fill="#A7FFFF"/><path opacity="0.33" d="M44.9312 166.816C43.5852 167.708 41.8902 167.83 40.2842 167.895C33.8202 168.155 27.3402 167.944 20.9092 167.279C17.9892 166.971 14.9972 166.549 12.4102 165.154C11.8512 164.854 11.3152 164.505 10.8122 164.124V164.116C10.7882 164.051 10.7722 163.986 10.7632 163.929C10.7472 163.88 10.7312 163.824 10.7142 163.767C10.6902 163.645 10.6572 163.532 10.6332 163.418C10.6252 163.369 10.6082 163.321 10.6002 163.272C10.5752 163.158 10.5512 163.053 10.5352 162.948C10.5192 162.899 10.5102 162.859 10.5022 162.818C10.4862 162.721 10.4702 162.623 10.4532 162.534C10.4452 162.494 10.4372 162.461 10.4372 162.421C10.4212 162.34 10.4052 162.259 10.3972 162.194C10.3892 162.153 10.3892 162.129 10.3812 162.097C10.3732 162.04 10.3652 161.975 10.3572 161.927C10.3572 161.895 10.3572 161.878 10.3492 161.846C10.3492 161.822 10.3412 161.789 10.3412 161.765C10.3332 161.724 10.3332 161.708 10.3332 161.708L9.79817 153.663L9.70117 152.171C10.0502 152.577 10.4152 152.974 10.8042 153.355C14.2672 156.794 18.7282 159.121 23.3182 160.686C29.8792 162.924 36.8302 163.784 43.5532 165.495C44.2412 165.673 45.0922 166.127 44.9312 166.816Z" fill="#A7FFFF"/><path opacity="0.33" d="M92.5788 152.6L92.4648 154.287L91.9778 161.708C91.9778 161.708 91.9778 161.724 91.9698 161.757C91.9698 161.773 91.9698 161.798 91.9618 161.822C91.9618 161.855 91.9618 161.871 91.9538 161.911C91.9458 161.944 91.9458 161.984 91.9378 162.033C91.9298 162.065 91.9298 162.106 91.9218 162.147C91.9138 162.204 91.9058 162.261 91.8898 162.325C91.8818 162.365 91.8738 162.414 91.8648 162.463C91.8568 162.536 91.8408 162.609 91.8248 162.69C91.8168 162.739 91.8088 162.787 91.8008 162.844C91.7838 162.933 91.7678 163.014 91.7438 163.112C91.7358 163.144 91.7278 163.185 91.7198 163.225C91.6788 163.428 91.6228 163.639 91.5658 163.858C91.5578 163.923 91.5408 163.98 91.5248 164.036C91.5008 164.133 91.4678 164.231 91.4358 164.336C91.4278 164.368 91.4198 164.409 91.4038 164.441C91.0388 164.701 90.6498 164.944 90.2518 165.155C87.6648 166.55 84.6718 166.972 81.7528 167.28C75.3218 167.945 68.8418 168.156 62.3778 167.896C60.7718 167.831 59.0768 167.71 57.7308 166.817C57.5608 166.128 58.4198 165.673 59.1098 165.495C65.8328 163.784 72.7838 162.924 79.3448 160.686C83.9278 159.121 88.3878 156.793 91.8588 153.355C92.1008 153.111 92.3438 152.86 92.5788 152.6Z" fill="#A7FFFF"/>`, milk:`<g opacity=".92"><path fill="url(#{U}lq)" d="M1.4,12.5 L100.9,12.5 L91.1,158 Q51.15,166.5 11.2,158 Z"/><path fill="url(#{U}dp)" d="M1.4,12.5 L100.9,12.5 L91.1,158 Q51.15,166.5 11.2,158 Z"/><path fill="#FFFFFF" opacity=".45" d="M9,20 L19,20 L25,154 L17,153 Z"/></g>`, surf:`<ellipse cx="51.15" cy="24" rx="49.7" ry="10.4" fill="#CDEEFF" stroke="#7FB9E0" stroke-width="0.9"/>`, front:`<path opacity="0.19" d="M97.0233 16.3901L89.4153 153.443C88.2153 155.26 86.4143 156.671 84.2573 157.384C80.5023 158.625 76.8043 159.614 73.1953 160.377L79.6433 20.8671C94.2813 20.3961 97.0233 16.3901 97.0233 16.3901Z" fill="#D7FFFF"/><path opacity="0.19" d="M29.012 160.052C26.247 159.436 23.724 158.763 21.47 158.081C20.415 157.765 19.418 157.448 18.485 157.132C18.079 156.994 17.69 156.832 17.317 156.645L7.12305 17.1694L12.411 18.4584L21.6 20.7054L29.012 160.052Z" fill="#D7FFFF"/><path opacity="0.19" d="M21.47 158.082C20.415 157.766 19.418 157.449 18.485 157.133C18.079 156.995 17.69 156.833 17.317 156.646L7.12305 17.1694L12.411 18.4584C12.906 23.7304 19.28 122.933 21.47 158.082Z" fill="#D7FFFF"/><path fill="none" d="M51.1532 0.405273C23.1322 0.405273 0.408203 5.41727 0.408203 11.5973C0.408203 11.7023 0.416205 11.8163 0.433205 11.9213L9.80021 153.661L10.3352 161.706C10.3352 161.706 10.8462 166.702 13.2462 168.251C13.4002 168.356 13.5622 168.446 13.7332 168.511C15.2412 169.119 35.5172 171.528 51.1532 171.22C66.7892 171.528 87.0732 169.119 88.5732 168.511C88.9792 168.349 89.3442 168.089 89.6602 167.765C91.5502 165.851 91.9792 161.707 91.9792 161.707L92.4662 154.286L101.874 11.9213C101.89 11.8163 101.898 11.7023 101.898 11.5973C101.898 5.41727 79.1822 0.405273 51.1532 0.405273Z" stroke="white" stroke-width="0.811" stroke-miterlimit="10"/><path fill="none" d="M101.897 11.5973C101.897 11.7023 101.889 11.8163 101.873 11.9213C101.102 17.9553 78.6943 22.7973 51.1523 22.7973C23.6183 22.7973 1.20225 17.9553 0.431252 11.9213C0.415252 11.8163 0.40625 11.7023 0.40625 11.5973C0.40625 5.41727 23.1312 0.405273 51.1512 0.405273C79.1812 0.405273 101.897 5.41727 101.897 11.5973Z" stroke="white" stroke-width="0.811" stroke-miterlimit="10"/>`, cork:"", defs:`<linearGradient id="{U}lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7CC4F0"/><stop offset=".35" stop-color="#B4E3FC"/><stop offset=".8" stop-color="#8ACDF5"/><stop offset="1" stop-color="#63AEE3"/></linearGradient><linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B4F8A" stop-opacity="0"/><stop offset=".55" stop-color="#0B4F8A" stop-opacity=".06"/><stop offset="1" stop-color="#0B4F8A" stop-opacity=".2"/></linearGradient>`,
    surfC:[51.15,24], yTop:12.5, yFill:24, yBot:162, xTop:[1.4,100.9], xBot:[11.2,91.1],
    lipR:[101.9,11.6], lipL:[0.4,11.6], mouth:[51.15,11.6] },
  jug: { vb:[69,84], shift:[0,0],
    back:`<g transform="matrix(-1 0 0 1 69 0)"><path d="M68.6841 29.2797C68.5881 31.4747 68.1811 33.6587 67.4841 35.7637C67.4081 35.9957 67.3271 36.2267 67.2441 36.4567C67.0821 36.9027 66.9061 37.3457 66.7151 37.7817C66.5031 38.2747 66.2741 38.7627 66.0271 39.2437C65.8931 39.5017 65.7571 39.7597 65.6151 40.0127C65.4721 40.2677 65.3271 40.5197 65.1741 40.7697C65.0231 41.0197 64.8671 41.2667 64.7061 41.5127C64.6261 41.6347 64.5451 41.7567 64.4621 41.8777L52.6751 59.1697L50.2011 62.7997L46.1621 60.0457L45.7671 59.7767L46.1851 59.1647L53.0251 49.1287L60.0281 38.8557C60.4351 38.2577 60.8071 37.6407 61.1421 37.0067C61.1781 36.9387 61.2151 36.8707 61.2491 36.8027C61.3591 36.5887 61.4651 36.3747 61.5651 36.1597C61.6071 36.0697 61.6481 35.9797 61.6891 35.8897C61.7391 35.7747 61.7901 35.6607 61.8391 35.5457C61.8681 35.4767 61.8961 35.4107 61.9241 35.3417C61.9481 35.2827 61.9731 35.2237 61.9961 35.1627C62.0271 35.0867 62.0571 35.0097 62.0851 34.9337C62.1251 34.8347 62.1631 34.7357 62.2001 34.6327C62.2261 34.5617 62.2521 34.4877 62.2791 34.4157C62.2981 34.3567 62.3191 34.2987 62.3391 34.2397C62.3671 34.1597 62.3941 34.0767 62.4201 33.9977C62.4521 33.8987 62.4831 33.7997 62.5131 33.7017C62.5331 33.6407 62.5511 33.5797 62.5691 33.5187C62.5931 33.4427 62.6141 33.3667 62.6351 33.2917C62.6651 33.1887 62.6921 33.0857 62.7191 32.9827C62.8971 32.3197 63.0351 31.6497 63.1361 30.9777C63.1491 30.8987 63.1611 30.8187 63.1711 30.7397C63.1981 30.5427 63.2221 30.3437 63.2421 30.1467C63.2541 30.0437 63.2621 29.9397 63.2731 29.8367C63.2811 29.7407 63.2891 29.6447 63.2961 29.5487C63.2971 29.5337 63.2981 29.5177 63.2981 29.5027C63.3051 29.4117 63.3111 29.3207 63.3151 29.2297C63.3171 29.2207 63.3171 29.2097 63.3181 29.2007C63.3331 28.9067 63.3411 28.6127 63.3411 28.3207C63.3431 27.9677 63.3331 27.6157 63.3121 27.2637C63.2001 25.3137 62.7191 22.7987 61.0691 21.8947C60.0121 21.3147 57.5431 20.8597 52.2061 23.2657C51.1531 23.7387 49.9911 24.3247 48.7051 25.0427L46.4611 21.0217L46.0911 20.3567C46.2231 20.2837 46.3541 20.2097 46.4851 20.1407C48.2781 19.1557 49.9621 18.3507 51.5381 17.7257C56.6331 15.6997 60.6261 15.5287 63.6511 17.1907C65.7501 18.3417 68.3231 20.9707 68.6701 26.9547C68.6801 27.1437 68.6891 27.3307 68.6941 27.5197C68.7051 27.8237 68.7091 28.1277 68.7071 28.4307C68.7051 28.7107 68.6971 28.9957 68.6841 29.2797Z" fill="#D5E6ED" /><path opacity="0.8" d="M47.8982 59.3725L61.2962 39.7175C63.8362 35.9915 65.0952 31.5365 64.8422 27.1715C64.6452 23.7735 63.6242 21.5435 61.8062 20.5465C61.0742 20.1435 60.1742 19.9265 59.1342 19.8995C56.6432 19.8335 53.3422 20.8655 49.3072 22.9715L48.1862 20.9625C52.6112 18.6505 56.3202 17.5185 59.2252 17.5955C60.6292 17.6325 61.8352 17.9385 62.9132 18.5305C65.4352 19.9145 66.8962 22.8565 67.1392 27.0385C67.4202 31.9065 66.0212 36.8695 63.1962 41.0135L49.7982 60.6685L47.8982 59.3725Z" fill="white" /><g opacity="0.3"> <path d="M53.1361 55.77C53.1181 56.459 53.0461 57.144 52.9221 57.821L52.8881 58.01L52.6751 59.168L50.2011 62.798L46.1621 60.044L45.7671 59.775L46.1851 59.163L53.0251 49.127L53.0411 49.951L53.0741 51.775L53.1371 55.149C53.1431 55.358 53.1421 55.564 53.1361 55.77Z" fill="black" /> </g><g opacity="0.5"> <path d="M68.6841 29.2798C68.6851 29.1468 68.6831 29.0148 68.6821 28.8808C68.6771 28.5308 68.6651 28.1818 68.6451 27.8328C68.2981 21.8488 65.7251 19.2198 63.6261 18.0678C60.6611 16.4398 56.7711 16.5708 51.8251 18.4808C50.2731 19.0788 48.6171 19.8518 46.8551 20.8028C46.7251 20.8738 46.5921 20.9448 46.4601 21.0178L46.0901 20.3528C46.2221 20.2798 46.3531 20.2058 46.4841 20.1368C48.2771 19.1518 49.9611 18.3468 51.5371 17.7218C56.6321 15.6958 60.6251 15.5248 63.6501 17.1868C65.7491 18.3378 68.3221 20.9668 68.6691 26.9508C68.6791 27.1398 68.6881 27.3268 68.6931 27.5158C68.7031 27.8298 68.7071 28.1448 68.7041 28.4598C68.7031 28.7328 68.6961 29.0068 68.6841 29.2798Z" fill="white" /> </g><g opacity="0.2"> <path d="M68.6841 29.2807C68.5881 31.4757 68.1811 33.6597 67.4841 35.7647C67.4081 35.9967 67.3271 36.2267 67.2441 36.4577C67.0821 36.9037 66.9061 37.3467 66.7151 37.7827C66.5041 38.2777 66.2741 38.7637 66.0271 39.2447C65.8961 39.5027 65.7581 39.7587 65.6151 40.0137C65.4721 40.2687 65.3271 40.5207 65.1741 40.7707C65.0231 41.0207 64.8691 41.2677 64.7061 41.5137C64.6261 41.6357 64.5451 41.7577 64.4621 41.8787L52.6751 59.1707L50.2011 62.8007L46.1621 60.0467L45.7671 59.7777L46.1851 59.1657L46.5801 59.4327L50.2241 61.9187L52.8881 58.0127L64.4851 40.9977C66.9571 37.3697 68.4061 33.1537 68.6821 28.8827C68.6901 28.7427 68.6991 28.6027 68.7031 28.4627C68.7051 28.4517 68.7051 28.4407 68.7061 28.4297C68.7051 28.7117 68.6971 28.9967 68.6841 29.2807Z" fill="black" /> </g><g opacity="0.3"> <path d="M48.7041 25.0397L46.4601 21.0186L46.0901 20.3537C46.2221 20.2807 46.3531 20.2066 46.4841 20.1376C48.2771 19.1526 49.9611 18.3477 51.5371 17.7227C51.5591 17.7597 51.5771 17.7986 51.5941 17.8376C51.6091 17.8666 51.6221 17.8976 51.6351 17.9286C51.6461 17.9556 51.6581 17.9817 51.6681 18.0097C51.7301 18.1617 51.7831 18.3197 51.8261 18.4817C51.8451 18.5527 51.8621 18.6267 51.8781 18.6987C51.8891 18.7507 51.9001 18.8007 51.9081 18.8517C51.9151 18.8897 51.9211 18.9267 51.9271 18.9657C51.9281 18.9787 51.9311 18.9917 51.9321 19.0047C51.9401 19.0557 51.9441 19.1076 51.9501 19.1586C51.9511 19.1756 51.9541 19.1927 51.9551 19.2097C51.9591 19.2457 51.9611 19.2787 51.9631 19.3147L52.1061 21.6337L52.1541 22.4156L52.2071 23.2646C51.1531 23.7356 49.9901 24.3227 48.7041 25.0397Z" fill="black" /> </g><path opacity="0.2" d="M64.326 27.5552C64.325 27.8672 64.317 28.1802 64.301 28.4922L64.3 28.5232C64.298 28.6142 64.287 28.7131 64.285 28.8121L64.284 28.8582C64.274 28.9572 64.271 29.0632 64.261 29.1622C64.25 29.2762 64.24 29.3822 64.229 29.4892C64.208 29.7022 64.18 29.9142 64.159 30.1202C64.142 30.2032 64.132 30.2872 64.122 30.3712C64.019 31.0852 63.878 31.7972 63.7 32.5012C63.674 32.6072 63.649 32.7212 63.615 32.8272C63.598 32.9032 63.573 32.9862 63.548 33.0692C63.531 33.1302 63.514 33.1982 63.489 33.2662C63.464 33.3642 63.43 33.4702 63.397 33.5762C63.372 33.6592 63.347 33.7502 63.314 33.8332C63.297 33.8942 63.272 33.9612 63.256 34.0222C63.231 34.0982 63.206 34.1732 63.181 34.2492C63.14 34.3622 63.099 34.4682 63.066 34.5662C63.033 34.6492 63.008 34.7322 62.976 34.8152C62.952 34.8752 62.927 34.9362 62.902 35.0032C62.87 35.0712 62.845 35.1462 62.812 35.2222C62.763 35.3432 62.714 35.4632 62.665 35.5842C62.624 35.6822 62.584 35.7722 62.543 35.8702C62.438 36.0962 62.333 36.3221 62.22 36.5471C62.187 36.6221 62.155 36.6982 62.115 36.7652C61.777 37.4422 61.409 38.0952 60.996 38.7322L53.978 49.6272L47.127 60.2752L46.929 60.5742L46.158 60.0512L45.761 59.7812L46.181 59.1672L53.024 49.1292L60.025 38.8592C60.429 38.2602 60.804 37.6381 61.141 37.0061C61.173 36.9381 61.213 36.8712 61.245 36.8032C61.357 36.5932 61.462 36.3742 61.559 36.1562C61.599 36.0732 61.64 35.9832 61.68 35.8922C61.737 35.7722 61.785 35.6582 61.834 35.5462C61.859 35.4782 61.891 35.4102 61.916 35.3422C61.94 35.2822 61.965 35.2212 61.989 35.1612C62.021 35.0862 62.054 35.0102 62.079 34.9352C62.12 34.8372 62.161 34.7312 62.194 34.6332C62.219 34.5572 62.243 34.4902 62.276 34.4142C62.293 34.3532 62.309 34.3012 62.334 34.2402C62.359 34.1572 62.392 34.0742 62.417 33.9982C62.45 33.9002 62.476 33.8012 62.509 33.7032C62.526 33.6352 62.543 33.5742 62.567 33.5142C62.592 33.4382 62.609 33.3632 62.634 33.2872C62.659 33.1892 62.685 33.0832 62.718 32.9842C62.896 32.3182 63.028 31.6512 63.13 30.9762C63.147 30.9002 63.157 30.8171 63.167 30.7411C63.195 30.5441 63.216 30.3462 63.236 30.1482C63.254 30.0422 63.257 29.9352 63.267 29.8362C63.277 29.7372 63.287 29.6461 63.29 29.5471L63.291 29.5012C63.301 29.4102 63.303 29.3182 63.313 29.2272L63.314 29.1972C63.329 28.9082 63.337 28.6112 63.337 28.3212C63.339 27.9632 63.325 27.6122 63.304 27.2612C63.196 25.3072 62.714 22.7952 61.061 21.8902C60.009 21.3132 57.537 20.8592 52.2 23.2632C51.151 23.7382 49.985 24.3252 48.701 25.0372L46.453 21.0152L46.09 20.3502C46.221 20.2772 46.353 20.2052 46.477 20.1392C46.779 19.9722 47.072 19.8122 47.366 19.6602L47.46 19.8452L49.694 24.1031C49.929 22.9111 51.971 22.4032 53.049 21.9412C57.203 20.1632 60.4 20.4082 61.458 21.0232C63.109 21.9742 64.19 24.3652 64.303 26.4332C64.323 26.8082 64.328 27.1822 64.326 27.5552Z" fill="black" /><path d="M52.14 62.3939L51.054 71.4959C51.033 71.6619 51.013 71.8169 50.992 71.9719C50.982 72.0029 50.982 72.0239 50.982 72.0439C50.972 72.0749 50.972 72.1059 50.961 72.1369C50.951 72.2509 50.93 72.3649 50.909 72.4779C50.899 72.5399 50.899 72.5919 50.878 72.6539C50.857 72.8299 50.826 72.9949 50.795 73.1609C50.764 73.3159 50.733 73.4709 50.702 73.6159C50.692 73.6569 50.681 73.6879 50.681 73.7189C50.64 73.8739 50.609 74.0289 50.567 74.1839C50.567 74.2049 50.557 74.2149 50.557 74.2359C50.516 74.3909 50.474 74.5569 50.433 74.7119C50.402 74.8459 50.36 74.9809 50.319 75.1149C50.319 75.1459 50.309 75.1769 50.298 75.2079C50.298 75.2179 50.288 75.2289 50.288 75.2489C50.278 75.2899 50.267 75.3209 50.247 75.3629C50.216 75.4869 50.175 75.6109 50.133 75.7349C50.102 75.8489 50.061 75.9729 50.019 76.0969C49.936 76.3349 49.843 76.5829 49.76 76.8209C49.667 77.0589 49.574 77.2969 49.47 77.5239C49.418 77.6379 49.377 77.7519 49.325 77.8649C49.284 77.9479 49.253 78.0299 49.211 78.1029C49.18 78.1859 49.139 78.2579 49.107 78.3299C49.086 78.3609 49.076 78.3919 49.066 78.4129C49.014 78.5269 48.952 78.6299 48.901 78.7439L48.891 78.7539C48.85 78.8469 48.798 78.9399 48.757 79.0329C48.426 79.6429 48.074 80.2219 47.692 80.7809C47.63 80.8739 47.568 80.9669 47.506 81.0499C47.434 81.1529 47.372 81.2359 47.299 81.3399C47.289 81.3399 47.289 81.3499 47.278 81.3609C47.226 81.4329 47.164 81.5059 47.113 81.5779C47.082 81.6189 47.051 81.6609 47.02 81.7019C46.968 81.7639 46.916 81.8259 46.865 81.8989H46.855C46.834 81.9199 46.814 81.9399 46.803 81.9609C46.741 82.0329 46.689 82.1059 46.627 82.1779C46.544 82.2609 46.472 82.3539 46.389 82.4369C46.368 82.4679 46.348 82.4889 46.317 82.5199C45.748 83.1409 45.024 83.4919 44.279 83.4919H12.494C11.977 83.4919 11.46 83.3159 10.994 82.9849C10.704 82.7879 10.436 82.6019 10.177 82.4259C10.167 82.4259 10.167 82.4159 10.156 82.4159C10.146 82.4059 10.146 82.4059 10.146 82.4059H10.136C10.126 82.3959 10.115 82.3849 10.105 82.3749C10.084 82.3649 10.064 82.3539 10.053 82.3439L10.043 82.3339C10.022 82.3339 10.012 82.3239 10.002 82.3129C9.971 82.2919 9.95 82.2719 9.93 82.2609C9.878 82.2299 9.83701 82.1989 9.79601 82.1679C9.76501 82.1469 9.734 82.1269 9.703 82.1059C9.693 82.0959 9.682 82.0849 9.672 82.0749C9.651 82.0649 9.641 82.0539 9.62 82.0439C9.589 82.0229 9.548 81.9919 9.506 81.9719C9.496 81.9619 9.485 81.9509 9.485 81.9409C9.475 81.9409 9.464 81.9309 9.454 81.9309C9.299 81.8279 9.164 81.7139 9.02 81.6099L8.999 81.5889H8.989C8.979 81.5789 8.968 81.5679 8.958 81.5579C8.917 81.5269 8.886 81.4959 8.854 81.4749C8.74 81.3919 8.637 81.2989 8.544 81.2159C8.523 81.2059 8.513 81.1849 8.503 81.1749C8.441 81.1229 8.379 81.0719 8.317 81.0099C8.317 81.0099 8.30701 80.9999 8.29601 80.9999C8.24401 80.9479 8.193 80.8959 8.141 80.8449C8.017 80.7209 7.903 80.5969 7.779 80.4519C7.769 80.4419 7.748 80.4209 7.738 80.3999C7.728 80.3999 7.728 80.3999 7.728 80.3899C7.718 80.3799 7.707 80.3689 7.697 80.3489C7.687 80.3389 7.676 80.3389 7.666 80.3279C7.645 80.2969 7.625 80.2659 7.604 80.2349C7.573 80.2039 7.542 80.1629 7.511 80.1209L7.44901 80.0589C7.39701 79.9759 7.335 79.9039 7.283 79.8209C7.242 79.7689 7.211 79.7169 7.169 79.6659C7.138 79.6139 7.107 79.5729 7.076 79.5209C7.045 79.4689 7.014 79.4279 6.983 79.3759C6.973 79.3549 6.962 79.3449 6.952 79.3239C6.848 79.1579 6.755 78.9929 6.652 78.8169C6.631 78.7649 6.611 78.7239 6.58 78.6829C6.487 78.4969 6.383 78.2999 6.29 78.1039C6.135 77.7729 5.98 77.4109 5.814 77.0179C5.783 76.9249 5.742 76.8209 5.7 76.7279C5.669 76.6349 5.638 76.5519 5.607 76.4689C5.566 76.3759 5.53501 76.2829 5.50401 76.1899C5.41101 75.9209 5.307 75.6419 5.204 75.3519C4.832 74.2239 4.449 72.9009 4.035 71.3079C1.491 61.4199 5.069 40.2889 5.069 40.2889C5.276 38.9439 5.462 37.6409 5.617 36.3899C5.638 36.2139 5.658 36.0379 5.679 35.8729C5.741 35.3559 5.803 34.8489 5.855 34.3529C5.855 34.3119 5.86501 34.2599 5.86501 34.2189C5.90601 33.8979 5.937 33.5779 5.969 33.2569C6.031 32.6359 6.083 32.0359 6.124 31.4369C6.155 31.0959 6.176 30.7439 6.207 30.4029C6.228 29.9889 6.259 29.5759 6.279 29.1719C6.31 28.6649 6.33101 28.1689 6.35101 27.6929V27.5789C6.36101 27.2579 6.372 26.9479 6.382 26.6379C6.382 26.5349 6.392 26.4309 6.392 26.3379C6.402 25.7069 6.413 25.0969 6.413 24.5069C6.413 24.2789 6.403 24.0619 6.403 23.8349C6.403 23.4629 6.393 23.0899 6.382 22.7179C6.361 21.9839 6.33 21.2799 6.289 20.5979C6.268 20.2569 6.24801 19.9259 6.22701 19.5949C6.21701 19.5639 6.217 19.5229 6.217 19.4809C6.207 19.3049 6.186 19.1289 6.176 18.9539V18.9439C6.155 18.7789 6.145 18.6129 6.124 18.4579C6.072 17.9719 6.021 17.4959 5.969 17.0309C5.886 16.4209 5.803 15.8309 5.7 15.2729C5.669 15.0659 5.638 14.8699 5.597 14.6729C5.576 14.5799 5.566 14.4869 5.545 14.3829C5.504 14.1969 5.473 13.9999 5.431 13.8139C5.39 13.6279 5.348 13.4519 5.317 13.2659C5.296 13.1829 5.276 13.0899 5.255 12.9969C5.183 12.7179 5.12 12.4379 5.048 12.1699C4.976 11.9009 4.914 11.6429 4.841 11.3839C4.8 11.2599 4.76801 11.1359 4.72701 11.0119C4.67501 10.8259 4.613 10.6399 4.562 10.4639C4.5 10.2879 4.448 10.1119 4.386 9.94692C4.314 9.71892 4.231 9.50192 4.148 9.28492C4.034 8.96392 3.91 8.65392 3.786 8.36392C3.548 7.78492 3.3 7.25692 3.041 6.78192C2.969 6.62692 2.886 6.48192 2.803 6.33692C2.637 6.03692 2.472 5.76792 2.317 5.51992C2.193 5.33392 2.079 5.15791 1.965 4.99291C1.386 4.18591 0.868998 3.64792 0.516998 3.33792C0.351998 3.18292 0.227003 2.99692 0.134003 2.77892C0.0510027 2.55092 0 2.30292 0 2.04492C0 1.42392 0.289999 0.854928 0.723999 0.606928L0.796005 0.575922C1.60301 0.110922 2.48201 -0.0650821 3.35101 0.0279179L12.857 1.13493L14.698 1.35192L16.27 1.52792L41.859 4.50692L46.131 5.00292C46.214 5.01292 46.286 5.02391 46.358 5.03391C46.42 5.05491 46.493 5.06491 46.555 5.07491C46.648 5.10591 46.731 5.12692 46.824 5.15792C46.876 5.17892 46.938 5.19892 46.989 5.21992C47.031 5.22992 47.082 5.25092 47.124 5.27192C47.155 5.29292 47.196 5.30292 47.228 5.32392C47.269 5.34492 47.311 5.36492 47.362 5.38592C47.372 5.39592 47.383 5.39592 47.393 5.40692C47.403 5.40692 47.414 5.41693 47.424 5.41693C47.424 5.42693 47.434 5.42692 47.445 5.43792C47.466 5.44792 47.486 5.45893 47.507 5.46893C47.538 5.47893 47.559 5.49993 47.579 5.50993C47.589 5.51993 47.6 5.51992 47.61 5.53092C47.641 5.55192 47.672 5.57192 47.703 5.59292C47.734 5.61392 47.765 5.63392 47.796 5.65492C47.889 5.71692 47.972 5.77892 48.065 5.85192C48.086 5.87292 48.117 5.89292 48.137 5.91392L48.168 5.94493C48.189 5.95493 48.199 5.96592 48.209 5.97592L48.302 6.06892C48.333 6.09992 48.364 6.12093 48.385 6.15193C48.468 6.23493 48.55 6.31692 48.633 6.40992C48.664 6.45192 48.695 6.49291 48.737 6.53391C48.768 6.57491 48.809 6.62692 48.84 6.66792C48.85 6.68892 48.871 6.69892 48.881 6.71992C48.922 6.77192 48.953 6.82292 48.995 6.87492C49.047 6.94692 49.088 7.01991 49.14 7.10291C49.347 7.43391 49.523 7.79592 49.657 8.17892C49.678 8.21992 49.688 8.26193 49.698 8.30293C49.719 8.33393 49.729 8.37493 49.739 8.41693C49.842 8.70693 49.915 9.01692 49.977 9.33792C49.987 9.40992 49.998 9.47292 50.008 9.54492C50.018 9.59692 50.029 9.64791 50.039 9.69991V9.75192C50.049 9.78292 50.049 9.82492 50.049 9.85592C50.059 9.89692 50.059 9.92792 50.059 9.95892C50.069 10.0309 50.08 10.1039 50.08 10.1759L51.156 26.1459L51.166 26.3429L52.283 58.7689C52.337 59.9739 52.285 61.1949 52.14 62.3939Z" fill="#D5E6ED" /></g>`, milk:`<g transform="matrix(-1 0 0 1 69 0)"><path d="M52.14 62.3939L51.054 71.4959C51.033 71.6619 51.013 71.8169 50.992 71.9719C50.982 72.0029 50.982 72.0239 50.982 72.0439C50.972 72.0749 50.972 72.1059 50.961 72.1369C50.951 72.2509 50.93 72.3649 50.909 72.4779C50.899 72.5399 50.899 72.5919 50.878 72.6539C50.857 72.8299 50.826 72.9949 50.795 73.1609C50.764 73.3159 50.733 73.4709 50.702 73.6159C50.692 73.6569 50.681 73.6879 50.681 73.7189C50.64 73.8739 50.609 74.0289 50.567 74.1839C50.567 74.2049 50.557 74.2149 50.557 74.2359C50.516 74.3909 50.474 74.5569 50.433 74.7119C50.402 74.8459 50.36 74.9809 50.319 75.1149C50.319 75.1459 50.309 75.1769 50.298 75.2079C50.298 75.2179 50.288 75.2289 50.288 75.2489C50.278 75.2899 50.267 75.3209 50.247 75.3629C50.216 75.4869 50.175 75.6109 50.133 75.7349C50.102 75.8489 50.061 75.9729 50.019 76.0969C49.936 76.3349 49.843 76.5829 49.76 76.8209C49.667 77.0589 49.574 77.2969 49.47 77.5239C49.418 77.6379 49.377 77.7519 49.325 77.8649C49.284 77.9479 49.253 78.0299 49.211 78.1029C49.18 78.1859 49.139 78.2579 49.107 78.3299C49.086 78.3609 49.076 78.3919 49.066 78.4129C49.014 78.5269 48.952 78.6299 48.901 78.7439L48.891 78.7539C48.85 78.8469 48.798 78.9399 48.757 79.0329C48.426 79.6429 48.074 80.2219 47.692 80.7809C47.63 80.8739 47.568 80.9669 47.506 81.0499C47.434 81.1529 47.372 81.2359 47.299 81.3399C47.289 81.3399 47.289 81.3499 47.278 81.3609C47.226 81.4329 47.164 81.5059 47.113 81.5779C47.082 81.6189 47.051 81.6609 47.02 81.7019C46.968 81.7639 46.916 81.8259 46.865 81.8989H46.855C46.834 81.9199 46.814 81.9399 46.803 81.9609C46.741 82.0329 46.689 82.1059 46.627 82.1779C46.544 82.2609 46.472 82.3539 46.389 82.4369C46.368 82.4679 46.348 82.4889 46.317 82.5199C45.748 83.1409 45.024 83.4919 44.279 83.4919H12.494C11.977 83.4919 11.46 83.3159 10.994 82.9849C10.704 82.7879 10.436 82.6019 10.177 82.4259C10.167 82.4259 10.167 82.4159 10.156 82.4159C10.146 82.4059 10.146 82.4059 10.146 82.4059H10.136C10.126 82.3959 10.115 82.3849 10.105 82.3749C10.084 82.3649 10.064 82.3539 10.053 82.3439L10.043 82.3339C10.022 82.3339 10.012 82.3239 10.002 82.3129C9.971 82.2919 9.95 82.2719 9.93 82.2609C9.878 82.2299 9.83701 82.1989 9.79601 82.1679C9.76501 82.1469 9.734 82.1269 9.703 82.1059C9.693 82.0959 9.682 82.0849 9.672 82.0749C9.651 82.0649 9.641 82.0539 9.62 82.0439C9.589 82.0229 9.548 81.9919 9.506 81.9719C9.496 81.9619 9.485 81.9509 9.485 81.9409C9.475 81.9409 9.464 81.9309 9.454 81.9309C9.299 81.8279 9.164 81.7139 9.02 81.6099L8.999 81.5889H8.989C8.979 81.5789 8.968 81.5679 8.958 81.5579C8.917 81.5269 8.886 81.4959 8.854 81.4749C8.74 81.3919 8.637 81.2989 8.544 81.2159C8.523 81.2059 8.513 81.1849 8.503 81.1749C8.441 81.1229 8.379 81.0719 8.317 81.0099C8.317 81.0099 8.30701 80.9999 8.29601 80.9999C8.24401 80.9479 8.193 80.8959 8.141 80.8449C8.017 80.7209 7.903 80.5969 7.779 80.4519C7.769 80.4419 7.748 80.4209 7.738 80.3999C7.728 80.3999 7.728 80.3999 7.728 80.3899C7.718 80.3799 7.707 80.3689 7.697 80.3489C7.687 80.3389 7.676 80.3389 7.666 80.3279C7.645 80.2969 7.625 80.2659 7.604 80.2349C7.573 80.2039 7.542 80.1629 7.511 80.1209L7.44901 80.0589C7.39701 79.9759 7.335 79.9039 7.283 79.8209C7.242 79.7689 7.211 79.7169 7.169 79.6659C7.138 79.6139 7.107 79.5729 7.076 79.5209C7.045 79.4689 7.014 79.4279 6.983 79.3759C6.973 79.3549 6.962 79.3449 6.952 79.3239C6.848 79.1579 6.755 78.9929 6.652 78.8169C6.631 78.7649 6.611 78.7239 6.58 78.6829C6.487 78.4969 6.383 78.2999 6.29 78.1039C6.135 77.7729 5.98 77.4109 5.814 77.0179C5.783 76.9249 5.742 76.8209 5.7 76.7279C5.669 76.6349 5.638 76.5519 5.607 76.4689C5.566 76.3759 5.53501 76.2829 5.50401 76.1899C5.41101 75.9209 5.307 75.6419 5.204 75.3519C4.832 74.2239 4.449 72.9009 4.035 71.3079C1.491 61.4199 5.069 40.2889 5.069 40.2889C5.276 38.9439 5.462 37.6409 5.617 36.3899C5.638 36.2139 5.658 36.0379 5.679 35.8729C5.741 35.3559 5.803 34.8489 5.855 34.3529C5.855 34.3119 5.86501 34.2599 5.86501 34.2189C5.90601 33.8979 5.937 33.5779 5.969 33.2569C6.031 32.6359 6.083 32.0359 6.124 31.4369C6.155 31.0959 6.176 30.7439 6.207 30.4029C6.228 29.9889 6.259 29.5759 6.279 29.1719C6.31 28.6649 6.33101 28.1689 6.35101 27.6929V27.5789C6.36101 27.2579 6.372 26.9479 6.382 26.6379C6.382 26.5349 6.392 26.4309 6.392 26.3379C6.402 25.7069 6.413 25.0969 6.413 24.5069C6.413 24.2789 6.403 24.0619 6.403 23.8349C6.403 23.4629 6.393 23.0899 6.382 22.7179C6.361 21.9839 6.33 21.2799 6.289 20.5979C6.268 20.2569 6.24801 19.9259 6.22701 19.5949C6.21701 19.5639 6.217 19.5229 6.217 19.4809C6.207 19.3049 6.186 19.1289 6.176 18.9539V18.9439C6.155 18.7789 6.145 18.6129 6.124 18.4579C6.072 17.9719 6.021 17.4959 5.969 17.0309C5.886 16.4209 5.803 15.8309 5.7 15.2729C5.669 15.0659 5.638 14.8699 5.597 14.6729C5.576 14.5799 5.566 14.4869 5.545 14.3829C5.504 14.1969 5.473 13.9999 5.431 13.8139C5.39 13.6279 5.348 13.4519 5.317 13.2659C5.296 13.1829 5.276 13.0899 5.255 12.9969C5.183 12.7179 5.12 12.4379 5.048 12.1699C4.976 11.9009 4.914 11.6429 4.841 11.3839C4.8 11.2599 4.76801 11.1359 4.72701 11.0119C4.67501 10.8259 4.613 10.6399 4.562 10.4639C4.5 10.2879 4.448 10.1119 4.386 9.94692C4.314 9.71892 4.231 9.50192 4.148 9.28492C4.034 8.96392 3.91 8.65392 3.786 8.36392C3.548 7.78492 3.3 7.25692 3.041 6.78192C2.969 6.62692 2.886 6.48192 2.803 6.33692C2.637 6.03692 2.472 5.76792 2.317 5.51992C2.193 5.33392 2.079 5.15791 1.965 4.99291C1.386 4.18591 0.868998 3.64792 0.516998 3.33792C0.351998 3.18292 0.227003 2.99692 0.134003 2.77892C0.0510027 2.55092 0 2.30292 0 2.04492C0 1.42392 0.289999 0.854928 0.723999 0.606928L0.796005 0.575922C1.60301 0.110922 2.48201 -0.0650821 3.35101 0.0279179L12.857 1.13493L14.698 1.35192L16.27 1.52792L41.859 4.50692L46.131 5.00292C46.214 5.01292 46.286 5.02391 46.358 5.03391C46.42 5.05491 46.493 5.06491 46.555 5.07491C46.648 5.10591 46.731 5.12692 46.824 5.15792C46.876 5.17892 46.938 5.19892 46.989 5.21992C47.031 5.22992 47.082 5.25092 47.124 5.27192C47.155 5.29292 47.196 5.30292 47.228 5.32392C47.269 5.34492 47.311 5.36492 47.362 5.38592C47.372 5.39592 47.383 5.39592 47.393 5.40692C47.403 5.40692 47.414 5.41693 47.424 5.41693C47.424 5.42693 47.434 5.42692 47.445 5.43792C47.466 5.44792 47.486 5.45893 47.507 5.46893C47.538 5.47893 47.559 5.49993 47.579 5.50993C47.589 5.51993 47.6 5.51992 47.61 5.53092C47.641 5.55192 47.672 5.57192 47.703 5.59292C47.734 5.61392 47.765 5.63392 47.796 5.65492C47.889 5.71692 47.972 5.77892 48.065 5.85192C48.086 5.87292 48.117 5.89292 48.137 5.91392L48.168 5.94493C48.189 5.95493 48.199 5.96592 48.209 5.97592L48.302 6.06892C48.333 6.09992 48.364 6.12093 48.385 6.15193C48.468 6.23493 48.55 6.31692 48.633 6.40992C48.664 6.45192 48.695 6.49291 48.737 6.53391C48.768 6.57491 48.809 6.62692 48.84 6.66792C48.85 6.68892 48.871 6.69892 48.881 6.71992C48.922 6.77192 48.953 6.82292 48.995 6.87492C49.047 6.94692 49.088 7.01991 49.14 7.10291C49.347 7.43391 49.523 7.79592 49.657 8.17892C49.678 8.21992 49.688 8.26193 49.698 8.30293C49.719 8.33393 49.729 8.37493 49.739 8.41693C49.842 8.70693 49.915 9.01692 49.977 9.33792C49.987 9.40992 49.998 9.47292 50.008 9.54492C50.018 9.59692 50.029 9.64791 50.039 9.69991V9.75192C50.049 9.78292 50.049 9.82492 50.049 9.85592C50.059 9.89692 50.059 9.92792 50.059 9.95892C50.069 10.0309 50.08 10.1039 50.08 10.1759L51.156 26.1459L51.166 26.3429L52.283 58.7689C52.337 59.9739 52.285 61.1949 52.14 62.3939Z" fill="url(#{U}lq)" /><path d="M52.14 62.3939L51.054 71.4959C51.033 71.6619 51.013 71.8169 50.992 71.9719C50.982 72.0029 50.982 72.0239 50.982 72.0439C50.972 72.0749 50.972 72.1059 50.961 72.1369C50.951 72.2509 50.93 72.3649 50.909 72.4779C50.899 72.5399 50.899 72.5919 50.878 72.6539C50.857 72.8299 50.826 72.9949 50.795 73.1609C50.764 73.3159 50.733 73.4709 50.702 73.6159C50.692 73.6569 50.681 73.6879 50.681 73.7189C50.64 73.8739 50.609 74.0289 50.567 74.1839C50.567 74.2049 50.557 74.2149 50.557 74.2359C50.516 74.3909 50.474 74.5569 50.433 74.7119C50.402 74.8459 50.36 74.9809 50.319 75.1149C50.319 75.1459 50.309 75.1769 50.298 75.2079C50.298 75.2179 50.288 75.2289 50.288 75.2489C50.278 75.2899 50.267 75.3209 50.247 75.3629C50.216 75.4869 50.175 75.6109 50.133 75.7349C50.102 75.8489 50.061 75.9729 50.019 76.0969C49.936 76.3349 49.843 76.5829 49.76 76.8209C49.667 77.0589 49.574 77.2969 49.47 77.5239C49.418 77.6379 49.377 77.7519 49.325 77.8649C49.284 77.9479 49.253 78.0299 49.211 78.1029C49.18 78.1859 49.139 78.2579 49.107 78.3299C49.086 78.3609 49.076 78.3919 49.066 78.4129C49.014 78.5269 48.952 78.6299 48.901 78.7439L48.891 78.7539C48.85 78.8469 48.798 78.9399 48.757 79.0329C48.426 79.6429 48.074 80.2219 47.692 80.7809C47.63 80.8739 47.568 80.9669 47.506 81.0499C47.434 81.1529 47.372 81.2359 47.299 81.3399C47.289 81.3399 47.289 81.3499 47.278 81.3609C47.226 81.4329 47.164 81.5059 47.113 81.5779C47.082 81.6189 47.051 81.6609 47.02 81.7019C46.968 81.7639 46.916 81.8259 46.865 81.8989H46.855C46.834 81.9199 46.814 81.9399 46.803 81.9609C46.741 82.0329 46.689 82.1059 46.627 82.1779C46.544 82.2609 46.472 82.3539 46.389 82.4369C46.368 82.4679 46.348 82.4889 46.317 82.5199C45.748 83.1409 45.024 83.4919 44.279 83.4919H12.494C11.977 83.4919 11.46 83.3159 10.994 82.9849C10.704 82.7879 10.436 82.6019 10.177 82.4259C10.167 82.4259 10.167 82.4159 10.156 82.4159C10.146 82.4059 10.146 82.4059 10.146 82.4059H10.136C10.126 82.3959 10.115 82.3849 10.105 82.3749C10.084 82.3649 10.064 82.3539 10.053 82.3439L10.043 82.3339C10.022 82.3339 10.012 82.3239 10.002 82.3129C9.971 82.2919 9.95 82.2719 9.93 82.2609C9.878 82.2299 9.83701 82.1989 9.79601 82.1679C9.76501 82.1469 9.734 82.1269 9.703 82.1059C9.693 82.0959 9.682 82.0849 9.672 82.0749C9.651 82.0649 9.641 82.0539 9.62 82.0439C9.589 82.0229 9.548 81.9919 9.506 81.9719C9.496 81.9619 9.485 81.9509 9.485 81.9409C9.475 81.9409 9.464 81.9309 9.454 81.9309C9.299 81.8279 9.164 81.7139 9.02 81.6099L8.999 81.5889H8.989C8.979 81.5789 8.968 81.5679 8.958 81.5579C8.917 81.5269 8.886 81.4959 8.854 81.4749C8.74 81.3919 8.637 81.2989 8.544 81.2159C8.523 81.2059 8.513 81.1849 8.503 81.1749C8.441 81.1229 8.379 81.0719 8.317 81.0099C8.317 81.0099 8.30701 80.9999 8.29601 80.9999C8.24401 80.9479 8.193 80.8959 8.141 80.8449C8.017 80.7209 7.903 80.5969 7.779 80.4519C7.769 80.4419 7.748 80.4209 7.738 80.3999C7.728 80.3999 7.728 80.3999 7.728 80.3899C7.718 80.3799 7.707 80.3689 7.697 80.3489C7.687 80.3389 7.676 80.3389 7.666 80.3279C7.645 80.2969 7.625 80.2659 7.604 80.2349C7.573 80.2039 7.542 80.1629 7.511 80.1209L7.44901 80.0589C7.39701 79.9759 7.335 79.9039 7.283 79.8209C7.242 79.7689 7.211 79.7169 7.169 79.6659C7.138 79.6139 7.107 79.5729 7.076 79.5209C7.045 79.4689 7.014 79.4279 6.983 79.3759C6.973 79.3549 6.962 79.3449 6.952 79.3239C6.848 79.1579 6.755 78.9929 6.652 78.8169C6.631 78.7649 6.611 78.7239 6.58 78.6829C6.487 78.4969 6.383 78.2999 6.29 78.1039C6.135 77.7729 5.98 77.4109 5.814 77.0179C5.783 76.9249 5.742 76.8209 5.7 76.7279C5.669 76.6349 5.638 76.5519 5.607 76.4689C5.566 76.3759 5.53501 76.2829 5.50401 76.1899C5.41101 75.9209 5.307 75.6419 5.204 75.3519C4.832 74.2239 4.449 72.9009 4.035 71.3079C1.491 61.4199 5.069 40.2889 5.069 40.2889C5.276 38.9439 5.462 37.6409 5.617 36.3899C5.638 36.2139 5.658 36.0379 5.679 35.8729C5.741 35.3559 5.803 34.8489 5.855 34.3529C5.855 34.3119 5.86501 34.2599 5.86501 34.2189C5.90601 33.8979 5.937 33.5779 5.969 33.2569C6.031 32.6359 6.083 32.0359 6.124 31.4369C6.155 31.0959 6.176 30.7439 6.207 30.4029C6.228 29.9889 6.259 29.5759 6.279 29.1719C6.31 28.6649 6.33101 28.1689 6.35101 27.6929V27.5789C6.36101 27.2579 6.372 26.9479 6.382 26.6379C6.382 26.5349 6.392 26.4309 6.392 26.3379C6.402 25.7069 6.413 25.0969 6.413 24.5069C6.413 24.2789 6.403 24.0619 6.403 23.8349C6.403 23.4629 6.393 23.0899 6.382 22.7179C6.361 21.9839 6.33 21.2799 6.289 20.5979C6.268 20.2569 6.24801 19.9259 6.22701 19.5949C6.21701 19.5639 6.217 19.5229 6.217 19.4809C6.207 19.3049 6.186 19.1289 6.176 18.9539V18.9439C6.155 18.7789 6.145 18.6129 6.124 18.4579C6.072 17.9719 6.021 17.4959 5.969 17.0309C5.886 16.4209 5.803 15.8309 5.7 15.2729C5.669 15.0659 5.638 14.8699 5.597 14.6729C5.576 14.5799 5.566 14.4869 5.545 14.3829C5.504 14.1969 5.473 13.9999 5.431 13.8139C5.39 13.6279 5.348 13.4519 5.317 13.2659C5.296 13.1829 5.276 13.0899 5.255 12.9969C5.183 12.7179 5.12 12.4379 5.048 12.1699C4.976 11.9009 4.914 11.6429 4.841 11.3839C4.8 11.2599 4.76801 11.1359 4.72701 11.0119C4.67501 10.8259 4.613 10.6399 4.562 10.4639C4.5 10.2879 4.448 10.1119 4.386 9.94692C4.314 9.71892 4.231 9.50192 4.148 9.28492C4.034 8.96392 3.91 8.65392 3.786 8.36392C3.548 7.78492 3.3 7.25692 3.041 6.78192C2.969 6.62692 2.886 6.48192 2.803 6.33692C2.637 6.03692 2.472 5.76792 2.317 5.51992C2.193 5.33392 2.079 5.15791 1.965 4.99291C1.386 4.18591 0.868998 3.64792 0.516998 3.33792C0.351998 3.18292 0.227003 2.99692 0.134003 2.77892C0.0510027 2.55092 0 2.30292 0 2.04492C0 1.42392 0.289999 0.854928 0.723999 0.606928L0.796005 0.575922C1.60301 0.110922 2.48201 -0.0650821 3.35101 0.0279179L12.857 1.13493L14.698 1.35192L16.27 1.52792L41.859 4.50692L46.131 5.00292C46.214 5.01292 46.286 5.02391 46.358 5.03391C46.42 5.05491 46.493 5.06491 46.555 5.07491C46.648 5.10591 46.731 5.12692 46.824 5.15792C46.876 5.17892 46.938 5.19892 46.989 5.21992C47.031 5.22992 47.082 5.25092 47.124 5.27192C47.155 5.29292 47.196 5.30292 47.228 5.32392C47.269 5.34492 47.311 5.36492 47.362 5.38592C47.372 5.39592 47.383 5.39592 47.393 5.40692C47.403 5.40692 47.414 5.41693 47.424 5.41693C47.424 5.42693 47.434 5.42692 47.445 5.43792C47.466 5.44792 47.486 5.45893 47.507 5.46893C47.538 5.47893 47.559 5.49993 47.579 5.50993C47.589 5.51993 47.6 5.51992 47.61 5.53092C47.641 5.55192 47.672 5.57192 47.703 5.59292C47.734 5.61392 47.765 5.63392 47.796 5.65492C47.889 5.71692 47.972 5.77892 48.065 5.85192C48.086 5.87292 48.117 5.89292 48.137 5.91392L48.168 5.94493C48.189 5.95493 48.199 5.96592 48.209 5.97592L48.302 6.06892C48.333 6.09992 48.364 6.12093 48.385 6.15193C48.468 6.23493 48.55 6.31692 48.633 6.40992C48.664 6.45192 48.695 6.49291 48.737 6.53391C48.768 6.57491 48.809 6.62692 48.84 6.66792C48.85 6.68892 48.871 6.69892 48.881 6.71992C48.922 6.77192 48.953 6.82292 48.995 6.87492C49.047 6.94692 49.088 7.01991 49.14 7.10291C49.347 7.43391 49.523 7.79592 49.657 8.17892C49.678 8.21992 49.688 8.26193 49.698 8.30293C49.719 8.33393 49.729 8.37493 49.739 8.41693C49.842 8.70693 49.915 9.01692 49.977 9.33792C49.987 9.40992 49.998 9.47292 50.008 9.54492C50.018 9.59692 50.029 9.64791 50.039 9.69991V9.75192C50.049 9.78292 50.049 9.82492 50.049 9.85592C50.059 9.89692 50.059 9.92792 50.059 9.95892C50.069 10.0309 50.08 10.1039 50.08 10.1759L51.156 26.1459L51.166 26.3429L52.283 58.7689C52.337 59.9739 52.285 61.1949 52.14 62.3939Z" fill="url(#{U}dp)" /></g>`, surf:`<ellipse cx="41.5" cy="26.2" rx="23.4" ry="1.3" fill="#CDEEFF" opacity=".9"/>`, front:`<g transform="matrix(-1 0 0 1 69 0)"><g opacity="0.12"> <path d="M52.1391 62.3974L51.0521 71.5014C51.0311 71.6844 51.0071 71.8674 50.9791 72.0484C50.9741 72.0804 50.9691 72.1103 50.9641 72.1423C50.9481 72.2543 50.9311 72.3674 50.9131 72.4774C50.9031 72.5384 50.8931 72.5983 50.8821 72.6593V72.6654C50.8571 72.8084 50.8311 72.9514 50.8041 73.0924C50.7991 73.1154 50.7961 73.1394 50.7911 73.1624C50.7801 73.2174 50.7691 73.2694 50.7591 73.3244C50.7111 73.5604 50.6601 73.7964 50.6051 74.0294C50.5921 74.0824 50.5821 74.1364 50.5681 74.1894C50.5651 74.2034 50.5601 74.2214 50.5571 74.2364C50.5531 74.2514 50.5491 74.2654 50.5461 74.2794C50.5171 74.3944 50.4881 74.5084 50.4571 74.6234C50.4491 74.6524 50.4421 74.6804 50.4351 74.7104C50.3991 74.8474 50.3621 74.9833 50.3221 75.1183C50.3141 75.1493 50.3041 75.1784 50.2971 75.2104C50.2931 75.2234 50.2911 75.2344 50.2861 75.2494C50.2381 75.4124 50.1891 75.5734 50.1361 75.7344C50.0971 75.8574 50.0561 75.9814 50.0141 76.1004C49.9331 76.3424 49.8461 76.5834 49.7541 76.8204C49.6641 77.0604 49.5681 77.2983 49.4681 77.5323C49.4201 77.6453 49.3711 77.7584 49.3191 77.8694C49.2841 77.9494 49.2481 78.0294 49.2101 78.1094C49.1751 78.1874 49.1401 78.2633 49.1021 78.3383C49.0901 78.3653 49.0781 78.3914 49.0621 78.4184C49.0111 78.5294 48.9561 78.6374 48.8991 78.7454L48.8941 78.7584C48.8471 78.8524 48.7991 78.9444 48.7501 79.0354C48.4281 79.6464 48.0761 80.2284 47.6951 80.7834C47.6311 80.8764 47.5671 80.9673 47.5021 81.0583C47.4331 81.1533 47.3651 81.2463 47.2941 81.3403C47.2891 81.3483 47.2831 81.3544 47.2781 81.3634C47.2211 81.4384 47.1651 81.5133 47.1081 81.5863C47.0781 81.6253 47.0471 81.6664 47.0161 81.7034C46.9631 81.7694 46.9111 81.8344 46.8591 81.9004C46.8591 81.9004 46.8541 81.9054 46.8521 81.9064C46.8341 81.9284 46.8171 81.9484 46.7991 81.9684C46.7421 82.0394 46.6831 82.1084 46.6241 82.1774C46.5471 82.2674 46.4691 82.3544 46.3921 82.4414C46.3671 82.4684 46.3421 82.4944 46.3181 82.5224C45.7471 83.1454 45.0271 83.4904 44.2811 83.4904H12.4981C11.9731 83.4904 11.4551 83.3174 10.9921 82.9924C10.7081 82.7924 10.4391 82.6093 10.1791 82.4353C10.1691 82.4293 10.1601 82.4224 10.1521 82.4164C10.1481 82.4154 10.1451 82.4124 10.1451 82.4124L10.1401 82.4084C10.1261 82.3964 10.1131 82.3893 10.1011 82.3813C10.0671 82.3573 10.0331 82.3343 10.0001 82.3123C9.97509 82.2943 9.9491 82.2754 9.9241 82.2604C9.8881 82.2364 9.85509 82.2124 9.82209 82.1894C9.81409 82.1854 9.80509 82.1794 9.80509 82.1794C9.76409 82.1514 9.7321 82.1284 9.7001 82.1074C9.6891 82.0974 9.67809 82.0924 9.66909 82.0834C9.65209 82.0734 9.63809 82.0634 9.62209 82.0524C9.58209 82.0254 9.5441 81.9974 9.5051 81.9714C9.4961 81.9624 9.4891 81.9564 9.4791 81.9524V81.9494C9.4691 81.9434 9.4601 81.9364 9.4511 81.9314C9.3021 81.8254 9.15909 81.7194 9.01709 81.6084C9.27409 81.7814 9.5431 81.9624 9.8241 82.1604C9.8381 82.1704 9.8521 82.1793 9.8671 82.1873L9.86909 82.1904C10.3211 82.4954 10.8211 82.6584 11.3301 82.6584H43.1151C43.8601 82.6584 44.5811 82.3154 45.1531 81.6904C45.1771 81.6624 45.2011 81.6354 45.2251 81.6094C47.7361 78.8244 49.3761 74.9273 49.8841 70.6703L50.9711 61.5674C51.1151 60.3654 51.1661 59.1483 51.1231 57.9353L49.9921 25.3074L48.9151 9.33635C48.8401 8.21235 48.5091 7.14336 47.9701 6.26636C47.8941 6.14536 47.8161 6.02635 47.7341 5.91635H47.7321C47.5761 5.69735 47.4041 5.49636 47.2231 5.31836C47.2691 5.34036 47.3131 5.36135 47.3581 5.38435C47.3711 5.39035 47.3831 5.39736 47.3961 5.40436C47.4041 5.40736 47.4131 5.41036 47.4181 5.41736C47.4481 5.43136 47.4781 5.44935 47.5061 5.46535C47.5321 5.48035 47.5601 5.49435 47.5831 5.51135C47.5931 5.51535 47.6031 5.52136 47.6101 5.52736C47.6421 5.54636 47.6731 5.56635 47.7041 5.58835C47.7351 5.60735 47.7671 5.62936 47.7971 5.65036C47.8871 5.71236 47.9751 5.78135 48.0621 5.85335C48.0861 5.87135 48.1121 5.89336 48.1361 5.91536C48.1471 5.92436 48.1581 5.93235 48.1691 5.94235C48.1831 5.95335 48.1941 5.96435 48.2061 5.97635C48.2381 6.00335 48.2691 6.03535 48.3011 6.06535C48.3311 6.09335 48.3581 6.12035 48.3881 6.14935C48.4711 6.22935 48.5511 6.31736 48.6291 6.40636C48.6631 6.44536 48.6961 6.48535 48.7301 6.52835C48.7671 6.57135 48.8041 6.61836 48.8391 6.66736C48.8911 6.73336 48.9411 6.80436 48.9911 6.87436C49.0411 6.94836 49.0881 7.02035 49.1341 7.09735C49.3411 7.43135 49.5161 7.79435 49.6571 8.17735C49.6731 8.21635 49.6881 8.25736 49.7021 8.29936C49.7151 8.33536 49.7281 8.37036 49.7391 8.40836C49.8391 8.70736 49.9191 9.01736 49.9761 9.33536C49.9891 9.40536 50.0011 9.47235 50.0111 9.54135C50.0191 9.59235 50.0271 9.64336 50.0331 9.69536C50.0411 9.74736 50.0471 9.80135 50.0521 9.85335C50.0561 9.88735 50.0591 9.92036 50.0621 9.95636L50.0631 9.96436C50.0701 10.0334 50.0781 10.0994 50.0811 10.1684L51.1591 26.1384L52.2891 58.7664C52.3331 59.9794 52.2821 61.1964 52.1391 62.3974Z" fill="black" /> </g><g opacity="0.2"> <path d="M25.2211 83.4913H12.4981C11.9731 83.4913 11.4551 83.3183 10.9921 82.9933C10.7081 82.7933 10.4391 82.6103 10.1791 82.4363C10.1721 82.4303 10.1641 82.4263 10.1561 82.4223L10.1521 82.4173C10.1481 82.4163 10.1451 82.4133 10.1451 82.4133L10.1401 82.4093C10.1261 82.3973 10.1131 82.3903 10.1011 82.3823C10.0821 82.3713 10.0671 82.3583 10.0481 82.3483L10.0391 82.3423C10.0261 82.3343 10.0121 82.3243 9.9991 82.3143C9.9741 82.2963 9.9481 82.2773 9.9231 82.2623C9.8801 82.2343 9.8371 82.2053 9.7961 82.1753C9.7631 82.1523 9.7311 82.1293 9.6991 82.1083C9.6881 82.0983 9.6771 82.0933 9.6681 82.0843C9.6511 82.0743 9.6371 82.0643 9.6211 82.0533C9.5811 82.0263 9.5431 81.9983 9.5041 81.9723C9.4951 81.9663 9.4861 81.9573 9.4781 81.9503C9.4681 81.9443 9.4591 81.9373 9.4501 81.9323C9.3011 81.8263 9.1581 81.7203 9.0161 81.6093C9.0161 81.6093 9.0011 81.5963 8.9941 81.5933H8.9921C8.9921 81.5933 8.9901 81.5903 8.9881 81.5893C8.9751 81.5803 8.9621 81.5703 8.9511 81.5603C8.9161 81.5333 8.8811 81.5053 8.8481 81.4793C8.7421 81.3953 8.6391 81.3093 8.5371 81.2193C8.5251 81.2083 8.5111 81.1953 8.4971 81.1823C8.4361 81.1293 8.3741 81.0733 8.3131 81.0143C8.3131 81.0143 8.3031 81.0053 8.2981 81.0013C8.2441 80.9513 8.1921 80.8993 8.1381 80.8453C8.0151 80.7253 7.8951 80.5963 7.7751 80.4583C7.7611 80.4413 7.7471 80.4253 7.7321 80.4083C7.7281 80.4033 7.7231 80.4003 7.7211 80.3953C7.7091 80.3813 7.6991 80.3683 7.6871 80.3563C7.6791 80.3453 7.6711 80.3373 7.6651 80.3293C7.6411 80.2983 7.6171 80.2703 7.5951 80.2423C7.5651 80.2053 7.5331 80.1663 7.5051 80.1283C7.4861 80.1043 7.4671 80.0813 7.4501 80.0573C7.3921 79.9833 7.3351 79.9033 7.2781 79.8233C7.2401 79.7713 7.2031 79.7163 7.1681 79.6653C7.1361 79.6193 7.1041 79.5713 7.0731 79.5203C7.0431 79.4743 7.0131 79.4273 6.9821 79.3793C6.9721 79.3633 6.9621 79.3453 6.9511 79.3273C6.8501 79.1663 6.7511 78.9963 6.6521 78.8163C6.6301 78.7743 6.6051 78.7313 6.5821 78.6843C6.4831 78.5023 6.3861 78.3073 6.2891 78.1043C6.1311 77.7753 5.9741 77.4153 5.8141 77.0193C5.7761 76.9243 5.7381 76.8273 5.6991 76.7283C5.6671 76.6433 5.6341 76.5553 5.6011 76.4683C5.5671 76.3793 5.5341 76.2893 5.5021 76.1983C5.4041 75.9303 5.3041 75.6493 5.2061 75.3513C4.8311 74.2333 4.4461 72.9053 4.0361 71.3133C1.4891 61.4253 5.0701 40.2963 5.0701 40.2963C5.2791 38.9483 5.4611 37.6483 5.6171 36.3913C5.6381 36.2183 5.6601 36.0453 5.6801 35.8763C5.7431 35.3613 5.8001 34.8553 5.8521 34.3573C5.8571 34.3113 5.8621 34.2653 5.8671 34.2223C5.9021 33.9003 5.9341 33.5783 5.9641 33.2623C6.0241 32.6433 6.0771 32.0353 6.1241 31.4393C6.1511 31.0923 6.1781 30.7473 6.2011 30.4093C6.2291 29.9893 6.2551 29.5783 6.2761 29.1713C6.3051 28.6673 6.3281 28.1743 6.3471 27.6893C6.3491 27.6533 6.3491 27.6193 6.3511 27.5853C6.3641 27.2623 6.3731 26.9473 6.3801 26.6343C6.3991 25.9033 6.4091 25.1933 6.4081 24.5063C6.4081 24.2823 6.4061 24.0583 6.4031 23.8383C6.3991 23.4593 6.3931 23.0863 6.3841 22.7203C6.3641 21.9883 6.3331 21.2823 6.2921 20.6013C6.2711 20.2613 6.2491 19.9273 6.2241 19.5973C6.2201 19.5603 6.2171 19.5223 6.2141 19.4853C6.1991 19.3033 6.1851 19.1263 6.1691 18.9503V18.9473C6.1541 18.7803 6.1391 18.6163 6.1231 18.4553C6.0751 17.9683 6.0211 17.4953 5.9631 17.0343C5.8821 16.4213 5.7971 15.8333 5.7011 15.2713V15.2683C5.6671 15.0663 5.6321 14.8693 5.5961 14.6733C5.5781 14.5753 5.5591 14.4803 5.5431 14.3833C5.5051 14.1903 5.4691 14.0033 5.4291 13.8163C5.3911 13.6303 5.3511 13.4473 5.3111 13.2683C5.2901 13.1763 5.2711 13.0903 5.2511 13.0003C5.1861 12.7153 5.1191 12.4393 5.0491 12.1703C4.9791 11.9023 4.9091 11.6413 4.8371 11.3853C4.8011 11.2583 4.7641 11.1333 4.7271 11.0073C4.6721 10.8233 4.6151 10.6413 4.5591 10.4633C4.5031 10.2863 4.4441 10.1133 4.3871 9.94327C4.3091 9.71527 4.2311 9.49526 4.1511 9.28326C4.0321 8.96226 3.9111 8.65626 3.7881 8.36526C3.5441 7.78426 3.2951 7.25726 3.0461 6.78526C2.9661 6.62926 2.8831 6.47727 2.8001 6.33127C2.6361 6.03727 2.4721 5.76926 2.3131 5.52026C2.1941 5.33426 2.0771 5.16027 1.9611 4.99627C1.3831 4.18327 0.871097 3.65227 0.517097 3.33227C0.355097 3.18627 0.226099 2.99428 0.140099 2.77428C0.0530986 2.55328 0.00610352 2.30326 0.00610352 2.04826C0.00610352 1.42226 0.289104 0.859265 0.728104 0.611265L0.797104 0.570265C1.6011 0.113265 2.4801 -0.0707365 3.3521 0.0312635L12.8581 1.13627H12.8601L14.6981 1.35026C14.6181 1.55826 14.5741 1.79027 14.5731 2.03027V2.04826C14.5731 2.30426 14.6191 2.55328 14.7071 2.77428C14.7951 2.99428 14.9221 3.18627 15.0821 3.33227C17.0501 5.09927 23.8181 13.3283 19.6401 40.2953C19.6401 40.2953 16.0581 61.4253 18.6051 71.3123C19.6741 75.4523 20.5761 77.8023 21.5201 79.3263C22.4021 80.7503 23.3201 81.4563 24.4431 82.2263C24.5231 82.3763 24.6031 82.5203 24.6831 82.6573C24.8611 82.9643 25.0411 83.2403 25.2211 83.4913Z" fill="white" /> </g><g opacity="0.1"> <path d="M52.1389 62.3979L51.0519 71.5019C51.0319 71.6599 51.0119 71.8189 50.9899 71.9759C50.9819 72.0319 50.9739 72.0879 50.9659 72.1429C50.9499 72.2549 50.9329 72.3679 50.9149 72.4779C50.9049 72.5389 50.8949 72.5989 50.8839 72.6599C50.8579 72.8279 50.8279 72.9969 50.7939 73.1639C50.7639 73.3179 50.7339 73.4719 50.7009 73.6229C50.6939 73.6549 50.6879 73.6869 50.6799 73.7199C50.6469 73.8779 50.6099 74.0339 50.5719 74.1909C50.5689 74.2049 50.5639 74.2229 50.5609 74.2379C50.5219 74.3969 50.4809 74.5559 50.4389 74.7109C50.4029 74.8479 50.3659 74.9839 50.3259 75.1189C50.3019 75.2019 50.2779 75.2829 50.2529 75.3669C50.2159 75.4889 50.1779 75.6119 50.1399 75.7349C50.1009 75.8579 50.0599 75.9819 50.0179 76.1009C49.9349 76.3429 49.8499 76.5839 49.7579 76.8209C49.6679 77.0609 49.5719 77.2989 49.4719 77.5329C49.4239 77.6459 49.3749 77.7589 49.3229 77.8699C49.2879 77.9499 49.2519 78.0299 49.2139 78.1099C49.1789 78.1879 49.1439 78.2639 49.1059 78.3389C49.0939 78.3659 49.0819 78.3919 49.0659 78.4189C49.0149 78.5299 48.9599 78.6379 48.9029 78.7459L48.8979 78.7589C48.8509 78.8529 48.8029 78.9449 48.7539 79.0359C48.4319 79.6469 48.0799 80.2289 47.6989 80.7839C47.6349 80.8769 47.5709 80.9679 47.5059 81.0589C47.4369 81.1539 47.3689 81.2469 47.2979 81.3409C47.2929 81.3489 47.2869 81.3549 47.2819 81.3639C47.2249 81.4389 47.1689 81.5109 47.1119 81.5869C47.0819 81.6259 47.0509 81.6669 47.0199 81.7039C46.9659 81.7729 46.9109 81.8399 46.8559 81.9069C46.8379 81.9289 46.8209 81.9489 46.8029 81.9689C46.7459 82.0379 46.6869 82.1079 46.6279 82.1779C46.5509 82.2679 46.4729 82.3549 46.3959 82.4419C46.3709 82.4689 46.3459 82.4949 46.3219 82.5229C45.7509 83.1459 45.0309 83.4909 44.2849 83.4909H12.4979C11.9729 83.4909 11.4549 83.3179 10.9919 82.9929C10.7079 82.7929 10.4389 82.6099 10.1789 82.4359C10.1689 82.4299 10.1599 82.4229 10.1519 82.4169C10.1479 82.4159 10.1449 82.4129 10.1449 82.4129L10.1399 82.4089C10.1259 82.3969 10.1129 82.3899 10.1009 82.3819C10.0669 82.3579 10.0329 82.3349 9.9999 82.3129C9.9749 82.2949 9.9489 82.2759 9.9239 82.2609C9.8879 82.2369 9.8549 82.2129 9.8219 82.1899C9.7819 82.1619 9.73991 82.1349 9.69991 82.1069C9.68891 82.0969 9.6779 82.0919 9.6689 82.0829C9.6519 82.0729 9.6379 82.0629 9.6219 82.0519C9.5819 82.0249 9.54391 81.9969 9.50491 81.9709C9.49591 81.9649 9.4869 81.9559 9.4789 81.9489C9.4689 81.9429 9.4599 81.9359 9.4509 81.9309C9.3019 81.8249 9.1589 81.7189 9.0169 81.6079C9.0169 81.6079 9.0019 81.5949 8.9949 81.5919H8.9929C8.9929 81.5919 8.9909 81.5889 8.9889 81.5879C8.9759 81.5789 8.9629 81.5689 8.9519 81.5589C8.9169 81.5319 8.8819 81.5039 8.8489 81.4779C8.7429 81.3939 8.6399 81.3079 8.5379 81.2179C8.5259 81.2069 8.5119 81.1939 8.4979 81.1809C8.4369 81.1279 8.3749 81.0719 8.3139 81.0129C8.3139 81.0129 8.3039 81.0039 8.2989 80.9999C8.2449 80.9499 8.1929 80.8979 8.1389 80.8439C8.0159 80.7239 7.8959 80.5949 7.7759 80.4569C7.7619 80.4399 7.7479 80.4239 7.7329 80.4069C7.7289 80.4019 7.7239 80.3989 7.7219 80.3939C7.7099 80.3799 7.6999 80.3669 7.6879 80.3549C7.6799 80.3439 7.6719 80.3359 7.6659 80.3279C7.6419 80.2969 7.6179 80.2689 7.5959 80.2409C7.5659 80.2039 7.53391 80.1649 7.50591 80.1269C7.48691 80.1029 7.4679 80.0799 7.4509 80.0559C7.3929 79.9819 7.3359 79.9019 7.2789 79.8219C7.2409 79.7699 7.2039 79.7149 7.1689 79.6639C7.1369 79.6179 7.10491 79.5699 7.07391 79.5189C7.04391 79.4729 7.0139 79.4259 6.9829 79.3779C6.9729 79.3619 6.9629 79.3439 6.9519 79.3259H36.3229C37.0679 79.3259 37.7889 78.9829 38.3609 78.3579C38.3849 78.3309 38.4089 78.3029 38.4329 78.2769C40.9449 75.4919 42.5839 71.5949 43.0919 67.3379L44.1799 58.2349C44.3229 57.0329 44.3739 55.8159 44.3309 54.6019L43.1999 21.9739L42.1229 6.0029C42.1039 5.7389 42.0729 5.47691 42.0289 5.21991C41.9859 4.97691 41.9309 4.73791 41.8639 4.50391L46.1369 5.0009C46.2099 5.0099 46.2839 5.0199 46.3569 5.0349C46.4229 5.0479 46.4889 5.0589 46.5539 5.0769C46.6459 5.0999 46.7369 5.1269 46.8259 5.1559C46.8789 5.1739 46.9349 5.1929 46.9889 5.2169C47.0359 5.2319 47.0799 5.2509 47.1259 5.2729C47.1579 5.2869 47.1909 5.3009 47.2229 5.3159C47.2689 5.3379 47.3129 5.3589 47.3579 5.3819C47.3709 5.3879 47.3829 5.3949 47.3959 5.4019C47.4039 5.4049 47.4129 5.4079 47.4179 5.4149C47.4269 5.4199 47.4349 5.42391 47.4429 5.42891C47.4909 5.45291 47.5369 5.47991 47.5829 5.50891C47.5929 5.51291 47.6029 5.5189 47.6099 5.5249C47.6419 5.5439 47.6729 5.56391 47.7039 5.58591C47.7349 5.60491 47.7669 5.6269 47.7969 5.6479C47.8869 5.7099 47.9749 5.77891 48.0619 5.85091C48.0859 5.86891 48.1119 5.8909 48.1359 5.9129C48.1469 5.9219 48.1579 5.92991 48.1689 5.93991C48.1829 5.95091 48.1939 5.96191 48.2059 5.97391C48.2379 6.00091 48.2689 6.0329 48.3009 6.0629C48.3309 6.0909 48.3579 6.11791 48.3879 6.14691C48.4709 6.22691 48.5509 6.3149 48.6289 6.4039C48.6629 6.4429 48.6959 6.48291 48.7299 6.52591C48.7669 6.56891 48.8039 6.6159 48.8389 6.6649C48.8529 6.6819 48.8659 6.6979 48.8789 6.7169C48.9169 6.7689 48.9539 6.8209 48.9909 6.8719C49.0409 6.9459 49.0879 7.01791 49.1339 7.09491C49.3409 7.42891 49.5159 7.79191 49.6569 8.17491C49.6729 8.21391 49.6879 8.25491 49.7019 8.29691C49.7149 8.33291 49.7279 8.3679 49.7389 8.4059C49.8389 8.7049 49.9189 9.0149 49.9759 9.3329C49.9889 9.4029 50.0009 9.46991 50.0109 9.53891C50.0189 9.58991 50.0269 9.6409 50.0329 9.6929C50.0339 9.7109 50.0379 9.7289 50.0389 9.7449C50.0489 9.8139 50.0559 9.88491 50.0609 9.95291C50.0669 10.0239 50.0749 10.0929 50.0799 10.1639L51.1569 26.1339L52.2869 58.7619C52.3329 59.9799 52.2819 61.1969 52.1389 62.3979Z" fill="black" /> </g><g opacity="0.18"> <path d="M48.3901 6.14935C48.1761 6.04735 47.9561 5.96735 47.7311 5.91435C47.5901 5.87735 47.4481 5.85035 47.3031 5.83435L42.0271 5.22035L16.7571 2.28335L14.5691 2.02936L13.2161 1.87436L4.51608 0.862349C3.64408 0.760349 2.76508 0.94635 1.96208 1.40135L1.89108 1.44336C1.45308 1.69036 1.17007 2.25435 1.17007 2.87935C1.17007 3.13535 1.21808 3.38536 1.30508 3.60736C1.39208 3.82736 1.52008 4.01835 1.68008 4.16435C3.64608 5.93235 10.4181 14.1614 6.23808 41.1273C6.23808 41.1273 2.65708 62.2573 5.20408 72.1443C6.09108 75.5983 6.86708 77.8064 7.64908 79.3264C8.35308 80.7054 9.06308 81.5204 9.86808 82.1894C9.95508 82.2634 10.0461 82.3343 10.1361 82.4053C10.1361 82.4053 10.1451 82.4114 10.1501 82.4154C10.1161 82.3924 10.0811 82.3694 10.0471 82.3464L10.0381 82.3403C10.0031 82.3173 9.96907 82.2933 9.93407 82.2673L9.92208 82.2594C9.87908 82.2314 9.83607 82.2023 9.79507 82.1723C9.75807 82.1483 9.72308 82.1224 9.68808 82.0984C9.65708 82.0764 9.62508 82.0544 9.59508 82.0334L9.58708 82.0274C9.56708 82.0124 9.54608 81.9984 9.52708 81.9844C9.50808 81.9714 9.49308 81.9603 9.47708 81.9503C9.46708 81.9443 9.45808 81.9394 9.44908 81.9304C9.42408 81.9114 9.39608 81.8924 9.37008 81.8744C9.35008 81.8594 9.33008 81.8454 9.31008 81.8314C9.30208 81.8254 9.29308 81.8183 9.28708 81.8123C9.27808 81.8063 9.27008 81.8004 9.26308 81.7944C9.24708 81.7834 9.23108 81.7724 9.21508 81.7604C9.20608 81.7544 9.20008 81.7504 9.20008 81.7504C9.13808 81.7024 9.08308 81.6614 9.03008 81.6204C9.02408 81.6144 9.01508 81.6104 9.01508 81.6104C9.00408 81.5974 8.99708 81.5954 8.99308 81.5914C8.99308 81.5914 8.98908 81.5884 8.98708 81.5874C8.97408 81.5784 8.96108 81.5683 8.95008 81.5583C8.91508 81.5313 8.88008 81.5034 8.84708 81.4774C8.74108 81.3934 8.63808 81.3074 8.53608 81.2174C8.52408 81.2064 8.51008 81.1934 8.49608 81.1804C8.24808 80.9634 8.01008 80.7254 7.77508 80.4564C7.76108 80.4394 7.74708 80.4234 7.73208 80.4064C7.72808 80.4014 7.72308 80.3984 7.72108 80.3934C7.70908 80.3794 7.69908 80.3664 7.68708 80.3544C7.67908 80.3434 7.67108 80.3354 7.66508 80.3274C7.64108 80.2964 7.61708 80.2684 7.59508 80.2404C7.56508 80.2034 7.53308 80.1644 7.50508 80.1264C7.48608 80.1024 7.46708 80.0794 7.45008 80.0554C7.39208 79.9814 7.33508 79.9014 7.27808 79.8214C7.24008 79.7694 7.20308 79.7144 7.16808 79.6634C7.13608 79.6174 7.10407 79.5694 7.07307 79.5184C7.04307 79.4724 7.01308 79.4253 6.98208 79.3773C6.97208 79.3613 6.96208 79.3433 6.95108 79.3253C6.85008 79.1643 6.75108 78.9944 6.65208 78.8144C6.63008 78.7724 6.60508 78.7294 6.58208 78.6824C6.48308 78.5004 6.38608 78.3054 6.28908 78.1024C6.13108 77.7734 5.97408 77.4133 5.81408 77.0173C5.77608 76.9223 5.73808 76.8253 5.69908 76.7263C5.66708 76.6413 5.63408 76.5534 5.60108 76.4664C5.56708 76.3774 5.53408 76.2874 5.50208 76.1964C5.40408 75.9284 5.30408 75.6473 5.20608 75.3493C4.83108 74.2313 4.44608 72.9034 4.03608 71.3114C1.48908 61.4234 5.07008 40.2944 5.07008 40.2944C5.27908 38.9464 5.46108 37.6464 5.61708 36.3894C5.70408 35.6984 5.78108 35.0194 5.85208 34.3554C5.85708 34.3094 5.86208 34.2634 5.86708 34.2204C5.90208 33.8984 5.93408 33.5764 5.96408 33.2604C6.27708 30.0204 6.41108 27.1133 6.40908 24.5043C6.40708 22.4773 6.31907 20.6303 6.17007 18.9483V18.9454C6.05007 17.6174 5.89208 16.3953 5.70208 15.2693V15.2664C5.56508 14.4614 5.41308 13.7054 5.25208 12.9974C5.12008 12.4294 4.98208 11.8924 4.83808 11.3824C4.80208 11.2554 4.76508 11.1303 4.72808 11.0043C4.61608 10.6343 4.50308 10.2794 4.38808 9.93936C4.31008 9.71136 4.23208 9.49136 4.15208 9.27936C4.03308 8.95836 3.91208 8.65236 3.78908 8.36136C3.54508 7.78036 3.29608 7.25335 3.04708 6.78135C2.96708 6.62535 2.88408 6.47336 2.80108 6.32736C2.63708 6.03336 2.47308 5.76536 2.31408 5.51636C2.19508 5.33036 2.07808 5.15635 1.96208 4.99235C1.38408 4.17935 0.872082 3.64835 0.518082 3.32835C0.356082 3.18235 0.227075 2.99035 0.141075 2.77035C0.0540751 2.54935 0.00708008 2.29936 0.00708008 2.04436C0.00708008 1.41836 0.29008 0.855359 0.72908 0.607359L0.79808 0.566359C1.60208 0.109359 2.48108 -0.0746427 3.35308 0.0273573L12.8591 1.13235H12.8611L14.6991 1.34636L16.2731 1.52736L41.8661 4.50235L46.1391 4.99936C46.5141 5.04336 46.8791 5.15036 47.2261 5.31436C47.2931 5.34536 47.3581 5.37636 47.4221 5.41336C47.4821 5.44536 47.5421 5.47836 47.6001 5.51636L47.6151 5.52435C47.6781 5.56335 47.7401 5.60435 47.8031 5.64735C47.8671 5.69335 47.9291 5.73936 47.9911 5.78636C48.0031 5.79736 48.0151 5.80535 48.0261 5.81535C48.0391 5.82435 48.0521 5.83435 48.0641 5.84735C48.1021 5.87535 48.1401 5.90735 48.1751 5.94035C48.1871 5.95135 48.2001 5.96235 48.2131 5.97435C48.2361 5.99435 48.2591 6.01535 48.2831 6.03935C48.2831 6.03935 48.2891 6.04235 48.2931 6.04735C48.3231 6.08235 48.3561 6.11535 48.3901 6.14935Z" fill="white" /> </g></g>`, cork:"", defs:`<linearGradient id="{U}lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7CC4F0"/><stop offset=".35" stop-color="#B4E3FC"/><stop offset=".8" stop-color="#8ACDF5"/><stop offset="1" stop-color="#63AEE3"/></linearGradient><linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B4F8A" stop-opacity="0"/><stop offset=".55" stop-color="#0B4F8A" stop-opacity=".06"/><stop offset="1" stop-color="#0B4F8A" stop-opacity=".2"/></linearGradient>`,
    surfC:[41.5,26.2], yTop:3, yFill:9, yBot:82.5, xTop:[17,66], xBot:[20,61],   /* yFill 9: jug full to just below the brim */
    lipR:[67.6,2.2], lipL:[30,4], mouth:[44,4] },
  oiljar: { vb:[90,109], shift:[0,0],   /* "jar.svg" */
    back:`<path d="M20.1402 1.79297C20.1402 1.79297 20.3705 5.74522 20.1976 6.55559C19.6857 8.96215 5.0631 17.2849 1.57515 25.7064C-1.06905 32.0898 1.57428 65.2239 1.91925 72.9254C2.26422 80.6257 4.10379 96.4336 12.9549 102.007C26.4574 110.508 63.3667 110.508 76.8696 102.007C85.7205 96.4336 87.5602 80.6257 87.905 72.9254C88.2499 65.2244 90.8931 32.0905 88.2494 25.7064C84.7613 17.2849 70.1385 8.96215 69.6265 6.55559C69.4538 5.74522 69.6842 1.79297 69.6842 1.79297H20.1402Z" fill="url(#{U}p0_linear_2_9046)" />`, milk:`<path fill="url(#{U}lq)" d="M20.1402 1.79297C20.1402 1.79297 20.3705 5.74522 20.1976 6.55559C19.6857 8.96215 5.0631 17.2849 1.57515 25.7064C-1.06905 32.0898 1.57428 65.2239 1.91925 72.9254C2.26422 80.6257 4.10379 96.4336 12.9549 102.007C26.4574 110.508 63.3667 110.508 76.8696 102.007C85.7205 96.4336 87.5602 80.6257 87.905 72.9254C88.2499 65.2244 90.8931 32.0905 88.2494 25.7064C84.7613 17.2849 70.1385 8.96215 69.6265 6.55559C69.4538 5.74522 69.6842 1.79297 69.6842 1.79297H20.1402Z"/><path fill="url(#{U}dp)" d="M20.1402 1.79297C20.1402 1.79297 20.3705 5.74522 20.1976 6.55559C19.6857 8.96215 5.0631 17.2849 1.57515 25.7064C-1.06905 32.0898 1.57428 65.2239 1.91925 72.9254C2.26422 80.6257 4.10379 96.4336 12.9549 102.007C26.4574 110.508 63.3667 110.508 76.8696 102.007C85.7205 96.4336 87.5602 80.6257 87.905 72.9254C88.2499 65.2244 90.8931 32.0905 88.2494 25.7064C84.7613 17.2849 70.1385 8.96215 69.6265 6.55559C69.4538 5.74522 69.6842 1.79297 69.6842 1.79297H20.1402Z"/><path fill="#FFFFFF" opacity=".28" d="M9,30 L15,30 L15,92 L10,92 Z"/>`, surf:`<ellipse cx="44.6" cy="20" rx="35.5" ry="4.2" fill="#FFD95E" stroke="#D9A21A" stroke-width=".45"/>`, front:`<path fill="none" stroke="#98B0C6" stroke-width="1.5" opacity=".9" d="M20.1402 1.79297C20.1402 1.79297 20.3705 5.74522 20.1976 6.55559C19.6857 8.96215 5.0631 17.2849 1.57515 25.7064C-1.06905 32.0898 1.57428 65.2239 1.91925 72.9254C2.26422 80.6257 4.10379 96.4336 12.9549 102.007C26.4574 110.508 63.3667 110.508 76.8696 102.007C85.7205 96.4336 87.5602 80.6257 87.905 72.9254C88.2499 65.2244 90.8931 32.0905 88.2494 25.7064C84.7613 17.2849 70.1385 8.96215 69.6265 6.55559C69.4538 5.74522 69.6842 1.79297 69.6842 1.79297H20.1402Z"/><path opacity="0.45" d="M14.6686 13.7386C16.6003 11.2058 18.097 10.6359 18.9659 10.8886C19.8349 11.1414 26.3927 12.9152 29.1058 12.9152C31.8189 12.9152 30.2159 18.2345 28.5259 20.958C26.836 23.6808 23.6949 30.3305 23.6884 34.4464C23.6826 38.5624 22.4452 67.415 23.6826 81.839C24.92 96.2635 26.7834 103.256 25.1606 103.223C23.5378 103.191 10.1563 103.014 7.4368 85.3856C5.61894 73.5997 4.38213 51.9145 5.11091 37.3561C5.81575 23.2741 7.438 23.2213 14.6686 13.7386Z" fill="white" /><path opacity="0.4" d="M62.2179 16.3842C66.5638 19.6089 73.7457 25.584 75.1296 30.7395C77.1414 38.2312 77.1509 63.7625 75.1341 78.448C73.1182 93.1334 66.739 101.028 61.8791 103.51C60.3953 104.267 61.6502 101.699 62.6541 98.7604C66.1677 89.9453 67.6736 66.4382 66.6697 52.3339C65.6658 38.2297 62.6541 25.3008 59.1404 19.424C56.1287 14.135 60.1443 14.7226 62.2179 16.3842Z" fill="white" /><path fill="none" opacity="0.85" d="M20.1663 2.28221C20.221 3.36678 20.3322 5.91966 20.1976 6.5531C19.6857 8.95966 5.0631 17.2824 1.57515 25.7039C-1.06905 32.0873 1.57428 65.221 1.91925 72.9225C2.26422 80.6234 4.10379 96.4308 12.9549 102.004C26.4574 110.505 63.3667 110.505 76.8696 102.004C85.7205 96.4308 87.5602 80.6234 87.905 72.9225C88.2499 65.2222 90.8931 32.088 88.2494 25.7039C84.7613 17.2824 70.1385 8.95966 69.6265 6.5531C69.491 5.91737 69.6034 3.34993 69.6581 2.27148" stroke="#BCAE8E" stroke-opacity="0.5" stroke-width="0.823529" /><path opacity="0.4" d="M20.7441 2.75977C20.7441 2.75977 27.409 4.27557 33.2457 4.3759C39.0824 4.47548 64.1594 4.82091 66.3068 4.3759C68.4526 3.93089 69.6798 2.76053 69.6798 2.76053L20.7441 2.75977Z" fill="#8D8068" /><path fill="none" opacity="0.7" d="M23.0497 5.81055C23.0497 5.81055 15.9374 13.054 12.0575 15.8919C8.17768 18.7297 3.14906 23.67 2.78932 24.6833C1.67445 27.8275 22.3102 31.6879 43.4543 32.0601C65.7281 32.4531 87.458 27.9141 86.3125 24.6833C85.9536 23.67 80.9241 18.7305 77.0445 15.8926C73.1645 13.0548 66.0523 5.81132 66.0523 5.81132" stroke="white" stroke-opacity="0.55" stroke-width="0.823529" /><path opacity="0.5" d="M44.8846 7.90507C58.4684 7.90507 69.4802 6.22116 69.4802 4.14394C69.4802 2.06673 58.4684 0.382812 44.8846 0.382812C31.3009 0.382812 20.2891 2.06673 20.2891 4.14394C20.2891 6.22116 31.3009 7.90507 44.8846 7.90507Z" fill="#FFF7E6" /><path fill="none" opacity="0.7" d="M44.8846 7.90507C58.4684 7.90507 69.4802 6.22116 69.4802 4.14394C69.4802 2.06673 58.4684 0.382812 44.8846 0.382812C31.3009 0.382812 20.2891 2.06673 20.2891 4.14394C20.2891 6.22116 31.3009 7.90507 44.8846 7.90507Z" stroke="#C9B890" stroke-width="0.764705" />`, cork:"", defs:` <linearGradient id="{U}p0_linear_2_9046" x1="0.412109" y1="1.79297" x2="89.4121" y2="1.79297" gradientUnits="userSpaceOnUse"> <stop stop-color="white" stop-opacity="0.55" /> <stop offset="0.18" stop-color="#E9EEF2" stop-opacity="0.28" /> <stop offset="0.5" stop-color="#CFD6DA" stop-opacity="0.14" /> <stop offset="0.82" stop-color="#E9EEF2" stop-opacity="0.3" /> <stop offset="1" stop-color="white" stop-opacity="0.5" /> </linearGradient> <linearGradient id="{U}lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6C43A"/><stop offset=".32" stop-color="#FFE07A"/><stop offset=".78" stop-color="#EFB321"/><stop offset="1" stop-color="#C8890B"/></linearGradient><linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A4A00" stop-opacity="0"/><stop offset=".6" stop-color="#7A4A00" stop-opacity=".08"/><stop offset="1" stop-color="#7A4A00" stop-opacity=".26"/></linearGradient>`,
    poly:[[21,4],[68,4],[68,8],[86,26],[86,80],[76,102],[45,106],[13,102],[3,80],[3,26],[21,8]],
    surfC:[44.6,20], yTop:4, yFill:20, yBot:106, xTop:[21,68], xBot:[3,86],
    lipR:[69,3.5], lipL:[20,3.5], mouth:[44.8,3.5] },
  teacup: { vb:[98,82], shift:[0,0],    /* "cup.svg" — opaque: liquid shows in the opening only */
    back:`<mask id="{U}hm" maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="100"><rect x="-10" y="-10" width="120" height="100" fill="#fff"/><path fill="#000" d="M74.2682 3.97656H44.1252H30.8502H0.706216C0.706216 3.97656 -4.85279 58.8106 15.2222 79.0266C15.2202 79.0406 15.2032 79.0546 15.2032 79.0686C15.2032 80.4076 25.1542 81.4926 37.4302 81.4926C49.6622 81.4926 59.5802 80.4146 59.6512 79.0826H59.7012C79.8382 58.9436 74.2682 3.97656 74.2682 3.97656Z"/></mask><g mask="url(#{U}hm)"><path fill="#E9F1F7" opacity=".55" d="M82.2222 8.10349L70.1962 5.77148L69.1252 11.2925L69.3572 11.3375C63.1192 15.7285 58.0072 23.9125 56.0642 33.9315C54.1502 43.7985 55.7572 53.1585 59.7652 59.5585L58.6452 65.3325L70.6712 67.6645C81.9282 69.8475 93.6392 58.2845 96.8292 41.8365C100.018 25.3895 93.4782 10.2865 82.2222 8.10349ZM72.0752 60.4175C64.6132 58.9705 60.5202 47.7085 62.9342 35.2635C65.3482 22.8185 73.3542 13.9035 80.8162 15.3505C88.2782 16.7975 92.3712 28.0595 89.9572 40.5045C87.5432 52.9495 79.5372 61.8645 72.0752 60.4175Z"/><path fill="none" stroke="#B9C3CC" stroke-width="1.4" d="M82.2222 8.10349L70.1962 5.77148L69.1252 11.2925L69.3572 11.3375C63.1192 15.7285 58.0072 23.9125 56.0642 33.9315C54.1502 43.7985 55.7572 53.1585 59.7652 59.5585L58.6452 65.3325L70.6712 67.6645C81.9282 69.8475 93.6392 58.2845 96.8292 41.8365C100.018 25.3895 93.4782 10.2865 82.2222 8.10349ZM72.0752 60.4175C64.6132 58.9705 60.5202 47.7085 62.9342 35.2635C65.3482 22.8185 73.3542 13.9035 80.8162 15.3505C88.2782 16.7975 92.3712 28.0595 89.9572 40.5045C87.5432 52.9495 79.5372 61.8645 72.0752 60.4175Z"/></g><path opacity=".5" d="M37.412 7.00562C56.2327 7.00562 71.49 5.66471 71.49 4.01062C71.49 2.35653 56.2327 1.01562 37.412 1.01562C18.5912 1.01562 3.33398 2.35653 3.33398 4.01062C3.33398 5.66471 18.5912 7.00562 37.412 7.00562Z" fill="#CDCDCD" />`, milk:`<path fill="url(#{U}lq)" d="M74.2682 3.97656H44.1252H30.8502H0.706216C0.706216 3.97656 -4.85279 58.8106 15.2222 79.0266C15.2202 79.0406 15.2032 79.0546 15.2032 79.0686C15.2032 80.4076 25.1542 81.4926 37.4302 81.4926C49.6622 81.4926 59.5802 80.4146 59.6512 79.0826H59.7012C79.8382 58.9436 74.2682 3.97656 74.2682 3.97656Z"/><path fill="url(#{U}dp)" d="M74.2682 3.97656H44.1252H30.8502H0.706216C0.706216 3.97656 -4.85279 58.8106 15.2222 79.0266C15.2202 79.0406 15.2032 79.0546 15.2032 79.0686C15.2032 80.4076 25.1542 81.4926 37.4302 81.4926C49.6622 81.4926 59.5802 80.4146 59.6512 79.0826H59.7012C79.8382 58.9436 74.2682 3.97656 74.2682 3.97656Z"/>`, surf:`<ellipse cx="37.5" cy="9" rx="36" ry="3.2" fill="#FFD95E" stroke="#D9A21A" stroke-width=".5"/>`, front:`<path opacity=".2" d="M74.2682 3.97656H44.1252H30.8502H0.706216C0.706216 3.97656 -4.85279 58.8106 15.2222 79.0266C15.2202 79.0406 15.2032 79.0546 15.2032 79.0686C15.2032 80.4076 25.1542 81.4926 37.4302 81.4926C49.6622 81.4926 59.5802 80.4146 59.6512 79.0826H59.7012C79.8382 58.9436 74.2682 3.97656 74.2682 3.97656Z" fill="#E9E9E9" /><path fill="none" stroke="#B9C3CC" stroke-width="1.4" d="M74.2682 3.97656H44.1252H30.8502H0.706216C0.706216 3.97656 -4.85279 58.8106 15.2222 79.0266C15.2202 79.0406 15.2032 79.0546 15.2032 79.0686C15.2032 80.4076 25.1542 81.4926 37.4302 81.4926C49.6622 81.4926 59.5802 80.4146 59.6512 79.0826H59.7012C79.8382 58.9436 74.2682 3.97656 74.2682 3.97656Z"/><path opacity="0.6" d="M16.9232 55.1294L23.5692 48.4834C23.3022 46.9454 23.0572 45.3884 22.8332 43.8184L15.9902 50.6613C16.2782 52.1763 16.5882 53.6674 16.9232 55.1294Z" fill="white" /><path opacity="0.6" d="M21.6969 34.0486C19.4169 9.30858 21.2629 3.97656 21.2629 3.97656H13.2869C13.2869 3.97656 11.0659 14.3246 14.5089 41.2366L21.6969 34.0486Z" fill="white" /><path opacity="0.05" d="M74.2673 3.97656H58.1313C58.1313 3.97656 63.7013 58.9436 43.5633 79.0816H43.5133C43.4593 80.1036 37.6023 80.9736 29.3613 81.3246C31.8653 81.4316 34.5793 81.4916 37.4293 81.4916C49.6613 81.4916 59.5793 80.4136 59.6503 79.0816H59.7003C79.8373 58.9436 74.2673 3.97656 74.2673 3.97656Z" fill="black" /><path d="M37.4118 8.022C57.7231 8.022 74.1888 6.2262 74.1888 4.01099C74.1888 1.79577 57.7231 0 37.4118 0C17.1004 0 0.634766 1.79577 0.634766 4.01099C0.634766 6.2262 17.1004 8.022 37.4118 8.022Z" fill="#E6E6E6" />`, cork:"", defs:`<linearGradient id="{U}lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6C43A"/><stop offset=".32" stop-color="#FFE07A"/><stop offset=".78" stop-color="#EFB321"/><stop offset="1" stop-color="#C8890B"/></linearGradient><linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A4A00" stop-opacity="0"/><stop offset=".6" stop-color="#7A4A00" stop-opacity=".08"/><stop offset="1" stop-color="#7A4A00" stop-opacity=".26"/></linearGradient>`,
    poly:[[0.4,4],[74.3,4],[75,21],[74.2,38],[71.4,55],[65.4,71.5],[60.3,78.4],[43.8,81.4],[26.5,81.2],[18,80.2],[11.7,74.8],[4.6,59.2],[1.2,42.4],[0,21]],
    surfC:[37.5,9], yTop:4, yFill:9, yBot:81.5, xTop:[0.4,74.3], xBot:[18,60],   /* see-through: the oil level shows */
    lipR:[72,4], lipL:[2,4], mouth:[37,4] },
  pot: { vb:[104,114], shift:[0,0],     /* "bhaagona.svg" — full = milk up to the neck */
    back:`<path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M51.604 99.7656C64.519 99.7656 74.9895 102.207 74.9895 105.218C74.9895 108.23 64.519 110.671 51.604 110.671C38.6891 110.671 28.2188 108.23 28.2188 105.218C28.2188 102.207 38.6891 99.7656 51.604 99.7656Z" fill="#B2B1B2" /><path fill-rule="evenodd" clip-rule="evenodd" d="M32.5156 110.63C32.773 110.083 33.5925 109.158 34.8331 109.158C36.0736 109.158 47.3409 110.713 50.9463 110.587C54.5517 110.46 65.6252 109.494 67.3902 108.864C69.1562 108.232 70.3699 108.443 70.848 108.947C71.3261 109.452 71.2529 110.461 70.9955 110.63C70.7382 110.798 48.7387 116.599 32.5156 110.63Z" fill="#959696" /><path fill-rule="evenodd" clip-rule="evenodd" d="M32.5938 102.779C32.5938 102.779 41.717 100.357 52.7485 100.718C63.7789 101.078 71.738 102.468 71.738 102.468C71.738 102.468 50.0767 96.4054 32.5938 102.779Z" fill="#B2B1B2" /><path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M20.572 0.886952V7.90256C20.572 7.90256 19.7062 11.95 17.4243 13.3886C-20.865 37.5267 13.5874 98.0733 29.4627 108.9C39.1987 115.539 64.1132 115.539 73.8503 108.9C89.7256 98.0733 124.178 37.5267 85.8887 13.3886C83.6068 11.95 82.741 7.90256 82.741 7.90256V0.886952C57.4603 -0.295651 45.8527 -0.295651 20.572 0.886952Z" fill="#CBCBCB" /><path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M20.5731 0.887026V7.90264C20.5731 7.90264 19.7073 11.9501 17.4243 13.3886C-20.8661 37.528 13.5896 98.077 29.4627 108.9C39.1987 115.54 64.1132 115.539 73.8492 108.9C89.7224 98.077 124.178 37.528 85.8876 13.3886C83.6057 11.9501 82.7399 7.90264 82.7399 7.90264V0.887026C81.06 0.808268 79.4425 0.734421 77.8757 0.667969C77.7087 1.06668 77.544 1.47402 77.3835 1.90472C76.7019 9.89252 80.8845 13.8329 83.4334 15.1767C116.628 32.661 102.629 102.345 55.1633 112.225C53.8474 112.5 52.6198 112.304 51.5278 112.379C50.4359 112.304 49.2298 112.25 47.8923 112.225C28.8532 111.867 -24.4951 59.3563 19.0289 14.1688C22.0786 11.0025 26.4819 11.3877 25.6721 1.90596C25.5127 1.48018 25.3501 1.07531 25.1843 0.680287C23.6971 0.743047 22.1615 0.81196 20.5731 0.887026Z" fill="#B2B1B2" /><mask id="{U}m0" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="104" height="114"> <path d="M20.572 0.886952V7.90256C20.572 7.90256 19.7062 11.95 17.4243 13.3886C-20.865 37.5267 13.5874 98.0733 29.4627 108.9C39.1987 115.539 64.1132 115.539 73.8503 108.9C89.7256 98.0733 124.178 37.5267 85.8887 13.3886C83.6068 11.95 82.741 7.90256 82.741 7.90256V0.886952C57.4603 -0.295651 45.8527 -0.295651 20.572 0.886952Z" fill="white" /> </mask><g mask="url(#{U}m0)"> <path opacity="0.12" d="M36 0H27V114H36V0Z" fill="white" /> <path opacity="0.08" d="M73 0H66V114H73V0Z" fill="white" /> </g>`, milk:`<path fill="url(#{U}lq)" d="M20.572 0.886952V7.90256C20.572 7.90256 19.7062 11.95 17.4243 13.3886C-20.865 37.5267 13.5874 98.0733 29.4627 108.9C39.1987 115.539 64.1132 115.539 73.8503 108.9C89.7256 98.0733 124.178 37.5267 85.8887 13.3886C83.6068 11.95 82.741 7.90256 82.741 7.90256V0.886952C57.4603 -0.295651 45.8527 -0.295651 20.572 0.886952Z"/><path fill="url(#{U}dp)" d="M20.572 0.886952V7.90256C20.572 7.90256 19.7062 11.95 17.4243 13.3886C-20.865 37.5267 13.5874 98.0733 29.4627 108.9C39.1987 115.539 64.1132 115.539 73.8503 108.9C89.7256 98.0733 124.178 37.5267 85.8887 13.3886C83.6068 11.95 82.741 7.90256 82.741 7.90256V0.886952C57.4603 -0.295651 45.8527 -0.295651 20.572 0.886952Z"/>`, surf:`<ellipse cx="51.6" cy="45" rx="51" ry="7" fill="#FFFFFF" stroke="#DCD5C4" stroke-width=".6"/>`, front:`<path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M21.2226 3.16058C21.6997 5.09507 23.0479 10.8604 22.6915 12.9266C22.335 14.9928 27.167 16.2467 37.0182 16.5827C46.8684 16.9186 65.3723 16.5827 70.9322 16.5827C76.4931 16.5827 82.2049 15.9108 82.0455 14.3971C81.8861 12.8835 82.4924 8.23925 82.4429 6.74653C82.3923 5.25259 80.651 3.07443 80.651 3.07443C80.651 3.07443 19.5147 0.802752 21.2226 3.16058Z" fill="#C5C4C4" /><path fill-rule="evenodd" clip-rule="evenodd" d="M21.4766 2.41406C21.4766 2.41406 29.7771 4.86173 37.046 5.02294C44.3149 5.18415 75.5474 5.74161 78.2213 5.02294C80.8941 4.30427 82.4222 2.41406 82.4222 2.41406H21.4766Z" fill="#B2B1B2" /><path opacity="0.28" fill-rule="evenodd" clip-rule="evenodd" d="M39.4077 5.99445C38.4665 6.45716 37.1785 8.34859 36.6983 10.1145C36.219 11.8804 36.5583 14.5299 40.1647 14.9077C43.7712 15.2854 55.8634 14.7391 55.7148 15.2855C55.1763 17.2655 18.4851 17.1104 18.1911 14.3182C18.1114 13.5614 19.3703 13.73 19.8829 11.5432C20.3955 9.35768 22.1777 5.16381 22.8421 5.11828C23.5066 5.07152 32.1668 6.54084 39.4077 5.99445Z" fill="#959696" /><path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M55.7188 15.4942C55.7188 15.4942 70.5279 15.8301 71.734 15.2419C72.939 14.6537 71.3796 12.2565 69.4908 12.131C67.6019 12.0042 66.2904 11.7519 65.5614 10.8277C64.8334 9.90357 65.43 9.45439 65.9512 8.43177C66.4724 7.40914 66.5715 7.38084 65.9534 6.07764C65.3352 4.77444 64.8496 3.73829 66.0126 3.73952C67.1756 3.74198 77.4187 3.75921 78.7314 3.52786C80.0431 3.29651 79.9063 3.06023 80.3564 5.65678C80.8066 8.25457 82.3854 12.1826 83.6884 13.3554C84.9914 14.5281 84.7308 14.9896 83.0056 15.2837C81.2816 15.5791 70.7626 17.8483 55.7188 15.4942Z" fill="#B2B1B2" /><path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M41.2825 14.0181C41.7606 12.9671 40.8044 7.16487 41.8672 6.87076C42.9301 6.57665 46.9156 5.95643 46.9156 8.34255C46.9156 10.7287 47.1278 14.0181 46.3847 14.9004C45.6395 15.784 40.1658 15.784 41.2825 14.0181Z" fill="white" /><path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M37.1677 14.0791C37.3787 13.1623 36.9566 8.10083 37.4261 7.84486C37.8956 7.58767 39.6563 7.04744 39.6563 9.12837C39.6563 11.2093 39.75 14.0791 39.4216 14.8494C39.092 15.6185 36.6745 15.6185 37.1677 14.0791Z" fill="white" /><path opacity="0.39" fill-rule="evenodd" clip-rule="evenodd" d="M31.4175 17.2617C34.2863 18.1034 40.7637 18.4382 44.8084 18.4382C48.8521 18.4382 50.2531 21.4654 50.1799 26.09C50.1066 30.7146 44.1462 36.347 39.9528 42.7375C35.7584 49.128 35.4364 59.4146 38.5044 74.1559C41.5724 88.8972 47.6051 103.455 47.6051 106.554C47.6051 109.652 40.3717 108.571 36.8633 107.058C33.3548 105.546 9.21885 75.7163 5.81485 52.7447C2.40978 29.7695 18.8041 20.8809 31.4175 17.2617Z" fill="white" /><path opacity="0.31" fill-rule="evenodd" clip-rule="evenodd" d="M69.4537 23.7773C69.4537 23.7773 81.4824 37.9034 81.4824 52.1955C81.4824 66.4889 76.1863 87.3942 72.3602 95.5801C68.534 103.765 68.8259 105.112 69.4547 106.173C70.0826 107.234 113.177 57.7664 90.1221 29.3261C84.9413 22.9356 82.3718 26.8255 69.4537 23.7773Z" fill="white" /><path fill-rule="evenodd" clip-rule="evenodd" d="M10.5969 41.0907C10.5969 41.0907 14.0914 45.3917 22.0646 47.7458C30.0388 50.0999 33.2641 51.0216 32.4575 53.1727C31.6509 55.3226 27.6191 59.0082 28.8736 65.1513C30.1282 71.2945 32.2787 74.5716 29.3216 74.3661C26.3656 74.1605 22.5126 69.7587 21.1686 72.3183C19.8247 74.878 32.5792 92.7733 30.5751 95.4572C28.571 98.1412 20.4514 83.8872 16.2398 74.0584C12.0303 64.2296 3.77604 40.4521 10.5969 41.0907Z" fill="white" /><path fill-rule="evenodd" clip-rule="evenodd" d="M21.4398 37.7005C19.1945 40.0276 27.9656 45.8508 32.2742 45.5689C36.5828 45.2884 30.1646 36.9142 21.4398 37.7005Z" fill="white" /><path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M56.5508 107.177C57.4468 107.485 65.0786 109.336 68.0712 101.346C71.0649 93.3553 77.2461 73.7999 77.7835 66.7351C78.3209 59.6702 76.7971 48.7154 68.6441 48.2035C60.4911 47.6916 59.3259 63.5614 58.4299 69.0904C57.5361 74.6183 54.8924 105.693 56.5508 107.177Z" fill="#D4D4D4" /><path fill-rule="evenodd" clip-rule="evenodd" d="M16.8632 15.3906C16.8632 15.3906 8.79959 22.4555 4.94653 33.3081C1.09348 44.1607 1.54146 54.5014 1.54146 54.5014C1.54146 54.5014 -3.1171 26.4488 16.8632 15.3906Z" fill="#959696" /><path fill-rule="evenodd" clip-rule="evenodd" d="M87.0547 15.3906C87.0547 15.3906 95.1172 22.4555 98.9703 33.3081C102.823 44.1607 102.375 54.5014 102.375 54.5014C102.375 54.5014 107.034 26.4488 87.0547 15.3906Z" fill="#959696" />`, cork:"", defs:`<linearGradient id="{U}lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F4F1EA"/><stop offset=".35" stop-color="#FFFFFF"/><stop offset=".8" stop-color="#F1EDE4"/><stop offset="1" stop-color="#E2DDD1"/></linearGradient><linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B4F8A" stop-opacity="0"/><stop offset=".55" stop-color="#0B4F8A" stop-opacity=".06"/><stop offset="1" stop-color="#0B4F8A" stop-opacity=".2"/></linearGradient>`,
    poly:[[20.6,0.9],[20.5,8.3],[16.3,14.1],[10.6,18.8],[5.9,24.5],[2.6,31.1],[0.7,38.3],[0,45.6],[0.4,53],[1.6,60.3],[3.5,67.5],[6,74.4],[9,81.2],[12.5,87.8],[16.3,94.1],[20.7,100.1],[25.6,105.6],[31.5,110.1],[38.4,112.5],[45.7,113.6],[53.1,113.9],[60.5,113.3],[67.7,111.7],[74.4,108.5],[79.8,103.5],[84.4,97.7],[88.6,91.6],[92.3,85.2],[95.5,78.5],[98.3,71.7],[100.6,64.6],[102.3,57.4],[103.2,50.1],[103.2,42.7],[102,35.4],[99.5,28.4],[95.7,22.1],[90.5,16.8],[84.7,12.3],[82.7,5.3],[79.8,0.8],[51.6,0]],
    surfC:[51.6,45], yTop:0.5, yFill:15, yBot:113.9, xTop:[20.6,80], xBot:[38,68],
    lipR:[82,1], lipL:[21,1], mouth:[51.6,1] },
  milkcup: { vb:[118,90], shift:[0,0],  /* "milk cup.svg" — opaque, handle left; pours off the right lip */
    back:`<path d="M36.1413 66.2991L36.0233 65.9311C35.5213 64.3731 33.9443 62.8371 32.1663 62.9941L31.8563 63.0211C30.9203 63.1041 30.1583 63.4451 29.5643 63.9401C25.3873 64.6271 19.0943 63.1651 15.9723 61.4491C11.0303 58.7331 8.83725 52.9821 8.19525 47.6371C7.57125 42.4481 8.28726 36.5211 12.0933 32.6141C16.1053 28.4961 22.8623 27.9981 25.8463 33.5281C28.2923 38.0601 35.2013 34.0261 32.7543 29.4901C28.9513 22.4411 20.4023 19.6241 13.0103 22.5381C4.81926 25.7671 0.528255 34.2531 0.0532555 42.6711C-0.411745 50.9161 2.14626 60.4761 8.59726 66.0071C11.8983 68.8371 15.9243 70.3961 20.1833 71.0881C23.9693 71.7031 29.6993 72.6401 33.3493 71.2191C35.2933 70.4621 36.8593 68.5281 36.1413 66.2991Z" fill="#07A4A8" /><path d="M22.2969 15.5991L29.1929 75.0981C29.5179 78.3511 31.5779 81.1731 34.5769 82.4741C57.2049 92.2911 82.8889 92.2911 105.516 82.4741C108.515 81.1731 110.575 78.3511 110.9 75.0981L117.796 15.5991H22.2969Z" fill="#00B6C4" /><path d="M34.5808 82.4751C47.7168 88.1741 61.8828 90.5581 75.8838 89.6401C65.7678 88.9771 55.7388 86.5931 46.2478 82.4751C43.2488 81.1741 41.1888 78.3521 40.8638 75.0991L33.9678 15.6001H22.3008L29.1968 75.0991C29.5218 78.3521 31.5818 81.1741 34.5808 82.4751Z" fill="#07A4A8" /><path opacity="0.3" d="M108.362 33.1653C108.255 35.5063 108.016 37.8243 107.616 40.1333C107.18 42.6513 111.034 43.7323 111.473 41.1963C111.934 38.5373 112.239 35.8613 112.362 33.1653C112.479 30.5923 108.479 30.5983 108.362 33.1653Z" fill="white" /><path opacity="0.3" d="M106.82 48.3261C106.049 56.0491 105.279 63.7721 104.508 71.4951C104.253 74.0541 108.254 74.0371 108.508 71.4951C109.279 63.7721 110.049 56.0491 110.82 48.3261C111.075 45.7671 107.073 45.7851 106.82 48.3261Z" fill="white" /><path d="M70.0469 0C42.8249 0 22.2969 6.706 22.2969 15.6C22.2969 16.666 22.5979 17.736 23.1919 18.781C23.2359 18.858 23.2829 18.932 23.3359 19.004C27.7979 26.302 46.5479 31.2 70.0469 31.2C70.9989 31.2 71.9409 31.189 72.8839 31.171L73.5679 31.157C74.4969 31.136 75.4219 31.11 76.3349 31.073L76.4329 31.069C77.3239 31.032 78.2029 30.986 79.0779 30.934L79.7149 30.896C80.5909 30.84 81.4599 30.78 82.3159 30.71C82.3939 30.707 82.4809 30.7 82.5719 30.688C83.3959 30.619 84.2079 30.542 85.0169 30.46L85.5689 30.403C86.4319 30.312 87.2859 30.214 88.1219 30.109L88.2289 30.095C89.0449 29.991 89.8459 29.879 90.6359 29.762L91.0859 29.695C91.9129 29.569 92.7279 29.438 93.5849 29.287C94.3689 29.149 95.1339 29.002 95.8899 28.851L96.2289 28.782C97.0119 28.622 97.7789 28.456 98.5579 28.275C99.2979 28.103 100.017 27.923 100.714 27.74L100.953 27.677C102.405 27.29 103.787 26.872 105.056 26.438L105.222 26.382C106.536 25.929 107.773 25.442 108.899 24.936C108.918 24.928 108.939 24.918 108.963 24.908C108.975 24.903 108.988 24.897 109 24.892C109.594 24.623 110.152 24.351 110.659 24.085C113.576 22.558 115.627 20.849 116.755 19.008C116.809 18.933 116.859 18.857 116.902 18.779C117.496 17.733 117.797 16.663 117.797 15.599C117.797 6.706 97.2689 0 70.0469 0Z" fill="#18E5EA" /><path d="M70.045 6.92121C91.994 6.92121 110.202 11.6022 113.689 17.7422C114.085 17.0452 114.301 16.3302 114.301 15.6002C114.301 8.44121 94.487 2.63721 70.045 2.63721C45.603 2.63721 25.7891 8.44121 25.7891 15.6002C25.7891 16.3302 26.0051 17.0452 26.4011 17.7422C29.8891 11.6022 48.096 6.92121 70.045 6.92121Z" fill="#C4C4C4" /><ellipse cx="70" cy="17.6" rx="43.2" ry="10.6" fill="#0A6F77"/><ellipse cx="70" cy="21" rx="36" ry="6.5" fill="#075A61" opacity=".7"/>`, milk:`<path d="M70.0471 6.9209C48.1101 6.9209 29.9122 11.5969 26.4102 17.7319C29.8842 23.8759 48.0872 28.5629 70.0471 28.5629C92.0071 28.5629 110.21 23.8759 113.684 17.7319C110.183 11.5969 91.9841 6.9209 70.0471 6.9209Z" fill="white" /><path d="M108.667 21.919C109.433 20.625 109.513 19.291 108.006 18.209C103.529 14.996 94.2492 17.88 83.5492 16.808C72.8492 15.737 85.7332 10.793 61.7122 10.189C50.6162 9.90997 39.4321 11.847 30.5721 14.027C28.5851 15.174 27.1592 16.419 26.4102 17.731C29.8842 23.875 48.0872 28.562 70.0471 28.562C86.6511 28.563 101.102 25.882 108.667 21.919Z" fill="white" />`, surf:``, front:``, cork:"", defs:``,
    mouthFill:{cx:70, cy:17.7, rx:43.6, ry:10.8},
    surfC:[70,17.7], yTop:15, yFill:15, yBot:88, xTop:[22,118], xBot:[35,108],
    lipR:[117.5,15.6], lipL:[22.5,15.6], mouth:[70,15.6] },
  wglass: { vb:[156,185], shift:[0,0],   /* "water glass.svg" */
    back:`<path opacity="0.3" d="M154.925 9.21693C154.925 9.15593 153.584 9.10594 151.155 9.06494C149.176 12.9799 118.071 16.0889 76.0022 16.0889C34.4212 16.0889 6.73217 13.0509 4.38517 9.20193C2.05617 9.21093 0.769171 9.21693 0.769171 9.21693C0.769171 9.21693 -3.59083 72.2969 8.45017 134.402C15.1042 168.306 15.1042 177.178 46.1562 181.931C63.2662 183.832 77.5252 183.832 77.5252 183.832H78.1682C78.1682 183.832 92.4272 183.832 109.537 181.931C140.589 177.178 140.589 168.306 147.243 134.402C159.285 72.2969 154.925 9.21693 154.925 9.21693Z" fill="url(#{U}p0_radial_28_11395)" /><path d="M114.914 173.328C114.914 176.779 97.8938 179.579 76.8988 179.579C55.9048 179.579 38.8828 176.779 38.8828 173.328C38.8828 169.877 55.9038 167.079 76.8988 167.079C97.8928 167.078 114.914 169.877 114.914 173.328Z" fill="url(#{U}p1_radial_28_11395)" /><path opacity="0.3" d="M95.3019 168.642C105.732 169.494 110.922 171.418 112.138 173.156C113.354 174.891 99.2939 178.711 80.3729 178.711C61.4529 178.711 43.5709 176.106 52.5989 175.065C61.6259 174.023 84.7089 176.629 95.3019 174.023C105.89 171.418 92.5229 169.163 84.0179 169.163C75.5119 169.163 86.7929 167.948 95.3019 168.642Z" fill="url(#{U}p2_radial_28_11395)" /><path opacity="0.3" d="M62.9298 178.494C52.4988 177.642 47.3058 175.718 46.0928 173.983C44.8768 172.246 58.9368 168.428 77.8578 168.428C96.7778 168.428 114.659 171.03 105.632 172.072C96.6048 173.112 73.5208 170.51 62.9298 173.112C52.3428 175.717 65.7068 177.974 74.2128 177.974C82.7178 177.975 71.4338 179.19 62.9298 178.494Z" fill="url(#{U}p3_radial_28_11395)" /><path opacity="0.3" d="M48.1693 167.6C48.1693 167.6 31.9453 170.631 32.4613 176.355C32.9803 182.082 66.4663 184.438 77.8563 184.438C89.2463 184.438 123.246 181.742 123.246 176.188C123.246 170.632 107.543 167.768 107.543 167.768C107.543 167.768 118.242 169.957 118.416 174.165C118.585 178.376 90.2813 181.997 77.4253 181.997C64.5673 181.997 36.6073 178.376 36.6073 173.996C36.6063 169.622 48.1693 167.6 48.1693 167.6Z" fill="url(#{U}p4_linear_28_11395)" /><path opacity="0.4" d="M43.9961 169.715C43.9961 169.715 44.2551 169.641 44.7481 169.533C45.2431 169.43 45.9641 169.248 46.9001 169.088C47.8321 168.908 48.9691 168.706 50.2841 168.518C50.9421 168.418 51.6371 168.302 52.3761 168.202C53.1181 168.113 53.8971 168.023 54.7111 167.928C56.3361 167.722 58.1081 167.573 59.9831 167.415C60.9221 167.339 61.8841 167.243 62.8711 167.179C63.8591 167.131 64.8691 167.079 65.8941 167.03C66.9201 166.979 67.9661 166.932 69.0241 166.879C70.0801 166.856 71.1531 166.835 72.2311 166.812C73.3111 166.794 74.3991 166.774 75.4921 166.755L77.1321 166.722L78.7841 166.745C80.9741 166.794 83.1611 166.847 85.3161 166.894C87.4741 167.017 89.5991 167.138 91.6531 167.254C93.7061 167.393 95.6761 167.621 97.5471 167.798C99.4191 167.99 101.17 168.259 102.796 168.462C104.417 168.675 105.885 168.96 107.195 169.175C108.496 169.409 109.618 169.655 110.55 169.837C112.398 170.243 113.43 170.533 113.43 170.533C113.43 170.533 113.166 170.477 112.668 170.376C112.167 170.287 111.434 170.158 110.502 169.991C109.562 169.849 108.427 169.652 107.114 169.473C105.796 169.318 104.321 169.094 102.701 168.918C101.075 168.759 99.3211 168.534 97.4551 168.39C95.5861 168.256 93.6161 168.11 91.5811 167.959C89.5421 167.862 87.4351 167.761 85.2911 167.656C83.1381 167.627 80.9481 167.596 78.7621 167.561L77.1331 167.525L75.4991 167.543C74.4111 167.553 73.3291 167.563 72.2541 167.576C71.1801 167.589 70.1131 167.604 69.0601 167.614C68.0091 167.655 66.9681 167.698 65.9471 167.737C64.9241 167.775 63.9171 167.811 62.9341 167.847C61.9521 167.883 60.9921 167.956 60.0561 168.006C58.1851 168.114 56.4131 168.221 54.7871 168.384C53.1591 168.528 51.6671 168.654 50.3511 168.815C49.0291 168.951 47.8841 169.105 46.9451 169.243C45.0601 169.502 43.9961 169.715 43.9961 169.715Z" fill="url(#{U}p5_linear_28_11395)" />`, milk:`<g opacity=".9"><path fill="url(#{U}lq)" d="M154.925 9.21693C154.925 9.15593 153.584 9.10594 151.155 9.06494C149.176 12.9799 118.071 16.0889 76.0022 16.0889C34.4212 16.0889 6.73217 13.0509 4.38517 9.20193C2.05617 9.21093 0.769171 9.21693 0.769171 9.21693C0.769171 9.21693 -3.59083 72.2969 8.45017 134.402C15.1042 168.306 15.1042 177.178 46.1562 181.931C63.2662 183.832 77.5252 183.832 77.5252 183.832H78.1682C78.1682 183.832 92.4272 183.832 109.537 181.931C140.589 177.178 140.589 168.306 147.243 134.402C159.285 72.2969 154.925 9.21693 154.925 9.21693Z"/><path fill="url(#{U}dp)" d="M154.925 9.21693C154.925 9.15593 153.584 9.10594 151.155 9.06494C149.176 12.9799 118.071 16.0889 76.0022 16.0889C34.4212 16.0889 6.73217 13.0509 4.38517 9.20193C2.05617 9.21093 0.769171 9.21693 0.769171 9.21693C0.769171 9.21693 -3.59083 72.2969 8.45017 134.402C15.1042 168.306 15.1042 177.178 46.1562 181.931C63.2662 183.832 77.5252 183.832 77.5252 183.832H78.1682C78.1682 183.832 92.4272 183.832 109.537 181.931C140.589 177.178 140.589 168.306 147.243 134.402C159.285 72.2969 154.925 9.21693 154.925 9.21693Z"/></g>`, surf:`<ellipse cx="77.8" cy="40" rx="76.5" ry="7.5" fill="#CDEEFF" stroke="#7FB9E0" stroke-width=".8"/>`, front:`<path d="M32.7962 169.547C22.3682 171.502 15.6252 159.546 9.33317 121.968C2.61617 76.5609 4.31617 27.4009 5.12017 11.5389C4.62317 11.3109 4.14317 11.0429 3.69117 10.7129C3.12117 10.2979 2.56417 9.83493 2.13017 9.27493C2.11417 9.25393 2.09817 9.23194 2.08217 9.21094C1.23117 9.21494 0.769171 9.21693 0.769171 9.21693C0.769171 9.21693 -3.59083 72.2969 8.45017 134.402C15.1042 168.306 15.1042 177.178 46.1562 181.931C46.3742 181.955 46.5912 181.978 46.8082 182.001C52.6882 182.289 63.2842 183.09 63.2842 183.09L63.1202 167.281C63.1202 167.281 43.2242 167.592 32.7962 169.547Z" fill="url(#{U}p6_linear_28_11395)" /><path d="M154.925 9.21706C154.925 9.17306 154.24 9.13505 152.969 9.10205C152.753 9.46005 152.506 9.79606 152.259 10.0991C151.633 10.8671 150.838 11.4901 149.932 11.8931C149.927 11.8951 149.922 11.8971 149.916 11.8991C150.727 28.1441 152.351 76.908 145.685 121.968C139.393 159.545 132.65 171.502 122.222 169.547C111.794 167.592 93.8008 167.609 93.8008 167.609V182.925C93.8008 182.925 102.905 182.294 109.502 181.934C109.514 181.933 109.526 181.931 109.539 181.93C140.591 177.177 140.591 168.305 147.245 134.401C159.285 72.2971 154.925 9.21706 154.925 9.21706Z" fill="url(#{U}p7_linear_28_11395)" /><path opacity="0.36" d="M108.295 118.559C108.295 157.533 97.8389 164.3 93.0859 165.251C93.0859 165.251 113.524 167.039 115.9 143.274C117.848 123.791 117.561 43.2959 117.393 14.9219C114.506 15.1049 111.467 15.2679 108.295 15.4119C108.295 36.1729 108.295 87.9289 108.295 118.559Z" fill="url(#{U}p8_linear_28_11395)" /><path opacity="0.21" d="M64.9126 121.41C64.9126 160.384 75.2816 165.137 80.0346 166.087C80.0346 166.087 59.6846 169.889 57.3086 146.125C55.3606 126.642 55.6486 46.1469 55.8156 17.7729C58.7026 17.9559 61.7416 18.119 64.9136 18.263C64.9126 39.025 64.9126 90.781 64.9126 121.41Z" fill="url(#{U}p9_linear_28_11395)" /><path opacity="0.6" d="M132.533 101.448C131.228 126.676 127.128 163.832 111.508 181.615C119.185 180.339 124.849 178.758 129.142 176.512C141.609 157.406 145.126 124.463 146.317 101.448C147.549 77.6398 147.007 25.1188 146.837 11.2388C143.722 12.1068 139.045 12.8978 133.082 13.5788C133.272 30.2518 133.703 78.8188 132.533 101.448Z" fill="url(#{U}p10_linear_28_11395)" /><path d="M4.61072 15.2231C4.15872 39.0161 4.51272 62.8452 6.02672 86.5952C7.21072 104.384 8.95271 122.207 12.7877 139.641C14.0717 145.444 15.6097 151.208 17.7407 156.77C9.20372 134.454 7.13571 110.281 5.31371 86.6411C3.85971 62.8671 3.61172 39.0191 4.61072 15.2231Z" fill="#B3A9A9" /><path d="M150.669 15.3857C151.121 39.1797 150.767 63.0077 149.253 86.7577C148.069 104.547 146.327 122.37 142.492 139.804C141.208 145.607 139.67 151.371 137.539 156.933C146.076 134.617 148.144 110.444 149.965 86.8037C151.421 63.0297 151.668 39.1827 150.669 15.3857Z" fill="#B3A9A9" /><path d="M3.34026 11.858C3.34026 11.858 2.16427 35.716 3.19227 66.039C3.19227 66.039 1.29126 51.067 1.52826 33.125C1.76626 15.183 2.19626 11.186 2.19626 11.186L3.34026 11.858Z" fill="white" /><path d="M152.605 11.858C152.605 11.858 153.781 35.716 152.753 66.039C152.753 66.039 154.654 51.067 154.416 33.125C154.178 15.183 153.747 11.186 153.747 11.186L152.605 11.858Z" fill="white" /><g opacity="0.7"> <path opacity="0.6" d="M52.2081 78.1587C52.2081 53.1667 52.2081 29.2127 52.2081 15.7227C44.8081 15.4807 38.1201 15.1267 32.2461 14.6797C32.2461 27.9517 32.2461 52.5077 32.2461 78.1587C32.2461 102.015 32.4381 135.587 36.3341 160.588C39.0591 161.783 45.6891 164.14 57.0361 165.006C52.4191 139.667 52.2081 103.448 52.2081 78.1587Z" fill="url(#{U}p11_linear_28_11395)" /> </g><path d="M76.1106 0C30.5896 0 0.640625 4.126 0.640625 9.217C0.640625 14.305 30.5896 18.431 76.1106 18.431C121.631 18.431 155.058 14.305 155.058 9.217C155.058 4.126 121.631 0 76.1106 0ZM76.0036 16.089C32.5186 16.089 4.22162 12.767 4.22162 8.668C4.22162 4.568 32.5176 1.246 76.0036 1.246C119.488 1.246 151.259 4.568 151.259 8.668C151.259 12.767 119.488 16.089 76.0036 16.089Z" fill="url(#{U}p12_linear_28_11395)" /><path opacity="0.5" d="M76.1117 1.75578C117.976 1.75578 148.724 5.01579 151.299 9.13779C151.4 8.97179 151.47 8.80678 151.47 8.63878C151.47 4.28578 119.651 0.758789 76.1107 0.758789C32.5637 0.758789 4.22266 4.28578 4.22266 8.63878C4.22266 8.80678 4.29366 8.97279 4.39766 9.13779C6.97066 5.01579 34.2437 1.75578 76.1117 1.75578Z" fill="url(#{U}p13_linear_28_11395)" /><path d="M149.047 11.1472C139.767 13.8322 116.991 16.5412 76.1103 16.5412C24.6403 16.5412 2.8003 12.6392 2.8003 8.93716C2.8003 8.69516 3.0093 8.46617 3.0233 8.32617C1.6763 9.31117 2.4433 10.7622 3.9053 11.6262C9.3143 14.2112 19.6883 17.7002 76.4753 17.7002C112.759 17.7002 150.469 14.6762 152.299 10.0682C151.396 10.5602 150.157 10.9342 149.047 11.1472Z" fill="url(#{U}p14_radial_28_11395)" /><path d="M153.373 9.14612C153.331 9.16512 153.445 8.66712 152.68 8.02312C151.928 7.38612 150.41 6.70212 148.312 6.11212C144.121 4.90812 137.733 3.91112 130.021 3.06512C114.57 1.38412 97.1445 0.518122 76.2735 0.556122C55.3965 0.518122 41.4505 1.38512 25.9975 3.06512C18.2835 3.91312 11.8975 4.90712 7.70353 6.11212C5.61153 6.70212 4.08953 7.38612 3.33753 8.02312C2.57253 8.66812 2.68853 9.16312 2.64453 9.14612C2.68853 9.16312 2.56053 8.66812 3.31453 8.01212C4.05753 7.36312 5.57453 6.66213 7.65953 6.05013C11.8475 4.81213 18.2125 3.70912 25.9405 2.84612C41.4065 1.11012 55.3685 0.171113 76.2695 0.141113C97.1715 0.172113 114.608 1.11012 130.076 2.84612C137.805 3.71012 144.171 4.81213 148.357 6.05013C150.444 6.66213 151.96 7.36312 152.704 8.01212C153.457 8.67012 153.328 9.16312 153.373 9.14612Z" fill="white" /><path d="M7.87696 6.25279C7.87696 6.25279 7.22696 6.4538 6.04796 6.8868C5.47096 7.1058 4.74896 7.3858 4.00696 7.7868C3.29996 8.1718 2.38896 8.8158 3.09896 9.5238C3.72196 10.1758 4.98996 10.6358 6.33196 11.0388C7.70096 11.4368 9.25196 11.7728 10.933 12.0768C14.297 12.6768 18.166 13.1978 22.417 13.6368C26.668 14.0668 31.304 14.4468 36.211 14.7948C41.119 15.1278 46.305 15.4538 51.684 15.6968C57.06 15.9538 62.629 16.1128 68.284 16.1998C73.945 16.2838 72.741 16.2748 78.491 16.2128C84.24 16.1508 91.376 16.0358 97.029 15.8658C102.681 15.7098 108.24 15.4998 113.61 15.2298C118.979 14.9608 119.301 14.6648 124.202 14.2818C129.101 13.8938 133.721 13.4788 137.946 12.9508C142.154 12.4058 146.04 11.8178 149.143 10.8228C149.9 10.5618 150.621 10.2728 151.125 9.8988C151.663 9.5338 151.78 9.0478 151.464 8.6328C150.829 7.7978 149.545 7.3048 148.499 6.9008C146.303 6.1178 144.394 5.7388 143.118 5.4738C141.828 5.2188 141.128 5.1088 141.128 5.1088L141.148 5.0498C141.148 5.0498 141.858 5.1428 143.162 5.3688C144.46 5.6038 146.393 5.93879 148.677 6.68179C149.776 7.07879 151.114 7.5328 151.9 8.5018C152.077 8.7548 152.181 9.0278 152.114 9.3378C152.045 9.6398 151.805 9.9038 151.521 10.1218C150.943 10.5628 150.189 10.8698 149.406 11.1548C146.216 12.2258 142.328 12.8578 138.104 13.4608C133.865 14.0438 129.236 14.5368 124.316 14.9148C119.397 15.3038 119.068 15.6348 113.681 15.8808C108.298 16.1198 102.724 16.3038 97.062 16.4258C91.396 16.5318 84.25 16.5798 78.497 16.5728C72.737 16.5628 73.938 16.4928 68.278 16.4008C62.614 16.3078 57.045 16.1718 51.657 16.0148C46.267 15.8458 41.057 15.6368 36.129 15.3218C31.199 15.0158 26.555 14.6288 22.29 14.1518C18.026 13.6768 14.132 13.1608 10.753 12.4868C9.06396 12.1548 7.50396 11.7878 6.10796 11.3618C4.74396 10.9168 3.43096 10.4518 2.71996 9.66679C2.56596 9.48279 2.43496 9.2148 2.44596 9.0338C2.44896 8.7978 2.53996 8.58879 2.70496 8.42079C3.01296 8.07379 3.43296 7.8388 3.82396 7.6398C4.61996 7.2448 5.36096 6.9848 5.96096 6.7798C7.17096 6.3788 7.83396 6.1978 7.83396 6.1978L7.87696 6.25279Z" fill="url(#{U}p15_linear_28_11395)" /><path opacity="0.3" d="M76.0047 1.24609C32.5197 1.24609 4.22266 4.56809 4.22266 8.66809C4.22266 12.7671 32.5187 16.0891 76.0047 16.0891C119.489 16.0891 151.26 12.7671 151.26 8.66809C151.26 4.56809 119.489 1.24609 76.0047 1.24609Z" fill="url(#{U}p16_radial_28_11395)" />`, cork:"", defs:` <radialGradient id="{U}p0_radial_28_11395" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(78.8241 23.5005) scale(188.888)"> <stop offset="0.0996" stop-color="white" /> <stop offset="1" /> </radialGradient> <radialGradient id="{U}p1_radial_28_11395" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(77.7673 38.0128) scale(154.159 154.159)"> <stop offset="0.9089" stop-color="white" /> <stop offset="0.92" stop-color="#D3D3D2" /> <stop offset="0.9408" stop-color="#868582" /> <stop offset="0.9556" stop-color="#565550" /> <stop offset="0.9629" stop-color="#43423D" /> <stop offset="1" stop-color="#2B2728" /> </radialGradient> <radialGradient id="{U}p2_radial_28_11395" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(77.5963 133.406) scale(50.4149 50.4149)"> <stop offset="0.1825" stop-color="#DBDEDB" /> <stop offset="0.6803" stop-color="#BCC0C1" /> <stop offset="0.7218" stop-color="#A7ABAC" /> <stop offset="0.8078" stop-color="#727475" /> <stop offset="0.9299" stop-color="#1D1E1E" /> <stop offset="0.9699" /> </radialGradient> <radialGradient id="{U}p3_radial_28_11395" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(96.3401 176.455) scale(54.3974 54.3973)"> <stop offset="0.1825" stop-color="#DBDEDB" /> <stop offset="0.6803" stop-color="#BCC0C1" /> <stop offset="0.7218" stop-color="#A7ABAC" /> <stop offset="0.8078" stop-color="#727475" /> <stop offset="0.9299" stop-color="#1D1E1E" /> <stop offset="0.9699" /> </radialGradient> <linearGradient id="{U}p4_linear_28_11395" x1="32.449" y1="176.018" x2="123.246" y2="176.018" gradientUnits="userSpaceOnUse"> <stop offset="0.02" stop-color="#3D3D3D" /> <stop offset="0.0489" stop-color="#434343" /> <stop offset="0.0885" stop-color="#555555" /> <stop offset="0.1341" stop-color="#727272" /> <stop offset="0.1534" stop-color="#808080" /> <stop offset="0.2909" stop-color="#838383" /> <stop offset="0.3176" stop-color="#ACACAC" /> <stop offset="0.3507" stop-color="#D9D9D9" /> <stop offset="0.3764" stop-color="#F5F5F5" /> <stop offset="0.3913" stop-color="white" /> <stop offset="0.5341" stop-color="#838383" /> <stop offset="0.7086" stop-color="#808080" /> <stop offset="0.7668" stop-color="#6E6E6E" /> <stop offset="0.8461" stop-color="#4E4E4E" /> <stop offset="0.9237" stop-color="#3A3A3A" /> <stop offset="0.936" stop-color="#363636" /> <stop offset="0.9606" stop-color="#2F2F2F" /> <stop offset="0.9984" stop-color="#292929" /> </linearGradient> <linearGradient id="{U}p5_linear_28_11395" x1="43.8438" y1="168.627" x2="113.595" y2="168.627" gradientUnits="userSpaceOnUse"> <stop offset="0.02" stop-color="#3D3D3D" /> <stop offset="0.0489" stop-color="#434343" /> <stop offset="0.0885" stop-color="#555555" /> <stop offset="0.1341" stop-color="#727272" /> <stop offset="0.1534" stop-color="#808080" /> <stop offset="0.2909" stop-color="#838383" /> <stop offset="0.3176" stop-color="#ACACAC" /> <stop offset="0.3507" stop-color="#D9D9D9" /> <stop offset="0.3764" stop-color="#F5F5F5" /> <stop offset="0.3913" stop-color="white" /> <stop offset="0.5341" stop-color="#838383" /> <stop offset="0.7086" stop-color="#808080" /> <stop offset="0.7668" stop-color="#6E6E6E" /> <stop offset="0.8461" stop-color="#4E4E4E" /> <stop offset="0.9237" stop-color="#3A3A3A" /> <stop offset="0.936" stop-color="#363636" /> <stop offset="0.9606" stop-color="#2F2F2F" /> <stop offset="0.9984" stop-color="#292929" /> </linearGradient> <linearGradient id="{U}p6_linear_28_11395" x1="3.61867" y1="98.9941" x2="35.3381" y2="95.8222" gradientUnits="userSpaceOnUse"> <stop offset="0.0081" stop-color="#BCC0C1" /> <stop offset="0.0181" stop-color="#A8ACAC" /> <stop offset="0.0387" stop-color="#747776" /> <stop offset="0.0539" stop-color="#4B4D4A" /> <stop offset="0.4561" stop-color="#DBDEDB" /> <stop offset="0.5918" stop-color="white" /> <stop offset="0.5932" stop-color="white" /> <stop offset="0.9635" stop-color="white" /> <stop offset="0.994" stop-color="white" /> </linearGradient> <linearGradient id="{U}p7_linear_28_11395" x1="158.458" y1="98.7653" x2="129.381" y2="96.4576" gradientUnits="userSpaceOnUse"> <stop offset="0.0081" stop-color="#BCC0C1" /> <stop offset="0.0181" stop-color="#A8ACAC" /> <stop offset="0.0387" stop-color="#747776" /> <stop offset="0.0539" stop-color="#4B4D4A" /> <stop offset="0.4561" stop-color="#DBDEDB" /> <stop offset="0.5918" stop-color="white" /> <stop offset="0.5932" stop-color="white" /> <stop offset="0.9635" stop-color="white" /> <stop offset="0.994" stop-color="white" /> </linearGradient> <linearGradient id="{U}p8_linear_28_11395" x1="105.299" y1="40.8425" x2="105.299" y2="155.992" gradientUnits="userSpaceOnUse"> <stop offset="0.087" stop-color="white" /> <stop offset="0.9749" /> </linearGradient> <linearGradient id="{U}p9_linear_28_11395" x1="67.8646" y1="49.853" x2="67.8646" y2="173.941" gradientUnits="userSpaceOnUse"> <stop offset="0.087" stop-color="white" /> <stop offset="0.9749" /> </linearGradient> <linearGradient id="{U}p10_linear_28_11395" x1="134.962" y1="96.0409" x2="206.255" y2="91.288" gradientUnits="userSpaceOnUse"> <stop offset="0.2895" stop-color="white" /> <stop offset="0.9749" /> </linearGradient> <linearGradient id="{U}p11_linear_28_11395" x1="44.6407" y1="54.6022" x2="44.6407" y2="174.057" gradientUnits="userSpaceOnUse"> <stop offset="0.2895" stop-color="white" /> <stop offset="0.9749" /> </linearGradient> <linearGradient id="{U}p12_linear_28_11395" x1="0.640125" y1="9.2155" x2="158.218" y2="9.2155" gradientUnits="userSpaceOnUse"> <stop stop-color="#797677" /> <stop offset="0.0158" stop-color="#7E7B7C" /> <stop offset="0.3776" stop-color="#E3E3E3" /> <stop offset="0.4928" stop-color="#BCBBBC" /> <stop offset="0.7389" stop-color="#6F6C6D" /> <stop offset="0.9139" stop-color="#3E3A3B" /> <stop offset="1" stop-color="#2B2728" /> </linearGradient> <linearGradient id="{U}p13_linear_28_11395" x1="4.22316" y1="4.94849" x2="151.47" y2="4.94849" gradientUnits="userSpaceOnUse"> <stop stop-color="#797677" /> <stop offset="1" stop-color="#2B2728" /> </linearGradient> <radialGradient id="{U}p14_radial_28_11395" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(77.1572 12.7856) scale(53.8909 35.5643)"> <stop offset="0.198" stop-color="white" /> <stop offset="0.2923" stop-color="#F9F8F9" /> <stop offset="0.4246" stop-color="#E7E6E6" /> <stop offset="0.5793" stop-color="#C9C8C9" /> <stop offset="0.7509" stop-color="#A09F9F" /> <stop offset="0.9345" stop-color="#6C6A6B" /> <stop offset="1" stop-color="#585556" /> </radialGradient> <linearGradient id="{U}p15_linear_28_11395" x1="2.44666" y1="10.811" x2="152.135" y2="10.811" gradientUnits="userSpaceOnUse"> <stop stop-color="#797677" /> <stop offset="1" stop-color="#2B2728" /> </linearGradient> <radialGradient id="{U}p16_radial_28_11395" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(65.8077 -25.5349) scale(185.753 185.753)"> <stop offset="0.0996" stop-color="white" /> <stop offset="1" /> </radialGradient> <linearGradient id="{U}lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7CC4F0"/><stop offset=".35" stop-color="#B4E3FC"/><stop offset=".8" stop-color="#8ACDF5"/><stop offset="1" stop-color="#63AEE3"/></linearGradient><linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B4F8A" stop-opacity="0"/><stop offset=".55" stop-color="#0B4F8A" stop-opacity=".06"/><stop offset="1" stop-color="#0B4F8A" stop-opacity=".2"/></linearGradient>`,
    poly:[[4.8,9.7],[0.3,20.1],[0,35.3],[0.6,65.6],[2.9,95.9],[6.9,126],[12.8,155.7],[18.6,169.7],[30.7,178.3],[45.5,181.8],[75.7,183.8],[106,182.3],[120.9,179.6],[134.4,172.9],[141.7,159.8],[148,130.1],[152.4,100.1],[154.8,69.9],[155.7,39.5],[155.5,24.4],[154.9,9.2],[78,16]],
    surfC:[77.8,40], yTop:10, yFill:30, yBot:183.8, xTop:[1,155], xBot:[46,106],
    lipR:[155,9.2], lipL:[1,9.2], mouth:[78,12] },
  wglassMilk: { vb:[156,185], shift:[0,0],   /* "water glass.svg" filled with milk (page 4) */
    back:`<path opacity="0.3" d="M154.925 9.21693C154.925 9.15593 153.584 9.10594 151.155 9.06494C149.176 12.9799 118.071 16.0889 76.0022 16.0889C34.4212 16.0889 6.73217 13.0509 4.38517 9.20193C2.05617 9.21093 0.769171 9.21693 0.769171 9.21693C0.769171 9.21693 -3.59083 72.2969 8.45017 134.402C15.1042 168.306 15.1042 177.178 46.1562 181.931C63.2662 183.832 77.5252 183.832 77.5252 183.832H78.1682C78.1682 183.832 92.4272 183.832 109.537 181.931C140.589 177.178 140.589 168.306 147.243 134.402C159.285 72.2969 154.925 9.21693 154.925 9.21693Z" fill="url(#{U}p0_radial_28_11395)" /><path d="M114.914 173.328C114.914 176.779 97.8938 179.579 76.8988 179.579C55.9048 179.579 38.8828 176.779 38.8828 173.328C38.8828 169.877 55.9038 167.079 76.8988 167.079C97.8928 167.078 114.914 169.877 114.914 173.328Z" fill="url(#{U}p1_radial_28_11395)" /><path opacity="0.3" d="M95.3019 168.642C105.732 169.494 110.922 171.418 112.138 173.156C113.354 174.891 99.2939 178.711 80.3729 178.711C61.4529 178.711 43.5709 176.106 52.5989 175.065C61.6259 174.023 84.7089 176.629 95.3019 174.023C105.89 171.418 92.5229 169.163 84.0179 169.163C75.5119 169.163 86.7929 167.948 95.3019 168.642Z" fill="url(#{U}p2_radial_28_11395)" /><path opacity="0.3" d="M62.9298 178.494C52.4988 177.642 47.3058 175.718 46.0928 173.983C44.8768 172.246 58.9368 168.428 77.8578 168.428C96.7778 168.428 114.659 171.03 105.632 172.072C96.6048 173.112 73.5208 170.51 62.9298 173.112C52.3428 175.717 65.7068 177.974 74.2128 177.974C82.7178 177.975 71.4338 179.19 62.9298 178.494Z" fill="url(#{U}p3_radial_28_11395)" /><path opacity="0.3" d="M48.1693 167.6C48.1693 167.6 31.9453 170.631 32.4613 176.355C32.9803 182.082 66.4663 184.438 77.8563 184.438C89.2463 184.438 123.246 181.742 123.246 176.188C123.246 170.632 107.543 167.768 107.543 167.768C107.543 167.768 118.242 169.957 118.416 174.165C118.585 178.376 90.2813 181.997 77.4253 181.997C64.5673 181.997 36.6073 178.376 36.6073 173.996C36.6063 169.622 48.1693 167.6 48.1693 167.6Z" fill="url(#{U}p4_linear_28_11395)" /><path opacity="0.4" d="M43.9961 169.715C43.9961 169.715 44.2551 169.641 44.7481 169.533C45.2431 169.43 45.9641 169.248 46.9001 169.088C47.8321 168.908 48.9691 168.706 50.2841 168.518C50.9421 168.418 51.6371 168.302 52.3761 168.202C53.1181 168.113 53.8971 168.023 54.7111 167.928C56.3361 167.722 58.1081 167.573 59.9831 167.415C60.9221 167.339 61.8841 167.243 62.8711 167.179C63.8591 167.131 64.8691 167.079 65.8941 167.03C66.9201 166.979 67.9661 166.932 69.0241 166.879C70.0801 166.856 71.1531 166.835 72.2311 166.812C73.3111 166.794 74.3991 166.774 75.4921 166.755L77.1321 166.722L78.7841 166.745C80.9741 166.794 83.1611 166.847 85.3161 166.894C87.4741 167.017 89.5991 167.138 91.6531 167.254C93.7061 167.393 95.6761 167.621 97.5471 167.798C99.4191 167.99 101.17 168.259 102.796 168.462C104.417 168.675 105.885 168.96 107.195 169.175C108.496 169.409 109.618 169.655 110.55 169.837C112.398 170.243 113.43 170.533 113.43 170.533C113.43 170.533 113.166 170.477 112.668 170.376C112.167 170.287 111.434 170.158 110.502 169.991C109.562 169.849 108.427 169.652 107.114 169.473C105.796 169.318 104.321 169.094 102.701 168.918C101.075 168.759 99.3211 168.534 97.4551 168.39C95.5861 168.256 93.6161 168.11 91.5811 167.959C89.5421 167.862 87.4351 167.761 85.2911 167.656C83.1381 167.627 80.9481 167.596 78.7621 167.561L77.1331 167.525L75.4991 167.543C74.4111 167.553 73.3291 167.563 72.2541 167.576C71.1801 167.589 70.1131 167.604 69.0601 167.614C68.0091 167.655 66.9681 167.698 65.9471 167.737C64.9241 167.775 63.9171 167.811 62.9341 167.847C61.9521 167.883 60.9921 167.956 60.0561 168.006C58.1851 168.114 56.4131 168.221 54.7871 168.384C53.1591 168.528 51.6671 168.654 50.3511 168.815C49.0291 168.951 47.8841 169.105 46.9451 169.243C45.0601 169.502 43.9961 169.715 43.9961 169.715Z" fill="url(#{U}p5_linear_28_11395)" />`, milk:`<g opacity="1"><path fill="url(#{U}lq)" d="M154.925 9.21693C154.925 9.15593 153.584 9.10594 151.155 9.06494C149.176 12.9799 118.071 16.0889 76.0022 16.0889C34.4212 16.0889 6.73217 13.0509 4.38517 9.20193C2.05617 9.21093 0.769171 9.21693 0.769171 9.21693C0.769171 9.21693 -3.59083 72.2969 8.45017 134.402C15.1042 168.306 15.1042 177.178 46.1562 181.931C63.2662 183.832 77.5252 183.832 77.5252 183.832H78.1682C78.1682 183.832 92.4272 183.832 109.537 181.931C140.589 177.178 140.589 168.306 147.243 134.402C159.285 72.2969 154.925 9.21693 154.925 9.21693Z"/><path fill="url(#{U}dp)" d="M154.925 9.21693C154.925 9.15593 153.584 9.10594 151.155 9.06494C149.176 12.9799 118.071 16.0889 76.0022 16.0889C34.4212 16.0889 6.73217 13.0509 4.38517 9.20193C2.05617 9.21093 0.769171 9.21693 0.769171 9.21693C0.769171 9.21693 -3.59083 72.2969 8.45017 134.402C15.1042 168.306 15.1042 177.178 46.1562 181.931C63.2662 183.832 77.5252 183.832 77.5252 183.832H78.1682C78.1682 183.832 92.4272 183.832 109.537 181.931C140.589 177.178 140.589 168.306 147.243 134.402C159.285 72.2969 154.925 9.21693 154.925 9.21693Z"/></g>`, surf:`<ellipse cx="77.8" cy="40" rx="76.5" ry="7.5" fill="#FFFFFF" stroke="#E4DED0" stroke-width=".8"/>`, front:`<path d="M32.7962 169.547C22.3682 171.502 15.6252 159.546 9.33317 121.968C2.61617 76.5609 4.31617 27.4009 5.12017 11.5389C4.62317 11.3109 4.14317 11.0429 3.69117 10.7129C3.12117 10.2979 2.56417 9.83493 2.13017 9.27493C2.11417 9.25393 2.09817 9.23194 2.08217 9.21094C1.23117 9.21494 0.769171 9.21693 0.769171 9.21693C0.769171 9.21693 -3.59083 72.2969 8.45017 134.402C15.1042 168.306 15.1042 177.178 46.1562 181.931C46.3742 181.955 46.5912 181.978 46.8082 182.001C52.6882 182.289 63.2842 183.09 63.2842 183.09L63.1202 167.281C63.1202 167.281 43.2242 167.592 32.7962 169.547Z" fill="url(#{U}p6_linear_28_11395)" /><path d="M154.925 9.21706C154.925 9.17306 154.24 9.13505 152.969 9.10205C152.753 9.46005 152.506 9.79606 152.259 10.0991C151.633 10.8671 150.838 11.4901 149.932 11.8931C149.927 11.8951 149.922 11.8971 149.916 11.8991C150.727 28.1441 152.351 76.908 145.685 121.968C139.393 159.545 132.65 171.502 122.222 169.547C111.794 167.592 93.8008 167.609 93.8008 167.609V182.925C93.8008 182.925 102.905 182.294 109.502 181.934C109.514 181.933 109.526 181.931 109.539 181.93C140.591 177.177 140.591 168.305 147.245 134.401C159.285 72.2971 154.925 9.21706 154.925 9.21706Z" fill="url(#{U}p7_linear_28_11395)" /><path opacity="0.36" d="M108.295 118.559C108.295 157.533 97.8389 164.3 93.0859 165.251C93.0859 165.251 113.524 167.039 115.9 143.274C117.848 123.791 117.561 43.2959 117.393 14.9219C114.506 15.1049 111.467 15.2679 108.295 15.4119C108.295 36.1729 108.295 87.9289 108.295 118.559Z" fill="url(#{U}p8_linear_28_11395)" /><path opacity="0.21" d="M64.9126 121.41C64.9126 160.384 75.2816 165.137 80.0346 166.087C80.0346 166.087 59.6846 169.889 57.3086 146.125C55.3606 126.642 55.6486 46.1469 55.8156 17.7729C58.7026 17.9559 61.7416 18.119 64.9136 18.263C64.9126 39.025 64.9126 90.781 64.9126 121.41Z" fill="url(#{U}p9_linear_28_11395)" /><path opacity="0.6" d="M132.533 101.448C131.228 126.676 127.128 163.832 111.508 181.615C119.185 180.339 124.849 178.758 129.142 176.512C141.609 157.406 145.126 124.463 146.317 101.448C147.549 77.6398 147.007 25.1188 146.837 11.2388C143.722 12.1068 139.045 12.8978 133.082 13.5788C133.272 30.2518 133.703 78.8188 132.533 101.448Z" fill="url(#{U}p10_linear_28_11395)" /><path d="M4.61072 15.2231C4.15872 39.0161 4.51272 62.8452 6.02672 86.5952C7.21072 104.384 8.95271 122.207 12.7877 139.641C14.0717 145.444 15.6097 151.208 17.7407 156.77C9.20372 134.454 7.13571 110.281 5.31371 86.6411C3.85971 62.8671 3.61172 39.0191 4.61072 15.2231Z" fill="#B3A9A9" /><path d="M150.669 15.3857C151.121 39.1797 150.767 63.0077 149.253 86.7577C148.069 104.547 146.327 122.37 142.492 139.804C141.208 145.607 139.67 151.371 137.539 156.933C146.076 134.617 148.144 110.444 149.965 86.8037C151.421 63.0297 151.668 39.1827 150.669 15.3857Z" fill="#B3A9A9" /><path d="M3.34026 11.858C3.34026 11.858 2.16427 35.716 3.19227 66.039C3.19227 66.039 1.29126 51.067 1.52826 33.125C1.76626 15.183 2.19626 11.186 2.19626 11.186L3.34026 11.858Z" fill="white" /><path d="M152.605 11.858C152.605 11.858 153.781 35.716 152.753 66.039C152.753 66.039 154.654 51.067 154.416 33.125C154.178 15.183 153.747 11.186 153.747 11.186L152.605 11.858Z" fill="white" /><g opacity="0.7"> <path opacity="0.6" d="M52.2081 78.1587C52.2081 53.1667 52.2081 29.2127 52.2081 15.7227C44.8081 15.4807 38.1201 15.1267 32.2461 14.6797C32.2461 27.9517 32.2461 52.5077 32.2461 78.1587C32.2461 102.015 32.4381 135.587 36.3341 160.588C39.0591 161.783 45.6891 164.14 57.0361 165.006C52.4191 139.667 52.2081 103.448 52.2081 78.1587Z" fill="url(#{U}p11_linear_28_11395)" /> </g><path d="M76.1106 0C30.5896 0 0.640625 4.126 0.640625 9.217C0.640625 14.305 30.5896 18.431 76.1106 18.431C121.631 18.431 155.058 14.305 155.058 9.217C155.058 4.126 121.631 0 76.1106 0ZM76.0036 16.089C32.5186 16.089 4.22162 12.767 4.22162 8.668C4.22162 4.568 32.5176 1.246 76.0036 1.246C119.488 1.246 151.259 4.568 151.259 8.668C151.259 12.767 119.488 16.089 76.0036 16.089Z" fill="url(#{U}p12_linear_28_11395)" /><path opacity="0.5" d="M76.1117 1.75578C117.976 1.75578 148.724 5.01579 151.299 9.13779C151.4 8.97179 151.47 8.80678 151.47 8.63878C151.47 4.28578 119.651 0.758789 76.1107 0.758789C32.5637 0.758789 4.22266 4.28578 4.22266 8.63878C4.22266 8.80678 4.29366 8.97279 4.39766 9.13779C6.97066 5.01579 34.2437 1.75578 76.1117 1.75578Z" fill="url(#{U}p13_linear_28_11395)" /><path d="M149.047 11.1472C139.767 13.8322 116.991 16.5412 76.1103 16.5412C24.6403 16.5412 2.8003 12.6392 2.8003 8.93716C2.8003 8.69516 3.0093 8.46617 3.0233 8.32617C1.6763 9.31117 2.4433 10.7622 3.9053 11.6262C9.3143 14.2112 19.6883 17.7002 76.4753 17.7002C112.759 17.7002 150.469 14.6762 152.299 10.0682C151.396 10.5602 150.157 10.9342 149.047 11.1472Z" fill="url(#{U}p14_radial_28_11395)" /><path d="M153.373 9.14612C153.331 9.16512 153.445 8.66712 152.68 8.02312C151.928 7.38612 150.41 6.70212 148.312 6.11212C144.121 4.90812 137.733 3.91112 130.021 3.06512C114.57 1.38412 97.1445 0.518122 76.2735 0.556122C55.3965 0.518122 41.4505 1.38512 25.9975 3.06512C18.2835 3.91312 11.8975 4.90712 7.70353 6.11212C5.61153 6.70212 4.08953 7.38612 3.33753 8.02312C2.57253 8.66812 2.68853 9.16312 2.64453 9.14612C2.68853 9.16312 2.56053 8.66812 3.31453 8.01212C4.05753 7.36312 5.57453 6.66213 7.65953 6.05013C11.8475 4.81213 18.2125 3.70912 25.9405 2.84612C41.4065 1.11012 55.3685 0.171113 76.2695 0.141113C97.1715 0.172113 114.608 1.11012 130.076 2.84612C137.805 3.71012 144.171 4.81213 148.357 6.05013C150.444 6.66213 151.96 7.36312 152.704 8.01212C153.457 8.67012 153.328 9.16312 153.373 9.14612Z" fill="white" /><path d="M7.87696 6.25279C7.87696 6.25279 7.22696 6.4538 6.04796 6.8868C5.47096 7.1058 4.74896 7.3858 4.00696 7.7868C3.29996 8.1718 2.38896 8.8158 3.09896 9.5238C3.72196 10.1758 4.98996 10.6358 6.33196 11.0388C7.70096 11.4368 9.25196 11.7728 10.933 12.0768C14.297 12.6768 18.166 13.1978 22.417 13.6368C26.668 14.0668 31.304 14.4468 36.211 14.7948C41.119 15.1278 46.305 15.4538 51.684 15.6968C57.06 15.9538 62.629 16.1128 68.284 16.1998C73.945 16.2838 72.741 16.2748 78.491 16.2128C84.24 16.1508 91.376 16.0358 97.029 15.8658C102.681 15.7098 108.24 15.4998 113.61 15.2298C118.979 14.9608 119.301 14.6648 124.202 14.2818C129.101 13.8938 133.721 13.4788 137.946 12.9508C142.154 12.4058 146.04 11.8178 149.143 10.8228C149.9 10.5618 150.621 10.2728 151.125 9.8988C151.663 9.5338 151.78 9.0478 151.464 8.6328C150.829 7.7978 149.545 7.3048 148.499 6.9008C146.303 6.1178 144.394 5.7388 143.118 5.4738C141.828 5.2188 141.128 5.1088 141.128 5.1088L141.148 5.0498C141.148 5.0498 141.858 5.1428 143.162 5.3688C144.46 5.6038 146.393 5.93879 148.677 6.68179C149.776 7.07879 151.114 7.5328 151.9 8.5018C152.077 8.7548 152.181 9.0278 152.114 9.3378C152.045 9.6398 151.805 9.9038 151.521 10.1218C150.943 10.5628 150.189 10.8698 149.406 11.1548C146.216 12.2258 142.328 12.8578 138.104 13.4608C133.865 14.0438 129.236 14.5368 124.316 14.9148C119.397 15.3038 119.068 15.6348 113.681 15.8808C108.298 16.1198 102.724 16.3038 97.062 16.4258C91.396 16.5318 84.25 16.5798 78.497 16.5728C72.737 16.5628 73.938 16.4928 68.278 16.4008C62.614 16.3078 57.045 16.1718 51.657 16.0148C46.267 15.8458 41.057 15.6368 36.129 15.3218C31.199 15.0158 26.555 14.6288 22.29 14.1518C18.026 13.6768 14.132 13.1608 10.753 12.4868C9.06396 12.1548 7.50396 11.7878 6.10796 11.3618C4.74396 10.9168 3.43096 10.4518 2.71996 9.66679C2.56596 9.48279 2.43496 9.2148 2.44596 9.0338C2.44896 8.7978 2.53996 8.58879 2.70496 8.42079C3.01296 8.07379 3.43296 7.8388 3.82396 7.6398C4.61996 7.2448 5.36096 6.9848 5.96096 6.7798C7.17096 6.3788 7.83396 6.1978 7.83396 6.1978L7.87696 6.25279Z" fill="url(#{U}p15_linear_28_11395)" /><path opacity="0.3" d="M76.0047 1.24609C32.5197 1.24609 4.22266 4.56809 4.22266 8.66809C4.22266 12.7671 32.5187 16.0891 76.0047 16.0891C119.489 16.0891 151.26 12.7671 151.26 8.66809C151.26 4.56809 119.489 1.24609 76.0047 1.24609Z" fill="url(#{U}p16_radial_28_11395)" />`, cork:"", defs:` <radialGradient id="{U}p0_radial_28_11395" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(78.8241 23.5005) scale(188.888)"> <stop offset="0.0996" stop-color="white" /> <stop offset="1" /> </radialGradient> <radialGradient id="{U}p1_radial_28_11395" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(77.7673 38.0128) scale(154.159 154.159)"> <stop offset="0.9089" stop-color="white" /> <stop offset="0.92" stop-color="#D3D3D2" /> <stop offset="0.9408" stop-color="#868582" /> <stop offset="0.9556" stop-color="#565550" /> <stop offset="0.9629" stop-color="#43423D" /> <stop offset="1" stop-color="#2B2728" /> </radialGradient> <radialGradient id="{U}p2_radial_28_11395" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(77.5963 133.406) scale(50.4149 50.4149)"> <stop offset="0.1825" stop-color="#DBDEDB" /> <stop offset="0.6803" stop-color="#BCC0C1" /> <stop offset="0.7218" stop-color="#A7ABAC" /> <stop offset="0.8078" stop-color="#727475" /> <stop offset="0.9299" stop-color="#1D1E1E" /> <stop offset="0.9699" /> </radialGradient> <radialGradient id="{U}p3_radial_28_11395" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(96.3401 176.455) scale(54.3974 54.3973)"> <stop offset="0.1825" stop-color="#DBDEDB" /> <stop offset="0.6803" stop-color="#BCC0C1" /> <stop offset="0.7218" stop-color="#A7ABAC" /> <stop offset="0.8078" stop-color="#727475" /> <stop offset="0.9299" stop-color="#1D1E1E" /> <stop offset="0.9699" /> </radialGradient> <linearGradient id="{U}p4_linear_28_11395" x1="32.449" y1="176.018" x2="123.246" y2="176.018" gradientUnits="userSpaceOnUse"> <stop offset="0.02" stop-color="#3D3D3D" /> <stop offset="0.0489" stop-color="#434343" /> <stop offset="0.0885" stop-color="#555555" /> <stop offset="0.1341" stop-color="#727272" /> <stop offset="0.1534" stop-color="#808080" /> <stop offset="0.2909" stop-color="#838383" /> <stop offset="0.3176" stop-color="#ACACAC" /> <stop offset="0.3507" stop-color="#D9D9D9" /> <stop offset="0.3764" stop-color="#F5F5F5" /> <stop offset="0.3913" stop-color="white" /> <stop offset="0.5341" stop-color="#838383" /> <stop offset="0.7086" stop-color="#808080" /> <stop offset="0.7668" stop-color="#6E6E6E" /> <stop offset="0.8461" stop-color="#4E4E4E" /> <stop offset="0.9237" stop-color="#3A3A3A" /> <stop offset="0.936" stop-color="#363636" /> <stop offset="0.9606" stop-color="#2F2F2F" /> <stop offset="0.9984" stop-color="#292929" /> </linearGradient> <linearGradient id="{U}p5_linear_28_11395" x1="43.8438" y1="168.627" x2="113.595" y2="168.627" gradientUnits="userSpaceOnUse"> <stop offset="0.02" stop-color="#3D3D3D" /> <stop offset="0.0489" stop-color="#434343" /> <stop offset="0.0885" stop-color="#555555" /> <stop offset="0.1341" stop-color="#727272" /> <stop offset="0.1534" stop-color="#808080" /> <stop offset="0.2909" stop-color="#838383" /> <stop offset="0.3176" stop-color="#ACACAC" /> <stop offset="0.3507" stop-color="#D9D9D9" /> <stop offset="0.3764" stop-color="#F5F5F5" /> <stop offset="0.3913" stop-color="white" /> <stop offset="0.5341" stop-color="#838383" /> <stop offset="0.7086" stop-color="#808080" /> <stop offset="0.7668" stop-color="#6E6E6E" /> <stop offset="0.8461" stop-color="#4E4E4E" /> <stop offset="0.9237" stop-color="#3A3A3A" /> <stop offset="0.936" stop-color="#363636" /> <stop offset="0.9606" stop-color="#2F2F2F" /> <stop offset="0.9984" stop-color="#292929" /> </linearGradient> <linearGradient id="{U}p6_linear_28_11395" x1="3.61867" y1="98.9941" x2="35.3381" y2="95.8222" gradientUnits="userSpaceOnUse"> <stop offset="0.0081" stop-color="#BCC0C1" /> <stop offset="0.0181" stop-color="#A8ACAC" /> <stop offset="0.0387" stop-color="#747776" /> <stop offset="0.0539" stop-color="#4B4D4A" /> <stop offset="0.4561" stop-color="#DBDEDB" /> <stop offset="0.5918" stop-color="white" /> <stop offset="0.5932" stop-color="white" /> <stop offset="0.9635" stop-color="white" /> <stop offset="0.994" stop-color="white" /> </linearGradient> <linearGradient id="{U}p7_linear_28_11395" x1="158.458" y1="98.7653" x2="129.381" y2="96.4576" gradientUnits="userSpaceOnUse"> <stop offset="0.0081" stop-color="#BCC0C1" /> <stop offset="0.0181" stop-color="#A8ACAC" /> <stop offset="0.0387" stop-color="#747776" /> <stop offset="0.0539" stop-color="#4B4D4A" /> <stop offset="0.4561" stop-color="#DBDEDB" /> <stop offset="0.5918" stop-color="white" /> <stop offset="0.5932" stop-color="white" /> <stop offset="0.9635" stop-color="white" /> <stop offset="0.994" stop-color="white" /> </linearGradient> <linearGradient id="{U}p8_linear_28_11395" x1="105.299" y1="40.8425" x2="105.299" y2="155.992" gradientUnits="userSpaceOnUse"> <stop offset="0.087" stop-color="white" /> <stop offset="0.9749" /> </linearGradient> <linearGradient id="{U}p9_linear_28_11395" x1="67.8646" y1="49.853" x2="67.8646" y2="173.941" gradientUnits="userSpaceOnUse"> <stop offset="0.087" stop-color="white" /> <stop offset="0.9749" /> </linearGradient> <linearGradient id="{U}p10_linear_28_11395" x1="134.962" y1="96.0409" x2="206.255" y2="91.288" gradientUnits="userSpaceOnUse"> <stop offset="0.2895" stop-color="white" /> <stop offset="0.9749" /> </linearGradient> <linearGradient id="{U}p11_linear_28_11395" x1="44.6407" y1="54.6022" x2="44.6407" y2="174.057" gradientUnits="userSpaceOnUse"> <stop offset="0.2895" stop-color="white" /> <stop offset="0.9749" /> </linearGradient> <linearGradient id="{U}p12_linear_28_11395" x1="0.640125" y1="9.2155" x2="158.218" y2="9.2155" gradientUnits="userSpaceOnUse"> <stop stop-color="#797677" /> <stop offset="0.0158" stop-color="#7E7B7C" /> <stop offset="0.3776" stop-color="#E3E3E3" /> <stop offset="0.4928" stop-color="#BCBBBC" /> <stop offset="0.7389" stop-color="#6F6C6D" /> <stop offset="0.9139" stop-color="#3E3A3B" /> <stop offset="1" stop-color="#2B2728" /> </linearGradient> <linearGradient id="{U}p13_linear_28_11395" x1="4.22316" y1="4.94849" x2="151.47" y2="4.94849" gradientUnits="userSpaceOnUse"> <stop stop-color="#797677" /> <stop offset="1" stop-color="#2B2728" /> </linearGradient> <radialGradient id="{U}p14_radial_28_11395" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(77.1572 12.7856) scale(53.8909 35.5643)"> <stop offset="0.198" stop-color="white" /> <stop offset="0.2923" stop-color="#F9F8F9" /> <stop offset="0.4246" stop-color="#E7E6E6" /> <stop offset="0.5793" stop-color="#C9C8C9" /> <stop offset="0.7509" stop-color="#A09F9F" /> <stop offset="0.9345" stop-color="#6C6A6B" /> <stop offset="1" stop-color="#585556" /> </radialGradient> <linearGradient id="{U}p15_linear_28_11395" x1="2.44666" y1="10.811" x2="152.135" y2="10.811" gradientUnits="userSpaceOnUse"> <stop stop-color="#797677" /> <stop offset="1" stop-color="#2B2728" /> </linearGradient> <radialGradient id="{U}p16_radial_28_11395" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(65.8077 -25.5349) scale(185.753 185.753)"> <stop offset="0.0996" stop-color="white" /> <stop offset="1" /> </radialGradient> <linearGradient id="{U}lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F4F1EA"/><stop offset=".35" stop-color="#FFFFFF"/><stop offset=".8" stop-color="#F1EDE4"/><stop offset="1" stop-color="#E2DDD1"/></linearGradient><linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B4F8A" stop-opacity="0"/><stop offset=".55" stop-color="#0B4F8A" stop-opacity=".06"/><stop offset="1" stop-color="#0B4F8A" stop-opacity=".2"/></linearGradient>`,
    poly:[[4.8,9.7],[0.3,20.1],[0,35.3],[0.6,65.6],[2.9,95.9],[6.9,126],[12.8,155.7],[18.6,169.7],[30.7,178.3],[45.5,181.8],[75.7,183.8],[106,182.3],[120.9,179.6],[134.4,172.9],[141.7,159.8],[148,130.1],[152.4,100.1],[154.8,69.9],[155.7,39.5],[155.5,24.4],[154.9,9.2],[78,16]],
    surfC:[77.8,40], yTop:10, yFill:30, yBot:183.8, xTop:[1,155], xBot:[46,106],
    lipR:[155,9.2], lipL:[1,9.2], mouth:[78,12] },
  wbottle: { vb:[547,1151], shift:[0,0],  /* "water bottle.svg" — cap animates off/on */
    back:`<path d="M3.64861 935.111C3.64861 935.111 2.39869 935.353 0.0251427 935.809C0.0164244 935.921 0.00762847 936.033 0 936.144C2.39098 935.47 3.64861 935.111 3.64861 935.111Z" fill="url(#{U}p0_linear_29_11687)" /><path d="M232.633 1077.93C231.054 1079.27 229.579 1080.81 228.244 1082.63C233.951 1081.79 239.923 1081.01 246.118 1080.3C241.453 1079.56 236.948 1078.77 232.633 1077.93ZM477.226 1074.24C466.949 1077.14 454.639 1079.57 440.669 1081.51C457.319 1083.8 471.866 1086.63 483.422 1089.84C483.319 1089.59 483.214 1089.34 483.105 1089.08C480.928 1084.02 478.784 1079.19 477.226 1074.24ZM243.976 107.743C241.045 138.713 232.212 208.787 209.665 252.442C184.828 300.499 125.808 448.489 128.614 534.312C134.64 718.815 143.129 882.924 149.402 1014.56C151.677 1062.24 154.992 1095.89 156.553 1104.97C156.376 1103.72 156.309 1102.3 156.329 1100.75C156.329 1100.75 158.513 1101.83 162.841 1103.6C163.227 1102.98 163.721 1102.37 164.314 1101.76C162.727 1089.43 159.979 1057.75 158.038 1014.56C152.116 882.924 144.135 718.815 138.451 534.312C135.8 448.489 191.414 300.499 214.801 252.442C235.559 209.796 243.975 141.934 246.927 109.95C245.817 109.23 244.833 108.494 243.976 107.743ZM432.229 106.777C431.979 107.033 431.712 107.289 431.432 107.542C436.132 140.075 448.466 216.284 466.076 257.805C492.661 320.521 543.13 457.879 540.303 544.436C534.215 731.507 525.81 895.068 519.909 1021.45C518.038 1061.38 515.771 1092.15 514.425 1103.07C517.517 1101.62 519.039 1100.75 519.039 1100.75C519.054 1101.96 519.02 1103.08 518.921 1104.11C520.307 1094.21 522.768 1062.73 524.785 1021.45C530.965 895.068 539.744 731.508 546.101 544.436C549.051 457.878 496.315 320.521 468.539 257.805C450.002 215.956 437.055 138.865 432.229 106.777Z" fill="url(#{U}p1_linear_29_11687)" /><path d="M246.118 1080.3C239.923 1081.01 233.951 1081.79 228.244 1082.62C227.326 1083.87 226.475 1085.24 225.699 1086.77C222.754 1092.55 222.039 1098.26 223.002 1103.83C255.618 1100.37 294.351 1098.36 335.902 1098.36C394.537 1098.36 447.565 1102.35 485.703 1108.79C486.631 1102.67 486.038 1096.29 483.423 1089.84C471.867 1086.63 457.32 1083.8 440.67 1081.51C413.748 1085.25 380.668 1087.18 344.134 1087.18C307.713 1087.18 273.941 1084.7 246.118 1080.3Z" fill="url(#{U}p2_linear_29_11687)" /><path d="M335.902 1098.36C294.351 1098.36 255.617 1100.36 223.002 1103.83C224.149 1110.45 227.677 1116.88 232.655 1122.96C261.319 1128.29 297.87 1132.46 341.99 1132.46C408.945 1132.46 455.846 1122.85 484.476 1114.21C485.012 1112.43 485.424 1110.62 485.701 1108.79C447.564 1102.35 394.537 1098.36 335.902 1098.36Z" fill="#99ACB4" /><path d="M164.313 1101.76C163.719 1102.37 163.227 1102.98 162.84 1103.6C163.411 1103.83 164.023 1104.07 164.667 1104.33C164.558 1103.6 164.438 1102.74 164.313 1101.76Z" fill="url(#{U}p3_linear_29_11687)" /><path d="M246.924 109.95C243.972 141.934 235.555 209.796 214.797 252.442C191.41 300.499 135.797 448.49 138.447 534.312C144.13 718.815 152.113 882.924 158.035 1014.56C159.977 1057.75 162.723 1089.43 164.311 1101.76C171.826 1094.12 195.732 1087.4 228.243 1082.63C229.578 1080.81 231.052 1079.27 232.631 1077.93C207.802 1073.08 189.036 1066.53 179.292 1058.81C175.166 1056.76 172.931 1054.75 172.931 1052.88C172.931 1052.53 173.015 1052.17 173.179 1051.82C172.808 1051.1 172.51 1050.36 172.289 1049.62C167.982 1035.15 152.34 781.044 141.614 540.534C137.67 452.071 199.392 315.241 226.867 250.942C248.215 201.008 254.62 144.362 256.542 114.685C252.732 113.209 249.5 111.624 246.924 109.95Z" fill="url(#{U}p4_linear_29_11687)" /><path d="M228.245 1082.63C195.733 1087.4 171.828 1094.12 164.312 1101.76C164.438 1102.74 164.558 1103.6 164.668 1104.33C168.505 1105.85 173.653 1107.75 180.098 1109.85C192.695 1107.54 207.123 1105.51 223.003 1103.83C222.039 1098.26 222.755 1092.55 225.7 1086.77C226.476 1085.24 227.327 1083.87 228.245 1082.63Z" fill="url(#{U}p5_linear_29_11687)" /><path d="M223.002 1103.83C207.123 1105.51 192.694 1107.54 180.098 1109.85C192.712 1113.96 210.279 1118.81 232.657 1122.96C227.678 1116.88 224.15 1110.45 223.002 1103.83Z" fill="#B4C5CD" /><path d="M156.551 1104.97C156.649 1105.66 156.78 1106.31 156.947 1106.89C156.833 1106.48 156.7 1105.84 156.551 1104.97ZM518.921 1104.11C518.727 1105.49 518.555 1106.46 518.407 1106.96C518.653 1106.12 518.82 1105.17 518.921 1104.11Z" fill="url(#{U}p6_linear_29_11687)" /><path d="M156.327 1100.75C156.308 1102.3 156.377 1103.72 156.552 1104.97C156.701 1105.84 156.834 1106.48 156.949 1106.89C156.955 1106.92 156.962 1106.94 156.968 1106.96C157.657 1109.31 159.066 1111.62 161.14 1113.88C162.349 1113.58 163.592 1113.28 164.854 1112.99C162.863 1110.88 161.815 1108.83 161.815 1106.88C161.815 1105.77 162.163 1104.67 162.839 1103.59C158.511 1101.83 156.327 1100.75 156.327 1100.75ZM519.039 1100.75C519.039 1100.75 517.517 1101.62 514.425 1103.07C514.185 1105.02 513.975 1106.34 513.801 1106.96C513.158 1109.25 511.859 1111.5 509.954 1113.7C511.181 1114 512.37 1114.3 513.541 1114.61C515.997 1112.12 517.647 1109.56 518.408 1106.96C518.556 1106.45 518.729 1105.49 518.923 1104.11C519.02 1103.08 519.055 1101.96 519.039 1100.75Z" fill="url(#{U}p7_linear_29_11687)" /><path d="M164.855 1112.99C163.593 1113.28 162.349 1113.58 161.141 1113.88C179.779 1134.19 252.142 1150.27 337.684 1150.27C422.209 1150.27 493.857 1134.57 513.541 1114.61C512.371 1114.31 511.181 1114 509.953 1113.7C503.733 1120.9 491.05 1127.57 473.654 1133.19C474.465 1132.24 475.246 1131.27 475.997 1130.29C443.214 1141.11 391.948 1149.92 337.683 1149.92C308.697 1149.92 280.45 1147.36 255.372 1143.31C256.158 1143.87 256.948 1144.43 257.741 1144.98C224.968 1140.25 198.254 1132.7 181.993 1123.67C174.022 1120.11 168.149 1116.47 164.855 1112.99Z" fill="#99ACB4" /><path d="M162.841 1103.59C162.165 1104.67 161.816 1105.77 161.816 1106.88C161.816 1108.83 162.865 1110.88 164.856 1112.99C165.838 1112.76 166.828 1112.54 167.842 1112.31C166.56 1110.56 165.659 1108.77 165.159 1106.96C165.023 1106.47 164.857 1105.58 164.667 1104.33C164.024 1104.07 163.412 1103.83 162.841 1103.59Z" fill="url(#{U}p8_linear_29_11687)" /><path d="M484.478 1114.21C455.848 1122.85 408.946 1132.46 341.992 1132.46C297.872 1132.46 261.321 1128.28 232.657 1122.96C238.662 1130.31 246.777 1137.16 255.374 1143.31C280.452 1147.36 308.699 1149.92 337.685 1149.92C391.949 1149.92 443.216 1141.11 475.999 1130.29C479.789 1125.32 482.762 1119.91 484.478 1114.21ZM167.841 1112.31C166.828 1112.54 165.836 1112.76 164.855 1112.99C168.15 1116.47 174.023 1120.11 181.993 1123.67C175.537 1120.09 170.727 1116.27 167.841 1112.31Z" fill="#BBCBD3" /><path d="M181.992 1123.67C198.254 1132.7 224.968 1140.25 257.741 1144.98C256.948 1144.43 256.157 1143.87 255.371 1143.31C224.669 1138.35 198.715 1131.15 181.992 1123.67Z" fill="#B4C5CD" /><path d="M164.668 1104.33C164.858 1105.59 165.023 1106.47 165.159 1106.96C165.659 1108.77 166.561 1110.56 167.842 1112.31C171.702 1111.46 175.796 1110.64 180.099 1109.85C173.652 1107.75 168.504 1105.85 164.668 1104.33Z" fill="url(#{U}p9_linear_29_11687)" /><path d="M180.097 1109.85C175.794 1110.64 171.701 1111.46 167.84 1112.31C170.726 1116.27 175.537 1120.09 181.992 1123.67C198.714 1131.15 224.667 1138.35 255.372 1143.31C246.775 1137.16 238.66 1130.31 232.656 1122.96C210.279 1118.81 192.711 1113.96 180.097 1109.85Z" fill="#CAD9E1" /><path d="M173.18 1051.82C173.016 1052.17 172.932 1052.53 172.932 1052.88C172.932 1054.75 175.167 1056.75 179.293 1058.81C176.478 1056.57 174.416 1054.24 173.18 1051.82Z" fill="url(#{U}p10_linear_29_11687)" /><path d="M290.221 1016.89C263.557 1016.89 249.177 925.226 249.676 873.182C250.225 816.004 237.46 571.964 242.305 501.918C245.182 460.291 241.155 415.62 257.927 388.734C318.096 292.31 308.426 141.443 326.368 141.328C326.401 141.328 326.432 141.327 326.466 141.327C369.313 141.327 354.562 330.543 322.237 397.781C299.854 444.337 342.953 527.219 330.674 575.866C317.174 626.997 304.896 680.623 311.035 732.997C314.721 775.401 321.843 857.952 324.307 900.356C326.761 936.517 331.585 991.655 298.446 1014.1C295.588 1016 292.845 1016.89 290.221 1016.89ZM411.283 117.189C393.376 122.561 367.001 125.955 337.591 125.955C323.189 125.955 309.513 125.141 297.203 123.678C294.012 161.118 286.03 210.124 289.545 247.298C292.599 279.618 278.975 294.516 258.922 312.643C222.492 345.596 218.36 401.199 214.375 448.82C209.199 510.977 209.003 574.19 211.559 636.491C214.334 704.021 210.7 771.271 212.015 838.781C213.101 893.959 219.292 949.471 250.35 995.56C258.294 1007.34 270.858 1020.89 273.955 1034.41C296.162 1033.13 320.397 1032.42 344.88 1032.42C391.616 1032.42 435.799 1035.1 466.84 1039.33C465.821 992.203 460.405 747.674 456.667 693.535C452.536 633.563 458.738 511.537 450.465 466.037C442.194 420.527 394.624 356.424 386.351 337.8C378.08 319.197 400.824 284.029 407.76 259.214C414.696 234.399 401.3 125.956 401.3 125.956C401.3 125.956 427.71 242.67 420.918 261.284C414.127 279.898 417.366 302.642 411.124 329.528C404.871 356.424 444.262 379.169 467.007 424.668C489.762 470.168 487.691 550.825 485.622 635.632C483.562 720.42 479.421 900.358 475.777 949.988C473.015 987.598 469.405 1024.02 467.817 1039.46C471.941 1040.04 475.831 1040.63 479.452 1041.26C482.312 1035.18 485.888 1029.32 488.075 1023.15C495.85 1001.18 497.413 976.626 498.366 953.437C500.613 898.485 496.005 844.041 500.022 789.028C504.557 726.892 507.455 664.61 506.731 602.288C506.1 549.19 503.521 494.849 494.981 442.424C491.471 420.87 484.815 400.166 472.816 382.182C460.599 363.868 444.956 348.496 433.983 329.197C420.825 306.07 441.024 288.407 440.971 264.711C440.941 244.555 433.756 222.348 428.632 203.062C420.866 173.85 412.512 145.752 411.283 117.189Z" fill="url(#{U}p11_linear_29_11687)" /><path d="M256.544 114.685C254.622 144.362 248.217 201.007 226.87 250.942C199.394 315.241 137.672 452.071 141.616 540.534C152.342 781.044 167.984 1035.15 172.291 1049.62C172.511 1050.36 172.81 1051.1 173.181 1051.82C176.781 1044.14 219.217 1037.57 273.955 1034.41C270.86 1020.89 258.296 1007.34 250.35 995.56C219.292 949.471 213.101 893.959 212.015 838.78C210.7 771.271 214.334 704.021 211.559 636.491C209.003 574.189 209.199 510.977 214.375 448.82C218.361 401.199 222.492 345.595 258.922 312.643C278.975 294.516 292.6 279.618 289.545 247.297C286.03 210.125 294.012 161.118 297.203 123.678C280.671 121.715 266.602 118.582 256.544 114.685Z" fill="url(#{U}p12_linear_29_11687)" /><path d="M239.525 1073.38C237.088 1074.65 234.764 1076.11 232.633 1077.92C236.947 1078.77 241.454 1079.56 246.118 1080.3C255.334 1079.24 265.048 1078.33 275.111 1077.58C262.487 1076.42 250.519 1074.99 239.525 1073.38ZM475.637 1068.03C457.564 1072 433.773 1075.55 407.07 1077.87C418.957 1078.85 430.224 1080.07 440.669 1081.51C454.639 1079.57 466.949 1077.14 477.227 1074.24C476.584 1072.2 476.041 1070.13 475.637 1068.03Z" fill="url(#{U}p13_linear_29_11687)" /><path d="M275.111 1077.58C265.048 1078.33 255.333 1079.24 246.117 1080.3C273.94 1084.7 307.713 1087.18 344.132 1087.18C380.667 1087.18 413.746 1085.25 440.668 1081.51C430.224 1080.08 418.955 1078.85 407.069 1077.87C386.826 1079.63 364.911 1080.69 342.569 1080.69C319.203 1080.69 296.236 1079.51 275.111 1077.58Z" fill="url(#{U}p14_linear_29_11687)" /><path d="M179.295 1058.81C189.039 1066.54 207.805 1073.08 232.634 1077.93C234.766 1076.11 237.089 1074.66 239.526 1073.38C211.334 1069.24 189.514 1063.89 179.295 1058.81Z" fill="url(#{U}p15_linear_29_11687)" /><path d="M344.878 1032.41C320.395 1032.41 296.16 1033.13 273.953 1034.41C276.149 1044.01 273.578 1053.59 261.208 1062.53C254.294 1067.52 246.453 1069.74 239.523 1073.38C250.518 1074.99 262.486 1076.42 275.11 1077.58C295.69 1076.05 317.75 1075.2 340.105 1075.2C363.53 1075.2 386.243 1076.16 407.069 1077.87C433.77 1075.55 457.563 1072 475.635 1068.03C474.757 1063.46 474.535 1058.68 475.372 1053.46C476.052 1049.21 477.601 1045.19 479.452 1041.26C475.83 1040.63 471.94 1040.03 467.816 1039.46C467.308 1044.4 467.008 1047.2 467.008 1047.2C467.008 1047.2 466.949 1044.41 466.839 1039.33C435.797 1035.1 391.614 1032.41 344.878 1032.41Z" fill="url(#{U}p16_linear_29_11687)" /><path d="M340.106 1075.2C317.752 1075.2 295.691 1076.05 275.111 1077.58C296.237 1079.52 319.204 1080.69 342.57 1080.69C364.911 1080.69 386.827 1079.63 407.07 1077.87C386.244 1076.16 363.531 1075.2 340.106 1075.2Z" fill="url(#{U}p17_linear_29_11687)" /><path d="M273.955 1034.41C219.217 1037.57 176.781 1044.14 173.182 1051.82C174.419 1054.24 176.48 1056.57 179.294 1058.81C189.513 1063.89 211.334 1069.24 239.525 1073.38C246.455 1069.74 254.296 1067.52 261.21 1062.53C273.58 1053.59 276.151 1044.01 273.955 1034.41Z" fill="url(#{U}p18_linear_29_11687)" /><path d="M326.466 141.328C326.432 141.328 326.401 141.329 326.368 141.329C308.426 141.443 318.096 292.311 257.927 388.735C241.156 415.621 245.183 460.292 242.305 501.919C237.46 571.965 250.224 816.005 249.676 873.182C249.176 925.227 263.556 1016.89 290.22 1016.89C292.845 1016.89 295.588 1016 298.447 1014.1C331.586 991.658 326.762 936.519 324.308 900.358C321.844 857.954 314.722 775.403 311.036 733C304.897 680.626 317.175 627 330.675 575.868C342.954 527.222 299.855 444.34 322.238 397.784C354.562 330.544 369.314 141.328 326.466 141.328Z" fill="url(#{U}p19_linear_29_11687)" /><path d="M431.431 107.542C429.882 108.942 427.884 110.293 425.484 111.584C428.263 141.077 435.57 202.257 451.655 252.101C475.031 324.517 533.937 427.454 530.21 562.555C523.512 805.167 515.127 1039.48 511.058 1053.16C511.058 1053.8 510.802 1054.45 510.303 1055.11C506.607 1062.84 494.937 1069.24 477.227 1074.24C478.784 1079.19 480.928 1084.02 483.105 1089.09C483.214 1089.34 483.319 1089.59 483.423 1089.84C498.772 1094.11 508.849 1099.07 511.606 1104.36C512.659 1103.89 513.599 1103.46 514.426 1103.07C515.772 1092.15 518.038 1061.38 519.91 1021.45C525.811 895.068 534.217 731.508 540.304 544.436C543.131 457.878 492.662 320.521 466.077 257.805C448.466 216.284 436.132 140.075 431.431 107.542Z" fill="url(#{U}p20_linear_29_11687)" /><path d="M483.422 1089.84C486.037 1096.29 486.63 1102.67 485.702 1108.79C489.137 1109.37 492.456 1109.97 495.643 1110.59C502.482 1108.21 507.789 1106.05 511.606 1104.36C508.85 1099.06 498.771 1094.11 483.422 1089.84Z" fill="url(#{U}p21_linear_29_11687)" /><path d="M485.703 1108.79C485.427 1110.62 485.015 1112.43 484.479 1114.21C488.573 1112.97 492.292 1111.76 495.643 1110.59C492.457 1109.97 489.138 1109.37 485.703 1108.79Z" fill="#99A7AE" /><path d="M514.425 1103.07C513.598 1103.46 512.659 1103.89 511.606 1104.36C512.113 1105.33 512.372 1106.31 512.372 1107.31C512.372 1109.3 511.296 1111.39 509.25 1113.53C509.485 1113.59 509.72 1113.65 509.953 1113.7C511.859 1111.5 513.157 1109.25 513.8 1106.96C513.975 1106.34 514.187 1105.02 514.425 1103.07Z" fill="url(#{U}p22_linear_29_11687)" /><path d="M509.25 1113.53C503.974 1119.06 492.26 1124.92 475.997 1130.29C475.246 1131.27 474.465 1132.24 473.654 1133.19C491.05 1127.57 503.733 1120.9 509.954 1113.7C509.719 1113.65 509.485 1113.59 509.25 1113.53Z" fill="#99A7AE" /><path d="M511.608 1104.36C507.791 1106.05 502.484 1108.21 495.645 1110.59C500.482 1111.53 505.026 1112.51 509.253 1113.53C511.297 1111.39 512.375 1109.3 512.375 1107.3C512.375 1106.31 512.114 1105.33 511.608 1104.36Z" fill="url(#{U}p23_linear_29_11687)" /><path d="M495.642 1110.59C492.29 1111.76 488.571 1112.97 484.478 1114.21C482.761 1119.91 479.788 1125.32 475.998 1130.29C492.261 1124.92 503.975 1119.06 509.25 1113.53C505.024 1112.51 500.48 1111.53 495.642 1110.59Z" fill="#A7B4BC" /><path d="M511.058 1053.16C510.862 1053.82 510.61 1054.47 510.303 1055.11C510.802 1054.45 511.058 1053.8 511.058 1053.16Z" fill="url(#{U}p24_linear_29_11687)" /><path d="M425.485 111.583C421.699 113.617 416.911 115.499 411.283 117.188C412.511 145.751 420.865 173.849 428.632 203.06C433.756 222.347 440.941 244.552 440.971 264.709C441.023 288.405 420.825 306.067 433.983 329.195C444.956 348.492 460.599 363.866 472.816 382.18C484.814 400.162 491.47 420.867 494.981 442.422C503.521 494.847 506.1 549.188 506.731 602.286C507.455 664.609 504.556 726.889 500.022 789.025C496.005 844.039 500.613 898.483 498.365 953.434C497.413 976.624 495.85 1001.18 488.075 1023.15C485.887 1029.31 482.312 1035.18 479.452 1041.26C499.157 1044.64 511.058 1048.76 511.058 1053.16C515.126 1039.47 523.512 805.165 530.21 562.553C533.937 427.451 475.031 324.516 451.655 252.099C435.571 202.256 428.263 141.077 425.485 111.583Z" fill="url(#{U}p25_linear_29_11687)" /><path d="M510.304 1055.11C507.184 1059.26 494.544 1063.88 475.637 1068.03C476.041 1070.14 476.584 1072.2 477.228 1074.24C494.939 1069.24 506.607 1062.83 510.304 1055.11Z" fill="url(#{U}p26_linear_29_11687)" /><path d="M479.453 1041.26C477.603 1045.19 476.053 1049.21 475.373 1053.46C474.537 1058.68 474.759 1063.46 475.637 1068.03C494.545 1063.88 507.184 1059.26 510.304 1055.11C510.611 1054.47 510.863 1053.82 511.059 1053.16C511.059 1048.76 499.158 1044.64 479.453 1041.26Z" fill="url(#{U}p27_linear_29_11687)" /><path d="M243.036 94.0415C241.005 96.0881 239.914 98.2317 239.914 100.435C239.914 102.976 241.334 105.429 243.977 107.743C244.509 102.137 244.845 97.81 245.036 95.1553C244.329 94.7891 243.661 94.4175 243.036 94.0415Z" fill="url(#{U}p28_linear_29_11687)" /><path d="M245.034 95.1562C244.843 97.811 244.506 102.137 243.975 107.744C244.831 108.495 245.816 109.23 246.924 109.95C247.452 104.224 247.805 99.6472 248.022 96.5719C246.959 96.1076 245.962 95.6368 245.034 95.1562Z" fill="url(#{U}p29_linear_29_11687)" /><path d="M248.024 96.5708C247.807 99.6462 247.454 104.223 246.926 109.949C249.502 111.623 252.734 113.208 256.545 114.685C256.949 108.455 257.155 103.414 257.259 99.8728C253.79 98.8364 250.694 97.7325 248.024 96.5708Z" fill="url(#{U}p30_linear_29_11687)" /><path d="M411.326 102.267C392.797 106.463 367.189 109.06 338.904 109.06C324.471 109.06 310.733 108.384 298.28 107.165C298.076 112.332 297.696 117.866 297.201 123.679C309.511 125.141 323.187 125.956 337.59 125.956C367 125.956 393.374 122.561 411.282 117.189C411.069 112.232 411.071 107.259 411.326 102.267Z" fill="url(#{U}p31_linear_29_11687)" /><path d="M257.259 99.8728C257.154 103.414 256.947 108.455 256.545 114.685C266.603 118.582 280.673 121.714 297.202 123.678C297.698 117.865 298.078 112.331 298.281 107.163C281.968 105.567 267.859 103.038 257.259 99.8728Z" fill="url(#{U}p32_linear_29_11687)" /><path d="M433.036 95.019C432.298 95.4081 431.516 95.7906 430.688 96.1688C431.037 98.6774 431.554 102.287 432.23 106.777C434.212 104.749 435.267 102.625 435.267 100.435C435.267 98.5793 434.493 96.7671 433.036 95.019Z" fill="url(#{U}p33_linear_29_11687)" /><path d="M430.687 96.1689C430.428 96.2877 430.162 96.4065 429.893 96.5231C430.246 99.1582 430.761 102.907 431.43 107.541C431.71 107.288 431.976 107.033 432.228 106.776C431.553 102.287 431.038 98.6776 430.687 96.1689Z" fill="url(#{U}p34_linear_29_11687)" /><path d="M429.894 96.5229C428.218 97.2564 426.374 97.9658 424.373 98.6513C424.603 101.669 424.965 106.073 425.485 111.583C427.884 110.292 429.882 108.941 431.432 107.541C430.762 102.907 430.247 99.158 429.894 96.5229Z" fill="url(#{U}p35_linear_29_11687)" /><path d="M424.374 98.6511C420.565 99.9545 416.191 101.166 411.327 102.267C411.071 107.259 411.07 112.232 411.284 117.188C416.911 115.5 421.699 113.618 425.486 111.584C424.966 106.073 424.605 101.669 424.374 98.6511Z" fill="url(#{U}p36_linear_29_11687)" /><path d="M401.3 125.955C401.3 125.955 414.696 234.398 407.76 259.213C400.824 284.028 378.079 319.196 386.351 337.799C394.623 356.423 442.193 420.526 450.465 466.036C458.737 511.536 452.536 633.562 456.667 693.533C460.404 747.673 465.82 992.203 466.84 1039.33C467.171 1039.37 467.491 1039.42 467.819 1039.46C469.408 1024.02 473.018 987.596 475.779 949.986C479.423 900.355 483.564 720.417 485.624 635.63C487.695 550.822 489.765 470.166 467.009 424.666C444.265 379.167 404.873 356.422 411.127 329.526C417.369 302.641 414.129 279.896 420.92 261.282C427.709 242.67 401.3 125.955 401.3 125.955Z" fill="url(#{U}p40_linear_29_11687)" /><path d="M466.84 1039.33C466.951 1044.42 467.009 1047.2 467.009 1047.2C467.009 1047.2 467.31 1044.4 467.817 1039.46C467.49 1039.42 467.17 1039.37 466.84 1039.33Z" fill="url(#{U}p41_linear_29_11687)" />`, milk:`<g opacity=".9"><path fill="url(#{U}lq)" d="M241,114 L234,180 L200,280 L162,378 L136,480 L133,585 L137,690 L142,796 L147,901 L153,1006 L161,1094 L330,1104 L500,1094 L517,1073 L522,968 L527,862 L532,757 L537,652 L541,547 L528,442 L498,341 L460,243 L437,140 L433,114 Z"/><path fill="url(#{U}dp)" d="M241,114 L234,180 L200,280 L162,378 L136,480 L133,585 L137,690 L142,796 L147,901 L153,1006 L161,1094 L330,1104 L500,1094 L517,1073 L522,968 L527,862 L532,757 L537,652 L541,547 L528,442 L498,341 L460,243 L437,140 L433,114 Z"/></g>`, surf:`<ellipse cx="337" cy="550" rx="203" ry="16" fill="#CDEEFF" stroke="#7FB9E0" stroke-width="2"/>`, front:`<path d="M196,300 C170,380 160,480 160,600 L168,1000" stroke="#FFFFFF" stroke-width="22" fill="none" stroke-linecap="round" opacity=".45"/><path d="M470,330 C490,420 500,520 498,640" stroke="#FFFFFF" stroke-width="10" fill="none" stroke-linecap="round" opacity=".35"/>`, cork:`<path d="M441.282 57.2244H236.529C236.529 70.2483 236.529 82.7547 236.529 85.9009C236.529 88.7659 238.829 91.5089 243.036 94.0415C243.661 94.4175 244.329 94.7902 245.036 95.1564C245.965 95.637 246.96 96.1078 248.024 96.572C250.695 97.7337 253.79 98.8377 257.259 99.8741C267.859 103.039 281.969 105.568 298.282 107.165C310.735 108.384 324.472 109.06 338.905 109.06C367.191 109.06 392.797 106.464 411.328 102.267C416.191 101.167 420.566 99.9547 424.375 98.6513C426.376 97.9659 428.22 97.2564 429.896 96.523C430.165 96.4053 430.43 96.2876 430.69 96.1688C431.518 95.7907 432.301 95.4081 433.039 95.0191C438.346 92.2205 441.284 89.1375 441.284 85.9009V57.2244" fill="url(#{U}p37_linear_29_11687)" /><path d="M441.279 69.0038C441.279 81.7923 395.445 92.1638 338.904 92.1638C282.36 92.1638 236.525 81.7934 236.525 69.0038C236.53 61.8548 236.525 23.1621 236.525 23.1621H441.279C441.279 23.1621 441.279 56.213 441.279 69.0038Z" fill="url(#{U}p38_linear_29_11687)" /><path d="M441.279 23.1622C441.279 35.9562 395.445 46.3288 338.904 46.3288C282.36 46.3288 236.525 35.9562 236.525 23.1622C236.525 10.3714 282.36 0 338.904 0C395.445 0 441.279 10.3714 441.279 23.1622Z" fill="url(#{U}p39_linear_29_11687)" />`, defs:` <linearGradient id="{U}p0_linear_29_11687" x1="1.81562" y1="1616.86" x2="1.81562" y2="-538.288" gradientUnits="userSpaceOnUse"> <stop stop-color="#96ACB6" /> <stop offset="0.1818" stop-color="#96ACB6" /> <stop offset="1" stop-color="#A3BECC" /> </linearGradient> <linearGradient id="{U}p1_linear_29_11687" x1="337.371" y1="1616.86" x2="337.371" y2="-538.485" gradientUnits="userSpaceOnUse"> <stop stop-color="#69848E" /> <stop offset="0.1818" stop-color="#69848E" /> <stop offset="1" stop-color="#81AABD" /> </linearGradient> <linearGradient id="{U}p2_linear_29_11687" x1="354.373" y1="1616.94" x2="354.373" y2="-538.491" gradientUnits="userSpaceOnUse"> <stop stop-color="#9FB4BD" /> <stop offset="0.1818" stop-color="#9FB4BD" /> <stop offset="1" stop-color="#AFCAD9" /> </linearGradient> <linearGradient id="{U}p3_linear_29_11687" x1="163.759" y1="1616.94" x2="163.759" y2="-538.68" gradientUnits="userSpaceOnUse"> <stop stop-color="#9FB4BD" /> <stop offset="0.1818" stop-color="#9FB4BD" /> <stop offset="1" stop-color="#AFCAD9" /> </linearGradient> <linearGradient id="{U}p4_linear_29_11687" x1="197.453" y1="1616.86" x2="197.453" y2="-538.407" gradientUnits="userSpaceOnUse"> <stop stop-color="#93A9B2" /> <stop offset="0.1818" stop-color="#93A9B2" /> <stop offset="1" stop-color="#A5C3D2" /> </linearGradient> <linearGradient id="{U}p5_linear_29_11687" x1="196.294" y1="1616.86" x2="196.294" y2="-538.48" gradientUnits="userSpaceOnUse"> <stop stop-color="#B8C9D2" /> <stop offset="0.1818" stop-color="#B8C9D2" /> <stop offset="1" stop-color="#C3D9E5" /> </linearGradient> <linearGradient id="{U}p6_linear_29_11687" x1="337.756" y1="1616.86" x2="337.756" y2="-538.226" gradientUnits="userSpaceOnUse"> <stop stop-color="#69848E" /> <stop offset="0.1818" stop-color="#69848E" /> <stop offset="1" stop-color="#81AABD" /> </linearGradient> <linearGradient id="{U}p7_linear_29_11687" x1="337.68" y1="1616.86" x2="337.68" y2="-538.49" gradientUnits="userSpaceOnUse"> <stop stop-color="#9FB4BD" /> <stop offset="0.1818" stop-color="#9FB4BD" /> <stop offset="1" stop-color="#AFCAD9" /> </linearGradient> <linearGradient id="{U}p8_linear_29_11687" x1="164.842" y1="1616.86" x2="164.842" y2="-538.402" gradientUnits="userSpaceOnUse"> <stop stop-color="#BFD0D8" /> <stop offset="0.1818" stop-color="#BFD0D8" /> <stop offset="1" stop-color="#C9DDE8" /> </linearGradient> <linearGradient id="{U}p9_linear_29_11687" x1="172.376" y1="1616.86" x2="172.376" y2="-538.413" gradientUnits="userSpaceOnUse"> <stop stop-color="#CCDCE4" /> <stop offset="0.1818" stop-color="#CCDCE4" /> <stop offset="1" stop-color="#D3E6EF" /> </linearGradient> <linearGradient id="{U}p10_linear_29_11687" x1="176.123" y1="1616.85" x2="176.123" y2="-538.397" gradientUnits="userSpaceOnUse"> <stop stop-color="#B8C9D2" /> <stop offset="0.1818" stop-color="#B8C9D2" /> <stop offset="1" stop-color="#C3D9E5" /> </linearGradient> <linearGradient id="{U}p11_linear_29_11687" x1="358.392" y1="1616.86" x2="358.392" y2="-538.484" gradientUnits="userSpaceOnUse"> <stop stop-color="#9FB4BD" /> <stop offset="0.1818" stop-color="#9FB4BD" /> <stop offset="1" stop-color="#AFCAD9" /> </linearGradient> <linearGradient id="{U}p12_linear_29_11687" x1="219.323" y1="1616.86" x2="219.323" y2="-538.485" gradientUnits="userSpaceOnUse"> <stop stop-color="#B8C9D2" /> <stop offset="0.1818" stop-color="#B8C9D2" /> <stop offset="1" stop-color="#C3D9E5" /> </linearGradient> <linearGradient id="{U}p13_linear_29_11687" x1="354.914" y1="1616.94" x2="354.914" y2="-538.487" gradientUnits="userSpaceOnUse"> <stop stop-color="#9FB4BD" /> <stop offset="0.1818" stop-color="#9FB4BD" /> <stop offset="1" stop-color="#AFCAD9" /> </linearGradient> <linearGradient id="{U}p14_linear_29_11687" x1="343.399" y1="1616.94" x2="343.399" y2="-538.487" gradientUnits="userSpaceOnUse"> <stop stop-color="#BFD0D8" /> <stop offset="0.1818" stop-color="#BFD0D8" /> <stop offset="1" stop-color="#C9DDE8" /> </linearGradient> <linearGradient id="{U}p15_linear_29_11687" x1="209.433" y1="1616.86" x2="209.433" y2="-538.402" gradientUnits="userSpaceOnUse"> <stop stop-color="#B8C9D2" /> <stop offset="0.1818" stop-color="#B8C9D2" /> <stop offset="1" stop-color="#C3D9E5" /> </linearGradient> <linearGradient id="{U}p16_linear_29_11687" x1="359.474" y1="1616.86" x2="359.474" y2="-538.41" gradientUnits="userSpaceOnUse"> <stop stop-color="#BFD0D8" /> <stop offset="0.1818" stop-color="#BFD0D8" /> <stop offset="1" stop-color="#C9DDE8" /> </linearGradient> <linearGradient id="{U}p17_linear_29_11687" x1="341.081" y1="1616.93" x2="341.081" y2="-538.456" gradientUnits="userSpaceOnUse"> <stop stop-color="#D0E0E7" /> <stop offset="0.1818" stop-color="#D0E0E7" /> <stop offset="1" stop-color="#D7E9F2" /> </linearGradient> <linearGradient id="{U}p18_linear_29_11687" x1="223.923" y1="1616.86" x2="223.923" y2="-538.408" gradientUnits="userSpaceOnUse"> <stop stop-color="#CCDCE4" /> <stop offset="0.1818" stop-color="#CCDCE4" /> <stop offset="1" stop-color="#D3E6EF" /> </linearGradient> <linearGradient id="{U}p19_linear_29_11687" x1="297.107" y1="1616.86" x2="297.107" y2="-538.485" gradientUnits="userSpaceOnUse"> <stop stop-color="#ACBEC7" /> <stop offset="0.1818" stop-color="#ACBEC7" /> <stop offset="1" stop-color="#B9D1DE" /> </linearGradient> <linearGradient id="{U}p20_linear_29_11687" x1="482.93" y1="1616.86" x2="482.93" y2="-538.485" gradientUnits="userSpaceOnUse"> <stop stop-color="#86969E" /> <stop offset="0.1818" stop-color="#86969E" /> <stop offset="1" stop-color="#95A9B4" /> </linearGradient> <linearGradient id="{U}p21_linear_29_11687" x1="497.537" y1="1616.93" x2="497.537" y2="-538.479" gradientUnits="userSpaceOnUse"> <stop stop-color="#9DAAB2" /> <stop offset="0.1818" stop-color="#9DAAB2" /> <stop offset="1" stop-color="#A5B5BE" /> </linearGradient> <linearGradient id="{U}p22_linear_29_11687" x1="511.834" y1="1616.93" x2="511.834" y2="-538.481" gradientUnits="userSpaceOnUse"> <stop stop-color="#9DAAB2" /> <stop offset="0.1818" stop-color="#9DAAB2" /> <stop offset="1" stop-color="#A5B5BE" /> </linearGradient> <linearGradient id="{U}p23_linear_29_11687" x1="504.03" y1="1616.94" x2="504.03" y2="-538.498" gradientUnits="userSpaceOnUse"> <stop stop-color="#A9B7BE" /> <stop offset="0.1818" stop-color="#A9B7BE" /> <stop offset="1" stop-color="#ADBCC4" /> </linearGradient> <linearGradient id="{U}p24_linear_29_11687" x1="510.675" y1="1616.95" x2="510.675" y2="-538.54" gradientUnits="userSpaceOnUse"> <stop stop-color="#9DAAB2" /> <stop offset="0.1818" stop-color="#9DAAB2" /> <stop offset="1" stop-color="#A5B5BE" /> </linearGradient> <linearGradient id="{U}p25_linear_29_11687" x1="470.837" y1="1616.86" x2="470.837" y2="-538.484" gradientUnits="userSpaceOnUse"> <stop stop-color="#9DAAB2" /> <stop offset="0.1818" stop-color="#9DAAB2" /> <stop offset="1" stop-color="#A5B5BE" /> </linearGradient> <linearGradient id="{U}p26_linear_29_11687" x1="492.979" y1="1616.86" x2="492.979" y2="-538.483" gradientUnits="userSpaceOnUse"> <stop stop-color="#9DAAB2" /> <stop offset="0.1818" stop-color="#9DAAB2" /> <stop offset="1" stop-color="#A5B5BE" /> </linearGradient> <linearGradient id="{U}p27_linear_29_11687" x1="492.94" y1="1616.86" x2="492.94" y2="-538.484" gradientUnits="userSpaceOnUse"> <stop stop-color="#A9B7BE" /> <stop offset="0.1818" stop-color="#A9B7BE" /> <stop offset="1" stop-color="#ADBCC4" /> </linearGradient> <linearGradient id="{U}p28_linear_29_11687" x1="242.47" y1="1616.86" x2="242.47" y2="-538.407" gradientUnits="userSpaceOnUse"> <stop stop-color="#69848E" /> <stop offset="0.1818" stop-color="#69848E" /> <stop offset="1" stop-color="#81AABD" /> </linearGradient> <linearGradient id="{U}p29_linear_29_11687" x1="245.985" y1="1616.94" x2="245.985" y2="-538.485" gradientUnits="userSpaceOnUse"> <stop stop-color="#9FB4BD" /> <stop offset="0.1818" stop-color="#9FB4BD" /> <stop offset="1" stop-color="#AFCAD9" /> </linearGradient> <linearGradient id="{U}p30_linear_29_11687" x1="252.092" y1="1616.86" x2="252.092" y2="-538.408" gradientUnits="userSpaceOnUse"> <stop stop-color="#B8C9D2" /> <stop offset="0.1818" stop-color="#B8C9D2" /> <stop offset="1" stop-color="#C3D9E5" /> </linearGradient> <linearGradient id="{U}p31_linear_29_11687" x1="354.257" y1="1616.86" x2="354.257" y2="-538.485" gradientUnits="userSpaceOnUse"> <stop stop-color="#BFD0D8" /> <stop offset="0.1818" stop-color="#BFD0D8" /> <stop offset="1" stop-color="#C9DDE8" /> </linearGradient> <linearGradient id="{U}p32_linear_29_11687" x1="277.401" y1="1616.86" x2="277.401" y2="-538.407" gradientUnits="userSpaceOnUse"> <stop stop-color="#CCDCE4" /> <stop offset="0.1818" stop-color="#CCDCE4" /> <stop offset="1" stop-color="#D3E6EF" /> </linearGradient> <linearGradient id="{U}p33_linear_29_11687" x1="432.969" y1="1616.86" x2="432.969" y2="-538.407" gradientUnits="userSpaceOnUse"> <stop stop-color="#69848E" /> <stop offset="0.1818" stop-color="#69848E" /> <stop offset="1" stop-color="#81AABD" /> </linearGradient> <linearGradient id="{U}p34_linear_29_11687" x1="431.075" y1="1616.86" x2="431.075" y2="-538.407" gradientUnits="userSpaceOnUse"> <stop stop-color="#9FB4BD" /> <stop offset="0.1818" stop-color="#9FB4BD" /> <stop offset="1" stop-color="#AFCAD9" /> </linearGradient> <linearGradient id="{U}p35_linear_29_11687" x1="427.906" y1="1616.93" x2="427.906" y2="-538.483" gradientUnits="userSpaceOnUse"> <stop stop-color="#B1C0C8" /> <stop offset="0.1818" stop-color="#B1C0C8" /> <stop offset="1" stop-color="#B9CBD4" /> </linearGradient> <linearGradient id="{U}p36_linear_29_11687" x1="418.324" y1="1616.86" x2="418.324" y2="-538.408" gradientUnits="userSpaceOnUse"> <stop stop-color="#BECCD4" /> <stop offset="0.1818" stop-color="#BECCD4" /> <stop offset="1" stop-color="#C2D2DB" /> </linearGradient> <linearGradient id="{U}p37_linear_29_11687" x1="236.521" y1="83.1402" x2="441.275" y2="83.1402" gradientUnits="userSpaceOnUse"> <stop stop-color="#95979A" /> <stop offset="0.0267" stop-color="#95979A" /> <stop offset="0.2086" stop-color="#E4E5E6" /> <stop offset="0.6043" stop-color="#8C8E90" /> <stop offset="0.9198" stop-color="#7B7C7F" /> <stop offset="1" stop-color="#7B7C7F" /> </linearGradient> <linearGradient id="{U}p38_linear_29_11687" x1="236.522" y1="57.6636" x2="441.276" y2="57.6636" gradientUnits="userSpaceOnUse"> <stop stop-color="#ACAEB1" /> <stop offset="0.0214" stop-color="#ACAEB1" /> <stop offset="0.2567" stop-color="white" /> <stop offset="0.6364" stop-color="#9D9FA2" /> <stop offset="1" stop-color="#87888B" /> </linearGradient> <linearGradient id="{U}p39_linear_29_11687" x1="366.399" y1="70.789" x2="311.406" y2="-24.4611" gradientUnits="userSpaceOnUse"> <stop stop-color="#ACAEB1" /> <stop offset="0.0214" stop-color="#ACAEB1" /> <stop offset="0.1551" stop-color="#D8D9DA" /> <stop offset="0.3476" stop-color="#ACAEB1" /> <stop offset="0.5882" stop-color="white" /> <stop offset="1" stop-color="#87888B" /> </linearGradient> <linearGradient id="{U}p40_linear_29_11687" x1="435.673" y1="1616.86" x2="435.673" y2="-538.484" gradientUnits="userSpaceOnUse"> <stop stop-color="#A5B9C2" /> <stop offset="0.1818" stop-color="#A5B9C2" /> <stop offset="1" stop-color="#B5CEDC" /> </linearGradient> <linearGradient id="{U}p41_linear_29_11687" x1="467.321" y1="1616.93" x2="467.321" y2="-538.473" gradientUnits="userSpaceOnUse"> <stop stop-color="#C3D4DC" /> <stop offset="0.1818" stop-color="#C3D4DC" /> <stop offset="1" stop-color="#CBDFE9" /> </linearGradient> <linearGradient id="{U}lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7CC4F0"/><stop offset=".35" stop-color="#B4E3FC"/><stop offset=".8" stop-color="#8ACDF5"/><stop offset="1" stop-color="#63AEE3"/></linearGradient><linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B4F8A" stop-opacity="0"/><stop offset=".55" stop-color="#0B4F8A" stop-opacity=".06"/><stop offset="1" stop-color="#0B4F8A" stop-opacity=".2"/></linearGradient>`,
    poly:[[241,114],[234,180],[200,280],[162,378],[136,480],[133,585],[137,690],[142,796],[147,901],[153,1006],[161,1094],[330,1104],[500,1094],[517,1073],[522,968],[527,862],[532,757],[537,652],[541,547],[528,442],[498,341],[460,243],[437,140],[433,114]],
    surfC:[337,550], yTop:114, yFill:215, yBot:1104, xTop:[241,433], xBot:[161,500],
    lipR:[436,106], lipL:[238,106], mouth:[337,106] },
  smallmug: { vb:[1038,1018], shift:[0,0],   /* "small mug.svg" — handle right: pours off the LEFT lip */
    back:`<path d="M53.7615 939.353C59.5707 942.673 66.4964 945.799 74.4484 948.74C74.8414 950.052 75.2397 951.363 75.6417 952.681C77.5027 958.81 83.3965 964.412 92.6191 969.485C85.2862 970.478 78.305 971.512 71.7313 972.581C64.7681 967.774 60.276 962.568 58.6573 956.965C56.9362 951.029 55.3066 945.171 53.7615 939.353ZM731.302 933.34C729.669 942.199 727.664 951.191 725.25 960.456C723.562 966.939 717.359 972.874 707.413 978.27C701.1 976.83 694.142 975.438 686.585 974.096C698.726 968.663 706.288 962.572 708.137 955.828C708.987 952.76 709.779 949.72 710.52 946.708C719.682 942.588 726.718 938.133 731.302 933.34Z" fill="#94989D" /><path d="M92.6217 969.484C138.471 994.7 266.876 1006.94 394.648 1006.94C516.666 1006.94 638.103 995.78 686.586 974.095C694.143 975.437 701.101 976.829 707.414 978.269C660.014 1003.96 527.744 1017.2 394.839 1017.2C255.39 1017.2 115.247 1002.63 71.7321 972.581C78.3077 971.512 85.2889 970.478 92.6217 969.484Z" fill="#8B8F94" /><path d="M74.4507 948.74C90.8268 954.802 111.465 960.074 135.258 964.56C119.97 966.064 105.71 967.713 92.6214 969.485C83.3988 964.412 77.5068 958.81 75.644 952.681C75.242 951.363 74.8437 950.052 74.4507 948.74ZM710.521 946.709C709.779 949.72 708.988 952.76 708.137 955.829C706.289 962.572 698.726 968.664 686.585 974.097C671.832 971.477 654.799 969.057 635.81 966.87C666.974 961.433 692.748 954.704 710.521 946.709Z" fill="#C0C6CC" /><path d="M135.257 964.561C203.997 977.513 298.993 983.913 393.256 983.913C482.408 983.913 570.898 978.187 635.81 966.869C654.799 969.057 671.832 971.477 686.586 974.096C638.102 995.779 516.666 1006.94 394.649 1006.94C266.876 1006.94 138.472 994.701 92.6221 969.485C105.709 967.714 119.969 966.064 135.257 964.561Z" fill="#BAC0C6" /><path d="M745.618 608.435C857.192 608.435 933.82 517.067 933.82 378.314C933.82 266.499 885.122 223.624 822.566 223.624C779.743 223.624 760.126 238.616 751.608 249.067C750.018 394.391 741.14 608.435 745.618 608.435ZM826.556 200.808C852.307 200.808 876.165 201.542 895.461 217.209C895.443 217.182 895.429 217.154 895.411 217.132C902.726 223.057 909.382 231.125 915.232 242.118C980.807 365.241 938.697 487.439 921.144 522.502C866.319 632.12 762.579 622.186 732.481 623.778C730.887 623.863 729.31 623.964 727.75 624.086C723.197 532.421 730.453 404.506 728.276 248.494C736.739 242.238 748.071 219.881 748.071 219.881C748.071 219.881 779.784 200.816 818.485 200.816C821.193 200.815 823.887 200.808 826.556 200.808ZM45.3644 42.6876C49.4275 44.6422 55.382 46.5304 63.0595 48.3458C30.2392 244.302 26.4149 378.082 26.4059 485.8C26.4023 518.177 26.745 548.197 26.745 576.847C26.745 589.966 26.6767 602.796 26.4703 615.432C26.1903 632.685 26.0451 648.823 26.0451 664.002C26.0577 713.303 27.6369 752.531 31.2549 787.206C27.8432 786.76 26.0451 786.523 26.0451 786.523C26.0451 786.523 27.8559 786.872 31.2872 787.531C35.7613 830.213 43.3291 866.009 54.8651 905.26C54.8651 905.264 54.8652 905.267 54.8706 905.271L54.8381 905.356C54.8615 905.362 54.8742 905.366 54.8975 905.373C54.9101 905.421 54.9299 905.478 54.9424 905.525C54.9514 905.556 54.9656 905.593 54.9746 905.624C54.9926 905.689 55.0105 905.742 55.0338 905.805C55.0428 905.836 55.0518 905.87 55.0662 905.901C55.0841 905.966 55.1075 906.025 55.1308 906.09C55.1398 906.114 55.1488 906.145 55.1577 906.171C55.1847 906.252 55.2169 906.337 55.2456 906.42C55.251 906.427 55.2546 906.434 55.2546 906.44C55.2905 906.535 55.3281 906.626 55.3604 906.717C55.3694 906.735 55.373 906.748 55.3784 906.765C55.4107 906.842 55.4394 906.918 55.4699 906.995C55.4789 907.015 55.4879 907.036 55.4969 907.056C55.5292 907.133 55.5614 907.208 55.5938 907.285C55.5991 907.298 55.6027 907.316 55.6117 907.329C55.6889 907.515 55.7768 907.707 55.8647 907.89C55.8647 907.896 55.8702 907.9 55.8702 907.907C55.9115 907.988 55.9563 908.082 55.994 908.164C56.0029 908.182 56.0067 908.195 56.0174 908.211C56.0587 908.291 56.0945 908.37 56.1357 908.451C56.1411 908.46 56.1447 908.471 56.1537 908.484C56.2955 908.769 56.4426 909.038 56.6024 909.319C56.6077 909.329 56.6114 909.339 56.6168 909.348C56.667 909.433 56.7227 909.525 56.7675 909.612C56.7729 909.616 56.7729 909.619 56.7765 909.623C56.9398 909.903 57.1138 910.187 57.2933 910.465C57.2987 910.469 57.2988 910.471 57.2988 910.474C58.0274 911.6 58.8725 912.706 59.838 913.793H47.4874C49.4041 922.295 51.4895 930.776 53.7686 939.351C44.3037 933.946 37.8519 928.044 34.9662 921.638C-9.63776 822.644 -2.16313 608.144 6.8316 457.27C16.817 289.834 36.5617 104.755 45.3644 42.6876ZM745.898 37.6367C746.592 54.5821 747.201 99.9857 747.759 108.122C757.708 108.122 801.192 108.122 846.866 108.122C980.033 108.122 1037.79 175.486 1037.79 351.165C1037.79 567.886 1007.41 741.359 752.457 743.428C767.805 836.188 757.274 848.929 736.906 924.065C736.033 927.283 734.134 930.379 731.302 933.34C732.515 926.769 733.525 920.272 734.349 913.796H728.452C729.435 912.301 730.162 910.78 730.629 909.226C730.638 909.192 730.643 909.172 730.65 909.139C730.665 909.093 730.679 909.043 730.692 908.997C730.715 908.912 730.738 908.834 730.76 908.75C730.86 908.369 730.961 907.991 731.061 907.605C731.094 907.487 731.121 907.371 731.153 907.253C731.241 906.926 731.327 906.594 731.41 906.267C731.436 906.166 731.463 906.057 731.492 905.956C731.569 905.653 731.643 905.358 731.72 905.055C731.761 904.899 731.803 904.74 731.838 904.585C731.907 904.315 731.975 904.047 732.045 903.78C732.09 903.597 732.136 903.409 732.181 903.222C732.246 902.969 732.31 902.722 732.368 902.469C732.414 902.287 732.459 902.098 732.506 901.915C732.553 901.725 732.601 901.533 732.648 901.343C732.716 901.063 732.786 900.782 732.854 900.505C732.901 900.302 732.949 900.106 732.996 899.903C733.043 899.711 733.093 899.512 733.138 899.318C733.179 899.146 733.22 898.967 733.26 898.792C733.283 898.696 733.306 898.606 733.33 898.511C734.354 897.848 735.352 897.169 736.321 896.473C738.001 895.255 737.007 892.831 734.665 892.659C734.679 892.602 734.688 892.551 734.703 892.497C734.721 892.42 734.735 892.351 734.748 892.274C734.807 892.014 734.866 891.744 734.922 891.48C734.922 891.48 734.927 891.471 734.927 891.467C735.045 890.908 735.166 890.354 735.284 889.797C735.284 889.791 735.29 889.78 735.29 889.773C735.349 889.494 735.408 889.217 735.463 888.938C735.469 888.925 735.469 888.918 735.472 888.904C740.074 866.878 742.317 845.904 742.841 823.881C742.841 823.864 742.841 823.847 742.841 823.83C742.856 823.299 742.868 822.769 742.877 822.238C742.877 822.208 742.877 822.184 742.877 822.153C742.895 821.382 742.91 820.611 742.918 819.838C742.918 819.74 742.924 819.642 742.924 819.544C742.929 819.324 742.929 819.108 742.933 818.889C742.933 818.71 742.938 818.533 742.938 818.354C742.942 818.088 742.942 817.824 742.947 817.557C742.947 817.335 742.953 817.108 742.953 816.884C742.958 816.705 742.958 816.53 742.958 816.353C742.958 816.147 742.963 815.937 742.963 815.731C742.963 815.464 742.969 815.19 742.969 814.924C742.969 814.734 742.969 814.545 742.969 814.356C742.969 814.164 742.969 813.977 742.969 813.785C742.969 813.494 742.969 813.196 742.969 812.906C742.969 812.831 742.969 812.751 742.969 812.679C742.969 812.328 742.969 811.97 742.969 811.618C742.969 811.516 742.969 811.422 742.963 811.321C742.963 810.514 742.958 809.702 742.949 808.894C742.949 808.877 742.949 808.86 742.949 808.844C742.881 801.644 742.657 794.295 742.29 786.721C742.739 786.592 742.972 786.528 742.972 786.528C742.972 786.528 742.739 786.579 742.29 786.674C741.422 768.721 739.783 749.525 737.642 728.185C740.465 728.425 743.159 728.517 745.657 728.521C745.794 728.521 745.937 728.521 746.073 728.521C747.367 728.521 748.677 728.51 749.995 728.494C796.804 727.895 856.559 716.586 893.871 692.484C894.201 692.271 894.529 692.055 894.86 691.842C895.096 691.687 895.332 691.532 895.569 691.377C895.615 691.349 895.66 691.32 895.701 691.289C946.902 657.621 874.062 696.06 893.871 640.361C912.636 587.602 998.116 453.846 998.064 400.168C998.009 340.283 825.283 191.765 818.485 154.904C805.58 85.0112 956.61 150.786 915.231 134.107C915.012 134.02 914.796 133.927 914.572 133.843C911.717 132.718 908.657 131.677 905.419 130.71C905.387 130.703 905.349 130.69 905.319 130.683C905.132 130.626 904.944 130.572 904.752 130.515C904.637 130.485 904.531 130.451 904.412 130.417C904.285 130.38 904.152 130.343 904.019 130.306C875.486 122.125 833.871 119.736 797.775 119.736C765.917 119.736 738.358 121.601 727.937 122.991C726.711 123.153 725.534 123.386 724.41 123.681C724.145 118.265 723.861 112.84 723.565 107.37C723.99 105.315 724.15 102.871 723.99 99.8531C722.928 80.2914 721.342 67.869 719.8 48.4837C732.233 45.2429 741.052 41.6294 745.898 37.6367Z" fill="#94989D" /><path d="M728.452 913.795H734.35C733.526 920.271 732.515 926.769 731.302 933.339C726.719 938.133 719.682 942.587 710.519 946.707C711.159 944.117 711.759 941.549 712.322 938.998C720.382 934.262 724.634 929.251 724.634 924.062C724.634 922.48 724.235 920.909 723.453 919.36C725.52 917.557 727.194 915.702 728.452 913.795ZM47.4808 913.795H59.8316C60.0524 914.042 60.2749 914.286 60.5046 914.532C56.7987 917.626 54.8639 920.81 54.8639 924.064C54.8639 929.811 60.8941 935.34 72.0477 940.52C72.8248 943.248 73.627 945.986 74.4507 948.74C66.4987 945.799 59.5732 942.672 53.764 939.353C51.483 930.777 49.3957 922.296 47.4808 913.795Z" fill="#C0C6CC" /><path d="M72.0457 940.521C89.9831 948.85 121.156 956.259 161.78 962.174C152.634 962.921 143.783 963.719 135.255 964.561C111.461 960.075 90.8248 954.803 74.447 948.741C73.625 945.986 72.8246 943.248 72.0457 940.521ZM712.322 938.999C711.759 941.55 711.161 944.12 710.519 946.709C692.746 954.703 666.972 961.433 635.808 966.868C628.558 966.033 621.004 965.229 613.199 964.466C660.737 957.895 695.162 949.076 712.322 938.999Z" fill="#D6DEE5" /><path d="M161.783 962.173C223.775 971.198 307.773 976.742 400.247 976.742C484.606 976.742 557.808 972.129 613.203 964.466C621.008 965.229 628.561 966.033 635.812 966.868C570.899 978.186 482.409 983.912 393.257 983.912C298.994 983.912 203.998 977.512 135.258 964.56C143.786 963.718 152.638 962.919 161.783 962.173Z" fill="#D3DBE2" /><path d="M723.455 919.362C724.237 920.911 724.636 922.482 724.636 924.064C724.636 929.253 720.384 934.262 712.325 938.999C713.344 934.375 714.241 929.8 715.029 925.259C715.907 924.752 716.754 924.238 717.563 923.724C717.572 923.715 717.59 923.704 717.604 923.698C717.71 923.63 717.809 923.563 717.915 923.495C717.956 923.468 718.001 923.441 718.042 923.414C718.125 923.357 718.207 923.307 718.29 923.248C718.378 923.194 718.464 923.137 718.546 923.08C718.559 923.073 718.564 923.069 718.579 923.059C720.39 921.853 722.019 920.62 723.455 919.362ZM60.5067 914.532C62.1847 916.306 64.1891 918.044 66.4863 919.724C68.202 926.623 70.0486 933.528 72.0479 940.519C60.8942 935.339 54.8643 929.81 54.8643 924.062C54.8661 920.808 56.8008 917.625 60.5067 914.532Z" fill="#D6DEE5" /><path d="M715.025 925.257C714.238 929.8 713.342 934.374 712.321 938.998C695.161 949.074 660.736 957.894 613.199 964.464C593.46 962.535 572.036 960.836 549.197 959.411C624.689 952.991 686.885 941.546 715.025 925.257ZM66.4846 919.724C91.3852 937.935 151.735 950.599 226.523 957.92C203.672 959.086 182.011 960.513 161.782 962.171C121.157 956.256 89.9855 948.846 72.0481 940.518C70.0471 933.529 68.2002 926.623 66.4846 919.724Z" fill="#E2EBF3" /><path d="M226.522 957.922C278.364 962.995 337.131 965.504 395.757 965.504C448.738 965.504 501.611 963.459 549.198 959.412C572.035 960.839 593.459 962.536 613.2 964.466C557.805 972.129 484.604 976.742 400.245 976.742C307.771 976.742 223.775 971.198 161.781 962.173C182.01 960.514 203.671 959.087 226.522 957.922Z" fill="#E0EAF1" /><path d="M56.7719 909.624C56.9352 909.903 57.1095 910.187 57.2889 910.465C57.1113 910.188 56.937 909.905 56.7719 909.624ZM56.6122 909.35C56.6625 909.438 56.7127 909.527 56.763 909.614C56.7163 909.525 56.6625 909.435 56.6122 909.35ZM730.653 909.137C730.644 909.171 730.64 909.191 730.631 909.224C730.635 909.195 730.644 909.167 730.653 909.137ZM56.1493 908.484C56.2911 908.762 56.4419 909.043 56.598 909.32C56.4383 909.039 56.2911 908.77 56.1493 908.484ZM56.0129 908.211C56.0487 908.289 56.0901 908.37 56.1314 908.451C56.0901 908.369 56.0541 908.292 56.0129 908.211ZM55.8656 907.908C55.9069 907.995 55.9484 908.08 55.9896 908.165C55.9537 908.083 55.9069 907.988 55.8656 907.908ZM731.066 907.603C730.965 907.988 730.865 908.366 730.764 908.748C730.741 908.833 730.718 908.911 730.696 908.995C730.719 908.914 730.743 908.829 730.764 908.748C730.863 908.369 730.964 907.984 731.066 907.603ZM55.6091 907.329C55.6917 907.519 55.7742 907.705 55.8621 907.89C55.7742 907.707 55.6881 907.515 55.6091 907.329ZM55.3758 906.765C55.4081 906.839 55.4369 906.917 55.4674 906.994C55.4369 906.917 55.4081 906.841 55.3758 906.765ZM55.252 906.44C55.2879 906.531 55.3255 906.625 55.3578 906.717C55.3273 906.625 55.2897 906.534 55.252 906.44ZM731.412 906.263C731.33 906.591 731.244 906.922 731.156 907.25C731.244 906.924 731.33 906.592 731.412 906.263ZM55.1569 906.169C55.1839 906.254 55.2161 906.335 55.2448 906.418C55.2161 906.335 55.1839 906.25 55.1569 906.169ZM55.0654 905.899C55.0833 905.964 55.1067 906.023 55.13 906.088C55.1067 906.025 55.0851 905.964 55.0654 905.899ZM54.9738 905.621C54.9917 905.682 55.0096 905.743 55.0329 905.803C55.0114 905.741 54.9917 905.686 54.9738 905.621ZM54.8967 905.371C54.9146 905.423 54.929 905.473 54.9416 905.523C54.929 905.477 54.9092 905.419 54.8967 905.371ZM732.049 903.776C731.979 904.042 731.911 904.31 731.843 904.58C731.911 904.31 731.979 904.044 732.049 903.776ZM732.372 902.464C732.313 902.717 732.249 902.964 732.186 903.217C732.249 902.965 732.31 902.717 732.372 902.464ZM733 899.898C732.954 900.101 732.905 900.297 732.859 900.5C732.904 900.297 732.954 900.101 733 899.898ZM733.264 898.787C733.223 898.964 733.183 899.141 733.142 899.314C733.183 899.139 733.223 898.966 733.264 898.787ZM734.752 892.27C734.739 892.348 734.725 892.415 734.707 892.492C734.72 892.418 734.739 892.344 734.752 892.27ZM734.932 891.462C734.932 891.466 734.926 891.471 734.926 891.471C734.926 891.469 734.932 891.469 734.932 891.462ZM735.292 889.769C735.292 889.775 735.287 889.786 735.287 889.793C735.289 889.786 735.292 889.775 735.292 889.769ZM735.475 888.899C735.47 888.912 735.47 888.92 735.466 888.933C735.47 888.924 735.475 888.909 735.475 888.899ZM742.844 823.826C742.844 823.843 742.844 823.861 742.844 823.878C742.844 823.863 742.844 823.843 742.844 823.826ZM742.882 822.15C742.882 822.181 742.882 822.204 742.882 822.235C742.882 822.204 742.882 822.178 742.882 822.15ZM742.927 819.54C742.927 819.639 742.921 819.737 742.921 819.835C742.923 819.739 742.927 819.635 742.927 819.54ZM742.941 818.351C742.941 818.53 742.936 818.706 742.936 818.885C742.937 818.705 742.941 818.526 742.941 818.351ZM742.955 816.88C742.955 817.104 742.95 817.33 742.95 817.554C742.95 817.33 742.955 817.103 742.955 816.88ZM742.964 815.728C742.964 815.935 742.959 816.144 742.959 816.35C742.959 816.14 742.964 815.934 742.964 815.728ZM742.968 814.352C742.968 814.54 742.968 814.73 742.968 814.919C742.968 814.731 742.968 814.541 742.968 814.352ZM742.968 812.901C742.968 813.191 742.968 813.49 742.968 813.78C742.968 813.49 742.968 813.193 742.968 812.901ZM742.968 811.613C742.968 811.965 742.968 812.323 742.968 812.674C742.968 812.32 742.968 811.969 742.968 811.613ZM742.95 808.89C742.959 809.697 742.964 810.509 742.964 811.316C742.964 810.511 742.959 809.697 742.95 808.89ZM742.291 786.714C742.657 794.289 742.882 801.639 742.95 808.838C742.882 801.639 742.652 794.29 742.291 786.714ZM708.073 227.961C712.52 240.274 718.315 249.29 723.988 250.071C724.034 250.074 724.079 250.08 724.126 250.084C724.212 250.095 724.304 250.098 724.395 250.098C724.408 250.098 724.418 250.098 724.431 250.098C725.598 250.098 726.897 249.509 728.273 248.492C730.45 404.504 723.195 532.419 727.748 624.084C699.805 626.277 677.589 635.337 684.75 677.904C691.356 717.28 717.683 726.484 737.643 728.178C739.784 749.518 741.421 768.713 742.291 786.667H742.286C741.573 771.853 740.328 756.201 738.713 739.195C736.595 716.783 679.163 747.233 672.763 669.36C667.444 604.722 727.211 612.525 726.283 594.318C720.955 489.869 724.142 339.922 728.04 283.935C728.146 282.266 716.782 268.109 707.687 245.248C707.838 241.283 707.971 237.295 708.071 233.286C708.118 231.513 708.118 229.736 708.073 227.961ZM723.562 107.36C723.858 112.83 724.144 118.255 724.408 123.671C704.1 129.021 700.39 155.476 700.245 182.395C700.245 182.439 700.245 182.483 700.245 182.527C700.239 182.743 700.239 182.963 700.239 183.183C699.206 179.279 698.131 175.348 697.056 171.392C700.336 115.209 720.19 123.694 723.562 107.36Z" fill="#C0C6CC" /><path d="M59.8323 913.795C60.053 914.039 60.2755 914.288 60.5088 914.532H60.5035C60.2774 914.284 60.053 914.042 59.8323 913.795Z" fill="#D6DEE5" /><path d="M717.56 923.723C716.749 924.236 715.904 924.751 715.026 925.257C715.904 924.747 716.747 924.236 717.56 923.723ZM717.914 923.492C717.808 923.56 717.708 923.628 717.603 923.695C717.708 923.628 717.808 923.561 717.914 923.492ZM718.289 923.247C718.206 923.304 718.124 923.354 718.041 923.413C718.124 923.358 718.206 923.304 718.289 923.247ZM718.576 923.056C718.562 923.067 718.558 923.069 718.544 923.077C718.558 923.071 718.567 923.064 718.576 923.056ZM60.5111 914.532C62.1909 916.31 64.1847 918.037 66.4854 919.721V919.725C64.1883 918.045 62.1856 916.308 60.5058 914.534H60.5111" fill="#E2EBF3" /><path d="M715.025 925.257C686.885 941.546 624.687 952.991 549.199 959.41C514.871 957.267 477.376 955.732 437.781 954.939C536.888 953.741 631.06 945.002 680.184 928.8C678.729 932.575 677.225 936.339 675.665 940.087C692.129 935.695 705.519 930.753 715.025 925.257ZM66.4846 919.721C90.3963 937.214 147.055 949.591 217.753 957.022C201.974 951.498 186.932 944.923 173.373 937.301C223.733 946.76 290.725 952.429 360.427 954.345C313.014 954.554 267.838 955.811 226.523 957.921C151.735 950.599 91.3852 937.936 66.4846 919.725V919.721Z" fill="#E7F2F9" /><path d="M360.427 954.346C378.258 954.836 396.271 955.082 414.227 955.082C422.105 955.082 429.946 955.035 437.783 954.94C477.376 955.734 514.872 957.268 549.201 959.411C501.615 963.458 448.739 965.503 395.76 965.503C337.134 965.503 278.367 962.996 226.525 957.921C267.838 955.812 313.014 954.554 360.427 954.346Z" fill="#E7F1F8" /><path d="M57.2906 910.466C57.296 910.472 57.2959 910.472 57.2959 910.475C57.2941 910.472 57.2942 910.47 57.2906 910.466ZM56.7646 909.614C56.77 909.618 56.77 909.618 56.7736 909.625C56.77 909.621 56.77 909.617 56.7646 909.614ZM56.5997 909.32C56.6051 909.329 56.6085 909.34 56.6139 909.349C56.6085 909.34 56.6051 909.331 56.5997 909.32ZM56.1331 908.451C56.1384 908.461 56.1474 908.475 56.151 908.485C56.1421 908.471 56.1384 908.461 56.1331 908.451ZM55.9913 908.164C56.0003 908.181 56.0038 908.194 56.0145 908.21C56.0056 908.194 56.0003 908.181 55.9913 908.164ZM55.8638 907.89C55.8692 907.901 55.8693 907.897 55.8693 907.908C55.8675 907.9 55.8638 907.897 55.8638 907.89ZM55.5928 907.284C55.5982 907.302 55.6018 907.315 55.6108 907.328C55.6036 907.315 55.5982 907.299 55.5928 907.284ZM55.4708 906.994C55.4798 907.011 55.4888 907.035 55.4978 907.055C55.487 907.035 55.4798 907.014 55.4708 906.994ZM55.3595 906.717C55.3649 906.734 55.3721 906.747 55.3775 906.765C55.3739 906.747 55.3703 906.734 55.3595 906.717ZM55.2465 906.42C55.2519 906.424 55.2555 906.437 55.2555 906.44C55.2537 906.433 55.2501 906.427 55.2465 906.42ZM55.1317 906.088C55.1407 906.115 55.1443 906.139 55.1586 906.169C55.1497 906.143 55.1407 906.112 55.1317 906.088ZM55.0346 905.805C55.0436 905.831 55.0563 905.872 55.0671 905.9C55.0545 905.868 55.0436 905.835 55.0346 905.805Z" fill="#C8CFD5" /><path d="M54.8976 905.371C59.5906 906.638 64.3212 907.876 69.0608 909.069C66.0602 910.618 63.5029 912.193 61.4301 913.795H59.8328C58.8673 912.706 58.022 911.602 57.2934 910.476C57.2934 910.473 57.2933 910.473 57.2879 910.467C57.1102 910.19 56.9362 909.906 56.7711 909.625C56.7657 909.618 56.7657 909.618 56.7621 909.614C56.7119 909.526 56.6616 909.438 56.6114 909.35C56.606 909.341 56.6025 909.33 56.5971 909.321C56.441 909.044 56.2903 908.763 56.1485 908.486C56.1449 908.476 56.1359 908.462 56.1305 908.452C56.0892 908.37 56.0479 908.289 56.012 908.212C56.003 908.196 55.9975 908.182 55.9886 908.166C55.9473 908.081 55.9061 907.996 55.8648 907.909C55.8648 907.898 55.8649 907.902 55.8595 907.892C55.7716 907.706 55.6908 907.52 55.6065 907.331C55.5975 907.317 55.5939 907.303 55.5885 907.287C55.5562 907.21 55.5238 907.134 55.4915 907.057C55.4825 907.038 55.4735 907.014 55.4645 906.996C55.4322 906.919 55.4055 906.841 55.3732 906.767C55.3678 906.75 55.3606 906.737 55.3552 906.719C55.3229 906.628 55.2851 906.534 55.2492 906.442C55.2492 906.438 55.2456 906.425 55.2402 906.422C55.2115 906.337 55.1793 906.257 55.1524 906.173C55.138 906.142 55.1344 906.119 55.1254 906.092C55.1021 906.027 55.0787 905.967 55.0608 905.902C55.0518 905.876 55.0376 905.835 55.0286 905.807C55.0053 905.747 54.9872 905.686 54.9692 905.625C54.9602 905.595 54.946 905.558 54.937 905.527C54.9298 905.473 54.9155 905.422 54.8976 905.371ZM31.2873 787.53C36.2926 788.492 44.7417 790.118 56.0659 792.302C57.7439 792.657 59.5007 792.992 61.3258 793.31C66.3257 832.045 74.3549 868.474 87.0771 900.491C87.2332 900.879 87.4074 901.272 87.5941 901.656C80.9754 903.799 75.2792 906.025 70.5755 908.312C65.3513 907.295 60.1217 906.25 54.9011 905.172L54.8689 905.27C54.8635 905.266 54.8634 905.263 54.8634 905.259C43.3275 866.009 35.7614 830.212 31.2873 787.53ZM63.0595 48.3448C71.9161 50.4373 83.0499 52.4251 96.1992 54.2802C86.3951 114.216 78.1739 165.129 71.7096 215.203C60.8574 213.706 54.8652 212.877 54.8652 212.877C54.8652 212.877 60.8126 214.09 71.5679 216.285C60.6888 300.893 54.824 383.265 54.824 502.839C54.824 592.894 49.3843 698.504 61.0548 791.172C59.5168 790.974 58.0309 790.76 56.5952 790.527C44.9749 789.006 36.3283 787.869 31.2549 787.204C27.6369 752.529 26.0577 713.301 26.0451 664C26.0451 648.82 26.1904 632.682 26.4704 615.43C26.6768 602.794 26.7451 589.963 26.7451 576.845C26.7451 548.193 26.4024 518.174 26.406 485.798C26.4149 378.08 30.2392 244.3 63.0595 48.3369" fill="#DBE3E9" /><path d="M59.8305 913.795H61.4277C61.1065 914.039 60.8013 914.286 60.5087 914.532C60.2754 914.288 60.0512 914.039 59.8305 913.795Z" fill="#E3EDF4" /><path d="M69.0606 909.069C75.5806 910.716 82.1311 912.287 88.7318 913.795H65.0479H61.428C63.5026 912.193 66.06 910.618 69.0606 909.069ZM87.5922 901.656C89.656 905.894 93.6759 909.88 99.4277 913.612C89.7941 911.945 80.1766 910.177 70.5753 908.312C75.2773 906.024 80.9735 903.799 87.5922 901.656Z" fill="#E3EDF4" /><path d="M61.43 913.795H65.0498C65.5164 915.769 65.9954 917.747 66.4854 919.721C64.1846 918.037 62.189 916.31 60.511 914.532C60.8036 914.284 61.1088 914.039 61.43 913.795Z" fill="#E8F3F9" /><path d="M65.0502 913.795H88.7341C94.6438 915.145 100.591 916.439 106.562 917.683C121.865 925.427 144.976 931.967 173.376 937.302C186.935 944.924 201.977 951.498 217.756 957.022C147.058 949.593 90.3995 937.214 66.4878 919.721C65.996 917.747 65.5168 915.769 65.0502 913.795Z" fill="#EAF5FC" /><path d="M719.798 48.4736C721.34 67.859 722.928 80.2813 723.989 99.843C724.149 102.861 723.989 105.305 723.564 107.36C722.512 88.0585 721.263 68.4199 719.786 48.4763C719.786 48.4763 719.795 48.4776 719.798 48.4736Z" fill="#C8CFD5" /><path d="M719.783 48.4775C721.26 68.4211 722.509 88.0598 723.561 107.362C720.188 123.696 700.334 115.21 697.054 171.393C687.347 135.63 677.725 97.4852 698.633 53.0099C706.544 51.5937 713.613 50.082 719.783 48.4775Z" fill="#DBE3E9" /><path d="M730.629 909.225C730.162 910.781 729.435 912.302 728.452 913.795H728.447C729.432 912.3 730.162 910.777 730.629 909.225ZM730.693 908.995C730.681 909.042 730.667 909.09 730.652 909.136C730.667 909.093 730.681 909.038 730.693 908.995ZM731.155 907.251C731.123 907.369 731.096 907.484 731.063 907.602C731.092 907.491 731.128 907.365 731.155 907.251ZM731.494 905.953C731.465 906.055 731.438 906.162 731.411 906.263C731.438 906.158 731.467 906.057 731.494 905.953ZM731.842 904.58C731.806 904.735 731.765 904.894 731.724 905.049C731.765 904.894 731.804 904.733 731.842 904.58ZM732.185 903.218C732.138 903.405 732.093 903.594 732.048 903.777C732.093 903.59 732.138 903.404 732.185 903.218ZM732.51 901.909C732.463 902.092 732.418 902.282 732.372 902.464C732.418 902.278 732.465 902.096 732.51 901.909ZM733.141 899.313C733.095 899.507 733.045 899.706 733 899.898C733.045 899.706 733.095 899.511 733.141 899.313ZM734.706 892.492C734.692 892.546 734.683 892.597 734.669 892.654C734.678 892.601 734.692 892.542 734.706 892.492ZM734.925 891.475C734.87 891.739 734.81 892.009 734.751 892.269C734.81 892.005 734.87 891.743 734.925 891.475ZM735.288 889.792C735.169 890.349 735.049 890.903 734.931 891.462C735.049 890.907 735.168 890.345 735.288 889.792ZM742.843 823.877C742.317 845.899 740.076 866.874 735.475 888.9C740.076 866.874 742.319 845.895 742.843 823.877ZM742.881 822.234C742.872 822.765 742.858 823.295 742.845 823.826C742.858 823.295 742.87 822.765 742.881 822.234ZM742.922 819.834C742.913 820.609 742.901 821.379 742.881 822.15C742.899 821.379 742.911 820.609 742.922 819.834ZM742.937 818.885C742.931 819.104 742.931 819.321 742.928 819.54C742.931 819.32 742.931 819.101 742.937 818.885ZM742.949 817.552C742.944 817.819 742.944 818.083 742.94 818.349C742.944 818.084 742.944 817.82 742.949 817.552ZM742.958 816.35C742.958 816.526 742.958 816.701 742.953 816.88C742.958 816.701 742.958 816.529 742.958 816.35ZM742.967 814.919C742.967 815.185 742.962 815.46 742.962 815.726C742.964 815.46 742.967 815.187 742.967 814.919ZM742.967 813.78C742.967 813.972 742.967 814.159 742.967 814.351C742.967 814.159 742.967 813.976 742.967 813.78ZM742.967 812.675C742.967 812.747 742.967 812.828 742.967 812.902C742.967 812.824 742.967 812.749 742.967 812.675ZM742.963 811.316C742.969 811.418 742.969 811.512 742.969 811.613C742.967 811.512 742.967 811.418 742.963 811.316ZM742.949 808.839C742.949 808.856 742.949 808.873 742.949 808.889C742.949 808.876 742.949 808.852 742.949 808.839Z" fill="#C8CFD5" /><path d="M728.448 913.795H728.453C727.195 915.702 725.521 917.557 723.453 919.362C725.515 917.557 727.19 915.702 728.448 913.795Z" fill="#DBE3E9" /><path d="M717.6 923.696C717.586 923.702 717.568 923.713 717.559 923.722C717.568 923.713 717.587 923.704 717.6 923.696ZM718.04 923.412C717.998 923.438 717.954 923.466 717.912 923.493C717.954 923.466 717.998 923.44 718.04 923.412ZM723.452 919.362C722.016 920.621 720.387 921.854 718.576 923.057C720.387 921.85 722.016 920.621 723.452 919.362Z" fill="#E3EDF4" /><path d="M733.334 898.506C733.31 898.601 733.287 898.693 733.263 898.787C733.222 898.966 733.183 899.138 733.141 899.313C733.095 899.51 733.045 899.706 733 899.898C732.953 900.101 732.905 900.297 732.858 900.5C732.79 900.777 732.72 901.058 732.652 901.338C732.605 901.528 732.556 901.72 732.51 901.91C732.463 902.097 732.418 902.278 732.372 902.464C732.307 902.717 732.248 902.964 732.185 903.217C732.138 903.404 732.093 903.588 732.048 903.775C731.978 904.042 731.91 904.31 731.842 904.58C731.806 904.733 731.765 904.895 731.724 905.05C731.646 905.353 731.573 905.648 731.496 905.951C731.467 906.056 731.44 906.158 731.413 906.262C731.331 906.589 731.245 906.921 731.157 907.248C731.13 907.364 731.092 907.488 731.065 907.6C730.965 907.982 730.864 908.366 730.764 908.745C730.74 908.828 730.717 908.911 730.695 908.992C730.683 909.036 730.668 909.09 730.654 909.134C730.645 909.164 730.636 909.191 730.633 909.221C730.166 910.773 729.434 912.298 728.45 913.791H718.915C717.318 912.381 715.392 910.992 713.151 909.627C713.488 909.103 713.801 908.566 714.07 908.032C721.164 905.304 727.675 902.164 733.334 898.506ZM742.291 786.714C742.651 794.288 742.881 801.639 742.949 808.838C742.949 808.851 742.949 808.875 742.949 808.888C742.958 809.696 742.963 810.511 742.963 811.315C742.969 811.417 742.969 811.511 742.969 811.612C742.969 811.967 742.969 812.317 742.969 812.673C742.969 812.747 742.969 812.821 742.969 812.899C742.969 813.19 742.969 813.488 742.969 813.779C742.969 813.975 742.969 814.158 742.969 814.35C742.969 814.538 742.969 814.728 742.969 814.918C742.969 815.184 742.963 815.459 742.963 815.725C742.963 815.932 742.958 816.138 742.958 816.347C742.958 816.526 742.958 816.698 742.953 816.878C742.953 817.102 742.947 817.327 742.947 817.551C742.942 817.818 742.942 818.082 742.938 818.348C742.938 818.524 742.933 818.703 742.933 818.882C742.928 819.099 742.928 819.319 742.924 819.538C742.924 819.632 742.919 819.736 742.919 819.832C742.91 820.606 742.897 821.377 742.877 822.147C742.877 822.174 742.877 822.201 742.877 822.232C742.868 822.762 742.854 823.293 742.841 823.823C742.841 823.84 742.841 823.86 742.841 823.875C742.316 845.894 740.074 866.872 735.473 888.897C735.473 888.908 735.467 888.921 735.464 888.932C735.408 889.209 735.349 889.486 735.29 889.767C735.29 889.774 735.284 889.784 735.284 889.791C735.166 890.345 735.046 890.906 734.927 891.46C734.927 891.467 734.922 891.467 734.922 891.474C734.866 891.742 734.807 892.004 734.748 892.268C734.735 892.342 734.715 892.417 734.703 892.491C734.688 892.541 734.674 892.6 734.665 892.653C734.579 892.646 734.487 892.643 734.396 892.643C734.328 892.643 734.254 892.647 734.18 892.65C728.764 892.955 723.328 893.505 717.88 894.249C726.824 857.347 727.905 836.731 718.754 792.706C721.471 792.213 723.983 791.746 726.252 791.243C729.852 790.221 732.912 789.364 735.404 788.657C738.879 787.678 741.21 787.019 742.291 786.714ZM707.688 245.248C716.783 268.109 728.147 282.266 728.041 283.935C724.143 339.922 720.956 489.869 726.284 594.318C727.212 612.525 667.445 604.722 672.765 669.36C679.164 747.234 736.596 716.784 738.714 739.194C740.329 756.201 741.573 771.855 742.287 786.666C741.189 786.902 738.773 787.417 735.164 788.181C732.648 788.715 729.523 789.374 725.859 790.155C723.59 790.459 721.11 790.79 718.434 791.146C715.726 778.278 712.162 763.414 707.69 745.611C703.352 728.351 665.162 702.719 666.813 651.079C667.975 614.593 677.459 586.814 677.436 544.893C677.398 461.201 703.144 362.901 707.688 245.248Z" fill="#DBE3E9" /><path d="M718.914 913.795H728.449C727.191 915.702 725.517 917.557 723.453 919.362C722.5 917.476 720.982 915.617 718.914 913.795Z" fill="#E3EDF4" /><path d="M713.149 909.632C715.39 910.998 717.316 912.386 718.913 913.796H716.781H709.617C711.049 912.436 712.23 911.053 713.149 909.632Z" fill="#E3EDF4" /><path d="M716.782 913.795H718.914C720.981 915.617 722.501 917.476 723.452 919.362C722.016 920.62 720.387 921.849 718.576 923.056C718.567 923.063 718.558 923.069 718.544 923.077C718.461 923.134 718.375 923.192 718.287 923.246C718.205 923.303 718.122 923.357 718.04 923.411C717.998 923.438 717.954 923.466 717.912 923.492C717.806 923.56 717.706 923.627 717.602 923.695C717.587 923.702 717.569 923.712 717.56 923.722C716.746 924.235 715.904 924.747 715.026 925.256C715.689 921.421 716.274 917.601 716.782 913.795Z" fill="#E8F3F9" /><path d="M709.62 913.795H716.784C716.276 917.601 715.691 921.421 715.027 925.257C705.521 930.754 692.129 935.696 675.665 940.086C677.225 936.338 678.731 932.576 680.184 928.799C693.644 924.358 703.746 919.352 709.62 913.795Z" fill="#EAF5FC" /><path d="M120.151 801.332C125.5 801.876 131.031 802.441 136.718 803.023C148.286 804.304 160.576 805.321 173.429 806.298C173.612 832.265 176.934 858.115 185.684 882.79C162.011 885.656 140.862 888.986 122.824 892.687C113.244 877.389 108.912 860.055 111.871 840.689C113.883 827.499 116.761 814.39 120.151 801.332ZM701.955 795.751C705.286 830.186 700.387 865.157 690.222 899.395C690.015 899.443 689.814 899.486 689.613 899.533C637.94 882.801 532.906 871.396 400.246 871.396C322.348 871.396 250.473 875.328 192.689 881.963C188.69 856.598 186.847 831.892 186.833 807.301C188.251 807.406 189.674 807.51 191.103 807.619C210.422 809.249 230.866 810.174 252.02 811.138C273.161 812.118 295.05 812.491 317.274 813.218C339.497 813.501 362.097 813.999 384.683 814.056C407.283 813.837 429.867 813.789 452.091 813.17C474.329 812.777 496.191 812.118 517.346 811.28C538.514 810.757 558.917 809.24 578.263 808.144C597.609 806.846 615.874 805.426 632.713 804.014C649.528 802.316 664.955 801.077 678.506 799.018C685.283 798.093 691.631 797.234 697.492 796.442C699.014 796.231 700.505 795.998 701.955 795.751ZM148.299 227.239C151.515 227.571 154.799 227.905 158.139 228.254C166.511 229.02 175.261 229.718 184.347 230.416C187.106 324.029 211.31 417.625 209.296 511.852C207.837 580.761 193.281 647.734 182.104 715.965C177.668 743.09 173.782 771.552 173.44 799.964C160.877 799.366 148.851 798.706 137.515 797.777C131.98 797.381 126.6 797.016 121.384 796.649C133.238 752.498 150.422 708.851 159.004 664.309C171.121 601.473 166.771 539.067 162.772 475.928C157.618 394.415 144.767 310.041 148.299 227.239ZM693.176 220.063C695.742 287.66 689.723 355.999 682.261 422.867C676.556 473.8 657.904 522.074 646.935 572.291C640.586 601.389 638.147 630.56 649.466 659.214C658.322 681.609 671.086 702.779 681.85 724.653C692.885 747.034 699.199 770.07 701.715 793.367C700.15 793.557 698.549 793.736 696.896 793.887C690.999 794.395 684.622 794.954 677.819 795.547C664.268 796.919 648.755 797.426 632.002 798.741C615.172 799.667 596.922 800.553 577.617 801.297C558.292 801.877 537.931 802.49 516.856 803.128C495.766 803.767 473.98 804.206 451.831 804.386C439.859 804.618 427.772 804.663 415.635 804.663C411.746 804.663 407.857 804.659 403.964 804.653C399.686 804.653 395.4 804.649 391.113 804.649C388.967 804.649 386.822 804.649 384.681 804.653C379.85 804.69 375.019 804.703 370.197 804.703C352.543 804.703 334.934 804.514 317.542 804.454C295.409 803.941 273.611 803.778 252.547 802.994C231.509 802.071 211.091 801.908 191.822 800.81C190.166 800.736 188.515 800.661 186.872 800.587C187.389 760.697 192.66 720.959 201.31 679.003C213.607 619.346 224.345 559.478 224.628 498.999C224.939 430.498 212.394 363.021 204.704 294.913C202.299 273.612 201.904 252.65 202.549 231.815C204.663 231.981 206.795 232.147 208.936 232.315C226.992 233.32 246.042 234.702 265.772 235.389C285.52 236.007 305.911 237.076 326.666 237.259C347.403 237.678 368.479 237.972 389.555 237.972C392.107 237.985 394.667 237.993 397.213 237.993C415.745 237.993 434.231 237.686 452.463 237.448C462.453 237.371 472.364 237.104 482.159 236.789C470.237 254.937 464.313 277.176 463.383 300.284C460.697 351.59 470.144 403.828 467.459 455.143C464.673 504.075 454.71 554.377 459.21 604.34C463.575 650.724 480.045 698.034 510.589 735.48C536.016 765.882 569.238 780.626 605.892 790.515L642.082 789.686C644.238 783.68 647.655 778.826 649.823 772.815C662.846 737.951 643.202 701.447 630.956 668.356C613.219 619.893 607.67 573.526 621.248 523.147C647.653 433.145 708.522 329.246 644.315 237.727C641.871 234.164 639.259 230.811 636.483 227.67C638.884 227.451 641.246 227.238 643.565 227.028C650.688 226.133 657.441 225.281 663.79 224.48C675.016 223.213 684.847 221.533 693.176 220.063ZM582.518 89.4268C595.095 89.4268 610.296 89.0581 616.902 83.2435C618.26 82.0606 617.936 80.647 616.299 79.7347C611.701 77.1887 605.045 76.368 597.771 76.368C585.592 76.3719 571.7 78.6699 562.894 79.0452C521.734 80.8102 480.561 82.355 439.392 83.9966C394.002 85.808 347.902 87.7016 301.898 87.7016C260.264 87.7016 218.702 86.1501 177.822 81.5832L177.758 81.7556C226.708 91.9436 280.396 94.0904 333.661 94.0904C369.628 94.0904 405.407 93.1105 439.392 92.9686C483.054 92.7803 526.56 91.5285 570.135 89.5183C571.975 89.4334 574.098 89.4162 576.404 89.4162C577.493 89.4162 578.619 89.4201 579.774 89.4228C580.67 89.4228 581.589 89.4268 582.518 89.4268ZM663.537 58.0713C676.534 90.9199 683.932 125.116 688.108 157.589C690.674 177.631 692.275 197.808 693.093 218.044C684.612 219.105 674.598 220.303 663.119 221.012C653.696 221.826 643.348 222.483 632.226 223.124C613.566 204.445 588.889 194.501 563.059 194.501C552.263 194.501 541.262 196.238 530.418 199.805C512.883 205.751 499.145 215.544 488.783 227.878C462.529 228.273 435.376 228.625 408.062 228.625C401.908 228.625 395.745 228.605 389.584 228.568C385.627 228.585 381.67 228.592 377.718 228.592C339.702 228.592 301.923 227.845 266.276 227.128C246.623 226.563 227.611 226.013 209.582 225.495C207.303 225.387 205.04 225.279 202.793 225.175C204.503 183.506 209.969 142.277 211.402 99.8454C211.493 97.0541 208.245 95.4642 205.103 95.4642C202.604 95.4642 200.18 96.4614 199.527 98.6546C187.079 140.593 183.391 182.455 184.195 224.318C175.435 223.909 166.975 223.493 158.883 223.006C155.375 222.723 151.92 222.475 148.53 222.243C150.048 192.325 153.778 162.612 160.845 133.336C166.651 109.292 175.055 85.7616 186.088 62.9564C244.303 66.8231 315.807 69.1013 393.091 69.1013C506.874 69.1013 600.666 65.4228 663.537 58.0713Z" fill="#D6DEE5" /><path d="M400.247 871.396C532.907 871.396 637.943 882.802 689.614 899.534C670.248 903.922 650.82 909.501 631.538 913.794H140.523C133.515 907.25 127.536 900.215 122.825 892.685C140.863 888.984 162.012 885.654 185.685 882.787C188.591 890.985 192.094 899.05 196.276 906.946L197.245 906.747C195.493 898.405 193.978 890.151 192.688 881.964C250.474 875.328 322.347 871.396 400.247 871.396Z" fill="#E2EBF3" /><path d="M684.621 916.699C683.209 920.749 681.726 924.781 680.185 928.8C631.062 945.002 536.89 953.743 437.781 954.939C417.272 954.527 396.201 954.315 374.703 954.315C369.919 954.315 365.165 954.324 360.425 954.345C290.725 952.428 223.731 946.76 173.372 937.302C167.502 934.002 161.908 930.504 156.655 926.81C232.116 938.712 310.805 943.236 387.47 943.236C404.507 943.236 421.461 943.009 438.242 942.596C496.346 941.163 554.386 937.645 611.366 928.731C632.736 925.383 659.764 922.351 684.621 916.699ZM140.523 913.795H631.538C623.487 915.586 615.461 917.151 607.484 918.315C547.134 927.087 485.662 932.82 424.201 934.821C404.787 935.456 385.417 935.777 366.084 935.777C293.144 935.777 220.826 931.183 149.34 921.356C146.25 918.912 143.305 916.39 140.523 913.795Z" fill="#EAF5FC" /><path d="M374.705 954.315C396.203 954.315 417.274 954.528 437.783 954.94C429.946 955.035 422.105 955.082 414.227 955.082C396.271 955.082 378.26 954.835 360.427 954.346C365.167 954.325 369.921 954.315 374.705 954.315Z" fill="#EAF5FC" /><path d="M704.938 217.913C705.877 221.424 706.928 224.801 708.071 227.961C708.118 229.737 708.118 231.514 708.071 233.285C707.971 237.294 707.838 241.283 707.687 245.248C704.584 237.449 701.744 228.638 699.717 218.965C701.566 218.642 703.305 218.284 704.938 217.913ZM697.056 171.393C698.131 175.348 699.206 179.279 700.24 183.184C700.24 183.186 700.24 183.19 700.24 183.197C700.24 183.247 700.24 183.299 700.24 183.349C700.24 183.613 700.24 183.873 700.24 184.137C700.24 194.593 701.901 206.119 704.586 216.577C702.958 216.837 701.219 217.088 699.38 217.313C697.688 208.762 696.641 199.558 696.6 189.802C696.571 182.991 696.736 176.882 697.056 171.393Z" fill="#D6DEE5" /><path d="M61.3241 793.31C69.8235 794.794 79.852 795.967 90.986 797.634C97.7625 798.54 104.961 799.74 112.606 800.561C115.077 800.814 117.593 801.071 120.151 801.331C116.761 814.39 113.884 827.498 111.87 840.688C108.911 860.053 113.243 877.387 122.823 892.686C109.232 895.477 97.3964 898.483 87.5923 901.657C87.4057 901.272 87.2315 900.879 87.0753 900.491C74.3531 868.472 66.3239 832.045 61.3241 793.31ZM71.5679 216.286C74.861 216.96 78.6028 217.722 82.7664 218.571C91.7378 220.088 102.771 221.556 115.42 223.445C125.393 224.879 136.413 226.021 148.299 227.238C144.768 310.041 157.619 394.414 162.773 475.926C166.772 539.065 171.122 601.471 159.005 664.306C150.423 708.848 133.239 752.496 121.385 796.646C110.766 795.902 100.846 795.165 91.7738 794.198C80.2271 793.021 69.8468 792.322 61.0548 791.172C49.3843 698.504 54.824 592.894 54.824 502.839C54.824 383.266 60.6888 300.893 71.5679 216.286ZM96.1992 54.2803C120.106 57.6577 150.638 60.6015 186.093 62.9552C175.059 85.7617 166.655 109.291 160.849 133.335C153.782 162.611 150.053 192.323 148.535 222.241C136.85 221.451 125.949 220.889 116.145 220.011C103.509 218.771 92.4199 217.864 83.3211 216.806C78.9978 216.211 75.1142 215.674 71.7116 215.203C78.1741 165.129 86.3951 114.216 96.1992 54.2803Z" fill="#E3EDF4" /><path d="M122.823 892.686C127.534 900.217 133.513 907.251 140.521 913.795H100.469C100.121 913.734 99.7744 913.674 99.4262 913.613C93.6762 909.88 89.6545 905.896 87.5906 901.658C97.3947 898.482 109.23 895.477 122.823 892.686Z" fill="#E8F3F9" /><path d="M106.559 917.683C123.064 921.117 139.771 924.146 156.658 926.809C161.909 930.503 167.505 934.002 173.375 937.3C144.973 931.967 121.862 925.427 106.559 917.683ZM100.47 913.795H140.522C143.304 916.391 146.249 918.913 149.338 921.357C133.007 919.112 116.715 916.593 100.47 913.795Z" fill="#EBF6FD" /><path d="M714.069 908.036C713.8 908.57 713.487 909.107 713.15 909.631C712.733 909.378 712.297 909.12 711.859 908.867C712.601 908.594 713.338 908.317 714.069 908.036ZM718.758 792.709C727.909 836.733 726.827 857.349 717.884 894.251C708.694 895.509 699.466 897.315 690.222 899.396C700.386 865.158 705.286 830.185 701.955 795.752C706.077 795.059 709.907 794.275 713.469 793.666C715.309 793.328 717.075 793.014 718.758 792.709ZM699.719 218.967C701.745 228.638 704.586 237.451 707.689 245.249C703.147 362.902 677.399 461.202 677.436 544.894C677.458 586.815 667.975 614.594 666.814 651.08C665.161 702.72 703.353 728.352 707.691 745.612C712.165 763.415 715.729 778.279 718.435 791.147C716.687 791.376 714.853 791.62 712.942 791.873C709.437 792.299 705.718 792.871 701.716 793.364C699.2 770.067 692.887 747.031 681.851 724.65C671.087 702.776 658.324 681.605 649.467 659.211C638.148 630.557 640.587 601.385 646.937 572.288C657.907 522.071 676.557 473.798 682.262 422.864C689.725 355.996 695.744 287.657 693.177 220.06C694.285 219.863 695.365 219.671 696.42 219.485C697.554 219.329 698.656 219.154 699.719 218.967ZM698.635 53.0107C677.727 97.4847 687.348 135.631 697.055 171.394C696.736 176.884 696.571 182.992 696.598 189.803C696.639 199.559 697.687 208.763 699.378 217.315C698.258 217.453 697.091 217.579 695.887 217.697C694.977 217.808 694.044 217.926 693.091 218.045C692.273 197.809 690.67 177.632 688.106 157.59C683.93 125.117 676.532 90.9208 663.535 58.0722C676.607 56.5433 688.332 54.8592 698.635 53.0107Z" fill="#E3EDF4" /><path d="M711.859 908.866C712.297 909.119 712.733 909.377 713.149 909.63C712.229 911.053 711.048 912.435 709.618 913.794H696.284C701.676 912.318 706.9 910.686 711.859 908.866Z" fill="#E8F3F9" /><path d="M696.283 913.795H709.617C703.743 919.352 693.641 924.358 680.183 928.8C681.725 924.781 683.207 920.749 684.62 916.699C688.573 915.8 692.471 914.836 696.283 913.795Z" fill="#EBF6FD" /><path d="M974.457 290.17C974.457 290.17 990.474 221.068 934.038 165.071C898.273 129.589 842.131 126.945 797.849 125.211C794.624 125.087 791.517 125.026 788.516 125.026C750.377 125.026 730.865 134.795 730.865 143.627C730.865 143.627 729.256 162.688 738.934 162.688C748.602 162.688 775.509 148.853 797.849 148.393C799.015 148.369 800.226 148.356 801.495 148.356C830.61 148.356 885.434 154.793 913.079 173.417C963.862 207.606 974.457 290.17 974.457 290.17ZM797.775 119.726C833.871 119.726 875.486 122.116 904.019 130.295C896.905 128.257 888.969 126.584 880.515 125.211C906.742 136.16 929.327 149.233 948.478 166.541C989.34 203.464 1008.83 259.527 1012.55 305.197C1018.06 372.857 993.947 538.084 993.058 563.793C993.803 561.799 994.604 559.872 995.314 557.851C975.505 613.551 946.904 657.613 895.703 691.279C913.884 679.313 929.2 666.018 942.324 651.382C925.453 661.299 908.003 670.636 889.728 678.941C858.313 693.226 813.239 708.928 771.934 708.928C759.124 708.928 746.682 707.416 735.117 703.887C733.767 691.31 732.303 677.989 730.767 663.792C730.738 663.532 730.711 663.278 730.684 663.018C770.256 662.237 822.43 655.172 864.706 626.159C957.23 562.668 950.377 465.311 950.377 465.311C950.377 465.311 934.04 518.925 911.463 550.499C888.89 582.064 848.583 613.058 812.871 624.97C794.175 631.206 777.883 632.87 763.808 632.87C751.003 632.87 740.033 631.49 730.765 630.92C730.765 630.92 729.762 631.339 728.181 632.059C728.024 629.432 727.883 626.772 727.75 624.084C729.309 623.962 730.887 623.861 732.481 623.776C762.578 622.184 866.319 632.118 921.144 522.5C938.697 487.437 980.806 365.237 915.232 242.116C909.382 231.123 902.725 223.056 895.41 217.13C884.316 199.641 864.914 186.879 832.517 186.832C832.417 186.832 832.311 186.832 832.21 186.832C790.735 186.832 766.141 202.266 735.074 219.381C732.974 220.536 730.736 221.027 728.486 221.027C728.258 221.027 728.025 221.02 727.795 221.011C727.134 189.618 726.061 157.148 724.408 123.671C725.534 123.376 726.709 123.143 727.935 122.981C738.358 121.591 765.917 119.726 797.775 119.726Z" fill="#C0C6CC" /><path d="M727.747 624.086C727.88 626.773 728.022 629.433 728.178 632.06C721.731 635.001 705.623 642.996 707.907 648.467C710.743 655.286 711.522 663.098 722.799 663.098C725.366 663.098 727.991 663.071 730.681 663.019C730.708 663.279 730.735 663.534 730.764 663.794C732.3 677.99 733.764 691.312 735.114 703.889C734.547 703.717 733.983 703.542 733.422 703.359C699.88 692.477 686.417 672.145 685.516 648.467C683.15 655.867 682.646 665.396 684.751 677.905C677.591 635.338 699.806 626.279 727.747 624.086ZM724.407 123.671C726.058 157.148 727.133 189.619 727.794 221.011C722.857 220.798 717.893 218.334 714.147 215.522C715.131 215.251 716.042 215.004 716.888 214.795C721.521 213.544 723.987 212.877 723.987 212.877C723.987 212.877 721.444 213.375 716.669 214.307C715.671 214.493 714.582 214.713 713.402 214.946C711.723 213.611 710.334 212.225 709.354 210.988C707.523 208.686 706.123 206.133 705.072 203.406C704.316 199.648 703.451 195.864 702.518 192.072C701.387 180.607 703.597 168.1 704.654 158.615C705.492 151.198 706.603 143.843 708.396 136.616C701.928 148.058 700.339 165.121 700.244 182.394C700.392 155.476 704.101 129.021 724.407 123.671Z" fill="#D6DEE5" /><path d="M702.519 192.072C703.452 195.865 704.317 199.648 705.072 203.406C703.699 199.867 702.912 196.03 702.519 192.072Z" fill="#E2EBF3" /><path d="M700.245 182.527C700.24 182.743 700.239 182.964 700.239 183.184C700.239 182.964 700.24 182.745 700.245 182.527Z" fill="#D6DEE5" /><path d="M818.482 200.814C779.781 200.814 748.068 219.879 748.068 219.879C748.068 219.879 736.737 242.236 728.273 248.492V248.488C736.737 242.235 748.068 219.878 748.068 219.878C748.068 219.878 779.781 200.814 818.482 200.814Z" fill="#C0C6CC" /><path d="M728.273 248.489V248.493C726.897 249.51 725.598 250.099 724.431 250.099C725.594 250.099 726.897 249.506 728.273 248.489Z" fill="#D6DEE5" /><path d="M724.126 250.085C724.212 250.095 724.304 250.098 724.396 250.098C724.304 250.099 724.212 250.095 724.126 250.085Z" fill="#D6DEE5" /><path d="M749.996 728.487C748.678 728.504 747.368 728.513 746.074 728.513C747.368 728.514 748.678 728.504 749.996 728.487ZM895.569 691.368C895.331 691.523 895.098 691.678 894.861 691.834C895.098 691.68 895.331 691.523 895.569 691.368Z" fill="#C0C6CC" /><path d="M705.071 203.406C706.122 206.134 707.522 208.686 709.353 210.988C710.333 212.226 711.722 213.611 713.401 214.947C711.549 215.318 709.473 215.734 707.162 216.14C706.639 211.909 705.927 207.669 705.071 203.406ZM708.396 136.616C706.603 143.843 705.492 151.199 704.654 158.615C703.597 168.1 701.388 180.608 702.519 192.072C701.797 189.118 701.033 186.161 700.24 183.183C700.24 182.963 700.24 182.742 700.245 182.526C700.245 182.483 700.245 182.439 700.245 182.395C700.342 165.122 701.928 148.059 708.396 136.616Z" fill="#E2EBF3" /><path d="M700.24 183.183C701.032 186.16 701.796 189.118 702.52 192.072C702.913 196.031 703.7 199.867 705.073 203.406C705.929 207.669 706.642 211.907 707.164 216.14C706.337 216.288 705.475 216.434 704.589 216.576C701.904 206.118 700.242 194.591 700.242 184.136C700.242 183.873 700.242 183.612 700.242 183.348C700.242 183.298 700.242 183.246 700.242 183.196C700.24 183.189 700.24 183.185 700.24 183.183Z" fill="#E7F2F9" /><path d="M832.208 186.833C832.309 186.833 832.415 186.833 832.515 186.833C864.914 186.879 884.316 199.641 895.408 217.13C876.195 201.56 852.438 200.807 826.796 200.807C824.046 200.807 821.274 200.813 818.483 200.813C779.781 200.813 748.069 219.878 748.069 219.878C748.069 219.878 736.737 242.235 728.274 248.488C728.146 239.426 727.99 230.262 727.794 221.01C728.022 221.021 728.256 221.026 728.485 221.026C730.736 221.026 732.974 220.536 735.074 219.381C766.139 202.267 790.734 186.833 832.208 186.833Z" fill="#D6DEE5" /><path d="M714.148 215.521C717.895 218.333 722.859 220.797 727.794 221.01C727.992 230.262 728.146 239.426 728.273 248.488C726.897 249.506 725.592 250.098 724.431 250.098C724.417 250.098 724.408 250.098 724.395 250.098C724.304 250.098 724.212 250.094 724.126 250.085C724.079 250.081 724.035 250.074 723.988 250.072C718.315 249.291 712.518 240.275 708.073 227.961C707.976 224.429 707.71 220.894 707.308 217.35C709.878 216.711 712.158 216.068 714.148 215.521Z" fill="#E2EBF3" /><path d="M707.308 217.352C707.71 220.893 707.975 224.43 708.072 227.963C706.927 224.803 705.876 221.425 704.939 217.914C705.752 217.726 706.543 217.54 707.308 217.352Z" fill="#E7F2F9" /><path d="M745.658 728.514C745.794 728.514 745.932 728.514 746.074 728.514C745.938 728.514 745.794 728.514 745.658 728.514ZM893.872 692.476C856.559 716.578 796.805 727.887 749.995 728.486C796.803 727.886 856.565 716.574 893.872 692.476ZM894.86 691.835C894.53 692.048 894.202 692.264 893.872 692.476C894.2 692.263 894.53 692.047 894.86 691.835Z" fill="#C0C6CC" /><path d="M942.324 651.385C929.198 666.02 913.883 679.315 895.703 691.283C895.664 691.313 895.617 691.342 895.57 691.37C895.332 691.525 895.099 691.68 894.862 691.836C894.531 692.049 894.203 692.265 893.873 692.477C856.566 716.575 796.806 727.885 749.997 728.487C748.679 728.504 747.369 728.514 746.075 728.514C745.934 728.514 745.795 728.514 745.659 728.514C743.161 728.51 740.467 728.418 737.644 728.178C736.862 720.381 736.016 712.306 735.114 703.888C746.678 707.417 759.122 708.928 771.931 708.928C813.236 708.928 858.312 693.227 889.725 678.941C908.004 670.638 925.451 661.302 942.324 651.385Z" fill="#D6DEE5" /><path d="M685.515 648.467C686.416 672.146 699.879 692.478 733.421 703.358C733.984 703.541 734.546 703.716 735.113 703.888C736.014 712.306 736.861 720.382 737.644 728.179C717.684 726.485 691.356 717.281 684.75 677.905C682.645 665.395 683.149 655.865 685.515 648.467Z" fill="#E2EBF3" /><path d="M788.515 125.025C791.515 125.025 794.622 125.086 797.847 125.211C842.131 126.946 898.273 129.59 934.036 165.07C990.471 221.068 974.455 290.17 974.455 290.17C974.455 290.17 963.86 207.604 913.075 173.416C885.43 154.791 830.606 148.356 801.491 148.356C800.224 148.356 799.011 148.369 797.845 148.393C775.505 148.853 748.598 162.688 738.93 162.688C729.25 162.688 730.862 143.627 730.862 143.627C730.864 134.794 750.375 125.025 788.515 125.025Z" fill="#D6DEE5" /><path d="M950.375 465.312C950.375 465.312 957.227 562.67 864.705 626.161C822.428 655.173 770.253 662.238 730.683 663.019C729.638 653.246 728.815 642.925 728.181 632.06C729.764 631.34 730.765 630.921 730.765 630.921C740.033 631.493 751.004 632.872 763.808 632.872C777.885 632.872 794.175 631.208 812.872 624.971C848.582 613.06 888.891 582.066 911.464 550.501C934.039 518.925 950.375 465.312 950.375 465.312Z" fill="#D6DEE5" /><path d="M728.18 632.059C728.815 642.923 729.639 653.246 730.682 663.018C727.991 663.069 725.366 663.096 722.799 663.096C711.522 663.096 710.745 655.284 707.908 648.466C705.625 642.994 721.734 635 728.18 632.059Z" fill="#E2EBF3" />`, milk:`<path fill="url(#{U}lq)" d="M97,62 L690,62 L722,300 L728,600 L722,880 L690,905 L398,915 L150,910 L70,890 L58,600 L62,300 Z"/><path fill="url(#{U}dp)" d="M97,62 L690,62 L722,300 L728,600 L722,880 L690,905 L398,915 L150,910 L70,890 L58,600 L62,300 Z"/><path d="M150,140 C130,400 130,650 150,860" stroke="#FFF3C0" stroke-width="30" fill="none" stroke-linecap="round" opacity=".45"/>`, surf:`<ellipse cx="398" cy="110" rx="330" ry="30" fill="#FFD95E" stroke="#D9A21A" stroke-width="3"/>`, front:`<path opacity=".55" d="M196.276 906.946C164.683 847.315 171.937 778.148 182.107 715.962C193.284 647.731 207.84 580.759 209.299 511.849C212.255 373.439 158.644 236.414 199.527 98.652C201.001 93.6926 211.573 94.8356 211.402 99.8414C209.184 165.708 197.23 228.686 204.705 294.908C212.395 363.016 224.94 430.493 224.629 498.993C224.346 559.472 213.608 619.34 201.311 678.997C185.125 757.5 180.775 828.232 197.245 906.744L196.276 906.946Z" fill="#ECF7FE" /><path d="M597.769 76.3672C605.042 76.3672 611.699 77.188 616.296 79.734C617.933 80.6463 618.258 82.0599 616.9 83.2427C610.294 89.0574 595.093 89.426 582.516 89.426C581.588 89.426 580.668 89.422 579.77 89.422C578.613 89.418 577.488 89.4154 576.4 89.4154C574.094 89.4154 571.971 89.4327 570.131 89.5175C526.556 91.5291 483.05 92.7796 439.388 92.9679C405.403 93.1098 369.624 94.0897 333.657 94.0897C280.392 94.0897 226.702 91.9442 177.754 81.7549L177.818 81.5825C218.698 86.1494 260.26 87.7008 301.894 87.7008C347.898 87.7008 393.998 85.8073 439.388 83.9959C480.557 82.3529 521.73 80.8081 562.89 79.0445C571.698 78.6679 585.59 76.3698 597.769 76.3672Z" fill="#C9D4DC" /><path d="M54.868 905.27C54.877 905.307 54.8859 905.335 54.8967 905.371C54.8734 905.364 54.8607 905.361 54.8373 905.353L54.868 905.27ZM734.669 892.655C737.011 892.828 738.006 895.252 736.326 896.469C735.357 897.165 734.359 897.844 733.334 898.507C733.388 898.275 733.444 898.038 733.497 897.808C733.535 897.66 733.571 897.507 733.603 897.359C733.657 897.132 733.707 896.913 733.759 896.682C733.783 896.58 733.81 896.469 733.833 896.368C733.943 895.901 734.048 895.439 734.152 894.976C734.161 894.935 734.165 894.904 734.176 894.864C734.235 894.605 734.294 894.337 734.355 894.077C734.368 894.016 734.382 893.955 734.395 893.891C734.486 893.48 734.578 893.064 734.669 892.655Z" fill="#B0B9BF" /><path d="M54.8677 905.27C54.8767 905.305 54.8857 905.338 54.8964 905.371C54.8875 905.335 54.8785 905.307 54.8677 905.27ZM733.603 897.356C733.571 897.505 733.535 897.657 733.497 897.806C733.535 897.659 733.573 897.506 733.603 897.356ZM733.833 896.367C733.81 896.468 733.783 896.579 733.759 896.681C733.786 896.575 733.81 896.468 733.833 896.367ZM734.176 894.862C734.167 894.902 734.161 894.932 734.152 894.973C734.161 894.936 734.17 894.899 734.176 894.862Z" fill="#C1CBD2" /><path d="M54.8998 905.172C60.1204 906.25 65.35 907.295 70.5742 908.312C70.0574 908.567 69.5531 908.816 69.0596 909.069C64.3199 907.877 59.5893 906.639 54.8963 905.371C54.8874 905.338 54.8784 905.303 54.8676 905.27L54.8998 905.172Z" fill="#CBD6DD" /><path d="M70.5744 908.312C80.1775 910.177 89.7932 911.945 99.4269 913.612C99.5184 913.673 99.61 913.732 99.7051 913.793H88.7309C82.1284 912.287 75.5779 910.714 69.0598 909.067C69.5533 908.815 70.0576 908.566 70.5744 908.312Z" fill="#CEDAE1" /><path d="M88.7317 913.795H99.7059C101.779 915.124 104.061 916.418 106.56 917.683C100.589 916.438 94.6415 915.144 88.7317 913.795Z" fill="#D0DCE4" /><path d="M734.356 894.074C734.297 894.334 734.238 894.602 734.177 894.862C734.236 894.599 734.295 894.338 734.356 894.074Z" fill="#C3CED5" /><path d="M734.401 892.645C734.492 892.645 734.584 892.649 734.67 892.654C734.578 893.064 734.487 893.479 734.395 893.887C734.383 893.952 734.369 894.013 734.356 894.073C734.297 894.337 734.238 894.596 734.177 894.86C734.171 894.897 734.162 894.935 734.153 894.972C734.047 895.435 733.943 895.899 733.834 896.364C733.81 896.465 733.787 896.574 733.76 896.678C733.71 896.908 733.658 897.128 733.604 897.355C733.572 897.503 733.536 897.656 733.498 897.804C733.444 898.034 733.389 898.271 733.335 898.503C727.676 902.161 721.165 905.302 714.069 908.032C714.527 907.12 714.879 906.197 715.121 905.256C716.11 901.416 717.034 897.759 717.885 894.248C723.333 893.504 728.769 892.953 734.186 892.648C734.259 892.648 734.331 892.645 734.401 892.645Z" fill="#CBD6DD" /><path d="M690.222 899.396C690.189 899.503 690.157 899.598 690.13 899.703C689.958 899.646 689.782 899.588 689.613 899.535C689.814 899.486 690.015 899.442 690.222 899.396Z" fill="#C9D4DC" /><path d="M689.613 899.533C689.782 899.588 689.956 899.645 690.13 899.702C688.726 904.41 687.221 909.115 685.629 913.793H631.537C650.818 909.501 670.247 903.921 689.613 899.533Z" fill="#CDD9E0" /><path d="M631.536 913.795H685.628C685.294 914.762 684.96 915.732 684.621 916.699C659.762 922.351 632.735 925.383 611.366 928.729C554.388 937.642 496.347 941.162 438.242 942.594C421.463 943.006 404.509 943.233 387.47 943.233C310.807 943.233 232.116 938.71 156.655 926.807C154.139 925.037 151.691 923.218 149.334 921.355C220.82 931.182 293.139 935.775 366.078 935.775C385.412 935.775 404.781 935.454 424.196 934.819C485.659 932.818 547.129 927.086 607.479 918.314C615.461 917.151 623.485 915.586 631.536 913.795Z" fill="#D0DCE4" /><path d="M99.4272 913.613C99.7753 913.675 100.122 913.735 100.47 913.796H99.7054C99.6103 913.735 99.5187 913.673 99.4272 913.613Z" fill="#D0DBE2" /><path d="M99.7064 913.795H100.471C116.716 916.594 133.008 919.112 149.339 921.357C151.695 923.22 154.143 925.038 156.659 926.81C139.773 924.147 123.065 921.119 106.56 917.684C104.06 916.418 101.777 915.124 99.7064 913.795Z" fill="#D1DDE5" /><path d="M717.885 894.251C717.034 897.762 716.11 901.42 715.121 905.26C714.879 906.2 714.525 907.123 714.069 908.035C713.337 908.315 712.601 908.593 711.86 908.867C706.311 905.672 699.023 902.606 690.129 899.702C690.158 899.598 690.19 899.503 690.22 899.395C699.466 897.314 708.694 895.508 717.885 894.251Z" fill="#CEDAE1" /><path d="M690.129 899.703C699.023 902.607 706.311 905.673 711.86 908.867C706.902 910.685 701.678 912.319 696.283 913.796H685.628C687.222 909.117 688.726 904.412 690.129 899.703Z" fill="#D0DBE2" /><path d="M685.628 913.795H696.283C692.471 914.836 688.573 915.8 684.622 916.699C684.959 915.731 685.293 914.762 685.628 913.795Z" fill="#D1DDE5" /><path d="M54.8645 212.878C54.8645 212.878 60.8586 213.705 71.709 215.204C71.6623 215.566 71.6121 215.928 71.5672 216.286C60.812 214.091 54.8645 212.878 54.8645 212.878Z" fill="#CFDCE5" /><path d="M148.532 222.242C151.922 222.476 155.377 222.722 158.886 223.006C166.978 223.493 175.438 223.909 184.197 224.317C184.238 226.349 184.289 228.383 184.35 230.416C175.263 229.716 166.511 229.02 158.141 228.253C154.801 227.904 151.517 227.57 148.301 227.239C148.373 225.572 148.451 223.913 148.532 222.242Z" fill="#CDDAE2" /><path d="M71.7092 215.204C75.1136 215.674 78.9972 216.212 83.3187 216.807C92.4175 217.865 103.507 218.771 116.143 220.012C125.947 220.891 136.847 221.452 148.532 222.243C148.45 223.913 148.372 225.572 148.299 227.239C136.413 226.022 125.394 224.88 115.42 223.447C102.771 221.557 91.7355 220.091 82.7659 218.572C78.6024 217.724 74.8606 216.96 71.5674 216.287C71.6123 215.927 71.6625 215.566 71.7092 215.204Z" fill="#D3E1E9" /><path d="M693.093 218.043C693.122 218.719 693.149 219.385 693.176 220.061C684.845 221.532 675.014 223.212 663.792 224.473C657.443 225.274 650.691 226.126 643.567 227.022C641.248 227.231 638.886 227.445 636.485 227.663C635.103 226.099 633.685 224.584 632.226 223.124C643.348 222.483 653.696 221.826 663.119 221.012C674.598 220.301 684.614 219.104 693.093 218.043Z" fill="#CDDAE2" /><path d="M704.587 216.577C704.702 217.023 704.82 217.47 704.938 217.912C703.305 218.284 701.566 218.642 699.72 218.967C699.605 218.416 699.492 217.867 699.38 217.313C701.22 217.088 702.959 216.837 704.587 216.577Z" fill="#CDDAE2" /><path d="M699.381 217.312C699.492 217.867 699.605 218.414 699.72 218.966C698.659 219.153 697.555 219.328 696.421 219.487C695.364 219.673 694.286 219.866 693.178 220.061C693.151 219.385 693.125 218.719 693.096 218.043C694.047 217.925 694.98 217.807 695.892 217.694C697.094 217.576 698.259 217.452 699.381 217.312Z" fill="#D3E1E9" /><path d="M723.988 212.878C723.988 212.878 721.522 213.544 716.889 214.795C716.043 215.005 715.132 215.252 714.148 215.522C713.892 215.332 713.644 215.14 713.402 214.948C714.583 214.714 715.67 214.496 716.668 214.309C721.445 213.375 723.988 212.878 723.988 212.878Z" fill="#CDDAE2" /><path d="M713.401 214.947C713.643 215.141 713.891 215.333 714.147 215.521C712.157 216.069 709.878 216.711 707.308 217.35C707.258 216.948 707.213 216.545 707.163 216.139C709.472 215.735 711.549 215.319 713.401 214.947Z" fill="#D2E0E8" /><path d="M707.159 216.141C707.21 216.546 707.256 216.948 707.305 217.351C706.54 217.541 705.749 217.727 704.936 217.912C704.817 217.469 704.697 217.022 704.584 216.577C705.471 216.435 706.332 216.289 707.159 216.141Z" fill="#D4E2EA" /><path d="M202.795 225.173C205.041 225.278 207.305 225.385 209.585 225.494C227.613 226.011 246.626 226.563 266.279 227.126C301.926 227.842 339.705 228.59 377.72 228.59C381.672 228.59 385.631 228.583 389.587 228.566C395.75 228.603 401.91 228.623 408.064 228.623C435.38 228.623 462.531 228.272 488.785 227.877C486.402 230.717 484.193 233.691 482.161 236.784C472.366 237.098 462.458 237.366 452.465 237.443C434.236 237.68 415.749 237.988 397.216 237.988C394.667 237.988 392.11 237.981 389.558 237.966C368.482 237.966 347.405 237.672 326.668 237.253C305.912 237.07 285.523 236.003 265.774 235.383C246.042 234.698 226.994 233.315 208.938 232.31C206.797 232.141 204.666 231.975 202.551 231.81C202.621 229.6 202.704 227.383 202.795 225.173Z" fill="#CDDAE2" /><path d="M632.228 223.124C633.687 224.584 635.104 226.098 636.486 227.663C631.499 228.117 626.348 228.586 621.045 229.07C605.34 230.635 588.263 231.578 570.219 232.876C552.164 234.059 533.09 234.964 513.355 235.793C503.116 236.056 492.704 236.445 482.158 236.782C484.19 233.69 486.399 230.716 488.782 227.875C496.916 227.753 504.964 227.626 512.9 227.507C532.571 226.999 551.58 226.496 569.615 226.025C587.617 225.282 604.68 224.873 620.349 223.795C624.4 223.57 628.362 223.349 632.228 223.124Z" fill="#D0DDE6" /><path d="M184.196 224.316C190.258 224.602 196.461 224.877 202.792 225.172C202.7 227.382 202.618 229.599 202.55 231.811C196.357 231.331 190.282 230.871 184.349 230.415C184.288 228.383 184.237 226.348 184.196 224.316Z" fill="#D5E3EC" /><path d="M26.044 786.522C26.044 786.522 27.8421 786.76 31.2537 787.205C31.2627 787.313 31.2772 787.426 31.2861 787.53C27.8548 786.871 26.044 786.522 26.044 786.522Z" fill="#B4BEC6" /><path d="M31.2553 787.205C36.3287 787.871 44.9753 789.007 56.5955 790.528C58.0312 790.761 59.519 790.974 61.0552 791.174C61.1431 791.885 61.2329 792.601 61.3262 793.31C59.501 792.992 57.7442 792.658 56.0663 792.302C44.7439 790.118 36.2929 788.493 31.2877 787.53C31.2787 787.425 31.2642 787.312 31.2553 787.205Z" fill="#CFDCE5" /><path d="M121.387 796.646C126.602 797.015 131.983 797.38 137.517 797.775C148.854 798.705 160.882 799.364 173.442 799.962C173.419 802.077 173.41 804.182 173.428 806.296C160.573 805.319 148.285 804.302 136.717 803.021C131.03 802.439 125.499 801.874 120.151 801.33C120.555 799.769 120.965 798.209 121.387 796.646Z" fill="#CDDAE2" /><path d="M61.0553 791.173C69.849 792.323 80.2293 793.021 91.7742 794.199C100.846 795.166 110.769 795.903 121.386 796.647C120.966 798.209 120.553 799.77 120.151 801.332C117.594 801.072 115.078 800.814 112.606 800.561C104.961 799.74 97.7612 798.539 90.9864 797.635C79.8507 795.968 69.8239 794.796 61.3245 793.31C61.233 792.6 61.1432 791.884 61.0553 791.173Z" fill="#D3E1E9" /><path d="M742.974 786.522C742.974 786.522 742.74 786.586 742.292 786.716C742.292 786.702 742.292 786.685 742.292 786.668C742.74 786.573 742.974 786.522 742.974 786.522Z" fill="#B4BEC6" /><path d="M742.292 786.668C742.292 786.685 742.292 786.702 742.292 786.715C742.292 786.702 742.286 786.685 742.286 786.668H742.292Z" fill="#C5D0D8" /><path d="M742.287 786.668C742.287 786.685 742.292 786.702 742.292 786.716C741.213 787.019 738.88 787.68 735.411 788.66C732.919 789.366 729.859 790.224 726.259 791.245C723.99 791.749 721.478 792.215 718.761 792.709C718.657 792.188 718.545 791.671 718.436 791.147C721.114 790.793 723.592 790.462 725.86 790.157C729.525 789.376 732.649 788.717 735.165 788.182C738.773 787.418 741.188 786.904 742.287 786.668Z" fill="#CFDCE5" /><path d="M701.713 793.364C701.795 794.155 701.876 794.955 701.955 795.751C700.505 795.998 699.014 796.231 697.49 796.441C691.629 797.231 685.281 798.09 678.505 799.017C664.953 801.075 649.528 802.316 632.711 804.012C615.872 805.426 597.608 806.845 578.261 808.143C558.915 809.238 538.512 810.757 517.344 811.279C496.191 812.117 474.329 812.777 452.089 813.169C429.865 813.787 407.279 813.834 384.681 814.054C362.096 813.997 339.496 813.5 317.273 813.216C295.048 812.49 273.159 812.118 252.018 811.137C230.864 810.174 210.42 809.247 191.101 807.618C189.672 807.51 188.251 807.406 186.831 807.3C186.831 805.055 186.845 802.824 186.872 800.583C188.515 800.657 190.166 800.732 191.822 800.806C211.091 801.904 231.509 802.067 252.547 802.99C273.611 803.774 295.409 803.937 317.542 804.45C334.934 804.511 352.543 804.699 370.196 804.699C375.019 804.699 379.85 804.686 384.681 804.649C386.822 804.645 388.967 804.645 391.113 804.645C395.4 804.645 399.686 804.649 403.964 804.649C407.857 804.655 411.746 804.659 415.635 804.659C427.772 804.659 439.857 804.616 451.831 804.382C473.982 804.203 495.767 803.763 516.856 803.124C537.932 802.485 558.294 801.873 577.617 801.293C596.924 800.549 615.172 799.663 632.002 798.737C648.755 797.423 664.268 796.915 677.819 795.543C684.621 794.952 690.999 794.391 696.896 793.883C698.547 793.733 700.148 793.553 701.713 793.364Z" fill="#CDDAE2" /><path d="M718.434 791.146C718.545 791.669 718.655 792.186 718.759 792.708C717.075 793.013 715.309 793.327 713.47 793.664C709.908 794.272 706.078 795.056 701.956 795.75C701.879 794.955 701.796 794.154 701.713 793.363C705.715 792.869 709.436 792.298 712.939 791.872C714.852 791.619 716.686 791.376 718.434 791.146Z" fill="#D3E1E9" /><path d="M173.442 799.963C177.857 800.175 182.334 800.378 186.873 800.585C186.846 802.826 186.832 805.056 186.832 807.301C182.299 806.963 177.83 806.633 173.428 806.297C173.412 804.184 173.419 802.078 173.442 799.963Z" fill="#D5E3EC" /><path d="M395.56 18.2715C516.27 18.2715 622.666 23.9535 685.568 32.6033C619.989 42.7276 510.85 45.2696 393.095 45.2696C276.741 45.2696 173.548 40.1086 109.043 32.1338C172.349 23.7506 277.057 18.2715 395.56 18.2715Z" fill="#94989D" /><path d="M395.56 0C551.454 0 683.536 9.48515 728.851 22.5837C728.809 22.5745 728.768 22.5639 728.721 22.5533C718.031 26.5314 703.41 29.8478 685.567 32.6033C622.665 23.9535 516.27 18.2715 395.56 18.2715C277.056 18.2715 172.348 23.7507 109.042 32.1339C90.5035 29.8451 75.17 27.3203 63.6233 24.6232C61.9255 24.4296 60.3249 24.3381 58.83 24.3381C58.0565 24.3381 57.3117 24.362 56.5884 24.4097C95.5195 10.3749 232.529 0 395.56 0Z" fill="#C0C6CC" /><path d="M56.5898 24.4109C49.3574 27.0179 45.5044 29.7522 45.5044 32.5674C45.5044 32.6111 45.5096 32.6589 45.5096 32.7026C45.5096 32.7132 45.5096 32.7238 45.5096 32.7305C45.5509 33.5049 45.8811 34.2674 46.4895 35.0259C46.1414 37.3186 45.7628 39.8805 45.3644 42.689C41.2241 40.6947 39.0544 38.6406 39.0544 36.5375C39.0544 32.9254 43.7995 25.2225 56.5898 24.4109ZM728.852 22.585C744.551 26.2727 750.555 33.1681 747.127 36.5362C746.752 36.9048 746.341 37.2722 745.898 37.6382C745.806 35.4038 745.714 33.6627 745.618 32.5674C745.618 29.0852 739.74 25.7316 728.852 22.585Z" fill="#C8CFD5" /><path d="M460.624 64.5597C459.12 64.5902 457.614 64.6207 456.105 64.6472C437.755 64.9442 418.913 65.1074 399.703 65.1272C398.737 65.1272 397.768 65.1233 396.803 65.1206C418.6 65.1153 439.937 64.9217 460.624 64.5597ZM46.4876 35.0235C50.7463 40.3277 68.6568 45.2725 96.9708 49.5649C96.9439 49.7267 96.9206 49.8831 96.8937 50.0449C84.9073 49.4097 70.0351 49.8181 63.0593 48.3383C55.3819 46.5296 49.4273 44.6413 45.3642 42.6867C45.7609 39.8782 46.1413 37.3163 46.4876 35.0235ZM745.617 32.5664C745.714 33.6617 745.804 35.4028 745.897 37.6372C741.052 41.6299 732.233 45.2433 719.798 48.4748C719.706 47.3185 719.615 46.1357 719.523 44.925C713.009 46.3956 705.319 47.8357 696.608 49.2002C696.392 49.2307 696.173 49.2612 695.954 49.2877C727.21 44.4437 745.293 38.7828 745.614 32.7282C745.614 32.7215 745.614 32.7109 745.614 32.7003C745.617 32.6579 745.617 32.6102 745.617 32.5664Z" fill="#DBE3E9" /><path d="M456.104 64.6494C438.624 64.9637 420.905 65.1321 403.122 65.1321C401.988 65.1321 400.839 65.1321 399.702 65.1281C418.911 65.1082 437.755 64.9464 456.104 64.6494Z" fill="#E3EDF4" /><path d="M63.0592 48.3389C70.035 49.8201 84.909 49.4103 96.8936 50.0455C96.6603 51.4617 96.4268 52.8753 96.1989 54.2809C83.0496 52.4257 71.9157 50.438 63.0592 48.3455C63.0592 48.3389 63.0592 48.3389 63.0592 48.3389Z" fill="#E8F3FA" /><path d="M719.523 44.9258C719.615 46.1365 719.706 47.3193 719.798 48.4756C719.794 48.4796 719.789 48.4796 719.789 48.4796C719.697 47.2981 719.609 46.1086 719.523 44.9258Z" fill="#E5EFF6" /><path d="M719.522 44.9258C719.61 46.1086 719.696 47.2981 719.784 48.4783C713.612 50.0841 706.545 51.5944 698.636 53.0107C699.322 51.5507 700.039 50.0801 700.795 48.6069C699.428 48.8058 698.037 49.0021 696.608 49.201C705.318 47.8351 713.008 46.395 719.522 44.9258Z" fill="#E8F3FA" /><path d="M96.9706 49.5648C158.529 58.8935 269.238 65.1232 395.561 65.1232C395.973 65.1232 396.388 65.1206 396.801 65.1206C397.766 65.1232 398.735 65.1272 399.701 65.1272C398.315 65.1312 396.928 65.1312 395.534 65.1312C317.932 65.1312 246.186 62.7881 188.127 58.81L188.131 58.8007C155.892 56.5902 127.808 53.8785 105.35 50.7888C102.837 50.4414 99.9606 50.208 96.8918 50.0449C96.9205 49.8831 96.9437 49.728 96.9706 49.5648ZM696.607 49.2002C694.009 49.606 691.324 50.0078 688.548 50.4003C636.582 57.7717 553.218 63.0732 456.105 64.6485C457.616 64.622 459.12 64.5915 460.624 64.561C560.515 62.8159 645.435 57.1206 695.954 49.289C696.173 49.2612 696.394 49.2307 696.607 49.2002Z" fill="#E3EDF4" /><path d="M688.547 50.4014C680.39 51.5643 671.419 52.6689 661.78 53.7178C662.374 55.1684 662.959 56.6178 663.537 58.0712C600.665 65.4227 506.874 69.1011 393.094 69.1011C315.808 69.1011 244.304 66.823 186.092 62.9563C186.759 61.5732 187.436 60.1915 188.128 58.8111C246.187 62.7892 317.933 65.1323 395.535 65.1323C396.929 65.1323 398.316 65.1323 399.702 65.1283C400.841 65.1323 401.988 65.1323 403.122 65.1323C420.905 65.1323 438.622 64.9639 456.104 64.6496C553.217 63.0743 636.581 57.7728 688.547 50.4014Z" fill="#E7F2F9" /><path d="M105.351 50.7888C127.809 53.8785 155.893 56.5889 188.132 58.8007L188.128 58.81C155.863 56.6035 127.812 53.8851 105.351 50.7888Z" fill="#E8F3FA" /><path d="M96.8931 50.0449C99.9619 50.208 102.841 50.4401 105.351 50.7888C127.813 53.8851 155.861 56.6035 188.127 58.81C187.436 60.1891 186.76 61.5722 186.09 62.9552C150.635 60.6015 120.103 57.6577 96.1967 54.2803C96.4264 52.8747 96.6598 51.4611 96.8931 50.0449Z" fill="#EAF5FC" /><path d="M700.795 48.6045C700.041 50.0777 699.322 51.5483 698.636 53.0082C688.333 54.8581 676.609 56.5408 663.538 58.0684C662.96 56.6151 662.375 55.1644 661.781 53.715C671.42 52.6675 680.392 51.5616 688.548 50.3986C691.325 50.0061 694.011 49.6043 696.608 49.1986C698.037 49.001 699.427 48.8047 700.795 48.6045Z" fill="#EAF5FC" /><path d="M45.5093 32.7282C45.5506 33.4946 45.8845 34.2531 46.4929 35.0063C46.4929 35.013 46.4928 35.0156 46.4874 35.0236C45.8808 34.2664 45.5506 33.5026 45.5093 32.7282ZM109.045 32.1328C173.55 40.1076 276.741 45.2685 393.097 45.2685C510.852 45.2685 619.991 42.7265 685.571 32.6022C701.523 34.7955 714.67 37.1757 724.552 39.7071C667.856 53.836 536.368 62.6051 408.92 62.6051C343.405 62.6051 283.168 61.4355 230.834 58.8431C176.166 55.0812 128.621 50.2 97.5844 45.8188C97.5701 45.9037 97.5574 45.9806 97.543 46.0655C86.1794 44.0844 76.0648 41.911 67.2855 39.5321C77.8074 36.8853 91.9062 34.4043 109.045 32.1328Z" fill="#DBE3E9" /><path d="M46.4926 35.0067C48.3591 37.3113 52.833 39.5523 59.5719 41.7018C61.878 40.9645 64.4479 40.2419 67.2852 39.5324C76.0646 41.9113 86.1791 44.086 97.5428 46.0658C97.3507 47.2354 97.1587 48.401 96.9721 49.5639C68.6581 45.2715 50.7494 40.3254 46.4889 35.0226C46.4925 35.0173 46.4926 35.0133 46.4926 35.0067ZM745.613 32.7285C745.292 38.7819 727.209 44.4441 695.954 49.2881C643.999 56.4381 556.109 62.6877 460.623 64.56C439.936 64.9207 418.6 65.1143 396.8 65.121C340.404 64.9419 282.446 62.3933 230.834 58.8435C283.169 61.4359 343.405 62.6055 408.92 62.6055C536.368 62.6055 667.855 53.8377 724.551 39.7074C727.109 40.3625 729.451 41.0255 731.565 41.7018C740.502 38.8535 745.443 35.8394 745.613 32.7285Z" fill="#E3EDF4" /><path d="M97.5841 45.8203C128.619 50.2015 176.164 55.0827 230.834 58.8446C177.112 56.1806 131.716 52.0129 97.5427 46.067C97.5571 45.9821 97.5698 45.9052 97.5841 45.8203Z" fill="#E3EDF4" /><path d="M695.953 49.2873C645.434 57.1202 560.514 62.8156 460.623 64.5593C556.108 62.6869 643.997 56.4373 695.953 49.2873ZM97.5421 46.0664C131.716 52.0124 177.111 56.1801 230.833 58.8441C282.445 62.3939 340.403 64.9425 396.8 65.1216C396.389 65.1216 395.972 65.1242 395.56 65.1242C269.237 65.1242 158.527 58.8945 96.9696 49.5658C97.1581 48.4015 97.35 47.236 97.5421 46.0664Z" fill="#E7F2F9" /><path d="M58.8301 24.3385C60.325 24.3385 61.9256 24.43 63.6234 24.6236C75.1701 27.3208 90.5036 29.8456 109.042 32.1343C91.9052 34.4058 77.8047 36.8868 67.2827 39.5336C59.3594 37.3801 52.5236 35.0622 46.8705 32.5666C46.7467 33.3437 46.6228 34.1592 46.49 35.0078C45.8816 34.2547 45.5478 33.4961 45.5065 32.7297C45.5065 32.7231 45.5065 32.7125 45.5065 32.7019C45.5065 32.6581 45.5013 32.6117 45.5013 32.5666C45.5013 29.7514 49.3526 27.0171 56.5868 24.4102C57.3118 24.3624 58.0584 24.3385 58.8301 24.3385ZM728.721 22.5537C728.768 22.5643 728.809 22.5749 728.851 22.5842C739.739 25.7309 745.616 29.0844 745.616 32.5666C740.699 35.0741 733.576 37.4584 724.549 39.71C714.668 37.1772 701.52 34.7983 685.567 32.6051C703.41 29.8482 718.031 26.5318 728.721 22.5537Z" fill="#E3EDF4" /><path d="M745.616 32.5664C745.616 32.6102 745.616 32.6579 745.611 32.7016C745.611 32.7123 745.611 32.7229 745.611 32.7295C745.442 35.839 740.501 38.8545 731.562 41.7028C729.448 41.0278 727.106 40.3648 724.549 39.7084C733.576 37.4581 740.699 35.0739 745.616 32.5664ZM46.8721 32.5664C52.5271 35.062 59.3611 37.3799 67.2844 39.5334C64.4489 40.2428 61.8772 40.9668 59.5711 41.7028C52.8322 39.5533 48.3583 37.3123 46.4918 35.0076C46.6246 34.159 46.7483 33.3435 46.8721 32.5664Z" fill="#E7F2F9" />`, cork:"", defs:`<linearGradient id="{U}lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6C43A"/><stop offset=".32" stop-color="#FFE07A"/><stop offset=".78" stop-color="#EFB321"/><stop offset="1" stop-color="#C8890B"/></linearGradient><linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A4A00" stop-opacity="0"/><stop offset=".6" stop-color="#7A4A00" stop-opacity=".08"/><stop offset="1" stop-color="#7A4A00" stop-opacity=".26"/></linearGradient>`,
    poly:[[97,62],[690,62],[722,300],[728,600],[722,880],[690,905],[398,915],[150,910],[70,890],[58,600],[62,300]],
    hull:[[48,30],[745,30],[1013,200],[1013,640],[740,712],[722,880],[690,915],[150,915],[70,890],[58,600],[40,300]],   /* body + handle, for pour clearance */
    surfC:[398,110], yTop:62, yFill:110, yBot:915, xTop:[97,690], xBot:[150,690],
    lipR:[745,30], lipL:[48,30], mouth:[398,30] },
  jugOil: { vb:[69,84], shift:[0,0],          /* "jug.svg" again, filled with oil (page 10) */
    back:`<g transform="matrix(-1 0 0 1 69 0)"><path d="M68.6841 29.2797C68.5881 31.4747 68.1811 33.6587 67.4841 35.7637C67.4081 35.9957 67.3271 36.2267 67.2441 36.4567C67.0821 36.9027 66.9061 37.3457 66.7151 37.7817C66.5031 38.2747 66.2741 38.7627 66.0271 39.2437C65.8931 39.5017 65.7571 39.7597 65.6151 40.0127C65.4721 40.2677 65.3271 40.5197 65.1741 40.7697C65.0231 41.0197 64.8671 41.2667 64.7061 41.5127C64.6261 41.6347 64.5451 41.7567 64.4621 41.8777L52.6751 59.1697L50.2011 62.7997L46.1621 60.0457L45.7671 59.7767L46.1851 59.1647L53.0251 49.1287L60.0281 38.8557C60.4351 38.2577 60.8071 37.6407 61.1421 37.0067C61.1781 36.9387 61.2151 36.8707 61.2491 36.8027C61.3591 36.5887 61.4651 36.3747 61.5651 36.1597C61.6071 36.0697 61.6481 35.9797 61.6891 35.8897C61.7391 35.7747 61.7901 35.6607 61.8391 35.5457C61.8681 35.4767 61.8961 35.4107 61.9241 35.3417C61.9481 35.2827 61.9731 35.2237 61.9961 35.1627C62.0271 35.0867 62.0571 35.0097 62.0851 34.9337C62.1251 34.8347 62.1631 34.7357 62.2001 34.6327C62.2261 34.5617 62.2521 34.4877 62.2791 34.4157C62.2981 34.3567 62.3191 34.2987 62.3391 34.2397C62.3671 34.1597 62.3941 34.0767 62.4201 33.9977C62.4521 33.8987 62.4831 33.7997 62.5131 33.7017C62.5331 33.6407 62.5511 33.5797 62.5691 33.5187C62.5931 33.4427 62.6141 33.3667 62.6351 33.2917C62.6651 33.1887 62.6921 33.0857 62.7191 32.9827C62.8971 32.3197 63.0351 31.6497 63.1361 30.9777C63.1491 30.8987 63.1611 30.8187 63.1711 30.7397C63.1981 30.5427 63.2221 30.3437 63.2421 30.1467C63.2541 30.0437 63.2621 29.9397 63.2731 29.8367C63.2811 29.7407 63.2891 29.6447 63.2961 29.5487C63.2971 29.5337 63.2981 29.5177 63.2981 29.5027C63.3051 29.4117 63.3111 29.3207 63.3151 29.2297C63.3171 29.2207 63.3171 29.2097 63.3181 29.2007C63.3331 28.9067 63.3411 28.6127 63.3411 28.3207C63.3431 27.9677 63.3331 27.6157 63.3121 27.2637C63.2001 25.3137 62.7191 22.7987 61.0691 21.8947C60.0121 21.3147 57.5431 20.8597 52.2061 23.2657C51.1531 23.7387 49.9911 24.3247 48.7051 25.0427L46.4611 21.0217L46.0911 20.3567C46.2231 20.2837 46.3541 20.2097 46.4851 20.1407C48.2781 19.1557 49.9621 18.3507 51.5381 17.7257C56.6331 15.6997 60.6261 15.5287 63.6511 17.1907C65.7501 18.3417 68.3231 20.9707 68.6701 26.9547C68.6801 27.1437 68.6891 27.3307 68.6941 27.5197C68.7051 27.8237 68.7091 28.1277 68.7071 28.4307C68.7051 28.7107 68.6971 28.9957 68.6841 29.2797Z" fill="#D5E6ED" /><path opacity="0.8" d="M47.8982 59.3725L61.2962 39.7175C63.8362 35.9915 65.0952 31.5365 64.8422 27.1715C64.6452 23.7735 63.6242 21.5435 61.8062 20.5465C61.0742 20.1435 60.1742 19.9265 59.1342 19.8995C56.6432 19.8335 53.3422 20.8655 49.3072 22.9715L48.1862 20.9625C52.6112 18.6505 56.3202 17.5185 59.2252 17.5955C60.6292 17.6325 61.8352 17.9385 62.9132 18.5305C65.4352 19.9145 66.8962 22.8565 67.1392 27.0385C67.4202 31.9065 66.0212 36.8695 63.1962 41.0135L49.7982 60.6685L47.8982 59.3725Z" fill="white" /><g opacity="0.3"> <path d="M53.1361 55.77C53.1181 56.459 53.0461 57.144 52.9221 57.821L52.8881 58.01L52.6751 59.168L50.2011 62.798L46.1621 60.044L45.7671 59.775L46.1851 59.163L53.0251 49.127L53.0411 49.951L53.0741 51.775L53.1371 55.149C53.1431 55.358 53.1421 55.564 53.1361 55.77Z" fill="black" /> </g><g opacity="0.5"> <path d="M68.6841 29.2798C68.6851 29.1468 68.6831 29.0148 68.6821 28.8808C68.6771 28.5308 68.6651 28.1818 68.6451 27.8328C68.2981 21.8488 65.7251 19.2198 63.6261 18.0678C60.6611 16.4398 56.7711 16.5708 51.8251 18.4808C50.2731 19.0788 48.6171 19.8518 46.8551 20.8028C46.7251 20.8738 46.5921 20.9448 46.4601 21.0178L46.0901 20.3528C46.2221 20.2798 46.3531 20.2058 46.4841 20.1368C48.2771 19.1518 49.9611 18.3468 51.5371 17.7218C56.6321 15.6958 60.6251 15.5248 63.6501 17.1868C65.7491 18.3378 68.3221 20.9668 68.6691 26.9508C68.6791 27.1398 68.6881 27.3268 68.6931 27.5158C68.7031 27.8298 68.7071 28.1448 68.7041 28.4598C68.7031 28.7328 68.6961 29.0068 68.6841 29.2798Z" fill="white" /> </g><g opacity="0.2"> <path d="M68.6841 29.2807C68.5881 31.4757 68.1811 33.6597 67.4841 35.7647C67.4081 35.9967 67.3271 36.2267 67.2441 36.4577C67.0821 36.9037 66.9061 37.3467 66.7151 37.7827C66.5041 38.2777 66.2741 38.7637 66.0271 39.2447C65.8961 39.5027 65.7581 39.7587 65.6151 40.0137C65.4721 40.2687 65.3271 40.5207 65.1741 40.7707C65.0231 41.0207 64.8691 41.2677 64.7061 41.5137C64.6261 41.6357 64.5451 41.7577 64.4621 41.8787L52.6751 59.1707L50.2011 62.8007L46.1621 60.0467L45.7671 59.7777L46.1851 59.1657L46.5801 59.4327L50.2241 61.9187L52.8881 58.0127L64.4851 40.9977C66.9571 37.3697 68.4061 33.1537 68.6821 28.8827C68.6901 28.7427 68.6991 28.6027 68.7031 28.4627C68.7051 28.4517 68.7051 28.4407 68.7061 28.4297C68.7051 28.7117 68.6971 28.9967 68.6841 29.2807Z" fill="black" /> </g><g opacity="0.3"> <path d="M48.7041 25.0397L46.4601 21.0186L46.0901 20.3537C46.2221 20.2807 46.3531 20.2066 46.4841 20.1376C48.2771 19.1526 49.9611 18.3477 51.5371 17.7227C51.5591 17.7597 51.5771 17.7986 51.5941 17.8376C51.6091 17.8666 51.6221 17.8976 51.6351 17.9286C51.6461 17.9556 51.6581 17.9817 51.6681 18.0097C51.7301 18.1617 51.7831 18.3197 51.8261 18.4817C51.8451 18.5527 51.8621 18.6267 51.8781 18.6987C51.8891 18.7507 51.9001 18.8007 51.9081 18.8517C51.9151 18.8897 51.9211 18.9267 51.9271 18.9657C51.9281 18.9787 51.9311 18.9917 51.9321 19.0047C51.9401 19.0557 51.9441 19.1076 51.9501 19.1586C51.9511 19.1756 51.9541 19.1927 51.9551 19.2097C51.9591 19.2457 51.9611 19.2787 51.9631 19.3147L52.1061 21.6337L52.1541 22.4156L52.2071 23.2646C51.1531 23.7356 49.9901 24.3227 48.7041 25.0397Z" fill="black" /> </g><path opacity="0.2" d="M64.326 27.5552C64.325 27.8672 64.317 28.1802 64.301 28.4922L64.3 28.5232C64.298 28.6142 64.287 28.7131 64.285 28.8121L64.284 28.8582C64.274 28.9572 64.271 29.0632 64.261 29.1622C64.25 29.2762 64.24 29.3822 64.229 29.4892C64.208 29.7022 64.18 29.9142 64.159 30.1202C64.142 30.2032 64.132 30.2872 64.122 30.3712C64.019 31.0852 63.878 31.7972 63.7 32.5012C63.674 32.6072 63.649 32.7212 63.615 32.8272C63.598 32.9032 63.573 32.9862 63.548 33.0692C63.531 33.1302 63.514 33.1982 63.489 33.2662C63.464 33.3642 63.43 33.4702 63.397 33.5762C63.372 33.6592 63.347 33.7502 63.314 33.8332C63.297 33.8942 63.272 33.9612 63.256 34.0222C63.231 34.0982 63.206 34.1732 63.181 34.2492C63.14 34.3622 63.099 34.4682 63.066 34.5662C63.033 34.6492 63.008 34.7322 62.976 34.8152C62.952 34.8752 62.927 34.9362 62.902 35.0032C62.87 35.0712 62.845 35.1462 62.812 35.2222C62.763 35.3432 62.714 35.4632 62.665 35.5842C62.624 35.6822 62.584 35.7722 62.543 35.8702C62.438 36.0962 62.333 36.3221 62.22 36.5471C62.187 36.6221 62.155 36.6982 62.115 36.7652C61.777 37.4422 61.409 38.0952 60.996 38.7322L53.978 49.6272L47.127 60.2752L46.929 60.5742L46.158 60.0512L45.761 59.7812L46.181 59.1672L53.024 49.1292L60.025 38.8592C60.429 38.2602 60.804 37.6381 61.141 37.0061C61.173 36.9381 61.213 36.8712 61.245 36.8032C61.357 36.5932 61.462 36.3742 61.559 36.1562C61.599 36.0732 61.64 35.9832 61.68 35.8922C61.737 35.7722 61.785 35.6582 61.834 35.5462C61.859 35.4782 61.891 35.4102 61.916 35.3422C61.94 35.2822 61.965 35.2212 61.989 35.1612C62.021 35.0862 62.054 35.0102 62.079 34.9352C62.12 34.8372 62.161 34.7312 62.194 34.6332C62.219 34.5572 62.243 34.4902 62.276 34.4142C62.293 34.3532 62.309 34.3012 62.334 34.2402C62.359 34.1572 62.392 34.0742 62.417 33.9982C62.45 33.9002 62.476 33.8012 62.509 33.7032C62.526 33.6352 62.543 33.5742 62.567 33.5142C62.592 33.4382 62.609 33.3632 62.634 33.2872C62.659 33.1892 62.685 33.0832 62.718 32.9842C62.896 32.3182 63.028 31.6512 63.13 30.9762C63.147 30.9002 63.157 30.8171 63.167 30.7411C63.195 30.5441 63.216 30.3462 63.236 30.1482C63.254 30.0422 63.257 29.9352 63.267 29.8362C63.277 29.7372 63.287 29.6461 63.29 29.5471L63.291 29.5012C63.301 29.4102 63.303 29.3182 63.313 29.2272L63.314 29.1972C63.329 28.9082 63.337 28.6112 63.337 28.3212C63.339 27.9632 63.325 27.6122 63.304 27.2612C63.196 25.3072 62.714 22.7952 61.061 21.8902C60.009 21.3132 57.537 20.8592 52.2 23.2632C51.151 23.7382 49.985 24.3252 48.701 25.0372L46.453 21.0152L46.09 20.3502C46.221 20.2772 46.353 20.2052 46.477 20.1392C46.779 19.9722 47.072 19.8122 47.366 19.6602L47.46 19.8452L49.694 24.1031C49.929 22.9111 51.971 22.4032 53.049 21.9412C57.203 20.1632 60.4 20.4082 61.458 21.0232C63.109 21.9742 64.19 24.3652 64.303 26.4332C64.323 26.8082 64.328 27.1822 64.326 27.5552Z" fill="black" /><path d="M52.14 62.3939L51.054 71.4959C51.033 71.6619 51.013 71.8169 50.992 71.9719C50.982 72.0029 50.982 72.0239 50.982 72.0439C50.972 72.0749 50.972 72.1059 50.961 72.1369C50.951 72.2509 50.93 72.3649 50.909 72.4779C50.899 72.5399 50.899 72.5919 50.878 72.6539C50.857 72.8299 50.826 72.9949 50.795 73.1609C50.764 73.3159 50.733 73.4709 50.702 73.6159C50.692 73.6569 50.681 73.6879 50.681 73.7189C50.64 73.8739 50.609 74.0289 50.567 74.1839C50.567 74.2049 50.557 74.2149 50.557 74.2359C50.516 74.3909 50.474 74.5569 50.433 74.7119C50.402 74.8459 50.36 74.9809 50.319 75.1149C50.319 75.1459 50.309 75.1769 50.298 75.2079C50.298 75.2179 50.288 75.2289 50.288 75.2489C50.278 75.2899 50.267 75.3209 50.247 75.3629C50.216 75.4869 50.175 75.6109 50.133 75.7349C50.102 75.8489 50.061 75.9729 50.019 76.0969C49.936 76.3349 49.843 76.5829 49.76 76.8209C49.667 77.0589 49.574 77.2969 49.47 77.5239C49.418 77.6379 49.377 77.7519 49.325 77.8649C49.284 77.9479 49.253 78.0299 49.211 78.1029C49.18 78.1859 49.139 78.2579 49.107 78.3299C49.086 78.3609 49.076 78.3919 49.066 78.4129C49.014 78.5269 48.952 78.6299 48.901 78.7439L48.891 78.7539C48.85 78.8469 48.798 78.9399 48.757 79.0329C48.426 79.6429 48.074 80.2219 47.692 80.7809C47.63 80.8739 47.568 80.9669 47.506 81.0499C47.434 81.1529 47.372 81.2359 47.299 81.3399C47.289 81.3399 47.289 81.3499 47.278 81.3609C47.226 81.4329 47.164 81.5059 47.113 81.5779C47.082 81.6189 47.051 81.6609 47.02 81.7019C46.968 81.7639 46.916 81.8259 46.865 81.8989H46.855C46.834 81.9199 46.814 81.9399 46.803 81.9609C46.741 82.0329 46.689 82.1059 46.627 82.1779C46.544 82.2609 46.472 82.3539 46.389 82.4369C46.368 82.4679 46.348 82.4889 46.317 82.5199C45.748 83.1409 45.024 83.4919 44.279 83.4919H12.494C11.977 83.4919 11.46 83.3159 10.994 82.9849C10.704 82.7879 10.436 82.6019 10.177 82.4259C10.167 82.4259 10.167 82.4159 10.156 82.4159C10.146 82.4059 10.146 82.4059 10.146 82.4059H10.136C10.126 82.3959 10.115 82.3849 10.105 82.3749C10.084 82.3649 10.064 82.3539 10.053 82.3439L10.043 82.3339C10.022 82.3339 10.012 82.3239 10.002 82.3129C9.971 82.2919 9.95 82.2719 9.93 82.2609C9.878 82.2299 9.83701 82.1989 9.79601 82.1679C9.76501 82.1469 9.734 82.1269 9.703 82.1059C9.693 82.0959 9.682 82.0849 9.672 82.0749C9.651 82.0649 9.641 82.0539 9.62 82.0439C9.589 82.0229 9.548 81.9919 9.506 81.9719C9.496 81.9619 9.485 81.9509 9.485 81.9409C9.475 81.9409 9.464 81.9309 9.454 81.9309C9.299 81.8279 9.164 81.7139 9.02 81.6099L8.999 81.5889H8.989C8.979 81.5789 8.968 81.5679 8.958 81.5579C8.917 81.5269 8.886 81.4959 8.854 81.4749C8.74 81.3919 8.637 81.2989 8.544 81.2159C8.523 81.2059 8.513 81.1849 8.503 81.1749C8.441 81.1229 8.379 81.0719 8.317 81.0099C8.317 81.0099 8.30701 80.9999 8.29601 80.9999C8.24401 80.9479 8.193 80.8959 8.141 80.8449C8.017 80.7209 7.903 80.5969 7.779 80.4519C7.769 80.4419 7.748 80.4209 7.738 80.3999C7.728 80.3999 7.728 80.3999 7.728 80.3899C7.718 80.3799 7.707 80.3689 7.697 80.3489C7.687 80.3389 7.676 80.3389 7.666 80.3279C7.645 80.2969 7.625 80.2659 7.604 80.2349C7.573 80.2039 7.542 80.1629 7.511 80.1209L7.44901 80.0589C7.39701 79.9759 7.335 79.9039 7.283 79.8209C7.242 79.7689 7.211 79.7169 7.169 79.6659C7.138 79.6139 7.107 79.5729 7.076 79.5209C7.045 79.4689 7.014 79.4279 6.983 79.3759C6.973 79.3549 6.962 79.3449 6.952 79.3239C6.848 79.1579 6.755 78.9929 6.652 78.8169C6.631 78.7649 6.611 78.7239 6.58 78.6829C6.487 78.4969 6.383 78.2999 6.29 78.1039C6.135 77.7729 5.98 77.4109 5.814 77.0179C5.783 76.9249 5.742 76.8209 5.7 76.7279C5.669 76.6349 5.638 76.5519 5.607 76.4689C5.566 76.3759 5.53501 76.2829 5.50401 76.1899C5.41101 75.9209 5.307 75.6419 5.204 75.3519C4.832 74.2239 4.449 72.9009 4.035 71.3079C1.491 61.4199 5.069 40.2889 5.069 40.2889C5.276 38.9439 5.462 37.6409 5.617 36.3899C5.638 36.2139 5.658 36.0379 5.679 35.8729C5.741 35.3559 5.803 34.8489 5.855 34.3529C5.855 34.3119 5.86501 34.2599 5.86501 34.2189C5.90601 33.8979 5.937 33.5779 5.969 33.2569C6.031 32.6359 6.083 32.0359 6.124 31.4369C6.155 31.0959 6.176 30.7439 6.207 30.4029C6.228 29.9889 6.259 29.5759 6.279 29.1719C6.31 28.6649 6.33101 28.1689 6.35101 27.6929V27.5789C6.36101 27.2579 6.372 26.9479 6.382 26.6379C6.382 26.5349 6.392 26.4309 6.392 26.3379C6.402 25.7069 6.413 25.0969 6.413 24.5069C6.413 24.2789 6.403 24.0619 6.403 23.8349C6.403 23.4629 6.393 23.0899 6.382 22.7179C6.361 21.9839 6.33 21.2799 6.289 20.5979C6.268 20.2569 6.24801 19.9259 6.22701 19.5949C6.21701 19.5639 6.217 19.5229 6.217 19.4809C6.207 19.3049 6.186 19.1289 6.176 18.9539V18.9439C6.155 18.7789 6.145 18.6129 6.124 18.4579C6.072 17.9719 6.021 17.4959 5.969 17.0309C5.886 16.4209 5.803 15.8309 5.7 15.2729C5.669 15.0659 5.638 14.8699 5.597 14.6729C5.576 14.5799 5.566 14.4869 5.545 14.3829C5.504 14.1969 5.473 13.9999 5.431 13.8139C5.39 13.6279 5.348 13.4519 5.317 13.2659C5.296 13.1829 5.276 13.0899 5.255 12.9969C5.183 12.7179 5.12 12.4379 5.048 12.1699C4.976 11.9009 4.914 11.6429 4.841 11.3839C4.8 11.2599 4.76801 11.1359 4.72701 11.0119C4.67501 10.8259 4.613 10.6399 4.562 10.4639C4.5 10.2879 4.448 10.1119 4.386 9.94692C4.314 9.71892 4.231 9.50192 4.148 9.28492C4.034 8.96392 3.91 8.65392 3.786 8.36392C3.548 7.78492 3.3 7.25692 3.041 6.78192C2.969 6.62692 2.886 6.48192 2.803 6.33692C2.637 6.03692 2.472 5.76792 2.317 5.51992C2.193 5.33392 2.079 5.15791 1.965 4.99291C1.386 4.18591 0.868998 3.64792 0.516998 3.33792C0.351998 3.18292 0.227003 2.99692 0.134003 2.77892C0.0510027 2.55092 0 2.30292 0 2.04492C0 1.42392 0.289999 0.854928 0.723999 0.606928L0.796005 0.575922C1.60301 0.110922 2.48201 -0.0650821 3.35101 0.0279179L12.857 1.13493L14.698 1.35192L16.27 1.52792L41.859 4.50692L46.131 5.00292C46.214 5.01292 46.286 5.02391 46.358 5.03391C46.42 5.05491 46.493 5.06491 46.555 5.07491C46.648 5.10591 46.731 5.12692 46.824 5.15792C46.876 5.17892 46.938 5.19892 46.989 5.21992C47.031 5.22992 47.082 5.25092 47.124 5.27192C47.155 5.29292 47.196 5.30292 47.228 5.32392C47.269 5.34492 47.311 5.36492 47.362 5.38592C47.372 5.39592 47.383 5.39592 47.393 5.40692C47.403 5.40692 47.414 5.41693 47.424 5.41693C47.424 5.42693 47.434 5.42692 47.445 5.43792C47.466 5.44792 47.486 5.45893 47.507 5.46893C47.538 5.47893 47.559 5.49993 47.579 5.50993C47.589 5.51993 47.6 5.51992 47.61 5.53092C47.641 5.55192 47.672 5.57192 47.703 5.59292C47.734 5.61392 47.765 5.63392 47.796 5.65492C47.889 5.71692 47.972 5.77892 48.065 5.85192C48.086 5.87292 48.117 5.89292 48.137 5.91392L48.168 5.94493C48.189 5.95493 48.199 5.96592 48.209 5.97592L48.302 6.06892C48.333 6.09992 48.364 6.12093 48.385 6.15193C48.468 6.23493 48.55 6.31692 48.633 6.40992C48.664 6.45192 48.695 6.49291 48.737 6.53391C48.768 6.57491 48.809 6.62692 48.84 6.66792C48.85 6.68892 48.871 6.69892 48.881 6.71992C48.922 6.77192 48.953 6.82292 48.995 6.87492C49.047 6.94692 49.088 7.01991 49.14 7.10291C49.347 7.43391 49.523 7.79592 49.657 8.17892C49.678 8.21992 49.688 8.26193 49.698 8.30293C49.719 8.33393 49.729 8.37493 49.739 8.41693C49.842 8.70693 49.915 9.01692 49.977 9.33792C49.987 9.40992 49.998 9.47292 50.008 9.54492C50.018 9.59692 50.029 9.64791 50.039 9.69991V9.75192C50.049 9.78292 50.049 9.82492 50.049 9.85592C50.059 9.89692 50.059 9.92792 50.059 9.95892C50.069 10.0309 50.08 10.1039 50.08 10.1759L51.156 26.1459L51.166 26.3429L52.283 58.7689C52.337 59.9739 52.285 61.1949 52.14 62.3939Z" fill="#D5E6ED" /></g>`, milk:`<g transform="matrix(-1 0 0 1 69 0)"><path d="M52.14 62.3939L51.054 71.4959C51.033 71.6619 51.013 71.8169 50.992 71.9719C50.982 72.0029 50.982 72.0239 50.982 72.0439C50.972 72.0749 50.972 72.1059 50.961 72.1369C50.951 72.2509 50.93 72.3649 50.909 72.4779C50.899 72.5399 50.899 72.5919 50.878 72.6539C50.857 72.8299 50.826 72.9949 50.795 73.1609C50.764 73.3159 50.733 73.4709 50.702 73.6159C50.692 73.6569 50.681 73.6879 50.681 73.7189C50.64 73.8739 50.609 74.0289 50.567 74.1839C50.567 74.2049 50.557 74.2149 50.557 74.2359C50.516 74.3909 50.474 74.5569 50.433 74.7119C50.402 74.8459 50.36 74.9809 50.319 75.1149C50.319 75.1459 50.309 75.1769 50.298 75.2079C50.298 75.2179 50.288 75.2289 50.288 75.2489C50.278 75.2899 50.267 75.3209 50.247 75.3629C50.216 75.4869 50.175 75.6109 50.133 75.7349C50.102 75.8489 50.061 75.9729 50.019 76.0969C49.936 76.3349 49.843 76.5829 49.76 76.8209C49.667 77.0589 49.574 77.2969 49.47 77.5239C49.418 77.6379 49.377 77.7519 49.325 77.8649C49.284 77.9479 49.253 78.0299 49.211 78.1029C49.18 78.1859 49.139 78.2579 49.107 78.3299C49.086 78.3609 49.076 78.3919 49.066 78.4129C49.014 78.5269 48.952 78.6299 48.901 78.7439L48.891 78.7539C48.85 78.8469 48.798 78.9399 48.757 79.0329C48.426 79.6429 48.074 80.2219 47.692 80.7809C47.63 80.8739 47.568 80.9669 47.506 81.0499C47.434 81.1529 47.372 81.2359 47.299 81.3399C47.289 81.3399 47.289 81.3499 47.278 81.3609C47.226 81.4329 47.164 81.5059 47.113 81.5779C47.082 81.6189 47.051 81.6609 47.02 81.7019C46.968 81.7639 46.916 81.8259 46.865 81.8989H46.855C46.834 81.9199 46.814 81.9399 46.803 81.9609C46.741 82.0329 46.689 82.1059 46.627 82.1779C46.544 82.2609 46.472 82.3539 46.389 82.4369C46.368 82.4679 46.348 82.4889 46.317 82.5199C45.748 83.1409 45.024 83.4919 44.279 83.4919H12.494C11.977 83.4919 11.46 83.3159 10.994 82.9849C10.704 82.7879 10.436 82.6019 10.177 82.4259C10.167 82.4259 10.167 82.4159 10.156 82.4159C10.146 82.4059 10.146 82.4059 10.146 82.4059H10.136C10.126 82.3959 10.115 82.3849 10.105 82.3749C10.084 82.3649 10.064 82.3539 10.053 82.3439L10.043 82.3339C10.022 82.3339 10.012 82.3239 10.002 82.3129C9.971 82.2919 9.95 82.2719 9.93 82.2609C9.878 82.2299 9.83701 82.1989 9.79601 82.1679C9.76501 82.1469 9.734 82.1269 9.703 82.1059C9.693 82.0959 9.682 82.0849 9.672 82.0749C9.651 82.0649 9.641 82.0539 9.62 82.0439C9.589 82.0229 9.548 81.9919 9.506 81.9719C9.496 81.9619 9.485 81.9509 9.485 81.9409C9.475 81.9409 9.464 81.9309 9.454 81.9309C9.299 81.8279 9.164 81.7139 9.02 81.6099L8.999 81.5889H8.989C8.979 81.5789 8.968 81.5679 8.958 81.5579C8.917 81.5269 8.886 81.4959 8.854 81.4749C8.74 81.3919 8.637 81.2989 8.544 81.2159C8.523 81.2059 8.513 81.1849 8.503 81.1749C8.441 81.1229 8.379 81.0719 8.317 81.0099C8.317 81.0099 8.30701 80.9999 8.29601 80.9999C8.24401 80.9479 8.193 80.8959 8.141 80.8449C8.017 80.7209 7.903 80.5969 7.779 80.4519C7.769 80.4419 7.748 80.4209 7.738 80.3999C7.728 80.3999 7.728 80.3999 7.728 80.3899C7.718 80.3799 7.707 80.3689 7.697 80.3489C7.687 80.3389 7.676 80.3389 7.666 80.3279C7.645 80.2969 7.625 80.2659 7.604 80.2349C7.573 80.2039 7.542 80.1629 7.511 80.1209L7.44901 80.0589C7.39701 79.9759 7.335 79.9039 7.283 79.8209C7.242 79.7689 7.211 79.7169 7.169 79.6659C7.138 79.6139 7.107 79.5729 7.076 79.5209C7.045 79.4689 7.014 79.4279 6.983 79.3759C6.973 79.3549 6.962 79.3449 6.952 79.3239C6.848 79.1579 6.755 78.9929 6.652 78.8169C6.631 78.7649 6.611 78.7239 6.58 78.6829C6.487 78.4969 6.383 78.2999 6.29 78.1039C6.135 77.7729 5.98 77.4109 5.814 77.0179C5.783 76.9249 5.742 76.8209 5.7 76.7279C5.669 76.6349 5.638 76.5519 5.607 76.4689C5.566 76.3759 5.53501 76.2829 5.50401 76.1899C5.41101 75.9209 5.307 75.6419 5.204 75.3519C4.832 74.2239 4.449 72.9009 4.035 71.3079C1.491 61.4199 5.069 40.2889 5.069 40.2889C5.276 38.9439 5.462 37.6409 5.617 36.3899C5.638 36.2139 5.658 36.0379 5.679 35.8729C5.741 35.3559 5.803 34.8489 5.855 34.3529C5.855 34.3119 5.86501 34.2599 5.86501 34.2189C5.90601 33.8979 5.937 33.5779 5.969 33.2569C6.031 32.6359 6.083 32.0359 6.124 31.4369C6.155 31.0959 6.176 30.7439 6.207 30.4029C6.228 29.9889 6.259 29.5759 6.279 29.1719C6.31 28.6649 6.33101 28.1689 6.35101 27.6929V27.5789C6.36101 27.2579 6.372 26.9479 6.382 26.6379C6.382 26.5349 6.392 26.4309 6.392 26.3379C6.402 25.7069 6.413 25.0969 6.413 24.5069C6.413 24.2789 6.403 24.0619 6.403 23.8349C6.403 23.4629 6.393 23.0899 6.382 22.7179C6.361 21.9839 6.33 21.2799 6.289 20.5979C6.268 20.2569 6.24801 19.9259 6.22701 19.5949C6.21701 19.5639 6.217 19.5229 6.217 19.4809C6.207 19.3049 6.186 19.1289 6.176 18.9539V18.9439C6.155 18.7789 6.145 18.6129 6.124 18.4579C6.072 17.9719 6.021 17.4959 5.969 17.0309C5.886 16.4209 5.803 15.8309 5.7 15.2729C5.669 15.0659 5.638 14.8699 5.597 14.6729C5.576 14.5799 5.566 14.4869 5.545 14.3829C5.504 14.1969 5.473 13.9999 5.431 13.8139C5.39 13.6279 5.348 13.4519 5.317 13.2659C5.296 13.1829 5.276 13.0899 5.255 12.9969C5.183 12.7179 5.12 12.4379 5.048 12.1699C4.976 11.9009 4.914 11.6429 4.841 11.3839C4.8 11.2599 4.76801 11.1359 4.72701 11.0119C4.67501 10.8259 4.613 10.6399 4.562 10.4639C4.5 10.2879 4.448 10.1119 4.386 9.94692C4.314 9.71892 4.231 9.50192 4.148 9.28492C4.034 8.96392 3.91 8.65392 3.786 8.36392C3.548 7.78492 3.3 7.25692 3.041 6.78192C2.969 6.62692 2.886 6.48192 2.803 6.33692C2.637 6.03692 2.472 5.76792 2.317 5.51992C2.193 5.33392 2.079 5.15791 1.965 4.99291C1.386 4.18591 0.868998 3.64792 0.516998 3.33792C0.351998 3.18292 0.227003 2.99692 0.134003 2.77892C0.0510027 2.55092 0 2.30292 0 2.04492C0 1.42392 0.289999 0.854928 0.723999 0.606928L0.796005 0.575922C1.60301 0.110922 2.48201 -0.0650821 3.35101 0.0279179L12.857 1.13493L14.698 1.35192L16.27 1.52792L41.859 4.50692L46.131 5.00292C46.214 5.01292 46.286 5.02391 46.358 5.03391C46.42 5.05491 46.493 5.06491 46.555 5.07491C46.648 5.10591 46.731 5.12692 46.824 5.15792C46.876 5.17892 46.938 5.19892 46.989 5.21992C47.031 5.22992 47.082 5.25092 47.124 5.27192C47.155 5.29292 47.196 5.30292 47.228 5.32392C47.269 5.34492 47.311 5.36492 47.362 5.38592C47.372 5.39592 47.383 5.39592 47.393 5.40692C47.403 5.40692 47.414 5.41693 47.424 5.41693C47.424 5.42693 47.434 5.42692 47.445 5.43792C47.466 5.44792 47.486 5.45893 47.507 5.46893C47.538 5.47893 47.559 5.49993 47.579 5.50993C47.589 5.51993 47.6 5.51992 47.61 5.53092C47.641 5.55192 47.672 5.57192 47.703 5.59292C47.734 5.61392 47.765 5.63392 47.796 5.65492C47.889 5.71692 47.972 5.77892 48.065 5.85192C48.086 5.87292 48.117 5.89292 48.137 5.91392L48.168 5.94493C48.189 5.95493 48.199 5.96592 48.209 5.97592L48.302 6.06892C48.333 6.09992 48.364 6.12093 48.385 6.15193C48.468 6.23493 48.55 6.31692 48.633 6.40992C48.664 6.45192 48.695 6.49291 48.737 6.53391C48.768 6.57491 48.809 6.62692 48.84 6.66792C48.85 6.68892 48.871 6.69892 48.881 6.71992C48.922 6.77192 48.953 6.82292 48.995 6.87492C49.047 6.94692 49.088 7.01991 49.14 7.10291C49.347 7.43391 49.523 7.79592 49.657 8.17892C49.678 8.21992 49.688 8.26193 49.698 8.30293C49.719 8.33393 49.729 8.37493 49.739 8.41693C49.842 8.70693 49.915 9.01692 49.977 9.33792C49.987 9.40992 49.998 9.47292 50.008 9.54492C50.018 9.59692 50.029 9.64791 50.039 9.69991V9.75192C50.049 9.78292 50.049 9.82492 50.049 9.85592C50.059 9.89692 50.059 9.92792 50.059 9.95892C50.069 10.0309 50.08 10.1039 50.08 10.1759L51.156 26.1459L51.166 26.3429L52.283 58.7689C52.337 59.9739 52.285 61.1949 52.14 62.3939Z" fill="url(#{U}lq)" /><path d="M52.14 62.3939L51.054 71.4959C51.033 71.6619 51.013 71.8169 50.992 71.9719C50.982 72.0029 50.982 72.0239 50.982 72.0439C50.972 72.0749 50.972 72.1059 50.961 72.1369C50.951 72.2509 50.93 72.3649 50.909 72.4779C50.899 72.5399 50.899 72.5919 50.878 72.6539C50.857 72.8299 50.826 72.9949 50.795 73.1609C50.764 73.3159 50.733 73.4709 50.702 73.6159C50.692 73.6569 50.681 73.6879 50.681 73.7189C50.64 73.8739 50.609 74.0289 50.567 74.1839C50.567 74.2049 50.557 74.2149 50.557 74.2359C50.516 74.3909 50.474 74.5569 50.433 74.7119C50.402 74.8459 50.36 74.9809 50.319 75.1149C50.319 75.1459 50.309 75.1769 50.298 75.2079C50.298 75.2179 50.288 75.2289 50.288 75.2489C50.278 75.2899 50.267 75.3209 50.247 75.3629C50.216 75.4869 50.175 75.6109 50.133 75.7349C50.102 75.8489 50.061 75.9729 50.019 76.0969C49.936 76.3349 49.843 76.5829 49.76 76.8209C49.667 77.0589 49.574 77.2969 49.47 77.5239C49.418 77.6379 49.377 77.7519 49.325 77.8649C49.284 77.9479 49.253 78.0299 49.211 78.1029C49.18 78.1859 49.139 78.2579 49.107 78.3299C49.086 78.3609 49.076 78.3919 49.066 78.4129C49.014 78.5269 48.952 78.6299 48.901 78.7439L48.891 78.7539C48.85 78.8469 48.798 78.9399 48.757 79.0329C48.426 79.6429 48.074 80.2219 47.692 80.7809C47.63 80.8739 47.568 80.9669 47.506 81.0499C47.434 81.1529 47.372 81.2359 47.299 81.3399C47.289 81.3399 47.289 81.3499 47.278 81.3609C47.226 81.4329 47.164 81.5059 47.113 81.5779C47.082 81.6189 47.051 81.6609 47.02 81.7019C46.968 81.7639 46.916 81.8259 46.865 81.8989H46.855C46.834 81.9199 46.814 81.9399 46.803 81.9609C46.741 82.0329 46.689 82.1059 46.627 82.1779C46.544 82.2609 46.472 82.3539 46.389 82.4369C46.368 82.4679 46.348 82.4889 46.317 82.5199C45.748 83.1409 45.024 83.4919 44.279 83.4919H12.494C11.977 83.4919 11.46 83.3159 10.994 82.9849C10.704 82.7879 10.436 82.6019 10.177 82.4259C10.167 82.4259 10.167 82.4159 10.156 82.4159C10.146 82.4059 10.146 82.4059 10.146 82.4059H10.136C10.126 82.3959 10.115 82.3849 10.105 82.3749C10.084 82.3649 10.064 82.3539 10.053 82.3439L10.043 82.3339C10.022 82.3339 10.012 82.3239 10.002 82.3129C9.971 82.2919 9.95 82.2719 9.93 82.2609C9.878 82.2299 9.83701 82.1989 9.79601 82.1679C9.76501 82.1469 9.734 82.1269 9.703 82.1059C9.693 82.0959 9.682 82.0849 9.672 82.0749C9.651 82.0649 9.641 82.0539 9.62 82.0439C9.589 82.0229 9.548 81.9919 9.506 81.9719C9.496 81.9619 9.485 81.9509 9.485 81.9409C9.475 81.9409 9.464 81.9309 9.454 81.9309C9.299 81.8279 9.164 81.7139 9.02 81.6099L8.999 81.5889H8.989C8.979 81.5789 8.968 81.5679 8.958 81.5579C8.917 81.5269 8.886 81.4959 8.854 81.4749C8.74 81.3919 8.637 81.2989 8.544 81.2159C8.523 81.2059 8.513 81.1849 8.503 81.1749C8.441 81.1229 8.379 81.0719 8.317 81.0099C8.317 81.0099 8.30701 80.9999 8.29601 80.9999C8.24401 80.9479 8.193 80.8959 8.141 80.8449C8.017 80.7209 7.903 80.5969 7.779 80.4519C7.769 80.4419 7.748 80.4209 7.738 80.3999C7.728 80.3999 7.728 80.3999 7.728 80.3899C7.718 80.3799 7.707 80.3689 7.697 80.3489C7.687 80.3389 7.676 80.3389 7.666 80.3279C7.645 80.2969 7.625 80.2659 7.604 80.2349C7.573 80.2039 7.542 80.1629 7.511 80.1209L7.44901 80.0589C7.39701 79.9759 7.335 79.9039 7.283 79.8209C7.242 79.7689 7.211 79.7169 7.169 79.6659C7.138 79.6139 7.107 79.5729 7.076 79.5209C7.045 79.4689 7.014 79.4279 6.983 79.3759C6.973 79.3549 6.962 79.3449 6.952 79.3239C6.848 79.1579 6.755 78.9929 6.652 78.8169C6.631 78.7649 6.611 78.7239 6.58 78.6829C6.487 78.4969 6.383 78.2999 6.29 78.1039C6.135 77.7729 5.98 77.4109 5.814 77.0179C5.783 76.9249 5.742 76.8209 5.7 76.7279C5.669 76.6349 5.638 76.5519 5.607 76.4689C5.566 76.3759 5.53501 76.2829 5.50401 76.1899C5.41101 75.9209 5.307 75.6419 5.204 75.3519C4.832 74.2239 4.449 72.9009 4.035 71.3079C1.491 61.4199 5.069 40.2889 5.069 40.2889C5.276 38.9439 5.462 37.6409 5.617 36.3899C5.638 36.2139 5.658 36.0379 5.679 35.8729C5.741 35.3559 5.803 34.8489 5.855 34.3529C5.855 34.3119 5.86501 34.2599 5.86501 34.2189C5.90601 33.8979 5.937 33.5779 5.969 33.2569C6.031 32.6359 6.083 32.0359 6.124 31.4369C6.155 31.0959 6.176 30.7439 6.207 30.4029C6.228 29.9889 6.259 29.5759 6.279 29.1719C6.31 28.6649 6.33101 28.1689 6.35101 27.6929V27.5789C6.36101 27.2579 6.372 26.9479 6.382 26.6379C6.382 26.5349 6.392 26.4309 6.392 26.3379C6.402 25.7069 6.413 25.0969 6.413 24.5069C6.413 24.2789 6.403 24.0619 6.403 23.8349C6.403 23.4629 6.393 23.0899 6.382 22.7179C6.361 21.9839 6.33 21.2799 6.289 20.5979C6.268 20.2569 6.24801 19.9259 6.22701 19.5949C6.21701 19.5639 6.217 19.5229 6.217 19.4809C6.207 19.3049 6.186 19.1289 6.176 18.9539V18.9439C6.155 18.7789 6.145 18.6129 6.124 18.4579C6.072 17.9719 6.021 17.4959 5.969 17.0309C5.886 16.4209 5.803 15.8309 5.7 15.2729C5.669 15.0659 5.638 14.8699 5.597 14.6729C5.576 14.5799 5.566 14.4869 5.545 14.3829C5.504 14.1969 5.473 13.9999 5.431 13.8139C5.39 13.6279 5.348 13.4519 5.317 13.2659C5.296 13.1829 5.276 13.0899 5.255 12.9969C5.183 12.7179 5.12 12.4379 5.048 12.1699C4.976 11.9009 4.914 11.6429 4.841 11.3839C4.8 11.2599 4.76801 11.1359 4.72701 11.0119C4.67501 10.8259 4.613 10.6399 4.562 10.4639C4.5 10.2879 4.448 10.1119 4.386 9.94692C4.314 9.71892 4.231 9.50192 4.148 9.28492C4.034 8.96392 3.91 8.65392 3.786 8.36392C3.548 7.78492 3.3 7.25692 3.041 6.78192C2.969 6.62692 2.886 6.48192 2.803 6.33692C2.637 6.03692 2.472 5.76792 2.317 5.51992C2.193 5.33392 2.079 5.15791 1.965 4.99291C1.386 4.18591 0.868998 3.64792 0.516998 3.33792C0.351998 3.18292 0.227003 2.99692 0.134003 2.77892C0.0510027 2.55092 0 2.30292 0 2.04492C0 1.42392 0.289999 0.854928 0.723999 0.606928L0.796005 0.575922C1.60301 0.110922 2.48201 -0.0650821 3.35101 0.0279179L12.857 1.13493L14.698 1.35192L16.27 1.52792L41.859 4.50692L46.131 5.00292C46.214 5.01292 46.286 5.02391 46.358 5.03391C46.42 5.05491 46.493 5.06491 46.555 5.07491C46.648 5.10591 46.731 5.12692 46.824 5.15792C46.876 5.17892 46.938 5.19892 46.989 5.21992C47.031 5.22992 47.082 5.25092 47.124 5.27192C47.155 5.29292 47.196 5.30292 47.228 5.32392C47.269 5.34492 47.311 5.36492 47.362 5.38592C47.372 5.39592 47.383 5.39592 47.393 5.40692C47.403 5.40692 47.414 5.41693 47.424 5.41693C47.424 5.42693 47.434 5.42692 47.445 5.43792C47.466 5.44792 47.486 5.45893 47.507 5.46893C47.538 5.47893 47.559 5.49993 47.579 5.50993C47.589 5.51993 47.6 5.51992 47.61 5.53092C47.641 5.55192 47.672 5.57192 47.703 5.59292C47.734 5.61392 47.765 5.63392 47.796 5.65492C47.889 5.71692 47.972 5.77892 48.065 5.85192C48.086 5.87292 48.117 5.89292 48.137 5.91392L48.168 5.94493C48.189 5.95493 48.199 5.96592 48.209 5.97592L48.302 6.06892C48.333 6.09992 48.364 6.12093 48.385 6.15193C48.468 6.23493 48.55 6.31692 48.633 6.40992C48.664 6.45192 48.695 6.49291 48.737 6.53391C48.768 6.57491 48.809 6.62692 48.84 6.66792C48.85 6.68892 48.871 6.69892 48.881 6.71992C48.922 6.77192 48.953 6.82292 48.995 6.87492C49.047 6.94692 49.088 7.01991 49.14 7.10291C49.347 7.43391 49.523 7.79592 49.657 8.17892C49.678 8.21992 49.688 8.26193 49.698 8.30293C49.719 8.33393 49.729 8.37493 49.739 8.41693C49.842 8.70693 49.915 9.01692 49.977 9.33792C49.987 9.40992 49.998 9.47292 50.008 9.54492C50.018 9.59692 50.029 9.64791 50.039 9.69991V9.75192C50.049 9.78292 50.049 9.82492 50.049 9.85592C50.059 9.89692 50.059 9.92792 50.059 9.95892C50.069 10.0309 50.08 10.1039 50.08 10.1759L51.156 26.1459L51.166 26.3429L52.283 58.7689C52.337 59.9739 52.285 61.1949 52.14 62.3939Z" fill="url(#{U}dp)" /></g>`, surf:`<ellipse cx="41.5" cy="26.2" rx="23.4" ry="1.3" fill="#FFD95E" opacity=".9"/>`, front:`<g transform="matrix(-1 0 0 1 69 0)"><g opacity="0.12"> <path d="M52.1391 62.3974L51.0521 71.5014C51.0311 71.6844 51.0071 71.8674 50.9791 72.0484C50.9741 72.0804 50.9691 72.1103 50.9641 72.1423C50.9481 72.2543 50.9311 72.3674 50.9131 72.4774C50.9031 72.5384 50.8931 72.5983 50.8821 72.6593V72.6654C50.8571 72.8084 50.8311 72.9514 50.8041 73.0924C50.7991 73.1154 50.7961 73.1394 50.7911 73.1624C50.7801 73.2174 50.7691 73.2694 50.7591 73.3244C50.7111 73.5604 50.6601 73.7964 50.6051 74.0294C50.5921 74.0824 50.5821 74.1364 50.5681 74.1894C50.5651 74.2034 50.5601 74.2214 50.5571 74.2364C50.5531 74.2514 50.5491 74.2654 50.5461 74.2794C50.5171 74.3944 50.4881 74.5084 50.4571 74.6234C50.4491 74.6524 50.4421 74.6804 50.4351 74.7104C50.3991 74.8474 50.3621 74.9833 50.3221 75.1183C50.3141 75.1493 50.3041 75.1784 50.2971 75.2104C50.2931 75.2234 50.2911 75.2344 50.2861 75.2494C50.2381 75.4124 50.1891 75.5734 50.1361 75.7344C50.0971 75.8574 50.0561 75.9814 50.0141 76.1004C49.9331 76.3424 49.8461 76.5834 49.7541 76.8204C49.6641 77.0604 49.5681 77.2983 49.4681 77.5323C49.4201 77.6453 49.3711 77.7584 49.3191 77.8694C49.2841 77.9494 49.2481 78.0294 49.2101 78.1094C49.1751 78.1874 49.1401 78.2633 49.1021 78.3383C49.0901 78.3653 49.0781 78.3914 49.0621 78.4184C49.0111 78.5294 48.9561 78.6374 48.8991 78.7454L48.8941 78.7584C48.8471 78.8524 48.7991 78.9444 48.7501 79.0354C48.4281 79.6464 48.0761 80.2284 47.6951 80.7834C47.6311 80.8764 47.5671 80.9673 47.5021 81.0583C47.4331 81.1533 47.3651 81.2463 47.2941 81.3403C47.2891 81.3483 47.2831 81.3544 47.2781 81.3634C47.2211 81.4384 47.1651 81.5133 47.1081 81.5863C47.0781 81.6253 47.0471 81.6664 47.0161 81.7034C46.9631 81.7694 46.9111 81.8344 46.8591 81.9004C46.8591 81.9004 46.8541 81.9054 46.8521 81.9064C46.8341 81.9284 46.8171 81.9484 46.7991 81.9684C46.7421 82.0394 46.6831 82.1084 46.6241 82.1774C46.5471 82.2674 46.4691 82.3544 46.3921 82.4414C46.3671 82.4684 46.3421 82.4944 46.3181 82.5224C45.7471 83.1454 45.0271 83.4904 44.2811 83.4904H12.4981C11.9731 83.4904 11.4551 83.3174 10.9921 82.9924C10.7081 82.7924 10.4391 82.6093 10.1791 82.4353C10.1691 82.4293 10.1601 82.4224 10.1521 82.4164C10.1481 82.4154 10.1451 82.4124 10.1451 82.4124L10.1401 82.4084C10.1261 82.3964 10.1131 82.3893 10.1011 82.3813C10.0671 82.3573 10.0331 82.3343 10.0001 82.3123C9.97509 82.2943 9.9491 82.2754 9.9241 82.2604C9.8881 82.2364 9.85509 82.2124 9.82209 82.1894C9.81409 82.1854 9.80509 82.1794 9.80509 82.1794C9.76409 82.1514 9.7321 82.1284 9.7001 82.1074C9.6891 82.0974 9.67809 82.0924 9.66909 82.0834C9.65209 82.0734 9.63809 82.0634 9.62209 82.0524C9.58209 82.0254 9.5441 81.9974 9.5051 81.9714C9.4961 81.9624 9.4891 81.9564 9.4791 81.9524V81.9494C9.4691 81.9434 9.4601 81.9364 9.4511 81.9314C9.3021 81.8254 9.15909 81.7194 9.01709 81.6084C9.27409 81.7814 9.5431 81.9624 9.8241 82.1604C9.8381 82.1704 9.8521 82.1793 9.8671 82.1873L9.86909 82.1904C10.3211 82.4954 10.8211 82.6584 11.3301 82.6584H43.1151C43.8601 82.6584 44.5811 82.3154 45.1531 81.6904C45.1771 81.6624 45.2011 81.6354 45.2251 81.6094C47.7361 78.8244 49.3761 74.9273 49.8841 70.6703L50.9711 61.5674C51.1151 60.3654 51.1661 59.1483 51.1231 57.9353L49.9921 25.3074L48.9151 9.33635C48.8401 8.21235 48.5091 7.14336 47.9701 6.26636C47.8941 6.14536 47.8161 6.02635 47.7341 5.91635H47.7321C47.5761 5.69735 47.4041 5.49636 47.2231 5.31836C47.2691 5.34036 47.3131 5.36135 47.3581 5.38435C47.3711 5.39035 47.3831 5.39736 47.3961 5.40436C47.4041 5.40736 47.4131 5.41036 47.4181 5.41736C47.4481 5.43136 47.4781 5.44935 47.5061 5.46535C47.5321 5.48035 47.5601 5.49435 47.5831 5.51135C47.5931 5.51535 47.6031 5.52136 47.6101 5.52736C47.6421 5.54636 47.6731 5.56635 47.7041 5.58835C47.7351 5.60735 47.7671 5.62936 47.7971 5.65036C47.8871 5.71236 47.9751 5.78135 48.0621 5.85335C48.0861 5.87135 48.1121 5.89336 48.1361 5.91536C48.1471 5.92436 48.1581 5.93235 48.1691 5.94235C48.1831 5.95335 48.1941 5.96435 48.2061 5.97635C48.2381 6.00335 48.2691 6.03535 48.3011 6.06535C48.3311 6.09335 48.3581 6.12035 48.3881 6.14935C48.4711 6.22935 48.5511 6.31736 48.6291 6.40636C48.6631 6.44536 48.6961 6.48535 48.7301 6.52835C48.7671 6.57135 48.8041 6.61836 48.8391 6.66736C48.8911 6.73336 48.9411 6.80436 48.9911 6.87436C49.0411 6.94836 49.0881 7.02035 49.1341 7.09735C49.3411 7.43135 49.5161 7.79435 49.6571 8.17735C49.6731 8.21635 49.6881 8.25736 49.7021 8.29936C49.7151 8.33536 49.7281 8.37036 49.7391 8.40836C49.8391 8.70736 49.9191 9.01736 49.9761 9.33536C49.9891 9.40536 50.0011 9.47235 50.0111 9.54135C50.0191 9.59235 50.0271 9.64336 50.0331 9.69536C50.0411 9.74736 50.0471 9.80135 50.0521 9.85335C50.0561 9.88735 50.0591 9.92036 50.0621 9.95636L50.0631 9.96436C50.0701 10.0334 50.0781 10.0994 50.0811 10.1684L51.1591 26.1384L52.2891 58.7664C52.3331 59.9794 52.2821 61.1964 52.1391 62.3974Z" fill="black" /> </g><g opacity="0.2"> <path d="M25.2211 83.4913H12.4981C11.9731 83.4913 11.4551 83.3183 10.9921 82.9933C10.7081 82.7933 10.4391 82.6103 10.1791 82.4363C10.1721 82.4303 10.1641 82.4263 10.1561 82.4223L10.1521 82.4173C10.1481 82.4163 10.1451 82.4133 10.1451 82.4133L10.1401 82.4093C10.1261 82.3973 10.1131 82.3903 10.1011 82.3823C10.0821 82.3713 10.0671 82.3583 10.0481 82.3483L10.0391 82.3423C10.0261 82.3343 10.0121 82.3243 9.9991 82.3143C9.9741 82.2963 9.9481 82.2773 9.9231 82.2623C9.8801 82.2343 9.8371 82.2053 9.7961 82.1753C9.7631 82.1523 9.7311 82.1293 9.6991 82.1083C9.6881 82.0983 9.6771 82.0933 9.6681 82.0843C9.6511 82.0743 9.6371 82.0643 9.6211 82.0533C9.5811 82.0263 9.5431 81.9983 9.5041 81.9723C9.4951 81.9663 9.4861 81.9573 9.4781 81.9503C9.4681 81.9443 9.4591 81.9373 9.4501 81.9323C9.3011 81.8263 9.1581 81.7203 9.0161 81.6093C9.0161 81.6093 9.0011 81.5963 8.9941 81.5933H8.9921C8.9921 81.5933 8.9901 81.5903 8.9881 81.5893C8.9751 81.5803 8.9621 81.5703 8.9511 81.5603C8.9161 81.5333 8.8811 81.5053 8.8481 81.4793C8.7421 81.3953 8.6391 81.3093 8.5371 81.2193C8.5251 81.2083 8.5111 81.1953 8.4971 81.1823C8.4361 81.1293 8.3741 81.0733 8.3131 81.0143C8.3131 81.0143 8.3031 81.0053 8.2981 81.0013C8.2441 80.9513 8.1921 80.8993 8.1381 80.8453C8.0151 80.7253 7.8951 80.5963 7.7751 80.4583C7.7611 80.4413 7.7471 80.4253 7.7321 80.4083C7.7281 80.4033 7.7231 80.4003 7.7211 80.3953C7.7091 80.3813 7.6991 80.3683 7.6871 80.3563C7.6791 80.3453 7.6711 80.3373 7.6651 80.3293C7.6411 80.2983 7.6171 80.2703 7.5951 80.2423C7.5651 80.2053 7.5331 80.1663 7.5051 80.1283C7.4861 80.1043 7.4671 80.0813 7.4501 80.0573C7.3921 79.9833 7.3351 79.9033 7.2781 79.8233C7.2401 79.7713 7.2031 79.7163 7.1681 79.6653C7.1361 79.6193 7.1041 79.5713 7.0731 79.5203C7.0431 79.4743 7.0131 79.4273 6.9821 79.3793C6.9721 79.3633 6.9621 79.3453 6.9511 79.3273C6.8501 79.1663 6.7511 78.9963 6.6521 78.8163C6.6301 78.7743 6.6051 78.7313 6.5821 78.6843C6.4831 78.5023 6.3861 78.3073 6.2891 78.1043C6.1311 77.7753 5.9741 77.4153 5.8141 77.0193C5.7761 76.9243 5.7381 76.8273 5.6991 76.7283C5.6671 76.6433 5.6341 76.5553 5.6011 76.4683C5.5671 76.3793 5.5341 76.2893 5.5021 76.1983C5.4041 75.9303 5.3041 75.6493 5.2061 75.3513C4.8311 74.2333 4.4461 72.9053 4.0361 71.3133C1.4891 61.4253 5.0701 40.2963 5.0701 40.2963C5.2791 38.9483 5.4611 37.6483 5.6171 36.3913C5.6381 36.2183 5.6601 36.0453 5.6801 35.8763C5.7431 35.3613 5.8001 34.8553 5.8521 34.3573C5.8571 34.3113 5.8621 34.2653 5.8671 34.2223C5.9021 33.9003 5.9341 33.5783 5.9641 33.2623C6.0241 32.6433 6.0771 32.0353 6.1241 31.4393C6.1511 31.0923 6.1781 30.7473 6.2011 30.4093C6.2291 29.9893 6.2551 29.5783 6.2761 29.1713C6.3051 28.6673 6.3281 28.1743 6.3471 27.6893C6.3491 27.6533 6.3491 27.6193 6.3511 27.5853C6.3641 27.2623 6.3731 26.9473 6.3801 26.6343C6.3991 25.9033 6.4091 25.1933 6.4081 24.5063C6.4081 24.2823 6.4061 24.0583 6.4031 23.8383C6.3991 23.4593 6.3931 23.0863 6.3841 22.7203C6.3641 21.9883 6.3331 21.2823 6.2921 20.6013C6.2711 20.2613 6.2491 19.9273 6.2241 19.5973C6.2201 19.5603 6.2171 19.5223 6.2141 19.4853C6.1991 19.3033 6.1851 19.1263 6.1691 18.9503V18.9473C6.1541 18.7803 6.1391 18.6163 6.1231 18.4553C6.0751 17.9683 6.0211 17.4953 5.9631 17.0343C5.8821 16.4213 5.7971 15.8333 5.7011 15.2713V15.2683C5.6671 15.0663 5.6321 14.8693 5.5961 14.6733C5.5781 14.5753 5.5591 14.4803 5.5431 14.3833C5.5051 14.1903 5.4691 14.0033 5.4291 13.8163C5.3911 13.6303 5.3511 13.4473 5.3111 13.2683C5.2901 13.1763 5.2711 13.0903 5.2511 13.0003C5.1861 12.7153 5.1191 12.4393 5.0491 12.1703C4.9791 11.9023 4.9091 11.6413 4.8371 11.3853C4.8011 11.2583 4.7641 11.1333 4.7271 11.0073C4.6721 10.8233 4.6151 10.6413 4.5591 10.4633C4.5031 10.2863 4.4441 10.1133 4.3871 9.94327C4.3091 9.71527 4.2311 9.49526 4.1511 9.28326C4.0321 8.96226 3.9111 8.65626 3.7881 8.36526C3.5441 7.78426 3.2951 7.25726 3.0461 6.78526C2.9661 6.62926 2.8831 6.47727 2.8001 6.33127C2.6361 6.03727 2.4721 5.76926 2.3131 5.52026C2.1941 5.33426 2.0771 5.16027 1.9611 4.99627C1.3831 4.18327 0.871097 3.65227 0.517097 3.33227C0.355097 3.18627 0.226099 2.99428 0.140099 2.77428C0.0530986 2.55328 0.00610352 2.30326 0.00610352 2.04826C0.00610352 1.42226 0.289104 0.859265 0.728104 0.611265L0.797104 0.570265C1.6011 0.113265 2.4801 -0.0707365 3.3521 0.0312635L12.8581 1.13627H12.8601L14.6981 1.35026C14.6181 1.55826 14.5741 1.79027 14.5731 2.03027V2.04826C14.5731 2.30426 14.6191 2.55328 14.7071 2.77428C14.7951 2.99428 14.9221 3.18627 15.0821 3.33227C17.0501 5.09927 23.8181 13.3283 19.6401 40.2953C19.6401 40.2953 16.0581 61.4253 18.6051 71.3123C19.6741 75.4523 20.5761 77.8023 21.5201 79.3263C22.4021 80.7503 23.3201 81.4563 24.4431 82.2263C24.5231 82.3763 24.6031 82.5203 24.6831 82.6573C24.8611 82.9643 25.0411 83.2403 25.2211 83.4913Z" fill="white" /> </g><g opacity="0.1"> <path d="M52.1389 62.3979L51.0519 71.5019C51.0319 71.6599 51.0119 71.8189 50.9899 71.9759C50.9819 72.0319 50.9739 72.0879 50.9659 72.1429C50.9499 72.2549 50.9329 72.3679 50.9149 72.4779C50.9049 72.5389 50.8949 72.5989 50.8839 72.6599C50.8579 72.8279 50.8279 72.9969 50.7939 73.1639C50.7639 73.3179 50.7339 73.4719 50.7009 73.6229C50.6939 73.6549 50.6879 73.6869 50.6799 73.7199C50.6469 73.8779 50.6099 74.0339 50.5719 74.1909C50.5689 74.2049 50.5639 74.2229 50.5609 74.2379C50.5219 74.3969 50.4809 74.5559 50.4389 74.7109C50.4029 74.8479 50.3659 74.9839 50.3259 75.1189C50.3019 75.2019 50.2779 75.2829 50.2529 75.3669C50.2159 75.4889 50.1779 75.6119 50.1399 75.7349C50.1009 75.8579 50.0599 75.9819 50.0179 76.1009C49.9349 76.3429 49.8499 76.5839 49.7579 76.8209C49.6679 77.0609 49.5719 77.2989 49.4719 77.5329C49.4239 77.6459 49.3749 77.7589 49.3229 77.8699C49.2879 77.9499 49.2519 78.0299 49.2139 78.1099C49.1789 78.1879 49.1439 78.2639 49.1059 78.3389C49.0939 78.3659 49.0819 78.3919 49.0659 78.4189C49.0149 78.5299 48.9599 78.6379 48.9029 78.7459L48.8979 78.7589C48.8509 78.8529 48.8029 78.9449 48.7539 79.0359C48.4319 79.6469 48.0799 80.2289 47.6989 80.7839C47.6349 80.8769 47.5709 80.9679 47.5059 81.0589C47.4369 81.1539 47.3689 81.2469 47.2979 81.3409C47.2929 81.3489 47.2869 81.3549 47.2819 81.3639C47.2249 81.4389 47.1689 81.5109 47.1119 81.5869C47.0819 81.6259 47.0509 81.6669 47.0199 81.7039C46.9659 81.7729 46.9109 81.8399 46.8559 81.9069C46.8379 81.9289 46.8209 81.9489 46.8029 81.9689C46.7459 82.0379 46.6869 82.1079 46.6279 82.1779C46.5509 82.2679 46.4729 82.3549 46.3959 82.4419C46.3709 82.4689 46.3459 82.4949 46.3219 82.5229C45.7509 83.1459 45.0309 83.4909 44.2849 83.4909H12.4979C11.9729 83.4909 11.4549 83.3179 10.9919 82.9929C10.7079 82.7929 10.4389 82.6099 10.1789 82.4359C10.1689 82.4299 10.1599 82.4229 10.1519 82.4169C10.1479 82.4159 10.1449 82.4129 10.1449 82.4129L10.1399 82.4089C10.1259 82.3969 10.1129 82.3899 10.1009 82.3819C10.0669 82.3579 10.0329 82.3349 9.9999 82.3129C9.9749 82.2949 9.9489 82.2759 9.9239 82.2609C9.8879 82.2369 9.8549 82.2129 9.8219 82.1899C9.7819 82.1619 9.73991 82.1349 9.69991 82.1069C9.68891 82.0969 9.6779 82.0919 9.6689 82.0829C9.6519 82.0729 9.6379 82.0629 9.6219 82.0519C9.5819 82.0249 9.54391 81.9969 9.50491 81.9709C9.49591 81.9649 9.4869 81.9559 9.4789 81.9489C9.4689 81.9429 9.4599 81.9359 9.4509 81.9309C9.3019 81.8249 9.1589 81.7189 9.0169 81.6079C9.0169 81.6079 9.0019 81.5949 8.9949 81.5919H8.9929C8.9929 81.5919 8.9909 81.5889 8.9889 81.5879C8.9759 81.5789 8.9629 81.5689 8.9519 81.5589C8.9169 81.5319 8.8819 81.5039 8.8489 81.4779C8.7429 81.3939 8.6399 81.3079 8.5379 81.2179C8.5259 81.2069 8.5119 81.1939 8.4979 81.1809C8.4369 81.1279 8.3749 81.0719 8.3139 81.0129C8.3139 81.0129 8.3039 81.0039 8.2989 80.9999C8.2449 80.9499 8.1929 80.8979 8.1389 80.8439C8.0159 80.7239 7.8959 80.5949 7.7759 80.4569C7.7619 80.4399 7.7479 80.4239 7.7329 80.4069C7.7289 80.4019 7.7239 80.3989 7.7219 80.3939C7.7099 80.3799 7.6999 80.3669 7.6879 80.3549C7.6799 80.3439 7.6719 80.3359 7.6659 80.3279C7.6419 80.2969 7.6179 80.2689 7.5959 80.2409C7.5659 80.2039 7.53391 80.1649 7.50591 80.1269C7.48691 80.1029 7.4679 80.0799 7.4509 80.0559C7.3929 79.9819 7.3359 79.9019 7.2789 79.8219C7.2409 79.7699 7.2039 79.7149 7.1689 79.6639C7.1369 79.6179 7.10491 79.5699 7.07391 79.5189C7.04391 79.4729 7.0139 79.4259 6.9829 79.3779C6.9729 79.3619 6.9629 79.3439 6.9519 79.3259H36.3229C37.0679 79.3259 37.7889 78.9829 38.3609 78.3579C38.3849 78.3309 38.4089 78.3029 38.4329 78.2769C40.9449 75.4919 42.5839 71.5949 43.0919 67.3379L44.1799 58.2349C44.3229 57.0329 44.3739 55.8159 44.3309 54.6019L43.1999 21.9739L42.1229 6.0029C42.1039 5.7389 42.0729 5.47691 42.0289 5.21991C41.9859 4.97691 41.9309 4.73791 41.8639 4.50391L46.1369 5.0009C46.2099 5.0099 46.2839 5.0199 46.3569 5.0349C46.4229 5.0479 46.4889 5.0589 46.5539 5.0769C46.6459 5.0999 46.7369 5.1269 46.8259 5.1559C46.8789 5.1739 46.9349 5.1929 46.9889 5.2169C47.0359 5.2319 47.0799 5.2509 47.1259 5.2729C47.1579 5.2869 47.1909 5.3009 47.2229 5.3159C47.2689 5.3379 47.3129 5.3589 47.3579 5.3819C47.3709 5.3879 47.3829 5.3949 47.3959 5.4019C47.4039 5.4049 47.4129 5.4079 47.4179 5.4149C47.4269 5.4199 47.4349 5.42391 47.4429 5.42891C47.4909 5.45291 47.5369 5.47991 47.5829 5.50891C47.5929 5.51291 47.6029 5.5189 47.6099 5.5249C47.6419 5.5439 47.6729 5.56391 47.7039 5.58591C47.7349 5.60491 47.7669 5.6269 47.7969 5.6479C47.8869 5.7099 47.9749 5.77891 48.0619 5.85091C48.0859 5.86891 48.1119 5.8909 48.1359 5.9129C48.1469 5.9219 48.1579 5.92991 48.1689 5.93991C48.1829 5.95091 48.1939 5.96191 48.2059 5.97391C48.2379 6.00091 48.2689 6.0329 48.3009 6.0629C48.3309 6.0909 48.3579 6.11791 48.3879 6.14691C48.4709 6.22691 48.5509 6.3149 48.6289 6.4039C48.6629 6.4429 48.6959 6.48291 48.7299 6.52591C48.7669 6.56891 48.8039 6.6159 48.8389 6.6649C48.8529 6.6819 48.8659 6.6979 48.8789 6.7169C48.9169 6.7689 48.9539 6.8209 48.9909 6.8719C49.0409 6.9459 49.0879 7.01791 49.1339 7.09491C49.3409 7.42891 49.5159 7.79191 49.6569 8.17491C49.6729 8.21391 49.6879 8.25491 49.7019 8.29691C49.7149 8.33291 49.7279 8.3679 49.7389 8.4059C49.8389 8.7049 49.9189 9.0149 49.9759 9.3329C49.9889 9.4029 50.0009 9.46991 50.0109 9.53891C50.0189 9.58991 50.0269 9.6409 50.0329 9.6929C50.0339 9.7109 50.0379 9.7289 50.0389 9.7449C50.0489 9.8139 50.0559 9.88491 50.0609 9.95291C50.0669 10.0239 50.0749 10.0929 50.0799 10.1639L51.1569 26.1339L52.2869 58.7619C52.3329 59.9799 52.2819 61.1969 52.1389 62.3979Z" fill="black" /> </g><g opacity="0.18"> <path d="M48.3901 6.14935C48.1761 6.04735 47.9561 5.96735 47.7311 5.91435C47.5901 5.87735 47.4481 5.85035 47.3031 5.83435L42.0271 5.22035L16.7571 2.28335L14.5691 2.02936L13.2161 1.87436L4.51608 0.862349C3.64408 0.760349 2.76508 0.94635 1.96208 1.40135L1.89108 1.44336C1.45308 1.69036 1.17007 2.25435 1.17007 2.87935C1.17007 3.13535 1.21808 3.38536 1.30508 3.60736C1.39208 3.82736 1.52008 4.01835 1.68008 4.16435C3.64608 5.93235 10.4181 14.1614 6.23808 41.1273C6.23808 41.1273 2.65708 62.2573 5.20408 72.1443C6.09108 75.5983 6.86708 77.8064 7.64908 79.3264C8.35308 80.7054 9.06308 81.5204 9.86808 82.1894C9.95508 82.2634 10.0461 82.3343 10.1361 82.4053C10.1361 82.4053 10.1451 82.4114 10.1501 82.4154C10.1161 82.3924 10.0811 82.3694 10.0471 82.3464L10.0381 82.3403C10.0031 82.3173 9.96907 82.2933 9.93407 82.2673L9.92208 82.2594C9.87908 82.2314 9.83607 82.2023 9.79507 82.1723C9.75807 82.1483 9.72308 82.1224 9.68808 82.0984C9.65708 82.0764 9.62508 82.0544 9.59508 82.0334L9.58708 82.0274C9.56708 82.0124 9.54608 81.9984 9.52708 81.9844C9.50808 81.9714 9.49308 81.9603 9.47708 81.9503C9.46708 81.9443 9.45808 81.9394 9.44908 81.9304C9.42408 81.9114 9.39608 81.8924 9.37008 81.8744C9.35008 81.8594 9.33008 81.8454 9.31008 81.8314C9.30208 81.8254 9.29308 81.8183 9.28708 81.8123C9.27808 81.8063 9.27008 81.8004 9.26308 81.7944C9.24708 81.7834 9.23108 81.7724 9.21508 81.7604C9.20608 81.7544 9.20008 81.7504 9.20008 81.7504C9.13808 81.7024 9.08308 81.6614 9.03008 81.6204C9.02408 81.6144 9.01508 81.6104 9.01508 81.6104C9.00408 81.5974 8.99708 81.5954 8.99308 81.5914C8.99308 81.5914 8.98908 81.5884 8.98708 81.5874C8.97408 81.5784 8.96108 81.5683 8.95008 81.5583C8.91508 81.5313 8.88008 81.5034 8.84708 81.4774C8.74108 81.3934 8.63808 81.3074 8.53608 81.2174C8.52408 81.2064 8.51008 81.1934 8.49608 81.1804C8.24808 80.9634 8.01008 80.7254 7.77508 80.4564C7.76108 80.4394 7.74708 80.4234 7.73208 80.4064C7.72808 80.4014 7.72308 80.3984 7.72108 80.3934C7.70908 80.3794 7.69908 80.3664 7.68708 80.3544C7.67908 80.3434 7.67108 80.3354 7.66508 80.3274C7.64108 80.2964 7.61708 80.2684 7.59508 80.2404C7.56508 80.2034 7.53308 80.1644 7.50508 80.1264C7.48608 80.1024 7.46708 80.0794 7.45008 80.0554C7.39208 79.9814 7.33508 79.9014 7.27808 79.8214C7.24008 79.7694 7.20308 79.7144 7.16808 79.6634C7.13608 79.6174 7.10407 79.5694 7.07307 79.5184C7.04307 79.4724 7.01308 79.4253 6.98208 79.3773C6.97208 79.3613 6.96208 79.3433 6.95108 79.3253C6.85008 79.1643 6.75108 78.9944 6.65208 78.8144C6.63008 78.7724 6.60508 78.7294 6.58208 78.6824C6.48308 78.5004 6.38608 78.3054 6.28908 78.1024C6.13108 77.7734 5.97408 77.4133 5.81408 77.0173C5.77608 76.9223 5.73808 76.8253 5.69908 76.7263C5.66708 76.6413 5.63408 76.5534 5.60108 76.4664C5.56708 76.3774 5.53408 76.2874 5.50208 76.1964C5.40408 75.9284 5.30408 75.6473 5.20608 75.3493C4.83108 74.2313 4.44608 72.9034 4.03608 71.3114C1.48908 61.4234 5.07008 40.2944 5.07008 40.2944C5.27908 38.9464 5.46108 37.6464 5.61708 36.3894C5.70408 35.6984 5.78108 35.0194 5.85208 34.3554C5.85708 34.3094 5.86208 34.2634 5.86708 34.2204C5.90208 33.8984 5.93408 33.5764 5.96408 33.2604C6.27708 30.0204 6.41108 27.1133 6.40908 24.5043C6.40708 22.4773 6.31907 20.6303 6.17007 18.9483V18.9454C6.05007 17.6174 5.89208 16.3953 5.70208 15.2693V15.2664C5.56508 14.4614 5.41308 13.7054 5.25208 12.9974C5.12008 12.4294 4.98208 11.8924 4.83808 11.3824C4.80208 11.2554 4.76508 11.1303 4.72808 11.0043C4.61608 10.6343 4.50308 10.2794 4.38808 9.93936C4.31008 9.71136 4.23208 9.49136 4.15208 9.27936C4.03308 8.95836 3.91208 8.65236 3.78908 8.36136C3.54508 7.78036 3.29608 7.25335 3.04708 6.78135C2.96708 6.62535 2.88408 6.47336 2.80108 6.32736C2.63708 6.03336 2.47308 5.76536 2.31408 5.51636C2.19508 5.33036 2.07808 5.15635 1.96208 4.99235C1.38408 4.17935 0.872082 3.64835 0.518082 3.32835C0.356082 3.18235 0.227075 2.99035 0.141075 2.77035C0.0540751 2.54935 0.00708008 2.29936 0.00708008 2.04436C0.00708008 1.41836 0.29008 0.855359 0.72908 0.607359L0.79808 0.566359C1.60208 0.109359 2.48108 -0.0746427 3.35308 0.0273573L12.8591 1.13235H12.8611L14.6991 1.34636L16.2731 1.52736L41.8661 4.50235L46.1391 4.99936C46.5141 5.04336 46.8791 5.15036 47.2261 5.31436C47.2931 5.34536 47.3581 5.37636 47.4221 5.41336C47.4821 5.44536 47.5421 5.47836 47.6001 5.51636L47.6151 5.52435C47.6781 5.56335 47.7401 5.60435 47.8031 5.64735C47.8671 5.69335 47.9291 5.73936 47.9911 5.78636C48.0031 5.79736 48.0151 5.80535 48.0261 5.81535C48.0391 5.82435 48.0521 5.83435 48.0641 5.84735C48.1021 5.87535 48.1401 5.90735 48.1751 5.94035C48.1871 5.95135 48.2001 5.96235 48.2131 5.97435C48.2361 5.99435 48.2591 6.01535 48.2831 6.03935C48.2831 6.03935 48.2891 6.04235 48.2931 6.04735C48.3231 6.08235 48.3561 6.11535 48.3901 6.14935Z" fill="white" /> </g></g>`, cork:"", defs:`<linearGradient id="{U}lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6C43A"/><stop offset=".35" stop-color="#FFE07A"/><stop offset=".8" stop-color="#EFB321"/><stop offset="1" stop-color="#C8890B"/></linearGradient><linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B4F8A" stop-opacity="0"/><stop offset=".55" stop-color="#0B4F8A" stop-opacity=".06"/><stop offset="1" stop-color="#0B4F8A" stop-opacity=".2"/></linearGradient>`,
    surfC:[41.5,26.2], yTop:3, yFill:9, yBot:82.5, xTop:[17,66], xBot:[20,61],
    lipR:[67.6,2.2], lipL:[30,4], mouth:[44,4] },
  bottle: { vb:[298,812], shift:[0,0], corkUnder:true,   /* cork drawn under the glass, as in the original art */
    back:`<path d="M28.4434 781.085C28.4434 781.085 45.7134 811.223 151.361 811.223C257.01 811.223 270.893 779.73 270.893 779.73L28.4434 781.085Z" fill="#97AAA3"/><path opacity="0.37" d="M293.581 254.534C286.47 208.821 262.09 189.519 237.709 154.98C213.328 120.441 217.392 74.7284 217.392 74.7284C217.392 74.7284 227.551 74.7283 228.566 66.6013C229.582 58.4743 229.582 46.2843 224.503 43.2363C219.424 40.1893 204.186 39.1733 204.186 39.1733C204.186 39.1733 214.833 51.3634 148.803 51.3634C82.7733 51.3634 93.4203 39.1733 93.4203 39.1733C93.4203 39.1733 78.1823 40.1893 73.1033 43.2363C68.0243 46.2843 68.0243 58.4743 69.0403 66.6013C70.0563 74.7283 80.2143 74.7284 80.2143 74.7284C80.2143 74.7284 84.2773 120.441 59.8973 154.98C35.5173 189.519 11.1363 208.82 4.0253 254.534C-3.0857 300.248 0.97731 700.494 3.00931 727.922C5.04131 755.35 16.2153 776.683 28.4053 784.81C40.5953 792.937 135.07 797 135.07 797H162.536C162.536 797 257.01 792.937 269.201 784.81C281.391 776.683 292.566 755.35 294.597 727.922C296.629 700.494 300.692 300.248 293.581 254.534Z" fill="#D7E5FF"/>`, milk:`<path d="M84,52 L214,52 L219,80 L224,127 L248,169 L277,209 L292,255 L294,300 L294,745 L268,784 L219,791 L149,794 L78,791 L28,784 L6,739 L4,300 L6,249 L23,204 L53,165 L75,121 L80,80 Z" fill="url(#{U}p2_linear_13_9981)"/>`, surf:`<path d="M3.05782 257.164C7.15551 235.409 103.341 235 148.036 235C192.731 235 294 234.969 294 258.255C294 281.54 -1.74282 282.653 3.05782 257.164Z" fill="url(#{U}p6_linear_13_9981)"/>`, front:`<path opacity="0.48" d="M165.584 86.9182V150.917L190.981 153.965L182.515 86.2412L165.584 86.9182Z" fill="url(#{U}p3_linear_13_9981)"/><path opacity="0.48" d="M115.807 142.79C115.807 142.79 75.1727 231.169 76.1887 243.36C77.2047 255.55 84.3156 261.645 84.3156 261.645C84.3156 261.645 122.919 229.138 156.442 231.169L152.379 153.964C152.377 153.965 125.965 148.885 115.807 142.79Z" fill="url(#{U}p4_linear_13_9981)"/><path opacity="0.48" d="M211.297 250.471C211.297 250.471 235.677 282.978 239.741 312.438L259.042 310.406C259.042 310.406 250.915 261.645 233.646 248.439L211.297 250.471Z" fill="url(#{U}p5_linear_13_9981)"/><path opacity="0.19" d="M150.347 60.5062C87.3642 60.5062 75.8753 51.1023 69.9843 47.5883C68.3123 52.1743 68.3413 58.8642 68.7463 63.7422C68.9473 66.1572 69.0703 67.8682 69.9353 69.5162C71.0513 71.6462 73.0413 73.0242 75.3443 73.8342C77.3953 74.5632 78.9893 74.6382 80.2133 74.7292C80.2133 74.7292 152.715 91.3212 217.391 74.7292C219.241 74.2542 221.045 73.9123 222.72 73.6643C225.349 72.6333 228.065 70.6043 228.565 66.6033C229.581 58.4763 229.581 46.2863 224.502 43.2383C224.504 43.2363 220.441 60.5062 150.347 60.5062Z" fill="url(#{U}p7_linear_13_9981)"/><path opacity="0.19" d="M209.265 76.7603C209.265 76.7603 210.281 124.505 225.519 149.902C240.757 175.298 265.137 194.6 276.312 229.139C287.486 263.678 285.455 362.216 285.455 362.216L273.265 357.137C273.265 357.137 278.411 261.466 262.091 227.108C242.79 186.474 212.314 162.093 206.219 138.729C200.124 115.364 199.785 78.4552 199.785 78.4552L209.265 76.7603Z" fill="url(#{U}p8_linear_13_9981)"/><path opacity="0.19" d="M85.3308 75.7441C85.3308 75.7441 90.4098 121.457 66.0298 155.996C41.6498 190.535 21.3318 214.915 14.2208 240.312C7.10977 265.708 9.1418 332.755 9.1418 332.755L19.3008 354.088C19.3008 354.088 17.2688 264.693 23.3638 241.328C29.4588 217.963 67.0458 177.329 79.2358 153.965C91.4258 130.6 91.4258 76.7601 91.4258 76.7601L85.3308 75.7441Z" fill="url(#{U}p9_linear_13_9981)"/>`, cork:`<path d="M97.9258 89.9662L89.7578 8.69824C89.7578 8.69824 93.8418 0.571289 148.973 0.571289C204.105 0.571289 209.209 9.71423 209.209 9.71423L199 86.9192C199 86.9192 196.294 99.1093 149.33 99.1093C105.429 99.1093 97.9258 89.9662 97.9258 89.9662Z" fill="url(#{U}p0_linear_13_9981)"/><path d="M89.7592 8.69818C90.7032 14.8052 206.662 19.0112 209.211 9.71417C212.273 -1.46083 87.7172 -4.50882 89.7592 8.69818Z" fill="#DFC9B2"/><path d="M126.643 65.9243C122.579 67.6173 127.32 75.7444 130.029 73.7124C132.739 71.6804 126.643 65.9243 126.643 65.9243Z" fill="#967653"/><path d="M144.588 75.0674C141.879 76.7604 141.879 81.1624 144.588 81.8394C147.297 82.5164 152.376 82.5164 152.715 79.4694C153.054 76.4214 144.588 75.0674 144.588 75.0674Z" fill="#967653"/><path d="M163.89 64.5693C161.52 65.5853 163.551 68.2943 165.583 68.9713C167.615 69.6483 166.599 74.0504 166.599 74.0504C166.599 74.0504 172.356 71.6803 172.356 69.3093C172.356 66.9403 163.89 64.5693 163.89 64.5693Z" fill="#967653"/><path d="M127.998 85.2253C126.163 85.7753 127.659 90.3043 129.014 89.9663C130.368 89.6273 131.384 84.2093 127.998 85.2253Z" fill="#967653"/><path d="M120.547 83.5325C118.555 83.9305 117.161 88.2735 119.193 88.9505C121.225 89.6275 122.24 83.1935 120.547 83.5325Z" fill="#967653"/><path d="M185.563 80.4844C183.559 80.1504 183.87 84.2093 186.24 84.5473C188.61 84.8863 187.595 80.8234 185.563 80.4844Z" fill="#967653"/><path d="M101.586 19.8721C97.5232 21.5651 102.263 29.6922 104.972 27.6602C107.681 25.6282 101.586 19.8721 101.586 19.8721Z" fill="#967653"/><path d="M123.255 29.0151C118.853 29.0151 116.821 34.7711 119.869 35.7871C122.917 36.8031 120.546 42.8982 122.239 43.2372C123.932 43.5762 131.382 41.2051 131.72 37.4811C132.059 33.7551 123.255 29.0151 123.255 29.0151Z" fill="#967653"/><path d="M152.715 23.2583C150.006 24.9513 150.006 29.3533 152.715 30.0303C155.424 30.7073 160.503 30.7073 160.842 27.6603C161.18 24.6133 152.715 23.2583 152.715 23.2583Z" fill="#967653"/><path d="M177.435 33.0781C175.065 34.0941 177.096 36.8031 179.128 37.4801C181.16 38.1571 180.144 42.5591 180.144 42.5591C180.144 42.5591 185.901 40.1891 185.901 37.8181C185.901 35.4481 177.435 33.0781 177.435 33.0781Z" fill="#967653"/><path d="M185.563 19.8721C183.87 20.5491 180.822 22.2422 181.499 23.2582C182.176 24.2742 182.515 27.9992 185.224 26.9832C187.933 25.9672 185.563 19.8721 185.563 19.8721Z" fill="#967653"/><path d="M158.472 38.4961C156.779 38.8351 154.07 42.8982 156.44 43.9142C158.811 44.9302 158.472 38.4961 158.472 38.4961Z" fill="#967653"/><path d="M195.72 28.6765C193.885 29.2265 195.381 33.7555 196.736 33.4175C198.091 33.0785 199.107 27.6605 195.72 28.6765Z" fill="#967653"/><path d="M111.405 33.7551C109.413 34.1531 108.019 38.496 110.051 39.173C112.082 39.85 113.098 33.4171 111.405 33.7551Z" fill="#967653"/><path d="M125.287 20.5493C123.283 20.2153 123.594 24.2744 125.964 24.6124C128.334 24.9504 127.319 20.8883 125.287 20.5493Z" fill="#967653"/>`,
    defs:`<linearGradient id="{U}p0_linear_13_9981" x1="174.989" y1="119.049" x2="148.689" y2="34.0788" gradientUnits="userSpaceOnUse"> <stop stop-color="#FBB03B"/> <stop offset="1" stop-color="#C69C6D"/> </linearGradient> <linearGradient id="{U}p1_linear_13_9981" x1="-28.9285" y1="480.281" x2="318.476" y2="658.554" gradientUnits="userSpaceOnUse"> <stop offset="0.0054" stop-color="#FFFCFF"/> <stop offset="1" stop-color="#CCCCCC"/> </linearGradient> <linearGradient id="{U}p2_linear_13_9981" x1="-29.0268" y1="393.484" x2="349.285" y2="545.777" gradientUnits="userSpaceOnUse"> <stop offset="0.0054" stop-color="#FFFCFF"/> <stop offset="1" stop-color="#CCCCCC"/> </linearGradient> <linearGradient id="{U}p3_linear_13_9981" x1="178.283" y1="133.986" x2="178.283" y2="142.79" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1" stop-color="white"/> </linearGradient> <linearGradient id="{U}p4_linear_13_9981" x1="131.606" y1="210.447" x2="139.394" y2="212.479" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1" stop-color="white"/> </linearGradient> <linearGradient id="{U}p5_linear_13_9981" x1="211.297" y1="280.439" x2="259.042" y2="280.439" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1" stop-color="white"/> </linearGradient> <linearGradient id="{U}p6_linear_13_9981" x1="372.764" y1="282.94" x2="75.0658" y2="252.152" gradientUnits="userSpaceOnUse"> <stop offset="0.0054" stop-color="#FFFCFF"/> <stop offset="1" stop-color="#CCCCCC"/> </linearGradient> <linearGradient id="{U}p7_linear_13_9981" x1="41.4854" y1="41.2171" x2="145.098" y2="57.978" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1"/> </linearGradient> <linearGradient id="{U}p8_linear_13_9981" x1="305.969" y1="443.631" x2="198.942" y2="13.5012" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1"/> </linearGradient> <linearGradient id="{U}p9_linear_13_9981" x1="91.9904" y1="405.18" x2="18.8487" y2="53.6943" gradientUnits="userSpaceOnUse"> <stop stop-color="white"/> <stop offset="1"/> </linearGradient>`,
    poly:[[84,52],[214,52],[219,80],[224,127],[248,169],[277,209],[292,255],[294,300],[294,745],[268,784],[219,791],[149,794],[78,791],[28,784],[6,739],[4,300],[6,249],[23,204],[53,165],[75,121],[80,80]],
    surfC:[149,259], yTop:52, yFill:62, yBot:794, xTop:[84,214], xBot:[4,294],   /* full = up into the neck */
    lipR:[228,46], lipL:[70,46], mouth:[149,46] }
};

/* ---------- [page 4] REAL POUR — supplied art vessels + frame-driven pour + synthesized sound ----------
   capArtVessel: the ASSETE MAP art with its milk clipped to a live level. The clip plane is kept
   WORLD-horizontal while the vessel tips (the liquid slides to the lip instead of tilting with the
   glass), the surface ellipse narrows with the taper and wobbles while liquid lands.
   capRealPour: one requestAnimationFrame timeline — lift & start tipping on the way, tip further as it
   empties, curved stream with a falling tail + splash droplets, set back down with a clink. */
/* [page 11] shop bottle top: an open, dark mouth on the rim (reads as an EMPTY bottle waiting to be filled)
   and a cork that drops into the neck once the bottle is full. Drawn in the art's own (Figma) coordinates. */
function capShopTop(v, key){
  const A = CAP_SHOP_ART[key], NS = "http://www.w3.org/2000/svg", g = v.el.querySelector("svg > g");
  const cx = (A.xTop[0] + A.xTop[1]) / 2, half = (A.xTop[1] - A.xTop[0]) / 2, top = A.yTop, rx = half * 0.72, u = "st" + (++_capUid);
  const defs = v.el.querySelector("svg > defs");
  defs.insertAdjacentHTML("beforeend",
    `<radialGradient id="${u}m" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#23282E"/><stop offset=".7" stop-color="#474E56"/><stop offset="1" stop-color="#7C848C"/></radialGradient>` +
    `<linearGradient id="${u}c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B9793A"/><stop offset=".35" stop-color="#E7B774"/><stop offset=".7" stop-color="#D59E58"/><stop offset="1" stop-color="#A86A30"/></linearGradient>`);
  const mouth = document.createElementNS(NS, "g"); mouth.setAttribute("class", "cap-shop-mouth");
  mouth.innerHTML = `<ellipse cx="${cx}" cy="${top + 1.6}" rx="${rx}" ry="${(rx * 0.16).toFixed(2)}" fill="url(#${u}m)"/>` +
    `<path d="M${cx - rx},${top + 1.6} A${rx},${(rx * 0.16).toFixed(2)} 0 0 0 ${cx + rx},${top + 1.6}" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="${(half * 0.05).toFixed(2)}"/>`;
  g.appendChild(mouth);
  // cork: slightly tapered plug, under the glass (the rim is drawn over its lower part, so it sits IN the neck)
  const h = half * 0.8, wb = rx * 1.04, wt = rx * 1.2, y0 = top - h * 0.62, y1 = top + h * 0.38, ry = wt * 0.18;
  const cork = document.createElementNS(NS, "g"); cork.setAttribute("class", "cap-shop-cork"); cork.style.display = "none";
  let dots = ""; for(let i = 0; i < 7; i++){ const fx = ((i * 37) % 11) / 11 - 0.5, fy = ((i * 53) % 7) / 7;
    dots += `<circle cx="${(cx + fx * wb * 1.5).toFixed(1)}" cy="${(y0 + ry + fy * (y1 - y0 - ry * 1.5)).toFixed(1)}" r="${(half * (0.035 + (i % 3) * 0.012)).toFixed(2)}" fill="#8A5626" opacity=".55"/>`; }
  cork.innerHTML = `<path d="M${cx - wt},${y0} L${cx + wt},${y0} L${cx + wb},${y1} A${wb},${ry * 0.8} 0 0 1 ${cx - wb},${y1} Z" fill="url(#${u}c)" stroke="#8F5A28" stroke-width="${(half * 0.03).toFixed(2)}"/>` +
    dots + `<ellipse cx="${cx}" cy="${y0}" rx="${wt}" ry="${ry}" fill="#F1CD93" stroke="#A56C35" stroke-width="${(half * 0.03).toFixed(2)}"/>` +
    `<ellipse cx="${cx - wt * 0.2}" cy="${y0 - ry * 0.1}" rx="${wt * 0.45}" ry="${ry * 0.45}" fill="#FBE3B8" opacity=".7"/>`;
  g.insertBefore(cork, g.firstChild);
  return {
    // put the cork in: animated (drops from above with a little bounce + pop) or instant
    cork(anim){ mouth.style.display = "none"; cork.style.display = "";
      if(!anim){ cork.removeAttribute("transform"); return; }
      const D = 520, lift = h * 3.2; let t0 = null;
      const fr = (now)=>{ if(t0 == null) t0 = now; const p = Math.min(1, (now - t0) / D);
        const e = p < 0.7 ? Math.pow(p / 0.7, 2) : 1 - Math.sin((p - 0.7) / 0.3 * Math.PI) * 0.08;   // fall, then a small settle
        cork.setAttribute("transform", `translate(0 ${(-lift * (1 - e)).toFixed(2)})`);
        if(p < 1) requestAnimationFrame(fr); else cork.removeAttribute("transform"); };
      requestAnimationFrame(fr); setTimeout(()=>{ try{ capSfxPop(true); }catch(e){} }, D * 0.7); },
    // take the cork out: it lifts up out of the neck and fades, leaving the open mouth
    uncork(){ const D = 480, lift = h * 3.4; let t0 = null; cork.style.display = "";
      setTimeout(()=>{ try{ capSfxPop(false); }catch(e){} }, 60);
      const fr = (now)=>{ if(t0 == null) t0 = now; const p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 2);
        cork.setAttribute("transform", `translate(0 ${(-lift * e).toFixed(2)})`); cork.style.opacity = (1 - Math.max(0, p - 0.45) / 0.55).toFixed(3);
        if(p > 0.25) mouth.style.display = "";
        if(p < 1) requestAnimationFrame(fr); else { cork.style.display = "none"; cork.style.opacity = ""; cork.removeAttribute("transform"); } };
      requestAnimationFrame(fr); },
    open(){ mouth.style.display = ""; cork.style.display = "none"; } };
}
function capArtVessel(kind, o){
  o = o || {};
  const A = (o.art || CAP_ART)[kind], u = "ca" + (++_capUid), [vw, vh] = A.vb, [sx, sy] = A.shift;
  const w = o.w, s = w / vw, h = Math.round(vh * s);
  const T = (str)=> String(str || "").split("{U}").join(u);
  const el = document.createElement("div"); el.className = "cap-v cap-art cap-art-" + kind;
  el.style.width = w + "px"; el.style.height = h + "px";
  el.innerHTML = `<svg viewBox="0 0 ${vw} ${vh}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${T(A.defs)}` +
    `<clipPath id="${u}lv"><rect class="cap-lv" x="-4000" y="0" width="8000" height="8000"/></clipPath></defs>` +
    `<g transform="translate(${sx} ${sy})">${A.corkUnder ? `<g class="cap-cork">${T(A.cork)}</g>` : ""}${T(A.back)}<g class="cap-milk" clip-path="url(#${u}lv)">${T(A.milk)}</g>` +
    `<g class="cap-surf">${T(A.surf)}</g>${T(A.front)}${A.corkUnder ? "" : `<g class="cap-cork">${T(A.cork)}</g>`}</g></svg>`;   // corkUnder: the cork sits IN the neck (glass drawn over it)
  const lv = el.querySelector(".cap-lv"), milk = el.querySelector(".cap-milk"), surf = el.querySelector(".cap-surf");
  const H = A.yBot - A.yTop, cx = (A.xTop[0] + A.xTop[1]) / 2, wTop = A.xTop[1] - A.xTop[0], wBot = A.xBot[1] - A.xBot[0];
  const O = [cx, A.yBot];   // rotation reference for the clip plane (any fixed point works)
  // inside outline used for volume + surface width: A.poly if the art supplies one, else a trapezoid
  const quad = A.poly || [[A.xTop[0], A.yTop], [A.xTop[1], A.yTop], [A.xBot[1], A.yBot], [A.xBot[0], A.yBot]];
  const widthAt = y => { const xs = [];   // inside width of the (upright) outline at height y
    for(let i = 0; i < quad.length; i++){ const p = quad[i], q = quad[(i + 1) % quad.length];
      if((p[1] - y) * (q[1] - y) <= 0 && p[1] !== q[1]) xs.push(p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1])); }
    return xs.length > 1 ? Math.max(...xs) - Math.min(...xs) : 0; };
  const W0 = widthAt(A.surfC[1]) || wTop;
  // VOLUME-TRUE level: the liquid plane is placed so the AREA of the vessel's inside below it stays
  // level x capacity at every tilt (a height fraction made the water grow/shrink as the jug tipped).
  const area = pts => { let a = 0; for(let i = 0; i < pts.length; i++){ const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
  const below = (pts, cut) => { const out = [];   // clip polygon to the half-plane y >= cut
    for(let i = 0; i < pts.length; i++){ const p = pts[i], q = pts[(i + 1) % pts.length], pi = p[1] >= cut, qi = q[1] >= cut;
      if(pi) out.push(p);
      if(pi !== qi){ const t = (cut - p[1]) / (q[1] - p[1]); out.push([p[0] + (q[0] - p[0]) * t, cut]); } }
    return out.length > 2 ? area(out) : 0; };
  const rot = (th) => { const c = Math.cos(th), sn = Math.sin(th);
    return quad.map(p => [(p[0] - O[0]) * c - (p[1] - O[1]) * sn, (p[0] - O[0]) * sn + (p[1] - O[1]) * c]); };
  // the mouth = the outline's top edge; a tipped vessel can never hold liquid above its lowest mouth point
  const MOUTH = quad.map((p, i) => p[1] <= A.yTop + 0.5 ? i : -1).filter(i => i >= 0);
  const TOT = area(quad), FULL = below(rot(0), (A.yFill != null ? A.yFill : A.yTop) - O[1]) / TOT;   // "full" = the art's fill line
  const loc = p => [(p[0] + sx), (p[1] + sy)];   // art units → viewBox units
  const v = { el, kind, w, h, s, x: 0, y: 0, level: o.level || 0, angle: 0, wob: 0, liquid: o.liquid || "milk",
    def: { lipR: loc(A.lipR), lipL: loc(A.lipL), mouth: loc(A.mouth) },
    place(x, y){ this.x = x; this.y = y; el.style.left = x + "px"; el.style.top = y + "px"; return this; },
    render(){
      if(A.mouthFill){   // opaque vessel: the liquid can only be seen in its opening — grow it there
        const m = A.mouthFill, L = Math.max(0, Math.min(1, this.level)), k = 0.45 + 0.55 * L, sw = 1 + this.wob * 0.6;
        milk.style.display = L > 0.004 ? "" : "none";
        milk.setAttribute("transform", `translate(${m.cx} ${m.cy + (1 - L) * m.ry * 0.7}) scale(${k.toFixed(4)} ${(k * sw).toFixed(4)}) translate(${-m.cx} ${-m.cy})`);
        milk.style.opacity = Math.max(0, Math.min(1, 1 - (Math.abs(this.angle) - 55) / 30)).toFixed(3);   // tipped past sideways: the opening turns away
        surf.style.opacity = "0"; return this; }
      const L = Math.max(0, Math.min(1, this.level)), pts = rot(this.angle * Math.PI / 180);
      let want = L * FULL * TOT;
      // tipped: the surface stops at the lip (the rest has already run out) — never a slab cut off by the mouth
      if(this.angle && MOUTH.length){ const mY = Math.max(...MOUTH.map(i => pts[i][1])); want = Math.min(want, below(pts, mY)); }
      const ys = pts.map(p => p[1]); let lo = Math.min(...ys), hi = Math.max(...ys);
      for(let i = 0; i < 22; i++){ const mid = (lo + hi) / 2; if(below(pts, mid) > want) lo = mid; else hi = mid; }
      const plane = (lo + hi) / 2;
      lv.setAttribute("x", O[0] - 4000); lv.setAttribute("y", O[1] + plane);
      lv.setAttribute("transform", `rotate(${-this.angle} ${O[0]} ${O[1]})`);
      milk.style.display = L > 0.004 ? "" : "none";
      const ySurf = O[1] + plane, k = A.poly ? (widthAt(Math.min(A.yBot - 0.5, ySurf)) / W0 || 0.01)
                                            : (wTop + (wBot - wTop) * Math.max(0, (ySurf - A.yTop) / H)) / wTop;
      const tiltFade = Math.max(0, 1 - Math.abs(this.angle) / 14);
      surf.style.opacity = (L > 0.01 ? tiltFade : 0).toFixed(3);
      surf.setAttribute("transform", `translate(${cx} ${ySurf}) scale(${k.toFixed(4)} ${(1 + this.wob).toFixed(4)}) translate(${-cx} ${-A.surfC[1]})`);
      return this; },
    set(level){ this.level = level; return this.render(); },   // instant (the pour timeline animates it)
    mouth(){ return [this.x + this.def.mouth[0] * s, this.y + this.def.mouth[1] * s]; },
    hull(){ return (A.hull || A.poly || quad).map(p => [(p[0] + sx) * s, (p[1] + sy) * s]); },   // painted outline (+ handle), element px
    surfaceY(level){ if(A.mouthFill){ const m = A.mouthFill; return this.y + (m.cy + (1 - level) * m.ry * 0.7 + sy) * s; }
      const pts = rot(0), want = level * FULL * TOT; let lo = A.yTop - O[1], hi = 0;
      for(let i = 0; i < 22; i++){ const mid = (lo + hi) / 2; if(below(pts, mid) > want) lo = mid; else hi = mid; }
      return this.y + (O[1] + (lo + hi) / 2 + sy) * s; },
    center(){ return [this.x + w / 2, this.y + h / 2]; },
    /* cap / cork: popped off, it becomes its OWN object resting beside the vessel, so it stays still
       while the vessel moves and tips; at the end it flies back onto the (upright, home) neck. */
    cork(on){ const g = el.querySelector(".cap-cork"); if(!g || !A.cork) return;
      capSfxPop(on);
      if(!on){
        if(this._capF) return;
        g.style.visibility = "hidden";
        const f = document.createElement("div");
        f.className = "cap-v cap-art cap-art-" + kind + " cap-float";
        f.style.cssText = `left:${this.x}px;top:${this.y}px;width:${w}px;height:${h}px;pointer-events:none;`;
        f.innerHTML = `<svg viewBox="0 0 ${vw} ${vh}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
          `<g transform="translate(${sx} ${sy})"><g class="cap-cork off">${T(A.cork)}</g></g></svg>`;   // gradients resolve to the vessel's defs
        if(kind === "bottle") el.parentNode.insertBefore(f, el); else el.parentNode.appendChild(f);   // page 4: the cork rests BEHIND the bottle
        this._capF = f;
      } else {
        const f = this._capF; if(!f){ g.style.visibility = ""; return; }
        const cg = f.querySelector(".cap-cork"); cg.classList.remove("off"); void cg.getBoundingClientRect(); cg.classList.add("on");
        setTimeout(()=>{ g.style.visibility = ""; f.remove(); if(this._capF === f) this._capF = null; }, 860);
      } }
  };
  return v.render();
}

/* ---- synthesized sound (WebAudio; no files). Pour = band-passed noise + resonant "glugs" whose
   pitch rises as the receiving vessel fills (the shrinking air column — what a real bottle does). */
function _capNoise(c){
  if(_capNoise.b && _capNoise.b.sampleRate === c.sampleRate) return _capNoise.b;
  const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); let last = 0;
  for(let i = 0; i < n; i++){ const wv = Math.random() * 2 - 1; last = (last + 0.02 * wv) / 1.02; d[i] = wv * 0.55 + last * 3.2; }
  return (_capNoise.b = b);
}
function _capSfxOk(){ const c = _ac(); return (c && !(typeof isMuted !== "undefined" && isMuted)) ? c : null; }
/* capSfxPour: the recorded pour (assets/Audio/sfx_pour.mp3, from pouring.mp3). Each pour plays a different
   stretch of the 11 s recording for exactly the pour's length, fading in/out with the stream; the pitch rises a
   little as the vessel fills. Falls back to the synthesized pour if the file can't play. */
const CAP_POUR_SRC = "assets/Audio/sfx_pour." + AUDIO_EXT, CAP_POUR_LEN = 11.0;
let _capPourA = null, _capPourOk = true;
function capSfxPour(ms, fill0, fill1, liquid){
  if(typeof isMuted !== "undefined" && isMuted) return;
  if(!_capPourOk) return capSfxPourSynth(ms, fill0, fill1, liquid);
  try{
    if(_capPourA){ _capPourA.pause(); }
    const a = new Audio(CAP_POUR_SRC); _capPourA = a;
    const D = ms / 1000, start = Math.random() * Math.max(0.1, CAP_POUR_LEN - D - 0.3);
    a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false;
    a.volume = 0; a.playbackRate = 0.96 + 0.08 * fill0;
    let t0 = null, raf = 0;
    const tick = (now)=>{ if(_capPourA !== a) return; if(t0 == null) t0 = now;
      const p = (now - t0) / ms;
      if(p >= 1.08){ a.pause(); return; }
      const fade = Math.min(1, p / 0.12, Math.max(0, (1.08 - p) / 0.2));
      a.volume = Math.max(0, Math.min(1, 0.85 * fade));
      try{ a.playbackRate = 0.96 + 0.08 * (fill0 + (fill1 - fill0) * Math.min(1, p)) + (liquid === "oil" ? -0.1 : 0); }catch(e){}
      raf = requestAnimationFrame(tick); };
    a.addEventListener("loadedmetadata", ()=>{ try{ a.currentTime = start; }catch(e){} }, { once: true });
    a.onerror = ()=>{ _capPourOk = false; if(_capPourA === a){ _capPourA = null; capSfxPourSynth(ms, fill0, fill1, liquid); } };
    a.play().then(()=> requestAnimationFrame(tick)).catch(()=>{ if(_capPourA === a){ _capPourA = null; capSfxPourSynth(ms, fill0, fill1, liquid); } });
  }catch(e){ capSfxPourSynth(ms, fill0, fill1, liquid); }
}
function capSfxPourSynth(ms, fill0, fill1, liquid){
  const c = _capSfxOk(); if(!c) return; const t = c.currentTime, D = ms / 1000;
  const oil = liquid === "oil", F0 = oil ? 250 : 380, GAP = oil ? 0.13 : 0.07;   // oil: thicker, lower, slower glugs
  try{
    const src = c.createBufferSource(); src.buffer = _capNoise(c); src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.8;
    bp.frequency.setValueAtTime(F0 + 900 * fill0, t); bp.frequency.linearRampToValueAtTime(F0 + 900 * fill1, t + D);
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3400;
    const trem = c.createGain(); trem.gain.value = 0.75;
    const lfo = c.createOscillator(); lfo.frequency.value = 11; const lg = c.createGain(); lg.gain.value = 0.25; lfo.connect(lg).connect(trem.gain);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.20, t + 0.12);
    g.gain.setValueAtTime(0.20, t + Math.max(0.14, D - 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.15);
    src.connect(bp).connect(lp).connect(trem).connect(g).connect(c.destination);
    src.start(t); src.stop(t + D + 0.25); lfo.start(t); lfo.stop(t + D + 0.25);
    for(let k = t + 0.1; k < t + D - 0.08; k += GAP + Math.random() * 0.12){
      const p = (k - t) / D, f = ((oil ? 170 : 240) + 560 * (fill0 + (fill1 - fill0) * p)) * (0.9 + Math.random() * 0.2);
      const o = c.createOscillator(), og = c.createGain(); o.type = "sine";
      o.frequency.setValueAtTime(f * 0.8, k); o.frequency.exponentialRampToValueAtTime(f * 1.3, k + 0.05);
      og.gain.setValueAtTime(0.0001, k); og.gain.exponentialRampToValueAtTime(0.055, k + 0.008); og.gain.exponentialRampToValueAtTime(0.0001, k + 0.06);
      o.connect(og).connect(c.destination); o.start(k); o.stop(k + 0.07);
    }
  }catch(e){}
}
function capSfxPop(on){
  const c = _capSfxOk(); if(!c) return; const t = c.currentTime;
  try{
    const o = c.createOscillator(), g = c.createGain(); o.type = "sine";
    o.frequency.setValueAtTime(on ? 260 : 820, t); o.frequency.exponentialRampToValueAtTime(on ? 140 : 190, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.24, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.14);
    const n = c.createBufferSource(); n.buffer = _capNoise(c); const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1800;
    const ng = c.createGain(); ng.gain.setValueAtTime(0.12, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    n.connect(hp).connect(ng).connect(c.destination); n.start(t); n.stop(t + 0.05);
  }catch(e){}
}
function capSfxFull(){   // a soft bright "ting" when a glass is full
  const c = _capSfxOk(); if(!c) return; const t = c.currentTime;
  try{ [[1319, 0], [1760, 0.07]].forEach(([f, d])=>{ const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.45);
    o.connect(g).connect(c.destination); o.start(t + d); o.stop(t + d + 0.5); }); }catch(e){}
}
function capSfxStep(vol){   // a soft footstep while a customer walks in (a low thud + a little scuff)
  const c = _capSfxOk(); if(!c) return; const t = c.currentTime; vol = vol == null ? 1 : vol;
  try{ const n = c.createBufferSource(); n.buffer = _capNoise(c); const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = .8;
    const ng = c.createGain(); ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.05 * vol, t + 0.01); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    n.connect(bp).connect(ng).connect(c.destination); n.start(t, Math.random()); n.stop(t + 0.08); }catch(e){}
  try{ const o = c.createOscillator(), g = c.createGain(); o.type = "sine";
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 * vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.12); }catch(e){}
}
function capSfxClink(){
  const c = _capSfxOk(); if(!c) return; const t = c.currentTime;
  try{ [2350, 3720, 5100].forEach((f, i)=>{ const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045 / (i + 1), t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28 - i * 0.05);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.3); }); }catch(e){}
}

/* capArtHome: set a vessel left mid-air by chained (o.stay) pours back in its place, with a clink */
function capArtHome(ctx, src, onDone){
  const F = src._pose || { x: 0, y: 0, a: 0, l: 0 }, D = 760; let t0 = null, clinked = false;
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const frame = (now)=>{ if(!ctx.alive()) return; if(t0 == null) t0 = now;
    const p = Math.min(1, (now - t0) / D), k = 1 - ease(p);
    src.angle = F.a * k; src.el.style.transform = `translate(${F.x * k}px,${F.y * k - F.l * k}px) rotate(${src.angle}deg)`; src.render();
    if(!clinked && p > 0.92){ clinked = true; capSfxClink(); }
    if(p < 1) requestAnimationFrame(frame);
    else { src._pose = null; src.angle = 0; src.el.style.transform = ""; src.el.classList.remove("pouring"); src.render(); if(onDone) onDone(); } };
  requestAnimationFrame(frame);
}
/* capRealPour(ctx, src, dst, {dir, srcTo, dstFrom, dstTo, ms, onDone}) — src/dst are capArtVessels */
function capRealPour(ctx, src, dst, o){
  o = o || {};
  const dir = o.dir || 1, s = src.s, lip = dir > 0 ? src.def.lipR : src.def.lipL, ox = lip[0] * s, oy = lip[1] * s;
  const stage = src.el.parentNode, POUR = o.ms || 1700;
  const [mx, my] = dst.mouth();
  const P = [mx - dir * (o.dx != null ? o.dx : 16), my - (o.gap != null ? o.gap : 40)];   // where the lip sits while pouring
  const tx = P[0] - ox - src.x, ty = P[1] - oy - src.y;
  // tilt: o.tilt = [first flow, emptied] (a full jug needs little tilt, a near-empty one a lot)
  const A2 = dir * (o.tilt ? o.tilt[0] : 88), A3 = dir * (o.tilt ? o.tilt[1] : 122);
  const A1 = o.high ? A2 - dir * 6 : dir * Math.min(45, Math.abs(A2) * 0.6);
  const F = src._pose || { x: 0, y: 0, a: 0, l: 0 };                  // start pose (o.stay chains pours)
  // geometry from the vessel's PAINTED outline when it has one (an svg's empty margin must not count)
  const HULL = src.hull ? src.hull() : [[0, 0], [src.w, 0], [0, src.h], [src.w, src.h]];
  const offs = a => { const r = a * Math.PI / 180; return HULL.map(([cx, cy]) => (cx - ox) * Math.sin(r) + (cy - oy) * Math.cos(r)); };
  const lowAt = a => Math.max(...offs(a)), highAt = a => Math.min(...offs(a));
  // o.high (a vessel much taller than the glass): the lip is held just high enough that the vessel's
  // lowest corner clears the glass rim at the current tilt — high for the full first pour, lowering as
  // it tips further. Keeps a big jug off the glass and off the title above.
  const clearY = a => Math.min(my - 38, dst.y - lowAt(a) - 8);
  // o.behind: the source pours from BEHIND the destination (drawn under it), lip just above its mouth
  const Py0 = o.behind ? my - 22 : o.high ? clearY(A2) : P[1], Py1 = o.behind ? my - 14 : o.high ? clearY(A3) : P[1];
  const tyAt = py => py - oy - src.y;
  const lift = Math.max(0, Py0 + lowAt(A1) - dst.y + (o.high ? 8 : 10));
  const L = CAP_LIQ[src.liquid] || CAP_LIQ.milk;
  // stream + splash overlay (stage coordinates)
  const NS = "http://www.w3.org/2000/svg";
  const fx = document.createElementNS(NS, "svg"); fx.setAttribute("class", "cap-fx");
  fx.setAttribute("width", stage.offsetWidth); fx.setAttribute("height", stage.offsetHeight);
  const edge = document.createElementNS(NS, "path"), core = document.createElementNS(NS, "path"), shine = document.createElementNS(NS, "path");
  edge.setAttribute("stroke", L.edge || "rgba(40,90,140,.35)"); core.setAttribute("stroke", L.stream); shine.setAttribute("stroke", "rgba(255,255,255,.75)");
  [edge, core, shine].forEach(p => { p.setAttribute("fill", "none"); p.setAttribute("stroke-linecap", "round"); fx.appendChild(p); });
  stage.appendChild(fx);
  const drops = [];
  src.el.classList.add("pouring"); src.el.style.transition = "none"; src.el.style.transformOrigin = `${ox}px ${oy}px`;
  if(o.behind){ src.el.classList.add("pour-behind"); dst.el.classList.add("pour-front");
    // streamFront: the source stays behind, but the stream is drawn OVER the (see-through) destination, so it is
    // seen falling inside it all the way down to the surface
    fx.classList.add(o.streamFront ? "front" : "behind"); }
  const unBehind = ()=>{ src.el.classList.remove("pour-behind"); dst.el.classList.remove("pour-front"); };
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const PH = [ ["move", 760], ["tip", 380], ["pour", POUR], ["stop", o.stay ? 560 : 360] ].concat(o.stay ? [] : [["home", 720]]);
  const total = PH.reduce((a, p) => a + p[1], 0);
  const d0 = o.dstFrom != null ? o.dstFrom : dst.level, d1 = o.dstTo, s0 = src.level, s1 = o.srcTo != null ? o.srcTo : 0;
  // the destination fills from the moment the stream LANDS until the tail has fallen in — never before the
  // milk has reached it (a tall bottle took ~0.5 s of fall that used to show as the level rising first)
  let landT = null;
  const fillK = (now)=>{ if(landT == null || t0 == null) return 0;
    const end = t0 + PH.slice(0, 4).reduce((a, q) => a + q[1], 0) * 1 - PH[3][1] * 0.2;   // ~ end of the "stop" phase
    return Math.max(0, Math.min(1, (now - landT) / Math.max(1, end - landT))); };
  let t0 = null, soundOn = false, lastDrop = 0, lastRip = 0, lastFoam = 0, fallT0 = null, tailDrops = false, clinked = false, chimed = false, tail = 0;
  // chained pours rest nearly upright and lifted CLEAR of the glass just filled (never standing in it)
  const STAY = o.high ? (a => ({ a, l: Math.max(0, Py1 + lowAt(a) - dst.y + 10) }))(A3 - dir * 25)
             : o.stay ? { a: dir * 6, l: Math.max(26, P[1] + lowAt(dir * 6) - dst.y + 12) } : { a: A1 * 0.6, l: 14 };
  const arc = o.arc != null ? o.arc : (o.high ? 70 : 0);   // carry a high-poured vessel in an arc over the other glasses
  let py = Py0;                  // current lip height (moves in high mode)
  // o.ceil (stage y): the vessel's highest painted point never goes above it — keeps it inside the frame
  let lipY = null;   // where the lip actually is this frame (stage y) — the stream starts here
  const pose = (tt, ang, lf) => {
    if(o.ceil != null){ const top = src.y + tt[1] - lf + oy + highAt(ang); if(top < o.ceil) lf -= (o.ceil - top); }
    lipY = src.y + tt[1] - lf + oy;
    src.angle = ang; src.el.style.transform = `translate(${tt[0]}px,${tt[1] - lf}px) rotate(${ang}deg)`; };
  const frame = (now) => {
    if(!ctx.alive()){ fx.remove(); unBehind(); return; }
    if(t0 == null) t0 = now;
    const e = now - t0; let acc = 0, ph = PH[PH.length - 1][0], p = 1;   // past the end: hold the LAST phase's end pose
    for(const [n, d] of PH){ if(e < acc + d){ ph = n; p = (e - acc) / d; break; } acc += d; }
    let flow = 0;
    if(ph === "move"){ const k = ease(p); py = Py0;
      pose([lerp(F.x, tx, k), lerp(F.y, tyAt(Py0), k)], lerp(F.a, A1, k), lerp(F.l, lift, Math.min(1, k * 1.6)) + arc * Math.sin(Math.PI * k)); }
    else if(ph === "tip"){ const k = ease(p); py = Py0; pose([tx, tyAt(Py0)], lerp(A1, A2, k), lift * (1 - k)); flow = k > 0.7 ? (k - 0.7) / 0.3 : 0; }
    else if(ph === "pour"){ const k = p; py = lerp(Py0, Py1, ease(k)); pose([tx, tyAt(py)], lerp(A2, A3, ease(k)), 0); flow = 1;
      src.level = lerp(s0, s1, k); dst.level = lerp(d0, d1, fillK(now));   // it only rises once the stream lands
      if(!soundOn){ soundOn = true; capSfxPour(POUR, d0, d1, src.liquid); } }
    else if(ph === "stop"){ const k = ease(p); py = Py1; pose([tx, tyAt(Py1)], lerp(A3, STAY.a, k), STAY.l * k); src.level = s1; dst.level = lerp(d0, d1, fillK(now)); tail = k;
      if(!chimed && o.chime && k > 0.4){ chimed = true; capSfxFull(); } }
    else if(ph === "home"){ const k = ease(Math.min(1, p));
      // with an arc: travel back HIGH, and only drop once over its own spot (never down onto a neighbour)
      const drop = arc ? Math.max(0, Math.min(1, (p - 0.72) / 0.28)) : k, hold = 1 - drop * drop * (3 - 2 * drop);
      pose([tx * (1 - k), tyAt(Py1) * (1 - k) * (arc ? hold : 1)], lerp(STAY.a, 0, k), arc ? (STAY.l + arc) * hold : STAY.l * (1 - k));
      if(!clinked && p > 0.92){ clinked = true; capSfxClink(); } }
    // liquid surfaces: dst wobbles while liquid lands, then settles
    dst.wob = (ph === "pour" ? 0.22 : ph === "stop" ? 0.22 * (1 - p) : 0) * Math.sin(e / 38);
    src.render(); dst.render();
    // STREAM — a real falling pour: when the flow starts the liquid FALLS from the lip under gravity (the stream
    // grows downward with a rounded head); it is thick at the lip and necks thinner as it falls; it wobbles softly;
    // only when it reaches the surface does it splash / ripple / foam; when the pour stops the tail detaches, falls
    // in and breaks into a few last drops.
    const ly = lipY != null ? lipY : py;
    const endY = dst.surfaceY(dst.level), sx0 = P[0], sy0 = ly + (ph === "stop" ? (endY - ly) * tail : 0);
    const wv = Math.sin(e / 55) * 1.6, ex = mx + wv;
    const width = (ph === "stop" ? 1 - tail : flow) * (3.4 + 5.4 * Math.max(0.35, src.level));
    if(width > 0.3 && fallT0 == null) fallT0 = now;
    // centre line: a short curve off the lip, then straight down to the surface
    const cy1 = Math.min(endY, sy0 + 60), pts = [];
    for(let k = 0; k <= 14; k++){ const u = k / 14, a = 1 - u;
      pts.push([a * a * sx0 + 2 * a * u * (sx0 + dir * 16) + u * u * ex, a * a * sy0 + 2 * a * u * (sy0 + 4) + u * u * cy1]); }
    for(let y = cy1 + 12; y < endY; y += 12) pts.push([ex, y]);
    pts.push([ex, endY]);
    const cum = [0]; for(let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
    const totalLen = cum[cum.length - 1];
    const fell = fallT0 == null ? 0 : (now - fallT0) / 1000;
    const vis = ph === "stop" ? totalLen : Math.min(totalLen, 140 * fell + 0.5 * 2200 * fell * fell);   // gravity
    const landed = vis >= totalLen - 0.5;
    if(landed && landT == null && width > 0.3) landT = now;
    if(width > 0.3 && totalLen > 2 && vis > 1){
      const L2 = [], R2 = [], spine = [];
      for(let k = 0; k < pts.length; k++){
        let sK = cum[k], q = pts[k];
        if(sK > vis){ const k0 = k - 1, f = (vis - cum[k0]) / Math.max(0.001, cum[k] - cum[k0]);
          q = [pts[k0][0] + (pts[k][0] - pts[k0][0]) * f, pts[k0][1] + (pts[k][1] - pts[k0][1]) * f]; sK = vis; }
        const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
        const tx0 = b[0] - a[0], ty0 = b[1] - a[1], tl = Math.hypot(tx0, ty0) || 1, nx = -ty0 / tl, ny = tx0 / tl;
        const neck = 1 - 0.42 * Math.min(1, sK / 170);                                         // thins as it falls
        const wob = 1 + 0.09 * Math.sin(e / 38 + sK / 11) + 0.05 * Math.sin(e / 23 - sK / 7);
        const head = (!landed && sK >= vis - 0.01) ? 1.25 : 1;                                   // rounded falling head
        const hw = width * neck * wob * head / 2;
        L2.push([q[0] + nx * hw, q[1] + ny * hw]); R2.push([q[0] - nx * hw, q[1] - ny * hw]); spine.push([q[0] - nx * hw * 0.45, q[1] - ny * hw * 0.45]);
        if(sK >= vis) break; }
      const last = L2.length - 1, tip = [(L2[last][0] + R2[last][0]) / 2, (L2[last][1] + R2[last][1]) / 2];
      const rTip = Math.hypot(L2[last][0] - R2[last][0], L2[last][1] - R2[last][1]) / 2;
      const body = (grow)=>{ const off = (pt, c)=> [pt[0] + (pt[0] - c[0]) * grow, pt[1] + (pt[1] - c[1]) * grow];
        let d = "M" + L2.map((pt, k)=> off(pt, [(L2[k][0] + R2[k][0]) / 2, (L2[k][1] + R2[k][1]) / 2]).map(v => v.toFixed(1)).join(",")).join(" L");
        d += ` A${(rTip * (1 + grow)).toFixed(1)},${(rTip * (1 + grow)).toFixed(1)} 0 0 1 `;
        d += R2.slice().reverse().map((pt, k, arr)=>{ const kk = arr.length - 1 - k; return off(pt, [(L2[kk][0] + R2[kk][0]) / 2, (L2[kk][1] + R2[kk][1]) / 2]).map(v => v.toFixed(1)).join(","); }).join(" L") + " Z";
        return d; };
      edge.setAttribute("d", body(0.18)); core.setAttribute("d", body(0));
      edge.setAttribute("fill", L.edge || "rgba(40,90,140,.35)"); core.setAttribute("fill", L.stream);
      edge.setAttribute("stroke", "none"); core.setAttribute("stroke", "none");
      core.setAttribute("opacity", src.liquid === "water" ? ".88" : "1");
      shine.setAttribute("d", "M" + spine.map(v => v.map(n => n.toFixed(1)).join(",")).join(" L"));
      shine.setAttribute("stroke-width", Math.max(0.6, width * 0.22).toFixed(2)); shine.setAttribute("opacity", ".7");
      fx.style.opacity = "1";
      if(ph === "pour" && landed){
        if(now - lastRip > 170){ lastRip = now;   // ripple rings where it lands
          const r = document.createElementNS(NS, "ellipse"); r.setAttribute("cx", ex); r.setAttribute("cy", endY + 1.5); r.setAttribute("fill", "none");
          r.setAttribute("stroke", src.liquid === "water" ? "rgba(255,255,255,.9)" : "rgba(170,150,120,.45)"); r.setAttribute("stroke-width", "1.2"); fx.appendChild(r);
          drops.push({ c: r, ring: true, born: now }); }
        if(now - lastDrop > (src.liquid === "water" ? 120 : 90)){ lastDrop = now;   // splash droplets
          for(let i = 0; i < 2; i++){ const c = document.createElementNS(NS, "circle");
            c.setAttribute("r", (1.4 + Math.random() * 1.8).toFixed(2)); c.setAttribute("fill", L.stream);
            c.setAttribute("stroke", L.edge || "rgba(40,90,140,.3)"); c.setAttribute("stroke-width", "0.6"); fx.appendChild(c);
            drops.push({ c, x: ex, y: endY, vx: (Math.random() * 2 - 1) * 55, vy: -(50 + Math.random() * 70), born: now }); } }
        if(src.liquid !== "water" && now - lastFoam > 70){ lastFoam = now;   // milk / oil: little foam bubbles spread on the surface
          const c = document.createElementNS(NS, "circle"); c.setAttribute("r", (1.2 + Math.random() * 2.2).toFixed(2));
          c.setAttribute("fill", src.liquid === "milk" ? "#FFFFFF" : "#FFE9A6"); c.setAttribute("stroke", src.liquid === "milk" ? "#DDD5C4" : "#D9A21A"); c.setAttribute("stroke-width", ".6");
          fx.appendChild(c); drops.push({ c, foam: true, x: ex, y: endY - 1, vx: (Math.random() < .5 ? -1 : 1) * (12 + Math.random() * 28), born: now }); }
      }
    } else fx.style.opacity = "0";
    if(ph === "stop" && !tailDrops && tail > 0.85){ tailDrops = true;   // the last of the stream breaks into drops
      for(let i = 0; i < 3; i++){ const c = document.createElementNS(NS, "circle"); c.setAttribute("r", (1.8 - i * 0.4).toFixed(2));
        c.setAttribute("fill", L.stream); c.setAttribute("stroke", L.edge || "rgba(40,90,140,.3)"); c.setAttribute("stroke-width", "0.6"); fx.appendChild(c);
        drops.push({ c, fall: true, x: P[0] + dir * 2, y: ly + 4 + i * 7, born: now + i * 90, floor: endY }); } }
    for(let i = drops.length - 1; i >= 0; i--){ const dp = drops[i], age = (now - dp.born) / 1000;
      if(dp.foam){ if(age > 0.9){ dp.c.remove(); drops.splice(i, 1); continue; }
        dp.c.setAttribute("cx", (dp.x + dp.vx * age).toFixed(1)); dp.c.setAttribute("cy", dp.y.toFixed(1)); dp.c.setAttribute("opacity", (1 - age / 0.9).toFixed(2)); continue; }
      if(dp.fall){ if(age < 0){ dp.c.setAttribute("opacity", "0"); continue; }
        const y = dp.y + 0.5 * 2200 * age * age; if(y >= dp.floor || age > 0.6){ dp.c.remove(); drops.splice(i, 1); continue; }
        dp.c.setAttribute("cx", dp.x.toFixed(1)); dp.c.setAttribute("cy", y.toFixed(1)); dp.c.setAttribute("opacity", "1"); continue; }
      if(dp.ring){ if(age > 0.55){ dp.c.remove(); drops.splice(i, 1); continue; }
        dp.c.setAttribute("rx", (3 + age * 34).toFixed(1)); dp.c.setAttribute("ry", (1 + age * 7).toFixed(1));
        dp.c.setAttribute("opacity", (1 - age / 0.55).toFixed(2)); continue; }
      const sy = dp.y + dp.vy * age + 520 * age * age;
      if(age > 0.42 || (age > 0.05 && sy > dp.y + 1)){ dp.c.remove(); drops.splice(i, 1); continue; }   // gone once it falls back into the liquid
      dp.c.setAttribute("cx", (dp.x + dp.vx * age).toFixed(1)); dp.c.setAttribute("cy", sy.toFixed(1));
      dp.c.setAttribute("opacity", (1 - age / 0.42).toFixed(2)); }
    if(e < total) requestAnimationFrame(frame);
    else if(o.stay){ unBehind(); src._pose = { x: tx, y: tyAt(Py1), a: STAY.a, l: STAY.l }; src.level = s1; dst.level = d1; dst.wob = 0;
      src.render(); dst.render(); fx.remove(); if(o.onDone) o.onDone(); }
    else { unBehind(); src.angle = 0; src._pose = null; src.level = s1; dst.level = d1; dst.wob = 0; src.render(); dst.render();
      src.el.style.transform = ""; src.el.classList.remove("pouring"); fx.remove(); if(o.onDone) o.onDone(); }
  };
  requestAnimationFrame(frame);
}

/* PAGE 8 — 10 cups of milk ("milk cup.svg") on a two-tier shelf, a glass pot ("bhaagona.svg") on the
   right. Demo: the hand taps the first cup and it pours. Then the child taps cups one by one; each
   pours into the pot (milk rises, pitch rises) and goes back empty. At 8 the pot is full, the last two
   cups stay full, and "कितने कप?" is asked (1 / 2 / 8) with the SME hint ladder. */
function capPanScene(host, slide){
  const stage = capStage(host, 480), ctx = capCtx(slide, stage), A = slide.audio, d = slide.data, N = d.capacity;
  setNavActive(false); setSwMood("talk");
  const panel = document.createElement("div"); panel.className = "cap-focus cap-focus-tall"; stage.appendChild(panel);
  const TOP = 196, BOT = 340;   // shelf tops (back tier, front tier)
  [[TOP, 60, 560], [BOT, 60, 884]].forEach(([y, x, w])=>{ const sh = document.createElement("div"); sh.className = "cap-shelf";
    sh.style.top = y + "px"; sh.style.left = x + "px"; sh.style.width = w + "px"; stage.appendChild(sh); });
  const pot = capArtVessel("pot", { w: 170, level: 0, liquid: "milk" }); capAdd(stage, pot, 713, BOT - pot.h + 3);   // body ≈ 8 cups (measured by area)
  const srcs = [];
  for(let i = 0; i < d.sources; i++){ const r = Math.floor(i / 5), c = i % 5;
    const v = capArtVessel("milkcup", { w: 80, level: 1, liquid: "milk" });
    srcs.push(capAdd(stage, v, 92 + c * 104, (r ? BOT : TOP) - v.h + 3)); }
  const emptied = []; let poured = 0, busy = false, open = false;
  const cues = { cups: ()=> srcs.forEach(v => capFlash(v.el, "cap-hl", 1500)), pan: ()=> capFlash(pot.el, "cap-hl", 1500) };
  const idle = capIdle(ctx, d.idle_ms || 7000, ()=>{ if(!open || busy) return; const nx = srcs.find(v => !v.used); if(nx) capPoint(nx.el); idle.arm(); });
  const ask = ()=>{ open = false; srcs.forEach(v => v.el.classList.remove("tappable")); idle.stop(); stopNudge();
    SwiftPAL.emit("pour_done", { slide_id: slide.id, count: N });
    ctx.after(500, ()=> capAskNumber(ctx, stage, d.ask, { row: true, x: 290, y: 392, countEls: emptied })); };
  const pourOne = (v, then)=>{ busy = true; v.used = true; poured++; emptied.push(v); v.el.classList.remove("tappable");
    SwiftPAL.emit("count_tap", { slide_id: slide.id, phase: slide.phase, n: poured });
    capRealPour(ctx, v, pot, { dir: 1, high: true, srcTo: 0, dstFrom: (poured - 1) / N, dstTo: poured / N, ms: 1300, tilt: [70, 128],
      chime: poured === N, onDone: ()=>{ busy = false; then(); } }); };
  const after = ()=>{ if(poured >= N){ capFlash(pot.el, "cap-hl", 1400); ask(); } else idle.arm(); };
  srcs.forEach(v => { v.el.onclick = ()=>{ if(!open || busy || v.used || poured >= N) return; stopNudge(); idle.stop(); sfxTap(); pourOne(v, after); }; });
  const openUp = ()=>{ open = true; srcs.forEach(v => { if(!v.used) v.el.classList.add("tappable"); }); setSwMood("point");
    ctx.replayFn = ()=>{ if(open && !busy) ctx.say(A.your_turn || A.intro); };
    const nx = srcs.find(v => !v.used); if(nx) capPoint(nx.el); idle.arm(); };
  ctx.say(A.intro, cues, ()=>{
    if(!d.demo){ openUp(); return; }
    capPoint(srcs[0].el);   // demo: the hand taps the first cup, it pours, then "अब आप करिए"
    ctx.after(900, ()=>{ stopNudge(); sfxTap(); pourOne(srcs[0], ()=> ctx.say(A.your_turn, null, openUp)); });
  });
}
/* PAGE 10 — an empty oil jug ("jug.svg") on the left, six small glass mugs of oil ("small mug.svg") on a
   two-tier shelf on the right. Tap a mug: it lifts, tips toward the jug (handle away) and pours; the oil
   rises in the jug; the mug goes back (empty, fully visible). After 6 the jug is full → 4 / 5 / 6. */
function capJugScene(host, slide){
  const stage = capStage(host, 480), ctx = capCtx(slide, stage), A = slide.audio, d = slide.data, N = d.capacity;
  setNavActive(false); setSwMood("talk");
  const panel = document.createElement("div"); panel.className = "cap-focus cap-focus-tall"; stage.appendChild(panel);
  const TOP = 196, BOT = 340;
  [[TOP, 470, 470], [BOT, 60, 880]].forEach(([y, x, w])=>{ const sh = document.createElement("div"); sh.className = "cap-shelf";
    sh.style.top = y + "px"; sh.style.left = x + "px"; sh.style.width = w + "px"; stage.appendChild(sh); });
  const jug = capArtVessel("jugOil", { w: 172, level: 0, liquid: "oil" }); capAdd(stage, jug, 120, BOT - jug.h + 3);
  const srcs = [];
  for(let i = 0; i < d.sources; i++){ const r = Math.floor(i / 3), c = i % 3;
    const v = capArtVessel("smallmug", { w: 92, level: 1, liquid: "oil" });
    srcs.push(capAdd(stage, v, 520 + c * 140, (r ? BOT : TOP) - v.h + 3)); }
  const emptied = []; let poured = 0, busy = false, open = false;
  const cues = { jug: ()=> capFlash(jug.el, "cap-hl", 1500), mugs: ()=> srcs.forEach(v => capFlash(v.el, "cap-hl", 1500)) };
  const idle = capIdle(ctx, d.idle_ms || 7000, ()=>{ if(!open || busy) return; const nx = srcs.find(v => !v.used); if(nx) capPoint(nx.el); idle.arm(); });
  const ask = ()=>{ open = false; srcs.forEach(v => v.el.classList.remove("tappable")); idle.stop(); stopNudge();
    SwiftPAL.emit("pour_done", { slide_id: slide.id, count: N });
    ctx.after(500, ()=> capAskNumber(ctx, stage, d.ask, { row: true, x: 290, y: 392, countEls: emptied })); };
  const pourOne = (v, then)=>{ busy = true; v.used = true; poured++; emptied.push(v); v.el.classList.remove("tappable");
    SwiftPAL.emit("count_tap", { slide_id: slide.id, phase: slide.phase, n: poured });
    capRealPour(ctx, v, jug, { dir: -1, high: true, arc: 40,   /* in front, held above the jug (no overlap) */ ceil: 22,   /* frame top (the hull includes the handle) */ srcTo: 0, dstFrom: (poured - 1) / N, dstTo: poured / N, ms: 1400, tilt: [72, 126],
      chime: poured === N, onDone: ()=>{ busy = false; then(); } }); };   // emptied mugs stay fully visible (no fade)
  const after = ()=>{ if(poured >= N){ capFlash(jug.el, "cap-hl", 1400); ask(); } else idle.arm(); };
  srcs.forEach(v => { v.el.onclick = ()=>{ if(!open || busy || v.used || poured >= N) return; stopNudge(); idle.stop(); sfxTap(); pourOne(v, after); }; });
  ctx.say(A.intro, cues, ()=>{ open = true; srcs.forEach(v => v.el.classList.add("tappable")); setSwMood("point");
    ctx.replayFn = ()=>{ if(open && !busy) ctx.say(A.intro); }; capPoint(srcs[0].el); idle.arm(); });
}
Object.assign(SlideModules, {
  /* PAGE 2 — "ज़्यादा पानी किसमें, गिलास या मग?"  tap the vessel that holds more. */
  CAP_COMPARE_PICK: {
    mount(host, slide){
      const stage = capStage(host, 400), ctx = capCtx(slide, stage), A = slide.audio, d = slide.data || {};
      setNavActive(false); setSwMood("talk");
      // page 2 uses the supplied art (ASSETE MAP/glass.png, mug.png) instead of the drawn vessels
      // same focus panel + raised shelf as the other scenes (consistency); vessels stand on the shelf
      const panel = document.createElement("div"); panel.className = "cap-focus cap-focus-tut"; stage.appendChild(panel);
      const BASE = 348;
      const glass = capAdd(stage, capImgVessel("cap_glass", 185, 426 / 520, "गिलास"), 250, BASE - 226);
      const mug = capAdd(stage, capImgVessel("cap_mug", 250, 496 / 520, "मग"), 540, BASE - 262);
      glass.el.classList.add("tappable"); mug.el.classList.add("tappable");
      const mid = capMarker(stage, 480, 330);
      let done = false, onlyMug = false, attempts = 0, idleN = 0, busy = false;
      const idle = capIdle(ctx, d.idle_ms || 7000, ()=>{ if(done || busy || idleN >= 3) return; idleN++;
        capPoint(onlyMug ? mug.el : mid); ctx.say(A.idle, null, ()=> idle.arm()); });
      const hl = (v)=> capFlash(v.el, "cap-hl", 1500);
      mug.el.onclick = ()=>{ if(done) return; done = true; idle.stop(); stopNudge();
        glass.el.classList.remove("cap-pulse-loop"); mug.el.classList.add("cap-ok");
        sfxCorrect(); confettiCannon(); setSwMood("happy");
        SwiftPAL.emit("capacity_compare_first_try", { slide_id: slide.id, phase: slide.phase, value: attempts === 0, attempts: attempts + 1 });
        const okId = attempts === 0 ? A.correct : A.correct + "2";   // "शाबाश!" only on a first-try correct answer
        ctx.replayFn = ()=> ctx.say(okId);
        ctx.say(okId, null, ()=>{ setSwMood("point"); capNavOn(); }); };
      glass.el.onclick = ()=>{ if(done || onlyMug) return; attempts++; onlyMug = true; busy = true; idle.stop(); stopNudge();
        state.attempts = attempts; glass.el.classList.remove("tappable"); glass.el.classList.add("cap-pulse-loop");
        sfxWrongSoft(); setSwMood("tryagain");
        SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts });
        ctx.say(A.wrong, { mug: ()=> capPoint(mug.el) }, ()=>{ busy = false; glass.el.classList.remove("cap-pulse-loop"); capPoint(mug.el); idle.arm(); }); };
      ctx.replayFn = ()=>{ if(!done && !busy){ stopNudge(); ctx.say(A.prompt, { glass: ()=> hl(glass), mug: ()=> hl(mug) }, ()=> idle.arm()); } };
      ctx.say(A.prompt, { glass: ()=> hl(glass), mug: ()=> hl(mug) }, ()=> idle.arm());
    }
  },

  /* PAGE 3 — "कौन-सा तरीका सही है?"  autonomous: highlight each method with the VO, then the
     identical-cups method is highlighted (✓) while the mixed one stays dimmed. */
  CAP_METHOD: {
    mount(host, slide){
      const stage = capStage(host, 400), ctx = capCtx(slide, stage), A = slide.audio;
      setNavActive(false); setSwMood("teach");
      const box = (x)=>{ const b = document.createElement("div"); b.className = "cap-box"; b.style.left = x + "px"; b.style.top = "56px";
        b.style.width = "440px"; b.style.height = "270px"; stage.appendChild(b); return b; };
      const b1 = box(30), b2 = box(530);
      const put = (bx, v, x)=>{ bx.appendChild(v.el); v.place(x, 270 - v.h - 56); return v; };
      // supplied art (ASSETE MAP/cup.png, glass.png): three identical cups vs two cups + a glass
      const cup = ()=> capImgVessel("cap_cup", 124, 420 / 354, "कप");
      const cups1 = [0, 1, 2].map(i => put(b1, cup(), 18 + i * 138));
      put(b2, cup(), 18); put(b2, cup(), 156);
      put(b2, capImgVessel("cap_glass", 108, 426 / 520, "गिलास"), 300);
      const tick = document.createElement("div"); tick.className = "cap-tick"; tick.textContent = "✓";
      const introCues = { box1: ()=> b1.classList.add("cap-hl"), box2: ()=>{ b1.classList.remove("cap-hl"); b2.classList.add("cap-hl"); } };
      const explainCues = { same: ()=> cups1.forEach((v, i)=> setTimeout(()=> capFlash(v.el, "cap-pulse", 1400), i * 220)),
        correct: ()=>{ b1.appendChild(tick); b1.classList.add("cap-ok"); } };
      const explain = (then)=>{ b2.classList.remove("cap-hl"); b2.classList.add("cap-dim"); b1.classList.add("cap-hl");
        ctx.say(A.explain, explainCues, then); };
      ctx.say(A.intro, introCues, ()=> ctx.after(400, ()=> explain(()=>{
        setSwMood("point"); capNavOn(); ctx.replayFn = ()=> explain(); })));
    }
  },

  /* PAGE 4 — four glasses of milk poured one by one into an empty bottle; count 1-4. */
  CAP_POUR_IN_DEMO: {
    mount(host, slide){
      const stage = capStage(host, 400), ctx = capCtx(slide, stage), A = slide.audio, d = slide.data, N = d.count;
      setNavActive(false); setSwMood("teach");
      // supplied art (ASSETE MAP): corked milk bottle ("svg glass.svg") + glass of milk (sheet in "milk bottle.svg")
      // same focus panel + shelf as the other scenes, so the clear glass reads against a solid ground
      const panel = document.createElement("div"); panel.className = "cap-focus cap-focus-tut"; stage.appendChild(panel);
      const shelf = document.createElement("div"); shelf.className = "cap-shelf cap-shelf-tut"; stage.appendChild(shelf);
      const BASE = 348;   // shelf top (raised) — everything stands on it, the group centred in the panel
      // pour from IN FRONT with the rim just above the mouth; sizes leave room above the bottle so the frame limit
      // never pushes the tipped glass down into it (measured: 0 frames where the glass and bottle outlines cross)
      const P4 = { bw: 82, gw: 66, gap: 24, tilt: null, behind: false };
      const bottle = capArtVessel("bottle", { w: P4.bw, level: 0 }); capAdd(stage, bottle, 740, BASE - bottle.h);
      // glasses sized so four of them visibly add up to the bottle
      // "water glass.svg", filled with milk
      const glasses = []; for(let i = 0; i < N; i++){ const g = capArtVessel("wglassMilk", { w: P4.gw, level: 1, liquid: "milk" });
        glasses.push(capAdd(stage, g, 190 + i * 118, BASE - g.h)); }
      const FULL = 0.88;   // the bottle ends a little short of full: milk stops just below the neck (visible headroom)
      const cues = { bottle: ()=> capFlash(bottle.el, "cap-hl", 1600), glasses: ()=> glasses.forEach(g => capFlash(g.el, "cap-hl", 1600)) };
      const count = (i)=>{ if(i >= N){ ctx.after(300, ()=> ctx.say(A.conclude, null, ()=>{ setSwMood("point"); capNavOn(); ctx.replayFn = ()=> ctx.say(A.conclude); })); return; }
        capFlash(glasses[i].el, "cap-pulse", 1400); capBadge(glasses[i], i + 1);
        ctx.say("cap_num_" + (i + 1), null, ()=> ctx.after(250, ()=> count(i + 1))); };
      const pour = (i)=>{ if(i >= N){ SwiftPAL.emit("pour_done", { slide_id: slide.id, count: N });
          ctx.after(250, ()=>{ bottle.cork(true); ctx.after(900, ()=> count(0)); }); return; }
        capRealPour(ctx, glasses[i], bottle, { dir: 1, behind: P4.behind, gap: P4.gap, tilt: P4.tilt || undefined, ceil: 46, arc: 70, srcTo: 0, dstFrom: FULL * i / N, dstTo: FULL * (i + 1) / N,
          onDone: ()=>{ capFlash(glasses[i].el, "cap-hl", 900); ctx.after(300, ()=> pour(i + 1)); } }); };
      ctx.say(A.intro, cues, ()=> ctx.after(300, ()=>{ bottle.cork(false); ctx.after(1000, ()=> pour(0)); }));
    }
  },

  /* PAGE 5 — a full jug fills glasses one by one: four fill, the jug is empty, the two spare
     empty glasses disappear, leaving the four full ones. */
  CAP_POUR_OUT_DEMO: {
    mount(host, slide){
      const stage = capStage(host, 400), ctx = capCtx(slide, stage), A = slide.audio, d = slide.data, N = d.count;
      setNavActive(false); setSwMood("teach");
      // supplied art (ASSETE MAP): "jug.svg" (spout turned toward the glasses, full of water) + "glass svg.svg".
      // Sized so the jug's body is ≈ 4 glasses — the measurement reads true at a glance.
      // same focus panel + raised shelf as page 4; jug sized so about four glasses fill it
      const panel = document.createElement("div"); panel.className = "cap-focus cap-focus-tut"; stage.appendChild(panel);
      const shelf = document.createElement("div"); shelf.className = "cap-shelf cap-shelf-tut"; stage.appendChild(shelf);
      const BASE = 348;
      const jug = capArtVessel("jug", { w: 140, level: 1, liquid: "water" }); capAdd(stage, jug, 140, BASE - jug.h);
      const glasses = []; for(let i = 0; i < d.glasses; i++){ const g = capArtVessel("glassWater", { w: 60, level: 0, liquid: "water" });
        glasses.push(capAdd(stage, g, 330 + i * 96, BASE - g.h)); }
      const cues = { glasses: ()=> glasses.forEach(g => capFlash(g.el, "cap-hl", 1600)), jug: ()=> capFlash(jug.el, "cap-hl", 1600) };
      const finish = ()=>{ SwiftPAL.emit("pour_done", { slide_id: slide.id, count: N });   // the spare empty glasses stay (they show what is left over)
        ctx.after(600, ()=> ctx.say(A.conclude, null, ()=>{ setSwMood("point"); capNavOn(); ctx.replayFn = ()=> ctx.say(A.conclude); })); };
      // one glass at a time: pick the jug up, pour, set it back down. The fuller the jug, the less it tips.
      const TILT = [[16, 38], [38, 58], [58, 76], [76, 92]];
      const pour = (i)=>{ if(i >= N){ ctx.after(300, finish); return; }
        capRealPour(ctx, jug, glasses[i], { dir: 1, high: true, ceil: 46, chime: true, srcTo: 1 - (i + 1) / N, dstFrom: 0, dstTo: 1, ms: 1800, tilt: TILT[i] || TILT[3],
          onDone: ()=>{ capFlash(glasses[i].el, "cap-hl", 1000); capBadge(glasses[i], i + 1); ctx.after(350, ()=> pour(i + 1)); } }); };
      ctx.say(A.intro, cues, ()=> ctx.after(300, ()=> pour(0)));
    }
  },

  /* PAGE 7 (guided) — a hand demo pours the jar into the first cup; then the child DRAGS the jar
     onto each empty cup (it pours on drop) until the jar is empty; then "how many cups?" 1/4/6. */
  CAP_JAR_DRAG: {
    mount(host, slide){
      const stage = capStage(host, 480), ctx = capCtx(slide, stage), A = slide.audio, d = slide.data, N = d.capacity;
      setNavActive(false); setSwMood("teach");
      // focus: a soft spotlight panel + a light shelf the jar and the cups stand on, centred on screen
      const panel = document.createElement("div"); panel.className = "cap-focus"; stage.appendChild(panel);
      const shelf = document.createElement("div"); shelf.className = "cap-shelf"; stage.appendChild(shelf);
      const BASE = 336;   // shelf top (vessels stand on it)
      const jar = capArtVessel("oiljar", { w: 124, level: 1, liquid: "oil" }); capAdd(stage, jar, 100, BASE - jar.h + 2);   // ≈ 4 cups
      const cups = []; for(let i = 0; i < d.cups; i++){ const c = capArtVessel("teacup", { w: 92, level: 0, liquid: "oil" });
        cups.push(capAdd(stage, c, 290 + i * 108, BASE - c.h + 2)); }
      const filled = []; let dragOn = false, busy = false, poured = 0;
      const TILT = [[40, 62], [62, 80], [80, 96], [96, 112]];   // the fuller the jar, the less it tips
      const pourInto = (cup, then)=>{ const k = poured; busy = true; poured++; filled.push(cup); cup.full = true;
        cups.forEach(c => c.el.classList.remove("cap-target"));
        capRealPour(ctx, jar, cup, { dir: 1, high: true, chime: true, srcTo: 1 - poured / N, dstFrom: 0, dstTo: 1, ms: 1600, tilt: TILT[k] || TILT[3],
          onDone: ()=>{ busy = false; capFlash(cup.el, "cap-hl", 900); then(); } }); };
      const ask = ()=>{ dragOn = false; jar.el.classList.remove("draggable"); idle.stop(); stopNudge();
        SwiftPAL.emit("pour_done", { slide_id: slide.id, count: N });
        ctx.after(400, ()=> capAskNumber(ctx, stage, d.ask, { row: true, x: 290, y: 382, countEls: filled, autoNext: true })); };   // page 7: no Next button
      // idle: a hand shows the drag from the jar to the next empty cup
      const hand = capHandEl(); hand.style.display = "none"; stage.appendChild(hand);
      const showDrag = ()=>{ const t = cups.find(c => !c.full); if(!t) return; const [jx, jy] = jar.center(), [cx, cy] = t.center();
        hand.style.transition = "none"; hand.style.left = (jx - 30) + "px"; hand.style.top = (jy - 10) + "px"; hand.style.display = "block"; hand.style.opacity = "1";
        ctx.after(450, ()=>{ hand.style.transition = "left 1.1s ease-in-out, top 1.1s ease-in-out, opacity .3s"; hand.style.left = (cx - 30) + "px"; hand.style.top = (cy - 10) + "px"; });
        ctx.after(1900, ()=>{ hand.style.opacity = "0"; }); ctx.after(2300, ()=>{ hand.style.display = "none"; }); };
      const idle = capIdle(ctx, d.idle_ms || 7000, ()=>{ if(dragOn && !busy){ showDrag(); ctx.after(2400, ()=> idle.arm()); } });
      // the child's drag: drop the jar on (near) an empty cup and it pours into it
      jar.el.addEventListener("pointerdown", (e)=>{
        if(!dragOn || busy) return; e.preventDefault(); idle.stop(); stopNudge(); hand.style.display = "none";
        const sc = capScale(), sx = e.clientX, sy = e.clientY; let dx = 0, dy = 0;
        jar.el.style.transition = "none"; jar.el.classList.add("dragging");
        try{ jar.el.setPointerCapture(e.pointerId); }catch(_){}
        const nearest = ()=>{ const jx = jar.x + jar.w / 2 + dx, jy = jar.y + jar.h / 2 + dy; let best = null, bd = 1e9;
          cups.forEach(c => { if(c.full) return; const [cx, cy] = c.center(); const dd = Math.hypot(cx - jx, cy - jy); if(dd < bd){ bd = dd; best = c; } });
          return bd < 140 ? best : null; };
        const mv = (ev)=>{ dx = (ev.clientX - sx) / sc; dy = (ev.clientY - sy) / sc; jar.el.style.transform = `translate(${dx}px,${dy}px)`;
          const t = nearest(); cups.forEach(c => c.el.classList.toggle("cap-target", c === t)); };
        const up = ()=>{ jar.el.removeEventListener("pointermove", mv); jar.el.removeEventListener("pointerup", up); jar.el.removeEventListener("pointercancel", up);
          jar.el.classList.remove("dragging"); const t = nearest();
          jar._pose = { x: dx, y: dy, a: 0, l: 0 };   // the pour (or the set-down) starts from where it was dropped
          if(t){ sfxTap(); pourInto(t, ()=>{ if(poured >= N) ask(); else idle.arm(); }); }
          else { cups.forEach(c => c.el.classList.remove("cap-target")); if(Math.hypot(dx, dy) > 30) sfxWrongSoft();
            busy = true; capArtHome(ctx, jar, ()=>{ busy = false; idle.arm(); }); } };
        jar.el.addEventListener("pointermove", mv); jar.el.addEventListener("pointerup", up); jar.el.addEventListener("pointercancel", up);
      });
      // demo (starts on "जार को ऐसे…"): a hand picks the jar up and pours the first cup
      let vo1 = false, demo = false; const go = ()=>{ if(!(vo1 && demo)) return;
        ctx.say(A.your_turn, null, ()=>{ dragOn = true; jar.el.classList.add("draggable"); setSwMood("point"); showDrag(); idle.arm(); });
        ctx.replayFn = ()=>{ if(dragOn && !busy) ctx.say(A.your_turn); }; };
      let demoStarted = false;
      const runDemo = ()=>{ if(demoStarted) return; demoStarted = true;
        const h = capHandEl(); h.classList.add("on-v"); jar.el.appendChild(h);
        ctx.after(650, ()=>{ pourInto(cups[0], ()=>{ demo = true; go(); }); ctx.after(700, ()=> h.remove()); }); };
      ctx.say(A.intro, { demo: runDemo }, ()=>{ vo1 = true; runDemo(); go(); });
    }
  },

  /* PAGES 8 & 10 — tap each full source cup/mug: it pours into the big vessel and returns empty.
     layout "pan": 10 steel cups (2×5) → saucepan (capacity 8; the last 2 stay full).
     layout "jug": 6 oil mugs (2×3) → empty glass jug (capacity 6); emptied mugs fade to 20%. */
  CAP_TAP_POUR: {
    mount(host, slide){
      if(slide.data && slide.data.layout === "pan") return capPanScene(host, slide);   // page 8: supplied art scene
      if(slide.data && slide.data.layout === "jug") return capJugScene(host, slide);   // page 10: supplied art scene
      const stage = capStage(host, 480), ctx = capCtx(slide, stage), A = slide.audio, d = slide.data, N = d.capacity;
      setNavActive(false); setSwMood("talk");
      const pan = d.layout === "pan";
      const big = pan ? capAdd(stage, capVessel("saucepan", { w: 360, liquid: d.liquid, level: 0 }), 170, 480 - 180 - 22)
                      : capAdd(stage, capVessel("pitcher", { w: 200, liquid: d.liquid, level: 0 }), 70, 480 - 235 - 24);
      const srcs = [];
      for(let i = 0; i < d.sources; i++){
        if(pan){ const r = Math.floor(i / 5), c = i % 5; srcs.push(capAdd(stage, capVessel("steelcup", { w: 86, liquid: d.liquid, level: 1 }), 150 + c * 108, 14 + r * 104)); }
        else { const r = Math.floor(i / 3), c = i % 3; srcs.push(capAdd(stage, capVessel("mug", { w: 104, liquid: d.liquid, level: 1 }), 380 + c * 150, 50 + r * 196)); }
      }
      const emptied = []; let poured = 0, busy = false, open = false;
      const cues = pan ? { cups: ()=> srcs.forEach(v => capFlash(v.el, "cap-hl", 1500)), pan: ()=> capFlash(big.el, "cap-hl", 1500) }
                       : { jug: ()=> capFlash(big.el, "cap-hl", 1500), mugs: ()=> srcs.forEach(v => capFlash(v.el, "cap-hl", 1500)) };
      const idle = capIdle(ctx, d.idle_ms || 7000, ()=>{ if(!open || busy) return; const nx = srcs.find(v => !v.used); if(nx) capPoint(nx.el); });
      const ask = ()=>{ open = false; srcs.forEach(v => v.el.classList.remove("tappable")); idle.stop(); stopNudge();
        SwiftPAL.emit("pour_done", { slide_id: slide.id, count: N });
        ctx.after(400, ()=> capAskNumber(ctx, stage, d.ask, { x: 850, y: 72, countEls: emptied })); };
      const pourOne = (v, then)=>{ busy = true; v.used = true; poured++; emptied.push(v); v.el.classList.remove("tappable");
        SwiftPAL.emit("count_tap", { slide_id: slide.id, phase: slide.phase, n: poured });
        capPour(ctx, v, big, { dir: -1, srcTo: 0, dstTo: poured / N, ms: 950, gap: pan ? 34 : 28, onDone: ()=>{
          busy = false; if(!pan) v.el.classList.add("cap-faint"); then(); } }); };
      const after = ()=>{ if(poured >= N){ capFlash(big.el, "cap-hl", 1200); ask(); } else idle.arm(); };
      srcs.forEach(v => { v.el.onclick = ()=>{ if(!open || busy || v.used) return; stopNudge(); idle.stop(); sfxTap(); pourOne(v, after); }; });
      const openUp = ()=>{ open = true; srcs.forEach(v => { if(!v.used) v.el.classList.add("tappable"); }); setSwMood("point");
        ctx.replayFn = ()=>{ if(open && !busy) ctx.say(A.your_turn || A.intro); }; idle.arm(); const nx = srcs.find(v => !v.used); if(nx) ctx.after(600, ()=>{ if(open && !busy && poured === (d.demo ? 1 : 0)) capPoint(nx.el); }); };
      ctx.say(A.intro, cues, ()=>{
        if(!d.demo){ openUp(); return; }
        // demo: the hand taps the first cup, it pours, then "अब आप करिए"
        capPoint(srcs[0].el);
        ctx.after(900, ()=>{ stopNudge(); pourOne(srcs[0], ()=> ctx.say(A.your_turn, null, openUp)); });
      });
    }
  },

  /* PAGE 9 — tap the full bottle: it opens and fills glasses one by one (3 full, 4th empty). */
  CAP_TAP_SOURCE: {
    mount(host, slide){
      const stage = capStage(host, 480), ctx = capCtx(slide, stage), A = slide.audio, d = slide.data, N = d.capacity;
      setNavActive(false); setSwMood("talk");
      // supplied art (ASSETE MAP): "water bottle.svg" + "water glass.svg", centred on a lit shelf
      const panel = document.createElement("div"); panel.className = "cap-focus cap-focus-cool"; stage.appendChild(panel);
      const shelf = document.createElement("div"); shelf.className = "cap-shelf"; stage.appendChild(shelf);
      const BASE = 336;
      const bottle = capArtVessel("wbottle", { w: 128, level: 1, liquid: "water" }); capAdd(stage, bottle, 80, BASE - bottle.h + 2);
      const glasses = []; for(let i = 0; i < d.glasses; i++){ const g = capArtVessel("wglass", { w: 96, level: 0, liquid: "water" });
        glasses.push(capAdd(stage, g, 320 + i * 150, BASE - g.h + 2)); }
      let open = false, used = false;
      const cues = { bottle: ()=> capFlash(bottle.el, "cap-hl", 1500), glasses: ()=> glasses.forEach(g => capFlash(g.el, "cap-hl", 1500)) };
      const idle = capIdle(ctx, d.idle_ms || 7000, ()=>{ if(open && !used){ capPoint(bottle.el); idle.arm(); } });
      const ask = ()=>{ SwiftPAL.emit("pour_done", { slide_id: slide.id, count: N });
        ctx.after(400, ()=> capAskNumber(ctx, stage, d.ask, { row: true, x: 290, y: 382, countEls: glasses.slice(0, N) })); };
      // one glass at a time: lift, pour, set down. The fuller the bottle, the less it tips.
      const TILT = [[58, 84], [84, 106], [106, 128]];
      const pour = (i)=>{ if(i >= N){ ctx.after(200, ()=>{ bottle.cork(true); ctx.after(900, ask); }); return; }
        capRealPour(ctx, bottle, glasses[i], { dir: 1, high: true, arc: 0, ceil: 50, chime: true, srcTo: 1 - (i + 1) / N, dstFrom: 0, dstTo: 1, ms: 1500, tilt: TILT[i] || TILT[2],
          onDone: ()=>{ capFlash(glasses[i].el, "cap-hl", 900); ctx.after(300, ()=> pour(i + 1)); } }); };
      bottle.el.onclick = ()=>{ if(!open || used) return; used = true; idle.stop(); stopNudge(); sfxTap();
        bottle.el.classList.remove("tappable"); SwiftPAL.emit("count_tap", { slide_id: slide.id, phase: slide.phase });
        bottle.cork(false); ctx.after(1000, ()=> pour(0)); };
      ctx.say(A.intro, cues, ()=>{ open = true; bottle.el.classList.add("tappable"); setSwMood("point"); capPoint(bottle.el); idle.arm();
        ctx.replayFn = ()=>{ if(!used) ctx.say(A.intro); }; });
    }
  },

  /* PAGE 11 — the village milk shop, laid out exactly as the Figma frames (ASSETE MAP "order view.svg" /
     "puring view.svg", 1920x1080). The scene is built in Figma pixels and scaled as one unit to the
     1333x750 stage. Three customers ask for 4 / 2 / 3 glasses; tap each bottle → the pouring view
     opens (bottle + 5 glasses), tap the bottle, it fills N glasses → back at the counter the bottle is
     labelled "N गिलास". Then pick the bottle that holds exactly 4 glasses; it goes to the customer. */
  CAP_SHOP: {
    mount(host, slide){
      const stage = capStage(host, 480), ctx = capCtx(slide, stage), A = slide.audio, d = slide.data;
      setNavActive(false); setSwMood("talk");
      const IMG = CARD.assets.image || {};
      const scene = document.createElement("div"); scene.className = "cap-scene full fig";   // 1920x1080, scaled to the stage
      scene.innerHTML = `<img class="cap-scene-bg" src="${IMG.cap_shop_order || "assets/Images/cap_shop_order.jpg"}" alt="गाँव में दूध की दुकान">`;
      $("stage").insertBefore(scene, $("stage").firstChild);
      // customers are separate layers (walk in one by one), drawn between the village and the counter/frame
      const CUST = ["man", "woman", "boy"].map(name => { const [x, y, w, h] = CAP_SHOP_FIG.chars[name];
        const c = document.createElement("div"); c.className = "cap-cust"; c.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
        // .cap-body = the moving body (walk cycle / breathing / talking); the face overlay rides inside it
        c.innerHTML = `<div class="cap-body"><img src="${IMG["cap_shop_" + name] || ("assets/Images/cap_shop_" + name + ".png")}" alt=""></div>`;
        c.style.transform = `translateX(${1920 - x + 60}px)`; scene.appendChild(c); return c; });
      // faces: eyelids that blink + a closed-mouth overlay that flaps against the painted open smile while talking.
      // Boxes are in each customer PNG's own pixels (measured from the art: eye whites / open mouth / skin tone).
      const FACE = {
        man:   { skin: "#FEA864", lip: "#FC8A4B", eyes: [[165, 110, 24, 26], [222, 113, 22, 25]], mouth: [174, 159, 56, 26], line: "#5A2A12" },
        woman: { skin: "#FE9E64", lip: "#FA8B53", eyes: [[92, 118, 30, 30], [154, 124, 24, 26]], mouth: [114, 159, 45, 28], line: "#6A2A1A" },
        boy:   { skin: "#FEA065", lip: "#F98A4D", eyes: [[115, 115, 27, 31], [173, 118, 22, 25]], mouth: [137, 153, 43, 28], line: "#5A2A12" } };
      // after the hand-over each customer switches to the "holding the bottle" art (ASSETE MAP), placed on the same
      // canvas so the head does not move (_tools/build_hold.py); its own face boxes keep blink + lip sync working
      const FACE_HOLD = {"man":{"skin":"#FEAC65","lip":"#FC8A4B","eyes":[[163.9,110.0,26.1,27.6],[221.6,111.6,22.9,26.1]],"mouth":[179.7,162.1,41.1,22.9],"bottle":[163.2,239.5,70.3,180.8],"line":"#5A2A12"},"woman":{"skin":"#FDB774","lip":"#FA8B53","eyes":[[92.8,118.6,28.3,29.1],[151.9,122.7,28.3,28.3]],"mouth":[111.4,161.5,45.3,25.1],"bottle":[93.6,239.1,68.7,181.1],"line":"#6A2A1A"},"boy":{"skin":"#FEB470","lip":"#F98A4D","eyes":[[115.5,116.0,26.0,29.5],[171.0,116.0,26.0,28.6]],"mouth":[133.7,158.5,45.1,21.7],"bottle":[125.9,267.7,69.4,179.5],"line":"#5A2A12"}};
      const faceTimers = [];
      const makeFace = (F, i, w, h)=>{
        const lid = ([x, y, ew, eh])=> `<g class="cap-lid"><ellipse cx="${x + ew / 2}" cy="${y + eh / 2 + 1}" rx="${ew / 2 + 4}" ry="${eh / 2 + 5}" fill="${F.skin}"/>` +
          `<path d="M${x - 2},${y + eh * 0.62} Q${x + ew / 2},${y + eh * 0.62 + 6} ${x + ew + 2},${y + eh * 0.62}" stroke="#2A160C" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>`;
        const [mx, my, mw, mh] = F.mouth;
        // closed mouth in the face's own skin tone (soft-edged so it melts into the cheeks) + a gentle smile line
        const shut = `<g class="cap-mshut"><ellipse cx="${mx + mw / 2}" cy="${my + mh / 2}" rx="${mw / 2 + 3}" ry="${mh / 2 + 3}" fill="${F.skin}" filter="url(#cf${i})"/>` +
          `<path d="M${mx + 6},${my + mh * 0.38} Q${mx + mw / 2},${my + mh * 0.72} ${mx + mw - 6},${my + mh * 0.38}" stroke="${F.line}" stroke-width="3.2" fill="none" stroke-linecap="round"/>` +
          `<path d="M${mx + mw * 0.36},${my + mh * 0.8} Q${mx + mw / 2},${my + mh * 0.9} ${mx + mw * 0.64},${my + mh * 0.8}" stroke="${F.lip}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "cap-face"); svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        svg.innerHTML = `<defs><filter id="cf${i}" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="1.2"/></filter></defs>` +
          F.eyes.map(lid).join("") + shut;
        return svg; };
      ["man", "woman", "boy"].forEach((name, i)=>{ const F = FACE[name], [ , , w, h] = CAP_SHOP_FIG.chars[name];
        const svg = makeFace(F, i, w, h); CUST[i].querySelector(".cap-body").appendChild(svg); CUST[i].face = svg;
        // blink every 2.5–5.5 s, each customer on their own rhythm (sometimes a double blink) — whichever face they wear now
        const blink = ()=>{ if(!ctx.alive()) return; const f = CUST[i].face; f.classList.remove("blink"); void f.getBoundingClientRect(); f.classList.add("blink");
          if(Math.random() < 0.18) setTimeout(()=>{ if(ctx.alive()){ const g = CUST[i].face; g.classList.remove("blink"); void g.getBoundingClientRect(); g.classList.add("blink"); } }, 260);
          faceTimers.push(setTimeout(blink, 2500 + Math.random() * 3000)); };
        faceTimers.push(setTimeout(blink, 900 + i * 1100 + Math.random() * 800)); });
      // preload the holding-the-bottle art so the swap is instant
      ["man", "woman", "boy"].forEach(n => { const im = new Image(); im.src = IMG["cap_shop_" + n + "_hold"] || ("assets/Images/cap_shop_" + n + "_hold.png"); });
      // swap customer i to the holding-the-bottle art + its face
      const wearHold = (i)=>{ const name = ["man", "woman", "boy"][i], [ , , w, h] = CAP_SHOP_FIG.chars[name], body = CUST[i].querySelector(".cap-body");
        body.querySelector("img").src = IMG["cap_shop_" + name + "_hold"] || ("assets/Images/cap_shop_" + name + "_hold.png");
        const nf = makeFace(FACE_HOLD[name], i + 3, w, h); CUST[i].face.replaceWith(nf); CUST[i].face = nf; };
      // lips: while a customer speaks, flap between the painted open smile and the closed overlay (speech rhythm)
      let lipTimer = null;
      const talk = (c, on)=>{ clearTimeout(lipTimer); const f = c.face; if(!f) return;
        if(!on){ f.classList.remove("shut"); return; }
        const flap = ()=>{ if(!ctx.alive() || !c.classList.contains("talking")){ f.classList.remove("shut"); return; }
          f.classList.toggle("shut"); lipTimer = setTimeout(flap, 80 + Math.random() * 110); };
        flap(); };
      const front = document.createElement("img"); front.className = "cap-shop-front"; front.alt = "";
      front.src = IMG.cap_shop_front || "assets/Images/cap_shop_front.png"; scene.appendChild(front);
      const arrived = [false, false, false], onArrive = [null, null, null];
      const started = [false, false, false];
      /* CUSTOMER MOTION — one continuous, frame-driven animator per customer (no CSS hand-offs, so nothing
         jumps): walk in → brake → settle → breathe, with talking blended in and out.
         · speed follows a smooth profile: eased start, cruise, and a braking curve on the distance left
         · steps are tied to DISTANCE walked (stride px), so the body never skates; two soft bobs per stride
           (a rounded cosine wave — no bounce spike at the footfall)
         · lean + hip-sway go through a spring, so the recovery to upright when they stop is one flowing motion
         · talking and breathing are amplitudes that ease toward their target, so starting/stopping is smooth
         Legs are hidden by the counter, so the body carries the walk. Per-person gait below. */
      const GAIT = [ { v: 430, stride: 330, bob: 9,  sway: 1.2, lean: 2.6, vol: 1 },      // man: steady, long stride
                     { v: 400, stride: 280, bob: 8,  sway: 1.8, lean: 2.0, vol: .8 },     // woman: lighter, more hip sway
                     { v: 520, stride: 250, bob: 13, sway: 1.5, lean: 3.4, vol: .7 } ];   // boy: quicker, bouncier
      const smooth = (x)=> x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
      const M = CUST.map((c, i)=>{ const G = GAIT[i], D = 1920 - CAP_SHOP_FIG.chars[["man", "woman", "boy"][i]][0] + 60;
        c.style.transition = "none"; c.style.transform = `translate3d(${D}px,0,0)`;
        return { c, body: c.querySelector(".cap-body"), G, D, x: D, speed: 0, phase: 0, t: 0, rot: 0, rotV: 0,
                 mode: "wait", stopAt: 0, talk: 0, breathe: 0, lastFoot: 0 }; });
      let motionT0 = null, motionLast = 0;
      const motion = (now)=>{
        if(!ctx.alive()) return;
        if(motionT0 == null){ motionT0 = now; motionLast = now; }
        const dt = Math.min(0.05, (now - motionLast) / 1000), T = (now - motionT0) / 1000; motionLast = now;
        M.forEach((m, i)=>{
          const G = m.G;
          if(m.mode === "walk"){
            m.t += dt;
            const brakeD = G.v * 0.62;                                     // start braking this far out
            const want = G.v * Math.min(smooth(m.t / 0.7), Math.sqrt(Math.max(0, m.x) / brakeD));
            m.speed += (Math.max(want, m.x > 1 ? 24 : 0) - m.speed) * Math.min(1, dt * 9);   // eased speed (continuous)
            m.x = Math.max(0, m.x - m.speed * dt);
            m.phase += m.speed * dt / G.stride;                             // steps follow the ground covered
            const foot = Math.floor(m.phase * 2);                           // two footfalls per stride
            if(foot !== m.lastFoot && m.speed > G.v * 0.12){ m.lastFoot = foot; capSfxStep(G.vol * (0.45 + 0.55 * m.speed / G.v)); }
            if(m.x <= 0.5 && m.speed < 30){ m.x = 0; m.speed = 0; m.mode = "settle"; m.stopAt = T;
              m.c.classList.remove("walking"); m.c.classList.add("arrived"); }
          }
          if(m.mode === "leave"){                                            // served: walks back out of the frame (right)
            m.t += dt;
            m.speed += (G.v * smooth(m.t / 0.8) - m.speed) * Math.min(1, dt * 9);
            m.x += m.speed * dt; m.phase += m.speed * dt / G.stride;
            const foot = Math.floor(m.phase * 2);
            if(foot !== m.lastFoot && m.speed > G.v * 0.12){ m.lastFoot = foot; capSfxStep(G.vol * (0.45 + 0.55 * m.speed / G.v)); }
            if(m.x >= m.D){ m.mode = "gone"; m.speed = 0; m.c.style.display = "none"; }
          }
          if(m.mode === "settle" && T - m.stopAt > 0.45){ m.mode = "idle";
            arrived[i] = true; if(onArrive[i]){ const f = onArrive[i]; onArrive[i] = null; f(); } }
          const k = m.speed / G.v;                                           // 0..1 how fast they are walking
          // body pose
          const bob = -G.bob * k * (1 - Math.cos(4 * Math.PI * m.phase)) / 2;    // two rounded bobs per stride
          const swayTarget = G.sway * k * Math.sin(2 * Math.PI * m.phase);
          const rotTarget = (m.mode === "leave" ? 1 : -1) * G.lean * k + swayTarget;   // leans into the way they walk
          const K = 70, C = 11;                                               // spring: gentle, very slight overshoot
          m.rotV += ((rotTarget - m.rot) * K - m.rotV * C) * dt; m.rot += m.rotV * dt;
          m.talk += ((m.c.classList.contains("talking") ? 1 : 0) - m.talk) * Math.min(1, dt * 6);
          m.breathe += ((m.mode === "walk" || m.mode === "leave" ? 0 : 1) - m.breathe) * Math.min(1, dt * 2.5);
          const br = Math.sin(2 * Math.PI * (T + i * 0.9) / 3.4);             // slow breathing
          const tk = Math.sin(2 * Math.PI * T * 1.7);
          const ct = m.catchAt ? performance.now() / 1000 - m.catchAt : 9;      // catch: a quick dip as the bottle lands
          const dip = ct < 0.55 ? 14 * Math.sin(Math.PI * ct / 0.55) * (1 - ct / 0.55) : 0;
          const y = bob + dip - m.breathe * 1.6 * (br + 1) / 2 - m.talk * 2.6 * (1 - Math.cos(2 * Math.PI * T * 1.7)) / 2;
          const r = m.rot - m.talk * 0.5 * tk;
          const sy = 1 + m.breathe * 0.006 * (br + 1) / 2;
          m.c.style.transform = `translate3d(${m.x.toFixed(2)}px,0,0)`;
          m.body.style.transform = `translate3d(0,${y.toFixed(2)}px,0) rotate(${r.toFixed(3)}deg) scale(1,${sy.toFixed(4)})`;
        });
        requestAnimationFrame(motion);
      };
      requestAnimationFrame(motion);
      const walkOut = (i)=>{ const m = M[i]; if(m.mode === "leave" || m.mode === "gone") return;
        m.mode = "leave"; m.t = 0; m.c.classList.remove("arrived", "talking"); m.c.classList.add("walking"); };
      const walkIn = (i)=>{ if(i >= 3 || started[i]) return; started[i] = true;
        const m = M[i]; m.mode = "walk"; m.t = 0; m.c.classList.add("walking"); };
      const whenArrived = (i, fn)=>{ if(arrived[i]) fn(); else onArrive[i] = fn; };
      let walking = false; const startWalk = ()=>{ if(walking) return; walking = true; walkIn(0); };
      const artVessel = (key, w, level)=> capArtVessel(key, { w, level: level == null ? 1 : level, liquid: d.liquid, art: CAP_SHOP_ART });
      // ---- the three bottles, at their Figma positions ----
      const V = {};
      d.vessels.forEach(spec => { const A0 = CAP_SHOP_ART[spec.art];
        const v = artVessel(spec.art, A0.vb[0], 0); scene.appendChild(v.el); v.place(A0.fig[0], A0.fig[1]); v.spec = spec; v.top = capShopTop(v, spec.art); v.top.cork(false);   // every bottle on the counter wears its cork   // empty until measured
        const hit = document.createElement("div"); hit.className = "cap-hit";
        hit.style.left = (v.x - 18) + "px"; hit.style.top = (v.y - 18) + "px";
        hit.style.width = (v.w + 36) + "px"; hit.style.height = (v.h + 30) + "px"; scene.appendChild(hit); v.hit = hit;
        V[spec.key] = v; });
      const TV = d.vessels.map(s => V[s.key]).find(v => v.spec.glasses === d.target);   // the right answer
      // speech bubbles above the three customers (Figma: man in turban / woman / boy)
      const bubbles = [{ x: 820, y: 230 }, { x: 1228, y: 236 }, { x: 1548, y: 232 }].map((p, i)=>{
        const b = document.createElement("div"); b.className = "cap-bubble"; b.style.left = p.x + "px"; b.style.top = p.y + "px";
        b.innerHTML = `<span class="n">${d.wants[i]}</span> गिलास`; return b; });
      let phase = "intro", attempts = 0, onlyRight = false, busy = false;
      const measured = new Set();
      const next = ()=> d.vessels.map(s => V[s.key]).find(v => !measured.has(v.spec.key));
      const idle = capIdle(ctx, d.idle_ms || 7000, ()=>{ if(busy) return;
        if(phase === "measure"){ const n = next(); if(n) capPoint(n.hit); }
        else if(phase === "pick" && onlyRight) capPoint(TV.hit); });
      // ---- pouring view (Figma "puring view") ----
      /* measuring (Figma "puring view"): the EMPTY bottle + five glasses FULL of milk. The child taps the glasses
         one by one; each lifts, pours into the bottle and goes back empty. When the bottle is full the remaining
         glasses stay full (they don't fit) — the count of emptied glasses IS the bottle's capacity. */
      const measure = (v)=>{
        busy = true; idle.stop(); stopNudge();
        const view = document.createElement("div"); view.className = "cap-pourview";
        view.innerHTML = `<img class="cap-scene-bg" src="${IMG.cap_shop_pour || "assets/Images/cap_shop_pour.jpg"}" alt="">`;
        scene.appendChild(view); requestAnimationFrame(()=> view.classList.add("show"));
        const PB = CAP_SHOP_FIG.pour_bottle, A0 = CAP_SHOP_ART[v.spec.art];
        const k = (PB[3] - PB[1]) / (A0.vb[1] - 4);                       // Figma: the pouring bottle is the order bottle ×k
        const bv = artVessel(v.spec.art, A0.vb[0] * k, 0); view.appendChild(bv.el); const bvTop = capShopTop(bv, v.spec.art); bvTop.cork(false); ctx.after(650, ()=> bvTop.uncork());   // cork out, ready to fill
        bv.place((PB[0] + PB[2]) / 2 - bv.w / 2, PB[3] - bv.h + 4);
        const gl = CAP_SHOP_FIG.glass_slots.map(sl => { const g = capArtVessel("shopglass", { w: CAP_SHOP_ART.shopglass.vb[0], level: 1, liquid: d.liquid, art: CAP_SHOP_ART });
          view.appendChild(g.el); return g.place(sl[0] - 2, sl[1] - 2); });
        const n = v.spec.glasses; let poured = 0, pouring = false, done = false;
        const nextGlass = ()=> gl.find(g => !g.used);
        const gIdle = capIdle(ctx, d.idle_ms || 7000, ()=>{ if(!done && !pouring){ const g = nextGlass(); if(g) capPoint(g.el); gIdle.arm(); } });
        const close = ()=>{ gIdle.stop(); view.classList.remove("show"); ctx.after(380, ()=>{ view.remove();
          v.set(1); v.top.cork(false);                                       // back at the counter the bottle is full (corked)
          const chip = document.createElement("div"); chip.className = "cap-chip " + v.spec.key; chip.textContent = v.spec.label;
          chip.style.left = (v.x + v.w / 2) + "px"; chip.style.top = (v.y + v.h + 10) + "px"; scene.appendChild(chip);
          measured.add(v.spec.key); v.el.classList.add("cap-ok"); busy = false;
          if(measured.size === d.vessels.length){ setTimeout(()=> v.el.classList.remove("cap-ok"), 900); ctx.after(500, startPick); }
          else { ctx.after(900, ()=> v.el.classList.remove("cap-ok")); idle.arm(); } }); };
        const finish = ()=>{ done = true; stopNudge();
          gl.forEach(g => { g.el.classList.remove("tappable"); if(!g.used) g.el.classList.add("cap-spare"); });   // these did not fit
          capFlash(bv.el, "cap-hl", 1200); ctx.after(250, ()=> bvTop.cork(true));   // full: the cork goes in
          ctx.after(900, ()=> ctx.say(v.spec.result, null, ()=> ctx.after(600, close))); };
        gl.forEach(g => { g.el.classList.add("tappable");
          g.el.onclick = ()=>{ if(done || pouring || g.used) return; stopNudge(); gIdle.stop(); sfxTap();
            pouring = true; g.used = true; poured++; g.el.classList.remove("tappable");
            SwiftPAL.emit("count_tap", { slide_id: slide.id, phase: slide.phase, vessel: v.spec.key, n: poured });
            const last = poured >= n;
            capRealPour(ctx, g, bv, { dir: -1, high: true, ceil: 200, chime: last, srcTo: 0, dstFrom: (poured - 1) / n, dstTo: poured / n, ms: 1400, tilt: [50, 100], dx: 36,   /* less tip, lip a little right of the mouth centre: the glass fits between the title and the bottle (no overlap) */
              onDone: ()=>{ pouring = false; capBadge(g, poured); capFlash(g.el, "cap-hl", 700);
                if(last) finish(); else { const nx = nextGlass(); if(nx) capPoint(nx.el); gIdle.arm(); } } }); }; });
        ctx.say(measured.size === 0 ? A.tap_vessel : null, null, ()=>{ if(!poured && !done){ capPoint(gl[0].el); gIdle.arm(); } });
        ctx.replayFn = ()=>{ if(!pouring && !done) ctx.say(A.tap_vessel); };
      };
      // ---- deliver: drag each FULL bottle to the customer who asked for that many glasses ----
      const NAMES = ["man", "woman", "boy"];
      const custRect = (ci)=>{ const [x, y, w, h] = CAP_SHOP_FIG.chars[NAMES[ci]]; return { x, y, w, h }; };
      const wantOf = (v)=> d.wants.indexOf(v.spec.glasses);              // index of the customer who wants this bottle
      const delivered = new Set(), gone = new Set(); let wrongTotal = 0;
      const dragHand = document.createElement("img"); dragHand.className = "cap-drag-hand"; dragHand.src = "assets/UI/nudge_hand_new.svg"; dragHand.alt = "";
      dragHand.style.display = "none"; scene.appendChild(dragHand);
      const showDrag = (v)=>{ const r = custRect(wantOf(v));                 // a hand demonstrates the drag (bottle → customer)
        const fx = v.x + v.w / 2 - 60, fy = v.y + v.h * 0.45, tx = r.x + r.w / 2 - 60, ty = r.y + r.h * 0.55;
        dragHand.style.transition = "none"; dragHand.style.left = fx + "px"; dragHand.style.top = fy + "px"; dragHand.style.opacity = "1"; dragHand.style.display = "block";
        ctx.after(350, ()=>{ dragHand.style.transition = "left 1.2s ease-in-out, top 1.2s ease-in-out, opacity .3s"; dragHand.style.left = tx + "px"; dragHand.style.top = ty + "px"; });
        ctx.after(1800, ()=>{ dragHand.style.opacity = "0"; }); ctx.after(2200, ()=>{ dragHand.style.display = "none"; }); };
      const nextToDeliver = ()=> d.vessels.map(s => V[s.key]).find(v => !delivered.has(v.spec.key));
      const pIdle = capIdle(ctx, d.idle_ms || 7000, ()=>{ if(busy || phase !== "pick") return; const v = nextToDeliver(); if(v) showDrag(v); pIdle.arm(); });
      const custGlow = (ci, on)=> CUST[ci].classList.toggle("cap-target-cust", on);
      const allDone = ()=>{ phase = "done"; pIdle.stop(); stopNudge();
        sfxCorrect(); confettiCannon(); setSwMood("happy");
        SwiftPAL.emit("shop_pick_first_try", { slide_id: slide.id, phase: slide.phase, value: wrongTotal === 0, attempts: wrongTotal + 1 });
        state.masteryAttempts++; if(wrongTotal === 0) state.masteryHits++;
        const okId = wrongTotal === 0 ? A.ok : A.ok + "2";   // "शाबाश!" only when every bottle went right first time
        ctx.replayFn = ()=> ctx.say(okId);
        // no Next button here: once the praise has played AND every customer has walked out of the frame,
        // the game moves on to the next screen by itself
        ctx.say(okId, null, ()=>{ setSwMood("point");
          const next = ()=>{ if(M.some(m => m.mode !== "gone")){ ctx.after(250, next); return; }
            ctx.after(700, ()=> completeSlide(true)); };
          next(); }); };
      /* correct drop: the customer CATCHES the bottle — it flies in a short arc from where it was dropped into
         their hands (chest height, in front of the body), they give a little catch-dip, say thanks, and walk out
         of the frame still holding it (the bottle becomes part of the customer's body, so it moves with them). */
      const deliver = (v, ci, dx, dy)=>{ delivered.add(v.spec.key); v.el.classList.remove("draggable", "cap-hl-loop", "dragging"); custGlow(ci, false);
        const r = custRect(ci), chip = scene.querySelector(".cap-chip." + v.spec.key); if(chip) chip.style.opacity = "0";
        const bub = scene.querySelectorAll(".cap-bubble")[ci]; if(bub) bub.classList.add("done");
        SwiftPAL.emit("shop_deliver", { slide_id: slide.id, vessel: v.spec.key, customer: NAMES[ci] });
        busy = true; sfxTap();
        const BX = FACE_HOLD[NAMES[ci]].bottle, HOLD = BX[3] / v.h;          // lands exactly on the bottle painted in their hands
        const x0 = v.x + (dx || 0), y0 = v.y + (dy || 0);                   // where it was dropped (scene px)
        const hx = r.x + BX[0] + BX[2] / 2 - v.w * HOLD / 2, hy = r.y + BX[1];
        v.el.style.transition = "none"; v.el.style.transformOrigin = "0 0"; v.el.style.zIndex = "9";
        const D = 560, peak = 120; let t0 = null;
        const fly = (now)=>{ if(!ctx.alive()) return; if(t0 == null) t0 = now;
          const p = Math.min(1, (now - t0) / D), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          const x = x0 + (hx - x0) * e, y = y0 + (hy - y0) * e - peak * Math.sin(Math.PI * p), sc = 1 + (HOLD - 1) * e, rot = 10 * Math.sin(Math.PI * p);
          v.el.style.transform = `translate(${(x - v.x).toFixed(1)}px,${(y - v.y).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
          if(p < 1){ requestAnimationFrame(fly); return; }
          // caught: the customer changes to the "holding the bottle" art (the flying bottle becomes the painted one)
          v.el.style.display = "none"; wearHold(ci);
          M[ci].catchAt = performance.now() / 1000; capSfxClink();
          CUST[ci].classList.add("talking"); talk(CUST[ci], true);
          ctx.say(A.thanks[ci], null, ()=>{ CUST[ci].classList.remove("talking"); talk(CUST[ci], false);
            gone.add(ci); if(bub){ bub.style.transition = "opacity .35s"; bub.style.opacity = "0"; }
            walkOut(ci);                                                       // ...and walks out of the frame with it
            ctx.after(900, ()=>{ busy = false; if(delivered.size === d.vessels.length) allDone(); else pIdle.arm(); }); }); };
        requestAnimationFrame(fly); };
      const wrongDrop = (v, springBack)=>{ v.wrong = (v.wrong || 0) + 1; wrongTotal++; state.attempts = wrongTotal;
        springBack(); sfxWrongSoft(); setSwMood("tryagain"); capFlash(v.el, "cap-pulse", 1400);
        SwiftPAL.emit("answer_wrong", { slide_id: slide.id, phase: slide.phase, attempts: v.wrong, vessel: v.spec.key });
        busy = true;
        if(v.wrong === 1) ctx.say(A.w1, null, ()=>{ busy = false; pIdle.arm(); });
        else { state.scaffoldLevel = 3; const ci = wantOf(v);
          ctx.say(A.w2[String(v.spec.glasses)], { show: ()=>{ custGlow(ci, true); showDrag(v); } },
            ()=>{ busy = false; custGlow(ci, true); showDrag(v); pIdle.arm(); }); } };
      const makeDraggable = (v)=>{
        v.el.classList.add("draggable");
        v.el.addEventListener("pointerdown", (e)=>{
          if(phase !== "pick" || busy || delivered.has(v.spec.key)) return;
          e.preventDefault(); pIdle.stop(); stopNudge(); dragHand.style.display = "none";
          const sc = scene.getBoundingClientRect().width / 1920;            // screen px per scene px
          const sx = e.clientX, sy = e.clientY; let dx = 0, dy = 0;
          try{ v.el.setPointerCapture(e.pointerId); }catch(_){}
          v.el.style.transition = "none"; v.el.classList.add("dragging"); sfxTap();
          const over = ()=>{ const cx = v.x + v.w / 2 + dx, cy = v.y + v.h / 2 + dy;   // which customer is under the bottle
            for(let ci = 0; ci < 3; ci++){ if(gone.has(ci)) continue; const r = custRect(ci); if(cx > r.x && cx < r.x + r.w && cy > r.y - 40 && cy < 900) return ci; }
            return -1; };
          const mv = (ev)=>{ dx = (ev.clientX - sx) / sc; dy = (ev.clientY - sy) / sc;
            v.el.style.transform = `translate(${dx}px,${dy}px) scale(1.06)`;
            const ci = over(); CUST.forEach((c, k)=> c.classList.toggle("cap-hover-cust", k === ci)); };
          const up = ()=>{ v.el.removeEventListener("pointermove", mv); v.el.removeEventListener("pointerup", up); v.el.removeEventListener("pointercancel", up);
            v.el.classList.remove("dragging"); CUST.forEach(c => c.classList.remove("cap-hover-cust"));
            const ci = over();
            const springBack = ()=>{ v.el.style.transition = "transform .45s cubic-bezier(.3,1.4,.5,1)"; v.el.style.transform = ""; };
            if(ci === -1){ springBack(); pIdle.arm(); return; }              // dropped on nothing: just goes back
            if(ci === wantOf(v)) deliver(v, ci, dx, dy); else wrongDrop(v, springBack); };
          v.el.addEventListener("pointermove", mv); v.el.addEventListener("pointerup", up); v.el.addEventListener("pointercancel", up);
        }); };
      const startPick = ()=>{ phase = "pick"; $("promptText").textContent = slide.ask_prompt_hi || slide.prompt_hi;
        d.vessels.forEach(s => { const v = V[s.key]; v.hit.style.display = "none"; makeDraggable(v); });   // bottles take the pointer now
        ctx.replayFn = ()=>{ if(!busy && phase === "pick") ctx.say(A.q); };
        busy = true; ctx.say(A.q, null, ()=>{ busy = false; const v = nextToDeliver(); if(v) showDrag(v); pIdle.arm(); }); };
      d.vessels.forEach(spec => { const v = V[spec.key];
        v.hit.onclick = ()=>{
          if(busy) return;
          if(phase === "measure"){ if(measured.has(spec.key)) return; sfxTap(); measure(v); }
        }; });
      // ---- intro: narration → the three customers ask → "tap all three vessels" ----
      const customer = (i)=>{ if(i >= 3){ ctx.after(300, ()=> ctx.say(A.tap_all, { vessels: ()=> d.vessels.forEach(s => capFlash(V[s.key].el, "cap-hl", 1600)) }, ()=>{
          phase = "measure"; setSwMood("point"); const n = next(); if(n) capPoint(n.hit); idle.arm();
          ctx.replayFn = ()=>{ if(!busy && phase === "measure") ctx.say(A.tap_all); }; })); return; }
        walkIn(i);   // one at a time: this customer walks in only after the previous one has ordered
        whenArrived(i, ()=>{ scene.appendChild(bubbles[i]); CUST[i].classList.add("talking"); talk(CUST[i], true);
          ctx.say(A.customers[i], null, ()=>{ CUST[i].classList.remove("talking"); talk(CUST[i], false); ctx.after(250, ()=> customer(i + 1)); }); }); };
      // "…तभी तीन लोग दूध लेने दुकान पर आते हैं" — they walk in one by one from that word; each orders on arrival
      ctx.say(A.intro, { people: startWalk }, ()=>{ startWalk(); ctx.after(300, ()=> customer(0)); });
    }
  }

});

/* ---------- 13. CONTROLLER ---------- */
/* r4: gold star burst for the celebration finale (adopted from Shruti's build) */
function starBurst(){
  if(document.documentElement.classList.contains("no-anim")) return;
  const host = $("confetti"); if(!host) return;
  const cv = document.createElement("canvas");
  cv.width = 1333; cv.height = 750;
  cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
  host.appendChild(cv);
  const ctx = cv.getContext("2d");
  const COLORS = ["#FFE400","#FFBD00","#E89400","#FFCA6C","#FDFFB8"];
  const TICKS = 100, DECAY = 0.96, START_V = 22;
  const parts = [];
  function starPath(r){
    ctx.beginPath();
    for(let i=0;i<10;i++){
      const rad = (i % 2 === 0) ? r : r/2;
      const a = Math.PI/5*i - Math.PI/2;
      ctx[i === 0 ? "moveTo" : "lineTo"](Math.cos(a)*rad, Math.sin(a)*rad);
    }
    ctx.closePath();
  }
  function shoot(){
    const add = (n, scalar, shape) => {
      for(let i=0;i<n;i++){
        const a = Math.random()*Math.PI*2;
        parts.push({ x:cv.width/2, y:cv.height/2, ax:Math.cos(a), ay:Math.sin(a),
          vel:START_V*(0.5 + Math.random()), tick:0, scalar, shape,
          color:COLORS[Math.floor(Math.random()*COLORS.length)],
          rot:Math.random()*Math.PI*2, spin:(Math.random()-.5)*0.3 });
      }
    };
    add(80, 1.8, "star");
    add(20, 1.0, "circle");
  }
  shoot(); setTimeout(shoot, 150); setTimeout(shoot, 300);
  let frames = 0;
  (function frame(){
    ctx.clearRect(0, 0, cv.width, cv.height);
    let alive = false;
    for(const p of parts){
      if(p.tick >= TICKS) continue;
      alive = true;
      p.x += p.ax*p.vel; p.y += p.ay*p.vel; p.vel *= DECAY; p.rot += p.spin; p.tick++;
      ctx.globalAlpha = 1 - p.tick/TICKS;
      ctx.fillStyle = p.color;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      if(p.shape === "star"){ starPath(8*p.scalar); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, 6*p.scalar, 0, Math.PI*2); ctx.fill(); }
      ctx.restore();
    }
    frames++;
    if(alive || frames < 30) requestAnimationFrame(frame);
    else setTimeout(()=> cv.remove(), 300);
  })();
}
function clearHost(){
  document.querySelectorAll("#stage > .cap-scene.full").forEach(n => n.remove());   // [page 11] full-screen scene lives on the stage
  document.body.classList.remove("is-end");   // r4: clear immersive end state when leaving celebration
  /* [28g] "going back from last screen gets swiftie stuck" — clearHost dropped body.is-end but never
     took .show off #endScreen, so the celebration layer (big cheering Swiftie + "बहुत बढ़िया!") stayed
     ON TOP of whatever slide you landed on, covering the middle option card.
     I found this myself earlier tonight and mis-triaged it as low severity — "a child can never go back
     from celebration" — forgetting that REVIEW uses the dev nav, so it hits every review pass. It also
     produced 60 phantom overlap findings in my own audit sweep before I understood it.
     Tear the layer down here, where every slide mount already passes.
     Scoped to the END SCREEN only, on purpose: I first also cleared stage.blurred/gating and the
     phase gate here, but mountSlide runs INSIDE the gate's callback, so that would have un-blurred
     the gray gate mid-flight — breaking the transition built two bumps ago to fix a different report. */
  const _es = $("endScreen");
  if(_es) _es.classList.remove("show", "hint-glow");
  $("slideHost").innerHTML = "";
  $("hintBtn").classList.remove("show");
  $("hintBtn").disabled = false;
  setNavActive(false);
  stopNudge();
  resetIdleVo();   // [27b] no idle-replay timer survives into the next slide; [27f] and the next
                   // slide gets its own single reminder (teardown is the one place the fired flag clears)
  stopAudio();
}

function mountSlide(idx){
  state.idx = idx;
  state.slideStart = Date.now();
  state.attempts = 0; state.selectedKey = null; state.locked = false;
  state.hintUsed = false; state.nudgeUsed = false; state.scaffoldLevel = 0; state.hintActive = false; state.helpShown = false;
  state.audioReplays = 0; state.gateNavUntilAudio = false; state.endBtnPending = false;
  state.replayAudio = null;   // a module may set a slide-specific replay (e.g. teach slides whose
                              // audio roles aren't in the autoPlayChain order); else the chip replays the chain
  state.ownsAudio = false;    // a module that drives its OWN audio sequence sets this → skip autoPlayChain
                              // (else the auto prompt-chain stomps/truncates the module's timed VO)
  state.revealing = false;    // [24a N8] true while a reveal_seq/sortSeqReveal is mid-flight (blocks replay + drag)
  state.demoRunning = false;  // [24a N8] true while a self-driving teach chain runs (blocks the replay chips)
  resetWrongLadder();         // [LOCAL 2026-08-03] hint ladder starts at rung 1 on EVERY entry, incl. a re-entry
  const slide = CARD.slides[idx];
  clearHost();

  // header prompt
  $("promptText").textContent = slide.prompt_hi || "";

  // Hint button stays HIDDEN until the learner makes a wrong attempt, then it is
  // exposed (graduated scaffold). Mastery uses the SAME scaffold — not excluded.
  $("hintBtn").classList.remove("show");
  $("hintBtn").style.display = "";
  /* [LOCAL 2026-08-03] Yasir: remove आगे entirely on practice + guided. Every mechanic this game
     uses in those phases (TAP_LETTER_BY_PICTURE / TAP_PICTURE_BY_LETTER via mountTapOptions,
     MATCH_DRAG_N, SEQUENCE_COMPLETE) already auto-advances on its own through celebrateThenAdvance /
     completeSlide(true) — आगे was never the way forward there, just a permanently-disabled pill
     sitting on screen (setNavActive(true) is never called by any of them). Tutorial keeps it: those
     STORY_SCENE teach beats genuinely gate on a tap to move to the next scene. */
  $("navBtn").style.display = (slide.phase === "guided" || slide.phase === "practice") ? "none" : "";
  // [16i] DEFAULT nav wiring — a module that enables आगे without overriding onclick still advances.
  // (DEMO_COUNT shipped an enabled-but-dead button; auto-INTRO inherited an unfulfillable tap guard.)
  $("navBtn").onclick = ()=> completeSlide(true);
  setSwMood("point");                    // Swiftie turns to present each new slide

  SwiftPAL.emit("slide_entered", { slide_id: slide.id, phase: slide.phase, eis: slide.eis, type: slide.type, idx });

  // audio chip = replay the slide audio. Prefer a module-supplied replay (teach slides own their
  // count_intro/explain sequence, which autoPlayChain deliberately skips), else replay the chain.
  // [24a N7b] navUnlock is defined ONCE so BOTH the mount chain AND every replay re-apply it —
  // otherwise a replay's stopAudio() (echo guard) gen-kills the mount chain's onDone and आगे stays
  // stuck disabled forever (the फिर-सुनो-mid-VO brick on gated teach slides). Also releases a
  // pending celebration end-button for the same reason.
  const navUnlock = ()=>{
    if(state.gateNavUntilAudio) setNavActive(true);
    if(state.endBtnPending){ $("endBtn").classList.add("show","hint-glow"); state.endBtnPending = false; }
  };
  // [24a N8] replay chips ignore taps: while a VO is SOUNDING (a replay can no longer orphan a
  // mid-clip onDone → the "unlock rides the last clip's onEnd" modules can't be bricked); while a
  // reveal_seq/sort reveal runs (no stomping the one-by-one narration); while a self-driving demo
  // chain runs (a replay would gen-kill its chain); and on self-driving slides that offer no replay.
  const replaySlideAudio = ()=>{
    if(isPlaying || state.revealing || state.demoRunning || (state.ownsAudio && !state.replayAudio)) return;
    state.audioReplays++;
    SwiftPAL.emit("audio_replay", { slide_id: slide.id, phase: slide.phase, count: state.audioReplays });
    if(state.replayAudio){ state.replayAudio(); navUnlock(); } else autoPlayChain(slide, navUnlock);
  };
  $("audioChip").onclick = replaySlideAudio;

  // mount the type
  const mod = SlideModules[slide.type];
  if(!mod){ console.error("[engine] no module for", slide.type); return; }
  // [engine JS] r4/F1 TEACHING FRAME: tutorial slides mount inside a grid-paper .tut-card (header hidden,
  // prompt in-card, standing Swiftie bottom-left + shoulder audio chip). Type-agnostic — any tutorial-phase
  // module renders into the card. Non-tutorial slides mount bare into slideHost as before.
  const isTut = (slide.phase === "tutorial" && slide.type !== "PHASE_TRANSITION" && slide.type !== "CELEBRATION");
  $("stage").classList.toggle("tut", isTut);
  document.body.classList.toggle("tut-page", isTut);
  let mountHost = $("slideHost");
  if(isTut){
    const card = document.createElement("div"); card.className = "tut-card";
    card.innerHTML = `<div class="tut-prompt">${slide.prompt_hi || ""}</div>` +
      `<img class="tut-mascot" src="assets/UI/start_mascot.webp" alt="" onerror="this.style.display='none'">` +
      `<span class="tut-audio" role="button" aria-label="फिर से सुनो"><svg viewBox="0 0 62 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Audio"><g filter="url(#tutChipShadow)"><rect x="8" y="4" width="46" height="44" rx="22" fill="url(#tutChipGrad)"/><rect x="6" y="2" width="50" height="48" rx="24" stroke="white" stroke-width="4"/><path d="M29.8466 19.0574C29.8804 19.0524 29.9145 19.0496 29.9487 19.0488C30.6094 19.0317 31.0021 19.5124 31.0015 20.1414C31.0008 20.9661 31.0003 21.7911 31.0005 22.6158L31.001 27.7212L31.0009 30.5591C31.0009 31.0364 31.0122 31.5472 30.9863 32.0228C30.9662 32.2709 30.902 32.4608 30.7251 32.643C30.3831 32.9952 29.8337 33.0842 29.4386 32.7671C29.0784 32.4781 28.7473 32.1159 28.4181 31.7862L26.4414 29.8087C26.1771 29.5426 25.9071 29.2636 25.6339 29.0081C25.0227 28.9649 24.3645 29.017 23.7487 28.9979C23.445 28.9885 23.1625 29.0211 22.8589 28.9606C22.3751 28.8616 22.0618 28.4823 22.0642 27.9824C22.0706 26.5937 22.0287 25.1949 22.0828 23.8081C22.0884 23.6626 22.2302 23.4334 22.3309 23.3252C22.454 23.1907 22.6146 23.0963 22.792 23.0543C23.0567 22.9904 23.5328 23.016 23.8224 23.0128C24.4143 23.0063 25.0171 23.0277 25.609 23.0073C25.6794 22.9529 25.8505 22.7743 25.919 22.706L26.5305 22.0945L28.5396 20.0838C28.9157 19.7059 29.3217 19.1749 29.8466 19.0574Z" fill="white"/><path class="wv wv2" d="M36.2367 18.6905C36.8783 18.6449 37.3041 19.231 37.6725 19.6829C38.7675 21.0046 39.4982 22.5894 39.7923 24.2804C40.2503 26.8763 39.6548 29.5478 38.1378 31.7035C37.8393 32.1274 37.508 32.5324 37.149 32.9063C36.9404 33.1236 36.7646 33.2558 36.4622 33.3081C36.2013 33.3412 35.9378 33.2717 35.7272 33.1144C35.5185 32.9615 35.3816 32.7298 35.3483 32.4733C35.2786 31.9235 35.5696 31.6821 35.8914 31.3297C36.0448 31.1639 36.1901 30.9908 36.3269 30.811C38.3669 28.136 38.4986 24.4654 36.6555 21.6511C36.4826 21.3899 36.2966 21.1376 36.0984 20.8951C35.8252 20.5652 35.3947 20.2691 35.3472 19.8184C35.2845 19.2225 35.6439 18.768 36.2367 18.6905Z" fill="white"/><path class="wv wv1" d="M33.3868 21.5044C33.9769 21.4549 34.2563 21.7845 34.5981 22.1981C35.1982 22.924 35.6149 23.7691 35.8211 24.6886C36.171 26.2384 35.8867 27.8637 35.0314 29.2026C34.7421 29.6568 34.2333 30.3745 33.6937 30.4946C33.1633 30.5437 32.6759 30.2927 32.5495 29.7376C32.3921 29.0462 32.9849 28.6956 33.3274 28.1763C34.2088 26.833 34.1932 25.0908 33.288 23.7635C33.0747 23.4522 32.6159 23.0564 32.5518 22.7133C32.4377 22.1027 32.7745 21.619 33.3868 21.5044Z" fill="white"/></g><defs><filter id="tutChipShadow" x="0" y="0" width="62" height="60" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="4"/><feGaussianBlur stdDeviation="2"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter><linearGradient id="tutChipGrad" x1="8" y1="26" x2="54" y2="26" gradientUnits="userSpaceOnUse"><stop stop-color="#1987FC"/><stop offset="1" stop-color="#1565F4"/></linearGradient></defs></svg></span>`;
    const inner = document.createElement("div"); inner.className = "tut-content";
    card.insertBefore(inner, card.querySelector(".tut-mascot"));
    card.querySelector(".tut-audio").onclick = replaySlideAudio;   // [24a N7b/N8] same guard + navUnlock as the header chip
    $("slideHost").appendChild(card);
    mountHost = inner;
  }
  mod.mount(mountHost, slide);
  // game-feel: animate the slide content in on every mount
  { const _sh = $("slideHost"); _sh.classList.remove("slide-in"); void _sh.offsetWidth; _sh.classList.add("slide-in"); }

  // fit-to-box + vertically ink-centre every Devanagari glyph. SYNC pass first so tiles are
  // correct immediately even when rAF is throttled (background / non-painting tab) or a module
  // built its tiles synchronously at mount; rAF second pass re-fits after slide-in layout +
  // font-load settle. (16n: the lone rAF pass could skip drag-tile / stimulus glyphs — Yasir #6.)
  centerAllGlyphs($("slideHost"));
  requestAnimationFrame(()=>{ centerAllGlyphs($("slideHost")); refreshMatraWords($("slideHost")); });

  // play the full VO chain automatically (prompt → phoneme/word_name → instruction).
  // If the slide gated its nav button on audio, enable it once the chain finishes
  // (so students can't skip before hearing it). SKIP when the module owns its audio
  // (state.ownsAudio) — else this chain stomps/truncates the module's own timed VO.
  if(!state.ownsAudio){
    autoPlayChain(slide, navUnlock);   // [24a N7b] same unlock the replay chips re-apply
  }
  armIdleVo();   // [27b] start the 7s silent-inactivity watch (all four TEST phases; no-op elsewhere)
                 // [27f] fires at most ONCE per slide
}

/* ---------- [engine JS] r4/P1 PHASE-TRANSITION PEEK GATE (Shruti's peek beat) ----------
   An automatic interstitial fired ON A PHASE BOUNDARY (not a slide type): blur the stage, Swiftie
   peeks up from the bottom under a big headline, hold ≥2s, then mount the next slide. Kept ALONGSIDE
   our journey-map PHASE_TRANSITION module (a distinct, author-placed slide type) — the gate below
   skips PHASE_TRANSITION + CELEBRATION so the two never double-fire. */
function afterConfetti(fn){
  // let a correct-answer confetti burst (.conf-shot) finish falling before we move on; 8s hard cap.
  const started = Date.now();
  (function check(){
    if(!document.querySelector(".conf-shot") || Date.now() - started > 8000){ fn(); return; }
    setTimeout(check, 200);
  })();
}
/* onscreen headline per gate (display only; distinct from any narration). Eligibility = phase IN this map. */
/* [27j] THERE ARE THREE ROUNDS, NOT FOUR (Yasir 2026-07-28).
   Round 3 is called `practice` in some cards and `independent` in others — the SAME round under two
   names — so `independent` is an ALIAS of practice and takes the identical headline. The earlier bug
   was that a card naming round 3 `independent` got NO round-3 gate at all (the gate is conditional on
   PHASE_GATE_TITLE[next.phase] existing); the fix is the alias, NOT a fourth gate. My first attempt
   added `independent` with its own wording plus a `mastery` gate — both wrong: distinct wording would
   make one round look like two, and there is no round 4.
   `mastery` is deliberately ABSENT: mastery slides continue round 3 without a transition. That also
   means vo_pt_mastery is never played, so a card shipping it carries dead audio — verify_bundle's
   "silent gates: [vo_pt_mastery]" warn is a CHECKER ARTIFACT, not a defect.
   VO ids stay optional: play() treats a missing clip as a silent beat and the 2s peek still holds. */
const PHASE_GATE_TITLE = { tutorial:"चलिए, शुरू करें!", guided:"चलिए, साथ में करें!",
                           practice:"अब आपकी बारी!", independent:"अब आपकी बारी!" };   // [16h] the lead’s official transition lines (VO = full sentences in the card manifest; NOTE aap-register — flagged)
const PHASE_GATE_VO    = { tutorial:"vo_pt_tutorial", guided:"vo_pt_guided",
                           practice:"vo_pt_practice", independent:"vo_pt_independent" };
/* [28h] which ROUND each phase belongs to — the dedup key for gates. practice === independent === the
   one round 3; `mastery` is absent on purpose (it continues round 3), and so is any future phase name,
   which fails safe to "no gate" rather than to a spurious extra one. */
const PHASE_ROUND = { tutorial:"tutorial", guided:"guided", practice:"round3", independent:"round3" };
const _gatedPhases = new Set();   // each ROUND gate plays ONCE (Start→tutorial, →guided, →round 3)
let _gateToken = 0;
function phaseBlurTransition(cb, toPhase){
  const tok = ++_gateToken;
  stopNudge(); stopAudio();
  const gate = $("phaseGate"), img = $("phaseGateImg");
  if(img) img.src = "assets/UI/peeking.webp?r=" + Date.now();   // restart the loop each time (cache-bust)
  const title = $("phaseGateTitle"); if(title) title.textContent = PHASE_GATE_TITLE[toPhase] || "";
  $("stage").classList.add("blurred", "gating");
  document.body.classList.add("gating");
  gate.classList.add("show","hint-glow");
  SwiftPAL.emit("phase_transition", { to: toPhase });
  const closeGate = ()=>{ gate.classList.remove("show"); $("stage").classList.remove("blurred", "gating"); document.body.classList.remove("gating"); };
  // VO only if the card actually ships it; else a silent beat — the 2s min-hold keeps the peek visible.
  const voId = PHASE_GATE_VO[toPhase];
  const voSrc = voId ? ("assets/Audio/" + voId + "." + AUDIO_EXT) : null;   // [20a] use AUDIO_EXT path so generated clips resolve (was: assets.audio .mp3 map -> silent)
  const openedAt = Date.now();
  play(voSrc, ()=>{
    if(tok !== _gateToken){ closeGate(); return; }               // a newer gate superseded us
    const hold = Math.max(200, 2000 - (Date.now() - openedAt));  // Swiftie peeks ≥2s even with no/short VO
    setTimeout(()=>{
      if(tok !== _gateToken){ closeGate(); return; }
      gate.classList.remove("show");
      $("stage").classList.remove("blurred");
      if(cb) cb();                              // mounts the next slide
      $("stage").classList.remove("gating");    // header returns once the slide is in
      document.body.classList.remove("gating");
    }, hold);
  });
}

function completeSlide(success){
  const slide = CARD.slides[state.idx];
  SwiftPAL.emit("slide_completed", {
    slide_id: slide.id, phase: slide.phase, success: !!success,
    attempts: state.attempts, latency_ms: Date.now()-state.slideStart,
    scaffold_level: state.scaffoldLevel, hint_used: state.hintUsed,
    nudge_used: state.nudgeUsed, audio_replays: state.audioReplays
  });
  if(state.idx >= CARD.slides.length - 1){
    // last slide is CELEBRATION; nothing more
    return;
  }
  // advance only AFTER the correct-answer confetti has landed (to the gate AND to the next slide alike).
  const fromIdx = state.idx, nextIdx = state.idx + 1;
  const next = CARD.slides[nextIdx];
  /* [28h] ONE GATE PER ROUND, NOT PER PHASE NAME.
     `independent` and `practice` are two names for round 3 (Yasir 2026-07-28), so a card that uses
     BOTH crossed two "different phases" and got the identical 'अब आपकी बारी!' gate TWICE, back to
     back — the alias fixed the missing gate and introduced a duplicate one. Deduping by ROUND instead
     of by phase string collapses that pair, and a phase with no round (mastery) still gets no gate,
     which is the ruling: three rounds, no round 4. */
  const nextRound = PHASE_ROUND[next && next.phase], curRound = PHASE_ROUND[slide.phase];
  if(next && nextRound && nextRound !== curRound
     && next.type !== "CELEBRATION" && next.type !== "PHASE_TRANSITION"
     && PHASE_GATE_TITLE[next.phase] && !_gatedPhases.has(nextRound)){
    _gatedPhases.add(nextRound);
    afterConfetti(()=>{ if(state.idx === fromIdx) phaseBlurTransition(()=> mountSlide(nextIdx), next.phase); });
    return;
  }
  afterConfetti(()=>{ if(state.idx === fromIdx) mountSlide(nextIdx); });
}

/* ---------- 14. VALIDATOR (runtime self-check) ---------- */
function runValidator(){
  const missing = (CARD.signals_expected || []).filter(s => !SwiftPAL.firedSet.has(s));
  SwiftPAL.validatorReport.missing_signals = missing;
  SwiftPAL.validatorReport.passed = missing.length === 0;
  console.log("[validator]", SwiftPAL.validatorReport);
  try{ window.parent?.postMessage({type:"swiftpal:lesson_complete", signals: SwiftPAL.signals, validatorReport: SwiftPAL.validatorReport}, "*"); }catch(e){}
  // offline self-capture: write the final record to localStorage; optionally POST
  // it to a learning-record endpoint if one is configured AND the device is online.
  SwiftPAL.persist();
  if(TELEMETRY.endpoint && navigator.onLine){
    try{ fetch(TELEMETRY.endpoint, {method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(SwiftPAL.exportResults()), keepalive:true}).catch(()=>{}); }catch(e){}
  }
  // dev banner
  if(new URLSearchParams(location.search).has("dev")){
    const b = $("devBanner");
    if(missing.length === 0){ b.textContent = "✓ all expected signals fired"; b.className = "dev-banner show ok"; }
    else { b.textContent = "✗ missing signals: " + missing.join(", "); b.className = "dev-banner show"; }
  }
}

/* ---------- [engine JS] r4/#2 DATA-DRIVEN LANDING CONCEPT STRIP ----------
   A landing_hero of kind "concept_strip" renders N visual-example tiles from card data, so any game
   declares its landing preview in card.json instead of hand-editing HTML. Tile types: discs (size),
   bars (length), balance (weight — equal-size objects, heavier lower, never a size cue), image. */
const SG_BALANCE_SVG =
  '<svg viewBox="0 0 124 112" xmlns="http://www.w3.org/2000/svg">' +
  '<line x1="62" y1="30" x2="62" y2="86" stroke="#8AA0C8" stroke-width="6" stroke-linecap="round"/>' +
  '<polygon points="62,60 44,100 80,100" fill="#8AA0C8"/>' +
  '<g transform="rotate(-13 62 34)">' +
  '<rect x="14" y="30" width="96" height="11" rx="5.5" fill="#4EA3F0"/>' +
  '<circle cx="22" cy="20" r="14" fill="#FBD24B" stroke="#D9A21A" stroke-width="2.5"/>' +
  '<circle cx="102" cy="20" r="14" fill="#98A2B3" stroke="#5B6577" stroke-width="2.5"/>' +
  '</g></svg>';
function conceptTileHTML(c){
  const lbl = c && c.label ? ` aria-label="${c.label}"` : "";   // a11y only; not shown (pre-reader → visual+VO)
  switch(c && c.type){
    case "discs": {
      const sizes = c.sizes || [34, 54, 76];
      return `<div class="sg-ex sg-ex-size" role="img"${lbl}>` +
        sizes.map(s => `<span class="sg-disc" style="width:${s}px;height:${s}px"></span>`).join("") + `</div>`;
    }
    case "bars": {
      const widths = c.widths || [42, 72, 102];
      return `<div class="sg-ex sg-ex-len" role="img"${lbl}>` +
        widths.map(w => `<span class="sg-bar" style="width:${w}px"></span>`).join("") + `</div>`;
    }
    case "balance":
      return `<div class="sg-ex sg-ex-wt" role="img"${lbl}>` + SG_BALANCE_SVG + `</div>`;
    case "image":
      return `<div class="sg-ex" role="img"${lbl}><img src="${c.src}" alt="${c.label || ''}"></div>`;
    default:
      return "";
  }
}

/* ---------- 15. BOOT ---------- */
function boot(){
  // god-mode visual theme (opt-in via CARD.theme) — warms the whole stage; scoped CSS under .thm-*
  if(CARD.theme) $("stage").classList.add("thm-" + CARD.theme);
  // banner title = skill name only (strip "(भाग…)" and the ": letters" list)
  $("sgTitle").textContent = (CARD.title.hi || "").split(/[:：(]/)[0].trim();
  // 16j: landing subtitle line (r4 dropped it) + fix the stale document <title> (was hardcoded to
  // the ordering game on every FLN build). Both come from the card now.
  { const _sub = $("sgSub"); if(_sub) _sub.textContent = (CARD.subtitle_hi || ""); }
  try{ document.title = "SwiftPAL · " + (CARD.skill_code || "") + " · " + (CARD.title.hi || "").split(/[:：(]/)[0].trim(); }catch(e){}
  // VISUAL-FIRST landing hero: SHOW the concept (shapes row / a finger-hand / an image), not just the title text
  (function(){ const hero = CARD.landing_hero, el = $("sgHero"); if(!hero || !el) return;
    if(hero.kind === "concept_strip"){
      // r4/#2: each cell is a .sg-acell (keeps the staggered fingerPop pop-in) wrapping a visual example.
      el.innerHTML = (hero.cells || []).map(c => `<div class="sg-acell">${conceptTileHTML(c)}</div>`).join("");
      return;   // keep the landing's tuned title size + spacing (this strip is sized for the full card)
    }
    if(hero.kind === "shapes" && typeof shapeSVG === "function")
      el.innerHTML = (hero.shapes||[]).map(s=> shapeSVG(s.shape, {color:s.color, size:104, rotate:s.rotate||0})).join("");
    else if(hero.kind === "count"){
      // counting game: preview the WHOLE 1..n sequence — a row of hands (1,2,3…), each with its Arabic numeral
      const hi = Math.min(Math.max(parseInt(hero.n,10)||3, 1), 5);   // clamp to available hand art (1..5)
      let cells = "";
      for(let i=1;i<=hi;i++){
        cells += `<div class="sg-hand-cell">${fingerCount(i, "sg-hand")}<span class="sg-hand-num">${devNumeral(i)}</span></div>`;
      }
      el.innerHTML = cells;
    }
    else if(hero.kind === "image") el.innerHTML = `<img src="${hero.src}" alt="">`;
    if(el.innerHTML){ el.classList.add("show","hint-glow"); $("sgTitle").classList.add("compact");
      const c = el.closest && el.closest(".sg-content"); if(c){ c.classList.add("has-hero");
        // SME (S01 review deck): landing reads TITLE first, image BELOW it, image smaller.
        if(hero.title_first) c.classList.add("title-first"); } }
  })();

  // [20a landing] shape-recognition games ship NO landing_hero -> the card fell back to a plain WORD
  // subtitle (unreadable to pre-readers). Derive icon tiles from shape_set instead (labels from the
  // card's own bins; colours are neutral brand tones, never red/green per ruling B5). Additive: only
  // fires when sgHero is still empty AND the card is a shape game.
  (function(){ const el = $("sgHero");
    if(!el || el.innerHTML || typeof shapeSVG !== "function" || !Array.isArray(CARD.shape_set) || !CARD.shape_set.length) return;
    const lab = {}; (CARD.slides||[]).forEach(s => ((s.data && s.data.bins) || []).forEach(b => { if(b.shape && b.label) lab[b.shape] = b.label; }));
    const DEF = { circle:"गोल", square:"चौकोर", triangle:"तिकोना", rectangle:"आयत" };
    const COL = { circle:"#386AF6", square:"#F0A020", triangle:"#9B7BE8", rectangle:"#12A0B8" };
    el.innerHTML = CARD.shape_set.map(sh =>
      `<div class="sg-acell">${shapeSVG(sh, {color: COL[sh] || "#386AF6", size:96})}<span class="sg-alabel">${lab[sh] || DEF[sh] || ""}</span></div>`).join("");
    el.classList.add("show","hint-glow"); $("sgTitle").classList.add("compact");
    const c = el.closest && el.closest(".sg-content"); if(c) c.classList.add("has-hero");   // hides the word subtitle
  })();

  // ----- landing-screen welcome VO (lead review) -----
  // A warm greeting on the title screen. Autoplay is often blocked before a gesture, so we also
  // (a) expose a pulsing 🔊 "listen" button, and (b) fire it on the first pointer-down. The whole
  // greeting lives HERE now (not on slide 0), which also kills the old overlap glitch where the
  // landing VO and slide-0 VO could talk over each other.
  const landSrc = (CARD.assets && CARD.assets.audio && CARD.assets.audio["vo_landing"]) || ("assets/Audio/vo_landing." + AUDIO_EXT);
  const playLanding = ()=>{ if(!$("startGate").classList.contains("hidden")) play(landSrc, ()=>{}); };
  const sgVo = $("sgVo"); if(sgVo) sgVo.onclick = (e)=>{ e.stopPropagation(); playLanding(); };
  // ---- [engine JS] r4/P2 boot loader: loader.gif until assets warm, then it dismisses ITSELF into
  // the landing (NO tap gate). DUAL auto-dismiss (window 'load' OR a 2.5s watchdog — never strand the
  // child), deduped by .done. The same handler adds body.loaded (unblocks the concept-strip stagger)
  // and fires the landing VO. play() absorbs an autoplay block; the pulsing 🔊 chip is the fallback. ----
  (function(){
    const bl = $("bootLoader"); if(!bl){ document.body.classList.add("loaded"); playLanding(); return; }
    // [16l] BRAND SPLASH MIN-HOLD: locally, window.load fires in ~100ms and the CG loader was
    // removed before it ever painted ("no CG logo at the start"). The loader now holds for a
    // minimum beat so the ConveGenius mark is always seen; the watchdog still caps the worst case.
    const T0 = performance.now(), MIN_MS = 1600;
    let fired = false;   // .done is the CSS fade trigger, so it must NOT double as the dedup flag
    /* PRELOAD EVERYTHING before the game starts: every image (decoded, so it paints on its first frame) and
       every audio clip (buffered) that any screen uses — the card's asset map + the art the code/CSS/HTML
       name directly. The loader stays up (with a progress bar) until all of it is ready, so no scene pops in
       or stutters later. Each item has its own timeout and errors count as done, and a 30 s watchdog still
       guarantees the child is never stranded on the loader. The objects are kept (window._capPreloaded) so
       the browser keeps them in memory. */
    const PRELOAD_EXTRA = ["assets/Audio/sfx_pour.mp3", "assets/Images/cap_shelf.svg", "assets/Images/cap_shop_front.png", "assets/Images/cap_shop_order.jpg", "assets/Images/cap_shop_pour.jpg", "assets/Images/cap_utensils_sprite.png", "assets/UI/end_screen.webp", "assets/UI/hint.png", "assets/UI/hint_active.png", "assets/UI/loader.gif", "assets/UI/mascot.webp", "assets/UI/new_landing_swiftee_anim.webp", "assets/UI/nudge_hand_new.svg", "assets/UI/peeking.webp", "assets/UI/start_card.webp", "assets/UI/start_mascot.webp", "assets/UI/startnew_bg.webp", "assets/UI/sw_anim_rest.png", "assets/UI/sw_head_talking.webp", "assets/UI/sw_lg_celebrating_anim.webp"];
    const urls = new Set(PRELOAD_EXTRA);
    (function walk(x){ if(!x) return; if(typeof x === "string"){ if(/\.(png|jpe?g|webp|gif|svg|mp3|ogg|m4a)$/i.test(x)) urls.add(x); return; }
      if(Array.isArray(x)) x.forEach(walk); else if(typeof x === "object") Object.values(x).forEach(walk); })(CARD.assets);
    const keep = window._capPreloaded = [];
    const one = (u)=> new Promise(res => { let done = false; const fin = ()=>{ if(!done){ done = true; res(); } };
      setTimeout(fin, 12000);                                       // a slow / missing file never blocks the start
      if(/\.(mp3|ogg|m4a)$/i.test(u)){ const a = new Audio(); a.preload = "auto"; keep.push(a);
        a.addEventListener("canplaythrough", fin, { once: true }); a.addEventListener("error", fin, { once: true }); a.src = u; a.load(); }
      else { const im = new Image(); keep.push(im); im.onload = ()=>{ (im.decode ? im.decode() : Promise.resolve()).then(fin, fin); }; im.onerror = fin; im.src = u; } });
    const list = [...urls]; let loaded = 0;
    const bar = document.createElement("div"); bar.className = "boot-progress"; bar.innerHTML = "<i></i>"; bl.appendChild(bar);
    const fill = bar.firstChild;
    const all = Promise.all(list.map(u => one(u).then(()=>{ loaded++; fill.style.width = (100 * loaded / list.length).toFixed(1) + "%"; })))
      .then(()=> document.fonts && document.fonts.ready);
    const ready = ()=>{
      if(fired) return;   // load event + watchdog both land here → dedup
      fired = true;
      setTimeout(()=>{
        bl.classList.add("done");                  // NOW start the fade (after the brand beat)
        document.body.classList.add("loaded");     // starts the .sg-acell pop chain
        playLanding();
        setTimeout(()=> bl.remove(), 450);
      }, Math.max(0, MIN_MS - (performance.now() - T0)));
    };
    // start only when the page has loaded AND every asset above is ready
    const pageLoaded = new Promise(r => { if(document.readyState === "complete") r(); else window.addEventListener("load", r, { once: true }); });
    Promise.all([pageLoaded, all]).then(ready, ready);
    setTimeout(ready, 30000);   // watchdog: never strand the child on the loader
  })();
  // landing VO best-effort on first interaction too (some browsers block autoplay pre-gesture)
  window.addEventListener("pointerdown", function once(){ window.removeEventListener("pointerdown", once);
    /* [30m] THE LANDING GREETING MUST NOT RESTART ON THE FIRST TAP (Yasir: "the landing VO does not
       seem fine"). This listener is ONLY an autoplay-policy fallback, but it fired unconditionally, so
       when autoplay HAD worked the first tap anywhere replayed the greeting from the top. Guard on
       whether sound is genuinely moving, NOT on "did we call play()" — on a blocked autoplay we DID
       call it, so a call-flag would kill the very fallback this line exists for. */
    const _a = (typeof currentAudio !== "undefined") ? currentAudio : null;
    const _audible = _a && !_a.paused && !_a.ended && _a.currentTime > 0;
    if(!_audible) playLanding(); }, { once:true });

  $("sgBtn").onclick = ()=>{
    /* ADDITIVE: activity_launched — the child tapping शुरू करें. The only verb of the seven
       with no existing signal in this engine. One-shot inside _xapi, so a mashed start
       cannot double-report, and a game opened-and-abandoned reports nothing. */
    try{ SwiftPAL.emit("activity_launched", { skill_code: CARD.skill_code }); }catch(e){}
    stopAudio();          // silence the landing greeting BEFORE slide 0 speaks (no VO overlap)
    _ac();                // unlock/resume WebAudio on the start gesture so the first clip never clips
    // [engine JS] r4/P1: peek gate into the tutorial. The landing stays visible-and-BLURRED behind the
    // peeking Swiftie + "चलिए शुरू करें"; it hides once the tutorial mounts (in the callback).
    _gatedPhases.add("tutorial");
    phaseBlurTransition(()=>{
      $("startGate").classList.add("hidden");
      document.body.classList.remove("is-start");   // blue bg only on the title screen
      mountSlide(0);
    }, "tutorial");
  };
  // tapping आगे clears any pending nav-nudge
  $("navBtn").addEventListener("click", ()=>{ clearTimeout(state.navNudgeTimer); stopNudge(); });
  // [engine JS] r4 dev jump: ?slide=N skips the loader+gate and mounts slide N directly (QA/capture only)
  (function(){
    const j = parseInt(new URLSearchParams(location.search).get("slide"), 10);
    if(isNaN(j)) return;
    const bl = $("bootLoader"); if(bl) bl.remove();
    document.body.classList.add("loaded");
    $("startGate").classList.add("hidden");
    document.body.classList.remove("is-start");
    mountSlide(Math.max(0, Math.min(j, CARD.slides.length - 1)));
  })();
  // when the web font finishes loading, re-centre glyphs (metrics change vs fallback)
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(()=>{ centerAllGlyphs(); refreshMatraWords(); }); }
  // dev banner if ?dev=1 — show empty initially
  if(new URLSearchParams(location.search).has("dev") || new URLSearchParams(location.search).has("nav")){
    if($("devBanner")){ $("devBanner").textContent = "engine ready · slides=" + CARD.slides.length; $("devBanner").className = "dev-banner show"; }
    buildDevNav();
  }
}

/* [engine JS] DEV NAV — a review/QA slide navigator. Shows ONLY with ?dev=1 or ?nav=1 (children never
   see it). Jump to any slide by dropdown, step ◀▶, first/last, or back to the landing. Uses the
   engine's own mountSlide + state.idx; a light poll keeps the label synced when the game self-advances. */
function buildDevNav(){
  if(document.getElementById("devNav")) return;
  const bar = document.createElement("div"); bar.id = "devNav"; bar.className = "dev-nav";
  const mk = (txt, title)=>{ const b = document.createElement("button"); b.className = "dev-nav-btn"; b.textContent = txt; if(title) b.title = title; return b; };
  const land = mk("⌂", "landing"), first = mk("⏮", "first"), prev = mk("◀", "prev"), next = mk("▶", "next"), last = mk("⏭", "last");
  const sel = document.createElement("select"); sel.className = "dev-nav-sel"; sel.title = "jump to slide";
  CARD.slides.forEach((s, i)=>{ const o = document.createElement("option"); o.value = i; o.textContent = (i+1) + ". " + s.id + " · " + s.type; sel.appendChild(o); });
  const lbl = document.createElement("span"); lbl.className = "dev-nav-lbl";
  const cur = ()=> (state && typeof state.idx === "number") ? state.idx : 0;
  const leaveStart = ()=>{ const sg = $("startGate"); if(sg) sg.classList.add("hidden"); document.body.classList.remove("is-start"); document.body.classList.add("loaded"); const bl = $("bootLoader"); if(bl) bl.remove(); };
  const sync = ()=>{ const i = cur(); const s = CARD.slides[i]; if(document.activeElement !== sel) sel.value = i;
    lbl.textContent = (i+1) + "/" + CARD.slides.length + (s ? " · " + s.id : ""); };
  const go = (i)=>{ i = Math.max(0, Math.min(i, CARD.slides.length - 1)); leaveStart(); mountSlide(i); sync(); };
  land.onclick = ()=>{ const sg = $("startGate"); if(sg){ sg.classList.remove("hidden"); document.body.classList.add("is-start"); } };
  first.onclick = ()=> go(0); prev.onclick = ()=> go(cur() - 1); next.onclick = ()=> go(cur() + 1); last.onclick = ()=> go(CARD.slides.length - 1);
  sel.onchange = ()=> go(parseInt(sel.value, 10));
  bar.append(land, first, prev, sel, lbl, next, last);
  document.body.appendChild(bar);
  setInterval(sync, 300); sync();
}
boot();


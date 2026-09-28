# -*- coding: utf-8 -*-
"""
MTG2A04_L03_S01 — SME review_1 rebuild.

Single source of truth for the redesigned lesson (MTG2A04_L03_S01_review_1.pptx):
  * every VO line (text == what is shown/spoken), its voice, and its highlight cues
  * the slide list (card data)

Run:  python _tools/build_card.py            (re-generates missing audio, rewrites card)
      python _tools/build_card.py --force    (re-records every cap_* clip)

Outputs: assets/Audio/cap_*.mp3, card.json, and the <script id="cardData"> block
inside MTG2A04_L03_S01.html. Audio is placeholder TTS (edge-tts, hi-IN) — replace
the mp3 files with studio VO later; keep the same file names. If you re-record,
re-time the cue offsets in CARD.assets.audio_cues (ms from clip start).
"""
import asyncio, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUD = os.path.join(ROOT, "assets", "Audio")
FORCE = "--force" in sys.argv

# ---------------------------------------------------------------- voices
SWIFTEE = dict(voice="hi-IN-SwaraNeural", rate="-6%", pitch="+6Hz")
MAN     = dict(voice="hi-IN-MadhurNeural", rate="-4%", pitch="+0Hz")
WOMAN   = dict(voice="hi-IN-SwaraNeural", rate="-4%", pitch="-18Hz")
ELDER   = dict(voice="hi-IN-MadhurNeural", rate="-14%", pitch="-14Hz")
BOY     = dict(voice="hi-IN-MadhurNeural", rate="+2%", pitch="+28Hz")   # Figma shop: the 3rd customer is a boy

# ---------------------------------------------------------------- VO lines
# id: (text, voice, [(phrase, cue_key), ...])
N = {1:"एक",2:"दो",3:"तीन",4:"चार",5:"पाँच",6:"छह",7:"सात",8:"आठ",9:"नौ",10:"दस"}
LINES = {
  # landing + phase gates (gate text unchanged, re-voiced so the whole lesson is one voice)
  "cap_landing": ("नमस्ते दोस्त! मैं हूँ स्विफ्टी। आइए, देखते और सीखते हैं कि कौन-से बर्तन में कितना पानी है।", SWIFTEE, []),
  "cap_pt_tutorial": ("ध्यान से देखिए और मेरे साथ जानिए। चलिए, शुरू करें!", SWIFTEE, []),
  "cap_pt_guided": ("बहुत बढ़िया! अब हम साथ मिलकर शुरू करते हैं। चलिए, साथ में करें!", SWIFTEE, []),
  "cap_pt_practice": ("वाह! अब आपकी बारी।", SWIFTEE, []),

  # PAGE 2 — glass or mug
  "cap_p2_q": ("यहाँ एक गिलास और एक मग दिया हुआ है। इन दोनों में ज़्यादा पानी किसमें आएगा, गिलास में या मग में? सही बर्तन पर टैप करिए।",
               SWIFTEE, [("एक गिलास", "glass"), ("और एक मग", "mug"), ("इन दोनों", "both")]),
  "cap_p2_idle": ("ज़्यादा पानी किसमें आएगा, गिलास में या मग में? सही बर्तन पर टैप करिए।", SWIFTEE, []),
  "cap_p2_ok": ("शाबाश! गिलास और मग में से, मग में पानी की मात्रा ज़्यादा होगी।", SWIFTEE, []),
  "cap_p2_wrong": ("गिलास में पानी कम आएगा, और मग में ज़्यादा। इसलिए सही बर्तन मग है।", SWIFTEE, [("और मग", "mug")]),

  # PAGE 3 — which method is right
  "cap_p3_a": ("यहाँ हम सीखेंगे कि जब किसी बड़े बर्तन में पानी या किसी चीज़ की मात्रा मापनी हो, तो छोटे बर्तनों का सही उपयोग कैसे किया जाता है। "
               "यहाँ दो अलग-अलग तरीके दिए गए हैं। एक जगह तीन कप हैं, और दूसरी जगह दो कप और एक गिलास है।",
               SWIFTEE, [("एक जगह", "box1"), ("दूसरी जगह", "box2")]),
  "cap_p3_b": ("जब भी हम किसी बर्तन में पानी या किसी चीज़ की मात्रा को मापते हैं, तो मापने के लिए इस्तेमाल होने वाले बर्तन एक जैसे होने चाहिए। "
               "वरना हम मात्रा को सही तरीके से नहीं माप सकेंगे। इसलिए सही तरीका यह है, जिसमें सभी बर्तन एक जैसे हों।",
               SWIFTEE, [("एक जैसे होने", "same"), ("इसलिए सही", "correct")]),

  # PAGE 4 — glasses of milk into an empty bottle
  "cap_p4_a": ("अब हम सीखते हैं, इस बोतल में दूध की मात्रा कितने गिलास है? यहाँ एक बोतल पूरी खाली है, और चार एक जैसे गिलास में दूध है। "
               "इन गिलासों का सारा दूध एक-एक करके बोतल में डालते हैं, और देखते हैं कि यह बोतल कितने गिलास से भरती है।",
               SWIFTEE, [("इस बोतल", "bottle"), ("चार एक जैसे", "glasses")]),
  "cap_p4_b": ("यह बोतल चार गिलास से पूरी भर गई। तो इस बोतल में दूध की मात्रा चार एक जैसे गिलास के बराबर है।", SWIFTEE, []),

  # PAGE 5 — a full jug poured into glasses
  "cap_p5_a": ("अब हम सीखते हैं, जग में पानी की मात्रा कितने गिलास है? यहाँ एक जग में पूरा पानी भरा हुआ है। "
               "इसका सारा पानी इन गिलासों में भरते हैं, और देखते हैं, कितने गिलास भरते हैं।",
               SWIFTEE, [("कितने गिलास है", "glasses"), ("एक जग", "jug")]),
  "cap_p5_b": ("यहाँ एक जग से चार गिलास पूरे भर गए। तो जग में पानी की मात्रा चार गिलास के बराबर है।", SWIFTEE, []),

  # PAGE 7 — drag the oil jar onto cups
  "cap_p7_a": ("यहाँ एक जार, तेल से पूरा भरा हुआ है, और कुछ एक जैसे खाली कप रखे हुए हैं। जार को ऐसे ले जाकर इन कपों को तेल से पूरा भरिए।",
               SWIFTEE, [("जार को ऐसे", "demo")]),
  "cap_p7_b": ("अब आप करिए। जार में बचा हुआ तेल इन बचे हुए कपों में डालिए।", SWIFTEE, []),
  "cap_p7_q": ("इस जार में कितने कप तेल है? सही संख्या पर टैप करिए।", SWIFTEE, []),
  "cap_p7_ok": ("शाबाश! इस जार से चार कप पूरे भर गए।", SWIFTEE, []),
  "cap_p7_h1": ("दोबारा गिनिए कि कितने कप पूरे भरे हैं।", SWIFTEE, []),
  "cap_p7_h2": ("एक, दो, तीन, चार। कुल चार कप भरे हैं। सही संख्या यह है।", SWIFTEE,
                [("एक", "n1"), ("दो", "n2"), ("तीन", "n3"), ("चार", "n4"), ("सही संख्या", "show")]),

  # PAGE 8 — cups of milk into a saucepan
  "cap_p8_a": ("यहाँ दस कप दूध से पूरे भरे हुए हैं, और एक छोटा भगोना पूरा खाली है। कपों का दूध एक-एक करके भगोने में डालिए, और देखिए कि भगोना कितने कप से भरता है।",
               SWIFTEE, [("दस कप", "cups"), ("एक छोटा भगोना", "pan")]),
  "cap_p8_b": ("अब आप करिए। बचे हुए कपों का दूध भगोने में डालिए।", SWIFTEE, []),
  "cap_p8_q": ("यह भगोना कितने कप दूध से पूरा भर गया? सही संख्या पर टैप करिए।", SWIFTEE, []),
  "cap_p8_ok": ("शाबाश! यह भगोना आठ कप दूध से पूरा भर गया।", SWIFTEE, []),
  "cap_p8_h1": ("दोबारा गिनिए कि कितने कप खाली हुए हैं।", SWIFTEE, []),
  "cap_p8_h2": ("एक, दो, तीन, चार, पाँच, छह, सात, आठ। कुल आठ कप खाली हुए हैं। सही संख्या यह है।", SWIFTEE,
                [(N[i], "n%d" % i) for i in range(1, 9)] + [("सही संख्या", "show")]),

  # PAGE 9 — tap the bottle, it fills the glasses
  "cap_p9_a": ("यहाँ एक बोतल पानी से पूरी भरी हुई है, और चार खाली गिलास रखे हुए हैं। बोतल में कितने गिलास पानी की मात्रा है, यह जानने के लिए बोतल से सारा पानी इन खाली गिलासों में डालना होगा। अब बोतल पर टैप करिए।",
               SWIFTEE, [("एक बोतल", "bottle"), ("चार खाली गिलास", "glasses")]),
  "cap_p9_q": ("इस बोतल में पानी की मात्रा कितने गिलास के बराबर है? सही संख्या पर टैप करिए।", SWIFTEE, []),
  "cap_p9_ok": ("शाबाश! इस बोतल में पानी की मात्रा कुल तीन गिलास के बराबर है।", SWIFTEE, []),
  "cap_p9_h1": ("दोबारा देखिए कि कितने गिलास पूरे भरे हैं।", SWIFTEE, []),
  "cap_p9_h2": ("एक, दो, तीन। कुल तीन गिलास भरे हैं। सही संख्या यह है।", SWIFTEE,
                [("एक", "n1"), ("दो", "n2"), ("तीन", "n3"), ("सही संख्या", "show")]),

  # PAGE 10 — mugs of oil into an empty jug
  "cap_p10_a": ("यहाँ एक खाली जग है, और छह छोटे मग हैं, जो तेल से पूरे भरे हुए हैं। मगों का तेल एक-एक करके जग में डालिए, और देखिए कितने मग से यह जग पूरा भरता है।",
                SWIFTEE, [("एक खाली जग", "jug"), ("छह छोटे मग", "mugs")]),
  "cap_p10_q": ("यह जग कितने मग तेल से पूरा भरा है? सही संख्या पर टैप करिए।", SWIFTEE, []),
  "cap_p10_ok": ("शाबाश! यह जग छह मग तेल से पूरा भर गया।", SWIFTEE, []),
  "cap_p10_h1": ("दोबारा गिनिए कि कितने मग खाली हुए हैं।", SWIFTEE, []),
  "cap_p10_h2": ("एक, दो, तीन, चार, पाँच, छह। कुल छह मग खाली हुए हैं। सही संख्या यह है।", SWIFTEE,
                 [(N[i], "n%d" % i) for i in range(1, 7)] + [("सही संख्या", "show")]),

  # PAGE 11 — the village milk shop
  "cap_p11_a": ("सुबह का समय है। गाँव में दूधवाले की दुकान खुल गई है। तभी तीन लोग दूध लेने दुकान पर आते हैं।", SWIFTEE, [("तीन लोग", "people")]),
  "cap_p11_c1": ("मुझे चार गिलास दूध चाहिए।", MAN, []),
  "cap_p11_c2": ("मुझे दो गिलास दूध चाहिए।", WOMAN, []),
  "cap_p11_c3": ("मुझे तीन गिलास दूध चाहिए।", BOY, []),
  "cap_p11_b": ("यहाँ तीनों बर्तनों पर एक-एक करके टैप करिए, और फिर इनकी मात्रा मापते हैं।", SWIFTEE, [("तीनों बर्तनों", "vessels")]),
  "cap_p11_tap": ("अब इस बर्तन पर टैप करिए, और दूध को गिलासों में डालिए।", SWIFTEE, []),
  "cap_p11_m_small": ("इस छोटी बोतल में दो गिलास दूध है।", SWIFTEE, []),
  "cap_p11_m_mid": ("इस बीच वाली बोतल में तीन गिलास दूध है।", SWIFTEE, []),
  "cap_p11_m_big": ("इस बड़ी बोतल में चार गिलास दूध है।", SWIFTEE, []),
  "cap_p11_q": ("अब वह बर्तन चुनिए, जिसमें ठीक चार गिलास दूध है।", SWIFTEE, []),
  "cap_p11_ok": ("शाबाश! आपने सही बर्तन चुन लिया है।", SWIFTEE, []),
  "cap_p11_w1": ("दोबारा सोचिए। किस बर्तन की मात्रा चार गिलास के बराबर है?", SWIFTEE, []),
  "cap_p11_w2_2": ("इसमें दो गिलास दूध है। सही बर्तन, जिसमें चार गिलास दूध है, वह यह है।", SWIFTEE, [("वह यह है", "show")]),
  "cap_p11_w2_3": ("इसमें तीन गिलास दूध है। सही बर्तन, जिसमें चार गिलास दूध है, वह यह है।", SWIFTEE, [("वह यह है", "show")]),

  # FINISH
  "cap_well_done": ("शाबाश! आपने सीख लिया है कि बर्तन की मात्रा कितनी है।", SWIFTEE, []),
}
# "<id>2" = the praise line WITHOUT "शाबाश!" — played when the child got it right only after a wrong try
for cid in [c for c in LINES if c.endswith("_ok")]:
    t, v, cues = LINES[cid]
    assert t.startswith("शाबाश! "), cid
    LINES[cid + "2"] = (t[len("शाबाश! "):], v, [])
for i in range(1, 11):
    LINES["cap_num_%d" % i] = (N[i], SWIFTEE, [])

# ---------------------------------------------------------------- slides
def ask(page, values, answer):
    return {"values": values, "answer": answer,
            "q": "cap_p%s_q" % page, "ok": "cap_p%s_ok" % page,
            "h1": "cap_p%s_h1" % page, "h2": "cap_p%s_h2" % page}

SLIDES = [
  {"id": "T1", "phase": "tutorial", "eis": "iconic", "type": "CAP_COMPARE_PICK",
   "prompt_hi": "ज़्यादा पानी किसमें, गिलास या मग?",
   "audio": {"prompt": "cap_p2_q", "idle": "cap_p2_idle", "correct": "cap_p2_ok", "wrong": "cap_p2_wrong"},
   "data": {"idle_ms": 7000}},
  {"id": "T2", "phase": "tutorial", "eis": "iconic", "type": "CAP_METHOD",
   "prompt_hi": "कौन-सा तरीका सही है?",
   "audio": {"intro": "cap_p3_a", "explain": "cap_p3_b"}, "data": {}},
  {"id": "T3", "phase": "tutorial", "eis": "iconic", "type": "CAP_POUR_IN_DEMO",
   "prompt_hi": "कितने गिलास दूध?",
   "audio": {"intro": "cap_p4_a", "conclude": "cap_p4_b"},
   "data": {"count": 4, "liquid": "milk"}},
  {"id": "T4", "phase": "tutorial", "eis": "iconic", "type": "CAP_POUR_OUT_DEMO",
   "prompt_hi": "कितने गिलास पानी?",
   "audio": {"intro": "cap_p5_a", "conclude": "cap_p5_b"},
   "data": {"count": 4, "glasses": 6, "liquid": "water"}},
  {"id": "G1", "phase": "guided", "eis": "enactive", "type": "CAP_JAR_DRAG",
   "prompt_hi": "जार का पूरा तेल कप में डालिए।", "ask_prompt_hi": "इस जार में कितने कप तेल है?",
   "audio": {"intro": "cap_p7_a", "your_turn": "cap_p7_b"},
   "data": {"capacity": 4, "cups": 6, "liquid": "oil", "idle_ms": 7000, "ask": ask(7, [1, 4, 6], 4)}},
  {"id": "G2", "phase": "guided", "eis": "enactive", "type": "CAP_TAP_POUR",
   "prompt_hi": "कपों का दूध भगोने में डालिए।", "ask_prompt_hi": "यह भगोना कितने कप दूध से पूरा भर गया?",
   "audio": {"intro": "cap_p8_a", "your_turn": "cap_p8_b"},
   "data": {"layout": "pan", "capacity": 8, "sources": 10, "liquid": "milk", "demo": True, "idle_ms": 7000,
            "ask": ask(8, [1, 2, 8], 8)}},
  {"id": "P1", "phase": "practice", "eis": "enactive", "type": "CAP_TAP_SOURCE",
   "prompt_hi": "बोतल पर टैप करिए।", "ask_prompt_hi": "इस बोतल में पानी की मात्रा कितने गिलास के बराबर है?",
   "audio": {"intro": "cap_p9_a"},
   "data": {"capacity": 3, "glasses": 4, "liquid": "water", "idle_ms": 7000, "ask": ask(9, [1, 3, 4], 3)}},
  {"id": "P2", "phase": "practice", "eis": "enactive", "type": "CAP_TAP_POUR",
   "prompt_hi": "मगों का तेल जग में डालिए।", "ask_prompt_hi": "यह जग कितने मग तेल से पूरा भरा है?",
   "audio": {"intro": "cap_p10_a"},
   "data": {"layout": "jug", "capacity": 6, "sources": 6, "liquid": "oil", "demo": False, "idle_ms": 7000,
            "ask": ask(10, [4, 5, 6], 6)}},
  {"id": "P3", "phase": "practice", "eis": "enactive", "type": "CAP_SHOP",
   "prompt_hi": "कितने गिलास भरें?", "ask_prompt_hi": "किस बर्तन में ठीक 4 गिलास दूध है?",
   "audio": {"intro": "cap_p11_a", "customers": ["cap_p11_c1", "cap_p11_c2", "cap_p11_c3"],
             "tap_all": "cap_p11_b", "tap_vessel": "cap_p11_tap", "q": "cap_p11_q", "ok": "cap_p11_ok",
             "w1": "cap_p11_w1", "w2": {"2": "cap_p11_w2_2", "3": "cap_p11_w2_3"}},
   "data": {"target": 4, "liquid": "milk", "idle_ms": 7000,
            # Figma "order view": three milk bottles on the counter, big / middle / small (left → right)
            "vessels": [{"key": "big", "art": "shopb4", "glasses": 4, "result": "cap_p11_m_big", "label": "4 गिलास"},
                        {"key": "mid", "art": "shopb3", "glasses": 3, "result": "cap_p11_m_mid", "label": "3 गिलास"},
                        {"key": "small", "art": "shopb2", "glasses": 2, "result": "cap_p11_m_small", "label": "2 गिलास"}],
            "wants": [4, 2, 3]}},
  {"id": "CEL", "phase": "practice", "eis": "enactive", "type": "CELEBRATION",
   "prompt_hi": "शाबाश! आपने सीख लिया है कि बर्तन की मात्रा कितनी है।",
   "audio": {"prompt": "cap_well_done"},
   "data": {"end_subtitle": "एक ही कप से नापिए - और गिनिए!"}},
]

# ---------------------------------------------------------------- TTS
def norm(w):
    return re.sub(r"[^ऀ-ॿ\w]", "", w)

async def synth(cid, text, v):
    import edge_tts
    words, audio = [], bytearray()
    c = edge_tts.Communicate(text, v["voice"], rate=v["rate"], pitch=v["pitch"], boundary="WordBoundary")
    async for ch in c.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append((ch["offset"] / 10000.0, ch["text"]))
    with open(os.path.join(AUD, cid + ".mp3"), "wb") as f:
        f.write(audio)
    return words

def cues_for(words, spec):
    out, start = [], 0
    toks = [norm(t) for _, t in words]
    for phrase, key in spec:
        pw = [norm(p) for p in phrase.split() if norm(p)]
        hit = None
        for i in range(start, len(toks) - len(pw) + 1):
            if toks[i:i + len(pw)] == pw:
                hit = i; break
        if hit is None:
            raise SystemExit("cue phrase not found: %r in %r" % (phrase, [t for _, t in words]))
        out.append({"t": max(0, int(words[hit][0]) - 60), "k": key})
        start = hit + 1
    return out

async def main():
    os.makedirs(AUD, exist_ok=True)
    timing_path = os.path.join(ROOT, "_tools", "vo_timings.json")
    timings = json.load(open(timing_path, encoding="utf8")) if os.path.exists(timing_path) else {}
    for cid, (text, v, spec) in LINES.items():
        path = os.path.join(AUD, cid + ".mp3")
        key = text + "|" + json.dumps(v, sort_keys=True)
        if FORCE or not os.path.exists(path) or timings.get(cid, {}).get("key") != key:
            for attempt in range(3):
                try:
                    words = await synth(cid, text, v); break
                except Exception as e:
                    print("retry", cid, e)
            else:
                raise SystemExit("TTS failed for " + cid)
            timings[cid] = {"key": key, "words": words}
            print("voiced", cid)
    json.dump(timings, open(timing_path, "w", encoding="utf8"), ensure_ascii=False, indent=1)

    audio = {cid: "assets/Audio/%s.mp3" % cid for cid in LINES}
    # engine-fixed ids (landing greeting + phase gates) resolve through the manifest to the new clips
    audio["vo_landing"] = audio["cap_landing"]
    for p in ("tutorial", "guided", "practice"):
        audio["vo_pt_" + p] = audio["cap_pt_" + p]
    audio["sfx_celebrate"] = "assets/Audio/sfx_celebrate.mp3"
    audio["sfx_pour"] = "assets/Audio/sfx_pour.mp3"      # recorded pour (from pouring.mp3)   # the engine's CELEBRATION sting
    audio_text = {cid: t for cid, (t, _, _) in LINES.items()}
    cues = {}
    for cid, (t, v, spec) in LINES.items():
        if spec:
            cues[cid] = cues_for(timings[cid]["words"], spec)

    card = {
      "version": "0.2",
      "skill_code": "MTG2A04_L03_S01", "lo_code": "MTG2A04_L03", "grade": "G2", "attribute": "A04",
      "skill_type": "CORE", "part_label": "", "theme": "toybox",
      "landing_hero": {"kind": "image", "src": "assets/Images/animation-v2/jug-four-glasses.png"},   # generated capacity artwork
      "title": {"hi": "कितना पानी है?", "en": "Measuring capacity in non-standard units"},
      "subtitle_hi": "भरिए · गिनिए · बताइए",
      "skill_description_hi": "किसी बर्तन की मात्रा (धारिता) एक जैसे छोटे बर्तन से मापता है - बार-बार वही गिलास/कप भरकर गिनता है और बताता है कि बर्तन में कितने गिलास/कप समाते हैं।",
      "number_set": [1, 2, 3, 4, 5, 6, 7, 8],
      "dt_fallback": None,
      "phase_distribution": {"tutorial": 4, "guided": 2, "practice": 4},
      "scaffold_rules": {"nudge_timeout_ms": {"guided": 7000, "independent": 7000}, "max_attempts": 3},
      "signals_expected": ["slide_entered", "slide_completed", "capacity_compare_first_try", "pour_done",
                           "capacity_count_first_try", "shop_pick_first_try", "phase_transition",
                           "mastery_score", "lesson_completed"],
      "slides": SLIDES,
      "assets": {"audio": audio, "audio_text": audio_text, "audio_cues": cues,
                 "image": {"cap_shop_bg": "assets/Images/cap_shop_bg.jpg", "cap_shop_order": "assets/Images/cap_shop_order.jpg", "cap_shop_front": "assets/Images/cap_shop_front.png", "cap_shop_man": "assets/Images/cap_shop_man.png", "cap_shop_woman": "assets/Images/cap_shop_woman.png", "cap_shop_boy": "assets/Images/cap_shop_boy.png", "cap_shop_pour": "assets/Images/cap_shop_pour.jpg",
                           "cap_landing_strip": "assets/Images/animation-v2/jug-four-glasses.png",
                           "cap_glass": "assets/Images/cap_glass.png", "cap_mug": "assets/Images/cap_mug.png", "cap_cup": "assets/Images/cap_cup.png"}},
    }
    js = json.dumps(card, ensure_ascii=False, indent=2)
    open(os.path.join(ROOT, "card.json"), "w", encoding="utf8").write(js)
    hp = os.path.join(ROOT, "MTG2A04_L03_S01.html")
    html = open(hp, encoding="utf8").read()
    new = re.sub(r'(<script type="application/json" id="cardData">\n)(.*?)(\n</script>)',
                 lambda m: m.group(1) + js + m.group(3), html, count=1, flags=re.S)
    assert new != html or js in html
    open(hp, "w", encoding="utf8").write(new)
    print("card written:", len(SLIDES), "slides,", len(LINES), "lines")

asyncio.run(main())

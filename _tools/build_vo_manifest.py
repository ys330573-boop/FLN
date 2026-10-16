# -*- coding: utf-8 -*-
"""
VO manifest - every voice clip the game plays, in play order, with its script, speaker, file, length, the screen
and moment it plays, and the words that trigger an on-screen highlight.

Run:  python _tools/build_vo_manifest.py   ->  VO_MANIFEST.csv (opens in Excel, Hindi intact) + VO_MANIFEST.json

Sources: the VO lines + speakers in _tools/build_card.py, the slide list + highlight cues in card.json, the clip
lengths measured from assets/Audio. Re-run it after any VO change.
"""
import csv, json, os, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUD = os.path.join(ROOT, "assets", "Audio")

# the VO lines and their voices, straight from the build script (only the part above the slide list)
src = open(os.path.join(ROOT, "_tools", "build_card.py"), encoding="utf8").read()
top = src[src.index("# ---------------------------------------------------------------- voices"): src.index("# ---------------------------------------------------------------- slides")]
ns = {}; exec(top, ns)
LINES = ns["LINES"]
VOICE = {}
for name, label in (("SWIFTEE", "Swiftee"), ("MAN", "Customer - man"), ("WOMAN", "Customer - woman"), ("BOY", "Customer - boy"), ("ELDER", "Elder")):
    if name in ns: VOICE[json.dumps(ns[name], sort_keys=True)] = label

card = json.load(open(os.path.join(ROOT, "card.json"), encoding="utf8"))
A = card["assets"]; CUES = A.get("audio_cues", {})

def dur(path):
    try: return round(float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                           capture_output=True, text=True).stdout.strip()), 2)
    except Exception: return ""

SECTION = {"tutorial": "Teaching", "guided": "Guided practice", "practice": "Independent practice"}
PURPOSE = {"prompt": "Question / instruction", "intro": "Instruction (screen opens)", "q": "Question", "idle": "Inactivity reminder",
           "correct": "Correct answer", "ok": "Correct answer", "wrong": "Wrong answer - explanation", "h1": "Wrong answer 1 - hint",
           "h2": "Wrong answer 2 - counting hint", "h3": "Wrong answer 3 - the answer is shown", "your_turn": "Your turn", "conclude": "Result", "explain": "Explanation",
           # P3 shop
           "customers": "Customer gives the order", "tap_all": "Tap the three bottles", "tap_vessel": "Tap the glasses to pour",
           "result": "Bottle filled - how many glasses", "thanks": "Customer says thank you",
           "w1": "Wrong customer 1 - hint", "w3": "Wrong customer 3 - the right customer is shown", "2": "Wrong customer 2 (voice hint) - the 2-glass bottle's right customer",
           "3": "Wrong customer 2 (voice hint) - the 3-glass bottle's right customer", "4": "Wrong customer 2 (voice hint) - the 4-glass bottle's right customer"}

rows = []; seen = set()
def add(section, screen, purpose, vid, file=None, note=""):
    key = (vid, screen, purpose)
    if key in seen: return
    seen.add(key)
    file = file or "assets/Audio/%s.mp3" % vid
    t, v, _ = LINES.get(vid, ("", None, None))
    cues = "; ".join("%s @ %.2fs" % (c["k"], c["t"] / 1000) for c in CUES.get(vid, []))
    rows.append({"Section": section, "Screen": screen, "When it plays": purpose, "VO ID": vid, "File": file,
                 "Speaker": VOICE.get(json.dumps(v, sort_keys=True), "Swiftee") if v else "Swiftee",
                 "Hindi script": t, "Duration (s)": dur(os.path.join(ROOT, file)), "Highlight cues": cues, "Note": note})

# title screen
add("Title screen", "Title (cover)", "Greeting - plays when the title screen opens", "cap_landing")
gate_note = ("The game plays this older clip directly by file name; the script line %s in build_card.py "
             "(\"%s\") is NOT what is heard.")
GATE = {"tutorial": "Teaching", "guided": "Guided practice", "practice": "Independent practice"}
first_of = {}
for sl in card["slides"]: first_of.setdefault(sl["phase"], sl["id"])

def walk_ids(x, out):
    if isinstance(x, str):
        if x in LINES: out.append(x)
    elif isinstance(x, dict):
        for k, v in x.items():
            if isinstance(v, str) and v in LINES: out.append((k, v))
            else: walk_ids(v, out)
    elif isinstance(x, list):
        for v in x: walk_ids(v, out)
    return out

prev_phase = None
for sl in card["slides"]:
    if sl["type"] == "CELEBRATION":
        add("End screen", "Celebration", "Praise - plays after the celebration jingle (Swiftee lip-syncs to it)", sl["audio"]["prompt"]); continue
    sec = SECTION.get(sl["phase"], sl["phase"])
    if sl["phase"] != prev_phase and sl["phase"] in GATE:
        pid = "cap_pt_" + sl["phase"]
        add("Transition", GATE[sl["phase"]] + " transition", "Swiftee transition screen", "vo_pt_" + sl["phase"],
            note=gate_note % (pid, LINES.get(pid, ("",))[0]))
        rows[-1]["Hindi script"] = "(older clip - script not on file)"
        prev_phase = sl["phase"]
    screen = "%s - %s" % (sl["id"], sl.get("prompt_hi", ""))
    def flat(x, k=""):            # (key, id) for every clip id under the slide's audio map, however nested
        if isinstance(x, str): yield k, x
        elif isinstance(x, list):
            for v in x: yield from flat(v, k)
        elif isinstance(x, dict):
            for kk, v in x.items(): yield from flat(v, kk if isinstance(v, str) or not k else k)
    for k, vid in flat(sl.get("audio") or {}):
        add(sec, screen, PURPOSE.get(k, k), vid)
        if k in ("correct", "ok") and vid + "2" in LINES: add(sec, screen, "Correct after a wrong try (no «शाबाश!»)", vid + "2")
    for item in walk_ids(sl.get("data") or {}, []):
        k, vid = item if isinstance(item, tuple) else ("", item)
        add(sec, screen, PURPOSE.get(k, k or "During the activity"), vid)
        if k in ("ok", "correct") and vid + "2" in LINES: add(sec, screen, "Correct after a wrong try (no «शाबाश!»)", vid + "2")

# number words
for i in range(1, 11):
    vid = "cap_num_%d" % i
    if os.path.exists(os.path.join(AUD, vid + ".mp3")):
        add("All number questions", "Number cards / counting", "Spoken when the number %d card is tapped or counted" % i, vid)

# any script line not placed above (so nothing is missed)
for vid in LINES:
    if not any(r["VO ID"] == vid for r in rows) and not vid.startswith("cap_pt_"):
        add("Other", "-", "Played by the screen's own code", vid)

for n, r in enumerate(rows, 1): r["#"] = n
cols = ["#", "Section", "Screen", "When it plays", "VO ID", "File", "Speaker", "Hindi script", "Duration (s)", "Highlight cues", "Note"]
with open(os.path.join(ROOT, "VO_MANIFEST.csv"), "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(rows)

used = {os.path.basename(r["File"]) for r in rows}
unused = sorted(f for f in os.listdir(AUD) if f.endswith(".mp3") and not f.startswith("sfx_") and f not in used)
json.dump({"skill_code": card.get("skill_code"), "total_clips": len(rows),
           "total_seconds": round(sum(r["Duration (s)"] or 0 for r in rows), 1), "clips": rows,
           "audio_files_not_used_by_the_game": unused},
          open(os.path.join(ROOT, "VO_MANIFEST.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("VO manifest: %d clips, %.1f s of VO | %d audio files in assets/Audio are not used" %
      (len(rows), sum(r["Duration (s)"] or 0 for r in rows), len(unused)))

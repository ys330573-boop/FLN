# -*- coding: utf-8 -*-
"""
Apply the studio voice-overs (voiceovers/ folder) to the game.

  python _tools/apply_voiceovers.py

1. every file in voiceovers/ (names like "cap_p2_q.mp3.mp3" are fine) is converted to a REAL mp3 (mono, 44.1 kHz,
   96 kbps - the delivered files are WAV audio with an .mp3 name) and saved as assets/Audio/<id>.mp3
   (vo_pt_* also as cap_pt_*, the same transition clip)
2. the word timings of each recording (_tools/vo_studio_words.json - speech recognition, word by word) are aligned
   to the script line in _tools/build_card.py, so every word-timed highlight follows the NEW recording
3. _tools/vo_timings.json gets those timings, marked "studio": build_card.py never re-synthesises these clips

Then run:  python _tools/build_card.py   (cues + card)   and   python _tools/build_end_sprite.py   (end lip-sync)
"""
import json, os, re, subprocess, sys, difflib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, AUD = os.path.join(ROOT, "voiceovers"), os.path.join(ROOT, "assets", "Audio")
src = open(os.path.join(ROOT, "_tools", "build_card.py"), encoding="utf8").read()
ns = {}; exec(src[src.index("# ---------------------------------------------------------------- voices"):
                  src.index("# ---------------------------------------------------------------- slides")], ns)
LINES = ns["LINES"]
REC = json.load(open(os.path.join(ROOT, "_tools", "vo_studio_words.json"), encoding="utf8"))
TP = os.path.join(ROOT, "_tools", "vo_timings.json")
T = json.load(open(TP, encoding="utf8"))

def norm(w):   # compare Hindi words loosely: no punctuation, no nukta, chandrabindu = anusvara
    w = re.sub(r"[^ऀ-ॿ\w]", "", w).replace("़", "").replace("ँ", "ं")
    return w

def align(script_words, rec_words):
    """DP alignment script <-> recognised words; returns a start time (ms) per script word."""
    S = [norm(w) for w in script_words]; R = [norm(w[2]) for w in rec_words]
    n, m = len(S), len(R); GAP = -0.45
    sim = lambda a, b: difflib.SequenceMatcher(None, a, b).ratio() if a and b else 0
    D = [[0.0] * (m + 1) for _ in range(n + 1)]; B = [[None] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1): D[i][0] = D[i - 1][0] + GAP; B[i][0] = "u"
    for j in range(1, m + 1): D[0][j] = D[0][j - 1] + GAP; B[0][j] = "l"
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            s = sim(S[i - 1], R[j - 1]); d = D[i - 1][j - 1] + (s * 2 - 1 if s >= 0.45 else -1.2)
            u, l = D[i - 1][j] + GAP, D[i][j - 1] + GAP
            D[i][j], B[i][j] = max((d, "d"), (u, "u"), (l, "l"))
    i, j, hit = n, m, {}
    while i > 0 or j > 0:
        b = B[i][j]
        if b == "d":
            if sim(S[i - 1], R[j - 1]) >= 0.45: hit[i - 1] = rec_words[j - 1][0]
            i, j = i - 1, j - 1
        elif b == "u": i -= 1
        else: j -= 1
    # words the recogniser missed: spread between the matched neighbours (by word length)
    t = [hit.get(k) for k in range(n)]
    end = rec_words[-1][1] if rec_words else 0
    k = 0
    while k < n:
        if t[k] is not None: k += 1; continue
        a = k - 1; b = k
        while b < n and t[b] is None: b += 1
        t0 = t[a] if a >= 0 else (rec_words[0][0] if rec_words else 0)
        t1 = t[b] if b < n else end
        L = [len(S[x]) + 1 for x in range(k, b)]; tot = sum(L) + (len(S[a]) + 1 if a >= 0 else 0)
        acc = (len(S[a]) + 1) if a >= 0 else 0
        for x in range(k, b): t[x] = round(t0 + (t1 - t0) * acc / max(1, tot)); acc += L[x - k]
        k = b
    return t, len(hit) / max(1, n)

def main():
    files = {re.sub(r"(\.mp3)+$", ".mp3", f): f for f in os.listdir(SRC)}
    report = []
    for name, f in sorted(files.items()):
        clip = name[:-4]
        cid = "cap_pt_" + clip[len("vo_pt_"):] if clip.startswith("vo_pt_") else clip
        if cid not in LINES: print("!! not in the script:", name); continue
        outs = [clip] + ([cid] if cid != clip else [])
        for o in outs:
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(SRC, f), "-ac", "1", "-ar", "44100",
                            "-c:a", "libmp3lame", "-b:a", "96k", os.path.join(AUD, o + ".mp3")], check=True)
        text, voice, _ = LINES[cid]
        words = [w for w in text.split() if norm(w)]
        rec = REC.get(name, {}).get("words", [])
        times, q = align(words, rec)
        entry = {"key": text + "|" + json.dumps(voice, sort_keys=True), "words": [[tm, re.sub(r"[।॥,?!.]", "", w)] for tm, w in zip(times, words)],   # bare words (the cue matcher keeps "।")
                 "studio": True, "match": round(q, 2), "heard": REC.get(name, {}).get("text", "")}
        for o in set([cid, clip]): T[o] = entry
        report.append((name, q, REC.get(name, {}).get("text", "")))
    json.dump(T, open(TP, "w", encoding="utf8"), ensure_ascii=False, indent=1)
    print("applied", len(report), "clips")
    for name, q, heard in sorted(report, key=lambda r: r[1])[:15]:
        print("  %-22s words matched %3d%%   heard: %s" % (name, q * 100, heard[:80]))

if __name__ == "__main__":
    main()

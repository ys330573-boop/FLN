# -*- coding: utf-8 -*-
"""
End screen Swiftee - lip-synced sprite sheets from the STANDARD end animation
("folder Animations and SFX/Standard Swiftee Animations/Standard Swiftee End Animation").

  * uses only frames where Swiftee is fully inside his cell (the standard sheets cut the fingers off in
    some arms-out frames - those are left out, so nothing is ever cropped on screen)
  * the shabaash sheet draws him ~15% smaller and with the feet higher than the talk sheet: every frame
    is re-drawn on ONE common canvas (same scale, same foot line, same centre) so switching never jumps
  * the end VO (assets/Audio/cap_well_done.mp3) is measured every 25 ms: "1" = voice sounding (mouth open)

Run:  python _tools/build_end_sprite.py      -> assets/UI/end_sw_shabaash.webp, end_sw_talk.webp,
                                                _tools/end_sprite.json (read by build_card.py into the card)
"""
import json, os, subprocess, array
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STD = os.path.join(ROOT, "folder Animations and SFX", "Standard Swiftee Animations", "Standard Swiftee End Animation")
VO = os.path.join(ROOT, "assets", "Audio", "cap_well_done.mp3")

# frames used (standard sheet indices, 6 x 6 grid, cell 504 x 896)
S_PRE  = [1, 2, 3]                 # standing -> arms starting to rise (0 is drawn larger than the rest: left out)
S_UP   = [7, 8, 9, 10, 11, 12, 13, 14]       # arms up, "शाबाश!" (mouth open)
S_POST = [18, 19, 20, 21, 32, 33, 34, 35]    # arms come down -> standing, mouth shut
S_USED = S_PRE + S_UP + S_POST
T_USED = list(range(36))
T_OPEN = [0, 1, 2, 4, 5, 6, 8, 9, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32]  # mouth-open talk frames

STAND_CSS = 419          # standing height on screen (css px) - same as the previous end Swiftee
RES = 1.0                # sheet pixels per css px (same as the on-screen size)
STEP = 25                # lip-sync resolution (ms)

def cells(path):
    im = Image.open(path).convert("RGBA"); W, H = im.size; cw, ch = W // 6, H // 6
    return [im.crop(((i % 6) * cw, (i // 6) * ch, (i % 6 + 1) * cw, (i // 6 + 1) * ch)) for i in range(36)], cw, ch

def bbox(im): return im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()

S, cw, ch = cells(os.path.join(STD, "swiftie_shabaash.png"))
T, _, _ = cells(os.path.join(STD, "swiftie_talk.png"))
for i in S_USED:
    b = bbox(S[i]); assert b[0] > 1 and b[2] < cw - 1, ("cropped frame used", i)

# common frame of reference = the talk sheet; shabaash frames scaled about their feet to match
# matched where the animation actually switches sheets: the end of the cheer (shabaash 35, standing) -> talk 3 (standing)
sb, tb = bbox(S[35]), bbox(T[3])
k = (tb[3] - tb[1]) / (sb[3] - sb[1])                  # standing height ratio (~1.15)
S_FEET, T_FEET, CX = sb[3], tb[3], (tb[0] + tb[2]) / 2
def place_S(i):        # (image, x, y) of a shabaash frame on the talk canvas
    im = S[i].resize((round(cw * k), round(ch * k)), Image.LANCZOS)
    return im, CX - (sb[0] + sb[2]) / 2 * k, T_FEET - S_FEET * k
def place_T(i): return T[i], 0, 0

# union of every used frame on the common canvas (+ margin) = the output frame
U = None
for pl, idx in ((place_S, S_USED), (place_T, T_USED)):
    for i in idx:
        im, x, y = pl(i); b = bbox(im); r = (x + b[0], y + b[1], x + b[2], y + b[3])
        U = r if U is None else (min(U[0], r[0]), min(U[1], r[1]), max(U[2], r[2]), max(U[3], r[3]))
M = 6; U = (U[0] - M, U[1] - M, U[2] + M, U[3] + M)
f_css = STAND_CSS / (bbox(T[0])[3] - bbox(T[0])[1])                    # source px -> css px
FW, FH = round((U[2] - U[0]) * f_css), round((U[3] - U[1]) * f_css)
PW, PH = round(FW * RES), round(FH * RES)

def sheet(pl, idx, cols, name):
    rows = -(-len(idx) // cols); out = Image.new("RGBA", (cols * PW, rows * PH), (0, 0, 0, 0))
    for n, i in enumerate(idx):
        im, x, y = pl(i)
        fr = Image.new("RGBA", (round(U[2] - U[0]), round(U[3] - U[1])), (0, 0, 0, 0))
        fr.alpha_composite(im, (round(x - U[0]), round(y - U[1])))
        out.paste(fr.resize((PW, PH), Image.LANCZOS), ((n % cols) * PW, (n // cols) * PH))
    p = os.path.join(ROOT, "assets", "UI", name); out.save(p, "WEBP", quality=84, method=6)
    print(name, out.size, os.path.getsize(p) // 1024, "KB")
    return {"src": "assets/UI/" + name, "cols": cols, "rows": rows}

SS = sheet(place_S, S_USED, 5, "end_sw_shabaash.webp")
TS = sheet(place_T, T_USED, 6, "end_sw_talk.webp")

# lip-sync: loudness every 25 ms of the end VO
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", VO, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
pcm = array.array("h", raw); n = 16000 * STEP // 1000
rms = [(sum(s * s for s in pcm[j:j + n]) / max(1, len(pcm[j:j + n]))) ** .5 for j in range(0, len(pcm), n)]
ref = sorted(rms)[int(len(rms) * .95)]
bits = ["1" if r > ref * .22 else "0" for r in rms]
def clean(b, val, minlen):   # remove runs of `val` shorter than minlen steps (flicker)
    b = b[:]; i = 0
    while i < len(b):
        if b[i] == val:
            j = i
            while j < len(b) and b[j] == val: j += 1
            if j - i < minlen and i > 0 and j < len(b): b[i:j] = ["0" if val == "1" else "1"] * (j - i)
            i = j
        else: i += 1
    return b
bits = clean(clean(bits, "0", 2), "1", 2)            # closures >= 50 ms, openings >= 50 ms
bits = "".join(bits)
s0 = bits.index("1"); e0 = s0; gap = 0
for j in range(s0, len(bits)):                      # first word = first loud run, a 200 ms silence ends it
    if bits[j] == "1": e0 = j; gap = 0
    else:
        gap += 1
        if gap >= 200 // STEP: break
nxt = bits.find("1", e0 + 200 // STEP)

meta = {"fw": FW, "fh": FH, "feet": round((T_FEET - U[1]) * f_css), "cx": round((CX - U[0]) * f_css),
        "step_ms": STEP, "bits": bits, "word_start": s0 * STEP, "word_end": (e0 + 1) * STEP, "talk_start": (nxt if nxt > 0 else e0 + 1) * STEP,
        "shabaash": dict(SS, pre=list(range(0, len(S_PRE))), up=list(range(len(S_PRE), len(S_PRE) + len(S_UP))),
                         post=list(range(len(S_PRE) + len(S_UP), len(S_USED)))),
        "talk": dict(TS, open=T_OPEN)}
json.dump(meta, open(os.path.join(ROOT, "_tools", "end_sprite.json"), "w", encoding="utf8"), indent=1)
print("frame css", FW, "x", FH, "| feet", meta["feet"], "cx", meta["cx"], "| shabaash word", meta["word_start"], "-", meta["word_end"],
      "| talk from", meta["talk_start"], "| VO", len(bits) * STEP, "ms | open steps", bits.count("1"), "/", len(bits))

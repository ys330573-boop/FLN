"""[page 11] 'customer holding the bottle' art (ASSETE MAP): each supplied PNG is scaled + placed onto the SAME
canvas as that customer's walking PNG, so the head (eyes) lands exactly where it was — the swap never jumps.
Writes assets/Images/cap_shop_<name>_hold.png and prints the face boxes (eyes / open mouth, canvas px) + skin."""
import os, json
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# bottle held in the hands (source px) — the flying bottle lands exactly on it
BOTTLE = { "man": [187, 327, 89, 229], "woman": [142, 332, 85, 224], "boy": [137, 305, 80, 207] }
SRC = { "man":   ("ChatGPT Image Sep 30, 2026, 01_30_13 PM 1.png", [[188,163,33,35],[261,165,29,33]], [208,229,52,29], (180,222), (250,262)),
        "woman": ("ChatGPT Image Sep 30, 2026, 01_30_13 PM 2.png", [[141,183,35,36],[214,188,35,35]], [164,236,56,31], (150,240), (192,272)),
        "boy":   ("Group 19 (1).png",                               [[125,130,30,34],[189,130,30,33]], [146,179,52,25], (130,185), (171,207)) }
OLD_EYES = { "man": [[165,110,24,26],[222,113,22,25]], "woman": [[92,118,30,30],[154,124,24,26]], "boy": [[115,115,27,31],[173,118,22,25]] }
ctr = lambda b: (b[0] + b[2] / 2, b[1] + b[3] / 2)
out = {}
for name, (fn, eyes, mouth, skin_pt, lip_pt) in SRC.items():
    im = Image.open(os.path.join(ROOT, "ASSETE MAP", fn)).convert("RGBA")
    old = Image.open(os.path.join(ROOT, "assets", "Images", "cap_shop_%s.png" % name)); W, H = old.size
    (a, b), (c, d) = ctr(eyes[0]), ctr(eyes[1]); (oa, ob), (oc, od) = ctr(OLD_EYES[name][0]), ctr(OLD_EYES[name][1])
    k = ((oc - oa) ** 2 + (od - ob) ** 2) ** .5 / ((c - a) ** 2 + (d - b) ** 2) ** .5
    ox = (oa + oc) / 2 - (a + c) / 2 * k; oy = (ob + od) / 2 - (b + d) / 2 * k
    sm = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    can = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    can.paste(sm, (round(ox), round(oy)), sm)
    can.save(os.path.join(ROOT, "assets", "Images", "cap_shop_%s_hold.png" % name), optimize=True)
    T = lambda bx: [round(bx[0] * k + ox, 1), round(bx[1] * k + oy, 1), round(bx[2] * k, 1), round(bx[3] * k, 1)]
    hexc = lambda p: "#%02X%02X%02X" % im.getpixel(p)[:3]
    out[name] = { "skin": hexc(skin_pt), "lip": hexc(lip_pt), "eyes": [T(e) for e in eyes], "mouth": T(mouth), "bottle": T(BOTTLE[name]) }
print(json.dumps(out))

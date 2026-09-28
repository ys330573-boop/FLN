# -*- coding: utf-8 -*-
"""Page 11 (milk shop) from the Figma frames in ASSETE MAP (1920x1080):
  "order view.svg"  — shop seen from behind the counter: 3 customers + 3 milk bottles (big / middle / small)
  "puring view.svg" — measuring view: wall + counter, one bottle, 5 empty glasses

Outputs
  assets/Images/cap_shop_order.jpg   order view with the 3 bottles removed (they become tappable vessels)
  assets/Images/cap_shop_pour.jpg    pouring view with the bottle + glasses removed
  _tools/cap_shop_art.js             CAP_SHOP_ART: the 3 bottles + the glass as animatable art (Figma
                                     coordinates, so the game places them exactly where Figma has them)
Run:  python _tools/build_shop.py --patch     (also splices CAP_SHOP_ART into app.js)
Needs Playwright + Chrome.
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "ASSETE MAP")
url = lambda n: "file:///" + os.path.join(ART, n).replace("\\", "/").replace(" ", "%20")
clean = lambda h: re.sub(r"\s+", " ", h.replace(' xmlns="http://www.w3.org/2000/svg"', "")).strip()
def js(x): return x.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")

BOTTLES = {"b4": (9, 20), "b3": (21, 32), "b2": (33, 44)}   # child index ranges in the order view (big→small)

def sample(pg, sel_js, n=40):
    return pg.evaluate("""([s,n])=>{const e=eval(s);const L=e.getTotalLength();const o=[];
      for(let i=0;i<n;i++){const q=e.getPointAtLength(L*i/n);o.push([+q.x.toFixed(1),+q.y.toFixed(1)])}return o}""", [sel_js, n])

def main():
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        # ---- order view ----
        pg = b.new_page(viewport={"width": 1920, "height": 1080}); pg.goto(url("order view.svg")); pg.wait_for_timeout(900)
        kids = "[...document.querySelector('svg > g').children]"
        for key, (a, z) in BOTTLES.items():
            parts = pg.evaluate("([a,z])=>" + kids + ".slice(a,z+1).map(e=>e.outerHTML)", [a, z])
            parts = [clean(h) for h in parts]
            box = pg.evaluate("([a,z])=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;" + kids + ".slice(a,z+1).forEach(e=>{const r=e.getBBox();"
                              "x0=Math.min(x0,r.x);y0=Math.min(y0,r.y);x1=Math.max(x1,r.x+r.width);y1=Math.max(y1,r.y+r.height)});return [x0,y0,x1,y1]}", [a, z])
            tint = sample(pg, kids + "[%d]" % (a + 1))               # glass tint = the bottle's full inside
            surf = pg.evaluate("i=>{const r=" + kids + "[i].getBBox();return [r.x+r.width/2,r.y+r.height/2,r.width/2,r.height/2]}", a + 7)
            refs = sorted(set(re.findall(r'url\(#([^)]+)\)', "".join(parts))))
            defs = pg.evaluate("ids=>ids.map(i=>document.getElementById(i).outerHTML).join('')", refs)
            d_tint = re.search(r' d="([^"]+)"', parts[1]).group(1)
            milk_fill = re.search(r'fill="(url\([^)]+\))"', parts[3]).group(1)
            # parts: 0 base, 1 glass tint, 2-3 painted milk, 4-6 shine, 7 painted milk surface, 8-11 shine/dot.
            # The painted milk + its surface are replaced by the game's live milk layer (so an emptied bottle looks empty).
            out[key] = dict(box=box, back=parts[0] + parts[1], front="".join(parts[4:7] + parts[8:]),
                            milk='<path fill="%s" d="%s"/>' % (milk_fill, d_tint), surf_c=surf,
                            poly=tint, defs=clean(defs))
        pg.evaluate(kids + ".slice(9).forEach(e=>e.style.display='none')")
        # layers so the customers can walk in one by one: village (0-1) · customers (3 man, 5 woman, 6 boy) ·
        # counter + window frame (2, 4, 7, 8) drawn IN FRONT of them
        CH = {"man": 3, "woman": 5, "boy": 6}
        out["chars"] = {}
        show = lambda keep: pg.evaluate("k=>" + kids + ".forEach((e,i)=>{ if(i<9) e.style.display = k.includes(i) ? '' : 'none'; })", keep)
        pg.evaluate("document.documentElement.style.background='transparent'")
        show([0, 1]); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(ROOT, "assets", "Images", "_order.png"))
        show([2, 4, 7, 8]); pg.wait_for_timeout(300)
        pg.screenshot(path=os.path.join(ROOT, "assets", "Images", "cap_shop_front.png"), omit_background=True)
        for name, i in CH.items():
            show([i]); pg.wait_for_timeout(250)
            r = pg.evaluate("i=>{const b=" + kids + "[i].getBBox();return [b.x,b.y,b.width,b.height]}", i)
            x, y, w, h = [int(round(v)) for v in r]; y2 = min(1080, y + h)
            pg.screenshot(path=os.path.join(ROOT, "assets", "Images", "cap_shop_%s.png" % name), omit_background=True,
                          clip={"x": x, "y": y, "width": w, "height": y2 - y})
            out["chars"][name] = [x, y, w, y2 - y]
        pg.close()
        # ---- pouring view ----
        pg = b.new_page(viewport={"width": 1920, "height": 1080}); pg.goto(url("puring view.svg")); pg.wait_for_timeout(900)
        g = pg.evaluate(kids + "[14].outerHTML")
        gbox = pg.evaluate("(()=>{const r=" + kids + "[14].getBBox();return [r.x,r.y,r.x+r.width,r.y+r.height]})()")
        inner = sample(pg, kids + "[14].querySelectorAll('path')[4]")   # the glass's inner wall
        refs = sorted(set(re.findall(r'url\(#([^)]+)\)', g)))
        gdefs = pg.evaluate("ids=>ids.map(i=>document.getElementById(i).outerHTML).join('')", refs)
        slots = pg.evaluate("[14,15,16,17,18].map(i=>{const r=" + kids + "[i].getBBox();return [r.x,r.y,r.width,r.height]})")
        bottle_pour = pg.evaluate("(()=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;" + kids + ".slice(2,14).forEach(e=>{const r=e.getBBox();"
                                  "x0=Math.min(x0,r.x);y0=Math.min(y0,r.y);x1=Math.max(x1,r.x+r.width);y1=Math.max(y1,r.y+r.height)});return [x0,y0,x1,y1]})()")
        out["glass"] = dict(box=gbox, whole=clean(g), inner=inner, defs=clean(gdefs))
        pg.evaluate(kids + ".slice(2).forEach(e=>e.style.display='none')")
        pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(ROOT, "assets", "Images", "_pour.png")); pg.close()
        b.close()
    from PIL import Image
    for n in ("order", "pour"):
        src = os.path.join(ROOT, "assets", "Images", "_%s.png" % n)
        Image.open(src).convert("RGB").save(os.path.join(ROOT, "assets", "Images", "cap_shop_%s.jpg" % n), quality=85, optimize=True)
        os.remove(src)

    # ---- CAP_SHOP_ART (art units = Figma px, shifted so each piece starts at 0,0) ----
    ents = []
    for key in ("b4", "b3", "b2"):
        e = out[key]; x0, y0, x1, y1 = e["box"]; x0 -= 2; y0 -= 2; x1 += 2; y1 += 2
        poly = [[round(x, 1), round(y, 1)] for x, y in e["poly"]]   # geometry stays in Figma (markup) coords; shift moves both
        ys = [q[1] for q in poly]; top, bot = min(ys), max(ys)
        cx, cy, rx, ry = e["surf_c"]
        neck = [q for q in poly if q[1] < top + (bot - top) * 0.06]
        nx0, nx1 = min(q[0] for q in neck), max(q[0] for q in neck)
        ents.append("""  %s: { vb:[%s,%s], shift:[%s,%s], fig:[%s,%s],
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:"", defs:`%s`,
    poly:%s,
    surfC:[%s,%s], yTop:%s, yFill:%s, yBot:%s, xTop:[%s,%s], xBot:[%s,%s],
    lipR:[%s,%s], lipL:[%s,%s], mouth:[%s,%s] }""" % (
            "shop" + key, round(x1 - x0, 1), round(y1 - y0, 1), round(-x0, 1), round(-y0, 1), round(x0, 1), round(y0, 1),
            js(e["back"]), js(e["milk"]),
            js('<ellipse cx="%s" cy="%s" rx="%s" ry="%s" fill="#FFFFFF" stroke="#DCD5C4" stroke-width="1"/>' % (cx, cy, rx, max(ry, 3))),
            js(e["front"]), js(e["defs"]), json.dumps(poly, separators=(",", ":")),
            round(cx, 1), round(cy, 1), top, round(cy, 1), bot, nx0, nx1,
            round(min(q[0] for q in poly), 1), round(max(q[0] for q in poly), 1),
            nx1, top, nx0, top, round((nx0 + nx1) / 2, 1), top))
    gl = out["glass"]; x0, y0, x1, y1 = gl["box"]; x0 -= 2; y0 -= 2; x1 += 2; y1 += 2
    # the glass's inner wall is a thin ring-shaped path — sampling it gives no body to fill, so the milk
    # uses the tapered inside of the glass read off the Figma frame (slot 1: x 736-897, y 647-894)
    inner = [[745, 681], [889, 681], [880, 760], [868, 872], [817, 878], [766, 872], [754, 760]]
    ys = [q[1] for q in inner]; itop, ibot = min(ys), max(ys)
    xs = [q[0] for q in inner]
    d_in = "M" + " L".join("%s,%s" % tuple(q) for q in inner) + " Z"
    whole = re.sub(r' filter="url\([^)]+\)"', "", gl["whole"], count=1)           # page draws its own soft shadow
    ents.append("""  shopglass: { vb:[%s,%s], shift:[%s,%s], fig:[%s,%s],
    back:`%s`, milk:`%s`, surf:`%s`, front:"", cork:"", defs:`%s`,
    poly:%s,
    surfC:[%s,%s], yTop:%s, yFill:%s, yBot:%s, xTop:[%s,%s], xBot:[%s,%s],
    lipR:[%s,%s], lipL:[%s,%s], mouth:[%s,%s] }""" % (
        round(x1 - x0, 1), round(y1 - y0, 1), round(-x0, 1), round(-y0, 1), round(x0, 1), round(y0, 1),
        js(whole), js('<path fill="url(#{U}gm)" d="%s"/>' % d_in),
        js('<ellipse cx="%s" cy="%s" rx="%s" ry="9" fill="#FFFFFF" stroke="#DCD5C4" stroke-width="1"/>' % (
            round((min(xs) + max(xs)) / 2, 1), round(itop + 12, 1), round((max(xs) - min(xs)) / 2, 1))),
        js(gl["defs"] + '<linearGradient id="{U}gm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F4F1EA"/>'
           '<stop offset=".35" stop-color="#FFFFFF"/><stop offset=".8" stop-color="#F1EDE4"/><stop offset="1" stop-color="#E2DDD1"/></linearGradient>'),
        json.dumps(inner, separators=(",", ":")),
        round((min(xs) + max(xs)) / 2, 1), round(itop + 12, 1), itop, round(itop + 12, 1), ibot,
        min(xs), max(xs), min(xs) + 8, max(xs) - 8, max(xs) + 6, itop - 6, min(xs) - 6, itop - 6, round((min(xs) + max(xs)) / 2, 1), itop - 6))
    body = "const CAP_SHOP_ART = {\n" + ",\n".join(ents) + "\n};\n"
    # namespace every id + url(#id) so repeated vessels never share gradient/filter ids
    body = re.sub(r'\b(paint\d+_linear|filter\d+_d|pattern\d+)_(1_4|45_11859)\b', r'{U}\1', body)
    head = ("/* [MTG2A04_L03_S01 page 11] Figma shop art (ASSETE MAP \"order view.svg\" / \"puring view.svg\"),\n"
            "   generated by _tools/build_shop.py. fig = the piece's top-left in the 1920x1080 Figma frame. */\n")
    meta = "const CAP_SHOP_FIG = %s;\n" % json.dumps({"chars": out["chars"], "glass_slots": [[round(v, 1) for v in s] for s in slots],
                                                   "pour_bottle": [round(v, 1) for v in bottle_pour]})
    text = head + body + meta
    open(os.path.join(ROOT, "_tools", "cap_shop_art.js"), "w", encoding="utf8").write(text)
    print("cap_shop_art.js", len(text), "chars")
    if "--patch" in sys.argv:
        ap = os.path.join(ROOT, "app.js"); a = open(ap, encoding="utf8").read()
        if "const CAP_SHOP_ART" in a:
            s0 = a.index("/* [MTG2A04_L03_S01 page 11] Figma shop art"); s1 = a.index("const CAP_SHOP_FIG"); s1 = a.index(";\n", s1) + 2
            a = a[:s0] + text + a[s1:]
        else:
            m = "/* [MTG2A04_L03_S01 page 4] supplied art"
            a = a.replace(m, text + m, 1)
        open(ap, "w", encoding="utf8").write(a); print("patched app.js")

main()

# -*- coding: utf-8 -*-
"""Split the supplied page-4 art (ASSETE MAP) into animatable SVG layers -> _tools/cap_art.js.

  glass  = "glass svg.svg" (an empty tumbler; the milk/water layer is added here) — pages 4 and 5
  jug    = "jug.svg" (mirrored so the spout faces the glasses; liquid re-coloured to water) — page 5
  oiljar = "jar.svg" (empty glass jar; mustard oil added) — page 7
  teacup = "cup.svg" (opaque mug; oil shows growing in its opening) — page 7
  pot    = "bhaagona.svg" (transparent glass pot; milk added) — page 8
  milkcup= "milk cup.svg" (opaque cup of milk; milk shows in its opening) — page 8
  bottle = "svg glass.svg" (despite its name: the corked milk bottle)

Layers per vessel: back (vessel body), milk (liquid body), surf (liquid surface ellipse),
front (shine), cork. The game clips `milk` to a live level and moves `surf`, so the same art
can be emptied / filled on screen. Re-run after changing the art; then paste the output over
the CAP_ART block in app.js (python _tools/build_art.py --patch does it for you).
"""
import json, os, re, sys, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "ASSETE MAP")

def clean(h):
    return re.sub(r"\s+", " ", h.replace(' xmlns="http://www.w3.org/2000/svg"', "")).strip()

def sheet_group(path, index):
    """outerHTML of every child of <svg><g>[index] (needs Playwright + Chrome)."""
    from playwright.sync_api import sync_playwright
    url = "file:///" + path.replace("\\", "/").replace(" ", "%20")
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome"); pg = b.new_page(); pg.goto(url); pg.wait_for_timeout(300)
        parts = pg.evaluate("i => [...document.querySelector('svg > g').children[i].children].map(e => e.outerHTML)", index)
        b.close()
    return [clean(h) for h in parts]

def js(x):
    return x.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")

LIQ = {   # liquid colours: horizontal body gradient (left, lit, right, shade) + surface fill/edge
    "milk":  (("#F4F1EA", "#FFFFFF", "#F1EDE4", "#E2DDD1"), "#FFFFFF", "#E4DED0", "1"),
    "water": (("#7CC4F0", "#B4E3FC", "#8ACDF5", "#63AEE3"), "#CDEEFF", "#7FB9E0", ".92"),
    "oil":   (("#F6C43A", "#FFE07A", "#EFB321", "#C8890B"), "#FFD95E", "#D9A21A", "1"),
}

def grad(uid, liquid):
    st, _, _, _ = LIQ[liquid]
    return ('<linearGradient id="{U}%s" x1="0" y1="0" x2="1" y2="0">'
            '<stop offset="0" stop-color="%s"/><stop offset=".35" stop-color="%s"/>'
            '<stop offset=".8" stop-color="%s"/><stop offset="1" stop-color="%s"/></linearGradient>') % ((uid,) + st)

def glass_layers(liquid="milk"):
    """"glass svg.svg": an EMPTY tumbler (9 paths: 0-3 glass tint, 4-5 white outline, 6-8 shine).
    The liquid is added here, shaped to the tapered inside, and drawn UNDER the shine + rim so it
    reads as inside the glass. A soft blue edge is added under the white outline so the glass
    stays visible on the light card once it has been emptied."""
    s = open(os.path.join(ART, "glass svg.svg"), encoding="utf8").read()
    p = [clean(e) for e in re.findall(r"<path[^>]*/>", s)]
    assert len(p) == 9, "glass art changed shape: %d paths" % len(p)
    # the file's root <svg fill="none"> is dropped when inlined; stroke-only paths must carry it
    p = [e if " fill=" in e else e.replace("<path ", '<path fill="none" ', 1) for e in p]
    edge = "".join(re.sub(r'stroke="white" stroke-width="0.811"', 'stroke="#7FA9CC" stroke-width="2.2"', p[i]) for i in (5, 4))
    back = edge + "".join(p[0:4])
    _, sf, se, op = LIQ[liquid]
    milk = ('<g opacity="%s"><path fill="url(#{U}lq)" d="M1.4,12.5 L100.9,12.5 L91.1,158 Q51.15,166.5 11.2,158 Z"/>'
            '<path fill="url(#{U}dp)" d="M1.4,12.5 L100.9,12.5 L91.1,158 Q51.15,166.5 11.2,158 Z"/>'
            '<path fill="#FFFFFF" opacity=".45" d="M9,20 L19,20 L25,154 L17,153 Z"/></g>') % op
    surf = '<ellipse cx="51.15" cy="24" rx="49.7" ry="10.4" fill="%s" stroke="%s" stroke-width="0.9"/>' % (sf, se)
    front = "".join(p[6:9]) + p[5] + p[4]
    return back, milk, surf, front, grad("lq", liquid) + depth()

def depth():
    """vertical depth shading for a liquid body: clear at the top, deeper toward the bottom"""
    return ('<linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#0B4F8A" stop-opacity="0"/><stop offset=".55" stop-color="#0B4F8A" stop-opacity=".06"/>'
            '<stop offset="1" stop-color="#0B4F8A" stop-opacity=".2"/></linearGradient>')

def jug_layers(liquid="water"):
    """"jug.svg" (69x84): handle (children 0-6), glass body (7), liquid (8), shading/shine (9-13).
    Mirrored so the spout faces RIGHT (toward the glasses); its painted liquid is re-coloured to
    `liquid`, and a thin surface line is added so the level can move."""
    import xml.etree.ElementTree as ET
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    root = ET.parse(os.path.join(ART, "jug.svg")).getroot()
    kids = [clean(ET.tostring(k, encoding="unicode")) for k in root]
    assert len(kids) == 14, "jug art changed shape: %d parts" % len(kids)
    kids = [k if " fill=" in k.split(">")[0] or k.startswith("<g") else k.replace("<path ", '<path fill="none" ', 1) for k in kids]
    M = lambda x: '<g transform="matrix(-1 0 0 1 69 0)">%s</g>' % x
    # The painted liquid (child 8) stops at its fill line, so a tipped jug would show that hard edge.
    # Use the whole jug body (child 7) as the liquid shape instead; the game clips it to the level.
    assert 'fill="#D5E6ED"' in kids[7], "jug body colour changed"
    liq = kids[7].replace('fill="#D5E6ED"', 'fill="url(#{U}lq)"') + kids[7].replace('fill="#D5E6ED"', 'fill="url(#{U}dp)"')
    # drop the opaque white stripe (child 10); soften the white/grey overlays that washed the water out
    soft = lambda k, a, b: k.replace('opacity="%s"' % a, 'opacity="%s"' % b, 1)
    front = soft(kids[9], "0.2", "0.12") + soft(kids[11], "0.4", "0.2") + soft(kids[12], "0.2", "0.1") + soft(kids[13], "0.7", "0.18")
    _, sf, se, _ = LIQ[liquid]
    surf = '<ellipse cx="41.5" cy="26.2" rx="23.4" ry="1.3" fill="%s" opacity=".9"/>' % sf
    return M("".join(kids[0:8])), M(liq), surf, M(front), grad("lq", liquid) + depth()

OIL = ('<linearGradient id="{U}lq" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6C43A"/>'
       '<stop offset=".32" stop-color="#FFE07A"/><stop offset=".78" stop-color="#EFB321"/><stop offset="1" stop-color="#C8890B"/></linearGradient>'
       '<linearGradient id="{U}dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A4A00" stop-opacity="0"/>'
       '<stop offset=".6" stop-color="#7A4A00" stop-opacity=".08"/><stop offset="1" stop-color="#7A4A00" stop-opacity=".26"/></linearGradient>')
EDGE = "#6F9CC4"

def oiljar_art():
    """Page 7 oil jar — drawn here (no supplied art) in the same flat-glass style as the supplied
    glass/bottle: thick glass lip, rounded shoulders, golden mustard oil with depth + shine."""
    body = "M30,34 C18,40 12,52 12,66 L12,182 Q12,196 28,196 L122,196 Q138,196 138,182 L138,66 C138,52 132,40 120,34 Z"
    inside = "M34,24 L116,24 L116,36 C128,44 134,54 134,68 L134,180 Q134,192 120,192 L30,192 Q16,192 16,180 L16,68 C16,54 22,44 34,36 Z"
    back = ('<ellipse cx="75" cy="197" rx="62" ry="5" fill="#0B3D8C" opacity=".08"/>'
            '<path fill="rgba(226,242,252,.55)" d="%s"/>' % body +
            '<rect x="28" y="16" width="94" height="22" rx="7" fill="rgba(226,242,252,.7)"/>')
    liq = ('<path fill="url(#{U}lq)" d="%s"/><path fill="url(#{U}dp)" d="%s"/>' % (inside, inside) +
           '<path fill="#FFFFFF" opacity=".32" d="M24,70 L34,70 L34,182 L26,182 Z"/>')
    surf = '<ellipse cx="75" cy="60" rx="58" ry="6" fill="#FFD95E" stroke="#D9A21A" stroke-width=".8"/>'
    front = ('<path fill="none" stroke="%s" stroke-width="2.4" stroke-linejoin="round" d="%s"/>' % (EDGE, body) +
             '<rect x="28" y="16" width="94" height="22" rx="7" fill="none" stroke="%s" stroke-width="2.4"/>' % EDGE +
             '<path d="M30,24 L120,24 M30,30 L120,30" stroke="%s" stroke-width="1.1" opacity=".55"/>' % EDGE +
             '<path d="M21,72 L21,180" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" opacity=".75"/>'
             '<path d="M128,80 L128,150" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".5"/>'
             '<path d="M34,19 L60,19" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".8"/>')
    return back, liq, surf, front, OIL

def teacup_art():
    """Page 7 glass teacup on a saucer — same style; the oil can fill it to a clear 'full' line."""
    body = "M14,18 L98,18 Q96,74 80,88 Q56,98 32,88 Q16,74 14,18 Z"
    inside = "M16,19 L96,19 Q94,73 79,86 Q56,95 33,86 Q18,73 16,19 Z"
    back = ('<ellipse cx="56" cy="97" rx="52" ry="7.5" fill="#E9F3FB" stroke="#8FB5D6" stroke-width="1.6"/>'
            '<ellipse cx="56" cy="95.5" rx="34" ry="4" fill="#D6E8F5"/>'
            '<path d="M96,32 C122,30 124,74 86,78" fill="none" stroke="%s" stroke-width="8" stroke-linecap="round"/>' % EDGE +
            '<path d="M96,32 C122,30 124,74 86,78" fill="none" stroke="#EAF5FC" stroke-width="3.5" stroke-linecap="round"/>'
            '<path fill="rgba(226,242,252,.6)" d="%s"/>' % body)
    liq = ('<path fill="url(#{U}lq)" d="%s"/><path fill="url(#{U}dp)" d="%s"/>' % (inside, inside) +
           '<path fill="#FFFFFF" opacity=".3" d="M22,26 L30,26 L36,80 L30,80 Z"/>')
    surf = '<ellipse cx="56" cy="30" rx="40" ry="5" fill="#FFD95E" stroke="#D9A21A" stroke-width=".6"/>'
    front = ('<path fill="none" stroke="%s" stroke-width="2.2" stroke-linejoin="round" d="%s"/>' % (EDGE, body) +
             '<ellipse cx="56" cy="18" rx="42" ry="6" fill="rgba(255,255,255,.25)" stroke="%s" stroke-width="2"/>' % EDGE +
             '<path d="M22,26 Q24,62 34,80" stroke="#FFFFFF" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".75"/>')
    return back, liq, surf, front, OIL

def svg_children(name):
    """top-level children of an ASSETE MAP svg (root fill="none" re-applied to stroke-only paths) + its <defs>"""
    import xml.etree.ElementTree as ET
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    root = ET.parse(os.path.join(ART, name)).getroot()
    kids, defs = [], ""
    for k in root:
        h = clean(ET.tostring(k, encoding="unicode"))
        if k.tag.endswith("defs"):
            defs = re.sub(r"^<defs>|</defs>$", "", h); continue
        if h.startswith("<path") and " fill=" not in h.split(">")[0]:
            h = h.replace("<path ", '<path fill="none" ', 1)
        kids.append(h)
    return kids, defs

def jar_layers():
    """"jar.svg" (90x109): an EMPTY glass jar — 0 glass body, 1-2 shine, 3 outline, 4 rim shade,
    5 shoulder line, 6-7 rim. Oil is added: the whole body shape (so a tipped jar shows a level
    surface), clipped to the level by the game, drawn under the shine/outline/rim."""
    k, defs = svg_children("jar.svg")
    assert len(k) == 8, "jar art changed shape: %d parts" % len(k)
    d = re.search(r' d="([^"]+)"', k[0]).group(1)
    liq = ('<path fill="url(#{U}lq)" d="%s"/><path fill="url(#{U}dp)" d="%s"/>' % (d, d) +
           '<path fill="#FFFFFF" opacity=".28" d="M9,30 L15,30 L15,92 L10,92 Z"/>')
    surf = '<ellipse cx="44.6" cy="20" rx="35.5" ry="4.2" fill="#FFD95E" stroke="#D9A21A" stroke-width=".45"/>'
    edge = '<path fill="none" stroke="#98B0C6" stroke-width="1.5" opacity=".9" d="%s"/>' % d   # keeps the EMPTY jar visible
    return k[0], liq, surf, edge + "".join(k[1:8]), defs + OIL

def cup_layers():
    """"cup.svg" (98x82): a white mug — 0-1 handle, 2 body, 3-4 shine, 5 shade, 6 rim, 7 opening,
    8 opening shade. Made SEE-THROUGH (body at low opacity, like glass) with the oil drawn INSIDE
    it, so a child can see each cup fill up — not just a thin ring at the rim."""
    k, defs = svg_children("cup.svg")
    assert len(k) == 9, "cup art changed shape: %d parts" % len(k)
    d = re.search(r' d="([^"]+)"', k[2]).group(1)
    glassy = lambda h, o: h.replace("<path ", '<path opacity="%s" ' % o, 1) if 'opacity=' not in h.split(">")[0] else h
    # handle: glass like the body (was solid grey), with the same edge line, and masked OUT where it
    # would show through the clear body (its root end sits behind the cup)
    hd = re.search(r' d="([^"]+)"', k[0]).group(1)
    mask = ('<mask id="{U}hm" maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="100">'
            '<rect x="-10" y="-10" width="120" height="100" fill="#fff"/><path fill="#000" d="%s"/></mask>' % d)
    handle = ('<g mask="url(#{U}hm)"><path fill="#E9F1F7" opacity=".55" d="%s"/>' % hd +
              '<path fill="none" stroke="#B9C3CC" stroke-width="1.4" d="%s"/></g>' % hd)
    back = mask + handle + glassy(k[7], ".5")
    oil = ('<path fill="url(#{U}lq)" d="%s"/><path fill="url(#{U}dp)" d="%s"/>' % (d, d))
    surf = '<ellipse cx="37.5" cy="9" rx="36" ry="3.2" fill="#FFD95E" stroke="#D9A21A" stroke-width=".5"/>'
    body = glassy(k[2], ".2")
    edge = '<path fill="none" stroke="#B9C3CC" stroke-width="1.4" d="%s"/>' % d
    front = body + edge + k[3] + k[4] + k[5] + k[6]
    return back, oil, surf, front, defs + OIL

def pot_layers():
    """"bhaagona.svg" (104x114): a transparent glass pot. Children of its clipped <g>: 0-2 base shadow,
    3 body tint, 4 mask def, 5 masked streaks, 6 upper haze band (dropped: it reads as a fake water
    line), 7/9-13 neck + rim, 8 outline tint, 14-17/20 shine, 18-19 side edges. Milk = the body shape."""
    import xml.etree.ElementTree as ET
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    root = ET.parse(os.path.join(ART, "bhaagona.svg")).getroot()
    g = [c for c in root if c.tag.endswith("}g")][0]
    k = [clean(ET.tostring(c, encoding="unicode")) for c in g]
    assert len(k) == 21, "pot art changed shape: %d parts" % len(k)
    k = [h.replace("mask0_2_9632", "{U}m0") for h in k]
    d = re.search(r' d="([^"]+)"', k[3]).group(1)
    milk = ('<path fill="url(#{U}lq)" d="%s"/><path fill="url(#{U}dp)" d="%s"/>' % (d, d))
    surf = '<ellipse cx="51.6" cy="45" rx="51" ry="7" fill="#FFFFFF" stroke="#DCD5C4" stroke-width=".6"/>'
    back = "".join(k[i] for i in (0, 1, 2, 3, 8, 4, 5))
    front = "".join(k[i] for i in (7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 20, 18, 19))
    return back, milk, surf, front, grad("lq", "milk") + depth()

def milkcup_layers():
    """"milk cup.svg" (118x90): opaque teal cup, handle on the LEFT — 0 handle, 1-2 body, 3-4 shine,
    5 rim, 6 inner wall, 7-8 the milk. Opaque: the milk shows in the opening only (mouthFill)."""
    k, defs = svg_children("milk cup.svg")
    assert len(k) == 9, "milk cup art changed shape: %d parts" % len(k)
    hollow = ('<ellipse cx="70" cy="17.6" rx="43.2" ry="10.6" fill="#0A6F77"/>'           # the empty inside
              '<ellipse cx="70" cy="21" rx="36" ry="6.5" fill="#075A61" opacity=".7"/>')   # shadowed bottom
    return "".join(k[0:7]) + hollow, k[7] + k[8], "", "", defs

WB_POLY = [[241,114],[234,180],[200,280],[162,378],[136,480],[133,585],[137,690],[142,796],[147,901],[153,1006],[161,1094],
           [330,1104],[500,1094],[517,1073],[522,968],[527,862],[532,757],[537,652],[541,547],[528,442],[498,341],[460,243],[437,140],[433,114]]

def wglass_layers():
    """"water glass.svg" (156x185): an EMPTY glass tumbler — 0 glass tint, 1-5 base, 6-7 wall shading,
    8-15 shine, 16-21 rim. Water = the glass outline (child 0), drawn over the tint/base, under the walls."""
    k, defs = svg_children("water glass.svg")
    assert len(k) == 22, "water glass art changed shape: %d parts" % len(k)
    d = re.search(r' d="([^"]+)"', k[0]).group(1)
    water = ('<g opacity=".9"><path fill="url(#{U}lq)" d="%s"/><path fill="url(#{U}dp)" d="%s"/></g>' % (d, d))
    surf = '<ellipse cx="77.8" cy="40" rx="76.5" ry="7.5" fill="#CDEEFF" stroke="#7FB9E0" stroke-width=".8"/>'
    return "".join(k[0:6]), water, surf, "".join(k[6:22]), defs + grad("lq", "water") + depth()

def wbottle_layers():
    """"water bottle.svg" (547x1151): an EMPTY glass bottle with a metal screw cap — 0-16 body + base,
    17-45/49-50 shine + base detail, 46-48 the cap (animated off/on). Water = a traced inside outline."""
    k, defs = svg_children("water bottle.svg")
    assert len(k) == 51, "water bottle art changed shape: %d parts" % len(k)
    d = "M" + " L".join("%d,%d" % tuple(p) for p in WB_POLY) + " Z"
    water = ('<g opacity=".9"><path fill="url(#{U}lq)" d="%s"/><path fill="url(#{U}dp)" d="%s"/></g>' % (d, d))
    surf = '<ellipse cx="337" cy="550" rx="203" ry="16" fill="#CDEEFF" stroke="#7FB9E0" stroke-width="2"/>'
    # the bottle's own shading (17-45, 49-50) is a grey wash that hid the water, so it goes UNDER the
    # water; a light shine is drawn on top instead so the water still reads as behind glass
    back = "".join(k[i] for i in list(range(0, 46)) + [49, 50])
    front = ('<path d="M196,300 C170,380 160,480 160,600 L168,1000" stroke="#FFFFFF" stroke-width="22" fill="none" stroke-linecap="round" opacity=".45"/>'
             '<path d="M470,330 C490,420 500,520 498,640" stroke="#FFFFFF" stroke-width="10" fill="none" stroke-linecap="round" opacity=".35"/>')
    cap = "".join(k[i] for i in (46, 47, 48))
    return back, water, surf, front, cap, defs + grad("lq", "water") + depth()

SM_POLY = [[97,62],[690,62],[722,300],[728,600],[722,880],[690,905],[398,915],[150,910],[70,890],[58,600],[62,300]]

def smallmug_layers():
    """"small mug.svg" (1038x1018): a glass beer mug in SOLID light greys, handle on the RIGHT —
    0-42 body + bottom, 43-61 rim, 62-80 handle, 81 a large opaque highlight blob (dropped: it hid
    the oil), 82-120 thin band lines + shine. Oil is drawn over the body, under rim/lines/shine."""
    k, defs = svg_children("small mug.svg")
    assert len(k) == 121, "small mug art changed shape: %d parts" % len(k)
    d = "M" + " L".join("%d,%d" % tuple(p) for p in SM_POLY) + " Z"
    oil = ('<path fill="url(#{U}lq)" d="%s"/><path fill="url(#{U}dp)" d="%s"/>' % (d, d) +
           '<path d="M150,140 C130,400 130,650 150,860" stroke="#FFF3C0" stroke-width="30" fill="none" stroke-linecap="round" opacity=".45"/>')
    surf = '<ellipse cx="398" cy="110" rx="330" ry="30" fill="#FFD95E" stroke="#D9A21A" stroke-width="3"/>'
    back = "".join(k[i] for i in list(range(0, 43)) + list(range(62, 81)))
    shine = k[98].replace("<path ", '<path opacity=".55" ', 1)
    front = shine + "".join(k[i] for i in list(range(82, 98)) + list(range(99, 121)) + list(range(43, 62)))
    return back, oil, surf, front, defs + OIL

def build():
    gb, gm, gs, gf, gd = glass_layers("milk")
    wb, wm, ws, wf, wd = glass_layers("water")
    jb, jm, js_, jf, jd = jug_layers("water")
    ob, om, os_, of, od = jar_layers()      # supplied "jar.svg" (oiljar_art() was the stand-in drawing)
    tb, tm, ts, tf, td = cup_layers()      # supplied "cup.svg" (teacup_art() was the stand-in drawing)
    pb, pm, ps, pf, pd = pot_layers()
    mb, mm, ms, mf, md = milkcup_layers()
    gb2, gm2, gs2, gf2, gd2 = wglass_layers()
    bb2, bm2, bs2, bf2, bc2, bd2 = wbottle_layers()
    sb, sm_, ss, sf, sd = smallmug_layers()
    jb3, jm3, js3, jf3, jd3 = jug_layers("oil")
    s = open(os.path.join(ART, "svg glass.svg"), encoding="utf8").read()
    body = s[s.index(">") + 1:s.index("<defs>")]
    els = [clean(e) for e in re.findall(r"<path[^>]*/>", body)]
    assert len(els) == 28, "bottle art changed shape: %d paths" % len(els)
    defs = clean(s[s.index("<defs>") + 6:s.index("</defs>")])
    cork = "".join(els[i] for i in list(range(0, 8)) + list(range(19, 28)))
    out = """/* [MTG2A04_L03_S01 page 4] supplied art split into animatable layers by _tools/build_art.py.
   glass/glassWater = "glass svg.svg" + a liquid layer; jug = "jug.svg" (mirrored, water); bottle = "svg glass.svg".
   {U} is replaced per instance so gradient ids never collide. Geometry is in the art's own units. */
const CAP_ART = {
  glass: { vb:[103,172], shift:[0,0],
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:"", defs:`%s`,
    surfC:[51.15,24], yTop:12.5, yFill:24, yBot:162, xTop:[1.4,100.9], xBot:[11.2,91.1],
    lipR:[101.9,11.6], lipL:[0.4,11.6], mouth:[51.15,11.6] },
  glassWater: { vb:[103,172], shift:[0,0],
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:"", defs:`%s`,
    surfC:[51.15,24], yTop:12.5, yFill:24, yBot:162, xTop:[1.4,100.9], xBot:[11.2,91.1],
    lipR:[101.9,11.6], lipL:[0.4,11.6], mouth:[51.15,11.6] },
  jug: { vb:[69,84], shift:[0,0],
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:"", defs:`%s`,
    surfC:[41.5,26.2], yTop:3, yFill:9, yBot:82.5, xTop:[17,66], xBot:[20,61],   /* yFill 9: jug full to just below the brim */
    lipR:[67.6,2.2], lipL:[30,4], mouth:[44,4] },
  oiljar: { vb:[90,109], shift:[0,0],   /* "jar.svg" */
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:"", defs:`%s`,
    poly:[[21,4],[68,4],[68,8],[86,26],[86,80],[76,102],[45,106],[13,102],[3,80],[3,26],[21,8]],
    surfC:[44.6,20], yTop:4, yFill:20, yBot:106, xTop:[21,68], xBot:[3,86],
    lipR:[69,3.5], lipL:[20,3.5], mouth:[44.8,3.5] },
  teacup: { vb:[98,82], shift:[0,0],    /* "cup.svg" — opaque: liquid shows in the opening only */
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:"", defs:`%s`,
    poly:[[0.4,4],[74.3,4],[75,21],[74.2,38],[71.4,55],[65.4,71.5],[60.3,78.4],[43.8,81.4],[26.5,81.2],[18,80.2],[11.7,74.8],[4.6,59.2],[1.2,42.4],[0,21]],
    surfC:[37.5,9], yTop:4, yFill:9, yBot:81.5, xTop:[0.4,74.3], xBot:[18,60],   /* see-through: the oil level shows */
    lipR:[72,4], lipL:[2,4], mouth:[37,4] },
  pot: { vb:[104,114], shift:[0,0],     /* "bhaagona.svg" — full = milk up to the neck */
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:"", defs:`%s`,
    poly:[[20.6,0.9],[20.5,8.3],[16.3,14.1],[10.6,18.8],[5.9,24.5],[2.6,31.1],[0.7,38.3],[0,45.6],[0.4,53],[1.6,60.3],[3.5,67.5],[6,74.4],[9,81.2],[12.5,87.8],[16.3,94.1],[20.7,100.1],[25.6,105.6],[31.5,110.1],[38.4,112.5],[45.7,113.6],[53.1,113.9],[60.5,113.3],[67.7,111.7],[74.4,108.5],[79.8,103.5],[84.4,97.7],[88.6,91.6],[92.3,85.2],[95.5,78.5],[98.3,71.7],[100.6,64.6],[102.3,57.4],[103.2,50.1],[103.2,42.7],[102,35.4],[99.5,28.4],[95.7,22.1],[90.5,16.8],[84.7,12.3],[82.7,5.3],[79.8,0.8],[51.6,0]],
    surfC:[51.6,45], yTop:0.5, yFill:15, yBot:113.9, xTop:[20.6,80], xBot:[38,68],
    lipR:[82,1], lipL:[21,1], mouth:[51.6,1] },
  milkcup: { vb:[118,90], shift:[0,0],  /* "milk cup.svg" — opaque, handle left; pours off the right lip */
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:"", defs:`%s`,
    mouthFill:{cx:70, cy:17.7, rx:43.6, ry:10.8},
    surfC:[70,17.7], yTop:15, yFill:15, yBot:88, xTop:[22,118], xBot:[35,108],
    lipR:[117.5,15.6], lipL:[22.5,15.6], mouth:[70,15.6] },
  wglass: { vb:[156,185], shift:[0,0],   /* "water glass.svg" */
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:"", defs:`%s`,
    poly:[[4.8,9.7],[0.3,20.1],[0,35.3],[0.6,65.6],[2.9,95.9],[6.9,126],[12.8,155.7],[18.6,169.7],[30.7,178.3],[45.5,181.8],[75.7,183.8],[106,182.3],[120.9,179.6],[134.4,172.9],[141.7,159.8],[148,130.1],[152.4,100.1],[154.8,69.9],[155.7,39.5],[155.5,24.4],[154.9,9.2],[78,16]],
    surfC:[77.8,40], yTop:10, yFill:30, yBot:183.8, xTop:[1,155], xBot:[46,106],
    lipR:[155,9.2], lipL:[1,9.2], mouth:[78,12] },
  wbottle: { vb:[547,1151], shift:[0,0],  /* "water bottle.svg" — cap animates off/on */
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:`%s`, defs:`%s`,
    poly:[[241,114],[234,180],[200,280],[162,378],[136,480],[133,585],[137,690],[142,796],[147,901],[153,1006],[161,1094],[330,1104],[500,1094],[517,1073],[522,968],[527,862],[532,757],[537,652],[541,547],[528,442],[498,341],[460,243],[437,140],[433,114]],
    surfC:[337,550], yTop:114, yFill:215, yBot:1104, xTop:[241,433], xBot:[161,500],
    lipR:[436,106], lipL:[238,106], mouth:[337,106] },
  smallmug: { vb:[1038,1018], shift:[0,0],   /* "small mug.svg" — handle right: pours off the LEFT lip */
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:"", defs:`%s`,
    poly:[[97,62],[690,62],[722,300],[728,600],[722,880],[690,905],[398,915],[150,910],[70,890],[58,600],[62,300]],
    hull:[[48,30],[745,30],[1013,200],[1013,640],[740,712],[722,880],[690,915],[150,915],[70,890],[58,600],[40,300]],   /* body + handle, for pour clearance */
    surfC:[398,110], yTop:62, yFill:110, yBot:915, xTop:[97,690], xBot:[150,690],
    lipR:[745,30], lipL:[48,30], mouth:[398,30] },
  jugOil: { vb:[69,84], shift:[0,0],          /* "jug.svg" again, filled with oil (page 10) */
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:"", defs:`%s`,
    surfC:[41.5,26.2], yTop:3, yFill:9, yBot:82.5, xTop:[17,66], xBot:[20,61],
    lipR:[67.6,2.2], lipL:[30,4], mouth:[44,4] },
  bottle: { vb:[298,812], shift:[0,0],
    back:`%s`, milk:`%s`, surf:`%s`, front:`%s`, cork:`%s`,
    defs:`%s`,
    poly:[[84,52],[214,52],[219,80],[224,127],[248,169],[277,209],[292,255],[294,300],[294,745],[268,784],[219,791],[149,794],[78,791],[28,784],[6,739],[4,300],[6,249],[23,204],[53,165],[75,121],[80,80]],
    surfC:[149,259], yTop:52, yFill:62, yBot:794, xTop:[84,214], xBot:[4,294],   /* full = up into the neck */
    lipR:[228,46], lipL:[70,46], mouth:[149,46] }
};
""" % (js(gb), js(gm), js(gs), js(gf), js(gd),
       js(wb), js(wm), js(ws), js(wf), js(wd),
       js(jb), js(jm), js(js_), js(jf), js(jd),
       js(ob), js(om), js(os_), js(of), js(od),
       js(tb), js(tm), js(ts), js(tf), js(td),
       js(pb), js(pm), js(ps), js(pf), js(pd),
       js(mb), js(mm), js(ms), js(mf), js(md),
       js(gb2), js(gm2), js(gs2), js(gf2), js(gd2),
       js(bb2), js(bm2), js(bs2), js(bf2), js(bc2), js(bd2),
       js(sb), js(sm_), js(ss), js(sf), js(sd),
       js(jb3), js(jm3), js(js3), js(jf3), js(jd3),
       js(els[8] + els[9]), js(re.sub(r' d="[^"]+"', ' d="M84,52 L214,52 L219,80 L224,127 L248,169 L277,209 L292,255 L294,300 L294,745 L268,784 L219,791 L149,794 L78,791 L28,784 L6,739 L4,300 L6,249 L23,204 L53,165 L75,121 L80,80 Z"', els[11], count=1)), js(els[15]),   # milk = the whole inside, neck included
       js("".join(els[i] for i in (12, 13, 14, 16, 17, 18))), js(cork), js(defs))
    out = out.replace("paint", "{U}p")   # gradient ids + their url(#...) references
    open(os.path.join(ROOT, "_tools", "cap_art.js"), "w", encoding="utf8").write(out)
    return out

if __name__ == "__main__":
    out = build()
    print("cap_art.js", len(out), "chars")
    if "--patch" in sys.argv:
        ap = os.path.join(ROOT, "app.js"); a = open(ap, encoding="utf8").read()
        start = a.index("/* [MTG2A04_L03_S01 page 4] supplied art")
        end = a.index("};\n", a.index("const CAP_ART = {")) + 3
        open(ap, "w", encoding="utf8").write(a[:start] + out + a[end:])
        print("patched app.js")

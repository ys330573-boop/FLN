"""Browser smoke check for the generated sprite integration and preview."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_review_shots" / "animation-v2"
OUT.mkdir(parents=True, exist_ok=True)
results = {}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 1000}, device_scale_factor=1)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto((ROOT / "animation-preview.html").as_uri())
    page.wait_for_function("Array.from(document.images).every(i => i.complete && i.naturalWidth > 0)")
    assert page.locator(".cap-splash").count() == 3
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    for card in page.locator(".card").all():
        assert card.is_visible()
    page.locator("#play").click()
    assert page.locator(".cap-splash").first.evaluate("(e) => getComputedStyle(e).animationPlayState") == "paused"
    page.locator("#frame").fill("2")
    assert page.locator("#frameLabel").inner_text() == "3 / 4"
    page.screenshot(path=str(OUT / "asset-preview.png"), full_page=True)
    page.locator("#play").click()
    page.locator("#speed").select_option("320")
    assert page.locator(".cap-splash").first.evaluate("(e) => getComputedStyle(e).animationDuration") == "0.32s"
    page.emulate_media(reduced_motion="reduce")
    assert page.locator(".cap-splash").first.evaluate("(e) => getComputedStyle(e).animationName") == "none"
    page.emulate_media(reduced_motion="no-preference")
    results["preview"] = "Images, pause, frame inspection, speed, reduced motion passed"
    page.goto((ROOT / "MTG2A04_L03_S01.html").as_uri())
    page.wait_for_function("typeof capPour === 'function'")
    hero = page.locator("#sgHero img")
    assert hero.get_attribute("src") == "assets/Images/animation-v2/jug-four-glasses.png"
    page.wait_for_function("document.querySelector('#sgHero img').naturalWidth > 0")
    page.wait_for_selector("#bootLoader", state="detached")
    page.screenshot(path=str(OUT / "lesson-landing.png"))
    results["landing"] = "Generated artwork loaded in the actual lesson"
    page.locator("#sgBtn").click()
    page.wait_for_function("document.querySelector('#startGate').classList.contains('hidden') && !document.body.classList.contains('gating')", timeout=60000)
    page.evaluate("mountSlide(3)")
    page.wait_for_selector("#slideHost .cap-splash-water", state="visible", timeout=60000)
    page.screenshot(path=str(OUT / "lesson-water-demo.png"))
    results["lessonDemo"] = "Actual narrated water-pouring slide displayed the sprite"
    page.evaluate("mountSlide(0)")
    for liquid in ["water", "milk", "oil"]:
        page.evaluate("""liquid => {
          document.getElementById('animationCheck')?.remove();
          const stage = document.createElement('div');
          stage.id = 'animationCheck';
          Object.assign(stage.style, {position:'fixed',inset:'0',zIndex:'99999',background:'#f4f8fc'});
          document.body.appendChild(stage);
          const label=document.createElement('h1');label.textContent=liquid+' · pouring check';
          Object.assign(label.style,{position:'absolute',left:'70px',top:'30px',font:'32px system-ui',color:'#173753'});
          stage.appendChild(label);
          const src=capAdd(stage,capVessel('pitcher',{w:200,liquid,level:1}),110,390);
          const dst=capAdd(stage,capVessel('glass',{w:150,liquid,level:0}),650,400);
          window.animationCheck={src,dst,done:false};
          const ctx={after:(ms,fn)=>setTimeout(fn,ms)};
          capPour(ctx,src,dst,{liquid,srcTo:.75,dstTo:1,ms:1400,onDone:()=>window.animationCheck.done=true});
        }""", liquid)
        page.wait_for_selector(".cap-stream .cap-splash-" + liquid, state="attached")
        page.wait_for_timeout(500)
        assert page.locator("#animationCheck .cap-sprite").count() == 0
        y = page.locator("#animationCheck .cap-splash").evaluate("(e) => getComputedStyle(e).backgroundPositionY")
        assert y == {"water": "0%", "milk": "50%", "oil": "100%"}[liquid]
        page.screenshot(path=str(OUT / (liquid + "-pour.png")))
        page.wait_for_function("window.animationCheck.done")
        assert page.locator("#animationCheck .cap-stream").count() == 0
        assert page.evaluate("window.animationCheck.dst.level") == 1
        assert page.evaluate("window.animationCheck.src.level") == .75
        results[liquid] = "Correct atlas row, final levels, stream cleanup, completion callback passed"
    assert not errors, errors
    results["pageErrors"] = errors
    browser.close()
(OUT / "checks.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))

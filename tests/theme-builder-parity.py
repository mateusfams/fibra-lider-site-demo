"""Capture the canonical Home and the published Theme Builder Home.

Requires the local server at app/ and Selenium with Edge available.
Outputs full-page screenshots to FIBRA_CAPTURE_DIR or .tmp/parity.
"""

import base64
import os
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


BASE_URL = os.environ.get("FIBRA_TEST_URL", "http://localhost:8080")
CAPTURE_DIR = os.environ.get("FIBRA_CAPTURE_DIR", ".tmp/parity")


def capture_full_page(driver, filename):
    driver.execute_script(
        "document.querySelectorAll('#campaign-modal,#lead-modal,.cookie-banner').forEach(function(el){"
        "el.style.setProperty('display','none','important');});"
        "document.querySelectorAll('.reveal-ready').forEach(function(el){"
        "el.classList.add('is-visible');el.style.opacity='1';el.style.transform='none';});"
        "document.body.classList.remove('modal-open');"
        "document.documentElement.style.scrollBehavior='auto';"
    )
    time.sleep(1.5)
    metrics = driver.execute_cdp_cmd("Page.getLayoutMetrics", {})
    size = metrics.get("cssContentSize") or metrics["contentSize"]
    result = driver.execute_cdp_cmd(
        "Page.captureScreenshot",
        {
            "format": "png",
            "fromSurface": True,
            "captureBeyondViewport": True,
            "clip": {
                "x": 0,
                "y": 0,
                "width": size["width"],
                "height": size["height"],
                "scale": 1,
            },
        },
    )
    path = os.path.join(CAPTURE_DIR, filename)
    with open(path, "wb") as image:
        image.write(base64.b64decode(result["data"]))
    return path, round(size["width"]), round(size["height"])


def section_signature(driver, published):
    selector = "#visual-theme-root .vb-page > *" if published else "body > .site-header, #conteudo > *, body > .site-footer"
    return driver.execute_script(
        "return Array.from(document.querySelectorAll(arguments[0])).map(function(el){"
        "return ['site-header','hero-slider','proof-band','plans-section','benefits-section',"
        "'entertainment-section','business-section','coverage-section','testimonials-section',"
        "'faq-section','support-section','final-cta','site-footer'].find(function(name){return el.classList.contains(name);}) || '';"
        "}).filter(Boolean);",
        selector,
    )


def section_metrics(driver):
    return driver.execute_script(
        "var selectors=['.site-header','.hero-slider','.proof-band','.plans-section','.benefits-section',"
        "'.entertainment-section','.business-section','.coverage-section','.testimonials-section',"
        "'.faq-section','.support-section','.final-cta','.site-footer'];"
        "return Object.fromEntries(selectors.map(function(selector){var items=Array.from(document.querySelectorAll(selector)).filter(function(el){return !el.hidden;});"
        "var el=items[0];return [selector,el ? Math.round(el.getBoundingClientRect().height) : -1];}));"
    )


def style_probe(driver):
    return driver.execute_script(
        "var selectors=['body','.vb-document','.testimonials-section','.testimonials-section > .shell',"
        "'.testimonials-section .section-heading','.testimonials-section h2','.testimonials-grid',"
        "'.testimonial','.testimonial blockquote','.benefits-copy > p','.plans-section > .shell',"
        "'.plans-section .section-heading','.plans-section h2','.filter-tabs','.coupon-activation',"
        "'.plans-grid','.plan-card','.plan-card__top','.plan-price','.plan-note','.plan-card ul',"
        "'.plan-card .plan-cta','.plans-footer'];"
        "return Object.fromEntries(selectors.map(function(selector){var el=Array.from(document.querySelectorAll(selector)).find(function(item){return !item.hidden;});"
        "if(!el)return [selector,null];var s=getComputedStyle(el),r=el.getBoundingClientRect();return [selector,{h:Math.round(r.height),font:s.fontFamily,fontSize:s.fontSize,line:s.lineHeight,margin:s.margin,padding:s.padding}];}));"
    )


def visual_signature(driver):
    return driver.execute_script(
        "var selectors=['.site-header','.site-nav a','.plans-section','.plans-section h2','.plan-card',"
        "'.plan-card li','.button--primary','.support-section','.final-cta','.site-footer'];"
        "return Object.fromEntries(selectors.map(function(selector){var el=Array.from(document.querySelectorAll(selector)).find(function(item){return !item.hidden;});"
        "if(!el)return [selector,null];var s=getComputedStyle(el);return [selector,{color:s.color,background:s.backgroundColor,border:s.borderColor,radius:s.borderRadius,fontSize:s.fontSize,fontWeight:s.fontWeight}];}));"
    )


os.makedirs(CAPTURE_DIR, exist_ok=True)
options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-gpu")
options.add_argument("--window-size=1440,1000")
driver = webdriver.Edge(options=options)
wait = WebDriverWait(driver, 20)

try:
    driver.get(BASE_URL + "/index.html")
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".site-header")))
    canonical_signature = section_signature(driver, False)
    legacy_metrics = section_metrics(driver)
    legacy_probe = style_probe(driver)
    legacy_visual = visual_signature(driver)
    legacy = capture_full_page(driver, "home-index-canonical.png")
    driver.execute_script("localStorage.setItem('fl-site-theme','dark')")
    driver.refresh()
    wait.until(lambda browser: browser.execute_script("return document.documentElement.dataset.theme") == "dark")
    legacy_dark_visual = visual_signature(driver)
    driver.execute_script("localStorage.setItem('fl-site-theme','light')")
    driver.refresh()
    wait.until(lambda browser: browser.execute_script("return document.documentElement.dataset.theme") == "light")
    driver.set_window_size(390, 844)
    driver.get(BASE_URL + "/index.html")
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".site-header")))
    legacy_mobile_metrics = section_metrics(driver)
    legacy_mobile = capture_full_page(driver, "home-index-canonical-mobile.png")

    driver.set_window_size(1440, 1000)
    driver.get(BASE_URL + "/admin.html#builder")
    password = wait.until(EC.presence_of_element_located((By.ID, "login-password")))
    if driver.find_element(By.ID, "admin-login").is_displayed():
        password.send_keys("lider2026")
        driver.find_element(By.CSS_SELECTOR, "#login-form button[type=submit]").click()
    wait.until(EC.presence_of_element_located((By.ID, "visual-theme-builder")))
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".vb-studio [data-vb-action=publish]"))).click()
    time.sleep(1)

    driver.get(BASE_URL + "/index.html")
    wait.until(lambda browser: "visual-theme-active" in browser.find_element(By.TAG_NAME, "body").get_attribute("class"))
    built_signature = section_signature(driver, True)
    if built_signature != canonical_signature:
        raise AssertionError("Published component order differs from canonical Home: %r != %r" % (built_signature, canonical_signature))
    if not driver.execute_script("return document.querySelector('#conteudo').hidden && Array.from(document.querySelectorAll('body > .site-header,body > .site-footer')).every(function(el){return el.hidden;});"):
        raise AssertionError("Legacy shell remained visible after Theme Builder publication")
    built_metrics = section_metrics(driver)
    built_probe = style_probe(driver)
    built_visual = visual_signature(driver)
    built = capture_full_page(driver, "home-theme-builder.png")
    if built[1:] != legacy[1:]:
        raise AssertionError("Desktop dimensions changed after publication: %r != %r; sections %r != %r; probe %r != %r" % (built[1:], legacy[1:], built_metrics, legacy_metrics, built_probe, legacy_probe))
    if built_visual != legacy_visual:
        raise AssertionError("Light theme visual tokens changed after publication: %r != %r" % (built_visual, legacy_visual))
    driver.execute_script("localStorage.setItem('fl-site-theme','dark')")
    driver.refresh()
    wait.until(lambda browser: "visual-theme-active" in browser.find_element(By.TAG_NAME, "body").get_attribute("class") and browser.execute_script("return document.documentElement.dataset.theme") == "dark")
    built_dark_visual = visual_signature(driver)
    if built_dark_visual != legacy_dark_visual:
        raise AssertionError("Dark theme visual tokens changed after publication: %r != %r" % (built_dark_visual, legacy_dark_visual))
    driver.execute_script("localStorage.setItem('fl-site-theme','light')")
    driver.set_window_size(390, 844)
    driver.get(BASE_URL + "/index.html")
    wait.until(lambda browser: "visual-theme-active" in browser.find_element(By.TAG_NAME, "body").get_attribute("class"))
    built_mobile_metrics = section_metrics(driver)
    built_mobile = capture_full_page(driver, "home-theme-builder-mobile.png")
    if abs(built_mobile[2] - legacy_mobile[2]) > 2:
        raise AssertionError("Mobile height changed after publication: %r != %r; sections %r != %r" % (built_mobile, legacy_mobile, built_mobile_metrics, legacy_mobile_metrics))

    # A stale release from the previous generated template must never replace the canonical Home.
    driver.execute_script(
        "var state=FL.getState(),release=FLThemeBuilder.storage.getPublishedWorkspace(state),workspace=FLThemeBuilder.clone(release.workspace);"
        "var home=Object.values(workspace.documents).find(function(doc){return doc.settings.slug==='/';});"
        "home.meta.templateVersion='fibra-home-v2.1';home.nodes.canonical_header.props.serviceText='VERSAO ANTIGA PUBLICADA';"
        "FLThemeBuilder.storage.publishWorkspace(state,workspace);"
    )
    driver.get(BASE_URL + "/index.html")
    wait.until(lambda browser: "visual-theme-active" in browser.find_element(By.TAG_NAME, "body").get_attribute("class"))
    if "VERSAO ANTIGA" in driver.find_element(By.CSS_SELECTOR, "#visual-theme-root .service-strip").text:
        raise AssertionError("Stale published template bypassed the canonical Home fallback")

    # The draft loader must back up and migrate an old generated Home on the next editor load.
    driver.get(BASE_URL + "/admin.html#builder")
    wait.until(EC.presence_of_element_located((By.ID, "visual-theme-builder")))
    driver.execute_script(
        "var state=FL.getState(),env=FLThemeBuilder.storage.loadWorkspace(state),workspace=FLThemeBuilder.clone(env.workspace);"
        "var home=Object.values(workspace.documents).find(function(doc){return doc.settings.slug==='/';});"
        "home.meta.templateVersion='fibra-home-v2.1';home.nodes.canonical_header.props.serviceText='VERSAO ANTIGA EM RASCUNHO';"
        "FLThemeBuilder.storage.saveWorkspace(state,workspace,env.revision);"
    )
    driver.refresh()
    wait.until(EC.presence_of_element_located((By.ID, "visual-theme-builder")))
    migrated = driver.execute_script(
        "var env=FLThemeBuilder.storage.loadWorkspace(FL.getState()),home=Object.values(env.workspace.documents).find(function(doc){return doc.settings.slug==='/';});"
        "return {version:home.meta.templateVersion,backup:env.workspace.meta.migrationBackupKey||'',text:home.nodes.canonical_header.props.serviceText};"
    )
    if migrated["version"] != "fibra-index-canonical-v1" or not migrated["backup"] or "VERSAO ANTIGA" in migrated["text"]:
        raise AssertionError("Legacy draft migration failed: %r" % migrated)

    print("Canonical:", legacy)
    print("Builder:", built)
    print("Canonical mobile:", legacy_mobile)
    print("Builder mobile:", built_mobile)
finally:
    driver.quit()

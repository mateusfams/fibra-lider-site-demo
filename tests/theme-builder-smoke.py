"""Browser smoke test for the static Visual Theme Builder MVP.

Requires a local server rooted at app/ and Selenium with Edge available.
Run: py tests/theme-builder-smoke.py
"""

import os
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


BASE_URL = os.environ.get("FIBRA_TEST_URL", "http://localhost:8080")
CAPTURE_DIR = os.environ.get("FIBRA_CAPTURE_DIR", "")


def check(condition, message):
    if not condition:
        raise AssertionError(message)


options = Options()
options.add_argument("--headless=new")
options.add_argument("--disable-gpu")
options.add_argument("--window-size=1600,1000")
options.set_capability("ms:loggingPrefs", {"browser": "ALL"})

driver = webdriver.Edge(options=options)
wait = WebDriverWait(driver, 20)

try:
    driver.get(BASE_URL + "/admin.html#builder")
    password = wait.until(EC.presence_of_element_located((By.ID, "login-password")))
    wait.until(lambda browser: browser.execute_script("return document.readyState") == "complete")
    if driver.find_element(By.ID, "admin-login").is_displayed():
        password.send_keys("lider2026")
        driver.find_element(By.CSS_SELECTOR, "#login-form button[type=submit]").click()

    wait.until(EC.presence_of_element_located((By.ID, "visual-theme-builder")))
    wait.until(EC.presence_of_element_located((By.ID, "vb-preview-frame")))
    time.sleep(1.5)
    check("/studio.html" in driver.current_url, "Theme Builder did not open in its dedicated route")
    check(not driver.find_elements(By.CSS_SELECTOR, ".admin-sidebar"), "Dashboard chrome leaked into the dedicated editor")
    if CAPTURE_DIR:
        os.makedirs(CAPTURE_DIR, exist_ok=True)
        driver.save_screenshot(os.path.join(CAPTURE_DIR, "theme-builder-desktop.png"))

    check(len(driver.find_elements(By.CSS_SELECTOR, "[data-vb-component]")) >= 30, "Component registry was not rendered")
    check(len(driver.find_elements(By.CSS_SELECTOR, "[data-vb-inspector-tab]")) == 7, "Inspector groups are incomplete")
    check(len(driver.find_elements(By.CSS_SELECTOR, "[data-vb-page-select] option")) >= 2, "Workspace pages were not migrated")

    frame = driver.find_element(By.ID, "vb-preview-frame")
    driver.switch_to.frame(frame)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".vb-document.is-editor")))
    before = len(driver.find_elements(By.CSS_SELECTOR, "[data-vb-node]"))
    check(driver.execute_script("return document.documentElement.clientWidth") >= 1200, "Desktop preview is not using a desktop viewport")
    driver.switch_to.default_content()

    driver.execute_script("document.querySelector('[data-vb-component=\"layout.section\"]').click()")
    time.sleep(0.9)
    driver.switch_to.frame(driver.find_element(By.ID, "vb-preview-frame"))
    after_insert = len(driver.find_elements(By.CSS_SELECTOR, "[data-vb-node]"))
    driver.switch_to.default_content()
    check(after_insert >= before + 2, "Composite section insertion failed")

    driver.execute_script("document.querySelector('[data-vb-action=undo]').click()")
    time.sleep(0.8)
    driver.switch_to.frame(driver.find_element(By.ID, "vb-preview-frame"))
    after_undo = len(driver.find_elements(By.CSS_SELECTOR, "[data-vb-node]"))
    driver.switch_to.default_content()
    check(after_undo == before, "Undo did not restore the document")

    drag_result = driver.execute_script(
        "const component=document.querySelector('[data-vb-component=\"layout.section\"]');"
        "const frame=document.querySelector('#vb-preview-frame');"
        "const bridge=document.querySelector('[data-vb-preview-drop]');"
        "const target=frame.contentDocument.querySelector('[data-vb-node=\"canonical_header\"]')||frame.contentDocument.querySelector('[data-vb-node]');"
        "if(!component||!bridge||!target)return {ok:false,reason:'missing drag fixture'};"
        "const transfer=new DataTransfer();"
        "const dispatch=(element,type,options)=>{const dragEvent=new DragEvent(type,Object.assign({bubbles:true,cancelable:true},options||{}));"
        "Object.defineProperty(dragEvent,'dataTransfer',{value:transfer});return element.dispatchEvent(dragEvent);};"
        "dispatch(component,'dragstart');"
        "const frameRect=frame.getBoundingClientRect(),targetRect=target.getBoundingClientRect();"
        "const scaleX=frameRect.width/frame.contentWindow.innerWidth,scaleY=frameRect.height/frame.contentWindow.innerHeight;"
        "const point={clientX:frameRect.left+(targetRect.left+targetRect.width/2)*scaleX,clientY:frameRect.top+(targetRect.bottom-4)*scaleY};"
        "dispatch(bridge,'dragover',point);const marked=Boolean(frame.contentDocument.querySelector('.is-vb-drop-before,.is-vb-drop-after,.is-vb-drop-inside'));"
        "dispatch(bridge,'drop',point);dispatch(component,'dragend');"
        "return {ok:true,draggable:component.draggable,marked:marked,payload:transfer.getData('text/plain')};"
    )
    check(drag_result["ok"] and drag_result["draggable"] and drag_result["marked"], "Preview did not show a valid drag destination: " + repr(drag_result))
    check(drag_result["payload"] == "fl-component:layout.section", "Drag payload fallback was not registered")
    time.sleep(1.0)
    driver.switch_to.frame(driver.find_element(By.ID, "vb-preview-frame"))
    after_drag = len(driver.find_elements(By.CSS_SELECTOR, "[data-vb-node]"))
    driver.switch_to.default_content()
    check(after_drag >= before + 2, "Dropping a component on the visual preview did not insert it")
    driver.execute_script("document.querySelector('[data-vb-action=undo]').click()")
    time.sleep(0.8)
    driver.switch_to.frame(driver.find_element(By.ID, "vb-preview-frame"))
    after_drag_undo = len(driver.find_elements(By.CSS_SELECTOR, "[data-vb-node]"))
    driver.switch_to.default_content()
    check(after_drag_undo == before, "Undo did not restore a visual drag insertion")

    driver.execute_script("document.querySelector('[data-vb-component=\"marketing.slider\"]').click()")
    time.sleep(0.9)
    driver.switch_to.frame(driver.find_element(By.ID, "vb-preview-frame"))
    inserted_slider = driver.find_elements(By.CSS_SELECTOR, ".vb-slider")[-1]
    check(len(inserted_slider.find_elements(By.CSS_SELECTOR, ".vb-slide")) == 2, "Slider recipe did not create editable slides")
    slider_order = [item.get_attribute("data-vb-node") for item in inserted_slider.find_elements(By.CSS_SELECTOR, ".vb-slide")]
    driver.switch_to.default_content()
    check(len(driver.find_elements(By.CSS_SELECTOR, ".vb-slot-manager article")) == 2, "Slider manager was not rendered")
    driver.find_elements(By.CSS_SELECTOR, "[data-vb-slot-move=down]")[0].click()
    time.sleep(0.5)
    driver.switch_to.frame(driver.find_element(By.ID, "vb-preview-frame"))
    reordered_slider = driver.find_elements(By.CSS_SELECTOR, ".vb-slider")[-1]
    reordered_ids = [item.get_attribute("data-vb-node") for item in reordered_slider.find_elements(By.CSS_SELECTOR, ".vb-slide")]
    driver.switch_to.default_content()
    check(reordered_ids == list(reversed(slider_order)), "Slider manager did not reorder slides")
    driver.execute_script("document.querySelector('[data-vb-action=undo]').click()")
    time.sleep(1.1)
    driver.execute_script("document.querySelector('[data-vb-action=undo]').click()")
    time.sleep(0.5)

    driver.execute_script("document.querySelector('[data-vb-component=\"forms.form\"]').click()")
    time.sleep(0.9)
    driver.switch_to.frame(driver.find_element(By.ID, "vb-preview-frame"))
    inserted_form = driver.find_elements(By.CSS_SELECTOR, ".vb-form")[-1]
    check(len(inserted_form.find_elements(By.CSS_SELECTOR, ".vb-field")) == 2, "Form recipe did not create valid fields")
    driver.switch_to.default_content()
    driver.execute_script("document.querySelector('[data-vb-action=undo]').click()")
    time.sleep(0.5)

    driver.execute_script("document.querySelector('[data-vb-component=\"marketing.banner\"]').click()")
    time.sleep(0.9)
    driver.switch_to.frame(driver.find_element(By.ID, "vb-preview-frame"))
    inserted_banner = driver.find_elements(By.CSS_SELECTOR, ".vb-banner")[-1]
    banner_id = inserted_banner.get_attribute("data-vb-node")
    check(len(inserted_banner.find_elements(By.CSS_SELECTOR, "h1,h2,h3")) == 1, "Banner recipe did not create editable content")
    check(len(inserted_banner.find_elements(By.CSS_SELECTOR, "a,button")) >= 1, "Banner recipe did not create its CTA")
    driver.switch_to.default_content()
    driver.find_element(By.CSS_SELECTOR, '[data-vb-inspector-tab="style"]').click()
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[data-vb-prop-choice="focalPoint"][data-value="left"]'))).click()
    time.sleep(1.1)
    banner_focus = driver.execute_script(
        "var env=FLThemeBuilder.storage.loadWorkspace(FL.getState()),doc=env.workspace.documents[env.workspace.activeDocumentId];"
        "return doc.nodes[arguments[0]].props.focalPoint;",
        banner_id,
    )
    check(banner_focus == "left", "Banner visual framing control failed")
    driver.execute_script("document.querySelector('[data-vb-action=undo]').click();document.querySelector('[data-vb-action=undo]').click()")
    time.sleep(0.6)

    driver.execute_script("document.querySelector('[data-vb-component=\"content.image\"]').click()")
    time.sleep(0.8)
    driver.switch_to.frame(driver.find_element(By.ID, "vb-preview-frame"))
    image_id = driver.find_element(By.CSS_SELECTOR, ".vb-image.is-vb-selected").get_attribute("data-vb-node")
    driver.switch_to.default_content()
    driver.find_element(By.CSS_SELECTOR, '[data-vb-inspector-tab="layout"]').click()
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[data-vb-image-align="center"]'))).click()
    time.sleep(1.1)
    image_style = driver.execute_script(
        "var env=FLThemeBuilder.storage.loadWorkspace(FL.getState()),doc=env.workspace.documents[env.workspace.activeDocumentId];"
        "return doc.nodes[arguments[0]].styles.base.normal;",
        image_id,
    )
    check(image_style.get("marginLeft") == "auto" and image_style.get("marginRight") == "auto", "Image centering did not update the document")
    driver.find_element(By.CSS_SELECTOR, '[data-vb-inspector-tab="style"]').click()
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[data-vb-image-focal="0,0"]'))).click()
    time.sleep(1.1)
    image_props = driver.execute_script(
        "var env=FLThemeBuilder.storage.loadWorkspace(FL.getState()),doc=env.workspace.documents[env.workspace.activeDocumentId];"
        "return doc.nodes[arguments[0]].props;",
        image_id,
    )
    check(image_props.get("focalX") == 0 and image_props.get("focalY") == 0, "Visual focal-point control failed")
    driver.execute_script("document.querySelector('[data-vb-action=undo]').click();document.querySelector('[data-vb-action=undo]').click();document.querySelector('[data-vb-action=undo]').click()")
    time.sleep(0.6)

    driver.execute_script("document.querySelector('[data-vb-component=\"content.heading\"]').click()")
    time.sleep(0.7)
    driver.switch_to.frame(driver.find_element(By.ID, "vb-preview-frame"))
    heading_id = driver.find_element(By.CSS_SELECTOR, ".vb-heading.is-vb-selected").get_attribute("data-vb-node")
    driver.switch_to.default_content()
    driver.find_element(By.CSS_SELECTOR, '[data-vb-inspector-tab="typography"]').click()
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[data-vb-style-choice="textAlign"][data-value="center"]'))).click()
    time.sleep(1.1)
    heading_align = driver.execute_script(
        "var env=FLThemeBuilder.storage.loadWorkspace(FL.getState()),doc=env.workspace.documents[env.workspace.activeDocumentId];"
        "return doc.nodes[arguments[0]].styles.base.normal.textAlign;",
        heading_id,
    )
    check(heading_align == "center", "Text centering control failed")
    driver.execute_script("document.querySelector('[data-vb-action=undo]').click();document.querySelector('[data-vb-action=undo]').click()")
    time.sleep(0.5)

    security = driver.execute_script(
        "return {"
        "url: FLThemeBuilder.safeUrl('javascript:alert(1)', '#'),"
        "css: FLThemeBuilder.cssValue({type:'image'}, 'javascript:alert(1)'),"
        "viewerPublish: FLThemeBuilder.can('viewer', 'document.publish'),"
        "editorEdit: FLThemeBuilder.can('editor', 'document.edit')"
        "}"
    )
    check(security == {"url": "#", "css": "", "viewerPublish": False, "editorEdit": True}, "Security allowlists failed")

    driver.execute_script("document.querySelector('.vb-studio [data-vb-action=validate]').click()")
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".vb-dialog")))
    check("Pronto" in driver.find_element(By.CSS_SELECTOR, ".vb-validation-summary").text, "Workspace validation failed")
    driver.execute_script("document.querySelector('[data-vb-action=close-dialog]').click()")
    driver.execute_script("document.querySelector('.vb-studio [data-vb-action=publish]').click()")
    time.sleep(0.8)
    driver.execute_script("var state=FL.getState(),coupon=state.coupons.find(function(item){return item.code==='LIDER10';});if(coupon){coupon.startsAt='2000-01-01';coupon.expiresAt='2099-12-31';coupon.active=true;}FL.saveRuntimeState(state);")

    driver.get(BASE_URL + "/index.html")
    wait.until(lambda browser: "visual-theme-active" in browser.find_element(By.TAG_NAME, "body").get_attribute("class"))
    check(driver.find_element(By.ID, "visual-theme-root").is_displayed(), "Published renderer is not active")
    check(len(driver.find_elements(By.CSS_SELECTOR, "#visual-theme-root [data-vb-plan-id]")) > 0, "Published plan grid is empty")
    driver.execute_script("document.querySelector('#visual-theme-root [data-canonical-theme-toggle]').click()")
    wait.until(lambda browser: browser.execute_script("return document.documentElement.dataset.theme") == "dark")
    check("is-dark" in driver.find_element(By.CSS_SELECTOR, "#visual-theme-root .vb-document").get_attribute("class"), "Canonical renderer did not activate dark tokens")
    dark_colors = driver.execute_script("var title=document.querySelector('#visual-theme-root .plans-section h2');var section=document.querySelector('#visual-theme-root .plans-section');return {text:getComputedStyle(title).color,background:getComputedStyle(section).backgroundColor};")
    check(dark_colors["text"] != "rgb(10, 22, 40)" and dark_colors["background"] == "rgb(7, 17, 30)", "Dark mode kept light-theme colors: " + repr(dark_colors))
    driver.execute_script("document.querySelector('#visual-theme-root [data-canonical-theme-toggle]').click()")
    wait.until(lambda browser: browser.execute_script("return document.documentElement.dataset.theme") == "light")
    coupon = driver.find_element(By.CSS_SELECTOR, "#visual-theme-root [data-canonical-coupon] input[name=coupon]")
    coupon.send_keys("LIDER10")
    coupon.submit()
    wait.until(lambda browser: not browser.find_element(By.CSS_SELECTOR, '#visual-theme-root [data-plan-id-value="internet-600"] .plan-promotion').get_attribute("hidden"))
    check("89" in driver.find_element(By.CSS_SELECTOR, '#visual-theme-root [data-plan-id-value="internet-600"] .plan-price').text, "Coupon did not update the eligible plan price")
    driver.execute_script("document.querySelector('#visual-theme-root [data-canonical-coupon-clear]').click()")
    if CAPTURE_DIR:
        driver.save_screenshot(os.path.join(CAPTURE_DIR, "theme-home-desktop.png"))
    driver.execute_script("document.querySelector('#visual-theme-root [data-vb-plan-id]').click()")
    time.sleep(0.3)
    check(not driver.find_element(By.ID, "lead-modal").get_attribute("hidden"), "Plan did not open lead capture")
    driver.execute_script("document.querySelector('#lead-modal .modal-close').click()")
    campaign_modal = driver.find_element(By.ID, "campaign-modal")
    if campaign_modal.is_displayed():
        driver.execute_script("document.querySelector('#campaign-modal .modal-close').click()")

    driver.execute_script("document.querySelector('#visual-theme-root .coverage-section').scrollIntoView({block:'center'})")
    wait.until(lambda browser: len(browser.find_elements(By.CSS_SELECTOR, "#visual-theme-root .coverage-section .leaflet-overlay-pane path")) > 0)
    wait.until(lambda browser: len(browser.find_elements(By.CSS_SELECTOR, "#visual-theme-root .coverage-section .coverage-place-marker")) > 0)
    coverage = driver.find_element(By.CSS_SELECTOR, "#visual-theme-root .coverage-section")
    check("OLT" not in coverage.text.upper(), "Technical KMZ names leaked into the public coverage section")
    if CAPTURE_DIR:
        driver.execute_script("document.querySelector('#campaign-modal').style.setProperty('display','none','important'); const cookie=document.querySelector('.cookie-banner'); if(cookie) cookie.style.display='none'; document.body.classList.remove('modal-open')")
        coverage.screenshot(os.path.join(CAPTURE_DIR, "theme-home-coverage.png"))

    driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride", {"width": 390, "height": 844, "deviceScaleFactor": 1, "mobile": True})
    driver.get(BASE_URL + "/index.html")
    wait.until(lambda browser: "visual-theme-active" in browser.find_element(By.TAG_NAME, "body").get_attribute("class"))
    mobile_widths = driver.execute_script("return {client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth}")
    check(mobile_widths["scroll"] <= mobile_widths["client"] + 1, "Published Home has horizontal overflow on mobile")
    driver.execute_script("document.querySelector('#visual-theme-root [data-canonical-menu]').click()")
    check("menu-open" in driver.find_element(By.TAG_NAME, "body").get_attribute("class"), "Mobile menu did not open")
    if CAPTURE_DIR:
        driver.save_screenshot(os.path.join(CAPTURE_DIR, "theme-home-mobile.png"))

    driver.get(BASE_URL + "/pagina.html?slug=contrato-de-adesao")
    wait.until(lambda browser: "visual-theme-active" in browser.find_element(By.TAG_NAME, "body").get_attribute("class"))
    check(driver.find_element(By.ID, "visual-theme-root").is_displayed(), "Published internal page is not active")
    check("Contrato de prestacao" in driver.find_element(By.ID, "visual-theme-root").text, "Internal page route rendered the wrong document")

    driver.get(BASE_URL + "/admin.html#builder")
    wait.until(lambda browser: "/studio.html" in browser.current_url)
    wait.until(EC.presence_of_element_located((By.ID, "visual-theme-builder")))
    wait.until(lambda browser: browser.execute_script("const item=document.querySelector('[data-vb-mobile-workspace]');return item&&getComputedStyle(item).display!=='none'"))
    mobile_nav = driver.find_element(By.CSS_SELECTOR, "[data-vb-mobile-workspace]")
    mobile_viewport = driver.execute_script(
        "return {display:getComputedStyle(arguments[0]).display,innerWidth:innerWidth,outerWidth:outerWidth,"
        "clientWidth:document.documentElement.clientWidth,matches:matchMedia('(max-width:1020px)').matches,url:location.href}",
        mobile_nav,
    )
    check(mobile_viewport["display"] != "none", "Mobile workspace navigation is hidden: " + repr(mobile_viewport))
    driver.find_element(By.CSS_SELECTOR, '.vb-mobile-workspace [data-vb-mobile-panel="components"]').click()
    check(driver.find_element(By.CSS_SELECTOR, ".vb-studio__left").is_displayed(), "Mobile component panel did not open")
    driver.find_element(By.CSS_SELECTOR, '.vb-mobile-workspace [data-vb-mobile-panel="inspector"]').click()
    check(driver.find_element(By.CSS_SELECTOR, ".vb-studio__inspector").is_displayed(), "Mobile inspector did not open")
    driver.find_element(By.CSS_SELECTOR, '.vb-mobile-workspace [data-vb-mobile-panel="canvas"]').click()
    check(driver.find_element(By.CSS_SELECTOR, ".vb-studio__canvas").is_displayed(), "Mobile canvas did not open")
    admin_widths = driver.execute_script("return {client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth}")
    check(admin_widths["scroll"] <= admin_widths["client"] + 1, "Theme Builder has horizontal overflow on mobile")
    if CAPTURE_DIR:
        driver.save_screenshot(os.path.join(CAPTURE_DIR, "theme-builder-mobile.png"))

    driver.execute_cdp_cmd("Emulation.clearDeviceMetricsOverride", {})
    driver.set_window_size(1600, 1000)
    driver.get(BASE_URL + "/admin.html#coverage")
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-panel=coverage]"))).click()
    wait.until(EC.presence_of_element_located((By.ID, "admin-regional-map")))
    wait.until(lambda browser: len(browser.find_elements(By.CSS_SELECTOR, "#admin-regional-map .coverage-place-marker")) > 0)
    check("OLT" not in driver.find_element(By.ID, "admin-regional-map").text.upper(), "Technical KMZ names leaked into the admin map")
    if CAPTURE_DIR:
        driver.save_screenshot(os.path.join(CAPTURE_DIR, "admin-coverage-desktop.png"))

    errors = [entry for entry in driver.get_log("browser") if entry["level"] == "SEVERE"]
    check(not errors, "Browser console contains errors: " + repr(errors[:5]))
    print("Theme Builder smoke test: PASS")
finally:
    driver.quit()

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
    if driver.find_element(By.ID, "admin-login").is_displayed():
        password.send_keys("lider2026")
        driver.find_element(By.CSS_SELECTOR, "#login-form button[type=submit]").click()

    wait.until(EC.presence_of_element_located((By.ID, "visual-theme-builder")))
    wait.until(EC.presence_of_element_located((By.ID, "vb-preview-frame")))
    time.sleep(1.5)
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
    time.sleep(0.4)
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
    check(len(inserted_banner.find_elements(By.CSS_SELECTOR, "h1,h2,h3")) == 1, "Banner recipe did not create editable content")
    check(len(inserted_banner.find_elements(By.CSS_SELECTOR, "a,button")) >= 1, "Banner recipe did not create its CTA")
    driver.switch_to.default_content()
    driver.execute_script("document.querySelector('[data-vb-action=undo]').click()")
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

    driver.get(BASE_URL + "/index.html")
    wait.until(lambda browser: "visual-theme-active" in browser.find_element(By.TAG_NAME, "body").get_attribute("class"))
    check(driver.find_element(By.ID, "visual-theme-root").is_displayed(), "Published renderer is not active")
    check(len(driver.find_elements(By.CSS_SELECTOR, "#visual-theme-root [data-vb-plan-id]")) > 0, "Published plan grid is empty")
    if CAPTURE_DIR:
        driver.save_screenshot(os.path.join(CAPTURE_DIR, "theme-home-desktop.png"))
    driver.execute_script("document.querySelector('#visual-theme-root [data-vb-plan-id]').click()")
    time.sleep(0.3)
    check(not driver.find_element(By.ID, "lead-modal").get_attribute("hidden"), "Plan did not open lead capture")
    driver.execute_script("document.querySelector('#lead-modal .modal-close').click()")
    campaign_modal = driver.find_element(By.ID, "campaign-modal")
    if campaign_modal.is_displayed():
        driver.execute_script("document.querySelector('#campaign-modal .modal-close').click()")

    driver.execute_script("document.querySelector('.vb-coverage').scrollIntoView({block:'center'})")
    wait.until(lambda browser: len(browser.find_elements(By.CSS_SELECTOR, ".vb-coverage .leaflet-overlay-pane path")) > 0)
    wait.until(lambda browser: len(browser.find_elements(By.CSS_SELECTOR, ".vb-coverage .coverage-place-marker")) > 0)
    coverage = driver.find_element(By.CSS_SELECTOR, ".vb-coverage")
    check("OLT" not in coverage.text.upper(), "Technical KMZ names leaked into the public coverage section")
    if CAPTURE_DIR:
        driver.execute_script("document.querySelector('#campaign-modal').style.setProperty('display','none','important'); const cookie=document.querySelector('.cookie-banner'); if(cookie) cookie.style.display='none'; document.body.classList.remove('modal-open')")
        coverage.screenshot(os.path.join(CAPTURE_DIR, "theme-home-coverage.png"))

    driver.set_window_size(390, 844)
    driver.get(BASE_URL + "/index.html")
    wait.until(lambda browser: "visual-theme-active" in browser.find_element(By.TAG_NAME, "body").get_attribute("class"))
    mobile_widths = driver.execute_script("return {client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth}")
    check(mobile_widths["scroll"] <= mobile_widths["client"] + 1, "Published Home has horizontal overflow on mobile")
    if CAPTURE_DIR:
        driver.save_screenshot(os.path.join(CAPTURE_DIR, "theme-home-mobile.png"))

    driver.get(BASE_URL + "/pagina.html?slug=contrato-de-adesao")
    wait.until(lambda browser: "visual-theme-active" in browser.find_element(By.TAG_NAME, "body").get_attribute("class"))
    check(driver.find_element(By.ID, "visual-theme-root").is_displayed(), "Published internal page is not active")
    check("Contrato de prestacao" in driver.find_element(By.ID, "visual-theme-root").text, "Internal page route rendered the wrong document")

    driver.get(BASE_URL + "/admin.html#builder")
    wait.until(EC.presence_of_element_located((By.ID, "visual-theme-builder")))
    admin_widths = driver.execute_script("return {client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth}")
    check(admin_widths["scroll"] <= admin_widths["client"] + 1, "Theme Builder has horizontal overflow on mobile")
    if CAPTURE_DIR:
        driver.save_screenshot(os.path.join(CAPTURE_DIR, "theme-builder-mobile.png"))

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

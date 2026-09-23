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
    check(after_insert == before + 1, "Component insertion failed")

    driver.execute_script("document.querySelector('[data-vb-action=undo]').click()")
    time.sleep(0.8)
    driver.switch_to.frame(driver.find_element(By.ID, "vb-preview-frame"))
    after_undo = len(driver.find_elements(By.CSS_SELECTOR, "[data-vb-node]"))
    driver.switch_to.default_content()
    check(after_undo == before, "Undo did not restore the document")

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
    driver.execute_script("document.querySelector('#visual-theme-root [data-vb-plan-id]').click()")
    time.sleep(0.3)
    check(not driver.find_element(By.ID, "lead-modal").get_attribute("hidden"), "Plan did not open lead capture")

    driver.get(BASE_URL + "/pagina.html?slug=contrato-de-adesao")
    wait.until(lambda browser: "visual-theme-active" in browser.find_element(By.TAG_NAME, "body").get_attribute("class"))
    check(driver.find_element(By.ID, "visual-theme-root").is_displayed(), "Published internal page is not active")
    check("Contrato de prestacao" in driver.find_element(By.ID, "visual-theme-root").text, "Internal page route rendered the wrong document")

    errors = [entry for entry in driver.get_log("browser") if entry["level"] == "SEVERE"]
    check(not errors, "Browser console contains errors: " + repr(errors[:5]))
    print("Theme Builder smoke test: PASS")
finally:
    driver.quit()

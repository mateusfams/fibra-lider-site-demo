(function () {
  "use strict";

  const $ = function (selector, root) { return (root || document).querySelector(selector); };
  let state = null;
  let toastTimer = null;

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
  }

  function toast(message, kind) {
    const element = $("#theme-studio-toast");
    clearTimeout(toastTimer);
    element.className = "admin-toast theme-studio-toast " + (kind === "error" ? "is-error" : "is-success");
    element.textContent = message;
    element.hidden = false;
    toastTimer = window.setTimeout(function () { element.hidden = true; }, 3200);
  }

  function applyTheme() {
    const theme = localStorage.getItem("fl-admin-theme") || "dark";
    document.documentElement.dataset.adminTheme = theme;
    const button = $("#theme-studio-theme");
    if (button) button.innerHTML = '<i data-lucide="' + (theme === "dark" ? "sun" : "moon") + '"></i>';
    refreshIcons();
  }

  function hydrateChrome() {
    $("#theme-studio-tenant").textContent = state.brand.name;
    const icon = $("#theme-studio-brand-icon");
    icon.src = FL.safeImageUrl(state.brand.icon || state.brand.logo, "./assets/img/fibra-lider-icon.png");
    icon.alt = state.brand.name;
    document.title = "Editor de tema | " + state.brand.name;
  }

  function mountEditor() {
    const host = $("#theme-studio-root");
    host.innerHTML = window.FLVisualBuilderEditor.render(state);
    const editor = $("#visual-theme-builder", host);
    window.FLVisualBuilderEditor.mount(editor, {
      role: "administrator",
      toast: toast,
      refreshIcons: refreshIcons,
      onStateChange: function (nextState, message) {
        state = FL.saveState(nextState, false);
        hydrateChrome();
        if (message) toast(message, "success");
      },
      onPublish: function () {
        if (FL.recordAudit) FL.recordAudit(state, "publish", "theme", "Tema visual publicado", "Workspace validado e disponibilizado no site publico");
        state = FL.saveState(state, true);
      },
    });
  }

  async function init() {
    if (!window.FL || sessionStorage.getItem(FL.SESSION_KEY) !== "active") {
      location.replace("./admin.html?return=studio");
      return;
    }
    try {
      applyTheme();
      state = FL.getState();
      state = await FL.loadBundledCoverage(state);
      hydrateChrome();
      mountEditor();
      $("#theme-studio-shell").hidden = false;
      $("#theme-studio-loading").hidden = true;
      $("#theme-studio-theme").addEventListener("click", function () {
        const next = document.documentElement.dataset.adminTheme === "dark" ? "light" : "dark";
        localStorage.setItem("fl-admin-theme", next);
        applyTheme();
      });
      refreshIcons();
    } catch (error) {
      $("#theme-studio-loading").innerHTML = '<i data-lucide="triangle-alert"></i><strong>Nao foi possivel abrir o editor.</strong><a href="./admin.html">Voltar ao painel</a>';
      console.error(error);
      refreshIcons();
    }
  }

  window.addEventListener("beforeunload", function () {
    if (window.FLVisualBuilderEditor) window.FLVisualBuilderEditor.unmount();
  });
  document.addEventListener("DOMContentLoaded", init);
})();

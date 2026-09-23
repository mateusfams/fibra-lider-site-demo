(function () {
  "use strict";

  function currentRoute() {
    if (/pagina\.html$/i.test(location.pathname)) {
      const slug = new URLSearchParams(location.search).get("slug");
      return slug ? "/" + String(slug).replace(/^\/+|\/+$/g, "") : "/";
    }
    if (/\/index\.html$/i.test(location.pathname) || /\/$/.test(location.pathname)) return "/";
    return location.pathname || "/";
  }

  function activate() {
    if (!window.FL || !window.FLThemeBuilder || !window.FLThemeBuilder.ThemeRenderer) return;
    const state = window.FL.getState();
    const release = window.FLThemeBuilder.storage.getPublishedWorkspace(state);
    if (!release || !release.workspace) return;
    const route = currentRoute();
    const documents = Object.values(release.workspace.documents || {});
    const documentValue = documents.find(function (entry) { return entry.settings && entry.settings.slug === route; }) || (route === "/" ? release.workspace.documents[release.workspace.activeDocumentId] : null);
    if (!documentValue || !window.FLThemeBuilder.validateDocument(documentValue).valid) return;

    const root = document.getElementById("visual-theme-root");
    if (!root) return;
    const renderer = new window.FLThemeBuilder.ThemeRenderer({
      root: root,
      document: documentValue,
      data: state,
      mode: "public",
      callbacks: {
        formSubmit: function (_, action, values) {
          if (action === "whatsapp") {
            const message = "Ola, sou " + String(values.name || "visitante") + " e gostaria de receber atendimento.";
            window.open(window.FL.whatsappLink(state.brand.whatsapp, message), "_blank", "noopener");
          }
        },
      },
    });
    const result = renderer.render();
    if (!result.validation.valid) return;
    document.body.classList.add("visual-theme-active");
    root.hidden = false;
    [document.querySelector(".site-header"), document.getElementById("conteudo"), document.getElementById("page-content"), document.querySelector(".site-footer")].forEach(function (element) { if (element) element.hidden = true; });
    const skip = document.querySelector(".skip-link");
    if (skip) skip.href = "#visual-theme-root";

    root.addEventListener("click", function (event) {
      const planButton = event.target.closest("[data-vb-plan-id]");
      if (!planButton) return;
      const legacy = document.querySelector('#conteudo [data-plan-id="' + String(planButton.dataset.vbPlanId).replace(/[^a-zA-Z0-9_-]/g, "") + '"]');
      if (legacy) legacy.click();
      else window.open(window.FL.whatsappLink(state.brand.whatsapp, "Ola, tenho interesse em um plano da " + state.brand.name + "."), "_blank", "noopener");
    });
  }

  window.addEventListener("DOMContentLoaded", activate);
})();

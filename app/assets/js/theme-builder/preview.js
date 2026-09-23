(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const token = params.get("session") || "standalone";
  const requestedMode = params.get("mode") === "public" ? "public" : params.get("mode") === "preview" ? "preview" : "editor";
  let renderer = null;
  let state = null;
  let currentDocument = null;

  function post(type, payload) {
    if (window.parent === window) return;
    window.parent.postMessage(window.FLThemeBuilder.createMessage(type, token, payload), location.origin);
  }

  function render(documentValue, selectedId, device) {
    const TB = window.FLThemeBuilder;
    currentDocument = documentValue;
    document.body.dataset.previewDevice = device || "desktop";
    document.body.classList.remove("is-preview-loading");
    if (renderer) renderer.destroy();
    renderer = new TB.ThemeRenderer({
      root: document.getElementById("visual-builder-root"),
      document: documentValue,
      data: state,
      mode: requestedMode,
      selectedId: selectedId || "",
      callbacks: {
        select: function (id) { post("select", { id: id }); },
        inlineChange: function (id, property, value) { post("inline-change", { id: id, property: property, value: value }); },
        move: function (id, placement) { post("move", { id: id, placement: placement }); },
        insert: function (type, placement) { post("insert", { type: type, placement: placement }); },
        formSubmit: function (id, action, values) { post("form-submit", { id: id, action: action, values: values }); },
      },
    });
    const result = renderer.render();
    post("ready", { valid: result.validation.valid, nodes: result.validation.nodeCount || 0 });
  }

  function format(command, value) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    try { document.execCommand(command, false, value || null); }
    catch (error) { post("error", { message: "Nao foi possivel aplicar esta formatacao." }); }
  }

  window.addEventListener("message", function (event) {
    const TB = window.FLThemeBuilder;
    if (event.origin !== location.origin || !TB.validMessage(event, token)) return;
    const message = event.data;
    if (message.type === "render" && message.payload.document) render(message.payload.document, message.payload.selectedId, message.payload.device);
    if (message.type === "format") format(message.payload.command, message.payload.value);
    if (message.type === "scroll-to") {
      const target = document.querySelector('[data-vb-node="' + String(message.payload.id || "").replace(/[^a-zA-Z0-9_-]/g, "") + '"]');
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  window.addEventListener("DOMContentLoaded", function () {
    try {
      state = window.FL.getState();
      const TB = window.FLThemeBuilder;
      const published = params.get("release") === "published" ? TB.storage.getPublishedWorkspace(state) : null;
      const envelope = published || TB.storage.loadWorkspace(state);
      const workspace = envelope.workspace;
      const route = params.get("route") || "/";
      const documentValue = Object.values(workspace.documents).find(function (entry) { return entry.settings && entry.settings.slug === route; }) || workspace.documents[workspace.activeDocumentId];
      render(documentValue, params.get("selected") || "", params.get("device") || "desktop");
    } catch (error) {
      document.body.classList.remove("is-preview-loading");
      document.getElementById("visual-builder-root").innerHTML = '<div class="preview-error"><strong>O preview nao pode ser carregado.</strong><p>' + window.FLThemeBuilder.escapeHtml(error.message) + "</p></div>";
      post("error", { message: error.message });
    }
  });
})();

(function () {
  "use strict";

  const TB = window.FLThemeBuilder;
  if (!TB) throw new Error("Theme Builder Core precisa ser carregado antes do renderer.");

  const MESSAGE_VERSION = 1;
  const BINDING_ROOTS = new Set([
    "brand", "theme", "navigation", "plans", "categories", "benefits", "apps",
    "testimonials", "faq", "footer", "regions", "products", "coverage", "content",
  ]);

  function safeBindingPath(value) {
    const path = String(value || "").trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_.]{0,159}$/.test(path)) return "";
    return BINDING_ROOTS.has(path.split(".")[0]) ? path : "";
  }

  function resolveBinding(binding, data) {
    const path = safeBindingPath(typeof binding === "string" ? binding : binding && binding.source);
    if (!path) return undefined;
    const value = TB.getAt(data, path);
    if (value == null && binding && Object.prototype.hasOwnProperty.call(binding, "fallback")) return binding.fallback;
    return value;
  }

  function resolveProps(node, data) {
    const props = TB.clone(node.props || {});
    Object.keys(node.bindings || {}).forEach(function (property) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]{0,79}$/.test(property)) return;
      const value = resolveBinding(node.bindings[property], data);
      if (["string", "number", "boolean"].includes(typeof value)) props[property] = value;
    });
    return props;
  }

  function closestNode(target) {
    return target && target.closest ? target.closest("[data-vb-node]") : null;
  }

  function parentPlacement(documentValue, nodeId) {
    const parent = TB.parentOf(documentValue, nodeId);
    if (!parent) return null;
    const list = parent.node.slots[parent.slot] || [];
    return { parentId: parent.node.id, slot: parent.slot, index: list.indexOf(nodeId) };
  }

  function dropPlacement(documentValue, targetId, position) {
    const target = documentValue.nodes[targetId];
    if (!target) return null;
    if (position === "inside") {
      const definition = TB.registry.get(target.type);
      const slot = definition && Object.keys(definition.slots || {})[0];
      if (slot) return { parentId: target.id, slot: slot, index: (target.slots[slot] || []).length };
    }
    const parent = parentPlacement(documentValue, targetId);
    if (!parent) return null;
    return { parentId: parent.parentId, slot: parent.slot, index: parent.index + (position === "after" ? 1 : 0) };
  }

  class ThemeRenderer {
    constructor(options) {
      const settings = options || {};
      this.root = settings.root;
      this.document = settings.document;
      this.data = settings.data || {};
      this.mode = settings.mode || "public";
      this.selectedId = settings.selectedId || "";
      this.callbacks = settings.callbacks || {};
      this.cleanups = [];
      this.styleElement = null;
      this.dragMarker = null;
    }

    destroy() {
      this.cleanups.splice(0).forEach(function (cleanup) {
        try { cleanup(); } catch (error) { /* individual integrations must not block cleanup */ }
      });
      if (this.styleElement) this.styleElement.remove();
      if (this.root) this.root.replaceChildren();
    }

    update(documentValue, selectedId) {
      this.document = documentValue;
      this.selectedId = selectedId || "";
      return this.render();
    }

    render() {
      if (!this.root) throw new Error("Elemento raiz do renderer nao informado.");
      this.cleanups.splice(0).forEach(function (cleanup) { try { cleanup(); } catch (error) {} });
      this.root.replaceChildren();
      const validation = TB.validateDocument(this.document);
      if (!validation.valid) {
        const problem = document.createElement("div");
        problem.className = "vb-render-error";
        problem.setAttribute("role", "alert");
        problem.innerHTML = "<strong>Esta versao nao pode ser renderizada.</strong><span>" + TB.escapeHtml(validation.errors[0] && validation.errors[0].message || "Documento invalido.") + "</span>";
        this.root.appendChild(problem);
        return { validation: validation };
      }

      this.installStyles();
      const shell = document.createElement("div");
      shell.className = "vb-document" + (this.mode === "editor" ? " is-editor" : "");
      shell.dataset.vbSchema = String(this.document.schemaVersion);
      shell.dataset.vbDevice = this.document.meta && this.document.meta.previewDevice || "desktop";
      if (this.mode === "public" && localStorage.getItem("fl-vb-site-theme") === "dark") shell.classList.add("is-dark");
      const rootNode = this.renderNode(this.document.rootId, 0);
      if (rootNode) shell.appendChild(rootNode);
      this.root.appendChild(shell);
      if (shell.classList.contains("is-dark")) { const themeIcon = shell.querySelector("[data-vb-theme-toggle] [data-lucide]"); if (themeIcon) themeIcon.setAttribute("data-lucide", "sun"); }
      if (this.mode === "editor") this.bindEditorEvents(shell);
      this.refreshIcons();
      return { validation: validation, element: shell };
    }

    installStyles() {
      if (this.styleElement) this.styleElement.remove();
      this.styleElement = document.createElement("style");
      this.styleElement.dataset.vbCompiledStyles = this.document.id;
      this.styleElement.textContent = TB.compileStyles(this.document);
      (document.head || this.root).appendChild(this.styleElement);
    }

    renderNode(nodeId, depth) {
      if (depth > TB.MAX_DEPTH) return null;
      const node = this.document.nodes[nodeId];
      if (!node) return null;
      const definition = TB.registry.get(node.type);
      if (!definition) return null;
      const context = {
        node: node,
        props: resolveProps(node, this.data),
        data: this.data,
        document: this.document,
        mode: this.mode,
      };
      let output;
      try { output = definition.render(context); }
      catch (error) {
        const failed = document.createElement("div");
        failed.className = "vb-component-error";
        failed.textContent = "Falha ao renderizar " + definition.label + ".";
        output = { element: failed, slots: {} };
      }
      if (!output || !(output.element instanceof Element)) return null;
      const element = output.element;
      element.dataset.vbNode = node.id;
      element.dataset.vbType = node.type;
      element.dataset.vbLabel = node.name || definition.label;
      if (node.props && node.props.anchor && /^[a-zA-Z][\w:-]{0,79}$/.test(node.props.anchor)) element.id = node.props.anchor;
      if (node.props && node.props.ariaLabel) element.setAttribute("aria-label", TB.plainText(node.props.ariaLabel, 160));
      if (this.selectedId === node.id) element.classList.add("is-vb-selected");
      if (this.mode === "editor") this.prepareEditableElement(element, node, definition);

      Object.keys(node.slots || {}).forEach((slotName) => {
        const target = output.slots && output.slots[slotName];
        if (!target) return;
        target.dataset.vbSlot = slotName;
        target.dataset.vbSlotOwner = node.id;
        (node.slots[slotName] || []).forEach((childId) => {
          const child = this.renderNode(childId, depth + 1);
          if (child) target.appendChild(child);
        });
        if (this.mode === "editor" && this.selectedId === node.id && !(node.slots[slotName] || []).length) {
          const empty = document.createElement("div");
          empty.className = "vb-empty-slot";
          empty.dataset.vbEmptySlot = slotName;
          empty.textContent = "Solte um componente aqui";
          target.appendChild(empty);
        }
      });

      if (output.mount) this.mountIntegration(output.mount, element, context);
      return element;
    }

    prepareEditableElement(element, node, definition) {
      element.classList.add("vb-editor-node");
      if (node.id !== this.document.rootId && !(node.meta && node.meta.locked)) element.draggable = true;
      if (!definition.inlineProperty) return;
      const target = definition.inlineSelector ? element.querySelector(definition.inlineSelector) : element;
      if (!target) return;
      target.dataset.vbInline = definition.inlineProperty;
      target.setAttribute("contenteditable", "true");
      target.setAttribute("spellcheck", "true");
      target.addEventListener("keydown", function (event) { event.stopPropagation(); });
      target.addEventListener("blur", () => {
        const value = definition.inlineProperty === "html" ? target.innerHTML : target.textContent;
        if (this.callbacks.inlineChange) this.callbacks.inlineChange(node.id, definition.inlineProperty, value);
      });
    }

    bindEditorEvents(shell) {
      const clearDrop = function () {
        shell.querySelectorAll(".is-vb-drop-before,.is-vb-drop-after,.is-vb-drop-inside").forEach(function (element) {
          element.classList.remove("is-vb-drop-before", "is-vb-drop-after", "is-vb-drop-inside");
        });
      };

      const click = (event) => {
        const nodeElement = closestNode(event.target);
        if (!nodeElement) return;
        if (event.target.closest("a,button,summary") && !event.target.hasAttribute("contenteditable")) event.preventDefault();
        event.stopPropagation();
        if (this.callbacks.select) this.callbacks.select(nodeElement.dataset.vbNode);
      };
      shell.addEventListener("click", click);

      const dragstart = function (event) {
        const nodeElement = closestNode(event.target);
        if (!nodeElement || !nodeElement.draggable) return;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-fl-vb-node", nodeElement.dataset.vbNode);
        event.dataTransfer.setData("text/plain", nodeElement.dataset.vbNode);
        nodeElement.classList.add("is-vb-dragging");
      };
      const dragend = function () { clearDrop(); shell.querySelectorAll(".is-vb-dragging").forEach(function (element) { element.classList.remove("is-vb-dragging"); }); };
      const dragover = function (event) {
        const target = closestNode(event.target);
        if (!target) return;
        event.preventDefault();
        clearDrop();
        const rectangle = target.getBoundingClientRect();
        const ratio = rectangle.height ? (event.clientY - rectangle.top) / rectangle.height : 0.5;
        const position = ratio < 0.22 ? "before" : ratio > 0.78 ? "after" : "inside";
        target.classList.add("is-vb-drop-" + position);
        target.dataset.vbDropPosition = position;
      };
      const drop = (event) => {
        const target = closestNode(event.target);
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        const position = target.dataset.vbDropPosition || "inside";
        const placement = dropPlacement(this.document, target.dataset.vbNode, position);
        const nodeId = event.dataTransfer.getData("application/x-fl-vb-node");
        const componentType = event.dataTransfer.getData("application/x-fl-vb-component");
        clearDrop();
        if (!placement) return;
        if (nodeId && nodeId !== target.dataset.vbNode && this.callbacks.move) this.callbacks.move(nodeId, placement);
        else if (componentType && this.callbacks.insert) this.callbacks.insert(componentType, placement);
      };
      shell.addEventListener("dragstart", dragstart);
      shell.addEventListener("dragend", dragend);
      shell.addEventListener("dragover", dragover);
      shell.addEventListener("drop", drop);
      this.cleanups.push(function () {
        shell.removeEventListener("click", click);
        shell.removeEventListener("dragstart", dragstart);
        shell.removeEventListener("dragend", dragend);
        shell.removeEventListener("dragover", dragover);
        shell.removeEventListener("drop", drop);
      });
    }

    mountIntegration(name, element, context) {
      const handlers = {
        slider: () => this.mountSlider(element, context),
        countdown: () => this.mountCountdown(element),
        header: () => this.mountHeader(element, context),
        coverage: () => this.mountCoverage(element),
        form: () => this.mountForm(element, context),
      };
      if (handlers[name]) handlers[name]();
    }

    mountSlider(element, context) {
      const slides = Array.from(element.querySelectorAll(":scope > .vb-slider__track > .vb-slide"));
      if (!slides.length) return;
      let current = 0;
      const dots = element.querySelector(".vb-slider__dots");
      const render = function () {
        slides.forEach(function (slide, index) { slide.classList.toggle("is-active", index === current); slide.setAttribute("aria-hidden", index === current ? "false" : "true"); });
        if (dots) Array.from(dots.children).forEach(function (dot, index) { dot.classList.toggle("is-active", index === current); });
      };
      if (dots) {
        dots.replaceChildren();
        slides.forEach(function (_, index) { const dot = document.createElement("button"); dot.type = "button"; dot.setAttribute("aria-label", "Ir para slide " + (index + 1)); dot.addEventListener("click", function () { current = index; render(); }); dots.appendChild(dot); });
      }
      const previous = element.querySelector("[data-slider-previous]");
      const next = element.querySelector("[data-slider-next]");
      const go = function (step) { current = (current + step + slides.length) % slides.length; render(); };
      if (previous) previous.addEventListener("click", function (event) { event.preventDefault(); go(-1); });
      if (next) next.addEventListener("click", function (event) { event.preventDefault(); go(1); });
      render();
      let timer = null;
      if (context.props.autoplay && this.mode !== "editor" && slides.length > 1) timer = window.setInterval(function () { go(1); }, Math.max(2000, Number(context.props.interval || 6000)));
      this.cleanups.push(function () { if (timer) window.clearInterval(timer); });
    }

    mountCountdown(element) {
      const value = element.querySelector("[data-countdown-value]");
      if (!value) return;
      const render = function () {
        const remaining = Math.max(0, new Date(value.dataset.target).getTime() - Date.now());
        if (!Number.isFinite(remaining)) { value.textContent = "Data invalida"; return; }
        const days = Math.floor(remaining / 86400000);
        const hours = Math.floor(remaining / 3600000) % 24;
        const minutes = Math.floor(remaining / 60000) % 60;
        const seconds = Math.floor(remaining / 1000) % 60;
        value.textContent = [days + "d", String(hours).padStart(2, "0") + "h", String(minutes).padStart(2, "0") + "m", String(seconds).padStart(2, "0") + "s"].join(" ");
      };
      render();
      const timer = window.setInterval(render, 1000);
      this.cleanups.push(function () { window.clearInterval(timer); });
    }

    mountHeader(element) {
      const button = element.querySelector(".vb-header__menu");
      const toggle = function (event) { event.preventDefault(); const open = element.classList.toggle("is-menu-open"); button.setAttribute("aria-expanded", open ? "true" : "false"); };
      const themeButton = element.querySelector("[data-vb-theme-toggle]");
      const toggleTheme = () => {
        const documentElement = element.closest(".vb-document");
        if (!documentElement) return;
        const dark = documentElement.classList.toggle("is-dark");
        if (this.mode === "public") localStorage.setItem("fl-vb-site-theme", dark ? "dark" : "light");
        const icon = themeButton.querySelector("[data-lucide]");
        if (icon) icon.setAttribute("data-lucide", dark ? "sun" : "moon");
        this.refreshIcons();
      };
      if (button) button.addEventListener("click", toggle);
      if (themeButton) themeButton.addEventListener("click", toggleTheme);
      this.cleanups.push(function () { if (button) button.removeEventListener("click", toggle); if (themeButton) themeButton.removeEventListener("click", toggleTheme); });
    }

    mountCoverage(element) {
      const target = element.querySelector("[data-vb-coverage-map]");
      if (!target || !window.L) return;
      try {
        const map = window.L.map(target, { zoomControl: true, scrollWheelZoom: false, attributionControl: false }).setView([-22.973, -43.372], 10);
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
        const areas = window.FLCoverage ? window.FLCoverage.effectiveAreas(this.data) : this.data.regions || [];
        const bounds = [];
        areas.forEach(function (area) {
          const latitude = Number(area.lat || area.latitude);
          const longitude = Number(area.lng || area.longitude);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
          const marker = window.L.circleMarker([latitude, longitude], { radius: 8, color: "#ffffff", weight: 3, fillColor: "#0874e7", fillOpacity: 0.95 }).addTo(map);
          marker.bindTooltip(TB.plainText(area.name || area.city, 160));
          bounds.push([latitude, longitude]);
        });
        if (bounds.length) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
        window.setTimeout(function () { map.invalidateSize(); }, 80);
        this.cleanups.push(function () { map.remove(); });
      } catch (error) { target.classList.add("is-map-unavailable"); }
    }

    mountForm(element, context) {
      const submit = (event) => {
        event.preventDefault();
        if (this.mode === "editor") return;
        const values = Object.fromEntries(new FormData(element).entries());
        if (this.callbacks.formSubmit) this.callbacks.formSubmit(context.node.id, element.dataset.formAction, values);
      };
      element.addEventListener("submit", submit);
      this.cleanups.push(function () { element.removeEventListener("submit", submit); });
    }

    refreshIcons() {
      if (!window.lucide || typeof window.lucide.createIcons !== "function") return;
      try { window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } }); } catch (error) {}
    }
  }

  function createMessage(type, token, payload) {
    return { channel: "fl-visual-builder", version: MESSAGE_VERSION, type: type, token: String(token || ""), payload: payload || {} };
  }

  function validMessage(event, token) {
    const message = event && event.data;
    return Boolean(message && message.channel === "fl-visual-builder" && message.version === MESSAGE_VERSION && message.token === String(token || ""));
  }

  TB.ThemeRenderer = ThemeRenderer;
  TB.resolveBinding = resolveBinding;
  TB.resolveProps = resolveProps;
  TB.MESSAGE_VERSION = MESSAGE_VERSION;
  TB.createMessage = createMessage;
  TB.validMessage = validMessage;
})();

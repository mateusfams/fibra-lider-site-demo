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
    return { parentId: parent.parentId, slot: parent.slot, index: parent.index };
  }

  function dropPlacement(documentValue, targetId, position, childType) {
    const target = documentValue.nodes[targetId];
    if (!target) return null;
    if (position === "inside") {
      const definition = TB.registry.get(target.type);
      const slot = definition && Object.keys(definition.slots || {}).find(function (slotName) { return !childType || TB.canInsert(documentValue, target.id, slotName, childType).ok; });
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
      const activeTheme = localStorage.getItem("fl-site-theme") || localStorage.getItem("fl-vb-site-theme") || document.documentElement.dataset.theme;
      if (activeTheme === "dark") shell.classList.add("is-dark");
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
        const plain = event.dataTransfer.getData("text/plain") || "";
        const nodeId = event.dataTransfer.getData("application/x-fl-vb-node") || (plain.startsWith("fl-node:") ? plain.slice(8) : this.document.nodes[plain] ? plain : "");
        const componentType = event.dataTransfer.getData("application/x-fl-vb-component") || (plain.startsWith("fl-component:") ? plain.slice(13) : TB.registry.get(plain) ? plain : "");
        const childType = componentType || nodeId && this.document.nodes[nodeId] && this.document.nodes[nodeId].type;
        const position = target.dataset.vbDropPosition || "inside";
        const placement = dropPlacement(this.document, target.dataset.vbNode, position, childType);
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
        planCatalog: () => this.mountPlanCatalog(element, context),
        countdown: () => this.mountCountdown(element),
        header: () => this.mountHeader(element, context),
        coverage: () => this.mountCoverage(element),
        form: () => this.mountForm(element, context),
        canonicalHeader: () => this.mountCanonicalHeader(element),
        canonicalSlider: () => this.mountCanonicalSlider(element, context),
        canonicalPlans: () => this.mountCanonicalPlans(element),
        canonicalCoverage: () => this.mountCanonicalCoverage(element),
        canonicalFaq: () => this.mountCanonicalFaq(element),
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

    mountPlanCatalog(element, context) {
      const filters = Array.from(element.querySelectorAll("[data-vb-plan-filter]"));
      const cards = Array.from(element.querySelectorAll("[data-plan-category]"));
      const apply = function (category) {
        filters.forEach(function (button) { button.classList.toggle("is-active", button.dataset.vbPlanFilter === category); });
        cards.forEach(function (card) { card.hidden = category && category !== "all" && card.dataset.planCategory !== category; });
      };
      const listeners = [];
      filters.forEach(function (button) { const listener = function (event) { event.preventDefault(); apply(button.dataset.vbPlanFilter); }; button.addEventListener("click", listener); listeners.push(function () { button.removeEventListener("click", listener); }); });
      if (filters.length) apply((filters.find(function (button) { return button.classList.contains("is-active"); }) || filters[0]).dataset.vbPlanFilter);
      const coupon = element.querySelector("[data-vb-coupon-form]");
      if (coupon) { const submit = function (event) { event.preventDefault(); const input = coupon.elements.coupon; if (!input || !input.value.trim()) return; coupon.classList.add("is-applied"); const label = coupon.querySelector("label"); if (label) label.textContent = "Cupom selecionado: " + TB.plainText(input.value.trim().toUpperCase(), 24); }; coupon.addEventListener("submit", submit); listeners.push(function () { coupon.removeEventListener("submit", submit); }); }
      this.cleanups.push(function () { listeners.forEach(function (cleanup) { cleanup(); }); });
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

    mountCanonicalHeader(element) {
      const menuButton = element.querySelector("[data-canonical-menu]");
      const navigation = element.querySelector(".site-nav");
      const themeButton = element.querySelector("[data-canonical-theme-toggle]");
      const logo = element.querySelector(".site-logo img");
      const renderTheme = () => {
        const dark = document.documentElement.dataset.theme === "dark";
        const documentShell = element.closest(".vb-document");
        if (documentShell) documentShell.classList.toggle("is-dark", dark);
        const icon = themeButton && themeButton.querySelector("[data-lucide]");
        if (icon) icon.setAttribute("data-lucide", dark ? "sun" : "moon");
        if (logo) {
          const brand = this.data.brand || {};
          logo.src = TB.safeMediaUrl(dark ? brand.logo : brand.logoDark || brand.logo, "./assets/img/fibra-lider-logo-dark.png");
        }
        this.refreshIcons();
      };
      const toggleMenu = function (event) {
        event.preventDefault();
        const opened = document.body.classList.toggle("menu-open");
        menuButton.setAttribute("aria-expanded", String(opened));
        const icon = menuButton.querySelector("[data-lucide]");
        if (icon) icon.setAttribute("data-lucide", opened ? "x" : "menu");
        if (window.lucide) window.lucide.createIcons();
      };
      const closeMenu = function () {
        document.body.classList.remove("menu-open");
        if (menuButton) menuButton.setAttribute("aria-expanded", "false");
      };
      const toggleTheme = (event) => {
        event.preventDefault();
        const legacyToggle = document.getElementById("site-theme-toggle");
        if (this.mode === "public" && legacyToggle && !element.contains(legacyToggle)) {
          legacyToggle.click();
        } else {
          const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
          document.documentElement.dataset.theme = next;
          localStorage.setItem("fl-site-theme", next);
        }
        window.setTimeout(renderTheme, 0);
      };
      if (menuButton) menuButton.addEventListener("click", toggleMenu);
      if (navigation) navigation.addEventListener("click", closeMenu);
      if (themeButton) themeButton.addEventListener("click", toggleTheme);
      renderTheme();
      this.cleanups.push(function () {
        if (menuButton) menuButton.removeEventListener("click", toggleMenu);
        if (navigation) navigation.removeEventListener("click", closeMenu);
        if (themeButton) themeButton.removeEventListener("click", toggleTheme);
        document.body.classList.remove("menu-open");
      });
    }

    mountCanonicalSlider(element, context) {
      const slides = Array.from(element.querySelectorAll(":scope > .canonical-hero-slides > .hero-slide"));
      const dots = element.querySelector("[data-canonical-dots]");
      const arrows = element.querySelector("[data-canonical-arrows]");
      if (!slides.length) return;
      let current = 0;
      const render = () => {
        slides.forEach(function (slide, index) {
          slide.classList.toggle("is-active", index === current);
          slide.setAttribute("aria-hidden", index === current ? "false" : "true");
        });
        if (dots) Array.from(dots.children).forEach(function (dot, index) { dot.classList.toggle("is-active", index === current); });
      };
      const go = (step) => { current = (current + step + slides.length) % slides.length; render(); };
      if (dots) {
        dots.replaceChildren();
        slides.forEach(function (slide, index) {
          const dot = document.createElement("button");
          dot.className = "hero-dot";
          dot.type = "button";
          dot.setAttribute("aria-label", "Ver " + TB.plainText(slide.dataset.vbLabel || "destaque " + (index + 1), 100));
          dot.addEventListener("click", function (event) { event.preventDefault(); current = index; render(); });
          dots.appendChild(dot);
        });
      }
      const previous = element.querySelector("[data-slider-previous]");
      const next = element.querySelector("[data-slider-next]");
      const previousClick = function (event) { event.preventDefault(); go(-1); };
      const nextClick = function (event) { event.preventDefault(); go(1); };
      if (previous) previous.addEventListener("click", previousClick);
      if (next) next.addEventListener("click", nextClick);
      if (dots) dots.hidden = context.props.showDots === false || slides.length < 2;
      if (arrows) arrows.hidden = context.props.showArrows === false || slides.length < 2;
      render();
      let timer = null;
      const start = () => {
        if (timer) window.clearInterval(timer);
        if (context.props.autoplay !== false && this.mode !== "editor" && slides.length > 1) timer = window.setInterval(function () { go(1); }, Math.max(3500, Number(context.props.interval || 6500)));
      };
      const stop = function () { if (timer) window.clearInterval(timer); timer = null; };
      if (this.data.slider && this.data.slider.pauseOnHover) {
        element.addEventListener("mouseenter", stop);
        element.addEventListener("mouseleave", start);
      }
      start();
      this.cleanups.push(() => {
        stop();
        if (previous) previous.removeEventListener("click", previousClick);
        if (next) next.removeEventListener("click", nextClick);
        element.removeEventListener("mouseenter", stop);
        element.removeEventListener("mouseleave", start);
      });
    }

    mountCanonicalPlans(element) {
      const filters = Array.from(element.querySelectorAll("[data-canonical-category]"));
      const cards = Array.from(element.querySelectorAll("[data-canonical-plan]"));
      const showAllButton = element.querySelector("[data-canonical-show-all]");
      const couponShell = element.querySelector("[data-canonical-coupon]");
      const couponForm = couponShell && couponShell.querySelector("form");
      const couponStatus = couponShell && couponShell.querySelector(".coupon-activation__status");
      const couponClear = couponShell && couponShell.querySelector("[data-canonical-coupon-clear]");
      const limit = Math.max(1, Number(element.dataset.visibleLimit || 3));
      let category = element.dataset.initialCategory || (filters[0] && filters[0].dataset.canonicalCategory) || "all";
      let showAll = false;
      let coupon = null;
      const listeners = [];
      const visibleCards = function () { return cards.filter(function (card) { return category === "all" || card.dataset.planCategory === category; }); };
      const renderCards = () => {
        const eligible = visibleCards();
        cards.forEach(function (card) { card.hidden = !eligible.includes(card) || (!showAll && eligible.indexOf(card) >= limit); });
        filters.forEach(function (button) { button.classList.toggle("is-active", button.dataset.canonicalCategory === category); });
        if (showAllButton) {
          showAllButton.hidden = eligible.length <= limit;
          showAllButton.innerHTML = (showAll ? "Mostrar menos " : "Ver todos os planos ") + '<i data-lucide="arrow-right"></i>';
        }
        this.refreshIcons();
      };
      const renderCoupon = () => {
        cards.forEach((card) => {
          const plan = (this.data.plans || []).find(function (item) { return String(item.id) === card.dataset.planIdValue; });
          const applied = plan && coupon && window.FL && FL.couponAppliesToPlan(coupon, plan);
          const priceValue = applied ? FL.couponPrice(plan, coupon) : Number(plan && plan.price || card.dataset.planPrice || 0);
          const price = (window.FL ? FL.formatCurrency(priceValue) : String(priceValue)).replace("R$", "").trim().split(",");
          const promotion = card.querySelector(".plan-promotion");
          const oldPrice = card.querySelector(".plan-old-price");
          const after = card.querySelector(".plan-price-after");
          const integer = card.querySelector(".plan-price > b");
          const decimal = card.querySelector(".plan-price > span");
          if (promotion) { promotion.hidden = !applied; promotion.innerHTML = applied ? '<span><i data-lucide="badge-percent"></i>' + TB.escapeHtml(FL.couponLabel(coupon)) + '</span><small>Cupom ' + TB.escapeHtml(coupon.code) + ' aplicado</small>' : ""; }
          if (oldPrice) { oldPrice.hidden = !applied; oldPrice.textContent = applied ? "De " + FL.formatCurrency(plan.price) + " por" : ""; }
          if (integer) integer.textContent = price[0] || "0";
          if (decimal) decimal.innerHTML = "," + TB.escapeHtml(price[1] || "00") + "<small>/" + TB.escapeHtml(plan && plan.period || "mes") + "</small>";
          const temporary = applied && coupon.durationType !== "lifetime";
          if (after) { after.hidden = !temporary; after.textContent = temporary ? "Depois, " + FL.formatCurrency(plan.price) + "/" + plan.period : ""; }
        });
        if (couponStatus) {
          couponStatus.hidden = !coupon;
          const label = couponStatus.querySelector("span");
          if (label) label.textContent = coupon ? "Cupom " + coupon.code + " ativado para os planos participantes." : "";
        }
        this.refreshIcons();
      };
      filters.forEach((button) => {
        const listener = (event) => { event.preventDefault(); category = button.dataset.canonicalCategory; showAll = false; renderCards(); };
        button.addEventListener("click", listener);
        listeners.push(function () { button.removeEventListener("click", listener); });
      });
      if (showAllButton) {
        const listener = function (event) { event.preventDefault(); showAll = !showAll; renderCards(); };
        showAllButton.addEventListener("click", listener);
        listeners.push(function () { showAllButton.removeEventListener("click", listener); });
      }
      if (couponForm) {
        const listener = (event) => {
          event.preventDefault();
          const input = couponForm.elements.coupon;
          coupon = window.FL && input ? FL.couponByCode(this.data, input.value, "code") : null;
          if (!coupon) {
            if (couponStatus) { couponStatus.hidden = false; const label = couponStatus.querySelector("span"); if (label) label.textContent = "Codigo invalido, esgotado ou fora da validade."; }
            return;
          }
          renderCoupon();
        };
        couponForm.addEventListener("submit", listener);
        listeners.push(function () { couponForm.removeEventListener("submit", listener); });
      }
      if (couponClear) {
        const listener = (event) => { event.preventDefault(); coupon = null; if (couponForm) couponForm.reset(); renderCoupon(); };
        couponClear.addEventListener("click", listener);
        listeners.push(function () { couponClear.removeEventListener("click", listener); });
      }
      renderCards();
      renderCoupon();
      this.cleanups.push(function () { listeners.forEach(function (cleanup) { cleanup(); }); });
    }

    mountCanonicalCoverage(element) {
      this.mountCoverage(element);
      const form = element.querySelector("[data-canonical-coverage-form]");
      const result = element.querySelector("[data-canonical-coverage-result]");
      if (!form) return;
      const cep = form.elements.cep;
      const inputListener = function () {
        const digits = cep.value.replace(/\D/g, "").slice(0, 8);
        cep.value = digits.replace(/(\d{5})(\d)/, "$1-$2");
      };
      const submit = (event) => {
        event.preventDefault();
        if (this.mode === "editor") {
          result.hidden = false;
          result.textContent = "A consulta de cobertura funciona no site publicado.";
          return;
        }
        const legacy = document.getElementById("coverage-form");
        if (!legacy || element.contains(legacy)) return;
        const legacyCep = legacy.elements.cep;
        const legacyCity = legacy.elements.city;
        const legacyNeighborhood = legacy.elements.neighborhood;
        if (legacyCep) { legacyCep.value = cep.value; legacyCep.dispatchEvent(new Event("input", { bubbles: true })); }
        if (legacyCity) legacyCity.value = form.elements.city.value;
        if (legacyNeighborhood) legacyNeighborhood.value = form.elements.neighborhood.value;
        legacy.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        const sync = function () {
          const legacyResult = document.getElementById("coverage-result");
          if (!legacyResult || !result) return;
          result.hidden = legacyResult.hidden;
          result.innerHTML = legacyResult.innerHTML;
        };
        window.setTimeout(sync, 80);
        window.setTimeout(sync, 700);
      };
      if (cep) cep.addEventListener("input", inputListener);
      form.addEventListener("submit", submit);
      this.cleanups.push(function () { if (cep) cep.removeEventListener("input", inputListener); form.removeEventListener("submit", submit); });
    }

    mountCanonicalFaq(element) {
      const listener = function (event) {
        const button = event.target.closest(".faq-item > button");
        if (!button || !element.contains(button)) return;
        event.preventDefault();
        const selected = button.parentElement;
        const open = !selected.classList.contains("is-open");
        element.querySelectorAll(".faq-item").forEach(function (item) {
          item.classList.remove("is-open");
          const control = item.querySelector("button");
          if (control) control.setAttribute("aria-expanded", "false");
        });
        if (open) { selected.classList.add("is-open"); button.setAttribute("aria-expanded", "true"); }
      };
      element.addEventListener("click", listener);
      this.cleanups.push(function () { element.removeEventListener("click", listener); });
    }

    mountCoverage(element) {
      const target = element.querySelector("[data-vb-coverage-map]");
      if (!target || !window.L) return;
      try {
        const settings = this.data.coverageSettings || {};
        const accent = this.data.theme && (this.data.theme.mapAccent || this.data.theme.primary) || "#0874e7";
        const mode = settings.areaSourceMode || "auto";
        const regions = (mode === "imported" ? [] : this.data.regions || []).filter(function (area) {
          return area.active !== false && Number.isFinite(Number(area.lat)) && Number.isFinite(Number(area.lng));
        });
        const files = (mode === "manual" ? [] : this.data.coverageFiles || []).filter(function (file) { return file.active !== false; });
        const coverageForm = element.querySelector("[data-canonical-coverage-form]");
        const selectArea = function (name) {
          const city = coverageForm && coverageForm.elements.city;
          if (!city || !name) return;
          const option = Array.from(city.options).find(function (item) { return item.value === name; });
          if (option) city.value = name;
          if (coverageForm.elements.neighborhood) coverageForm.elements.neighborhood.focus();
        };
        const map = window.L.map(target, { zoomControl: true, scrollWheelZoom: false, attributionControl: true, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView([Number(settings.centerLat || -22.835), Number(settings.centerLng || -47.19)], 11);
        window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
        target.classList.add("map-style--" + (settings.mapStyle || "brand"));
        map.createPane("coverageGlow");
        map.getPane("coverageGlow").style.zIndex = 390;
        map.getPane("coverageGlow").style.pointerEvents = "none";
        const bounds = [];
        regions.forEach(function (area) {
          const latitude = Number(area.lat);
          const longitude = Number(area.lng);
          const point = [latitude, longitude];
          const color = area.color || accent;
          const radius = Math.max(500, Number(area.radiusKm || settings.defaultRadiusKm || 2) * 1000);
          bounds.push(point);
          window.L.circle(point, { pane: "coverageGlow", radius: Math.max(700, radius * 1.18), color: color, fillColor: color, fillOpacity: .1, opacity: .24, weight: 12, interactive: false }).addTo(map);
          const circle = window.L.circle(point, { radius: radius, color: color, fillColor: color, fillOpacity: settings.showInterest ? .14 + Number(area.interest || 0) / 520 : .24, weight: 2 }).addTo(map);
          circle.bindTooltip('<strong>' + TB.escapeHtml(area.name || area.city) + '</strong><span>' + TB.escapeHtml(area.status || "Area atendida") + '</span><small>' + Number(area.interest || 0) + '% de interesse</small>', { direction: "top", className: "coverage-tooltip" });
          circle.on("click", function () { selectArea(area.city || area.name); });
          const marker = window.L.circleMarker(point, { radius: 7, color: "#ffffff", weight: 2, fillColor: color, fillOpacity: 1 }).addTo(map);
          marker.bindTooltip(TB.escapeHtml(area.name || area.city), { permanent: Boolean(settings.showLabels), direction: "top", offset: [0, -8], className: "region-map-label" });
          marker.on("click", function () { selectArea(area.city || area.name); });
        });
        files.forEach(function (file) {
          const color = file.color || accent;
          (file.features || []).forEach(function (feature, index) {
            const label = window.FLCoverage ? window.FLCoverage.publicFeatureName(feature, index) : feature.name;
            if (feature.type === "polygon") {
              window.L.polygon(feature.coordinates, { pane: "coverageGlow", color: color, fillColor: color, fillOpacity: .1, opacity: .28, weight: 10, interactive: false }).addTo(map);
              window.L.polygon(feature.coordinates, { color: color, fillColor: color, fillOpacity: Number(settings.importedAreaOpacity || .3), weight: 2.5 }).addTo(map).bindTooltip('<strong>' + TB.escapeHtml(label) + '</strong><span>Area atendida pela ' + TB.escapeHtml(this.data.brand && this.data.brand.name || "empresa") + '</span>', { direction: "top", className: "coverage-tooltip" });
              bounds.push.apply(bounds, feature.coordinates);
            }
            else if (feature.type === "line") { window.L.polyline(feature.coordinates, { color: color, opacity: .85, weight: 3 }).addTo(map).bindTooltip(TB.plainText(label, 180)); bounds.push.apply(bounds, feature.coordinates); }
            else if (feature.type === "point") { window.L.circleMarker(feature.coordinates, { radius: 6, color: "#ffffff", fillColor: color, fillOpacity: 1, weight: 2 }).addTo(map).bindTooltip(TB.plainText(label, 180)); bounds.push(feature.coordinates); }
          }, this);
          if (window.FLCoverage) window.FLCoverage.importedAreas([file]).forEach(function (area) {
            if (!Number.isFinite(Number(area.lat)) || !Number.isFinite(Number(area.lng))) return;
            const marker = window.L.marker([Number(area.lat), Number(area.lng)], { icon: window.L.divIcon({ className: "coverage-place-marker", html: '<span style="--marker-color:' + TB.escapeHtml(color) + '"></span>' + (settings.showImportedLabels ? '<b>' + TB.escapeHtml(area.name) + '</b>' : ""), iconSize: [180, 32], iconAnchor: [11, 16] }), keyboard: true }).addTo(map);
            marker.bindTooltip('<strong>' + TB.escapeHtml(area.name) + '</strong><span>' + TB.escapeHtml([area.road, area.postcode].filter(Boolean).join(" - ") || "Cobertura confirmada") + '</span>', { direction: "top", className: "coverage-tooltip" });
            marker.on("click", function () { selectArea(area.city || area.name); });
          });
        }, this);
        if (bounds.length) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 11 });
        const updatePlaceLabels = function () {
          target.classList.toggle("show-place-labels", Boolean(settings.showImportedLabels) && map.getZoom() >= 14);
        };
        map.on("zoomend", updatePlaceLabels);
        updatePlaceLabels();
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

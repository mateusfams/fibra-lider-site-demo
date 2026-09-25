(function () {
  "use strict";

  const TB = window.FLThemeBuilder;
  if (!TB) throw new Error("Theme Builder Core precisa ser carregado antes dos componentes.");

  const registry = TB.registry;
  const iconPattern = /^[a-z0-9-]{1,60}$/;

  function option(value, label) { return { value: value, label: label }; }
  function textField(label, group, options) { return { type: "string", control: "text", label: label, group: group || "content", maxLength: 500, ...(options || {}) }; }
  function textarea(label, group, options) { return { type: "string", control: "textarea", label: label, group: group || "content", maxLength: 5000, ...(options || {}) }; }
  function selectField(label, values, group) { return { type: "string", control: "select", label: label, group: group || "content", options: values }; }
  function switchField(label, group) { return { type: "boolean", control: "switch", label: label, group: group || "content" }; }
  function numberField(label, group, options) { return { type: "number", control: "number", label: label, group: group || "content", ...(options || {}) }; }
  function imageField(label, group, extra) { return { type: "image", control: "asset", label: label, group: group || "content", ...(extra || {}) }; }
  function urlField(label, group) { return { type: "url", control: "link", label: label, group: group || "content" }; }
  function iconField(label, group) { return { type: "string", control: "icon", label: label, group: group || "content", maxLength: 60 }; }

  function element(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function safeIcon(value) {
    const name = String(value || "sparkles").toLowerCase();
    return iconPattern.test(name) ? name : "sparkles";
  }

  function cssImageValue(value, fallback) {
    const safe = TB.safeMediaUrl(value, fallback || "");
    if (!safe) return "";
    try { return new URL(safe, document.baseURI).href.replace(/["\\\n\r]/g, ""); }
    catch (error) { return ""; }
  }

  function appendIcon(root, name) {
    const icon = element("i");
    icon.setAttribute("data-lucide", safeIcon(name));
    root.appendChild(icon);
    return icon;
  }

  function setLink(anchor, value, context) {
    let href = String(value || "#");
    if (href === "whatsapp") {
      const phone = context.data && context.data.brand && context.data.brand.whatsapp || "";
      const brand = context.data && context.data.brand && context.data.brand.name || "a empresa";
      href = "https://wa.me/" + String(phone).replace(/\D/g, "") + "?text=" + encodeURIComponent("Ola, tenho interesse nos servicos da " + brand + ".");
    }
    anchor.href = TB.safeUrl(href, "#");
    if (/^https?:/i.test(anchor.href)) { anchor.target = "_blank"; anchor.rel = "noopener"; }
  }

  function sanitizeRichText(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    const allowed = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "A", "UL", "OL", "LI", "SPAN"]);
    Array.from(template.content.querySelectorAll("*")).forEach(function (node) {
      if (!allowed.has(node.tagName)) { node.replaceWith(document.createTextNode(node.textContent || "")); return; }
      Array.from(node.attributes).forEach(function (attribute) {
        if (node.tagName === "A" && attribute.name === "href") node.setAttribute("href", TB.safeUrl(attribute.value, "#"));
        else if (node.tagName === "A" && ["target", "rel"].includes(attribute.name)) return;
        else node.removeAttribute(attribute.name);
      });
      if (node.tagName === "A" && /^https?:/i.test(node.getAttribute("href") || "")) { node.setAttribute("target", "_blank"); node.setAttribute("rel", "noopener"); }
    });
    return template.innerHTML;
  }

  function wrapperDefinition(config) {
    return registry.register({
      type: config.type,
      version: 1,
      label: config.label,
      category: config.category || "layout",
      icon: config.icon || "square-dashed",
      propsSchema: config.propsSchema || {},
      slots: config.slots || { default: { categories: ["layout", "content", "marketing", "commerce", "navigation", "forms", "domain"] } },
      styleCapabilities: config.styleCapabilities || ["layout", "spacing", "size", "background", "border", "effects", "responsive"],
      defaults: config.defaults || { props: {}, styles: {} },
      allowedParents: config.allowedParents,
      compose: config.compose,
      render: function (context) {
        const root = element(config.tag || "div", config.className || "");
        if (config.role) root.setAttribute("role", config.role);
        return { element: root, slots: { default: root } };
      },
    });
  }

  registry.register({
    type: "core.page", version: 1, label: "Pagina", category: "layout", icon: "panels-top-left", hidden: true,
    propsSchema: {}, slots: { default: { categories: ["layout", "content", "marketing", "commerce", "navigation", "forms", "domain"] } },
    styleCapabilities: ["background", "typography"], defaults: { props: {}, styles: {} },
    render: function () { const root = element("div", "vb-page"); return { element: root, slots: { default: root } }; },
  });

  wrapperDefinition({
    type: "layout.section", label: "Secao", icon: "panel-top", tag: "section", className: "vb-section",
    propsSchema: { anchor: textField("Ancora", "advanced", { maxLength: 80 }), ariaLabel: textField("Nome acessivel", "advanced", { maxLength: 120 }) },
    defaults: { props: { anchor: "", ariaLabel: "" }, styles: { base: { normal: { paddingTop: "token.space.xl", paddingBottom: "token.space.xl" } } } },
    compose: function (builder) { builder.append(builder.root, "layout.container", { name: "Container da secao" }); },
  });
  wrapperDefinition({
    type: "layout.container", label: "Container", icon: "rectangle-horizontal", className: "vb-container",
    defaults: { props: {}, styles: { base: { normal: { width: "calc(100% - 48px)", maxWidth: "1180px", marginLeft: "auto", marginRight: "auto" } } } },
  });
  wrapperDefinition({
    type: "layout.row", label: "Linha", icon: "rows-3", className: "vb-row",
    defaults: { props: {}, styles: { base: { normal: { display: "flex", flexDirection: "row", gap: "24px", alignItems: "center" } }, sm: { normal: { flexDirection: "column" } } } },
    compose: function (builder) { builder.append(builder.root, "layout.column", { name: "Coluna 1" }); builder.append(builder.root, "layout.column", { name: "Coluna 2" }); },
  });
  wrapperDefinition({
    type: "layout.column", label: "Coluna", icon: "columns-3", className: "vb-column",
    defaults: { props: {}, styles: { base: { normal: { display: "flex", flexDirection: "column", gap: "16px", width: "100%" } } } },
  });
  wrapperDefinition({
    type: "layout.grid", label: "Grade", icon: "layout-grid", className: "vb-grid",
    propsSchema: { columns: numberField("Colunas", "layout", { min: 1, max: 12 }) },
    defaults: { props: { columns: 3 }, styles: { base: { normal: { display: "grid", gridColumns: "repeat(3, minmax(0, 1fr))", gap: "24px" } }, md: { normal: { gridColumns: "repeat(2, minmax(0, 1fr))" } }, sm: { normal: { gridColumns: "repeat(1, minmax(0, 1fr))" } } } },
    compose: function (builder) { for (let index = 1; index <= 3; index += 1) builder.append(builder.root, "layout.column", { name: "Item " + index }); },
  });

  registry.register({
    type: "layout.spacer", version: 1, label: "Espacador", category: "layout", icon: "move-vertical",
    propsSchema: { height: textField("Altura", "layout", { maxLength: 20 }) }, slots: {}, styleCapabilities: ["size", "responsive"],
    defaults: { props: { height: "48px" }, styles: {} },
    render: function (context) { const root = element("div", "vb-spacer"); root.style.height = /^\d+(?:\.\d+)?(?:px|rem|vh)$/.test(context.props.height) ? context.props.height : "48px"; root.setAttribute("aria-hidden", "true"); return { element: root, slots: {} }; },
  });

  registry.register({
    type: "layout.divider", version: 1, label: "Divisor", category: "layout", icon: "minus",
    propsSchema: {}, slots: {}, styleCapabilities: ["spacing", "size", "border", "responsive"], defaults: { props: {}, styles: { base: { normal: { width: "100%", borderWidth: "1px", borderStyle: "solid", borderColor: "#dbe4ef" } } } },
    render: function () { return { element: element("hr", "vb-divider"), slots: {} }; },
  });

  registry.register({
    type: "content.heading", version: 1, label: "Titulo", category: "content", icon: "heading",
    inlineProperty: "text",
    propsSchema: {
      text: textField("Texto", "content", { required: true, maxLength: 240 }),
      level: selectField("Nivel semantico", [option("1", "H1"), option("2", "H2"), option("3", "H3"), option("4", "H4"), option("5", "H5"), option("6", "H6")], "advanced"),
    },
    slots: {}, styleCapabilities: ["typography", "spacing", "size", "effects", "responsive"],
    defaults: { props: { text: "Novo titulo", level: "2" }, styles: { base: { normal: { color: "token.color.text", fontFamily: "token.font.heading", fontSize: "48px", fontWeight: "700", lineHeight: "1.1" } }, md: { normal: { fontSize: "38px" } }, sm: { normal: { fontSize: "30px" } } } },
    render: function (context) { const level = /^[1-6]$/.test(String(context.props.level)) ? context.props.level : "2"; const root = element("h" + level, "vb-heading"); root.textContent = TB.plainText(context.props.text, 240); return { element: root, slots: {} }; },
  });

  registry.register({
    type: "content.text", version: 1, label: "Texto", category: "content", icon: "text",
    inlineProperty: "text",
    propsSchema: { text: textarea("Texto", "content", { required: true, maxLength: 5000 }), tag: selectField("Elemento", [option("p", "Paragrafo"), option("div", "Bloco"), option("span", "Linha")], "advanced") },
    slots: {}, styleCapabilities: ["typography", "spacing", "size", "effects", "responsive"],
    defaults: { props: { text: "Escreva seu texto aqui.", tag: "p" }, styles: { base: { normal: { color: "token.color.muted", fontSize: "18px", lineHeight: "1.65" } }, sm: { normal: { fontSize: "16px" } } } },
    render: function (context) { const tag = ["p", "div", "span"].includes(context.props.tag) ? context.props.tag : "p"; const root = element(tag, "vb-text"); root.textContent = TB.plainText(context.props.text, 5000); return { element: root, slots: {} }; },
  });

  registry.register({
    type: "content.rich-text", version: 1, label: "Texto rico", category: "content", icon: "pilcrow",
    inlineProperty: "html",
    propsSchema: { html: textarea("Conteudo formatado", "content", { maxLength: 20000 }) }, slots: {},
    styleCapabilities: ["typography", "spacing", "size", "effects", "responsive"],
    defaults: { props: { html: "<p>Selecione este texto para editar <strong>diretamente</strong>.</p>" }, styles: { base: { normal: { color: "token.color.text", fontSize: "17px", lineHeight: "1.7" } } } },
    render: function (context) { const root = element("div", "vb-rich-text"); root.innerHTML = sanitizeRichText(context.props.html); return { element: root, slots: {} }; },
  });

  registry.register({
    type: "content.image", version: 1, label: "Imagem", category: "content", icon: "image",
    propsSchema: {
      src: imageField("Imagem desktop", "content"), mobileSrc: imageField("Imagem mobile", "responsive"), alt: textField("Texto alternativo", "content", { required: true, maxLength: 240 }),
      caption: textField("Legenda", "content"), loading: selectField("Carregamento", [option("lazy", "Preguicoso"), option("eager", "Imediato")], "advanced"), focalX: numberField("Foco horizontal (%)", "style", { min: 0, max: 100 }), focalY: numberField("Foco vertical (%)", "style", { min: 0, max: 100 }),
    },
    slots: {}, styleCapabilities: ["spacing", "size", "border", "effects", "responsive"],
    defaults: { props: { src: "./assets/img/hero-family-fiber.jpg", mobileSrc: "", alt: "Imagem", caption: "", loading: "lazy", focalX: 50, focalY: 50 }, styles: { base: { normal: { width: "100%", height: "auto", objectFit: "cover", borderRadius: "token.radius.lg" } } } },
    render: function (context) {
      const figure = element("figure", "vb-image");
      const picture = element("picture");
      const mobile = TB.safeMediaUrl(context.props.mobileSrc, "");
      if (mobile) { const source = element("source"); source.media = "(max-width: 767px)"; source.srcset = mobile; picture.appendChild(source); }
      const image = element("img"); image.src = TB.safeMediaUrl(context.props.src, "./assets/img/hero-family-fiber.jpg"); image.alt = TB.plainText(context.props.alt, 240); image.loading = context.props.loading === "eager" ? "eager" : "lazy"; image.style.objectPosition = Math.min(100, Math.max(0, Number(context.props.focalX || 50))) + "% " + Math.min(100, Math.max(0, Number(context.props.focalY || 50))) + "%"; picture.appendChild(image); figure.appendChild(picture);
      if (context.props.caption) { const caption = element("figcaption"); caption.textContent = TB.plainText(context.props.caption, 500); figure.appendChild(caption); }
      return { element: figure, slots: {} };
    },
  });

  registry.register({
    type: "content.video", version: 1, label: "Video", category: "content", icon: "video",
    propsSchema: { src: urlField("Arquivo de video", "content"), poster: imageField("Capa", "content"), autoplay: switchField("Reproducao automatica", "behavior"), loop: switchField("Repetir", "behavior"), muted: switchField("Sem som", "behavior"), controls: switchField("Mostrar controles", "behavior") },
    slots: {}, styleCapabilities: ["spacing", "size", "border", "effects", "responsive"],
    defaults: { props: { src: "", poster: "", autoplay: false, loop: false, muted: true, controls: true }, styles: { base: { normal: { width: "100%", borderRadius: "token.radius.lg" } } } },
    render: function (context) { const video = element("video", "vb-video"); const src = TB.safeUrl(context.props.src, ""); if (src) video.src = src; const poster = TB.safeMediaUrl(context.props.poster, ""); if (poster) video.poster = poster; video.autoplay = Boolean(context.props.autoplay); video.loop = Boolean(context.props.loop); video.muted = Boolean(context.props.muted); video.controls = context.props.controls !== false; video.playsInline = true; return { element: video, slots: {} }; },
  });

  registry.register({
    type: "content.icon", version: 1, label: "Icone", category: "content", icon: "sparkles",
    propsSchema: { name: iconField("Icone", "content"), label: textField("Nome acessivel", "advanced", { maxLength: 120 }) }, slots: {}, styleCapabilities: ["typography", "spacing", "size", "background", "border", "effects", "responsive"],
    defaults: { props: { name: "wifi", label: "" }, styles: { base: { normal: { color: "token.color.primary" } } } },
    render: function (context) { const root = element("span", "vb-icon"); appendIcon(root, context.props.name); if (context.props.label) root.setAttribute("aria-label", TB.plainText(context.props.label, 120)); else root.setAttribute("aria-hidden", "true"); return { element: root, slots: {} }; },
  });

  registry.register({
    type: "content.button", version: 1, label: "Botao", category: "content", icon: "mouse-pointer-click", inlineProperty: "text", inlineSelector: "span",
    propsSchema: {
      text: textField("Texto", "content", { required: true, maxLength: 120 }), url: urlField("Link", "content"), target: selectField("Abrir em", [option("self", "Mesma aba"), option("blank", "Nova aba")], "content"),
      icon: iconField("Icone", "content"), iconPosition: selectField("Posicao do icone", [option("left", "Esquerda"), option("right", "Direita")], "content"), ariaLabel: textField("Nome acessivel", "advanced", { maxLength: 160 }),
    },
    slots: {}, styleCapabilities: ["layout", "typography", "spacing", "size", "background", "border", "effects", "responsive"],
    defaults: { props: { text: "Saiba mais", url: "#", target: "self", icon: "arrow-right", iconPosition: "right", ariaLabel: "" }, styles: { base: { normal: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", paddingTop: "13px", paddingRight: "20px", paddingBottom: "13px", paddingLeft: "20px", backgroundColor: "token.color.primary", color: "#ffffff", borderRadius: "token.radius.md", fontWeight: "700", transitionProperty: "all", transitionDuration: "0.2s" }, hover: { transform: "translateY(-2px)", backgroundColor: "#0758b8" }, focus: { borderColor: "token.color.secondary" } } } },
    render: function (context) { const root = element("a", "vb-button"); setLink(root, context.props.url, context); if (context.props.target === "blank") { root.target = "_blank"; root.rel = "noopener"; } if (context.props.icon && context.props.iconPosition === "left") appendIcon(root, context.props.icon); const span = element("span"); span.textContent = TB.plainText(context.props.text, 120); root.appendChild(span); if (context.props.icon && context.props.iconPosition !== "left") appendIcon(root, context.props.icon); if (context.props.ariaLabel) root.setAttribute("aria-label", TB.plainText(context.props.ariaLabel, 160)); return { element: root, slots: {} }; },
  });

  registry.register({
    type: "content.link", version: 1, label: "Link", category: "content", icon: "link", inlineProperty: "text",
    propsSchema: { text: textField("Texto", "content", { required: true }), url: urlField("Destino", "content"), target: selectField("Abrir em", [option("self", "Mesma aba"), option("blank", "Nova aba")], "content") },
    slots: {}, styleCapabilities: ["typography", "spacing", "effects", "responsive"], defaults: { props: { text: "Novo link", url: "#", target: "self" }, styles: { base: { normal: { color: "token.color.primary", fontWeight: "700" }, hover: { color: "token.color.secondary" } } } },
    render: function (context) { const root = element("a", "vb-link"); root.textContent = TB.plainText(context.props.text, 240); setLink(root, context.props.url, context); if (context.props.target === "blank") { root.target = "_blank"; root.rel = "noopener"; } return { element: root, slots: {} }; },
  });

  registry.register({
    type: "marketing.banner", version: 1, label: "Banner", category: "marketing", icon: "gallery-horizontal-end",
    propsSchema: { image: imageField("Imagem desktop", "content", { help: "Recomendado: 1920 x 900 px, WEBP ou JPG." }), mobileImage: imageField("Imagem mobile", "responsive", { help: "Recomendado: 900 x 1200 px para celulares." }), overlay: numberField("Overlay (%)", "style", { min: 0, max: 90 }), minHeight: textField("Altura minima", "layout", { maxLength: 20 }), focalPoint: selectField("Enquadramento", [option("left", "Esquerda"), option("center", "Centro"), option("right", "Direita")], "style") },
    slots: { default: { categories: ["layout", "content", "marketing"] } }, styleCapabilities: ["layout", "spacing", "size", "background", "border", "effects", "responsive"],
    defaults: { props: { image: "./assets/img/hero-family-fiber.jpg", mobileImage: "", overlay: 58, minHeight: "520px", focalPoint: "center" }, styles: { base: { normal: { minHeight: "520px", borderRadius: "token.radius.lg", overflow: "hidden" } } } },
    compose: function (builder) {
      const container = builder.append(builder.root, "layout.container", { name: "Conteudo do banner", styles: { base: { normal: { minHeight: "520px", display: "flex", alignItems: "center" } } } });
      const column = builder.append(container, "layout.column", { name: "Mensagem", styles: { base: { normal: { maxWidth: "660px" } } } });
      builder.append(column, "content.heading", { name: "Titulo", props: { text: "Uma oferta feita para conectar sua casa", level: "2" }, styles: { base: { normal: { color: "#ffffff", fontSize: "52px", fontWeight: "700", lineHeight: "1.08" } }, sm: { normal: { fontSize: "34px" } } } });
      builder.append(column, "content.text", { name: "Descricao", props: { text: "Edite a imagem, a mensagem e a chamada diretamente no construtor.", tag: "p" }, styles: { base: { normal: { color: "#d8e6f4", fontSize: "18px" } } } });
      builder.append(column, "content.button", { name: "Botao", props: { text: "Conhecer planos", url: "#planos", target: "self", icon: "arrow-right", iconPosition: "right" } });
    },
    render: function (context) { const root = element("section", "vb-banner"); root.style.setProperty("--vb-banner-image", 'url("' + cssImageValue(context.props.image, "./assets/img/hero-family-fiber.jpg") + '")'); root.style.setProperty("--vb-banner-mobile", 'url("' + cssImageValue(context.props.mobileImage || context.props.image, "./assets/img/hero-family-fiber.jpg") + '")'); root.style.setProperty("--vb-banner-overlay", String(Math.min(0.9, Math.max(0, Number(context.props.overlay || 0) / 100)))); root.style.backgroundPosition = ["left", "center", "right"].includes(context.props.focalPoint) ? context.props.focalPoint : "center"; const content = element("div", "vb-banner__content"); root.appendChild(content); return { element: root, slots: { default: content } }; },
  });

  registry.register({
    type: "marketing.slider", version: 1, label: "Slider", category: "marketing", icon: "gallery-horizontal",
    propsSchema: { autoplay: switchField("Autoplay", "behavior"), interval: numberField("Intervalo (ms)", "behavior", { min: 2500, max: 20000 }), loop: switchField("Loop", "behavior"), arrows: switchField("Setas", "behavior"), dots: switchField("Indicadores", "behavior"), pauseOnHover: switchField("Pausar no hover", "behavior"), transition: selectField("Animacao", [option("fade", "Fade"), option("slide", "Deslizar")], "effects") },
    slots: { slides: { types: ["marketing.slide"], min: 1, max: 20 } }, styleCapabilities: ["spacing", "size", "background", "border", "effects", "responsive"],
    defaults: { props: { autoplay: true, interval: 6500, loop: true, arrows: true, dots: true, pauseOnHover: true, transition: "fade" }, styles: { base: { normal: { minHeight: "620px", overflow: "hidden" } }, sm: { normal: { minHeight: "590px" } } } },
    editor: { slotManager: { slot: "slides", label: "Slides", singular: "Slide", addType: "marketing.slide", imageProp: "image", variant: "slider" } },
    compose: function (builder) { builder.append(builder.root, "marketing.slide", { name: "Slide 1" }, "slides"); builder.append(builder.root, "marketing.slide", { name: "Slide 2", props: { image: "./assets/img/banner-streaming-family.jpg", mobileImage: "./assets/img/banner-streaming-family.jpg", alt: "Entretenimento para toda a familia", overlay: 62, position: "center" } }, "slides"); },
    render: function (context) {
      const root = element("section", "vb-slider vb-slider--" + (context.props.transition === "slide" ? "slide" : "fade"));
      root.dataset.autoplay = String(Boolean(context.props.autoplay)); root.dataset.interval = String(Math.max(2500, Number(context.props.interval || 6500))); root.dataset.loop = String(context.props.loop !== false); root.dataset.pause = String(context.props.pauseOnHover !== false);
      const track = element("div", "vb-slider__track"); root.appendChild(track);
      const controls = element("div", "vb-slider__controls");
      if (context.props.dots !== false) { const dots = element("div", "vb-slider__dots"); dots.dataset.sliderDots = ""; controls.appendChild(dots); }
      if (context.props.arrows !== false) { const arrows = element("div", "vb-slider__arrows"); const previous = element("button", "vb-slider__arrow"); previous.type = "button"; previous.dataset.sliderPrevious = ""; previous.setAttribute("aria-label", "Slide anterior"); appendIcon(previous, "arrow-left"); const next = element("button", "vb-slider__arrow"); next.type = "button"; next.dataset.sliderNext = ""; next.setAttribute("aria-label", "Proximo slide"); appendIcon(next, "arrow-right"); arrows.append(previous, next); controls.appendChild(arrows); }
      root.appendChild(controls);
      return { element: root, slots: { slides: track }, mount: "slider" };
    },
  });

  registry.register({
    type: "marketing.slide", version: 1, label: "Slide", category: "marketing", icon: "panel-top", hidden: true,
    propsSchema: { image: imageField("Imagem desktop", "content", { help: "Recomendado: 1920 x 900 px, WEBP ou JPG." }), mobileImage: imageField("Imagem mobile", "responsive", { help: "Recomendado: 900 x 1200 px para celulares." }), alt: textField("Texto alternativo", "content"), overlay: numberField("Overlay (%)", "style", { min: 0, max: 90 }), position: selectField("Enquadramento", [option("left", "Esquerda"), option("center", "Centro"), option("right", "Direita")], "style") },
    slots: { default: { categories: ["layout", "content", "marketing"] } }, allowedParents: ["marketing.slider"], styleCapabilities: ["layout", "spacing", "size", "background", "responsive"],
    defaults: { props: { image: "./assets/img/hero-family-fiber.jpg", mobileImage: "", alt: "", overlay: 62, position: "center" }, styles: { base: { normal: { minHeight: "620px" } }, sm: { normal: { minHeight: "590px" } } } },
    compose: function (builder) {
      const container = builder.append(builder.root, "layout.container", { name: "Container do slide", styles: { base: { normal: { minHeight: "620px", display: "flex", alignItems: "center" } }, sm: { normal: { minHeight: "590px" } } } });
      const column = builder.append(container, "layout.column", { name: "Conteudo do slide", styles: { base: { normal: { maxWidth: "720px" } } } });
      builder.append(column, "content.text", { name: "Chamada", props: { text: "Oferta em destaque", tag: "span" }, styles: { base: { normal: { color: "#80d8ff", fontSize: "14px", fontWeight: "700", textTransform: "uppercase" } } } });
      builder.append(column, "content.heading", { name: "Titulo", props: { text: "Internet para viver tudo o que importa", level: "1" }, styles: { base: { normal: { color: "#ffffff", fontSize: "62px", fontWeight: "700", lineHeight: "1.06" } }, md: { normal: { fontSize: "46px" } }, sm: { normal: { fontSize: "35px" } } } });
      builder.append(column, "content.text", { name: "Descricao", props: { text: "Troque este texto, a imagem e o botao sem sair do construtor.", tag: "p" }, styles: { base: { normal: { color: "#d8e6f4", fontSize: "18px", lineHeight: "1.65" } } } });
      builder.append(column, "content.button", { name: "Botao", props: { text: "Conhecer planos", url: "#planos", target: "self", icon: "arrow-right", iconPosition: "right" }, styles: { base: { normal: { backgroundColor: "#ffffff", color: "#0758b8" } } } });
    },
    render: function (context) { const root = element("article", "vb-slide"); const picture = element("picture", "vb-slide__media"); const mobile = TB.safeMediaUrl(context.props.mobileImage, ""); if (mobile) { const source = element("source"); source.media = "(max-width: 767px)"; source.srcset = mobile; picture.appendChild(source); } const image = element("img"); image.src = TB.safeMediaUrl(context.props.image, "./assets/img/hero-family-fiber.jpg"); image.alt = TB.plainText(context.props.alt, 240); image.style.objectPosition = context.props.position || "center"; picture.appendChild(image); root.appendChild(picture); const shade = element("div", "vb-slide__shade"); shade.style.opacity = String(Math.min(0.9, Math.max(0, Number(context.props.overlay || 0) / 100))); root.appendChild(shade); const content = element("div", "vb-slide__content"); root.appendChild(content); return { element: root, slots: { default: content } }; },
  });

  wrapperDefinition({
    type: "marketing.cta", label: "Chamada comercial", category: "marketing", icon: "badge-dollar-sign", tag: "section", className: "vb-cta",
    slots: { default: { categories: ["layout", "content"] } }, defaults: { props: {}, styles: { base: { normal: { paddingTop: "52px", paddingRight: "52px", paddingBottom: "52px", paddingLeft: "52px", backgroundColor: "token.color.primary", borderRadius: "token.radius.lg" } }, sm: { normal: { paddingTop: "32px", paddingRight: "24px", paddingBottom: "32px", paddingLeft: "24px" } } } },
    compose: function (builder) { const column = builder.append(builder.root, "layout.column", { name: "Conteudo da chamada" }); builder.append(column, "content.heading", { props: { text: "Pronto para dar o proximo passo?", level: "2" }, styles: { base: { normal: { color: "#ffffff" } } } }); builder.append(column, "content.text", { props: { text: "Edite esta mensagem e direcione o visitante para a acao certa.", tag: "p" }, styles: { base: { normal: { color: "#d8e6f4" } } } }); builder.append(column, "content.button", { props: { text: "Falar agora", url: "whatsapp", target: "blank", icon: "message-circle", iconPosition: "left" } }); },
  });

  registry.register({
    type: "marketing.countdown", version: 1, label: "Contagem regressiva", category: "marketing", icon: "timer",
    propsSchema: { target: textField("Data final (ISO)", "content", { maxLength: 40 }), label: textField("Rotulo", "content", { maxLength: 120 }) }, slots: {}, styleCapabilities: ["typography", "spacing", "size", "background", "border", "effects", "responsive"],
    defaults: { props: { target: new Date(Date.now() + 7 * 86400000).toISOString(), label: "Oferta termina em" }, styles: { base: { normal: { paddingTop: "18px", paddingRight: "20px", paddingBottom: "18px", paddingLeft: "20px", backgroundColor: "#07111e", color: "#ffffff", borderRadius: "token.radius.md", textAlign: "center" } } } },
    render: function (context) { const root = element("div", "vb-countdown"); const label = element("span"); label.textContent = TB.plainText(context.props.label, 120); const value = element("strong"); value.dataset.countdownValue = ""; value.dataset.target = TB.plainText(context.props.target, 40); value.textContent = "00d 00h 00m 00s"; root.append(label, value); return { element: root, slots: {}, mount: "countdown" }; },
  });

  registry.register({
    type: "marketing.testimonials", version: 1, label: "Depoimentos", category: "marketing", icon: "messages-square",
    propsSchema: { limit: numberField("Quantidade", "content", { min: 1, max: 12 }), showCity: switchField("Mostrar cidade", "content") }, slots: {}, dataContract: "testimonials", styleCapabilities: ["spacing", "size", "responsive"],
    defaults: { props: { limit: 3, showCity: true }, styles: {} },
    render: function (context) { const root = element("div", "vb-testimonials"); (context.data.testimonials || []).slice(0, Math.max(1, Number(context.props.limit || 3))).forEach(function (item) { const card = element("article", "vb-testimonial"); const stars = element("div", "vb-testimonial__stars"); for (let index = 0; index < Math.min(5, Number(item.rating || 5)); index += 1) appendIcon(stars, "star"); const quote = element("blockquote"); quote.textContent = TB.plainText(item.text, 1000); const person = element("strong"); person.textContent = TB.plainText(item.name, 120) + (context.props.showCity && item.city ? " - " + TB.plainText(item.city, 120) : ""); card.append(stars, quote, person); root.appendChild(card); }); return { element: root, slots: {} }; },
  });

  registry.register({
    type: "marketing.faq", version: 1, label: "Perguntas frequentes", category: "marketing", icon: "circle-help",
    propsSchema: { limit: numberField("Quantidade", "content", { min: 1, max: 30 }), firstOpen: switchField("Primeira aberta", "behavior") }, slots: {}, dataContract: "faq", styleCapabilities: ["spacing", "size", "responsive"],
    defaults: { props: { limit: 6, firstOpen: true }, styles: {} },
    render: function (context) { const root = element("div", "vb-faq"); (context.data.faq || []).slice(0, Math.max(1, Number(context.props.limit || 6))).forEach(function (item, index) { const details = element("details", "vb-faq__item"); details.open = index === 0 && context.props.firstOpen !== false; const summary = element("summary"); summary.textContent = TB.plainText(item.question, 500); appendIcon(summary, "plus"); const answer = element("p"); answer.textContent = TB.plainText(item.answer, 3000); details.append(summary, answer); root.appendChild(details); }); return { element: root, slots: {} }; },
  });

  registry.register({
    type: "commerce.plan-grid", version: 1, label: "Grade de planos", category: "commerce", icon: "badge-dollar-sign",
    propsSchema: { categoryId: textField("Categoria inicial", "data", { maxLength: 80 }), limit: numberField("Limite", "data", { min: 1, max: 24 }), showFilters: switchField("Mostrar categorias", "content"), showCoupon: switchField("Permitir cupom", "content"), showFeatures: switchField("Mostrar beneficios", "content"), ctaLabel: textField("Texto do botao", "content", { maxLength: 120 }) }, slots: {}, dataContract: "catalog.plans", styleCapabilities: ["spacing", "size", "responsive"],
    defaults: { props: { categoryId: "internet", limit: 6, showFilters: true, showCoupon: true, showFeatures: true, ctaLabel: "Quero este plano" }, styles: {} },
    render: function (context) {
      const shell = element("div", "vb-plan-catalog");
      if (context.props.showFilters !== false) { const filters = element("div", "vb-plan-filters"); (context.data.categories || []).filter(function (category) { return category.active !== false; }).forEach(function (category) { const button = element("button"); button.type = "button"; button.dataset.vbPlanFilter = category.id; button.className = category.id === context.props.categoryId ? "is-active" : ""; button.textContent = TB.plainText(category.name, 80); filters.appendChild(button); }); shell.appendChild(filters); }
      if (context.props.showCoupon !== false) { const coupon = element("form", "vb-coupon-form"); coupon.dataset.vbCouponForm = ""; const label = element("label"); label.textContent = "Tem um cupom?"; const input = element("input"); input.name = "coupon"; input.placeholder = "Digite o codigo"; input.maxLength = 24; const button = element("button"); button.type = "submit"; button.textContent = "Aplicar"; coupon.append(label, input, button); shell.appendChild(coupon); }
      const root = element("div", "vb-plan-grid");
      let plans = (context.data.plans || []).filter(function (plan) { return plan.active !== false; });
      if (context.props.showFilters === false && context.props.categoryId && context.props.categoryId !== "all") plans = plans.filter(function (plan) { return plan.categoryId === context.props.categoryId; });
      plans.slice(0, Math.max(1, Number(context.props.limit || 3))).forEach(function (plan) {
        const card = element("article", "vb-plan-card" + (plan.featured ? " is-featured" : ""));
        card.dataset.planCategory = plan.categoryId || "internet";
        if (plan.badge) { const badge = element("span", "vb-plan-card__badge"); badge.textContent = TB.plainText(plan.badge, 80); card.appendChild(badge); }
        const name = element("span", "vb-plan-card__name"); name.textContent = TB.plainText(plan.title, 160);
        const speed = element("strong", "vb-plan-card__speed"); speed.textContent = TB.plainText(plan.speed, 80);
        const price = element("div", "vb-plan-card__price"); const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(plan.price || 0)); price.innerHTML = "<b>" + TB.escapeHtml(formatted) + "</b><small>/" + TB.escapeHtml(plan.period || "mes") + "</small>";
        card.append(name, speed, price);
        if (context.props.showFeatures !== false) { const list = element("ul"); (plan.features || []).slice(0, 5).forEach(function (feature) { const item = element("li"); appendIcon(item, "check"); const span = element("span"); span.textContent = TB.plainText(feature, 240); item.appendChild(span); list.appendChild(item); }); card.appendChild(list); }
        const button = element("button", "vb-plan-card__button"); button.type = "button"; button.dataset.vbPlanId = plan.id; button.textContent = TB.plainText(context.props.ctaLabel, 120); appendIcon(button, "arrow-up-right"); card.appendChild(button); root.appendChild(card);
      });
      if (!root.children.length) { const empty = element("div", "vb-component-empty"); empty.textContent = "Nenhum plano encontrado para esta configuracao."; root.appendChild(empty); }
      shell.appendChild(root);
      return { element: shell, slots: {}, mount: "planCatalog" };
    },
  });

  registry.register({
    type: "commerce.product-grid", version: 1, label: "Grade de produtos", category: "commerce", icon: "shopping-bag",
    propsSchema: { limit: numberField("Quantidade", "data", { min: 1, max: 24 }), columns: numberField("Colunas", "layout", { min: 1, max: 6 }), showPrice: switchField("Mostrar preco", "content"), buttonLabel: textField("Botao", "content") }, slots: {}, dataContract: "catalog.products", styleCapabilities: ["spacing", "size", "responsive"],
    defaults: { props: { limit: 4, columns: 4, showPrice: true, buttonLabel: "Ver produto" }, styles: {} },
    render: function (context) { const root = element("div", "vb-product-grid"); const products = context.data.products || []; const source = products.length ? products : [{ id: "sample-router", name: "Roteador Wi-Fi 6", price: 399.9, image: "./assets/img/banner-business-fiber.jpg" }, { id: "sample-repeater", name: "Repetidor Mesh", price: 249.9, image: "./assets/img/banner-streaming-family.jpg" }]; source.slice(0, Number(context.props.limit || 4)).forEach(function (product) { const card = element("article", "vb-product-card"); const image = element("img"); image.src = TB.safeMediaUrl(product.image, "./assets/img/banner-business-fiber.jpg"); image.alt = TB.plainText(product.name, 160); image.loading = "lazy"; const title = element("h3"); title.textContent = TB.plainText(product.name, 160); card.append(image, title); if (context.props.showPrice !== false) { const price = element("strong"); price.textContent = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(product.price || 0)); card.appendChild(price); } const button = element("button"); button.type = "button"; button.disabled = !products.length; button.textContent = products.length ? TB.plainText(context.props.buttonLabel, 80) : "Roadmap e-commerce"; card.appendChild(button); root.appendChild(card); }); return { element: root, slots: {} }; },
  });

  registry.register({
    type: "navigation.header", version: 1, label: "Cabecalho", category: "navigation", icon: "panel-top",
    propsSchema: { sticky: switchField("Cabecalho fixo", "behavior"), showPhone: switchField("Mostrar telefone", "content"), showClientArea: switchField("Area do cliente", "content"), ctaLabel: textField("Texto do botao", "content") }, slots: { default: { categories: ["layout", "content", "navigation"] } }, styleCapabilities: ["spacing", "size", "background", "border", "effects", "responsive"],
    defaults: { props: { sticky: true, showPhone: true, showClientArea: true, ctaLabel: "Falar com a gente" }, styles: { base: { normal: { backgroundColor: "token.color.surface" } } } },
    render: function (context) {
      const root = element("header", "vb-header" + (context.props.sticky ? " is-sticky" : ""));
      const inner = element("div", "vb-header__inner");
      const logo = element("a", "vb-header__logo"); logo.href = "#"; const image = element("img", "vb-header__logo-light"); image.src = TB.safeMediaUrl(context.data.brand && (context.data.brand.logoDark || context.data.brand.logo), "./assets/img/fibra-lider-logo-dark.png"); image.alt = TB.plainText(context.data.brand && context.data.brand.name || "Marca", 120); const darkImage = element("img", "vb-header__logo-dark"); darkImage.src = TB.safeMediaUrl(context.data.brand && (context.data.brand.logo || context.data.brand.logoDark), "./assets/img/fibra-lider-logo.png"); darkImage.alt = ""; logo.append(image, darkImage);
      const navigation = element("nav", "vb-header__nav"); navigation.setAttribute("aria-label", "Navegacao principal"); (context.data.navigation || []).filter(function (item) { return item.visible !== false; }).forEach(function (item) { const link = element("a"); link.href = TB.safeUrl(item.href, "#"); link.textContent = TB.plainText(item.label, 120); navigation.appendChild(link); });
      const actions = element("div", "vb-header__actions");
      if (context.props.showPhone && context.data.brand && context.data.brand.phone) { const phone = element("a", "vb-header__phone"); phone.href = "tel:" + String(context.data.brand.phone).replace(/\D/g, ""); appendIcon(phone, "phone"); const span = element("span"); span.textContent = context.data.brand.phone; phone.appendChild(span); actions.appendChild(phone); }
      if (context.props.showClientArea && context.data.brand && context.data.brand.clientAreaUrl) { const account = element("a", "vb-header__account"); account.href = TB.safeUrl(context.data.brand.clientAreaUrl, "#"); account.target = "_blank"; account.rel = "noopener"; appendIcon(account, "user-round"); const span = element("span"); span.textContent = "Area do cliente"; account.appendChild(span); actions.appendChild(account); }
      if (!context.data.theme || context.data.theme.visitorThemeToggle !== false) { const theme = element("button", "vb-header__theme"); theme.type = "button"; theme.dataset.vbThemeToggle = ""; theme.setAttribute("aria-label", "Alternar tema"); appendIcon(theme, "moon"); actions.appendChild(theme); }
      const cta = element("a", "vb-header__cta"); setLink(cta, "whatsapp", context); appendIcon(cta, "message-circle"); const ctaText = element("span"); ctaText.textContent = TB.plainText(context.props.ctaLabel, 120); cta.appendChild(ctaText); actions.appendChild(cta);
      const menu = element("button", "vb-header__menu"); menu.type = "button"; menu.setAttribute("aria-label", "Abrir menu"); appendIcon(menu, "menu"); actions.appendChild(menu);
      inner.append(logo, navigation, actions); const slot = element("div", "vb-header__slot"); inner.appendChild(slot); root.appendChild(inner);
      return { element: root, slots: { default: slot }, mount: "header" };
    },
  });

  registry.register({
    type: "navigation.menu", version: 1, label: "Menu", category: "navigation", icon: "menu",
    propsSchema: { orientation: selectField("Orientacao", [option("horizontal", "Horizontal"), option("vertical", "Vertical")], "layout") }, slots: {}, dataContract: "navigation", styleCapabilities: ["layout", "typography", "spacing", "responsive"], defaults: { props: { orientation: "horizontal" }, styles: {} },
    render: function (context) { const root = element("nav", "vb-menu is-" + (context.props.orientation === "vertical" ? "vertical" : "horizontal")); (context.data.navigation || []).filter(function (item) { return item.visible !== false; }).forEach(function (item) { const link = element("a"); link.href = TB.safeUrl(item.href, "#"); link.textContent = TB.plainText(item.label, 120); root.appendChild(link); }); return { element: root, slots: {} }; },
  });

  registry.register({
    type: "navigation.footer", version: 1, label: "Rodape", category: "navigation", icon: "panel-bottom",
    propsSchema: { showSocial: switchField("Redes sociais", "content"), showContact: switchField("Contato", "content"), showCopyright: switchField("Copyright", "content") }, slots: { default: { categories: ["layout", "content", "navigation", "forms"] } }, styleCapabilities: ["spacing", "size", "background", "border", "responsive"],
    defaults: { props: { showSocial: true, showContact: true, showCopyright: true }, styles: { base: { normal: { backgroundColor: "#07111e", color: "#ffffff", paddingTop: "64px", paddingBottom: "28px" } } } },
    render: function (context) {
      const root = element("footer", "vb-footer"); const main = element("div", "vb-footer__main"); const brand = element("div", "vb-footer__brand"); const logo = element("img"); logo.src = TB.safeMediaUrl(context.data.brand && context.data.brand.logo, "./assets/img/fibra-lider-logo.png"); logo.alt = TB.plainText(context.data.brand && context.data.brand.name || "Marca", 120); const description = element("p"); description.textContent = TB.plainText(context.data.footer && context.data.footer.description || "", 500); brand.append(logo, description);
      if (context.props.showSocial) { const social = element("div", "vb-footer__social"); [["instagram", context.data.brand && context.data.brand.instagram], ["facebook", context.data.brand && context.data.brand.facebook], ["message-circle", "whatsapp"]].forEach(function (item) { if (!item[1]) return; const link = element("a"); setLink(link, item[1], context); link.setAttribute("aria-label", item[0]); appendIcon(link, item[0]); social.appendChild(link); }); brand.appendChild(social); }
      const columns = element("div", "vb-footer__columns"); (context.data.footer && context.data.footer.columns || []).forEach(function (column) { const group = element("div"); const title = element("h3"); title.textContent = TB.plainText(column.title, 120); group.appendChild(title); (column.links || []).forEach(function (item) { const link = element("a"); link.href = TB.safeUrl(item.href, "#"); link.textContent = TB.plainText(item.label, 120); group.appendChild(link); }); columns.appendChild(group); });
      const contact = element("div", "vb-footer__contact"); if (context.props.showContact && context.data.brand) { const heading = element("h3"); heading.textContent = "Fale com " + TB.plainText(context.data.brand.name, 120); contact.appendChild(heading); [["phone", context.data.brand.phone], ["mail", context.data.brand.email], ["map-pin", context.data.brand.address]].forEach(function (item) { const row = element("p"); appendIcon(row, item[0]); const span = element("span"); span.textContent = TB.plainText(item[1], 300); row.appendChild(span); contact.appendChild(row); }); }
      const slot = element("div", "vb-footer__slot"); main.append(brand, columns, contact, slot); root.appendChild(main);
      if (context.props.showCopyright) { const bottom = element("div", "vb-footer__bottom"); bottom.textContent = "\u00a9 " + new Date().getFullYear() + " " + TB.plainText(context.data.footer && context.data.footer.copyright || context.data.brand && context.data.brand.name || "", 300); root.appendChild(bottom); }
      return { element: root, slots: { default: slot } };
    },
  });

  registry.register({
    type: "domain.trust-bar", version: 1, label: "Faixa de confianca", category: "domain", icon: "badge-check",
    propsSchema: { items: textarea("Itens (icone | titulo | detalhe)", "content", { maxLength: 3000 }) }, slots: {},
    styleCapabilities: ["spacing", "size", "background", "border", "responsive"],
    defaults: { props: { items: "cable | 100% fibra optica | Conexao estavel\nrouter | Wi-Fi incluso | Equipamento em comodato\nmap-pin | Atendimento regional | Equipe perto de voce\nmessage-circle | Contato direto | Atendimento pelo WhatsApp" }, styles: {} },
    render: function (context) {
      const root = element("div", "vb-trust-bar");
      String(context.props.items || "").split("\n").filter(Boolean).slice(0, 8).forEach(function (line) {
        const parts = line.split("|").map(function (value) { return value.trim(); });
        const item = element("div", "vb-trust-item"); const badge = element("span"); appendIcon(badge, parts[0] || "badge-check"); const copy = element("div"); const title = element("strong"); title.textContent = TB.plainText(parts[1] || "Diferencial", 120); const detail = element("small"); detail.textContent = TB.plainText(parts[2] || "", 180); copy.append(title, detail); item.append(badge, copy); root.appendChild(item);
      });
      return { element: root, slots: {} };
    },
  });

  registry.register({
    type: "domain.app-grid", version: 1, label: "Aplicativos inclusos", category: "domain", icon: "app-window",
    propsSchema: { limit: numberField("Quantidade", "data", { min: 1, max: 24 }), showCategory: switchField("Mostrar categoria", "content") }, slots: {}, dataContract: "apps",
    styleCapabilities: ["spacing", "size", "responsive"], defaults: { props: { limit: 8, showCategory: true }, styles: {} },
    render: function (context) {
      const root = element("div", "vb-app-grid");
      (context.data.apps || []).slice(0, Math.max(1, Number(context.props.limit || 8))).forEach(function (app) {
        const card = element("article", "vb-app-card"); const media = element("span", "vb-app-card__logo");
        if (app.logo) { const image = element("img"); image.src = TB.safeMediaUrl(app.logo, ""); image.alt = ""; media.appendChild(image); } else media.textContent = TB.plainText(String(app.name || "A").slice(0, 2).toUpperCase(), 2);
        const copy = element("div"); const name = element("strong"); name.textContent = TB.plainText(app.name, 120); copy.appendChild(name); if (context.props.showCategory !== false) { const category = element("small"); category.textContent = TB.plainText(app.category, 120); copy.appendChild(category); } card.append(media, copy); root.appendChild(card);
      });
      return { element: root, slots: {} };
    },
  });

  registry.register({
    type: "domain.support-grid", version: 1, label: "Atalhos de atendimento", category: "domain", icon: "headset",
    propsSchema: { limit: numberField("Quantidade", "data", { min: 1, max: 12 }), buttonLabel: textField("Texto padrao do botao", "content") }, slots: {}, dataContract: "supportCards",
    styleCapabilities: ["spacing", "size", "responsive"], defaults: { props: { limit: 4, buttonLabel: "Acessar" }, styles: {} },
    render: function (context) {
      const root = element("div", "vb-support-grid");
      (context.data.supportCards || []).filter(function (item) { return item.active !== false; }).slice(0, Math.max(1, Number(context.props.limit || 4))).forEach(function (item) {
        const card = element("article", "vb-support-card"); const badge = element("span"); appendIcon(badge, item.icon || "headphones"); const title = element("h3"); title.textContent = TB.plainText(item.title, 140); const text = element("p"); text.textContent = TB.plainText(item.text, 500); const link = element("a"); setLink(link, item.type === "whatsapp" ? "whatsapp" : item.url, context); link.textContent = TB.plainText(item.label || context.props.buttonLabel, 100); appendIcon(link, "arrow-up-right"); card.append(badge, title, text, link); root.appendChild(card);
      });
      return { element: root, slots: {} };
    },
  });

  registry.register({
    type: "domain.coverage", version: 1, label: "Mapa de cobertura", category: "domain", icon: "map-pinned",
    propsSchema: { title: textField("Titulo", "content"), text: textarea("Descricao", "content"), showList: switchField("Mostrar areas", "content"), mapHeight: textField("Altura do mapa", "layout", { maxLength: 20 }) }, slots: {}, dataContract: "coverage.areas", styleCapabilities: ["spacing", "size", "background", "border", "responsive"],
    defaults: { props: { title: "Consulte a disponibilidade na sua regiao", text: "Nossa rede esta em expansao. Fale com a equipe para confirmar seu endereco.", showList: true, mapHeight: "480px" }, styles: {} },
    render: function (context) { const root = element("div", "vb-coverage"); const copy = element("div", "vb-coverage__copy"); const heading = element("h2"); heading.textContent = TB.plainText(context.props.title, 240); const text = element("p"); text.textContent = TB.plainText(context.props.text, 1200); copy.append(heading, text); if (context.props.showList) { const list = element("div", "vb-coverage__areas"); const source = window.FLCoverage ? window.FLCoverage.effectiveAreas(context.data) : context.data.regions || []; source.slice(0, 12).forEach(function (area) { const chip = element("span"); appendIcon(chip, "map-pin"); const label = element("b"); label.textContent = TB.plainText(area.name || area.city, 160); chip.appendChild(label); list.appendChild(chip); }); copy.appendChild(list); } const map = element("div", "vb-coverage__map"); map.dataset.vbCoverageMap = ""; map.style.height = /^\d+(?:px|rem|vh)$/.test(context.props.mapHeight) ? context.props.mapHeight : "480px"; root.append(copy, map); return { element: root, slots: {}, mount: "coverage" }; },
  });

  function formDefinition(type, label, icon, tag, inputType) {
    registry.register({
      type: type, version: 1, label: label, category: "forms", icon: icon,
      propsSchema: { label: textField("Rotulo", "content"), name: textField("Nome do campo", "advanced"), placeholder: textField("Placeholder", "content"), required: switchField("Obrigatorio", "behavior") },
      slots: {}, allowedParents: ["forms.form", "layout.column", "layout.container"], styleCapabilities: ["typography", "spacing", "size", "background", "border", "effects", "responsive"],
      defaults: { props: { label: label, name: TB.slug(label), placeholder: "", required: false }, styles: {} },
      render: function (context) { const wrapper = element("label", "vb-field"); const labelNode = element("span"); labelNode.textContent = TB.plainText(context.props.label, 120); const control = element(tag || "input"); if (inputType) control.type = inputType; control.name = TB.slug(context.props.name); control.placeholder = TB.plainText(context.props.placeholder, 200); control.required = Boolean(context.props.required); wrapper.append(labelNode, control); return { element: wrapper, slots: {} }; },
    });
  }

  registry.register({
    type: "forms.form", version: 1, label: "Formulario", category: "forms", icon: "clipboard-list",
    propsSchema: { submitLabel: textField("Texto do botao", "content"), successMessage: textField("Mensagem de sucesso", "content"), action: selectField("Acao", [option("lead", "Capturar lead"), option("whatsapp", "Abrir WhatsApp")], "behavior") },
    slots: { fields: { types: ["forms.input", "forms.textarea", "forms.select", "forms.checkbox", "forms.radio"], min: 1, max: 30 } }, styleCapabilities: ["layout", "spacing", "size", "background", "border", "effects", "responsive"],
    defaults: { props: { submitLabel: "Enviar", successMessage: "Dados recebidos.", action: "lead" }, styles: { base: { normal: { display: "flex", flexDirection: "column", gap: "16px" } } } },
    editor: { slotManager: { slot: "fields", label: "Campos", singular: "Campo", addType: "forms.input" } },
    compose: function (builder) { builder.append(builder.root, "forms.input", { name: "Nome", props: { label: "Seu nome", name: "name", placeholder: "Como podemos chamar voce?", required: true } }, "fields"); builder.append(builder.root, "forms.input", { name: "WhatsApp", props: { label: "WhatsApp", name: "whatsapp", placeholder: "(19) 99999-9999", required: true } }, "fields"); },
    render: function (context) { const form = element("form", "vb-form"); form.dataset.formAction = context.props.action; const fields = element("div", "vb-form__fields"); const button = element("button"); button.type = "submit"; button.textContent = TB.plainText(context.props.submitLabel, 120); form.append(fields, button); return { element: form, slots: { fields: fields }, mount: "form" }; },
  });
  formDefinition("forms.input", "Campo de texto", "text-cursor-input", "input", "text");
  formDefinition("forms.textarea", "Area de texto", "align-left", "textarea", "");
  formDefinition("forms.checkbox", "Checkbox", "square-check-big", "input", "checkbox");
  formDefinition("forms.radio", "Radio", "circle-dot", "input", "radio");
  registry.register({
    type: "forms.select", version: 1, label: "Selecao", category: "forms", icon: "list-filter",
    propsSchema: { label: textField("Rotulo", "content"), name: textField("Nome do campo", "advanced"), options: textarea("Opcoes (uma por linha)", "content"), required: switchField("Obrigatorio", "behavior") }, slots: {}, allowedParents: ["forms.form", "layout.column", "layout.container"], styleCapabilities: ["typography", "spacing", "size", "background", "border", "responsive"],
    defaults: { props: { label: "Selecione", name: "select", options: "Opcao 1\nOpcao 2", required: false }, styles: {} },
    render: function (context) { const wrapper = element("label", "vb-field"); const labelNode = element("span"); labelNode.textContent = TB.plainText(context.props.label, 120); const select = element("select"); select.name = TB.slug(context.props.name); select.required = Boolean(context.props.required); String(context.props.options || "").split("\n").filter(Boolean).slice(0, 50).forEach(function (entry) { const optionNode = element("option"); optionNode.textContent = TB.plainText(entry.trim(), 120); optionNode.value = TB.slug(entry); select.appendChild(optionNode); }); wrapper.append(labelNode, select); return { element: wrapper, slots: {} }; },
  });

  function append(documentValue, parentId, type, overrides, slotName) {
    const node = TB.createNode(type, overrides || {});
    documentValue.nodes[node.id] = node;
    const parent = documentValue.nodes[parentId];
    const slot = slotName || "default";
    if (!parent.slots[slot]) parent.slots[slot] = [];
    parent.slots[slot].push(node.id);
    return node;
  }

  function addTextStack(documentValue, parentId, content, options) {
    const config = options || {};
    const column = append(documentValue, parentId, "layout.column", { name: config.name || "Conteudo", styles: { base: { normal: { display: "flex", flexDirection: "column", gap: "18px", maxWidth: config.maxWidth || "720px" } } } });
    if (content.eyebrow) append(documentValue, column.id, "content.text", { name: "Chamada", props: { text: content.eyebrow, tag: "span" }, styles: { base: { normal: { color: config.light ? "#80d8ff" : "token.color.primary", fontSize: "14px", fontWeight: "700", textTransform: "uppercase" } } } });
    const heading = append(documentValue, column.id, "content.heading", { name: "Titulo", props: { text: content.title, level: String(config.level || 2) }, styles: { base: { normal: { color: config.light ? "#ffffff" : "token.color.text", fontSize: config.fontSize || "48px", fontWeight: "700", lineHeight: "1.08" } }, md: { normal: { fontSize: "38px" } }, sm: { normal: { fontSize: "31px" } } } });
    if (content.text) append(documentValue, column.id, "content.text", { name: "Descricao", props: { text: content.text, tag: "p" }, styles: { base: { normal: { color: config.light ? "#c5d5e6" : "token.color.muted", fontSize: "18px", lineHeight: "1.65" } } } });
    return { column: column, heading: heading };
  }

  function defaultDocument(state) {
    const source = state || {};
    const brand = source.brand || {};
    const content = source.content || {};
    const documentValue = TB.createDocument({
      documentId: "doc_home_" + TB.slug(brand.slug || "provider"), name: "Home", slug: "/",
      settings: { seo: { title: source.seo && source.seo.title || brand.name || "Home", description: source.seo && source.seo.description || "" } },
      theme: { tokens: {
        primary: source.theme && source.theme.primary || "#0874e7", secondary: source.theme && source.theme.accent || "#29d884",
        background: source.theme && source.theme.surface || "#f4f7fb", surface: source.theme && source.theme.panel || "#ffffff",
        text: source.theme && source.theme.ink || "#0a1628", muted: source.theme && source.theme.muted || "#64748b",
        success: "#16805b", danger: "#d23f48", fontHeading: (source.theme && source.theme.font || "Inter") + ", Arial, sans-serif", fontBody: (source.theme && source.theme.font || "Inter") + ", Arial, sans-serif",
        radiusSm: "8px", radiusMd: String(source.theme && source.theme.radius || 16) + "px", radiusLg: "24px", spaceXs: "8px", spaceSm: "16px", spaceMd: "28px", spaceLg: "52px", spaceXl: "88px",
      }, darkTokens: {
        primary: "#4da3ff", secondary: source.theme && source.theme.accent || "#35e59a", background: "#07111e", surface: "#101d2b", text: "#f4f8fc", muted: "#afc0d1",
        success: "#35c98b", danger: "#ff737c", fontHeading: (source.theme && source.theme.font || "Inter") + ", Arial, sans-serif", fontBody: (source.theme && source.theme.font || "Inter") + ", Arial, sans-serif",
        radiusSm: "8px", radiusMd: String(source.theme && source.theme.radius || 16) + "px", radiusLg: "24px", spaceXs: "8px", spaceSm: "16px", spaceMd: "28px", spaceLg: "52px", spaceXl: "88px",
      } },
    });
    documentValue.meta.migratedFrom = "fibra-lider-studio-state-v13";
    documentValue.meta.templateVersion = "fibra-home-v2.1";
    const root = documentValue.rootId;

    append(documentValue, root, "navigation.header", { id: "vb_header", name: "Cabecalho", props: { sticky: true, showPhone: true, showClientArea: true, ctaLabel: "Falar com a gente" } });

    const slider = append(documentValue, root, "marketing.slider", { id: "vb_hero", name: "Hero principal", props: { autoplay: source.slider ? source.slider.autoplay : true, interval: source.slider ? source.slider.interval : 6500, loop: true, arrows: true, dots: true, pauseOnHover: true, transition: "fade" } });
    const banners = (source.banners || []).filter(function (item) { return item.active !== false; }).slice(0, 6);
    (banners.length ? banners : [{ title: "Internet que acompanha sua casa", subtitle: "Fibra de verdade e atendimento regional.", image: "./assets/img/hero-family-fiber.jpg", primaryLabel: "Conhecer planos", primaryLink: "#planos", eyebrow: brand.name }]).forEach(function (banner, index) {
      const slide = append(documentValue, slider.id, "marketing.slide", { id: "vb_slide_" + (index + 1), name: banner.name || "Slide " + (index + 1), props: { image: banner.image, mobileImage: banner.mobileImage || banner.image, alt: banner.title, overlay: banner.overlay || 64, position: banner.position || "center" } }, "slides");
      const shell = append(documentValue, slide.id, "layout.container", { name: "Container do slide", styles: { base: { normal: { width: "calc(100% - 48px)", maxWidth: "1180px", marginLeft: "auto", marginRight: "auto", display: "flex", alignItems: "center", minHeight: "620px" } }, sm: { normal: { minHeight: "590px" } } } });
      const stack = addTextStack(documentValue, shell.id, { eyebrow: banner.eyebrow || brand.name, title: banner.title, text: banner.subtitle }, { name: "Conteudo do slide", light: true, level: 1, maxWidth: "720px", fontSize: "62px" }).column;
      append(documentValue, stack.id, "content.button", { name: "Botao principal", props: { text: banner.primaryLabel || "Conhecer planos", url: banner.primaryLink || "#planos", target: "self", icon: "arrow-right", iconPosition: "right" }, styles: { base: { normal: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", paddingTop: "14px", paddingRight: "22px", paddingBottom: "14px", paddingLeft: "22px", backgroundColor: "#ffffff", color: "#0758b8", borderRadius: "token.radius.md", fontWeight: "700", width: "fit-content", transitionProperty: "all", transitionDuration: "0.2s" }, hover: { transform: "translateY(-2px)", backgroundColor: "token.color.secondary", color: "#07111e" } } } });
    });

    const proof = append(documentValue, root, "layout.section", { id: "vb_proof", name: "Barra de confianca", styles: { base: { normal: { paddingTop: "28px", paddingBottom: "28px", backgroundColor: "#07111e" } } } });
    const proofContainer = append(documentValue, proof.id, "layout.container", { name: "Indicadores", styles: { base: { normal: { width: "calc(100% - 48px)", maxWidth: "1180px", marginLeft: "auto", marginRight: "auto", display: "grid", gridColumns: "repeat(4, minmax(0, 1fr))", gap: "18px" } }, md: { normal: { gridColumns: "repeat(2, minmax(0, 1fr))" } }, sm: { normal: { gridColumns: "repeat(1, minmax(0, 1fr))" } } } });
    [["cable", "100% fibra optica"], ["router", "Wi-Fi em comodato"], ["map-pin", "Atendimento regional"], ["message-circle", "Contato direto"]].forEach(function (item) { const row = append(documentValue, proofContainer.id, "layout.row", { name: item[1], styles: { base: { normal: { display: "flex", flexDirection: "row", gap: "10px", alignItems: "center" } }, sm: { normal: { flexDirection: "row" } } } }); append(documentValue, row.id, "content.icon", { props: { name: item[0] }, styles: { base: { normal: { color: "token.color.secondary" } } } }); append(documentValue, row.id, "content.text", { props: { text: item[1], tag: "span" }, styles: { base: { normal: { color: "#ffffff", fontSize: "15px", fontWeight: "700" } } } }); });

    const plans = append(documentValue, root, "layout.section", { id: "vb_planos", name: "Planos", props: { anchor: "planos" }, styles: { base: { normal: { paddingTop: "token.space.xl", paddingBottom: "token.space.xl", backgroundColor: "token.color.background" } } } });
    const plansContainer = append(documentValue, plans.id, "layout.container", { name: "Container dos planos" });
    addTextStack(documentValue, plansContainer.id, { eyebrow: content.plansEyebrow || "Planos residenciais", title: content.plansTitle || "Escolha sua velocidade", text: content.plansText || "Planos para todos os momentos." }, { name: "Cabecalho dos planos", maxWidth: "760px" });
    append(documentValue, plansContainer.id, "layout.spacer", { props: { height: "34px" } });
    append(documentValue, plansContainer.id, "commerce.plan-grid", { id: "vb_plan_grid", name: "Lista de planos", props: { categoryId: "internet", limit: 9, showFilters: true, showCoupon: true, showFeatures: true, ctaLabel: "Quero este plano" } });

    const benefits = append(documentValue, root, "layout.section", { id: "vb_benefits", name: "Beneficios", styles: { base: { normal: { paddingTop: "token.space.xl", paddingBottom: "token.space.xl", backgroundColor: "token.color.surface" } } } });
    const benefitsContainer = append(documentValue, benefits.id, "layout.container", { name: "Container de beneficios" });
    addTextStack(documentValue, benefitsContainer.id, { eyebrow: content.benefitsEyebrow || "Feita para a vida real", title: content.benefitsTitle || "Mais estabilidade em cada momento", text: content.benefitsText || "Conexao preparada para a sua rotina." }, { name: "Cabecalho de beneficios", maxWidth: "760px" });
    append(documentValue, benefitsContainer.id, "layout.spacer", { props: { height: "34px" } });
    const benefitGrid = append(documentValue, benefitsContainer.id, "layout.grid", { name: "Grade de beneficios", props: { columns: 4 }, styles: { base: { normal: { display: "grid", gridColumns: "repeat(4, minmax(0, 1fr))", gap: "18px" } }, md: { normal: { gridColumns: "repeat(2, minmax(0, 1fr))" } }, sm: { normal: { gridColumns: "repeat(1, minmax(0, 1fr))" } } } });
    (source.benefits || []).slice(0, 4).forEach(function (benefit) { const card = append(documentValue, benefitGrid.id, "layout.column", { name: benefit.title, styles: { base: { normal: { display: "flex", flexDirection: "column", gap: "14px", paddingTop: "26px", paddingRight: "24px", paddingBottom: "26px", paddingLeft: "24px", backgroundColor: "token.color.background", borderRadius: "token.radius.md", borderWidth: "1px", borderStyle: "solid", borderColor: "#dce6f0" } } } }); append(documentValue, card.id, "content.icon", { props: { name: benefit.icon || "badge-check" }, styles: { base: { normal: { color: "token.color.primary" } } } }); append(documentValue, card.id, "content.heading", { props: { text: benefit.title, level: "3" }, styles: { base: { normal: { color: "token.color.text", fontFamily: "token.font.heading", fontSize: "21px", fontWeight: "700", lineHeight: "1.2" } }, md: { normal: { fontSize: "21px" } }, sm: { normal: { fontSize: "20px" } } } }); append(documentValue, card.id, "content.text", { props: { text: benefit.text, tag: "p" } }); });

    const entertainment = append(documentValue, root, "layout.section", { id: "vb_apps", name: "Entretenimento e educacao", props: { anchor: "entretenimento" }, styles: { base: { normal: { paddingTop: "token.space.xl", paddingBottom: "token.space.xl", backgroundColor: "#07111e" } } } });
    const entertainmentContainer = append(documentValue, entertainment.id, "layout.container", { name: "Container de aplicativos" });
    addTextStack(documentValue, entertainmentContainer.id, { eyebrow: content.appsEyebrow || "Muito alem da conexao", title: content.appsTitle || "Conteudo para toda a familia", text: content.appsText || "Entretenimento, educacao e seguranca reunidos no seu plano." }, { name: "Cabecalho de aplicativos", light: true, maxWidth: "760px" });
    append(documentValue, entertainmentContainer.id, "layout.spacer", { props: { height: "34px" } });
    append(documentValue, entertainmentContainer.id, "domain.app-grid", { id: "vb_app_grid", name: "Aplicativos inclusos", props: { limit: 8, showCategory: true } });

    const business = append(documentValue, root, "layout.section", { id: "vb_business", name: "Empresas", styles: { base: { normal: { paddingTop: "token.space.xl", paddingBottom: "token.space.xl", backgroundColor: "#07111e" } } } });
    const businessContainer = append(documentValue, business.id, "layout.container", { name: "Fibra para empresas" });
    const businessRow = append(documentValue, businessContainer.id, "layout.row", { name: "Duas colunas", styles: { base: { normal: { display: "flex", flexDirection: "row", gap: "52px", alignItems: "center" } }, sm: { normal: { flexDirection: "column" } } } });
    const businessCopy = addTextStack(documentValue, businessRow.id, { eyebrow: content.businessEyebrow || "Fibra para empresas", title: content.businessTitle || "Conectividade para sua empresa", text: content.businessText || "Projetos sob medida e atendimento regional." }, { light: true, name: "Conteudo empresarial", maxWidth: "560px" }).column;
    append(documentValue, businessCopy.id, "content.button", { props: { text: "Solicitar proposta", url: "whatsapp", target: "blank", icon: "message-circle", iconPosition: "left" } });
    append(documentValue, businessRow.id, "content.image", { name: "Imagem empresarial", props: { src: "./assets/img/banner-business-fiber.jpg", mobileSrc: "", alt: "Conectividade para empresas", caption: "", loading: "lazy", focalX: 50, focalY: 50 }, styles: { base: { normal: { width: "100%", height: "460px", objectFit: "cover", borderRadius: "token.radius.lg" } }, sm: { normal: { height: "320px" } } } });

    const coverage = append(documentValue, root, "layout.section", { id: "vb_coverage", name: "Cobertura", props: { anchor: "cobertura" }, styles: { base: { normal: { paddingTop: "token.space.xl", paddingBottom: "token.space.xl", backgroundColor: "token.color.background" } } } });
    const coverageContainer = append(documentValue, coverage.id, "layout.container", { name: "Container de cobertura" });
    append(documentValue, coverageContainer.id, "domain.coverage", { name: "Mapa e areas", props: { title: content.coverageTitle || "Consulte a disponibilidade na sua regiao", text: content.coverageText || "Nossa rede esta em expansao.", showList: true, mapHeight: "480px" } });

    const social = append(documentValue, root, "layout.section", { id: "vb_social", name: "Prova social", styles: { base: { normal: { paddingTop: "token.space.xl", paddingBottom: "token.space.xl", backgroundColor: "token.color.surface" } } } });
    const socialContainer = append(documentValue, social.id, "layout.container", { name: "Depoimentos e FAQ" });
    addTextStack(documentValue, socialContainer.id, { eyebrow: content.testimonialEyebrow || "Quem usa recomenda", title: content.testimonialTitle || "Uma internet proxima de quem conecta", text: "Experiencias reais de clientes da regiao." }, { maxWidth: "720px" });
    append(documentValue, socialContainer.id, "layout.spacer", { props: { height: "32px" } });
    append(documentValue, socialContainer.id, "marketing.testimonials", { name: "Depoimentos", props: { limit: 3, showCity: true } });
    append(documentValue, socialContainer.id, "layout.spacer", { props: { height: "72px" } });
    addTextStack(documentValue, socialContainer.id, { eyebrow: content.faqEyebrow || "Duvidas frequentes", title: content.faqTitle || "Respostas antes de contratar", text: content.faqText || "" }, { maxWidth: "720px" });
    append(documentValue, socialContainer.id, "layout.spacer", { props: { height: "28px" } });
    append(documentValue, socialContainer.id, "marketing.faq", { name: "Perguntas", props: { limit: 6, firstOpen: true } });

    const support = append(documentValue, root, "layout.section", { id: "vb_support", name: "Atendimento", props: { anchor: "atendimento" }, styles: { base: { normal: { paddingTop: "token.space.xl", paddingBottom: "token.space.xl", backgroundColor: "#07111e" } } } });
    const supportContainer = append(documentValue, support.id, "layout.container", { name: "Container de atendimento" });
    addTextStack(documentValue, supportContainer.id, { eyebrow: content.supportEyebrow || "Estamos por perto", title: content.supportTitle || "Atendimento para cada momento", text: content.supportText || "Escolha o canal certo e fale com a nossa equipe." }, { name: "Cabecalho de atendimento", light: true, maxWidth: "760px" });
    append(documentValue, supportContainer.id, "layout.spacer", { props: { height: "34px" } });
    append(documentValue, supportContainer.id, "domain.support-grid", { id: "vb_support_grid", name: "Canais de atendimento", props: { limit: 4, buttonLabel: "Acessar" } });

    const final = append(documentValue, root, "layout.section", { id: "vb_final", name: "Chamada final", styles: { base: { normal: { paddingTop: "52px", paddingBottom: "52px", backgroundColor: "token.color.background" } } } });
    const finalContainer = append(documentValue, final.id, "layout.container", { name: "Container final" });
    const cta = append(documentValue, finalContainer.id, "marketing.cta", { name: "CTA final" });
    const ctaRow = append(documentValue, cta.id, "layout.row", { name: "Conteudo e acao", styles: { base: { normal: { display: "flex", flexDirection: "row", gap: "28px", alignItems: "center", justifyContent: "space-between" } }, sm: { normal: { flexDirection: "column", alignItems: "flex-start" } } } });
    addTextStack(documentValue, ctaRow.id, { eyebrow: content.finalEyebrow || brand.name, title: content.finalTitle || "Pronto para navegar sem limites?", text: content.finalText || "Consulte a cobertura e encontre o plano ideal." }, { light: true, name: "Mensagem final", maxWidth: "720px", fontSize: "42px" });
    append(documentValue, ctaRow.id, "content.button", { props: { text: "Falar no WhatsApp", url: "whatsapp", target: "blank", icon: "message-circle", iconPosition: "right" }, styles: { base: { normal: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", paddingTop: "14px", paddingRight: "22px", paddingBottom: "14px", paddingLeft: "22px", backgroundColor: "#ffffff", color: "#0758b8", borderRadius: "token.radius.md", fontWeight: "700", width: "fit-content" }, hover: { transform: "translateY(-2px)", backgroundColor: "token.color.secondary" } } } });

    append(documentValue, root, "navigation.footer", { id: "vb_footer", name: "Rodape", props: { showSocial: true, showContact: true, showCopyright: true } });
    return documentValue;
  }

  function legacyPageDocument(state, page) {
    const source = state || {};
    const item = page || {};
    const route = "/" + String(item.slug || "pagina").replace(/^\/+|\/+$/g, "");
    const documentValue = TB.createDocument({
      documentId: "vb_page_" + TB.slug(item.id || item.slug || item.title),
      rootId: "vb_root_" + TB.slug(item.id || item.slug || item.title),
      name: item.title || "Pagina",
      slug: route,
      settings: { seo: { title: item.title || "Pagina", description: item.description || "" }, sourcePageId: item.id || "" },
      theme: defaultDocument(source).theme,
    });
    const root = documentValue.rootId;
    append(documentValue, root, "navigation.header", { name: "Cabecalho global", meta: { locked: true } });
    (item.blocks || []).filter(function (block) { return block.visible !== false; }).forEach(function (block, index) {
      const isHero = block.type === "hero";
      const isCallout = ["callout", "cta", "document"].includes(block.type);
      const section = append(documentValue, root, "layout.section", {
        name: block.title || "Secao " + (index + 1),
        styles: { base: { normal: { paddingTop: isHero ? "96px" : "72px", paddingBottom: isHero ? "96px" : "72px", backgroundColor: isHero ? "#07111e" : isCallout ? "#eaf4ff" : "token.color.background" } }, sm: { normal: { paddingTop: "52px", paddingBottom: "52px" } } },
      });
      const container = append(documentValue, section.id, "layout.container", { name: "Container" });
      const stack = addTextStack(documentValue, container.id, { eyebrow: block.eyebrow || "", title: block.title || "", text: block.text || "" }, { light: isHero, fontSize: isHero ? "56px" : "40px", maxWidth: isHero ? "820px" : "900px", level: isHero ? 1 : 2 });
      if (block.type === "image" && block.url) append(documentValue, stack.column.id, "content.image", { props: { src: block.url, mobileSrc: "", alt: block.label || block.title || "Imagem", caption: "", loading: "lazy", focalX: 50, focalY: 50 } });
      if (["cta", "document"].includes(block.type) && block.label) append(documentValue, stack.column.id, "content.button", { props: { text: block.label, url: block.url || "#", target: /^https?:/i.test(block.url || "") ? "blank" : "self", icon: "arrow-up-right", iconPosition: "right", ariaLabel: "" } });
    });
    append(documentValue, root, "navigation.footer", { name: "Rodape global", meta: { locked: true } });
    documentValue.meta.migratedFrom = "legacy-page:" + (item.id || item.slug || "unknown");
    return documentValue;
  }

  TB.sanitizeRichText = sanitizeRichText;
  TB.defaultDocument = defaultDocument;
  TB.legacyPageDocument = legacyPageDocument;
  TB.setDocumentFactory(defaultDocument);
  TB.setPageDocumentFactory(legacyPageDocument);
})();

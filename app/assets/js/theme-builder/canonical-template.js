(function () {
  "use strict";

  const TB = window.FLThemeBuilder;
  if (!TB) throw new Error("Theme Builder Core precisa ser carregado antes do template canonico.");

  const registry = TB.registry;
  const option = function (value, label) { return { value: value, label: label }; };
  const text = function (label, group, extra) { return { type: "string", control: "text", label: label, group: group || "content", maxLength: 500, ...(extra || {}) }; };
  const textarea = function (label, group, extra) { return { type: "string", control: "textarea", label: label, group: group || "content", maxLength: 5000, ...(extra || {}) }; };
  const toggle = function (label, group) { return { type: "boolean", control: "switch", label: label, group: group || "content" }; };
  const number = function (label, group, extra) { return { type: "number", control: "number", label: label, group: group || "content", ...(extra || {}) }; };
  const image = function (label, group, help) { return { type: "image", control: "asset", label: label, group: group || "content", help: help || "Imagens sao comprimidas antes de entrar na biblioteca." }; };
  const select = function (label, values, group) { return { type: "string", control: "select", label: label, group: group || "content", options: values }; };
  const esc = TB.escapeHtml;

  function el(tag, className) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function icon(name) {
    return '<i data-lucide="' + esc(String(name || "sparkles").replace(/[^a-z0-9-]/gi, "")) + '"></i>';
  }

  function htmlElement(tag, className, html) {
    const node = el(tag, className);
    node.innerHTML = html;
    return node;
  }

  function safeLink(value, context) {
    if (value === "whatsapp") {
      const brand = context.data.brand || {};
      const message = String(context.data.whatsapp && context.data.whatsapp.floatingMessage || "Ola {brand}, vim pelo site e preciso de atendimento.").replace(/\{brand\}/g, brand.name || "a empresa");
      return window.FL ? FL.whatsappLink(brand.whatsapp, message) : "#";
    }
    return TB.safeUrl(value, "#");
  }

  function formatCurrency(value) {
    return window.FL ? FL.formatCurrency(value) : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
  }

  function sectionDefinition(config) {
    registry.register({
      type: config.type,
      version: 1,
      label: config.label,
      category: config.category || "domain",
      icon: config.icon || "panel-top",
      propsSchema: config.propsSchema || {},
      slots: config.slots || {},
      styleCapabilities: ["layout", "spacing", "size", "background", "border", "effects", "responsive"],
      defaults: { props: config.defaults || {}, styles: {} },
      allowedParents: config.allowedParents,
      editor: config.editor,
      compose: config.compose,
      render: function (context) {
        const output = config.render(context);
        const blockId = config.blockId || ({ "template.hero": "hero", "template.proof": "proof", "template.plans": "plans", "template.benefits": "benefits", "template.apps": "apps", "template.business": "business", "template.coverage": "coverage", "template.testimonials": "testimonials", "template.faq": "faq", "template.support": "support", "template.final-cta": "final" })[config.type];
        const block = blockId && (context.data.pageBlocks || []).find(function (item) { return item.id === blockId; });
        if (output && output.element && block) {
          output.element.hidden = block.visible === false;
          output.element.dataset.tone = block.tone || "light";
          output.element.dataset.spacing = block.spacing || "normal";
          output.element.dataset.container = block.container || "normal";
          output.element.dataset.align = block.alignment || "left";
          output.element.dataset.hideMobile = String(Boolean(block.hideMobile));
          output.element.dataset.hideDesktop = String(Boolean(block.hideDesktop));
          const background = TB.safeMediaUrl(block.backgroundImage, "");
          output.element.classList.toggle("has-builder-background", Boolean(background));
          output.element.style.backgroundImage = background ? 'url("' + background.replace(/["\n\r]/g, "") + '")' : "";
          output.element.style.backgroundPosition = block.backgroundPosition || "center";
        }
        return output;
      },
    });
  }

  sectionDefinition({
    type: "template.header", label: "Cabecalho padrao", category: "navigation", icon: "panel-top",
    propsSchema: {
      serviceText: text("Texto regional", "content"), ctaLabel: text("Botao principal", "content"),
      showServiceStrip: toggle("Mostrar faixa superior", "content"), sticky: toggle("Cabecalho fixo", "behavior"),
      logoVariant: select("Logo no cabecalho", [option("auto", "Automatico pelo tema"), option("dark", "Escuro para fundo claro"), option("light", "Claro para fundo escuro")], "style"),
    },
    defaults: { serviceText: "Internet fibra optica em Sumare e regiao", ctaLabel: "Falar com a gente", showServiceStrip: true, sticky: true, logoVariant: "auto" },
    render: function (context) {
      const brand = context.data.brand || {};
      const navigation = (context.data.navigation || []).filter(function (item) { return item.visible !== false; }).map(function (item) { return '<a href="' + esc(TB.safeUrl(item.href, "#")) + '">' + esc(item.label) + '</a>'; }).join("");
      const root = htmlElement("header", "site-header canonical-site-header" + (context.props.sticky === false ? " is-static" : ""),
        (context.props.showServiceStrip === false ? "" : '<div class="service-strip"><div class="shell service-strip__inner"><p>' + icon("map-pin") + " " + esc(context.props.serviceText) + '</p><div class="service-strip__links"><a href="tel:' + esc(String(brand.phone || "").replace(/\D/g, "")) + '">' + icon("phone") + " " + esc(brand.phone) + '</a><a href="' + esc(TB.safeUrl(brand.clientAreaUrl, "#")) + '" target="_blank" rel="noopener">' + icon("user-round") + ' Area do cliente</a></div></div></div>') +
        '<div class="nav-shell shell"><a class="site-logo" href="#topo" aria-label="' + esc(brand.name || "Marca") + ' - inicio"><img src="' + esc(TB.safeMediaUrl(brand.logoDark || brand.logo, "./assets/img/fibra-lider-logo-dark.png")) + '" alt="' + esc(brand.name || "Marca") + '"></a><nav class="site-nav" aria-label="Navegacao principal">' + navigation + '</nav><div class="header-actions"><button class="icon-button theme-toggle" data-canonical-theme-toggle type="button" aria-label="Alternar tema">' + icon("moon") + '</button><a class="button button--primary header-cta" href="' + esc(safeLink("whatsapp", context)) + '" target="_blank" rel="noopener">' + icon("message-circle") + '<span>' + esc(context.props.ctaLabel) + '</span></a><button class="icon-button mobile-menu-toggle" data-canonical-menu type="button" aria-label="Abrir menu" aria-expanded="false">' + icon("menu") + '</button></div></div>');
      root.dataset.logoVariant = ["auto", "dark", "light"].includes(context.props.logoVariant) ? context.props.logoVariant : "auto";
      return { element: root, slots: {}, mount: "canonicalHeader" };
    },
  });

  sectionDefinition({
    type: "template.hero", label: "Hero principal", category: "marketing", icon: "gallery-horizontal",
    propsSchema: {
      mode: select("Tipo do destaque", [option("slider", "Slider"), option("banner", "Banner estatico")], "internal"),
      bannerId: text("Banner exibido", "internal", { maxLength: 120 }),
      autoplay: { ...toggle("Rotacao automatica", "behavior"), visibleWhen: { prop: "mode", equals: "slider" } }, interval: { ...number("Intervalo (ms)", "behavior", { min: 3500, max: 20000 }), visibleWhen: { prop: "mode", equals: "slider" } },
      pauseOnHover: { ...toggle("Pausar ao passar o mouse", "behavior"), visibleWhen: { prop: "mode", equals: "slider" } }, showArrows: { ...toggle("Mostrar setas", "content"), visibleWhen: { prop: "mode", equals: "slider" } }, showDots: { ...toggle("Mostrar indicadores", "content"), visibleWhen: { prop: "mode", equals: "slider" } },
    },
    slots: { slides: { types: ["template.hero-slide"], min: 1, max: 12 } },
    defaults: { mode: "slider", bannerId: "", autoplay: true, interval: 6500, pauseOnHover: true, showArrows: true, showDots: true },
    editor: { slotManager: { slot: "slides", label: "Banners do hero", singular: "Banner", addType: "template.hero-slide", imageProp: "image", variant: "hero" } },
    compose: function (builder) { builder.append(builder.root, "template.hero-slide", { name: "Banner 1" }, "slides"); },
    render: function (context) {
      const root = htmlElement("section", "hero-slider page-section canonical-hero", '<div class="canonical-hero-slides"></div><div class="hero-controls shell"><div class="hero-dots" data-canonical-dots aria-label="Selecionar destaque"></div><div class="hero-arrows" data-canonical-arrows><button class="icon-button icon-button--glass" data-slider-previous type="button" aria-label="Destaque anterior">' + icon("arrow-left") + '</button><button class="icon-button icon-button--glass" data-slider-next type="button" aria-label="Proximo destaque">' + icon("arrow-right") + '</button></div></div>');
      root.dataset.autoplay = String(context.props.autoplay !== false);
      root.dataset.interval = String(Math.max(3500, Number(context.props.interval || 6500)));
      root.dataset.showArrows = String(context.props.showArrows !== false);
      root.dataset.showDots = String(context.props.showDots !== false);
      root.dataset.heroMode = context.props.mode === "banner" ? "banner" : "slider";
      root.dataset.bannerId = String(context.props.bannerId || "").replace(/[^a-zA-Z0-9_-]/g, "");
      root.dataset.pauseOnHover = String(context.props.pauseOnHover !== false);
      return { element: root, slots: { slides: root.querySelector(".canonical-hero-slides") }, mount: "canonicalSlider" };
    },
  });

  sectionDefinition({
    type: "template.hero-slide", label: "Banner do hero", category: "marketing", icon: "panel-top", hidden: true,
    allowedParents: ["template.hero"],
    propsSchema: {
      name: text("Nome interno", "content"), eyebrow: text("Chamada superior", "content"), title: text("Titulo", "content"), subtitle: textarea("Descricao", "content"),
      image: image("Imagem desktop", "content", "Recomendado: 1920 x 900 px."), mobileImage: image("Imagem mobile", "responsive", "Recomendado: 900 x 1200 px."), alt: text("Texto alternativo da imagem", "content", { maxLength: 240 }),
      primaryLabel: text("Botao principal", "content"), primaryLink: text("Destino principal", "content"), secondaryLabel: text("Botao secundario", "content"), secondaryLink: text("Destino secundario", "content"),
      badge: text("Selo do plano", "content"), position: select("Enquadramento", [option("left", "Esquerda"), option("center", "Centro"), option("right", "Direita")], "style"), overlay: number("Overlay (%)", "style", { min: 0, max: 90 }),
    },
    defaults: { name: "Novo banner", eyebrow: "Fibra optica na sua regiao", title: "Internet que acompanha a sua casa.", subtitle: "Conexao estavel e atendimento regional.", image: "./assets/img/hero-family-fiber.jpg", mobileImage: "", alt: "Familia conectada a internet fibra optica", primaryLabel: "Conhecer planos", primaryLink: "#planos", secondaryLabel: "Consultar cobertura", secondaryLink: "#cobertura", badge: "Mais contratado", position: "center", overlay: 64 },
    render: function (context) {
      const plans = (context.data.plans || []).filter(function (plan) { return plan.active !== false; });
      const featured = plans.find(function (plan) { return plan.featured; }) || plans[0];
      const speed = featured ? String(featured.speed || "").split(/\s+/) : [];
      const alt = esc(context.props.alt || context.props.title || "Destaque da empresa");
      const picture = context.props.mobileImage ? '<picture><source media="(max-width:767px)" srcset="' + esc(TB.safeMediaUrl(context.props.mobileImage, "")) + '"><img class="hero-slide__image hero-slide__image--' + esc(context.props.position) + '" src="' + esc(TB.safeMediaUrl(context.props.image, "./assets/img/hero-family-fiber.jpg")) + '" alt="' + alt + '"></picture>' : '<img class="hero-slide__image hero-slide__image--' + esc(context.props.position) + '" src="' + esc(TB.safeMediaUrl(context.props.image, "./assets/img/hero-family-fiber.jpg")) + '" alt="' + alt + '">';
      const primaryButton = context.props.primaryLabel ? '<a class="button button--primary button--large" href="' + esc(safeLink(context.props.primaryLink, context)) + '">' + esc(context.props.primaryLabel) + icon("arrow-right") + '</a>' : "";
      const secondaryButton = context.props.secondaryLabel ? '<a class="button button--glass button--large" href="' + esc(safeLink(context.props.secondaryLink, context)) + '">' + esc(context.props.secondaryLabel) + '</a>' : "";
      const actions = primaryButton || secondaryButton ? '<div class="hero-actions">' + primaryButton + secondaryButton + '</div>' : "";
      const root = htmlElement("article", "hero-slide", picture + '<div class="hero-slide__shade"></div><div class="shell hero-slide__content"><div class="hero-copy"><span class="hero-eyebrow">' + icon("radio") + esc(context.props.eyebrow) + '</span><h1>' + esc(context.props.title) + '</h1><p>' + esc(context.props.subtitle) + '</p>' + actions + '<div class="hero-proof"><span>' + icon("circle-check") + '100% fibra optica</span><span>' + icon("circle-check") + 'Suporte regional</span></div></div>' + (featured ? '<aside class="hero-plan-chip"><span>' + esc(context.props.badge) + '</span><strong>' + esc(speed[0]) + ' <small>' + esc(speed.slice(1).join(" ")) + '</small></strong><p>a partir de <b>' + esc(formatCurrency(featured.price)) + '/' + esc(featured.period || "mes") + '</b></p></aside>' : "") + '</div>');
      root.style.setProperty("--hero-overlay", String(Math.min(.9, Math.max(0, Number(context.props.overlay || 0) / 100))));
      return { element: root, slots: {} };
    },
  });

  sectionDefinition({
    type: "template.proof", label: "Faixa de diferenciais", icon: "badge-check",
    propsSchema: { items: textarea("Itens (icone | valor | texto)", "content") },
    defaults: { items: "cable | 100% | fibra optica\nrouter | Wi-Fi | em comodato\nmap-pin | Regional | atendimento proximo\nmessage-circle | Direto | pelo WhatsApp" },
    render: function (context) {
      const items = String(context.props.items || "").split("\n").filter(Boolean).slice(0, 6).map(function (line) { const part = line.split("|").map(function (value) { return value.trim(); }); return '<div class="proof-item"><span class="proof-icon">' + icon(part[0]) + '</span><div><strong>' + esc(part[1]) + '</strong><small>' + esc(part[2]) + '</small></div></div>'; }).join("");
      return { element: htmlElement("section", "proof-band page-section", '<div class="shell proof-grid">' + items + '</div>'), slots: {} };
    },
  });

  function planCard(plan) {
    const price = formatCurrency(plan.price).replace("R$", "").trim().split(",");
    return '<article class="plan-card' + (plan.featured ? " plan-card--featured" : "") + '" data-canonical-plan data-plan-category="' + esc(plan.categoryId || "internet") + '" data-plan-price="' + esc(plan.price) + '" data-plan-id-value="' + esc(plan.id) + '"><div class="plan-card__top"><div><span>' + esc(plan.title) + '</span><strong>' + esc(plan.speed) + '</strong></div>' + (plan.badge ? '<em>' + esc(plan.badge) + '</em>' : "") + '</div><div class="plan-promotion" hidden></div><span class="plan-old-price" hidden></span><div class="plan-price"><small>R$</small><b>' + esc(price[0]) + '</b><span>,' + esc(price[1] || "00") + '<small>/' + esc(plan.period || "mes") + '</small></span></div><small class="plan-price-after" hidden></small><p class="plan-note">' + esc(plan.note) + '</p><ul>' + (plan.features || []).map(function (feature) { return '<li>' + icon("check") + esc(feature) + '</li>'; }).join("") + '</ul><button class="button ' + (plan.featured ? "button--primary" : "button--outline") + ' button--block plan-cta" type="button" data-vb-plan-id="' + esc(plan.id) + '">Quero este plano ' + icon("arrow-up-right") + '</button></article>';
  }

  sectionDefinition({
    type: "template.plans", label: "Planos residenciais", icon: "badge-dollar-sign",
    propsSchema: { eyebrow: text("Chamada", "content"), title: text("Titulo", "content"), description: textarea("Descricao", "content"), initialCategory: text("Categoria inicial", "data"), visibleLimit: number("Planos iniciais", "content", { min: 1, max: 12 }), showCoupon: toggle("Mostrar cupom", "content") },
    defaults: { eyebrow: "Planos residenciais", title: "Escolha sua velocidade. O resto e com a gente.", description: "Compare os planos mais contratados e fale direto com a equipe comercial pelo WhatsApp.", initialCategory: "internet", visibleLimit: 3, showCoupon: true },
    render: function (context) {
      const categories = (context.data.categories || []).filter(function (item) { return item.active !== false; });
      const plans = (context.data.plans || []).filter(function (item) { return item.active !== false; });
      const filters = categories.map(function (category) { const count = plans.filter(function (plan) { return plan.categoryId === category.id; }).length; return '<button class="filter-tab' + (category.id === context.props.initialCategory ? " is-active" : "") + '" type="button" role="tab" data-canonical-category="' + esc(category.id) + '">' + esc(category.name) + '<span>' + count + '</span></button>'; }).join("");
      const coupon = context.props.showCoupon === false ? "" : '<div class="coupon-activation" data-canonical-coupon><div class="coupon-activation__intro"><span>' + icon("ticket-percent") + '</span><div><strong>Tem um cupom?</strong><small>Ative o codigo para conferir os planos participantes.</small></div></div><form><label class="sr-only">Codigo do cupom</label><input name="coupon" autocomplete="off" maxlength="24" placeholder="Digite o codigo"><button class="button button--dark" type="submit">Aplicar</button></form><div class="coupon-activation__status" hidden><span></span><button class="icon-button" type="button" data-canonical-coupon-clear aria-label="Remover cupom">' + icon("x") + '</button></div></div>';
      const root = htmlElement("section", "section plans-section page-section", '<div class="shell"><div class="section-heading section-heading--split"><div><span class="eyebrow">' + esc(context.props.eyebrow) + '</span><h2>' + esc(context.props.title) + '</h2></div><p>' + esc(context.props.description) + '</p></div><div class="filter-tabs" role="tablist" aria-label="Tipos de plano">' + filters + '</div>' + coupon + '<div class="plans-grid">' + plans.map(planCard).join("") + '</div><div class="plans-footer"><p>Todos os planos estao sujeitos a consulta de viabilidade e condicoes comerciais.</p><button class="text-button" data-canonical-show-all type="button">Ver todos os planos ' + icon("arrow-right") + '</button></div></div>');
      root.dataset.initialCategory = context.props.initialCategory || (categories[0] && categories[0].id) || "all";
      root.dataset.visibleLimit = String(Math.max(1, Number(context.props.visibleLimit || 3)));
      return { element: root, slots: {}, mount: "canonicalPlans" };
    },
  });

  sectionDefinition({
    type: "template.benefits", label: "Beneficios", icon: "sparkles",
    propsSchema: { eyebrow: text("Chamada", "content"), title: text("Titulo", "content"), description: textarea("Descricao", "content"), buttonLabel: text("Botao", "content") },
    defaults: { eyebrow: "Feita para a vida real", title: "Mais estabilidade em cada momento do seu dia.", description: "Da primeira reuniao da manha ao ultimo episodio da noite, sua casa continua conectada.", buttonLabel: "Consultar minha rua" },
    render: function (context) {
      const rows = (context.data.benefits || []).map(function (item, index) { return '<article class="benefit-row"><span class="benefit-number">0' + (index + 1) + '</span><span class="benefit-icon">' + icon(item.icon) + '</span><div><h3>' + esc(item.title) + '</h3><p>' + esc(item.text) + '</p></div></article>'; }).join("");
      return { element: htmlElement("section", "section benefits-section page-section", '<div class="shell benefits-layout"><div class="benefits-copy"><span class="eyebrow">' + esc(context.props.eyebrow) + '</span><h2>' + esc(context.props.title) + '</h2><p>' + esc(context.props.description) + '</p><a class="button button--dark" href="#cobertura">' + esc(context.props.buttonLabel) + icon("arrow-right") + '</a></div><div class="benefit-list">' + rows + '</div></div>'), slots: {} };
    },
  });

  sectionDefinition({
    type: "template.apps", label: "Entretenimento e aplicativos", icon: "app-window",
    propsSchema: { eyebrow: text("Chamada", "content"), title: text("Titulo", "content"), description: textarea("Descricao", "content"), buttonLabel: text("Botao", "content") },
    defaults: { eyebrow: "Conteudo para todos", title: "Internet e entretenimento em um so plano.", description: "Filmes, series, musica, esportes, leitura e seguranca digital para completar sua experiencia.", buttonLabel: "Ver combos" },
    render: function (context) {
      const cards = (context.data.apps || []).map(function (item, index) { const logo = TB.safeMediaUrl(item.logo, ""); return '<div class="app-pill app-pill--' + ((index % 4) + 1) + '"><span class="app-pill__logo">' + (logo ? '<img src="' + esc(logo) + '" alt="">' : esc(String(item.name || "AP").slice(0, 2))) + '</span><div><strong>' + esc(item.name) + '</strong><small>' + esc(item.category) + '</small></div></div>'; }).join("");
      return { element: htmlElement("section", "section entertainment-section page-section", '<div class="shell entertainment-layout"><div class="entertainment-copy"><span class="eyebrow eyebrow--light">' + esc(context.props.eyebrow) + '</span><h2>' + esc(context.props.title) + '</h2><p>' + esc(context.props.description) + '</p><a class="button button--light" href="#planos">' + esc(context.props.buttonLabel) + icon("arrow-right") + '</a></div><div class="app-orbit" aria-label="Aplicativos disponiveis">' + cards + '</div></div>'), slots: {} };
    },
  });

  sectionDefinition({
    type: "template.business", label: "Fibra para empresas", icon: "building-2",
    propsSchema: { eyebrow: text("Chamada", "content"), title: text("Titulo", "content"), description: textarea("Descricao", "content"), image: image("Imagem", "content", "Recomendado: 1200 x 900 px."), signal: text("Sinal", "content"), features: textarea("Diferenciais", "content"), buttonLabel: text("Botao", "content") },
    defaults: { eyebrow: "Fibra Lider Empresas", title: "Conectividade para sua empresa nao parar.", description: "Link dedicado para empresas e eventos, projetos sob medida e atendimento tecnico regional.", image: "./assets/img/banner-business-fiber.jpg", signal: "Conexao preparada para seu negocio", features: "Link dedicado e projetos sob medida\nAtendimento tecnico regional\nConectividade para empresas e eventos", buttonLabel: "Solicitar proposta" },
    render: function (context) {
      const features = String(context.props.features || "").split("\n").filter(Boolean).map(function (item) { return '<li>' + icon("circle-check") + esc(item.trim()) + '</li>'; }).join("");
      return { element: htmlElement("section", "section business-section page-section", '<div class="shell business-layout"><div class="business-visual"><img src="' + esc(TB.safeMediaUrl(context.props.image, "./assets/img/banner-business-fiber.jpg")) + '" alt="' + esc(context.props.title) + '" loading="lazy"><div class="business-signal"><span>' + icon("activity") + ' Monitoramento</span><strong>' + esc(context.props.signal) + '</strong></div></div><div class="business-copy"><span class="eyebrow">' + esc(context.props.eyebrow) + '</span><h2>' + esc(context.props.title) + '</h2><p>' + esc(context.props.description) + '</p><ul class="check-list">' + features + '</ul><a class="button button--primary" href="' + esc(safeLink("whatsapp", context)) + '" target="_blank" rel="noopener">' + esc(context.props.buttonLabel) + icon("arrow-up-right") + '</a></div></div>'), slots: {} };
    },
  });

  sectionDefinition({
    type: "template.coverage", label: "Cobertura regional", icon: "map-pinned",
    propsSchema: { eyebrow: text("Chamada", "content"), title: text("Titulo", "content"), description: textarea("Descricao", "content"), mapLabel: text("Nome da rede", "content") },
    defaults: { eyebrow: "Onde atendemos", title: "Consulte a disponibilidade no seu endereco.", description: "Nossa rede esta em expansao na Regiao Metropolitana de Campinas.", mapLabel: "Rede Fibra Lider" },
    render: function (context) {
      const areas = window.FLCoverage ? FLCoverage.effectiveAreas(context.data) : (context.data.regions || []).filter(function (item) { return item.active !== false; });
      const cities = Array.from(new Set(areas.map(function (item) { return item.city || item.name; }).filter(Boolean)));
      const options = '<option value="">Selecione sua cidade</option>' + cities.map(function (city) { return '<option value="' + esc(city) + '">' + esc(city) + '</option>'; }).join("");
      const inventory = window.FLCoverage ? FLCoverage.inventory(context.data) : { effective: areas, geometries: 0 };
      const root = htmlElement("section", "section coverage-section page-section", '<div class="shell coverage-layout"><div class="coverage-copy"><span class="eyebrow">' + esc(context.props.eyebrow) + '</span><h2>' + esc(context.props.title) + '</h2><p>' + esc(context.props.description) + '</p><form class="coverage-form" data-canonical-coverage-form><label><span>CEP</span><span class="coverage-cep-field"><input name="cep" type="text" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000">' + icon("map-pin") + '</span><small>Preenchemos cidade e bairro para voce.</small></label><label><span>Cidade</span><select name="city" required>' + options + '</select></label><label><span>Bairro</span><input name="neighborhood" type="text" placeholder="Digite seu bairro" required></label><button class="button button--primary" type="submit">Consultar agora ' + icon("search") + '</button></form><div class="coverage-result" data-canonical-coverage-result hidden></div></div><div class="coverage-map map-style--' + esc(context.data.coverageSettings && context.data.coverageSettings.mapStyle || "brand") + '" aria-label="Mapa interativo da cobertura regional"><div class="real-map" data-vb-coverage-map></div><div class="public-map-hud"><span>' + icon("radio-tower") + '</span><div><strong>' + esc(context.props.mapLabel) + '</strong><small>' + inventory.effective.length + ' areas atendidas / ' + inventory.geometries + ' geometrias</small></div></div><div class="map-legend"><span></span> Area de atendimento publicada</div></div></div>');
      return { element: root, slots: {}, mount: "canonicalCoverage" };
    },
  });

  sectionDefinition({
    type: "template.testimonials", label: "Depoimentos", icon: "messages-square",
    propsSchema: { eyebrow: text("Chamada", "content"), title: text("Titulo", "content"), limit: number("Quantidade", "data", { min: 1, max: 12 }) },
    defaults: { eyebrow: "Quem usa, recomenda", title: "Uma internet proxima de quem conecta.", limit: 3 },
    render: function (context) {
      const cards = (context.data.testimonials || []).slice(0, Number(context.props.limit || 3)).map(function (item) { return '<article class="testimonial"><div class="stars" aria-label="' + esc(item.rating) + ' estrelas">' + "&#9733;".repeat(Number(item.rating || 0)) + '</div><blockquote>&ldquo;' + esc(item.text) + '&rdquo;</blockquote><div class="review-author"><span>' + esc(String(item.name || "C").charAt(0)) + '</span><div><strong>' + esc(item.name) + '</strong><small>' + esc(item.city) + '</small></div></div></article>'; }).join("");
      return { element: htmlElement("section", "section testimonials-section page-section", '<div class="shell"><div class="section-heading section-heading--center"><span class="eyebrow">' + esc(context.props.eyebrow) + '</span><h2>' + esc(context.props.title) + '</h2></div><div class="testimonials-grid">' + cards + '</div></div>'), slots: {} };
    },
  });

  sectionDefinition({
    type: "template.faq", label: "Duvidas frequentes", icon: "circle-help",
    propsSchema: { eyebrow: text("Chamada", "content"), title: text("Titulo", "content"), description: textarea("Descricao", "content") },
    defaults: { eyebrow: "Duvidas frequentes", title: "Respostas rapidas antes de contratar.", description: "Encontre respostas sobre instalacao, cobertura, equipamentos e contratacao." },
    render: function (context) {
      const items = (context.data.faq || []).map(function (item, index) { return '<article class="faq-item' + (index === 0 ? " is-open" : "") + '"><button type="button" aria-expanded="' + (index === 0 ? "true" : "false") + '"><span>' + esc(item.question) + '</span>' + icon("plus") + '</button><div class="faq-answer"><p>' + esc(item.answer) + '</p></div></article>'; }).join("");
      return { element: htmlElement("section", "section faq-section page-section", '<div class="shell faq-layout"><div class="faq-heading"><span class="eyebrow">' + esc(context.props.eyebrow) + '</span><h2>' + esc(context.props.title) + '</h2><p>' + esc(context.props.description) + '</p><a class="text-button" href="' + esc(safeLink("whatsapp", context)) + '" target="_blank" rel="noopener">Falar com atendimento ' + icon("arrow-up-right") + '</a></div><div class="faq-list">' + items + '</div></div>'), slots: {}, mount: "canonicalFaq" };
    },
  });

  sectionDefinition({
    type: "template.support", label: "Central de atendimento", icon: "headset",
    propsSchema: { eyebrow: text("Chamada", "content"), title: text("Titulo", "content"), description: textarea("Descricao", "content") },
    defaults: { eyebrow: "Central Fibra Lider", title: "Resolva tudo pelo canal certo.", description: "Atendimento comercial, area do cliente e suporte em canais diretos." },
    render: function (context) {
      const cards = (context.data.supportCards || []).filter(function (item) { return item.active !== false; }).map(function (item) { const url = item.type === "whatsapp" ? safeLink("whatsapp", context) : TB.safeUrl(item.url, "#"); return '<a class="support-card" href="' + esc(url) + '"' + (/^https?:/.test(url) ? ' target="_blank" rel="noopener"' : "") + '><span class="support-card__icon">' + icon(item.icon) + '</span><h3>' + esc(item.title) + '</h3><p>' + esc(item.text) + '</p><strong>' + esc(item.label) + " " + icon("arrow-up-right") + '</strong></a>'; }).join("");
      return { element: htmlElement("section", "section support-section page-section", '<div class="shell"><div class="section-heading section-heading--split section-heading--light"><div><span class="eyebrow eyebrow--light">' + esc(context.props.eyebrow) + '</span><h2>' + esc(context.props.title) + '</h2></div><p>' + esc(context.props.description) + '</p></div><div class="support-grid">' + cards + '</div></div>'), slots: {} };
    },
  });

  sectionDefinition({
    type: "template.final-cta", label: "Chamada final", category: "marketing", icon: "mouse-pointer-click",
    propsSchema: { eyebrow: text("Chamada", "content"), title: text("Titulo", "content"), description: textarea("Descricao", "content"), primaryLabel: text("Botao de planos", "content"), secondaryLabel: text("Botao WhatsApp", "content") },
    defaults: { eyebrow: "Internet regional de verdade", title: "Pronto para navegar sem limites?", description: "Consulte a cobertura e encontre o melhor plano para sua casa ou empresa.", primaryLabel: "Ver planos", secondaryLabel: "Falar no WhatsApp" },
    render: function (context) { return { element: htmlElement("section", "final-cta page-section", '<div class="shell final-cta__inner"><div><span class="eyebrow eyebrow--light">' + esc(context.props.eyebrow) + '</span><h2>' + esc(context.props.title) + '</h2><p>' + esc(context.props.description) + '</p></div><div class="final-cta__actions"><a class="button button--light" href="#planos">' + esc(context.props.primaryLabel) + '</a><a class="button button--outline-light" href="' + esc(safeLink("whatsapp", context)) + '" target="_blank" rel="noopener">' + esc(context.props.secondaryLabel) + icon("message-circle") + '</a></div></div>'), slots: {} }; },
  });

  sectionDefinition({
    type: "template.footer", label: "Rodape padrao", category: "navigation", icon: "panel-bottom",
    propsSchema: { showSocial: toggle("Redes sociais", "content"), showContact: toggle("Contato", "content"), showCopyright: toggle("Copyright", "content") },
    defaults: { showSocial: true, showContact: true, showCopyright: true },
    render: function (context) {
      const brand = context.data.brand || {};
      const footer = context.data.footer || {};
      const columns = (footer.columns || []).map(function (column) { return '<div><h3>' + esc(column.title) + '</h3>' + (column.links || []).map(function (link) { const url = TB.safeUrl(link.href, "#"); return '<a href="' + esc(url) + '"' + (/^https?:/.test(url) ? ' target="_blank" rel="noopener"' : "") + '>' + esc(link.label) + '</a>'; }).join("") + '</div>'; }).join("");
      const social = context.props.showSocial === false ? "" : '<div class="social-links"><a class="icon-button icon-button--footer" href="' + esc(TB.safeUrl(brand.instagram, "#")) + '" target="_blank" rel="noopener" aria-label="Instagram">' + icon("instagram") + '</a><a class="icon-button icon-button--footer" href="' + esc(TB.safeUrl(brand.facebook, "#")) + '" target="_blank" rel="noopener" aria-label="Facebook">' + icon("facebook") + '</a><a class="icon-button icon-button--footer" href="' + esc(safeLink("whatsapp", context)) + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + icon("message-circle") + '</a></div>';
      const contact = context.props.showContact === false ? "" : '<div class="footer-contact"><h3>Fale com a ' + esc(brand.name) + '</h3><a href="tel:' + esc(String(brand.phone || "").replace(/\D/g, "")) + '">' + icon("phone") + '<span>' + esc(brand.phone) + '</span></a><a href="mailto:' + esc(brand.email) + '">' + icon("mail") + '<span>' + esc(brand.email) + '</span></a><p>' + icon("map-pin") + '<span>' + esc(brand.address) + '</span></p></div>';
      const bottom = context.props.showCopyright === false ? "" : '<div class="shell footer-bottom"><p>&copy; ' + new Date().getFullYear() + " " + esc(footer.copyright) + '</p><p>' + esc(brand.legalName) + ' &middot; CNPJ ' + esc(brand.cnpj) + '</p></div>';
      return { element: htmlElement("footer", "site-footer", '<div class="shell footer-main"><div class="footer-brand"><img src="' + esc(TB.safeMediaUrl(brand.logo, "./assets/img/fibra-lider-logo.png")) + '" alt="' + esc(brand.name) + '"><p>' + esc(footer.description) + '</p>' + social + '</div><div class="footer-links">' + columns + '</div>' + contact + '</div>' + bottom), slots: {} };
    },
  });

  function append(documentValue, type, options) {
    const node = TB.createNode(type, options || {});
    documentValue.nodes[node.id] = node;
    documentValue.nodes[documentValue.rootId].slots.default.push(node.id);
    return node;
  }

  function canonicalHome(state) {
    const content = state.content || {};
    const documentValue = TB.createDocument({ name: "Home", slug: "/" });
    documentValue.meta = { ...(documentValue.meta || {}), migratedFrom: "fibra-lider-studio-state-v13", templateId: "provider-classic", templateVersion: "fibra-index-canonical-v1", templateFamily: "provider-sales" };
    documentValue.theme.tokens = {
      ...(documentValue.theme.tokens || {}), primary: state.theme.primary, secondary: state.theme.accent, background: state.theme.surface, surface: state.theme.panel,
      text: state.theme.ink, muted: state.theme.muted, fontHeading: state.theme.font + ", Arial, sans-serif", fontBody: state.theme.font + ", Arial, sans-serif", radiusSm: "8px", radiusMd: state.theme.radius + "px", radiusLg: "24px",
    };
    documentValue.theme.darkTokens = { ...(documentValue.theme.darkTokens || {}), primary: state.theme.primary, secondary: state.theme.accent, background: "#07111e", surface: "#0d1a2a", text: "#edf6ff", muted: "#96a9bd", fontHeading: state.theme.font + ", Arial, sans-serif", fontBody: state.theme.font + ", Arial, sans-serif", radiusMd: state.theme.radius + "px" };

    append(documentValue, "template.header", { id: "canonical_header", name: "Cabecalho", props: { anchor: "topo", serviceText: "Internet fibra optica em Sumare e regiao", ctaLabel: "Falar com a gente", showServiceStrip: true, sticky: true, logoVariant: "auto" } });
    const hero = append(documentValue, "template.hero", { id: "canonical_hero", name: "Hero principal", props: { mode: "slider", bannerId: "canonical_slide_1", autoplay: state.slider.autoplay, interval: state.slider.interval, pauseOnHover: state.slider.pauseOnHover !== false, showArrows: state.slider.showArrows, showDots: state.slider.showDots } });
    const banners = (state.banners || []).filter(function (banner) { return banner.active !== false; });
    (banners.length ? banners : [{ name: "Banner principal", eyebrow: "Fibra optica na sua regiao", title: "Internet que acompanha a sua casa.", subtitle: "Conexao estavel e atendimento regional.", image: "./assets/img/hero-family-fiber.jpg", primaryLabel: "Conhecer planos", primaryLink: "#planos", secondaryLabel: "Consultar cobertura", secondaryLink: "#cobertura", badge: "Mais contratado", position: "center", overlay: 64 }]).forEach(function (banner, index) {
      const slide = TB.createNode("template.hero-slide", { id: "canonical_slide_" + (index + 1), name: banner.name || "Banner " + (index + 1), props: { name: banner.name, eyebrow: banner.eyebrow, title: banner.title, subtitle: banner.subtitle, image: banner.image, mobileImage: banner.mobileImage || "", alt: banner.alt || banner.title, primaryLabel: banner.primaryLabel, primaryLink: banner.primaryLink, secondaryLabel: banner.secondaryLabel, secondaryLink: banner.secondaryLink, badge: banner.badge, position: banner.position, overlay: banner.overlay } });
      documentValue.nodes[slide.id] = slide;
      hero.slots.slides.push(slide.id);
    });
    append(documentValue, "template.proof", { id: "canonical_proof", name: "Diferenciais" });
    append(documentValue, "template.plans", { id: "canonical_plans", name: "Planos", props: { anchor: "planos", eyebrow: content.plansEyebrow, title: content.plansTitle, description: content.plansText, initialCategory: state.categories[0] && state.categories[0].id || "internet", visibleLimit: 3, showCoupon: true } });
    append(documentValue, "template.benefits", { id: "canonical_benefits", name: "Beneficios", props: { anchor: "beneficios", eyebrow: content.benefitsEyebrow, title: content.benefitsTitle, description: content.benefitsText, buttonLabel: "Consultar minha rua" } });
    append(documentValue, "template.apps", { id: "canonical_apps", name: "Entretenimento", props: { anchor: "entretenimento", eyebrow: content.appsEyebrow, title: content.appsTitle, description: content.appsText, buttonLabel: "Ver combos" } });
    append(documentValue, "template.business", { id: "canonical_business", name: "Fibra para empresas", props: { eyebrow: content.businessEyebrow, title: content.businessTitle, description: content.businessText, image: "./assets/img/banner-business-fiber.jpg", signal: content.businessSignal, features: content.businessFeatures, buttonLabel: "Solicitar proposta" } });
    append(documentValue, "template.coverage", { id: "canonical_coverage", name: "Cobertura", props: { anchor: "cobertura", eyebrow: content.coverageEyebrow, title: content.coverageTitle, description: content.coverageText, mapLabel: content.coverageMapLabel } });
    append(documentValue, "template.testimonials", { id: "canonical_testimonials", name: "Depoimentos", props: { eyebrow: content.testimonialEyebrow, title: content.testimonialTitle, limit: 3 } });
    append(documentValue, "template.faq", { id: "canonical_faq", name: "Duvidas frequentes", props: { eyebrow: content.faqEyebrow, title: content.faqTitle, description: content.faqText } });
    append(documentValue, "template.support", { id: "canonical_support", name: "Atendimento", props: { anchor: "atendimento", eyebrow: content.supportEyebrow, title: content.supportTitle, description: content.supportText } });
    append(documentValue, "template.final-cta", { id: "canonical_final", name: "Chamada final", props: { eyebrow: content.finalEyebrow, title: content.finalTitle, description: content.finalText, primaryLabel: "Ver planos", secondaryLabel: "Falar no WhatsApp" } });
    append(documentValue, "template.footer", { id: "canonical_footer", name: "Rodape", props: { showSocial: true, showContact: true, showCopyright: true } });
    return documentValue;
  }

  TB.setDocumentFactory(canonicalHome);
  TB.canonicalHomeFactory = canonicalHome;
  TB.templateRegistry.register({
    id: "provider-classic",
    name: "Fibra Essencial",
    description: "Template comercial equilibrado, com foco em planos, cobertura e atendimento regional.",
    category: "Conversao",
    palette: ["#0874e7", "#29d884", "#07111e"],
    font: "Inter",
    create: canonicalHome,
  });
})();

(function () {
  "use strict";

  const PANEL_META = {
    dashboard: ["Dashboard", "Visao geral"],
    builder: ["Construtor do site", "Site"],
    pages: ["Paginas", "Site"],
    banners: ["Banners e slides", "Site"],
    media: ["Central de midia", "Site"],
    navigation: ["Menu e rodape", "Site"],
    appearance: ["Identidade visual", "Site"],
    plans: ["Planos e combos", "Conteudo"],
    catalog: ["Apps e beneficios", "Conteudo"],
    coverage: ["Cobertura regional", "Conteudo"],
    support: ["Leads e WhatsApp", "Conteudo"],
    campaigns: ["Campanhas e cupons", "Marketing"],
    seo: ["SEO local", "Marketing"],
    pixels: ["Pixels e analytics", "Marketing"],
    analytics: ["Desempenho", "Audiencia"],
    heatmap: ["Mapa de interesse", "Audiencia"],
    settings: ["Configuracoes", "Sistema"],
  };

  let state;
  let activePanel = "dashboard";
  let selectedBlockId = "hero";
  let builderDevice = "desktop";
  let builderInspectorTab = "content";
  let builderStudioTab = "layout";
  let activeCampaignTab = "popups";
  let leadWorkspaceTab = "leads";
  let planFilter = "all";
  let pageEditId = null;
  let selectedPageBlockId = null;
  let pageBuilderDevice = "desktop";
  let builderMobileTab = "canvas";
  let pageBuilderMobileTab = "canvas";
  let themePreviewMode = "light";
  let adminMap = null;
  let builderHistory = [];
  let builderFuture = [];
  let builderPreviewTimer = null;

  const HOME_SECTION_LIBRARY = {
    content: { label: "Conteudo livre", description: "Titulo, texto e botao com alinhamento flexivel.", icon: "text" },
    media: { label: "Imagem e texto", description: "Composicao editorial com imagem da biblioteca.", icon: "panel-left" },
    stats: { label: "Indicadores", description: "Numeros, resultados e provas da operacao.", icon: "chart-no-axes-column-increasing" },
    features: { label: "Grade de recursos", description: "Diferenciais com icones, titulos e descricoes.", icon: "layout-grid" },
    gallery: { label: "Galeria", description: "Conjunto responsivo de imagens e legendas.", icon: "gallery-horizontal-end" },
    cta: { label: "Chamada comercial", description: "Faixa de conversao com texto e botao.", icon: "mouse-pointer-click" },
  };

  const HOME_TEMPLATES = {
    sales: { label: "Vendas residencial", description: "Planos, beneficios e cobertura logo no inicio.", order: ["hero", "proof", "plans", "benefits", "coverage", "apps", "testimonials", "faq", "support", "business", "final"] },
    complete: { label: "Institucional completa", description: "Todos os modulos em uma jornada equilibrada.", order: ["hero", "proof", "benefits", "plans", "apps", "business", "coverage", "testimonials", "faq", "support", "final"] },
    business: { label: "Foco empresarial", description: "Solucoes B2B, confianca, cobertura e contato.", order: ["hero", "proof", "business", "benefits", "coverage", "testimonials", "support", "faq", "final"], hidden: ["plans", "apps"] },
    lean: { label: "Conversao compacta", description: "Uma home curta para campanhas de aquisicao.", order: ["hero", "proof", "plans", "coverage", "benefits", "testimonials", "faq", "final"], hidden: ["apps", "business", "support"] },
  };

  const THEME_PRESETS = {
    fibra: { label: "Fibra Lider", description: "Azul confiavel e verde comercial", primary: "#0874e7", primaryDark: "#063f83", accent: "#29d884", ink: "#0a1628", surface: "#f4f7fb", panel: "#ffffff", mapAccent: "#0874e7" },
    oceano: { label: "Oceano", description: "Azul intenso com ciano luminoso", primary: "#006ce5", primaryDark: "#08366b", accent: "#16c5d8", ink: "#0a1726", surface: "#f2f7fa", panel: "#ffffff", mapAccent: "#16a8c0" },
    horizonte: { label: "Horizonte", description: "Verde digital com azul profundo", primary: "#087f5b", primaryDark: "#06473b", accent: "#2f80ed", ink: "#10201c", surface: "#f2f8f5", panel: "#ffffff", mapAccent: "#087f5b" },
    grafite: { label: "Grafite", description: "Contraste editorial e acento coral", primary: "#222c3a", primaryDark: "#111923", accent: "#ef6459", ink: "#111827", surface: "#f4f5f7", panel: "#ffffff", mapAccent: "#ef6459" },
  };

  const $ = function (selector, root) { return (root || document).querySelector(selector); };
  const $$ = function (selector, root) { return Array.from((root || document).querySelectorAll(selector)); };
  const esc = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };
  const icon = function (name) { return '<i data-lucide="' + esc(name) + '"></i>'; };

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
  }

  function toast(message, kind) {
    const element = $("#admin-toast");
    element.textContent = message;
    element.className = "admin-toast" + (kind ? " admin-toast--" + kind : "");
    element.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { element.hidden = true; }, 2800);
  }

  function setSaveStatus(status) {
    const element = $("#save-state");
    if (!element) return;
    const labels = { saved: "Tudo salvo", draft: "Alteracoes em rascunho", saving: "Salvando..." };
    element.innerHTML = '<i class="status-dot"></i> ' + labels[status];
    element.dataset.status = status;
  }

  function saveDraft(message) {
    setSaveStatus("saving");
    state = FL.saveState(state, false);
    setTimeout(function () { setSaveStatus("draft"); }, 180);
    if (message) toast(message);
  }

  function saveRuntime(message) {
    state = FL.saveRuntimeState(state);
    setSaveStatus(state.meta.status === "published" ? "saved" : "draft");
    if (message) toast(message);
  }

  function publish() {
    state = FL.saveState(state, true);
    setSaveStatus("saved");
    toast("Site publicado com sucesso", "success");
    renderPanel();
  }

  function getPath(path) {
    return path.split(".").reduce(function (value, key) { return value == null ? undefined : value[key]; }, state);
  }

  function setPath(path, value) {
    const keys = path.split(".");
    let target = state;
    keys.slice(0, -1).forEach(function (key) { target = target[key]; });
    target[keys[keys.length - 1]] = value;
  }

  function field(label, path, options) {
    const config = options || {};
    const value = getPath(path);
    const help = config.help ? "<small>" + esc(config.help) + "</small>" : "";
    if (config.type === "textarea") {
      return '<label class="field"><span>' + esc(label) + '</span><textarea rows="' + (config.rows || 4) + '" data-bind="' + esc(path) + '">' + esc(value) + "</textarea>" + help + "</label>";
    }
    if (config.type === "select") {
      return '<label class="field"><span>' + esc(label) + '</span><select data-bind="' + esc(path) + '">' + config.options.map(function (item) {
        const option = typeof item === "string" ? { value: item, label: item } : item;
        return '<option value="' + esc(option.value) + '"' + (String(value) === String(option.value) ? " selected" : "") + ">" + esc(option.label) + "</option>";
      }).join("") + "</select>" + help + "</label>";
    }
    if (config.type === "color") {
      return '<label class="field"><span>' + esc(label) + '</span><span class="color-input"><input type="color" value="' + esc(value) + '" data-bind="' + esc(path) + '"><b>' + esc(value) + "</b></span>" + help + "</label>";
    }
    const type = config.type || "text";
    return '<label class="field"><span>' + esc(label) + '</span><input type="' + type + '" value="' + esc(value) + '" data-bind="' + esc(path) + '"' + (config.placeholder ? ' placeholder="' + esc(config.placeholder) + '"' : "") + ">" + help + "</label>";
  }

  function toggle(label, path, description) {
    return '<label class="toggle-row"><span><strong>' + esc(label) + "</strong>" + (description ? "<small>" + esc(description) + "</small>" : "") + '</span><input type="checkbox" data-bind="' + esc(path) + '"' + (getPath(path) ? " checked" : "") + '><i></i></label>';
  }

  function panelHeader(title, description, actions) {
    return '<div class="panel-heading"><div><h2>' + esc(title) + "</h2><p>" + esc(description) + "</p></div>" + (actions || "") + "</div>";
  }

  function cardTitle(title, description, action) {
    return '<div class="card-heading"><div><h3>' + esc(title) + "</h3>" + (description ? "<p>" + esc(description) + "</p>" : "") + "</div>" + (action || "") + "</div>";
  }

  function dateLabel(date) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
  }

  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (value < 1024) return value + " B";
    if (value < 1024 * 1024) return (value / 1024).toFixed(value > 102400 ? 0 : 1).replace(".", ",") + " KB";
    return (value / (1024 * 1024)).toFixed(1).replace(".", ",") + " MB";
  }

  function formatPhone(value) {
    let digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 12 || digits.length === 13) digits = digits.slice(2);
    if (digits.length === 11) return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
    if (digits.length === 10) return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 6) + "-" + digits.slice(6);
    return value || "Sem WhatsApp";
  }

  function stateSize() {
    try { return new Blob([JSON.stringify(state)]).size; }
    catch (error) { return 0; }
  }

  function mediaSavings() {
    return state.mediaLibrary.reduce(function (total, item) { return total + Math.max(0, Number(item.originalBytes || item.bytes || 0) - Number(item.bytes || 0)); }, 0);
  }

  function googleMapsUrl(region, directions) {
    const destination = Number.isFinite(Number(region.lat)) && Number.isFinite(Number(region.lng)) ? Number(region.lat) + "," + Number(region.lng) : region.address || region.name;
    return directions
      ? "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(destination) + "&travelmode=driving"
      : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(destination);
  }

  function builderSnapshot() {
    return JSON.stringify({ pageBlocks: state.pageBlocks, content: state.content });
  }

  function recordBuilderHistory() {
    const snapshot = builderSnapshot();
    if (builderHistory[builderHistory.length - 1] !== snapshot) builderHistory.push(snapshot);
    if (builderHistory.length > 40) builderHistory.shift();
    builderFuture = [];
  }

  function restoreBuilderSnapshot(snapshot) {
    const parsed = JSON.parse(snapshot);
    state.pageBlocks = parsed.pageBlocks;
    state.content = parsed.content;
    if (!state.pageBlocks.some(function (block) { return block.id === selectedBlockId; })) selectedBlockId = state.pageBlocks[0].id;
    state = FL.saveState(state, false);
  }

  function scheduleBuilderPreview() {
    clearTimeout(builderPreviewTimer);
    builderPreviewTimer = setTimeout(function () {
      const frame = $("#site-preview");
      if (frame) frame.src = "./index.html?preview=" + Date.now() + "&theme=" + state.builderSettings.previewTheme;
    }, 480);
  }

  function homeSectionDefaults(type) {
    const base = { id: FL.uid("section"), type: "custom-" + type, label: HOME_SECTION_LIBRARY[type].label, visible: true, locked: false, tone: "light", spacing: "normal", container: "normal", alignment: "left", anchor: "", backgroundImage: "", backgroundPosition: "center", hideMobile: false, hideDesktop: false, content: {} };
    if (type === "content") { base.container = "narrow"; base.alignment = "center"; base.content = { eyebrow: "Fibra Lider", title: "Uma secao feita para a sua mensagem.", text: "Apresente uma novidade, uma area atendida ou um diferencial da sua empresa.", buttonLabel: "Conhecer planos", buttonUrl: "#planos" }; }
    if (type === "media") { base.content = { eyebrow: "Conexao regional", title: "Tecnologia com atendimento proximo.", text: "Combine uma imagem real com uma mensagem clara para aproximar sua marca do cliente.", image: state.mediaLibrary[0] ? state.mediaLibrary[0].url : state.banners[0].image, imageAlt: "Fibra Lider", imageSide: "left", buttonLabel: "Falar com a equipe", buttonUrl: "whatsapp" }; }
    if (type === "stats") { base.alignment = "center"; base.content = { eyebrow: "Nossa presenca", title: "Resultados que constroem confianca.", text: "Use numeros reais para mostrar a forca da operacao.", items: "100% | fibra optica\n5 | cidades atendidas\n18 | planos e combos\nSuporte local | perto de voce" }; }
    if (type === "features") { base.content = { eyebrow: "Diferenciais", title: "Tudo o que o cliente precisa para escolher.", text: "Organize argumentos comerciais em uma grade facil de comparar.", items: "wifi | Wi-Fi para a casa toda | Equipamento e orientacao para melhorar a experiencia.\nheadphones | Atendimento regional | Uma equipe proxima para orientar e resolver.\ngauge | Velocidade de verdade | Planos preparados para trabalho, jogos e streaming." }; }
    if (type === "gallery") { base.alignment = "center"; base.content = { eyebrow: "Conheca a Fibra Lider", title: "Uma operacao conectada com a regiao.", text: "Mostre estrutura, equipe, instalacoes ou clientes.", items: state.mediaLibrary.slice(0, 3).map(function (item) { return item.url + " | " + item.name; }).join("\n") }; }
    if (type === "cta") { base.tone = "brand"; base.content = { eyebrow: "Vamos conectar?", title: "Consulte a cobertura no seu endereco.", text: "Fale com a equipe e encontre o plano ideal para sua rotina.", buttonLabel: "Consultar agora", buttonUrl: "#cobertura" }; }
    return base;
  }

  function analyticsData() {
    const events = FL.getEvents();
    const publicEvents = events.filter(function (event) { return event.path !== "/admin.html"; });
    const count = function (type) { return publicEvents.filter(function (event) { return event.type === type; }).length; };
    const views = count("page_view");
    const planClicks = count("plan_click");
    const whatsapp = count("whatsapp_click");
    const coverage = count("coverage_search");
    const leads = state.leads.length;
    const conversion = views ? ((leads / views) * 100) : 0;
    return { events: publicEvents, views, planClicks, whatsapp, leads, coverage, conversion };
  }

  function groupByPayload(events, key) {
    return events.reduce(function (acc, event) {
      const value = event.payload && event.payload[key] ? event.payload[key] : "Nao identificado";
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  function metricCard(label, value, trend, context, iconName, tone) {
    return '<article class="metric-card metric-card--' + tone + '"><div class="metric-card__top"><span>' + icon(iconName) + '</span><em>' + esc(trend) + '</em></div><strong>' + esc(value) + '</strong><p>' + esc(label) + '</p><small>' + esc(context) + "</small></article>";
  }

  function renderDashboard() {
    const data = analyticsData();
    const mobileEvents = data.events.filter(function (event) { return event.viewport && Number(event.viewport.width) < 700; }).length;
    const mobileShare = data.events.length ? Math.round((mobileEvents / data.events.length) * 100) : 0;
    const sources = groupByPayload(data.events, "source");
    const sourceEntries = Object.entries(sources).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
    const maxSource = sourceEntries.length ? sourceEntries[0][1] : 1;
    const planCounts = groupByPayload(data.events.filter(function (event) { return event.type === "plan_click" || event.type === "whatsapp_click"; }), "planId");
    const topPlans = Object.entries(planCounts).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 4);
    const days = Array.from({ length: 14 }, function (_, index) {
      const day = new Date(); day.setDate(day.getDate() - (13 - index));
      const key = day.toISOString().slice(0, 10);
      const total = data.events.filter(function (event) { return event.ts.slice(0, 10) === key; }).length;
      return { label: day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), total };
    });
    const maxDay = Math.max.apply(null, days.map(function (day) { return day.total; }).concat([1]));
    const status = state.meta.status === "published" ? "Publicado" : "Rascunho";
    const healthChecks = [state.banners.some(function (item) { return item.active; }), state.plans.some(function (item) { return item.active; }), state.regions.some(function (item) { return item.active && item.cep; }), Boolean(state.seo.title && state.seo.description), Boolean(state.brand.whatsapp), state.pages.some(function (item) { return item.status === "published"; }), state.integrations.consentBanner];
    const healthScore = Math.round((healthChecks.filter(Boolean).length / healthChecks.length) * 100);
    const mediaWeight = state.mediaLibrary.reduce(function (sum, item) { return sum + Number(item.bytes || 0); }, 0);
    const mappedRegions = state.regions.filter(function (item) { return item.active && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng)); }).length;
    return [
      panelHeader("Visao geral", "Acompanhe a jornada de aquisicao e os pontos que mais geram interesse.", '<div class="heading-actions"><select class="compact-select"><option>Ultimos 28 dias</option><option>Ultimos 7 dias</option></select><button class="button button--ghost" data-action="export-report">' + icon("download") + " Exportar</button></div>"),
      '<section class="dashboard-welcome"><div><span><i class="status-dot"></i> Site ' + status.toLowerCase() + '</span><h3>Bom trabalho, equipe Fibra Lider.</h3><p>As campanhas estao gerando interesse principalmente nos planos de 600 Mega.</p><button class="text-button" data-goto="support">Abrir fila comercial ' + icon("arrow-right") + '</button></div><div class="welcome-score"><small>Meta mensal de leads</small><strong>' + data.leads + '<span> / ' + state.dashboardTargets.monthlyLeads + '</span></strong><div><i style="width:' + Math.min(100, (data.leads / state.dashboardTargets.monthlyLeads) * 100) + '%"></i></div><p>' + Math.round((data.leads / state.dashboardTargets.monthlyLeads) * 100) + '% da meta</p></div></section>',
      '<section class="metrics-grid">',
      metricCard("Visitantes", String(data.views), "+12,8%", "32% vieram do Google", "users", "blue"),
      metricCard("Interesse em planos", String(data.planClicks), "+18,4%", "600 Mega lidera cliques", "mouse-pointer-click", "violet"),
      metricCard("Leads capturados", String(data.leads), "+9,2%", data.conversion.toFixed(1).replace(".", ",") + "% de conversao", "contact-round", "green"),
      metricCard("Consultas de cobertura", String(data.coverage), "+6,7%", "Sumare concentra a procura", "map-pin-check", "orange"),
      "</section>",
      '<section class="signal-grid">',
      '<article><span class="signal-icon signal-icon--green">' + icon("badge-check") + '</span><div><small>Conversao comercial</small><strong>' + data.conversion.toFixed(1).replace(".", ",") + '%</strong><p>visitas que enviaram o formulario</p></div></article>',
      '<article><span class="signal-icon signal-icon--blue">' + icon("smartphone") + '</span><div><small>Audiencia mobile</small><strong>' + mobileShare + '%</strong><p>interacoes em telas menores</p></div></article>',
      '<article><span class="signal-icon signal-icon--violet">' + icon("megaphone") + '</span><div><small>Campanhas ativas</small><strong>' + state.popupCampaigns.filter(function (item) { return item.active; }).length + '</strong><p>' + state.coupons.filter(function (item) { return item.active; }).length + ' cupom ativo no site</p></div></article>',
      '<article><span class="signal-icon signal-icon--orange">' + icon("files") + '</span><div><small>Conteudo publicado</small><strong>' + state.pages.filter(function (item) { return item.status === "published"; }).length + '</strong><p>paginas internas disponiveis</p></div></article>',
      '</section>',
      '<section class="quality-grid"><article class="quality-card"><div class="quality-ring" style="--score:' + healthScore + '"><strong>' + healthScore + '<small>%</small></strong></div><div><span>Saude do site</span><h3>' + (healthScore >= 85 ? "Pronto para campanhas" : "Ha ajustes recomendados") + '</h3><p>SEO, conteudo, cobertura e canais comerciais.</p><button class="text-button" data-goto="seo">Ver diagnostico ' + icon("arrow-right") + '</button></div></article><article class="quality-card"><span class="quality-icon">' + icon("image-down") + '</span><div><span>Performance de midia</span><h3>' + formatBytes(mediaWeight) + ' publicados</h3><p>' + formatBytes(mediaSavings()) + ' economizados com compressao.</p><button class="text-button" data-goto="media">Otimizar imagens ' + icon("arrow-right") + '</button></div></article><article class="quality-card"><span class="quality-icon">' + icon("map-pinned") + '</span><div><span>Inteligencia de cobertura</span><h3>' + mappedRegions + ' areas mapeadas</h3><p>' + state.regions.filter(function (item) { return item.cep; }).length + ' CEPs validados para consulta.</p><button class="text-button" data-goto="coverage">Gerenciar cobertura ' + icon("arrow-right") + '</button></div></article><article class="quality-card"><span class="quality-icon">' + icon("panels-top-left") + '</span><div><span>Experiencia da marca</span><h3>' + state.pageBlocks.filter(function (item) { return item.visible; }).length + ' secoes na home</h3><p>' + state.pages.length + ' paginas e ' + state.banners.filter(function (item) { return item.active; }).length + ' banners ativos.</p><button class="text-button" data-goto="builder">Editar experiencia ' + icon("arrow-right") + '</button></div></article></section>',
      '<section class="dashboard-action-center"><div><span>' + icon("sparkles") + '</span><div><strong>Proximas acoes recomendadas</strong><p>Melhore a conversao sem sair do fluxo de trabalho.</p></div></div><div><button data-goto="coverage">' + icon("map-pin-plus") + '<span><strong>Validar novos CEPs</strong><small>Expanda a area comercial</small></span></button><button data-goto="campaigns">' + icon("badge-percent") + '<span><strong>Criar oferta regional</strong><small>Use os locais mais procurados</small></span></button><button data-goto="appearance">' + icon("palette") + '<span><strong>Revisar a identidade</strong><small>Confira claro e escuro</small></span></button></div></section>',
      '<section class="dashboard-grid dashboard-grid--main"><article class="admin-card chart-card">',
      cardTitle("Interacoes no site", "Volume diario nos ultimos 14 dias", '<button class="icon-button" title="Mais opcoes">' + icon("ellipsis") + "</button>"),
      '<div class="chart-summary"><strong>' + data.events.length + '</strong><span>Total de interacoes <em>+14,6%</em></span></div>',
      '<div class="bar-chart">' + days.map(function (day) { return '<div title="' + day.label + ': ' + day.total + '"><i style="height:' + Math.max(8, (day.total / maxDay) * 100) + '%"></i><span>' + day.label.split("/")[0] + "</span></div>"; }).join("") + "</div>",
      '<div class="chart-legend"><span><i class="legend-dot legend-dot--blue"></i> Interacoes registradas</span><small>Dados first-party deste prototipo</small></div>',
      '</article><article class="admin-card sources-card">',
      cardTitle("Origem dos acessos", "Canais que trazem visitantes", ""),
      '<div class="source-list">' + sourceEntries.map(function (entry, index) {
        const colors = ["#0874e7", "#e54881", "#29b575", "#f2a41d", "#6259e8"];
        return '<div class="source-row"><span><i style="background:' + colors[index] + '"></i>' + esc(entry[0]) + '</span><div><b style="width:' + ((entry[1] / maxSource) * 100) + '%"></b></div><strong>' + entry[1] + "</strong></div>";
      }).join("") + '</div><button class="text-button" data-goto="analytics">Abrir relatorio completo ' + icon("arrow-right") + "</button></article></section>",
      '<section class="dashboard-grid dashboard-grid--bottom"><article class="admin-card">',
      cardTitle("Funil comercial", "Da visita ao contato no WhatsApp", ""),
      '<div class="funnel"><div><span>Visitantes</span><strong>' + data.views + '</strong><i style="--w:100%"></i></div><div><span>Planos visualizados</span><strong>' + data.planClicks + '</strong><i style="--w:72%"></i></div><div><span>Consulta de cobertura</span><strong>' + data.coverage + '</strong><i style="--w:48%"></i></div><div><span>Leads capturados</span><strong>' + data.leads + '</strong><i style="--w:35%"></i></div></div>',
      '</article><article class="admin-card">',
      cardTitle("Planos com maior interesse", "Cliques e contatos por oferta", ""),
      '<div class="ranking-list">' + topPlans.map(function (entry, index) {
        const item = state.plans.find(function (plan) { return plan.id === entry[0]; });
        return '<div><span class="rank">0' + (index + 1) + '</span><div><strong>' + esc(item ? item.speed : entry[0]) + '</strong><small>' + esc(item ? item.title : "Plano") + '</small></div><b>' + entry[1] + " acoes</b></div>";
      }).join("") + '</div><button class="text-button" data-goto="plans">Gerenciar planos ' + icon("arrow-right") + "</button></article>",
      '<article class="admin-card activity-card">',
      cardTitle("Atividade recente", "Eventos comerciais mais recentes", ""),
      '<div class="activity-list">' + data.events.slice(-5).reverse().map(function (event) {
        const map = { page_view: ["eye", "Nova visita"], plan_click: ["mouse-pointer-click", "Clique em plano"], whatsapp_click: ["message-circle", "Lead no WhatsApp"], coverage_search: ["map-pin", "Consulta de cobertura"] };
        const item = map[event.type] || ["activity", event.type];
        return '<div><span>' + icon(item[0]) + '</span><div><strong>' + esc(item[1]) + '</strong><small>' + esc(event.payload.region || event.payload.source || "Site") + '</small></div><time>' + dateLabel(event.ts) + "</time></div>";
      }).join("") + "</div></article></section>",
    ].join("");
  }

  function blockContentPaths(blockId) {
    const map = {
      plans: ["plansEyebrow", "plansTitle", "plansText"],
      benefits: ["benefitsEyebrow", "benefitsTitle", "benefitsText"],
      apps: ["appsEyebrow", "appsTitle"],
      business: ["businessEyebrow", "businessTitle", "businessText"],
      coverage: ["coverageEyebrow", "coverageTitle", "coverageText"],
      testimonials: ["testimonialEyebrow", "testimonialTitle"],
      faq: ["faqEyebrow", "faqTitle"],
      support: ["supportEyebrow", "supportTitle"],
      final: ["finalTitle", "finalText"],
    };
    return map[blockId] || [];
  }

  function homeBlockField(label, key, block, options) {
    const config = options || {};
    const value = block.content && block.content[key] != null ? block.content[key] : "";
    const help = config.help ? "<small>" + esc(config.help) + "</small>" : "";
    if (config.type === "textarea") return '<label class="field"><span>' + esc(label) + '</span><textarea rows="' + (config.rows || 4) + '" data-home-block-field="' + esc(key) + '">' + esc(value) + "</textarea>" + help + "</label>";
    if (config.type === "select") return '<label class="field"><span>' + esc(label) + '</span><select data-home-block-field="' + esc(key) + '">' + config.options.map(function (item) { return '<option value="' + esc(item.value) + '"' + (String(value) === String(item.value) ? " selected" : "") + '>' + esc(item.label) + "</option>"; }).join("") + "</select>" + help + "</label>";
    return '<label class="field"><span>' + esc(label) + '</span><input value="' + esc(value) + '" data-home-block-field="' + esc(key) + '"' + (config.placeholder ? ' placeholder="' + esc(config.placeholder) + '"' : "") + ">" + help + "</label>";
  }

  function customBlockInspector(block) {
    let fields = homeBlockField("Chamada curta", "eyebrow", block) + homeBlockField("Titulo", "title", block) + homeBlockField("Texto", "text", block, { type: "textarea", rows: 5 });
    if (["custom-content", "custom-media", "custom-cta"].includes(block.type)) fields += '<div class="inspector-field-pair">' + homeBlockField("Texto do botao", "buttonLabel", block) + homeBlockField("Destino", "buttonUrl", block, { placeholder: "#planos ou whatsapp" }) + "</div>";
    if (block.type === "custom-media") {
      fields += homeBlockField("Imagem", "image", block) + '<label class="field"><span>Biblioteca de midia</span><select data-home-block-field="image"><option value="">Selecionar imagem</option>' + state.mediaLibrary.map(function (item) { return '<option value="' + esc(item.url) + '"' + (item.url === block.content.image ? " selected" : "") + '>' + esc(item.name) + "</option>"; }).join("") + '</select></label>' + homeBlockField("Texto alternativo", "imageAlt", block) + homeBlockField("Posicao da imagem", "imageSide", block, { type: "select", options: [{ value: "left", label: "Esquerda" }, { value: "right", label: "Direita" }] });
    }
    if (block.type === "custom-stats") fields += homeBlockField("Indicadores", "items", block, { type: "textarea", rows: 7, help: "Uma linha por item: valor | rotulo" });
    if (block.type === "custom-features") fields += homeBlockField("Recursos", "items", block, { type: "textarea", rows: 9, help: "Uma linha por item: icone Lucide | titulo | descricao" });
    if (block.type === "custom-gallery") fields += homeBlockField("Imagens", "items", block, { type: "textarea", rows: 8, help: "Uma linha por item: URL da imagem | legenda" }) + '<button class="button button--ghost button--block" data-goto="media">' + icon("images") + ' Abrir biblioteca de midia</button>';
    return fields;
  }

  function blockInspector(block) {
    const labels = {
      plansEyebrow: "Chamada curta", plansTitle: "Titulo", plansText: "Descricao",
      benefitsEyebrow: "Chamada curta", benefitsTitle: "Titulo", benefitsText: "Descricao",
      appsEyebrow: "Chamada curta", appsTitle: "Titulo", businessEyebrow: "Chamada curta",
      businessTitle: "Titulo", businessText: "Descricao", coverageEyebrow: "Chamada curta",
      coverageTitle: "Titulo", coverageText: "Descricao", testimonialEyebrow: "Chamada curta",
      testimonialTitle: "Titulo", faqEyebrow: "Chamada curta", faqTitle: "Titulo",
      supportEyebrow: "Chamada curta", supportTitle: "Titulo", finalTitle: "Titulo", finalText: "Descricao",
    };
    if (String(block.type).startsWith("custom-")) return customBlockInspector(block);
    if (block.id === "hero") {
      const active = state.banners.filter(function (banner) { return banner.active; }).length;
      return '<div class="inspector-callout">' + icon("gallery-horizontal-end") + '<div><strong>' + active + ' slides ativos</strong><p>O conteudo do banner principal e gerenciado no modulo de slides.</p><button class="text-button" data-goto="banners">Editar banners ' + icon("arrow-right") + "</button></div></div>";
    }
    const paths = blockContentPaths(block.id);
    if (!paths.length) {
      return '<div class="inspector-callout">' + icon("settings-2") + '<div><strong>Secao estrutural</strong><p>Esta secao usa o conteudo cadastrado nos modulos do painel.</p></div></div>';
    }
    return paths.map(function (key) {
      return field(labels[key], "content." + key, { type: key.toLowerCase().includes("text") ? "textarea" : "text", rows: 3 });
    }).join("");
  }

  function homeBlockIcon(type) {
    const icons = { hero: "gallery-horizontal", plans: "badge-dollar-sign", coverage: "map", benefits: "badge-check", apps: "boxes", business: "building-2", testimonials: "messages-square", faq: "circle-help", support: "life-buoy", final: "mouse-pointer-click", proof: "shield-check" };
    if (String(type).startsWith("custom-")) {
      const customSection = HOME_SECTION_LIBRARY[String(type).replace("custom-", "")];
      return customSection ? customSection.icon : "layout-panel-top";
    }
    return icons[type] || "layout-panel-top";
  }

  function blockSelect(label, attribute, value, options) {
    return '<label class="field"><span>' + esc(label) + '</span><select ' + attribute + '>' + options.map(function (item) { return '<option value="' + esc(item.value) + '"' + (String(value) === String(item.value) ? " selected" : "") + '>' + esc(item.label) + "</option>"; }).join("") + "</select></label>";
  }

  function renderBuilderInspector(block) {
    if (builderInspectorTab === "content") return '<div class="inspector-section"><span class="inspector-label">Conteudo</span>' + blockInspector(block) + "</div>";
    if (builderInspectorTab === "design") {
      return '<div class="inspector-section"><span class="inspector-label">Aparencia da secao</span>' + blockSelect("Tom do fundo", 'data-block-tone="' + esc(block.id) + '"', block.tone, [{ value: "light", label: "Claro" }, { value: "soft", label: "Suave" }, { value: "dark", label: "Escuro" }, { value: "brand", label: "Cor da marca" }]) + blockSelect("Espacamento vertical", 'data-block-setting="spacing"', block.spacing, [{ value: "compact", label: "Compacto" }, { value: "normal", label: "Normal" }, { value: "large", label: "Amplo" }]) + blockSelect("Largura do conteudo", 'data-block-setting="container"', block.container, [{ value: "narrow", label: "Estreita" }, { value: "normal", label: "Padrao" }, { value: "wide", label: "Larga" }, { value: "full", label: "Tela inteira" }]) + blockSelect("Alinhamento", 'data-block-setting="alignment"', block.alignment, [{ value: "left", label: "Esquerda" }, { value: "center", label: "Centro" }, { value: "right", label: "Direita" }]) + '<label class="field"><span>Imagem de fundo</span><select data-block-style="backgroundImage"><option value="">Sem imagem</option>' + state.mediaLibrary.map(function (item) { return '<option value="' + esc(item.url) + '"' + (item.url === block.backgroundImage ? " selected" : "") + '>' + esc(item.name) + "</option>"; }).join("") + '</select></label>' + blockSelect("Posicao do fundo", 'data-block-style="backgroundPosition"', block.backgroundPosition, [{ value: "center", label: "Centro" }, { value: "left", label: "Esquerda" }, { value: "right", label: "Direita" }, { value: "top", label: "Topo" }]) + '<div class="section-tone-preview" data-tone="' + esc(block.tone) + '"><span></span><div><strong>Previa da superficie</strong><small>Tipografia e cores seguem a identidade da marca.</small></div></div></div>';
    }
    return '<div class="inspector-section"><span class="inspector-label">Organizacao</span><label class="field"><span>Nome no construtor</span><input data-block-label value="' + esc(block.label) + '"></label><label class="field"><span>Ancora da secao</span><input data-block-anchor value="' + esc(block.anchor || "") + '" placeholder="ex: nossa-rede"><small>Use apenas letras, numeros e hifens.</small></label><label class="toggle-row"><span><strong>Visivel no site</strong><small>Controla a publicacao desta secao</small></span><input type="checkbox" data-block-visible="' + esc(block.id) + '"' + (block.visible ? " checked" : "") + (block.locked ? " disabled" : "") + '><i></i></label><label class="toggle-row"><span><strong>Ocultar no celular</strong><small>Remove a secao em telas menores</small></span><input type="checkbox" data-block-device="hideMobile"' + (block.hideMobile ? " checked" : "") + '><i></i></label><label class="toggle-row"><span><strong>Ocultar no desktop</strong><small>Exibe somente em telas menores</small></span><input type="checkbox" data-block-device="hideDesktop"' + (block.hideDesktop ? " checked" : "") + '><i></i></label></div><div class="inspector-section"><span class="inspector-label">Acoes</span><div class="inspector-actions"><button class="button button--ghost" data-action="move-block-up">' + icon("arrow-up") + ' Subir</button><button class="button button--ghost" data-action="move-block-down">' + icon("arrow-down") + ' Descer</button>' + (!block.locked ? '<button class="button button--ghost" data-action="duplicate-block">' + icon("copy") + ' Duplicar</button><button class="button button--danger" data-action="delete-block">' + icon("trash-2") + ' Excluir</button>' : '<div class="locked-section-note">' + icon("lock-keyhole") + '<span>Secao estrutural protegida</span></div>') + "</div></div>";
  }

  function renderBuilderLayout() {
    const block = state.pageBlocks.find(function (item) { return item.id === selectedBlockId; }) || state.pageBlocks[0];
    selectedBlockId = block.id;
    const zoom = Math.min(100, Math.max(65, Number(state.builderSettings.canvasZoom || 100)));
    const previewTheme = state.builderSettings.previewTheme || "light";
    return [
      '<section class="builder-toolbar builder-toolbar--advanced"><div class="builder-history"><button class="icon-button" data-action="builder-undo" title="Desfazer"' + (builderHistory.length ? "" : " disabled") + '>' + icon("undo-2") + '</button><button class="icon-button" data-action="builder-redo" title="Refazer"' + (builderFuture.length ? "" : " disabled") + '>' + icon("redo-2") + '</button></div><div class="builder-device-switch"><button class="' + (builderDevice === "desktop" ? "is-active" : "") + '" data-device="desktop" title="Desktop">' + icon("monitor") + '</button><button class="' + (builderDevice === "tablet" ? "is-active" : "") + '" data-device="tablet" title="Tablet">' + icon("tablet") + '</button><button class="' + (builderDevice === "mobile" ? "is-active" : "") + '" data-device="mobile" title="Celular">' + icon("smartphone") + '</button></div><div class="builder-status"><span><i class="status-dot"></i> ' + state.pageBlocks.length + ' secoes</span><small>Alteracoes salvas automaticamente</small></div><div class="builder-view-actions"><label>Zoom <select data-builder-zoom><option value="75"' + (zoom === 75 ? " selected" : "") + '>75%</option><option value="90"' + (zoom === 90 ? " selected" : "") + '>90%</option><option value="100"' + (zoom === 100 ? " selected" : "") + '>100%</option></select></label><button class="icon-button" data-action="builder-theme" title="Alternar tema do preview">' + icon(previewTheme === "dark" ? "sun" : "moon") + '</button><button class="icon-button" data-action="builder-refresh" title="Atualizar preview">' + icon("refresh-cw") + "</button></div></section>",
      '<div class="builder-mobile-tabs" aria-label="Ferramentas do construtor"><button class="' + (builderMobileTab === "layers" ? "is-active" : "") + '" data-builder-tab="layers">' + icon("layers-3") + '<span>Estrutura</span></button><button class="' + (builderMobileTab === "canvas" ? "is-active" : "") + '" data-builder-tab="canvas">' + icon("monitor-smartphone") + '<span>Preview</span></button><button class="' + (builderMobileTab === "inspector" ? "is-active" : "") + '" data-builder-tab="inspector">' + icon("sliders-horizontal") + '<span>Propriedades</span></button></div>',
      '<section class="builder-workspace builder-workspace--advanced mobile-tab--' + builderMobileTab + '">',
      '<aside class="builder-layers"><div class="builder-panel-title"><div><strong>Estrutura</strong><small>' + state.pageBlocks.filter(function (item) { return item.visible; }).length + ' secoes visiveis</small></div><button class="icon-button" data-action="add-section" title="Adicionar secao">' + icon("plus") + '</button></div><button class="builder-add-section" data-action="add-section">' + icon("plus") + '<span><strong>Adicionar secao</strong><small>Texto, imagem, indicadores e mais</small></span></button><div class="layer-list" id="layer-list">',
      state.pageBlocks.map(function (item, index) {
        const custom = String(item.type).startsWith("custom-");
        return '<article class="layer-item' + (item.id === selectedBlockId ? " is-selected" : "") + (item.visible ? "" : " is-hidden") + '" draggable="true" data-block-id="' + esc(item.id) + '"><button class="drag-handle" type="button" title="Arrastar">' + icon("grip-vertical") + '</button><button class="layer-select" type="button" data-select-block="' + esc(item.id) + '"><span>' + icon(homeBlockIcon(item.type)) + '</span><div><strong>' + esc(item.label) + '</strong><small>' + (custom ? "Bloco personalizado" : "Secao do sistema") + ' &middot; 0' + (index + 1) + '</small></div></button><button class="layer-visibility" type="button" data-toggle-block="' + esc(item.id) + '" title="' + (item.visible ? "Ocultar" : "Exibir") + '"' + (item.locked ? " disabled" : "") + '>' + icon(item.visible ? "eye" : "eye-off") + "</button></article>";
      }).join(""),
      '</div></aside>',
      '<div class="builder-canvas" style="--builder-zoom:' + (zoom / 100) + '"><div class="preview-frame preview-frame--' + builderDevice + '"><div class="preview-browser"><span></span><span></span><span></span><div>fibralider.net.br</div></div><iframe id="site-preview" src="./index.html?preview=1&theme=' + previewTheme + '" title="Preview do site"></iframe></div></div>',
      '<aside class="builder-inspector"><div class="builder-panel-title"><div><strong>Propriedades</strong><small>' + esc(block.label) + '</small></div><span class="block-type-chip">' + icon(homeBlockIcon(block.type)) + esc(String(block.type).replace("custom-", "")) + '</span></div><div class="inspector-tabs"><button class="' + (builderInspectorTab === "content" ? "is-active" : "") + '" data-inspector-tab="content">Conteudo</button><button class="' + (builderInspectorTab === "design" ? "is-active" : "") + '" data-inspector-tab="design">Design</button><button class="' + (builderInspectorTab === "advanced" ? "is-active" : "") + '" data-inspector-tab="advanced">Avancado</button></div><div class="inspector-body">' + renderBuilderInspector(block) + "</div></aside></section>",
    ].join("");
  }

  function studioTabs() {
    const tabs = [
      ["layout", "panels-top-left", "Pagina", state.pageBlocks.length + " secoes"],
      ["slides", "gallery-horizontal-end", "Banners", state.banners.filter(function (item) { return item.active; }).length + " ativos"],
      ["header", "panel-top", "Cabecalho", state.navigation.filter(function (item) { return item.visible; }).length + " links"],
      ["footer", "panel-bottom", "Rodape", state.footer.columns.length + " colunas"],
      ["brand", "palette", "Marca", "cores e componentes"],
    ];
    return '<nav class="studio-tabs" aria-label="Areas do construtor">' + tabs.map(function (item) {
      return '<button class="' + (builderStudioTab === item[0] ? "is-active" : "") + '" data-studio-tab="' + item[0] + '"><span>' + icon(item[1]) + '</span><div><strong>' + item[2] + '</strong><small>' + item[3] + '</small></div></button>';
    }).join("") + "</nav>";
  }

  function studioPreview(title, section) {
    return '<aside class="studio-live-preview"><div class="studio-live-preview__head"><div><strong>' + esc(title) + '</strong><small>Preview sincronizado</small></div><button class="icon-button" data-action="builder-refresh" title="Atualizar preview">' + icon("refresh-cw") + '</button></div><div class="studio-live-preview__device"><iframe id="site-preview" src="./index.html?preview=1&theme=' + esc(state.builderSettings.previewTheme || "light") + (section ? "&section=" + encodeURIComponent(section) : "") + '" title="Preview do site"></iframe></div></aside>';
  }

  function renderStudioSlides() {
    return '<section class="studio-editor-grid"><div class="studio-editor-stack"><article class="admin-card studio-summary-card">' + cardTitle("Carrossel principal", "Crie e ordene as mensagens da primeira dobra.", '<button class="button button--primary" data-action="new-banner">' + icon("plus") + ' Novo slide</button>') + '<div class="studio-spec-row"><span>' + icon("monitor") + '<b>1920 x 800</b><small>desktop</small></span><span>' + icon("smartphone") + '<b>1080 x 1350</b><small>mobile</small></span><span>' + icon("image-down") + '<b>WebP ou JPG</b><small>ate 5 MB</small></span></div><div class="settings-inline">' + toggle("Rotacao automatica", "slider.autoplay", "Troca os slides sem interacao") + toggle("Pausar no hover", "slider.pauseOnHover", "Mantem a leitura confortavel") + field("Intervalo", "slider.interval", { type: "number", help: "Milissegundos" }) + '</div></article><div class="studio-slide-list">' + state.banners.map(function (banner, index) {
      return '<article class="studio-slide-card"><div class="studio-slide-card__image"><img src="' + esc(banner.image) + '" alt=""><span>0' + (index + 1) + '</span></div><div><span class="status-badge ' + (banner.active ? "status-badge--success" : "") + '">' + (banner.active ? "Publicado" : "Pausado") + '</span><h3>' + esc(banner.name) + '</h3><p>' + esc(banner.title) + '</p><small>' + esc(banner.primaryLabel) + ' &middot; camada ' + banner.overlay + '%</small></div><div class="row-actions"><button class="icon-button" data-action="toggle-banner" data-id="' + esc(banner.id) + '" title="' + (banner.active ? "Pausar" : "Ativar") + '">' + icon(banner.active ? "pause" : "play") + '</button><button class="icon-button" data-action="edit-banner" data-id="' + esc(banner.id) + '" title="Editar">' + icon("pencil") + '</button><button class="icon-button" data-action="duplicate-banner" data-id="' + esc(banner.id) + '" title="Duplicar">' + icon("copy") + '</button><button class="icon-button icon-button--danger" data-action="delete-banner" data-id="' + esc(banner.id) + '" title="Excluir">' + icon("trash-2") + '</button></div></article>';
    }).join("") + '</div></div>' + studioPreview("Banner e primeira dobra", "hero") + "</section>";
  }

  function renderStudioHeader() {
    return '<section class="studio-editor-grid"><div class="studio-editor-stack"><article class="admin-card">' + cardTitle("Menu principal", "Edite os links exibidos no cabecalho.", '<button class="button button--ghost" data-action="add-nav-link">' + icon("plus") + ' Adicionar link</button>') + '<div class="editable-list">' + state.navigation.map(function (item, index) {
      return '<div class="editable-row"><span class="drag-handle">' + icon("grip-vertical") + '</span><div class="editable-row__fields"><input value="' + esc(item.label) + '" data-nav-label="' + esc(item.id) + '" aria-label="Nome do link"><input value="' + esc(item.href) + '" data-nav-href="' + esc(item.id) + '" aria-label="Destino do link"></div><button class="icon-button" data-action="move-nav-up" data-id="' + esc(item.id) + '" title="Subir"' + (index === 0 ? " disabled" : "") + '>' + icon("arrow-up") + '</button><button class="icon-button" data-action="toggle-nav" data-id="' + esc(item.id) + '" title="Visibilidade">' + icon(item.visible ? "eye" : "eye-off") + "</button></div>";
    }).join("") + '</div></article><article class="admin-card">' + cardTitle("Marca e acoes", "Elementos permanentes do topo do site.", "") + '<div class="form-grid">' + field("Logo em fundo claro", "brand.logoDark", {}) + field("Telefone", "brand.phone", {}) + field("Area do cliente", "brand.clientAreaUrl", { type: "url" }) + '</div>' + toggle("Permitir troca de tema", "theme.visitorThemeToggle", "Mostra o seletor claro e escuro") + '</article></div>' + studioPreview("Cabecalho do site", "hero") + "</section>";
  }

  function renderStudioFooter() {
    return '<section class="studio-editor-grid"><div class="studio-editor-stack"><article class="admin-card">' + cardTitle("Mensagem institucional", "Conteudo e dados exibidos ao final de todas as paginas.", "") + field("Descricao", "footer.description", { type: "textarea", rows: 3 }) + field("Copyright", "footer.copyright", {}) + '<div class="form-grid">' + field("Telefone", "brand.phone", {}) + field("E-mail", "brand.email", { type: "email" }) + field("Endereco", "brand.address", {}) + field("Area do cliente", "brand.clientAreaUrl", { type: "url" }) + '</div></article><article class="admin-card">' + cardTitle("Colunas de navegacao", "Os links acompanham as jornadas principais do site.", '<span class="status-badge">' + state.footer.columns.length + ' colunas</span>') + '<div class="footer-column-editor">' + state.footer.columns.map(function (column, columnIndex) { return '<div><label class="field"><span>Titulo da coluna</span><input data-footer-column-title="' + columnIndex + '" value="' + esc(column.title) + '"></label>' + column.links.map(function (link, linkIndex) { return '<div class="footer-link-fields"><input data-footer-link-label="' + columnIndex + ':' + linkIndex + '" value="' + esc(link.label) + '" aria-label="Nome do link"><input data-footer-link-href="' + columnIndex + ':' + linkIndex + '" value="' + esc(link.href) + '" aria-label="Destino do link"></div>'; }).join("") + '</div>'; }).join("") + '</div></article></div>' + studioPreview("Rodape completo", "final") + "</section>";
  }

  function renderStudioBrand() {
    const colors = [["Cor principal", "theme.primary"], ["Azul profundo", "theme.primaryDark"], ["Cor de destaque", "theme.accent"], ["Texto", "theme.ink"], ["Fundo", "theme.surface"], ["Superficie", "theme.panel"]];
    return '<section class="studio-brand-layout"><div class="studio-editor-stack"><article class="admin-card theme-presets">' + cardTitle("Sistemas de cor", "Comece por uma direcao visual e personalize os tokens.", '<span class="status-badge">4 estilos</span>') + '<div class="theme-preset-grid">' + Object.entries(THEME_PRESETS).map(function (entry) { const preset = entry[1]; return '<button data-action="apply-theme-preset" data-preset="' + entry[0] + '"><span><i style="background:' + preset.primary + '"></i><i style="background:' + preset.primaryDark + '"></i><i style="background:' + preset.accent + '"></i></span><strong>' + esc(preset.label) + '</strong><small>' + esc(preset.description) + '</small>' + icon("arrow-up-right") + '</button>'; }).join("") + '</div></article><article class="admin-card">' + cardTitle("Paleta da marca", "Tokens aplicados em toda a experiencia.", "") + '<div class="color-grid">' + colors.map(function (item) { return field(item[0], item[1], { type: "color" }); }).join("") + '</div>' + field("Cor do mapa", "theme.mapAccent", { type: "color" }) + '</article><article class="admin-card">' + cardTitle("Componentes", "Defina tipografia, densidade e superficies.", "") + '<div class="form-grid">' + field("Tipografia", "theme.font", { type: "select", options: [{ value: "Inter", label: "Inter" }, { value: "Manrope", label: "Manrope" }, { value: "Arial", label: "Arial" }] }) + field("Densidade", "theme.density", { type: "select", options: [{ value: "compact", label: "Compacta" }, { value: "comfortable", label: "Confortavel" }, { value: "airy", label: "Espacosa" }] }) + field("Botoes", "theme.buttonStyle", { type: "select", options: [{ value: "square", label: "Retos" }, { value: "soft", label: "Suaves" }, { value: "pill", label: "Capsula" }] }) + field("Cards", "theme.cardStyle", { type: "select", options: [{ value: "bordered", label: "Com contorno" }, { value: "elevated", label: "Elevados" }, { value: "flat", label: "Planos" }] }) + field("Sombras", "theme.shadow", { type: "select", options: [{ value: "none", label: "Sem sombra" }, { value: "soft", label: "Suave" }, { value: "strong", label: "Marcante" }] }) + field("Arredondamento", "theme.radius", { type: "number" }) + field("Tema padrao", "theme.defaultMode", { type: "select", options: [{ value: "light", label: "Claro" }, { value: "dark", label: "Escuro" }, { value: "system", label: "Sistema" }] }) + '</div>' + toggle("Animar secoes", "theme.sectionReveal", "Movimento sutil durante a rolagem") + '</article><article class="admin-card">' + cardTitle("Arquivos da marca", "Versoes corretas para fundos claros e escuros.", '<button class="text-button" data-goto="media">Abrir midia ' + icon("arrow-right") + '</button>') + field("Logo em fundo claro", "brand.logoDark", {}) + field("Logo em fundo escuro", "brand.logo", {}) + field("Icone do site", "brand.icon", {}) + '</article></div>' + studioPreview("Identidade aplicada", "hero") + "</section>";
  }

  function renderBuilder() {
    const views = { layout: renderBuilderLayout, slides: renderStudioSlides, header: renderStudioHeader, footer: renderStudioFooter, brand: renderStudioBrand };
    const actions = builderStudioTab === "layout" ? '<button class="button button--ghost" data-action="home-templates">' + icon("layout-template") + ' Modelos</button>' : "";
    return panelHeader("Site Studio", "Edite toda a experiencia do template base em um unico lugar.", '<div class="heading-actions">' + actions + '<button class="button button--ghost" data-action="builder-preview">' + icon("play") + ' Abrir preview</button><button class="button button--primary" data-action="builder-save">' + icon("save") + ' Salvar alteracoes</button></div>') + '<div class="studio-command-bar"><div><span class="live-chip"><i></i> Edicao visual</span><strong>Home principal</strong><small>Rascunho salvo automaticamente</small></div><div><span>' + icon("shield-check") + ' componentes seguros</span><span>' + icon("smartphone") + ' responsivo</span><span>' + icon("history") + ' historico local</span></div></div>' + studioTabs() + (views[builderStudioTab] || renderBuilderLayout)();
  }

  function pageBlockIcon(type) {
    const icons = { hero: "panel-top", text: "text", callout: "message-square-quote", document: "file-text", image: "image", cta: "mouse-pointer-click", faq: "circle-help", stats: "chart-no-axes-column-increasing" };
    return icons[type] || "layout-panel-top";
  }

  function pageBlockField(label, name, value, textarea) {
    if (textarea) return '<label class="field"><span>' + esc(label) + '</span><textarea rows="5" data-page-field="' + esc(name) + '">' + esc(value || "") + "</textarea></label>";
    return '<label class="field"><span>' + esc(label) + '</span><input value="' + esc(value || "") + '" data-page-field="' + esc(name) + '"></label>';
  }

  function pageBlockInspector(block) {
    if (!block) return '<div class="inspector-callout">' + icon("mouse-pointer-2") + '<div><strong>Selecione um bloco</strong><p>Escolha um item na estrutura para editar seu conteudo.</p></div></div>';
    let fields = "";
    if (block.type === "hero") fields += pageBlockField("Chamada curta", "eyebrow", block.eyebrow);
    fields += pageBlockField("Titulo", "title", block.title);
    fields += pageBlockField(block.type === "stats" ? "Indicadores (valor | rotulo por linha)" : block.type === "faq" ? "Perguntas (pergunta | resposta por linha)" : "Texto", "text", block.text, true);
    if (["document", "cta", "image"].includes(block.type)) fields += pageBlockField(block.type === "image" ? "Texto alternativo" : "Texto do botao", "label", block.label);
    if (["document", "cta", "image"].includes(block.type)) fields += pageBlockField(block.type === "image" ? "URL da imagem" : "Destino", "url", block.url);
    if (block.type === "image") fields += '<label class="field"><span>Escolher da biblioteca</span><select data-page-media><option value="">Selecione uma imagem</option>' + state.mediaLibrary.map(function (item) { return '<option value="' + esc(item.url) + '"' + (item.url === block.url ? " selected" : "") + '>' + esc(item.name) + ' (' + item.width + ' x ' + item.height + ')</option>'; }).join("") + '</select><small>Novos arquivos podem ser enviados na Central de midia.</small></label>';
    return fields;
  }

  function renderPages() {
    const page = pageEditId && state.pages.find(function (item) { return item.id === pageEditId; });
    if (page) return renderPageEditor(page);
    const published = state.pages.filter(function (item) { return item.status === "published"; }).length;
    const blocks = state.pages.reduce(function (total, item) { return total + item.blocks.length; }, 0);
    return [
      panelHeader("Paginas do site", "Crie paginas institucionais, documentos e campanhas com blocos reutilizaveis.", '<button class="button button--primary" data-action="new-page">' + icon("plus") + " Nova pagina</button>"),
      '<section class="quick-stats page-stats"><article><span>' + icon("files") + '</span><div><strong>' + state.pages.length + '</strong><small>paginas cadastradas</small></div></article><article><span>' + icon("globe-2") + '</span><div><strong>' + published + '</strong><small>paginas publicadas</small></div></article><article><span>' + icon("layout-template") + '</span><div><strong>' + blocks + '</strong><small>blocos de conteudo</small></div></article><article><span>' + icon("search-check") + '</span><div><strong>SEO</strong><small>titulo e descricao por pagina</small></div></article></section>',
      '<section class="admin-card page-library">',
      cardTitle("Biblioteca de paginas", "Cada pagina possui URL, status e construtor visual proprios.", '<span class="status-badge status-badge--success">Estrutura pronta</span>'),
      '<div class="page-list">' + state.pages.map(function (item) {
        return '<article class="page-row"><span class="page-row__icon">' + icon("file-text") + '</span><div class="page-row__main"><div><strong>' + esc(item.title) + '</strong><span class="status-badge ' + (item.status === "published" ? "status-badge--success" : "") + '">' + (item.status === "published" ? "Publicada" : "Rascunho") + '</span></div><p>/' + esc(item.slug) + '</p><small>' + item.blocks.length + ' blocos &middot; atualizada em ' + esc(item.updatedAt) + '</small></div><div class="row-actions"><button class="button button--ghost" data-action="open-page" data-id="' + esc(item.id) + '">' + icon("external-link") + ' Visualizar</button><button class="icon-button" data-action="edit-page" data-id="' + esc(item.id) + '" title="Abrir construtor">' + icon("panels-top-left") + '</button><button class="icon-button" data-action="page-settings" data-id="' + esc(item.id) + '" title="Configuracoes">' + icon("settings-2") + '</button><button class="icon-button" data-action="duplicate-page" data-id="' + esc(item.id) + '" title="Duplicar">' + icon("copy") + '</button><button class="icon-button icon-button--danger" data-action="delete-page" data-id="' + esc(item.id) + '" title="Excluir">' + icon("trash-2") + "</button></div></article>";
      }).join("") + '</div></section>',
    ].join("");
  }

  function renderPageEditor(page) {
    const block = page.blocks.find(function (item) { return item.id === selectedPageBlockId; }) || page.blocks[0];
    selectedPageBlockId = block ? block.id : null;
    return [
      panelHeader(page.title, "Construtor de pagina interna /" + page.slug, '<div class="heading-actions"><button class="button button--ghost" data-action="back-pages">' + icon("arrow-left") + ' Voltar</button><button class="button button--ghost" data-action="page-settings" data-id="' + esc(page.id) + '">' + icon("settings-2") + ' Configurar</button><button class="button button--primary" data-action="open-page" data-id="' + esc(page.id) + '">' + icon("external-link") + " Visualizar</button></div>"),
      '<section class="builder-toolbar"><div class="builder-device-switch"><button class="' + (pageBuilderDevice === "desktop" ? "is-active" : "") + '" data-page-device="desktop" title="Desktop">' + icon("monitor") + '</button><button class="' + (pageBuilderDevice === "tablet" ? "is-active" : "") + '" data-page-device="tablet" title="Tablet">' + icon("tablet") + '</button><button class="' + (pageBuilderDevice === "mobile" ? "is-active" : "") + '" data-page-device="mobile" title="Celular">' + icon("smartphone") + '</button></div><div class="builder-status"><span><i class="status-dot"></i> ' + (page.status === "published" ? "Pagina publicada" : "Rascunho") + '</span><small>Arraste os blocos para reorganizar</small></div><button class="button button--ghost" data-action="refresh-page-preview">' + icon("refresh-cw") + " Atualizar preview</button></section>",
      '<div class="builder-mobile-tabs" aria-label="Ferramentas do construtor"><button class="' + (pageBuilderMobileTab === "layers" ? "is-active" : "") + '" data-page-builder-tab="layers">' + icon("layers-3") + '<span>Blocos</span></button><button class="' + (pageBuilderMobileTab === "canvas" ? "is-active" : "") + '" data-page-builder-tab="canvas">' + icon("monitor-smartphone") + '<span>Preview</span></button><button class="' + (pageBuilderMobileTab === "inspector" ? "is-active" : "") + '" data-page-builder-tab="inspector">' + icon("sliders-horizontal") + '<span>Editar</span></button></div>',
      '<section class="builder-workspace page-builder-workspace mobile-tab--' + pageBuilderMobileTab + '">',
      '<aside class="builder-layers"><div class="builder-panel-title"><div><strong>Blocos</strong><small>' + page.blocks.length + ' itens na pagina</small></div></div><div class="layer-list" id="page-layer-list">' + page.blocks.map(function (item) {
        return '<article class="layer-item page-block-item' + (item.id === selectedPageBlockId ? " is-selected" : "") + (item.visible === false ? " is-hidden" : "") + '" draggable="true" data-page-block-id="' + esc(item.id) + '"><button class="drag-handle" type="button" title="Arrastar">' + icon("grip-vertical") + '</button><button class="layer-select" type="button" data-select-page-block="' + esc(item.id) + '"><span>' + icon(pageBlockIcon(item.type)) + '</span><div><strong>' + esc(item.title || "Bloco sem titulo") + '</strong><small>' + esc(item.type) + '</small></div></button><button class="layer-visibility" type="button" data-toggle-page-block="' + esc(item.id) + '" title="Visibilidade">' + icon(item.visible === false ? "eye-off" : "eye") + "</button></article>";
      }).join("") + '</div><div class="page-block-palette"><span>Adicionar bloco</span><div><button data-action="add-page-block" data-block-type="text" title="Texto">' + icon("text") + '</button><button data-action="add-page-block" data-block-type="callout" title="Destaque">' + icon("message-square-quote") + '</button><button data-action="add-page-block" data-block-type="document" title="Documento">' + icon("file-text") + '</button><button data-action="add-page-block" data-block-type="image" title="Imagem">' + icon("image") + '</button><button data-action="add-page-block" data-block-type="stats" title="Indicadores">' + icon("chart-no-axes-column-increasing") + '</button><button data-action="add-page-block" data-block-type="faq" title="Perguntas">' + icon("circle-help") + '</button><button data-action="add-page-block" data-block-type="cta" title="Chamada">' + icon("mouse-pointer-click") + "</button></div></div></aside>",
      '<div class="builder-canvas"><div class="preview-frame preview-frame--' + pageBuilderDevice + '"><div class="preview-browser"><span></span><span></span><span></span><div>fibralider.net.br/' + esc(page.slug) + '</div></div><iframe id="page-preview" src="./pagina.html?slug=' + encodeURIComponent(page.slug) + '&preview=1" title="Preview da pagina"></iframe></div></div>',
      '<aside class="builder-inspector"><div class="builder-panel-title"><div><strong>Propriedades</strong><small>' + esc(block ? block.type : "Pagina vazia") + '</small></div></div><div class="inspector-body"><div class="inspector-section"><span class="inspector-label">Conteudo do bloco</span>' + pageBlockInspector(block) + '</div>' + (block ? '<div class="inspector-section"><span class="inspector-label">Acoes</span><div class="inspector-actions"><button class="button button--ghost" data-action="move-page-block-up">' + icon("arrow-up") + ' Subir</button><button class="button button--ghost" data-action="move-page-block-down">' + icon("arrow-down") + ' Descer</button><button class="button button--ghost" data-action="duplicate-page-block">' + icon("copy") + ' Duplicar</button><button class="button button--danger" data-action="delete-page-block">' + icon("trash-2") + " Excluir</button></div></div>" : "") + "</div></aside></section>",
    ].join("");
  }

  function renderBanners() {
    return [
      panelHeader("Banners e slides", "Crie a primeira dobra do site e controle a rotacao das campanhas.", '<div class="heading-actions"><button class="button button--ghost" data-action="preview-site">' + icon("eye") + ' Ver no site</button><button class="button button--primary" data-action="new-banner">' + icon("plus") + " Novo slide</button></div>"),
      '<section class="spec-grid"><article><span>' + icon("monitor") + '</span><div><strong>Desktop</strong><p>1920 x 800 px · WebP ou JPG</p></div></article><article><span>' + icon("smartphone") + '</span><div><strong>Mobile</strong><p>1080 x 1350 px · WebP ou JPG</p></div></article><article><span>' + icon("image") + '</span><div><strong>Arquivo</strong><p>Ate 5 MB · compressao automatica</p></div></article></section>',
      '<section class="admin-card slider-settings">',
      cardTitle("Comportamento do carrossel", "Defina como os slides mudam no site.", ""),
      '<div class="settings-inline">' + toggle("Rotacao automatica", "slider.autoplay", "Troca os slides sem interacao") + toggle("Pausar ao passar o mouse", "slider.pauseOnHover", "Facilita a leitura") + field("Intervalo", "slider.interval", { type: "number", help: "Milissegundos, minimo 3500" }) + "</div></section>",
      '<section class="content-list"><div class="list-header"><div><strong>' + state.banners.length + ' slides</strong><span>' + state.banners.filter(function (item) { return item.active; }).length + ' ativos no site</span></div></div>',
      '<div class="banner-list">' + state.banners.map(function (banner, index) {
        return '<article class="banner-row"><div class="banner-thumb"><img src="' + esc(banner.image) + '" alt=""><span>0' + (index + 1) + '</span></div><div class="banner-info"><div><span class="status-badge ' + (banner.active ? "status-badge--success" : "") + '">' + (banner.active ? "Ativo" : "Pausado") + '</span><small>' + esc(banner.badge) + '</small></div><h3>' + esc(banner.name) + '</h3><p>' + esc(banner.title) + '</p></div><div class="banner-meta"><span><i data-lucide="mouse-pointer-click"></i>' + esc(banner.primaryLabel) + '</span><span><i data-lucide="layers-2"></i>Camada ' + banner.overlay + '%</span></div><div class="row-actions"><button class="icon-button" data-action="toggle-banner" data-id="' + esc(banner.id) + '" title="' + (banner.active ? "Pausar" : "Ativar") + '">' + icon(banner.active ? "pause" : "play") + '</button><button class="icon-button" data-action="edit-banner" data-id="' + esc(banner.id) + '" title="Editar">' + icon("pencil") + '</button><button class="icon-button" data-action="duplicate-banner" data-id="' + esc(banner.id) + '" title="Duplicar">' + icon("copy") + '</button><button class="icon-button icon-button--danger" data-action="delete-banner" data-id="' + esc(banner.id) + '" title="Excluir">' + icon("trash-2") + "</button></div></article>";
      }).join("") + "</div></section>",
    ].join("");
  }

  function renderMedia() {
    const totalBytes = state.mediaLibrary.reduce(function (sum, item) { return sum + Number(item.bytes || 0); }, 0);
    const optimized = state.mediaLibrary.filter(function (item) { return Number(item.originalBytes || 0) > Number(item.bytes || 0); }).length;
    return [
      panelHeader("Central de midia", "Otimize, converta e reutilize imagens sem comprometer a velocidade do site.", '<label class="button button--primary media-upload-button">' + icon("upload") + ' Enviar imagens<input id="media-upload-input" type="file" accept="image/jpeg,image/png,image/webp" multiple></label>'),
      '<section class="quick-stats media-stats"><article><span>' + icon("images") + '</span><div><strong>' + state.mediaLibrary.length + '</strong><small>arquivos na biblioteca</small></div></article><article><span>' + icon("hard-drive") + '</span><div><strong>' + formatBytes(totalBytes) + '</strong><small>peso total das imagens</small></div></article><article><span>' + icon("package-check") + '</span><div><strong>' + optimized + '</strong><small>arquivos otimizados</small></div></article><article><span>' + icon("gauge") + '</span><div><strong>' + formatBytes(mediaSavings()) + '</strong><small>trafego economizado</small></div></article></section>',
      '<section class="admin-card media-optimizer">',
      cardTitle("Otimizador automatico", "As configuracoes abaixo tambem valem para banners, paginas e logos.", '<span class="status-badge status-badge--success">Ativo</span>'),
      '<div class="media-optimizer__layout"><label class="media-dropzone" id="media-dropzone"><input id="media-drop-input" type="file" accept="image/jpeg,image/png,image/webp" multiple><span>' + icon("image-down") + '</span><strong>Arraste imagens para converter</strong><p>JPEG, PNG ou WebP. O arquivo e redimensionado antes de entrar no site.</p><em>Selecionar arquivos</em></label><div class="media-options"><div class="form-grid">' + field("Formato final", "mediaSettings.format", { type: "select", options: [{ value: "image/webp", label: "WebP (recomendado)" }, { value: "image/jpeg", label: "JPEG" }, { value: "image/png", label: "PNG" }] }) + field("Largura maxima", "mediaSettings.maxWidth", { type: "number", help: "Pixels; imagens menores nao sao ampliadas" }) + field("Qualidade", "mediaSettings.quality", { type: "number", help: "Entre 45 e 95" }) + field("Arquivo original", "mediaSettings.maxFileMb", { type: "number", help: "Limite em MB por upload" }) + '</div><div class="optimizer-note">' + icon("zap") + '<div><strong>Preset recomendado para provedores</strong><p>WebP em 82%, ate 1920 px. Equilibra nitidez de banners e carregamento no 4G.</p></div></div></div></div></section>',
      '<section class="media-library"><div class="list-header"><div><strong>Biblioteca</strong><span>Clique em uma imagem para copiar seu endereco</span></div><span>' + formatBytes(stateSize()) + ' usados no armazenamento local</span></div><div class="media-grid">' + state.mediaLibrary.map(function (item) {
        const saving = Number(item.originalBytes || 0) > Number(item.bytes || 0) ? Math.round((1 - Number(item.bytes) / Number(item.originalBytes)) * 100) : 0;
        return '<article class="media-card"><button class="media-card__preview" data-action="copy-media" data-id="' + esc(item.id) + '" title="Copiar endereco"><img src="' + esc(item.url) + '" alt=""></button><div class="media-card__body"><div><strong>' + esc(item.name) + '</strong><span class="status-badge ' + (saving ? "status-badge--success" : "") + '">' + (saving ? "-" + saving + "%" : esc(item.usage || "Original")) + '</span></div><p>' + item.width + ' x ' + item.height + ' px &middot; ' + formatBytes(item.bytes) + '</p><small>' + esc((item.type || "imagem").replace("image/", "").toUpperCase()) + ' &middot; ' + esc(item.usage || "Biblioteca") + '</small></div><div class="media-card__actions"><button class="icon-button" data-action="copy-media" data-id="' + esc(item.id) + '" title="Copiar endereco">' + icon("copy") + '</button><button class="icon-button" data-action="download-media" data-id="' + esc(item.id) + '" title="Baixar">' + icon("download") + '</button><button class="icon-button icon-button--danger" data-action="delete-media" data-id="' + esc(item.id) + '" title="Remover">' + icon("trash-2") + '</button></div></article>';
      }).join("") + '</div></section>',
    ].join("");
  }

  function renderNavigation() {
    return [
      panelHeader("Menu e rodape", "Organize a navegacao e mantenha os dados de contato consistentes.", '<button class="button button--primary" data-action="save-content">' + icon("save") + " Salvar alteracoes</button>"),
      '<section class="two-column-layout"><article class="admin-card">',
      cardTitle("Menu principal", "Reordene, renomeie ou oculte links.", ""),
      '<div class="editable-list">' + state.navigation.map(function (item, index) {
        return '<div class="editable-row"><span class="drag-handle">' + icon("grip-vertical") + '</span><div class="editable-row__fields"><input value="' + esc(item.label) + '" data-nav-label="' + esc(item.id) + '" aria-label="Nome do link"><input value="' + esc(item.href) + '" data-nav-href="' + esc(item.id) + '" aria-label="Destino do link"></div><button class="icon-button" data-action="move-nav-up" data-id="' + esc(item.id) + '" title="Subir"' + (index === 0 ? " disabled" : "") + '>' + icon("arrow-up") + '</button><button class="icon-button" data-action="toggle-nav" data-id="' + esc(item.id) + '" title="Visibilidade">' + icon(item.visible ? "eye" : "eye-off") + "</button></div>";
      }).join("") + '</div><button class="button button--ghost" data-action="add-nav-link">' + icon("plus") + " Adicionar link</button></article>",
      '<div class="stack"><article class="admin-card">' + cardTitle("Rodape", "Texto institucional exibido no final da pagina.", "") + field("Descricao", "footer.description", { type: "textarea", rows: 3 }) + field("Copyright", "footer.copyright", {}) + '</article><article class="admin-card">' + cardTitle("Contato publico", "Estas informacoes aparecem no topo e no rodape.", "") + '<div class="form-grid">' + field("Telefone", "brand.phone", {}) + field("E-mail", "brand.email", { type: "email" }) + field("Endereco", "brand.address", {}) + field("Area do cliente", "brand.clientAreaUrl", { type: "url" }) + "</div></article></div></section>",
    ].join("");
  }

  function renderAppearance() {
    const colors = [["Cor principal", "theme.primary"], ["Azul profundo", "theme.primaryDark"], ["Cor de destaque", "theme.accent"], ["Texto", "theme.ink"], ["Fundo", "theme.surface"], ["Superficie", "theme.panel"]];
    return [
      panelHeader("Identidade visual", "Crie um sistema visual consistente para todas as paginas e dispositivos.", '<div class="heading-actions"><button class="button button--ghost" data-goto="builder">' + icon("panels-top-left") + ' Abrir construtor</button><button class="button button--primary" data-action="save-content">' + icon("save") + " Aplicar identidade</button></div>"),
      '<section class="admin-card theme-presets">' + cardTitle("Cores prontas", "Aplique uma base profissional e personalize os detalhes depois.", '<span class="status-badge">4 estilos</span>') + '<div class="theme-preset-grid">' + Object.entries(THEME_PRESETS).map(function (entry) { const preset = entry[1]; return '<button data-action="apply-theme-preset" data-preset="' + entry[0] + '"><span><i style="background:' + preset.primary + '"></i><i style="background:' + preset.primaryDark + '"></i><i style="background:' + preset.accent + '"></i></span><strong>' + esc(preset.label) + '</strong><small>' + esc(preset.description) + '</small>' + icon("arrow-up-right") + '</button>'; }).join("") + '</div></section>',
      '<section class="appearance-layout appearance-layout--studio"><div class="stack"><article class="admin-card">' + cardTitle("Paleta da marca", "Tokens aplicados em botoes, cards, mapas e estados de foco.", "") + '<div class="color-grid">' + colors.map(function (item) { return field(item[0], item[1], { type: "color" }); }).join("") + '</div>' + field("Cor do mapa", "theme.mapAccent", { type: "color", help: "Usada na cobertura e nos indicadores regionais" }) + '</article><article class="admin-card">' + cardTitle("Componentes", "Ajuste o ritmo visual sem editar CSS.", "") + '<div class="form-grid">' + field("Tipografia", "theme.font", { type: "select", options: [{ value: "Inter", label: "Inter" }, { value: "Manrope", label: "Manrope" }, { value: "Arial", label: "Arial" }] }) + field("Densidade", "theme.density", { type: "select", options: [{ value: "compact", label: "Compacta" }, { value: "comfortable", label: "Confortavel" }, { value: "airy", label: "Espacosa" }] }) + field("Botoes", "theme.buttonStyle", { type: "select", options: [{ value: "square", label: "Retos" }, { value: "soft", label: "Suaves" }, { value: "pill", label: "Capsula" }] }) + field("Cards", "theme.cardStyle", { type: "select", options: [{ value: "bordered", label: "Com contorno" }, { value: "elevated", label: "Elevados" }, { value: "flat", label: "Planos" }] }) + field("Sombras", "theme.shadow", { type: "select", options: [{ value: "none", label: "Sem sombra" }, { value: "soft", label: "Suave" }, { value: "strong", label: "Marcante" }] }) + field("Arredondamento", "theme.radius", { type: "number", help: "Entre 4 e 20 pixels" }) + field("Tema padrao", "theme.defaultMode", { type: "select", options: [{ value: "light", label: "Claro" }, { value: "dark", label: "Escuro" }, { value: "system", label: "Sistema" }] }) + field("Movimento", "theme.motion", { type: "select", options: [{ value: "comfortable", label: "Confortavel" }, { value: "reduced", label: "Reduzido" }] }) + '</div>' + toggle("Animar secoes ao rolar", "theme.sectionReveal", "Revela o conteudo de forma sutil") + toggle("Permitir troca de tema", "theme.visitorThemeToggle", "Mostra o seletor claro/escuro no site") + '</article><article class="admin-card">' + cardTitle("Arquivos da marca", "Use versoes legiveis para fundos claros e escuros.", '<button class="text-button" data-goto="media">Abrir midia ' + icon("arrow-right") + '</button>') + field("Logo para fundo claro", "brand.logoDark", {}) + field("Logo para fundo escuro", "brand.logo", {}) + field("Icone do site", "brand.icon", {}) + '</article></div>',
      '<aside class="theme-live-preview"><div class="theme-live-preview__toolbar"><div><strong>Preview ao vivo</strong><small>Home completa</small></div><div class="segmented-control"><button class="' + (themePreviewMode === "light" ? "is-active" : "") + '" data-action="theme-preview-mode" data-mode="light">' + icon("sun") + '</button><button class="' + (themePreviewMode === "dark" ? "is-active" : "") + '" data-action="theme-preview-mode" data-mode="dark">' + icon("moon") + '</button></div></div><div class="theme-live-preview__frame"><iframe id="theme-live-frame" src="./index.html?preview=1&theme=' + themePreviewMode + '" title="Preview da identidade"></iframe></div><div class="theme-live-preview__footer"><span>' + icon("monitor-smartphone") + ' Atualize os campos para aplicar os tokens</span><button class="text-button" data-action="refresh-theme-preview">Atualizar ' + icon("refresh-cw") + '</button></div></aside></section>',
    ].join("");
  }

  function renderPlans() {
    const plans = state.plans.filter(function (item) { return planFilter === "all" || item.categoryId === planFilter; });
    return [
      panelHeader("Planos e combos", "Gerencie ofertas, beneficios, precos e mensagens comerciais.", '<div class="heading-actions"><button class="button button--ghost" data-action="manage-categories">' + icon("tags") + ' Categorias</button><button class="button button--primary" data-action="new-plan">' + icon("plus") + " Novo plano</button></div>"),
      '<section class="quick-stats"><article><span>' + icon("badge-dollar-sign") + '</span><div><strong>' + state.plans.length + '</strong><small>planos cadastrados</small></div></article><article><span>' + icon("circle-check") + '</span><div><strong>' + state.plans.filter(function (item) { return item.active; }).length + '</strong><small>ofertas ativas</small></div></article><article><span>' + icon("star") + '</span><div><strong>' + state.plans.filter(function (item) { return item.featured; }).length + '</strong><small>planos destacados</small></div></article><article><span>' + icon("wallet-cards") + '</span><div><strong>' + FL.formatCurrency(Math.min.apply(null, state.plans.map(function (item) { return item.price; }))) + '</strong><small>menor mensalidade</small></div></article></section>',
      '<section class="content-toolbar"><div class="search-field">' + icon("search") + '<input id="plan-search" type="search" placeholder="Buscar por nome ou velocidade"></div><select id="plan-category-filter"><option value="all">Todas as categorias</option>' + state.categories.map(function (category) { return '<option value="' + esc(category.id) + '"' + (planFilter === category.id ? " selected" : "") + ">" + esc(category.name) + "</option>"; }).join("") + '</select><span>' + plans.length + " resultados</span></section>",
      '<section class="plan-admin-grid" id="plan-admin-grid">' + plans.map(function (item) {
        return '<article class="plan-admin-card" data-search="' + esc((item.title + " " + item.speed).toLowerCase()) + '"><div class="plan-admin-card__head"><span class="status-badge ' + (item.active ? "status-badge--success" : "") + '">' + (item.active ? "Ativo" : "Inativo") + '</span><div class="row-actions"><button class="icon-button" data-action="edit-plan" data-id="' + esc(item.id) + '" title="Editar">' + icon("pencil") + '</button><button class="icon-button icon-button--danger" data-action="delete-plan" data-id="' + esc(item.id) + '" title="Excluir">' + icon("trash-2") + '</button></div></div><small>' + esc(FL.categoryName(state, item.categoryId)) + '</small><h3>' + esc(item.speed) + '</h3><p>' + esc(item.title) + '</p><strong>' + FL.formatCurrency(item.price) + '<span>/' + esc(item.period) + '</span></strong><ul>' + item.features.slice(0, 3).map(function (feature) { return "<li>" + icon("check") + esc(feature) + "</li>"; }).join("") + '</ul><div class="plan-admin-card__footer"><button data-action="toggle-plan" data-id="' + esc(item.id) + '">' + icon(item.active ? "pause" : "play") + (item.active ? "Pausar" : "Ativar") + '</button><button data-action="duplicate-plan" data-id="' + esc(item.id) + '">' + icon("copy") + "Duplicar</button></div></article>";
      }).join("") + "</section>",
    ].join("");
  }

  function renderCatalog() {
    return [
      panelHeader("Apps e beneficios", "Organize o valor percebido dos planos e os servicos parceiros.", '<button class="button button--primary" data-action="save-content">' + icon("save") + " Salvar conteudo</button>"),
      '<section class="two-column-layout"><article class="admin-card">' + cardTitle("Apps e entretenimento", state.apps.length + " itens exibidos nos combos.", '<button class="button button--ghost" data-action="add-app">' + icon("plus") + " Adicionar</button>") + '<div class="catalog-list">' + state.apps.map(function (item) {
        const logo = item.logo ? '<img src="' + esc(item.logo) + '" alt="">' : esc(item.name.slice(0, 2));
        return '<div><span class="catalog-logo">' + logo + '</span><div><strong>' + esc(item.name) + '</strong><small>' + esc(item.category) + '</small></div><button class="icon-button" data-action="edit-app" data-id="' + esc(item.id) + '">' + icon("pencil") + '</button><button class="icon-button icon-button--danger" data-action="delete-app" data-id="' + esc(item.id) + '">' + icon("trash-2") + "</button></div>";
      }).join("") + '</div></article><article class="admin-card">' + cardTitle("Diferenciais da marca", "Beneficios apresentados logo apos os planos.", '<button class="button button--ghost" data-action="add-benefit">' + icon("plus") + " Adicionar</button>") + '<div class="benefit-admin-list">' + state.benefits.map(function (item) {
        return '<div><span>' + icon(item.icon) + '</span><div><strong>' + esc(item.title) + '</strong><p>' + esc(item.text) + '</p></div><button class="icon-button" data-action="edit-benefit" data-id="' + esc(item.id) + '">' + icon("pencil") + "</button></div>";
      }).join("") + "</div></article></section>",
    ].join("");
  }

  function regionHeatMap() {
    return '<div class="admin-map-shell map-style--' + esc(state.coverageSettings.mapStyle) + '"><div class="admin-map" id="admin-regional-map"></div><div class="map-scale"><span>Menor procura</span><i style="--map-accent:' + esc(state.theme.mapAccent) + '"></i><span>Maior procura</span></div><a class="map-provider-link" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(state.brand.address) + '" target="_blank" rel="noopener">' + icon("route") + ' Abrir no Google Maps</a></div>';
  }

  function kmlElements(root, name) {
    return Array.from(root.getElementsByTagNameNS ? root.getElementsByTagNameNS("*", name) : root.getElementsByTagName(name));
  }

  function kmlDirectText(root, name) {
    const node = Array.from(root.children || []).find(function (child) { return child.localName === name || child.nodeName === name; });
    return node ? String(node.textContent || "").trim().slice(0, 160) : "";
  }

  function parseKmlCoordinates(value, budget) {
    const points = String(value || "").trim().split(/\s+/).map(function (entry) {
      const parts = entry.split(",");
      const lng = Number(parts[0]); const lat = Number(parts[1]);
      return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
    }).filter(Boolean);
    if (!points.length) return [];
    const remaining = Math.max(0, budget.max - budget.used);
    if (!remaining) return [];
    const step = Math.max(1, Math.ceil(points.length / remaining));
    const sampled = points.filter(function (_, index) { return index % step === 0; }).slice(0, remaining);
    if (points.length > 1 && sampled.length > 1 && sampled[sampled.length - 1] !== points[points.length - 1]) sampled[sampled.length - 1] = points[points.length - 1];
    budget.used += sampled.length;
    return sampled;
  }

  function parseKmlDocument(kmlText) {
    kmlText = String(kmlText || "").replace(/^\uFEFF/, "").replace(/^\u00ef\u00bb\u00bf/, "").trim();
    if (kmlText.length > 8 * 1024 * 1024) throw new Error("O KML descompactado ultrapassa 8 MB.");
    if (/<!DOCTYPE|<!ENTITY/i.test(kmlText)) throw new Error("O arquivo contem declaracoes XML nao permitidas.");
    const documentNode = new DOMParser().parseFromString(kmlText, "application/xml");
    if (kmlElements(documentNode, "parsererror").length) throw new Error("O KML possui XML invalido.");
    const budget = { used: 0, max: 20000 };
    const features = [];
    kmlElements(documentNode, "Placemark").slice(0, 100).forEach(function (placemark, placemarkIndex) {
      const name = kmlDirectText(placemark, "name") || "Area " + (placemarkIndex + 1);
      kmlElements(placemark, "Polygon").forEach(function (polygon) {
        const outer = kmlElements(polygon, "outerBoundaryIs")[0] || polygon;
        const coordinates = kmlElements(outer, "coordinates")[0];
        const points = parseKmlCoordinates(coordinates ? coordinates.textContent : "", budget);
        if (points.length >= 3) features.push({ type: "polygon", name, coordinates: points });
      });
      kmlElements(placemark, "LineString").forEach(function (line) {
        const coordinates = kmlElements(line, "coordinates")[0];
        const points = parseKmlCoordinates(coordinates ? coordinates.textContent : "", budget);
        if (points.length >= 2) features.push({ type: "line", name, coordinates: points });
      });
      kmlElements(placemark, "Point").forEach(function (point) {
        const coordinates = kmlElements(point, "coordinates")[0];
        const points = parseKmlCoordinates(coordinates ? coordinates.textContent : "", budget);
        if (points[0]) features.push({ type: "point", name, coordinates: points[0] });
      });
    });
    if (!features.length) throw new Error("Nenhum poligono, linha ou ponto foi encontrado no KML.");
    return { features: features.slice(0, 160), coordinateCount: budget.used };
  }

  async function importCoverageFile(file) {
    if (!file) return;
    const extension = String(file.name.split(".").pop() || "").toLowerCase();
    const limit = Math.max(1, Number(state.coverageSettings.maxImportMb || 5)) * 1024 * 1024;
    if (!["kml", "kmz"].includes(extension)) { toast("Envie um arquivo KML ou KMZ do Google Earth.", "error"); return; }
    if (file.size > limit) { toast("O arquivo ultrapassa o limite de " + state.coverageSettings.maxImportMb + " MB.", "error"); return; }
    try {
      let kmlText;
      if (extension === "kmz") {
        if (!window.JSZip) throw new Error("O leitor KMZ nao foi carregado.");
        const zip = await window.JSZip.loadAsync(await file.arrayBuffer(), { checkCRC32: true });
        const entries = Object.values(zip.files).filter(function (entry) { return !entry.dir && /\.kml$/i.test(entry.name); });
        if (!entries.length) throw new Error("O KMZ nao contem um arquivo KML.");
        const root = entries.find(function (entry) { return /(^|\/)doc\.kml$/i.test(entry.name); }) || entries[0];
        if (root._data && Number(root._data.uncompressedSize || 0) > 8 * 1024 * 1024) throw new Error("O KML descompactado ultrapassa 8 MB.");
        kmlText = await root.async("string");
      } else {
        kmlText = await file.text();
      }
      const parsed = parseKmlDocument(kmlText);
      state.coverageFiles.unshift({ id: FL.uid("coverage"), name: file.name.replace(/\.(kml|kmz)$/i, ""), fileName: file.name, format: extension.toUpperCase(), bytes: file.size, importedAt: new Date().toISOString(), color: state.theme.mapAccent, active: true, coordinateCount: parsed.coordinateCount, features: parsed.features });
      saveDraft(parsed.features.length + " areas importadas do Google Earth");
      renderPanel();
    } catch (error) { toast(error.message || "Nao foi possivel importar a cobertura.", "error"); }
  }

  function initAdminMap() {
    const element = $("#admin-regional-map");
    if (adminMap) { adminMap.remove(); adminMap = null; }
    if (!element || !window.L) return;
    if (element._leaflet_id) delete element._leaflet_id;
    const regions = state.regions.filter(function (region) { return Number.isFinite(Number(region.lat)) && Number.isFinite(Number(region.lng)); });
    const importedFiles = state.coverageFiles.filter(function (file) { return file.active; });
    if (!regions.length && !importedFiles.length) { element.innerHTML = '<div class="empty-state"><h3>Cadastre ou importe uma cobertura</h3><p>Use cidade, CEP, KML ou KMZ para exibir a operacao no mapa.</p></div>'; return; }
    adminMap = window.L.map(element, { scrollWheelZoom: false, zoomControl: true }).setView([Number(state.coverageSettings.centerLat), Number(state.coverageSettings.centerLng)], 11);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(adminMap);
    const bounds = [];
    regions.forEach(function (region) {
      const point = [Number(region.lat), Number(region.lng)];
      const color = region.color || state.theme.mapAccent;
      bounds.push(point);
      window.L.circle(point, { radius: Math.max(500, Number(region.radiusKm || state.coverageSettings.defaultRadiusKm) * 1000), color, fillColor: color, fillOpacity: state.coverageSettings.showInterest ? 0.16 + (Number(region.interest || 0) / 500) : 0.22, weight: 2 }).addTo(adminMap)
        .bindTooltip('<strong>' + esc(region.name) + '</strong><span>' + esc(region.status) + '</span><small>' + region.interest + '% de interesse &middot; ' + region.leads + ' leads &middot; raio ' + esc(region.radiusKm) + ' km</small>', { direction: "top", className: "coverage-tooltip" });
      window.L.circleMarker(point, { radius: 7, color: "#ffffff", fillColor: color, fillOpacity: 1, weight: 2 }).addTo(adminMap)
        .bindTooltip(esc(region.name), { permanent: state.coverageSettings.showLabels, direction: "top", offset: [0, -8], className: "region-map-label" });
    });
    importedFiles.forEach(function (file) {
      const color = file.color || state.theme.mapAccent;
      file.features.forEach(function (feature) {
        if (feature.type === "polygon") {
          window.L.polygon(feature.coordinates, { color, fillColor: color, fillOpacity: Number(state.coverageSettings.importedAreaOpacity || 0.24), weight: 2 }).addTo(adminMap).bindTooltip('<strong>' + esc(feature.name) + '</strong><span>Area importada de ' + esc(file.fileName) + '</span>', { className: "coverage-tooltip" });
          bounds.push.apply(bounds, feature.coordinates);
        } else if (feature.type === "line") {
          window.L.polyline(feature.coordinates, { color, weight: 3, opacity: 0.85 }).addTo(adminMap).bindTooltip(esc(feature.name));
          bounds.push.apply(bounds, feature.coordinates);
        } else if (feature.type === "point") {
          window.L.circleMarker(feature.coordinates, { radius: 6, color: "#ffffff", fillColor: color, fillOpacity: 1, weight: 2 }).addTo(adminMap).bindTooltip(esc(feature.name));
          bounds.push(feature.coordinates);
        }
      });
    });
    adminMap.fitBounds(bounds, { padding: [34, 34], maxZoom: 11 });
    setTimeout(function () { if (adminMap) adminMap.invalidateSize(); }, 80);
  }

  function renderCoverage() {
    const active = state.regions.filter(function (region) { return region.active; }).length;
    const importedFeatures = state.coverageFiles.reduce(function (sum, file) { return sum + (file.active ? file.features.length : 0); }, 0);
    const averageInterest = state.regions.length ? Math.round(state.regions.reduce(function (sum, region) { return sum + Number(region.interest || 0); }, 0) / state.regions.length) : 0;
    const totalLeads = state.regions.reduce(function (sum, region) { return sum + Number(region.leads || 0); }, 0);
    return [
      panelHeader("Cobertura regional", "Combine cidades, CEPs e os poligonos operacionais exportados pelo Google Earth.", '<div class="heading-actions"><label class="button button--ghost file-action">' + icon("file-up") + ' Importar KML/KMZ<input id="coverage-file-input" type="file" accept=".kml,.kmz,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz"></label><button class="button button--primary" data-action="add-region">' + icon("plus") + " Nova area</button></div>"),
      '<section class="quick-stats coverage-stats"><article><span>' + icon("map-pinned") + '</span><div><strong>' + active + '</strong><small>areas manuais publicadas</small></div></article><article><span>' + icon("shapes") + '</span><div><strong>' + importedFeatures + '</strong><small>geometrias importadas</small></div></article><article><span>' + icon("activity") + '</span><div><strong>' + averageInterest + '%</strong><small>interesse medio</small></div></article><article><span>' + icon("message-circle") + '</span><div><strong>' + totalLeads + '</strong><small>leads por regiao</small></div></article></section>',
      '<section class="admin-card coverage-controls">' + cardTitle("Aparencia e consulta", "Personalize o mapa para a marca e o fluxo de viabilidade.", '<span class="status-badge status-badge--success">ViaCEP + rotas Google</span>') + '<div class="settings-inline coverage-settings">' + field("Estilo do mapa", "coverageSettings.mapStyle", { type: "select", options: [{ value: "brand", label: "Cores da marca" }, { value: "street", label: "Mapa limpo" }, { value: "dark", label: "Contraste escuro" }] }) + field("Raio padrao", "coverageSettings.defaultRadiusKm", { type: "number", help: "Quilometros" }) + toggle("Consulta por CEP", "coverageSettings.cepLookup", "Preenche cidade e bairro automaticamente") + toggle("Mostrar nomes", "coverageSettings.showLabels", "Exibe rotulos fixos no mapa") + toggle("Intensidade de interesse", "coverageSettings.showInterest", "A opacidade representa a procura") + '</div></section>',
      '<div class="coverage-integration-notice"><span>' + icon("shield-check") + '</span><div><strong>Importacao local e controlada</strong><p>KML e KMZ sao lidos no navegador, limitados a 5 MB e convertidos somente em pontos, linhas e poligonos seguros. O arquivo original nao e enviado para terceiros.</p></div><a href="https://earth.google.com" target="_blank" rel="noopener">Abrir Google Earth ' + icon("external-link") + '</a></div>',
      '<section class="admin-card coverage-file-manager">' + cardTitle("Arquivos do Google Earth", "Camadas operacionais que complementam os raios e cidades cadastrados.", '<span class="status-badge ' + (state.coverageFiles.length ? "status-badge--success" : "") + '">' + state.coverageFiles.length + ' arquivo(s)</span>') + (state.coverageFiles.length ? '<div class="coverage-file-list">' + state.coverageFiles.map(function (file) { return '<article><span>' + icon("map") + '</span><div><strong>' + esc(file.name) + '</strong><p>' + esc(file.fileName) + '</p><small>' + file.features.length + ' geometrias &middot; ' + file.coordinateCount + ' coordenadas &middot; ' + formatBytes(file.bytes) + '</small></div><label class="color-mini" title="Cor da camada"><input type="color" data-coverage-file-color="' + esc(file.id) + '" value="' + esc(file.color || state.theme.mapAccent) + '"></label><button class="icon-button" data-action="toggle-coverage-file" data-id="' + esc(file.id) + '" title="' + (file.active ? "Ocultar" : "Publicar") + '">' + icon(file.active ? "eye" : "eye-off") + '</button><button class="icon-button icon-button--danger" data-action="delete-coverage-file" data-id="' + esc(file.id) + '" title="Remover">' + icon("trash-2") + '</button></article>'; }).join("") + '</div>' : '<div class="empty-state empty-state--compact">' + icon("file-up") + '<h3>Importe o KMZ da operacao</h3><p>Poligonos de bairros, cidades e rotas aparecerao aqui e no mapa publico.</p></div>') + '</section>',
      '<section class="coverage-admin-layout coverage-admin-layout--pro"><article class="admin-card map-admin-card">' + cardTitle("Mapa de cobertura e interesse", "Raios configurados por area com as cores da marca.", '<span class="live-chip"><i></i> Atualizado agora</span>') + regionHeatMap() + '</article><article class="admin-card region-manager">' + cardTitle("Areas atendidas", "Status, CEP, raio e procura comercial.", "") + '<div class="region-search search-field">' + icon("search") + '<input id="region-search" type="search" placeholder="Buscar cidade, CEP ou status"></div><div class="region-list">' + state.regions.map(function (region) {
        return '<div class="region-admin-row" data-region-search="' + esc((region.name + " " + (region.cep || "") + " " + region.status).toLowerCase()) + '"><span class="region-heat" style="--level:' + region.interest + ';--region-color:' + esc(region.color || state.theme.mapAccent) + '"></span><div><span><strong>' + esc(region.name) + '</strong><em>' + esc(region.type === "cep" ? "CEP" : region.type === "region" ? "Regiao" : "Cidade") + '</em></span><small>' + esc(region.cep || "Sem CEP") + ' &middot; ' + esc(region.radiusKm) + ' km &middot; ' + esc(region.status) + '</small></div><div class="region-numbers"><strong>' + region.leads + '</strong><small>leads</small></div><div class="row-actions"><button class="icon-button" data-action="open-region-route" data-id="' + esc(region.id) + '" title="Abrir rota">' + icon("route") + '</button><button class="icon-button" data-action="toggle-region" data-id="' + esc(region.id) + '" title="' + (region.active ? "Ocultar" : "Publicar") + '">' + icon(region.active ? "eye" : "eye-off") + '</button><button class="icon-button" data-action="edit-region" data-id="' + esc(region.id) + '" title="Editar">' + icon("pencil") + '</button><button class="icon-button icon-button--danger" data-action="delete-region" data-id="' + esc(region.id) + '" title="Excluir">' + icon("trash-2") + '</button></div></div>';
      }).join("") + "</div></article></section>",
    ].join("");
  }

  function renderSupport() {
    const newLeads = state.leads.filter(function (lead) { return lead.status === "new"; }).length;
    const contacted = state.leads.filter(function (lead) { return lead.status === "contacted"; }).length;
    const content = leadWorkspaceTab === "settings" ? renderLeadSettings() : leadWorkspaceTab === "campaigns" ? renderWhatsappCampaigns() : renderLeadPipeline();
    return panelHeader("Leads e WhatsApp", "Transforme interesse em conversas organizadas, sem disparos automaticos.", '<div class="heading-actions"><button class="button button--ghost" data-action="export-leads">' + icon("download") + ' Exportar leads</button><button class="button button--primary" data-action="new-whatsapp-campaign">' + icon("plus") + ' Nova campanha manual</button></div>') + '<section class="quick-stats lead-stats"><article><span>' + icon("contact-round") + '</span><div><strong>' + state.leads.length + '</strong><small>leads capturados</small></div></article><article><span>' + icon("sparkles") + '</span><div><strong>' + newLeads + '</strong><small>aguardando contato</small></div></article><article><span>' + icon("message-circle") + '</span><div><strong>' + contacted + '</strong><small>contatos iniciados</small></div></article><article><span>' + icon("send") + '</span><div><strong>' + state.whatsappCampaigns.filter(function (item) { return item.status === "active"; }).length + '</strong><small>campanhas manuais</small></div></article></section><div class="segmented-control lead-tabs"><button class="' + (leadWorkspaceTab === "leads" ? "is-active" : "") + '" data-lead-tab="leads">Leads</button><button class="' + (leadWorkspaceTab === "campaigns" ? "is-active" : "") + '" data-lead-tab="campaigns">Campanhas manuais</button><button class="' + (leadWorkspaceTab === "settings" ? "is-active" : "") + '" data-lead-tab="settings">Mensagens e captura</button></div>' + content;
  }

  function leadPlan(lead) {
    return state.plans.find(function (plan) { return plan.id === lead.planId; });
  }

  function renderLeadPipeline() {
    return '<section class="admin-card lead-pipeline">' + cardTitle("Fila comercial", "Contatos capturados no site, ordenados pelos mais recentes.", '<span class="status-badge status-badge--success">Atualizacao local</span>') + '<div class="lead-table"><div class="lead-table__head"><span>Contato</span><span>Interesse</span><span>Origem</span><span>Status</span><span>Acao</span></div>' + state.leads.map(function (lead) {
      const plan = leadPlan(lead); const coupon = state.coupons.find(function (item) { return item.id === lead.couponId; });
      return '<article><div class="lead-contact"><span>' + esc((lead.name || "L").slice(0, 2).toUpperCase()) + '</span><div><strong>' + esc(lead.name) + '</strong><small>' + esc(formatPhone(lead.whatsapp)) + '</small></div></div><div><strong>' + esc(plan ? plan.speed + " - " + plan.title : "Plano removido") + '</strong><small>' + esc(coupon ? FL.couponLabel(coupon) : "Sem promocao") + '</small></div><div><strong>' + esc(lead.source || "Site") + '</strong><small>' + dateLabel(lead.createdAt) + '</small></div><div><select data-lead-status="' + esc(lead.id) + '"><option value="new"' + (lead.status === "new" ? " selected" : "") + '>Novo</option><option value="contacted"' + (lead.status === "contacted" ? " selected" : "") + '>Em contato</option><option value="qualified"' + (lead.status === "qualified" ? " selected" : "") + '>Qualificado</option><option value="closed"' + (lead.status === "closed" ? " selected" : "") + '>Convertido</option><option value="lost"' + (lead.status === "lost" ? " selected" : "") + '>Sem retorno</option></select></div><div class="row-actions"><button class="button button--ghost button--compact" data-action="contact-lead" data-id="' + esc(lead.id) + '">' + icon("message-circle") + ' Conversar</button><button class="icon-button icon-button--danger" data-action="delete-lead" data-id="' + esc(lead.id) + '" title="Excluir lead">' + icon("trash-2") + '</button></div></article>';
    }).join("") + (state.leads.length ? "" : '<div class="empty-state">' + icon("contact-round") + '<h3>Nenhum lead capturado</h3><p>Os contatos enviados pela escolha de planos aparecerao aqui.</p></div>') + '</div></section>';
  }

  function renderWhatsappCampaigns() {
    return '<section class="manual-campaign-grid">' + state.whatsappCampaigns.map(function (campaign) {
      const eligible = state.leads.filter(function (lead) { return !campaign.planIds.length || campaign.planIds.includes(lead.planId); });
      return '<article class="admin-card manual-campaign-card"><div class="manual-campaign-card__head"><span>' + icon("message-square-text") + '</span><div><span class="status-badge ' + (campaign.status === "active" ? "status-badge--success" : "") + '">' + (campaign.status === "active" ? "Ativa" : "Rascunho") + '</span><h3>' + esc(campaign.name) + '</h3></div><button class="icon-button" data-action="edit-whatsapp-campaign" data-id="' + esc(campaign.id) + '" title="Editar">' + icon("pencil") + '</button></div><p>' + esc(campaign.message) + '</p><div class="campaign-audience"><span>' + icon("users") + '<strong>' + eligible.length + '</strong> leads compativeis</span><span>' + icon("send") + '<strong>' + campaign.contactsSent + '</strong> contatos abertos</span></div><div class="manual-lead-queue">' + eligible.slice(0, 4).map(function (lead) { const plan = leadPlan(lead); return '<div><span>' + esc((lead.name || "L").slice(0, 2).toUpperCase()) + '</span><div><strong>' + esc(lead.name) + '</strong><small>' + esc(plan ? plan.speed : "Sem plano") + '</small></div><button class="icon-button" data-action="contact-lead" data-id="' + esc(lead.id) + '" data-campaign-id="' + esc(campaign.id) + '" title="Abrir conversa">' + icon("send") + '</button></div>'; }).join("") + '</div></article>';
    }).join("") + (state.whatsappCampaigns.length ? "" : '<div class="empty-state">' + icon("message-square-text") + '<h3>Nenhuma campanha manual</h3><p>Crie uma mensagem e selecione os planos que definem o publico.</p></div>') + '</section><div class="security-notice">' + icon("shield-check") + '<div><strong>Envio individual e consciente</strong><p>O sistema apenas prepara a mensagem. Cada conversa e aberta manualmente pelo atendente, sem disparo em massa ou automacao nao autorizada.</p></div></div>';
  }

  function renderLeadSettings() {
    return '<section class="two-column-layout"><div class="stack"><article class="admin-card">' + cardTitle("Captura de interesse", "Defina o que acontece antes de abrir o WhatsApp.", "") + toggle("Capturar lead antes do WhatsApp", "leadSettings.captureEnabled", "Solicita nome e numero no clique do plano") + toggle("WhatsApp obrigatorio", "leadSettings.requireWhatsapp", "Evita registros sem canal de retorno") + field("Texto de consentimento", "leadSettings.consentText", { type: "textarea", rows: 3 }) + field("Retencao planejada", "leadSettings.retentionDays", { type: "number", help: "Dias; no SaaS sera aplicada por rotina automatica" }) + '</article><article class="admin-card">' + cardTitle("Mensagens do WhatsApp", "Variaveis sao preenchidas com o interesse capturado.", "") + field("Mensagem do plano", "whatsapp.planTemplate", { type: "textarea", rows: 9, help: "Variaveis: {name}, {leadWhatsapp}, {plan}, {speed}, {price}, {category}, {offer}" }) + field("Mensagem de cobertura", "whatsapp.coverageTemplate", { type: "textarea", rows: 5, help: "Variaveis: {cep}, {city}, {neighborhood}" }) + field("Botao flutuante", "whatsapp.floatingMessage", { type: "textarea", rows: 3 }) + '</article></div><article class="admin-card">' + cardTitle("Canais publicos", "Numeros e atalhos usados no site.", "") + '<div class="form-grid">' + field("WhatsApp principal", "brand.whatsapp", { help: "DDI + DDD + numero" }) + field("WhatsApp secundario", "brand.whatsappSecondary", {}) + '</div><div class="support-admin-list">' + state.supportCards.map(function (item) { return '<div><span>' + icon(item.icon) + '</span><div><strong>' + esc(item.title) + '</strong><p>' + esc(item.text) + '</p><small>' + esc(item.label) + '</small></div><button class="icon-button" data-action="edit-support" data-id="' + esc(item.id) + '">' + icon("pencil") + '</button><button class="icon-button" data-action="toggle-support" data-id="' + esc(item.id) + '">' + icon(item.active ? "eye" : "eye-off") + '</button></div>'; }).join("") + '</div></article></section>';
  }

  function renderCampaigns() {
    const couponUsage = state.coupons.reduce(function (sum, item) { return sum + Number(item.used || 0); }, 0);
    return [
      panelHeader("Campanhas e cupons", "Crie popups comerciais com regras de exibicao e acompanhe o uso dos codigos.", '<div class="heading-actions"><button class="button button--ghost" data-action="new-coupon">' + icon("ticket-percent") + ' Novo cupom</button><button class="button button--primary" data-action="new-popup">' + icon("plus") + " Nova campanha</button></div>"),
      '<section class="campaign-overview"><article><span>' + icon("megaphone") + '</span><div><strong>' + state.popupCampaigns.filter(function (item) { return item.active; }).length + '</strong><small>popups ativos</small></div></article><article><span>' + icon("ticket-percent") + '</span><div><strong>' + state.coupons.filter(function (item) { return item.active; }).length + '</strong><small>cupons validos</small></div></article><article><span>' + icon("copy-check") + '</span><div><strong>' + couponUsage + '</strong><small>usos registrados</small></div></article><article><span>' + icon("mouse-pointer-click") + '</span><div><strong>8,7%</strong><small>taxa de interacao</small></div></article></section>',
      '<div class="segmented-control campaign-tabs"><button class="' + (activeCampaignTab === "popups" ? "is-active" : "") + '" data-campaign-tab="popups">Popups</button><button class="' + (activeCampaignTab === "coupons" ? "is-active" : "") + '" data-campaign-tab="coupons">Cupons</button></div>',
      activeCampaignTab === "popups" ? renderPopupList() : renderCouponList(),
    ].join("");
  }

  function renderPopupList() {
    return '<section class="campaign-grid">' + state.popupCampaigns.map(function (item) {
      const coupon = state.coupons.find(function (couponItem) { return couponItem.id === item.couponId; });
      return '<article class="campaign-card"><div class="campaign-card__preview"><img src="' + esc(item.image) + '" alt=""><span class="status-badge ' + (item.active ? "status-badge--success" : "") + '">' + (item.active ? "Ativa" : "Pausada") + '</span></div><div class="campaign-card__body"><small>' + esc(item.eyebrow) + '</small><h3>' + esc(item.name) + '</h3><p>' + esc(item.title) + '</p><div class="campaign-rules"><span>' + icon("timer") + (item.trigger === "delay" ? "Apos " + item.delaySeconds + " segundos" : item.trigger === "scroll" ? "Ao rolar " + item.scrollPercent + "%" : "Intencao de saida") + '</span><span>' + icon("ticket-percent") + esc(coupon ? coupon.code : "Sem cupom") + '</span><span>' + icon("calendar") + esc(item.expiresAt || "Sem prazo") + '</span></div></div><div class="campaign-card__actions"><button class="button button--ghost" data-action="preview-popup" data-id="' + esc(item.id) + '">' + icon("eye") + ' Visualizar</button><button class="icon-button" data-action="edit-popup" data-id="' + esc(item.id) + '">' + icon("pencil") + '</button><button class="icon-button" data-action="toggle-popup" data-id="' + esc(item.id) + '">' + icon(item.active ? "pause" : "play") + "</button></div></article>";
    }).join("") + (state.popupCampaigns.length ? "" : '<div class="empty-state">' + icon("megaphone") + "<h3>Nenhuma campanha criada</h3><p>Crie um popup para destacar uma oferta ou cupom.</p></div>") + "</section>";
  }

  function renderCouponList() {
    return '<section class="coupon-grid">' + state.coupons.map(function (item) {
      const percent = Math.min(100, (Number(item.used || 0) / Math.max(1, Number(item.usageLimit || 1))) * 100);
      return '<article class="coupon-card"><div class="coupon-card__top"><span class="status-badge ' + (item.active ? "status-badge--success" : "") + '">' + (item.active ? "Ativo" : "Inativo") + '</span><div class="row-actions"><button class="icon-button" data-action="edit-coupon" data-id="' + esc(item.id) + '">' + icon("pencil") + '</button><button class="icon-button icon-button--danger" data-action="delete-coupon" data-id="' + esc(item.id) + '">' + icon("trash-2") + '</button></div></div><small>' + esc(item.title) + '</small><button class="coupon-big-code" data-action="copy-code" data-code="' + esc(item.code) + '">' + esc(item.code) + icon("copy") + '</button><strong>' + esc(FL.couponLabel(item)) + '</strong><p>' + esc(item.description) + '</p><div class="coupon-progress"><span><b>' + item.used + '</b> de ' + item.usageLimit + ' usos</span><div><i style="width:' + percent + '%"></i></div></div><footer><span>' + icon("calendar") + " Valido ate " + esc(item.expiresAt || "sem prazo") + '</span><button data-action="toggle-coupon" data-id="' + esc(item.id) + '">' + (item.active ? "Pausar" : "Ativar") + "</button></footer></article>";
    }).join("") + "</section>";
  }

  function renderSeo() {
    const titleLength = state.seo.title.length;
    const descriptionLength = state.seo.description.length;
    return [
      panelHeader("SEO local", "Prepare a Fibra Lider para buscas por internet na regiao atendida.", '<button class="button button--primary" data-action="save-content">' + icon("save") + " Salvar SEO</button>"),
      '<section class="seo-layout"><div class="stack"><article class="admin-card">' + cardTitle("Aparencia no Google", "Titulo e descricao usados nos resultados de busca.", "") + field("Titulo da pagina", "seo.title", { help: titleLength + "/60 caracteres" }) + field("Descricao", "seo.description", { type: "textarea", rows: 4, help: descriptionLength + "/160 caracteres" }) + field("Palavras-chave locais", "seo.keywords", { type: "textarea", rows: 3 }) + field("URL canonica", "seo.canonicalUrl", { type: "url" }) + '</article><article class="admin-card">' + cardTitle("Negocio local", "Dados estruturados para a area de atendimento.", "") + field("Regioes atendidas", "seo.serviceArea", { type: "textarea", rows: 3 }) + field("Verificacao do Google", "seo.googleSiteVerification", { placeholder: "Codigo de verificacao" }) + toggle("Permitir indexacao", "seo.indexSite", "Autoriza buscadores a indexar o site") + '</article></div><aside class="stack"><article class="admin-card google-preview">' + cardTitle("Previa do resultado", "Simulacao do snippet exibido na busca.", "") + '<div class="search-snippet"><span>fibralider.net.br</span><h3>' + esc(state.seo.title) + '</h3><p>' + esc(state.seo.description) + '</p></div></article><article class="admin-card seo-checklist">' + cardTitle("Saude da indexacao", "Itens tecnicos do site.", '<strong class="score-ring">92</strong>') + '<ul><li>' + icon("circle-check") + '<span><strong>Sitemap XML</strong><small>/sitemap.xml disponivel</small></span></li><li>' + icon("circle-check") + '<span><strong>Robots.txt</strong><small>Configurado para indexacao</small></span></li><li>' + icon("circle-check") + '<span><strong>Dados estruturados</strong><small>InternetServiceProvider e area atendida</small></span></li><li>' + icon("triangle-alert") + '<span><strong>Google Business Profile</strong><small>Vinculacao pendente no ambiente final</small></span></li></ul></article></aside></section>',
    ].join("");
  }

  function integrationCard(name, description, iconName, enabledPath, idPath, placeholder) {
    return '<article class="integration-card"><div class="integration-card__head"><span>' + icon(iconName) + '</span><div><h3>' + esc(name) + '</h3><p>' + esc(description) + '</p></div><label class="mini-switch"><input type="checkbox" data-bind="' + esc(enabledPath) + '"' + (getPath(enabledPath) ? " checked" : "") + '><i></i></label></div><label class="field"><span>ID da integracao</span><input value="' + esc(getPath(idPath)) + '" data-bind="' + esc(idPath) + '" placeholder="' + esc(placeholder) + '"></label><footer><span class="' + (getPath(enabledPath) && getPath(idPath) ? "connected" : "") + '"><i></i>' + (getPath(enabledPath) && getPath(idPath) ? "Configurado" : "Aguardando configuracao") + "</span></footer></article>";
  }

  function renderPixels() {
    return [
      panelHeader("Pixels e analytics", "Centralize as tags de mensuracao sem alterar o codigo do site.", '<button class="button button--primary" data-action="save-content">' + icon("save") + " Salvar integracoes</button>"),
      '<div class="security-notice">' + icon("shield-check") + '<div><strong>Carregamento condicionado ao consentimento</strong><p>Tags de marketing so sao ativadas quando o visitante aceita cookies. IDs sao validados antes da injecao.</p></div></div>',
      '<section class="integration-grid">',
      integrationCard("Google Analytics 4", "Visitas, sessoes, eventos e jornadas.", "chart-no-axes-combined", "integrations.ga4Enabled", "integrations.ga4Id", "G-XXXXXXXXXX"),
      integrationCard("Meta Pixel", "Conversoes para Facebook e Instagram.", "facebook", "integrations.metaPixelEnabled", "integrations.metaPixelId", "123456789012345"),
      integrationCard("Google Ads", "Conversoes das campanhas de pesquisa.", "badge-dollar-sign", "integrations.googleAdsEnabled", "integrations.googleAdsId", "AW-XXXXXXXXX"),
      integrationCard("Google Tag Manager", "Container opcional para tags adicionais.", "tags", "integrations.gtmEnabled", "integrations.gtmId", "GTM-XXXXXXX"),
      '</section><section class="admin-card event-catalog">' + cardTitle("Eventos preparados", "Acoes comerciais enviadas para as integracoes ativas.", "") + '<div><span>' + icon("eye") + '<b>page_view</b><small>Visualizacao da home</small></span><span>' + icon("mouse-pointer-click") + '<b>plan_click</b><small>Interesse em um plano</small></span><span>' + icon("contact-round") + '<b>lead_capture</b><small>Formulario comercial enviado</small></span><span>' + icon("message-circle") + '<b>whatsapp_click</b><small>Inicio de conversa</small></span><span>' + icon("map-pin") + '<b>coverage_search</b><small>Consulta regional</small></span><span>' + icon("ticket-percent") + '<b>coupon_copy</b><small>Copia de cupom</small></span></div></section>',
    ].join("");
  }

  function renderAnalytics() {
    const data = analyticsData();
    const sources = Object.entries(groupByPayload(data.events, "source")).sort(function (a, b) { return b[1] - a[1]; });
    const regions = Object.entries(groupByPayload(data.events, "region")).sort(function (a, b) { return b[1] - a[1]; });
    return [
      panelHeader("Desempenho", "Entenda canais, dispositivos, conversoes e oportunidades comerciais.", '<div class="heading-actions"><select class="compact-select"><option>28 dias</option><option>7 dias</option><option>Hoje</option></select><button class="button button--ghost" data-action="export-report">' + icon("download") + " Exportar CSV</button></div>"),
      '<section class="metrics-grid">' + metricCard("Visitantes", data.views, "+12,8%", "comparado ao periodo anterior", "users", "blue") + metricCard("CTR dos planos", (data.views ? (data.planClicks / data.views) * 100 : 0).toFixed(1).replace(".", ",") + "%", "+3,1%", "cliques sobre visitas", "mouse-pointer-click", "violet") + metricCard("Conversao em lead", data.conversion.toFixed(1).replace(".", ",") + "%", "+1,4%", "formularios sobre visitas", "contact-round", "green") + metricCard("Cobertura consultada", data.coverage, "+6,7%", "buscas no periodo", "map-pin-check", "orange") + '</section>',
      '<section class="analytics-layout"><article class="admin-card">' + cardTitle("Canais de aquisicao", "Participacao por origem de trafego.", "") + '<div class="donut-layout"><div class="donut-chart" style="--a:37%;--b:64%;--c:82%"><strong>' + data.views + '<small>visitas</small></strong></div><div class="donut-legend">' + sources.slice(0, 5).map(function (entry, index) { return '<div><i class="dot-' + (index + 1) + '"></i><span>' + esc(entry[0]) + '</span><strong>' + entry[1] + "</strong></div>"; }).join("") + '</div></div></article><article class="admin-card">' + cardTitle("Demanda por regiao", "Interacoes identificadas por cidade.", "") + '<div class="horizontal-bars">' + regions.map(function (entry, index) { const max = regions[0] ? regions[0][1] : 1; return '<div><span>' + esc(entry[0]) + '</span><div><i style="width:' + (entry[1] / max) * 100 + '%"></i></div><strong>' + entry[1] + "</strong></div>"; }).join("") + '</div></article><article class="admin-card device-card">' + cardTitle("Dispositivos", "Distribuicao estimada por viewport.", "") + '<div class="device-bars"><div><span>' + icon("smartphone") + ' Celular</span><strong>68%</strong><i><b style="width:68%"></b></i></div><div><span>' + icon("monitor") + ' Desktop</span><strong>27%</strong><i><b style="width:27%"></b></i></div><div><span>' + icon("tablet") + ' Tablet</span><strong>5%</strong><i><b style="width:5%"></b></i></div></div></article></section>',
    ].join("");
  }

  function renderHeatmap() {
    const sorted = state.regions.slice().sort(function (a, b) { return b.interest - a.interest; });
    return [
      panelHeader("Mapa de interesse", "Cruze consultas, cliques e leads para orientar expansao e anuncios regionais.", '<button class="button button--ghost" data-action="export-report">' + icon("download") + " Exportar dados</button>"),
      '<section class="heatmap-layout"><article class="admin-card map-admin-card">' + cardTitle("Intensidade regional", "Quanto mais brilhante, maior o interesse comercial.", '<select class="compact-select"><option>Todos os eventos</option><option>Leads WhatsApp</option><option>Consultas</option></select>') + regionHeatMap() + '</article><aside class="admin-card">' + cardTitle("Prioridades comerciais", "Regioes ordenadas por potencial.", "") + '<div class="priority-list">' + sorted.map(function (region, index) {
        const status = region.interest >= 75 ? "Alta prioridade" : region.interest >= 50 ? "Monitorar" : "Em observacao";
        return '<div><span class="rank">0' + (index + 1) + '</span><div><strong>' + esc(region.name) + '</strong><small>' + status + '</small><i><b style="width:' + region.interest + '%"></b></i></div><em>' + region.interest + "%</em></div>";
      }).join("") + '</div></aside></section><section class="admin-card insight-banner">' + icon("lightbulb") + '<div><strong>Oportunidade identificada</strong><p>Sumare e Hortolandia concentram a maior parte do interesse. Campanhas de 600 Mega nessas regioes tendem a ter melhor retorno.</p></div><button class="button button--ghost" data-goto="campaigns">Criar campanha</button></section>',
    ].join("");
  }

  function renderSettings() {
    return [
      panelHeader("Configuracoes", "Dados institucionais, links do sistema e manutencao do prototipo.", '<button class="button button--primary" data-action="save-content">' + icon("save") + " Salvar configuracoes</button>"),
      '<section class="settings-layout"><div class="stack"><article class="admin-card">' + cardTitle("Dados da empresa", "Informacoes usadas no site e nos dados estruturados.", "") + '<div class="form-grid">' + field("Nome da marca", "brand.name", {}) + field("Razao social", "brand.legalName", {}) + field("CNPJ", "brand.cnpj", {}) + field("E-mail", "brand.email", { type: "email" }) + field("Instagram", "brand.instagram", { type: "url" }) + field("Facebook", "brand.facebook", { type: "url" }) + '</div>' + field("Resumo da cobertura", "brand.coverageSummary", {}) + '</article><article class="admin-card">' + cardTitle("Area do cliente", "O sistema do assinante continua externo a este produto.", "") + field("URL de acesso", "brand.clientAreaUrl", { type: "url" }) + '<div class="external-system">' + icon("external-link") + '<div><strong>Central SGP</strong><p>O link abre em nova aba e nao compartilha credenciais com este painel.</p></div><a href="' + esc(state.brand.clientAreaUrl) + '" target="_blank" rel="noopener">Testar acesso</a></div></article></div><aside class="stack"><article class="admin-card">' + cardTitle("Publicacao", "Estado atual desta configuracao.", "") + '<div class="publication-status"><span>' + icon(state.meta.status === "published" ? "circle-check" : "clock-3") + '</span><div><strong>' + (state.meta.status === "published" ? "Site publicado" : "Alteracoes em rascunho") + '</strong><p>Ultima publicacao em ' + dateLabel(state.meta.publishedAt) + '</p></div></div><button class="button button--primary button--block" data-action="publish">' + icon("rocket") + ' Publicar agora</button></article><article class="admin-card danger-zone">' + cardTitle("Dados do prototipo", "Ferramentas para transferencia e recuperacao.", "") + '<button class="button button--ghost button--block" data-action="export-state">' + icon("download") + ' Exportar configuracao</button><label class="button button--ghost button--block file-action">' + icon("upload") + ' Importar configuracao<input id="import-state-file" type="file" accept="application/json"></label><button class="button button--danger button--block" data-action="reset-state">' + icon("rotate-ccw") + " Restaurar padrao</button></article></aside></section>",
    ].join("");
  }

  function renderPanel() {
    const renderers = {
      dashboard: renderDashboard, builder: renderBuilder, pages: renderPages, banners: renderBanners, media: renderMedia, navigation: renderNavigation,
      appearance: renderAppearance, plans: renderPlans, catalog: renderCatalog, coverage: renderCoverage,
      support: renderSupport, campaigns: renderCampaigns, seo: renderSeo, pixels: renderPixels,
      analytics: renderAnalytics, heatmap: renderHeatmap, settings: renderSettings,
    };
    $("#admin-panel").innerHTML = (renderers[activePanel] || renderDashboard)();
    const meta = PANEL_META[activePanel] || PANEL_META.dashboard;
    $("#panel-title").textContent = meta[0];
    $("#topbar-section").textContent = meta[1];
    $$("#admin-nav [data-panel]").forEach(function (button) { button.classList.toggle("is-active", button.dataset.panel === activePanel); });
    $("#nav-plan-count").textContent = state.plans.filter(function (item) { return item.active; }).length;
    bindPanelControls();
    initAdminMap();
    refreshIcons();
  }

  function setPanel(panel) {
    const studioAliases = { banners: "slides", navigation: "header", appearance: "brand" };
    if (studioAliases[panel]) { builderStudioTab = studioAliases[panel]; panel = "builder"; }
    if (!PANEL_META[panel]) panel = "dashboard";
    activePanel = panel;
    history.replaceState(null, "", "#" + panel);
    document.body.classList.remove("sidebar-open");
    renderPanel();
    $("#admin-panel").focus({ preventScroll: true });
  }

  function moveInArray(array, id, direction) {
    const index = array.findIndex(function (item) { return item.id === id; });
    const target = index + direction;
    if (index < 0 || target < 0 || target >= array.length) return;
    const item = array.splice(index, 1)[0];
    array.splice(target, 0, item);
  }

  function openModal(html, wide) {
    $("#admin-modal-content").innerHTML = html;
    $("#admin-modal .admin-modal__dialog").classList.toggle("admin-modal__dialog--wide", Boolean(wide));
    $("#admin-modal").hidden = false;
    document.body.classList.add("modal-open");
    bindModalControls();
    refreshIcons();
  }

  function closeModal() {
    $("#admin-modal").hidden = true;
    document.body.classList.remove("modal-open");
  }

  function modalHeader(title, description) {
    return '<div class="modal-heading"><span class="eyebrow">Fibra Site OS</span><h2>' + esc(title) + '</h2><p>' + esc(description) + "</p></div>";
  }

  function sectionLibraryModal() {
    openModal(modalHeader("Adicionar secao", "Escolha uma estrutura pronta. Todo o conteudo, layout e estilo poderao ser alterados no inspetor.") + '<div class="section-library">' + Object.entries(HOME_SECTION_LIBRARY).map(function (entry) {
      const item = entry[1];
      return '<button data-add-home-section="' + esc(entry[0]) + '"><span>' + icon(item.icon) + '</span><div><strong>' + esc(item.label) + '</strong><p>' + esc(item.description) + '</p></div>' + icon("plus") + "</button>";
    }).join("") + '</div><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button></div>', true);
  }

  function homeTemplatesModal() {
    openModal(modalHeader("Modelos de pagina inicial", "Aplique uma jornada pronta sem apagar os blocos personalizados que voce ja criou.") + '<div class="home-template-grid">' + Object.entries(HOME_TEMPLATES).map(function (entry, index) {
      const item = entry[1];
      return '<article><div class="template-wireframe template-wireframe--' + (index + 1) + '"><i></i><i></i><i></i><i></i><i></i></div><span class="status-badge">' + item.order.length + ' secoes</span><h3>' + esc(item.label) + '</h3><p>' + esc(item.description) + '</p><button class="button button--ghost button--block" data-apply-home-template="' + esc(entry[0]) + '">' + icon("layout-template") + ' Aplicar modelo</button></article>';
    }).join("") + '</div><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button></div>', true);
  }

  function addHomeSection(type) {
    if (!HOME_SECTION_LIBRARY[type]) return;
    recordBuilderHistory();
    const block = homeSectionDefaults(type);
    const finalIndex = state.pageBlocks.findIndex(function (item) { return item.id === "final"; });
    if (finalIndex >= 0) state.pageBlocks.splice(finalIndex, 0, block); else state.pageBlocks.push(block);
    selectedBlockId = block.id;
    builderInspectorTab = "content";
    saveDraft("Secao adicionada");
    closeModal();
    renderPanel();
  }

  function applyHomeTemplate(templateId) {
    const template = HOME_TEMPLATES[templateId];
    if (!template) return;
    recordBuilderHistory();
    const custom = state.pageBlocks.filter(function (item) { return String(item.type).startsWith("custom-"); });
    const fixed = state.pageBlocks.filter(function (item) { return !String(item.type).startsWith("custom-"); });
    const hidden = new Set(template.hidden || []);
    fixed.forEach(function (item) { item.visible = !hidden.has(item.id); });
    const ordered = template.order.map(function (id) { return fixed.find(function (item) { return item.id === id; }); }).filter(Boolean);
    const remaining = fixed.filter(function (item) { return !template.order.includes(item.id); });
    const finalIndex = ordered.findIndex(function (item) { return item.id === "final"; });
    if (finalIndex >= 0) ordered.splice.apply(ordered, [finalIndex, 0].concat(custom)); else ordered.push.apply(ordered, custom);
    state.pageBlocks = ordered.concat(remaining);
    selectedBlockId = state.pageBlocks[0].id;
    saveDraft("Modelo " + template.label + " aplicado");
    closeModal();
    renderPanel();
  }

  function bannerModal(item) {
    const banner = item || { id: "", name: "", eyebrow: "", title: "", subtitle: "", image: "", mobileImage: "", primaryLabel: "Conhecer planos", primaryLink: "#planos", secondaryLabel: "Consultar cobertura", secondaryLink: "#cobertura", badge: "", position: "center", overlay: 65, active: true };
    openModal(modalHeader(item ? "Editar slide" : "Novo slide", "Use uma imagem forte, texto curto e uma chamada clara.") + '<form class="modal-form" data-form-kind="banner"><input type="hidden" name="id" value="' + esc(banner.id) + '"><div class="form-grid"><label class="field"><span>Nome interno</span><input name="name" value="' + esc(banner.name) + '" required></label><label class="field"><span>Selo</span><input name="badge" value="' + esc(banner.badge) + '"></label></div><label class="field"><span>Chamada curta</span><input name="eyebrow" value="' + esc(banner.eyebrow) + '" required></label><label class="field"><span>Titulo principal</span><input name="title" value="' + esc(banner.title) + '" required></label><label class="field"><span>Descricao</span><textarea name="subtitle" rows="3" required>' + esc(banner.subtitle) + '</textarea></label><div class="upload-zone"><input id="banner-image-file" type="file" accept="image/jpeg,image/png,image/webp"><span>' + icon("image-up") + '</span><div><strong>Imagem desktop</strong><p>1920 x 800 px, WebP ou JPG. A imagem sera otimizada automaticamente.</p></div></div><label class="field"><span>URL ou imagem atual</span><input name="image" value="' + esc(banner.image) + '" required></label><div class="form-grid"><label class="field"><span>Botao principal</span><input name="primaryLabel" value="' + esc(banner.primaryLabel) + '"></label><label class="field"><span>Destino</span><input name="primaryLink" value="' + esc(banner.primaryLink) + '"></label><label class="field"><span>Botao secundario</span><input name="secondaryLabel" value="' + esc(banner.secondaryLabel) + '"></label><label class="field"><span>Destino secundario</span><input name="secondaryLink" value="' + esc(banner.secondaryLink) + '"></label><label class="field"><span>Posicao da imagem</span><select name="position"><option value="left"' + (banner.position === "left" ? " selected" : "") + '>Esquerda</option><option value="center"' + (banner.position === "center" ? " selected" : "") + '>Centro</option><option value="right"' + (banner.position === "right" ? " selected" : "") + '>Direita</option></select></label><label class="field"><span>Camada escura (%)</span><input name="overlay" type="number" min="35" max="90" value="' + banner.overlay + '"></label></div><label class="check-field"><input name="active" type="checkbox"' + (banner.active ? " checked" : "") + '><span>Publicar este slide</span></label><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + " Salvar slide</button></div></form>", true);
  }

  function planModal(item) {
    const plan = item || { id: "", categoryId: state.categories[0].id, title: "", speed: "", price: "", period: "mes", badge: "", note: "", features: [], active: true, featured: false };
    openModal(modalHeader(item ? "Editar plano" : "Novo plano", "Cadastre a oferta comercial e os beneficios que aparecem no card.") + '<form class="modal-form" data-form-kind="plan"><input type="hidden" name="id" value="' + esc(plan.id) + '"><div class="form-grid"><label class="field"><span>Nome do plano</span><input name="title" value="' + esc(plan.title) + '" required></label><label class="field"><span>Categoria</span><select name="categoryId">' + state.categories.map(function (category) { return '<option value="' + esc(category.id) + '"' + (category.id === plan.categoryId ? " selected" : "") + ">" + esc(category.name) + "</option>"; }).join("") + '</select></label><label class="field"><span>Velocidade</span><input name="speed" value="' + esc(plan.speed) + '" placeholder="600 MEGA" required></label><label class="field"><span>Mensalidade</span><input name="price" type="number" step="0.01" min="0" value="' + esc(plan.price) + '" required></label><label class="field"><span>Selo</span><input name="badge" value="' + esc(plan.badge) + '" placeholder="Mais contratado"></label><label class="field"><span>Periodo</span><input name="period" value="' + esc(plan.period) + '"></label></div><label class="field"><span>Observacao</span><textarea name="note" rows="2">' + esc(plan.note) + '</textarea></label><label class="field"><span>Beneficios</span><textarea name="features" rows="5" placeholder="Um beneficio por linha">' + esc(plan.features.join("\n")) + '</textarea><small>Use uma linha para cada beneficio.</small></label><div class="form-grid"><label class="check-field"><input name="active" type="checkbox"' + (plan.active ? " checked" : "") + '><span>Plano ativo</span></label><label class="check-field"><input name="featured" type="checkbox"' + (plan.featured ? " checked" : "") + '><span>Destacar plano</span></label></div><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + " Salvar plano</button></div></form>", true);
  }

  function categoryModal(item) {
    const category = item || { id: "", name: "", description: "" };
    openModal(modalHeader("Categorias de planos", "Agrupe ofertas para simplificar os filtros do site e a gestao do catalogo.") + '<div class="category-manager"><form class="modal-form category-form" data-form-kind="category"><input type="hidden" name="id" value="' + esc(category.id) + '"><div class="form-grid"><label class="field"><span>Nome da categoria</span><input name="name" value="' + esc(category.name) + '" placeholder="Internet + Streaming" required></label><label class="field"><span>Identificador</span><input name="slug" value="' + esc(category.id) + '" placeholder="internet-streaming"' + (item ? " readonly" : "") + '></label></div><label class="field"><span>Descricao</span><input name="description" value="' + esc(category.description) + '" required></label><div class="modal-actions"><button class="button button--ghost" type="button" data-category-reset>Limpar</button><button class="button button--primary" type="submit">' + icon("save") + (item ? " Atualizar categoria" : " Criar categoria") + '</button></div></form><div class="category-list">' + state.categories.map(function (entry) {
      const count = state.plans.filter(function (plan) { return plan.categoryId === entry.id; }).length;
      return '<article><span>' + icon("tags") + '</span><div><strong>' + esc(entry.name) + '</strong><p>' + esc(entry.description) + '</p><small>' + count + ' plano' + (count === 1 ? "" : "s") + '</small></div><button class="icon-button" data-edit-category-modal="' + esc(entry.id) + '" title="Editar">' + icon("pencil") + '</button><button class="icon-button icon-button--danger" data-delete-category-modal="' + esc(entry.id) + '" title="Excluir"' + (count ? " disabled" : "") + '>' + icon("trash-2") + "</button></article>";
    }).join("") + "</div></div>", true);
  }

  function appModal(item) {
    const app = item || { id: "", name: "", category: "", logo: "" };
    const preview = app.logo ? '<img src="' + esc(app.logo) + '" alt="">' : '<span>' + esc((app.name || "APP").slice(0, 2)) + '</span>';
    openModal(modalHeader(item ? "Editar aplicativo" : "Novo aplicativo", "Cadastre o servico e envie uma marca legivel para os combos.") + '<form class="modal-form" data-form-kind="app"><input type="hidden" name="id" value="' + esc(app.id) + '"><div class="app-upload-layout"><div class="app-logo-preview">' + preview + '</div><div class="upload-zone"><input id="app-logo-file" type="file" accept="image/png,image/jpeg,image/webp"><span>' + icon("image-up") + '</span><div><strong>Logo do aplicativo</strong><p>512 x 512 px, PNG ou WebP com fundo transparente. Ate 5 MB.</p></div></div></div><div class="form-grid"><label class="field"><span>Nome</span><input name="name" value="' + esc(app.name) + '" required></label><label class="field"><span>Categoria</span><input name="category" value="' + esc(app.category) + '" placeholder="Filmes e series" required></label></div><label class="field"><span>URL ou imagem atual</span><input name="logo" value="' + esc(app.logo) + '" placeholder="Opcional"></label><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + " Salvar aplicativo</button></div></form>", true);
  }

  function pageModal(item) {
    const page = item || { id: "", title: "", slug: "", description: "", status: "draft" };
    openModal(modalHeader(item ? "Configurar pagina" : "Nova pagina", "Defina o endereco, a descricao para buscadores e o estado de publicacao.") + '<form class="modal-form" data-form-kind="page"><input type="hidden" name="id" value="' + esc(page.id) + '"><label class="field"><span>Titulo da pagina</span><input name="title" value="' + esc(page.title) + '" required></label>' + (item ? "" : '<label class="field"><span>Modelo inicial</span><select name="template"><option value="institutional">Institucional completa</option><option value="campaign">Campanha comercial</option><option value="legal">Documento e regulamento</option><option value="blank">Pagina simples</option></select><small>O modelo cria blocos editaveis que podem ser reorganizados depois.</small></label>') + '<div class="form-grid"><label class="field"><span>URL amigavel</span><input name="slug" value="' + esc(page.slug) + '" placeholder="sobre-a-empresa" required></label><label class="field"><span>Status</span><select name="status"><option value="draft"' + (page.status === "draft" ? " selected" : "") + '>Rascunho</option><option value="published"' + (page.status === "published" ? " selected" : "") + '>Publicada</option></select></label></div><label class="field"><span>Descricao para buscadores</span><textarea name="description" rows="4" maxlength="170">' + esc(page.description) + '</textarea><small>Recomendado: ate 160 caracteres.</small></label><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + " Salvar pagina</button></div></form>");
  }

  function pageTemplateBlocks(template, title, description) {
    const hero = { id: FL.uid("block"), type: "hero", eyebrow: state.brand.name, title, text: description, visible: true };
    const cta = { id: FL.uid("block"), type: "cta", title: "Fale com a " + state.brand.name, text: "Nossa equipe esta pronta para ajudar.", label: "Falar no WhatsApp", url: "whatsapp", visible: true };
    if (template === "legal") return [hero, { id: FL.uid("block"), type: "text", title: "Informacoes do documento", text: "Edite o conteudo e apresente as condicoes de forma clara.", visible: true }, { id: FL.uid("block"), type: "callout", title: "Informacao importante", text: "Destaque prazos, regras ou orientacoes essenciais.", visible: true }, { id: FL.uid("block"), type: "document", title: "Documento completo", text: "Disponibilize o arquivo oficial para consulta.", label: "Abrir documento", url: "#", visible: true }, cta];
    if (template === "campaign") return [hero, { id: FL.uid("block"), type: "image", title: "Uma oferta feita para sua rotina", text: "Apresente a campanha com uma imagem real e uma mensagem objetiva.", label: "Campanha " + state.brand.name, url: state.banners[0].image, visible: true }, { id: FL.uid("block"), type: "stats", title: "Por que escolher esta oferta", text: "100% | fibra optica\n5 | cidades atendidas\nSuporte local | perto de voce", visible: true }, cta];
    if (template === "blank") return [hero, { id: FL.uid("block"), type: "text", title: "Conteudo da pagina", text: "Edite este bloco para publicar suas informacoes.", visible: true }, cta];
    return [hero, { id: FL.uid("block"), type: "text", title: "Sobre a " + state.brand.name, text: "Conte a historia, o proposito e os diferenciais da empresa.", visible: true }, { id: FL.uid("block"), type: "stats", title: "Conexao que cresce com a regiao", text: "100% | fibra optica\n5 | cidades atendidas\n18 | planos e combos", visible: true }, { id: FL.uid("block"), type: "image", title: "Tecnologia com atendimento proximo", text: "Use uma imagem da biblioteca para aproximar a marca do publico.", label: "Equipe e infraestrutura", url: state.banners[1] ? state.banners[1].image : state.banners[0].image, visible: true }, { id: FL.uid("block"), type: "faq", title: "Perguntas frequentes", text: "Como consultar cobertura? | Informe seu CEP e fale com nossa equipe.\nComo contratar? | Escolha um plano e continue pelo WhatsApp.", visible: true }, cta];
  }

  function couponModal(item) {
    const coupon = item || { id: "", code: "", title: "", description: "", discountType: "percentage", discountValue: 10, durationType: "first_month", durationMonths: 1, autoApply: true, planIds: [], startsAt: new Date().toISOString().slice(0, 10), expiresAt: "", usageLimit: 100, used: 0, active: true };
    openModal(modalHeader(item ? "Editar desconto" : "Novo desconto", "Configure valor, duracao e planos. A oferta sera calculada automaticamente no site.") + '<form class="modal-form" data-form-kind="coupon"><input type="hidden" name="id" value="' + esc(coupon.id) + '"><div class="form-grid"><label class="field"><span>Codigo</span><input name="code" value="' + esc(coupon.code) + '" maxlength="24" required></label><label class="field"><span>Nome interno</span><input name="title" value="' + esc(coupon.title) + '" required></label><label class="field"><span>Tipo de desconto</span><select name="discountType"><option value="percentage"' + (coupon.discountType === "percentage" ? " selected" : "") + '>Percentual (%)</option><option value="fixed"' + (coupon.discountType === "fixed" ? " selected" : "") + '>Valor fixo (R$)</option></select></label><label class="field"><span>Valor do desconto</span><input name="discountValue" type="number" min="0.01" max="100" step="0.01" value="' + esc(coupon.discountValue) + '" required></label><label class="field"><span>Duracao</span><select name="durationType"><option value="first_month"' + (coupon.durationType === "first_month" ? " selected" : "") + '>Somente no primeiro mes</option><option value="months"' + (coupon.durationType === "months" ? " selected" : "") + '>Primeiros meses</option><option value="lifetime"' + (coupon.durationType === "lifetime" ? " selected" : "") + '>Vitalicio enquanto o plano estiver ativo</option></select></label><label class="field"><span>Quantidade de meses</span><input name="durationMonths" type="number" min="1" max="36" value="' + esc(coupon.durationMonths || 1) + '"><small>Usado apenas na opcao primeiros meses.</small></label><label class="field"><span>Inicio</span><input name="startsAt" type="date" value="' + esc(coupon.startsAt) + '"></label><label class="field"><span>Termino</span><input name="expiresAt" type="date" value="' + esc(coupon.expiresAt) + '"></label><label class="field"><span>Limite de usos</span><input name="usageLimit" type="number" min="1" value="' + coupon.usageLimit + '"></label></div><label class="field"><span>Descricao comercial</span><textarea name="description" rows="3">' + esc(coupon.description) + '</textarea></label><fieldset class="plan-selector"><legend>Planos participantes</legend><p>Sem selecao, o desconto vale para todos os planos.</p><div>' + state.plans.map(function (plan) { return '<label><input type="checkbox" name="planIds" value="' + esc(plan.id) + '"' + (coupon.planIds.includes(plan.id) ? " checked" : "") + '><span><strong>' + esc(plan.speed) + '</strong><small>' + esc(plan.title) + '</small></span></label>'; }).join("") + '</div></fieldset><div class="form-grid"><label class="check-field"><input name="autoApply" type="checkbox"' + (coupon.autoApply ? " checked" : "") + '><span>Aplicar automaticamente no card do plano</span></label><label class="check-field"><input name="active" type="checkbox"' + (coupon.active ? " checked" : "") + '><span>Desconto ativo</span></label></div><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + " Salvar desconto</button></div></form>", true);
  }

  function whatsappCampaignModal(item) {
    const campaign = item || { id: "", name: "", message: "Ola {name}! Aqui e da Fibra Lider. Vimos seu interesse no plano {plan}. Posso ajudar com a oferta {offer}?", planIds: [], status: "draft", contactsSent: 0 };
    openModal(modalHeader(item ? "Editar campanha manual" : "Nova campanha manual", "Escolha a audiencia por interesse e prepare uma mensagem individual para o atendimento.") + '<form class="modal-form" data-form-kind="whatsapp-campaign"><input type="hidden" name="id" value="' + esc(campaign.id) + '"><label class="field"><span>Nome interno</span><input name="name" value="' + esc(campaign.name) + '" placeholder="Interesse em 600 Mega" required></label><label class="field"><span>Mensagem</span><textarea name="message" rows="7" required>' + esc(campaign.message) + '</textarea><small>Variaveis: {name}, {plan}, {speed}, {price}, {offer}.</small></label><fieldset class="plan-selector"><legend>Interesses incluidos</legend><p>Sem selecao, a campanha fica disponivel para todos os leads.</p><div>' + state.plans.map(function (plan) { return '<label><input type="checkbox" name="planIds" value="' + esc(plan.id) + '"' + (campaign.planIds.includes(plan.id) ? " checked" : "") + '><span><strong>' + esc(plan.speed) + '</strong><small>' + esc(plan.title) + '</small></span></label>'; }).join("") + '</div></fieldset><label class="check-field"><input name="active" type="checkbox"' + (campaign.status === "active" ? " checked" : "") + '><span>Campanha pronta para atendimento</span></label><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + ' Salvar campanha</button></div></form>', true);
  }

  function popupModal(item) {
    const campaign = item || { id: "", name: "", type: "coupon", title: "", description: "", eyebrow: "", image: state.banners[0].image, couponId: state.coupons[0] ? state.coupons[0].id : "", ctaLabel: "Ver oferta", ctaLink: "#planos", trigger: "delay", delaySeconds: 8, scrollPercent: 45, frequency: "session", startsAt: new Date().toISOString().slice(0, 10), expiresAt: "", active: true };
    openModal(modalHeader(item ? "Editar campanha" : "Nova campanha popup", "A campanha aparece sobre o site conforme a regra escolhida.") + '<form class="modal-form" data-form-kind="popup"><input type="hidden" name="id" value="' + esc(campaign.id) + '"><div class="form-grid"><label class="field"><span>Nome interno</span><input name="name" value="' + esc(campaign.name) + '" required></label><label class="field"><span>Cupom associado</span><select name="couponId"><option value="">Sem cupom</option>' + state.coupons.map(function (coupon) { return '<option value="' + esc(coupon.id) + '"' + (coupon.id === campaign.couponId ? " selected" : "") + ">" + esc(coupon.code) + "</option>"; }).join("") + '</select></label></div><label class="field"><span>Chamada curta</span><input name="eyebrow" value="' + esc(campaign.eyebrow) + '"></label><label class="field"><span>Titulo</span><input name="title" value="' + esc(campaign.title) + '" required></label><label class="field"><span>Descricao</span><textarea name="description" rows="3">' + esc(campaign.description) + '</textarea></label><label class="field"><span>Imagem</span><input name="image" value="' + esc(campaign.image) + '"></label><div class="form-grid"><label class="field"><span>Gatilho</span><select name="trigger"><option value="delay"' + (campaign.trigger === "delay" ? " selected" : "") + '>Tempo na pagina</option><option value="scroll"' + (campaign.trigger === "scroll" ? " selected" : "") + '>Rolagem da pagina</option><option value="exit"' + (campaign.trigger === "exit" ? " selected" : "") + '>Intencao de saida</option></select></label><label class="field"><span>Atraso em segundos</span><input name="delaySeconds" type="number" min="2" value="' + campaign.delaySeconds + '"></label><label class="field"><span>Rolagem (%)</span><input name="scrollPercent" type="number" min="10" max="90" value="' + campaign.scrollPercent + '"></label><label class="field"><span>Frequencia</span><select name="frequency"><option value="session"' + (campaign.frequency === "session" ? " selected" : "") + '>Uma vez por sessao</option><option value="always"' + (campaign.frequency === "always" ? " selected" : "") + '>Sempre</option></select></label><label class="field"><span>Inicio</span><input name="startsAt" type="date" value="' + esc(campaign.startsAt) + '"></label><label class="field"><span>Termino</span><input name="expiresAt" type="date" value="' + esc(campaign.expiresAt) + '"></label><label class="field"><span>Texto do botao</span><input name="ctaLabel" value="' + esc(campaign.ctaLabel) + '"></label><label class="field"><span>Destino</span><input name="ctaLink" value="' + esc(campaign.ctaLink) + '"></label></div><label class="check-field"><input name="active" type="checkbox"' + (campaign.active ? " checked" : "") + '><span>Campanha ativa</span></label><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + " Salvar campanha</button></div></form>", true);
  }

  function regionModal(item) {
    const region = item || { id: "", name: "", type: "cep", cep: "", stateCode: state.coverageSettings.defaultState, address: "", status: "Consulta de viabilidade", interest: 50, leads: 0, lat: "", lng: "", radiusKm: state.coverageSettings.defaultRadiusKm, color: state.theme.mapAccent, active: true };
    openModal(modalHeader(item ? "Editar area de cobertura" : "Nova area de cobertura", "Cadastre uma cidade, um CEP central ou uma regiao comercial e confirme sua posicao no mapa.") + '<form class="modal-form region-form" data-form-kind="region"><input type="hidden" name="id" value="' + esc(region.id) + '"><div class="form-grid"><label class="field"><span>Tipo de area</span><select name="type"><option value="cep"' + (region.type === "cep" ? " selected" : "") + '>CEP e raio</option><option value="city"' + (region.type === "city" ? " selected" : "") + '>Cidade</option><option value="region"' + (region.type === "region" ? " selected" : "") + '>Regiao comercial</option></select></label><label class="field"><span>CEP de referencia</span><span class="input-action"><input id="region-cep" name="cep" inputmode="numeric" value="' + esc(region.cep || "") + '" placeholder="00000-000"><button id="lookup-region-cep" type="button" title="Buscar CEP">' + icon("search") + '</button></span><small id="region-cep-status">Preenche endereco e coordenadas automaticamente.</small></label><label class="field"><span>Cidade ou nome da regiao</span><input name="name" value="' + esc(region.name) + '" required></label><label class="field"><span>UF</span><input name="stateCode" maxlength="2" value="' + esc(region.stateCode || "SP") + '" required></label></div><label class="field"><span>Endereco de referencia</span><input name="address" value="' + esc(region.address || "") + '" placeholder="Rua, bairro, cidade - UF"></label><div class="form-grid"><label class="field"><span>Latitude</span><input name="lat" type="number" step="any" value="' + esc(region.lat) + '" required></label><label class="field"><span>Longitude</span><input name="lng" type="number" step="any" value="' + esc(region.lng) + '" required></label><label class="field"><span>Raio aproximado</span><input name="radiusKm" type="number" min="0.5" max="100" step="0.5" value="' + esc(region.radiusKm) + '"><small>Quilometros exibidos no mapa.</small></label><label class="field"><span>Cor da area</span><span class="color-input"><input name="color" type="color" value="' + esc(region.color || state.theme.mapAccent) + '"><b>' + esc(region.color || state.theme.mapAccent) + '</b></span></label></div><div class="form-grid"><label class="field"><span>Status publico</span><input name="status" value="' + esc(region.status) + '" required></label><label class="field"><span>Interesse (%)</span><input name="interest" type="number" min="0" max="100" value="' + esc(region.interest) + '"></label><label class="field"><span>Leads registrados</span><input name="leads" type="number" min="0" value="' + esc(region.leads) + '"></label></div><div class="route-preview"><span>' + icon("route") + '</span><div><strong>Validacao no Google Maps</strong><p>Confira o ponto e abra uma rota usando a localizacao atual.</p></div><a id="region-google-link" href="' + esc(googleMapsUrl(region, true)) + '" target="_blank" rel="noopener">Abrir rota ' + icon("external-link") + '</a></div><label class="check-field"><input name="active" type="checkbox"' + (region.active ? " checked" : "") + '><span>Exibir esta area no site</span></label><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + " Salvar area</button></div></form>", true);
  }

  async function lookupRegionCep(form) {
    const cepInput = $("#region-cep", form);
    const status = $("#region-cep-status", form);
    const cep = String(cepInput.value || "").replace(/\D/g, "");
    if (cep.length !== 8) { status.textContent = "Informe os 8 digitos do CEP."; status.className = "is-error"; return; }
    status.textContent = "Buscando endereco e coordenadas...";
    status.className = "is-loading";
    try {
      const response = await fetch("https://viacep.com.br/ws/" + cep + "/json/");
      if (!response.ok) throw new Error("Falha ao consultar CEP");
      const address = await response.json();
      if (address.erro) throw new Error("CEP nao encontrado");
      form.elements.cep.value = address.cep;
      form.elements.name.value = address.localidade;
      form.elements.stateCode.value = address.uf;
      form.elements.address.value = [address.logradouro, address.bairro, address.localidade + " - " + address.uf].filter(Boolean).join(", ");
      const query = [address.logradouro, address.bairro, address.localidade, address.uf, "Brasil"].filter(Boolean).join(", ");
      const geoResponse = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=" + encodeURIComponent(query));
      const locations = geoResponse.ok ? await geoResponse.json() : [];
      if (locations[0]) { form.elements.lat.value = locations[0].lat; form.elements.lng.value = locations[0].lon; }
      status.textContent = locations[0] ? "Endereco e ponto do mapa preenchidos." : "Endereco preenchido. Confirme as coordenadas no mapa.";
      status.className = "is-success";
      updateRegionRouteLink(form);
    } catch (error) { status.textContent = error.message || "Nao foi possivel consultar o CEP."; status.className = "is-error"; }
  }

  function updateRegionRouteLink(form) {
    const link = $("#region-google-link", form);
    if (!link) return;
    link.href = googleMapsUrl({ lat: Number(form.elements.lat.value), lng: Number(form.elements.lng.value), address: form.elements.address.value, name: form.elements.name.value }, true);
  }

  function simpleItemModal(kind, item) {
    const configs = {
      benefit: { title: item ? "Editar beneficio" : "Novo beneficio", fields: [["Titulo", "title"], ["Icone Lucide", "icon"], ["Descricao", "text"]] },
      region: { title: item ? "Editar regiao" : "Nova regiao", fields: [["Cidade", "name"], ["Status publico", "status"], ["Interesse (%)", "interest"], ["Leads", "leads"], ["Latitude", "lat"], ["Longitude", "lng"]] },
      support: { title: "Editar atalho", fields: [["Titulo", "title"], ["Descricao", "text"], ["Texto do botao", "label"], ["URL", "url"], ["Icone Lucide", "icon"]] },
    };
    const config = configs[kind];
    openModal(modalHeader(config.title, "Atualize os dados exibidos no site.") + '<form class="modal-form" data-form-kind="' + kind + '"><input type="hidden" name="id" value="' + esc(item ? item.id : "") + '">' + config.fields.map(function (entry) {
      const value = item ? item[entry[1]] : "";
      const type = ["interest", "leads", "lat", "lng"].includes(entry[1]) ? "number" : "text";
      return '<label class="field"><span>' + esc(entry[0]) + '</span><input name="' + esc(entry[1]) + '" type="' + type + '"' + (type === "number" ? ' step="any"' : "") + ' value="' + esc(value) + '" required></label>';
    }).join("") + '<div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + " Salvar</button></div></form>");
  }

  function previewPopup(id) {
    const campaign = state.popupCampaigns.find(function (item) { return item.id === id; });
    const coupon = campaign && state.coupons.find(function (item) { return item.id === campaign.couponId; });
    if (!campaign) return;
    openModal('<div class="popup-admin-preview"><div class="popup-admin-preview__image"><img src="' + esc(campaign.image) + '" alt=""></div><div><span class="eyebrow">' + esc(campaign.eyebrow) + '</span><h2>' + esc(campaign.title) + '</h2><p>' + esc(campaign.description) + '</p>' + (coupon ? '<button class="coupon-big-code">' + esc(coupon.code) + icon("copy") + '</button>' : "") + '<button class="button button--primary">' + esc(campaign.ctaLabel) + " " + icon("arrow-right") + "</button></div></div>", true);
  }

  function optimizeImage(file, overrides) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error("Formato de imagem invalido."));
      const options = { ...state.mediaSettings, ...(overrides || {}) };
      const maxFileBytes = Math.max(1, Number(options.maxFileMb || 8)) * 1024 * 1024;
      if (file.size > maxFileBytes) return reject(new Error("A imagem deve ter no maximo " + options.maxFileMb + " MB."));
      const reader = new FileReader();
      reader.onerror = function () { reject(new Error("Nao foi possivel ler a imagem.")); };
      reader.onload = function () {
        const image = new Image();
        image.onerror = function () { reject(new Error("Arquivo de imagem invalido.")); };
        image.onload = function () {
          const maxWidth = Math.max(320, Number(options.maxWidth || 1920));
          const scale = Math.min(1, maxWidth / image.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          const context = canvas.getContext("2d", { alpha: options.format !== "image/jpeg" });
          if (options.format === "image/jpeg") { context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height); }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(function (blob) {
            if (!blob) { reject(new Error("O navegador nao conseguiu converter esta imagem.")); return; }
            if (blob.size > 1.8 * 1024 * 1024) { reject(new Error("A imagem otimizada ainda ficou muito grande. Reduza a largura ou a qualidade.")); return; }
            const outputReader = new FileReader();
            outputReader.onerror = function () { reject(new Error("Nao foi possivel preparar a imagem otimizada.")); };
            outputReader.onload = function () {
              resolve({ dataUrl: outputReader.result, width: canvas.width, height: canvas.height, bytes: blob.size, originalBytes: file.size, type: blob.type || options.format, name: file.name });
            };
            outputReader.readAsDataURL(blob);
          }, options.format || "image/webp", Math.min(0.95, Math.max(0.45, Number(options.quality || 82) / 100)));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function addMediaFiles(fileList, usage) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    let completed = 0;
    for (const file of files) {
      try {
        const result = await optimizeImage(file);
        storeOptimizedMedia(result, file, usage || "Biblioteca");
        completed += 1;
      } catch (error) { toast(file.name + ": " + error.message, "error"); }
    }
    if (completed) { saveDraft(completed + (completed === 1 ? " imagem otimizada" : " imagens otimizadas")); renderPanel(); }
  }

  function storeOptimizedMedia(result, file, usage) {
    const projectedBytes = stateSize() + String(result.dataUrl || "").length * 2;
    if (projectedBytes > 4.2 * 1024 * 1024) throw new Error("A biblioteca local esta cheia. Remova arquivos antigos ou reduza a largura da imagem.");
    state.mediaLibrary.unshift({
      id: FL.uid("media"), name: file.name.replace(/\.[^.]+$/, ""), url: result.dataUrl,
      type: result.type, width: result.width, height: result.height, bytes: result.bytes,
      originalBytes: result.originalBytes, usage: usage, createdAt: new Date().toISOString().slice(0, 10),
    });
    return result.dataUrl;
  }

  function slugify(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  async function handleModalSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const kind = form.dataset.formKind;
    if (kind === "banner") {
      const existing = state.banners.find(function (item) { return item.id === data.id; });
      let image = data.image;
      const file = $("#banner-image-file", form).files[0];
      if (file) {
        try { const optimized = await optimizeImage(file); image = storeOptimizedMedia(optimized, file, "Banner"); }
        catch (error) { toast(error.message, "error"); return; }
      }
      const item = { id: data.id || FL.uid("banner"), name: data.name, eyebrow: data.eyebrow, title: data.title, subtitle: data.subtitle, image, mobileImage: image, primaryLabel: data.primaryLabel, primaryLink: data.primaryLink, secondaryLabel: data.secondaryLabel, secondaryLink: data.secondaryLink, badge: data.badge, position: data.position, overlay: Number(data.overlay), active: form.elements.active.checked };
      if (existing) Object.assign(existing, item); else state.banners.push(item);
    }
    if (kind === "plan") {
      const existing = state.plans.find(function (item) { return item.id === data.id; });
      const item = { id: data.id || FL.uid("plan"), categoryId: data.categoryId, title: data.title, speed: data.speed, price: Number(data.price), period: data.period || "mes", badge: data.badge, note: data.note, features: data.features.split("\n").map(function (value) { return value.trim(); }).filter(Boolean), active: form.elements.active.checked, featured: form.elements.featured.checked };
      if (existing) Object.assign(existing, item); else state.plans.push(item);
    }
    if (kind === "category") {
      const existing = state.categories.find(function (item) { return item.id === data.id; });
      const id = existing ? existing.id : slugify(data.slug || data.name) || FL.uid("category");
      if (!existing && state.categories.some(function (item) { return item.id === id; })) { toast("Ja existe uma categoria com esse identificador", "error"); return; }
      const item = { id, name: data.name, description: data.description };
      if (existing) Object.assign(existing, item); else state.categories.push(item);
    }
    if (kind === "app") {
      const existing = state.apps.find(function (item) { return item.id === data.id; });
      let logo = data.logo || (existing ? existing.logo : "");
      const file = $("#app-logo-file", form).files[0];
      if (file) {
        try { const optimized = await optimizeImage(file, { maxWidth: 512, format: "image/webp" }); logo = storeOptimizedMedia(optimized, file, "Logo de app"); }
        catch (error) { toast(error.message, "error"); return; }
      }
      const item = { id: data.id || FL.uid("app"), name: data.name, category: data.category, logo };
      if (existing) Object.assign(existing, item); else state.apps.push(item);
    }
    if (kind === "page") {
      const existing = state.pages.find(function (item) { return item.id === data.id; });
      const slug = slugify(data.slug || data.title);
      if (!slug) { toast("Informe uma URL valida", "error"); return; }
      if (state.pages.some(function (item) { return item.slug === slug && item.id !== data.id; })) { toast("Essa URL ja esta em uso", "error"); return; }
      if (existing) {
        Object.assign(existing, { title: data.title, slug, description: data.description, status: data.status, updatedAt: new Date().toISOString().slice(0, 10) });
      } else {
        const page = { id: FL.uid("page"), title: data.title, slug, description: data.description, status: data.status, updatedAt: new Date().toISOString().slice(0, 10), blocks: pageTemplateBlocks(data.template || "blank", data.title, data.description) };
        state.pages.push(page);
        pageEditId = page.id;
        selectedPageBlockId = page.blocks[0].id;
      }
    }
    if (kind === "coupon") {
      const existing = state.coupons.find(function (item) { return item.id === data.id; });
      const item = { id: data.id || FL.uid("coupon"), code: data.code.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24), title: data.title, discountType: data.discountType, discountValue: Number(data.discountValue), durationType: data.durationType, durationMonths: data.durationType === "months" ? Number(data.durationMonths || 1) : data.durationType === "first_month" ? 1 : 0, autoApply: form.elements.autoApply.checked, description: data.description, startsAt: data.startsAt, expiresAt: data.expiresAt, usageLimit: Number(data.usageLimit), used: existing ? existing.used : 0, planIds: formData.getAll("planIds"), active: form.elements.active.checked };
      if (!item.code || state.coupons.some(function (coupon) { return coupon.code === item.code && coupon.id !== item.id; })) { toast("Informe um codigo unico para o desconto", "error"); return; }
      if (item.expiresAt && item.startsAt && item.expiresAt < item.startsAt) { toast("A data final deve ser posterior ao inicio", "error"); return; }
      item.discount = FL.couponLabel(item);
      if (existing) Object.assign(existing, item); else state.coupons.push(item);
    }
    if (kind === "whatsapp-campaign") {
      const existing = state.whatsappCampaigns.find(function (item) { return item.id === data.id; });
      const item = { id: data.id || FL.uid("wa-campaign"), name: data.name, message: data.message, planIds: formData.getAll("planIds"), status: form.elements.active.checked ? "active" : "draft", contactsSent: existing ? existing.contactsSent : 0, createdAt: existing ? existing.createdAt : new Date().toISOString().slice(0, 10) };
      if (existing) Object.assign(existing, item); else state.whatsappCampaigns.push(item);
    }
    if (kind === "popup") {
      const existing = state.popupCampaigns.find(function (item) { return item.id === data.id; });
      const item = { id: data.id || FL.uid("popup"), name: data.name, type: "coupon", title: data.title, description: data.description, eyebrow: data.eyebrow, image: data.image, couponId: data.couponId, ctaLabel: data.ctaLabel, ctaLink: data.ctaLink, trigger: data.trigger, delaySeconds: Number(data.delaySeconds), scrollPercent: Number(data.scrollPercent), frequency: data.frequency, startsAt: data.startsAt, expiresAt: data.expiresAt, active: form.elements.active.checked };
      if (existing) Object.assign(existing, item); else state.popupCampaigns.push(item);
    }
    const collections = { benefit: "benefits", region: "regions", support: "supportCards" };
    if (collections[kind]) {
      const list = state[collections[kind]];
      const existing = list.find(function (item) { return item.id === data.id; });
      let item;
      if (kind === "benefit") item = { id: data.id || FL.uid("benefit"), title: data.title, icon: data.icon, text: data.text };
      if (kind === "region") item = { id: data.id || FL.uid("region"), name: data.name, type: data.type, cep: data.cep, stateCode: data.stateCode.toUpperCase(), address: data.address, status: data.status, interest: Number(data.interest), leads: Number(data.leads), lat: Number(data.lat), lng: Number(data.lng), radiusKm: Number(data.radiusKm), color: data.color || state.theme.mapAccent, active: form.elements.active.checked };
      if (kind === "support") item = { ...existing, id: data.id, title: data.title, text: data.text, label: data.label, url: data.url, icon: data.icon };
      if (existing) Object.assign(existing, item); else list.push(item);
    }
    saveDraft("Alteracoes salvas em rascunho");
    closeModal();
    renderPanel();
  }

  function bindModalControls() {
    $$("[data-admin-modal-close]", $("#admin-modal")).forEach(function (button) { button.addEventListener("click", closeModal); });
    const form = $(".modal-form", $("#admin-modal"));
    if (form) form.addEventListener("submit", function (event) { event.preventDefault(); handleModalSubmit(form); });
    $$("[data-edit-category-modal]", $("#admin-modal")).forEach(function (button) { button.addEventListener("click", function () {
      categoryModal(state.categories.find(function (item) { return item.id === button.dataset.editCategoryModal; }));
    }); });
    $$("[data-delete-category-modal]", $("#admin-modal")).forEach(function (button) { button.addEventListener("click", function () {
      const id = button.dataset.deleteCategoryModal;
      if (state.plans.some(function (plan) { return plan.categoryId === id; })) { toast("Mova os planos desta categoria antes de exclui-la", "error"); return; }
      if (confirm("Excluir esta categoria?")) { state.categories = state.categories.filter(function (item) { return item.id !== id; }); saveDraft("Categoria excluida"); categoryModal(); }
    }); });
    const resetCategory = $("[data-category-reset]", $("#admin-modal"));
    if (resetCategory) resetCategory.addEventListener("click", function () { categoryModal(); });
    $$("[data-add-home-section]", $("#admin-modal")).forEach(function (button) { button.addEventListener("click", function () { addHomeSection(button.dataset.addHomeSection); }); });
    $$("[data-apply-home-template]", $("#admin-modal")).forEach(function (button) { button.addEventListener("click", function () {
      if (confirm("Aplicar este modelo de home? A ordem e a visibilidade das secoes do sistema serao atualizadas.")) applyHomeTemplate(button.dataset.applyHomeTemplate);
    }); });
    const cepButton = $("#lookup-region-cep", $("#admin-modal"));
    const cepInput = $("#region-cep", $("#admin-modal"));
    if (cepButton && form) cepButton.addEventListener("click", function () { lookupRegionCep(form); });
    if (cepInput && form) {
      let lookupTimer;
      cepInput.addEventListener("input", function () {
        const digits = cepInput.value.replace(/\D/g, "").slice(0, 8);
        cepInput.value = digits.replace(/(\d{5})(\d)/, "$1-$2");
        clearTimeout(lookupTimer);
        if (digits.length === 8) lookupTimer = setTimeout(function () { lookupRegionCep(form); }, 450);
      });
      [form.elements.lat, form.elements.lng, form.elements.address].forEach(function (element) { if (element) element.addEventListener("input", function () { updateRegionRouteLink(form); }); });
    }
  }

  function currentPage() {
    return state.pages.find(function (item) { return item.id === pageEditId; });
  }

  function touchPage(page, message) {
    if (page) page.updatedAt = new Date().toISOString().slice(0, 10);
    saveDraft(message);
  }

  function handleAction(action, id, element) {
    const find = function (list) { return list.find(function (item) { return item.id === id; }); };
    if (action === "publish") publish();
    if (action === "preview-site" || action === "builder-preview") window.open("./index.html?theme=" + state.builderSettings.previewTheme, "_blank", "noopener");
    if (action === "builder-refresh") { const frame = $("#site-preview"); if (frame) frame.src = "./index.html?preview=" + Date.now() + "&theme=" + state.builderSettings.previewTheme; }
    if (action === "builder-save") { saveDraft("Estrutura salva"); scheduleBuilderPreview(); }
    if (action === "home-templates") homeTemplatesModal();
    if (action === "add-section") sectionLibraryModal();
    if (action === "move-block-up" || action === "move-block-down") { recordBuilderHistory(); moveInArray(state.pageBlocks, selectedBlockId, action.endsWith("up") ? -1 : 1); saveDraft(); renderPanel(); }
    if (action === "duplicate-block") {
      const source = state.pageBlocks.find(function (item) { return item.id === selectedBlockId; });
      if (source && !source.locked) { recordBuilderHistory(); const copy = FL.clone(source); copy.id = FL.uid("section"); copy.label += " - copia"; copy.anchor = ""; state.pageBlocks.splice(state.pageBlocks.indexOf(source) + 1, 0, copy); selectedBlockId = copy.id; saveDraft("Secao duplicada"); renderPanel(); }
    }
    if (action === "delete-block") {
      const source = state.pageBlocks.find(function (item) { return item.id === selectedBlockId; });
      if (source && !source.locked && confirm("Excluir esta secao da pagina inicial?")) { recordBuilderHistory(); const index = state.pageBlocks.indexOf(source); state.pageBlocks.splice(index, 1); selectedBlockId = state.pageBlocks[Math.max(0, index - 1)].id; saveDraft("Secao excluida"); renderPanel(); }
    }
    if (action === "builder-undo" && builderHistory.length) { const current = builderSnapshot(); const previous = builderHistory.pop(); builderFuture.push(current); restoreBuilderSnapshot(previous); toast("Alteracao desfeita"); renderPanel(); }
    if (action === "builder-redo" && builderFuture.length) { const current = builderSnapshot(); const next = builderFuture.pop(); builderHistory.push(current); restoreBuilderSnapshot(next); toast("Alteracao refeita"); renderPanel(); }
    if (action === "builder-theme") { state.builderSettings.previewTheme = state.builderSettings.previewTheme === "dark" ? "light" : "dark"; saveDraft(); renderPanel(); }
    if (action === "new-banner") bannerModal();
    if (action === "edit-banner") bannerModal(find(state.banners));
    if (action === "toggle-banner") { const item = find(state.banners); item.active = !item.active; saveDraft(); renderPanel(); }
    if (action === "duplicate-banner") { const item = FL.clone(find(state.banners)); item.id = FL.uid("banner"); item.name += " - copia"; item.active = false; state.banners.push(item); saveDraft("Slide duplicado"); renderPanel(); }
    if (action === "delete-banner" && state.banners.length > 1 && confirm("Excluir este slide?")) { state.banners = state.banners.filter(function (item) { return item.id !== id; }); saveDraft("Slide excluido"); renderPanel(); }
    if (action === "copy-media") {
      const item = find(state.mediaLibrary);
      if (item && navigator.clipboard) navigator.clipboard.writeText(item.url);
      toast("Endereco da imagem copiado");
    }
    if (action === "download-media") {
      const item = find(state.mediaLibrary);
      if (item) { const link = document.createElement("a"); link.href = item.url; link.download = slugify(item.name) + "." + (item.type || "image/webp").split("/")[1].replace("jpeg", "jpg"); link.click(); }
    }
    if (action === "delete-media") {
      const item = find(state.mediaLibrary);
      const used = item && (state.banners.some(function (banner) { return banner.image === item.url || banner.mobileImage === item.url; }) || state.apps.some(function (app) { return app.logo === item.url; }) || state.popupCampaigns.some(function (campaign) { return campaign.image === item.url; }) || state.pages.some(function (page) { return page.blocks.some(function (block) { return block.url === item.url; }); }));
      if (used) toast("Esta imagem esta em uso. Troque-a no conteudo antes de remover.", "error");
      else if (item && confirm("Remover esta imagem da biblioteca?")) { state.mediaLibrary = state.mediaLibrary.filter(function (media) { return media.id !== id; }); saveDraft("Imagem removida"); renderPanel(); }
    }
    if (action === "save-content") { saveDraft("Alteracoes salvas em rascunho"); renderPanel(); }
    if (action === "apply-theme-preset") {
      const preset = THEME_PRESETS[element.dataset.preset];
      if (preset) { Object.assign(state.theme, preset); saveDraft("Paleta " + preset.label + " aplicada"); renderPanel(); }
    }
    if (action === "theme-preview-mode") { themePreviewMode = element.dataset.mode; renderPanel(); }
    if (action === "refresh-theme-preview") { const frame = $("#theme-live-frame"); if (frame) frame.src = "./index.html?preview=" + Date.now() + "&theme=" + themePreviewMode; }
    if (action === "move-nav-up") { moveInArray(state.navigation, id, -1); saveDraft(); renderPanel(); }
    if (action === "toggle-nav") { const item = find(state.navigation); item.visible = !item.visible; saveDraft(); renderPanel(); }
    if (action === "add-nav-link") { state.navigation.push({ id: FL.uid("nav"), label: "Novo link", href: "#", visible: true }); saveDraft(); renderPanel(); }
    if (action === "new-plan") planModal();
    if (action === "edit-plan") planModal(find(state.plans));
    if (action === "toggle-plan") { const item = find(state.plans); item.active = !item.active; saveDraft(); renderPanel(); }
    if (action === "duplicate-plan") { const item = FL.clone(find(state.plans)); item.id = FL.uid("plan"); item.title += " - copia"; item.active = false; state.plans.push(item); saveDraft("Plano duplicado"); renderPanel(); }
    if (action === "delete-plan" && confirm("Excluir este plano?")) { state.plans = state.plans.filter(function (item) { return item.id !== id; }); saveDraft("Plano excluido"); renderPanel(); }
    if (action === "manage-categories") categoryModal();
    if (action === "add-app") appModal();
    if (action === "edit-app") appModal(find(state.apps));
    if (action === "delete-app" && confirm("Excluir este app?")) { state.apps = state.apps.filter(function (item) { return item.id !== id; }); saveDraft(); renderPanel(); }
    if (action === "add-benefit") simpleItemModal("benefit");
    if (action === "edit-benefit") simpleItemModal("benefit", find(state.benefits));
    if (action === "add-region") regionModal();
    if (action === "edit-region") regionModal(find(state.regions));
    if (action === "toggle-region") { const item = find(state.regions); item.active = !item.active; saveDraft(); renderPanel(); }
    if (action === "delete-region" && state.regions.length > 1 && confirm("Excluir esta area de cobertura?")) { state.regions = state.regions.filter(function (item) { return item.id !== id; }); saveDraft("Area removida"); renderPanel(); }
    if (action === "open-region-route") { const item = find(state.regions); if (item) window.open(googleMapsUrl(item, true), "_blank", "noopener"); }
    if (action === "toggle-coverage-file") { const item = find(state.coverageFiles); if (item) { item.active = !item.active; saveDraft(); renderPanel(); } }
    if (action === "delete-coverage-file" && confirm("Remover esta camada de cobertura?")) { state.coverageFiles = state.coverageFiles.filter(function (item) { return item.id !== id; }); saveDraft("Camada removida"); renderPanel(); }
    if (action === "edit-support") simpleItemModal("support", find(state.supportCards));
    if (action === "toggle-support") { const item = find(state.supportCards); item.active = !item.active; saveDraft(); renderPanel(); }
    if (action === "new-whatsapp-campaign") whatsappCampaignModal();
    if (action === "edit-whatsapp-campaign") whatsappCampaignModal(find(state.whatsappCampaigns));
    if (action === "contact-lead") {
      const lead = find(state.leads); const plan = lead && leadPlan(lead); const coupon = lead && state.coupons.find(function (item) { return item.id === lead.couponId; }); const campaign = element.dataset.campaignId && state.whatsappCampaigns.find(function (item) { return item.id === element.dataset.campaignId; });
      if (lead && plan && lead.whatsapp) {
        const values = { name: lead.name, plan: plan.title, speed: plan.speed, price: FL.formatCurrency(coupon ? FL.couponPrice(plan, coupon) : plan.price), offer: FL.couponLabel(coupon) };
        const message = campaign ? FL.interpolate(campaign.message, values) : FL.planMessage(state, plan, { name: lead.name, whatsapp: lead.whatsapp, coupon });
        lead.status = "contacted"; lead.lastContactAt = new Date().toISOString();
        if (campaign) campaign.contactsSent = Number(campaign.contactsSent || 0) + 1;
        saveRuntime("Conversa preparada no WhatsApp");
        window.open(FL.whatsappLink(lead.whatsapp, message), "_blank", "noopener");
        renderPanel();
      }
    }
    if (action === "delete-lead" && confirm("Excluir este lead da demonstracao?")) { state.leads = state.leads.filter(function (item) { return item.id !== id; }); saveRuntime("Lead excluido"); renderPanel(); }
    if (action === "export-leads") exportLeads();
    if (action === "new-coupon") couponModal();
    if (action === "edit-coupon") couponModal(find(state.coupons));
    if (action === "toggle-coupon") { const item = find(state.coupons); item.active = !item.active; saveDraft(); renderPanel(); }
    if (action === "delete-coupon" && confirm("Excluir este cupom?")) { state.coupons = state.coupons.filter(function (item) { return item.id !== id; }); saveDraft(); renderPanel(); }
    if (action === "copy-code") { if (navigator.clipboard) navigator.clipboard.writeText(element.dataset.code); toast("Cupom copiado"); }
    if (action === "new-popup") popupModal();
    if (action === "edit-popup") popupModal(find(state.popupCampaigns));
    if (action === "toggle-popup") { const item = find(state.popupCampaigns); item.active = !item.active; saveDraft(); renderPanel(); }
    if (action === "preview-popup") previewPopup(id);
    if (action === "new-page") pageModal();
    if (action === "edit-page") { pageEditId = id; const page = currentPage(); selectedPageBlockId = page && page.blocks[0] ? page.blocks[0].id : null; renderPanel(); }
    if (action === "page-settings") pageModal(find(state.pages));
    if (action === "open-page") { const page = find(state.pages); if (page) window.open("./pagina.html?slug=" + encodeURIComponent(page.slug), "_blank", "noopener"); }
    if (action === "back-pages") { pageEditId = null; selectedPageBlockId = null; renderPanel(); }
    if (action === "duplicate-page") {
      const source = FL.clone(find(state.pages));
      source.id = FL.uid("page"); source.title += " - copia"; source.slug += "-copia"; source.status = "draft"; source.updatedAt = new Date().toISOString().slice(0, 10);
      source.blocks.forEach(function (block) { block.id = FL.uid("block"); });
      state.pages.push(source); touchPage(source, "Pagina duplicada"); renderPanel();
    }
    if (action === "delete-page" && confirm("Excluir esta pagina?")) { state.pages = state.pages.filter(function (item) { return item.id !== id; }); touchPage(null, "Pagina excluida"); renderPanel(); }
    if (action === "refresh-page-preview") { const frame = $("#page-preview"); const page = currentPage(); if (frame && page) frame.src = "./pagina.html?slug=" + encodeURIComponent(page.slug) + "&preview=" + Date.now(); }
    if (action === "add-page-block") {
      const page = currentPage(); if (!page) return;
      const type = element.dataset.blockType || "text";
      const defaults = {
        text: { title: "Novo bloco de texto", text: "Adicione aqui o conteudo desta secao." },
        callout: { title: "Informacao importante", text: "Use este bloco para destacar uma orientacao." },
        document: { title: "Documento", text: "Descreva o arquivo ou link.", label: "Abrir documento", url: "#" },
        image: { title: "Imagem", text: "", label: "Descricao da imagem", url: "./assets/img/banner-streaming-family.jpg" },
        stats: { title: "Numeros que mostram nossa presenca", text: "5 | cidades atendidas\n18 | planos disponiveis\n100% | fibra optica" },
        faq: { title: "Perguntas frequentes", text: "Como consultar cobertura? | Informe seu CEP e fale com nossa equipe.\nComo contratar? | Escolha um plano e continue pelo WhatsApp." },
        cta: { title: "Pronto para conversar?", text: "Nossa equipe esta disponivel para ajudar.", label: "Falar no WhatsApp", url: "whatsapp" },
      };
      const block = { id: FL.uid("block"), type, visible: true, ...(defaults[type] || defaults.text) };
      page.blocks.push(block); selectedPageBlockId = block.id; touchPage(page, "Bloco adicionado"); renderPanel();
    }
    if (action === "move-page-block-up" || action === "move-page-block-down") { const page = currentPage(); if (page) { moveInArray(page.blocks, selectedPageBlockId, action.endsWith("up") ? -1 : 1); touchPage(page); renderPanel(); } }
    if (action === "duplicate-page-block") { const page = currentPage(); const source = page && page.blocks.find(function (item) { return item.id === selectedPageBlockId; }); if (source) { const copy = FL.clone(source); copy.id = FL.uid("block"); copy.title = (copy.title || "Bloco") + " - copia"; page.blocks.splice(page.blocks.indexOf(source) + 1, 0, copy); selectedPageBlockId = copy.id; touchPage(page, "Bloco duplicado"); renderPanel(); } }
    if (action === "delete-page-block") { const page = currentPage(); if (page && page.blocks.length > 1 && confirm("Excluir este bloco?")) { page.blocks = page.blocks.filter(function (item) { return item.id !== selectedPageBlockId; }); selectedPageBlockId = page.blocks[0].id; touchPage(page, "Bloco excluido"); renderPanel(); } }
    if (action === "export-report") exportCsv();
    if (action === "export-state") exportState();
    if (action === "reset-state" && confirm("Restaurar todos os dados padrao do prototipo?")) { state = FL.resetState(); saveDraft("Configuracao restaurada"); renderPanel(); }
  }

  function bindPanelControls() {
    $$("[data-goto]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { setPanel(element.dataset.goto); }); });
    $$("[data-studio-tab]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { builderStudioTab = element.dataset.studioTab; renderPanel(); }); });
    $$("[data-action]", $("#admin-panel")).forEach(function (element) {
      element.addEventListener("click", function () { handleAction(element.dataset.action, element.dataset.id, element); });
    });
    $$("[data-bind]", $("#admin-panel")).forEach(function (element) {
      const eventName = element.type === "checkbox" || element.tagName === "SELECT" || element.type === "color" ? "change" : "input";
      if (activePanel === "builder" && element.dataset.bind.indexOf("content.") === 0) element.addEventListener("focus", function () { if (!element.dataset.historyCaptured) { recordBuilderHistory(); element.dataset.historyCaptured = "true"; } });
      element.addEventListener(eventName, function () {
        const value = element.type === "checkbox" ? element.checked : element.type === "number" ? Number(element.value) : element.value;
        setPath(element.dataset.bind, value);
        if (element.type === "color") { const label = element.closest(".color-input").querySelector("b"); if (label) label.textContent = element.value; }
        saveDraft();
        if (activePanel === "builder") scheduleBuilderPreview();
        if (element.dataset.bind.indexOf("coverageSettings.") === 0 && eventName === "change") renderPanel();
      });
    });
    $$("[data-select-block]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { selectedBlockId = element.dataset.selectBlock; builderInspectorTab = "content"; renderPanel(); }); });
    $$("[data-toggle-block]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { const block = state.pageBlocks.find(function (item) { return item.id === element.dataset.toggleBlock; }); if (!block.locked) { recordBuilderHistory(); block.visible = !block.visible; saveDraft(); renderPanel(); } }); });
    const visible = $("[data-block-visible]", $("#admin-panel"));
    if (visible) visible.addEventListener("change", function () { const block = state.pageBlocks.find(function (item) { return item.id === visible.dataset.blockVisible; }); recordBuilderHistory(); block.visible = visible.checked; saveDraft(); renderPanel(); });
    const tone = $("[data-block-tone]", $("#admin-panel"));
    if (tone) tone.addEventListener("change", function () { const block = state.pageBlocks.find(function (item) { return item.id === tone.dataset.blockTone; }); recordBuilderHistory(); block.tone = tone.value; saveDraft(); renderPanel(); });
    $$("[data-inspector-tab]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { builderInspectorTab = element.dataset.inspectorTab; renderPanel(); }); });
    $$("[data-home-block-field]", $("#admin-panel")).forEach(function (element) {
      let captured = false;
      element.addEventListener("focus", function () { if (!captured) { recordBuilderHistory(); captured = true; } });
      const eventName = element.tagName === "SELECT" ? "change" : "input";
      element.addEventListener(eventName, function () { const block = state.pageBlocks.find(function (item) { return item.id === selectedBlockId; }); if (block) { block.content = block.content || {}; block.content[element.dataset.homeBlockField] = element.value; saveDraft(); scheduleBuilderPreview(); } });
    });
    $$("[data-block-setting]", $("#admin-panel")).forEach(function (element) { element.addEventListener("change", function () { const block = state.pageBlocks.find(function (item) { return item.id === selectedBlockId; }); if (block) { recordBuilderHistory(); block[element.dataset.blockSetting] = element.value; saveDraft(); renderPanel(); } }); });
    $$("[data-block-style]", $("#admin-panel")).forEach(function (element) { element.addEventListener("change", function () { const block = state.pageBlocks.find(function (item) { return item.id === selectedBlockId; }); if (block) { recordBuilderHistory(); block[element.dataset.blockStyle] = element.value; saveDraft(); renderPanel(); } }); });
    $$("[data-block-device]", $("#admin-panel")).forEach(function (element) { element.addEventListener("change", function () { const block = state.pageBlocks.find(function (item) { return item.id === selectedBlockId; }); if (block) { recordBuilderHistory(); block[element.dataset.blockDevice] = element.checked; saveDraft(); renderPanel(); } }); });
    const blockLabel = $("[data-block-label]", $("#admin-panel"));
    if (blockLabel) { let captured = false; blockLabel.addEventListener("focus", function () { if (!captured) { recordBuilderHistory(); captured = true; } }); blockLabel.addEventListener("input", function () { const block = state.pageBlocks.find(function (item) { return item.id === selectedBlockId; }); block.label = blockLabel.value; saveDraft(); }); }
    const blockAnchor = $("[data-block-anchor]", $("#admin-panel"));
    if (blockAnchor) { let captured = false; blockAnchor.addEventListener("focus", function () { if (!captured) { recordBuilderHistory(); captured = true; } }); blockAnchor.addEventListener("input", function () { const block = state.pageBlocks.find(function (item) { return item.id === selectedBlockId; }); block.anchor = slugify(blockAnchor.value); saveDraft(); scheduleBuilderPreview(); }); }
    const builderZoom = $("[data-builder-zoom]", $("#admin-panel"));
    if (builderZoom) builderZoom.addEventListener("change", function () { state.builderSettings.canvasZoom = Number(builderZoom.value); saveDraft(); renderPanel(); });
    $$("[data-device]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { builderDevice = element.dataset.device; renderPanel(); }); });
    $$("[data-builder-tab]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { builderMobileTab = element.dataset.builderTab; renderPanel(); }); });
    bindBuilderDrag();
    $$("[data-select-page-block]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { selectedPageBlockId = element.dataset.selectPageBlock; renderPanel(); }); });
    $$("[data-toggle-page-block]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { const page = currentPage(); const block = page && page.blocks.find(function (item) { return item.id === element.dataset.togglePageBlock; }); if (block) { block.visible = block.visible === false; touchPage(page); renderPanel(); } }); });
    $$("[data-page-device]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { pageBuilderDevice = element.dataset.pageDevice; renderPanel(); }); });
    $$("[data-page-builder-tab]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { pageBuilderMobileTab = element.dataset.pageBuilderTab; renderPanel(); }); });
    $$("[data-page-field]", $("#admin-panel")).forEach(function (element) { element.addEventListener("input", function () { const page = currentPage(); const block = page && page.blocks.find(function (item) { return item.id === selectedPageBlockId; }); if (block) { block[element.dataset.pageField] = element.value; touchPage(page); } }); });
    const pageMedia = $("[data-page-media]", $("#admin-panel"));
    if (pageMedia) pageMedia.addEventListener("change", function () { const page = currentPage(); const block = page && page.blocks.find(function (item) { return item.id === selectedPageBlockId; }); if (block && pageMedia.value) { block.url = pageMedia.value; touchPage(page, "Imagem aplicada"); renderPanel(); } });
    bindPageBuilderDrag();
    const categoryFilter = $("#plan-category-filter");
    if (categoryFilter) categoryFilter.addEventListener("change", function () { planFilter = categoryFilter.value; renderPanel(); });
    const search = $("#plan-search");
    if (search) search.addEventListener("input", function () { $$(".plan-admin-card").forEach(function (card) { card.hidden = !card.dataset.search.includes(search.value.toLowerCase()); }); });
    const regionSearch = $("#region-search");
    if (regionSearch) regionSearch.addEventListener("input", function () { $$("[data-region-search]").forEach(function (row) { row.hidden = !row.dataset.regionSearch.includes(regionSearch.value.toLowerCase()); }); });
    const coverageFileInput = $("#coverage-file-input");
    if (coverageFileInput) coverageFileInput.addEventListener("change", function () { importCoverageFile(coverageFileInput.files[0]); });
    $$("[data-coverage-file-color]", $("#admin-panel")).forEach(function (element) { element.addEventListener("change", function () { const file = state.coverageFiles.find(function (item) { return item.id === element.dataset.coverageFileColor; }); if (file) { file.color = element.value; saveDraft(); renderPanel(); } }); });
    $$("[data-campaign-tab]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { activeCampaignTab = element.dataset.campaignTab; renderPanel(); }); });
    $$("[data-lead-tab]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { leadWorkspaceTab = element.dataset.leadTab; renderPanel(); }); });
    $$("[data-lead-status]", $("#admin-panel")).forEach(function (element) { element.addEventListener("change", function () { const lead = state.leads.find(function (item) { return item.id === element.dataset.leadStatus; }); if (lead) { lead.status = element.value; saveRuntime("Status do lead atualizado"); } }); });
    $$("[data-nav-label]", $("#admin-panel")).forEach(function (element) { element.addEventListener("input", function () { const item = state.navigation.find(function (nav) { return nav.id === element.dataset.navLabel; }); item.label = element.value; saveDraft(); scheduleBuilderPreview(); }); });
    $$("[data-nav-href]", $("#admin-panel")).forEach(function (element) { element.addEventListener("input", function () { const item = state.navigation.find(function (nav) { return nav.id === element.dataset.navHref; }); item.href = element.value; saveDraft(); scheduleBuilderPreview(); }); });
    $$("[data-footer-column-title]", $("#admin-panel")).forEach(function (element) { element.addEventListener("input", function () { const column = state.footer.columns[Number(element.dataset.footerColumnTitle)]; if (column) { column.title = element.value; saveDraft(); scheduleBuilderPreview(); } }); });
    $$("[data-footer-link-label], [data-footer-link-href]", $("#admin-panel")).forEach(function (element) { element.addEventListener("input", function () { const key = element.dataset.footerLinkLabel || element.dataset.footerLinkHref; const parts = key.split(":").map(Number); const link = state.footer.columns[parts[0]] && state.footer.columns[parts[0]].links[parts[1]]; if (link) { if (element.dataset.footerLinkLabel) link.label = element.value; else link.href = element.value; saveDraft(); scheduleBuilderPreview(); } }); });
    const importInput = $("#import-state-file");
    if (importInput) importInput.addEventListener("change", importState);
    const mediaInput = $("#media-upload-input");
    if (mediaInput) mediaInput.addEventListener("change", function () { addMediaFiles(mediaInput.files, "Biblioteca"); });
    const mediaDropInput = $("#media-drop-input");
    if (mediaDropInput) mediaDropInput.addEventListener("change", function () { addMediaFiles(mediaDropInput.files, "Biblioteca"); });
    const dropzone = $("#media-dropzone");
    if (dropzone) {
      ["dragenter", "dragover"].forEach(function (name) { dropzone.addEventListener(name, function (event) { event.preventDefault(); dropzone.classList.add("is-dragging"); }); });
      ["dragleave", "drop"].forEach(function (name) { dropzone.addEventListener(name, function (event) { event.preventDefault(); dropzone.classList.remove("is-dragging"); }); });
      dropzone.addEventListener("drop", function (event) { addMediaFiles(event.dataTransfer.files, "Biblioteca"); });
    }
  }

  function bindBuilderDrag() {
    const list = $("#layer-list");
    if (!list) return;
    let draggedId = null;
    $$(".layer-item", list).forEach(function (item) {
      item.addEventListener("dragstart", function () { draggedId = item.dataset.blockId; item.classList.add("is-dragging"); });
      item.addEventListener("dragend", function () { item.classList.remove("is-dragging"); });
      item.addEventListener("dragover", function (event) { event.preventDefault(); item.classList.add("is-dragover"); });
      item.addEventListener("dragleave", function () { item.classList.remove("is-dragover"); });
      item.addEventListener("drop", function (event) {
        event.preventDefault(); item.classList.remove("is-dragover");
        const targetId = item.dataset.blockId;
        if (!draggedId || draggedId === targetId) return;
        recordBuilderHistory();
        const from = state.pageBlocks.findIndex(function (block) { return block.id === draggedId; });
        const to = state.pageBlocks.findIndex(function (block) { return block.id === targetId; });
        const moved = state.pageBlocks.splice(from, 1)[0];
        state.pageBlocks.splice(to, 0, moved);
        saveDraft(); renderPanel();
      });
    });
  }

  function bindPageBuilderDrag() {
    const list = $("#page-layer-list");
    const page = currentPage();
    if (!list || !page) return;
    let draggedId = null;
    $$(".page-block-item", list).forEach(function (item) {
      item.addEventListener("dragstart", function () { draggedId = item.dataset.pageBlockId; item.classList.add("is-dragging"); });
      item.addEventListener("dragend", function () { item.classList.remove("is-dragging"); });
      item.addEventListener("dragover", function (event) { event.preventDefault(); item.classList.add("is-dragover"); });
      item.addEventListener("dragleave", function () { item.classList.remove("is-dragover"); });
      item.addEventListener("drop", function (event) {
        event.preventDefault(); item.classList.remove("is-dragover");
        const targetId = item.dataset.pageBlockId;
        if (!draggedId || draggedId === targetId) return;
        const from = page.blocks.findIndex(function (block) { return block.id === draggedId; });
        const to = page.blocks.findIndex(function (block) { return block.id === targetId; });
        const moved = page.blocks.splice(from, 1)[0];
        page.blocks.splice(to, 0, moved);
        touchPage(page); renderPanel();
      });
    });
  }

  function exportState() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    downloadBlob(blob, "fibra-lider-configuracao.json");
  }

  function exportCsv() {
    const rows = [["data", "evento", "regiao", "origem", "plano"]].concat(FL.getEvents().map(function (event) {
      return [event.ts, event.type, event.payload.region || "", event.payload.source || "", event.payload.planId || ""];
    }));
    const csv = rows.map(function (row) { return row.map(function (value) { return '"' + String(value).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), "fibra-lider-eventos.csv");
  }

  function exportLeads() {
    const rows = [["data", "nome", "whatsapp", "plano", "cupom", "origem", "regiao", "status"]].concat(state.leads.map(function (lead) {
      const plan = leadPlan(lead); const coupon = state.coupons.find(function (item) { return item.id === lead.couponId; });
      return [lead.createdAt, lead.name, lead.whatsapp, plan ? plan.speed + " - " + plan.title : "", coupon ? coupon.code : "", lead.source || "", lead.region || "", lead.status];
    }));
    const csv = rows.map(function (row) { return row.map(function (value) { return '"' + String(value || "").replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    downloadBlob(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), "fibra-lider-leads.csv");
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = name; link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function importState(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.brand || !parsed.plans || !parsed.pageBlocks) throw new Error("Estrutura invalida");
        FL.saveState(parsed, false);
        state = FL.getState();
        saveDraft("Configuracao importada"); renderPanel();
      } catch (error) { toast("Arquivo de configuracao invalido", "error"); }
    };
    reader.readAsText(file);
  }

  function applyAdminTheme() {
    const mode = localStorage.getItem("fl-admin-theme") || "light";
    document.documentElement.dataset.adminTheme = mode;
    $("#admin-theme-toggle").innerHTML = icon(mode === "dark" ? "sun" : "moon");
    refreshIcons();
  }

  function showApp() {
    $("#admin-login").hidden = true;
    $("#admin-app").hidden = false;
    state = FL.getState();
    FL.seedEventsIfEmpty();
    activePanel = location.hash.replace("#", "") || "dashboard";
    const studioAliases = { banners: "slides", navigation: "header", appearance: "brand" };
    if (studioAliases[activePanel]) { builderStudioTab = studioAliases[activePanel]; activePanel = "builder"; }
    if (!PANEL_META[activePanel]) activePanel = "dashboard";
    applyAdminTheme();
    setSaveStatus(state.meta.status === "published" ? "saved" : "draft");
    renderPanel();
  }

  function bindGlobalEvents() {
    $("#login-form").addEventListener("submit", function (event) {
      event.preventDefault();
      if ($("#login-password").value === "lider2026") {
        sessionStorage.setItem(FL.SESSION_KEY, "active");
        showApp();
      } else {
        $("#login-error").hidden = false;
        $("#login-password").select();
      }
    });
    $("#admin-nav").addEventListener("click", function (event) { const button = event.target.closest("[data-panel]"); if (button) setPanel(button.dataset.panel); });
    $("#sidebar-toggle").addEventListener("click", function () { document.body.classList.toggle("sidebar-open"); });
    $("#publish-button").addEventListener("click", publish);
    $("#logout-button").addEventListener("click", function () { sessionStorage.removeItem(FL.SESSION_KEY); location.reload(); });
    $("#admin-theme-toggle").addEventListener("click", function () { const next = document.documentElement.dataset.adminTheme === "dark" ? "light" : "dark"; localStorage.setItem("fl-admin-theme", next); applyAdminTheme(); if (adminMap) setTimeout(function () { adminMap.invalidateSize(); }, 80); });
    $$("[data-admin-modal-close]").forEach(function (element) { element.addEventListener("click", closeModal); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeModal(); });
  }

  function init() {
    state = FL.getState();
    bindGlobalEvents();
    refreshIcons();
    if (sessionStorage.getItem(FL.SESSION_KEY) === "active") showApp();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

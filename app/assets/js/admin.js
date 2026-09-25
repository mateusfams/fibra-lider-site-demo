(function () {
  "use strict";

  const PANEL_META = {
    dashboard: ["Dashboard", "Visao geral"],
    builder: ["Site Studio", "Experiencia do site"],
    pages: ["Paginas", "Experiencia do site"],
    banners: ["Banners e slides", "Experiencia do site"],
    media: ["Midia", "Experiencia do site"],
    navigation: ["Menu e rodape", "Experiencia do site"],
    appearance: ["Identidade visual", "Experiencia do site"],
    plans: ["Planos e ofertas", "Operacao comercial"],
    catalog: ["Apps e beneficios", "Operacao comercial"],
    coverage: ["Cobertura", "Operacao comercial"],
    support: ["Leads", "Operacao comercial"],
    leads: ["Leads", "Operacao comercial"],
    whatsapp: ["WhatsApp", "Operacao comercial"],
    campaigns: ["Campanhas", "Crescimento"],
    coupons: ["Cupons", "Crescimento"],
    seo: ["SEO local", "Crescimento"],
    pixels: ["Integracoes e APIs", "Crescimento"],
    analytics: ["Desempenho", "Crescimento"],
    heatmap: ["Mapa de interesse", "Crescimento"],
    activity: ["Atividade", "Administracao"],
    settings: ["Configuracoes", "Administracao"],
  };

  let state;
  let activePanel = "dashboard";
  let selectedBlockId = "hero";
  let selectedBannerId = null;
  let builderDevice = "desktop";
  let builderInspectorTab = "content";
  let builderStudioTab = "layout";
  let activeCampaignTab = "popups";
  let leadWorkspaceTab = "leads";
  let whatsappWorkspaceTab = "campaigns";
  let coverageWorkspaceTab = "overview";
  let seoWorkspaceTab = "overview";
  let integrationWorkspaceTab = "marketing";
  let pageEditId = null;
  let selectedPageBlockId = null;
  let pageBuilderDevice = "desktop";
  let builderMobileTab = "canvas";
  let pageBuilderMobileTab = "canvas";
  let themePreviewMode = "light";
  let analyticsPeriod = 28;
  let adminMap = null;
  let builderHistory = [];
  let builderFuture = [];
  let builderPreviewTimer = null;
  let crudSearchTimer = null;
  let pendingConfirmation = null;
  let modalReturnFocus = null;

  const crudState = {
    plans: { search: "", category: "all", status: "all", sort: "featured", page: 1, pageSize: 6, selected: new Set() },
    pages: { search: "", status: "all", sort: "updated", page: 1, pageSize: 6, selected: new Set() },
    apps: { search: "", category: "all", sort: "name", page: 1, pageSize: 6, selected: new Set() },
    media: { search: "", usage: "all", sort: "recent", page: 1, pageSize: 8, selected: new Set() },
    regions: { search: "", type: "all", status: "all", sort: "priority", page: 1, pageSize: 8, selected: new Set() },
    leads: { search: "", source: "all", sort: "recent", page: 1, pageSize: 50, selected: new Set() },
    popups: { search: "", status: "all", sort: "recent", page: 1, pageSize: 6, selected: new Set() },
    coupons: { search: "", status: "all", sort: "recent", page: 1, pageSize: 6, selected: new Set() },
    activity: { search: "", resource: "all", sort: "recent", page: 1, pageSize: 12, selected: new Set() },
  };

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

  function writeAudit(action, resource, label, detail) {
    if (window.FL && FL.recordAudit) FL.recordAudit(state, action, resource, label, detail);
  }

  function saveDraft(message, auditEntry) {
    if (auditEntry) writeAudit(auditEntry.action, auditEntry.resource, auditEntry.label, auditEntry.detail);
    setSaveStatus("saving");
    state = FL.saveState(state, false);
    setTimeout(function () { setSaveStatus("draft"); }, 180);
    if (message) toast(message);
  }

  function saveRuntime(message, auditEntry) {
    if (auditEntry) writeAudit(auditEntry.action, auditEntry.resource, auditEntry.label, auditEntry.detail);
    state = FL.saveRuntimeState(state);
    setSaveStatus(state.meta.status === "published" ? "saved" : "draft");
    if (message) toast(message);
  }

  function publish() {
    if (window.FLThemeBuilder) {
      const workspace = window.FLVisualBuilderEditor && window.FLVisualBuilderEditor.getWorkspace() || window.FLThemeBuilder.storage.loadWorkspace(state).workspace;
      const validation = window.FLThemeBuilder.validateWorkspace(workspace);
      if (!validation.valid) {
        toast("O Theme Builder possui erros que bloqueiam a publicacao", "error");
        if (activePanel !== "builder") setPanel("builder");
        return;
      }
      window.FLThemeBuilder.storage.publishWorkspace(state, workspace);
    }
    writeAudit("publish", "site", "Site publicado", "Versao " + state.meta.version + " enviada para o site publico");
    state = FL.saveState(state, true);
    setSaveStatus("saved");
    toast("Site publicado com sucesso", "success");
    renderPanel();
  }

  function requestConfirmation(config, callback) {
    pendingConfirmation = callback;
    openModal(FLAdmin.confirmation(config));
  }

  function auditLabel(action) {
    return { create: "Criacao", update: "Atualizacao", delete: "Exclusao", publish: "Publicacao", import: "Importacao", export: "Exportacao", bulk: "Acao em massa", contact: "Contato" }[action] || "Alteracao";
  }

  function navGroupPreferences() {
    try { return JSON.parse(localStorage.getItem("fl-admin-nav-groups") || "{}"); }
    catch (error) { return {}; }
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
    const constraints = ["min", "max", "step", "maxlength"].map(function (name) { return config[name] == null ? "" : ' ' + name + '="' + esc(config[name]) + '"'; }).join("");
    return '<label class="field"><span>' + esc(label) + '</span><input type="' + type + '" value="' + esc(value) + '" data-bind="' + esc(path) + '"' + (config.placeholder ? ' placeholder="' + esc(config.placeholder) + '"' : "") + constraints + ">" + help + "</label>";
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
    const destination = region.lat !== null && region.lat !== "" && region.lng !== null && region.lng !== "" && Number.isFinite(Number(region.lat)) && Number.isFinite(Number(region.lng)) ? Number(region.lat) + "," + Number(region.lng) : region.address || region.name;
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
      if (frame) frame.src = "./index.html?preview=" + Date.now() + "&theme=" + state.builderSettings.previewTheme + "&selected=" + encodeURIComponent(selectedBlockId);
    }, 480);
  }

  function tenantHost() {
    try { return new URL(state.brand.siteUrl || state.seo.canonicalUrl).hostname; }
    catch (error) { return (state.brand.slug || "meu-provedor") + ".com.br"; }
  }

  function homeSectionDefaults(type) {
    const base = { id: FL.uid("section"), type: "custom-" + type, label: HOME_SECTION_LIBRARY[type].label, visible: true, locked: false, tone: "light", spacing: "normal", container: "normal", alignment: "left", anchor: "", backgroundImage: "", backgroundPosition: "center", hideMobile: false, hideDesktop: false, content: {} };
    if (type === "content") { base.container = "narrow"; base.alignment = "center"; base.content = { eyebrow: state.brand.name, title: "Uma secao feita para a sua mensagem.", text: "Apresente uma novidade, uma area atendida ou um diferencial da sua empresa.", buttonLabel: "Conhecer planos", buttonUrl: "#planos" }; }
    if (type === "media") { base.content = { eyebrow: "Conexao regional", title: "Tecnologia com atendimento proximo.", text: "Combine uma imagem real com uma mensagem clara para aproximar sua marca do cliente.", image: state.mediaLibrary[0] ? state.mediaLibrary[0].url : state.banners[0].image, imageAlt: state.brand.name, imageSide: "left", buttonLabel: "Falar com a equipe", buttonUrl: "whatsapp" }; }
    if (type === "stats") { base.alignment = "center"; base.content = { eyebrow: "Nossa presenca", title: "Resultados que constroem confianca.", text: "Use numeros reais para mostrar a forca da operacao.", items: "100% | fibra optica\n5 | cidades atendidas\n18 | planos e combos\nSuporte local | perto de voce" }; }
    if (type === "features") { base.content = { eyebrow: "Diferenciais", title: "Tudo o que o cliente precisa para escolher.", text: "Organize argumentos comerciais em uma grade facil de comparar.", items: "wifi | Wi-Fi para a casa toda | Equipamento e orientacao para melhorar a experiencia.\nheadphones | Atendimento regional | Uma equipe proxima para orientar e resolver.\ngauge | Velocidade de verdade | Planos preparados para trabalho, jogos e streaming." }; }
    if (type === "gallery") { base.alignment = "center"; base.content = { eyebrow: "Conheca a " + state.brand.name, title: "Uma operacao conectada com a regiao.", text: "Mostre estrutura, equipe, instalacoes ou clientes.", items: state.mediaLibrary.slice(0, 3).map(function (item) { return item.url + " | " + item.name; }).join("\n") }; }
    if (type === "cta") { base.tone = "brand"; base.content = { eyebrow: "Vamos conectar?", title: "Consulte a cobertura no seu endereco.", text: "Fale com a equipe e encontre o plano ideal para sua rotina.", buttonLabel: "Consultar agora", buttonUrl: "#cobertura" }; }
    return base;
  }

  function analyticsData() {
    const events = FL.getEvents();
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - analyticsPeriod);
    const publicEvents = events.filter(function (event) { return event.path !== "/admin.html" && new Date(event.ts) >= cutoff; });
    const count = function (type) { return publicEvents.filter(function (event) { return event.type === type; }).length; };
    const views = count("page_view");
    const planClicks = count("plan_click");
    const whatsapp = count("whatsapp_click");
    const coverage = count("coverage_search");
    const leads = state.leads.filter(function (lead) { return new Date(lead.createdAt) >= cutoff; }).length;
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

  function renderDashboardLegacy() {
    const data = analyticsData();
    const mobileEvents = data.events.filter(function (event) { return event.viewport && Number(event.viewport.width) < 700; }).length;
    const mobileShare = data.events.length ? Math.round((mobileEvents / data.events.length) * 100) : 0;
    const sources = groupByPayload(data.events, "source");
    const sourceEntries = Object.entries(sources).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
    const maxSource = sourceEntries.length ? sourceEntries[0][1] : 1;
    const planCounts = groupByPayload(data.events.filter(function (event) { return event.type === "plan_click" || event.type === "whatsapp_click"; }), "planId");
    const topPlans = Object.entries(planCounts).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 4);
    const leadingPlan = state.plans.find(function (plan) { return topPlans[0] && plan.id === topPlans[0][0]; }) || state.plans.find(function (plan) { return plan.featured && plan.active; }) || state.plans[0];
    const leadingRegions = state.regions.slice().sort(function (a, b) { return Number(b.interest || 0) - Number(a.interest || 0); });
    const leadingRegion = leadingRegions[0] ? leadingRegions[0].name : "Regiao principal";
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
    const mappedRegions = state.regions.filter(function (item) { return item.active && item.lat !== null && item.lat !== "" && item.lng !== null && item.lng !== "" && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng)); }).length;
    return [
      panelHeader("Visao geral", "Acompanhe a jornada de aquisicao e os pontos que mais geram interesse.", '<div class="heading-actions"><select class="compact-select" data-analytics-period aria-label="Periodo das metricas"><option value="28"' + (analyticsPeriod === 28 ? " selected" : "") + '>Ultimos 28 dias</option><option value="7"' + (analyticsPeriod === 7 ? " selected" : "") + '>Ultimos 7 dias</option><option value="1"' + (analyticsPeriod === 1 ? " selected" : "") + '>Hoje</option></select><button class="button button--ghost" data-action="export-report">' + icon("download") + " Exportar</button></div>"),
      '<section class="dashboard-welcome"><div><span><i class="status-dot"></i> Site ' + status.toLowerCase() + '</span><h3>Bom trabalho, equipe ' + esc(state.brand.name) + '.</h3><p>' + esc(leadingPlan ? leadingPlan.speed + " lidera o interesse comercial no periodo." : "As campanhas ja estao gerando novos sinais comerciais.") + '</p><button class="text-button" data-goto="support">Abrir fila comercial ' + icon("arrow-right") + '</button></div><div class="welcome-score"><small>Meta mensal de leads</small><strong>' + data.leads + '<span> / ' + state.dashboardTargets.monthlyLeads + '</span></strong><div><i style="width:' + Math.min(100, (data.leads / state.dashboardTargets.monthlyLeads) * 100) + '%"></i></div><p>' + Math.round((data.leads / state.dashboardTargets.monthlyLeads) * 100) + '% da meta</p></div></section>',
      '<section class="metrics-grid">',
      metricCard("Visitantes", String(data.views), "+12,8%", "32% vieram do Google", "users", "blue"),
      metricCard("Interesse em planos", String(data.planClicks), "+18,4%", leadingPlan ? leadingPlan.speed + " lidera cliques" : "ofertas em observacao", "mouse-pointer-click", "violet"),
      metricCard("Leads capturados", String(data.leads), "+9,2%", data.conversion.toFixed(1).replace(".", ",") + "% de conversao", "contact-round", "green"),
      metricCard("Consultas de cobertura", String(data.coverage), "+6,7%", leadingRegion + " concentra a procura", "map-pin-check", "orange"),
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
      apps: ["appsEyebrow", "appsTitle", "appsText"],
      business: ["businessEyebrow", "businessTitle", "businessText", "businessFeatures", "businessSignal"],
      coverage: ["coverageEyebrow", "coverageTitle", "coverageText", "coverageMapLabel"],
      testimonials: ["testimonialEyebrow", "testimonialTitle"],
      faq: ["faqEyebrow", "faqTitle", "faqText"],
      support: ["supportEyebrow", "supportTitle", "supportText"],
      final: ["finalEyebrow", "finalTitle", "finalText"],
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

  function heroBannerInspector() {
    if (!state.banners.length) return '<div class="empty-state empty-state--compact">' + icon("gallery-horizontal") + '<h3>Nenhum slide</h3><p>Adicione o primeiro destaque da home.</p><button class="button button--primary" data-action="builder-add-banner">' + icon("plus") + ' Adicionar slide</button></div>';
    if (!state.banners.some(function (item) { return item.id === selectedBannerId; })) selectedBannerId = state.banners[0].id;
    const banner = state.banners.find(function (item) { return item.id === selectedBannerId; });
    const bannerField = function (label, key, type, options) {
      const value = banner[key] == null ? "" : banner[key];
      if (type === "textarea") return '<label class="field"><span>' + esc(label) + '</span><textarea rows="4" data-banner-field="' + key + '">' + esc(value) + '</textarea></label>';
      if (type === "select") return '<label class="field"><span>' + esc(label) + '</span><select data-banner-field="' + key + '">' + options.map(function (item) { return '<option value="' + esc(item.value) + '"' + (String(item.value) === String(value) ? " selected" : "") + '>' + esc(item.label) + '</option>'; }).join("") + '</select></label>';
      return '<label class="field"><span>' + esc(label) + '</span><input data-banner-field="' + key + '"' + (type ? ' type="' + type + '"' : "") + ' value="' + esc(value) + '"></label>';
    };
    return '<div class="builder-banner-switcher"><div>' + state.banners.map(function (item, index) { return '<button type="button" class="' + (item.id === banner.id ? "is-active" : "") + '" data-action="select-builder-banner" data-id="' + esc(item.id) + '" title="Editar ' + esc(item.name) + '"><img src="' + esc(FL.safeImageUrl(item.image, "./assets/img/hero-family-fiber.jpg")) + '" alt=""><span>0' + (index + 1) + '</span></button>'; }).join("") + '</div><button class="icon-button" data-action="builder-add-banner" title="Adicionar slide">' + icon("plus") + '</button></div>' +
      '<div class="builder-banner-preview"><img src="' + esc(FL.safeImageUrl(banner.image, "./assets/img/hero-family-fiber.jpg")) + '" alt=""><span>' + esc(banner.badge || banner.name) + '</span><strong>' + esc(banner.title) + '</strong></div>' +
      '<div class="builder-banner-actions"><button class="button button--ghost" data-action="move-builder-banner-up" data-id="' + esc(banner.id) + '" title="Mover para tras">' + icon("arrow-left") + '</button><button class="button button--ghost" data-action="move-builder-banner-down" data-id="' + esc(banner.id) + '" title="Mover para frente">' + icon("arrow-right") + '</button><button class="button button--ghost" data-action="duplicate-builder-banner" data-id="' + esc(banner.id) + '">' + icon("copy") + ' Duplicar</button><button class="icon-button icon-button--danger" data-action="delete-builder-banner" data-id="' + esc(banner.id) + '" title="Excluir">' + icon("trash-2") + '</button></div>' +
      bannerField("Nome interno", "name") + bannerField("Chamada curta", "eyebrow") + bannerField("Titulo principal", "title") + bannerField("Descricao", "subtitle", "textarea") +
      '<div class="upload-zone upload-zone--compact"><input id="builder-banner-upload" type="file" accept="image/jpeg,image/png,image/webp"><span>' + icon("image-up") + '</span><div><strong>Trocar imagem</strong><p>1920 x 800 px. A imagem sera comprimida e convertida.</p></div></div>' +
      '<label class="field"><span>Imagem da biblioteca</span><select data-banner-field="image"><option value="' + esc(banner.image) + '">Imagem atual</option>' + state.mediaLibrary.map(function (item) { return '<option value="' + esc(item.url) + '"' + (item.url === banner.image ? " selected" : "") + '>' + esc(item.name) + '</option>'; }).join("") + '</select></label>' +
      '<div class="inspector-field-pair">' + bannerField("Botao principal", "primaryLabel") + bannerField("Destino", "primaryLink") + '</div><div class="inspector-field-pair">' + bannerField("Botao secundario", "secondaryLabel") + bannerField("Destino", "secondaryLink") + '</div>' +
      '<div class="inspector-field-pair">' + bannerField("Selo", "badge") + bannerField("Enquadramento", "position", "select", [{ value: "left", label: "Esquerda" }, { value: "center", label: "Centro" }, { value: "right", label: "Direita" }]) + '</div>' +
      '<label class="field range-field"><span>Contraste da imagem <b>' + Number(banner.overlay || 65) + '%</b></span><input data-banner-field="overlay" type="range" min="35" max="90" value="' + Number(banner.overlay || 65) + '"></label>' +
      '<label class="toggle-row"><span><strong>Slide publicado</strong><small>Disponivel no carrossel da home</small></span><input data-banner-field="active" type="checkbox"' + (banner.active ? " checked" : "") + '><i></i></label>';
  }

  function renderDashboard() {
    const data = analyticsData();
    const inventory = window.FLCoverage ? FLCoverage.inventory(state) : { manual: state.regions, imported: [], effective: state.regions, geometries: 0 };
    const eventsBySource = Object.entries(groupByPayload(data.events, "source")).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
    const sourceMax = eventsBySource[0] ? eventsBySource[0][1] : 1;
    const planCounts = groupByPayload(data.events.filter(function (event) { return ["plan_click", "whatsapp_click"].includes(event.type); }), "planId");
    const topPlans = Object.entries(planCounts).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 4);
    const leadingPlan = state.plans.find(function (plan) { return topPlans[0] && plan.id === topPlans[0][0]; }) || state.plans.find(function (plan) { return plan.featured && plan.active; }) || state.plans[0];
    const regions = state.regions.slice().sort(function (a, b) { return Number(b.interest || 0) - Number(a.interest || 0); });
    const days = Array.from({ length: 14 }, function (_, index) {
      const day = new Date(); day.setDate(day.getDate() - (13 - index));
      const key = day.toISOString().slice(0, 10);
      return { label: day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), total: data.events.filter(function (event) { return event.ts.slice(0, 10) === key; }).length };
    });
    const maxDay = Math.max.apply(null, days.map(function (day) { return day.total; }).concat([1]));
    const seoChecks = [state.seo.title, state.seo.description, state.seo.canonicalUrl, state.seo.serviceArea, state.seo.ogImage, state.seo.indexSite];
    const seoScore = Math.round((seoChecks.filter(Boolean).length / seoChecks.length) * 100);
    const leadGoal = Math.max(1, Number(state.dashboardTargets.monthlyLeads || 1));
    const goalPercent = Math.min(100, Math.round((data.leads / leadGoal) * 100));
    const activeCampaigns = state.popupCampaigns.filter(function (item) { return item.active; }).length;
    return [
      panelHeader("Visao geral", "Desempenho, funil e demanda regional em uma unica leitura.", '<div class="heading-actions"><select class="compact-select" data-analytics-period aria-label="Periodo das metricas"><option value="28"' + (analyticsPeriod === 28 ? " selected" : "") + '>Ultimos 28 dias</option><option value="7"' + (analyticsPeriod === 7 ? " selected" : "") + '>Ultimos 7 dias</option><option value="1"' + (analyticsPeriod === 1 ? " selected" : "") + '>Hoje</option></select><button class="button button--ghost" data-action="export-report">' + icon("download") + ' Exportar</button></div>'),
      '<section class="dashboard-welcome"><div><span><i class="status-dot"></i> Operacao ' + (state.meta.status === "published" ? "publicada" : "em rascunho") + '</span><h3>' + esc(state.brand.name) + ' em movimento.</h3><p>' + esc(leadingPlan ? leadingPlan.speed + " concentra o maior interesse comercial do periodo." : "A jornada comercial esta pronta para receber novos contatos.") + '</p><button class="text-button" data-goto="leads">Abrir fila de leads ' + icon("arrow-right") + '</button></div><div class="welcome-score"><small>Meta mensal de leads</small><strong>' + data.leads + '<span> / ' + leadGoal + '</span></strong><div><i style="width:' + goalPercent + '%"></i></div><p>' + goalPercent + '% da meta</p></div></section>',
      '<section class="metrics-grid">' + metricCard("Visitantes", String(data.views), "+12,8%", "alcance no periodo", "users", "blue") + metricCard("Interesse em planos", String(data.planClicks), "+18,4%", leadingPlan ? leadingPlan.speed + " lidera" : "ofertas monitoradas", "mouse-pointer-click", "violet") + metricCard("Leads capturados", String(data.leads), "+9,2%", data.conversion.toFixed(1).replace(".", ",") + "% de conversao", "contact-round", "green") + metricCard("Consultas de cobertura", String(data.coverage), "+6,7%", inventory.effective.length + " areas efetivas", "map-pin-check", "orange") + '</section>',
      '<section class="dashboard-grid dashboard-grid--main"><article class="admin-card chart-card">' + cardTitle("Interacoes no site", "Volume diario de eventos first-party", '<span class="live-chip"><i></i> Atualizado</span>') + '<div class="chart-summary"><strong>' + data.events.length + '</strong><span>Total de interacoes <em>+14,6%</em></span></div><div class="bar-chart">' + days.map(function (day) { return '<div title="' + day.label + ': ' + day.total + '"><i style="height:' + Math.max(8, (day.total / maxDay) * 100) + '%"></i><span>' + day.label.split("/")[0] + '</span></div>'; }).join("") + '</div><div class="chart-legend"><span><i class="legend-dot legend-dot--blue"></i> Eventos registrados</span><small>Periodo selecionado</small></div></article><article class="admin-card sources-card">' + cardTitle("Origem dos acessos", "Canais com maior participacao", "") + '<div class="source-list">' + eventsBySource.map(function (entry, index) { const colors = ["#0874e7", "#e54881", "#29b575", "#f2a41d", "#6259e8"]; return '<div class="source-row"><span><i style="background:' + colors[index] + '"></i>' + esc(entry[0]) + '</span><div><b style="width:' + ((entry[1] / sourceMax) * 100) + '%"></b></div><strong>' + entry[1] + '</strong></div>'; }).join("") + '</div><div class="dashboard-mini-insight"><span>' + icon("smartphone") + '</span><div><strong>68% em dispositivos moveis</strong><small>Experiencia responsiva priorizada</small></div></div></article></section>',
      '<section class="dashboard-grid dashboard-grid--bottom"><article class="admin-card">' + cardTitle("Funil comercial", "Da visita ao contato no WhatsApp", "") + '<div class="funnel"><div><span>Visitantes</span><strong>' + data.views + '</strong><i style="--w:100%"></i></div><div><span>Interesse em planos</span><strong>' + data.planClicks + '</strong><i style="--w:72%"></i></div><div><span>Consultas de cobertura</span><strong>' + data.coverage + '</strong><i style="--w:48%"></i></div><div><span>Leads capturados</span><strong>' + data.leads + '</strong><i style="--w:35%"></i></div></div></article><article class="admin-card">' + cardTitle("Planos com maior interesse", "Cliques e contatos por oferta", "") + '<div class="ranking-list">' + topPlans.map(function (entry, index) { const plan = state.plans.find(function (item) { return item.id === entry[0]; }); return '<div><span class="rank">0' + (index + 1) + '</span><div><strong>' + esc(plan ? plan.speed : "Plano removido") + '</strong><small>' + esc(plan ? plan.title : entry[0]) + '</small></div><b>' + entry[1] + '</b></div>'; }).join("") + '</div><button class="text-button" data-goto="plans">Gerenciar ofertas ' + icon("arrow-right") + '</button></article><article class="admin-card ops-health">' + cardTitle("Operacao digital", "Pontos essenciais do site", "") + '<div><span>' + icon("search-check") + '</span><p><strong>SEO local</strong><small>' + seoScore + '% configurado</small></p><em>' + seoScore + '%</em></div><div><span>' + icon("map-pinned") + '</span><p><strong>Cobertura</strong><small>' + inventory.geometries + ' geometrias importadas</small></p><em>' + inventory.effective.length + ' areas</em></div><div><span>' + icon("megaphone") + '</span><p><strong>Campanhas</strong><small>Popups comerciais publicados</small></p><em>' + activeCampaigns + ' ativa(s)</em></div></article></section>',
      '<section class="heatmap-layout dashboard-map-block"><article class="admin-card map-admin-card">' + cardTitle("Mapa de cobertura e interesse", "Malha operacional e demanda regional no mesmo contexto.", '<button class="text-button" data-goto="coverage">Gerenciar cobertura ' + icon("arrow-right") + '</button>') + regionHeatMap() + '</article><aside class="admin-card">' + cardTitle("Prioridades regionais", "Locais ordenados por interesse", "") + '<div class="priority-list">' + regions.slice(0, 5).map(function (region, index) { return '<div><span class="rank">0' + (index + 1) + '</span><div><strong>' + esc(region.name) + '</strong><small>' + esc(region.status) + '</small><i><b style="width:' + Number(region.interest || 0) + '%"></b></i></div><em>' + Number(region.interest || 0) + '%</em></div>'; }).join("") + '</div><button class="button button--ghost button--block" data-goto="campaigns">' + icon("megaphone") + ' Criar campanha regional</button></aside></section>',
    ].join("");
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
      appsText: "Descricao", businessFeatures: "Diferenciais (uma linha por item)", businessSignal: "Selo da imagem",
      coverageMapLabel: "Nome da rede no mapa", faqText: "Texto de apoio", supportText: "Texto de apoio", finalEyebrow: "Chamada curta",
    };
    if (String(block.type).startsWith("custom-")) return customBlockInspector(block);
    if (block.id === "hero") {
      return heroBannerInspector();
    }
    const paths = blockContentPaths(block.id);
    if (!paths.length) {
      return '<div class="inspector-callout">' + icon("settings-2") + '<div><strong>Secao estrutural</strong><p>Esta secao usa o conteudo cadastrado nos modulos do painel.</p></div></div>';
    }
    return paths.map(function (key) {
      return field(labels[key], "content." + key, { type: key.toLowerCase().includes("text") || key === "businessFeatures" ? "textarea" : "text", rows: key === "businessFeatures" ? 5 : 3 });
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
      '<div class="builder-canvas" style="--builder-zoom:' + (zoom / 100) + '"><div class="preview-frame preview-frame--' + builderDevice + '"><div class="preview-browser"><span></span><span></span><span></span><div>' + esc(tenantHost()) + '</div></div><iframe id="site-preview" src="./index.html?preview=1&theme=' + previewTheme + '&selected=' + encodeURIComponent(selectedBlockId) + '" title="Preview do site"></iframe></div></div>',
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
    return '<aside class="studio-live-preview"><div class="studio-live-preview__head"><div><strong>' + esc(title) + '</strong><small>Preview sincronizado</small></div><button class="icon-button" data-action="builder-refresh" title="Atualizar preview">' + icon("refresh-cw") + '</button></div><div class="studio-live-preview__device"><iframe id="site-preview" src="./index.html?preview=1&theme=' + esc(state.builderSettings.previewTheme || "light") + (section ? "&section=" + encodeURIComponent(section) : "") + '&selected=' + encodeURIComponent(section || selectedBlockId) + '" title="Preview do site"></iframe></div></aside>';
  }

  function renderStudioSlides() {
    return '<section class="studio-editor-grid"><div class="studio-editor-stack"><article class="admin-card studio-summary-card">' + cardTitle("Carrossel principal", "Crie e ordene as mensagens da primeira dobra.", '<button class="button button--primary" data-action="new-banner">' + icon("plus") + ' Novo slide</button>') + '<div class="studio-spec-row"><span>' + icon("monitor") + '<b>1920 x 800</b><small>desktop</small></span><span>' + icon("smartphone") + '<b>1080 x 1350</b><small>mobile</small></span><span>' + icon("image-down") + '<b>WebP ou JPG</b><small>ate 5 MB</small></span></div><div class="settings-inline">' + toggle("Rotacao automatica", "slider.autoplay", "Troca os slides sem interacao") + toggle("Pausar no hover", "slider.pauseOnHover", "Mantem a leitura confortavel") + field("Intervalo", "slider.interval", { type: "number", help: "Milissegundos" }) + '</div></article><div class="studio-slide-list">' + state.banners.map(function (banner, index) {
      return '<article class="studio-slide-card"><div class="studio-slide-card__image"><img src="' + esc(FL.safeImageUrl(banner.image, "./assets/img/hero-family-fiber.jpg")) + '" alt=""><span>0' + (index + 1) + '</span></div><div><span class="status-badge ' + (banner.active ? "status-badge--success" : "") + '">' + (banner.active ? "Publicado" : "Pausado") + '</span><h3>' + esc(banner.name) + '</h3><p>' + esc(banner.title) + '</p><small>' + esc(banner.primaryLabel) + ' &middot; camada ' + banner.overlay + '%</small></div><div class="row-actions"><button class="icon-button" data-action="toggle-banner" data-id="' + esc(banner.id) + '" title="' + (banner.active ? "Pausar" : "Ativar") + '">' + icon(banner.active ? "pause" : "play") + '</button><button class="icon-button" data-action="edit-banner" data-id="' + esc(banner.id) + '" title="Editar">' + icon("pencil") + '</button><button class="icon-button" data-action="duplicate-banner" data-id="' + esc(banner.id) + '" title="Duplicar">' + icon("copy") + '</button><button class="icon-button icon-button--danger" data-action="delete-banner" data-id="' + esc(banner.id) + '" title="Excluir">' + icon("trash-2") + '</button></div></article>';
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
    if (window.FLVisualBuilderEditor) return window.FLVisualBuilderEditor.render(state);
    return '<section class="admin-state admin-state--error"><h2>Theme Builder indisponivel</h2><p>Recarregue a pagina para inicializar os modulos do editor.</p></section>';
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
    const view = crudState.pages;
    const result = FLAdmin.collection(state.pages, { search: view.search, page: view.page, pageSize: view.pageSize, searchText: function (item) { return [item.title, item.slug, item.description, item.status].join(" "); }, predicate: function (item) { return view.status === "all" || item.status === view.status; }, sort: function (a, b) { if (view.sort === "name") return String(a.title).localeCompare(String(b.title), "pt-BR"); if (view.sort === "status") return String(a.status).localeCompare(String(b.status)); return String(b.updatedAt).localeCompare(String(a.updatedAt)); } });
    view.page = result.page;
    const published = state.pages.filter(function (item) { return item.status === "published"; }).length;
    const blocks = state.pages.reduce(function (total, item) { return total + item.blocks.length; }, 0);
    return [
      panelHeader("Paginas do site", "Crie paginas institucionais, documentos e campanhas com blocos reutilizaveis.", '<button class="button button--primary" data-action="new-page">' + icon("plus") + " Nova pagina</button>"),
      '<section class="quick-stats page-stats"><article><span>' + icon("files") + '</span><div><strong>' + state.pages.length + '</strong><small>paginas cadastradas</small></div></article><article><span>' + icon("globe-2") + '</span><div><strong>' + published + '</strong><small>paginas publicadas</small></div></article><article><span>' + icon("layout-template") + '</span><div><strong>' + blocks + '</strong><small>blocos de conteudo</small></div></article><article><span>' + icon("search-check") + '</span><div><strong>SEO</strong><small>titulo e descricao por pagina</small></div></article></section>',
      FLAdmin.toolbar({ key: "pages", search: view.search, placeholder: "Buscar por titulo, URL ou descricao", count: result.filteredTotal, singular: "pagina", plural: "paginas", filters: [{ name: "status", label: "Status", value: view.status, options: [{ value: "all", label: "Todos os status" }, { value: "published", label: "Publicadas" }, { value: "draft", label: "Rascunhos" }] }], sortValue: view.sort, sortOptions: [{ value: "updated", label: "Atualizadas recentemente" }, { value: "name", label: "Nome A-Z" }, { value: "status", label: "Status" }] }),
      FLAdmin.bulkBar({ key: "pages", count: view.selected.size, actions: [{ id: "publish", label: "Publicar", icon: "globe-2" }, { id: "draft", label: "Mover para rascunho", icon: "file-clock" }, { id: "delete", label: "Excluir", icon: "trash-2", danger: true }] }),
      '<section class="admin-card page-library">',
      cardTitle("Biblioteca de paginas", "Cada pagina possui URL, status e construtor visual proprios.", '<span class="status-badge status-badge--success">Estrutura pronta</span>'),
      result.items.length ? '<div class="page-list">' + result.items.map(function (item) {
        return '<article class="page-row' + (view.selected.has(item.id) ? " is-selected" : "") + '"><label class="crud-checkbox" title="Selecionar pagina"><input type="checkbox" data-crud-select="pages" data-id="' + esc(item.id) + '"' + (view.selected.has(item.id) ? " checked" : "") + '><span></span></label><span class="page-row__icon">' + icon("file-text") + '</span><div class="page-row__main"><div><strong>' + esc(item.title) + '</strong><span class="status-badge ' + (item.status === "published" ? "status-badge--success" : "") + '">' + (item.status === "published" ? "Publicada" : "Rascunho") + '</span></div><p>/' + esc(item.slug) + '</p><small>' + item.blocks.length + ' blocos &middot; atualizada em ' + esc(item.updatedAt) + '</small></div><div class="row-actions"><button class="button button--ghost" data-action="open-page" data-id="' + esc(item.id) + '">' + icon("external-link") + ' Visualizar</button><button class="icon-button" data-action="edit-page" data-id="' + esc(item.id) + '" title="Abrir construtor">' + icon("panels-top-left") + '</button><button class="icon-button" data-action="page-settings" data-id="' + esc(item.id) + '" title="Configuracoes">' + icon("settings-2") + '</button><button class="icon-button" data-action="duplicate-page" data-id="' + esc(item.id) + '" title="Duplicar">' + icon("copy") + '</button><button class="icon-button icon-button--danger" data-action="delete-page" data-id="' + esc(item.id) + '" title="Excluir">' + icon("trash-2") + "</button></div></article>";
      }).join("") + '</div>' : FLAdmin.emptyState({ icon: "files", title: view.search || view.status !== "all" ? "Nenhuma pagina encontrada" : "Nenhuma pagina criada", description: view.search || view.status !== "all" ? "Revise a busca ou o filtro para encontrar outras paginas." : "Crie uma pagina institucional, juridica ou de campanha.", action: state.pages.length ? "clear-pages-filters" : "new-page", actionLabel: state.pages.length ? "Limpar filtros" : "Nova pagina" }) + '</section>',
      FLAdmin.pagination(result, "pages"),
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
      '<div class="builder-canvas"><div class="preview-frame preview-frame--' + pageBuilderDevice + '"><div class="preview-browser"><span></span><span></span><span></span><div>' + esc(tenantHost()) + '/' + esc(page.slug) + '</div></div><iframe id="page-preview" src="./pagina.html?slug=' + encodeURIComponent(page.slug) + '&preview=1" title="Preview da pagina"></iframe></div></div>',
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
        return '<article class="banner-row"><div class="banner-thumb"><img src="' + esc(FL.safeImageUrl(banner.image, "./assets/img/hero-family-fiber.jpg")) + '" alt=""><span>0' + (index + 1) + '</span></div><div class="banner-info"><div><span class="status-badge ' + (banner.active ? "status-badge--success" : "") + '">' + (banner.active ? "Ativo" : "Pausado") + '</span><small>' + esc(banner.badge) + '</small></div><h3>' + esc(banner.name) + '</h3><p>' + esc(banner.title) + '</p></div><div class="banner-meta"><span><i data-lucide="mouse-pointer-click"></i>' + esc(banner.primaryLabel) + '</span><span><i data-lucide="layers-2"></i>Camada ' + banner.overlay + '%</span></div><div class="row-actions"><button class="icon-button" data-action="toggle-banner" data-id="' + esc(banner.id) + '" title="' + (banner.active ? "Pausar" : "Ativar") + '">' + icon(banner.active ? "pause" : "play") + '</button><button class="icon-button" data-action="edit-banner" data-id="' + esc(banner.id) + '" title="Editar">' + icon("pencil") + '</button><button class="icon-button" data-action="duplicate-banner" data-id="' + esc(banner.id) + '" title="Duplicar">' + icon("copy") + '</button><button class="icon-button icon-button--danger" data-action="delete-banner" data-id="' + esc(banner.id) + '" title="Excluir">' + icon("trash-2") + "</button></div></article>";
      }).join("") + "</div></section>",
    ].join("");
  }

  function renderMedia() {
    const view = crudState.media;
    const usages = Array.from(new Set(state.mediaLibrary.map(function (item) { return item.usage || "Biblioteca"; }))).sort();
    const result = FLAdmin.collection(state.mediaLibrary, { search: view.search, page: view.page, pageSize: view.pageSize, searchText: function (item) { return [item.name, item.type, item.usage, item.width + "x" + item.height].join(" "); }, predicate: function (item) { return view.usage === "all" || (item.usage || "Biblioteca") === view.usage; }, sort: function (a, b) { if (view.sort === "name") return String(a.name).localeCompare(String(b.name), "pt-BR"); if (view.sort === "size") return Number(b.bytes) - Number(a.bytes); return String(b.createdAt).localeCompare(String(a.createdAt)); } });
    view.page = result.page;
    const totalBytes = state.mediaLibrary.reduce(function (sum, item) { return sum + Number(item.bytes || 0); }, 0);
    const optimized = state.mediaLibrary.filter(function (item) { return Number(item.originalBytes || 0) > Number(item.bytes || 0); }).length;
    return [
      panelHeader("Central de midia", "Otimize, converta e reutilize imagens sem comprometer a velocidade do site.", '<label class="button button--primary media-upload-button">' + icon("upload") + ' Enviar imagens<input id="media-upload-input" type="file" accept="image/jpeg,image/png,image/webp" multiple></label>'),
      '<section class="quick-stats media-stats"><article><span>' + icon("images") + '</span><div><strong>' + state.mediaLibrary.length + '</strong><small>arquivos na biblioteca</small></div></article><article><span>' + icon("hard-drive") + '</span><div><strong>' + formatBytes(totalBytes) + '</strong><small>peso total das imagens</small></div></article><article><span>' + icon("package-check") + '</span><div><strong>' + optimized + '</strong><small>arquivos otimizados</small></div></article><article><span>' + icon("gauge") + '</span><div><strong>' + formatBytes(mediaSavings()) + '</strong><small>trafego economizado</small></div></article></section>',
      '<section class="admin-card media-optimizer">',
      cardTitle("Otimizador automatico", "As configuracoes abaixo tambem valem para banners, paginas e logos.", '<span class="status-badge status-badge--success">Ativo</span>'),
      '<div class="media-optimizer__layout"><label class="media-dropzone" id="media-dropzone"><input id="media-drop-input" type="file" accept="image/jpeg,image/png,image/webp" multiple><span>' + icon("image-down") + '</span><strong>Arraste imagens para converter</strong><p>JPEG, PNG ou WebP. O arquivo e redimensionado antes de entrar no site.</p><em>Selecionar arquivos</em></label><div class="media-options"><div class="form-grid">' + field("Formato final", "mediaSettings.format", { type: "select", options: [{ value: "image/webp", label: "WebP (recomendado)" }, { value: "image/jpeg", label: "JPEG" }, { value: "image/png", label: "PNG" }] }) + field("Largura maxima", "mediaSettings.maxWidth", { type: "number", help: "Pixels; imagens menores nao sao ampliadas" }) + field("Qualidade", "mediaSettings.quality", { type: "number", help: "Entre 45 e 95" }) + field("Arquivo original", "mediaSettings.maxFileMb", { type: "number", help: "Limite em MB por upload" }) + '</div><div class="optimizer-note">' + icon("zap") + '<div><strong>Preset recomendado para provedores</strong><p>WebP em 82%, ate 1920 px. Equilibra nitidez de banners e carregamento no 4G.</p></div></div></div></div></section>',
      '<section class="media-library"><div class="list-header"><div><strong>Biblioteca</strong><span>Clique em uma imagem para copiar seu endereco</span></div><span>' + formatBytes(stateSize()) + ' usados no armazenamento local</span></div>' + FLAdmin.toolbar({ key: "media", search: view.search, placeholder: "Buscar arquivo, formato ou uso", count: result.filteredTotal, singular: "arquivo", plural: "arquivos", filters: [{ name: "usage", label: "Uso", value: view.usage, options: [{ value: "all", label: "Todos os usos" }].concat(usages.map(function (usage) { return { value: usage, label: usage }; })) }], sortValue: view.sort, sortOptions: [{ value: "recent", label: "Mais recentes" }, { value: "name", label: "Nome A-Z" }, { value: "size", label: "Maior arquivo" }] }) + (result.items.length ? '<div class="media-grid">' + result.items.map(function (item) {
        const saving = Number(item.originalBytes || 0) > Number(item.bytes || 0) ? Math.round((1 - Number(item.bytes) / Number(item.originalBytes)) * 100) : 0;
        return '<article class="media-card"><button class="media-card__preview" data-action="copy-media" data-id="' + esc(item.id) + '" title="Copiar endereco"><img src="' + esc(FL.safeImageUrl(item.url, "./assets/img/hero-family-fiber.jpg")) + '" alt=""></button><div class="media-card__body"><div><strong>' + esc(item.name) + '</strong><span class="status-badge ' + (saving ? "status-badge--success" : "") + '">' + (saving ? "-" + saving + "%" : esc(item.usage || "Original")) + '</span></div><p>' + item.width + ' x ' + item.height + ' px &middot; ' + formatBytes(item.bytes) + '</p><small>' + esc((item.type || "imagem").replace("image/", "").toUpperCase()) + ' &middot; ' + esc(item.usage || "Biblioteca") + '</small></div><div class="media-card__actions"><button class="icon-button" data-action="copy-media" data-id="' + esc(item.id) + '" title="Copiar endereco">' + icon("copy") + '</button><button class="icon-button" data-action="download-media" data-id="' + esc(item.id) + '" title="Baixar">' + icon("download") + '</button><button class="icon-button icon-button--danger" data-action="delete-media" data-id="' + esc(item.id) + '" title="Remover">' + icon("trash-2") + '</button></div></article>';
      }).join("") + '</div>' : FLAdmin.emptyState({ icon: "images", title: "Nenhuma imagem encontrada", description: "Revise a busca ou o filtro para localizar outros arquivos.", action: "clear-media-filters", actionLabel: "Limpar filtros" })) + FLAdmin.pagination(result, "media") + '</section>',
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

  function collectPlans(view) {
    return FLAdmin.collection(state.plans, {
      search: view.search,
      page: view.page,
      pageSize: view.pageSize,
      searchText: function (item) { return [item.title, item.speed, item.badge, FL.categoryName(state, item.categoryId)].join(" "); },
      predicate: function (item) {
        return (view.category === "all" || item.categoryId === view.category) &&
          (view.status === "all" || (view.status === "active" ? item.active : !item.active));
      },
      sort: function (a, b) {
        if (view.sort === "price-asc") return Number(a.price) - Number(b.price);
        if (view.sort === "price-desc") return Number(b.price) - Number(a.price);
        if (view.sort === "name") return String(a.title).localeCompare(String(b.title), "pt-BR");
        return Number(b.featured) - Number(a.featured) || Number(b.active) - Number(a.active) || Number(a.price) - Number(b.price);
      },
    });
  }

  function renderPlans() {
    const view = crudState.plans;
    const result = collectPlans(view);
    view.page = result.page;
    const selectedCount = view.selected.size;
    const pageSelected = result.items.length && result.items.every(function (item) { return view.selected.has(item.id); });
    return [
      panelHeader("Planos e ofertas", "Gerencie precos, beneficios, categorias e disponibilidade comercial.", '<div class="heading-actions"><button class="button button--ghost" data-action="manage-categories">' + icon("tags") + ' Categorias</button><button class="button button--primary" data-action="new-plan">' + icon("plus") + " Novo plano</button></div>"),
      '<section class="quick-stats"><article><span>' + icon("badge-dollar-sign") + '</span><div><strong>' + state.plans.length + '</strong><small>planos cadastrados</small></div></article><article><span>' + icon("circle-check") + '</span><div><strong>' + state.plans.filter(function (item) { return item.active; }).length + '</strong><small>ofertas ativas</small></div></article><article><span>' + icon("star") + '</span><div><strong>' + state.plans.filter(function (item) { return item.featured; }).length + '</strong><small>planos destacados</small></div></article><article><span>' + icon("wallet-cards") + '</span><div><strong>' + FL.formatCurrency(Math.min.apply(null, state.plans.map(function (item) { return item.price; }))) + '</strong><small>menor mensalidade</small></div></article></section>',
      FLAdmin.toolbar({ key: "plans", search: view.search, placeholder: "Buscar por nome, velocidade ou categoria", count: result.filteredTotal, singular: "plano", plural: "planos", filters: [{ name: "category", label: "Categoria", value: view.category, options: [{ value: "all", label: "Todas as categorias" }].concat(state.categories.map(function (category) { return { value: category.id, label: category.name }; })) }, { name: "status", label: "Status", value: view.status, options: [{ value: "all", label: "Todos os status" }, { value: "active", label: "Ativos" }, { value: "inactive", label: "Inativos" }] }], sortValue: view.sort, sortOptions: [{ value: "featured", label: "Destaques primeiro" }, { value: "price-asc", label: "Menor preco" }, { value: "price-desc", label: "Maior preco" }, { value: "name", label: "Nome A-Z" }] }),
      FLAdmin.bulkBar({ key: "plans", count: selectedCount, actions: [{ id: "activate", label: "Ativar", icon: "play" }, { id: "deactivate", label: "Pausar", icon: "pause" }, { id: "delete", label: "Excluir", icon: "trash-2", danger: true }] }),
      result.items.length ? '<div class="crud-selection-row"><label><input type="checkbox" data-crud-select-page="plans"' + (pageSelected ? " checked" : "") + '> Selecionar esta pagina</label><span>' + result.start + '-' + result.end + ' de ' + result.filteredTotal + '</span></div><section class="plan-admin-grid" id="plan-admin-grid">' + result.items.map(function (item) {
        return '<article class="plan-admin-card' + (view.selected.has(item.id) ? " is-selected" : "") + '"><div class="plan-admin-card__head"><div class="card-select-status"><label class="crud-checkbox" title="Selecionar plano"><input type="checkbox" data-crud-select="plans" data-id="' + esc(item.id) + '"' + (view.selected.has(item.id) ? " checked" : "") + '><span></span></label><span class="status-badge ' + (item.active ? "status-badge--success" : "") + '">' + (item.active ? "Ativo" : "Inativo") + '</span></div><div class="row-actions"><button class="icon-button" data-action="edit-plan" data-id="' + esc(item.id) + '" title="Editar" aria-label="Editar ' + esc(item.title) + '">' + icon("pencil") + '</button><button class="icon-button icon-button--danger" data-action="delete-plan" data-id="' + esc(item.id) + '" title="Excluir" aria-label="Excluir ' + esc(item.title) + '">' + icon("trash-2") + '</button></div></div><small>' + esc(FL.categoryName(state, item.categoryId)) + '</small><h3>' + esc(item.speed) + '</h3><p>' + esc(item.title) + '</p><strong>' + FL.formatCurrency(item.price) + '<span>/' + esc(item.period) + '</span></strong><ul>' + item.features.slice(0, 3).map(function (feature) { return "<li>" + icon("check") + esc(feature) + "</li>"; }).join("") + '</ul><div class="plan-admin-card__footer"><button data-action="toggle-plan" data-id="' + esc(item.id) + '">' + icon(item.active ? "pause" : "play") + (item.active ? "Pausar" : "Ativar") + '</button><button data-action="duplicate-plan" data-id="' + esc(item.id) + '">' + icon("copy") + "Duplicar</button></div></article>";
      }).join("") + "</section>" : FLAdmin.emptyState({ icon: "search-x", title: view.search || view.category !== "all" || view.status !== "all" ? "Nenhum plano encontrado" : "Nenhum plano cadastrado", description: view.search || view.category !== "all" || view.status !== "all" ? "Revise a busca ou limpe os filtros para ver outras ofertas." : "Cadastre a primeira oferta comercial para exibi-la no site.", action: state.plans.length ? "clear-plans-filters" : "new-plan", actionLabel: state.plans.length ? "Limpar filtros" : "Novo plano" }),
      FLAdmin.pagination(result, "plans"),
    ].join("");
  }

  function renderCatalog() {
    const view = crudState.apps;
    const categories = Array.from(new Set(state.apps.map(function (item) { return item.category; }))).sort();
    const result = FLAdmin.collection(state.apps, { search: view.search, page: view.page, pageSize: view.pageSize, searchText: function (item) { return [item.name, item.category].join(" "); }, predicate: function (item) { return view.category === "all" || item.category === view.category; }, sort: function (a, b) { return view.sort === "category" ? String(a.category).localeCompare(String(b.category), "pt-BR") || String(a.name).localeCompare(String(b.name), "pt-BR") : String(a.name).localeCompare(String(b.name), "pt-BR"); } });
    view.page = result.page;
    return [
      panelHeader("Apps e beneficios", "Organize servicos parceiros e diferenciais usados nas ofertas.", '<button class="button button--primary" data-action="add-app">' + icon("plus") + " Novo aplicativo</button>"),
      '<section class="catalog-workspace"><article class="admin-card catalog-apps">' + cardTitle("Apps e entretenimento", state.apps.length + " itens cadastrados para os combos.", "") + FLAdmin.toolbar({ key: "apps", search: view.search, placeholder: "Buscar aplicativo ou categoria", count: result.filteredTotal, singular: "aplicativo", plural: "aplicativos", filters: [{ name: "category", label: "Categoria", value: view.category, options: [{ value: "all", label: "Todas as categorias" }].concat(categories.map(function (category) { return { value: category, label: category }; })) }], sortValue: view.sort, sortOptions: [{ value: "name", label: "Nome A-Z" }, { value: "category", label: "Categoria" }] }) + (result.items.length ? '<div class="catalog-list">' + result.items.map(function (item) {
        const logoUrl = FL.safeImageUrl(item.logo, "");
        const logo = logoUrl ? '<img src="' + esc(logoUrl) + '" alt="">' : esc(item.name.slice(0, 2));
        return '<div><span class="catalog-logo">' + logo + '</span><div><strong>' + esc(item.name) + '</strong><small>' + esc(item.category) + '</small></div><button class="icon-button" data-action="edit-app" data-id="' + esc(item.id) + '">' + icon("pencil") + '</button><button class="icon-button icon-button--danger" data-action="delete-app" data-id="' + esc(item.id) + '">' + icon("trash-2") + "</button></div>";
      }).join("") + '</div>' : FLAdmin.emptyState({ icon: "shapes", title: "Nenhum aplicativo encontrado", description: "Revise a busca ou o filtro para encontrar outros servicos.", action: "clear-apps-filters", actionLabel: "Limpar filtros" })) + FLAdmin.pagination(result, "apps") + '</article><article class="admin-card">' + cardTitle("Diferenciais da marca", "Beneficios apresentados logo apos os planos.", '<button class="button button--ghost" data-action="add-benefit">' + icon("plus") + " Adicionar</button>") + '<div class="benefit-admin-list">' + state.benefits.map(function (item) {
        return '<div><span>' + icon(item.icon) + '</span><div><strong>' + esc(item.title) + '</strong><p>' + esc(item.text) + '</p></div><button class="icon-button" data-action="edit-benefit" data-id="' + esc(item.id) + '" title="Editar">' + icon("pencil") + '</button><button class="icon-button icon-button--danger" data-action="delete-benefit" data-id="' + esc(item.id) + '" title="Excluir">' + icon("trash-2") + "</button></div>";
      }).join("") + "</div></article></section>",
    ].join("");
  }

  function regionHeatMap() {
    const inventory = window.FLCoverage ? FLCoverage.inventory(state) : { effective: state.regions, geometries: 0, files: [] };
    return '<div class="admin-map-shell map-style--' + esc(state.coverageSettings.mapStyle) + '"><div class="admin-map" id="admin-regional-map"></div><div class="map-hud"><span>' + icon("radio-tower") + '</span><div><strong>' + esc(state.content.coverageMapLabel || "Rede ativa") + '</strong><small>' + inventory.effective.length + ' areas &middot; ' + inventory.geometries + ' geometrias</small></div></div><div class="map-scale"><span>Menor procura</span><i style="--map-accent:' + esc(state.theme.mapAccent) + '"></i><span>Maior procura</span></div><a class="map-provider-link" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(state.brand.address) + '" target="_blank" rel="noopener">' + icon("route") + ' Abrir no Google Maps</a></div>';
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
        if (points.length >= 3) features.push({ type: "polygon", name, featureIndex: placemarkIndex + 1, coordinates: points });
      });
      kmlElements(placemark, "LineString").forEach(function (line) {
        const coordinates = kmlElements(line, "coordinates")[0];
        const points = parseKmlCoordinates(coordinates ? coordinates.textContent : "", budget);
        if (points.length >= 2) features.push({ type: "line", name, featureIndex: placemarkIndex + 1, coordinates: points });
      });
      kmlElements(placemark, "Point").forEach(function (point) {
        const coordinates = kmlElements(point, "coordinates")[0];
        const points = parseKmlCoordinates(coordinates ? coordinates.textContent : "", budget);
        if (points[0]) features.push({ type: "point", name, featureIndex: placemarkIndex + 1, coordinates: points[0] });
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
    setSaveStatus("saving");
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
      const coverageId = FL.uid("coverage");
      const preparedFeatures = window.FLCoverage ? FLCoverage.prepareFeatures(parsed.features, state.regions) : parsed.features;
      state.coverageFiles.unshift({ id: coverageId, name: file.name.replace(/\.(kml|kmz)$/i, ""), fileName: file.name, format: extension.toUpperCase(), bytes: file.size, importedAt: new Date().toISOString(), color: state.theme.mapAccent, active: true, coordinateCount: parsed.coordinateCount, features: preparedFeatures, geocodingStatus: "local", geocodingRequests: 0 });
      const derived = window.FLCoverage ? FLCoverage.importedAreas(state.coverageFiles.filter(function (item) { return item.id === state.coverageFiles[0].id; })).length : parsed.features.length;
      saveDraft(derived + " areas reconhecidas no arquivo", { action: "import", resource: "coverage", label: "Cobertura importada", detail: file.name + " - " + parsed.features.length + " geometrias e " + derived + " areas operacionais" });
      renderPanel();
      if (state.coverageSettings.autoIdentifyImportedAreas && window.FLCoverage) identifyCoverageFile(coverageId, true);
    } catch (error) { setSaveStatus(state.meta.status === "published" ? "saved" : "draft"); toast(error.message || "Nao foi possivel importar a cobertura.", "error"); }
  }

  function destroyAdminMap() {
    if (!adminMap) return;
    try {
      adminMap.stop();
      adminMap.off();
      adminMap.remove();
    } catch (error) {
      console.warn("Nao foi possivel finalizar a instancia anterior do mapa.", error);
    }
    adminMap = null;
  }

  function initAdminMap() {
    const element = $("#admin-regional-map");
    destroyAdminMap();
    if (!element || !window.L) return;
    if (element._leaflet_id) delete element._leaflet_id;
    const regions = state.regions.filter(function (region) { return region.lat !== null && region.lat !== "" && region.lng !== null && region.lng !== "" && Number.isFinite(Number(region.lat)) && Number.isFinite(Number(region.lng)); });
    const importedFiles = state.coverageFiles.filter(function (file) { return file.active; });
    if (!regions.length && !importedFiles.length) { element.innerHTML = '<div class="empty-state"><h3>Cadastre ou importe uma cobertura</h3><p>Use cidade, CEP, KML ou KMZ para exibir a operacao no mapa.</p></div>'; return; }
    adminMap = window.L.map(element, { scrollWheelZoom: false, zoomControl: true, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView([Number(state.coverageSettings.centerLat), Number(state.coverageSettings.centerLng)], 11, { animate: false });
    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(adminMap);
    adminMap.createPane("coverageGlow");
    adminMap.getPane("coverageGlow").style.zIndex = 390;
    adminMap.getPane("coverageGlow").style.pointerEvents = "none";
    adminMap.createPane("coverageAreas");
    adminMap.getPane("coverageAreas").style.zIndex = 430;
    const bounds = [];
    regions.forEach(function (region) {
      const point = [Number(region.lat), Number(region.lng)];
      const color = region.color || state.theme.mapAccent;
      bounds.push(point);
      window.L.circle(point, { pane: "coverageGlow", radius: Math.max(700, Number(region.radiusKm || state.coverageSettings.defaultRadiusKm) * 1180), color, fillColor: color, fillOpacity: 0.1, opacity: 0.24, weight: 12, interactive: false }).addTo(adminMap);
      window.L.circle(point, { radius: Math.max(500, Number(region.radiusKm || state.coverageSettings.defaultRadiusKm) * 1000), color, fillColor: color, fillOpacity: state.coverageSettings.showInterest ? 0.16 + (Number(region.interest || 0) / 500) : 0.22, weight: 2 }).addTo(adminMap)
        .bindTooltip('<strong>' + esc(region.name) + '</strong><span>' + esc(region.status) + '</span><small>' + region.interest + '% de interesse &middot; ' + region.leads + ' leads &middot; raio ' + esc(region.radiusKm) + ' km</small>', { direction: "top", className: "coverage-tooltip" });
      window.L.circleMarker(point, { radius: 7, color: "#ffffff", fillColor: color, fillOpacity: 1, weight: 2 }).addTo(adminMap)
        .bindTooltip(esc(region.name), { permanent: state.coverageSettings.showLabels, direction: "top", offset: [0, -8], className: "region-map-label" });
    });
    importedFiles.forEach(function (file) {
      const color = file.color || state.theme.mapAccent;
      file.features.forEach(function (feature, featureIndex) {
        const label = window.FLCoverage ? FLCoverage.publicFeatureName(feature, featureIndex) : feature.name;
        const detail = feature.geography && [feature.geography.road, feature.geography.postcode].filter(Boolean).join(" - ") || "Area importada de " + file.fileName;
        const layerStyles = window.FLCoverage ? FLCoverage.mapLayerStyles(state.coverageSettings, color) : null;
        if (feature.type === "polygon") {
          window.L.polygon(feature.coordinates, layerStyles ? layerStyles.glow : { pane: "coverageGlow", color, fillColor: color, fillOpacity: 0.1, opacity: 0.28, weight: 10, interactive: false }).addTo(adminMap);
          window.L.polygon(feature.coordinates, layerStyles ? layerStyles.area : { pane: "coverageAreas", color, fillColor: color, fillOpacity: 0.42, weight: 2.5 }).addTo(adminMap).bindTooltip('<strong>' + esc(label) + '</strong><span>' + esc(detail) + '</span>', { className: "coverage-tooltip" });
          bounds.push.apply(bounds, feature.coordinates);
        } else if (feature.type === "line") {
          window.L.polyline(feature.coordinates, layerStyles ? layerStyles.line : { pane: "coverageAreas", color, weight: 3, opacity: 0.85 }).addTo(adminMap).bindTooltip(esc(label));
          bounds.push.apply(bounds, feature.coordinates);
        } else if (feature.type === "point") {
          window.L.circleMarker(feature.coordinates, { radius: 6, color: "#ffffff", fillColor: color, fillOpacity: 1, weight: 2 }).addTo(adminMap).bindTooltip(esc(label));
          bounds.push(feature.coordinates);
        }
      });
      if (window.FLCoverage) FLCoverage.importedAreas([file]).forEach(function (area) {
        if (!Number.isFinite(Number(area.lat)) || !Number.isFinite(Number(area.lng))) return;
        const marker = window.L.marker([Number(area.lat), Number(area.lng)], { icon: window.L.divIcon({ className: "coverage-place-marker", html: '<span style="--marker-color:' + esc(color) + '"></span>' + (state.coverageSettings.showImportedLabels ? '<b>' + esc(area.name) + '</b>' : ""), iconSize: [180, 32], iconAnchor: [11, 16] }), keyboard: true }).addTo(adminMap);
        marker.bindTooltip('<strong>' + esc(area.name) + '</strong><span>' + esc([area.road, area.postcode].filter(Boolean).join(" - ") || area.status) + '</span>', { className: "coverage-tooltip", direction: "top" });
      });
    });
    adminMap.fitBounds(bounds, { padding: [34, 34], maxZoom: 11, animate: false });
    const updatePlaceLabels = function () {
      if (!adminMap || !adminMap._container) return;
      adminMap._container.classList.toggle("show-place-labels", Boolean(state.coverageSettings.showImportedLabels) && adminMap.getZoom() >= 14);
    };
    adminMap.on("zoomend", updatePlaceLabels);
    updatePlaceLabels();
    const currentMap = adminMap;
    setTimeout(function () { if (adminMap === currentMap && currentMap._container) currentMap.invalidateSize(); }, 80);
  }

  function renderCoverage() {
    const view = crudState.regions;
    const regionResult = FLAdmin.collection(state.regions, { search: view.search, page: view.page, pageSize: view.pageSize, searchText: function (region) { return [region.name, region.city, region.cep, region.status, (region.neighborhoods || []).join(" ")].join(" "); }, predicate: function (region) { return (view.type === "all" || region.type === view.type) && (view.status === "all" || (view.status === "active" ? region.active : !region.active)); }, sort: function (a, b) { if (view.sort === "interest") return Number(b.interest) - Number(a.interest); if (view.sort === "name") return String(a.name).localeCompare(String(b.name), "pt-BR"); return Number(b.priority || 0) - Number(a.priority || 0); } });
    view.page = regionResult.page;
    const active = state.regions.filter(function (region) { return region.active; }).length;
    const importedFeatures = state.coverageFiles.reduce(function (sum, file) { return sum + (file.active ? file.features.length : 0); }, 0);
    const averageInterest = state.regions.length ? Math.round(state.regions.reduce(function (sum, region) { return sum + Number(region.interest || 0); }, 0) / state.regions.length) : 0;
    const totalLeads = state.regions.reduce(function (sum, region) { return sum + Number(region.leads || 0); }, 0);
    return [
      panelHeader("Cobertura regional", "Combine cidades, CEPs e os poligonos operacionais exportados pelo Google Earth.", '<div class="heading-actions"><label class="button button--ghost file-action">' + icon("file-up") + ' Importar KML/KMZ<input id="coverage-file-input" type="file" accept=".kml,.kmz,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz"></label><button class="button button--primary" data-action="add-region">' + icon("plus") + " Nova area</button></div>"),
      '<section class="quick-stats coverage-stats"><article><span>' + icon("map-pinned") + '</span><div><strong>' + active + '</strong><small>areas manuais publicadas</small></div></article><article><span>' + icon("shapes") + '</span><div><strong>' + importedFeatures + '</strong><small>geometrias importadas</small></div></article><article><span>' + icon("activity") + '</span><div><strong>' + averageInterest + '%</strong><small>interesse medio</small></div></article><article><span>' + icon("message-circle") + '</span><div><strong>' + totalLeads + '</strong><small>leads por regiao</small></div></article></section>',
      '<section class="coverage-source-grid"><article><span>' + icon("file-up") + '</span><div><strong>KML e KMZ</strong><small>Poligonos e rotas operacionais</small></div></article><article><span>' + icon("map-pin") + '</span><div><strong>CEP</strong><small>Exato, prefixo ou faixa</small></div></article><article><span>' + icon("building-2") + '</span><div><strong>Cidades e bairros</strong><small>Regras comerciais por local</small></div></article><article><span>' + icon("scan-search") + '</span><div><strong>Geocodificacao</strong><small>Google Maps ou Nominatim</small></div></article></section>',
      '<section class="admin-card coverage-controls">' + cardTitle("Consulta e integracoes", "Defina como enderecos e regras de viabilidade sao identificados.", '<span class="status-badge status-badge--success">ViaCEP + mapa real</span>') + '<div class="settings-inline coverage-settings">' + field("Estilo do mapa", "coverageSettings.mapStyle", { type: "select", options: [{ value: "brand", label: "Cores da marca" }, { value: "street", label: "Mapa limpo" }, { value: "dark", label: "Contraste escuro" }] }) + field("Geocodificacao", "coverageSettings.geocodingProvider", { type: "select", options: [{ value: "nominatim", label: "Nominatim / OpenStreetMap" }, { value: "google", label: "Google Maps Platform" }] }) + field("Raio padrao", "coverageSettings.defaultRadiusKm", { type: "number", help: "Quilometros" }) + toggle("Consulta por CEP", "coverageSettings.cepLookup", "Preenche cidade e bairro automaticamente") + toggle("Validar dentro do poligono", "coverageSettings.precisePolygonCheck", "Cruza o ponto geocodificado com areas KMZ") + toggle("Mostrar nomes", "coverageSettings.showLabels", "Exibe rotulos fixos no mapa") + toggle("Intensidade de interesse", "coverageSettings.showInterest", "A opacidade representa a procura") + '</div><div class="google-coverage-settings">' + toggle("Google Maps Platform", "coverageSettings.googleMapsEnabled", "Usa a geocodificacao Google quando houver chave configurada") + field("Chave publica restrita", "coverageSettings.googleMapsBrowserKey", { type: "password", placeholder: "AIza...", help: "Restrinja por dominio e somente pelas APIs necessarias. Nao use chave de servidor aqui." }) + field("Map ID opcional", "coverageSettings.googleMapId", { placeholder: "Identificador do estilo do mapa" }) + '</div></section>',
      '<div class="coverage-integration-notice"><span>' + icon("shield-check") + '</span><div><strong>Importacao local e controlada</strong><p>KML e KMZ sao lidos no navegador, limitados a 5 MB e convertidos somente em pontos, linhas e poligonos seguros. O arquivo original nao e enviado para terceiros.</p></div><a href="https://earth.google.com" target="_blank" rel="noopener">Abrir Google Earth ' + icon("external-link") + '</a></div>',
      '<section class="admin-card coverage-file-manager">' + cardTitle("Arquivos do Google Earth", "Camadas operacionais que complementam os raios e cidades cadastrados.", '<span class="status-badge ' + (state.coverageFiles.length ? "status-badge--success" : "") + '">' + state.coverageFiles.length + ' arquivo(s)</span>') + (state.coverageFiles.length ? '<div class="coverage-file-list">' + state.coverageFiles.map(function (file) { return '<article><span>' + icon("map") + '</span><div><strong>' + esc(file.name) + '</strong><p>' + esc(file.fileName) + '</p><small>' + file.features.length + ' geometrias &middot; ' + file.coordinateCount + ' coordenadas &middot; ' + formatBytes(file.bytes) + '</small></div><label class="color-mini" title="Cor da camada"><input type="color" data-coverage-file-color="' + esc(file.id) + '" value="' + esc(file.color || state.theme.mapAccent) + '"></label><button class="icon-button" data-action="toggle-coverage-file" data-id="' + esc(file.id) + '" title="' + (file.active ? "Ocultar" : "Publicar") + '">' + icon(file.active ? "eye" : "eye-off") + '</button><button class="icon-button icon-button--danger" data-action="delete-coverage-file" data-id="' + esc(file.id) + '" title="Remover">' + icon("trash-2") + '</button></article>'; }).join("") + '</div>' : '<div class="empty-state empty-state--compact">' + icon("file-up") + '<h3>Importe o KMZ da operacao</h3><p>Poligonos de bairros, cidades e rotas aparecerao aqui e no mapa publico.</p></div>') + '</section>',
      '<section class="coverage-admin-layout coverage-admin-layout--pro"><article class="admin-card map-admin-card">' + cardTitle("Mapa de cobertura e interesse", "Raios configurados por area com as cores da marca.", '<span class="live-chip"><i></i> Atualizado agora</span>') + regionHeatMap() + '</article><article class="admin-card region-manager">' + cardTitle("Areas atendidas", "Status, CEP, raio e procura comercial.", "") + FLAdmin.toolbar({ key: "regions", search: view.search, placeholder: "Buscar cidade, CEP, bairro ou status", count: regionResult.filteredTotal, singular: "area", plural: "areas", filters: [{ name: "type", label: "Tipo", value: view.type, options: [{ value: "all", label: "Todos os tipos" }, { value: "city", label: "Cidade" }, { value: "neighborhood", label: "Bairros" }, { value: "cep", label: "CEP exato" }, { value: "cep_prefix", label: "Prefixo de CEP" }, { value: "cep_range", label: "Faixa de CEP" }, { value: "radius", label: "Ponto e raio" }, { value: "region", label: "Regiao comercial" }] }, { name: "status", label: "Publicacao", value: view.status, options: [{ value: "all", label: "Todas" }, { value: "active", label: "Publicadas" }, { value: "inactive", label: "Ocultas" }] }], sortValue: view.sort, sortOptions: [{ value: "priority", label: "Maior prioridade" }, { value: "interest", label: "Maior interesse" }, { value: "name", label: "Nome A-Z" }] }) + '<div class="region-list">' + regionResult.items.map(function (region) {
        const typeLabels = { cep: "CEP exato", cep_prefix: "Prefixo CEP", cep_range: "Faixa CEP", city: "Cidade", neighborhood: "Bairros", region: "Regiao", radius: "Raio" };
        return '<div class="region-admin-row" data-region-search="' + esc((region.name + " " + (region.city || "") + " " + (region.cep || "") + " " + region.status).toLowerCase()) + '"><span class="region-heat" style="--level:' + region.interest + ';--region-color:' + esc(region.color || state.theme.mapAccent) + '"></span><div><span><strong>' + esc(region.name) + '</strong><em>' + esc(typeLabels[region.type] || "Area") + '</em></span><small>' + esc(region.city || region.cep || "Regra regional") + ' &middot; prioridade ' + esc(region.priority || 10) + ' &middot; ' + esc(region.status) + '</small></div><div class="region-numbers"><strong>' + region.leads + '</strong><small>leads</small></div><div class="row-actions"><button class="icon-button" data-action="open-region-route" data-id="' + esc(region.id) + '" title="Abrir rota">' + icon("route") + '</button><button class="icon-button" data-action="toggle-region" data-id="' + esc(region.id) + '" title="' + (region.active ? "Ocultar" : "Publicar") + '">' + icon(region.active ? "eye" : "eye-off") + '</button><button class="icon-button" data-action="edit-region" data-id="' + esc(region.id) + '" title="Editar">' + icon("pencil") + '</button><button class="icon-button icon-button--danger" data-action="delete-region" data-id="' + esc(region.id) + '" title="Excluir">' + icon("trash-2") + '</button></div></div>';
      }).join("") + (regionResult.items.length ? "" : FLAdmin.emptyState({ icon: "map-pinned", title: state.regions.length ? "Nenhuma area encontrada" : "Nenhuma area cadastrada", description: state.regions.length ? "Revise a busca ou os filtros da cobertura." : "Cadastre uma cidade, CEP, bairro ou ponto com raio.", action: state.regions.length ? "clear-region-filters" : "add-region", actionLabel: state.regions.length ? "Limpar filtros" : "Nova area" })) + "</div>" + FLAdmin.pagination(regionResult, "regions") + "</article></section>",
    ].join("");
  }

  function coverageTabs() {
    const tabs = [{ id: "overview", label: "Visao geral" }, { id: "sources", label: "Fontes e KMZ" }, { id: "areas", label: "Areas atendidas" }, { id: "settings", label: "Regras do mapa" }];
    return '<div class="workspace-tabs">' + tabs.map(function (tab) { return '<button class="' + (coverageWorkspaceTab === tab.id ? "is-active" : "") + '" data-coverage-tab="' + tab.id + '">' + esc(tab.label) + '</button>'; }).join("") + '</div>';
  }

  function renderCoverageSources(inventory) {
    const files = state.coverageFiles.map(function (file) {
      const areas = window.FLCoverage ? FLCoverage.importedAreas([file]).length : file.features.length;
      const processing = file.geocodingStatus === "processing";
      const status = processing ? (file.geocodingProgress || 0) + "% identificado" : file.geocodingStatus === "complete" ? "Bairros e vias identificados" : "Identificacao local aplicada";
      return '<article class="coverage-file-row"><span>' + icon("map") + '</span><div><strong>' + esc(file.name) + '</strong><p>' + esc(file.fileName) + '</p><small>' + areas + ' areas &middot; ' + file.features.length + ' geometrias &middot; ' + formatBytes(file.bytes) + '</small><em data-geocode-progress="' + esc(file.id) + '" class="' + (file.geocodingStatus === "complete" ? "is-complete" : "") + '">' + icon(file.geocodingStatus === "complete" ? "map-pin-check" : "scan-search") + esc(status) + '</em></div><button class="icon-button" data-action="identify-coverage-file" data-id="' + esc(file.id) + '" title="Identificar bairros e vias"' + (processing ? " disabled" : "") + '>' + icon(processing ? "loader-circle" : "scan-search") + '</button><label class="color-mini" title="Cor da camada"><input type="color" data-coverage-file-color="' + esc(file.id) + '" value="' + esc(file.color || state.theme.mapAccent) + '"></label><button class="icon-button" data-action="toggle-coverage-file" data-id="' + esc(file.id) + '" title="' + (file.active ? "Ocultar" : "Publicar") + '">' + icon(file.active ? "eye" : "eye-off") + '</button><button class="icon-button icon-button--danger" data-action="delete-coverage-file" data-id="' + esc(file.id) + '" title="Remover">' + icon("trash-2") + '</button></article>';
    }).join("");
    return '<section class="coverage-source-workspace"><div class="coverage-dropzone"><span>' + icon("file-up") + '</span><div><h3>Importe a malha do Google Earth</h3><p>Arquivos KML ou KMZ de ate ' + esc(state.coverageSettings.maxImportMb) + ' MB viram areas publicas sem expor nomes tecnicos da rede.</p></div><label class="button button--primary file-action">' + icon("upload") + ' Selecionar arquivo<input id="coverage-file-input" type="file" accept=".kml,.kmz,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz"></label></div><div class="security-notice">' + icon("shield-check") + '<div><strong>Geografia publica, referencia tecnica preservada</strong><p>O painel conserva OLT e outros nomes somente para auditoria interna. No site, os poligonos usam bairro, cidade ou via identificados e armazenados no arquivo processado.</p></div></div><article class="admin-card coverage-file-manager">' + cardTitle("Camadas importadas", inventory.files.length + " fonte(s) ativa(s) na operacao.", '<a class="text-button" href="https://earth.google.com" target="_blank" rel="noopener">Abrir Google Earth ' + icon("external-link") + '</a>') + (files ? '<div class="coverage-file-list">' + files + '</div>' : FLAdmin.emptyState({ icon: "file-up", title: "Nenhuma malha importada", description: "Envie um KML ou KMZ para criar a cobertura operacional." })) + '</article></section>';
  }

  function renderCoverageAreas(inventory) {
    const typeLabels = { cep: "CEP exato", cep_prefix: "Prefixo CEP", cep_range: "Faixa CEP", city: "Cidade", neighborhood: "Bairros", region: "Regiao", radius: "Raio" };
    return '<section class="coverage-area-columns"><article class="admin-card">' + cardTitle("Regras manuais", "CEP, bairro, cidade e raio com prioridade comercial.", '<button class="button button--primary button--compact" data-action="add-region">' + icon("plus") + ' Nova area</button>') + (state.regions.length ? '<div class="region-list region-list--workspace">' + state.regions.map(function (region) { return '<div class="region-admin-row"><span class="region-heat" style="--level:' + Number(region.interest || 0) + ';--region-color:' + esc(region.color || state.theme.mapAccent) + '"></span><div><span><strong>' + esc(region.name) + '</strong><em>' + esc(typeLabels[region.type] || "Area") + '</em></span><small>' + esc(region.city || region.cep || region.status) + ' &middot; prioridade ' + esc(region.priority || 10) + '</small></div><div class="row-actions"><button class="icon-button" data-action="toggle-region" data-id="' + esc(region.id) + '" title="' + (region.active ? "Ocultar" : "Publicar") + '">' + icon(region.active ? "eye" : "eye-off") + '</button><button class="icon-button" data-action="edit-region" data-id="' + esc(region.id) + '" title="Editar">' + icon("pencil") + '</button><button class="icon-button icon-button--danger" data-action="delete-region" data-id="' + esc(region.id) + '" title="Excluir">' + icon("trash-2") + '</button></div></div>'; }).join("") + '</div>' : FLAdmin.emptyState({ icon: "map-pin-plus", title: "Sem regras manuais", description: "No modo automatico, as areas do KMZ assumem a operacao sem exigir cadastro duplicado.", action: "add-region", actionLabel: "Criar primeira regra" })) + '</article><article class="admin-card imported-area-card">' + cardTitle("Areas publicas reconhecidas", "Bairros, cidades e vias substituem os nomes tecnicos do arquivo no site.", '<span class="status-badge status-badge--success">' + inventory.imported.length + ' areas</span>') + (inventory.imported.length ? '<div class="imported-area-list">' + inventory.imported.map(function (area) { const place = [area.road, area.postcode].filter(Boolean).join(" - "); const reference = area.technicalNames && area.technicalNames.length ? "Referencia interna: " + area.technicalNames.slice(0, 3).join(", ") : area.sourceName; return '<div><span style="--area-color:' + esc(area.color || state.theme.mapAccent) + '">' + icon("map-pin") + '</span><div><strong>' + esc(area.name) + '</strong><small>' + (place ? esc(place) + '<br>' : '') + esc(reference) + ' &middot; ' + area.featureCount + ' geometria(s)</small></div><em>Publica</em></div>'; }).join("") + '</div>' : FLAdmin.emptyState({ icon: "scan-search", title: "Nenhuma area derivada", description: "Ative ou importe uma camada com pontos, linhas e poligonos." })) + '</article></section>';
  }

  function renderCoverageSettings() {
    return '<section class="settings-layout"><div class="stack"><article class="admin-card">' + cardTitle("Origem da cobertura", "Escolha como o site resolve as areas atendidas.", "") + field("Modo de operacao", "coverageSettings.areaSourceMode", { type: "select", options: [{ value: "auto", label: "Automatico: manual ou KMZ" }, { value: "hybrid", label: "Hibrido: combinar tudo" }, { value: "manual", label: "Somente regras manuais" }, { value: "imported", label: "Somente arquivos importados" }], help: "Automatico usa o KMZ quando nao ha area manual ativa." }) + toggle("Validacao precisa no poligono", "coverageSettings.precisePolygonCheck", "Cruza o endereco geocodificado com a malha importada") + toggle("Consulta automatica de CEP", "coverageSettings.cepLookup", "Preenche cidade e bairro pelo ViaCEP") + toggle("Identificar importacoes automaticamente", "coverageSettings.autoIdentifyImportedAreas", "Busca bairro e via depois de importar um KML ou KMZ") + '</article><article class="admin-card">' + cardTitle("Aparencia cartografica", "Aplique o mapa da marca em todo o site.", "") + field("Estilo", "coverageSettings.mapStyle", { type: "select", options: [{ value: "brand", label: "Cartografia da marca" }, { value: "street", label: "Mapa urbano claro" }, { value: "dark", label: "Contraste escuro" }] }) + '<div class="form-grid">' + field("Raio padrao (km)", "coverageSettings.defaultRadiusKm", { type: "number", min: 1, max: 100, step: 1 }) + field("Opacidade do KMZ", "coverageSettings.importedAreaOpacity", { type: "number", min: 0.1, max: 0.75, step: 0.05, help: "Use de 0.10 a 0.75; 0.55 destaca bem a malha." }) + '</div>' + toggle("Mostrar nomes manuais", "coverageSettings.showLabels", "Exibe rotulos permanentes para cidades e pontos") + toggle("Mostrar nomes importados", "coverageSettings.showImportedLabels", "Exibe rotulos publicos das areas derivadas do KMZ") + toggle("Representar interesse", "coverageSettings.showInterest", "Usa intensidade visual para a demanda regional") + '</article></div><aside class="stack"><article class="admin-card">' + cardTitle("Centro inicial", "Ponto usado quando ainda nao ha geometria.", "") + '<div class="form-grid">' + field("Latitude", "coverageSettings.centerLat", { type: "number", min: -90, max: 90, step: 0.000001 }) + field("Longitude", "coverageSettings.centerLng", { type: "number", min: -180, max: 180, step: 0.000001 }) + '</div></article><div class="integration-route-card"><span>' + icon("blocks") + '</span><div><strong>APIs e geocodificacao</strong><p>Google Maps Platform, chaves publicas, ViaCEP e Nominatim ficam centralizados em Integracoes.</p></div><button class="button button--ghost" data-goto="pixels">Abrir integracoes</button></div></aside></section>';
  }

  function renderCoverageWorkspace() {
    const inventory = window.FLCoverage ? FLCoverage.inventory(state) : { manual: state.regions, imported: [], effective: state.regions, files: state.coverageFiles, geometries: 0 };
    let content;
    if (coverageWorkspaceTab === "sources") content = renderCoverageSources(inventory);
    else if (coverageWorkspaceTab === "areas") content = renderCoverageAreas(inventory);
    else if (coverageWorkspaceTab === "settings") content = renderCoverageSettings();
    else content = '<section class="quick-stats coverage-stats"><article><span>' + icon("map-pinned") + '</span><div><strong>' + inventory.effective.length + '</strong><small>areas efetivas no site</small></div></article><article><span>' + icon("map") + '</span><div><strong>' + inventory.imported.length + '</strong><small>areas derivadas do KMZ</small></div></article><article><span>' + icon("shapes") + '</span><div><strong>' + inventory.geometries + '</strong><small>geometrias publicadas</small></div></article><article><span>' + icon("waypoints") + '</span><div><strong>' + inventory.manual.length + '</strong><small>regras manuais ativas</small></div></article></section><section class="coverage-overview-layout"><article class="admin-card map-admin-card">' + cardTitle("Malha completa de atendimento", "Cobertura operacional com identidade da marca.", '<span class="live-chip"><i></i> Sincronizada</span>') + regionHeatMap() + '</article><aside class="admin-card coverage-status-card">' + cardTitle("Como o site esta decidindo", "Leitura da regra ativa agora.", "") + '<div class="coverage-mode-summary"><span>' + icon(state.coverageSettings.areaSourceMode === "imported" ? "map" : "route") + '</span><div><strong>' + esc({ auto: "Modo automatico", hybrid: "Modo hibrido", manual: "Somente manual", imported: "Somente importado" }[state.coverageSettings.areaSourceMode] || "Modo automatico") + '</strong><p>' + (state.coverageSettings.areaSourceMode === "auto" && inventory.manual.length ? "As regras manuais estao ativas; o KMZ continua publicado como malha visual e validacao precisa." : state.coverageSettings.areaSourceMode === "auto" ? "Nao ha regras manuais; o KMZ assumiu automaticamente as areas atendidas." : "A fonte selecionada controla as opcoes e validacoes da home.") + '</p></div></div><div class="coverage-health-list"><div><span>' + icon("circle-check") + '</span><p><strong>Arquivo operacional</strong><small>' + inventory.files.length + ' camada(s) ativa(s)</small></p></div><div><span>' + icon("scan-search") + '</span><p><strong>Consulta precisa</strong><small>' + (state.coverageSettings.precisePolygonCheck ? "Poligono habilitado" : "Validacao simplificada") + '</small></p></div><div><span>' + icon("palette") + '</span><p><strong>Mapa da marca</strong><small>' + esc(state.coverageSettings.mapStyle) + '</small></p></div></div><button class="button button--primary button--block" data-coverage-tab="sources">' + icon("file-up") + ' Gerenciar fontes</button></aside></section>';
    return panelHeader("Cobertura regional", "Importe a rede, organize regras de viabilidade e publique um mapa coerente com a marca.", '<div class="heading-actions"><button class="button button--ghost" data-goto="pixels">' + icon("blocks") + ' APIs</button><button class="button button--primary" data-action="add-region">' + icon("plus") + ' Nova area manual</button></div>') + coverageTabs() + content;
  }

  function renderLeads() {
    const newLeads = state.leads.filter(function (lead) { return lead.status === "new"; }).length;
    const proposals = state.leads.filter(function (lead) { return lead.status === "proposal"; }).length;
    const won = state.leads.filter(function (lead) { return lead.status === "won"; }).length;
    const content = leadWorkspaceTab === "settings" ? '<section class="two-column-layout"><article class="admin-card">' + cardTitle("Captura de interesse", "Dados solicitados antes de abrir o WhatsApp.", "") + toggle("Capturar lead antes do WhatsApp", "leadSettings.captureEnabled", "Solicita nome e numero ao escolher um plano") + toggle("WhatsApp obrigatorio", "leadSettings.requireWhatsapp", "Evita registros sem canal de retorno") + field("Texto de consentimento", "leadSettings.consentText", { type: "textarea", rows: 4 }) + field("Retencao planejada", "leadSettings.retentionDays", { type: "number", help: "Dias; no SaaS sera aplicada por rotina automatica" }) + '</article><article class="admin-card">' + cardTitle("Jornada de origem", "Atribuicao registrada em cada novo contato.", "") + '<div class="event-catalog"><div><span>' + icon("mouse-pointer-click") + '<b>Origem</b><small>Direto, campanha ou referencia</small></span><span>' + icon("tags") + '<b>UTMs</b><small>Fonte, midia e campanha</small></span><span>' + icon("map-pin") + '<b>Regiao</b><small>Contexto da consulta</small></span><span>' + icon("ticket-percent") + '<b>Oferta</b><small>Cupom escolhido pelo visitante</small></span></div></div></article></section>' : renderLeadPipeline();
    return panelHeader("Leads", "Acompanhe origem, interesse e etapa de cada oportunidade comercial.", '<button class="button button--ghost" data-action="export-leads">' + icon("download") + ' Exportar leads</button>') + '<section class="quick-stats lead-stats"><article><span>' + icon("contact-round") + '</span><div><strong>' + state.leads.length + '</strong><small>leads capturados</small></div></article><article><span>' + icon("sparkles") + '</span><div><strong>' + newLeads + '</strong><small>novos contatos</small></div></article><article><span>' + icon("file-check-2") + '</span><div><strong>' + proposals + '</strong><small>propostas em aberto</small></div></article><article><span>' + icon("trophy") + '</span><div><strong>' + won + '</strong><small>convertidos</small></div></article></section><div class="workspace-tabs"><button class="' + (leadWorkspaceTab === "leads" ? "is-active" : "") + '" data-lead-tab="leads">Funil comercial</button><button class="' + (leadWorkspaceTab === "settings" ? "is-active" : "") + '" data-lead-tab="settings">Captura e origem</button></div>' + content;
  }

  function renderWhatsapp() {
    const content = whatsappWorkspaceTab === "templates" ? renderWhatsappTemplates() : whatsappWorkspaceTab === "settings" ? '<section class="two-column-layout"><div class="stack"><article class="admin-card">' + cardTitle("Canais publicos", "Numeros usados nas conversas do site.", "") + '<div class="form-grid">' + field("WhatsApp principal", "brand.whatsapp", { help: "DDI + DDD + numero" }) + field("WhatsApp secundario", "brand.whatsappSecondary", {}) + '</div>' + field("Mensagem do botao flutuante", "whatsapp.floatingMessage", { type: "textarea", rows: 3 }) + field("Mensagem de cobertura", "whatsapp.coverageTemplate", { type: "textarea", rows: 5 }) + '</article><article class="admin-card">' + cardTitle("Mensagem de contratacao", "Contexto enviado depois da captura do lead.", "") + field("Template do plano", "whatsapp.planTemplate", { type: "textarea", rows: 9, help: "Variaveis: {brand}, {name}, {leadWhatsapp}, {plan}, {speed}, {price}, {offer}, {region}" }) + '</article></div><aside class="admin-card">' + cardTitle("Modelo de envio", "Operacao segura para esta etapa do produto.", "") + '<div class="whatsapp-mode-card"><span>' + icon("hand") + '</span><div><strong>Envio manual individual</strong><p>O painel prepara cada conversa e o atendente decide quando abrir o WhatsApp.</p></div></div><div class="security-notice security-notice--compact">' + icon("shield-check") + '<div><strong>Sem disparos em massa</strong><p>A API oficial e webhooks ficam em Integracoes, preparados para a fase SaaS com consentimento e auditoria.</p></div></div><button class="button button--ghost button--block" data-goto="pixels">' + icon("blocks") + ' Configurar integracoes</button></aside></section>' : renderWhatsappCampaigns();
    return panelHeader("WhatsApp", "Prepare mensagens e campanhas manuais com contexto do funil.", '<button class="button button--primary" data-action="new-whatsapp-campaign">' + icon("plus") + ' Nova campanha manual</button>') + '<div class="workspace-tabs"><button class="' + (whatsappWorkspaceTab === "campaigns" ? "is-active" : "") + '" data-whatsapp-tab="campaigns">Campanhas manuais</button><button class="' + (whatsappWorkspaceTab === "templates" ? "is-active" : "") + '" data-whatsapp-tab="templates">Biblioteca de mensagens</button><button class="' + (whatsappWorkspaceTab === "settings" ? "is-active" : "") + '" data-whatsapp-tab="settings">Canais e envio</button></div>' + content;
  }

  function renderCampaignWorkspace() {
    return panelHeader("Campanhas", "Crie popups com periodo, gatilho, frequencia e oferta associada.", '<button class="button button--primary" data-action="new-popup">' + icon("plus") + ' Nova campanha</button>') + '<section class="campaign-overview"><article><span>' + icon("megaphone") + '</span><div><strong>' + state.popupCampaigns.length + '</strong><small>campanhas criadas</small></div></article><article><span>' + icon("radio") + '</span><div><strong>' + state.popupCampaigns.filter(function (item) { return item.active; }).length + '</strong><small>ativas agora</small></div></article><article><span>' + icon("mouse-pointer-click") + '</span><div><strong>8,7%</strong><small>taxa de interacao</small></div></article><article><span>' + icon("ticket-percent") + '</span><div><strong>' + state.popupCampaigns.filter(function (item) { return item.couponId; }).length + '</strong><small>com cupom vinculado</small></div></article></section>' + renderPopupList();
  }

  function renderCoupons() {
    const usage = state.coupons.reduce(function (sum, item) { return sum + Number(item.used || 0); }, 0);
    return panelHeader("Cupons", "Controle regras, elegibilidade, duracao e ativacao das ofertas.", '<button class="button button--primary" data-action="new-coupon">' + icon("plus") + ' Novo cupom</button>') + '<section class="campaign-overview"><article><span>' + icon("ticket-percent") + '</span><div><strong>' + state.coupons.length + '</strong><small>cupons cadastrados</small></div></article><article><span>' + icon("circle-check") + '</span><div><strong>' + state.coupons.filter(function (item) { return item.active; }).length + '</strong><small>disponiveis</small></div></article><article><span>' + icon("copy-check") + '</span><div><strong>' + usage + '</strong><small>ativacoes registradas</small></div></article><article><span>' + icon("mouse-pointer-click") + '</span><div><strong>' + state.coupons.filter(function (item) { return item.applicationMode === "code"; }).length + '</strong><small>somente por escolha</small></div></article></section><div class="coupon-policy-note">' + icon("badge-check") + '<div><strong>Oferta sob escolha do visitante</strong><p>O desconto so entra no plano depois do codigo valido ou de uma campanha elegivel; sair ou recarregar limpa a selecao da sessao.</p></div></div>' + renderCouponList();
  }

  function renderSupport() {
    const newLeads = state.leads.filter(function (lead) { return lead.status === "new"; }).length;
    const proposals = state.leads.filter(function (lead) { return lead.status === "proposal"; }).length;
    const won = state.leads.filter(function (lead) { return lead.status === "won"; }).length;
    const content = leadWorkspaceTab === "settings" ? renderLeadSettings() : leadWorkspaceTab === "campaigns" ? renderWhatsappCampaigns() : leadWorkspaceTab === "templates" ? renderWhatsappTemplates() : renderLeadPipeline();
    return panelHeader("Leads e WhatsApp", "Organize a origem, avance o funil e prepare cada conversa antes do envio.", '<div class="heading-actions"><button class="button button--ghost" data-action="export-leads">' + icon("download") + ' Exportar leads</button><button class="button button--primary" data-action="new-whatsapp-campaign">' + icon("plus") + ' Nova campanha manual</button></div>') + '<section class="quick-stats lead-stats"><article><span>' + icon("contact-round") + '</span><div><strong>' + state.leads.length + '</strong><small>leads capturados</small></div></article><article><span>' + icon("sparkles") + '</span><div><strong>' + newLeads + '</strong><small>novos contatos</small></div></article><article><span>' + icon("file-check-2") + '</span><div><strong>' + proposals + '</strong><small>propostas em aberto</small></div></article><article><span>' + icon("trophy") + '</span><div><strong>' + won + '</strong><small>convertidos</small></div></article></section><div class="segmented-control lead-tabs"><button class="' + (leadWorkspaceTab === "leads" ? "is-active" : "") + '" data-lead-tab="leads">Funil</button><button class="' + (leadWorkspaceTab === "campaigns" ? "is-active" : "") + '" data-lead-tab="campaigns">Campanhas</button><button class="' + (leadWorkspaceTab === "templates" ? "is-active" : "") + '" data-lead-tab="templates">Templates</button><button class="' + (leadWorkspaceTab === "settings" ? "is-active" : "") + '" data-lead-tab="settings">Captura</button></div>' + content;
  }

  function leadPlan(lead) {
    return state.plans.find(function (plan) { return plan.id === lead.planId; });
  }

  function renderLeadPipeline() {
    const view = crudState.leads;
    const stages = [
      ["new", "Novos", "sparkles"], ["qualified", "Qualificados", "badge-check"], ["proposal", "Proposta", "file-check-2"], ["won", "Convertidos", "trophy"], ["lost", "Encerrados", "archive"],
    ];
    const sources = Array.from(new Set(state.leads.map(function (lead) { return lead.source || "Site"; }))).sort();
    const result = FLAdmin.collection(state.leads, { search: view.search, page: 1, pageSize: Math.max(1, state.leads.length), searchText: function (lead) { const plan = leadPlan(lead); return [lead.name, lead.whatsapp, lead.source, lead.sourceDetail, lead.utmCampaign, lead.region, plan ? plan.title + " " + plan.speed : ""].join(" "); }, predicate: function (lead) { return view.source === "all" || (lead.source || "Site") === view.source; }, sort: function (a, b) { return view.sort === "name" ? String(a.name).localeCompare(String(b.name), "pt-BR") : String(b.createdAt).localeCompare(String(a.createdAt)); } });
    const visibleLeads = result.all;
    const statusOptions = stages.map(function (stage) { return '<option value="' + stage[0] + '">{label}</option>'; });
    return '<section class="lead-funnel-toolbar"><div><strong>Funil comercial</strong><small>Atualize a etapa e acompanhe a procedencia de cada oportunidade.</small></div><span class="status-badge status-badge--success">' + result.filteredTotal + ' oportunidades</span></section>' + FLAdmin.toolbar({ key: "leads", search: view.search, placeholder: "Buscar nome, WhatsApp, plano ou regiao", count: result.filteredTotal, singular: "lead", plural: "leads", filters: [{ name: "source", label: "Origem", value: view.source, options: [{ value: "all", label: "Todas as origens" }].concat(sources.map(function (source) { return { value: source, label: source }; })) }], sortValue: view.sort, sortOptions: [{ value: "recent", label: "Mais recentes" }, { value: "name", label: "Nome A-Z" }] }) + '<section class="lead-kanban">' + stages.map(function (stage) {
      const leads = visibleLeads.filter(function (lead) { return lead.status === stage[0]; });
      return '<div class="lead-kanban__column"><header><span>' + icon(stage[2]) + '<strong>' + stage[1] + '</strong></span><b>' + leads.length + '</b></header><div>' + leads.map(function (lead) {
        const plan = leadPlan(lead); const coupon = state.coupons.find(function (item) { return item.id === lead.couponId; });
        const options = statusOptions.map(function (option, index) { return option.replace("{label}", stages[index][1]).replace('value="' + lead.status + '"', 'value="' + lead.status + '" selected'); }).join("");
        return '<article class="lead-kanban-card"><div class="lead-contact"><span>' + esc((lead.name || "L").slice(0, 2).toUpperCase()) + '</span><div><strong>' + esc(lead.name) + '</strong><small>' + esc(formatPhone(lead.whatsapp)) + '</small></div></div><div class="lead-interest"><strong>' + esc(plan ? plan.speed + " - " + plan.title : "Plano removido") + '</strong><small>' + esc(coupon ? FL.couponLabel(coupon) : "Sem cupom") + '</small></div><div class="lead-attribution"><span>' + icon("waypoints") + esc(lead.source || "Site") + '</span><small>' + esc(lead.utmCampaign || lead.sourceDetail || "Acesso direto") + '</small><small>' + esc(lead.region || "Regiao nao informada") + ' &middot; ' + dateLabel(lead.createdAt) + '</small></div><select data-lead-status="' + esc(lead.id) + '">' + options + '</select><footer><button class="button button--primary button--compact" data-action="contact-lead" data-id="' + esc(lead.id) + '">' + icon("message-circle") + ' Preparar mensagem</button><button class="icon-button icon-button--danger" data-action="delete-lead" data-id="' + esc(lead.id) + '" title="Excluir lead">' + icon("trash-2") + '</button></footer></article>';
      }).join("") + (leads.length ? "" : '<div class="kanban-empty">Nenhum lead nesta etapa</div>') + '</div></div>';
    }).join("") + '</section>' + (visibleLeads.length ? "" : FLAdmin.emptyState({ icon: "contact-round", title: state.leads.length ? "Nenhum lead encontrado" : "Nenhum lead capturado", description: state.leads.length ? "Revise a busca ou o filtro de origem." : "Os contatos enviados pela escolha de planos aparecerao aqui.", action: state.leads.length ? "clear-lead-filters" : "", actionLabel: state.leads.length ? "Limpar filtros" : "" }));
  }

  function normalizeKey(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function campaignAudience(campaign) {
    return state.leads.filter(function (lead) {
      return (!campaign.planIds.length || campaign.planIds.includes(lead.planId)) &&
        (!campaign.stages.length || campaign.stages.includes(lead.status)) &&
        (!campaign.sources.length || campaign.sources.includes(lead.source)) &&
        (!campaign.region || normalizeKey(lead.region).includes(normalizeKey(campaign.region)));
    });
  }

  function renderWhatsappCampaigns() {
    return '<section class="manual-campaign-grid">' + state.whatsappCampaigns.map(function (campaign) {
      const eligible = campaignAudience(campaign);
      return '<article class="admin-card manual-campaign-card"><div class="manual-campaign-card__head"><span>' + icon("message-square-text") + '</span><div><span class="status-badge ' + (campaign.status === "active" ? "status-badge--success" : "") + '">' + (campaign.status === "active" ? "Ativa" : "Rascunho") + '</span><small>' + esc(campaign.type || "followup") + '</small><h3>' + esc(campaign.name) + '</h3></div><div class="row-actions"><button class="icon-button" data-action="edit-whatsapp-campaign" data-id="' + esc(campaign.id) + '" title="Editar">' + icon("pencil") + '</button><button class="icon-button icon-button--danger" data-action="delete-whatsapp-campaign" data-id="' + esc(campaign.id) + '" title="Excluir">' + icon("trash-2") + '</button></div></div><p>' + esc(campaign.message) + '</p><div class="campaign-filters"><span>' + icon("git-branch") + (campaign.stages.length ? campaign.stages.length + " etapas" : "Todas as etapas") + '</span><span>' + icon("waypoints") + (campaign.sources.length ? campaign.sources.length + " origens" : "Todas as origens") + '</span><span>' + icon("map-pin") + esc(campaign.region || "Todas as regioes") + '</span></div><div class="campaign-audience"><span>' + icon("users") + '<strong>' + eligible.length + '</strong> leads compativeis</span><span>' + icon("send") + '<strong>' + campaign.contactsSent + '</strong> contatos abertos</span></div><div class="manual-lead-queue">' + eligible.slice(0, 4).map(function (lead) { const plan = leadPlan(lead); return '<div><span>' + esc((lead.name || "L").slice(0, 2).toUpperCase()) + '</span><div><strong>' + esc(lead.name) + '</strong><small>' + esc(plan ? plan.speed : "Sem plano") + '</small></div><button class="icon-button" data-action="contact-lead" data-id="' + esc(lead.id) + '" data-campaign-id="' + esc(campaign.id) + '" title="Preparar conversa">' + icon("send") + '</button></div>'; }).join("") + '</div></article>';
    }).join("") + (state.whatsappCampaigns.length ? "" : '<div class="empty-state">' + icon("message-square-text") + '<h3>Nenhuma campanha manual</h3><p>Crie uma mensagem e selecione os planos que definem o publico.</p></div>') + '</section><div class="security-notice">' + icon("shield-check") + '<div><strong>Envio individual e consciente</strong><p>O sistema apenas prepara a mensagem. Cada conversa e aberta manualmente pelo atendente, sem disparo em massa ou automacao nao autorizada.</p></div></div>';
  }

  function renderWhatsappTemplates() {
    return '<section class="template-message-head"><div><strong>Biblioteca de mensagens</strong><small>Crie variacoes para primeiro contato, retorno, cobertura, proposta e recuperacao.</small></div><button class="button button--primary" data-action="new-whatsapp-template">' + icon("plus") + ' Novo template</button></section><section class="message-template-grid">' + state.whatsappTemplates.map(function (template) {
      return '<article class="admin-card message-template-card"><div><span>' + icon(template.type === "coverage" ? "map-pin-check" : template.type === "proposal" ? "file-check-2" : template.type === "recovery" ? "refresh-ccw" : "message-square-text") + '</span><div><small>' + esc(template.type) + '</small><h3>' + esc(template.name) + '</h3></div><span class="status-badge ' + (template.active ? "status-badge--success" : "") + '">' + (template.active ? "Ativo" : "Pausado") + '</span></div><p>' + esc(template.message) + '</p><footer><button class="button button--ghost button--compact" data-action="edit-whatsapp-template" data-id="' + esc(template.id) + '">' + icon("pencil") + ' Editar</button><button class="icon-button icon-button--danger" data-action="delete-whatsapp-template" data-id="' + esc(template.id) + '" title="Excluir">' + icon("trash-2") + '</button></footer></article>';
    }).join("") + '</section><div class="template-variable-guide"><strong>Variaveis disponiveis</strong><span>{brand}</span><span>{name}</span><span>{plan}</span><span>{speed}</span><span>{price}</span><span>{offer}</span><span>{region}</span><span>{source}</span></div>';
  }

  function renderLeadSettings() {
    return '<section class="two-column-layout"><div class="stack"><article class="admin-card">' + cardTitle("Captura de interesse", "Defina o que acontece antes de abrir o WhatsApp.", "") + toggle("Capturar lead antes do WhatsApp", "leadSettings.captureEnabled", "Solicita nome e numero no clique do plano") + toggle("WhatsApp obrigatorio", "leadSettings.requireWhatsapp", "Evita registros sem canal de retorno") + field("Texto de consentimento", "leadSettings.consentText", { type: "textarea", rows: 3 }) + field("Retencao planejada", "leadSettings.retentionDays", { type: "number", help: "Dias; no SaaS sera aplicada por rotina automatica" }) + '</article><article class="admin-card">' + cardTitle("Mensagens transacionais", "Usadas no site antes de entrar no funil comercial.", "") + field("Mensagem do plano", "whatsapp.planTemplate", { type: "textarea", rows: 9, help: "Variaveis: {brand}, {name}, {leadWhatsapp}, {plan}, {speed}, {price}, {category}, {offer}, {region}" }) + field("Mensagem de cobertura", "whatsapp.coverageTemplate", { type: "textarea", rows: 5, help: "Variaveis: {cep}, {city}, {neighborhood}" }) + field("Botao flutuante", "whatsapp.floatingMessage", { type: "textarea", rows: 3 }) + '</article></div><article class="admin-card">' + cardTitle("Canais publicos", "Numeros e atalhos usados no site.", "") + '<div class="form-grid">' + field("WhatsApp principal", "brand.whatsapp", { help: "DDI + DDD + numero" }) + field("WhatsApp secundario", "brand.whatsappSecondary", {}) + '</div><div class="support-admin-list">' + state.supportCards.map(function (item) { return '<div><span>' + icon(item.icon) + '</span><div><strong>' + esc(item.title) + '</strong><p>' + esc(item.text) + '</p><small>' + esc(item.label) + '</small></div><button class="icon-button" data-action="edit-support" data-id="' + esc(item.id) + '">' + icon("pencil") + '</button><button class="icon-button" data-action="toggle-support" data-id="' + esc(item.id) + '">' + icon(item.active ? "eye" : "eye-off") + '</button></div>'; }).join("") + '</div></article></section>';
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
    const view = crudState.popups;
    const result = FLAdmin.collection(state.popupCampaigns, { search: view.search, page: view.page, pageSize: view.pageSize, searchText: function (item) { return [item.name, item.title, item.eyebrow, item.trigger].join(" "); }, predicate: function (item) { return view.status === "all" || (view.status === "active" ? item.active : !item.active); }, sort: function (a, b) { return view.sort === "name" ? String(a.name).localeCompare(String(b.name), "pt-BR") : String(b.startsAt || "").localeCompare(String(a.startsAt || "")); } });
    view.page = result.page;
    return FLAdmin.toolbar({ key: "popups", search: view.search, placeholder: "Buscar campanha ou chamada", count: result.filteredTotal, singular: "campanha", plural: "campanhas", filters: [{ name: "status", label: "Status", value: view.status, options: [{ value: "all", label: "Todos os status" }, { value: "active", label: "Ativas" }, { value: "inactive", label: "Pausadas" }] }], sortValue: view.sort, sortOptions: [{ value: "recent", label: "Mais recentes" }, { value: "name", label: "Nome A-Z" }] }) + '<section class="campaign-grid">' + result.items.map(function (item) {
      const coupon = state.coupons.find(function (couponItem) { return couponItem.id === item.couponId; });
      return '<article class="campaign-card"><div class="campaign-card__preview"><img src="' + esc(FL.safeImageUrl(item.image, "./assets/img/hero-family-fiber.jpg")) + '" alt=""><span class="status-badge ' + (item.active ? "status-badge--success" : "") + '">' + (item.active ? "Ativa" : "Pausada") + '</span></div><div class="campaign-card__body"><small>' + esc(item.eyebrow) + '</small><h3>' + esc(item.name) + '</h3><p>' + esc(item.title) + '</p><div class="campaign-rules"><span>' + icon("timer") + (item.trigger === "delay" ? "Apos " + item.delaySeconds + " segundos" : item.trigger === "scroll" ? "Ao rolar " + item.scrollPercent + "%" : "Intencao de saida") + '</span><span>' + icon("ticket-percent") + esc(coupon ? coupon.code : "Sem cupom") + '</span><span>' + icon("calendar") + esc(item.expiresAt || "Sem prazo") + '</span></div></div><div class="campaign-card__actions"><button class="button button--ghost" data-action="preview-popup" data-id="' + esc(item.id) + '">' + icon("eye") + ' Visualizar</button><button class="icon-button" data-action="edit-popup" data-id="' + esc(item.id) + '" title="Editar">' + icon("pencil") + '</button><button class="icon-button" data-action="toggle-popup" data-id="' + esc(item.id) + '" title="' + (item.active ? "Pausar" : "Ativar") + '">' + icon(item.active ? "pause" : "play") + '</button><button class="icon-button icon-button--danger" data-action="delete-popup" data-id="' + esc(item.id) + '" title="Excluir">' + icon("trash-2") + "</button></div></article>";
    }).join("") + (result.items.length ? "" : FLAdmin.emptyState({ icon: "megaphone", title: state.popupCampaigns.length ? "Nenhuma campanha encontrada" : "Nenhuma campanha criada", description: state.popupCampaigns.length ? "Revise a busca ou o status selecionado." : "Crie um popup para destacar uma oferta ou cupom.", action: state.popupCampaigns.length ? "clear-popup-filters" : "new-popup", actionLabel: state.popupCampaigns.length ? "Limpar filtros" : "Nova campanha" })) + "</section>" + FLAdmin.pagination(result, "popups");
  }

  function renderCouponList() {
    const view = crudState.coupons;
    const result = FLAdmin.collection(state.coupons, { search: view.search, page: view.page, pageSize: view.pageSize, searchText: function (item) { return [item.code, item.title, item.description, item.applicationMode].join(" "); }, predicate: function (item) { return view.status === "all" || (view.status === "active" ? item.active : !item.active); }, sort: function (a, b) { if (view.sort === "code") return String(a.code).localeCompare(String(b.code)); if (view.sort === "usage") return Number(b.used || 0) - Number(a.used || 0); return String(b.startsAt || "").localeCompare(String(a.startsAt || "")); } });
    view.page = result.page;
    return FLAdmin.toolbar({ key: "coupons", search: view.search, placeholder: "Buscar codigo, oferta ou descricao", count: result.filteredTotal, singular: "cupom", plural: "cupons", filters: [{ name: "status", label: "Status", value: view.status, options: [{ value: "all", label: "Todos os status" }, { value: "active", label: "Ativos" }, { value: "inactive", label: "Inativos" }] }], sortValue: view.sort, sortOptions: [{ value: "recent", label: "Mais recentes" }, { value: "code", label: "Codigo A-Z" }, { value: "usage", label: "Mais utilizados" }] }) + '<section class="coupon-grid">' + result.items.map(function (item) {
      const percent = Math.min(100, (Number(item.used || 0) / Math.max(1, Number(item.usageLimit || 1))) * 100);
      const modes = { code: "Ativacao por codigo", campaign: "Ativacao por campanha", both: "Codigo ou campanha" };
      return '<article class="coupon-card"><div class="coupon-card__top"><span class="status-badge ' + (item.active ? "status-badge--success" : "") + '">' + (item.active ? "Ativo" : "Inativo") + '</span><div class="row-actions"><button class="icon-button" data-action="edit-coupon" data-id="' + esc(item.id) + '">' + icon("pencil") + '</button><button class="icon-button icon-button--danger" data-action="delete-coupon" data-id="' + esc(item.id) + '">' + icon("trash-2") + '</button></div></div><small>' + esc(item.title) + '</small><button class="coupon-big-code" data-action="copy-code" data-code="' + esc(item.code) + '">' + esc(item.code) + icon("copy") + '</button><strong>' + esc(FL.couponLabel(item)) + '</strong><p>' + esc(item.description) + '</p><span class="coupon-mode">' + icon("mouse-pointer-click") + esc(modes[item.applicationMode] || modes.code) + '</span><div class="coupon-progress"><span><b>' + item.used + '</b> de ' + item.usageLimit + ' usos</span><div><i style="width:' + percent + '%"></i></div></div><footer><span>' + icon("calendar") + " Valido ate " + esc(item.expiresAt || "sem prazo") + '</span><button data-action="toggle-coupon" data-id="' + esc(item.id) + '">' + (item.active ? "Pausar" : "Ativar") + "</button></footer></article>";
    }).join("") + (result.items.length ? "" : FLAdmin.emptyState({ icon: "ticket-percent", title: state.coupons.length ? "Nenhum cupom encontrado" : "Nenhum cupom criado", description: state.coupons.length ? "Revise a busca ou o status selecionado." : "Crie um codigo promocional para uma campanha.", action: state.coupons.length ? "clear-coupon-filters" : "new-coupon", actionLabel: state.coupons.length ? "Limpar filtros" : "Novo cupom" })) + "</section>" + FLAdmin.pagination(result, "coupons");
  }

  function renderSeo() {
    const titleLength = state.seo.title.length;
    const descriptionLength = state.seo.description.length;
    return [
      panelHeader("SEO local", "Prepare a " + state.brand.name + " para buscas por internet na regiao atendida.", '<button class="button button--primary" data-action="save-content">' + icon("save") + " Salvar SEO</button>"),
      '<section class="seo-layout"><div class="stack"><article class="admin-card">' + cardTitle("Aparencia no Google", "Titulo e descricao usados nos resultados de busca.", "") + field("Titulo da pagina", "seo.title", { help: titleLength + "/60 caracteres" }) + field("Descricao", "seo.description", { type: "textarea", rows: 4, help: descriptionLength + "/160 caracteres" }) + field("Palavras-chave locais", "seo.keywords", { type: "textarea", rows: 3 }) + field("URL canonica", "seo.canonicalUrl", { type: "url" }) + '</article><article class="admin-card">' + cardTitle("Negocio local", "Dados estruturados para a area de atendimento.", "") + field("Regioes atendidas", "seo.serviceArea", { type: "textarea", rows: 3 }) + field("Verificacao do Google", "seo.googleSiteVerification", { placeholder: "Codigo de verificacao" }) + toggle("Permitir indexacao", "seo.indexSite", "Autoriza buscadores a indexar o site") + '</article></div><aside class="stack"><article class="admin-card google-preview">' + cardTitle("Previa do resultado", "Simulacao do snippet exibido na busca.", "") + '<div class="search-snippet"><span>' + esc(tenantHost()) + '</span><h3>' + esc(state.seo.title) + '</h3><p>' + esc(state.seo.description) + '</p></div></article><article class="admin-card seo-checklist">' + cardTitle("Saude da indexacao", "Itens tecnicos do site.", '<strong class="score-ring">92</strong>') + '<ul><li>' + icon("circle-check") + '<span><strong>Sitemap XML</strong><small>/sitemap.xml disponivel</small></span></li><li>' + icon("circle-check") + '<span><strong>Robots.txt</strong><small>Configurado para indexacao</small></span></li><li>' + icon("circle-check") + '<span><strong>Dados estruturados</strong><small>InternetServiceProvider e area atendida</small></span></li><li>' + icon("triangle-alert") + '<span><strong>Google Business Profile</strong><small>Vinculacao pendente no ambiente final</small></span></li></ul></article></aside></section>',
    ].join("");
  }

  function seoScoreData() {
    const checks = [
      { label: "Titulo unico", ok: state.seo.title.length >= 20 && state.seo.title.length <= 60, detail: state.seo.title.length + "/60 caracteres" },
      { label: "Descricao de busca", ok: state.seo.description.length >= 70 && state.seo.description.length <= 160, detail: state.seo.description.length + "/160 caracteres" },
      { label: "URL canonica", ok: /^https:\/\//i.test(state.seo.canonicalUrl), detail: "Evita paginas duplicadas" },
      { label: "Negocio local", ok: Boolean(state.seo.addressLocality && state.seo.addressRegion && state.seo.serviceArea), detail: "Endereco e area de servico" },
      { label: "Imagem social", ok: Boolean(state.seo.ogImage), detail: "Previa para compartilhamento" },
      { label: "Dados estruturados", ok: Boolean(state.seo.faqSchema || state.seo.offerCatalogSchema), detail: "FAQ e catalogo de ofertas" },
      { label: "Indexacao", ok: Boolean(state.seo.indexSite && state.seo.sitemapEnabled), detail: "Robots e sitemap ativos" },
    ];
    return { checks, score: Math.round((checks.filter(function (item) { return item.ok; }).length / checks.length) * 100) };
  }

  function seoTabs() {
    const tabs = [{ id: "overview", label: "Diagnostico" }, { id: "metadata", label: "Busca" }, { id: "local", label: "SEO local" }, { id: "social", label: "Compartilhamento" }, { id: "indexing", label: "Indexacao" }];
    return '<div class="workspace-tabs">' + tabs.map(function (tab) { return '<button class="' + (seoWorkspaceTab === tab.id ? "is-active" : "") + '" data-seo-tab="' + tab.id + '">' + tab.label + '</button>'; }).join("") + '</div>';
  }

  function renderSeoWorkspace() {
    const audit = seoScoreData();
    let content;
    if (seoWorkspaceTab === "metadata") {
      content = '<section class="seo-layout"><div class="stack"><article class="admin-card">' + cardTitle("Resultado organico", "Conteudo principal exibido nos buscadores.", "") + field("Titulo da pagina", "seo.title", { help: state.seo.title.length + "/60 caracteres" }) + field("Descricao", "seo.description", { type: "textarea", rows: 4, help: state.seo.description.length + "/160 caracteres" }) + field("Termos e temas locais", "seo.keywords", { type: "textarea", rows: 3, help: "Use como planejamento editorial; a tag keywords nao determina ranking." }) + field("URL canonica", "seo.canonicalUrl", { type: "url" }) + '</article></div><aside class="admin-card google-preview">' + cardTitle("Previa de busca", "Aparencia aproximada em um resultado organico.", "") + '<div class="search-snippet"><span>' + esc(tenantHost()) + '</span><h3>' + esc(state.seo.title) + '</h3><p>' + esc(state.seo.description) + '</p></div></aside></section>';
    } else if (seoWorkspaceTab === "local") {
      content = '<section class="seo-layout"><div class="stack"><article class="admin-card">' + cardTitle("Entidade da empresa", "Dados consistentes para o schema de negocio local.", "") + field("Tipo do negocio", "seo.localBusinessType", { type: "select", options: [{ value: "InternetServiceProvider", label: "Provedor de internet" }, { value: "LocalBusiness", label: "Empresa local" }, { value: "Organization", label: "Organizacao" }] }) + '<div class="form-grid">' + field("Cidade", "seo.addressLocality", {}) + field("Estado", "seo.addressRegion", {}) + field("CEP institucional", "seo.postalCode", {}) + field("Horario", "seo.openingHours", { placeholder: "Mo-Fr 08:00-18:00" }) + '</div>' + field("Regioes atendidas", "seo.serviceArea", { type: "textarea", rows: 4 }) + '</article><div class="security-notice">' + icon("map-pin-check") + '<div><strong>Consistencia local</strong><p>Nome, endereco, telefone e horario devem coincidir com o Google Business Profile e outros diretorios oficiais da empresa.</p></div></div></div><aside class="admin-card">' + cardTitle("Cobertura publicada", "Areas incorporadas aos dados estruturados.", '<span class="status-badge status-badge--success">JSON-LD</span>') + '<div class="seo-area-cloud">' + (window.FLCoverage ? FLCoverage.effectiveAreas(state) : state.regions).slice(0, 24).map(function (area) { return '<span>' + icon(area.source === "kmz" ? "scan" : "map-pin") + esc(area.name) + '</span>'; }).join("") + '</div><button class="button button--ghost button--block" data-goto="coverage">Gerenciar cobertura</button></aside></section>';
    } else if (seoWorkspaceTab === "social") {
      content = '<section class="seo-layout"><article class="admin-card">' + cardTitle("Open Graph e redes sociais", "Controle a previa ao compartilhar o site.", "") + field("Titulo social", "seo.ogTitle", { help: "Pode ser mais comercial que o titulo de busca" }) + field("Descricao social", "seo.ogDescription", { type: "textarea", rows: 4 }) + field("Imagem de compartilhamento", "seo.ogImage", { placeholder: "https://... ou imagem da biblioteca", help: "Recomendado: 1200 x 630 px" }) + '</article><aside class="admin-card social-preview-card"><div class="social-preview-image"><img src="' + esc(FL.safeImageUrl(state.seo.ogImage, "./assets/img/hero-family-fiber.jpg")) + '" alt=""></div><small>' + esc(tenantHost()) + '</small><h3>' + esc(state.seo.ogTitle || state.seo.title) + '</h3><p>' + esc(state.seo.ogDescription || state.seo.description) + '</p></aside></section>';
    } else if (seoWorkspaceTab === "indexing") {
      content = '<section class="seo-layout"><div class="stack"><article class="admin-card">' + cardTitle("Rastreamento e indexacao", "Sinais tecnicos entregues aos buscadores.", "") + toggle("Permitir indexacao", "seo.indexSite", "Publica index,follow na home") + toggle("Publicar sitemap", "seo.sitemapEnabled", "Lista home e paginas publicadas") + toggle("Schema de perguntas", "seo.faqSchema", "Inclui as perguntas visiveis em JSON-LD") + toggle("Schema de ofertas", "seo.offerCatalogSchema", "Inclui os planos ativos no catalogo estruturado") + toggle("Paginas por cidade", "seo.cityPagesEnabled", "Planejado para o SaaS; exige conteudo local realmente unico") + field("Google Search Console", "seo.googleSiteVerification", { placeholder: "Codigo de verificacao" }) + '</article></div><aside class="stack"><article class="admin-card indexing-files">' + cardTitle("Arquivos tecnicos", "Recursos publicos para descoberta do site.", "") + '<a href="./robots.txt" target="_blank">' + icon("bot") + '<span><strong>robots.txt</strong><small>Diretivas de rastreamento</small></span>' + icon("external-link") + '</a><a href="./sitemap.xml" target="_blank">' + icon("network") + '<span><strong>sitemap.xml</strong><small>URLs publicas conhecidas</small></span>' + icon("external-link") + '</a></article><div class="security-notice security-notice--compact">' + icon("info") + '<div><strong>SEO e um processo continuo</strong><p>Configuracao tecnica melhora a descoberta, mas nenhum painel pode garantir posicao nos resultados.</p></div></div></aside></section>';
    } else {
      content = '<section class="seo-diagnostic"><article class="admin-card seo-score-card"><div class="quality-ring" style="--score:' + audit.score + '"><strong>' + audit.score + '<small>%</small></strong></div><div><span>Saude tecnica</span><h3>' + (audit.score >= 85 ? "Base pronta para indexacao" : "Existem oportunidades importantes") + '</h3><p>Metadados, entidade local, compartilhamento e dados estruturados.</p></div></article><article class="admin-card seo-checklist">' + cardTitle("Checklist de publicacao", "Atualizado com a configuracao atual.", "") + '<ul>' + audit.checks.map(function (item) { return '<li class="' + (item.ok ? "is-ok" : "is-warning") + '">' + icon(item.ok ? "circle-check" : "triangle-alert") + '<span><strong>' + esc(item.label) + '</strong><small>' + esc(item.detail) + '</small></span></li>'; }).join("") + '</ul></article><article class="admin-card google-preview">' + cardTitle("Previa atual", "Resultado organico aproximado.", "") + '<div class="search-snippet"><span>' + esc(tenantHost()) + '</span><h3>' + esc(state.seo.title) + '</h3><p>' + esc(state.seo.description) + '</p></div><button class="button button--ghost button--block" data-seo-tab="metadata">Editar aparencia</button></article></section>';
    }
    return panelHeader("SEO local", "Fortaleca a entidade da empresa e entregue sinais tecnicos consistentes aos buscadores.", '<button class="button button--primary" data-action="save-content">' + icon("save") + ' Salvar SEO</button>') + seoTabs() + content;
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

  function integrationTabs() {
    const tabs = [{ id: "marketing", label: "Marketing" }, { id: "maps", label: "Mapas e enderecos" }, { id: "communications", label: "Comunicacao" }, { id: "commerce", label: "Comercio futuro" }];
    return '<div class="workspace-tabs">' + tabs.map(function (tab) { return '<button class="' + (integrationWorkspaceTab === tab.id ? "is-active" : "") + '" data-integration-tab="' + tab.id + '">' + tab.label + '</button>'; }).join("") + '</div>';
  }

  function renderIntegrations() {
    let content;
    if (integrationWorkspaceTab === "maps") {
      content = '<section class="integration-grid integration-grid--settings"><article class="integration-card integration-card--wide"><div class="integration-card__head"><span>' + icon("map") + '</span><div><h3>Google Maps Platform</h3><p>Geocodificacao precisa e base para mapas avancados.</p></div>' + toggle("", "coverageSettings.googleMapsEnabled", "") + '</div>' + field("Chave publica restrita", "coverageSettings.googleMapsBrowserKey", { type: "password", placeholder: "AIza...", help: "Restrinja por dominio e apenas pelas APIs necessarias. Nunca use chave de servidor no navegador." }) + field("Map ID", "coverageSettings.googleMapId", { placeholder: "ID do estilo configurado no Google Cloud" }) + '</article><article class="integration-card integration-card--wide"><div class="integration-card__head"><span>' + icon("search-code") + '</span><div><h3>Geocodificacao e CEP</h3><p>Escolha o provedor usado para localizar enderecos.</p></div></div>' + field("Provedor", "coverageSettings.geocodingProvider", { type: "select", options: [{ value: "nominatim", label: "Nominatim / OpenStreetMap" }, { value: "google", label: "Google Maps Platform" }] }) + toggle("ViaCEP", "coverageSettings.cepLookup", "Consulta publica de CEP para preenchimento de endereco") + '</article></section><div class="security-notice">' + icon("key-round") + '<div><strong>Segredos nao pertencem ao navegador</strong><p>Somente chaves publicas restritas por dominio podem ser configuradas aqui. Tokens privados e chamadas faturaveis sensiveis exigem backend e cofre de segredos no SaaS.</p></div></div>';
    } else if (integrationWorkspaceTab === "communications") {
      content = '<section class="integration-grid integration-grid--settings"><article class="integration-card integration-card--wide"><div class="integration-card__head"><span>' + icon("message-circle-more") + '</span><div><h3>WhatsApp</h3><p>Canal manual atual e preparacao para API oficial.</p></div></div>' + field("Modo de operacao", "integrations.whatsappMode", { type: "select", options: [{ value: "manual", label: "Manual individual" }, { value: "cloud_api", label: "Cloud API (requer backend)" }] }) + toggle("Preparar Cloud API", "integrations.whatsappApiEnabled", "Nao envia mensagens nesta demonstracao") + field("Phone Number ID", "integrations.whatsappPhoneId", { placeholder: "Identificador publico da conta" }) + '</article><article class="integration-card integration-card--wide"><div class="integration-card__head"><span>' + icon("webhook") + '</span><div><h3>Webhooks</h3><p>Destino futuro para eventos assinados e auditados.</p></div></div>' + field("URL publica", "integrations.webhookUrl", { type: "url", placeholder: "https://api.exemplo.com/webhooks" }) + '<div class="integration-status-row"><span><i></i> Backend necessario</span><small>Assinatura, repeticao e idempotencia serao obrigatorias.</small></div></article></section>';
    } else if (integrationWorkspaceTab === "commerce") {
      content = '<div class="roadmap-banner"><span>' + icon("shopping-bag") + '</span><div><strong>E-commerce de equipamentos</strong><p>Modulo planejado para produtos, clientes, carrinho, checkout e pedidos sem misturar as responsabilidades do site institucional.</p></div><em>Proxima fase</em></div><section class="commerce-roadmap-grid"><article><span>' + icon("wallet-cards") + '</span><h3>Mercado Pago</h3><p>Checkout transparente por adaptador server-side e webhooks assinados.</p><em>Planejado</em></article><article><span>' + icon("credit-card") + '</span><h3>PagSeguro</h3><p>Pix, cartao tokenizado e conciliacao de pedidos no backend.</p><em>Planejado</em></article><article><span>' + icon("badge-dollar-sign") + '</span><h3>Stripe</h3><p>Payment Intents, elementos hospedados e idempotencia por pedido.</p><em>Planejado</em></article><article><span>' + icon("package-check") + '</span><h3>Catalogo e pedidos</h3><p>Produtos, categorias, estoque, carrinho, clientes e acompanhamento.</p><em>Planejado</em></article></section><div class="security-notice">' + icon("shield-check") + '<div><strong>Checkout sera implementado somente com backend</strong><p>O sistema nao armazenara dados de cartao. Precos, estoque, assinaturas de webhook e estados de pagamento serao validados no servidor.</p></div></div>';
    } else {
      content = '<div class="security-notice">' + icon("shield-check") + '<div><strong>Consentimento antes de mensuracao</strong><p>Tags de marketing so carregam quando o visitante aceita cookies, e os identificadores passam por validacao de formato.</p></div></div><section class="integration-grid">' + integrationCard("Google Analytics 4", "Visitas, sessoes, eventos e jornadas.", "chart-no-axes-combined", "integrations.ga4Enabled", "integrations.ga4Id", "G-XXXXXXXXXX") + integrationCard("Meta Pixel", "Conversoes para Facebook e Instagram.", "facebook", "integrations.metaPixelEnabled", "integrations.metaPixelId", "123456789012345") + integrationCard("Google Ads", "Conversoes das campanhas de pesquisa.", "badge-dollar-sign", "integrations.googleAdsEnabled", "integrations.googleAdsId", "AW-XXXXXXXXX") + integrationCard("Google Tag Manager", "Container opcional para tags adicionais.", "tags", "integrations.gtmEnabled", "integrations.gtmId", "GTM-XXXXXXX") + '</section><section class="admin-card event-catalog">' + cardTitle("Eventos preparados", "Acoes first-party enviadas as integracoes consentidas.", "") + '<div><span>' + icon("eye") + '<b>page_view</b><small>Visualizacao da home</small></span><span>' + icon("mouse-pointer-click") + '<b>plan_click</b><small>Interesse em plano</small></span><span>' + icon("contact-round") + '<b>lead_capture</b><small>Lead capturado</small></span><span>' + icon("message-circle") + '<b>whatsapp_click</b><small>Conversa iniciada</small></span><span>' + icon("map-pin") + '<b>coverage_search</b><small>Consulta regional</small></span><span>' + icon("ticket-percent") + '<b>coupon_apply</b><small>Oferta escolhida</small></span></div></section>';
    }
    return panelHeader("Integracoes e APIs", "Centralize servicos externos, chaves publicas e dependencias de backend.", '<button class="button button--primary" data-action="save-content">' + icon("save") + ' Salvar integracoes</button>') + integrationTabs() + content;
  }

  function renderAnalytics() {
    const data = analyticsData();
    const sources = Object.entries(groupByPayload(data.events, "source")).sort(function (a, b) { return b[1] - a[1]; });
    const regions = Object.entries(groupByPayload(data.events, "region")).sort(function (a, b) { return b[1] - a[1]; });
    return [
      panelHeader("Desempenho", "Entenda canais, dispositivos, conversoes e oportunidades comerciais.", '<div class="heading-actions"><select class="compact-select" data-analytics-period aria-label="Periodo das metricas"><option value="28"' + (analyticsPeriod === 28 ? " selected" : "") + '>28 dias</option><option value="7"' + (analyticsPeriod === 7 ? " selected" : "") + '>7 dias</option><option value="1"' + (analyticsPeriod === 1 ? " selected" : "") + '>Hoje</option></select><button class="button button--ghost" data-action="export-report">' + icon("download") + " Exportar CSV</button></div>"),
      '<section class="metrics-grid">' + metricCard("Visitantes", data.views, "+12,8%", "comparado ao periodo anterior", "users", "blue") + metricCard("CTR dos planos", (data.views ? (data.planClicks / data.views) * 100 : 0).toFixed(1).replace(".", ",") + "%", "+3,1%", "cliques sobre visitas", "mouse-pointer-click", "violet") + metricCard("Conversao em lead", data.conversion.toFixed(1).replace(".", ",") + "%", "+1,4%", "formularios sobre visitas", "contact-round", "green") + metricCard("Cobertura consultada", data.coverage, "+6,7%", "buscas no periodo", "map-pin-check", "orange") + '</section>',
      '<section class="analytics-layout"><article class="admin-card">' + cardTitle("Canais de aquisicao", "Participacao por origem de trafego.", "") + '<div class="donut-layout"><div class="donut-chart" style="--a:37%;--b:64%;--c:82%"><strong>' + data.views + '<small>visitas</small></strong></div><div class="donut-legend">' + sources.slice(0, 5).map(function (entry, index) { return '<div><i class="dot-' + (index + 1) + '"></i><span>' + esc(entry[0]) + '</span><strong>' + entry[1] + "</strong></div>"; }).join("") + '</div></div></article><article class="admin-card">' + cardTitle("Demanda por regiao", "Interacoes identificadas por cidade.", "") + '<div class="horizontal-bars">' + regions.map(function (entry, index) { const max = regions[0] ? regions[0][1] : 1; return '<div><span>' + esc(entry[0]) + '</span><div><i style="width:' + (entry[1] / max) * 100 + '%"></i></div><strong>' + entry[1] + "</strong></div>"; }).join("") + '</div></article><article class="admin-card device-card">' + cardTitle("Dispositivos", "Distribuicao estimada por viewport.", "") + '<div class="device-bars"><div><span>' + icon("smartphone") + ' Celular</span><strong>68%</strong><i><b style="width:68%"></b></i></div><div><span>' + icon("monitor") + ' Desktop</span><strong>27%</strong><i><b style="width:27%"></b></i></div><div><span>' + icon("tablet") + ' Tablet</span><strong>5%</strong><i><b style="width:5%"></b></i></div></div></article></section>',
    ].join("");
  }

  function renderHeatmap() {
    const sorted = state.regions.slice().sort(function (a, b) { return b.interest - a.interest; });
    const priorityNames = sorted.slice(0, 2).map(function (region) { return region.name; }).join(" e ") || "As regioes prioritarias";
    const featuredPlan = state.plans.find(function (plan) { return plan.featured && plan.active; }) || state.plans.find(function (plan) { return plan.active; });
    return [
      panelHeader("Mapa de interesse", "Cruze consultas, cliques e leads para orientar expansao e anuncios regionais.", '<button class="button button--ghost" data-action="export-report">' + icon("download") + " Exportar dados</button>"),
      '<section class="heatmap-layout"><article class="admin-card map-admin-card">' + cardTitle("Intensidade regional", "Quanto mais brilhante, maior o interesse comercial.", '<select class="compact-select"><option>Todos os eventos</option><option>Leads WhatsApp</option><option>Consultas</option></select>') + regionHeatMap() + '</article><aside class="admin-card">' + cardTitle("Prioridades comerciais", "Regioes ordenadas por potencial.", "") + '<div class="priority-list">' + sorted.map(function (region, index) {
        const status = region.interest >= 75 ? "Alta prioridade" : region.interest >= 50 ? "Monitorar" : "Em observacao";
        return '<div><span class="rank">0' + (index + 1) + '</span><div><strong>' + esc(region.name) + '</strong><small>' + status + '</small><i><b style="width:' + region.interest + '%"></b></i></div><em>' + region.interest + "%</em></div>";
      }).join("") + '</div></aside></section><section class="admin-card insight-banner">' + icon("lightbulb") + '<div><strong>Oportunidade identificada</strong><p>' + esc(priorityNames) + ' concentram a maior parte do interesse. Campanhas de ' + esc(featuredPlan ? featuredPlan.speed : "planos em destaque") + ' nessas regioes tendem a ter melhor retorno.</p></div><button class="button button--ghost" data-goto="campaigns">Criar campanha</button></section>',
    ].join("");
  }

  function renderActivity() {
    const view = crudState.activity;
    const resources = Array.from(new Set(state.auditLog.map(function (entry) { return entry.resource; }))).sort();
    const result = FLAdmin.collection(state.auditLog, {
      search: view.search,
      page: view.page,
      pageSize: view.pageSize,
      searchText: function (entry) { return [entry.label, entry.detail, entry.resource, entry.actor, auditLabel(entry.action)].join(" "); },
      predicate: function (entry) { return view.resource === "all" || entry.resource === view.resource; },
      sort: function (a, b) { return view.sort === "oldest" ? String(a.createdAt).localeCompare(String(b.createdAt)) : String(b.createdAt).localeCompare(String(a.createdAt)); },
    });
    view.page = result.page;
    const today = state.auditLog.filter(function (entry) { return String(entry.createdAt).slice(0, 10) === new Date().toISOString().slice(0, 10); }).length;
    return [
      panelHeader("Atividade", "Acompanhe alteracoes administrativas, publicacoes e importacoes desta demonstracao.", '<button class="button button--ghost" data-action="export-audit">' + icon("download") + ' Exportar atividade</button>'),
      '<section class="quick-stats activity-stats"><article><span>' + icon("history") + '</span><div><strong>' + state.auditLog.length + '</strong><small>eventos registrados</small></div></article><article><span>' + icon("calendar") + '</span><div><strong>' + today + '</strong><small>alteracoes hoje</small></div></article><article><span>' + icon("rocket") + '</span><div><strong>' + state.auditLog.filter(function (entry) { return entry.action === "publish"; }).length + '</strong><small>publicacoes</small></div></article><article><span>' + icon("shield-check") + '</span><div><strong>Local</strong><small>trilha demonstrativa</small></div></article></section>',
      FLAdmin.toolbar({ key: "activity", search: view.search, placeholder: "Buscar por acao, recurso ou detalhe", count: result.filteredTotal, singular: "evento", plural: "eventos", filters: [{ name: "resource", label: "Recurso", value: view.resource, options: [{ value: "all", label: "Todos os recursos" }].concat(resources.map(function (resource) { return { value: resource, label: resource.charAt(0).toUpperCase() + resource.slice(1) }; })) }], sortValue: view.sort, sortOptions: [{ value: "recent", label: "Mais recentes" }, { value: "oldest", label: "Mais antigos" }] }),
      result.items.length ? '<section class="admin-card activity-list"><div class="activity-list__head"><span>Evento</span><span>Recurso</span><span>Responsavel</span><span>Data</span></div>' + result.items.map(function (entry) { return '<article><span class="activity-icon activity-icon--' + esc(entry.action) + '">' + icon(entry.action === "delete" ? "trash-2" : entry.action === "publish" ? "rocket" : entry.action === "import" ? "file-up" : entry.action === "create" ? "plus" : "pencil") + '</span><div><strong>' + esc(entry.label) + '</strong><small>' + esc(entry.detail || auditLabel(entry.action)) + '</small></div><span class="activity-resource">' + esc(entry.resource) + '</span><span class="activity-actor">' + esc(entry.actor || "Administrador") + '</span><time datetime="' + esc(entry.createdAt) + '">' + dateLabel(entry.createdAt) + '</time></article>'; }).join("") + '</section>' : FLAdmin.emptyState({ icon: "history", title: "Nenhuma atividade encontrada", description: "Revise a busca ou o filtro de recurso para consultar outros eventos." }),
      FLAdmin.pagination(result, "activity"),
      '<div class="security-notice">' + icon("shield-check") + '<div><strong>Trilha local da demonstracao</strong><p>No SaaS, estes eventos serao imutaveis, vinculados a usuario e tenant e armazenados no servidor. O historico local nao e um controle de seguranca.</p></div></div>',
    ].join("");
  }

  function renderSettings() {
    return [
      panelHeader("Configuracoes", "Dados institucionais, links do sistema e manutencao do prototipo.", '<button class="button button--primary" data-action="save-content">' + icon("save") + " Salvar configuracoes</button>"),
      '<section class="admin-card module-control"><div class="module-control__head">' + cardTitle("Recursos do site", "Ative somente as experiencias usadas por esta empresa. O conteudo configurado e preservado quando um recurso e pausado.", '<span class="status-badge status-badge--success">Por empresa</span>') + '</div><div class="module-control__grid">' + [
        ["plans", "badge-dollar-sign", "Planos e ofertas", "Catalogo comercial e botoes de contratacao."],
        ["apps", "app-window", "Apps e beneficios", "Entretenimento e servicos incluidos."],
        ["coverage", "map-pinned", "Cobertura", "Mapa, consulta por CEP e areas KMZ."],
        ["testimonials", "messages-square", "Depoimentos", "Prova social publicada na pagina."],
        ["faq", "circle-help", "Duvidas frequentes", "Respostas rapidas antes da contratacao."],
        ["support", "headset", "Atendimento", "Atalhos de suporte e area do cliente."],
        ["promotions", "ticket-percent", "Promocoes e cupons", "Aplicacao de campanhas nos planos."],
        ["ecommerce", "shopping-bag", "Loja de equipamentos", "Dominio isolado para catalogo, carrinho e checkout."],
      ].map(function (module) { return '<article class="module-control__item' + (module[0] === "ecommerce" ? " is-roadmap" : "") + '"><span>' + icon(module[1]) + '</span><div><strong>' + module[2] + '</strong><small>' + module[3] + '</small>' + (module[0] === "ecommerce" ? '<em>Base preparada; checkout seguro entra na proxima etapa.</em>' : "") + '</div>' + toggle("", "modules." + module[0], "") + '</article>'; }).join("") + '</div></section>',
      '<section class="settings-layout"><div class="stack"><article class="admin-card">' + cardTitle("Dados da empresa", "Informacoes do tenant usadas no site e nos dados estruturados.", "") + '<div class="form-grid">' + field("Nome da marca", "brand.name", {}) + field("Identificador do tenant", "brand.slug", {}) + field("Razao social", "brand.legalName", {}) + field("CNPJ", "brand.cnpj", {}) + field("Site principal", "brand.siteUrl", { type: "url" }) + field("E-mail", "brand.email", { type: "email" }) + field("Telefone", "brand.phone", {}) + field("WhatsApp", "brand.whatsapp", {}) + field("Instagram", "brand.instagram", { type: "url" }) + field("Facebook", "brand.facebook", { type: "url" }) + '</div>' + field("Endereco", "brand.address", {}) + field("Resumo da cobertura", "brand.coverageSummary", {}) + '</article><article class="admin-card">' + cardTitle("Area do cliente", "O sistema do assinante continua externo a este produto.", "") + field("URL de acesso", "brand.clientAreaUrl", { type: "url" }) + '<div class="external-system">' + icon("external-link") + '<div><strong>Sistema externo do assinante</strong><p>O link abre em nova aba e nao compartilha credenciais com este painel.</p></div><a href="' + esc(FL.safeUrl(state.brand.clientAreaUrl, "#")) + '" target="_blank" rel="noopener">Testar acesso</a></div></article></div><aside class="stack"><article class="admin-card">' + cardTitle("Publicacao", "Estado atual desta configuracao.", "") + '<div class="publication-status"><span>' + icon(state.meta.status === "published" ? "circle-check" : "clock-3") + '</span><div><strong>' + (state.meta.status === "published" ? "Site publicado" : "Alteracoes em rascunho") + '</strong><p>Ultima publicacao em ' + dateLabel(state.meta.publishedAt) + '</p></div></div><button class="button button--primary button--block" data-action="publish">' + icon("rocket") + ' Publicar agora</button></article><article class="admin-card danger-zone">' + cardTitle("Dados do prototipo", "Ferramentas para transferencia e recuperacao.", "") + '<button class="button button--ghost button--block" data-action="export-state">' + icon("download") + ' Exportar configuracao</button><label class="button button--ghost button--block file-action">' + icon("upload") + ' Importar configuracao<input id="import-state-file" type="file" accept="application/json"></label><button class="button button--danger button--block" data-action="reset-state">' + icon("rotate-ccw") + " Restaurar padrao</button></article></aside></section>",
    ].join("");
  }

  function renderPanel() {
    const renderers = {
      dashboard: renderDashboard, builder: renderBuilder, pages: renderPages, banners: renderBanners, media: renderMedia, navigation: renderNavigation,
      appearance: renderAppearance, plans: renderPlans, catalog: renderCatalog, coverage: renderCoverageWorkspace,
      support: renderLeads, leads: renderLeads, whatsapp: renderWhatsapp, campaigns: renderCampaignWorkspace, coupons: renderCoupons,
      seo: renderSeoWorkspace, pixels: renderIntegrations, analytics: renderDashboard, heatmap: renderDashboard,
      activity: renderActivity, settings: renderSettings,
    };
    const panel = $("#admin-panel");
    if (window.FLVisualBuilderEditor) window.FLVisualBuilderEditor.unmount();
    destroyAdminMap();
    try {
      panel.innerHTML = (renderers[activePanel] || renderDashboard)();
    } catch (error) {
      console.error("Falha ao renderizar o painel", activePanel, error);
      panel.innerHTML = '<section class="admin-state admin-state--error" role="alert"><span>' + icon("triangle-alert") + '</span><h2>Nao foi possivel carregar esta area</h2><p>Os seus dados continuam preservados. Tente carregar o modulo novamente ou volte ao Dashboard.</p><div><button class="button button--primary" data-action="retry-panel">' + icon("refresh-cw") + ' Tentar novamente</button><button class="button button--ghost" data-goto="dashboard">' + icon("layout-dashboard") + ' Ir ao Dashboard</button></div></section>';
    }
    const meta = PANEL_META[activePanel] || PANEL_META.dashboard;
    $("#panel-title").textContent = meta[0];
    $("#topbar-section").textContent = meta[1];
    $$("#admin-nav [data-panel]").forEach(function (button) { button.classList.toggle("is-active", button.dataset.panel === activePanel); });
    $("#nav-plan-count").textContent = state.plans.filter(function (item) { return item.active; }).length;
    bindPanelControls();
    if (activePanel === "builder" && window.FLVisualBuilderEditor) {
      const builderRoot = panel.querySelector("#visual-theme-builder");
      if (builderRoot) window.FLVisualBuilderEditor.mount(builderRoot, {
        toast: toast,
        refreshIcons: refreshIcons,
        onStateChange: function (nextState, message) {
          state = FL.saveState(nextState, false);
          setSaveStatus("draft");
          if (message) toast(message, "success");
        },
        onPublish: function () {
          writeAudit("publish", "theme", "Tema visual publicado", "Workspace validado e disponibilizado no site publico");
          state = FL.saveState(state, true);
          setSaveStatus("saved");
        },
      });
    }
    initAdminMap();
    refreshIcons();
  }

  function openThemeStudio() {
    location.href = "./studio.html";
  }

  function setPanel(panel) {
    const studioAliases = { banners: "slides", navigation: "header", appearance: "brand" };
    if (studioAliases[panel]) { builderStudioTab = studioAliases[panel]; panel = "builder"; }
    if (panel === "builder") { openThemeStudio(); return; }
    if (panel === "support") panel = "leads";
    if (panel === "analytics" || panel === "heatmap") panel = "dashboard";
    if (!PANEL_META[panel]) panel = "dashboard";
    activePanel = panel;
    const activeButton = $('#admin-nav [data-panel="' + panel + '"]');
    const activeGroup = activeButton && activeButton.closest("[data-nav-group]");
    if (activeGroup && activeGroup.classList.contains("is-collapsed")) {
      activeGroup.classList.remove("is-collapsed");
      const toggle = $("[data-nav-group-toggle]", activeGroup);
      if (toggle) {
        toggle.setAttribute("aria-expanded", "true");
        const stored = navGroupPreferences();
        stored[toggle.dataset.navGroupToggle] = false;
        localStorage.setItem("fl-admin-nav-groups", JSON.stringify(stored));
      }
    }
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
    if ($("#admin-modal").hidden) modalReturnFocus = document.activeElement;
    $("#admin-modal-content").innerHTML = html;
    const dialog = $("#admin-modal .admin-modal__dialog");
    dialog.classList.toggle("admin-modal__dialog--wide", Boolean(wide));
    dialog.setAttribute("aria-labelledby", "admin-dialog-title");
    $("#admin-modal").hidden = false;
    document.body.classList.add("modal-open");
    bindModalControls();
    refreshIcons();
    requestAnimationFrame(function () { const focusable = $("input:not([type=hidden]), select, textarea, button, [href]", dialog); if (focusable) focusable.focus(); });
  }

  function closeModal() {
    $("#admin-modal").hidden = true;
    document.body.classList.remove("modal-open");
    pendingConfirmation = null;
    if (modalReturnFocus && document.contains(modalReturnFocus)) modalReturnFocus.focus();
    modalReturnFocus = null;
  }

  function modalHeader(title, description) {
    return '<div class="modal-heading"><span class="eyebrow">Fibra Site OS</span><h2 id="admin-dialog-title">' + esc(title) + '</h2><p>' + esc(description) + "</p></div>";
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
    const previewLogo = FL.safeImageUrl(app.logo, "");
    const preview = previewLogo ? '<img src="' + esc(previewLogo) + '" alt="">' : '<span>' + esc((app.name || "APP").slice(0, 2)) + '</span>';
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
    const coupon = item || { id: "", code: "", title: "", description: "", discountType: "percentage", discountValue: 10, durationType: "first_month", durationMonths: 1, applicationMode: "code", planIds: [], startsAt: new Date().toISOString().slice(0, 10), expiresAt: "", usageLimit: 100, used: 0, active: true };
    openModal(modalHeader(item ? "Editar desconto" : "Novo desconto", "Configure a regra e escolha como o visitante podera ativar esta oferta.") + '<form class="modal-form" data-form-kind="coupon"><input type="hidden" name="id" value="' + esc(coupon.id) + '"><div class="form-grid"><label class="field"><span>Codigo</span><input name="code" value="' + esc(coupon.code) + '" maxlength="24" required></label><label class="field"><span>Nome interno</span><input name="title" value="' + esc(coupon.title) + '" required></label><label class="field"><span>Tipo de desconto</span><select name="discountType"><option value="percentage"' + (coupon.discountType === "percentage" ? " selected" : "") + '>Percentual (%)</option><option value="fixed"' + (coupon.discountType === "fixed" ? " selected" : "") + '>Valor fixo (R$)</option></select></label><label class="field"><span>Valor do desconto</span><input name="discountValue" type="number" min="0.01" max="100" step="0.01" value="' + esc(coupon.discountValue) + '" required></label><label class="field"><span>Duracao</span><select name="durationType"><option value="first_month"' + (coupon.durationType === "first_month" ? " selected" : "") + '>Somente no primeiro mes</option><option value="months"' + (coupon.durationType === "months" ? " selected" : "") + '>Primeiros meses</option><option value="lifetime"' + (coupon.durationType === "lifetime" ? " selected" : "") + '>Vitalicio enquanto o plano estiver ativo</option></select></label><label class="field"><span>Quantidade de meses</span><input name="durationMonths" type="number" min="1" max="36" value="' + esc(coupon.durationMonths || 1) + '"><small>Usado apenas na opcao primeiros meses.</small></label><label class="field"><span>Ativacao</span><select name="applicationMode"><option value="code"' + (coupon.applicationMode === "code" ? " selected" : "") + '>Somente quando digitar o codigo</option><option value="campaign"' + (coupon.applicationMode === "campaign" ? " selected" : "") + '>Somente por campanha associada</option><option value="both"' + (coupon.applicationMode === "both" ? " selected" : "") + '>Codigo ou campanha</option></select></label><label class="field"><span>Inicio</span><input name="startsAt" type="date" value="' + esc(coupon.startsAt) + '"></label><label class="field"><span>Termino</span><input name="expiresAt" type="date" value="' + esc(coupon.expiresAt) + '"></label><label class="field"><span>Limite de usos</span><input name="usageLimit" type="number" min="1" value="' + coupon.usageLimit + '"></label></div><label class="field"><span>Descricao comercial</span><textarea name="description" rows="3">' + esc(coupon.description) + '</textarea></label><fieldset class="plan-selector"><legend>Planos participantes</legend><p>Sem selecao, o desconto vale para todos os planos.</p><div>' + state.plans.map(function (plan) { return '<label><input type="checkbox" name="planIds" value="' + esc(plan.id) + '"' + (coupon.planIds.includes(plan.id) ? " checked" : "") + '><span><strong>' + esc(plan.speed) + '</strong><small>' + esc(plan.title) + '</small></span></label>'; }).join("") + '</div></fieldset><label class="check-field"><input name="active" type="checkbox"' + (coupon.active ? " checked" : "") + '><span>Desconto ativo</span></label><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + " Salvar desconto</button></div></form>", true);
  }

  function whatsappCampaignModal(item) {
    const campaign = item || { id: "", name: "", type: "followup", templateId: state.whatsappTemplates[0] ? state.whatsappTemplates[0].id : "", message: "Ola {name}! Aqui e da {brand}. Vimos seu interesse no plano {plan}. Posso ajudar com a oferta {offer}?", planIds: [], stages: [], sources: [], region: "", status: "draft", contactsSent: 0 };
    const sources = Array.from(new Set(state.leads.map(function (lead) { return lead.source; }).filter(Boolean)));
    const stages = [["new", "Novo"], ["qualified", "Qualificado"], ["proposal", "Proposta"], ["won", "Convertido"], ["lost", "Encerrado"]];
    const planOptions = state.plans.map(function (plan) {
      const category = state.categories.find(function (entry) { return entry.id === plan.categoryId; });
      const detail = [plan.title, category && category.name].filter(function (value, index, values) { return value && values.indexOf(value) === index; }).join(" · ");
      return '<label class="campaign-choice campaign-choice--plan"><input type="checkbox" name="planIds" value="' + esc(plan.id) + '"' + (campaign.planIds.includes(plan.id) ? " checked" : "") + '><span class="campaign-choice__check">' + icon("check") + '</span><span class="campaign-choice__body"><strong>' + esc(plan.speed) + '</strong><small>' + esc(detail || "Plano de internet") + '</small></span><em>' + esc(FL.formatCurrency(plan.price)) + '</em></label>';
    }).join("");
    const stageOptions = stages.map(function (stage) {
      return '<label class="campaign-choice"><input type="checkbox" name="stages" value="' + stage[0] + '"' + (campaign.stages.includes(stage[0]) ? " checked" : "") + '><span class="campaign-choice__check">' + icon("check") + '</span><span class="campaign-choice__body"><strong>' + stage[1] + '</strong><small>Etapa do funil</small></span></label>';
    }).join("");
    const sourceOptions = sources.length ? sources.map(function (source) {
      return '<label class="campaign-choice"><input type="checkbox" name="sources" value="' + esc(source) + '"' + (campaign.sources.includes(source) ? " checked" : "") + '><span class="campaign-choice__check">' + icon("check") + '</span><span class="campaign-choice__body"><strong>' + esc(source) + '</strong><small>Origem do lead</small></span></label>';
    }).join("") : '<div class="campaign-choice-empty">As origens aparecerao aqui quando houver leads capturados.</div>';
    const audienceCount = campaignAudience(campaign).length;
    const basicFields = '<section class="campaign-form-section"><header><span>' + icon("settings-2") + '</span><div><strong>Configuracao da campanha</strong><small>Identifique a acao e escolha uma mensagem inicial.</small></div></header><div class="form-grid"><label class="field"><span>Nome interno</span><input name="name" value="' + esc(campaign.name) + '" placeholder="Retorno 600 Mega" required></label><label class="field"><span>Tipo da campanha</span><select name="type"><option value="followup"' + (campaign.type === "followup" ? " selected" : "") + '>Retorno comercial</option><option value="promotion"' + (campaign.type === "promotion" ? " selected" : "") + '>Promocao</option><option value="coverage"' + (campaign.type === "coverage" ? " selected" : "") + '>Cobertura</option><option value="proposal"' + (campaign.type === "proposal" ? " selected" : "") + '>Proposta</option><option value="recovery"' + (campaign.type === "recovery" ? " selected" : "") + '>Recuperacao</option><option value="seasonal"' + (campaign.type === "seasonal" ? " selected" : "") + '>Sazonal</option></select></label><label class="field"><span>Template inicial</span><select name="templateId" data-campaign-template><option value="">Mensagem personalizada</option>' + state.whatsappTemplates.filter(function (template) { return template.active; }).map(function (template) { return '<option value="' + esc(template.id) + '"' + (template.id === campaign.templateId ? " selected" : "") + '>' + esc(template.name) + '</option>'; }).join("") + '</select></label><label class="field"><span>Regiao contem</span><input name="region" value="' + esc(campaign.region || "") + '" placeholder="Ex.: Sumare"></label></div></section>';
    const messageFields = '<section class="campaign-form-section campaign-message-section"><header><span>' + icon("message-square-text") + '</span><div><strong>Mensagem do atendimento</strong><small>O atendente revisa o texto antes de abrir cada conversa.</small></div></header><label class="field"><span>Mensagem</span><textarea name="message" rows="6" maxlength="1800" required>' + esc(campaign.message) + '</textarea><small><span data-campaign-message-count>' + String(campaign.message || "").length + '</span>/1800 caracteres</small></label><div class="campaign-variable-list"><span>{name}</span><span>{plan}</span><span>{price}</span><span>{offer}</span><span>{region}</span><span>{source}</span></div></section>';
    const audienceFields = '<section class="campaign-audience-builder"><header class="campaign-audience-builder__head"><span>' + icon("users-round") + '</span><div><strong>Publico da campanha</strong><small>Sem filtros marcados, todos os leads entram na selecao.</small></div><div class="campaign-audience-total"><strong data-campaign-audience-count>' + audienceCount + '</strong><span>leads compativeis</span></div></header><fieldset class="campaign-filter-group campaign-filter-group--plans" data-campaign-filter-group="planIds"><legend><span><strong>Planos de interesse</strong><small data-campaign-selected-count>Todos os planos</small></span><span class="campaign-filter-actions"><label>' + icon("search") + '<input type="search" data-campaign-plan-search placeholder="Buscar plano"></label><button type="button" data-campaign-clear="planIds">Usar todos</button></span></legend><div class="campaign-choice-grid" data-campaign-plan-list>' + planOptions + '</div></fieldset><div class="campaign-filter-columns"><fieldset class="campaign-filter-group" data-campaign-filter-group="stages"><legend><span><strong>Etapas do funil</strong><small data-campaign-selected-count>Todas as etapas</small></span><button type="button" data-campaign-clear="stages">Usar todas</button></legend><div class="campaign-choice-grid campaign-choice-grid--compact">' + stageOptions + '</div></fieldset><fieldset class="campaign-filter-group" data-campaign-filter-group="sources"><legend><span><strong>Origens</strong><small data-campaign-selected-count>Todas as origens</small></span><button type="button" data-campaign-clear="sources">Usar todas</button></legend><div class="campaign-choice-grid campaign-choice-grid--compact">' + sourceOptions + '</div></fieldset></div></section>';
    openModal(modalHeader(item ? "Editar campanha manual" : "Nova campanha manual", "Defina o publico, prepare a mensagem e mantenha cada envio sob controle do atendente.") + '<form class="modal-form campaign-builder-form" data-form-kind="whatsapp-campaign"><input type="hidden" name="id" value="' + esc(campaign.id) + '">' + basicFields + messageFields + audienceFields + '<label class="check-field campaign-ready-toggle"><input name="active" type="checkbox"' + (campaign.status === "active" ? " checked" : "") + '><span><strong>Campanha pronta para atendimento</strong><small>Ela ficara disponivel na fila manual de contatos.</small></span></label><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + ' Salvar campanha</button></div></form>', true);
  }

  function whatsappTemplateModal(item) {
    const template = item || { id: "", name: "", type: "followup", message: "Ola {name}! Aqui e da {brand}. Posso ajudar com o plano {plan}?", active: true };
    openModal(modalHeader(item ? "Editar template" : "Novo template", "Padronize a comunicacao sem tirar do atendente a revisao da mensagem final.") + '<form class="modal-form" data-form-kind="whatsapp-template"><input type="hidden" name="id" value="' + esc(template.id) + '"><div class="form-grid"><label class="field"><span>Nome do template</span><input name="name" value="' + esc(template.name) + '" required></label><label class="field"><span>Finalidade</span><select name="type"><option value="plan"' + (template.type === "plan" ? " selected" : "") + '>Primeiro contato</option><option value="followup"' + (template.type === "followup" ? " selected" : "") + '>Retorno</option><option value="coverage"' + (template.type === "coverage" ? " selected" : "") + '>Cobertura</option><option value="proposal"' + (template.type === "proposal" ? " selected" : "") + '>Proposta</option><option value="recovery"' + (template.type === "recovery" ? " selected" : "") + '>Recuperacao</option><option value="promotion"' + (template.type === "promotion" ? " selected" : "") + '>Promocao</option></select></label></div><label class="field"><span>Mensagem</span><textarea name="message" rows="8" required>' + esc(template.message) + '</textarea><small>Use {brand}, {name}, {plan}, {speed}, {price}, {offer}, {region} e {source}.</small></label><label class="check-field"><input name="active" type="checkbox"' + (template.active ? " checked" : "") + '><span>Template disponivel no compositor</span></label><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + ' Salvar template</button></div></form>', true);
  }

  function leadMessageValues(lead) {
    const plan = leadPlan(lead); const coupon = state.coupons.find(function (item) { return item.id === lead.couponId; });
    return { brand: state.brand.name, name: lead.name, plan: plan ? plan.title : "plano selecionado", speed: plan ? plan.speed : "", price: plan ? FL.formatCurrency(coupon ? FL.couponPrice(plan, coupon) : plan.price) : "", offer: coupon ? FL.couponLabel(coupon) : "condicoes vigentes", region: lead.region || "sua regiao", source: lead.source || "site" };
  }

  function messageComposerModal(lead, campaign) {
    const template = campaign ? null : state.whatsappTemplates.find(function (item) { return item.type === "plan" && item.active; }) || state.whatsappTemplates.find(function (item) { return item.active; });
    const rawMessage = campaign ? campaign.message : template ? template.message : state.whatsapp.planTemplate;
    const message = FL.interpolate(rawMessage, leadMessageValues(lead));
    openModal(modalHeader("Preparar conversa", "Revise a mensagem final antes de abrir o WhatsApp. Nada sera enviado automaticamente.") + '<form class="modal-form compose-message-form" data-form-kind="compose-message"><input type="hidden" name="leadId" value="' + esc(lead.id) + '"><input type="hidden" name="campaignId" value="' + esc(campaign ? campaign.id : "") + '"><div class="compose-lead-summary"><span>' + esc((lead.name || "L").slice(0, 2).toUpperCase()) + '</span><div><strong>' + esc(lead.name) + '</strong><small>' + esc(formatPhone(lead.whatsapp)) + ' &middot; ' + esc(lead.source || "Site") + '</small></div></div><label class="field"><span>Template</span><select name="templateId" data-compose-template><option value="">Mensagem da campanha</option>' + state.whatsappTemplates.filter(function (item) { return item.active; }).map(function (item) { return '<option value="' + esc(item.id) + '"' + (template && item.id === template.id ? " selected" : "") + '>' + esc(item.name) + '</option>'; }).join("") + '</select></label><label class="field"><span>Mensagem final</span><textarea name="message" rows="10" maxlength="1800" required>' + esc(message) + '</textarea><small><span data-message-count>' + message.length + '</span>/1800 caracteres. Revise nome, oferta e contexto antes de continuar.</small></label><div class="compose-context"><span>' + icon("waypoints") + esc(lead.source || "Site") + '</span><span>' + icon("map-pin") + esc(lead.region || "Regiao nao informada") + '</span><span>' + icon("shield-check") + 'Contato individual</span></div><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("message-circle") + ' Abrir no WhatsApp</button></div></form>', true);
  }

  function popupModal(item) {
    const campaign = item || { id: "", name: "", type: "coupon", title: "", description: "", eyebrow: "", image: state.banners[0].image, couponId: state.coupons[0] ? state.coupons[0].id : "", ctaLabel: "Ver oferta", ctaLink: "#planos", trigger: "delay", delaySeconds: 8, scrollPercent: 45, frequency: "session", startsAt: new Date().toISOString().slice(0, 10), expiresAt: "", active: true };
    openModal(modalHeader(item ? "Editar campanha" : "Nova campanha popup", "A campanha aparece sobre o site conforme a regra escolhida.") + '<form class="modal-form" data-form-kind="popup"><input type="hidden" name="id" value="' + esc(campaign.id) + '"><div class="form-grid"><label class="field"><span>Nome interno</span><input name="name" value="' + esc(campaign.name) + '" required></label><label class="field"><span>Cupom associado</span><select name="couponId"><option value="">Sem cupom</option>' + state.coupons.map(function (coupon) { return '<option value="' + esc(coupon.id) + '"' + (coupon.id === campaign.couponId ? " selected" : "") + ">" + esc(coupon.code) + "</option>"; }).join("") + '</select></label></div><label class="field"><span>Chamada curta</span><input name="eyebrow" value="' + esc(campaign.eyebrow) + '"></label><label class="field"><span>Titulo</span><input name="title" value="' + esc(campaign.title) + '" required></label><label class="field"><span>Descricao</span><textarea name="description" rows="3">' + esc(campaign.description) + '</textarea></label><label class="field"><span>Imagem</span><input name="image" value="' + esc(campaign.image) + '"></label><div class="form-grid"><label class="field"><span>Gatilho</span><select name="trigger"><option value="delay"' + (campaign.trigger === "delay" ? " selected" : "") + '>Tempo na pagina</option><option value="scroll"' + (campaign.trigger === "scroll" ? " selected" : "") + '>Rolagem da pagina</option><option value="exit"' + (campaign.trigger === "exit" ? " selected" : "") + '>Intencao de saida</option></select></label><label class="field"><span>Atraso em segundos</span><input name="delaySeconds" type="number" min="2" value="' + campaign.delaySeconds + '"></label><label class="field"><span>Rolagem (%)</span><input name="scrollPercent" type="number" min="10" max="90" value="' + campaign.scrollPercent + '"></label><label class="field"><span>Frequencia</span><select name="frequency"><option value="session"' + (campaign.frequency === "session" ? " selected" : "") + '>Uma vez por sessao</option><option value="always"' + (campaign.frequency === "always" ? " selected" : "") + '>Sempre</option></select></label><label class="field"><span>Inicio</span><input name="startsAt" type="date" value="' + esc(campaign.startsAt) + '"></label><label class="field"><span>Termino</span><input name="expiresAt" type="date" value="' + esc(campaign.expiresAt) + '"></label><label class="field"><span>Texto do botao</span><input name="ctaLabel" value="' + esc(campaign.ctaLabel) + '"></label><label class="field"><span>Destino</span><input name="ctaLink" value="' + esc(campaign.ctaLink) + '"></label></div><label class="check-field"><input name="active" type="checkbox"' + (campaign.active ? " checked" : "") + '><span>Campanha ativa</span></label><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + " Salvar campanha</button></div></form>", true);
  }

  function regionModal(item) {
    const region = item || { id: "", name: "", city: "", type: "city", cep: "", cepStart: "", cepEnd: "", cepPrefixes: [], neighborhoods: [], stateCode: state.coverageSettings.defaultState, address: "", status: "Consulta de viabilidade", interest: 50, leads: 0, lat: "", lng: "", radiusKm: state.coverageSettings.defaultRadiusKm, priority: 10, color: state.theme.mapAccent, active: true };
    openModal(modalHeader(item ? "Editar regra de cobertura" : "Nova regra de cobertura", "Combine regras por CEP, cidade, bairro, raio ou regiao. As regras de maior prioridade sao avaliadas primeiro.") + '<form class="modal-form region-form" data-form-kind="region"><input type="hidden" name="id" value="' + esc(region.id) + '"><div class="form-grid"><label class="field"><span>Tipo de regra</span><select name="type"><option value="city"' + (region.type === "city" ? " selected" : "") + '>Cidade</option><option value="neighborhood"' + (region.type === "neighborhood" ? " selected" : "") + '>Lista de bairros</option><option value="cep"' + (region.type === "cep" ? " selected" : "") + '>CEP exato</option><option value="cep_prefix"' + (region.type === "cep_prefix" ? " selected" : "") + '>Prefixos de CEP</option><option value="cep_range"' + (region.type === "cep_range" ? " selected" : "") + '>Faixa de CEP</option><option value="radius"' + (region.type === "radius" ? " selected" : "") + '>Ponto e raio</option><option value="region"' + (region.type === "region" ? " selected" : "") + '>Regiao comercial</option></select></label><label class="field"><span>Nome da regra</span><input name="name" value="' + esc(region.name) + '" placeholder="Cobertura centro de Sumare" required></label><label class="field"><span>Cidade</span><input name="city" value="' + esc(region.city || (region.type === "city" ? region.name : "")) + '" placeholder="Sumare"></label><label class="field"><span>UF</span><input name="stateCode" maxlength="2" value="' + esc(region.stateCode || "SP") + '" required></label><label class="field"><span>Prioridade</span><input name="priority" type="number" min="1" max="100" value="' + esc(region.priority || 10) + '"><small>Maior valor vence quando duas regras combinam.</small></label><label class="field"><span>CEP de referencia ou exato</span><span class="input-action"><input id="region-cep" name="cep" inputmode="numeric" value="' + esc(region.cep || "") + '" placeholder="00000-000"><button id="lookup-region-cep" type="button" title="Buscar CEP">' + icon("search") + '</button></span><small id="region-cep-status">Preenche endereco e coordenadas automaticamente.</small></label></div><div class="form-grid"><label class="field"><span>Prefixos de CEP</span><textarea name="cepPrefixes" rows="3" placeholder="13170&#10;13171">' + esc((region.cepPrefixes || []).join("\n")) + '</textarea><small>Um prefixo por linha.</small></label><label class="field"><span>CEP inicial</span><input name="cepStart" value="' + esc(region.cepStart || "") + '" placeholder="13170000"></label><label class="field"><span>CEP final</span><input name="cepEnd" value="' + esc(region.cepEnd || "") + '" placeholder="13179999"></label><label class="field"><span>Bairros atendidos</span><textarea name="neighborhoods" rows="3" placeholder="Centro&#10;Jardim Primavera">' + esc((region.neighborhoods || []).join("\n")) + '</textarea><small>Um bairro por linha.</small></label></div><label class="field"><span>Endereco de referencia</span><input name="address" value="' + esc(region.address || "") + '" placeholder="Rua, bairro, cidade - UF"></label><div class="form-grid"><label class="field"><span>Latitude</span><input name="lat" type="number" step="any" value="' + esc(region.lat) + '"></label><label class="field"><span>Longitude</span><input name="lng" type="number" step="any" value="' + esc(region.lng) + '"></label><label class="field"><span>Raio aproximado</span><input name="radiusKm" type="number" min="0.5" max="100" step="0.5" value="' + esc(region.radiusKm) + '"><small>Usado no mapa e em regras por raio.</small></label><label class="field"><span>Cor da area</span><span class="color-input"><input name="color" type="color" value="' + esc(region.color || state.theme.mapAccent) + '"><b>' + esc(region.color || state.theme.mapAccent) + '</b></span></label></div><div class="form-grid"><label class="field"><span>Status publico</span><input name="status" value="' + esc(region.status) + '" required></label><label class="field"><span>Interesse (%)</span><input name="interest" type="number" min="0" max="100" value="' + esc(region.interest) + '"></label><label class="field"><span>Leads registrados</span><input name="leads" type="number" min="0" value="' + esc(region.leads) + '"></label></div><div class="route-preview"><span>' + icon("route") + '</span><div><strong>Validacao cartografica</strong><p>Use o CEP para preencher o ponto e confira a posicao antes de publicar.</p></div><a id="region-google-link" href="' + esc(googleMapsUrl(region, true)) + '" target="_blank" rel="noopener">Abrir mapa ' + icon("external-link") + '</a></div><label class="check-field"><input name="active" type="checkbox"' + (region.active ? " checked" : "") + '><span>Publicar esta regra no site</span></label><div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button button--primary" type="submit">' + icon("save") + " Salvar regra</button></div></form>", true);
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
      if (!form.elements.name.value) form.elements.name.value = "Cobertura " + address.localidade;
      if (form.elements.city) form.elements.city.value = address.localidade;
      form.elements.stateCode.value = address.uf;
      form.elements.address.value = [address.logradouro, address.bairro, address.localidade + " - " + address.uf].filter(Boolean).join(", ");
      const query = [address.logradouro, address.bairro, address.localidade, address.uf, "Brasil"].filter(Boolean).join(", ");
      let point = null;
      if (state.coverageSettings.googleMapsEnabled && state.coverageSettings.geocodingProvider === "google" && state.coverageSettings.googleMapsBrowserKey) {
        const geoResponse = await fetch("https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(query) + "&key=" + encodeURIComponent(state.coverageSettings.googleMapsBrowserKey));
        const payload = geoResponse.ok ? await geoResponse.json() : null;
        point = payload && payload.results && payload.results[0] ? payload.results[0].geometry.location : null;
      } else {
        const geoResponse = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=" + encodeURIComponent(query));
        const locations = geoResponse.ok ? await geoResponse.json() : [];
        if (locations[0]) point = { lat: locations[0].lat, lng: locations[0].lon };
      }
      if (point) { form.elements.lat.value = point.lat; form.elements.lng.value = point.lng; }
      status.textContent = point ? "Endereco e ponto do mapa preenchidos." : "Endereco preenchido. Confirme as coordenadas no mapa.";
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
    openModal('<div class="popup-admin-preview"><div class="popup-admin-preview__image"><img src="' + esc(FL.safeImageUrl(campaign.image, "./assets/img/hero-family-fiber.jpg")) + '" alt=""></div><div><span class="eyebrow">' + esc(campaign.eyebrow) + '</span><h2>' + esc(campaign.title) + '</h2><p>' + esc(campaign.description) + '</p>' + (coupon ? '<button class="coupon-big-code">' + esc(coupon.code) + icon("copy") + '</button>' : "") + '<button class="button button--primary">' + esc(campaign.ctaLabel) + " " + icon("arrow-right") + "</button></div></div>", true);
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

  function rejectField(form, name, message) {
    const fieldElement = form.elements[name];
    if (!fieldElement) { toast(message, "error"); return true; }
    fieldElement.setCustomValidity(message);
    const field = fieldElement.closest(".field") || fieldElement.parentElement;
    if (field) { field.classList.add("has-error"); const current = $(".field-error", field); if (current) current.textContent = message; else field.insertAdjacentHTML("beforeend", '<small class="field-error" role="alert">' + esc(message) + '</small>'); }
    fieldElement.reportValidity(); fieldElement.focus();
    toast("Revise os campos destacados", "error");
    return true;
  }

  async function handleModalSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const kind = form.dataset.formKind;
    const auditEntry = { action: data.id ? "update" : "create", resource: kind, label: (data.id ? "Atualizacao: " : "Criacao: ") + (data.name || data.title || data.code || kind), detail: "Alteracao salva pelo painel administrativo" };
    if (kind === "compose-message") {
      const lead = state.leads.find(function (item) { return item.id === data.leadId; });
      const campaign = state.whatsappCampaigns.find(function (item) { return item.id === data.campaignId; });
      const message = String(data.message || "").trim().slice(0, 1800);
      if (!lead || !lead.whatsapp || !message) { toast("Nao foi possivel preparar esta conversa", "error"); return; }
      if (lead.status === "new") lead.status = "qualified";
      lead.lastContactAt = new Date().toISOString();
      if (campaign) campaign.contactsSent = Number(campaign.contactsSent || 0) + 1;
      saveRuntime("Conversa preparada no WhatsApp", { action: "contact", resource: "lead", label: "Conversa preparada", detail: lead.name + " via WhatsApp" });
      closeModal();
      window.open(FL.whatsappLink(lead.whatsapp, message), "_blank", "noopener");
      renderPanel();
      return;
    }
    if (kind === "banner") {
      if (!FLAdmin.isSafeImageUrl(data.image)) { rejectField(form, "image", "Informe uma imagem HTTP(S), local ou da biblioteca."); return; }
      if (data.primaryLink && !FLAdmin.isSafeUrl(data.primaryLink)) { rejectField(form, "primaryLink", "Use um link HTTP(S), ancora ou destino interno valido."); return; }
      if (data.secondaryLink && !FLAdmin.isSafeUrl(data.secondaryLink)) { rejectField(form, "secondaryLink", "Use um link HTTP(S), ancora ou destino interno valido."); return; }
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
      if (!Number.isFinite(Number(data.price)) || Number(data.price) <= 0) { rejectField(form, "price", "Informe uma mensalidade maior que zero."); return; }
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
      if (data.logo && !FLAdmin.isSafeImageUrl(data.logo)) { rejectField(form, "logo", "Use uma imagem HTTP(S), local ou da biblioteca."); return; }
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
      const item = { id: data.id || FL.uid("coupon"), code: data.code.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24), title: data.title, discountType: data.discountType, discountValue: Number(data.discountValue), durationType: data.durationType, durationMonths: data.durationType === "months" ? Number(data.durationMonths || 1) : data.durationType === "first_month" ? 1 : 0, applicationMode: data.applicationMode || "code", description: data.description, startsAt: data.startsAt, expiresAt: data.expiresAt, usageLimit: Number(data.usageLimit), used: existing ? existing.used : 0, planIds: formData.getAll("planIds"), active: form.elements.active.checked };
      if (!item.code || state.coupons.some(function (coupon) { return coupon.code === item.code && coupon.id !== item.id; })) { toast("Informe um codigo unico para o desconto", "error"); return; }
      if (item.expiresAt && item.startsAt && item.expiresAt < item.startsAt) { toast("A data final deve ser posterior ao inicio", "error"); return; }
      item.discount = FL.couponLabel(item);
      if (existing) Object.assign(existing, item); else state.coupons.push(item);
    }
    if (kind === "whatsapp-campaign") {
      const existing = state.whatsappCampaigns.find(function (item) { return item.id === data.id; });
      const item = { id: data.id || FL.uid("wa-campaign"), name: data.name, type: data.type, templateId: data.templateId, message: data.message, planIds: formData.getAll("planIds"), stages: formData.getAll("stages"), sources: formData.getAll("sources"), region: data.region, status: form.elements.active.checked ? "active" : "draft", contactsSent: existing ? existing.contactsSent : 0, createdAt: existing ? existing.createdAt : new Date().toISOString().slice(0, 10) };
      if (existing) Object.assign(existing, item); else state.whatsappCampaigns.push(item);
    }
    if (kind === "whatsapp-template") {
      const existing = state.whatsappTemplates.find(function (item) { return item.id === data.id; });
      const item = { id: data.id || FL.uid("wa-template"), name: data.name, type: data.type, message: data.message, active: form.elements.active.checked };
      if (existing) Object.assign(existing, item); else state.whatsappTemplates.push(item);
    }
    if (kind === "popup") {
      if (!FLAdmin.isSafeImageUrl(data.image)) { rejectField(form, "image", "Informe uma imagem HTTP(S), local ou da biblioteca."); return; }
      if (data.ctaLink && !FLAdmin.isSafeUrl(data.ctaLink)) { rejectField(form, "ctaLink", "Use um link HTTP(S), ancora ou destino interno valido."); return; }
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
      if (kind === "region") {
        if ((data.lat === "") !== (data.lng === "")) { rejectField(form, data.lat === "" ? "lat" : "lng", "Latitude e longitude devem ser informadas juntas."); return; }
        if (data.lat !== "" && (Math.abs(Number(data.lat)) > 90 || Math.abs(Number(data.lng)) > 180)) { rejectField(form, "lat", "Informe coordenadas geograficas validas."); return; }
        item = { id: data.id || FL.uid("region"), name: data.name, city: data.city, type: data.type, cep: data.cep, cepStart: data.cepStart, cepEnd: data.cepEnd, cepPrefixes: String(data.cepPrefixes || "").split(/\n|,/).map(function (value) { return value.replace(/\D/g, ""); }).filter(Boolean), neighborhoods: String(data.neighborhoods || "").split(/\n|,/).map(function (value) { return value.trim(); }).filter(Boolean), stateCode: data.stateCode.toUpperCase(), address: data.address, status: data.status, interest: Number(data.interest), leads: Number(data.leads), lat: data.lat === "" ? null : Number(data.lat), lng: data.lng === "" ? null : Number(data.lng), radiusKm: Number(data.radiusKm || state.coverageSettings.defaultRadiusKm), priority: Number(data.priority || 10), color: data.color || state.theme.mapAccent, active: form.elements.active.checked };
      }
      if (kind === "support") { if (data.url && !FLAdmin.isSafeUrl(data.url)) { rejectField(form, "url", "Use um endereco HTTP(S), interno ou uma ancora valida."); return; } item = { ...existing, id: data.id, title: data.title, text: data.text, label: data.label, url: data.url, icon: data.icon }; }
      if (existing) Object.assign(existing, item); else list.push(item);
    }
    saveDraft("Alteracoes salvas em rascunho", auditEntry);
    closeModal();
    renderPanel();
  }

  function bindModalControls() {
    $$("[data-admin-modal-close]", $("#admin-modal")).forEach(function (button) { button.addEventListener("click", closeModal); });
    const confirmButton = $("[data-confirm-submit]", $("#admin-modal"));
    if (confirmButton) confirmButton.addEventListener("click", function () { const callback = pendingConfirmation; pendingConfirmation = null; closeModal(); if (callback) callback(); });
    const form = $(".modal-form", $("#admin-modal"));
    if (form) form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const submit = $('button[type="submit"]', form);
      form.setAttribute("aria-busy", "true");
      if (submit) submit.disabled = true;
      try { await handleModalSubmit(form); }
      finally { if (document.contains(form)) { form.removeAttribute("aria-busy"); if (submit) submit.disabled = false; } }
    });
    if (form) $$("input, textarea, select", form).forEach(function (element) { element.addEventListener("input", function () { element.setCustomValidity(""); const field = element.closest(".field"); if (field) { field.classList.remove("has-error"); const error = $(".field-error", field); if (error) error.remove(); } }); });
    $$("[data-edit-category-modal]", $("#admin-modal")).forEach(function (button) { button.addEventListener("click", function () {
      categoryModal(state.categories.find(function (item) { return item.id === button.dataset.editCategoryModal; }));
    }); });
    $$("[data-delete-category-modal]", $("#admin-modal")).forEach(function (button) { button.addEventListener("click", function () {
      const id = button.dataset.deleteCategoryModal;
      if (state.plans.some(function (plan) { return plan.categoryId === id; })) { toast("Mova os planos desta categoria antes de exclui-la", "error"); return; }
      const item = state.categories.find(function (category) { return category.id === id; });
      requestConfirmation({ title: "Excluir a categoria " + (item ? item.name : "selecionada") + "?", description: "A categoria sera removida das opcoes de cadastro de planos.", impact: "Nenhum plano esta associado a esta categoria.", confirmLabel: "Excluir categoria" }, function () { state.categories = state.categories.filter(function (category) { return category.id !== id; }); saveDraft("Categoria excluida", { action: "delete", resource: "category", label: "Categoria excluida", detail: item ? item.name : id }); categoryModal(); });
    }); });
    const resetCategory = $("[data-category-reset]", $("#admin-modal"));
    if (resetCategory) resetCategory.addEventListener("click", function () { categoryModal(); });
    $$("[data-add-home-section]", $("#admin-modal")).forEach(function (button) { button.addEventListener("click", function () { addHomeSection(button.dataset.addHomeSection); }); });
    $$("[data-apply-home-template]", $("#admin-modal")).forEach(function (button) { button.addEventListener("click", function () {
      const templateId = button.dataset.applyHomeTemplate; const template = HOME_TEMPLATES[templateId];
      requestConfirmation({ icon: "layout-template", title: "Aplicar o modelo " + (template ? template.label : "selecionado") + "?", description: "A ordem e a visibilidade das secoes do sistema serao atualizadas.", impact: "O conteudo dos blocos sera preservado e a alteracao podera ser desfeita no construtor.", confirmLabel: "Aplicar modelo", confirmIcon: "layout-template", danger: false }, function () { applyHomeTemplate(templateId); });
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
    const campaignTemplate = $("[data-campaign-template]", $("#admin-modal"));
    if (campaignTemplate && form) campaignTemplate.addEventListener("change", function () {
      const template = state.whatsappTemplates.find(function (item) { return item.id === campaignTemplate.value; });
      if (template) {
        form.elements.message.value = template.message;
        form.elements.message.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    if (form && form.dataset.formKind === "whatsapp-campaign") {
      const checkedValues = function (name) {
        return $$('input[name="' + name + '"]:checked', form).map(function (input) { return input.value; });
      };
      const audienceLabels = {
        planIds: ["Todos os planos", "plano selecionado", "planos selecionados"],
        stages: ["Todas as etapas", "etapa selecionada", "etapas selecionadas"],
        sources: ["Todas as origens", "origem selecionada", "origens selecionadas"],
      };
      const updateCampaignAudience = function () {
        ["planIds", "stages", "sources"].forEach(function (name) {
          const group = $('[data-campaign-filter-group="' + name + '"]', form);
          const selected = checkedValues(name).length;
          const output = group && $("[data-campaign-selected-count]", group);
          if (output) output.textContent = selected ? selected + " " + audienceLabels[name][selected === 1 ? 1 : 2] : audienceLabels[name][0];
        });
        const probe = {
          planIds: checkedValues("planIds"),
          stages: checkedValues("stages"),
          sources: checkedValues("sources"),
          region: form.elements.region ? form.elements.region.value.trim() : "",
        };
        const audience = campaignAudience(probe);
        const count = $("[data-campaign-audience-count]", form);
        if (count) count.textContent = audience.length;
      };
      $$('[data-campaign-filter-group] input[type="checkbox"]', form).forEach(function (input) { input.addEventListener("change", updateCampaignAudience); });
      $$('[data-campaign-clear]', form).forEach(function (button) { button.addEventListener("click", function () {
        $$('input[name="' + button.dataset.campaignClear + '"]', form).forEach(function (input) { input.checked = false; });
        updateCampaignAudience();
      }); });
      const region = form.elements.region;
      if (region) region.addEventListener("input", updateCampaignAudience);
      const planSearch = $("[data-campaign-plan-search]", form);
      if (planSearch) planSearch.addEventListener("input", function () {
        const term = planSearch.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
        $$(".campaign-choice--plan", form).forEach(function (choice) {
          const content = choice.textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          choice.hidden = Boolean(term) && !content.includes(term);
        });
      });
      const message = form.elements.message;
      const messageCount = $("[data-campaign-message-count]", form);
      if (message && messageCount) message.addEventListener("input", function () { messageCount.textContent = message.value.length; });
      updateCampaignAudience();
    }
    const composeTemplate = $("[data-compose-template]", $("#admin-modal"));
    if (composeTemplate && form) {
      const textarea = form.elements.message; const counter = $("[data-message-count]", form);
      const updateCount = function () { if (counter) counter.textContent = textarea.value.length; };
      composeTemplate.addEventListener("change", function () {
        const lead = state.leads.find(function (item) { return item.id === form.elements.leadId.value; });
        const template = state.whatsappTemplates.find(function (item) { return item.id === composeTemplate.value; });
        if (lead && template) textarea.value = FL.interpolate(template.message, leadMessageValues(lead));
        updateCount();
      });
      textarea.addEventListener("input", updateCount);
    }
  }

  async function identifyCoverageFile(id, automatic) {
    const file = state.coverageFiles.find(function (item) { return item.id === id; });
    if (!file || !window.FLCoverage || file.geocodingStatus === "processing") return;
    file.geocodingStatus = "processing";
    file.geocodingProgress = 0;
    setSaveStatus("saving");
    if (!automatic) toast("Identificando bairros e vias no mapa...", "success");
    if (activePanel === "coverage") renderPanel();
    try {
      const enriched = await FLCoverage.enrichFile(file, state, function (progress) {
        file.geocodingProgress = Math.round((progress.current / Math.max(1, progress.total)) * 100);
        const indicator = document.querySelector('[data-geocode-progress="' + String(id).replace(/[^a-zA-Z0-9_-]/g, "") + '"]');
        if (indicator) indicator.textContent = file.geocodingProgress + "% identificado";
      });
      const index = state.coverageFiles.findIndex(function (item) { return item.id === id; });
      if (index >= 0) state.coverageFiles[index] = enriched;
      saveDraft("Areas identificadas por bairro e via", { action: "update", resource: "coverage", label: "Geografia da cobertura identificada", detail: enriched.geocodingRequests + " consultas geograficas com cache local" });
      toast("Bairros e vias da cobertura foram identificados.", "success");
    } catch (error) {
      file.geocodingStatus = "error";
      saveDraft();
      toast(error.message || "Nao foi possivel identificar as areas.", "error");
    }
    if (activePanel === "coverage") renderPanel();
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
    if (action === "retry-panel") renderPanel();
    if (action === "publish") publish();
    if (action === "preview-site" || action === "builder-preview") window.open("./index.html?theme=" + state.builderSettings.previewTheme, "_blank", "noopener");
    if (action === "builder-refresh") { const frame = $("#site-preview"); if (frame) frame.src = "./index.html?preview=" + Date.now() + "&theme=" + state.builderSettings.previewTheme; }
    if (action === "builder-save") { saveDraft("Estrutura salva"); scheduleBuilderPreview(); }
    if (action === "home-templates") homeTemplatesModal();
    if (action === "add-section") sectionLibraryModal();
    if (action === "select-builder-banner") { selectedBannerId = id; builderInspectorTab = "content"; renderPanel(); }
    if (action === "builder-add-banner") {
      const source = state.banners[state.banners.length - 1] || { eyebrow: state.brand.tagline, image: state.mediaLibrary[0] ? state.mediaLibrary[0].url : "", primaryLabel: "Conhecer planos", primaryLink: "#planos", secondaryLabel: "Consultar cobertura", secondaryLink: "#cobertura", position: "center", overlay: 65 };
      const banner = { ...FL.clone(source), id: FL.uid("banner"), name: "Novo destaque", title: "Uma nova mensagem para sua marca.", subtitle: "Edite este slide diretamente no construtor visual.", badge: "Novidade", active: false };
      state.banners.push(banner); selectedBannerId = banner.id; saveDraft("Slide adicionado", { action: "create", resource: "banner", label: "Slide criado no Site Studio", detail: banner.name }); renderPanel();
    }
    if (action === "duplicate-builder-banner") { const source = find(state.banners); if (source) { const banner = FL.clone(source); banner.id = FL.uid("banner"); banner.name += " - copia"; banner.active = false; state.banners.splice(state.banners.indexOf(source) + 1, 0, banner); selectedBannerId = banner.id; saveDraft("Slide duplicado", { action: "create", resource: "banner", label: "Slide duplicado", detail: source.name }); renderPanel(); } }
    if (action === "delete-builder-banner" && state.banners.length > 1) { const item = find(state.banners); requestConfirmation({ title: "Excluir o slide " + (item ? item.name : "selecionado") + "?", description: "O slide deixara de existir no Site Studio e na pagina inicial.", impact: "A exclusao entra no rascunho e so chega ao site publicado depois de Publicar.", confirmLabel: "Excluir slide" }, function () { const index = state.banners.findIndex(function (banner) { return banner.id === id; }); state.banners.splice(index, 1); selectedBannerId = state.banners[Math.max(0, index - 1)].id; saveDraft("Slide excluido", { action: "delete", resource: "banner", label: "Slide excluido", detail: item ? item.name : id }); renderPanel(); }); }
    if (action === "move-builder-banner-up" || action === "move-builder-banner-down") { moveInArray(state.banners, id, action.endsWith("up") ? -1 : 1); saveDraft("Ordem dos slides atualizada"); renderPanel(); }
    if (action === "move-block-up" || action === "move-block-down") { recordBuilderHistory(); moveInArray(state.pageBlocks, selectedBlockId, action.endsWith("up") ? -1 : 1); saveDraft(); renderPanel(); }
    if (action === "duplicate-block") {
      const source = state.pageBlocks.find(function (item) { return item.id === selectedBlockId; });
      if (source && !source.locked) { recordBuilderHistory(); const copy = FL.clone(source); copy.id = FL.uid("section"); copy.label += " - copia"; copy.anchor = ""; state.pageBlocks.splice(state.pageBlocks.indexOf(source) + 1, 0, copy); selectedBlockId = copy.id; saveDraft("Secao duplicada"); renderPanel(); }
    }
    if (action === "delete-block") {
      const source = state.pageBlocks.find(function (item) { return item.id === selectedBlockId; });
      if (source && !source.locked) requestConfirmation({ title: "Excluir a secao " + source.label + "?", description: "O bloco e seu conteudo serao removidos da estrutura da pagina inicial.", impact: "Voce ainda podera desfazer esta mudanca durante a sessao do construtor.", confirmLabel: "Excluir secao" }, function () { recordBuilderHistory(); const index = state.pageBlocks.indexOf(source); state.pageBlocks.splice(index, 1); selectedBlockId = state.pageBlocks[Math.max(0, index - 1)].id; saveDraft("Secao excluida", { action: "delete", resource: "section", label: "Secao da home excluida", detail: source.label }); renderPanel(); });
    }
    if (action === "builder-undo" && builderHistory.length) { const current = builderSnapshot(); const previous = builderHistory.pop(); builderFuture.push(current); restoreBuilderSnapshot(previous); toast("Alteracao desfeita"); renderPanel(); }
    if (action === "builder-redo" && builderFuture.length) { const current = builderSnapshot(); const next = builderFuture.pop(); builderHistory.push(current); restoreBuilderSnapshot(next); toast("Alteracao refeita"); renderPanel(); }
    if (action === "builder-theme") { state.builderSettings.previewTheme = state.builderSettings.previewTheme === "dark" ? "light" : "dark"; saveDraft(); renderPanel(); }
    if (action === "new-banner") bannerModal();
    if (action === "edit-banner") bannerModal(find(state.banners));
    if (action === "toggle-banner") { const item = find(state.banners); item.active = !item.active; saveDraft(); renderPanel(); }
    if (action === "duplicate-banner") { const item = FL.clone(find(state.banners)); item.id = FL.uid("banner"); item.name += " - copia"; item.active = false; state.banners.push(item); saveDraft("Slide duplicado"); renderPanel(); }
    if (action === "delete-banner" && state.banners.length > 1) { const item = find(state.banners); requestConfirmation({ title: "Excluir o slide " + (item ? item.name : "selecionado") + "?", description: "O destaque sera removido do carrossel da pagina inicial.", impact: "A imagem permanece na Central de midia e pode ser reutilizada.", confirmLabel: "Excluir slide" }, function () { state.banners = state.banners.filter(function (banner) { return banner.id !== id; }); saveDraft("Slide excluido", { action: "delete", resource: "banner", label: "Slide excluido", detail: item ? item.name : id }); renderPanel(); }); }
    if (action === "copy-media") {
      const item = find(state.mediaLibrary);
      if (item && navigator.clipboard) navigator.clipboard.writeText(item.url);
      toast("Endereco da imagem copiado");
    }
    if (action === "clear-media-filters") { crudState.media.search = ""; crudState.media.usage = "all"; crudState.media.sort = "recent"; crudState.media.page = 1; renderPanel(); }
    if (action === "download-media") {
      const item = find(state.mediaLibrary);
      if (item) { const link = document.createElement("a"); link.href = item.url; link.download = slugify(item.name) + "." + (item.type || "image/webp").split("/")[1].replace("jpeg", "jpg"); link.click(); }
    }
    if (action === "delete-media") {
      const item = find(state.mediaLibrary);
      const used = item && (state.banners.some(function (banner) { return banner.image === item.url || banner.mobileImage === item.url; }) || state.apps.some(function (app) { return app.logo === item.url; }) || state.popupCampaigns.some(function (campaign) { return campaign.image === item.url; }) || state.pages.some(function (page) { return page.blocks.some(function (block) { return block.url === item.url; }); }));
      if (used) toast("Esta imagem esta em uso. Troque-a no conteudo antes de remover.", "error");
      else if (item) requestConfirmation({ title: "Remover " + item.name + "?", description: "O arquivo sera excluido da biblioteca local.", impact: "Esta verificacao nao encontrou uso ativo da imagem no site.", confirmLabel: "Remover imagem" }, function () { state.mediaLibrary = state.mediaLibrary.filter(function (media) { return media.id !== id; }); saveDraft("Imagem removida", { action: "delete", resource: "media", label: "Imagem removida", detail: item.name }); renderPanel(); });
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
    if (action === "toggle-plan") { const item = find(state.plans); item.active = !item.active; saveDraft(item.active ? "Plano ativado" : "Plano pausado", { action: "update", resource: "plan", label: item.active ? "Plano ativado" : "Plano pausado", detail: item.speed + " - " + item.title }); renderPanel(); }
    if (action === "duplicate-plan") { const source = find(state.plans); const item = FL.clone(source); item.id = FL.uid("plan"); item.title += " - copia"; item.active = false; state.plans.push(item); saveDraft("Plano duplicado", { action: "create", resource: "plan", label: "Plano duplicado", detail: source.speed + " - " + source.title }); renderPanel(); }
    if (action === "delete-plan") { const item = find(state.plans); const leadCount = state.leads.filter(function (lead) { return lead.planId === id; }).length; requestConfirmation({ title: "Excluir " + (item ? item.speed + " - " + item.title : "este plano") + "?", description: "A oferta sera removida do site, das listagens e dos cupons associados.", impact: leadCount ? leadCount + " lead(s) historico(s) continuarao visiveis como plano removido." : "Nenhum lead historico depende desta oferta.", confirmLabel: "Excluir plano" }, function () { state.plans = state.plans.filter(function (plan) { return plan.id !== id; }); state.coupons.forEach(function (coupon) { coupon.planIds = coupon.planIds.filter(function (planId) { return planId !== id; }); }); crudState.plans.selected.delete(id); saveDraft("Plano excluido", { action: "delete", resource: "plan", label: "Plano excluido", detail: item ? item.speed + " - " + item.title : id }); renderPanel(); }); }
    if (action === "manage-categories") categoryModal();
    if (action === "clear-plans-filters") { crudState.plans.search = ""; crudState.plans.category = "all"; crudState.plans.status = "all"; crudState.plans.sort = "featured"; crudState.plans.page = 1; renderPanel(); }
    if (action === "add-app") appModal();
    if (action === "clear-apps-filters") { crudState.apps.search = ""; crudState.apps.category = "all"; crudState.apps.sort = "name"; crudState.apps.page = 1; renderPanel(); }
    if (action === "edit-app") appModal(find(state.apps));
    if (action === "delete-app") { const item = find(state.apps); requestConfirmation({ title: "Excluir " + (item ? item.name : "este aplicativo") + "?", description: "O aplicativo deixara de aparecer nos combos e na vitrine de beneficios.", impact: "A logo enviada permanece na Central de midia.", confirmLabel: "Excluir aplicativo" }, function () { state.apps = state.apps.filter(function (app) { return app.id !== id; }); saveDraft("Aplicativo excluido", { action: "delete", resource: "app", label: "Aplicativo excluido", detail: item ? item.name : id }); renderPanel(); }); }
    if (action === "add-benefit") simpleItemModal("benefit");
    if (action === "edit-benefit") simpleItemModal("benefit", find(state.benefits));
    if (action === "delete-benefit" && state.benefits.length > 1) { const item = find(state.benefits); requestConfirmation({ title: "Excluir o diferencial " + (item ? item.title : "selecionado") + "?", description: "O beneficio deixara de aparecer na pagina inicial.", impact: "Os textos dos planos nao serao alterados.", confirmLabel: "Excluir diferencial" }, function () { state.benefits = state.benefits.filter(function (benefit) { return benefit.id !== id; }); saveDraft("Diferencial excluido", { action: "delete", resource: "benefit", label: "Diferencial excluido", detail: item ? item.title : id }); renderPanel(); }); }
    if (action === "add-region") regionModal();
    if (action === "clear-region-filters") { crudState.regions.search = ""; crudState.regions.type = "all"; crudState.regions.status = "all"; crudState.regions.sort = "priority"; crudState.regions.page = 1; renderPanel(); }
    if (action === "edit-region") regionModal(find(state.regions));
    if (action === "toggle-region") { const item = find(state.regions); item.active = !item.active; saveDraft(item.active ? "Area publicada" : "Area ocultada", { action: "update", resource: "coverage", label: item.active ? "Area publicada" : "Area ocultada", detail: item.name }); renderPanel(); }
    if (action === "delete-region" && state.regions.length > 1) { const item = find(state.regions); requestConfirmation({ title: "Excluir a area " + (item ? item.name : "selecionada") + "?", description: "A regra deixara de participar das consultas de cobertura e do mapa.", impact: "Camadas importadas por KML/KMZ nao serao alteradas.", confirmLabel: "Excluir area" }, function () { state.regions = state.regions.filter(function (region) { return region.id !== id; }); saveDraft("Area removida", { action: "delete", resource: "coverage", label: "Area de cobertura excluida", detail: item ? item.name : id }); renderPanel(); }); }
    if (action === "open-region-route") { const item = find(state.regions); if (item) window.open(googleMapsUrl(item, true), "_blank", "noopener"); }
    if (action === "toggle-coverage-file") { const item = find(state.coverageFiles); if (item) { item.active = !item.active; saveDraft(); renderPanel(); } }
    if (action === "identify-coverage-file") identifyCoverageFile(id, false);
    if (action === "delete-coverage-file") { const item = find(state.coverageFiles); requestConfirmation({ title: "Remover a camada " + (item ? item.name : "selecionada") + "?", description: "Os poligonos, linhas e pontos desta importacao serao removidos do mapa.", impact: item ? item.features.length + " geometrias e " + item.coordinateCount + " coordenadas normalizadas serao descartadas." : "A camada sera removida.", confirmLabel: "Remover camada" }, function () { state.coverageFiles = state.coverageFiles.filter(function (file) { return file.id !== id; }); saveDraft("Camada removida", { action: "delete", resource: "coverage", label: "Camada de cobertura removida", detail: item ? item.fileName : id }); renderPanel(); }); }
    if (action === "edit-support") simpleItemModal("support", find(state.supportCards));
    if (action === "toggle-support") { const item = find(state.supportCards); item.active = !item.active; saveDraft(); renderPanel(); }
    if (action === "new-whatsapp-campaign") whatsappCampaignModal();
    if (action === "edit-whatsapp-campaign") whatsappCampaignModal(find(state.whatsappCampaigns));
    if (action === "delete-whatsapp-campaign") { const item = find(state.whatsappCampaigns); requestConfirmation({ title: "Excluir a campanha " + (item ? item.name : "selecionada") + "?", description: "A segmentacao e a mensagem serao removidas da fila comercial.", impact: "Leads e historico de contatos permanecem no funil.", confirmLabel: "Excluir campanha" }, function () { state.whatsappCampaigns = state.whatsappCampaigns.filter(function (campaign) { return campaign.id !== id; }); saveDraft("Campanha manual excluida", { action: "delete", resource: "whatsapp-campaign", label: "Campanha manual excluida", detail: item ? item.name : id }); renderPanel(); }); }
    if (action === "new-whatsapp-template") whatsappTemplateModal();
    if (action === "edit-whatsapp-template") whatsappTemplateModal(find(state.whatsappTemplates));
    if (action === "delete-whatsapp-template" && state.whatsappTemplates.length > 1) { const item = find(state.whatsappTemplates); const campaigns = state.whatsappCampaigns.filter(function (campaign) { return campaign.templateId === id; }).length; requestConfirmation({ title: "Excluir o template " + (item ? item.name : "selecionado") + "?", description: "A mensagem deixara de estar disponivel no compositor do WhatsApp.", impact: campaigns ? campaigns + " campanha(s) usam este template e passarao a manter somente a mensagem salva." : "Nenhuma campanha depende deste template.", confirmLabel: "Excluir template" }, function () { state.whatsappTemplates = state.whatsappTemplates.filter(function (template) { return template.id !== id; }); state.whatsappCampaigns.forEach(function (campaign) { if (campaign.templateId === id) campaign.templateId = ""; }); saveDraft("Template excluido", { action: "delete", resource: "whatsapp-template", label: "Template excluido", detail: item ? item.name : id }); renderPanel(); }); }
    if (action === "contact-lead") {
      const lead = find(state.leads); const campaign = element.dataset.campaignId && state.whatsappCampaigns.find(function (item) { return item.id === element.dataset.campaignId; });
      if (lead && lead.whatsapp) messageComposerModal(lead, campaign);
    }
    if (action === "clear-lead-filters") { crudState.leads.search = ""; crudState.leads.source = "all"; crudState.leads.sort = "recent"; renderPanel(); }
    if (action === "delete-lead") { const item = find(state.leads); requestConfirmation({ title: "Excluir o contato " + (item ? item.name : "selecionado") + "?", description: "O lead sera removido do funil e das segmentacoes de campanhas manuais.", impact: "Esta acao remove nome, WhatsApp e atribuicao armazenados nesta demonstracao.", confirmLabel: "Excluir contato" }, function () { state.leads = state.leads.filter(function (lead) { return lead.id !== id; }); saveRuntime("Lead excluido", { action: "delete", resource: "lead", label: "Lead excluido", detail: item ? item.name : id }); renderPanel(); }); }
    if (action === "export-leads") exportLeads();
    if (action === "new-coupon") couponModal();
    if (action === "clear-coupon-filters") { crudState.coupons.search = ""; crudState.coupons.status = "all"; crudState.coupons.sort = "recent"; crudState.coupons.page = 1; renderPanel(); }
    if (action === "edit-coupon") couponModal(find(state.coupons));
    if (action === "toggle-coupon") { const item = find(state.coupons); item.active = !item.active; saveDraft(item.active ? "Cupom ativado" : "Cupom pausado", { action: "update", resource: "coupon", label: item.active ? "Cupom ativado" : "Cupom pausado", detail: item.code }); renderPanel(); }
    if (action === "delete-coupon") { const item = find(state.coupons); const campaigns = state.popupCampaigns.filter(function (campaign) { return campaign.couponId === id; }).length; requestConfirmation({ title: "Excluir o cupom " + (item ? item.code : "selecionado") + "?", description: "O codigo deixara de ser aceito no site e sera removido dos leads futuros.", impact: campaigns ? campaigns + " campanha(s) serao mantidas sem cupom associado." : "Nenhuma campanha depende deste cupom.", confirmLabel: "Excluir cupom" }, function () { state.coupons = state.coupons.filter(function (coupon) { return coupon.id !== id; }); state.popupCampaigns.forEach(function (campaign) { if (campaign.couponId === id) campaign.couponId = ""; }); saveDraft("Cupom excluido", { action: "delete", resource: "coupon", label: "Cupom excluido", detail: item ? item.code : id }); renderPanel(); }); }
    if (action === "copy-code") { if (navigator.clipboard) navigator.clipboard.writeText(element.dataset.code); toast("Cupom copiado"); }
    if (action === "new-popup") popupModal();
    if (action === "clear-popup-filters") { crudState.popups.search = ""; crudState.popups.status = "all"; crudState.popups.sort = "recent"; crudState.popups.page = 1; renderPanel(); }
    if (action === "edit-popup") popupModal(find(state.popupCampaigns));
    if (action === "toggle-popup") { const item = find(state.popupCampaigns); item.active = !item.active; saveDraft(item.active ? "Campanha ativada" : "Campanha pausada", { action: "update", resource: "campaign", label: item.active ? "Campanha ativada" : "Campanha pausada", detail: item.name }); renderPanel(); }
    if (action === "delete-popup") { const item = find(state.popupCampaigns); requestConfirmation({ title: "Excluir a campanha " + (item ? item.name : "selecionada") + "?", description: "O popup deixara de existir e nao podera mais ser exibido no site.", impact: "O cupom associado sera preservado para uso por codigo ou em outra campanha.", confirmLabel: "Excluir campanha" }, function () { state.popupCampaigns = state.popupCampaigns.filter(function (campaign) { return campaign.id !== id; }); saveDraft("Campanha excluida", { action: "delete", resource: "campaign", label: "Campanha excluida", detail: item ? item.name : id }); renderPanel(); }); }
    if (action === "preview-popup") previewPopup(id);
    if (action === "new-page") pageModal();
    if (action === "clear-pages-filters") { crudState.pages.search = ""; crudState.pages.status = "all"; crudState.pages.sort = "updated"; crudState.pages.page = 1; renderPanel(); }
    if (action === "edit-page") { pageEditId = id; const page = currentPage(); selectedPageBlockId = page && page.blocks[0] ? page.blocks[0].id : null; renderPanel(); }
    if (action === "page-settings") pageModal(find(state.pages));
    if (action === "open-page") { const page = find(state.pages); if (page) window.open("./pagina.html?slug=" + encodeURIComponent(page.slug), "_blank", "noopener"); }
    if (action === "back-pages") { pageEditId = null; selectedPageBlockId = null; renderPanel(); }
    if (action === "duplicate-page") {
      const source = FL.clone(find(state.pages));
      source.id = FL.uid("page"); source.title += " - copia"; source.slug += "-copia"; source.status = "draft"; source.updatedAt = new Date().toISOString().slice(0, 10);
      source.blocks.forEach(function (block) { block.id = FL.uid("block"); });
      state.pages.push(source); saveDraft("Pagina duplicada", { action: "create", resource: "page", label: "Pagina duplicada", detail: source.title }); renderPanel();
    }
    if (action === "delete-page") { const item = find(state.pages); const links = state.supportCards.filter(function (card) { return item && String(card.url || "").includes(item.slug); }).length; requestConfirmation({ title: "Excluir a pagina " + (item ? item.title : "selecionada") + "?", description: "A pagina e todos os seus blocos serao removidos do site.", impact: links ? links + " atalho(s) de atendimento podem apontar para esta pagina." : "Nenhum atalho conhecido aponta para esta pagina.", confirmLabel: "Excluir pagina" }, function () { state.pages = state.pages.filter(function (page) { return page.id !== id; }); saveDraft("Pagina excluida", { action: "delete", resource: "page", label: "Pagina excluida", detail: item ? item.title : id }); renderPanel(); }); }
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
    if (action === "delete-page-block") { const page = currentPage(); const block = page && page.blocks.find(function (item) { return item.id === selectedPageBlockId; }); if (page && block && page.blocks.length > 1) requestConfirmation({ title: "Excluir o bloco " + (block.title || "selecionado") + "?", description: "O conteudo deste bloco sera removido da pagina " + page.title + ".", impact: "Os outros blocos e as configuracoes da pagina serao preservados.", confirmLabel: "Excluir bloco" }, function () { page.blocks = page.blocks.filter(function (item) { return item.id !== selectedPageBlockId; }); selectedPageBlockId = page.blocks[0].id; saveDraft("Bloco excluido", { action: "delete", resource: "page-block", label: "Bloco de pagina excluido", detail: block.title || block.type }); renderPanel(); }); }
    if (action === "export-report") exportCsv();
    if (action === "export-audit") exportAudit();
    if (action === "export-state") exportState();
    if (action === "reset-state") requestConfirmation({ title: "Restaurar todos os dados?", description: "Planos, paginas, identidade, campanhas, leads e configuracoes locais voltarao ao estado inicial.", impact: "Esta acao nao pode ser desfeita. Exporte a configuracao antes de continuar.", confirmLabel: "Restaurar padrao" }, function () { state = FL.resetState(); writeAudit("delete", "system", "Configuracao restaurada", "Todos os dados locais voltaram ao padrao"); state = FL.saveState(state, false); Object.keys(crudState).forEach(function (key) { crudState[key].selected.clear(); crudState[key].page = 1; }); toast("Configuracao restaurada"); renderPanel(); });
  }

  function renderCrudAndFocus(key) {
    renderPanel();
    requestAnimationFrame(function () {
      const input = $('[data-crud-search="' + key + '"]', $("#admin-panel"));
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    });
  }

  function performBulkAction(key, action) {
    const view = crudState[key];
    if (!view || !view.selected.size) return;
    const ids = Array.from(view.selected);
    if (key === "pages" && (action === "publish" || action === "draft")) {
      state.pages.forEach(function (page) { if (view.selected.has(page.id)) { page.status = action === "publish" ? "published" : "draft"; page.updatedAt = new Date().toISOString().slice(0, 10); } });
      view.selected.clear();
      saveDraft(ids.length + (ids.length === 1 ? " pagina atualizada" : " paginas atualizadas"), { action: "bulk", resource: "page", label: action === "publish" ? "Paginas publicadas" : "Paginas movidas para rascunho", detail: ids.length + " item(ns) alterados em massa" });
      renderPanel(); return;
    }
    if (key === "pages" && action === "delete") {
      const linked = state.supportCards.filter(function (card) { return state.pages.some(function (page) { return view.selected.has(page.id) && String(card.url || "").includes(page.slug); }); }).length;
      requestConfirmation({ title: "Excluir " + ids.length + (ids.length === 1 ? " pagina?" : " paginas?"), description: "As paginas e todos os blocos selecionados serao removidos.", impact: linked ? linked + " atalho(s) de atendimento podem apontar para estas paginas." : "Nenhum atalho conhecido aponta para estas paginas.", confirmLabel: "Excluir selecionadas" }, function () { state.pages = state.pages.filter(function (page) { return !view.selected.has(page.id); }); view.selected.clear(); saveDraft("Paginas excluidas", { action: "delete", resource: "page", label: "Paginas excluidas em massa", detail: ids.length + " pagina(s) removidas" }); renderPanel(); });
      return;
    }
    if (key !== "plans") return;
    if (action === "activate" || action === "deactivate") {
      state.plans.forEach(function (plan) { if (view.selected.has(plan.id)) plan.active = action === "activate"; });
      view.selected.clear();
      saveDraft(ids.length + (ids.length === 1 ? " plano atualizado" : " planos atualizados"), { action: "bulk", resource: "plan", label: action === "activate" ? "Planos ativados" : "Planos pausados", detail: ids.length + " item(ns) alterados em massa" });
      renderPanel();
    }
    if (action === "delete") {
      const linkedLeads = state.leads.filter(function (lead) { return view.selected.has(lead.planId); }).length;
      requestConfirmation({ title: "Excluir " + ids.length + (ids.length === 1 ? " plano?" : " planos?"), description: "Esta acao remove as ofertas selecionadas do site e do painel.", impact: linkedLeads ? linkedLeads + " lead(s) historico(s) continuarao registrados como plano removido." : "Os cupons manterao suas configuracoes, mas deixarao de encontrar estes planos.", confirmLabel: "Excluir selecionados" }, function () {
        state.plans = state.plans.filter(function (plan) { return !view.selected.has(plan.id); });
        state.coupons.forEach(function (coupon) { coupon.planIds = coupon.planIds.filter(function (planId) { return !view.selected.has(planId); }); });
        view.selected.clear();
        saveDraft("Planos excluidos", { action: "delete", resource: "plan", label: "Planos excluidos em massa", detail: ids.length + " oferta(s) removidas" });
        renderPanel();
      });
    }
  }

  function bindCrudControls() {
    $$('[data-crud-search]', $("#admin-panel")).forEach(function (input) {
      input.addEventListener("input", function () {
        const key = input.dataset.crudSearch; const view = crudState[key];
        if (!view) return;
        view.search = input.value; view.page = 1;
        clearTimeout(crudSearchTimer);
        crudSearchTimer = setTimeout(function () { renderCrudAndFocus(key); }, 180);
      });
    });
    $$('[data-crud-filter]', $("#admin-panel")).forEach(function (select) {
      select.addEventListener("change", function () { const view = crudState[select.dataset.crudFilter]; if (view) { view[select.dataset.filterName] = select.value; view.page = 1; renderPanel(); } });
    });
    $$('[data-crud-sort]', $("#admin-panel")).forEach(function (select) {
      select.addEventListener("change", function () { const view = crudState[select.dataset.crudSort]; if (view) { view.sort = select.value; view.page = 1; renderPanel(); } });
    });
    $$('[data-crud-page]', $("#admin-panel")).forEach(function (button) {
      button.addEventListener("click", function () { const view = crudState[button.dataset.crudPage]; if (view && !button.disabled) { view.page = Number(button.dataset.page); renderPanel(); window.scrollTo({ top: 0, behavior: "smooth" }); } });
    });
    $$('[data-crud-select]', $("#admin-panel")).forEach(function (checkbox) {
      checkbox.addEventListener("change", function () { const view = crudState[checkbox.dataset.crudSelect]; if (!view) return; if (checkbox.checked) view.selected.add(checkbox.dataset.id); else view.selected.delete(checkbox.dataset.id); renderPanel(); });
    });
    $$('[data-crud-select-page]', $("#admin-panel")).forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        const key = checkbox.dataset.crudSelectPage; const view = crudState[key];
        if (!view || key !== "plans") return;
        const result = collectPlans(view);
        result.items.forEach(function (item) { if (checkbox.checked) view.selected.add(item.id); else view.selected.delete(item.id); });
        renderPanel();
      });
    });
    $$('[data-bulk-clear]', $("#admin-panel")).forEach(function (button) { button.addEventListener("click", function () { const view = crudState[button.dataset.bulkClear]; if (view) { view.selected.clear(); renderPanel(); } }); });
    $$('[data-bulk-action]', $("#admin-panel")).forEach(function (button) { button.addEventListener("click", function () { performBulkAction(button.dataset.bulkKey, button.dataset.bulkAction); }); });
  }

  function bindPanelControls() {
    bindCrudControls();
    $$('[data-analytics-period]', $("#admin-panel")).forEach(function (select) { select.addEventListener("change", function () { analyticsPeriod = Number(select.value || 28); renderPanel(); }); });
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
    $$("[data-banner-field]", $("#admin-panel")).forEach(function (element) {
      let captured = false;
      const eventName = element.type === "checkbox" || element.tagName === "SELECT" ? "change" : "input";
      element.addEventListener("focus", function () { if (!captured) { recordBuilderHistory(); captured = true; } });
      element.addEventListener(eventName, function () {
        const banner = state.banners.find(function (item) { return item.id === selectedBannerId; });
        if (!banner) return;
        banner[element.dataset.bannerField] = element.type === "checkbox" ? element.checked : element.type === "range" ? Number(element.value) : element.value;
        saveDraft(); scheduleBuilderPreview();
        if (element.type === "range") { const value = element.closest("label").querySelector("b"); if (value) value.textContent = element.value + "%"; }
      });
    });
    const builderBannerUpload = $("#builder-banner-upload");
    if (builderBannerUpload) builderBannerUpload.addEventListener("change", async function () {
      const file = builderBannerUpload.files[0]; const banner = state.banners.find(function (item) { return item.id === selectedBannerId; });
      if (!file || !banner) return;
      try { const optimized = await optimizeImage(file); banner.image = storeOptimizedMedia(optimized, file, "Banner"); banner.mobileImage = banner.image; saveDraft("Imagem do banner otimizada"); renderPanel(); }
      catch (error) { toast(error.message, "error"); }
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
    const coverageFileInput = $("#coverage-file-input");
    if (coverageFileInput) coverageFileInput.addEventListener("change", function () { importCoverageFile(coverageFileInput.files[0]); });
    $$("[data-coverage-file-color]", $("#admin-panel")).forEach(function (element) { element.addEventListener("change", function () { const file = state.coverageFiles.find(function (item) { return item.id === element.dataset.coverageFileColor; }); if (file) { file.color = element.value; saveDraft(); renderPanel(); } }); });
    $$("[data-campaign-tab]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { activeCampaignTab = element.dataset.campaignTab; renderPanel(); }); });
    $$("[data-lead-tab]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { leadWorkspaceTab = element.dataset.leadTab; renderPanel(); }); });
    $$("[data-whatsapp-tab]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { whatsappWorkspaceTab = element.dataset.whatsappTab; renderPanel(); }); });
    $$("[data-coverage-tab]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { coverageWorkspaceTab = element.dataset.coverageTab; renderPanel(); }); });
    $$("[data-seo-tab]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { seoWorkspaceTab = element.dataset.seoTab; renderPanel(); }); });
    $$("[data-integration-tab]", $("#admin-panel")).forEach(function (element) { element.addEventListener("click", function () { integrationWorkspaceTab = element.dataset.integrationTab; renderPanel(); }); });
    $$("[data-lead-status]", $("#admin-panel")).forEach(function (element) { element.addEventListener("change", function () { const lead = state.leads.find(function (item) { return item.id === element.dataset.leadStatus; }); if (lead) { lead.status = element.value; saveRuntime("Status do lead atualizado"); renderPanel(); } }); });
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
    const rows = [["data", "nome", "whatsapp", "plano", "cupom", "origem", "detalhe_origem", "utm_source", "utm_medium", "utm_campaign", "regiao", "status", "consentimento"]].concat(state.leads.map(function (lead) {
      const plan = leadPlan(lead); const coupon = state.coupons.find(function (item) { return item.id === lead.couponId; });
      return [lead.createdAt, lead.name, lead.whatsapp, plan ? plan.speed + " - " + plan.title : "", coupon ? coupon.code : "", lead.source || "", lead.sourceDetail || "", lead.utmSource || "", lead.utmMedium || "", lead.utmCampaign || "", lead.region || "", lead.status, lead.consentAt || ""];
    }));
    const csv = rows.map(function (row) { return row.map(function (value) { return '"' + String(value || "").replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    writeAudit("export", "lead", "Leads exportados", state.leads.length + " registros incluidos no CSV");
    state = FL.saveRuntimeState(state);
    downloadBlob(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), "fibra-lider-leads.csv");
  }

  function exportAudit() {
    const rows = [["data", "acao", "recurso", "evento", "detalhe", "responsavel"]].concat(state.auditLog.map(function (entry) {
      return [entry.createdAt, auditLabel(entry.action), entry.resource, entry.label, entry.detail, entry.actor];
    }));
    const csv = rows.map(function (row) { return row.map(function (value) { return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    writeAudit("export", "audit", "Atividade exportada", state.auditLog.length + " eventos incluidos no CSV");
    state = FL.saveRuntimeState(state);
    downloadBlob(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), "atividade-" + state.brand.slug + ".csv");
    toast("Historico exportado", "success");
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
    if (file.size > 2 * 1024 * 1024) { toast("A configuracao deve ter no maximo 2 MB", "error"); event.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !parsed.brand || !Array.isArray(parsed.plans) || !Array.isArray(parsed.pageBlocks)) throw new Error("Estrutura invalida");
        const limits = { plans: 500, categories: 100, pages: 200, pageBlocks: 200, banners: 100, regions: 500, coverageFiles: 20, leads: 5000, coupons: 500, popupCampaigns: 200, mediaLibrary: 500 };
        Object.keys(limits).forEach(function (key) { if (parsed[key] && (!Array.isArray(parsed[key]) || parsed[key].length > limits[key])) throw new Error("Limite excedido em " + key); });
        const allowed = Object.keys(FL.defaultState);
        const sanitized = {};
        allowed.forEach(function (key) { if (Object.prototype.hasOwnProperty.call(parsed, key)) sanitized[key] = parsed[key]; });
        FL.recordAudit(sanitized, "import", "system", "Configuracao importada", file.name.slice(0, 120));
        FL.saveState(sanitized, false);
        state = FL.getState();
        toast("Configuracao importada", "success"); renderPanel();
      } catch (error) { toast("Arquivo de configuracao invalido: " + (error.message || "verifique o conteudo"), "error"); }
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function applyAdminTheme() {
    const mode = localStorage.getItem("fl-admin-theme") || "light";
    document.documentElement.dataset.adminTheme = mode;
    $("#admin-theme-toggle").innerHTML = icon(mode === "dark" ? "sun" : "moon");
    refreshIcons();
  }

  function hydrateTenantChrome() {
    const initials = state.brand.name.split(/\s+/).map(function (part) { return part.charAt(0); }).join("").slice(0, 2).toUpperCase();
    const workspaceName = $(".workspace-switch strong"); if (workspaceName) workspaceName.textContent = state.brand.name;
    $$(".workspace-avatar").forEach(function (avatar) { avatar.textContent = initials; });
    const topbarPath = $(".topbar-title small"); if (topbarPath) topbarPath.innerHTML = esc(state.brand.name) + ' / <span id="topbar-section">' + esc(PANEL_META[activePanel] ? PANEL_META[activePanel][1] : "Visao geral") + '</span>';
    const accountAvatar = $(".admin-user > span"); if (accountAvatar) accountAvatar.textContent = initials;
    const accountTenant = $(".admin-user small"); if (accountTenant) accountTenant.textContent = state.brand.name;
    const accountMenuTenant = $(".admin-account-menu small"); if (accountMenuTenant) accountMenuTenant.textContent = state.brand.name;
    const loginCopy = $(".login-form > p"); if (loginCopy) loginCopy.textContent = "Entre para gerenciar a experiencia digital da " + state.brand.name + ".";
    $$(".admin-login img").forEach(function (image) { image.src = FL.safeImageUrl(image.closest(".login-form") ? state.brand.logoDark : state.brand.logo, "./assets/img/fibra-lider-logo.png"); image.alt = state.brand.name; });
    const sidebarLogo = $(".admin-brand img"); if (sidebarLogo) sidebarLogo.src = FL.safeImageUrl(state.brand.icon || state.brand.logo, "./assets/img/fibra-lider-icon.png");
  }

  async function showApp() {
    $("#admin-login").hidden = true;
    $("#admin-app").hidden = false;
    state = FL.getState();
    state = await FL.loadBundledCoverage(state);
    hydrateTenantChrome();
    FL.seedEventsIfEmpty();
    activePanel = location.hash.replace("#", "") || "dashboard";
    const returnTarget = new URLSearchParams(location.search).get("return");
    const studioAliases = { banners: "slides", navigation: "header", appearance: "brand" };
    if (studioAliases[activePanel]) { builderStudioTab = studioAliases[activePanel]; activePanel = "builder"; }
    if (returnTarget === "studio" || activePanel === "builder") { location.replace("./studio.html"); return; }
    if (activePanel === "support") activePanel = "leads";
    if (activePanel === "analytics" || activePanel === "heatmap") activePanel = "dashboard";
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
    $("#admin-nav").addEventListener("click", function (event) {
      const groupToggle = event.target.closest("[data-nav-group-toggle]");
      if (groupToggle) {
        const group = groupToggle.closest("[data-nav-group]");
        const collapsed = group.classList.toggle("is-collapsed");
        groupToggle.setAttribute("aria-expanded", String(!collapsed));
        const stored = navGroupPreferences();
        stored[groupToggle.dataset.navGroupToggle] = collapsed;
        localStorage.setItem("fl-admin-nav-groups", JSON.stringify(stored));
        return;
      }
      const studioButton = event.target.closest("[data-open-studio]");
      if (studioButton) { openThemeStudio(); return; }
      const button = event.target.closest("[data-panel]"); if (button) setPanel(button.dataset.panel);
    });
    $("#sidebar-toggle").addEventListener("click", function () { document.body.classList.toggle("sidebar-open"); });
    $("#admin-user-button").addEventListener("click", function () { const menu = $("#admin-account-menu"); const open = menu.hidden; menu.hidden = !open; $("#admin-user-button").setAttribute("aria-expanded", String(open)); });
    $$('[data-account-panel]').forEach(function (button) { button.addEventListener("click", function () { $("#admin-account-menu").hidden = true; $("#admin-user-button").setAttribute("aria-expanded", "false"); setPanel(button.dataset.accountPanel); }); });
    $("#account-logout").addEventListener("click", function () { sessionStorage.removeItem(FL.SESSION_KEY); location.reload(); });
    $("#publish-button").addEventListener("click", publish);
    $("#logout-button").addEventListener("click", function () { sessionStorage.removeItem(FL.SESSION_KEY); location.reload(); });
    $("#admin-theme-toggle").addEventListener("click", function () { const next = document.documentElement.dataset.adminTheme === "dark" ? "light" : "dark"; localStorage.setItem("fl-admin-theme", next); applyAdminTheme(); if (adminMap) setTimeout(function () { adminMap.invalidateSize(); }, 80); });
    $$("[data-admin-modal-close]").forEach(function (element) { element.addEventListener("click", closeModal); });
    document.addEventListener("keydown", function (event) {
      const modal = $("#admin-modal");
      if (!modal.hidden) {
        if (event.key === "Escape") { event.preventDefault(); closeModal(); return; }
        if (event.key === "Tab") {
          const focusable = $$('button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', modal).filter(function (element) { return element.offsetParent !== null; });
          if (!focusable.length) return;
          const first = focusable[0]; const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
        return;
      }
      if (event.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        const search = $("[data-crud-search]", $("#admin-panel"));
        if (search) { event.preventDefault(); search.focus(); }
      }
    });
    document.addEventListener("click", function (event) { const account = event.target.closest(".admin-account"); if (!account) { const menu = $("#admin-account-menu"); if (menu && !menu.hidden) { menu.hidden = true; $("#admin-user-button").setAttribute("aria-expanded", "false"); } } });
    window.addEventListener("message", function (event) {
      if (event.origin !== location.origin || !event.data || event.data.type !== "fl-builder-select") return;
      if (!state.pageBlocks.some(function (block) { return block.id === event.data.sectionId; })) return;
      openThemeStudio();
    });
  }

  async function init() {
    state = FL.getState();
    state = await FL.loadBundledCoverage(state);
    const navGroups = navGroupPreferences();
    Object.keys(navGroups).forEach(function (key) { const group = $('[data-nav-group="' + key + '"]'); const toggle = $('[data-nav-group-toggle="' + key + '"]'); if (group && toggle && navGroups[key]) { group.classList.add("is-collapsed"); toggle.setAttribute("aria-expanded", "false"); } });
    hydrateTenantChrome();
    bindGlobalEvents();
    refreshIcons();
    if (sessionStorage.getItem(FL.SESSION_KEY) === "active") showApp();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

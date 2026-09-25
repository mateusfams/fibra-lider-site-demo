(function () {
  "use strict";

  const TB = window.FLThemeBuilder;
  if (!TB) throw new Error("Theme Builder Core precisa ser carregado antes do editor.");

  const CATEGORY_LABELS = {
    layout: "Layout", content: "Conteudo", marketing: "Marketing", commerce: "Comercio",
    navigation: "Navegacao", forms: "Formularios", domain: "Provedor",
  };
  const BREAKPOINTS = { desktop: "base", tablet: "md", mobile: "sm" };
  const DEVICES = { desktop: { label: "Desktop", icon: "monitor" }, tablet: { label: "Tablet", icon: "tablet" }, mobile: { label: "Mobile", icon: "smartphone" } };
  const INSPECTOR_TABS = [
    ["content", "Conteudo"], ["layout", "Layout"], ["style", "Estilo"], ["typography", "Tipo"],
    ["responsive", "Responsivo"], ["effects", "Efeitos"], ["advanced", "Avancado"],
  ];
  const BINDING_OPTIONS = [
    ["", "Sem vinculo"], ["brand.name", "Marca / nome"], ["brand.phone", "Marca / telefone"],
    ["brand.email", "Marca / e-mail"], ["brand.address", "Marca / endereco"],
    ["brand.coverageSummary", "Marca / resumo da cobertura"], ["footer.description", "Rodape / descricao"],
  ];
  const STYLE_GROUPS = {
    layout: ["display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "gridColumns", "gap", "rowGap", "columnGap", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "marginTop", "marginRight", "marginBottom", "marginLeft", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"],
    style: ["backgroundColor", "backgroundImage", "backgroundPosition", "backgroundSize", "backgroundRepeat", "borderWidth", "borderStyle", "borderColor", "borderRadius", "gradientStart", "gradientEnd", "gradientAngle"],
    typography: ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "textAlign", "color"],
    effects: ["opacity", "overflow", "position", "top", "right", "bottom", "left", "zIndex", "shadowColor", "shadowX", "shadowY", "shadowBlur", "shadowSpread", "transitionProperty", "transitionDuration", "transform"],
  };
  const STYLE_LABELS = {
    display: "Exibicao", flexDirection: "Direcao", flexWrap: "Quebra", justifyContent: "Distribuicao", alignItems: "Alinhamento", gridColumns: "Colunas da grade",
    gap: "Espaco", rowGap: "Espaco vertical", columnGap: "Espaco horizontal", width: "Largura", minWidth: "Largura minima", maxWidth: "Largura maxima", height: "Altura", minHeight: "Altura minima", maxHeight: "Altura maxima",
    marginTop: "Margem superior", marginRight: "Margem direita", marginBottom: "Margem inferior", marginLeft: "Margem esquerda", paddingTop: "Padding superior", paddingRight: "Padding direito", paddingBottom: "Padding inferior", paddingLeft: "Padding esquerdo",
    backgroundColor: "Cor de fundo", backgroundImage: "Imagem de fundo", backgroundPosition: "Posicao do fundo", backgroundSize: "Tamanho do fundo", backgroundRepeat: "Repeticao", borderWidth: "Largura da borda", borderStyle: "Estilo da borda", borderColor: "Cor da borda", borderRadius: "Raio", gradientStart: "Inicio do gradiente", gradientEnd: "Fim do gradiente", gradientAngle: "Angulo",
    fontFamily: "Fonte", fontSize: "Tamanho", fontWeight: "Peso", lineHeight: "Altura da linha", letterSpacing: "Espacamento", textTransform: "Transformacao", textAlign: "Alinhamento", color: "Cor do texto",
    opacity: "Opacidade", overflow: "Overflow", position: "Posicao", top: "Topo", right: "Direita", bottom: "Base", left: "Esquerda", zIndex: "Camada Z", objectFit: "Ajuste da imagem", objectPosition: "Posicao da imagem", shadowColor: "Cor da sombra", shadowX: "Sombra X", shadowY: "Sombra Y", shadowBlur: "Desfoque", shadowSpread: "Expansao", transitionProperty: "Transicao", transitionDuration: "Duracao", transform: "Transformacao visual",
  };
  const EXTRA_STYLE_FIELDS = {
    gradientStart: { type: "color" }, gradientEnd: { type: "color" }, gradientAngle: { type: "integer" },
    shadowColor: { type: "color" }, shadowX: { type: "length" }, shadowY: { type: "length" }, shadowBlur: { type: "length" }, shadowSpread: { type: "length" },
  };
  const STYLE_OPTION_LABELS = {
    block: "Bloco", flex: "Flexivel", grid: "Grade", "inline-flex": "Flexivel em linha", none: "Oculto",
    row: "Horizontal", column: "Vertical", "row-reverse": "Horizontal invertido", "column-reverse": "Vertical invertido",
    nowrap: "Sem quebra", wrap: "Com quebra", stretch: "Esticar", "flex-start": "Inicio", center: "Centro", "flex-end": "Fim",
    "space-between": "Entre itens", "space-around": "Ao redor", baseline: "Linha de base", left: "Esquerda", right: "Direita", justify: "Justificado",
    uppercase: "Maiusculas", lowercase: "Minusculas", capitalize: "Iniciais maiusculas", cover: "Preencher", contain: "Conter", auto: "Automatico",
    "no-repeat": "Nao repetir", repeat: "Repetir", "repeat-x": "Repetir horizontal", "repeat-y": "Repetir vertical",
    solid: "Solida", dashed: "Tracejada", dotted: "Pontilhada", visible: "Visivel", hidden: "Oculto", scroll: "Rolagem", clip: "Recortar",
    static: "Normal", relative: "Relativa", absolute: "Absoluta", sticky: "Fixa ao rolar", color: "Cor", "background-color": "Cor de fundo",
    transform: "Transformacao", opacity: "Opacidade", "box-shadow": "Sombra", fill: "Esticar", scaleDown: "Reduzir",
  };
  const SEGMENTED_STYLES = {
    textAlign: [["left", "align-left", "Esquerda"], ["center", "align-center", "Centro"], ["right", "align-right", "Direita"], ["justify", "align-justify", "Justificado"]],
    justifyContent: [["flex-start", "align-start-vertical", "Inicio"], ["center", "align-center-vertical", "Centro"], ["flex-end", "align-end-vertical", "Fim"], ["space-between", "align-justify", "Distribuir"]],
    alignItems: [["flex-start", "align-start-horizontal", "Inicio"], ["center", "align-center-horizontal", "Centro"], ["flex-end", "align-end-horizontal", "Fim"], ["stretch", "unfold-horizontal", "Esticar"]],
  };

  const runtime = {
    tenant: "", state: null, envelope: null, workspace: null, document: null, root: null, options: {},
    selectedId: "", leftTab: "components", inspectorTab: "content", librarySearch: "", device: "desktop", visualState: "normal",
    zoom: 86, expanded: new Set(), histories: new Map(), clipboard: null, styleClipboard: null, session: "", autosave: null,
    abort: null, previewReady: false, previewTimer: null, saveStatus: "saved", dialog: "", diagnostics: null,
    mobilePanel: "canvas", draggingComponent: "", previewDrop: null,
  };

  function esc(value) { return TB.escapeHtml(value); }
  function icon(name) { return '<i data-lucide="' + esc(name) + '"></i>'; }
  function activeDocument() { return runtime.workspace && runtime.workspace.documents[runtime.workspace.activeDocumentId]; }
  function initialSelection(documentValue) {
    const root = documentValue.nodes[documentValue.rootId];
    return (TB.childIds(root).find(function (id) { const node = documentValue.nodes[id]; return node && !node.type.startsWith("navigation."); })) || documentValue.rootId;
  }
  function selectedNode() { return runtime.document && runtime.document.nodes[runtime.selectedId]; }
  function definitionFor(node) { return node ? TB.registry.get(node.type) : null; }
  function can(action) { return TB.can(runtime.options.role || "administrator", action); }
  function historyFor(documentId) {
    if (!runtime.histories.has(documentId)) runtime.histories.set(documentId, new TB.CommandHistory(120));
    return runtime.histories.get(documentId);
  }

  function ensure(state) {
    const tenant = TB.slug(state && state.brand && state.brand.slug || "default");
    if (runtime.workspace && runtime.tenant === tenant) { runtime.state = state; return; }
    runtime.tenant = tenant;
    runtime.state = state;
    runtime.envelope = TB.storage.loadWorkspace(state);
    runtime.workspace = runtime.envelope.workspace;
    runtime.document = activeDocument();
    runtime.selectedId = initialSelection(runtime.document);
    runtime.expanded = new Set([runtime.document.rootId]);
    runtime.histories = new Map();
    runtime.session = "vbs_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    setupAutosave();
  }

  function setupAutosave() {
    if (runtime.autosave) runtime.autosave.destroy();
    runtime.autosave = new TB.Autosave(function (workspace) {
      const result = TB.storage.saveWorkspace(runtime.state, workspace, runtime.envelope.revision);
      runtime.envelope = result;
      runtime.workspace = result.workspace;
      runtime.document = activeDocument();
      return result;
    }, 800);
    runtime.autosave.onStatus(function (status) {
      runtime.saveStatus = status;
      updateStatus();
    });
  }

  function currentBreakpoint() { return BREAKPOINTS[runtime.device] || "base"; }
  function currentStyle(node) {
    const breakpoint = currentBreakpoint();
    return node && node.styles && node.styles[breakpoint] && node.styles[breakpoint][runtime.visualState] || {};
  }

  function render(state) {
    ensure(state);
    return '<section class="vb-studio" id="visual-theme-builder" data-vb-mobile-panel="' + esc(runtime.mobilePanel) + '">' + toolbarMarkup() + mobileWorkspaceMarkup() + '<div class="vb-studio__workspace">' + leftPanelMarkup() + canvasMarkup() + inspectorMarkup() + '</div>' + statusMarkup() + dialogMarkup() + '</section>';
  }

  function mobileWorkspaceMarkup() {
    const panels = [["components", "blocks", "Adicionar"], ["canvas", "monitor", "Visualizar"], ["inspector", "sliders-horizontal", "Editar"]];
    return '<nav class="vb-mobile-workspace" data-vb-mobile-workspace aria-label="Area do editor">' + panels.map(function (panel) { return '<button type="button" class="' + (runtime.mobilePanel === panel[0] ? "is-active" : "") + '" data-vb-mobile-panel="' + panel[0] + '">' + icon(panel[1]) + '<span>' + panel[2] + '</span></button>'; }).join("") + '</nav>';
  }

  function toolbarMarkup() {
    const history = historyFor(runtime.document.documentId);
    const documents = Object.values(runtime.workspace.documents);
    return '<header class="vb-studio__toolbar"><div class="vb-studio__document"><span class="vb-studio__mark">' + icon("panels-top-left") + '</span><label><span>Pagina</span><select data-vb-page-select>' + documents.map(function (documentValue) { return '<option value="' + esc(documentValue.documentId) + '"' + (documentValue.documentId === runtime.document.documentId ? " selected" : "") + '>' + esc(documentValue.name) + '</option>'; }).join("") + '</select></label><button type="button" data-vb-action="new-page" title="Nova pagina">' + icon("plus") + '</button><button type="button" data-vb-action="sync-home" title="Restaurar a Home base"' + (runtime.document.settings.slug === "/" ? "" : " disabled") + '>' + icon("wand-sparkles") + '</button></div><div class="vb-studio__history"><button type="button" data-vb-action="undo" title="Desfazer (Ctrl+Z)"' + (history.canUndo() ? "" : " disabled") + '>' + icon("undo-2") + '</button><button type="button" data-vb-action="redo" title="Refazer (Ctrl+Shift+Z)"' + (history.canRedo() ? "" : " disabled") + '>' + icon("redo-2") + '</button><button type="button" data-vb-action="copy" title="Copiar">' + icon("copy") + '</button><button type="button" data-vb-action="paste" title="Colar"' + (runtime.clipboard ? "" : " disabled") + '>' + icon("clipboard-paste") + '</button></div><div class="vb-device-switch" role="group" aria-label="Dispositivo">' + Object.keys(DEVICES).map(function (key) { return '<button type="button" class="' + (runtime.device === key ? "is-active" : "") + '" data-vb-device="' + key + '" title="' + DEVICES[key].label + '">' + icon(DEVICES[key].icon) + '<span>' + DEVICES[key].label + '</span></button>'; }).join("") + '</div><div class="vb-studio__zoom"><button type="button" data-vb-action="zoom-out" title="Reduzir">' + icon("minus") + '</button><output>' + runtime.zoom + '%</output><button type="button" data-vb-action="zoom-in" title="Ampliar">' + icon("plus") + '</button></div><div class="vb-studio__publish"><button type="button" class="vb-toolbar-button" data-vb-action="validate">' + icon("shield-check") + '<span>Validar</span></button><button type="button" class="vb-toolbar-button" data-vb-action="preview">' + icon("play") + '<span>Visualizar</span></button><button type="button" class="vb-toolbar-button vb-toolbar-button--primary" data-vb-action="publish">' + icon("rocket") + '<span>Publicar</span></button></div></header>';
  }

  function leftPanelMarkup() {
    const tabs = [["components", "blocks", "Blocos"], ["layers", "layers-3", "Camadas"], ["templates", "layout-template", "Modelos"], ["pages", "files", "Paginas"], ["saved", "library", "Salvos"], ["globals", "swatch-book", "Tema"]];
    return '<aside class="vb-studio__left"><nav class="vb-side-tabs" aria-label="Ferramentas">' + tabs.map(function (tab) { return '<button type="button" class="' + (runtime.leftTab === tab[0] ? "is-active" : "") + '" data-vb-left-tab="' + tab[0] + '" title="' + tab[2] + '">' + icon(tab[1]) + '<span>' + tab[2] + '</span></button>'; }).join("") + '</nav><div class="vb-side-panel" data-vb-left-content>' + leftContentMarkup() + '</div></aside>';
  }

  function leftContentMarkup() {
    if (runtime.leftTab === "layers") return layersMarkup();
    if (runtime.leftTab === "templates") return templatesMarkup();
    if (runtime.leftTab === "pages") return pagesMarkup();
    if (runtime.leftTab === "saved") return savedMarkup();
    if (runtime.leftTab === "globals") return globalsMarkup();
    return libraryMarkup();
  }

  function libraryMarkup() {
    const definitions = TB.registry.list({ search: runtime.librarySearch }).filter(function (definition) { return !(definition.requiredModule && runtime.state.modules && runtime.state.modules[definition.requiredModule] === false); });
    const categories = Array.from(new Set(definitions.map(function (definition) { return definition.category; })));
    const selected = selectedNode();
    const quickTypes = ["layout.section", "layout.row", "marketing.banner", "marketing.slider", "commerce.plan-grid", "domain.coverage"];
    const quick = quickTypes.map(function (type) { const definition = TB.registry.get(type); const placement = definition && placementFor(type); return definition && placement ? '<button type="button" draggable="true" data-vb-component="' + esc(type) + '">' + icon(definition.icon) + '<span>' + esc(definition.label) + '</span></button>' : ""; }).join("");
    return '<div class="vb-panel-heading"><div><strong>Adicionar</strong><span>' + definitions.length + ' componentes</span></div></div><div class="vb-insert-context">' + icon("mouse-pointer-2") + '<span>O novo item entra perto de <strong>' + esc(selected && selected.name || "Pagina") + '</strong></span></div><section class="vb-quick-start"><h3>Mais usados</h3><div>' + quick + '</div></section><label class="vb-search">' + icon("search") + '<input type="search" data-vb-library-search value="' + esc(runtime.librarySearch) + '" placeholder="O que voce quer adicionar?"></label><div class="vb-component-library">' + categories.map(function (category) { const entries = definitions.filter(function (definition) { return definition.category === category; }); return '<section><h3>' + esc(CATEGORY_LABELS[category] || category) + '</h3><div>' + entries.map(function (definition) { const placement = placementFor(definition.type); return '<button type="button" draggable="' + (placement ? "true" : "false") + '" data-vb-component="' + esc(definition.type) + '"' + (placement ? "" : " disabled") + '><span>' + icon(definition.icon) + '</span><b>' + esc(definition.label) + '</b><small>' + (placement ? "Clique ou arraste" : "Selecione um container") + '</small></button>'; }).join("") + '</div></section>'; }).join("") + '</div>';
  }

  function treeNodeMarkup(nodeId, depth) {
    const node = runtime.document.nodes[nodeId];
    if (!node) return "";
    const definition = definitionFor(node);
    const children = TB.childIds(node);
    const expanded = runtime.expanded.has(node.id) || depth < 2;
    const hidden = node.visibility && node.visibility[currentBreakpoint()] === false;
    return '<li data-vb-tree-node="' + esc(node.id) + '" data-depth="' + depth + '" draggable="' + (node.id !== runtime.document.rootId && !(node.meta && node.meta.locked) ? "true" : "false") + '"><div class="vb-layer-row ' + (runtime.selectedId === node.id ? "is-selected" : "") + '" style="--depth:' + depth + '"><button type="button" class="vb-layer-expand" data-vb-action="toggle-layer" data-id="' + esc(node.id) + '"' + (children.length ? "" : " disabled") + ' aria-label="Alternar filhos">' + icon(expanded ? "chevron-down" : "chevron-right") + '</button><span class="vb-layer-icon">' + icon(definition ? definition.icon : "box") + '</span><button type="button" class="vb-layer-select" data-vb-select="' + esc(node.id) + '"><strong>' + esc(node.name || definition && definition.label || node.type) + '</strong><small>' + esc(definition && definition.label || node.type) + '</small></button><button type="button" class="vb-layer-visibility" data-vb-action="visibility" data-id="' + esc(node.id) + '" title="Visibilidade">' + icon(hidden ? "eye-off" : "eye") + '</button></div>' + (children.length && expanded ? '<ol>' + children.map(function (childId) { return treeNodeMarkup(childId, depth + 1); }).join("") + '</ol>' : "") + '</li>';
  }

  function layersMarkup() {
    return '<div class="vb-panel-heading"><div><strong>Estrutura</strong><span>' + Object.keys(runtime.document.nodes).length + ' elementos</span></div><button type="button" data-vb-action="expand-all" title="Expandir tudo">' + icon("list-tree") + '</button></div><div class="vb-layers-help">' + icon("move") + '<span>Arraste para mudar ordem ou hierarquia</span></div><ol class="vb-layer-tree">' + treeNodeMarkup(runtime.document.rootId, 0) + '</ol>';
  }

  function pagesMarkup() {
    const documents = Object.values(runtime.workspace.documents);
    return '<div class="vb-panel-heading"><div><strong>Paginas</strong><span>' + documents.length + ' documentos</span></div><button type="button" data-vb-action="new-page" title="Nova pagina">' + icon("plus") + '</button></div><div class="vb-page-list">' + documents.map(function (documentValue) { const active = documentValue.documentId === runtime.document.documentId; return '<article class="' + (active ? "is-active" : "") + '"><button type="button" data-vb-open-page="' + esc(documentValue.documentId) + '"><span>' + icon(documentValue.settings.slug === "/" ? "house" : "file-text") + '</span><div><strong>' + esc(documentValue.name) + '</strong><small>' + esc(documentValue.settings.slug) + '</small></div></button><div><button type="button" data-vb-action="duplicate-page" data-id="' + esc(documentValue.documentId) + '" title="Duplicar">' + icon("copy") + '</button><button type="button" data-vb-action="delete-page" data-id="' + esc(documentValue.documentId) + '" title="Excluir"' + (documents.length < 2 ? " disabled" : "") + '>' + icon("trash-2") + '</button></div></article>'; }).join("") + '</div><button type="button" class="vb-wide-action" data-vb-action="new-page">' + icon("plus") + ' Criar pagina</button>';
  }

  function savedMarkup() {
    const fragments = TB.storage.fragments(runtime.state);
    return '<div class="vb-panel-heading"><div><strong>Biblioteca</strong><span>Secoes e blocos reutilizaveis</span></div></div>' + (fragments.length ? '<div class="vb-saved-list">' + fragments.map(function (fragment) { return '<article><span>' + icon("layout-template") + '</span><div><strong>' + esc(fragment.name) + '</strong><small>' + new Date(fragment.createdAt).toLocaleDateString("pt-BR") + '</small></div><button type="button" data-vb-insert-fragment="' + esc(fragment.id) + '" title="Inserir">' + icon("plus") + '</button><button type="button" data-vb-delete-fragment="' + esc(fragment.id) + '" title="Excluir">' + icon("trash-2") + '</button></article>'; }).join("") + '</div>' : '<div class="vb-empty-panel">' + icon("library") + '<strong>Nenhuma secao salva</strong><p>Selecione um elemento e use Salvar como modelo.</p></div>');
  }

  function templatesMarkup() {
    const activeId = runtime.document.meta && runtime.document.meta.templateId || "provider-classic";
    const home = runtime.document.settings && runtime.document.settings.slug === "/";
    const templates = TB.templateRegistry.list();
    return '<div class="vb-panel-heading"><div><strong>Templates completos</strong><span>' + templates.length + ' opcoes para provedores</span></div></div><div class="vb-template-intro">' + icon("wand-sparkles") + '<div><strong>Comece pronto. Personalize tudo.</strong><span>Aplicar troca a estrutura da Home e guarda uma copia local da versao atual.</span></div></div><div class="vb-template-list">' + templates.map(function (template) {
      const active = activeId === template.id;
      return '<article class="vb-template-card' + (active ? ' is-active' : '') + '"><div class="vb-template-preview" data-template-preview="' + esc(template.id) + '"><div class="vb-template-preview__nav"></div><div class="vb-template-preview__hero"><i></i><span></span><span></span><b></b></div><div class="vb-template-preview__grid"><i></i><i></i><i></i></div></div><div class="vb-template-card__body"><div><span>' + esc(template.category) + '</span><h3>' + esc(template.name) + '</h3></div>' + (active ? '<em>' + icon("circle-check") + ' Em uso</em>' : '') + '<p>' + esc(template.description) + '</p><div class="vb-template-meta"><span style="font-family:' + esc(template.font.split(" + ")[0]) + '">Aa</span><small>' + esc(template.font) + '</small><div>' + template.palette.map(function (color) { return '<i style="background:' + esc(color) + '"></i>'; }).join("") + '</div></div><button type="button" data-vb-apply-template="' + esc(template.id) + '"' + (!home || active ? ' disabled' : '') + '>' + icon(active ? "check" : "replace") + (active ? ' Template atual' : ' Usar este template') + '</button></div></article>';
    }).join("") + '</div>' + (!home ? '<div class="vb-empty-panel">' + icon("house") + '<strong>Templates sao aplicados na Home</strong><p>Abra a pagina Home para trocar o visual completo do site.</p></div>' : '');
  }

  function tokenField(key, label, type) {
    const value = runtime.document.theme.tokens[key] || "";
    if (type === "color") return '<label class="vb-token-field"><span>' + esc(label) + '</span><div><input type="color" value="' + (/^#[0-9a-f]{6}$/i.test(value) ? esc(value) : "#0874e7") + '" data-vb-token="' + esc(key) + '"><input value="' + esc(value) + '" data-vb-token="' + esc(key) + '"></div></label>';
    return '<label class="vb-field"><span>' + esc(label) + '</span><input value="' + esc(value) + '" data-vb-token="' + esc(key) + '"></label>';
  }

  function darkTokenField(key, label) {
    const value = runtime.document.theme.darkTokens && runtime.document.theme.darkTokens[key] || "";
    return '<label class="vb-token-field"><span>' + esc(label) + '</span><div><input type="color" value="' + (/^#[0-9a-f]{6}$/i.test(value) ? esc(value) : "#07111e") + '" data-vb-dark-token="' + esc(key) + '"><input value="' + esc(value) + '" data-vb-dark-token="' + esc(key) + '"></div></label>';
  }

  function fontPickerMarkup(key, label) {
    const fonts = TB.designCatalog && TB.designCatalog.fonts || [];
    const value = runtime.document.theme.tokens[key] || "";
    return '<section class="vb-font-library"><header><div><h3>' + esc(label) + '</h3><span>' + fonts.length + ' fontes locais</span></div><span class="vb-font-current" style="font-family:' + esc(value) + '">Aa</span></header><div>' + fonts.map(function (font) { return '<button type="button" class="' + (font.value === value ? "is-active" : "") + '" data-vb-font-token="' + esc(key) + '" data-value="' + esc(font.value) + '" style="font-family:' + esc(font.value) + '"><strong>' + esc(font.name) + '</strong><span>' + esc(font.sample) + '</span><small>' + esc(font.category) + '</small></button>'; }).join("") + '</div></section>';
  }

  function globalsMarkup() {
    return '<div class="vb-panel-heading"><div><strong>Design system</strong><span>Identidade compartilhada no site</span></div></div><div class="vb-global-groups"><section><h3>Cores claras</h3>' + tokenField("primary", "Principal", "color") + tokenField("secondary", "Destaque", "color") + tokenField("background", "Fundo", "color") + tokenField("surface", "Superficie", "color") + tokenField("text", "Texto", "color") + tokenField("muted", "Texto secundario", "color") + '</section><section><h3>Cores escuras</h3>' + darkTokenField("primary", "Principal") + darkTokenField("secondary", "Destaque") + darkTokenField("background", "Fundo") + darkTokenField("surface", "Superficie") + darkTokenField("text", "Texto") + darkTokenField("muted", "Texto secundario") + '</section>' + fontPickerMarkup("fontHeading", "Fonte dos titulos") + fontPickerMarkup("fontBody", "Fonte dos textos") + '<section><h3>Raios e espacamento</h3>' + tokenField("radiusSm", "Raio pequeno") + tokenField("radiusMd", "Raio medio") + tokenField("radiusLg", "Raio grande") + tokenField("spaceSm", "Espaco pequeno") + tokenField("spaceMd", "Espaco medio") + tokenField("spaceLg", "Espaco grande") + tokenField("spaceXl", "Espaco extra") + '</section></div>';
  }

  function selectionTrailMarkup() {
    const trail = [];
    let id = runtime.selectedId;
    while (id && trail.length < 4) {
      const node = runtime.document.nodes[id];
      if (!node) break;
      trail.unshift(node.name || definitionFor(node) && definitionFor(node).label || node.type);
      const parent = TB.parentOf(runtime.document, id);
      id = parent && parent.parentId;
    }
    return trail.map(function (label, index) { return (index ? icon("chevron-right") : "") + '<span>' + esc(label) + '</span>'; }).join("");
  }

  function canvasContextMarkup() {
    return icon("mouse-pointer-2") + '<div>' + selectionTrailMarkup() + '</div>';
  }

  function canvasMarkup() {
    return '<main class="vb-studio__canvas"><div class="vb-canvas-top"><div class="vb-canvas-context">' + canvasContextMarkup() + '</div><div class="vb-rich-toolbar"><button type="button" data-vb-format="bold" title="Negrito"><b>B</b></button><button type="button" data-vb-format="italic" title="Italico"><i>I</i></button><button type="button" data-vb-format="underline" title="Sublinhado"><u>U</u></button><button type="button" data-vb-format="insertUnorderedList" title="Lista">' + icon("list") + '</button><button type="button" data-vb-format="createLink" title="Link">' + icon("link") + '</button></div></div><div class="vb-canvas-stage is-' + runtime.device + '" style="--vb-scale:1"><div class="vb-canvas-viewport"><div class="vb-canvas-device"><iframe id="vb-preview-frame" src="./builder-preview.html?mode=editor&amp;session=' + encodeURIComponent(runtime.session) + '" title="Preview visual da pagina"></iframe><div class="vb-preview-drop-bridge" data-vb-preview-drop><span>' + icon("mouse-pointer-square-dashed") + '<b>Solte para adicionar</b><small data-vb-drop-label>Escolha uma posicao no site</small></span></div></div></div></div></main>';
  }

  function inspectorMarkup() {
    const node = selectedNode();
    const definition = definitionFor(node);
    if (!node || !definition) return '<aside class="vb-studio__inspector"><div class="vb-empty-panel">Selecione um componente.</div></aside>';
    return '<aside class="vb-studio__inspector"><header class="vb-inspector-head"><span>' + icon(definition.icon) + '</span><div><strong>' + esc(node.name) + '</strong><small>' + esc(definition.label) + '</small></div><button type="button" data-vb-action="locate" title="Localizar no preview">' + icon("scan-search") + '</button></header><div class="vb-inspector-actions"><button type="button" data-vb-action="duplicate" title="Duplicar"' + (node.id === runtime.document.rootId ? " disabled" : "") + '>' + icon("copy-plus") + '</button><button type="button" data-vb-action="copy" title="Copiar">' + icon("copy") + '</button><button type="button" data-vb-action="copy-style" title="Copiar estilo">' + icon("paintbrush") + '</button><button type="button" data-vb-action="paste-style" title="Colar estilo"' + (runtime.styleClipboard ? "" : " disabled") + '>' + icon("clipboard-paste") + '</button><button type="button" class="is-danger" data-vb-action="delete" title="Excluir"' + (node.id === runtime.document.rootId || node.meta && node.meta.locked ? " disabled" : "") + '>' + icon("trash-2") + '</button></div><nav class="vb-inspector-tabs">' + INSPECTOR_TABS.map(function (tab) { return '<button type="button" class="' + (runtime.inspectorTab === tab[0] ? "is-active" : "") + '" data-vb-inspector-tab="' + tab[0] + '">' + tab[1] + '</button>'; }).join("") + '</nav><div class="vb-inspector-body" data-vb-inspector-body>' + inspectorBodyMarkup(node, definition) + '</div></aside>';
  }

  function propFieldMarkup(key, schema, node) {
    const value = node.props && node.props[key];
    const base = ' data-vb-prop="' + esc(key) + '"';
    if (schema.control === "switch" || schema.type === "boolean") return '<label class="vb-switch"><span><strong>' + esc(schema.label) + '</strong></span><input type="checkbox"' + base + (value ? " checked" : "") + '><i></i></label>';
    if (schema.control === "select" && ["position", "focalPoint"].includes(key) && (schema.options || []).every(function (entry) { return ["left", "center", "right"].includes(typeof entry === "string" ? entry : entry.value); })) {
      const options = { left: ["align-start-vertical", "Esquerda"], center: ["align-center-vertical", "Centro"], right: ["align-end-vertical", "Direita"] };
      return '<div class="vb-visual-control"><span>' + esc(schema.label) + '</span><div class="vb-segmented vb-segmented--labels" role="group" aria-label="' + esc(schema.label) + '">' + (schema.options || []).map(function (entry) { const option = typeof entry === "string" ? { value: entry, label: entry } : entry; const visual = options[option.value]; return '<button type="button" class="' + (String(value) === String(option.value) ? "is-active" : "") + '" data-vb-prop-choice="' + esc(key) + '" data-value="' + esc(option.value) + '" title="' + esc(option.label) + '">' + icon(visual[0]) + '<span>' + esc(visual[1]) + '</span></button>'; }).join("") + '</div></div>';
    }
    if (schema.control === "select") return '<label class="vb-field"><span>' + esc(schema.label) + '</span><select' + base + '>' + (schema.options || []).map(function (entry) { const option = typeof entry === "string" ? { value: entry, label: entry } : entry; return '<option value="' + esc(option.value) + '"' + (String(value) === String(option.value) ? " selected" : "") + '>' + esc(option.label) + '</option>'; }).join("") + '</select></label>';
    if (schema.control === "textarea") return '<label class="vb-field"><span>' + esc(schema.label) + '</span><textarea rows="5"' + base + '>' + esc(value || "") + '</textarea></label>';
    if (schema.control === "asset") return assetFieldMarkup(key, schema, node);
    if (schema.control === "icon") return iconFieldMarkup(key, schema, value);
    const type = schema.type === "number" ? "number" : schema.type === "url" ? "url" : "text";
    const constraints = ["min", "max", "step", "maxLength"].map(function (name) { return schema[name] == null ? "" : ' ' + (name === "maxLength" ? "maxlength" : name) + '="' + esc(schema[name]) + '"'; }).join("");
    return '<label class="vb-field"><span>' + esc(schema.label) + '</span><input type="' + type + '" value="' + esc(value == null ? "" : value) + '"' + base + constraints + '></label>';
  }

  function iconFieldMarkup(key, schema, value) {
    const groups = TB.designCatalog && TB.designCatalog.iconGroups || [];
    const current = /^[a-z0-9-]{1,60}$/.test(String(value || "")) ? value : "sparkles";
    return '<details class="vb-icon-library"><summary><span>' + icon(current) + '</span><div><small>' + esc(schema.label) + '</small><strong>' + esc(current) + '</strong></div>' + icon("chevron-down") + '</summary><div class="vb-icon-library__panel"><label>' + icon("search") + '<input type="search" data-vb-icon-search placeholder="Buscar icone"></label>' + groups.map(function (group) { return '<section><h4>' + esc(group.label) + '</h4><div>' + group.icons.map(function (name) { return '<button type="button" class="' + (name === current ? "is-active" : "") + '" data-vb-icon-choice="' + esc(name) + '" data-prop="' + esc(key) + '" title="' + esc(name) + '">' + icon(name) + '</button>'; }).join("") + '</div></section>'; }).join("") + '</div></details>';
  }

  function assetFieldMarkup(key, schema, node) {
    const value = node.props && node.props[key] || "";
    const media = (runtime.state.mediaLibrary || []).slice(0, 12);
    return '<div class="vb-asset-field"><span>' + esc(schema.label) + '</span><div class="vb-asset-preview">' + (value ? '<img src="' + esc(TB.safeMediaUrl(value, "")) + '" alt="">' : icon("image")) + '<label title="Enviar imagem">' + icon("upload") + '<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-vb-media-upload="' + esc(key) + '"></label></div><input type="url" value="' + esc(value) + '" data-vb-prop="' + esc(key) + '" placeholder="URL ou arquivo da biblioteca"><div class="vb-media-strip">' + media.map(function (item) { return '<button type="button" data-vb-media-pick="' + esc(key) + '" data-url="' + esc(item.url) + '" title="' + esc(item.name) + '"><img src="' + esc(item.url) + '" alt=""></button>'; }).join("") + '</div><small>' + esc(schema.help || "Imagens sao convertidas e comprimidas antes de entrar na biblioteca.") + '</small></div>';
  }

  function propsByGroups(definition, node, groups) {
    const entries = Object.entries(definition.propsSchema || {}).filter(function (entry) {
      const schema = entry[1];
      const condition = schema.visibleWhen;
      if (condition && node.props) {
        const actual = node.props[condition.prop];
        if (condition.equals !== undefined && actual !== condition.equals) return false;
        if (condition.notEquals !== undefined && actual === condition.notEquals) return false;
      }
      return groups.includes(schema.group || "content");
    });
    if (!entries.length) return '<div class="vb-empty-inspector">Este componente nao possui propriedades nesta categoria.</div>';
    return entries.map(function (entry) { return propFieldMarkup(entry[0], entry[1], node); }).join("");
  }

  function slotManagerMarkup(definition, node) {
    const manager = definition.editor && definition.editor.slotManager;
    if (!manager || !node.slots || !node.slots[manager.slot]) return "";
    const ids = node.slots[manager.slot];
    if (manager.variant === "hero" || manager.variant === "slider") return slideDeckMarkup(node, manager, ids);
    return '<section class="vb-inspector-section vb-slot-manager"><header><div><h3>' + esc(manager.label || "Itens") + '</h3><small>' + ids.length + ' cadastrado(s)</small></div><button type="button" data-vb-slot-add="' + esc(manager.addType) + '" data-slot="' + esc(manager.slot) + '" title="Adicionar ' + esc(manager.singular || "item") + '">' + icon("plus") + '</button></header><div>' + ids.map(function (id, index) {
      const item = runtime.document.nodes[id];
      if (!item) return "";
      const image = manager.imageProp && item.props && TB.safeMediaUrl(item.props[manager.imageProp], "");
      return '<article><button type="button" class="vb-slot-item-main" data-vb-select="' + esc(item.id) + '">' + (image ? '<img src="' + esc(image) + '" alt="">' : '<span>' + icon(definitionFor(item) && definitionFor(item).icon || "box") + '</span>') + '<div><strong>' + esc(item.name || (manager.singular || "Item") + " " + (index + 1)) + '</strong><small>' + esc(manager.singular || "Item") + ' ' + (index + 1) + '</small></div></button><div class="vb-slot-item-actions"><button type="button" data-vb-slot-move="up" data-id="' + esc(item.id) + '"' + (index === 0 ? " disabled" : "") + ' title="Mover para cima">' + icon("chevron-up") + '</button><button type="button" data-vb-slot-move="down" data-id="' + esc(item.id) + '"' + (index === ids.length - 1 ? " disabled" : "") + ' title="Mover para baixo">' + icon("chevron-down") + '</button><button type="button" data-vb-slot-duplicate="' + esc(item.id) + '" title="Duplicar">' + icon("copy-plus") + '</button><button type="button" data-vb-slot-delete="' + esc(item.id) + '"' + (ids.length <= 1 ? " disabled" : "") + ' title="Excluir">' + icon("trash-2") + '</button></div></article>';
    }).join("") + '</div></section>';
  }

  function firstDescendant(node, types) {
    return TB.subtreeIds(runtime.document, node.id).slice(1).map(function (id) { return runtime.document.nodes[id]; }).find(function (entry) { return entry && types.includes(entry.type); });
  }

  function slideDeckMarkup(node, manager, ids) {
    const heroMode = node.type === "template.hero" ? (node.props.mode === "banner" ? "banner" : "slider") : "slider";
    const bannerId = ids.includes(node.props.bannerId) ? node.props.bannerId : ids[0];
    const mode = node.type === "template.hero" ? '<div class="vb-hero-mode" role="group" aria-label="Tipo do destaque"><button type="button" class="' + (heroMode === "banner" ? "is-active" : "") + '" data-vb-hero-mode="banner">' + icon("image") + '<span><strong>Banner estatico</strong><small>Uma imagem em destaque</small></span></button><button type="button" class="' + (heroMode === "slider" ? "is-active" : "") + '" data-vb-hero-mode="slider">' + icon("gallery-horizontal") + '<span><strong>Slider</strong><small>Varios destaques</small></span></button></div>' : "";
    const cards = ids.map(function (id, index) {
      const item = runtime.document.nodes[id];
      if (!item) return "";
      const heading = item.props && item.props.title || (firstDescendant(item, ["content.heading"]) || { props: {} }).props.text || item.name || (manager.singular || "Slide") + " " + (index + 1);
      const description = item.props && (item.props.subtitle || item.props.eyebrow) || (firstDescendant(item, ["content.text"]) || { props: {} }).props.text || "Conteudo visual";
      const imageUrl = manager.imageProp && item.props && TB.safeMediaUrl(item.props[manager.imageProp], "");
      const featured = node.type === "template.hero" && heroMode === "banner" && item.id === bannerId;
      return '<article class="vb-slide-deck__card' + (featured ? " is-featured" : "") + '"><button type="button" class="vb-slide-deck__main" data-vb-select="' + esc(item.id) + '"><span class="vb-slide-deck__media">' + (imageUrl ? '<img src="' + esc(imageUrl) + '" alt="">' : icon("image")) + '<em>' + (index + 1) + '</em></span><span class="vb-slide-deck__copy"><small>' + esc(manager.singular || "Slide") + ' ' + (index + 1) + (featured ? " - Exibido" : "") + '</small><strong>' + esc(heading) + '</strong><span>' + esc(description) + '</span></span><i title="Editar">' + icon("pencil") + '</i></button><div class="vb-slide-deck__actions">' + (node.type === "template.hero" && heroMode === "banner" ? '<button type="button" class="' + (featured ? "is-active" : "") + '" data-vb-set-hero-banner="' + esc(item.id) + '" title="Exibir como banner">' + icon(featured ? "circle-check" : "pin") + '</button>' : "") + '<button type="button" data-vb-slot-move="up" data-id="' + esc(item.id) + '"' + (index === 0 ? " disabled" : "") + ' title="Mover para cima">' + icon("chevron-up") + '</button><button type="button" data-vb-slot-move="down" data-id="' + esc(item.id) + '"' + (index === ids.length - 1 ? " disabled" : "") + ' title="Mover para baixo">' + icon("chevron-down") + '</button><button type="button" data-vb-slot-duplicate="' + esc(item.id) + '" title="Duplicar">' + icon("copy-plus") + '</button><button type="button" data-vb-slot-delete="' + esc(item.id) + '"' + (ids.length <= 1 ? " disabled" : "") + ' title="Excluir">' + icon("trash-2") + '</button></div></article>';
    }).join("");
    return '<section class="vb-inspector-section vb-slot-manager vb-slide-deck"><header><div><h3>' + esc(manager.label || "Slides") + '</h3><small>' + ids.length + ' ' + (ids.length === 1 ? "item" : "itens") + '</small></div><button type="button" data-vb-slot-add="' + esc(manager.addType) + '" data-slot="' + esc(manager.slot) + '" title="Adicionar ' + esc(manager.singular || "slide") + '">' + icon("plus") + '</button></header>' + mode + '<div class="vb-slide-deck__list">' + cards + '</div></section>';
  }

  function ancestorNode(nodeId, types) {
    let parent = TB.parentOf(runtime.document, nodeId);
    while (parent) {
      const node = runtime.document.nodes[parent.parentId];
      if (!node) return null;
      if (types.includes(node.type)) return node;
      parent = TB.parentOf(runtime.document, node.id);
    }
    return null;
  }

  function editorContextMarkup(node) {
    const slideTypes = ["template.hero-slide", "marketing.slide"];
    const deckTypes = ["template.hero", "marketing.slider"];
    const slide = slideTypes.includes(node.type) ? node : ancestorNode(node.id, slideTypes);
    const deck = deckTypes.includes(node.type) ? node : ancestorNode(node.id, deckTypes);
    if (!slide && !deck) return "";
    const buttons = (deck && deck.id !== node.id ? '<button type="button" data-vb-select="' + esc(deck.id) + '">' + icon("gallery-horizontal") + '<span><small>Voltar para</small><strong>' + esc(deck.name || "Slider") + '</strong></span></button>' : "") + (slide && slide.id !== node.id ? '<button type="button" data-vb-select="' + esc(slide.id) + '">' + icon("panel-top") + '<span><small>Editar</small><strong>' + esc(slide.name || "Slide") + '</strong></span></button>' : "");
    return buttons ? '<nav class="vb-editor-context" aria-label="Contexto do destaque">' + buttons + '</nav>' : "";
  }

  function editableDescendantsMarkup(node) {
    if (!["marketing.banner", "marketing.slide"].includes(node.type)) return "";
    const allowed = ["content.heading", "content.text", "content.rich-text", "content.button", "content.link"];
    const children = TB.subtreeIds(runtime.document, node.id).slice(1).map(function (id) { return runtime.document.nodes[id]; }).filter(function (entry) { return entry && allowed.includes(entry.type); });
    if (!children.length) return "";
    return '<section class="vb-inspector-section vb-slide-content"><h3>Textos e botoes</h3><div>' + children.map(function (entry) { const definition = definitionFor(entry); const value = entry.props && (entry.props.text || entry.props.html) || entry.name || definition.label; return '<button type="button" data-vb-select="' + esc(entry.id) + '"><span>' + icon(definition.icon) + '</span><span><strong>' + esc(entry.name || definition.label) + '</strong><small>' + esc(TB.plainText(value, 90)) + '</small></span>' + icon("chevron-right") + '</button>'; }).join("") + '</div></section>';
  }

  function styleControlMarkup(key, node) {
    const field = TB.STYLE_FIELDS[key] || EXTRA_STYLE_FIELDS[key] || { type: "string" };
    const value = currentStyle(node)[key] || "";
    const attr = ' data-vb-style="' + esc(key) + '"';
    if (field.type === "enum" && SEGMENTED_STYLES[key]) {
      return '<div class="vb-visual-control"><span>' + esc(STYLE_LABELS[key] || key) + '</span><div class="vb-segmented" role="group" aria-label="' + esc(STYLE_LABELS[key] || key) + '"><button type="button" class="' + (!value ? "is-active" : "") + '" data-vb-style-choice="' + esc(key) + '" data-value="" title="Herdar configuracao">' + icon("undo-dot") + '</button>' + SEGMENTED_STYLES[key].map(function (option) { return '<button type="button" class="' + (value === option[0] ? "is-active" : "") + '" data-vb-style-choice="' + esc(key) + '" data-value="' + esc(option[0]) + '" title="' + esc(option[2]) + '">' + icon(option[1]) + '</button>'; }).join("") + '</div></div>';
    }
    if (field.type === "enum") return '<label class="vb-field"><span>' + esc(STYLE_LABELS[key] || key) + '</span><select' + attr + '><option value="">Herdar / automatico</option>' + field.options.map(function (option) { return '<option value="' + esc(option) + '"' + (value === option ? " selected" : "") + '>' + esc(STYLE_OPTION_LABELS[option] || option) + '</option>'; }).join("") + '</select></label>';
    if (field.type === "color") {
      const color = /^#[0-9a-f]{6}$/i.test(value) ? value : "#0874e7";
      return '<label class="vb-color-field"><span>' + esc(STYLE_LABELS[key] || key) + '</span><div><input type="color" value="' + esc(color) + '"' + attr + '><input value="' + esc(value) + '"' + attr + ' placeholder="#000000 ou token.color.primary"></div></label>';
    }
    if (field.type === "font") {
      const fonts = TB.designCatalog && TB.designCatalog.fonts || [];
      return '<label class="vb-font-style-field"><span>' + esc(STYLE_LABELS[key] || key) + '</span><select' + attr + '><option value="">Herdar fonte global</option><option value="token.font.heading"' + (value === "token.font.heading" ? " selected" : "") + '>Fonte global de titulos</option><option value="token.font.body"' + (value === "token.font.body" ? " selected" : "") + '>Fonte global de textos</option>' + fonts.map(function (font) { return '<option value="' + esc(font.value) + '"' + (value === font.value ? " selected" : "") + '>' + esc(font.name) + '</option>'; }).join("") + '</select><small style="font-family:' + esc(value && !value.startsWith("token.") ? value : "inherit") + '">Aa Bb Cc 0123</small></label>';
    }
    if (key === "opacity") return '<label class="vb-range-field"><span>' + esc(STYLE_LABELS[key]) + '<output>' + esc(value || "1") + '</output></span><input type="range" min="0" max="1" step="0.05" value="' + esc(value || "1") + '"' + attr + '></label>';
    return '<label class="vb-field"><span>' + esc(STYLE_LABELS[key] || key) + '</span><input value="' + esc(value) + '"' + attr + ' placeholder="Automatico"></label>';
  }

  function dimensionValue(node, control) {
    const units = control.units || {};
    const source = String(effectiveStyle(node, control.key) || "");
    const match = source.match(/^(-?\d+(?:\.\d+)?)(px|vh|vw|%|rem|em)$/);
    const unit = match && units[match[2]] ? match[2] : Object.keys(units)[0] || "px";
    const settings = units[unit] || { min: 0, max: 100, step: 1, value: 0 };
    const parsed = match && match[2] === unit ? Number(match[1]) : Number(settings.value);
    return { unit: unit, value: Math.min(Number(settings.max), Math.max(Number(settings.min), Number.isFinite(parsed) ? parsed : Number(settings.value))), settings: settings };
  }

  function visualDimensionsMarkup(definition, node) {
    const controls = definition && definition.editor && definition.editor.dimensionControls || [];
    if (!controls.length) return "";
    return '<section class="vb-inspector-section vb-dimension-panel"><header><div><h3>Tamanho visual</h3><small>Ajuste arrastando. O valor vale para ' + esc(DEVICES[runtime.device].label.toLowerCase()) + '.</small></div>' + icon("move-vertical") + '</header>' + controls.map(function (control) {
      const current = dimensionValue(node, control);
      return '<div class="vb-dimension-control"><div class="vb-dimension-control__head"><span>' + esc(control.label || STYLE_LABELS[control.key] || control.key) + '</span><output data-vb-dimension-output="' + esc(control.key) + '">' + esc(current.value + current.unit) + '</output></div><input type="range" min="' + esc(current.settings.min) + '" max="' + esc(current.settings.max) + '" step="' + esc(current.settings.step || 1) + '" value="' + esc(current.value) + '" data-vb-dimension="' + esc(control.key) + '" data-unit="' + esc(current.unit) + '" aria-label="' + esc(control.label || control.key) + '"><div class="vb-dimension-units" role="group" aria-label="Unidade">' + Object.keys(control.units || {}).map(function (unit) { return '<button type="button" class="' + (current.unit === unit ? "is-active" : "") + '" data-vb-dimension-unit="' + esc(unit) + '" data-key="' + esc(control.key) + '">' + esc(unit) + '</button>'; }).join("") + '</div></div>';
    }).join("") + '</section>';
  }

  function styleGroupMarkup(group, node, definition) {
    const visualKeys = (definition && definition.editor && definition.editor.dimensionControls || []).map(function (control) { return control.key; });
    const fields = (STYLE_GROUPS[group] || []).filter(function (key) { return !visualKeys.includes(key); });
    if (group === "layout" && node.type === "content.image") fields.splice(fields.indexOf("maxHeight") + 1, 0, "objectFit");
    const compactGroups = group === "layout" ? [
      ["Margem", ["marginTop", "marginRight", "marginBottom", "marginLeft"]],
      ["Padding", ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]],
    ] : [];
    const compactKeys = compactGroups.reduce(function (all, entry) { return all.concat(entry[1]); }, []);
    const regular = fields.filter(function (key) { return !compactKeys.includes(key); }).map(function (key) { return styleControlMarkup(key, node); }).join("");
    return regular + compactGroups.map(function (entry) { return '<fieldset class="vb-box-control"><legend>' + entry[0] + '</legend><div>' + entry[1].map(function (key) { return '<label><span>' + ({ marginTop: "Topo", marginRight: "Dir.", marginBottom: "Base", marginLeft: "Esq.", paddingTop: "Topo", paddingRight: "Dir.", paddingBottom: "Base", paddingLeft: "Esq." }[key]) + '</span><input value="' + esc(currentStyle(node)[key] || "") + '" data-vb-style="' + key + '" placeholder="0"></label>'; }).join("") + '</div></fieldset>'; }).join("");
  }

  function effectiveStyle(node, key) {
    const breakpoint = currentBreakpoint();
    const styles = node.styles || {};
    const current = styles[breakpoint] && styles[breakpoint][runtime.visualState] || {};
    const normal = styles[breakpoint] && styles[breakpoint].normal || {};
    const baseState = styles.base && styles.base[runtime.visualState] || {};
    const base = styles.base && styles.base.normal || {};
    return current[key] != null && current[key] !== "" ? current[key] : normal[key] != null && normal[key] !== "" ? normal[key] : baseState[key] != null && baseState[key] !== "" ? baseState[key] : base[key] || "";
  }

  function alignmentButton(value, current, iconName, label, attribute) {
    return '<button type="button" class="' + (current === value ? "is-active" : "") + '" ' + attribute + '="' + esc(value) + '" title="' + esc(label) + '">' + icon(iconName) + '<span>' + esc(label) + '</span></button>';
  }

  function quickLayoutMarkup(node) {
    if (node.type !== "content.image") return "";
    const marginLeft = effectiveStyle(node, "marginLeft");
    const marginRight = effectiveStyle(node, "marginRight");
    const alignment = marginLeft === "auto" && marginRight === "auto" ? "center" : marginLeft === "auto" && marginRight !== "auto" ? "right" : "left";
    const width = effectiveStyle(node, "width") || "100%";
    return '<section class="vb-inspector-section vb-quick-layout"><h3>Posicao e tamanho</h3><div class="vb-visual-control"><span>Alinhar imagem</span><div class="vb-segmented vb-segmented--labels" role="group" aria-label="Alinhar imagem">' + alignmentButton("left", alignment, "align-start-vertical", "Esquerda", "data-vb-image-align") + alignmentButton("center", alignment, "align-center-vertical", "Centro", "data-vb-image-align") + alignmentButton("right", alignment, "align-end-vertical", "Direita", "data-vb-image-align") + '</div></div><div class="vb-visual-control"><span>Largura rapida</span><div class="vb-segmented vb-segmented--text" role="group" aria-label="Largura da imagem">' + ["25%", "50%", "75%", "100%"].map(function (value) { return '<button type="button" class="' + (width === value ? "is-active" : "") + '" data-vb-image-width="' + value + '">' + value.replace("%", "") + '</button>'; }).join("") + '</div></div><small class="vb-section-help">As configuracoes valem para ' + esc(DEVICES[runtime.device].label.toLowerCase()) + ' e podem ser diferentes em cada dispositivo.</small></section>';
  }

  function imageFocalMarkup(node) {
    if (node.type !== "content.image") return "";
    const x = Number(node.props.focalX == null ? 50 : node.props.focalX);
    const y = Number(node.props.focalY == null ? 50 : node.props.focalY);
    const points = [[0, 0], [50, 0], [100, 0], [0, 50], [50, 50], [100, 50], [0, 100], [50, 100], [100, 100]];
    return '<section class="vb-inspector-section"><h3>Enquadramento da imagem</h3><div class="vb-image-focus"><div class="vb-image-focus__grid" role="group" aria-label="Ponto focal">' + points.map(function (point) { return '<button type="button" class="' + (x === point[0] && y === point[1] ? "is-active" : "") + '" data-vb-image-focal="' + point.join(",") + '" title="Foco ' + point[0] + '% / ' + point[1] + '%"><i></i></button>'; }).join("") + '</div><div><strong>Ponto de interesse</strong><small>Mantenha rostos e produtos visiveis quando a imagem for recortada.</small></div></div></section>';
  }

  function breakpointBarMarkup() {
    return '<div class="vb-breakpoint-bar"><span>Editando em</span><div>' + Object.keys(DEVICES).map(function (device) { return '<button type="button" class="' + (runtime.device === device ? "is-active" : "") + '" data-vb-device="' + device + '">' + icon(DEVICES[device].icon) + '</button>'; }).join("") + '</div><small>' + ({ desktop: "> 1024 px", tablet: "768 - 1024 px", mobile: "ate 767 px" }[runtime.device]) + '</small></div><div class="vb-state-bar"><span>Estado</span><select data-vb-state><option value="normal"' + (runtime.visualState === "normal" ? " selected" : "") + '>Normal</option><option value="hover"' + (runtime.visualState === "hover" ? " selected" : "") + '>Hover</option><option value="focus"' + (runtime.visualState === "focus" ? " selected" : "") + '>Focus</option><option value="active"' + (runtime.visualState === "active" ? " selected" : "") + '>Active</option><option value="disabled"' + (runtime.visualState === "disabled" ? " selected" : "") + '>Disabled</option></select></div>';
  }

  function responsiveMarkup(node, definition) {
    const breakpoint = currentBreakpoint();
    const visible = !node.visibility || node.visibility[breakpoint] !== false;
    const responsiveProps = Object.entries(definition.propsSchema || {}).filter(function (entry) { return entry[1].group === "responsive"; });
    const content = responsiveProps.length ? '<section class="vb-inspector-section"><h3>Conteudo por dispositivo</h3><p class="vb-section-help">Use uma versao propria para celular quando o enquadramento desktop nao funcionar bem.</p>' + responsiveProps.map(function (entry) { return propFieldMarkup(entry[0], entry[1], node); }).join("") + '</section>' : "";
    const visualKeys = (definition.editor && definition.editor.dimensionControls || []).map(function (control) { return control.key; });
    return breakpointBarMarkup() + editorContextMarkup(node) + content + visualDimensionsMarkup(definition, node) + '<section class="vb-inspector-section"><h3>Visibilidade</h3><label class="vb-switch"><span><strong>Mostrar neste dispositivo</strong><small>Oculta somente no breakpoint atual.</small></span><input type="checkbox" data-vb-visibility' + (visible ? " checked" : "") + '><i></i></label></section><section class="vb-inspector-section"><h3>Dimensoes especificas</h3>' + ["width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "fontSize", "gap"].filter(function (key) { return !visualKeys.includes(key); }).map(function (key) { return styleControlMarkup(key, node); }).join("") + '</section>';
  }

  function advancedMarkup(node, definition) {
    const parent = TB.parentOf(runtime.document, node.id);
    const slotActions = Object.keys(definition.slots || {}).map(function (slotName) {
      const slot = definition.slots[slotName];
      const candidates = TB.registry.definitions ? Array.from(TB.registry.definitions.values()) : TB.registry.list();
      const allowed = candidates.filter(function (candidate) {
        if (candidate.type === "core.page") return false;
        if (slot.types && slot.types.length) return slot.types.includes(candidate.type);
        return !slot.categories || !slot.categories.length || slot.categories.includes(candidate.category);
      }).slice(0, 16);
      if (!allowed.length) return "";
      return '<section class="vb-inspector-section"><h3>Adicionar em ' + esc(slotName) + '</h3><div class="vb-quick-components">' + allowed.map(function (candidate) { return '<button type="button" data-vb-quick-add="' + esc(candidate.type) + '" data-slot="' + esc(slotName) + '">' + icon(candidate.icon) + '<span>' + esc(candidate.label) + '</span></button>'; }).join("") + '</div></section>';
    }).join("");
    const bindings = Object.keys(definition.propsSchema || {}).map(function (key) { const binding = node.bindings && node.bindings[key]; return '<label class="vb-field"><span>' + esc(definition.propsSchema[key].label) + '</span><select data-vb-binding="' + esc(key) + '">' + BINDING_OPTIONS.map(function (option) { return '<option value="' + option[0] + '"' + ((binding && binding.source || "") === option[0] ? " selected" : "") + '>' + option[1] + '</option>'; }).join("") + '</select></label>'; }).join("");
    return '<section class="vb-inspector-section"><h3>Identificacao</h3><label class="vb-field"><span>Nome na estrutura</span><input value="' + esc(node.name) + '" data-vb-node-name maxlength="100"></label><div class="vb-readonly"><span>ID</span><code>' + esc(node.id) + '</code></div><div class="vb-readonly"><span>Componente</span><code>' + esc(node.type) + '@' + esc(node.version) + '</code></div>' + (parent ? '<div class="vb-readonly"><span>Pai / slot</span><code>' + esc(parent.parentId) + ' / ' + esc(parent.slot) + '</code></div>' : "") + '</section><section class="vb-inspector-section"><h3>Dados dinamicos</h3><p class="vb-section-help">Vinculos aceitam somente fontes autorizadas pelo sistema.</p>' + (bindings || '<div class="vb-empty-inspector">Sem propriedades vinculaveis.</div>') + '</section>' + slotActions + '<section class="vb-inspector-section"><h3>Reutilizacao</h3><button type="button" class="vb-wide-action" data-vb-action="save-fragment"' + (node.id === runtime.document.rootId ? " disabled" : "") + '>' + icon("library") + ' Salvar como modelo</button></section>';
  }

  function pageSettingsMarkup(node) {
    return '<section class="vb-inspector-section"><h3>Documento</h3><label class="vb-field"><span>Nome da pagina</span><input data-vb-document-setting="name" value="' + esc(runtime.document.name) + '"></label><label class="vb-field"><span>Rota</span><input data-vb-document-setting="settings.slug" value="' + esc(runtime.document.settings.slug) + '"></label><label class="vb-field"><span>Titulo SEO</span><input data-vb-document-setting="settings.seo.title" value="' + esc(runtime.document.settings.seo && runtime.document.settings.seo.title || "") + '"></label><label class="vb-field"><span>Descricao SEO</span><textarea rows="4" data-vb-document-setting="settings.seo.description">' + esc(runtime.document.settings.seo && runtime.document.settings.seo.description || "") + '</textarea></label></section>' + advancedMarkup(node, definitionFor(node));
  }

  function inspectorBodyMarkup(node, definition) {
    if (node.id === runtime.document.rootId && runtime.inspectorTab === "advanced") return pageSettingsMarkup(node);
    if (runtime.inspectorTab === "content") return editorContextMarkup(node) + slotManagerMarkup(definition, node) + editableDescendantsMarkup(node) + '<section class="vb-inspector-section"><h3>Conteudo</h3>' + propsByGroups(definition, node, ["content", "data", "behavior"]) + '</section>';
    if (runtime.inspectorTab === "layout") return breakpointBarMarkup() + quickLayoutMarkup(node) + visualDimensionsMarkup(definition, node) + '<section class="vb-inspector-section"><h3>Propriedades</h3>' + propsByGroups(definition, node, ["layout"]) + '</section><section class="vb-inspector-section"><h3>Layout e espacamento</h3>' + styleGroupMarkup("layout", node, definition) + '</section>';
    if (runtime.inspectorTab === "style") return breakpointBarMarkup() + imageFocalMarkup(node) + '<section class="vb-inspector-section"><h3>Fundo e bordas</h3>' + propsByGroups(definition, node, ["style"]) + styleGroupMarkup("style", node, definition) + '</section>';
    if (runtime.inspectorTab === "typography") return breakpointBarMarkup() + '<section class="vb-inspector-section"><h3>Tipografia</h3>' + styleGroupMarkup("typography", node, definition) + '</section>';
    if (runtime.inspectorTab === "responsive") return responsiveMarkup(node, definition);
    if (runtime.inspectorTab === "effects") return breakpointBarMarkup() + '<section class="vb-inspector-section"><h3>Efeitos e posicionamento</h3>' + propsByGroups(definition, node, ["effects"]) + styleGroupMarkup("effects", node, definition) + '</section>';
    return advancedMarkup(node, definition);
  }

  function statusMarkup() {
    const validation = TB.validateDocument(runtime.document);
    const template = TB.templateRegistry.get(runtime.document.meta && runtime.document.meta.templateId || "provider-classic");
    return '<footer class="vb-studio__status"><span data-vb-save-status class="is-' + esc(runtime.saveStatus) + '"><i></i>' + saveStatusLabel() + '</span><span>' + icon("boxes") + Object.keys(runtime.document.nodes).length + ' componentes</span><span class="vb-status-template">' + icon("layout-template") + esc(template && template.name || "Pagina personalizada") + '</span><button type="button" data-vb-action="validate" class="' + (validation.valid ? "is-valid" : "is-invalid") + '">' + icon(validation.valid ? "circle-check" : "triangle-alert") + (validation.valid ? "Estrutura valida" : validation.errors.length + " erro(s)") + '</button><span class="vb-studio__shortcut">Ctrl+Z desfaz &middot; Ctrl+C/V copia e cola</span></footer>';
  }

  function saveStatusLabel() {
    return { dirty: "Alteracoes pendentes", saving: "Salvando...", saved: "Rascunho salvo", conflict: "Conflito de versao", error: "Erro ao salvar" }[runtime.saveStatus] || "Rascunho salvo";
  }

  function dialogMarkup() {
    if (!runtime.dialog) return "";
    if (runtime.dialog === "validation") {
      const validation = runtime.diagnostics || TB.validateWorkspace(runtime.workspace);
      return '<div class="vb-dialog"><button type="button" class="vb-dialog__backdrop" data-vb-action="close-dialog" aria-label="Fechar"></button><section role="dialog" aria-modal="true" aria-labelledby="vb-dialog-title"><header><div><span>Pre-publicacao</span><h2 id="vb-dialog-title">Diagnostico do workspace</h2></div><button type="button" data-vb-action="close-dialog">' + icon("x") + '</button></header><div class="vb-validation-summary"><article class="' + (validation.valid ? "is-good" : "is-bad") + '"><strong>' + (validation.valid ? "Pronto" : validation.errors.length) + '</strong><span>' + (validation.valid ? "sem erros bloqueadores" : "erros bloqueadores") + '</span></article><article><strong>' + validation.warnings.length + '</strong><span>avisos para revisar</span></article><article><strong>' + (validation.documentCount || 1) + '</strong><span>paginas verificadas</span></article></div><div class="vb-diagnostic-list">' + validation.errors.concat(validation.warnings).slice(0, 80).map(function (entry) { return '<article class="' + (validation.errors.includes(entry) ? "is-error" : "is-warning") + '">' + icon(validation.errors.includes(entry) ? "circle-x" : "triangle-alert") + '<div><strong>' + esc(entry.message) + '</strong><code>' + esc(entry.path || "workspace") + '</code></div></article>'; }).join("") + (validation.valid && !validation.warnings.length ? '<div class="vb-empty-panel">' + icon("shield-check") + '<strong>Documento consistente</strong><p>Componentes, referencias, rotas e propriedades passaram pela validacao.</p></div>' : "") + '</div><footer><button type="button" class="vb-toolbar-button" data-vb-action="close-dialog">Fechar</button><button type="button" class="vb-toolbar-button vb-toolbar-button--primary" data-vb-action="publish"' + (validation.valid ? "" : " disabled") + '>' + icon("rocket") + ' Publicar workspace</button></footer></section></div>';
    }
    return "";
  }

  function mount(root, options) {
    runtime.root = root;
    runtime.options = options || {};
    if (runtime.abort) runtime.abort.abort();
    runtime.abort = new AbortController();
    const signal = runtime.abort.signal;
    root.addEventListener("click", onClick, { signal: signal });
    root.addEventListener("change", onChange, { signal: signal });
    root.addEventListener("input", onInput, { signal: signal });
    root.addEventListener("dragstart", onDragStart, { signal: signal });
    root.addEventListener("dragend", onDragEnd, { signal: signal });
    root.addEventListener("dragover", onDragOver, { signal: signal });
    root.addEventListener("dragleave", onDragLeave, { signal: signal });
    root.addEventListener("drop", onDrop, { signal: signal });
    window.addEventListener("message", onPreviewMessage, { signal: signal });
    window.addEventListener("keydown", onKeyDown, { signal: signal });
    window.addEventListener("resize", fitCanvas, { signal: signal });
    const frame = root.querySelector("#vb-preview-frame");
    if (frame) frame.addEventListener("load", sendPreview, { signal: signal });
    refreshIcons();
    requestAnimationFrame(fitCanvas);
    sendPreview();
  }

  function unmount() {
    if (runtime.autosave && runtime.autosave.pending) runtime.autosave.flush();
    if (runtime.abort) runtime.abort.abort();
    runtime.abort = null;
    runtime.root = null;
  }

  function refreshIcons() {
    if (runtime.options.refreshIcons) runtime.options.refreshIcons();
    else if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
  }

  function notify(message, type) {
    if (runtime.options.toast) runtime.options.toast(message, type);
    else console.info(message);
  }

  function updateStatus() {
    if (!runtime.root) return;
    const status = runtime.root.querySelector("[data-vb-save-status]");
    if (status) { status.className = "is-" + runtime.saveStatus; status.innerHTML = "<i></i>" + saveStatusLabel(); }
  }

  function repaintPanels(options) {
    if (!runtime.root) return;
    const config = options || {};
    const left = runtime.root.querySelector("[data-vb-left-content]");
    if (left && config.left !== false) left.innerHTML = leftContentMarkup();
    const inspector = runtime.root.querySelector(".vb-studio__inspector");
    if (inspector && config.inspector !== false) inspector.outerHTML = inspectorMarkup();
    const footer = runtime.root.querySelector(".vb-studio__status");
    if (footer) footer.outerHTML = statusMarkup();
    const canvasContext = runtime.root.querySelector(".vb-canvas-context");
    if (canvasContext) canvasContext.innerHTML = canvasContextMarkup();
    const oldDialog = runtime.root.querySelector(".vb-dialog");
    if (oldDialog) oldDialog.remove();
    if (runtime.dialog) runtime.root.insertAdjacentHTML("beforeend", dialogMarkup());
    updateToolbarState();
    updateMobilePanelState();
    refreshIcons();
  }

  function updateMobilePanelState() {
    if (!runtime.root) return;
    runtime.root.dataset.vbMobilePanel = runtime.mobilePanel;
    runtime.root.querySelectorAll("[data-vb-mobile-panel]").forEach(function (button) {
      if (button === runtime.root) return;
      button.classList.toggle("is-active", button.dataset.vbMobilePanel === runtime.mobilePanel);
    });
  }

  function updateToolbarState() {
    if (!runtime.root) return;
    const history = historyFor(runtime.document.documentId);
    const undo = runtime.root.querySelector('[data-vb-action="undo"]');
    const redo = runtime.root.querySelector('[data-vb-action="redo"]');
    if (undo) undo.disabled = !history.canUndo();
    if (redo) redo.disabled = !history.canRedo();
    const paste = runtime.root.querySelector('[data-vb-action="paste"]');
    if (paste) paste.disabled = !runtime.clipboard;
  }

  function scheduleSave() {
    runtime.workspace.documents[runtime.document.documentId] = runtime.document;
    runtime.workspace.activeDocumentId = runtime.document.documentId;
    runtime.autosave.schedule(runtime.workspace);
  }

  function execute(command, options) {
    if (!can("document.edit")) { notify("Seu perfil possui acesso somente para visualizacao.", "error"); return null; }
    try {
      clearTimeout(runtime.previewTimer);
      runtime.previewTimer = null;
      const result = historyFor(runtime.document.documentId).execute(runtime.document, command);
      runtime.document = result.document;
      runtime.workspace.documents[runtime.document.documentId] = runtime.document;
      if (options && options.select) runtime.selectedId = options.select === true ? result.selectionId : options.select;
      else if (!runtime.document.nodes[runtime.selectedId]) runtime.selectedId = result.selectionId || runtime.document.rootId;
      scheduleSave();
      repaintPanels();
      sendPreview();
      return result;
    } catch (error) { notify(error.message, "error"); return null; }
  }

  function setNodeValue(path, value, label) {
    return execute({ type: "set", payload: { path: "nodes." + runtime.selectedId + "." + path, value: value }, label: label || "Editar componente" });
  }

  function setNodeValues(entries, label) {
    const commands = Object.keys(entries).map(function (path) {
      return { type: "set", payload: { path: "nodes." + runtime.selectedId + "." + path, value: entries[path] }, label: label };
    });
    return execute({ type: "batch", payload: { commands: commands, selectionId: runtime.selectedId }, label: label || "Editar componente" }, { select: runtime.selectedId });
  }

  function setCurrentStyles(values, label) {
    const prefix = "styles." + currentBreakpoint() + "." + runtime.visualState + ".";
    const entries = {};
    Object.keys(values).forEach(function (key) { entries[prefix + key] = values[key]; });
    return setNodeValues(entries, label || "Editar estilo");
  }

  function sendPreview(documentValue) {
    if (!runtime.root) return;
    const frame = runtime.root.querySelector("#vb-preview-frame");
    if (!frame || !frame.contentWindow) return;
    const previewDocument = documentValue && documentValue.nodes ? documentValue : runtime.document;
    frame.contentWindow.postMessage(TB.createMessage("render", runtime.session, { document: previewDocument, selectedId: runtime.selectedId, device: runtime.device }), location.origin);
  }

  function previewMutation(path, value) {
    if (!runtime.document || !path) return;
    const documentValue = TB.clone(runtime.document);
    try { TB.setAt(documentValue, path, value); }
    catch (error) { return; }
    clearTimeout(runtime.previewTimer);
    runtime.previewTimer = setTimeout(function () {
      runtime.previewTimer = null;
      sendPreview(documentValue);
    }, 45);
  }

  function alignmentStyles(key, value) {
    const node = selectedNode();
    const values = { [key]: value };
    if (value && (key === "justifyContent" || key === "alignItems")) {
      const display = effectiveStyle(node, "display");
      if (!["flex", "inline-flex", "grid"].includes(display)) values.display = "flex";
    }
    return values;
  }

  function fitCanvas() {
    if (!runtime.root) return;
    const stage = runtime.root.querySelector(".vb-canvas-stage");
    if (!stage) return;
    const viewport = stage.querySelector(".vb-canvas-viewport");
    const device = stage.querySelector(".vb-canvas-device");
    if (!viewport || !device) return;
    const targetWidth = runtime.device === "mobile" ? 390 : runtime.device === "tablet" ? 768 : 1440;
    const available = Math.max(280, stage.clientWidth - 52);
    const scale = Math.max(.25, Math.min(runtime.zoom / 100, available / targetWidth));
    stage.style.setProperty("--vb-scale", scale.toFixed(4));
    const visualHeight = Math.max(560, stage.clientHeight - 8);
    viewport.style.width = Math.round(targetWidth * scale) + "px";
    viewport.style.height = visualHeight + "px";
    device.style.width = targetWidth + "px";
    device.style.height = Math.round(visualHeight / scale) + "px";
  }

  function postPreview(type, payload) {
    const frame = runtime.root && runtime.root.querySelector("#vb-preview-frame");
    if (frame && frame.contentWindow) frame.contentWindow.postMessage(TB.createMessage(type, runtime.session, payload), location.origin);
  }

  function firstSlot(node, childType) {
    const definition = definitionFor(node);
    return Object.keys(definition && definition.slots || {}).find(function (slotName) { return TB.canInsert(runtime.document, node.id, slotName, childType).ok; }) || "";
  }

  function placementFor(type) {
    let current = selectedNode();
    while (current) {
      const slot = firstSlot(current, type);
      if (slot) return { parentId: current.id, slot: slot, index: (current.slots[slot] || []).length };
      const parent = TB.parentOf(runtime.document, current.id);
      if (!parent) break;
      if (TB.canInsert(runtime.document, parent.parentId, parent.slot, type).ok) return { parentId: parent.parentId, slot: parent.slot, index: parent.index + 1 };
      current = runtime.document.nodes[parent.parentId];
    }
    const root = runtime.document.nodes[runtime.document.rootId];
    const slot = firstSlot(root, type);
    return slot ? { parentId: root.id, slot: slot, index: (root.slots[slot] || []).length } : null;
  }

  function insertComponent(type, placement) {
    const target = placement || placementFor(type);
    if (!target) { notify("Selecione um container compativel para inserir este componente.", "error"); return; }
    const subtree = TB.createComponentSubtree(type);
    const node = subtree.nodes[subtree.rootId];
    const definition = TB.registry.get(type);
    const parent = runtime.document.nodes[target.parentId];
    const parentLocation = parent && TB.parentOf(runtime.document, parent.id);
    const section = parentLocation && runtime.document.nodes[parentLocation.parentId];
    const isEmptyStage = definition && definition.editor && definition.editor.stage && parent && parent.type === "layout.container" && target.slot === "default" && !(parent.slots.default || []).length && section && section.type === "layout.section" && TB.childIds(section).length === 1;
    const insert = { type: "insert-subtree", payload: { subtree: subtree, parentId: target.parentId, slot: target.slot, index: target.index } };
    const command = isEmptyStage ? { type: "batch", payload: { selectionId: node.id, commands: [
      insert,
      { type: "set", payload: { path: "nodes." + parent.id + ".styles.base.normal.width", value: "100%" } },
      { type: "set", payload: { path: "nodes." + parent.id + ".styles.base.normal.maxWidth", value: "100%" } },
      { type: "set", payload: { path: "nodes." + section.id + ".styles.base.normal.paddingTop", value: "0" } },
      { type: "set", payload: { path: "nodes." + section.id + ".styles.base.normal.paddingBottom", value: "0" } },
    ] }, label: "Adicionar destaque em largura total" } : { ...insert, label: "Adicionar " + node.name };
    const result = execute(command, { select: node.id });
    if (result) {
      if (window.matchMedia("(max-width: 1020px)").matches) { runtime.mobilePanel = "canvas"; updateMobilePanelState(); }
      notify(node.name + " adicionado", "success");
      window.setTimeout(function () { postPreview("scroll-to", { id: node.id }); }, 120);
    }
  }

  function moveComponent(nodeId, placement) {
    if (!placement || nodeId === placement.parentId) return;
    execute({ type: "move", payload: { nodeId: nodeId, parentId: placement.parentId, slot: placement.slot, index: placement.index }, label: "Mover componente" }, { select: nodeId });
  }

  function treePlacement(targetId, position, childType) {
    const target = runtime.document.nodes[targetId];
    if (!target) return null;
    if (position === "inside") {
      const definition = definitionFor(target);
      const slot = definition && Object.keys(definition.slots || {}).find(function (slotName) { return !childType || TB.canInsert(runtime.document, target.id, slotName, childType).ok; });
      if (slot) return { parentId: target.id, slot: slot, index: (target.slots[slot] || []).length };
    }
    const parent = TB.parentOf(runtime.document, targetId);
    if (!parent) return null;
    return { parentId: parent.parentId, slot: parent.slot, index: parent.index + (position === "after" ? 1 : 0) };
  }

  function selectNode(id) {
    if (!runtime.document.nodes[id]) return;
    runtime.selectedId = id;
    let current = id;
    while (current) { runtime.expanded.add(current); const parent = TB.parentOf(runtime.document, current); current = parent && parent.parentId; }
    if (window.matchMedia("(max-width: 1020px)").matches) runtime.mobilePanel = "inspector";
    repaintPanels();
    sendPreview();
  }

  function switchDocument(id) {
    if (!runtime.workspace.documents[id]) return;
    runtime.workspace.activeDocumentId = id;
    runtime.document = runtime.workspace.documents[id];
    runtime.selectedId = initialSelection(runtime.document);
    runtime.expanded = new Set([runtime.document.rootId]);
    scheduleSave();
    if (runtime.root) {
      runtime.root.innerHTML = toolbarMarkup() + mobileWorkspaceMarkup() + '<div class="vb-studio__workspace">' + leftPanelMarkup() + canvasMarkup() + inspectorMarkup() + '</div>' + statusMarkup() + dialogMarkup();
      mount(runtime.root, runtime.options);
    }
  }

  function saveTemplateBackup(documentValue) {
    const prefix = "fl-vb-template-backup:" + runtime.tenant + ":";
    const indexKey = prefix + "index";
    let keys = [];
    try {
      const stored = JSON.parse(localStorage.getItem(indexKey) || "[]");
      if (Array.isArray(stored)) keys = stored.filter(function (key) { return typeof key === "string" && key.startsWith(prefix) && key !== indexKey; });
    } catch (error) { keys = []; }
    while (keys.length >= 5) localStorage.removeItem(keys.pop());
    const backupKey = prefix + Date.now();
    try {
      localStorage.setItem(backupKey, JSON.stringify(documentValue));
      localStorage.setItem(indexKey, JSON.stringify([backupKey].concat(keys)));
    } catch (error) {
      keys.forEach(function (key) { localStorage.removeItem(key); });
      try {
        localStorage.setItem(backupKey, JSON.stringify(documentValue));
        localStorage.setItem(indexKey, JSON.stringify([backupKey]));
      } catch (retryError) {
        localStorage.removeItem(backupKey);
        throw new Error("Nao foi possivel criar o backup local antes de trocar o template.");
      }
    }
    return backupKey;
  }

  function replaceHomeTemplate(templateId, message) {
    if (!runtime.document.settings || runtime.document.settings.slug !== "/") return;
    const previous = runtime.document;
    const backupKey = saveTemplateBackup(previous);
    const next = TB.createTemplateDocument(templateId, runtime.state);
    next.name = previous.name;
    next.settings = { ...next.settings, seo: TB.clone(previous.settings.seo || next.settings.seo) };
    delete runtime.workspace.documents[previous.documentId];
    runtime.workspace.documents[next.documentId] = next;
    runtime.workspace.meta = { ...(runtime.workspace.meta || {}), activeTemplateId: templateId, templateBackupKey: backupKey };
    runtime.histories.set(next.documentId, new TB.CommandHistory(120));
    switchDocument(next.documentId);
    notify(message || "Template aplicado na Home", "success");
  }

  function applyTemplate(templateId) {
    const definition = TB.templateRegistry.get(templateId);
    if (!definition || runtime.document.settings.slug !== "/") return;
    if (!window.confirm("Aplicar o template " + definition.name + "? A Home atual sera guardada como backup local.")) return;
    replaceHomeTemplate(templateId, definition.name + " aplicado com sucesso");
  }

  function applyGlobalFont(key, value) {
    if (!TB.designCatalog || !TB.designCatalog.font(value)) return;
    execute({
      type: "batch",
      payload: { commands: [
        { type: "set", payload: { path: "theme.tokens." + key, value: value }, label: "Alterar fonte global" },
        { type: "set", payload: { path: "theme.darkTokens." + key, value: value }, label: "Alterar fonte global" },
      ], selectionId: runtime.selectedId },
      label: "Alterar fonte global",
    }, { select: runtime.selectedId });
  }

  function newPage() {
    const count = Object.keys(runtime.workspace.documents).length + 1;
    const documentValue = TB.createDocument({ name: "Nova pagina " + count, slug: "/nova-pagina-" + count });
    const root = documentValue.nodes[documentValue.rootId];
    const header = TB.createNode("navigation.header", { name: "Cabecalho global", meta: { locked: true } });
    const section = TB.createNode("layout.section", { name: "Conteudo principal" });
    const container = TB.createNode("layout.container", { name: "Container" });
    const heading = TB.createNode("content.heading", { name: "Titulo", props: { text: "Nova pagina", level: "1" } });
    const footer = TB.createNode("navigation.footer", { name: "Rodape global", meta: { locked: true } });
    root.slots.default.push(header.id, section.id, footer.id);
    section.slots.default.push(container.id);
    container.slots.default.push(heading.id);
    Object.assign(documentValue.nodes, { [header.id]: header, [section.id]: section, [container.id]: container, [heading.id]: heading, [footer.id]: footer });
    runtime.workspace.documents[documentValue.documentId] = documentValue;
    switchDocument(documentValue.documentId);
    notify("Nova pagina criada em rascunho", "success");
  }

  function duplicatePage(id) {
    const source = runtime.workspace.documents[id];
    if (!source) return;
    const copy = TB.clone(source);
    copy.documentId = TB.uid("document");
    copy.name += " - copia";
    copy.settings.slug = String(copy.settings.slug).replace(/\/$/, "") + "-copia";
    copy.meta.createdAt = new Date().toISOString();
    copy.meta.updatedAt = copy.meta.createdAt;
    runtime.workspace.documents[copy.documentId] = copy;
    switchDocument(copy.documentId);
  }

  function deletePage(id) {
    const ids = Object.keys(runtime.workspace.documents);
    if (ids.length < 2 || !runtime.workspace.documents[id]) return;
    if (!window.confirm("Excluir esta pagina do rascunho?")) return;
    delete runtime.workspace.documents[id];
    switchDocument(Object.keys(runtime.workspace.documents)[0]);
  }

  function copySelected() {
    const node = selectedNode();
    if (!node) return;
    runtime.clipboard = { kind: "component", subtree: TB.extractSubtree(runtime.document, node.id), sourceDocumentId: runtime.document.documentId };
    updateToolbarState();
    notify("Componente copiado", "success");
  }

  function pasteSelected() {
    if (!runtime.clipboard || runtime.clipboard.kind !== "component") return;
    const subtree = TB.remapSubtree(runtime.clipboard.subtree.nodes, runtime.clipboard.subtree.rootId);
    const root = subtree.nodes[subtree.rootId];
    const placement = placementFor(root.type);
    if (!placement) { notify("Nao ha um destino compativel para colar.", "error"); return; }
    execute({ type: "insert-subtree", payload: { parentId: placement.parentId, slot: placement.slot, index: placement.index, subtree: subtree }, label: "Colar componente" }, { select: subtree.rootId });
  }

  function undo() {
    const result = historyFor(runtime.document.documentId).undo(runtime.document);
    runtime.document = result.document;
    runtime.workspace.documents[runtime.document.documentId] = runtime.document;
    if (!runtime.document.nodes[runtime.selectedId]) runtime.selectedId = runtime.document.rootId;
    scheduleSave(); repaintPanels(); sendPreview();
  }

  function redo() {
    const result = historyFor(runtime.document.documentId).redo(runtime.document);
    runtime.document = result.document;
    runtime.workspace.documents[runtime.document.documentId] = runtime.document;
    if (result.selectionId && runtime.document.nodes[result.selectionId]) runtime.selectedId = result.selectionId;
    scheduleSave(); repaintPanels(); sendPreview();
  }

  function validate() {
    runtime.diagnostics = TB.validateWorkspace(runtime.workspace);
    runtime.dialog = "validation";
    repaintPanels({ left: false, inspector: false });
  }

  async function publish() {
    if (!can("document.publish")) { notify("Seu perfil nao possui permissao para publicar.", "error"); return; }
    try {
      if (runtime.autosave) await runtime.autosave.flush();
      const validation = TB.validateWorkspace(runtime.workspace);
      if (!validation.valid) { runtime.diagnostics = validation; runtime.dialog = "validation"; repaintPanels({ left: false, inspector: false }); notify("Corrija os erros antes de publicar.", "error"); return; }
      const release = TB.storage.publishWorkspace(runtime.state, runtime.workspace);
      if (runtime.options.onPublish) runtime.options.onPublish(release);
      runtime.dialog = "";
      repaintPanels({ left: false });
      notify("Tema publicado com sucesso", "success");
    } catch (error) { notify(error.message, "error"); }
  }

  function saveFragment() {
    const node = selectedNode();
    if (!node || node.id === runtime.document.rootId) return;
    TB.storage.saveFragment(runtime.state, { name: node.name, category: definitionFor(node).category, subtree: TB.extractSubtree(runtime.document, node.id) });
    runtime.leftTab = "saved";
    repaintPanels();
    notify("Modelo salvo na biblioteca", "success");
  }

  function insertFragment(id) {
    const fragment = TB.storage.fragments(runtime.state).find(function (entry) { return entry.id === id; });
    if (!fragment) return;
    const subtree = TB.remapSubtree(fragment.subtree.nodes, fragment.subtree.rootId);
    const root = subtree.nodes[subtree.rootId];
    const placement = placementFor(root.type);
    if (!placement) { notify("Selecione um container compativel.", "error"); return; }
    execute({ type: "insert-subtree", payload: { parentId: placement.parentId, slot: placement.slot, index: placement.index, subtree: subtree }, label: "Inserir modelo salvo" }, { select: subtree.rootId });
  }

  function openPreview() {
    if (runtime.autosave) runtime.autosave.flush();
    const route = encodeURIComponent(runtime.document.settings.slug || "/");
    window.open("./builder-preview.html?mode=preview&route=" + route + "&device=" + runtime.device, "_blank", "noopener");
  }

  function onClick(event) {
    const mobilePanel = event.target.closest("[data-vb-mobile-panel]");
    if (mobilePanel && mobilePanel !== runtime.root) { runtime.mobilePanel = mobilePanel.dataset.vbMobilePanel; updateMobilePanelState(); if (runtime.mobilePanel === "canvas") requestAnimationFrame(fitCanvas); return; }
    const leftTab = event.target.closest("[data-vb-left-tab]");
    if (leftTab) { runtime.leftTab = leftTab.dataset.vbLeftTab; const nav = leftTab.parentElement; nav.querySelectorAll("button").forEach(function (button) { button.classList.toggle("is-active", button === leftTab); }); const content = runtime.root.querySelector("[data-vb-left-content]"); if (content) content.innerHTML = leftContentMarkup(); refreshIcons(); return; }
    const inspectorTab = event.target.closest("[data-vb-inspector-tab]");
    if (inspectorTab) { runtime.inspectorTab = inspectorTab.dataset.vbInspectorTab; repaintPanels({ left: false }); return; }
    const device = event.target.closest("[data-vb-device]");
    if (device) { runtime.device = device.dataset.vbDevice; const stage = runtime.root.querySelector(".vb-canvas-stage"); if (stage) stage.className = "vb-canvas-stage is-" + runtime.device; repaintPanels({ left: false }); fitCanvas(); sendPreview(); return; }
    const select = event.target.closest("[data-vb-select]");
    if (select) { selectNode(select.dataset.vbSelect); return; }
    const openPage = event.target.closest("[data-vb-open-page]");
    if (openPage) { switchDocument(openPage.dataset.vbOpenPage); return; }
    const applyTemplateButton = event.target.closest("[data-vb-apply-template]");
    if (applyTemplateButton) { applyTemplate(applyTemplateButton.dataset.vbApplyTemplate); return; }
    const fontToken = event.target.closest("[data-vb-font-token]");
    if (fontToken) { applyGlobalFont(fontToken.dataset.vbFontToken, fontToken.dataset.value); return; }
    const iconChoice = event.target.closest("[data-vb-icon-choice]");
    if (iconChoice) { setNodeValue("props." + iconChoice.dataset.prop, iconChoice.dataset.vbIconChoice, "Escolher icone"); return; }
    const component = event.target.closest("[data-vb-component]");
    if (component) { insertComponent(component.dataset.vbComponent); return; }
    const media = event.target.closest("[data-vb-media-pick]");
    if (media) { setNodeValue("props." + media.dataset.vbMediaPick, media.dataset.url, "Selecionar imagem"); return; }
    const styleChoice = event.target.closest("[data-vb-style-choice]");
    if (styleChoice) { setCurrentStyles(alignmentStyles(styleChoice.dataset.vbStyleChoice, styleChoice.dataset.value), "Ajustar alinhamento"); return; }
    const dimensionUnit = event.target.closest("[data-vb-dimension-unit]");
    if (dimensionUnit) {
      const definition = definitionFor(selectedNode());
      const control = definition && definition.editor && (definition.editor.dimensionControls || []).find(function (entry) { return entry.key === dimensionUnit.dataset.key; });
      const settings = control && control.units && control.units[dimensionUnit.dataset.vbDimensionUnit];
      if (settings) setCurrentStyles({ [control.key]: String(settings.value) + dimensionUnit.dataset.vbDimensionUnit }, "Alterar unidade da dimensao");
      return;
    }
    const propChoice = event.target.closest("[data-vb-prop-choice]");
    if (propChoice) { setNodeValue("props." + propChoice.dataset.vbPropChoice, propChoice.dataset.value, "Ajustar enquadramento"); return; }
    const imageAlign = event.target.closest("[data-vb-image-align]");
    if (imageAlign) {
      const value = imageAlign.dataset.vbImageAlign;
      const styles = { display: "block", marginLeft: value === "left" ? "0" : "auto", marginRight: value === "right" ? "0" : "auto" };
      const width = effectiveStyle(selectedNode(), "width");
      if (value !== "left" && (!width || width === "100%")) styles.width = "75%";
      setCurrentStyles(styles, "Alinhar imagem");
      return;
    }
    const imageWidth = event.target.closest("[data-vb-image-width]");
    if (imageWidth) { setCurrentStyles({ width: imageWidth.dataset.vbImageWidth }, "Redimensionar imagem"); return; }
    const imageFocal = event.target.closest("[data-vb-image-focal]");
    if (imageFocal) {
      const point = imageFocal.dataset.vbImageFocal.split(",").map(Number);
      setNodeValues({ "props.focalX": point[0], "props.focalY": point[1] }, "Ajustar ponto focal");
      return;
    }
    const heroMode = event.target.closest("[data-vb-hero-mode]");
    if (heroMode) {
      const node = selectedNode();
      if (!node || node.type !== "template.hero") return;
      const mode = heroMode.dataset.vbHeroMode === "banner" ? "banner" : "slider";
      const entries = { "props.mode": mode };
      const slides = node.slots && node.slots.slides || [];
      if (mode === "banner" && !slides.includes(node.props.bannerId)) entries["props.bannerId"] = slides[0] || "";
      setNodeValues(entries, mode === "banner" ? "Usar banner estatico" : "Usar slider");
      return;
    }
    const heroBanner = event.target.closest("[data-vb-set-hero-banner]");
    if (heroBanner) {
      const node = selectedNode();
      if (node && node.type === "template.hero" && (node.slots.slides || []).includes(heroBanner.dataset.vbSetHeroBanner)) setNodeValue("props.bannerId", heroBanner.dataset.vbSetHeroBanner, "Escolher banner estatico");
      return;
    }
    const quick = event.target.closest("[data-vb-quick-add]");
    if (quick) { const node = selectedNode(); const slot = quick.dataset.slot; insertComponent(quick.dataset.vbQuickAdd, { parentId: node.id, slot: slot, index: (node.slots[slot] || []).length }); return; }
    const slotAdd = event.target.closest("[data-vb-slot-add]");
    if (slotAdd) { const node = selectedNode(); const slot = slotAdd.dataset.slot; insertComponent(slotAdd.dataset.vbSlotAdd, { parentId: node.id, slot: slot, index: (node.slots[slot] || []).length }); return; }
    const slotMove = event.target.closest("[data-vb-slot-move]");
    if (slotMove) {
      const parent = TB.parentOf(runtime.document, slotMove.dataset.id);
      if (parent) {
        // The move command removes the node before normalizing the target index.
        const index = slotMove.dataset.vbSlotMove === "up" ? parent.index - 1 : parent.index + 2;
        moveComponent(slotMove.dataset.id, { parentId: parent.parentId, slot: parent.slot, index: index });
      }
      return;
    }
    const slotDuplicate = event.target.closest("[data-vb-slot-duplicate]");
    if (slotDuplicate) { execute({ type: "duplicate", payload: { nodeId: slotDuplicate.dataset.vbSlotDuplicate }, label: "Duplicar item" }, { select: true }); return; }
    const slotDelete = event.target.closest("[data-vb-slot-delete]");
    if (slotDelete) {
      const item = runtime.document.nodes[slotDelete.dataset.vbSlotDelete];
      if (item && window.confirm("Excluir " + item.name + "?")) {
        const location = TB.parentOf(runtime.document, item.id);
        const parent = location && runtime.document.nodes[location.parentId];
        if (parent && parent.type === "template.hero" && parent.props.bannerId === item.id) {
          const nextBanner = (parent.slots[location.slot] || []).find(function (id) { return id !== item.id; }) || "";
          execute({ type: "batch", payload: { commands: [
            { type: "set", payload: { path: "nodes." + parent.id + ".props.bannerId", value: nextBanner } },
            { type: "delete", payload: { nodeId: item.id } },
          ], selectionId: parent.id }, label: "Excluir banner" }, { select: parent.id });
        } else execute({ type: "delete", payload: { nodeId: item.id }, label: "Excluir item" });
      }
      return;
    }
    const insertSaved = event.target.closest("[data-vb-insert-fragment]");
    if (insertSaved) { insertFragment(insertSaved.dataset.vbInsertFragment); return; }
    const deleteSaved = event.target.closest("[data-vb-delete-fragment]");
    if (deleteSaved) { TB.storage.deleteFragment(runtime.state, deleteSaved.dataset.vbDeleteFragment); repaintPanels({ inspector: false }); return; }
    const format = event.target.closest("[data-vb-format]");
    if (format) { let value = ""; if (format.dataset.vbFormat === "createLink") value = window.prompt("Endereco do link", "https://") || ""; postPreview("format", { command: format.dataset.vbFormat, value: value }); return; }
    const action = event.target.closest("[data-vb-action]");
    if (!action) return;
    const name = action.dataset.vbAction;
    if (name === "undo") undo();
    else if (name === "redo") redo();
    else if (name === "copy") copySelected();
    else if (name === "paste") pasteSelected();
    else if (name === "duplicate" && runtime.selectedId !== runtime.document.rootId) execute({ type: "duplicate", payload: { nodeId: runtime.selectedId }, label: "Duplicar componente" }, { select: true });
    else if (name === "delete") { const node = selectedNode(); if (node && node.id !== runtime.document.rootId && !(node.meta && node.meta.locked) && window.confirm("Excluir " + node.name + " e seus componentes internos?")) execute({ type: "delete", payload: { nodeId: node.id }, label: "Excluir componente" }); }
    else if (name === "copy-style") { const node = selectedNode(); if (node) { runtime.styleClipboard = TB.clone(node.styles); notify("Estilos copiados", "success"); repaintPanels({ left: false }); } }
    else if (name === "paste-style" && runtime.styleClipboard) setNodeValue("styles", runtime.styleClipboard, "Colar estilos");
    else if (name === "visibility") { const id = action.dataset.id; runtime.selectedId = id; const node = selectedNode(); const breakpoint = currentBreakpoint(); setNodeValue("visibility." + breakpoint, node.visibility[breakpoint] === false, "Alterar visibilidade"); }
    else if (name === "toggle-layer") { const id = action.dataset.id; if (runtime.expanded.has(id)) runtime.expanded.delete(id); else runtime.expanded.add(id); repaintPanels({ inspector: false }); }
    else if (name === "expand-all") { Object.keys(runtime.document.nodes).forEach(function (id) { runtime.expanded.add(id); }); repaintPanels({ inspector: false }); }
    else if (name === "locate") postPreview("scroll-to", { id: runtime.selectedId });
    else if (name === "zoom-in" || name === "zoom-out") { runtime.zoom = Math.max(40, Math.min(120, runtime.zoom + (name === "zoom-in" ? 5 : -5))); fitCanvas(); const output = runtime.root.querySelector(".vb-studio__zoom output"); if (output) output.textContent = runtime.zoom + "%"; }
    else if (name === "new-page") newPage();
    else if (name === "sync-home" && runtime.document.settings.slug === "/") {
      const templateId = runtime.document.meta && runtime.document.meta.templateId || "provider-classic";
      if (!window.confirm("Restaurar o template atual? A versao deste rascunho sera guardada como backup local.")) return;
      replaceHomeTemplate(templateId, "Home restaurada a partir do template atual");
    }
    else if (name === "duplicate-page") duplicatePage(action.dataset.id);
    else if (name === "delete-page") deletePage(action.dataset.id);
    else if (name === "save-fragment") saveFragment();
    else if (name === "validate") validate();
    else if (name === "preview") openPreview();
    else if (name === "publish") publish();
    else if (name === "close-dialog") { runtime.dialog = ""; repaintPanels({ left: false, inspector: false }); }
  }

  function parseControlValue(control) {
    if (control.type === "checkbox") return control.checked;
    if (control.type === "number" || control.type === "range") return control.value === "" ? "" : Number(control.value);
    return control.value;
  }

  function onChange(event) {
    const target = event.target;
    if (target.matches("[data-vb-page-select]")) { switchDocument(target.value); return; }
    if (target.matches("[data-vb-state]")) { runtime.visualState = target.value; repaintPanels({ left: false }); return; }
    if (target.matches("[data-vb-prop]")) { setNodeValue("props." + target.dataset.vbProp, parseControlValue(target), "Editar conteudo"); return; }
    if (target.matches("[data-vb-dimension]")) { setCurrentStyles({ [target.dataset.vbDimension]: String(target.value) + target.dataset.unit }, "Redimensionar componente"); return; }
    if (target.matches("[data-vb-style]")) { const path = "styles." + currentBreakpoint() + "." + runtime.visualState + "." + target.dataset.vbStyle; setNodeValue(path, parseControlValue(target), "Editar estilo"); return; }
    if (target.matches("[data-vb-token]")) { execute({ type: "set", payload: { path: "theme.tokens." + target.dataset.vbToken, value: target.value }, label: "Editar token global" }); return; }
    if (target.matches("[data-vb-dark-token]")) { execute({ type: "set", payload: { path: "theme.darkTokens." + target.dataset.vbDarkToken, value: target.value }, label: "Editar token escuro" }); return; }
    if (target.matches("[data-vb-visibility]")) { setNodeValue("visibility." + currentBreakpoint(), target.checked, "Alterar visibilidade"); return; }
    if (target.matches("[data-vb-node-name]")) { setNodeValue("name", TB.plainText(target.value, 100), "Renomear componente"); return; }
    if (target.matches("[data-vb-binding]")) { const value = target.value ? { source: target.value, fallback: selectedNode().props[target.dataset.vbBinding] } : undefined; setNodeValue("bindings." + target.dataset.vbBinding, value, "Configurar dado dinamico"); return; }
    if (target.matches("[data-vb-document-setting]")) {
      const path = target.dataset.vbDocumentSetting;
      const value = path === "settings.slug" ? normalizeRoute(target.value) : TB.plainText(target.value, path.includes("description") ? 500 : 160);
      execute({ type: "set", payload: { path: path, value: value }, label: "Editar pagina" });
      return;
    }
    if (target.matches("[data-vb-media-upload]")) { handleMediaUpload(target.files && target.files[0], target.dataset.vbMediaUpload); }
  }

  function onInput(event) {
    const target = event.target;
    if (target.matches("[data-vb-library-search]")) { runtime.librarySearch = target.value; const panel = runtime.root.querySelector(".vb-component-library"); const heading = runtime.root.querySelector(".vb-panel-heading"); const wrapper = document.createElement("div"); wrapper.innerHTML = libraryMarkup(); const next = wrapper.querySelector(".vb-component-library"); const nextHeading = wrapper.querySelector(".vb-panel-heading"); if (panel && next) panel.replaceWith(next); if (heading && nextHeading) heading.replaceWith(nextHeading); refreshIcons(); }
    if (target.matches("[data-vb-icon-search]")) { const term = target.value.trim().toLowerCase(); const picker = target.closest(".vb-icon-library"); if (picker) picker.querySelectorAll("[data-vb-icon-choice]").forEach(function (button) { button.hidden = Boolean(term) && !button.dataset.vbIconChoice.includes(term); }); }
    if (target.matches('input[type="range"][data-vb-style]')) { const output = target.closest("label").querySelector("output"); if (output) output.value = target.value; }
    if (target.matches("[data-vb-dimension]")) {
      const value = String(target.value) + target.dataset.unit;
      const output = target.closest(".vb-dimension-control").querySelector("[data-vb-dimension-output]");
      if (output) output.value = value;
      previewMutation("nodes." + runtime.selectedId + ".styles." + currentBreakpoint() + "." + runtime.visualState + "." + target.dataset.vbDimension, value);
      return;
    }
    if (target.matches("[data-vb-prop]") && target.type !== "checkbox") previewMutation("nodes." + runtime.selectedId + ".props." + target.dataset.vbProp, parseControlValue(target));
    if (target.matches("[data-vb-style]") && target.type !== "checkbox") previewMutation("nodes." + runtime.selectedId + ".styles." + currentBreakpoint() + "." + runtime.visualState + "." + target.dataset.vbStyle, parseControlValue(target));
    if (target.matches("[data-vb-token]")) previewMutation("theme.tokens." + target.dataset.vbToken, target.value);
    if (target.matches("[data-vb-dark-token]")) previewMutation("theme.darkTokens." + target.dataset.vbDarkToken, target.value);
  }

  function normalizeRoute(value) {
    const route = "/" + String(value || "").trim().replace(/^\/+|\/+$/g, "").split("/").map(TB.slug).filter(Boolean).join("/");
    return route === "/" ? "/" : route;
  }

  function onDragStart(event) {
    const component = event.target.closest("[data-vb-component]");
    if (component) {
      runtime.draggingComponent = component.dataset.vbComponent;
      runtime.root.classList.add("is-vb-library-dragging");
      component.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("application/x-fl-vb-component", component.dataset.vbComponent);
      event.dataTransfer.setData("text/plain", "fl-component:" + component.dataset.vbComponent);
      return;
    }
    const treeNode = event.target.closest("[data-vb-tree-node]");
    if (treeNode && treeNode.draggable) { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-fl-vb-node", treeNode.dataset.vbTreeNode); event.dataTransfer.setData("text/plain", "fl-node:" + treeNode.dataset.vbTreeNode); treeNode.classList.add("is-dragging"); }
  }

  function dragPayload(dataTransfer) {
    let nodeId = "";
    let componentType = runtime.draggingComponent || "";
    try {
      nodeId = dataTransfer.getData("application/x-fl-vb-node") || "";
      componentType = dataTransfer.getData("application/x-fl-vb-component") || componentType;
      const plain = dataTransfer.getData("text/plain") || "";
      if (!nodeId && plain.startsWith("fl-node:")) nodeId = plain.slice(8);
      if (!componentType && plain.startsWith("fl-component:")) componentType = plain.slice(13);
      if (!nodeId && !componentType && runtime.document.nodes[plain]) nodeId = plain;
      if (!nodeId && !componentType && TB.registry.get(plain)) componentType = plain;
    } catch (error) { /* DataTransfer can hide values until drop. */ }
    return { nodeId: nodeId, componentType: componentType };
  }

  function clearPreviewDrop() {
    if (!runtime.root) return;
    const frame = runtime.root.querySelector("#vb-preview-frame");
    try {
      if (frame && frame.contentDocument) frame.contentDocument.querySelectorAll(".is-vb-drop-before,.is-vb-drop-after,.is-vb-drop-inside,.is-vb-drop-invalid").forEach(function (element) { element.classList.remove("is-vb-drop-before", "is-vb-drop-after", "is-vb-drop-inside", "is-vb-drop-invalid"); });
    } catch (error) { /* Preview is same-origin in supported deployments. */ }
    runtime.previewDrop = null;
    const label = runtime.root.querySelector("[data-vb-drop-label]");
    if (label) label.textContent = "Escolha uma posicao no site";
  }

  function validDropPlacement(targetId, preferredPosition, componentType) {
    const positions = [preferredPosition, "inside", "before", "after"].filter(function (value, index, list) { return list.indexOf(value) === index; });
    for (let index = 0; index < positions.length; index += 1) {
      const placement = treePlacement(targetId, positions[index], componentType);
      if (!placement) continue;
      const allowed = TB.canInsert(runtime.document, placement.parentId, placement.slot, componentType);
      if (allowed.ok) return { placement: placement, position: positions[index] };
    }
    return null;
  }

  function previewDropHit(event, componentType) {
    const frame = runtime.root && runtime.root.querySelector("#vb-preview-frame");
    if (!frame || !frame.contentWindow || !frame.contentDocument || !componentType) return null;
    const frameRect = frame.getBoundingClientRect();
    if (!frameRect.width || !frameRect.height) return null;
    const x = (event.clientX - frameRect.left) * (frame.contentWindow.innerWidth / frameRect.width);
    const y = (event.clientY - frameRect.top) * (frame.contentWindow.innerHeight / frameRect.height);
    const pointElement = frame.contentDocument.elementFromPoint(x, y);
    const target = pointElement && pointElement.closest("[data-vb-node]");
    if (!target) return null;
    const rectangle = target.getBoundingClientRect();
    const ratio = rectangle.height ? (y - rectangle.top) / rectangle.height : 0.5;
    const preferred = ratio < 0.22 ? "before" : ratio > 0.78 ? "after" : "inside";
    const result = validDropPlacement(target.dataset.vbNode, preferred, componentType);
    clearPreviewDrop();
    if (!result) {
      target.classList.add("is-vb-drop-invalid");
      const invalidLabel = runtime.root.querySelector("[data-vb-drop-label]");
      if (invalidLabel) invalidLabel.textContent = "Este componente nao cabe aqui";
      return null;
    }
    target.classList.add("is-vb-drop-" + result.position);
    const definition = TB.registry.get(componentType);
    const label = runtime.root.querySelector("[data-vb-drop-label]");
    if (label) label.textContent = (definition && definition.label || "Componente") + " em " + (target.dataset.vbLabel || "pagina");
    return { ...result.placement, targetId: target.dataset.vbNode, position: result.position };
  }

  function onDragEnd() {
    runtime.draggingComponent = "";
    if (runtime.root) runtime.root.classList.remove("is-vb-library-dragging");
    clearTreeDrop();
    clearPreviewDrop();
  }

  function clearTreeDrop() {
    if (!runtime.root) return;
    runtime.root.querySelectorAll(".is-drop-before,.is-drop-after,.is-drop-inside,.is-dragging").forEach(function (element) { element.classList.remove("is-drop-before", "is-drop-after", "is-drop-inside", "is-dragging"); });
  }

  function onDragOver(event) {
    const bridge = event.target.closest("[data-vb-preview-drop]");
    if (bridge) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      const payload = dragPayload(event.dataTransfer);
      runtime.previewDrop = previewDropHit(event, payload.componentType || runtime.draggingComponent);
      return;
    }
    const treeNode = event.target.closest("[data-vb-tree-node]");
    if (!treeNode) return;
    event.preventDefault();
    runtime.root.querySelectorAll(".is-drop-before,.is-drop-after,.is-drop-inside").forEach(function (element) { element.classList.remove("is-drop-before", "is-drop-after", "is-drop-inside"); });
    const row = treeNode.querySelector(":scope > .vb-layer-row");
    const rectangle = row.getBoundingClientRect();
    const ratio = (event.clientY - rectangle.top) / Math.max(1, rectangle.height);
    const position = ratio < .28 ? "before" : ratio > .72 ? "after" : "inside";
    treeNode.classList.add("is-drop-" + position);
    treeNode.dataset.dropPosition = position;
  }

  function onDragLeave(event) {
    const bridge = event.target.closest("[data-vb-preview-drop]");
    if (bridge && !bridge.contains(event.relatedTarget)) { clearPreviewDrop(); return; }
    const treeNode = event.target.closest("[data-vb-tree-node]");
    if (treeNode && !treeNode.contains(event.relatedTarget)) treeNode.classList.remove("is-drop-before", "is-drop-after", "is-drop-inside");
  }

  function onDrop(event) {
    const bridge = event.target.closest("[data-vb-preview-drop]");
    if (bridge) {
      event.preventDefault();
      const payload = dragPayload(event.dataTransfer);
      const placement = runtime.previewDrop || previewDropHit(event, payload.componentType || runtime.draggingComponent);
      const componentType = payload.componentType || runtime.draggingComponent;
      onDragEnd();
      if (placement && componentType) insertComponent(componentType, placement);
      return;
    }
    const treeNode = event.target.closest("[data-vb-tree-node]");
    if (!treeNode) return;
    event.preventDefault();
    const payload = dragPayload(event.dataTransfer);
    const nodeId = payload.nodeId;
    const componentType = payload.componentType;
    const childType = componentType || nodeId && runtime.document.nodes[nodeId] && runtime.document.nodes[nodeId].type;
    const placement = treePlacement(treeNode.dataset.vbTreeNode, treeNode.dataset.dropPosition || "inside", childType);
    clearTreeDrop();
    if (!placement) { onDragEnd(); return; }
    if (nodeId && nodeId !== treeNode.dataset.vbTreeNode) moveComponent(nodeId, placement);
    else if (componentType) insertComponent(componentType, placement);
    onDragEnd();
  }

  function onPreviewMessage(event) {
    const frame = runtime.root && runtime.root.querySelector("#vb-preview-frame");
    if (!frame || event.source !== frame.contentWindow || event.origin !== location.origin || !TB.validMessage(event, runtime.session)) return;
    const message = event.data;
    if (message.type === "ready") { runtime.previewReady = true; return; }
    if (message.type === "select") selectNode(message.payload.id);
    if (message.type === "inline-change") {
      if (!runtime.document.nodes[message.payload.id]) return;
      runtime.selectedId = message.payload.id;
      const value = message.payload.property === "html" ? sanitizeInlineHtml(message.payload.value) : TB.plainText(message.payload.value, 5000);
      setNodeValue("props." + message.payload.property, value, "Editar texto no preview");
    }
    if (message.type === "move") moveComponent(message.payload.id, message.payload.placement);
    if (message.type === "insert") insertComponent(message.payload.type, message.payload.placement);
    if (message.type === "error") notify(message.payload.message, "error");
  }

  function sanitizeInlineHtml(value) {
    const template = document.createElement("template");
    template.innerHTML = String(value || "");
    const allowed = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "A", "UL", "OL", "LI", "SPAN"]);
    Array.from(template.content.querySelectorAll("*")).forEach(function (node) {
      if (!allowed.has(node.tagName)) { node.replaceWith(document.createTextNode(node.textContent || "")); return; }
      Array.from(node.attributes).forEach(function (attribute) { if (!(node.tagName === "A" && ["href", "target", "rel"].includes(attribute.name))) node.removeAttribute(attribute.name); });
      if (node.tagName === "A") node.setAttribute("href", TB.safeUrl(node.getAttribute("href"), "#"));
    });
    return template.innerHTML.slice(0, 20000);
  }

  function onKeyDown(event) {
    if (!runtime.root || !runtime.root.isConnected) return;
    const editing = event.target.matches && event.target.matches("input,textarea,select,[contenteditable=true]");
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); return; }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c" && !editing) { event.preventDefault(); copySelected(); return; }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v" && !editing) { event.preventDefault(); pasteSelected(); return; }
    if (event.key === "Delete" && !editing) { const node = selectedNode(); if (node && node.id !== runtime.document.rootId && !(node.meta && node.meta.locked)) execute({ type: "delete", payload: { nodeId: node.id }, label: "Excluir componente" }); }
  }

  async function optimizeImage(file) {
    if (!file || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) throw new Error("Use JPG, PNG, WebP ou GIF.");
    if (file.size > 8 * 1024 * 1024) throw new Error("A imagem original deve ter no maximo 8 MB.");
    if (file.type === "image/gif") return { dataUrl: await readFile(file), width: 0, height: 0, bytes: file.size, originalBytes: file.size, type: file.type };
    const source = await readFile(file);
    const image = await loadImage(source);
    const scale = Math.min(1, 1920 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d", { alpha: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(function (resolve) { canvas.toBlob(resolve, "image/webp", .82); });
    if (!blob) throw new Error("Nao foi possivel converter a imagem.");
    return { dataUrl: await readFile(blob), width: canvas.width, height: canvas.height, bytes: blob.size, originalBytes: file.size, type: "image/webp" };
  }

  function readFile(file) { return new Promise(function (resolve, reject) { const reader = new FileReader(); reader.onload = function () { resolve(reader.result); }; reader.onerror = function () { reject(new Error("Falha ao ler o arquivo.")); }; reader.readAsDataURL(file); }); }
  function loadImage(source) { return new Promise(function (resolve, reject) { const image = new Image(); image.onload = function () { resolve(image); }; image.onerror = function () { reject(new Error("Imagem invalida.")); }; image.src = source; }); }

  async function handleMediaUpload(file, property) {
    try {
      const result = await optimizeImage(file);
      const item = { id: TB.uid("media"), name: TB.plainText(file.name.replace(/\.[^.]+$/, ""), 100), url: result.dataUrl, type: result.type, width: result.width, height: result.height, bytes: result.bytes, originalBytes: result.originalBytes, usage: "Theme Builder", createdAt: new Date().toISOString().slice(0, 10) };
      runtime.state.mediaLibrary = runtime.state.mediaLibrary || [];
      runtime.state.mediaLibrary.unshift(item);
      if (runtime.options.onStateChange) runtime.options.onStateChange(runtime.state, "Imagem otimizada no Theme Builder");
      else window.FL.saveState(runtime.state, false);
      setNodeValue("props." + property, item.url, "Enviar imagem");
      notify("Imagem comprimida e adicionada", "success");
    } catch (error) { notify(error.message, "error"); }
  }

  function getWorkspace() { return runtime.workspace ? TB.clone(runtime.workspace) : null; }
  function publishWorkspace() { return publish(); }

  window.FLVisualBuilderEditor = { render: render, mount: mount, unmount: unmount, getWorkspace: getWorkspace, publish: publishWorkspace };
})();

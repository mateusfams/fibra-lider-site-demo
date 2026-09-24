(function () {
  "use strict";

  const TB = window.FLThemeBuilder;
  if (!TB || !TB.canonicalHomeFactory) throw new Error("Template canonico precisa ser carregado antes do catalogo de templates.");

  function configure(state, options) {
    const documentValue = TB.canonicalHomeFactory(state);
    const config = options || {};
    documentValue.meta = {
      ...(documentValue.meta || {}),
      migratedFrom: "template-catalog-v1",
      templateId: config.id,
      templateVersion: config.version,
      templateFamily: "provider-sales",
      createdFromTemplateAt: new Date().toISOString(),
    };
    documentValue.theme.tokens = { ...(documentValue.theme.tokens || {}), ...(config.tokens || {}) };
    documentValue.theme.darkTokens = { ...(documentValue.theme.darkTokens || {}), ...(config.darkTokens || {}) };
    const root = documentValue.nodes[documentValue.rootId];
    if (root && config.order) root.slots.default = config.order.filter(function (id) { return Boolean(documentValue.nodes[id]); });
    Object.keys(config.props || {}).forEach(function (nodeId) {
      if (documentValue.nodes[nodeId]) documentValue.nodes[nodeId].props = { ...documentValue.nodes[nodeId].props, ...config.props[nodeId] };
    });
    return documentValue;
  }

  function aurora(state) {
    return configure(state, {
      id: "provider-aurora",
      version: "provider-aurora-v1",
      tokens: {
        primary: state.theme.primary || "#0874e7", secondary: state.theme.accent || "#29d884", background: "#f3f8fc", surface: "#ffffff",
        text: "#071827", muted: "#5b6f82", fontHeading: '"Manrope", "Segoe UI", Arial, sans-serif', fontBody: '"Inter", "Segoe UI", Arial, sans-serif',
        radiusSm: "6px", radiusMd: "10px", radiusLg: "18px", spaceLg: "56px", spaceXl: "96px",
      },
      darkTokens: {
        primary: "#4ba5ff", secondary: "#39dfa0", background: "#07131f", surface: "#0d1c2b", text: "#f2f8fc", muted: "#9db0c2",
        fontHeading: '"Manrope", "Segoe UI", Arial, sans-serif', fontBody: '"Inter", "Segoe UI", Arial, sans-serif', radiusMd: "10px", radiusLg: "18px",
      },
      order: ["canonical_header", "canonical_hero", "canonical_proof", "canonical_plans", "canonical_coverage", "canonical_benefits", "canonical_business", "canonical_apps", "canonical_testimonials", "canonical_faq", "canonical_support", "canonical_final", "canonical_footer"],
      props: {
        canonical_header: { serviceText: "Fibra optica com atendimento perto de voce" },
        canonical_plans: { visibleLimit: 3, showCoupon: true },
        canonical_coverage: { mapLabel: "Cobertura regional em expansao" },
      },
    });
  }

  function nexus(state) {
    const documentValue = configure(state, {
      id: "provider-nexus",
      version: "provider-nexus-v1",
      tokens: {
        primary: state.theme.primary || "#1688ff", secondary: state.theme.accent || "#31dda0", background: "#060d16", surface: "#0c1724",
        text: "#f3f8fc", muted: "#91a7bc", fontHeading: '"Sora", "Segoe UI", Arial, sans-serif', fontBody: '"Manrope", "Segoe UI", Arial, sans-serif',
        radiusSm: "5px", radiusMd: "8px", radiusLg: "14px", spaceLg: "64px", spaceXl: "108px",
      },
      darkTokens: {
        primary: "#55adff", secondary: "#43e6ad", background: "#03080e", surface: "#09131e", text: "#f7fbff", muted: "#8da2b6",
        fontHeading: '"Sora", "Segoe UI", Arial, sans-serif', fontBody: '"Manrope", "Segoe UI", Arial, sans-serif', radiusMd: "8px", radiusLg: "14px",
      },
      order: ["canonical_header", "canonical_hero", "canonical_proof", "canonical_apps", "canonical_plans", "canonical_benefits", "canonical_coverage", "canonical_business", "canonical_testimonials", "canonical_support", "canonical_faq", "canonical_final", "canonical_footer"],
      props: {
        canonical_header: { showServiceStrip: false, serviceText: "Conectividade regional de alta performance", logoVariant: "light" },
        canonical_plans: { visibleLimit: 3, showCoupon: true },
        canonical_apps: { buttonLabel: "Montar meu combo" },
        canonical_final: { eyebrow: "Sua rede comeca aqui", title: "Conecte todos os seus planos ao proximo passo.", primaryLabel: "Comparar planos", secondaryLabel: "Falar com especialista" },
      },
    });
    Object.values(documentValue.nodes).filter(function (node) { return node.type === "template.hero-slide"; }).forEach(function (slide) { slide.props.overlay = Math.max(68, Number(slide.props.overlay || 0)); });
    return documentValue;
  }

  TB.templateRegistry.register({
    id: "provider-aurora",
    name: "Aurora Regional",
    description: "Visual claro e arejado, com hero editorial, planos objetivos e cobertura em destaque.",
    category: "Institucional premium",
    palette: ["#0874e7", "#29d884", "#f3f8fc"],
    font: "Manrope + Inter",
    create: aurora,
  });

  TB.templateRegistry.register({
    id: "provider-nexus",
    name: "Nexus Performance",
    description: "Experiencia escura e tecnica para provedores que querem uma marca mais ousada e digital.",
    category: "Tecnologia premium",
    palette: ["#060d16", "#1688ff", "#31dda0"],
    font: "Sora + Manrope",
    create: nexus,
  });
})();

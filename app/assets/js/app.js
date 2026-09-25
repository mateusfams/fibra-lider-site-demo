(function () {
  "use strict";

  let state;
  let activeCategory = "internet";
  let showAllPlans = false;
  let activeSlide = 0;
  let sliderTimer = null;
  let publicMap = null;
  let selectedPlanId = null;
  let selectedCouponId = null;
  let selectedCouponChannel = "code";
  let activeCampaignId = "";
  let coverageLookupPoint = null;
  let lastCoverageContext = { city: "", neighborhood: "", cep: "", matchType: "" };
  const isBuilderPreview = new URLSearchParams(location.search).has("preview");

  const $ = function (selector, root) { return (root || document).querySelector(selector); };
  const $$ = function (selector, root) { return Array.from((root || document).querySelectorAll(selector)); };
  const escapeHtml = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };

  function icon(name, size) {
    return '<i data-lucide="' + escapeHtml(name) + '"' + (size ? ' width="' + size + '" height="' + size + '"' : "") + "></i>";
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value || "";
  }

  function siteMessage(template, values) {
    return FL.interpolate(template, { brand: state.brand.name, ...(values || {}) });
  }

  function currentCouponForPlan(plan) {
    return selectedCouponId ? FL.selectedCouponForPlan(state, plan, selectedCouponId, selectedCouponChannel) : null;
  }

  function attributionContext() {
    const params = new URLSearchParams(location.search);
    const referrer = document.referrer ? (function () { try { return new URL(document.referrer).hostname; } catch (error) { return "referencia externa"; } })() : "";
    const utmSource = params.get("utm_source") || "";
    const source = utmSource || (activeCampaignId ? "Campanha no site" : referrer || "Acesso direto");
    return {
      source: source,
      sourceDetail: activeCampaignId ? "Popup promocional" : "Card de plano",
      campaignId: activeCampaignId,
      utmSource: utmSource,
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      pagePath: location.pathname,
    };
  }

  function applyTheme() {
    const root = document.documentElement;
    const theme = state.theme;
    root.style.setProperty("--brand", theme.primary);
    root.style.setProperty("--brand-dark", theme.primaryDark);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--radius", theme.radius + "px");
    root.style.setProperty("--site-font", theme.font === "Arial" ? "Arial, sans-serif" : '"' + theme.font + '", Inter, Arial, sans-serif');
    root.style.setProperty("--map-accent", theme.mapAccent || theme.primary);
    root.dataset.density = theme.density || "comfortable";
    root.dataset.buttonStyle = theme.buttonStyle || "soft";
    root.dataset.cardStyle = theme.cardStyle || "bordered";
    root.dataset.shadow = theme.shadow || "soft";
    const saved = localStorage.getItem("fl-site-theme");
    const previewMode = new URLSearchParams(location.search).get("theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const mode = ["light", "dark"].includes(previewMode) ? previewMode : saved || (theme.defaultMode === "system" ? preferred : theme.defaultMode);
    const palette = mode === "dark" ? { ink: "#edf6ff", muted: "#96a9bd", surface: "#07111e", panel: "#0d1a2a" } : theme;
    root.style.setProperty("--ink", palette.ink);
    root.style.setProperty("--muted", palette.muted);
    root.style.setProperty("--surface", palette.surface);
    root.style.setProperty("--panel", palette.panel);
    root.dataset.theme = mode;
    document.body.classList.toggle("reduced-motion", theme.motion === "reduced");
    const toggle = $("#site-theme-toggle");
    if (toggle) {
      toggle.hidden = !theme.visitorThemeToggle;
      toggle.innerHTML = icon(mode === "dark" ? "sun" : "moon");
    }
  }

  function applySeo() {
    document.title = state.seo.title;
    const setMeta = function (selector, attribute, value) {
      let element = $(selector);
      if (!element) {
        element = document.createElement("meta");
        const match = selector.match(/meta\[(name|property)="([^"]+)"\]/);
        if (!match) return;
        element.setAttribute(match[1], match[2]);
        document.head.appendChild(element);
      }
      element.content = String(value || "");
    };
    setMeta('meta[name="description"]', "name", state.seo.description);
    setMeta('meta[name="robots"]', "name", state.seo.indexSite ? "index,follow,max-image-preview:large" : "noindex,nofollow");
    setMeta('meta[property="og:title"]', "property", state.seo.ogTitle || state.seo.title);
    setMeta('meta[property="og:description"]', "property", state.seo.ogDescription || state.seo.description);
    setMeta('meta[property="og:image"]', "property", FL.safeImageUrl(state.seo.ogImage, ""));
    setMeta('meta[property="og:url"]', "property", state.seo.canonicalUrl);
    setMeta('meta[property="og:site_name"]', "property", state.brand.name);
    setMeta('meta[name="twitter:card"]', "name", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", state.seo.ogTitle || state.seo.title);
    setMeta('meta[name="twitter:description"]', "name", state.seo.ogDescription || state.seo.description);
    setMeta('meta[name="twitter:image"]', "name", FL.safeImageUrl(state.seo.ogImage, ""));
    if (state.seo.googleSiteVerification) setMeta('meta[name="google-site-verification"]', "name", state.seo.googleSiteVerification);
    const canonical = $('link[rel="canonical"]');
    if (canonical) canonical.href = FL.safeUrl(state.seo.canonicalUrl, location.href);

    const oldSchema = $("#local-business-schema");
    if (oldSchema) oldSchema.remove();
    const allowedTypes = ["InternetServiceProvider", "LocalBusiness", "Organization"];
    const businessType = allowedTypes.includes(state.seo.localBusinessType) ? state.seo.localBusinessType : "InternetServiceProvider";
    const areas = window.FLCoverage ? FLCoverage.effectiveAreas(state) : state.regions.filter(function (item) { return item.active; });
    const graph = [{
      "@type": businessType,
      "@id": state.seo.canonicalUrl + "#business",
      name: state.brand.name,
      legalName: state.brand.legalName,
      url: state.seo.canonicalUrl,
      logo: FL.safeImageUrl(state.brand.logo, ""),
      image: FL.safeImageUrl(state.seo.ogImage, ""),
      telephone: state.brand.phone,
      email: state.brand.email,
      address: { "@type": "PostalAddress", streetAddress: state.brand.address, addressLocality: state.seo.addressLocality, addressRegion: state.seo.addressRegion, postalCode: state.seo.postalCode, addressCountry: "BR" },
      openingHours: state.seo.openingHours,
      areaServed: areas.slice(0, 80).map(function (area) { return { "@type": "AdministrativeArea", name: area.name }; }),
      sameAs: [state.brand.instagram, state.brand.facebook].filter(Boolean),
    }, { "@type": "WebSite", "@id": state.seo.canonicalUrl + "#website", url: state.seo.canonicalUrl, name: state.brand.name, inLanguage: "pt-BR", publisher: { "@id": state.seo.canonicalUrl + "#business" } }];
    if (state.seo.offerCatalogSchema) graph.push({ "@type": "OfferCatalog", name: "Planos de internet", itemListElement: state.plans.filter(function (plan) { return plan.active; }).slice(0, 30).map(function (plan) { return { "@type": "Offer", priceCurrency: "BRL", price: Number(plan.price).toFixed(2), availability: "https://schema.org/InStock", itemOffered: { "@type": "Service", name: plan.title + " " + plan.speed, serviceType: "Internet fibra optica" } }; }) });
    if (state.seo.faqSchema) graph.push({ "@type": "FAQPage", mainEntity: state.faq.slice(0, 20).map(function (item) { return { "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } }; }) });
    const schema = document.createElement("script");
    schema.type = "application/ld+json";
    schema.id = "local-business-schema";
    schema.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
    document.head.appendChild(schema);
  }

  function renderHeader() {
    $("#site-logo").src = FL.safeImageUrl(document.documentElement.dataset.theme === "dark" ? state.brand.logo : state.brand.logoDark, "./assets/img/fibra-lider-logo.png");
    $("#site-nav").innerHTML = state.navigation.filter(function (item) { return item.visible; }).map(function (item) {
      return '<a href="' + escapeHtml(FL.safeUrl(item.href)) + '">' + escapeHtml(item.label) + "</a>";
    }).join("");
    $("#header-phone").href = "tel:" + state.brand.phone.replace(/\D/g, "");
    $("#header-phone").innerHTML = icon("phone") + " " + escapeHtml(state.brand.phone);
    $("#header-client-area").href = FL.safeUrl(state.brand.clientAreaUrl);
    const whatsappUrl = FL.whatsappLink(state.brand.whatsapp, siteMessage(state.whatsapp.floatingMessage));
    $("#header-whatsapp").href = whatsappUrl;
    $("#floating-whatsapp").href = whatsappUrl;
  }

  function activeBanners() {
    return state.banners.filter(function (banner) { return banner.active; });
  }

  function slideLink(link) {
    return link === "whatsapp" ? FL.whatsappLink(state.brand.whatsapp, siteMessage(state.whatsapp.floatingMessage)) : FL.safeUrl(link);
  }

  function renderHero() {
    const banners = activeBanners();
    if (!banners.length) return;
    activeSlide = Math.min(activeSlide, banners.length - 1);
    $("#hero-slides").innerHTML = banners.map(function (banner, index) {
      const target = banner.secondaryLink === "whatsapp" ? ' target="_blank" rel="noopener"' : "";
      const featuredPlan = state.plans.find(function (plan) { return plan.active && plan.featured; }) || state.plans.find(function (plan) { return plan.active; });
      const speedParts = featuredPlan ? String(featuredPlan.speed).split(/\s+/) : [];
      return [
        '<article class="hero-slide' + (index === activeSlide ? " is-active" : "") + '" data-slide="' + index + '" style="--hero-overlay:' + Number(banner.overlay || 65) / 100 + '">',
        '<img class="hero-slide__image hero-slide__image--' + escapeHtml(banner.position || "center") + '" src="' + escapeHtml(FL.safeImageUrl(banner.image, "./assets/img/hero-family-fiber.jpg")) + '" alt=""' + (index ? ' loading="lazy"' : "") + ">",
        '<div class="hero-slide__shade"></div>',
        '<div class="shell hero-slide__content">',
        '<div class="hero-copy">',
        '<span class="hero-eyebrow">' + icon("radio") + escapeHtml(banner.eyebrow) + "</span>",
        "<h1>" + escapeHtml(banner.title) + "</h1>",
        "<p>" + escapeHtml(banner.subtitle) + "</p>",
        '<div class="hero-actions">',
        '<a class="button button--primary button--large" href="' + escapeHtml(slideLink(banner.primaryLink)) + '">' + escapeHtml(banner.primaryLabel) + icon("arrow-right") + "</a>",
        '<a class="button button--glass button--large" href="' + escapeHtml(slideLink(banner.secondaryLink)) + '"' + target + ">" + escapeHtml(banner.secondaryLabel) + "</a>",
        "</div>",
        '<div class="hero-proof"><span>' + icon("circle-check") + "100% fibra optica</span><span>" + icon("circle-check") + "Suporte regional</span></div>",
        "</div>",
        featuredPlan ? '<aside class="hero-plan-chip"><span>' + escapeHtml(banner.badge) + '</span><strong>' + escapeHtml(speedParts[0]) + ' <small>' + escapeHtml(speedParts.slice(1).join(" ")) + '</small></strong><p>a partir de <b>' + escapeHtml(FL.formatCurrency(featuredPlan.price)) + '/' + escapeHtml(featuredPlan.period) + '</b></p></aside>' : "",
        "</div></article>",
      ].join("");
    }).join("");
    $("#hero-dots").innerHTML = banners.map(function (banner, index) {
      return '<button class="hero-dot' + (index === activeSlide ? " is-active" : "") + '" type="button" data-slide-to="' + index + '" aria-label="Ver ' + escapeHtml(banner.name) + '"></button>';
    }).join("");
    $("#hero-arrows").hidden = !state.slider.showArrows || banners.length < 2;
    $("#hero-dots").hidden = !state.slider.showDots || banners.length < 2;
    refreshIcons();
  }

  function goToSlide(index) {
    const banners = activeBanners();
    if (!banners.length) return;
    activeSlide = (index + banners.length) % banners.length;
    $$(".hero-slide").forEach(function (slide, slideIndex) { slide.classList.toggle("is-active", slideIndex === activeSlide); });
    $$(".hero-dot").forEach(function (dot, dotIndex) { dot.classList.toggle("is-active", dotIndex === activeSlide); });
  }

  function startSlider() {
    clearInterval(sliderTimer);
    if (!state.slider.autoplay || activeBanners().length < 2) return;
    sliderTimer = setInterval(function () { goToSlide(activeSlide + 1); }, Math.max(3500, Number(state.slider.interval) || 6500));
  }

  function renderProof() {
    const items = [
      { icon: "cable", value: "100%", label: "fibra optica" },
      { icon: "router", value: "Wi-Fi", label: "em comodato" },
      { icon: "map-pin", value: "Regional", label: "atendimento proximo" },
      { icon: "message-circle", value: "Direto", label: "pelo WhatsApp" },
    ];
    $("#proof-grid").innerHTML = items.map(function (item) {
      return '<div class="proof-item"><span class="proof-icon">' + icon(item.icon) + '</span><div><strong>' + item.value + "</strong><small>" + item.label + "</small></div></div>";
    }).join("");
  }

  function renderPlans() {
    setText("plans-eyebrow", state.content.plansEyebrow);
    setText("plans-title", state.content.plansTitle);
    setText("plans-description", state.content.plansText);
    $("#plan-filters").innerHTML = state.categories.map(function (category) {
      const count = state.plans.filter(function (item) { return item.active && item.categoryId === category.id; }).length;
      return '<button class="filter-tab' + (activeCategory === category.id ? " is-active" : "") + '" type="button" role="tab" data-category="' + escapeHtml(category.id) + '">' + escapeHtml(category.name) + "<span>" + count + "</span></button>";
    }).join("");
    const filtered = state.plans.filter(function (item) { return item.active && item.categoryId === activeCategory; });
    const visible = showAllPlans ? filtered : filtered.slice(0, 3);
    $("#plans-grid").innerHTML = visible.map(function (item) {
      const coupon = currentCouponForPlan(item);
      const promotionalPrice = coupon ? FL.couponPrice(item, coupon) : item.price;
      const price = FL.formatCurrency(promotionalPrice).replace("R$", "").trim().split(",");
      return [
        '<article class="plan-card' + (item.featured ? " plan-card--featured" : "") + '">',
        '<div class="plan-card__top"><div><span>' + escapeHtml(item.title) + "</span><strong>" + escapeHtml(item.speed) + "</strong></div>",
        item.badge ? '<em>' + escapeHtml(item.badge) + "</em>" : "", "</div>",
        coupon ? '<div class="plan-promotion"><span>' + icon("badge-percent") + escapeHtml(FL.couponLabel(coupon)) + '</span><small>Cupom ' + escapeHtml(coupon.code) + ' aplicado</small></div>' : "",
        coupon ? '<span class="plan-old-price">De ' + escapeHtml(FL.formatCurrency(item.price)) + ' por</span>' : "",
        '<div class="plan-price"><small>R$</small><b>' + price[0] + '</b><span>,' + (price[1] || "00") + "<small>/" + escapeHtml(item.period) + "</small></span></div>",
        coupon && coupon.durationType !== "lifetime" ? '<small class="plan-price-after">Depois, ' + escapeHtml(FL.formatCurrency(item.price)) + '/' + escapeHtml(item.period) + '</small>' : "",
        '<p class="plan-note">' + escapeHtml(item.note) + "</p>",
        '<ul>' + item.features.map(function (feature) { return "<li>" + icon("check") + escapeHtml(feature) + "</li>"; }).join("") + "</ul>",
        '<button class="button ' + (item.featured ? "button--primary" : "button--outline") + ' button--block plan-cta" type="button" data-plan-id="' + escapeHtml(item.id) + '">Quero este plano ' + icon("arrow-up-right") + "</button>",
        "</article>",
      ].join("");
    }).join("");
    $("#show-all-plans").hidden = filtered.length <= 3;
    $("#show-all-plans").innerHTML = (showAllPlans ? "Mostrar menos" : "Ver todos os planos") + " " + icon(showAllPlans ? "arrow-up" : "arrow-right");
    refreshIcons();
  }

  function updateCouponStatus(message, isError) {
    const status = $("#coupon-status");
    const input = $("#coupon-input");
    if (!status || !input) return;
    const coupon = state.coupons.find(function (item) { return item.id === selectedCouponId; });
    status.hidden = !message && !coupon;
    status.classList.toggle("is-error", Boolean(isError));
    status.querySelector("span").textContent = message || (coupon ? "Cupom " + coupon.code + " ativo nesta visita." : "");
    if (coupon) input.value = coupon.code;
  }

  function activateCoupon(coupon, channel) {
    if (!coupon || !FL.couponAvailableForChannel(coupon, channel)) { updateCouponStatus("Cupom indisponivel ou fora da validade.", true); return false; }
    selectedCouponId = coupon.id;
    selectedCouponChannel = channel;
    updateCouponStatus("Cupom " + coupon.code + " ativado para os planos participantes.", false);
    renderPlans();
    FL.trackEvent("coupon_apply", { couponId: coupon.id, source: channel, campaignId: activeCampaignId });
    return true;
  }

  function submitCoupon(event) {
    event.preventDefault();
    const code = $("#coupon-input").value;
    const coupon = FL.couponByCode(state, code, "code");
    if (!coupon) { selectedCouponId = null; renderPlans(); updateCouponStatus("Codigo invalido, esgotado ou fora da validade.", true); return; }
    activateCoupon(coupon, "code");
  }

  function clearCoupon() {
    selectedCouponId = null;
    selectedCouponChannel = "code";
    $("#coupon-input").value = "";
    updateCouponStatus("", false);
    renderPlans();
    toast("Cupom removido desta visita");
  }

  function formatLeadPhone(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return "(" + digits.slice(0, 2) + ") " + digits.slice(2);
    if (digits.length <= 10) return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 6) + "-" + digits.slice(6);
    return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
  }

  function normalizedLeadPhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 13) return "";
    return digits.length <= 11 ? "55" + digits : digits;
  }

  function openLeadModal(planId) {
    const plan = state.plans.find(function (item) { return item.id === planId; });
    if (!plan) return;
    if (!state.leadSettings.captureEnabled) {
      window.open(FL.whatsappLink(state.brand.whatsapp, FL.planMessage(state, plan)), "_blank", "noopener");
      return;
    }
    selectedPlanId = plan.id;
    const coupon = currentCouponForPlan(plan);
    $("#lead-plan-id").value = plan.id;
    setText("lead-plan-name", plan.speed + " - " + plan.title);
    setText("lead-plan-price", FL.formatCurrency(coupon ? FL.couponPrice(plan, coupon) : plan.price) + "/" + plan.period);
    const offer = $("#lead-offer-badge");
    offer.hidden = !coupon;
    offer.textContent = coupon ? FL.couponLabel(coupon) : "";
    $("#lead-plan-features").innerHTML = plan.features.slice(0, 4).map(function (feature) { return "<li>" + icon("check") + escapeHtml(feature) + "</li>"; }).join("");
    setText("lead-consent-text", state.leadSettings.consentText);
    $("#lead-whatsapp").required = Boolean(state.leadSettings.requireWhatsapp);
    $("#lead-modal").hidden = false;
    document.body.classList.add("modal-open");
    setTimeout(function () { $("#lead-name").focus(); }, 50);
    FL.trackEvent("lead_form_view", { planId: plan.id, couponId: coupon ? coupon.id : "" });
    refreshIcons();
  }

  function closeLeadModal() {
    $("#lead-modal").hidden = true;
    document.body.classList.remove("modal-open");
    selectedPlanId = null;
  }

  function submitLead(event) {
    event.preventDefault();
    const plan = state.plans.find(function (item) { return item.id === selectedPlanId; });
    const name = $("#lead-name").value.trim().replace(/\s+/g, " ").slice(0, 80);
    const rawPhone = $("#lead-whatsapp").value;
    const phone = normalizedLeadPhone(rawPhone);
    if (!plan || name.length < 2 || (state.leadSettings.requireWhatsapp && !phone) || (rawPhone.trim() && !phone)) { toast("Confira seu nome e informe um WhatsApp valido."); return; }
    const coupon = currentCouponForPlan(plan);
    const attribution = attributionContext();
    const now = new Date().toISOString();
    const lead = { id: FL.uid("lead"), name, whatsapp: phone, planId: plan.id, couponId: coupon ? coupon.id : "", ...attribution, region: lastCoverageContext.city || "", neighborhood: lastCoverageContext.neighborhood || "", status: "new", consentAt: now, createdAt: now, lastContactAt: "" };
    state.leads.unshift(lead);
    if (coupon) coupon.used = Number(coupon.used || 0) + 1;
    state = FL.saveRuntimeState(state);
    FL.trackEvent("lead_capture", { planId: plan.id, couponId: lead.couponId, source: lead.source, campaignId: lead.campaignId });
    FL.trackEvent("whatsapp_click", { planId: plan.id, source: "lead_form", campaignId: lead.campaignId });
    const destination = FL.whatsappLink(state.brand.whatsapp, FL.planMessage(state, plan, { name, whatsapp: phone ? formatLeadPhone(phone.slice(2)) : "nao informado", coupon, region: lead.region }));
    closeLeadModal();
    $("#lead-form").reset();
    window.open(destination, "_blank", "noopener");
  }

  function renderBenefits() {
    setText("benefits-eyebrow", state.content.benefitsEyebrow);
    setText("benefits-title", state.content.benefitsTitle);
    setText("benefits-description", state.content.benefitsText);
    $("#benefits-grid").innerHTML = state.benefits.map(function (item, index) {
      return '<article class="benefit-row"><span class="benefit-number">0' + (index + 1) + '</span><span class="benefit-icon">' + icon(item.icon) + '</span><div><h3>' + escapeHtml(item.title) + "</h3><p>" + escapeHtml(item.text) + "</p></div></article>";
    }).join("");
  }

  function renderApps() {
    setText("apps-eyebrow", state.content.appsEyebrow);
    setText("apps-title", state.content.appsTitle);
    setText("apps-description", state.content.appsText);
    $("#apps-grid").innerHTML = state.apps.map(function (item, index) {
      const logoUrl = FL.safeImageUrl(item.logo, "");
      const logo = logoUrl ? '<img src="' + escapeHtml(logoUrl) + '" alt="" loading="lazy">' : escapeHtml(item.name.slice(0, 2));
      return '<div class="app-pill app-pill--' + ((index % 4) + 1) + '"><span class="app-pill__logo">' + logo + '</span><div><strong>' + escapeHtml(item.name) + "</strong><small>" + escapeHtml(item.category) + "</small></div></div>";
    }).join("");
  }

  function renderBusiness() {
    setText("business-eyebrow", state.content.businessEyebrow);
    setText("business-title", state.content.businessTitle);
    setText("business-description", state.content.businessText);
    setText("business-signal", state.content.businessSignal);
    $("#business-features").innerHTML = String(state.content.businessFeatures || "").split("\n").filter(Boolean).map(function (item) { return '<li>' + icon("circle-check") + escapeHtml(item.trim()) + '</li>'; }).join("");
    $("#business-whatsapp").href = FL.whatsappLink(state.brand.whatsapp, siteMessage(state.whatsapp.businessTemplate));
  }

  function renderCoverage() {
    setText("coverage-eyebrow", state.content.coverageEyebrow);
    setText("coverage-title", state.content.coverageTitle);
    setText("coverage-description", state.content.coverageText);
    const effectiveAreas = window.FLCoverage ? FLCoverage.effectiveAreas(state) : state.regions.filter(function (region) { return region.active; });
    const cities = Array.from(new Set(effectiveAreas.map(function (region) { return region.city || region.name; }).filter(Boolean)));
    $("#coverage-city").innerHTML = '<option value="">Selecione sua cidade</option>' + cities.map(function (city) {
      return '<option value="' + escapeHtml(city) + '">' + escapeHtml(city) + "</option>";
    }).join("");
    setText("public-map-label", state.content.coverageMapLabel || ("Rede " + state.brand.name));
    const inventory = window.FLCoverage ? FLCoverage.inventory(state) : { effective: effectiveAreas, geometries: 0 };
    setText("public-map-summary", inventory.effective.length + " areas atendidas / " + inventory.geometries + " geometrias");
    initPublicMap();
  }

  function regionColor(region) {
    return region.color || state.theme.mapAccent || state.theme.primary;
  }

  function selectCoverageRegion(name) {
    $("#coverage-city").value = name;
    $("#coverage-neighborhood").focus();
  }

  function initPublicMap() {
    const element = $("#public-coverage-map");
    const fallback = $("#public-map-fallback");
    if (!element) return;
    const mode = state.coverageSettings.areaSourceMode || "auto";
    const regions = (mode === "imported" ? [] : state.regions).filter(function (region) { return region.active && region.lat !== null && region.lat !== "" && region.lng !== null && region.lng !== "" && Number.isFinite(Number(region.lat)) && Number.isFinite(Number(region.lng)); });
    const importedFiles = (mode === "manual" ? [] : state.coverageFiles).filter(function (file) { return file.active; });
    if (publicMap) { publicMap.remove(); publicMap = null; }
    if (element._leaflet_id) delete element._leaflet_id;
    if (!window.L || (!regions.length && !importedFiles.length)) {
      element.hidden = true;
      fallback.hidden = false;
      fallback.innerHTML = regions.map(function (region) { return '<button type="button" data-region="' + escapeHtml(region.city || region.name) + '"><strong>' + escapeHtml(region.name) + '</strong><span>' + escapeHtml(region.status) + "</span></button>"; }).join("");
      fallback.onclick = function (event) { const button = event.target.closest("[data-region]"); if (button) selectCoverageRegion(button.dataset.region); };
      return;
    }
    element.hidden = false;
    fallback.hidden = true;
    const mapShell = element.closest(".coverage-map");
    if (mapShell) mapShell.className = "coverage-map map-style--" + (state.coverageSettings.mapStyle || "brand");
    publicMap = window.L.map(element, { scrollWheelZoom: false, zoomControl: true, attributionControl: true, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView([Number(state.coverageSettings.centerLat), Number(state.coverageSettings.centerLng)], 11);
    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(publicMap);
    publicMap.createPane("coverageGlow");
    publicMap.getPane("coverageGlow").style.zIndex = 390;
    publicMap.getPane("coverageGlow").style.pointerEvents = "none";
    publicMap.createPane("coverageAreas");
    publicMap.getPane("coverageAreas").style.zIndex = 430;
    const bounds = [];
    regions.forEach(function (region) {
      const point = [Number(region.lat), Number(region.lng)];
      bounds.push(point);
      const color = regionColor(region);
      window.L.circle(point, { pane: "coverageGlow", radius: Math.max(700, Number(region.radiusKm || state.coverageSettings.defaultRadiusKm) * 1180), color, fillColor: color, fillOpacity: 0.1, opacity: 0.24, weight: 12, interactive: false }).addTo(publicMap);
      const circle = window.L.circle(point, {
        radius: Math.max(500, Number(region.radiusKm || state.coverageSettings.defaultRadiusKm) * 1000), color, fillColor: color,
        fillOpacity: state.coverageSettings.showInterest ? 0.14 + Number(region.interest || 0) / 520 : 0.24, weight: 2,
      }).addTo(publicMap);
      circle.bindTooltip('<strong>' + escapeHtml(region.name) + '</strong><span>' + escapeHtml(region.status) + '</span><small>' + region.interest + '% de interesse</small>', { direction: "top", className: "coverage-tooltip" });
      circle.on("click", function () { selectCoverageRegion(region.city || region.name); });
      const marker = window.L.circleMarker(point, { radius: 7, color: "#ffffff", fillColor: color, fillOpacity: 1, weight: 2 }).addTo(publicMap);
      marker.bindTooltip(escapeHtml(region.name), { permanent: state.coverageSettings.showLabels, direction: "top", offset: [0, -8], className: "region-map-label" });
      marker.on("click", function () { selectCoverageRegion(region.city || region.name); });
    });
    importedFiles.forEach(function (file) {
      const color = file.color || state.theme.mapAccent || state.theme.primary;
      file.features.forEach(function (feature, featureIndex) {
        const label = window.FLCoverage ? FLCoverage.publicFeatureName(feature, featureIndex) : feature.name;
        const layerStyles = window.FLCoverage ? FLCoverage.mapLayerStyles(state.coverageSettings, color) : null;
        if (feature.type === "polygon") {
          window.L.polygon(feature.coordinates, layerStyles ? layerStyles.glow : { pane: "coverageGlow", color, fillColor: color, fillOpacity: 0.1, opacity: 0.28, weight: 10, interactive: false }).addTo(publicMap);
          const polygon = window.L.polygon(feature.coordinates, layerStyles ? layerStyles.area : { pane: "coverageAreas", color, fillColor: color, fillOpacity: 0.42, weight: 2.5 }).addTo(publicMap);
          polygon.bindTooltip('<strong>' + escapeHtml(label) + '</strong><span>Area atendida pela ' + escapeHtml(state.brand.name) + '</span>', { direction: "top", className: "coverage-tooltip" });
          bounds.push.apply(bounds, feature.coordinates);
        } else if (feature.type === "line") {
          window.L.polyline(feature.coordinates, layerStyles ? layerStyles.line : { pane: "coverageAreas", color, weight: 3, opacity: 0.85 }).addTo(publicMap).bindTooltip(escapeHtml(label));
          bounds.push.apply(bounds, feature.coordinates);
        } else if (feature.type === "point") {
          window.L.circleMarker(feature.coordinates, { radius: 6, color: "#ffffff", fillColor: color, fillOpacity: 1, weight: 2 }).addTo(publicMap).bindTooltip(escapeHtml(label));
          bounds.push(feature.coordinates);
        }
      });
      if (window.FLCoverage) FLCoverage.importedAreas([file]).forEach(function (area) {
        if (!Number.isFinite(Number(area.lat)) || !Number.isFinite(Number(area.lng))) return;
        const marker = window.L.marker([Number(area.lat), Number(area.lng)], { icon: window.L.divIcon({ className: "coverage-place-marker", html: '<span style="--marker-color:' + escapeHtml(color) + '"></span>' + (state.coverageSettings.showImportedLabels ? '<b>' + escapeHtml(area.name) + '</b>' : ""), iconSize: [180, 32], iconAnchor: [11, 16] }), keyboard: true }).addTo(publicMap);
        marker.bindTooltip('<strong>' + escapeHtml(area.name) + '</strong><span>' + escapeHtml([area.road, area.postcode].filter(Boolean).join(" - ") || "Cobertura confirmada") + '</span>', { direction: "top", className: "coverage-tooltip" });
        marker.on("click", function () { selectCoverageRegion(area.city || area.name); });
      });
    });
    publicMap.fitBounds(bounds, { padding: [32, 32], maxZoom: 11 });
    const updatePlaceLabels = function () {
      if (!publicMap || !publicMap._container) return;
      publicMap._container.classList.toggle("show-place-labels", Boolean(state.coverageSettings.showImportedLabels) && publicMap.getZoom() >= 14);
    };
    publicMap.on("zoomend", updatePlaceLabels);
    updatePlaceLabels();
    setTimeout(function () { if (publicMap) publicMap.invalidateSize(); }, 80);
  }

  function renderTestimonials() {
    setText("testimonial-eyebrow", state.content.testimonialEyebrow);
    setText("testimonial-title", state.content.testimonialTitle);
    $("#testimonials-grid").innerHTML = state.testimonials.map(function (review) {
      return '<article class="testimonial"><div class="stars" aria-label="' + review.rating + ' estrelas">' + "★".repeat(review.rating) + '</div><blockquote>“' + escapeHtml(review.text) + '”</blockquote><div class="review-author"><span>' + escapeHtml(review.name.charAt(0)) + '</span><div><strong>' + escapeHtml(review.name) + "</strong><small>" + escapeHtml(review.city) + "</small></div></div></article>";
    }).join("");
  }

  function renderFaq() {
    setText("faq-eyebrow", state.content.faqEyebrow);
    setText("faq-title", state.content.faqTitle);
    setText("faq-description", state.content.faqText);
    $("#faq-whatsapp").href = FL.whatsappLink(state.brand.whatsapp, siteMessage(state.whatsapp.floatingMessage));
    $("#faq-list").innerHTML = state.faq.map(function (item, index) {
      return '<article class="faq-item' + (index === 0 ? " is-open" : "") + '"><button type="button" aria-expanded="' + (index === 0) + '"><span>' + escapeHtml(item.question) + "</span>" + icon("plus") + '</button><div class="faq-answer"><p>' + escapeHtml(item.answer) + "</p></div></article>";
    }).join("");
  }

  function supportUrl(item) {
    return item.type === "whatsapp" ? FL.whatsappLink(state.brand.whatsapp, siteMessage(state.whatsapp.floatingMessage)) : FL.safeUrl(item.url);
  }

  function renderSupport() {
    setText("support-eyebrow", state.content.supportEyebrow);
    setText("support-title", state.content.supportTitle);
    setText("support-description", state.content.supportText);
    $("#support-grid").innerHTML = state.supportCards.filter(function (item) { return item.active; }).map(function (item) {
      const url = supportUrl(item);
      const external = /^https?:/.test(url) || item.type === "whatsapp" ? ' target="_blank" rel="noopener"' : "";
      return '<a class="support-card" href="' + escapeHtml(url) + '"' + external + '><span class="support-card__icon">' + icon(item.icon) + '</span><h3>' + escapeHtml(item.title) + "</h3><p>" + escapeHtml(item.text) + '</p><strong>' + escapeHtml(item.label) + " " + icon("arrow-up-right") + "</strong></a>";
    }).join("");
  }

  function renderFinalAndFooter() {
    setText("final-eyebrow", state.content.finalEyebrow);
    setText("final-title", state.content.finalTitle);
    setText("final-description", state.content.finalText);
    const whatsappUrl = FL.whatsappLink(state.brand.whatsapp, siteMessage(state.whatsapp.floatingMessage));
    $("#final-whatsapp").href = whatsappUrl;
    $("#footer-social-whatsapp").href = whatsappUrl;
    $("#footer-instagram").href = FL.safeUrl(state.brand.instagram);
    $("#footer-facebook").href = FL.safeUrl(state.brand.facebook);
    $("#footer-logo").src = FL.safeImageUrl(state.brand.logo, "./assets/img/fibra-lider-logo.png");
    setText("footer-description", state.footer.description);
    $("#footer-columns").innerHTML = state.footer.columns.map(function (column) {
      return '<div><h3>' + escapeHtml(column.title) + "</h3>" + column.links.map(function (link) {
        const external = /^https?:/.test(link.href) ? ' target="_blank" rel="noopener"' : "";
        return '<a href="' + escapeHtml(FL.safeUrl(link.href)) + '"' + external + ">" + escapeHtml(link.label) + "</a>";
      }).join("") + "</div>";
    }).join("");
    $("#footer-phone").href = "tel:" + state.brand.phone.replace(/\D/g, "");
    $("#footer-phone span").textContent = state.brand.phone;
    $("#footer-email").href = "mailto:" + state.brand.email;
    $("#footer-email span").textContent = state.brand.email;
    $("#footer-address span").textContent = state.brand.address;
    setText("footer-year", "© " + new Date().getFullYear());
    setText("footer-copyright", state.footer.copyright);
    setText("footer-company", state.brand.legalName + " · CNPJ " + state.brand.cnpj);
  }

  function safeBlockUrl(value) {
    const url = String(value || "#").trim();
    if (url === "whatsapp") return FL.whatsappLink(state.brand.whatsapp, siteMessage(state.whatsapp.floatingMessage));
    if (/^(https?:\/\/|mailto:|tel:|#|\.\/)/i.test(url)) return url;
    return "#";
  }

  function blockParagraphs(value) {
    return String(value || "").split(/\n+/).filter(Boolean).map(function (line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("");
  }

  function structuredLines(value, size) {
    return String(value || "").split("\n").map(function (line) {
      const parts = line.split("|").map(function (part) { return part.trim(); });
      while (parts.length < size) parts.push("");
      return parts;
    }).filter(function (parts) { return parts.some(Boolean); });
  }

  function renderCustomSection(block) {
    const content = block.content || {};
    const eyebrow = content.eyebrow ? '<span class="eyebrow">' + escapeHtml(content.eyebrow) + "</span>" : "";
    const button = content.buttonLabel ? '<a class="button button--primary" href="' + escapeHtml(safeBlockUrl(content.buttonUrl)) + '"' + (String(content.buttonUrl).startsWith("http") || content.buttonUrl === "whatsapp" ? ' target="_blank" rel="noopener"' : "") + '>' + escapeHtml(content.buttonLabel) + " " + icon("arrow-right") + "</a>" : "";
    let body = "";
    if (block.type === "custom-content") {
      body = '<div class="shell custom-content__inner">' + eyebrow + '<h2>' + escapeHtml(content.title) + "</h2>" + blockParagraphs(content.text) + button + "</div>";
    }
    if (block.type === "custom-media") {
      body = '<div class="shell custom-media__inner' + (content.imageSide === "right" ? " is-reversed" : "") + '"><figure><img src="' + escapeHtml(content.image || state.banners[0].image) + '" alt="' + escapeHtml(content.imageAlt || content.title) + '" loading="lazy"></figure><div>' + eyebrow + '<h2>' + escapeHtml(content.title) + "</h2>" + blockParagraphs(content.text) + button + "</div></div>";
    }
    if (block.type === "custom-stats") {
      const items = structuredLines(content.items, 2);
      body = '<div class="shell"><div class="custom-section-heading">' + eyebrow + '<h2>' + escapeHtml(content.title) + '</h2><p>' + escapeHtml(content.text) + '</p></div><div class="custom-stats__grid">' + items.map(function (item) { return '<article><strong>' + escapeHtml(item[0]) + '</strong><span>' + escapeHtml(item[1]) + "</span></article>"; }).join("") + "</div></div>";
    }
    if (block.type === "custom-features") {
      const items = structuredLines(content.items, 3);
      body = '<div class="shell"><div class="custom-section-heading">' + eyebrow + '<h2>' + escapeHtml(content.title) + '</h2><p>' + escapeHtml(content.text) + '</p></div><div class="custom-features__grid">' + items.map(function (item) { return '<article><span>' + icon(item[0] || "sparkles") + '</span><h3>' + escapeHtml(item[1]) + '</h3><p>' + escapeHtml(item[2]) + "</p></article>"; }).join("") + "</div></div>";
    }
    if (block.type === "custom-gallery") {
      const items = structuredLines(content.items, 2);
      body = '<div class="shell"><div class="custom-section-heading">' + eyebrow + '<h2>' + escapeHtml(content.title) + '</h2><p>' + escapeHtml(content.text) + '</p></div><div class="custom-gallery__grid">' + items.map(function (item) { return '<figure><img src="' + escapeHtml(item[0]) + '" alt="' + escapeHtml(item[1]) + '" loading="lazy"><figcaption>' + escapeHtml(item[1]) + "</figcaption></figure>"; }).join("") + "</div></div>";
    }
    if (block.type === "custom-cta") {
      body = '<div class="shell custom-cta__inner"><div>' + eyebrow + '<h2>' + escapeHtml(content.title) + '</h2><p>' + escapeHtml(content.text) + "</p></div>" + button + "</div>";
    }
    return '<section class="section page-section custom-builder-section custom-builder-section--' + escapeHtml(block.type.replace("custom-", "")) + '" data-section="' + escapeHtml(block.id) + '">' + body + "</section>";
  }

  function renderCustomSections() {
    $$(".custom-builder-section", $("#conteudo")).forEach(function (section) { section.remove(); });
    state.pageBlocks.filter(function (block) { return String(block.type).startsWith("custom-"); }).forEach(function (block) {
      $("#conteudo").insertAdjacentHTML("beforeend", renderCustomSection(block));
    });
  }

  function applyPageBlocks() {
    const main = $("#conteudo");
    renderCustomSections();
    state.pageBlocks.forEach(function (block) {
      const section = $('[data-section="' + block.id + '"]');
      if (!section) return;
      const requiredModule = { plans: "plans", apps: "apps", coverage: "coverage", testimonials: "testimonials", faq: "faq", support: "support" }[block.id];
      section.hidden = block.visible === false || Boolean(requiredModule && state.modules && state.modules[requiredModule] === false);
      section.dataset.tone = block.tone || "light";
      section.dataset.spacing = block.spacing || "normal";
      section.dataset.container = block.container || "normal";
      section.dataset.align = block.alignment || "left";
      section.dataset.hideMobile = String(Boolean(block.hideMobile));
      section.dataset.hideDesktop = String(Boolean(block.hideDesktop));
      const background = String(block.backgroundImage || "");
      const safeBackground = FL.safeImageUrl(background, "");
      section.classList.toggle("has-builder-background", Boolean(safeBackground));
      section.style.backgroundImage = safeBackground ? 'url("' + safeBackground.replace(/["\n\r]/g, "") + '")' : "";
      section.style.backgroundPosition = block.backgroundPosition || "center";
      if (String(block.type).startsWith("custom-")) section.id = block.anchor || block.id;
      main.appendChild(section);
    });
  }

  function setupSectionReveal() {
    if (!state.theme.sectionReveal || state.theme.motion === "reduced" || !window.IntersectionObserver) return;
    const sections = $$("#conteudo > .page-section").filter(function (section) { return !section.classList.contains("hero-section") && !section.hidden; });
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px" });
    sections.forEach(function (section) { section.classList.add("reveal-ready"); observer.observe(section); });
  }

  function setupBuilderPreview() {
    if (!isBuilderPreview) return;
    const selected = new URLSearchParams(location.search).get("selected");
    $$("[data-section]").forEach(function (section) {
      section.classList.toggle("is-builder-selected", section.dataset.section === selected);
      section.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        parent.postMessage({ type: "fl-builder-select", sectionId: section.dataset.section }, location.origin);
      }, true);
    });
  }

  function renderAll() {
    applyTheme();
    applySeo();
    renderHeader();
    renderHero();
    renderProof();
    renderPlans();
    renderBenefits();
    renderApps();
    renderBusiness();
    renderCoverage();
    renderTestimonials();
    renderFaq();
    renderSupport();
    renderFinalAndFooter();
    applyPageBlocks();
    setupBuilderPreview();
    setupSectionReveal();
    refreshIcons();
    startSlider();
  }

  function toast(message) {
    const element = $("#site-toast");
    element.textContent = message;
    element.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { element.hidden = true; }, 2600);
  }

  function openCampaign(campaign) {
    const coupon = state.coupons.find(function (item) { return item.id === campaign.couponId && FL.couponAvailableForChannel(item, "campaign"); });
    activeCampaignId = campaign.id;
    $("#campaign-image").src = FL.safeImageUrl(campaign.image, "./assets/img/hero-family-fiber.jpg");
    setText("campaign-eyebrow", campaign.eyebrow);
    setText("campaign-title", campaign.title);
    setText("campaign-description", campaign.description);
    const couponButton = $("#campaign-coupon");
    couponButton.hidden = !coupon;
    couponButton.dataset.couponId = coupon ? coupon.id : "";
    if (coupon) couponButton.querySelector("span").textContent = "Ativar " + coupon.code;
    $("#campaign-cta").textContent = campaign.ctaLabel;
    $("#campaign-cta").href = campaign.ctaLink;
    $("#campaign-cta").dataset.couponId = coupon ? coupon.id : "";
    $("#campaign-modal").hidden = false;
    document.body.classList.add("modal-open");
    FL.trackEvent("campaign_view", { campaignId: campaign.id });
    refreshIcons();
  }

  function closeCampaign() {
    $("#campaign-modal").hidden = true;
    document.body.classList.remove("modal-open");
  }

  function scheduleCampaign() {
    if (state.modules && state.modules.promotions === false) return;
    const today = new Date().toISOString().slice(0, 10);
    const campaign = state.popupCampaigns.find(function (item) {
      return item.active && (!item.startsAt || item.startsAt <= today) && (!item.expiresAt || item.expiresAt >= today);
    });
    if (!campaign) return;
    const seenKey = "fl-popup-seen-" + campaign.id;
    if (campaign.frequency === "session" && sessionStorage.getItem(seenKey)) return;
    const show = function () { sessionStorage.setItem(seenKey, "1"); openCampaign(campaign); };
    if (campaign.trigger === "scroll") {
      const onScroll = function () {
        const progress = ((scrollY + innerHeight) / document.documentElement.scrollHeight) * 100;
        if (progress >= Number(campaign.scrollPercent || 45)) { window.removeEventListener("scroll", onScroll); show(); }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    } else if (campaign.trigger === "exit") {
      document.addEventListener("mouseout", function onExit(event) {
        if (event.clientY <= 0) { document.removeEventListener("mouseout", onExit); show(); }
      });
    } else {
      setTimeout(show, Math.max(2, Number(campaign.delaySeconds || 8)) * 1000);
    }
  }

  function normalizeText(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function pointInPolygon(point, polygon) {
    if (!point || !polygon || polygon.length < 3) return false;
    const y = Number(point.lat); const x = Number(point.lng);
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const yi = Number(polygon[i][0]); const xi = Number(polygon[i][1]);
      const yj = Number(polygon[j][0]); const xj = Number(polygon[j][1]);
      const intersects = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  async function geocodeCoverageAddress(address) {
    const query = [address.logradouro, address.bairro, address.localidade, address.uf, "Brasil"].filter(Boolean).join(", ");
    try {
      if (state.coverageSettings.googleMapsEnabled && state.coverageSettings.geocodingProvider === "google" && state.coverageSettings.googleMapsBrowserKey) {
        const response = await fetch("https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(query) + "&key=" + encodeURIComponent(state.coverageSettings.googleMapsBrowserKey));
        const payload = response.ok ? await response.json() : null;
        const location = payload && payload.results && payload.results[0] && payload.results[0].geometry.location;
        if (location) return { lat: Number(location.lat), lng: Number(location.lng), provider: "google" };
      }
      const response = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=" + encodeURIComponent(query));
      const payload = response.ok ? await response.json() : [];
      return payload[0] ? { lat: Number(payload[0].lat), lng: Number(payload[0].lon), provider: "nominatim" } : null;
    } catch (error) { return null; }
  }

  function coverageMatch(city, neighborhood, cep) {
    const digits = String(cep || "").replace(/\D/g, "");
    const normalizedCity = normalizeText(city);
    const normalizedNeighborhood = normalizeText(neighborhood);
    const candidates = state.regions.filter(function (region) { return region.active; }).sort(function (a, b) { return Number(b.priority || 0) - Number(a.priority || 0); });
    const match = candidates.find(function (region) {
      const type = region.type || "city";
      const regionCity = normalizeText(region.city || region.name);
      const exactCep = String(region.cep || "").replace(/\D/g, "");
      const prefixes = (region.cepPrefixes || []).concat(type === "cep_prefix" && exactCep ? [exactCep] : []).map(function (item) { return String(item).replace(/\D/g, ""); }).filter(Boolean);
      const neighborhoods = (region.neighborhoods || []).map(normalizeText);
      if (type === "cep") return Boolean(digits && exactCep && digits === exactCep);
      if (type === "cep_prefix") return Boolean(digits && prefixes.some(function (prefix) { return digits.startsWith(prefix); }));
      if (type === "cep_range") {
        const start = Number(String(region.cepStart || "").replace(/\D/g, "")); const end = Number(String(region.cepEnd || "").replace(/\D/g, "")); const value = Number(digits);
        return Boolean(value && start && end && value >= Math.min(start, end) && value <= Math.max(start, end));
      }
      if (type === "neighborhood") return regionCity === normalizedCity && neighborhoods.includes(normalizedNeighborhood);
      return regionCity === normalizedCity || normalizeText(region.name) === normalizedCity;
    });
    if (match) return { region: match, matchType: match.type || "city" };
    if (window.FLCoverage) {
      const importedMatch = FLCoverage.effectiveAreas(state).find(function (area) { return area.source === "kmz" && normalizeText(area.name) === normalizedCity; });
      if (importedMatch) return { region: importedMatch, matchType: "kmz" };
    }
    if (coverageLookupPoint && state.coverageSettings.precisePolygonCheck) {
      for (const file of state.coverageFiles.filter(function (item) { return item.active; })) {
        const feature = file.features.find(function (item) { return item.type === "polygon" && pointInPolygon(coverageLookupPoint, item.coordinates); });
        if (feature) return { region: { name: window.FLCoverage ? FLCoverage.publicFeatureName(feature, file.features.indexOf(feature)) : feature.name, status: "Cobertura ativa", active: true }, matchType: "kmz" };
      }
    }
    return null;
  }

  async function lookupPublicCep() {
    const input = $("#coverage-cep");
    const status = $("#coverage-cep-status");
    const cep = input.value.replace(/\D/g, "");
    if (cep.length !== 8 || !state.coverageSettings.cepLookup) return;
    status.textContent = "Localizando seu endereco...";
    status.className = "is-loading";
    try {
      const response = await fetch("https://viacep.com.br/ws/" + cep + "/json/");
      if (!response.ok) throw new Error("Nao foi possivel consultar agora");
      const address = await response.json();
      if (address.erro) throw new Error("CEP nao encontrado");
      input.value = address.cep;
      $("#coverage-neighborhood").value = address.bairro || "";
      coverageLookupPoint = await geocodeCoverageAddress(address);
      const region = state.regions.find(function (item) { return normalizeText(item.city || item.name) === normalizeText(address.localidade); });
      if (region) {
        $("#coverage-city").value = region.name;
        if (publicMap) publicMap.setView([Number(region.lat), Number(region.lng)], 12, { animate: true });
        status.textContent = "Endereco localizado em " + region.name + ".";
        status.className = "is-success";
      } else {
        const select = $("#coverage-city");
        let option = Array.from(select.options).find(function (item) { return item.value === address.localidade; });
        if (!option) { option = document.createElement("option"); option.value = address.localidade; option.textContent = address.localidade + " - consulta especial"; select.appendChild(option); }
        select.value = address.localidade;
        status.textContent = "Endereco localizado. Vamos confirmar a viabilidade.";
        status.className = "is-success";
      }
    } catch (error) { status.textContent = error.message; status.className = "is-error"; }
  }

  function handleCoverage(event) {
    event.preventDefault();
    const city = $("#coverage-city").value;
    const neighborhood = $("#coverage-neighborhood").value.trim();
    const cep = $("#coverage-cep").value.trim();
    if (!city || !neighborhood) return;
    const matched = coverageMatch(city, neighborhood, cep);
    const region = matched && matched.region;
    lastCoverageContext = { city: city, neighborhood: neighborhood, cep: cep, matchType: matched ? matched.matchType : "manual-review" };
    const result = $("#coverage-result");
    result.hidden = false;
    result.innerHTML = '<span>' + icon(region && region.status === "Cobertura ativa" ? "circle-check" : "map-pinned") + '</span><div><strong>' + escapeHtml(region ? region.status : "Consulta recebida") + '</strong><p>Confirme a viabilidade exata para ' + escapeHtml(neighborhood) + ' com nossa equipe.</p><a href="' + escapeHtml(FL.whatsappLink(state.brand.whatsapp, siteMessage(state.whatsapp.coverageTemplate, { city, neighborhood, cep }))) + '" target="_blank" rel="noopener">Continuar no WhatsApp ' + icon("arrow-up-right") + "</a></div>";
    FL.trackEvent("coverage_search", { region: city, found: Boolean(region), matchType: lastCoverageContext.matchType });
    refreshIcons();
  }

  function setConsent(value) {
    localStorage.setItem("fl-cookie-consent", value);
    $("#cookie-banner").hidden = true;
    if (value === "all") loadMarketingIntegrations();
  }

  function loadMarketingIntegrations() {
    if (window.__flMarketingLoaded) return;
    window.__flMarketingLoaded = true;
    const integrations = state.integrations;
    if (integrations.ga4Enabled && /^G-[A-Z0-9]+$/i.test(integrations.ga4Id)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(integrations.ga4Id);
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", integrations.ga4Id);
    }
    if (integrations.metaPixelEnabled && /^\d{8,20}$/.test(integrations.metaPixelId)) {
      window.__flMetaPixelConfigured = integrations.metaPixelId;
    }
  }

  function bindEvents() {
    $("#site-theme-toggle").addEventListener("click", function () {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem("fl-site-theme", next);
      applyTheme();
      renderHeader();
      if (publicMap) setTimeout(function () { publicMap.invalidateSize(); }, 80);
      refreshIcons();
    });
    $("#mobile-menu-toggle").addEventListener("click", function () {
      const opened = document.body.classList.toggle("menu-open");
      this.setAttribute("aria-expanded", String(opened));
      this.innerHTML = icon(opened ? "x" : "menu");
      refreshIcons();
    });
    $("#site-nav").addEventListener("click", function () { document.body.classList.remove("menu-open"); });
    $("#hero-prev").addEventListener("click", function () { goToSlide(activeSlide - 1); startSlider(); });
    $("#hero-next").addEventListener("click", function () { goToSlide(activeSlide + 1); startSlider(); });
    $("#hero-dots").addEventListener("click", function (event) {
      const button = event.target.closest("[data-slide-to]");
      if (button) { goToSlide(Number(button.dataset.slideTo)); startSlider(); }
    });
    if (state.slider.pauseOnHover) {
      $(".hero-slider").addEventListener("mouseenter", function () { clearInterval(sliderTimer); });
      $(".hero-slider").addEventListener("mouseleave", startSlider);
    }
    $("#plan-filters").addEventListener("click", function (event) {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      activeCategory = button.dataset.category;
      showAllPlans = false;
      renderPlans();
    });
    $("#show-all-plans").addEventListener("click", function () { showAllPlans = !showAllPlans; renderPlans(); });
    $("#plans-grid").addEventListener("click", function (event) {
      const button = event.target.closest("[data-plan-id]");
      if (button) { FL.trackEvent("plan_click", { planId: button.dataset.planId, source: "plan_card" }); openLeadModal(button.dataset.planId); }
    });
    $("#coverage-form").addEventListener("submit", handleCoverage);
    let cepTimer;
    $("#coverage-cep").addEventListener("input", function () {
      const digits = this.value.replace(/\D/g, "").slice(0, 8);
      this.value = digits.replace(/(\d{5})(\d)/, "$1-$2");
      clearTimeout(cepTimer);
      if (digits.length === 8) cepTimer = setTimeout(lookupPublicCep, 420);
    });
    $("#faq-list").addEventListener("click", function (event) {
      const button = event.target.closest(".faq-item > button");
      if (!button) return;
      const item = button.parentElement;
      const open = !item.classList.contains("is-open");
      $$(".faq-item").forEach(function (entry) { entry.classList.remove("is-open"); entry.querySelector("button").setAttribute("aria-expanded", "false"); });
      if (open) { item.classList.add("is-open"); button.setAttribute("aria-expanded", "true"); }
    });
    $$("[data-close-modal]").forEach(function (element) { element.addEventListener("click", closeCampaign); });
    $$("[data-close-lead-modal]").forEach(function (element) { element.addEventListener("click", closeLeadModal); });
    $("#lead-form").addEventListener("submit", submitLead);
    $("#lead-whatsapp").addEventListener("input", function () { this.value = formatLeadPhone(this.value); });
    $("#coupon-form").addEventListener("submit", submitCoupon);
    $("#coupon-clear").addEventListener("click", clearCoupon);
    $("#campaign-coupon").addEventListener("click", function () {
      const coupon = state.coupons.find(function (item) { return item.id === this.dataset.couponId; }, this);
      if (activateCoupon(coupon, "campaign")) {
        closeCampaign();
        $("#planos").scrollIntoView({ behavior: "smooth" });
        toast("Oferta ativada nos planos participantes");
      }
    });
    $("#campaign-cta").addEventListener("click", function (event) {
      const coupon = state.coupons.find(function (item) { return item.id === this.dataset.couponId; }, this);
      if (coupon) activateCoupon(coupon, "campaign");
      if (String(this.getAttribute("href") || "").startsWith("#")) {
        event.preventDefault(); closeCampaign();
        const target = $(this.getAttribute("href")); if (target) target.scrollIntoView({ behavior: "smooth" });
      }
    });
    $("#cookie-essential").addEventListener("click", function () { setConsent("essential"); });
    $("#cookie-accept").addEventListener("click", function () { setConsent("all"); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") { closeCampaign(); closeLeadModal(); } });
    $("#floating-whatsapp").addEventListener("click", function () { FL.trackEvent("whatsapp_click", { source: "floating" }); });
  }

  function initConsent() {
    if (!state.integrations.consentBanner) return;
    const consent = localStorage.getItem("fl-cookie-consent");
    if (!consent) setTimeout(function () { $("#cookie-banner").hidden = false; }, 1000);
    if (consent === "all") loadMarketingIntegrations();
  }

  async function init() {
    state = FL.getState();
    state = await FL.loadBundledCoverage(state);
    FL.seedEventsIfEmpty();
    if (isBuilderPreview) document.body.classList.add("is-builder-preview");
    renderAll();
    bindEvents();
    if (location.hash) setTimeout(function () { const target = $(location.hash); if (target) target.scrollIntoView(); }, 180);
    const sectionPreview = new URLSearchParams(location.search).get("section");
    if (sectionPreview) setTimeout(function () { const target = $("#" + sectionPreview); if (target) target.scrollIntoView(); }, 220);
    if (!isBuilderPreview) {
      initConsent();
      scheduleCampaign();
      FL.trackEvent("page_view", { source: document.referrer ? "referral" : "direct" });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();

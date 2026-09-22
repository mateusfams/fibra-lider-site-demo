(function () {
  "use strict";

  const $ = function (selector, root) { return (root || document).querySelector(selector); };
  const esc = function (value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };
  const icon = function (name) { return '<i data-lucide="' + esc(name) + '"></i>'; };
  let state;
  let page;

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
  }

  function applyTheme() {
    const root = document.documentElement;
    const theme = state.theme;
    root.style.setProperty("--brand", theme.primary);
    root.style.setProperty("--brand-dark", theme.primaryDark);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--radius", theme.radius + "px");
    root.style.setProperty("--site-font", theme.font === "Arial" ? "Arial, sans-serif" : '"' + theme.font + '", Inter, Arial, sans-serif');
    root.dataset.density = theme.density || "comfortable";
    root.dataset.buttonStyle = theme.buttonStyle || "soft";
    root.dataset.cardStyle = theme.cardStyle || "bordered";
    root.dataset.shadow = theme.shadow || "soft";
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const previewMode = new URLSearchParams(location.search).get("theme");
    const mode = ["light", "dark"].includes(previewMode) ? previewMode : localStorage.getItem("fl-site-theme") || (theme.defaultMode === "system" ? preferred : theme.defaultMode);
    const palette = mode === "dark" ? { ink: "#edf6ff", muted: "#96a9bd", surface: "#07111e", panel: "#0d1a2a" } : theme;
    root.style.setProperty("--ink", palette.ink);
    root.style.setProperty("--muted", palette.muted);
    root.style.setProperty("--surface", palette.surface);
    root.style.setProperty("--panel", palette.panel);
    root.dataset.theme = mode;
    $("#page-logo").src = mode === "dark" ? state.brand.logo : state.brand.logoDark;
    $("#page-theme-toggle").innerHTML = icon(mode === "dark" ? "sun" : "moon");
  }

  function pageUrl(url) {
    if (url === "whatsapp") return FL.whatsappLink(state.brand.whatsapp, state.whatsapp.floatingMessage);
    return url || "#";
  }

  function paragraphs(text) {
    return String(text || "").split(/\n+/).filter(Boolean).map(function (entry) { return "<p>" + esc(entry) + "</p>"; }).join("");
  }

  function renderBlock(block) {
    if (block.visible === false) return "";
    if (block.type === "hero") return '<section class="inner-page-hero"><div class="shell"><a href="./index.html">' + icon("arrow-left") + ' Voltar ao site</a><span class="eyebrow eyebrow--light">' + esc(block.eyebrow || state.brand.name) + '</span><h1>' + esc(block.title) + '</h1><p>' + esc(block.text) + "</p></div></section>";
    if (block.type === "text") return '<section class="inner-content-section"><div class="shell document-copy"><h2>' + esc(block.title) + "</h2>" + paragraphs(block.text) + "</div></section>";
    if (block.type === "callout") return '<section class="inner-content-section inner-content-section--compact"><div class="shell"><article class="document-callout"><span>' + icon("info") + '</span><div><h2>' + esc(block.title) + "</h2>" + paragraphs(block.text) + "</div></article></div></section>";
    if (block.type === "document") return '<section class="inner-content-section inner-content-section--compact"><div class="shell"><article class="document-download"><span>' + icon("file-check-2") + '</span><div><h2>' + esc(block.title) + '</h2><p>' + esc(block.text) + '</p></div><a class="button button--primary" href="' + esc(pageUrl(block.url)) + '" target="_blank" rel="noopener">' + esc(block.label || "Abrir documento") + " " + icon("external-link") + "</a></article></div></section>";
    if (block.type === "image") return '<section class="inner-content-section"><div class="shell page-image-block"><img src="' + esc(block.url) + '" alt="' + esc(block.label || block.title) + '" loading="lazy"><div><h2>' + esc(block.title) + "</h2>" + paragraphs(block.text) + "</div></div></section>";
    if (block.type === "stats") {
      const items = String(block.text || "").split("\n").map(function (line) { const parts = line.split("|"); return { value: (parts.shift() || "").trim(), label: parts.join("|").trim() }; }).filter(function (item) { return item.value; });
      return '<section class="inner-content-section page-stats-block"><div class="shell"><h2>' + esc(block.title) + '</h2><div>' + items.map(function (item) { return '<article><strong>' + esc(item.value) + '</strong><span>' + esc(item.label) + '</span></article>'; }).join("") + '</div></div></section>';
    }
    if (block.type === "faq") {
      const items = String(block.text || "").split("\n").map(function (line) { const parts = line.split("|"); return { question: (parts.shift() || "").trim(), answer: parts.join("|").trim() }; }).filter(function (item) { return item.question; });
      return '<section class="inner-content-section page-faq-block"><div class="shell"><h2>' + esc(block.title) + '</h2><div>' + items.map(function (item, index) { return '<details' + (index === 0 ? " open" : "") + '><summary>' + esc(item.question) + icon("plus") + '</summary><p>' + esc(item.answer) + '</p></details>'; }).join("") + '</div></div></section>';
    }
    if (block.type === "cta") return '<section class="page-cta"><div class="shell"><div><h2>' + esc(block.title) + '</h2><p>' + esc(block.text) + '</p></div><a class="button button--light" href="' + esc(pageUrl(block.url)) + '"' + (block.url === "whatsapp" ? ' target="_blank" rel="noopener"' : "") + '>' + esc(block.label || "Saiba mais") + " " + icon("arrow-right") + "</a></div></section>";
    return "";
  }

  function renderHeaderAndFooter() {
    $("#page-nav").innerHTML = state.navigation.filter(function (item) { return item.visible; }).map(function (item) { return '<a href="./index.html' + esc(item.href) + '">' + esc(item.label) + "</a>"; }).join("");
    $("#page-header-phone").href = "tel:" + state.brand.phone.replace(/\D/g, "");
    $("#page-header-phone span").textContent = state.brand.phone;
    $("#page-client-area").href = state.brand.clientAreaUrl;
    $("#page-whatsapp").href = FL.whatsappLink(state.brand.whatsapp, state.whatsapp.floatingMessage);
    $("#page-footer-description").textContent = state.footer.description;
    $("#page-footer-columns").innerHTML = state.footer.columns.map(function (column) { return '<div><h3>' + esc(column.title) + "</h3>" + column.links.map(function (link) { const href = link.href.charAt(0) === "#" ? "./index.html" + link.href : link.href; return '<a href="' + esc(href) + '">' + esc(link.label) + "</a>"; }).join("") + "</div>"; }).join("");
    $("#page-footer-phone").href = "tel:" + state.brand.phone.replace(/\D/g, "");
    $("#page-footer-phone span").textContent = state.brand.phone;
    $("#page-footer-email").href = "mailto:" + state.brand.email;
    $("#page-footer-email span").textContent = state.brand.email;
    $("#page-footer-address span").textContent = state.brand.address;
    $("#page-copyright").textContent = "© " + new Date().getFullYear() + " " + state.footer.copyright;
    $("#page-company").textContent = state.brand.legalName + " · CNPJ " + state.brand.cnpj;
  }

  function renderNotFound() {
    document.title = "Pagina nao encontrada | " + state.brand.name;
    $("#page-content").innerHTML = '<section class="page-not-found"><div class="shell"><span>404</span><h1>Esta pagina nao foi encontrada.</h1><p>O endereco pode ter mudado ou a pagina ainda nao foi publicada.</p><a class="button button--primary" href="./index.html">Voltar ao inicio</a></div></section>';
  }

  function init() {
    state = FL.getState();
    const slug = new URLSearchParams(location.search).get("slug") || "";
    const preview = new URLSearchParams(location.search).has("preview");
    page = state.pages.find(function (item) { return item.slug === slug && (item.status === "published" || preview); });
    applyTheme();
    renderHeaderAndFooter();
    if (!page) renderNotFound();
    else {
      document.title = page.title + " | " + state.brand.name;
      $("meta[name=description]").content = page.description || state.seo.description;
      $("#page-content").innerHTML = page.blocks.map(renderBlock).join("");
      FL.trackEvent("page_view", { source: "internal_page", pageId: page.id });
    }
    $("#page-theme-toggle").addEventListener("click", function () { const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; localStorage.setItem("fl-site-theme", next); applyTheme(); refreshIcons(); });
    refreshIcons();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  function collection(items, options) {
    const config = options || {};
    const source = Array.isArray(items) ? items.slice() : [];
    const term = normalize(config.search);
    let rows = source.filter(function (item) {
      if (config.predicate && !config.predicate(item)) return false;
      if (!term) return true;
      const searchable = config.searchText ? config.searchText(item) : Object.values(item || {}).join(" ");
      return normalize(searchable).includes(term);
    });
    if (config.sort) rows.sort(config.sort);
    const pageSize = Math.max(1, Number(config.pageSize || rows.length || 1));
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    const page = Math.min(pageCount, Math.max(1, Number(config.page || 1)));
    const startIndex = (page - 1) * pageSize;
    return {
      items: rows.slice(startIndex, startIndex + pageSize),
      all: rows,
      total: source.length,
      filteredTotal: rows.length,
      page: page,
      pageCount: pageCount,
      pageSize: pageSize,
      start: rows.length ? startIndex + 1 : 0,
      end: Math.min(rows.length, startIndex + pageSize),
    };
  }

  function selectOptions(options, selected) {
    return (options || []).map(function (option) {
      return '<option value="' + escapeHtml(option.value) + '"' + (String(option.value) === String(selected) ? " selected" : "") + '>' + escapeHtml(option.label) + '</option>';
    }).join("");
  }

  function toolbar(config) {
    const filters = (config.filters || []).map(function (filter) {
      return '<label class="crud-filter"><span class="sr-only">' + escapeHtml(filter.label) + '</span><select data-crud-filter="' + escapeHtml(config.key) + '" data-filter-name="' + escapeHtml(filter.name) + '" aria-label="' + escapeHtml(filter.label) + '">' + selectOptions(filter.options, filter.value) + '</select></label>';
    }).join("");
    const sort = config.sortOptions && config.sortOptions.length
      ? '<label class="crud-sort"><span class="sr-only">Ordenar</span><select data-crud-sort="' + escapeHtml(config.key) + '" aria-label="Ordenar resultados">' + selectOptions(config.sortOptions, config.sortValue) + '</select></label>'
      : "";
    return '<section class="crud-toolbar" aria-label="Ferramentas da listagem"><div class="crud-search"><i data-lucide="search"></i><input type="search" data-crud-search="' + escapeHtml(config.key) + '" value="' + escapeHtml(config.search || "") + '" placeholder="' + escapeHtml(config.placeholder || "Buscar") + '" aria-label="' + escapeHtml(config.placeholder || "Buscar") + '"><kbd>/</kbd></div><div class="crud-toolbar__controls">' + filters + sort + '</div><span class="crud-result-count" aria-live="polite">' + Number(config.count || 0) + ' ' + escapeHtml(config.count === 1 ? (config.singular || "resultado") : (config.plural || "resultados")) + '</span></section>';
  }

  function pagination(result, key) {
    if (!result || result.pageCount <= 1) return "";
    const pages = [];
    for (let page = 1; page <= result.pageCount; page += 1) {
      if (page === 1 || page === result.pageCount || Math.abs(page - result.page) <= 1) pages.push(page);
      else if (pages[pages.length - 1] !== "ellipsis") pages.push("ellipsis");
    }
    return '<nav class="crud-pagination" aria-label="Paginacao"><span>Exibindo ' + result.start + '-' + result.end + ' de ' + result.filteredTotal + '</span><div><button type="button" data-crud-page="' + escapeHtml(key) + '" data-page="' + (result.page - 1) + '"' + (result.page === 1 ? " disabled" : "") + ' aria-label="Pagina anterior"><i data-lucide="chevron-left"></i></button>' + pages.map(function (page) {
      if (page === "ellipsis") return '<span aria-hidden="true">...</span>';
      return '<button type="button" data-crud-page="' + escapeHtml(key) + '" data-page="' + page + '" class="' + (page === result.page ? "is-active" : "") + '" aria-label="Pagina ' + page + '"' + (page === result.page ? ' aria-current="page"' : "") + '>' + page + '</button>';
    }).join("") + '<button type="button" data-crud-page="' + escapeHtml(key) + '" data-page="' + (result.page + 1) + '"' + (result.page === result.pageCount ? " disabled" : "") + ' aria-label="Proxima pagina"><i data-lucide="chevron-right"></i></button></div></nav>';
  }

  function emptyState(config) {
    const actionIcon = config.actionIcon || (String(config.action || "").startsWith("clear-") ? "filter-x" : "plus");
    const action = config.actionLabel && config.action
      ? '<button class="button button--primary" type="button" data-action="' + escapeHtml(config.action) + '"><i data-lucide="' + escapeHtml(actionIcon) + '"></i>' + escapeHtml(config.actionLabel) + '</button>'
      : "";
    return '<div class="empty-state empty-state--crud"><span><i data-lucide="' + escapeHtml(config.icon || "inbox") + '"></i></span><h3>' + escapeHtml(config.title) + '</h3><p>' + escapeHtml(config.description) + '</p>' + action + '</div>';
  }

  function bulkBar(config) {
    if (!config.count) return "";
    return '<section class="crud-bulk-bar" role="status"><div><strong>' + Number(config.count) + '</strong><span>' + escapeHtml(config.count === 1 ? "item selecionado" : "itens selecionados") + '</span></div><div>' + (config.actions || []).map(function (action) {
      return '<button type="button" class="button ' + (action.danger ? "button--danger" : "button--ghost") + ' button--compact" data-bulk-action="' + escapeHtml(action.id) + '" data-bulk-key="' + escapeHtml(config.key) + '"><i data-lucide="' + escapeHtml(action.icon) + '"></i>' + escapeHtml(action.label) + '</button>';
    }).join("") + '<button class="icon-button" type="button" data-bulk-clear="' + escapeHtml(config.key) + '" aria-label="Limpar selecao"><i data-lucide="x"></i></button></div></section>';
  }

  function confirmation(config) {
    const destructive = config.danger !== false;
    const buttonClass = destructive ? "button--danger" : "button--primary";
    const confirmIcon = config.confirmIcon || (destructive ? "trash-2" : "check");
    return '<div class="confirm-dialog"><span class="confirm-dialog__icon"><i data-lucide="' + escapeHtml(config.icon || "triangle-alert") + '"></i></span><div class="modal-header"><span class="eyebrow">Confirmar acao</span><h2 id="admin-dialog-title">' + escapeHtml(config.title) + '</h2><p>' + escapeHtml(config.description) + '</p></div>' + (config.impact ? '<div class="confirm-dialog__impact"><i data-lucide="info"></i><span>' + escapeHtml(config.impact) + '</span></div>' : "") + '<div class="modal-actions"><button class="button button--ghost" type="button" data-admin-modal-close>Cancelar</button><button class="button ' + buttonClass + '" type="button" data-confirm-submit><i data-lucide="' + escapeHtml(confirmIcon) + '"></i>' + escapeHtml(config.confirmLabel || "Excluir") + '</button></div></div>';
  }

  function isSafeUrl(value, options) {
    const input = String(value || "").trim();
    if (!input) return Boolean(options && options.allowEmpty);
    if (input.charAt(0) === "#" || input.startsWith("./") || input.startsWith("/")) return true;
    if (input === "whatsapp") return true;
    try {
      const url = new URL(input);
      return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
    } catch (error) { return false; }
  }

  function isSafeImageUrl(value, options) {
    const input = String(value || "").trim();
    if (!input) return Boolean(options && options.allowEmpty);
    if (/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(input)) return true;
    if (input.startsWith("./") || input.startsWith("/")) return true;
    try { return ["http:", "https:"].includes(new URL(input).protocol); }
    catch (error) { return false; }
  }

  window.FLAdmin = { escapeHtml, normalize, collection, toolbar, pagination, emptyState, bulkBar, confirmation, isSafeUrl, isSafeImageUrl };
})();

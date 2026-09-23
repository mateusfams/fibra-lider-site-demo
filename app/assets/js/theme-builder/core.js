(function () {
  "use strict";

  const SCHEMA_VERSION = 1;
  const REGISTRY_VERSION = "2026.10";
  const MAX_NODES = 1200;
  const MAX_DEPTH = 32;
  const DRAFT_PREFIX = "fl-vb-draft-v1:";
  const RELEASE_PREFIX = "fl-vb-release-v1:";
  const RELEASE_HISTORY_PREFIX = "fl-vb-release-history-v1:";
  const FRAGMENTS_PREFIX = "fl-vb-fragments-v1:";
  const WORKSPACE_DRAFT_PREFIX = "fl-vb-workspace-draft-v1:";
  const WORKSPACE_RELEASE_PREFIX = "fl-vb-workspace-release-v1:";
  const WORKSPACE_HISTORY_PREFIX = "fl-vb-workspace-history-v1:";

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function uid(prefix) {
    const head = prefix || "node";
    if (window.crypto && typeof window.crypto.randomUUID === "function") return head + "_" + window.crypto.randomUUID().replace(/-/g, "").slice(0, 18);
    return head + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function slug(value) {
    return String(value || "site").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "site";
  }

  function getAt(target, path) {
    const parts = Array.isArray(path) ? path : String(path || "").split(".").filter(Boolean);
    return parts.reduce(function (value, key) { return value == null ? undefined : value[key]; }, target);
  }

  function setAt(target, path, value) {
    const parts = Array.isArray(path) ? path : String(path || "").split(".").filter(Boolean);
    if (!parts.length) throw new Error("Caminho de alteracao invalido.");
    let cursor = target;
    parts.slice(0, -1).forEach(function (key) {
      if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
      cursor = cursor[key];
    });
    const last = parts[parts.length - 1];
    const previous = clone(cursor[last]);
    if (value === undefined) delete cursor[last];
    else cursor[last] = clone(value);
    return previous;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function safeUrl(value, fallback) {
    const input = String(value || "").trim();
    const replacement = fallback == null ? "#" : fallback;
    if (!input) return replacement;
    if (input === "whatsapp" || input.charAt(0) === "#" || input.startsWith("./") || input.startsWith("/")) return input;
    try { return ["http:", "https:", "mailto:", "tel:"].includes(new URL(input, location.href).protocol) ? input : replacement; }
    catch (error) { return replacement; }
  }

  function safeMediaUrl(value, fallback) {
    const input = String(value || "").trim();
    const replacement = fallback == null ? "" : fallback;
    if (!input) return replacement;
    if (/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(input)) return input;
    if (input.startsWith("./") || input.startsWith("/")) return input;
    try { return ["http:", "https:", "blob:"].includes(new URL(input, location.href).protocol) ? input : replacement; }
    catch (error) { return replacement; }
  }

  function plainText(value, maxLength) {
    return String(value == null ? "" : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, maxLength || 10000);
  }

  class ComponentRegistry {
    constructor() {
      this.definitions = new Map();
    }

    register(definition) {
      if (!definition || !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(definition.type || "")) throw new Error("Tipo de componente invalido.");
      if (this.definitions.has(definition.type)) throw new Error("Componente duplicado: " + definition.type);
      const normalized = {
        version: 1,
        category: "content",
        label: definition.type,
        icon: "box",
        propsSchema: {},
        slots: {},
        styleCapabilities: [],
        defaults: {},
        inlineProperty: "",
        ...definition,
      };
      this.definitions.set(normalized.type, normalized);
      return normalized;
    }

    get(type) {
      return this.definitions.get(type) || null;
    }

    require(type) {
      const definition = this.get(type);
      if (!definition) throw new Error("Componente nao registrado: " + type);
      return definition;
    }

    list(options) {
      const config = options || {};
      return Array.from(this.definitions.values()).filter(function (definition) {
        if (config.category && definition.category !== config.category) return false;
        if (config.search) {
          const term = String(config.search).toLowerCase();
          return (definition.label + " " + definition.type + " " + definition.category).toLowerCase().includes(term);
        }
        return definition.hidden !== true;
      });
    }

    categories() {
      return Array.from(new Set(this.list().map(function (definition) { return definition.category; })));
    }
  }

  const registry = new ComponentRegistry();
  let documentFactory = null;
  let pageDocumentFactory = null;

  function setDocumentFactory(factory) {
    documentFactory = factory;
  }

  function setPageDocumentFactory(factory) {
    pageDocumentFactory = factory;
  }

  function emptyStyles() {
    return {
      base: { normal: {}, hover: {}, focus: {}, active: {}, disabled: {} },
      md: { normal: {}, hover: {}, focus: {}, active: {}, disabled: {} },
      sm: { normal: {}, hover: {}, focus: {}, active: {}, disabled: {} },
    };
  }

  function normalizeStyles(styles) {
    const next = emptyStyles();
    ["base", "md", "sm"].forEach(function (breakpoint) {
      ["normal", "hover", "focus", "active", "disabled"].forEach(function (state) {
        if (styles && styles[breakpoint] && styles[breakpoint][state] && typeof styles[breakpoint][state] === "object") next[breakpoint][state] = { ...styles[breakpoint][state] };
      });
    });
    return next;
  }

  function createNode(type, overrides) {
    const definition = registry.require(type);
    const defaults = typeof definition.defaults === "function" ? definition.defaults() : clone(definition.defaults || {});
    const patch = overrides || {};
    const slots = {};
    Object.keys(definition.slots || {}).forEach(function (name) { slots[name] = []; });
    return {
      id: patch.id || uid(type.split(".").pop()),
      type: type,
      version: definition.version,
      name: patch.name || definition.label,
      props: { ...(defaults.props || {}), ...(patch.props || {}) },
      bindings: { ...(defaults.bindings || {}), ...(patch.bindings || {}) },
      styles: normalizeStyles({ ...(defaults.styles || {}), ...(patch.styles || {}) }),
      visibility: { base: true, md: true, sm: true, ...(defaults.visibility || {}), ...(patch.visibility || {}) },
      slots: { ...slots, ...(clone(defaults.slots || {})), ...(clone(patch.slots || {})) },
      meta: { locked: false, ...(defaults.meta || {}), ...(patch.meta || {}) },
    };
  }

  function createDocument(options) {
    const config = options || {};
    const root = createNode("core.page", { id: config.rootId || uid("page"), name: config.name || "Pagina" });
    return {
      schemaVersion: SCHEMA_VERSION,
      registryVersion: REGISTRY_VERSION,
      documentId: config.documentId || uid("document"),
      kind: config.kind || "page",
      name: config.name || "Nova pagina",
      rootId: root.id,
      settings: { slug: config.slug || "/", locale: "pt-BR", seo: { title: config.name || "Nova pagina", description: "" }, ...(config.settings || {}) },
      references: { theme: "theme_default", symbols: [] },
      theme: clone(config.theme || { tokens: {} }),
      nodes: { [root.id]: root },
      meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), migratedFrom: "" },
    };
  }

  function parentOf(document, childId) {
    const ids = Object.keys(document.nodes || {});
    for (const parentId of ids) {
      const parent = document.nodes[parentId];
      for (const slotName of Object.keys(parent.slots || {})) {
        const index = parent.slots[slotName].indexOf(childId);
        if (index >= 0) return { parentId: parentId, slot: slotName, index: index };
      }
    }
    return null;
  }

  function childIds(node) {
    return Object.values(node && node.slots || {}).reduce(function (all, ids) { return all.concat(Array.isArray(ids) ? ids : []); }, []);
  }

  function subtreeIds(document, nodeId) {
    const result = [];
    const visit = function (id) {
      if (result.includes(id) || !document.nodes[id]) return;
      result.push(id);
      childIds(document.nodes[id]).forEach(visit);
    };
    visit(nodeId);
    return result;
  }

  function canInsert(document, parentId, slotName, childType) {
    const parent = document.nodes[parentId];
    if (!parent) return { ok: false, message: "Container de destino inexistente." };
    const parentDefinition = registry.get(parent.type);
    const childDefinition = registry.get(childType);
    if (!parentDefinition || !childDefinition) return { ok: false, message: "Componente nao registrado." };
    const slot = parentDefinition.slots && parentDefinition.slots[slotName];
    if (!slot) return { ok: false, message: "Este componente nao aceita filhos neste local." };
    const current = parent.slots[slotName] || [];
    if (Number.isFinite(slot.max) && current.length >= slot.max) return { ok: false, message: "O limite deste slot foi atingido." };
    if (Array.isArray(slot.types) && slot.types.length && !slot.types.includes(childType)) return { ok: false, message: "Componente incompativel com este slot." };
    if (Array.isArray(slot.categories) && slot.categories.length && !slot.categories.includes(childDefinition.category)) return { ok: false, message: "Categoria incompativel com este slot." };
    if (Array.isArray(childDefinition.allowedParents) && childDefinition.allowedParents.length && !childDefinition.allowedParents.includes(parent.type)) return { ok: false, message: "Este componente nao pode ser inserido aqui." };
    return { ok: true };
  }

  function validateField(value, field, path, errors) {
    if (field.required && (value == null || value === "")) errors.push({ code: "required", path: path, message: "Campo obrigatorio: " + (field.label || path) });
    if (value == null || value === "") return;
    if (field.type === "number" && !Number.isFinite(Number(value))) errors.push({ code: "type", path: path, message: "Valor numerico invalido." });
    if (field.type === "boolean" && typeof value !== "boolean") errors.push({ code: "type", path: path, message: "Valor booleano invalido." });
    if (field.type === "url" && safeUrl(value, "") === "") errors.push({ code: "url", path: path, message: "URL invalida." });
    if (field.type === "image" && safeMediaUrl(value, "") === "") errors.push({ code: "image", path: path, message: "Imagem invalida ou nao permitida." });
    if (field.maxLength && String(value).length > field.maxLength) errors.push({ code: "length", path: path, message: "Conteudo acima do limite permitido." });
    if (field.options && !field.options.some(function (option) { return String(typeof option === "string" ? option : option.value) === String(value); })) errors.push({ code: "option", path: path, message: "Opcao invalida." });
  }

  function validateDocument(document) {
    const errors = [];
    const warnings = [];
    if (!document || typeof document !== "object") return { valid: false, errors: [{ code: "document", path: "", message: "Documento ausente." }], warnings: [] };
    if (document.schemaVersion !== SCHEMA_VERSION) errors.push({ code: "schema", path: "schemaVersion", message: "Versao de documento nao suportada." });
    if (!document.rootId || !document.nodes || !document.nodes[document.rootId]) errors.push({ code: "root", path: "rootId", message: "Raiz do documento inexistente." });
    const ids = Object.keys(document.nodes || {});
    if (ids.length > MAX_NODES) errors.push({ code: "limit", path: "nodes", message: "O documento excede o limite de componentes." });
    const seen = new Set();
    const active = new Set();

    function visit(nodeId, depth) {
      if (depth > MAX_DEPTH) { errors.push({ code: "depth", path: "nodes." + nodeId, message: "Hierarquia acima do limite permitido." }); return; }
      if (active.has(nodeId)) { errors.push({ code: "cycle", path: "nodes." + nodeId, message: "Ciclo detectado na arvore." }); return; }
      if (seen.has(nodeId)) { errors.push({ code: "multiple-parent", path: "nodes." + nodeId, message: "Componente possui mais de um pai." }); return; }
      const node = document.nodes[nodeId];
      if (!node) { errors.push({ code: "reference", path: "nodes." + nodeId, message: "Referencia para componente inexistente." }); return; }
      seen.add(nodeId); active.add(nodeId);
      const definition = registry.get(node.type);
      if (!definition) errors.push({ code: "component", path: "nodes." + nodeId + ".type", message: "Componente desconhecido: " + node.type });
      else {
        if (Number(node.version) > Number(definition.version)) errors.push({ code: "version", path: "nodes." + nodeId + ".version", message: "Versao do componente ainda nao suportada." });
        Object.keys(definition.propsSchema || {}).forEach(function (key) { validateField(node.props && node.props[key], definition.propsSchema[key], "nodes." + nodeId + ".props." + key, errors); });
        Object.keys(node.slots || {}).forEach(function (slotName) {
          const slotDefinition = definition.slots && definition.slots[slotName];
          if (!slotDefinition) errors.push({ code: "slot", path: "nodes." + nodeId + ".slots." + slotName, message: "Slot nao reconhecido." });
          if (!Array.isArray(node.slots[slotName])) errors.push({ code: "slot-type", path: "nodes." + nodeId + ".slots." + slotName, message: "Slot deve ser uma lista." });
        });
        Object.keys(definition.slots || {}).forEach(function (slotName) {
          const list = node.slots && node.slots[slotName];
          const slot = definition.slots[slotName];
          if (!Array.isArray(list)) errors.push({ code: "slot-required", path: "nodes." + nodeId + ".slots." + slotName, message: "Slot obrigatorio ausente." });
          else {
            if (Number.isFinite(slot.min) && list.length < slot.min) warnings.push({ code: "slot-min", path: "nodes." + nodeId + ".slots." + slotName, message: "Slot possui menos itens que o recomendado." });
            if (Number.isFinite(slot.max) && list.length > slot.max) errors.push({ code: "slot-max", path: "nodes." + nodeId + ".slots." + slotName, message: "Slot excede o limite." });
            list.forEach(function (childId) {
              const child = document.nodes[childId];
              if (child) {
                const allowed = canInsert(document, nodeId, slotName, child.type);
                if (!allowed.ok) errors.push({ code: "parent", path: "nodes." + childId, message: allowed.message });
              }
            });
          }
        });
      }
      childIds(node).forEach(function (childId) { visit(childId, depth + 1); });
      active.delete(nodeId);
    }

    if (document.rootId && document.nodes && document.nodes[document.rootId]) visit(document.rootId, 0);
    ids.filter(function (id) { return !seen.has(id); }).forEach(function (id) { warnings.push({ code: "orphan", path: "nodes." + id, message: "Componente orfao nao sera renderizado." }); });
    return { valid: errors.length === 0, errors: errors, warnings: warnings, nodeCount: ids.length };
  }

  function validateWorkspace(workspace) {
    const errors = [];
    const warnings = [];
    if (!workspace || typeof workspace !== "object") return { valid: false, errors: [{ code: "workspace", path: "", message: "Workspace ausente." }], warnings: [] };
    const documents = workspace.documents || {};
    const documentIds = Object.keys(documents);
    if (!documentIds.length) errors.push({ code: "documents", path: "documents", message: "O workspace precisa conter pelo menos uma pagina." });
    if (!workspace.activeDocumentId || !documents[workspace.activeDocumentId]) errors.push({ code: "active-document", path: "activeDocumentId", message: "Pagina ativa inexistente." });
    const routes = new Set();
    documentIds.forEach(function (id) {
      const documentValidation = validateDocument(documents[id]);
      documentValidation.errors.forEach(function (error) { errors.push({ ...error, path: "documents." + id + (error.path ? "." + error.path : "") }); });
      documentValidation.warnings.forEach(function (warning) { warnings.push({ ...warning, path: "documents." + id + (warning.path ? "." + warning.path : "") }); });
      const route = String(documents[id].settings && documents[id].settings.slug || "");
      if (!route) errors.push({ code: "route", path: "documents." + id + ".settings.slug", message: "Pagina sem rota." });
      else if (routes.has(route)) errors.push({ code: "duplicate-route", path: "documents." + id + ".settings.slug", message: "Duas paginas usam a mesma rota." });
      routes.add(route);
    });
    return { valid: errors.length === 0, errors: errors, warnings: warnings, documentCount: documentIds.length, nodeCount: documentIds.reduce(function (total, id) { return total + Object.keys(documents[id].nodes || {}).length; }, 0) };
  }

  function createWorkspace(state) {
    if (typeof documentFactory !== "function") throw new Error("Factory do documento ainda nao registrada.");
    const home = documentFactory(state);
    const documents = { [home.documentId]: home };
    if (typeof pageDocumentFactory === "function") {
      (state && state.pages || []).forEach(function (page) {
        const document = pageDocumentFactory(state, page);
        if (document && validateDocument(document).valid) documents[document.documentId] = document;
      });
    }
    return {
      workspaceVersion: 1,
      registryVersion: REGISTRY_VERSION,
      workspaceId: uid("workspace"),
      name: plainText(state && state.brand && state.brand.name || "Site", 120),
      activeDocumentId: home.documentId,
      documents: documents,
      meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    };
  }

  function remapSubtree(nodes, rootId) {
    const mapping = {};
    Object.keys(nodes).forEach(function (id) { mapping[id] = uid("node"); });
    const next = {};
    Object.keys(nodes).forEach(function (id) {
      const node = clone(nodes[id]);
      node.id = mapping[id];
      node.name = node.name + " - copia";
      Object.keys(node.slots || {}).forEach(function (slot) { node.slots[slot] = node.slots[slot].map(function (childId) { return mapping[childId]; }); });
      next[node.id] = node;
    });
    return { rootId: mapping[rootId], nodes: next };
  }

  function extractSubtree(document, rootId) {
    const nodes = {};
    subtreeIds(document, rootId).forEach(function (id) { nodes[id] = clone(document.nodes[id]); });
    return { rootId: rootId, nodes: nodes };
  }

  function applyCommand(source, command) {
    const document = clone(source);
    const payload = command && command.payload || {};
    let inverse = null;

    if (!command || !command.type) throw new Error("Comando invalido.");

    if (command.type === "set") {
      const previous = setAt(document, payload.path, payload.value);
      inverse = { type: "set", payload: { path: payload.path, value: previous }, label: command.label };
    } else if (command.type === "insert") {
      const node = clone(payload.node);
      const allowed = canInsert(document, payload.parentId, payload.slot || "default", node.type);
      if (!allowed.ok) throw new Error(allowed.message);
      if (document.nodes[node.id]) throw new Error("ID de componente duplicado.");
      document.nodes[node.id] = node;
      const list = document.nodes[payload.parentId].slots[payload.slot || "default"];
      const index = Math.max(0, Math.min(list.length, payload.index == null ? list.length : Number(payload.index)));
      list.splice(index, 0, node.id);
      inverse = { type: "delete", payload: { nodeId: node.id }, label: command.label };
    } else if (command.type === "insert-subtree") {
      const subtree = clone(payload.subtree);
      const root = subtree.nodes[subtree.rootId];
      const allowed = canInsert(document, payload.parentId, payload.slot || "default", root.type);
      if (!allowed.ok) throw new Error(allowed.message);
      Object.keys(subtree.nodes).forEach(function (id) {
        if (document.nodes[id]) throw new Error("ID duplicado ao restaurar componente.");
        document.nodes[id] = subtree.nodes[id];
      });
      const list = document.nodes[payload.parentId].slots[payload.slot || "default"];
      const index = Math.max(0, Math.min(list.length, payload.index == null ? list.length : Number(payload.index)));
      list.splice(index, 0, subtree.rootId);
      inverse = { type: "delete", payload: { nodeId: subtree.rootId }, label: command.label };
    } else if (command.type === "delete") {
      if (payload.nodeId === document.rootId) throw new Error("A raiz da pagina nao pode ser excluida.");
      const location = parentOf(document, payload.nodeId);
      if (!location) throw new Error("Componente sem pai.");
      const subtree = extractSubtree(document, payload.nodeId);
      document.nodes[location.parentId].slots[location.slot].splice(location.index, 1);
      Object.keys(subtree.nodes).forEach(function (id) { delete document.nodes[id]; });
      inverse = { type: "insert-subtree", payload: { parentId: location.parentId, slot: location.slot, index: location.index, subtree: subtree }, label: command.label };
    } else if (command.type === "move") {
      if (payload.nodeId === document.rootId) throw new Error("A raiz da pagina nao pode ser movida.");
      const previous = parentOf(document, payload.nodeId);
      if (!previous) throw new Error("Origem do componente nao encontrada.");
      if (subtreeIds(document, payload.nodeId).includes(payload.parentId)) throw new Error("Um componente nao pode ser movido para dentro de si mesmo.");
      const node = document.nodes[payload.nodeId];
      const allowed = canInsert(document, payload.parentId, payload.slot || "default", node.type);
      if (!allowed.ok && !(previous.parentId === payload.parentId && previous.slot === (payload.slot || "default"))) throw new Error(allowed.message);
      document.nodes[previous.parentId].slots[previous.slot].splice(previous.index, 1);
      const list = document.nodes[payload.parentId].slots[payload.slot || "default"];
      let index = Math.max(0, Math.min(list.length, payload.index == null ? list.length : Number(payload.index)));
      if (previous.parentId === payload.parentId && previous.slot === (payload.slot || "default") && previous.index < index) index -= 1;
      list.splice(index, 0, payload.nodeId);
      inverse = { type: "move", payload: { nodeId: payload.nodeId, parentId: previous.parentId, slot: previous.slot, index: previous.index }, label: command.label };
    } else if (command.type === "duplicate") {
      const location = parentOf(document, payload.nodeId);
      if (!location) throw new Error("Componente sem pai.");
      const copy = remapSubtree(extractSubtree(document, payload.nodeId).nodes, payload.nodeId);
      Object.assign(document.nodes, copy.nodes);
      document.nodes[location.parentId].slots[location.slot].splice(location.index + 1, 0, copy.rootId);
      inverse = { type: "delete", payload: { nodeId: copy.rootId }, label: command.label };
      payload.createdId = copy.rootId;
    } else if (command.type === "batch") {
      let current = document;
      const inverses = [];
      (payload.commands || []).forEach(function (entry) {
        const result = applyCommand(current, entry);
        current = result.document;
        inverses.unshift(result.inverse);
      });
      current.meta.updatedAt = new Date().toISOString();
      return { document: current, inverse: { type: "batch", payload: { commands: inverses }, label: command.label }, selectionId: payload.selectionId || null };
    } else {
      throw new Error("Comando nao suportado: " + command.type);
    }

    document.meta = { ...(document.meta || {}), updatedAt: new Date().toISOString() };
    return { document: document, inverse: inverse, selectionId: payload.createdId || payload.nodeId || null };
  }

  class CommandHistory {
    constructor(limit) {
      this.limit = Math.max(10, Number(limit || 100));
      this.past = [];
      this.future = [];
    }

    execute(document, command) {
      const result = applyCommand(document, command);
      this.past.push({ forward: clone(command), inverse: result.inverse, label: command.label || command.type });
      if (this.past.length > this.limit) this.past.shift();
      this.future = [];
      return result;
    }

    undo(document) {
      const entry = this.past.pop();
      if (!entry) return { document: document, selectionId: null };
      const result = applyCommand(document, entry.inverse);
      this.future.push(entry);
      return result;
    }

    redo(document) {
      const entry = this.future.pop();
      if (!entry) return { document: document, selectionId: null };
      const result = applyCommand(document, entry.forward);
      this.past.push(entry);
      return result;
    }

    canUndo() { return this.past.length > 0; }
    canRedo() { return this.future.length > 0; }
    clear() { this.past = []; this.future = []; }
  }

  function storageKey(prefix, state) {
    return prefix + slug(state && state.brand && state.brand.slug || "default");
  }

  function parseStored(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch (error) {
      console.warn("Theme Builder: armazenamento local invalido", error);
      return clone(fallback);
    }
  }

  const storage = {
    loadDraft: function (state) {
      const key = storageKey(DRAFT_PREFIX, state);
      const stored = parseStored(key, null);
      if (stored && stored.document && validateDocument(stored.document).valid) return stored;
      if (typeof documentFactory !== "function") throw new Error("Factory do documento ainda nao registrada.");
      const document = documentFactory(state);
      const draft = { document: document, revision: 1, updatedAt: new Date().toISOString(), status: "draft" };
      localStorage.setItem(key, JSON.stringify(draft));
      return draft;
    },

    saveDraft: function (state, document, expectedRevision) {
      const validation = validateDocument(document);
      if (!validation.valid) {
        const error = new Error("O rascunho contem erros estruturais.");
        error.validation = validation;
        throw error;
      }
      const key = storageKey(DRAFT_PREFIX, state);
      const current = parseStored(key, { revision: 0 });
      if (expectedRevision != null && Number(current.revision || 0) !== Number(expectedRevision)) {
        const conflict = new Error("O documento foi alterado em outra sessao.");
        conflict.code = "REVISION_CONFLICT";
        throw conflict;
      }
      const payload = { document: clone(document), revision: Number(current.revision || 0) + 1, updatedAt: new Date().toISOString(), status: "draft" };
      localStorage.setItem(key, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent("fl:vb-draft", { detail: clone(payload) }));
      return payload;
    },

    getPublished: function (state) {
      return parseStored(storageKey(RELEASE_PREFIX, state), null);
    },

    publish: function (state, document) {
      const validation = validateDocument(document);
      if (!validation.valid) {
        const error = new Error("Corrija os erros antes de publicar.");
        error.validation = validation;
        throw error;
      }
      const previous = this.getPublished(state);
      const release = {
        releaseId: uid("release"),
        document: clone(document),
        documentHash: String(JSON.stringify(document).length) + "-" + Number(document.meta && new Date(document.meta.updatedAt).getTime() || Date.now()).toString(36),
        publishedAt: new Date().toISOString(),
        previousReleaseId: previous && previous.releaseId || "",
        validation: { warnings: validation.warnings.length, nodes: validation.nodeCount },
      };
      const historyKey = storageKey(RELEASE_HISTORY_PREFIX, state);
      const history = parseStored(historyKey, []);
      if (previous) history.unshift(previous);
      localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 10)));
      localStorage.setItem(storageKey(RELEASE_PREFIX, state), JSON.stringify(release));
      window.dispatchEvent(new CustomEvent("fl:vb-published", { detail: clone(release) }));
      return release;
    },

    releases: function (state) {
      const current = this.getPublished(state);
      return (current ? [current] : []).concat(parseStored(storageKey(RELEASE_HISTORY_PREFIX, state), []));
    },

    rollback: function (state, releaseId) {
      const releases = this.releases(state);
      const target = releases.find(function (release) { return release.releaseId === releaseId; });
      if (!target) throw new Error("Release para restauracao nao encontrado.");
      return this.publish(state, target.document);
    },

    fragments: function (state) {
      return parseStored(storageKey(FRAGMENTS_PREFIX, state), []);
    },

    saveFragment: function (state, fragment) {
      const key = storageKey(FRAGMENTS_PREFIX, state);
      const fragments = this.fragments(state);
      fragments.unshift({ id: fragment.id || uid("fragment"), name: plainText(fragment.name || "Secao salva", 80), category: fragment.category || "saved", subtree: clone(fragment.subtree), createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(fragments.slice(0, 50)));
      return fragments[0];
    },

    deleteFragment: function (state, id) {
      const key = storageKey(FRAGMENTS_PREFIX, state);
      const fragments = this.fragments(state).filter(function (fragment) { return fragment.id !== id; });
      localStorage.setItem(key, JSON.stringify(fragments));
      return fragments;
    },

    loadWorkspace: function (state) {
      const key = storageKey(WORKSPACE_DRAFT_PREFIX, state);
      const stored = parseStored(key, null);
      if (stored && stored.workspace && validateWorkspace(stored.workspace).valid) return stored;
      const workspace = createWorkspace(state);
      const legacyDraft = parseStored(storageKey(DRAFT_PREFIX, state), null);
      if (legacyDraft && legacyDraft.document && validateDocument(legacyDraft.document).valid) {
        const home = Object.values(workspace.documents).find(function (document) { return document.settings && document.settings.slug === "/"; });
        if (home) {
          delete workspace.documents[home.documentId];
          workspace.documents[legacyDraft.document.documentId] = legacyDraft.document;
          workspace.activeDocumentId = legacyDraft.document.documentId;
        }
      }
      const payload = { workspace: workspace, revision: 1, updatedAt: new Date().toISOString(), status: "draft" };
      localStorage.setItem(key, JSON.stringify(payload));
      return payload;
    },

    saveWorkspace: function (state, workspace, expectedRevision) {
      const validation = validateWorkspace(workspace);
      if (!validation.valid) {
        const error = new Error("O workspace contem erros estruturais.");
        error.validation = validation;
        throw error;
      }
      const key = storageKey(WORKSPACE_DRAFT_PREFIX, state);
      const current = parseStored(key, { revision: 0 });
      if (expectedRevision != null && Number(current.revision || 0) !== Number(expectedRevision)) {
        const conflict = new Error("O workspace foi alterado em outra sessao.");
        conflict.code = "REVISION_CONFLICT";
        throw conflict;
      }
      const next = clone(workspace);
      next.meta = { ...(next.meta || {}), updatedAt: new Date().toISOString() };
      const payload = { workspace: next, revision: Number(current.revision || 0) + 1, updatedAt: new Date().toISOString(), status: "draft" };
      localStorage.setItem(key, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent("fl:vb-workspace-draft", { detail: clone(payload) }));
      return payload;
    },

    getPublishedWorkspace: function (state) {
      return parseStored(storageKey(WORKSPACE_RELEASE_PREFIX, state), null);
    },

    publishWorkspace: function (state, workspace) {
      const validation = validateWorkspace(workspace);
      if (!validation.valid) {
        const error = new Error("Corrija os erros antes de publicar.");
        error.validation = validation;
        throw error;
      }
      const previous = this.getPublishedWorkspace(state);
      const release = {
        releaseId: uid("workspace_release"),
        workspace: clone(workspace),
        publishedAt: new Date().toISOString(),
        previousReleaseId: previous && previous.releaseId || "",
        validation: { warnings: validation.warnings.length, documents: validation.documentCount, nodes: validation.nodeCount },
      };
      const historyKey = storageKey(WORKSPACE_HISTORY_PREFIX, state);
      const history = parseStored(historyKey, []);
      if (previous) history.unshift(previous);
      localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 10)));
      localStorage.setItem(storageKey(WORKSPACE_RELEASE_PREFIX, state), JSON.stringify(release));
      window.dispatchEvent(new CustomEvent("fl:vb-workspace-published", { detail: clone(release) }));
      return release;
    },

    workspaceReleases: function (state) {
      const current = this.getPublishedWorkspace(state);
      return (current ? [current] : []).concat(parseStored(storageKey(WORKSPACE_HISTORY_PREFIX, state), []));
    },

    rollbackWorkspace: function (state, releaseId) {
      const target = this.workspaceReleases(state).find(function (release) { return release.releaseId === releaseId; });
      if (!target) throw new Error("Release para restauracao nao encontrado.");
      return this.publishWorkspace(state, target.workspace);
    },
  };

  class Autosave {
    constructor(save, delay) {
      this.save = save;
      this.delay = Number(delay || 900);
      this.timer = null;
      this.pending = null;
      this.status = "saved";
      this.listeners = [];
    }

    onStatus(listener) { this.listeners.push(listener); return this; }
    emit(status, detail) { this.status = status; this.listeners.forEach(function (listener) { listener(status, detail); }); }

    schedule(value) {
      this.pending = clone(value);
      clearTimeout(this.timer);
      this.emit("dirty");
      this.timer = setTimeout(() => this.flush(), this.delay);
    }

    flush() {
      clearTimeout(this.timer);
      if (!this.pending) return Promise.resolve(null);
      const value = this.pending;
      this.pending = null;
      this.emit("saving");
      return Promise.resolve().then(() => this.save(value)).then((result) => {
        this.emit("saved", result);
        return result;
      }).catch((error) => {
        this.pending = value;
        this.emit(error && error.code === "REVISION_CONFLICT" ? "conflict" : "error", error);
        throw error;
      });
    }

    destroy() { clearTimeout(this.timer); this.timer = null; }
  }

  const STYLE_FIELDS = {
    display: { css: "display", type: "enum", options: ["block", "flex", "grid", "inline-flex", "none"] },
    flexDirection: { css: "flex-direction", type: "enum", options: ["row", "column", "row-reverse", "column-reverse"] },
    flexWrap: { css: "flex-wrap", type: "enum", options: ["nowrap", "wrap"] },
    justifyContent: { css: "justify-content", type: "enum", options: ["flex-start", "center", "flex-end", "space-between", "space-around"] },
    alignItems: { css: "align-items", type: "enum", options: ["stretch", "flex-start", "center", "flex-end", "baseline"] },
    textAlign: { css: "text-align", type: "enum", options: ["left", "center", "right", "justify"] },
    gridColumns: { css: "grid-template-columns", type: "columns" },
    gap: { css: "gap", type: "length" },
    rowGap: { css: "row-gap", type: "length" },
    columnGap: { css: "column-gap", type: "length" },
    width: { css: "width", type: "length" },
    minWidth: { css: "min-width", type: "length" },
    maxWidth: { css: "max-width", type: "length" },
    height: { css: "height", type: "length" },
    minHeight: { css: "min-height", type: "length" },
    maxHeight: { css: "max-height", type: "length" },
    marginTop: { css: "margin-top", type: "length" },
    marginRight: { css: "margin-right", type: "length" },
    marginBottom: { css: "margin-bottom", type: "length" },
    marginLeft: { css: "margin-left", type: "length" },
    paddingTop: { css: "padding-top", type: "length" },
    paddingRight: { css: "padding-right", type: "length" },
    paddingBottom: { css: "padding-bottom", type: "length" },
    paddingLeft: { css: "padding-left", type: "length" },
    fontFamily: { css: "font-family", type: "font" },
    fontSize: { css: "font-size", type: "length" },
    fontWeight: { css: "font-weight", type: "weight" },
    lineHeight: { css: "line-height", type: "number-or-length" },
    letterSpacing: { css: "letter-spacing", type: "length" },
    textTransform: { css: "text-transform", type: "enum", options: ["none", "uppercase", "lowercase", "capitalize"] },
    color: { css: "color", type: "color" },
    backgroundColor: { css: "background-color", type: "color" },
    backgroundImage: { css: "background-image", type: "image" },
    backgroundPosition: { css: "background-position", type: "position" },
    backgroundSize: { css: "background-size", type: "enum", options: ["cover", "contain", "auto"] },
    backgroundRepeat: { css: "background-repeat", type: "enum", options: ["no-repeat", "repeat", "repeat-x", "repeat-y"] },
    borderWidth: { css: "border-width", type: "length" },
    borderStyle: { css: "border-style", type: "enum", options: ["none", "solid", "dashed", "dotted"] },
    borderColor: { css: "border-color", type: "color" },
    borderRadius: { css: "border-radius", type: "length" },
    opacity: { css: "opacity", type: "opacity" },
    overflow: { css: "overflow", type: "enum", options: ["visible", "hidden", "auto", "scroll", "clip"] },
    position: { css: "position", type: "enum", options: ["static", "relative", "absolute", "sticky"] },
    top: { css: "top", type: "length" },
    right: { css: "right", type: "length" },
    bottom: { css: "bottom", type: "length" },
    left: { css: "left", type: "length" },
    zIndex: { css: "z-index", type: "integer" },
    transitionDuration: { css: "transition-duration", type: "duration" },
    transitionProperty: { css: "transition-property", type: "enum", options: ["all", "color", "background-color", "transform", "opacity", "box-shadow"] },
    transform: { css: "transform", type: "transform" },
    objectFit: { css: "object-fit", type: "enum", options: ["cover", "contain", "fill", "none", "scale-down"] },
    objectPosition: { css: "object-position", type: "position" },
  };

  const TOKEN_MAP = {
    "token.color.primary": "var(--vb-primary)",
    "token.color.secondary": "var(--vb-secondary)",
    "token.color.background": "var(--vb-background)",
    "token.color.surface": "var(--vb-surface)",
    "token.color.text": "var(--vb-text)",
    "token.color.muted": "var(--vb-muted)",
    "token.color.success": "var(--vb-success)",
    "token.color.danger": "var(--vb-danger)",
    "token.font.heading": "var(--vb-font-heading)",
    "token.font.body": "var(--vb-font-body)",
    "token.radius.sm": "var(--vb-radius-sm)",
    "token.radius.md": "var(--vb-radius-md)",
    "token.radius.lg": "var(--vb-radius-lg)",
    "token.space.xs": "var(--vb-space-xs)",
    "token.space.sm": "var(--vb-space-sm)",
    "token.space.md": "var(--vb-space-md)",
    "token.space.lg": "var(--vb-space-lg)",
    "token.space.xl": "var(--vb-space-xl)",
  };

  const ROLE_PERMISSIONS = {
    administrator: ["document.read", "document.edit", "document.publish", "media.manage", "theme.manage", "page.manage"],
    editor: ["document.read", "document.edit", "media.manage", "theme.manage", "page.manage"],
    viewer: ["document.read"],
  };

  function can(role, action) {
    return (ROLE_PERMISSIONS[role] || []).includes(action);
  }

  function cssValue(field, value) {
    if (value == null || value === "") return "";
    if (TOKEN_MAP[value]) return TOKEN_MAP[value];
    const input = String(value).trim();
    if (field.type === "enum") return field.options.includes(input) ? input : "";
    if (field.type === "length") {
      const scalar = /^(?:-?\d+(?:\.\d+)?(?:px|%|rem|em|vh|vw|ch)|0|auto|fit-content|max-content|min-content)$/;
      const safeCalc = /^calc\(100%\s*[+-]\s*\d+(?:\.\d+)?(?:px|rem|em)\)$/;
      return scalar.test(input) || safeCalc.test(input) ? input : "";
    }
    if (field.type === "number-or-length") return /^(?:\d+(?:\.\d+)?|-?\d+(?:\.\d+)?(?:px|%|rem|em))$/.test(input) ? input : "";
    if (field.type === "columns") return /^repeat\([1-9]\d?,\s*minmax\(0,\s*1fr\)\)$/.test(input) || /^(?:\d+(?:\.\d+)?fr\s*){1,12}$/.test(input) ? input : "";
    if (field.type === "color") return /^(?:#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\)|transparent|currentColor|var\(--[a-z0-9-]+\))$/i.test(input) ? input : "";
    if (field.type === "image") { const url = safeMediaUrl(input, ""); return url ? 'url("' + url.replace(/["\n\r\\]/g, "") + '")' : ""; }
    if (field.type === "position") return /^(?:left|center|right|top|bottom|\d{1,3}%)(?:\s+(?:left|center|right|top|bottom|\d{1,3}%))?$/.test(input) ? input : "";
    if (field.type === "font") return /^[-a-zA-Z0-9 ,"']{1,120}$/.test(input) ? input : "";
    if (field.type === "weight") return /^(?:[1-9]00|normal|bold)$/.test(input) ? input : "";
    if (field.type === "opacity") { const number = Number(value); return Number.isFinite(number) ? String(Math.min(1, Math.max(0, number))) : ""; }
    if (field.type === "integer") { const number = Number(value); return Number.isInteger(number) && number >= -10 && number <= 1000 ? String(number) : ""; }
    if (field.type === "duration") return /^(?:\d+(?:\.\d+)?(?:ms|s))$/.test(input) ? input : "";
    if (field.type === "transform") return /^(?:none|(?:translate[XY]?\(-?\d+(?:\.\d+)?(?:px|%|rem)\)|scale\(\d+(?:\.\d+)?\)|rotate\(-?\d+(?:\.\d+)?deg\))(?:\s+(?:translate[XY]?\(-?\d+(?:\.\d+)?(?:px|%|rem)\)|scale\(\d+(?:\.\d+)?\)|rotate\(-?\d+(?:\.\d+)?deg\)))*)$/.test(input) ? input : "";
    return "";
  }

  function declarations(values) {
    const source = values || {};
    const output = [];
    Object.keys(source).forEach(function (key) {
      const field = STYLE_FIELDS[key];
      if (!field) return;
      const value = cssValue(field, source[key]);
      if (value) output.push(field.css + ":" + value);
    });
    if (source.gradientStart && source.gradientEnd) {
      const start = cssValue({ type: "color" }, source.gradientStart);
      const end = cssValue({ type: "color" }, source.gradientEnd);
      const angle = Math.min(360, Math.max(0, Number(source.gradientAngle || 135)));
      if (start && end) output.push("background-image:linear-gradient(" + angle + "deg," + start + "," + end + ")");
    }
    if (source.shadowColor) {
      const color = cssValue({ type: "color" }, source.shadowColor);
      const x = cssValue({ type: "length" }, source.shadowX || "0px");
      const y = cssValue({ type: "length" }, source.shadowY || "8px");
      const blur = cssValue({ type: "length" }, source.shadowBlur || "24px");
      const spread = cssValue({ type: "length" }, source.shadowSpread || "0px");
      if (color && x && y && blur && spread) output.push("box-shadow:" + [x, y, blur, spread, color].join(" "));
    }
    return output.join(";");
  }

  function selectorFor(nodeId, state) {
    const safe = String(nodeId).replace(/[^a-zA-Z0-9_-]/g, "");
    const base = '.vb-document [data-vb-node="' + safe + '"]';
    if (state === "hover") return base + ":hover";
    if (state === "focus") return base + ":focus-visible";
    if (state === "active") return base + ":active";
    if (state === "disabled") return base + ":disabled," + base + '[aria-disabled="true"]';
    return base;
  }

  function themeVariables(document, mode) {
    const tokens = document.theme && (mode === "dark" ? document.theme.darkTokens : document.theme.tokens) || {};
    const lightDefaults = {
      primary: "#0874e7", secondary: "#29d884", background: "#f4f7fb", surface: "#ffffff", text: "#0a1628", muted: "#64748b", success: "#16805b", danger: "#d23f48",
      fontHeading: "Inter, Arial, sans-serif", fontBody: "Inter, Arial, sans-serif", radiusSm: "8px", radiusMd: "14px", radiusLg: "24px", spaceXs: "8px", spaceSm: "16px", spaceMd: "28px", spaceLg: "52px", spaceXl: "88px",
    };
    const darkDefaults = { ...lightDefaults, primary: "#4da3ff", secondary: "#35e59a", background: "#07111e", surface: "#101d2b", text: "#f4f8fc", muted: "#afc0d1" };
    const value = { ...(mode === "dark" ? darkDefaults : lightDefaults), ...tokens };
    return [
      "--vb-primary:" + cssValue({ type: "color" }, value.primary), "--vb-secondary:" + cssValue({ type: "color" }, value.secondary),
      "--vb-background:" + cssValue({ type: "color" }, value.background), "--vb-surface:" + cssValue({ type: "color" }, value.surface),
      "--vb-text:" + cssValue({ type: "color" }, value.text), "--vb-muted:" + cssValue({ type: "color" }, value.muted),
      "--vb-success:" + cssValue({ type: "color" }, value.success), "--vb-danger:" + cssValue({ type: "color" }, value.danger),
      "--vb-font-heading:" + cssValue({ type: "font" }, value.fontHeading), "--vb-font-body:" + cssValue({ type: "font" }, value.fontBody),
      "--vb-radius-sm:" + cssValue({ type: "length" }, value.radiusSm), "--vb-radius-md:" + cssValue({ type: "length" }, value.radiusMd), "--vb-radius-lg:" + cssValue({ type: "length" }, value.radiusLg),
      "--vb-space-xs:" + cssValue({ type: "length" }, value.spaceXs), "--vb-space-sm:" + cssValue({ type: "length" }, value.spaceSm), "--vb-space-md:" + cssValue({ type: "length" }, value.spaceMd),
      "--vb-space-lg:" + cssValue({ type: "length" }, value.spaceLg), "--vb-space-xl:" + cssValue({ type: "length" }, value.spaceXl),
    ].filter(function (entry) { return !entry.endsWith(":"); }).join(";");
  }

  function compileStyles(document) {
    const buckets = { base: [], md: [], sm: [] };
    Object.values(document.nodes || {}).forEach(function (node) {
      ["base", "md", "sm"].forEach(function (breakpoint) {
        ["normal", "hover", "focus", "active", "disabled"].forEach(function (state) {
          const body = declarations(node.styles && node.styles[breakpoint] && node.styles[breakpoint][state]);
          if (body) buckets[breakpoint].push(selectorFor(node.id, state) + "{" + body + "}");
        });
        if (node.visibility && node.visibility[breakpoint] === false) buckets[breakpoint].push(selectorFor(node.id, "normal") + "{display:none!important}");
      });
    });
    return ".vb-document{" + themeVariables(document, "light") + "}.vb-document.is-dark{" + themeVariables(document, "dark") + "}" + buckets.base.join("") + (buckets.md.length ? "@media(max-width:1024px){" + buckets.md.join("") + "}" : "") + (buckets.sm.length ? "@media(max-width:767px){" + buckets.sm.join("") + "}" : "");
  }

  window.FLThemeBuilder = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    REGISTRY_VERSION: REGISTRY_VERSION,
    MAX_NODES: MAX_NODES,
    MAX_DEPTH: MAX_DEPTH,
    registry: registry,
    ComponentRegistry: ComponentRegistry,
    CommandHistory: CommandHistory,
    Autosave: Autosave,
    STYLE_FIELDS: STYLE_FIELDS,
    TOKEN_MAP: TOKEN_MAP,
    ROLE_PERMISSIONS: ROLE_PERMISSIONS,
    can: can,
    clone: clone,
    uid: uid,
    slug: slug,
    getAt: getAt,
    setAt: setAt,
    escapeHtml: escapeHtml,
    plainText: plainText,
    safeUrl: safeUrl,
    safeMediaUrl: safeMediaUrl,
    emptyStyles: emptyStyles,
    normalizeStyles: normalizeStyles,
    setDocumentFactory: setDocumentFactory,
    setPageDocumentFactory: setPageDocumentFactory,
    createNode: createNode,
    createDocument: createDocument,
    createWorkspace: createWorkspace,
    parentOf: parentOf,
    childIds: childIds,
    subtreeIds: subtreeIds,
    extractSubtree: extractSubtree,
    remapSubtree: remapSubtree,
    canInsert: canInsert,
    validateDocument: validateDocument,
    validateWorkspace: validateWorkspace,
    applyCommand: applyCommand,
    storage: storage,
    compileStyles: compileStyles,
    cssValue: cssValue,
  };
})();

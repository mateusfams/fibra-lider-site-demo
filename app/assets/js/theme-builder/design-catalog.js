(function () {
  "use strict";

  const TB = window.FLThemeBuilder;
  if (!TB) throw new Error("Theme Builder Core precisa ser carregado antes do catalogo visual.");

  const fonts = [
    { id: "inter", name: "Inter", category: "Sans moderna", value: '"Inter", "Segoe UI", Arial, sans-serif', sample: "Clara e versatil" },
    { id: "manrope", name: "Manrope", category: "Sans geometrica", value: '"Manrope", "Segoe UI", Arial, sans-serif', sample: "Precisa e contemporanea" },
    { id: "sora", name: "Sora", category: "Display digital", value: '"Sora", "Segoe UI", Arial, sans-serif', sample: "Tecnologica e marcante" },
    { id: "lora", name: "Lora", category: "Serif editorial", value: '"Lora", Georgia, serif', sample: "Humana e sofisticada" },
    { id: "system", name: "Sistema", category: "Nativa e rapida", value: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif', sample: "Familiar em qualquer tela" },
    { id: "mono", name: "Cascadia Mono", category: "Monoespacada", value: '"Cascadia Code", "SFMono-Regular", Consolas, monospace', sample: "Tecnica e objetiva" },
  ];

  const iconGroups = [
    { id: "connectivity", label: "Conectividade", icons: ["wifi", "router", "radio-tower", "cable", "network", "globe-2", "gauge", "signal", "satellite", "antenna", "cloud", "zap"] },
    { id: "commerce", label: "Comercial", icons: ["badge-percent", "badge-dollar-sign", "shopping-cart", "credit-card", "wallet-cards", "ticket-percent", "gift", "tag", "receipt-text", "package", "store", "circle-dollar-sign"] },
    { id: "communication", label: "Comunicacao", icons: ["message-circle", "messages-square", "phone", "mail", "send", "headset", "bell", "megaphone", "contact", "user-round", "users", "video"] },
    { id: "navigation", label: "Navegacao", icons: ["arrow-right", "arrow-up-right", "chevron-right", "external-link", "link", "house", "map-pin", "navigation", "search", "menu", "panels-top-left", "layout-grid"] },
    { id: "trust", label: "Confianca", icons: ["shield-check", "badge-check", "circle-check", "lock-keyhole", "key-round", "star", "heart", "award", "thumbs-up", "sparkles", "circle-help", "life-buoy"] },
    { id: "media", label: "Midia e dispositivos", icons: ["image", "images", "play", "pause", "volume-2", "camera", "monitor-play", "gallery-horizontal", "app-window", "smartphone", "laptop", "tv"] },
  ];
  const icons = iconGroups.reduce(function (all, group) { return all.concat(group.icons); }, []);

  TB.designCatalog = Object.freeze({
    fonts: Object.freeze(fonts.map(Object.freeze)),
    iconGroups: Object.freeze(iconGroups.map(function (group) { return Object.freeze({ ...group, icons: Object.freeze(group.icons.slice()) }); })),
    icons: Object.freeze(icons),
    hasIcon: function (name) { return icons.includes(String(name || "").toLowerCase()); },
    font: function (value) { return fonts.find(function (font) { return font.id === value || font.value === value; }) || null; },
  });
})();

(function () {
  "use strict";

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .toLowerCase();
  }

  function slug(value) {
    return normalize(value).replace(/\s+/g, "-") || "area";
  }

  function isGenericName(value) {
    const name = normalize(value);
    return !name || /^area \d+$/.test(name) || name === "poligono sem titulo" || name === "untitled polygon";
  }

  function featurePoints(feature) {
    if (!feature) return [];
    if (feature.type === "point") return Array.isArray(feature.coordinates) ? [feature.coordinates] : [];
    return Array.isArray(feature.coordinates) ? feature.coordinates : [];
  }

  function centroid(features) {
    const points = features.reduce(function (all, feature) { return all.concat(featurePoints(feature)); }, []);
    if (!points.length) return { lat: null, lng: null };
    const total = points.reduce(function (sum, point) {
      sum.lat += Number(point[0]) || 0;
      sum.lng += Number(point[1]) || 0;
      return sum;
    }, { lat: 0, lng: 0 });
    return { lat: total.lat / points.length, lng: total.lng / points.length };
  }

  function importedAreas(files) {
    const result = [];
    (files || []).filter(function (file) { return file && file.active !== false; }).forEach(function (file) {
      const groups = new Map();
      let unnamed = 0;
      (file.features || []).forEach(function (feature, index) {
        if (!feature || !["polygon", "line", "point"].includes(feature.type)) return;
        const generic = isGenericName(feature.name);
        if (generic) unnamed += 1;
        const label = generic ? "Setor " + String(unnamed).padStart(2, "0") : String(feature.name).trim();
        const key = generic ? "feature-" + index : "name-" + normalize(label);
        if (!groups.has(key)) groups.set(key, { name: label, features: [], featureIndexes: [] });
        groups.get(key).features.push(feature);
        groups.get(key).featureIndexes.push(index);
      });
      groups.forEach(function (group, key) {
        const center = centroid(group.features);
        result.push({
          id: "kmz-" + slug(file.id || file.fileName) + "-" + slug(key),
          name: group.name,
          city: group.name,
          type: "kmz",
          status: "Cobertura importada",
          source: "kmz",
          sourceName: file.name || file.fileName || "Arquivo de cobertura",
          fileId: file.id,
          featureCount: group.features.length,
          featureIndexes: group.featureIndexes,
          lat: center.lat,
          lng: center.lng,
          color: file.color || "",
          interest: 0,
          leads: 0,
          active: true,
        });
      });
    });
    return result;
  }

  function manualAreas(state) {
    return (state && state.regions || []).filter(function (area) { return area && area.active !== false; }).map(function (area) {
      return { source: "manual", ...area };
    });
  }

  function effectiveAreas(state) {
    const manual = manualAreas(state);
    const imported = importedAreas(state && state.coverageFiles);
    const mode = state && state.coverageSettings && state.coverageSettings.areaSourceMode || "auto";
    if (mode === "manual") return manual;
    if (mode === "imported") return imported;
    if (mode === "hybrid") return manual.concat(imported);
    return manual.length ? manual : imported;
  }

  function inventory(state) {
    const manual = manualAreas(state);
    const imported = importedAreas(state && state.coverageFiles);
    const activeFiles = (state && state.coverageFiles || []).filter(function (file) { return file.active !== false; });
    return {
      manual: manual,
      imported: imported,
      effective: effectiveAreas(state),
      files: activeFiles,
      geometries: activeFiles.reduce(function (sum, file) { return sum + (file.features || []).length; }, 0),
      coordinates: activeFiles.reduce(function (sum, file) { return sum + Number(file.coordinateCount || 0); }, 0),
    };
  }

  window.FLCoverage = { normalize, slug, centroid, importedAreas, manualAreas, effectiveAreas, inventory };
})();

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

  function isTechnicalName(value) {
    const name = normalize(value);
    return !name || /^area \d+$/.test(name) || /^setor \d+$/.test(name) || /^olt\s*\d+/i.test(name) || name === "poligono sem titulo" || name === "untitled polygon";
  }

  function featurePoints(feature) {
    if (!feature) return [];
    if (feature.type === "point") return Array.isArray(feature.coordinates) ? [feature.coordinates] : [];
    return Array.isArray(feature.coordinates) ? feature.coordinates : [];
  }

  function centroid(features) {
    const points = (features || []).reduce(function (all, feature) { return all.concat(featurePoints(feature)); }, []);
    if (!points.length) return { lat: null, lng: null };
    const total = points.reduce(function (sum, point) {
      sum.lat += Number(point[0]) || 0;
      sum.lng += Number(point[1]) || 0;
      return sum;
    }, { lat: 0, lng: 0 });
    return { lat: total.lat / points.length, lng: total.lng / points.length };
  }

  function distanceKm(a, b) {
    if (!a || !b || !Number.isFinite(Number(a.lat)) || !Number.isFinite(Number(a.lng)) || !Number.isFinite(Number(b.lat)) || !Number.isFinite(Number(b.lng))) return Infinity;
    const radians = function (value) { return Number(value) * Math.PI / 180; };
    const deltaLat = radians(Number(b.lat) - Number(a.lat));
    const deltaLng = radians(Number(b.lng) - Number(a.lng));
    const lat1 = radians(a.lat); const lat2 = radians(b.lat);
    const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }

  function nearestRegion(point, regions) {
    return (regions || []).filter(function (region) { return Number.isFinite(Number(region.lat)) && Number.isFinite(Number(region.lng)); }).map(function (region) {
      return { region: region, distance: distanceKm(point, { lat: region.lat, lng: region.lng }) };
    }).sort(function (a, b) { return a.distance - b.distance; })[0] || null;
  }

  function publicFeatureName(feature, index) {
    if (feature && feature.publicName) return String(feature.publicName).trim();
    if (feature && feature.geography) {
      const geography = feature.geography;
      const locality = geography.neighborhood || geography.district || geography.road;
      if (locality && geography.city) return locality + ", " + geography.city;
      if (locality || geography.city) return locality || geography.city;
    }
    if (feature && !isTechnicalName(feature.name)) return String(feature.name).trim();
    return "Area atendida " + String(index + 1).padStart(2, "0");
  }

  function prepareFeatures(features, regions) {
    return (features || []).map(function (source, index) {
      const feature = { ...source };
      feature.featureIndex = Number(feature.featureIndex || index + 1);
      if (isTechnicalName(feature.name)) feature.technicalName = feature.technicalName || feature.name;
      if (!feature.publicName && !isTechnicalName(feature.name)) feature.publicName = String(feature.name).trim();
      if (!feature.publicName) {
        const near = nearestRegion(centroid([feature]), regions);
        feature.publicName = near && near.distance < 35 ? "Regiao de " + near.region.name : "Area atendida " + String(feature.featureIndex).padStart(2, "0");
        feature.geography = { ...(feature.geography || {}), city: near && near.distance < 35 ? near.region.name : "" };
      }
      return feature;
    });
  }

  function importedAreas(files) {
    const result = [];
    (files || []).filter(function (file) { return file && file.active !== false; }).forEach(function (file) {
      const groups = new Map();
      (file.features || []).forEach(function (feature, index) {
        if (!feature || !["polygon", "line", "point"].includes(feature.type)) return;
        const label = publicFeatureName(feature, index);
        const key = "public-" + normalize(label);
        if (!groups.has(key)) groups.set(key, { name: label, features: [], featureIndexes: [], geography: feature.geography || {}, technicalNames: [] });
        const group = groups.get(key);
        group.features.push(feature);
        group.featureIndexes.push(index);
        if (feature.technicalName && !group.technicalNames.includes(feature.technicalName)) group.technicalNames.push(feature.technicalName);
      });
      groups.forEach(function (group, key) {
        const center = centroid(group.features);
        result.push({ id: "kmz-" + slug(file.id || file.fileName) + "-" + slug(key), name: group.name, city: group.geography.city || group.name, neighborhood: group.geography.neighborhood || group.geography.district || "", road: group.geography.road || "", postcode: group.geography.postcode || "", type: "kmz", status: "Cobertura confirmada", source: "kmz", sourceName: file.name || file.fileName || "Arquivo de cobertura", fileId: file.id, featureCount: group.features.length, featureIndexes: group.featureIndexes, technicalNames: group.technicalNames, lat: center.lat, lng: center.lng, color: file.color || "", interest: 0, leads: 0, active: true });
      });
    });
    return result;
  }

  function manualAreas(state) {
    return (state && state.regions || []).filter(function (area) { return area && area.active !== false; }).map(function (area) { return { source: "manual", ...area }; });
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
    return { manual: manual, imported: imported, effective: effectiveAreas(state), files: activeFiles, geometries: activeFiles.reduce(function (sum, file) { return sum + (file.features || []).length; }, 0), coordinates: activeFiles.reduce(function (sum, file) { return sum + Number(file.coordinateCount || 0); }, 0) };
  }

  function nominatimLocation(payload) {
    const address = payload && payload.address || {};
    return { neighborhood: address.neighbourhood || address.suburb || address.quarter || address.residential || "", district: address.city_district || "", road: address.road || address.pedestrian || address.footway || "", city: address.city || address.town || address.municipality || address.village || "", state: address.state || "", postcode: address.postcode || "", provider: "nominatim" };
  }

  function googleLocation(payload) {
    const result = payload && payload.results && payload.results[0];
    const components = result && result.address_components || [];
    const part = function (types) { const found = components.find(function (component) { return types.some(function (type) { return component.types.includes(type); }); }); return found ? found.long_name : ""; };
    return { neighborhood: part(["sublocality_level_1", "sublocality", "neighborhood"]), district: part(["sublocality_level_2", "administrative_area_level_3"]), road: part(["route"]), city: part(["administrative_area_level_2", "locality"]), state: part(["administrative_area_level_1"]), postcode: part(["postal_code"]), provider: "google" };
  }

  async function reverseGeocode(point, settings) {
    const config = settings || {};
    if (config.googleMapsEnabled && config.geocodingProvider === "google" && config.googleMapsBrowserKey) {
      const endpoint = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + encodeURIComponent(point.lat + "," + point.lng) + "&language=pt-BR&key=" + encodeURIComponent(config.googleMapsBrowserKey);
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Falha na geocodificacao Google.");
      return googleLocation(await response.json());
    }
    const endpoint = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=" + encodeURIComponent(point.lat) + "&lon=" + encodeURIComponent(point.lng);
    const response = await fetch(endpoint, { headers: { "Accept-Language": "pt-BR,pt;q=0.9" } });
    if (!response.ok) throw new Error("Falha na identificacao do OpenStreetMap.");
    return nominatimLocation(await response.json());
  }

  function locationName(location, fallback) {
    const area = location && (location.neighborhood || location.district || location.road);
    if (area && location.city) return area + ", " + location.city;
    return area || location && location.city || fallback;
  }

  async function enrichFile(file, state, onProgress) {
    const source = file || {};
    const features = prepareFeatures(source.features, state && state.regions);
    const cache = new Map();
    const google = state && state.coverageSettings && state.coverageSettings.googleMapsEnabled && state.coverageSettings.geocodingProvider === "google" && state.coverageSettings.googleMapsBrowserKey;
    let requests = 0;
    for (let index = 0; index < features.length; index += 1) {
      const feature = features[index];
      const point = centroid([feature]);
      if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) continue;
      const bucket = point.lat.toFixed(2) + ":" + point.lng.toFixed(2);
      let location = cache.get(bucket);
      if (!location && requests < 40) {
        try { location = await reverseGeocode(point, state && state.coverageSettings); cache.set(bucket, location); requests += 1; }
        catch (error) { location = null; }
        if (!google) await new Promise(function (resolve) { window.setTimeout(resolve, 1050); });
      }
      if (location) { feature.geography = location; feature.publicName = locationName(location, feature.publicName); }
      if (onProgress) onProgress({ current: index + 1, total: features.length, requests: requests, feature: feature });
    }
    return { ...source, features: features, geocodingStatus: "complete", geocodedAt: new Date().toISOString(), geocodingRequests: requests };
  }

  window.FLCoverage = { normalize, slug, isTechnicalName, centroid, distanceKm, publicFeatureName, prepareFeatures, importedAreas, manualAreas, effectiveAreas, inventory, reverseGeocode, enrichFile };
})();

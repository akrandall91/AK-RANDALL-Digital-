(function () {
  'use strict';

  const root = document.querySelector('[data-coverage-map]');
  const coverage = window.AKRD_COVERAGE;
  if (!root || !coverage) return;

  const fieldProjects = Array.isArray(coverage.fieldProjects) ? coverage.fieldProjects : [];
  const pursuitRegions = Array.isArray(coverage.pursuitRegions) ? coverage.pursuitRegions : [];
  const dossiers = Array.isArray(coverage.dossiers) ? coverage.dossiers : [];
  const confirmedDossiers = dossiers.filter((item) => item.confirmed);
  const meta = coverage.meta || {};
  const pursuitSummary = coverage.pursuitSummary || {};

  const yearInput = root.querySelector('[data-map-year]');
  const yearOutput = root.querySelector('[data-map-year-output]');
  const yearLabel = root.querySelector('[data-map-year-label]');
  const yearTicks = root.querySelector('[data-map-year-ticks]');
  const playButton = root.querySelector('[data-map-play]');
  const layerButtons = Array.from(root.querySelectorAll('[data-map-layer]'));
  const filterButtons = Array.from(root.querySelectorAll('[data-map-filter]'));
  const categoryControl = root.querySelector('[data-map-category-control]');
  const list = root.querySelector('[data-map-list]');
  const listTitle = root.querySelector('[data-map-list-title]');
  const status = root.querySelector('[data-map-status]');
  const mapKicker = root.querySelector('[data-map-kicker-stage]');
  const metricNodes = Array.from(root.querySelectorAll('[data-map-metric]')).map((node) => ({
    value: node,
    label: node.parentElement && node.parentElement.querySelector('span')
  }));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const categoryColors = {
    'Transit': '#2457FF',
    'Parks & Trails': '#B7E33F',
    'Smart Infrastructure': '#00B8D4',
    'Public Safety': '#FFB84D',
    'Emergency / Resilience': '#FF6B2C'
  };
  const layerColors = {
    pursuits: '#00B8D4',
    wins: '#B7E33F',
    verified: '#FF6B2C'
  };
  const layerConfig = {
    pursuits: { minYear: 2024, maxYear: 2026, title: 'Opportunity coverage', kicker: 'Public-sector opportunities' },
    wins: { minYear: null, maxYear: null, title: 'Confirmed customer projects', kicker: 'Accepted or fulfilled work' },
    verified: { minYear: 2025, maxYear: 2026, title: 'Confirmed contract proof', kicker: 'Awards, agreements, and orders' },
    field: { minYear: 2021, maxYear: 2026, title: 'Field projects', kicker: 'Infrastructure in operation' }
  };

  let selectedLayer = 'pursuits';
  let selectedYear = 2026;
  let selectedCategory = 'All';
  let map;
  let mapReady = false;
  let playTimer;
  let loadTimer;

  function formatCount(value) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  function sumThrough(values, year) {
    const end = Math.max(0, Math.min(2, year - 2024));
    return values.slice(0, end + 1).reduce((total, value) => total + Number(value || 0), 0);
  }

  function total(values) {
    return values.reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function getState(project) {
    if (project.location === 'California') return 'CA';
    if (project.location === 'Florida') return 'FL';
    return project.location.split(', ').pop();
  }

  function normalizePursuitRegions(mode) {
    return pursuitRegions.map((region) => {
      const value = mode === 'wins' ? total(region.wins) : sumThrough(region.pursuits, selectedYear);
      const outcomes = mode === 'wins' ? value : sumThrough(region.wins, selectedYear);
      return {
        id: `${mode}-${region.region}`,
        lat: region.lat,
        lng: region.lng,
        location: region.label,
        region: region.region,
        category: mode === 'wins' ? 'Confirmed customer projects' : 'Public-sector opportunities',
        title: mode === 'wins' ? 'Confirmed customer projects' : 'Opportunity coverage',
        detail: mode === 'wins'
          ? `${formatCount(value)} confirmed customer projects in this market.`
          : `${formatCount(value)} opportunities evaluated through ${selectedYear}; ${formatCount(outcomes)} became confirmed customer projects.`,
        evidence: 'Regional totals',
        value,
        cities: region.cities,
        outcomes,
        layer: mode,
        color: layerColors[mode]
      };
    }).filter((item) => item.value > 0);
  }

  function visibleItems() {
    if (selectedLayer === 'pursuits' || selectedLayer === 'wins') return normalizePursuitRegions(selectedLayer);
    if (selectedLayer === 'verified') {
      return confirmedDossiers.filter((item) => item.year <= selectedYear && (selectedCategory === 'All' || item.category === selectedCategory)).map((item) => ({
        ...item,
        layer: 'verified',
        value: item.level,
        color: layerColors.verified
      }));
    }
    return fieldProjects.filter((item) => item.year <= selectedYear && (selectedCategory === 'All' || item.category === selectedCategory)).map((item) => ({
      ...item,
      layer: 'field',
      title: item.category === 'Parks & Trails' ? 'Public-space infrastructure' : item.category,
      detail: [item.procurement ? 'Formal public buying path' : '', item.documented ? 'Field photography available' : 'Project location mapped'].filter(Boolean).join(' · '),
      evidence: item.documented ? 'Original project imagery' : 'Project archive',
      value: 1,
      color: categoryColors[item.category] || '#ffffff'
    }));
  }

  function markerHeight(item) {
    if (item.layer === 'pursuits') return 85000 + Math.sqrt(item.value) * 38000;
    if (item.layer === 'wins') return 145000 + Math.sqrt(item.value) * 62000;
    if (item.layer === 'verified') return 120000 + item.level * 62000;
    return 105000 + (item.documented ? 115000 : 0) + (item.procurement ? 70000 : 0);
  }

  function markerSize(item) {
    if (item.layer === 'pursuits') return 0.16 + Math.min(0.28, Math.sqrt(item.value) * 0.022);
    if (item.layer === 'wins') return 0.18 + Math.min(0.22, Math.sqrt(item.value) * 0.035);
    return item.layer === 'verified' ? 0.28 : 0.22;
  }

  function polygonAround(item) {
    const size = markerSize(item);
    return [[
      [item.lng - size, item.lat - size],
      [item.lng + size, item.lat - size],
      [item.lng + size, item.lat + size],
      [item.lng - size, item.lat + size],
      [item.lng - size, item.lat - size]
    ]];
  }

  function featureCollection(items, geometryType) {
    return {
      type: 'FeatureCollection',
      features: items.map((item) => ({
        type: 'Feature',
        geometry: geometryType === 'Point'
          ? { type: 'Point', coordinates: [item.lng, item.lat] }
          : { type: 'Polygon', coordinates: polygonAround(item) },
        properties: {
          layer: item.layer,
          year: item.year || '',
          location: item.location,
          region: item.region || '',
          category: item.category,
          title: item.title,
          detail: item.detail,
          evidence: item.evidence,
          path: item.path || '',
          value: item.value,
          cities: item.cities || 0,
          outcomes: item.outcomes || 0,
          color: item.color,
          height: markerHeight(item)
        }
      }))
    };
  }

  function setMetric(index, value, label) {
    const metric = metricNodes[index];
    if (!metric) return;
    metric.value.textContent = formatCount(value);
    if (metric.label) metric.label.textContent = label;
  }

  function updateMetrics(items) {
    if (selectedLayer === 'pursuits') {
      const summary = pursuitSummary[selectedYear] || pursuitSummary[2026];
      setMetric(0, summary.pursuits, 'Opportunities evaluated');
      setMetric(1, summary.regions, 'Markets reached');
      setMetric(2, summary.cities, 'Cities & regions');
      setMetric(3, summary.outcomes, 'Confirmed projects');
      status.textContent = `${summary.pursuits} public-sector opportunities across ${summary.regions} markets through ${selectedYear}.`;
      return;
    }
    if (selectedLayer === 'wins') {
      setMetric(0, meta.recordedWins, 'Confirmed projects');
      setMetric(1, meta.winRegions, 'Customer markets');
      setMetric(2, meta.winCityPairs, 'Cities & regions');
      setMetric(3, 5, 'Solution categories');
      status.textContent = `${meta.recordedWins} confirmed customer projects across ${meta.winRegions} markets.`;
      return;
    }
    if (selectedLayer === 'verified') {
      setMetric(0, items.length, 'Confirmed projects');
      setMetric(1, items.filter((item) => item.multiYear).length, 'Multi-year contracts');
      setMetric(2, items.filter((item) => item.po).length, 'Issued orders');
      setMetric(3, new Set(items.map((item) => item.path)).size, 'Buying paths');
      status.textContent = `${items.length} confirmed customer projects with contract proof shown through ${selectedYear}.`;
      return;
    }
    const jurisdictions = new Set(items.map(getState));
    setMetric(0, items.length, 'Field projects');
    setMetric(1, jurisdictions.size, 'Markets reached');
    setMetric(2, items.filter((item) => item.documented).length, 'Projects photographed');
    setMetric(3, new Set(items.map((item) => item.category)).size, 'Project types');
    status.textContent = `${items.length} field projects across ${jurisdictions.size} markets through ${selectedYear}.`;
  }

  function itemSummary(item) {
    if (item.layer === 'pursuits') return `${formatCount(item.value)} opportunities · ${formatCount(item.cities)} cities & regions · ${formatCount(item.outcomes)} confirmed projects`;
    if (item.layer === 'wins') return `${formatCount(item.value)} confirmed customer projects`;
    if (item.layer === 'verified') return `${item.path} · ${item.evidence}`;
    return `${item.category} · ${item.year}${item.procurement ? ' · Formal procurement' : ''}${item.documented ? ' · Field documented' : ''}`;
  }

  function updateList(items) {
    list.replaceChildren();
    if (listTitle) listTitle.textContent = `View ${layerConfig[selectedLayer].title.toLowerCase()}`;
    items.slice().sort((a, b) => (b.value || b.year) - (a.value || a.year) || a.location.localeCompare(b.location)).forEach((item) => {
      const entry = document.createElement('li');
      const marker = document.createElement('span');
      const copy = document.createElement('span');
      const location = document.createElement('strong');
      const detail = document.createElement('span');
      marker.className = 'coverage-list-marker';
      marker.style.setProperty('--marker-color', item.color);
      marker.setAttribute('aria-hidden', 'true');
      copy.className = 'coverage-list-copy';
      location.textContent = item.layer === 'verified' ? item.title : item.location;
      detail.textContent = itemSummary(item);
      copy.append(location, detail);
      entry.append(marker, copy);
      list.append(entry);
    });
  }

  function updateMap(items) {
    if (!mapReady) return;
    map.getSource('coverage-columns').setData(featureCollection(items, 'Polygon'));
    map.getSource('coverage-points').setData(featureCollection(items, 'Point'));
  }

  function updateExperience() {
    const items = visibleItems();
    updateMetrics(items);
    updateList(items);
    updateMap(items);
    yearOutput.textContent = selectedLayer === 'wins' ? 'All' : String(selectedYear);
    if (mapKicker) mapKicker.textContent = layerConfig[selectedLayer].kicker;
  }

  function stopPlayback() {
    if (playTimer) window.clearInterval(playTimer);
    playTimer = undefined;
    playButton.classList.remove('is-playing');
    playButton.setAttribute('aria-pressed', 'false');
    playButton.querySelector('span').textContent = selectedLayer === 'wins' ? 'All confirmed projects shown' : 'Play growth over time';
  }

  function configureControls() {
    stopPlayback();
    const config = layerConfig[selectedLayer];
    const hasTimeline = Number.isFinite(config.minYear) && Number.isFinite(config.maxYear);
    yearInput.disabled = !hasTimeline;
    playButton.disabled = !hasTimeline;
    root.classList.toggle('map-timeline-disabled', !hasTimeline);
    if (hasTimeline) {
      selectedYear = config.maxYear;
      yearInput.min = String(config.minYear);
      yearInput.max = String(config.maxYear);
      yearInput.value = String(config.maxYear);
      yearTicks.firstElementChild.textContent = String(config.minYear);
      yearTicks.lastElementChild.textContent = String(config.maxYear);
      yearOutput.textContent = String(config.maxYear);
      yearLabel.textContent = 'Show activity through';
    } else {
      selectedYear = 2026;
      yearOutput.textContent = 'All';
      yearLabel.textContent = 'All years';
    }
    const supportsCategories = selectedLayer === 'verified' || selectedLayer === 'field';
    categoryControl.hidden = !supportsCategories;
    if (!supportsCategories) selectedCategory = 'All';
    filterButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mapFilter === selectedCategory)));
  }

  function startPlayback() {
    const config = layerConfig[selectedLayer];
    if (!Number.isFinite(config.minYear) || !Number.isFinite(config.maxYear)) return;
    if (playTimer) {
      stopPlayback();
      return;
    }
    if (selectedYear >= config.maxYear) selectedYear = config.minYear;
    yearInput.value = String(selectedYear);
    playButton.classList.add('is-playing');
    playButton.setAttribute('aria-pressed', 'true');
    playButton.querySelector('span').textContent = 'Pause timeline';
    updateExperience();
    playTimer = window.setInterval(() => {
      if (selectedYear >= config.maxYear) {
        stopPlayback();
        return;
      }
      selectedYear += 1;
      yearInput.value = String(selectedYear);
      updateExperience();
    }, 1250);
  }

  function showPopup(event) {
    const feature = event.features && event.features[0];
    if (!feature) return;
    const properties = feature.properties;
    const popup = document.createElement('div');
    const label = document.createElement('span');
    const title = document.createElement('strong');
    const location = document.createElement('span');
    const detail = document.createElement('span');
    const evidence = document.createElement('span');
    popup.className = 'coverage-popup';
    label.className = 'micro';
    label.textContent = properties.path || properties.category;
    title.textContent = properties.title;
    location.textContent = properties.location;
    detail.textContent = properties.detail;
    evidence.textContent = properties.evidence;
    popup.append(label, title, location, detail, evidence);
    new window.maplibregl.Popup({ offset: 24, closeButton: true, maxWidth: '320px' })
      .setLngLat(event.lngLat)
      .setDOMContent(popup)
      .addTo(map);
  }

  function initializeMap() {
    if (map || !window.maplibregl || typeof window.maplibregl.Map !== 'function') {
      root.classList.add('map-unavailable');
      status.textContent = 'The interactive 3D view is unavailable. Use the project list beside the map to explore the same information.';
      return;
    }
    const isSmall = window.matchMedia('(max-width: 640px)').matches;
    try {
      map = new window.maplibregl.Map({
        container: 'coverage-map-canvas',
        center: [-98.5, 38.8],
        zoom: isSmall ? 2.05 : 2.72,
        pitch: isSmall ? 36 : 50,
        bearing: -12,
        attributionControl: false,
        antialias: true,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            { id: 'coverage-background', type: 'background', paint: { 'background-color': '#050b14' } },
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              paint: {
                'raster-saturation': -1,
                'raster-contrast': 0.28,
                'raster-brightness-min': 0.07,
                'raster-brightness-max': 0.68,
                'raster-opacity': 0.55
              }
            }
          ]
        }
      });
    } catch (error) {
      root.classList.add('map-unavailable');
      status.textContent = 'The interactive 3D view is unavailable. Use the project list beside the map to explore the same information.';
      return;
    }

    loadTimer = window.setTimeout(() => {
      if (mapReady) return;
      root.classList.add('map-unavailable');
      status.textContent = 'The map could not finish loading. Use the project list beside it to explore the same information.';
    }, 12000);

    map.addControl(new window.maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new window.maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    map.on('load', () => {
      window.clearTimeout(loadTimer);
      if (typeof map.setProjection === 'function') map.setProjection({ type: 'globe' });
      const items = visibleItems();
      map.addSource('coverage-columns', { type: 'geojson', data: featureCollection(items, 'Polygon') });
      map.addSource('coverage-points', { type: 'geojson', data: featureCollection(items, 'Point') });
      map.addLayer({
        id: 'coverage-column-glow',
        type: 'fill-extrusion',
        source: 'coverage-columns',
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['*', ['get', 'height'], 1.15],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.17,
          'fill-extrusion-vertical-gradient': true
        }
      });
      map.addLayer({
        id: 'coverage-columns',
        type: 'fill-extrusion',
        source: 'coverage-columns',
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.86,
          'fill-extrusion-vertical-gradient': true
        }
      });
      map.addLayer({
        id: 'coverage-point-glow',
        type: 'circle',
        source: 'coverage-points',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 11, 6, 22],
          'circle-color': ['get', 'color'],
          'circle-blur': 0.75,
          'circle-opacity': 0.32
        }
      });
      map.addLayer({
        id: 'coverage-points',
        type: 'circle',
        source: 'coverage-points',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 5, 6, 9],
          'circle-color': ['get', 'color'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.35,
          'circle-opacity': 0.98
        }
      });
      map.on('click', 'coverage-columns', showPopup);
      map.on('click', 'coverage-points', showPopup);
      ['coverage-columns', 'coverage-points'].forEach((layer) => {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
      });
      mapReady = true;
      root.classList.add('map-ready');
      updateMap(items);
      window.setTimeout(() => map.resize(), 120);
    });
    map.on('error', (event) => {
      if (event && event.error) root.classList.add('map-network-warning');
    });
  }

  yearInput.addEventListener('input', () => {
    stopPlayback();
    selectedYear = Number(yearInput.value);
    updateExperience();
  });
  playButton.addEventListener('click', startPlayback);
  layerButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedLayer = button.dataset.mapLayer;
      layerButtons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
      configureControls();
      updateExperience();
      if (mapReady && !reduceMotion) map.easeTo({ center: [-98.5, 38.8], zoom: window.matchMedia('(max-width: 640px)').matches ? 2.05 : 2.72, pitch: 50, bearing: selectedLayer === 'verified' ? -5 : -12, duration: 950 });
    });
  });
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedCategory = button.dataset.mapFilter;
      filterButtons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
      updateExperience();
    });
  });

  configureControls();
  updateExperience();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      initializeMap();
      observer.disconnect();
    }, { rootMargin: '320px' });
    observer.observe(root);
  } else {
    initializeMap();
  }
}());

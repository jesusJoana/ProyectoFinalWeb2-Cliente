import {
  createInstallation,
  deleteInstallation,
  fetchInstallationById,
  fetchInstallations,
  fetchInstallationWeather,
  fetchSports,
  updateInstallation
} from './api.js';

const DEFAULT_LIMIT = 10;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatText(value, fallback = 'Sin informar') {
  if (value === undefined || value === null || String(value).trim() === '') {
    return fallback;
  }

  return escapeHtml(value);
}

function formatDate(value) {
  if (!value) {
    return 'Sin informar';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatText(value);
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function formatNumber(value, suffix = '') {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 'Sin informar';
  }

  return `${new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 1
  }).format(number)}${suffix}`;
}

function renderSports(sports) {
  if (!Array.isArray(sports) || sports.length === 0) {
    return '<span class="muted">Sin deportes asociados</span>';
  }

  return sports
    .map((sport) => `<span class="tag">${formatText(sport?.name ?? sport)}</span>`)
    .join('');
}

function renderSelectedSports(sports) {
  if (!Array.isArray(sports) || sports.length === 0) {
    return '<p class="empty-state">No hay deportes asociados a esta instalación.</p>';
  }

  return `
    <div class="tags">
      ${sports.map((sport, index) => `
        <span class="tag">
          ${formatText(sport.name)}
          <button type="button" class="tag-action" data-remove-selected-sport="${index}">Quitar</button>
        </span>
      `).join('')}
    </div>
  `;
}

function renderCatalogSportOptions(sports) {
  if (!Array.isArray(sports) || sports.length === 0) {
    return '<option value="">Catálogo vacío: crea deportes en la sección Deportes</option>';
  }

  return `
    <option value="">Selecciona un deporte</option>
    ${sports.map((sport) => `
      <option value="${escapeHtml(sport.id)}">${formatText(sport.name)} (${formatText(sport.osmKey)})</option>
    `).join('')}
  `;
}

function renderCoordinates(location) {
  const coordinates = location?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return 'Sin informar';
  }

  return coordinates.map((coordinate) => Number(coordinate).toFixed(5)).join(', ');
}

function setStatus(statusNode, message, className) {
  statusNode.textContent = message;
  statusNode.classList.remove('is-success', 'is-error');

  if (className) {
    statusNode.classList.add(className);
  }
}

function getFormValues(formElement) {
  const FormDataConstructor = formElement.ownerDocument.defaultView.FormData;
  const formData = new FormDataConstructor(formElement);

  return {
    name: formData.get('name'),
    city: formData.get('city'),
    type: formData.get('type'),
    sport: formData.get('sport'),
    limit: Number.parseInt(formData.get('limit'), 10) || 10
  };
}

function getInstallationPayload(formElement, selectedSports) {
  const FormDataConstructor = formElement.ownerDocument.defaultView.FormData;
  const formData = new FormDataConstructor(formElement);
  const longitude = String(formData.get('longitude') ?? '').trim();
  const latitude = String(formData.get('latitude') ?? '').trim();
  const payload = {
    name: String(formData.get('name') ?? '').trim(),
    type: String(formData.get('type') ?? '').trim(),
    city: String(formData.get('city') ?? '').trim(),
    source: String(formData.get('source') ?? '').trim() || 'manual',
    sports: selectedSports.map((sport) => ({
      name: sport.name,
      ...(sport.sportId ? { sportId: sport.sportId } : {})
    }))
  };

  if (longitude !== '' && latitude !== '') {
    payload.location = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)]
    };
  }

  return payload;
}

export function renderInstallationsSection() {
  return `
    <section class="panel panel-wide" id="instalaciones">
      <div class="section-header">
        <div>
          <p class="eyebrow">Consulta</p>
          <h2>Instalaciones deportivas</h2>
        </div>
        <p class="section-summary">Filtra, pagina y abre el detalle de cada instalación.</p>
      </div>

      <form class="filters-form" id="installations-filters">
        <label>
          Nombre
          <input type="search" name="name" placeholder="Polideportivo" />
        </label>
        <label>
          Ciudad
          <input type="search" name="city" placeholder="Getafe" />
        </label>
        <label>
          Tipo
          <input type="search" name="type" placeholder="sports_centre" />
        </label>
        <label>
          Deporte
          <input type="search" name="sport" placeholder="football" />
        </label>
        <label>
          Resultados
          <select name="limit">
            <option value="5">5</option>
            <option value="10" selected>10</option>
            <option value="20">20</option>
          </select>
        </label>
        <div class="form-actions">
          <button type="submit">Buscar</button>
          <button type="button" class="secondary-button" id="installations-clear">Limpiar</button>
        </div>
      </form>

      <p class="status-text" id="installations-status">Cargando instalaciones...</p>
      <div id="installation-detail"></div>
      <div id="installations-results"></div>

      <div class="pagination" aria-label="Paginación de instalaciones">
        <button type="button" id="installations-prev">Anterior</button>
        <span id="installations-page">Página 1</span>
        <button type="button" id="installations-next">Siguiente</button>
      </div>
    </section>

    <section class="panel panel-wide">
      <h2>Crear/Actualizar instalación</h2>
      <form class="filters-form" id="installation-form">
        <input type="hidden" name="id" />
        <label>
          Nombre
          <input type="text" name="name" placeholder="Polideportivo Norte" />
        </label>
        <label>
          Tipo
          <input type="text" name="type" placeholder="sports_centre" />
        </label>
        <label>
          Ciudad
          <input type="text" name="city" placeholder="Getafe" />
        </label>
        <label>
          Fuente
          <input type="text" name="source" placeholder="manual" />
        </label>
        <label>
          Longitud
          <input type="number" step="any" name="longitude" placeholder="-3.70379" />
        </label>
        <label>
          Latitud
          <input type="number" step="any" name="latitude" placeholder="40.41678" />
        </label>
        <label>
          Deporte del catálogo
          <select name="catalogSportId">
            <option value="">Cargando deportes...</option>
          </select>
        </label>
        <label>
          Buscar en catálogo
          <input type="search" name="sportSearch" placeholder="tenis" />
        </label>
        <div class="form-actions">
          <button type="button" id="installation-sport-add-selected">Asociar seleccionado</button>
          <button type="button" class="secondary-button" id="installation-sport-search">Buscar deporte</button>
          <button type="submit">Guardar instalación</button>
          <button type="button" class="secondary-button" id="installation-form-reset">Limpiar</button>
        </div>
      </form>
      <p class="status-text" id="installation-form-status">Formulario listo para crear o editar una instalación.</p>
      <div id="installation-sport-results"></div>
      <div id="installation-selected-sports"></div>
    </section>
  `;
}

export function renderInstallationsList(installations) {
  if (!Array.isArray(installations) || installations.length === 0) {
    return '<p class="empty-state">No hay instalaciones que coincidan con la consulta.</p>';
  }

  return `
    <div class="results-list">
      ${installations.map((installation) => `
        <article class="result-item">
          <div>
            <h3>${formatText(installation.name)}</h3>
            <dl class="compact-data">
              <div>
                <dt>Tipo</dt>
                <dd>${formatText(installation.type)}</dd>
              </div>
              <div>
                <dt>Ciudad</dt>
                <dd>${formatText(installation.city)}</dd>
              </div>
            </dl>
            <div class="tags">${renderSports(installation.sports)}</div>
          </div>
          <div class="item-actions">
            <button type="button" data-installation-id="${escapeHtml(installation.id)}">Ver detalle</button>
            <button type="button" class="secondary-button" data-installation-edit-id="${escapeHtml(installation.id)}">Editar</button>
            <button type="button" class="secondary-button" data-installation-delete-id="${escapeHtml(installation.id)}">Eliminar</button>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

export function renderInstallationDetail(installation) {
  if (!installation) {
    return '';
  }

  return `
    <section class="detail-panel" aria-live="polite">
      <div class="section-header">
        <div>
          <p class="eyebrow">Detalle</p>
          <h2>${formatText(installation.name)}</h2>
        </div>
        <button type="button" class="secondary-button" id="installation-detail-close">Cerrar</button>
      </div>

      <dl class="detail-grid">
        <div>
          <dt>Tipo</dt>
          <dd>${formatText(installation.type)}</dd>
        </div>
        <div>
          <dt>Ciudad</dt>
          <dd>${formatText(installation.city)}</dd>
        </div>
        <div>
          <dt>Coordenadas</dt>
          <dd>${renderCoordinates(installation.location)}</dd>
        </div>
        <div>
          <dt>Fuente</dt>
          <dd>${formatText(installation.source)}</dd>
        </div>
        <div>
          <dt>Última actualización</dt>
          <dd>${formatDate(installation.lastUpdated ?? installation.updatedAt)}</dd>
        </div>
      </dl>

      <div>
        <h3>Deportes asociados</h3>
        <div class="tags">${renderSports(installation.sports)}</div>
      </div>

      <div class="weather-actions">
        <button type="button" data-weather-installation-id="${escapeHtml(installation.id)}">
          Consultar meteorología
        </button>
        <p class="status-text" id="installation-weather-status"></p>
      </div>
      <div id="installation-weather-result"></div>
    </section>
  `;
}

export function renderInstallationWeather(weatherRecord) {
  if (!weatherRecord) {
    return '';
  }

  return `
    <section class="weather-panel" aria-live="polite">
      <h3>Meteorología actual</h3>
      <dl class="detail-grid">
        <div>
          <dt>Temperatura</dt>
          <dd>${formatNumber(weatherRecord.temperature, ' °C')}</dd>
        </div>
        <div>
          <dt>Condición</dt>
          <dd>${formatText(weatherRecord.condition)}</dd>
        </div>
        <div>
          <dt>Humedad</dt>
          <dd>${formatNumber(weatherRecord.humidity, ' %')}</dd>
        </div>
        <div>
          <dt>Viento</dt>
          <dd>${formatNumber(weatherRecord.windspeed, ' m/s')}</dd>
        </div>
        <div>
          <dt>Fecha de consulta</dt>
          <dd>${formatDate(weatherRecord.queryDate)}</dd>
        </div>
      </dl>
    </section>
  `;
}

export async function mountInstallationsPage(rootElement, dependencies = {}) {
  const { fetchImpl = globalThis.fetch, confirmImpl = globalThis.confirm } = dependencies;

  rootElement.innerHTML = renderInstallationsSection();

  const form = rootElement.querySelector('#installations-filters');
  const clearButton = rootElement.querySelector('#installations-clear');
  const statusNode = rootElement.querySelector('#installations-status');
  const resultsNode = rootElement.querySelector('#installations-results');
  const detailNode = rootElement.querySelector('#installation-detail');
  const prevButton = rootElement.querySelector('#installations-prev');
  const nextButton = rootElement.querySelector('#installations-next');
  const pageNode = rootElement.querySelector('#installations-page');
  const installationForm = rootElement.querySelector('#installation-form');
  const formStatusNode = rootElement.querySelector('#installation-form-status');
  const resetFormButton = rootElement.querySelector('#installation-form-reset');
  const sportSearchButton = rootElement.querySelector('#installation-sport-search');
  const addSelectedSportButton = rootElement.querySelector('#installation-sport-add-selected');
  const sportResultsNode = rootElement.querySelector('#installation-sport-results');
  const selectedSportsNode = rootElement.querySelector('#installation-selected-sports');
  const selectedSports = [];
  let catalogSports = [];
  const state = {
    page: 1,
    limit: DEFAULT_LIMIT,
    filters: {},
    hasNextPage: false
  };

  function renderSelectedSportsState() {
    selectedSportsNode.innerHTML = renderSelectedSports(selectedSports);
  }

  function clearInstallationForm() {
    installationForm.reset();
    installationForm.elements.id.value = '';
    selectedSports.splice(0, selectedSports.length);
    sportResultsNode.innerHTML = '';
    renderSelectedSportsState();
  }

  function addSportToInstallation(sport) {
    const normalizedSport = {
      name: String(sport?.name ?? '').trim(),
      sportId: sport?.sportId ? String(sport.sportId).trim() : undefined
    };

    if (!normalizedSport.name) {
      setStatus(formStatusNode, 'Selecciona o escribe un deporte válido.', 'is-error');
      return;
    }

    const alreadySelected = selectedSports.some((selectedSport) => (
      (normalizedSport.sportId && selectedSport.sportId === normalizedSport.sportId)
      || selectedSport.name?.toLowerCase() === normalizedSport.name.toLowerCase()
    ));

    if (alreadySelected) {
      setStatus(formStatusNode, 'Ese deporte ya está asociado a la instalación.', 'is-success');
      return;
    }

    selectedSports.push(normalizedSport);
    renderSelectedSportsState();
    setStatus(formStatusNode, 'Deporte asociado a la instalación.', 'is-success');
  }

  async function loadCatalogSports() {
    try {
      const payload = await fetchSports({ page: 1, limit: 100 }, fetchImpl);
      catalogSports = payload.data;
      installationForm.elements.catalogSportId.innerHTML = renderCatalogSportOptions(catalogSports);
    } catch (error) {
      catalogSports = [];
      installationForm.elements.catalogSportId.innerHTML = '<option value="">No se pudieron cargar deportes</option>';
      setStatus(formStatusNode, error.message, 'is-error');
    }
  }

  function fillInstallationForm(installation) {
    installationForm.elements.id.value = installation.id ?? '';
    installationForm.elements.name.value = installation.name ?? '';
    installationForm.elements.type.value = installation.type ?? '';
    installationForm.elements.city.value = installation.city ?? '';
    installationForm.elements.source.value = installation.source ?? 'manual';
    const coordinates = installation.location?.coordinates;
    installationForm.elements.longitude.value = Array.isArray(coordinates) ? coordinates[0] ?? '' : '';
    installationForm.elements.latitude.value = Array.isArray(coordinates) ? coordinates[1] ?? '' : '';
    selectedSports.splice(
      0,
      selectedSports.length,
      ...(Array.isArray(installation.sports) ? installation.sports.map((sport) => ({
        name: sport.name,
        sportId: sport.sportId
      })) : [])
    );
    renderSelectedSportsState();
  }

  async function loadInstallations() {
    setStatus(statusNode, 'Cargando instalaciones...', '');
    resultsNode.innerHTML = '';
    detailNode.innerHTML = '';
    prevButton.disabled = true;
    nextButton.disabled = true;

    try {
      const payload = await fetchInstallations(
        { ...state.filters, page: state.page, limit: state.limit },
        fetchImpl
      );
      state.hasNextPage = payload.data.length === state.limit;
      resultsNode.innerHTML = renderInstallationsList(payload.data);
      pageNode.textContent = `Página ${state.page}`;
      prevButton.disabled = state.page <= 1;
      nextButton.disabled = !state.hasNextPage;
      setStatus(statusNode, `${payload.data.length} instalaciones cargadas.`, 'is-success');
    } catch (error) {
      resultsNode.innerHTML = '';
      state.hasNextPage = false;
      pageNode.textContent = `Página ${state.page}`;
      setStatus(statusNode, error.message, 'is-error');
    }
  }

  async function loadInstallationDetail(id) {
    setStatus(statusNode, 'Cargando detalle de la instalación...', '');
    detailNode.innerHTML = '';

    try {
      const installation = await fetchInstallationById(id, fetchImpl);
      detailNode.innerHTML = renderInstallationDetail(installation);
      detailNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setStatus(statusNode, 'Detalle cargado correctamente.', 'is-success');
    } catch (error) {
      setStatus(statusNode, error.message, 'is-error');
    }
  }

  async function loadInstallationForEdit(id) {
    setStatus(formStatusNode, 'Cargando instalación para editar...', '');

    try {
      const installation = await fetchInstallationById(id, fetchImpl);
      fillInstallationForm(installation);
      installationForm.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      installationForm.elements.name.focus();
      setStatus(formStatusNode, 'Editando instalación seleccionada.', 'is-success');
    } catch (error) {
      setStatus(formStatusNode, error.message, 'is-error');
    }
  }

  async function removeInstallation(id) {
    if (confirmImpl && !confirmImpl('¿Eliminar esta instalación?')) {
      return;
    }

    setStatus(statusNode, 'Eliminando instalación...', '');

    try {
      const payload = await deleteInstallation(id, fetchImpl);
      detailNode.innerHTML = '';
      setStatus(statusNode, payload.message ?? 'Instalación eliminada correctamente.', 'is-success');
      await loadInstallations();
    } catch (error) {
      setStatus(statusNode, error.message, 'is-error');
    }
  }

  async function searchSportsForInstallation() {
    const query = installationForm.elements.sportSearch.value.trim();
    setStatus(formStatusNode, 'Buscando deportes del catálogo...', '');
    sportResultsNode.innerHTML = '';

    try {
      let payload = await fetchSports({ name: query, page: 1, limit: 5 }, fetchImpl);
      if (query !== '' && payload.data.length === 0) {
        payload = await fetchSports({ osmKey: query, page: 1, limit: 5 }, fetchImpl);
      }

      if (payload.data.length === 0) {
        sportResultsNode.innerHTML = '<p class="empty-state">No hay deportes del catálogo para asociar.</p>';
      } else {
        catalogSports = payload.data;
        installationForm.elements.catalogSportId.innerHTML = renderCatalogSportOptions(catalogSports);
        sportResultsNode.innerHTML = `
          <div class="results-list">
            ${payload.data.map((sport) => `
              <article class="result-item">
                <div>
                  <h3>${formatText(sport.name)}</h3>
                  <p class="muted">${formatText(sport.category)} · ${formatText(sport.environment)}</p>
                </div>
                <button type="button" data-add-sport-id="${escapeHtml(sport.id)}" data-add-sport-name="${escapeHtml(sport.name)}">
                  Asociar
                </button>
              </article>
            `).join('')}
          </div>
        `;
      }
      setStatus(formStatusNode, `${payload.data.length} deportes encontrados.`, 'is-success');
    } catch (error) {
      setStatus(formStatusNode, error.message, 'is-error');
    }
  }

  async function loadInstallationWeather(id) {
    const weatherStatusNode = detailNode.querySelector('#installation-weather-status');
    const weatherResultNode = detailNode.querySelector('#installation-weather-result');
    const weatherButton = detailNode.querySelector('[data-weather-installation-id]');

    if (!weatherStatusNode || !weatherResultNode || !weatherButton) {
      return;
    }

    setStatus(weatherStatusNode, 'Consultando meteorología...', '');
    weatherResultNode.innerHTML = '';
    weatherButton.disabled = true;

    try {
      const weatherRecord = await fetchInstallationWeather(id, fetchImpl);
      weatherResultNode.innerHTML = renderInstallationWeather(weatherRecord);
      setStatus(weatherStatusNode, 'Meteorología cargada correctamente.', 'is-success');
    } catch (error) {
      setStatus(weatherStatusNode, error.message, 'is-error');
    } finally {
      weatherButton.disabled = false;
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = getFormValues(form);
    state.filters = {
      name: values.name,
      city: values.city,
      type: values.type,
      sport: values.sport
    };
    state.limit = values.limit;
    state.page = 1;
    loadInstallations();
  });

  clearButton.addEventListener('click', () => {
    form.reset();
    state.filters = {};
    state.limit = DEFAULT_LIMIT;
    state.page = 1;
    loadInstallations();
  });

  prevButton.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      loadInstallations();
    }
  });

  nextButton.addEventListener('click', () => {
    if (state.hasNextPage) {
      state.page += 1;
      loadInstallations();
    }
  });

  resultsNode.addEventListener('click', (event) => {
    const detailButton = event.target.closest('[data-installation-id]');
    const editButton = event.target.closest('[data-installation-edit-id]');
    const deleteButton = event.target.closest('[data-installation-delete-id]');
    if (detailButton) {
      loadInstallationDetail(detailButton.dataset.installationId);
      return;
    }

    if (editButton) {
      loadInstallationForEdit(editButton.dataset.installationEditId);
      return;
    }

    if (deleteButton) {
      removeInstallation(deleteButton.dataset.installationDeleteId);
    }
  });

  detailNode.addEventListener('click', (event) => {
    const weatherButton = event.target.closest('[data-weather-installation-id]');
    if (weatherButton) {
      loadInstallationWeather(weatherButton.dataset.weatherInstallationId);
      return;
    }

    if (event.target.closest('#installation-detail-close')) {
      detailNode.innerHTML = '';
      setStatus(statusNode, 'Listado de instalaciones disponible.', 'is-success');
    }
  });

  installationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = installationForm.elements.id.value;
    const payload = getInstallationPayload(installationForm, selectedSports);

    setStatus(formStatusNode, 'Guardando instalación...', '');

    try {
      if (id) {
        await updateInstallation(id, payload, fetchImpl);
        setStatus(formStatusNode, 'Instalación actualizada correctamente.', 'is-success');
      } else {
        await createInstallation(payload, fetchImpl);
        setStatus(formStatusNode, 'Instalación creada correctamente.', 'is-success');
      }

      clearInstallationForm();
      await loadInstallations();
    } catch (error) {
      setStatus(formStatusNode, error.message, 'is-error');
    }
  });

  resetFormButton.addEventListener('click', () => {
    clearInstallationForm();
    setStatus(formStatusNode, 'Formulario listo para crear o editar una instalación.', '');
  });

  sportSearchButton.addEventListener('click', () => {
    searchSportsForInstallation();
  });

  sportResultsNode.addEventListener('click', (event) => {
    const addButton = event.target.closest('[data-add-sport-id]');
    if (!addButton) {
      return;
    }

    addSportToInstallation({
      name: addButton.dataset.addSportName,
      sportId: addButton.dataset.addSportId
    });
  });

  addSelectedSportButton.addEventListener('click', () => {
    const selectedSport = catalogSports.find((sport) => sport.id === installationForm.elements.catalogSportId.value);
    addSportToInstallation({
      name: selectedSport?.name,
      sportId: selectedSport?.id
    });
  });

  installationForm.elements.sportSearch.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchSportsForInstallation();
    }
  });

  selectedSportsNode.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-selected-sport]');
    if (!removeButton) {
      return;
    }

    selectedSports.splice(Number.parseInt(removeButton.dataset.removeSelectedSport, 10), 1);
    renderSelectedSportsState();
    setStatus(formStatusNode, 'Deporte quitado de la instalación.', 'is-success');
  });

  renderSelectedSportsState();
  await loadCatalogSports();
  await loadInstallations();
}

const rootElement = typeof document !== 'undefined'
  ? document.querySelector('#installations-page')
  : null;

if (rootElement) {
  mountInstallationsPage(rootElement);
}

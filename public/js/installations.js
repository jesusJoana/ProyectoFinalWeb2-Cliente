import {
  fetchInstallationById,
  fetchInstallations,
  fetchInstallationWeather
} from './api.js';

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
          <button type="button" data-installation-id="${escapeHtml(installation.id)}">Ver detalle</button>
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
  const { fetchImpl = globalThis.fetch } = dependencies;

  rootElement.innerHTML = renderInstallationsSection();

  const form = rootElement.querySelector('#installations-filters');
  const clearButton = rootElement.querySelector('#installations-clear');
  const statusNode = rootElement.querySelector('#installations-status');
  const resultsNode = rootElement.querySelector('#installations-results');
  const detailNode = rootElement.querySelector('#installation-detail');
  const prevButton = rootElement.querySelector('#installations-prev');
  const nextButton = rootElement.querySelector('#installations-next');
  const pageNode = rootElement.querySelector('#installations-page');
  const state = {
    page: 1,
    limit: 10,
    filters: {},
    hasNextPage: false
  };

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
    state.limit = 10;
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
    if (detailButton) {
      loadInstallationDetail(detailButton.dataset.installationId);
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

  await loadInstallations();
}

const rootElement = typeof document !== 'undefined'
  ? document.querySelector('#installations-page')
  : null;

if (rootElement) {
  mountInstallationsPage(rootElement);
}

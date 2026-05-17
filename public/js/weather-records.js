import { fetchInstallationById, fetchWeatherRecords } from './api.js';

const DEFAULT_LIMIT = 10;
const DEFAULT_SORT_BY = 'queryDate';
const DEFAULT_SORT_ORDER = 'desc';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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
    installationId: formData.get('installationId'),
    condition: formData.get('condition'),
    dateFrom: formData.get('dateFrom'),
    dateTo: formData.get('dateTo'),
    sortBy: formData.get('sortBy') || DEFAULT_SORT_BY,
    sortOrder: formData.get('sortOrder') || DEFAULT_SORT_ORDER,
    limit: Number.parseInt(formData.get('limit'), 10) || DEFAULT_LIMIT
  };
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

function formatDate(value) {
  if (!value) {
    return 'Sin informar';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function getInstallationLabel(record, installationNamesById) {
  const installationId = String(record.installationId ?? '').trim();

  if (!installationId) {
    return 'Sin informar';
  }

  return installationNamesById.get(installationId) ?? installationId;
}

function renderInstallationReference(record, installationNamesById) {
  const installationId = String(record.installationId ?? '').trim();
  const installationLabel = getInstallationLabel(record, installationNamesById);

  if (!installationId || installationLabel === installationId) {
    return escapeHtml(installationLabel);
  }

  return `
    <span class="reference-block">
      <strong>${escapeHtml(installationLabel)}</strong>
      <span class="muted">ID: ${escapeHtml(installationId)}</span>
    </span>
  `;
}

export function renderWeatherRecords(records, installationNamesById = new Map()) {
  if (!records.length) {
    return '<p class="empty-state">No hay registros meteorológicos disponibles.</p>';
  }

  return `
    <div class="results-list">
      ${records.map((record) => `
        <article class="result-item">
          <div>
            <h3>${escapeHtml(record.condition ?? 'Registro meteorológico')}</h3>
            <dl class="compact-data">
              <div>
                <dt>Instalación</dt>
                <dd>${renderInstallationReference(record, installationNamesById)}</dd>
              </div>
              <div>
                <dt>Temperatura</dt>
                <dd>${formatNumber(record.temperature, ' °C')}</dd>
              </div>
              <div>
                <dt>Humedad</dt>
                <dd>${formatNumber(record.humidity, ' %')}</dd>
              </div>
              <div>
                <dt>Viento</dt>
                <dd>${formatNumber(record.windspeed, ' m/s')}</dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>${formatDate(record.queryDate)}</dd>
              </div>
            </dl>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

async function resolveInstallationNames(records, fetchImpl) {
  const uniqueInstallationIds = [...new Set(
    records
      .map((record) => String(record.installationId ?? '').trim())
      .filter(Boolean)
  )];
  const installationNamesById = new Map();

  await Promise.all(uniqueInstallationIds.map(async (installationId) => {
    try {
      const installation = await fetchInstallationById(installationId, fetchImpl);
      if (installation?.name) {
        installationNamesById.set(installationId, installation.name);
      }
    } catch {
      // Si una instalación no puede resolverse, mantenemos visible el installationId.
    }
  }));

  return installationNamesById;
}

export async function mountWeatherRecordsPage(rootElement, dependencies = {}) {
  const { fetchImpl = globalThis.fetch } = dependencies;
  const form = rootElement.querySelector('#weather-records-filters');
  const clearButton = rootElement.querySelector('#weather-records-clear');
  const statusNode = rootElement.querySelector('#weather-records-status');
  const resultsNode = rootElement.querySelector('#weather-records-results');
  const prevButton = rootElement.querySelector('#weather-records-prev');
  const nextButton = rootElement.querySelector('#weather-records-next');
  const pageNode = rootElement.querySelector('#weather-records-page-indicator');
  const state = {
    page: 1,
    limit: DEFAULT_LIMIT,
    filters: {
      sortBy: DEFAULT_SORT_BY,
      sortOrder: DEFAULT_SORT_ORDER
    },
    hasNextPage: false
  };

  async function loadWeatherRecords() {
    setStatus(statusNode, 'Cargando histórico meteorológico...', '');
    resultsNode.innerHTML = '';
    prevButton.disabled = true;
    nextButton.disabled = true;

    try {
      const payload = await fetchWeatherRecords(
        { ...state.filters, page: state.page, limit: state.limit },
        fetchImpl
      );
      const installationNamesById = await resolveInstallationNames(payload.data, fetchImpl);
      state.hasNextPage = payload.data.length === state.limit;
      resultsNode.innerHTML = renderWeatherRecords(payload.data, installationNamesById);
      pageNode.textContent = `Página ${state.page}`;
      prevButton.disabled = state.page <= 1;
      nextButton.disabled = !state.hasNextPage;
      setStatus(statusNode, `${payload.data.length} registros cargados.`, 'is-success');
    } catch (error) {
      resultsNode.innerHTML = '';
      state.hasNextPage = false;
      pageNode.textContent = `Página ${state.page}`;
      setStatus(statusNode, error.message, 'is-error');
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = getFormValues(form);
    state.filters = {
      installationId: values.installationId,
      condition: values.condition,
      dateFrom: values.dateFrom,
      dateTo: values.dateTo,
      sortBy: values.sortBy,
      sortOrder: values.sortOrder
    };
    state.limit = values.limit;
    state.page = 1;
    loadWeatherRecords();
  });

  clearButton.addEventListener('click', () => {
    form.reset();
    state.filters = {
      sortBy: DEFAULT_SORT_BY,
      sortOrder: DEFAULT_SORT_ORDER
    };
    state.limit = DEFAULT_LIMIT;
    state.page = 1;
    loadWeatherRecords();
  });

  prevButton.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      loadWeatherRecords();
    }
  });

  nextButton.addEventListener('click', () => {
    if (state.hasNextPage) {
      state.page += 1;
      loadWeatherRecords();
    }
  });

  await loadWeatherRecords();
}

const rootElement = typeof document !== 'undefined'
  ? document.querySelector('#weather-records-page')
  : null;

if (rootElement) {
  mountWeatherRecordsPage(rootElement);
}

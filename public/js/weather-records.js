import { fetchWeatherRecords } from './api.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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

function renderWeatherRecords(records) {
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

export async function mountWeatherRecordsPage(rootElement, dependencies = {}) {
  const { fetchImpl = globalThis.fetch } = dependencies;
  const statusNode = rootElement.querySelector('#weather-records-status');
  const resultsNode = rootElement.querySelector('#weather-records-results');

  try {
    const payload = await fetchWeatherRecords(
      { page: 1, limit: 20, sortBy: 'queryDate', sortOrder: 'desc' },
      fetchImpl
    );
    resultsNode.innerHTML = renderWeatherRecords(payload.data);
    statusNode.textContent = `${payload.data.length} registros cargados.`;
    statusNode.classList.add('is-success');
  } catch (error) {
    resultsNode.innerHTML = '';
    statusNode.textContent = error.message;
    statusNode.classList.add('is-error');
  }
}

const rootElement = typeof document !== 'undefined'
  ? document.querySelector('#weather-records-page')
  : null;

if (rootElement) {
  mountWeatherRecordsPage(rootElement);
}

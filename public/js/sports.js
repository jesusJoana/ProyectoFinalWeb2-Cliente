import { fetchSports } from './api.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderSportsList(sports) {
  if (!sports.length) {
    return '<p class="empty-state">No hay deportes disponibles.</p>';
  }

  return `
    <div class="results-list">
      ${sports.map((sport) => `
        <article class="result-item">
          <div>
            <h3>${escapeHtml(sport.name)}</h3>
            <p class="muted">${escapeHtml(sport.description ?? 'Sin descripción')}</p>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

export async function mountSportsPage(rootElement, dependencies = {}) {
  const { fetchImpl = globalThis.fetch } = dependencies;
  const statusNode = rootElement.querySelector('#sports-status');
  const resultsNode = rootElement.querySelector('#sports-results');

  try {
    const payload = await fetchSports({ page: 1, limit: 20 }, fetchImpl);
    resultsNode.innerHTML = renderSportsList(payload.data);
    statusNode.textContent = `${payload.data.length} deportes cargados.`;
    statusNode.classList.add('is-success');
  } catch (error) {
    resultsNode.innerHTML = '';
    statusNode.textContent = error.message;
    statusNode.classList.add('is-error');
  }
}

const rootElement = typeof document !== 'undefined'
  ? document.querySelector('#sports-page')
  : null;

if (rootElement) {
  mountSportsPage(rootElement);
}

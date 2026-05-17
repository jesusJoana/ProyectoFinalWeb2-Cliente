import {
  createSport,
  deleteSport,
  fetchSportById,
  fetchSports,
  patchSport,
  updateSport
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

function normalizeOptionalValue(value) {
  const normalized = String(value ?? '').trim();
  return normalized === '' ? null : normalized;
}

function setStatus(statusNode, message, className) {
  statusNode.textContent = message;
  statusNode.classList.remove('is-success', 'is-error');

  if (className) {
    statusNode.classList.add(className);
  }
}

function getFilterValues(formElement) {
  const FormDataConstructor = formElement.ownerDocument.defaultView.FormData;
  const formData = new FormDataConstructor(formElement);
  const missingMetadata = formData.get('missingMetadata') === 'true' ? 'true' : undefined;

  return {
    name: formData.get('name'),
    osmKey: formData.get('osmKey'),
    category: formData.get('category'),
    environment: formData.get('environment'),
    missingMetadata,
    limit: Number.parseInt(formData.get('limit'), 10) || DEFAULT_LIMIT
  };
}

function getSportFormPayload(formElement, partial = false) {
  const FormDataConstructor = formElement.ownerDocument.defaultView.FormData;
  const formData = new FormDataConstructor(formElement);
  const payload = {};

  if (!partial || String(formData.get('name') ?? '').trim() !== '') {
    payload.name = String(formData.get('name') ?? '').trim();
  }

  ['osmKey', 'category', 'environment'].forEach((field) => {
    const value = normalizeOptionalValue(formData.get(field));
    if (!partial || value !== null) {
      payload[field] = value;
    }
  });

  return payload;
}

export function renderSportsList(sports) {
  if (!Array.isArray(sports) || sports.length === 0) {
    return '<p class="empty-state">No hay deportes disponibles.</p>';
  }

  return `
    <div class="results-list">
      ${sports.map((sport) => `
        <article class="result-item">
          <div>
            <h3>${formatText(sport.name)}</h3>
            <dl class="compact-data">
              <div>
                <dt>Clave OSM</dt>
                <dd>${formatText(sport.osmKey)}</dd>
              </div>
              <div>
                <dt>Categoría</dt>
                <dd>${formatText(sport.category)}</dd>
              </div>
              <div>
                <dt>Entorno</dt>
                <dd>${formatText(sport.environment)}</dd>
              </div>
            </dl>
          </div>
          <div class="item-actions">
            <button type="button" data-sport-id="${escapeHtml(sport.id)}">Ver detalle</button>
            <button type="button" class="secondary-button" data-sport-edit-id="${escapeHtml(sport.id)}">Editar</button>
            <button type="button" class="secondary-button" data-sport-delete-id="${escapeHtml(sport.id)}">Eliminar</button>
          </div>
        </article>
      `).join('')}
    </div>
  `;
}

export function renderSportDetail(sport) {
  if (!sport) {
    return '';
  }

  return `
    <section class="detail-panel" aria-live="polite">
      <div class="section-header">
        <div>
          <p class="eyebrow">Detalle</p>
          <h2>${formatText(sport.name)}</h2>
        </div>
        <button type="button" class="secondary-button" id="sport-detail-close">Cerrar</button>
      </div>
      <dl class="detail-grid">
        <div>
          <dt>ID</dt>
          <dd>${formatText(sport.id)}</dd>
        </div>
        <div>
          <dt>Clave OSM</dt>
          <dd>${formatText(sport.osmKey)}</dd>
        </div>
        <div>
          <dt>Categoría</dt>
          <dd>${formatText(sport.category)}</dd>
        </div>
        <div>
          <dt>Entorno</dt>
          <dd>${formatText(sport.environment)}</dd>
        </div>
      </dl>
    </section>
  `;
}

function fillSportForm(formElement, sport) {
  formElement.elements.id.value = sport.id ?? '';
  formElement.elements.name.value = sport.name ?? '';
  formElement.elements.osmKey.value = sport.osmKey ?? '';
  formElement.elements.category.value = sport.category ?? '';
  formElement.elements.environment.value = sport.environment ?? '';
}

function clearSportForm(formElement) {
  formElement.reset();
  formElement.elements.id.value = '';
}

export async function mountSportsPage(rootElement, dependencies = {}) {
  const { fetchImpl = globalThis.fetch, confirmImpl = globalThis.confirm } = dependencies;
  const filtersForm = rootElement.querySelector('#sports-filters');
  const clearFiltersButton = rootElement.querySelector('#sports-clear');
  const sportForm = rootElement.querySelector('#sport-form');
  const resetFormButton = rootElement.querySelector('#sport-form-reset');
  const statusNode = rootElement.querySelector('#sports-status');
  const formStatusNode = rootElement.querySelector('#sport-form-status');
  const resultsNode = rootElement.querySelector('#sports-results');
  const detailNode = rootElement.querySelector('#sport-detail');
  const prevButton = rootElement.querySelector('#sports-prev');
  const nextButton = rootElement.querySelector('#sports-next');
  const pageNode = rootElement.querySelector('#sports-page-indicator');
  const state = {
    page: 1,
    limit: DEFAULT_LIMIT,
    filters: {},
    hasNextPage: false
  };

  async function loadSports() {
    setStatus(statusNode, 'Cargando deportes...', '');
    resultsNode.innerHTML = '';
    detailNode.innerHTML = '';
    prevButton.disabled = true;
    nextButton.disabled = true;

    try {
      const payload = await fetchSports(
        { ...state.filters, page: state.page, limit: state.limit },
        fetchImpl
      );
      state.hasNextPage = payload.data.length === state.limit;
      resultsNode.innerHTML = renderSportsList(payload.data);
      pageNode.textContent = `Página ${state.page}`;
      prevButton.disabled = state.page <= 1;
      nextButton.disabled = !state.hasNextPage;
      setStatus(statusNode, `${payload.data.length} deportes cargados.`, 'is-success');
    } catch (error) {
      resultsNode.innerHTML = '';
      state.hasNextPage = false;
      pageNode.textContent = `Página ${state.page}`;
      setStatus(statusNode, error.message, 'is-error');
    }
  }

  async function showSportDetail(id) {
    setStatus(statusNode, 'Cargando detalle del deporte...', '');
    detailNode.innerHTML = '';

    try {
      const sport = await fetchSportById(id, fetchImpl);
      detailNode.innerHTML = renderSportDetail(sport);
      detailNode.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      setStatus(statusNode, 'Detalle cargado correctamente.', 'is-success');
    } catch (error) {
      setStatus(statusNode, error.message, 'is-error');
    }
  }

  async function loadSportForEdit(id) {
    setStatus(formStatusNode, 'Cargando deporte para editar...', '');

    try {
      const sport = await fetchSportById(id, fetchImpl);
      fillSportForm(sportForm, sport);
      sportForm.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      sportForm.elements.name.focus();
      setStatus(formStatusNode, 'Editando deporte seleccionado.', 'is-success');
    } catch (error) {
      setStatus(formStatusNode, error.message, 'is-error');
    }
  }

  async function removeSport(id) {
    if (confirmImpl && !confirmImpl('¿Eliminar este deporte?')) {
      return;
    }

    setStatus(statusNode, 'Eliminando deporte...', '');

    try {
      const payload = await deleteSport(id, fetchImpl);
      setStatus(statusNode, payload.message ?? 'Deporte eliminado correctamente.', 'is-success');
      await loadSports();
    } catch (error) {
      setStatus(statusNode, error.message, 'is-error');
    }
  }

  filtersForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = getFilterValues(filtersForm);
    state.filters = {
      name: values.name,
      osmKey: values.osmKey,
      category: values.category,
      environment: values.environment,
      missingMetadata: values.missingMetadata
    };
    state.limit = values.limit;
    state.page = 1;
    loadSports();
  });

  clearFiltersButton.addEventListener('click', () => {
    filtersForm.reset();
    state.filters = {};
    state.limit = DEFAULT_LIMIT;
    state.page = 1;
    loadSports();
  });

  sportForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitter = event.submitter;
    const mode = submitter?.dataset.sportSaveMode ?? 'post';
    const id = sportForm.elements.id.value;
    const isPatch = mode === 'patch';
    const payload = getSportFormPayload(sportForm, isPatch);

    setStatus(formStatusNode, 'Guardando deporte...', '');

    try {
      if (id && isPatch) {
        await patchSport(id, payload, fetchImpl);
        setStatus(formStatusNode, 'Deporte actualizado parcialmente.', 'is-success');
      } else if (id) {
        await updateSport(id, payload, fetchImpl);
        setStatus(formStatusNode, 'Deporte actualizado correctamente.', 'is-success');
      } else {
        await createSport(payload, fetchImpl);
        setStatus(formStatusNode, 'Deporte creado correctamente.', 'is-success');
      }

      clearSportForm(sportForm);
      await loadSports();
    } catch (error) {
      setStatus(formStatusNode, error.message, 'is-error');
    }
  });

  resetFormButton.addEventListener('click', () => {
    clearSportForm(sportForm);
    setStatus(formStatusNode, 'Formulario listo para crear o editar un deporte del catálogo.', '');
  });

  prevButton.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      loadSports();
    }
  });

  nextButton.addEventListener('click', () => {
    if (state.hasNextPage) {
      state.page += 1;
      loadSports();
    }
  });

  resultsNode.addEventListener('click', (event) => {
    const detailButton = event.target.closest('[data-sport-id]');
    const editButton = event.target.closest('[data-sport-edit-id]');
    const deleteButton = event.target.closest('[data-sport-delete-id]');

    if (detailButton) {
      showSportDetail(detailButton.dataset.sportId);
      return;
    }

    if (editButton) {
      loadSportForEdit(editButton.dataset.sportEditId);
      return;
    }

    if (deleteButton) {
      removeSport(deleteButton.dataset.sportDeleteId);
    }
  });

  detailNode.addEventListener('click', (event) => {
    if (event.target.closest('#sport-detail-close')) {
      detailNode.innerHTML = '';
      setStatus(statusNode, 'Listado de deportes disponible.', 'is-success');
    }
  });

  await loadSports();
}

const rootElement = typeof document !== 'undefined'
  ? document.querySelector('#sports-page')
  : null;

if (rootElement) {
  mountSportsPage(rootElement);
}

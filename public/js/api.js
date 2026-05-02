import { API_BASE_URL } from './config.js';

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

function buildQueryString(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      searchParams.set(key, String(value).trim());
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

async function readErrorMessage(response, fallbackMessage) {
  try {
    const payload = await response.json();
    return payload?.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

// Este helper encapsula la llamada al backend y traduce errores al contrato que entiende la vista.
export async function fetchApiStatus(fetchImpl = globalThis.fetch, baseUrl = API_BASE_URL) {
  const response = await fetchImpl(joinUrl(baseUrl, '/'), {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('No se pudo comprobar el estado de la API.');
  }

  const payload = await response.json();

  if (!payload?.message || typeof payload.message !== 'string') {
    throw new Error('La API devolvió una respuesta inesperada.');
  }

  return payload;
}

export async function fetchInstallations(options = {}, fetchImpl = globalThis.fetch, baseUrl = API_BASE_URL) {
  const {
    name,
    city,
    type,
    sport,
    page = 1,
    limit = 10
  } = options;
  const queryString = buildQueryString({ name, city, type, sport, page, limit });
  const response = await fetchImpl(joinUrl(baseUrl, `/installations${queryString}`), {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, 'No se pudieron cargar las instalaciones.');
    throw new Error(message);
  }

  const payload = await response.json();

  if (!Array.isArray(payload?.data)) {
    throw new Error('La API devolvió una lista de instalaciones inesperada.');
  }

  return {
    data: payload.data,
    pagination: payload.pagination ?? { page, limit }
  };
}

export async function fetchInstallationById(id, fetchImpl = globalThis.fetch, baseUrl = API_BASE_URL) {
  if (!id || typeof id !== 'string') {
    throw new Error('Debes seleccionar una instalación válida.');
  }

  const response = await fetchImpl(joinUrl(baseUrl, `/installations/${encodeURIComponent(id)}`), {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, 'No se pudo cargar el detalle de la instalación.');
    throw new Error(message);
  }

  const payload = await response.json();

  if (!payload?.data || typeof payload.data !== 'object') {
    throw new Error('La API devolvió un detalle de instalación inesperado.');
  }

  return payload.data;
}

export async function fetchInstallationWeather(id, fetchImpl = globalThis.fetch, baseUrl = API_BASE_URL) {
  if (!id || typeof id !== 'string') {
    throw new Error('Debes seleccionar una instalación válida.');
  }

  const response = await fetchImpl(joinUrl(baseUrl, `/installations/${encodeURIComponent(id)}/weather`), {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, 'No se pudo consultar la meteorología de la instalación.');
    throw new Error(message);
  }

  const payload = await response.json();

  if (!payload?.data || typeof payload.data !== 'object') {
    throw new Error('La API devolvió una respuesta meteorológica inesperada.');
  }

  return payload.data;
}

export async function fetchSports(options = {}, fetchImpl = globalThis.fetch, baseUrl = API_BASE_URL) {
  const {
    name,
    osmKey,
    category,
    environment,
    missingMetadata,
    page = 1,
    limit = 10
  } = options;
  const queryString = buildQueryString({
    name,
    osmKey,
    category,
    environment,
    missingMetadata,
    page,
    limit
  });
  const response = await fetchImpl(joinUrl(baseUrl, `/sports${queryString}`), {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, 'No se pudieron cargar los deportes.');
    throw new Error(message);
  }

  const payload = await response.json();

  if (!Array.isArray(payload?.data)) {
    throw new Error('La API devolvió una lista de deportes inesperada.');
  }

  return {
    data: payload.data,
    pagination: payload.pagination ?? { page, limit }
  };
}

export async function fetchSportById(id, fetchImpl = globalThis.fetch, baseUrl = API_BASE_URL) {
  if (!id || typeof id !== 'string') {
    throw new Error('Debes seleccionar un deporte válido.');
  }

  const response = await fetchImpl(joinUrl(baseUrl, `/sports/${encodeURIComponent(id)}`), {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, 'No se pudo cargar el detalle del deporte.');
    throw new Error(message);
  }

  const payload = await response.json();

  if (!payload?.data || typeof payload.data !== 'object') {
    throw new Error('La API devolvió un detalle de deporte inesperado.');
  }

  return payload.data;
}

async function writeSport(path, method, payload, fetchImpl, baseUrl) {
  const response = await fetchImpl(joinUrl(baseUrl, path), {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, 'No se pudo guardar el deporte.');
    throw new Error(message);
  }

  const responsePayload = await response.json();

  if (!responsePayload?.data || typeof responsePayload.data !== 'object') {
    throw new Error('La API devolvió un deporte inesperado.');
  }

  return responsePayload.data;
}

export async function createSport(payload, fetchImpl = globalThis.fetch, baseUrl = API_BASE_URL) {
  return writeSport('/sports', 'POST', payload, fetchImpl, baseUrl);
}

export async function updateSport(id, payload, fetchImpl = globalThis.fetch, baseUrl = API_BASE_URL) {
  if (!id || typeof id !== 'string') {
    throw new Error('Debes seleccionar un deporte válido.');
  }

  return writeSport(`/sports/${encodeURIComponent(id)}`, 'PUT', payload, fetchImpl, baseUrl);
}

export async function patchSport(id, payload, fetchImpl = globalThis.fetch, baseUrl = API_BASE_URL) {
  if (!id || typeof id !== 'string') {
    throw new Error('Debes seleccionar un deporte válido.');
  }

  return writeSport(`/sports/${encodeURIComponent(id)}`, 'PATCH', payload, fetchImpl, baseUrl);
}

export async function deleteSport(id, fetchImpl = globalThis.fetch, baseUrl = API_BASE_URL) {
  if (!id || typeof id !== 'string') {
    throw new Error('Debes seleccionar un deporte válido.');
  }

  const response = await fetchImpl(joinUrl(baseUrl, `/sports/${encodeURIComponent(id)}`), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, 'No se pudo eliminar el deporte.');
    throw new Error(message);
  }

  return response.json();
}

export async function fetchWeatherRecords(options = {}, fetchImpl = globalThis.fetch, baseUrl = API_BASE_URL) {
  const {
    installationId,
    condition,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    page = 1,
    limit = 10
  } = options;
  const queryString = buildQueryString({
    installationId,
    condition,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    page,
    limit
  });
  const response = await fetchImpl(joinUrl(baseUrl, `/weather-records${queryString}`), {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, 'No se pudo cargar el histórico meteorológico.');
    throw new Error(message);
  }

  const payload = await response.json();

  if (!Array.isArray(payload?.data)) {
    throw new Error('La API devolvió una lista meteorológica inesperada.');
  }

  return {
    data: payload.data,
    pagination: payload.pagination ?? { page, limit },
    sorting: payload.sorting
  };
}

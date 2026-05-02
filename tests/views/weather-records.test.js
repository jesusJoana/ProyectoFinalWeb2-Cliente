import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import {
  mountWeatherRecordsPage,
  renderWeatherRecords
} from '../../public/js/weather-records.js';

function createWeatherRecordsDom() {
  return new JSDOM(`
    <main id="weather-records-page">
      <form id="weather-records-filters">
        <input name="installationId" />
        <input name="condition" />
        <input name="dateFrom" />
        <input name="dateTo" />
        <select name="sortBy">
          <option value="queryDate" selected>Fecha</option>
          <option value="temperature">Temperatura</option>
        </select>
        <select name="sortOrder">
          <option value="desc" selected>Descendente</option>
          <option value="asc">Ascendente</option>
        </select>
        <select name="limit">
          <option value="5">5</option>
          <option value="10" selected>10</option>
        </select>
        <button type="submit">Buscar</button>
        <button type="button" id="weather-records-clear">Limpiar</button>
      </form>
      <p id="weather-records-status" class="status-text"></p>
      <div id="weather-records-results"></div>
      <button type="button" id="weather-records-prev">Anterior</button>
      <span id="weather-records-page-indicator">Página 1</span>
      <button type="button" id="weather-records-next">Siguiente</button>
    </main>
  `);
}

test('renderWeatherRecords muestra registros meteorológicos', () => {
  const html = renderWeatherRecords([
    {
      installationId: 'inst-1',
      temperature: 18.6,
      condition: 'clear',
      humidity: 73,
      windspeed: 4.2,
      queryDate: '2026-04-25T14:00:00.000Z'
    }
  ]);

  assert.match(html, /inst-1/);
  assert.match(html, /18,6 °C/);
  assert.match(html, /clear/);
  assert.match(html, /73 %/);
  assert.match(html, /4,2 m\/s/);
});

test('renderWeatherRecords muestra estado vacío si no hay registros', () => {
  const html = renderWeatherRecords([]);

  assert.match(html, /No hay registros meteorológicos/);
});

test('La página de histórico permite filtrar, ordenar y paginar registros', async () => {
  const dom = createWeatherRecordsDom();
  const root = dom.window.document.querySelector('#weather-records-page');
  const requestedUrls = [];
  const fetchImpl = async (url) => {
    requestedUrls.push(url);
    const records = Array.from({ length: url.includes('limit=5') ? 5 : 2 }, (_, index) => ({
      id: `weather-${index + 1}`,
      installationId: `inst-${index + 1}`,
      temperature: 23.2 + index,
      condition: index === 0 ? 'clear' : 'clouds',
      humidity: 41 + index,
      windspeed: 2.4 + index,
      queryDate: '2026-04-25T14:00:00.000Z'
    }));

    return {
      ok: true,
      json: async () => ({
        data: records,
        pagination: { page: 1, limit: records.length }
      })
    };
  };

  await mountWeatherRecordsPage(root, { fetchImpl });

  root.querySelector('input[name="installationId"]').value = 'inst-1';
  root.querySelector('input[name="condition"]').value = 'clear';
  root.querySelector('input[name="dateFrom"]').value = '2026-04-20T00:00';
  root.querySelector('input[name="dateTo"]').value = '2026-04-21T00:00';
  root.querySelector('select[name="sortBy"]').value = 'temperature';
  root.querySelector('select[name="sortOrder"]').value = 'asc';
  root.querySelector('select[name="limit"]').value = '5';
  root.querySelector('#weather-records-filters').dispatchEvent(
    new dom.window.Event('submit', { bubbles: true, cancelable: true })
  );

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(
    requestedUrls.some((url) => (
      url.includes('installationId=inst-1')
      && url.includes('condition=clear')
      && url.includes('dateFrom=2026-04-20T00%3A00')
      && url.includes('dateTo=2026-04-21T00%3A00')
      && url.includes('sortBy=temperature')
      && url.includes('sortOrder=asc')
      && url.includes('limit=5')
    )),
    true
  );
  assert.match(root.querySelector('#weather-records-results').textContent, /clear/);
  assert.match(root.querySelector('#weather-records-status').textContent, /registros cargados/);

  root.querySelector('#weather-records-next').click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(root.querySelector('#weather-records-page-indicator').textContent, /Página 2/);
  assert.equal(
    requestedUrls.some((url) => url.includes('page=2') && url.includes('limit=5')),
    true
  );
});

test('La página de histórico muestra errores de consulta', async () => {
  const dom = createWeatherRecordsDom();
  const root = dom.window.document.querySelector('#weather-records-page');
  const fetchImpl = async () => ({
    ok: false,
    json: async () => ({ message: 'sortOrder no es válido.' })
  });

  await mountWeatherRecordsPage(root, { fetchImpl });

  assert.match(root.querySelector('#weather-records-status').textContent, /sortOrder no es válido/);
  assert.equal(root.querySelector('#weather-records-status').classList.contains('is-error'), true);
});

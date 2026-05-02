import assert from 'node:assert/strict';
import test from 'node:test';
import {
  renderInstallationDetail,
  renderInstallationsList,
  renderInstallationsSection,
  renderInstallationWeather,
  mountInstallationsPage
} from '../../public/js/installations.js';
import { JSDOM } from 'jsdom';

test('renderInstallationsSection incluye filtros, resultados y controles de paginación', () => {
  const html = renderInstallationsSection();

  assert.match(html, /name="name"/);
  assert.match(html, /name="city"/);
  assert.match(html, /name="type"/);
  assert.match(html, /name="sport"/);
  assert.match(html, /id="installations-results"/);
  assert.match(html, /id="installations-prev"/);
  assert.match(html, /id="installations-next"/);
});

test('renderInstallationsList muestra instalaciones y deportes asociados', () => {
  const html = renderInstallationsList([
    {
      id: 'inst-1',
      name: 'Polideportivo Norte',
      type: 'sports_centre',
      city: 'Getafe',
      sports: [{ name: 'football' }, { name: 'basketball' }]
    }
  ]);

  assert.match(html, /Polideportivo Norte/);
  assert.match(html, /sports_centre/);
  assert.match(html, /Getafe/);
  assert.match(html, /football/);
  assert.match(html, /data-installation-id="inst-1"/);
});

test('renderInstallationsList muestra estado vacío si no hay resultados', () => {
  const html = renderInstallationsList([]);

  assert.match(html, /No hay instalaciones/);
});

test('renderInstallationDetail muestra los datos principales de la instalación', () => {
  const html = renderInstallationDetail({
    id: 'inst-1',
    name: 'Campo Central',
    type: 'pitch',
    city: 'Madrid',
    source: 'osm',
    lastUpdated: '2026-04-25T10:30:00.000Z',
    location: {
      type: 'Point',
      coordinates: [-3.70379, 40.41678]
    },
    sports: [{ name: 'tennis' }]
  });

  assert.match(html, /Campo Central/);
  assert.match(html, /pitch/);
  assert.match(html, /Madrid/);
  assert.match(html, /-3.70379, 40.41678/);
  assert.match(html, /osm/);
  assert.match(html, /tennis/);
  assert.match(html, /Consultar meteorología/);
  assert.match(html, /data-weather-installation-id="inst-1"/);
});

test('renderInstallationWeather muestra temperatura, condición, humedad, viento y fecha', () => {
  const html = renderInstallationWeather({
    temperature: 18.6,
    condition: 'lluvia ligera',
    humidity: 73,
    windspeed: 4.2,
    queryDate: '2026-04-25T14:00:00.000Z'
  });

  assert.match(html, /18,6 °C/);
  assert.match(html, /lluvia ligera/);
  assert.match(html, /73 %/);
  assert.match(html, /4,2 m\/s/);
  assert.match(html, /Meteorología actual/);
});

test('La pantalla de instalaciones permite crear, editar, asociar deportes y borrar', async () => {
  const dom = new JSDOM('<main id="installations-page"></main>', { url: 'http://localhost/installations' });
  const root = dom.window.document.querySelector('#installations-page');
  const requested = [];
  const installation = {
    id: '507f1f77bcf86cd799439011',
    name: 'Polideportivo Norte',
    type: 'sports_centre',
    city: 'Getafe',
    source: 'manual',
    location: { type: 'Point', coordinates: [-3.7, 40.3] },
    sports: [{ name: 'tenis', sportId: 'sport-1' }]
  };
  const fetchImpl = async (url, options = {}) => {
    requested.push({ url, options });

    if (options.method === 'POST' || options.method === 'PUT') {
      return {
        ok: true,
        json: async () => ({ data: installation })
      };
    }

    if (options.method === 'DELETE') {
      return {
        ok: true,
        json: async () => ({ status: 200, message: 'Instalación eliminada correctamente' })
      };
    }

    if (url.includes('/sports?name=tenis')) {
      return {
        ok: true,
        json: async () => ({
          data: [],
          pagination: { page: 1, limit: 5 }
        })
      };
    }

    if (url.includes('/sports')) {
      return {
        ok: true,
        json: async () => ({
          data: [{ id: 'sport-1', name: 'tenis', category: 'racket', environment: 'outdoor' }],
          pagination: { page: 1, limit: 5 }
        })
      };
    }

    if (/\/installations\/[^/?]+$/.test(url)) {
      return {
        ok: true,
        json: async () => ({ data: installation })
      };
    }

    return {
      ok: true,
      json: async () => ({ data: [installation], pagination: { page: 1, limit: 10 } })
    };
  };

  await mountInstallationsPage(root, { fetchImpl, confirmImpl: () => true });

  root.querySelector('select[name="catalogSportId"]').value = 'sport-1';
  root.querySelector('#installation-sport-add-selected').click();
  assert.match(root.querySelector('#installation-selected-sports').textContent, /tenis/);

  root.querySelector('input[name="sportSearch"]').value = 'tenis';
  root.querySelector('input[name="sportSearch"]').dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(requested.some(({ url }) => url.includes('osmKey=tenis')), true);

  root.querySelector('[data-add-sport-id="sport-1"]').click();
  assert.match(root.querySelector('#installation-selected-sports').textContent, /tenis/);

  root.querySelector('#installation-form input[name="name"]').value = 'Polideportivo Norte';
  root.querySelector('#installation-form input[name="type"]').value = 'sports_centre';
  root.querySelector('#installation-form input[name="city"]').value = 'Getafe';
  root.querySelector('#installation-form input[name="source"]').value = 'manual';
  root.querySelector('#installation-form input[name="longitude"]').value = '-3.7';
  root.querySelector('#installation-form input[name="latitude"]').value = '40.3';
  root.querySelector('#installation-form').dispatchEvent(
    new dom.window.Event('submit', { bubbles: true, cancelable: true })
  );
  await new Promise((resolve) => setTimeout(resolve, 0));

  const postRequest = requested.find(({ options }) => options.method === 'POST');
  assert.ok(postRequest);
  assert.deepEqual(JSON.parse(postRequest.options.body).sports, [{ name: 'tenis', sportId: 'sport-1' }]);

  root.querySelector('[data-installation-edit-id="507f1f77bcf86cd799439011"]').click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(root.querySelector('#installation-form input[name="name"]').value, 'Polideportivo Norte');
  assert.equal(root.querySelector('#installation-form input[name="type"]').value, 'sports_centre');
  assert.match(root.querySelector('#installation-form-status').textContent, /Editando instalación/);

  root.querySelector('#installation-form input[name="city"]').value = 'Madrid';
  root.querySelector('#installation-form').dispatchEvent(
    new dom.window.Event('submit', { bubbles: true, cancelable: true })
  );
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(requested.some(({ options }) => options.method === 'PUT'), true);

  root.querySelector('[data-installation-delete-id="507f1f77bcf86cd799439011"]').click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(requested.some(({ options }) => options.method === 'DELETE'), true);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { mountHomePage } from '../../public/js/home.js';

test('La pantalla de inicio renderiza la navegación principal y muestra el estado correcto de la API', async () => {
  const dom = new JSDOM(`
    <main id="home-page">
      <p id="api-status-text" class="status-text">Comprobando conexión con el backend...</p>
    </main>
  `);
  const root = dom.window.document.querySelector('#home-page');
  const fetchImpl = async () => ({
      ok: true,
      json: async () => ({ message: 'Sports Facilities API is running' })
    });

  await mountHomePage(root, { fetchImpl });

  assert.match(root.querySelector('#api-status-text').textContent, /API disponible/);
});

test('La pantalla de inicio muestra un mensaje de error si falla la comprobación inicial', async () => {
  const dom = new JSDOM(`
    <main id="home-page">
      <p id="api-status-text" class="status-text">Comprobando conexión con el backend...</p>
    </main>
  `);
  const root = dom.window.document.querySelector('#home-page');
  const fetchImpl = async () => {
    throw new Error('No se pudo comprobar el estado de la API.');
  };

  await mountHomePage(root, { fetchImpl });

  const statusNode = root.querySelector('#api-status-text');
  assert.match(statusNode.textContent, /No se pudo comprobar el estado de la API\./);
  assert.equal(statusNode.classList.contains('is-error'), true);
});

test('La pantalla de instalaciones permite filtrar y abrir el detalle', async () => {
  const { mountInstallationsPage } = await import('../../public/js/installations.js');
  const dom = new JSDOM('<main id="installations-page"></main>', { url: 'http://localhost/installations' });
  const root = dom.window.document.querySelector('#installations-page');
  const requestedUrls = [];
  const fetchImpl = async (url) => {
    requestedUrls.push(url);

    if (url.includes('/installations/inst-1')) {
      if (url.endsWith('/weather')) {
        return {
          ok: true,
          json: async () => ({
            data: {
              id: 'weather-1',
              installationId: 'inst-1',
              temperature: 23.2,
              condition: 'cielo claro',
              humidity: 41,
              windspeed: 2.4,
              queryDate: '2026-04-25T14:00:00.000Z'
            }
          })
        };
      }

      return {
        ok: true,
        json: async () => ({
          data: {
            id: 'inst-1',
            name: 'Polideportivo Norte',
            type: 'sports_centre',
            city: 'Getafe',
            source: 'manual',
            sports: [{ name: 'football' }],
            location: { type: 'Point', coordinates: [-3.7, 40.3] }
          }
        })
      };
    }

    if (url.includes('/installations')) {
      return {
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'inst-1',
              name: 'Polideportivo Norte',
              type: 'sports_centre',
              city: 'Getafe',
              sports: [{ name: 'football' }]
            }
          ],
          pagination: { page: 1, limit: 10 }
        })
      };
    }

    return {
      ok: true,
      json: async () => ({ message: 'Sports Facilities API is running' })
    };
  };

  await mountInstallationsPage(root, { fetchImpl });

  root.querySelector('input[name="city"]').value = 'Getafe';
  root.querySelector('input[name="sport"]').value = 'football';
  root.querySelector('#installations-filters').dispatchEvent(
    new dom.window.Event('submit', { bubbles: true, cancelable: true })
  );

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(
    requestedUrls.some((url) => url.includes('city=Getafe') && url.includes('sport=football')),
    true
  );

  root.querySelector('[data-installation-id="inst-1"]').click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(root.querySelector('#installation-detail').textContent, /Polideportivo Norte/);
  assert.match(root.querySelector('#installation-detail').textContent, /manual/);

  root.querySelector('[data-weather-installation-id="inst-1"]').click();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.match(root.querySelector('#installation-weather-result').textContent, /cielo claro/);
  assert.match(root.querySelector('#installation-weather-result').textContent, /23,2 °C/);
  assert.equal(
    requestedUrls.some((url) => url.endsWith('/installations/inst-1/weather')),
    true
  );
});
